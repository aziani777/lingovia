// Languages Lingovia can teach, and that a learner can have as their own language.
// self: the language's name in itself. en: its English name (used in the tutor's instructions).
// names: its name in each interface language. hello: how the tutor says hello. speech: code for the browser's speech tools.
window.LANGS = {
  fr: { code: 'fr', flag: '🇫🇷', self: 'Français', en: 'French', speech: 'fr-FR', hello: 'Bonjour',
    names: { fr: 'français', en: 'French', de: 'Französisch', es: 'francés', it: 'francese', nl: 'Frans' } },
  en: { code: 'en', flag: '🇬🇧', self: 'English', en: 'English', speech: 'en-GB', hello: 'Hello',
    names: { fr: 'anglais', en: 'English', de: 'Englisch', es: 'inglés', it: 'inglese', nl: 'Engels' } },
  de: { code: 'de', flag: '🇩🇪', self: 'Deutsch', en: 'German', speech: 'de-DE', hello: 'Hallo',
    names: { fr: 'allemand', en: 'German', de: 'Deutsch', es: 'alemán', it: 'tedesco', nl: 'Duits' } },
  es: { code: 'es', flag: '🇪🇸', self: 'Español', en: 'Spanish', speech: 'es-ES', hello: 'Hola',
    names: { fr: 'espagnol', en: 'Spanish', de: 'Spanisch', es: 'español', it: 'spagnolo', nl: 'Spaans' } },
  it: { code: 'it', flag: '🇮🇹', self: 'Italiano', en: 'Italian', speech: 'it-IT', hello: 'Ciao',
    names: { fr: 'italien', en: 'Italian', de: 'Italienisch', es: 'italiano', it: 'italiano', nl: 'Italiaans' } },
  nl: { code: 'nl', flag: '🇳🇱', self: 'Nederlands', en: 'Dutch', speech: 'nl-NL', hello: 'Hallo',
    names: { fr: 'néerlandais', en: 'Dutch', de: 'Niederländisch', es: 'neerlandés', it: 'olandese', nl: 'Nederlands' } },
};
// Levels a learner can start from, and work towards.
window.LEVELS = ['A0', 'A1', 'A2', 'B1', 'B2'];
