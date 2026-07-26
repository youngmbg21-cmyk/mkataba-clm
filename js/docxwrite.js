// HaTi — .docx writing. Globals are window-attached like every module
// (see components.js); the module also exports for node:test, because the
// writer is pure computation and the tests must run it on real bytes.
//
// js/docx.js reads a Word file by locating word/document.xml in the ZIP and
// projecting WordprocessingML to text. This is that in reverse, and it exists
// because of the plainest gap the UX review found: a contract DRAFTED in HaTi
// could not leave as a Word file, so the counterparty who negotiates in Word —
// most counterparties — could not be answered at all without copying the text
// out by hand and rebuilding it.
//
// Three decisions shape what comes out, all of them about not lying:
//
//   1. STORED, not deflated. A ZIP entry may be stored uncompressed (method 0),
//      and Word opens such an archive perfectly well — f9 already proves HaTi
//      READS one. Contracts are tens of kilobytes, so the compression buys
//      nothing worth an async CompressionStream in the middle of a download.
//
//   2. Clause numbers are written as LITERAL TEXT, never as Word list
//      numbering. Word regenerates its own numbering for a numbered list, and
//      a schedule that starts at clause 8 would be renumbered to 1 — breaking
//      every cross-reference in the agreement. This is the same reasoning
//      js/pdfrich.js already applies when it refuses to turn a dotted clause
//      number into an <ol>. The numbers the rich projection reconstructs are
//      the numbers that reach the file.
//
//   3. Headings are real Word headings (Heading1–Heading4 with a styles part),
//      so the document opens with a navigable structure rather than as one
//      undifferentiated block of prose.

/* ---------- ZIP (store-only) ---------- */
const _CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(bytes){
  let crc = 0 ^ (-1);
  for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ _CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}
function zipStore(files){
  const enc = new TextEncoder();
  const parts = [], central = [];
  let offset = 0, count = 0;
  for (const f of files){
    const name = enc.encode(f.name);
    const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
    const crc = crc32(data);
    const lh = new Uint8Array(30); const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);                        // method 0 = stored
    lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true);
    parts.push(lh, name, data);
    const ch = new Uint8Array(46); const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(10, 0, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true);
    central.push(ch, name);
    offset += 30 + name.length + data.length;
    count++;
  }
  const cdSize = central.reduce((n, p) => n + p.length, 0);
  const eocd = new Uint8Array(22); const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, count, true); ev.setUint16(10, count, true);
  ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
  const all = [...parts, ...central, eocd];
  const total = all.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of all){ out.set(p, at); at += p.length; }
  return out;
}

/* ---------- the document body ----------
   A "block" is one paragraph of the finished file: a style, and the runs that
   make up its text. Two producers feed it — a rich body walked as markup, and
   a plain body classified line by line — so both shapes of contract export the
   same way. */
const XE = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  // XML 1.0 forbids these control characters outright; one stray byte makes the
  // whole file unopenable, a poor way to find out that a contract contained one
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

const HEADING_STYLE = { H1:'Heading1', H2:'Heading2', H3:'Heading3', H4:'Heading4' };

/* Walk a sanitised rich fragment into blocks, reconstructing ordered-list
   numbering as literal text exactly as richToText does — the two must agree,
   or the Word file and the text projection would carry different clause
   numbers for the same document. */
