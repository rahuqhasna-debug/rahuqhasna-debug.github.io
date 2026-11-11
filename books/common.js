"use strict";
/* ===== مشترك بين admin.html و teacher.html (المراسلات — Supabase) ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LS = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } }
};

/* ---------- الاتصال بالقاعدة (config.js، أو «كود إعداد» = base64 url|key لقاعدة مندوب تانية) ---------- */
const CFG_KEY = 'selah-trial-cfg';
function encodeCfg(url, key) { return btoa(url + '|' + key).replace(/=+$/, ''); }
function decodeCfg(s) { try { const [url, key] = atob(s.trim()).split('|'); if (/^https:\/\/.+/.test(url) && key) return { url, key }; } catch (e) { } return null; }
function getCfg(cfgKey = CFG_KEY) {
  const o = LS.get(cfgKey);
  if (o && o.url && o.key) return { ...o, custom: true };
  const c = window.SILAH_CONFIG || {};
  return { url: c.SUPABASE_URL, key: c.SUPABASE_ANON_KEY, custom: false };
}
function cfgReady(c) { return c.url && !/PASTE/.test(c.url) && c.key && !/PASTE/.test(c.key); }
function makeClient(persist, cfgKey = CFG_KEY) {
  const c = getCfg(cfgKey);
  if (!cfgReady(c) || !window.supabase) return null;
  return supabase.createClient(c.url, c.key, { auth: { persistSession: persist, autoRefreshToken: persist, storageKey: 'selah-trial-auth' } });
}
function deviceId() {
  let d = LS.get('selah-trial-device');
  if (!d) { d = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)); LS.set('selah-trial-device', d); }
  return d;
}

/* ---------- ملف المدرس — نفس حقول البرنامج الأخضر (من غير التصنيف A/B/C) + الجديد ---------- */
const SUBJ_PICK = [['math', 'رياضة'], ['ar', 'عربي'], ['en', 'إنجليزي'], ['sci', 'علوم'], ['stu', 'دراسات']];
const SUBJ_L = Object.fromEntries(SUBJ_PICK);
const STAGE_L = { p: 'ابتدائي', m: 'إعدادي', pm: 'ابتدائي وإعدادي' };
function specOpts(st) { return st === 'p' ? ['فصل', 'صفوف عليا', 'كل الصفوف'] : st === 'm' ? ['كل الصفوف'] : st === 'pm' ? ['فصل', 'صفوف عليا', 'صفوف عليا وإعدادي', 'كل الصفوف'] : []; }
// الصفوف: 1..6 ابتدائي، 7..9 = أولى/تانية/تالتة إعدادي
const GRADE_N = ['أولى', 'تانية', 'تالتة', 'رابعة', 'خامسة', 'سادسة', 'أولى إعدادي', 'تانية إعدادي', 'تالتة إعدادي'];
function gradesFor(st) { return st === 'p' ? [1, 2, 3, 4, 5, 6] : st === 'm' ? [7, 8, 9] : st === 'pm' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : []; }
const WHERE_OPTS = ['دروس', 'مدارس', 'دروس ومدارس'];
const DAYS = [['sat', 'السبت'], ['sun', 'الأحد'], ['mon', 'الاتنين'], ['tue', 'التلات'], ['wed', 'الأربع'], ['thu', 'الخميس'], ['fri', 'الجمعة']];
const FIELDS = [
  { k: 'name', l: 'الاسم', t: 'text' },
  { k: 'avatar', l: 'الصورة الشخصية', t: 'avatar' },
  { k: 'phone', l: 'رقم التليفون', t: 'tel' },
  { k: 'stage', l: 'المرحلة', t: 'stage' },
  { k: 'subjects', l: 'المادة (مادتين بالكتير)', t: 'subjects' },
  { k: 'spec', l: 'التخصص (حسب المرحلة)', t: 'spec' },
  { k: 'area', l: 'المنطقة / القرية', t: 'text' },
  { k: 'school', l: 'المدرسة (مش إجباري)', t: 'text' },
  { k: 'grades', l: 'الصفوف اللي بتدرّسها', t: 'grades' },
  { k: 'where', l: 'دروس / مدارس', t: 'where' },
  { k: 'students', l: 'عدد الطلاب', t: 'number' },
  { k: 'address', l: 'عنوان مكان الدرس بالتفصيل', t: 'address' },
  { k: 'loc', l: 'موقع مكان الدرس على الخريطة', t: 'loc' },
  { k: 'days', l: 'أيام تواجدك في السنتر', t: 'days' }
];
const FIELD_LABEL = Object.fromEntries(FIELDS.map(f => [f.k, f.l.replace(/ \(.*\)$/, '')]));
FIELD_LABEL.photos = 'صور إضافية';
const REQ_FIELDS = [...FIELDS.map(f => f.k), 'photos'];
const REMIND = [
  '﴿مَا يَلْفِظُ مِن قَوْلٍ إِلَّا لَدَيْهِ رَقِيبٌ عَتِيدٌ﴾ — نثق في أمانتك 🤍',
  'الصدق طمأنينة، والله مطّلع على ما نكتب.',
  '«عليكم بالصدق فإن الصدق يهدي إلى البر» — شكرًا لدقتك.',
  'بياناتك أمانة، اكتبها كما هي، بارك الله فيك.',
  '«إن الصدق يهدي إلى البر، وإن البر يهدي إلى الجنة».',
  'كلمة صادقة خير من ألف كلمة — جزاك الله خيرًا.'
];

