import type { SupabaseClient } from '@supabase/supabase-js';

export class InsufficientCreditsError extends Error {
  constructor(public available: number, public required: number) {
    super('insufficient_credits');
    this.name = 'InsufficientCreditsError';
  }
}

/**
 * Deduct credits atomically. Prefers the deduct_credits_atomic RPC (row lock,
 * race-free). If the RPC is not deployed yet, falls back to a read-then-insert
 * so the feature still works, then callers should run the migration.
 */
export async function deductCredits(
  service: SupabaseClient,
  userId: string,
  amount: number,
  type: string,
  description: string
): Promise<number> {
  const { data, error } = await service.rpc('deduct_credits_atomic', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
  });

  if (!error) return data as number;

  if (error.message?.includes('insufficient_credits')) {
    const available = await getBalance(service, userId);
    throw new InsufficientCreditsError(available, amount);
  }

  // RPC missing (not migrated yet) → fallback path.
  const isMissingFn =
    error.code === '42883' || error.message?.toLowerCase().includes('function');
  if (!isMissingFn) throw new Error(error.message);

  const balance = await getBalance(service, userId);
  if (balance < amount) throw new InsufficientCreditsError(balance, amount);

  const { error: txErr } = await service.from('credit_transactions').insert([
    { user_id: userId, amount: -amount, transaction_type: type, description },
  ]);
  if (txErr) throw new Error(txErr.message);

  return balance - amount;
}

/** Refund credits (positive transaction). Used when generation fails after charge. */
export async function refundCredits(
  service: SupabaseClient,
  userId: string,
  amount: number,
  description: string
): Promise<void> {
  if (amount <= 0) return;
  await service.from('credit_transactions').insert([
    { user_id: userId, amount, transaction_type: 'refund', description },
  ]);
}

export async function getBalance(service: SupabaseClient, userId: string): Promise<number> {
  const { data } = await service
    .from('user_profiles')
    .select('credits')
    .eq('id', userId)
    .single();
  return data?.credits ?? 0;
}
