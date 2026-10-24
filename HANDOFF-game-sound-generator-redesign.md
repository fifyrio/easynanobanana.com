# HANDOFF：/game-sound-generator 页面重设计 + 路由迁移

日期：2026-10-23　状态：**已全部执行完成（路由迁移 + 双栏重设计 + KIE/AISplice 双 Provider + 14 语言文案 + 构建验证）**
完整分析与方案见：`/Users/shenhongmei/.gemini/antigravity/brain/de447f9f-2fd4-4b65-bb3e-9d4a24dce14d/game-sound-generator-redesign.md`

## 1. 背景
用户反馈 `/game-sound-generator` 看不懂、不知道怎么操作，要求按行业最佳实践重设计，并评估路由设计是否合理。

## 2. 关键文件
| 文件 | 作用 |
|------|------|
| `src/app/[locale]/game-sound-generator/page.tsx` | 服务端页面：metadata、JSON-LD、hero、SEO 内容、FAQ、related |
| `src/components/sound/GameAudioGenerator.tsx` | 客户端工作台（1157 行单文件）：模式、表单、轮询、结果网格 |
| `src/components/sound/LoadSoundPresetButton.tsx` | 页面内"载入示例"按钮（通过自定义事件通知生成器） |
| `src/lib/nav-data.ts` | 导航数据；音频工具当前在 Image 菜单 "3D & Motion" 分组（约第 127 行） |
| `src/data/game-sound-samples.json` | 示例音频数据（R2 托管） |
| `messages/*.json` → `gameSoundGenerator` 命名空间 | 所有文案；en.json 约第 16165 行；导航文案在 `nav.dropdown.gameSoundGenerator` |
| `src/app/api/sound/generate`、`task-status` | 后端接口（无需改） |
| `src/lib/kie-api/kie-sound-service` | `GameAudioMode` / `DurationHint` / `SoundKey` 类型定义 |

## 3. 现状要点（已核实）
- 8 个模式：sound-effects、ambiance-loops、music、audio-remix、human-voice、non-human-voice、speech-clone、speech-preset。
- 请求体：`prompt, mode, durationHint(auto|5|10), soundLoop, soundTempo, soundKey`；轮询每 4s，最多 45 次。
- 生成结果与示例合并到同一网格；用户记录存 localStorage（`enb_game_sound_favorites_v1`、`enb_game_sound_history_v1`，最多 24 条）。
- 未登录点击 Generate 才触发 `signInWithGoogle()`。
- 图像工具路由 `/ai-image-effects/*`，视频 `/video/*`，音频在根路径（不一致）。

## 4. 主要 UX 问题（摘要）
无操作顺序；Generate 离输入区远且与素材库控件混排；8 模式藏在下拉；时长用滑块、Loop 无解释；Tempo/Key 位置错位且对所有模式显示；hero 含内部 API 名与术语；结果在折叠线下；积分信息重复；小字号低对比；等待无进度；示例 chip 不同步时长/BPM/Key。

## 5. 目标设计
- **布局**：压缩 hero → 双栏工作台（左 Create，右 Results）→ 下方保留 SEO 内容。
- **左栏**：① 类型选择（4 张卡：SFX / Ambience Loop / Music / Voice，Voice 二级选项，Remix 放 More）→ ② 描述 + 匹配类型的示例 chip（点击同步全部参数）→ ③ 选项（时长分段按钮；Loop 复选框带说明；BPM/Key 折叠在 Advanced，仅 Music/Loop 显示）→ 粘性底栏 Generate + "5 credits · 2 variations · 余额"。未登录按钮显示 "Sign in to generate"。
- **右栏**：空态=可试听示例卡；生成中=骨架卡+阶段文案(+可取消)；结果卡=波形/进度播放、下载 MP3、♥、Copy prompt、Regenerate；标签页 This session / Favorites / Examples 取代 Filter Grid。
- 移除 Select Multiple（除非加 ZIP 批量下载）。
- 视觉：白底卡片，仅主按钮用品牌黄；正文 ≥14px、辅助 ≥12px，对比度 ≥4.5:1；`role=tablist`、`aria-pressed`、键盘可达；移动端固定底部 Generate。
- 移除用户可见文案中的 "Suno / ai-music-api"，技术说明移至 About 区。

