# Claude Code Memory & Best Practices

## File Download System Best Practices

### Problem: CORS Issues with Remote File Downloads
When downloading files from cloud storage (like R2) directly from the frontend, browsers block requests due to CORS policies.

### Solution Architecture: Download Proxy API Pattern

#### 1. **Custom Hook Pattern (`useImageDownload`)**
```typescript
// Extract download logic into reusable hook
const { downloadImage, canDownloadOriginal } = useImageDownload({
  creditsRequired: 1,
  onSuccess: (type) => console.log(`Downloaded ${type}`),
  onError: (error, type) => console.error(`Failed ${type}: ${error}`)
});
```

**Benefits:**
- Centralized download logic
- Reusable across components
- Built-in error handling
- Credit validation

#### 2. **Download Proxy API (`/api/download-image`)**
```typescript
// Server-side proxy to handle CORS and authentication
POST /api/download-image
{
  "imageUrl": "https://storage.provider.com/image.png",
  "type": "preview" | "original", 
  "filename": "result.png"
}
```

**Features:**
- Bypasses CORS restrictions (server-to-server)
- Integrates authentication verification
- Handles credit deduction atomically
- Returns proper download headers (`Content-Disposition: attachment`)

#### 3. **Reusable Components**
```jsx
// Pre-styled components for common scenarios
<PreviewDownloadButton imageUrl={url} filename="image.png" />
<OriginalDownloadButton imageUrl={url} creditsRequired={1} />
```

### Implementation Details

#### Libraries Used:
- **`react-hot-toast`**: User feedback with toast notifications
- **`file-saver`**: Reliable cross-browser file downloads
- **Native Fetch API**: Server-side image retrieval

#### Authentication Flow:
1. Frontend validates user login status
2. API validates JWT token
3. Credit check and deduction in single transaction
4. Image proxy and download

#### Error Handling:
- 401: Authentication required → Redirect to `/pricing`
- 402: Insufficient credits → Redirect to `/pricing`  
- 500: Server errors → Toast error message
- Network errors → Graceful fallback

### Key Patterns:

1. **Separation of Concerns**: 
   - Hook handles download logic
   - Component handles UI/UX
   - API handles server operations

2. **Progressive Enhancement**:
   - Preview downloads work without auth
   - Original downloads require authentication + credits

3. **User Feedback**:
   - Loading states during processing
   - Success/error toast messages
   - Clear credit status indication

4. **Security**:
   - Server-side credit validation
   - JWT token verification
   - No direct cloud storage exposure

### Reusability:
This pattern can be extended to any paid download feature:
- Different credit costs
- Multiple file formats
- Various quality tiers
- Different storage backends

---

## Navigation & UI Best Practices

### CSS-Only Dropdown Hover Pattern
Modern approach for dropdown navigation menus using Tailwind CSS without JavaScript state management.

#### Problem: JavaScript Hover State Issues
Traditional dropdown implementations using `onMouseEnter`/`onMouseLeave` JavaScript events can cause:
- Performance overhead from state updates
- Event timing conflicts when moving between elements
- Complex state management for multiple dropdowns
- Hover interruptions when mouse moves to submenu

#### Solution: Tailwind Group Classes

```tsx
// ✅ Best Practice - CSS-only hover
<div className="relative group">
  <Link 
    href={item.href} 
    className="text-gray-600 hover:text-gray-900 transition-colors font-medium flex items-center px-3 py-2"
  >
    {item.label}
    <svg className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </Link>
  
  {/* Dropdown Menu - Always rendered, CSS controls visibility */}
  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
    {/* Dropdown items */}
  </div>
</div>
```

**Key Techniques:**
1. **`group` class**: Parent container enables group-based hover targeting
2. **`group-hover:opacity-100 group-hover:visible`**: Child elements respond to parent hover
3. **Always render dropdown**: Menu exists in DOM, CSS controls visibility
4. **Smooth transitions**: `transition-all duration-200 ease-in-out`
5. **Interactive feedback**: Arrow rotation `group-hover:rotate-180`

#### Hover Area Optimization

```tsx
// Expand clickable/hoverable area
className="px-3 py-2" // 12px horizontal, 8px vertical padding
```

**Benefits of CSS-Only Approach:**
- **Performance**: No JavaScript state updates or re-renders
- **Reliability**: No event timing conflicts or hover interruptions  
- **Maintainability**: Simpler code without state management
- **Accessibility**: Consistent behavior across devices
- **Responsive**: Works naturally on touch devices

#### Migration Pattern

```tsx
// ❌ Before - JavaScript hover state
const [dropdownOpen, setDropdownOpen] = useState(false);

<div onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
  <Link>Menu Item</Link>
  {dropdownOpen && <div>Dropdown</div>}
</div>

// ✅ After - CSS-only hover
<div className="relative group">
  <Link>Menu Item</Link>
  <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible">
    Dropdown
  </div>
</div>
```

