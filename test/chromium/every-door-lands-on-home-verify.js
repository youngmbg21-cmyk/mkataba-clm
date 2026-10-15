/* ============================================================
   EVERY DOOR LANDS ON HOME — THE DOOR CENSUS
   (the overnight work order, step 1; owner's "Go", 14 Oct 2026;
   docs/WORKORDER-one-page-finish.md: "presses every door that opens a
   contract or a contract's work and records where it lands … It is the
   measure; it is never trimmed to go green.")
   ============================================================
   Driven in a real browser at the owner's 1440×780, on a seeded book: a
   signed agreement with four obligations (open with its quote, completed,
   later, overdue), one under review that owes its details and waits on an
   approval, one with the other side's redlines on it, a party with two
   agreements, a closed one and an amendment, a signed one of mine ending in
   20 days with a colleague's look asked of me, a request that became a
   contract. Every door is pressed the way a person presses it and the place
   it lands is read off the screen (the view, Home's face, the paper, Jambo's
   face and tab, the Board's view and the obligation it chose, the wall and
   its count line), with a watcher on every frame for the contract room
   (#ws-tabs, state.view 'workspace') and the Negotiate page's own paper
   (#rl-doc) being drawn ON THE WAY.
     A  each list page — Negotiations, Approvals & signing, Obligations,
        Parties, Requests: the row's double-click and Enter, every door in its
        panel (Document · Negotiation · Workspace, the Workspace door again
        with a face left open, the checklist's rows, Obligations' Show it in
        the contract), and in the narrow table the row's one press; and HOME'S
        CONTRACTS PLACE (step 7): the List's row press and Enter, a paper on
        the Wall, the paper's ‹ Contracts, Wall | List, a stage tab, the
        Board's numbers (a set, a stage)
     W  every other door named Workspace: the Board's contract card,
        Explorer's card, the Negotiate page's Open workspace (by name)
     B  the rail's doors
     C  every row the bell draws on this book; a room-bound kind it does not
        draw is a printed PENDING row, the rest named on one line
     D  Jambo's box (one word), his chips, ⌘K, the top bar's search; and on
        the wall the two ways in (steps 3 and 4): "upload a document" and the
        word "upload" with a file chosen, a file dropped on the drop area,
        "draft a new agreement" and a "draft … with …" sentence through Open
        the form to Create — each must land on the NEW contract's paper; the
        form Jambo opens asks the stream (a press on HaTi's own list) before
        Create wakes. And the "<ref> at a glance" card's four buttons (step 5)
        on the dropped contract, a change of ours staged unsent: Fill in,
        Redlines, Share and Signing each open their face beside its paper
     E  the paper's ⋯ menu
     F  an email link (#contract=<id>[&tab=…][&go=…], openFromHash — the
        work order writes it #/c/<id>/…; this is the shape the server mails)
     G  a refresh on each place a door lands
   A DOOR FAILS when it lands on the room, on the Negotiate page, on a
   retired page (calendar, agents, doc), when it does nothing, or when it
   lands anywhere but the place written beside it. A page that is not ready
   in its bound is reached again from a neutral one, so a row does not hang
   on where the last door left the page.
   STEP 7 MOVED ITS DOORS (the Contracts page opens Home's Contracts place,
   Wall | List): the rail's Contracts (the fold's opener — its item went),
   setView('register'), the top bar's search, Delete and a refresh are real
   rows. THE CONTRACTS PAGE'S PANEL WENT WITH THE PAGE (the drawing: the List
   "without the side panel"), so its rows retired with it — the three doors on
   MK-A2, MK-A1 and MK-R1, the Workspace door with Before you sign left open,
   and the checklist on MK-R1, MK-A2, MK-X1 and MK-B1: the same builders are
   still pressed on Negotiations, Approvals, Obligations and Requests
   (docs/MAP-HISTORY.md, "FINISHING THE ONE PAGE — Step 7"). The row's ⋯
   Workspace is NOT a panel door and stays a real row: the place's List keeps
   each row's ⋯ menu at every width (REG_COL_KEYS_HOME and its narrow shape
   both end in it).
   PENDING, PRINTED ON EVERY RUN, NEVER A FAILURE: a door the work order's
   later steps move. NONE IS LEFT (15 Oct 2026): step 7 took its rows off
   (the rail's Contracts item, setView('register'), the top bar's search,
   Delete, a refresh on Contracts all land on Home's Contracts place, the
   Wall or the List) and step 8 took its rows off: the room retired, so every
   door that opened it lands on the contract's Lifeline strip on Home's Board
   (E.strip: the strip first, on Overview, or on Where we are / Details where
   the door named them); Show it in the contract lands on that passage on
   Home's paper, a given note beside the paper, the Board's contract card is
   the strip and its Open is the Workspace doors' landing. The three bell
   kinds this book did not draw (cp-ready, cert-lapsed, desk-join) are seeded
   and pressed. Rows added: "bring up" in Jambo's box, &tab=stands, and a
   refresh standing on the strip.
   AT THE PARENT (9cf3a18, before step 2) and AT THE BUILDER'S FIRST PASS:
   docs/MAP-HISTORY.md, "FINISHING THE ONE PAGE — Steps 1 and 2".
     node test/chromium/every-door-lands-on-home-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('../helpers');
const { mkDocx, para } = require('../docxfix');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'every-door-lands-on-home');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };

/* ---- THE BOOK ---- dates are offsets from the day the run happens */
const day = off => { const t = new Date(); t.setDate(t.getDate() + off);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
const BODY_A1 = ['SUPPLY AGREEMENT', '', 'This agreement is made between Highland Corporate Ltd and Kabras Sugar.', '',
  'Article 1 Payment', '', 'The total contract value is KES 48,000,000 payable within thirty days.', '',
  'Article 2 Term', '', 'This agreement expires on 2027-06-30.'].join('\n');
const DOC_R1 = ['SOFTWARE AS A SERVICE AGREEMENT', '', '1. Scope', '', 'The Supplier shall deliver the Services described in Schedule 1.', '',
  '5. Payment', '', 'Customer shall pay each correct invoice within 90 days of receipt.', '',
  '26. Limitation of liability', '', 'Each Party\'s total liability shall not exceed twelve months of Charges.'].join('\n');
/* MK-A1's four obligations: an open one with its quote, a completed one, a
   later open one and an overdue one, so a row press is measured on WHICH row
   the Board's view chooses, whatever tab it was left on */
const QUOTE_A1 = 'The total contract value is KES 48,000,000 payable within thirty days.';
const BOOK = [
  { ...fixtureContract('MK-A1', 'Refined Sugar Supply', 'Kabras Sugar', FOLDER_A, 48000000, 'Signed', BODY_A1),
    obligations: [
      { id: 'ob-a1-1', desc: 'Send the monthly supply report', due: day(3), party: 'ours', status: 'open', quote: QUOTE_A1 },
      { id: 'ob-a1-2', desc: 'Deliver the first batch', due: day(-5), party: 'ours', status: 'done' },
      { id: 'ob-a1-3', desc: 'Pay the deposit', due: day(10), party: 'ours', status: 'open' },
      { id: 'ob-a1-4', desc: 'Return the pallets', due: day(-2), party: 'ours', status: 'open' }] },
  fixtureContract('MK-A2', 'Raw Milk Collection', 'Nandi Dairy', FOLDER_A, 36000000, 'Under Review'),
  fixtureContract('MK-B1', 'Modern Trade Listing', 'Naivas Supermarkets', FOLDER_B, 85000000, 'Signed'),
  /* the party's amendment and its closed agreement: Open party's number counts
     agreements (the amendment said beside them) and keeps the closed one */
  { ...fixtureContract('MK-B1A', 'Amendment 1 to Modern Trade Listing', 'Naivas Supermarkets', FOLDER_B, 0, 'Draft'), parentId: 'MK-B1', relation: 'amendment' },
  fixtureContract('MK-B2', 'Retail Supply — Coast', 'Naivas Supermarkets', FOLDER_B, 78000000, 'Under Review'),
  fixtureContract('MK-B3', 'Old Listing', 'Naivas Supermarkets', FOLDER_B, 1000000, 'Declined'),
  fixtureContract('MK-DEL', 'Spare draft to delete', 'Mumias Packaging', FOLDER_A, 1200000, 'Draft'),
];
/* THE BELL'S THREE ROOM KINDS THIS BOOK DID NOT DRAW (step 8 seeds them): a
   counterparty that said it is ready to sign, a required certificate that has
   lapsed, and a colleague asking to join a desk this reader leads */
const NOW = new Date().toISOString();
BOOK.push(Object.assign(fixtureContract('MK-CR', 'Cold Room Lease', 'Tana Cold Stores', FOLDER_A, 900000, 'Under Review'),
  { negotiation: { rounds: [], ready: { counterparty: { at: NOW, name: 'Otieno', by: 'Otieno' } } } }));
BOOK.push(Object.assign(fixtureContract('MK-CL', 'Transport Services', 'Rift Haulage', FOLDER_A, 700000, 'Signed'),
  { obligations: [{ id: 'ob-cl-1', desc: 'Keep the goods-in-transit insurance certificate current', due: day(-60), party: 'theirs', status: 'done', doc: { file: 'insurance.pdf', until: day(-3) } }] }));

/* ---- WHERE A PRESS LANDED, read off the screen ---- */
const LAND = () => {
  const v = window.hbCvNow ? hbCvNow() : null;
  const pd = window.pdFaceNow ? pdFaceNow() : '';
  return {
    view: state.view,
    room: state.view === 'workspace' || !!document.getElementById('ws-tabs'),
    negPage: !!document.getElementById('rl-doc'),
    face: window.hbFace ? hbFace() : null,
    paper: (window.intel && intel.paper) ? String(intel.paper.id) : null,
    cp: (window.intel && intel.paper && window.getContract && getContract(intel.paper.id)) ? String(getContract(intel.paper.id).counterparty || '') : '',
    pd, tab: window.pdTab ? pdTab() : '',
    cv: (v && v.c) ? v.v + ':' + v.c.id : null,
    wall: !!document.getElementById('ig-wall'),
    /* HOME'S CONTRACTS PLACE (step 7): drawn, which way (Wall | List), its
       stage tab, and the set a door sent it — state.reg, the one home of every
       narrowing on the Wall and the List alike */
    place: !!document.querySelector('[data-reg-home]'),
    show: (document.querySelector('[data-reg-home]') || { getAttribute: () => null }).getAttribute('data-ct-show'),
    stage: (window.state && state.reg) ? state.reg.stage : null,
    only: (window.state && state.reg && state.reg.only) ? state.reg.only.ids.length : 0,
    rlList: state.view === 'redline' && !document.getElementById('rl-doc'),
    dialog: !!document.querySelector('.modal-overlay:not(.hidden), #confirm-overlay:not(.hidden), #cmd-palette'),
    /* the obligation the Board's view has chosen, and the wall's count line */
    obSel: (() => { const r = document.querySelector('#hb-cv-body tr.is-sel[data-ob-key]'); return r ? r.getAttribute('data-ob-key') : null; })(),
    count: (() => { const n = document.querySelector('#ig-wall .igw-count'); return n ? n.textContent.trim() : null; })(),
    /* Jambo's Share card in the panel (the glance's Share asks his word "share", which answers with it) */
    shareCard: !!document.querySelector('#ig-dock [data-ca-act="shareout"]'),
    /* the contract's Lifeline strip on top of the Board (step 8), and its page */
    strip: (() => { const n = document.querySelector('#bs-strips > .bs-strip'); return n ? n.getAttribute('data-bs-id') : null; })(),
    stripPage: (() => { const n = document.querySelector('#bs-strips > .bs-strip'); return n ? n.getAttribute('data-bs-on') : null; })(),
  };
};
const KEY = L => [L.view, L.room, L.negPage, L.face, L.paper, L.pd, L.tab, L.cv, L.wall, L.only, L.place, L.show, L.stage, L.strip, L.stripPage].join('|');
const SAY = L => `${L.view}${L.face && L.view === 'dashboard' ? '/' + L.face : ''}${L.paper ? ' paper ' + L.paper : ''}${L.pd ? ' face ' + L.pd : ''}`
  + `${L.view === 'dashboard' && L.face === 'paper' && L.paper && !L.pd ? ' tab ' + L.tab : ''}${L.cv && L.face === 'board' ? ' view ' + L.cv : ''}`
  + `${L.place && !L.paper && L.face === 'paper' ? ' Contracts ' + (L.show || '?') + (L.stage && L.stage !== 'all' ? ' tab ' + L.stage : '') + (L.only ? ' (' + L.only + ' sent' + (L.wall ? ', "' + L.count + '"' : '') + ')' : '') : ''}${L.obSel && L.face === 'board' ? ' row ' + L.obSel : ''}${L.strip && L.face === 'board' && L.view === 'dashboard' && (!L.cv || /^book:/.test(L.cv)) ? ' strip ' + L.strip + ' (' + L.stripPage + ')' : ''}${L.room ? ' ROOM' : ''}${L.negPage ? ' NEGOTIATE-PAGE' : ''}`;
/* the room and the Negotiate page drawn on any frame between the press and the landing */
const WATCH = () => {
  window._door = { room: false, neg: false };
  const look = n => { if (!n || n.nodeType !== 1) return;
    if (n.id === 'ws-tabs' || (n.querySelector && n.querySelector('#ws-tabs'))) window._door.room = true;
    if (n.id === 'rl-doc' || (n.querySelector && n.querySelector('#rl-doc'))) window._door.neg = true; };
  /* the document itself: at document start there is no <html> element yet */
  new MutationObserver(recs => { for (const r of recs) r.addedNodes.forEach(look); })
    .observe(document, { childList: true, subtree: true });
  const tick = () => { try { if (window.state && state.view === 'workspace') window._door.room = true; } catch (_) { /* not booted yet */ }
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
};
const RETIRED = ['calendar', 'agents', 'doc'];

/* ---- WHERE A DOOR SHOULD LAND ---- */
const E = {
  paper: id => L => L.view === 'dashboard' && L.face === 'paper' && L.paper === id,
  copilot: id => L => E.paper(id)(L) && L.pd === '' && L.tab === 'copilot',
  fill: id => L => E.paper(id)(L) && L.pd === 'fill',
  red: id => L => E.paper(id)(L) && L.pd === 'red',
  signing: id => L => E.paper(id)(L) && L.pd === 'signing',
  obTab: id => L => E.paper(id)(L) && L.pd === '' && L.tab === 'oblig',
  board: (id, v) => L => L.view === 'dashboard' && L.face === 'board' && L.cv === v + ':' + id,
  /* the Board's Obligations view with THAT row chosen */
  obRow: (id, key) => L => E.board(id, 'oblig')(L) && L.obSel === key,
  boardFace: L => L.view === 'dashboard' && L.face === 'board',
  wall: n => L => L.view === 'dashboard' && L.face === 'paper' && !L.paper && L.place && L.show === 'wall' && L.wall && (n == null ? !L.only : L.only === n),
  /* the Contracts place drawn as the List (step 7), and on a stage's tab */
  list: n => L => L.view === 'dashboard' && L.face === 'paper' && !L.paper && L.place && L.show === 'list' && !L.wall && (n == null ? !L.only : L.only === n),
  stageTab: st => L => L.view === 'dashboard' && L.face === 'paper' && !L.paper && L.place && L.stage === st,
  /* narrowed to a party: its set, and the count line reading the number the party's row showed */
  party: (n, said) => L => E.wall(n)(L) && L.count === said,
  face: f => L => L.view === 'dashboard' && L.face === f,
  /* the contract's Lifeline strip, newest on the Board, on its page (step 8) */
  strip: (id, page) => L => L.view === 'dashboard' && L.face === 'board' && (!L.cv || /^book:/.test(L.cv)) && L.strip === id && L.stripPage === (page || 'ov'),
  page: v => L => L.view === v && !L.room,
  ngList: L => L.view === 'redline' && L.rlList,
};
const SAYS = { paper: 'Home\'s paper', copilot: 'Home\'s paper, Jambo', fill: 'Fill in beside the paper', red: 'Redlines beside the paper',
  signing: 'Before you sign beside the paper', obTab: 'the paper, Jambo\'s Obligations tab', board: 'the Board\'s view', wall: 'Home\'s Contracts place, the Wall',
  list: 'Home\'s Contracts place, the List',
  strip: 'its strip on the Board', stripWhere: 'its strip on the Board, on Where we are', stripDetails: 'its strip on the Board, on Details (the Overview\'s sheet)' };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  /* approval rules left out: the legacy rule (5,000,000 or more needs an
     admin's yes) is what puts MK-A2 and MK-B2 on the Approvals page and in the bell */
  const W = await seedWorkspace(h, { contracts: BOOK });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const r1 = fixtureContract('MK-R1', 'SaaS Agreement', 'Parcelway ApS', FOLDER_A, 900000, 'Under Review', DOC_R1);
  r1.owner = { id: me.id, name: me.name };
  await W.admin.json('/api/contracts/MK-R1', { method: 'PUT', body: { contract: r1, baseVersion: 0 } });
  const share = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Erik', email: 'erik@parcelway.example' },
    payload: { v: 1, kind: 'hati-share', org: 'Highland', sharedBy: 'Amina', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
      contract: { id: 'MK-R1', name: 'SaaS Agreement', counterparty: 'Parcelway ApS', fields: {}, redlineText: DOC_R1, format: 'text', docText: DOC_R1, versions: [] } } } });
  const rq = await W.admin.json('/api/intake', { method: 'POST', body: { title: 'Renew the milk collection', need: 'The collection agreement needs its next term.', counterparty: 'Nandi Dairy', folder: FOLDER_A } });
  const rqId = rq && rq.request && rq.request.id;
  if (rqId) await W.admin.json('/api/intake/' + rqId, { method: 'PATCH', body: { status: 'drafted', contractId: 'MK-A2' } });
  /* a signed agreement of mine ending in 20 days (the bell's and the
     checklist's renewal rows), and a colleague's look asked of me on it and on
     MK-B1 (the checklist answers MK-B1's in place; the bell keeps MK-X1's) */
  const x1 = { ...fixtureContract('MK-X1', 'Pallet Hire', 'Mombasa Pallets', FOLDER_A, 600000, 'Signed'), expiry: day(20) };
  x1.metadata.expiryDate = day(20); x1.owner = { id: me.id, name: me.name };
  await W.admin.json('/api/contracts/MK-X1', { method: 'PUT', body: { contract: x1, baseVersion: 0 } });
  for (const id of ['MK-X1', 'MK-B1']) await W.unrestricted.json(`/api/contracts/${id}/pass`, { method: 'POST', body: { memberId: me.id, note: 'Please look over the term' } });
  /* a colleague asking to join a desk this reader leads (the bell's desk-join row, step 8) */
  const dj = { ...fixtureContract('MK-DJ', 'Cleaning Services', 'Sparkle Cleaners', FOLDER_A, 400000, 'Under Review'),
    desk: { leadId: me.id, leadName: me.name, roster: [{ id: me.id, name: me.name, seat: 'lead' }],
      joinRequests: [{ id: 'u-join', name: 'Wanjiru Kamau', status: 'pending', why: 'I know this supplier', at: new Date().toISOString() }] } };
  await W.admin.json('/api/contracts/MK-DJ', { method: 'PUT', body: { contract: dj, baseVersion: 0 } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  await ctx.addInitScript(WATCH);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 200)));

  const rows = [];
  let pass = 0, fail = 0, pend = 0;
  const t0 = Date.now();
  const lap = what => console.log(`  — ${what} (${Math.round((Date.now() - t0) / 1000)} s)`);
  const record = (area, name, ok, said, why, pending) => {
    let verdict;
    if (ok) { verdict = 'PASS'; pass++; }
    else if (pending) { verdict = `PENDING step ${pending}`; pend++; }
    else { verdict = 'FAIL'; fail++; }
    rows.push({ area, name, verdict, said, why });
    console.log(`${verdict.padEnd(15)} ${area} · ${name} — ${said}${ok ? '' : ' [' + why + ']'}${ok && pending ? '  (moved early: take it off PENDING)' : ''}`);
  };
  const land = () => page.evaluate(LAND);
  /* the place stops moving: four looks a beat apart agree, or the bound runs out */
  const settle = async (ms = 3000) => { const end = Date.now() + ms; let last = '', same = 0;
    while (Date.now() < end) { const k = KEY(await land()); same = (k === last) ? same + 1 : 0; last = k; if (same >= 3) return; await pause(90); } };
  const closeAll = () => page.evaluate(() => {
    document.getElementById('cmd-palette')?.remove();
    if (typeof closeContextPanel === 'function') try { closeContextPanel(); } catch (_) { /* nothing open */ }
    if (typeof closeModal === 'function') try { closeModal(); } catch (_) { /* nothing open */ }
    document.querySelectorAll('.room-menu:not(.hidden)').forEach(m => m.classList.add('hidden'));
    /* EVERY DOOR STARTS FROM A KNOWN PLACE: a narrowing an earlier door left
       on the Contracts list (the old Open party's "only" chip) is let go, so a
       row is found whatever was pressed before it */
    if (typeof regState === 'function') try { regState().only = null; } catch (_) { /* no list yet */ }
    /* …and Home's Contracts place starts on the Wall, every filter at rest
       (step 7): a door is measured on where it lands, not on what the last
       one left narrowed */
    if (window.state && state.reg && typeof regFiltersAtRest === 'function') try { regFiltersAtRest(state.reg); state.reg.show = 'wall'; } catch (_) { /* no list yet */ }
  });
  /* ONE DOOR: reach its start, arm the watcher, press, read where it landed */
  const door = async (area, name, o) => {
    try {
      await closeAll();
      if (o.start) await o.start();
      await settle(1500);
      const before = await land();
      await page.evaluate(() => { window._door.room = false; window._door.neg = false; });
      const pressed = await o.press();
      if (pressed === false) { record(area, name, false, 'the door is not on screen', 'missing', o.pending); return; }
      /* A DEAD DOOR WEARS GREY AND SAYS WHY (CLAUDE.md): nothing to land, its reason is the answer */
      if (pressed && pressed.dead) { record(area, name, !!pressed.title, 'greyed: ' + String(pressed.title || '(no reason)').slice(0, 80), 'a dead door must say why', null); return; }
      const want = o.expect;
      const end = Date.now() + 8000;
      while (Date.now() < end) { const L = await land(); if (want && want(L)) break; await pause(100); }
      await settle();
      const L = await land();
      const w = await page.evaluate(() => window._door);
      const bad = [];
      if (L.room) bad.push('lands on the room'); else if (w.room) bad.push('the room is drawn on the way');
      if (L.negPage) bad.push('lands on the Negotiate page'); else if (w.neg) bad.push('the Negotiate page is drawn on the way');
      if (RETIRED.includes(L.view)) bad.push('a retired page: ' + L.view);
      if (!o.same && KEY(L) === KEY(before) && !L.dialog) bad.push('does nothing');
      if (want && !want(L)) bad.push('expected ' + (o.says || 'elsewhere'));
      record(area, name, !bad.length, SAY(L), bad.join('; '), o.pending);
    } catch (e) { record(area, name, false, 'the press threw', String(e && e.message || e).slice(0, 160), o.pending); }
  };
  const go = view => page.evaluate(v => { if (v === 'redline' && typeof openNegotiations === 'function') openNegotiations({ list: true }); else setView(v); }, view);
  /* A ROW DOES NOT DEPEND ON WHERE THE LAST DOOR LEFT THE PAGE: a page that
     is not ready in its bound is reached again from a neutral one */
  const goPage = async (view, ready, arg) => { const ok = () => waitFor(page, ready || (v => state.view === v), 8000, ready ? arg : view);
    await go(view); if (await ok()) return; await go(view === 'approvals' ? 'obligations' : 'approvals'); await pause(300); await go(view); await ok(); };
  const atStart = async () => { await goPage('approvals'); };   // a neutral page that is not Home and opens no contract
  const owedFor = id => page.evaluate(i => { const c = getContract(i); let left = 0; try { left = detailsOf(c).left; } catch (_) { left = 0; }
    return !!left && ((typeof canEdit !== 'function') || canEdit()); }, id);
  const wsExpect = async id => (await owedFor(id)) ? E.fill(id) : E.copilot(id);
  const dbl = sel => page.$(sel).then(async el => { if (!el) return false; await el.dblclick(); return true; });
  const enter = sel => page.$(sel).then(async el => { if (!el) return false; await el.click(); await page.keyboard.press('Enter'); return true; });
  const click = sel => page.$(sel).then(async el => { if (!el) return false; await el.click(); return true; });
  /* Enter on a row the keyboard reached (no press first: on the Contracts place a press already opens) */
  const keyEnter = sel => page.$(sel).then(async el => { if (!el) return false; await el.focus(); await page.keyboard.press('Enter'); return true; });
  /* a contract up on Home's paper */
  const onPaperFn = id => page.evaluate(i => pdOpenOnHome(i, 'copilot'), id).then(() => waitFor(page, i => window.intel && intel.paper && intel.paper.id === i, 8000, id));
  const domClick = sel => page.evaluate(s => { const el = document.querySelector(s); if (!el) return false; el.click(); return true; }, sel);
  const selectRow = async (sel) => { const ok = await click(sel); if (ok) await settle(800); return ok; };
  const panelDoor = async (k) => {
    const st = await page.evaluate(k => { const b = document.querySelector(`#ins-panel [data-ins-act="${k}"]`);
      return b ? { dead: !!b.disabled || b.getAttribute('aria-disabled') === 'true', title: b.getAttribute('title') || '' } : null; }, k);
    if (!st) return false;
    if (st.dead) return { dead: true, title: st.title };
    await page.click(`#ins-panel [data-ins-act="${k}"]`); return true;
  };
  /* a list page's three doors, on the row chosen */
  const threeDoors = async (area, view, rowSel, id, opt = {}) => {
    for (const [k, nm] of [['door-doc', 'Document door'], ['door-nego', 'Negotiation door'], ['door-ws', 'Workspace door']]) {
      /* the Document door is Home's paper on that contract: a face still open
         for it from an earlier press stays up (pdOpenOnHome keeps it), so its
         measure is the paper, not the face (BUGLOG, 14 Oct 2026) */
      const want = k === 'door-doc' ? (opt.doc || E.paper(id)) : k === 'door-nego' ? E.red(id) : await wsExpect(id);
      const says = k === 'door-doc' ? (opt.docSays || SAYS.paper) : k === 'door-nego' ? SAYS.red : ((await owedFor(id)) ? SAYS.fill : SAYS.copilot);
      await door(area, `${nm} (${id})`, { start: async () => { await goPage(view); await waitFor(page, s => !!document.querySelector(s), 6000, rowSel); await selectRow(rowSel); },
        press: () => panelDoor(k), expect: want, says });
    }
  };

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => window.state && Array.isArray(state.contracts) && state.contracts.some(c => c.id === 'MK-R1') && window.currentUser && currentUser(), 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    /* their round: two asks, sent from their link, so Negotiations lists MK-R1 */
    const cls = await page.evaluate(async () => { const c = getContract('MK-R1'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      return negoClauseList(c).map(k => ({ id: k.clauseId, label: clauseLabel(k), text: String(k.text || k.body || '').trim() })); });
    const ask = (re, a, b) => { const k = cls.find(x => re.test(x.text)); return { clauseId: k.id, clauseLabel: k.label, oldText: k.text, newText: k.text.replace(a, b), why: 'Our position' }; };
    await h.client('erik').raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Erik', id: 'MK-R1', at: new Date().toISOString(),
      negoProposed: [ask(/90 days/, '90 days', '75 days'), ask(/twelve months/, 'twelve months', 'six months')] } });
    await page.evaluate(async () => { await pollPendingResponses(); if (typeof loadIntake === 'function') await loadIntake(); });
    const ready = await waitFor(page, () => (getContract('MK-R1').changes || []).length >= 2, 10000);
    console.log(`the book: ${await page.evaluate(() => state.contracts.map(c => c.id).join(' '))}; their round ${ready ? 'in' : 'MISSING'}; request ${rqId || 'MISSING'}\n`);

    /* ================= A · THE LIST PAGES (the panel's shape at 1440) ================= */
    const A = 'A list pages';
    await page.evaluate(() => insForce(null));
    /* HOME'S CONTRACTS PLACE (step 7): the List has no panel — a row's one
       press, and Enter, open the paper; so does a paper on the Wall. The
       page's panel rows (three doors on MK-A2, MK-A1, MK-R1) retired with it. */
    const toPlace = k => async () => { await page.evaluate(k => { regPlaceSet({ show: k }); setView('register'); }, k);
      await waitFor(page, k => !!document.querySelector(`[data-reg-home][data-ct-show="${k}"]`), 8000, k); };
    const LROW = '[data-reg-home] #reg-tbody [data-row="MK-A2"]', WCARD = '[data-reg-home] #ig-wall [data-ig-pick="MK-A2"]';
    const atList = async () => { await toPlace('list')(); await waitFor(page, s => !!document.querySelector(s), 6000, LROW); };
    await door(A, 'Contracts place, List row, one press (MK-A2)', { start: atList, press: () => click(LROW + ' td:nth-child(2)'), expect: E.paper('MK-A2'), says: SAYS.paper });
    await door(A, 'Contracts place, List row, Enter (MK-A2)', { start: atList, press: () => keyEnter(LROW), expect: E.paper('MK-A2'), says: SAYS.paper });
    /* the row's ⋯ stays on the List (its acts have no other home with the
       panel gone): ⋯ pressed, then its Workspace, as a person does */
    await door(A, 'Contracts place, List row ⋯ Workspace (MK-A2)', { start: atList,
      press: async () => (await click(LROW + ' [data-menu="MK-A2"]')) && click(LROW + ' [data-act="open"][data-id="MK-A2"]'),
      expect: await wsExpect('MK-A2'), says: (await owedFor('MK-A2')) ? SAYS.fill : SAYS.copilot });
    await door(A, 'Contracts place, a paper on the Wall (MK-A2)', { start: async () => { await toPlace('wall')(); await waitFor(page, s => !!document.querySelector(s), 6000, WCARD); },
      press: () => click(WCARD), expect: E.paper('MK-A2'), says: SAYS.paper });
    await door(A, 'the paper\'s ‹ Contracts (MK-A2 up)', { start: async () => { await onPaperFn('MK-A2'); },
      press: () => domClick('#ig-strip [data-ig-pick-again]'), expect: E.wall(null), says: SAYS.wall });
    await door(A, 'Contracts place, Wall | List: List', { start: toPlace('wall'), press: () => domClick('[data-reg-home] [data-ct-show="list"]'), expect: E.list(null), says: SAYS.list });
    await door(A, 'Contracts place, Wall | List: Wall', { start: toPlace('list'), press: () => domClick('[data-reg-home] [data-ct-show="wall"]'), expect: E.wall(null), says: SAYS.wall });
    await door(A, 'Contracts place, the In Review tab (the Wall)', { start: toPlace('wall'), press: () => domClick('[data-reg-home] [data-reg-stage="Under Review"]'),
      expect: L => E.wall(null)(L) && E.stageTab('Under Review')(L), says: SAYS.wall + ', on In Review' });
    /* THE BOARD'S NUMBERS land on the place: a set (regShowOnly) and a stage (regGoFiltered) */
    let boardN = -1;
    const boardDoor = (fig, stage) => async () => { await page.evaluate(f => { setView('dashboard'); hbSetFace('board'); hbDig(f); }, fig);
      const sel = stage ? `[data-hb-open][data-hb-stage="${stage}"]` : '[data-hb-open]:not([data-hb-stage])';
      await waitFor(page, s => !!document.querySelector(s), 8000, sel);
      boardN = await page.evaluate(s => { const b = document.querySelector(s); return b ? new Set(String(b.getAttribute('data-hb-open') || '').split(',').filter(Boolean)).size : -1; }, sel); };
    await door(A, 'the Board\'s Open N, a set (f:live)', { start: boardDoor('f:live'), press: () => domClick('[data-hb-open]:not([data-hb-stage])'),
      expect: L => boardN > 0 && E.wall(boardN)(L), says: SAYS.wall + ', narrowed to the set the number named' });
    await door(A, 'the Board\'s Open N, a stage (f:review)', { start: boardDoor('f:review', 'Under Review'), press: () => domClick('[data-hb-open][data-hb-stage="Under Review"]'),
      expect: L => E.wall(null)(L) && E.stageTab('Under Review')(L), says: SAYS.wall + ', on In Review' });
    /* Negotiations */
    const NG = () => !!document.querySelector('#reg-tbody [data-row="MK-R1"]');
    await door(A, 'Negotiations row, double-click (MK-R1)', { start: () => goPage('redline', NG), press: () => dbl('#reg-tbody [data-row="MK-R1"]'), expect: E.red('MK-R1'), says: SAYS.red });
    await door(A, 'Negotiations row, Enter (MK-R1)', { start: () => goPage('redline', NG), press: () => enter('#reg-tbody [data-row="MK-R1"]'), expect: E.red('MK-R1'), says: SAYS.red });
    await threeDoors(A + ' · Negotiations', 'redline', '#reg-tbody [data-row="MK-R1"]', 'MK-R1');
    /* Approvals & signing */
    const AP = () => !!document.querySelector('[data-ap-row="MK-A2"]');
    await door(A, 'Approvals row, double-click (MK-A2)', { start: () => goPage('approvals', AP), press: () => dbl('[data-ap-row="MK-A2"]'), expect: E.signing('MK-A2'), says: SAYS.signing });
    await door(A, 'Approvals row, Enter (MK-A2)', { start: () => goPage('approvals', AP), press: () => enter('[data-ap-row="MK-A2"]'), expect: E.signing('MK-A2'), says: SAYS.signing });
    await threeDoors(A + ' · Approvals', 'approvals', '[data-ap-row="MK-A2"]', 'MK-A2');
    /* Obligations */
    const OBK = n => `MK-A1::ob-a1-${n}`, OBR = n => `.ob-lt tbody tr[data-ob-key="${OBK(n)}"]`;
    const OBROW = OBR(1);
    const OBSAYS = 'the Board\'s Obligations view, that row chosen';
    await door(A, 'Obligations row, double-click (MK-A1)', { start: () => goPage('obligations', s => !!document.querySelector(s), OBROW),
      press: () => dbl(OBROW), expect: E.obRow('MK-A1', OBK(1)), says: OBSAYS });
    await door(A, 'Obligations row, Enter (MK-A1)', { start: () => goPage('obligations', s => !!document.querySelector(s), OBROW),
      press: () => enter(OBROW), expect: E.obRow('MK-A1', OBK(1)), says: OBSAYS });
    /* the row pressed is the row chosen, whatever tab either list was left on */
    await door(A, 'Obligations row from the Completed tab, double-click (MK-A1, a done one)', {
      start: async () => { await goPage('obligations'); await domClick('[data-obw-view="done"]'); await waitFor(page, s => !!document.querySelector(s), 6000, OBR(2)); },
      press: () => dbl(OBR(2)), expect: E.obRow('MK-A1', OBK(2)), says: OBSAYS });
    await page.evaluate(() => obwGoFiltered({}));
    await door(A, 'Obligations row, the Board\'s view left on Overdue (MK-A1, a later one)', {
      start: async () => { await page.evaluate(() => hbOpenView('MK-A1', 'oblig')); await waitFor(page, () => !!document.querySelector('#hb-cv-body [data-obt-view="overdue"]'), 6000);
        await domClick('#hb-cv-body [data-obt-view="overdue"]'); await goPage('obligations', s => !!document.querySelector(s), OBR(3)); },
      press: () => dbl(OBR(3)), expect: E.obRow('MK-A1', OBK(3)), says: OBSAYS });
    await threeDoors(A + ' · Obligations', 'obligations', OBROW, 'MK-A1', { doc: E.obTab('MK-A1'), docSays: SAYS.obTab });
    await door(A, 'Obligations panel, Show it in the contract (MK-A1)', { start: async () => { await goPage('obligations', s => !!document.querySelector(s), OBROW); await selectRow(OBROW); },
      press: () => domClick('#ins-panel [data-ob-show]'), expect: E.paper('MK-A1'), says: 'that passage on Home\'s paper' });
    /* Parties */
    const CU = 'tr[data-cu-cust="naivas supermarkets"]';
    const naivas = await page.evaluate(() => (typeof cuIdsOf === 'function' && typeof cuView === 'function') ? cuIdsOf(cuView(cuCustomerOf('naivas supermarkets'))).length : 0);
    /* THE NUMBER PRESSED IS THE NUMBER READ: the party's row counts its
       agreements (three, the closed one too); the wall says the same three,
       its amendment beside them */
    const naivasN = await page.evaluate(() => (typeof cuView === 'function') ? cuView(cuCustomerOf('naivas supermarkets')).items.length : 0);
    const naivasSaid = `${naivasN} of ${naivasN} contracts · 1 amendment`;
    const PARTY = E.party(naivas, naivasSaid), PSAYS = SAYS.wall + ', narrowed to the party, reading "' + naivasSaid + '"';
    await door(A, 'Parties row, double-click (Naivas)', { start: () => goPage('customers', s => !!document.querySelector(s), CU), press: () => dbl(CU), expect: PARTY, says: PSAYS });
    await door(A, 'Parties row, Enter (Naivas)', { start: () => goPage('customers', s => !!document.querySelector(s), CU), press: () => enter(CU), expect: PARTY, says: PSAYS });
    await door(A, 'Parties panel, Open party (Naivas)', { start: async () => { await goPage('customers', s => !!document.querySelector(s), CU); await selectRow(CU); },
      press: async () => (await panelDoor('open')) === true, expect: PARTY, says: PSAYS });
    await door(A, 'Parties panel, Open on Explorer (Naivas)', { start: async () => { await goPage('customers', s => !!document.querySelector(s), CU); await selectRow(CU); },
      press: async () => (await panelDoor('explorer')) === true, expect: E.face('explorer'), says: 'Home\'s Explorer' });
    /* Requests */
    const RQ = rqId ? `.ik-lt tbody [data-ik-row="${rqId}"]` : '#none';
    const toRequests = async () => { await goPage('intake'); await domClick('[data-ik-view="all"]'); await waitFor(page, s => !!document.querySelector(s), 6000, RQ); };
    await door(A, 'Requests row, double-click (→ MK-A2)', { start: toRequests, press: () => dbl(RQ), expect: E.strip('MK-A2'), says: SAYS.strip });
    await door(A, 'Requests row, Enter (→ MK-A2)', { start: toRequests, press: () => enter(RQ), expect: E.strip('MK-A2'), says: SAYS.strip });
    await threeDoors(A + ' · Requests', 'intake', RQ, 'MK-A2');
    /* THE WORKSPACE DOOR PUTS AWAY A FACE LEFT OPEN: on a contract that owes
       nothing it lands on the paper with Jambo, whatever face an earlier press
       left up for that contract */
    /* (the Contracts panel's own row retired with the page's panel, step 7) */
    await door(A, 'Obligations panel Workspace, Fill in left open (MK-A1)', {
      start: async () => { await page.evaluate(() => pdFillOpen('MK-A1')); await waitFor(page, () => pdFaceNow() === 'fill', 6000);
        await goPage('obligations', s => !!document.querySelector(s), OBROW); await selectRow(OBROW); },
      press: () => panelDoor('door-ws'), expect: E.copilot('MK-A1'), says: SAYS.copilot });
    /* ---- THE PANEL'S CHECKLIST: needsYouGo, the one door every list's panel
       presses (insNeedsHtml draws needsYouOf) ---- */
    const NEED = {
      details: id => ({ expect: E.fill(id), says: SAYS.fill }),
      approval: (id, view) => ({ expect: E.page('approvals'), says: 'the Approvals list (the checklist keeps its door: the owner moved the bell only)', same: view === 'approvals' }),
      refused: id => ({ expect: E.signing(id), says: SAYS.signing }), sign: id => ({ expect: E.signing(id), says: SAYS.signing }),
      quiet: id => ({ expect: E.red(id), says: SAYS.red }), review: id => ({ expect: E.red(id), says: SAYS.red }), suggest: id => ({ expect: E.red(id), says: SAYS.red }),
      look: (id, view) => ({ expect: L => L.view === view && !L.room, says: 'answered where it stands (Done)', same: true }),
      renewal: id => ({ expect: E.strip(id, 'details'), says: SAYS.stripDetails + ', its renewal card' }),
      note: id => ({ expect: E.paper(id), says: 'beside Home\'s paper, the notes drawer open' }),
      join: id => ({ expect: E.strip(id), says: SAYS.strip + ', the desk sheet over it' }),
    };
    const checklist = async (area, view, reach, rowSel, id, skip = []) => {
      const at = async () => { await reach(); await selectRow(rowSel); };
      await at();
      const kinds = [...new Set(await page.evaluate(() => [...document.querySelectorAll('#ins-panel [data-ins-need]')].map(b => b.getAttribute('data-ins-need'))))].filter(k => !skip.includes(k));
      if (!kinds.length) console.log(`  (${area}: no checklist row on ${id})`);
      for (const k of kinds) {
        const n = NEED[k] ? NEED[k](id, view) : { expect: L => !L.room && !L.negPage, says: 'anywhere but the room' };
        await door(area, `checklist "${k}" (${id})`, { start: at, press: () => domClick(`#ins-panel [data-ins-need="${k}"]`), ...n });
      }
    };
    const reachList = (view, sel) => () => goPage(view, s => !!document.querySelector(s), sel);
    /* (the Contracts panel's checklist retired with the page's panel, step 7;
       the same builder is pressed below on four lists) */
    await checklist(A + ' · Negotiations', 'redline', reachList('redline', '#reg-tbody [data-row="MK-R1"]'), '#reg-tbody [data-row="MK-R1"]', 'MK-R1');
    await checklist(A + ' · Approvals', 'approvals', reachList('approvals', '[data-ap-row="MK-A2"]'), '[data-ap-row="MK-A2"]', 'MK-A2');
    await checklist(A + ' · Obligations', 'obligations', reachList('obligations', OBROW), OBROW, 'MK-A1');
    await checklist(A + ' · Requests', 'intake', toRequests, RQ, 'MK-A2');

    lap('the list pages, wide');
    /* ================= A · THE SAME PAGES, NARROW (the full table, one press opens) ================= */
    await page.evaluate(() => insForce(false));
    /* (the Contracts place's List draws no inspector, so this switch does not
       move it — its row's one press, Enter and ⋯ Workspace are measured
       above; it narrows to four columns by its own width, not by this; step 7) */
    await door(A, 'Negotiations row, one press, narrow (MK-R1)', { start: () => goPage('redline', NG), press: () => click('#reg-tbody [data-row="MK-R1"] td:nth-child(2)'), expect: E.red('MK-R1'), says: SAYS.red });
    await door(A, 'Approvals Open, narrow (MK-A2)', { start: () => goPage('approvals', () => !!document.querySelector('[data-ap-open="MK-A2"]')), press: () => click('[data-ap-open="MK-A2"]'), expect: E.signing('MK-A2'), says: SAYS.signing });
    /* narrow, the Board's view is the full table too: every row drawn, none chosen (no panel) */
    await door(A, 'Obligations row, one press, narrow (MK-A1)', { start: () => goPage('obligations', () => !!document.querySelector('.obw-table tr[data-obw-row="ob-a1-1"]')),
      press: () => click('.obw-table tr[data-obw-row="ob-a1-1"] .obw-when'), expect: E.board('MK-A1', 'oblig'), says: 'the Board\'s Obligations view' });
    await door(A, 'Obligations Open contract, narrow (MK-A1, a later one)', { start: () => goPage('obligations', () => !!document.querySelector('tr[data-obw-row="ob-a1-3"] [data-obw-open]')),
      press: () => click('tr[data-obw-row="ob-a1-3"] [data-obw-open]'), expect: E.board('MK-A1', 'oblig'), says: 'the Board\'s Obligations view' });
    await door(A, 'Parties row, one press, narrow (Naivas)', { start: () => goPage('customers', s => !!document.querySelector(s), CU), press: () => click(CU), expect: PARTY, says: PSAYS });
    await door(A, 'Requests Open, narrow (→ MK-A2)', { start: async () => { await goPage('intake'); await domClick('[data-ik-view="all"]'); await waitFor(page, () => !!document.querySelector('[data-ik-open="MK-A2"]'), 6000); },
      press: () => click('[data-ik-open="MK-A2"]'), expect: E.paper('MK-A2'), says: SAYS.paper });
    await page.evaluate(() => insForce(null));

    lap('the list pages, narrow');
    /* ================= W · EVERY OTHER DOOR NAMED WORKSPACE (roomHomeLand) ================= */
    const WS = 'W the other Workspace doors';
    const wsSays = async id => ((await owedFor(id)) ? SAYS.fill : SAYS.copilot);
    /* RE-POINTED (step 8): the Board's contract card is the Lifeline strip
       now, and its Open is the Workspace doors' one landing (roomHomeLand) */
    await door(WS, 'the Board\'s contract strip, Open (MK-A1)', {
      start: async () => { await page.evaluate(() => { setView('dashboard'); hbSetFace('board'); hbDig('c:MK-A1'); }); await waitFor(page, () => !!document.querySelector('#bs-strip-MK-A1 [data-bs-open="MK-A1"]'), 8000); },
      press: () => domClick('#bs-strip-MK-A1 [data-bs-open="MK-A1"]'), expect: await wsExpect('MK-A1'), says: await wsSays('MK-A1') });
    await door(WS, 'Explorer\'s card (MK-A1)', {
      start: async () => { await page.evaluate(() => { setView('dashboard'); hbOpenExplorer(); }); await waitFor(page, () => window.hbFace && hbFace() === 'explorer', 8000);
        await page.evaluate(() => igExplain('MK-A1')); await waitFor(page, () => !!document.querySelector('[data-ig-ws="MK-A1"]'), 8000); },
      press: () => domClick('[data-ig-ws="MK-A1"]'), expect: await wsExpect('MK-A1'), says: await wsSays('MK-A1') });
    await door(WS, 'the Negotiate page\'s Open workspace, the page opened by name (MK-R1)', {
      start: async () => { await page.evaluate(() => openRedlineWorkbench('MK-R1', { page: true })); await waitFor(page, () => !!document.querySelector('[data-rl-open-ws]'), 8000); },
      press: () => click('[data-rl-open-ws]'), expect: await wsExpect('MK-R1'), says: await wsSays('MK-R1') });

    lap('the other Workspace doors');
    /* ================= B · THE RAIL ================= */
    const B = 'B the rail';
    const rail = v => page.evaluate(v => { const b = document.querySelector(`#side-nav .nav-item[data-view="${v}"]`); if (!b) return false; b.click(); return true; }, v);
    await door(B, 'Home', { start: () => goPage('obligations'), press: () => rail('dashboard'), expect: E.page('dashboard'), says: 'Home' });
    /* THE FOLD'S OPENER IS THE CONTRACTS DOOR since its item went (step 7) */
    const opener = k => page.evaluate(k => { const b = document.querySelector(`#side-nav [data-nav-fold-open="${k}"]`); if (!b) return false; b.click(); return true; }, k);
    await door(B, 'Contracts (the fold\'s opener)', { start: atStart, press: () => opener('register'), expect: E.wall(null), says: 'Home\'s Contracts place (the Wall)' });
    /* AND HOME IS NOT THE CONTRACTS PLACE (the drawing: rail Home → the
       Board): from the place, the rail's Home door lands on the Board */
    await door(B, 'Home, from the Contracts place', { start: () => page.evaluate(() => setView('register')), press: () => rail('dashboard'), expect: E.face('board'), says: 'the Board' });
    await door(B, 'Negotiations (in the fold)', { start: atStart, press: () => rail('redline'), expect: E.ngList, says: 'the Negotiations list' });
    await door(B, 'Parties (in the fold)', { start: atStart, press: () => rail('customers'), expect: E.page('customers'), says: 'the Parties list' });
    await door(B, 'Approvals & signing', { start: () => goPage('obligations'), press: () => rail('approvals'), expect: E.page('approvals'), says: 'the Approvals list' });
    await door(B, 'Obligations', { start: atStart, press: () => rail('obligations'), expect: E.page('obligations'), says: 'the Obligations list' });
    await door(B, 'Requests', { start: atStart, press: () => rail('intake'), expect: E.page('intake'), says: 'the Requests list' });
    await door(B, 'setView(\'register\') by name', { start: atStart, press: () => page.evaluate(() => { setView('register'); return true; }), expect: E.wall(null), says: 'Home\'s Contracts place (the Wall)' });

    lap('the rail');
    /* ================= C · THE BELL ================= */
    const C = 'C the bell';
    const BELL = {
      approval: a => E.signing(a.id), 'ap-refused': a => E.signing(a.id), 'ap-cleared': a => E.signing(a.id), signature: a => E.signing(a.id),
      'cp-accepted': a => E.signing(a.id), handover: a => E.signing(a.id),
      negotiation: a => E.red(a.id), 'review-mine': a => E.red(a.id), 'review-out': a => E.red(a.id), 'review-back': a => E.red(a.id),
      suggest: a => E.red(a.id), 'suggest-back': a => E.red(a.id), 'desk-quiet': a => E.red(a.id),
      details: a => E.fill(a.id), obligation: a => E.board(a.id, 'oblig'),
      link: () => E.boardFace, watch: () => E.boardFace, gift: () => E.boardFace,
      request: () => E.page('intake'), 'note-due': () => E.page('mynotes'),
    };
    /* the bell's rows that opened the room through openWorkspace land on the
       contract's strip since step 8 (a renewal on its Details, where the
       renewal card is); a request row that carries a contract (a lane's
       draft) opens its strip too */
    const BELL_ROOM = ['cp-ready', 'look', 'cert-lapsed', 'desk-join', 'renewal'];
    const roomRow = a => BELL_ROOM.includes(a.kind) || (a.kind === 'request' && !!a.id);
    const stripRow = a => a.kind === 'renewal' ? E.strip(a.id, 'details') : E.strip(a.id);
    /* one row of every kind the bell draws on this book, and every approval row (step 2's own door) */
    const alerts = await page.evaluate(() => buildAlerts().map((a, i) => ({ i, kind: a.kind, id: a.id })));
    const seen = new Set();
    for (const a of alerts) {
      const k = a.kind === 'approval' ? a.kind + ':' + a.id : a.kind; if (seen.has(k)) continue; seen.add(k);
      const want = BELL[a.kind] ? BELL[a.kind](a) : null;
      await door(C, `${a.kind} (${a.id || '—'})`, { start: atStart,
        press: async () => {
          await page.click('#hdr-notify');
          if (!(await waitFor(page, () => !!document.querySelector('#context-panel [data-alert-i]'), 5000))) return false;
          return page.evaluate(x => { const rows = buildAlerts(); const i = rows.findIndex(r => r.kind === x.kind && r.id === x.id);
            const b = i >= 0 ? document.querySelector(`#context-panel [data-alert-i="${i}"]`) : null; if (!b) return false; b.click(); return true; }, a);
        },
        expect: roomRow(a) ? stripRow(a) : (want || (L => !L.room && !L.negPage)),
        says: roomRow(a) ? (a.kind === 'renewal' ? SAYS.stripDetails : SAYS.strip) : want ? 'its place on Home' : 'anywhere but the room' });
    }
    if (!alerts.some(a => a.kind === 'approval')) record(C, 'approval row present', false, 'no approval row on this book', 'the fixture lost its approval');
    /* EVERY ROOM-BOUND KIND IS DRAWN AND PRESSED (step 8 seeded the three
       this book did not draw); one missing is a fixture lost, and fails */
    const drawn = new Set(alerts.map(a => a.kind));
    for (const k of BELL_ROOM.filter(k => !drawn.has(k)))
      record(C, `${k} — not drawn on this book`, false, 'not drawn, so not pressed', 'the fixture lost this row', null);
    const unseen = Object.keys(BELL).filter(k => !drawn.has(k));
    if (unseen.length) console.log(`  the bell's kinds not drawn on this book (not pressed): ${unseen.join(' ')}`);

    lap('the bell');
    /* ================= D · JAMBO'S BOX, HIS CHIPS, ⌘K, THE TOP BAR ================= */
    const D = 'D Jambo';
    const onPaper = id => async () => { await page.evaluate(i => pdOpenOnHome(i, 'copilot'), id); await waitFor(page, i => window.intel && intel.paper && intel.paper.id === i && !!document.getElementById('igd-input'), 8000, id); };
    const say = word => async () => {
      if (!(await page.$('#igd-input'))) return false;
      await page.click('#igd-input'); await page.fill('#igd-input', ''); await page.type('#igd-input', word, { delay: 10 });
      await page.keyboard.press('Enter'); return true; };
    const R1owed = await owedFor('MK-R1');
    const WORDS = [
      ['redline', E.red('MK-R1'), SAYS.red], ['deal board', E.board('MK-R1', 'deal'), 'the Board\'s deal view'], ['sign', E.signing('MK-R1'), SAYS.signing],
      ['fill in', R1owed ? E.fill('MK-R1') : E.paper('MK-R1'), SAYS.fill], ['obligations', E.obTab('MK-R1'), SAYS.obTab],
      ['history', E.board('MK-R1', 'hist'), 'the Board\'s History view'], ['board', E.face('board'), 'the Board'],
      ['contracts', E.wall(null), SAYS.wall], ['list', E.list(null), SAYS.list], ['wall', E.wall(null), SAYS.wall], ['calendar', E.face('calendar'), 'Home\'s Calendar'], ['explorer', E.face('explorer'), 'Home\'s Explorer'],
      ['MK-A1', E.paper('MK-A1'), 'that contract\'s paper'],
    ];
    for (const [w, want, says] of WORDS)
      await door(D, `the word "${w}" (on MK-R1)`, { start: onPaper('MK-R1'), press: say(w), expect: want, says });
    const chips = await (async () => { await onPaper('MK-R1')(); return page.evaluate(() => [...document.querySelectorAll('[data-ca-chip]')].map(b => b.getAttribute('data-ca-chip'))); })();
    const CHIP = { redline: E.red('MK-R1'), deal: E.board('MK-R1', 'deal'), sign: E.signing('MK-R1'), history: E.board('MK-R1', 'hist'),
      fill: R1owed ? E.fill('MK-R1') : E.paper('MK-R1'), oblig: E.obTab('MK-R1'), share: L => E.paper('MK-R1')(L) && L.dialog };
    for (const k of [...new Set(chips)])
      await door(D, `the chip "${k}" (on MK-R1)`, { start: onPaper('MK-R1'), press: () => domClick(`[data-ca-chip="${k}"]`), expect: CHIP[k] || (L => !L.room && !L.negPage), says: CHIP[k] ? 'its place on Home' : 'anywhere but the room' });
    if (!chips.length) record(D, 'the chips are drawn', false, 'no chip above the box', 'missing');
    /* THE WALL'S TWO WAYS IN (the overnight work order, steps 3 and 4): each
       makes a contract, and lands on ITS paper — Fill in beside it while
       anything is owed — never the room and never the pop-up's way round */
    const known = () => page.evaluate(() => state.contracts.map(c => c.id));
    const isNew = ids => L => L.view === 'dashboard' && L.face === 'paper' && !!L.paper && !ids.includes(L.paper) && (L.pd === 'fill' || L.pd === '');
    const NEWSAYS = 'the new contract on Home\'s paper (Fill in beside it while owed)';
    const onWall = async () => { await page.evaluate(() => { if (typeof caHomeWall === 'function') caHomeWall(); });
      await waitFor(page, () => window.intel && !intel.paper && !!document.getElementById('pd-drop'), 8000); };
    const docx = name => { const f = path.join(OUT, name); fs.writeFileSync(f, Buffer.from(mkDocx([para('COURIER SERVICES AGREEMENT'),
      para('This Agreement is made between Parcelway ApS and the Client.'), para('1. Services. The Supplier shall collect and deliver the parcels.'),
      para('2. Fees. The Client shall pay each invoice within thirty (30) days of receipt.')].join('')))); return f; };
    const pickFile = (trigger, file) => async () => { const ch = page.waitForEvent('filechooser', { timeout: 6000 }).catch(() => null);
      if ((await trigger()) === false) return false; const fc = await ch; if (!fc) return false; await fc.setFiles(file); return true; };
    let ids = await known();
    await door(D, 'the wall\'s chip "upload a document", a file chosen', { start: onWall,
      press: pickFile(() => domClick('[data-ig-chips] [data-ca-chip="upload"]'), docx('Census_Chip.docx')), expect: isNew(ids), says: NEWSAYS });
    ids = await known();
    await door(D, 'the word "upload" on the wall, a file chosen', { start: onWall, press: pickFile(say('upload'), docx('Census_Word.docx')), expect: isNew(ids), says: NEWSAYS });
    ids = await known();
    await door(D, 'the drop area\'s Choose a file', { start: onWall, press: pickFile(() => domClick('#pd-drop [data-pd-drop-pick]'), docx('Census_Pick.docx')), expect: isNew(ids), says: NEWSAYS });
    ids = await known();
    const dropped = fs.readFileSync(docx('Census_Drop.docx')).toString('base64');
    await door(D, 'a file dropped on the drop area', { start: onWall,
      press: () => page.evaluate(b64 => { const z = document.getElementById('pd-drop'); if (!z) return false;
        const f = new File([Uint8Array.from(atob(b64), ch => ch.charCodeAt(0))], 'Census_Drop.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const dt = new window.DataTransfer(); dt.items.add(f);
        z.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
        z.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); return true; }, dropped),
      expect: isNew(ids), says: NEWSAYS });
    /* THE GLANCE'S FOUR BUTTONS (step 5), on the contract that drop made: its
       details owed, its scan read, nobody named to sign — and one change of
       ours staged unsent, so "N changes not sent" is drawn too. A row the
       card does not draw is reported, never skipped. */
    const gid = (await known()).find(i => !ids.includes(i)) || null;
    if (gid){
      await waitFor(page, i => { const c = getContract(i); return !!(c && c.scan); }, 15000, gid);
      await page.evaluate(async i => { const c = getContract(i); const cl = negoClauseList(c)[0]; if (!cl) return;
        const now = negoClauseNowById(c, cl.clauseId); const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || cl.text || '') + '</p>';
        await negoEditClause(c, cl.clauseId, body.replace(/<\/p>(?![\s\S]*<\/p>)/, ' Both parties shall keep a copy.</p>'), { side: 'owner' }); }, gid);
      const GL = { fill: [E.fill(gid), SAYS.fill], redline: [E.red(gid), SAYS.red],
        share: [L => E.paper(gid)(L) && L.shareCard, 'the paper, Jambo\'s Share card'], sign: [E.signing(gid), SAYS.signing] };
      /* the card stands where no face is open: the face the last press opened is put away first */
      const glanceStart = async () => { await page.evaluate(i => { for (const f of ['pdFillAway', 'pdRedAway', 'pdSignAway']) try { if (typeof window[f] === 'function') window[f](); } catch (_) { /* none open */ }
        pdOpenOnHome(i, 'copilot'); if (typeof renderIntelDock === 'function') renderIntelDock(); }, gid);
        await waitFor(page, i => !!document.querySelector(`#pd-glance[data-pd-glance-for="${i}"]`), 8000, gid); };
      for (const k of ['fill', 'redline', 'share', 'sign'])
        await door(D, `the glance's "${k}" button (on the dropped contract)`, { start: glanceStart, same: k === 'share',
          press: async () => { if (!(await waitFor(page, i => !!document.querySelector(`#pd-glance[data-pd-glance-for="${i}"]`), 6000, gid))) return false;
            return domClick(`#pd-glance [data-pd-glance="${k}"]`); },
          expect: GL[k][0], says: GL[k][1] });
    } else record(D, 'the glance\'s buttons', false, 'no dropped contract to read', 'missing');
    /* the draft card's Open the form is the ONE form, never the two-door menu; Create lands on the new paper */
    /* THE STREAM IS ASKED (the fix round, 15 Oct 2026): the form Jambo opens
       starts on none; a press on HaTi's own list chooses the first real one */
    const chooseStream = async () => { const id = await page.evaluate(() => { const s = window.naStreamBox && naStreamBox(document.getElementById('na-form')); return s && !s.value ? s.id : ''; });
      if (!id) return true;
      /* HaTi's list shuts on any scroll (core.js), and Jambo's conversation
         behind the pop-up may still be scrolling to the card that opened it:
         the press waits for the page to hold still (bounded), as a reader's eye does */
      await page.evaluate(() => { window._scN = 0; if (!window._scArmed) { window._scArmed = true; window.addEventListener('scroll', () => { window._scN++; }, true); } });
      { const end = Date.now() + 3000; let last = -1; while (Date.now() < end) { const n = await page.evaluate(() => window._scN); if (n === last) break; last = n; await pause(400); } }
      await page.click('#' + id); if (!(await waitFor(page, () => !!document.querySelector('.hati-selmenu'), 3000))) { console.log('  (chooseStream: no list opened)'); return false; }
      await page.click('.hati-selmenu [data-sm]:not([disabled])');
      const r = await page.evaluate(i => { const v = document.getElementById(i).value; return { v, opts: [...document.getElementById(i).options].map(o => o.value).slice(0, 4) }; }, id);
      if (!r.v || r.v === '__new__') console.log('  (chooseStream:', JSON.stringify(r), ')');
      return !!r.v && r.v !== '__new__'; };
    const createIn = async () => { if (!(await waitFor(page, () => !!document.getElementById('na-root') && !document.getElementById('nd-menu'), 8000))) { console.log('  (createIn: the form did not open)'); return false; }
      if (!(await page.evaluate(() => !!document.querySelector('.na-pick.on')))) { await domClick('#na-root [data-wz-tid]'); }
      if (!(await waitFor(page, () => !!(window.naStreamBox && naStreamBox(document.getElementById('na-form'))), 6000))) return false;
      if (!(await chooseStream())) { console.log('  (createIn: no stream could be chosen)'); return false; }
      if (!(await waitFor(page, () => { const b = document.getElementById('na-create'); return !!b && !b.disabled; }, 6000))) return false;
      /* a template's own required box (the other party) is answered, as a person would; the sentence's is already in it */
      const cp = await page.$('#na-form input[id$="-counterparty"]');
      if (cp && !(await cp.inputValue())) await cp.fill('Census Draft Ltd');
      await page.click('#na-create'); return true; };
    ids = await known();
    await door(D, 'the wall\'s chip "draft a new agreement", Open the form, Create', { start: onWall,
      press: async () => { if (!(await waitFor(page, () => !!document.querySelector('[data-ig-chips] [data-ca-chip="draft"]'), 8000))) return false;
        if (!(await domClick('[data-ig-chips] [data-ca-chip="draft"]'))) return false;
        if (!(await waitFor(page, () => !!document.querySelector('[data-ca-act="draftform"]'), 5000))) return false;
        await page.evaluate(() => { const b = [...document.querySelectorAll('[data-ca-act="draftform"]')].pop(); b.click(); }); return createIn(); },
      expect: isNew(ids), says: NEWSAYS });
    ids = await known();
    await door(D, 'a "draft an NDA with Volvo" sentence, Open the form, Create', { start: onWall,
      press: async () => { if (!(await waitFor(page, () => !!document.getElementById('igd-input'), 8000))) return false;
        if ((await say('draft an NDA with Volvo')()) === false) return false;
        if (!(await waitFor(page, () => !!document.querySelector('.ca-dr [data-ca-act="form"]'), 8000))) return false;
        await page.evaluate(() => { const b = [...document.querySelectorAll('.ca-dr [data-ca-act="form"]')].pop(); b.click(); }); return createIn(); },
      expect: L => isNew(ids)(L) && L.cp === 'Volvo', says: NEWSAYS + ', with Volvo' });
    await door(D, '⌘K, a contract row (Kabras)', { start: atStart,
      press: async () => { await page.evaluate(() => openCommandPalette()); if (!(await waitFor(page, () => !!document.getElementById('cp-input'), 4000))) return false;
        await page.type('#cp-input', 'Kabras', { delay: 10 });
        return page.evaluate(() => { const i = commandPaletteResults('Kabras').findIndex(r => r.kind === 'contract'); const b = i >= 0 ? document.getElementById('cp-opt-' + i) : null; if (!b) return false; b.click(); return true; }); },
      expect: E.strip('MK-A1'), says: SAYS.strip });
    /* "bring up" in Jambo's box on the Board (step 8): the strip, below Today's insights */
    await door(D, 'Jambo\'s box on the Board, "bring up MK-A2"', { start: async () => { await page.evaluate(() => { setView('dashboard'); hbSetFace('board'); }); await waitFor(page, () => !!document.getElementById('igd-input'), 8000); },
      press: say('bring up MK-A2'), expect: E.strip('MK-A2'), says: SAYS.strip });
    await door(D, 'the top bar\'s search', { start: atStart,
      press: async () => { if (!(await page.$('#cmd-search'))) return false; await page.fill('#cmd-search', 'Kabras'); return true; },
      expect: E.wall(null), says: 'Home\'s Contracts place' });
    await page.evaluate(() => { const s = document.getElementById('cmd-search'); if (s){ s.value = ''; } if (window.regState) regState().query = ''; });

    lap('Jambo');
    /* ================= E · THE PAPER'S ⋯ MENU ================= */
    const EM = 'E the paper\'s ⋯';
    const menuOpen = id => async () => { await onPaper(id)(); await domClick('#ig-strip #ws-more'); await waitFor(page, () => !!document.querySelector('#ws-more-menu:not(.hidden)'), 4000); };
    const items = await (async () => { await menuOpen('MK-A2')(); return page.evaluate(() => [...document.querySelectorAll('#ws-more-menu button')].map(b => b.id).filter(Boolean)); })();
    console.log(`  the ⋯ menu on Home's paper holds: ${items.join(' ')}`);
    await door(EM, 'Filing and stream (MK-A2)', { start: menuOpen('MK-A2'), press: () => domClick('#ws-more-menu #ws-filing'), expect: E.strip('MK-A2', 'details'), says: SAYS.stripDetails + ', its filing rows' });
    await door(EM, 'Delete (MK-DEL)', { start: menuOpen('MK-DEL'),
      press: async () => { if (!(await domClick('#ws-more-menu #ws-delete'))) return false;
        const conf = await waitFor(page, () => [...document.querySelectorAll('button')].some(b => /^Delete/.test(b.textContent.trim()) && b.closest('.modal-overlay, #confirm-overlay, [role="dialog"]')), 4000);
        if (conf) await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /^Delete/.test(x.textContent.trim()) && x.closest('.modal-overlay, #confirm-overlay, [role="dialog"]')); b && b.click(); });
        return true; },
      expect: E.wall(null), says: 'Home\'s Contracts place' });

    lap('the paper\'s menu');
    /* ================= F · AN EMAIL LINK ================= */
    const F = 'F an email link';
    let n = 0;
    const link = hash => async () => { await page.goto(`${h.base}/?n=${++n}#${hash}`, { waitUntil: 'networkidle' });
      await waitFor(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length > 0 && !/contract=/.test(location.hash), 15000); return true; };
    const LINKS = [
      ['#contract=MK-A2 (no tab)', 'contract=MK-A2', E.strip('MK-A2'), SAYS.strip, null],
      ['&tab=terms (MK-A2)', 'contract=MK-A2&tab=terms', E.strip('MK-A2'), SAYS.strip, null],
      ['&tab=stands (MK-A2)', 'contract=MK-A2&tab=stands', E.strip('MK-A2', 'where'), SAYS.stripWhere, null],
      ['&tab=sign&go=approval (MK-A2)', 'contract=MK-A2&tab=sign&go=approval', E.signing('MK-A2'), SAYS.signing, null],
      ['&tab=redline (MK-R1)', 'contract=MK-R1&tab=redline', E.red('MK-R1'), SAYS.red, null],
      ['&tab=history (MK-A1)', 'contract=MK-A1&tab=history', E.board('MK-A1', 'hist'), 'the Board\'s History view', null],
      ['&tab=docs (MK-A1)', 'contract=MK-A1&tab=docs', E.paper('MK-A1'), SAYS.paper, null],
    ];
    for (const [nm, hash, want, says, p] of LINKS) await door(F, nm, { start: atStart, press: link(hash), expect: want, says, pending: p });

    lap('the email links');
    /* ================= G · A REFRESH ================= */
    const G = 'G a refresh';
    const reload = async () => { await page.reload({ waitUntil: 'networkidle' }); await waitFor(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length > 0, 15000); return true; };
    const REFRESH = [
      ['on the Redlines face (MK-R1)', () => page.evaluate(() => pdRedOpen('MK-R1')), E.red('MK-R1'), SAYS.red, null],
      ['on Fill in (MK-A2)', () => page.evaluate(() => pdFillOpen('MK-A2')), E.fill('MK-A2'), SAYS.fill, null],
      ['on Before you sign (MK-A2)', () => page.evaluate(() => pdSignOpen('MK-A2')), E.signing('MK-A2'), SAYS.signing, null],
      ['on the Board\'s Obligations view (MK-A1)', () => page.evaluate(() => hbOpenView('MK-A1', 'oblig')), E.board('MK-A1', 'oblig'), 'the Board\'s Obligations view', null],
      ['on the wall narrowed to a party', () => page.evaluate(() => cuOpenCustomer('naivas supermarkets')), PARTY, PSAYS, null],
      ['on the Negotiations list', () => go('redline'), E.ngList, 'the Negotiations list', null],
      /* the room by name (the checks' own door) and a refresh standing on it: the strip */
      ['on the room, opened by name (MK-A1)', () => page.evaluate(() => openWorkspace('MK-A1', { room: true })), E.strip('MK-A1'), SAYS.strip, null],
      ['on the strip, on Where we are (MK-A1)', () => page.evaluate(() => hbStripBring('MK-A1', 'where')), E.strip('MK-A1', 'where'), SAYS.stripWhere, null],
      ['on the Contracts place (the Wall)', () => go('register'), E.wall(null), SAYS.wall, null],
      ['on the Contracts place, the List', () => page.evaluate(() => { regPlaceSet({ show: 'list' }); setView('register'); }), E.list(null), SAYS.list, null],
      ['on the Contracts place, the In Review tab', () => page.evaluate(() => regGoFiltered({ stage: 'Under Review' })), E.stageTab('Under Review'), 'Home\'s Contracts place, on In Review', null],
    ];
    for (const [nm, put, want, says, p] of REFRESH)
      await door(G, nm, { start: async () => { await put(); await settle(2500); }, press: reload, expect: want, says, same: true, pending: p });

    lap('a refresh');
    /* one photograph of the census's own measure: the door the owner asked about most */
    await page.evaluate(() => cuOpenCustomer('naivas supermarkets')); await settle();
    await page.screenshot({ path: path.join(OUT, 'open-party-wall.png') }).catch(() => {});
  } catch (e) {
    record('the run', 'the stage ran', false, 'threw', String(e && e.stack || e).slice(0, 300), null);
  } finally {
    record('the run', 'no page errors', !errors.length, errors.length ? errors.slice(0, 3).join(' | ') : 'none', 'page errors', null);
    console.log(`\nPENDING (printed on every run; each later step takes its own off):`);
    rows.filter(r => /^PENDING/.test(r.verdict)).forEach(r => console.log(`  ${r.verdict} · ${r.area} · ${r.name} — today ${r.said}`));
    console.log(`\n${pass}/${pass + fail} passed · ${pend} pending · ${rows.length} doors pressed`);
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    process.exit(fail ? 1 : 0);
  }
})();
