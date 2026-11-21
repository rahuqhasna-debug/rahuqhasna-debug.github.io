/* طلابي — الفلوس ولوحة الشرف والإحصائيات والرسايل */
'use strict';
const filterChips = (p, act = 'pfilter') => `<div class="chips">${[['', 'الكل'], ...S.groups.map(g => [g.id, g.name])].map(([id, n]) => `<button class="chip ${(p.f || '') === id ? 'on' : ''}" data-act="${act}" data-f="${id}">${esc(n)}</button>`).join('')}</div>`;
ACT.pfilter = a => { cur().p.f = a.dataset.f; refresh(); };
ACT.pshow = a => { cur().p.show = a.dataset.v; refresh(); };

/* ---------- الفلوس ---------- */
SCREENS.money = p => {
  const mk = p.mk || monthKey(today()), show = p.show || 'all';
  const sts = S.students.filter(s => dueMonths(s).includes(mk) && (!p.f || s.gid === p.f)).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  const exp = sts.reduce((a, s) => a + feeOf(s), 0), got = sts.reduce((a, s) => a + paidIn(s.id, mk), 0);
  const isPaid = s => { const f = feeOf(s); return !f || paidIn(s.id, mk) >= f; }, nPaid = sts.filter(isPaid).length;
  const list = sts.filter(s => show === 'all' || (show === 'paid') === isPaid(s));
  const owing = S.students.filter(s => !p.f || s.gid === p.f).map(owedTotal).filter(t => t > 0);
  return bar('الفلوس', monthName(mk)) + mnav(mk) +
    `<div class="card donut up">${ring(exp ? got / exp : 0, 112, '#16a34a', 'var(--line)')}<div class="legend"><div><i style="background:#16a34a"></i>اتحصّل: <b>${money(got)}</b></div><div><i style="background:#e11d48"></i>باقي: <b>${money(Math.max(0, exp - got))}</b></div><div><i style="background:var(--line)"></i>المتوقع: <b>${money(exp)}</b></div><div class="muted" style="font-size:13px">دفعوا ${ar(nPaid)} من ${ar(sts.length)} طالب</div></div></div>
    ${owing.length ? `<div class="banner">💸 عليهم فلوس من كل الشهور: ${ar(owing.length)} طالب · ${money(owing.reduce((a, t) => a + t, 0))}<button class="btn sm" data-go="debts" data-f="${p.f || ''}">شوفهم</button></div>` : ''}${filterChips(p)}<div class="seg" style="margin-bottom:12px">${[['all', 'الكل'], ['no', 'لسه ما دفعوش'], ['paid', 'دفعوا']].map(([v, t]) => `<button class="${show === v ? 'on' : ''}" data-act="pshow" data-v="${v}">${t}</button>`).join('')}</div>
    ${p.f && nPaid < sts.length ? `<button class="btn g w" style="margin-bottom:12px" data-act="payGroup">✓ علّم «${esc((grp(p.f) || {}).name || '')}» كلها دفعت</button>` : ''}
    ${list.length ? list.slice(0, 300).map((s, i) => { const g = grp(s.gid), pd = paidIn(s.id, mk);
      return `<div class="row" style="animation-delay:${Math.min(i, 12) * 20}ms" data-act="payMenu" data-id="${s.id}" role="button">${avatar(s)}<div class="t"><b>${esc(s.name)}</b><small>${esc(g ? g.name : '')}${pd && pd < feeOf(s) ? ' · دفع ' + ar(pd) : ''}</small></div>${payBtn(s, mk)}</div>`; }).join('') : empty('🎉', show === 'no' ? 'كله دفع!' : 'مفيش حد هنا')}`;
};
ACT.payGroup = () => {
  const p = cur().p, mk = p.mk || monthKey(today()), g = grp(p.f), left = groupStudents(p.f).filter(s => dueMonths(s).includes(mk) && feeOf(s) > paidIn(s.id, mk));
  ask('كل المجموعة دفعت؟', `هيتسجل دفع ${monthName(mk)} لـ ${ar(left.length)} طالب في «${esc(g.name)}».`, 'أيوه سجّل', () => { left.forEach(s => payFull(s.id, mk)); confetti(90); ding(1046); toast('💰 اتسجل لـ ' + ar(left.length) + ' طالب'); refresh(); });
};
ACT.payMenu = a => {
  const st = stu(a.dataset.id), mk = cur().p.mk || monthKey(today()), fee = feeOf(st), pd = paidIn(st.id, mk);
  openSheet(`<h3 style="display:flex;align-items:center;gap:10px">${avatar(st)}<span>${esc(st.name)}<small class="muted" style="display:block;font-size:13px">${monthName(mk)} · الاشتراك ${money(fee)} · دفع ${money(pd)}</small></span></h3>
    <label class="f">دفع مبلغ</label><div style="display:flex;gap:8px"><input id="pAmt" type="number" inputmode="numeric" value="${Math.max(0, fee - pd) || ''}"><button class="btn" data-act="payAmt">سجّل</button></div>
    <div class="btns" style="margin-top:14px">${pd ? `<button class="btn g" data-act="payUndo">${ic('trash')} إلغاء دفع الشهر</button>` : ''}<button class="btn g" data-go="student" data-id="${st.id}">صفحة الطالب</button></div>`);
  ACT.payAmt = () => { const v = +$('#pAmt').value; if (!(v > 0)) return toast('اكتب المبلغ'); S.pays.push({ id: uid(), sid: st.id, month: mk, amount: v, date: today() }); save(); ding(1046); toast('💰 اتسجل ' + ar(v) + ' جنيه'); closeSheet(false, refresh); };
  ACT.payUndo = () => { unpay(st.id, mk); toast('اتلغى'); closeSheet(false, refresh); };
};

