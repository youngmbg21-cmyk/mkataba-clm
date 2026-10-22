/* ═══ THE LIST HEAD, THE LEGORA WAY (the owner's pick, 21 Oct 2026, Part 8:
   "every list page the Legora way") ═══════════════════════════════════════
   ONE builder for the head of every list page: a box you can search or ask
   in, under the title; the page's views as tabs under it, each counted with
   the rows its press shows; then a row of chips — a filter appears only once
   it is ADDED ("+ Filter" opens HaTi's own list), as "Label value ×" — with
   the page's own controls and Columns at its right end. Under the list, one
   foot: "1–40 of 189 · Show 40 more".

   THE PAGE OWNS EVERY READING AND EVERY KEPT VALUE. This file counts nothing
   and stores nothing: a page registers what it reads and how it narrows
   (lhRegister, at its OWN render time, so the import order of the files never
   matters) and every press here ends in the page's own writer, its own
   repaint and its own place store. The only things held here are transient,
   like an open pop-up: whether Columns is open, a recount asked for while the
   reader is still typing, and what the last press was made with. The question
   being typed is held by the box itself, nowhere else (_lhAskingNow).

   SEARCH OR QUESTION (the lead's ruling 2): typing narrows the list through
   the page's own query — unless the words read as a QUESTION by a strict
   test (lhIsQuestion: it ends in "?", or it has three words or more and
   starts which / what / who / … / vilka / vad / hur). A question does not
   narrow. Enter on a question hands it to THE PAGE'S OWN JAMBO (lhAsk: the
   panel beside the list, Home's dock, else the side panel) and empties the
   box; Enter on plain words stays a search and spends nothing. A question
   Jambo is too busy to take is SAID ('warn'), and stays in the box.

   COLUMNS LIVES HERE TOO (moved from js/views/customers.js, never copied):
   a reader's own choice of columns and their order, kept in this browser
   per page; a page names its columns once (LC_PAGES), and may name the ones
   hidden until the reader shows them (LC_PAGES[seat].hide). */

const _lhE = s => (typeof esc === 'function') ? esc(s)
  : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _lhT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _lhTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : k;
