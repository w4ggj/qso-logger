/* W4GGJ QSO Logger — Service Worker v3 */
const CACHE = 'w4ggj-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap'
];

/* Install: pre-cache app shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

/* Activate: delete old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Fetch strategy:
   - QRZ / corsproxy / localhost bridge → always network
   - Everything else → cache-first with network fallback
*/
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  const alwaysNetwork = [
    'qrz.com', 'corsproxy.io', 'localhost', '127.0.0.1', '192.168.'
  ].some(h => url.hostname.includes(h) || url.hostname === h);

  if (alwaysNetwork) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
