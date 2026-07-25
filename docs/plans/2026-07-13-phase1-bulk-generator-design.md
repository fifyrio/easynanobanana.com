# Phase 1 技术方案 — 批量生图 + 打包导出（/bulk-generator）

> 2026-07-13 · 对应 PRD_FACELESS_VIDEO_WORKFLOW.md §3 Phase 1
> 目标：多行 prompt → 服务端受控并发生图 → zip 打包下载。可独立上线收费；同时作为工作流第④步底层能力。

## 1. 设计约束（来自代码库现状）

- 生图是 **KIE 异步任务**：`KIEImageService.createPromptOnlyTask()` 立即返回 `taskId`，真正出图后 KIE 回调 `POST /api/kie/callback`；客户端 `GET /api/kie/task-status` 轮询兜底（30s 未回调则主动查 KIE）。
- task 元数据存 Cloudflare KV（`saveKIETaskMetadataKV`），成图后回调把图下载并 `uploadImageToR2`，落 `images` 表。
- **扣费当前非原子**（`select credits` → `insert credit_transactions`）。批量放大竞态 → Phase 1 引入 `deduct_credits_atomic` RPC。
- 限流 `imageLimiter` 是进程内存，多实例不可靠 → 批量并发控制放服务端 `batch_jobs` 计数，不依赖它。

## 2. 数据流

```
POST /api/bulk/images
  1. 鉴权（Bearer）+ 解析 prompts[]（或 fileUrl 拉 .txt）
  2. 逐行 moderation.screenPrompt（fail-closed，被拒行剔除并记录）
  3. deduct_credits_atomic(user, N*price, 'bulk_image')  ← 预扣总额，余额不足 402
  4. insert batch_jobs(status=pending, total=N, params={prompts,model,aspectRatio,price})
  5. 波次提交：并发 2-3 调 KIEImageService.createPromptOnlyTask
     每个 task 的 KV metadata 打标：{ batchId, idx, timestampSec? }
  6. 返回 { jobId }（不等出图）

POST /api/kie/callback   （扩展现有路由）
  - 成图后照旧下载→R2→images 表
  - 若 metadata.batchId 存在：原子 increment batch_jobs.done_items（失败则 failed_items + 记退款额）
  - 若 done+failed == total → 触发 finalize

finalize（内联于 callback 或独立 /api/bulk/finalize）
  - 拉该 batch 全部成功图（R2 key 列表在 params 或按 images.external_task_id 查）
  - 打 zip：文件名 {idx}_{timestampSec}s.png（无时间戳则 {idx}.png）
  - uploadBufferToR2 → result_url；status=completed|partial
  - 失败张数 * price → 正向 credit_transactions 退款

GET /api/bulk/:jobId
  - 读 batch_jobs → { total, done, failed, status, resultUrl? }
  - 前端轮询（复用现有 task-status 轮询节奏，2s 起，指数退避）
```

**并发控制**：不在客户端。服务端提交波次用简单 `p-limit(3)` 或手写信号量控制 `createTask` 提交速率。KIE 侧自身排队，出图靠回调，因此"并发"仅约束提交速率与瞬时未完成数（可选：未完成 > 上限时暂停提交下一波，靠回调驱动继续）。

## 3. 失败与重试

- **单张 KIE 失败**：callback 收到 fail → `failed_items++`，该张退款。可选自动重试 1 次（重投 createTask，复用同 idx，metadata 标 `retry:1`）。
- **提交阶段失败**（createTask 抛错）：立即计入 failed + 退款，不阻塞其余。
- **finalize 幂等**：`done+failed==total` 判定可能被并发回调触发多次 → finalize 前 `UPDATE batch_jobs SET status='running' WHERE id=? AND status='pending' RETURNING`，只有抢到的实例执行打包（乐观锁）。
- **卡住的 batch**：某 task 永不回调 → 复用 task-status 的 30s 兜底轮询；批级兜底 cron/懒触发：读 batch 内 pending task 主动查 KIE。

## 4. 扣费 RPC（新建）