const _lhIc = (n, cls) => (typeof icon === 'function') ? icon(n, cls || 'w-3.5 h-3.5') : '';
/* a count in the market's own grouping, as every list's number is drawn */
const _lhN = n => { try { return Number(n).toLocaleString((typeof jxLocale === 'function') ? jxLocale() : undefined); } catch (_){ return String(n); } };
/* a seat inside an attribute selector */
const _lhSel = s => String(s == null ? '' : s).replace(/["\\]/g, '\\$&');

/* ---- THE REGISTRY ----
   LH_PAGES[seat] = the page's spec (every field optional; each drawer draws
   only what its fields allow — see the closing note for the whole list). */
const LH_PAGES = {};
function lhRegister(seat, spec){
  if (!seat || !spec || typeof spec !== 'object') return null;
  LH_PAGES[seat] = spec;
  return spec;
}
const _lhPage = seat => (seat != null && Object.prototype.hasOwnProperty.call(LH_PAGES, seat)) ? LH_PAGES[seat] : null;
const _lhApplied = f => !!f && String(f.cur) !== String(f.def);
const _lhOptWords = o => (o && typeof o[2] === 'number') ? `${o[1]} (${_lhN(o[2])})` : String((o && o[1]) == null ? '' : o[1]);
let _lhPress = 'key';

/* ---- SEARCH OR QUESTION: THE STRICT TEST ----
   Never the rewrite card's reader (aiAsksPastCard / AI_QUESTION_RE): that one
   hears "Visa", "var" and "list" as questions, so a party named Visa could
   never be searched for. A question here ends in "?", or is three words or
   more opening with a question word, in either language. */
const LH_ASK_WORDS = ['which', 'what', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
  'vilka', 'vilken', 'vilket', 'vad', 'vem', 'när', 'varför', 'hur'];
const LH_ASK_PAIRS = ['show me', 'list all', 'var finns'];
function lhIsQuestion(words){
  const t = String(words == null ? '' : words).trim();
  if (!t) return false;
  if (/\?$/.test(t)) return /[\p{L}\p{N}]/u.test(t);
  const w = t.toLowerCase().split(/\s+/).map(x => x.replace(/[,.:;!]+$/, ''));
  if (w.length < 3) return false;
  return LH_ASK_WORDS.includes(w[0]) || LH_ASK_PAIRS.includes(w[0] + ' ' + w[1]);
}

/* ---- THE BOX ----
   THE QUESTION BEING TYPED LIVES IN THE BOX ITSELF, never in a store here.
   It narrows nothing, so the page's own query is empty while it stands, and a
   repaint of the page draws it back only while that box still stands on the
   page holding it AND the page's query is still empty: a query written by any
   other door (the top bar's search, a lander, a chip handed in) wins, and a
   page left and come back to starts from its own query. */
const _lhBoxes = seat => (typeof document === 'undefined' || !document.querySelectorAll) ? []
  : Array.from(document.querySelectorAll(`[data-lh-seat="${_lhSel(seat)}"] input[data-lh-q]`));
function _lhAskingNow(seat, q){
  if (q != null && String(q) !== '') return null;
  const boxes = _lhBoxes(seat);
  const b = boxes.find(x => x === document.activeElement) || boxes[0];
  return (b && lhIsQuestion(b.value)) ? b.value : null;
}
/* THE ONE WRITER OF WHAT A BOX SHOWS when a door other than the box writes
   the page's query: every live box of the seat shows those words (default:
   the page's own query), and a question standing there goes. With no seat
   (the top bar's search, which knows no seat), every head on the page shows
   its own page's query, a question left standing only where its page's query
   is empty. A box already showing the words is not touched, so its caret
   stays. Returns how many boxes changed. */
function lhBoxSet(seat, words){
  let n = 0;
  const put = (inp, w) => { const v = String(w == null ? '' : w); if (inp.value !== v){ inp.value = v; n++; } };
  const qOf = pg => (pg && typeof pg.q === 'function') ? String(pg.q() == null ? '' : pg.q()) : '';
  if (seat != null){
    const w = words !== undefined ? words : qOf(_lhPage(seat));
    _lhBoxes(seat).forEach(inp => put(inp, w));
    return n;
  }
  if (typeof document === 'undefined' || !document.querySelectorAll) return 0;
  document.querySelectorAll('[data-lh-seat]').forEach(head => {
    const pg = _lhPage(head.getAttribute('data-lh-seat'));
    if (!pg || typeof pg.q !== 'function') return;
    const q = qOf(pg);
    head.querySelectorAll('input[data-lh-q]').forEach(inp => { if (!q && lhIsQuestion(inp.value)) return; put(inp, q); });
  });
  return n;
}
/* the box itself:
   `input[type=search][data-lh-q]` under the title. The page's own id is kept
   (spec.boxId or o.id: cu-q, dir-q, mn-q …) so its caret-keeping and every
   selector that finds it still work; spec.boxAttrs adds the page's own
   attributes ({ 'data-ik-q': true }). The placeholder counts the page's book
   at rest ("Search, or ask across 189 contracts"); the value is ESCAPED. */
function lhBoxHtml(seat, o){
  const pg = _lhPage(seat) || {}, opt = o || {};
  const id = opt.id || pg.boxId || 'lh-q';
  const total = (typeof pg.total === 'function') ? pg.total() : null;
  const noun = pg.noun || seat;
  const ph = (typeof total === 'number' && isFinite(total)) ? _lhTn('lh_ph_' + noun, total, { n: _lhN(total) }) : _lhT('lh_box_label');
  const qNow = (typeof pg.q === 'function') ? pg.q() : '';
  const asking = _lhAskingNow(seat, qNow);
  const q = asking != null ? asking : qNow;
  const extra = Object.entries(Object.assign({}, pg.boxAttrs || {}, opt.attrs || {}))
    .filter(([k, v]) => /^[a-z][\w-]*$/i.test(k) && v != null && v !== false)
    .map(([k, v]) => v === true ? ` ${k}` : ` ${k}="${_lhE(v)}"`).join('');
  return `<label class="lh-ask" title="${_lhE(_lhT('lh_box_title'))}">${_lhIc('search')}<input type="search" id="${_lhE(id)}" data-lh-q autocomplete="off" spellcheck="false" placeholder="${_lhE(ph)}" value="${_lhE(q == null ? '' : q)}" aria-label="${_lhE(_lhT('lh_box_label'))}"${extra}></label>`;
}

/* ---- A PAGE'S OWN PARTS STAND ----
   What a page hands the head as html (lead, right, tabsAfter) and Columns are
   marked where they stand, with a short hash of the html they were drawn
   from. lhHeadSync keeps those nodes in place, never moved nor redrawn, while
   the html is unchanged, so every listener a page bound on its own control
   (#reg-sort's change, a chip's ×) and the focus on it survive a recount.
   A part whose html has changed is drawn afresh, and the page's spec.wire
   (head, parts) is called to bind what it binds per element. */
const LH_OWN = ['lead', 'right', 'after', 'cols'];
const LH_PAGE_OWN = ['lead', 'right', 'after'];
function _lhHash(s){
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
const _lhOwn = (part, html) => html ? `<!--lh:${part}:${_lhHash(String(html))}-->${html}<!--lh/${part}-->` : '';
function _lhPartOf(row, part){
  if (!row || !row.childNodes) return null;
  const kids = Array.from(row.childNodes), at = 'lh:' + part + ':';
  const i = kids.findIndex(x => x.nodeType === 8 && x.data.indexOf(at) === 0);
  if (i < 0) return null;
  const j = kids.findIndex((x, k) => k > i && x.nodeType === 8 && x.data === 'lh/' + part);
  if (j < 0) return null;
  return { start: kids[i], end: kids[j], hash: kids[i].data.slice(at.length), nodes: kids.slice(i + 1, j) };
}

/* ---- THE TAB ROW ----
   The ONE tab builder (insViewTabsHtml, js/views/inspector.js) with the
   page's OWN tab attribute (spec.tabAttr), so every lander and test that
   finds a tab by it still does. A tab with no rows is left out unless it is
   lit or kept (keep:true, "All"). The saved views and "+ Save this view"
   (spec.saved / spec.save, Contracts) stand in the same tablist. */
function lhSavedHtml(seat){
  const pg = _lhPage(seat) || {};
  const list = (typeof pg.saved === 'function') ? (pg.saved() || []) : [];
  const views = list.map(v => {
    const on = !!v.on, id = String(v.id == null ? v.label : v.id);
    return `<span class="reg-vtab reg-vtab-saved${on ? ' on' : ''}" role="tab" aria-selected="${on ? 'true' : 'false'}"><button type="button" data-lh-saved="${_lhE(id)}" title="${_lhE(_lhT('reg_saved_view_title'))}">${_lhE(v.label == null ? id : v.label)}</button>${
      typeof pg.unsave === 'function' ? `<button type="button" class="x" data-lh-saved-x="${_lhE(id)}" title="${_lhE(_lhT('reg_forget_view_title'))}" aria-label="${_lhE(_lhT('reg_forget_view_title'))}">${_lhIc('x')}</button>` : ''}</span>`;
  }).join('');
  const save = (typeof pg.save === 'function')
    ? `<button type="button" class="reg-vtab-act lh-save" data-lh-save title="${_lhE(_lhT('lh_save_title'))}">${_lhIc('plus')}${_lhE(_lhT('lh_save'))}</button>` : '';
  return views + save;
}
function lhTabsHtml(seat){
  const pg = _lhPage(seat);
  if (!pg || !pg.tabAttr || typeof pg.tabs !== 'function' || typeof insViewTabsHtml !== 'function') return '';
  const views = pg.tabs() || [];
  const after = lhSavedHtml(seat) + _lhOwn('after', (typeof pg.tabsAfter === 'function') ? (pg.tabsAfter() || '') : '');
  if (!views.length && !after) return '';
  return insViewTabsHtml({ attr: pg.tabAttr, cur: (typeof pg.tabNow === 'function') ? pg.tabNow() : '', label: pg.tabsLabel || '', views, after });
}

/* ---- THE CHIPS ----
   A filter is drawn only once it is APPLIED (its value away from its rest,
   String(cur) !== String(def)) — no new kept key: the page's own filter
   state IS what is added. A choice that would leave no rows is not offered
   (n === 0) unless it is the one chosen; n === null means the page cannot
   count it (a partial book) and it is offered. */
function lhChipHtml(f){
  if (!f || f.k == null) return '';
  const all = (f.opts || []).slice();
  if (!all.some(o => String(o[0]) === String(f.cur))) all.unshift([f.cur, String(f.cur), null]);
  const opts = all.filter(o => String(o[0]) !== String(f.def) && (o[2] == null || o[2] > 0 || String(o[0]) === String(f.cur)));
  const pick = (all.find(o => String(o[0]) === String(f.cur)) || [])[1];
  const label = f.label == null ? String(f.k) : f.label;
  const x = _lhT('lh_remove', { what: label });
  return `<span class="lh-chip" data-lh-chip="${_lhE(f.k)}"><label title="${_lhE(f.title || label)}">${_lhE(label)} <b>${_lhE(pick == null ? f.cur : pick)}</b><select class="reg-chip-sel" data-lh-f="${_lhE(f.k)}" aria-label="${_lhE(label)}">${
    opts.map(o => `<option value="${_lhE(o[0])}"${String(o[0]) === String(f.cur) ? ' selected' : ''}>${_lhE(_lhOptWords(o))}</option>`).join('')}</select></label><button type="button" class="lh-x" data-lh-x="${_lhE(f.k)}" title="${_lhE(x)}" aria-label="${_lhE(x)}">${_lhIc('x')}</button></span>`;
}
/* "+ Filter": the filters NOT applied, one group each, offering only the
   values that give rows — never a filter's rest (choosing "All" changes
   nothing). Not drawn when nothing is left to add. One press opens HaTi's own
   list with its groups as headings (data-sm-groups, selectMenuWire); the
   placeholder is hidden there as in the system's own list. */
function lhAddHtml(seat, list){
  const pg = _lhPage(seat) || {};
  const fs = list || ((typeof pg.filters === 'function') ? (pg.filters() || []) : []);
  const groups = fs.filter(f => f && f.k != null && !_lhApplied(f)).map(f => {
    const opts = (f.opts || []).filter(o => String(o[0]) !== String(f.def) && (o[2] == null || o[2] > 0));
    if (!opts.length) return '';
    return `<optgroup label="${_lhE(f.label == null ? f.k : f.label)}">${opts.map(o =>
      `<option value="${_lhE(JSON.stringify([String(f.k), String(o[0])]))}">${_lhE(_lhOptWords(o))}</option>`).join('')}</optgroup>`;
  }).filter(Boolean);
  if (!groups.length) return '';
  const t = _lhT('lh_add_title');
  return `<label class="lh-add" title="${_lhE(t)}">${_lhIc('plus')}<span>${_lhE(_lhT('lh_add'))}</span><select class="reg-chip-sel" data-lh-add data-sm-groups aria-label="${_lhE(t)}"><option value="" selected disabled hidden></option>${groups.join('')}</select></label>`;
}
function lhChipsHtml(seat){
  const pg = _lhPage(seat) || {};
  const fs = (typeof pg.filters === 'function') ? (pg.filters() || []) : [];
  const lead = (typeof pg.lead === 'function') ? (pg.lead() || '') : '';
  const chips = fs.filter(_lhApplied).map(lhChipHtml).join('');
  const add = lhAddHtml(seat, fs);
  const right = (typeof pg.right === 'function') ? (pg.right() || '') : '';
  const lcSeat = pg.lcSeat || seat;
  const cols = LC_PAGES[lcSeat] ? lcBtnHtml(lcSeat) : '';
  if (!lead && !chips && !add && !right && !cols) return '';
  return `<div class="lh-chips" data-lh-chips>${_lhOwn('lead', lead)}${chips}${add}<span class="lh-sp"></span>${_lhOwn('right', right)}${_lhOwn('cols', cols)}</div>`;
}

/* ---- THE HEAD, IN ONE OF THREE FRAMES (no card inside a card) ----
   'card'  the page draws no head of its own: the white card, its title row
           (o.top, a whole `.ph-top` element of the page's own; or o.title ·
           o.facts · o.acts · o.seg in a plain one), then the rows;
   'foot'  under the shared head (#page-head): the card's lower half;
   'rows'  inside a card the page already draws: the rows alone. */
function lhRowsHtml(seat, o){
  return lhBoxHtml(seat, o) + lhTabsHtml(seat) + lhChipsHtml(seat);
}
function lhHtml(seat, o){
  const opt = o || {};
  const frame = opt.frame || 'card';
  const cls = opt.cls ? ' ' + _lhE(opt.cls) : '';
  const at = `data-lh-seat="${_lhE(seat)}"`;
  const rows = lhRowsHtml(seat, opt);
  if (frame === 'rows') return `<div class="lh lh-rows${cls}" ${at}>${rows}</div>`;
  if (frame === 'foot') return `<div class="sap-band ph-foot lh${cls}" ${at}>${rows}</div>`;
  const top = opt.top != null ? opt.top
    : `<div class="ph-top lh-top">${opt.title || ''}${opt.facts || ''}<span class="lh-sp"></span>${opt.acts || ''}${opt.seg || ''}</div>`;
  return `<div class="sap-band ph-card lh${cls}" ${at}>${top}${rows}</div>`;
}
/* a row that holds a part that stands is patched where it is: the row and the
   part are never moved (a move would drop the focus), the rest is the fresh row */
function _lhPatchRow(o, f, kept){
  Array.from(o.attributes).forEach(a => { if (!f.hasAttribute(a.name)) o.removeAttribute(a.name); });
  Array.from(f.attributes).forEach(a => { if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value); });
  const parts = {}, stand = new Set();
  kept.forEach(p => { const r = _lhPartOf(o, p); if (r){ parts[p] = r; [r.start, ...r.nodes, r.end].forEach(x => stand.add(x)); } });
  Array.from(o.childNodes).forEach(x => { if (!stand.has(x)) o.removeChild(x); });
  let ref = o.firstChild;
  const fk = Array.from(f.childNodes);
  for (let i = 0; i < fk.length; i++){
    const x = fk[i], m = x.nodeType === 8 ? /^lh:(\w+):/.exec(x.data) : null;
    if (m && parts[m[1]]){
      ref = parts[m[1]].end.nextSibling;
      while (i < fk.length && !(fk[i].nodeType === 8 && fk[i].data === 'lh/' + m[1])) i++;
      continue;
    }
    o.insertBefore(x, ref);
  }
}
/* THE NUMBERS FOLLOW THE WORDS, THE CARET STAYS: redraws ONLY the head's own
   parts of every head of this seat (its tabs, its chips, "+ Filter") — never
   the box, and never a page's own part whose html is unchanged (A PAGE'S OWN
   PARTS STAND, above): a row that holds a part that stands is patched in
   place, so neither the part nor the row is ever moved. A list left open on a
   control that has left the page is closed (a pick would set a select nobody
   hears). Returns how many heads it found. */
function lhHeadSync(seat){
  if (_lhSoon[seat] != null){ if (typeof clearTimeout === 'function') clearTimeout(_lhSoon[seat]); delete _lhSoon[seat]; }
  if (typeof document === 'undefined' || !document.querySelectorAll) return 0;
  const pg = _lhPage(seat);
  let n = 0;
  document.querySelectorAll(`[data-lh-seat="${_lhSel(seat)}"]`).forEach(head => {
    const kids = Array.from(head.children), row = (list, cls) => list.find(el => el.classList.contains(cls)) || null;
    const box = row(kids, 'lh-ask'), oT = row(kids, 'reg-views'), oC = row(kids, 'lh-chips');
    const tmp = document.createElement('div');
    tmp.innerHTML = lhTabsHtml(seat) + lhChipsHtml(seat);
    const fresh = Array.from(tmp.children), fT = row(fresh, 'reg-views'), fC = row(fresh, 'lh-chips');
    const inEither = (p, a, b) => _lhPartOf(a, p) || _lhPartOf(b, p);
    const keptIn = (o, f) => new Set(o && f ? LH_OWN.filter(p => { const a = _lhPartOf(o, p), b = _lhPartOf(f, p); return a && b && a.hash === b.hash; }) : []);
    const kT = keptIn(oT, fT), kC = keptIn(oC, fC);
    const redrawn = LH_PAGE_OWN.filter(p => !kT.has(p) && !kC.has(p) && (inEither(p, oT, oC) || inEither(p, fT, fC)));
    let T = fT;
    if (kT.size){ _lhPatchRow(oT, fT, kT); T = oT; }
    else { if (fT) head.insertBefore(fT, oT || oC || (box ? box.nextSibling : null)); if (oT) oT.remove(); }
    if (kC.size) _lhPatchRow(oC, fC, kC);
    else { if (fC) head.insertBefore(fC, oC || (T ? T.nextSibling : (box ? box.nextSibling : null))); if (oC) oC.remove(); }
    if (redrawn.length && pg && typeof pg.wire === 'function') pg.wire(head, redrawn);
    n++;
  });
  if (typeof selectMenuFor === 'function' && typeof selectMenuClose === 'function'){
    const open = selectMenuFor();
    if (open && !open.isConnected) selectMenuClose();
  }
  const lcSeat = (pg && pg.lcSeat) || seat;
  if (n && _lcOpen === lcSeat) lcPlace(lcSeat);
  return n;
}
/* ONE RECOUNT PER PAUSE IN THE TYPING: every letter narrows the rows through
   the page's own setQuery at once, but the head's numbers (every tab's count,
   every filter's choices) are counted again only once the reader has stopped
   for LH_SYNC_QUIET_MS — the book is walked once per pause, not once per
   letter. Any direct lhHeadSync takes the one asked for. */
const LH_SYNC_QUIET_MS = 120;
const _lhSoon = {};
function lhHeadSyncSoon(seat){
  if (typeof setTimeout !== 'function') return lhHeadSync(seat);
  if (_lhSoon[seat] != null && typeof clearTimeout === 'function') clearTimeout(_lhSoon[seat]);
  _lhSoon[seat] = setTimeout(() => { delete _lhSoon[seat]; lhHeadSync(seat); }, LH_SYNC_QUIET_MS);
  return 0;
}

/* ---- THE FOOT ----
   "1–40 of 189 · Show 40 more" (the page's own page size, `step`); a list
   that draws every row says "1–n of n" and offers nothing. A live region, so
   a screen reader hears the count move; o.id keeps a page's own id on it
   (Contracts: "reg-showing"), o.cls its own clothes, o.extra a page's own
   note after it (a partial book). Show more is the page's spec.more,
   resolved by the button's own seat (data-lh-more), never by a head. */
function lhFootHtml(seat, shown, total, step, o){
  const opt = o || {};
  const t = Math.max(0, Number(total) || 0), s = Math.max(0, Math.min(t, Number(shown) || 0));
  const left = t - s;
  const k = (Number(step) > 0) ? Math.min(Number(step), left) : left;
  const range = _lhT('lh_range', { a: _lhN(t ? 1 : 0), b: _lhN(s), n: _lhN(t) });
  return `<div class="lh-foot${opt.cls ? ' ' + _lhE(opt.cls) : ''}"${opt.id ? ` id="${_lhE(opt.id)}"` : ''} data-lh-foot="${_lhE(seat)}" role="status" aria-live="polite"><span class="lh-range" data-lh-shown>${_lhE(range)}</span>${
    left > 0 ? ` · <button type="button" class="ui-link lh-more" data-lh-more="${_lhE(seat)}">${_lhE(_lhT('lh_more', { n: _lhN(k) }))}</button>` : ''}${opt.extra || ''}</div>`;
}
/* THE FOOT CHANGES IN PLACE (a live region is heard only when it CHANGES; a
   freshly inserted one is not read out): the one writer a page calls with
   the foot it stands on (`el`, a [data-lh-foot]) and the foot lhFootHtml just
   drew — its attributes and words are written into the node already on the
   page, and Show N more keeps the keyboard where it was. An empty `html`
   takes the foot away. Answers false (nothing done) without a foot to write
   into, so the page inserts the new one itself. */
function lhFootPut(el, html){
  if (!el || !el.isConnected || typeof document === 'undefined') return false;
  const h = String(html || '').trim();
  if (!h){ el.remove(); return true; }
  const t = document.createElement('template'); t.innerHTML = h;
  const n = t.content.firstElementChild;
  if (!n || !n.hasAttribute('data-lh-foot')) return false;
  const had = !!(document.activeElement && el.contains(document.activeElement) && document.activeElement.matches('[data-lh-more]'));
  [...el.attributes].forEach(a => { if (!n.hasAttribute(a.name)) el.removeAttribute(a.name); });
  [...n.attributes].forEach(a => { if (el.getAttribute(a.name) !== a.value) el.setAttribute(a.name, a.value); });
  if (el.innerHTML !== n.innerHTML) el.innerHTML = n.innerHTML;
  if (had){ const b = el.querySelector('[data-lh-more]'); if (b) try { b.focus({ preventScroll: true }); } catch (_){} }
  return true;
}
function lhMore(seat){
  const pg = _lhPage(seat);
  if (!pg || typeof pg.more !== 'function') return false;
  pg.more();
  return true;
}

/* ---- A QUESTION GOES TO THE PAGE'S OWN JAMBO ----
   spec.ask where the page names its own door (it answers false when it could
   not take the words); else the Jambo already on the screen (aiEmbeddedHere):
   the panel beside a list or Import's side → jlAsk; Home's dock → intelAsk,
   the dock opened first through its own door (aiGoEmbedded); else the side
   panel (openAI, then aiAskWords). A Jambo still answering takes nothing:
   that is SAID, and the words stay in the box. Returns where they went, or
   false. */
function _lhBusySay(){
  if (typeof toast === 'function') toast(_lhT('lh_busy'), 'warn');
  return false;
}
const _lhAiBusy = () => typeof ai === 'object' && !!ai && !!ai.busy;
function lhAsk(seat, words){
  const t = String(words == null ? '' : words).trim();
  if (!t) return false;
  const pg = _lhPage(seat) || {};
  if (typeof pg.ask === 'function') return pg.ask(t) === false ? _lhBusySay() : 'page';
  const here = (typeof aiEmbeddedHere === 'function') ? aiEmbeddedHere() : null;
  if (here === 'list' && typeof jlAsk === 'function'){
    if (_lhAiBusy()) return _lhBusySay();
    if (typeof aiGoEmbedded === 'function') aiGoEmbedded('list');
    /* answered IN the panel beside the list (Part 8's question 3 = A); words
       the panel could not take stay in the box, as it said */
    return jlAsk(t) === false ? false : 'list';
  }
  if (here === 'home' && typeof intelAsk === 'function'){
    if (typeof intel === 'object' && intel && intel.busy) return _lhBusySay();
    if (typeof aiGoEmbedded === 'function') aiGoEmbedded('home');
    intelAsk(t);
    return 'home';
  }
  if (typeof aiAskWords === 'function'){
    if (_lhAiBusy()) return _lhBusySay();
    if (typeof openAI === 'function') openAI();
    aiAskWords(t);
    return 'panel';
  }
  return false;
}
/* back to the box after a chip's × (an input, never a select); not after a
   finger or a pen, which would raise the iPad's keyboard over the list */
function lhBoxFocus(seat){
  if (typeof document === 'undefined' || _lhPress === 'touch' || _lhPress === 'pen') return false;
  const inp = document.querySelector(`[data-lh-seat="${_lhSel(seat)}"] input[data-lh-q]`);
  if (!inp) return false;
  try { inp.focus({ preventScroll: true }); } catch (_){ return false; }
  return true;
}

/* ---- COLUMNS: CHOOSE AND ORDER (round 19 as drawn: "Columns" on the list's
   head; "you choose and order the columns here"; moved here from
   js/views/customers.js with Part 8) ----
   A reader's own convenience, kept in this browser per page (never the
   record, never shared). The first column — who it is — is always there.
   One builder for every list that draws it: the page names its columns and
   how it draws again (LC_PAGES[seat] = { cols, repaint, hide?, off? }); `hide`
   names the columns hidden until the reader shows them; `off()` names the
   ones standing aside for now, each with its reason ({ key: why }). The pop-up follows
   PRESS IT AGAIN AND IT CLOSES; Esc and a press outside close it too. */
const LC_PAGES = {};
let _lcOpen = null;
const lcKey = seat => 'hati.v1.cols.' + seat;
function lcState(seat, keys){
  let v = null; try { v = JSON.parse(localStorage.getItem(lcKey(seat)) || 'null'); } catch (_){ v = null; }
  const order = (v && Array.isArray(v.order) ? v.order.filter(k => keys.includes(k)) : []);
  keys.forEach(k => { if (!order.includes(k)) order.push(k); });
  const pg = LC_PAGES[seat];
  const def = pg ? ((typeof pg.hide === 'function') ? pg.hide() : pg.hide) : null;
  const hidden = (v && Array.isArray(v.hidden)) ? v.hidden.filter(k => keys.includes(k))
    : (Array.isArray(def) ? def.filter(k => keys.includes(k)) : []);
  return { order, hidden };
}
function lcSave(seat, st){ try { if (st) localStorage.setItem(lcKey(seat), JSON.stringify(st)); else localStorage.removeItem(lcKey(seat)); } catch (_){} }
function lcShown(seat, keys){ const st = lcState(seat, keys); return st.order.filter(k => !st.hidden.includes(k)); }
function lcBtnHtml(seat){
  const open = _lcOpen === seat;
  return `<span class="lc-wrap"><button type="button" class="ui-btn ui-btn-sm lc-btn" data-lc-btn="${_lhE(seat)}" aria-haspopup="true" aria-expanded="${open ? 'true' : 'false'}" title="${_lhE(_lhT('cu_cols_title'))}">${_lhE(_lhT('cu_cols'))}</button>${open ? lcPopHtml(seat) : ''}</span>`;
}
function lcPopHtml(seat){
  const pg = LC_PAGES[seat]; if (!pg) return '';
  const cols = pg.cols(), keys = cols.map(c => c.k), st = lcState(seat, keys);
  const label = k => (cols.find(c => c.k === k) || {}).label || k;
  /* A COLUMN THAT STEPS ASIDE FOR NOW (pg.off() → { key: why }) is greyed
     with its reason, never a live tick that draws nothing; the reader's own
     choice for it is kept for when it comes back */
  let off = {}; try { off = (typeof pg.off === 'function' ? pg.off() : null) || {}; } catch (_){ off = {}; }
  return `<div class="lc-pop" role="group" aria-label="${_lhE(_lhT('cu_cols_title'))}" data-lc-pop="${_lhE(seat)}">
    <p class="lc-h">${_lhE(_lhT('cu_cols_title'))}</p>
    ${st.order.map((k, i) => `<div class="lc-row"><label class="lc-l${off[k] ? ' is-off' : ''}"${off[k] ? ` title="${_lhE(off[k])}"` : ''}><input type="checkbox" data-lc-k="${_lhE(k)}"${st.hidden.includes(k) ? '' : ' checked'}${off[k] ? ' disabled' : ''}><span>${_lhE(label(k))}</span></label>
      <button type="button" class="lc-mv" data-lc-up="${_lhE(k)}" aria-label="${_lhE(_lhT('cu_cols_up', { c: label(k) }))}" title="${_lhE(_lhT('cu_cols_up', { c: label(k) }))}"${i === 0 ? ' disabled' : ''}>${_lhIc('chevU')}</button>
      <button type="button" class="lc-mv" data-lc-down="${_lhE(k)}" aria-label="${_lhE(_lhT('cu_cols_down', { c: label(k) }))}" title="${_lhE(_lhT('cu_cols_down', { c: label(k) }))}"${i === st.order.length - 1 ? ' disabled' : ''}>${_lhIc('chevD')}</button></div>`).join('')}
    <div class="lc-foot"><button type="button" class="ui-link" data-lc-reset="${_lhE(seat)}">${_lhE(_lhT('cu_cols_reset'))}</button></div>
  </div>`;
}
/* the list hangs under its button, over the page — never cut by the card a
   short list ends early (the card clips what overflows it) */
function lcPlace(seat){
  const b = document.querySelector(`[data-lc-btn="${_lhSel(seat)}"]`), pop = document.querySelector(`[data-lc-pop="${_lhSel(seat)}"]`);
  if (!b || !pop) return;
  const r = b.getBoundingClientRect();
  pop.style.position = 'fixed';
  pop.style.top = Math.round(r.bottom + 6) + 'px';
  pop.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + 'px';
  pop.style.left = 'auto';
  pop.style.maxHeight = Math.max(160, window.innerHeight - r.bottom - 16) + 'px';
  pop.style.overflow = 'auto';
}
function lcRepaint(seat, focusSel){
  const pg = LC_PAGES[seat]; if (!pg) return;
  pg.repaint();
  if (_lcOpen === seat) lcPlace(seat);
  if (focusSel){ const el = document.querySelector(focusSel); if (el) try { el.focus({ preventScroll: true }); } catch (_){} }
}
/* THE LIST CARRIES ON AS YOU SCROLL (the drawing's note on Show more): the
   scroller's end draws the next page, as the foot's button does */
function lcScrollWire(host, seat){
  const sc = host && host.querySelector(`[data-lc-scroll="${_lhSel(seat)}"]`);
  if (!sc || sc.dataset.lcBound) return;
  sc.dataset.lcBound = '1';
  sc.addEventListener('scroll', () => {
    if (sc.scrollTop + sc.clientHeight < sc.scrollHeight - 24) return;
    if (host.querySelector(`[data-lh-more="${_lhSel(seat)}"]`)) lhMore(seat);
  }, { passive: true });
}
/* Columns' own rules, put on the page once for every list that draws it */
const LC_CSS = `
  /* Columns: the button at the head's end, its list under it */
  .lc-wrap{position:relative;display:inline-flex;}
  .lc-pop{position:absolute;right:0;top:calc(100% + 6px);z-index:30;min-width:240px;padding:8px;border:1px solid var(--color-divider);border-radius:var(--radius-lg);background:var(--color-surface);box-shadow:var(--shadow-md);}
  .lc-h{margin:2px 4px 6px;font-size:var(--t-meta);color:var(--color-neutral-600);}
  .lc-row{display:flex;align-items:center;gap:4px;padding:2px 4px;border-radius:var(--radius);}
  .lc-row:hover{background:var(--surface-2);}
  .lc-l{flex:1;display:flex;align-items:center;gap:8px;min-width:0;font-size:var(--t-body);color:var(--color-text);cursor:pointer;}
  .lc-l.is-off{color:var(--color-neutral-500);cursor:not-allowed;}
  .lc-mv{flex:none;width:24px;height:24px;display:grid;place-items:center;border:0;border-radius:var(--radius);background:none;color:var(--color-neutral-600);cursor:pointer;}
  .lc-mv:hover:not(:disabled){background:var(--color-surface);color:var(--accent-ink);}
  .lc-mv:disabled{opacity:.35;cursor:default;}
  .lc-foot{border-top:1px solid var(--color-divider);margin-top:6px;padding:6px 4px 2px;}
`;

/* ---- THE PRESSES: ONE SET, DELEGATED ON THE DOCUMENT, BOUND ONCE ----
   Each resolves the page at press time from the head the press is in
   ([data-lh-seat]) or, for the foot, from the button's own seat. A page that
   draws this head DELETES its own per-element listener for the same press. */
function _lhClick(e){
  const t = e.target && e.target.closest ? e.target : null; if (!t) return;
  const more = t.closest('[data-lh-more]');
  if (more){ lhMore(more.getAttribute('data-lh-more')); return; }
  const head = t.closest('[data-lh-seat]'); if (!head) return;
  const seat = head.getAttribute('data-lh-seat'), pg = _lhPage(seat); if (!pg) return;
  let b;
  /* a saved view's × and the view itself are read BEFORE the tab row's
     generic press, which would otherwise read a tab key it does not carry */
  if ((b = t.closest('[data-lh-saved-x]'))){ e.stopPropagation(); if (typeof pg.unsave === 'function') pg.unsave(b.getAttribute('data-lh-saved-x')); return; }
  if ((b = t.closest('[data-lh-saved]'))){ if (typeof pg.useSaved === 'function') pg.useSaved(b.getAttribute('data-lh-saved')); return; }
  if ((b = t.closest('[data-lh-save]'))){ if (typeof pg.save === 'function') pg.save(); return; }
  if ((b = t.closest('[data-lh-x]'))){
    const k = b.getAttribute('data-lh-x');
    const f = ((typeof pg.filters === 'function') ? (pg.filters() || []) : []).find(x => x && String(x.k) === k);
    if (f && typeof pg.apply === 'function'){ pg.apply({ [f.k]: f.def }); lhBoxFocus(seat); }
    return;
  }
  b = t.closest('[role="tab"]');
  if (b && pg.tabAttr && b.hasAttribute(pg.tabAttr) && b.closest('[data-lh-seat]') === head && typeof pg.tab === 'function')
    pg.tab(b.getAttribute(pg.tabAttr));
}
function _lhChange(e){
  const sel = e.target; if (!sel || !sel.matches) return;
  const isF = sel.matches('select[data-lh-f]'), isAdd = !isF && sel.matches('select[data-lh-add]');
  if (!isF && !isAdd) return;
  const head = sel.closest('[data-lh-seat]'); if (!head) return;
  const pg = _lhPage(head.getAttribute('data-lh-seat')); if (!pg || typeof pg.apply !== 'function') return;
  if (isF){ pg.apply({ [sel.getAttribute('data-lh-f')]: sel.value }); return; }
  let kv = null; try { kv = JSON.parse(sel.value); } catch (_){ kv = null; }
  if (Array.isArray(kv) && kv.length === 2) pg.apply({ [kv[0]]: kv[1] });
}
function _lhInput(e){
  const inp = e.target; if (!inp || !inp.matches || !inp.matches('input[data-lh-q]')) return;
  const head = inp.closest('[data-lh-seat]'); if (!head) return;
  const seat = head.getAttribute('data-lh-seat'), pg = _lhPage(seat); if (!pg) return;
  const w = inp.value;
  const now = (typeof pg.q === 'function') ? String(pg.q() == null ? '' : pg.q()) : '';
  /* a question narrows nothing: the list stands whole while it is typed, and
     the box holds it (_lhAskingNow) */
  if (lhIsQuestion(w)){ if (now && typeof pg.setQuery === 'function') pg.setQuery(''); }
  else if (typeof pg.setQuery === 'function') pg.setQuery(w);
  lhHeadSyncSoon(seat);
}
function _lhKey(e){
  if (e.key !== 'Enter' || e.isComposing) return;
  const inp = e.target; if (!inp || !inp.matches || !inp.matches('input[data-lh-q]')) return;
  const head = inp.closest('[data-lh-seat]'); if (!head) return;
  const seat = head.getAttribute('data-lh-seat'), pg = _lhPage(seat); if (!pg) return;
  const w = String(inp.value || '').trim();
  /* plain words stay a search: nothing is sent, nothing is spent */
  if (!lhIsQuestion(w)) return;
  e.preventDefault();
  if (!lhAsk(seat, w)) return;              /* said ('warn'); the words stay */
  inp.value = '';
  if (!inp.isConnected) return;
  const now = (typeof pg.q === 'function') ? String(pg.q() == null ? '' : pg.q()) : '';
  if (now && typeof pg.setQuery === 'function') pg.setQuery('');
  lhHeadSync(seat);
}
if (typeof document !== 'undefined' && document.addEventListener && typeof window !== 'undefined' && !window._lhWired){
  window._lhWired = true;
  /* Columns' rules on the page, once */
  try {
    if (document.head && !document.getElementById('lc-css')){
      const st = document.createElement('style'); st.id = 'lc-css'; st.textContent = LC_CSS; document.head.appendChild(st);
    }
  } catch (_){}
  /* Columns' presses (as they were in customers.js) */
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const b = t.closest('[data-lc-btn]');
    if (b){ const seat = b.getAttribute('data-lc-btn'); _lcOpen = _lcOpen === seat ? null : seat; lcRepaint(seat, `[data-lc-btn="${_lhSel(seat)}"]`); return; }
    const pop = t.closest('[data-lc-pop]');
    if (pop){
      const seat = pop.getAttribute('data-lc-pop'), pg = LC_PAGES[seat]; if (!pg) return;
      const keys = pg.cols().map(c => c.k), st = lcState(seat, keys);
      const mv = (k, d) => { const i = st.order.indexOf(k), j = i + d; if (i < 0 || j < 0 || j >= st.order.length) return false; st.order.splice(j, 0, st.order.splice(i, 1)[0]); return true; };
      const up = t.closest('[data-lc-up]'), dn = t.closest('[data-lc-down]');
      if (up && mv(up.getAttribute('data-lc-up'), -1)){ lcSave(seat, st); lcRepaint(seat, `[data-lc-up="${_lhSel(up.getAttribute('data-lc-up'))}"]`); return; }
      if (dn && mv(dn.getAttribute('data-lc-down'), 1)){ lcSave(seat, st); lcRepaint(seat, `[data-lc-down="${_lhSel(dn.getAttribute('data-lc-down'))}"]`); return; }
      if (t.closest('[data-lc-reset]')){ lcSave(seat, null); lcRepaint(seat, `[data-lc-btn="${_lhSel(seat)}"]`); }
      return;
    }
    if (_lcOpen){ const seat = _lcOpen; _lcOpen = null; lcRepaint(seat); }
  });
  document.addEventListener('change', e => {
    const cb = e.target && e.target.closest ? e.target.closest('[data-lc-k]') : null; if (!cb) return;
    const pop = cb.closest('[data-lc-pop]'); if (!pop) return;
    const seat = pop.getAttribute('data-lc-pop'), pg = LC_PAGES[seat]; if (!pg) return;
    const keys = pg.cols().map(c => c.k), st = lcState(seat, keys), k = cb.getAttribute('data-lc-k');
    st.hidden = cb.checked ? st.hidden.filter(x => x !== k) : st.hidden.concat(k);
    lcSave(seat, st); lcRepaint(seat, `[data-lc-k="${_lhSel(k)}"]`);
  });
  document.addEventListener('keydown', e => {
    _lhPress = 'key';
    if (e.key !== 'Escape' || !_lcOpen) return;
    const seat = _lcOpen; _lcOpen = null; e.stopPropagation(); lcRepaint(seat, `[data-lc-btn="${_lhSel(seat)}"]`);
  }, true);
  document.addEventListener('pointerdown', e => { _lhPress = e.pointerType || 'mouse'; }, true);
  /* the head's presses */
  document.addEventListener('click', _lhClick);
  document.addEventListener('change', _lhChange);
  document.addEventListener('input', _lhInput);
  document.addEventListener('keydown', _lhKey);
}

