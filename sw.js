// عرضك أبوكبير — Service Worker
const CACHE = 'ardak-v2';
const OFFLINE_URL = '/';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll([OFFLINE_URL, '/index.html']);
    }).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // For navigation requests — try network first, fall back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone));
          return resp;
        })
        .catch(() => caches.match('/') || caches.match('/index.html'))
    );
    return;
  }
  // For CDN scripts — cache first
  if (event.request.url.includes('cdn.jsdelivr') || event.request.url.includes('supabase')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(resp => {
          caches.open(CACHE).then(c => c.put(event.request, resp.clone()));
          return resp;
        });
      })
    );
  }
});
