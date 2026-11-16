/* تطبيق الإدارة شغال بالنت دايمًا؛ الملف ده موجود عشان كروم يسمح بالتثبيت. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () {});