function gradesText(g) { return Array.isArray(g) && g.length ? g.slice().sort((a, b) => a - b).map(x => GRADE_N[x - 1] + (x <= 6 ? ' ابتدائي' : '')).join('، ') : '—'; }
function daysText(d) {
  if (!d || typeof d !== 'object') return '—';
  const a = DAYS.filter(([k]) => d[k]).map(([k, l]) => `${l} ${d[k].f || '؟'}–${d[k].t || '؟'}`);
  return a.length ? a.join('، ') : '—';
}
function valText(k, v) {
  if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) return '—';
  if (k === 'stage') return STAGE_L[v] || v;
  if (k === 'subjects') return (v || []).map(x => SUBJ_L[x] || (x === 'kash' ? 'كشكول' : x)).join('، ');
  if (k === 'grades') return gradesText(v);
  if (k === 'days') return daysText(v);
  if (k === 'loc') return v && v.lat ? `📍 ${(+v.lat).toFixed(5)}, ${(+v.lng).toFixed(5)}` : '—';
  if (k === 'avatar') return '🖼️ صورة';
  return String(v);
}
function fmtVal(k, v) {
  if (k === 'avatar' && typeof v === 'string' && v.startsWith('data:')) return `<img class="av" src="${v}" alt="">`;
  if (k === 'loc' && v && v.lat) return `<a target="_blank" rel="noopener" href="https://maps.google.com/?q=${+v.lat},${+v.lng}">📍 افتح الموقع</a>`;
  const t = valText(k, v);
  return t === '—' ? '<span class="muted">—</span>' : esc(t);
}
function diffLines(k, o, n) { return [`${valText(k, o)} ← ${valText(k, n)}`]; }

/* ---------- واجهة ---------- */
function toast(msg, ms = 2600) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), ms);
}
function modal(html, onOpen) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box">${html}</div>`;
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); });
  document.body.appendChild(m); onOpen && onOpen(m.querySelector('.box'), () => m.remove());
  return m;
}
function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('اتنسخ ✅'); }
  catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); toast('اتنسخ ✅'); }
}
function waPhone(p) { p = String(p || '').replace(/\D/g, ''); if (p.startsWith('01')) p = '2' + p; return p; }
function waLink(phone, text) { return `https://wa.me/${waPhone(phone)}?text=${encodeURIComponent(text)}`; }
function downloadDataUrl(dataUrl, name) { const a = document.createElement('a'); a.href = dataUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
function errMsg(e) {
  const m = (e && (e.message || e.error_description || e.msg)) || String(e);
  if (/Failed to fetch|NetworkError/i.test(m)) return 'مفيش نت أو القاعدة واقفة';
  return m;
}

/* ضغط صورة لحد ما الحجم ≤ maxBytes تقريبًا */
function compressImage(file, maxDim, maxBytes) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let dim = maxDim, out = '';
      for (let tries = 0; tries < 8; tries++) {
        const sc = Math.min(1, dim / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        for (let q = 0.8; q >= 0.4; q -= 0.1) { out = c.toDataURL('image/jpeg', q); if (out.length * 0.75 <= maxBytes) return res(out); }
        dim = Math.round(dim * 0.8);
      }
      res(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('الصورة مش مقروءة')); };
    img.src = url;
  });
}

/* ---------- نموذج الملف ----------
   opts: {only:[keys], req:Set, pend:{k:v}, remind:true (عند المدرس)} */
