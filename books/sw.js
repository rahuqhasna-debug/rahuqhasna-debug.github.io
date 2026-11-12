// سلاح التلميذ البحيرة — يخلّي البرنامج يفتح من غير نت
// إشعارات الموبايل (OneSignal) — لو النت مش موجود وقت التسطيب ما يوقفش البرنامج
// كل إشعار = إشعار مستقل بصوت واهتزاز (مايتحطش مكان اللي قبله بصمت) وبيفضل ظاهر لحد ما يتشال — لازم قبل OneSignal
try {
  const show0 = ServiceWorkerRegistration.prototype.showNotification;
  ServiceWorkerRegistration.prototype.showNotification = function (title, o) {
    o = Object.assign({}, o || {});
    o.tag = 'n-' + Date.now() + '-' + Math.floor(Math.random() * 1e6); o.renotify = true; o.silent = false;
    o.vibrate = [400, 150, 400, 150, 600]; o.requireInteraction = true;
    return show0.call(this, title, o);
  };
} catch (e) {}
try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'); } catch (e) {}
const CACHE = 'books-v26';
const FONTS = 'fonts-v1';   // خط Cairo من Google Fonts
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // كل ملف لوحده: لو ملف ناقص ما يوقفش الباقي
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // الخط: من المحفوظ الأول، ولو مش محفوظ يتجاب ويتحفظ. لو مفيش نت → خط الموبايل
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(e.request).then(hit => hit ||
      fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; })
        .catch(() => new Response('', {status: 504})))));
    return;
  }
  if (url.origin !== location.origin) return;
  // النت الأول (علشان التحديثات توصل)، ولو مفيش نت يفتح النسخة المحفوظة
  e.respondWith(
    fetch(e.request.url, {cache: 'no-store'})
      .then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
      .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html')))
  );
});
