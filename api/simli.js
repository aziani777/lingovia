// Hands out a short-lived Simli session token, so the tutor's face can be lip-synced live to their voice.
// The API key stays on the server. Without a key (or a valid face id) the app keeps using its own talking videos.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.SIMLI_API_KEY;
  if (!key) return res.status(503).json({ error: 'no_key' });
  const faceId = String((req.body && req.body.faceId) || '');
  if (!/^[0-9a-f-]{36}$/i.test(faceId)) return res.status(400).json({ error: 'bad_face' });
  try {
    const r = await fetch('https://api.simli.ai/compose/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-simli-api-key': key },
      // handleSilence false: the app streams the voice track continuously, silences included
      body: JSON.stringify({ faceId, handleSilence: false, maxSessionLength: 1800, maxIdleTime: 120 }),
    });
    if (!r.ok) return res.status(502).json({ error: (await r.text()).slice(0, 300) });
    const j = await r.json();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ token: j.session_token });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
