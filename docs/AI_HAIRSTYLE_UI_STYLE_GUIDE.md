# AI Hairstyle Page - UI Style Guide

This document summarizes the UI styles, color system, and design patterns used in the AI Hairstyle page (`/ai-image-effects/ai-hairstyle`).

---

## Color System

### Primary Colors (Banana Yellow Theme)

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Primary Gold** | `#FFD84D` | Primary buttons, active states, step numbers, loading spinner |
| **Primary Gold Hover** | `#ffe062` | Button hover states |
| **Light Cream** | `#FFFBEA` | Page background gradient mid-tone |
| **Warm Cream** | `#FFF7DA` | Section background gradients |
| **Pale Yellow** | `#FFF9E6` | Tab container background |
| **Soft Yellow** | `#FFF3B2` | Badges, preset placeholders, icon backgrounds |
| **Light Yellow** | `#FFF4CC` | Selected preset card backgrounds |
| **Cream White** | `#FFFBF0` | Input section backgrounds |

### Border Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Border Yellow** | `#FFE7A1` | Card borders, input borders, section dividers |
| **Border Gold** | `#FFE58F` | Main card container borders |
| **Border Dashed** | `#F5C04B` | Dashed borders for upload areas |
| **Selected Border** | `#F0A202` | Selected preset card borders |

### Text Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Dark Brown** | `#8C6A00` | Badge text |
| **Gold Brown** | `#C69312` | Accent text, section badges, swipe hints |
| **Slate 900** | `slate-900` | Primary text, headings |
| **Slate 700** | `slate-700` | Body text, input text |
| **Slate 600** | `slate-600` | Secondary text, descriptions |
| **Slate 500** | `slate-500` | Muted text, placeholders |

### State Colors

| State | Colors Used |
|-------|-------------|
| **Error** | `red-50` (bg), `red-200` (border), `red-700` (text) |
| **Loading Overlay** | `slate-900/60` with `backdrop-blur-sm` |
| **Before Tag** | `white/90` (bg), `slate-600` (text) |
| **After Tag** | `slate-900/80` (bg), `white` (text) |

---

## Shadow System

### Card Shadows

```css
/* Main container cards */
shadow-[0_40px_120px_rgba(247,201,72,0.25)]  /* Left column card */
shadow-[0_40px_140px_rgba(196,147,18,0.25)]  /* Right column preview */
shadow-[0_20px_60px_rgba(247,201,72,0.2)]    /* Result panel */

/* How-to cards */
shadow-[0_30px_90px_rgba(255,216,77,0.35)]

/* Benefit cards */
shadow-[0_35px_120px_rgba(250,212,87,0.35)]

/* FAQ cards */
shadow-[0_25px_70px_rgba(247,201,72,0.2)]

/* Selected preset cards */
shadow-[0_10px_25px_rgba(240,162,2,0.25)]

/* CTA buttons */
shadow-[0_15px_40px_rgba(255,216,77,0.3)]

/* Slider handle glow */
box-shadow: 0 0 25px rgba(255,255,255,0.8)
```

---

## Border Radius System

| Element Type | Radius Value |
|--------------|--------------|
| Main container cards | `rounded-[32px]` or `rounded-[36px]` |
| Inner content panels | `rounded-[28px]` |
| Content cards | `rounded-[24px]` |
| Buttons | `rounded-full` or `rounded-2xl` |
| Input areas | `rounded-2xl` |
| Preset images | `rounded-xl` |
| FAQ items | `rounded-3xl` |
| Step number circles | `rounded-full` |
| Icon containers | `rounded-2xl` |

---

## Typography

### Headings

```jsx
/* H1 - Page title */
className="text-3xl sm:text-4xl font-semibold leading-tight text-slate-900"

/* H2 - Section titles */
className="text-3xl sm:text-4xl font-semibold text-slate-900"

/* H3 - Card titles */
className="text-xl font-semibold text-slate-900"  /* How-to cards */
className="text-2xl font-semibold text-slate-900"  /* Benefit cards */
```

### Body Text

```jsx
/* Primary body */
className="text-base text-slate-600"

/* Secondary body */
className="text-sm text-slate-600"

/* Small/caption text */
className="text-xs text-slate-500"

/* Tiny labels */
className="text-[10px] font-semibold"
className="text-[11px] uppercase tracking-wide text-slate-500"
```

### Section Badges

```jsx
className="text-sm uppercase tracking-[0.3em] text-[#C69312]"
```

---

## Component Patterns

### Badge Component

```jsx
<div className="inline-flex items-center gap-3 rounded-full bg-[#FFF3B2] px-4 py-1 text-sm font-semibold text-[#8C6A00]">
  <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#FFD84D] text-lg shadow-lg">
    {icon}
  </div>
  {text}
</div>
```

### Primary Button

```jsx
<Button
  className="w-full rounded-2xl bg-[#FFD84D] px-6 py-3 text-center text-base font-semibold text-slate-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-[#ffe062]"
>
  {children}
</Button>
```

### Tab Switcher

```jsx
<div className="inline-flex rounded-full border border-[#FFE7A1] bg-[#FFF9E6] p-1 text-sm font-semibold text-slate-900">
  <button
    className={`px-5 py-1.5 rounded-full transition ${
      active ? 'bg-[#FFD84D] text-slate-900 shadow' : 'text-slate-500'
    }`}
  >
    {label}
  </button>
</div>
```

### Input Container

```jsx
<div className="rounded-2xl border border-[#FFE7A1] bg-[#FFFBF0] p-5 shadow-inner">
  {children}
</div>
```

