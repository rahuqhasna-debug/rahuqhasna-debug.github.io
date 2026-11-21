/* طلابي — تحضير الحصة والرموز والامتحانات والجدول */
'use strict';

/* ---------- اختيار الحصة ---------- */
SCREENS.pickSession = () => {
  const tg = todayGroups(), rest = S.groups.filter(g => !tg.includes(g));
  const card = (g, i) => { const n = groupStudents(g.id).length, d = bestDate(g), x = sessionOn(g.id, d), done = x ? Object.keys(x.marks).length : 0;
    return `<button class="row" style="animation-delay:${i * 35}ms" data-go="session" data-gid="${g.id}" data-date="${d}"><div class="av" style="background:${gradOf(g)}">${ic('check').replace('<svg', '<svg width="22" height="22"')}</div>
      <div class="t"><b>${esc(g.name)}</b><small>${fmtDay(d)}${g.time ? ' · ⏰ ' + esc(g.time) : ''} · ${ar(n)} طالب</small></div>${done ? `<span class="chip" style="background:#dcfce7;color:#166534">${ar(done)}/${ar(n)}</span>` : ''}</button>`; };
  return bar('تحضير الحصة', 'اختار المجموعة') + (tg.length ? `<div class="sec">النهارده</div>${tg.map(card).join('')}` : '') +
    (rest.length ? `<div class="sec">باقي المجموعات</div>${rest.map((g, i) => card(g, i + tg.length)).join('')}` : '') + (S.groups.length ? '' : empty('👥', 'اعمل مجموعة الأول'));
};

