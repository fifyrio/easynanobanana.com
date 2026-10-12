# AI 展示素材生成与验收 SOP

适用：效果页的预设缩略图、前后对比、演示视频、OG 图。
来源：2026-09-17 宠物 dance / talk 两批素材生成。历史输出为 30 个 R2 上传，抽查公开 URL、视频解码和音轨通过，并修正了 OG 实际尺寸与 metadata 不一致的问题。

配套：[效果页 SOP](./AI_EFFECT_PAGE_SOP.md) · [翻译 SOP](./I18N_TRANSLATION_SOP.md)

## 1. 先确定素材清单

每项记录：用途、preset ID、提示词、预期尺寸/比例、是否需要声音、本地路径、R2 key、页面引用路径。

参考：

- `scripts/generate-ai-pet-dance-assets.ts`
- `scripts/generate-ai-pet-talk-assets.ts`
- `src/data/ai-pet-dance-presets.json`
- `src/data/ai-pet-talk-presets.json`

新效果复用 KIE 服务和 R2 上传能力，按实际差异调整提示词、目录与输出，不另建生成管线。检查页面 demo ID 与脚本生成范围一致，猫页、说话页的素材确实展示对应对象和动作。

## 2. 检查后再生成

先读脚本的参数和跳过逻辑，检查凭证是否配置但不输出值。实际生成会消耗 KIE 额度并写入 R2；只有任务包含该执行范围时才运行，不能把下面命令当成无副作用验证。

先 dry-run：

```bash
pnpm tsx scripts/generate-ai-pet-dance-assets.ts --dry-run
pnpm tsx scripts/generate-ai-pet-talk-assets.ts --dry-run
```

dry-run 可检查计划和提示词，仍可能创建本地目录、加载服务；不证明真实生成和上传可用。

实际生成示例，按顺序分别执行：

```bash
pnpm tsx scripts/generate-ai-pet-dance-assets.ts
pnpm tsx scripts/generate-ai-pet-talk-assets.ts
```

按需缩小批次：dance 支持 `--presets-only`、`--feature-only`、`--demos-only`；talk 支持 `--presets-only`、`--clips-only`。单张预设示例：

```bash
pnpm tsx scripts/generate-ai-pet-dance-assets.ts --presets-only --preset hip-hop
```

不要假定 `--preset` 会限制所有阶段，先检查该脚本实现。避免无意加 `--force`，它可能重新生成并覆盖产物。

## 3. 失败恢复的两个限制

- 脚本部分循环会捕获并打印单项失败后继续；退出码为 0 不保证整批成功。对照日志、清单和实际 R2 对象逐项核对。
- 部分阶段按本地文件存在来跳过生成，而写本地文件发生在上传之前。如果上传失败，下次可能因本地文件存在而跳过。此时先核对 R2，缺失上传应复用已有本地文件修复，不能默认重跑就会补齐，也不必为上传失败重新消耗生成额度。

新脚本设计应沿用服务能力，但不要把上述限制当成最佳实践照抄。

## 4. 验收真实产物

检查页面实际引用的公开 URL，包含缩略图、demo、feature 和 OG。将以下地址替换为真实素材地址：

```bash
curl --fail --location --output /dev/null --write-out '%{http_code} %{content_type} %{size_download}\n' 'https://YOUR_PUBLIC_HOST/showcases/EFFECT/demo/PRESET.mp4'
```

HTTP 成功之后还要检查类型、体积和内容。对本地视频使用：

```bash
ffprobe -v error -show_entries stream=codec_name,width,height -show_entries format=duration -of json public/images/showcases/ai-pet-dance/demo/hip-hop.mp4
```

图片实际尺寸示例（macOS）：

```bash
sips -g pixelWidth -g pixelHeight public/images/showcases/ai-pet-dance/feature/og-image.png
```

人工播放或查看产物，确认对象、动作、裁切和音频内容符合用途；“有 AAC 音轨”不等于唱歌效果正确。核对文件真实格式与 Content-Type，更新 OG 声明的尺寸，并让各类页面使用对应的 OG 图片。

## 5. 页面与交接

打开桌面和手机页面，检查图片、自动播放条件、静音/播放控制、首屏布局和无媒体 404；记录未验证的浏览器或生成能力。

按清单报告预期数量、实际成功数量、失败项、公开 URL 检查及人工抽查结果。历史 dance 17 + talk 13 = 30 仅是旧批次的基准，新效果按自己的清单计算。

视频类历史惯例为 R2 正式引用、本地镜像不入 Git。交接应记录 R2 前缀和恢复方法，避免把本地镜像误当成页面唯一来源；其他素材是否入库遵循对应页面已有惯例。页面媒体验收完成与代码部署完成分别记录。
