# GEO (Generative Engine Optimization) Design

**Date:** 2026-05-13
**Status:** Approved
**Approach:** Static files + Independent Schema components, two phases

## Goal

Optimize easynanobanana.com for AI search engines (ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude) to maximize content citation and recommendation.

## Current State

- **Has:** generateMetadata with hreflang, 2578-line sitemap.xml, 4 blog posts, 2 FAQ components, ~25 AI effect pages
- **Missing:** robots.txt, llms.txt, JSON-LD schema, FAQ schema markup, GEO content structure

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI crawler policy | All open | Maximize AI visibility |
| Schema scope | High priority first | AI effect pages (SoftwareApplication + FAQPage) + homepage (WebSite + Organization) |
| llms.txt detail | Detailed version | Full tool descriptions, input/output, use cases |
| Content scope | Tech + content templates | No specific copywriting, provide structural guidelines |
| Phasing | Two phases | Phase 1: infrastructure, Phase 2: integration + templates |
| Implementation | Static files + components | Zero runtime overhead, CDN-friendly, easy to maintain |

---

## Phase 1: Technical Infrastructure

### 1.1 `public/robots.txt`

New static file allowing all AI crawlers:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/

# AI Crawlers - All Allowed
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: cohere-ai
Allow: /

Sitemap: https://www.easynanobanana.com/sitemap.xml
```

### 1.2 `public/llms.txt`

Detailed version with every AI effect tool documented:

```
# Nano Banana
> AI-powered image effects platform with 25+ creative tools

## About
Nano Banana (easynanobanana.com) is an online AI image editing platform
that provides 25+ creative AI tools. Supports 14 languages.
Free credits on signup, pay-as-you-go credit model.

## AI Image Effects
(Each tool: name, URL, description, input, output, use cases)

### AI Background Removal
- URL: https://www.easynanobanana.com/remove-background
- Description: Remove image backgrounds instantly using AI
- Input: Any photo (portrait, product, etc.)
- Output: PNG with transparent background
- Use cases: E-commerce product photos, profile pictures, design assets

### AI Hairstyle Changer
- URL: https://www.easynanobanana.com/ai-image-effects/ai-hairstyle
- ...

(~25 tool sections total)

## Pricing
- Free: 3 credits on signup
- Pay-as-you-go: Credit packs available
- URL: https://www.easynanobanana.com/pricing

## Blog
- URL: https://www.easynanobanana.com/blog

## Contact
- Website: https://www.easynanobanana.com
- About: https://www.easynanobanana.com/about
```

### 1.3 Schema Components

```
src/components/seo/
├── JsonLd.tsx              — Generic JSON-LD renderer
├── WebsiteSchema.tsx       — Homepage: WebSite + Organization
├── SoftwareAppSchema.tsx   — AI effect pages: SoftwareApplication
├── FAQSchema.tsx           — FAQ sections: FAQPage
└── BreadcrumbSchema.tsx    — All pages: BreadcrumbList
```

**JsonLd.tsx** — Base renderer:
```tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

**SoftwareAppSchema.tsx** — Props: name, description, url, category, offers
**FAQSchema.tsx** — Props: items: Array<{ question: string; answer: string }>
**BreadcrumbSchema.tsx** — Props: items: Array<{ name: string; url: string }>
**WebsiteSchema.tsx** — Props: name, url, description

### 1.4 Sitemap Optimization

Update `public/sitemap.xml`:
- Add/refresh `<lastmod>` dates for all AI effect pages
- Set AI effect pages `<priority>` to 0.8, blog to 0.6
- Set AI effect pages `<changefreq>` to weekly

---

## Phase 2: Content Templates + Page Integration

### 2.1 GEO Content Template for AI Effect Pages

**First 200 Words ("AI-Citable Zone"):**
```
Sentence 1: Direct definition ("X is an AI-powered tool that...")
Sentence 2: Core feature and unique value prop
Sentence 3: Specific data ("processes images in under 5 seconds")
Sentence 4: Use cases ("ideal for...")
```

**Page Structure Template:**
```
1. Hero Section — Title + direct answer zone (first 200 words)
2. How It Works — 3-4 steps
3. Style Presets — Available styles showcase
4. Before/After — Effect comparison
5. FAQ Section — 5-8 Q&As (wired to FAQSchema)
6. CTA — Call to action
```

**FAQ Content Spec (per AI effect page):**
```
- Minimum 5 FAQs per page
- Q1: "What is [tool name]?" — definition
- Q2: "How does [tool name] work?" — process
- Q3: "Is [tool name] free?" — pricing
- Q4: Tool-specific question
- Q5: "How long does it take?" — performance
- Each answer: 2-4 sentences with specific data
```

### 2.2 Schema Integration Plan

**Homepage `src/app/[locale]/page.tsx`:**
```tsx
<WebsiteSchema />
<BreadcrumbSchema items={[{ name: 'Home', url: '/' }]} />
```

**AI Effect Pages (example: ai-hairstyle):**
```tsx
<SoftwareAppSchema
  name={t('title')}
  description={t('description')}
  url={canonicalUrl}
  category="Photo & Video"
/>
<FAQSchema items={faqItems} />
<BreadcrumbSchema items={breadcrumbs} />
```

**Integration Priority:**
1. Homepage — WebsiteSchema + Organization
2. Pages with existing FAQs (infographic, remove-background) — FAQSchema
3. High-traffic AI effect pages — SoftwareAppSchema + BreadcrumbSchema
4. Remaining AI effect pages — batch integration

### 2.3 i18n Considerations

- Schema `name` and `description` fields sourced from `next-intl` translations
- FAQ schema content goes through translation files
- URLs follow existing rule: English has no `/en` prefix, others use locale prefix

---

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| `public/robots.txt` | Create | 1 |
| `public/llms.txt` | Create | 1 |
| `src/components/seo/JsonLd.tsx` | Create | 1 |
| `src/components/seo/WebsiteSchema.tsx` | Create | 1 |
| `src/components/seo/SoftwareAppSchema.tsx` | Create | 1 |
| `src/components/seo/FAQSchema.tsx` | Create | 1 |
| `src/components/seo/BreadcrumbSchema.tsx` | Create | 1 |
| `public/sitemap.xml` | Update lastmod/priority | 1 |
| `src/app/[locale]/page.tsx` | Wire WebsiteSchema | 2 |
| `src/app/[locale]/ai-image-effects/*/page.tsx` | Wire SoftwareApp + FAQ + Breadcrumb | 2 |
| `docs/geo-content-template.md` | Create content template doc | 2 |
