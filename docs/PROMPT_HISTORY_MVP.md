# Prompt History MVP - 最小可行产品方案

## 🎯 MVP 目标

**核心价值验证**: 用户是否真的需要保存和复用提示词？

**开发时间**: 3-5 天（而非 3-4 周）

**核心功能**: 保存提示词 → 查看历史 → 一键复用

---

## ✂️ MVP 功能裁剪

### ✅ 保留核心功能

1. **保存提示词** - 生成图片时自动保存
2. **查看历史** - 简单的列表展示
3. **一键复用** - 点击提示词重新生成
4. **基础搜索** - 简单的文本过滤

### ❌ 暂不实现（V2）

1. ~~文件夹管理~~ → 用单一列表
2. ~~标签系统~~ → 用简单的关键词搜索
3. ~~编辑提示词~~ → 只能删除和复制
4. ~~使用统计~~ → 不追踪使用次数
5. ~~收藏功能~~ → 按时间排序即可
6. ~~图片关联展示~~ → 只显示最新一张图

---

## 🗄️ MVP 数据库简化版

### 只需 1 张新表！

```sql
-- =====================================================
-- MVP: SAVED PROMPTS TABLE (简化版)
-- =====================================================
CREATE TABLE public.saved_prompts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,

  -- 核心字段
  prompt_text text NOT NULL,              -- 提示词内容
  thumbnail_url text,                     -- 最后生成的图片缩略图
  last_image_id uuid,                     -- 最后生成的图片 ID

  -- 时间戳
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT saved_prompts_pkey PRIMARY KEY (id),
  CONSTRAINT saved_prompts_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT saved_prompts_last_image_id_fkey FOREIGN KEY (last_image_id)
    REFERENCES public.images(id) ON DELETE SET NULL
);

-- 基础索引
CREATE INDEX idx_saved_prompts_user_id ON public.saved_prompts(user_id, created_at DESC);

-- RLS 策略
ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prompts"
  ON public.saved_prompts FOR ALL
  USING (auth.uid() = user_id);

-- 简单的搜索函数 (基于 ILIKE)
CREATE OR REPLACE FUNCTION search_prompts_simple(
  user_uuid uuid,
  search_query text
)
RETURNS TABLE (
  id uuid,
  prompt_text text,
  thumbnail_url text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.prompt_text,
    sp.thumbnail_url,
    sp.created_at
  FROM public.saved_prompts sp
  WHERE
    sp.user_id = user_uuid
    AND sp.prompt_text ILIKE '%' || search_query || '%'
  ORDER BY sp.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**对比完整版**:
- ❌ 不需要 `prompt_folders` 表
- ❌ 不需要 `prompt_images` 关联表
- ❌ 删除 tags, usage_count, is_favorite 等字段
- ✅ 只保留最核心的提示词文本和时间戳

---

## 📁 MVP 文件结构（极简）

```
src/
├── app/
│   ├── prompts/
│   │   └── page.tsx                    # 单页面（列表 + 详情）
│   └── api/
│       └── prompts/
│           ├── route.ts                # GET/POST/DELETE
│           └── search/
│               └── route.ts            # 搜索
│
├── components/
│   └── prompts/
│       ├── PromptHistoryDialog.tsx     # 弹窗版本（更简单）
│       └── PromptCard.tsx              # 单个提示词卡片
│
└── hooks/
    └── usePrompts.ts                   # 单一 hook
```

---

## 🎨 MVP UI 设计（极简版）

### 方案 A: 弹窗模式（推荐）

```
┌─────────────────────────────────────────────────┐
│  Image Editor Page                              │
│                                                 │
│  [Upload Image]  [Prompt Input]  [📜 History]  │  ← 新增历史按钮
│                                                 │
│  [Generate]                                     │
└─────────────────────────────────────────────────┘

点击 [📜 History] 后弹出:

