import { config } from '@/lib/config';

/**
 * Creem Moderation API — pre-generation prompt screening.
 *
 * Every user-supplied prompt routed to an image or video model MUST be screened
 * through this before generation happens. See https://docs.creem.io moderation.
 *
 * Fail closed: any error (network, timeout, unexpected status) is treated as a
 * block, never as an allow.
 */

const MODERATION_TIMEOUT_MS = 5000;

type ModerationDecision = 'allow' | 'flag' | 'deny';

interface ModerationResult {
  id: string;
  object: 'moderation_result';
  prompt: string;
  external_id?: string;
  decision: ModerationDecision;
  usage?: { units: number };
}

export type ModerationOutcome =
  | { allowed: true; decision: 'allow'; result: ModerationResult }
  | { allowed: false; decision: 'deny' | 'flag'; result: ModerationResult }
  | { allowed: false; decision: 'error'; error: string };

function moderationBaseUrl(): string {
  // Sandbox uses test-api; production uses api.
  return config.creem.environment === 'production'
    ? 'https://api.creem.io'
    : 'https://test-api.creem.io';
}

/**
 * Screen a user prompt against Creem's content policies.
 *
 * Returns an outcome that is `allowed` only on an explicit `allow` decision.
 * `deny`, `flag`, and any failure all resolve to `allowed: false` (fail closed).
 */
export async function screenPrompt(
  prompt: string,
  externalId?: string
): Promise<ModerationOutcome> {
  const apiKey = config.creem.apiKey;
  if (!apiKey) {
    return { allowed: false, decision: 'error', error: 'moderation_not_configured' };
  }

  try {
    const res = await fetch(`${moderationBaseUrl()}/v1/moderation/prompt`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        ...(externalId ? { external_id: externalId } : {}),
      }),
      signal: AbortSignal.timeout(MODERATION_TIMEOUT_MS),
    });

    if (!res.ok) {
      return {
        allowed: false,
        decision: 'error',
        error: `moderation_http_${res.status}`,
      };
    }

    const result = (await res.json()) as ModerationResult;

    // Only an explicit `allow` passes. `flag` is treated as a block per Creem
    // guidance; unknown decisions also block.
    if (result.decision === 'allow') {
      return { allowed: true, decision: 'allow', result };
    }

    return {
      allowed: false,
      decision: result.decision === 'flag' ? 'flag' : 'deny',
      result,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return { allowed: false, decision: 'error', error: `moderation_failed:${message}` };
  }
}
