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