// HaTi — paste conversion + the rich editor surface.
//
// Globals are window-attached on purpose (single global scope; see core.js).
// Design note: DESIGN-rich-documents.md.
//
// Almost nobody's standard contract exists as a PDF they can conveniently
// upload. It exists in Word, and the fastest honest route into HaTi is Ctrl+A,
// Ctrl+C, Ctrl+V. This module is what makes that paste arrive as a document
// rather than as a wall of text.
//
// It runs BEFORE the sanitiser, and that ordering is the whole point: the
// sanitiser strips every `style` attribute, so this is the only place where
// `font-weight:var(--w-title)`, `text-transform:uppercase` and Word's `mso-list` metadata
// can still be read. What survives is meaning — bold, italic, underline, real
// capitals, heading level, list structure and its NUMBERS. What is thrown away
// is the machine the document was written on: typeface, point size, colour,
// margins, tab stops.

/* ---------- what a bullet looks like when Word draws one ---------- */
const PASTE_BULLETS = /^[·•●▪■◦‣⁃o\-\*]$/;
/* Markers we can safely turn back into a real list. Anything else keeps its
   literal text in a paragraph — a number we cannot model is still a number the
   customer must be able to read. */
const PASTE_MARKERS = [
  { re:/^\(?(\d{1,4})[.)\]]?$/,        type:'1', val:m=>parseInt(m[1],10) },
  { re:/^\(?([a-z])[.)\]]$/,           type:'a', val:m=>m[1].charCodeAt(0)-96 },
  { re:/^\(?([A-Z])[.)\]]$/,           type:'A', val:m=>m[1].charCodeAt(0)-64 },
  { re:/^\(?(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)[.)\]]$/,  type:'i', val:m=>_romanVal(m[1]) },
  { re:/^\(?(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)[.)\]]$/,  type:'I', val:m=>_romanVal(m[1].toLowerCase()) },
];
function _romanVal(s){
  const V={i:1,v:5,x:10,l:50,c:100}; let n=0;
  for(let i=0;i<s.length;i++){ const a=V[s[i]], b=V[s[i+1]]; n += (b&&a<b) ? -a : a; }
  return n;
}
function _markerKind(text){
  const t=String(text||'').trim().replace(/ /g,' ').trim();
  if(!t) return null;
  if(PASTE_BULLETS.test(t)) return { list:'ul' };
  for(const m of PASTE_MARKERS){ const r=m.re.exec(t); if(r) return { list:'ol', type:m.type, start:m.val(r) }; }
  return null;                       // unmodellable — keep the literal text
}

/* ---------- style reading ---------- */
const _style = (el,prop) => { try{ return (el.getAttribute('style')||''); }catch(e){ return ''; } };
function _css(el, prop){
  const s=_style(el);
  const re=new RegExp('(?:^|;)\\s*'+prop.replace(/-/g,'\\-')+'\\s*:\\s*([^;]+)','i');
  const m=re.exec(s); return m?m[1].trim().toLowerCase():'';
}
const _isBoldStyle   = el => { const v=_css(el,'font-weight'); return v==='bold'||v==='bolder'||(/^\d+$/.test(v)&&+v>=600); };
const _isNormalWeight= el => { const v=_css(el,'font-weight'); return v==='normal'||(/^\d+$/.test(v)&&+v<600); };
const _isItalicStyle = el => /italic|oblique/.test(_css(el,'font-style'));
const _isUnderStyle  = el => /underline/.test(_css(el,'text-decoration')+' '+_css(el,'text-decoration-line'));
const _isStrikeStyle = el => /line-through/.test(_css(el,'text-decoration')+' '+_css(el,'text-decoration-line'));
const _isUpperStyle  = el => /uppercase/.test(_css(el,'text-transform')) || /small-caps|all-small-caps/.test(_css(el,'font-variant')+' '+_css(el,'font-variant-caps'));
function _ptSize(el){
  const v=_css(el,'font-size'); if(!v) return 0;
  const m=/^([\d.]+)\s*(pt|px|em|rem)?$/.exec(v); if(!m) return 0;
  const n=parseFloat(m[1]); if(!Number.isFinite(n)) return 0;
  switch(m[2]){ case 'px': return n*0.75; case 'em': case 'rem': return n*11; default: return n; }
}