/* ---------- عليهم فلوس ---------- */
SCREENS.debts = p => {
  const rows = S.students.filter(s => !p.f || s.gid === p.f).map(s => ({ s, o: owed(s) })).filter(r => r.o.length).sort((a, b) => b.o.reduce((x, y) => x + y.due, 0) - a.o.reduce((x, y) => x + y.due, 0));
  const tot = rows.reduce((a, r) => a + r.o.reduce((x, y) => x + y.due, 0), 0);
  return bar('عليهم فلوس', ar(rows.length) + ' طالب') + `<div class="hero" style="background:linear-gradient(135deg,#e11d48,#f97316);margin-top:4px;padding:18px"><div class="top"><div><p>إجمالي اللي برّه</p><h1 style="font-size:30px">${money(tot)}</h1></div><div class="wx">💸</div></div></div>
    ${filterChips(p)}${rows.length ? rows.slice(0, 300).map((r, i) => {
      const g = grp(r.s.gid), t = r.o.reduce((x, y) => x + y.due, 0);
      return `<div class="row" style="animation-delay:${Math.min(i, 12) * 20}ms">${avatar(r.s)}<div class="t" data-go="student" data-id="${r.s.id}"><b>${esc(r.s.name)}</b><small>${esc(g ? g.name : '')} · ${r.o.map(x => MONTHS[+x.k.slice(5) - 1]).join('، ')}</small></div>
        <b class="bad">${money(t)}</b><button class="ib" data-act="payAll" data-id="${r.s.id}" style="color:#16a34a">${ic('wallet')}</button></div>`;
    }).join('') : empty('🥳', 'مفيش حد عليه فلوس', '<p>كله دافع — عاش يا مستر</p>')}`;
};
ACT.payAll = a => {
  const st = stu(a.dataset.id), o = owed(st), t = o.reduce((x, y) => x + y.due, 0);
  ask('تسجيل دفع', `${esc(st.name)} دفع ${money(t)} (${o.map(x => MONTHS[+x.k.slice(5) - 1]).join('، ')})؟`, 'أيوه دفع', () => {
    o.forEach(x => S.pays.push({ id: uid(), sid: st.id, month: x.k, amount: x.due, date: today() })); save(); ding(1046); toast('💰 اتسجل ' + money(t)); refresh();
  });
};

