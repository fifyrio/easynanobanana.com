# Prompt History System - Architecture Diagram

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐  │
│  │   Folders    │   │ Prompt List  │   │   Prompt Details         │  │
│  │   Sidebar    │   │   (Middle)   │   │   (Right Panel)          │  │
│  │              │   │              │   │                          │  │
│  │ • All        │   │ [Search Bar] │   │  Title: "Cyberpunk..."   │  │
│  │ • Character  │   │              │   │                          │  │
│  │ • Sci-Fi     │   │ ┌──────────┐ │   │  Prompt: "A highly..."   │  │
│  │ • UI Elem.   │   │ │ Prompt 1 │ │   │  Tags: [cyber][neon]     │  │
│  │ • Abstract   │   │ │ Tags...  │ │   │                          │  │
│  │              │   │ └──────────┘ │   │  [Generate] [Copy]       │  │
│  │ [+ New]      │   │ ┌──────────┐ │   │  [Edit] [Delete]         │  │
│  └──────────────┘   │ │ Prompt 2 │ │   │                          │  │
│                     │ │ Tags...  │ │   │  Generated Images:       │  │
│                     │ └──────────┘ │   │  [🖼️] [🖼️] [🖼️] [🖼️]      │  │
│                     └──────────────┘   └──────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        REACT HOOKS LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  usePromptFolders()         usePrompts()           usePromptSearch()   │
│  ├─ folders[]               ├─ prompts[]           ├─ query            │
│  ├─ loading                 ├─ selectedPrompt      ├─ results[]        │
│  ├─ createFolder()          ├─ loading             └─ search()         │
│  ├─ updateFolder()          ├─ savePrompt()                            │
│  ├─ deleteFolder()          ├─ updatePrompt()                          │
│  └─ refetch()               ├─ deletePrompt()                          │
│                             ├─ toggleFavorite()                        │
│                             └─ incrementUsage()                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API ROUTES LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  /api/prompts/                                                          │
│  │                                                                      │
│  ├─ folders/                       ├─ saved/                           │
│  │  ├─ GET  (list folders)         │  ├─ GET    (list prompts)        │
│  │  ├─ POST (create folder)        │  ├─ POST   (save prompt)         │
│  │  └─ [id]/                       │  └─ [id]/                        │
│  │     ├─ PUT    (update)          │     ├─ GET    (details)          │
│  │     └─ DELETE (delete)          │     ├─ PUT    (update)           │
│  │                                 │     ├─ DELETE (delete)           │
│  └─ search/                        │     └─ images/                   │
│     └─ POST (full-text search)     │        └─ GET (get images)       │
│                                                                         │
│  🔒 Authentication: JWT Bearer Token                                    │
│  🛡️ Authorization: User-specific RLS policies                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐         ┌────────────────┐                      │
│  │ prompt_folders   │         │ saved_prompts  │                      │
│  ├──────────────────┤         ├────────────────┤                      │
│  │ • id             │         │ • id           │                      │
│  │ • user_id   ──┐  │         │ • user_id   ─┐ │                      │
│  │ • name         │  │         │ • folder_id ─┼─┤                      │
│  │ • icon         │  │         │ • title       │ │                      │
│  │ • color        │  │         │ • prompt_text │ │                      │
│  │ • sort_order   │  │         │ • tags[]      │ │                      │
│  └────────────────┘  │         │ • usage_count │ │                      │
│          │            │         │ • is_favorite │ │                      │
│          └────────────┘         └───────┬───────┘ │                      │
│                                         │         │                      │
│                                         ▼         │                      │
│                          ┌──────────────────────┐│                      │
│                          │  prompt_images       ││                      │
│                          │  (junction table)    ││                      │
│                          ├──────────────────────┤│                      │
│                          │ • prompt_id      ────┘│                      │
│                          │ • image_id      ────┐ │                      │
│                          └─────────────────────┼─┘                      │
│                                                │                        │
│                                                ▼                        │
│  ┌─────────────────────────────────────────────────┐                   │
│  │ images (existing table)                         │                   │
│  ├─────────────────────────────────────────────────┤                   │
│  │ • id                                            │                   │
│  │ • user_id                                       │                   │
│  │ • prompt (original prompt used)                 │                   │
│  │ • processed_image_url                           │                   │
│  │ • saved_prompt_id (NEW - optional reference)    │                   │
│  │ • created_at                                    │                   │
│  └─────────────────────────────────────────────────┘                   │
│                                                                         │
│  🔍 Indexes:                                                            │
│  • GIN index on saved_prompts.tags                                     │
│  • Full-text search index on (title + prompt_text + tags)             │
│  • Composite index on (user_id, created_at DESC)                      │
│                                                                         │
│  🔒 RLS Policies: Users can only access their own data                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagrams

### 1. Save New Prompt Flow

