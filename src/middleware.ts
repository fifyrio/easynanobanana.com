import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { config as appConfig } from './lib/config'

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Run intl middleware first to handle routing (e.g., / -> /en)
  // This returns a response with the correct headers
  const response = intlMiddleware(request);

  // 2. Initialize Supabase
  const supabase = createServerClient(
    appConfig.supabase.url,
    appConfig.supabase.anonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 3. Refresh session
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/', 
    '/(de|en|fr|zh)/:path*',
    '/((?!api|_next|_vercel|.*\..*).*)'
  ]
}