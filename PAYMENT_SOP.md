# Payment System - Standard Operating Procedures (SOP)

## Overview

This document outlines the Standard Operating Procedures for the AI payment system, which integrates with Creem.io payment platform to handle subscriptions, one-time payments, and credit management.

## System Architecture

### Core Components

1. **Payment Clients** (`src/lib/payment/`)
   - `creem-client.ts` - Production Creem.io API integration
   - `client.ts` - Mock payment client for development
   - `config.ts` - Environment configuration management
   - `products.ts` - Product definitions and pricing
   - `types.ts` - TypeScript type definitions

2. **API Endpoints** (`src/app/api/payment/`)
   - `/create-order` - Order creation and checkout initiation
   - `/callback` - Payment completion callbacks (GET & POST)
   - `/webhook` - Webhook handlers for payment events

3. **Database Integration** (Supabase PostgreSQL)
   - `user_profiles` - User credits and plan management
   - `orders` - Payment order records
   - `subscriptions` - Subscription management
   - `credit_transactions` - Credit usage tracking

## Product Configuration

### Available Plans

| Product | Product ID | Price | Credits | Type | Duration |
|---------|------------|-------|---------|------|----------|
| AI  Trial | `prod_4oJ0n9ZOU0x2Tn9rQ1oDJ5` | $7.90 | 100 | once | - |
| AI  Basic | `prod_6JrHGnC707qbtiMBiLGlkX` | $19.90 | 300 | subscription | monthly |
| AI  Pro | `prod_5H9ctZ7GUs425KayUilncU` | $49.90 | 1500 | subscription | monthly |

### Environment Configuration

```bash
# Production Environment
PAYMENT_ENV=production
CREEM_PROD_API_KEY=your_production_key
CREEM_PROD_TRIAL_PRODUCT_ID=prod_4oJ0n9ZOU0x2Tn9rQ1oDJ5
CREEM_PROD_BASIC_PRODUCT_ID=prod_6JrHGnC707qbtiMBiLGlkX
CREEM_PROD_PRO_PRODUCT_ID=prod_5H9ctZ7GUs425KayUilncU

# Test Environment
PAYMENT_ENV=test
CREEM_TEST_API_KEY=your_test_key
CREEM_TEST_TRIAL_PRODUCT_ID=test_trial_id
CREEM_TEST_BASIC_PRODUCT_ID=test_basic_id
CREEM_TEST_PRO_PRODUCT_ID=test_pro_id
```

## Standard Operating Procedures

### 1. Order Creation Process

**Endpoint**: `POST /api/payment/create-order`

**Steps**:
1. Validate user authentication
2. Verify product existence
3. Create order record in database
4. Generate Creem.io checkout session
5. Update order with checkout_id
6. Return payment URL to client

**Key Files**:
- `src/app/api/payment/create-order/route.ts`
- `src/lib/payment/creem-client.ts:51-157`

**Error Handling**:
- Missing authentication → HTTP 401
- Invalid product_id → HTTP 404
- Database errors → HTTP 500

### 2. Payment Callback Handling

**Endpoint**: `GET /api/payment/callback`

**Process Flow**:
1. Extract callback parameters (checkout_id, status, signature)
2. Verify payment status with Creem.io API
3. Validate callback signature (if provided)
4. Process payment success/cancellation
5. Redirect user to appropriate page

**Success Flow** (`src/app/api/payment/callback/route.ts:320-586`):
1. Find order by checkout_id or order_id
2. Update order status to 'completed'
3. Add credits to user account
4. Update user plan type
5. Create subscription record (if applicable)

**Cancellation Flow** (`src/app/api/payment/callback/route.ts:588-616`):
1. Find order by checkout_id
2. Update order status to 'cancelled'

### 3. Webhook Processing

**Endpoint**: `POST /api/payment/callback` (webhook events)

**Supported Events**:
- `checkout.completed` - Payment successful
- `refund.created` - Refund processed
- `subscription.cancelled` - Subscription cancelled

**Security**: Webhook signature verification (currently disabled for testing)

### 4. Credit Management

**Credit System**:
- Each video generation costs 20 credits
- Credits are deducted immediately upon video generation
- Failed generations trigger automatic refunds

**Credit Flow**:
1. User purchases credits via payment
2. Credits added to `user_profiles.credits`
3. Video generation deducts credits
4. Transactions logged in `credit_transactions`

### 5. Subscription Management

**Subscription Types**:
- Basic Plan: Monthly subscription with 300 credits
- Pro Plan: Monthly subscription with 1500 credits

**Subscription Flow**:
1. User subscribes to plan
2. Order created with type='subscription'
3. Payment processed
4. Subscription record created
5. Credits added monthly

