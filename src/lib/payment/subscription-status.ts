import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch a user's currently-valid active subscription, lazily expiring any whose
 * billing period has already ended.
 *
 * The system has no cron/webhook that transitions subscriptions to 'expired',
 * so a lapsed subscription would otherwise stay 'active' forever — blocking
 * plan switches and rendering negative "days remaining". This helper flips any
 * expired-but-active rows to 'expired' on read and returns only a subscription
 * that is still within its period (or null).
 *
 * @param select Columns to select. MUST include `id` and `current_period_end`.
 */
export async function getActiveSubscription(
  serviceSupabase: SupabaseClient,
  userId: string,
  select: string = '*'
): Promise<any | null> {
  const { data: subs, error } = await serviceSupabase
    .from('subscriptions')
    .select(select)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!subs || subs.length === 0) return null;

  const now = Date.now();
  const expiredIds: string[] = [];
  let active: any = null;

  for (const sub of subs as any[]) {
    const end = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
    // A null period end cannot be evaluated — treat as still active.
    if (end !== null && end <= now) {
      expiredIds.push(sub.id);
    } else if (!active) {
      active = sub;
    }
  }

  if (expiredIds.length > 0) {
    await serviceSupabase
      .from('subscriptions')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .in('id', expiredIds);
  }

  return active;
}
