# PRD: Faceless 视频创作工作流（Video Factory）

> 版本 v0.3 · 2026-07-13 · **架构修订：MCP-first，重计算下放用户本地，不购置 worker 服务器**
> 目标：把网站从"单点图片工具集合"升级为"脚本 → 成品视频"的一站式流水线，服务 faceless YouTube 创作者，形成"用我们的工具能赚钱"的营销闭环。

> **v0.3 修订说明（基于代码库核对）**：修正 6 处与现有代码不符 / 内部矛盾的问题。逐条见 §11 变更记录。

## 0. 架构决策（v0.2）

**原则：我们只做"计费的生成 API + MCP 编排接口"，所有重计算（转录、剪辑合成）由用户本地的 Claude Code / Codex + ffmpeg 完成。**

```
用户本地（Claude Code / Codex）              我们的服务端（现有 Vercel，零新增基础设施）
────────────────────────────              ────────────────────────────
加载官方工作流 Skill                    ←──  官网分发：MCP 安装命令 + API Key
写脚本（消耗用户自己的 Claude 额度）
调 MCP tts(script)                      ──→  TTS API：扣 credits，返 mp3 URL
本地场景时间戳（见 §3 Phase 3 分镜策略）     （无需 whisper：分镜优先用 TTS 返回的
逐场景生成图片 prompt                          字级时间戳，silencedetect 仅兜底）
调 MCP generate_image × N               ──→  现有生图管线：扣 credits
本地 ffmpeg 合成 mp4 + 字幕 + Ken Burns
本地产出成品文件夹（mp4/缩略图/标题标签）
调 MCP report_completion(stats)         ──→  记录漏斗完成事件（北极星指标可采集）
```

收益模型不变：每次图片/配音调用都走我们 API 扣 credits；Claude Code 充当免费的编排器和剪辑工。MCP 同时是获客渠道（对标 Higgsfield MCP 教程 26w 播放的打法）。

双轨并行：
- **MCP 轨**（高级用户）：完整工作流，本地成片，零服务器成本。
- **网页轨**（小白用户）：保留 Phase 1 批量生图 + 打包下载；合成留在本地教程或后续再评估。

---

## 1. 背景与市场洞察

来自 4 个头部教程视频（合计 30w+ 播放）的完整转录分析（转录文件见 downloads 文件夹）：

| 来源 | 验证的工作流 | 暴露的痛点 |
|---|---|---|
| Stickman 频道教程（$77k/月） | 配音优先 → 停顿检测出时间戳 → 逐句生成图片 prompt → Nano Banana 2 批量生图 103 张 → 按时间戳剪辑 | 官方无批量生图，需自制 Chrome 插件 hack Google Flow；时间戳检测要单独用 FoziScribe；剪辑对齐全手动 |
| Shorts 教程（$24.9k/月） | Claude + vidIQ 连接器做竞品分析 → 选题 → viblo.ai 半自动成片 | 工具链分散在 4+ 个产品 |
| Shorts 全指南 | 利基研究 → 脚本 → TTS → CapCut 剪辑 | YouTube 拒绝"模板化批量 AI 内容"变现，必须有转化价值 |
| Higgsfield MCP 教程（$39.5k/月） | 两句话 prompt → 全片自动生成（分镜/配音/音乐/缩略图×3/标题标签） | 体验天花板，但按订阅收费且不可控 |

**结论**：用户要的不是又一个生成器，而是一条不用离开网站的流水线。我们已有 80% 的基础设施（生图 API、KIE Seedance 管线、credit 扣费、R2 存储），缺的只是编排层。

## 2. 产品形态

向导式流水线，单页六步，每步产出可下载、可回退重做：

```
① 选题/脚本 → ② 配音(TTS) → ③ 自动分镜(时间戳) → ④ 批量生图 → ⑤ 时间线预览/单张重生成 → ⑥ 导出（素材包 zip / 一键合成 mp4）
```

核心体验原则：
- 每一步默认"一键继续"，高级用户可编辑中间产物（脚本、prompt、时间戳均可改）。
- 全流程异步任务 + 轮询/回调，复用现有 KIE 任务模式（KV/R2 存 task metadata + `/api/kie/callback` webhook + `/api/kie/task-status` 轮询兜底）。
- 任何一步失败只重试该步，不作废整个项目。

## 3. 分阶段范围

