const CACHE_NAME = 'tabuada-turbo-v3';
const ASSETS = [
  '/frontend/',
  '/frontend/index.html',
  '/frontend/css/style.css',
  '/frontend/js/config.js',
  '/frontend/js/api.js',
  '/frontend/js/auth.js',
  '/frontend/js/game.js',
  '/frontend/js/ranking.js',
  '/frontend/js/app.js',
  '/frontend/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear chamadas à API
  if (url.hostname.includes('onrender.com')) return;
  if (event.request.method !== 'GET') return;

  // HTML: sempre buscar do servidor primeiro
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/frontend/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/frontend/index.html'))
    );
    return;
  }

  // Demais assets: cache primeiro, rede como fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || networked;
    })
  );
});
