---
name: seo-metadata-auditor
description: Use this agent when you need to audit, review, or validate SEO metadata implementation in Next.js App Router pages. This agent should be called proactively after:\n\n1. Creating or modifying page components with generateMetadata functions\n2. Adding new internationalized (i18n) routes\n3. Implementing blog posts, product pages, or landing pages\n4. Making changes to translation files that affect SEO content\n5. Before deploying changes to production\n\nExamples of when to use this agent:\n\n<example>\nContext: User has just created a new product page with metadata\nuser: "I've created a new product page at /app/[locale]/products/[id]/page.tsx with metadata. Can you review it?"\nassistant: "Let me use the seo-metadata-auditor agent to review your SEO implementation and ensure it follows all best practices."\n<tool_use>\n<tool_name>Agent</tool_name>\n<parameters>\n<agent_identifier>seo-metadata-auditor</agent_identifier>\n<task>Review the SEO metadata implementation in /app/[locale]/products/[id]/page.tsx and validate against Next.js App Router best practices, including character limits, required fields, and multi-language support.</task>\n</parameters>\n</tool_use>\n</example>\n\n<example>\nContext: User has modified translation files for SEO content\nuser: "I've updated the SEO translations in en.json and zh.json for the landing page"\nassistant: "I'll use the seo-metadata-auditor agent to validate your translation updates and check character limits."\n<tool_use>\n<tool_name>Agent</tool_name>\n<parameters>\n<agent_identifier>seo-metadata-auditor</agent_identifier>\n<task>Audit the SEO translations in en.json and zh.json, verify character count limits (title ≤60, description ≤160), and ensure consistency across languages.</task>\n</parameters>\n</tool_use>\n</example>\n\n<example>\nContext: User is about to deploy and wants a final SEO check\nuser: "Ready to deploy, can you do a final check?"\nassistant: "Let me run the seo-metadata-auditor to perform a comprehensive SEO validation before deployment."\n<tool_use>\n<tool_name>Agent</tool_name>\n<parameters>\n<agent_identifier>seo-metadata-auditor</agent_identifier>\n<task>Perform comprehensive SEO audit across all pages with generateMetadata, checking character limits, required fields, canonical URLs, OG images, alternate languages, and robots configuration.</task>\n</parameters>\n</tool_use>\n</example>\n\n<example>\nContext: Proactive review after code changes\nuser: "I've finished implementing the blog post page"\nassistant: "Great! Let me proactively use the seo-metadata-auditor to ensure your blog implementation follows SEO best practices."\n<tool_use>\n<tool_name>Agent</tool_name>\n<parameters>\n<agent_identifier>seo-metadata-auditor</agent_identifier>\n<task>Review the blog post page implementation for SEO compliance, including metadata structure, Open Graph configuration, Twitter cards, and article-specific metadata fields.</task>\n</parameters>\n</tool_use>\n</example>
model: sonnet
---

# SEO Best Practices for Next.js App Router

## Overview

This document outlines the SEO implementation best practices for Next.js 14+ App Router applications with internationalization (i18n) support. It serves as a reference for implementing consistent, search-engine-optimized metadata across all pages.

## Table of Contents

