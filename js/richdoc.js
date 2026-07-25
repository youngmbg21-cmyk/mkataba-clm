// HaTi — rich document content: the foundation.
//
// Globals are window-attached on purpose (single global scope; see core.js).
// Design note: DESIGN-rich-documents.md.
//
// A document body used to be a plain string. It is now a string plus a `format`
// marker — 'text' (everything that existed before this run, rendered exactly as
// it always was) or 'rich' (a restricted, sanitised HTML fragment that can carry
// bold, italics, underline, headings, lists with their numbering, indentation,
// tables and preformatted blocks).
//
// Three rules govern everything here:
//   1. Sanitise on save AND again on render. The counterparty portal serves
//      people outside the workspace with no login; stored XSS there would be
//      serious, so storage is never trusted at render time.
//   2. Parse inert. Never assign untrusted HTML to a live element — an inert
//      document runs no scripts, fires no handlers and fetches no images.
//   3. Plain text is never inferred or auto-converted. No `format` means
//      'text', and it renders through the original code path unchanged.

/* ---------- the allowlist (see DESIGN-rich-documents.md) ---------- */
const RICH_TAGS = new Set(['P','BR','H1','H2','H3','H4','STRONG','EM','U','S',
  'UL','OL','LI','TABLE','THEAD','TBODY','TR','TH','TD','BLOCKQUOTE','PRE','SPAN']);
/* Attributes permitted, per tag. Nothing else survives — no style, no id, no
   class outside the one below, no data-*, no on*, no href, no colspan. */
const RICH_ATTRS = { OL:new Set(['start','type']), SPAN:new Set(['class']) };
/* The single allowlisted span class: HaTi's own field-placeholder marker. */
const RICH_FIELD_CLASS = 'hati-field';
/* Removed with their contents — these carry no document meaning and every one
   of them is a way to execute or fetch something. */
const RICH_DROP = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','NOSCRIPT',
  'LINK','META','TITLE','HEAD','BASE','APPLET','IMG','PICTURE','SOURCE','VIDEO',
  'AUDIO','CANVAS','SVG','MATH','FORM','INPUT','BUTTON','SELECT','TEXTAREA',
  'OPTION','LABEL','FIELDSET','TEMPLATE','SLOT','FRAME','FRAMESET','XML']);
/* Mapped rather than unwrapped, because their meaning survives the mapping. */
const RICH_MAP = { B:'STRONG', I:'EM', STRIKE:'S', DEL:'S', INS:'U', MARK:'SPAN',
  H5:'H4', H6:'H4', CAPTION:'P', DT:'P', DD:'P', TFOOT:'TBODY', CENTER:'P',
  ADDRESS:'P', FIGCAPTION:'P', SMALL:'SPAN', BIG:'SPAN', ABBR:'SPAN', CITE:'EM',
  Q:'SPAN', SUB:'SPAN', SUP:'SPAN', CODE:'SPAN', KBD:'SPAN', SAMP:'SPAN',
  VAR:'EM', TIME:'SPAN', DFN:'EM' };
/* Block-level members of the allowlist — used for paragraph separation and for
   deciding whether a wrapper can safely become a <p>. */
const RICH_BLOCKS = new Set(['P','H1','H2','H3','H4','UL','OL','LI','TABLE',
  'THEAD','TBODY','TR','TH','TD','BLOCKQUOTE','PRE']);
/* Block-level tags that are NOT on the allowlist. Simply unwrapping these
   would glue the text of two paragraphs together — which is exactly the silent
   structure loss this whole module exists to prevent — so one holding only
   inline content becomes a <p> instead. (Word and Google Docs both emit
   paragraphs as <div>, so this is the common case, not the exotic one.) */
const RICH_BLOCKISH = new Set(['DIV','SECTION','ARTICLE','HEADER','FOOTER',
  'ASIDE','MAIN','NAV','FIGURE','HGROUP','DETAILS','SUMMARY','DL','HR']);
const _BLOCK_SEL='p,h1,h2,h3,h4,h5,h6,ul,ol,li,table,thead,tbody,tr,th,td,'+
  'blockquote,pre,div,section,article,header,footer,aside,main,nav,figure,hgroup,details,dl,dt,dd';

