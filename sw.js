const CACHE = 'lingovia-v28';
const SHELL = ['/app', '/curriculum.js', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png',
  '/assets/avatar.jpg', '/assets/idle.mp4', '/assets/base.jpg', '/assets/mouth.jpg', '/assets/blink.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API calls and video range requests go straight to the network
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || e.request.headers.has('range')) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok && r.status === 200) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('/app')))
  );
});
