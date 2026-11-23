// Speaks one short phrase with the tutor's voice. Used for phrase cards and revisions.
const API = 'https://api.elevenlabs.io';
const VOICE = process.env.ELEVENLABS_VOICE_ID || 'OlBRrVAItyi00MuGMbna';
// Tutor voices this endpoint may speak with (see avatars.js). Anything else falls back to the default.
const VOICES = new Set(['OlBRrVAItyi00MuGMbna', '94W4cf0CMSgymY1uoRiX', 'F6nGuJbivpy6qJE45XFS', 'vzp1VWf0thhcmt2UXGOY', '4ClinlRko5CbUgYm5jsb',
  'g7B5PNoscIXomLNUmHAb', '9kBSa5emtWArU7U0792v', 'AUNrRkV0usLe4yD7tEOW']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return res.status(503).json({ error: 'no_key' });
  const text = String(req.body?.text ?? '').trim().slice(0, 400);
  if (!text) return res.status(400).json({ error: 'Empty text' });
  const speed = Math.min(1.2, Math.max(0.7, Number(req.body?.speed) || 1));
  try {
    const voice = VOICES.has(req.body?.voice) ? req.body.voice : VOICE;
    const r = await fetch(`${API}/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_flash_v2_5', voice_settings: { speed } }),
    });
    if (!r.ok) return res.status(r.status).json({ error: (await r.text()).slice(0, 300) });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
