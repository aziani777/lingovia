// Shared helpers for accounts, minutes and payment. Files starting with "_" are not routes.
// Accounts live in Supabase, subscriptions in Stripe. Without their keys the app runs as before: no accounts, no limits.
export const SB_URL = process.env.SUPABASE_URL || 'https://theucoiqbndpqaqqqnvy.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE = process.env.STRIPE_SECRET_KEY;
export const accountsOn = () => !!SB_KEY;
export const paymentOn = () => !!STRIPE;

// Minutes included in each offer. free: once, for good. Paid: per billing month.
export const PLANS = {
  free: { minutes: 10 },
  essentiel: { minutes: 90, lookup: 'lingovia_essentiel', name: 'Lingovia Essentiel', cents: 1299 },
  intensif: { minutes: 200, lookup: 'lingovia_intensif', name: 'Lingovia Intensif', cents: 2499 },
};
export const TRIAL_SECONDS = 180;   // first call, before any account exists

const sbHeaders = extra => ({ apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', ...extra });

// Who is calling? Reads the Supabase session token sent by the app.
export async function userOf(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m || !SB_KEY) return null;
  const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${m[1]}` } });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? { id: u.id, email: u.email } : null;
}

// Tiny PostgREST client (service role: bypasses row level security, so it must never reach the browser)
export async function db(path, { method = 'GET', body, prefer } = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { method, headers: sbHeaders(prefer ? { Prefer: prefer } : {}), body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`db ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}

export async function stripe(path, params, method = params ? 'POST' : 'GET') {
  const body = params ? new URLSearchParams(params).toString() : undefined;
  const r = await fetch(`https://api.stripe.com/v1/${path}`, { method, headers: { Authorization: `Bearer ${STRIPE}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const j = await r.json();
  if (!r.ok) throw new Error(`stripe ${r.status}: ${j.error && j.error.message}`);
  return j;
}

export async function profileOf(user) {
  const rows = await db(`profiles?id=eq.${user.id}&select=*`);
  if (rows && rows[0]) return rows[0];
  const made = await db('profiles', { method: 'POST', body: { id: user.id }, prefer: 'return=representation' });
  return made[0];
}

// The learner's current offer, read from Stripe each time (no webhook to keep in sync).
export async function planOf(profile) {
  if (!STRIPE || !profile.stripe_customer) return { plan: 'free', since: null };
  const subs = await stripe(`subscriptions?customer=${profile.stripe_customer}&status=all&limit=5&expand[]=data.items.data.price`);
  const sub = (subs.data || []).find(s => s.status === 'active' || s.status === 'trialing' || s.status === 'past_due');
  if (!sub) return { plan: 'free', since: null };
  const item = sub.items.data[0], key = item.price.lookup_key;
  const plan = Object.keys(PLANS).find(p => PLANS[p].lookup === key) || 'essentiel';
  const start = item.current_period_start || sub.current_period_start, end = item.current_period_end || sub.current_period_end;
  return { plan, since: new Date(start * 1000).toISOString(), renews: new Date(end * 1000).toISOString(), ending: !!sub.cancel_at_period_end };
}

// Call lengths come from ElevenLabs, not from the browser: fill in the calls that have ended since last time.
async function settle(userId) {
  const key = process.env.ELEVENLABS_API_KEY;
  const open = await db(`calls?user_id=eq.${userId}&verified=is.false&select=id,conversation_id,started_at,seconds&order=id.desc&limit=10`);
  await Promise.all((open || []).map(async c => {
    try {
      const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${c.conversation_id}`, { headers: { 'xi-api-key': key } });
      if (r.ok) {
        const j = await r.json();
        if (j.status === 'done' || j.status === 'failed') return db(`calls?id=eq.${c.id}`, { method: 'PATCH', body: { seconds: (j.metadata && j.metadata.call_duration_secs) || 0, verified: true } });
      }
      // never found after a day: keep what the app reported and stop asking
      if (Date.now() - new Date(c.started_at).getTime() > 864e5) return db(`calls?id=eq.${c.id}`, { method: 'PATCH', body: { verified: true } });
    } catch {}
  }));
}

export async function usageOf(user, profile) {
  await settle(user.id);
  const p = await planOf(profile);
  const from = p.since ? `&started_at=gte.${encodeURIComponent(p.since)}` : '';
  const rows = await db(`calls?user_id=eq.${user.id}${from}&select=seconds`);
  const used = (rows || []).reduce((a, c) => a + (c.seconds || 0), 0);
  const total = PLANS[p.plan].minutes * 60;
  return { ...p, usedSeconds: used, totalSeconds: total, leftSeconds: Math.max(0, total - used) };
}
