# Paid Video Trial Implementation Plan

**Goal:** Basic $0.99 / 1 day / 100 video credits; Max $1.99 / 3 days / 200 video credits. Pro has no trial.

**Architecture:** Use Waffo's native `trialAmount` and `metadata.trialDays`, preserving regular monthly prices and renewal. A separate video-only trial balance expires with the provider's trial period. Only verified successful charges grant credits; payment IDs and profile row locks prevent duplicate fulfillment and concurrent overspending.

**Tech Stack:** Next.js, next-intl, Waffo SDK 0.25, Supabase PostgreSQL.

1. Configure paid trials and checkout eligibility. Verify remote product snapshots contain the expected amounts; regular checkout explicitly skips trials.
2. Add transactional payment fulfillment and video trial reservation/refund migration. Test payment retries, underpayment, trial expiration, monthly conversion, and spending limits in PostgreSQL.
3. Update pricing cards and all locale messages; show trial price, total video credits, resolution/duration, and automatic monthly renewal. Verify translations and rendering.
4. Run focused payment tests, type-check and build. Apply migration and provider configuration where credentials permit; report any unapplied deployment steps explicitly.

## Validation and rollout

- Passed: `tsx tests/paid-subscription-webhook.test.ts`, `tsx tests/subscription-cancel.test.ts`, `tsx tests/video-task-status.test.ts`, `tsc --noEmit`, and production build.
- Passed: migration tests using PGlite covering payment retries, trial limits, expiry, refunds, conversion and RPC permissions. Install `@electric-sql/pglite` in an isolated temporary directory, then run `PGLITE_MODULE=<temporary-directory>/node_modules/@electric-sql/pglite/dist/index.js node tests/paid-video-trials.test.mjs`.
- Passed: 7 new message keys in all 14 locales; Chinese pricing page and switching between paid trial and regular subscription verified in the browser.
- Supabase migration applied by the user and verified through the live Data API: both tables and all three RPCs exist; anonymous video reservation is denied. No existing customer data was changed by these checks.
- Waffo production versions verified through the API: Basic $0.99/1 day then $7.99/month; Max $1.99/3 days then $78.99/month; Pro $27.99/month without a trial.
- Production HTTP webhook verified at `https://www.easynanobanana.com/api/subscription/webhook`, including payment success and cancellation events. The test webhook uses a separate ngrok endpoint.
- Production store verified as `STO_7HYIRdODpgprCzbv7sOdsQ`, containing all three configured product IDs. Local `.env` corrected; hosting environment must use the same value. Environment files are not committed.
- Cancellation now calls Waffo before reporting success, including legacy subscriptions marked canceled only locally. No real subscription was canceled during testing.
- Remaining: deploy this code, verify hosting environment variables, and complete an actual paid trial, credit allocation, renewal and cancellation test. No real payment was made during this change.

For future product configuration changes, inspect with `PAYMENT_ENV=production tsx scripts/sync-paid-video-trials.ts`. Only add `--apply --publish` when intentionally publishing the verified test configuration.
