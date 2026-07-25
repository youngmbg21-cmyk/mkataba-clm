// HaTi — structure recovery from an uploaded PDF.
//
// Globals are window-attached on purpose (single global scope; see core.js).
// Design note: DESIGN-rich-documents.md.
//
// Pasting a contract out of Word gives HaTi the document's structure for free:
// the clipboard carries headings, bold, lists and tables as markup. A PDF
// carries none of that — it is a page description, a set of glyphs at
// coordinates. Extracting only the words leaves an undifferentiated wall of
// text, which is exactly how an uploaded contract used to arrive next to a
// pasted one.
//
// But a PDF is not structureless. It states, for every run of text, the point
// size, the weight, the slant and the exact position on the page. Those four
// facts are what a typesetter used to EXPRESS the structure, and they are
// enough to recover most of it:
//
//   a bigger, bolder, shorter, centred line          → a heading
//   a line opening "3.2" or "(b)" or "•"             → a list item
//   a left edge indented past the body margin        → nesting depth
//   a run set in a bold face                         → <strong>
//   a run set in an italic face                      → <em>
//   consecutive lines at the same margin             → one paragraph
//
// The rule this module is written under: **never invent structure that is not
// evidenced.** A wrong heading is worse than a missing one, because it changes
// what the document appears to say. Every threshold below is deliberately
// conservative, and anything unrecognised degrades to a plain paragraph — which
// is exactly what the old behaviour was, so the floor is "no worse than before".

/* A heading must be this much larger than the body to count on size alone. */
const PDFR_HEAD_RATIO = 1.14;
/* …or be bold, no longer than this, and not end like a sentence. */
const PDFR_HEAD_MAX_CHARS = 110;
/* Indent steps smaller than this (in points) are noise, not nesting. */
const PDFR_INDENT_STEP = 12;

/* List markers, most specific first. `depth` is how many dotted levels the
   marker itself declares — "3.2.1" is inherently a third-level item however it
   happens to be indented. */
const PDFR_MARKERS = [
  { re:/^(\d+(?:\.\d+){1,4})[.)]?\s+(?=\S)/,     kind:'ol', dotted:true  },
  { re:/^(\d{1,3})[.)]\s+(?=\S)/,                kind:'ol', dotted:false },
  { re:/^\((\d{1,3})\)\s+(?=\S)/,                kind:'ol', dotted:false },
  { re:/^\(?([a-z])[.)]\s+(?=\S)/,               kind:'ol', type:'a' },
  { re:/^\(?([A-Z])[.)]\s+(?=\S)/,               kind:'ol', type:'A' },
  { re:/^\(?((?:x{0,3})(?:ix|iv|v?i{0,3}))[.)]\s+(?=\S)/, kind:'ol', type:'i' },
  { re:/^([•▪◦●‣·*])\s+(?=\S)/,                  kind:'ul' },
  { re:/^([-–—])\s+(?=\S)/,                      kind:'ul' },
];
function pdfrMarker(text){
  const t=String(text||'');
  for(const m of PDFR_MARKERS){
    const r=m.re.exec(t);
    if(!r) continue;
    if(m.kind==='ol' && m.type==='i' && !r[1]) continue;      // the roman regex can match empty
    return { kind:m.kind, type:m.type||'1', raw:r[0], label:r[1],
      // "3.2.1" declares its own depth; a bare "3." does not
      declared: m.dotted ? r[1].split('.').length : 0,
      rest: t.slice(r[0].length) };
  }
  return null;
}

/* The modal value of a set of numbers, bucketed — used for the body point size
   and the body left margin, both of which are "whatever most of the page does". */
function pdfrModal(values, bucket=0.5){
  const bins={};
  for(const v of values){ const k=Math.round(v/bucket)*bucket; bins[k]=(bins[k]||0)+1; }
  const best=Object.keys(bins).sort((a,b)=>bins[b]-bins[a])[0];
  return best==null ? 0 : Number(best);
}

/* ============================================================
   Lines (from pdfRunsToLines) → sanitised rich HTML.
   `pages` is an array of { lines, width } so a page break can end a paragraph
   and the page's own centre is known for detecting centred titles. */
