# 日语 Personal Color 栏目 —— 页面结构与程序化子页方案

制定日期：2026-08-08　｜　目标语种：ja　｜　数据源：Semrush JP 库

---

## 一、这个盘子有多大

| 词根 | 词数 | 月搜索总量 | 平均 KD |
|---|---|---|---|
| パーソナルカラー診断 | 2,238 | 503,970 | 23 |
| イエベ（黄底调） | 4,395 | 530,040 | **18** |
| ブルベ（蓝底调） | 7,223 | 679,600 | **19** |
| **合计（去重后约）** | ~12,000 | **~170 万** | **~20** |

对比：你整个英文站现在 549 个词、月流量 45。**这一个日语栏目的可寻址搜索量，是现有全站的数千倍，而难度只有 KD 20 左右。**

四个季型主词本身就是巨量：ブルベ夏 60,500 / イエベ春 49,500 / イエベ秋 49,500 / ブルベ冬 49,500（KD 25-27）。

---

## 二、核心判断：这不是"工具页翻译"，是"内容栏目 + 工具入口"

日本用户搜 `イエベ春 似合う色` 想看的是**颜色清单、化妆品推荐、发色示例**，不是一个上传按钮。所以：

- **不要**把这些页塞进 `/ai-image-effects/` 目录（那是工具目录，也在 `portrait-module.ts` 下架名单的管辖范围内）
- **要**新开一个 `/personal-color` 栏目，内容页承接搜索意图，页内 CTA 导流到诊断工具
- 工具页 `/ja/ai-image-effects/ai-personal-color` 保留，作为栏目的转化终点

---

## 三、URL 架构

```
/ja/personal-color                          ← Hub（主词 301,000）
/ja/personal-color/diagnosis                ← 免费诊断工具落地页（無料/カメラ/写真/AI/セルフ）
/ja/personal-color/16-types                 ← 16 型体系说明（16タイプ 5,400 / 16分割自己診断 3,600）

/ja/personal-color/[season]                 ← 4 个季型主页
   ├─ iebe-haru     イエベ春   49,500  KD 26
   ├─ iebe-aki      イエベ秋   49,500  KD 27
   ├─ burube-natsu  ブルベ夏   60,500  KD 25
   └─ burube-fuyu   ブルベ冬   49,500  KD 25

/ja/personal-color/[season]/[facet]         ← 程序化子页（4 × 12 = 48 页）
/ja/personal-color/compare/[pair]           ← 对比页（6 页）
```

> **slug 用罗马字**（`iebe-haru`）而非日文编码，避免 URL 编码问题和外链丢失。日文主词放在 H1 和 title 里，不影响排名。

---

## 四、程序化矩阵：4 季型 × 12 facet

每个 facet 的四季合计搜索量（实测值）：

| facet slug | 日文 | イエベ春 | イエベ秋 | ブルベ夏 | ブルベ冬 | 合计/月 | KD |
|---|---|---|---|---|---|---|---|
| `colors` | 似合う色 | 18,100 | 18,100 | 27,100 | 18,100 | **81,400** | 22-34 |
| `hair` | 髪色 | 14,800 | 14,800 | 18,100 | 9,900 | **57,600** | 21-27 |
| `eyeshadow` | アイシャドウ | 8,100 | 6,600 | 12,100 | 9,900 | **36,700** | 25-27 |
| `celebrity` | 芸能人 | 6,600 | 8,100 | 8,100 | 8,100 | 30,900 | 12-17 ⚠️ |
| `lip` | リップ | 5,400 | 6,600 | 8,100 | 5,400 | **25,500** | 25-27 |
| `makeup` | メイク | 5,400 | 5,400 | 6,600 | 6,600 | **24,000** | 23-25 |
| `cheek` | チーク | 1,900 | 2,400 | 2,400 | 2,400 | 9,100 | 25 |
| `features` | 特徴 | 1,900 | 1,900 | 2,900 | 1,900 | 8,600 | 19-29 |
| `clothes` | 服・コーデ | 1,600 | 2,320 | 2,320 | 1,300 | 7,540 | 17-23 |
| `nail` | ネイル | 880 | 1,300 | 1,300 | 1,000 | 4,480 | 13-20 |
| `contacts` | カラコン | 1,300 | 1,300 | 1,900 | 1,300 | 5,800 | **13-15** |
| `avoid` | 似合わない色 | 2,400 | 2,400 | ~1,500 | ~1,500 | 7,800 | **14-18** |

