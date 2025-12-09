-- ============================================================================
-- Performance Indexes for Nano Banana Database
-- ============================================================================
-- This file contains database indexes to improve query performance
-- Run these queries in your Supabase SQL editor
-- Created: 2025-12-09
-- ============================================================================

-- ============================================================================
-- USER_PROFILES TABLE INDEXES
-- ============================================================================

-- Index for email lookups (used during authentication)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email
ON user_profiles(email);

-- Index for referral code lookups (used when users visit referral links)
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code
ON user_profiles(referral_code);

-- Index for referred_by lookups (used to find who referred a user)
CREATE INDEX IF NOT EXISTS idx_user_profiles_referred_by
ON user_profiles(referred_by);

-- Composite index for active subscription queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_plan
ON user_profiles(active_plan_id, subscription_expires_at)
WHERE active_plan_id IS NOT NULL;


-- ============================================================================
-- CREDIT_TRANSACTIONS TABLE INDEXES
-- ============================================================================

-- Composite index for user transaction history (most common query)
-- Used in: /api/credits/balance, transaction history queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
ON credit_transactions(user_id, created_at DESC);

-- Index for transaction type filtering
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_type
ON credit_transactions(user_id, transaction_type);

-- Index for referral transaction lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_referral
ON credit_transactions(user_id, transaction_type)
WHERE transaction_type = 'referral';

-- Index for image-related transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_image_id
ON credit_transactions(image_id)
WHERE image_id IS NOT NULL;

-- Index for order-related transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_order_id
ON credit_transactions(order_id)
WHERE order_id IS NOT NULL;


-- ============================================================================
-- IMAGES TABLE INDEXES
-- ============================================================================

-- Composite index for user image history (most common query)
-- Used in: /api/history, image gallery queries
CREATE INDEX IF NOT EXISTS idx_images_user_status_created
ON images(user_id, status, created_at DESC);

-- Composite index for filtering by image type
CREATE INDEX IF NOT EXISTS idx_images_user_type_created
ON images(user_id, image_type, created_at DESC);

-- Index for completed images statistics
CREATE INDEX IF NOT EXISTS idx_images_user_completed
ON images(user_id, status, cost)
WHERE status = 'completed';

-- Index for external task ID lookups (webhook callbacks)
CREATE INDEX IF NOT EXISTS idx_images_external_task_id
ON images(external_task_id)
WHERE external_task_id IS NOT NULL;


-- ============================================================================
-- ORDERS TABLE INDEXES
-- ============================================================================

-- Composite index for user order history
CREATE INDEX IF NOT EXISTS idx_orders_user_created
ON orders(user_id, created_at DESC);

-- Index for external order ID lookups (payment callbacks)
CREATE INDEX IF NOT EXISTS idx_orders_external_order_id
ON orders(external_order_id)
WHERE external_order_id IS NOT NULL;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_orders_user_status
ON orders(user_id, status);

-- Index for subscription-related orders
CREATE INDEX IF NOT EXISTS idx_orders_subscription_id
ON orders(subscription_id)
WHERE subscription_id IS NOT NULL;


-- ============================================================================
-- SUBSCRIPTIONS TABLE INDEXES
-- ============================================================================

-- Composite index for active user subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
ON subscriptions(user_id, status);

-- Index for subscription expiration checks (cron jobs)
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end
ON subscriptions(current_period_end, status)
WHERE status = 'active';

-- Index for external subscription ID lookups (webhook callbacks)
CREATE INDEX IF NOT EXISTS idx_subscriptions_external_id
ON subscriptions(external_subscription_id)
WHERE external_subscription_id IS NOT NULL;

-- Index for renewal reminder jobs
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_reminder
ON subscriptions(current_period_end, renewal_reminder_sent, status)
WHERE status = 'active' AND renewal_reminder_sent = false;


-- ============================================================================
-- REFERRALS TABLE INDEXES
-- ============================================================================

