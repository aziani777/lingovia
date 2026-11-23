// Onboarding questionnaire content for Lingovia. Texts are in the learner's own language.
// One block per language pair, so adding a pair means adding its lists here.
window.ONBOARDING = {
  'nl-fr': {
    goals: [
      { id: 'work', e: '💼', t: 'Travail et carrière', en: 'work and career' },
      { id: 'live', e: '🏡', t: 'Vivre en Belgique ou aux Pays-Bas', en: 'living in Belgium or the Netherlands' },
      { id: 'travel', e: '✈️', t: 'Voyager', en: 'travel' },
      { id: 'family', e: '❤️', t: 'Famille, couple ou amis', en: 'family, partner or friends' },
      { id: 'study', e: '🎓', t: 'Études', en: 'studies' },
      { id: 'fun', e: '💪', t: 'Plaisir et défi personnel', en: 'pleasure and personal challenge' },
    ],
    // "Where will you use it?" depends on the goal
    places: {
      work: [['interview', '💬', 'Entretiens d\'embauche', 'job interviews'], ['meeting', '📝', 'Réunions', 'meetings'], ['present', '📊', 'Présentations', 'presentations'],
        ['coffee', '☕', 'Discussions entre collègues', 'small talk with colleagues'], ['phone', '📞', 'Téléphone et e-mails', 'phone calls and emails'], ['clients', '🤝', 'Clients et partenaires', 'clients and partners']],
      live: [['admin', '🏛️', 'Commune et administration', 'town hall and paperwork'], ['shops', '🛒', 'Commerces et restaurants', 'shops and restaurants'], ['doctor', '🩺', 'Médecin et pharmacie', 'doctor and pharmacy'],
        ['school', '🏫', 'École des enfants', 'the children\'s school'], ['neighbours', '👋', 'Voisins et vie de quartier', 'neighbours and local life'], ['housing', '🔑', 'Logement', 'housing']],
      travel: [['hotel', '🏨', 'Hôtel et logement', 'hotels'], ['shops', '🍽️', 'Restaurants et cafés', 'restaurants and cafés'], ['transport', '🚆', 'Transports', 'public transport'],
        ['directions', '🗺️', 'Demander son chemin', 'asking for directions'], ['meet', '🙂', 'Rencontrer des gens', 'meeting people']],
      family: [['inlaws', '👨‍👩‍👧', 'Belle-famille', 'the in-laws'], ['friends', '🍻', 'Soirées entre amis', 'evenings with friends'], ['kids', '🧒', 'Parler avec les enfants', 'talking with children'],
        ['daily', '🏠', 'Vie de tous les jours', 'everyday life'], ['phone', '📱', 'Messages et appels', 'messages and calls']],
      study: [['class', '🎒', 'Suivre les cours', 'following classes'], ['exam', '📝', 'Examens oraux', 'oral exams'], ['students', '🧑‍🤝‍🧑', 'Discuter avec les étudiants', 'talking with other students'],
        ['admin', '🏛️', 'Inscription et administration', 'enrolment and paperwork'], ['housing', '🔑', 'Kot et logement', 'student housing']],
      fun: [['daily', '🗣️', 'Conversation de tous les jours', 'everyday conversation'], ['culture', '🎬', 'Films, séries et musique', 'films, series and music'], ['travel', '✈️', 'Voyages', 'trips'],
        ['meet', '🙂', 'Rencontrer des néerlandophones', 'meeting Dutch speakers'], ['brain', '🧠', 'Faire travailler ma tête', 'keeping my brain busy']],
    },
    variants: [
      { id: 'be', e: '🇧🇪', t: 'Belgique', s: 'Le flamand, comme on le parle en Flandre' },
      { id: 'nl', e: '🇳🇱', t: 'Pays-Bas', s: 'Le néerlandais des Pays-Bas' },
    ],
    statement: 'Je comprends un peu, mais je n\'ose pas parler.',
    skills: [['speak', '🗣️', 'Parler avec aisance', 'speaking fluently'], ['listen', '👂', 'Comprendre à l\'oral', 'listening comprehension'], ['vocab', '📖', 'Vocabulaire', 'vocabulary'],
      ['grammar', '📝', 'Faire des phrases correctes', 'building correct sentences'], ['pron', '👄', 'Prononciation', 'pronunciation']],
    interests: [['food', '🍳', 'Cuisine', 'cooking and food'], ['sport', '⚽', 'Sport', 'sport'], ['travel', '🌍', 'Voyages', 'travel'], ['music', '🎵', 'Musique', 'music'],
      ['film', '🎬', 'Films et séries', 'films and series'], ['family', '👨‍👩‍👧', 'Famille', 'family life'], ['tech', '💻', 'Technologie', 'technology'], ['nature', '🌿', 'Nature et jardin', 'nature and gardening'],
      ['culture', '🏛️', 'Histoire et culture', 'history and culture'], ['business', '📈', 'Économie et business', 'business'], ['books', '📚', 'Lecture', 'books'], ['news', '📰', 'Actualité', 'current affairs']],
    // vocabulary check, easy then harder
    words: {
      a: ['hallo', 'dank je', 'huis', 'water', 'brood', 'eten', 'drinken', 'vandaag', 'morgen', 'werk', 'vriend', 'klein', 'groot', 'goed', 'trein', 'fiets',
        'winkel', 'kinderen', 'koud', 'lekker', 'straat', 'betalen', 'vraag', 'boek'],
      b: ['afspraak', 'ervaring', 'vergadering', 'beslissen', 'omgeving', 'gezellig', 'toch', 'eigenlijk', 'voorstel', 'bereiken', 'gemeente', 'onderwijs',
        'vertraging', 'overleggen', 'verantwoordelijk', 'ontwikkeling', 'tevreden', 'toekomst', 'opmerking', 'vergelijken'],
    },
    levels: ['Débutant complet', 'Quelques mots', 'Phrases simples', 'Conversation de base', 'À l\'aise'],
    levelsEn: ['complete beginner (A0)', 'knows a few words (early A1)', 'simple sentences (A1 to A2)', 'basic conversation (A2 to B1)', 'comfortable (B1 or above)'],
    startDay: [1, 1, 16, 31, 61],          // where each level enters the 90 day program
  },
};
