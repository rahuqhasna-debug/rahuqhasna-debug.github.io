/* طلابي — التشغيل */
'use strict';
function applyTheme() {
  const t = S.settings.theme, dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#0c0a1d' : '#6d28d9';
}
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (S) applyTheme(); }); } catch (e) {}
document.addEventListener('visibilitychange', () => { if (!document.hidden && S && !MODAL && ['msgs', 'home'].includes(cur().s)) refresh(); });
let errShown = 0;
addEventListener('error', e => { if (Date.now() - errShown > 4000) { errShown = Date.now(); try { toast('حصلت مشكلة صغيرة: ' + (e.message || '')); } catch (x) {} } });
(async () => {
  await loadDB(); applyTheme(); render();
  setTimeout(() => $('#splash').classList.add('hide'), 700);
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.onupdatefound = () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) toast('✨ نزل تحديث جديد — اقفل البرنامج وافتحه تاني'); }); };
    }).catch(() => {});
  }
})();
