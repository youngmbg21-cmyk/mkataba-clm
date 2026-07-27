// HaTi — .docx reading (Word round-trip, phase 1). Globals are
// window-attached like every module (see components.js); the module also
// exports for node:test, because the extractor is pure computation and the
// tests must run it on real fixture bytes, not a paraphrase of it.
//
// A .docx is a ZIP archive whose word/document.xml carries the wording as
// WordprocessingML. HaTi reads exactly that part with no library: the ZIP
// central directory locates the entry, the platform's own DecompressionStream
// inflates it (browser and Node both ship it), and a small XML walk projects
// the text. Legacy .doc (OLE2) stays refused — there is no XML inside to read.

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
/* A bullet, in any of the marks a contract actually uses. */
const DOC_BULLET = /^\s*(?:[•●▪◦‣·]|\(?[a-z]\)|\([ivxlcdm]+\)|[-–—]\s)\s*/i;
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

if(typeof window!=='undefined') Object.assign(window,{docxExtract,docxXmlToText,docLineKind,docClausePrefix,
  docTextIsRunOn,docBreakRunOn,docBlocksFromText,docRichFromText,docLineWraps,DOC_FURNITURE,DOC_BULLET,DOC_NUMBERED});
if(typeof module!=='undefined'&&module.exports) module.exports={zipEntries,zipEntryBytes,inflateRawBytes,decodeXmlEntities,docxXmlToText,docxExtract,docLineKind,docClausePrefix,
  docTextIsRunOn,docBreakRunOn,docBlocksFromText,docRichFromText,docLineWraps};