/* ============================================================
   THE CONVERTER
   Takes clipboard HTML (Word, Google Docs, a web page, anything) and returns a
   sanitised rich fragment. Returns '' when nothing usable came back, so the
   caller can fall back to text/plain. */
function richFromPasteHtml(html){
  const src=String(html||'');
  if(!src.trim()) return '';
  const doc=document.implementation.createHTMLDocument('hati-paste');
  const root=doc.createElement('div');
  // Word wraps whole alternate renderings in conditional comments; the HTML
  // parser keeps them as comment nodes, so they never become elements.
  root.innerHTML=src;

  _pasteDropChrome(root);
  _pasteUnwrapGoogleDocsWrapper(root);
  _pasteApplyStyleMarks(root);
  _pasteHeadings(root);
  _pasteSignatureRules(root);
  _pasteWordLists(root);
  _pasteTidy(root);

  return sanitizeRich(root.innerHTML);
}

/* Whatever the clipboard offers, converted. Prefers HTML; falls back to plain
   text through textToRich(). Returns {html, format, via}. */
function richFromClipboard(dt){
  const asHtml=dt && dt.getData ? dt.getData('text/html') : '';
  const asText=dt && dt.getData ? dt.getData('text/plain') : '';
  if(asHtml && asHtml.trim()){
    const converted=richFromPasteHtml(asHtml);
    if(converted && (richToText(converted)||'').trim()) return { html:converted, format:RICH_FORMAT, via:'html', plain:asText };
  }
  if(asText && asText.trim()) return { html:textToRich(asText), format:RICH_FORMAT, via:'text', plain:asText };
  return { html:'', format:RICH_FORMAT, via:'none', plain:'' };
}

/* ---------- 1. drop the chrome ---------- */
function _pasteDropChrome(root){
  root.querySelectorAll('style,script,link,meta,title,xml,colgroup,col').forEach(n=>n.remove());
  // Word's <o:p>, <w:*>, <v:*>, <m:*> and friends
  Array.from(root.querySelectorAll('*')).forEach(el=>{
    if((el.tagName||'').includes(':')) { while(el.firstChild) el.parentNode.insertBefore(el.firstChild, el); el.remove(); }
  });
  // Word's "Click here to enter text" content controls leave empty spans behind
  root.querySelectorAll('span,font').forEach(el=>{
    if(!el.attributes.length && !el.childNodes.length) el.remove();
  });
}

/* ---------- 2. Google Docs wraps the whole selection in a fake-bold <b> ----
   <b style="font-weight:normal" id="docs-internal-guid-…">. Mapping that b to
   <strong> would bold the entire contract. */
function _pasteUnwrapGoogleDocsWrapper(root){
  root.querySelectorAll('b,strong').forEach(b=>{
    const isGuid=/docs-internal-guid/.test(b.getAttribute('id')||'');
    if(isGuid || _isNormalWeight(b)){
      while(b.firstChild) b.parentNode.insertBefore(b.firstChild, b);
      b.remove();
    }
  });
}

/* ---------- 3. turn inline STYLE into inline MEANING ----------
   This is the only chance: after sanitizeRich there are no styles left. */
function _pasteApplyStyleMarks(root){
  const doc=root.ownerDocument;
  // deepest-first, so wrapping a child doesn't disturb the parent's iteration
  const els=Array.from(root.querySelectorAll('*')).reverse();
  for(const el of els){
    if(!el.parentNode) continue;
    const tag=(el.tagName||'').toUpperCase();
    if(tag==='PRE'||tag==='CODE') continue;

    // real capitals, not a CSS trick — a defined term set in All Caps must
    // still read as All Caps once the styling is gone
    if(_isUpperStyle(el)){
      const w=doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let t; while((t=w.nextNode())) t.nodeValue=t.nodeValue.toUpperCase();
    }
    // Only wrap elements that carry no semantics of their own — wrapping a <p>
    // in <strong> would be wrong, and <b>/<i>/<u> already say it.
    if(!/^(SPAN|FONT|A|LABEL)$/.test(tag)) continue;
    let inner=el;
    const wrap=name=>{ const w=doc.createElement(name); inner.parentNode.insertBefore(w, inner); w.appendChild(inner); inner=w; };
    if(_isBoldStyle(el))   wrap('b');
    if(_isItalicStyle(el)) wrap('i');
    if(_isUnderStyle(el))  wrap('u');
    if(_isStrikeStyle(el)) wrap('s');
  }
}

