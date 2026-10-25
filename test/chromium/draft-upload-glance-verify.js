/* ============================================================
   DRAFT, DROP, AT A GLANCE, AND THE STREAM — IN JAMBO'S PANEL
   (the overnight work order, steps 3 to 6; the owner's "Go" on
   docs/WORKORDER-one-page-finish.md and its demo, 14 Oct 2026)
   ============================================================
   Driven in a real browser at the owner's 1440×780, photographed at all
   three of the owner's screens (1440×780, 1536×730, 1366×950):
     1  Home's head carries no "+ Draft new agreement"; the wall's chips lead
        with "upload a document", then "draft a new agreement"
     2  the chip answers with the Draft card; Open the form opens the ONE form
        (no two-door menu), Create grey with its reason (RE-POINTED 24 Oct
        2026: the chip opens the one sheet itself, no card)
     3  "draft an NDA with Volvo" brings the one form straight to the desk as
        one sheet (round 4, the owner picked "One sheet", 17 Oct 2026 — the
        New agreement card is retired): what was read (With: Volvo) is its
        first section, the closest paper offered and nothing picked; a pick
        brings its questions with Volvo in the box; Create greys while no
        stream is chosen in step 3; Create lands on the new paper with Fill
        in beside it
     4  a Word file dropped on the drop area goes through the upload's own path
        (never the pop-up) and lands on its paper with Fill in open, named off
        the file; a legacy .doc is refused in the drop area and in a toast
     5  Fill in asks the stream: the current one lit, never counted as owed; a
        press asks, moves it, records "Re-filed", and draws no room; a person
        who may not re-file sees it grey with the reason
     6  with a contract on the paper Jambo's tab opens on "<ref> at a glance",
        each count the reading its face uses; Fill in and Signing open their
        faces; the card sits above the chips and the box
     7  it all fits at the shortest screen (1536×730); no page errors
   THE FIX ROUND (15 Oct 2026, the checkers' findings): the form Jambo opens
   starts on no stream (Create grey, "Choose a stream first.", until a press
   on HaTi's own list chooses one); the Swedish sentence drafts; the drop area
   asks the stream and the file is filed there; "upload" typed with a
   contract on the paper turns in a toast; an executed contract's glance asks
   for no signers; each glance count is the one its face draws.
     node test/chromium/draft-upload-glance-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');
const { mkDocx, para } = require('../docxfix');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'draft-upload-glance');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const pause = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };
let pass = 0, fail = 0;
const check = (name, ok, detail) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? '  — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`); };
/* the room or the upload pop-up drawn on any frame */
const WATCH = () => {
  window._seen = { room: false, popup: false, menu: false };
  new MutationObserver(recs => { for (const r of recs) r.addedNodes.forEach(n => { if (!n || n.nodeType !== 1) return;
    const has = s => n.matches && (n.matches(s) || !!n.querySelector(s));
    if (has('#ws-tabs')) window._seen.room = true;
    if (has('#up-drop, #up-file')) window._seen.popup = true;
    if (has('#nd-menu, [data-nd-door]')) window._seen.menu = true; }); }).observe(document, { childList: true, subtree: true });
};
const word = (lines) => Buffer.from(mkDocx(lines.map(t => para(t)).join('')));

/* RE-POINTED 22 Oct 2026 (the first-timer rounds, round 4 "He speaks"): a new draft's panel turns to
   Jambo's first words once; the reader's own ‹ back (the trail's .pd-back) returns it to the Dossier */