function richToBlocks(html){
  const holder = document.createElement('div');
  holder.innerHTML = (window.sanitizeRich ? sanitizeRich(html) : String(html || ''));
  const blocks = [];
  const alpha = n => { let s=''; while(n>0){ const r=(n-1)%26; s=String.fromCharCode(65+r)+s; n=Math.floor((n-1)/26); } return s; };
  const roman = n => { const m=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let s=''; for(const [v,r] of m){ while(n>=v){ s+=r; n-=v; } } return s; };
  const marker = (ol, i) => {
    const start = parseInt(ol.getAttribute('start') || '1', 10) || 1;
    const n = start + i;
    switch (ol.getAttribute('type')){
      case 'a': return alpha(n).toLowerCase();
      case 'A': return alpha(n);
      case 'i': return roman(n).toLowerCase();
      case 'I': return roman(n);
      default: return String(n);
    }
  };

  let cur = null;
  const open = (style, indent) => { cur = { style: style || 'Normal', indent: indent || 0, runs: [] }; blocks.push(cur); return cur; };
  const push = (text, fmt) => {
    if (!text) return;
    if (!cur) open('Normal', 0);
    cur.runs.push({ text, b: !!(fmt && fmt.b), i: !!(fmt && fmt.i), u: !!(fmt && fmt.u) });
  };

  (function walk(node, fmt, depth){
    for (const ch of Array.from(node.childNodes)){
      if (ch.nodeType === 3){ push(ch.nodeValue.replace(/\s+/g, ' '), fmt); continue; }
      if (ch.nodeType !== 1) continue;
      const tag = ch.tagName;
      if (tag === 'BR'){ open(cur ? cur.style : 'Normal', cur ? cur.indent : depth); continue; }
      if (tag === 'STRONG'){ walk(ch, { ...fmt, b: true }, depth); continue; }
      if (tag === 'EM'){ walk(ch, { ...fmt, i: true }, depth); continue; }
      if (tag === 'U'){ walk(ch, { ...fmt, u: true }, depth); continue; }
      if (tag === 'S' || tag === 'SPAN'){ walk(ch, fmt, depth); continue; }
      if (HEADING_STYLE[tag]){ open(HEADING_STYLE[tag], depth); walk(ch, fmt, depth); cur = null; continue; }
      if (tag === 'P' || tag === 'BLOCKQUOTE' || tag === 'PRE'){
        open(tag === 'PRE' ? 'HatiPre' : 'Normal', depth + (tag === 'BLOCKQUOTE' ? 1 : 0));
        walk(ch, fmt, depth); cur = null; continue;
      }
      if (tag === 'OL' || tag === 'UL'){
        let i = 0;
        for (const li of Array.from(ch.children)){
          if (li.tagName !== 'LI') continue;
          open('Normal', depth + 1);
          // the marker is TEXT, deliberately — see the header note
          push((tag === 'OL' ? marker(ch, i) + '. ' : '• '), fmt);
          walk(li, fmt, depth + 1);
          cur = null;
          i++;
        }
        continue;
      }
      if (tag === 'TABLE' || tag === 'THEAD' || tag === 'TBODY'){ walk(ch, fmt, depth); continue; }
      if (tag === 'TR'){
        open('Normal', depth);
        const cells = Array.from(ch.children).map(td => (td.textContent || '').replace(/\s+/g, ' ').trim());
        push(cells.join('\t'), fmt);
        cur = null; continue;
      }
      if (tag === 'TH' || tag === 'TD'){ walk(ch, fmt, depth); continue; }
      walk(ch, fmt, depth);
    }
  })(holder, {}, 0);

  return blocks.filter(b => b.runs.some(r => r.text && r.text.trim()));
}

/* Plain text: the shape is still there as patterns, and docLineKind already
   knows how to read them (it is what the working-text view styles with). */
function textToBlocks(text){
  const lines = String(text || '').split('\n');
  const kindOf = window.docLineKind || (() => 'text');
  const out = [];
  for (const line of lines){
    const t = line.replace(/\s+$/, '');
    if (!t.trim()) continue;
    const kind = kindOf(t);
    out.push({
      style: kind === 'heading' ? 'Heading2' : 'Normal',
      indent: kind === 'clause' ? 1 : 0,
      runs: [{ text: t.trim(), b: false, i: false, u: false }],
    });
  }
  return out;
}

