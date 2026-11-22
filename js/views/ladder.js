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

const _ld = { pick: null, mode: 'ladder', edit: null, jbBusy: false, moreOpen: null, book: null, q: '', depPick: null, hPick: null };
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
  /* P-35: no facts beside the title (the chips say the counts); New position, or while editing Cancel and Send for approval */
  const f = document.getElementById('page-head-facts'); if (f) f.innerHTML = '';
  const a = document.getElementById('page-head-acts'); if (!a) return;
  a.innerHTML = _ld.edit ? `<button type="button" class="ui-btn" data-ld-cancel>${LD_E(i18t('act_cancel'))}</button><button type="button" class="ui-btn ui-btn-primary" data-ld-send>${LD_E(i18t('ld_send'))}</button>`
    : (ldMayEdit() ? `<button type="button" class="ui-btn ui-btn-primary" data-ld-new>${typeof icon === 'function' ? icon('plus', 'w-3.5 h-3.5', 2) : ''} ${LD_E(i18t('ld_new'))}</button>` : '');
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
  rows = rows.filter(ldInBook).filter(r => ld6Hit([r.name, r.topic].join(' ')));
  return `<nav class="ld-list" aria-label="${LD_E(i18t('ld_list_aria'))}">${bookLine}${LD_FIRM_ORDER.map(f => {
    const g = rows.filter(r => r.firm === f); if (!g.length) return '';
    return `<p class="ld-g">${LD_E(ldFirmWord(f))}</p>` + g.map(r => {
      /* P-35: an amber count beside a position where a departure waits */
      const note = r.decide ? `<b class="ld6-cnt" title="${LD_E(i18tn('ld_n_waits', r.decide, { n: r.decide }))}">${r.decide}</b>`
        : r.open.length ? `<small>${LD_E(i18tn('ld_n_off', r.open.length, { n: r.open.length }))}</small>`
        : r.wait ? `<small class="is-warn">${LD_E(i18t('ld_change_waits_short'))}</small>` : r.reviewSoon ? `<small class="is-warn">${LD_E(i18t('ld_review_short'))}</small>` : '';
      /* while a position is edited, the one being edited is the chosen row (as drawn); a new one chooses none */
      const on = _ld.edit ? String(_ld.edit.clauseId || (_ld.edit.bookOnlyId || '')) === r.id : picked && picked.id === r.id && _ld.mode === 'ladder';
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
/* ==== P-35, THE PLAYBOOK THE LEGORA + STRIPE WAY (owner's pick 20 Nov 2026: "L+S and park it") ====
   The head: Playbook and New position (black); while editing, Cancel and Send for approval (black). Under it one ask box
   (it narrows what the tab shows) and chips Positions · Departures (amber dot) · History WITH THEIR COUNTS — Departures
   and History are TABS now (they were buttons; you could not see you were on them) and the panel follows the tab.
   No figure cards, no zero tiles, no money. */
const LD6_TONE = { must:'ruby', push:'amber', nice:'green', never:'gray' };
/* a soft badge, as drawn: a dot in its tone, or a ✓ where the state is done (Allowed once, Approved); a plain one (Draft) has none */
function ld6Badge(text, tone, tick, plain){
  const mk = plain ? '' : tick ? (typeof icon === 'function' ? icon('mkTick', 'ld6-tk', 2.4) : '✓') : '<i></i>';
  return `<span class="apn-st ld6-st is-${LD_E(tone)}${tick ? ' is-done' : ''}">${mk}${LD_E(text)}</span>`;
}
function ld6FirmBadge(f){ return ld6Badge(ldFirmWord(f), LD6_TONE[f] || 'gray'); }
function ld6Hit(words){ const q = String(_ld.q || '').trim().toLowerCase(); return !q || String(words || '').toLowerCase().includes(q); }
/* a verdict's words on the paper with their §, read where the paper can be found (pd2QuoteOf), never guessed */
function ld6SecOf(c, quote){
  if (!c || !quote || typeof window.pd2QuoteOf !== 'function') return '';
  try { const q = window.pd2QuoteOf(c, [String(quote).slice(0, 60)]); return q && /§|\d/.test(String(q.sec || '')) ? String(q.sec) : ''; } catch (_){ return ''; }
}
function ld6Ref(c){ return typeof window.contractRef === 'function' ? window.contractRef(c) : c.id; }
function ld6Party(c){ const p = (typeof window.contractParties === 'function' ? window.contractParties(c) : []).filter(x => x && x.side !== 'ours' && x.name).map(x => x.name); return p[0] || c.counterparty || c.name || c.id; }
/* every departure, open and allowed once, across the positions (the Departures tab's one list) */
function ld6DepRows(rows){
  const out = [];
  rows.forEach(r => ldVerdictsOf(r.cl).forEach(x => {
    const off = x.v.status === 'deviation' || x.v.status === 'missing'; if (!off || x.v.refused) return;
    const allowed = !!x.v.accepted, open = !allowed && !LD_SIGNED.includes(x.c.status);
    if (!allowed && !open) return;
    out.push({ key:'dep:' + x.c.id + ':' + x.i, r, x, allowed });
  }));
  /* OLDEST FIRST, as drawn (RE-POINTED 22 Nov 2026, batch 7 review): the departure that has waited longest leads; one
     with no day said goes last */
  const at = d => String(ld6DepAt(d.x) || '').slice(0, 10) || '9999';
  return out.filter(d => ld6Hit([d.r.name, d.r.topic, d.x.c.name, ld6Party(d.x.c), d.x.v.quote].join(' ')))
    .map((d, i) => ({ d, i })).sort((a, b) => at(a.d).localeCompare(at(b.d)) || a.i - b.i).map(o => o.d);
}
function ld6Waited(x){ const at = (x.v.accepted && x.v.accepted.at) || (x.c.playbook && x.c.playbook.at) || ''; return at ? ldDay(at) : '—'; }
function ld6StripHtml(rows){
  const deps = rows.reduce((n, r) => n + r.open.length, 0), hist = ldChanges().length;
  /* RE-BUILT AS DRAWN (21 Nov 2026): the chips are the drawing's quiet ones — a dashed edge, the chosen one a solid edge in
     ink; while a position is edited, Positions stays the chosen chip (the edit is a position's own view) */
  const on = m => (_ld.edit ? 'ladder' : _ld.mode) === m;
  const chip = (m, w, n, dot) => `<button type="button" class="apn-tab is-chip ld6-chip${on(m) ? ' is-on' : ''}" data-ld-mode="${m}" aria-pressed="${on(m)}">${dot ? '<i class="apn-cd is-amber" aria-hidden="true"></i>' : ''}${LD_E(w)} <span>${n}</span></button>`;
  return `<div class="ld6-top"><label class="apn-ask ld6-ask">${typeof icon === 'function' ? icon('mkSpark', 'w-3.5 h-3.5 ld6-spk') : ''}<input id="ld-q" type="search" autocomplete="off" placeholder="${LD_E(i18t('ld6_ask_ph'))}" value="${LD_E(_ld.q || '')}"></label>
    <div class="apn-bar ld6-bar">${chip('ladder', i18t('ld6_positions'), rows.length)}${chip('departures', i18t('ld_departures'), deps, deps > 0)}${chip('history', i18t('ld_history'), hist)}</div></div>`;
}
/* the time a row has waited, as drawn: today · yesterday · N days; a day long ago as "12 Nov" */
function ld6Age(iso){
  const d = String(iso || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  const n = Math.round((Date.parse(ldToday() + 'T00:00:00Z') - Date.parse(d + 'T00:00:00Z')) / 864e5);
  if (!(n > 0)) return i18t('ld6_age_today');
  if (n === 1) return i18t('ld6_age_yesterday');
  return i18tn('ld6_age_days', n, { n });
}
function ld6Short(iso){
  const d = String(iso || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  if (d === ldToday()) return i18t('ld6_age_today');
  try { const o = { day: 'numeric', month: 'short' }; if (d.slice(0, 4) !== ldToday().slice(0, 4)) o.year = 'numeric';
    return new Date(d + 'T00:00:00').toLocaleDateString(typeof langLocale === 'function' ? langLocale() : 'en-GB', o); } catch (_){ return d; }
}
/* A POSITION: a soft how-firm badge, "<topic> · v<N>", Write it for me and Edit the position (grey); the name; why it
   matters; the ladder as a timeline of rungs (green ✓ what we ask for, amber numbered fallbacks, black × never accept),
   each with who may give it; under what we ask for, WHERE IT IS HELD, quoted with § and the contract; owner · next
   review · at signing on one quiet line (owner amber when none). Departures wait in the panel. */
function ld6RungHtml(tone, mark, lab, words, who, sub, under){
  return `<div class="ld6-rung"><i class="ld6-mk is-${LD_E(tone)}" aria-hidden="true">${mark}</i><div class="ld6-rw"><p class="ld-lab">${LD_E(lab)}</p><p class="ld-w${words ? '' : ' is-none'}">${LD_E(words || i18t('ld_rung_none'))}</p>${under || ''}</div>`
    + `<div class="ld-who">${LD_E(who)}<small>${LD_E(sub || '')}</small></div></div>`;
}
function ld6HeldHtml(r){
  if (!r.checked) return `<p class="ld6-held is-none">${LD_E(i18t('ld_none_checked'))}</p>`;
  if (!r.holds) return `<p class="ld6-held is-none">${LD_E(i18t('ld6_held_none', { of:r.checked }))}</p>`;
  const ex = ldVerdictsOf(r.cl).find(x => ['aligned', 'ok'].includes(x.v.status) && x.v.quote);
  if (!ex) return `<p class="ld6-held">${LD_E(i18tn('ld6_held_n', r.holds, { n:r.holds }))}</p>`;
  const q = String(ex.v.quote).replace(/\s+/g, ' ').trim(), sec = ld6SecOf(ex.c, q);
  return `<p class="ld6-held">${LD_E(i18tn('ld6_held_eg', r.holds, { n:r.holds }))} <q>${LD_E(q.length > 110 ? q.slice(0, 107) + '…' : q)}</q>${sec ? ` ${LD_E(sec)}` : ''} · ${LD_E(ex.c.name || ld6Ref(ex.c))}</p>`;
}
/* the version a position stands at: HaTi's starting wording counts as v1 (the server's first approved change makes v2) */
function ld6Ver(g){ return Number(g && g.ver) > 0 ? Number(g.ver) : 1; }
function ldLadderHtml(r){
  if (!r) return `<div class="ld-main"><p class="ld-empty">${LD_E(i18t('ld_none'))}</p></div>`;
  const L = r.ladder, g = r.gov;
  const tick = typeof icon === 'function' ? icon('mkTick', 'w-3 h-3', 2.4) : '✓', cross = typeof icon === 'function' ? icon('x', 'w-3 h-3', 2.4) : '×';
  /* AS DRAWN: what we ask for, each fallback, and never accept — the walk-away rung always stands (its words "not
     written yet" where none are kept), so the ladder always ends where we walk away */
  const rungs = ld6RungHtml('green', tick, i18t('ld_rung_ask'), L.ask, ldWho('anyone'), ldWhoSub('anyone'), ld6HeldHtml(r))
    + L.fallbacks.map((f, k) => ld6RungHtml('amber', String(k + 1), i18t('ld_rung_fb', { n: k + 1 }), f.text, ldWho(f.who), ldWhoSub(f.who), '')).join('')
    + ld6RungHtml('dark', cross, i18t('ld_rung_never'), L.never, ldWho('admin'), i18t('ld_who_sub_never'), '');
  const ch = r.wait;
  const change = ch ? `<div class="ld-soft" data-ld-change="${LD_E(ch.id)}"><span>${LD_E(i18t('ld_change_waits', { who: ch.by || '', day: ldDay(ch.at) }))}${ch.why ? ` <i>“${LD_E(ch.why)}”</i>` : ''}</span>`
    + (ldMayDecide(ch) ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ld-decide="${LD_E(ch.id)}">${LD_E(i18t('ld_decide'))}</button>`
      : String(ch.byId) === String((ldMe() || {}).id) ? `<span class="ld-quiet">${LD_E(i18t('ld_waits_other_admin'))}</span><button type="button" class="ui-btn ui-btn-sm" data-ld-withdraw="${LD_E(ch.id)}">${LD_E(i18t('ld_withdraw'))}</button>` : '') + '</div>' : '';
  const eb = [r.topic, 'v' + ld6Ver(g)].filter(Boolean).join(' · ');
  const gate = typeof signCheckGate === 'function' ? signCheckGate() : 'advise';
  return `<section class="ld-main ld6-main" aria-label="${LD_E(r.name)}">
    <div class="ld6-eb">${ld6FirmBadge(r.firm)}<span>${LD_E(eb)}</span>
      ${ldMayEdit() && !ch ? `<span class="ld-top-a"><button type="button" class="ctf-pill" data-ld-write>${typeof icon === 'function' ? icon('mkSpark', 'w-3.5 h-3.5 ld6-spk') : ''} ${LD_E(i18t('ld_write'))}</button><button type="button" class="ctf-pill" data-ld-edit>${LD_E(i18t('ld_edit'))}</button></span>` : ''}</div>
    <h2 class="ld-title">${LD_E(r.name)}</h2>
    ${L.why ? `<p class="ld-why">${LD_E(L.why)}</p>` : ''}
    <div class="ld6-rungs">${rungs}</div>
    ${change}
    <p class="ld-gov ld6-gov"><span>${LD_E(i18t('ld_next_review'))} <b>${LD_E(g.reviewNext ? ldDay(g.reviewNext) : i18t('ld_review_never'))}</b></span>${r.firm === 'must' ? `<span>${LD_E(i18t('ld6_at_signing'))} <b>${LD_E(i18t('ld6_gate_' + (['off', 'advise', 'require'].includes(gate) ? gate : 'advise')))}</b></span>` : ''}</p>
  </section>`;
}
/* DEPARTURES: one calm table — the contract (its name, then the other side and reference, then "§ N · “…the paper's
   words…”" on one line ending in "…") · position · how firm · a state badge (amber To decide, green ✓ Allowed once) ·
   waiting. A press chooses; the panel follows. */
