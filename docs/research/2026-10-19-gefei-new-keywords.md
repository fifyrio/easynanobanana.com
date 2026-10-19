# easynanobanana 新词内页机会评估

调研日期：2026-10-19。

## 决策

优先新增 Nano Banana 2.1 图像生成与编辑工具页，并完善已有 Burning Bridges 页；Rumpelstiltskin 作为下一项效果试验，通过样片验证后上线一页；Bulin 47 暂列下一轮；Navratri 当前不赶工工具页。本轮没有证据支持批量发布一组高搜索量、低难度、现有能力直接可用的工具页。

## 数据与口径

使用用户指定的新词发现 API，经 MCP keyword_batches / keyword_batch 查询。读取 2026-10-12 至 2026-10-18 的 51 个批次，共 3,288 条记录，按完整字符串去重为 2,979 个关键词。只代表这段时间可访问的批次，不代表全部历史库。数据同时含 new 和 resurgence，不能都称为刚出现的新词。

完整批次清单、筛查索引、候选原始记录、3 份难度原文及搜索量响应见 [数据快照](2026-10-19-gefei-new-keywords-data.json)。

搜索量查询为全球（返回 hl=all）；哥飞版 KD 为美国英语排名难度，0–100。两者不是同一地区的结论。KD 缓存日期分别为 Rumpelstiltskin 10 月 15 日、Navratri 10 月 17 日、Bulin 10 月 18 日，不是即时排名。批次趋势指标未披露完整地区和涨幅窗口，不用于推导搜索量或跨词比较。

收费合计 29 积分：方法论 3、三个精评共 6、十四词全球搜索量批查 20。返回余额 1,971；之后未继续收费。新词批次接口不额外扣 SEO 积分。Google Ads 的 LOW 是广告竞争，不能解释为自然排名容易。

| 关键词 | 全球规划师数据 | 美国英语 KD | 建议 |
| --- | --- | --- | --- |
| rumpelstiltskin ai | 平均 40；2026-08 为 50，09 为 390 | 46.4，中等 | 有条件小试效果页 |
| bulin 47 ai trend / bulin 47 trend ai | 未收录 | 前者 37.5，容易 | 需求与效果验证后再立项 |
| nano banana 2.1 | 平均 50；2026-09 为 260 | 未查 | 优先工具页，配套指南 |
| burning bridges ai | 平均 70；2026-09 为 140 | 未查 | 优化已有页 |
| navratri prompt | 平均 260；2026-09 为 1,000 | 61.2，困难 | 节庆内容可小试，工具页暂缓 |
| hotel lobby ai | 平均 10；数据仅到 2026-08，为 10 | 未查 | 暂缓 |
| artcraft adobe / adobe artcraft | 未收录 | 未查 | 只考虑一篇介绍/对比文章 |
| chained together ai drama | 未收录 | 未查 | 排除当前生成器立项 |

未收录不等于没人搜；未更新月份不等于需求消失。平均值会稀释刚起量的需求。tip toe in my jordans 平均 2,400、2026-09 为 2,400，但历史一直有量，是歌曲词，不能全部算作 AI 制作需求。

## 页面方案

### 1. Rumpelstiltskin AI：小试，信心中等

候选路径：/video/rumpelstiltskin-ai-video-generator。
主主题 Rumpelstiltskin AI；支持词 rumpelstiltskin tiptoe、tiptoeing meme、AI video generator 同页覆盖，不另拆页。完整 generator 修饰词未收录，不能声称有已确认搜索量。

用户任务是把自己的图片变成踮脚舞视频。首屏展示真实生成样片、长度、质量和价格，接上传、预设、生成、下载。正文提供来源解释和简短 FAQ。

已观察：公开搜索有多个专门生成器，竞争已形成。哥飞缓存中有低权重年轻站占位，但排名靠后不代表有可观流量，更不保证我们的内页进前三。竞品可见 8 秒输出、场景选择和付费入口，均属其产品自述，未测试生成质量或核实收入。

