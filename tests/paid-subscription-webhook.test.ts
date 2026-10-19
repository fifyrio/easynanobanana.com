import assert from 'node:assert/strict';
import Module from 'node:module';
import { NextRequest } from 'next/server';
let calls: any[] = [];
let dbError: { message: string } | null = null;
let event: any = {
  id: 'delivery', timestamp: new Date().toISOString(), mode: 'test', eventType: 'subscription.payment_succeeded',
  data: { orderId: 'remote-order', orderMerchantExternalId: 'internal-order', paymentId: 'payment', paymentStatus: 'succeeded', chargedAmount: '1.99', currency: 'USD' },
};
let remote: any = { id: 'remote-order', merchantProvidedBuyerIdentity: 'user', orderMerchantExternalId: 'internal-order',
  subscriptionProduct: { id: 'max-product' }, currentPeriodStart: event.timestamp,
  currentPeriodEnd: new Date(Date.now()+3*86400000).toISOString(),
  priceSnapshot: { currency: 'USD', specialPhaseDays: 3, specialPhase: { subtotal: '1.99', total: '1.99' }, regularPhase: { subtotal: '78.99', total: '78.99' } },
};
const loader = Module as unknown as { _load: (name: string, ...args: unknown[]) => unknown };
const original = loader._load;
loader._load = function(name, ...args) {
  if (name === '@waffo/pancake-ts') return { verifyWebhook: () => event, WebhookEventType: {
    OrderCompleted:'order.completed', SubscriptionPaymentSucceeded:'subscription.payment_succeeded', SubscriptionCanceled:'subscription.canceled',
  } };
  if (name === '@/lib/supabase-server') return { createServiceClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { id:'internal-order',user_id:'user',amount:1.99,currency:'USD',
      payment_plans:{name:'Max Monthly',price:78.99} },error:null }) }) }) }),
    rpc: async (name: string, args: any) => { calls.push({name,args}); return {error:dbError}; },
  }) };
  if (name === './waffo-client') return {createWaffoClient:()=>({graphql:{query:async()=>({data:{subscriptionOrder:remote}})}})};
  if (name === './config' || name === '@/lib/payment/config') return {getPaymentEnvironment:()=> 'test',getPaymentConfig:()=>({maxProductId:'max-product'})};
  return original.call(this,name,...args);
};
const {POST}=require('../src/app/api/subscription/webhook/route') as typeof import('../src/app/api/subscription/webhook/route');
const {paymentPhase}=require('../src/lib/payment/fulfill-payment') as typeof import('../src/lib/payment/fulfill-payment');
loader._load=original;
const request=()=>new NextRequest('https://example.invalid/api/subscription/webhook',{method:'POST',body:'signed-payload'});
async function main(){
  assert.equal((await POST(request())).status,200); assert.equal(calls[0].args.p_is_trial,true);
  event.data.chargedAmount='78.99';calls=[];
  assert.equal((await POST(request())).status,200);assert.equal(calls[0].args.p_is_trial,false);
  for(const amount of [undefined,'0','0.99','2.99']){event.data.chargedAmount=amount;calls=[];assert.equal((await POST(request())).status,500);assert.equal(calls.length,0);}
  event.data.chargedAmount='1.99';event.eventType='subscription.activated';calls=[];
  assert.equal((await POST(request())).status,200);assert.equal(calls.length,0,'Activation must never grant credits');
  event.eventType='subscription.payment_succeeded';event.mode='prod';assert.equal((await POST(request())).status,400);
  event.mode='test';remote.merchantProvidedBuyerIdentity='another-user';calls=[];
  assert.equal((await POST(request())).status,500);assert.equal(calls.length,0);
  remote.merchantProvidedBuyerIdentity='user';dbError={message:'Database temporarily unavailable'};
  assert.equal((await POST(request())).status,500,'Failed fulfillment must request provider retry');
  assert.equal(paymentPhase('2.19','Max Monthly',78.99,{...remote.priceSnapshot,specialPhase:{subtotal:'1.99',total:'2.19'}}),'trial','Tax-inclusive charges must match the provider snapshot');
  console.log('PASS: paid trial/monthly payment routing, collected amount, activation, environment, ownership, tax and retry handling');
}
main().catch(e=>{console.error(e);process.exitCode=1});
