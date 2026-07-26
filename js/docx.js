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
   output shape so versions, diffs and the AI pipeline see the same kind of
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

if(typeof window!=='undefined') Object.assign(window,{docxExtract,docxXmlToText,docLineKind,docClausePrefix});
if(typeof module!=='undefined'&&module.exports) module.exports={zipEntries,zipEntryBytes,inflateRawBytes,decodeXmlEntities,docxXmlToText,docxExtract,docLineKind,docClausePrefix};