复用 VideoEffectGenerator、Seedance 服务、预设 JSON、积分扣除、回调、历史记录及 R2。需新增 effectType、预设、样片和文案。当前路由没有参考视频输入，不能承诺原片动作和时序的精确复制。

建议先做 10 次样片测试，至少 8 次生成成功且人工能辨识踮脚动作，并验证扣费、失败退款、下载。此为项目建议验收线，不是行业基准。4 秒无法表达动作时先停止上线，评估更长视频与成本。

### 2. Bulin 47：观察，信心偏低

候选路径：/video/bulin-47-ai-video-generator。

竞争难度低于 Rumpelstiltskin，但查询量未收录。批次 1,435% 涨幅不能代替体量。公开搜索已有多家专门站，不能说无人竞争。

用户常期待原片的手势、镜头、场景与声音。竞品既有保留原片的主张，也有按提示词重新创作的版本。我们的参考图片加提示词生成不等于原视频换人；只能按实际样片承诺相似 freestyle 效果。若必须精确复刻，先接参考视频或动作迁移能力并核实素材与音轨来源。

搜索量未证实，请用 Keyword Planner / Google Trends 进一步核实后再立项。当前不建议先做完整多语言页面。

### 3. Nano Banana 2.1：优先工具页，产品适配信心高，SEO 排名信心待验证

候选路径：/nano-banana-2-1。主词 nano banana 2.1，支持词 gemini nano banana 2.1、image generator、image editor；同页包含使用方法、与 Pro 的简要比较和 FAQ，避免先拆多个薄页。

2026-10-19 补充核实：用户提供 KIE API 文档，且已访问 KIE 官方产品页，明确提供模型 nano-banana-2-1。撤回此前“先只做指南、等待确认可接入”的建议。KIE 已提供该模型，本站当前路由尚未使用该标识；两件事应明确区分。

首发任务：输入提示词生成图片，或上传参考图进行编辑；选择比例并下载结果。建议先开放 1K，2K/4K 按成本与质量验证后扩展。API 上限为 10 张参考图、每文件 30MB，支持 JPEG/PNG/WebP；上游能力上限不自动等于本站上传组件已支持。

复用现有 KIE createTask、recordInfo、回调、R2、历史记录与积分机制。请求需按独立模型结构适配：model=nano-banana-2-1，参考图字段 image_input，比例 aspect_ratio，分辨率 resolution，输出 output_format。当前 KIEImageService 普通方法使用 image_urls 和 image_size，不能只换模型名。文生图与图生图均使用同一模型，区别在于有无 image_input。

KIE 页面当日列价：1K 4 KIE 积分 / $0.02，2K 6 / $0.03，4K 9 / $0.045。这是上游标价，非本站用户积分，也不包含存储、重试、支付和运维费用。本站原有每次 5 积分规则不能在未核算后直接沿用所有清晰度。

验收需覆盖纯文生图、参考图编辑、所开放比例与分辨率、任务成功回调/轮询、结果转存、扣费与失败退款。尚未调用付费生成进行验证，不能声称已完成接入或质量实测。

官方模型卡和 KIE 文档用于模型事实；部分批次自动分析与官方不符时以官方为准。推荐依据是与本站定位高度一致、已有搜索需求、接入链路可复用；自然排名难度仍未查询，不据此承诺容易排名。

### 4. 扩充已有页

burning bridges ai、burning bridges ai video、burning bridges drake ai 合并由 /video/drake-burning-bridges-ai-video-generator 承接。检查标题、说明、提示词和内链的自然覆盖，不另造同义页。

crying ai trend 已有 /video/crying-effect-video-generator，最新批次回落，不拆页。

1980s ai photo trend 优先由已有 vintage photo booth / yearbook 主题承接，低热度不足以支持独立新页。

ai steroids filter、longhair ai、krea ai hairstyle changer 与已有肌肉、发型任务重复，而且相关路由受人物模块开关限制，不能据此新增绕过开关的页面。

### 5. 暂缓

