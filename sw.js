// Reflejo service worker: the app shell and its data work offline once visited.
// Only active when the prototype is served over http(s); file:// can't register workers.
const CACHE = 'reflejo-v6';
const CORE = [
  './manifest.webmanifest', './icon.svg',
  './', './index.html', './data/app_data.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Cache first for the shell; map tiles and fonts are cached as they are seen, so the
// neighborhood a kid already looked at still has streets without data.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const keep = /arcgisonline\.com|fonts\.(googleapis|gstatic)\.com/.test(e.request.url);
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && keep) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => hit)));
});
