/* ============================================================
   STANDARDS — THE LADDER (owner picked "The Ladder" by name, 17 Nov 2026)
   ============================================================
   Our standards leaves Our paper and is a page of its own (the view keeps its
   old id, 'playbook', so every link, refresh and saved place still lands on it;
   Our paper's "Our standards" tab is removed, owner's answer). The page shows:
   · a list of the standards grouped by how firm they are (Must have · Push for
     it · Nice to have · Never accept), on the left;
   · the chosen standard drawn as a LADDER in the middle: what we ask for, the
     fallbacks best first with who may give each, what we never accept; how many
     contracts hold it; each open departure on the paper with Allow once ·
     Refuse · Open the paper; who looks after it, its version, when it is read
     again and how the signing check treats it;
   · Jambo's panel on the right (the five parts, insPaintPanel).
   EDITING is a page in the middle (the panel stays): name, how firm, applies
   to, owner, how often it is read again, the ladder's boxes each with who may
   give it, why it matters. "Write it for me" asks Jambo for the whole ladder;
   his draft waits IN HIS PANEL (the email note's own way, owner, 16 Nov 2026)
   until a person presses Put in the standard.
   A CHANGE IS NEVER SAVED STRAIGHT: Send for approval files it with its reason
   (POST /api/standards/changes) and any admin but its author says yes or no
   (…/decide). The owner's answers (17 Nov 2026): counts are holds / departs
   only (HaTi does not record which fallback a contract ended on), Must have
   follows the existing signing check, any admin but the editor approves.
   Nothing here decides a departure itself: Allow once is the sign check's own
   acceptance (signCheckAccept, a reason required), Open the paper its own door
   (signCheckOpenClause). */
/* global state, i18t, i18tn, esc, icon, toast, api, API_MODE, setView, currentUser, getUsers, clauseLibrary, playbook,
   stdLadderOf, stdGovOf, stdPlaceOf, stdDraftClean, stdChangeApply, stdBookKeys, STD_FIRMS, STD_WHO, STD_FALLBACKS_MAX, STD_REVIEW_MONTHS,
   insPaintPanel, jamboOverviewHtml, openModal, closeModal, signCheckGate, signCheckAccept, signCheckOpenClause, ensureFull, getContract,
   logAudit, persist, renderAIFeed, ai, landOn, diffHtml, todayISO, jlTalkOpen, regDotDate, langLocale, copilotAvailable */

const _ld = { pick: null, mode: 'ladder', edit: null, jbBusy: false, moreOpen: null, book: null };
const LD_FIRM_ORDER = ['must', 'push', 'nice', 'never'];
const LD_DEPS_SHOWN = 3;
const LD_REVIEW_SOON_DAYS = 30;
const LD_QUOTES_MAX = 8;
const LD_E = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));

