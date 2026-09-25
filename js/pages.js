/* ============================================================
   THE PAGE-MAKER — a contract drawn as pages
   ============================================================
   (Young ruled 25 Sep 2026, over the design "HaTi — Working copy and signing
   copy": "When a contract goes to the document page, the negotiation page as
   well, it should look like its on Microsoft Word waiting to be edited. But
   when you go to the signing page it should look exactly like how it was
   designed." Built with the owner's picks 1A 2B 3A 4A 5A 6A.)

   TWO COPIES OF ONE CONTRACT, ONE MECHANISM UNDER BOTH.
     The WORKING copy (the Document tab, the Negotiate page, the other side's
     negotiating link) is white pages on the grey desk, a gap between pages,
     Word's corner marks, the letterhead FADED to one line in the top margin
     and the page number faded in the foot.
     The SIGNING copy (the Signing tab, and every tab once the contract is
     signed) is the company's design at full strength on fixed A4 pages, with
     the design's own footer and "Page 2 of 6" on every page.

   IT DOES NOT TOUCH THE DOCUMENT'S SHAPE, and that is the whole design of it.
   The sheet stays ONE element holding exactly the markup it always held. A
   block that would cross from one page into the next is moved down by giving
   it more margin-top, and a layer drawn OVER the sheet paints the grey gap
   between two pages, the corner marks and each page's faded head and foot.
   No element is inserted into the wording and none is moved to another
   parent — which is why every reading that walks the painted page (Plain
   English, X-ray, the sign spots, the notes' markers, a highlight, the field
   link) goes on finding exactly what it found. The layer's words are CSS
   generated content (attr()), so no Range, copy or textContent ever reads
   "Page 1 of 6" as wording.

   NOTHING IS EVER HIDDEN. The gap band is drawn over the sheet, so anything
   crossing it is cut — a changed clause's ruby bar, a selection — exactly as
   Word cuts them. WORDING never crosses it: a block that cannot fit on a page
   of its own (a table longer than a page, one enormous paragraph) GROWS its
   page instead of being cut, so the page is taller than A4 and every line of
   it is still on the paper.

   THE PLANNER IS PURE (pagesPlan) and has no DOM, so node can test it; the
   rest measures a real page. */

/* ---------- the numbers, said once ---------- */
const PG_A4 = 297 / 210;            // a page's height over its width
const PG_GAP = 20;                  // the grey between two pages on screen
const PG_SIGN_W = 794;              // the signing copy's page: A4 at 96 px to the inch
const PG_SIGN_H = 1122.5;           // ... 297 mm, not rounded (1123 drifts half a pixel a page)
const PG_SIGN_PAD = { t: 64, r: 84, b: 88, l: 84 };   // its margins, ~17 / 22 / 23 mm
const PG_HEAD_KEEP = 44;            // a heading keeps at least this much of what follows
const PG_BAND_BLEED = 32;           // the gap band reaches past the sheet to cover its shadow
const PG_FUZZ = 0.75;               // sub-pixel slack in every comparison
const PG_WATCH_MS = 90;             // a change settles before the pages are re-broken
const PG_CORNER = 14;               // Word's corner mark

/* An element that is ONE thing on a page: it moves whole or not at all. */
const PG_KEEP_SEL = 'table,pre,.doc-pre,img,figure,svg,hr,header.rl-paper-head,.rl-paper-foot,.seal-in,.sig-spot,[data-anchor="sig"],[data-doc-design],[data-pg-keep],.rl-clause-top,.rl-front-top,.field-block';
/* A heading keeps company with the first lines under it. */
const PG_HEAD_SEL = 'h1,h2,h3,h4,h5,h6,.rl-clause-h,.doc-t-h,.rl-clause-top,.rl-paper-title';
const PG_BLOCK = /^(block|list-item|table|flow-root|flex|grid)$/;

/* ============================================================
   THE PLANNER — pure. atoms: [{top, h, head, before, after}] measured with
   no pushes applied, in sheet coordinates (0 = the sheet's top edge).
   g: {pageH, gap, mTop, mBot}. Answers {push, pages, total}:
     push[i]  how many pixels atom i moves down
     pages    [{top, h}] — a page's top on the sheet and its height (h > pageH
              only where a block too tall for any page grew it)
     total    the sheet's full height, down to the last page's bottom edge
   ============================================================ */
