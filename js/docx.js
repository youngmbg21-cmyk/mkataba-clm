// HaTi — .docx reading. Globals are
// window-attached like every module (see components.js); the module also
// exports for node:test, because the extractor is pure computation and the
// tests must run it on real fixture bytes, not a paraphrase of it.
//
// A .docx is a ZIP archive whose word/document.xml carries the wording as
// WordprocessingML. HaTi reads exactly that part with no library: the ZIP
// central directory locates the entry, the platform's own DecompressionStream
// inflates it (browser and Node both ship it), and a small XML walk projects
// the text. Legacy .doc (OLE2) stays refused — there is no XML inside to read.

/* ---- recognising a Word document ----
   Moved here when the Word round trip was removed. Knowing that an upload
   arrived as a .docx is INTAKE — it decides how the document is read and
   rendered — and has nothing to do with sending one out to be marked up. */
const DOCX_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const isWordDoc = c => !!(c && c.source==='upload' && c.upload && (c.upload.docKind==='docx'
  || /wordprocessingml/.test(c.upload.mime||'') || /\.docx$/i.test(c.upload.fileName||'')));

/* ---- ZIP central directory ----
   The directory at the END of the archive is the truth about what the archive
   contains; local headers are only followed to find each entry's bytes. This
   avoids every streaming-format trap (data descriptors, entries written then
   superseded) that byte-scanning from the front walks into. */
function zipEntries(bytes){
  const len=bytes.length;
  if(len<22) throw new Error('not a ZIP archive');
  // End-of-central-directory: scan back over a possible trailing comment (≤64KB)
  let eocd=-1;
  for(let i=len-22, stop=Math.max(0,len-22-65536); i>=stop; i--){
    if(bytes[i]===0x50&&bytes[i+1]===0x4B&&bytes[i+2]===0x05&&bytes[i+3]===0x06){ eocd=i; break; }
  }
  if(eocd<0) throw new Error('not a ZIP archive');
  const dv=new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count=dv.getUint16(eocd+10,true);
  let off=dv.getUint32(eocd+16,true);
  const out=[];
  for(let n=0;n<count;n++){
    if(off+46>len || dv.getUint32(off,true)!==0x02014b50) break;
    const method=dv.getUint16(off+10,true);
    const compLen=dv.getUint32(off+20,true);
    const rawLen=dv.getUint32(off+24,true);
    const nameLen=dv.getUint16(off+28,true);
    const extraLen=dv.getUint16(off+30,true);
    const cmtLen=dv.getUint16(off+32,true);
    const lho=dv.getUint32(off+42,true);
    let name=''; for(let i=0;i<nameLen;i++) name+=String.fromCharCode(bytes[off+46+i]);
    out.push({ name, method, compLen, rawLen, lho });
    off+=46+nameLen+extraLen+cmtLen;
  }
  return out;
}
function zipEntryBytes(bytes, e){
  const dv=new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if(e.lho+30>bytes.length || dv.getUint32(e.lho,true)!==0x04034b50)
    throw new Error('ZIP entry is damaged');
  // the LOCAL name/extra lengths govern where the data starts — they can
  // differ from the central directory's copy (extra fields often do)
  const nameLen=dv.getUint16(e.lho+26,true), extraLen=dv.getUint16(e.lho+28,true);
  const start=e.lho+30+nameLen+extraLen;
  if(start+e.compLen>bytes.length) throw new Error('ZIP entry is damaged');
  return bytes.subarray(start, start+e.compLen);
}
async function inflateRawBytes(comp){
  const ds=new DecompressionStream('deflate-raw');
  const buf=await new Response(new Blob([comp]).stream().pipeThrough(ds)).arrayBuffer();
  return new Uint8Array(buf);
}

/* ---- WordprocessingML → structured plain text ----
   The line unit is the paragraph (w:p), matching htmlToStructuredText's
   output shape so versions, diffs and the Copilot pipeline see the same kind of
   text whether a document arrived as a PDF, pasted HTML or a Word file.

   Tracked changes: deleted wording lives in w:delText, insertions are
   ordinary runs inside w:ins. Dropping w:delText and keeping the rest reads
   the document AS IF every tracked change were accepted — which is the only
   defensible reading: resurrecting text an editor struck out would put
   withdrawn wording back into the record. The counts are returned so the
   caller can say on the record that markup was found and resolved that way. */
