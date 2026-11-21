/* طلابي — المجموعات والطلاب وصفحة الطالب */
'use strict';
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
function bestDate(g) { const t = today(); if (isGroupDay(g, t) || !(g.days || []).length) return t; for (let i = 1; i < 8; i++) { const d = addDays(t, -i); if (isGroupDay(g, d)) return d; } return t; }
const smallChip = c => { const k = CODE(c); return `<span class="code on" style="min-width:34px;height:28px;font-size:13px;border-radius:9px;background:${k ? k.color : '#e5e7eb'}">${esc(c)}</span>`; };

/* ---------- المجموعات ---------- */
SCREENS.groups = () => bar('المجموعات', ar(S.groups.length) + ' مجموعة · ' + ar(S.students.length) + ' طالب') +
  (S.groups.length ? S.groups.map((g, i) => {
    const n = groupStudents(g.id).length, fee = has(g.fee) ? +g.fee : S.settings.fees[g.stage];
    return `<button class="row" style="animation-delay:${i * 35}ms" data-go="group" data-id="${g.id}"><div class="av" style="background:${gradOf(g)}">${ar(n)}</div>
      <div class="t"><b>${esc(g.name)}</b><small>${STAGES[g.stage].n} · ${(g.days || []).map(d => DAYS[d]).join(' و ') || 'من غير أيام'}${g.time ? ' · ⏰ ' + esc(g.time) : ''}</small></div><span class="chip">${money(fee)}</span></button>`;
  }).join('') : empty('👥', 'لسه مفيش مجموعات', '<p>دوس ＋ وضيف أول مجموعة</p>')) + `<button class="fab" data-act="addGroup">${ic('plus')}</button>`;

SCREENS.group = p => {
  const g = grp(p.id); if (!g) return bar('المجموعة') + empty('🤷', 'المجموعة دي اتحذفت');
  const mk = p.mk || monthKey(today()), sts = groupStudents(g.id), ses = sessionsOf(g.id, mk), rows = sts.map(s => ({ s, t: stats(s.id, mk) }));
  const att = avg(rows.filter(r => r.t.n).map(r => r.t.att)), paid = sts.filter(s => { const f = feeOf(s); return !f || paidIn(s.id, mk) >= f; }).length;
  return bar(esc(g.name), STAGES[g.stage].n + ' · ' + ar(sts.length) + ' طالب', `<button class="ib" data-act="editGroup" data-id="${g.id}">${ic('edit')}</button>`) +
    `<div class="hero" style="background:${gradOf(g)};margin-top:4px"><div class="top"><div><h1>${esc(g.name)}</h1><p>${(g.days || []).map(d => DAYS[d]).join(' و ') || 'من غير أيام ثابتة'}${g.time ? ' · ⏰ ' + esc(g.time) : ''}</p></div></div>
    <div class="kpis"><div class="kpi"><b>${ar(sts.length)}</b><small>طالب</small></div><div class="kpi"><b>${ar(ses.length)}</b><small>حصة</small></div><div class="kpi"><b>${pct(att)}</b><small>حضور</small></div><div class="kpi"><b>${ar(paid)}</b><small>دفعوا</small></div></div></div>
    <div class="btns" style="margin-bottom:12px"><button class="btn" data-go="session" data-gid="${g.id}" data-date="${bestDate(g)}">${ic('check')} تحضير الحصة</button><button class="btn wa" data-go="msgs" data-gid="${g.id}">${ic('chat')} التقارير</button></div>
    ${mnav(mk)}${rows.length ? rows.map((r, i) => `<button class="row" style="animation-delay:${Math.min(i, 15) * 25}ms" data-go="student" data-id="${r.s.id}">${avatar(r.s)}
      <div class="t"><b>${esc(r.s.name)}</b><small style="color:${lvlColor(r.t.lvl)}">${lvlName(r.t.lvl)} · حضور ${pct(r.t.att)} · ${ar(r.t.pts)} نقطة</small></div>
      <div style="display:flex;gap:3px">${r.t.list.slice(-3).map(({ x }) => smallChip(x.marks[r.s.id])).join('')}</div></button>`).join('')
      : empty('🎒', 'مفيش طلاب في المجموعة دي', '<p>دوس ＋ وضيف الطلاب</p>')}
    <button class="fab" data-act="addStudent" data-gid="${g.id}">${ic('plus')}</button>`;
};