┌─────────────────────────────────────────────────┐
│  Prompt History                           [✕]   │
├─────────────────────────────────────────────────┤
│  🔍 [Search prompts...]                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ 🖼️ "A neon-lit cyberpunk city..."        │  │
│  │    Created: 2 hours ago                  │  │
│  │    [Use] [Copy] [Delete]                 │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ 🖼️ "Serene alien jungle at twilight..."  │  │
│  │    Created: 1 day ago                    │  │
│  │    [Use] [Copy] [Delete]                 │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ... (scroll for more)                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**优势**:
- ✅ 无需新页面路由
- ✅ 不打断当前工作流
- ✅ 开发成本最低
- ✅ 移动端友好

### 方案 B: 独立页面（备选）

```
/prompts 页面

┌─────────────────────────────────────────────────┐
│  🔍 [Search prompts...]                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────┐  A neon-lit cyberpunk city...      │
│  │  🖼️    │  Created: 2 hours ago               │
│  │ [thumb]│  [Use Prompt] [Copy] [Delete]       │
│  └────────┘                                     │
│                                                 │
│  ┌────────┐  Serene alien jungle...            │
│  │  🖼️    │  Created: 1 day ago                 │
│  │ [thumb]│  [Use Prompt] [Copy] [Delete]       │
│  └────────┘                                     │
│                                                 │
│  ... (infinite scroll)                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔧 MVP 实现步骤

### Day 1: 数据库 + API（2-3 小时）

#### 1.1 创建数据库表
```bash
# 在 Supabase SQL Editor 运行上面的简化版 SQL
```

#### 1.2 实现 API 路由
```typescript
// src/app/api/prompts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';