## 6. 路由方案（用户已确认迁移）
- 新路由 `/audio/game-sound-generator`，旧 `/game-sound-generator` **301** 到新地址（含各 locale 前缀）。
- 顶栏新增 **Audio** 下拉；从 "3D & Motion" 分组移除。
- 同步更新：`PATH` 常量、canonical/hreflang、sitemap、`BreadcrumbSchema`（Home › Audio › Game Sound Generator）、其他页面对该 URL 的内链（`grep -rn "game-sound-generator" src messages content`）、首页入口、LoadSoundPresetButton 若依赖锚点。
- `/api/sound/*` 与 localStorage key 保持不变。
- 备选（成本最低）：保留 URL，仅修正导航归类。

## 7. 已确认的决策（2026-10-23）
1. **路由迁移**到 `/audio/game-sound-generator`（含 301）。
2. **移除多选**（Select Multiple）。
3. **Provider**：保留 KIE，**另外新增 AISplice 作为第二个 provider**（不是替换）。
4. **默认 provider 仍为 KIE**；AISplice 仅作为可选的第二通道，不改变 KIE 的默认行为。
5. Remix / Speech-clone / Speech-preset 用户认为需要额外输入，但两个 provider 目前都不支持，见第 8 节。

## 8. Provider 设计：KIE + AISplice

### 8.1 现状
- KIE：`src/lib/kie-api/kie-sound-service.ts`，`https://api.kie.ai/api/v1/jobs`，模型 `ai-music-api/sounds`（Suno V6 Sounds），env `KIE_API_TOKEN`。支持 `sound_loop`、`sound_tempo`、`sound_key`。
- 已有 AISplice 视频集成可参考：`src/lib/aisplice-api/aisplice-video-service.ts`，`/api/video/generate` 里有 `provider?: 'kie' | 'aisplice'` 切换模式，`/api/video/task-status` 里有对应分支。

### 8.2 AISplice Suno 音乐接口（来自用户提供的 PDF，仅此一页）
- `POST https://www.aisplice.store/v1/music/generations`，Bearer API key，请求头 `Idempotency-Key: <uuid>`，异步任务。
- Body：`{ model: "Suno", prompt, operation: "music", version: "v6", custom: false, instrumental: false }`。文档注明 "Only options published for this model are shown"：目前**只公布** `operation=music`、`version=v6`。
- 轮询：`GET /v1/music/tasks/{taskId}`，状态 `completed|succeeded|success` 为成功，`failed|failure|cancelled|canceled` 为失败，建议间隔 3s。
- 取结果：`GET /v1/music/tasks/{taskId}/content` 返回 JSON（字段结构 PDF 未给出，**实现时先打一次真实请求确认 clips/audio_url 字段**）。
- 价格：**$0.07 / call**。
- ⚠ PDF 未公布 `sound_loop`、`sound_tempo`、`sound_key`、参考音频、克隆、混音等字段；`custom`/`instrumental` 为布尔值，其余含义见 aisplice 完整文档（PDF 里只有 "Step-by-step in the docs" 链接，未包含）。

### 8.3 能力矩阵与 UI 影响
| 模式 | KIE | AISplice |
|------|-----|----------|
| Music | ✅ | ✅（`instrumental: true` 可对应"无人声"） |
| Sound Effects | ✅（prompt 前缀） | ⚠ 仅能用 prompt 前缀模拟，效果需实测 |
| Ambience Loop | ✅（`sound_loop`） | ❌ 无原生循环参数，只能靠 prompt，不保证无缝 |
| BPM / Key | ✅ | ❌ |
| Voice / Clone / Preset / Remix | ❌ 仅 prompt 前缀，非真实能力 | ❌ |

