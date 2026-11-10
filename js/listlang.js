/* ============================================================
   THE LIST LANGUAGE — one set of parts every list draws (owner, 27 Oct 2026)
   ============================================================
   A pure module: no route, no state, no DOM beyond the markup it returns, so the
   test worlds load it as they are (test/world.js). Read by every list page.
   Contracts "the Legora way", People "the SAP way", the other lists "the same way";
   docs/MAP-HISTORY.md "THE LIST LANGUAGE".
   ONE set of parts every list draws, so a mark means the same on every page:
   - listMarkHtml(tone, kind, title): the mark that leads a row: done (a ticked circle), part (half
     filled), todo (a dashed circle), late (a triangle), wait (a clock), draft (a pen), ask (a question)
   - listWordHtml(tone, text, sub): a reading in words, a dot and a few words, worst news first, with
     an optional grey line under it
   - listChipHtml(tone, text): a soft chip for a KIND (a stream, a kind of request, a rule), never a state
   - listStreamTone(key): one tone per stream, kept off green (signed) and ruby (danger)
   The tones are the house's status tones (--st-<tone>-fg/-bg/-dot) and pink. */
const LIST_MARK_PATHS = {
  done: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  part: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
  todo: '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/>',
  late: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  wait: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  draft: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  ask: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>'
};
/* its own escaper: a pure module never leans on js/components.js being loaded */
const _lsE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const LIST_TONES = ['green', 'amber', 'ruby', 'steel', 'violet', 'gray', 'pink'];
function _listTone(t){ return LIST_TONES.includes(t) ? t : 'gray'; }
function listMarkHtml(tone, kind, title){
  const t = _listTone(tone), d = LIST_MARK_PATHS[kind] || LIST_MARK_PATHS.todo;
  return `<span class="ls-mark" style="color:var(--st-${t}-dot)"${title ? ` title="${_lsE(title)}"` : ''} aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg></span>`;
}
/* THE SAP WAY MARK (owner, 9 Nov 2026: "at the head of every row"; the new look only): a 20px filled circle in the
   house's status colour with a white DRAWN glyph (js/components.js ICONS, never a typed character). ONE map of what a
   row's state means, so every list says it alike: done a green tick · your move an amber ! · theirs a steel i · a real
   risk a ruby cross (never merely late) · nothing yet a grey dash · Jambo's piece a violet star. */
const LIST_SAP_MARK = { done: ['green', 'mkTick'], you: ['amber', 'mkBang'], them: ['steel', 'mkInfo'],
  risk: ['ruby', 'mkCross'], none: ['gray', 'mkDash'], jambo: ['violet', 'mkStar'] };
function listSapMarkHtml(key, title){
  const k = LIST_SAP_MARK[key] ? key : 'none', m = LIST_SAP_MARK[k];
  const g = (typeof icon === 'function') ? icon(m[1], 'ls-mk-g', 2.4) : '';
  return `<span class="ls-mk is-${m[0]}" data-ls-mk="${k}"${title ? ` title="${_lsE(title)}"` : ''} aria-hidden="true">${g}</span>`;
}
/* the new look wears the SAP mark, today's look its outlined one: the one switch every list asks */
const listSapOn = () => (typeof newLookOn === 'function') && !!newLookOn();
/* a first cell that had no mark (the new look's own rows: Negotiations, Approvals) takes it beside its two lines; with
   the switch off the cell is exactly what it was */
const listSapCellHtml = (key, inner, title) => listSapOn() ? `<div class="ls-mkrow">${listSapMarkHtml(key, title)}<div class="ls-mkrow-t">${inner}</div></div>` : inner;
function listWordHtml(tone, text, sub){
  const t = _listTone(tone);
  return `<span class="ls-word"><span class="ls-word-v" style="color:var(--st-${t}-fg)"><i style="background:var(--st-${t}-dot)"></i>${_lsE(text)}</span>${sub ? `<span class="ls-word-m">${_lsE(sub)}</span>` : ''}</span>`;
}
function listChipHtml(tone, text){
  const t = _listTone(tone);
  return `<span class="ls-chip" style="background:var(--st-${t}-bg);color:var(--st-${t}-fg)" title="${_lsE(text)}">${_lsE(text)}</span>`;
}
const LIST_STREAM_TONES = ['violet', 'steel', 'amber', 'pink', 'gray'];
/* the house's own streams each keep one tone, so two streams side by side never share one; a company's
   own stream takes one by its key */
