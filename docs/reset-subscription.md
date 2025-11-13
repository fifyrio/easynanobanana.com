# Resetting a User’s Subscription State

This playbook explains how to fully clear subscription data for a specific user in the Supabase database. Use it when a subscription needs to be removed manually (for example, incorrect credit allocation or test data cleanup).

## Tables Involved

- `public.subscriptions`: stores each active/canceled subscription row.
- `public.orders`: references subscriptions via `subscription_id`.
- `public.user_profiles`: caches the active plan (`active_plan_id`) and expiration (`subscription_expires_at`).
- (Optional) `public.credit_transactions`: contains the purchase ledger; usually keep for audit.

## SQL Script

Replace `{{USER_ID}}` with the target `uuid`. Run inside a transaction to avoid partial updates.

```sql
BEGIN;

WITH target AS (
  SELECT '{{USER_ID}}'::uuid AS user_id
),
subs AS (
  SELECT id FROM public.subscriptions
  WHERE user_id = (SELECT user_id FROM target)
)
UPDATE public.orders
SET subscription_id = NULL,
    updated_at = timezone('utc', now()),
    status = CASE
      WHEN status IN ('active', 'processing') THEN 'failed'
      ELSE status
    END
WHERE subscription_id IN (SELECT id FROM subs);

DELETE FROM public.subscriptions
WHERE id IN (SELECT id FROM subs);

UPDATE public.user_profiles
SET active_plan_id = NULL,
    subscription_expires_at = NULL,
    updated_at = timezone('utc', now())
WHERE id = (SELECT user_id FROM target);

COMMIT;
```

## Optional Cleanup

- Remove related orders (if they were just test data):
  ```sql
  DELETE FROM public.orders
  WHERE user_id = '{{USER_ID}}';
  ```
- Remove purchase credit transactions if you do not need the audit trail:
  ```sql
  DELETE FROM public.credit_transactions
  WHERE user_id = '{{USER_ID}}'
    AND transaction_type = 'purchase';
  ```

Only run the optional deletions when you are sure historical records can be discarded.