**48 个子页合计可寻址约 30 万搜索/月，平均 KD 20。**

### 对比页（6 页，长尾但意图极强）

| slug | 目标词 | 搜索量 | KD |
|---|---|---|---|
| `iebe-vs-burube` | イエベとブルベの違い / ブルベかイエベか | 1,600 + 1,600 + 1,300 | **13-22** |
| `burube-natsu-vs-fuyu` | ブルベ夏冬違い / 見分け方 | 2,400 + 880 | 20-22 |
| `iebe-haru-vs-aki` | イエベ春秋違い | 1,900 + 1,300 | 19 |
| `iebe-haru-vs-burube-natsu` | イエベ春ブルベ夏 混合 | 1,900 + 1,300 + 1,000 | **8-24** |
| `iebe-aki-vs-burube-fuyu` | イエベ秋ブルベ冬 | 720 | **14** |
| `mens` | パーソナルカラー診断 メンズ / 男性 / 男 | 8,100 + 880 + 720 | **15-19** |

> `mens`（男性向）单独拎出来：8,100 搜索、KD 只有 19，是整个栏目里性价比最高的单页。

---

## 五、页面模板设计

### 模板 A：Hub `/ja/personal-color`

```
H1  パーソナルカラー診断｜AIで無料・写真1枚でイエベ・ブルベがわかる
─────────────────────────────
① Hero + 直接上传入口（不要先讲道理，先给工具）
② 30秒でわかる：4タイプ早見表（4 张卡片 → 季型主页）
③ イエベ・ブルベとは？（承接「とは」6,600+8,100）
④ 16タイプ分類とは（→ /16-types）
⑤ 診断のやり方 3ステップ（照片要求：素颜/自然光/正面）
⑥ よくある質問（当たる？無料？カメラ必要？セルフ診断との違い？）
⑦ 全 48 个子页的分类导航（内链枢纽）
```

覆盖词：パーソナルカラー診断(301K) / 無料(8.1K) / カメラ(9.9K+1.3K) / 写真(5.4K+4.4K) / 当たる(2.9K) / わからない(1.9K) / とは(720) / ai(480) / アプリ(720) / すっぴん(480) / セルフ(480+390)

**必须避开**：東京・大阪・名古屋 等地域词（9,900+5,400+2,900…）——那是线下沙龙预约意图，你转化不了，做了也是跳出。

### 模板 B：季型主页 `/ja/personal-color/iebe-haru`

```
H1  イエベ春（スプリング）とは｜特徴・似合う色・メイク完全ガイド
─────────────────────────────
① 一句话定义 + 特征清单（肌/瞳/髪の色味）
② 似合う色パレット（色卡网格，带 HEX，可视化）
③ 似合わない色 & 理由
④ カテゴリ別ガイド（12 个 facet 子页入口卡片）
⑤ 他タイプとの見分け方（→ 对比页）
⑥ 自分がイエベ春か確認する（→ 诊断工具 CTA）
⑦ FAQ
```

### 模板 C：facet 子页 `/ja/personal-color/iebe-haru/hair`

```
H1  イエベ春に似合う髪色15選｜暗め・明るめ・ブリーチなしまで
─────────────────────────────
① 结论先行：TOP3 推荐 + 理由
② 全 15 色清单（每条：色名 + HEX 色块 + AI 生成的上脸示意图 + 一句说明）
③ 明るめ / 暗め / ブリーチなし 分组（吃 1,900+1,300+880 的子长尾）
④ 避けたい髪色
⑤ 「この髪色が自分に似合うか試す」→ 工具 CTA（这里是转化点）
⑥ 関連：他の facet 内链
```

**这一层是程序化的主力**——同一套 JSON 数据 + 同一个 React 组件，48 页一次生成。

### 模板 D：对比页 `/ja/personal-color/compare/burube-natsu-vs-fuyu`

```
H1  ブルベ夏とブルベ冬の違い｜見分け方チェックリスト
─────────────────────────────
① 対比表（肌/瞳/髪/似合う色/苦手な色）
② 自己チェック 8 問（交互式，无需后端）
③ 混合タイプの場合
④ AI で判定する → 工具 CTA
```

