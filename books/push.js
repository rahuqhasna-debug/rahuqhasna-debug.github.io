// إشعارات الموبايل (OneSignal Web Push) — بتشتغل لما ONESIGNAL_APP_ID يتحط في config.js.
// كل مدرس = external_id «t-<id>»، كل مندوب/مالك = «s-<staff id>». الإرسال عن طريق Apps Script (kind:'push') عشان المفتاح السري مايبانش.
// مهم: الـ login بيحصل على طول مع كل فتح (حتى قبل الموافقة)، عشان لو المدرس وافق من نافذة OneSignal نفسها يتربط برضه.
(function () {
  const C = window.SILAH_CONFIG || {};
  if (!C.ONESIGNAL_APP_ID) return;
  const CLOUD = C.CLOUD_URL;
  const BASE = location.href.split('#')[0].replace(/[^/]*$/, '');
  // جوه تطبيق الأندرويد الحقيقي (بند 48): الإشعارات من التطبيق نفسه (OneSignal Android) — مش من المتصفح
  if (window.SilahApp) {
    const A = window.SilahApp;
    const nlink = () => { if (!window.TP) return; try { A.login('t-' + TP.id); const subs = TP.subs || [], tg = { tch: '1', app: '1' }; ['ar', 'math', 'en', 'sci', 'stu'].forEach(s => tg['s_' + s] = subs.indexOf(s) >= 0 ? '1' : '0'); A.tags(JSON.stringify(tg)); } catch (e) { } };
    const nsend = (to, title, body, url) => CLOUD ? fetch(CLOUD, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ k: 'push', to, title, body, url, ring: false }) }).catch(() => { }) : Promise.resolve();
    window.pushInit = async () => { nlink(); try { A.askPush(); } catch (e) { } };
    window.pushReady = nlink;
    window.pushNotifyRep = text => window.TP && TP.rep ? nsend(['s-' + TP.rep], 'سلاح التلميذ', text, BASE + 'admin.html#/bell') : Promise.resolve();
    if (window.TP) nlink();
    return;
  }
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  const s = document.createElement('script'); s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'; s.defer = true; document.head.appendChild(s);
  const scope = new URL(BASE).pathname;   // /books/
  let who = null;
  const ready = new Promise(res => OneSignalDeferred.push(async OS => {
    try { await OS.init({ appId: C.ONESIGNAL_APP_ID, serviceWorkerPath: scope.slice(1) + 'sw.js', serviceWorkerParam: { scope }, notifyButton: { enable: false } }); } catch (e) { }
    try { OS.Notifications.addEventListener('permissionChange', g => { if (g && who) OS.login(who).catch(() => { }); }); } catch (e) { }
    res(OS);
  }));
  async function link(ext, ask) {
    who = ext;
    const OS = await ready;
    try { await OS.login(ext); } catch (e) { }
    try { if (ask && !OS.Notifications.permission) await OS.Notifications.requestPermission(); } catch (e) { }
    try { if (OS.Notifications.permission && OS.User && OS.User.PushSubscription && !OS.User.PushSubscription.optedIn) await OS.User.PushSubscription.optIn(); } catch (e) { }
    // 🆕 اعرف الجديد: علامة لكل مادة بيدرّسها المدرس (s_ar = 1) عشان إشعار الجديد يروح لمدرسين المادة بس
    try {
      if (ext.indexOf('t-') === 0 && window.TP) {
        const subs = TP.subs || [], tg = { tch: '1' }; ['ar', 'math', 'en', 'sci', 'stu'].forEach(s => tg['s_' + s] = subs.indexOf(s) >= 0 ? '1' : '0');
        const k = JSON.stringify(tg); if (localStorage.getItem('selah-os-tags') !== k) { await OS.User.addTags(tg); localStorage.setItem('selah-os-tags', k); }
      }
    } catch (e) { }
  }
  function send(to, title, body, url, ring) {
    if (!CLOUD) return Promise.resolve();
    return fetch(CLOUD, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ k: 'push', to, title, body, url, ring: !!ring }) }).catch(() => { });
  }

  // المدرس (teacher.html بيحط window.TP بعد التحميل)
  window.pushInit = async () => { if (window.TP) await link('t-' + TP.id, true); };
  window.pushReady = () => { if (window.TP) link('t-' + TP.id, false); };
  window.pushNotifyRep = text => window.TP && TP.rep ? send(['s-' + TP.rep], 'سلاح التلميذ', text, BASE + 'admin.html#/bell', false) : Promise.resolve();

  // المندوب / المالك (admin.html)
  window.pushInitStaff = async me => link('s-' + me.id, true);
  window.pushToTeacher = (t, text, ring) => send(['t-' + t.id], ring ? '🔔 سلاح التلميذ' : 'سلاح التلميذ', text, BASE + 'teacher.html#v=msgs', ring);
  window.pushToStaff = (ids, text, path) => send(ids.map(id => 's-' + id), 'سلاح التلميذ', text, BASE + (path || 'admin.html#/bell'), false);
  window.pushRingTeachers = async (ids, text, path) => { for (let i = 0; i < ids.length; i += 50) await send(ids.slice(i, i + 50).map(id => 't-' + id), '🔔', text, BASE + (path || (/حدّث|تحديث/.test(text) ? 'teacher.html#v=me' : 'teacher.html')), true); };
  window.pushToTeachers = async (ids, text) => { for (let i = 0; i < ids.length; i += 50) await send(ids.slice(i, i + 50).map(id => 't-' + id), 'سلاح التلميذ', text, BASE + 'teacher.html#v=me', false); };
  if (window.TP) window.pushReady();
})();