/* Blocks for a contract, whichever shape its body is in. */
function contractBlocks(c){
  /* A body marked 'rich' that contains no markup at all is plain text wearing
     the wrong label. Treating it as markup yields one undifferentiated block —
     the whole contract as a single paragraph — which is exactly what the
     counterparty portal shipped. The caller is the right place to fix a
     mislabelled descriptor, and it has been; this is the floor under every
     other caller, present and future. */
  const marked = !!(window.isRich && isRich(c.format) && c.redlineText);
  const hasMarkup = marked && /<[a-zA-Z][^>]*>/.test(String(c.redlineText));
  if (marked && hasMarkup) return richToBlocks(c.redlineText);
  const text = marked
    ? String(c.redlineText)
    : ((window.docPlainText ? docPlainText(c) : '') || '');
  return textToBlocks(text);
}

/* ---------- the red ink ----------
   HaTi could always READ Word's tracked changes and never write its own, so
   every counter a HaTi user sent left as clean text: the counterparty opened a
   document that looked untouched and had to run Word's own Compare to find out
   what had moved — the last manual, error-prone step in an otherwise closed
   loop, and the one a Word-only counterparty is least likely to perform
   reliably on the sixth round of a negotiation.

   What goes in the file is a REVISION, in Word's own vocabulary: inserted
   wording inside <w:ins>, removed wording inside <w:del> as <w:delText>, each
   stamped with the party who made it. Two properties are non-negotiable and
   both are tested:

     · Accepting every revision in Word must yield EXACTLY the document HaTi
       holds. A redline that accepts to something other than the live wording
       would put words into a contract that neither party wrote.
     · The author on the markup is the PARTY, not the software. Who changed a
       clause is the first question anyone asks of a redline, and answering it
       "HaTi System" would erase the only fact the balloon exists to carry. */

/* Which wording the counterparty is holding — the document their copy of this
   contract says, and therefore the only baseline a redline can honestly be
   measured against. Two things put a document in their hands, and the later
   one wins:
     · the file they last sent BACK to us, once we have decided it. Their
       proposal is the paper on their desk; marking up from it shows them both
       what we accepted and what we put back. An UNDECIDED round is excluded on
       purpose — striking their still-open asks would tell them they had been
       refused before anyone had ruled on them.
     · the wording we last sent THEM, recorded at export (c.wordSent), which is
       what makes a second counter in a row mark up correctly. */
function redlineBaseline(c){
  let best = null;
  const later = (a, b) => !b || String(a || '') >= String(b.at || '');
  for (const r of (c && c.rounds) || []){
    if (!r.proposedText || r.status === 'open') continue;
    const at = (r.resolution && r.resolution.at) || r.at;
    if (later(at, best)) best = { at, text: r.proposedText, format: 'text', body: null, from: 'round' + r.n };
  }
  const sent = c && c.wordSent;
  if (sent && sent.text && later(sent.at, best))
    best = { at: sent.at, text: sent.text, format: sent.format || 'text', body: sent.body || null, from: 'export' };
  return best;
}
/* The baseline as BLOCKS, built by the same two producers the live document
   goes through — so paragraphs on the two sides are the same kind of thing and
   an alignment between them means what it looks like it means. */
function baselineBlocks(base){
  if (!base) return [];
  const rich = !!(window.isRich && isRich(base.format) && base.body &&
                  /<[a-zA-Z][^>]*>/.test(String(base.body)));
  return rich ? richToBlocks(base.body) : textToBlocks(base.text);
}

const _blockText = b => b.runs.map(r => r.text).join('');
/* The formatting of a stretch of one block, as runs. A redline that dropped
   the bold from a changed clause would fix the markup and break the document. */
function _slice(block, from, to){
  const out = [];
  let at = 0;
  for (const r of block.runs){
    const s = at, e = at + r.text.length;
    at = e;
    if (e <= from || s >= to) continue;
    const t = r.text.slice(Math.max(0, from - s), Math.min(r.text.length, to - s));
    if (t) out.push({ text: t, b: r.b, i: r.i, u: r.u });
  }
  return out;
}
/* Paragraph-level alignment. The unit here is the whole paragraph, not the
   word — wordDiff owns words, and is called below once two paragraphs are
   known to be versions of each other. */
