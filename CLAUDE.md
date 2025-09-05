# Claude Code Memory & Best Practices

## File Download System Best Practices

### Problem: CORS Issues with Remote File Downloads
When downloading files from cloud storage (like R2) directly from the frontend, browsers block requests due to CORS policies.

### Solution Architecture: Download Proxy API Pattern

#### 1. **Custom Hook Pattern (`useImageDownload`)**
```typescript
// Extract download logic into reusable hook
const { downloadImage, canDownloadOriginal } = useImageDownload({
  creditsRequired: 1,
  onSuccess: (type) => console.log(`Downloaded ${type}`),
  onError: (error, type) => console.error(`Failed ${type}: ${error}`)
});
```

**Benefits:**
- Centralized download logic
- Reusable across components
- Built-in error handling
- Credit validation

#### 2. **Download Proxy API (`/api/download-image`)**
```typescript
// Server-side proxy to handle CORS and authentication
POST /api/download-image
{
  "imageUrl": "https://storage.provider.com/image.png",
  "type": "preview" | "original", 
  "filename": "result.png"
}
```

**Features:**
- Bypasses CORS restrictions (server-to-server)
- Integrates authentication verification
- Handles credit deduction atomically
- Returns proper download headers (`Content-Disposition: attachment`)

#### 3. **Reusable Components**
```jsx
// Pre-styled components for common scenarios
<PreviewDownloadButton imageUrl={url} filename="image.png" />
<OriginalDownloadButton imageUrl={url} creditsRequired={1} />
```

### Implementation Details

#### Libraries Used:
- **`react-hot-toast`**: User feedback with toast notifications
- **`file-saver`**: Reliable cross-browser file downloads
- **Native Fetch API**: Server-side image retrieval

#### Authentication Flow:
1. Frontend validates user login status
2. API validates JWT token
3. Credit check and deduction in single transaction
4. Image proxy and download

#### Error Handling:
- 401: Authentication required → Redirect to `/pricing`
- 402: Insufficient credits → Redirect to `/pricing`  
- 500: Server errors → Toast error message
- Network errors → Graceful fallback

### Key Patterns:

1. **Separation of Concerns**: 
   - Hook handles download logic
   - Component handles UI/UX
   - API handles server operations

2. **Progressive Enhancement**:
   - Preview downloads work without auth
   - Original downloads require authentication + credits

3. **User Feedback**:
   - Loading states during processing
   - Success/error toast messages
   - Clear credit status indication

4. **Security**:
   - Server-side credit validation
   - JWT token verification
   - No direct cloud storage exposure

### Reusability:
This pattern can be extended to any paid download feature:
- Different credit costs
- Multiple file formats
- Various quality tiers
- Different storage backends

---

## Navigation & UI Best Practices

### CSS-Only Dropdown Hover Pattern
Modern approach for dropdown navigation menus using Tailwind CSS without JavaScript state management.

#### Problem: JavaScript Hover State Issues
Traditional dropdown implementations using `onMouseEnter`/`onMouseLeave` JavaScript events can cause:
- Performance overhead from state updates
- Event timing conflicts when moving between elements
- Complex state management for multiple dropdowns
- Hover interruptions when mouse moves to submenu

#### Solution: Tailwind Group Classes

```tsx
// ✅ Best Practice - CSS-only hover
<div className="relative group">
  <Link 
    href={item.href} 
    className="text-gray-600 hover:text-gray-900 transition-colors font-medium flex items-center px-3 py-2"
  >
    {item.label}
    <svg className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </Link>
  
  {/* Dropdown Menu - Always rendered, CSS controls visibility */}
  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
    {/* Dropdown items */}
  </div>
</div>
```

**Key Techniques:**
1. **`group` class**: Parent container enables group-based hover targeting
2. **`group-hover:opacity-100 group-hover:visible`**: Child elements respond to parent hover
3. **Always render dropdown**: Menu exists in DOM, CSS controls visibility
4. **Smooth transitions**: `transition-all duration-200 ease-in-out`
5. **Interactive feedback**: Arrow rotation `group-hover:rotate-180`

#### Hover Area Optimization

```tsx
// Expand clickable/hoverable area
className="px-3 py-2" // 12px horizontal, 8px vertical padding
```

**Benefits of CSS-Only Approach:**
- **Performance**: No JavaScript state updates or re-renders
- **Reliability**: No event timing conflicts or hover interruptions  
- **Maintainability**: Simpler code without state management
- **Accessibility**: Consistent behavior across devices
- **Responsive**: Works naturally on touch devices

#### Migration Pattern

```tsx
// ❌ Before - JavaScript hover state
const [dropdownOpen, setDropdownOpen] = useState(false);

<div onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
  <Link>Menu Item</Link>
  {dropdownOpen && <div>Dropdown</div>}
</div>

// ✅ After - CSS-only hover
<div className="relative group">
  <Link>Menu Item</Link>
  <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible">
    Dropdown
  </div>
</div>
```

This pattern is the modern standard for dropdown navigation and should be used for all hover-based UI interactions.

---

## Project Structure Notes

### Authentication System
- Uses Supabase auth with Google OAuth
- AuthContext provides `user`, `profile`, `refreshProfile`
- User profile includes `credits` field

### Credit System
- Transactions stored in `credit_transactions` table
- Negative amounts for usage, positive for purchases
- Service client bypasses RLS for server operations

### Testing Commands
- Build: `npm run build`
- Lint: `npm run lint` 
- Type check: `npm run type-check`