- Navratri：规划师 2025-10 已有量，是节庆复苏需求；10 月 19 日已近本轮节期尾声。美国 KD 61.2 不能冒充印度难度。可在提示词库补有限内容，下一轮提前准备；未查印度英语搜索量和盘面。
- ArtCraft：更偏找软件、官方下载和比较；若做只整合一篇介绍，不把 PhotoCraft、Adobe clone 等拆成薄页。查询量未证实。
- Chained Together：批次分析偏追剧，搜索也出现生成器营销页，意图仍混合；当前没有长剧编排和跨镜头一致性能力。
- Hotel Lobby、Alors On Danse、Raindance：批次回落或证据薄弱，且动作、双角色与音轨复刻超出现有路由能力。
- 通用 LLM、新闻、影视观看、游戏下载与攻略、下载器、AI 聊天词：不因在新词库出现就做本站内页。

## 现有能力、缺口与成本

代码检查依据：

- src/app/api/generate-image/route.ts：图片生成模型别名如上；当前代码每次 5 积分。
- src/lib/kie-api/kie-video-service.ts：bytedance/seedance-2-fast，服务层具备时长参数。
- src/app/api/video/generate/route.ts：实际接口固定 4 秒、480p、100 积分，仅支持预设与参考图片，没有参考视频字段。服务层可配置不等于用户端已开放。
- src/components/video/VideoEffectGenerator.tsx：可复用生成界面。
- src/lib/portrait-module.ts：NEXT_PUBLIC_HIDE_PORTRAIT_MODULE 未显式为 false 时隐藏人物模块。未检查生产环境值，路由文件存在不等于线上可用。
- 工作区已有其他付费试用修改，本轮研究未改动这些文件。

新视频页需要样片生成、重试和素材存储成本。没有本轮 KIE 单价证据，不报美元成本或利润率；用户积分价格应与上游成本分开核算。建议先英语验证，再按真实搜索地区扩语言。

## 验证计划

先接入并验证 Nano Banana 2.1 工具页、优化已有 Burning Bridges 页；新增视频生成器只试 Rumpelstiltskin 一项。样片、收费、退款、下载通过后再加入 sitemap 和内链。

收录后观察 28 天，分别记录相关非品牌查询曝光、自然点击、进入工具、提交生成、成功下载及付费。点击编辑器不能算付费转化。若未收录先查技术问题；若收录 28 天相关曝光不足 100，暂停扩展同类页。100 是建议实验止损线，不是搜索引擎规则。

有点击无生成先查承诺与样片；有生成但失败率超验收线先修链路；趋势回落且无稳定长尾时停止新增语言与同义页。

## 来源

- [哥飞新词 API](https://seo.web.cafe/api/#keyword-data-service)
- [最新批次](https://new.web.cafe/data/updates/2026-10-18T2313)
- [Rumpelstiltskin 词档案](https://new.web.cafe/keywords/rumpelstiltskin-ai)
- [Bulin 47 词档案](https://new.web.cafe/keywords/bulin-47-ai-trend)
- [Navratri 词档案](https://new.web.cafe/keywords/navratri-prompt)
- [Burning Bridges 词档案](https://new.web.cafe/keywords/burning-bridges-ai)
- [KIE Nano Banana 2.1 产品与 API 文档](https://kie.ai/zh-CN/nano-banana-2-1)：2026-10-19 访问核实，模型标识、参数与标价；API 细节同时依据用户提供的完整文档。
- [Nano Banana 2.1 官方模型卡](https://deepmind.google/models/model-cards/nano-banana-2-1/)
- [Rumpelstiltskin 竞品产品页](https://rumpelstiltskin-ai.net/)
- [Bulin 47 竞品产品页](https://bulin47ai.video/)
- [Media.io Navratri 页面](https://www.media.io/image-effects/navratri-prompt.html)
- [澳洲印度教神职协会 2026 日历](https://www.australiancouncilofhinduclergy.com/uploads/5/5/4/9/5549439/unified_festival_calendar_2026.pdf)：Navratri 10 月 11 日开始、10 月 19 日为 Durgashtami，地区历法可能不同。