/* ---------- inert parsing ---------- */
let _inertDoc = null;
function _inert(){
  if(!_inertDoc) _inertDoc = document.implementation.createHTMLDocument('hati-sanitise');
  return _inertDoc;
}
/* Parse a fragment WITHOUT touching the live document. Returns a detached body
   element belonging to the inert document. */
function _parseInert(html){
  const doc=_inert();
  const holder=doc.createElement('div');
  holder.innerHTML=String(html==null?'':html);
  return holder;
}

/* ---------- the sanitiser ----------
   Walks the tree once. Drops, unwraps or keeps each element per the allowlist,
   strips every attribute not explicitly permitted, and removes every comment.
   Returns a restricted HTML string. Safe to call on anything, including output
   it produced itself (it is idempotent). */
function sanitizeRich(html){
  const root=_parseInert(html);
  _sanitizeNode(root);
  _normaliseStructure(root);
  return root.innerHTML;
}
function _sanitizeNode(node){
  // iterate over a snapshot: the walk mutates the child list
  for(const child of Array.from(node.childNodes)){
    if(child.nodeType===8){ child.remove(); continue; }           // comments
    if(child.nodeType===3) continue;                               // text
    if(child.nodeType!==1){ child.remove(); continue; }            // CDATA, PI…

    const raw=child.tagName||'';
    // Word/Office namespaced elements (o:p, w:sdt, v:shape, m:oMath) — the tag
    // name arrives with the colon intact in HTML parsing
    if(raw.includes(':')){ _unwrap(child); continue; }
    const tag=raw.toUpperCase();

    if(RICH_DROP.has(tag)){ child.remove(); continue; }

    let el=child;
    const mapped=RICH_MAP[tag];
    if(mapped){ el=_rename(child, mapped); }
    else if(RICH_TAGS.has(tag)){ /* keep as-is */ }
    else if(RICH_BLOCKISH.has(tag)){
      // a <p> cannot contain blocks, so a wrapper that holds any is unwrapped;
      // one that holds only inline content becomes the paragraph it was
      if(child.querySelector && child.querySelector(_BLOCK_SEL)){ _unwrap(child); continue; }
      if(!(child.textContent||'').trim()){ child.remove(); continue; }
      el=_rename(child,'P');
    }
    else { _unwrap(child); continue; }

    _stripAttrs(el);
    _sanitizeNode(el);
  }
}
/* Replace an element with one of another tag, keeping its children. */
function _rename(el, tagName){
  const doc=el.ownerDocument||_inert();
  const next=doc.createElement(tagName);
  while(el.firstChild) next.appendChild(el.firstChild);
  el.replaceWith(next);
  return next;
}
/* Remove an element but keep its children in place. */
function _unwrap(el){
  const parent=el.parentNode; if(!parent){ el.remove(); return; }
  // A block wrapper being unwrapped would glue its text to the neighbours, so
  // leave a <br> behind when it held block-ish content and had siblings.
  while(el.firstChild) parent.insertBefore(el.firstChild, el);
  el.remove();
}
function _stripAttrs(el){
  const allowed=RICH_ATTRS[el.tagName]||null;
  for(const attr of Array.from(el.attributes||[])){
    const name=(attr.name||'').toLowerCase();
    if(!allowed || !allowed.has(name)){ el.removeAttribute(attr.name); continue; }
    if(el.tagName==='SPAN' && name==='class'){
      // exactly one class is permitted, and only that one
      if(String(attr.value||'').trim()!==RICH_FIELD_CLASS) el.removeAttribute(attr.name);
      continue;
    }
    if(el.tagName==='OL' && name==='start'){
      const n=parseInt(attr.value,10);
      if(Number.isFinite(n)&&n>0&&n<100000) el.setAttribute('start',String(n)); else el.removeAttribute('start');
      continue;
    }
    if(el.tagName==='OL' && name==='type'){
      if(!/^[1aAiI]$/.test(String(attr.value||''))) el.removeAttribute('type');
      continue;
    }
  }
}
/* Structural tidy-up after the allowlist pass: drop empties, and lift stray
   <li> that lost their list, so the fragment is well-formed enough to render
   and to serialise deterministically. */