## Error Handling Procedures

### 1. Payment Failures

**Symptoms**:
- User reports payment not processed
- Order status remains 'pending'
- Credits not added to account

**Investigation Steps**:
1. Check order status in database
2. Verify Creem.io checkout status
3. Review callback logs
4. Check webhook delivery

**Resolution**:
```sql
-- Manually complete order
UPDATE orders SET status = 'completed', completed_at = NOW() WHERE id = 'order_id';

-- Add credits to user
UPDATE user_profiles 
SET credits = credits + [credit_amount] 
WHERE id = 'user_id';
```

### 2. Webhook Delivery Issues

**Symptoms**:
- Payments succeed but not processed in system
- Delayed credit allocation

**Resolution**:
1. Check webhook endpoint logs
2. Verify webhook URL in Creem.io dashboard
3. Manually trigger webhook processing
4. Process payment via callback endpoint

### 3. Signature Verification Failures

**Current Status**: Temporarily disabled for testing
**Location**: `src/app/api/payment/callback/route.ts:77-124`

**To Enable**:
1. Implement Creem.io signature verification
2. Remove temporary bypass flags
3. Test with valid signatures

## Security Procedures

### 1. API Key Management

**Production Keys**:
- Store in environment variables only
- Never commit to code repository
- Rotate keys quarterly
- Use different keys for test/production

**Access Control**:
- API keys should only be accessible to server-side code
- No client-side exposure of sensitive keys

### 2. Callback Security

**Signature Verification**:
- Verify all webhook signatures
- Use timing-safe comparison
- Log signature failures

**URL Security**:
- Use HTTPS for all callback URLs
- Validate callback parameters
- Implement rate limiting

### 3. Database Security

**Sensitive Data**:
- Never log full API keys
- Sanitize error messages
- Use parameterized queries

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Payment Success Rate**
   - Target: >95% success rate
   - Alert: <90% success rate

2. **Webhook Delivery**
   - Target: <5 second processing time
   - Alert: Failed webhook delivery

3. **Credit Balance Accuracy**
   - Daily reconciliation
   - Alert on discrepancies >1%

### Log Analysis

**Important Log Patterns**:
- `=== Payment Callback (GET) Started ===`
- `=== Payment Webhook (POST) Started ===`
- `=== CRITICAL ERROR in payment callback ===`

**Log Locations**:
- Vercel Function Logs (Production)
- Console logs (Development)

## Troubleshooting Guide

### Common Issues

1. **"Order not found" Error**
   - Check if order exists in database
   - Verify checkout_id mapping
   - Check for race conditions

2. **Credits Not Added**
   - Verify order completion status
   - Check user_profiles update
   - Review callback processing logs

3. **Duplicate Payments**
   - Check for duplicate webhook delivery
   - Implement idempotency keys
   - Add duplicate payment detection

### Testing Procedures

**Development Testing**:
1. Use mock payment client
2. Test all callback scenarios
3. Verify database updates
4. Test error conditions

**Production Testing**:
1. Use Creem.io test environment
2. Monitor webhook delivery
3. Verify signature validation
4. Test refund scenarios

## Maintenance Procedures

### Weekly Tasks
- Review payment failure logs
- Check webhook delivery status
- Verify credit reconciliation
- Monitor subscription renewals

### Monthly Tasks
- Rotate API keys (if required)
- Review security logs
- Update product pricing
- Database maintenance

### Quarterly Tasks
- Security audit
- Performance optimization
- Backup verification
- Documentation updates

## Emergency Procedures

### Payment System Outage
1. Enable maintenance mode
2. Queue pending payments
3. Notify users of service disruption
4. Investigate root cause
5. Process queued payments after recovery

### Data Loss Recovery
1. Stop payment processing
2. Restore from latest backup
3. Reconcile payment data with Creem.io
4. Verify user credit balances
5. Resume normal operations

## Authentication Best Practices

### Overview

This section documents the authentication patterns used in the subscription payment system, which can be reused across other projects requiring secure API authentication.

### Architecture Pattern: JWT Token Authentication

#### 1. Frontend Authentication Flow

**Location**: `src/app/pricing/page.tsx:79-88`

**Pattern**: Extract JWT token from Supabase session and pass via Authorization header

```typescript
// Get access token from Supabase session
const { supabase } = await import('@/lib/supabase');
const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);

if (!token) {
  toast.error('Authentication failed. Please sign in again.');
  await signInWithGoogle();
  return;
}

const response = await fetch('/api/subscription/create-checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // JWT token in Authorization header
  },
  body: JSON.stringify({ plan_id: planId })
});
```

**Key Benefits**:
- Secure token extraction from Supabase session
- Standard Bearer token format
- Graceful fallback to re-authentication on token missing