ACT.addGroup = () => groupForm(null);
ACT.editGroup = a => groupForm(grp(a.dataset.id));
function groupForm(g) {
  const v = g || { name: '', stage: 'p', days: [], time: '', color: S.groups.length % PALETTE.length, fee: null };
  const st = { stage: v.stage, days: [...(v.days || [])], color: v.color || 0 };
  openSheet(`<h3>${g ? 'تعديل المجموعة' : 'مجموعة جديدة ✨'}</h3>
    <label class="f">اسم المجموعة</label><input id="gName" value="${esc(v.name)}" placeholder="مثلاً: تالتة إعدادي بنات">
    <label class="f">المرحلة</label><div class="seg" id="gStage">${Object.entries(STAGES).map(([k, s]) => `<button data-k="${k}" class="${st.stage === k ? 'on' : ''}">${s.n}</button>`).join('')}</div>
    <label class="f">أيام الحصة</label><div class="dayc" id="gDays">${DAYS.map((d, i) => `<button data-d="${i}" class="${st.days.includes(i) ? 'on' : ''}">${d}</button>`).join('')}</div>
    <label class="f">الميعاد</label><input id="gTime" type="time" value="${esc(v.time)}">
    <label class="f">سعر مخصوص للشهر (سيبه فاضي = سعر المرحلة)</label><input id="gFee" type="number" inputmode="numeric" value="${has(v.fee) ? v.fee : ''}">
    <label class="f">لون المجموعة</label><div class="colors" id="gCol">${PALETTE.map((p, i) => `<button data-c="${i}" class="${st.color === i ? 'on' : ''}" style="background:linear-gradient(135deg,${p[0]},${p[1]})"></button>`).join('')}</div>
    <div class="btns" style="margin-top:18px"><button class="btn" data-act="saveGroup">حفظ</button>${g ? `<button class="btn bad" data-act="delGroup">حذف</button>` : ''}</div>`, root => {
    root.querySelector('#gStage').onclick = e => { const b = e.target.closest('button'); if (!b) return; st.stage = b.dataset.k; root.querySelectorAll('#gStage button').forEach(x => x.classList.toggle('on', x === b)); };
    root.querySelector('#gDays').onclick = e => { const b = e.target.closest('button'); if (!b) return; const d = +b.dataset.d; st.days = st.days.includes(d) ? st.days.filter(x => x !== d) : st.days.concat(d); b.classList.toggle('on'); };
    root.querySelector('#gCol').onclick = e => { const b = e.target.closest('button'); if (!b) return; st.color = +b.dataset.c; root.querySelectorAll('#gCol button').forEach(x => x.classList.toggle('on', x === b)); };
  });
  ACT.saveGroup = () => {
    const name = $('#gName').value.trim(); if (!name) return toast('اكتب اسم المجموعة');
    const o = g || { id: uid() }, fee = $('#gFee').value.trim();
    Object.assign(o, { name, stage: st.stage, days: st.days.sort(), time: $('#gTime').value, color: st.color, fee: fee === '' ? null : +fee });
    if (!g) S.groups.push(o); save();
    toast(g ? 'اتحفظ ✓' : 'المجموعة اتعملت 🎉');
    closeSheet(false, () => g ? refresh() : go('group', { id: o.id }));
  };
  ACT.delGroup = () => closeSheet(false, () => ask('حذف المجموعة؟', `هيتمسح «${esc(g.name)}» و${ar(groupStudents(g.id).length)} طالب بكل حصصهم وفلوسهم.`, 'احذف نهائي', () => {
    const ids = new Set(groupStudents(g.id).map(s => s.id));
    S.groups = S.groups.filter(x => x !== g); S.students = S.students.filter(s => !ids.has(s.id)); S.sessions = S.sessions.filter(x => x.gid !== g.id); S.pays = S.pays.filter(p => !ids.has(p.sid));
    save(); toast('اتحذفت'); cur().s === 'group' ? back() : refresh();
  }, true));
}

