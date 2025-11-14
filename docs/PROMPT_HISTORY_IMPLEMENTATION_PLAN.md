# Prompt History Feature - Implementation Plan

## 📋 Overview

This document outlines the implementation plan for the Prompt History Management System, which allows users to save, organize, search, and reuse their image generation prompts.

---

## 🎯 Feature Requirements (from UI Analysis)

### Core Features
1. **Folder Management**
   - Create/rename/delete custom folders
   - Default "All Prompts" folder
   - Drag-and-drop organization (optional)
   - Folder icons/colors

2. **Prompt Saving**
   - Save prompts with title and full text
   - Auto-tagging or manual tags
   - Associate with generated images
   - Track usage statistics

3. **Search & Filter**
   - Full-text search across prompts
   - Filter by folder
   - Filter by tags
   - Sort by date, usage, favorites

4. **Prompt Details View**
   - Display full prompt text
   - Show all generated images
   - Quick actions: Generate, Copy, Edit, Delete
   - View metadata (tags, creation date, usage count)

5. **Prompt Reuse**
   - One-click regenerate from saved prompt
   - Edit and save as new variant
   - Copy to clipboard

---

## 🗄️ Database Architecture

### New Tables

#### 1. `prompt_folders` Table
```typescript
interface PromptFolder {
  id: string;                    // UUID
  user_id: string;               // FK to user_profiles
  name: string;                  // "Character Concepts"
  description?: string;
  icon?: string;                 // Emoji or icon identifier
  color?: string;                // Hex color for UI
  sort_order: number;            // Display order
  is_system: boolean;            // true for "All Prompts"
  created_at: Date;
  updated_at: Date;
}
```

**Key Features:**
- User-specific folders with RLS
- Unique constraint on (user_id, name)
- Supports custom ordering

#### 2. `saved_prompts` Table
```typescript
interface SavedPrompt {
  id: string;                    // UUID
  user_id: string;               // FK to user_profiles
  folder_id?: string;            // FK to prompt_folders (nullable)

  // Content
  title: string;                 // "A neon-lit cyberpunk city..."
  prompt_text: string;           // Full prompt
  negative_prompt?: string;      // Optional negative prompt
  tags: string[];                // ["cyberpunk", "city", "neon"]

  // Generation parameters (for reproducibility)
  style?: string;
  dimensions?: string;
  model_name?: string;
  seed?: number;
  cfg_scale?: number;
  steps?: number;

  // Metadata
  usage_count: number;           // How many times used
  last_used_at?: Date;
  is_favorite: boolean;
  is_archived: boolean;          // Soft delete
  archived_at?: Date;

  created_at: Date;
  updated_at: Date;
}
```

**Key Features:**
- Full-text search support via GIN index
- Tag-based filtering
- Usage tracking
- Soft delete with archive flag

#### 3. `prompt_images` Table (Junction)
```typescript
interface PromptImage {
  id: string;                    // UUID
  prompt_id: string;             // FK to saved_prompts
  image_id: string;              // FK to images
  created_at: Date;
}
```

**Purpose:**
- Many-to-many relationship
- Links prompts to all generated images
- Enables "Generated Images" gallery view

#### 4. Extended `images` Table
```sql
ALTER TABLE images ADD COLUMN saved_prompt_id uuid;
```

**Purpose:**
- Quick reverse lookup from image to prompt
- Optional: can be derived from prompt_images junction

---

## 🔐 Security Considerations

### Row Level Security (RLS)

All new tables have RLS enabled with user-specific policies:

```sql
-- Users can only access their own data
CREATE POLICY "users_own_data" ON saved_prompts
  FOR ALL USING (auth.uid() = user_id);
```

### API Route Protection

All API routes must:
1. Verify JWT authentication
2. Use service client for database operations
3. Filter by authenticated user.id
4. Validate ownership before updates/deletes

---

## 📁 File Structure

```
src/
├── app/
│   ├── prompts/
│   │   └── page.tsx                    # Main prompt history page
│   ├── api/
│   │   └── prompts/
│   │       ├── folders/
│   │       │   ├── route.ts            # GET, POST folders
│   │       │   └── [id]/
│   │       │       └── route.ts        # PUT, DELETE folder
│   │       ├── saved/
│   │       │   ├── route.ts            # GET, POST saved prompts
│   │       │   └── [id]/
│   │       │       ├── route.ts        # GET, PUT, DELETE prompt
│   │       │       └── images/
│   │       │           └── route.ts    # GET images for prompt
│   │       └── search/
│   │           └── route.ts            # POST search prompts
│
├── components/
│   └── prompts/
│       ├── PromptFolderList.tsx        # Left sidebar - folders
│       ├── PromptList.tsx              # Middle panel - prompt cards
│       ├── PromptDetails.tsx           # Right panel - details view
│       ├── PromptCard.tsx              # Individual prompt item
│       ├── PromptSearchBar.tsx         # Search input
│       ├── NewFolderDialog.tsx         # Create folder modal
│       ├── EditPromptDialog.tsx        # Edit prompt modal
│       └── GeneratedImagesGrid.tsx     # Images gallery
│
├── hooks/
│   ├── usePrompts.ts                   # CRUD operations for prompts
│   ├── usePromptFolders.ts             # CRUD operations for folders
│   └── usePromptSearch.ts              # Search functionality
│
├── lib/
│   └── prompts/
│       ├── api.ts                      # API client functions
│       ├── types.ts                    # TypeScript interfaces
│       └── utils.ts                    # Helper functions
│
└── types/
    └── prompts.ts                      # Shared type definitions
```