### Preset Card (Selected State)

```jsx
<button
  className={`flex flex-col items-center rounded-2xl px-2 pb-2 pt-2 transition border-2 ${
    isSelected
      ? 'border-[#F0A202] bg-[#FFF4CC] shadow-[0_10px_25px_rgba(240,162,2,0.25)]'
      : 'border-transparent bg-white'
  }`}
>
  {children}
</button>
```

### Stats Card

```jsx
<div className="rounded-2xl border border-[#FFE7A1] bg-white/70 px-2 py-3">
  <div className="text-lg font-semibold text-slate-900">{value}</div>
  <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
</div>
```

### FAQ Accordion

```jsx
<div className="rounded-3xl border border-[#FFE7A1] bg-white shadow-[0_25px_70px_rgba(247,201,72,0.2)] overflow-hidden">
  <button className="w-full flex items-center justify-between px-6 py-4 text-left">
    <span className="font-semibold text-slate-900">{question}</span>
    <span className="text-[#C69312] text-2xl">{isOpen ? '–' : '+'}</span>
  </button>
  {isOpen && (
    <div className="px-6 pb-6 text-sm text-slate-600">
      {answer}
    </div>
  )}
</div>
```

---

## Layout Patterns

### Page Container

```jsx
<main className="min-h-screen bg-gradient-to-b from-white via-[#FFFBEA] to-white text-slate-900 pb-16">
  <section className="max-w-6xl mx-auto px-4 pt-10 md:pt-16">
    {children}
  </section>
</main>
```

### Two-Column Grid

```jsx
<div className="grid items-start gap-8 lg:grid-cols-2">
  {/* Left column - Controls */}
  <div className="rounded-[32px] border border-[#FFE58F] bg-white/90 shadow-[0_40px_120px_rgba(247,201,72,0.25)] p-6 sm:p-10 space-y-6">
    {children}
  </div>

  {/* Right column - Preview */}
  <div className="relative">
    <div className="rounded-[36px] border border-[#FFE7A1] bg-white shadow-[0_40px_140px_rgba(196,147,18,0.25)] p-4">
      {children}
    </div>
  </div>
</div>
```

### Section with Gradient Background

```jsx
<section className="bg-gradient-to-b from-white to-[#FFF7DA] text-slate-900 mt-20">
  <div className="max-w-6xl mx-auto px-4 py-16 space-y-3 text-center">
    {/* Section header */}
  </div>
  <div className="max-w-6xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-3">
    {/* Content grid */}
  </div>
</section>
```

---

## Animation & Transitions

### Hover Lift Effect

```jsx
className="hover:-translate-y-0.5 transition"
className="hover:-translate-y-1 transition"
```

### Loading Spinner

```jsx
<div className="w-20 h-20 rounded-full border-4 border-[#FFE7A1]/30 border-t-[#FFD84D] animate-spin"></div>
<div className="absolute inset-0 w-20 h-20 rounded-full bg-[#FFD84D]/20 blur-xl"></div>
```

### Animated Dots

```jsx
<div className="flex gap-2 mt-4">
  <div className="w-2 h-2 rounded-full bg-[#FFD84D] animate-pulse" style={{ animationDelay: '0ms' }}></div>
  <div className="w-2 h-2 rounded-full bg-[#FFD84D] animate-pulse" style={{ animationDelay: '150ms' }}></div>
  <div className="w-2 h-2 rounded-full bg-[#FFD84D] animate-pulse" style={{ animationDelay: '300ms' }}></div>
</div>
```

### Button Hover Scale

```jsx
className="hover:scale-110 transition-all duration-200"
```

---

## Comparison Slider

### Slider Line

```jsx
<div
  className="absolute inset-y-6 w-px bg-white"
  style={{
    left: `calc(${sliderPosition}% - 0.5px)`,
    boxShadow: '0 0 25px rgba(255,255,255,0.8)',
  }}
/>
```

### Slider Handle

```jsx
<div
  className="absolute top-1/2 -mt-6 h-12 w-12 -translate-x-1/2 rounded-full border border-white/80 bg-white/90 text-slate-800 shadow-2xl flex items-center justify-center cursor-[ew-resize]"
  style={{ left: `${sliderPosition}%` }}
>
  ⇆
</div>
```

---

## Responsive Breakpoints

| Breakpoint | Usage |
|------------|-------|
| `sm:` | Button layout changes, padding adjustments (640px+) |
| `md:` | Grid columns, padding top adjustments (768px+) |
| `lg:` | Two-column layout activation (1024px+) |

---

## File Structure

```
src/app/[locale]/ai-image-effects/ai-hairstyle/
└── page.tsx                    # Server component with SEO metadata

src/components/
└── AiHairstyleExperience.tsx   # Main client component with all UI
```

---

## Key Design Principles

1. **Warm, inviting palette** - Uses banana yellow (#FFD84D) as primary accent with cream/warm whites
2. **Soft, rounded aesthetic** - Large border-radius values (28px-36px) for major containers
3. **Layered depth** - Multiple shadow layers with yellow/gold tints
4. **Glass morphism touches** - Semi-transparent backgrounds (`bg-white/90`, `bg-white/70`)
5. **Consistent spacing** - Uses Tailwind's spacing scale with `space-y-*` and `gap-*`
6. **Micro-interactions** - Subtle hover lifts and transitions throughout
7. **Progressive disclosure** - FAQ accordion pattern, tab switching for input modes