function _normaliseStructure(root){
  // an <li> whose parent is no longer a list becomes a paragraph
  root.querySelectorAll('li').forEach(li=>{
    const p=li.parentElement;
    if(!p || (p.tagName!=='UL' && p.tagName!=='OL')) _rename(li,'P');
  });
  // table parts that lost their table
  root.querySelectorAll('tr').forEach(tr=>{
    const p=tr.parentElement;
    if(!p || !['TABLE','THEAD','TBODY'].includes(p.tagName)) _rename(tr,'P');
  });
  root.querySelectorAll('td,th').forEach(cell=>{
    if(!cell.parentElement || cell.parentElement.tagName!=='TR') _rename(cell,'P');
  });
  // empty blocks that carry no text and no <br> add nothing but noise
  root.querySelectorAll('p,h1,h2,h3,h4,blockquote,li,span,strong,em,u,s').forEach(el=>{
    if(el.querySelector('br,table,ul,ol,pre')) return;
    if(!(el.textContent||'').trim()) el.remove();
  });
  // source indentation between blocks is not document content — drop it, so
  // what is stored is the document and not the shape of the file it came from
  const doc=root.ownerDocument;
  const w=doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const junk=[]; let t;
  while((t=w.nextNode())){
    if((t.nodeValue||'').trim()) continue;
    if(t.parentElement && t.parentElement.closest('pre')) continue;   // whitespace IS content in <pre>
    const prev=t.previousSibling, next=t.nextSibling;
    const bnd=n=>!n || (n.nodeType===1 && RICH_BLOCKS.has(n.tagName));
    if(bnd(prev)||bnd(next)) junk.push(t);
  }
  junk.forEach(n=>n.remove());
}

/* ---------- format marking ----------
   'text' is the default and is never inferred. A record with no `format` is
   plain text and renders through the original path, unchanged. */
const RICH_FORMAT='rich', TEXT_FORMAT='text';
const docFormat = f => (f===RICH_FORMAT ? RICH_FORMAT : TEXT_FORMAT);
const isRich = f => docFormat(f)===RICH_FORMAT;

/* ---------- the single render entry point ----------
   Nothing else may write document content with innerHTML. Plain text routes to
   documentTextHtml() and renders byte-identically to before this run; rich
   content is sanitised AGAIN here, at the point of render. */
function renderDocHtml(content, format, opts={}){
  if(!isRich(format)){
    return (typeof documentTextHtml==='function')
      ? documentTextHtml(content, opts)
      : `<div style="white-space:pre-wrap">${String(content==null?'':content).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</div>`;
  }
  const cls='hati-doc'+(opts.className?' '+opts.className:'');
  return `<div class="${cls}">${sanitizeRich(content)}</div>`;
}

/* ---------- text projection ----------
   The unit the diff, the AI features, search and (for plain documents) the seal
   all work on. Preserves the document's shape — headings, clauses and
   paragraphs on their own lines — rather than collapsing to one blob.

   Ordered-list numbering is RECONSTRUCTED from the list type, the `start`
   attribute and the nesting depth. A legal document is its clause numbers, and
   an <li> carries none; the browser draws them. Dropping them here would hide
   "1.1", "4.4" and "8.3" from the diff, from the model and from search. */
function richToText(html){
  const root=_parseInert(sanitizeRich(html));
  const lines=[];
  let buf='';
  const flush=()=>{ const t=buf.replace(/[ \t]+/g,' ').trim(); if(t) lines.push(t); buf=''; };
  const marker=(ol, index)=>{
    const start=parseInt(ol.getAttribute('start')||'1',10)||1;
    const n=start+index;
    switch(ol.getAttribute('type')){
      case 'a': return _alpha(n).toLowerCase();
      case 'A': return _alpha(n);
      case 'i': return _roman(n).toLowerCase();
      case 'I': return _roman(n);
      default:  return String(n);
    }
  };
  (function walk(node, path){
    for(const ch of Array.from(node.childNodes)){
      if(ch.nodeType===3){ buf+=ch.nodeValue.replace(/\s+/g,' '); continue; }
      if(ch.nodeType!==1) continue;
      const tag=ch.tagName;
      if(tag==='BR'){ flush(); continue; }
      if(tag==='OL'||tag==='UL'){
        flush();
        let i=0;
        for(const li of Array.from(ch.children)){
          if(li.tagName!=='LI') continue;
          const mark = tag==='OL' ? marker(ch, i) : '•';
          const next = tag==='OL' ? path.concat([mark]) : path;
          // dotted path by nesting depth: 1, 1.1, 1.1.2
          buf += (tag==='OL' ? next.join('.')+'. ' : '• ');
          walk(li, next);
          flush();
          i++;
        }
        continue;
      }
      if(tag==='PRE'){ flush(); (ch.textContent||'').split('\n').forEach(l=>lines.push(l.replace(/[ \t]+$/,''))); continue; }
      if(tag==='TR'){ walk(ch, path); flush(); continue; }
      if(tag==='TD'||tag==='TH'){ walk(ch, path); buf+='\t'; continue; }
      if(RICH_BLOCKS.has(tag)){ flush(); walk(ch, path); flush(); continue; }
      walk(ch, path);
    }
  })(root, []);
  flush();
  return lines.join('\n').replace(/\n{3,}/g,'\n\n').replace(/[ \t]+\n/g,'\n').trim();
}
function _alpha(n){ let s=''; while(n>0){ n--; s=String.fromCharCode(65+(n%26))+s; n=Math.floor(n/26); } return s||'A'; }
function _roman(n){
  const M=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let s=''; for(const [v,r] of M){ while(n>=v){ s+=r; n-=v; } } return s||'I';
}
/* The text of a body in whichever format it is. */
const docContentText = (content, format) => isRich(format) ? richToText(content) : String(content==null?'':content);