-- Index for referrer's referral list
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_created
ON referrals(referrer_id, created_at DESC);

-- Index for referee lookups (unique constraint already exists, this improves performance)
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id
ON referrals(referee_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status
ON referrals(referrer_id, status);


-- ============================================================================
-- USER_ACTIVITY TABLE INDEXES
-- ============================================================================

-- Composite index for user activity logs
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created
ON user_activity(user_id, created_at DESC);

-- Index for action filtering
CREATE INDEX IF NOT EXISTS idx_user_activity_action
ON user_activity(action, created_at DESC);

-- Index for resource lookups
CREATE INDEX IF NOT EXISTS idx_user_activity_resource
ON user_activity(resource_type, resource_id)
WHERE resource_type IS NOT NULL AND resource_id IS NOT NULL;


-- ============================================================================
-- SAVED_PROMPTS TABLE INDEXES
-- ============================================================================

-- Composite index for user's saved prompts
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_created
ON saved_prompts(user_id, created_at DESC);

-- Index for folder organization
CREATE INDEX IF NOT EXISTS idx_saved_prompts_folder
ON saved_prompts(folder_id, created_at DESC)
WHERE folder_id IS NOT NULL;


-- ============================================================================
-- PROMPT_FOLDERS TABLE INDEXES
-- ============================================================================

-- Composite index for user's folders with sort order
CREATE INDEX IF NOT EXISTS idx_prompt_folders_user_sort
ON prompt_folders(user_id, sort_order);


-- ============================================================================
-- PROMPTS TABLE INDEXES (Public Prompt Gallery)
-- ============================================================================

-- Composite index for published prompts by locale
CREATE INDEX IF NOT EXISTS idx_prompts_locale_published_created
ON prompts(locale, is_published, created_at DESC)
WHERE is_published = true;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_prompts_category_locale
ON prompts(category, locale, created_at DESC)
WHERE is_published = true;

-- GIN index for tag searches (array contains)
CREATE INDEX IF NOT EXISTS idx_prompts_tags
ON prompts USING GIN(tags);

-- Full-text search index for title and prompt
CREATE INDEX IF NOT EXISTS idx_prompts_title_search
ON prompts USING GIN(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_prompts_prompt_search
ON prompts USING GIN(to_tsvector('english', prompt));


-- ============================================================================
-- IMAGE_TEMPLATES TABLE INDEXES
-- ============================================================================

-- Composite index for active templates by category
CREATE INDEX IF NOT EXISTS idx_image_templates_category_active
ON image_templates(category_id, is_active, sort_order)
WHERE is_active = true;

-- Index for premium template filtering
CREATE INDEX IF NOT EXISTS idx_image_templates_premium
ON image_templates(is_premium, is_active)
WHERE is_active = true;

-- GIN index for tag searches
CREATE INDEX IF NOT EXISTS idx_image_templates_tags
ON image_templates USING GIN(tags);


-- ============================================================================
-- CATEGORIES TABLE INDEXES
-- ============================================================================

-- Index for active categories sorted
CREATE INDEX IF NOT EXISTS idx_categories_active_sort
ON categories(is_active, sort_order)
WHERE is_active = true;

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug
ON categories(slug);


-- ============================================================================
-- PAYMENT_PLANS TABLE INDEXES
-- ============================================================================

-- Index for active plans
CREATE INDEX IF NOT EXISTS idx_payment_plans_active
ON payment_plans(is_active, plan_type)
WHERE is_active = true;


-- ============================================================================
-- INDEX VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify indexes were created successfully:
--
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
--
-- ============================================================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================================================
-- To check if indexes are being used:
--
-- EXPLAIN ANALYZE
-- SELECT * FROM credit_transactions
-- WHERE user_id = 'YOUR_USER_ID'
-- ORDER BY created_at DESC
-- LIMIT 10;
--
-- ============================================================================
