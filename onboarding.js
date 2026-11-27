// Onboarding questionnaire content for Lingovia. Texts are in the learner's own language.
// One block per interface language. The `en` texts are what the tutor is told about the learner.
window.ONBOARDING = {
  fr: {
    goals: [
      { id: 'work', e: '💼', t: 'Travail et carrière', en: 'work and career' },
      { id: 'live', e: '🏡', t: 'Vivre à l\'étranger', en: 'living in a country where the language is spoken' },
      { id: 'travel', e: '✈️', t: 'Voyager', en: 'travel' },
      { id: 'family', e: '❤️', t: 'Famille, couple ou amis', en: 'family, partner or friends' },
      { id: 'study', e: '🎓', t: 'Études', en: 'studies' },
      { id: 'fun', e: '💪', t: 'Plaisir et défi personnel', en: 'pleasure and personal challenge' },
    ],
    // "Where will you use it?" depends on the goal
    places: {
      work: [['interview', '💬', 'Entretiens d\'embauche', 'job interviews'], ['meeting', '📝', 'Réunions', 'meetings'], ['present', '📊', 'Présentations', 'presentations'],
        ['coffee', '☕', 'Discussions entre collègues', 'small talk with colleagues'], ['phone', '📞', 'Téléphone et e-mails', 'phone calls and emails'], ['clients', '🤝', 'Clients et partenaires', 'clients and partners']],
      live: [['admin', '🏛️', 'Mairie et administration', 'town hall and paperwork'], ['shops', '🛒', 'Commerces et restaurants', 'shops and restaurants'], ['doctor', '🩺', 'Médecin et pharmacie', 'doctor and pharmacy'],
        ['school', '🏫', 'École des enfants', 'the children\'s school'], ['neighbours', '👋', 'Voisins et vie de quartier', 'neighbours and local life'], ['housing', '🔑', 'Logement', 'housing']],
      travel: [['hotel', '🏨', 'Hôtel et logement', 'hotels'], ['shops', '🍽️', 'Restaurants et cafés', 'restaurants and cafés'], ['transport', '🚆', 'Transports', 'public transport'],
        ['directions', '🗺️', 'Demander son chemin', 'asking for directions'], ['meet', '🙂', 'Rencontrer des gens', 'meeting people']],
      family: [['inlaws', '👨‍👩‍👧', 'Belle-famille', 'the in-laws'], ['friends', '🍻', 'Soirées entre amis', 'evenings with friends'], ['kids', '🧒', 'Parler avec les enfants', 'talking with children'],
        ['daily', '🏠', 'Vie de tous les jours', 'everyday life'], ['phone', '📱', 'Messages et appels', 'messages and calls']],
      study: [['class', '🎒', 'Suivre les cours', 'following classes'], ['exam', '📝', 'Examens oraux', 'oral exams'], ['students', '🧑‍🤝‍🧑', 'Discuter avec les étudiants', 'talking with other students'],
        ['admin', '🏛️', 'Inscription et administration', 'enrolment and paperwork'], ['housing', '🔑', 'Logement étudiant', 'student housing']],
      fun: [['daily', '🗣️', 'Conversation de tous les jours', 'everyday conversation'], ['culture', '🎬', 'Films, séries et musique', 'films, series and music'], ['travel', '✈️', 'Voyages', 'trips'],
        ['meet', '🙂', 'Rencontrer des gens du pays', 'meeting native speakers'], ['brain', '🧠', 'Faire travailler ma tête', 'keeping my brain busy']],
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
    // one line per level, A0 to B2
    levels: ['Je débute complètement', 'Je connais quelques mots et phrases simples', 'Je peux tenir une courte conversation sur un sujet familier', 'Je peux parler en détail des sujets du quotidien', 'Je peux parler couramment avec des natifs'],
    levelsEn: ['A0, complete beginner', 'A1, knows a few words and simple phrases', 'A2, can hold a short conversation on familiar topics', 'B1, can talk in detail about everyday topics', 'B2, can speak fluently with native speakers'],
  },
};
