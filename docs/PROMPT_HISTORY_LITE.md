# Prompt History Lite - 精简实用版方案

## 🎯 定位

**介于 MVP 和完整版之间的最佳平衡点**

- ✅ 比 MVP 功能更完善（有文件夹和标签）
- ✅ 比完整版更简单（去掉不必要的复杂功能）
- ✅ 开发时间：7-10 天（vs MVP 3-5 天，完整版 20+ 天）

---

## ✂️ 简化策略

### ✅ 保留核心功能

1. **文件夹管理** - 用户需要组织提示词
2. **标签系统** - 便于搜索和分类
3. **三栏布局** - 更好的浏览体验
4. **基础搜索** - 简单但够用
5. **提示词复用** - 核心价值

### ❌ 删减的功能（可在 V2 添加）

| 功能 | 理由 | 节省时间 |
|------|------|----------|
| ~~使用统计追踪~~ | 初期用户不关心使用次数 | 1 天 |
| ~~收藏功能~~ | 文件夹已经够用 | 1 天 |
| ~~拖拽排序~~ | 按时间排序即可 | 2 天 |
| ~~图片多对多关联~~ | 只显示最新一张图 | 2 天 |
| ~~负面提示词~~ | 大部分用户不用 | 0.5 天 |
| ~~生成参数保存~~ | 配置太复杂 | 1 天 |
| ~~批量操作~~ | 使用频率低 | 2 天 |
| ~~导出/导入~~ | 初期不需要 | 2 天 |
| ~~全文搜索(FTS)~~ | 用 ILIKE 足够 | 1 天 |
| ~~提示词模板~~ | 太超前 | 3 天 |

**总节省**: ~15 天 → 开发时间从 20+ 天降到 7-10 天

---

## 🗄️ 数据库架构（精简版）

### 表 1: `prompt_folders`（保留）

```sql
CREATE TABLE public.prompt_folders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text,                      -- 简单的 emoji
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT prompt_folders_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_folders_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT prompt_folders_user_name_unique UNIQUE (user_id, name)
);

-- 删减字段: description, color, is_system, updated_at
```

**简化点**：
- ❌ 删除 `description` - 名字已经够用
- ❌ 删除 `color` - 统一 UI 颜色
- ❌ 删除 `is_system` - 不需要系统文件夹
- ❌ 删除 `updated_at` - created_at 够用

### 表 2: `saved_prompts`（简化）

```sql
CREATE TABLE public.saved_prompts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  folder_id uuid,                 -- 可以为空（未分类）

  -- 核心内容
  title text NOT NULL,            -- 用户可编辑的标题
  prompt_text text NOT NULL,
  tags text[] DEFAULT '{}',

  -- 关联图片（简化为单张）
  thumbnail_url text,
  last_image_id uuid,

  -- 时间戳
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT saved_prompts_pkey PRIMARY KEY (id),
  CONSTRAINT saved_prompts_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT saved_prompts_folder_id_fkey FOREIGN KEY (folder_id)
    REFERENCES public.prompt_folders(id) ON DELETE SET NULL,
  CONSTRAINT saved_prompts_last_image_id_fkey FOREIGN KEY (last_image_id)
    REFERENCES public.images(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_saved_prompts_user_id ON public.saved_prompts(user_id, created_at DESC);
CREATE INDEX idx_saved_prompts_folder_id ON public.saved_prompts(folder_id);
CREATE INDEX idx_saved_prompts_tags ON public.saved_prompts USING gin(tags);

-- 删减字段: negative_prompt, style, dimensions, model_name, seed, cfg_scale,
--          steps, usage_count, last_used_at, is_favorite, is_archived, updated_at
```

**简化点**：
- ❌ 删除所有生成参数（style, dimensions, seed 等）- 太复杂
- ❌ 删除使用统计（usage_count, last_used_at）- 初期不需要
- ❌ 删除收藏功能（is_favorite）- 用文件夹代替
- ❌ 删除软删除（is_archived）- 直接硬删除
- ❌ 删除 negative_prompt - 大部分用户不用
- ✅ 保留 tags - 这个很有用

### 表 3: ❌ 删除 `prompt_images` 表

**理由**:
- 只保留最新一张图的引用（last_image_id）
- 不需要多对多关联
- 节省 2 天开发时间

---

## 📁 精简文件结构

```
src/
├── app/
│   ├── prompts/
│   │   └── page.tsx                    # 主页面（三栏布局）
│   └── api/
│       └── prompts/
│           ├── folders/
│           │   ├── route.ts            # GET, POST 文件夹
│           │   └── [id]/
│           │       └── route.ts        # PUT, DELETE 文件夹
│           └── saved/
│               ├── route.ts            # GET, POST 提示词
│               └── [id]/
│                   └── route.ts        # GET, PUT, DELETE 提示词
│
├── components/
│   └── prompts/
│       ├── PromptLayout.tsx            # 三栏布局容器
│       ├── FolderSidebar.tsx           # 左侧文件夹列表
│       ├── PromptList.tsx              # 中间提示词列表
│       ├── PromptDetails.tsx           # 右侧详情面板
│       └── PromptSearchBar.tsx         # 搜索框
│
└── hooks/
    ├── usePromptFolders.ts             # 文件夹 CRUD
    └── usePrompts.ts                   # 提示词 CRUD + 搜索
```

