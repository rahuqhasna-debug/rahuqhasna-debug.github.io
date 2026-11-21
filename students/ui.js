/* طلابي — أدوات الواجهة + الصفحة الرئيسية */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const ICONS = {
  check: '<rect x="8" y="2.5" width="8" height="4" rx="1.2"/><path d="M16 4.5h2a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h2"/><path d="m8.5 14 2.5 2.5 4.5-5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  cap: '<path d="M22 9.5 12 4.5 2 9.5l10 5 10-5z"/><path d="M6 11.5v5c3.5 3 8.5 3 12 0v-5"/><path d="M22 9.5v6"/>',
  wallet: '<path d="M19 7V4.5a1.5 1.5 0 0 0-1.5-1.5H5a2 2 0 0 0 0 4h14.5A1.5 1.5 0 0 1 21 8.5V12"/><path d="M3 5v14a2 2 0 0 0 2 2h14.5a1.5 1.5 0 0 0 1.5-1.5V16"/><path d="M21 12h-4a2 2 0 0 0 0 4h4z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 16v-4M11.5 16V8M16 16v-6M20.5 16V5"/>',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2.5"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  exam: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h3M8 17h5"/><path d="m14.5 15.5 1.5 1.5 3-3"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  import: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-7M9 15l3 3 3-3"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  back: '<path d="m9 18 6-6-6-6"/>', next: '<path d="m15 18-6-6 6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>', phone: '<path d="M22 16.9v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>', share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>', star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z"/>',
  sms: '<rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-10 6L2 7"/>'
};
const ic = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;
const LOGO = `<svg viewBox="0 0 64 64" width="100%" height="100%"><rect x="14" y="10" width="36" height="46" rx="7" fill="#fff"/><rect x="24" y="6" width="16" height="9" rx="3" fill="#fde68a"/><path d="M22 34l7 7 13-15" fill="none" stroke="#a21caf" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="48" cy="14" r="6" fill="#fbbf24"/></svg>`;
const SCREENS = {}, ACT = {};
let NAV = [{ s: 'home', p: {} }], MODAL = false, MOUNT = null, AFTER = null;
const cur = () => NAV[NAV.length - 1];

/* ---------- التنقل وزرار الرجوع بتاع الموبايل ---------- */
function go(s, p = {}) { NAV.push({ s, p }); history.pushState({ n: NAV.length }, ''); render('fwd'); }
function render(dir) {
  const v = $('#view'), { s, p } = cur(); MOUNT = null;
  v.innerHTML = (SCREENS[s] || SCREENS.home)(p);
  v.className = ''; if (dir) { void v.offsetWidth; v.className = 'enter-' + dir; scrollTo(0, 0); }
  if (MOUNT) MOUNT();
}
function refresh() { const y = scrollY; render(); scrollTo(0, y); }
const back = () => history.back();
addEventListener('popstate', () => {
  if (MODAL) { closeSheet(true); return; }
  if (NAV.length > 1) { NAV.pop(); render('back'); }
});
document.addEventListener('click', e => {
  if (e.target.closest('input,select,textarea,label')) return;
  const a = e.target.closest('[data-act],[data-go]'); if (!a) return;
  const p = Object.assign({}, a.dataset); delete p.act; delete p.go;
  tap();
  if (a.dataset.go) { const go2 = () => go(a.dataset.go, p); MODAL ? closeSheet(false, go2) : go2(); return; }
  const f = ACT[a.dataset.act]; if (f) f(a, e, p);
});
const tap = () => { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} };

/* ---------- اللوحة السفلية والرسايل ---------- */
function openSheet(html, onMount) {
  const sh = $('#sheet'); $('#sheetBody').innerHTML = html; sh.hidden = false; sh.classList.remove('out');
  if (!MODAL) { MODAL = true; history.pushState({ m: 1 }, ''); }
  if (onMount) onMount($('#sheetBody'));
}
function closeSheet(fromPop, then) {
  if (!MODAL) { if (then) then(); return; }
  if (!fromPop) { AFTER = then || null; history.back(); return; }
  MODAL = false; const sh = $('#sheet'); sh.classList.add('out');
  setTimeout(() => { if (!MODAL) { sh.hidden = true; sh.classList.remove('out'); $('#sheetBody').innerHTML = ''; } }, 220);
  const f = AFTER; AFTER = null; if (f) f();
}
ACT.closeSheet = () => closeSheet();
ACT.back = () => back();
function ask(title, msg, okText, fn, danger) {
  openSheet(`<h3>${title}</h3><p class="muted" style="margin-top:0">${msg}</p><div class="btns"><button class="btn ${danger ? 'bad' : ''}" data-act="askOk">${okText}</button><button class="btn g" data-act="closeSheet">رجوع</button></div>`);
  ACT.askOk = () => closeSheet(false, fn);
}
let toastT = 0;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2300); }
function coin(el, txt) {
  const r = el.getBoundingClientRect(), c = document.createElement('div'); c.className = 'coin'; c.textContent = txt;
  c.style.left = (r.left + r.width / 2 - 20) + 'px'; c.style.top = (r.top - 10) + 'px'; document.body.appendChild(c); setTimeout(() => c.remove(), 1000);
}
let AC = null;
function ding(f = 880) {
  if (!S.settings.sound) return;
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, AC.currentTime); g.gain.exponentialRampToValueAtTime(.18, AC.currentTime + .02); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + .35);
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + .4); } catch (e) {}
}
function confetti(n = 140) {
  const c = $('#fx'), x = c.getContext('2d'), k = devicePixelRatio || 1, W = c.width = innerWidth * k, H = c.height = innerHeight * k;
  const cols = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#facc15'];
  const P = Array.from({ length: n }, (_, i) => ({ x: W / 2 + (Math.random() - .5) * W * .4, y: H * .38, vx: (Math.random() - .5) * 18 * k, vy: (-Math.random() * 16 - 7) * k,
    r: (4 + Math.random() * 5) * k, c: cols[i % cols.length], a: Math.random() * 6, va: (Math.random() - .5) * .35 }));
  let t = 0; (function f() { x.clearRect(0, 0, W, H);
    P.forEach(p => { p.vy += .5 * k; p.x += p.vx; p.y += p.vy; p.vx *= .985; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore(); });
    if (++t < 160) requestAnimationFrame(f); else x.clearRect(0, 0, W, H); })();
}

