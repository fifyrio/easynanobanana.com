import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * GET /api/subscription/callback
 * Thin redirect target after Waffo checkout.
 *
 * Credit/subscription fulfillment is handled asynchronously by the webhook
 * (/api/subscription/webhook) — this endpoint only routes the browser and
 * marks user-cancelled orders as failed.
 *
 * Query parameters:
 * - order_id: UUID of the order
 * - status: 'success' or 'cancel'
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');

  console.log('=== Subscription Callback ===', { orderId, status });

  if (!orderId) {
    return NextResponse.redirect(new URL('/pricing?error=missing_order', request.url));
  }

  // User cancelled at the checkout page
  if (status === 'cancel') {
    try {
      const serviceSupabase = createServiceClient();
      await serviceSupabase
        .from('orders')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'pending');
    } catch (error) {
      console.error('Failed to mark cancelled order:', error);
    }
    return NextResponse.redirect(new URL('/pricing?cancelled=true', request.url));
  }

  // Success — webhook grants credits (may lag a moment). Route to billing.
  return NextResponse.redirect(new URL('/billing?subscribed=true', request.url));
}
