// Mock Payment Client (based on Creem.io structure)

import crypto from 'crypto';
import { CreateCheckoutRequest, CreateCheckoutResponse, Checkout } from './types';

export class MockPaymentClient {
  private apiKey: string;
  private baseUrl: string;
  private webhookSecret: string;

  constructor(apiKey?: string, baseUrl?: string, webhookSecret?: string) {
    this.apiKey = apiKey || process.env.MOCK_PAYMENT_API_KEY || 'mock_key_dev';
    this.baseUrl = baseUrl || 'https://mock-payment.example.com/api';
    this.webhookSecret = webhookSecret || process.env.MOCK_PAYMENT_WEBHOOK_SECRET || 'mock_webhook_secret';
  }

  /**
   * Create a checkout session (mock implementation)
   */
  async createCheckout(request: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
    // Simulate API delay
    await this.delay(500);

    const checkoutId = this.generateId('checkout');
    
    // Mock payment URL with checkout ID
    const paymentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/mock-payment?checkout_id=${checkoutId}&product_id=${request.product_id}&email=${encodeURIComponent(request.customer?.email || '')}&success_url=${encodeURIComponent(request.success_url || '')}&cancel_url=${encodeURIComponent(request.cancel_url || '')}`;

    return {
      checkout_id: checkoutId,
      payment_url: paymentUrl,
      status: 'pending'
    };
  }

  /**
   * Get checkout session details
   */
  async getCheckout(checkoutId: string): Promise<Checkout | null> {
    // Simulate API delay
    await this.delay(200);

    // Mock checkout data - in real implementation this would come from database
    return {
      id: checkoutId,
      order_id: this.generateId('order'),
      status: 'pending',
      payment_url: `${this.baseUrl}/checkout/${checkoutId}`,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
      amount: 1390, // $13.90 in cents
      currency: 'USD',
      created_at: new Date(),
    };
  }

  /**
   * Create callback signature for payment verification
   */
  createCallbackSignature(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.apiKey)
      .update(sortedParams)
      .digest('hex');
  }

  /**
   * Create webhook signature
   */
  createWebhookSignature(body: string, timestamp: string): string {
    const payload = `${timestamp}.${body}`;
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, timestamp: string, signature: string): boolean {
    const expectedSignature = this.createWebhookSignature(body, timestamp);
    
    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}${random}`;
  }

  /**
   * Simulate API delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create mock payment client instance
 */
export const createMockPaymentClient = (): MockPaymentClient => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return new MockPaymentClient(
      process.env.MOCK_PAYMENT_API_KEY,
      'https://mock-payment.example.com/api',
      process.env.MOCK_PAYMENT_WEBHOOK_SECRET
    );
  } else {
    return new MockPaymentClient(
      process.env.MOCK_PAYMENT_TEST_KEY || 'mock_test_key',
      'https://test-mock-payment.example.com/api',
      process.env.MOCK_PAYMENT_WEBHOOK_SECRET || 'test_webhook_secret'
    );
  }
};