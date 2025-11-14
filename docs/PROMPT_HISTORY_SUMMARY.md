# Prompt History Feature - Quick Reference Summary

## 🎯 核心功能概述

基于 UI 截图分析，实现一个完整的 **提示词历史管理系统**，允许用户保存、组织、搜索和复用图像生成提示词。

---

## 📊 数据库变更总结

### 新增 3 张表

#### 1. `prompt_folders` - 文件夹管理
```sql
用途: 用户自定义文件夹分类
字段: id, user_id, name, icon, color, sort_order, is_system
特点:
  - 支持自定义图标和颜色
  - 默认 "All Prompts" 系统文件夹
  - RLS 用户隔离
```

#### 2. `saved_prompts` - 保存的提示词
```sql
用途: 存储用户保存的提示词及元数据
字段: id, user_id, folder_id, title, prompt_text, tags[],
      usage_count, is_favorite, last_used_at
特点:
  - 全文搜索索引 (GIN)
  - 标签数组支持
  - 使用统计追踪
  - 软删除 (is_archived)
```

#### 3. `prompt_images` - 关联表
```sql
用途: 提示词与生成图片的多对多关系
字段: prompt_id, image_id
特点:
  - 快速查询某提示词的所有生成图片
  - 支持反向查询（图片来源提示词）
```

### 扩展现有表

```sql
-- images 表添加可选引用
ALTER TABLE images
  ADD COLUMN saved_prompt_id uuid REFERENCES saved_prompts(id);
```

---

## 🔧 技术架构

### 前端结构
```
/prompts
├─ 左侧: 文件夹列表 (PromptFolderList)
├─ 中间: 提示词列表 (PromptList) + 搜索
└─ 右侧: 提示词详情 (PromptDetails) + 生成图片展示
```

### API 路由
```
/api/prompts/
├─ folders/             # 文件夹 CRUD
├─ saved/              # 提示词 CRUD
│  └─ [id]/images/     # 获取关联图片
└─ search/             # 全文搜索
```

### React Hooks
```typescript
usePromptFolders()    // 文件夹管理
usePrompts()          // 提示词 CRUD
usePromptSearch()     // 搜索功能
```

---

## 🚀 实现步骤

### Phase 1: 数据库 (已完成 ✅)
- [x] 创建表结构
- [x] 添加索引和 RLS 策略
- [x] 创建工具函数

### Phase 2: 后端 API (Week 1)
```typescript
// 需要实现的 API 路由
- GET/POST    /api/prompts/folders
- PUT/DELETE  /api/prompts/folders/[id]
- GET/POST    /api/prompts/saved
- GET/PUT/DELETE /api/prompts/saved/[id]
- GET         /api/prompts/saved/[id]/images
- POST        /api/prompts/search
```

### Phase 3: 前端组件 (Week 2)
```typescript
// 核心组件
1. PromptFolderList.tsx      // 文件夹侧边栏
2. PromptList.tsx             // 提示词卡片列表
3. PromptDetails.tsx          // 右侧详情面板
4. PromptSearchBar.tsx        // 搜索框
5. GeneratedImagesGrid.tsx    // 图片网格展示
```

### Phase 4: 集成 (Week 2)
- 在图片生成时自动/手动保存提示词
- 从保存的提示词一键重新生成
- 关联新生成的图片到提示词

---

## 💡 关键特性

### 1. 智能搜索
```sql
-- PostgreSQL 全文搜索
SELECT * FROM saved_prompts
WHERE to_tsvector('english', title || prompt_text || array_to_string(tags, ' '))
      @@ plainto_tsquery('english', 'cyberpunk');
```

### 2. 使用统计
```typescript
// 追踪提示词使用频率
interface SavedPrompt {
  usage_count: number;      // 使用次数
  last_used_at: Date;       // 最后使用时间
}
```

### 3. 标签系统
```typescript
// 灵活的标签数组
tags: ["cyberpunk", "city", "neon", "night"]
```

### 4. 图片关联
```typescript
// 查看某提示词生成的所有图片
GET /api/prompts/saved/{id}/images
-> 返回所有使用该提示词生成的图片
```

---

## 🔐 安全机制

### JWT 认证流程
```typescript
// 前端: 从 Supabase session 获取 token
const token = await supabase.auth.getSession()
  .then(s => s.data.session?.access_token);

// 后端: 验证 token 并提取 user.id
const { data: { user } } = await supabase.auth.getUser(token);

// 所有查询自动过滤为当前用户的数据
```

### RLS 策略
```sql
-- 用户只能访问自己的数据
CREATE POLICY "users_own_data" ON saved_prompts
  FOR ALL USING (auth.uid() = user_id);
```

---

## 📈 性能优化

### 数据库索引
```sql
-- 关键索引
1. GIN index on tags[]                    // 标签过滤
2. Full-text search index                 // 全文搜索
3. Composite index (user_id, created_at)  // 分页查询
4. Index on (user_id, is_favorite)        // 收藏过滤
```

