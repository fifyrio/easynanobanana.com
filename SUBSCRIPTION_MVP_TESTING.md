# Subscription MVP Testing Guide

## Overview
This guide walks through testing the subscription payment system with Creem.io test mode.

## Prerequisites

### 1. Run Database Migration
```bash
# Connect to your Supabase database and run:
psql YOUR_DATABASE_URL -f database/migrations/001_subscription_mvp.sql
```

Or execute the SQL directly in Supabase SQL Editor.

### 2. Verify Environment Variables
Ensure `.env.local` contains:
```bash
PAYMENT_ENV=test
CREEM_TEST_API_KEY=creem_test_3RmUnu82nN89o9cwmeayEI
CREEM_TEST_BASIC_PRODUCT_ID=prod_3KFxwJUmVr3pXPf7GD1SiQ
CREEM_TEST_PRO_PRODUCT_ID=prod_7k56fUEJKvEvmAqjGD2BDC
CREEM_TEST_MAX_PRODUCT_ID=prod_76sT9ES9S7YbHLfjzNnOcT
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Start Development Server
```bash
npm run dev
```

---

## Test Scenarios

### Scenario 1: Successful Subscription Flow ✅

**Goal**: User subscribes to Pro Monthly plan and receives 500 credits

**Steps**:
1. Navigate to `http://localhost:3000/pricing`
2. Sign in with Google account (if not already signed in)
3. Click "Subscribe Now" on **Pro Monthly** plan ($27.99/mo)
4. Browser redirects to Creem.io test payment page
5. Complete test payment (use Creem.io test card if provided)
6. Redirects back to `http://localhost:3000/dashboard?subscribed=true`

**Expected Results**:
- ✅ User's credit balance increased by 500 credits
- ✅ Subscription record created with `status = 'active'`
- ✅ `current_period_end` set to 30 days from now
- ✅ Order record shows `status = 'completed'`
- ✅ Credit transaction logged with:
  - `amount = 500`
  - `transaction_type = 'purchase'`
  - `description = 'Pro Monthly subscription - 500 credits'`

**Verify in Database**:
```sql
-- Check subscription
SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 1;

-- Check credits
SELECT credits FROM user_profiles WHERE id = 'YOUR_USER_ID';

-- Check transaction
SELECT * FROM credit_transactions WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 1;

-- Check order
SELECT * FROM orders WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 1;
```

---

### Scenario 2: Payment Cancellation ❌

**Goal**: User cancels payment without completing

**Steps**:
1. Navigate to `/pricing`
2. Click "Subscribe Now" on any plan
3. On Creem.io payment page, click "Cancel" or close the window
4. Manually navigate to callback URL: `http://localhost:3000/api/subscription/callback?order_id=ORDER_ID&status=cancel`

**Expected Results**:
- ✅ Redirects to `/pricing?cancelled=true`
- ✅ Order status updated to `failed`
- ✅ No credits allocated
- ✅ No subscription created

**Verify**:
```sql
SELECT status FROM orders WHERE id = 'ORDER_ID';
-- Should return: failed
```

---

### Scenario 3: Idempotency Test 🔁

**Goal**: Duplicate callback doesn't double-credit

**Steps**:
1. Complete Scenario 1 successfully
2. Note the callback URL (contains `order_id`)
3. Visit the same callback URL again in browser
4. Check database for duplicate entries

**Expected Results**:
- ✅ No additional credits added
- ✅ Only one subscription record exists
- ✅ Only one credit transaction for that order
- ✅ Redirects to dashboard with no errors

**Verify**:
```sql
-- Should return only 1 row
SELECT COUNT(*) FROM credit_transactions WHERE order_id = 'ORDER_ID';

-- Should return only 1 row
SELECT COUNT(*) FROM subscriptions WHERE external_subscription_id = 'CHECKOUT_ID';
```

---

### Scenario 4: Check Subscription Status 📊

**Goal**: Status API returns correct subscription info

**Steps**:
1. After subscribing, get user's JWT token from browser dev tools:
   - Open DevTools → Application → Storage → Cookies
   - Find `sb-access-token` or similar
2. Make API request:

```bash
curl -X GET http://localhost:3000/api/subscription/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq
```

**Expected Response**:
```json
{
  "hasSubscription": true,
  "subscription": {
    "id": "uuid",
    "planId": "uuid",
    "planName": "Pro Monthly",
    "creditsIncluded": 500,
    "creditsRemaining": 500,
    "status": "active",
    "currentPeriodStart": "2025-11-13T...",
    "currentPeriodEnd": "2025-12-13T...",
    "daysRemaining": 30,
    "cancelAtPeriodEnd": false,
    "cancelledAt": null,
    "price": 27.99,
    "currency": "USD"
  }
}
```

---

### Scenario 5: Cancel Subscription 🚫

**Goal**: User cancels subscription (keeps access until period end)

**Steps**:
1. After subscribing, make cancel API request:

```bash
curl -X POST http://localhost:3000/api/subscription/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Subscription will be cancelled at period end. You will keep access until then.",
  "expiresAt": "2025-12-13T...",
  "planName": "Pro Monthly"
}
```

**Expected Database State**:
```sql
SELECT cancel_at_period_end, cancelled_at, status
FROM subscriptions
WHERE user_id = 'YOUR_USER_ID';

-- Should return:
-- cancel_at_period_end: true
-- cancelled_at: (current timestamp)
-- status: active (still active until period end)
```

