import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const MODEL = process.env.LINGOVIA_MODEL || 'claude-opus-5-5';

const Phrase = z.object({ target: z.string(), native: z.string() });

const Reply = z.object({
  segments: z.array(z.object({
    lang: z.enum(['target', 'native']),
    text: z.string(),
    translation: z.string(),
  })),
  correction: z.object({
    needed: z.boolean(),
    original: z.string(),
    corrected: z.string(),
    explanation: z.string(),
  }),
  suggestions: z.array(Phrase),
  new_phrases: z.array(Phrase),
  lesson_complete: z.boolean(),
});

const clip = (s, n) => String(s ?? '').slice(0, n);

// How much of the learner's own language the tutor uses, by day.
function mix(day) {
  if (day <= 15) return 'Explain and encourage in NATIVE. Every turn contains exactly one or two short TARGET sentences for the learner to hear and work with. Speak slowly, one idea at a time.';
  if (day <= 30) return 'About half NATIVE, half TARGET. Greet and ask in simple TARGET, explain grammar and corrections in NATIVE.';
  if (day <= 45) return 'Mostly TARGET with short sentences. Use NATIVE only for a quick grammar note or when the learner is stuck.';
  if (day <= 60) return 'TARGET only in what you say. NATIVE appears only in translations and in the correction explanation.';
  return 'TARGET only, at natural speed and with natural, idiomatic phrasing. NATIVE appears only in translations and in the correction explanation.';
}

function systemPrompt(c) {
  const phrases = c.phrases.map(p => `- ${p.target} = ${p.native}`).join('\n');
  return `You are ${c.tutor}, a warm, patient language tutor having a spoken conversation with one learner inside a mobile app. Your replies are read aloud by a voice, so write the way a person talks: short sentences, no lists, no markdown, no emoji.

TARGET language (the one being learned): ${c.targetName}.
NATIVE language (the learner's own): ${c.nativeName}.

The learner follows a 90 day program that goes from zero to conversational fluency. Today is day ${c.day} of 90, level ${c.level}.
Lesson: ${c.title}. Focus: ${c.focus}. Situation to play out: ${c.scenario}
Key phrases for today:
${phrases}

How you teach: through conversation, by making sentences and translating them every time. Each turn, give the learner something to say, either a NATIVE sentence to put into TARGET or a question in TARGET to answer, and build on what they said. Stay inside what a day ${c.day} learner can know, reusing earlier material and today's phrases. Play the situation as a real exchange once the phrases have been introduced.

Language balance for this stage: ${mix(c.day)}

The learner's messages come from speech recognition, so ignore punctuation, capitalisation and obvious transcription slips. If they answer in NATIVE or ask a question, help them and lead them back to saying it in TARGET.

Fill the response fields like this:
- segments: what you say, in speaking order. One segment per language switch. For a TARGET segment, translation is its NATIVE translation. For a NATIVE segment, translation is an empty string. Keep the whole turn to about four sentences.
- correction: if the learner's last TARGET sentence had a real mistake (wrong word, word order, conjugation, article), set needed to true, original to what they said, corrected to the right TARGET sentence, and explanation to one short sentence in NATIVE saying why. Otherwise needed is false and the other fields are empty strings. Praise correct answers briefly inside segments instead.
- suggestions: two or three things the learner could say next, each in TARGET with its NATIVE translation, matched to their level.
- new_phrases: TARGET phrases you introduced this turn that are worth memorising, with NATIVE translation. Empty when there is nothing new.
- lesson_complete: true once the learner has used today's key phrases and the situation has been played through, usually after eight to twelve learner turns. Say a short goodbye in that turn.

The first message of a lesson is the marker [START]. Greet the learner, say in one sentence what today is about, then give the first thing to say.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'no_key' });

  const b = req.body || {};
  const day = Math.min(90, Math.max(1, parseInt(b.day, 10) || 1));
  const ctx = {
    day,
    tutor: clip(b.tutor || 'Sanne', 30),
    targetName: clip(b.targetName, 40),
    nativeName: clip(b.nativeName, 40),
    level: clip(b.level, 20),
    title: clip(b.title, 80),
    focus: clip(b.focus, 120),
    scenario: clip(b.scenario, 200),
    phrases: (Array.isArray(b.phrases) ? b.phrases : []).slice(0, 8)
      .map(p => ({ target: clip(p?.target, 160), native: clip(p?.native, 160) })),
  };
  if (!ctx.targetName || !ctx.nativeName) return res.status(400).json({ error: 'Missing languages' });

  const messages = (Array.isArray(b.history) ? b.history : []).slice(-30)
    .filter(m => m && m.content)
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: clip(m.content, 1200) }));
  if (!messages.length || messages[0].role !== 'user') messages.unshift({ role: 'user', content: '[START]' });

  const client = new Anthropic();
  try {
    const r = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: systemPrompt(ctx),
      messages,
      output_config: { effort: 'low', format: zodOutputFormat(Reply) },
    });
    if (r.stop_reason === 'refusal') return res.status(422).json({ error: 'refused' });
    const text = r.content.find(c => c.type === 'text')?.text;
    if (!text) return res.status(502).json({ error: 'empty_reply' });
    const out = Reply.safeParse(JSON.parse(text));
    if (!out.success) return res.status(502).json({ error: 'bad_reply' });
    return res.status(200).json(out.data);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'rate_limited' });
    if (e instanceof Anthropic.APIConnectionError) return res.status(504).json({ error: 'upstream_unreachable' });
    if (e instanceof Anthropic.APIError) return res.status(e.status || 500).json({ error: e.message });
    return res.status(500).json({ error: e.message });
  }
}