/* ---------- canonical form (for the seal) ----------
   A deterministic serialisation: attributes sorted by name, whitespace
   normalised, empties dropped, no newlines. The same document always produces
   the same string; two documents that differ only in formatting produce
   different strings, because formatting is part of the document. */
function canonicalRich(html){
  const root=_parseInert(sanitizeRich(html));
  _canonWhitespace(root);
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const out=[];
  (function walk(node){
    for(const ch of Array.from(node.childNodes)){
      if(ch.nodeType===3){ if(ch.nodeValue) out.push(esc(ch.nodeValue)); continue; }
      if(ch.nodeType!==1) continue;
      const tag=ch.tagName.toLowerCase();
      const attrs=Array.from(ch.attributes||[])
        .map(a=>[a.name.toLowerCase(), a.value])
        .sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0)
        .map(([n,v])=>` ${n}="${esc(v)}"`).join('');
      if(tag==='br'){ out.push('<br>'); continue; }
      out.push(`<${tag}${attrs}>`);
      walk(ch);
      out.push(`</${tag}>`);
    }
  })(root);
  return out.join('');
}
/* Whitespace normalisation for the canonical form. Two documents that differ
   only in how their source was indented must hash the same, or a contract
   would fail to verify against its own seal after a harmless round trip.
   Whitespace inside a <pre> is CONTENT and is left completely alone. */
function _canonWhitespace(root){
  const isBlock = n => n && n.nodeType===1 && RICH_BLOCKS.has(n.tagName);
  const doc=root.ownerDocument;
  const walker=doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts=[]; let n;
  while((n=walker.nextNode())){ if(!n.parentElement||!n.parentElement.closest('pre')) texts.push(n); }
  for(const t of texts){
    let v=t.nodeValue.replace(/\s+/g,' ');
    // A block boundary — the start or end of a block, or the gap between two
    // blocks — carries no meaning; the space between two INLINE elements does.
    const atStart = !t.previousSibling || isBlock(t.previousSibling);
    const atEnd   = !t.nextSibling     || isBlock(t.nextSibling);
    if(atStart) v=v.replace(/^ /,'');
    if(atEnd)   v=v.replace(/ $/,'');
    t.nodeValue=v;
    if(!v) t.remove();
  }
}
/* The exact string a document body is hashed over, for either format. */
const canonicalDocString = (content, format) =>
  isRich(format) ? canonicalRich(content) : String(content==null?'':content).replace(/\s+/g,' ').trim();

/* ---------- placeholders inside rich content ----------
   {{key}} placeholders are plain text, so they survive the sanitiser untouched
   inside any inline mark or list item — the sanitiser never rewrites text
   nodes. These helpers only affect DISPLAY: they wrap a placeholder in the one
   allowlisted span class so it reads as a blank rather than as literal braces. */
const RICH_PLACEHOLDER_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;
/* Mark placeholders for display. Operates on text nodes only, so it can never
   introduce markup from document content. */
