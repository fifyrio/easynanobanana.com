# Mobile Responsive Preset Grid Pattern

## Problem
Horizontal scroll containers with fixed-width items cause overflow issues on mobile devices.

## Solution
Use separate layouts for mobile (wrap grid) and desktop (horizontal scroll).

```tsx
{/* Mobile: 3-column wrap grid */}
<div className="grid grid-cols-3 gap-2 sm:hidden">
  {items.map(item => (
    <button className="flex flex-col items-center ...">
      <div className="relative h-14 w-full ...">
        <Image fill sizes="80px" className="object-cover" />
      </div>
      <span className="text-[10px] line-clamp-2">{item.name}</span>
    </button>
  ))}
</div>

{/* Desktop: horizontal scroll */}
<div className="hidden sm:block overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
  <div className="inline-grid grid-rows-2 auto-cols-[90px] grid-flow-col gap-3 pr-6">
    {items.map(item => (
      <button className="flex w-[90px] flex-col ...">...</button>
    ))}
  </div>
</div>
```

## Key Points

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Layout | `grid grid-cols-3` | `inline-grid grid-flow-col` |
| Visibility | `sm:hidden` | `hidden sm:block` |
| Item width | Fluid (1/3) | Fixed (`w-[90px]`) |
| Overflow | None | `overflow-x-auto` |

## Tips
- Use `aspect-square` for consistent image ratios on mobile
- Hide "Swipe" hint on mobile: `className="hidden sm:block"`
- Use `line-clamp-2` or `truncate` for long labels
- Add `[-webkit-overflow-scrolling:touch]` for smooth iOS scroll