/* WHAT A PAGE REGISTERS (lhRegister(seat, spec), at its own render time):
     noun      the placeholder's word: lh_ph_<noun>_one/_other (default: the seat)
     total()   the page's book at rest, for "… across N …"
     q() / setQuery(words)   the page's OWN query key; setQuery repaints the rows only.
               Every OTHER door that writes that key (the top bar's search, a
               lander, a chip handed in) calls lhBoxSet(seat, words), so the box
               shows it and a question standing there goes
     boxId, boxAttrs         the box's id and the page's own attributes on it
     tabAttr   the page's existing tab attribute; tabs() → [{k,label,n,keep,title}]
     tab(k) / tabNow() / tabsLabel / tabsAfter()
     saved() → [{id,label,on}], useSaved(id), unsave(id), save()   (Contracts)
     lead()    a chip a door handed the list, drawn first
     (lead, right and tabsAfter STAND across lhHeadSync while their html is
      unchanged, listeners and all; one whose html changed is drawn afresh
      and wire(head, parts) is called, parts naming which: a control whose
      words follow the list binds there, or is delegated)
     wire(head, parts)  binds the page's own controls in a part drawn afresh
     filters() → [{k,label,title,cur,def,opts:[[v,label,n]]}]; apply({k:v})
     right()   the page's own controls at the chip row's end
     lcSeat    Columns' seat when it is not the page's own
     more()    Show N more
     ask(text) the page's own Jambo door (answers false when it could not take it) */
Object.assign(window, { LH_PAGES, lhRegister, lhIsQuestion, LH_ASK_WORDS, LH_ASK_PAIRS, lhBoxHtml, lhSavedHtml, lhTabsHtml, lhChipHtml, lhAddHtml, lhChipsHtml,
  lhRowsHtml, lhHtml, lhHeadSync, lhHeadSyncSoon, LH_SYNC_QUIET_MS, lhBoxSet, lhFootHtml, lhFootPut, lhMore, lhAsk, lhBoxFocus,
  LC_PAGES, LC_CSS, lcKey, lcState, lcSave, lcShown, lcBtnHtml, lcPopHtml, lcPlace, lcRepaint, lcScrollWire });
