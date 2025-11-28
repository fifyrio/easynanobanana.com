# AI ASMR Video Generation Platform - MVP

A modern, scalable AI-powered ASMR video generation platform built with Next.js 14, TypeScript, and Supabase.

## 🚀 Quick Start

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── [locale]/           # Internationalized routes
│   │   ├── layout.tsx      # Locale-specific layout
│   │   └── page.tsx        # Homepage
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── common/             # Common components (Header, Footer)
│   └── ...                 # Feature-specific components
├── i18n/                   # Internationalization config
├── lib/                    # Utilities and configurations
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

## 🌐 Internationalization

The platform supports multiple languages:
- English (`en`) - Default
- Chinese (`zh`)
- German (`de`)
- French (`fr`)

## 🎨 Tech Stack (MVP)

### Frontend
- **Next.js 14.0.1** - React full-stack framework
- **TypeScript 5.2.2** - Type-safe JavaScript
- **Tailwind CSS 3.3.5** - Utility-first CSS framework
- **Next-intl 4.3.5** - Internationalization

### Styling & UI
- **RemixIcon** - Icon library
- **AOS** - Scroll animations
- **Swiper** - Touch slider components
- **React Hot Toast** - Notifications

### Development Tools
- **ESLint** - Code quality
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 📝 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run type-check # TypeScript type checking
```

## 🔧 Environment Variables

Required variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `JWT_SECRET` - JWT signing secret
- `NEXTAUTH_SECRET` - NextAuth secret

## 🚦 MVP Features

### ✅ Completed
- [x] Next.js 14 project setup with TypeScript
- [x] Tailwind CSS configuration with custom theme
- [x] Multi-language support (i18n) with Next-intl
- [x] Responsive header and footer components
- [x] Hero section with gradient backgrounds
- [x] Features section with animated cards
- [x] Environment configuration management
- [x] ESLint and TypeScript configuration

### 🚧 Next Phase (Post-MVP)
- [ ] Supabase authentication integration
- [ ] Video generation API integration (KIE)
- [ ] User dashboard and credit system
- [ ] File upload and cloud storage (R2)
- [ ] Payment integration (Creem.io)
- [ ] User profile management
- [ ] Video gallery and management

## 🏗️ Architecture Highlights

### International-First Design
- Server-side translations for static content
- Client-side translations for dynamic content
- Prevents FORMATTING_ERROR with proper data handling

### Component Architecture
- Modular UI components with TypeScript props
- Utility-first styling with Tailwind CSS
- Responsive design patterns
- Accessibility considerations

### Performance Optimizations
- Next.js 14 App Router for optimal loading
- Static generation for marketing pages
- Image optimization with Next.js Image component
- CSS bundling and purging

## 📚 Documentation

- [Technical Stack Details](./技术栈.md)
- [Environment Setup Guide](./.env.example)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.


✍️ 创建新文章的步骤

  1. 在 content/blog/ 目录创建 .md 文件

  文件名将成为 URL 路径，例如：
  - my-new-article.md → /blog/my-new-article
  - ai-tips-2025.md → /blog/ai-tips-2025

  2. 使用标准格式编写文章

  ---
  title: "你的文章标题"
  excerpt: "文章的简短描述，会显示在博客列表页"
  publishedAt: "2025-09-15"
  readTime: "5 min read"
  category: "分类名称"
  featured: false
  image: "/images/blogs/your-image.png"
  ---

  # 你的文章标题

  这里开始写文章内容...

  ## 章节标题

  使用标准 Markdown 语法：
  - 列表项
  - **粗体文字**
  - [链接文本](https://example.com)

  > 引用内容

  ```代码块
  console.log('Hello World');

  ### 3. 放置封面图片（可选）

  如果有封面图片，放在：
  public/
    images/
      blogs/
        your-image.png  ← 封面图片放这里

  ### 4. 文件保存后自动生效

  - 保存文件后，文章会自动出现在博客页面
  - 如果设置 `featured: true`，会显示为特色文章
  - 自动生成对应的 `/blog/文件名` 页面

  ## 🔧 文件命名建议

  - 使用小写字母
  - 单词间用连字符 `-` 分隔
  - 避免特殊字符
  - 例如：`complete-guide-to-ai-editing.md`

  现在你可以直接在 `content/blog/` 目录创建 `.md` 文件来发布新文章了！


 使用方法

全量翻译（首次翻译）

npm run translate ja              # 翻译日语
npm run translate ko              # 翻译韩语

增量翻译（推荐，只翻译缺失部分）

npm run translate ja -- --incremental
npm run translate ko -- --incremental

读取@messages/ko.json                                                      ，将里面的json对象的value值，翻译为韩语，注意json的校验