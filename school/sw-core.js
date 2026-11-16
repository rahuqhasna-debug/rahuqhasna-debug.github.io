/* Service worker مشترك — كل صف بيستدعيه من sw.js بتاعه بـ importScripts('../sw-core.js') */
var SCOPE = self.registration.scope;                       // .../school/g4/
var GRADE = SCOPE.replace(/\/$/, '').split('/').pop();     // g4
var SHELL = 'shell-' + GRADE + '-v1';
var LESSONS = 'lessons-' + GRADE;
var FILES = ['./', 'manifest.json', 'icon-192.png', 'icon-512.png', 'qa.json', '../app.js', '../app.css'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) {
    return Promise.all(FILES.map(function (f) {
      var u = new URL(f, SCOPE).href;
      return fetch(u, { cache: 'no-store' }).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (/devices\.json$/.test(url.pathname)) return; // قائمة الأرقام السرية: من النت دايمًا، مش من المحفوظ

  // طلب التحديث (?v=...) لازم يروح للنت، مش للنسخة المحفوظة (وإلا الدرس المتعدّل مايتحدّثش أبدًا)
  if (url.searchParams.has('v')) return;

  // الدروس: من المحفوظ على الموبايل أولًا (بدون نت)
  if (url.href.indexOf(SCOPE + 'lessons/') === 0) {
    e.respondWith(caches.open(LESSONS).then(function (c) {
      return c.match(url.origin + url.pathname).then(function (r) { return r || fetch(req); });
    }));
    return;
  }

  // ملفات التطبيق: من النت لو موجود (عشان التحديثات)، وإلا من المحفوظ
  e.respondWith(fetch(req).then(function (r) {
    if (r.ok) { var copy = r.clone(); caches.open(SHELL).then(function (c) { c.put(url.origin + url.pathname, copy); }); }
    return r;
  }).catch(function () {
    return caches.open(SHELL).then(function (c) {
      return c.match(url.origin + url.pathname).then(function (r) {
        return r || (req.mode === 'navigate' ? c.match(SCOPE) : undefined) || Response.error();
      });
    });
  }));
});
