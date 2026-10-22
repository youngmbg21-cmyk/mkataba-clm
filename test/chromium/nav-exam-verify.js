/* THE NAVIGATION EXAM, WHERE THE READER TYPES
   ============================================================
   (owner, 22 Oct 2026: "Make HaTi navigable by typing, the way Power BI is
   navigable by pressing")
   Every sentence of test/nav-exam.js is typed into a real Jambo box in a real
   browser, over the world of test/nav-world.js, and the app is then READ for
   where it stands (navWhere, below: the app's own location readers, put into
   the exam's one vocabulary). A sentence passes only when EVERY part of its
   spot matches: the page, the contract, what stands beside it, the clause
   landed, the party chosen, the exact rows Contracts shows, the Settings tab,
   page, person and row, the one thing chosen, or the reply kind.
   It is a MEASUREMENT: it prints the score by section and by box and every
   miss with what happened instead, writes them to NAV_EXAM_OUT when given,
   and fails only when the score falls below NAV_EXAM_MIN (a ratchet that each
   stage raises; it never goes down).
   Run: node test/chromium/nav-exam-verify.js            (all)
        NAV_EXAM_ONLY=clause node …                      (one section)  */
/* global state, hbS, pdContract, pdTab, pdFaceNow, pdSendShows, hbCvNow, regPlaceUp, regFiltered, regScope, insSelected,
   settingsTab, settingsPlace, SET_PANELS, obwPlace, intel, ai, tplPlace, tplPfChosen, tplOverviewData, getContract,
   setView, pdSendFor, hbOpenHome, hbSetFace, hbOpenCalendar, settingsGoTab, rlOpenClauseEditor, negoClauseList, openTemplateBuilder,
   api, aiWinToggle, openAI, mPhone, mS, bsCardId, bsStrip, closeModal, landOff, pdOpenOnHome, navLanding */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedNavWorld, navContracts, quarterEnd } = require('../nav-world');
const { NAV_EXAM } = require('../nav-exam');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
/* THE RATCHET: the score may not fall below this. Stage 0 measured 81 of 194 before anything was built
   (22 Oct 2026); a run moves by a sentence or two on timing, so the floor sits a little under. Each stage
   raises it and none lowers it. */