function ld6DepAt(x){ return (x.v.accepted && x.v.accepted.at) || x.v.at || (x.c.playbook && x.c.playbook.at) || ''; }
function ld6StateBadge(allowed){ return allowed ? ld6Badge(i18t('ld6_st_allowed'), 'green', true) : ld6Badge(i18t('ld6_st_decide'), 'amber'); }
function ldDeparturesHtml(rows){
  const all = ld6DepRows(rows);
  if (!_ld.depPick || !all.some(d => d.key === _ld.depPick)) _ld.depPick = all[0] ? all[0].key : null;
  const row = d => { const c = d.x.c, q = String(d.x.v.quote || '').replace(/\s+/g, ' ').trim(), sec = q ? ld6SecOf(c, q) : '';
    const ql = d.x.v.status === 'missing' ? `<div class="ld6-ql is-miss">${LD_E(i18t('ld_dep_missing'))}</div>` : q ? `<div class="ld6-ql">${sec ? `<span>${LD_E(sec)} ·</span>` : ''}<i>“${LD_E(q)}”</i></div>` : '';
    return `<tr data-ld-deprow="${LD_E(d.key)}" tabindex="0" class="${_ld.depPick === d.key ? 'is-sel' : ''}"><td><div class="cun-name">${LD_E(c.name || ld6Party(c))}</div><div class="cun-sub">${LD_E(ld6Party(c))} · <span class="ld6-ref">${LD_E(ld6Ref(c))}</span></div>${ql}</td>
      <td class="ld6-pos">${LD_E(d.r.topic)}</td><td>${ld6FirmBadge(d.r.firm)}</td><td>${ld6StateBadge(d.allowed)}</td><td class="ld6-when">${LD_E(ld6Age(ld6DepAt(d.x)) || '—')}</td></tr>`; };
  return `<section class="ld-main ld-wide ld6-wide"><table class="apn-table ld6-table"><colgroup><col><col style="width:140px"><col style="width:130px"><col style="width:140px"><col style="width:90px"></colgroup>
    <thead><tr><th>${LD_E(i18t('ld6_c_contract'))}</th><th>${LD_E(i18t('ld6_c_position'))}</th><th>${LD_E(i18t('ld6_c_firm'))}</th><th>${LD_E(i18t('ld6_c_state'))}</th><th class="ld6-when">${LD_E(i18t('ld6_c_since'))}</th></tr></thead>
    <tbody>${all.map(row).join('') || `<tr><td colspan="5" class="apn-none">${LD_E(i18t('ld_dep_none'))}</td></tr>`}</tbody></table></section>`;
}
/* HISTORY: one calm table — position · the change ("v2 → v3: <what it does>", one line) · proposed by · a state badge
   (amber Waits for another admin, green ✓ Approved) · when. A press chooses; the panel follows. */