/* ---------- لوحة الشرف ---------- */
SCREENS.board = p => {
  const mk = p.mk || monthKey(today()), rk = ranking(p.f || null, mk), top = rk.slice(0, 3), rest = rk.slice(3, 30), mx = rk.length ? rk[0].st.pts || 1 : 1;
  if (top.length) MOUNT = () => setTimeout(() => { if (cur().s === 'board') { confetti(110); ding(1318); } }, 700);
  const pod = (r, cls, medal) => r ? `<div class="pod ${cls}" data-go="student" data-id="${r.s.id}">${avatar(r.s)}<b>${esc(r.s.name)}</b><div class="st">${medal}<small>${ar(r.st.pts)} نقطة</small></div></div>` : '<div class="pod"></div>';
  return bar('لوحة الشرف 🏆', monthName(mk)) + mnav(mk) + filterChips(p) +
    (top.length ? `<button class="btn w" style="margin-bottom:4px" data-act="boardImg">${ic('share')} ابعتها صورة على الواتساب 📸</button><div class="podium">${pod(top[1], 'p2', '🥈')}${pod(top[0], 'p1', '🥇')}${pod(top[2], 'p3', '🥉')}</div>` +
      rest.map((r, i) => `<button class="row" style="animation-delay:${i * 25}ms" data-go="student" data-id="${r.s.id}"><b style="width:28px;text-align:center;color:var(--mut)">${ar(i + 4)}</b>${avatar(r.s)}<div class="t"><b>${esc(r.s.name)}</b><div class="prog" style="margin-top:6px"><i style="width:${Math.round(r.st.pts / mx * 100)}%"></i></div></div><span class="chip">${ar(r.st.pts)} ن</span></button>`).join('')
      : empty('🏆', 'لسه مفيش نقاط الشهر ده', '<p>النقاط بتتحسب لوحدها من رموز الحصص</p>'));
};