### 前端缓存
```typescript
// React Query 缓存策略
staleTime: 5 * 60 * 1000,    // 5 分钟
cacheTime: 10 * 60 * 1000,   // 10 分钟
```

### 优化加载
- 虚拟滚动 (Virtualized lists)
- 图片懒加载 (Lazy loading)
- 防抖搜索 (300ms debounce)
- 乐观更新 (Optimistic UI)

---

## 📋 工作量评估

### 开发时间: 3-4 周

| 任务 | 工作量 | 负责人 |
|------|--------|--------|
| 数据库 Schema | ✅ 完成 | - |
| API 路由开发 | 3-4 天 | Backend Dev |
| React Hooks | 2-3 天 | Frontend Dev |
| UI 组件开发 | 4-5 天 | Frontend Dev |
| 集成 & 测试 | 3-4 天 | Full Team |
| 优化 & 部署 | 2-3 天 | DevOps |

---

## 🎨 UI/UX 要点

### 响应式布局
- **Desktop**: 三列布局（文件夹 | 列表 | 详情）
- **Tablet**: 两列（文件夹+列表 | 详情切换）
- **Mobile**: 单列（Tab 切换）

### 交互设计
- ✅ 点击提示词查看详情
- ✅ 拖拽提示词到文件夹（可选）
- ✅ 快捷键支持 (Cmd+K 搜索)
- ✅ 收藏/取消收藏切换
- ✅ 一键复制提示词
- ✅ 双击编辑

### 视觉风格
```css
Primary: yellow-500    /* Banana Yellow 主题 */
Hover: yellow-50       /* 悬停背景 */
Active: yellow-400     /* 选中状态 */
Border: gray-200       /* 边框 */
```

---

## 🧪 测试用例

### 核心流程测试
1. ✅ 用户创建新文件夹
2. ✅ 保存提示词到文件夹
3. ✅ 搜索提示词（全文搜索）
4. ✅ 编辑提示词标题/内容
5. ✅ 从提示词重新生成图片
6. ✅ 查看提示词的所有生成图片
7. ✅ 删除提示词
8. ✅ 删除文件夹（提示词移到默认）

### 边界情况
- 空文件夹显示
- 无搜索结果状态
- 大量提示词性能
- 网络失败处理

---

## 📚 相关文档

1. **[完整实现计划](./PROMPT_HISTORY_IMPLEMENTATION_PLAN.md)** - 详细的分阶段实现指南
2. **[数据库 Schema](./prompt-history-schema.sql)** - 完整的 SQL 脚本
3. **[架构图](./prompt-history-architecture.md)** - 系统架构和数据流图
4. **[认证最佳实践](../PAYMENT_SOP.md#authentication-best-practices)** - 复用现有认证模式

---

## 🎯 成功指标

### 上线后 3 个月目标
- 📊 **采用率**: 60% 用户保存至少 1 个提示词
- 💾 **活跃度**: 平均每用户 10+ 个保存的提示词
- 🔄 **复用率**: 40% 提示词被重复使用
- 📁 **组织度**: 70% 用户创建自定义文件夹
- 🔍 **搜索率**: 50% 用户使用搜索功能

---

## 🚀 快速开始

### 1. 应用数据库迁移
```bash
# 在 Supabase SQL Editor 中运行
psql < docs/prompt-history-schema.sql
```

### 2. 启动开发
```bash
# 创建分支
git checkout -b feature/prompt-history

# 开始实现 API 路由
mkdir -p src/app/api/prompts/{folders,saved,search}
```

### 3. 测试
```bash
npm run test:unit      # 单元测试
npm run test:e2e       # E2E 测试
npm run test:coverage  # 覆盖率报告
```

---

## 💬 FAQ

**Q: 为什么需要 junction table (prompt_images)?**
A: 支持多对多关系 - 一个提示词可以生成多张图片，一张图片可能属于多个提示词变体。

**Q: 提示词数量有限制吗?**
A: 单用户建议不超过 1000 个活跃提示词，超过建议归档。数据库支持百万级别。

**Q: 支持分享提示词吗?**
A: V1 不支持，V2 计划添加公开/分享功能。

**Q: 删除文件夹后提示词怎么办?**
A: 提示词不会被删除，会移到 "All Prompts" 默认文件夹 (folder_id = NULL)。

**Q: 全文搜索支持中文吗?**
A: 当前使用 'english' 配置，可修改为支持多语言（需要额外配置）。

---

## 📞 联系方式

- **项目负责人**: [Your Name]
- **技术问题**: [Tech Lead]
- **设计问题**: [Designer]

---

**文档版本**: 1.0
**创建日期**: 2025-11-14
**最后更新**: 2025-11-14
**状态**: ✅ Ready for Implementation
