/**
 * Prompt moderation — pre-generation prompt screening.
 *
 * Local, offline denylist. No external API (all hosted options were either
 * region-blocked or out of credit). Every user-supplied prompt routed to an
 * image or video model is screened here before generation happens.
 *
 * This is a lightweight first line of defense only; the downstream image model
 * (KIE / Google) enforces its own safety policy as a backstop.
 */

type ModerationDecision = 'allow' | 'flag' | 'deny';

interface ModerationResult {
  id: string;
  object: 'moderation_result';
  prompt: string;
  external_id?: string;
  decision: ModerationDecision;
  matched?: string;
}

export type ModerationOutcome =
  | { allowed: true; decision: 'allow'; result: ModerationResult }
  | { allowed: false; decision: 'deny' | 'flag'; result: ModerationResult }
  | { allowed: false; decision: 'error'; error: string };

/**
 * Denylist of clearly disallowed content. Word-boundary matched,
 * case-insensitive. Keep focused on unambiguous policy violations to avoid
 * false positives that block legitimate creative prompts.
 */
const DENY_PATTERNS: RegExp[] = [
  // Child sexual content — zero tolerance
  /\b(child|children|kid|kids|minor|minors|underage|preteen|pre-teen|toddler|infant|baby|babies|loli|shota)\b[^.]{0,40}\b(nude|naked|nudity|sex|sexual|porn|explicit|nsfw|erotic|genital)\b/i,
  /\b(nude|naked|sexual|porn|explicit|erotic)\b[^.]{0,40}\b(child|children|kid|kids|minor|minors|underage|preteen|toddler|loli|shota)\b/i,
  /\bcsam\b/i,
  // Non-consensual / bestiality
  /\b(rape|bestiality|zoophilia)\b/i,
];

function makeResult(
  prompt: string,
  decision: ModerationDecision,
  externalId?: string,
  matched?: string
): ModerationResult {
  return {
    id: `local_${prompt.length}_${decision}`,
    object: 'moderation_result',
    prompt,
    decision,
    ...(externalId ? { external_id: externalId } : {}),
    ...(matched ? { matched } : {}),
  };
}

/**
 * Screen a user prompt against the local denylist.
 * Allowed unless it matches an explicit deny pattern.
 */
export async function screenPrompt(
  prompt: string,
  externalId?: string
): Promise<ModerationOutcome> {
  // Kill switch: set MODERATION_ENABLED=false to bypass all screening.
  // Code below is retained; flip the flag to re-enable later.
  if (process.env.MODERATION_ENABLED === 'false') {
    return { allowed: true, decision: 'allow', result: makeResult(prompt, 'allow', externalId) };
  }

  const text = (prompt ?? '').trim();
  if (!text) {
    return { allowed: true, decision: 'allow', result: makeResult(prompt, 'allow', externalId) };
  }

  for (const pattern of DENY_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        decision: 'deny',
        result: makeResult(prompt, 'deny', externalId, pattern.source),
      };
    }
  }

  return { allowed: true, decision: 'allow', result: makeResult(prompt, 'allow', externalId) };
}