const LD6_HST = { waiting:['ld6_h_waits', 'amber'], approved:['ld6_h_approved', 'green'], refused:['ld6_h_refused', 'ruby'], withdrawn:['ld6_h_withdrawn', 'gray'] };
function ld6HistBadge(ch){ const s = LD6_HST[ch.state] || LD6_HST.withdrawn; return ld6Badge(i18t(s[0]), s[1], ch.state === 'approved'); }
function ld6HistRows(){
  const L = ldChanges().slice().sort((a, b) => (a.state === 'waiting' ? 0 : 1) - (b.state === 'waiting' ? 0 : 1) || String(b.decidedAt || b.at).localeCompare(String(a.decidedAt || a.at)));
  return L.filter(ch => ld6Hit([(ch.draft && ch.draft.name) || '', (ch.draft && ch.draft.category) || '', ch.why, ch.by].join(' ')));
}
function ld6ChangeWords(ch){
  const was = ch.clauseId ? (ldStandards().find(r => r.id === String(ch.clauseId)) || null) : null;
  if (!was) return i18t('ld6_ch_new');
  const d = ch.draft || {}, L = was.ladder;
  const parts = [];
  if (String(d.ask || '') !== String(L.ask || '')) parts.push(i18t('ld6_ch_ask'));
  if (JSON.stringify((d.fallbacks || []).map(f => f.text)) !== JSON.stringify(L.fallbacks.map(f => f.text))) parts.push(i18t('ld6_ch_fb'));
  if (String(d.never || '') !== String(L.never || '')) parts.push(i18t('ld6_ch_never'));
  if (d.firm && d.firm !== was.firm) parts.push(i18t('ld6_ch_firm', { firm:ldFirmWord(d.firm) }));
  return parts.join(' · ') || (ch.state === 'waiting' ? i18t('ld6_ch_else') : i18t('ld6_ch_done'));
}
/* the position a change is about, by its topic (as drawn: "Liability cap"), else its name */
function ld6HistPos(ch){
  const was = ch.clauseId ? (ldStandards().find(r => r.id === String(ch.clauseId)) || null) : null;
  const d = ch.draft || {};
  return (was && was.topic) || d.category || d.name || '';
}
/* THE VERSIONS A CHANGE MOVES BETWEEN, read off the record, never guessed: a waiting change takes the position from
   where it stands to the next; an approved one is counted back from the position's version through the approved
   changes after it; a change that made the position is "new" (it became v1). Turned down or withdrawn: none. */
