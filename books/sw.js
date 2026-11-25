// سلاح التلميذ البحيرة — يخلّي البرنامج يفتح من غير نت
// إشعارات الموبايل (OneSignal) — لو النت مش موجود وقت التسطيب ما يوقفش البرنامج
// كل إشعار = إشعار مستقل بصوت واهتزاز (مايتحطش مكان اللي قبله بصمت) وبيفضل ظاهر لحد ما يتشال — لازم قبل OneSignal
// 2026-11-25: 🔕 لو شريف كاتم الصوت (دوسة طويلة على الجرس) ← الإشعار بيوصل من غير صوت ولا هزّة (selah-prefs في IndexedDB)
const swMuted = () => new Promise(ok => { try {
  const r = indexedDB.open('selah-prefs', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => { try { const q = r.result.transaction('kv').objectStore('kv').get('mute'); q.onsuccess = () => { ok(q.result === 1); r.result.close(); }; q.onerror = () => ok(false); } catch (e) { ok(false); } };
  r.onerror = () => ok(false);
} catch (e) { ok(false); } });
try {
  const show0 = ServiceWorkerRegistration.prototype.showNotification;
  ServiceWorkerRegistration.prototype.showNotification = function (title, o) {
    o = Object.assign({}, o || {});
    o.tag = 'n-' + Date.now() + '-' + Math.floor(Math.random() * 1e6); o.renotify = true; o.requireInteraction = true;
    const reg = this;
    return swMuted().then(m => {
      if (m) { o.silent = true; delete o.vibrate; } else { o.silent = false; o.vibrate = [400, 150, 400, 150, 600]; }
      return show0.call(reg, title, o);
    });
  };
} catch (e) {}
try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'); } catch (e) {}
const CACHE = 'books-v95';
const FONTS = 'fonts-v1';   // خط Cairo من Google Fonts
const FRESH = new Map(), FRESH_MS = 10 * 60000;
const FILES = ['./', './index.html', './ret.js', './acc.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // كل ملف لوحده: لو ملف ناقص ما يوقفش الباقي
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => {
    const old = keys.filter(k => k !== CACHE && k !== FONTS && !k.startsWith('shell-') && !k.startsWith('lessons-'));
    if (old.some(k => k.startsWith('books-'))) notifyUpd();   // نسخة جديدة اترفعت ← «⬆️ فيه تحديث»
    return Promise.all(old.map(k => caches.delete(k)));
  }));
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
  // ⚡ 2026-11-25 (شريف: «عايزه ياخد الأمر على طول»): الصفحة بتفتح من المحفوظ على طول — من غير ما تستنى النت خالص
  // (قبل كده كان بيستنى النت لحد ثانيتين ونص كل مرة البرنامج يتفتح أو ترجع من المراسلات).
  // النسخة الجديدة بتتجاب في الخلفية (مرة كل 10 دقايق بالكتير)، ولو الملف اتغيّر ← الصفحة بيوصلها «upd» وبتعرض «⬆️ فيه تحديث».
  e.respondWith((async () => {
    const c = await caches.open(CACHE), key = url.pathname;
    const hit = await caches.match(e.request, {ignoreSearch: true});
    const stamp = r => r && (r.headers.get('etag') || r.headers.get('last-modified')) || '';
    const refresh = () => fetch(e.request.url, {cache: 'no-store'}).then(async r => {
      if (r.ok) {
        FRESH.set(key, Date.now());
        const was = stamp(hit), now = stamp(r);
        await c.put(e.request, r.clone()).catch(() => {});
        if (hit && was && now && was !== now && /(\.html|\.js|\.css|\/)$/.test(key)) notifyUpd();
      }
      return r;
    });
    if (!hit) return refresh().catch(() => caches.match('./index.html').then(r => r || new Response('', {status: 504})));
    if (Date.now() - (FRESH.get(key) || 0) >= FRESH_MS) e.waitUntil(refresh().catch(() => {}));
    return hit;
  })());
});
let updT = 0;
function notifyUpd() {   // مرة واحدة حتى لو كذا ملف اتغيّر
  clearTimeout(updT);
  updT = setTimeout(() => self.clients.matchAll({type: 'window'}).then(cs => cs.forEach(w => w.postMessage({t: 'upd'}))).catch(() => {}), 1500);
}