/* ---------- صورة لوحة الشرف (تتبعت على جروب الواتساب) ---------- */
const CF = 'Cairo, Tahoma, sans-serif';
function fitTxt(x, t, maxW, size, min, w = 800) {
  for (let s = size; s >= min; s -= 2) { x.font = `${w} ${s}px ${CF}`; if (x.measureText(t).width <= maxW) return t; }
  let u = t; while (u.length > 1 && x.measureText(u + '…').width > maxW) u = u.slice(0, -1); return u + '…';
}
function rrect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
async function boardImage(mk, f) {
  const rk = ranking(f || null, mk).slice(0, 10); if (!rk.length) return null;
  try { await Promise.all(['900 84px Cairo', '800 36px Cairo', '700 30px Cairo'].map(v => document.fonts.load(v))); } catch (e) {}
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.direction = 'rtl'; x.textBaseline = 'middle'; x.textAlign = 'center';
  const bg = x.createLinearGradient(W, 0, 0, H); bg.addColorStop(0, '#6d28d9'); bg.addColorStop(.55, '#a21caf'); bg.addColorStop(1, '#db2777'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,255,255,.08)'; [[90, 110, 240], [1010, 1260, 330], [1000, 120, 120], [60, 980, 150]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); });
  const cc = ['#fde68a', '#fbcfe8', '#a5f3fc', '#bbf7d0', '#ffffff'];
  for (let i = 0; i < 46; i++) { const side = i % 2, px = side ? 830 + Math.random() * 230 : 20 + Math.random() * 230, py = 30 + Math.random() * 270;
    x.save(); x.globalAlpha = .45 + Math.random() * .45; x.fillStyle = cc[i % 5]; x.translate(px, py); x.rotate(Math.random() * 3.1); x.fillRect(-8, -3.5, 16, 7); x.restore(); }
  x.fillStyle = '#fff'; x.font = `900 84px ${CF}`; x.fillText('لوحة الشرف 🏆', W / 2, 118);
  x.globalAlpha = .92; x.fillText(fitTxt(x, (f ? (grp(f) || {}).name : 'كل المجموعات') + ' · ' + monthName(mk), 860, 40, 26, 800), W / 2, 196); x.globalAlpha = 1;
  const floor = 790;
  [[0, W / 2, 360, 82, 210, '#fde68a', '#f59e0b', '🥇'], [1, W - 240, 420, 68, 160, '#f8fafc', '#94a3b8', '🥈'], [2, 240, 450, 68, 125, '#fed7aa', '#ea580c', '🥉']].forEach(([i, cx, cy, r, bh, c1, c2, md]) => {
    const it = rk[i]; if (!it) return;
    const [a, b] = groupColor(grp(it.s.gid)), gr = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r); gr.addColorStop(0, a); gr.addColorStop(1, b);
    x.save(); x.shadowColor = 'rgba(40,0,60,.35)'; x.shadowBlur = 26; x.shadowOffsetY = 10; x.beginPath(); x.arc(cx, cy, r + 8, 0, 7); x.fillStyle = '#fff'; x.fill(); x.restore();
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = gr; x.fill();
    x.fillStyle = '#fff'; x.font = `900 ${Math.round(r * .6)}px ${CF}`; x.fillText(initials(it.s.name), cx, cy + 4);
    x.font = `${Math.round(r * .78)}px sans-serif`; x.fillText(md, cx + r * .74, cy + r * .66);
    x.fillText(fitTxt(x, it.s.name, 280, 38, 24, 900), cx, cy + r + 48);
    x.globalAlpha = .9; x.font = `700 30px ${CF}`; x.fillText(ar(it.st.pts) + ' نقطة', cx, cy + r + 94); x.globalAlpha = 1;
    const top = floor - bh, g2 = x.createLinearGradient(0, top, 0, floor); g2.addColorStop(0, c1); g2.addColorStop(1, c2);
    x.save(); x.shadowColor = 'rgba(40,0,60,.3)'; x.shadowBlur = 20; rrect(x, cx - 130, top, 260, bh, 26); x.fillStyle = g2; x.fill(); x.restore();
    x.fillStyle = 'rgba(255,255,255,.95)'; x.font = `900 80px ${CF}`; x.fillText(ar(i + 1), cx, top + bh / 2 + 6);
  });
  rrect(x, 70, floor - 4, W - 140, 12, 6); x.fillStyle = 'rgba(255,255,255,.55)'; x.fill();
  let y = 826;
  rk.slice(3).forEach((it, j) => {
    rrect(x, 70, y, W - 140, 56, 20); x.fillStyle = 'rgba(255,255,255,.16)'; x.fill();
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = `900 30px ${CF}`; x.fillText(ar(j + 4), W - 115, y + 30);
    x.textAlign = 'right'; x.fillText(fitTxt(x, it.s.name + (f ? '' : ' · ' + ((grp(it.s.gid) || {}).name || '')), 620, 30, 22, 800), W - 160, y + 30);
    x.textAlign = 'left'; x.font = `800 28px ${CF}`; x.fillText(ar(it.st.pts) + ' نقطة', 105, y + 30);
    y += 64;
  });
  x.textAlign = 'center'; x.fillStyle = '#fff';
  if (rk.length <= 3) { x.font = `800 42px ${CF}`; x.fillText('برافو يا أبطال 👏 كمّلوا كده', W / 2, 1010); }
  x.globalAlpha = .92; x.font = `800 32px ${CF}`; x.fillText('⭐ ' + S.settings.teacher + ' · ' + S.settings.subject + ' ⭐', W / 2, H - 46); x.globalAlpha = 1;
  return new Promise(ok => c.toBlob(ok, 'image/jpeg', .92));
}
ACT.boardImg = async () => {
  const p = cur().p, mk = p.mk || monthKey(today()); toast('بجهّز الصورة… 🎨');
  const b = await boardImage(mk, p.f); if (!b) return toast('لسه مفيش نقاط الشهر ده');
  await shareFile(b, 'لوحة_الشرف_' + MONTHS[+mk.slice(5) - 1] + '.jpg', 'لوحة الشرف');
};

