// سلاح التلميذ — «📦 استلمت» لمرتجع المدرس.
// ملف واحد مشترك بين 💬 المراسلات (admin.html) والبرنامج الأخضر (index.html ← البيع ← ↩️ مرتجع) عشان الحساب والتسجيل يبقوا واحد.
// db = بيانات البرنامج الأخضر (selah-books-v1). التسجيل الفعلي في حساب المدرس بيعمله البرنامج الأخضر في applyTRet من db.tret.
(function () {
  var SUBJ = { ar: 'عربي', math: 'رياضة', en: 'إنجليزي', sci: 'علوم', stu: 'دراسات' };
  var GR = ['أولى', 'تانية', 'تالتة', 'رابعة', 'خامسة', 'سادسة'];
  function label(k) { var p = String(k).split('-'); return (SUBJ[p[1]] || p[1]) + ' ' + (GR[p[2] - 1] || p[2]) + ' ' + (p[0] === 'm' ? 'إعدادي' : 'ابتدائي'); }
  function r2(n) { return Math.round((+n || 0) * 100) / 100; }
  function money(n) { return r2(n).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' ج'; }

  // قيمة المرتجع بنفس طريقة البرنامج الأخضر: من أحدث بيع الأول، وبسعر البيع نفسه (المحفوظ في الفاتورة)
  function calc(db, localId, items) {
    var done = {}, lines = [], resv = {}, value = 0, ok = true, out = [];
    (db.payments || []).forEach(function (p) { if (p.k === 'ret' && p.t === localId) (p.parts || []).forEach(function (pt) { var k = pt.sale + ':' + pt.i; done[k] = (done[k] || 0) + pt.q; }); });
    (db.sales || []).forEach(function (s) { if (s.st === 'sold' && s.t === localId) (s.items || []).forEach(function (it, i) { var left = it.q - (done[s.id + ':' + i] || 0); if (left > 0) lines.push({ it: it, left: left, sd: s.sd || '' }); }); });
    lines.sort(function (x, y) { return y.sd.localeCompare(x.sd); });
    // اللي اتسجّل «استلمت» ولسه البرنامج الأخضر ما نفّذوش محجوز
    (db.tret || []).forEach(function (r) { if (!r.done && r.t === localId) (r.items || []).forEach(function (i) { resv[i.b] = (resv[i.b] || 0) + i.q; }); });
    (items || []).forEach(function (i) {
      var skip = resv[i.b] || 0, need = +i.q || 0, v = 0;
      lines.forEach(function (l) {
        if (!need || l.it.b !== i.b) return;
        var left = l.left, sk = Math.min(skip, left); skip -= sk; left -= sk;
        var n = Math.min(need, left); if (n > 0) { v += n * (l.it.post || 0); need -= n; }
      });
      if (need) ok = false; value += v;
      out.push({ b: i.b, l: i.l || label(i.b), q: i.q, post: i.q ? v / i.q : null });
    });
    return { ok: ok, value: r2(value), items: out };
  }

  // r = صف من جدول returns ومعاه teachers(name, local_id).
  // api: mark(id, body) → {ok, err}  (returns ← received، بشرط إنه لسه approved)
  //      save(db)                    (حفظ بيانات البرنامج الأخضر)
  //      ledger(row) → نص الخطأ أو ''  (فواتير المدرس)
  //      notify(teacherId, text)     (إشعار للمدرس)
  // بيرجّع {ok, value, warn} أو {cancel:true} أو {err:'…'}
  async function receive(db, r, api) {
    var t = r.teachers || {}, items = r.items || [];
    if (!db || !t.local_id || !(db.teachers || []).some(function (x) { return x.id === t.local_id; }))
      return { err: 'المدرس مش في البرنامج على الموبايل ده — «استلمت» من موبايل المندوب بتاعه' };
    var c = calc(db, t.local_id, items);
    if (!c.ok) return { err: 'الكمية أكتر من اللي مسجّل في البيع عندك — راجع البيع الأول' };
    if (!confirm('استلمت الكتب دي من ' + (t.name || 'المدرس') + '؟\n' + items.map(function (i) { return (i.l || label(i.b)) + ': ' + i.q; }).join('\n') + '\n\nقيمتها ' + money(c.value) + ' — هتتسجّل مرتجع وتتخصم من حسابه.')) return { cancel: true };
    var now = new Date().toISOString();
    var m = await api.mark(r.id, { status: 'received', value: c.value, received_at: now });
    if (!m || !m.ok) return { err: (m && m.err) || 'المرتجع ده اتغيّر — اعمل تحديث' };
    (db.tret = db.tret || []).push({ id: r.id, t: t.local_id, items: items.map(function (i) { return { b: i.b, q: i.q }; }), at: now });
    (db.tlog = db.tlog || []).push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: t.local_id, at: now, k: 'مرتجع', txt: 'مرتجع من المدرس (استلمته): ' + items.map(function (i) { return label(i.b) + ' ' + i.q; }).join('، ') });
    api.save(db);
    var warn = '';
    try { warn = (await api.ledger({ teacher_id: r.teacher_id, ref: 'rq:' + r.id, kind: 'ret', at: now, items: c.items, total: c.value })) || ''; } catch (e) { warn = 'ledger'; }
    try { api.notify(r.teacher_id, '✅ استلمنا المرتجع بتاعك — اتسجّل في فواتيرك'); } catch (e) { }
    return { ok: true, value: c.value, warn: warn };
  }

  // مهمة 3: حركات المدرس اللي بتتنسخ عنده (جدول ledger) — نفس الحساب في البرنامج الأخضر والمراسلات.
  // sale فاتورة بيع · ret مرتجع (متجمّع بـ g) · pay دفعة · free تسليم مجاني. mine = {id المدرس في البرنامج: id المدرس في المراسلات}
  function ledgerRows(db, mine) {
    var S = {}, rows = [];
    (db.sales || []).forEach(function (s) { S[s.id] = s; });
    (db.sales || []).forEach(function (s) {
      if (s.st !== 'sold' || !mine[s.t]) return;
      var its = (s.items || []).filter(function (i) { return i.q > 0; }).map(function (i) { return { b: i.b, l: label(i.b), q: +i.q, pre: i.pre == null ? null : i.pre, post: i.post == null ? null : i.post }; });
      if (its.length) rows.push({ teacher_id: mine[s.t], ref: 's:' + s.id, kind: 'sale', at: s.sd || s.d || new Date().toISOString(), items: its, total: r2(its.reduce(function (a, i) { return a + (i.post != null ? i.q * i.post : 0); }, 0)) });
    });
    var rg = {};
    (db.payments || []).forEach(function (p) {
      if (!mine[p.t]) return;
      if (p.k === 'pay') { rows.push({ teacher_id: mine[p.t], ref: 'p:' + p.id, kind: 'pay', at: p.d || new Date().toISOString(), items: [], total: r2(p.amt) }); return; }
      if (p.k !== 'ret' || p.rid) return;
      var v = 0, pv = 0, hasPre = true;
      (p.parts || []).forEach(function (pt) { var it = S[pt.sale] && S[pt.sale].items[pt.i]; if (it && it.post != null) v += pt.q * it.post; if (it && it.pre != null) pv += pt.q * it.pre; else hasPre = false; });
      var g = rg[p.g || p.id] = rg[p.g || p.id] || { t: p.t, at: p.d, items: [], total: 0 };
      g.items.push({ b: p.b, l: label(p.b), q: +p.q, pre: hasPre && p.q ? r2(pv / p.q) : null, post: p.q ? r2(v / p.q) : null }); g.total = r2(g.total + v);
    });
    Object.keys(rg).forEach(function (k) { rows.push({ teacher_id: mine[rg[k].t], ref: 'r:' + k, kind: 'ret', at: rg[k].at || new Date().toISOString(), items: rg[k].items, total: rg[k].total }); });
    var fg = {};
    (db.entries || []).forEach(function (e) {
      if (e.s !== 'd' || !mine[e.t] || !e.dd) return;
      var g = fg[e.t + ':' + e.dd] = fg[e.t + ':' + e.dd] || { t: e.t, at: e.dd, m: {} }; g.m[e.b] = (g.m[e.b] || 0) + (+e.q || 0);
    });
    Object.keys(fg).forEach(function (k) { var g = fg[k]; rows.push({ teacher_id: mine[g.t], ref: 'f:' + k, kind: 'free', at: g.at.length <= 10 ? g.at + 'T12:00:00Z' : g.at, items: Object.keys(g.m).filter(function (b) { return g.m[b] > 0; }).map(function (b) { return { b: b, l: label(b), q: g.m[b] }; }), total: null }); });
    return rows;
  }

  window.SilahRet = { calc: calc, receive: receive, label: label, money: money, ledgerRows: ledgerRows };
})();