**删减的文件**:
- ❌ `PromptCard.tsx` - 直接在 PromptList 中实现
- ❌ `NewFolderDialog.tsx` - 用简单的 prompt() 代替
- ❌ `EditPromptDialog.tsx` - 直接在详情面板编辑
- ❌ `GeneratedImagesGrid.tsx` - 只显示单张图
- ❌ `usePromptSearch.ts` - 合并到 usePrompts

---

## 🔧 核心实现（精简版）

### 1. 数据库 SQL（完整版）

```sql
-- =====================================================
-- PROMPT HISTORY LITE - Database Schema
-- =====================================================

-- 1. Folders Table (简化)
CREATE TABLE public.prompt_folders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text DEFAULT '📁',
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT prompt_folders_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_folders_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT prompt_folders_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX idx_prompt_folders_user_id ON public.prompt_folders(user_id, sort_order);

-- 2. Saved Prompts Table (简化)
CREATE TABLE public.saved_prompts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  folder_id uuid,

  title text NOT NULL,
  prompt_text text NOT NULL,
  tags text[] DEFAULT '{}',

  thumbnail_url text,
  last_image_id uuid,

  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT saved_prompts_pkey PRIMARY KEY (id),
  CONSTRAINT saved_prompts_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT saved_prompts_folder_id_fkey FOREIGN KEY (folder_id)
    REFERENCES public.prompt_folders(id) ON DELETE SET NULL,
  CONSTRAINT saved_prompts_last_image_id_fkey FOREIGN KEY (last_image_id)
    REFERENCES public.images(id) ON DELETE SET NULL
);

CREATE INDEX idx_saved_prompts_user_id ON public.saved_prompts(user_id, created_at DESC);
CREATE INDEX idx_saved_prompts_folder_id ON public.saved_prompts(folder_id);
CREATE INDEX idx_saved_prompts_tags ON public.saved_prompts USING gin(tags);

-- 3. RLS Policies
ALTER TABLE public.prompt_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own folders" ON public.prompt_folders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own prompts" ON public.saved_prompts
  FOR ALL USING (auth.uid() = user_id);

-- 4. Simple Search Function (ILIKE - 不用全文搜索)
CREATE OR REPLACE FUNCTION search_prompts_lite(
  user_uuid uuid,
  search_query text
)
RETURNS TABLE (
  id uuid,
  title text,
  prompt_text text,
  tags text[],
  thumbnail_url text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.title,
    sp.prompt_text,
    sp.tags,
    sp.thumbnail_url,
    sp.created_at
  FROM public.saved_prompts sp
  WHERE
    sp.user_id = user_uuid
    AND (
      sp.title ILIKE '%' || search_query || '%'
      OR sp.prompt_text ILIKE '%' || search_query || '%'
      OR search_query = ANY(sp.tags)
    )
  ORDER BY sp.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. API 路由（简化版）

只需要 4 个路由文件：

#### `/api/prompts/folders/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';

// GET - 获取文件夹列表
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    const supabase = createServiceClient();

    const { data: folders, error } = await supabase
      .from('prompt_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order');

    if (error) throw error;
    return NextResponse.json({ success: true, folders });
  } catch (error) {
    return handleError(error);
  }
}

// POST - 创建文件夹
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    const { name, icon } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: folder, error } = await supabase
      .from('prompt_folders')
      .insert({ user_id: user.id, name, icon: icon || '📁' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, folder });
  } catch (error) {
    return handleError(error);
  }
}

// 辅助函数
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) throw new Error('No token');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid token');
  return user;
}

function handleError(error: any) {
  console.error('API Error:', error);
  return NextResponse.json(
    { error: error.message || 'Internal error' },
    { status: 500 }
  );
}
```

#### `/api/prompts/folders/[id]/route.ts`
```typescript
// PUT - 更新文件夹
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    const { name, icon } = await request.json();

    const supabase = createServiceClient();
    const { data: folder, error } = await supabase
      .from('prompt_folders')
      .update({ name, icon })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, folder });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE - 删除文件夹
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    const supabase = createServiceClient();

    // 删除文件夹（提示词会自动设置 folder_id = NULL）
    const { error } = await supabase
      .from('prompt_folders')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
