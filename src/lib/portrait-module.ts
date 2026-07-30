/**
 * Compliance gate for the "Portrait & Identity" (人物形象) module.
 *
 * The payment/onboarding reviewer requires this entire module taken offline
 * to pass business-admission review. This is a temporary takedown, so the gate
 * is env-controlled and fully reversible — no page/component code is deleted.
 *
 * Toggle with NEXT_PUBLIC_HIDE_PORTRAIT_MODULE:
 *   - unset or any value other than 'false'  -> module hidden (fail-safe)
 *   - 'false'                                 -> module restored
 *
 * NEXT_PUBLIC_ prefix is required because nav + showcase render in client
 * components; server pages read the same inlined value.
 */

export const PORTRAIT_MODULE_PATHS: ReadonlySet<string> = new Set([
  '/ai-image-effects/ai-figure-generator',
  '/ai-image-effects/ai-headshot-generator',
  '/ai-image-effects/ai-baby-generator',
  '/ai-image-effects/ai-pet-portrait',
  '/ai-image-effects/ai-alter-ego',
  '/ai-image-effects/ai-couple-match',
  '/ai-image-effects/ai-face-pair',
  '/ai-image-effects/ai-celebrity-lookalike',
  '/ai-image-effects/ai-gender-swap',
  '/ai-image-effects/ai-face-anonymizer',
  '/ai-image-effects/ai-attractiveness-test',
]);

export function isPortraitModuleHidden(): boolean {
  return process.env.NEXT_PUBLIC_HIDE_PORTRAIT_MODULE !== 'false';
}

export function isPortraitPathHidden(href: string): boolean {
  return isPortraitModuleHidden() && PORTRAIT_MODULE_PATHS.has(href);
}
