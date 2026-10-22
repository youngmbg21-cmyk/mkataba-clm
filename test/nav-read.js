/* WHERE THE APP STANDS, AND DOES IT STAND WHERE A SENTENCE SAID
   ============================================================
   The navigation exam's readers (test/chromium/nav-exam-verify.js), shared
   with the Jambo exam (test/chromium/jambo-exam-measure.js) so both judge a
   landing the same way. Moved here unchanged, 22 Oct 2026. */
/* global state, hbS, pdContract, pdTab, pdFaceNow, pdSendShows, hbCvNow, regPlaceUp, regFiltered, regScope, insSelected,
   settingsTab, settingsPlace, SET_PANELS, obwPlace, intel, ai, tplPlace, tplPfChosen, tplOverviewData,
   mPhone, mS, bsCardId, bsStrip, pdSendFor, deskPageName */
const { navContracts, quarterEnd } = require('./nav-world');

/* THE ROWS CONTRACTS SHOULD SHOW, worked out from the world itself (never a list typed by hand) */
const BOOK = navContracts();
const STAGE = { signed: 'Signed', draft: 'Draft', review: 'Under Review' };
function expectedRows(f){
  const today = new Date().toISOString().slice(0, 10), qEnd = quarterEnd(), yEnd = `${new Date().getFullYear()}-12-31`;
  return BOOK.filter(c => {
    if (f.stream && c.folder !== f.stream) return false;
    if (f.stage && c.status !== STAGE[f.stage]) return false;
    if (f.party && c.counterparty.toLowerCase() !== f.party) return false;
    if (f.ending === 'quarter' && !(c.expiry >= today && c.expiry <= qEnd)) return false;
    if (f.ending === 'year' && !(c.expiry >= today && c.expiry <= yEnd)) return false;
    return true;
  }).map(c => c.id).sort();
}