/* ---------- 4. heading hierarchy ---------- */
function _pasteHeadings(root){
  root.querySelectorAll('p,div').forEach(p=>{
    const cls=String(p.getAttribute('class')||'');
    const mso=/^(?:Mso)?Heading\s*(\d)/i.exec(cls) || /Mso(?:Heading)(\d)/i.exec(cls);
    if(/MsoTitle/i.test(cls)) return _pasteRename(p,'h1');
    if(/MsoSubtitle/i.test(cls)) return _pasteRename(p,'h2');
    if(mso){ const n=Math.min(4, Math.max(1, parseInt(mso[1],10)||2)); return _pasteRename(p,'h'+n); }

    // style-only headings: a short, fully-bold paragraph that is either set
    // larger than the body or written in capitals. Deliberately conservative —
    // wrongly promoting body copy to a heading is worse than missing one.
    const text=(p.textContent||'').replace(/\s+/g,' ').trim();
    if(!text || text.length>90 || /[.;:,]$/.test(text)) return;
    if(p.querySelector('ul,ol,table,p,div')) return;
    const allBold = _isBoldStyle(p) || (p.children.length>0 &&
      Array.from(p.children).every(ch=>/^(B|STRONG)$/.test(ch.tagName)||_isBoldStyle(ch)) &&
      (p.textContent||'').trim()===Array.from(p.children).map(c=>c.textContent).join('').trim());
    if(!allBold) return;
    const big=_ptSize(p)>=13 || Array.from(p.querySelectorAll('*')).some(x=>_ptSize(x)>=13);
    const caps=text===text.toUpperCase() && /[A-Z]{3}/.test(text);
    if(big||caps) _pasteRename(p, big&&!caps ? 'h3' : 'h2');
  });
}
function _pasteRename(el, tagName){
  const next=el.ownerDocument.createElement(tagName);
  // carry the class through so the list pass below can still see MsoListParagraph
  if(el.getAttribute('class')) next.setAttribute('class', el.getAttribute('class'));
  if(el.getAttribute('style')) next.setAttribute('style', el.getAttribute('style'));
  while(el.firstChild) next.appendChild(el.firstChild);
  el.replaceWith(next);
  return next;
}

/* ---------- 5. signature rules ----------
   A signature line is drawn three ways: a run of underscores (literal text,
   already safe), an <hr>, or an empty run with a bottom border. The last two
   are pure styling and would vanish entirely, taking the place-to-sign with
   them — so they become the underscores they represent. */
function _pasteSignatureRules(root){
  const doc=root.ownerDocument;
  root.querySelectorAll('hr').forEach(hr=>{
    const p=doc.createElement('p'); p.textContent='________________________________';
    hr.replaceWith(p);
  });
  root.querySelectorAll('span,td,p,div').forEach(el=>{
    if((el.textContent||'').trim()) return;
    const s=_style(el);
    if(!/border-bottom\s*:\s*(?!none)/i.test(s) && !/border-top\s*:\s*(?!none)/i.test(s)) return;
    if(el.querySelector('table,ul,ol')) return;
    el.textContent='________________________';
  });
}

/* ---------- 6. Word list reconstruction ----------
   Word does not emit <ol>. It emits a run of paragraphs carrying
   `mso-list:lN levelM lfoK`, each opening with

       <span style='mso-list:Ignore'>1.<span …>&nbsp;&nbsp;</span></span>

   where that span's text is the LITERAL clause number. Dropping it without
   rebuilding the list is exactly how a contract silently loses its numbering,
   so this pass rebuilds real <ol>/<ul> and only then removes the marker span —
   and when a marker cannot be modelled as a list at all, the paragraph keeps
   its literal number instead. */