function pagesPlan(atoms, g){
  const H = Math.max(1, Number(g && g.pageH) || 1);
  const G = Math.max(0, Number(g && g.gap) || 0);
  const mT = Math.max(0, Number(g && g.mTop) || 0);
  const mB = Math.max(0, Number(g && g.mBot) || 0);
  const list = Array.isArray(atoms) ? atoms : [];
  const push = list.map(() => 0);
  const pages = [{ top: 0, h: H }];
  let pg = pages[0];
  let shift = 0;
  let breakNext = false;
  const limit = () => pg.top + pg.h - mB;
  const contentTop = () => pg.top + mT;
  const next = () => { pg = { top: pg.top + pg.h + G, h: H }; pages.push(pg); return pg.top + mT; };
  for(let i = 0; i < list.length; i++){
    const a = list[i] || {};
    const h = Math.max(0, Number(a.h) || 0);
    let top = (Number(a.top) || 0) + shift;
    let bot = top + h;
    const atTop = () => top <= contentTop() + PG_FUZZ;
    /* A BREAK THE DOCUMENT ASKED FOR — Word's page break, a contents page —
       starts a page unless the block is already at the top of one. */
    if((a.before || breakNext) && i > 0 && !atTop()){
      const p = next() - top; push[i] += p; shift += p; top += p; bot += p;
    }
    breakNext = !!a.after;
    if(h < PG_FUZZ){
      /* nothing to draw — but it may still not sit in the grey */
      if(top > limit() + PG_FUZZ){ const p = next() - top; push[i] += p; shift += p; }
      continue;
    }
    /* A HEADING NEVER ENDS A PAGE ALONE. A block is never split, so what
       follows it moves WHOLE if it does not fit — the heading therefore needs
       room for the whole of it, unless that block is too tall for any page,
       when the first lines of it are enough (the page it lands on grows). */
    let need = bot;
    if(a.head && i + 1 < list.length){
      const n = list[i + 1] || {};
      const nh = Math.max(0, Number(n.h) || 0);
      const gapTo = Math.max(0, (Number(n.top) || 0) - ((Number(a.top) || 0) + h));
      need = bot + gapTo + (nh <= H - mT - mB ? nh : Math.min(nh, PG_HEAD_KEEP));
    }
    if(need <= limit() + PG_FUZZ) continue;
    if(atTop()){
      /* TOO TALL FOR ANY PAGE, and already at the top of this one: the page
         grows to hold it rather than cut a line of it. */
      if(bot > limit()) pg.h = bot + mB - pg.top;
      continue;
    }
    const p = next() - top; push[i] += p; shift += p; top += p; bot += p;
    if(bot > limit()) pg.h = bot + mB - pg.top;
  }
  const last = pages[pages.length - 1];
  return { push, pages, total: last.top + last.h };
}

/* ============================================================
   THE DOM HALF
   ============================================================ */
function _pgBlockKids(el){
  /* True where this element holds blocks and NOTHING inline beside them — the
     only shape whose children can be moved one by one. A container mixing a
     sentence with a list is one thing on the page. */
  let block = 0;
  for(const n of el.childNodes){
    if(n.nodeType === 3){ if(/\S/.test(n.nodeValue || '')) return false; continue; }
    if(n.nodeType !== 1) continue;
    if(n.hasAttribute && n.hasAttribute('data-pg-layer')) continue;
    let cs;
    try{ cs = getComputedStyle(n); }catch(_){ return false; }
    if(cs.display === 'none') continue;
    if(cs.position === 'absolute' || cs.position === 'fixed') continue;
    if(cs.float && cs.float !== 'none') return false;
    if(cs.display === 'contents'){ if(!_pgBlockKids(n)) return false; block++; continue; }
    if(!PG_BLOCK.test(cs.display)){
      /* an inline element with nothing in it (a stray <br>, an empty span) is
         not wording; anything else makes this a paragraph */
      if(n.tagName === 'BR' || !/\S/.test(n.textContent || '')) continue;
      return false;
    }
    block++;
  }
  return block > 0;
}
function _pgMatches(el, sel){ try{ return !!(el.matches && el.matches(sel)); }catch(_){ return false; } }
function pagesAtoms(root){
  const out = [];
  if(!root) return out;
  const visit = parent => {
    for(const el of Array.from(parent.children)){
      if(el.hasAttribute('data-pg-layer')) continue;
      let cs;
      try{ cs = getComputedStyle(el); }catch(_){ continue; }
      if(cs.display === 'none') continue;
      if(cs.position === 'absolute' || cs.position === 'fixed') continue;
      if(cs.float && cs.float !== 'none') continue;
      if(cs.display === 'contents'){ visit(el); continue; }
      if(!PG_BLOCK.test(cs.display)) continue;
      const keep = _pgMatches(el, PG_KEEP_SEL) || cs.display === 'flex' || cs.display === 'grid'
        || cs.display === 'table';
      if(!keep && _pgBlockKids(el)){ visit(el); continue; }
      /* A ROW THAT CARRIES A HEADING IS A HEADING — a clause title drawn
         in a flex row beside its tag, the Negotiate page's title row beside
         its pencil. Short, or it is a clause that happens to open with one. */
      const head = _pgMatches(el, PG_HEAD_SEL) || (!!el.querySelector('h1,h2,h3,h4,h5,h6,.rl-clause-h')
        && String(el.textContent || '').length < 240);
      out.push({ el, head,
        before: cs.breakBefore === 'page' || cs.pageBreakBefore === 'always' || el.classList.contains('hati-pb'),
        after: cs.breakAfter === 'page' || cs.pageBreakAfter === 'always' });
    }
  };
  visit(root);
  return out;
}