function pdfLinesToRich(pages){
  const all=[];
  for(const pg of pages) for(const l of pg.lines) all.push({ ...l, pageW:pg.width||612 });
  if(!all.length) return '';

  // ---- the page's own norms, weighted by how much text is set that way ----
  const sizeSamples=[], leftSamples=[];
  for(const l of all){
    const n=Math.max(1, Math.round(l.text.length/8));
    for(let i=0;i<n;i++) sizeSamples.push(l.size);
    if(l.text.length>25) leftSamples.push(l.left);      // only real prose votes on the margin
  }
  const bodySize=pdfrModal(sizeSamples, 0.25) || pdfrModal(all.map(l=>l.size), 0.25);
  const margin=pdfrModal(leftSamples.length?leftSamples:all.map(l=>l.left), 3);

  // ---- classify every line ----
  const items=all.map(l=>{
    const text=l.text.trim();
    const mk=pdfrMarker(text);
    const indent=Math.max(0, l.left-margin);
    const centred=(()=>{
      const c=(l.left+l.right)/2, pc=l.pageW/2;
      return Math.abs(c-pc) < l.pageW*0.055 && l.left > margin + l.pageW*0.06;
    })();
    const sentenceish=/[.;:,]$/.test(text);
    const bigger=l.size >= bodySize*PDFR_HEAD_RATIO;
    const short=text.length<=PDFR_HEAD_MAX_CHARS;
    const caps=text===text.toUpperCase() && /[A-Z]{4}/.test(text);
    // A NUMBERED line in a contract is either a heading ("4. TERMINATION") or a
    // clause ("4. The Supplier shall deliver…"). The number cannot tell them
    // apart; the shape of what follows it can. A heading is short, is not a
    // sentence, and is set bold, larger or in capitals. Everything else that
    // carries a marker is a clause, and stays a list item — which is the safer
    // default, because a clause wrongly promoted to a heading loses its number.
    const headingBody = mk ? String(mk.rest||'') : text;
    const looksTitular = headingBody.length<=64 && !/[.;:,]$/.test(headingBody)
      && (l.bold || bigger || caps);
    const heading = short && (
      mk ? looksTitular
         : (bigger || (l.bold && !sentenceish) || (centred && (l.bold||bigger))));
    // an all-caps short line in a contract is a section head even at body size
    const shouty = !mk && !sentenceish && short && caps;
    // a rule, a dot leader, or a columnar row: keep it verbatim in a <pre>
    const ruled = /^[\s|+_=–—-]{6,}$/.test(text) || /\S {4,}\S/.test(l.text);
    return { ...l, text, mk, indent, centred, heading:heading||shouty, ruled, bigger };
  });

  // ---- heading levels: distinct sizes, largest first ----
  const headSizes=[...new Set(items.filter(i=>i.heading).map(i=>Math.round(i.size*4)/4))]
    .sort((a,b)=>b-a);
  const levelOf=size=>{
    const i=headSizes.indexOf(Math.round(size*4)/4);
    return Math.min(4, Math.max(1, (i<0?1:i)+1));
  };

  // ---- assemble ----
  // One "block" is open at a time — a paragraph, a list item, or a preformatted
  // run — and a line either starts a new block or continues the open one. That
  // single rule is what merges wrapped lines back into the sentence they came
  // from, whether the sentence lives in a paragraph or inside a clause.
  const out=[];
  let cur=null;                       // { kind:'p'|'li', html }
  let listStack=[], preBuf=null, prevItem=null;
  const escText=t=>String(t).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  const closeCur=()=>{
    if(!cur) return;
    if(cur.kind==='p') out.push('<p>'+cur.html+'</p>');
    else out.push('<li>'+cur.html+'</li>');
    cur=null;
  };
  const closePre=()=>{ if(preBuf){ out.push('<pre>'+preBuf.join('\n')+'</pre>'); preBuf=null; } };
  const closeLists=(toDepth=0)=>{
    closeCur();
    while(listStack.length>toDepth) out.push(`</${listStack.pop().kind}>`);
  };
  /* Append a wrapped line to the open block, rejoining a word the typesetter
     broke across the line end. */
  const continueCur=it=>{
    const j=/[-‐]$/.test(cur.html) ? '' : ' ';
    if(j==='') cur.html=cur.html.replace(/[-‐]$/,'');
    cur.html += j + it.html.trim();
  };
  /* A heading is already bold and already sized — a <strong> wrapping the whole
     of it is the typesetter's doing, not the author's, and repeating it inside
     the heading is noise. */
  const headHtml=h=>{
    let t=h.trim();
    for(;;){
      const m=/^<(strong|em)>([\s\S]*)<\/\1>$/.exec(t);
      if(!m || m[2].includes('<'+m[1]+'>')) break;
      t=m[2].trim();
    }
    return t;
  };

  for(let i=0;i<items.length;i++){
    const it=items[i];
    const gap=prevItem ? (prevItem.y-it.y) : 0;
    // A continuation sits a normal line's distance below the previous line. A
    // bigger gap is a new block, whatever else is true.
    const tight = prevItem && gap>0 && gap <= Math.max(prevItem.size, it.size)*1.9;

    if(it.ruled){
      closeLists(); closeCur();
      (preBuf=preBuf||[]).push(escText(it.text));
      prevItem=it; continue;
    }
    closePre();

    if(it.heading){
      closeLists(); closeCur();
      out.push(`<h${levelOf(it.size)}>${headHtml(it.html)}</h${levelOf(it.size)}>`);
      prevItem=it; continue;
    }

    if(it.mk && !it.mk.declared){
      // A SIMPLE marker (1. 2. 3. / a. b. / i. ii.) is one an <ol> can redraw,
      // so it becomes a real list and the marker text is dropped.
      closeCur();
      // Depth is relative to THE LIST WE ARE IN, not to the body margin. Every
      // list is indented from the margin, so measuring against the margin makes
      // the first item depth 1 and its identical siblings depth 2 — nesting each
      // item inside the last and renumbering the whole list. An item is a
      // sibling unless it is a full indent step deeper than the item that opened
      // its level; going back out closes levels until it fits.
      while(listStack.length>1 && it.indent < listStack[listStack.length-1].indent - PDFR_INDENT_STEP*0.75)
        out.push(`</${listStack.pop().kind}>`);
      const top=listStack[listStack.length-1];
      const depth = !top ? 1
        : (it.indent >= top.indent + PDFR_INDENT_STEP ? listStack.length+1 : listStack.length);
      let html=it.html;
      const esc=it.mk.raw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      html=html.replace(new RegExp('^((?:<(?:strong|em)>)*)\\s*'+esc), '$1');
      closeLists(depth);
      while(listStack.length<depth){
        const kind=it.mk.kind;
        const start=(kind==='ol' && /^\d+$/.test(it.mk.label) && Number(it.mk.label)>1)
          ? ` start="${Number(it.mk.label)}"` : '';
        const type=(kind==='ol' && it.mk.type && it.mk.type!=='1') ? ` type="${it.mk.type}"` : '';
        out.push(`<${kind}${type}${start}>`);
        listStack.push({kind, indent:it.indent});
      }
      cur={ kind:'li', html:html.trim() };
      prevItem=it; continue;
    }

    if(it.mk && it.mk.declared){
      // A DOTTED clause number — "11.2", "4.4.2" — is the clause's identity, and
      // no <ol> can regenerate it: a list would renumber 11.2 as "1." and the
      // contract would lose the reference every other clause points at. It stays
      // a paragraph with its number intact as text. Same rule the Word paste
      // converter applies, for the same reason.
      closeLists(); closeCur();
      cur={ kind:'p', html:it.html.trim() };
      prevItem=it; continue;
    }

    // ---- ordinary prose ----
    if(cur && tight && !(prevItem && Math.abs(it.left-prevItem.left) > PDFR_INDENT_STEP*1.5)){
      continueCur(it);                        // wrapped line — same paragraph, same clause
      prevItem=it; continue;
    }
    // a real break: a prose line back at the body margin ends any open list
    if(listStack.length && it.indent < PDFR_INDENT_STEP*0.5) closeLists();
    else closeCur();
    cur={ kind: listStack.length ? 'li' : 'p', html: it.html.trim() };
    prevItem=it;
  }
  closeLists(); closeCur(); closePre();

  const html=out.join('');
  // sanitise on the way out, exactly like every other content source
  return (typeof sanitizeRich==='function') ? sanitizeRich(html) : html;
}

