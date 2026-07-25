// Waffo Pancake payment environment configuration
// Test values now; production slots filled later. Switch with PAYMENT_ENV.

export interface PaymentConfig {
  merchantId: string;
  storeId: string;
  /** RSA private key in PEM format (decoded from base64 env) */
  privateKey: string;
  basicProductId: string;
  proProductId: string;
  maxProductId: string;
}

function decodePrivateKey(base64: string): string {
  if (!base64) return '';
  // Support either a base64-encoded PEM or a raw PEM with literal \n
  if (base64.includes('BEGIN')) {
    return base64.replace(/\\n/g, '\n');
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function getPaymentConfig(): PaymentConfig {
  const isProd = getPaymentEnvironment() === 'production';
  const prefix = isProd ? 'WAFFO_PROD_' : 'WAFFO_TEST_';

  const pick = (key: string): string => process.env[`${prefix}${key}`] || '';

  return {
    merchantId: pick('MERCHANT_ID'),
    storeId: pick('STORE_ID'),
    privateKey: decodePrivateKey(pick('PRIVATE_KEY_BASE64')),
    basicProductId: pick('BASIC_PRODUCT_ID'),
    proProductId: pick('PRO_PRODUCT_ID'),
    maxProductId: pick('MAX_PRODUCT_ID'),
  };
}

export function getPaymentEnvironment(): 'test' | 'production' {
  return process.env.PAYMENT_ENV === 'production' ? 'production' : 'test';
}

export function isProductionPayment(): boolean {
  return getPaymentEnvironment() === 'production';
}
