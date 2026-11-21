# Lingovia

Apprendre une langue en parlant avec une prof animée. Programme de 90 jours, du niveau zéro à la conversation courante.
Premier cours: néerlandais depuis le français.

## Ce qu'il y a dedans

- `index.html` : l'app mobile (PWA installable), sans étape de build
- `curriculum.js` : le programme de 90 jours. Ajouter une langue = ajouter une clé `"<cible>-<natif>"`
- `api/tutor.js` : la prof (Claude), qui répond, traduit et corrige
- `assets/` : portrait et boucles vidéo de l'avatar

## Déployer sur Vercel

1. Importer ce dépôt dans Vercel (aucun réglage de build)
2. Ajouter la variable d'environnement `ANTHROPIC_API_KEY`
3. Optionnel: `LINGOVIA_MODEL` pour changer de modèle (défaut `claude-opus-5-5`)

Sans clé, l'app fonctionne en mode entraînement guidé (répéter puis traduire les phrases du jour).

## Voix

La voix et le micro utilisent le navigateur (Web Speech API). Chrome sur Android et Safari sur iPhone fournissent une voix néerlandaise.
