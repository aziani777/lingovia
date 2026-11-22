// Hands out a short-lived token for one realtime voice call with the tutor.
const API = 'https://api.elevenlabs.io';
const AGENT = process.env.ELEVENLABS_AGENT_ID || 'agent_8601m80jeex9ftjbzm5wceybjrje';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return res.status(503).json({ error: 'no_key' });
  try {
    const get = async path => {
      const r = await fetch(`${API}${path}?agent_id=${AGENT}`, { headers: { 'xi-api-key': key } });
      if (!r.ok) throw Object.assign(new Error(await r.text()), { status: r.status });
      return r.json();
    };
    const [t, s] = await Promise.allSettled([get('/v1/convai/conversation/token'), get('/v1/convai/conversation/get-signed-url')]);
    if (t.status !== 'fulfilled' && s.status !== 'fulfilled') {
      return res.status(t.reason?.status || 502).json({ error: String(t.reason?.message || 'upstream').slice(0, 300) });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ token: t.value?.token || null, signedUrl: s.value?.signed_url || null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
