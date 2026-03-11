# App Store Promotion on /image-editor Page

## Goal
Drive web traffic to the iOS App Store by adding an App download promotion to the /image-editor page.

**App Store Link:** https://apps.apple.com/us/app/vido-ai-photo-to-video/id6758744274
**Promo Image:** https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/25/e2/1b/25e21bb6-c378-74f8-b1a6-b1654541e6a7/iphone_5_your_face_any_style.png/460x996bb.webp

## Approach: 3-Column Layout + Mobile Floating Bar

### Desktop (>= lg): Third Column Sidebar

**Layout change:**
- Current: `grid-cols-1 lg:grid-cols-2` (input | result)
- New: `grid-cols-1 lg:grid-cols-[1fr_1fr_220px]` (input | result | promo)

**Promo card content (top to bottom):**
1. Title text: "Try on Mobile"
2. App screenshot (460x996 vertical phone screenshot)
3. "Download on App Store" button (Apple official black badge style)

**Promo card styling:**
- `bg-white rounded-xl shadow-sm border p-4`
- `sticky top-24` to stay visible while scrolling
- `hidden lg:block` (hidden on mobile)
- Image and button both link to App Store (`target="_blank" rel="noopener noreferrer"`)

### Mobile (< lg): Fixed Bottom Floating Bar

**Position:** `fixed bottom-0 left-0 right-0 z-50`

**Content (single row, horizontal):**
- Left: App icon (40x40) + "Vido - AI Photo to Video" text
- Right: "Get App" button (yellow, links to App Store)

**Styling:**
- `bg-white border-t shadow-lg`, ~64px height
- Small X close button (top-right corner)
- Close state saved to sessionStorage (dismissed for current session)
- `pb-safe` for iPhone safe area inset
- `lg:hidden` (hidden on desktop)

## Files to Modify

1. `src/components/ImageEditor.tsx` - Add third column and mobile floating bar
2. No new components needed - inline in ImageEditor since it's a single-use element
