const CACHE_NAME = 'mafia-party-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/favicon.ico',
  '/favicon/favicon.ico',
  '/favicon/favicon-light-96x96.png',
  '/favicon/favicon-dark-96x96.png',
  '/favicon/favicon.svg',
  '/favicon/site.webmanifest',
  '/favicon/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Loop over each asset individually so one failing asset doesn't break everything
      return Promise.all(
        ASSETS.map((url) => {
          return cache.add(url).catch((err) => {
            console.error(`Failed to cache asset: ${url}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
