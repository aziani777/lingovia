// Builds a learner's study plan.
//   { do: 'outline', ... }  -> the themes of the plan and the title of each lesson (a few seconds)
//   { do: 'lesson', ... }   -> one lesson in full: situation to play and key phrases, written when the learner opens it
// Titles and explanations are written in the learner's own language, phrases in the language they learn.
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

export const config = { maxDuration: 60 };
const FAST = process.env.LINGOVIA_FAST_MODEL || 'claude-haiku-5-5';
const LANG = { fr: 'French', en: 'English', de: 'German', es: 'Spanish', it: 'Italian', nl: 'Dutch' };
const LEVELS = ['A0', 'A1', 'A2', 'B1', 'B2'];
const clip = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

const Outline = z.object({ themes: z.array(z.object({ emoji: z.string(), title: z.string(), lessons: z.array(z.object({ title: z.string(), focus: z.string() })) })) });
const Lesson = z.object({ scenario: z.string(), intro: z.string(), phrases: z.array(z.object({ target: z.string(), native: z.string() })) });

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'no_key' });
  const b = (req.method === 'GET' ? req.query : req.body) || {}, native = LANG[b.native], target = LANG[b.target], level = LEVELS.includes(b.level) ? b.level : 'A0';
  if (!native || !target || native === target) return res.status(400).json({ error: 'bad_languages' });
  const who = `The learner speaks ${native} and is learning ${target}${b.variant === 'be' && b.target === 'nl' ? ' as spoken in Belgium (Flemish)' : ''}, current level ${level}.
Goal: ${clip(b.goal, 120) || 'everyday conversation'}. Skills they want: ${clip(b.skills, 300) || 'speaking'}. Interests: ${clip(b.interests, 300) || 'not given'}.
When you address the learner in ${native}, use the informal form ("tu" in French, "du" in German, "tú" in Spanish, "tu" in Italian, "je" in Dutch).`;
  const client = new Anthropic();
  const ask = async (system, user, schema, max) => {
    const r = await client.messages.create({ model: FAST, max_tokens: max, system, messages: [{ role: 'user', content: user }], output_config: { format: zodOutputFormat(schema) } });
    return schema.parse(JSON.parse(r.content.find(c => c.type === 'text')?.text || '{}'));
  };
  try {
    if (b.do === 'lesson') {
      const out = await ask(`You write one spoken lesson for a language learning app where the learner talks with a tutor on a call.
${who}
Fields:
- scenario: in English, two sentences telling the tutor which real-life scene to play with the learner and which role the tutor takes.
- intro: in ${native}, one short sentence telling the learner what they will be able to do after this lesson.
- phrases: exactly 4 useful ${target} phrases for this lesson, suited to level ${level}, each with its natural ${native} meaning. Short for A0 and A1, fuller sentences from A2.`,
        `Theme: ${clip(b.theme, 100)}\nLesson: ${clip(b.title, 120)}\nFocus: ${clip(b.focus, 200)}`, Lesson, 1200);
      out.phrases = out.phrases.slice(0, 5);
      return res.status(200).json(out);
    }
    const out = await ask(`You design a personal study plan for a language learning app where the learner talks with a tutor on a call.
${who}
Write 8 themes that take this learner through level ${level}, ordered from the most useful for their goal. Each theme is a real-life situation or topic (for example booking a hotel, at the café, a job interview, talking about your weekend), chosen for their goal and interests and feasible at level ${level}.
For A0, the first theme must be first words: greetings and introducing yourself.
Each theme has exactly 4 lessons that build on each other. Fields:
- emoji: one emoji for the theme.
- title: the theme, in ${native}, 2 to 4 words.
- lessons[].title: in ${native}, 3 to 6 words, concrete ("Commander un café", not "Leçon 1").
- lessons[].focus: in ${native}, one short phrase on what is practised.`,
      clip(b.avoid, 600) ? `Themes already done, do not repeat them: ${clip(b.avoid, 600)}` : 'Write the plan.', Outline, 3500);
    out.themes = out.themes.slice(0, 10).map(t => ({ ...t, lessons: t.lessons.slice(0, 5) }));
    if (!out.themes.length) return res.status(502).json({ error: 'empty_plan' });
    return res.status(200).json(out);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'rate_limited' });
    console.error('plan', e);
    return res.status(e.status || 500).json({ error: String(e.message || e).slice(0, 200) });
  }
}