function ldMe(){ return (typeof currentUser === 'function' && currentUser()) || null; }
function ldMayEdit(){ const u = ldMe(); return !!u && (u.role === 'admin' || u.role === 'legal'); }
function ldIsAdmin(){ const u = ldMe(); return !!u && u.role === 'admin'; }
function ldChanges(){ const s = state && state.settings; return Array.isArray(s && s.standardChanges) ? s.standardChanges : []; }
function ldWaitingFor(id){ return ldChanges().find(c => c && c.state === 'waiting' && String(c.clauseId || '') === String(id || '')) || null; }
function ldMayDecide(ch){ const u = ldMe(); return !!ch && ch.state === 'waiting' && (typeof window.mayDecideStandards === 'function' ? window.mayDecideStandards(u) : ldIsAdmin()) && String(ch.byId) !== String(u && u.id); }
function ldDay(iso){
  const d = String(iso || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(typeof langLocale === 'function' ? langLocale() : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (_){ return d; }
}
function ldToday(){ return typeof todayISO === 'function' ? todayISO() : new Date().toISOString().slice(0, 10); }
function ldWho(w){ return i18t('ld_who_' + (STD_WHO.includes(w) ? w : 'team')); }
function ldWhoSub(w){ return i18t('ld_who_sub_' + (STD_WHO.includes(w) ? w : 'team')); }
function ldFirmWord(f){ return i18t('ld_firm_' + (LD_FIRM_ORDER.includes(f) ? f : 'nice')); }
function ldFirmHtml(f){ return `<span class="ld-firm"><i class="ld-dot is-${LD_E(f)}" aria-hidden="true"></i>${LD_E(ldFirmWord(f))}</span>`; }
function ldBookLabel(k){ const b = (playbook() || {})[k]; return k === '_default' ? i18t('ld_books_all') : ((b && b.label) || k); }

/* ---- THE READINGS, taken once per paint ---- */
const LD_SIGNED = ['Signed', 'Executed', 'Declined'];
function ldVerdictsOf(cl){
  const cat = String((cl && cl.category) || '').toLowerCase(); if (!cat) return [];
  const out = [];
  for (const c of (state.contracts || [])){
    if (!c || c.archived) continue;
    const vs = c.playbook && Array.isArray(c.playbook.verdicts) ? c.playbook.verdicts : null; if (!vs) continue;
    const i = vs.findIndex(v => v && String(v.category || '').toLowerCase() === cat);
    if (i >= 0) out.push({ c, i, v: vs[i] });
  }
  return out;
}
/* A RULE A BOOK HOLDS WITH NO WORDING OF ITS OWN (a position or a limit naming only a topic, e.g. "Quality & rejection"
   on Supply) is a standard too: drawn with its words "not written yet", edited into one like any other */
function ldBookOnly(lib, pb){
  const have = new Set((lib || []).map(c => String(c.category || '').toLowerCase()));
  const out = new Map();
  for (const b of Object.values(pb || {})){
    if (!b || typeof b !== 'object') continue;
    for (const p of [...(Array.isArray(b.positions) ? b.positions : []), ...(Array.isArray(b.ranges) ? b.ranges : [])]){
      const cat = String((p && (p.category || p.label)) || '').trim();
      if (!cat || p.clause || have.has(cat.toLowerCase()) || out.has(cat.toLowerCase())) continue;
      out.set(cat.toLowerCase(), { id: 'pb:' + cat.toLowerCase(), category: cat, name: cat, preferred: '', guidance: String(p.note || ''), _bookOnly: true });
    }
  }
  return [...out.values()];
}
function ldStandards(){
  const pb = playbook() || {};
  const lib = clauseLibrary() || [];
  return [...lib, ...ldBookOnly(lib, pb)].map(cl => {
    const place = stdPlaceOf(cl, pb);
    const vs = ldVerdictsOf(cl);
    const holds = vs.filter(x => ['aligned', 'ok'].includes(x.v.status)).length;
    const allowed = vs.filter(x => (x.v.status === 'deviation' || x.v.status === 'missing') && x.v.accepted).length;
    const open = vs.filter(x => (x.v.status === 'deviation' || x.v.status === 'missing') && !x.v.accepted && !x.v.refused && !LD_SIGNED.includes(x.c.status));
    const gov = stdGovOf(cl);
    const soon = gov.reviewNext && gov.reviewNext <= ldAddDays(ldToday(), LD_REVIEW_SOON_DAYS);
    return { cl, id: String(cl.id), bookOnly: !!cl._bookOnly, name: cl.name || cl.category || '', topic: cl.category || cl.name || '', ladder: stdLadderOf(cl), gov, place,
      firm: place.firm || 'nice', checked: vs.length, holds, allowed, open, decide: (place.firm || 'nice') === 'nice' ? 0 : open.length, legalWaits: open.filter(x => x.v.escalate).length, reviewSoon: !!soon, wait: ldWaitingFor(cl.id) };
  });
}
function ldAddDays(iso, n){ const d = new Date(String(iso).slice(0, 10) + 'T00:00:00Z'); if (isNaN(d)) return ''; d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function ldPicked(rows){
  rows = rows || ldStandards();
  rows = rows.filter(ldInBook);
  let r = rows.find(x => x.id === _ld.pick);
  if (!r){ r = LD_FIRM_ORDER.map(f => rows.find(x => x.firm === f && x.open.length)).find(Boolean) || rows[0] || null; _ld.pick = r ? r.id : null; }
  return r;
}

/* ---- THE HEAD: name, facts, Departures · History · + New standard ---- */
function ldHeadFacts(rows){
  const must = rows.filter(r => r.firm === 'must').length, due = rows.filter(r => r.reviewSoon).length, legal = rows.reduce((n, r) => n + r.decide, 0);
  return `<span class="ld-facts"><b>${LD_E(i18tn('ld_n_standards', rows.length, { n: rows.length }))}</b>${[
    must ? i18tn('ld_n_must', must, { n: must }) : '', due ? i18tn('ld_n_due', due, { n: due }) : '', legal ? i18tn('ld_n_decide', legal, { n: legal }) : ''].filter(Boolean).map(t => ' · ' + LD_E(t)).join('')}</span>`;
}
function ldPaintHead(){
  if (typeof document === 'undefined' || !state || state.view !== 'playbook') return;
  const rows = ldStandards();
  const f = document.getElementById('page-head-facts'); if (f) f.innerHTML = ldHeadFacts(rows);
  const a = document.getElementById('page-head-acts'); if (!a) return;
  const deps = rows.reduce((n, r) => n + r.open.length, 0), waits = ldChanges().filter(c => c.state === 'waiting').length;
  a.innerHTML = `<button type="button" class="ui-btn${_ld.mode === 'departures' ? ' is-on' : ''}" data-ld-mode="departures">${LD_E(i18t('ld_departures'))}${deps ? ` <span class="ld-n">${deps}</span>` : ''}</button>`
    + `<button type="button" class="ui-btn${_ld.mode === 'history' ? ' is-on' : ''}" data-ld-mode="history">${LD_E(i18t('ld_history'))}${waits ? ` <span class="ld-n is-warn">${waits}</span>` : ''}</button>`
    + (ldMayEdit() ? `<button type="button" class="ui-btn ui-btn-primary" data-ld-new>${typeof icon === 'function' ? icon('plus', 'w-3.5 h-3.5', 2) : ''} ${LD_E(i18t('ld_new'))}</button>` : '');
}

/* ---- THE LIST BY HOW FIRM ---- */
/* A CONTRACT TYPE NAMED ("our NDA standards", Jambo's words or a typed sentence) narrows the list to the standards that
   apply to it: its own book and the baseline every contract starts from; one × lets it go */
/* a door that names one standard (Approvals' change row) picks it before the page is drawn */
function ldPickSet(id){ _ld.pick = String(id || '') || null; _ld.mode = 'ladder'; _ld.edit = null; }
function ldBookNow(){ return _ld.book; }
function ldBookSet(book){
  const pb = playbook() || {};
  _ld.book = book && book !== '_default' && pb[book] ? String(book) : null;
  if (state && state.view === 'playbook') renderStandardsPage();
}
function ldInBook(r){ return !_ld.book || r.place.books.includes(_ld.book) || r.place.books.includes('_default'); }
function ldListHtml(rows, picked){
  const bookLine = _ld.book ? `<p class="ld-bookline">${LD_E(i18t('ld_book_for', { book: ldBookLabel(_ld.book) }))}<button type="button" class="ui-btn ui-btn-plain ui-btn-icon ui-btn-sm" data-ld-book-clear title="${LD_E(i18t('ld_book_clear'))}" aria-label="${LD_E(i18t('ld_book_clear'))}">${typeof icon === 'function' ? icon('x', 'w-3.5 h-3.5') : ''}</button></p>` : '';
  rows = rows.filter(ldInBook);
  return `<nav class="ld-list" aria-label="${LD_E(i18t('ld_list_aria'))}">${bookLine}${LD_FIRM_ORDER.map(f => {
    const g = rows.filter(r => r.firm === f); if (!g.length) return '';
    return `<p class="ld-g">${LD_E(ldFirmWord(f))}</p>` + g.map(r => {
      const note = r.decide ? `<small class="is-warn">${LD_E(i18tn('ld_n_waits', r.decide, { n: r.decide }))}</small>`
        : r.open.length ? `<small>${LD_E(i18tn('ld_n_off', r.open.length, { n: r.open.length }))}</small>`
        : r.wait ? `<small class="is-warn">${LD_E(i18t('ld_change_waits_short'))}</small>` : r.reviewSoon ? `<small class="is-warn">${LD_E(i18t('ld_review_short'))}</small>` : '';
      const on = picked && picked.id === r.id && _ld.mode === 'ladder';
      return `<button type="button" class="ld-it${on ? ' is-on' : ''}" data-ld-pick="${LD_E(r.id)}"${on ? ' aria-current="true"' : ''}><i class="ld-dot is-${LD_E(r.firm)}" aria-hidden="true"></i><span class="ld-it-n" title="${LD_E(r.name)}">${LD_E(r.topic)}</span>${note}</button>`;
    }).join('');
  }).join('') || `<p class="ld-empty">${LD_E(i18t('ld_none'))}</p>`}</nav>`;
}

/* ---- THE LADDER ---- */
function ldRungHtml(tone, lab, words, who, sub, count){
  return `<div class="ld-rung"><i class="ld-mark is-${LD_E(tone)}" aria-hidden="true"></i><div class="ld-rw"><p class="ld-lab">${LD_E(lab)}</p><p class="ld-w${words ? '' : ' is-none'}">${LD_E(words || i18t('ld_rung_none'))}</p></div>`
    + `<div class="ld-who">${LD_E(who)}<small>${LD_E(sub || '')}</small></div><div class="ld-cnt">${count || ''}</div></div>`;
}
/* ONE DOOR FOR A DEPARTURE (owner, 17 Nov 2026: "build it", drawn on the real page): the card says who departs and the
   words; deciding happens on Approvals & signing only. A firm standard's card carries "Decide in Approvals ›", which
   lands on that exact row (apnLandRow), for whoever has that row; a Nice to have never holds a signature, so its cards
   are for information with no decision at all. "Open the paper" is GONE from this card (owner, 18 Nov 2026: "remove 'open
   the paper' from the standards"): the paper is looked at from the Approvals row, "See it in the paper ›" (apnPeekOpen). */
function ldDepHtml(x, firm){
  /* EVERY OUTSIDE PARTY, one line each (the every-party rule): never our own side */
  const theirs = (typeof window.contractParties === 'function' ? window.contractParties(x.c) : []).filter(p => p && p.side !== 'ours' && p.name).map(p => p.name);
  const names = theirs.length ? theirs : [x.c.counterparty || x.c.name || x.c.id];
  const q = String(x.v.quote || '').trim();
  const what = x.v.status === 'missing' ? i18t('ld_dep_missing') : q ? i18t('ld_dep_says', { q: q.length > 160 ? q.slice(0, 157) + '…' : q }) : i18t('ld_dep_off');
  const key = 'dep:' + x.c.id + ':' + x.i;
  const mine = firm !== 'nice' && ldDepKeysMine().has(key);
  const go = firm === 'nice' ? '' : mine ? `<button type="button" class="ui-link" data-ld-goap="${LD_E(key)}">${LD_E(i18t('ld_go_ap'))}</button>`
    : `<span class="ld-quiet" title="${LD_E(i18t('ld_allow_not_you'))}">${LD_E(i18t('ld_dep_waits'))}</span>`;
  return `<div class="ld-dep" data-ld-dep="${LD_E(x.c.id)}" data-ld-dep-i="${x.i}"><span class="ld-dep-t">${names.map(n => `<b class="ld-dep-p">${LD_E(n)}</b>`).join('')}${LD_E(typeof window.contractRef === 'function' ? window.contractRef(x.c) : x.c.id)} ${LD_E(what)}${x.v.escalate && firm !== 'nice' ? ` <span class="ld-tag">${LD_E(i18t('ld_dep_legal'))}</span>` : ''}</span>`
    + `<span class="ld-dep-a">${go}</span></div>`;
}
/* the departure rows the reader has on Approvals (apnDepRows, the one reading), asked once per paint */
let _ldDepMine = null;
function ldDepKeysMine(){
  if (_ldDepMine) return _ldDepMine;
  let rows = []; try { rows = typeof window.apnDepRows === 'function' ? window.apnDepRows() : []; } catch (_){ rows = []; }
  _ldDepMine = new Set(rows.map(r => r.key));
  setTimeout(() => { _ldDepMine = null; }, 0);
  return _ldDepMine;
}
function ldGateWord(){ const g = typeof signCheckGate === 'function' ? signCheckGate() : 'advise'; return i18t('ld_gate_' + (['off', 'advise', 'require'].includes(g) ? g : 'advise')); }
function ldLadderHtml(r){
  if (!r) return `<div class="ld-main"><p class="ld-empty">${LD_E(i18t('ld_none'))}</p></div>`;
  const L = r.ladder, g = r.gov;
  const books = r.place.books.length ? r.place.books.map(ldBookLabel).join(', ') : i18t('ld_books_none');
  const holdN = r.checked ? `${LD_E(i18t('ld_holds_of', { n: r.holds, of: r.checked }))}<span class="ld-bar"><i style="width:${Math.round(100 * r.holds / r.checked)}%"></i></span>` : `<span class="ld-quiet">${LD_E(i18t('ld_none_checked'))}</span>`;
  const rungs = ldRungHtml('green', i18t('ld_rung_ask'), L.ask, ldWho('anyone'), ldWhoSub('anyone'), holdN)
    + L.fallbacks.map((f, k) => ldRungHtml('amber', i18t('ld_rung_fb', { n: k + 1 }), f.text, ldWho(f.who), ldWhoSub(f.who), '')).join('')
    + (L.never || r.firm === 'never' ? ldRungHtml('dark', i18t('ld_rung_never'), L.never, ldWho('admin'), i18t('ld_who_sub_never'), '') : '');
  const deps = (r.firm === 'nice' && r.open.length ? `<p class="ld-g ld-g-info">${LD_E(i18t('ld_dep_info'))}</p>` : '')
    + r.open.slice(0, LD_DEPS_SHOWN).map(x => ldDepHtml(x, r.firm)).join('');
  const more = r.open.length > LD_DEPS_SHOWN ? `<button type="button" class="ui-link" data-ld-mode="departures">${LD_E(i18tn('ld_dep_more', r.open.length - LD_DEPS_SHOWN, { n: r.open.length - LD_DEPS_SHOWN }))}</button>` : '';
  const ch = r.wait;
  const change = ch ? `<div class="ld-soft" data-ld-change="${LD_E(ch.id)}"><span>${LD_E(i18t('ld_change_waits', { who: ch.by || '', day: ldDay(ch.at) }))}${ch.why ? ` <i>“${LD_E(ch.why)}”</i>` : ''}</span>`
    + (ldMayDecide(ch) ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ld-decide="${LD_E(ch.id)}">${LD_E(i18t('ld_decide'))}</button>`
      : String(ch.byId) === String((ldMe() || {}).id) ? `<span class="ld-quiet">${LD_E(i18t('ld_waits_other_admin'))}</span><button type="button" class="ui-btn ui-btn-sm" data-ld-withdraw="${LD_E(ch.id)}">${LD_E(i18t('ld_withdraw'))}</button>` : '') + '</div>' : '';
  const ver = g.ver ? i18t('ld_ver', { v: g.ver, day: ldDay(g.approvedAt), who: g.approvedBy || '' }) : i18t('ld_ver_start');
  return `<section class="ld-main" aria-label="${LD_E(r.name)}">
    <div class="ld-top"><h2 class="ld-title">${LD_E(r.name)}</h2>${ldFirmHtml(r.firm)}
      ${ldMayEdit() && !ch ? `<span class="ld-top-a"><button type="button" class="ui-btn" data-ld-write>${typeof icon === 'function' ? icon('sparkle', 'w-3.5 h-3.5') : ''} ${LD_E(i18t('ld_write'))}</button><button type="button" class="ui-btn ui-btn-primary" data-ld-edit>${LD_E(i18t('ld_edit'))}</button></span>` : ''}</div>
    <p class="ld-why">${L.why ? LD_E(i18t('ld_why', { why: L.why })) + ' ' : ''}${LD_E(i18t('ld_applies', { books }))}${r.place.mixed ? ' ' + LD_E(i18t('ld_mixed_said')) : ''}</p>
    <div class="ld-cols" aria-hidden="true"><span>${LD_E(i18t('ld_col_rungs'))}</span><span>${LD_E(i18t('ld_col_who'))}</span><span>${LD_E(i18t('ld_col_count'))}</span></div>
    <div class="ld-rungs">${rungs}</div>
    ${deps ? `<div class="ld-deps">${deps}${more}</div>` : ''}
    ${change}
    <p class="ld-gov"><span>${LD_E(i18t('ld_owner'))} <b>${LD_E(g.owner || i18t('ld_owner_none'))}</b></span><span>${LD_E(ver)}</span><span>${LD_E(i18t('ld_next_review'))} <b>${LD_E(g.reviewNext ? ldDay(g.reviewNext) : i18t('ld_review_never'))}</b></span>${r.firm === 'must' ? `<span>${LD_E(ldGateWord())}</span>` : ''}</p>
  </section>`;
}

/* ---- DEPARTURES: every one still open, across the standards ---- */
function ldDeparturesHtml(rows){
  const all = rows.flatMap(r => r.open.map(x => ({ r, x })));
  return `<section class="ld-main ld-wide"><div class="ld-top"><h2 class="ld-title">${LD_E(i18t('ld_departures'))}</h2><button type="button" class="ui-link ld-back" data-ld-mode="ladder">${typeof icon === 'function' ? icon('chevL', 'w-3.5 h-3.5') : ''} ${LD_E(i18t('ld_back'))}</button></div>`
    + (all.length ? all.map(({ r, x }) => `<p class="ld-g">${LD_E(r.topic)} · ${ldFirmHtml(r.firm)}</p>${ldDepHtml(x, r.firm)}`).join('') : `<p class="ld-empty">${LD_E(i18t('ld_dep_none'))}</p>`) + '</section>';
}
/* ---- HISTORY: every change, waiting first ---- */
function ldHistoryHtml(){
  const L = ldChanges().slice().sort((a, b) => (a.state === 'waiting' ? 0 : 1) - (b.state === 'waiting' ? 0 : 1) || String(b.decidedAt || b.at).localeCompare(String(a.decidedAt || a.at)));
  const me = String((ldMe() || {}).id);
  const row = ch => `<div class="ld-hrow"><span class="ld-hs is-${LD_E(ch.state)}">${LD_E(i18t('ld_state_' + ch.state))}</span><span class="ld-ht"><b>${LD_E((ch.draft && ch.draft.name) || '')}</b>`
    + `<small>${LD_E(i18t('ld_h_by', { who: ch.by || '', day: ldDay(ch.at) }))}${ch.why ? ' · “' + LD_E(ch.why) + '”' : ''}${ch.decidedBy ? ' · ' + LD_E(i18t('ld_h_decided', { who: ch.decidedBy, day: ldDay(ch.decidedAt) })) : ''}</small></span>`
    + (ldMayDecide(ch) ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ld-decide="${LD_E(ch.id)}">${LD_E(i18t('ld_decide'))}</button>`
      : ch.state === 'waiting' && String(ch.byId) === me ? `<button type="button" class="ui-btn ui-btn-sm" data-ld-withdraw="${LD_E(ch.id)}">${LD_E(i18t('ld_withdraw'))}</button>` : '') + '</div>';
  return `<section class="ld-main ld-wide"><div class="ld-top"><h2 class="ld-title">${LD_E(i18t('ld_history'))}</h2><button type="button" class="ui-link ld-back" data-ld-mode="ladder">${typeof icon === 'function' ? icon('chevL', 'w-3.5 h-3.5') : ''} ${LD_E(i18t('ld_back'))}</button></div>`
    + (L.length ? L.map(row).join('') : `<p class="ld-empty">${LD_E(i18t('ld_history_none'))}</p>`) + '</section>';
}

/* ---- EDITING: the ladder itself, in boxes ---- */
function ldDraftOf(r){
  if (!r) return { name: '', category: '', ask: '', fallbacks: [], never: '', why: '', firm: 'push', books: ['_default'], ownerId: String((ldMe() || {}).id || ''), owner: (ldMe() || {}).name || '', reviewMonths: 12 };
  const L = r.ladder, g = r.gov;
  return { name: r.name, category: r.topic, ask: L.ask, fallbacks: L.fallbacks.map(f => ({ ...f })), never: L.never, why: L.why, firm: r.firm,
    books: r.place.books.length ? r.place.books.slice() : ['_default'], ownerId: g.ownerId, owner: g.owner, reviewMonths: g.reviewMonths };
}
function ldWhoOptions(sel){ return ['anyone', 'team', 'legal'].map(w => `<option value="${w}"${w === sel ? ' selected' : ''}>${LD_E(ldWho(w))}</option>`).join(''); }
function ldEditHtml(){
  const e = _ld.edit; const d = e.draft;
  const people = (typeof getUsers === 'function' ? getUsers() : []).filter(u => u && u.role !== 'viewer');
  const ownerOpts = `<option value="">${LD_E(i18t('ld_owner_none'))}</option>` + people.map(u => `<option value="${LD_E(u.id)}"${String(u.id) === String(d.ownerId) ? ' selected' : ''}>${LD_E(u.name || u.email || '')}</option>`).join('');
  const books = stdBookKeys(playbook());
  const booksSaid = d.books.length === books.length && books.length > 1 ? i18t('ld_books_every') : d.books.map(ldBookLabel).join(', ');
  const box = (k, val, ph, rows) => `<textarea class="ld-box" data-ld-f="${k}" rows="${rows || 2}" placeholder="${LD_E(ph)}">${LD_E(val || '')}</textarea>`;
  const rung = (tone, lab, inner, who) => `<div class="ld-erung"><i class="ld-mark is-${tone}" aria-hidden="true"></i><label class="ld-ebox"><span class="ld-lab">${LD_E(lab)}</span>${inner}</label>${who}</div>`;
  const fbs = d.fallbacks.map((f, k) => rung('amber', i18t('ld_rung_fb', { n: k + 1 }), box('fb:' + k, f.text, i18t('ld_ph_fb' + (k ? '_n' : '')), 2),
    `<select class="ld-who-sel" data-ld-f="who:${k}" aria-label="${LD_E(i18t('ld_col_who'))}">${ldWhoOptions(f.who)}</select><button type="button" class="ui-btn ui-btn-plain ui-btn-icon ld-x" data-ld-fb-x="${k}" title="${LD_E(i18t('ld_fb_remove'))}" aria-label="${LD_E(i18t('ld_fb_remove'))}">${typeof icon === 'function' ? icon('x', 'w-3.5 h-3.5') : ''}</button>`)).join('');
  return `<section class="ld-main ld-edit" aria-label="${LD_E(i18t(e.clauseId ? 'ld_edit_title' : 'ld_new_title'))}">
    <div class="ld-ehead"><h2 class="ld-title">${LD_E(i18t(e.clauseId ? 'ld_edit_title' : 'ld_new_title'))}</h2><span class="ld-quiet">${LD_E(e.ver ? i18t('ld_edit_ver', { v: e.ver, n: e.ver + 1 }) : i18t('ld_edit_new'))}</span>
      <span class="ld-top-a"><button type="button" class="ui-btn ui-btn-primary" data-ld-send>${LD_E(i18t('ld_send'))}</button><button type="button" class="ui-btn" data-ld-cancel>${LD_E(i18t('act_cancel'))}</button></span></div>
    <div class="ld-erow"><label class="ld-fld is-grow"><span>${LD_E(i18t('ld_f_name'))}</span><input type="text" class="ld-in" data-ld-f="name" value="${LD_E(d.name)}" maxlength="120"></label>
      <div class="ld-fld"><span>${LD_E(i18t('ld_f_firm'))}</span><div class="ld-segs" role="radiogroup" aria-label="${LD_E(i18t('ld_f_firm'))}">${LD_FIRM_ORDER.map(f => `<button type="button" role="radio" aria-checked="${f === d.firm}" class="ld-seg${f === d.firm ? ' is-on' : ''} is-${f}" data-ld-firm="${f}"><i class="ld-dot is-${f}" aria-hidden="true"></i>${LD_E(ldFirmWord(f))}</button>`).join('')}</div></div></div>
    <p class="ld-firm-says">${LD_E(i18t('ld_firm_says_' + d.firm))}</p>
    <div class="ld-erow"><div class="ld-fld is-grow"><span>${LD_E(i18t('ld_f_books'))}</span><button type="button" class="ld-in ld-pick" data-ld-books aria-haspopup="true"><span>${LD_E(booksSaid)}</span>${typeof icon === 'function' ? icon('chevD', 'w-3.5 h-3.5') : ''}</button></div>
      <label class="ld-fld"><span>${LD_E(i18t('ld_f_owner'))}</span><select class="ld-in" data-ld-f="ownerId">${ownerOpts}</select></label>
      <label class="ld-fld"><span>${LD_E(i18t('ld_f_review'))}</span><select class="ld-in" data-ld-f="reviewMonths">${STD_REVIEW_MONTHS.map(m => `<option value="${m}"${m === Number(d.reviewMonths) ? ' selected' : ''}>${LD_E(i18tn('ld_months', m, { n: m }))}</option>`).join('')}</select></label></div>
    <div class="ld-ladhead"><b>${LD_E(i18t('ld_ladder'))}</b><small>${LD_E(i18t('ld_col_rungs'))}</small><button type="button" class="ui-btn ui-btn-sm" data-ld-write ${_ld.jbBusy ? 'disabled' : ''}>${typeof icon === 'function' ? icon('sparkle', 'w-3.5 h-3.5') : ''} ${LD_E(i18t('ld_write'))}</button><span class="ld-ladwho">${LD_E(i18t('ld_col_who'))}</span></div>
    <div class="ld-erungs">
      ${rung('green', i18t('ld_rung_ask'), box('ask', d.ask, i18t('ld_ph_ask'), 3), `<span class="ld-who-fix">${LD_E(ldWho('anyone'))}</span>`)}
      ${fbs}
      ${d.fallbacks.length >= STD_FALLBACKS_MAX ? '' : `<p class="ld-add"><button type="button" class="ui-link" data-ld-fb-add>${typeof icon === 'function' ? icon('plus', 'w-3.5 h-3.5') : ''} ${LD_E(i18t('ld_fb_add'))}</button></p>`}
      ${rung('dark', i18t('ld_rung_never'), box('never', d.never, i18t('ld_ph_never'), 2), `<span class="ld-who-fix">${LD_E(ldWho('admin'))}</span>`)}
    </div>
    <label class="ld-fld"><span>${LD_E(i18t('ld_f_why'))}</span>${box('why', d.why, i18t('ld_ph_why'), 2)}</label>
  </section>`;
}
/* the boxes read back into the draft (a redraw keeps your words) */
function ldEditRead(){
  const e = _ld.edit; if (!e) return;
  const root = document.querySelector('.ld-edit'); if (!root) return;
  root.querySelectorAll('[data-ld-f]').forEach(el => {
    const k = el.getAttribute('data-ld-f'), v = el.value;
    if (k.startsWith('fb:')){ const i = +k.slice(3); if (e.draft.fallbacks[i]) e.draft.fallbacks[i].text = v; }
    else if (k.startsWith('who:')){ const i = +k.slice(4); if (e.draft.fallbacks[i]) e.draft.fallbacks[i].who = v; }
    else if (k === 'ownerId'){ e.draft.ownerId = v; const u = (getUsers() || []).find(x => String(x.id) === String(v)); e.draft.owner = u ? (u.name || u.email || '') : ''; }
    else if (k === 'reviewMonths') e.draft.reviewMonths = Number(v) || 12;
    else e.draft[k] = v;
  });
  if (!e.clauseId) e.draft.category = e.draft.name;
}

/* ---- THE PAGE ---- */
function renderStandardsPage(){
  const host = document.getElementById('content'); if (!host) return;
  const rows = ldStandards(), picked = ldPicked(rows);
  const main = _ld.edit ? ldEditHtml() : _ld.mode === 'departures' ? ldDeparturesHtml(rows) : _ld.mode === 'history' ? ldHistoryHtml() : ldLadderHtml(picked);
  host.innerHTML = `<div class="view-enter ins-page ld-page" data-ins-page="playbook" data-ins="1">
    <div class="ld-sheet">${_ld.edit ? '' : ldListHtml(rows, picked)}${main}</div>
    <aside id="ins-panel" class="ins-panel" aria-label="${LD_E(i18t('ld_panel_aria'))}"></aside></div>`;
  ldPaintHead();
  ldPaintPanel(rows, picked);
  if (typeof window.popupControlsDress === 'function') try { window.popupControlsDress(host.querySelector('.ld-sheet')); } catch (_){}
}
/* JAMBO'S PANEL: the five parts for the chosen standard (no AI) */
function ldPanelFive(r){
  const n = r.open.length, first = r.open[0];
  const sub = r.checked ? (n ? i18tn('ld_p_sub_open', n, { h: r.holds, of: r.checked, n }) : i18t('ld_p_sub', { h: r.holds, of: r.checked })) : i18t('ld_none_checked');
  const groups = [{ label: i18t('ld_p_who'), rows: [
    { mark: 'user', t: r.gov.owner || i18t('ld_owner_none'), s: i18t('ld_owner') },
    { mark: 'clock', t: r.gov.ver ? i18t('ld_p_ver', { v: r.gov.ver, day: ldDay(r.gov.approvedAt) }) : i18t('ld_ver_start'), s: r.gov.reviewNext ? i18t('ld_p_next', { day: ldDay(r.gov.reviewNext) }) : i18t('ld_review_never'), tone: r.reviewSoon ? 'amber' : '' }] }];
  const ch = r.wait;
  const act = ch && ldMayDecide(ch) ? { say: i18t('ld_p_change', { who: ch.by || '' }), label: i18t('ld_decide'), run: () => ldDecideOpen(ch.id) }
    : first && r.firm !== 'nice' && ldDepKeysMine().has('dep:' + first.c.id + ':' + first.i)
      ? { say: i18t('ld_p_dep', { who: first.c.counterparty || first.c.name || first.c.id }), label: i18t('ld_p_go_ap'), run: () => ldGoApprovals('dep:' + first.c.id + ':' + first.i) }
      /* a Nice to have: the card says it, with no button (as drawn) */
      : first && r.firm === 'nice' ? { say: i18t('ld_p_dep', { who: first.c.counterparty || first.c.name || first.c.id }), q: i18t('ld_p_nice_info') }
      : null;
  return { eyebrow: [i18t('ld_page'), r.topic].join(' · '), title: r.name, sub,
    glance: [{ n: r.holds, l: i18t('ld_p_held') }, { n: r.allowed, l: i18t('ld_p_allowed') }, { n: r.decide, l: i18t('ld_p_decide'), warn: r.decide > 0 }],
    groups, act, src: i18t('ld_p_src') };
}
function ldPaintPanel(rows, picked){
  if (typeof insPaintPanel !== 'function') return;
  const base = { seat: 'ld', jlPh: i18t('jl_ph_any'), jlHome: i18t('ld_page'), jlSay: () => ({ lines: [ldPageSay(rows)] }) };
  if (!picked || typeof jamboOverviewHtml !== 'function'){ insPaintPanel(Object.assign(base, { c: null, item: null })); return; }
  insPaintPanel(Object.assign(base, { item: { id: 'ld:' + picked.id }, head: false, solo: true, jlWord: picked.name,
    body: `<div class="jl-words is-ov">${jamboOverviewHtml(ldPanelFive(picked), 'ld')}</div>`, acts: [] }));
}
function ldPageSay(rows){
  const deps = rows.reduce((n, r) => n + r.open.length, 0);
  return deps ? i18tn('ld_say_deps', deps, { n: deps, of: rows.length }) : i18t('ld_say_clear', { n: rows.length });
}
/* the one door to a departure's decision: its row on Approvals & signing */
function ldGoApprovals(key){ if (typeof window.apnLandRow === 'function') window.apnLandRow(key); else if (typeof setView === 'function') setView('approvals'); }

/* ---- THE ACTS ---- */
function ldStartEdit(r){
  if (!ldMayEdit()) return;
  _ld.edit = { clauseId: r && !r.bookOnly ? r.id : null, ver: r && !r.bookOnly ? (r.gov.ver || 1) : 0, draft: ldDraftOf(r), base: r ? ldDraftOf(r) : null, jb: null };
  renderStandardsPage();
  const f = document.querySelector('.ld-edit [data-ld-f="' + (r ? 'ask' : 'name') + '"]');
  if (f && typeof window.fieldFocus === 'function') window.fieldFocus(f); else if (f) f.focus();
}
function ldCancelEdit(){ _ld.edit = null; renderStandardsPage(); }
function ldBaseBook(){
  const s = state.settings || {};
  return { baseLibrary: Array.isArray(s.clauseLibrary) ? null : JSON.parse(JSON.stringify(clauseLibrary())), basePlaybook: (s.playbook && typeof s.playbook === 'object') ? null : JSON.parse(JSON.stringify(playbook())) };
}
function ldTakeSettings(out){
  if (!out) return;
  state.settings = state.settings || {};
  ['clauseLibrary', 'playbook', 'standardChanges'].forEach(k => { if (out[k] !== undefined) state.settings[k] = out[k]; });
}
async function ldSendOpen(){
  ldEditRead();
  const e = _ld.edit; if (!e) return;
  const clean = stdDraftClean(e.draft, stdBookKeys(playbook()));
  if (!clean){ toast(i18t('ld_send_needs'), 'warn'); return; }
  const others = (getUsers() || []).filter(u => u && (typeof window.mayDecideStandards === 'function' ? window.mayDecideStandards(u) : u.role === 'admin') && String(u.id) !== String((ldMe() || {}).id));
  const old = e.base ? e.base.ask : '';
  const what = e.clauseId && typeof diffHtml === 'function' && old !== clean.ask ? `<div class="ld-diff">${diffHtml(old, clean.ask)}</div>` : `<p class="ld-dw">${LD_E(clean.ask)}</p>`;
  /* THE ONE EDIT POP-UP, THE LEGORA WAY (f1118): what is proposed, then ONE line for why, then who decides; Send for
     approval the black button, Cancel last. The same ids, the same check (a why is needed), the same send. */
  lgpOpen({ id: 'ld-send', title: i18t('ld_dlg_title', { n: e.ver ? e.ver + 1 : 1 }), sub: i18t(e.clauseId ? 'ld_dlg_live' : 'ld_dlg_new', { v: e.ver || 1 }),
    html: `<p class="lgp-small">${LD_E(i18t('ld_dlg_what'))}</p>${what}
      ${lgpRowHtml({ k: i18t('ld_dlg_why'), id: 'ld-why', type: 'area', ph: i18t('ld_dlg_why_ph'), max: 400 })}
      <p class="lgp-small">${LD_E(i18t('ld_dlg_who'))}: ${LD_E(others.length ? i18tn('ld_dlg_who_n', others.length, { names: others.map(u => u.name || u.email).join(', ') }) : i18t('ld_dlg_who_none'))}</p>`,
    primary: { label: i18t('ld_send'), attr: 'id="ld-send-go"' }, cancelAttr: 'data-lgp-close data-dlg-cancel' });
  document.getElementById('ld-send-go')?.addEventListener('click', async ev => {
    const why = String((document.getElementById('ld-why') || {}).value || '').trim();
    if (!why){ toast(i18t('ld_dlg_why_needed'), 'warn'); document.getElementById('ld-why')?.focus(); return; }
    ev.currentTarget.disabled = true;
    try {
      const out = await api('standards/changes', 'POST', Object.assign({ clauseId: e.clauseId, draft: clean, why }, ldBaseBook()));
      ldTakeSettings(out);
      closeModal(); _ld.edit = null; if (out && out.change && out.change.clauseId) _ld.pick = out.change.clauseId;
      renderStandardsPage();
      toast(i18t(out && out.approvers ? 'ld_sent' : 'ld_sent_no_admin'), out && out.approvers ? 'ok' : 'warn');
    } catch (err){ ev.currentTarget.disabled = false; toast((err && err.message) || i18t('ld_send_failed'), 'err'); }
  });
}
function ldDecideOpen(id){
  const ch = ldChanges().find(c => c.id === id); if (!ch) return;
  if (!ldMayDecide(ch)){ toast(i18t(String(ch.byId) === String((ldMe() || {}).id) ? 'ld_decide_own' : 'ld_decide_admin'), 'warn'); return; }
  const r = ch.clauseId ? ldStandards().find(x => x.id === String(ch.clauseId)) : null;
  const d = ch.draft || {};
  const was = r ? r.ladder.ask : '';
  const what = r && typeof diffHtml === 'function' && was !== d.ask ? `<div class="ld-diff">${diffHtml(was, d.ask || '')}</div>` : `<p class="ld-dw">${LD_E(d.ask || '')}</p>`;
  const fb = (d.fallbacks || []).map((f, k) => `<li>${LD_E(i18t('ld_rung_fb', { n: k + 1 }))}: ${LD_E(f.text)} <small>(${LD_E(ldWho(f.who))})</small></li>`).join('');
  /* THE ONE EDIT POP-UP, THE LEGORA WAY (owner's pick, 19 Nov 2026): what is proposed, then ONE line for the note;
     Approve the black button, Refuse beside it, Cancel last */
  lgpOpen({ id: 'ld-decide', title: i18t('ld_decide_title', { name: d.name || '' }),
    sub: i18t('ld_decide_by', { who: ch.by || '', day: ldDay(ch.at) }) + (ch.why ? ` “${ch.why}”` : ''),
    html: `<p class="lgp-sub" style="margin-top:6px">${LD_E(i18t('ld_dlg_what'))}</p>${what}
      <p class="lgp-sub">${ldFirmHtml(d.firm)} · ${LD_E((d.books || []).map(ldBookLabel).join(', '))}</p>${fb ? `<ul class="ld-dlg-ul">${fb}</ul>` : ''}${d.never ? `<p class="lgp-sub">${LD_E(i18t('ld_rung_never'))}: ${LD_E(d.never)}</p>` : ''}`,
    rows: [{ k: i18t('ld_note_l'), id: 'ld-note', type: 'area', ph: i18t('ld_note_ph'), max: 400 }],
    primary: { label: i18t('ld_approve'), attr: 'data-ld-yes' }, alt: { label: i18t('ld_refuse_change'), attr: 'data-ld-no' } });
  const go = async yes => {
    /* A NOTE GOES WITH THE DECISION (owner, 17 Nov 2026): optional on a yes, required on a no — the proposer reads it on the bell */
    const why = String((document.getElementById('ld-note') || {}).value || '').trim();
    if (!yes && !why){ toast(i18t('ld_note_needed'), 'warn'); document.getElementById('ld-note')?.focus(); return; }
    try {
      const out = await api('standards/changes/' + encodeURIComponent(id) + '/decide', 'POST', { yes, why });
      ldTakeSettings(out); closeModal();
      if (yes && out && out.change && out.change.clauseId) _ld.pick = String(out.change.clauseId);
      ldAfterDecide(); toast(i18t(yes ? 'ld_approved' : 'ld_refused'), 'ok');
    } catch (err){ toast((err && err.message) || i18t('ld_send_failed'), 'err'); }
  };
  document.querySelector('[data-ld-yes]')?.addEventListener('click', () => go(true));
  document.querySelector('[data-ld-no]')?.addEventListener('click', () => go(false));
}
async function ldWithdraw(id){
  try { const out = await api('standards/changes/' + encodeURIComponent(id) + '/withdraw', 'POST', {}); ldTakeSettings(out); renderStandardsPage(); toast(i18t('ld_withdrawn'), 'ok'); }
  catch (err){ toast((err && err.message) || i18t('ld_send_failed'), 'err'); }
}
/* AFTER A DECISION, the page the reader stands on is drawn again: Approvals' piles, else the Standards page */
function ldAfterDecide(){
  if (state.view === 'approvals' && typeof renderApprovalsPage === 'function'){ try { if (typeof updateSidebarCounts === 'function') updateSidebarCounts(); } catch (_){} renderApprovalsPage(); }
  else renderStandardsPage();
}
/* ONE WAY TO DECIDE A DEPARTURE, from every page that shows one (the Standards page and Approvals' first pile):
   Allow once is the sign check's own writer (a reason required); Refuse asks its reason too, then opens the paper */
async function ldDepRun(id, i0, kind){
  let c = typeof getContract === 'function' ? getContract(id) : null; if (!c) return;
  const was = c.playbook && c.playbook.verdicts && c.playbook.verdicts[i0];
  try { if (typeof ensureFull === 'function') await ensureFull(c); } catch (err){ toast((err && err.message) || i18t('ld_send_failed'), 'err'); return; }
  c = getContract(id) || c;
  const vs = (c.playbook && c.playbook.verdicts) || [];
  const i = vs[i0] && was && vs[i0].category === was.category ? i0 : vs.findIndex(v => v && was && v.category === was.category);
  if (i < 0){ toast(i18t('sc_gone'), 'err'); return; }
  if (kind === 'open'){ signCheckOpenClause(c, i); return; }
  if (kind === 'allow'){ await signCheckAccept(c, i, ldAfterDecide); return; }
  /* REFUSE: a record that the departure was refused, WITH ITS REASON (owner, 17 Nov 2026: the owner reads it on the
     bell), then the paper to change it (every step starts the next) */
  const v = vs[i];
  if (typeof window.signCheckMayAccept === 'function' && !window.signCheckMayAccept(c, v)){ toast(i18t('sc_accept_not_you'), 'warn'); return; }
  const said = typeof window.promptDialog === 'function' ? await window.promptDialog({ title: i18t('ld_refuse_t', { what: v.category || '' }), message: i18t('ld_refuse_msg'),
    label: i18t('ld_refuse_l'), placeholder: i18t('ld_refuse_ph'), confirmLabel: i18t('ld_refuse'), multiline: true, danger: true }) : null;
  if (said == null) return;
  const why = String(said).trim().slice(0, 400);
  if (!why){ toast(i18t('ld_note_needed'), 'warn'); return; }
  const me = ldMe();
  v.refused = { by: (me && me.name) || '', byId: me ? String(me.id) : '', role: (me && me.role) || '', at: new Date().toISOString(), why };
  if (typeof logAudit === 'function') logAudit(c, 'Playbook', `Departure refused on "${v.category || 'a standard'}" — the wording must change — “${why}”`);
  if (typeof persist === 'function') persist(c);
  toast(i18t('ld_refused_dep'), 'ok');
  if (state.view === 'approvals') ldAfterDecide(); else signCheckOpenClause(c, i);
}
/* Applies to: a short checklist under the field */
function ldBooksOpen(btn){
  ldEditRead();
  document.querySelector('.ld-books-pop')?.remove();
  const d = _ld.edit.draft, keys = stdBookKeys(playbook());
  const pop = document.createElement('div'); pop.className = 'ld-books-pop'; pop.setAttribute('role', 'menu');
  pop.innerHTML = keys.map(k => `<label class="ld-bk"><input type="checkbox" value="${LD_E(k)}"${d.books.includes(k) ? ' checked' : ''}> ${LD_E(ldBookLabel(k))}</label>`).join('');
  btn.parentNode.appendChild(pop);
  pop.addEventListener('change', () => {
    const on = [...pop.querySelectorAll('input:checked')].map(x => x.value);
    d.books = on.length ? on : ['_default'];
    btn.querySelector('span').textContent = d.books.length === keys.length && keys.length > 1 ? i18t('ld_books_every') : d.books.map(ldBookLabel).join(', ');
  });
  const off = ev => { if (!pop.contains(ev.target) && ev.target !== btn && !btn.contains(ev.target)){ pop.remove(); document.removeEventListener('pointerdown', off, true); } };
  setTimeout(() => document.addEventListener('pointerdown', off, true), 0);
}

/* ---- JAMBO WRITES IT (his panel, the email note's way) ---- */
function ldQuotesOf(name, topic){
  const cl = { category: topic || name };
  return ldVerdictsOf(cl).filter(x => LD_SIGNED.includes(x.c.status) && x.c.status !== 'Declined' && x.v.quote).map(x => String(x.v.quote)).slice(0, LD_QUOTES_MAX);
}
async function ldWrite(steer, from){
  if (_ld.jbBusy) return;
  if (!_ld.edit){ const r = ldPicked(); ldStartEdit(r); }
  ldEditRead();
  const e = _ld.edit; if (!e) return;
  const d = e.draft, what = d.name || d.category || i18t('ld_new_title');
  if (!(typeof copilotAvailable !== 'function' || copilotAvailable())){ toast(i18t('ld_jb_nokey'), 'warn'); return; }
  const cur = from || { ask: d.ask, fallbacks: d.fallbacks.map(f => f.text), never: d.never, why: d.why };
  ai.history.push({ role: 'user', host: 'ai', text: LD_E(steer || i18t('ld_jb_ask', { what })) });
  _ld.jbBusy = true; if (typeof renderAIFeed === 'function') renderAIFeed(true);
  if (typeof jlTalkOpen === 'function') jlTalkOpen();
  try {
    const out = await api('ai/standard', 'POST', { name: d.name, category: d.category || d.name, firm: d.firm, current: cur, steer: steer || '', quotes: ldQuotesOf(d.name, d.category) });
    const draft = { ask: out.ask, fallbacks: (out.fallbacks || []).map(t => ({ text: t, who: 'team' })), never: out.never || '', why: out.why || '', put: false, prev: null, gone: false };
    if (draft.fallbacks.length > 1) draft.fallbacks[draft.fallbacks.length - 1].who = 'legal';
    const said = out.quotes ? i18tn('ld_jb_here_q', out.quotes, { n: out.quotes }) : i18t('ld_jb_here');
    ai.history.push({ role: 'assistant', host: 'ai', text: LD_E(said) + (out.truncated ? ' ' + LD_E(i18t('ld_jb_cut')) : ''), stdDraft: draft });
  } catch (err){
    ai.history.push({ role: 'assistant', host: 'ai', err: true, text: LD_E((err && err.message) || i18t('ld_send_failed')) });
  } finally {
    _ld.jbBusy = false;
    if (typeof renderAIFeed === 'function') renderAIFeed();
    const w = document.querySelector('.ld-edit [data-ld-write]'); if (w) w.disabled = false;
  }
}
/* his draft and the row under it, drawn inside his turn (aiMsgHtml asks) */
function ldJbDraftHtml(m, i){
  const d = m && m.stdDraft; if (!d || d.gone) return '';
  const lab = t => `<span class="ld-jl">${LD_E(t)}</span>`;
  const card = `<div class="ld-jdraft">${lab(i18t('ld_rung_ask'))}<span>${LD_E(d.ask)}</span>${d.fallbacks.map((f, k) => lab(i18t('ld_rung_fb', { n: k + 1 }) + ' · ' + ldWho(f.who)) + `<span>${LD_E(f.text)}</span>`).join('')}`
    + `${d.never ? lab(i18t('ld_rung_never')) + `<span>${LD_E(d.never)}</span>` : ''}${d.why ? lab(i18t('ld_f_why')) + `<span>${LD_E(d.why)}</span>` : ''}</div>`;
  const last = Array.isArray(ai.history) && i === ai.history.length - 1;
  if (!last) return card;
  if (d.put) return card + `<div class="ld-jrow"><span class="ld-quiet">${LD_E(i18t('ld_jb_in'))}</span><button type="button" class="ui-link" data-ld-jb-undo="${i}">${LD_E(i18t('ce_sug_undo'))}</button></div>`;
  return card + `<div class="ld-jchips">${['stricter', 'softer', 'shorter', 'fallback'].map(k => `<button type="button" class="igd-note-chip" data-ld-jb-chip="${k}" data-ld-jb-i="${i}">${LD_E(i18t('ld_jb_chip_' + k))}</button>`).join('')}</div>`
    + `<div class="ld-jrow"><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-ld-jb-put="${i}">${LD_E(i18t('ld_jb_put'))}</button><button type="button" class="ui-btn ui-btn-sm" data-ld-jb-again="${i}">${LD_E(i18t('ce_ask_retry'))}</button>`
    + `<span class="ld-jmore"><button type="button" class="ld-jdots" data-ld-jb-more="${i}" aria-expanded="${_ld.moreOpen === i}" title="${LD_E(i18t('reg_more_actions'))}" aria-label="${LD_E(i18t('reg_more_actions'))}">${typeof icon === 'function' ? icon('more', 'w-3.5 h-3.5') : ''}</button>`
    + (_ld.moreOpen === i ? `<span class="ld-jmenu" role="menu"><button type="button" class="ui-link" data-ld-jb-copy="${i}">${LD_E(i18t('sh_nl_copy'))}</button><button type="button" class="ui-link" data-ld-jb-drop="${i}">${LD_E(i18t('ce_sug_discard'))}</button></span>` : '') + '</span></div>';
}
function ldJbPut(i){
  const m = ai.history[i], d = m && m.stdDraft; if (!d) return;
  if (!_ld.edit){ ldStartEdit(ldPicked()); }
  ldEditRead();
  const e = _ld.edit; if (!e) return;
  d.prev = { ask: e.draft.ask, fallbacks: e.draft.fallbacks.map(f => ({ ...f })), never: e.draft.never, why: e.draft.why };
  /* his words go in; a part he left empty keeps what the standard had (a fallback is never dropped by a press) */
  Object.assign(e.draft, { ask: d.ask, fallbacks: d.fallbacks.length ? d.fallbacks.map(f => ({ ...f })) : e.draft.fallbacks, never: d.never || e.draft.never, why: d.why || e.draft.why });
  d.put = true;
  renderStandardsPage(); if (typeof renderAIFeed === 'function') renderAIFeed();
}
function ldJbUndo(i){
  const m = ai.history[i], d = m && m.stdDraft; if (!d || !d.prev || !_ld.edit) return;
  ldEditRead(); Object.assign(_ld.edit.draft, d.prev); d.put = false; d.prev = null;
  renderStandardsPage(); if (typeof renderAIFeed === 'function') renderAIFeed();
}

/* ---- ONE LISTENER, ON DOCUMENT, BOUND ONCE ---- */
if (typeof document !== 'undefined' && !document._ldWired){
  document._ldWired = true;
  document.addEventListener('click', ev => {
    const t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
    const jb = t.closest('[data-ld-jb-chip],[data-ld-jb-put],[data-ld-jb-again],[data-ld-jb-drop],[data-ld-jb-undo],[data-ld-jb-more],[data-ld-jb-copy]');
    if (jb){
      ev.preventDefault();
      const i = Number(jb.getAttribute('data-ld-jb-i') ?? jb.getAttribute('data-ld-jb-put') ?? jb.getAttribute('data-ld-jb-again') ?? jb.getAttribute('data-ld-jb-drop') ?? jb.getAttribute('data-ld-jb-undo') ?? jb.getAttribute('data-ld-jb-more') ?? jb.getAttribute('data-ld-jb-copy'));
      const m = ai.history[i], d = m && m.stdDraft; if (!d) return;
      const from = { ask: d.ask, fallbacks: d.fallbacks.map(f => f.text), never: d.never, why: d.why };
      if (jb.hasAttribute('data-ld-jb-more')){ _ld.moreOpen = _ld.moreOpen === i ? null : i; if (typeof renderAIFeed === 'function') renderAIFeed(); return; }
      if (jb.hasAttribute('data-ld-jb-copy')){
        const words = [d.ask, ...d.fallbacks.map(f => f.text), d.never, d.why].filter(Boolean).join('\n\n');
        _ld.moreOpen = null;
        try { navigator.clipboard.writeText(words).then(() => toast(i18t('sh_nl_copied'), 'ok'), () => toast(i18t('sh_nl_copy_no'), 'warn')); } catch (_){ toast(i18t('sh_nl_copy_no'), 'warn'); }
        if (typeof renderAIFeed === 'function') renderAIFeed(); return;
      }
      _ld.moreOpen = null;
      if (jb.hasAttribute('data-ld-jb-chip')) ldWrite(i18t('ld_jb_q_' + jb.getAttribute('data-ld-jb-chip')), from);
      else if (jb.hasAttribute('data-ld-jb-again')) ldWrite(i18t('ld_jb_q_again'), from);
      else if (jb.hasAttribute('data-ld-jb-put')) ldJbPut(i);
      else if (jb.hasAttribute('data-ld-jb-undo')) ldJbUndo(i);
      else { d.gone = true; if (typeof renderAIFeed === 'function') renderAIFeed(); }
      return;
    }
    if (!state || state.view !== 'playbook') return;
    const b = t.closest('[data-ld-book-clear],[data-ld-pick],[data-ld-mode],[data-ld-new],[data-ld-edit],[data-ld-write],[data-ld-cancel],[data-ld-send],[data-ld-firm],[data-ld-fb-add],[data-ld-fb-x],[data-ld-books],[data-ld-decide],[data-ld-withdraw],[data-ld-goap]');
    if (!b) return;
    if (b.hasAttribute('data-ld-book-clear')){ ldBookSet(null); return; }
    if (b.hasAttribute('data-ld-pick')){ _ld.pick = b.getAttribute('data-ld-pick'); _ld.mode = 'ladder'; renderStandardsPage(); return; }
    if (b.hasAttribute('data-ld-mode')){ const m = b.getAttribute('data-ld-mode'); _ld.mode = _ld.mode === m && m !== 'ladder' ? 'ladder' : m; _ld.edit = null; renderStandardsPage(); return; }
    if (b.hasAttribute('data-ld-new')){ ldStartEdit(null); return; }
    if (b.hasAttribute('data-ld-edit')){ ldStartEdit(ldPicked()); return; }
    if (b.hasAttribute('data-ld-write')){ ldWrite(''); return; }
    if (b.hasAttribute('data-ld-cancel')){ ldCancelEdit(); return; }
    if (b.hasAttribute('data-ld-send')){ ldSendOpen(); return; }
    if (b.hasAttribute('data-ld-firm')){ ldEditRead(); _ld.edit.draft.firm = b.getAttribute('data-ld-firm'); renderStandardsPage(); return; }
    if (b.hasAttribute('data-ld-fb-add')){ ldEditRead(); _ld.edit.draft.fallbacks.push({ text: '', who: _ld.edit.draft.fallbacks.length ? 'legal' : 'team' }); renderStandardsPage();
      const k = _ld.edit.draft.fallbacks.length - 1; document.querySelector(`.ld-edit [data-ld-f="fb:${k}"]`)?.focus(); return; }
    if (b.hasAttribute('data-ld-fb-x')){ ldEditRead(); _ld.edit.draft.fallbacks.splice(+b.getAttribute('data-ld-fb-x'), 1); renderStandardsPage(); return; }
    if (b.hasAttribute('data-ld-books')){ ldBooksOpen(b); return; }
    if (b.hasAttribute('data-ld-decide')){ ldDecideOpen(b.getAttribute('data-ld-decide')); return; }
    if (b.hasAttribute('data-ld-withdraw')){ ldWithdraw(b.getAttribute('data-ld-withdraw')); return; }
    if (b.hasAttribute('data-ld-goap')){ ldGoApprovals(b.getAttribute('data-ld-goap')); return; }
  });
}
/* THE FORM KEEPS ITS WORDS AS THEY ARE TYPED (a redraw keeps your words): every box read into the draft on input */
if (typeof document !== 'undefined' && !document._ldInputWired){
  document._ldInputWired = true;
  const keep = ev => { const t = ev.target; if (t && t.closest && t.closest('.ld-edit') && t.hasAttribute && t.hasAttribute('data-ld-f')) ldEditRead(); };
  document.addEventListener('input', keep); document.addEventListener('change', keep);
}
Object.assign(window, { ldGoApprovals, ldDepKeysMine, ldFirmWord, ldWho, ldBookLabel, ldPickSet, ldDepRun, ldAfterDecide, ldBookNow, ldBookSet, renderStandardsPage, ldPaintHead, ldStandards, ldPicked, ldChanges, ldMayDecide, ldStartEdit, ldSendOpen, ldDecideOpen, ldWithdraw, ldWrite, ldJbDraftHtml, ldJbPut, ldJbUndo, ldPanelFive });