/* Take every push off, putting each margin back exactly as it was written. */
function pagesClear(sheet){
  if(!sheet) return;
  sheet.querySelectorAll('[data-pg-push]').forEach(el => {
    const was = el.getAttribute('data-pg-mt');
    el.style.marginTop = was || '';
    el.removeAttribute('data-pg-push');
    el.removeAttribute('data-pg-mt');
    el.removeAttribute('data-pg-brk');
  });
  sheet.style.removeProperty('--pg-extra');
  sheet.querySelectorAll(':scope > [data-pg-layer]').forEach(n => n.remove());
}

/* The desk the sheet lies on, read off the page itself so the gap is painted
   in exactly its colour on every screen and in both themes. */
function _pgDeskColour(sheet){
  for(let n = sheet && sheet.parentElement; n; n = n.parentElement){
    let bg = '';
    try{ bg = getComputedStyle(n).backgroundColor; }catch(_){ bg = ''; }
    if(bg && bg !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(bg)) return bg;
  }
  return 'var(--color-bg)';
}

const _pgAttr = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/* "Page 2 of 6", in the reader's language. */
function pagesNumberLabel(n, m){
  const t = (typeof window !== 'undefined' && window.i18t) ? window.i18t('pg_page_of', { n, m }) : '';
  return (t && t !== 'pg_page_of') ? t : `Page ${n} of ${m}`;
}

/* ONE PAGE'S FURNITURE — its frame, its corner marks, its head and its foot —
   placed against `top`, the page's top edge in the coordinates of whatever
   holds it: the long sheet's layer on screen, or the page's own box when it
   is printed. One builder, so the page that prints wears exactly what the
   page on screen wore. */