function ld6VerOf(ch){
  const was = ch.clauseId ? (ldStandards().find(r => r.id === String(ch.clauseId)) || null) : null;
  if (ch.state === 'waiting') return was ? { from: ld6Ver(was.gov), to: ld6Ver(was.gov) + 1 } : { isNew: true };
  if (ch.state !== 'approved' || !was) return null;
  const later = ldChanges().filter(x => x && x.state === 'approved' && String(x.clauseId || '') === String(ch.clauseId) && String(x.decidedAt || '') > String(ch.decidedAt || '')).length;
  const to = ld6Ver(was.gov) - later;
  return to <= 1 ? { isNew: true } : { from: to - 1, to };
}
/* what a change does, in a few words: its reason as the proposer wrote it, else the parts it changes */
function ld6WhatOf(ch){
  let w = String(ch.why || '').replace(/\s+/g, ' ').trim().replace(/[.!]+$/, '');
  if (w && /^[A-Z][a-z]/.test(w)) w = w[0].toLowerCase() + w.slice(1);
  return w || ld6ChangeWords(ch).toLowerCase();
}
function ld6ChangeLine(ch){
  const v = ld6VerOf(ch), d = ch.draft || {};
  if (v && v.isNew) return i18t('ld6_ch_new_firm', { firm: ldFirmWord(d.firm || 'nice').toLowerCase() });
  return (v ? `v${v.from} → v${v.to}: ` : '') + ld6WhatOf(ch);
}
function ldHistoryHtml(){
  const L = ld6HistRows();
  if (!_ld.hPick || !L.some(ch => ch.id === _ld.hPick)) _ld.hPick = L[0] ? L[0].id : null;
  const row = ch => `<tr data-ld-hrow="${LD_E(ch.id)}" tabindex="0" class="${_ld.hPick === ch.id ? 'is-sel' : ''}"><td><div class="cun-name">${LD_E(ld6HistPos(ch))}</div></td>
      <td class="ld6-chg"><span title="${LD_E(ld6ChangeLine(ch))}">${LD_E(ld6ChangeLine(ch))}</span></td><td class="ld6-by">${LD_E(ch.by || '')}</td><td>${ld6HistBadge(ch)}</td><td class="ld6-when">${LD_E(ld6Short(ch.decidedAt || ch.at))}</td></tr>`;
  return `<section class="ld-main ld-wide ld6-wide"><table class="apn-table ld6-table"><colgroup><col style="width:20%"><col><col style="width:150px"><col style="width:190px"><col style="width:80px"></colgroup>
    <thead><tr><th>${LD_E(i18t('ld6_c_position'))}</th><th>${LD_E(i18t('ld6_c_change'))}</th><th>${LD_E(i18t('ld6_c_by'))}</th><th>${LD_E(i18t('ld6_c_state'))}</th><th class="ld6-when">${LD_E(i18t('ld6_c_when'))}</th></tr></thead>
    <tbody>${L.map(row).join('') || `<tr><td colspan="5" class="apn-none">${LD_E(i18t('ld_history_none'))}</td></tr>`}</tbody></table></section>`;
}

/* ---- EDITING: the ladder itself, in boxes ---- */
function ldDraftOf(r){
  if (!r) return { name: '', category: '', ask: '', fallbacks: [], never: '', why: '', firm: 'push', books: ['_default'], ownerId: String((ldMe() || {}).id || ''), owner: (ldMe() || {}).name || '', reviewMonths: 12 };
  const L = r.ladder, g = r.gov;
  return { name: r.name, category: r.topic, ask: L.ask, fallbacks: L.fallbacks.map(f => ({ ...f })), never: L.never, why: L.why, firm: r.firm,
    books: r.place.books.length ? r.place.books.slice() : ['_default'], ownerId: g.ownerId, owner: g.owner, reviewMonths: g.reviewMonths };
}
function ldWhoOptions(sel){ return ['anyone', 'team', 'legal'].map(w => `<option value="${w}"${w === sel ? ' selected' : ''}>${LD_E(ldWho(w))}</option>`).join(''); }
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

/* ---- EDITING A POSITION (P-35, RE-BUILT AS DRAWN 21 Nov 2026): OPEN FIELDS (f1110) — the label beside the words, one
   line under each row, no boxes: Name · How firm (four pills, the chosen ink) · Applies to · Owner (amber when none) ·
   Read again · What we ask for (with Write it for me beside it) · + Add a fallback · Never accept · Why it matters. Its
   head on one line: a grey Draft badge, the position's own name (never "New position" over one being edited) and what
   the change does. The ask box, the chips and the positions down the left stay; Cancel and Send for approval stand in
   the page's head. ---- */
/* A CHOICE DRAWN AS ITS WORDS AND A SMALL CHEVRON (as drawn: "No owner yet ⌄", "every 12 months ⌄"): the words are the
   choice made; the select lies over them unseen, so a press opens HaTi's own list (selectMenuWire) as on every page */
