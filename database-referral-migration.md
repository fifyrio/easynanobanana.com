# 推荐系统数据库重构迁移脚本

## 问题分析

### 当前问题
1. **推荐码格式冗长** - 使用UUID格式(36字符)，用户不友好
2. **推荐系统不一致** - 混合两套不同的表结构和逻辑  
3. **缺失触发器** - 用户注册时推荐逻辑未自动触发
4. **referrals表未更新** - 只有user_profiles.referred_by，referrals表未被正确使用

### 重构目标
- 生成6位短格式推荐码(如: `AB3K9M`)
- 统一使用referrals表记录推荐关系
- 完善推荐奖励机制：注册+10积分，首购+30/20积分
- 添加推荐码验证和统计功能

## 执行步骤

**注意：请按顺序执行以下SQL语句**

### 1. 创建短格式推荐码生成函数

```sql
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  code text;
  chars text := 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; -- Exclude O and 0 to avoid confusion
  i integer;
BEGIN
  LOOP
    code := '';
    -- Generate 6-character code
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code is unique
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE referral_code = code) THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$function$;
```

### 2. 修改user_profiles表的推荐码默认值

```sql
ALTER TABLE public.user_profiles 
ALTER COLUMN referral_code SET DEFAULT generate_referral_code();
```

### 3. 更新现有用户的长推荐码为短格式

```sql
UPDATE public.user_profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code LIKE '%-%';  -- UUID格式包含连字符
```

### 4. 重写推荐注册处理函数

```sql
CREATE OR REPLACE FUNCTION public.handle_referral_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  referrer_uuid uuid;
BEGIN
  -- If user was referred, create referral record
  IF NEW.referred_by IS NOT NULL THEN
    -- Insert referral record
    INSERT INTO public.referrals (referrer_id, referee_id, status)
    VALUES (NEW.referred_by, NEW.id, 'pending');
    
    -- Give immediate signup bonus to referrer (10 credits for registration)
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (NEW.referred_by, 10, 'referral', 'Referral signup bonus');
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_referral_signup trigger: %', SQLERRM;
    RETURN NEW;
END;
$function$;
```

### 5. 修改用户注册函数处理推荐逻辑

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  referrer_id uuid;
  referral_code_param text;
BEGIN
  -- Extract referral code from metadata if exists
  referral_code_param := NEW.raw_user_meta_data->>'referral_code';
  
  -- Look up referrer by referral code
  IF referral_code_param IS NOT NULL THEN
    SELECT id INTO referrer_id 
    FROM public.user_profiles 
    WHERE referral_code = referral_code_param;
  END IF;
  
  -- Insert user profile with referrer info
  INSERT INTO public.user_profiles (id, email, first_name, last_name, avatar_url, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url',
    referrer_id
  );
  
  -- Award welcome bonus credits
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (NEW.id, 6, 'bonus', 'Welcome bonus for new user');
  
  RETURN NEW;
END;
$function$;
```

### 6. 添加推荐码验证函数

```sql
CREATE OR REPLACE FUNCTION public.validate_referral_code(code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  referrer_record RECORD;
BEGIN
  -- Check if referral code exists and get referrer info
  SELECT id, first_name, last_name, email 
  INTO referrer_record
  FROM public.user_profiles 
  WHERE referral_code = code;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Invalid referral code'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'referrer_id', referrer_record.id,
    'referrer_name', COALESCE(referrer_record.first_name || ' ' || referrer_record.last_name, referrer_record.email),
    'message', 'Valid referral code'
  );
