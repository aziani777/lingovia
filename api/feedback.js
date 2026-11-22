import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const MODEL = process.env.LINGOVIA_MODEL || 'claude-opus-5-5';
const FAST = process.env.LINGOVIA_FAST_MODEL || 'claude-haiku-5-5';

const Report = z.object({
  summary: z.string(),
  takeaways: z.array(z.string()),
  strengths: z.array(z.string()),
  corrections: z.array(z.object({ said: z.string(), correct: z.string(), why: z.string() })),
  phrases: z.array(z.object({ target: z.string(), native: z.string() })),
  next_tip: z.string(),
  score: z.number(),
});
const Translation = z.object({ translation: z.string() });
const clip = (s, n) => String(s ?? '').slice(0, n);

// One endpoint, two jobs: {translate: "..."} for tap-to-translate, {transcript: [...]} for the end of call report.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'no_key' });
  const b = req.body || {};
  const target = clip(b.targetName || 'néerlandais', 40), native = clip(b.nativeName || 'français', 40);
  const client = new Anthropic();
  try {
    if (b.translate) {
      const r = await client.messages.create({
        model: FAST, max_tokens: 1000,
        system: `Translate what a ${target} tutor said to a learner into natural ${native}. Parts already in ${native} stay as they are. Return only the translation.`,
        messages: [{ role: 'user', content: clip(b.translate, 800) }],
        output_config: { format: zodOutputFormat(Translation) },
      });
      const text = r.content.find(c => c.type === 'text')?.text;
      return res.status(200).json(Translation.parse(JSON.parse(text)));
    }
    const lines = (Array.isArray(b.transcript) ? b.transcript : []).slice(-80)
      .map(m => `${m.role === 'user' ? 'LEARNER' : 'TUTOR'}: ${clip(m.text, 500)}`).join('\n');
    if (!lines) return res.status(400).json({ error: 'Empty transcript' });
    const r = await client.beta.messages.create({
      model: MODEL, max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      system: `You review a spoken ${target} lesson for a ${native} speaker, day ${parseInt(b.day, 10) || 1} of a 90 day program (${clip(b.level, 20)}). Lesson: ${clip(b.title, 80)}.
The learner lines come from speech recognition and may contain transcription slips: only report mistakes that are clearly the learner's, and judge them against what a learner at this stage can know.
Write everything for the learner in ${native}, warm and specific, addressing them as "tu". Fields:
- summary: two sentences on how the call went.
- takeaways: exactly three short points to remember from this call (a phrase with its meaning, a rule, or a habit to keep), one sentence each.
- strengths: two or three concrete things they did well, quoting their own words when possible.
- corrections: the three most important real mistakes at most, each with what they said, the correct ${target}, and a one sentence reason. Empty if there were none.
- phrases: up to eight ${target} phrases from the call worth memorising, with their ${native} meaning.
- next_tip: one thing to focus on next time.
- score: 0 to 100 for how well they handled today's goal for their level.`,
      messages: [{ role: 'user', content: lines }],
      output_config: { effort: 'low', format: zodOutputFormat(Report) },
    });
    if (r.stop_reason === 'refusal') return res.status(422).json({ error: 'refused' });
    const text = r.content.find(c => c.type === 'text')?.text;
    const out = Report.safeParse(JSON.parse(text || '{}'));
    if (!out.success) return res.status(502).json({ error: 'bad_reply' });
    return res.status(200).json(out.data);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'rate_limited' });
    if (e instanceof Anthropic.APIConnectionError) return res.status(504).json({ error: 'upstream_unreachable' });
    if (e instanceof Anthropic.APIError) return res.status(e.status || 500).json({ error: e.message });
    return res.status(500).json({ error: e.message });
  }
}
