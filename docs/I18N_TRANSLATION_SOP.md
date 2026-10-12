# 多语言增量翻译与校验 SOP

适用：新增页面命名空间、导航标签，或更新已有文案。
来源：宠物视频集群翻译实战；822 个新增键翻译到 13 个目标语言，日语首轮漏了一个 FAQ 的两个叶子键，补翻后通过检查。

配套：[效果页 SOP](./AI_EFFECT_PAGE_SOP.md) · [素材 SOP](./AI_SHOWCASE_ASSETS_SOP.md)

## 1. 明确翻译范围

新增键先写 `messages/en.json`。记录本次 namespace 和导航路径，使用项目脚本生成其他语言，不让 AI 分别手写全部语言文件。

当前批处理入口 `scripts/translate-batch.ts` 包含 zh、zh-TW、de、es、fr、it、pt、ja、ko、ru、vi、th、id；加上英文共 14 种。每次核对批处理列表、站点语言配置和 metadata 的 hreflang 列表，不能照搬旧文档里的语言数。

运行前检查工作区已有翻译改动。脚本会写本地 JSON，并调用外部翻译 API；凭证由脚本读取，不打印密钥。实际执行遵循当前任务授权；本 SOP 本身不要求立即调用 API。

## 2. 选择正确模式

只新增键时，推荐：

```bash
pnpm run translate:new
```

等价入口与单语言补翻：

```bash
pnpm tsx scripts/translate-batch.ts --new-only
pnpm tsx scripts/translate.ts ja --new-only
```

`--new-only` 依据目标文件缺失的键提取内容，**不会发现已有键的英文文案变化**。当前数组逻辑主要检查目标是否为数组、长度是否不足；同长度数组的内容变化也不会自动更新。

修改已有英文内容时，先查看 `scripts/translate.ts` 的当前提取和合并逻辑，确定受影响键的重译方法。`--incremental` 也不能直接当成英文变更追踪。不要为了少数键变化盲目重译整个语言文件。

## 3. 校验键与简单占位符

下面命令只读取文件。示例范围为宠物集群；其他任务替换 `scopes`，可以传 namespace 或 `nav.xxx` 这样的路径。

```bash
python3 - <<'PY'
import json, pathlib, re
from collections import Counter

scopes = ['aiPetDance', 'aiPetVideoHub', 'aiDancingDog', 'aiCatDancing',
          'aiTalkingPet', 'aiSingingCat', 'aiSingingDog',
          'aiTalkingAnimal', 'aiPetVideoLinks']
root = pathlib.Path('messages')
def leaves(value, path=''):
    if isinstance(value, dict):
        return {k: v for key, child in value.items()
                for k, v in leaves(child, f'{path}.{key}' if path else key).items()}
    if isinstance(value, list):
        return {k: v for i, child in enumerate(value)
                for k, v in leaves(child, f'{path}.{i}').items()}
    return {path: value}
def selected(key):
    return any(key == scope or key.startswith(scope + '.') for scope in scopes)
def tokens(value):
    return Counter(re.findall(r'\{\s*([A-Za-z_]\w*)\s*\}', value))

source = {k: v for k, v in leaves(json.loads((root/'en.json').read_text())).items()
          if selected(k)}
assert all(any(k == s or k.startswith(s + '.') for k in source) for s in scopes), '源路径缺失'
errors = []
for file in sorted(root.glob('*.json')):
    target = leaves(json.loads(file.read_text()))
    for key, value in source.items():
        if key not in target:
            errors.append(f'{file.stem}: 缺键 {key}')
        elif type(value) is not type(target[key]):
            errors.append(f'{file.stem}: 类型不同 {key}')
        elif isinstance(value, str):
            if value.strip() and not target[key].strip():
                errors.append(f'{file.stem}: 空翻译 {key}')
            if tokens(value) != tokens(target[key]):
                errors.append(f'{file.stem}: 占位符不同 {key}')
print('\n'.join(errors) if errors else f'PASS: {len(source)} 个源叶子键，所有现有语言文件通过')
raise SystemExit(bool(errors))
PY
```

这项检查覆盖现有 JSON、指定路径的缺键/类型/空值，以及 `{count}` 这类简单占位符。它不检查缺失的整个语言文件、翻译语义、复杂 ICU plural/select 和富文本标签；这些另行对照语言配置、抽查并做运行时验证。将本次新增导航路径加入 scopes 才会检查导航。

## 4. 修复、构建和验收

缺失键：只对对应语言重新执行 `--new-only`，再校验。占位符或已有翻译错误：缺键模式不会修复，修正对应键后复查。

```bash
pnpm run type-check
pnpm run build
```

抽查中文、非拉丁语言和主要市场语言的标题、按钮、错误提示、FAQ；打开实际语言路由检查切换和插值。构建通过不代表所有运行时消息都覆盖。

完成条件：目标语言文件全部存在，本次键和占位符检查通过，抽查与页面运行正常，diff 没有无关旧文案被重写。历史中 API 全部返回成功后仍漏键，因此不能以脚本退出码代替内容验收。
