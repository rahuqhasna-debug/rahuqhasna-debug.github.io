/* طلابي — إكسل والاستيراد والنسخة الاحتياطية والإعدادات */
'use strict';
function pickFile(accept, cb) { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => { if (i.files[0]) cb(i.files[0]); }; i.click(); }
function download(blob, name) { const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); }
async function shareFile(blob, name, title) {
  const f = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title }); return true; } catch (e) { if (e && e.name === 'AbortError') return false; } }
  download(blob, name); return true;
}

/* ---------- الإكسل والحفظ: كل حاجة في شاشة واحدة ---------- */
SCREENS.files = p => {
  const mk = p.mk || monthKey(today()), lb = S.settings.lastBackup, days = lb ? Math.floor((Date.now() - lb) / 864e5) : null;
  const head = (icn, a, b, t, s) => `<div class="fh"><span class="fi" style="background:linear-gradient(135deg,${a},${b})">${icS(icn, 26)}</span><div><b>${t}</b><small>${s}</small></div></div>`;
  return bar('الإكسل والحفظ', 'طلّع ودخّل واحفظ بياناتك') +
    `<div class="card up">${head('grid', '#4ade80', '#15803d', 'شيت إكسل بنفس شكل شيتك', 'ورقة لكل مجموعة بالرموز والألوان والحضور والنقاط ونص التقرير، وورقة للفلوس ولوحة الشرف')}
      ${mnav(mk)}<div class="btns"><button class="btn" data-act="xlsDown">${ic('down')} نزّله</button><button class="btn wa" data-act="xlsShare">${ic('share')} ابعته</button></div></div>
    <div class="card up" style="animation-delay:.06s">${head('import', '#2dd4bf', '#0f766e', 'دخّل شيت إكسل', 'كل ورقة فيها «اسم الطالب» بتبقى مجموعة، وعمود «رقم ولي الأمر» بيتاخد، وأي عمود عنوانه تاريخ بيتسجل حصة برموزها')}
      <button class="btn g w" data-act="pickXlsx">${ic('import')} اختار ملف الإكسل</button></div>
    <div class="card up" style="animation-delay:.12s">${head('shield', '#60a5fa', '#1d4ed8', 'النسخة الاحتياطية', (lb ? (days ? 'آخر نسخة من ' + ar(days) + ' يوم' : 'عملت نسخة النهارده ✓') : 'لسه ما عملتش نسخة') + ' · لو الموبايل ضاع أو اتمسح بترجّع كل حاجة')}
      <div class="btns"><button class="btn wa" data-act="bkShare">${ic('share')} ابعتها لنفسك</button><button class="btn g" data-act="bkDown">${ic('down')} احفظها</button></div>
      <button class="btn g w" style="margin-top:10px" data-act="restorePick">${ic('import')} رجّع نسخة قديمة</button></div>
    <p class="muted c" style="font-size:13px">💡 ابعت النسخة لنفسك على الواتساب مرة كل أسبوع</p>`;
};
SCREENS.excel = SCREENS.import = SCREENS.backup = SCREENS.files;
const xlsName = mk => 'متابعة_الطلاب_' + MONTHS[+mk.slice(5) - 1] + '_' + mk.slice(0, 4) + '.xlsx';
ACT.xlsDown = () => { const mk = cur().p.mk || monthKey(today()); toast('بجهّز الملف…'); setTimeout(() => { download(exportBook(mk), xlsName(mk)); toast('✅ الملف نزل في التنزيلات'); }, 60); };
ACT.xlsShare = async () => { const mk = cur().p.mk || monthKey(today()); await shareFile(exportBook(mk), xlsName(mk), 'متابعة الطلاب'); };

/* ---------- استيراد شيت ---------- */
ACT.pickXlsx = () => pickFile('.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', async f => {
  toast('بقرا الملف…');
  try {
    const data = parseSheetFile(await XLSX.read(await f.arrayBuffer()));
    if (!data.groups.length) return toast('مالقيتش ورقة فيها «اسم الطالب»');
    const nS = data.groups.reduce((a, g) => a + g.students.length, 0), nM = data.groups.reduce((a, g) => a + g.students.reduce((b, s) => b + Object.keys(s.marks).length, 0), 0);
    openSheet(`<h3>لقيت في الملف 🎉</h3><div class="stats"><div class="stat"><b>${ar(data.groups.length)}</b><small>مجموعة</small></div><div class="stat"><b>${ar(nS)}</b><small>طالب</small></div><div class="stat"><b>${ar(nM)}</b><small>رمز حصة</small></div><div class="stat"><b>${ar(data.groups.reduce((a, g) => a + g.students.filter(s => s.phone).length, 0))}</b><small>رقم ولي أمر</small></div></div>
      <div style="max-height:30vh;overflow:auto;margin-bottom:12px">${data.groups.map(g => `<div class="row" style="padding:8px 12px"><div class="t"><b>${esc(g.name)}</b><small>${STAGES[g.stage].n} · ${g.days.map(d => DAYS[d]).join(' و ') || '—'}</small></div><span class="chip">${ar(g.students.length)} طالب</span></div>`).join('')}</div>
      <div class="btns">${S.groups.length ? `<button class="btn" data-act="impGo" data-r="0">ضيف ودمج مع الموجود</button><button class="btn bad" data-act="impGo" data-r="1">امسح القديم وخد الملف</button>` : `<button class="btn" data-act="impGo" data-r="1">${ic('import')} دخّلهم البرنامج</button>`}</div>`);
    ACT.impGo = a => {
      const r = applyImport(data, a.dataset.r === '1');
      closeSheet(false, () => { NAV = [{ s: 'home', p: {} }]; render('fwd'); confetti(160); ding(1318); toast(`✅ ${ar(r.ng)} مجموعة جديدة و${ar(r.ns)} طالب`); });
    };
  } catch (e) { toast('مقدرتش أقرا الملف: ' + (e && e.message || e)); }
});

