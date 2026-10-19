import type { WebhookEvent } from '@waffo/pancake-ts';
import { createWaffoClient } from './waffo-client';
import { createServiceClient } from '@/lib/supabase-server';
import { PAID_VIDEO_TRIALS } from './paid-trial';
import { getPaymentConfig } from './config';

interface ProviderSubscription {
  id: string;
  merchantProvidedBuyerIdentity: string;
  orderMerchantExternalId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  subscriptionProduct: { id: string };
  priceSnapshot: {
    currency: string;
    specialPhaseDays?: number;
    specialPhase?: { subtotal: string; total: string };
    regularPhase: { subtotal: string; total: string };
  };
}

export function paymentPhase(charged: string | undefined, planName: string, monthlyPrice: number, snapshot: ProviderSubscription['priceSnapshot']): 'trial' | 'monthly' {
  const cents = (value: string | number | undefined) => value === undefined ? NaN : Math.round(Number(value) * 100);
  const amount = cents(charged);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Missing positive collected payment amount');
  if (cents(snapshot.regularPhase.subtotal) === cents(monthlyPrice) && amount === cents(snapshot.regularPhase.total)) return 'monthly';
  const trial = PAID_VIDEO_TRIALS[planName];
  if (trial && snapshot.specialPhaseDays === trial.days &&
    cents(snapshot.specialPhase?.subtotal) === cents(trial.price) && amount === cents(snapshot.specialPhase?.total)) return 'trial';
  throw new Error('Collected payment does not match the configured offer');
}

export async function fulfillSubscriptionPayment(event: WebhookEvent): Promise<void> {
  const orderId = event.data.orderMerchantExternalId || event.data.orderMetadata?.order_id;
  if (!orderId || !event.data.paymentId || event.data.paymentStatus !== 'succeeded') {
    throw new Error('Missing successful payment or internal order reference');
  }
  const service = createServiceClient();
  const { data: order, error } = await service.from('orders').select('*, payment_plans(*)').eq('id', orderId).single();
  if (error || !order?.payment_plans) throw new Error('Payment order not found');
  const { data, errors } = await createWaffoClient().graphql.query<{ subscriptionOrder: ProviderSubscription }>({
    query: `query($id: String!) { subscriptionOrder(id: $id) {
      id merchantProvidedBuyerIdentity orderMerchantExternalId currentPeriodStart currentPeriodEnd
      subscriptionProduct { id }
      priceSnapshot { currency specialPhaseDays specialPhase { subtotal total } regularPhase { subtotal total } }
    } }`,
    variables: { id: event.data.orderId },
  });
  const remote = data?.subscriptionOrder;
  const config = getPaymentConfig();
  const expectedProduct = { 'Basic Monthly': config.basicProductId, 'Pro Monthly': config.proProductId, 'Max Monthly': config.maxProductId }[order.payment_plans.name as string];
  if (errors?.length || !remote || remote.merchantProvidedBuyerIdentity !== order.user_id ||
    remote.orderMerchantExternalId !== order.id || remote.subscriptionProduct.id !== expectedProduct ||
    remote.priceSnapshot.currency !== order.currency || event.data.currency !== order.currency) {
    throw new Error('Provider subscription does not match the payment order');
  }
  const phase = paymentPhase(event.data.chargedAmount, order.payment_plans.name, Number(order.payment_plans.price), remote.priceSnapshot);
  const trial = PAID_VIDEO_TRIALS[order.payment_plans.name];
  if (phase === 'trial' && Number(order.amount) !== trial.price) throw new Error('Trial was not selected at checkout');
  // A delayed trial receipt must never create a fresh trial after conversion.
  const start = phase === 'trial' ? event.timestamp : remote.currentPeriodStart;
  const end = phase === 'trial'
    ? new Date(Math.min(Date.parse(remote.currentPeriodEnd), Date.parse(event.timestamp) + trial.days * 86400000)).toISOString()
    : remote.currentPeriodEnd;
  const { error: fulfillmentError } = await service.rpc('fulfill_paid_subscription', {
    p_order_id: order.id, p_payment_id: event.data.paymentId, p_external_order_id: remote.id,
    p_is_trial: phase === 'trial', p_period_start: start, p_period_end: end,
  });
  if (fulfillmentError) throw new Error(fulfillmentError.message);
}
