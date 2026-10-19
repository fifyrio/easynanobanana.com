# Rumpelstiltskin 与 Bulin 47 生成验证

日期：2026-10-19。按用户已选定的新词落地表执行。与关键词调研结论分开记录真实生成结果；未部署生产站。

## 本轮结果

- Rumpelstiltskin：完成三个四秒样片，覆盖虚构成年男性、成年女性和原创机器人。支持上线小规模“原创踮脚舞”试验；不支持宣传为原视频换脸、动作复制或原曲合成。
- Bulin 47：完成一段四秒 freestyle 候选样片。技术链路成功，但画面是坐在桌边的角色做节拍手势，没有达到用户通常期待的原梗站立街头表演、原镜头和原声复刻。本轮不注册公开 effect、不建页面、不加 sitemap。
- 三个 Rumpelstiltskin 样片不是成功率统计，也不是此前建议的十次压力验证。仅证明这些输入可生成并展示实际动作差异。

## 媒体与人工检查

| 样片 | 实际输出 | 画面检查 |
| --- | --- | --- |
| Rumpelstiltskin 男性 | H.264，496×864，4.041667 秒，无音轨 | 身份和服装稳定，小步交替抬脚；脚跟抬起不是每一帧都完全遵循提示词 |
| Rumpelstiltskin 女性 | H.264，496×864，4.041667 秒，无音轨 | 人物和场景稳定，有抬跟与轻跳，脚与地面的接触不始终自然 |
| Rumpelstiltskin 机器人 | H.264，496×864，4.041667 秒，无音轨 | 角色设计稳定，有交替抬脚与摆动；不是原梗精确舞步 |
| Bulin 候选 | H.264 + AAC，496×864，4.096 秒 | 节拍手势可读，但坐姿、桌子和表演方式偏离站立 freestyle 预期；音频内容未人工听审，仅确认存在 AAC 音轨 |

页面与实际一致：Rumpelstiltskin 使用 100 用户积分、4 秒、480p 既有接口，静音；真实输出为 496×864，VideoObject 时长为 PT4.042S。OG 为 JPEG，1200×630。文案明确不提供原片替换、原动作锁定或歌曲录音。

## 可复核样片

- [男性踮脚舞](https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-rumpelstiltskin/demo/tiptoe-dance.mp4)
- [女性踮脚舞](https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-rumpelstiltskin/demo/woman.mp4)
- [机器人踮脚舞](https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/ai-rumpelstiltskin/demo/robot.mp4)
- [Bulin freestyle 验证素材，非公开页面](https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases/bulin-47-validation/demo/freestyle.mp4)

展示素材保存在 R2；本地输入、任务 ID、轮询日志、视频、封面和抽帧位于忽略目录 temp/keyword-rollout/。共生成四张输入图、四段视频，派生四张封面和一张 OG。页面和验证记录引用的九个视频/封面/OG URL 均实际 GET 200，Content-Type 和尺寸检查通过。脚本可从已保存 taskId 恢复；已有本地文件只补上传，不重复购买生成。

## 模型与成本

按 KIE 目录和 schema 查询确认 nano-banana-2-1（输入图）与 bytedance/seedance-2-fast（视频）后执行；输入图任务使用该模型的 prompt、aspect_ratio、resolution 和 output_format 字段，视频复用现有服务。产品生成路由没有切换 Nano Banana 模型。

本轮生成前后 KIE 余额从 1439.56 到 1240.36，减少 199.20 KIE 积分。此为本轮观察到的账户余额差，不等于本站用户积分或未来单次生成报价。期间有一次轮询网络中断，通过保存的任务 ID 恢复，没有为该视频新建第二个任务。

## Bulin 47 需求判断

同日研究快照中，美国英语哥飞 KD 37.5；两种 AI trend 写法的全球规划师量均未收录。未收录不代表零需求，1435% 的批次涨幅也不能换算成月搜索量。公开搜索已出现专门站，其主要承诺为保留既有表演动作、背景与声音；这些是竞品自述，不证明实际效果或收入。

结合本轮效果，暂不立项。下一轮必须同时满足：核实近期目标地区需求；实现符合页面承诺的站立表演或参考视频动作控制；完成原声/原创音轨选择、质量与计费验证。不能用本轮“技术成功”的坐姿片段当作原梗效果展示。

来源：[本轮关键词数据](2026-10-19-gefei-new-keywords-data.json)、[KIE](https://kie.ai/zh-CN/nano-banana-2-1)、[Bulin 47 竞品](https://bulin47.ai/)、[另一种提示词创作型竞品](https://bulin47ai.video/)。