function ldSelHtml(k, opts, said, none){
  return `<span class="ld6-sw${none ? ' is-none' : ''}"><span class="ld6-sv">${LD_E(said)}</span>${typeof icon === 'function' ? icon('chevD', 'w-3 h-3') : ''}<select class="ld6-sel" data-ld-f="${k}" aria-label="${LD_E(said)}">${opts}</select></span>`;
}
function ldEditHtml(){
  const e = _ld.edit; const d = e.draft;
  const people = (typeof getUsers === 'function' ? getUsers() : []).filter(u => u && u.role !== 'viewer');
  const ownerOpts = `<option value="">${LD_E(i18t('ld_owner_none'))}</option>` + people.map(u => `<option value="${LD_E(u.id)}"${String(u.id) === String(d.ownerId) ? ' selected' : ''}>${LD_E(u.name || u.email || '')}</option>`).join('');
  const books = stdBookKeys(playbook());
  const booksSaid = d.books.length === books.length && books.length > 1 ? i18t('ld_books_every') : d.books.map(ldBookLabel).join(', ');
  const chev = typeof icon === 'function' ? icon('chevD', 'w-3 h-3') : '';
  const ownerU = people.find(u => String(u.id) === String(d.ownerId));
  const ownerSaid = ownerU ? (ownerU.name || ownerU.email || '') : i18t('ld_owner_none');
  const box = (k, val, ph) => `<textarea class="ld-box ld6-ta" data-ld-f="${k}" rows="1" placeholder="${LD_E(ph)}">${LD_E(val || '')}</textarea>`;
  const row = (lab, inner, cls) => `<div class="ld6-f${cls ? ' ' + cls : ''}"><span class="ld6-fl">${LD_E(lab)}</span><div class="ld6-fc">${inner}</div></div>`;
  const fbs = d.fallbacks.map((f, k) => row(i18t('ld_rung_fb', { n: k + 1 }), box('fb:' + k, f.text, i18t('ld_ph_fb' + (k ? '_n' : '')))
    + `<span class="ld6-fwho">${ldSelHtml('who:' + k, ldWhoOptions(f.who), ldWho(f.who))}<button type="button" class="ui-btn ui-btn-plain ui-btn-icon ld-x" data-ld-fb-x="${k}" title="${LD_E(i18t('ld_fb_remove'))}" aria-label="${LD_E(i18t('ld_fb_remove'))}">${typeof icon === 'function' ? icon('x', 'w-3.5 h-3.5') : ''}</button></span>`)).join('');
  const title = e.clauseId ? (d.name || i18t('ld_edit_title')) : (String(d.name || '').trim() || i18t('ld_new_title'));
  return `<section class="ld-main ld-edit ld6-edit" aria-label="${LD_E(title)}">
    <div class="ld6-eh">${ld6Badge(i18t('ld6_draft'), 'gray', false, true)}<h2 class="ld-title">${LD_E(title)}</h2><span class="ld6-eh-s">· ${LD_E(e.ver ? i18t('ld6_edit_ver', { v: e.ver, n: e.ver + 1 }) : i18t('ld6_edit_new'))}</span></div>
    <div class="ld6-fs">
      ${row(i18t('ld_f_name'), `<input type="text" class="ld6-in" data-ld-f="name" value="${LD_E(d.name)}" maxlength="120">`)}
      ${row(i18t('ld_f_firm'), `<div class="ld-segs ld6-pills" role="radiogroup" aria-label="${LD_E(i18t('ld_f_firm'))}" title="${LD_E(i18t('ld_firm_says_' + d.firm))}">${LD_FIRM_ORDER.map(f => `<button type="button" role="radio" aria-checked="${f === d.firm}" class="ld-seg${f === d.firm ? ' is-on' : ''} is-${f}" data-ld-firm="${f}"><i class="ld-dot is-${f}" aria-hidden="true"></i>${LD_E(ldFirmWord(f))}</button>`).join('')}</div>`)}
      ${row(i18t('ld_f_books'), `<button type="button" class="ld6-in ld-pick" data-ld-books aria-haspopup="true"><span>${LD_E(booksSaid)}</span>${chev}</button>`, 'is-pop')}
      ${row(i18t('ld_f_owner'), ldSelHtml('ownerId', ownerOpts, ownerSaid, !d.ownerId))}
      ${row(i18t('ld6_f_review'), ldSelHtml('reviewMonths', STD_REVIEW_MONTHS.map(m => `<option value="${m}"${m === Number(d.reviewMonths) ? ' selected' : ''}>${LD_E(i18tn('ld6_every_months', m, { n: m }))}</option>`).join(''), i18tn('ld6_every_months', Number(d.reviewMonths) || 12, { n: Number(d.reviewMonths) || 12 })))}
      ${row(i18t('ld_rung_ask'), box('ask', d.ask, i18t('ld_ph_ask')) + `<button type="button" class="ld6-wr" data-ld-write ${_ld.jbBusy ? 'disabled' : ''}>${typeof icon === 'function' ? icon('mkSpark', 'w-3 h-3 ld6-spk') : ''} ${LD_E(i18t('ld_write'))}</button>`, 'is-ask')}
      ${fbs}
      ${d.fallbacks.length >= STD_FALLBACKS_MAX ? '' : row('', `<button type="button" class="ui-link ld6-add" data-ld-fb-add>+ ${LD_E(i18t('ld_fb_add'))}</button>`, 'is-add')}
      ${row(i18t('ld_rung_never'), box('never', d.never, i18t('ld_ph_never')))}
      ${row(i18t('ld_f_why'), box('why', d.why, i18t('ld_ph_why')), 'is-last')}
    </div>
  </section>`;
}
/* ---- THE PAGE ---- */
function renderStandardsPage(){
  const host = document.getElementById('content'); if (!host) return;
  const rows = ldStandards(), picked = ldPicked(rows);
  const main = _ld.edit ? ldEditHtml() : _ld.mode === 'departures' ? ldDeparturesHtml(rows) : _ld.mode === 'history' ? ldHistoryHtml() : ldLadderHtml(picked);
  /* the positions down the left on the Positions tab AND while a position is edited (as drawn: the edited one chosen);
     Departures and History are tables of their own */
  const list = _ld.edit || _ld.mode === 'ladder' ? ldListHtml(rows, picked) : '';
  const at = typeof listCaretAt === 'function' ? listCaretAt('#ld-q') : null;
  host.innerHTML = `<div class="view-enter ins-page ld-page ld6-page" data-ins-page="playbook" data-ins="1">
    <div class="ld6-col" id="ld6-col">${ld6StripHtml(rows)}<div class="ld-sheet${list ? ' has-list' : ''}">${list}${main}</div></div>
    <aside id="ins-panel" class="ins-panel" aria-label="${LD_E(i18t('ld_panel_aria'))}"></aside></div>`;
  if (typeof listCaretPut === 'function') listCaretPut('#ld-q', at);
  ldPaintHead();
  ldPaintPanel(rows, picked);
  if (typeof window.popupControlsDress === 'function') try { window.popupControlsDress(host.querySelector('.ld-sheet')); } catch (_){}
}
/* JAMBO'S PANEL FOLLOWS THE TAB, AS DRAWN (RE-BUILT 21 Nov 2026): no cards, no zero tiles, no small print — each part a
   section under a hairline with its own heading in ink; the buttons stand inside the section they belong to.
   A POSITION: its badge and name, "N contracts checked against it"; the checked contracts as ONE BAR (green hold it ·
   blue allowed once · amber to decide) with its legend; "Waits for your call": each departure with its To decide badge
   and its words quoted with §, and Decide in Approvals (black); "Looked after by" (owner, next review). */
