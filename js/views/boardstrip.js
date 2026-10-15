/* ============================================================
   THE LIFELINE STRIP — A CONTRACT BROUGHT UP ON THE BOARD
   (the overnight work order, step 8; owner's "Go", 14 Oct 2026;
   docs/WORKORDER-one-page-finish.md, drawn as version 4 of
   docs/WORKORDER-one-page-finish-strip.html)
   ============================================================
   The owner, in his own words: "when you ask bring up contract x, it should
   come to the screen like another strip like the KPI charts we have
   designed; in the chart should be the overview, based on the information
   entered when uploading the contract; it will have the three dots for a drop
   down which is where Where we are and History will be" — "make better use of
   the card, taller so it is not cramped; what Jambo read on upload at the
   bottom" — "duties should be called obligations and can be a lot, so they go
   in a scroll so the card is not taller than it needs to be".

   ONE DOOR: "Bring up MK-…" (Jambo's box on the Board and beside the paper —
   hbBringOf reads it there before any model —, its chip, ⌘K, a row pressed on
   the Board) and every door that opened the contract room (setView('workspace')
   asks roomRetiredLand first) land here: a strip below Today's insights,
   newest first. Several may stand; × closes one; Keep keeps it past today.

   EVERYTHING IS READ, NOTHING IS INVENTED. Every figure and term comes off a
   reading the rest of HaTi already makes (contractCurrency, effectiveExpiry
   through ov2Model, renewalWindow, ovEssRestCells, detailsOf, the obligation
   readers, riskItemsOf / riskOpenOf / riskTitleOf, deviationSummary, the
   stored brief, c.datedWindows, dealStands, negWhoseMove). A fact the record
   does not hold is said: amber where it is owed before signing, a dash where
   it is simply unknown. Nothing here spends or writes (Ask why puts a
   question in Jambo's box, ready, and says what it costs on its hover).

   ITS PAGES (the ⋯ menu): Overview (the Lifeline), Where we are (standsHtml,
   the one builder), History (the room's own trail builder, the Board as its
   host) and Details (the room's Overview sheet itself, hosted here so its
   Edit, Fill from document, parties, filing, renewal and related agreements
   are not lost with the room). Hosts that their own painter fills carry
   data-hb-own, so a Board repaint keeps what is typed in them.
   ============================================================ */

const BS_PAGES = ['ov', 'where', 'hist', 'details'];
/* the pages ⋯ lists; Details is reached from Key terms' own Edit */
const BS_MENU_PAGES = ['ov', 'where', 'hist'];
/* strips standing at once: the oldest one not kept goes first */
const BS_MAX = 6;
/* the obligations box shows about seven rows, then scrolls inside itself
   (.bs-obs, --bs-ob-rows in the sheet) */
/* the three label lanes over the life line, and its measures */
const BS_LANES = 3;
const BS_CHART_H = 168;

let _bsMenu = null;        /* the strip whose ⋯ is open (one at a time) */
let _bsArrive = null;      /* the strip just brought up: lit once */
let _bsChartW = 0;         /* the width the life line was last drawn for */
let _bsAsked = new Set();  /* light rows already asked for in full, this sitting */
let _bsDone = new Set();   /* …and answered: the waiting ring stops even where the read came back partial */