/* ---------- الإحصائيات ---------- */
SCREENS.reports = p => {
  const mk = p.mk || monthKey(today()), ses = S.sessions.filter(x => x.date.startsWith(mk));
  let pres = 0, abs = 0; const lv = { 4: 0, 3: 0, 2: 0, 1: 0 };
  ses.forEach(x => Object.values(x.marks).forEach(c => { const k = CODE(c); if (!k) return; k.att === 'a' ? abs++ : pres++; if (k.lvl) lv[k.lvl]++; }));
  const lvT = lv[4] + lv[3] + lv[2] + lv[1], exp = monthExpected(mk), got = monthIncome(mk);
  const gAtt = S.groups.map(g => { let a = 0, b = 0; sessionsOf(g.id, mk).forEach(x => Object.values(x.marks).forEach(c => { const k = CODE(c); if (k) { b++; if (k.att !== 'a') a++; } })); return { g, v: b ? a / b : null }; });
  const watch = S.students.map(s => ({ s, t: stats(s.id, mk) })).filter(r => r.t.abs >= 2 || (r.t.lvl != null && r.t.lvl < 1.7)).sort((a, b) => b.t.abs - a.t.abs || (a.t.lvl || 9) - (b.t.lvl || 9)).slice(0, 12);
  const nEx = S.sessions.filter(x => Object.values(x.marks).some(c => CODE(c) && CODE(c).att === 'x')).length;
  return bar('الإحصائيات', monthName(mk)) + mnav(mk) + `<div class="stats">
    <div class="stat"><i>🎓</i><b>${ar(S.students.length)}</b><small>طالب في ${ar(S.groups.length)} مجموعة</small></div>
    <div class="stat" style="animation-delay:.05s"><i>📅</i><b>${pct(pres + abs ? pres / (pres + abs) : null)}</b><small>نسبة الحضور (${ar(ses.length)} حصة)</small></div>
    <div class="stat" style="animation-delay:.1s"><i>💰</i><b>${money(got)}</b><small>اتحصّل من ${money(exp)}</small></div>
    <div class="stat" style="animation-delay:.15s"><i>⭐</i><b>${pct(lvT ? (lv[4] + lv[3]) / lvT : null)}</b><small>تسميع ممتاز وجيد جداً</small></div></div>
    <button class="row" data-go="exams"><div class="av" style="background:linear-gradient(135deg,#c084fc,#7e22ce)">📝</div><div class="t"><b>الامتحانات</b><small>${ar(nEx)} امتحان · الدرجات والمتوسطات</small></div><span class="chev">${ic('next')}</span></button>
    <div class="card"><b>الحضور في كل مجموعة</b><div class="bars" style="margin-top:12px">${gAtt.map(({ g, v }) => `<div class="br"><span>${esc(g.name)}</span><div class="prog"><i style="width:${Math.round((v || 0) * 100)}%;background:${gradOf(g)}"></i></div><b>${pct(v)}</b></div>`).join('')}</div></div>
    <div class="card"><b>مستوى التسميع</b><div class="bars" style="margin-top:12px">${[[4, 'ممتاز', '#16a34a'], [3, 'جيد جداً', '#2563eb'], [2, 'متوسط', '#ca8a04'], [1, 'ضعيف', '#ea580c']].map(([k, t, c]) => `<div class="br"><span>${t}</span><div class="prog"><i style="width:${lvT ? Math.round(lv[k] / lvT * 100) : 0}%;background:${c}"></i></div><b>${ar(lv[k])}</b></div>`).join('')}</div></div>
    <div class="sec">محتاجين متابعة 👀 <small>غياب كتير أو مستوى ضعيف</small></div>
    ${watch.length ? watch.map((r, i) => `<button class="row" style="animation-delay:${i * 25}ms" data-go="student" data-id="${r.s.id}">${avatar(r.s)}<div class="t"><b>${esc(r.s.name)}</b><small>${esc((grp(r.s.gid) || {}).name || '')}</small></div>${r.t.abs ? `<span class="chip" style="background:#ffe4e6;color:#be123c">غاب ${ar(r.t.abs)}</span>` : ''}<span class="chip" style="color:${lvlColor(r.t.lvl)}">${lvlName(r.t.lvl)}</span></button>`).join('') : empty('💪', 'كله تمام الشهر ده')}`;
};