---

## 🔧 Implementation Phases

### Phase 1: Database Setup ✅ (Completed)
- [x] Create database schema
- [x] Add RLS policies
- [x] Create utility functions
- [x] Add indexes for performance

### Phase 2: Backend API Routes (Week 1)

#### 2.1 Folder Management APIs
```typescript
// GET /api/prompts/folders - List all folders
// POST /api/prompts/folders - Create new folder
// PUT /api/prompts/folders/[id] - Update folder
// DELETE /api/prompts/folders/[id] - Delete folder
```

#### 2.2 Prompt Management APIs
```typescript
// GET /api/prompts/saved - List all prompts (with filters)
// POST /api/prompts/saved - Save new prompt
// GET /api/prompts/saved/[id] - Get prompt details
// PUT /api/prompts/saved/[id] - Update prompt
// DELETE /api/prompts/saved/[id] - Delete prompt
// GET /api/prompts/saved/[id]/images - Get generated images
```

#### 2.3 Search API
```typescript
// POST /api/prompts/search - Full-text search
// Query params: q, folder_id, tags[], sort
```

**Implementation Pattern:**
- Follow existing auth pattern from subscription system
- Use dual-client pattern (public for auth, service for data)
- Return consistent error responses
- Add request logging

### Phase 3: React Hooks (Week 1)

#### 3.1 `usePromptFolders` Hook
```typescript
export function usePromptFolders() {
  const [folders, setFolders] = useState<PromptFolder[]>([]);
  const [loading, setLoading] = useState(true);

  const createFolder = async (data: CreateFolderInput) => { ... };
  const updateFolder = async (id: string, data: UpdateFolderInput) => { ... };
  const deleteFolder = async (id: string) => { ... };

  return {
    folders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    refetch
  };
}
```

#### 3.2 `usePrompts` Hook
```typescript
export function usePrompts(folderId?: string) {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<SavedPrompt | null>(null);
  const [loading, setLoading] = useState(true);

  const savePrompt = async (data: SavePromptInput) => { ... };
  const updatePrompt = async (id: string, data: UpdatePromptInput) => { ... };
  const deletePrompt = async (id: string) => { ... };
  const toggleFavorite = async (id: string) => { ... };
  const incrementUsage = async (id: string) => { ... };

  return {
    prompts,
    selectedPrompt,
    loading,
    savePrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    incrementUsage,
    selectPrompt: setSelectedPrompt
  };
}
```

#### 3.3 `usePromptSearch` Hook
```typescript
export function usePromptSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useMemo(
    () => debounce(async (q: string) => {
      // Full-text search API call
    }, 300),
    []
  );

  useEffect(() => {
    if (query) search(query);
  }, [query, search]);

  return { query, setQuery, results, loading };
}
```

### Phase 4: UI Components (Week 2)

#### 4.1 Main Page Layout
```typescript
// src/app/prompts/page.tsx
export default function PromptsPage() {
  return (
    <div className="flex h-screen">
      {/* Left Sidebar - Folders */}
      <aside className="w-64 border-r bg-gray-50">
        <PromptFolderList />
      </aside>

      {/* Middle Panel - Prompt List */}
      <section className="w-96 border-r">
        <PromptSearchBar />
        <PromptList />
      </section>

      {/* Right Panel - Details */}
      <main className="flex-1">
        <PromptDetails />
      </main>
    </div>
  );
}
```

#### 4.2 Component Specifications

**PromptFolderList.tsx**
- Display folders with icons
- Highlight selected folder
- Show prompt count badge
- "New Folder" button at bottom
- Handle folder CRUD operations

**PromptList.tsx**
- Display prompt cards with thumbnail
- Show title and tags
- Indicate favorite status
- Handle click to select
- Infinite scroll or pagination

**PromptDetails.tsx**
- Show full prompt text
- Display all tags
- Action buttons (Generate, Copy, Edit, Delete)
- Generated images grid
- Usage statistics

**PromptSearchBar.tsx**
- Debounced search input
- Live search results
- Clear button
- Search icon

### Phase 5: Integration with Image Generation (Week 2)

#### 5.1 Auto-save Prompts
When user generates an image:
```typescript
// In image generation flow
async function generateImage(prompt: string) {
  // 1. Generate image
  const image = await generateImageAPI(prompt);

  // 2. Auto-save prompt (optional, or ask user)
  const savedPrompt = await savePrompt({
    title: generateTitleFromPrompt(prompt), // First 50 chars
    prompt_text: prompt,
    tags: extractTagsFromPrompt(prompt)
  });

  // 3. Link image to prompt
  await linkImageToPrompt(savedPrompt.id, image.id);

  return image;
}
```