/* ---------- الطلاب ---------- */
SCREENS.students = p => {
  MOUNT = () => { const i = $('#q'); i.value = p.q || ''; i.oninput = () => { p.q = i.value; $('#slist').innerHTML = studentRows(p); }; };
  return bar('الطلاب', ar(S.students.length) + ' طالب') + `<div class="search">${ic('search')}<input id="q" placeholder="دوّر باسم الطالب أو رقم التليفون" autocomplete="off"></div>
    <div class="chips">${[['', 'الكل'], ...S.groups.map(g => [g.id, g.name])].map(([id, n]) => `<button class="chip ${(p.f || '') === id ? 'on' : ''}" data-act="sfilter" data-f="${id}">${esc(n)}</button>`).join('')}</div>
    <div id="slist">${studentRows(p)}</div><button class="fab" data-act="addStudent" data-gid="${p.f || ''}">${ic('plus')}</button>`;
};
ACT.sfilter = a => { cur().p.f = a.dataset.f; refresh(); };
function studentRows(p) {
  const q = norm(p.q), qd = (p.q || '').replace(/\D/g, '').replace(/^0/, '');
  const list = S.students.filter(s => (!p.f || s.gid === p.f) && (!q || norm(s.name).includes(q) || (qd.length > 3 && (s.phone || '').includes(qd)))).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  if (!list.length) return empty('🔍', 'مفيش نتايج');
  return list.slice(0, 300).map((s, i) => { const g = grp(s.gid), o = owedTotal(s);
    return `<button class="row" style="animation-delay:${Math.min(i, 12) * 20}ms" data-go="student" data-id="${s.id}">${avatar(s)}<div class="t"><b>${esc(s.name)}</b><small>${esc(g ? g.name : '')}${s.phone ? ' · ' + showPhone(s.phone) : ''}</small></div>${o ? `<span class="chip" style="background:#ffe4e6;color:#be123c">${money(o)}</span>` : ''}</button>`;
  }).join('');
}

