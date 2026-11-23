// Lingovia tutors. To add one: append an entry here and drop its model in assets/avatars/.
// model  : rigged GLB with ARKit + Oculus viseme blend shapes (Ready Player Me, Avaturn, AvatarSDK, MPFB...)
// opts   : TalkingHead showAvatar options for that model (body form, default mood, skeleton fixes)
// voice  : ElevenLabs voice id, used for the live call and for phrase playback
// sample : what the tutor says in the audio preview
// thumb  : square face picture, used on the home screen and in the tutor picker
window.AVATARS = [
  {
    id: 'sanne', name: 'Sanne', gender: 'F', trait: 'Chaleureuse',
    bio: 'Patiente et encourageante. Elle prend le temps et te met à l\'aise.',
    personality: 'warm, patient and encouraging; you put the learner at ease and celebrate small wins',
    voice: 'OlBRrVAItyi00MuGMbna',
    sample: 'Hallo, ik ben Sanne! Moi, je prends le temps. On avance ensemble, tranquillement.',
    thumb: '/assets/avatars/sanne.jpg',
    model: '/assets/avatars/sanne.glb', mood: 'happy',
    opts: { body: 'F', avatarMood: 'happy',
      retarget: { Hips: { y: 0.03 }, Spine: { y: 0.02 }, Spine1: { y: 0.02, z: 0.01 }, Spine2: { y: 0.02, z: 0.01 }, Neck: { z: 0.02, y: 0.01 },
        Head: { z: 0.02 }, LeftShoulder: { rx: -0.5 }, RightShoulder: { rx: -0.5 }, scaleToHipsLevel: 1.0 },
      baseline: { headRotateX: -0.05, eyeBlinkLeft: 0.15, eyeBlinkRight: 0.15 } },
  },
  {
    id: 'emma', name: 'Emma', gender: 'F', trait: 'Dynamique',
    bio: 'Vive et drôle. Elle te fait parler vite et beaucoup.',
    personality: 'energetic, funny and fast-paced; you keep the learner talking and laughing',
    voice: 'OlBRrVAItyi00MuGMbna',
    sample: 'Hoi, ik ben Emma! Avec moi ça va vite, on parle, on rigole, et tu progresses.',
    thumb: '/assets/avatars/emma.jpg',
    model: '/assets/avatars/emma.glb', mood: 'happy',
    opts: { body: 'F', avatarMood: 'happy' },
  },
  {
    id: 'daan', name: 'Daan', gender: 'M', trait: 'Posé',
    bio: 'Calme et précis. Il explique clairement et va à l\'essentiel.',
    personality: 'calm, precise and reassuring; you explain clearly and go straight to the point',
    voice: 'OlBRrVAItyi00MuGMbna',
    sample: 'Hallo, ik ben Daan. Je t\'explique calmement, étape par étape.',
    thumb: '/assets/avatars/daan.jpg',
    model: '/assets/avatars/daan.glb', mood: 'neutral',
    opts: { body: 'M', avatarMood: 'neutral',
      retarget: { Neck: { z: -0.01, rx: -0.15 }, Neck1: { z: -0.01, rx: -0.15 }, Neck2: { z: -0.01, rx: -0.15 },
        LeftShoulder: { rz: -0.3 }, RightShoulder: { rz: 0.3 }, scaleToEyesLevel: 1.0, origin: { y: -0.1 } },
      baseline: { headRotateX: -0.04, eyeBlinkLeft: 0.05, eyeBlinkRight: 0.05 } },
  },
];
