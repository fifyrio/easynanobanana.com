# Login Modal Pattern for AI Experience Pages

## Overview

All AI tool Experience components must use the `LoginModal` popup for unauthenticated users instead of inline error messages. This provides a seamless login flow where users never leave the current page.

## Architecture

```
User clicks Generate (not logged in)
  → LoginModal opens (our branded modal)
    → User clicks "Continue with Google"
      → Google OAuth popup opens (browser popup window)
        → User signs in with Google
          → Popup auto-closes
            → Parent page detects auth via onAuthStateChange + polling
              → LoginModal auto-closes (watches `user` state)
                → User can now click Generate again
```

### Key Components

| Component | Role |
|-----------|------|
| `LoginModal` (`src/components/ui/LoginModal.tsx`) | Branded login UI with Google sign-in button, auto-closes on auth |
| `AuthContext` (`src/contexts/AuthContext.tsx`) | `signInWithGoogle()` opens popup, polls for close, syncs session |
| `auth/callback` (`src/app/[locale]/auth/callback/page.tsx`) | Detects popup via `window.opener`, auto-closes after session exchange |
| `tailwind.config.js` | `animate-modal-in` keyframes for entrance animation |
| `messages/*.json` | `pages.auth.loginModal` i18n keys in all 14 locales |

## How to Apply to an Experience Component

Each AI Experience component needs 3 changes:

### 1. Add import and state

```diff
+ import LoginModal from './ui/LoginModal';

  export default function AiXxxExperience(...) {
    ...
    const [isDragActive, setIsDragActive] = useState(false);
+   const [showLoginModal, setShowLoginModal] = useState(false);
    const creditsRequired = 5;
```

### 2. Replace `setError(t('error.signIn'))` with `setShowLoginModal(true)`

There are TWO places in every component:

**a) Pre-request validation in `handleGenerate`:**
```diff
  if (!user) {
-   setError(t('error.signIn'));
+   setShowLoginModal(true);
    return;
  }
```

**b) API 401 response handler:**
```diff
  if (response.status === 401) {
-   setError(t('error.signIn'));
+   setShowLoginModal(true);
  }
```

### 3. Render LoginModal before closing `</>`

```diff
+     <LoginModal
+       isOpen={showLoginModal}
+       onClose={() => setShowLoginModal(false)}
+     />
    </>
  );
}
```

## Critical Design Decisions

### Popup OAuth (not redirect)
`signInWithGoogle()` uses `skipBrowserRedirect: true` + `window.open()`. User stays on the current page throughout.

### Popup close polling
After opening the popup, parent window polls `popup.closed` every 500ms. On close, calls `supabase.auth.getSession()` to sync session from localStorage into the parent's Supabase client instance.

### Auto-close LoginModal
`LoginModal` watches `user` via `useEffect`. When `user` becomes truthy (after popup auth completes), it calls `onClose()` automatically.

### Auth callback popup detection
`/auth/callback` checks `window.opener` to determine if it's in a popup. If yes, it calls `window.close()` after session exchange instead of redirecting.

## Common Mistakes to Avoid

1. **Forgetting the 401 handler** — Every component has TWO `setError(t('error.signIn'))` calls. The second one in the API response handler is easy to miss.
2. **Not auto-closing the modal** — The modal MUST close after login succeeds. This is handled by LoginModal internally watching `user` state.
3. **Not polling popup close** — `onAuthStateChange` alone is unreliable for cross-window session sync. Must actively poll + `getSession()`.

## Supported Locales

i18n keys at `pages.auth.loginModal` exist in all 14 locales:
en, zh, zh-TW, de, es, fr, id, it, ja, ko, pt, ru, th, vi
