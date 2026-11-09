// سلاح التلميذ البحيرة — استقبال شغل المناديب على درايف rahuqhasna@gmail.com
// تصميم وتنفيذ: شريف حشيش
// المندوب بيبعت بس (نسخة يومية + البيع + التسليمات + صور الفواتير) وبيسحب الأسعار. صفحة المتابعة بالمفتاح بس.
// والنسخة الاحتياطية بتترفع على درايف المندوب نفسه (بعد ما يربط حسابه مرة واحدة).

const ROOT_NAME = 'سلاح التلميذ البحيرة — المناديب';
const ADMIN_KEY = 'bh-9f4k27qx';   // صفحة المتابعة = رابط الـ Deploy + ?admin=bh-9f4k27qx
const BK_FOLDER = 'سلاح التلميذ البحيرة';   // فولدر النسخ الاحتياطية على درايف المندوب
const REG_OK = 'تم التسجيل على البرنامج', REG_NO = 'لم يتم التسجيل على البرنامج';

const P = () => PropertiesService.getScriptProperties();

function rootFolder(){
  const id = P().getProperty('ROOT');
  if(id){ try{ return DriveApp.getFolderById(id); }catch(e){} }
  const f = DriveApp.createFolder(ROOT_NAME); P().setProperty('ROOT', f.getId()); return f;
}
function subFolder(parent, name){ const it = parent.getFoldersByName(name); return it.hasNext() ? it.next() : parent.createFolder(name); }
function sheetFile(prop, name, init){
  const id = P().getProperty(prop);
  if(id){ try{ return SpreadsheetApp.openById(id); }catch(e){} }
  const ss = SpreadsheetApp.create(name);
  DriveApp.getFileById(ss.getId()).moveTo(rootFolder());
  P().setProperty(prop, ss.getId());
  if(init) init(ss);
  return ss;
}
function head(sh, n){ sh.getRange(1,1,1,n).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff'); sh.setFrozenRows(1); }

// شيت الأسعار: شريف بس اللي بيعدّله، والبرنامج بيسحب منه
function pricesBook(){
  return sheetFile('PRICES', 'الأسعار', ss => {
    const sh = ss.getSheets()[0]; sh.setName('الأسعار'); sh.setRightToLeft(true);
    const rows = [['المادة','الصف','المرحلة','السعر قبل الخصم','السعر بعد الخصم']];
    for(let g=1; g<=6; g++) rows.push(['إنجليزي', g, 'ابتدائي', '', '']);
    for(const s of ['عربي','رياضة','دراسات']) for(let g=1; g<=3; g++) rows.push([s, g, 'إعدادي', '', '']);
    sh.getRange(1,1,rows.length,5).setValues(rows); head(sh,5); sh.setColumnWidths(1,5,130);
  });
}
// صفحة «إعدادات» في شيت الأسعار: رقم واتساب التقارير (B1)
function settingsSheet(ss){
  let sh = ss.getSheetByName('إعدادات');
  if(!sh){
    sh = ss.insertSheet('إعدادات', ss.getSheets().length); sh.setRightToLeft(true);
    sh.getRange('B1').setNumberFormat('@');
    sh.getRange('A1:B1').setValues([['رقم واتساب التقارير', '']]).setFontWeight('bold');
    sh.getRange('A2').setValue('اكتب الرقم في الخانة B1 (مثلاً 01012345678). المناديب بيبعتوا تقرير اليوم على الرقم ده.');
    sh.setColumnWidth(1, 190); sh.setColumnWidth(2, 160);
  }
  return sh;
}
// شيت البيع العام: صفحة لكل مندوب باسمه
function salesBook(){
  return sheetFile('SALES', 'البيع', ss => {
    const sh = ss.getSheets()[0]; sh.setName('اقرأني'); sh.setRightToLeft(true);
    sh.getRange('A1').setValue('كل مندوب ليه صفحة باسمه، بتتحدّث لوحدها كل ما يبعت شغل جديد. ما تعدّلش فيها بإيدك.');
  });
}

// شغّلها مرة واحدة من المحرر: بتعمل الفولدر والشيتات وتطلب الصلاحيات
function setup(){
  const r = rootFolder(), p = pricesBook(), s = salesBook(); settingsSheet(p);
  UrlFetchApp.fetch('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest', {muteHttpExceptions:true});   // عشان صلاحية الاتصال الخارجي
  Logger.log('📁 الفولدر: ' + r.getUrl());
  Logger.log('💲 شيت الأسعار: ' + p.getUrl() + '  (ورقة «إعدادات» = رقم واتساب التقارير)');
  Logger.log('💰 شيت البيع: ' + s.getUrl());
  Logger.log('🔑 صفحة المتابعة = رابط الـ Deploy + ?admin=' + ADMIN_KEY);
  Logger.log(P().getProperty('GCLIENT_ID') && P().getProperty('GCLIENT_SECRET')
    ? '🗂️ ربط درايف المناديب: جاهز ✅' : '🗂️ ربط درايف المناديب: لسه — حط GCLIENT_ID و GCLIENT_SECRET في «خصائص النص البرمجي»');
}

const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

function doGet(e){
  const q = (e && e.parameter) || {};
  if(q.k === 'prices'){
    const ss = pricesBook(), sh = ss.getSheetByName('الأسعار') || ss.getSheets()[0];
    let phone = '';
    try{ phone = String(settingsSheet(ss).getRange('B1').getDisplayValue() || '').trim(); }catch(err){}
    return out({ok:true, rows: sh.getDataRange().getValues(), phone, at: DriveApp.getFileById(ss.getId()).getLastUpdated().toISOString()});
  }
  if(q.admin && q.admin === ADMIN_KEY){
    return HtmlService.createHtmlOutputFromFile('Dashboard')
      .setTitle('متابعة المناديب — سلاح التلميذ البحيرة')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  return out({ok:true, msg:'شغال ✅'});
}

function repFolder(mail, rep){
  const name = rep + ' (' + mail + ')';
  const id = P().getProperty('F:' + mail);
  if(id){ try{ const f = DriveApp.getFolderById(id); if(f.getName() !== name) f.setName(name); return f; }catch(e){} }
  const f = subFolder(rootFolder(), name); P().setProperty('F:' + mail, f.getId()); return f;
}

function doPost(e){
  let b;
  try{ b = JSON.parse(e.postData.contents); }catch(err){ return out({ok:false, err:'json'}); }
  const mail = String(b.mail || '').trim().toLowerCase();
  if(!mail) return out({ok:false, err:'no mail'});
  // النسخة الاحتياطية على درايف المندوب: من غير قفل (مش بتلمس درايف شريف)
  if(b.k === 'link') return out(linkDrive(mail, b));
  if(b.k === 'bk') return out(repBackup(mail, b));
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try{
    const rep = String(b.rep || mail).slice(0, 60);
    const f = repFolder(mail, rep);
    if(b.k === 'sync'){
      // ملف واحد لكل يوم بيتحدّث (فيه كل بيانات المندوب)
      const name = String(b.day || 'بدون-تاريخ') + '.json', json = JSON.stringify(b.data || {});
      const it = f.getFilesByName(name);
      if(it.hasNext()) it.next().setContent(json); else f.createFile(name, json, 'application/json');
      const imgs = imgMap(f), sales = withImgs(b.sales || [], imgs), pays = b.pays || [];
      writeSales(mail, rep, sales, pays);
      writeRepBook(mail, rep, f, sales, pays, b.dels || []);
      P().setProperty('R:' + mail, JSON.stringify({rep, mail, idara:b.idara || '', folder:f.getId(), last:b.at || new Date().toISOString(), day:b.day || '', stats:b.stats || {}}));
      return out({ok:true});
    }
    if(b.k === 'inv'){
      const inv = subFolder(f, 'فواتير'), nm = String(b.name || 'فاتورة.jpg');
      if(!inv.getFilesByName(nm).hasNext()) inv.createFile(Utilities.newBlob(Utilities.base64Decode(b.b64), 'image/jpeg', nm));
      return out({ok:true});
    }
    return out({ok:false, err:'kind'});
  }catch(err){ return out({ok:false, err:String(err)}); }
  finally{ lock.releaseLock(); }
}

// ============ صور الفواتير ← رابط في شيت البيع ============
function imgMap(f){
  const m = {}, it = f.getFoldersByName('فواتير'); if(!it.hasNext()) return m;
  const fs = it.next().getFiles();
  while(fs.hasNext()){ const x = fs.next(); m[x.getName().replace(/-\d{6}\.jpg$/i, '')] = x.getUrl(); }
  return m;
}
function withImgs(rows, imgs){
  return rows.map((r, i) => i === 0 ? r : r.map(c => (typeof c === 'string' && c.indexOf('IMG:') === 0)
    ? (imgs[c.slice(4)] ? '=HYPERLINK("' + imgs[c.slice(4)] + '","📷 الصورة")' : '') : c));
}

// صفحة المندوب في شيت البيع العام: بتتمسح وتتكتب من جديد كل مرة (فمفيش تكرار)
function writeSales(mail, rep, sales, pays){
  const ss = salesBook(), id = P().getProperty('S:' + mail);
  const nm = rep.replace(/[\[\]\*\?\/\\:]/g, ' ').slice(0, 90);
  let sh = id ? ss.getSheets().filter(s => String(s.getSheetId()) === id)[0] : null;
  if(!sh){ sh = ss.getSheetByName(nm) || ss.insertSheet(nm); P().setProperty('S:' + mail, String(sh.getSheetId())); }
  else if(sh.getName() !== nm && !ss.getSheetByName(nm)) sh.setName(nm);
  sh.clear(); sh.setRightToLeft(true);
  const W = Math.max(sales[0] ? sales[0].length : 0, pays[0] ? pays[0].length : 0, 1), pad = r => { r = (r || []).slice(0, W); while(r.length < W) r.push(''); return r; };
  const rows = [...sales.map(pad), pad([]), pad(['💵 الدفعات والمرتجعات']), ...pays.map(pad)];
  for(const c of [1, 2, 4]) sh.getRange(1, c, rows.length, 1).setNumberFormat('@');   // التاريخ والتليفون (بالصفر) يفضلوا زي ما هما
  sh.getRange(1, 1, rows.length, W).setValues(rows);
  head(sh, W);
  const ph = sales.length + 2;
  sh.getRange(ph, 1).setFontWeight('bold');
  if(pays.length) sh.getRange(ph + 1, 1, 1, W).setFontWeight('bold').setBackground('#e2f2ef');
  sh.setColumnWidths(1, W, 110);
}

// ============ شيت المندوب في فولدره (بند ش): البيع • المرتجعات والدفعات • التسليمات ============
function repBook(mail, rep, f){
  const id = P().getProperty('B:' + mail), nm = rep + ' — شغل المندوب';
  if(id){ try{ const ss = SpreadsheetApp.openById(id); if(ss.getName() !== nm) ss.rename(nm); return ss; }catch(e){} }
  const ss = SpreadsheetApp.create(nm);
  DriveApp.getFileById(ss.getId()).moveTo(f);
  ss.getSheets()[0].setName('البيع');
  ss.insertSheet('المرتجعات والدفعات', 1); ss.insertSheet('التسليمات', 2);
  ss.getSheets().forEach(s => s.setRightToLeft(true));
  P().setProperty('B:' + mail, ss.getId());
  return ss;
}
function sheetOf(ss, name){ return ss.getSheetByName(name) || ss.insertSheet(name, ss.getSheets().length); }
// يكتب جدول؛ textCols = أعمدة تتكتب نص (التليفون والتواريخ)
function putTable(sh, rows, textCols){
  const W = rows[0].length, old = sh.getLastRow();
  sh.clearContents(); sh.setRightToLeft(true);
  if(old > rows.length) sh.getRange(rows.length + 1, 1, old - rows.length, sh.getMaxColumns()).clearDataValidations().setBackground(null);
  for(const c of textCols) sh.getRange(1, c, Math.max(rows.length, 1), 1).setNumberFormat('@');
  sh.getRange(1, 1, rows.length, W).setValues(rows);
  head(sh, W); sh.setFrozenColumns(0);
  sh.setColumnWidths(1, W, 110);
  return W;
}
function writeRepBook(mail, rep, f, sales, pays, dels){
  const ss = repBook(mail, rep, f);
  // البيع
  const s1 = sheetOf(ss, 'البيع');
  const sRows = sales.length ? sales : [['رقم الفاتورة','التاريخ','المدرس','التليفون','الكتاب','العدد','السعر قبل','السعر بعد','الإجمالي','التاجر','صورة الفاتورة']];
  putTable(s1, sRows, [2, 4]); s1.setColumnWidth(3, 170); s1.setColumnWidth(5, 170);
  // المرتجعات والدفعات
  const s2 = sheetOf(ss, 'المرتجعات والدفعات');
  const pRows = pays.length ? pays : [['التاريخ','المدرس','النوع','الكتاب','العدد','المبلغ','فاتورة رقم']];
  putTable(s2, pRows, [1]); s2.setColumnWidth(2, 170); s2.setColumnWidth(4, 170);
  if(pRows.length > 1){
    const bg = pRows.slice(1).map(r => [r[2] === 'دفعة' ? '#dcfce7' : '#ffedd5']);
    s2.getRange(2, 3, bg.length, 1).setBackgrounds(bg);
  }
  // التسليمات: عمود «التسجيل على برنامج الشركة» شريف بيختاره بإيده ويفضل زي ما هو (بالكود الثابت في آخر عمود)
  const s3 = sheetOf(ss, 'التسليمات'), H = ['اسم المدرس','التليفون','الكتاب','العدد','التسجيل على برنامج الشركة','التسليم','التاريخ','الوقت','المنطقة','تاريخ الطلب','تاريخ التسليم','المندوب','كود'];
  const keep = {}, last = s3.getLastRow();
  if(last > 1 && s3.getLastColumn() >= 13) s3.getRange(2, 1, last - 1, 13).getValues().forEach(r => { if(r[12]) keep[r[12]] = r[4]; });
  const dRows = [H, ...dels.map(d => { const r = (d.r || []).slice(0, 11); while(r.length < 11) r.push(''); r.splice(4, 0, keep[d.id] || REG_NO); r.push(d.id); return r; })];
  putTable(s3, dRows, [2, 7, 10, 11]);
  s3.setColumnWidth(1, 170); s3.setColumnWidth(3, 170); s3.setColumnWidth(5, 210);
  s3.setFrozenColumns(1);
  if(!s3.isColumnHiddenByUser(13)) s3.hideColumns(13);
  const n = dRows.length - 1, col = s3.getRange('E2:E');
  if(n){
    s3.getRange(2, 5, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList([REG_OK, REG_NO], true).setAllowInvalid(false).build());
  }
  s3.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(REG_OK).setBackground('#dcfce7').setFontColor('#15803d').setRanges([col]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(REG_NO).setBackground('#fee2e2').setFontColor('#b91c1c').setRanges([col]).build(),
  ]);
}

// ============ النسخة الاحتياطية على درايف المندوب نفسه ============
// المندوب بيربط حسابه مرة واحدة (صلاحية drive.file = الملفات اللي البرنامج عملها بس).
// السكريبت بيحفظ الصلاحية (refresh token) ويرفع كل نسخة في فولدر «سلاح التلميذ البحيرة» على درايفه، ويسيب آخر 40 بس.
function oauthPost(payload){
  const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {method:'post', payload, muteHttpExceptions:true});
  return JSON.parse(r.getContentText() || '{}');
}
function linkDrive(mail, b){
  const cid = P().getProperty('GCLIENT_ID'), sec = P().getProperty('GCLIENT_SECRET');
  if(!cid || !sec) return {ok:false, err:'noclient'};
  if(!b.code) return {ok:false, err:'nocode'};
  const j = oauthPost({code:b.code, client_id:cid, client_secret:sec, redirect_uri:'postmessage', grant_type:'authorization_code'});
  if(!j.access_token) return {ok:false, err:'link ' + (j.error || '')};
  let gmail = '';
  try{ gmail = JSON.parse(UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v3/userinfo', {headers:{Authorization:'Bearer ' + j.access_token}}).getContentText()).email || ''; }catch(e){}
  const old = JSON.parse(P().getProperty('T:' + mail) || 'null');
  const same = old && old.gmail === gmail;
  const rt = j.refresh_token || (same ? old.rt : '');
  if(!rt) return {ok:false, err:'norefresh'};
  const key = Utilities.getUuid();
  P().setProperty('T:' + mail, JSON.stringify({rt, key, gmail, folder: same ? (old.folder || '') : ''}));
  return {ok:true, key, gmail};
}
function repBackup(mail, b){
  const T = JSON.parse(P().getProperty('T:' + mail) || 'null');
  if(!T || !b.key || T.key !== b.key) return {ok:false, err:'relink'};
  const t = oauthPost({refresh_token:T.rt, client_id:P().getProperty('GCLIENT_ID'), client_secret:P().getProperty('GCLIENT_SECRET'), grant_type:'refresh_token'});
  if(!t.access_token){
    if(t.error === 'invalid_grant'){ P().deleteProperty('T:' + mail); return {ok:false, err:'relink'}; }
    return {ok:false, err:'token ' + (t.error || '')};
  }
  const H = {Authorization:'Bearer ' + t.access_token}, API = 'https://www.googleapis.com/drive/v3/files';
  const get = (u, o) => { const r = UrlFetchApp.fetch(u, Object.assign({headers:H, muteHttpExceptions:true}, o || {})); return {code:r.getResponseCode(), j:JSON.parse(r.getContentText() || '{}')}; };
  // الفولدر
  let folder = T.folder;
  if(folder){ const r = get(API + '/' + folder + '?fields=id,trashed'); if(r.code !== 200 || r.j.trashed) folder = ''; }
  if(!folder){
    const r = get(API + '?fields=id', {method:'post', contentType:'application/json', payload:JSON.stringify({name:BK_FOLDER, mimeType:'application/vnd.google-apps.folder'})});
    if(!r.j.id) return {ok:false, err:'folder'};
    folder = r.j.id; T.folder = folder; P().setProperty('T:' + mail, JSON.stringify(T));
  }
  // ارفع النسخة
  const name = String(b.name || ('نسخة ' + new Date().toISOString() + '.json')).replace(/[\\\/]/g, '-');
  const bd = 'bk' + Utilities.getUuid().replace(/-/g, '');
  const body = '--' + bd + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify({name, parents:[folder], mimeType:'application/json'}) +
    '\r\n--' + bd + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(b.data || {}) + '\r\n--' + bd + '--';
  const up = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {method:'post', headers:H, contentType:'multipart/related; boundary=' + bd, payload:Utilities.newBlob(body).getBytes(), muteHttpExceptions:true});
  if(up.getResponseCode() !== 200) return {ok:false, err:'upload ' + up.getResponseCode()};
  // سيب آخر 40 (الأقدم يتمسح)
  const keepN = Math.min(Math.max(parseInt(b.keep, 10) || 40, 1), 100);
  const q = encodeURIComponent("'" + folder + "' in parents and trashed=false");
  const ls = get(API + '?q=' + q + '&orderBy=createdTime%20desc&pageSize=200&fields=files(id)');
  const files = (ls.j.files || []), extra = files.slice(keepN);
  if(extra.length) UrlFetchApp.fetchAll(extra.map(x => ({url:API + '/' + x.id, method:'delete', headers:H, muteHttpExceptions:true})));
  return {ok:true, count:Math.min(files.length, keepN)};
}

// صفحة المتابعة (بالمفتاح بس)
function chk(k){ if(k !== ADMIN_KEY) throw new Error('مش مسموح'); }
function adminReps(k){
  chk(k); const all = P().getProperties();
  return Object.keys(all).filter(x => x.indexOf('R:') === 0).map(x => JSON.parse(all[x]))
    .sort((a, b) => String(b.last).localeCompare(String(a.last)));
}
function adminRep(k, mail){
  chk(k); const m = JSON.parse(P().getProperty('R:' + mail) || 'null'); if(!m) return null;
  const f = DriveApp.getFolderById(m.folder), files = [], it = f.getFiles();
  while(it.hasNext()){ const x = it.next(); if(/^\d{4}-\d\d-\d\d\.json$/.test(x.getName())) files.push(x); }
  files.sort((a, b) => b.getName().localeCompare(a.getName()));
  const bid = P().getProperty('B:' + mail);
  let bookUrl = ''; try{ if(bid) bookUrl = DriveApp.getFileById(bid).getUrl(); }catch(e){}
  return {meta:m, data: files.length ? files[0].getBlob().getDataAsString() : '{}', folderUrl: f.getUrl(), bookUrl};
}
