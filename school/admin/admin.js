/* تطبيق المالك — مستر شريف حشيش
   - رفع/حذف الدروس لكل صف (GitHub API بمفتاح مستر شريف الخاص، محفوظ على موبايله بس)
   - إصدار رقم سري لكل جهاز طالب، وإلغاؤه
   بيانات الطلبة (الأسماء) محفوظة على موبايل مستر شريف بس، وفي GitHub بتتحفظ بصمة مش مفهومة. */
(function () {
  'use strict';

  var OWNER = 'rahuqhasna-debug';
  var REPO = 'rahuqhasna-debug.github.io';
  var ROOT = 'school';
  var SITE = 'https://' + OWNER + '.github.io/' + ROOT + '/';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO;

  var GRADES = [
    ['g4', 'الصف الرابع', 'رابعة', true],
    ['g5', 'الصف الخامس', 'خامسة', true],
    ['g6', 'الصف السادس', 'سادسة', true],
    ['m1', 'الأول الإعدادي', 'أولى إعدادي', true],
    ['m2', 'الثاني الإعدادي', 'تانية إعدادي', true],
    ['m3', 'الثالث الإعدادي', 'تالتة إعدادي', true],
    ['s1', 'الأول الثانوي', 'أولى ثانوي', true]
  ];

  var KEY = 'school-admin';
  var st = (function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  st.students = st.students || [];
  st.g = st.g || 'g4';
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function gInfo(g) { for (var i = 0; i < GRADES.length; i++) if (GRADES[i][0] === g) return GRADES[i]; return GRADES[0]; }
  function msg(id, t, bad) { var m = $(id); m.textContent = t || ''; m.className = 'status' + (bad ? ' bad' : ''); }
  function fmtDate(t) { var d = new Date(t); return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); }

  /* ---------- GitHub ---------- */
  function encPath(p) { return p.split('/').map(encodeURIComponent).join('/'); }
  function gh(method, path, body) {
    return fetch(API + '/contents/' + encPath(path) + (method === 'GET' ? '?ref=main&t=' + Date.now() : ''), {
      method: method,
      cache: 'no-store',
      headers: { Authorization: 'Bearer ' + st.token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (r.status === 404 && method === 'GET') return null;
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.message || ('HTTP ' + r.status)); e.status = r.status; throw e; }
        return j;
      });
    });
  }
  function b64(u8) {
    var s = '', CH = 0x8000;
    for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return btoa(s);
  }
  function unb64(s) {
    var bin = atob(String(s).replace(/\s/g, '')), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  function errText(e) {
    if (!navigator.onLine) return 'مفيش نت.';
    if (e && (e.status === 401 || e.status === 403)) return 'المفتاح مش شغال أو صلاحياته ناقصة. راجع «الإعدادات».';
    if (e && e.status === 409) return 'حصل تعارض، جرّب تاني.';
    return 'حصلت مشكلة: ' + ((e && e.message) || 'غير معروفة');
  }
  function needToken() {
    if (st.token) return false;
    showTab('set');
    msg('setMsg', 'حط مفتاح GitHub الأول عشان تقدر ترفع وتسجل.', true);
    return true;
  }

  /* devices.json: {"keys": [بصمة, ...]} — نقرا ونعدّل ونحفظ، ولو حصل تعارض نعيد مرة */
  function editKeys(g, fn, tries) {
    var path = ROOT + '/' + g + '/devices.json';
    return gh('GET', path).then(function (f) {
      var data = { keys: [] };
      if (f && f.content) {
        try { data = JSON.parse(new TextDecoder().decode(unb64(f.content))); } catch (e) {}
      }
      data.keys = data.keys || [];
      fn(data);
      var body = { message: 'أرقام سرية ' + g, content: b64(new TextEncoder().encode(JSON.stringify(data) + '\n')), branch: 'main' };
      if (f && f.sha) body.sha = f.sha;
      return gh('PUT', path, body);
    }).catch(function (e) {
      if ((tries || 0) < 2 && (e.status === 409 || e.status === 422)) return editKeys(g, fn, (tries || 0) + 1);
      throw e;
    });
  }
  function sha(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('').slice(0, 32);
    });
  }
  function newCode() {
    var r = new Uint32Array(1); crypto.getRandomValues(r);
    return String(100000 + (r[0] % 900000));
  }
  function normDev(s) {
    var t = String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return t.length === 8 ? t.slice(0, 4) + '-' + t.slice(4) : null;
  }

  /* ---------- الواجهة ---------- */
  document.body.innerHTML =
    '<header><div class="h1">🛠 إدارة مستر شريف</div><div class="h2">التحكم في تطبيقات الطلبة</div></header>' +
    '<div class="grades" id="grades"></div>' +
    '<nav><button data-t="stu">🔑 الطلبة</button><button data-t="les">📚 الدروس</button><button data-t="set">⚙️ الإعدادات</button></nav>' +
    '<main>' +
    '<section id="t-stu">' +
      '<div class="card"><b>طالب جديد</b>' +
        '<p class="hint">الطالب بيبعتلك «كود جهازه» من التطبيق على واتساب. اكتبه هنا وهيطلعلك الرقم السري.</p>' +
        '<input id="nName" placeholder="اسم الطالب">' +
        '<input id="nDev" class="ltr" placeholder="كود الجهاز مثل: AB3K-7QXM" autocomplete="off">' +
        '<button id="nBtn" class="btn">إصدار رقم سري</button>' +
        '<div id="nMsg" class="status"></div><div id="nOut"></div></div>' +
      '<input id="sFind" placeholder="🔎 دوّر على طالب">' +
      '<div id="sList"></div>' +
    '</section>' +
    '<section id="t-les" class="hide">' +
      '<div class="card"><b>رابط التطبيق للطلبة</b><div id="appLink" class="link ltr"></div>' +
        '<button id="copyLink" class="btn ghost">📋 نسخ الرابط</button></div>' +
      '<div class="card"><b>رفع درس</b>' +
        '<p class="hint">اختار ملف الدرس (HTML). اسم الدرس = اسم الملف، وللترتيب ابدأه برقم (مثال: 01 النشاط الزراعي).</p>' +
        '<input id="lFile" type="file" accept=".html,.htm,text/html" multiple>' +
        '<input id="lName" placeholder="اسم الدرس (اختياري — لو فاضي ياخد اسم الملف)">' +
        '<button id="lBtn" class="btn">⬆️ رفع</button><div id="lMsg" class="status"></div></div>' +
      '<div class="row"><b>الدروس المرفوعة</b><button id="lRef" class="mini">🔄</button></div>' +
      '<div id="lList"></div>' +
    '</section>' +
    '<section id="t-set" class="hide">' +
      '<div class="card"><b>مفتاح GitHub</b>' +
        '<p class="hint">المفتاح ده بيخلّي التطبيق يرفع الدروس ويسجّل الأرقام السرية باسمك. بيتحفظ على الموبايل ده بس. ماتبعتهوش لحد.</p>' +
        '<input id="tok" type="password" class="ltr" placeholder="github_pat_..." autocomplete="off">' +
        '<button id="tokBtn" class="btn">حفظ وتجربة</button><div id="setMsg" class="status"></div>' +
        '<details><summary>إزاي أعمل المفتاح؟</summary><ol>' +
          '<li>افتح github.com/settings/personal-access-tokens/new وإنت داخل على حسابك.</li>' +
          '<li>Token name: اكتب «مستر شريف».</li>' +
          '<li>Expiration: اختار أطول مدة (أو No expiration).</li>' +
          '<li>Repository access: اختار Only select repositories ← rahuqhasna-debug.github.io.</li>' +
          '<li>Permissions ← Repository permissions ← Contents: اختار Read and write.</li>' +
          '<li>دوس Generate token، وانسخ المفتاح وحطه هنا.</li>' +
        '</ol></details></div>' +
      '<div class="card"><b>نسخة احتياطية لأسماء الطلبة</b>' +
        '<p class="hint">الأسماء محفوظة على الموبايل ده بس. خد نسخة احتياطية كل فترة، ولو غيّرت الموبايل رجّعها.</p>' +
        '<button id="bkOut" class="btn ghost">⬇️ حفظ نسخة</button>' +
        '<input id="bkIn" type="file" accept=".json,application/json"><div id="bkMsg" class="status"></div></div>' +
    '</section>' +
    '</main>';

  function drawGrades() {
    var box = $('grades');
    box.innerHTML = '';
    GRADES.forEach(function (g) {
      var b = el('button', g[0] === st.g ? 'on' : '', g[2] + (g[3] ? '' : ' (قريبًا)'));
      b.disabled = !g[3];
      b.onclick = function () { st.g = g[0]; persist(); drawGrades(); drawStudents(); drawLessonsHead(); loadLessons(); };
      box.appendChild(b);
    });
  }

  var curTab = 'stu';
  function showTab(t) {
    curTab = t;
    ['stu', 'les', 'set'].forEach(function (x) { $('t-' + x).classList.toggle('hide', x !== t); });
    Array.prototype.forEach.call(document.querySelectorAll('nav button'), function (b) { b.classList.toggle('on', b.getAttribute('data-t') === t); });
    if (t === 'les') loadLessons();
  }
  Array.prototype.forEach.call(document.querySelectorAll('nav button'), function (b) {
    b.onclick = function () { showTab(b.getAttribute('data-t')); };
  });

  /* ---------- الطلبة ---------- */
  function codeMsg(s) {
    return 'تطبيق مستر شريف — ' + gInfo(s.g)[1] + '\n' +
      (s.name ? 'الطالب: ' + s.name + '\n' : '') +
      'الرقم السري: ' + s.code + '\n' +
      'اكتبه في التطبيق ودوس «فتح التطبيق». الرقم ده بيفتح موبايلك ده بس.';
  }
  function shareBtns(s, box) {
    var r = el('div', 'acts');
    var c = el('button', 'mini', '📋 نسخ');
    c.onclick = function () { copy(codeMsg(s), c); };
    var w = el('a', 'mini wa', 'واتساب');
    w.href = 'https://wa.me/?text=' + encodeURIComponent(codeMsg(s));
    w.target = '_blank'; w.rel = 'noopener';
    r.appendChild(c); r.appendChild(w);
    box.appendChild(r);
    return r;
  }
  function copy(text, btn) {
    var done = function () { var o = btn.textContent; btn.textContent = '✔ اتنسخ'; setTimeout(function () { btn.textContent = o; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { prompt('انسخ:', text); });
    else prompt('انسخ:', text);
  }

  $('nBtn').onclick = function () {
    if (needToken()) return;
    var name = $('nName').value.trim();
    var dev = normDev($('nDev').value);
    $('nOut').innerHTML = '';
    if (!dev) { msg('nMsg', 'كود الجهاز ٨ حروف وأرقام (زي AB3K-7QXM). اتأكد منه.', true); return; }
    var old = st.students.filter(function (s) { return s.g === st.g && s.dev === dev && !s.off; })[0];
    if (old) {
      msg('nMsg', 'الجهاز ده واخد رقم قبل كده (' + (old.name || 'من غير اسم') + '). ده نفس الرقم:');
      var b0 = el('div', 'code', old.code); $('nOut').appendChild(b0); shareBtns(old, $('nOut'));
      return;
    }
    var s = { g: st.g, name: name, dev: dev, code: newCode(), t: Date.now() };
    $('nBtn').disabled = true;
    msg('nMsg', 'جاري التسجيل…');
    sha(s.g + ':' + s.dev + ':' + s.code).then(function (h) {
      s.h = h;
      return editKeys(s.g, function (d) { if (d.keys.indexOf(h) < 0) d.keys.push(h); });
    }).then(function () {
      st.students.unshift(s); persist();
      msg('nMsg', '✔ اتسجل. ابعت الرقم ده للطالب (يشتغل بعد دقيقة):');
      $('nOut').appendChild(el('div', 'code', s.code));
      shareBtns(s, $('nOut'));
      $('nName').value = ''; $('nDev').value = '';
      drawStudents();
    }).catch(function (e) { msg('nMsg', errText(e), true); })
      .then(function () { $('nBtn').disabled = false; });
  };

  function drawStudents() {
    var box = $('sList'), q = $('sFind').value.trim();
    box.innerHTML = '';
    var list = st.students.filter(function (s) {
      return s.g === st.g && (!q || (s.name || '').indexOf(q) >= 0 || s.dev.indexOf(q.toUpperCase()) >= 0 || s.code.indexOf(q) >= 0);
    });
    var on = list.filter(function (s) { return !s.off; }).length;
    box.appendChild(el('div', 'row', 'الأجهزة المفعّلة: ' + on + (list.length > on ? ' — الملغية: ' + (list.length - on) : '')));
    list.forEach(function (s) {
      var c = el('div', 'card stu' + (s.off ? ' off' : ''));
      c.appendChild(el('b', '', (s.name || 'من غير اسم') + (s.off ? ' — ملغي' : '')));
      c.appendChild(el('div', 'meta', 'الجهاز: ' + s.dev + ' • الرقم: ' + s.code + ' • ' + fmtDate(s.t)));
      if (!s.off) {
        var r = shareBtns(s, c);
        var x = el('button', 'mini bad', '⛔ إلغاء');
        x.onclick = function () { revoke(s, x); };
        r.appendChild(x);
      }
      box.appendChild(c);
    });
  }
  $('sFind').oninput = drawStudents;

  function revoke(s, btn) {
    if (needToken()) return;
    if (!confirm('إلغاء الرقم السري بتاع ' + (s.name || s.dev) + '؟\nالتطبيق هيتقفل عنده أول ما يفتحه بالنت.')) return;
    btn.disabled = true;
    editKeys(s.g, function (d) { d.keys = d.keys.filter(function (k) { return k !== s.h; }); })
      .then(function () { s.off = Date.now(); persist(); drawStudents(); })
      .catch(function (e) { alert(errText(e)); btn.disabled = false; });
  }

  /* ---------- الدروس ---------- */
  function lessonsDir() { return ROOT + '/' + st.g + '/lessons'; }
  function drawLessonsHead() { $('appLink').textContent = SITE + st.g + '/'; }
  $('copyLink').onclick = function () { copy(SITE + st.g + '/', $('copyLink')); };

  function loadLessons() {
    var box = $('lList');
    if (curTab !== 'les') return;
    if (!st.token) { box.innerHTML = ''; box.appendChild(el('div', 'empty', 'حط مفتاح GitHub في «الإعدادات» الأول.')); return; }
    box.innerHTML = '';
    box.appendChild(el('div', 'empty', 'جاري التحميل…'));
    gh('GET', lessonsDir()).then(function (arr) {
      box.innerHTML = '';
      var files = (arr || []).filter(function (f) { return f.type === 'file' && /\.html?$/i.test(f.name); })
        .sort(function (a, b) { return a.name.localeCompare(b.name, 'ar', { numeric: true }); });
      if (!files.length) { box.appendChild(el('div', 'empty', 'لسه مفيش دروس في الصف ده.')); return; }
      files.forEach(function (f) {
        var c = el('div', 'card les');
        c.appendChild(el('b', '', f.name.replace(/\.html?$/i, '')));
        c.appendChild(el('div', 'meta', (f.size / 1024 / 1024).toFixed(1) + ' ميجا'));
        var d = el('button', 'mini bad', '🗑 حذف');
        d.onclick = function () {
          if (!confirm('حذف درس «' + f.name + '»؟\nهيختفي من عند الطلبة مع التحديث.')) return;
          d.disabled = true;
          gh('DELETE', f.path, { message: 'حذف درس', sha: f.sha, branch: 'main' })
            .then(loadLessons).catch(function (e) { alert(errText(e)); d.disabled = false; });
        };
        var a = el('div', 'acts'); a.appendChild(d); c.appendChild(a);
        box.appendChild(c);
      });
    }).catch(function (e) { box.innerHTML = ''; box.appendChild(el('div', 'empty', errText(e))); });
  }
  $('lRef').onclick = loadLessons;

  function readFile(f) {
    return new Promise(function (ok, no) {
      var r = new FileReader();
      r.onload = function () { ok(new Uint8Array(r.result)); };
      r.onerror = no;
      r.readAsArrayBuffer(f);
    });
  }
  function cleanName(n) {
    n = String(n).replace(/[\\\/:*?"<>|#%]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!/\.html?$/i.test(n)) n += '.html';
    return n;
  }
  $('lBtn').onclick = function () {
    if (needToken()) return;
    var files = Array.prototype.slice.call($('lFile').files || []);
    if (!files.length) { msg('lMsg', 'اختار ملف الدرس الأول.', true); return; }
    var custom = $('lName').value.trim();
    $('lBtn').disabled = true;
    var i = 0, ok = 0;
    var next = function () {
      if (i >= files.length) {
        msg('lMsg', '✔ اترفع ' + ok + ' درس. هيظهر عند الطلبة بعد دقيقتين لما يدوسوا «تحديث».');
        $('lBtn').disabled = false; $('lFile').value = ''; $('lName').value = '';
        loadLessons();
        return;
      }
      var f = files[i++];
      var name = cleanName(files.length === 1 && custom ? custom : f.name);
      var path = lessonsDir() + '/' + name;
      if (f.size > 40 * 1024 * 1024) { msg('lMsg', '«' + name + '» أكبر من 40 ميجا، مينفعش يترفع من هنا.', true); return next(); }
      msg('lMsg', 'جاري رفع «' + name + '» (' + i + ' من ' + files.length + ')…');
      return Promise.all([readFile(f), gh('GET', path)]).then(function (r) {
        var body = { message: 'درس: ' + name, content: b64(r[0]), branch: 'main' };
        if (r[1] && r[1].sha) body.sha = r[1].sha;
        return gh('PUT', path, body);
      }).then(function () { ok++; next(); })
        .catch(function (e) { msg('lMsg', '«' + name + '»: ' + errText(e), true); $('lBtn').disabled = false; });
    };
    next();
  };

  /* ---------- الإعدادات ---------- */
  $('tok').value = st.token ? '••••••••••' : '';
  $('tokBtn').onclick = function () {
    var v = $('tok').value.trim();
    if (v && v.indexOf('•') < 0) st.token = v;
    if (!st.token) { msg('setMsg', 'حط المفتاح الأول.', true); return; }
    msg('setMsg', 'جاري التجربة…');
    fetch(API, { headers: { Authorization: 'Bearer ' + st.token, Accept: 'application/vnd.github+json' }, cache: 'no-store' })
      .then(function (r) { return r.json().then(function (j) { return { r: r, j: j }; }); })
      .then(function (x) {
        if (!x.r.ok) throw Object.assign(new Error(x.j.message || ''), { status: x.r.status });
        persist();
        $('tok').value = '••••••••••';
        if (x.j.permissions && x.j.permissions.push === false) { msg('setMsg', 'المفتاح اتحفظ بس مالوش صلاحية الكتابة. رجّع اعمله بصلاحية Contents: Read and write.', true); return; }
        msg('setMsg', '✔ المفتاح شغال واتحفظ على الموبايل ده.');
      })
      .catch(function (e) { msg('setMsg', errText(e), true); });
  };
  $('bkOut').onclick = function () {
    var blob = new Blob([JSON.stringify({ students: st.students }, null, 1)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'طلبة-مستر-شريف-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
  };
  $('bkIn').onchange = function () {
    var f = this.files[0]; if (!f) return;
    f.text().then(function (t) {
      var j = JSON.parse(t), add = 0;
      (j.students || []).forEach(function (s) {
        if (s && s.h && !st.students.some(function (x) { return x.h === s.h; })) { st.students.push(s); add++; }
      });
      st.students.sort(function (a, b) { return b.t - a.t; });
      persist(); drawStudents();
      msg('bkMsg', '✔ اترجع ' + add + ' طالب.');
    }).catch(function () { msg('bkMsg', 'الملف ده مش نسخة احتياطية صحيحة.', true); });
  };

  /* ---------- تشغيل ---------- */
  drawGrades(); drawStudents(); drawLessonsHead();
  showTab(st.token ? 'stu' : 'set');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
})();
