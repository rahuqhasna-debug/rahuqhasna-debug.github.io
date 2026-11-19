// سلاح التلميذ — حساب المدرس بشكل جدول الإكسل (خطوط طول وعرض، كل معلومة في خلية).
// ملف واحد مشترك: البرنامج الأخضر (index.html) وتطبيق المدرس (teacher.html) والصورة اللي بتتبعت — فالشكل واحد في التلاتة.
// + سهم الرجوع بتاع الموبايل بيقفل آخر نافذة مفتوحة (index / admin / teacher).
(function () {
  var SC = { ar: '1D4ED8', math: '15803D', stu: '92400E', en: '7E22CE', sci: 'EA580C' };
  var DAYS = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
  var KC = { inv: '#1d4ed8', ret: '#ea580c', pay: '#15803d', free: '#16a34a' };
  function color(b) { var p = String(b || '').split('-'); return '#' + (SC[p[1]] || '111111'); }
  function nf(n) { return (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function money(n) { return nf(n) + ' ج'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function full(iso) { if (!iso) return ''; var d = new Date(iso); if (isNaN(d)) return ''; var h = d.getHours(), ap = h < 12 ? 'ص' : 'م'; h = h % 12 || 12; return DAYS[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + ' الساعة ' + h + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + ap; }
  function shortTxt(items) { return (items || []).map(function (i) { return i.l + ' × ' + i.q; }).join('، '); }
  function L(me) { return me ? { q: 'خدت', r: 'رجّعت', paid: 'اللي دفعته', due: 'الباقي عليك' } : { q: 'خد', r: 'رجّع', paid: 'المدفوع', due: 'الباقي عليه' }; }

  var CSS = '.xinv{background:#fff;color:#111;max-width:640px;margin:0 auto;border:2px solid #6d28d9;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.15);font-size:14px}'
    + '.xinv .xh{background:#6d28d9;color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}.xinv .xh .xb{flex:1;font-weight:800;font-size:20px}.xinv .xh .xt{font-weight:800;font-size:17px}'
    + '.xinv .xbody{padding:10px}.xinv .xscroll{overflow-x:auto;-webkit-overflow-scrolling:touch}'
    + '.xg{width:100%;border-collapse:collapse;margin:0 0 10px;background:#fff}.xg th,.xg td{border:1px solid #9ca3af;padding:6px 5px;text-align:center;vertical-align:middle;color:#111}'
    + '.xg thead th{background:#6d28d9;color:#fff;font-size:12.5px;font-weight:800}.xg tbody tr.z td{background:#f3f4f6}'
    + '.xg.xinfo th{background:#ede9fe;color:#4c1d95;width:34%;text-align:right;font-weight:700}.xg.xinfo td{text-align:right;font-weight:800}'
    + '.xg .bn{font-weight:800;text-align:right}.xg .pp{font-size:12px;line-height:1.35}.xg .pp s{color:#888}.xg .rr{color:#ea580c;font-weight:800}'
    + '.xg.xtot th{text-align:right;background:#f9fafb;font-weight:700}.xg.xtot td{font-weight:800;width:40%}.xg.xtot s{color:#888}'
    + '.xg.xtot tr.due th,.xg.xtot tr.due td{background:#b91c1c;color:#fff;font-size:18px;font-weight:800;border-color:#991b1b}'
    + '.xg.xmv tr.mvr td{font-weight:800;cursor:pointer}.xg.xmv tr.mvs td{font-size:12.5px;color:#374151;text-align:right;cursor:pointer}.xg.xmv tr.mvs .hint{color:#6d28d9;font-weight:700;white-space:nowrap}'
    + '.xg.xmv tr.mvd>td{background:#faf5ff;padding:6px}.xg.xmv tr.mvd .xg{margin:0 0 6px}.xg.xmv .acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}'
    + '.xinv h4{margin:12px 0 6px;color:#6d28d9;font-size:16px}.xinv .xfoot{text-align:center;color:#6b7280;font-size:12px;padding:6px 0 2px;border-top:1px dashed #d1d5db}.xinv .xnp{color:#b45309;font-weight:700;text-align:center;margin:0 0 8px}'
    + '@media (max-width:420px){.xinv{font-size:13px}.xinv .xbody{padding:6px}.xg th,.xg td{padding:5px 3px}.xg thead th{font-size:11px}.xg .pp{font-size:11px}.xg.xtot tr.due th,.xg.xtot tr.due td{font-size:16px}}';
  function css() { if (document.getElementById('xinv-css')) return; var s = document.createElement('style'); s.id = 'xinv-css'; s.textContent = CSS; document.head.appendChild(s); }

  // M = {name, rep, last, rows:[{b,l,pre,post,q,r}], pre, post, paid, owe, noPrice, moves:[{k,t,d,v,items:[{b,l,q,pre,post}],id,key,sale}]}
  // o = {me: صفحة المدرس (خدت/رجّعت/الباقي عليك), edit: أزرار التعديل تحت كل حركة}
  function html(M, o) {
    o = o || {}; css(); var T = L(o.me);
    var books = M.rows.map(function (r, i) {
      var f = r.q - r.r, pp = r.pre != null ? r.pre : r.post, z = i % 2 ? ' class="z"' : '';
      return '<tr' + z + '><td colspan="2" class="bn" style="color:' + color(r.b) + '">' + esc(r.l) + '</td><td rowspan="2">' + r.q + '</td><td rowspan="2" class="rr">' + (r.r || '') + '</td><td rowspan="2"><b>' + f + '</b></td><td rowspan="2">' + (pp != null ? '<s style="color:#888">' + nf(f * pp) + '</s>' : '—') + '</td><td rowspan="2"><b>' + (r.post != null ? nf(f * r.post) : '—') + '</b></td></tr>'
        + '<tr' + z + '><td class="pp">قبل<br>' + (r.pre != null ? '<s>' + nf(r.pre) + '</s>' : '—') + '</td><td class="pp">بعد<br><b>' + (r.post != null ? nf(r.post) : '—') + '</b></td></tr>';
    }).join('');
    var mv = M.moves.map(function (x, i) {
      var c = KC[x.k] || '#111', val = x.v == null ? '—' : (x.k === 'ret' ? '− ' : '') + money(x.v), has = (x.items || []).length;
      var det = has ? '<table class="xg"><thead><tr><th>الكتاب</th><th>العدد</th><th>السعر قبل</th><th>السعر بعد</th><th>الإجمالي</th></tr></thead><tbody>' + x.items.map(function (it) {
        return '<tr><td class="bn" style="color:' + color(it.b) + '">' + esc(it.l) + '</td><td>' + it.q + '</td><td>' + (it.pre != null ? '<s style="color:#888">' + nf(it.pre) + '</s>' : '—') + '</td><td>' + (it.post != null ? nf(it.post) : '—') + '</td><td><b>' + (it.post != null ? nf(it.q * it.post) : '—') + '</b></td></tr>';
      }).join('') + '</tbody></table>' : '';
      var ed = '';
      if (o.edit) ed = x.k === 'inv' ? '<button class="btn sm ghost" data-inv="e-inv" data-id="' + esc(x.id) + '">✏️ عدّل الفاتورة والمرتجع بتاعها</button>'
        : x.k === 'ret' ? (x.sale ? '<button class="btn sm ghost" data-inv="e-inv" data-id="' + esc(x.sale) + '">✏️ عدّل المرتجع</button>' : '') + '<button class="btn sm danger" data-inv="d-ret" data-k="' + esc(x.key) + '">🗑️ امسح المرتجع</button>'
        : x.k === 'pay' ? '<button class="btn sm ghost" data-inv="e-pay" data-id="' + esc(x.id) + '">✏️ عدّل المبلغ</button><button class="btn sm danger" data-inv="d-pay" data-id="' + esc(x.id) + '">🗑️ امسح الدفعة</button>' : '';
      var open = (det || ed) ? '<tr class="mvd" data-mvd="' + i + '"' + (o.edit ? '' : ' hidden') + '><td colspan="3">' + det + (ed ? '<div class="acts">' + ed + '</div>' : '') + '</td></tr>' : '';
      return '<tr class="mvr" data-mvt="' + i + '"><td style="color:' + c + '">' + esc(x.t) + '</td><td>' + esc(full(x.d)) + '</td><td style="color:' + c + '">' + val + '</td></tr>'
        + (has ? '<tr class="mvs" data-mvt="' + i + '"><td colspan="3">' + esc(shortTxt(x.items)) + (open ? ' <span class="hint">— دوس تشوف التفاصيل</span>' : '') + '</td></tr>' : '') + open;
    }).join('');
    return '<div class="xinv"><div class="xh"><div class="xb">سلاح التلميذ</div><div class="xt">حساب المدرس</div></div><div class="xbody">'
      + '<table class="xg xinfo"><tr><th>المدرس</th><td>' + esc(M.name) + '</td></tr>' + (M.rep ? '<tr><th>مسؤول الدعاية</th><td style="color:#6d28d9">أ/ ' + esc(M.rep) + '</td></tr>' : '') + '<tr><th>آخر تحديث</th><td>' + esc(full(M.last) || '—') + '</td></tr></table>'
      + (M.rows.length ? '<div class="xscroll"><table class="xg"><thead><tr><th colspan="2">الكتاب</th><th>' + T.q + '</th><th>' + T.r + '</th><th>الصافي</th><th>الإجمالي قبل الخصم</th><th>الإجمالي بعد الخصم</th></tr></thead><tbody>' + books + '</tbody></table></div>' : '<table class="xg"><tr><td>لسه مفيش فواتير بيع.</td></tr></table>')
      + (M.noPrice ? '<div class="xnp">فيه كتب السعر بتاعها لسه ما اتحددش</div>' : '')
      + '<table class="xg xtot"><tr><th>الإجمالي قبل الخصم</th><td><s>' + money(M.pre) + '</s></td></tr><tr><th>الإجمالي بعد الخصم</th><td>' + money(M.post) + '</td></tr><tr><th>' + T.paid + '</th><td style="color:#15803d">' + money(M.paid) + '</td></tr><tr class="due"><th>' + T.due + '</th><td>' + money(M.owe) + '</td></tr></table>'
      + (M.moves.length ? '<h4>📜 الحركات بالترتيب</h4><table class="xg xmv"><thead><tr><th>الحركة</th><th>اليوم والتاريخ والساعة</th><th>المبلغ</th></tr></thead><tbody>' + mv + '</tbody></table>' : '')
      + '<div class="xfoot">سلاح التلميذ البحيرة</div></div></div>';
  }
  // الدوسة على الحركة بتفتح/تقفل تفاصيلها (وسهم الرجوع بيقفلها)
  function bind(root) {
    root.addEventListener('click', function (e) {
      if (e.target.closest('button,a,input')) return;
      var r = e.target.closest('[data-mvt]'); if (!r || !root.contains(r)) return;
      var d = root.querySelector('[data-mvd="' + r.dataset.mvt + '"]'); if (!d) return;
      d.hidden = !d.hidden; if (!d.hidden) backPush(d);
    });
  }

  // الصورة: نفس الجداول بالخطوط على canvas
  function canvas(M, o) {
    o = o || {}; var T = L(o.me);
    var W = 720, S = 2, P = 20, FF = '"Cairo","Segoe UI",Tahoma,"Noto Sans Arabic",Arial,sans-serif', IW = W - 2 * P;
    var IR = 34, BH = 34, BR1 = 30, BR2 = 40, TR = 36, DR = 46, MR = 34, MS = 28;
    var infoN = M.rep ? 3 : 2;
    var H = 96 + 12 + infoN * IR + 12 + BH + Math.max(1, M.rows.length) * (BR1 + BR2) + (M.noPrice ? 30 : 0) + 12 + 3 * TR + DR + (M.moves.length ? 14 + 34 + BH + M.moves.reduce(function (a, x) { return a + MR + ((x.items || []).length ? MS : 0); }, 0) : 0) + 44;
    var cv = document.createElement('canvas'); cv.width = W * S; cv.height = H * S;
    var x = cv.getContext('2d'); x.scale(S, S); x.direction = 'rtl'; x.textBaseline = 'middle';
    function font(sz, b) { x.font = (b ? 'bold ' : '') + sz + 'px ' + FF; }
    function text(s, px, py, sz, b, c, al) { font(sz || 15, b); x.fillStyle = c || '#111'; x.textAlign = al || 'center'; x.fillText(String(s), px, py); return x.measureText(String(s)).width; }
    function fit(s, maxW, sz, b) { s = String(s); font(sz, b); if (x.measureText(s).width <= maxW) return s; while (s.length > 1 && x.measureText(s + '…').width > maxW) s = s.slice(0, -1); return s + '…'; }
    function strike(cx, cy, w) { x.strokeStyle = '#888'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(cx - w / 2 - 2, cy); x.lineTo(cx + w / 2 + 2, cy); x.stroke(); }
    function cell(cx0, cy0, w, h, fill) { if (fill) { x.fillStyle = fill; x.fillRect(cx0, cy0, w, h); } x.strokeStyle = '#9ca3af'; x.lineWidth = 1; x.strokeRect(cx0 + .5, cy0 + .5, w, h); }
    // أعمدة من اليمين: بترجع [x البداية من الشمال، العرض]
    function colsOf(ws) { var out = [], r = W - P; ws.forEach(function (w) { out.push([r - w, w]); r -= w; }); return out; }
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#6d28d9'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, W - 3, H - 3);
    x.fillStyle = '#6d28d9'; x.fillRect(0, 0, W, 96);
    text('سلاح التلميذ', W - P, 38, 28, true, '#fff', 'right'); text('البحيرة', W - P, 72, 14, false, '#ede9fe', 'right');
    text('حساب المدرس', P, 48, 24, true, '#fff', 'left');
    var y = 96 + 12;
    // بيانات المدرس
    var ic = colsOf([230, IW - 230]);
    [['المدرس', M.name, '#111'], M.rep ? ['مسؤول الدعاية', 'أ/ ' + M.rep, '#6d28d9'] : null, ['آخر تحديث', full(M.last) || '—', '#111']].filter(Boolean).forEach(function (r) {
      cell(ic[0][0], y, ic[0][1], IR, '#ede9fe'); cell(ic[1][0], y, ic[1][1], IR);
      text(r[0], ic[0][0] + ic[0][1] - 10, y + IR / 2, 15, true, '#4c1d95', 'right');
      text(fit(r[1], ic[1][1] - 20, 16, true), ic[1][0] + ic[1][1] - 10, y + IR / 2, 16, true, r[2], 'right'); y += IR;
    });
    y += 12;
    // جدول الكتب: الكتاب (خليتين) | خد | رجّع | الصافي | الإجمالي قبل | الإجمالي بعد
    var bc = colsOf([110, 110, 62, 62, 70, 129, IW - 543]);
    cell(bc[1][0], y, 220, BH, '#6d28d9'); text('الكتاب', bc[1][0] + 110, y + BH / 2, 14, true, '#fff');
    [T.q, T.r, 'الصافي', 'الإجمالي قبل الخصم', 'الإجمالي بعد الخصم'].forEach(function (h, i) { var c = bc[i + 2]; cell(c[0], y, c[1], BH, '#6d28d9'); text(h, c[0] + c[1] / 2, y + BH / 2, i > 2 ? 12.5 : 14, true, '#fff'); });
    y += BH;
    if (!M.rows.length) { cell(P, y, IW, BR1 + BR2); text('لسه مفيش فواتير بيع.', W / 2, y + (BR1 + BR2) / 2, 15, false, '#555'); y += BR1 + BR2; }
    M.rows.forEach(function (r, i) {
      var z = i % 2 ? '#f3f4f6' : null, f = r.q - r.r, pp = r.pre != null ? r.pre : r.post, hh = BR1 + BR2, cy = y + hh / 2;
      cell(bc[1][0], y, 220, BR1, z); text(fit(r.l, 205, 15, true), bc[0][0] + 110 - 8, y + BR1 / 2, 15, true, color(r.b), 'right');
      cell(bc[0][0], y + BR1, 110, BR2, z); cell(bc[1][0], y + BR1, 110, BR2, z);
      text('قبل', bc[0][0] + 55, y + BR1 + 12, 11, false, '#555');
      if (r.pre != null) { var w1 = text(nf(r.pre), bc[0][0] + 55, y + BR1 + 29, 14, false, '#888'); strike(bc[0][0] + 55, y + BR1 + 29, w1); } else text('—', bc[0][0] + 55, y + BR1 + 29, 14, false, '#888');
      text('بعد', bc[1][0] + 55, y + BR1 + 12, 11, false, '#555'); text(r.post != null ? nf(r.post) : '—', bc[1][0] + 55, y + BR1 + 29, 14, true);
      [String(r.q), r.r ? String(r.r) : '', String(f)].forEach(function (v, k) { var c = bc[k + 2]; cell(c[0], y, c[1], hh, z); text(v, c[0] + c[1] / 2, cy, 16, k > 0, k === 1 ? '#ea580c' : '#111'); });
      var c5 = bc[5]; cell(c5[0], y, c5[1], hh, z); if (pp != null) { var w2 = text(nf(f * pp), c5[0] + c5[1] / 2, cy, 15, false, '#888'); strike(c5[0] + c5[1] / 2, cy, w2); } else text('—', c5[0] + c5[1] / 2, cy, 15, false, '#888');
      var c6 = bc[6]; cell(c6[0], y, c6[1], hh, z); text(r.post != null ? nf(f * r.post) : '—', c6[0] + c6[1] / 2, cy, 16, true);
      y += hh;
    });
    if (M.noPrice) { text('فيه كتب السعر بتاعها لسه ما اتحددش', W / 2, y + 16, 15, true, '#b45309'); y += 30; }
    y += 12;
    // الإجماليات
    var tc = colsOf([IW - 250, 250]);
    [['الإجمالي قبل الخصم', money(M.pre), '#888', true], ['الإجمالي بعد الخصم', money(M.post), '#111'], [T.paid, money(M.paid), '#15803d']].forEach(function (r) {
      cell(tc[0][0], y, tc[0][1], TR, '#f9fafb'); cell(tc[1][0], y, tc[1][1], TR);
      text(r[0], tc[0][0] + tc[0][1] - 10, y + TR / 2, 16, false, '#333', 'right'); var w3 = text(r[1], tc[1][0] + tc[1][1] / 2, y + TR / 2, 17, true, r[2]); if (r[3]) strike(tc[1][0] + tc[1][1] / 2, y + TR / 2, w3); y += TR;
    });
    x.fillStyle = '#b91c1c'; x.fillRect(P, y, IW, DR); cell(tc[0][0], y, tc[0][1], DR); cell(tc[1][0], y, tc[1][1], DR);
    text(T.due, tc[0][0] + tc[0][1] - 10, y + DR / 2, 20, true, '#fff', 'right'); text(money(M.owe), tc[1][0] + tc[1][1] / 2, y + DR / 2, 21, true, '#fff'); y += DR;
    // الحركات
    if (M.moves.length) {
      y += 14; text('📜 الحركات بالترتيب', W - P, y + 17, 17, true, '#6d28d9', 'right'); y += 34;
      var mc = colsOf([150, IW - 300, 150]);
      ['الحركة', 'اليوم والتاريخ والساعة', 'المبلغ'].forEach(function (h, i) { cell(mc[i][0], y, mc[i][1], BH, '#6d28d9'); text(h, mc[i][0] + mc[i][1] / 2, y + BH / 2, 14, true, '#fff'); }); y += BH;
      M.moves.forEach(function (m) {
        var c = KC[m.k] || '#111';
        cell(mc[0][0], y, mc[0][1], MR); cell(mc[1][0], y, mc[1][1], MR); cell(mc[2][0], y, mc[2][1], MR);
        text(fit(m.t, 140, 15, true), mc[0][0] + mc[0][1] / 2, y + MR / 2, 15, true, c);
        text(fit(full(m.d), mc[1][1] - 12, 14), mc[1][0] + mc[1][1] / 2, y + MR / 2, 14, false, '#111');
        text(m.v == null ? '—' : (m.k === 'ret' ? '− ' : '') + money(m.v), mc[2][0] + mc[2][1] / 2, y + MR / 2, 15, true, c); y += MR;
        if ((m.items || []).length) { cell(P, y, IW, MS, '#fafafa'); text(fit(shortTxt(m.items), IW - 20, 13), W - P - 10, y + MS / 2, 13, false, '#374151', 'right'); y += MS; }
      });
    }
    text('سلاح التلميذ البحيرة', W / 2, H - 22, 13, false, '#6b7280');
    return cv;
  }
  async function share(cv, name, title) {
    var blob = await new Promise(function (r) { cv.toBlob(r, 'image/jpeg', 0.92); });
    var file = new File([blob], name, { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: title }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  /* ---------- سهم الرجوع بتاع الموبايل: يقفل آخر حاجة مفتوحة (نافذة / الحساب / تفاصيل حركة) ---------- */
  var SEL = '.modal,.inv-wrap,#bellDrop', SKIP = { firstRun: 1 }, skipPop = 0;
  function isOv(n) { return n && n.nodeType === 1 && n.matches && n.matches(SEL) && !SKIP[n.id] && !n.hasAttribute('data-noback'); }
  function backPush(el) { el.__ov = 1; try { history.pushState({ ov: Date.now() }, ''); } catch (e) { } }
  function backPop() { skipPop++; try { history.back(); } catch (e) { skipPop--; } }
  function watch() {
    new MutationObserver(function (ms) {
      var add = 0, rem = 0;
      ms.forEach(function (m) {
        m.addedNodes.forEach(function (n) { if (isOv(n) && !n.__ov) { n.__ov = 1; n.__href = location.href; add++; } });
        m.removedNodes.forEach(function (n) {
          if (!n.__ov || n.__popped || document.body.contains(n)) return;
          if (n.__href && n.__href !== location.href) return;   // النافذة اتقفلت عشان يروح صفحة تانية — ما نرجعش
          rem++;
          if (n.querySelectorAll) Array.prototype.forEach.call(n.querySelectorAll('[data-mvd]'), function (d) { if (d.__ov) { d.__ov = 0; rem++; } });   // تفاصيل كانت مفتوحة جواها
        });
      });
      var net = add - rem;   // نافذة اتقفلت واتفتحت مكانها تانية في نفس اللحظة = نفس خطوة الرجوع
      for (; net > 0; net--) { try { history.pushState({ ov: Date.now() }, ''); } catch (e) { } }
      for (; net < 0; net++) backPop();
    }).observe(document.body, { childList: true });
    window.addEventListener('popstate', function () {
      if (skipPop) { skipPop--; return; }
      var ovs = Array.prototype.slice.call(document.querySelectorAll(SEL)).filter(function (n) { return n.__ov && !n.__popped; });
      var top = ovs[ovs.length - 1];
      var det = Array.prototype.slice.call((top || document).querySelectorAll('[data-mvd]')).filter(function (d) { return !d.hidden && d.__ov; }).pop();
      if (!top && !det) return;
      if (det) { det.hidden = true; det.__ov = 0; return; }
      top.__popped = true; top.remove();
    });
  }
  // تفاصيل الحركة اتقفلت بالدوسة (مش بالسهم) ← نشيل خطوتها من الرجوع
  document.addEventListener('click', function (e) {
    var r = e.target.closest && e.target.closest('[data-mvt]'); if (!r) return;
    setTimeout(function () { var root = r.closest('.xinv'); if (!root) return; var d = root.querySelector('[data-mvd="' + r.dataset.mvt + '"]'); if (d && d.hidden && d.__ov) { d.__ov = 0; backPop(); } }, 0);
  }, true);
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);

  // قبل ما الحساب يترسم من جديد: التفاصيل المفتوحة بتتقفل وخطوتها بتتشال من الرجوع
  function release(root) { Array.prototype.forEach.call((root || document).querySelectorAll('[data-mvd]'), function (d) { if (d.__ov) { d.__ov = 0; backPop(); } }); }

  window.SilahAcc = { html: html, bind: bind, release: release, canvas: canvas, share: share, full: full, money: money, nf: nf, color: color, shortTxt: shortTxt };
})();