END;
$function$;
```

### 7. 添加推荐统计函数

```sql
CREATE OR REPLACE FUNCTION public.get_referral_stats(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  total_referrals integer;
  pending_referrals integer;
  completed_referrals integer;
  total_earned_credits integer;
  user_referral_code text;
BEGIN
  -- Get user's referral code
  SELECT referral_code INTO user_referral_code 
  FROM public.user_profiles 
  WHERE id = user_uuid;
  
  -- Count referrals
  SELECT COUNT(*) INTO total_referrals
  FROM public.referrals 
  WHERE referrer_id = user_uuid;
  
  SELECT COUNT(*) INTO pending_referrals
  FROM public.referrals 
  WHERE referrer_id = user_uuid AND status = 'pending';
  
  SELECT COUNT(*) INTO completed_referrals
  FROM public.referrals 
  WHERE referrer_id = user_uuid AND status = 'completed';
  
  -- Calculate total earned credits from referrals
  SELECT COALESCE(SUM(amount), 0) INTO total_earned_credits
  FROM public.credit_transactions 
  WHERE user_id = user_uuid AND transaction_type = 'referral';
  
  RETURN jsonb_build_object(
    'referral_code', user_referral_code,
    'total_referrals', total_referrals,
    'pending_referrals', pending_referrals,
    'completed_referrals', completed_referrals,
    'total_earned_credits', total_earned_credits
  );
END;
$function$;
```

### 8. 添加用户注册推荐触发器

```sql
CREATE TRIGGER handle_referral_on_signup
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_signup();
```

### 9. 更新首次购买时的referrals表状态

```sql
CREATE OR REPLACE FUNCTION public.handle_referral_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Award credits to both referrer and referee when referee makes first purchase
  IF NEW.transaction_type = 'purchase' THEN
    -- Check if this is referee's first purchase and they were referred
    IF EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = NEW.user_id AND referred_by IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.credit_transactions 
        WHERE user_id = NEW.user_id AND transaction_type = 'purchase' AND id != NEW.id
      )
    ) THEN
      -- Update referral status to completed
      UPDATE public.referrals 
      SET status = 'completed', completed_at = NOW()
      WHERE referee_id = NEW.user_id AND status = 'pending';
      
      -- Award referee bonus
      INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
      SELECT NEW.user_id, 20, 'referral', 'Referral bonus for first purchase'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.credit_transactions 
        WHERE user_id = NEW.user_id AND transaction_type = 'referral' AND description = 'Referral bonus for first purchase'
      );
      
      -- Award referrer bonus
      INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
      SELECT up.referred_by, 30, 'referral', 'Referral bonus for successful referral'
      FROM public.user_profiles up
      WHERE up.id = NEW.user_id AND up.referred_by IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.credit_transactions 
        WHERE user_id = up.referred_by AND transaction_type = 'referral' 
        AND description = 'Referral bonus for successful referral'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
```

## 推荐奖励机制

### 奖励流程
1. **用户注册** → 推荐人获得 **10积分**
2. **首次购买** → 推荐人获得 **30积分**，被推荐人获得 **20积分**

### 状态流转
- `pending` → 用户已注册，等待首次购买
- `completed` → 用户已完成首次购买，推荐奖励发放完成

## 功能测试

### 验证推荐码
```sql
SELECT * FROM validate_referral_code('AB3K9M');
```

### 获取推荐统计
```sql
SELECT * FROM get_referral_stats('user-uuid-here');
```

### 检查推荐记录
```sql
SELECT r.*, 
       referrer.email as referrer_email,
       referee.email as referee_email
FROM referrals r
JOIN user_profiles referrer ON r.referrer_id = referrer.id
JOIN user_profiles referee ON r.referee_id = referee.id
ORDER BY r.created_at DESC;
```

## 注意事项

1. **执行顺序很重要** - 必须先创建生成函数，再修改表默认值
2. **数据备份** - 执行前建议备份相关表数据
3. **测试环境** - 建议先在测试环境验证所有功能
4. **触发器依赖** - 确保auth.users表的触发器正常工作

## 完成后验证

执行完所有迁移后，可以通过以下查询验证：

```sql
-- 检查推荐码格式
SELECT referral_code, LENGTH(referral_code) as code_length 
FROM user_profiles 
WHERE referral_code IS NOT NULL;

-- 检查触发器是否存在
SELECT trigger_name, table_name, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE '%referral%';

-- 检查函数是否创建成功
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%referral%';
```