# Node.js API推荐系统更新指南

## 当前API分析

经过分析，现有的Node.js API基本上是兼容的，但需要几个小调整来配合数据库重构：

### 现有API状态
✅ **无需更改的API:**
- `/api/referral/validate` - 已经正确使用了推荐码验证
- `/api/credits/referral` - 已经正确读取referrals表和统计

❌ **需要更新的部分:**
- AuthContext中的Google登录流程需要传递推荐码
- auth callback需要处理推荐码

## 需要的更新

### 1. 修改AuthContext以支持推荐码传递

**文件:** `src/contexts/AuthContext.tsx`

```typescript
const signInWithGoogle = async () => {
  // 获取localStorage中存储的推荐码
  const referralCode = typeof window !== 'undefined' ? localStorage.getItem('referralCode') : null;
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      // 将推荐码添加到用户元数据中
      ...(referralCode && {
        queryParams: {
          referral_code: referralCode
        }
      })
    }
  });
  
  if (error) {
    console.error('Error signing in with Google:', error.message);
  }
};
```

### 2. 修改auth callback处理推荐码

**文件:** `src/app/auth/callback/page.tsx`

在处理成功登录后，清除localStorage中的推荐码：

```typescript
useEffect(() => {
  const handleAuthCallback = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        setError(error.message);
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      if (data.session) {
        console.log('Authentication successful:', data.session.user);
        
        // 清除推荐码，因为已经在数据库触发器中处理
        if (typeof window !== 'undefined') {
          localStorage.removeItem('referralCode');
        }
        
        window.history.replaceState({}, document.title, window.location.pathname);
        router.push('/');
      } else {
        // ... 其余逻辑不变
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      setError('Authentication failed');
      setTimeout(() => router.push('/'), 3000);
    }
  };

  const timer = setTimeout(handleAuthCallback, 100);
  return () => clearTimeout(timer);
}, [router]);
```

### 3. 确认handle_new_user函数正确读取推荐码

由于Supabase的OAuth流程限制，推荐码可能需要通过不同方式传递。更可靠的方法是：

**选项A: 使用URL参数传递**

修改 `signInWithGoogle` 函数：

```typescript
const signInWithGoogle = async () => {
  const referralCode = typeof window !== 'undefined' ? localStorage.getItem('referralCode') : null;
  
  // 构建重定向URL，包含推荐码
  const redirectUrl = referralCode 
    ? `${window.location.origin}/auth/callback?ref=${referralCode}`
    : `${window.location.origin}/auth/callback`;
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });
  
  if (error) {
    console.error('Error signing in with Google:', error.message);
  }
};
```

然后在auth callback中处理：

```typescript
const handleAuthCallback = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (error) {
      console.error('Auth callback error:', error);
      setError(error.message);
      setTimeout(() => router.push('/'), 3000);
      return;
    }

    if (data.session && referralCode) {
      // 将推荐码保存到用户的metadata或者发送到API
      await supabase.auth.updateUser({
        data: { referral_code: referralCode }
      });
    }

    // 其余逻辑...
  } catch (error) {
    // 错误处理...
  }
};
```

**选项B: 创建专门的API端点处理推荐关系**

创建新的API端点 `/api/user/link-referral`:

```typescript
// src/app/api/user/link-referral/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json();
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();
    
    // 检查用户是否已经被推荐过
    const { data: existingProfile } = await serviceSupabase
      .from('user_profiles')
      .select('referred_by')
      .eq('id', user.id)
      .single();
    
    if (existingProfile?.referred_by) {
      return NextResponse.json({ 
        error: 'User already has a referrer' 
      }, { status: 400 });
    }
    
    // 查找推荐人
    const { data: referrer } = await serviceSupabase
      .from('user_profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .single();
    
    if (!referrer) {
      return NextResponse.json({ 
        error: 'Invalid referral code' 
      }, { status: 404 });
    }
    
    // 更新用户的推荐关系
    await serviceSupabase
      .from('user_profiles')
      .update({ referred_by: referrer.id })
      .eq('id', user.id);
    
    // 创建推荐记录
    await serviceSupabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referee_id: user.id,
        status: 'pending'
      });
    
    // 给推荐人奖励积分
    await serviceSupabase
      .from('credit_transactions')
      .insert({
        user_id: referrer.id,
        amount: 5,
        transaction_type: 'referral',
        description: 'Referral signup bonus'
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Link referral error:', error);
    return NextResponse.json(
      { error: 'Failed to link referral' },
      { status: 500 }
    );
  }
}
```

然后在auth callback中调用这个API：

```typescript
if (data.session && referralCode) {
  // 调用API建立推荐关系
  try {
    await fetch('/api/user/link-referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.session.access_token}`
      },
      body: JSON.stringify({ referralCode })
    });
  } catch (error) {
    console.error('Failed to link referral:', error);
  }
}
```

### 4. 更新现有的推荐统计显示

检查 `src/components/FreeCredits.tsx` 中的奖励数值是否与数据库配置一致：

```typescript
// 确保显示的奖励数值与数据库设置匹配
// 根据我们的配置：注册+5积分，首购推荐人+50积分，被推荐人+20积分
{
  icon: '👥',
  title: 'Invite Friends',
  description: 'Invite friends to sign up and earn 5 credits per signup, 50 more when they make first purchase.',
  reward: '+55 Credits',
  action: 'Share Link',
  onClick: () => setShowShareModal(true)
}
```

## 推荐方案

我建议使用 **选项B（API端点方式）**，因为：

1. **更可靠** - 不依赖OAuth流程的限制
2. **更灵活** - 可以处理各种边界情况
3. **更好的错误处理** - 可以给用户明确的反馈
4. **更好的追踪** - 可以记录推荐关系建立的详细信息

## 测试验证

完成更新后，请验证以下流程：

1. **推荐链接访问** - `/ref/ABC123` 正确显示推荐信息
2. **新用户注册** - 通过推荐链接注册后正确建立推荐关系
3. **积分奖励** - 推荐人获得5积分注册奖励
4. **推荐统计** - `/free-credits` 页面正确显示推荐统计
5. **首购奖励** - 被推荐人首次购买时，双方获得正确积分

## 注意事项

1. **防止重复推荐** - API需要检查用户是否已有推荐人
2. **自我推荐防护** - 防止用户使用自己的推荐码
3. **推荐码有效性** - 确保推荐码存在且有效
4. **错误处理** - 提供清晰的错误信息给用户
5. **清理localStorage** - 成功建立推荐关系后清理临时数据