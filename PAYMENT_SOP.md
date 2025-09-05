# AIASMR Payment System - Standard Operating Procedures (SOP)

## Overview

This document outlines the Standard Operating Procedures for the AIASMR payment system, which integrates with Creem.io payment platform to handle subscriptions, one-time payments, and credit management.

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
| AI ASMR Trial | `prod_4oJ0n9ZOU0x2Tn9rQ1oDJ5` | $7.90 | 100 | once | - |
| AI ASMR Basic | `prod_6JrHGnC707qbtiMBiLGlkX` | $19.90 | 300 | subscription | monthly |
| AI ASMR Pro | `prod_5H9ctZ7GUs425KayUilncU` | $49.90 | 1500 | subscription | monthly |

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

## Contact Information

- **Development Team**: payment-dev@aiasmr.so
- **Operations Team**: ops@aiasmr.so
- **Creem.io Support**: support@creem.io
- **Emergency Escalation**: emergency@aiasmr.so

---

**Document Version**: 1.0  
**Last Updated**: 2025-09-05  
**Next Review**: 2025-12-05  
**Owner**: AIASMR Development Team