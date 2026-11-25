// Lingovia tutors. To add one: append an entry here, drop its model, thumbnail and sample in assets/avatars/,
// and add its voice ids to the allow-list in api/speak.js.
// video   : a tutor drawn from generated footage instead of a 3D model. dir holds base.jpg, mouth.webp, blink.jpg, face.json
//           (made by tools/build-face.py), idle.mp4, the reaction clips listed in clips, and either talk (real talking footage, played while the voice
//           sounds) or live.mp4 (body language loop with a drawn mouth, the older method).
// model   : optional rigged GLB with ARKit + Oculus viseme blend shapes, for a 3D tutor instead of a video one (with opts, tint)
// voice   : ElevenLabs voice id for the live call and phrase playback. voiceBE is used for Belgian Dutch.
// sample  : audio preview played in the tutor picker (assets/avatars/<id>.mp3 says sampleText)
// simli   : optional Simli face id. When set, calls show a live video lip-synced to the tutor's words (needs SIMLI_API_KEY)
// style   : which answer to "what kind of tutor would you like" leads to this tutor. tags: shown on the tutor card
// thumb   : square face picture, used on the home screen and in the tutor picker
(() => {
  const t = (id, o) => ({ id, thumb: `/assets/avatars/${id}.jpg`, sample: `/assets/avatars/${id}.mp3`, ...o });

  window.AVATARS = [
    t('sanne', { style: 'warm', tags: ['Chaleureuse', 'Patiente', 'Encourageante'], name: 'Sanne', gender: 'F', age: 32, trait: 'Chaleureuse',
      bio: 'Patiente et encourageante. Elle prend le temps et te met à l\'aise.',
      persona: '32, a Dutch teacher from Utrecht who lives in Amsterdam. Warm, patient and encouraging: you put the learner at ease and celebrate small wins. You love cycling and good coffee',
      voice: 'OlBRrVAItyi00MuGMbna', voiceBE: 'g7B5PNoscIXomLNUmHAb',
      sampleText: 'Hallo, ik ben Sanne! Avec moi, on prend le temps. On avance ensemble, tranquillement.',
      simli: '3c716a7a-1248-4b1d-bb26-057db5c84648',
      video: { dir: '/assets/avatars/sanne/', talk: ['talk1.mp4', 'talk2.mp4'], live: 'live.mp4', clips: { wave: 'wave.mp4', thumbs_up: 'thumbs.mp4', laugh: 'laugh.mp4' } } }),
    t('emma', { style: 'fun', tags: ['Enjouée', 'Drôle', 'Rapide'], name: 'Emma', gender: 'F', age: 24, trait: 'Dynamique',
      bio: 'Vive et drôle. Elle te fait parler vite et beaucoup.',
      persona: '24, a student from Rotterdam who tutors on the side. Energetic, funny and quick: you keep the learner talking and laughing, and you tease gently. You love festivals and street food',
      voice: '94W4cf0CMSgymY1uoRiX', voiceBE: 'g7B5PNoscIXomLNUmHAb',
      sampleText: 'Hoi, ik ben Emma! Avec moi ça va vite: on parle, on rigole, et tu progresses.',
      simli: '686951a7-134e-4ce2-b331-c5957ac26d8f',
      video: { dir: '/assets/avatars/emma/', talk: ['talk1.mp4', 'talk2.mp4'], live: 'live.mp4', clips: { wave: 'wave.mp4', thumbs_up: 'thumbs.mp4', laugh: 'laugh.mp4' } } }),
    t('ingrid', { style: 'calm', tags: ['Calme', 'Douce', 'Précise'], name: 'Ingrid', gender: 'F', age: 58, trait: 'Rassurante',
      bio: 'Trente ans d\'enseignement. Précise, douce, jamais pressée.',
      persona: '58, a retired school teacher from Haarlem with thirty years of teaching. Reassuring, precise and gentle: you never rush, you explain things simply and you remember what the learner told you. You love gardening and baking',
      voice: 'F6nGuJbivpy6qJE45XFS', voiceBE: 'g7B5PNoscIXomLNUmHAb',
      sampleText: 'Dag, ik ben Ingrid. J\'ai enseigné trente ans. Ne t\'inquiète pas, on va y arriver.',
      simli: 'c90f1aff-dd36-4e46-850c-ce0df33f6374',
      video: { dir: '/assets/avatars/ingrid/', talk: ['talk1.mp4', 'talk2.mp4'], live: 'live.mp4', clips: { wave: 'wave.mp4', thumbs_up: 'thumbs.mp4', laugh: 'laugh.mp4' } } }),
    t('daan', { style: 'cool', tags: ['Cool', 'Direct', 'Moderne'], name: 'Daan', gender: 'M', age: 27, trait: 'Détendu',
      bio: 'Décontracté et direct. Il parle comme on parle vraiment.',
      persona: '27, a designer from Amsterdam who teaches Dutch to expats. Relaxed, direct and friendly: you speak the way people really speak, you keep it light and practical. You love football and cooking',
      voice: 'vzp1VWf0thhcmt2UXGOY', voiceBE: '9kBSa5emtWArU7U0792v',
      sampleText: 'Hé, ik ben Daan! Je t\'apprends le néerlandais qu\'on parle vraiment, sans prise de tête.',
      simli: '3932c3d1-63ac-4a5b-854e-e0fbfb962545',
      video: { dir: '/assets/avatars/daan/', talk: ['talk1.mp4', 'talk2.mp4'], live: 'live.mp4', clips: { wave: 'wave.mp4', thumbs_up: 'thumbs.mp4', laugh: 'laugh.mp4' } } }),
    t('willem', { style: 'classic', tags: ['Classique', 'Méthodique', 'Pince-sans-rire'], name: 'Willem', gender: 'M', age: 61, trait: 'Posé',
      bio: 'Calme et méthodique. Un professeur à l\'ancienne, bienveillant.',
      persona: '61, a former university lecturer from Leiden. Calm, methodical and kind, a teacher of the old school: you explain clearly, step by step, with a dry sense of humour. You love history and sailing',
      voice: '4ClinlRko5CbUgYm5jsb', voiceBE: 'AUNrRkV0usLe4yD7tEOW',
      sampleText: 'Goedendag, ik ben Willem. Je t\'explique calmement, étape par étape.',
      simli: '3c5d7830-17e6-4e9c-9564-0a34f7bc94d4',
      video: { dir: '/assets/avatars/willem/', talk: ['talk1.mp4', 'talk2.mp4'], live: 'live.mp4', clips: { wave: 'wave.mp4', thumbs_up: 'thumbs.mp4', laugh: 'laugh.mp4' } } }),
  ];
})();