/* ============================================================
   Whole-document entry point: PDF bytes → sanitised rich HTML.
   Returns '' when the page tree cannot be followed or nothing was recovered,
   so the caller can fall back to the plain-text route. */
async function extractPdfRich(buf){
  const bin=pdfLatin(new Uint8Array(buf));
  const pages=[];
  try{
    const objs=pdfIndexObjects(bin);
    await pdfExpandObjStreams(objs);
    for(const pn of pdfPageObjects(objs)){
      const po=objs.get(pn); if(!po) continue;
      let resDict='', node=po, hops=0, mediaBox=null;
      while(node&&hops++<8){
        if(!mediaBox){ const mb=pdfArray(objs, node.dict, '/MediaBox');
          if(mb){ const n=mb.trim().split(/\s+/).map(Number); if(n.length>=4) mediaBox=n; } }
        const ri=node.dict.indexOf('/Resources');
        if(ri>=0 && !resDict){ const tail=node.dict.slice(ri+10), ref=pdfRef(tail);
          resDict=ref!=null?(objs.get(ref)?.dict||''):tail; }
        if(resDict && mediaBox) break;
        const par=pdfRef(pdfDictVal(node.dict,'/Parent')); node=par!=null?objs.get(par):null;
      }
      const fonts=await pdfPageFonts(objs, resDict);
      const ci=po.dict.indexOf('/Contents'); if(ci<0) continue;
      const tail=po.dict.slice(ci+9);
      const one=pdfRef(tail);
      let refs=[];
      if(one!=null) refs=[one];
      else { const arr=/\[([\s\S]*?)\]/.exec(tail);
        if(arr){ const re=/(\d+)\s+\d+\s+R/g; let m; while((m=re.exec(arr[1]))) refs.push(Number(m[1])); } }
      let content='';
      for(const r of refs){ const b=await pdfStreamBytes(objs.get(r)); if(b) content+=pdfLatin(b)+'\n'; }
      if(!content.trim()) continue;
      const lines=pdfRunsToLines(pdfTextRuns(content, fonts));
      if(lines.length) pages.push({ lines, width: mediaBox ? Math.abs(mediaBox[2]-mediaBox[0]) : 612 });
    }
  }catch(e){ return ''; }
  if(!pages.length) return '';
  const html=pdfLinesToRich(pages);
  return (typeof richToText==='function' && !richToText(html).trim()) ? '' : html;
}