```
┌─────────┐
│  USER   │
└────┬────┘
     │ 1. Generates image with prompt
     ▼
┌─────────────────┐
│ Image Editor UI │
└────┬────────────┘
     │ 2. Click "Save Prompt" button
     ▼
┌──────────────────┐
│  savePrompt()    │ Hook function
└────┬─────────────┘
     │ 3. POST /api/prompts/saved
     ▼
┌───────────────────────┐
│ API Route Handler     │
├───────────────────────┤
│ • Verify JWT token    │
│ • Extract user.id     │
│ • Validate input      │
└────┬──────────────────┘
     │ 4. Insert into saved_prompts
     ▼
┌──────────────────────┐
│ Supabase Database    │
│ INSERT INTO          │
│ saved_prompts        │
└────┬─────────────────┘
     │ 5. Return prompt ID
     ▼
┌──────────────────────┐
│ Link to Image        │
│ INSERT INTO          │
│ prompt_images        │
│ (prompt_id, image_id)│
└────┬─────────────────┘
     │ 6. Success response
     ▼
┌──────────────────────┐
│ Update UI            │
│ • Show success toast │
│ • Refresh prompt list│
└──────────────────────┘
```

### 2. Search Prompts Flow

```
┌─────────┐
│  USER   │
└────┬────┘
     │ 1. Types in search bar: "cyberpunk"
     ▼
┌──────────────────┐
│ PromptSearchBar  │
└────┬─────────────┘
     │ 2. Debounced (300ms)
     ▼
┌──────────────────┐
│ usePromptSearch()│
└────┬─────────────┘
     │ 3. POST /api/prompts/search
     │    Body: { query: "cyberpunk" }
     ▼
┌───────────────────────────┐
│ Search API Handler        │
├───────────────────────────┤
│ • Verify authentication   │
│ • Call search_prompts()   │
│   PostgreSQL function     │
└────┬──────────────────────┘
     │ 4. Full-text search query
     ▼
┌──────────────────────────────────────┐
│ Database Full-Text Search            │
│ SELECT * FROM saved_prompts          │
│ WHERE to_tsvector(title || prompt)   │
│       @@ plainto_tsquery('cyberpunk')│
│ ORDER BY ts_rank DESC                │
└────┬─────────────────────────────────┘
     │ 5. Return ranked results
     ▼
┌──────────────────────┐
│ Display Results      │
│ • Highlight matches  │
│ • Show relevance     │
└──────────────────────┘
```

### 3. Regenerate from Saved Prompt Flow

```
┌─────────┐
│  USER   │
└────┬────┘
     │ 1. Click on saved prompt
     ▼
┌──────────────────┐
│ PromptDetails    │
│ • Show full text │
│ • Show images    │
└────┬─────────────┘
     │ 2. Click "Generate" button
     ▼
┌──────────────────────┐
│ handleRegenerate()   │
├──────────────────────┤
│ • incrementUsage()   │
│ • Copy prompt text   │
└────┬─────────────────┘
     │ 3. Update usage count
     ▼
┌──────────────────────┐
│ PUT /api/prompts/    │
│ saved/[id]           │
│ usage_count++        │
└────┬─────────────────┘
     │ 4. Navigate to editor
     ▼
┌──────────────────────┐
│ Image Editor         │
│ • Pre-fill prompt    │
│ • Generate image     │
└────┬─────────────────┘
     │ 5. Link new image to prompt
     ▼
┌──────────────────────┐
│ prompt_images        │
│ INSERT association   │
└──────────────────────┘
```

---

## 🔄 State Management

### Local State (Component-level)
- Selected folder
- Selected prompt
- Search query
- Dialog open/closed states

### Server State (React Query)
```typescript
// Cached with React Query
const { data: folders } = useQuery(['folders'], fetchFolders);
const { data: prompts } = useQuery(['prompts', folderId], () => fetchPrompts(folderId));
const { data: images } = useQuery(['prompt-images', promptId], () => fetchImages(promptId));
```

### Optimistic Updates
```typescript
// Example: Toggle favorite
const mutation = useMutation(toggleFavorite, {
  onMutate: async (promptId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['prompts']);

    // Snapshot current value
    const previousPrompts = queryClient.getQueryData(['prompts']);

    // Optimistically update UI
    queryClient.setQueryData(['prompts'], (old) =>
      old.map(p => p.id === promptId ? { ...p, is_favorite: !p.is_favorite } : p)
    );

    return { previousPrompts };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['prompts'], context.previousPrompts);
  },
  onSettled: () => {
    // Refetch to sync
    queryClient.invalidateQueries(['prompts']);
  }
});
```

---

## 🔐 Security Architecture

### Authentication Flow
```
Frontend                    Backend                     Database
   │                           │                            │
   │ 1. Extract JWT token      │                            │
   │    from Supabase session  │                            │
   ├──────────────────────────►│                            │
   │                           │ 2. Parse Bearer token      │
   │                           │    from Authorization      │
   │                           │    header                  │
   │                           │                            │
   │                           │ 3. Verify JWT with         │
   │                           │    Supabase (anon key)     │
   │                           ├───────────────────────────►│
   │                           │                            │
   │                           │◄───────────────────────────┤
   │                           │ 4. Get user.id             │
   │                           │                            │
   │                           │ 5. Use service client      │
   │                           │    for DB operations       │
   │                           │    (filters by user.id)    │
   │                           ├───────────────────────────►│
   │                           │                            │
   │                           │◄───────────────────────────┤
   │                           │ 6. RLS automatically       │
   │◄──────────────────────────┤    filters results         │
   │ 7. Return data            │                            │
```