function fieldInput(f, v, stage) {
  switch (f.t) {
    case 'avatar':
      return `<div style="display:flex;align-items:center;gap:10px"><span data-avprev>${v ? `<img class="av lg" src="${v}" alt="">` : '<span class="av lg">👤</span>'}</span>
        <label class="btn sm">📷 اختار صورة<input type="file" accept="image/*" data-av hidden></label></div>`;
    case 'stage':
      return `<select name="stage"><option value="">—</option>${Object.entries(STAGE_L).map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    case 'subjects':
      return `<div class="pgrid" data-subjs>${SUBJ_PICK.map(([k, l]) => `<label class="chip"><input type="checkbox" value="${k}" ${(v || []).includes(k) ? 'checked' : ''}>${l}</label>`).join('')}</div>`;
    case 'spec':
      return `<select name="spec" data-spec>${specSel(stage, v)}</select>`;
    case 'grades':
      return `<div class="pgrid" data-grades>${gradesBoxes(stage, v)}</div>`;
    case 'where':
      return `<select name="where"><option value="">—</option>${WHERE_OPTS.map(o => `<option ${v === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    case 'address':
      return `<textarea name="address" placeholder="مثال: شارع المدرسة، فوق صيدلية النور، جنب مسجد الرحمة">${esc(v || '')}</textarea>
        <div class="hint small muted">اكتب العنوان بالتفصيل واذكر علامة مميزة جنبه (مسجد، صيدلية، مدرسة…)</div>`;
    case 'loc':
      return `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button type="button" class="btn sm" data-locbtn>📍 اضغط هنا عشان نعرف موقع الدرس</button>
        <span class="small" data-locv>${v && v.lat ? fmtVal('loc', v) : '<span class="muted">لسه ما اتحددش</span>'}</span></div>
        <div class="hint small muted">افتحها وانت في مكان الدرس.</div>`;
    case 'days': {
      const d = v || {};
      return `<div class="days" data-days>${DAYS.map(([k, l]) => `<div class="dayrow"><label class="chip ${d[k] ? 'on' : ''}"><input type="checkbox" value="${k}" ${d[k] ? 'checked' : ''}>${l}</label>
        <span class="dtimes" ${d[k] ? '' : 'hidden'}>من <input type="time" data-f="${k}" value="${esc(d[k]?.f || '')}"> إلى <input type="time" data-t="${k}" value="${esc(d[k]?.t || '')}"></span></div>`).join('')}</div>`;
    }
    default:
      return `<input name="${f.k}" type="${f.t === 'number' ? 'number' : f.t === 'tel' ? 'tel' : 'text'}" ${f.t === 'number' ? 'inputmode="numeric" min="0"' : ''} ${f.t === 'tel' ? 'dir="ltr"' : ''} value="${esc(v ?? '')}">`;
  }
}
function specSel(stage, v) { const o = specOpts(stage); return `<option value="">—</option>` + o.map(x => `<option ${v === x ? 'selected' : ''}>${x}</option>`).join(''); }
function gradesBoxes(stage, v) {
  const gs = gradesFor(stage);
  if (!gs.length) return '<span class="small muted">اختار المرحلة الأول</span>';
  return gs.map(g => `<label class="chip"><input type="checkbox" value="${g}" ${(v || []).includes(g) ? 'checked' : ''}>${GRADE_N[g - 1]}</label>`).join('');
}
function profileForm(vals, opts = {}) {
  vals = vals || {};
  const keys = opts.only || FIELDS.map(f => f.k);
  // لو بيعدّل الصفوف/التخصص لازم المرحلة تبقى موجودة
  const stage = vals.stage || '';
  return FIELDS.filter(f => keys.includes(f.k)).map(f => {
    const v = vals[f.k], req = opts.req && opts.req.has(f.k) ? ' req' : '';
    const pend = opts.pend && f.k in opts.pend ? `<div class="pend">⏳ تعديلك في انتظار المراجعة: ${esc(valText(f.k, opts.pend[f.k]))}</div>` : '';
    const reqTxt = req ? ' <span class="pill bad">مطلوب تحديثه</span>' : '';
    return `<div class="field${req}" data-f="${f.k}"><label>${f.l}${reqTxt}</label>${fieldInput(f, v, stage)}${pend}${opts.remind ? '<div class="remind" hidden></div>' : ''}</div>`;
  }).join('');
}
// أحداث النموذج. state.avatar / state.loc بيتحدثوا
function bindProfileForm(root, state, opts = {}) {
  let ri = Math.floor(Math.random() * REMIND.length);
  const remind = fld => {
    if (!opts.remind || !fld) return; const r = $('.remind', fld); if (!r || !r.hidden) return;
    r.textContent = '🤍 ' + REMIND[ri++ % REMIND.length]; r.hidden = false;
  };
  root.addEventListener('focusin', e => remind(e.target.closest('.field')));
  root.addEventListener('change', e => {
    const fld = e.target.closest('.field'); remind(fld);
    const sub = e.target.closest('[data-subjs]');
    if (sub && $$('input:checked', sub).length > 2) { e.target.checked = false; toast('مادتين بالكتير'); }
    const day = e.target.closest('.dayrow');
    if (day && e.target.type === 'checkbox') { $('.dtimes', day).hidden = !e.target.checked; e.target.parentNode.classList.toggle('on', e.target.checked); }
    if (e.target.name === 'stage') {
      const st = e.target.value, sp = $('[data-spec]', root), gr = $('[data-grades]', root);
      if (sp) { const cur = sp.value; sp.innerHTML = specSel(st, cur); if (specOpts(st).length === 1) sp.value = specOpts(st)[0]; }
      if (gr) { const cur = $$('input:checked', gr).map(i => +i.value); gr.innerHTML = gradesBoxes(st, cur); }
    }
  });
  const av = $('[data-av]', root);
  av && av.addEventListener('change', async () => {
    const f = av.files[0]; if (!f) return;
    try { state.avatar = await compressImage(f, 200, 25000); $('[data-avprev]', root).innerHTML = `<img class="av lg" src="${state.avatar}" alt="">`; }
    catch (e) { toast(errMsg(e)); }
  });
  const lb = $('[data-locbtn]', root);
  lb && (lb.onclick = () => {
    if (!navigator.geolocation) return toast('الموبايل ده مش بيدعم تحديد الموقع');
    lb.disabled = true; lb.textContent = '⏳ بنحدد الموقع…';
    navigator.geolocation.getCurrentPosition(p => {
      state.loc = { lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) };
      $('[data-locv]', root).innerHTML = fmtVal('loc', state.loc); lb.disabled = false; lb.textContent = '📍 حدّد تاني'; remind(lb.closest('.field'));
    }, () => { lb.disabled = false; lb.textContent = '📍 اضغط هنا عشان نعرف موقع الدرس'; toast('ماقدرناش نحدد الموقع — اسمح للبرنامج بالموقع وشغّل الـ GPS'); },
      { enableHighAccuracy: true, timeout: 20000 });
  });
}
function readProfileForm(root, state) {
  const out = {};
  $$('input[name],select[name],textarea[name]', root).forEach(i => { const v = i.value.trim(); out[i.name] = i.type === 'number' ? (v === '' ? '' : +v) : v; });
  const s = $('[data-subjs]', root); if (s) out.subjects = $$('input:checked', s).map(i => i.value);
  const g = $('[data-grades]', root); if (g) out.grades = $$('input:checked', g).map(i => +i.value).sort((a, b) => a - b);
  const d = $('[data-days]', root);
  if (d) { out.days = {}; $$('.dayrow', d).forEach(r => { const c = $('input[type=checkbox]', r); if (c.checked) out.days[c.value] = { f: $('[data-f]', r).value, t: $('[data-t]', r).value }; }); }
  if (state && state.avatar) out.avatar = state.avatar;
  if (state && state.loc) out.loc = state.loc;
  if ('spec' in out && out.stage !== undefined && specOpts(out.stage).length === 1) out.spec = specOpts(out.stage)[0];
  return out;
}
const same = (a, b) => JSON.stringify(a ?? '') === JSON.stringify(b ?? '') || (typeof a !== 'object' && typeof b !== 'object' && String(a ?? '') === String(b ?? ''));
function changedOnly(base, vals) { const o = {}; for (const k in vals) if (!same(base[k], vals[k])) o[k] = vals[k]; return o; }

/* ---------- الكتب (نفس مفاتيح البرنامج الأخضر p|m-subj-grade) ---------- */
const B_SUBJ = { ar: 'عربي', math: 'رياضة', en: 'إنجليزي', sci: 'علوم', stu: 'دراسات' };
const B_GRADE = ['أولى', 'تانية', 'تالتة', 'رابعة', 'خامسة', 'سادسة'];
function bookLabel(k) { const [st, sb, g] = String(k).split('-'); return `${B_SUBJ[sb] || sb} ${B_GRADE[g - 1] || g} ${st === 'm' ? 'إعدادي' : 'ابتدائي'}`; }
function canOrder(p) { p = p || {}; return /m/.test(p.stage || '') || (p.subjects || []).includes('en'); }