function _pgFurniture(o, k, n, top, h, d){
  const parts = [];
  const pw = d.W - d.bl - d.br;                    // the padding box
  const cTop = top + d.mT, cBot = top + h - d.mB;
  /* A DESIGN THAT RULES ITS PAGE (Formal Legal's double rule) rules EVERY
     page, not one border round the whole long sheet. */
  if(o.frame) parts.push(`<div class="pg-frame" style="left:${-d.bl}px;width:${d.W}px;top:${top}px;height:${h}px;${_pgAttr(o.frame)}"></div>`);
  if(o.corners){
    const c = (x, y, cls) => `<i class="pg-corner ${cls}" style="left:${x}px;top:${y}px"></i>`;
    parts.push(c(d.pL - PG_CORNER, cTop - PG_CORNER, 'tl'), c(pw - d.pR, cTop - PG_CORNER, 'tr'),
      c(d.pL - PG_CORNER, cBot, 'bl'), c(pw - d.pR, cBot, 'br'));
  }
  const label = pagesNumberLabel(k + 1, n);
  if(o.mode === 'sign'){
    if((k > 0 || o.runningFirst) && o.running) parts.push(`<div class="pg-run" style="left:${d.pL}px;right:${d.pR}px;top:${top + Math.max(10, Math.round(d.mT * 0.42))}px" data-l="${_pgAttr(o.running)}"></div>`);
    const footTop = top + h - d.mB + Math.max(14, Math.round(d.mB * 0.28));
    /* THE DESIGN'S OWN FOOTER ON EVERY PAGE, carrying the page number — the
       caller builds it (it knows the design); a page with no footer says the
       number alone. */
    let fh = '';
    try{ fh = typeof o.foot === 'function' ? String(o.foot(label, k, n) || '') : ''; }catch(_){ fh = ''; }
    /* A page added after somebody else's pages (their PDF's signature page)
       is not "Page 1 of 1" of anything, so it carries no number. */
    if(!fh && o.noNumber){ /* nothing */ } else parts.push(fh
      ? `<div class="pg-dfoot" style="left:${d.pL}px;right:${d.pR}px;top:${footTop}px">${fh}</div>`
      : `<div class="pg-sfoot" style="left:${d.pL}px;right:${d.pR}px;top:${footTop}px" data-l="${_pgAttr(label)}"></div>`);
  } else {
    const headTop = top + Math.max(3, Math.round((d.mT - 12) / 2) - 3);
    const name = String(o.name || '');
    const ref = k > 0 ? String(o.ref || '') : '';
    if(name || ref){
      parts.push(`<div class="pg-head${k ? ' is-run' : ''}" style="left:${d.pL}px;right:${d.pR}px;top:${headTop}px" data-l="${_pgAttr(name)}" data-r="${_pgAttr(ref)}"></div>`);
    }
    const footTop = top + h - Math.max(14, Math.round(d.mB / 2) + 5);
    parts.push(`<div class="pg-foot" style="left:${d.pL}px;right:${d.pR}px;top:${footTop}px" data-l="${_pgAttr(label)}"></div>`);
  }
  return parts;
}

/* ============================================================
   LAYOUT — clear, measure, plan, push, draw the layer.
   opts: {
     mode:    'work' | 'sign'
     pageH:   a number, or a function of the sheet's width (default: A4)
     gap:     px of grey between pages (default PG_GAP)
     name:    the letterhead's name for the faded head ('' = none)
     ref:     the reference printed on pages 2+ ('' = none)
     running: the signing copy's slim head on pages 2+ ('' = none)
     runningFirst: ... and on page one too (their Word file's own header)
     noNumber: no "Page N of M" (a signature page added after their pages)
     foot:    (label, k, n) => the design's footer for signing page k, carrying
              the page number ('' = the number alone)
     corners: Word's corner marks (the working copy)
     frame:   inline CSS for a rule drawn round EACH page (a design's own)
     onDone:  called with {pages, n} once the pages are drawn
   }
   ============================================================ */
