/* TavaOne // QSO Logger — Service Worker v9 */

const CACHE = 'tavaone-qso-v9';

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
   - Non-GET (POST/PUT/DELETE)          → always straight to network, never cached
   - QRZ / corsproxy / localhost bridge → always network
   - The app shell (page navigations)   → network-first, falling back to cache.
     Cache-first here meant an installed PWA kept serving the old index.html
     after a deploy until its cache happened to be evicted — a new version
     now lands on the next launch, and the cached copy still covers offline.
   - Everything else                    → cache-first with network fallback
*/
self.addEventListener('fetch', e => {
  // Never intercept/cache non-GET — pass straight through
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  const url = new URL(e.request.url);

  const alwaysNetwork = [
    'qrz.com', 'corsproxy.io', 'localhost', '127.0.0.1', '192.168.'
  ].some(h => url.hostname.includes(h) || url.hostname === h);

  /* version.json is how the page finds out it is stale — caching it would
     defeat the whole point, so it always goes to the network. */
  if (alwaysNetwork || url.pathname.endsWith('/version.json')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // App shell: network-first so a fresh deploy is picked up right away
  const isShell = url.origin === self.location.origin &&
    (e.request.mode === 'navigate' ||
     url.pathname.endsWith('/') ||
     url.pathname.endsWith('/index.html'));

  if (isShell) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', clone));
        }
        return res;
      }).catch(() => caches.match('./index.html').then(c => c || caches.match('./')))
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