#### 2. Backend Authentication Verification

**Location**: `src/app/api/subscription/create-checkout/route.ts:27-47`

**Pattern**: Extract and verify JWT token using Supabase client

```typescript
// Step 1: Extract Authorization header
const authHeader = request.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');

if (!token) {
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  );
}

// Step 2: Initialize Supabase client with public keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Step 3: Verify token and get user
const { data: { user }, error: authError } = await supabase.auth.getUser(token);

if (authError || !user) {
  console.error('Authentication failed:', authError);
  return NextResponse.json(
    { error: 'Authentication required. Please sign in.' },
    { status: 401 }
  );
}

console.log('Creating checkout for user:', {
  userId: user.id,
  email: user.email,
  planId: plan_id
});
```

**Security Features**:
1. **Token Extraction**: Safely parse Authorization header
2. **Token Validation**: Verify JWT signature and expiry via Supabase
3. **User Context**: Extract authenticated user identity
4. **Error Handling**: Clear 401 responses for auth failures
5. **Audit Logging**: Log user actions for security monitoring

#### 3. Dual-Client Pattern for Database Operations

**Location**: `src/app/api/subscription/create-checkout/route.ts:38-52`

**Pattern**: Use different Supabase clients for authentication vs. data operations

```typescript
// Client 1: Public client for JWT verification
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const { data: { user }, error: authError } = await supabase.auth.getUser(token);

// Client 2: Service client for privileged database operations
const serviceSupabase = createServiceClient();

// Use service client to bypass RLS (Row Level Security)
const { data: existingSubscription } = await serviceSupabase
  .from('subscriptions')
  .select('id, status, payment_plans(name)')
  .eq('user_id', user.id)  // Still filter by authenticated user
  .eq('status', 'active')
  .single();
```

**Why This Pattern?**
- **Public Client**: Used only for JWT verification (limited permissions)
- **Service Client**: Used for database operations requiring admin access
- **Security**: Still filters by authenticated user despite elevated permissions
- **RLS Bypass**: Service client can read all data but application logic enforces user isolation

**Service Client Setup**: `src/lib/supabase-server.ts`
```typescript
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Admin key
    { auth: { persistSession: false } }
  );
}
```

#### 4. Environment Configuration Best Practices

**Authentication Environment Variables**:

```bash
# Public keys (safe to expose to client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Private keys (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Security Rules**:
1. **Never expose service role key** to client-side code
2. **Use anon key** for JWT verification only
3. **Rotate keys** quarterly or on suspected compromise
4. **Separate keys** for test/staging/production environments

#### 5. User Context Validation Pattern

**Location**: `src/app/api/subscription/create-checkout/route.ts:54-68`

**Pattern**: Validate business logic after authentication

```typescript
// After successful authentication, check business rules
const { data: existingSubscription } = await serviceSupabase
  .from('subscriptions')
  .select('id, status, payment_plans(name)')
  .eq('user_id', user.id)  // Use authenticated user.id
  .eq('status', 'active')
  .single();

if (existingSubscription) {
  const planData = existingSubscription.payment_plans as any;
  const planName = Array.isArray(planData) ? planData[0]?.name : planData?.name;
  return NextResponse.json({
    error: `You already have an active ${planName || 'subscription'}. Please cancel it first to switch plans.`
  }, { status: 400 });
}
```

**Best Practices**:
- Always use `user.id` from verified token for database queries
- Check business logic constraints after authentication
- Return user-friendly error messages
- Use HTTP 400 for business rule violations (not 401/403)

#### 6. Complete Authentication Flow Diagram

```
┌─────────────┐
│   Frontend  │
│   (Client)  │
└──────┬──────┘
       │ 1. User clicks "Subscribe"
       ├─────────────────────────────────────────┐
       │ 2. Extract JWT from Supabase session   │
       │    - supabase.auth.getSession()        │
       │    - Get access_token                  │
       └─────────────────────────────────────────┘
       │
       │ 3. API Request
       ├─────────────────────────────────────────┐
       │ POST /api/subscription/create-checkout │
       │ Headers:                               │
       │   Authorization: Bearer <jwt_token>    │
       │ Body: { plan_id }                      │
       └─────────────────────────────────────────┘
       │
       ▼