### Phase 1 — 批量生图 + 打包导出（1-2 周，可独立上线收费）
- 输入：多行 prompt 文本框 / 上传 .txt（一行一个，兼容 Claude 生成的 prompt 文件格式）。
- 逐条调用现有 `generate-image` 管线（服务端队列，控制并发 2-3，失败自动重试 1 次）。
- 输出：zip 包，文件名 `{序号}_{时间戳}s.png`（时间戳可选，来自 prompt 行前缀 `[MM:SS]`）。
- 独立入口页 `/bulk-generator`，同时作为工作流第④步的底层能力。
- 详细技术方案见 `docs/plans/2026-07-13-phase1-bulk-generator-design.md`。

### Phase 2 — TTS API + API Key 体系（约1周）
- TTS：接 KIE 音频模型或 MiniMax/Fish Audio，多音色，输出 mp3 存 R2，按分钟扣 credits。**优先选返回字级/句级时间戳的 provider**（供 Phase 3 分镜用，避免依赖脆弱的 silencedetect）。
- API Key 签发页（`/settings/api-keys`）：key 绑定用户账号，走现有 credits；哈希入库、可吊销、显示用量。
- 安全：API Key 调用须走**持久化速率限制**（现有 `imageLimiter` 是进程内存实现，serverless 多实例下不可靠，MCP 高频调用必须换 Upstash/Redis 或 DB 计数），并支持 per-key 日/月用量上限。

### Phase 3 — MCP Server + 工作流 Skill（1-2 周，营销爆点）
- 薄 MCP server（Streamable HTTP，托管在现有 Vercel 或 Cloudflare Workers），工具即现有 API 的包装：
  `generate_image` / `batch_generate_images` / `tts` / `list_voices` / `get_credits` / `generate_thumbnail` / `report_completion`。
- 官方工作流 Skill（Markdown 文件，官网可下载 / npx 一键安装）：教 Claude Code 完整流程——写脚本 → 调 tts → 本地出场景时间戳 → 逐场景写 prompt → 批量调 generate_image → 本地 ffmpeg 合成 1080p mp4（Ken Burns + 字幕）→ 输出成品文件夹（mp4 + 缩略图×3 + 标题/描述/标签）→ 调 `report_completion` 上报漏斗完成。
- **分镜策略（分层，避免单点脆弱）**：
  1. 首选：TTS provider 返回的字级/句级时间戳，直接映射脚本句 → 场景边界（最稳）。
  2. 兜底：`ffmpeg -af silencedetect=noise=-35dB:d=0.45` 检测停顿；停顿数与句数不符时退回按句均分时长。
  3. 参数可在 Skill 里按音色调（不同 TTS 停顿不均）。
- 文档落地页 `/mcp`：安装命令、Claude Code / Codex / Claude Desktop 三种接入方式。

### Phase 4 — 增值档位（后续迭代）
- 场景升级为动态：MCP 加 `image_to_video` 工具，走现有 Seedance 管线（`KIEVideoService`），按场景计费。
- 竞品频道分析选题（对标 vidIQ 玩法）。
- 网页版一键合成（若数据证明小白轨需求强，再评估 worker 成本）。

## 4. 数据库设计

复用：`user_profiles.credits`、`credit_transactions`、`images`。

> **现状核对**：代码库中**不存在** `deduct_credits_for_image` / `deduct_credits_for_video` RPC。现有扣费逻辑是**非原子**的：`generate-image` 路由先 `select credits`，再 `insert credit_transactions(amount=-5)`（`user_profiles.credits` 由 credit_transactions 触发器/汇总维护）。读-判-写之间存在竞态，且插图失败时不回滚。批量任务放大这个问题（一次几十张），因此 Phase 1 应引入一个真正的原子扣费 RPC（见下），而非"复用现有 RPC"。

MCP-first 后无需 workflow_projects/scenes 表（项目状态活在用户本地文件夹里）。新增两张表：