```sql
CREATE OR REPLACE FUNCTION public.deduct_credits_atomic(
  p_user_id uuid, p_amount int, p_type text, p_description text
) RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_balance int;
BEGIN
  SELECT credits INTO v_balance FROM user_profiles WHERE id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'profile_not_found'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'insufficient_credits: have %, need %', v_balance, p_amount; END IF;
  INSERT INTO credit_transactions(user_id, amount, transaction_type, description)
  VALUES (p_user_id, -p_amount, p_type, p_description);
  RETURN v_balance - p_amount;
END $$;
```

> 前提：`user_profiles.credits` 由 credit_transactions 汇总/触发器维护（现状如此）。退款仍是正向 `insert credit_transactions`，无需锁。

## 5. 定价

- 5 credits/张，≥50 张按 4/张（params 里存 unitPrice，退款按同价）。
- 预扣：`N * unitPrice`。partial 完成时退 `failed * unitPrice`。

## 6. 接口契约

```ts
// POST /api/bulk/images
type BulkReq = {
  prompts?: string[];        // 或
  fileUrl?: string;          // .txt 一行一 prompt，前缀 [MM:SS] 可选
  model?: string;            // 默认 google/nano-banana
  aspectRatio?: string;      // 默认 '1:1'
};
type BulkResp = { success: true; data: { jobId: string; total: number; charged: number } }
             | { success: false; error: string; required?: number; available?: number };

// GET /api/bulk/:jobId
type JobResp = { success: true; data: {
  status: 'pending'|'running'|'completed'|'partial'|'failed';
  total: number; done: number; failed: number; resultUrl?: string;
}};
```

沿用现有响应结构 `{ success, data|error, required, available }`。

## 7. 前端 /bulk-generator

- 输入区：多行 textarea + 拖拽 .txt；解析预览（N 行、被 moderation 预判可疑的高亮，实际以服务端为准）。
- model / aspectRatio 选择器（复用现有工具页组件）。
- 提交 → 进度条（done/total，failed 红标）→ 完成后"下载 zip"按钮（走现有 download-proxy 模式避免 R2 CORS）。
- 未登录/积分不足 → 复用现有跳 /pricing 逻辑（401→登录，402→充值）。
- i18n：14 语言，SEO 元数据按 CLAUDE.md 英文无 /en 前缀规则。

## 8. 文件清单

新增：
- `supabase/migrations/xxxx_batch_jobs.sql`（batch_jobs 表 + deduct_credits_atomic + refund helper）
- `src/app/api/bulk/images/route.ts`（提交）
- `src/app/api/bulk/[jobId]/route.ts`（进度）
- `src/lib/bulk/batch-service.ts`（提交波次、finalize、退款；p-limit 并发）
- `src/lib/bulk/zip.ts`（拉 R2 图 + 打包 + 上传）
- `src/app/[locale]/bulk-generator/page.tsx` + 组件 + `messages/*.json` bulkGenerator 段

改动：
- `src/app/api/kie/callback/route.ts`：识别 `metadata.batchId` → 更新计数 + 触发 finalize
- `src/lib/cloudflare-kv.ts` 的 metadata 类型：加可选 `batchId, idx, timestampSec`

## 9. 边界 / 上限（显式，避免静默截断）

- 单次批量上限（如 200 prompt），超出 400 提示分批。
- prompt 单行长度上限。
- moderation 被拒行：不计费、在结果里列出被跳过的行号，不算入 total。
- zip 大小上限（Vercel 函数内存/超时）：大批量改流式打包或分卷；超阈值走后台再评估。

## 10. 测试计划（TDD）

单元：
- `deduct_credits_atomic` 并发扣费不超支（pgTAP / 集成）。
- 退款额 = failed * unitPrice。
- finalize 乐观锁：并发回调只打一次包。
- .txt 解析：`[MM:SS]` 前缀 → timestampSec；无前缀降级。
- moderation 剔除行不计费。

集成：
- 提交 3 prompt → mock KIE 回调 2 成 1 败 → status=partial，退 1 张，zip 含 2 图。
- 余额不足 → 402，不建 batch_jobs。

E2E（Playwright）：/bulk-generator 提交 → 轮询到 completed → 下载 zip。

覆盖率 ≥ 80%。
```