┌──────────────────┐
│   Backend API    │
│   (Server)       │
└──────┬───────────┘
       │ 4. Extract & Verify Token
       ├─────────────────────────────────────────┐
       │ a. Parse Authorization header          │
       │ b. Create Supabase client (anon key)   │
       │ c. Verify JWT: supabase.auth.getUser() │
       │ d. Check signature, expiry, claims     │
       └─────────────────────────────────────────┘
       │
       │ 5. Token Valid?
       ├───NO──► Return 401 Unauthorized
       │
       ├───YES──┐
       │        │ 6. Business Logic Validation
       │        ├─────────────────────────────────────┐
       │        │ a. Create service client            │
       │        │ b. Check existing subscriptions     │
       │        │ c. Validate plan exists/active      │
       │        │ d. Check user eligibility           │
       │        └─────────────────────────────────────┘
       │        │
       │        │ 7. Create Resources
       │        ├─────────────────────────────────────┐
       │        │ a. Create pending order             │
       │        │ b. Generate payment checkout        │
       │        │ c. Store external_order_id          │
       │        └─────────────────────────────────────┘
       │        │
       │        ▼
       │   ┌────────────┐
       └───│  Response  │
           │ payment_url│
           └────────────┘
```

#### 7. Error Handling Standards

**Authentication Errors**:

| Error Type | HTTP Status | Response Example | Frontend Action |
|------------|-------------|------------------|-----------------|
| Missing token | 401 | `{"error": "Authentication required"}` | Redirect to login |
| Invalid token | 401 | `{"error": "Authentication required. Please sign in."}` | Re-authenticate |
| Expired token | 401 | `{"error": "Session expired"}` | Refresh token / re-login |
| Business rule violation | 400 | `{"error": "You already have an active subscription"}` | Show error message |
| Server error | 500 | `{"error": "Checkout failed: ..."}` | Retry / contact support |

**Frontend Error Handling Example**:

```typescript
try {
  const response = await fetch('/api/subscription/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ plan_id: planId })
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      // Authentication failed - redirect to login
      toast.error('Please sign in to continue');
      await signInWithGoogle();
      return;
    }
    throw new Error(data.error || 'Failed to create checkout');
  }

  // Success - redirect to payment
  window.location.href = data.payment_url;

} catch (error) {
  console.error('Subscription error:', error);
  toast.error(error instanceof Error ? error.message : 'Failed to start subscription');
}
```

#### 8. Testing Authentication

**Manual Testing Checklist**:

1. ✅ **Valid Token**: Normal subscription flow works
2. ✅ **Missing Token**: Returns 401, frontend redirects to login
3. ✅ **Expired Token**: Returns 401, triggers re-authentication
4. ✅ **Invalid Token**: Returns 401, rejects request
5. ✅ **Tampered Token**: Returns 401, signature validation fails
6. ✅ **Business Rules**: Prevents duplicate subscriptions

**Testing Script**:

```bash
# 1. Get valid token (after login)
TOKEN="your_jwt_token_here"

# 2. Test valid authentication
curl -X POST http://localhost:3000/api/subscription/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plan_id": "plan_uuid_here"}'

# 3. Test missing token
curl -X POST http://localhost:3000/api/subscription/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"plan_id": "plan_uuid_here"}'
# Expected: 401 Unauthorized

# 4. Test invalid token
curl -X POST http://localhost:3000/api/subscription/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token_xyz" \
  -d '{"plan_id": "plan_uuid_here"}'
# Expected: 401 Unauthorized
```

#### 9. Security Audit Checklist

**Before Deploying to Production**:

- [ ] Service role key never exposed to client
- [ ] JWT tokens transmitted over HTTPS only
- [ ] Token expiry properly configured (recommended: 1 hour)
- [ ] All API endpoints verify authentication
- [ ] User IDs from tokens used for database queries (not from request body)
- [ ] Audit logging enabled for sensitive operations
- [ ] Rate limiting implemented on auth endpoints
- [ ] CORS properly configured for production domain
- [ ] Environment variables secured in production
- [ ] Error messages don't leak sensitive information

#### 10. Reusable Code Template

**Generic Authenticated API Route**:

```typescript
// src/app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Extract and verify authentication token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 3. Verify JWT token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    // 4. Use service client for database operations
    const serviceSupabase = createServiceClient();

    // 5. Implement your business logic here
    // Always use user.id for user-specific queries

    console.log('Processing request for user:', {
      userId: user.id,
      email: user.email
    });

    // Example: Query user-specific data
    const { data, error } = await serviceSupabase
      .from('your_table')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    // 6. Return success response
    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Summary

This authentication pattern provides:
- ✅ **Security**: JWT verification, secure token handling
- ✅ **Scalability**: Reusable across multiple API routes
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **User Experience**: Graceful error handling and re-authentication
- ✅ **Auditability**: Comprehensive logging for security monitoring

## Contact Information

- **Creem.io Support**: support@creem.io

---

**Document Version**: 2.0
**Last Updated**: 2025-11-14
**Next Review**: 2026-02-14
**Owner**: KIWIAI DEV Development Team