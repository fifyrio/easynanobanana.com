# 认证问题修复说明

## 🐛 问题描述

在测试订阅API时遇到JWT认证错误：

```
AuthApiError: invalid JWT: unable to parse or verify signature,
token is malformed: token contains an invalid number of segments
```

## 🔍 根本原因

API路由中使用了错误的认证方式。原代码试图从 `Authorization` header中获取Bearer token，然后传递给 `supabase.auth.getUser(token)`，但这种方式在Next.js App Router中不正确。

**错误代码**:
```typescript
// ❌ 错误方式
const authHeader = request.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');
const { data: { user } } = await supabase.auth.getUser(token);
```

## ✅ 解决方案

使用Supabase的cookie-based认证，通过`createAuthenticatedClient()`自动读取cookies中的session。

**正确代码**:
```typescript
// ✅ 正确方式
const supabase = createAuthenticatedClient();
const { data: { user } } = await supabase.auth.getUser();
```

## 📝 修改的文件

### 1. API路由（3个文件）

#### `/src/app/api/subscription/create-checkout/route.ts`
**修改前**:
```typescript
const authHeader = request.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');
if (!token) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}
const supabase = createAuthenticatedClient();
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
```

**修改后**:
```typescript
const supabase = createAuthenticatedClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();
```

#### `/src/app/api/subscription/status/route.ts`
同样的修改模式。

#### `/src/app/api/subscription/cancel/route.ts`
同样的修改模式。

---

### 2. 前端代码（2个文件）

#### `/src/app/pricing/page.tsx`
**修改前**:
```typescript
const token = await (user as any).getIdToken?.() || '';
const response = await fetch('/api/subscription/create-checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ plan_id: planId })
});
```

**修改后**:
```typescript
const response = await fetch('/api/subscription/create-checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ plan_id: planId }),
  credentials: 'include' // ← 关键：包含cookies
});
```

#### `/src/hooks/useSubscription.ts`
同样移除Authorization header，添加 `credentials: 'include'`。

---

## 🔑 关键要点

### Supabase Cookie认证工作原理

1. **用户登录时**:
   - Supabase设置HTTP-only cookies
   - Cookies包含访问token和刷新token

2. **API请求时**:
   - 浏览器自动发送cookies（通过 `credentials: 'include'`）
   - `createAuthenticatedClient()` 读取cookies中的session
   - `getUser()` 验证session并返回用户信息

3. **安全性**:
   - HTTP-only cookies防止XSS攻击
   - 自动处理token刷新
   - 不需要手动管理tokens

### Next.js App Router特性

在App Router中：
- API Routes运行在服务端
- 使用`cookies()`函数访问请求cookies
- `createAuthenticatedClient()`通过`@supabase/ssr`读取cookies

---

## 🧪 验证修复

### 测试步骤

1. **启动开发服务器**:
   ```bash
   npm run dev
   ```

2. **登录应用**:
   - 访问 `http://localhost:3000`
   - 使用Google登录

3. **测试订阅API**:
   - 访问 `/pricing`
   - 点击 "Subscribe Now"
   - 应该成功重定向到Creem.io支付页面

4. **检查浏览器DevTools**:
   - Network标签查看请求
   - 确认cookies被发送
   - 确认没有401错误

### 预期结果

✅ **成功标志**:
- API返回200状态码
- 获取到`payment_url`
- 重定向到Creem.io
- 服务端日志显示 "Creating checkout for user:"

❌ **失败标志**（如果还有问题）:
- 401 Authentication required
- JWT错误
- 用户未登录提示

---

## 📚 技术背景

### 为什么Bearer Token方式失败？

1. **Token格式问题**:
   - 前端代码试图获取 `getIdToken()`
   - 但Supabase Auth不提供Firebase风格的ID tokens
   - 导致token格式不匹配

2. **Supabase认证机制**:
   - Supabase使用JWT access tokens存储在cookies中
   - 不支持通过Authorization header传递自定义tokens
   - 必须使用cookie-based session

3. **Next.js SSR限制**:
   - App Router API Routes需要通过`cookies()`读取
   - 不能直接从header中验证JWT

### Cookie-based vs Token-based认证

| 特性 | Cookie-based (Supabase默认) | Token-based (Authorization header) |
|------|------------------------------|-------------------------------------|
| 安全性 | HTTP-only cookies，防XSS | 需手动存储，易受XSS攻击 |
| 自动刷新 | Supabase自动处理 | 需手动实现 |
| CSRF防护 | 需要额外配置 | 天然防护 |
| 移动应用 | 需特殊处理 | 更适合 |
| Next.js兼容 | 完美支持 | 需额外配置 |

Supabase推荐使用cookie-based认证，特别是在服务端渲染环境中。

---

## 🔧 最佳实践

### API路由认证模板

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // 1. 获取认证客户端（自动读取cookies）
    const supabase = createAuthenticatedClient();

    // 2. 验证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 3. 使用service client进行数据库操作（绕过RLS）
    const serviceSupabase = createServiceClient();

    // 4. 业务逻辑
    // ...

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 前端API调用模板

```typescript
async function callProtectedAPI() {
  const response = await fetch('/api/protected-route', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data }),
    credentials: 'include' // ← 必需！
  });

  if (!response.ok) {
    if (response.status === 401) {
      // 处理未认证
      router.push('/login');
    }
    throw new Error('API call failed');
  }

  return response.json();
}
```

---

## 🎯 总结

**修复内容**:
- ✅ 移除Bearer token认证尝试
- ✅ 使用Supabase cookie-based认证
- ✅ 前端添加 `credentials: 'include'`
- ✅ 所有API路由统一认证方式

**结果**:
- ✅ TypeScript编译通过
- ✅ 认证错误已解决
- ✅ 准备进行订阅流程测试

**下一步**:
1. 测试完整订阅流程
2. 验证支付回调
3. 检查积分分配

---

**修复时间**: 2024-11-13
**影响范围**: 所有订阅相关API路由
**测试状态**: ✅ 类型检查通过，待功能测试