---

## 六、技术实现（基于现有代码库）

### 现状（Explore 结论）

- 工具页在 `src/app/[locale]/ai-image-effects/ai-personal-color/page.tsx`，翻译 namespace `aiPersonalColor`
- `ai-image-effects/` 下有 ~72 个目录，**每个工具一个 page.tsx，metadata 全是复制粘贴**——这个模式不能用来铺 48 个页
- 全项目唯一的 `generateStaticParams` 先例：`src/app/[locale]/blog/[slug]/page.tsx`
- `public/sitemap.xml` 是**手写静态文件**（1817 行）
- ⚠️ `/ai-image-effects/ai-personal-color` 在 `src/lib/portrait-module.ts` 的 `PORTRAIT_MODULE_PATHS` 名单里，受 `NEXT_PUBLIC_HIDE_PORTRAIT_MODULE` 控制，**默认会 404 + noindex**。新栏目务必不要落进这个名单，同时确认线上环境变量确实设为 `'false'`。

### 建议的新增文件

```
src/app/[locale]/personal-color/
  page.tsx                          ← Hub
  [season]/page.tsx                 ← 季型主页（generateStaticParams 展开 4 个）
  [season]/[facet]/page.tsx         ← facet 子页（展开 48 个）
  compare/[pair]/page.tsx           ← 对比页（展开 6 个）

src/data/personal-color/
  seasons.ja.json                   ← 4 季型基础数据
  facets.ja.json                    ← 12 facet × 4 季型的正文数据
  compare.ja.json                   ← 6 组对比数据

src/components/personal-color/
  SeasonHero.tsx
  ColorPalette.tsx                  ← 色卡网格（HEX → 色块）
  FacetList.tsx                     ← 通用清单渲染
  SelfCheckQuiz.tsx                 ← 对比页自测题
  ToolCta.tsx                       ← 统一 CTA，指向 /ja/ai-image-effects/ai-personal-color

src/lib/personal-color.ts           ← 数据读取 + slug 解析
src/lib/tool-metadata.ts            ← 抽公共 buildMetadata()（顺手治理现有 72 处复制粘贴）
src/app/sitemap.ts                  ← 动态 sitemap，替换手写的 public/sitemap.xml
```

### 关键决策：SEO 文案不走 messages/*.json

48 个页面 × 每页数十条文案，如果塞进 `messages/ja.json`，会让那个文件膨胀到不可维护，而且 14 个语种同步脚本会连带遭殃。

**把日语文案直接内联在 `src/data/personal-color/*.ja.json` 里**，`generateMetadata` 从数据文件读，不从 `getTranslations` 读。这样：
- 完全绕开 14 语种同步成本
- 后续要扩到其他语种，只需加 `*.es.json`，路由和组件零改动

### 数据结构示意

```ts
// src/data/personal-color/facets.ja.json
{
  "iebe-haru": {
    "hair": {
      "seo": {
        "title": "イエベ春に似合う髪色15選｜暗め・明るめ・ブリーチなし",
        "description": "イエベ春（スプリング）に似合う髪色を15色紹介。...",
        "keywords": "イエベ春 髪色, イエベ春 髪色 暗め, イエベ春 黒髪"
      },
      "h1": "イエベ春に似合う髪色15選",
      "intro": "...",
      "items": [
        { "name": "ライトベージュ", "hex": "#D9BE9A", "image": "...", "note": "..." }
      ],
      "groups": [
        { "label": "暗めの髪色", "itemIds": [...] },
        { "label": "ブリーチなしでできる髪色", "itemIds": [...] }
      ],
      "avoid": [...],
      "faq": [...]
    }
  }
}
```

---

## 七、内链设计（这是能不能起量的关键）

AS 只有 8，48 个孤岛页面不会有任何排名。必须织网：

1. **Hub → 4 季型主页**：首屏 4 张大卡片
2. **季型主页 → 12 个 facet**：分类卡片网格（每个季型主页导出 12 条内链）
3. **facet 页 → 同季型其他 11 个 facet**：页脚横向导航
4. **facet 页 → 同 facet 其他 3 个季型**（如"ブルベ夏の髪色はこちら"）：这一步很多站会漏，但它让 4×12 矩阵形成真正的网状而非树状
5. **所有页 → 诊断工具**：统一 CTA 组件
6. **工具页 → Hub**：反向回链，把工具页现有的权重导给新栏目
7. 日文站现有 41 条 `/ja/` sitemap 条目里的相关页（image-editor 等）加一条指向 Hub

