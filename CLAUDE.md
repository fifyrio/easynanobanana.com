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