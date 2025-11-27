# Easy Nano Banana - Project Context

## Project Overview
Easy Nano Banana is an AI-powered platform focusing on AI ASMR video generation and various AI image tools (background removal, anime generation, etc.).
It is a **Next.js 14** application using the **App Router**.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.3, RemixIcon
- **Backend/DB**: Supabase (Auth, Database, Realtime)
- **Internationalization**: `next-intl` (en, zh, de, fr)
- **AI Integration**: OpenAI, Replicate (inferred)

## Key Directories
- `src/app/`: App Router pages and layouts.
- `src/components/`: Reusable UI components.
- `src/lib/`: Utilities, Supabase clients, API helpers.
- `content/blog/`: Markdown files for the blog.
- `database/`: SQL migrations and schemas.
- `public/`: Static assets (images, icons).

## Development Best Practices & Patterns

### 1. UI/UX Patterns
- **Dropdowns**: **NEVER** use JavaScript state (`useState`) for hover menus. Use Tailwind's `group` and `group-hover` classes for CSS-only transitions.
  ```tsx
  /* ✅ Correct */
  <div className="relative group">
    <button>Menu</button>
    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 ...">
      ...
    </div>
  </div>
  ```

### 2. File Downloads
- **CORS Handling**: Do not download directly from external storage (R2/S3) in the browser.
- **Pattern**: Use the `useImageDownload` custom hook + `/api/download-image` proxy.
  ```tsx
  /* ✅ Correct */
  const { downloadImage } = useImageDownload({ creditsRequired: 1 });
  // ... inside handler
  await downloadImage(url, 'filename.png');
  ```

### 3. Blog System
- **Content**: The blog is **static**, driven by Markdown files in `content/blog/`.
- **Creating Posts**: Add a `.md` file to `content/blog/` with frontmatter (title, excerpt, image, etc.).
- **Routing**: Routes are auto-generated based on filenames.

### 4. Database & Auth
- **Auth**: Handled via Supabase. `AuthContext` provides user state.
- **Credits**: Managed in the `credit_transactions` table. Positive values for purchases, negative for usage.

## Build & Run Commands
- **Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Type Check**: `npm run type-check` (or `tsc --noEmit`)

## Environment Variables
See `.env.example` for required keys. Critical ones include:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `JWT_SECRET`
