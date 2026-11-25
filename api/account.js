// Everything about the learner's account, in one route (the free Vercel plan limits the number of routes):
//   GET  /api/account                 who am I, which offer, minutes left, saved progress
//   PUT  /api/account                 save progress                      { state }
//   POST /api/account?do=call         a call started or ended            { conversationId, seconds? }
//   POST /api/account?do=checkout     start a subscription               { plan } -> { url }
//   POST /api/account?do=portal       manage or cancel the subscription  -> { url }
import { accountsOn, paymentOn, userOf, profileOf, usageOf, db, stripe, PLANS } from './_lib.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!accountsOn()) return res.status(503).json({ error: 'accounts_off' });
  try {
    const user = await userOf(req);
    if (!user) return res.status(401).json({ error: 'login' });
    const profile = await profileOf(user), act = req.query.do;
    const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;

    if (req.method === 'GET') {
      const u = await usageOf(user, profile);
      return res.status(200).json({ email: user.email, ...u, payment: paymentOn(), state: profile.state || null, stateAt: profile.updated_at });
    }
    if (req.method === 'PUT') {
      const state = req.body && req.body.state;
      if (!state || typeof state !== 'object' || JSON.stringify(state).length > 400000) return res.status(400).json({ error: 'bad_state' });
      await db(`profiles?id=eq.${user.id}`, { method: 'PATCH', body: { state, updated_at: new Date().toISOString() } });
      return res.status(200).json({ ok: true });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (act === 'call') {
      const id = String((req.body && req.body.conversationId) || '');
      if (!/^conv_[A-Za-z0-9]{6,80}$/.test(id)) return res.status(400).json({ error: 'bad_call' });
      const secs = Math.max(0, Math.min(7200, Math.round(+req.body.seconds || 0)));
      const have = await db(`calls?conversation_id=eq.${id}&select=id,user_id,verified`);
      if (!have.length) await db('calls', { method: 'POST', body: { user_id: user.id, conversation_id: id, seconds: secs } });
      else if (have[0].user_id === user.id && !have[0].verified && secs) await db(`calls?id=eq.${have[0].id}`, { method: 'PATCH', body: { seconds: secs } });
      return res.status(200).json({ ok: true });
    }
    if (!paymentOn()) return res.status(503).json({ error: 'payment_off' });

    let customer = profile.stripe_customer;
    if (!customer) {
      customer = (await stripe('customers', { email: user.email, 'metadata[user_id]': user.id })).id;
      await db(`profiles?id=eq.${user.id}`, { method: 'PATCH', body: { stripe_customer: customer } });
    }
    if (act === 'checkout') {
      const plan = PLANS[req.body && req.body.plan];
      if (!plan || !plan.lookup) return res.status(400).json({ error: 'bad_plan' });
      // The offer is created in Stripe the first time someone picks it, so there is nothing to set up by hand there.
      const prices = await stripe(`prices?lookup_keys[]=${plan.lookup}&active=true`);
      const price = prices.data[0] || await stripe('prices', { currency: 'eur', unit_amount: String(plan.cents), 'recurring[interval]': 'month', lookup_key: plan.lookup, 'product_data[name]': plan.name });
      const s = await stripe('checkout/sessions', { mode: 'subscription', customer, 'line_items[0][price]': price.id, 'line_items[0][quantity]': '1',
        success_url: `${origin}/app?paid=1`, cancel_url: `${origin}/app?paid=0`, locale: 'fr', allow_promotion_codes: 'true' });
      return res.status(200).json({ url: s.url });
    }
    if (act === 'portal') {
      const s = await stripe('billing_portal/sessions', { customer, return_url: `${origin}/app`, locale: 'fr' });
      return res.status(200).json({ url: s.url });
    }
    return res.status(400).json({ error: 'unknown' });
  } catch (e) {
    console.error('account', e);
    return res.status(500).json({ error: String(e.message || e).slice(0, 200) });
  }
}