/* ---------- شاشة الحصة ---------- */
SCREENS.session = p => {
  const g = grp(p.gid); if (!g) return bar('الحصة') + empty('🤷', 'المجموعة دي اتحذفت');
  if (!p.date) p.date = bestDate(g);
  const date = p.date, x = sessionOn(g.id, date), marks = x ? x.marks : {}, sts = groupStudents(g.id), done = sts.filter(s => marks[s.id]).length;
  const cnt = { p: 0, a: 0, x: 0 }; sts.forEach(s => { const k = CODE(marks[s.id]); if (k) cnt[k.att]++; });
  const mk = monthKey(date), feeDue = s => feeOf(s) > 0 && dueMonths(s).includes(mk), nDue = sts.filter(feeDue).length, nPaid = sts.filter(s => feeDue(s) && paidIn(s.id, mk) >= feeOf(s)).length;
  const exam = x && Object.values(x.marks).some(c => CODE(c) && CODE(c).att === 'x');
  MOUNT = () => {
    document.querySelectorAll('.score').forEach(inp => { inp.onchange = () => { const v = inp.value.trim(); if (v === '') delete x.scores[inp.dataset.sid]; else x.scores[inp.dataset.sid] = +v; save(); }; });
    const mx = $('#exMax'); if (mx) mx.onchange = () => { x.max = +mx.value || 0; save(); refresh(); };
  };
  const avgScore = exam && x.max ? avg(Object.values(x.scores).filter(v => has(v)).map(Number)) : null;
  return bar(esc(g.name), (date === today() ? 'النهارده · ' : '') + fmtDay(date), `<button class="ib" data-act="sesDate">${ic('cal')}</button>`) +
    `<div class="mnav"><button class="ib" data-act="sesMove" data-d="-1">${ic('back')}</button><b>${fmtDay(date)}</b><button class="ib" data-act="sesMove" data-d="1">${ic('next')}</button></div>
    <div class="card" style="padding:14px"><div style="display:flex;align-items:center;gap:12px">${ring(sts.length ? done / sts.length : 0, 60, '#7c3aed', 'var(--line)')}
      <div style="flex:1"><b>اتسجل ${ar(done)} من ${ar(sts.length)}</b><div class="muted" style="font-size:13px">دوس على الطالب واختار الرمز، وهينقلك على اللي بعده لوحده ⚡ ولو دفع الشهر دوس 💰 اللي جنب اسمه</div></div></div>
      <div class="chips" style="margin-top:10px;padding-bottom:0"><button class="chip" data-act="allCode" data-c="ح">✅ الكل ح</button><button class="chip" data-act="allCode" data-c="حش">📖 الكل حش</button><button class="chip" data-act="allCode" data-c="حت">✍️ الكل حت</button><button class="chip" data-act="allCode" data-c="أ">📝 امتحان</button><button class="chip" data-act="allCode" data-c="غ">❌ الباقي غايب</button></div></div>
    ${exam ? `<div class="card" style="display:flex;align-items:center;gap:10px"><b style="flex:1">📝 حصة امتحان${avgScore != null ? ` · المتوسط ${ar(Math.round(avgScore * 10) / 10)}` : ''}</b><span class="muted">الدرجة من</span><input id="exMax" class="score" type="number" inputmode="numeric" value="${x.max || ''}" placeholder="20"></div>` : ''}
    ${sts.length ? sts.map(s => { const c = marks[s.id], k = CODE(c), fee = feeOf(s), pd = paidIn(s.id, mk);
      return `<div class="row" id="r-${s.id}" data-act="pickCode" data-sid="${s.id}" role="button">${avatar(s)}<div class="t"><b>${esc(s.name)}</b><small>${k ? esc(k.name) : 'لسه ما اتسجلش'}</small></div>
      ${k && k.att === 'x' && x.max ? `<input class="score" type="number" inputmode="decimal" data-sid="${s.id}" value="${has(x.scores[s.id]) ? x.scores[s.id] : ''}" placeholder="الدرجة">` : ''}${feeDue(s) ? `<button class="pay${pd >= fee ? ' on' : ''}" data-act="togglePay" data-id="${s.id}" data-mk="${mk}">${pd >= fee ? '✓ دفع' : '💰 ' + ar(fee - pd)}</button>` : ''}${codeChip(c)}</div>`; }).join('')
      : empty('🎒', 'مفيش طلاب في المجموعة', `<div class="btns" style="justify-content:center;margin-top:12px"><button class="btn" data-act="addStudent" data-gid="${g.id}">${ic('plus')} ضيف طالب</button><button class="btn g" data-go="import">${ic('import')} دخّلهم من شيت الإكسل</button></div>`)}
    <div class="sumbar"><div class="in"><div class="mini"><span>✅ ${ar(cnt.p + cnt.x)}</span><span style="color:var(--bad)">❌ ${ar(cnt.a)}</span><span>⏳ ${ar(sts.length - done)}</span>${nDue ? `<span style="color:var(--ok)">💰 ${ar(nPaid)}</span>` : ''}</div>
    ${cnt.a ? `<button class="btn sm wa" data-go="msgs" data-gid="${g.id}" data-type="abs" data-date="${date}">${ic('chat')} بلّغ الغايبين</button>` : `<button class="btn sm g" data-go="msgs" data-gid="${g.id}">${ic('chat')} التقارير</button>`}</div></div>`;
};
ACT.sesMove = a => {
  const p = cur().p, g = grp(p.gid), dir = +a.dataset.d; let d = p.date;
  for (let i = 0; i < 14; i++) { d = addDays(d, dir); if (!(g.days || []).length || isGroupDay(g, d) || sessionOn(g.id, d)) break; }
  p.date = d; render(dir > 0 ? 'back' : 'fwd');
};
ACT.sesDate = () => {
  openSheet(`<h3>اختار يوم الحصة</h3><input id="sesD" type="date" value="${cur().p.date}"><div class="btns" style="margin-top:14px"><button class="btn" data-act="sesDateOk">افتح</button></div>`);
  ACT.sesDateOk = () => { const v = $('#sesD').value; if (!v) return; closeSheet(false, () => { cur().p.date = v; refresh(); }); };
};
ACT.pickCode = a => codePicker(a.dataset.sid);
function codePicker(sid) {
  const p = cur().p, s = stu(sid), x = sessionOn(p.gid, p.date), cc = x && x.marks[sid];
  const sets = [['🌟 تسميع وواجب', S.codes.filter(k => k.lvl)], ['✅ حضور', S.codes.filter(k => !k.lvl && k.att === 'p')], ['❌ غياب و📝 امتحان', S.codes.filter(k => !k.lvl && k.att !== 'p')]];
  openSheet(`<h3 style="display:flex;align-items:center;gap:10px">${avatar(s)}<span>${esc(s.name)}</span></h3><div class="pick">${sets.map(([t, ks]) => `<h4>${t}</h4>` +
    ks.map((k, i) => `<button style="background:${k.color};animation-delay:${i * 18}ms" class="${cc === k.c ? 'on' : ''}" data-act="setCode" data-c="${esc(k.c)}" data-sid="${sid}"><b>${esc(k.c)}</b><small>${esc(k.name)}</small></button>`).join('')).join('')}</div>
    <div class="btns" style="margin-top:14px">${cc ? `<button class="btn g" data-act="setCode" data-c="" data-sid="${sid}">${ic('trash')} مسح الرمز</button>` : ''}<button class="btn g" data-act="closeSheet">قفل</button></div>`);
}
ACT.setCode = a => {
  const p = cur().p, sid = a.dataset.sid, c = a.dataset.c, x = ensureSession(p.gid, p.date);
  if (c) x.marks[sid] = c; else { delete x.marks[sid]; delete x.scores[sid]; }
  dropEmptySessions(); save(); tap();
  const k = CODE(c); ding(!c ? 440 : k && k.att === 'a' ? 300 : k && k.lvl === 4 ? 1046 : 740);
  const sts = groupStudents(p.gid), i = sts.findIndex(s => s.id === sid);
  const nxt = c ? sts.slice(i + 1).concat(sts.slice(0, i)).find(s => !x.marks[s.id]) : null;
  closeSheet(false, () => {
    refresh();
    if (nxt) { const el = document.getElementById('r-' + nxt.id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('hl'); } setTimeout(() => { if (!MODAL && cur().s === 'session') codePicker(nxt.id); }, 420); }
    else if (c && sts.length && sts.every(s => x.marks[s.id])) { confetti(); ding(1318); toast('🎉 تحضير الحصة خلص'); }
  });
};
ACT.allCode = a => {
  const p = cur().p, c = a.dataset.c, sts = groupStudents(p.gid), x = ensureSession(p.gid, p.date), left = sts.filter(s => !x.marks[s.id]);
  const apply = list => { list.forEach(s => { x.marks[s.id] = c; }); dropEmptySessions(); save(); refresh(); toast('اتسجل «' + c + '» لـ ' + ar(list.length) + ' طالب'); if (sts.every(s => x.marks[s.id])) confetti(80); };
  if (left.length) return apply(left);
  dropEmptySessions();
  if (c === 'غ') return toast('كل الطلاب متسجلين خلاص');
  ask('كل الطلاب متسجلين', 'تحب تخلي «' + c + '» للكل وتمسح اللي متسجل؟', 'أيوه للكل', () => apply(sts));
};