function markPlaceholders(html, labels){
  const root=_parseInert(sanitizeRich(html));
  const doc=root.ownerDocument;
  const walker=doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets=[];
  let n; while((n=walker.nextNode())) if(RICH_PLACEHOLDER_RE.test(n.nodeValue)){ RICH_PLACEHOLDER_RE.lastIndex=0; targets.push(n); }
  for(const node of targets){
    const frag=doc.createDocumentFragment();
    let last=0; const s=node.nodeValue;
    RICH_PLACEHOLDER_RE.lastIndex=0;
    let m;
    while((m=RICH_PLACEHOLDER_RE.exec(s))){
      if(m.index>last) frag.appendChild(doc.createTextNode(s.slice(last,m.index)));
      const span=doc.createElement('span');
      span.className=RICH_FIELD_CLASS;
      span.textContent=(labels&&labels[m[1]])||m[0];
      frag.appendChild(span);
      last=m.index+m[0].length;
    }
    if(last<s.length) frag.appendChild(doc.createTextNode(s.slice(last)));
    node.replaceWith(frag);
  }
  return root.innerHTML;
}
/* The inverse of markPlaceholders: unwrap the display spans, keeping their
   text. Used before a marked-up body is written back to storage, so the
   display marking never becomes part of the document. */
function unmarkPlaceholders(html){
  const root=_parseInert(sanitizeRich(html));
  root.querySelectorAll('span.'+RICH_FIELD_CLASS).forEach(sp=>{
    const t=root.ownerDocument.createTextNode(sp.textContent||'');
    sp.replaceWith(t);
  });
  return root.innerHTML;
}
/* Substitute placeholder values inside rich content. Text nodes only, again —
   a value can never inject markup. */
function fillRichBody(html, values, blank){
  const root=_parseInert(sanitizeRich(html));
  const doc=root.ownerDocument;
  const walker=doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes=[]; let n; while((n=walker.nextNode())) nodes.push(n);
  for(const node of nodes){
    if(!/\{\{/.test(node.nodeValue)) continue;
    node.nodeValue=node.nodeValue.replace(RICH_PLACEHOLDER_RE,(m,k)=>{
      const v=values&&values[k];
      return (v==null||v==='') ? (blank||'_____________') : String(v);
    });
  }
  // a placeholder marked for display is replaced by its value too
  root.querySelectorAll('span.'+RICH_FIELD_CLASS).forEach(sp=>{
    const t=sp.textContent||'';
    const m=/^\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}$/.exec(t.trim());
    if(!m) return;
    const v=values&&values[m[1]];
    sp.replaceWith(doc.createTextNode((v==null||v==='')?(blank||'_____________'):String(v)));
  });
  return root.innerHTML;
}
/* Which placeholder keys a rich body uses. */
function richPlaceholders(html){
  const t=richToText(html)+' '+String(html||'');
  const out=[]; RICH_PLACEHOLDER_RE.lastIndex=0; let m;
  while((m=RICH_PLACEHOLDER_RE.exec(t))) if(!out.includes(m[1])) out.push(m[1]);
  return out;
}

/* ---------- plain text → rich ----------
   Used when a plain-text body is opened in the rich editor. Conservative: it
   only recovers paragraph structure, and never guesses at emphasis. */
function textToRich(text){
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const blocks=String(text==null?'':text).split(/\n{2,}/);
  return blocks.map(b=>{
    const t=b.replace(/\s+$/,'');
    if(!t.trim()) return '';
    // a ruled / columnar block (fee schedule, side-by-side signatures) keeps its
    // alignment only inside a preformatted block
    const ruled=t.split('\n').some(l=>/^\s*[|+]/.test(l)||/[|+]\s*$/.test(l)||/\S\s{4,}\S/.test(l));
    if(ruled) return `<pre>${esc(t)}</pre>`;
    return `<p>${esc(t).split('\n').join('<br>')}</p>`;
  }).filter(Boolean).join('');
}

Object.assign(window,{RICH_TAGS,RICH_ATTRS,RICH_FIELD_CLASS,RICH_DROP,RICH_MAP,RICH_BLOCKS,RICH_BLOCKISH,
  RICH_FORMAT,TEXT_FORMAT,RICH_PLACEHOLDER_RE,
  sanitizeRich,docFormat,isRich,renderDocHtml,richToText,docContentText,
  canonicalRich,canonicalDocString,markPlaceholders,unmarkPlaceholders,fillRichBody,richPlaceholders,textToRich});
