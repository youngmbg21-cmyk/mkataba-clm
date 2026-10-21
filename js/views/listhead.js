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
   like an open pop-up: whether Columns is open, the question being typed in a
   box (so a repaint never loses it), and what the last press was made with.

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
/* TRANSIENT, NEVER KEPT: the question a reader is typing in a seat's box —
   it narrows nothing, so the page's own query is empty while it stands, and
   a repaint of the head draws it back rather than losing it */
const _lhAsking = {};
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
  const q = Object.prototype.hasOwnProperty.call(_lhAsking, seat) ? _lhAsking[seat] : ((typeof pg.q === 'function') ? pg.q() : '');
  const extra = Object.entries(Object.assign({}, pg.boxAttrs || {}, opt.attrs || {}))
    .filter(([k, v]) => /^[a-z][\w-]*$/i.test(k) && v != null && v !== false)
    .map(([k, v]) => v === true ? ` ${k}` : ` ${k}="${_lhE(v)}"`).join('');
  return `<label class="lh-ask" title="${_lhE(_lhT('lh_box_title'))}">${_lhIc('search')}<input type="search" id="${_lhE(id)}" data-lh-q autocomplete="off" spellcheck="false" placeholder="${_lhE(ph)}" value="${_lhE(q == null ? '' : q)}" aria-label="${_lhE(_lhT('lh_box_label'))}"${extra}></label>`;
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
  const after = lhSavedHtml(seat) + ((typeof pg.tabsAfter === 'function') ? (pg.tabsAfter() || '') : '');
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
  return `<div class="lh-chips" data-lh-chips>${lead}${chips}${add}<span class="lh-sp"></span>${right}${cols}</div>`;
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
/* THE NUMBERS FOLLOW THE WORDS, THE CARET STAYS: rewrites ONLY the tab row
   and the chip row of every head of this seat — never the box — so typing
   keeps its caret while the counts move. Returns how many heads it found. */
function lhHeadSync(seat){
  if (typeof document === 'undefined' || !document.querySelectorAll) return 0;
  let n = 0;
  document.querySelectorAll(`[data-lh-seat="${_lhSel(seat)}"]`).forEach(head => {
    const kids = Array.from(head.children);
    const old = kids.filter(el => el.classList.contains('reg-views') || el.classList.contains('lh-chips'));
    const box = kids.find(el => el.classList.contains('lh-ask'));
    const tmp = document.createElement('div');
    tmp.innerHTML = lhTabsHtml(seat) + lhChipsHtml(seat);
    const anchor = old.length ? old[0] : (box ? box.nextSibling : null);
    Array.from(tmp.children).forEach(el => head.insertBefore(el, anchor));
    old.forEach(el => el.remove());
    n++;
  });
  const pg = _lhPage(seat), lcSeat = (pg && pg.lcSeat) || seat;
  if (n && _lcOpen === lcSeat) lcPlace(lcSeat);
  return n;
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
    jlAsk(t);
    return 'list';
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
   how it draws again (LC_PAGES[seat] = { cols, repaint, hide? }); `hide`
   names the columns hidden until the reader shows them. The pop-up follows
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
  return `<div class="lc-pop" role="group" aria-label="${_lhE(_lhT('cu_cols_title'))}" data-lc-pop="${_lhE(seat)}">
    <p class="lc-h">${_lhE(_lhT('cu_cols_title'))}</p>
    ${st.order.map((k, i) => `<div class="lc-row"><label class="lc-l"><input type="checkbox" data-lc-k="${_lhE(k)}"${st.hidden.includes(k) ? '' : ' checked'}><span>${_lhE(label(k))}</span></label>
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
  if (lhIsQuestion(w)){
    /* a question narrows nothing: the list stands whole while it is typed */
    _lhAsking[seat] = w;
    if (now && typeof pg.setQuery === 'function') pg.setQuery('');
  } else {
    delete _lhAsking[seat];
    if (typeof pg.setQuery === 'function') pg.setQuery(w);
  }
  lhHeadSync(seat);
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
  delete _lhAsking[seat];
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
     q() / setQuery(words)   the page's OWN query key; setQuery repaints the rows only
     boxId, boxAttrs         the box's id and the page's own attributes on it
     tabAttr   the page's existing tab attribute; tabs() → [{k,label,n,keep,title}]
     tab(k) / tabNow() / tabsLabel / tabsAfter()
     saved() → [{id,label,on}], useSaved(id), unsave(id), save()   (Contracts)
     lead()    a chip a door handed the list, drawn first
     filters() → [{k,label,title,cur,def,opts:[[v,label,n]]}]; apply({k:v})
     right()   the page's own controls at the chip row's end
     lcSeat    Columns' seat when it is not the page's own
     more()    Show N more
     ask(text) the page's own Jambo door (answers false when it could not take it) */
Object.assign(window, { LH_PAGES, lhRegister, lhIsQuestion, LH_ASK_WORDS, LH_ASK_PAIRS, lhBoxHtml, lhSavedHtml, lhTabsHtml, lhChipHtml, lhAddHtml, lhChipsHtml,
  lhRowsHtml, lhHtml, lhHeadSync, lhFootHtml, lhMore, lhAsk, lhBoxFocus,
  LC_PAGES, LC_CSS, lcKey, lcState, lcSave, lcShown, lcBtnHtml, lcPopHtml, lcPlace, lcRepaint, lcScrollWire });