/* WHERE THE APP STANDS, in the exam's words — the app's own readers, nothing guessed */
function navWhereSrc(){
  const W = {};
  const v = state.view;
  const face = (typeof hbS === 'function' && hbS()) ? hbS().face : null;
  const pc = (typeof pdContract === 'function') ? pdContract() : null;
  const VIEW_PAGE = { obligations: 'obligations', approvals: 'approvals', intake: 'requests', templates: 'templates', playbook: 'standards',
    directory: 'people', customers: 'parties', mynotes: 'notes', migration: 'import', team: 'settings', agents: 'agents', jambo: 'agents',
    register: 'contracts', calendar: 'calendar', intel: 'insights' };
  /* THE PHONE draws its own screens: a contract open there is state.activeId on its 'contract' screen */
  const phone = typeof mPhone === 'function' && mPhone() && typeof mS === 'function';
  /* A CONTRACT BROUGHT UP ON THE BOARD (its History, its deal) is that contract, beside its own page */
  const cv = (typeof hbCvNow === 'function') ? (hbCvNow() || {}) : {};
  if (phone && (v === 'workspace' || v === 'doc' || mS().screen === 'contract')){ W.page = 'paper'; W.cid = state.activeId || null; }
  /* a contract's strip brought up on the Board (its History, where it stands): that contract, beside that page */
  else if ((v === 'dashboard' || v === 'counter') && face === 'board' && typeof bsCardId === 'function' && bsCardId()){
    const id = bsCardId(), st = (typeof bsStrip === 'function') ? bsStrip(id) : null;
    W.page = 'paper'; W.cid = id; W.pane = ({ hist: 'hist', where: 'dossier', details: 'fill' })[(st && st.page) || ''] || 'dossier'; }
  else if ((v === 'dashboard' || v === 'counter') && face === 'board' && cv.c && cv.v !== 'book'){
    W.page = 'paper'; W.cid = cv.c.id; W.pane = ({ hist: 'hist', oblig: 'oblig', deal: 'dossier' })[cv.v] || 'dossier'; }
  /* Home's first screen (the counter: the ask box and Needs you) is the Board's page, whatever paper is held behind it */
  else if (v === 'counter') W.page = 'board';
  else if (v === 'dashboard'){
    if (face === 'paper') W.page = pc ? 'paper' : ((typeof regPlaceUp === 'function' && regPlaceUp()) ? 'contracts' : 'paper');
    else W.page = face || 'board';
  } else if (v === 'redline'){
    /* the Negotiations list is the redline view with no contract's paper in it (its bar names the page) */
    let name = ''; try { name = (typeof deskPageName === 'function') ? String(deskPageName() || '') : ''; } catch (_){ name = ''; }
    W.page = ((typeof regScope === 'function' && regScope() === 'negotiations') || /^(negotiations|förhandlingar)$/i.test(name.trim())) ? 'negotiations' : 'paper';
  }
  else W.page = VIEW_PAGE[v] || v;
  if (W.page === 'paper' && pc && !W.cid){
    W.cid = pc.id;
    const f = (typeof pdFaceNow === 'function') ? pdFaceNow() : '';
    /* Compare versions, open over the paper, set from the first version to the current wording */
    const ca = document.getElementById('cmp-a'), cb = document.getElementById('cmp-b');
    const one = !ca && document.getElementById('cmp-close') && /compare versions|jämför versioner/i.test(((document.getElementById('cmp-close').closest('[role="dialog"], .modal, #modal-root') || document.body).textContent) || '');
    if (one) W.pane = 'compare-one';   // the screen's own "only one version so far"
    else if (ca && cb) W.pane = (ca.value === '0' && /current|aktuell/i.test((cb.options[cb.selectedIndex] || {}).textContent || '')) ? 'compare' : 'compare-other';
    else if (document.querySelector('#brief-section')) W.pane = 'brief';
    else if (typeof pdSendShows === 'function' && pdSendShows() && String(pdSendFor()) === String(pc.id)) W.pane = 'send';
    else if (f) W.pane = ({ fill: 'fill', red: 'redlines', signing: 'sign', amend: 'amend' })[f] || f;
    /* FILL IN IS THE CHECKLIST (owner picked "1 · Checklist", 22 Oct 2026): what is owed, landed on the Dossier */
    else if ((typeof pdTab === 'function') && pdTab() === 'copilot' && document.querySelector('#pd-og .is-landed, #pd-og.is-landed, #pd-glance .is-landed')) W.pane = 'fill';
    else W.pane = ({ copilot: 'dossier', doc: 'clauses', oblig: 'oblig' })[(typeof pdTab === 'function') ? pdTab() : ''] || '';
    const L = document.querySelector('.is-landed[data-clause], .is-landed[data-pz-clause], .is-landed[data-th-row], .rl-arrived');
    if (L){ const m = String(L.textContent || '').trim().match(/^(?:§\s*)?(\d+)[.)\s]/); if (m) W.clause = m[1]; }
  }
  if (W.page === 'contracts' && typeof regFiltered === 'function'){ try { W.rows = regFiltered().map(c => c.id).sort(); } catch (_){ W.rows = null; } }
  if (W.page === 'parties' && typeof insSelected === 'function') W.party = insSelected('customers') || null;
  if (W.page === 'obligations'){
    const p = (typeof obwPlace === 'function') ? obwPlace() : {};
    W.window = p.due === 7 || p.due === '7' ? 'week' : null;
    const k = insSelected('obligations'); W.item = k ? String(k).split('::').pop() : null;
  }
  if (W.page === 'requests'){ const k = insSelected('intake:team'); const r = k && document.querySelector(`tr[data-ik-row="${k}"]`); W.item = r ? r.innerText.replace(/\s+/g, ' ').trim() : k || null; }
  if (W.page === 'people'){ const k = insSelected('directory'); const r = k && document.querySelector(`#dir-tbody [data-dir-row="${k}"]`); W.item = r ? r.innerText.replace(/\s+/g, ' ').trim() : k || null; }
  if (W.page === 'standards'){
    W.item = insSelected('std:books') || null;
    const L = document.querySelector('.is-landed'); W.row = L ? L.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : null;
  }
  if (W.page === 'templates'){
    let n = ''; try { const ch = tplPfChosen(tplOverviewData()); n = (ch && (ch.name || ch.title)) || ''; } catch (_){}
    W.item = [n, (typeof tplPlace === 'function' && tplPlace().pick) || ''].filter(Boolean).join(' ') || null;   // its name or its key
  }
  if (W.page === 'settings'){
    const S = { tab: (typeof settingsTab === 'function') ? settingsTab() : null };
    const P = (typeof settingsPlace === 'function') ? (settingsPlace() || {}) : {};
    S.page = P.dock || P.page || null; S.item = P.stream || null;
    const dr = document.querySelector('#st-drawer.open');
    if (dr){
      const t = (dr.querySelector('.rvd-title') || {}).textContent || '';
      S.drawer = t.trim();
      for (const k of Object.keys(SET_PANELS || {})){ try { if (SET_PANELS[k].title && SET_PANELS[k].title() === S.drawer){ S.page = k; break; } } catch (_){} }
      if (dr.querySelector('#tm-cap, #tm-cap-none, #tm-role')) { S.person = S.drawer; }
    }
    const L = document.querySelector('.is-landed');
    if (L){
      const card = L.closest('[data-st-you-card]'); if (card) S.row = card.getAttribute('data-st-you-card');
      if (L.id === 'tm-cap' || L.closest('#tm-cap') || L.id === 'tm-cap-none' || L.id === 'tm-cap-says') S.row = 'signcap';
    }
    const youCard = document.querySelector('[data-st-you-card].is-landed, [data-st-you-card] .is-landed');
    if (!S.row && youCard) S.row = (youCard.closest('[data-st-you-card]') || youCard).getAttribute('data-st-you-card');
    W.settings = S;
  }
  /* what he SAID, when he did not move: the last assistant turn of the one conversation */
  const H = (typeof ai === 'object' && ai && Array.isArray(ai.history)) ? ai.history : ((typeof intel === 'object' && intel && intel.history) || []);
  const last = [...H].reverse().find(m => m && m.role === 'assistant');
  if (last){
    W.said = String(last.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
    W.act = last.act ? (last.act.kind || null) : null;
    W.choices = Array.isArray(last.choices) ? last.choices.length : (last.act && Array.isArray(last.act.picks) ? last.act.picks.length : 0);
  }
  return W;
}

