# 哥飞新词机会评估：Music Generator 方向与 `game sound generator` 专项核查

调研日期：2026-10-23
数据快照：[2026-10-23-gefei-music-keywords-data.json](2026-10-23-gefei-music-keywords-data.json)

## 1. 核心结论与决策建议

1. **`game sound generator`（用户指定核查词）：暂缓独立新站，仅可作为游戏音频/音效内页或小试实验（信心：中）**
   - **是否新词**：**不是新词**。Google Ads 关键字规划师（美国英语口径）早在 2025-09 即有稳定搜索量；Google Trends（全球 12 个月按周）窗口起点 `2025-10-19` 相对热度即达 45，峰值 100 出现在 `2026-05-24`，最新完整周（`2026-10-11`）为 15（`2026-10-18` 周为 14，尚未走完，不能定性为最终定局），趋势面处于“过气/回落”阶段，且未出现在近两周哥飞新词批次库中。
   - **搜索量与竞争盘面**：哥飞版 KD（关键词排名难度，0–100，进前十口径）为 **18.7 / 100（极易）**，盘面实测最弱占位者为第 5 名 `audiofusion.com`（Ahrefs 域名权重 DR 16，折算约 17 个引用域），第 8 名为 `reddit.com` 帖子（内容真空信号），第 9 名为弱首页 `noisealchemy.com`（DR 30，体验分 17/100）。**但 KD 低只说明进前十竞争弱，不代表搜索量大**：Google Ads 美国月均搜索量仅 **10**（2025-09 至 2026-08 维持在 10–20/月；同族词 `game sound effect generator` 美国月均 10、`ai game sound generator` 美国月均 10、`game music generator` 美国月均 30、`ai game music generator` 美国月均 20）。前两名被经典免费 8-bit 网页合成器 `bfxr.net`（DR 59 首页）和 `sfxr.me`（DR 52 首页）占据，进前十容易但头部点击被免费免登录工具截流，体量过小，不支撑单独建站或高成本重开发。
2. **今日/近 7 天（`2026-10-17` 至 `2026-10-23`）Music Generator 方向批次新词：本轮无高搜索量、低难度且本站现有路由可直接复用的纯音乐生成新词（建议：以扩充已有视频配乐页或小试单内页为主）**
   - **純音乐/音频生成与工具候选**：
     - `suno v6`（批次 `2026-10-18T0235`）：美国月均搜索量 **320**（2025-09 为 20 → 2026-08 达 **590**，9 月数据在该词条尚未更新，不能读成需求消失），批次走势已从发布峰值回落（`-23%`），前两页 20 个专门页面全为官网 `suno.com` 与权威媒体。不建议建新站；若本站决定开放 KIE 的 Suno V6 接口，仅适合做 **Suno V6 提示词/在线体验内页**。
     - `ace-step 1.5`（批次 `2026-10-21T1558`）：开源本地/在线 AI 音乐生成模型（支持人声、歌词、翻唱、分轨），规划师美国口径返回“未收录”（**搜索量未证实，请用 Keyword Planner / Google Trends 自行核实后再立项**），批次热度仅 `GPTs×0.007` 且回落，已有 `ace-step.co` 排第 4。暂缓重开发工具页，最多做一篇开源音乐模型教程/对比内页。
     - `soundcraft artcraft`（批次 `2026-10-20T0257`）：ArtCraft 团队用 Rust 编写的开源 DAW（数字音频工作站，对标 Pro Tools，支持 WebAssembly 网页运行）。批次趋势上升中（`+120%`），规划师美国口径“未收录”（搜索量未证实）。用户意图为找开源软件下载/网页试用与对比，不是 AI 音乐生成器，可与此前评估的 `artcraft adobe` / `photocraft` 合并为一篇资讯/对比文章，不拆工具页。
     - `qwen3 tts` / `qwen3 tts demo`（批次 `2026-10-21T1558`、`2026-10-19T1430`）：开源语音合成与声音克隆模型，非音乐生成，HuggingFace 官方 Space 与 `qwen3tts.com` 已占位，暂缓。
   - **音乐驱动的 AI 视频/口型趋势候选（与 `easynanobanana.com` 现有定位更近）**：
     - `tip toe meme` / `tip toe imp` / `tiptoeing in my jordans meme`（最新批次 `2026-10-22T2031`、`2026-10-22T1727`）：围绕 Riff Raff 歌曲《Tip Toe Wing In My Jawwdinz》的侏儒怪踮脚舞 AI 视频梗。**本站已有 `/video/rumpelstiltskin-ai-video-generator`**，直接在现有页面文案、FAQ 与 Meta 中自然覆盖这些新出现的搜索变体，**不另拆新页**。
     - `hedra character 3`（今日最新批次 `2026-10-23T0826`）：音频/唱歌驱动的人物口型同步（Lip Sync）视频模型，美国月均搜索量 **140**（2026-09 为 **210**，CPC $5.15）。但属强品牌词（官网 `hedra.com` 霸屏），且本站受人物模块合规开关（`NEXT_PUBLIC_HIDE_PORTRAIT_MODULE`）与无音频上传链路限制，仅观察或做对比教程内页，不立项真人对口型工具页。