function _blockOps(A, B){
  const n = A.length, m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m){
    if (A[i] === B[j]){ ops.push({ t: 'eq', a: i, b: j }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]){ ops.push({ t: 'del', a: i }); i++; }
    else { ops.push({ t: 'add', b: j }); j++; }
  }
  while (i < n){ ops.push({ t: 'del', a: i }); i++; }
  while (j < m){ ops.push({ t: 'add', b: j }); j++; }
  return ops;
}
/* Is the new paragraph an EDIT of the old one, or a different paragraph
   standing where it used to? An edited clause is marked word by word, which is
   what a reader wants; two unrelated paragraphs marked that way would produce
   an unreadable ransom note of interleaved fragments. */
function _sameParagraph(a, b){
  if (!a.trim() || !b.trim()) return false;
  let eq = 0;
  for (const p of wordDiff(a, b)) if (p.t === 'eq') eq += p.text.length;
  return eq / Math.max(a.length, b.length, 1) >= 0.4;
}
/* Runs for a paragraph that exists on both sides: unchanged and inserted text
   keeps the LIVE document's formatting, struck-out text keeps the formatting it
   had when it was written. */
function _editedRuns(baseB, curB){
  const before = _blockText(baseB), after = _blockText(curB);
  const out = [];
  let bi = 0, ci = 0;
  for (const p of wordDiff(before, after)){
    const len = p.text.length;
    if (p.t === 'eq'){
      for (const r of _slice(curB, ci, ci + len)) out.push({ ...r, mark: null });
      bi += len; ci += len;
    } else if (p.t === 'add'){
      for (const r of _slice(curB, ci, ci + len)) out.push({ ...r, mark: 'ins' });
      ci += len;
    } else {
      for (const r of _slice(baseB, bi, bi + len)) out.push({ ...r, mark: 'del' });
      bi += len;
    }
  }
  return out;
}
/* The live document, marked up against what the counterparty is holding.
   Blocks carry a `mark` per run and, for a paragraph that wholly arrived or
   wholly went, a `pMark` — the paragraph MARK itself is part of the revision,
   or accepting a deletion in Word would leave an empty paragraph behind where
   the clause used to be. */
function redlineBlocks(baseBlocks, curBlocks){
  if (typeof wordDiff !== 'function')
    throw new Error('the word diff is not loaded, so a redline cannot be written');
  const A = baseBlocks.map(_blockText), B = curBlocks.map(_blockText);
  const ops = _blockOps(A, B);
  const out = [];
  const whole = (blk, mark) => ({ style: blk.style, indent: blk.indent, pMark: mark,
    runs: blk.runs.map(r => ({ text: r.text, b: r.b, i: r.i, u: r.u, mark })) });
  for (let k = 0; k < ops.length; ){
    if (ops[k].t === 'eq'){ out.push(curBlocks[ops[k].b]); k++; continue; }
    // one contiguous divergence: the paragraphs that went, and those that came
    let end = k;
    while (end < ops.length && ops[end].t !== 'eq') end++;
    const group = ops.slice(k, end);
    const dels = group.filter(o => o.t === 'del').map(o => o.a);
    const adds = group.filter(o => o.t === 'add').map(o => o.b);
    const pairs = new Map();
    for (let p = 0; p < Math.min(dels.length, adds.length); p++)
      if (_sameParagraph(A[dels[p]], B[adds[p]])) pairs.set(dels[p], adds[p]);
    const taken = new Set(pairs.values());
    for (const o of group){
      if (o.t === 'del'){
        if (pairs.has(o.a)){
          const cur = curBlocks[pairs.get(o.a)];
          out.push({ style: cur.style, indent: cur.indent, runs: _editedRuns(baseBlocks[o.a], cur) });
        } else out.push(whole(baseBlocks[o.a], 'del'));
      } else if (!taken.has(o.b)) out.push(whole(curBlocks[o.b], 'ins'));
    }
    k = end;
  }
  return out;
}
const hasRevisions = blocks => blocks.some(b => b.pMark || b.runs.some(r => r.mark));

