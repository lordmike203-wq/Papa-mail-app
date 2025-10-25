// A simple service worker for offline caching of basic assets
const CACHE_NAME = 'private-mail-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache first, then network
        return response || fetch(event.request).then(fetchRes => {
          // Cache new requests
          return caches.open(CACHE_NAME).then(cache => {
            // Don't cache our API calls
            if (!event.request.url.includes('/.netlify/functions/')) {
              cache.put(event.request, fetchRes.clone());
            }
            return fetchRes;
          });
        });
      })
  );
});