---

## 2. 数据范围、口径与计费说明

- **批次范围**：通过哥飞新词 API 读取 `2026-10-17T0253` 至 `2026-10-23T0826` 共 **51 个批次**，合计 **2,756 条记录**，按完整关键词字符串去重后为 **2,645 个独立关键词**；经音乐/音频/声音/唱歌正则初筛命中 188 条，人工结合 `brief.what/want/how` 剔除同名歌曲视听词、酒吧名、无关网页小游戏后保留 44 条核心相关记录，并交叉比对了 `2026-10-12` 至 `2026-10-18` 快照库（含 `mirelo sfx2.0`、`frogaudio` 等）。
- **市场与语言假设**：默认采用**美国英语（`gl=us`, `hl=en`）**核查 Google Ads 关键字规划师搜索量与哥飞版 KD；Google Trends 采用**全球（过去 12 个月按周）**核查相对热度。
- **指标口径红线**：
  - **数据截止月差异**：本次 `keyword_volume` 返回中，`game music generator`、`ai game music generator`、`game sound effect generator`、`hedra character 3` 数据已更新至 `2026-09`，而 `game sound generator`、`ai game sound generator`、`suno v6` 数据截止于 `2026-08`。**落后的是个别词的截止月，绝不能把缺失 2026-09 读成“9 月搜索量归零或需求消失”**。
  - **未收录与真空期**：`ace-step 1.5`、`soundcraft artcraft`、`qwen3 tts`、`mirelo sfx2.0` 在规划师中返回 `null`（未收录）。**未收录不等于没人搜**，搜索量未证实，立项前需结合 Keyword Planner / Google Trends 进一步核实。
  - **广告竞争度 ≠ SEO 难度**：规划师中的 `competition: LOW / MEDIUM` 为 Google Ads 广告竞价激烈程度，不代表自然搜索排名容易；自然排名竞争以哥飞版 KD（进前十口径）与 SERP 盘面为准。
  - **批次相对热度**：批次中的 `heat_ratio` 是相对参照词的比值（且规划师将 `GPTs` 并入 `GPT`，不可用规划师 `gpts` 数值乘以 `heat_ratio` 换算月搜索量）。
- **积分消耗记录**：本轮共消耗 **14 积分**（加载 `keyword` + `newwords` 方法论手册 3 积分、`game sound generator` 哥飞版 KD 精评 2 积分、11 词美国规划师搜索量批查 5 积分、`game sound generator` 谷歌趋势 12m 实时抓取 4 积分），账户剩余 **1,892 积分**。批次列表与批次详情读取不扣 SEO 积分。

---

## 3. 候选词与 `game sound generator` 证据总表