/* The document-level entry point the ingestion paths call: give it a data URL
   and a MIME type, get back structured content when the file carries recoverable
   structure and plain text when it does not. Never throws, and never returns
   rich content that projects to nothing. */
async function extractDocRich(dataUrl, mime){
  const plain = await extractDocText(dataUrl, mime);
  if(!/pdf/.test(mime||'')) return { html:'', text:plain, format:TEXT_FORMAT, summary:null };
  let html='';
  try{ html = await extractPdfRich(dataUrlBytes(dataUrl).buffer); }catch(e){ html=''; }
  if(!html) return { html:'', text:plain, format:TEXT_FORMAT, summary:null };
  // Sanity: the structured version must carry essentially the same words as the
  // plain one. If it does not, something in the reconstruction dropped content,
  // and the plain text — which is the floor, and was the old behaviour — wins.
  const rich=richToText(html);
  const a=rich.replace(/\s+/g,'').length, b=String(plain||'').replace(/\s+/g,'').length;
  if(b>200 && a < b*0.9) return { html:'', text:plain, format:TEXT_FORMAT, summary:null };
  return { html, text:rich, format:RICH_FORMAT, summary:pdfRichSummary(html) };
}

/* What a caller gets back, so it can report honestly. */
function pdfRichSummary(html){
  const h=(html.match(/<h[1-4]\b/g)||[]).length;
  const l=(html.match(/<(ol|ul)\b/g)||[]).length;
  const b=(html.match(/<strong>/g)||[]).length;
  const i=(html.match(/<em>/g)||[]).length;
  const bits=[];
  if(h) bits.push(`${h} heading${h===1?'':'s'}`);
  if(l) bits.push(`${l} list${l===1?'':'s'}`);
  if(b) bits.push(`${b} bold run${b===1?'':'s'}`);
  if(i) bits.push(`${i} italic run${i===1?'':'s'}`);
  return { headings:h, lists:l, bold:b, italic:i, label:bits.join(' · ') };
}

Object.assign(window,{PDFR_HEAD_RATIO,PDFR_HEAD_MAX_CHARS,PDFR_INDENT_STEP,PDFR_MARKERS,
  pdfrMarker,pdfrModal,pdfLinesToRich,extractPdfRich,extractDocRich,pdfRichSummary});