const bsE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const bsT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const bsTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : k;
const _bsDay0 = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; };
const _bsDD = 86400000;
function bsToday(){ return (typeof todayISO === 'function') ? todayISO() : ''; }
/* a day as a person says it, in their language: "1 Jan 2027" */
function bsDay(d){
  const x = (d instanceof Date) ? d : _bsDay0(d);
  if (!x || isNaN(x)) return '';
  try { return x.toLocaleDateString((typeof langLocale === 'function') ? langLocale() : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  catch (_){ return x.toISOString().slice(0, 10); }
}
function bsContract(id){ try { return (typeof getContract === 'function') ? getContract(id) : null; } catch (_){ return null; } }
function bsRef(c){ return (typeof contractRef === 'function') ? contractRef(c) : String((c && c.id) || ''); }
function bsPhone(){ return typeof window !== 'undefined' && ((window.mPhone && mPhone()) || (window.innerWidth && window.innerWidth < 768)); }

/* ---- THE STRIPS, AS THIS PERSON LEFT THEM ----
   hbS().strips, cleaned by the Board's own reader (hbS): [{id, page, kept,
   day, at}]. A strip not kept belongs to the day it was brought up; Keep
   keeps it until it is closed — the insight panels' rule. */
function bsStrips(){
  const s = (typeof hbS === 'function') ? hbS() : null;
  if (!s) return [];
  if (!Array.isArray(s.strips)) s.strips = [];
  return s.strips;
}
function bsStrip(id){ return bsStrips().find(x => String(x.id) === String(id)) || null; }
/* one History and one Details on the Board at a time: their builders own
   fixed ids (#hist-q, #kt-ov-terms), so a second would answer for the first */
function bsOnePage(st){
  if (st.page !== 'hist' && st.page !== 'details') return;
  bsStrips().forEach(x => { if (x !== st && x.page === st.page) x.page = 'ov'; });
}

/* ---- BRING IT UP (the one door) ----
   On the Board, newest first, the Board turned to its book (a contract's view
   would hide the strips), lit once and brought into view. A light row is
   loaded whole behind it: the brief and the trail ride the heavy record. */
function hbStripBring(id, page, opts){
  const c = bsContract(id); if (!c) return false;
  if (bsPhone() || typeof hbS !== 'function' || typeof hbSave !== 'function') return false;
  const o = opts || {};
  /* THE CONTRACT IN HAND: the one brought up is the one every door names
     next (the list's selected row, the bell's own contract), exactly as the
     room's door set it before it retired (openWorkspace) */
  if (window.state){ state.activeId = c.id; state.selId = c.id; }
  const s = hbS(), list = bsStrips();
  let st = bsStrip(c.id);
  if (st) list.splice(list.indexOf(st), 1);
  else st = { id: String(c.id), page: 'ov', kept: false };
  st.page = BS_PAGES.includes(page) ? page : 'ov';
  st.day = bsToday();
  try { st.at = new Date().toLocaleTimeString((typeof langLocale === 'function') ? langLocale() : undefined, { hour: '2-digit', minute: '2-digit' }); } catch (_){ st.at = ''; }
  list.unshift(st);
  bsOnePage(st);
  /* past the cap the oldest strip not kept steps off; a kept one stays */
  while (list.length > BS_MAX){ const i = list.map(x => !!x.kept).lastIndexOf(false); if (i < 0) break; list.splice(i, 1); }
  if (o.record && typeof ovRecordOpen === 'function') try { ovRecordOpen(c); } catch (_){}
  _bsArrive = st.id; _bsMenu = null;
  if (typeof hbCvSet === 'function') hbCvSet('book', null);
  hbSave();
  if (window.state && state.view === 'dashboard' && document.getElementById('hb-board')){
    /* the face turns through its own door (it repaints what it shows), then the Board */
    if (s.face !== 'board' && typeof hbSetFace === 'function') hbSetFace('board');
    if (typeof hbPaintBoard === 'function') hbPaintBoard();
  } else { s.face = 'board'; hbSave(); if (typeof setView === 'function') setView('dashboard'); }
  bsShow(st.id);
  bsLoad(c);
  return true;
}
/* the whole record, once per contract per sitting; the strip is drawn again
   when it lands. Asked for EVERY strip drawn (bsPaintHosts), not only the one
   just brought up: a refresh brings the strips back from this person's store
   onto a light list, and a strip that never asked turned its ring for ever. */
function bsLoad(c){
  if (!c || !c._light || c._loaded || typeof ensureFull !== 'function' || _bsAsked.has(String(c.id))) return;
  const id = String(c.id);
  _bsAsked.add(id);
  Promise.resolve(ensureFull(c)).then(() => { _bsDone.add(id); if (bsStrip(id)) bsRepaint(); }, () => { _bsAsked.delete(id); });
}
function bsShow(id){
  const el = document.getElementById('bs-strip-' + id), host = document.getElementById('hb-board');
  if (!el || !host) return;
  if (typeof hbShowCard === 'function') hbShowCard(host, el, { lit: false });
  const top = el.getBoundingClientRect().top - host.getBoundingClientRect().top;
  if (top > 12 || top < 0) host.scrollTop += top - 12;
}
function bsRepaint(){
  if (!(window.state && state.view === 'dashboard' && document.getElementById('hb-board'))) return;
  if (typeof hbS === 'function' && hbS().face !== 'board') return;
  if (typeof hbPaintBoard === 'function') hbPaintBoard();
}
/* a save, a reading landing or a dialog closing over Home repaints what the
   strips show (renderWorkspace's own dashboard branch calls this) */
function bsRefresh(){ if (bsStrips().length) bsRepaint(); }
function bsStripPage(id, page){
  const st = bsStrip(id); if (!st || !BS_PAGES.includes(page)) return false;
  st.page = page; bsOnePage(st); _bsMenu = null;
  if (typeof hbSave === 'function') hbSave();
  bsRepaint(); bsShow(st.id);
  const c = bsContract(id); if (c) bsLoad(c);
  return true;
}
function bsStripClose(id){
  const list = bsStrips(), st = bsStrip(id); if (!st) return false;
  list.splice(list.indexOf(st), 1); if (_bsMenu === st.id) _bsMenu = null;
  if (typeof hbSave === 'function') hbSave();
  bsRepaint(); return true;
}
function bsStripKeep(id){
  const st = bsStrip(id); if (!st || st.kept) return false;
  st.kept = true; if (typeof hbSave === 'function') hbSave();
  const c = bsContract(id);
  if (typeof toast === 'function') toast(bsT('bs_kept_toast', { ref: c ? bsRef(c) : id }), 'ok');
  bsRepaint(); return true;
}
/* LET IT GO: off the Board, kept or not — the insight panels' own verb */
function bsStripLetGo(id){ return bsStripClose(id); }

/* ---- THE ROOM RETIRES (step 8) ----
   Every door that opened the contract room lands on the contract's strip:
   on Overview, on Where we are when the door named 'stands', on Details when
   it named the Overview's own boxes. False on the phone (it keeps its own
   contract screens) and where the Board is not loaded (the harnesses): the
   caller opens the room as before. */
function roomRetiredLand(id, tab){
  if (bsPhone()) return false;
  if (typeof hbS !== 'function' || typeof hbPaintBoard !== 'function') return false;
  const page = tab === 'stands' ? 'where' : tab === 'details' ? 'details' : tab === 'history' ? 'hist' : 'ov';
  return hbStripBring(id, page);
}

/* ============================================================
   THE READINGS — counting is not drawing (the Insights panels' rule)
   ============================================================ */
function bsMoneyOk(){ return (typeof canViewValues !== 'function') || !!canViewValues(); }
function bsOwedKeys(c){
  let d = null; try { d = (typeof detailsOf === 'function') ? detailsOf(c) : null; } catch (_){ d = null; }
  return new Set(((d && d.items) || []).filter(x => x.open).map(x => x.key));
}
function bsTermWords(a, b){
  if (!a || !b || b <= a) return '';
  const months = Math.round((b - a) / _bsDD / 30.4375);
  if (months < 1) return bsTn('bs_k_term_d', Math.round((b - a) / _bsDD), { n: Math.round((b - a) / _bsDD) });
  if (months % 12 === 0) return bsTn('bs_k_term_y', months / 12, { n: months / 12 });
  if (months < 24) return bsTn('bs_k_term_m', months, { n: months });
  const y = Math.round(months / 12 * 10) / 10;
  return bsTn('bs_k_term_y', y, { n: y.toLocaleString((typeof langLocale === 'function') ? langLocale() : undefined) });
}
function bsMoney(n, c){
  const cur = (typeof contractCurrency === 'function') ? contractCurrency(c) : '';
  return (typeof fmtMoneyShortIn === 'function') ? fmtMoneyShortIn(n, cur) : `${cur} ${Math.round(n)}`;
}
/* the obligations, next first: open ones by their due day (a day missing
   last), then the done ones */
function bsObRows(c){
  const today = bsToday();
  const list = Array.isArray(c && c.obligations) ? c.obligations.filter(o => o && (o.desc || o.title)) : [];
  const due = o => (typeof obligationDue === 'function') ? obligationDue(o) : (o.due || null);
  const state0 = o => (typeof obState === 'function') ? obState(o) : (o.status === 'done' ? 'done' : 'open');
  const theirs = o => (typeof obligationParty === 'function') ? obligationParty(o) === 'theirs' : o.party === 'theirs';
  const rows = list.map(o => ({ o, due: due(o), st: state0(o), theirs: theirs(o), what: String(o.desc || o.title || '').trim() }));
  const key = r => (r.st === 'done' ? '2' : '1') + (r.due || '9999-99-99');
  rows.sort((a, b) => key(a).localeCompare(key(b)));
  const next = rows.find(r => r.st !== 'done') || null;
  return { rows, next, ours: rows.filter(r => !r.theirs).length, theirs: rows.filter(r => r.theirs).length, today };
}
function bsWho(c, r){
  const ours = (typeof contractParty === 'function') ? contractParty(c) : '';
  return r.theirs ? (String(c.counterparty || '').trim() || bsT('home_no_counterparty')) : (ours || bsT('bs_ours'));
}
/* the negotiation, as a span on the line: from its first move to the
   signature (or to today while it is still open) */
function bsNegoSpan(c, M){
  const ats = [];
  ((c.negotiation && Array.isArray(c.negotiation.rounds)) ? c.negotiation.rounds : []).forEach(r => { const d = _bsDay0(r && r.at); if (d) ats.push(d); });
  /* a change's day as the trail reads it (negoTimeline: createdAt, else at) */
  (Array.isArray(c.changes) ? c.changes : []).forEach(ch => { const d = _bsDay0(ch && (ch.createdAt || ch.at)); if (d) ats.push(d); });
  if (!ats.length) return null;
  const a = ats.reduce((x, y) => (y < x ? y : x));
  /* still open: it runs to today, and a negotiation begun today is a day wide, never nothing */
  const b0 = M.signed || M.today;
  const b = (!M.signed && b0 <= a) ? new Date(+a + _bsDD) : b0;
  return b > a ? { a, b, open: !M.signed } : null;
}
/* THE ONE READING THE STRIP DRAWS — plain data, no markup */
function bsLifeData(c){
  let M = null; try { M = (typeof ov2Model === 'function') ? ov2Model(c) : null; } catch (_){ M = null; }
  const owed = bsOwedKeys(c);
  const O = bsObRows(c);
  const meta = (c && c.metadata) || {};
  const money = (typeof isMonetary === 'function') ? isMonetary(c) : true;
  const K = {};
  /* VALUE, and what it comes to a year where the term is known (arithmetic
     on the record's own value and dates; never a figure the record lacks) */
  const yrs = (M && M.start && M.end && M.end > M.start) ? (M.end - M.start) / _bsDD / 365.25 : 0;
  /* the deal AS AMENDED: a signed amendment that set the value governs it
     (effectiveTerm, the reading the register's value cell uses) */
  let ev = { v: Number(c.value), from: null }; try { if (typeof effectiveTerm === 'function'){ const e = effectiveTerm(c, 'value'); if (e && e.from && Number(e.v) > 0) ev = { v: Number(e.v), from: e.from }; } } catch (_){ ev = { v: Number(c.value), from: null }; }
  const amendRef = ev.from ? bsRef(ev.from) : '';
  if (!bsMoneyOk()) K.value = { n: bsT('bs_k_hidden'), sub: '' };
  else if (!money) K.value = { n: '—', sub: bsT('bs_k_value_nomoney') };
  else if (ev.v > 0) K.value = { n: bsMoney(ev.v, c),
    sub: [yrs >= 1 ? bsT('bs_k_value_year', { v: bsMoney(ev.v / yrs, c) }) : (amendRef ? '' : ((typeof fmtMoneyOf === 'function') ? fmtMoneyOf((typeof effectiveValueView === 'function') ? effectiveValueView(c) : c) : '')),
      amendRef ? bsT('bs_k_value_amended', { ref: amendRef }) : ''].filter(Boolean).join(' · '),
    tip: [yrs >= 1 ? bsT('bs_k_value_year_tip') : '', yrs >= 1 && amendRef ? bsT('bs_k_value_amended', { ref: amendRef }) : ''].filter(Boolean).join(' · ') };
  else K.value = owed.has('value') ? { n: bsT('bs_k_owed'), sub: bsT('bs_k_owed_sub'), tone: 'warn' } : { n: '—', sub: bsT('bs_k_unknown') };
  /* TERM */
  if (M && M.start && M.end) K.term = { n: bsTermWords(M.start, M.end) || '—', sub: bsT('bs_k_from', { d: bsDay(M.start) }) };
  else if (M && M.start) K.term = owed.has('expiry') ? { n: '—', sub: bsT('bs_k_from_noend_owed', { d: bsDay(M.start) }), tone: 'warn' } : { n: '—', sub: bsT('bs_k_from_noend', { d: bsDay(M.start) }) };
  else if (M && M.end) K.term = owed.has('effDate') ? { n: '—', sub: bsT('bs_k_ends_nostart_owed', { d: bsDay(M.end) }), tone: 'warn' } : { n: '—', sub: bsT('bs_k_ends_nostart', { d: bsDay(M.end) }) };
  else K.term = (owed.has('effDate') || owed.has('expiry')) ? { n: bsT('bs_k_owed'), sub: bsT('bs_k_owed_sub'), tone: 'warn' } : { n: '—', sub: bsT('bs_k_nodates') };
  /* NEXT OBLIGATION */
  if (O.next) K.next = { n: O.next.due ? bsDay(O.next.due) : bsT('bs_ob_nodue'), sub: O.next.what + ' · ' + bsWho(c, O.next), tone: O.next.st === 'overdue' ? 'warn' : '' };
  else K.next = { n: '—', sub: bsT(O.rows.length ? 'bs_k_next_none' : 'bs_ob_none_short') };
  /* NOTICE BY */
  const rt = Number(meta.renewalTermMonths) || 0;
  if (M && M.noticeBy){
    const left = Math.round((M.noticeBy - _bsDay0(O.today || bsToday())) / _bsDD);
    K.notice = { n: bsDay(M.noticeBy), sub: M.auto ? (rt ? bsTn('bs_k_notice_renews', rt, { n: rt }) : bsT('bs_k_notice_renews_plain')) : (M.end ? bsT('bs_k_notice_ends', { d: bsDay(M.end) }) : ''),
      tone: (left >= 0 && left <= ((typeof RENEWAL_WINDOW_DAYS === 'number') ? RENEWAL_WINDOW_DAYS : 90)) ? 'warn' : '' };
  } else K.notice = { n: '—', sub: bsT(M && M.end ? 'bs_k_notice_none' : 'bs_k_noend') };
  /* WHOSE MOVE, only where a negotiation exists (read RAW: a count never starts one) */
  const negoOn = !!(c.negotiation || (Array.isArray(c.changes) && c.changes.length));
  let D = null; try { D = (typeof dealStands === 'function' && negoOn) ? dealStands(c) : null; } catch (_){ D = null; }
  if (negoOn){
    let w = null; try { w = (typeof negWhoseMove === 'function') ? negWhoseMove(c) : null; } catch (_){ w = null; }
    const k = (w && w.k) || 'clear';
    K.move = { n: bsT(k === 'you' ? 'bs_k_move_you' : k === 'them' ? 'bs_k_move_them' : 'bs_k_move_none'),
      sub: D ? bsT('bs_k_move_sub', { r: D.round || 1, n: D.open || 0 }) : '', tone: k === 'you' ? 'warn' : '' };
  } else K.move = { n: '—', sub: bsT('bs_k_move_nonego') };
  /* THE LIFE LINE: what the record knows, nothing more */
  /* a repeat is projected only while the contract runs: past the end of a
     fixed term it would draw a date the record never owes (ov2Model projects
     to the line's own right edge, which lies past the end) */
  const occ = (M && M.occ ? M.occ : []).filter(x => !(x.projected && M.end && !M.auto && x.due > M.end));
  /* an obligation with no due day cannot be a dot: counted, and said */
  const undated = (Array.isArray(c.obligations) ? c.obligations : []).filter(o => o && (o.desc || o.title) && !_bsDay0(o.due)).length;
  const life = M ? { M, nego: bsNegoSpan(c, M), occ, undated } : null;
  /* KEY TERMS: our side, the signers, and the Overview's eight terms (one reading, ovEssRestCells) */
  let cells = []; try { cells = (typeof ovEssRestCells === 'function') ? (ovEssRestCells(c, (typeof ovSignMarks === 'function') ? ovSignMarks(c) : null) || []) : []; } catch (_){ cells = []; }
  const signers = ((typeof signerPlan === 'function') ? signerPlan(c) : (c.signerPlan || [])).filter(s => s && String(s.name || '').trim());
  /* who SIGNED, off the record, where no plan names them (a signed contract
     always knows; a dash there would say "unknown" of a known fact) */
  const signedBy = [];
  (Array.isArray(c.signatures) ? c.signatures : []).forEach(s => { const n = s && String(s.name || '').trim(); if (n && !signedBy.includes(n)) signedBy.push(n); });
  /* WHAT JAMBO READ ON UPLOAD: the stored readings, nothing spent */
  /* the risks still waiting on somebody (riskOpenOf, the one count), worst first */
  let risks = []; try { risks = (typeof riskOpenOf === 'function') ? (riskOpenOf(c) || []) : ((typeof riskItemsOf === 'function') ? (riskItemsOf(c) || []) : []); } catch (_){ risks = []; }
  const riskN = risks.length;
  let dev = null; try { dev = (typeof deviationSummary === 'function') ? deviationSummary(c) : null; } catch (_){ dev = null; }
  let det = null; try { det = (typeof detailsOf === 'function') ? detailsOf(c) : null; } catch (_){ det = null; }
  const tri = (typeof triageOf === 'function') ? triageOf(c) : null;
  const brief = c._brief || null;
  return { c, M, K, life, O, cells, signers, signedBy, risks, riskN, dev, det, tri, brief, owed,
    loading: !!(c._light && !c._loaded && !_bsDone.has(String(c.id)) && typeof API_MODE === 'function' && API_MODE()) };
}

/* ============================================================
   THE DRAWING
   ============================================================ */
const _bsChev = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>';
const _bsX = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>';
function bsTone(st){ return st === 'Signed' ? 'is-good' : st === 'Under Review' ? 'is-warn' : st === 'Declined' ? 'is-bad' : ''; }
function bsStripsHtml(){
  const list = bsStrips(); if (!list.length) return '';
  /* a strip about a contract this book no longer holds is let go quietly */
  const live = list.filter(st => bsContract(st.id));
  if (live.length !== list.length){ list.splice(0, list.length, ...live); if (typeof hbSave === 'function') hbSave(); }
  const html = live.map(bsStripHtml).join('');
  _bsArrive = null;
  return `<div class="bs-strips" id="bs-strips">${html}</div>`;
}
function bsStripHtml(st){
  const c = bsContract(st.id); if (!c) return '';
  const id = bsE(c.id), ref = bsE(bsRef(c));
  const page = BS_PAGES.includes(st.page) ? st.page : 'ov';
  const word = p => bsT(p === 'ov' ? 'tab_overview' : p === 'where' ? 'tab_where_we_are' : p === 'hist' ? 'tab_history' : 'bs_pg_details');
  const crumbs = page === 'ov' ? '' : `<span class="bs-crumbs"><button type="button" class="hb-link" data-bs-page="ov" data-bs-id="${id}">${_bsChev}${bsE(word('ov'))}</button><span aria-hidden="true">·</span><span>${bsE(word(page))}</span></span>`;
  const open = _bsMenu === String(c.id);
  const sub = { ov: 'bs_pg_ov_sub', where: 'bs_pg_where_sub', hist: 'bs_pg_hist_sub' };
  const rows = BS_MENU_PAGES.filter(p => p !== 'ov' || page !== 'ov').map(p => `<button type="button" role="menuitem" class="bs-mi${p === page ? ' is-here' : ''}" data-bs-page="${p}" data-bs-id="${id}"${p === page ? ' aria-current="page"' : ''}><b>${bsE(word(p))}</b><small>${bsE(bsT(sub[p]))}</small></button>`).join('');
  /* THE OLD CARD'S TWO READINGS STAY ONE PRESS AWAY: Analyze contract and
     Show on the map, the Board's own doors (data-hb-analyze, data-hb-map) */
  const more = `<hr><button type="button" role="menuitem" class="bs-mi" data-hb-analyze="${id}" title="${bsE(bsT('int_analyze_title'))}"><b>${bsE(bsT('int_analyze'))}</b></button>
    <button type="button" role="menuitem" class="bs-mi" data-hb-map="${id}" data-hb-what="${ref}"><b>${bsE(bsT('hb_c_on_map'))}</b></button>`;
  const menu = open ? `<div class="bs-menu" role="menu" id="bs-menu-${id}">${rows}${more}</div>` : '';
  const pill = `<span class="hb-chip ${bsTone(c.status)}">${bsE((typeof statusLabel === 'function') ? statusLabel(c.status) : c.status)}</span>`;
  const body = page === 'where' ? `<div class="bs-sec bs-host bs-where" data-hb-own data-bs-host="where" data-bs-cid="${id}" data-ds-cid="${id}"></div>`
    : page === 'hist' ? `<div class="bs-sec bs-host bs-hist" data-hb-own data-bs-host="hist" data-bs-cid="${id}"></div>`
    : page === 'details' ? `<div class="bs-sec bs-host bs-details" data-hb-own data-bs-host="details" data-bs-cid="${id}"></div>`
    : bsLifeHtml(c, st);
  return `<section class="hb-card bs-strip${_bsArrive === String(c.id) ? ' is-new' : ''}${open ? ' is-menu' : ''}" id="bs-strip-${id}" data-bs-id="${id}" data-bs-on="${page}" aria-label="${bsE(bsT('bs_aria', { ref: bsRef(c) }))}">
    <header class="hb-ch bs-head"><span class="hb-ct">${bsE(c.name || bsRef(c))}</span><span class="bs-ref">${ref}${c.counterparty ? ' · ' + bsE(c.counterparty) : ''}</span>${pill}${crumbs}<span class="hb-grow"></span>
      <span class="bs-dwrap"><button type="button" class="hb-ib bs-dots${open ? ' is-on' : ''}" data-bs-dots="${id}" aria-haspopup="menu" aria-expanded="${open}" aria-label="${bsE(bsT('bs_more', { ref: bsRef(c) }))}" title="${bsE(bsT('bs_more', { ref: bsRef(c) }))}">⋯</button>${menu}</span>
      <button type="button" class="hb-ib hb-x" data-bs-x="${id}" aria-label="${bsE(bsT('bs_close'))}" title="${bsE(bsT('bs_close'))}">${_bsX}</button></header>
    ${body}</section>`;
}

/* ---- THE OVERVIEW: who, five figures, the life line, terms and
   obligations, what Jambo read, and the foot ---- */
function bsLifeHtml(c, st){
  const D = bsLifeData(c);
  return `${bsIdKpiHtml(D)}${bsLifeSecHtml(D)}${bsTermsObsHtml(D)}${bsJamboHtml(D)}${bsFootHtml(D, st)}`;
}
function bsIdKpiHtml(D){
  const c = D.c, bits = [];
  const side = (typeof hbSideOf === 'function') ? hbSideOf(c) : null;
  if (c.counterparty) bits.push(side ? bsT('bs_id_role', { cp: `<b>${bsE(c.counterparty)}</b>`, role: bsE(bsT('bs_role_' + side)) }) : `<b>${bsE(c.counterparty)}</b>`);
  let type = ''; try { const cell = (typeof ktFieldCell === 'function') ? ktFieldCell(c, 'contractType', false, null) : null; type = cell ? String(cell[1] || '') : ''; } catch (_){ type = ''; }
  if (type) bits.push(type);
  const stream = (typeof regStreamName === 'function') ? regStreamName(c) : '';
  if (stream) bits.push(bsE(stream));
  const owner = (typeof contractOwnerName === 'function') ? contractOwnerName(c) : null;
  bits.push(owner ? bsT('bs_id_owner', { who: `<b>${bsE(owner)}</b>` }) : bsE(bsT('bs_id_noowner')));
  const made = c.createdAt || c._raisedAt || '';
  const up = (typeof isUpload === 'function') ? isUpload(c) : c.source === 'upload';
  if (made) bits.push(bsE(bsT(up ? 'bs_id_uploaded' : 'bs_id_created', { d: bsDay(String(made).slice(0, 10)) })));
  const fig = (k, label) => { const x = D.K[k];
    return `<div class="bs-kpi${x.tone ? ' is-' + x.tone : ''}" data-bs-kpi="${k}"><small>${bsE(bsT(label))}</small><b>${bsE(x.n)}</b><span title="${bsE(x.tip || x.sub || '')}">${bsE(x.sub || '')}</span></div>`; };
  return `<div class="bs-sec"><p class="bs-idline">${bits.join(' · ')}</p>
    <div class="bs-kpis">${fig('value', 'bs_k_value')}${fig('term', 'bs_k_term')}${fig('next', 'bs_k_next')}${fig('notice', 'bs_k_notice')}${fig('move', 'bs_k_move')}</div></div>`;
}
function bsLifeSecHtml(D){
  const L = D.life;
  if (!L) return '';
  const M = L.M, ours = D.O.ours, theirs = D.O.theirs;
  const termOn = !!(M.start && (M.end || true));
  const noticeOn = !!(M.noticeBy && M.end && M.noticeBy < M.end);
  const lg = [L.nego ? `<span><i class="bs-sw bs-sw-nego"></i>${bsE(bsT('bs_lg_nego'))}</span>` : '',
    termOn ? `<span><i class="bs-sw bs-sw-term"></i>${bsE(bsT('bs_lg_term'))}</span>` : '',
    noticeOn ? `<span><i class="bs-sw bs-sw-notice"></i>${bsE(bsT('bs_lg_notice'))}</span>` : '',
    `<span><i class="bs-sw bs-dot is-ours"></i>${bsE(bsT('bs_lg_ours', { n: ours }))}</span>`,
    `<span><i class="bs-sw bs-dot is-theirs"></i>${bsE(bsT('bs_lg_theirs', { n: theirs }))}</span>`].filter(Boolean).join('');
  return `<div class="bs-sec bs-life"><div class="bs-sec-h"><h5>${bsE(bsT('bs_life'))}</h5><span class="hb-grow"></span><div class="bs-lg">${lg}</div></div>
    ${bsChartSvg(D, _bsChartW || 820)}
    <p class="bs-cap">${bsE(bsCaption(D))}</p></div>`;
}
/* the one sentence under the line: the term, the renewal or the end, and
   the next obligation; a missing date is said, never guessed */
function bsCaption(D){
  const M = D.life.M, out = [];
  if (M.start && M.end) out.push(bsT('bs_cap_runs', { a: bsDay(M.start), b: bsDay(M.end) }));
  else if (M.start) out.push(bsT('bs_cap_from', { a: bsDay(M.start) }));
  else if (M.end) out.push(bsT('bs_cap_ends', { b: bsDay(M.end) }));
  else out.push(bsT(D.life.occ.length ? 'bs_cap_nodates' : 'bs_cap_nodates_none'));
  const rt = Number(((D.c.metadata) || {}).renewalTermMonths) || 0;
  if (M.end && M.noticeBy && M.noticeBy < M.end) out.push(M.auto
    ? (rt ? bsTn('bs_cap_renews', rt, { d: bsDay(M.noticeBy), n: rt }) : bsT('bs_cap_renews_plain', { d: bsDay(M.noticeBy) }))
    : bsT('bs_cap_notice', { d: bsDay(M.noticeBy) }));
  const nx = D.O.next;
  out.push(nx ? (nx.due ? bsT('bs_cap_next', { what: nx.what, who: bsWho(D.c, nx), d: bsDay(nx.due) }) : bsT('bs_cap_next_nodue', { what: nx.what, who: bsWho(D.c, nx) })) : bsT('bs_cap_next_none'));
  /* A CAP IS A FACT: what the legend counts but the line cannot draw is said */
  if (D.life.undated) out.push(bsTn('bs_cap_undated', D.life.undated, { n: D.life.undated }));
  return out.join(' ');
}
/* THE LIFE LINE, to scale, drawn at the card's own width so its words stay
   the Board's size (owner, 11 Oct 2026: a chart's words grew huge) */
function bsChartSvg(D, W0){
  const L = D.life, M = L.M, W = Math.max(420, Math.round(W0));
  const pad = 16, BAR = 92, DOT = 124, AX = 146;
  /* the line starts early enough, and runs late enough, for every dated
     obligation on the record: a dot the legend counts is a dot the line draws
     (a cap is a fact; an undated one is said in the caption) */
  const lo = [M.t0, L.nego && L.nego.a].concat((L.occ || []).map(x => x.due)).filter(Boolean).reduce((a, b) => (b < a ? b : a));
  const hi = (L.occ || []).filter(x => !x.projected && x.due).map(x => x.due).reduce((a, b) => (b > a ? b : a), M.t1);
  const t0 = new Date(+lo - 7 * _bsDD);
  const t1a = hi > M.t1 ? new Date(+hi + 21 * _bsDD) : M.t1;
  const t1 = t1a > t0 ? t1a : new Date(+t0 + 365 * _bsDD);
  const X = d => pad + ((d - t0) / (t1 - t0)) * (W - 2 * pad);
  /* a span the record holds is drawn however short: a day-old negotiation is a sliver, never nothing */
  const seg = (a, b, cls, t) => { if (!a || !b || b <= a) return ''; const x0 = Math.max(pad, X(a)), x1 = Math.min(W - pad, X(b)); if (x1 <= x0) return '';
    return `<rect class="${cls}" x="${(x0 + 1).toFixed(1)}" y="${BAR}" width="${Math.max(3, x1 - x0 - 2).toFixed(1)}" height="10" rx="2"><title>${bsE(t)}</title></rect>`; };
  const parts = [];
  if (L.nego) parts.push(seg(L.nego.a, L.nego.b, 'bs-seg-nego', bsT(L.nego.open ? 'bs_t_nego_open' : 'bs_t_nego', { a: bsDay(L.nego.a), b: bsDay(L.nego.b) })));
  const noticeOn = !!(M.noticeBy && M.end && M.noticeBy < M.end);
  if (M.start && M.end) parts.push(seg(M.start, noticeOn ? M.noticeBy : M.end, 'bs-seg-term', bsT('bs_t_term', { a: bsDay(M.start), b: bsDay(M.end) })));
  else if (M.start) parts.push(seg(M.start, t1, 'bs-seg-term is-open', bsT('bs_t_term_open', { a: bsDay(M.start) })));
  if (noticeOn) parts.push(seg(M.noticeBy, M.end, 'bs-seg-notice', bsT(M.auto ? 'bs_t_notice_renews' : 'bs_t_notice', { d: bsDay(M.noticeBy) })));
  if (M.end && M.auto) parts.push(seg(new Date(+M.end + _bsDD), M.t1 < t1 ? M.t1 : t1, 'bs-seg-renew', bsT('ov2_b_renewal_year')));
  /* the marks, labelled in three lanes where a label fits; one that cannot
     fit keeps its tick and its hover */
  const marks = [];
  if (M.signed) marks.push({ d: M.signed, l: bsT('bs_m_signed', { d: bsDay(M.signed) }) });
  if (M.start && !(M.signed && Math.abs(M.start - M.signed) < _bsDD)) marks.push({ d: M.start, l: bsT('bs_m_starts', { d: bsDay(M.start) }) });
  (M.bands || []).filter(b => b.win).forEach(b => marks.push({ d: b.a, l: `${b.l} · ${bsDay(b.a)}`, win: 1 }));
  if (noticeOn) marks.push({ d: M.noticeBy, l: bsT('bs_m_notice', { d: bsDay(M.noticeBy) }) });
  if (M.end) marks.push({ d: M.end, l: bsT('bs_m_ends', { d: bsDay(M.end) }), end: 1 });
  const today = { d: M.today, l: bsT('bs_m_today'), today: 1 };
  const all = [today].concat(marks).filter(m => m.d >= t0 && m.d <= t1).sort((a, b) => a.d - b.d);
  const laneEnd = new Array(BS_LANES).fill(-Infinity), cw = 6.4;
  const lanes = all.map(m => {
    const x = X(m.d), w = m.l.length * cw + 6;
    const anchorEnd = x + w > W - pad;
    const s0 = anchorEnd ? x - w : x, s1 = anchorEnd ? x : x + w;
    let lane = -1;
    for (let i = 0; i < BS_LANES; i++) if (laneEnd[i] < s0 - 6){ lane = i; break; }
    if (lane >= 0) laneEnd[lane] = s1;
    return { m, x, lane, anchorEnd };
  });
  const LY = [20, 44, 68];
  const labelSvg = lanes.map(({ m, x, lane, anchorEnd }) => {
    const tick = `<line class="bs-tick${m.today ? ' is-today' : ''}" x1="${x.toFixed(1)}" y1="${lane >= 0 ? LY[lane] + 5 : BAR - 8}" x2="${x.toFixed(1)}" y2="${m.today ? DOT + 10 : BAR - 2}"><title>${bsE(m.l)}</title></line>`;
    if (lane < 0) return tick;
    return tick + `<text class="bs-lab${m.today ? ' is-today' : ''}" x="${(x + (anchorEnd ? -4 : 4)).toFixed(1)}" y="${LY[lane]}" text-anchor="${anchorEnd ? 'end' : 'start'}">${bsE(m.l)}</text>`;
  }).join('');
  /* the obligations: ours and theirs, a repeat projected as a ring, a done one faded */
  const dots = (L.occ || []).filter(x => x.due >= t0 && x.due <= t1).map(x => {
    const cls = `bs-occ ${x.theirs ? 'is-theirs' : 'is-ours'}${x.projected ? ' is-proj' : ''}${x.done ? ' is-done' : ''}`;
    return `<circle class="${cls}" cx="${X(x.due).toFixed(1)}" cy="${DOT}" r="5.5"><title>${bsE(`${x.t || ''} · ${bsDay(x.due)}`)}</title></circle>`;
  }).join('');
  /* the axis: years where the line runs past one, else every third month */
  const ticks = [], span = (t1 - t0) / _bsDD;
  if (span > 540){ for (let y = t0.getUTCFullYear() + 1; y <= t1.getUTCFullYear(); y++) ticks.push({ d: new Date(Date.UTC(y, 0, 1)), l: String(y) }); }
  else { const d = new Date(Date.UTC(t0.getUTCFullYear(), t0.getUTCMonth() + 1, 1));
    while (d < t1){ if (d.getUTCMonth() % 3 === 0){ let l = ''; try { l = d.toLocaleDateString((typeof langLocale === 'function') ? langLocale() : 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (_){ l = d.toISOString().slice(0, 7); } ticks.push({ d: new Date(d), l }); } d.setUTCMonth(d.getUTCMonth() + 1); } }
  const axis = `<line class="bs-axis" x1="${pad}" y1="${AX}" x2="${W - pad}" y2="${AX}"/>` + ticks.map(t => { const x = X(t.d); if (x < pad + 20 || x > W - pad - 20) return '';
    return `<line class="bs-axis" x1="${x.toFixed(1)}" y1="${AX}" x2="${x.toFixed(1)}" y2="${AX + 5}"/><text class="bs-axl" x="${x.toFixed(1)}" y="${AX + 18}" text-anchor="middle">${bsE(t.l)}</text>`; }).join('');
  const aria = bsT('bs_life_aria', { a: bsDay(t0), b: bsDay(t1) });
  return `<svg class="bs-chart" data-bs-w="${W}" width="${W}" height="${BS_CHART_H}" viewBox="0 0 ${W} ${BS_CHART_H}" role="img" aria-label="${bsE(aria)}">${parts.join('')}${labelSvg}${dots}${axis}</svg>`;
}
function bsTermsObsHtml(D){
  const c = D.c;
  const row = (label, html, cls) => `<dt>${bsE(label)}</dt><dd${cls ? ` class="${cls}"` : ''}>${html}</dd>`;
  const ours = (typeof contractParty === 'function') ? contractParty(c) : '';
  const executed = (typeof negoExecuted === 'function') ? negoExecuted(c) : c.status === 'Signed';
  const sig = D.signers.length ? bsE(D.signers.map(s => String(s.name).trim()).join(' · '))
    : (executed ? (D.signedBy.length ? bsE(D.signedBy.join(' · ')) : '—') : bsE(bsT('bs_t_signers_none')));
  const skip = new Set(['contractType', 'value', 'term']);
  const terms = [row(bsT('bs_t_our'), ours ? bsE(ours) : '—', ''), row(bsT('bs_t_signers'), sig, (!D.signers.length && !executed) ? 'is-owed' : '')];
  (D.cells || []).forEach(cell => {
    if (!cell) return;
    const k = cell._key || '';
    if (skip.has(k)) return;
    const val = String(cell[1] || '').trim();
    const owedNow = cell[3] === 'amber' && !val;
    terms.push(row(String(cell[0] || '').replace(/<[^>]*>/g, ''), val ? val : (owedNow ? bsE(bsT('bs_t_owed')) : '—'), owedNow ? 'is-owed' : (cell[3] === 'amber' ? 'is-amber' : '')));
  });
  const edit = (typeof canEdit !== 'function' || canEdit()) ? `<button type="button" class="hb-link" data-bs-page="details" data-bs-id="${bsE(c.id)}">${bsE(bsT('bs_t_edit'))}</button>` : `<button type="button" class="hb-link" data-bs-page="details" data-bs-id="${bsE(c.id)}">${bsE(bsT('bs_t_more'))}</button>`;
  const O = D.O;
  const obRows = O.rows.map(r => `<tr${r === O.next ? ' class="is-next"' : ''}${r.st === 'done' ? ' data-done' : ''}><td>${bsE(r.what)}${r === O.next ? `<span class="bs-nx">${bsE(bsT('bs_ob_next'))}</span>` : ''}${r.st === 'overdue' ? `<span class="bs-late">${bsE(bsT('bs_ob_late'))}</span>` : ''}${r.st === 'done' ? `<span class="bs-done">${bsE(bsT('bs_ob_done'))}</span>` : ''}</td>
    <td class="bs-who"><i class="bs-dot ${r.theirs ? 'is-theirs' : 'is-ours'}" aria-hidden="true"></i>${bsE(bsWho(c, r))}</td><td class="bs-d">${r.due ? bsE(bsDay(r.due)) : bsE(bsT('bs_ob_nodue'))}</td></tr>`).join('');
  const obs = O.rows.length
    ? `<div class="bs-obs" tabindex="0" role="region" aria-label="${bsE(bsT('bs_ob_aria'))}"><table class="bs-ob"><thead><tr><th>${bsE(bsT('bs_ob_col_what'))}</th><th>${bsE(bsT('bs_ob_col_who'))}</th><th>${bsE(bsT('bs_ob_col_due'))}</th></tr></thead><tbody>${obRows}</tbody></table></div>`
    : `<p class="hb-quiet">${bsE(bsT('bs_ob_none'))}</p>`;
  return `<div class="bs-two"><div class="bs-sec"><div class="bs-sec-h"><h5>${bsE(bsT('bs_terms'))}</h5><span class="hb-grow"></span>${edit}</div><dl class="bs-dl">${terms.join('')}</dl></div>
    <div class="bs-sec"><div class="bs-sec-h"><h5>${bsE(bsTn('bs_ob', O.rows.length, { n: O.rows.length }))}</h5><span class="hb-grow"></span><span class="bs-note">${bsE(O.rows.length ? bsT('bs_ob_note', { a: O.ours, b: O.theirs }) : '')}</span></div>${obs}</div></div>`;
}
function bsJamboHtml(D){
  const c = D.c, id = bsE(c.id);
  const file = c.upload && c.upload.fileName ? String(c.upload.fileName) : '';
  const at = D.tri && D.tri.at ? bsDay(String(D.tri.at).slice(0, 10)) : '';
  const note = at ? bsT(file ? 'bs_jb_note' : 'bs_jb_note_nofile', { d: at, file }) : bsT('bs_jb_note_none');
  let brief = '';
  if (D.brief){ const line = (typeof triageBriefLine === 'function') ? triageBriefLine(D.brief) : '';
    brief = line ? bsE(line) + (D.brief.truncated ? ` <span class="hb-quiet">(${bsE(bsT('tri_cut'))})</span>` : '') : bsE(bsT('bs_jb_brief_none')); }
  else if (D.loading) brief = (typeof busyHtml === 'function') ? busyHtml(bsT('bs_jb_loading')) : bsE(bsT('bs_jb_loading'));
  else brief = bsE(bsT('bs_jb_brief_none'));
  const cell = (k, label, n, tone, items, go, goWord) => `<div class="bs-jcell" data-bs-jcell="${k}"><small>${bsE(bsT(label))}</small><b${tone ? ` class="is-${tone}"` : ''}>${bsE(n)}</b>${items.length ? `<ul>${items.map(x => `<li>${bsE(x)}</li>`).join('')}</ul>` : ''}${go ? `<button type="button" class="hb-link bs-go" data-bs-go="${go}" data-bs-id="${id}">${bsE(bsT(goWord))}</button>` : ''}</div>`;
  /* risks: the one count and the first titles, worst first */
  const titles = D.risks.slice(0, 3).map(it => { try { return (typeof riskTitleOf === 'function') ? riskTitleOf(it) : String(it.title || it.label || ''); } catch (_){ return ''; } }).filter(Boolean);
  const risks = cell('risks', 'bs_jb_risks', String(D.riskN), D.riskN ? 'warn' : '', D.riskN ? titles : [bsT('bs_jb_risks_none')], D.riskN ? 'risks' : '', 'bs_jb_risks_go');
  /* our standards: met · missing · differs, and "all met" only over a finished check */
  const dv = D.dev;
  const met = dv ? Math.max(0, dv.total - dv.dev - dv.miss) : 0;
  const stdN = !dv || !dv.total ? '—' : (dv.ok && dv.complete) ? bsT('bs_jb_std_all') : bsT('bs_jb_std_n', { k: met, n: dv.total });
  const stdItems = !dv || !dv.total ? [bsT('bs_jb_std_none')]
    : [dv.miss ? bsTn('bs_jb_std_miss', dv.miss, { n: dv.miss }) : '', dv.dev ? bsTn('bs_jb_std_dev', dv.dev, { n: dv.dev }) : '', (dv.ok && !dv.complete) ? bsT('bs_jb_std_part') : ''].filter(Boolean);
  const std = cell('std', 'bs_jb_std', stdN, dv && (dv.dev || dv.miss) ? 'warn' : '', stdItems, dv && dv.total ? 'std' : '', 'bs_jb_std_go');
  /* details to fill: the Details tab's own count (detailsOf) */
  const dt = D.det, left = dt && dt.live ? dt.left : 0;
  const labels = dt && dt.live ? dt.items.filter(x => x.open).slice(0, 3).map(x => x.label) : [];
  const det = cell('det', 'bs_jb_det', String(left), left ? 'warn' : '', left ? labels : [bsT('bs_jb_det_none')], left ? 'fill' : '', 'bs_jb_det_go');
  const O = D.O, first = O.rows.filter(r => r.due && r.st !== 'done').map(r => r.due).sort()[0];
  const ob = cell('ob', 'bs_jb_ob', String(O.rows.length), '', O.rows.length ? [bsT('bs_jb_ob_sides', { a: O.ours, b: O.theirs }), first ? bsT('bs_jb_ob_first', { d: bsDay(first) }) : ''].filter(Boolean) : [bsT('bs_jb_ob_none')], 'oblig', 'bs_jb_ob_go');
  return `<div class="bs-sec bs-jb"><div class="bs-sec-h"><h5>${bsE(bsT('bs_jb'))}</h5><span class="hb-grow"></span><span class="bs-note">${bsE(note)}</span></div>
    <p class="bs-brief">${brief}</p><div class="bs-jgrid">${risks}${std}${det}${ob}</div></div>`;
}
function bsFootHtml(D, st){
  const c = D.c, id = bsE(c.id);
  const K = (typeof hbCardData === 'function') ? (() => { try { return hbCardData(c); } catch (_){ return null; } })() : null;
  const q = !K ? bsT('hb_c_ask_risks', { name: c.name || bsRef(c) })
    : K.move === 'you' && K.holding && K.holding.length ? bsT('hb_c_ask_stuck', { cp: K.cp, name: K.name, clause: K.holding[0] })
    : K.expired ? bsT('hb_c_ask_past', { name: K.name }) : bsT('hb_c_ask_risks', { name: K.name });
  const meta = st.kept ? bsT('bs_kept_meta') : bsT('bs_brought', { t: st.at || '' });
  return `<div class="bs-foot"><div class="hb-acts">
      <button type="button" class="hb-btn is-sm" data-bs-open="${id}" title="${bsE(bsT('bs_open_tip'))}">${bsE(bsT('bs_open'))}</button>
      <button type="button" class="hb-btn is-sm" data-bs-keep="${id}"${st.kept ? ` disabled title="${bsE(bsT('bs_kept_tip'))}"` : ` title="${bsE(bsT('bs_keep_tip'))}"`}>${bsE(bsT(st.kept ? 'bs_kept' : 'bs_keep'))}</button>
      <button type="button" class="hb-link" data-hb-ai="${bsE(q)}" data-hb-ai-id="${id}" title="${bsE(bsT('hb_c_ask_cost'))}">${bsE(bsT('hb_ins_askwhy'))}</button>
      <button type="button" class="hb-link hb-ins-go" data-bs-letgo="${id}" title="${bsE(bsT('bs_letgo_tip'))}">${bsE(bsT('hb_ins_letgo_btn'))}</button></div>
    <span class="hb-grow"></span><span class="bs-meta">${bsE(meta)}</span></div>`;
}

/* ============================================================
   THE HOSTS — Where we are, History and Details, each filled by its own
   painter after the Board is drawn (hbPaintBoard calls this)
   ============================================================ */
function bsPaintHosts(){
  /* every strip on the Board reads the whole record behind it, a restored one too */
  document.querySelectorAll('#hb-board .bs-strip[data-bs-id]').forEach(el => { const c = bsContract(el.getAttribute('data-bs-id')); if (c) bsLoad(c); });
  document.querySelectorAll('#hb-board [data-bs-host]').forEach(host => {
    const c = bsContract(host.getAttribute('data-bs-cid')); if (!c) return;
    const k = host.getAttribute('data-bs-host');
    try {
      if (k === 'where') bsPaintWhere(host, c);
      else if (k === 'hist') bsPaintHist(host, c);
      else if (k === 'details') bsPaintDetails(host, c);
    } catch (e){ try { console.error('[hati] the strip\'s ' + k + ' did not paint', e); } catch (_){} }
  });
  bsFitWatch();
}
function bsPaintWhere(host, c){
  if (typeof standsHtml !== 'function') return;
  let sig = ''; try { sig = JSON.stringify([c.version, c.updatedAt, (c.changes || []).length, (c.changes || []).filter(x => x && x.status !== 'pending').length, (typeof langId === 'function') ? langId() : '']); } catch (_){ sig = String(Math.random()); }
  if (host._bsSig === sig && host.firstChild) return;
  host._bsSig = sig;
  if (typeof paintStandsPane === 'function') paintStandsPane(c, host);
}
function bsPaintHist(host, c){
  if (typeof roomPaintHistory !== 'function' || typeof roomHistoryHtml !== 'function') return;
  if (typeof API_MODE === 'function' && API_MODE() && c._light && !c._loaded){
    if (!host.querySelector('.ob-spin')) host.innerHTML = `<p class="hb-cv-wait">${(typeof busyHtml === 'function') ? busyHtml(bsT('hb_cv_reading')) : bsE(bsT('hb_cv_reading'))}</p>`;
    bsLoad(c); return;
  }
  const f = host._histF || {};
  if (host._histHtml === roomHistoryHtml(c, f, { board: true })) return;
  const keep = host.querySelector('.hist-trail'), top = keep ? keep.scrollTop : 0;
  roomPaintHistory(c, f, host);
  const tr = host.querySelector('.hist-trail'); if (tr && top) tr.scrollTop = top;
}
/* THE SHEET FOLLOWS THE RECORD: drawn again when what it shows moved (a
   save from Fill in, a colleague's save arriving, a reading landing, the
   language), never while the reader is typing in one of its boxes */
function bsDetailsSig(c){
  try { return JSON.stringify([String(c.id), c._v, c.version, c.updatedAt, c.lastAction, c.status, c.name, c.counterparty, c.expiry, c.value,
    c.fields || null, c.metadata || null, c.parties || null, c.signerPlan || null, c.participants || null, (c.obligations || []).length,
    !!c._brief, c.triage && c.triage.at, c.renewal || null, (typeof langId === 'function') ? langId() : '']); }
  catch (_){ return String(Math.random()); }
}
function bsPaintDetails(host, c){
  if (typeof ovSheetPaint !== 'function') return;
  const sig = bsDetailsSig(c);
  if (host._bsSig === sig && host.querySelector('#kt-ov-terms')) return;
  const a = document.activeElement;
  if (host.querySelector('#kt-ov-terms') && a && host.contains(a) && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;
  host._bsSig = sig;
  ovSheetPaint(c, host);
}
/* THE LINE IS DRAWN FOR THE CARD'S WIDTH: measured after the paint, and once
   more when the Board's width moves (the panel folds, the window turns) */
let _bsFitObs = null, _bsFitT = null;
function bsFitNow(){
  const svg = document.querySelector('#hb-board .bs-strip .bs-chart'); if (!svg) return;
  const box = svg.parentElement; if (!box) return;
  const cs = getComputedStyle(box);
  const w = Math.round(box.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0));
  if (w > 0 && Math.abs(w - (Number(svg.getAttribute('data-bs-w')) || 0)) > 4 && Math.abs(w - _bsChartW) > 4){ _bsChartW = w; bsRepaint(); }
}
function bsFitWatch(){
  bsFitNow();
  const host = document.getElementById('hb-board');
  if (!host || typeof ResizeObserver === 'undefined' || (_bsFitObs && _bsFitObs._host === host)) return;
  if (_bsFitObs) _bsFitObs.disconnect();
  _bsFitObs = new ResizeObserver(() => { clearTimeout(_bsFitT); _bsFitT = setTimeout(bsFitNow, 120); });
  _bsFitObs._host = host; _bsFitObs.observe(host);
}

/* ============================================================
   THE PRESSES, delegated once at load (a repaint never strands one)
   ============================================================ */
function bsMenuSet(id){ _bsMenu = id == null ? null : String(id); bsRepaint();
  if (_bsMenu){ const first = document.querySelector(`#bs-menu-${CSS.escape(_bsMenu)} .bs-mi`); if (first) try { first.focus({ preventScroll: true }); } catch (_){} } }
function bsGo(kind, id){
  const c = bsContract(id); if (!c) return;
  if (kind === 'risks'){ if (typeof riskViewOpen === 'function') riskViewOpen(c); return; }
  /* the STORED standards reading, read only: a "See" door never runs a check,
     never spends and never writes (the cell is drawn only over a check that ran) */
  if (kind === 'std'){ if (typeof openCheckPanel === 'function') openCheckPanel(bsContract(c.id) || c, 'playbook'); return; }
  if (kind === 'fill'){ if (typeof pdFillOpen === 'function') pdFillOpen(c.id); return; }
  if (kind === 'oblig'){ if (typeof hbOpenView === 'function') hbOpenView(c.id, 'oblig'); }
}
if (typeof document !== 'undefined' && !document._bsWired){
  document._bsWired = true;
  document.addEventListener('click', e => {
    if (!(window.state && state.view === 'dashboard')) return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    let el;
    /* ⋯: its own button opens and shuts it, another strip's moves it, a press
       anywhere else puts it away (PRESS IT AGAIN AND IT CLOSES) */
    const take = () => { e.preventDefault(); e.stopPropagation(); };
    if ((el = t.closest('[data-bs-dots]'))){ take(); const id = el.getAttribute('data-bs-dots'); bsMenuSet(_bsMenu === id ? null : id); return; }
    if (_bsMenu && !t.closest('.bs-menu')){ _bsMenu = null; bsRepaint(); }
    if ((el = t.closest('[data-bs-page]'))){ take(); bsStripPage(el.getAttribute('data-bs-id'), el.getAttribute('data-bs-page')); return; }
    if ((el = t.closest('[data-bs-x]'))){ take(); bsStripClose(el.getAttribute('data-bs-x')); return; }
    if ((el = t.closest('[data-bs-keep]'))){ take(); if (!el.disabled) bsStripKeep(el.getAttribute('data-bs-keep')); return; }
    if ((el = t.closest('[data-bs-letgo]'))){ take(); bsStripLetGo(el.getAttribute('data-bs-letgo')); return; }
    /* Open: the contract on Home's paper — the one landing every Workspace door shares */
    if ((el = t.closest('[data-bs-open]'))){ take(); const id = el.getAttribute('data-bs-open');
      if (!(typeof roomHomeLand === 'function' && roomHomeLand(id)) && typeof pdOpenOnHome === 'function') pdOpenOnHome(id, 'plain'); return; }
    if ((el = t.closest('[data-bs-go]'))){ take(); bsGo(el.getAttribute('data-bs-go'), el.getAttribute('data-bs-id')); return; }
    /* a menu row that is one of the Board's own doors closes the menu behind it */
    if (_bsMenu && t.closest('.bs-menu [data-hb-analyze], .bs-menu [data-hb-map]')) _bsMenu = null;
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !_bsMenu) return;
    const id = _bsMenu; _bsMenu = null; bsRepaint();
    const b = document.querySelector(`[data-bs-dots="${CSS.escape(id)}"]`); if (b) try { b.focus({ preventScroll: true }); } catch (_){}
    e.stopPropagation();
  }, true);
}

if (typeof window !== 'undefined') Object.assign(window, {
  BS_PAGES, BS_MENU_PAGES, BS_MAX,
  hbStripBring, bsStrips, bsStrip, bsStripPage, bsStripClose, bsStripKeep, bsStripLetGo, bsRefresh, bsRepaint,
  roomRetiredLand, bsLifeData, bsObRows, bsCaption, bsStripsHtml, bsStripHtml, bsLifeHtml, bsChartSvg, bsPaintHosts, bsDay,
});
