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
        (no two-door menu), Create grey with its reason
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
      hello: (document.querySelector('#ig-dock .pd-hello') || {}).innerText || '', welcome: !!document.querySelector('#ig-dock .ig-welcome') }));
    check('1b Home\'s head carries no "+ Draft new agreement"', !head.draft);
    check('1c the chips lead with "upload a document", then "draft a new agreement"', head.chips[0] === 'upload a document' && head.chips[1] === 'draft a new agreement', head.chips);
    check('1d the greeting replaces the notebook\'s, and says what to do', /Press a paper on the left/.test(head.hello) && !head.welcome, head.hello);
    await shoot('1-wall');

    /* ===== 2. THE DRAFT CHIP ===== */
    await page.click('#ig-dock [data-ig-chips] [data-ca-chip="draft"]');
    const card = await waitFor(page, () => !!document.querySelector('#ig-dock .ca-dr [data-ca-act="draftform"]'), 5000);
    check('2a "draft a new agreement" answers with the Draft card, nothing opened', card && await page.evaluate(() => !document.getElementById('na-root') && !window._seen.menu));
    await shoot('2-draft-card');
    await page.click('#ig-dock .ca-dr [data-ca-act="draftform"]');
    const form = await waitFor(page, () => !!document.getElementById('na-root'), 6000);
    const f0 = await page.evaluate(() => { const b = document.getElementById('na-create'); return { menu: window._seen.menu, dis: !!(b && b.disabled), why: b && b.title }; });
    check('2b Open the form opens the one form, never the two-door menu', form && !f0.menu, f0);
    check('2c Create is grey with its reason until a template is picked', f0.dis && /Pick a template first/.test(f0.why || ''), f0.why);
    await page.evaluate(() => closeModal()); await pause(300);

    /* ===== 3. A SENTENCE ===== */
    await wall();
    await say('draft an NDA with Volvo');
    const nac = await waitFor(page, () => !!document.querySelector('#na-root.na-one #na-words'), 8000);
    const rows = await page.evaluate(() => { const w = document.getElementById('na-words'), said = [...document.querySelectorAll('#ig-dock .ca-dr-said')].pop();
      return { words: w ? w.innerText : '', withV: w ? ([...w.querySelectorAll('.na-w-c')][1] || { querySelector: () => null }).querySelector('b').textContent : '',
        said: said ? said.innerText : '', picked: document.querySelectorAll('.na-pick.on').length, closest: document.querySelectorAll('#na-closest .na-pick').length }; });
    check('3a the sentence brings the one form to the desk, what was read its first section; Jambo says it in a line', nac && /From your words/.test(rows.words) && /draft an NDA with Volvo/.test(rows.words) && /opened a new agreement on the desk/.test(rows.said), rows);
    check('3b With is the counterparty the sentence named', rows.withV === 'Volvo', rows.withV);
    check('3b2 the closest paper is offered, nothing picked for you', rows.closest >= 1 && rows.picked === 0, rows);
    await shoot('3-the-one-sheet');
    await page.click('#na-closest .na-pick');
    await waitFor(page, () => !!document.querySelector('#na-form input[id$="-counterparty"]'), 8000);
    const f1 = await page.evaluate(() => ({ lit: (document.querySelector('.na-pick.on .na-pick-n') || {}).textContent || '',
      cp: (document.querySelector('#na-form input[id$="-counterparty"]') || {}).value || '',
      create: !document.getElementById('na-create').disabled, why: document.getElementById('na-create').title,
      stream: (naStreamBox(document.getElementById('na-form')) || {}).value,
      pressed: document.querySelectorAll('#na-file-seg [aria-pressed="true"]').length }));
    check('3c the paper pressed brings its questions, Volvo already in its box', !!f1.lit && f1.cp === 'Volvo', f1);
    check('3c2 the stream is asked, not taken: none chosen, Create grey with "Choose a stream first."', f1.stream === '' && f1.pressed === 0 && !f1.create && /Choose a stream first/.test(f1.why || ''), f1);
    await shoot('3-the-one-form');
    const picked = await page.locator('#na-file-seg [data-na-stream="mktg"]').count() > 0 && (await page.click('#na-file-seg [data-na-stream="mktg"]'), true);
    const gate = await page.evaluate(() => { const b = document.getElementById('na-create'); return { dis: b.disabled, why: b.title, stream: naStreamBox(document.getElementById('na-form')).value }; });
    check('3e a press on the stream in step 3 chooses it, and Create wakes', picked && !gate.dis && gate.stream === 'mktg', gate);
    const before = await page.evaluate(() => state.contracts.map(c => c.id));
    await page.click('#na-create');
    /* Fill in beside it while anything is owed; an NDA with its counterparty
       and start date answered owes nothing, and lands on Jambo (roomHomeLand) */
    const made = await waitFor(page, ids => { const p = intel.paper && intel.paper.id; if (!p || ids.includes(p)) return false;
      return detailsOf(getContract(p)).left ? !!document.querySelector('#pd-fillface .pd-ff') : !!document.getElementById('pd-glance'); }, 15000, before);
    const nv = await page.evaluate(() => { const c = getContract(intel.paper.id); return { id: c.id, cp: c.counterparty, folder: c.folder, view: state.view, room: window._seen.room, left: detailsOf(c).left,
      fill: !!document.querySelector('#pd-fillface .pd-ff'), glance: !!document.getElementById('pd-glance') }; });
    check('3f Create lands on the new paper with Volvo, in the stream chosen — Fill in beside it while owed, else at a glance', made && nv.cp === 'Volvo' && nv.folder === 'mktg' && nv.view === 'dashboard' && !nv.room, nv);

    /* the Swedish sentence the card offers drafts too */
    await page.evaluate(() => langSet('sv')); await wall();
    await say('skriv ett NDA med Volvo');
    const sv = await waitFor(page, () => !!document.querySelector('#na-root.na-one #na-words'), 8000);
    const svWith = await page.evaluate(() => { const w = document.getElementById('na-words'); const c = w && [...w.querySelectorAll('.na-w-c')][1]; return c ? c.querySelector('b').textContent : ''; });
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
    const landed = await waitFor(page, ids => { const p = intel.paper && intel.paper.id; return !!p && !ids.includes(p) && !!document.querySelector('#pd-fillface .pd-ff'); }, 20000, ids4);
    const up = await page.evaluate(() => { const c = getContract(intel.paper.id); return { id: c.id, name: c.name, src: c.source, folder: c.folder, audit: (c.audit || []).map(a => a.action),
      popup: window._seen.popup, room: window._seen.room, face: hbFace(), view: state.view, owner: !!c.owner }; });
    check('4a a dropped Word file lands on its paper with Fill in open, on Home', landed && up.view === 'dashboard' && up.face === 'paper', up);
    check('4b through the upload\'s own path: named off the file, uploaded, owned', up.name === 'Courier Services Agreement' && up.src === 'upload' && up.audit.includes('Uploaded') && up.owner, up);
    check('4c never the pop-up, never the room', !up.popup && !up.room, { popup: up.popup, room: up.room });
    check('4c2 filed in the stream the drop area asked', streamed && up.folder === 'sales', { streamed, folder: up.folder });
    const party = await page.evaluate(() => { const i = document.querySelector('#pd-fillface [data-kt="party"]'); const dl = i && document.getElementById(i.getAttribute('list'));
      return { box: !!i, offered: dl ? [...dl.options].map(o => o.value) : [] }; });
    check('4d who we are is asked in Fill in, our entities offered', party.box && party.offered.length > 0, party);
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

    /* ===== 5. THE STREAM IN FILL IN ===== */
    await page.evaluate(id => pdFillOpen(id), upId);
    await waitFor(page, () => !!document.querySelector('#pd-fillface [data-pd-ff-stream]'), 8000);
    const s0 = await page.evaluate(() => { const c = getContract(intel.paper.id);
      return { folder: c.folder, lit: [...document.querySelectorAll('#pd-fillface [data-pd-stream][aria-pressed="true"]')].map(b => b.getAttribute('data-pd-stream')),
        n: document.querySelectorAll('#pd-fillface [data-pd-stream]').length, left: detailsOf(c).left, all: detailsOf(c).all,
        kt: !!document.querySelector('#pd-fillface [data-pd-ff-stream] [data-kt]') }; });
    check('5a Fill in asks the stream: the company\'s streams, the current one lit', s0.n >= 2 && s0.lit.length === 1 && s0.lit[0] === s0.folder, s0);
    check('5b and never counts it as owed', !s0.kt && !(await page.evaluate(() => detailsOf(getContract(intel.paper.id)).items.some(x => /folder|stream/.test(x.key)))));
    const to = await page.evaluate(f => { const b = [...document.querySelectorAll('#pd-fillface [data-pd-stream]')].find(x => x.getAttribute('data-pd-stream') !== f); return b ? b.getAttribute('data-pd-stream') : null; }, s0.folder);
    await page.evaluate(() => { window._seen.room = false; });
    await page.click(`#pd-fillface [data-pd-stream="${to}"]`);
    const asked = await waitFor(page, () => !!document.querySelector('#confirm-overlay:not(.hidden) button, [role="dialog"] [data-dlg-confirm]'), 5000);
    await shoot('5-stream-asks');
    await page.evaluate(() => { const b = [...document.querySelectorAll('#confirm-overlay button, [role="dialog"] button')].find(x => /Move it/.test(x.textContent)); if (b) b.click(); });
    const moved = await waitFor(page, t => getContract(intel.paper.id).folder === t, 6000, to);
    const s1 = await page.evaluate(() => { const c = getContract(intel.paper.id); return { folder: c.folder, rec: (c.audit || []).some(a => a.action === 'Re-filed'),
      lit: [...document.querySelectorAll('#pd-fillface [data-pd-stream][aria-pressed="true"]')].map(b => b.getAttribute('data-pd-stream')), face: !!document.getElementById('pd-fillface'),
      room: window._seen.room, left: detailsOf(c).left }; });
    check('5c a press asks first, then moves it and records "Re-filed"', asked && moved && s1.rec && s1.lit[0] === to, s1);
    check('5d the face stays, the room is never drawn, the count does not move', s1.face && !s1.room && s1.left === s0.left, s1);
    await shoot('5-stream-moved');
    await page.waitForFunction(() => !window._saveTimer && !(window.state && state._saving), null, { timeout: 3000 }).catch(() => {});
    await pause(800);
    /* a person who may not re-file */
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', e => errors.push('(legal) ' + String(e.message || e).slice(0, 200)));
    await login(p2, 'everything@example.co.ke', 'their-own-pass-9');
    await p2.evaluate(id => { setView('dashboard'); pdFillOpen(id); }, upId);
    const ro = await waitFor(p2, () => !!document.querySelector('#pd-fillface [data-pd-ff-stream]'), 10000);
    const r5 = await p2.evaluate(() => ({ may: typeof mayReFile === 'function' && mayReFile(), dis: [...document.querySelectorAll('#pd-fillface [data-pd-stream]')].every(b => b.disabled),
      why: (document.querySelector('#pd-fillface .pd-ff-ro') || {}).textContent || '' }));
    /* RE-POINTED 18 Oct 2026 (the gaps, round 8 "Owed first", f751): the reason as drawn, with the rule's own door */
    check('5e a person who may not re-file sees the stream grey, with the reason', ro && !r5.may && r5.dis && /an admin’s act\. Ask an admin$/.test(r5.why.trim()), r5);
    await p2.screenshot({ path: path.join(OUT, '5-stream-read-only-1440x780.png') }).catch(() => {});
    await ctx2.close();

    /* ===== 6. AT A GLANCE ===== */
    await page.evaluate(id => pdOpenOnHome(id, 'plain'), upId);
    const gl = await waitFor(page, () => !!document.getElementById('pd-glance'), 8000);
    const g = await page.evaluate(() => { const c = getContract(intel.paper.id); const el = document.getElementById('pd-glance');
      const rows = [...el.querySelectorAll('[data-pd-gl]')].map(r => [r.getAttribute('data-pd-gl'), r.querySelector('span').textContent]);
      /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): the glance is the dossier — the spine for the stage, What Jambo read, Still owed */
      const fillRows = [...el.querySelectorAll('[data-pd-ds-card="owed"] [data-pd-gl="fill"]')].map(r => Number((/(\d+) more/.exec(r.textContent) || [])[1] || 1));
      const rk = el.querySelector('[data-pd-ds="risks"] b');
      return { title: [...el.querySelectorAll('.pd-gl-h b')].map(b => b.textContent).join(' | '), pill: !!el.querySelector('.ds-spine .ds-st.is-on, .ds-spine .ds-st.is-now'), rows,
        fillN: fillRows.reduce((a, b) => a + b, 0), riskN: rk ? Number(rk.textContent) : 0,
        left: detailsOf(c).left, risks: (c.scan && riskMayAct(c, {})) ? riskOpenOf(c).length : 0, nobody: signBlockers(c).some(b => b.key === 'signers'),
        unsent: c.negotiation ? rlUnsentCount(c, {}) : 0, nego: !!c.negotiation,
        above: (() => { const chips = document.querySelector('#ig-dock [data-ig-chips]'); return !!chips && el.getBoundingClientRect().bottom <= chips.getBoundingClientRect().top + 1; })() }; });
    const num = k => { const r = g.rows.find(x => x[0] === k); return r ? Number((/(\d+)/.exec(r[1]) || [])[1] || (k === 'sign' ? 1 : 0)) : 0; };
    check('6a Jambo\'s tab opens on the dossier: the stage on the spine, What Jambo read, Still owed', gl && /^What Jambo read \| Still owed · \d+/.test(g.title) && g.pill, g.title);
    check('6b each count is the reading its own face uses', g.fillN === g.left && g.riskN === g.risks && num('share') === g.unsent && (num('sign') === 1) === g.nobody, g);
    check('6c reading it starts no negotiation', !g.nego);
    check('6d the card sits above the chips and the box', g.above);
    await shoot('6-glance');
    await page.click('#pd-glance [data-pd-ds-fill]');
    check('6e "Fill in" opens Fill in beside the paper', await waitFor(page, () => !!document.querySelector('#pd-fillface .pd-ff'), 6000));
    await page.evaluate(() => pdFillClose());
    await waitFor(page, () => !!document.getElementById('pd-glance'), 4000);
    /* a fresh upload has nobody named to sign: the row must be there to press (a missing row is reported, never skipped) */
    const signRow = await page.evaluate(() => !!document.querySelector('#pd-glance [data-pd-glance="sign"]'));
    if (signRow) await page.click('#pd-glance [data-pd-glance="sign"]');
    check('6f "Signing" opens Before you sign beside the paper', g.nobody && signRow && await waitFor(page, () => !!document.getElementById('pd-signface'), 6000), { nobody: g.nobody, signRow });
    if (signRow) await page.evaluate(() => { if (typeof pdSignClose === 'function') pdSignClose(); });
    /* the risks row says what the Redlines face draws */
    await page.evaluate(id => pdOpenOnHome(id, 'plain'), upId);
    await waitFor(page, () => !!document.getElementById('pd-glance'), 6000);
    const rkRow = await page.evaluate(() => { const r = document.querySelector('#pd-glance [data-pd-ds="risks"] b'); return r ? Number(r.textContent) : 0; });
    /* RE-POINTED AT THE INTEGRATION (19 Oct 2026; red on lane C2 alone): round
       9 as drawn leaves the Redlines face beside Home's paper with nothing
       under its piles, so the risks row's door is where the risks ARE listed —
       the clause editor's Risks tab, on the first open one — and its count is
       the row's number. Pressed, never called; a missing door is reported. */
    const rkPressed = await page.click('#pd-glance [data-pd-gl-risks]', { timeout: 3000 }).then(() => true).catch(() => false);
    await waitFor(page, () => !!document.getElementById('ce-tab-risks'), 8000);
    const rkFace = await page.evaluate(() => { const n = document.getElementById('ce-rk-n'); const tab = document.getElementById('ce-tab-risks');
      return { tab: !!tab, n: n && n.style.display !== 'none' ? Number(n.textContent || 0) : 0 }; });
    check('6g the risk count on the glance is the count its door lists (the clause editor\'s Risks tab)', rkPressed && rkFace.tab && rkRow > 0 && rkRow === rkFace.n, { pressed: rkPressed, glance: rkRow, editor: rkFace });
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