结论：
- Provider 选择放在**高级选项**里（或按类型自动选），UI 需根据 provider 隐藏不支持的控件（Loop、BPM、Key），并在 Loop 不可用时给出说明。
- **默认 provider 建议仍是 KIE**（功能全）；AISplice 作为备用/低成本 Music 通道。是否由用户可选，还是服务端按成本/故障自动 fallback，需要产品决定。
- Remix / Clone / Preset：两个 provider 都不具备真实能力，**本轮 UI 隐藏**，等有支持的接口后再加输入区（上传音频/选声音）。Voice 暂时也只保留 prompt 驱动的 human/non-human 两项，并避免使用 "clone" 这类误导性文案。
- 积分：现在固定 5 credits / 次（2 个变体）。AISplice 成本 $0.07/次，需确认其返回的变体数量，再决定是否沿用 5 credits。

### 8.4 实现要点
- 新增 `src/lib/aisplice-api/aisplice-music-service.ts`（参照视频 service）：`createTask`、`getTaskStatus`、`getContent`，带 `Idempotency-Key`；env 复用视频所用的 AISplice key（查看 `aisplice-video-service.ts` 里读取的变量名）。
- 抽一个统一接口 `SoundProvider`（`createTask(opts) -> {taskId}`、`getTaskStatus(taskId) -> {state, clips}`），KIE 与 AISplice 各自实现，`NormalizedSoundClip` 作为统一输出。
- `/api/sound/generate` 增加 `provider: 'kie' | 'aisplice'`（服务端校验并拒绝不支持的组合，如 aisplice + loop）；`/api/sound/task-status` 需要知道 provider，可把 provider 编码进 taskId 前缀或作为 query 参数；扣费与失败退款逻辑保持与现有一致。
- 前端沿用同一轮询逻辑，`task-status` 返回结构不变。

### 8.5 未决项与接手人默认做法（无需再等用户回复）
- Provider 选择方式：默认**仅服务端控制**（环境变量 `SOUND_PROVIDER=kie|aisplice`，缺省 `kie`），UI 不暴露选择器；以后要开放再加。
- 积分：沿用 **5 credits / 次**；若 AISplice 实测返回变体数与 KIE 不同，再调整并回报用户。
- Remix / Clone / Preset：UI 隐藏，后端 `GAME_AUDIO_MODES` 先保留以兼容旧数据。

## 9. 实施步骤
1. 读 `/api/sound/generate`、`task-status`（扣费/退款逻辑）与 `aisplice-video-service.ts`；用真实请求确认 AISplice `/content` 返回结构。
2. 路由迁移：移动页面目录、`next.config.js` redirects、nav-data + Header（Audio 下拉）、sitemap、面包屑、内链。
3. 拆分 `GameAudioGenerator`：`ModeTabs`、`PromptPanel`、`OptionsPanel`、`ResultsPanel`、`TrackCard`，保留现有生成/轮询/收藏逻辑与 storage key。
3b. 新增 AISplice provider（见第 8 节），UI 按 provider 隐藏不支持的控件；隐藏 Remix/Clone/Preset 与多选。
4. 精简 hero 并更新文案：en 为准，同步 `messages/` 下所有 locale，新增键需全部补齐。
5. 验证：`npm run build` / lint；桌面与移动；未登录、积分不足（402）、失败、超时、成功五种状态；检查 301 与 hreflang；示例 chip 参数同步。

## 10. 注意事项
- 页面是 SEO 页面（FAQ/WebApplication JSON-LD），保留 `#generator`、`#how-title` 等锚点或同步更新引用。
- 仓库中另有 `HANDOFF-backlink-work.md` 等外链工作，修改 URL 后需检查 backlink 文档/提交记录中是否引用旧地址。
- 现有 i18n 与 `Link`（`@/i18n/routing`）用法需沿用；`page.tsx` 中 `localPath` 对 `en` 不加前缀。