// GET - 获取用户的所有提示词
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();
    const { data: prompts, error } = await serviceSupabase
      .from('saved_prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ success: true, prompts });
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

// POST - 保存新提示词
export async function POST(request: NextRequest) {
  try {
    const { prompt_text, thumbnail_url, last_image_id } = await request.json();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();
    const { data: prompt, error } = await serviceSupabase
      .from('saved_prompts')
      .insert({
        user_id: user.id,
        prompt_text,
        thumbnail_url,
        last_image_id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error('Failed to save prompt:', error);
    return NextResponse.json({ error: 'Failed to save prompt' }, { status: 500 });
  }
}

// DELETE - 删除提示词
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('id');
    if (!promptId) {
      return NextResponse.json({ error: 'Prompt ID required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();
    const { error } = await serviceSupabase
      .from('saved_prompts')
      .delete()
      .eq('id', promptId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete prompt:', error);
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
  }
}
```

#### 1.3 搜索 API
```typescript
// src/app/api/prompts/search/route.ts

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    // ... 认证代码（同上）...

    const { data: prompts, error } = await serviceSupabase
      .rpc('search_prompts_simple', {
        user_uuid: user.id,
        search_query: query
      });

    if (error) throw error;

    return NextResponse.json({ success: true, prompts });
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
```

---

### Day 2: React Hook（1-2 小时）

```typescript
// src/hooks/usePrompts.ts

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SavedPrompt {
  id: string;
  prompt_text: string;
  thumbnail_url?: string;
  created_at: string;
}

export function usePrompts() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 获取提示词列表
  async function fetchPrompts() {
    setLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const token = await supabase.auth.getSession()
        .then(s => s.data.session?.access_token);

      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/prompts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
      toast.error('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  }

  // 保存提示词
  async function savePrompt(promptText: string, thumbnailUrl?: string, imageId?: string) {
    try {
      const { supabase } = await import('@/lib/supabase');
      const token = await supabase.auth.getSession()
        .then(s => s.data.session?.access_token);

      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt_text: promptText,
          thumbnail_url: thumbnailUrl,
          last_image_id: imageId
        })
      });

      const data = await response.json();
      if (data.success) {
        setPrompts([data.prompt, ...prompts]);
        toast.success('Prompt saved!');
        return data.prompt;
      }
    } catch (error) {
      console.error('Failed to save prompt:', error);
      toast.error('Failed to save prompt');
    }
  }

  // 删除提示词
  async function deletePrompt(promptId: string) {
    try {
      const { supabase } = await import('@/lib/supabase');
      const token = await supabase.auth.getSession()
        .then(s => s.data.session?.access_token);

      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/prompts?id=${promptId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setPrompts(prompts.filter(p => p.id !== promptId));
        toast.success('Prompt deleted');
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error('Failed to delete prompt');
    }
  }

  // 搜索提示词
  async function searchPrompts(query: string) {
    if (!query.trim()) {
      fetchPrompts();
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase');
      const token = await supabase.auth.getSession()
        .then(s => s.data.session?.access_token);

      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/prompts/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      if (data.success) {
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  }

  useEffect(() => {
    fetchPrompts();
  }, []);

  return {
    prompts,
    loading,
    searchQuery,
    setSearchQuery,
    savePrompt,
    deletePrompt,
    searchPrompts,
    refetch: fetchPrompts
  };
}
```

---

### Day 3: UI 组件（3-4 小时）

#### 3.1 弹窗组件
```typescript
// src/components/prompts/PromptHistoryDialog.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrompts } from '@/hooks/usePrompts';
import toast from 'react-hot-toast';

interface PromptHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (promptText: string) => void;
}

export default function PromptHistoryDialog({
  isOpen,
  onClose,
  onSelectPrompt
}: PromptHistoryDialogProps) {
  const { prompts, loading, searchQuery, setSearchQuery, deletePrompt, searchPrompts } = usePrompts();
  const [localQuery, setLocalQuery] = useState('');
  const router = useRouter();

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPrompts(localQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery]);

  if (!isOpen) return null;

  function handleUsePrompt(promptText: string) {
    if (onSelectPrompt) {
      onSelectPrompt(promptText);
      onClose();
    } else {
      // 跳转到图片编辑器
      router.push(`/image-editor?prompt=${encodeURIComponent(promptText)}`);
    }
  }

  function handleCopy(promptText: string) {
    navigator.clipboard.writeText(promptText);
    toast.success('Prompt copied to clipboard!');
  }

  function handleDelete(promptId: string) {
    if (confirm('Delete this prompt?')) {
      deletePrompt(promptId);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Prompt History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search prompts..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Prompt List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {localQuery ? 'No prompts found' : 'No saved prompts yet'}
            </div>
          ) : (
            prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition group"
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  {prompt.thumbnail_url && (
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={prompt.thumbnail_url}
                        alt="Prompt thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 line-clamp-2 mb-2">
                      {prompt.prompt_text}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(prompt.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleUsePrompt(prompt.prompt_text)}
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-lg transition"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleCopy(prompt.prompt_text)}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-lg transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

#### 3.2 在图片编辑器中集成
```typescript
// src/app/image-editor/page.tsx (修改)

'use client';

import { useState } from 'react';
import PromptHistoryDialog from '@/components/prompts/PromptHistoryDialog';
import { usePrompts } from '@/hooks/usePrompts';

export default function ImageEditorPage() {
  const [promptText, setPromptText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const { savePrompt } = usePrompts();

  async function handleGenerate() {
    // ... 现有的图片生成逻辑 ...

    // 生成成功后自动保存提示词
    if (generatedImage) {
      await savePrompt(
        promptText,
        generatedImage.thumbnail_url,
        generatedImage.id
      );
    }
  }

  return (
    <div>
      {/* 现有的编辑器 UI */}

      {/* 新增: 历史按钮 */}
      <button
        onClick={() => setShowHistory(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        History
      </button>

      {/* 历史弹窗 */}
      <PromptHistoryDialog
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectPrompt={(prompt) => setPromptText(prompt)}
      />
    </div>
  );
}
```

---

## 📊 MVP vs 完整版对比

| 功能 | MVP | 完整版 | 节省时间 |
|------|-----|--------|----------|
| 数据库表 | 1 张 | 3 张 | ✅ 2 天 |
| API 路由 | 3 个 | 10+ 个 | ✅ 3 天 |
| React Hooks | 1 个 | 3 个 | ✅ 2 天 |
| UI 组件 | 2 个 | 8 个 | ✅ 4 天 |
| 文件夹管理 | ❌ | ✅ | ✅ 3 天 |
| 标签系统 | ❌ | ✅ | ✅ 2 天 |
| 全文搜索 | 简单 ILIKE | PostgreSQL FTS | ✅ 1 天 |
| 使用统计 | ❌ | ✅ | ✅ 1 天 |
| 图片关联 | 单张 | 多对多 | ✅ 2 天 |
| **总开发时间** | **3-5 天** | **20+ 天** | **✅ 15 天** |

---

## 🚀 MVP 部署清单

### Day 1-2: 后端
- [ ] 在 Supabase 执行简化版 SQL
- [ ] 实现 3 个 API 路由（GET, POST, DELETE）
- [ ] 测试 API 认证和权限

### Day 3: 前端
- [ ] 创建 `usePrompts` hook
- [ ] 创建 `PromptHistoryDialog` 组件
- [ ] 在图片编辑器中集成历史按钮

### Day 4-5: 测试 & 优化
- [ ] 端到端测试核心流程
- [ ] 修复 bug
- [ ] 性能优化（如需要）
- [ ] 上线灰度测试

---

## 📈 MVP 成功指标

**验证周期**: 2 周

| 指标 | 目标 | 测量方法 |
|------|------|----------|
| **采用率** | 30% 用户保存至少 1 个提示词 | 数据库统计 |
| **复用率** | 20% 保存的提示词被重复使用 | 点击"Use"次数 |
| **留存** | 使用历史功能的用户 7 日留存 +10% | 对比实验 |

**决策点**:
- ✅ **通过**: 指标达标 → 开发完整版
- ❌ **未通过**: 指标不达标 → 暂停功能或重新设计

---

## 🔄 V2 升级路径

如果 MVP 验证成功，按优先级依次添加：

### P0 (必需)
1. 文件夹管理
2. 标签系统
3. 编辑提示词

### P1 (重要)
4. 使用统计和排序
5. 收藏功能
6. 完整的图片关联展示

### P2 (可选)
7. 批量操作
8. 导出/导入
9. 提示词模板
10. 分享功能

---

## 💰 成本效益分析

### MVP 成本
- **开发**: 3-5 天（1 人）
- **测试**: 1-2 天
- **总计**: 4-7 天

### 收益
- ✅ 快速验证用户需求
- ✅ 低成本试错
- ✅ 更快上线获取反馈
- ✅ 避免过度开发

### ROI 计算
```
如果 MVP 失败:
  损失: 1 周工作量
  避免: 3 周无效开发
  净收益: 2 周

如果 MVP 成功:
  投入: 1 周 MVP
  后续: 2 周完整版增量开发
  总计: 3 周（vs 4 周从零开始）
```

---

## 📝 实现检查清单

### 准备阶段
- [ ] 阅读完整 MVP 方案
- [ ] 理解 MVP 与完整版的区别
- [ ] 准备开发环境

### 开发阶段
- [ ] 执行 SQL 创建 `saved_prompts` 表
- [ ] 实现 `/api/prompts` 路由（GET, POST, DELETE）
- [ ] 实现 `/api/prompts/search` 路由
- [ ] 创建 `usePrompts` hook
- [ ] 创建 `PromptHistoryDialog` 组件
- [ ] 在图片编辑器集成历史按钮
- [ ] 自动保存提示词逻辑

### 测试阶段
- [ ] 测试保存提示词
- [ ] 测试搜索功能
- [ ] 测试复用提示词
- [ ] 测试删除提示词
- [ ] 测试移动端适配

### 上线阶段
- [ ] 灰度发布（10% 用户）
- [ ] 监控错误率
- [ ] 收集用户反馈
- [ ] 决策是否继续完整版

---

## 🎯 Quick Start

```bash
# 1. 创建 MVP 分支
git checkout -b feature/prompt-history-mvp

# 2. 应用数据库 Schema（Supabase SQL Editor）
# 复制上面的简化版 SQL 并执行

# 3. 创建目录结构
mkdir -p src/app/api/prompts/search
mkdir -p src/components/prompts
mkdir -p src/hooks

# 4. 复制上面的代码到对应文件

# 5. 测试
npm run dev
# 访问图片编辑器，点击 History 按钮

# 6. 提交
git add .
git commit -m "feat: add prompt history MVP"
```

---

**文档版本**: 1.0 (MVP)
**预计开发时间**: 3-5 天
**验证周期**: 2 周
**决策点**: MVP 成功率 > 30%

🚀 **推荐**: 先实现 MVP，验证成功后再开发完整版！
