# 外链建设工作交接文档

更新时间：2026-08-31　|　目标站：easynanobanana.com

这份文档是给下一个会话（或你自己）接续用的。按顺序读：现状 → 待你做的事 → 已完成清单 → 方法论速查。

---

## 一、现状快照

**外链画像诊断结论**（详见 `backlink-audit-and-plan-2026-08-14.md`）：
- 引荐域名 54 个，94% 是 AS 0-10 垃圾，Semrush 网络图表评级 **危险**
- 最大外链来源国是摩尔多瓦（37%），锚文本里混有卖链广告——**这些是需要 Disavow 的，还没做**
- 竞品对比：pixnova.ai(1,223 域名) / facepair.com(146) / skingenerator.io(5,757) 三家里，只有 skingenerator 没买垃圾链，是唯一值得抄的打法（topai.tools + Softonic + Toolify + 开源 + PH 组合）

**本轮新增的真实证据**（2026-08-26 起）：从 Semrush 反向链接报告看到 **aidive.org 已经上线**（DR 31，2026-08-28 首次收录），证明"竞品在哪发我们也去发"这个打法有效。用户随后要求用哥伦布外链榜单（columbus.tools/ai-backlink-rank）批量找同类站提交。

---

## 二、⚠️ 待你做的事（按优先级）

### 1. 需要你登录的站（我不能代做）

| 站点 | 状态 | 你要做什么 |
|---|---|---|
| **VisionaryHub.ai** submit-tool 表单 | ⏸️ 卡在第 8 步 "Pros & Cons"，前 7 步已填完（Basic Info / Category / Logo / Pricing / Why Choose / 1 个 Feature） | 打开 `https://visionaryhub.ai/en-US/submit-tool/`，表单有自动保存草稿的话直接续填 Pros/Cons 两项随便填一条，点 Continue 到底提交。如果草稿没了，重新走一遍，资料见下方"标准提交文案" |
| **askmatchbox.com** | Founders 入口需登录 | 需要你注册/登录后我再接手 |
| **tool2mate.com** | 已放弃（$100 收费） | 不用管 |
| **probedex.ai** | 生成报告需 Google 登录 | 价值不大（它是分析工具站不是目录站），可跳过 |

### 2. 需要你决策的付费项

| 站点 | 价格 | 依据 |
|---|---|---|
| **aigo.tools** | $12 一次性 | AS 62、dofollow，righthair 竞品刚拿到链，全部付费项里最便宜 |
| **poweredbyai.app** | $11.99 Pro（原价$49.99） | dofollow、即时上线、DR 36、月访问 82.5K。**表单已填完待支付**，路径：`poweredbyai.app/submit-tool?toolID=easy-nano-banana` → 选 Pro Plan → Pay Now |
| showmebest.ai | 有 **$0 免费档**（dofollow） | 已提交表单在 `showmebest.ai/submit/free-submit`，需确认是否已提交成功（当时在填表阶段） |
| topai.tools / Toolify / creati.ai | $47 / $99 / $69 | 见 `backlink-submission-kit-2026-08-18.md`，尚未决策 |

### 3. 需要你发邮件的（草稿已写好）

| 收件人 | 邮箱 | 事由 | 草稿位置 |
|---|---|---|---|
| IMEI.info | ads@imei.info | Guest Post 询价（一稿发 12+ 语言版） | `backlink-submission-log.md` 底部 |
| IEMLabs | iema@iemlabs.com | Guest Post，表单有验证码绕不过 | 同上 |
| Gearbrain | 需自己找编辑邮箱 | 申请把易班之蕉加入 "Top 6 Bug Identifier Apps" 榜单 | 同上 |

### 4. Disavow（一直悬而未决，建议尽快做）

在 Semrush 建 Backlink Audit 活动，把摩尔多瓦系 + `.top`/`.xyz` 垃圾域名批量提交 Google Disavow。详见 `backlink-audit-and-plan-2026-08-14.md` 第四节。

---

## 三、✅ 已完成的提交（可在 Semrush 反向链接报告里验证）