const LIST_STREAM_FIXED = { proc: 'violet', sales: 'steel', dist: 'amber', mktg: 'pink', corp: 'gray', mfg: 'steel' };
function listStreamTone(key){
  if (LIST_STREAM_FIXED[key]) return LIST_STREAM_FIXED[key];
  let h = 7; for (const ch of String(key || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return LIST_STREAM_TONES[h % LIST_STREAM_TONES.length];
}
/* the initials' own colour, per name, kept off amber and ruby (a person is never a warning) */
const LIST_AVATAR_TONES = ['green', 'steel', 'violet'];
function listAvatarTone(name){
  let h = 7; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return LIST_AVATAR_TONES[h % LIST_AVATAR_TONES.length];
}
/* OUR STANDARDS, A TRAFFIC LIGHT for a list row (owner picked "Traffic light", 28 Oct 2026, over two lines of
   words): the drawing of js/standards.js's stdRowReading (which counts and draws nothing). Three lamps in ONE fixed
   order — missing (ruby), differs (amber), met (green) — each carrying its count; a lamp at zero turns grey, so
   colour is never alone (the count and the place say it too). The whole sentence rides the hover and a screen
   reader (title, aria-label). No stored check is "Not checked yet" in words, never a clean light. */
function stdRowWordsHtml(c){
  const T = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
  const Tn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : T(k, v);
  const r = (typeof stdRowReading === 'function') ? stdRowReading(c) : null;
  if (!r || !r.total) return `<span class="ls-quiet">${T('std_row_unchecked')}</span>`;
  const said = [r.miss ? Tn('std_row_missing', r.miss, { n: r.miss }) : '', r.off ? Tn('std_row_differ', r.off, { n: r.off }) : '',
    T('std_row_of', { met: r.met, total: r.total })].filter(Boolean).join(' \u00b7 ');
  const lamp = (tone, n) => n
    ? `<span class="ls-lamp" style="background:var(--st-${tone}-bg);color:var(--st-${tone}-fg)"><i style="background:var(--st-${tone}-dot)"></i>${n}</span>`
    : '<span class="ls-lamp is-off"><i></i>0</span>';
  return `<span class="ls-lights" role="img" aria-label="${_lsE(said)}" title="${_lsE(said)}">${lamp('ruby', r.miss)}${lamp('amber', r.off)}${lamp('green', r.met)}</span>`;
}

/* ============================================================
   THE ONE ROWS-ONLY REDRAW, FOR EVERY NEW-LOOK LIST
   (10 Nov 2026, off the owner's "why is the app slow" review.)

   WHAT IT IS FOR. Every new-look list page is the same frame: a serif title, a
   search box, a row of tab pills, one table and a side panel. Each of them drew
   the WHOLE of #content on every tab press and on EVERY LETTER typed in its
   box — which is why each page carried its own lines putting the focus and the
   caret back afterwards. That is the tell that the wrong thing was being
   replaced: the box was being thrown away under the reader's fingers. Swapping
   #content also makes the browser read 11,837 style rules against the new tree,
   164 of them `:has()` anchored at the shell while looking inside #content, so
   the cost does not fall with the number of rows.

   WHY ONE BUILDER AND NOT EIGHT. The pages differ in what they count and how
   they draw a row, and nothing here touches either: the caller builds exactly
   what it always built and hands over the finished pieces. What is the same on
   all of them is the SWAP — the table's inside, each pill's count and which is
   lit, the foot's one line — and doing that eight times by hand is eight
   chances to get the fallback wrong. The clothes follow the builder.

   THE CONTRACT IS THE RETURN VALUE. It answers true when it has done the swap,
   and FALSE when it will not — the page is not on screen, or the bar it would
   leave standing is not the bar the caller just built (a tab has appeared or
   gone). A false is not a failure: it means "draw the whole page", and the
   caller does exactly what it did before. So a page can never be left half
   redrawn, and a new tab can never be missed.

   THE TABLE'S WHOLE INSIDE, not just its body. A column can step out of a list
   between one letter and the next — Approvals drops "What it rests on" the
   moment it reads the same on every row — so the widths and the heads have to
   be able to move too. The table's own node stays, which is what keeps the
   frame, the box and the panel standing.
   ============================================================ */
function listRowsSwap(o){
  if(!o || typeof document === 'undefined') return false;
  const host = o.page ? document.querySelector(o.page) : document;
  if(!host) return false;
  const tbl = host.querySelector(o.table);
  if(!tbl) return false;
  let pills = [];
  if(o.tabs){
    pills = [...host.querySelectorAll(o.tabSel)];
    if(pills.length !== o.tabs.length) return false;
    for(let i = 0; i < pills.length; i++) if(pills[i].getAttribute(o.tabKey) !== String(o.tabs[i][0])) return false;
  }
  tbl.innerHTML = o.tableInner;
  if(o.tabs) pills.forEach((b, i) => {
    b.classList.toggle('is-on', String(o.tabs[i][0]) === String(o.on));
    const n = b.querySelector('span');
    if(n) n.textContent = String(o.tabs[i][2]);
  });
  /* THE FOOT COMES AND GOES: several of these pages draw their count line only
     when there is something to count, so an empty foot REMOVES the line and a
     line that has to appear where there is no element to replace is one of the
     "draw the whole page" answers rather than a silent miss. */
  if(o.foot != null){
    const ft = host.querySelector(o.footSel || '.apn-foot');
    if(ft) ft.outerHTML = o.foot;
    else if(String(o.foot).trim()) return false;
  }
  return true;
}
/* THE CARET, FOR THE TIMES IT DOES FALL BACK. Typing must never lose a letter
   because a paint took the other road, so a page that redraws its box reads
   where the caret was BEFORE and puts it back after. Returns null when the box
   was not the thing being typed in, and then there is nothing to put back. */
function listCaretAt(sel){
  if(typeof document === 'undefined') return null;
  const el = document.querySelector(sel);
  return (el && document.activeElement === el) ? el.selectionStart : null;
}
function listCaretPut(sel, at){
  if(at == null || typeof document === 'undefined') return;
  const el = document.querySelector(sel);
  if(!el) return;
  el.focus();
  try{ el.setSelectionRange(at, at); }catch(_){ }
}

/* THE SAME SWAP, TAKEN OUT OF THE PAGE THE CALLER JUST BUILT
   (10 Nov 2026). Several of these pages build their whole screen as one long
   template, and cutting the table and the foot out of it by hand, in five
   files, is five chances to cut in the wrong place. So the caller hands over
   the finished page HTML instead and this reads the pieces back out of it.

   WHY THAT IS STILL THE CHEAP ROAD. Parsing the markup into a <template> costs
   a parse and nothing else: a detached tree has no styles to work out, no
   layout, and nothing to paint. What was expensive was never the string — it
   was handing it to #content, which destroys the box and the panel, makes the
   browser read every style rule against a new tree, and leaves every listener
   to be wired again. That is exactly what this skips.

   It answers false for the same reasons as its twin above, and false always
   means "draw the whole page". */
function listRowsSwapHtml(o){
  if(!o || typeof document === 'undefined' || !o.html) return false;
  const live = document.querySelector(o.page);
  if(!live) return false;
  const tbl = live.querySelector(o.table);
  if(!tbl) return false;
  let tmp;
  try{
    tmp = document.createElement('template');
    tmp.innerHTML = String(o.html);
  }catch(_){ return false; }
  const fresh = tmp.content;
  const tbl2 = fresh.querySelector(o.table);
  if(!tbl2) return false;
  let pills = [], pills2 = [];
  if(o.tabSel){
    pills = [...live.querySelectorAll(o.tabSel)];
    pills2 = [...fresh.querySelectorAll(o.tabSel)];
    if(!pills.length || pills.length !== pills2.length) return false;
    for(let i = 0; i < pills.length; i++)
      if(pills[i].getAttribute(o.tabKey) !== pills2[i].getAttribute(o.tabKey)) return false;
  }
  const ft = o.footSel ? live.querySelector(o.footSel) : null;
  const ft2 = o.footSel ? fresh.querySelector(o.footSel) : null;
  if(o.footSel && !!ft !== !!ft2) return false;   /* a line that comes or goes is a whole-page draw */
  tbl.innerHTML = tbl2.innerHTML;
  pills.forEach((b, i) => {
    b.className = pills2[i].className;
    b.innerHTML = pills2[i].innerHTML;
  });
  if(ft && ft2) ft.innerHTML = ft2.innerHTML;
  return true;
}

Object.assign(window, { listRowsSwap, listRowsSwapHtml, listCaretAt, listCaretPut, stdRowWordsHtml, LIST_MARK_PATHS, LIST_STREAM_FIXED, listMarkHtml, listWordHtml, listChipHtml, listStreamTone, listAvatarTone, LIST_SAP_MARK, listSapMarkHtml, listSapOn, listSapCellHtml });