const pastFirstWords = async page => {
  const end = Date.now() + 8000;
  while (Date.now() < end){
    const s = await page.evaluate(() => document.getElementById('pd-glance') ? 'cd' : document.querySelector('#ig-dock .jb-turn') ? 'jb' : '').catch(() => '');
    if (s === 'cd') return true;
    if (s === 'jb'){ await page.evaluate(() => { const b = document.querySelector('#ig-dock .pd-trail .pd-back'); if (b) b.click(); }).catch(() => {}); }
    await new Promise(r => setTimeout(r, 120));
  }
  return false;
};
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await seedWorkspace(h, { contracts: [fixtureContract('MK-A1', 'Refined Sugar Supply', 'Kabras Sugar', FOLDER_A, 48000000, 'Under Review'),
    /* signed outside HaTi and imported: no signatures rows, no signer plan */
    fixtureContract('MK-A9', 'Bottle Supply (executed)', 'Kabras Sugar', FOLDER_A, 1200000, 'Signed')], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  await ctx.addInitScript(WATCH);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 200)));
  const say = async w => { await page.click('#igd-input'); await page.fill('#igd-input', ''); await page.type('#igd-input', w, { delay: 8 }); await page.keyboard.press('Enter'); };
  const shoot = async name => { for (const [w, hh] of SCREENS) { await page.setViewportSize({ width: w, height: hh }); await pause(350);
    await page.screenshot({ path: path.join(OUT, `${name}-${w}x${hh}.png`) }).catch(() => {}); } await page.setViewportSize({ width: 1440, height: 780 }); await pause(250); };
  const login = async (pg, email, pass) => { await pg.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pg.fill('#li-email', email); await pg.fill('#li-pass', pass); await pg.click('#li-go');
    await waitFor(pg, () => window.state && Array.isArray(state.contracts) && state.contracts.length > 0 && window.currentUser && currentUser(), 20000);
    await pg.keyboard.press('Escape').catch(() => {});
    const en = await pg.$('.lang-btn[data-lang="en"]'); if (en) await en.click(); };
  /* a person's press on a dropdown: HaTi's own list, then the row */
  const choose = async (sel, value) => {
    /* HaTi's list shuts on any scroll (core.js): the press waits for the page to hold still, bounded */
    await page.evaluate(() => { window._scN = 0; if (!window._scArmed) { window._scArmed = true; window.addEventListener('scroll', () => { window._scN++; }, true); } });
    { const end = Date.now() + 3000; let last = -1; while (Date.now() < end) { const n = await page.evaluate(() => window._scN); if (n === last) break; last = n; await pause(400); } }
    await page.click(sel);
    if (!(await waitFor(page, () => !!document.querySelector('.hati-selmenu'), 3000))) return false;
    const i = await page.evaluate(([s, v]) => [...document.querySelector(s).options].findIndex(o => o.value === v), [sel, value]);
    if (i < 0) return false;
    await page.click(`.hati-selmenu [data-sm="${i}"]`); return page.evaluate(([s, v]) => document.querySelector(s).value === v, [sel, value]); };
  const wall = async () => { await page.evaluate(() => { setView('dashboard'); caHomeWall(); intel.history = []; renderIntelDock(); });
    return waitFor(page, () => !intel.paper && !!document.getElementById('pd-drop'), 8000); };
  try {
    await login(page, 'admin@example.co.ke', 'adminpassword1');

    /* ===== 1. HOME'S HEAD, AND THE WALL'S CHIPS ===== */
    check('1a the wall: Jambo\'s tab greets and offers the drop area', await wall());
    const head = await page.evaluate(() => ({ draft: !!document.querySelector('#hb-head #hero-draft, #hb-head .hm-primary'),
      chips: [...document.querySelectorAll('#ig-dock [data-ig-chips] button')].map(b => b.textContent.trim()),
      hello: (document.querySelector('#ig-dock .pd-hello') || {}).innerText || '', welcome: !!document.querySelector('#ig-dock .ig-welcome'),
      first: (() => { const w = document.querySelector('#ig-dock [data-jb-hello]'), p = document.querySelector('#ig-dock .pd-hello');
        return !!(w && p && (w.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING)); })() }));
    check('1b Home\'s head carries no "+ Draft new agreement"', !head.draft);
    check('1c the chips lead with "upload a document", then "draft a new agreement"', head.chips[0] === 'upload a document' && head.chips[1] === 'draft a new agreement', head.chips);
    /* RE-POINTED 24 Oct 2026 (ONE WINDOW, owner: "bring them back" the greetings): the wall is a one-window
       panel, so his own greeting (jamboHelloHtml) leads it, then the wall's line saying what to do */
    check('1d his greeting leads the window, then the wall\'s line says what to do', /Press a paper on the left/.test(head.hello) && head.welcome && head.first, head.hello);
    await shoot('1-wall');

    /* ===== 2. THE DRAFT CHIP ===== */
    await page.click('#ig-dock [data-ig-chips] [data-ca-chip="draft"]');
    /* RE-POINTED 24 Oct 2026 (one door, the Legora way): no Draft card in the
       chat — the chip opens the one sheet beside Jambo straight away */
    const form = await waitFor(page, () => !!document.getElementById('na-root'), 6000);
    check('2a "draft a new agreement" opens the one sheet, no card in the chat', form && await page.evaluate(() => !document.querySelector('#ig-dock .ca-dr [data-ca-act="draftform"]') && !window._seen.menu));
    await shoot('2-draft-card');
    const f0 = await page.evaluate(() => { const b = document.getElementById('na-create'); return { menu: window._seen.menu, dis: !!(b && b.disabled), why: b && b.title }; });
    check('2b Open the form opens the one form, never the two-door menu', form && !f0.menu, f0);
    check('2c Create is grey with its reason until a template is picked', f0.dis && /Pick a template first/.test(f0.why || ''), f0.why);
    await page.evaluate(() => closeModal()); await pause(300);

    /* ===== 3. A SENTENCE ===== */
    await wall();
    await say('draft an NDA with Volvo');
    const nac = await waitFor(page, () => !!document.querySelector('#na-root.na-one #na-words'), 8000);
    /* RE-POINTED 24 Oct 2026 (one door, the Legora way; the owner's "Pick it
       when clear"): the NDA is clearly the closest, so it is picked, and the
       sentence's Volvo stands in its counterparty box with the words quoted */
    await waitFor(page, () => !!document.querySelector('#na-root.is-picked #na-form input[id$="-counterparty"]'), 8000);
    const rows = await page.evaluate(() => { const w = document.getElementById('na-words'), said = [...document.querySelectorAll('#ig-dock .ca-dr-said')].pop();
      return { words: (document.getElementById('dr-say') || {}).value || '', said: said ? said.innerText : '', card: (document.getElementById('na-card-name') || {}).textContent || '',
        withV: (document.querySelector('#na-form input[id$="-counterparty"]') || {}).value || '' }; });
    check('3a the sentence brings the one sheet to the desk with the words kept in its ask; Jambo says it in a line', nac && /draft an NDA with Volvo/.test(rows.words) && /opened a new agreement on the desk/.test(rows.said), rows);
    check('3b With is the counterparty the sentence named', rows.withV === 'Volvo', rows.withV);
    check('3b2 the closest paper is picked, being clearly the closest, and Jambo says so', /NDA/.test(rows.card) && /I picked our NDA/.test(rows.said), rows);
    await shoot('3-the-one-sheet');
    const f1 = await page.evaluate(() => ({ lit: (document.getElementById('na-card-name') || {}).textContent || '',
      cp: (document.querySelector('#na-form input[id$="-counterparty"]') || {}).value || '',
      create: !document.getElementById('na-create').disabled, why: document.getElementById('na-create').title,
      stream: (naStreamBox(document.getElementById('na-form')) || {}).value,
      pressed: document.querySelectorAll('#na-file-seg [aria-pressed="true"]').length }));
    check('3c the paper picked brings its questions, Volvo already in its box', !!f1.lit && f1.cp === 'Volvo', f1);
    check('3c2 the stream is asked, not taken: none chosen, Create grey with "Choose a stream first."', f1.stream === '' && f1.pressed === 0 && !f1.create && /Choose a stream first/.test(f1.why || ''), f1);
    await shoot('3-the-one-form');
    const picked = await page.locator('#na-file-seg [data-na-stream="mktg"]').count() > 0 && (await page.click('#na-file-seg [data-na-stream="mktg"]'), true);
    const gate = await page.evaluate(() => { const b = document.getElementById('na-create'); return { dis: b.disabled, why: b.title, stream: naStreamBox(document.getElementById('na-form')).value }; });
    check('3e a press on the stream in step 3 chooses it, and Create wakes', picked && !gate.dis && gate.stream === 'mktg', gate);
    const before = await page.evaluate(() => state.contracts.map(c => c.id));
    await page.click('#na-create');
    /* the Dossier beside it, owed or not; Fill in only on the reader's press
       (owner, 20 Oct 2026: "it pushes me to fill without my asking") */
    await waitFor(page, ids => { const p = intel.paper && intel.paper.id; return !!p && !ids.includes(p); }, 15000, before);
    await pastFirstWords(page);
    const made = await waitFor(page, ids => { const p = intel.paper && intel.paper.id; if (!p || ids.includes(p)) return false;
      return !!document.getElementById('pd-glance') && !document.querySelector('#pd-fillface .pd-ff'); }, 15000, before);
    const nv = await page.evaluate(() => { const c = getContract(intel.paper.id); return { id: c.id, cp: c.counterparty, folder: c.folder, view: state.view, room: window._seen.room, left: detailsOf(c).left,
      fill: !!document.querySelector('#pd-fillface .pd-ff'), glance: !!document.getElementById('pd-glance') }; });
    check('3f Create lands on the new paper with Volvo, in the stream chosen — the Dossier beside it, Fill in not opened', made && !nv.fill && nv.glance && nv.cp === 'Volvo' && nv.folder === 'mktg' && nv.view === 'dashboard' && !nv.room, nv);

    /* the Swedish sentence the card offers drafts too */
    await page.evaluate(() => langSet('sv')); await wall();
    await say('skriv ett NDA med Volvo');
    const sv = await waitFor(page, () => !!document.querySelector('#na-root.na-one #na-words'), 8000);
    /* RE-POINTED 24 Oct 2026: the NDA is picked, Volvo in its counterparty box */
    await waitFor(page, () => !!(document.querySelector('#na-root.is-picked #na-form input[id$="-counterparty"]') || {}).value, 8000);
    const svWith = await page.evaluate(() => (document.querySelector('#na-root.is-picked #na-form input[id$="-counterparty"]') || {}).value || '');
    check('3g "skriv ett NDA med Volvo" brings the form too, Med: Volvo', sv && svWith === 'Volvo', svWith);
    await page.evaluate(() => closeModal()); await pause(300);
    await page.evaluate(() => langSet('en'));

    /* ===== 4. THE DROP AREA ===== */
    await wall();
    await page.evaluate(() => { window._seen.popup = false; window._seen.room = false; });
    const ids4 = await page.evaluate(() => state.contracts.map(c => c.id));
    const b64 = word(['COURIER SERVICES AGREEMENT', 'This Agreement is made between Parcelway ApS and the Client.',
      '1. Services. The Supplier shall collect and deliver the parcels within Nairobi.', '2. Fees. The Client shall pay each invoice within thirty (30) days of receipt.']).toString('base64');
    const drop = (b, name, type) => page.evaluate(([b, name, type]) => { const z = document.getElementById('pd-drop'); if (!z) return false;
      const f = new File([Uint8Array.from(atob(b), ch => ch.charCodeAt(0))], name, { type }); const dt = new window.DataTransfer(); dt.items.add(f);
      z.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
      z.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); return true; }, [b, name, type]);
    const asks = await page.evaluate(() => { const s = document.getElementById('pd-drop-stream'); return s ? { v: s.value, n: s.options.length, first: visibleFolders()[0].id } : null; });
    check('4a0 the drop area asks the stream, as the pop-up did: the first chosen until another is', !!asks && asks.n >= 2 && asks.v === asks.first, asks);
    const streamed = await choose('#pd-drop-stream', 'sales');
    await drop(b64, 'Courier Services Agreement.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    /* RE-POINTED 22 Oct 2026 (Jambo's journey, round 1: he speaks first on an upload, in his panel): once the
       arrival reading has landed he may have turned the panel to his words; the reader goes back to the
       Dossier with its ‹ Dossier, as a person would */
    await waitFor(page, ids => { const p = intel.paper && intel.paper.id; return !!p && !ids.includes(p); }, 20000, ids4);
    await page.waitForFunction(() => { const c = intel.paper && getContract(intel.paper.id); return !!(c && c.triage && c.triage.hash !== undefined && !c._triaging); }, null, { timeout: 20000 }).catch(() => {});
    await pause(300);
    await page.evaluate(() => { const d = document.getElementById('ig-dock'); const b = d && d.classList.contains('is-talk') ? d.querySelector('[data-pd-back]') : null; if (b) b.click(); });
    const landed = await waitFor(page, ids => { const p = intel.paper && intel.paper.id; return !!p && !ids.includes(p) && !!document.getElementById('pd-glance') && !document.querySelector('#pd-fillface .pd-ff'); }, 20000, ids4);
    const up = await page.evaluate(() => { const c = getContract(intel.paper.id); return { id: c.id, name: c.name, src: c.source, folder: c.folder, audit: (c.audit || []).map(a => a.action),
      popup: window._seen.popup, room: window._seen.room, face: hbFace(), view: state.view, owner: !!c.owner }; });
    check('4a a dropped Word file lands on its paper with the Dossier beside it, on Home', landed && up.view === 'dashboard' && up.face === 'paper', up);
    check('4b through the upload\'s own path: named off the file, uploaded, owned', up.name === 'Courier Services Agreement' && up.src === 'upload' && up.audit.includes('Uploaded') && up.owner, up);
    check('4c never the pop-up, never the room', !up.popup && !up.room, { popup: up.popup, room: up.room });
    check('4c2 filed in the stream the drop area asked', streamed && up.folder === 'sales', { streamed, folder: up.folder });
    /* RE-POINTED 20 Oct 2026 (owner picked "The Legora way"): who we are is a Key terms line under
       Still owed's grid; its Change box offers our entities */
    await page.evaluate(id => pdKtOpen(id, 'party'), up.id);
    await waitFor(page, () => !!document.querySelector('#pd-kt [data-kt="party"]'), 5000);
    const party = await page.evaluate(() => { const i = document.querySelector('#pd-kt [data-kt="party"]'); const dl = i && document.getElementById(i.getAttribute('list'));
      return { box: !!i, offered: dl ? [...dl.options].map(o => o.value) : [] }; });
    check('4d who we are is changed in Key terms beside the paper, our entities offered', party.box && party.offered.length > 0, party);
    await shoot('4-dropped-fill-in');
    const upId = up.id;
    await wall();
    const n4 = await page.evaluate(() => state.contracts.length);
    await drop(Buffer.from('\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1 old word', 'latin1').toString('base64'), 'Old.doc', 'application/msword');
    const refused = await waitFor(page, () => !!document.querySelector('#pd-drop .pd-drop-why'), 8000);
    const r4 = await page.evaluate(() => ({ why: (document.querySelector('#pd-drop .pd-drop-why') || {}).textContent || '', n: state.contracts.length }));
    check('4e a legacy .doc is refused in the drop area, nothing filed', refused && r4.n === n4 && r4.why.length > 10, r4.why.slice(0, 90));
    await shoot('4-refused');

    /* "upload" typed with a contract on the paper. RE-POINTED 18 Oct 2026
       (LAND ON IT): every upload door on a computer is the drop area, so the
       word lands there, lit, and presses nothing; Choose a file is the
       reader's press, and the read turns in the drop area's own ring */
    await page.evaluate(() => pdOpenOnHome('MK-A1', 'plain'));
    await waitFor(page, () => !!document.querySelector('#pd-glance[data-pd-glance-for="MK-A1"]'), 8000);
    const ids4f = await page.evaluate(() => state.contracts.map(c => c.id));
    await say('upload');
    const lit4f = await waitFor(page, () => { const d = document.getElementById('pd-drop'); return !!d && d.classList.contains('is-landed'); }, 8000);
    const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 6000 }).catch(() => null), page.click('#pd-drop [data-pd-drop-pick]').catch(() => {})]);
    if (chooser) await chooser.setFiles({ name: 'Haulage Terms.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: word(['HAULAGE AGREEMENT', 'This Agreement is made between Parcelway ApS and the Client.', '1. Haulage. The Carrier shall haul the goods.']) });
    const land4f = await waitFor(page, ids => { const p = intel.paper && intel.paper.id; return !!p && !ids.includes(p); }, 20000, ids4f);
    check('4f "upload" with a contract on the paper lands on the drop area, lit; the file chosen there lands on its paper', !!lit4f && !!chooser && land4f, { lit: !!lit4f, chooser: !!chooser, land4f });

    /* ===== 5. THE STREAM IN STILL OWED =====
       RE-POINTED 20 Oct 2026 (owner picked "The Legora way"): the stream is a saved row in the
       grid, "set when the draft was made"; moving it is the filing door's (⋯ › Filing), not the grid's */
    await page.evaluate(id => pdOpenOnHome(id, 'plain'), upId);
    await waitFor(page, () => !!document.querySelector('#pd-og [data-pd-og-row="stream"]'), 8000);
    const s0 = await page.evaluate(() => { const c = getContract(intel.paper.id); const r = document.querySelector('#pd-og [data-pd-og-row="stream"]');
      return { folder: c.folder, name: (FOLDERS[c.folder] || {}).name, said: r ? r.textContent : '', box: !!(r && r.querySelector('input, select, button')), ring: !!(r && r.querySelector('.pd-ck-ring.is-done')) }; });
    /* RE-POINTED 21 Oct 2026 (owner: the grey line under an owed fact was noise): the row names the stream and says Saved */
    /* RE-POINTED 22 Oct 2026 (owner picked "1 · Checklist"): an answered row says so with its filled ring, not the word */
    check('5a Still owed names the stream, saved', !!s0.name && s0.said.includes(s0.name) && s0.ring && !/set when/i.test(s0.said) && !s0.box, s0);
    check('5b and never counts it as owed', !(await page.evaluate(() => detailsOf(getContract(intel.paper.id)).items.some(x => /folder|stream/.test(x.key)))));

    /* ===== 6. AT A GLANCE ===== */
    await page.evaluate(id => pdOpenOnHome(id, 'plain'), upId);
    const gl = await waitFor(page, () => !!document.getElementById('pd-glance'), 8000);
    const g = await page.evaluate(() => { const c = getContract(intel.paper.id); const el = document.getElementById('pd-glance');
      const rows = [...el.querySelectorAll('[data-pd-gl]')].map(r => [r.getAttribute('data-pd-gl'), r.querySelector('span').textContent]);
      /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): the glance is the dossier — the spine for the stage, What Jambo read, Still owed */
      /* RE-POINTED 20 Oct 2026 (the Legora way): each owed detail is a row of Still owed's grid */
      const fillRows = [...el.querySelectorAll('#pd-og [data-pd-og-kind]')].filter(r => !['signer', 'people'].includes(r.getAttribute('data-pd-og-kind'))).map(() => 1);
      /* RE-POINTED 22 Oct 2026 (the Checklist): the number leads the risks row's grey value */
      const rk = el.querySelector('[data-pd-ds="risks"] .ds-val');
      /* RE-POINTED 23 Oct 2026 (Spine): no section heads; the stages stand down the spine, one current */
      return { title: [...el.querySelectorAll('.ds-sp-st b')].map(b => b.textContent).join(' | '), pill: !!el.querySelector('.ds-spine .ds-sp-st.is-cur'), rows,
        fillN: fillRows.reduce((a, b) => a + b, 0), riskN: rk ? Number((/^\d+/.exec(rk.textContent.trim()) || [0])[0]) : 0,
        left: detailsOf(c).left, risks: (c.scan && riskMayAct(c, {})) ? riskOpenOf(c).length : 0, nobody: signBlockers(c).some(b => b.key === 'signers'),
        unsent: c.negotiation ? rlUnsentCount(c, {}) : 0, nego: !!c.negotiation,
        ogSign: !!el.querySelector('#pd-og [data-pd-og-row="signers"]'),
        /* RE-POINTED 20 Oct 2026: Still owed's grid makes the card taller than the panel, so it scrolls in
           its own area; that area ends above the chips and the box (it never runs under them) */
        above: (() => { const chips = document.querySelector('#ig-dock [data-ig-chips]'); const sc = el.closest('.overflow-y-auto') || el;
          return !!chips && sc.getBoundingClientRect().bottom <= chips.getBoundingClientRect().top + 1; })() }; });
    const num = k => { const r = g.rows.find(x => x[0] === k); return r ? Number((/(\d+)/.exec(r[1]) || [])[1] || (k === 'sign' ? 1 : 0)) : 0; };
    check('6a Jambo\'s tab opens on the dossier: the stage on the spine, What Jambo read, Still owed', gl && /^Arrived \| Read \| Fill in \| Negotiate \| Sign \| Live$/.test(g.title) && g.pill, g.title);
    check('6b each count is the reading its own face uses', g.fillN === g.left && g.riskN === g.risks && num('share') === g.unsent && g.ogSign === g.nobody, g);
    check('6c reading it starts no negotiation', !g.nego);
    check('6d the card sits above the chips and the box', g.above);
    await shoot('6-glance');
    /* RE-POINTED 20 Oct 2026: no Fill in face; Still owed IS the form */
    check('6e Still owed carries the boxes beside the paper, no Fill in face', await page.evaluate(() => !!document.querySelector('#pd-glance #pd-og [data-pd-og-row]') && !document.getElementById('pd-fillface')));
    /* a fresh upload has nobody named to sign: the row must be there to press (a missing row is reported, never skipped) */
    /* RE-POINTED 20 Oct 2026 (the Legora way, signer "Yes, our signer here"): nobody named to sign is a
       row of the grid asking our signer and theirs, one Confirm (a route needs a signer on each side) */
    /* RE-POINTED 21 Oct 2026: the owner picked "The SAP way" for the Signer row, so our
       signer is a search box over the directory, not a <select> (no <select> may be left in
       the row — one list per press, on an iPad too). The reading is the same: a box for our
       signer, boxes for their name and address, one Confirm. */
    /* RE-POINTED 22 Oct 2026 (owner: the signer boxes went, "the use for it is in the pop up feature for
       signer"): the row is one line whose press is the signing route editor's door — no boxes, no Confirm */
    const signRow = await page.evaluate(() => { const r = document.querySelector('#pd-og [data-pd-og-row="signers"]');
      return r ? { door: !!r.querySelector('.pd-ck-hd[data-pd-og-route]'), boxes: r.querySelectorAll('input, select').length, ok: !!r.querySelector('[data-pd-og-ok]') } : null; });
    check('6f nobody named to sign is a grid row whose line opens the signing route', g.nobody && !!signRow && signRow.door && signRow.boxes === 0 && !signRow.ok, { nobody: g.nobody, signRow });
    /* the risks row says what the Redlines face draws */
    await page.evaluate(id => pdOpenOnHome(id, 'plain'), upId);
    await waitFor(page, () => !!document.getElementById('pd-glance'), 6000);
    const rkRow = await page.evaluate(() => { const r = document.querySelector('#pd-glance [data-pd-ds="risks"] .ds-val'); return r ? Number((/^\d+/.exec(r.textContent.trim()) || [0])[0]) : 0; });
    /* RE-POINTED (owner, 23 Oct 2026: "when you press on risk to look at it
       should take you to where risks are … and place you there"): the risks
       row's door opens the Redlines face beside the paper, landed on its
       "Risks to look at" list, whose count is the row's number. Pressed, never
       called; a missing door is reported. */
    const rkPressed = await page.click('#pd-glance [data-pd-gl-risks]', { timeout: 3000 }).then(() => true).catch(() => false);
    await waitFor(page, () => { const r = document.querySelector('#ig-dock #rl-risks'); return !!(r && r.classList.contains('is-landed')); }, 8000);
    const rkFace = await page.evaluate(() => { const r = document.querySelector('#ig-dock #rl-risks');
      return { list: !!r, landed: !!(r && r.classList.contains('is-landed')), n: r ? r.querySelectorAll(':scope > .rk-row[data-rk-key]:not(.is-gone)').length : 0, editor: !!document.querySelector('#clause-editor') }; });
    check('6g the risk count on the glance is the count its door lands on (the Redlines face\'s Risks to look at)', rkPressed && rkFace.list && rkFace.landed && !rkFace.editor && rkRow > 0 && rkRow === rkFace.n, { pressed: rkPressed, glance: rkRow, face: rkFace });
    await page.evaluate(() => { if (typeof rlCloseClauseEditor === 'function') try { rlCloseClauseEditor(); } catch (_){} });
    await page.waitForTimeout(400);
    /* an executed contract: signing is behind it */
    await page.evaluate(() => pdOpenOnHome('MK-A9', 'plain'));
    const ex = await waitFor(page, () => !!document.querySelector('#pd-glance[data-pd-glance-for="MK-A9"]'), 8000);
    const exRows = await page.evaluate(() => [...document.querySelectorAll('#pd-glance [data-pd-gl]')].map(r => r.getAttribute('data-pd-gl')));
    check('6h an executed contract\'s glance asks for no signers', ex && !exRows.includes('sign'), exRows);
    await page.evaluate(() => pdOpenOnHome('MK-A1', 'plain'));
    await waitFor(page, () => !!document.querySelector('#pd-glance[data-pd-glance-for="MK-A1"]'), 8000);
    await shoot('6-glance-mk-a1');

    /* ===== 7. IT FITS ===== */
    await page.setViewportSize({ width: 1536, height: 730 }); await wall();
    const fit = await page.evaluate(() => { const b = document.querySelector('#pd-drop [data-pd-drop-pick]'), d = document.getElementById('ig-dock');
      const r = b.getBoundingClientRect(), dr = d.getBoundingClientRect(); const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { inside: r.top >= dr.top && r.bottom <= dr.bottom && r.right <= dr.right, painted: !!at && (at === b || b.contains(at)), sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth }; });
    check('7a at 1536×730 the drop area\'s button is on screen, painted, nothing scrolls sideways', fit.inside && fit.painted && !fit.sideways, fit);
    await page.setViewportSize({ width: 1440, height: 780 });
  } catch (e) {
    check('the run', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | ') || 'none');
    console.log(`\n${pass}/${pass + fail} passed — photographs in ${OUT}`);
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    process.exit(fail ? 1 : 0);
  }
})();