1. [Architecture Pattern](#architecture-pattern)
2. [Metadata Length Limits](#metadata-length-limits)
3. [Implementation Structure](#implementation-structure)
4. [Multi-language Support](#multi-language-support)
5. [Required Metadata Fields](#required-metadata-fields)
6. [Code Examples](#code-examples)
7. [Validation Checklist](#validation-checklist)

---

## Architecture Pattern

### Server Component + Client Component Separation

For pages requiring client-side interactivity, use the following pattern:

```
src/app/[locale]/your-page/
├── page.tsx                    # Server component with generateMetadata
└── YourPageClient.tsx          # Client component with 'use client'
```

**Why?**
- `generateMetadata` must run in a server component
- Separating concerns ensures SEO metadata is generated server-side
- Client components handle all interactive logic (useState, useEffect, etc.)

---

## Metadata Length Limits

### Critical Limits (SEO Best Practices)

| Field | Maximum Length | Optimal Range | Why |
|-------|---------------|---------------|-----|
| **Title** | 60 characters | 50-60 chars | Google displays ~60 chars in search results |
| **Description** | 160 characters | 150-160 chars | Google shows ~160 chars in snippets |
| **Keywords** | 100 characters | 80-100 chars | Concise, focused keywords perform better |
| **OG Title** | 60 characters | 50-60 chars | Social media preview consistency |
| **OG Description** | 160 characters | 150-160 chars | Social media preview optimization |

### Character Counting Rules

- **English**: 1 character = 1 byte (straightforward)
- **Chinese/Japanese**: 1 character = 1 character (not bytes!)
- **Count including spaces and punctuation**
- Use `.length` property in JavaScript (not byte length)

### Examples

✅ **Good Title (36 chars)**
```
AI Prompts Gallery - Nano Banana Pro
```

❌ **Bad Title (85 chars, too long)**
```
Professional AI Prompts Gallery - Nano Banana Pro | Expert Prompt Engineering Examples
```

✅ **Good Description (137 chars)**
```
600+ expert AI prompts for portraits, logos, products & illustrations. Master prompt engineering with real examples. Free prompt library.
```

❌ **Bad Description (215 chars, too long)**
```
Explore 600+ professional AI prompts curated by experts. Master prompt engineering with real-world examples for portraits, logos, products, illustrations & more. Free AI prompt library for everyone to use and learn from.
```

---

## Implementation Structure

### 1. Translation Files Structure

Add SEO-specific translations in your locale files:

```json
{
  "yourPage": {
    "hero": {
      "title": "Page Display Title",
      "subtitle": "Page Display Subtitle"
    },
    "seo": {
      "title": "SEO Meta Title (≤60 chars)",
      "description": "SEO Meta Description (≤160 chars)",
      "ogTitle": "Open Graph Title (≤60 chars)",
      "ogDescription": "Open Graph Description (≤160 chars)"
    }
  }
}
```

**Key Points:**
- Separate `hero` (displayed content) from `seo` (metadata)
- SEO title can differ from display title for optimization
- Keep all SEO fields within length limits

### 2. Page Component Pattern

```typescript
// src/app/[locale]/your-page/page.tsx
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import YourPageClient from './YourPageClient';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'yourPage.seo' });
  const tHero = await getTranslations({ locale, namespace: 'yourPage.hero' });

  const baseUrl = 'https://www.yoursite.com';
  const canonicalUrl = `${baseUrl}/${locale}/your-page`;

  return {
    title: t('title'),
    description: t('description'),
    keywords: [
      'keyword1',
      'keyword2',
      'keyword3',
    ],
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonicalUrl,
      siteName: 'Your Site Name',
      images: [
        {
          url: `${baseUrl}/images/your-page-og.jpg`,
          width: 1200,
          height: 630,
          alt: tHero('title'),
        },
      ],
      locale: locale === 'zh' ? 'zh_CN' : locale === 'id' ? 'id_ID' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [`${baseUrl}/images/your-page-og.jpg`],
      creator: '@YourTwitterHandle',
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/en/your-page`,
        'zh': `${baseUrl}/zh/your-page`,
        'id': `${baseUrl}/id/your-page`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default function YourPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  return <YourPageClient locale={locale} />;
}
```

### 3. Client Component Pattern

```typescript
// src/app/[locale]/your-page/YourPageClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Header from '@/components/common/Header';

interface YourPageClientProps {
  locale: string;
}

export default function YourPageClient({ locale }: YourPageClientProps) {
  const t = useTranslations('yourPage');
  const [data, setData] = useState([]);

  useEffect(() => {
    // Client-side logic here
  }, [locale]);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <h1>{t('hero.title')}</h1>
        {/* Your content */}
      </main>
    </div>
  );
}
```

---

## Multi-language Support

### Locale Mapping

Map Next-intl locales to proper OpenGraph locale codes:

```typescript
const getOGLocale = (locale: string): string => {
  const localeMap: Record<string, string> = {
    'en': 'en_US',
    'zh': 'zh_CN',
    'zh-TW': 'zh_TW',
    'ja': 'ja_JP',
    'ko': 'ko_KR',
    'id': 'id_ID',
    'de': 'de_DE',
    'fr': 'fr_FR',
    'es': 'es_ES',
    'pt': 'pt_BR',
    'ru': 'ru_RU',
    'ar': 'ar_AR',
  };

  return localeMap[locale] || 'en_US';
};

// Usage in generateMetadata
openGraph: {
  locale: getOGLocale(locale),
  // ...
}
```

### Alternate Language Links

Always provide alternate language links for better SEO:

```typescript
alternates: {
  canonical: `${baseUrl}/${locale}/your-page`,
  languages: {
    'en': `${baseUrl}/your-page`, // No /en prefix for default locale
    'zh': `${baseUrl}/zh/your-page`,
    'id': `${baseUrl}/id/your-page`,
    // Add all supported languages
  },
}

### English Locale URL Structure Rules ⭐

- **Key Rule**: English (`en`) does not use the `/en` prefix.
```

---

## Required Metadata Fields

### Essential Fields (Must Have)

1. **title** - Page title for search results
2. **description** - Page description for search snippets
3. **openGraph.title** - Social media share title
4. **openGraph.description** - Social media share description
5. **openGraph.url** - Canonical URL
6. **openGraph.images** - Social media preview image (1200x630px)
7. **alternates.canonical** - Canonical URL for SEO
8. **robots** - Search engine indexing directives

### Recommended Fields

9. **keywords** - Relevant keywords (6-10 keywords)
10. **openGraph.siteName** - Your site/brand name
11. **openGraph.locale** - Language and region code
12. **twitter.card** - Twitter card type
13. **twitter.creator** - Twitter handle
14. **alternates.languages** - Multi-language support

### Optional but Beneficial

15. **authors** - Content authors
16. **publisher** - Publishing organization
17. **openGraph.type** - Content type (website, article, etc.)
18. **verification** - Search console verification codes

---

## Code Examples

### Example 1: Blog Post with Rich Metadata

```typescript
export async function generateMetadata({
  params: { locale, slug }
}: {
  params: { locale: string; slug: string }
}): Promise<Metadata> {
  const post = await getBlogPost(slug);
  const t = await getTranslations({ locale, namespace: 'blog.seo' });

  const baseUrl = 'https://www.yoursite.com';
  const canonicalUrl = `${baseUrl}/${locale}/blog/${slug}`;

  return {
    title: `${post.title} | Your Blog`,
    description: post.excerpt.substring(0, 160),
    keywords: post.tags.slice(0, 6),
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt.substring(0, 160),
      url: canonicalUrl,
      siteName: 'Your Blog',
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: getOGLocale(locale),
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt.substring(0, 160),
      images: [post.coverImage],
      creator: '@YourHandle',
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/en/blog/${slug}`,
        'zh': `${baseUrl}/zh/blog/${slug}`,
      },
    },
  };
}
```

### Example 2: Product Page

```typescript
export async function generateMetadata({
  params: { locale, productId }
}: {
  params: { locale: string; productId: string }
}): Promise<Metadata> {
  const product = await getProduct(productId);
  const t = await getTranslations({ locale, namespace: 'products.seo' });

  const baseUrl = 'https://www.yourshop.com';
  const canonicalUrl = `${baseUrl}/${locale}/products/${productId}`;

  return {
    title: `${product.name} - ${t('suffix')}`,
    description: product.description.substring(0, 160),
    keywords: [product.category, ...product.tags.slice(0, 5)],
    openGraph: {
      title: product.name,
      description: product.description.substring(0, 160),
      url: canonicalUrl,
      siteName: 'Your Shop',
      images: [
        {
          url: product.images[0],
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: getOGLocale(locale),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.substring(0, 160),
      images: [product.images[0]],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
```

### Example 3: Landing Page with Localized SEO

```typescript
export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'landing.seo' });

  const baseUrl = 'https://www.yoursite.com';
  const canonicalUrl = `${baseUrl}/${locale}`;

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords').split(',').map((k: string) => k.trim()),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonicalUrl,
      siteName: 'Your Site',
      images: [
        {
          url: `${baseUrl}/images/og-${locale}.jpg`,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      locale: getOGLocale(locale),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [`${baseUrl}/images/og-${locale}.jpg`],
      creator: '@YourHandle',
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/en`,
        'zh': `${baseUrl}/zh`,
        'id': `${baseUrl}/id`,
        'ja': `${baseUrl}/ja`,
        'ko': `${baseUrl}/ko`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
```

---

## Validation Checklist

### Before Deployment

Use this checklist to verify SEO implementation:

#### 1. Length Validation

```javascript
// Validation script example
const validateSEO = (seo: SEOData) => {
  const errors: string[] = [];

  if (seo.title.length > 60) {
    errors.push(`Title too long: ${seo.title.length} chars (max 60)`);
  }

  if (seo.description.length > 160) {
    errors.push(`Description too long: ${seo.description.length} chars (max 160)`);
  }

  if (seo.keywords && seo.keywords.join(', ').length > 100) {
    errors.push(`Keywords too long: ${seo.keywords.join(', ').length} chars (max 100)`);
  }

  return errors;
};
```

#### 2. Required Fields Checklist

- [ ] Title is present and ≤ 60 characters
- [ ] Description is present and ≤ 160 characters
- [ ] Keywords are present and ≤ 100 characters (total)
- [ ] Canonical URL is correct
- [ ] Open Graph title is present
- [ ] Open Graph description is present
- [ ] Open Graph image is 1200x630px
- [ ] Open Graph URL matches canonical
- [ ] Twitter card type is set
- [ ] Robots meta is configured
- [ ] Alternate language links are present (if multi-language)

#### 3. Multi-language Checklist

For each supported language:

- [ ] Translation file has `seo` section
- [ ] All SEO fields are translated
- [ ] Character counts are within limits (check each language!)
- [ ] OG locale code is correct
- [ ] Alternate links include all languages
- [ ] Canonical URL includes locale

#### 4. Build-time Validation

```bash
# TypeScript check
npm run type-check

# Production build
npm run build

# Check for warnings
npm run build 2>&1 | grep -i "warning"

# Verify route generation
npm run build 2>&1 | grep "your-page"
```

#### 5. Runtime Testing

Test in browser DevTools:

```javascript
// Check meta tags in console
document.title; // Should be ≤60 chars
document.querySelector('meta[name="description"]')?.content; // Should be ≤160 chars
document.querySelector('meta[property="og:title"]')?.content;
document.querySelector('meta[property="og:image"]')?.content;
document.querySelector('link[rel="canonical"]')?.href;
document.querySelectorAll('link[rel="alternate"]'); // Should have all languages
```

#### 6. SEO Tools Validation

Use these tools to validate:

1. **Google Search Console** - Submit sitemap and check coverage
2. **Google Rich Results Test** - Validate structured data
3. **Facebook Sharing Debugger** - Test Open Graph tags
4. **Twitter Card Validator** - Test Twitter cards
5. **Lighthouse SEO Audit** - Check overall SEO score
6. **Screaming Frog** - Crawl and validate all pages

---

## Common Pitfalls and Solutions

### ❌ Pitfall 1: Using Client Components for Metadata

```typescript
// ❌ BAD - generateMetadata in client component
'use client';

export async function generateMetadata() {
  // This won't work!
}
```

**✅ Solution:** Always use server components for `generateMetadata`

```typescript
// ✅ GOOD - Server component with metadata
export async function generateMetadata() {
  // Works correctly
}

export default function Page() {
  return <ClientComponent />;
}
```

### ❌ Pitfall 2: Exceeding Length Limits

```typescript
// ❌ BAD - No length checking
title: fullProductNameWithAllDetails // Could be 200 chars!
```

**✅ Solution:** Always truncate and validate

```typescript
// ✅ GOOD - Truncate with ellipsis
title: product.name.length > 57
  ? `${product.name.substring(0, 57)}...`
  : product.name
```

### ❌ Pitfall 3: Missing Canonical URLs

```typescript
// ❌ BAD - No canonical URL
export async function generateMetadata() {
  return {
    title: 'Page Title',
    // Missing canonical!
  };
}
```

**✅ Solution:** Always include canonical

```typescript
// ✅ GOOD - Include canonical
export async function generateMetadata({ params }) {
  const canonicalUrl = `${baseUrl}/${params.locale}/page`;

  return {
    title: 'Page Title',
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
```

### ❌ Pitfall 4: Inconsistent Locale Codes

```typescript
// ❌ BAD - Wrong locale format
openGraph: {
  locale: 'zh', // Should be 'zh_CN'
}
```

**✅ Solution:** Use proper locale mapping

```typescript
// ✅ GOOD - Proper locale codes
openGraph: {
  locale: locale === 'zh' ? 'zh_CN' : 'en_US',
}
```

### ❌ Pitfall 5: Missing OG Images

```typescript
// ❌ BAD - No image specified
openGraph: {
  title: 'Page',
  // Missing images!
}
```

**✅ Solution:** Always provide OG image

```typescript
// ✅ GOOD - Include properly sized image
openGraph: {
  title: 'Page',
  images: [
    {
      url: `${baseUrl}/images/og-image.jpg`,
      width: 1200,
      height: 630,
      alt: 'Page preview',
    },
  ],
}
```

---

## Performance Optimization

### 1. Metadata Caching

Cache translations to improve performance:

```typescript
import { unstable_cache } from 'next/cache';

const getCachedTranslations = unstable_cache(
  async (locale: string, namespace: string) => {
    return await getTranslations({ locale, namespace });
  },
  ['translations'],
  { revalidate: 3600 } // Cache for 1 hour
);
```

### 2. Static Generation for SEO Pages

For static content, use `generateStaticParams`:

```typescript
export async function generateStaticParams() {
  const locales = ['en', 'zh', 'id', 'ja', 'ko'];

  return locales.map((locale) => ({
    locale,
  }));
}
```

### 3. Image Optimization

Always optimize OG images:

- **Format**: Use WebP or JPEG
- **Size**: Exactly 1200x630px
- **Compression**: Compress to <100KB
- **CDN**: Serve from CDN for faster loading

---

## Monitoring and Maintenance

### Regular Checks

Perform these checks monthly:

1. **Search Console Monitoring**
   - Check for crawl errors
   - Monitor coverage reports
   - Review performance reports

2. **Broken Links**
   - Verify canonical URLs are accessible
   - Check alternate language links
   - Validate OG image URLs

3. **Content Updates**
   - Update meta descriptions for better CTR
   - Refresh keywords based on search trends
   - Update OG images seasonally

4. **Competitive Analysis**
   - Compare meta titles with competitors
   - Analyze description effectiveness
   - Review keyword rankings

---

## Resources and Tools

### SEO Testing Tools

1. **Google Tools**
   - [Google Search Console](https://search.google.com/search-console)
   - [Rich Results Test](https://search.google.com/test/rich-results)
   - [PageSpeed Insights](https://pagespeed.web.dev/)

2. **Social Media Validators**
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

3. **SEO Analysis Tools**
   - [Screaming Frog](https://www.screamingfrog.co.uk/seo-spider/)
   - [Ahrefs Site Audit](https://ahrefs.com/site-audit)
   - [Semrush Site Audit](https://www.semrush.com/siteaudit/)

### Documentation

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Google Search Guidelines](https://developers.google.com/search/docs)

---

## Version History

- **v1.0** (2024-12-04): Initial SEO best practices documentation
  - Established length limits and validation rules
  - Created server/client component patterns
  - Added multi-language support guidelines
  - Included validation checklist and common pitfalls

---

## Contributing

This document is a living guide. When implementing new SEO patterns:

1. Update relevant sections with new learnings
2. Add code examples for new use cases
3. Update the validation checklist if needed
4. Document any new pitfalls discovered
5. Keep length limits and best practices current with search engine changes

---

**Last Updated**: 2024-12-04
**Maintained By**: Engineering Team
**Review Cycle**: Quarterly