/* ---------- جدول الأسبوع ---------- */
SCREENS.week = () => {
  const t = today(), sat = addDays(t, -((dow(t) + 1) % 7));
  return bar('جدول الأسبوع', 'من السبت للجمعة') + `<div class="week">${Array.from({ length: 7 }, (_, i) => {
    const d = addDays(sat, i), gs = S.groups.filter(g => isGroupDay(g, d) || sessionOn(g.id, d)).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return `<div class="dy up ${d === t ? 'now' : ''}" style="animation-delay:${i * 50}ms"><h4><span>${DAYS[dow(d)]}${d === t ? ' · النهارده' : ''}</span><small class="muted">${ar(pdate(d).getDate())} ${MONTHS[pdate(d).getMonth()]}</small></h4>
      ${gs.length ? gs.map(g => { const x = sessionOn(g.id, d); return `<button class="row" style="margin-bottom:6px" data-go="session" data-gid="${g.id}" data-date="${d}"><div class="av" style="background:${gradOf(g)};width:36px;height:36px;border-radius:12px">${x ? '✓' : ''}</div><div class="t"><b>${esc(g.name)}</b><small>${g.time ? '⏰ ' + esc(g.time) : 'من غير ميعاد'}</small></div></button>`; }).join('') : '<span class="muted" style="font-size:14px">أجازة 😴</span>'}</div>`;
  }).join('')}</div>`;
};

