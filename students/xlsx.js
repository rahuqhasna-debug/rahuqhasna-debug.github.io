/* طلابي — قراءة وكتابة ملفات إكسل جوه الموبايل من غير نت ومن غير أي مكتبة */
(function (G) {
  'use strict';
  const te = new TextEncoder(), td = new TextDecoder();

  /* ---------- أدوات XML ---------- */
  const ent = s => String(s).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  const texts = x => { let s = ''; x.replace(/<rPh[\s\S]*?<\/rPh>/g, '').replace(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g, (_, t) => { s += ent(t); return ''; }); return s; };
  const attr = (a, n) => { const m = a.match(new RegExp('(?:^|\\s)' + n.replace(':', '\\:') + '="([^"]*)"')); return m ? m[1] : null; };
  const colIdx = ref => { let n = 0; for (const ch of String(ref).replace(/[^A-Z]/g, '')) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const colName = i => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - m - 1) / 26; } return s; };

  /* ---------- فك ملف zip ---------- */
  async function inflateRaw(u8) {
    if (typeof DecompressionStream === 'undefined') throw new Error('المتصفح قديم — حدّث جوجل كروم وجرب تاني');
    const st = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(st).arrayBuffer());
  }
  async function unzip(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    let i = u8.length - 22;
    while (i >= 0 && dv.getUint32(i, true) !== 0x06054b50) i--;
    if (i < 0) throw new Error('الملف ده مش ملف إكسل (xlsx)');
    const n = dv.getUint16(i + 10, true); let p = dv.getUint32(i + 16, true);
    const out = {};
    for (let k = 0; k < n; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
      const name = td.decode(u8.subarray(p + 46, p + 46 + nl));
      if (/\.(xml|rels)$/i.test(name)) {
        const start = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
        const data = u8.subarray(start, start + csize);
        out[name] = td.decode(method === 0 ? data : await inflateRaw(data));
      }
      p += 46 + nl + el + cl;
    }
    return out;
  }

  /* ---------- قراءة xlsx ← [{name, rows:[[قيم]]}] ---------- */
  async function read(buf) {
    const f = await unzip(buf);
    const ss = [];
    (f['xl/sharedStrings.xml'] || '').replace(/<si>([\s\S]*?)<\/si>/g, (_, x) => { ss.push(texts(x)); return ''; });
    const rels = {};
    (f['xl/_rels/workbook.xml.rels'] || '').replace(/<Relationship\b([^>]*)>/g, (_, a) => {
      const id = attr(a, 'Id'), t = attr(a, 'Target'); if (id && t) rels[id] = t.replace(/^\/?xl\//, '').replace(/^\//, ''); return '';
    });
    const sheets = [];
    (f['xl/workbook.xml'] || '').replace(/<sheet\b([^>]*)>/g, (_, a) => { sheets.push({ name: ent(attr(a, 'name') || ''), rid: attr(a, 'r:id') }); return ''; });
    return sheets.map(s => {
      const x = f['xl/' + rels[s.rid]] || '';
      const rows = []; let lastR = -1;
      x.replace(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g, (_, ra, body) => {
        const rAttr = attr(ra, 'r'); const r = rAttr ? +rAttr - 1 : lastR + 1; lastR = r;
        if (!body) return '';
        const row = rows[r] = []; let lastC = -1;
        body.replace(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, (_, ca, cb) => {
          const ref = attr(ca, 'r'); const c = ref ? colIdx(ref) : lastC + 1; lastC = c;
          if (!cb) return '';
          const t = attr(ca, 't'); let v = null;
          const vm = cb.match(/<v>([\s\S]*?)<\/v>/);
          if (t === 's') v = vm ? ss[+vm[1]] : null;
          else if (t === 'inlineStr') v = texts(cb);
          else if (vm) v = (t === 'str' || t === 'e' || isNaN(+vm[1])) ? ent(vm[1]) : +vm[1];
          if (v !== null && v !== '') row[c] = v;
          return '';
        });
        return '';
      });
      return { name: s.name, rows };
    });
  }

  /* ---------- كتابة zip (من غير ضغط) ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files, type) {
    const parts = [], cd = []; let off = 0;
    for (const f of files) {
      const name = te.encode(f.name), d = f.data, crc = crc32(d);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, d);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      cd.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + d.length;
    }
    const cdSize = cd.reduce((s, x) => s + x.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...cd, new Uint8Array(e.buffer)], { type: type || 'application/zip' });
  }

  /* ---------- كتابة xlsx بألوان ---------- */
  // ألوان الخلايا: 0 عنوان أزرق، 1 تاريخ دهبي، والباقي ألوان الرموز
  const FILLS = ['1F4E78', 'D99B00', 'A9D08E', '9DC3E6', 'FFD966', 'F4B183', 'ED7D31', 'FF6B6B', '7FD1C7', 'B48EDD', 'E2EFDA', 'FCE4D6', 'F2F2F2', '276A3C', 'FFC7CE', 'DDEBF7'];
  // s: 'h' عنوان | 'd' تاريخ | 'n' عادي | 'w' نص طويل | 'g' أخضر | لون hex من FILLS
  const styleId = s => {
    if (!s || s === 'n') return 3; if (s === 'h') return 1; if (s === 'd') return 2; if (s === 'w') return 4; if (s === 'g') return 5 + FILLS.indexOf('276A3C') - 2 + FILLS.length - 2;
    const i = FILLS.indexOf(String(s).replace('#', '').toUpperCase()); return i >= 2 ? 5 + i - 2 : 3;
  };
  function stylesXml() {
    const fills = FILLS.map(c => `<fill><patternFill patternType="solid"><fgColor rgb="FF${c}"/><bgColor indexed="64"/></patternFill></fill>`).join('');
    const xf = (font, fill, align, wrap) => `<xf numFmtId="0" fontId="${font}" fillId="${fill}" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="${align}" vertical="center"${wrap ? ' wrapText="1"' : ''} readingOrder="2"/></xf>`;
    const xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>', xf(1, 2, 'center', 1), xf(1, 3, 'center', 1), xf(0, 0, 'right'), xf(0, 0, 'right', 1)];
    for (let i = 2; i < FILLS.length; i++) xfs.push(xf(2, i + 2, 'center'));           // 5.. ألوان الرموز
    for (let i = 2; i < FILLS.length; i++) xfs.push(xf(1, i + 2, 'center'));           // نفس الألوان بخط أبيض
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="3"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts>' +
      `<fills count="${FILLS.length + 2}"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>${fills}</fills>` +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD0D7E5"/></left><right style="thin"><color rgb="FFD0D7E5"/></right><top style="thin"><color rgb="FFD0D7E5"/></top><bottom style="thin"><color rgb="FFD0D7E5"/></bottom><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      `<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  }
  function sheetXml(sh) {
    const rows = sh.rows.map((r, ri) => `<row r="${ri + 1}"${sh.heights && sh.heights[ri] ? ` ht="${sh.heights[ri]}" customHeight="1"` : ''}>` + r.map((c, ci) => {
      if (c == null || c === '') return '';
      const o = typeof c === 'object' ? c : { v: c };
      if (o.v == null || o.v === '') return o.s ? `<c r="${colName(ci)}${ri + 1}" s="${styleId(o.s)}"/>` : '';
      const ref = colName(ci) + (ri + 1), s = styleId(o.s);
      if (typeof o.v === 'number' && isFinite(o.v)) return `<c r="${ref}" s="${s}"><v>${o.v}</v></c>`;
      return `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${esc(o.v)}</t></is></c>`;
    }).join('') + '</row>').join('');
    const cols = sh.cols ? '<cols>' + sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('') + '</cols>' : '';
    let pane = '';
    if (sh.freeze) {
      const [x, y] = sh.freeze, ap = x && y ? 'bottomRight' : y ? 'bottomLeft' : 'topRight';
      pane = `<pane${x ? ` xSplit="${x}"` : ''}${y ? ` ySplit="${y}"` : ''} topLeftCell="${colName(x)}${y + 1}" activePane="${ap}" state="frozen"/>`;
    }
    const merges = sh.merges && sh.merges.length ? `<mergeCells count="${sh.merges.length}">${sh.merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      `<sheetViews><sheetView rightToLeft="1" workbookViewId="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/>${cols}<sheetData>${rows}</sheetData>${merges}</worksheet>`;
  }
  function build(sheets) {
    const names = [];
    sheets.forEach(s => { let n = String(s.name || 'ورقة').replace(/[\[\]:*?\/\\]/g, ' ').trim().slice(0, 31) || 'ورقة'; let k = 2; while (names.includes(n)) n = n.slice(0, 27) + ' ' + k++; names.push(n); });
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', NS = 'http://schemas.openxmlformats.org/';
    const files = [
      ['[Content_Types].xml', X + `<Types xmlns="${NS}package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>'],
      ['_rels/.rels', X + `<Relationships xmlns="${NS}package/2006/relationships"><Relationship Id="rId1" Type="${NS}officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ['xl/workbook.xml', X + `<workbook xmlns="${NS}spreadsheetml/2006/main" xmlns:r="${NS}officeDocument/2006/relationships"><sheets>` +
        names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', X + `<Relationships xmlns="${NS}package/2006/relationships">` +
        sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="${NS}officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${sheets.length + 1}" Type="${NS}officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml', stylesXml()],
      ...sheets.map((s, i) => ['xl/worksheets/sheet' + (i + 1) + '.xml', sheetXml(s)])
    ];
    return zip(files.map(([name, x]) => ({ name, data: te.encode(x) })), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  G.XLSX = { read, build, FILLS, colName };
})(typeof window !== 'undefined' ? window : globalThis);
