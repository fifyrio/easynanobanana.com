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
  // Face & beauty (edits a real human face)
  '/ai-image-effects/ai-makeup',
  '/ai-image-effects/ai-skin-smoother',
  '/ai-image-effects/ai-skin-analyzer',
  '/ai-image-effects/ai-skin-color',
  '/ai-image-effects/ai-teeth-whitening',
  '/ai-image-effects/ai-eye-color',
  '/ai-image-effects/ai-open-eyes',
  '/ai-image-effects/ai-smile-filter',
  '/ai-image-effects/beard-filter',
  '/ai-image-effects/ai-face-shape',
  '/ai-image-effects/ai-face-symmetry',
  '/ai-image-effects/ai-double-chin-remover',
  '/ai-image-effects/ai-aesthetic-sim',
  '/ai-image-effects/ai-personal-color',
  '/ai-image-effects/ai-hairstyle',
  '/ai-image-effects/ai-hairstyle-analysis',
  '/ai-image-effects/ai-age-filter',
  '/ai-image-effects/ai-glow-up-test',
  '/ai-image-effects/ai-face-expression-changer',
  '/ai-image-effects/ai-face-animator',
  // Body & virtual try-on (real human body / likeness)
  '/ai-image-effects/body-editor',
  '/ai-image-effects/ai-fat-filter',
  '/ai-image-effects/ai-muscle-generator',
  '/ai-image-effects/ai-clothes-changer',
  '/ai-image-effects/ai-outfit-change',
  '/ai-image-effects/ai-hat-tryon',
  '/ai-image-effects/ai-eyewear-tryon',
  '/ai-image-effects/virtual-jewelry-try-on',
  '/ai-image-effects/ai-nail-color-changer',
  '/ai-image-effects/ai-model-swap',
  // Portrait stylization (retains subject identity)
  '/ai-image-effects/ai-photo-to-cartoon',
  '/ai-image-effects/ai-photo-to-sketch',
  '/ai-image-effects/ai-vintage-photo-booth',
  '/ai-image-effects/ai-yearbook-generator',
  '/ai-image-effects/ai-passport-photo-maker',
  '/ai-anime-generator',
  '/ai-image-effects/ai-photo-colorizer',
]);

export function isPortraitModuleHidden(): boolean {
  return process.env.NEXT_PUBLIC_HIDE_PORTRAIT_MODULE !== 'false';
}

export function isPortraitPathHidden(href: string): boolean {
  return isPortraitModuleHidden() && PORTRAIT_MODULE_PATHS.has(href);
}