function _pasteWordLists(root){
  const doc=root.ownerDocument;
  const items=[];
  Array.from(root.querySelectorAll('p,h1,h2,h3,h4,div')).forEach(p=>{
    const s=_style(p), cls=String(p.getAttribute('class')||'');
    const lm=/mso-list\s*:\s*l(\d+)\s+level(\d+)/i.exec(s);
    const isListPara = !!lm || /MsoListParagraph/i.test(cls);
    if(!isListPara) return;
    // the marker span, if Word left one
    let markerEl=null;
    for(const sp of Array.from(p.querySelectorAll('span'))){
      if(/mso-list\s*:\s*ignore/i.test(_style(sp))){ markerEl=sp; break; }
    }
    const markerText=markerEl ? (markerEl.textContent||'').replace(/ /g,' ').trim() : '';
    items.push({ el:p, level:lm?Math.max(1,parseInt(lm[2],10)||1):1,
      listId:lm?lm[1]:'x', markerEl, markerText, kind:_markerKind(markerText) });
  });
  if(!items.length) return;

  // group runs of CONSECUTIVE list paragraphs (siblings, nothing in between)
  const runs=[]; let cur=null;
  for(const it of items){
    const prev=cur && cur[cur.length-1];
    const contiguous = prev && prev.el.parentNode===it.el.parentNode &&
      _nextElement(prev.el)===it.el;
    if(contiguous){ cur.push(it); }
    else { cur=[it]; runs.push(cur); }
  }

  for(const run of runs){
    // A marker we cannot model is left exactly where it is, with its number
    // intact as text. Better a numbered paragraph than a renumbered clause.
    if(run.some(it=>it.markerText && !it.kind)){
      run.forEach(it=>{ if(it.markerEl) it.markerEl.replaceWith(doc.createTextNode(it.markerText+' ')); });
      continue;
    }
    const anchor=run[0].el;
    const holder=doc.createElement('div');
    anchor.parentNode.insertBefore(holder, anchor);
    // stack[level] = the list element currently open at that depth
    const stack=[];
    for(const it of run){
      const kind=it.kind || { list:'ul' };
      const lvl=Math.min(it.level, 6);
      while(stack.length>lvl) stack.pop();
      while(stack.length<lvl){
        const depth=stack.length+1;
        const list=doc.createElement(kind.list==='ul'?'ul':'ol');
        if(kind.list==='ol'){
          if(kind.type && kind.type!=='1') list.setAttribute('type', kind.type);
          if(depth===lvl && kind.start>1) list.setAttribute('start', String(kind.start));
        }
        const parentList=stack[stack.length-1];
        if(parentList){
          const lastLi=parentList.lastElementChild;
          (lastLi&&lastLi.tagName==='LI' ? lastLi : parentList).appendChild(list);
        } else {
          holder.appendChild(list);
        }
        stack.push(list);
      }
      const list=stack[stack.length-1];
      // a run that restarts numbering mid-way (Word's "restart at 1") is
      // honoured by opening a fresh list
      if(kind.list==='ol' && kind.start>1 && !list.children.length && !list.hasAttribute('start'))
        list.setAttribute('start', String(kind.start));
      if(it.markerEl) it.markerEl.remove();
      const li=doc.createElement('li');
      while(it.el.firstChild) li.appendChild(it.el.firstChild);
      list.appendChild(li);
      it.el.remove();
    }
    // splice the built lists in where the run was
    while(holder.firstChild) holder.parentNode.insertBefore(holder.firstChild, holder);
    holder.remove();
  }
}
function _nextElement(el){ let n=el.nextSibling;
  while(n && !(n.nodeType===1)){ if(n.nodeType===3 && (n.nodeValue||'').trim()) return null; n=n.nextSibling; }
  return n; }

/* ---------- 7. final tidy ---------- */
function _pasteTidy(root){
  // Word pads every cell and paragraph with &nbsp; runs
  const w=root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts=[]; let t; while((t=w.nextNode())) texts.push(t);
  for(const n of texts){
    if(n.parentElement && n.parentElement.closest('pre')) continue;
    n.nodeValue=n.nodeValue.replace(/ /g,' ').replace(/[ \t]{2,}/g,' ');
  }
  // Word's spacer paragraphs
  root.querySelectorAll('p,div,h1,h2,h3,h4').forEach(p=>{
    if((p.textContent||'').trim()) return;
    if(p.querySelector('table,ul,ol,br,img')) return;
    p.remove();
  });
}

/* ============================================================
   SANITY CHECK
   Did the conversion actually keep the document? Compares the converted text
   against the clipboard's own plain text. This is what lets the UI say "that
   did not come across properly, use the plain-text route" instead of letting
   someone save a mangled contract. */