```sql
-- API Key（MCP 与程序化调用的凭证）
CREATE TABLE public.api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  key_hash      text NOT NULL UNIQUE,    -- 只存哈希（sha256），明文仅创建时显示一次
  name          text,
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- 通用批量任务（网页版批量生图 + MCP batch 工具共用）
CREATE TABLE public.batch_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  -- 无 workflow_projects 表（MCP-first）；如需分组用自由文本，不加外键
  project_ref     text,
  job_type        text NOT NULL,           -- bulk_image | tts | compose
  status          text DEFAULT 'pending',  -- pending | running | completed | failed | partial
  total_items     int DEFAULT 0,
  done_items      int DEFAULT 0,
  failed_items    int DEFAULT 0,
  params          jsonb DEFAULT '{}',
  result_url      text,                    -- zip / mp3 / mp4
  credits_charged int DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

新增 RPC（**新建原子扣费函数，非复用**）：`deduct_credits_atomic(p_user_id, p_amount, p_type, p_description)` —— 在单事务内 `SELECT ... FOR UPDATE` 锁行、校验余额、插入 `credit_transactions`，余额不足则 raise。批量任务预扣总额，失败部分按张数退款（正向 credit_transactions）。现有 `generate-image` 路由后续也应迁移到该 RPC 以消除竞态。

## 5. API 设计

### 5.1 REST API（网页轨 + MCP 底层共用）

沿用现有约定：鉴权（网页 Bearer token / MCP `X-API-Key`）、`{ success, data | error, required, available }` 响应结构。

```
POST /api/bulk/images        批量生图 { prompts: string[] | fileUrl, model, aspectRatio }
GET  /api/bulk/:jobId        批量任务进度 { total, done, failed, resultUrl? }
POST /api/tts                { text, voiceId } → { audioUrl, durationSec, creditsDeducted }
GET  /api/tts/voices         音色列表
POST /api/keys               创建 API Key（网页登录态）；GET 列表 / DELETE 吊销
```

### 5.2 MCP Server 工具定义

托管式 MCP（Streamable HTTP，部署在现有 Vercel 路由 `/api/mcp` 即可），鉴权用 API Key：

| 工具 | 参数 | 说明 |
|---|---|---|
| `generate_image` | prompt, aspectRatio, model? | 单张，返回 URL，扣 credits |
| `batch_generate_images` | prompts[], aspectRatio | 内部走 batch_jobs，返回 jobId；配套 `get_batch_status` |
| `tts` | text, voiceId | 返回 mp3 URL + 时长 + 字级时间戳（若 provider 支持） |
| `list_voices` | - | 音色列表 |
| `generate_thumbnail` | title, style, count=3 | 复用 ai-thumbnail-maker 管线 |
| `get_credits` | - | 余额查询（Skill 用它做开工前预检） |
| `report_completion` | sceneCount, durationSec, creditsSpent | 上报本地成片完成，供北极星漏斗采集 |

### 5.3 工作流 Skill（分发给用户的本地编排逻辑）

一个 SKILL.md（+ 辅助脚本），官网下载或 `npx easynanobanana-skill install`。定义 Claude Code 的执行步骤：

1. 询问选题/利基 → 写脚本（用户本地 Claude 完成，不耗我们成本）。
2. 调 `tts` 生成配音，下载到项目文件夹（保留返回的时间戳 JSON）。
3. 分镜：优先用 TTS 时间戳映射句子 → 场景；无时间戳则 `ffmpeg silencedetect` 兜底 → `scenes.json`（时间戳+文本）。
4. 逐场景生成图片 prompt（全局风格指令注入），调 `batch_generate_images`，下载图片按 `{idx}_{start}s.png` 命名。
5. 本地 ffmpeg 合成：1080p、zoompan 3% 缩放、按时间戳硬切、音轨 -14 LUFS、可选烧字幕。
6. 调 `generate_thumbnail` ×3，生成 title/description/tags 文本，全部落到 `output/` 文件夹。
7. 失败场景单张重试；结束时调 `report_completion` 并报告 credits 消耗。

实现要点：
- 无需 worker 服务器：转录/合成全部在用户本地；服务端只剩现有 serverless 生图/TTS。
- 批量生图并发控制在服务端 batch_jobs 里做（并发 2-3、失败退款），MCP 端只轮询。
- Codex 用户同样适用：MCP 标准协议 + 同一份 Skill 文本。

## 6. Credit 定价建议

现有锚点：生图 5 credits/张、Seedance 视频 100 credits/条。

| 项目 | 定价 | 依据 |
|---|---|---|
| 批量生图 | 5 credits/张（≥50 张按 4/张） | 与单张一致，量大微折促批量 |
| TTS 配音 | 10 credits/分钟 | API 成本极低，按分钟直觉计费 |
| 分镜/合成 | 免费（用户本地算力） | 成本为零且降低上手门槛；价值靠生图/TTS 消耗兑现 |
| 缩略图 ×3 | 15 credits | 复用现有生图定价 |
| 场景升级动态（Seedance） | 60 credits/场景（5s） | 对齐现有 100/条的单条视频定价 |
| 参考消耗（10 分钟视频 ≈100 场景） | ≈ 515 credits | 100 张图 400（折扣价）+ TTS 100（10 分钟×10）+ 缩略图 15 |

> 注：100 场景 / 10 分钟 ≈ 每场景 6s，偏密；实际多为 60–90 场景，消耗按比例下调。

失败退款：批量任务按失败张数自动退，复用现有 refund txn 模式（正向 credit_transactions）。MCP 调用与网页共用同一 credits 池。

## 7. 营销联动（Demo 视频脚本要点）

主视频结构照抄 Higgsfield MCP 教程（26w 播放已验证）：

1. 钩子：找到一个月入 $X 的 faceless 频道 → "我用 AI 复刻它的**工作流**"（强调流程效率，不承诺收益）。
2. 接入：官网复制 MCP 安装命令 → Claude Code 连接 → 填 API Key（全程 <2 分钟，镜头实拍；含 ffmpeg 前置安装提示）。
3. 一句话下单："按这个参考频道风格，做一条 5 分钟视频" → 实时展示 Claude Code 依次：写脚本 → 调我们 TTS → 本地检测停顿分镜 → 批量调我们生图 → 本地 ffmpeg 合成。
4. 对比段：火柴人教程要 5 个工具 + Chrome 插件 + 手动剪辑对齐 → 我们一条 prompt。
5. 成品文件夹展示：mp4 + 3 张缩略图 + 标题/描述/标签 → 直接上传 YouTube。
6. 结尾：注册送试用 credits。

辅助内容：Stickman 式网页轨教程（批量生图页）服务不用命令行的观众；两条视频互相引流。

发布渠道：YouTube 长视频 + 拆成 Shorts；SEO 落地页 `/faceless-video-generator` 吃 "faceless youtube channel / ai video workflow" 词。

## 8. 合规红线

- YouTube 明确拒绝"模板化批量、无转化价值"的 AI 内容变现（转录 v3 03:00 段）。产品文案强调"原创脚本 + 独特画风"，不承诺"全自动量产赚钱"。
- Demo 视频中收益数字只引用公开案例，不做收益承诺；钩子话术聚焦"工作流复刻"而非"收入复刻"。
- TTS 音色使用有商用授权的 provider 音色。
- API Key 泄露风险：强制持久化速率限制 + per-key 用量上限 + 异常用量告警（生图有真实成本，刷量必须挡）。

## 9. 里程碑

| 周 | 交付 |
|---|---|
| W1-W2 | Phase 1：`deduct_credits_atomic` RPC + batch_jobs 表 + /api/bulk + /bulk-generator 页上线 |
| W3 | Phase 2：TTS API + api_keys 表 + Key 管理页 + 持久化限流 |
| W4-W5 | Phase 3：MCP server（/api/mcp）+ 工作流 Skill + /mcp 文档落地页 |
| W6 | 录制 demo 视频（对标 Higgsfield 教程结构）、SEO 落地页、发布 |

## 10. 成功指标

- 北极星：完成整条流水线（到 `report_completion`）的项目数/周。
- 辅助：批量生图张数、流水线完成率（①→⑥漏斗，⑥ 靠 `report_completion` 采集）、credit 消耗中工作流占比、demo 视频带来的注册转化。

## 11. 变更记录（v0.2 → v0.3）

| # | 问题 | 严重度 | 修正 |
|---|---|---|---|
| 1 | `batch_jobs.project_id` 外键引用已被删除的 `workflow_projects` 表（§4 自相矛盾） | HIGH | 去掉外键，改自由文本 `project_ref` |
| 2 | 声称"复用现有 `deduct_credits_for_image/video` RPC"，代码库中不存在该 RPC；真实扣费是非原子 select-then-insert，有竞态 | HIGH | 明确新建 `deduct_credits_atomic`（FOR UPDATE 锁行），批量场景必须原子 |
| 3 | 分镜完全依赖 `silencedetect`，TTS 停顿不均时场景漂移 | HIGH | 分层：优先 TTS 字级时间戳，silencedetect 兜底，再兜底按句均分 |
| 4 | 北极星"流水线完成数"不可采集（本地成片不回传） | MEDIUM | 加 MCP `report_completion` 工具上报漏斗尾部 |
| 5 | API Key 高频调用套用进程内存 `imageLimiter`，serverless 多实例失效 | MEDIUM | 改持久化限流（Upstash/Redis/DB）+ per-key 上限 |
| 6 | 营销钩子"20 分钟复刻收入"与 §8 合规红线冲突 | MEDIUM | 钩子改"复刻工作流"，去收益承诺 |
