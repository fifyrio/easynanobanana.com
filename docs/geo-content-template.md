# GEO Content Template

Guidelines for creating AI search engine-friendly content on Nano Banana pages.

## First 200 Words: The "AI-Citable Zone"

AI engines heavily weight the opening content of a page. The first 200 words must:

```
Sentence 1: Direct definition
  "[Tool Name] is an AI-powered tool that [core action] in [timeframe]."
  Example: "AI Background Remover is an AI-powered tool that removes image backgrounds in under 5 seconds."

Sentence 2: Core feature + unique value
  "It [key differentiator] with [specific capability]."
  Example: "It supports 10+ output formats with automatic edge refinement for clean transparent PNGs."

Sentence 3: Specific, citable data
  "[Metric] — [concrete number or stat]."
  Example: "Processes images at 95%+ accuracy on portraits, products, and pets."

Sentence 4: Use cases
  "Ideal for [use case 1], [use case 2], and [use case 3]."
  Example: "Ideal for e-commerce product shots, social media profile pictures, and design asset creation."
```

### Why this matters

AI models prioritize content that directly answers a query. A page that opens with "Welcome to our amazing tool..." is unlikely to be cited. A page that opens with a clear definition and specific data is far more likely to appear in AI-generated answers.

## Page Structure Template

Every AI effect page should follow this order:

```
1. Hero Section
   - H1 title (tool name)
   - Direct answer zone (first 200 words, following the pattern above)
   - Primary CTA button

2. How It Works
   - 3-4 numbered steps
   - Each step: icon + short title + 1-sentence description
   - Corresponds to potential HowTo schema (future enhancement)

3. Style Presets / Options
   - Visual grid of available styles
   - Each preset: thumbnail + name

4. Before/After Showcase
   - Side-by-side comparison images
   - Clear labels

5. FAQ Section
   - Minimum 5 Q&A pairs (see FAQ spec below)
   - Wired to FAQSchema component for JSON-LD

6. CTA Section
   - Final call to action
   - Credit/pricing info
```

## FAQ Content Specification

### Minimum 5 FAQs per page

| # | Question Type | Template | Purpose |
|---|--------------|----------|---------|
| Q1 | Definition | "What is [tool name]?" | AI engines cite definitions |
| Q2 | Process | "How does [tool name] work?" | Explains the workflow |
| Q3 | Pricing | "Is [tool name] free?" | Addresses purchase intent |
| Q4 | Tool-specific | Varies by tool | Addresses unique feature questions |
| Q5 | Performance | "How long does [tool name] take?" | Sets expectations with data |

### Answer guidelines

- 2-4 sentences per answer
- Include at least one specific number or data point per answer
- Use natural language (AI engines prefer conversational answers)
- Avoid marketing fluff — be factual and direct

### Example FAQ

```
Q: "What is AI Background Remover?"
A: "AI Background Remover is a free online tool that automatically removes
   image backgrounds using AI. It processes photos in under 5 seconds with
   95%+ accuracy on portraits, products, and pets. The output is a clean
   transparent PNG ready for design use."

Q: "How does AI Background Remover work?"
A: "Upload any photo in JPG, PNG, or WebP format (up to 10MB). The AI model
   detects the subject, separates it from the background, and generates a
   transparent PNG. You can preview the result for free and download the
   full-resolution version using credits."
```

## Translation Considerations

- All FAQ content goes through `messages/{locale}.json` translation files
- SEO fields have character limits:
  - Title: 60 characters (ideal), 70 max
  - Description: 160 characters (ideal), 180 max
  - OG Title: 60 characters (ideal)
  - Keywords: 100 characters (ideal)
- CJK languages (zh, ja, ko) naturally use fewer characters — verify rendered length, not character count
- Each locale's FAQ answers should be natural in that language, not word-for-word translations

## Schema Integration Checklist

When adding a new AI effect page:

- [ ] Create page.tsx with `generateMetadata` and schema wiring
- [ ] Add SEO translations to all 14 locale files (`messages/*.json`)
- [ ] Add FAQ translations (minimum 5 items) to all 14 locale files
- [ ] Wire `SoftwareAppSchema` with name, description, URL from translations
- [ ] Wire `FAQSchema` with items from FAQ translations
- [ ] Wire `BreadcrumbSchema` with correct hierarchy
- [ ] Update `public/llms.txt` with the new tool entry
- [ ] Update `public/sitemap.xml` with URLs for all 14 locales
- [ ] Verify with `npm run build` — no TypeScript errors

## URL Rules

- English locale: no `/en` prefix (e.g., `https://www.easynanobanana.com/ai-image-effects/ai-hairstyle`)
- All other locales: use `/{locale}` prefix (e.g., `https://www.easynanobanana.com/zh/ai-image-effects/ai-hairstyle`)
- Canonical URLs always use `https://www.easynanobanana.com`