function pagesLayout(sheet, opts){
  if(!sheet || !sheet.isConnected) return null;
  const o = opts || sheet._pgOpts || {};
  sheet._pgOpts = o;
  /* A HIDDEN SHEET IS LEFT AS IT IS and measured when it is shown (the
     watcher hears the width come back) — clearing it here would throw away
     pages that are still right. */
  if(!sheet.offsetWidth) return null;
  pagesClear(sheet);
  const cs = getComputedStyle(sheet);
  const W = sheet.offsetWidth;
  const bt = parseFloat(cs.borderTopWidth) || 0;
  const bl = parseFloat(cs.borderLeftWidth) || 0;
  const mT = parseFloat(cs.paddingTop) || 0;
  const mB = parseFloat(cs.paddingBottom) || 0;
  const pL = parseFloat(cs.paddingLeft) || 0;
  const pR = parseFloat(cs.paddingRight) || 0;
  const H = typeof o.pageH === 'function' ? o.pageH(W) : (Number(o.pageH) || W * PG_A4);
  const G = o.gap == null ? PG_GAP : Math.max(0, Number(o.gap) || 0);
  const sr = sheet.getBoundingClientRect();
  const scale = sr.height && sheet.offsetHeight ? (sr.height / sheet.offsetHeight) : 1;
  const atoms = pagesAtoms(sheet).map(a => {
    const r = a.el.getBoundingClientRect();
    return { ...a, top: (r.top - sr.top) / scale, h: r.height / scale };
  });
  const plan = pagesPlan(atoms, { pageH: H, gap: G, mTop: mT, mBot: mB });
  /* ---- THE PUSHES ----
     margin-top grows by the push. Margins COLLAPSE, so the first guess can
     move a block less than it should; the correction below measures what
     really happened and makes up the difference, in document order, because
     every correction moves everything after it by the same amount. */
  const moved = [];
  atoms.forEach((a, i) => {
    const p = plan.push[i];
    if(!(p > 0)) return;
    const el = a.el;
    el.setAttribute('data-pg-mt', el.style.marginTop || '');
    el.setAttribute('data-pg-push', String(Math.round(p)));
    let mt = 0;
    try{ mt = parseFloat(getComputedStyle(el).marginTop) || 0; }catch(_){ mt = 0; }
    let pmb = 0;
    const prev = el.previousElementSibling;
    if(prev){ try{ pmb = parseFloat(getComputedStyle(prev).marginBottom) || 0; }catch(_){ pmb = 0; } }
    el.style.marginTop = (Math.max(mt, pmb) + p) + 'px';
    moved.push({ el, i });
  });
  if(moved.length){
    let want = 0;
    const target = atoms.map((a, i) => { want += plan.push[i]; return a.top + want; });
    for(let pass = 0; pass < 4; pass++){
      /* EVERY POSITION IS READ BEFORE ANY IS WRITTEN — one layout per pass,
         not one per block — so each correction is added to the ones before it
         by arithmetic rather than by measuring again. */
      const sr2 = sheet.getBoundingClientRect();
      const tops = moved.map(m => (m.el.getBoundingClientRect().top - sr2.top) / scale);
      let fixed = 0, worst = 0;
      moved.forEach((m, j) => {
        const err = target[m.i] - (tops[j] + fixed);
        if(Math.abs(err) <= PG_FUZZ) return;
        const cur = parseFloat(m.el.style.marginTop) || 0;
        const next = Math.max(0, cur + err);
        m.el.style.marginTop = next + 'px';
        fixed += next - cur;
        worst = Math.max(worst, Math.abs(err));
      });
      if(worst <= PG_FUZZ) break;
    }
  }
  /* ---- THE LAST PAGE IS A WHOLE PAGE ----
     A block of air at the foot of the sheet (.pg-sheet::after, sized by
     --pg-extra) runs the paper down to the last page's bottom edge, so it ends
     where a page ends rather than under the last line. Air, not min-height,
     so that when the wording SHRINKS the sheet shrinks with it and the
     watcher hears about it. And never the inline padding: a sheet written
     with a `padding` shorthand holding a var() answers '' for its bottom
     longhand, and putting '' back deletes the padding outright (measured —
     every page after a re-break lost its bottom margin). */
  const natural = sheet.offsetHeight;
  const extra = plan.total - natural;
  if(extra > PG_FUZZ) sheet.style.setProperty('--pg-extra', extra + 'px');
  /* ---- THE LAYER ---- */
  const desk = _pgDeskColour(sheet);
  const n = plan.pages.length;
  const dims = { W, bl, bt, br: parseFloat(cs.borderRightWidth) || 0, mT, mB, pL, pR };
  const parts = [];
  plan.pages.forEach((p, k) => {
    parts.push(..._pgFurniture(o, k, n, p.top - bt, p.h, dims));
    if(k < n - 1){
      const gTop = p.top - bt + p.h;
      parts.push(`<div class="pg-gap" style="top:${gTop}px;height:${G}px;left:${-bl - PG_BAND_BLEED}px;right:${-dims.br - PG_BAND_BLEED}px;background:${desk}"></div>`);
    }
  });
  const layer = document.createElement('div');
  layer.setAttribute('data-pg-layer', '');
  layer.setAttribute('aria-hidden', 'true');
  layer.className = 'pg-layer';
  /* The head and the foot are set in the DOCUMENT's face, read off the
     wording itself, so a contract in a serif design is not headed in the
     app's sans. */
  try{ layer.style.fontFamily = getComputedStyle(sheet.querySelector('.doc-surface') || sheet).fontFamily; }catch(_){}
  layer.innerHTML = parts.join('');
  sheet.appendChild(layer);
  sheet.setAttribute('data-pg-pages', String(n));
  const info = { pages: plan.pages, n, pageH: H, gap: G, atoms, push: plan.push, dims };
  sheet._pgInfo = info;
  sheet._pgSeen = { w: sheet.offsetWidth, h: sheet.offsetHeight };
  if(typeof o.onDone === 'function'){ try{ o.onDone(info); }catch(_){} }
  return info;
}

