# 订阅系统快速启动指南

## 🚀 5分钟快速测试

### Step 1: 运行数据库迁移（2分钟）
```bash
# 在Supabase SQL Editor中执行
# 或使用psql命令行
cat database/migrations/001_subscription_mvp.sql | psql YOUR_DATABASE_URL
```

### Step 2: 验证环境变量（1分钟）
打开 `.env.local` 确认：
```bash
PAYMENT_ENV=test
CREEM_TEST_PRO_PRODUCT_ID=prod_7k56fUEJKvEvmAqjGD2BDC
```

### Step 3: 启动开发服务器（30秒）
```bash
npm run dev
```

### Step 4: 测试订阅流程（2分钟）
1. 访问 http://localhost:3000/pricing
2. 登录账户
3. 点击 "Pro Monthly" 的 "Subscribe Now"
4. 在Creem.io测试页面完成支付
5. 验证重定向到 `/dashboard?subscribed=true`

### Step 5: 验证数据（30秒）
```sql
-- 在Supabase SQL Editor中运行
SELECT credits FROM user_profiles WHERE email = 'your@email.com';
-- 应该显示原有积分 + 500

SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 1;
-- 应该有一条 status='active' 的记录
```

---

## 🔑 关键API端点

### 1. 创建订阅
```bash
POST /api/subscription/create-checkout
Body: { "plan_id": "uuid" }
Headers: Authorization: Bearer <JWT>
```

### 2. 支付回调
```bash
GET /api/subscription/callback?order_id=xxx&status=success
# 自动由Creem.io调用，无需手动测试
```

### 3. 获取订阅状态
```bash
GET /api/subscription/status
Headers: Authorization: Bearer <JWT>
```

### 4. 取消订阅
```bash
POST /api/subscription/cancel
Headers: Authorization: Bearer <JWT>
```

---

## 📋 数据库表关系

```
user_profiles (用户档案)
  ├── credits (积分余额)
  ├── active_plan_id → payment_plans (当前计划)
  └── subscription_expires_at (到期时间)

subscriptions (订阅记录)
  ├── user_id → user_profiles
  ├── plan_id → payment_plans
  ├── status (active/cancelled/expired)
  ├── current_period_start/end (周期时间)
  └── cancel_at_period_end (是否取消)

orders (订单)
  ├── user_id → user_profiles
  ├── plan_id → payment_plans
  ├── subscription_id → subscriptions
  ├── status (pending/completed/failed)
  └── external_order_id (Creem.io checkout ID)

credit_transactions (积分交易)
  ├── user_id → user_profiles
  ├── order_id → orders
  ├── amount (积分数量，正数=购买，负数=使用)
  └── transaction_type (purchase/usage/refund)
```

---

## 🎯 MVP功能清单

### ✅ 已实现
- [x] 月付订阅（Basic $7.99, Pro $27.99, Max $78.99）
- [x] Creem.io支付集成
- [x] 自动积分分配
- [x] 防止重复订阅
- [x] 幂等性保证（重复回调不重复发放）
- [x] 周期结束时取消（保留积分到期末）
- [x] 订阅状态查询API

### ⏳ 待开发（Phase 2 前端）
- [ ] 定价页面订阅按钮集成
- [ ] 仪表盘订阅卡片组件
- [ ] 取消订阅UI流程
- [ ] 订阅成功提示toast

### 🔮 未来功能（Phase 3+）
- [ ] 年付订阅（20%折扣）
- [ ] 订阅升级/降级
- [ ] 到期邮件提醒
- [ ] 管理员订阅管理界面

---

## 🐛 常见问题

### Q: 支付完成后没有分配积分？
**A**: 检查：
1. 订单状态是否为 `completed`
2. `credit_transactions` 表是否有记录
3. 服务端日志是否有 `=== Subscription Created Successfully ===`

### Q: 重复访问回调URL会重复分配积分吗？
**A**: 不会。代码检查 `order.status === 'completed'` 实现幂等性。

### Q: 如何测试取消订阅？
**A**:
```bash
# 获取JWT token从浏览器cookie
curl -X POST http://localhost:3000/api/subscription/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Q: Creem.io不支持自动续费怎么办？
**A**: MVP采用手动续费模式：
1. 到期前7天发送邮件提醒（Phase 2 cron job）
2. 用户点击邮件中的链接重新订阅
3. 创建新订单和订阅记录

---

## 📞 调试技巧

### 查看订阅状态
```sql
SELECT
  s.id,
  s.status,
  s.cancel_at_period_end,
  p.name as plan_name,
  u.credits,
  s.current_period_end
FROM subscriptions s
JOIN payment_plans p ON s.plan_id = p.id
JOIN user_profiles u ON s.user_id = u.id
WHERE s.user_id = 'YOUR_USER_ID'
ORDER BY s.created_at DESC;
```

### 查看积分交易历史
```sql
SELECT
  amount,
  transaction_type,
  description,
  created_at
FROM credit_transactions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

### 服务端日志关键词
- `Creating checkout for user:` - 开始创建订阅
- `=== Subscription Callback Started ===` - 支付回调开始
- `Subscription created:` - 订阅创建成功
- `Credits allocated:` - 积分分配成功
- `CRITICAL ERROR` - 严重错误

---

## 🎓 代码位置速查

| 功能 | 文件路径 |
|------|----------|
| 数据库迁移 | `database/migrations/001_subscription_mvp.sql` |
| 创建订阅API | `src/app/api/subscription/create-checkout/route.ts` |
| 支付回调API | `src/app/api/subscription/callback/route.ts` |
| 订阅状态API | `src/app/api/subscription/status/route.ts` |
| 取消订阅API | `src/app/api/subscription/cancel/route.ts` |
| Creem客户端 | `src/lib/payment/creem-client.ts` |
| Supabase工具 | `src/lib/supabase-server.ts` |

---

## 📊 性能优化

- **数据库索引**: 3个新索引加速查询
  - `idx_subscriptions_user_status`
  - `idx_subscriptions_renewal`
  - `idx_user_profiles_subscription`

- **反范式化**: `user_profiles` 存储 `active_plan_id` 和 `subscription_expires_at`，避免JOIN查询

- **幂等性**: 避免重复处理导致的数据库压力

---

**准备好了吗？开始测试吧！** 🚀

如有问题，查看 `SUBSCRIPTION_MVP_TESTING.md` 获取详细测试步骤。
