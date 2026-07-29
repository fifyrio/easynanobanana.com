/**
 * Compliance gate for high-risk (deepfake) features.
 *
 * Card organizations (Visa/Mastercard) classify Face Swap, Body Swap, and
 * AI Kiss/Hug video as deepfake / high-risk business and reject onboarding
 * while they are publicly reachable. This module hides those surfaces from
 * navigation, the homepage showcase, search engines, and direct access.
 *
 * Toggle with the NEXT_PUBLIC_HIDE_RISKY_FEATURES env var:
 *   - unset or any value other than 'false'  -> features hidden (fail-safe)
 *   - 'false'                                 -> features restored
 *
 * NEXT_PUBLIC_ prefix is required because nav + showcase render in client
 * components; server pages read the same inlined value.
 */

export const HIDDEN_FEATURE_PATHS: ReadonlySet<string> = new Set([
  '/ai-image-effects/ai-face-swap',
  '/ai-image-effects/ai-body-swap',
  '/ai-image-effects/ai-hug',
  '/video/ai-kiss',
]);

export function areRiskyFeaturesHidden(): boolean {
  return process.env.NEXT_PUBLIC_HIDE_RISKY_FEATURES !== 'false';
}

export function isFeatureHidden(href: string): boolean {
  return areRiskyFeaturesHidden() && HIDDEN_FEATURE_PATHS.has(href);
}