/* ---------- النسخة الاحتياطية ---------- */
const backupBlob = () => new Blob([JSON.stringify({ app: 'tlaby', v: 1, at: Date.now(), data: S })], { type: 'application/json' });
const backupName = () => 'طلابي_نسخة_' + today() + '.json';
const markBackup = () => { S.settings.lastBackup = Date.now(); save(); };
ACT.bkShare = async () => { if (await shareFile(backupBlob(), backupName(), 'نسخة طلابي')) { markBackup(); refresh(); toast('✅ تمام'); } };
ACT.bkDown = () => { download(backupBlob(), backupName()); markBackup(); refresh(); toast('✅ النسخة نزلت في التنزيلات'); };
ACT.restorePick = () => pickFile('.json,application/json', async f => {
  try {
    const j = JSON.parse(await f.text()), d = j && j.app === 'tlaby' ? j.data : j;
    if (!d || !Array.isArray(d.groups) || !Array.isArray(d.students)) return toast('الملف ده مش نسخة من البرنامج');
    ask('ترجّع النسخة دي؟', `فيها ${ar(d.groups.length)} مجموعة و${ar(d.students.length)} طالب. البيانات اللي على الموبايل دلوقتي هتتبدل بيها.`, 'رجّعها', () => {
      S = migrate(d); refreshCodes(); save(true); applyTheme(); NAV = [{ s: 'home', p: {} }]; render('fwd'); confetti(); toast('✅ النسخة رجعت');
    });
  } catch (e) { toast('الملف بايظ أو مش نسخة'); }
});

/* ---------- الإعدادات ---------- */
SCREENS.settings = () => {
  const s = S.settings;
  MOUNT = () => document.querySelectorAll('[data-set]').forEach(inp => { inp.onchange = () => {
    const k = inp.dataset.set, v = inp.type === 'checkbox' ? inp.checked : inp.value;
    if (k.startsWith('fee.')) s.fees[k.slice(4)] = +v || 0; else s[k] = v;
    save(); if (k === 'theme') applyTheme(); toast('اتحفظ ✓');
  }; });
  const tg = (k, t) => `<label class="row" style="cursor:pointer"><div class="t"><b>${t}</b></div><input type="checkbox" data-set="${k}" ${s[k] ? 'checked' : ''} style="width:24px;height:24px;accent-color:#7c3aed"></label>`;
  return bar('الإعدادات') + `<div class="card up"><label class="f" style="margin-top:0">اسم المستر</label><input data-set="teacher" value="${esc(s.teacher)}">
    <label class="f">المادة</label><input data-set="subject" value="${esc(s.subject)}">
    <label class="f">التوقيع في آخر رسايل الأهالي</label><input data-set="sign" value="${esc(s.sign)}"></div>
    <div class="card up"><b>سعر الشهر</b>${Object.entries(STAGES).map(([k, v]) => `<label class="f">${v.n}</label><input type="number" inputmode="numeric" data-set="fee.${k}" value="${s.fees[k]}">`).join('')}
    <label class="f">بداية حساب الاشتراكات من شهر</label><input type="month" data-set="startMonth" value="${s.startMonth}"></div>
    <button class="row up" data-go="codes"><div class="av" style="background:linear-gradient(135deg,#e879f9,#a21caf)">${icS('tag')}</div><div class="t"><b>دليل الرموز</b><small>معنى كل رمز ونقطه ورسالته لولي الأمر</small></div><span class="chev">${ic('next')}</span></button>
    <div class="card up"><b>الشكل</b><select data-set="theme" style="margin-top:10px"><option value="auto" ${s.theme === 'auto' ? 'selected' : ''}>تلقائي مع الموبايل</option><option value="light" ${s.theme === 'light' ? 'selected' : ''}>فاتح ☀️</option><option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>غامق 🌙</option></select></div>
    ${tg('sound', '🔔 أصوات خفيفة مع التسجيل')}    <button class="btn bad w" style="margin-top:16px" data-act="wipe">${ic('trash')} مسح كل البيانات</button>
    <p class="muted c" style="font-size:12.5px;margin-top:18px">طلابي · نسخة ٢ · شغال من غير نت 💜</p>`;
};
ACT.wipe = () => {
  openSheet(`<h3>مسح كل البيانات ⚠️</h3><p class="muted" style="margin-top:0">كل المجموعات والطلاب والحصص والفلوس هتتمسح من الموبايل. اعمل نسخة احتياطية الأول. اكتب كلمة <b>امسح</b> للتأكيد:</p><input id="wipeTxt" placeholder="امسح"><div class="btns" style="margin-top:14px"><button class="btn bad" data-act="wipeOk">امسح نهائي</button><button class="btn g" data-act="closeSheet">رجوع</button></div>`);
  ACT.wipeOk = () => { if ($('#wipeTxt').value.trim() !== 'امسح') return toast('اكتب «امسح» الأول'); const keep = S.settings; S = blank(); S.settings = Object.assign(S.settings, { teacher: keep.teacher, subject: keep.subject, sign: keep.sign, fees: keep.fees, theme: keep.theme }); refreshCodes(); save(true); closeSheet(false, () => { NAV = [{ s: 'home', p: {} }]; render('fwd'); toast('اتمسح كل حاجة'); }); };
};
