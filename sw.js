// سلاح التلميذ البحيرة — يخلّي البرنامج يفتح من غير نت
const CACHE = 'books-v3';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // كل ملف لوحده: لو ملف ناقص ما يوقفش الباقي
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// النت الأول (علشان التحديثات توصل)، ولو مفيش نت يفتح النسخة المحفوظة
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.url, {cache: 'no-store'})
      .then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
      .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html')))
  );
});
