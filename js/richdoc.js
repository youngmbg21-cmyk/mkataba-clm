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
   class outside the one below, no on*, no href, no colspan, and no data-*
   beyond the single one below.

   `data-clause-id` on a heading is the ONE exception, and it is here because a
   clause's identity has to live in the document rather than beside it. A
   negotiation files a change against a clause; if the clause is identified by
   its position or its number, inserting a clause above it re-points every
   change filed against it, silently. So the id is written onto the heading at
   intake, once, and never changed — which means it must survive the sanitiser,
   which runs on save AND again on render.

   It is admitted narrowly: on the block that OPENS a clause, and only for
   values matching the opaque shape this repo generates (see clauseNewId in
   js/clausemodel.js). That block is a heading in a structured contract and a
   paragraph in a flat one — an uploaded document with no headings at all still
   has clauses, and they still have to be addressable. It is never admitted on
   an inline element or a table cell, which open nothing. The value
   is never interpreted as markup, a URL or a selector — it is compared for
   equality and nothing else — but it is still validated on the way in, because
   an allowlist that admits an arbitrary attacker-chosen string into stored
   markup is a smaller allowlist than it looks. */
const RICH_CLAUSE_ATTR = 'data-clause-id';
const RICH_CLAUSE_ID_RE = /^cl_[a-z0-9]{4,24}$/;
const RICH_ATTRS = { OL:new Set(['start','type']), SPAN:new Set(['class','data-field-key']),
  H1:new Set([RICH_CLAUSE_ATTR]), H2:new Set([RICH_CLAUSE_ATTR]),
  H3:new Set([RICH_CLAUSE_ATTR]), H4:new Set([RICH_CLAUSE_ATTR]),
  P:new Set([RICH_CLAUSE_ATTR]) };
/* The single allowlisted span class: HaTi's own field-placeholder marker. */
const RICH_FIELD_CLASS = 'hati-field';
/* ---------- THE DRAFTER'S OWN MARKS (owner-asked 27-28 Aug 2026) ----------
   A contract writer needs what Word gives them: colour a phrase, highlight it,
   set a size. Until now this allowlist refused all three, because it refuses
   `style` on everything — so a colour button would have looked as though it
   worked and the colour would have gone the moment the change was filed.

   They are admitted the same way `hati-field` is and no wider: as a FIXED SET
   OF NAMED CLASSES. Nothing free-form ever reaches storage — no style, no hex,
   no arbitrary class — so a contract cannot arrive carrying a colour or a size
   this workspace did not choose, and a stored document can be re-rendered
   safely on a page HaTi does not control (the counterparty portal serves people
   outside the workspace with no login, which is why rule 1 at the top of this
   file exists).

   THE PALETTE CARRIES NO GREEN AND NO RED, and that is a safety property rather
   than a taste. On the paper green already means somebody INSERTED this and
   struck red means somebody DELETED it. A drafter able to colour a word the
   redline's own green would be writing a sentence the other side reads as
   somebody else's edit. Both are absent from RICH_MARK_INKS and RICH_MARK_HLS,
   and f249 fails on the day one is added.

   THE SIZES ARE STEPS, NOT NUMBERS. A stored size travels to the counterparty
   and into the signed PDF, so the set is closed and every member is a size a
   person actually asked for. */
const RICH_MARK_INKS = ['blue', 'violet', 'plum', 'ochre', 'grey'];
const RICH_MARK_HLS  = ['yellow', 'blue', 'violet', 'grey'];
const RICH_SIZES     = [9, 10, 11, 12, 14, 16, 18, 20, 24, 28];
const RICH_MARK_CLASSES = new Set([].concat(
  RICH_MARK_INKS.map(n => 'hati-ink-' + n),
  RICH_MARK_HLS.map(n => 'hati-hl-' + n),
  RICH_SIZES.map(n => 'hati-fs-' + n)));
/* ONE reading of "may a span carry this class", asked by the attribute pass and
   by the structural tidy-up below. Two copies of this test is how a class comes
   to survive one and be unwrapped by the other. EXACTLY ONE class, never a
   space-separated list: a span is a field, OR an ink, OR a highlight, OR a size,
   and anything wanting two is two nested spans — which keeps this test total
   rather than a parser. */
