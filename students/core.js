/* طلابي — البيانات والحسابات (كل حاجة محفوظة على الموبايل نفسه) */
'use strict';
const STAGES = { p: { n: 'ابتدائي', fee: 90 }, m: { n: 'إعدادي', fee: 100 }, s: { n: 'ثانوي', fee: 150 } };
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const LINE = 'ــــــــــــــــــــــــــــــــــــــــ';
const PALETTE = [['#6366f1', '#a855f7'], ['#ec4899', '#f43f5e'], ['#06b6d4', '#3b82f6'], ['#10b981', '#0d9488'], ['#f59e0b', '#f97316'], ['#8b5cf6', '#d946ef'],
  ['#0ea5e9', '#6366f1'], ['#22c55e', '#84cc16'], ['#f43f5e', '#fb923c'], ['#14b8a6', '#0ea5e9'], ['#a855f7', '#6366f1'], ['#ef4444', '#ec4899']];
// الرمز، المعنى، المستوى(4 ممتاز..1 ضعيف)، الواجب(2 كامل،1 ناقص،0 مفيش)، الحضور(p حاضر، a غايب، x امتحان)، رسالة ولي الأمر، النقاط، اللون، اللون الفاتح
const DEFAULT_CODES = [
  ['م+', 'ممتاز + واجب كامل', 4, 2, 'p', 'تسميع ممتاز 🌟 وواجب مكتمل، أداء رائع ما شاء الله 👏', 10, '#A9D08E', '#E2EFDA'],
  ['م½', 'ممتاز + واجب ناقص', 4, 1, 'p', 'تسميع ممتاز 🌟 والواجب غير مكتمل (تم حل جزء منه فقط) 📝', 7, '#A9D08E', '#E2EFDA'],
  ['م-', 'ممتاز + بدون واجب', 4, 0, 'p', 'تسميع ممتاز 🌟 لكن لم يتم تسليم الواجب ⚠️ برجاء المتابعة', 5, '#A9D08E', '#E2EFDA'],
  ['جج+', 'جيد جداً + واجب كامل', 3, 2, 'p', 'تسميع جيد جداً 👍 وواجب مكتمل، مستوى مبشّر', 9, '#9DC3E6', '#DDEBF7'],
  ['جج½', 'جيد جداً + واجب ناقص', 3, 1, 'p', 'تسميع جيد جداً 👍 والواجب غير مكتمل (تم حل جزء منه فقط) 📝', 6, '#9DC3E6', '#DDEBF7'],
  ['جج-', 'جيد جداً + بدون واجب', 3, 0, 'p', 'تسميع جيد جداً 👍 لكن لم يتم تسليم الواجب ⚠️', 4, '#9DC3E6', '#DDEBF7'],
  ['ج+', 'متوسط + واجب كامل', 2, 2, 'p', 'مستوى التسميع متوسط 📖 والواجب مكتمل 👍، نحتاج لمراجعة أكثر للحفظ', 6, '#FFD966', '#FFF2CC'],
  ['ج½', 'متوسط + واجب ناقص', 2, 1, 'p', 'مستوى التسميع متوسط 📖 والواجب غير مكتمل 📝، نحتاج لمراجعة ومتابعة أكثر', 4, '#FFD966', '#FFF2CC'],
  ['ج-', 'متوسط + بدون واجب', 2, 0, 'p', 'مستوى التسميع متوسط 📖 ولم يتم تسليم الواجب ⚠️ برجاء المتابعة', 2, '#FFD966', '#FFF2CC'],
  ['ض+', 'ضعيف + واجب كامل', 1, 2, 'p', 'الواجب مكتمل 💯 لكن مستوى التسميع ضعيف ⚠️، يحتاج لمراجعة الحفظ في البيت', 3, '#F4B183', '#FCE4D6'],
  ['ض½', 'ضعيف + واجب ناقص', 1, 1, 'p', 'مستوى التسميع ضعيف ⚠️ والواجب غير مكتمل 📝، يحتاج لمتابعة أكبر', 1, '#F4B183', '#FCE4D6'],
  ['ض-', 'ضعيف + بدون واجب', 1, 0, 'p', 'تنبيه ❌ لم يتم تسميع الدرس ولم يتم تسليم الواجب، برجاء المتابعة مع الطالب', 0, '#ED7D31', '#F8CBAD'],
  ['ح', 'حاضر (شرح + تدريبات)', null, null, 'p', 'حضر الحصة وتم شرح الدرس وحل التدريبات 📚🎯', 5, '#7FD1C7', '#D9F2F0'],
  ['حش', 'حاضر (شرح بس)', null, null, 'p', 'حضر الحصة وكانت حصة شرح للدرس 📖', 5, '#7FD1C7', '#D9F2F0'],
  ['حت', 'حاضر (تدريبات بس)', null, null, 'p', 'حضر الحصة وكانت حصة حل تدريبات ✍️', 5, '#7FD1C7', '#D9F2F0'],
  ['غ', 'غايب', null, null, 'a', 'غائب عن الحصة ❌', 0, '#FF6B6B', '#FFC7CE'],
  ['أ', 'حصة امتحان', null, null, 'x', 'حضر الحصة وكانت حصة امتحان 📝 وتم أداء الامتحان', 0, '#B48EDD', '#EADCF4']
].map(([c, name, lvl, hw, att, msg, pts, color, bg]) => ({ c, name, lvl, hw, att, msg, pts, color, bg }));