**User Impact**:
- ✅ User keeps all 500 credits until period end
- ✅ Can still generate images
- ✅ Subscription won't auto-renew (manual renewal required in MVP)

---

### Scenario 6: Prevent Duplicate Subscriptions 🛑

**Goal**: User can't subscribe twice

**Steps**:
1. Complete Scenario 1 (subscribe to Pro Monthly)
2. Try to subscribe again to any plan
3. Make checkout request:

```bash
curl -X POST http://localhost:3000/api/subscription/create-checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan_id": "PRO_PLAN_UUID"}'
```

**Expected Response**:
```json
{
  "error": "You already have an active Pro Monthly subscription. Please cancel it first to switch plans."
}
```

**Status Code**: `400 Bad Request`

---

## Console Logging

During testing, watch server console for detailed logs:

### Successful Subscription
```
Creating checkout for user: { userId: '...', email: '...', planId: '...' }
Plan found: { planName: 'Pro Monthly', price: 27.99, credits: 500 }
Order created: { orderId: '...' }
Using Creem product ID: prod_7k56fUEJKvEvmAqjGD2BDC
Creem checkout created: { checkoutId: '...', paymentUrl: '...' }

=== Subscription Callback Started === { orderId: '...', status: 'success', ... }
Order loaded: { orderId: '...', status: 'pending', planName: 'Pro Monthly', ... }
Verifying payment with Creem.io: checkout_...
Creem.io checkout status: { status: 'completed', checkoutId: '...' }
Creating subscription: { userId: '...', planId: '...', credits: 500, ... }
Subscription created: { subscriptionId: '...' }
Credits allocated: { amount: 500 }
=== Subscription Created Successfully ===
```

### Payment Failure/Cancellation
```
=== Subscription Callback Started === { orderId: '...', status: 'cancel' }
User cancelled payment
```

### Idempotent Callback
```
Order already completed, skipping processing (idempotent)
```

---

## Common Issues & Troubleshooting

### Issue 1: "Order not found"
**Cause**: Invalid or missing `order_id` in callback URL
**Solution**: Check order was created in Step 1, verify UUID is correct

### Issue 2: "Payment not completed"
**Cause**: Creem.io checkout status is not 'completed' or 'paid'
**Solution**: Ensure you completed payment on Creem.io test page, check Creem.io dashboard for payment status

### Issue 3: Credits not allocated
**Cause**: Database trigger not firing or credit transaction failed
**Solution**: Check `credit_transactions` table for error, manually update credits if needed:
```sql
UPDATE user_profiles
SET credits = credits + 500
WHERE id = 'YOUR_USER_ID';
```

### Issue 4: "Authentication required"
**Cause**: Missing or invalid JWT token
**Solution**: Sign in again, get fresh token from browser cookies

### Issue 5: Plan name mismatch
**Cause**: `payment_plans` table doesn't have exact plan names
**Solution**: Run migration again or manually insert plans with correct names:
```sql
INSERT INTO payment_plans (name, plan_type, price, credits, duration_months)
VALUES ('Pro Monthly', 'subscription', 27.99, 500, 1);
```

---

## API Endpoint Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/subscription/create-checkout` | POST | Create Creem.io checkout session | ✅ Yes |
| `/api/subscription/callback` | GET | Handle payment redirect | ❌ No |
| `/api/subscription/status` | GET | Get current subscription | ✅ Yes |
| `/api/subscription/cancel` | POST | Cancel at period end | ✅ Yes |

---

## Manual Testing Checklist

Use this checklist to verify all functionality:

- [ ] Database migration applied successfully
- [ ] All 4 API routes created
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] Development server running
- [ ] Test Scenario 1: Successful subscription ✅
- [ ] Test Scenario 2: Payment cancellation ❌
- [ ] Test Scenario 3: Idempotency test 🔁
- [ ] Test Scenario 4: Status API returns correct data 📊
- [ ] Test Scenario 5: Cancel subscription 🚫
- [ ] Test Scenario 6: Prevent duplicate subscriptions 🛑
- [ ] Console logs show detailed information
- [ ] Database records match expected values

---

## Next Steps After Testing

Once all tests pass:

1. **Phase 2A**: Create frontend components (SubscriptionCard, update pricing page)
2. **Phase 2B**: Add subscription expiry cron job (manual renewal reminders)
3. **Phase 3**: Add yearly subscription support
4. **Phase 4**: Production deployment with prod Creem.io keys

---

## Quick Test Script

Run this in browser console after signing in:

```javascript
// Get JWT token
const getCookie = (name) => document.cookie.split('; ').find(r => r.startsWith(name))?.split('=')[1];
const token = getCookie('sb-access-token');

// Test create checkout
fetch('/api/subscription/create-checkout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ plan_id: 'YOUR_PRO_PLAN_UUID' })
})
.then(r => r.json())
.then(data => {
  console.log('Checkout created:', data);
  window.location.href = data.payment_url; // Redirect to payment
});
```

---

**Happy Testing! 🎉**

If you encounter any issues, check:
1. Server console logs
2. Browser DevTools console
3. Supabase database for record states
4. Creem.io dashboard for payment status