/* ============================================================
   THE WATCHER — the pages follow the paper. A change of width (the window,
   the divider), of the reader's text size, of a value typed into a blank or
   of a font arriving changes the sheet's size, and the pages are re-broken
   once it settles. The sheet's size after a layout is remembered, so the
   layout's own padding does not set it off a second time.
   ============================================================ */
function pagesWatch(sheet, opts){
  if(!sheet) return null;
  sheet._pgOpts = opts || {};
  sheet.classList.add('pg-sheet');
  if(opts && opts.mode) sheet.classList.add(opts.mode === 'sign' ? 'pg-sign' : 'pg-work');
  const info = pagesLayout(sheet, sheet._pgOpts);
  if(typeof ResizeObserver !== 'function' || sheet._pgRO) return info;
  let t = 0;
  const run = () => {
    t = 0;
    if(!sheet.isConnected){ pagesUnwatch(sheet); return; }
    const seen = sheet._pgSeen;
    if(seen && seen.w === sheet.offsetWidth && seen.h === sheet.offsetHeight) return;
    pagesLayout(sheet, sheet._pgOpts);
  };
  const ro = new ResizeObserver(() => { if(t) clearTimeout(t); t = setTimeout(run, PG_WATCH_MS); });
  ro.observe(sheet);
  sheet._pgRO = ro;
  return info;
}
function pagesUnwatch(sheet){
  if(!sheet) return;
  if(sheet._pgRO){ try{ sheet._pgRO.disconnect(); }catch(_){} sheet._pgRO = null; }
}
/* Re-break now, with whatever the sheet was last given. */
function pagesRefresh(sheet){
  if(sheet && sheet._pgOpts) return pagesLayout(sheet, sheet._pgOpts);
  return null;
}
/* Which page is at the top of what the reader can see — the signing copy's
   "Page 2 of 6". */
function pagesAtView(sheet, scroller){
  const info = sheet && sheet._pgInfo;
  if(!info || !scroller) return 1;
  const sr = sheet.getBoundingClientRect();
  const vr = scroller.getBoundingClientRect();
  const scale = sheet.offsetHeight ? sr.height / sheet.offsetHeight : 1;
  const y = (vr.top + Math.min(120, vr.height / 3) - sr.top) / (scale || 1);
  let at = 1;
  info.pages.forEach((p, k) => { if(y >= p.top - PG_FUZZ) at = k + 1; });
  return Math.min(Math.max(1, at), info.n);
}
/* Scroll so page k (1-based) sits at the top of what the reader sees. */
function pagesGoTo(sheet, scroller, k){
  const info = sheet && sheet._pgInfo;
  if(!info || !scroller) return;
  const p = info.pages[Math.min(Math.max(1, k), info.n) - 1];
  if(!p) return;
  const sr = sheet.getBoundingClientRect();
  const vr = scroller.getBoundingClientRect();
  const scale = sheet.offsetHeight ? sr.height / sheet.offsetHeight : 1;
  scroller.scrollTop += (sr.top + p.top * scale) - vr.top - 8;
}

/* ============================================================
   PRINT — the pages you read are the pages that print.
   ============================================================
   A printer paginates on its own, and it truncates a margin at a page break,
   so the long sheet cannot simply be printed. Each page is rebuilt instead as
   a box of its own, holding exactly the blocks the screen put on that page —
   each one inside a copy of the containers it sat in, the first of a
   continued page with its top margin taken off, exactly as the screen's push
   left it at the page's content top — and wearing the same furniture, from
   the same builder. The sheet on screen is not touched: every block is a
   COPY, so nothing any reader holds is moved.

   One page box is one printed page (A4, no printer margin — the page carries
   its own), so the break points, the running head and "Page 2 of 6" are the
   screen's. A page grown past A4 by a block too tall for any page prints over
   two sheets rather than cutting the block. */