---

## 八、SEO 字段规范（遵循 CLAUDE.md）

- canonical：`https://www.easynanobanana.com/ja/personal-color/...`（英语无前缀规则在此不适用，因为这个栏目**只做日语**）
- `alternates.languages`：**先只写 `ja` 一条 + `x-default` 指向 ja**。等扩语种时再加，不要为了凑 14 条而指向不存在的页面
- title ≤ 70 字符、description ≤ 180、keywords ≤ 120（日文按字符数算，注意全角）
- `openGraph.locale`: `ja_JP`
- 每个 facet 页加 `FAQPage` schema；季型主页加 `Article` schema；Hub 加 `WebApplication` + `BreadcrumbList`
- 全站 `robots: index, follow`

---

## 九、风险与红线

### ⚠️ 芸能人（明星）页面 —— 建议改造后再做

`イエベ秋 芸能人` 等 4 个词合计 30,900 搜索/月、KD 只有 12-17，看起来很香，但：

- 列举真实艺人姓名并断言其肤色类型，在日本有**名誉毀損**与**パブリシティ権**风险
- 使用艺人照片几乎必然侵权
- Google 对这类页面的 E-E-A-T 要求也更高

**建议做法**：不做"艺人清单页"，改做`イエベ秋 芸能人風メイク`（秋型艺人风妆容）这类**风格描述型**内容，只描述妆容特征与配色，不点名、不用照片。流量会打折，但没有法务风险。

### 其他

- **薄内容风险**：48 个页面如果只是换了个季型名的模板填充，Google 会判定为 doorway pages。每页必须有实质差异化内容（真实的色卡 HEX、真实的 AI 生成示意图、不同的 FAQ）。**宁可先做 12 页做扎实，也不要一次铺 48 页凑数。**
- **portrait module 名单**：新路由不要加进 `PORTRAIT_MODULE_PATHS`；同时确认线上 `NEXT_PUBLIC_HIDE_PORTRAIT_MODULE='false'`，否则工具页 CTA 会指向 404。
- **sitemap**：手写的 `public/sitemap.xml` 加 48+ 条会难以维护，建议这次一并改成 `app/sitemap.ts` 动态生成。
- **图片成本**：每个 facet 页需要 10-15 张示意图，48 页就是 500-700 张。用自家 nano banana API 批量生成，存 R2，注意 alt 文本也要日语化。

---

## 十、分阶段落地

### Phase 1（第 1-2 周）：验证模型能不能跑通
- 建 Hub + 4 个季型主页 + `mens` 页（共 6 页）
- 打通 `generateStaticParams` + 数据驱动 + 动态 sitemap
- 目标：确认 Google 能正常收录 `/ja/personal-color/*`

### Phase 2（第 3-5 周）：铺高价值 facet
- 优先 3 个 facet × 4 季型 = 12 页：`colors`(81,400) / `hair`(57,600) / `avoid`(7,800，KD 最低)
- 加对比页 `iebe-vs-burube` + `burube-natsu-vs-fuyu`
- 目标：拿到第一批 top-20 排名

### Phase 3（第 6-10 周）：补齐矩阵
- 剩余 8 个 facet × 4 季型 = 32 页
- `celebrity` 按上述改造方案做成 `〜風メイク`
- 完成全部 6 个对比页

### Phase 4：转化与外链
- 诊断工具日语版体验优化（照片要求引导、16 型结果页）
- 日本本地外链：はてなブックマーク、note、日本 AI 工具导航站（可用 backlink-building 技能跑）

---

## 十一、预期

保守估算：48 个 facet 页 + 6 季型/对比页，可寻址约 **50 万搜索/月**，平均 KD 20。

按小站起步的常见转化率，Phase 2 结束（约 12 页上线 2 个月后）能看到前 20 名排名；全量铺完并配合外链后，若平均拿到第 10-20 名、CTR 1-2%，对应 **5,000-10,000 月自然访问**——是现有全站流量（45/月）的百倍量级。

**前提是外链跟上。** AS 8 是硬约束，48 个页面本身不产生权重。
