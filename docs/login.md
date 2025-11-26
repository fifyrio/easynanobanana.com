# 登录功能 SOP 文档

## 概述

本项目使用 **Supabase Auth + Google OAuth** 实现用户登录认证系统。

---

## 环境变量配置

在 `.env.local` 中添加以下配置：

```bash
# Supabase 配置 (必需)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT 配置 (必需)
JWT_SECRET=your_jwt_secret

# 应用配置
NEXTAUTH_URL=https://www.yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret
```

### Supabase 控制台配置

1. 进入 Supabase Dashboard > Authentication > Providers
2. 启用 Google Provider
3. 配置 Google OAuth Client ID 和 Secret
4. 设置 Redirect URL: `https://your-domain.com/auth/callback`

---

## 核心代码结构

```
src/
├── lib/
│   ├── supabase.ts           # 客户端 Supabase 实例
│   ├── supabase-server.ts    # 服务端 Supabase 实例
│   └── config.ts             # 环境变量配置
├── contexts/
│   └── AuthContext.tsx       # 认证状态管理
└── app/
    ├── login/page.tsx        # 登录页面
    └── auth/callback/page.tsx # OAuth 回调处理
```

---

## 核心代码示例

### 1. Supabase 客户端初始化 (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'
import { config } from './config'

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
)

export async function signInWithGoogle() {
  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : `${config.app.url}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  })

  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}
```

### 2. 服务端 Supabase 客户端 (`src/lib/supabase-server.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';
import { createServerClient as createSupabaseSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Service Client (绕过 RLS)
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// 认证用户客户端 (Server Component)
export async function createAuthenticatedClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseSSRClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component 中会忽略此错误
          }
        },
      },
    }
  );
}
```

### 3. AuthContext 认证上下文 (`src/contexts/AuthContext.tsx`)

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  credits: number | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 确保用户 profile 存在
  const ensureProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      // 获取已存在的 profile
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        return existingProfile;
      }

      // 如果不存在，通过 API 创建
      const referralCode = localStorage.getItem('referralCode');

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode })
      });

      if (response.ok) {
        const { profile } = await response.json();
        if (referralCode) localStorage.removeItem('referralCode');
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Error ensuring profile:', error);
      return null;
    }
  };

  // 刷新用户 profile
  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);
  };

  useEffect(() => {
    // 获取初始会话
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        const userProfile = await ensureProfile(sessionUser);
        setProfile(userProfile);
      }

      setLoading(false);
    };

    getInitialSession();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          setTimeout(async () => {
            const userProfile = await ensureProfile(sessionUser);
            setProfile(userProfile);
          }, 1000);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const referralCode = localStorage.getItem('referralCode');

    const redirectUrl = referralCode
      ? `${window.location.origin}/auth/callback?ref=${referralCode}`
      : `${window.location.origin}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 4. 登录页面 (`src/app/login/page.tsx`)

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <button onClick={signInWithGoogle}>
      Continue with Google
    </button>
  );
}
```

### 5. OAuth 回调处理 (`src/app/auth/callback/page.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref');

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setError(error.message);
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        if (data.session) {
          // 处理推荐码链接
          if (referralCode) {
            await fetch('/api/user/link-referral', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`
              },
              body: JSON.stringify({ referralCode })
            });
          }

          localStorage.removeItem('referralCode');
          router.push('/');
        } else {
          router.push('/');
        }
      } catch (error) {
        setError('Authentication failed');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    setTimeout(handleAuthCallback, 100);
  }, [router]);

  return (
    <div>
      {error ? <p>Error: {error}</p> : <p>Completing sign in...</p>}
    </div>
  );
}
```

---

## 使用方式

### 在组件中使用认证

```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function MyComponent() {
  const { user, profile, loading, signInWithGoogle, signOut, refreshProfile } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <button onClick={signInWithGoogle}>Login</button>;
  }

  return (
    <div>
      <p>Welcome, {profile?.email}</p>
      <p>Credits: {profile?.credits}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### 在 API Route 中验证用户

```typescript
import { createAuthenticatedClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  const supabase = await createAuthenticatedClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 处理已认证用户的请求
}
```

---

## 数据库表结构

### user_profiles 表

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 认证流程

1. 用户点击 "Continue with Google" 按钮
2. 调用 `signInWithGoogle()` 触发 OAuth 流程
3. 用户在 Google 页面完成授权
4. 重定向到 `/auth/callback`
5. 回调页面获取 session 并处理推荐码
6. 重定向到首页，AuthContext 更新用户状态
7. 自动创建或获取 user_profile

---

## 注意事项

- 确保在 Supabase Dashboard 中配置正确的 Redirect URLs
- 生产环境需要配置正确的域名
- `SUPABASE_SERVICE_ROLE_KEY` 仅在服务端使用，不要暴露到客户端
- 新用户首次登录会自动获得默认 credits (配置在 `config.ts` 中)