function pagesPrintPages(sheet){
  const info = sheet && sheet._pgInfo;
  if(!info || !Array.isArray(info.atoms) || !info.atoms.length) return '';
  const o = sheet._pgOpts || {};
  const lists = info.pages.map(() => []);
  let cum = 0;
  info.atoms.forEach((a, i) => {
    cum += info.push[i] || 0;
    const t = a.top + cum;
    let k = 0;
    info.pages.forEach((p, j) => { if(t >= p.top - PG_FUZZ) k = j; });
    lists[k].push(a.el);
  });
  const d = info.dims || {};
  const started = new Set();                        // containers already begun on an earlier page
  const out = [];
  lists.forEach((els, k) => {
    const page = sheet.cloneNode(false);
    page.classList.add('pp-page');
    page.removeAttribute('id');
    page.style.removeProperty('transform');
    page.style.removeProperty('--pg-extra');
    /* THE PAPER HAS NO EDGE, and the words keep the width they had: the
       screen's border comes off and the box narrows by exactly that much, so
       not one line wraps differently from the page it was measured on. */
    page.style.border = '0';
    page.style.boxShadow = 'none';
    page.style.width = (d.W - (d.bl || 0) - (d.br || 0)) + 'px';
    page.style.height = info.pages[k].h + 'px';
    const shells = new Map([[sheet, page]]);
    const begun = new Set();
    const shellOf = el => {
      if(shells.has(el)) return shells.get(el);
      const parent = shellOf(el.parentElement);
      const sh = el.cloneNode(false);
      sh.removeAttribute('id');
      /* A CONTAINER THAT BEGAN ON AN EARLIER PAGE CONTINUES here, so it does
         not open again: its top margin, padding and rule belong to the page
         it started on. */
      if(started.has(el)){ sh.style.marginTop = '0px'; sh.style.paddingTop = '0px'; sh.style.borderTopWidth = '0px'; }
      parent.appendChild(sh);
      shells.set(el, sh);
      begun.add(el);
      return sh;
    };
    els.forEach((el, j) => {
      const holder = shellOf(el.parentElement);
      const copy = el.cloneNode(true);
      if(copy.hasAttribute('data-pg-mt')){ copy.style.marginTop = copy.getAttribute('data-pg-mt') || ''; }
      ['data-pg-mt', 'data-pg-push', 'data-pg-brk'].forEach(a => copy.removeAttribute(a));
      copy.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      copy.removeAttribute('id');
      if(j === 0 && k > 0) copy.style.marginTop = '0px';
      holder.appendChild(copy);
    });
    begun.forEach(el => started.add(el));
    const pd = { ...d, W: d.W - (d.bl || 0) - (d.br || 0), bl: 0, bt: 0, br: 0 };
    const face = (sheet.querySelector(':scope > [data-pg-layer]') || { style: {} }).style.fontFamily || '';
    page.insertAdjacentHTML('beforeend', `<div class="pg-layer" data-pg-layer aria-hidden="true"${
      face ? ` style="font-family:${_pgAttr(face)}"` : ''}>${
      _pgFurniture(o, k, info.n, 0, info.pages[k].h, pd).join('')}</div>`);
    out.push(page.outerHTML);
  });
  return out.join('');
}
/* While the pages print, the printer is told to add no margin of its own and
   the paper is A4; taken away again the moment printing ends. Only the
   signing copy asks for it, so every other print is exactly as it was. */
function pagesPrintPageRule(on){
  if(typeof document === 'undefined') return;
  let st = document.getElementById('pg-print-page');
  if(!on){ if(st) st.remove(); return; }
  if(!st){
    st = document.createElement('style');
    st.id = 'pg-print-page';
    st.textContent = '@page{size:A4;margin:0}';
    document.head.appendChild(st);
    const off = () => { pagesPrintPageRule(false); window.removeEventListener('afterprint', off); };
    window.addEventListener('afterprint', off);
  }
}

if(typeof module !== 'undefined' && module.exports){
  module.exports = { PG_A4, PG_GAP, PG_SIGN_W, PG_SIGN_H, PG_SIGN_PAD, PG_HEAD_KEEP, PG_FUZZ, PG_KEEP_SEL, PG_HEAD_SEL,
    pagesPlan, pagesNumberLabel };
}
if(typeof window !== 'undefined'){
  Object.assign(window, { PG_A4, PG_GAP, PG_SIGN_W, PG_SIGN_H, PG_SIGN_PAD, PG_HEAD_KEEP, PG_KEEP_SEL, PG_HEAD_SEL,
    pagesPlan, pagesAtoms, pagesClear, pagesLayout, pagesWatch, pagesUnwatch, pagesRefresh, pagesAtView, pagesGoTo,
    pagesNumberLabel, pagesPrintPages, pagesPrintPageRule });
}