#### 5.2 Regenerate from Saved Prompt
```typescript
// In PromptDetails component
async function handleRegenerate() {
  if (!selectedPrompt) return;

  // Increment usage count
  await incrementUsage(selectedPrompt.id);

  // Navigate to image editor with pre-filled prompt
  router.push(`/image-editor?prompt=${encodeURIComponent(selectedPrompt.prompt_text)}`);
}
```

### Phase 6: Advanced Features (Week 3 - Optional)

#### 6.1 Prompt Templates
- Allow marking prompts as "templates"
- Template variables: `{subject}`, `{style}`, `{mood}`
- Template marketplace or sharing (future)

#### 6.2 Prompt Variations
- Generate similar prompts using AI
- Save multiple variations of same concept
- Compare results side-by-side

#### 6.3 Batch Operations
- Move multiple prompts to folder
- Delete multiple prompts
- Export prompts as JSON

#### 6.4 Analytics
- Most used prompts
- Success rate tracking
- Tag popularity

---

## 🎨 UI/UX Specifications

### Design System

**Colors (Banana Yellow Theme):**
- Primary: `yellow-500` (#EAB308)
- Secondary: `orange-500` (#F97316)
- Background: `gray-50` (#F9FAFB)
- Borders: `gray-200` (#E5E7EB)

**Component Styling:**
- Rounded corners: `rounded-xl`
- Shadows: `shadow-sm` for cards
- Hover effects: `hover:bg-yellow-50`
- Active states: `ring-2 ring-yellow-400`

### Responsive Design

**Breakpoints:**
- Mobile: Single panel view (stack vertically)
- Tablet: Two panels (folders + list/details)
- Desktop: Three panels (full layout)

**Mobile Navigation:**
- Bottom tab bar: Folders / List / Details
- Swipe gestures for navigation

### Accessibility

- Keyboard navigation support
- ARIA labels on all interactive elements
- Focus indicators
- Screen reader friendly

---

## 🧪 Testing Strategy

### Unit Tests
- Hook logic (usePrompts, usePromptFolders)
- Utility functions (tag extraction, search)
- API client functions

### Integration Tests
- API route handlers
- Database operations
- RLS policy enforcement

### E2E Tests (Playwright/Cypress)
1. Create new folder
2. Save prompt to folder
3. Search for prompt
4. Edit prompt
5. Generate image from prompt
6. Delete prompt

---

## 📊 Performance Considerations

### Database Optimization
- [x] GIN index on tags array
- [x] Full-text search index on prompt content
- [x] Composite indexes on (user_id, created_at)
- [ ] Consider materialized views for stats

### Frontend Optimization
- Virtualized lists for large prompt collections
- Image lazy loading
- Debounced search (300ms)
- Optimistic UI updates
- React Query for caching

### Caching Strategy
```typescript
// React Query cache config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Run database migrations
- [ ] Test RLS policies with multiple users
- [ ] Verify API authentication
- [ ] Test error handling
- [ ] Performance test with large datasets

### Post-deployment
- [ ] Monitor error rates
- [ ] Check database query performance
- [ ] Gather user feedback
- [ ] Track feature usage analytics

---

## 📈 Success Metrics

### KPIs
1. **Adoption Rate**: % of users who save at least one prompt
2. **Engagement**: Average prompts saved per user
3. **Reuse Rate**: % of saved prompts that are reused
4. **Search Usage**: % of users using search feature
5. **Organization**: Average folders per user

### Target Metrics (3 months)
- 60% users save prompts
- 10+ prompts per active user
- 40% prompt reuse rate
- 70% users create custom folders

---

## 🔄 Future Enhancements

### V2 Features (Phase 2)
- [ ] Share prompts with other users
- [ ] Collaborative folders
- [ ] Prompt versioning
- [ ] AI-powered prompt suggestions
- [ ] Prompt marketplace
- [ ] Export/import functionality
- [ ] Advanced filtering (by model, style, etc.)

### V3 Features (Phase 3)
- [ ] Prompt analytics dashboard
- [ ] A/B testing different prompts
- [ ] Prompt performance scoring
- [ ] Integration with external tools
- [ ] API for third-party apps

---

## 📚 References

### Related Documentation
- [Database Schema](./prompt-history-schema.sql)
- [Authentication Best Practices](../PAYMENT_SOP.md#authentication-best-practices)
- [API Standards](../API_GUIDELINES.md)

### Similar Features
- Midjourney `/imagine` history
- DALL-E prompt library
- Stable Diffusion prompt databases

---

## 👥 Team & Timeline

### Roles
- **Backend Dev**: API routes, database (Week 1)
- **Frontend Dev**: UI components, hooks (Week 2)
- **QA**: Testing, bug fixes (Week 3)

### Milestones
- **Week 1**: Database + API complete
- **Week 2**: Basic UI functional
- **Week 3**: Polish + advanced features
- **Week 4**: Testing + deployment

---

**Document Version**: 1.0
**Created**: 2025-11-14
**Last Updated**: 2025-11-14
**Status**: Ready for Implementation