| 关键词族 | 来源批次 / 日期 | 地区/语言 | 需求与竞争证据（规划师美国月搜 / 哥飞版美国 KD / 趋势） | 本站已有页 | 建议动作 | 最小成本与未知项 |
| --- | --- | --- | --- | --- | --- | --- |
| **game sound generator**（支持词：`game sound effect generator`, `ai game sound generator`, `game music generator`, `ai game music generator`） | 用户指定核查（未进近两周新词批次） | US / EN（趋势为全球） | • `game sound generator`：US 月均 **10**（数据截至 2026-08，各月 10–20）；**美国 KD 18.7（极易）**，最弱占位第 5 名 `audiofusion.com`（DR 16，约 17 引用域），第 8 名 `reddit.com` 帖，第 9 名 `noisealchemy.com`（DR 30 首页，体验分 17）；全球 12m 趋势非新词，2026-05-24 峰值 100，10-11 周为 15（过气阶段）<br>• `game sound effect generator`：US 月均 **10**（截至 2026-09）<br>• `ai game sound generator`：US 月均 **10**（截至 2026-08）<br>• `game music generator`：US 月均 **30**（2026-09 为 **40**）<br>• `ai game music generator`：US 月均 **20**（2026-09 为 **20**，CPC $5.93） | 无专门音频页 | **暂缓独立建站；若验证 KIE 音效链路，仅合并不拆页做 1 个游戏音效与配乐生成内页（小试）** | 上游 KIE 已有 `ai-music-api/sounds`（支持 V6、`sound_loop`、`sound_tempo`），但本站无音频 API 路由、无试听/循环验收组件；待确认 KIE 单次音效积分成本与无人声稳定性 |
| **tip toe meme / tip toe imp / tiptoeing in my jordans meme / rumpelstiltskin tiptoe / is the rumpelstiltskin meme ai** | `2026-10-23T0826`<br>`2026-10-22T2031`<br>`2026-10-22T1727`<br>`2026-10-21T0255` | US / EN | • 上轮已核实 `rumpelstiltskin ai` 全球 2026-09 为 390，美国 KD 46.4（中等）；`tip toe in my jordans` 全球月均 2,400（原曲历史量占大头）<br>• 今日与昨日批次新增 `tip toe imp`（前两页仅 2 个专门页）、`tip toe meme`、`is the rumpelstiltskin meme ai`（回落 48%） | `/video/rumpelstiltskin-ai-video-generator` | **扩充已有页（不拆新页）** | 零后端开发成本；仅需在现有 Rumpelstiltskin 页面文案与 FAQ 补充 `tip toe imp` / `tip toe meme` 与 Riff Raff 配乐背景说明 |
| **suno v6** | `2026-10-18T0235` | US / EN | • US 月均 **320**（2025-09 为 20 → 2026-08 达 **590**，数据截至 2026-08）<br>• 批次趋势“已明显回落”（`-23%`），前两页 20 个专门页面全为 `suno.com` 官网及老站内页 | 无 | **暂缓工具页；若接入 KIE 音乐接口，仅可附带做提示词/对比内页** | 品牌导航属性极强，前排被官方垄断；本站未接入音频生成前端与存储链路 |
| **ace-step 1.5** | `2026-10-21T1558` | US / EN | • US 规划师：**未收录**（搜索量未证实，请用 Keyword Planner / Google Trends 自行核实后再立项）<br>• 批次 `heat_ratio=0.007`，回落 `-5%`，前两页 19 个专门页（`ace-step.co` 排 #4，GitHub/HF/YouTube 占前排） | 无 | **暂缓** | KIE 与 AISplice 均未提供 `ACE-Step 1.5` 托管接口；自行部署 GPU 成本高且搜索量未证实 |
| **hedra character 3 / hedra ai lip sync** | `2026-10-23T0826`<br>`2026-10-18T2035` | US / EN | • `hedra character 3`：US 月均 **140**（2026-09 为 **210**，CPC $5.15）<br>• 批次前两页 14 个专门页面，官网 `hedra.com` 多席位占位 | `/ai-pet-video/singing-cat-video`<br>`/ai-pet-video/singing-dog-video` | **暂缓真人页；保持现有宠物唱歌页** | 本站人物模块默认受 `NEXT_PUBLIC_HIDE_PORTRAIT_MODULE` 合规隐藏限制，且视频路由无外部音频文件上传字段 |
| **soundcraft artcraft** | `2026-10-20T0257` | US / EN | • US 规划师：**未收录**（搜索量未证实）<br>• 批次 `heat_ratio=0.099`，涨幅 `+120%`，前两页 5 个专门页面，官网 `getartcraft.com` / `soundcraft.live` 排第一 | 无 | **仅考虑与 ArtCraft/PhotoCraft 合并一篇资讯/对比博客，不做工具页** | 用户任务是找开源 Rust DAW 桌面/WASM 软件（Pro Tools 替代品），并非 AI 音乐生成 |
| **qwen3 tts / qwen3 tts demo / lalal ai voice changer / ai voice generator somali / genspark speakly** | `2026-10-21T2036`<br>`2026-10-21T1558`<br>`2026-10-20T1430`<br>`2026-10-23T0306` | US / EN | • `qwen3 tts` US 规划师：**未收录**（搜索量未证实），HF 官方 Space 与 `qwen3tts.com` 占位，趋势回落<br>• 其余词批次热度 `0–0.003` 且已明显回落 | 无 | **不做** | 属 TTS 朗读、变声或语音输入工具，与本站图像/视频定位无关，且品牌词/低热度无截流空间 |
| **incredibox sprunki shifted pyramixed / locutors sunrise incredibox / sprunked legacy / sprunkity / grays dreams / my singing cats demo** | `2026-10-23T0306`<br>`2026-10-22T0244`<br>`2026-10-21T0255`<br>`2026-10-20T0257` | US / EN | • 批次热度 `0–0.007`，长尾为 0，前两页被 `itch.io`、`fandom.com` 与 Sprunki 合集站占满 | 无 | **不做** | 用户意图是在线玩特定 HTML5 音乐混音同人模组，非 AI 音乐生成工具 |
| **raindance ai / bulin 47 ai trend** | `2026-10-22T0244`<br>`2026-10-20T0257` | US / EN | • `raindance ai` 较上轮继续大幅回落（`-58%`，`heat_ratio=0.014`，19 个专门页含 2 个专站首页）<br>• `bulin 47 ai trend` 继续回落（`-20%`，`heat_ratio=0.002`） | 无 | **维持暂缓** | 趋势已过峰值；双人海边对唱与街头说唱换人动作/音轨复刻超出现有单图 4 秒路由能力 |

