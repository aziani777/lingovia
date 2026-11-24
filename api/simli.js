// Hands out a short-lived Simli session token, so the tutor's face can be lip-synced live to their voice.
// The API key stays on the server. Without a key (or a valid face id) the app keeps using its own talking videos.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.SIMLI_API_KEY;
  if (!key) return res.status(503).json({ error: 'no_key' });
  const faceId = String((req.body && req.body.faceId) || '');
  if (!/^[0-9a-f-]{36}$/i.test(faceId)) return res.status(400).json({ error: 'bad_face' });
  try {
    // handleSilence false: the app streams the voice track continuously, silences included
    const base = { faceId, handleSilence: false, maxSessionLength: 1800, maxIdleTime: 120 };
    const ask = body => fetch('https://api.simli.ai/compose/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-simli-api-key': key }, body: JSON.stringify(body) });
    // Trinity-2 faces can stream a portrait frame that fills the phone screen; if that size is refused, take the default one
    let r = await ask({ ...base, streaming_width: 576, streaming_height: 1024 });
    if (r.status === 422 || r.status === 400) r = await ask(base);
    if (!r.ok) { const why = (await r.text()).slice(0, 300); console.warn('simli token refused', r.status, why); return res.status(502).json({ error: why }); }
    console.log('simli token ok', faceId);
    const j = await r.json();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ token: j.session_token });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