/* ---------- أدوات ---------- */
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => iso(new Date());
const pdate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const monthKey = s => s.slice(0, 7);
const addMonth = (k, n) => { const [y, m] = k.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
const addDays = (s, n) => { const d = pdate(s); d.setDate(d.getDate() + n); return iso(d); };
const dow = s => pdate(s).getDay();
const ar = (n, g = true) => Number(n || 0).toLocaleString('ar-EG', { useGrouping: g, maximumFractionDigits: 1 });
const fmtSheet = s => { const d = pdate(s); return DAYS[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); };
const fmtDay = s => { const d = pdate(s); return DAYS[d.getDay()] + ' ' + ar(d.getDate()) + ' ' + MONTHS[d.getMonth()]; };
const monthName = k => { const [y, m] = k.split('-').map(Number); return MONTHS[m - 1] + ' ' + ar(y, false); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const norm = s => String(s || '').replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ً-ْـ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const byDate = (a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
const initials = n => String(n || '؟').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join(' ');
const pct = x => x == null ? '—' : ar(Math.round(x * 100)) + '٪';
const guessStage = t => /ثانو/.test(t) ? 's' : /إعداد|اعداد/.test(t) ? 'm' : 'p';
const lvlName = v => v == null ? '—' : v >= 3.5 ? 'ممتاز' : v >= 2.5 ? 'جيد جداً' : v >= 1.5 ? 'متوسط' : 'ضعيف';
const lvlColor = v => v == null ? '#94a3b8' : v >= 3.5 ? '#16a34a' : v >= 2.5 ? '#2563eb' : v >= 1.5 ? '#ca8a04' : '#ea580c';
function normPhone(v) {
  if (v == null || v === '') return '';
  let s = String(v).trim();
  if (typeof v === 'number' || /^\d+(\.\d+)?e\+?\d+$/i.test(s)) s = Math.round(+v).toString();
  s = s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g, '');
  if (/^00/.test(s)) s = s.slice(2);
  if (/^01\d{9}$/.test(s)) s = '2' + s;
  else if (/^1\d{9}$/.test(s)) s = '20' + s;
  return s;
}
const showPhone = p => p && /^20\d{10}$/.test(p) ? '0' + p.slice(2) : (p || '');
const waLink = (p, t) => 'https://wa.me/' + p + '?text=' + encodeURIComponent(t);
const smsLink = (p, t) => 'sms:+' + p + '?body=' + encodeURIComponent(t);

/* ---------- الحفظ: IndexedDB + نسخة تانية في localStorage ---------- */
const KEY = 'tlaby-db-v1';
let S = null;
function blank() {
  return { v: 1, savedAt: 0, settings: { teacher: 'مستر شريف حشيش', subject: 'دراسات اجتماعية', sign: 'متابعة مستر شريف حشيش', fees: { p: 90, m: 100, s: 150 },
    theme: 'auto', payInReport: true, lastBackup: 0, startMonth: monthKey(today()), sound: true }, codes: DEFAULT_CODES.map(c => ({ ...c })),
    groups: [], students: [], sessions: [], pays: [], sent: {} };
}
function migrate(d) {
  const b = blank();
  d.settings = Object.assign(b.settings, d.settings || {}); d.settings.fees = Object.assign(b.settings.fees, (d.settings && d.settings.fees) || {});
  for (const k of ['groups', 'students', 'sessions', 'pays']) if (!Array.isArray(d[k])) d[k] = [];
  if (!Array.isArray(d.codes) || !d.codes.length) d.codes = b.codes;
  if (!d.sent || typeof d.sent !== 'object') d.sent = {};
  d.sessions.forEach(x => { x.marks = x.marks || {}; x.scores = x.scores || {}; });
  return d;
}
const IDB = {
  p: null,
  open() { return this.p || (this.p = new Promise((ok, no) => { const r = indexedDB.open('tlaby', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); })); },
  async get(k) { const db = await this.open(); return new Promise((ok, no) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); }); },
  async set(k, v) { const db = await this.open(); return new Promise((ok, no) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => ok(); t.onerror = () => no(t.error); }); }
};
async function loadDB() {
  let a = null, b = null;
  try { a = await IDB.get(KEY); } catch (e) {}
  try { b = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  const best = [a, b].filter(x => x && x.v).sort((x, y) => (y.savedAt || 0) - (x.savedAt || 0))[0];
  S = migrate(best || blank()); refreshCodes();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
}
let saveT = 0;
function save(now) { clearTimeout(saveT); if (now) return flush(); saveT = setTimeout(flush, 300); }
async function flush() {
  clearTimeout(saveT); S.savedAt = Date.now();
  try { await IDB.set(KEY, S); } catch (e) {}
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
}
addEventListener('visibilitychange', () => { if (document.hidden && S) flush(); });
addEventListener('pagehide', () => { if (S) flush(); });

/* ---------- البحث في البيانات ---------- */
let CODEMAP = {};
function refreshCodes() { CODEMAP = {}; S.codes.forEach(k => { CODEMAP[k.c] = k; }); }
const CODE = c => CODEMAP[c] || null;
const grp = id => S.groups.find(g => g.id === id);
const stu = id => S.students.find(s => s.id === id);
const groupStudents = gid => S.students.filter(s => s.gid === gid).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
const sessionsOf = (gid, mk) => S.sessions.filter(x => x.gid === gid && (!mk || x.date.startsWith(mk))).sort(byDate);
const sessionOn = (gid, date) => S.sessions.find(x => x.gid === gid && x.date === date);
function ensureSession(gid, date) { let x = sessionOn(gid, date); if (!x) { x = { id: uid(), gid, date, marks: {}, scores: {}, max: 0 }; S.sessions.push(x); } return x; }
function dropEmptySessions() { S.sessions = S.sessions.filter(x => Object.keys(x.marks).length); }
const groupColor = g => PALETTE[(g && g.color || 0) % PALETTE.length];
const isGroupDay = (g, date) => (g.days || []).includes(dow(date));
const todayGroups = () => S.groups.filter(g => isGroupDay(g, today()) || sessionOn(g.id, today())).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
function plannedDates(g, mk) { const out = []; let d = mk + '-01'; while (d.startsWith(mk)) { if (isGroupDay(g, d)) out.push(d); d = addDays(d, 1); } return out; }
function monthDates(g, mk) { return [...new Set(plannedDates(g, mk).concat(sessionsOf(g.id, mk).map(x => x.date)))].sort(); }

/* ---------- المستوى والحضور والنقاط ---------- */
const examPts = (x, sid) => x.max > 0 && x.scores[sid] != null && x.scores[sid] !== '' ? Math.round(+x.scores[sid] / x.max * 10) : 0;
function stats(sid, mk) {
  let n = 0, pres = 0, abs = 0, lv = 0, lvN = 0, hw = 0, hwN = 0, pts = 0; const seq = [], list = [];
  S.sessions.filter(x => x.marks[sid] && (!mk || x.date.startsWith(mk))).sort(byDate).forEach(x => {
    const k = CODE(x.marks[sid]); if (!k) return; n++; list.push({ x, k });
    if (k.att === 'a') abs++; else pres++;
    if (k.lvl) { lv += k.lvl; lvN++; seq.push(k.lvl); }
    if (k.hw != null) { hw += k.hw / 2; hwN++; }
    pts += k.att === 'x' ? examPts(x, sid) : (+k.pts || 0);
  });
  return { n, pres, abs, att: n ? pres / n : null, lvl: lvN ? lv / lvN : null, hw: hwN ? hw / hwN : null, pts, seq, list };
}
function ranking(gid, mk) {
  const sts = gid ? groupStudents(gid) : S.students.slice();
  return sts.map(s => ({ s, st: stats(s.id, mk) })).filter(r => r.st.n).sort((a, b) => b.st.pts - a.st.pts || (b.st.lvl || 0) - (a.st.lvl || 0));
}

/* ---------- الفلوس ---------- */
const has = v => v !== null && v !== undefined && v !== '';
function feeOf(st) { const g = grp(st.gid); if (has(st.fee)) return +st.fee; if (g && has(g.fee)) return +g.fee; return +S.settings.fees[(g && g.stage) || 'p'] || 0; }
const paidIn = (sid, mk) => S.pays.filter(p => p.sid === sid && p.month === mk).reduce((a, p) => a + (+p.amount || 0), 0);
function dueMonths(st) {
  const out = [], cur = monthKey(today()); let k = S.settings.startMonth; const j = st.joined ? monthKey(st.joined) : k; if (j > k) k = j;
  for (let i = 0; k <= cur && i < 36; i++) { out.push(k); k = addMonth(k, 1); }
  return out;
}
function owed(st) { const fee = feeOf(st); if (!fee) return []; return dueMonths(st).map(k => ({ k, due: fee - paidIn(st.id, k) })).filter(x => x.due > 0); }
const owedTotal = st => owed(st).reduce((a, x) => a + x.due, 0);
const monthIncome = mk => S.pays.filter(p => p.month === mk).reduce((a, p) => a + (+p.amount || 0), 0);
const monthExpected = mk => S.students.filter(s => dueMonths(s).includes(mk)).reduce((a, s) => a + feeOf(s), 0);
function payFull(sid, mk) { const st = stu(sid), rest = feeOf(st) - paidIn(sid, mk); if (rest > 0) S.pays.push({ id: uid(), sid, month: mk, amount: rest, date: today() }); save(); }
function unpay(sid, mk) { S.pays = S.pays.filter(p => !(p.sid === sid && p.month === mk)); save(); }

/* ---------- رسايل أولياء الأمور ---------- */
function reportText(sid, mk) {
  const st = stu(sid), L = ['السلام عليكم ورحمة الله وبركاته', 'تقرير متابعة الطالب/ة: ' + st.name, LINE, 'تفاصيل الحصص:'];
  const ss = S.sessions.filter(x => x.marks[sid] && x.date.startsWith(mk)).sort(byDate);
  if (!ss.length) L.push('• لم تُسجّل حصص لهذا الشهر بعد');
  ss.forEach(x => { const k = CODE(x.marks[sid]); let m = k ? k.msg : 'غير محدد'; if (k && k.att === 'x' && x.max && has(x.scores[sid])) m += ' — الدرجة: ' + x.scores[sid] + ' من ' + x.max; L.push('• ' + fmtSheet(x.date) + ': ' + m); });
  if (S.settings.payInReport) {
    const fee = feeOf(st);
    if (fee) { const p = paidIn(sid, mk), [, m] = mk.split('-').map(Number); L.push(LINE, 'اشتراك شهر ' + MONTHS[m - 1] + ': ' + (p >= fee ? 'تم الدفع ✅ شكراً لحضرتك' : p > 0 ? 'مدفوع ' + p + ' من ' + fee + ' جنيه' : fee + ' جنيه — لم يُدفع بعد')); }
  }
  L.push(LINE, S.settings.sign);
  return L.join('\n');
}
const absenceText = (sid, date) => ['السلام عليكم ورحمة الله وبركاته', 'نحيط علم حضرتك إن الطالب/ة: ' + stu(sid).name, 'غاب/ت عن حصة ' + S.settings.subject + ' النهارده ' + fmtSheet(date) + ' ❌', 'برجاء المتابعة 🌹', LINE, S.settings.sign].join('\n');
function feeText(sid) {
  const st = stu(sid), o = owed(st);
  return ['السلام عليكم ورحمة الله وبركاته', 'برجاء التكرم بسداد اشتراك ' + o.map(x => 'شهر ' + MONTHS[+x.k.slice(5) - 1]).join(' و') + ' للطالب/ة: ' + st.name,
    'المبلغ المطلوب: ' + o.reduce((a, x) => a + x.due, 0) + ' جنيه', 'وشكراً لحضراتكم 🌹', LINE, S.settings.sign].join('\n');
}

/* ---------- استيراد الشيت بتاع المستر ---------- */
function parseHdrDate(v) {
  if (typeof v === 'number' && v > 40000 && v < 60000) { const d = new Date(Date.UTC(1899, 11, 30) + v * 864e5); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  if (typeof v !== 'string') return null;
  const s = v.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  let m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (m && +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) return m[3] + '-' + pad(+m[2]) + '-' + pad(+m[1]);
  m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m ? m[1] + '-' + pad(+m[2]) + '-' + pad(+m[3]) : null;
}
function parseGuide(rows) {
  let hr = rows.findIndex(r => r && typeof r[0] === 'string' && /^الرمز/.test(r[0].trim()));
  if (hr < 0) return null;
  const hdr = rows[hr], msgC = hdr.findIndex(v => typeof v === 'string' && /التقرير|الرسالة/.test(v)), ptsC = hdr.findIndex(v => typeof v === 'string' && /النقاط|التكريم/.test(v));
  const out = [];
  for (let r = hr + 1; r < rows.length; r++) {
    const row = rows[r]; if (!row || typeof row[0] !== 'string' || !row[0].trim() || row[0].length > 4) { if (out.length) break; continue; }
    const p = ptsC >= 0 ? String(row[ptsC] || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).match(/-?\d+/) : null;
    out.push({ c: row[0].trim(), name: typeof row[1] === 'string' ? row[1].trim() : '', msg: msgC >= 0 && typeof row[msgC] === 'string' ? row[msgC].trim() : '', pts: p ? +p[0] : null });
  }
  return out.length ? out : null;
}
function parseSheetFile(sheets) {
  const groups = []; let codes = null;
  for (const sh of sheets) {
    const rows = sh.rows; let hr = -1, nameC = -1, phoneC = -1;
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r] || [], i = row.findIndex(v => typeof v === 'string' && /اسم\s*الطالب/.test(v));
      if (i >= 0) { hr = r; nameC = i; phoneC = row.findIndex(v => typeof v === 'string' && /رقم|تليفون|موبايل|هاتف|ولي/.test(v)); break; }
    }
    if (hr < 0) { const g = parseGuide(rows); if (g) codes = g; continue; }
    const dateCols = [];
    (rows[hr] || []).forEach((v, i) => { const d = parseHdrDate(v); if (d) dateCols.push({ i, d }); });
    const students = [];
    for (let r = hr + 1; r < rows.length; r++) {
      const row = rows[r]; if (!row) continue;
      let name = row[nameC]; if (typeof name !== 'string' || !name.trim()) continue;
      name = name.replace(/^[.\-\s]+/, '').replace(/\s+/g, ' ').trim(); if (!name) continue;
      const marks = {};
      dateCols.forEach(({ i, d }) => { const c = row[i]; if (typeof c === 'string' && c.trim() && c.trim().length <= 4) marks[d] = c.trim(); });
      students.push({ name, phone: phoneC >= 0 ? normPhone(row[phoneC]) : '', marks });
    }
    if (!students.length && !dateCols.length) continue;
    const days = [...new Set(dateCols.map(x => dow(x.d)))].sort();
    groups.push({ name: sh.name.trim(), stage: guessStage(sh.name + ' ' + ((rows[0] || [])[0] || '')), days, students, first: dateCols.length ? dateCols.map(x => x.d).sort()[0] : '' });
  }
  return { groups, codes };
}
function mergeCodes(list) {
  list.forEach(n => {
    const k = S.codes.find(x => x.c === n.c);
    if (k) { if (n.msg) k.msg = n.msg; if (n.pts != null && k.att !== 'x') k.pts = n.pts; }
    else S.codes.push({ c: n.c, name: n.name || n.c, lvl: null, hw: null, att: 'p', msg: n.msg || n.name || n.c, pts: n.pts || 0, color: '#CBD5E1', bg: '#F1F5F9' });
  });
  refreshCodes();
}
function applyImport(data, replace) {
  if (replace) { S.groups = []; S.students = []; S.sessions = []; S.pays = []; S.sent = {}; }
  let ng = 0, ns = 0, nm = 0;
  data.groups.forEach(g => {
    let G1 = S.groups.find(x => norm(x.name) === norm(g.name));
    if (!G1) { G1 = { id: uid(), name: g.name, stage: g.stage, days: g.days, time: '', color: S.groups.length % PALETTE.length, fee: null }; S.groups.push(G1); ng++; }
    else if (!(G1.days || []).length) G1.days = g.days;
    const joined = g.first ? g.first.slice(0, 7) + '-01' : today();
    g.students.forEach(s => {
      let st = S.students.find(x => x.gid === G1.id && norm(x.name) === norm(s.name));
      if (!st) { st = { id: uid(), gid: G1.id, name: s.name, phone: s.phone, fee: null, note: '', joined }; S.students.push(st); ns++; }
      else if (!st.phone && s.phone) st.phone = s.phone;
      for (const [d, c] of Object.entries(s.marks)) { ensureSession(G1.id, d).marks[st.id] = c; nm++; }
    });
  });
  if (data.codes) mergeCodes(data.codes);
  const first = S.sessions.map(x => x.date).sort()[0];
  if (first && (replace || monthKey(first) < S.settings.startMonth)) S.settings.startMonth = monthKey(first);
  save(true);
  return { ng, ns, nm };
}

