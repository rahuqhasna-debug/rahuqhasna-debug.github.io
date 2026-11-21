/* طلابي — إكسل والاستيراد والنسخة الاحتياطية والإعدادات */
'use strict';
function pickFile(accept, cb) { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => { if (i.files[0]) cb(i.files[0]); }; i.click(); }
function download(blob, name) { const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); }
async function shareFile(blob, name, title) {
  const f = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title }); return true; } catch (e) { if (e && e.name === 'AbortError') return false; } }
  download(blob, name); return true;
}

/* ---------- ملف إكسل ---------- */
SCREENS.excel = p => {
  const mk = p.mk || monthKey(today());
  return bar('ملف إكسل', 'بنفس شكل الشيت بتاعك') + mnav(mk) + `<div class="card up"><b>الملف هيبقى فيه:</b>
    <p style="margin:8px 0 0;line-height:2">📋 دليل الرموز<br>👥 شيت لكل مجموعة: الرموز بالألوان + الحضور + المستوى + النقاط + نص التقرير<br>💰 فلوس ${MONTHS[+mk.slice(5) - 1]}: مين دفع ومين لأ والإجمالي<br>🏆 لوحة الشرف</p></div>
    <div class="btns"><button class="btn" data-act="xlsDown">${ic('down')} نزّل الملف</button><button class="btn wa" data-act="xlsShare">${ic('share')} ابعته (واتساب/درايف)</button></div>`;
};
const xlsName = mk => 'متابعة_الطلاب_' + MONTHS[+mk.slice(5) - 1] + '_' + mk.slice(0, 4) + '.xlsx';
ACT.xlsDown = () => { const mk = cur().p.mk || monthKey(today()); toast('بجهّز الملف…'); setTimeout(() => { download(exportBook(mk), xlsName(mk)); toast('✅ الملف نزل في التنزيلات'); }, 60); };
ACT.xlsShare = async () => { const mk = cur().p.mk || monthKey(today()); await shareFile(exportBook(mk), xlsName(mk), 'متابعة الطلاب'); };

/* ---------- استيراد شيت ---------- */
SCREENS.import = () => bar('استيراد شيت', 'من ملف إكسل') + `<div class="card up"><b>إزاي؟</b><p style="margin:8px 0 0;line-height:1.9">اختار ملف الإكسل (زي «شيت متابعة الطلاب»). كل ورقة فيها «اسم الطالب» هتبقى مجموعة، وعمود «رقم ولي الأمر» هيتاخد، وأي عمود عنوانه تاريخ (زي «الثلاثاء 3/11/2026») هيتسجل كحصة برموزها. ولو فيه ورقة «دليل الرموز» هتتاخد رسايلها ونقطها.</p></div>
  <button class="btn w" data-act="pickXlsx">${ic('import')} اختار ملف الإكسل</button>`;
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
SCREENS.backup = () => {
  const lb = S.settings.lastBackup, days = lb ? Math.floor((Date.now() - lb) / 864e5) : null;
  return bar('النسخة الاحتياطية', 'عشان بياناتك ما تضيعش') + `<div class="hero" style="background:linear-gradient(135deg,#2563eb,#7c3aed);margin-top:4px"><div class="top"><div><h1>${lb ? (days ? 'آخر نسخة من ' + ar(days) + ' يوم' : 'عملت نسخة النهارده ✓') : 'لسه ما عملتش نسخة'}</h1><p>البيانات كلها على الموبايل ده. لو الموبايل ضاع أو اتمسح، النسخة بترجّع كل حاجة.</p></div><div class="wx">🛡️</div></div></div>
    <div class="btns" style="flex-direction:column"><button class="btn wa w" data-act="bkShare">${ic('share')} ابعت النسخة لنفسك على واتساب أو درايف</button><button class="btn w" data-act="bkDown">${ic('down')} احفظها على الموبايل</button><button class="btn g w" data-act="restorePick">${ic('import')} رجّع نسخة قديمة</button></div>
    <p class="muted c" style="font-size:13px">💡 نصيحة: ابعتها لنفسك على واتساب كل أسبوع</p>`;
};
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
    <div class="card up"><b>الشكل</b><select data-set="theme" style="margin-top:10px"><option value="auto" ${s.theme === 'auto' ? 'selected' : ''}>تلقائي مع الموبايل</option><option value="light" ${s.theme === 'light' ? 'selected' : ''}>فاتح ☀️</option><option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>غامق 🌙</option></select></div>
    ${tg('sound', '🔔 أصوات خفيفة مع التسجيل')}    <button class="btn bad w" style="margin-top:16px" data-act="wipe">${ic('trash')} مسح كل البيانات</button>
    <p class="muted c" style="font-size:12.5px;margin-top:18px">طلابي · نسخة ١ · شغال من غير نت 💜</p>`;
};
ACT.wipe = () => {
  openSheet(`<h3>مسح كل البيانات ⚠️</h3><p class="muted" style="margin-top:0">كل المجموعات والطلاب والحصص والفلوس هتتمسح من الموبايل. اعمل نسخة احتياطية الأول. اكتب كلمة <b>امسح</b> للتأكيد:</p><input id="wipeTxt" placeholder="امسح"><div class="btns" style="margin-top:14px"><button class="btn bad" data-act="wipeOk">امسح نهائي</button><button class="btn g" data-act="closeSheet">رجوع</button></div>`);
  ACT.wipeOk = () => { if ($('#wipeTxt').value.trim() !== 'امسح') return toast('اكتب «امسح» الأول'); const keep = S.settings; S = blank(); S.settings = Object.assign(S.settings, { teacher: keep.teacher, subject: keep.subject, sign: keep.sign, fees: keep.fees, theme: keep.theme }); refreshCodes(); save(true); closeSheet(false, () => { NAV = [{ s: 'home', p: {} }]; render('fwd'); toast('اتمسح كل حاجة'); }); };
};