const NAV_EXAM_FLOOR = 180;
const MIN = Number(process.env.NAV_EXAM_MIN || NAV_EXAM_FLOOR);
const ONLY = process.env.NAV_EXAM_ONLY || '';   // a section's name, or its first words

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
  else if (v === 'dashboard' || v === 'counter'){
    if (face === 'paper') W.page = pc ? 'paper' : ((typeof regPlaceUp === 'function' && regPlaceUp()) ? 'contracts' : 'paper');
    else W.page = face || 'board';
  } else if (v === 'redline') W.page = (typeof regScope === 'function' && regScope() === 'negotiations') ? 'negotiations' : 'paper';
  else W.page = VIEW_PAGE[v] || v;
  if (W.page === 'paper' && pc && !W.cid){
    W.cid = pc.id;
    const f = (typeof pdFaceNow === 'function') ? pdFaceNow() : '';
    if (document.querySelector('#brief-section')) W.pane = 'brief';
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

(async () => {
  /* the exam asks two hundred things in a few minutes: the per-minute AI ceiling is raised for it, as
     f128 does, so an unplaced ask is answered and never "Jambo limit reached" */
  const h = await startHati({ AI_RATE_DEEP: '5000', AI_RATE_LIGHT: '5000' });
  await seedNavWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const results = [];
  const errors = [];
  const pages = {};
  /* one signed-in page per seat (the admin at a computer, a member at a computer, the admin on a phone) */
  async function seat(who, w, hh){
    const key = who + w;
    if (pages[key]) return pages[key];
    const ctx = await browser.newContext({ viewport: { width: w, height: hh } });
    const P = await ctx.newPage();
    P.on('pageerror', e => errors.push(String(e && e.message || e)));
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    const cred = who === 'legal' ? ['everything@example.co.ke', 'their-own-pass-9'] : ['admin@example.co.ke', 'adminpassword1'];
    await P.fill('#li-email', cred[0]); await P.fill('#li-pass', cred[1]); await P.click('#li-go');
    await P.waitForFunction(() => !!(window.currentUser && currentUser() && typeof setView === 'function' && state.contracts && state.contracts.length), null, { timeout: 20000 });
    await P.evaluate(() => { state.aiConfigured = true; });
    pages[key] = P;
    return P;
  }
  const settle = async P => {
    let prev = '';
    for (let i = 0; i < 24; i++){
      const now = await P.evaluate(src => { const busy = (window.intel && intel.busy) || (window.ai && ai.busy) || (typeof navLanding === 'function' && navLanding()); return JSON.stringify([busy, new Function('return (' + src + ')()')()]); }, navWhereSrc.toString()).catch(() => '');
      if (now && now === prev && !JSON.parse(now)[0]) return;
      prev = now;
      await P.waitForTimeout(250);   // a bounded poll for the app to stand still: two equal readings a beat apart
    }
  };
  const where = P => P.evaluate(src => new Function('return (' + src + ')()')(), navWhereSrc.toString()).catch(e => ({ error: String(e.message || e) }));

  /* WHERE EACH BOX IS, AND HOW A PERSON TYPES INTO IT */
  async function typeInto(P, box, q){
    const fillEnter = async sel => { await P.waitForSelector(sel, { state: 'visible', timeout: 6000 }); await P.fill(sel, q); await P.press(sel, 'Enter'); };
    if (box === 'home' || box === 'board') return fillEnter('#igd-input');
    if (box === 'chat' || box === 'phone'){
      await P.evaluate(() => { const i = document.getElementById('ai-input'); const shown = i && i.offsetParent;
        if (!shown){ if (typeof aiWinToggle === 'function') aiWinToggle(); else if (typeof openAI === 'function') openAI(); } });
      return fillEnter('#ai-input');
    }
    if (box === 'list'){ await P.evaluate(() => setView('approvals')); await settle(P); return fillEnter('#jl-q'); }
    if (box === 'settings'){ await P.evaluate(() => { setView('team'); }); await settle(P); return fillEnter('#st-jb-q'); }
    if (box === 'calendar'){ await P.evaluate(() => hbOpenCalendar()); await settle(P); return fillEnter('#cal-plan-in'); }
    if (box === 'editor'){
      await P.evaluate(() => { const c = getContract('MK-A2'); const cl = negoClauseList(c); rlOpenClauseEditor(c, cl[0].clauseId, {}); });
      return fillEnter('#ce-ask');
    }
    if (box === 'builder'){
      await P.evaluate(async () => { const d = await api('templates', 'POST', { name: 'Exam probe ' + Date.now(), category: 'other', description: '' });
        const t = await api('templates/' + d.template.id); await openTemplateBuilder(d.template.id, t.versions.find(v => v.status === 'draft').id); });
      return fillEnter('#tb-ask');
    }
    throw new Error('no such box ' + box);
  }

  try {
    for (let i = 0; i < NAV_EXAM.length; i++){
      const T = NAV_EXAM[i], sec = T.sec;
      if (ONLY && !sec.startsWith(ONLY)) continue;
      const box = T.box || 'home', who = T.as || 'admin';
      const P = await seat(who, box === 'phone' ? 390 : 1440, box === 'phone' ? 844 : 780);
      let why = [], W = null;
      try {
        /* EVERY SENTENCE STARTS FROM THE SAME PLACE: a contract no sentence names, open on Home (MK-Z9),
           nothing landed — except the Board's own sentences, which start on the Board, where the owner
           keeps number and chart questions on the Board and "take me to" must still move */
        await P.evaluate(b => { try { if (typeof closeModal === 'function') closeModal(); } catch (_){} try { if (typeof landOff === 'function') landOff(); } catch (_){}
          setView('dashboard');
          if (b === 'board') { try { hbSetFace('board'); } catch (_){} }
          else if (typeof pdOpenOnHome === 'function') pdOpenOnHome('MK-Z9', 'copilot'); }, box);
        await settle(P);
        const before = await where(P);
        await typeInto(P, box, T.q);
        await settle(P);
        W = await where(P);
        /* a list of spots: right when any one is (the closest one's misses are reported) */
        const spots = Array.isArray(T.spot) ? T.spot : [T.spot];
        const tries = spots.map(sp => judge(sp, W, before));
        why = tries.find(t => !t.length) || tries.sort((a, b) => a.length - b.length)[0];
      } catch (e){ why = ['could not be typed: ' + String(e && e.message || e).split('\n')[0]]; }
      results.push({ i, sec, q: T.q, box, who, ok: !why.length, why, at: W });
      console.log(`${why.length ? 'MISS' : 'LAND'}  [${sec}${box !== 'home' ? ' · ' + box : ''}${who !== 'admin' ? ' · ' + who : ''}] ${T.q}${why.length ? ' — ' + why.join('; ') : ''}`);
    }
  } finally {
    const n = results.length, ok = results.filter(r => r.ok).length;
    const by = k => { const m = {}; for (const r of results){ const g = m[r[k]] || (m[r[k]] = [0, 0]); g[1]++; if (r.ok) g[0]++; } return m; };
    console.log('\nBY SECTION'); for (const [s, [a, b]] of Object.entries(by('sec'))) console.log(`  ${String(a).padStart(3)} / ${String(b).padEnd(3)} ${s}`);
    console.log('BY BOX'); for (const [s, [a, b]] of Object.entries(by('box'))) console.log(`  ${String(a).padStart(3)} / ${String(b).padEnd(3)} ${s}`);
    console.log(`\nLANDED EXACTLY: ${ok} of ${n} (${n ? Math.round(ok * 100 / n) : 0}%)` + (errors.length ? ` · page errors: ${errors.length}` : ''));
    if (errors.length) console.log('PAGE ERRORS  ' + [...new Set(errors)].slice(0, 5).join(' · '));
    if (process.env.NAV_EXAM_OUT) fs.writeFileSync(process.env.NAV_EXAM_OUT, JSON.stringify({ n, ok, results }, null, 1));
    await browser.close(); await h.stop();
    const pass = ok >= MIN;
    console.log(pass ? `\n${ok} passed, 0 failed (ratchet ${MIN})` : `\n${ok} passed, 1 failed (below the ratchet ${MIN})`);
    process.exit(pass ? 0 : 1);
  }
})();