function ld6BarHtml(r){
  const parts = [['green', r.holds, i18t('ld6_k_hold')], ['steel', r.allowed, i18t('ld6_k_allowed')], ['amber', r.decide, i18t('ld6_k_decide')]].filter(p => p[1] > 0);
  if (!parts.length) return '';
  return `<div class="ld6-pbar"><div class="mign-bbar">${parts.map(p => `<i class="is-${p[0]}" style="flex-grow:${p[1]}"></i>`).join('')}</div><div class="mign-bkey">${parts.map(p => `<span class="mign-bk"><i class="is-${p[0]}"></i>${LD_E(p[1] + ' ' + p[2])}</span>`).join('')}</div></div>`;
}
function ld6Q(q, n){ q = String(q || '').replace(/\s+/g, ' ').trim(); return q.length > n ? q.slice(0, n - 3) + '…' : q; }
function ld6Btn(label, attr, grey){ return `<button type="button" class="ld6-btn${grey ? ' is-grey' : ''}" ${attr}>${LD_E(label)}</button>`; }
function ld6KvHtml(pairs){ return `<div class="ld6-kv">${pairs.map(p => `<span class="ld6-k">${LD_E(p[0])}</span><span class="${p[2] ? 'is-' + p[2] : ''}">${LD_E(p[1])}</span>`).join('')}</div>`; }
function ld6DotsHtml(items){ return `<div class="ld6-dots">${items.map(x => `<i class="ld6-dt is-${LD_E(x.tone)}" aria-hidden="true"></i><span class="${x.cls || ''}">${x.html != null ? x.html : LD_E(x.t)}</span>`).join('')}</div>`; }
function ld6TlHtml(items){ return `<ul class="ld6-tl">${items.map(x => `<li class="${x.on ? 'is-on is-' + LD_E(x.on) : ''}"><i aria-hidden="true"></i><span>${LD_E(x.t)}${x.s ? ` <small>· ${LD_E(x.s)}</small>` : ''}</span></li>`).join('')}</ul>`; }
function ld6Five(o){ return Object.assign({ src: '' }, o, { groups: (o.groups || []).filter(g => g && g.html).map(g => Object.assign({ rows: [] }, g)) }); }
function ldPanelFive(r){
  const sub = r.checked ? i18tn('ld6_p_checked', r.checked, { n: r.checked }) : i18t('ld_none_checked');
  const groups = [];
  const bar = ld6BarHtml(r);
  if (bar) groups.push({ key:'checked', label:i18t('ld6_p_checked_h'), html:bar });
  const nice = r.firm === 'nice';
  const waits = r.open.slice(0, LD_DEPS_SHOWN).map(x => { const q = String(x.v.quote || '').replace(/\s+/g, ' ').trim(), sec = q ? ld6SecOf(x.c, q) : '';
    const key = 'dep:' + x.c.id + ':' + x.i, mine = !nice && ldDepKeysMine().has(key);
    const words = x.v.status === 'missing' ? `<p class="ld6-pq is-miss">${LD_E(i18t('ld_dep_missing'))}</p>` : q ? `<p class="ld6-pq">“${LD_E(ld6Q(q, 160))}”${sec ? ` <small>${LD_E(sec)}</small>` : ''}</p>` : '';
    return `<div class="ld6-wt"${mine ? ` data-ld-goap="${LD_E(key)}" role="button" tabindex="0"` : ''}><span class="ld6-wt-t">${LD_E(x.c.name || ld6Party(x.c))} <small>· ${LD_E(ld6Ref(x.c))}</small></span>${nice ? '' : ld6Badge(i18t('ld6_st_decide'), 'amber', false, true)}</div>${words}`; }).join('');
  const first = r.open.find(x => !nice && ldDepKeysMine().has('dep:' + x.c.id + ':' + x.i));
  if (waits) groups.push({ key:'waits', label:i18t(nice ? 'ld_dep_info' : 'ld6_p_waits'),
    html: waits + (r.open.length > LD_DEPS_SHOWN ? `<button type="button" class="ui-link ld6-more" data-ld-mode="departures">${LD_E(i18tn('ld_dep_more', r.open.length - LD_DEPS_SHOWN, { n:r.open.length - LD_DEPS_SHOWN }))}</button>` : '')
      + (first ? `<div class="ld6-acts">${ld6Btn(i18t('ld6_go_ap'), `data-ld-goap="${LD_E('dep:' + first.c.id + ':' + first.i)}"`)}</div>` : '') });
  /* a change waiting on this position: the one who may decide it decides here (the ladder says it too) */
  const ch = r.wait;
  if (ch && ldMayDecide(ch)) groups.push({ key:'change', label:i18t('ld6_p_change'), html:`<p class="ld6-pt">${LD_E(i18t('ld_change_waits', { who: ch.by || '', day: ldDay(ch.at) }))}</p><div class="ld6-acts">${ld6Btn(i18t('ld_decide'), `data-ld-decide="${LD_E(ch.id)}"`)}</div>` });
  groups.push({ key:'who', label:i18t('ld6_p_looked'), html:ld6KvHtml([[i18t('ld_owner'), r.gov.owner || i18t('ld_owner_none'), r.gov.owner ? '' : 'amber'],
    [i18t('ld_next_review'), r.gov.reviewNext ? ldDay(r.gov.reviewNext) : i18t('ld_review_never'), r.reviewSoon ? 'amber' : '']]) });
  return ld6Five({ before:`<div class="ld6-pb">${ld6FirmBadge(r.firm)}</div>`, title: r.name, sub, groups });
}
/* A DEPARTURE: state and firm badges, "<contract> · <position>", the other side · reference · how long it waited;
   Decide in Approvals (black) and See it in the paper ›; The paper says (quoted, §); Our ladder with the paper's words
   placed BELOW it in red ("… · below the ladder") */
function ld6DepFive(d){
  const c = d.x.c, r = d.r, q = String(d.x.v.quote || '').replace(/\s+/g, ' ').trim(), sec = q ? ld6SecOf(c, q) : '';
  const mine = !d.allowed && r.firm !== 'nice' && ldDepKeysMine().has(d.key);
  const L = r.ladder;
  /* OUR LADDER IN SHORT LINES, as drawn (RE-POINTED 22 Nov 2026, batch 7 review): each rung on ONE line, its words ending
     in "…" before its label, which always shows; a press on a rung opens its whole wording (and closes it again) */
  const line = (w, lab) => `<button type="button" class="ld6-lr" data-ld-rung aria-expanded="false" title="${LD_E(String(w || ''))}"><span class="ld6-lw">${LD_E(String(w || '').replace(/\s+/g, ' ').trim())}</span><span class="ld6-ll">· ${LD_E(lab)}</span></button>`;
  const lad = [{ tone:'green', html:line(L.ask || i18t('ld_rung_none'), i18t('ld6_l_ask')) }]
    .concat(L.fallbacks.map((f, k) => ({ tone:'amber', html:line(f.text || i18t('ld_rung_none'), i18t('ld6_l_fb', { n:k + 1 })) })))
    .concat(L.never ? [{ tone:'dark', html:line(L.never, i18t('ld6_l_never')) }] : [])
    .concat([{ tone:'ruby', cls:'is-ruby', html:line(d.x.v.status === 'missing' ? i18t('ld_dep_missing') : (q || i18t('ld_dep_off')), i18t('ld6_below_short')) }]);
  const peekOk = typeof window.apnPeekOpen === 'function';
  const acts = (mine ? ld6Btn(i18t('ld6_go_ap'), `data-ld-goap="${LD_E(d.key)}"`) : '') + (peekOk ? `<button type="button" class="ui-link ld6-lnk" data-ld-peek="${LD_E(d.key)}">${LD_E(i18t('apn_peek'))}</button>` : '');
  const groups = [];
  if (q) groups.push({ key:'says', label:i18t('ld6_p_says'), html:`<p class="ld6-pq is-big">“${LD_E(q)}”</p>${sec ? `<p class="ld6-pt is-quiet">${LD_E(sec)}</p>` : ''}` });
  groups.push({ key:'ladder', label:i18t('ld6_p_ladder'), html:ld6DotsHtml(lad) });
  const age = ld6Age(ld6DepAt(d.x));
  return ld6Five({ before:`<div class="ld6-pb">${ld6StateBadge(d.allowed)}${ld6FirmBadge(r.firm)}</div>`,
    title:(c.name || ld6Party(c)) + ' · ' + r.topic, sub:[ld6Party(c), ld6Ref(c), age].filter(Boolean).join(' · '),
    mid: acts ? `<div class="ld6-acts">${acts}</div>` : '', groups });
}
/* the words a change moves, cut to where they differ (a word or two kept on each side), so "was → now" reads at a glance */
function ld6DiffPair(a, b){
  const A = String(a || '').trim().split(/\s+/), B = String(b || '').trim().split(/\s+/);
  let s = 0; while (s < A.length && s < B.length && A[s] === B[s]) s++;
  let e = 0; while (e < A.length - s && e < B.length - s && A[A.length - 1 - e] === B[B.length - 1 - e]) e++;
  const from = Math.max(0, s - 1), cut = (W) => { const to = Math.min(W.length, W.length - e + 2); return (from > 0 ? '…' : '') + W.slice(from, to).join(' ') + (to < W.length ? '…' : ''); };
  return { was: cut(A), now: cut(B) };
}
/* A CHANGE: its badge, "<position> · vN → vN+1", "Proposed by <who> · <when>", Withdraw (for its author, grey) or
   Decide (for who may), the change as was → now, a timeline */