function decodeXmlEntities(s){
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g,(m,e)=>{
    if(e[0]==='#') return String.fromCodePoint(parseInt(e[1]==='x'||e[1]==='X'?e.slice(2):e.slice(1), e[1]==='x'||e[1]==='X'?16:10)||0x20);
    return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[e]??m;
  });
}
function docxXmlToText(xml){
  const tracked={ ins:(xml.match(/<w:ins[ >]/g)||[]).length,
                  del:(xml.match(/<w:del[ >]/g)||[]).length };
  let body=xml.replace(/^[\s\S]*?<w:body[^>]*>/,'').replace(/<\/w:body>[\s\S]*$/,'');
  body=body
    .replace(/<w:delText[^>]*>[\s\S]*?<\/w:delText>/g,'')    // struck-out wording is not content
    .replace(/<w:instrText[^>]*>[\s\S]*?<\/w:instrText>/g,''); // field codes (TOC, page refs) are plumbing
  const lines=[];
  for(const para of body.split(/<\/w:p>/)){
    let t='';
    para.replace(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:(?:br|cr)\s*\/>/g,(m,txt)=>{
      if(txt!=null) t+=decodeXmlEntities(txt);
      else if(m.indexOf('w:tab')>=0) t+='\t';
      else t+='\n';
      return '';
    });
    lines.push(t);
  }
  const text=lines.join('\n').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  return { text, tracked };
}

/* Read the wording out of .docx bytes. Throws with a human-readable reason on
   anything that is not a readable Word document — the callers surface the
   message verbatim, so it must say what the person can do about it. */
async function docxExtract(bytes){
  let entries;
  try{ entries=zipEntries(bytes); }
  catch(e){ throw new Error('this is not a readable .docx file — re-save it from Word and try again'); }
  const doc=entries.find(e=>e.name==='word/document.xml')
        || entries.find(e=>/^word\/document[^\/]*\.xml$/.test(e.name));
  if(!doc) throw new Error('no document found inside this file — it is not a Word .docx');
  if(doc.rawLen===0xFFFFFFFF || doc.rawLen>30*1024*1024)
    throw new Error('the document inside this file is too large to read safely');
  let raw;
  if(doc.method===0) raw=zipEntryBytes(bytes,doc);
  else if(doc.method===8) raw=await inflateRawBytes(zipEntryBytes(bytes,doc));
  else throw new Error('this .docx uses a compression HaTi cannot read — re-save it from Word');
  const out=docxXmlToText(new TextDecoder().decode(raw));
  if(!out.text) throw new Error('no readable text found in this Word document');
  return out;
}

/* ---- document-structure line classifier ----
   Contract text keeps its shape as PATTERNS even after extraction to plain
   text: section titles are short ALL-CAPS lines, clauses open with "3.2 ",
   sub-paragraphs are indented. The display layer uses this to render working
   text the way the paper read — headings bold, clause numbers set off —
   WITHOUT altering one stored byte: classification is display-only, so the
   seal, the diffs and the wording are untouched.
     'blank'   — spacing line (kept: it is the document's paragraph rhythm)
     'heading' — short ALL-CAPS title ("RECITALS", "3. CONSIDERATION")
     'clause'  — numbered clause line; the numeric prefix gets set off
     'text'    — everything else, rendered exactly as extracted */
function docLineKind(line){
  const t=String(line==null?'':line).trim();
  if(!t) return 'blank';
  const letters=t.replace(/[^A-Za-z]/g,'');
  // a title is MOSTLY letters — "KES 1,800,000" is caps-and-digits, not a heading
  if(letters.length>=3 && t.length<=80 && !/[a-z]/.test(t)
     && letters.length >= t.replace(/\s/g,'').length*0.5) return 'heading';
  if(/^\d+(?:\.\d+)*[.)]?\s+\S/.test(t)) return 'clause';
  return 'text';
}
// the numeric prefix of a clause line ("3.2", "7.1.4", "12."), '' otherwise
function docClausePrefix(line){
  const m=String(line==null?'':line).match(/^(\s*)(\d+(?:\.\d+)*[.)]?)(\s+\S)/);
  return m?m[2]:'';
}

/* ============================================================
   REBUILDING A DOCUMENT'S STRUCTURE FROM ITS WORDING
   ============================================================
   A contract must never arrive as a wall of prose. Its numbering and its
   bullets are how a reader finds clause 7 and how a negotiation cites it — lose
   them and the document is still all there and no longer usable.

   Two intake faults made exactly that happen, in opposite directions:

     · The PDF fallback scrape collapsed every newline into a space, so the
       whole agreement arrived as one line and became ONE paragraph — recitals,
       clause headings and page footers run together.
     · The structured PDF path is the other extreme: it emits one line per
       VISUAL line, and the old builder made a paragraph out of each, so a
       sentence that wrapped three times became three paragraphs and "1.
       Services" became body text rather than a heading.

   So structure is not taken from the line breaks. It is READ FROM THE WORDING —
   the numbering, the bullet marks, the capitalisation a contract already uses
   to say what its own parts are — and the line breaks are treated as what they
   are: where the page happened to end, which is not information about the
   agreement.

   Nothing is invented. Every character of the text comes out the other side in
   the same order; what changes is which block it sits in. */