ACT.addStudent = a => studentForm(null, a.dataset.gid || (S.groups[0] || {}).id);
ACT.editStudent = a => studentForm(stu(a.dataset.id));
function studentForm(s, gid) {
  if (!S.groups.length) return toast('اعمل مجموعة الأول');
  const v = s || { name: '', phone: '', gid, fee: null, note: '' };
  const st = { mode: !has(v.fee) ? 'n' : +v.fee === 0 ? 'z' : 'c' };
  openSheet(`<h3>${s ? 'تعديل بيانات الطالب' : 'طالب جديد 🎒'}</h3>
    <label class="f">اسم الطالب</label><input id="sName" value="${esc(v.name)}" placeholder="الاسم">
    <label class="f">رقم ولي الأمر</label><input id="sPhone" type="tel" inputmode="tel" value="${esc(showPhone(v.phone))}" placeholder="01xxxxxxxxx">
    <label class="f">المجموعة</label><select id="sGroup">${S.groups.map(g => `<option value="${g.id}" ${g.id === v.gid ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>
    <label class="f">الاشتراك</label><div class="seg" id="sFeeM"><button data-m="n" class="${st.mode === 'n' ? 'on' : ''}">عادي</button><button data-m="c" class="${st.mode === 'c' ? 'on' : ''}">سعر مخصوص</button><button data-m="z" class="${st.mode === 'z' ? 'on' : ''}">معفي</button></div>
    <input id="sFee" type="number" inputmode="numeric" placeholder="السعر في الشهر" value="${st.mode === 'c' ? v.fee : ''}" style="margin-top:8px;${st.mode === 'c' ? '' : 'display:none'}">
    <label class="f">ملاحظات</label><input id="sNote" value="${esc(v.note)}" placeholder="أي ملاحظة">
    <div class="btns" style="margin-top:18px"><button class="btn" data-act="saveStudent">حفظ</button>${s ? `<button class="btn bad" data-act="delStudent">حذف</button>` : ''}</div>`, root => {
    root.querySelector('#sFeeM').onclick = e => { const b = e.target.closest('button'); if (!b) return; st.mode = b.dataset.m; root.querySelectorAll('#sFeeM button').forEach(x => x.classList.toggle('on', x === b)); $('#sFee').style.display = st.mode === 'c' ? '' : 'none'; };
    if (!s) setTimeout(() => $('#sName').focus(), 350);
  });
  ACT.saveStudent = () => {
    const name = $('#sName').value.replace(/\s+/g, ' ').trim(); if (!name) return toast('اكتب اسم الطالب');
    const o = s || { id: uid(), joined: today() }, fee = st.mode === 'n' ? null : st.mode === 'z' ? 0 : +$('#sFee').value || 0;
    Object.assign(o, { name, phone: normPhone($('#sPhone').value), gid: $('#sGroup').value, fee, note: $('#sNote').value.trim() });
    if (!s) S.students.push(o); save();
    toast(s ? 'اتحفظ ✓' : 'الطالب اتضاف 🎉');
    closeSheet(false, () => refresh());
  };
  ACT.delStudent = () => closeSheet(false, () => ask('حذف الطالب؟', `هيتمسح «${esc(s.name)}» بكل درجاته وفلوسه.`, 'احذف', () => {
    S.students = S.students.filter(x => x !== s); S.pays = S.pays.filter(p => p.sid !== s.id); S.sessions.forEach(x => { delete x.marks[s.id]; delete x.scores[s.id]; }); dropEmptySessions();
    save(); toast('اتحذف'); cur().s === 'student' ? back() : refresh();
  }, true));
}

/* ---------- صفحة الطالب ---------- */
function payBtn(st, mk) {
  const fee = feeOf(st), paid = paidIn(st.id, mk);
  if (!fee) return '<span class="chip">معفي 🎁</span>';
  if (paid >= fee) return `<button class="btn sm ok" data-act="togglePay" data-id="${st.id}" data-mk="${mk}">✓ دفع ${ar(fee)}</button>`;
  return `<button class="btn sm" data-act="togglePay" data-id="${st.id}" data-mk="${mk}">${paid ? 'كمّل ' + ar(fee - paid) : 'دفع ' + ar(fee)}</button>`;
}
ACT.togglePay = a => {
  const st = stu(a.dataset.id), mk = a.dataset.mk, fee = feeOf(st), paid = paidIn(st.id, mk);
  if (paid >= fee) return ask('إلغاء الدفع؟', `هيتشال دفع ${monthName(mk)} بتاع ${esc(st.name)}`, 'إلغاء الدفع', () => { unpay(st.id, mk); refresh(); toast('اتلغى'); }, true);
  payFull(st.id, mk); coin(a, '+' + ar(fee - paid)); ding(1046); toast('💰 اتسجل الدفع'); setTimeout(refresh, 250);
};
SCREENS.student = p => {
  const st = stu(p.id); if (!st) return bar('الطالب') + empty('🤷', 'الطالب ده اتحذف');
  const mk = p.mk || monthKey(today()), t = stats(st.id, mk), g = grp(st.gid), rk = ranking(st.gid, mk), pos = rk.findIndex(r => r.s.id === st.id), ow = owed(st);
  return bar(esc(st.name), esc(g ? g.name : ''), `<button class="ib" data-act="editStudent" data-id="${st.id}">${ic('edit')}</button>`) +
    `<div class="card c up" style="padding-top:20px">${avatar(st, 1)}
    <h2 style="margin:10px 0 0;font-weight:900">${esc(st.name)}</h2><p class="muted" style="margin:0">${esc(g ? g.name : '')}${st.phone ? ' · ' + showPhone(st.phone) : ''}${st.note ? ' · ' + esc(st.note) : ''}</p>
    ${st.phone ? `<div class="btns" style="margin-top:12px"><a class="btn sm g" href="tel:+${st.phone}">${ic('phone')} اتصال</a><a class="btn sm wa" href="https://wa.me/${st.phone}" target="_blank" rel="noopener">${ic('chat')} واتساب</a></div>` : `<p class="muted">مفيش رقم ولي أمر — <button class="chip" data-act="editStudent" data-id="${st.id}">ضيفه</button></p>`}</div>
    ${mnav(mk)}<div class="stats">
    <div class="stat"><i>📅</i><b>${pct(t.att)}</b><small>الحضور ${ar(t.pres)} من ${ar(t.n)}</small></div>
    <div class="stat" style="animation-delay:.05s"><i>⭐</i><b style="color:${lvlColor(t.lvl)}">${lvlName(t.lvl)}</b><small>المستوى</small></div>
    <div class="stat" style="animation-delay:.1s"><i>📝</i><b>${pct(t.hw)}</b><small>الواجب</small></div>
    <div class="stat" style="animation-delay:.15s"><i>🏆</i><b>${ar(t.pts)}</b><small>نقطة${pos >= 0 ? ' · الـ' + ar(pos + 1) + ' في مجموعته' : ''}</small></div></div>
    ${t.seq.length > 1 ? `<div class="card"><b>منحنى المستوى</b>${spark(t.seq, 320, 74)}</div>` : ''}
    <div class="card"><b>حصص ${monthName(mk)}</b><div class="tl" style="margin-top:10px">${t.list.map(({ x }) => `<div class="d">${smallChip(x.marks[st.id])}${ar(pdate(x.date).getDate())}/${ar(pdate(x.date).getMonth() + 1)}</div>`).join('') || '<span class="muted">مفيش حصص متسجلة الشهر ده</span>'}</div></div>
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>اشتراك ${monthName(mk)}</b>${payBtn(st, mk)}</div>
    ${ow.length ? `<p class="bad b9" style="margin:8px 0 0">عليه ${money(ow.reduce((a, x) => a + x.due, 0))} (${ow.map(x => MONTHS[+x.k.slice(5) - 1]).join('، ')})</p>` : '<p class="ok b9" style="margin:8px 0 0">مفيش عليه حاجة ✅</p>'}</div>
    <div class="btns"><button class="btn wa" data-act="sendReport" data-id="${st.id}" data-mk="${mk}">${ic('send')} ابعت تقرير الشهر</button>${ow.length ? `<button class="btn g" data-act="sendFee" data-id="${st.id}">${ic('bell')} فكّره بالفلوس</button>` : ''}</div>`;
};

/* ---------- إرسال رسالة لولي الأمر ---------- */
function msgSheet(st, text, key) {
  openSheet(`<h3>رسالة لولي أمر ${esc(st.name)}</h3><div class="msgbox">${esc(text)}</div>
    <div class="btns" style="margin-top:12px">${st.phone ? `<a class="btn wa" href="${waLink(st.phone, text)}" target="_blank" rel="noopener" data-act="markSent" data-id="${st.id}" data-k="${key}">${ic('chat')} واتساب</a><a class="btn g" href="${smsLink(st.phone, text)}" data-act="markSent" data-id="${st.id}" data-k="${key}">${ic('sms')} SMS</a>` : '<p class="bad b9" style="width:100%">مفيش رقم ولي أمر للطالب ده</p>'}<button class="btn g" data-act="copyMsg">نسخ</button></div>`);
  ACT.copyMsg = () => { try { navigator.clipboard.writeText(text).then(() => toast('اتنسخت ✓'), () => toast('مقدرتش أنسخ')); } catch (e) { toast('مقدرتش أنسخ'); } };
}
ACT.markSent = a => { S.sent[a.dataset.k + ':' + a.dataset.id] = Date.now(); save(); };
ACT.sendReport = a => { const st = stu(a.dataset.id), mk = a.dataset.mk || monthKey(today()); msgSheet(st, reportText(st.id, mk), 'r' + mk); };
ACT.sendFee = a => { const st = stu(a.dataset.id); msgSheet(st, feeText(st.id), 'f' + monthKey(today())); };