| 站点 | 状态 | 证据 |
|---|---|---|
| SaaSHub | 已提交，待审核 | 关联了 4 个竞品(Nano-Banana.com/Phot.ai/PhotoRoom/PicsArt) + 4 分类 |
| **aidive.org** | ✅ **已上线**，DR 31 | Semrush 反向链接报告第 6 行可见，2026-08-28 收录 |
| TechBullion | 询稿信已发送成功 | 官网表单确认 "Thank you for your message. It has been sent." |
| **aimyflow.com** | ✅ 提交成功 | 页面确认 "Tool Submitted Successfully!"，24-48h 审核 |

---

## 四、标准提交文案（复制即用）

```
Tool Name: Easy Nano Banana
Website: https://www.easynanobanana.com
Category: Image Generation Tools / AI Image Generation
Pricing: Freemium

Short (≤160字符):
Free AI image editor powered by Gemini. Edit photos with text prompts: remove
objects, swap outfits, restyle — plus 40+ focused tools.

Full (≤300字符):
Easy Nano Banana is an AI image studio built on Google's Gemini image model.
Upload a photo, describe the change in plain words, and get results in
seconds — object removal, outfit swaps, anime styles, Minecraft skin
generation, face analysis, room redesigns and 40+ more tools. Runs entirely
in the browser, supports 14 languages, free credits, no credit card required.

Contact: Will Woo / aiasmrvip@outlook.com
Logo: https://www.easynanobanana.com/images/logo.png（多数站要求方形，用 canvas
      放大到 512×512 即可，参考下方脚本）
Screenshot: https://www.easynanobanana.com/images/blogs/future-of-creative-tools.png
```

**Logo 转方形的浏览器脚本**（当页面 fetch 被拦截时用这个绕过）：
```js
const img=new Image(); img.crossOrigin='anonymous';
await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src='https://www.easynanobanana.com/images/logo.png';});
const c=document.createElement('canvas'); c.width=512; c.height=512;
const ctx=c.getContext('2d'); ctx.imageSmoothingQuality='high'; ctx.drawImage(img,0,0,512,512);
const blob=await new Promise(r=>c.toBlob(r,'image/png'));
const file=new File([blob],'easy-nano-banana-logo.png',{type:'image/png'});
const dt=new DataTransfer(); dt.items.add(file);
document.querySelector('input[type=file]').files=dt.files;
document.querySelector('input[type=file]').dispatchEvent(new Event('change',{bubbles:true}));
```

---

## 五、方法论速查（哥伦布榜单批量找站）

1. 打开 `https://columbus.tools/ai-backlink-rank`（这是社区维护的"哪些站已被 AI 工具批量提交过 = 能发/能收录"的交叉验证榜单，1,949 个域名）
2. 用脚本筛"免费+免登录+Dofollow"：
```js
const rows=[...document.querySelectorAll('table tbody tr')];
const picks=[];
for(const r of rows){
  const c=[...r.querySelectorAll('td')].map(td=>td.innerText.trim().replace(/\n+/g,' '));
  if(c[5]==='免费' && c[6]==='免登录' && /dofollow/i.test(c[9])){
    picks.push(c[1].split(' ')[0]+' | DR '+c[8]+' | 频次 '+c[11]);
  }
}
picks.join('\n')
```
3. 按 DR/频次排序逐个访问 `/submit` 页面，能免登录填表的直接填并提交，需登录/付费的记录下来
4. **常见坑**：很多标注"免费"的目录站实际已改成付费墙（topai.tools、creati.ai、aigo.tools、poweredbyai.app 都是如此，哥伦布榜单数据未必是最新的）——先探再填，别预设免费

---

## 六、相关文件索引

- `backlink-audit-and-plan-2026-08-14.md` — 外链画像诊断 + Disavow 计划
- `backlink-competitor-sources-2026-08-18.md` — 三家竞品外链来源拆解
- `backlink-submission-kit-2026-08-18.md` — 提交素材包（Tagline/描述/PH文案）
- `backlink-blog-opportunities-2026-08-26.md` — 投稿型/评论型博客渠道清单
- `backlink-submission-log.md` — 逐站提交登记表（含邮件草稿）
- 本文件 `HANDOFF-backlink-work.md` — 交接总纲，每次大动作后更新
