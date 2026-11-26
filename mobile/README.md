# Lingovia, applications Android et iOS

Deux enveloppes natives (Capacitor) autour de l'appli web. Elles ouvrent `https://www.lingovia.ai/app`,
donc toute mise à jour du site arrive dans les applis sans repasser par les magasins.

Identifiant de l'appli : `ai.lingovia.app`

## Préparer

    cd mobile
    npm install
    npx cap sync

## Android (Android Studio)

    npx cap open android

Puis Build > Generate Signed App Bundle, et envoyer le fichier `.aab` dans la Play Console.

## iOS (un Mac avec Xcode)

    npx cap open ios

Choisir l'équipe Apple dans Signing & Capabilities, puis Product > Archive et envoyer vers App Store Connect.

## À faire avant la publication

- Icône et écran de lancement (`npx @capacitor/assets generate` à partir de `icon-512.png`).
- Paiement : Apple et Google imposent leur propre système pour les abonnements vendus dans l'appli.
  Tant que ce n'est pas branché, l'écran des offres ne doit pas s'afficher dans les applis.
- Ces projets ont été générés sans pouvoir être compilés ici : la première compilation est à faire sur le Mac.
