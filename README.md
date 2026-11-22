# Lingovia

Apprendre une langue en parlant avec une prof animée. Programme de 90 jours, du niveau zéro à la conversation courante.
Premier cours: néerlandais depuis le français.

## Ce qu'il y a dedans

- `index.html` : l'app mobile (PWA installable), sans étape de build
- `curriculum.js` : le programme de 90 jours. Ajouter une langue = ajouter une clé `"<cible>-<natif>"`
- `api/session.js`, `api/speak.js` : appel vocal et voix (ElevenLabs)
- `api/feedback.js` : bilan de fin d'appel et traduction (Claude)
- `api/tutor.js` : mode texte de secours (Claude)
- `elevenlabs/` : configuration de l'agent vocal
- `vendor/elevenlabs-client.js` : SDK navigateur ElevenLabs 1.37.1
- `vendor/headaudio/` : HeadAudio 1.1.0 (MIT), détection des sons pour la synchro des lèvres
- `tools/build-face.py` : extrait les positions de bouche et de clignement depuis les vidéos de l'avatar
- `assets/` : portrait et boucles vidéo de l'avatar

## Déployer sur Vercel

1. Importer ce dépôt dans Vercel (aucun réglage de build)
2. Ajouter les variables d'environnement:
   - `ELEVENLABS_API_KEY` : l'appel vocal en temps réel et la voix de la prof
   - `ANTHROPIC_API_KEY` : le bilan de fin d'appel, la traduction au toucher et le mode texte
3. Optionnel: `ELEVENLABS_AGENT_ID`, `ELEVENLABS_VOICE_ID`, `LINGOVIA_MODEL`, `LINGOVIA_FAST_MODEL`

## Comment ça marche

- L'appel est une conversation vocale en direct avec un agent ElevenLabs (`api/session.js` délivre un jeton par appel). On peut couper la parole à la prof, le micro reste ouvert.
- La personnalité et la méthode de la prof sont dans `elevenlabs/prompt.md`. Après modification: `ELEVENLABS_API_KEY=... python3 elevenlabs/setup.py <agent_id>`.
- La leçon du jour est transmise à l'agent sous forme de variables au début de chaque appel.
- Sans clé ElevenLabs, l'app bascule en mode texte. Sans aucune clé, en mode entraînement guidé.