/* ---------- الامتحانات ---------- */
SCREENS.exams = () => {
  const list = S.sessions.filter(x => Object.values(x.marks).some(c => CODE(c) && CODE(c).att === 'x')).sort(byDate).reverse();
  return bar('الامتحانات', ar(list.length) + ' امتحان') + (list.length ? list.map((x, i) => {
    const g = grp(x.gid) || { name: '' }, n = Object.values(x.marks).filter(c => CODE(c) && CODE(c).att === 'x').length, sc = Object.values(x.scores).filter(has).map(Number), a = avg(sc);
    return `<button class="row" style="animation-delay:${i * 30}ms" data-go="session" data-gid="${x.gid}" data-date="${x.date}"><div class="av" style="background:${gradOf(g)}">📝</div><div class="t"><b>${esc(g.name)}</b><small>${fmtDay(x.date)} · ${ar(n)} طالب</small></div>
      <span class="chip">${a != null && x.max ? 'متوسط ' + ar(Math.round(a * 10) / 10) + ' من ' + ar(x.max) : 'من غير درجات'}</span></button>`;
  }).join('') : empty('📝', 'مفيش امتحانات لسه', '<p>في شاشة الحصة دوس «📝 امتحان» وبعدها اكتب الدرجات</p>'));
};

/* ---------- دليل الرموز ---------- */
SCREENS.codes = () => bar('دليل الرموز', 'دوس على أي رمز تعدّل رسالته ونقطه') +
  `<div class="card" style="font-size:14px"><b>م</b> ممتاز · <b>جج</b> جيد جداً · <b>ج</b> متوسط · <b>ض</b> ضعيف<br><b>+</b> واجب كامل · <b>½</b> واجب ناقص · <b>-</b> من غير واجب</div>` +
  S.codes.map((k, i) => `<button class="row" style="animation-delay:${i * 25}ms;align-items:flex-start" data-act="editCode" data-c="${esc(k.c)}"><span class="code on" style="background:${k.color}">${esc(k.c)}</span>
    <div class="t"><b>${esc(k.name)}</b><small style="white-space:normal">${esc(k.msg)}</small></div><span class="chip">${k.att === 'x' ? 'بالدرجة' : ar(k.pts) + ' ن'}</span></button>`).join('') +
  `<button class="btn g w" style="margin-top:10px" data-act="resetCodes">رجّع الرسايل الأصلية</button>`;
ACT.editCode = a => {
  const k = CODE(a.dataset.c); if (!k) return;
  openSheet(`<h3><span class="code on" style="background:${k.color};display:inline-grid">${esc(k.c)}</span> ${esc(k.name)}</h3>
    <label class="f">الرسالة اللي بتروح لولي الأمر</label><textarea id="cMsg">${esc(k.msg)}</textarea>
    ${k.att === 'x' ? '' : `<label class="f">النقاط</label><input id="cPts" type="number" inputmode="numeric" value="${k.pts}">`}
    <div class="btns" style="margin-top:16px"><button class="btn" data-act="saveCode">حفظ</button></div>`);
  ACT.saveCode = () => { k.msg = $('#cMsg').value.trim() || k.msg; if ($('#cPts')) k.pts = +$('#cPts').value || 0; refreshCodes(); save(); toast('اتحفظ ✓'); closeSheet(false, refresh); };
};
ACT.resetCodes = () => ask('ترجّع الأصل؟', 'رسايل ونقاط الرموز هترجع زي الشيت الأصلي.', 'رجّع', () => {
  S.codes = DEFAULT_CODES.map(c => ({ ...c })).concat(S.codes.filter(k => !DEFAULT_CODES.some(d => d.c === k.c))); refreshCodes(); save(); refresh(); toast('رجعت ✓');
});