/* Page furniture: what the page printed about itself, not what the parties
   agreed. Dropped, because "PAGE 1 OF 4" wedged between a recital and a clause
   heading is noise a reader has to step over on every read. */
const DOC_FURNITURE = /^(?:page\s+\d+\s*(?:of\s+\d+)?\s*[:.]?|\d+\s*\/\s*\d+|[-–—]\s*\d+\s*[-–—]|\d{1,3})$/i;
/* A bullet, in any of the marks a contract actually uses.

   ---- A LETTERED LABEL IS NOT A BULLET, AND IT USED TO BE ONE ----
   (owner-reported 16 Aug 2026, off a Copilot proposal: the wording came back
   reading "(a) Manufacture all products…", and what landed in the contract was
   "• Manufacture all products…" — the letters gone.)

   This pattern used to swallow `(a)`, `a)` and `(iv)` along with the true
   bullet marks, and the branch that uses it STRIPS what it matched. So every
   lettered sub-clause the Copilot drafted, and every one in an uploaded
   contract, arrived with its label thrown away and a bullet in its place.

   That is the same mistake DOC_NUMBERED was written to avoid, and this file
   already states the rule three lines below it: "Both keep their number: it is
   the citation." A lettered limb is cited exactly the same way — clause 1(b) —
   so it keeps its label for exactly the same reason. A bullet mark carries no
   citation and nothing is lost by dropping it. */
const DOC_BULLET = /^\s*(?:[•●▪◦‣·]|[-–—]\s)\s*/;
/* A lettered or roman limb: "(a)", "a)", "(iv)". The label is KEPT. */
const DOC_LABEL = /^\s*(?:\([a-z]\)|[a-z]\)|\([ivxlcdm]+\))\s+\S/i;
/* A numbered clause opener: "3.", "7.1.4", "12)" — the anchor a citation uses. */
/* Capped at three digits on purpose. A clause number is small; a four-digit
   number followed by a full stop is a YEAR — "under the Companies Act, 2015." —
   and reading it as a clause opener invented a clause called "2015" and hung
   the recitals under it. */
const DOC_NUMBERED = /^\s*(\d{1,3}(?:\.\d+)*)[.)]\s+\S/;

/* Has this text lost its line structure entirely? Asked before anything is
   rebuilt, because the repair for a run-on blob (break it apart) is the exact
   opposite of the repair for over-broken lines (join them), and applying either
   to the wrong input makes things worse. */
function docTextIsRunOn(text){
  const t = String(text == null ? '' : text);
  if (!t.trim()) return false;
  const lines = t.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return false;
  const longest = lines.reduce((n, l) => Math.max(n, l.length), 0);
  // one enormous line, or a handful of them, each far longer than any typeset
  // line would be: nothing here came from a layout
  return longest > 400 && (t.length / lines.length) > 300;
}

/* Break a run-on blob at the marks the document itself provides. Conservative
   on purpose — it runs ONLY on text that has no line structure at all, where
   any break is an improvement on none, and it only ever breaks BEFORE a marker
   that a contract uses to start a new part. */
