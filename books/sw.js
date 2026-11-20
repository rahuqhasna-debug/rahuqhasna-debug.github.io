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
const CACHE = 'books-v71';
const FONTS = 'fonts-v1';   // خط Cairo من Google Fonts
const FRESH = new Map(), FRESH_MS = 10 * 60000, NET_WAIT = 2500;
const FILES = ['./', './index.html', './ret.js', './acc.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // كل ملف لوحده: لو ملف ناقص ما يوقفش الباقي
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONTS && !k.startsWith('shell-') && !k.startsWith('lessons-')).map(k => caches.delete(k)))));
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
  if (/\.(mp4|webm|apk)$/i.test(url.pathname)) return;   // الفيديو والتطبيق ماينفعش يعدّوا من الـ SW (طلبات Range)
  // 2026-11-19: البرنامج مايعلّقش لو النت بطيء أو الموبايل لسه صاحي من النوم:
  // • الملف اتحدّث من النت في آخر 10 دقايق ← يفتح من المحفوظ على طول (الرجوع من المراسلات بيبقى فوري)
  // • غير كده: النت الأول (علشان التحديثات توصل)، ولو ما ردّش في ثانيتين ونص يفتح المحفوظ ويتحدّث في الخلفية
  e.respondWith((async () => {
    const c = await caches.open(CACHE), key = url.pathname;
    const hit = await caches.match(e.request, {ignoreSearch: true});
    if (hit && Date.now() - (FRESH.get(key) || 0) < FRESH_MS) return hit;
    const net = fetch(e.request.url, {cache: 'no-store'}).then(r => {
      if (r.ok) { FRESH.set(key, Date.now()); const copy = r.clone(); c.put(e.request, copy).catch(() => {}); }
      return r;
    });
    if (!hit) return net.catch(() => caches.match('./index.html').then(r => r || new Response('', {status: 504})));
    e.waitUntil(net.catch(() => {}));
    return Promise.race([net.then(r => r.ok ? r : hit).catch(() => hit), new Promise(ok => setTimeout(() => ok(hit), NET_WAIT))]);
  })());
});
