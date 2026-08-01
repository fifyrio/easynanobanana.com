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

function decodePrivateKey(value: string): string {
  if (!value) return '';
  // Raw PEM (possibly with literal \n escapes).
  if (value.includes('BEGIN')) {
    return value.replace(/\\n/g, '\n');
  }
  // Base64 input can encode either a PEM text file or raw DER bytes.
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf-8');
    // Only base64-of-PEM decodes to text containing the PEM header.
    if (decoded.includes('BEGIN')) {
      return decoded.replace(/\\n/g, '\n');
    }
  } catch {
    // fall through — treat as raw base64 DER
  }
  // Raw base64 of DER — the SDK accepts this form as-is; do NOT utf-8 decode
  // it (that corrupts the binary key into an invalid string).
  return value;
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
