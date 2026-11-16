/* تطبيق دروس مستر شريف حشيش — كود واحد لكل الصفوف.
   كل صف فولدر (g4, g5, ...) فيه index.html بيحدد window.GRADE وبيحمّل الملف ده. */
(function () {
  'use strict';

  var OWNER = 'rahuqhasna-debug';
  var REPO = 'rahuqhasna-debug.github.io';
  var ROOT = 'school';
  var TEACHER_WA = '201013093208'; // واتساب مستر شريف (الطالب بيبعتله كود الجهاز)
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/';

  var GRADES = {
    g4: ['الصف الرابع الابتدائي', '#0d9488'],
    g5: ['الصف الخامس الابتدائي', '#2563eb'],
    g6: ['الصف السادس الابتدائي', '#7c3aed'],
    m1: ['الصف الأول الإعدادي', '#db2777'],
    m2: ['الصف الثاني الإعدادي', '#ea580c'],
    m3: ['الصف الثالث الإعدادي', '#b45309'],
    s1: ['الصف الأول الثانوي', '#475569']
  };

  var G = window.GRADE || 'g4';
  var info = GRADES[G] || ['دروس مستر شريف', '#0d9488'];
  var LS = 'school-' + G + '-';
  var CACHE = 'lessons-' + G;

  function load(k, d) { try { var v = localStorage.getItem(LS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {} }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  var list = load('list', []); // [{name, sha, size, ok}]
  var busy = false;

  document.documentElement.style.setProperty('--c', info[1]);
  document.title = 'مستر شريف — ' + info[0];

  document.body.innerHTML =
    '<header><div class="h1">مستر شريف حشيش</div><div class="h2" id="gname"></div></header>' +
    '<nav><button id="tabL" class="on">📚 الدروس</button><button id="tabA">💬 اسأل مستر شريف</button></nav>' +
    '<main>' +
      '<section id="secL">' +
        '<div id="install" class="card hide"><b>📲 ثبّت التطبيق على موبايلك</b><p id="installTxt"></p><button id="installBtn" class="btn hide">تثبيت</button></div>' +
        '<button id="upd" class="btn">🔄 تحديث الدروس</button>' +
        '<div id="status" class="status"></div>' +
        '<div id="lessons"></div>' +
      '</section>' +
      '<section id="secA" class="hide">' +
        '<div class="card"><b>اكتب سؤالك من المنهج</b>' +
          '<textarea id="q" rows="2" placeholder="مثال: ما أهمية نهر النيل؟"></textarea>' +
          '<button id="askBtn" class="btn">اسأل</button></div>' +
        '<div id="ans"></div>' +
      '</section>' +
    '</main>' +
    '<div id="viewer" class="hide"><div class="vbar"><button id="back">➡ رجوع</button><span id="vtitle"></span></div><iframe id="frame" title="الدرس"></iframe></div>' +
    '<div id="lock" class="hide"><div class="lockbox">' +
      '<div class="lh1">🔒 مستر شريف حشيش</div><div class="lh2" id="lgname"></div>' +
      '<p>عشان تفتح التطبيق محتاج <b>رقم سري</b> من مستر شريف. ابعتله كود جهازك، وهو يبعتلك الرقم.</p>' +
      '<p id="instHint" class="warn hide">💡 الأحسن تثبّت التطبيق الأول (من الـ٣ نقط ⋮ ← «تثبيت التطبيق») وتفتحه من الأيقونة، وبعدين تبعت الكود. كده الرقم يفضل شغال.</p>' +
      '<div class="lbl">كود جهازك</div><div id="dev" class="dev"></div>' +
      '<input id="sname" placeholder="اكتب اسمك (عشان مستر شريف يعرفك)">' +
      '<a id="waBtn" class="btn wa" target="_blank" rel="noopener">📲 ابعت الكود لمستر شريف على واتساب</a>' +
      '<div class="lbl">الرقم السري</div>' +
      '<input id="code" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="٦ أرقام">' +
      '<button id="actBtn" class="btn">🔓 فتح التطبيق</button>' +
      '<div id="lockMsg" class="status"></div>' +
    '</div></div>';

  $('gname').textContent = info[0];
  $('lgname').textContent = info[0];

  /* ---------- التبويبات ---------- */
  function tab(a) {
    $('secL').classList.toggle('hide', a);
    $('secA').classList.toggle('hide', !a);
    $('tabL').classList.toggle('on', !a);
    $('tabA').classList.toggle('on', a);
  }
  $('tabL').onclick = function () { tab(false); };
  $('tabA').onclick = function () { tab(true); };

  /* ---------- الدروس ---------- */
  function title(name) {
    return name.replace(/\.html?$/i, '').replace(/^\d+[\s._\-]*/, '').replace(/_/g, ' ').trim() || name;
  }
  function lessonUrl(name) {
    return new URL('lessons/' + encodeURIComponent(name), location.href).href;
  }
  function setStatus(t) { $('status').textContent = t || ''; }

  function render() {
    var box = $('lessons');
    box.innerHTML = '';
    if (!list.length) {
      box.appendChild(el('div', 'empty', 'لسه مفيش دروس. دوس «تحديث الدروس» وإنت معاك نت.'));
      return;
    }
    list.forEach(function (l, i) {
      var b = el('button', 'lesson' + (l.ok ? '' : ' wait'));
      b.appendChild(el('span', 'num', String(i + 1)));
      b.appendChild(el('span', 'lt', title(l.name)));
      b.appendChild(el('span', 'tag', l.ok ? '✔ جاهز بدون نت' : '⬇ لسه ماتنزلش'));
      b.onclick = function () { openLesson(l); };
      box.appendChild(b);
    });
  }

  // replace بدل src: عشان تحميل الدرس ما يضيفش خطوة في سجل المتصفح (وإلا زرار «رجوع» في الموبايل يلخبط)
  function frameGo(url) {
    var f = $('frame');
    try { f.contentWindow.location.replace(url); } catch (e) { f.src = url; }
  }
  var viewing = false;
  function openLesson(l) {
    if (!l.ok && !navigator.onLine) { setStatus('الدرس ده لسه ماتنزلش. افتح النت ودوس «تحديث الدروس».'); return; }
    $('vtitle').textContent = title(l.name);
    frameGo(lessonUrl(l.name));
    $('viewer').classList.remove('hide');
    if (!viewing) { viewing = true; history.pushState({ lesson: 1 }, ''); }
  }
  function closeLesson() {
    viewing = false;
    $('viewer').classList.add('hide');
    frameGo('about:blank');
  }
  $('back').onclick = function () {
    if (viewing && history.state && history.state.lesson) history.back(); else closeLesson();
  };
  window.addEventListener('popstate', closeLesson);

  /* قائمة الدروس = الملفات اللي في فولدر lessons على GitHub (من غير أي ملف فهرس) */
  function fetchList() {
    var dir = ROOT + '/' + G + '/lessons';
    var isLesson = function (n) { return /\.html?$/i.test(n); };
    return fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + dir + '?ref=main&t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (r.status === 404) return [];
        if (!r.ok) throw new Error('api');
        return r.json().then(function (j) {
          return j.filter(function (f) { return f.type === 'file' && isLesson(f.name); })
            .map(function (f) { return { name: f.name, sha: f.sha, size: f.size }; });
        });
      })
      .catch(function () {
        // احتياطي لو GitHub رفض (زحمة طلبات): قائمة الملفات من jsDelivr
        return fetch('https://data.jsdelivr.com/v1/packages/gh/' + OWNER + '/' + REPO + '@main?structure=flat', { cache: 'no-store' })
          .then(function (r) { if (!r.ok) throw new Error('cdn'); return r.json(); })
          .then(function (j) {
            var pre = '/' + dir + '/';
            return (j.files || []).filter(function (f) {
              return f.name.indexOf(pre) === 0 && f.name.indexOf('/', pre.length) < 0 && isLesson(f.name);
            }).map(function (f) { return { name: f.name.slice(pre.length), sha: f.hash, size: f.size }; });
          });
      });
  }

  function update(manual) {
    if (busy || !window.caches) return Promise.resolve();
    busy = true;
    $('upd').disabled = true;
    setStatus('جاري البحث عن دروس جديدة…');
    var cache, remote, old = {};
    list.forEach(function (l) { old[l.name] = l; });
    return Promise.all([fetchList(), caches.open(CACHE)]).then(function (res) {
      remote = res[0]; cache = res[1];
      remote.sort(function (a, b) { return a.name.localeCompare(b.name, 'ar', { numeric: true }); });
      var todo = [], fail = 0, done = 0;
      // نتأكد إن الدرس لسه محفوظ فعلًا (برامج تانية على نفس الموقع ممكن تمسح المحفوظ)
      return Promise.all(remote.map(function (r) {
        return cache.match(lessonUrl(r.name)).then(function (m) { r.has = !!m; });
      })).then(function () {
      remote.forEach(function (r) {
        var o = old[r.name];
        r.ok = !!(o && o.ok && o.sha === r.sha && r.has);
        if (!r.ok) todo.push(r);
      });
      var chain = Promise.resolve();
      todo.forEach(function (r, i) {
        chain = chain.then(function () {
          setStatus('جاري تنزيل الدرس ' + (i + 1) + ' من ' + todo.length + '…');
          var u = lessonUrl(r.name);
          return fetch(u + '?v=' + encodeURIComponent(r.sha), { cache: 'no-store' }).then(function (resp) {
            if (!resp.ok) throw new Error('dl');
            return cache.put(u, resp);
          }).then(function () { r.ok = true; done++; }, function () { fail++; });
        });
      });
      return chain.then(function () {
        var keep = {};
        remote.forEach(function (r) { keep[r.name] = 1; });
        return Promise.all(list.filter(function (l) { return !keep[l.name]; })
          .map(function (l) { return cache.delete(lessonUrl(l.name)); }));
      }).then(function () {
        list = remote;
        save('list', list);
        render();
        if (fail) setStatus('نزل ' + done + ' درس، وفيه ' + fail + ' لسه بيتجهز. جرّب «تحديث» تاني بعد دقيقتين.');
        else if (done) setStatus('✔ تم تنزيل ' + done + ' درس جديد. كل الدروس شغالة بدون نت.');
        else setStatus(list.length ? '✔ كل الدروس محدّثة وشغالة بدون نت.' : '');
      });
      });
    }).catch(function () {
      setStatus(manual ? 'مفيش نت دلوقتي. الدروس اللي نزلت قبل كده شغالة عادي.' : '');
    }).then(function () {
      busy = false;
      $('upd').disabled = false;
    });
  }
  $('upd').onclick = function () { update(true); };

  /* ---------- اسأل مستر شريف (بنك أسئلة محفوظ في qa.json) ---------- */
  var qa = [];
  var STOP = {};
  'ما ماذا من هو هي في على عن الي الى هل كم لماذا كيف متي اين ان او ثم التي الذي هذا هذه ذلك بم علل اذكر وضح عرف اكتب ماهي ماهو يعني ايه ازاي ليه هي هو كان يكون به بها له لها مع بين عند علي اللي لما فين كام مين اسم ده دي دول انا احنا هما بتاع بتاعه كده عايز اعرف قولي لو سمحت'.split(' ')
    .forEach(function (w) { STOP[w] = 1; });

  function norm(s) {
    return String(s).replace(/[ً-ْٰـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[^ء-ي٠-٩0-9a-zA-Z]+/g, ' ').toLowerCase().trim();
  }
  function toks(s) {
    var out = [];
    norm(s).split(' ').forEach(function (w) {
      if (w.length > 4 && (w.indexOf('ال') === 0)) w = w.slice(2);
      else if (w.length > 4 && /^(بال|لل|وال|كال|فال)/.test(w)) w = w.replace(/^(بال|وال|كال|فال|لل)/, '');
      if (w.length > 5 && /(ات|ين|ون)$/.test(w)) w = w.slice(0, -2);   // جمع: محافظات ← محافظ
      else if (w.length > 4 && /ه$/.test(w)) w = w.slice(0, -1);        // مفرد مؤنث: محافظه ← محافظ
      if (w.length > 1 && !STOP[w] && out.indexOf(w) < 0) out.push(w);
    });
    return out;
  }
  function same(w, e) {
    if (e === w) return 1;
    if (w.length >= 3 && e.length >= 3 && (e.indexOf(w) === 0 || w.indexOf(e) === 0)) return 0.7;
    return 0;
  }
  // نسبة كلمات سؤال الطالب اللي لقيناها فعلًا في السؤال المحفوظ (عشان ما نرجّعش إجابة سؤال تاني)
  function cover(qt, et) {
    if (!qt.length) return 0;
    var hit = 0;
    qt.forEach(function (w) {
      var w2 = (w.length > 3 && w.charAt(0) === 'و') ? w.slice(1) : null;
      for (var i = 0; i < et.length; i++) {
        if (same(w, et[i]) || (w2 && same(w2, et[i]))) { hit++; break; }
      }
    });
    return hit / qt.length;
  }
  // n = عدد كلمات نص السؤال نفسه (الكلمات المساعدة k لا تُنقص الدرجة)
  function score(qt, et, n) {
    if (!qt.length || !et.length) return 0;
    var sum = 0;
    qt.forEach(function (w) {
      var best = 0, w2 = (w.length > 3 && w.charAt(0) === 'و') ? w.slice(1) : null;
      for (var i = 0; i < et.length && best < 1; i++) {
        var e = et[i];
        best = Math.max(best, same(w, e));
        if (w2) best = Math.max(best, same(w2, e));
        if (e.length > 3 && e.charAt(0) === 'و') best = Math.max(best, same(w, e.slice(1)));
      }
      sum += best;
    });
    return 0.7 * sum / qt.length + 0.3 * Math.min(1, sum / (n || et.length));
  }

  function showAnswer(x, box) {
    var c = el('div', 'card answer');
    c.appendChild(el('div', 'aq', x.q));
    c.appendChild(el('div', 'aa', x.a));
    if (x.ref) c.appendChild(el('div', 'ar', '📖 ' + x.ref));
    box.appendChild(c);
  }

  function ask() {
    var box = $('ans');
    box.innerHTML = '';
    var text = $('q').value.trim();
    if (!text) return;
    if (!qa.length) { box.appendChild(el('div', 'empty', 'بنك أسئلة الصف ده لسه بيتجهز. لو الصف ده فيه أسئلة وماظهرتش، افتح التطبيق مرة وإنت معاك نت.')); return; }
    var qt = toks(text);
    var r = qa.map(function (x) { return { x: x, s: score(qt, x.t, x.n), c: cover(qt, x.t) }; })
      .filter(function (o) { return o.s >= 0.25; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 5);
    if (!r.length) {
      box.appendChild(el('div', 'empty', 'ملقتش السؤال ده في المنهج. جرّب تكتبه بكلمات تانية أو بكلمة أساسية واحدة (مثال: النيل).'));
      return;
    }
    var rest = r;
    var sure = r[0].s >= 0.45 && r[0].c >= 0.74;
    if (sure) {
      showAnswer(r[0].x, box);
      // الأسئلة القريبة: بس اللي فعلًا قريبة (مش أي كلمة مشتركة)
      rest = r.slice(1).filter(function (o) { return o.s >= 0.5 && o.c >= 0.5; }).slice(0, 3);
    }
    if (rest.length) {
      box.appendChild(el('div', 'more', sure ? 'أسئلة قريبة:' : 'مش لاقي نفس السؤال بالظبط. تقصد سؤال من دول؟'));
      rest.forEach(function (o) {
        var b = el('button', 'sug', o.x.q);
        b.onclick = function () { box.innerHTML = ''; showAnswer(o.x, box); $('q').value = o.x.q; };
        box.appendChild(b);
      });
    }
  }
  $('askBtn').onclick = ask;

  fetch('qa.json').then(function (r) { return r.ok ? r.json() : []; }).then(function (j) {
    qa = (j || []).map(function (x) {
      return { q: x.q, a: x.a, ref: x.ref || '', t: toks(x.q + ' ' + (x.k || '')), n: toks(x.q).length };
    });
  }).catch(function () {});

  /* ---------- التثبيت ---------- */
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  var deferred = null;
  if (!standalone) {
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    $('installTxt').textContent = ios
      ? 'افتح الصفحة من Safari، دوس زرار المشاركة ⬆ واختار «إضافة إلى الشاشة الرئيسية».'
      : 'دوس على الـ٣ نقط ⋮ فوق في جوجل كروم واختار «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».';
    $('install').classList.remove('hide');
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      $('installBtn').classList.remove('hide');
    });
    $('installBtn').onclick = function () {
      if (!deferred) return;
      deferred.prompt();
      deferred = null;
      $('installBtn').classList.add('hide');
    };
    window.addEventListener('appinstalled', function () { $('install').classList.add('hide'); });
  }

  /* ---------- القفل: رقم سري لكل جهاز ----------
     كود الجهاز عشوائي ومحفوظ في الموبايل (لو التطبيق اتمسح أو اتثبت على موبايل تاني = كود جديد).
     مستر شريف من تطبيق الإدارة بيطلّع رقم سري ويسجّل في devices.json بصمة (الصف + كود الجهاز + الرقم).
     التطبيق بيتفتح لو البصمة موجودة؛ ولو اتشالت (إلغاء) بيتقفل أول ما يتفتح بالنت. */
  function deviceId() {
    var d = null;
    try { d = localStorage.getItem('school-device'); } catch (e) {}
    if (!d) {
      var A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', r = new Uint8Array(8), s = '';
      crypto.getRandomValues(r);
      for (var i = 0; i < 8; i++) { s += A.charAt(r[i] % A.length); if (i === 3) s += '-'; }
      d = s;
      try { localStorage.setItem('school-device', d); } catch (e) {}
    }
    return d;
  }
  function sha(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('').slice(0, 32);
    });
  }
  function fetchKeys() {
    var path = ROOT + '/' + G + '/devices.json';
    var parse = function (r) { if (r.status === 404) return { keys: [] }; if (!r.ok) throw new Error('keys'); return r.json(); };
    return fetch(API + path + '?ref=main&t=' + Date.now(), { cache: 'no-store', headers: { Accept: 'application/vnd.github.raw+json' } })
      .then(parse)
      .catch(function () { return fetch('devices.json?t=' + Date.now(), { cache: 'no-store' }).then(parse); })
      .then(function (j) { return (j && j.keys) || []; });
  }
  function digits(s) {
    return String(s).replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x0660); })
      .replace(/[۰-۹]/g, function (c) { return String(c.charCodeAt(0) - 0x06F0); }).replace(/\D/g, '');
  }

  var DEV = deviceId();
  var act = load('act', null);

  function lockMsg(t) { $('lockMsg').textContent = t || ''; }
  function setWa() {
    var name = $('sname').value.trim();
    var txt = 'السلام عليكم يا مستر شريف' + (name ? '، أنا ' + name : '') + '\nعايز رقم سري لتطبيق ' + info[0] + '\nكود جهازي: ' + DEV;
    $('waBtn').href = 'https://wa.me/' + TEACHER_WA + '?text=' + encodeURIComponent(txt);
  }
  function showLock(msg) {
    $('dev').textContent = DEV;
    var hint = $('instHint');
    if (hint) hint.classList.toggle('hide', !!standalone);
    setWa();
    $('lock').classList.remove('hide');
    lockMsg(msg);
  }
  function unlock() {
    $('lock').classList.add('hide');
    if (navigator.onLine) update(false);
  }
  $('sname').oninput = setWa;
  $('actBtn').onclick = function () {
    var c = digits($('code').value);
    if (c.length !== 6) { lockMsg('الرقم السري ٦ أرقام. اكتبه زي ما مستر شريف بعته.'); return; }
    if (!navigator.onLine) { lockMsg('محتاج نت أول مرة بس عشان التطبيق يتأكد من الرقم.'); return; }
    $('actBtn').disabled = true;
    lockMsg('جاري التأكد من الرقم…');
    sha(G + ':' + DEV + ':' + c).then(function (h) {
      return fetchKeys().then(function (keys) {
        if (keys.indexOf(h) >= 0) {
          act = { h: h, t: Date.now() };
          save('act', act);
          $('code').value = '';
          lockMsg('');
          unlock();
        } else {
          lockMsg('الرقم ده مش لجهازك أو لسه ماتسجلش. اتأكد منه، أو استنى دقيقتين وجرّب تاني.');
        }
      });
    }).catch(function () {
      lockMsg('مقدرتش أتأكد دلوقتي. اتأكد إن النت شغال وجرّب تاني.');
    }).then(function () { $('actBtn').disabled = false; });
  };
  function recheck() {
    if (!act || !navigator.onLine) return;
    fetchKeys().then(function (keys) {
      if (keys.indexOf(act.h) < 0) {
        act = null;
        save('act', null);
        closeLesson();
        showLock('مستر شريف لغى الرقم السري ده. كلّمه عشان يبعتلك رقم جديد.');
      }
    }).catch(function () {});
  }

  /* ---------- تشغيل ---------- */
  render();
  if (window.caches && list.length) {
    caches.open(CACHE).then(function (c) {
      return Promise.all(list.map(function (l) {
        return c.match(lessonUrl(l.name)).then(function (m) { if (!m) l.ok = false; });
      }));
    }).then(render).catch(function () {});
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
  if (act) { unlock(); recheck(); } else showLock();
})();
