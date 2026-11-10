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
  /* THE SCORECARD (owner's pick by name, 10 Nov 2026, for the Contracts list; the Approvals list wears the same, one
     builder): in the new look the three lamps become ONE slim bar split red · amber · green by share, its three counts
     beside it on the same line; what is missing is named on the hover (and in Jambo's panel) */
  if (typeof newLookOn === 'function' && newLookOn()) {
    const vs = (c && c.playbook && Array.isArray(c.playbook.verdicts)) ? c.playbook.verdicts : [];
    const miss = vs.filter(v => v && v.status === 'missing').map(v => String(v.category || v.name || '').toLowerCase()).filter(Boolean);
    const hover = said + (miss.length ? ' \u2014 ' + T('reg_std_missing', { list: miss.join(', ') }) : '');
    const pc = n => (n / r.total * 100).toFixed(1) + '%';
    const seg = (tone, n) => n ? `<i style="width:${pc(n)};background:var(--st-${tone}-dot)"></i>` : '';
    return `<span class="ls-score" role="img" aria-label="${_lsE(hover)}" title="${_lsE(hover)}"><b class="ls-score-bar">${seg('ruby', r.miss)}${seg('amber', r.off)}${seg('green', r.met)}</b>`
      + `<em class="ls-score-n"><u class="is-ruby">${r.miss}</u> \u00b7 <u class="is-amber">${r.off}</u> \u00b7 <u class="is-green">${r.met}</u></em></span>`;
  }
  const lamp = (tone, n) => n
    ? `<span class="ls-lamp" style="background:var(--st-${tone}-bg);color:var(--st-${tone}-fg)"><i style="background:var(--st-${tone}-dot)"></i>${n}</span>`
    : '<span class="ls-lamp is-off"><i></i>0</span>';
  return `<span class="ls-lights" role="img" aria-label="${_lsE(said)}" title="${_lsE(said)}">${lamp('ruby', r.miss)}${lamp('amber', r.off)}${lamp('green', r.met)}</span>`;
}
/* ============================================================
   THE ONE ROWS-ONLY REDRAW, FOR EVERY NEW-LOOK LIST
   (10 Nov 2026, off the owner's "why is the app slow" review; the overnight run's
   jobs 6–11, one page at a time.)

   Every new-look list is one frame: a title, a search box, tab pills, one table
   and a side panel. Each drew the WHOLE of #content on every tab press and every
   letter typed in its box, then put the focus and the caret back by hand — the
   box was being thrown away under the reader's fingers. A caller now builds
   exactly the page it always built and hands the HTML here; this reads the
   pieces back out of it (a detached <template> costs a parse, no styles, no
   layout) and changes only what moved.

   WHAT MOVES: the table's column widths and heads (a column may step out between
   two letters), the INSIDE of its body — the body node itself stays, so the
   presses the list wired on it (insListWire) keep working — each tab pill's
   words and which is lit, the foot, and any line the caller names in `also`.

   THE CONTRACT IS THE RETURN VALUE: FALSE ALWAYS MEANS "DRAW THE WHOLE PAGE".
   It is false when the page is not on screen, when a piece is missing on either
   side, when the pills would not be the same pills in the same order (a tab has
   come or gone), when a foot or an `also` line comes or goes, and when the
   caller names a `shape` selector whose presence differs (a tab that draws
   something other than the table — Parties' Folders draws cards). So a page is
   never left half redrawn.
   ============================================================ */
function listRowsSwapHtml(o){
  if(!o || typeof document === 'undefined' || !o.html || !o.page || !o.table) return false;
  const live = document.querySelector(o.page);
  if(!live) return false;
  let fresh;
  try{ const t = document.createElement('template'); t.innerHTML = String(o.html); fresh = t.content; }catch(_){ return false; }
  const T1 = live.querySelector(o.table), T2 = fresh.querySelector(o.table);
  if(!T1 || !T2) return false;
  const B1 = T1.querySelector('tbody'), B2 = T2.querySelector('tbody');
  if(!B1 || !B2 || T1.querySelectorAll('tbody').length !== 1 || T2.querySelectorAll('tbody').length !== 1) return false;
  for(const sel of [].concat(o.shape || [])) if(!!live.querySelector(sel) !== !!fresh.querySelector(sel)) return false;
  let P1 = [], P2 = [];
  if(o.tabSel){
    P1 = [...live.querySelectorAll(o.tabSel)]; P2 = [...fresh.querySelectorAll(o.tabSel)];
    if(P1.length !== P2.length) return false;
    for(let i = 0; i < P1.length; i++) if(P1[i].getAttribute(o.tabKey) !== P2[i].getAttribute(o.tabKey)) return false;
  }
  const pairs = [];
  for(const sel of [].concat(o.footSel || [], o.also || [])){
    const a = live.querySelector(sel), b = fresh.querySelector(sel);
    if(!!a !== !!b) return false;
    if(a) pairs.push([a, b]);
  }
  /* nothing has been touched yet: from here the swap always completes */
  const swapKid = tag => { const a = T1.querySelector(':scope > ' + tag), b = T2.querySelector(':scope > ' + tag);
    if(a && b) a.replaceWith(document.importNode(b, true)); else if(a && !b) a.remove(); else if(!a && b) T1.insertBefore(document.importNode(b, true), B1); };
  swapKid('colgroup'); swapKid('thead');
  B1.innerHTML = B2.innerHTML;
  P1.forEach((b, i) => { b.className = P2[i].className; b.innerHTML = P2[i].innerHTML; });
  pairs.forEach(([a, b]) => { a.className = b.className; a.innerHTML = b.innerHTML; });
  return true;
}
/* THE CARET, FOR THE TIMES A PAGE DOES FALL BACK: typing must never lose a letter
   because a paint took the other road. null = the box was not being typed in. */
function listCaretAt(sel){
  if(typeof document === 'undefined') return null;
  const el = document.querySelector(sel);
  return (el && document.activeElement === el) ? el.selectionStart : null;
}
function listCaretPut(sel, at){
  if(at == null || typeof document === 'undefined') return;
  const el = document.querySelector(sel); if(!el) return;
  try{ el.focus({ preventScroll: true }); }catch(_){ el.focus(); }
  try{ el.setSelectionRange(at, at); }catch(_){ }
}
Object.assign(window, { listRowsSwapHtml, listCaretAt, listCaretPut, stdRowWordsHtml, LIST_MARK_PATHS, LIST_STREAM_FIXED, listMarkHtml, listWordHtml, listChipHtml, listStreamTone, listAvatarTone, LIST_SAP_MARK, listSapMarkHtml, listSapOn, listSapCellHtml });