const richSpanClassOk = v => v === RICH_FIELD_CLASS || RICH_MARK_CLASSES.has(v);
/* The one data attribute a hati-field span may carry: which template-form
   field the blank belongs to, so a click on the document can route to the
   right input. Admitted under the same reasoning as data-clause-id — the
   identity has to live IN the document to survive save and render — and just
   as narrowly: only on the hati-field span, only in the machine-safe shape
   field keys take, never interpreted as markup or a selector. */
const RICH_FIELD_KEY_ATTR = 'data-field-key';
const RICH_FIELD_KEY_RE = /^[a-z][a-z0-9_]{0,63}$/;
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
  // A LIVE cursor, not a snapshot. Unwrapping hoists an element's children into
  // this very child list, and those children have not been checked yet — a
  // snapshot walk would skip straight past them and let, say, the <script>
  // inside a <font> reach storage untouched.
  let child=node.firstChild;
  const drop=c=>{ const n=c.nextSibling; c.remove(); return n; };
  while(child){
    if(child.nodeType===8){ child=drop(child); continue; }          // comments
    if(child.nodeType===3){ child=child.nextSibling; continue; }    // text
    if(child.nodeType!==1){ child=drop(child); continue; }          // CDATA, PI…

    const raw=child.tagName||'';
    // Word/Office namespaced elements (o:p, w:sdt, v:shape, m:oMath) — the tag
    // name arrives with the colon intact in HTML parsing
    if(raw.includes(':')){ child=_unwrap(child); continue; }
    const tag=raw.toUpperCase();

    if(RICH_DROP.has(tag)){ child=drop(child); continue; }

    let el=child;
    const mapped=RICH_MAP[tag];
    if(mapped){ el=_rename(child, mapped); }
    else if(RICH_TAGS.has(tag)){ /* keep as-is */ }
    else if(RICH_BLOCKISH.has(tag)){
      // a <p> cannot contain blocks, so a wrapper that holds any is unwrapped;
      // one that holds only inline content becomes the paragraph it was
      if(child.querySelector && child.querySelector(_BLOCK_SEL)){ child=_unwrap(child); continue; }
      if(!(child.textContent||'').trim()){ child=drop(child); continue; }
      el=_rename(child,'P');
    }
    else { child=_unwrap(child); continue; }

    _stripAttrs(el);
    _sanitizeNode(el);
    child=el.nextSibling;
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
/* Remove an element but keep its children in place. Returns the node the walk
   must resume at — the first hoisted child, which still needs checking. */
function _unwrap(el){
  const parent=el.parentNode; if(!parent){ const n=el.nextSibling; el.remove(); return n; }
  const first=el.firstChild;
  while(el.firstChild) parent.insertBefore(el.firstChild, el);
  const next=el.nextSibling;
  el.remove();
  return first || next;
}
function _stripAttrs(el){
  const allowed=RICH_ATTRS[el.tagName]||null;
  for(const attr of Array.from(el.attributes||[])){
    const name=(attr.name||'').toLowerCase();
    if(!allowed || !allowed.has(name)){ el.removeAttribute(attr.name); continue; }
    if(el.tagName==='SPAN' && name==='class'){
      // exactly one class, and it must be on the list — see RICH_MARK_CLASSES
      if(!richSpanClassOk(String(attr.value||'').trim())) el.removeAttribute(attr.name);
      continue;
    }
    if(el.tagName==='SPAN' && name===RICH_FIELD_KEY_ATTR){
      // only on the hati-field span, and only a machine-safe field key
      if(String(el.getAttribute('class')||'').trim()!==RICH_FIELD_CLASS
        || !RICH_FIELD_KEY_RE.test(String(attr.value||''))) el.removeAttribute(attr.name);
      continue;
    }
    if(name===RICH_CLAUSE_ATTR){
      // only the opaque shape this repo issues; anything else is dropped
      if(!RICH_CLAUSE_ID_RE.test(String(attr.value||''))) el.removeAttribute(attr.name);
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
  // A list nested DIRECTLY inside a list, with no <li> around it, is legal to
  // write and impossible to read: the text projection walks a list's <li>
  // children, so a stray inner list — and everything in it — is skipped
  // silently. Content vanishing from the projection is the worst kind of bug
  // here, because the projection is what the diff compares, the Copilot reads,
  // search matches and the seal hashes. Move it inside the preceding item.
  root.querySelectorAll('ul>ul, ul>ol, ol>ul, ol>ol').forEach(inner=>{
    const parent=inner.parentElement; if(!parent) return;
    let host=inner.previousElementSibling;
    while(host && host.tagName!=='LI') host=host.previousElementSibling;
    if(!host){ host=parent.ownerDocument.createElement('li'); parent.insertBefore(host, inner); }
    host.appendChild(inner);
  });
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
  // A <span> is only ever allowed to carry HaTi's own field marker. One that
  // does not is a leftover from whatever produced the fragment — it survived
  // the walk only because SPAN is on the tag list — and unwrapping it here
  // keeps its text while leaving nothing behind to style or to hang meaning on.
  root.querySelectorAll('span').forEach(sp=>{
    if(richSpanClassOk(String(sp.getAttribute('class')||'').trim())) return;
    const parent=sp.parentNode; if(!parent) return;
    while(sp.firstChild) parent.insertBefore(sp.firstChild, sp);
    sp.remove();
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
   The unit the diff, the Copilot features, search and (for plain documents) the seal
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
        // A DECIMAL sub-list continues its parent's numbering — 2 → 2.1 → 2.1.3
        // — because that is how a legal document numbers its clauses. A sub-list
        // the author set as (a)/(i) does NOT: the document shows "a.", so the
        // projection must say "a." too, or the diff and the model would be
        // reading numbers nobody can find in the paper.
        const dotted = tag==='OL' && !['a','A','i','I'].includes(ch.getAttribute('type')||'');
        let i=0;
        for(const li of Array.from(ch.children)){
          if(li.tagName!=='LI') continue;
          const mark = tag==='OL' ? marker(ch, i) : '•';
          const next = (tag==='OL' && dotted) ? path.concat([mark]) : [];
          buf += (tag==='OL' ? (dotted ? next.join('.')+'. ' : mark+'. ') : '• ');
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
/* ---------- putting edited text BACK into a formatted document ----------
   A counterparty edits in a plain-text box (and a Word round trip returns
   plain text too), so what comes back is text. Adopting it used to overwrite
   the body with that text and mark the document 'text' — the headings, the
   clause numbering and the tables were gone, permanently, at the first round
   of every negotiation. By round four the other side is editing a wall of
   plain prose and may reasonably doubt it is the same instrument.

   The way back in is the LINE. richToText emits one line per block — a
   paragraph, a heading, a list item — so the same walk, recording which node
   produced each line, gives a map from the text the counterparty edited to the
   elements that produced it. Diff the old lines against the new ones and the
   changes land on the nodes that own them: an edited line rewrites that
   block's text and keeps the block, an inserted line becomes a new paragraph
   beside its neighbour, a deleted line takes its block with it. Everything
   nobody touched — including its inline emphasis — is not rewritten at all.

   Two honesty rules govern it, because a contract is not a place for a clever
   guess that might be wrong:

     · A line that changed loses the INLINE marks inside that one line (bold,
       italics) unless the whole line sits in a single text node. The text is
       what was agreed; the emphasis on a rewritten sentence is not something
       we can honestly reconstruct from a plain-text edit.
     · The result is VERIFIED before it is returned: its own text projection
       must match the text that was agreed. If it does not, the merge is
       abandoned and the caller falls back to plain text. A structurally
       plausible document that does not say what the parties agreed would be
       far worse than a plain one that does. */
function _lineUnits(root){
  const units=[];
  let cur=null;
  const open=(node,prefix)=>{ cur={ node, prefix:prefix||'', text:'' }; };
  const flush=()=>{
    if(!cur) return;
    const t=cur.text.replace(/[ \t]+/g,' ').trim();
    if(t) units.push({ node:cur.node, prefix:cur.prefix, text:t, line:cur.prefix+t });
    cur=null;
  };
  const marker=(ol,index)=>{
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
  (function walk(node, path, owner){
    for(const ch of Array.from(node.childNodes)){
      if(ch.nodeType===3){ if(cur) cur.text+=ch.nodeValue.replace(/\s+/g,' '); continue; }
      if(ch.nodeType!==1) continue;
      const tag=ch.tagName;
      if(tag==='BR'){ flush(); open(owner,''); continue; }
      if(tag==='OL'||tag==='UL'){
        flush();
        const dotted = tag==='OL' && !['a','A','i','I'].includes(ch.getAttribute('type')||'');
        let i=0;
        for(const li of Array.from(ch.children)){
          if(li.tagName!=='LI') continue;
          const mark = tag==='OL' ? marker(ch,i) : '•';
          const next = (tag==='OL' && dotted) ? path.concat([mark]) : [];
          open(li, tag==='OL' ? (dotted ? next.join('.')+'. ' : mark+'. ') : '• ');
          walk(li, next, li);
          flush();
          i++;
        }
        continue;
      }
      // a PRE or a TABLE is left alone entirely: its text projection is not a
      // simple line-per-block, so a line edit cannot be placed inside it safely
      if(tag==='PRE'||tag==='TABLE'){ flush(); units.push({ node:ch, prefix:'', text:null, line:null, opaque:true }); continue; }
      if(RICH_BLOCKS.has(tag)){ flush(); open(ch,''); walk(ch, path, ch); flush(); continue; }
      walk(ch, path, owner);
    }
  })(root, [], root);
  flush();
  return units;
}
/* Merge edited plain text back into a rich body. Returns the new HTML, or null
   when the result cannot be verified — the caller then keeps the plain text. */
/* The lines one opaque block projects to, read the same way every other
   surface reads it — richToText, never a second projection. */
function _richBlockLines(node){
  return richToText(node.outerHTML).split('\n')
    .map(l => l.replace(/[ \t]+/g,' ').trim()).filter(l => l);
}
function _richEditAroundBlocks(root, units, newText){
  const doc = root.ownerDocument;
  const blocks = units.filter(u => u.opaque).map(u => u.node);
  /* Only a block sitting directly in the body can be split around: one nested
     inside a list item or a quote has no segment boundary to cut on. */
  if(blocks.some(b => b.parentNode !== root)) return null;
  const newLines = String(newText==null?'':newText).split('\n')
    .map(l => l.replace(/[ \t]+/g,' ').trim()).filter(l => l);
  /* Where each block's own lines sit in what came back. In order, and each
     run whole — a table half-quoted is not a table we can keep. */
  const at = [];
  let from = 0;
  for(const b of blocks){
    const want = _richBlockLines(b);
    if(!want.length) return null;
    let found = -1;
    for(let i = from; i + want.length <= newLines.length; i++){
      let ok = true;
      for(let k = 0; k < want.length; k++) if(newLines[i+k] !== want[k]){ ok = false; break; }
      if(ok){ found = i; break; }
    }
    if(found < 0) return null;
    at.push({ node: b, at: found, len: want.length });
    from = found + want.length;
  }
  /* The document as alternating segments: wording, block, wording, block …
     Each wording segment is merged by the ordinary reading; an empty one
     stays empty rather than inventing a paragraph. */
  const kids = Array.from(root.childNodes);
  const out = [];
  let kidFrom = 0, lineFrom = 0;
  for(const b of at){
    const cut = kids.indexOf(b.node);
    const seg = kids.slice(kidFrom, cut).map(n => n.nodeType===1 ? n.outerHTML : '').join('');
    const segText = newLines.slice(lineFrom, b.at).join('\n');
    if(seg.trim() || segText.trim()){
      if(!seg.trim()) return null;              // wording arrived where the document has none
      const merged = segText.trim() ? richFromTextEdit(seg, segText) : '';
      if(merged == null) return null;
      out.push(merged);
    }
    out.push(b.node.outerHTML);
    kidFrom = cut + 1;
    lineFrom = b.at + b.len;
  }
  const tailHtml = kids.slice(kidFrom).map(n => n.nodeType===1 ? n.outerHTML : '').join('');
  const tailText = newLines.slice(lineFrom).join('\n');
  if(tailHtml.trim() || tailText.trim()){
    if(!tailHtml.trim()) return null;
    const merged = tailText.trim() ? richFromTextEdit(tailHtml, tailText) : '';
    if(merged == null) return null;
    out.push(merged);
  }
  const html = out.join('');
  return html.trim() ? sanitizeRich(html) : null;
}

function richFromTextEdit(html, newText){
  let root;
  try{ root=_parseInert(sanitizeRich(html)); }catch(e){ return null; }
  const units=_lineUnits(root);
  /* A TABLE IS NOT REWRITTEN, AND IT IS NOT THROWN AWAY EITHER.
     This returned null on any opaque block and left the whole clause to the
     caller's plain-text fallback — which rebuilds it as one <p> per line, so a
     rate card was destroyed by an honest edit made three paragraphs above it.
     The block is an ANCHOR instead: its own projected lines must come back
     unchanged and in order, the wording around it takes the edit, and the
     block itself is re-emitted verbatim. Where the anchor cannot be found the
     answer is still null — an edit inside a table is one this cannot place,
     and refusing is what it has always done. */
  if(units.some(u=>u.opaque)) return _richEditAroundBlocks(root, units, newText);
  if(!units.length) return null;
  const oldLines=units.map(u=>u.line);
  const newLines=String(newText==null?'':newText).split('\n').map(l=>l.replace(/[ \t]+/g,' ').trim()).filter(l=>l);
  if(!newLines.length) return null;

  // LCS over lines: the same shape as wordDiff, one line at a time
  const n=oldLines.length, m=newLines.length;
  const dp=Array.from({length:n+1},()=>new Uint32Array(m+1));
  for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--)
    dp[i][j]= oldLines[i]===newLines[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);

  const doc=root.ownerDocument;
  const setText=(unit,line)=>{
    // strip the reconstructed marker: list numbering is regenerated from the
    // list itself, so writing it into the text would double it
    let t=line;
    if(unit.prefix && t.startsWith(unit.prefix)) t=t.slice(unit.prefix.length);
    else if(unit.prefix) t=t.replace(/^\s*(?:[0-9]+(?:\.[0-9]+)*\.?|[a-zA-Z]+\.|•)\s+/,'');
    const el=unit.node;
    const texts=[];
    const w=doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let x; while((x=w.nextNode())) texts.push(x);
    if(texts.length===1){ texts[0].nodeValue=t; return; }      // emphasis outside this line survives
    while(el.firstChild) el.removeChild(el.firstChild);        // mixed inline marks: the text is what was agreed
    el.appendChild(doc.createTextNode(t));
  };
  /* Where a new line goes. After a list item there are two possibilities and
     they are not interchangeable: a line that opens with a clause marker is a
     new ITEM in that list (and the marker comes off, because the list
     regenerates it); anything else is a PARAGRAPH after the list, not a
     silently-numbered new clause. Guessing wrong would invent a clause number
     that nobody wrote — the verification at the end catches it either way, but
     getting it right here is what keeps the common case working. */
  const MARKER=/^\s*(?:[0-9]+(?:\.[0-9]+)*\.?|[a-zA-Z]\.|•)\s+/;
  const insertAfter=(unit,line)=>{
    const ref=unit?unit.node:null;
    const inList=!!(ref&&ref.tagName==='LI');
    const asItem=inList&&MARKER.test(line);
    const el=doc.createElement(asItem?'LI':'P');
    el.appendChild(doc.createTextNode(asItem?line.replace(MARKER,''):line));
    if(inList&&!asItem){
      const list=ref.parentNode;                       // put it after the whole list
      if(list&&list.parentNode) list.parentNode.insertBefore(el, list.nextSibling);
      else root.appendChild(el);
    } else if(ref&&ref.parentNode){
      ref.parentNode.insertBefore(el, ref.nextSibling);
    } else root.appendChild(el);
    return { node:el, prefix:'', text:line, line };
  };

  const removals=[];
  let i=0,j=0,last=null;
  while(i<n && j<m){
    if(oldLines[i]===newLines[j]){ last=units[i]; i++; j++; continue; }
    if(dp[i+1][j]>=dp[i][j+1]){
      // this old line is gone — unless the next new line is a rewrite of it,
      // in which case the block stays and its text changes
      if(j<m && dp[i+1][j+1]>=dp[i+1][j] && dp[i+1][j+1]>=dp[i][j+1]){
        setText(units[i], newLines[j]); last=units[i]; i++; j++; continue;
      }
      removals.push(units[i]); i++; continue;
    }
    last=insertAfter(last, newLines[j]); j++;
  }
  while(i<n){ removals.push(units[i]); i++; }
  while(j<m){ last=insertAfter(last, newLines[j]); j++; }
  for(const u of removals){ if(u.node&&u.node.parentNode) u.node.parentNode.removeChild(u.node); }
  // drop lists and blocks emptied by the removals
  Array.from(root.querySelectorAll('ol,ul')).forEach(l=>{ if(!l.querySelector('li')) l.remove(); });

  const out=sanitizeRich(root.innerHTML);
  // THE VERIFICATION. What the parties agreed is the text; if the rebuilt
  // document does not say exactly that, it is not the document.
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  if(norm(richToText(out))!==norm(newText)) return null;
  return out;
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

/* ============================================================================
   THE WRITING BAR — one builder, two shelves (owner-asked 27-28 Aug 2026)
   ----------------------------------------------------------------------------
   IT LIVES HERE, BESIDE THE ALLOWLIST, ON PURPOSE. A bar offering something the
   allowlist strips is a dead press — the reader formats a word, files the
   change, and the formatting is gone with no error anywhere. Keeping the shelf
   and the rule in one file is what stops the two drifting; every colour and
   size this bar offers is read straight off RICH_MARK_* above.

   TWO SHELVES, ONE DEFINITION. 'compact' is what the clause panel's inline
   editor has always drawn; 'full' is the Word-style bar work mode gets. They
   are one list with a flag, never two lists that agree today.

   IT DECIDES NOTHING AND STORES NOTHING. richBarHtml returns markup and
   richBarPress performs an act on the current selection; whether a change is
   filed, and through which funnel, belongs to the host. That is what keeps this
   out of the second-door problem: the bar is a set of hands, not a way in.
   ========================================================================== */
const RICH_BAR_ICON = {
  ul:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><circle cx="3" cy="4" r="1.1" fill="currentColor" stroke="none"/><circle cx="3" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1.1" fill="currentColor" stroke="none"/><path d="M6.5 4h7M6.5 8h7M6.5 12h7"/></svg>',
  ol:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M6.5 4h7M6.5 8h7M6.5 12h7"/><text x="0.6" y="5.6" font-size="5" fill="currentColor" stroke="none">1</text><text x="0.6" y="9.6" font-size="5" fill="currentColor" stroke="none">2</text><text x="0.6" y="13.6" font-size="5" fill="currentColor" stroke="none">3</text></svg>',
  indent:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h7M7 8h7M7 12h7M2 4v8M2.2 6l2 2-2 2"/></svg>',
  outdent:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h7M7 8h7M7 12h7M2 4v8M4.2 6l-2 2 2 2"/></svg>',
  clear:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M4 3h8M7.4 3 6 13M10.5 9.5l3 3M13.5 9.5l-3 3"/></svg>',
  pen:'<svg width="15" height="12" viewBox="0 0 16 13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><path d="M9.5 1.5 12 4 5.5 10.5H3V8Z"/></svg>',
  undo:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h7a3.5 3.5 0 0 1 0 7H7M3 7l3-3M3 7l3 3"/></svg>',
  redo:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M13 7H6a3.5 3.5 0 0 0 0 7h3M13 7l-3-3M13 7l-3 3"/></svg>',
  quote:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M2.5 3v10M6 5h7.5M6 8h7.5M6 11h5"/></svg>'
};
/* full:0 marks the five the compact shelf also carries. Nothing is taken away
   from the panel's bar by this; it gains the same definitions. */
const RICH_BAR_TOOLS = [
  { k:'undo', full:1, icon:'undo', tip:'rb_undo' },
  { k:'redo', full:1, icon:'redo', tip:'rb_redo' },
  { sep:1, full:1 },
  { size:1, full:1 },
  { sep:1, full:1 },
  { k:'bold',          glyph:'<b>B</b>',  tip:'rb_bold' },
  { k:'italic',        glyph:'<i>I</i>',  tip:'rb_italic' },
  { k:'underline',     glyph:'<u>U</u>',  tip:'rb_underline' },
  { k:'strikeThrough', glyph:'<s>S</s>',  tip:'rb_strike', full:1 },
  { sep:1 },
  { k:'insertUnorderedList', icon:'ul', tip:'rb_bullets' },
  { k:'insertOrderedList',   icon:'ol', tip:'rb_numbers' },
  { k:'indent',  icon:'indent',  tip:'rb_indent',  full:1 },
  { k:'outdent', icon:'outdent', tip:'rb_outdent', full:1 },
  { sep:1, full:1 },
  { k:'ink', wide:1, full:1, tip:'rb_ink' },
  { k:'hl',  wide:1, full:1, tip:'rb_highlight' },
  { sep:1, full:1 },
  { k:'quote', icon:'quote', tip:'rb_quote', full:1 },
  { k:'clear', icon:'clear', tip:'rb_clear', full:1 }
];
const _rbT = k => (typeof window !== 'undefined' && window.i18t) ? i18t(k) : k;
const _rbA = s => String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
/* The first ink and the first highlight are what the two swatch buttons show
   before anything has been picked — read off the palette, never typed twice. */
const richMarkDefault = kind => kind === 'hl'
  ? 'hati-hl-' + RICH_MARK_HLS[0] : 'hati-ink-' + RICH_MARK_INKS[0];

function richBarHtml(opts){
  const o = opts || {};
  const full = o.shelf !== 'compact';
  const size = Number(o.size) || 14;
  const cls = o.cls || 'rb';
  const out = [];
  RICH_BAR_TOOLS.forEach(it => {
    if (!full && it.full) return;
    if (it.sep){ out.push(`<span class="${cls}-sep"></span>`); return; }
    if (it.size){
      out.push(`<button type="button" class="${cls}-size" data-rb-size-open="1"`
        + ` title="${_rbA(_rbT('rb_size'))}" aria-label="${_rbA(_rbT('rb_size'))}" tabindex="-1">`
        + `<span class="${cls}-size-v" data-rb-size-val>${_rbA(String(size))}</span>`
        + `<span class="${cls}-car">&#9662;</span></button>`);
      return;
    }
    const tip = _rbA(_rbT(it.tip));
    if (it.k === 'ink' || it.k === 'hl'){
      const swatch = it.k === 'hl' ? RICH_BAR_ICON.pen
        : '<span class="' + cls + '-a">A</span>';
      out.push(`<button type="button" class="${cls}-btn ${cls}-wide" data-rb-pick="${it.k}"`
        + ` title="${tip}" aria-label="${tip}" tabindex="-1">${swatch}`
        + `<span class="${cls}-sw ${richMarkDefault(it.k)}" data-rb-sw="${it.k}"></span>`
        + `<span class="${cls}-car">&#9662;</span></button>`);
      return;
    }
    const face = it.glyph || RICH_BAR_ICON[it.icon] || '';
    out.push(`<button type="button" class="${cls}-btn" data-rb="${it.k}"`
      + ` title="${tip}" aria-label="${tip}" tabindex="-1">${face}</button>`);
  });
  return out.join('');
}

/* The acts this bar performs itself. Anything not here — undo, redo — belongs
   to the host, because what "step back" means differs between an editor with a
   draft stack and one without. Returns false when it did not handle the key,
   so a host can tell the difference rather than guess. */
function richBarPress(k){
  if (k === 'clear'){
    try{ document.execCommand('removeFormat'); }catch(e){}
    return true;
  }
  if (k === 'quote'){
    try{ document.execCommand('formatBlock', false, 'blockquote'); }catch(e){}
    return true;
  }
  if (k === 'bold' || k === 'italic' || k === 'underline' || k === 'strikeThrough'
    || k === 'insertUnorderedList' || k === 'insertOrderedList'
    || k === 'indent' || k === 'outdent'){
    /* An engine without execCommand still has the keyboard — the same fallback
       the panel's bar has carried since it was written. */
    try{ document.execCommand(k); }catch(e){}
    return true;
  }
  return false;
}

/* A NAMED CLASS, NEVER A STYLE ATTRIBUTE. This is the only way a colour or a
   size reaches a stored body, which is what makes the allowlist above a
   complete description of what a contract can carry.

   surroundContents throws where the range crosses an element boundary — half a
   bold run, say — so the fallback extracts and re-inserts, which handles it. */
function richMarkSelection(cls, opts){
  if (!cls || !RICH_MARK_CLASSES.has(cls)) return false;
  const sel = (opts && opts.sel) || (typeof window !== 'undefined' && window.getSelection());
  if (!sel || !sel.rangeCount || sel.isCollapsed) return false;
  const r = sel.getRangeAt(0);
  const span = r.startContainer.ownerDocument.createElement('span');
  span.className = cls;
  try{ r.surroundContents(span); }
  catch(e){ span.appendChild(r.extractContents()); r.insertNode(span); }
  /* A size inside a size, or an ink inside an ink, leaves the inner one winning
     over the choice just made. Same family only: a highlight inside a colour is
     two different facts and both stand. */
  const family = cls.slice(0, cls.lastIndexOf('-') + 1);
  Array.from(span.querySelectorAll('span[class^="' + family + '"]')).forEach(sp => {
    const p = sp.parentNode; if (!p) return;
    while (sp.firstChild) p.insertBefore(sp.firstChild, sp);
    sp.remove();
  });
  sel.removeAllRanges();
  return true;
}

/* Take the drafter's marks off a region — the Remove row under each picker.
   `kind` narrows it to one family; absent, every mark goes. Sizes are left
   alone by default: a reader clearing a colour has not asked for the wording to
   change size under them. */
function richUnmark(root, kind){
  if (!root || !root.querySelectorAll) return 0;
  const pre = kind === 'ink' ? 'hati-ink-' : kind === 'hl' ? 'hati-hl-'
    : kind === 'size' ? 'hati-fs-' : null;
  const sel = pre ? 'span[class^="' + pre + '"]'
    : 'span[class^="hati-ink-"], span[class^="hati-hl-"]';
  const found = Array.from(root.querySelectorAll(sel));
  found.forEach(sp => {
    const p = sp.parentNode; if (!p) return;
    while (sp.firstChild) p.insertBefore(sp.firstChild, sp);
    sp.remove();
  });
  return found.length;
}

/* What size is the selection sitting in? Walks up for the nearest stored size
   and falls back to the block's own default, so the box on the bar reads what
   the caret is actually in rather than what was last pressed. */
function richSizeAt(node, fallback){
  let el = node && (node.nodeType === 1 ? node : node.parentElement);
  while (el && el.classList){
    const hit = Array.from(el.classList).find(c => /^hati-fs-\d+$/.test(c));
    if (hit) return Number(hit.slice('hati-fs-'.length));
    if (el.hasAttribute && el.hasAttribute('data-nego-editor')) break;
    el = el.parentElement;
  }
  return Number(fallback) || 14;
}

Object.assign(window,{RICH_TAGS,
  RICH_BAR_TOOLS,RICH_BAR_ICON,richBarHtml,richBarPress,richMarkSelection,richUnmark,
  richSizeAt,richMarkDefault,RICH_ATTRS,RICH_FIELD_CLASS,RICH_DROP,RICH_MAP,RICH_BLOCKS,RICH_BLOCKISH,
  RICH_MARK_INKS,RICH_MARK_HLS,RICH_SIZES,RICH_MARK_CLASSES,richSpanClassOk,
  RICH_CLAUSE_ATTR,RICH_CLAUSE_ID_RE,
  RICH_FORMAT,TEXT_FORMAT,RICH_PLACEHOLDER_RE,
  sanitizeRich,docFormat,isRich,renderDocHtml,richToText,docContentText,
  canonicalRich,canonicalDocString,richFromTextEdit,markPlaceholders,unmarkPlaceholders,fillRichBody,richPlaceholders,textToRich});
