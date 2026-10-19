import 'dotenv/config';
import { type TaxCategory, type StoreWebhook, WebhookEventType } from '@waffo/pancake-ts';
import { createWaffoClient } from '../src/lib/payment/waffo-client';
import { getPaymentConfig, getPaymentEnvironment } from '../src/lib/payment/config';
import { PAID_VIDEO_TRIALS } from '../src/lib/payment/paid-trial';
import { createServiceClient } from '../src/lib/supabase-server';

// Default: read-only. --apply updates test versions; --publish also promotes
// those versions and requires the database migration to have been applied.
async function main() {
  const apply = process.argv.includes('--apply');
  const publish = process.argv.includes('--publish');
  if (publish && !apply) throw new Error('--publish requires --apply');
  if (publish) {
    const service = createServiceClient();
    for (const table of ['paid_video_trials', 'subscription_payments']) {
      const { error } = await service.from(table).select('*').limit(0);
      if (error) throw new Error(`Apply 20261012_paid_video_trials.sql before publishing: ${error.message}`);
    }
  }
  const config = getPaymentConfig();
  const client = createWaffoClient();
  const ids = [config.basicProductId, config.proProductId, config.maxProductId];
  const { data, errors } = await client.graphql.query<{
    subscriptionProducts: Array<{ id: string; name: string; metadata: string; prices: Array<{ currency: string; priceInfo: { amount: string; taxCategory: TaxCategory; trialAmount?: string } }> }>;
    subscriptionProductGroups: Array<{ id: string; name: string; productIds: string[] }>;
  }>({query: `query($id:String!) {
    subscriptionProducts(storeId:$id) { id name metadata prices { currency priceInfo { amount taxCategory trialAmount } } }
    subscriptionProductGroups(storeId:$id) { id name productIds }
  }`,variables:{id:config.storeId}});
  if (errors?.length || !data) throw new Error(JSON.stringify(errors));
  const conflicting = data.subscriptionProductGroups.find(g=>g.name!=='Easy Nano Banana video trials' && g.productIds.some(id=>ids.includes(id)));
  if (conflicting) throw new Error('Products already belong to another group; preserve its settings before enabling shared trials');
  for (const id of ids) {
    const product = data.subscriptionProducts.find(p=>p.id===id);
    if (!product) throw new Error('Configured product not found');
    const trial = PAID_VIDEO_TRIALS[product.name];
    const metadata = JSON.parse(product.metadata);
    const prices = Object.fromEntries(product.prices.map(p=>[p.currency,{...p.priceInfo}]));
    if (trial) {
      metadata.trialDays = trial.days;
      prices.USD.trialAmount = trial.price.toFixed(2);
    } else {
      delete metadata.trialDays;
      for (const price of Object.values(prices)) delete price.trialAmount;
    }
    console.log({ environment:getPaymentEnvironment(), plan:product.name, monthly:prices.USD.amount, trialAmount:prices.USD.trialAmount, trialDays:metadata.trialDays, apply, publish });
    if (apply) {
      await client.subscriptionProducts.update({ id, prices, metadata });
      if (publish) await client.subscriptionProducts.publish({ id });
    }
  }
  const name = 'Easy Nano Banana video trials';
  const group = data.subscriptionProductGroups.find(g=>g.name===name);
  if (apply) {
    const result = group
      ? await client.subscriptionProductGroups.update({id:group.id,productIds:ids,rules:{sharedTrial:true}})
      : await client.subscriptionProductGroups.create({storeId:config.storeId,name,productIds:ids,rules:{sharedTrial:true}});
    if (publish) await client.subscriptionProductGroups.publish({id:result.group.id});
  }
  // Payment fulfillment needs payment receipts, not subscription activation.
  if (apply) {
    const storeResult = await client.graphql.query<{store:{storeWebhooks:StoreWebhook[]}}>({
      query:'query($id:String!){store(id:$id){storeWebhooks{id channel url events testMode}}}',variables:{id:config.storeId},
    });
    if (storeResult.errors?.length || !storeResult.data) throw new Error('Cannot read store webhook configuration: '+JSON.stringify(storeResult.errors));
    const testMode = !publish;
    const hooks = storeResult.data.store.storeWebhooks.filter(h=>h.channel==='http' && h.testMode===testMode && new URL(h.url).pathname==='/api/subscription/webhook');
    const events = [WebhookEventType.SubscriptionPaymentSucceeded, WebhookEventType.SubscriptionCanceled];
    if (hooks.length) {
      for (const hook of hooks) await client.webhooks.update({id:hook.id,events:Array.from(new Set([...hook.events,...events]))});
    } else {
      if (!process.env.NEXT_PUBLIC_SITE_URL) throw new Error('NEXT_PUBLIC_SITE_URL required to configure payment webhook');
      await client.webhooks.add({storeId:config.storeId,channel:'http',url:new URL('/api/subscription/webhook',process.env.NEXT_PUBLIC_SITE_URL).href,testMode,events});
    }
  }
  console.log(apply ? (publish ? 'Published paid trials and payment webhook events.' : 'Test configuration updated; production unchanged.') : 'Read-only inspection; use --apply to update test configuration.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