/* ---------- قطع جاهزة ---------- */
const bar = (title, sub, right = '') => `<div class="bar"><button class="ib" data-act="back" aria-label="رجوع">${ic('back')}</button><h2>${title}${sub ? `<small>${sub}</small>` : ''}</h2>${right}</div>`;
function avatar(st, big) { const [a, b] = groupColor(grp(st.gid)); return `<div class="av" style="background:linear-gradient(135deg,${a},${b})${big ? ';width:76px;height:76px;border-radius:26px;font-size:24px;margin:0 auto' : ''}">${esc(initials(st.name))}</div>`; }
const gradOf = g => { const [a, b] = groupColor(g); return `linear-gradient(135deg,${a},${b})`; };
function ring(v, size = 54, col = '#fff', track = 'rgba(255,255,255,.25)', label) {
  const r = size / 2 - 5, C = 2 * Math.PI * r, off = C * (1 - Math.max(0, Math.min(1, v || 0)));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="6"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}" transform="rotate(-90 ${size / 2} ${size / 2})" style="transition:stroke-dashoffset .8s"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="${col}" font-size="${size / 4.2}" font-weight="900" font-family="Cairo">${label != null ? label : ar(Math.round((v || 0) * 100)) + '٪'}</text></svg>`;
}
function spark(seq, w = 140, h = 40) {
  if (!seq || seq.length < 2) return '';
  const pts = seq.map((v, i) => [4 + i * (w - 8) / (seq.length - 1), h - 4 - (v - 1) / 3 * (h - 8)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="sg" x1="0" x2="1"><stop offset="0" stop-color="#a21caf"/><stop offset="1" stop-color="#6d28d9"/></linearGradient></defs><path d="${d} L${pts[pts.length - 1][0]} ${h} L${pts[0][0]} ${h}Z" fill="rgba(109,40,217,.1)"/><path d="${d}" fill="none" stroke="url(#sg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="#a21caf"/>`).join('')}</svg>`;
}
const codeChip = (c, extra = '') => { const k = CODE(c); return c ? `<span class="code on" style="background:${k ? k.color : '#e5e7eb'}" ${extra}>${esc(c)}</span>` : `<span class="code" ${extra}>＋</span>`; };
function mnav(mk) { return `<div class="mnav"><button class="ib" data-act="mprev">${ic('back')}</button><b>${monthName(mk)}</b><button class="ib" data-act="mnext">${ic('next')}</button></div>`; }
ACT.mprev = () => { const p = cur().p; p.mk = addMonth(p.mk || monthKey(today()), -1); refresh(); };
ACT.mnext = () => { const p = cur().p; p.mk = addMonth(p.mk || monthKey(today()), 1); refresh(); };
const empty = (emo, t, s) => `<div class="empty"><div>${emo}</div><b>${t}</b>${s || ''}</div>`;
const money = n => ar(n) + ' ج';

/* ---------- الصفحة الرئيسية ---------- */
const APPS = [
  ['pickSession', 'تحضير الحصة', 'check', '#10b981', '#047857'], ['groups', 'المجموعات', 'users', '#6366f1', '#4338ca'], ['students', 'الطلاب', 'cap', '#8b5cf6', '#6d28d9'],
  ['money', 'الفلوس', 'wallet', '#f59e0b', '#ea580c'], ['debts', 'عليهم فلوس', 'bell', '#fb7185', '#e11d48'], ['board', 'لوحة الشرف', 'trophy', '#fbbf24', '#d97706'],
  ['reports', 'الإحصائيات', 'chart', '#22d3ee', '#0369a1'], ['msgs', 'رسايل الأهالي', 'chat', '#34d399', '#128c7e'], ['week', 'جدول الأسبوع', 'cal', '#f472b6', '#be185d'],
  ['exams', 'الامتحانات', 'exam', '#c084fc', '#7e22ce'], ['codes', 'دليل الرموز', 'tag', '#e879f9', '#a21caf'], ['excel', 'ملف إكسل', 'grid', '#4ade80', '#15803d'],
  ['import', 'استيراد شيت', 'import', '#2dd4bf', '#0f766e'], ['backup', 'نسخة احتياطية', 'shield', '#60a5fa', '#1d4ed8'], ['settings', 'الإعدادات', 'gear', '#94a3b8', '#334155']
];
SCREENS.home = () => {
  if (!S.groups.length) return welcome();
  const h = new Date().getHours(), greet = h < 12 ? 'صباح الخير' : h < 18 ? 'نهارك سعيد' : 'مساء الخير', wx = h >= 5 && h < 17 ? '☀️' : '🌙';
  const mk = monthKey(today()), tg = todayGroups(), debtors = S.students.filter(s => owedTotal(s) > 0).length;
  const name = S.settings.teacher.replace(/^مستر\s*/, '').split(' ')[0];
  const old = Date.now() - (S.settings.lastBackup || 0) > 7 * 864e5;
  const badges = { debts: debtors, pickSession: tg.filter(g => !sessionOn(g.id, today())).length };
  return `<div class="hero"><div class="top"><div class="logo">${LOGO}</div><div><h1>${greet} يا مستر ${esc(name)}</h1><p>${fmtDay(today())} · ${esc(S.settings.subject)}</p></div><div class="wx">${wx}</div></div>
    <div class="kpis"><div class="kpi"><b>${ar(S.students.length)}</b><small>طالب</small></div><div class="kpi"><b>${ar(tg.length)}</b><small>حصص النهارده</small></div>
    <div class="kpi"><b>${ar(monthIncome(mk))}</b><small>جنيه اتحصّل</small></div><div class="kpi"><b>${ar(debtors)}</b><small>عليهم فلوس</small></div></div></div>
    ${old ? `<div class="banner">💾 بقالك أكتر من أسبوع من غير نسخة احتياطية<button class="btn sm" data-go="backup">اعملها</button></div>` : ''}
    ${tg.length ? `<div class="sec">حصص النهارده <small>${ar(tg.length)} مجموعة</small></div><div class="today">${tg.map(g => {
      const n = groupStudents(g.id).length, x = sessionOn(g.id, today()), done = x ? Object.keys(x.marks).length : 0;
      return `<button class="tcard up" style="background:${gradOf(g)}" data-go="session" data-gid="${g.id}" data-date="${today()}">${ring(n ? done / n : 0, 54)}<h3>${esc(g.name)}</h3><p>${g.time ? '⏰ ' + esc(g.time) + ' · ' : ''}${ar(n)} طالب</p><span class="go">${done ? (done >= n ? 'خلصت ✓' : 'كمّل التحضير') : 'ابدأ التحضير'} ${ic('next').replace('<svg', '<svg width="16" height="16"')}</span></button>`;
    }).join('')}</div>` : ''}
    <div class="sec">كل حاجة في مكان واحد</div>
    <div class="apps">${APPS.map(([k, t, i, a, b], n) => `<button class="app" style="animation-delay:${n * 40}ms" data-go="${k}">${badges[k] ? `<span class="bd">${ar(badges[k])}</span>` : ''}<div class="ic" style="background:linear-gradient(145deg,${a},${b});box-shadow:0 12px 22px -10px ${b}">${ic(i)}</div><span>${t}</span></button>`).join('')}</div>
    <p class="c muted" style="font-size:12.5px;margin-top:28px">🔒 كل البيانات محفوظة على الموبايل ده بس · شغال من غير نت</p>`;
};
function welcome() {
  return `<div style="min-height:92vh;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:14px">
    <div style="width:120px;height:120px;margin:0 auto;border-radius:38px;background:var(--grad);padding:14px;box-shadow:0 24px 48px -18px rgba(162,28,175,.8);animation:pop .7s both">${LOGO}</div>
    <h1 style="margin:8px 0 0;font-size:30px;font-weight:900" class="up">أهلاً يا مستر شريف 👋</h1>
    <p class="muted up" style="margin:0 0 10px;animation-delay:.1s">البرنامج اللي هيشيل عنك الغياب والمستويات والفلوس.<br>هات الشيت بتاعك وكل مجموعاتك هتتنقل في ثانية.</p>
    <button class="btn w up" style="animation-delay:.2s" data-act="pickXlsx">${ic('import')} استورد شيت الإكسل بتاعك</button>
    <button class="btn g w up" style="animation-delay:.28s" data-act="restorePick">${ic('shield')} رجّع نسخة احتياطية</button>
    <button class="btn g w up" style="animation-delay:.36s" data-act="addGroup">${ic('plus')} ابدأ من الصفر</button>
    <p class="muted" style="font-size:13px">🔒 كل حاجة بتتحفظ على الموبايل ده بس · شغال من غير نت</p></div>`;
}