function pasteConversionReport(richHtml, plainText){
  const got=(richToText(richHtml)||'').replace(/\s+/g,'').length;
  const want=String(plainText||'').replace(/\s+/g,'').length;
  const r={ got, want, ratio: want ? got/want : 1, ok:true, reason:'' };
  if(!got){ r.ok=false; r.reason='Nothing came across.'; return r; }
  if(want && r.ratio < 0.85){
    r.ok=false;
    r.reason=`About ${Math.max(1,Math.round((1-r.ratio)*100))}% of the text did not come across.`;
    return r;
  }
  // clause numbers present in the source must be present in the conversion
  const src=String(plainText||'');
  const srcNums=(src.match(/(?:^|\n)\s*(\d{1,2}(?:\.\d{1,2}){0,3})[.)\s]/g)||[])
    .map(s=>s.trim().replace(/[.)]$/,'')).filter(Boolean);
  if(srcNums.length>=3){
    const out=richToText(richHtml);
    const missing=srcNums.filter(n=>!out.includes(n));
    if(missing.length > srcNums.length*0.25){
      r.ok=false;
      r.reason=`${missing.length} of ${srcNums.length} clause numbers are missing (e.g. ${missing.slice(0,3).join(', ')}).`;
    }
  }
  return r;
}

/* ============================================================
   THE EDITOR SURFACE
   A contenteditable, not a textarea — a textarea can only ever hold plain text,
   which would defeat the whole exercise. Every paste is intercepted and
   converted; nothing the browser would have inserted by default gets in. */
const RICH_EDITOR_NOTE =
  'Typeface, point size and colour are not carried over — HaTi styles every document the same way. ' +
  'Bold, italics, underline, capitalisation, headings, numbered and bulleted lists, indentation and tables are kept.';

/* Wire a rich editor onto an element. Returns { get, set, focus, isEmpty }. */
function richEditor(el, opts={}){
  el.setAttribute('contenteditable','true');
  el.setAttribute('role','textbox');
  el.setAttribute('aria-multiline','true');
  el.setAttribute('spellcheck','false');
  el.classList.add('hati-doc','hati-editor');
  if(opts.placeholder) el.setAttribute('data-placeholder', opts.placeholder);
  if(opts.html) el.innerHTML=renderDocInner(opts.html);

  const onChange=()=>{ if(typeof opts.onChange==='function') opts.onChange(); };

  el.addEventListener('paste', e=>{
    e.preventDefault();
    const res=richFromClipboard(e.clipboardData);
    if(!res.html){ return; }
    const sel=window.getSelection();
    // Replacing the whole editor is the normal case (paste a contract into an
    // empty box); an insertion into existing content splices at the caret.
    if(!(el.textContent||'').trim() || !sel || !sel.rangeCount || !el.contains(sel.anchorNode)){
      el.innerHTML=renderDocInner(res.html);
    } else {
      const r=sel.getRangeAt(0); r.deleteContents();
      const frag=document.createElement('div'); frag.innerHTML=renderDocInner(res.html);
      const df=document.createDocumentFragment();
      while(frag.firstChild) df.appendChild(frag.firstChild);
      r.insertNode(df);
    }
    if(typeof opts.onPaste==='function') opts.onPaste(res);
    onChange();
  });
  // a drop is a paste by another name, and carries the same clipboard formats
  el.addEventListener('drop', e=>{
    if(!e.dataTransfer) return;
    e.preventDefault();
    const res=richFromClipboard(e.dataTransfer);
    if(res.html){ el.innerHTML=renderDocInner(res.html); if(typeof opts.onPaste==='function') opts.onPaste(res); onChange(); }
  });
  el.addEventListener('input', onChange);
  // Ctrl/Cmd+B / I / U — the three marks a contract actually uses
  el.addEventListener('keydown', e=>{
    if(!(e.metaKey||e.ctrlKey)) return;
    const k=(e.key||'').toLowerCase();
    if(k!=='b'&&k!=='i'&&k!=='u') return;
    e.preventDefault();
    try{ document.execCommand({b:'bold',i:'italic',u:'underline'}[k]); }catch(err){}
    onChange();
  });

  return {
    get: ()=>sanitizeRich(el.innerHTML),
    set: html=>{ el.innerHTML=renderDocInner(html); onChange(); },
    focus: ()=>el.focus(),
    isEmpty: ()=>!(el.textContent||'').trim(),
    el,
  };
}
/* The sanitised inside of a rich body, without renderDocHtml's wrapper — the
   editor element IS the .hati-doc surface. */
const renderDocInner = html => sanitizeRich(html);

Object.assign(window,{PASTE_BULLETS,PASTE_MARKERS,RICH_EDITOR_NOTE,
  richFromPasteHtml,richFromClipboard,pasteConversionReport,richEditor,renderDocInner});