function docBreakRunOn(text){
  return String(text == null ? '' : text)
    // page furniture, onto its own line so it can be dropped
    .replace(/\s+(PAGE\s+\d+\s+OF\s+\d+\s*[:.]?)\s*/gi, '\n$1\n')
    // the landmarks every agreement shares
    .replace(/\s+(RECITALS?\s*[:.])/gi, '\n\n$1\n')
    .replace(/\s+(NOW,?\s+THEREFORE[^.]*?as follows\s*[:.])/gi, '\n\n$1\n')
    .replace(/\s+(IT IS HEREBY AGREED\s*[:.])/gi, '\n$1\n')
    // a bullet mark mid-flow starts a new item
    .replace(/\s+([•●▪◦‣])\s*/g, '\n$1 ')
    // a numbered clause opener followed by a capital starts a new clause
    // three digits at most, and never straight after a comma: "Companies Act,
    // 2015. RECITALS" is a year ending a sentence, not clause 2015
    .replace(/([^,\d])\s+(\d{1,3}(?:\.\d+)*[.)])\s+(?=[A-Z“"])/g, '$1\n$2 ')
    // an ALL-CAPS run of two or more words ending in a colon is a heading
    .replace(/\s+((?:[A-Z][A-Z&'’-]+\s+){1,7}[A-Z][A-Z&'’-]+\s*:)\s*/g, '\n\n$1\n')
    .replace(/\n{3,}/g, '\n\n');
}

/* Was this line cut off by the edge of the page, or did it end?

   The question the whole join rests on, and it is asked conservatively: a line
   only continues the one above it when there is POSITIVE evidence of a wrap —
   it starts in lower case, or the line above stopped on a comma, a dash or an
   open bracket. A missed join leaves two paragraphs where there should be one,
   which is untidy; a wrong join welds a heading or a reference line onto the
   sentence after it, which changes how the document reads. */
const docLineWraps = (prev, next) =>
  /^[a-z(]/.test(String(next || '')) || /[,;:(\[“‘—–-]\s*$/.test(String(prev || ''));

/* The document, as blocks. Returns an array of
   { kind:'h1'|'h2'|'li'|'oli'|'p', text, num } so both the rich builder and any
   other renderer read one description of the structure rather than each
   deriving its own and disagreeing. */
function docBlocksFromText(text){
  let src = String(text == null ? '' : text);
  if (docTextIsRunOn(src)) src = docBreakRunOn(src);
  const raw = src.split(/\r?\n/).map(l => l.replace(/\s+$/, ''));
  const blocks = [];
  let seenTitle = false;
  let open = null;                       // the paragraph or item being built
  const close = () => { if (open && open.text.trim()) blocks.push(open); open = null; };
  for (const line of raw){
    const t = line.trim();
    if (!t){ close(); continue; }
    if (DOC_FURNITURE.test(t)){ close(); continue; }

    const kind = docLineKind(t);
    const numbered = DOC_NUMBERED.exec(t);
    const bulleted = !numbered && DOC_BULLET.test(t) && /[A-Za-z]/.test(t.replace(DOC_BULLET, ''));
    /* Asked BEFORE the bullet, though the two can no longer both match: the
       order is the statement that a label outranks a mark, so a pattern widened
       later cannot quietly turn a citation back into a bullet. */
    const labelled = !numbered && !bulleted && DOC_LABEL.test(t);

    if (kind === 'heading'){
      close();
      blocks.push({ kind: seenTitle ? 'h2' : 'h1', text: t });
      seenTitle = true;
      continue;
    }
    if (bulleted){
      close();
      open = { kind: 'li', text: t.replace(DOC_BULLET, '').trim() };
      continue;
    }
    /* A LABELLED LIMB IS A PARAGRAPH THAT KEEPS ITS LABEL. Not a list item:
       a list draws its own marker, and no list marker in any browser renders
       "(a)" — the label would have to be thrown away to make room for it, which
       is the fault. As an ordinary paragraph the label is simply part of the
       wording, which is what it is on paper; the renderers already read it back
       (RL_MARKER in js/redline.js) and hang the wrapped lines under it. And
       because it is a paragraph, the line below it JOINS when it is a wrap —
       docLineWraps, the same rule every other paragraph gets. */
    if (labelled){
      close();
      open = { kind: 'p', text: t };
      continue;
    }
    if (numbered){
      close();
      const body = t.slice(numbered[0].length - 1).trim();
      /* A short numbered line with no sentence in it is a clause TITLE —
         "4. Payment Terms" — and a reader navigates by those. A long one is the
         clause itself. Both keep their number: it is the citation. */
      if (body.length <= 60 && !/[.;]/.test(body)){
        blocks.push({ kind: 'h2', text: t });
        seenTitle = true;
      } else {
        open = { kind: 'oli', text: body, num: numbered[1] };
      }
      continue;
    }
    /* An ordinary line. It CONTINUES the block above when that block was cut
       off mid-sentence, or when this line starts in lower case — which is what
       a wrapped line looks like. Otherwise it starts a paragraph of its own. */
    if (open && docLineWraps(open.text, t)){
      open.text += ' ' + t;
      continue;
    }
    close();
    open = { kind: 'p', text: t };
  }
  close();
  return blocks;
}

/* The blocks as rich HTML — the format the whole negotiation model reads.
   Consecutive items are gathered into one list so the numbering is a list's
   numbering rather than characters that happen to look like one. */
function docRichFromText(text){
  const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const blocks = docBlocksFromText(text);
  const out = [];
  let list = null;                        // { tag:'ol'|'ul', items:[], start }
  const flush = () => {
    if (!list) return;
    const start = list.tag === 'ol' && list.start > 1 ? ` start="${list.start}"` : '';
    out.push(`<${list.tag}${start}>${list.items.map(x => `<li>${e(x)}</li>`).join('')}</${list.tag}>`);
    list = null;
  };
  for (const b of blocks){
    if (b.kind === 'li' || b.kind === 'oli'){
      const tag = b.kind === 'li' ? 'ul' : 'ol';
      if (!list || list.tag !== tag){
        flush();
        list = { tag, items: [], start: b.num ? parseInt(b.num, 10) || 1 : 1 };
      }
      list.items.push(b.text);
      continue;
    }
    flush();
    out.push(`<${b.kind}>${e(b.text)}</${b.kind}>`);
  }
  flush();
  return out.join('');
}

/* ============================================================
   WRITING A .docx — a redline as NATIVE TRACK CHANGES
   ============================================================
   Exporting a negotiated document as marked-up wording is the point at which
   HaTi has to speak Word's language rather than its own. Two failures were
   available, and the export had to be built to make both impossible:

   1. SHIPPING THE USER INTERFACE. The redline on screen is not only the
      document — it carries the pointers that make the screen usable: the
      #L-002 badge beside every change, the initials welded to an insertion, the
      ids the sidebar scrolls to. Those are furniture. Exported verbatim they
      arrive in a counterparty's Word document as literal text reading "#L-002"
      wedged between two clauses, and nobody can tell from the file whether that
      is our tooling leaking or a defined term they are supposed to know. So
      they are stripped FIRST, before a single run is emitted, by a function
      that names them and can be tested on its own.

   2. SHIPPING THE REDLINE AS COLOUR. <ins> and <del> mean something exact in
      this product, and flattening them to green and red text — or worse, to
      accepted wording — hands over a document in which the reviewer cannot
      accept or reject anything. A tracked change has to arrive as a tracked
      change: <w:ins> and <w:del>, with struck wording preserved in <w:delText>
      exactly as Word preserves it, which is what makes Accept and Reject work
      in the reviewer's own copy.

   Structure is preserved on the way through for the same reason it is preserved
   on screen — a legal list that arrives as one paragraph is a different
   document. Lists come out as real Word lists against a numbering definition
   this writer ships, not as digits typed into a paragraph. */

/* ---- the furniture, named ----
   Every one of these is something HaTi drew for a reader looking at a screen.
   None of it is wording anybody agreed to. */
const DOCX_UI_CLASSES = ['change-tag-badge', 'rl-authormark', 'lab-tag', 'lab-tagwho',
  'lab-tagvis', 'lab-authorpill', 'lab-pilldepth', 'lab-stacktrail', 'lab-stackid',
  'lab-stackarrow', 'lab-stacklabel', 'lab-chip', 'clause-tools', 'clause-tool',
  'badge', 'ui-btn'];
/* The id series the lab stamps on a change: L-001, L-002, … Matched as a whole
   id so a clause genuinely called "L-shaped premises" is untouched. */
const DOCX_UI_ID = /^L-\d+$/;

const _dxTagOpen = name => new RegExp(
  '<' + name + '(?=[\\s>/])[^>]*>|<' + name + '>', 'i');

/* Remove one element and everything inside it, matching nesting properly.
   `test(attrs)` decides, from the opening tag's attributes, whether this
   element is furniture. */
function _dxDropElements(html, test){
  let out = '', i = 0;
  const tag = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)>/g;
  let m;
  while ((m = tag.exec(html))){
    const [full, close, name, attrs, selfClose] = m;
    if (close || selfClose || !test(attrs || '')){ continue; }
    out += html.slice(i, m.index);
    /* Walk forward to this element's own closing tag, counting nested opens of
       the same name — a badge inside a badge is not this one's end. */
    const inner = new RegExp('<(/?)' + name + '(?=[\\s>/])[^>]*>|<(/?)' + name + '>', 'gi');
    inner.lastIndex = m.index + full.length;
    let depth = 1, mm;
    while (depth > 0 && (mm = inner.exec(html))){
      if ((mm[1] || mm[2]) === '/') depth--; else depth++;
    }
    i = depth === 0 && mm ? inner.lastIndex : html.length;
    tag.lastIndex = i;
  }
  return out + html.slice(i);
}

/* Strip every UI badge out of an export string.

   Exported as its own function on purpose: "does this markup still carry a
   change id" is a question worth being able to ask of a string directly, and a
   check buried inside the writer could only be tested through a whole ZIP. */
function docxStripUiBadges(html){
  let s = String(html == null ? '' : html);
  const classRe = new RegExp('class\\s*=\\s*("|\')[^"\']*\\b(?:'
    + DOCX_UI_CLASSES.join('|') + ')\\b[^"\']*\\1', 'i');
  s = _dxDropElements(s, attrs => classRe.test(attrs)
    || /\bdata-change-id\s*=/i.test(attrs)
    || (/\bid\s*=\s*("|')([^"']*)\1/i.exec(attrs) || [])[2] !== undefined
       && DOCX_UI_ID.test((/\bid\s*=\s*("|')([^"']*)\1/i.exec(attrs) || [])[2]));
  /* A badge that was never an element — "#L-002 · draft" pasted into wording by
     an older renderer. Anchored to the badge's exact shape so a cross-reference
     a lawyer actually wrote ("see L-002 of the schedule") is left alone. */
  s = s.replace(/#L-\d{2,}(?:\s*·\s*draft)?/g, '');
  return s;
}

/* ---- HTML → a flat run stream ----
   Deliberately a scanner rather than a DOM walk: this has to run in the export
   path on a server or in a test with no document, and the input is markup this
   product generated, not arbitrary web HTML. */
const DOCX_BLOCK_TAGS = /^(?:p|div|h[1-6]|li|tr|blockquote|section|article|ol|ul|table|tbody)$/i;
function docxRunsFromHtml(html){
  const src = docxStripUiBadges(html);
  const paras = [];
  let cur = null;
  const fmt = { strong: 0, em: 0, u: 0 };
  let ins = 0, del = 0;
  let list = [];                               // the ol/ul nesting, innermost last
  const open = () => {
    if (!cur) cur = { runs: [], list: list.length ? list[list.length - 1] : null,
      level: Math.max(0, list.length - 1), heading: 0 };
    return cur;
  };
  const close = () => {
    if (cur && (cur.runs.some(r => r.text) || cur.forced)) paras.push(cur);
    cur = null;
  };
  const push = text => {
    if (!text) return;
    const p = open();
    const last = p.runs[p.runs.length - 1];
    const mark = ins > 0 ? 'ins' : del > 0 ? 'del' : 'keep';
    const bold = fmt.strong > 0, italic = fmt.em > 0, under = fmt.u > 0;
    if (last && last.mark === mark && last.bold === bold && last.italic === italic
        && last.under === under){ last.text += text; return; }
    p.runs.push({ mark, bold, italic, under, text });
  };
  const tag = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)>/g;
  let i = 0, m;
  while ((m = tag.exec(src))){
    push(decodeXmlEntities(src.slice(i, m.index).replace(/\s+/g, ' ')));
    i = m.index + m[0].length;
    const closing = m[1] === '/', name = m[2].toLowerCase(), selfClose = m[4] === '/';
    if (name === 'br'){ close(); open().forced = true; continue; }
    if (name === 'ins'){ closing ? (ins = Math.max(0, ins - 1)) : ins++; continue; }
    if (name === 'del' || name === 's' || name === 'strike'){
      closing ? (del = Math.max(0, del - 1)) : del++; continue;
    }
    if (name === 'strong' || name === 'b'){ closing ? (fmt.strong = Math.max(0, fmt.strong - 1)) : fmt.strong++; continue; }
    if (name === 'em' || name === 'i'){ closing ? (fmt.em = Math.max(0, fmt.em - 1)) : fmt.em++; continue; }
    if (name === 'u'){ closing ? (fmt.u = Math.max(0, fmt.u - 1)) : fmt.u++; continue; }
    if (name === 'ol' || name === 'ul'){
      close();
      if (closing) list.pop(); else list.push(name === 'ol' ? 'ol' : 'ul');
      continue;
    }
    if (DOCX_BLOCK_TAGS.test(name)){
      close();
      if (!closing && !selfClose && /^h([1-6])$/i.test(name)) open().heading = Number(name[1]);
      continue;
    }
  }
  push(decodeXmlEntities(src.slice(i).replace(/\s+/g, ' ')));
  close();
  return paras;
}

const _dxX = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* One run's properties. Emitted even when empty, because Word reads a missing
   w:rPr and an empty one identically and the constant shape is easier to read
   in a diff of the generated XML. */
function _dxRunProps(r){
  return (r.bold ? '<w:b/>' : '') + (r.italic ? '<w:i/>' : '') + (r.under ? '<w:u w:val="single"/>' : '');
}
function _dxRun(r){
  const pr = _dxRunProps(r);
  const t = r.mark === 'del' ? 'w:delText' : 'w:t';
  return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ''}<${t} xml:space="preserve">${_dxX(r.text)}</${t}></w:r>`;
}

/* The whole point of the writer: a run inside <ins> becomes <w:ins>, a run
   inside <del> becomes <w:del> with its wording kept in w:delText. Word then
   shows the file as a tracked-changes document a reviewer can accept or reject
   — the same two verbs HaTi offers, on their side of the wire. */
function docxTrackedParagraphXml(p, state){
  const props = [];
  if (p.heading) props.push(`<w:pStyle w:val="Heading${Math.min(p.heading, 6)}"/>`);
  else if (p.list) props.push('<w:pStyle w:val="ListParagraph"/>');
  if (p.list) props.push(`<w:numPr><w:ilvl w:val="${p.level || 0}"/>`
    + `<w:numId w:val="${p.list === 'ol' ? 2 : 1}"/></w:numPr>`);
  const body = (p.runs || []).map(r => {
    if (!r.text) return '';
    if (r.mark === 'ins') return `<w:ins w:id="${state.id++}" w:author="${_dxX(state.author)}" w:date="${state.date}">${_dxRun(r)}</w:ins>`;
    if (r.mark === 'del') return `<w:del w:id="${state.id++}" w:author="${_dxX(state.author)}" w:date="${state.date}">${_dxRun(r)}</w:del>`;
    return _dxRun(r);
  }).join('');
  return `<w:p>${props.length ? `<w:pPr>${props.join('')}</w:pPr>` : ''}${body}</w:p>`;
}

/* HTML in, WordprocessingML body out. The export string is stripped of badges
   on the way in (docxRunsFromHtml does it), so a caller cannot forget. */
function docxTrackedXml(html, opts = {}){
  const state = {
    id: 1,
    author: opts.author || 'HaTi',
    /* Word wants a second-resolution timestamp with no milliseconds. */
    date: String(opts.date || new Date().toISOString()).replace(/\.\d+Z$/, 'Z')
  };
  const paras = docxRunsFromHtml(html);
  const xml = paras.map(p => docxTrackedParagraphXml(p, state)).join('');
  return { xml, paragraphs: paras.length,
    tracked: { ins: (xml.match(/<w:ins /g) || []).length,
               del: (xml.match(/<w:del /g) || []).length } };
}

const DOCX_SECT = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
  + '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>';
const DOCX_NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

function docxDocumentXml(html, opts = {}){
  const built = docxTrackedXml(html, opts);
  return { ...built,
    document: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
      + `<w:document ${DOCX_NS}><w:body>${built.xml}${DOCX_SECT}</w:body></w:document>` };
}

const DOCX_STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles ${DOCX_NS}>
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="720"/></w:pPr></w:style>
${[1,2,3,4,5,6].map(n => `<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="${n-1}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${30 - n*2}"/></w:rPr></w:style>`).join('')}
</w:styles>`;

/* A real numbering definition, shipped with the file. Without it a <w:numPr>
   points at nothing and Word renders the list as flat indented paragraphs —
   which is the exact flattening this export exists to prevent. */
const DOCX_NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering ${DOCX_NS}>
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>
${[0,1,2].map(l => `<w:lvl w:ilvl="${l}"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="${['','o','\u25AA'][l] || '\u2022'}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720*(l+1)}" w:hanging="360"/></w:pPr></w:lvl>`).join('')}
</w:abstractNum>
<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="multilevel"/>
${[0,1,2].map(l => `<w:lvl w:ilvl="${l}"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%${l+1}."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720*(l+1)}" w:hanging="360"/></w:pPr></w:lvl>`).join('')}
</w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
<w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;

const DOCX_CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`;
const DOCX_ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
const DOCX_DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`;

/* ---- the ZIP, written the way this module already reads one ----
   STORED, not deflated. A CompressionStream is available in both runtimes but
   is async and would make every caller of this async for no gain a reader can
   see: a contract is tens of kilobytes, and Word opens a stored archive exactly
   as happily as a deflated one. The reader above (zipEntries) parses what this
   writes, which is what keeps a round trip honest. */
const _dxCrcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++){
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function docxCrc32(bytes){
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = _dxCrcTable[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function docxZip(files){
  const enc = new TextEncoder();
  const parts = [], dir = [];
  let offset = 0;
  const u8 = n => [n & 0xFF];
  const u16 = n => [n & 0xFF, (n >>> 8) & 0xFF];
  const u32 = n => [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];
  for (const f of files){
    const name = enc.encode(f.name);
    const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
    const crc = docxCrc32(data);
    /* No timestamps: a deterministic archive is one a test can hash, and a
       .docx carries its own dates inside the parts that need them. */
    const local = [...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length),
      ...u16(name.length), ...u16(0)];
    parts.push(new Uint8Array(local), name, data);
    dir.push({ name, crc, size: data.length, offset });
    offset += local.length + name.length + data.length;
  }
  const cd = [];
  for (const e of dir){
    cd.push(...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(e.crc), ...u32(e.size), ...u32(e.size),
      ...u16(e.name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(0), ...u32(e.offset));
    for (const b of e.name) cd.push(b);
  }
  cd.push(...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(dir.length), ...u16(dir.length),
    ...u32(cd.length), ...u32(offset), ...u16(0));
  parts.push(new Uint8Array(cd));
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts){ out.set(p, at); at += p.length; }
  void u8;
  return out;
}

/* ---------- THE MARGIN, READ TOO ----------
   A .docx keeps its comments in word/comments.xml, a part docxExtract never
   opens — which is how a returned file's margin notes ("we can accept this
   only if clause 12 changes") used to vanish on import. Each comment carries
   its author and its text here; WHERE it pointed lives in word/document.xml
   as a commentRangeStart/End pair (or, for a comment pinned to a point, a
   bare commentReference inside a paragraph). The quote — the wording the
   comment was anchored to — is what lets a caller pin the note to a clause. */
function _docxTRuns(xml){
  const parts = [];
  String(xml || '').replace(/<w:(?:t|delText)(?:\s[^>]*)?>([\s\S]*?)<\/w:(?:t|delText)>/g,
    (m, t) => { parts.push(decodeXmlEntities(t)); return m; });
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
function docxCommentQuote(docXml, id){
  if (!docXml || id == null || id === '') return '';
  const start = docXml.indexOf(`<w:commentRangeStart w:id="${id}"`);
  const end = docXml.indexOf(`<w:commentRangeEnd w:id="${id}"`);
  let span = '';
  if (start !== -1 && end !== -1 && end > start) span = docXml.slice(start, end);
  else {
    /* pinned to a point, not a range: the paragraph it sits in is the context */
    const ref = docXml.indexOf(`<w:commentReference w:id="${id}"`);
    if (ref === -1) return '';
    const s = Math.max(docXml.lastIndexOf('<w:p ', ref), docXml.lastIndexOf('<w:p>', ref));
    const e = docXml.indexOf('</w:p>', ref);
    if (s === -1 || e === -1) return '';
    span = docXml.slice(s, e);
  }
  return _docxTRuns(span).slice(0, 400);
}
async function docxComments(bytes){
  let entries;
  try{ entries = zipEntries(bytes); }catch(_){ return []; }
  /* The same decode docxExtract trusts: stored entries read in place,
     deflated ones inflate — and any part that will not read cleanly reads as
     absent, because a damaged margin must never take the import down with it. */
  const readPart = async name => {
    const e = entries.find(x => x.name === name);
    if (!e) return '';
    try{
      let raw;
      if (e.method === 0) raw = zipEntryBytes(bytes, e);
      else if (e.method === 8) raw = await inflateRawBytes(zipEntryBytes(bytes, e));
      else return '';
      return new TextDecoder().decode(raw);
    }catch(_){ return ''; }
  };
  const xml = await readPart('word/comments.xml');
  if (!xml) return [];
  const doc = await readPart('word/document.xml');
  const out = [];
  const re = /<w:comment\b([^>]*)>([\s\S]*?)<\/w:comment>/g;
  let m;
  while ((m = re.exec(xml))){
    const attrs = m[1] || '';
    const id = (attrs.match(/w:id="([^"]*)"/) || [])[1] || '';
    const author = decodeXmlEntities((attrs.match(/w:author="([^"]*)"/) || [])[1] || '').trim();
    const date = (attrs.match(/w:date="([^"]*)"/) || [])[1] || '';
    const text = _docxTRuns(m[2]);
    if (!text) continue;
    out.push({ id, author, date, text, quote: docxCommentQuote(doc, id) });
  }
  return out;
}

/* The export, end to end: redline HTML in, .docx bytes out.
   Returns the counts as well as the bytes so a caller can say on the record
   what went — "12 insertions and 5 deletions, as tracked changes" — rather than
   handing over a file and hoping. */
function docxExportTracked(html, opts = {}){
  const built = docxDocumentXml(html, opts);
  const bytes = docxZip([
    { name: '[Content_Types].xml', data: DOCX_CONTENT_TYPES },
    { name: '_rels/.rels', data: DOCX_ROOT_RELS },
    { name: 'word/document.xml', data: built.document },
    { name: 'word/_rels/document.xml.rels', data: DOCX_DOC_RELS },
    { name: 'word/styles.xml', data: DOCX_STYLES },
    { name: 'word/numbering.xml', data: DOCX_NUMBERING },
  ]);
  return { bytes, xml: built.document, paragraphs: built.paragraphs, tracked: built.tracked };
}

if(typeof window!=='undefined') Object.assign(window,{DOCX_MIME,isWordDoc,docxExtract,docxXmlToText,docLineKind,docClausePrefix,
  docTextIsRunOn,docBreakRunOn,docBlocksFromText,docRichFromText,docLineWraps,DOC_FURNITURE,DOC_BULLET,DOC_LABEL,DOC_NUMBERED,
  docxStripUiBadges,docxRunsFromHtml,docxTrackedXml,docxDocumentXml,docxExportTracked,docxZip,docxCrc32,
  docxComments,docxCommentQuote,
  DOCX_UI_CLASSES,DOCX_UI_ID});
if(typeof module!=='undefined'&&module.exports) module.exports={zipEntries,zipEntryBytes,inflateRawBytes,decodeXmlEntities,docxXmlToText,docxExtract,docLineKind,docClausePrefix,
  docTextIsRunOn,docBreakRunOn,docBlocksFromText,docRichFromText,docLineWraps,
  docxStripUiBadges,docxRunsFromHtml,docxTrackedXml,docxDocumentXml,docxExportTracked,docxZip,docxCrc32,
  docxComments,docxCommentQuote,
  DOCX_UI_CLASSES,DOCX_UI_ID};
