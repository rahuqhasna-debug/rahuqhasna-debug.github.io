// طلابي — يخلّي البرنامج يفتح من غير نت
// اسم الكاش لازم يبدأ بـ shell- عشان برنامج الكتب (نفس الموقع) ما يمسحوش
const CACHE = 'shell-students-v3';
const FONTS = 'fonts-v1';
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap';
const FILES = ['./', './index.html', './app.css', './xlsx.js', './core.js', './ui.js', './screens1.js', './screens2.js',
  './screens3.js', './screens4.js', './app.js', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {})));
    // الخط يتحفظ من أول مرة عشان يشتغل من غير نت
    try {
      const fc = await caches.open(FONTS), r = await fetch(FONT_CSS);
      if (r.ok) {
        await fc.put(FONT_CSS, r.clone());
        const urls = [...(await r.text()).matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]);
        await Promise.all(urls.map(u => fetch(u).then(x => { if (x.ok) return fc.put(u, x); }).catch(() => {})));
      }
    } catch (err) {}
  })());
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // بيمسح النسخ القديمة بتاعته هو بس
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('shell-students-') && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(e.request.url).then(hit => hit ||
      fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request.url, r.clone()); return r; }).catch(() => new Response('', { status: 504 })))));
    return;
  }
  if (url.origin !== location.origin) return;
  // من المحفوظ على طول، وفي الخلفية يجيب الجديد من النت
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = (await c.match(e.request, { ignoreSearch: true })) || (e.request.mode === 'navigate' ? await c.match('./index.html') : null);
    const net = fetch(e.request).then(r => { if (r.ok && r.type === 'basic') c.put(e.request, r.clone()).catch(() => {}); return r; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => c.match('./index.html').then(r => r || new Response('', { status: 504 })));
  })());
});
