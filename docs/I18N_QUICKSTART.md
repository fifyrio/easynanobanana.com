# I18N Quickstart Guide

本项目使用 `next-intl` 实现国际化，支持 12 种语言。

## 项目结构

```
├── i18n/
│   ├── config.ts      # 语言配置
│   ├── routing.ts     # 路由配置
│   └── request.ts     # 服务端配置
├── messages/
│   ├── en.json        # 英文翻译
│   ├── zh-TW.json     # 繁体中文
│   └── ...            # 其他语言
├── middleware.ts      # 路由中间件
└── app/[locale]/      # 动态语言路由
```

## 核心配置

### 1. 语言配置 (`i18n/config.ts`)

```typescript
export const locales = ['en', 'ja', 'de', 'fr', 'pt', 'es', 'it', 'ru', 'ko', 'zh-TW', 'vi', 'th'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
  'zh-TW': '繁體中文',
  // ...
};
```

### 2. 路由配置 (`i18n/routing.ts`)

```typescript
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'  // 默认语言不显示前缀
});

// 导出国际化导航组件
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

### 3. 中间件 (`middleware.ts`)

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
```

### 4. 服务端配置 (`i18n/request.ts`)

```typescript
import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

## 翻译文件结构

### 消息格式 (`messages/en.json`)

```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel"
  },
  "nav": {
    "home": "Home",
    "dashboard": "Dashboard"
  },
  "home": {
    "import": {
      "remaining": "{remaining} / {max} remaining"
    },
    "tasks": {
      "generated": {
        "explain": "Explain \"{title}\" in simple terms"
      }
    }
  },
  "testimonials": {
    "items": [
      {
        "quote": "...",
        "author": "Sarah J.",
        "role": "Med Student"
      }
    ]
  }
}
```

## 使用示例

### 客户端组件

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { Link, useRouter, usePathname } from '@/i18n/routing'

export default function MyComponent() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div>
      {/* 基础翻译 */}
      <h1>{t('nav.home')}</h1>

      {/* 带变量 */}
      <p>{t('home.import.remaining', { remaining: 2, max: 3 })}</p>

      {/* 国际化 Link */}
      <Link href="/dashboard">{t('nav.dashboard')}</Link>

      {/* 切换语言 */}
      <button onClick={() => router.replace(pathname, { locale: 'ja' })}>
        日本語
      </button>
    </div>
  )
}
```

### 命名空间翻译

```tsx
export default function ProfilePage() {
  const t = useTranslations('profile')  // 指定命名空间

  return (
    <div>
      <h1>{t('title')}</h1>  {/* profile.title */}
      <p>{t('subtitle')}</p>  {/* profile.subtitle */}
    </div>
  )
}
```

### 获取原始数据 (数组/对象)

```tsx
export default function FAQPage() {
  const t = useTranslations()

  // 获取数组数据
  const faqItems = t.raw('faq.items') as {
    question: string
    answer: string
  }[]

  return (
    <ul>
      {faqItems.map((item, i) => (
        <li key={i}>
          <h3>{item.question}</h3>
          <p>{item.answer}</p>
        </li>
      ))}
    </ul>
  )
}
```

### 语言切换器

```tsx
'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { locales, localeNames, type Locale } from '@/i18n/config'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as Locale })
  }

  return (
    <select value={locale} onChange={(e) => handleChange(e.target.value)}>
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeNames[loc]}
        </option>
      ))}
    </select>
  )
}
```

## Best Practices

### 1. 始终使用国际化导航

```tsx
// ✅ Good - 使用 i18n routing
import { Link } from '@/i18n/routing'
<Link href="/dashboard">Dashboard</Link>

// ❌ Bad - 使用 next/link
import Link from 'next/link'
<Link href="/dashboard">Dashboard</Link>
```

### 2. 翻译键命名规范

```json
{
  "页面名": {
    "区块名": {
      "元素": "翻译"
    }
  }
}

// 示例
{
  "home": {
    "hero": {
      "title": "Welcome",
      "description": "..."
    }
  }
}
```

### 3. 变量插值

```json
// messages/en.json
{
  "greeting": "Hello, {name}!",
  "items": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
}
```

```tsx
t('greeting', { name: 'John' })  // "Hello, John!"
t('items', { count: 5 })          // "5 items"
```

### 4. 添加新页面

1. 创建 `app/[locale]/new-page/page.tsx`
2. 在所有语言文件中添加翻译键
3. 使用 `useTranslations()` 获取翻译

### 5. 添加新语言

1. 在 `i18n/config.ts` 的 `locales` 数组中添加语言代码
2. 在 `localeNames` 中添加显示名称
3. 创建 `messages/{locale}.json` 翻译文件

## 常见问题

### Q: 如何在服务端组件使用翻译？

```tsx
import { getTranslations } from 'next-intl/server'

export default async function ServerComponent() {
  const t = await getTranslations('common')
  return <h1>{t('title')}</h1>
}
```

### Q: 如何处理动态内容？

使用变量插值或 `t.raw()` 获取原始数据后处理。

### Q: 默认语言 URL 有前缀吗？

不会。配置了 `localePrefix: 'as-needed'`，所以:
- `/` → 英文 (默认)
- `/ja` → 日文
- `/zh-TW` → 繁体中文

## 依赖

```json
{
  "next-intl": "^3.x"
}
```

配置文件: `next.config.ts` 需要添加 `next-intl` 插件配置。