---

## 4. `game sound generator` 深度拆解（为什么 KD 18.7 仍不建议重度投入？）

### 4.1 盘面与意图真相
- **前十盘面结构**：
  - **#1 `bfxr.net`（DR 59，首页，月流量 9.6 万，域龄 15.6 年）** 与 **#2 `sfxr.me`（DR 52，首页，月流量 14.1 万，域龄 11.2 年）**：两者都是免登录、零延迟、纯前端合成的经典复古游戏音效（Pickup/Coin, Laser/Shoot, Explosion, Powerup, Jump）网页工具，点按即响、一键导出 `.wav`。
  - **#3 `sfbgames.itch.io`（DR 92 内页，Chiptone）**：同样是免费网页合成器。
  - **#4 `elevenlabs.io`（DR 90 内页）**、**#6 `ludo.ai`（DR 48 内页）**：AI 文本生成音效（Text-to-SFX）页面。
  - **#5 `audiofusion.com`（DR 16 内页，月流量 6,698）**、**#8 `reddit.com` 帖子**、**#9 `noisealchemy.com`（DR 30 首页，注册 14 个月，体验分 17/100，停留仅 5 秒）**：弱占位者。
- **哥飞方法论判读**：
  - **进前十容易，进前三极难且流量池极浅**：按盘面实测，只要 DR 16–18（约 15–30 个引用域）就能挤掉第 5 名 `audiofusion.com`、第 8 名 Reddit 帖或第 9 名 `noisealchemy.com` 进入前十；**但钱和点击都在前三**，而前三名是免注册、毫秒级响应的免费 8-bit 合成器，且前十中所有站点的主力流量词都不包含 `game sound generator`。
  - **体量限制（搜索量缺口红线）**：Google Ads 美国口径下，`game sound generator`（月均 10）、`game sound effect generator`（月均 10）、`ai game sound generator`（月均 10）、`game music generator`（月均 30）、`ai game music generator`（月均 20）**五个词合计美国月均搜索量仅 80**。即便加上未收录长尾与非美地区，整体自然搜索天花板依然很低。