This pattern is the modern standard for dropdown navigation and should be used for all hover-based UI interactions.

---

## Markdown Blog System Best Practices

### Problem: Static Blog Content Management
Traditional blog systems require creating individual React components for each blog post, leading to:
- Manual conversion from Markdown to JSX
- Repetitive component creation
- Difficult content management
- No separation between content and presentation

### Solution Architecture: Dynamic Markdown-Driven Blog System

#### 1. **File Structure**
```
content/
  blog/
    your-article-name.md          ← Create new articles here
    ai-background-removal-guide.md
    future-of-creative-tools.md
    when-photos-dont-lie-stops-making-sense.md

src/
  app/
    blog/
      [slug]/
        page.tsx                  ← Dynamic route handles all posts
      page.tsx                    ← Blog listing page
  lib/
    blog.ts                       ← Content management utilities
```

#### 2. **Markdown File Format**
```markdown
---
title: "Your Article Title"
excerpt: "Brief description for blog listing and SEO"
publishedAt: "2025-09-15"
readTime: "5 min read"
category: "AI Technology"
featured: false
image: "/images/blogs/your-image.png"
---

# Your Article Content

Write your content using standard Markdown syntax...

## Chapter Headings
- List items
- **Bold text**
- [Links](https://example.com)

> Blockquotes for callouts

```code
console.log('Code blocks');
```
```

#### 3. **Dynamic Content Loading**
```typescript
// Blog utility functions (src/lib/blog.ts)
export function getAllPosts(): BlogPost[] {
  const slugs = getAllPostSlugs()
  return slugs
    .map(slug => getPostBySlug(slug))
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export function getFeaturedPost(): BlogPost | null {
  return getAllPosts().find(post => post.featured) || null
}
```

#### 4. **Blog Listing Page (Dynamic)**
```typescript
// src/app/blog/page.tsx
import { getFeaturedPost, getRegularPosts } from '@/lib/blog'

export default function BlogPage() {
  const featuredPost = getFeaturedPost()      // Dynamic from Markdown
  const regularPosts = getRegularPosts()      // Dynamic from Markdown
  
  return (
    // Render dynamic content...
  )
}
```

#### 5. **Dynamic Route Handler**
```typescript
// src/app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const slugs = getAllPostSlugs()
  return slugs.map((slug: string) => ({ slug }))
}

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  // Render post content with ReactMarkdown...
}
```

### Implementation Details

#### Dependencies Used:
- **`@next/mdx`**: Next.js MDX support
- **`gray-matter`**: Frontmatter parsing 
- **`react-markdown`**: Markdown rendering
- **`remark-gfm`**: GitHub Flavored Markdown support

#### Key Features:
1. **Automatic Route Generation**: Files in `content/blog/` automatically become `/blog/slug` pages
2. **Type Safety**: TypeScript interfaces for blog post structure
3. **SEO Optimization**: Automatic metadata generation from frontmatter
4. **Cover Images**: Support for hero images with overlay text
5. **Categorization**: Featured posts vs regular posts
6. **Responsive Design**: Mobile-optimized with banana yellow theme

#### Content Creation Workflow:
1. Create `.md` file in `content/blog/`
2. Add frontmatter metadata
3. Write content in Markdown
4. Add cover image to `public/images/blogs/` (optional)
5. File automatically appears in blog listings

### Benefits:

1. **Content-First Approach**:
   - Writers focus on content, not code
   - Standard Markdown syntax
   - Version control for content

2. **Zero-Code Publishing**:
   - No React components to create
   - No manual routing setup
   - Automatic SEO optimization

3. **Scalable Architecture**:
   - Add unlimited posts without code changes
   - Consistent styling across all posts
   - Easy content migration

4. **Developer Experience**:
   - Hot reload during development
   - Type-safe content handling
   - Build-time validation

### Migration from Static Components:

**❌ Before (Static):**
```javascript
// Manual component for each post
const blogPosts = [
  { title: "Article 1", ... },  // Hard-coded
  { title: "Article 2", ... },  // Hard-coded
]
```

**✅ After (Dynamic):**
```javascript
// Automatic loading from filesystem
const featuredPost = getFeaturedPost()    // From Markdown files
const regularPosts = getRegularPosts()    // From Markdown files
```

### File Naming Conventions:
- Use lowercase letters
- Separate words with hyphens: `complete-guide-to-ai-editing.md`
- Avoid special characters
- Filename becomes the URL slug

This system provides a modern, maintainable approach to blog content management that scales effortlessly and separates content from presentation logic.

---

## Project Structure Notes

### Authentication System
- Uses Supabase auth with Google OAuth
- AuthContext provides `user`, `profile`, `refreshProfile`
- User profile includes `credits` field

### Credit System
- Transactions stored in `credit_transactions` table
- Negative amounts for usage, positive for purchases
- Service client bypasses RLS for server operations

### Testing Commands
- Build: `npm run build`
- Lint: `npm run lint` 
- Type check: `npm run type-check`