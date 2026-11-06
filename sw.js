const cacheName = 'little-steps-v19';
const audioIds = ['coffee', 'hello', 'breakfast', 'directions', 'weekend', 'again'];
const bookAssets = ['./book-reader.js', './book.css', './chapter-one.js', './story-stage.js', './theatre.css', './pic/back.png', './pic/boy.png', './pic/huakuang.png'];
const audioAssets = audioIds.flatMap((id) => [`./audio/${id}.wav`, ...[0, 1, 2].map((index) => `./audio/${id}-chunk-${index}.wav`)]);
const assets = ['./', './index.html', './styles.css', './app.js', './picturebook.js', './book-art.js', './audio.js', './audio_edge.js', './lessons.js', './icons.js', './state.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', ...audioAssets];
self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll([...assets, ...bookAssets])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('little-steps-') && key !== cacheName).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(cacheName).then(async (cache) => {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch { if (event.request.mode === 'navigate') return cache.match('./index.html'); return Response.error(); }
  }));
});