### 4.2 本站（`easynanobanana.com`）与上游 KIE 能力核对
- **上游 KIE 已具备的能力（已通过本机 `KIE_API_TOKEN` 实测目录与 `kie-game-music` 技能核实）**：
  - KIE 目录包含 **23 个音乐/音频模型**，其中直接对应游戏声音与配乐的有：
    1. `ai-music-api/sounds`（Suno Sounds API）：支持 `input.model` 为 `V6` / `V6_MINI` / `V6_WILD`，支持 `sound_loop`（循环开关）、`sound_tempo`（1–300 BPM）、`sound_key`（调式），适合生成游戏循环 BGM、环境音与音效。
    2. `ai-music-api/generate`：完整 AI 歌曲与纯音乐生成。
    3. 配套后处理：`ai-music-api/convert-to-wav-format`、`ai-music-api/separate-vocals`、`ai-music-api/generate-midi-from-audio`。
- **本站当前真实代码边界（文件存在/上游支持 ≠ 本站已开放）**：
  - 当前 `easynanobanana.com` 仅有图像接口（`src/app/api/generate-image/route.ts`）与短视频接口（`src/app/api/video/generate/route.ts`，固定 4 秒 480p，使用 `KIEVideoService` 和 `AISpliceVideoService`）。
  - **缺口**：本站没有 `/api/music/*` 或 `/api/sound/*` 路由，数据库无独立音频表（或需复用任务表），前端无波形播放器、无循环试听组件，也未核算 `ai-music-api/sounds` 单次调用的积分定价。
  - **产品匹配风险**：`ai-music-api/sounds` 是异步任务（提交 `createTask` → 轮询 `recordInfo` 约 15–60 秒返回 `audio_url`），且无 `duration` 精确秒数参数、无 `instrumental` 硬开关（需靠提示词写明 `instrumental, no vocals, no speech` 并人工试听验收）。若拿异步收费 AI 模型去硬刚 `bfxr.net` 的毫秒级免费按钮音效，用户体验（停留时间、跳出率）会像第 9 名 `noisealchemy.com`（停留 5 秒）一样崩盘。

---

## 5. 可验证的下一步与停止条件

1. **立即可做（零后端开发成本）**：
   - 在已有 `/video/rumpelstiltskin-ai-video-generator` 页面文案与 FAQ 中自然融入本周新词 `tip toe meme`、`tip toe imp`、`tiptoeing in my jordans meme`，承接 Riff Raff 配乐踮脚舞同义搜索意图。
2. **若你希望在 `easynanobanana.com` 或独立新站尝试游戏音乐/音效（小试方案与停止条件）**：
   - **合并单页定位**：不要拆多个薄页，若立项只做 **1 个合并内页**（例如 `/ai-game-music-sound-generator`），同时覆盖主词 `game music generator`（US 月均 30）与支持词 `ai game music generator`（US 月均 20）、`game sound generator`（US 月均 10）、`game sound effect generator`（US 月均 10）。
   - **定位差异化**：避开 8-bit 简单按钮音效（引导或说明与 Bfxr 的区别），主打 **“AI 游戏循环 BGM、Boss 战配乐与场景环境音（Loopable Game Ambience & BGM）”**，直接对应 KIE `ai-music-api/sounds` 的 `sound_loop: true`、`sound_tempo`、`sound_key` 参数优势。
   - **上线前样片验证与停止条件（建议实验阈值，非行业定律）**：
     - 先用 `kie-game-music` 流程对 5 类常见游戏场景（Fantasy RPG Town Loop、8-Bit Chiptune Action、Boss Battle Orchestral、Horror Dungeon Ambience、Victory Fanfare SFX）各做 2 次实测生成（共 10 次）。
     - **验收线**：10 次中至少 **8 次**无人声串音（无意外哼唱/说话）、首尾循环无明显爆音断层，且单次 KIE 成本可控。若无人声合格率低于 80% 或循环断层严重，**立即停止将其包装为“一键无缝游戏音效生成器”上线**。