### RLS Policy Examples
```sql
-- Folders: Users can only see their own
CREATE POLICY "users_own_folders" ON prompt_folders
  FOR ALL USING (auth.uid() = user_id);

-- Prompts: Users can only see their own
CREATE POLICY "users_own_prompts" ON saved_prompts
  FOR ALL USING (auth.uid() = user_id);

-- Junction table: Users can only link their own prompts
CREATE POLICY "users_own_prompt_images" ON prompt_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saved_prompts
      WHERE id = prompt_images.prompt_id
      AND user_id = auth.uid()
    )
  );
```

---

## 📈 Scalability Considerations

### Database Performance

**Projected Load:**
- Average user: 50 saved prompts
- 100,000 users = 5 million prompts
- Each prompt linked to 3-5 images avg

**Query Optimization:**
1. **Folder list** (frequent): `O(log n)` with index on (user_id, sort_order)
2. **Prompt list** (frequent): `O(log n)` with index on (user_id, created_at)
3. **Search** (moderate): Full-text search with GIN index, `O(n log n)`
4. **Image lookup** (frequent): Junction table with indexes on both FKs

**Caching Strategy:**
- Client-side: React Query with 5-minute stale time
- Server-side: Consider Redis for frequently accessed prompts
- CDN: Cache thumbnail images

### Horizontal Scaling
- Stateless API routes (no server-side sessions)
- Database connection pooling
- Read replicas for heavy read operations

---

## 🧪 Testing Coverage

### Unit Tests
```typescript
// Hook tests
describe('usePrompts', () => {
  it('should save prompt', async () => { ... });
  it('should update prompt', async () => { ... });
  it('should delete prompt', async () => { ... });
  it('should handle errors gracefully', async () => { ... });
});

// API tests
describe('POST /api/prompts/saved', () => {
  it('should require authentication', async () => { ... });
  it('should validate input', async () => { ... });
  it('should save prompt to database', async () => { ... });
});
```

### Integration Tests
```typescript
describe('Prompt History Integration', () => {
  it('should create folder, save prompt, and retrieve', async () => {
    // 1. Create folder
    const folder = await createFolder({ name: 'Test' });

    // 2. Save prompt to folder
    const prompt = await savePrompt({
      folder_id: folder.id,
      title: 'Test Prompt',
      prompt_text: 'A beautiful sunset'
    });

    // 3. Verify retrieval
    const prompts = await getPrompts(folder.id);
    expect(prompts).toContainEqual(prompt);
  });
});
```

---

## 📚 API Documentation

### Complete API Reference

#### Folders Endpoints

**GET /api/prompts/folders**
```typescript
Response: {
  success: true,
  folders: PromptFolder[]
}
```

**POST /api/prompts/folders**
```typescript
Request: {
  name: string,
  description?: string,
  icon?: string,
  color?: string
}
Response: {
  success: true,
  folder: PromptFolder
}
```

**PUT /api/prompts/folders/[id]**
```typescript
Request: {
  name?: string,
  description?: string,
  icon?: string,
  color?: string,
  sort_order?: number
}
Response: {
  success: true,
  folder: PromptFolder
}
```

**DELETE /api/prompts/folders/[id]**
```typescript
Response: {
  success: true,
  message: 'Folder deleted'
}
```

#### Prompts Endpoints

**GET /api/prompts/saved?folder_id={uuid}&sort={field}&order={asc|desc}**
```typescript
Response: {
  success: true,
  prompts: SavedPrompt[],
  total: number
}
```

**POST /api/prompts/saved**
```typescript
Request: {
  folder_id?: string,
  title: string,
  prompt_text: string,
  tags?: string[],
  style?: string,
  dimensions?: string
}
Response: {
  success: true,
  prompt: SavedPrompt
}
```

**GET /api/prompts/saved/[id]**
```typescript
Response: {
  success: true,
  prompt: SavedPrompt
}
```

**PUT /api/prompts/saved/[id]**
```typescript
Request: Partial<SavedPrompt>
Response: {
  success: true,
  prompt: SavedPrompt
}
```

**DELETE /api/prompts/saved/[id]**
```typescript
Response: {
  success: true,
  message: 'Prompt deleted'
}
```

**GET /api/prompts/saved/[id]/images**
```typescript
Response: {
  success: true,
  images: Image[]
}
```

#### Search Endpoint

**POST /api/prompts/search**
```typescript
Request: {
  query: string,
  folder_id?: string,
  tags?: string[],
  limit?: number
}
Response: {
  success: true,
  results: SavedPrompt[],
  total: number
}
```

---

**Document Version**: 1.0
**Created**: 2025-11-14
**Status**: Architecture Approved
