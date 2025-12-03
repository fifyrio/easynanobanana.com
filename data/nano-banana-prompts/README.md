# Nano Banana Pro Prompts API

## 📁 数据文件结构

```
data/nano-banana-prompts/
├── prompts-en.json          # 英文数据
├── prompts-zh.json          # 中文数据（可选）
├── prompts-ja.json          # 日文数据（可选）
└── README.md                # 本文档
```

## 📝 数据格式

每个 JSON 文件包含一个 prompts 数组，每个 prompt 对象结构如下：

```json
[
  {
    "id": 1,
    "title": "Prompt 标题",
    "prompt": "完整的 prompt 文本",
    "imageUrl": "https://pub-xxx.r2.dev/assets3/image.jpg",
    "tags": ["标签1", "标签2", "标签3"],
    "category": "分类名称",
    "author": "作者名"
  }
]
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 唯一标识符 |
| `title` | string | ✅ | Prompt 标题（简短描述） |
| `prompt` | string | ✅ | 完整的 prompt 文本 |
| `imageUrl` | string | ✅ | 图片 URL（支持 CDN 或本地路径） |
| `tags` | string[] | ✅ | 标签数组（用于搜索） |
| `category` | string | ✅ | 分类名称 |
| `author` | string | ✅ | 作者名称 |

### 支持的分类（Category）

- `Portrait` - 肖像摄影
- `Product Shot` - 产品摄影
- `Image Edit` - 图像编辑
- `Fashion` - 时尚摄影
- `Illustration` - 插画设计
- `Minimalist` - 极简设计
- `Logo Design` - Logo 设计
- `Comic Art` - 漫画艺术
- `Style Transfer` - 风格迁移

## 🔌 API 使用

### 端点

```
GET /api/nano-banana-prompts
```

### 查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `pageSize` | number | 6 | 每页条目数 |
| `search` | string | - | 搜索关键词（搜索 title、prompt、tags） |
| `category` | string | - | 按分类过滤 |
| `locale` | string | en | 语言代码 |

### 响应格式

```json
{
  "prompts": [
    {
      "id": 1,
      "title": "...",
      "prompt": "...",
      "imageUrl": "...",
      "tags": [...],
      "category": "...",
      "author": "..."
    }
  ],
  "total": 9,
  "page": 1,
  "pageSize": 6,
  "totalPages": 2
}
```

### 使用示例

#### 1. 获取所有 prompts（第一页）
```bash
GET /api/nano-banana-prompts
```

#### 2. 获取第二页数据
```bash
GET /api/nano-banana-prompts?page=2&pageSize=6
```

#### 3. 搜索包含 "portrait" 的 prompts
```bash
GET /api/nano-banana-prompts?search=portrait
```

#### 4. 按分类过滤
```bash
GET /api/nano-banana-prompts?category=Portrait
```

#### 5. 组合查询
```bash
GET /api/nano-banana-prompts?category=Portrait&search=japanese&page=1
```

#### 6. 获取中文数据
```bash
GET /api/nano-banana-prompts?locale=zh
```

### 前端使用示例

```typescript
// 获取 prompts
const response = await fetch('/api/nano-banana-prompts?pageSize=100');
const data = await response.json();

console.log(data.prompts); // Prompt 数组
console.log(data.total);   // 总数
```

## 📊 添加新数据

### 步骤 1：准备图片

1. 将图片上传到 R2 CDN 或放在 `public/images/nano-banana-prompt/` 目录
2. 获取图片 URL

### 步骤 2：编辑 JSON 文件

打开 `data/nano-banana-prompts/prompts-en.json`，添加新对象：

```json
{
  "id": 10,
  "title": "Your Prompt Title",
  "prompt": "Your complete prompt text here...",
  "imageUrl": "https://your-cdn.com/image.jpg",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Portrait",
  "author": "YourName"
}
```

### 步骤 3：验证格式

确保：
- ✅ ID 唯一且递增
- ✅ 所有必填字段已填写
- ✅ JSON 格式正确（使用在线 JSON 验证器）
- ✅ 图片 URL 可访问

### 步骤 4：刷新页面

数据会自动加载，无需重启服务器。

## 🌍 多语言支持

### 创建其他语言版本

1. 复制 `prompts-en.json` 为 `prompts-{locale}.json`
2. 翻译 `title`、`tags`、`category` 字段
3. `prompt` 字段可以保持英文或翻译
4. `imageUrl` 和 `author` 保持不变

示例：`prompts-zh.json`
```json
[
  {
    "id": 1,
    "title": "写实肖像",
    "prompt": "一位年迈的日本陶艺家的写实特写肖像...",
    "imageUrl": "/images/nano-banana-prompt/elderly-japanese-ceramicist-portrait-warm-lighting.jpg",
    "tags": ["肖像", "写实", "老年", "日本", "陶艺家", "工作室"],
    "category": "肖像",
    "author": "MangoPrompt"
  }
]
```

## 🔍 搜索功能

搜索会匹配以下字段：
- ✅ `title`
- ✅ `prompt`
- ✅ `tags`
- ✅ `category`

所有搜索不区分大小写。

## 📈 性能优化

- API 响应带有缓存头：`Cache-Control: public, s-maxage=3600`
- 建议在前端一次性获取所有数据（`pageSize=100`），然后在客户端进行过滤和分页
- 图片使用 Next.js Image 组件自动优化

## 🎨 最佳实践

### Prompt 编写建议

1. **详细描述**：包含主体、风格、光线、构图等细节
2. **长度适中**：50-200 字为宜
3. **避免模糊词**：使用具体描述而非"好看"、"漂亮"等
4. **技术参数**：可以包含镜头、光圈等摄影参数

### Tags 选择建议

1. 每个 prompt 3-6 个标签
2. 包含主题、风格、技术关键词
3. 使用小写英文（便于搜索）

### Category 选择建议

选择最贴切的单一分类，不要重复或混合。

## 🚀 未来扩展

可以添加的字段：
- `difficulty`: 难度等级
- `engine`: 使用的 AI 引擎
- `createdAt`: 创建时间
- `likes`: 点赞数
- `views`: 浏览数
- `premium`: 是否为高级内容
