import assert from 'node:assert/strict';
import Module from 'node:module';
import { NextRequest } from 'next/server';

let subscription: any = { id: 'local-sub', external_subscription_id: 'provider-order', cancel_at_period_end: false,
  current_period_end: '2026-11-01T00:00:00Z', payment_plans: { name: 'Max Monthly' } };
let providerError = false;
let updates = 0;
let canceledOrders: string[] = [];
let authenticated = true;
const loader = Module as unknown as { _load: (name: string, ...args: unknown[]) => unknown };
const original = loader._load;
loader._load = function(name, ...args) {
  if (name === '@supabase/supabase-js') return { createClient: () => ({ auth: { getUser: async () => ({
    data: { user: authenticated ? { id: 'owner' } : null }, error: null,
  }) } }) };
  if (name === '@/lib/payment/waffo-client') return { createWaffoClient: () => ({ orders: {
    cancelSubscription: async ({orderId}: {orderId:string}) => {
      canceledOrders.push(orderId);
      if (providerError) throw new Error('Provider unavailable');
      return { orderId, status: 'canceling' };
    },
  } }) };
  if (name === '@/lib/supabase-server') return { createServiceClient: () => ({ from: () => ({
    select: () => { const chain: any = {eq:()=>chain,single:async()=>({data:subscription,error:null})}; return chain; },
    update: () => { updates++; return {eq:async()=>({error:null})}; },
  }) }) };
  return original.call(this,name,...args);
};
const { POST } = require('../src/app/api/subscription/cancel/route') as typeof import('../src/app/api/subscription/cancel/route');
loader._load = original;
const request = (withToken=true) => new NextRequest('https://example.invalid/api/subscription/cancel',{
  method:'POST', headers:withToken?{Authorization:'Bearer test-token'}:{},
});
async function main() {
  assert.equal((await POST(request())).status,200);
  assert.deepEqual(canceledOrders,['provider-order'],'Must cancel the real Waffo subscription');
  assert.equal(updates,1);
  providerError=true; updates=0;
  assert.equal((await POST(request())).status,500);
  assert.equal(updates,0,'Provider failure must not mark local cancellation successful');
  providerError=false; subscription.cancel_at_period_end=true; canceledOrders=[];
  assert.equal((await POST(request())).status,200);
  assert.deepEqual(canceledOrders,['provider-order'],'Legacy local-only flags must still notify Waffo');
  subscription.external_subscription_id=null; canceledOrders=[];
  assert.equal((await POST(request())).status,500);
  assert.equal(canceledOrders.length,0);
  assert.equal((await POST(request(false))).status,401);
  authenticated=false;
  assert.equal((await POST(request())).status,401);
  console.log('PASS: provider cancellation, provider failure, legacy cancellation flag, missing order and authentication');
}
main().catch(e=>{console.error(e);process.exitCode=1});