/* DOES THE APP STAND WHERE THE SENTENCE SAID — every part of the spot */
const PAGE_ALIAS = { people: ['team', 'directory'], streams: ['streams', 'folders'], approvals: ['approvals', 'rules'], ai: ['copilot', 'engine'],
  links: ['linkcode'], review: ['review'], desk: ['desk'], fx: ['company', 'fx'], filing: ['company', 'filing', 'folders'], keeping: ['streams', 'keeping'] };
function judge(spot, W, before){
  const why = [];
  if (spot.reply){
    const said = String(W.said || '').toLowerCase(), moved = W.page !== before.page || W.cid !== before.cid;
    const kind = spot.reply === 'which' ? (W.choices > 1 || /which (one )?did you mean|vilken menade du/.test(said))
      : spot.reply === 'none' ? (!moved && /(no|can.?t find|cannot find|not find|doesn.?t exist|does not exist|isn.?t|finns inte|hittar inte|there is no)/.test(said))
      : (!moved && /(admin|not allowed|may not|only an admin|cannot open|can.?t open|bara en administratör)/.test(said));
    if (!kind) why.push(`reply ${spot.reply} — said "${W.said || ''}" (moved: ${moved})`);
    return why;
  }
  if (spot.page && W.page !== spot.page) why.push(`page ${W.page} ≠ ${spot.page}`);
  if (spot.cid && W.cid !== spot.cid) why.push(`contract ${W.cid || '—'} ≠ ${spot.cid}`);
  if (spot.pane && W.pane !== spot.pane) why.push(`beside ${W.pane || '—'} ≠ ${spot.pane}`);
  if (spot.clause && W.clause !== spot.clause) why.push(`clause ${W.clause || '—'} ≠ ${spot.clause}`);
  if (spot.party && W.party !== spot.party) why.push(`party ${W.party || '—'} ≠ ${spot.party}`);
  if (spot.filters){
    if (spot.filters.window){ if (W.window !== spot.filters.window) why.push(`window ${W.window || '—'} ≠ ${spot.filters.window}`); }
    else { const want = expectedRows(spot.filters).join(','), got = (W.rows || []).join(',');
      if (want !== got) why.push(`rows [${got}] ≠ [${want}]`); }
  }
  if (spot.settings){
    const S = W.settings || {}, E = spot.settings;
    if (E.tab && S.tab !== E.tab) why.push(`settings tab ${S.tab || '—'} ≠ ${E.tab}`);
    if (E.page && !(PAGE_ALIAS[E.page] || [E.page]).includes(S.page)) why.push(`settings page ${S.page || '—'} ≠ ${E.page}`);
    if (E.person && !String(S.person || S.drawer || '').includes(E.person)) why.push(`person ${S.person || S.drawer || '—'} ≠ ${E.person}`);
    if (E.row && S.row !== E.row) why.push(`row ${S.row || '—'} ≠ ${E.row}`);
    if (E.item && S.item !== E.item) why.push(`stream ${S.item || '—'} ≠ ${E.item}`);
  }
  if (spot.item){
    const it = String(W.item || '');
    const ok = spot.page === 'standards' ? it === spot.item
      : spot.page === 'templates' ? new RegExp(spot.item, 'i').test(it)
      : it === spot.item || it.includes(spot.item);
    if (!ok) why.push(`item ${W.item || '—'} ≠ ${spot.item}`);
  }
  if (spot.row && spot.page === 'standards'){
    const LBL = { liabilityMonths: /liability/i, paymentDays: /payment/i, Confidentiality: /confidential/i };
    if (!(LBL[spot.row] || /$^/).test(String(W.row || ''))) why.push(`standard ${W.row || '—'} ≠ ${spot.row}`);
  }
  return why;
}

module.exports = { navWhereSrc, judge, expectedRows };