function ld6HistFive(ch){
  const d = ch.draft || {};
  const was = ch.clauseId ? (ldStandards().find(r => r.id === String(ch.clauseId)) || null) : null;
  const v = ld6VerOf(ch);
  const ver = v && v.isNew ? i18t('ld6_v_new') : v ? `v${v.from} → v${v.to}` : '';
  const groups = [];
  if (ch.state === 'waiting' && was && String(was.ladder.ask || '') !== String(d.ask || '')){
    const p = ld6DiffPair(was.ladder.ask, d.ask);
    groups.push({ key:'was', label:i18t('ld6_p_change_h'), html:`<div class="ld6-kv is-was"><span class="ld6-k">${LD_E(i18t('ld6_was'))}</span><s>${LD_E(p.was)}</s><span class="ld6-k">${LD_E(i18t('ld6_now'))}</span><span>${LD_E(p.now)}</span></div>` });
  } else groups.push({ key:'was', label:i18t('ld6_p_change_h'), html:`<div class="ld6-kv is-was"><span class="ld6-k">${LD_E(i18t('ld6_now'))}</span><span>${LD_E(ld6Q(d.ask || i18t('ld_rung_none'), 140))}</span></div>${was ? `<p class="ld6-pt is-quiet">${LD_E(ld6ChangeWords(ch))}</p>` : ''}` });
  const first = n => String(n || '').trim().split(/\s+/)[0] || '';
  const tl = [{ on:'accent', t:i18t('ld6_tl_proposed', { who:first(ch.by) }), s:ld6Short(ch.at) }];
  if (ch.state === 'waiting') tl.push({ t:i18t('ld6_tl_2') });
  else if (ch.decidedBy) tl.push({ on:ch.state === 'approved' ? 'green' : 'ruby', t:i18t(ch.state === 'approved' ? 'ld6_tl_approved' : 'ld6_tl_refused', { who:first(ch.decidedBy) }), s:ld6Short(ch.decidedAt) });
  else tl.push({ on:'gray', t:i18t('ld6_h_withdrawn') });
  groups.push({ key:'tl', label:i18t('apn5_timeline'), html:ld6TlHtml(tl) });
  const me = String((ldMe() || {}).id);
  const act = ldMayDecide(ch) ? ld6Btn(i18t('ld_decide'), `data-ld-decide="${LD_E(ch.id)}"`)
    : ch.state === 'waiting' && String(ch.byId) === me ? ld6Btn(i18t('ld_withdraw'), `data-ld-withdraw="${LD_E(ch.id)}"`, true) : '';
  return ld6Five({ before:`<div class="ld6-pb">${ld6HistBadge(ch)}</div>`, title:[ld6HistPos(ch), ver].filter(Boolean).join(' · '),
    sub:i18t('ld6_p_by', { who:ch.by || '', when:ld6Short(ch.at) }), mid: act ? `<div class="ld6-acts">${act}</div>` : '', groups });
}
/* EDITING: "Before you send it" — who decides (any admin but you) said under it; what is still to fill as amber dots and
   what is filled as a green one; then a three-step timeline: you send it → another admin decides → it becomes vN and
   contracts are checked against it */
