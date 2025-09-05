-- 删除用户 ID 为 58398229-d4c3-4c72-8821-708d99e599df 的所有关联数据
-- 注意：此操作不可逆，请谨慎执行

BEGIN;

-- 设置要删除的用户 ID
\set user_id '58398229-d4c3-4c72-8821-708d99e599df'

-- 1. 删除用户活动记录
DELETE FROM public.user_activity 
WHERE user_id = :'user_id';

-- 2. 删除推荐记录（作为推荐人和被推荐人）
DELETE FROM public.referrals 
WHERE referrer_id = :'user_id' OR referee_id = :'user_id';

-- 3. 删除积分交易记录
DELETE FROM public.credit_transactions 
WHERE user_id = :'user_id';

-- 4. 删除用户生成的图片记录
DELETE FROM public.images 
WHERE user_id = :'user_id';

-- 5. 删除用户订单记录
DELETE FROM public.orders 
WHERE user_id = :'user_id';

-- 6. 删除用户订阅记录
DELETE FROM public.subscriptions 
WHERE user_id = :'user_id';

-- 7. 更新其他用户的 referred_by 字段（如果该用户是推荐人）
UPDATE public.user_profiles 
SET referred_by = NULL 
WHERE referred_by = :'user_id';

-- 8. 最后删除用户档案记录
DELETE FROM public.user_profiles 
WHERE id = :'user_id';

-- 9. 删除 auth.users 中的用户记录（如果存在）
DELETE FROM auth.users 
WHERE id = :'user_id';

COMMIT;

-- 验证删除结果
SELECT 'Deletion completed for user:' as status, :'user_id' as user_id;
