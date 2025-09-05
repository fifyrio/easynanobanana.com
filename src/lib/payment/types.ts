// Mock payment types based on Creem.io structure

export interface Product {
  product_id: string;
  name: string;
  icon?: string;
  price: number;
  originalPrice?: number;
  yearlyPrice?: number;
  credits: number | string;
  description: string;
  buttonText: string;
  buttonVariant?: 'primary' | 'secondary';
  features: string[];
  type: 'once' | 'subscription';
  billing_period?: 'monthly' | 'yearly';
  isPopular?: boolean;
  // Legacy fields for backward compatibility
  product_name?: string;
  popular?: boolean;
  pricePerCredit?: number;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  price: number;
  credits: number;
  type: 'once' | 'subscription';
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  checkout_id: string;
  created_at: Date;
  completed_at?: Date;
}

export interface Checkout {
  id: string;
  order_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  payment_url: string;
  success_url: string;
  cancel_url: string;
  amount: number;
  currency: string;
  customer_email?: string;
  created_at: Date;
  completed_at?: Date;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  created_at: Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  product_id: string;
  status: 'active' | 'cancelled' | 'expired';
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  created_at: Date;
  cancelled_at?: Date;
}

export interface WebhookBody {
  eventType: 'checkout.completed' | 'refund.created' | 'subscription.cancelled';
  object: Checkout | Refund | Subscription;
  timestamp: number;
}

export interface Refund {
  id: string;
  checkout_id: string;
  amount: number;
  reason?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: Date;
}

export interface CreateCheckoutRequest {
  product_id: string;
  request_id?: string;
  success_url?: string;
  cancel_url?: string;
  customer?: {
    email: string;
  };
  metadata?: Record<string, any>;
  discount_code?: string;
  units?: number;
  locale?: string;
  plan_type?: string;
}

export interface CreateCheckoutResponse {
  checkout_id: string;
  payment_url: string;
  status: string;
}