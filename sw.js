const CACHE_NAME = 'tabuada-turbo-v6';
const ASSETS_CORE = [
  '/index.html',
  '/css/style.css',
  '/js/config.js',
  '/js/api.js',
  '/js/game.js',
  '/js/ranking.js',
  '/js/app.js',
  '/js/socket.js',
  '/manifest.json'
];

// Instalar: cachear assets principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_CORE))
      .then(() => self.skipWaiting())
  );
});

// Ativar: limpar caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Nunca cachear API
  if (url.hostname.includes('onrender.com') || url.pathname.startsWith('/api')) return;
  if (event.request.method !== 'GET') return;

  // HTML: network-first (sempre busca versão mais nova)
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // JS/CSS: cache-first com atualização em background (stale-while-revalidate)
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        const network = fetch(event.request).then(response => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        });
        return cached || network;
      })
    )
  );
});