```

#### `/api/prompts/saved/route.ts`
```typescript
// GET - 获取提示词列表（支持过滤和搜索）
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folder_id');
    const search = searchParams.get('search');

    const supabase = createServiceClient();

    // 如果有搜索词，使用搜索函数
    if (search) {
      const { data: prompts, error } = await supabase
        .rpc('search_prompts_lite', {
          user_uuid: user.id,
          search_query: search
        });

      if (error) throw error;
      return NextResponse.json({ success: true, prompts });
    }

    // 否则按文件夹过滤
    let query = supabase
      .from('saved_prompts')
      .select('*')
      .eq('user_id', user.id);

    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data: prompts, error } = await query
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ success: true, prompts });
  } catch (error) {
    return handleError(error);
  }
}

// POST - 保存提示词
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    const { folder_id, title, prompt_text, tags, thumbnail_url, last_image_id } =
      await request.json();

    if (!title || !prompt_text) {
      return NextResponse.json(
        { error: 'Title and prompt required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: prompt, error } = await supabase
      .from('saved_prompts')
      .insert({
        user_id: user.id,
        folder_id,
        title,
        prompt_text,
        tags: tags || [],
        thumbnail_url,
        last_image_id
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    return handleError(error);
  }
}
```

#### `/api/prompts/saved/[id]/route.ts`
```typescript
// GET - 获取单个提示词详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    const supabase = createServiceClient();

    const { data: prompt, error } = await supabase
      .from('saved_prompts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    return handleError(error);
  }
}

// PUT - 更新提示词
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    const updates = await request.json();

    const supabase = createServiceClient();
    const { data: prompt, error } = await supabase
      .from('saved_prompts')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE - 删除提示词
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('saved_prompts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
```

---

## 📊 功能对比表

| 功能 | MVP | Lite | 完整版 |
|------|-----|------|--------|
| **开发时间** | 3-5 天 | 7-10 天 | 20+ 天 |
| **数据库表** | 1 张 | 2 张 | 3 张 |
| **文件夹管理** | ❌ | ✅ | ✅ |
| **标签系统** | ❌ | ✅ 简单 | ✅ 高级 |
| **搜索功能** | ILIKE | ILIKE | 全文搜索 |
| **UI 布局** | 弹窗 | 三栏 | 三栏 |
| **图片关联** | 单张 | 单张 | 多张 |
| **使用统计** | ❌ | ❌ | ✅ |
| **收藏功能** | ❌ | ❌ | ✅ |
| **拖拽排序** | ❌ | ❌ | ✅ |
| **生成参数** | ❌ | ❌ | ✅ |
| **批量操作** | ❌ | ❌ | ✅ |
| **导出导入** | ❌ | ❌ | ✅ |

---

## 🎯 Lite 版推荐理由

### ✅ 优势

1. **功能完整但不臃肿**
   - 有文件夹组织能力
   - 有标签搜索功能
   - 有良好的 UI 体验

2. **开发成本合理**
   - 只需 7-10 天
   - 是完整版的 1/3 时间

3. **可扩展性强**
   - 数据库结构完整
   - 后续升级容易

4. **用户价值明确**
   - 满足 80% 的使用场景
   - 不会功能过载

### ⚠️ 权衡

- 没有高级统计功能
- 没有复杂的图片关联
- 搜索不是最优（但够用）

---

## 📈 实施时间表（7-10 天）

### Week 1: 后端 (3-4 天)
- **Day 1**: 数据库 Schema + RLS 策略
- **Day 2-3**: 实现 4 个 API 路由
- **Day 4**: API 测试

### Week 2: 前端 (4-6 天)
- **Day 5-6**: React Hooks (usePromptFolders + usePrompts)
- **Day 7-8**: UI 组件 (三栏布局 + 4 个主要组件)
- **Day 9**: 集成到图片编辑器
- **Day 10**: 测试 + Bug 修复 + 上线

---

## 🚀 Quick Start

```bash
# 1. 创建分支
git checkout -b feature/prompt-history-lite

# 2. 应用数据库（在 Supabase SQL Editor）
# 复制上面的 SQL

# 3. 创建目录
mkdir -p src/app/api/prompts/{folders/[id],saved/[id]}
mkdir -p src/components/prompts
mkdir -p src/hooks

# 4. 复制 API 代码到对应文件

# 5. 开发 React Hooks 和 UI 组件

# 6. 测试
npm run dev

# 7. 提交
git add .
git commit -m "feat: add prompt history lite version"
```

---

## 💡 总结

**Lite 版是最佳选择，因为：**

✅ **比 MVP 功能更完善** - 有文件夹和标签
✅ **比完整版更实用** - 去掉不必要的复杂功能
✅ **开发成本合理** - 7-10 天 vs 20+ 天
✅ **满足 80% 需求** - 核心功能齐全
✅ **易于扩展** - 后续可升级到完整版

**推荐路线**:
```
MVP (3-5天) → 验证需求 → Lite (7-10天) → 成熟后 → 完整版 (按需添加)
```

或者直接实施 Lite 版，跳过 MVP！

---

**文档版本**: 1.0 (Lite)
**推荐指数**: ⭐⭐⭐⭐⭐
**开发时间**: 7-10 天
**适用场景**: 大部分产品的最佳选择