/* ---------- WordprocessingML ---------- */
/* Every revision needs an id unique in the document, an author and a date;
   `meta` carries them and hands out the ids. */
function revisionMeta(opts){
  const iso = (opts && opts.date) || (window.nowISO ? nowISO() : new Date().toISOString());
  return {
    author: String((opts && opts.author) || window.FIRST_PARTY || 'HaTi') || 'HaTi',
    date: String(iso).replace(/\.\d+Z$/, 'Z'),   // Word wants seconds, not milliseconds
    n: 1,
  };
}
const _rev = m => `w:id="${m.n++}" w:author="${XE(m.author)}" w:date="${XE(m.date)}"`;

function runXml(r){
  const props = (r.b ? '<w:b/>' : '') + (r.i ? '<w:i/>' : '') + (r.u ? '<w:u w:val="single"/>' : '');
  // struck-out wording is w:delText, never w:t: text left in a w:t inside a
  // deletion is live text to every reader, so the "removed" clause would still
  // be in the contract after the revision was accepted
  const tag = r.mark === 'del' ? 'w:delText' : 'w:t';
  // a tab inside a run has to be a real w:tab element, not a tab character
  const body = String(r.text).split('\t')
    .map(seg => `<${tag} xml:space="preserve">${XE(seg)}</${tag}>`).join('<w:tab/>');
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}${body}</w:r>`;
}
function runsXml(runs, meta){
  if (!meta) return runs.map(runXml).join('');
  let out = '';
  for (let i = 0; i < runs.length; ){
    const mark = runs[i].mark || null;
    let j = i;
    while (j < runs.length && (runs[j].mark || null) === mark) j++;
    const inner = runs.slice(i, j).map(runXml).join('');
    out += mark ? `<w:${mark === 'ins' ? 'ins' : 'del'} ${_rev(meta)}>${inner}</w:${mark === 'ins' ? 'ins' : 'del'}>` : inner;
    i = j;
  }
  return out;
}
function blockXml(b, meta){
  const ind = b.indent ? `<w:ind w:left="${Math.min(b.indent, 6) * 360}"/>` : '';
  const style = b.style && b.style !== 'Normal' ? `<w:pStyle w:val="${XE(b.style)}"/>` : '';
  // w:rPr closes w:pPr in the schema, and the revision on the paragraph mark
  // lives inside it — this is what makes a deleted clause close up cleanly
  const rPr = (meta && b.pMark) ? `<w:rPr><w:${b.pMark === 'ins' ? 'ins' : 'del'} ${_rev(meta)}/></w:rPr>` : '';
  const pPr = (style || ind || rPr) ? `<w:pPr>${style}${ind}${rPr}</w:pPr>` : '';
  return `<w:p>${pPr}${runsXml(b.runs, meta)}</w:p>`;
}
function documentXml(blocks, meta){
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:body>' + blocks.map(b => blockXml(b, meta)).join('') +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
    '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>' +
    '</w:body></w:document>';
}

const CONTENT_TYPES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
  '</Types>';

const ROOT_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '</Relationships>';

const DOC_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '</Relationships>';

/* Heading styles, so the exported file opens with a real document outline and
   Word's navigation pane works. Serif body at 11pt — a contract, not a memo. */
function stylesXml(){
  const heading = (id, name, size, before) =>
    `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/>` +
    `<w:basedOn w:val="Normal"/><w:qFormat/>` +
    `<w:pPr><w:keepNext/><w:spacing w:before="${before}" w:after="120"/><w:outlineLvl w:val="${id.slice(-1) - 1}"/></w:pPr>` +
    `<w:rPr><w:b/><w:sz w:val="${size}"/></w:rPr></w:style>`;
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:docDefaults><w:rPrDefault><w:rPr>' +
    '<w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:sz w:val="22"/>' +
    '</w:rPr></w:rPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/>' +
    '<w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:style>' +
    heading('Heading1', 'heading 1', 32, 240) +
    heading('Heading2', 'heading 2', 26, 240) +
    heading('Heading3', 'heading 3', 24, 200) +
    heading('Heading4', 'heading 4', 22, 200) +
    '<w:style w:type="paragraph" w:styleId="HatiPre"><w:name w:val="Preformatted"/>' +
    '<w:basedOn w:val="Normal"/><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="20"/></w:rPr></w:style>' +
    '</w:styles>';
}

/* ---------- the public surface ---------- */

/* Word bytes for a set of blocks. Exposed so a test can drive the writer
   without building a whole contract. */
function docxFromBlocks(blocks, meta){
  return zipStore([
    { name: '[Content_Types].xml', data: CONTENT_TYPES },
    { name: '_rels/.rels', data: ROOT_RELS },
    { name: 'word/document.xml', data: documentXml(blocks, meta) },
    { name: 'word/_rels/document.xml.rels', data: DOC_RELS },
    { name: 'word/styles.xml', data: stylesXml() },
  ]);
}
function docxFromText(text){ return docxFromBlocks(textToBlocks(text)); }
function docxFromRich(html){ return docxFromBlocks(richToBlocks(html)); }

/* What the export will carry, decided before it is built, so the caller can
   say so on screen and on the record instead of the user finding out by
   opening the file. */
function redlinePlan(c, opts = {}){
  if (opts.tracked === false) return null;
  const base = redlineBaseline(c);
  if (!base) return null;
  const blocks = contractBlocks(c);
  const marked = redlineBlocks(baselineBlocks(base), blocks);
  if (!hasRevisions(marked)) return null;   // nothing has moved: a clean file is the truth
  return { base, blocks: marked };
}

/* Word bytes for a contract as it currently reads. Async because a caller may
   need the full record loaded first; the computation itself is synchronous.
   Where the counterparty is holding an earlier wording, the differences go in
   as real tracked changes; where they are not, or nothing has changed since,
   the file is clean — because it would be a lie for it to be anything else. */
async function contractDocxBytes(c, opts = {}){
  if (window.ensureFull){ try { await ensureFull(c); } catch (_) {} }
  const blocks = contractBlocks(c);
  if (!blocks.length) throw new Error('this contract has no wording to export yet');
  let plan = null;
  try { plan = redlinePlan(c, opts); }
  catch (e){
    // a redline that cannot be computed must not silently become a clean file
    // presented as a marked-up one — say so and send the clean wording
    if (window.console) console.warn('redline skipped:', e.message);
  }
  return plan ? docxFromBlocks(plan.blocks, revisionMeta(opts)) : docxFromBlocks(blocks);
}

/* A filename a person can find again: the contract's name, its id, and the
   version it went out as. */
function wordExportName(c){
  const base = String(c.name || c.id || 'contract').replace(/[^\w \-&,.]/g, '').trim().slice(0, 70) || 'contract';
  const v = (c.versions && c.versions.length) ? ` v${c.versions.length}` : '';
  return `${base}${v}.docx`;
}

async function downloadContractDocx(c, opts = {}){
  const bytes = await contractDocxBytes(c, opts);
  const name = wordExportName(c);
  if (window.wordTriggerDownload){
    // reuse the one download path, so a blob URL is revoked the same way
    const b64 = (window.btoa
      ? btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''))
      : Buffer.from(bytes).toString('base64'));
    wordTriggerDownload(`data:${DOCX_MIME};base64,${b64}`, name, DOCX_MIME);
  }
  return { bytes, name };
}

if (typeof window !== 'undefined') Object.assign(window, {
  crc32, zipStore, richToBlocks, textToBlocks, contractBlocks, documentXml, stylesXml,
  docxFromBlocks, docxFromText, docxFromRich, contractDocxBytes, wordExportName, downloadContractDocx,
  redlineBaseline, baselineBlocks, redlineBlocks, hasRevisions, redlinePlan, revisionMeta });
if (typeof module !== 'undefined' && module.exports) module.exports = {
  crc32, zipStore, documentXml, stylesXml, docxFromBlocks, textToBlocks };
