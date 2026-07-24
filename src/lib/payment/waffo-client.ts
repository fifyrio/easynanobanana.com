// Waffo Pancake payment client factory
// Server-side only — never expose the private key to the browser.

import { WaffoPancake } from '@waffo/pancake-ts';
import { getPaymentConfig } from './config';

/**
 * Create a configured WaffoPancake client for the active PAYMENT_ENV.
 * Throws if merchant credentials are missing so misconfiguration fails fast.
 */
export function createWaffoClient(): WaffoPancake {
  const config = getPaymentConfig();

  if (!config.merchantId || !config.privateKey) {
    throw new Error(
      'Waffo payment not configured: missing merchant ID or private key'
    );
  }

  return new WaffoPancake({
    merchantId: config.merchantId,
    privateKey: config.privateKey,
  });
}