function ld6EditFive(){
  const e = _ld.edit, d = e.draft;
  const need = [], done = [];
  (String(d.name || '').trim() ? done : need).push(i18t('ld6_n_name'));
  done.push(i18t('ld6_n_firm'), i18t('ld6_n_books'));
  if (!String(d.ask || '').trim()) need.push(i18t('ld_rung_ask'));
  if (!d.ownerId) need.push(i18t('ld6_n_owner'));
  if (String(d.why || '').trim()) done.push(i18t('ld6_n_why'));
  const joined = done.join(', ');
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const items = need.map(t => ({ tone:'amber', t:cap(t) })).concat(done.length ? [{ tone:'green', t:cap(joined), cls:'is-quiet' }] : []);
  const next = e.ver ? e.ver + 1 : 1;
  return ld6Five({ before:`<div class="ld6-pb">${ld6Badge(i18t('ld6_draft'), 'gray', false, true)}</div>`, title:i18t('ld6_p_before'), sub:i18t('ld6_p_decides_s'),
    groups:[{ key:'need', label:i18t('ld6_p_still'), html:ld6DotsHtml(items) },
      { key:'tl', label:i18t('ld6_p_then'), html:ld6TlHtml([{ on:'amber', t:i18t('ld6_tl_1') }, { t:i18t('ld6_tl_2') }, { t:i18t('ld6_tl_3', { v:next }) }]) }] });
}
function ldPaintPanel(rows, picked){
  if (typeof insPaintPanel !== 'function') return;
  const base = { seat: 'ld', jlPh: i18t('jl_ph_any'), jlHome: i18t('ld_page'), jlSay: () => ({ lines: [ldPageSay(rows)] }) };
  if (typeof jamboOverviewHtml !== 'function'){ insPaintPanel(Object.assign(base, { c: null, item: null })); return; }
  let id = '', word = '', o = null;
  if (_ld.edit){ id = 'ld:edit'; word = i18t('ld6_p_before'); o = ld6EditFive(); }
  else if (_ld.mode === 'departures'){ const d = ld6DepRows(rows).find(x => x.key === _ld.depPick); if (d){ id = 'ld:' + d.key; word = d.r.topic; o = ld6DepFive(d); } }
  else if (_ld.mode === 'history'){ const ch = ld6HistRows().find(x => x.id === _ld.hPick); if (ch){ id = 'ld:h:' + ch.id; word = ld6HistPos(ch); o = ld6HistFive(ch); } }
  else if (picked){ id = 'ld:' + picked.id; word = picked.name; o = ldPanelFive(picked); }
  if (!o){ insPaintPanel(Object.assign(base, { c: null, item: null })); return; }
  insPaintPanel(Object.assign(base, { item: { id }, head: false, solo: true, jlWord: word, body: `<div class="jl-words is-ov ld6-p">${jamboOverviewHtml(o, 'ld')}</div>`, acts: [] }));
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
  _ld.edit = { clauseId: r && !r.bookOnly ? r.id : null, bookOnlyId: r && r.bookOnly ? r.id : null, ver: r && !r.bookOnly ? (r.gov.ver || 1) : 0, draft: ldDraftOf(r), base: r ? ldDraftOf(r) : null, jb: null };
  renderStandardsPage();
  const f = document.querySelector('.ld-edit [data-ld-f="' + (r ? 'ask' : 'name') + '"]');
  if (f && typeof window.fieldFocus === 'function') window.fieldFocus(f); else if (f) f.focus();
}
function ldCancelEdit(){ _ld.edit = null; renderStandardsPage(); }
/* leave an edit for another view: at once when nothing was changed, else only on the person's yes */
function ldEditChanged(){
  const e = _ld.edit; if (!e) return false;
  ldEditRead();
  const strip = d => JSON.stringify(d ? { name: d.name, ask: d.ask, fallbacks: d.fallbacks, never: d.never, why: d.why, firm: d.firm, books: d.books, ownerId: d.ownerId, reviewMonths: Number(d.reviewMonths) } : null);
  return strip(e.draft) !== strip(e.base || ldDraftOf(null));
}
async function ldLeaveEdit(then){
  if (_ld.edit && ldEditChanged()){
    const ok = typeof window.confirmDialog === 'function' ? await window.confirmDialog({ title: i18t('ld6_leave_t'), message: i18t('ld6_leave_m'), confirmLabel: i18t('ld6_leave_go'), danger: true }) : true;
    if (!ok) return;
  }
  _ld.edit = null; then();
}
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
    /* P-35: a row of Departures or History chooses it (the panel follows); See it in the paper › is Approvals' own window */
    const dr = t.closest('[data-ld-deprow]');
    if (dr){ _ld.depPick = dr.getAttribute('data-ld-deprow'); renderStandardsPage(); return; }
    const hr = t.closest('[data-ld-hrow]');
    if (hr && !t.closest('button')){ _ld.hPick = hr.getAttribute('data-ld-hrow'); renderStandardsPage(); return; }
    /* a rung of Our ladder opens to its whole wording, and closes on a second press (nothing redrawn) */
    const rg = t.closest('[data-ld-rung]');
    if (rg){ ev.preventDefault(); const on = !rg.classList.contains('is-open'); rg.classList.toggle('is-open', on); rg.setAttribute('aria-expanded', String(on)); return; }
    const pk = t.closest('[data-ld-peek]');
    if (pk){ ev.preventDefault(); if (typeof window.apnPeekOpen === 'function') window.apnPeekOpen(pk.getAttribute('data-ld-peek')); return; }
    const b = t.closest('[data-ld-book-clear],[data-ld-pick],[data-ld-mode],[data-ld-new],[data-ld-edit],[data-ld-write],[data-ld-cancel],[data-ld-send],[data-ld-firm],[data-ld-fb-add],[data-ld-fb-x],[data-ld-books],[data-ld-decide],[data-ld-withdraw],[data-ld-goap]');
    if (!b) return;
    if (b.hasAttribute('data-ld-book-clear')){ ldBookSet(null); return; }
    /* the positions and the chips stay on the page while a position is edited (as drawn): leaving the edit by them never
       throws typed words away unasked */
    if (b.hasAttribute('data-ld-pick')){ const id = b.getAttribute('data-ld-pick'); ldLeaveEdit(() => { _ld.pick = id; _ld.mode = 'ladder'; renderStandardsPage(); }); return; }
    if (b.hasAttribute('data-ld-mode')){ const m = b.getAttribute('data-ld-mode'); ldLeaveEdit(() => { _ld.mode = _ld.mode === m && m !== 'ladder' ? 'ladder' : m; renderStandardsPage(); }); return; }
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
  const keep = ev => { const t = ev.target; if (!(t && t.closest && t.closest('.ld-edit') && t.hasAttribute && t.hasAttribute('data-ld-f'))) return;
    ldEditRead();
    /* the owner's words stay amber while there is none (as drawn: "No owner yet") */
    const sw = t.closest('.ld6-sw'), sv = sw && sw.querySelector('.ld6-sv');
    if (sv && t.selectedOptions && t.selectedOptions[0]) sv.textContent = t.selectedOptions[0].textContent;
    if (sw && t.getAttribute('data-ld-f') === 'ownerId') sw.classList.toggle('is-none', !t.value); };
  document.addEventListener('input', keep); document.addEventListener('change', keep);
  /* the ask box narrows what the tab shows; the page is drawn again with the caret kept */
  document.addEventListener('input', ev => { const t = ev.target; if (!t || t.id !== 'ld-q' || !state || state.view !== 'playbook') return; _ld.q = t.value; renderStandardsPage(); });
  /* the edit panel's "still to fill" follows the words as they are typed */
  document.addEventListener('input', ev => { const t = ev.target; if (!t || !t.closest || !t.closest('.ld-edit') || !_ld.edit) return; clearTimeout(document._ldPanT); document._ldPanT = setTimeout(() => { if (_ld.edit && state.view === 'playbook') ldPaintPanel(ldStandards(), null); }, 300); });
}
Object.assign(window, { ld6Badge, ld6FirmBadge, ld6DepRows, ld6HistRows, ld6DepFive, ld6HistFive, ld6EditFive, ld6StripHtml, ldGoApprovals, ldDepKeysMine, ldFirmWord, ldWho, ldBookLabel, ldPickSet, ldDepRun, ldAfterDecide, ldBookNow, ldBookSet, renderStandardsPage, ldPaintHead, ldStandards, ldPicked, ldChanges, ldMayDecide, ldStartEdit, ldSendOpen, ldDecideOpen, ldWithdraw, ldWrite, ldJbDraftHtml, ldJbPut, ldJbUndo, ldPanelFive });