/* ============================================================
   WHAT A CONTRACT'S PAGES CARRY — read off the contract, shared by every
   screen that draws them (the room, the Negotiate page, the other side's
   pages), so no two can disagree about a name or a footer.
   ============================================================ */
/* THE NAME THE WORKING COPY FADES INTO ITS TOP MARGIN (the owner's pick 2B):
   the letterhead's own, and only where the contract HAS a letterhead — a faded
   copy of nothing is not a copy. Their paper never wears ours. */
function pagesLetterheadName(c){
  if(!c || typeof window === 'undefined') return '';
  try{ if(typeof window.isUpload === 'function' && window.isUpload(c)) return ''; }catch(_){}
  try{
    const db = window.resolveDocBranding ? window.resolveDocBranding(c) : null;
    if(db && db.designId) return String(db.companyName || '').trim();
  }catch(_){}
  const b = c.branding;
  if(c.templateForm && b && (b.companyName || b.logoUrl)) return String(b.companyName || '').trim();
  return '';
}
/* THE SIGNING COPY'S FOOTER FOR ONE PAGE: the design's own footer builder,
   handed the page number as part of its line, so "Highland Corporate Ltd ·
   Confidential · Page 2 of 6" sits exactly where the design sets its words.
   Their paper carries none of ours. The builder opens with the margin meant
   for a footer at the END of a long sheet; on a page, the page places it. */
function pagesSignFoot(c, label){
  if(!c || typeof window === 'undefined') return '';
  /* THEIR WORD FILE'S OWN FOOTER, where it had one, with the page number
     beside it — their words, never ours. */
  try{
    if(typeof window.isUpload === 'function' && window.isUpload(c)){
      const lay = c.upload && c.upload.docStructure && c.upload.docStructure.layout;
      const foot = lay && lay.footer ? String(lay.footer) : '';
      return foot ? `<div class="pg-theirfoot" data-l="${_pgAttr(foot + ' · ' + label)}"></div>` : '';
    }
  }catch(_){}
  let html = '';
  try{
    const db = window.resolveDocBranding ? window.resolveDocBranding(c) : null;
    if(db && db.designId && window.docDesignFooterHtml){
      html = window.docDesignFooterHtml({ ...db, footerText: [db.footerText, label].filter(Boolean).join(' · ') }, c);
    } else if(c.templateForm && c.branding && c.branding.footerText && window.templateBrandingFooterHtml){
      html = window.templateBrandingFooterHtml({ ...c, branding: { ...c.branding,
        footerText: c.branding.footerText + ' · ' + label } });
    }
  }catch(_){ html = ''; }
  return String(html || '').replace(/^(\s*<div\b[^>]*?style=")margin-top:\s*[\d.]+px;?/, '$1');
}
/* "Sign here" on the lines the parties sign on (the owner's pick 5A): the
   reader's own line in the accent, every other party's in grey. `mine` is the
   index of the reader's line — 0 for us, since our party's line comes first. */
function pagesSignFlags(root, mine){
  if(!root) return 0;
  const word = (window.i18t ? window.i18t('pg_sign_here') : '') || 'Sign here';
  let n = 0;
  root.querySelectorAll('.rl-paper-foot .rl-sigline').forEach((el, i) => {
    el.setAttribute('data-pg-flag', word === 'pg_sign_here' ? 'Sign here' : word);
    el.classList.toggle('pg-mine', i === mine);
    /* The tab points in from the NEAREST margin: a line in the right half of
       the foot is pointed at from the right, so the tab never lies across the
       other party's box. Read off the layout, not the index — a foot of three
       or more parties wraps. */
    const foot = el.parentElement;
    const right = !!(foot && foot.offsetWidth && (el.offsetLeft - foot.offsetLeft) > foot.offsetWidth / 3);
    el.classList.toggle('pg-flag-right', right);
    n++;
  });
  return n;
}
if(typeof window !== 'undefined') Object.assign(window, { pagesLetterheadName, pagesSignFoot, pagesSignFlags });
if(typeof module !== 'undefined' && module.exports) Object.assign(module.exports, { pagesSignFoot, pagesLetterheadName });
