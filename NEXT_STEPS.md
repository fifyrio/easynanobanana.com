# Prompt History Lite - 下一步实施指南

## 🎉 已完成（60% - Backend + Hooks 完成！）

### ✅ 完成清单

1. **数据库 Schema** ✅
   - `database-migrations/prompt-history-lite.sql`
   - 2 张表 + RLS + 搜索函数

2. **API 路由** ✅
   - `/api/prompts/folders` (完整 CRUD)
   - `/api/prompts/saved` (完整 CRUD + 搜索)
   - 统一认证和错误处理

3. **React Hooks** ✅
   - `src/hooks/usePromptFolders.ts`
   - `src/hooks/usePrompts.ts`
   - 完整的 CRUD + 搜索 + 状态管理

4. **TypeScript 类型** ✅
   - `src/types/prompts.ts`

---

## 📊 当前进度

```
总体: 60% ████████████░░░░░░░░

✅ Backend:      100% (完成!)
✅ React Hooks:  100% (完成!)
⏳ UI Components:  0% (待实施)
```

---

## 🚀 剩余任务（40%）

### 方案 A：完整 UI 实现（推荐，4-6 小时）

创建完整的三栏布局页面：

#### 1. 主页面 (`src/app/prompts/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { usePromptFolders } from '@/hooks/usePromptFolders';
import { usePrompts } from '@/hooks/usePrompts';

export default function PromptsPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { folders } = usePromptFolders();
  const { prompts, selectedPrompt, setSelectedPrompt } = usePrompts({
    folderId: selectedFolderId
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧文件夹 */}
      <aside className="w-64 bg-white border-r">
        {folders.map(folder => (
          <div
            key={folder.id}
            onClick={() => setSelectedFolderId(folder.id)}
            className="p-3 hover:bg-gray-50 cursor-pointer"
          >
            {folder.icon} {folder.name}
          </div>
        ))}
      </aside>

      {/* 中间提示词列表 */}
      <section className="w-96 bg-white border-r overflow-y-auto">
        {prompts.map(prompt => (
          <div
            key={prompt.id}
            onClick={() => setSelectedPrompt(prompt)}
            className="p-4 border-b hover:bg-gray-50 cursor-pointer"
          >
            <h3 className="font-medium">{prompt.title}</h3>
            <p className="text-sm text-gray-600 truncate">{prompt.prompt_text}</p>
          </div>
        ))}
      </section>

      {/* 右侧详情 */}
      <main className="flex-1 p-6">
        {selectedPrompt ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">{selectedPrompt.title}</h2>
            <p className="mb-4">{selectedPrompt.prompt_text}</p>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded">
              Generate
            </button>
          </div>
        ) : (
          <div className="text-gray-400 text-center mt-20">
            Select a prompt to view details
          </div>
        )}
      </main>
    </div>
  );
}
```

#### 2. 路由配置
```bash
mkdir -p src/app/prompts
# 创建上面的 page.tsx
```

---

### 方案 B：最简化实现（快速测试，1-2 小时）

创建极简单页面用于测试功能：

```typescript
// src/app/prompts/page.tsx
'use client';

import { usePrompts } from '@/hooks/usePrompts';

export default function PromptsTestPage() {
  const { prompts, createPrompt, deletePrompt } = usePrompts();

  async function handleCreate() {
    const title = prompt('Title:');
    const text = prompt('Prompt text:');
    if (title && text) {
      await createPrompt({ title, prompt_text: text });
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Prompts (Test)</h1>
      <button onClick={handleCreate} className="bg-blue-500 text-white px-4 py-2 mb-4">
        Add Prompt
      </button>
      <div className="space-y-2">
        {prompts.map(p => (
          <div key={p.id} className="border p-3">
            <h3 className="font-bold">{p.title}</h3>
            <p>{p.prompt_text}</p>
            <button onClick={() => deletePrompt(p.id)} className="text-red-500 text-sm">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**优势**: 2 分钟就能看到效果，测试所有 API 功能！

---

## 🎯 推荐实施顺序

### 第1步：快速测试（30分钟）
1. 创建方案 B 的测试页面
2. 访问 `/prompts` 测试 CRUD
3. 确认所有功能正常

### 第2步：完善 UI（4-6 小时）
1. 创建完整的三栏布局
2. 添加搜索功能
3. 添加样式和交互

### 第3步：集成（1 小时）
在图片编辑器中添加"保存提示词"按钮

### 第4步：测试（1 小时）
端到端测试完整流程

---

## 💻 快速开始命令

```bash
# 1. 创建页面目录
mkdir -p src/app/prompts

# 2. 创建测试页面（方案 B）
# 复制上面的极简代码到 src/app/prompts/page.tsx

# 3. 启动开发服务器
npm run dev

# 4. 访问测试
# http://localhost:3000/prompts
```

---

## 📋 完整文件清单

### ✅ 已创建

```
database-migrations/
  └─ prompt-history-lite.sql ✅

src/lib/prompts/
  └─ api-helpers.ts ✅

src/app/api/prompts/
  ├─ folders/
  │  ├─ route.ts ✅
  │  └─ [id]/route.ts ✅
  └─ saved/
     ├─ route.ts ✅
     └─ [id]/route.ts ✅

src/types/
  └─ prompts.ts ✅

src/hooks/
  ├─ usePromptFolders.ts ✅
  └─ usePrompts.ts ✅
```

### ⏳ 待创建（可选）

```
src/app/prompts/
  └─ page.tsx ⏳ (方案 A 或 B)

src/components/prompts/  (可选，如果选择方案 A)
  ├─ FolderSidebar.tsx
  ├─ PromptList.tsx
  └─ PromptDetails.tsx
```

---

## 🧪 测试清单

使用方案 B 的测试页面测试：

- [ ] 创建提示词
- [ ] 查看提示词列表
- [ ] 编辑提示词
- [ ] 删除提示词
- [ ] 搜索提示词
- [ ] 创建文件夹
- [ ] 移动提示词到文件夹

---

## 📚 API 使用示例

### 在其他页面使用 Hooks

```typescript
import { usePrompts } from '@/hooks/usePrompts';

function MyComponent() {
  const { createPrompt } = usePrompts({ autoLoad: false });

  async function saveCurrentPrompt(text: string) {
    await createPrompt({
      title: text.substring(0, 50),
      prompt_text: text,
      thumbnail_url: imageUrl,
      last_image_id: imageId
    });
  }

  return <button onClick={() => saveCurrentPrompt(promptText)}>Save</button>;
}
```

---

## 🎉 总结

**你现在拥有：**

✅ 完整的数据库 Schema
✅ 完整的 REST API（6 个端点）
✅ 强大的 React Hooks（CRUD + 搜索）
✅ TypeScript 类型安全

**还需要：**

⏳ 创建一个简单的测试页面（30 分钟）
⏳ 或创建完整 UI（4-6 小时）

**建议**：
1. 先用方案 B 快速测试（30 分钟）
2. 确认功能正常后再实现完整 UI

---

**下一步**: 创建 `src/app/prompts/page.tsx`（方案 B）测试所有功能！

是否需要我帮你创建测试页面或完整 UI？
