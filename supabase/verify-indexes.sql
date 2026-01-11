-- ============================================================================
-- Index Verification Queries
-- ============================================================================
-- Use these queries to verify that indexes are created and being used
-- Run these in your Supabase SQL Editor after applying performance-indexes.sql
-- ============================================================================

-- ============================================================================
-- 1. LIST ALL INDEXES
-- ============================================================================
-- This shows all indexes in the public schema

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 2. COUNT INDEXES PER TABLE
-- ============================================================================
-- Verify each table has the expected number of indexes

SELECT
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Expected counts:
-- categories: 3 indexes
-- credit_transactions: 6 indexes
-- images: 5 indexes
-- image_templates: 4 indexes
-- orders: 5 indexes
-- payment_plans: 2 indexes
-- prompt_folders: 2 indexes
-- prompts: 7 indexes
-- referrals: 4 indexes
-- saved_prompts: 3 indexes
-- subscriptions: 5 indexes
-- user_activity: 4 indexes
-- user_profiles: 5 indexes

-- ============================================================================
-- 3. CHECK INDEX SIZES
-- ============================================================================
-- Monitor index storage usage

SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 4. VERIFY SPECIFIC INDEXES EXIST
-- ============================================================================
-- Check that critical indexes are present

SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
    'idx_credit_transactions_user_created',
    'idx_images_user_status_created',
    'idx_prompts_locale_published_created',
    'idx_user_profiles_email',
    'idx_subscriptions_user_status',
    'idx_orders_user_created'
)
ORDER BY indexname;

-- ============================================================================
-- 5. CHECK IF INDEXES ARE BEING USED
-- ============================================================================
-- Test query plans for common queries

-- Test 1: User credit transactions (should use idx_credit_transactions_user_created)
EXPLAIN ANALYZE
SELECT *
FROM credit_transactions
WHERE user_id = '00000000-0000-0000-0000-000000000000'  -- Replace with real user_id
ORDER BY created_at DESC
LIMIT 10;

-- Test 2: User images history (should use idx_images_user_status_created)
EXPLAIN ANALYZE
SELECT *
FROM images
WHERE user_id = '00000000-0000-0000-0000-000000000000'  -- Replace with real user_id
AND status = 'completed'
ORDER BY created_at DESC
LIMIT 20;

-- Test 3: Published prompts by locale (should use idx_prompts_locale_published_created)
EXPLAIN ANALYZE
SELECT *
FROM prompts
WHERE locale = 'en'
AND is_published = true
ORDER BY created_at DESC
LIMIT 20;

-- Test 4: Email lookup (should use idx_user_profiles_email)
EXPLAIN ANALYZE
SELECT *
FROM user_profiles
WHERE email = 'user@example.com';  -- Replace with real email

-- Test 5: Referral code lookup (should use idx_user_profiles_referral_code)
EXPLAIN ANALYZE
SELECT *
FROM user_profiles
WHERE referral_code = 'ABC123';  -- Replace with real referral code

-- ============================================================================
-- 6. INDEX USAGE STATISTICS
-- ============================================================================
-- See how often each index is being used

SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Note: Low idx_scan values might indicate unused indexes
-- High values indicate frequently used indexes

-- ============================================================================
-- 7. CHECK FOR MISSING INDEXES (SEQUENTIAL SCANS)
-- ============================================================================
-- Tables with high sequential scans might need additional indexes

SELECT
    schemaname,
    tablename,
    seq_scan as sequential_scans,
    seq_tup_read as rows_read_sequentially,
    idx_scan as index_scans,
    n_live_tup as estimated_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- High seq_scan with many rows might indicate missing indexes

-- ============================================================================
-- 8. INDEX HEALTH CHECK
-- ============================================================================
-- Check for bloated or invalid indexes

SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0  -- Never used indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 9. CACHE HIT RATIO
-- ============================================================================
-- Overall database cache performance (should be > 0.99 or 99%)

SELECT
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    CASE
        WHEN sum(heap_blks_hit) + sum(heap_blks_read) = 0 THEN 0
        ELSE ROUND(
            sum(heap_blks_hit)::numeric / (sum(heap_blks_hit) + sum(heap_blks_read))::numeric,
            4
        )
    END as cache_hit_ratio
FROM pg_statio_user_tables;

-- Target: > 0.99 (99% cache hit ratio)

-- ============================================================================
-- 10. TABLE STATISTICS
-- ============================================================================
-- Verify statistics are up to date for query planner

SELECT
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- If last_analyze is NULL or very old, run:
-- ANALYZE table_name;

-- ============================================================================
-- 11. DUPLICATE OR REDUNDANT INDEXES
-- ============================================================================
-- Check for indexes that might be redundant

SELECT
    i1.indexname as index1,
    i2.indexname as index2,
    i1.tablename
FROM pg_indexes i1
JOIN pg_indexes i2
    ON i1.tablename = i2.tablename
    AND i1.indexname < i2.indexname
WHERE i1.schemaname = 'public'
AND i2.schemaname = 'public'
AND i1.indexdef = i2.indexdef;

-- Should return no results (no exact duplicates)

-- ============================================================================
-- 12. GIN INDEX VERIFICATION
-- ============================================================================
-- Verify GIN indexes for array and full-text search

SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexdef LIKE '%USING gin%'
ORDER BY tablename, indexname;

-- Expected GIN indexes:
-- - idx_prompts_tags (tags array)
-- - idx_prompts_title_search (full-text)
-- - idx_prompts_prompt_search (full-text)
-- - idx_image_templates_tags (tags array)

-- ============================================================================
-- 13. PARTIAL INDEX VERIFICATION
-- ============================================================================
-- Verify partial indexes (indexes with WHERE clause)

SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexdef LIKE '%WHERE%'
ORDER BY tablename, indexname;

-- Partial indexes save space by only indexing relevant rows

-- ============================================================================
-- 14. PERFORMANCE BASELINE
-- ============================================================================
-- Capture current performance metrics for comparison

SELECT
    NOW() as measured_at,
    schemaname,
    tablename,
    n_live_tup as row_count,
    idx_scan as total_index_scans,
    seq_scan as total_sequential_scans,
    CASE
        WHEN seq_scan + idx_scan = 0 THEN 0
        ELSE ROUND(idx_scan::numeric / (seq_scan + idx_scan)::numeric, 4)
    END as index_usage_ratio
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Save this output to compare after application deployment
-- Target: index_usage_ratio > 0.95 (95% queries use indexes)

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Replace placeholder values (user_id, email, etc.) with real data from your database
-- 2. Run these queries periodically to monitor index health
-- 3. If EXPLAIN ANALYZE doesn't show index usage, verify:
--    - Statistics are current (run ANALYZE table_name)
--    - Query matches index columns
--    - Table has enough rows to justify index use
-- 4. Monitor idx_scan in pg_stat_user_indexes to identify unused indexes
-- ============================================================================
