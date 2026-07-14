import { createHash, randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase-server';

const KEY_PREFIX = 'enb_live_';

export interface GeneratedKey {
  plaintext: string; // shown to the user exactly once
  hash: string;
  prefix: string; // stored for display, e.g. "enb_live_ab12cd"
}

/** Create a new random API key + its sha256 hash. Plaintext is never stored. */
export function generateApiKey(): GeneratedKey {
  const secret = randomBytes(24).toString('hex'); // 48 hex chars
  const plaintext = `${KEY_PREFIX}${secret}`;
  const hash = hashApiKey(plaintext);
  const prefix = plaintext.slice(0, KEY_PREFIX.length + 6);
  return { plaintext, hash, prefix };
}

export function hashApiKey(plaintext: string): string {
  return createHash('sha256').update(plaintext.trim()).digest('hex');
}

export interface VerifiedKey {
  userId: string;
  keyId: string;
}

/**
 * Verify an incoming X-API-Key. Returns the owning user, or null if the key is
 * missing, unknown, or revoked. Updates last_used_at (best effort).
 */
export async function verifyApiKey(rawKey: string | null): Promise<VerifiedKey | null> {
  if (!rawKey || !rawKey.startsWith(KEY_PREFIX)) return null;

  const hash = hashApiKey(rawKey);
  const service = createServiceClient();

  const { data, error } = await service
    .from('api_keys')
    .select('id, user_id, revoked_at')
    .eq('key_hash', hash)
    .maybeSingle();

  if (error || !data || data.revoked_at) return null;

  // Best-effort usage timestamp; don't block the request on it.
  void service.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);

  return { userId: data.user_id, keyId: data.id };
}