/* ---------- رسايل الأهالي (واحد ورا التاني) ---------- */
SCREENS.msgs = p => {
  const type = p.type || 'rep', mk = p.mk || monthKey(today()), date = p.date || today();
  let list = [], key = '', make = null;
  const inG = s => !p.gid || s.gid === p.gid;
  if (type === 'rep') { key = 'r' + mk; make = s => reportText(s.id, mk); list = S.students.filter(s => inG(s) && S.sessions.some(x => x.marks[s.id] && x.date.startsWith(mk))); }
  if (type === 'abs') { key = 'a' + date; make = s => absenceText(s.id, date); list = S.students.filter(s => inG(s) && S.sessions.some(x => x.date === date && x.gid === s.gid && CODE(x.marks[s.id]) && CODE(x.marks[s.id]).att === 'a')); }
  list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  const sent = s => S.sent[key + ':' + s.id], withPhone = list.filter(s => s.phone), done = withPhone.filter(sent).length, nxt = withPhone.find(s => !sent(s));
  return bar('رسايل الأهالي', p.gid ? esc((grp(p.gid) || {}).name || '') : 'كل المجموعات') +
    `<div class="seg" style="margin-bottom:10px">${[['rep', '📋 تقرير الشهر'], ['abs', '❌ الغياب']].map(([v, t]) => `<button class="${type === v ? 'on' : ''}" data-act="mtype" data-v="${v}">${t}</button>`).join('')}</div>
    ${type === 'rep' ? mnav(mk) : type === 'abs' ? `<div class="mnav"><span class="muted" style="padding:0 10px">يوم الحصة</span><input type="date" id="mDate" value="${date}" style="width:auto;border:0;background:transparent;font-weight:900"></div>` : ''}
    <div class="chips">${[['', 'الكل'], ...S.groups.map(g => [g.id, g.name])].map(([id, n]) => `<button class="chip ${(p.gid || '') === id ? 'on' : ''}" data-act="mgroup" data-f="${id}">${esc(n)}</button>`).join('')}</div>
    ${list.length ? `<div class="card"><div style="display:flex;justify-content:space-between;font-weight:900"><span>اتبعت ${ar(done)} من ${ar(withPhone.length)}</span>${list.length - withPhone.length ? `<span class="muted" style="font-size:13px">${ar(list.length - withPhone.length)} من غير رقم</span>` : ''}</div><div class="prog" style="margin-top:8px"><i style="width:${withPhone.length ? Math.round(done / withPhone.length * 100) : 0}%"></i></div>
      ${nxt ? `<a class="btn wa w" style="margin-top:12px" href="${waLink(nxt.phone, make(nxt))}" target="_blank" rel="noopener" data-act="markSent" data-id="${nxt.id}" data-k="${key}">${ic('send')} ابعت لـ ${esc(nxt.name)}</a>` : '<p class="ok b9 c" style="margin:12px 0 0">🎉 خلصت الكل</p>'}</div>` +
      list.map((s, i) => `<div class="row" style="animation-delay:${Math.min(i, 12) * 20}ms">${avatar(s)}<div class="t" data-act="previewMsg" data-id="${s.id}"><b>${esc(s.name)}</b><small>${s.phone ? (sent(s) ? '✅ اتبعتت' : 'دوس هنا تشوف الرسالة') : '⚠️ مفيش رقم'}</small></div>
        ${s.phone ? `<a class="ib" style="color:#128c7e" href="${waLink(s.phone, make(s))}" target="_blank" rel="noopener" data-act="markSent" data-id="${s.id}" data-k="${key}">${ic('chat')}</a>` : ''}</div>`).join('')
      : empty(type === 'abs' ? '🙌' : '📭', type === 'abs' ? 'مفيش غياب في اليوم ده' : 'مفيش حصص متسجلة الشهر ده')}`;
};
ACT.mtype = a => { cur().p.type = a.dataset.v; refresh(); };
ACT.mgroup = a => { cur().p.gid = a.dataset.f; refresh(); };
ACT.previewMsg = a => { const p = cur().p, s = stu(a.dataset.id), type = p.type || 'rep', mk = p.mk || monthKey(today()), date = p.date || today();
  msgSheet(s, type === 'abs' ? absenceText(s.id, date) : reportText(s.id, mk), type === 'abs' ? 'a' + date : 'r' + mk); };
document.addEventListener('change', e => { if (e.target.id === 'mDate' && e.target.value) { cur().p.date = e.target.value; refresh(); } });