/* ---------- تصدير إكسل بنفس شكل الشيت ---------- */
function exportBook(mk) {
  const H = v => ({ v, s: 'h' }), sheets = [];
  sheets.push({ name: '📋 دليل الرموز', cols: [10, 26, 64, 12], freeze: [0, 1],
    rows: [[H('الرمز'), H('المعنى'), H('الرسالة لولي الأمر'), H('النقاط')], ...S.codes.map(k => [{ v: k.c, s: k.color }, { v: k.name, s: 'n' }, { v: k.msg, s: 'w' }, { v: k.att === 'x' ? 'حسب الدرجة' : k.pts, s: 'n' }])] });
  S.groups.forEach(g => {
    const sts = groupStudents(g.id), dates = monthDates(g, mk);
    const head = [H('م'), H('اسم الطالب'), H('رقم ولي الأمر'), ...dates.map(d => ({ v: fmtSheet(d), s: 'd' })), H('حضور'), H('غياب'), H('المستوى'), H('النقاط'), H('الاشتراك'), H('نص التقرير')];
    const rows = [head], heights = [34];
    sts.forEach((st, i) => {
      const t = stats(st.id, mk), fee = feeOf(st), paid = paidIn(st.id, mk);
      rows.push([{ v: i + 1, s: 'n' }, { v: st.name, s: 'n' }, { v: showPhone(st.phone), s: 'n' },
        ...dates.map(d => { const x = sessionOn(g.id, d), c = x && x.marks[st.id]; return c ? { v: c + (CODE(c) && CODE(c).att === 'x' && has(x.scores[st.id]) ? ' ' + x.scores[st.id] : ''), s: CODE(c) ? CODE(c).color : 'n' } : { v: '', s: 'n' }; }),
        { v: t.pres, s: 'n' }, { v: t.abs, s: t.abs ? 'FFC7CE' : 'n' }, { v: lvlName(t.lvl), s: 'n' }, { v: t.pts, s: 'n' },
        { v: !fee ? 'معفي' : paid >= fee ? 'دفع ✅' : paid ? 'باقي ' + (fee - paid) : 'لسه ' + fee, s: !fee || paid >= fee ? 'E2EFDA' : 'FFC7CE' },
        { v: reportText(st.id, mk), s: 'w' }]);
      heights.push(20);
    });
    sheets.push({ name: g.name, rows, heights, freeze: [3, 1], cols: [5, 26, 15, ...dates.map(() => 17), 7, 7, 10, 8, 12, 70] });
  });
  const mrows = [[H('المجموعة'), H('الطالب'), H('رقم ولي الأمر'), H('الاشتراك'), H('المدفوع'), H('الباقي')]]; let tf = 0, tp = 0;
  S.groups.forEach(g => groupStudents(g.id).forEach(st => {
    const fee = dueMonths(st).includes(mk) ? feeOf(st) : 0, paid = paidIn(st.id, mk); tf += fee; tp += paid;
    mrows.push([{ v: g.name, s: 'n' }, { v: st.name, s: 'n' }, { v: showPhone(st.phone), s: 'n' }, { v: fee, s: 'n' }, { v: paid, s: 'n' }, { v: Math.max(0, fee - paid), s: fee - paid > 0 ? 'FFC7CE' : 'E2EFDA' }]);
  }));
  mrows.push([H('الإجمالي'), H(''), H(''), H(tf), H(tp), H(Math.max(0, tf - tp))]);
  sheets.push({ name: '💰 فلوس ' + MONTHS[+mk.slice(5) - 1], rows: mrows, freeze: [0, 1], cols: [20, 26, 15, 11, 11, 11] });
  const rk = ranking(null, mk).slice(0, 50);
  sheets.push({ name: '🏆 لوحة الشرف', freeze: [0, 1], cols: [9, 26, 20, 9, 11, 9],
    rows: [[H('الترتيب'), H('الطالب'), H('المجموعة'), H('النقاط'), H('المستوى'), H('الحضور')], ...rk.map((r, i) => [{ v: i + 1, s: i < 3 ? 'FFD966' : 'n' }, { v: r.s.name, s: 'n' }, { v: (grp(r.s.gid) || {}).name || '', s: 'n' }, { v: r.st.pts, s: 'n' }, { v: lvlName(r.st.lvl), s: 'n' }, { v: r.st.pres + '/' + r.st.n, s: 'n' }])] });
  return XLSX.build(sheets);
}
