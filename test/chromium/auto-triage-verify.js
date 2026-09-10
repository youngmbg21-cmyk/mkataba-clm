/* Chromium verification: AUTO-TRIAGE ON UPLOAD.
   ============================================================
   Owner-approved design, 9 Sep 2026, after four rulings and one correction —
   the card goes on Home in the list that already exists, and it carries what
   was found rather than a one-line summary of it.

   WHY A BROWSER FILE. f273 pins the reading, the record and the words. Every
   claim here is a MEASUREMENT or a PRESS, and four of them can be asked
   nowhere else:

     · the card must be VISIBLE PIXELS in the decisions list, not markup
       somewhere behind something — this product's own standing rule about a
       verb;
     · it must sit ABOVE the approvals and signing turns it shares that list
       with, which is a claim about document order on a rendered page;
     · the fold and the three acts are PRESSES — a handler that is attached is
       not a handler that lands;
     · and js/ai.js cannot be loaded in the node world at all, so the risk step
       and the brief only ever run for real HERE.

   Run: node test/chromium/auto-triage-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'auto-triage');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* A RECEIVED CONTRACT WITH SOMETHING IN IT TO FIND. Long enough to clear the
   120-character floor both readers apply, and carrying two plain obligations
   and a governing law that is not home — so the standards check and the
   obligation scan each have a real answer rather than an empty one. */
const TEXT =
  'This Supply Agreement is made between Acme Trading Ltd and Nordkust Industri AB. '
+ 'The Buyer shall pay each undisputed invoice within sixty (60) days of receipt. '
+ 'The Supplier shall submit a quarterly volume forecast within 10 days of each quarter end. '
+ 'The Supplier shall maintain product liability insurance throughout the term. '
+ 'This Agreement is governed by the laws of California and continues for 24 months. ';

const SEED = t => {
  const c = { id: 'MK-407', name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB',
    status: 'Under Review', source: 'upload', folder: 'proc', value: 78000000,
    valueType: 'estimated', template: null, fields: {}, metadata: {}, obligations: [],
    audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    owner: { id: 'u1', name: 'Wanjiru Kamau' },
    upload: { name: 'Supply_Agreement_v3.docx', extractedText: t } };
  state.contracts.unshift(c);
  return c.id;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  /* THE ONLY PLACE "IT IS NOT RUN TWICE" CAN BE ASKED. A source check sees the
     early return; only a real page can say whether pressing the row reaches the
     provider again. */
  let obligCalls = 0;
  page.on('request', r => { if (/\/api\/ai\/obligations/.test(r.url())) obligCalls++; });
  /* A BUILD WITHOUT THE FEATURE MUST REPORT, NEVER ABORT. Three of the driven
     halves below CALL the runner rather than merely look for its markup, so on
     a page that has never heard of it they throw and take every check after
     them with them — and a file that stops at check four proves nothing about
     the twenty-two it never reached. Run through here they hand back the
     fallback, each check FAILS and says so, and the blocked call is named once
     at the end. */
  const blocked = [];
  const drive = async (fn, arg, fallback) => {
    try { return arg === undefined ? await page.evaluate(fn) : await page.evaluate(fn, arg); }
    catch (e) { blocked.push(String(e && e.message || e).split('\n')[0]); return fallback; }
  };

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);

    /* ============ 0 · THE CONTROL — the machinery is on the page ============ */
    const have = await page.evaluate(() => ({
      run: typeof triageRun, cards: typeof triageCards, tiles: typeof triageTiles,
      scan: typeof runScan, brief: typeof runContractBrief,
    }));
    check('0a · the runner and the two readings the node world cannot load are here',
      have.run === 'function' && have.cards === 'function'
      && have.scan === 'function' && have.brief === 'function', have);

    /* ============ 1 · THE TICK-BOX ============ */
    /* DRIVEN THROUGH THE REAL FILE INPUT, because the row is only drawn once a
       document has been read — with no file there is nothing to offer. */
    await page.evaluate(() => { if (typeof openUploadModal === 'function') openUploadModal(); });
    await pause(700);
    const before = await page.evaluate(() => !!document.getElementById('up-triage'));
    check('1a · with no file chosen the row is not drawn — nothing to offer',
      before === false, { drawn: before });
    const buf = Buffer.from(TEXT, 'utf8');
    const fileInput = await page.$('#up-file');
    if (fileInput) await fileInput.setInputFiles({ name: 'Supply_Agreement_v3.txt',
      mimeType: 'text/plain', buffer: buf });
    await pause(2600);
    await page.screenshot({ path: path.join(OUT, '01-confirm.png'), fullPage: true });
    const box = await page.evaluate(() => {
      const el = document.getElementById('up-triage');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const lab = el.closest('label');
      return { checked: el.checked, w: Math.round(r.width), h: Math.round(r.height),
        txt: lab ? lab.textContent.replace(/\s+/g, ' ').trim() : '' };
    });
    check('1b · the tick-box is on the confirm screen, as visible pixels',
      !!(box && box.w > 6 && box.h > 6), box && { w: box.w, h: box.h });
    check('1c · and it is ticked, so the ordinary case is one press',
      !!(box && box.checked), box && { checked: box.checked });
    check('1d · the sentence names what it costs',
      !!(box && /Copilot calls/i.test(box.txt) && /three/i.test(box.txt)),
      box && box.txt.slice(0, 150));
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await pause(400);

    /* ============ 2 · THE RUN, FOR REAL ============ */
    /* No Copilot key on this server, so the brief and the standards check will
       refuse — which is the point of 2c: the run must still complete, the risk
       scan must still land, and NOTHING may be toasted. */
    const id = await page.evaluate(SEED, TEXT);
    const toastsBefore = await page.evaluate(() =>
      document.querySelectorAll('#toast-root > *').length);
    const ran = await drive(async cid => {
      const c = state.contracts.find(x => x.id === cid);
      await triageRun(c);
      const t = triageOf(c);
      return { steps: Object.fromEntries(Object.entries(t.steps).map(([k, v]) => [k, !!v.ok])),
        obligationsOnRecord: (c.obligations || []).length,
        held: ((t.steps.oblig && t.steps.oblig.found) || []).length,
        scanned: !!c.scan, seen: !!t.seenAt };
    }, id, { steps: {}, obligationsOnRecord: -1, held: -1, scanned: false, seen: null });
    check('2a · the run completes and every step records an answer',
      Object.keys(ran.steps).length === 4, ran.steps);
    check('2b · the free reading really ran — c.scan is on the record',
      ran.scanned === true, { scanned: ran.scanned });
    const toastsAfter = await page.evaluate(() =>
      document.querySelectorAll('#toast-root > *').length);
    check('2c · and a refusal raised NO toast — four red boxes for one upload is the fault',
      toastsAfter <= toastsBefore, { before: toastsBefore, after: toastsAfter });
    check('2d · nothing was acknowledged by running it',
      ran.seen === false, { seen: ran.seen });
    check('2e · and the page did not throw',
      errors.length === 0, errors.slice(0, 3));

    /* ============ 3 · IT IS OFF HOME ============ */
    /* REVERSED IN PLACE 9 Sep 2026 — owner-ruled: *"delete the 4 cards from the
       home page and simply land in the key terms page when you upload with the
       boxes attached."* Sections 3, 4, 5 and 6 measured that card: its pixels,
       its fold, its acts and its could-not-read state. NONE of those claims was
       wrong; their SUBJECT moved to the contract's own Key terms tab, and every
       one of them is re-pointed there in section 8 rather than deleted. What is
       left here is the reversal itself, which has to be measured on the page
       and not read off the source: a row can be absent from a list and still
       drawn by something else. */
    await page.evaluate(() => setView('dashboard'));
    await pause(1200);
    await page.screenshot({ path: path.join(OUT, '02-home-no-card.png'), fullPage: true });
    const onHome = await drive(cid => {
      const el = document.querySelector(`[data-tri-row="${cid}"]`);
      const anyRow = document.querySelectorAll('[data-tri-row]').length;
      const anyTile = document.querySelectorAll('.hm-tri-tile').length;
      const list = document.getElementById('hm-dd-rows');
      return { forThis: !!el, anyRow, anyTile,
        listStillDraws: !!(list && list.children.length >= 0) };
    }, id, { forThis: true, anyRow: 1, anyTile: 4 });
    check('3a · Home draws no triage row for a contract that was just read',
      onHome.forThis === false, onHome);
    check('3b · and none for any contract, so the four tiles live in one place',
      onHome.anyRow === 0 && onHome.anyTile === 0, onHome);
    check('3c · the decisions list it used to lead is still there',
      onHome.listStillDraws === true, onHome);

    /* ============ 7 · THE JOURNEY, FROM THE BUTTON ============ */
    /* THE GAP THAT LET A REAL DEFECT SHIP. Every other section here CALLS
       triageRun on a contract it seeded itself — which proves the reader
       works from a state nobody arrives in, and proves nothing about whether
       pressing "File contract" reaches it. Owner-reported: the box was ticked,
       the reading ran, and the brief came back "Contract not found" on every
       real upload, because persist() is debounced 400ms and the brief route
       looks the row up before it reads a word. Nothing in this file could see
       it. So this section starts where the reader starts. */
    await page.evaluate(() => { if (typeof openUploadModal === 'function') openUploadModal(); });
    await pause(700);
    const fi2 = await page.$('#up-file');
    if (fi2) await fi2.setInputFiles({ name: 'Received_From_Them.txt',
      mimeType: 'text/plain', buffer: Buffer.from(TEXT, 'utf8') });
    await pause(2600);
    const nBefore = await page.evaluate(() => state.contracts.length);
    const filed = await drive(() => {
      const b = [...document.querySelectorAll('button')]
        .find(x => /File contract|Arkivera avtal/i.test(x.textContent || ''));
      if (!b) return { pressed: false };
      b.click(); return { pressed: true };
    }, undefined, { pressed: false });
    check('7a · "File contract" is a real button on the confirm screen',
      filed.pressed === true, filed);
    await pause(1500);
    const madeIt = await drive(n => {
      const c = state.contracts[0];
      return { made: state.contracts.length > n, source: c && c.source,
        started: !!(c && (c.triage || c._triaging)) };
    }, nBefore, { made: false, started: false });
    check('7b · pressing it files the contract AND starts the reading',
      madeIt.made === true && madeIt.source === 'upload' && madeIt.started === true, madeIt);
    /* THE REPORTED FAULT ITSELF. Asserted as the exact refusal rather than as
       "the brief succeeded", so it stays true on a workspace with no Copilot
       key — there the brief refuses for its own honest reason, and THAT is a
       different answer from the record not being there at all. */
    await pause(13000);
    const readOk = await drive(() => {
      const t = state.contracts[0] && state.contracts[0].triage;
      if (!t) return { ran: false };
      const why = k => (t.steps[k] && t.steps[k].why) || '';
      return { ran: true, brief: t.steps.brief && t.steps.brief.ok,
        notFound: Object.keys(t.steps).filter(k => /not found|finns inte/i.test(why(k))),
        whyBrief: why('brief').slice(0, 60) };
    }, undefined, { ran: false, notFound: ['(never ran)'] });
    check('7c · and no reading is refused because the record is not on the server yet',
      readOk.ran === true && readOk.notFound.length === 0, readOk);

    /* ============ 8 · WHAT HaTi READ, ON THE CONTRACT ============ */
    /* Owner-ruled 9 Sep 2026 off three drawn options. Section 7 has just filed
       a contract through the real button, so the reader is standing exactly
       where an upload leaves them. TWO CLAIMS ONLY A RENDERED PAGE CAN ANSWER:
       the strip is VISIBLE PIXELS above the Key terms card, and the Document
       tab keeps every one of its own — which is the six questions' one
       absolute refusal, and the reason this draws on Key terms alone. */
    /* PRESSED, NOT CALLED. roomGoTab takes the CONTRACT first and is not a
        global in the real app — it is a module function — so a call from here
        does nothing at all and every measurement after it reads a hidden pane.
        The tab button is what a reader presses and it is what this presses. */
    await drive(() => { const b = document.querySelector('#ws-tabs [data-ws-tab="terms"]');
      if (b) b.click(); });
    await pause(900);
    await page.screenshot({ path: path.join(OUT, '08-kt-strip.png'), fullPage: false });
    const strip = await drive(() => {
      const e = document.getElementById('kt-triage');
      if (!e) return { drawn: false };
      const r = e.getBoundingClientRect();
      const pane = document.querySelector('[data-ws-pane="terms"]');
      const kt = document.getElementById('kt-rows');
      const ktTop = kt ? kt.getBoundingClientRect().top : -1;
      return { drawn: true, w: Math.round(r.width), h: Math.round(r.height),
        top: Math.round(r.top), ktTop: Math.round(ktTop),
        inPane: !!(pane && pane.contains(e)),
        tiles: e.querySelectorAll('.kt-tri-tile').length,
        txt: e.textContent.replace(/\s+/g, ' ').trim().slice(0, 120) };
    }, undefined, { drawn: false });
    check('8a · the strip is visible pixels on the tab the upload lands on',
      strip.drawn === true && strip.w > 200 && strip.h > 30 && strip.inPane === true,
      strip);
    check('8b · above the Key terms card, not beside or under it',
      strip.drawn === true && strip.ktTop > strip.top,
      { strip: strip.top, keyTerms: strip.ktTop });
    check('8c · and it carries all four tiles, borrowed from the same reading',
      strip.tiles === 4, { tiles: strip.tiles, txt: strip.txt });
    /* THE REFUSAL, MEASURED. A strip above the tab content pushes what is under
       it down; on the Document tab that is the agreement, and the contract's
       pixels are the one thing the six questions refuse outright. */
    const doc = await drive(() => {
      const t = document.querySelector('#ws-tabs [data-ws-tab="docs"]');
      if (t) t.click();
      const pane = document.querySelector('[data-ws-pane~="docs"]');
      const e = document.getElementById('kt-triage');
      return { inDocPane: !!(pane && e && pane.contains(e)),
        visibleHere: !!(e && e.offsetParent && e.getBoundingClientRect().height > 0
          && pane && getComputedStyle(pane).display !== 'none'
          && pane.contains(e)) };
    }, undefined, { inDocPane: true, visibleHere: true });
    check('8d · and it never draws on the tab that shows the agreement',
      doc.inDocPane === false && doc.visibleHere === false, doc);
    await drive(() => { const b = document.querySelector('#ws-tabs [data-ws-tab="terms"]');
      if (b) b.click(); });
    await pause(700);
    /* RE-POINTED FROM THE HOME CARD, which sections 3-6 used to measure: the
       claims are the same and only the surface moved. */
    const detail = await drive(() => {
      const e = document.getElementById('kt-triage');
      if (!e) return null;
      const t = [...e.querySelectorAll('.kt-tri-tile')].map(x => ({
        head: (x.querySelector('.kt-tri-th') || {}).textContent || '',
        td: (x.querySelector('.kt-tri-td') || {}).textContent || '' }));
      return { t, acts: e.querySelectorAll('[data-tri-act]').length,
        txt: e.textContent.replace(/\s+/g, ' ') };
    }, undefined, null);
    check('8f · the FILED tile reports the stream and the owner',
      !!(detail && detail.t.some(x => /Filed|Arkiverat/.test(x.head) && x.td.includes('·'))),
      detail && detail.t.map(x => x.head.trim()));
    check('8g · and no tile claims to know who signs',
      !!(detail && !/signing route|signeringsordning/i.test(detail.txt)),
      detail && detail.txt.slice(0, 90));
    check('8h · it carries no acts — every one of Home\'s got you TO the contract',
      !!(detail && detail.acts === 0), detail && { acts: detail.acts });

    /* AN ACT, NOT A RENDER — and Home's own stamp, so putting it away here puts
       it away there. Driven, because a handler that is attached is not a
       handler that lands. */
    const put = await drive(() => {
      const b = document.getElementById('kt-tri-done');
      if (!b) return { pressed: false };
      b.click();
      return { pressed: true, gone: !document.getElementById('kt-triage'),
        seen: !!((state.contracts[0].triage || {}).seenAt) };
    }, undefined, { pressed: false });
    /* ============ 8l · THE READING IS OFFERED, NOT MADE AGAIN ============ */
    /* Owner-reported: the strip said "20 obligations found" and the Checks row
       beside it said "Run →", so pressing it paid for the same reading twice.
       The harness's provider proposes none, so the held list is seeded onto the
       step the run produced — what is measured is the OFFER, the press and the
       spend, none of which depend on who found them. */
    await drive(() => {
      const c = state.contracts[0];
      c.triage.steps.oblig = { ok: true, found: [
        { desc: 'Quarterly volume forecast', due: '2026-12-31' },
        { desc: 'Maintain product liability insurance' }] };
      const t = document.querySelector('#ws-tabs [data-ws-tab="docs"]');
      if (t) t.click();
    });
    await pause(900);
    await drive(() => renderChecksCard(state.contracts[0]));
    await pause(400);
    const rowLabel = () => drive(() => {
      const r = [...document.querySelectorAll('.check-row')]
        .find(x => /Obligation|Åtagand/i.test(x.textContent || ''));
      return r ? r.querySelector('.cg').textContent.replace(/\s+/g, ' ').trim() : '(no row)';
    }, undefined, '(blocked)');
    const rowBefore = await rowLabel();
    check('8l · the row says a reading is waiting, not "Run"',
      /proposed|föreslag/i.test(rowBefore), { row: rowBefore });
    const callsBefore = obligCalls;
    await drive(() => {
      const r = [...document.querySelectorAll('.check-row')]
        .find(x => /Obligation|Åtagand/i.test(x.textContent || ''));
      if (r) r.querySelector('.cg').click();
    });
    await pause(2500);
    const dlg = await drive(() => {
      const m = document.querySelector('#modal-root');
      return m ? m.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
    }, undefined, '');
    check('8m · pressing it opens the list to tick, not the panel',
      /Proposed obligations|Föreslagna/i.test(dlg), { dlg });
    check('8n · and it costs NOTHING — the reading is not made a second time',
      obligCalls - callsBefore === 0, { calls: obligCalls - callsBefore });
    const ticked = await drive(() => {
      document.querySelectorAll('[data-ob-pick]').forEach(cb => { cb.checked = true; });
      const add = document.getElementById('or-add');
      if (add) add.click();
      return true;
    }, undefined, false);
    await pause(1200);
    const settled = await drive(() => ({
      filed: (state.contracts[0].obligations || []).length,
      held: triageHeldObligations(state.contracts[0]).length }),
      undefined, { filed: 0, held: 9 });
    check('8o · ticking files them, and the offer empties itself',
      ticked === true && settled.filed === 2 && settled.held === 0, settled);

    /* ============ 8i · A CONTRACT IT COULD NOT READ ============ */
    /* Section 6's claims, on the surface that draws them now. */
    /* STAGED THROUGH THE REAL UPLOAD, not hand-built. A contract pushed onto
       state.contracts alone does not exist on the SERVER, so opening its room
       draws no panes at all — which is how this check first reported the strip
       missing when what was missing was the room. Section 6 could hand-build
       one because it only ever rendered a card on Home; a claim about the
       contract's own page cannot. A file of pure whitespace reads as no text,
       which is exactly the scanned-lease case. */
    await drive(() => { if (typeof openUploadModal === 'function') openUploadModal(); });
    await pause(700);
    const fi3 = await page.$('#up-file');
    if (fi3) await fi3.setInputFiles({ name: 'Momo_Beach_lease_scan.txt',
      mimeType: 'text/plain', buffer: Buffer.from('   \n  \n   ', 'utf8') });
    await pause(2600);
    await drive(() => {
      const b = [...document.querySelectorAll('button')]
        .find(x => /File contract|Arkivera avtal/i.test(x.textContent || ''));
      if (b) b.click();
    });
    await pause(4000);
    const badId = await drive(() => state.contracts[0] && state.contracts[0].id,
      undefined, null);
    await pause(1400);
    await drive(() => { const b = document.querySelector('#ws-tabs [data-ws-tab="terms"]');
      if (b) b.click(); });
    await pause(700);
    await page.screenshot({ path: path.join(OUT, '09-could-not-read.png'), fullPage: false });
    const bad = await drive(cid => {
      const e = document.getElementById('kt-triage');
      /* AN ABSENCE THAT REPORTS WHY. This came back a bare null three times
         running and each time the fault was the STAGING, not the strip — a
         contract that exists only in the browser draws no room at all. A probe
         that says "not drawn" and stops sends the next reader after the wrong
         thing. */
      if (!e) return { drawn:false, readAnything:null, bg:null,
        txt:'NOT DRAWN view=' + state.view + ' active=' + state.activeId
          + ' slot=' + !!document.getElementById('kt-triage-slot')
          + ' panes=' + [...document.querySelectorAll('[data-ws-pane]')].map(x=>x.getAttribute('data-ws-pane')).join('|')
          + ' ktrows=' + !!document.getElementById('kt-rows')
          + ' triage=' + !!(state.contracts.find(x=>x.id===cid)||{}).triage
          + ' seen=' + !!(((state.contracts.find(x=>x.id===cid)||{}).triage)||{}).seenAt };
      const c = state.contracts.find(x => x.id === cid);
      return { drawn: true, readAnything: triageReadAnything(c),
        bg: getComputedStyle(e).backgroundColor,
        txt: e.textContent.replace(/\s+/g, ' ').trim() };
    }, badId, null);
    check('8i · a contract nothing could be read from still gets the strip',
      !!bad, bad && bad.txt.slice(0, 110));
    check('8j · and it says so rather than pretending it was checked',
      !!(bad && bad.readAnything === false
         && /could not read|kunde inte läsa/i.test(bad.txt)), bad && bad.txt.slice(0, 90));
    check('8k · drawn apart from the one that arrived read',
      !!(bad && strip.drawn && bad.bg && bad.bg !== 'rgba(0, 0, 0, 0)'),
      bad && { could_not_read: bad.bg });

    check('8e · "Got it" puts it away and stamps the same seen the card reads',
      put.pressed === true && put.gone === true && put.seen === true, put);

    /* ============ 10 · THE STRIP AND THE CARD, READ TOGETHER ============ */
    /* Owner-reported 10 Sep 2026: "The Key terms strip and the Contract brief
       card contradict each other." One contract, two boxes, opposite answers.
       THIS IS THE ONE CLAIM ONLY A RENDERED PAGE CAN MAKE — "they agree" is a
       claim about two boxes, and only a page has both.

       THE RECORD IS STAGED, NOT RE-RUN, and that is the point rather than a
       shortcut: the reported note was written by the code of 9 Sep and today's
       code cannot produce it. So the shape is written onto the record and the
       page is re-opened, which is exactly what a reader who opens MK-379 gets.
       `_brief` is deleted because that is the state the note lies about: a note
       claiming a brief the record does not hold. (A cut-short brief IS kept
       since 10 Sep — f280 (7) proves that against a real server — so this is a
       note written by an older run, or one whose keep did not land. Either
       way, the tile may not believe it.) */
    const cid = await drive(() => state.activeId, undefined, null);
    const staged = await drive(id => {
      const c = state.contracts.find(x => x.id === id);
      if (!c) return { staged: false };
      c.triage = { at: new Date().toISOString(), by: 'Young', steps: {
        brief: { ok: true, line: 'This is a logistics contract between two parties.', cut: 'x' },
        risk: { ok: true, open: 0 },
        playbook: { ok: true, dev: 1, miss: 0, cats: ['Payment terms'] },
        oblig: { ok: true, found: [] } } };
      delete c._brief; delete c._hasBrief;
      if (window.openWorkspace) openWorkspace(c.id);
      return { staged: true };
    }, cid, { staged: false });
    await pause(900);
    await drive(() => { const b = document.querySelector('#ws-tabs [data-ws-tab="terms"]');
      if (b) b.click(); });
    await pause(600);
    await page.screenshot({ path: path.join(OUT, '10-strip-and-card.png'), fullPage: false });
    /* ONE PROBE, BOTH BOXES. Read apart they can each look right. */
    const both = await drive(() => {
      const e = document.getElementById('kt-triage');
      const card = document.getElementById('brief-card');
      const tile = e ? e.querySelectorAll('.kt-tri-tile')[0] : null;
      const t = x => (x ? x.textContent.replace(/\s+/g, ' ').trim() : '');
      return {
        stripDrawn: !!e, cardDrawn: !!card,
        head: t(tile && tile.querySelector('.kt-tri-th')),
        detail: t(tile && tile.querySelector('.kt-tri-td')),
        tone: tile ? tile.className : '',
        cardWrite: !!(card && card.querySelector('[data-kt-brief="run"]')),
        cardOpen: !!(card && card.querySelector('[data-kt-brief="open"]')),
        cardTxt: t(card) };
    }, undefined, null);
    check('10a · the reported state really is on screen — both boxes drawn',
      !!(both && both.stripDrawn && both.cardDrawn && staged.staged), both);
    check('10b · the strip no longer claims a brief the record does not hold',
      !!(both && /No brief|Ingen sammanfattning/.test(both.head)
         && !/Brief written|Sammanfattning skriven/.test(both.head)),
      both && { head: both.head, detail: both.detail });
    check('10c · and it prints no summary of a brief nobody can open',
      !!(both && !/logistics contract between/.test(both.detail)
         && !/cut short|klipptes/.test(both.detail)),
      both && both.detail);
    check('10d · the way forward is on it',
      !!(both && /None on file|Ingen finns sparad/.test(both.detail)),
      both && both.detail);
    check('10e · and the card beside it says the same thing',
      !!(both && both.cardWrite === true && both.cardOpen === false),
      both && { write: both.cardWrite, open: both.cardOpen });

    /* THE MIRROR, and it is what the reader gets NEXT: write the brief from the
       card and the tile turns green by itself — which it could never do while
       it read a note written once at upload. THE NOTE IS TODAY'S SHAPE HERE —
       a cut-short run records not-done with its reason — so the tile can only
       be green because there is a brief, and can only carry that line because
       it read the brief rather than the note. Staged, because the harness's
       provider writes no brief. */
    const after = await drive(id => {
      const c = state.contracts.find(x => x.id === id);
      if (!c) return null;
      c.triage.steps.brief = { ok: false,
        why: 'The answer was cut short, so it was not kept — write the brief again.' };
      c._brief = { at: new Date().toISOString(),
        data: { overview: 'A haulage contract for the northern route.' } };
      if (window.openWorkspace) openWorkspace(c.id);
      return { ok: true };
    }, cid, null);
    await pause(900);
    await drive(() => { const b = document.querySelector('#ws-tabs [data-ws-tab="terms"]');
      if (b) b.click(); });
    await pause(600);
    const both2 = await drive(() => {
      const e = document.getElementById('kt-triage');
      const card = document.getElementById('brief-card');
      const tile = e ? e.querySelectorAll('.kt-tri-tile')[0] : null;
      const t = x => (x ? x.textContent.replace(/\s+/g, ' ').trim() : '');
      return { head: t(tile && tile.querySelector('.kt-tri-th')),
        detail: t(tile && tile.querySelector('.kt-tri-td')),
        cardOpen: !!(card && card.querySelector('[data-kt-brief="open"]')) };
    }, undefined, null);
    check('10f · a brief written later turns the tile green by itself',
      !!(after && both2 && /Brief written|Sammanfattning skriven/.test(both2.head)),
      both2 && both2.head);
    check('10g · its line is the brief’s own',
      !!(both2 && /haulage contract/.test(both2.detail)), both2 && both2.detail);
    check('10h · and the note’s refusal is not printed over a brief that is there',
      !!(both2 && !/cut short|klipptes|again/i.test(both2.detail)), both2 && both2.detail);
    check('10i · and the card agrees, again',
      !!(both2 && both2.cardOpen === true), both2 && { open: both2.cardOpen });

    /* ============ 11 · A CUT-SHORT BRIEF IS KEPT, AND SAID TO BE PARTIAL ====
       (owner-reported 10 Sep 2026, two halves of one screen.)

       "The strip says No brief while the card beside it opens a complete
       brief" — the reader had pressed Write the brief after the upload's own
       run failed, it worked, and the strip never noticed. The tile has read
       the record live since 10 Sep, so it had the right answer the moment it
       was drawn; NOTHING WAS DRAWING IT. And: "the brief is written and
       readable; refresh and the card is back to Not written yet" — a cut-short
       answer was deliberately not kept.

       DRIVEN, BECAUSE "THEY AGREE" IS A CLAIM ABOUT TWO BOXES and only a
       rendered page has both — and because the fault is a REPAINT, which no
       source check can see. The provider is stood in for at the route, exactly
       as startScriptedAi stands in for it elsewhere: everything from the
       button's own handler inward is the product's. */
    const staged11 = await drive(id => {
      const c = state.contracts.find(x => x.id === id);
      if (!c) return null;
      /* The reported state: auto-triage ran at upload and the brief FAILED. */
      c.triage = { at: new Date().toISOString(), by: 'Young', steps: {
        brief: { ok: false, why: 'Copilot request failed: fetch failed' },
        risk: { ok: true, open: 0 },
        playbook: { ok: true, dev: 1, miss: 0, cats: ['Payment terms'] },
        oblig: { ok: true, found: [] } } };
      delete c._brief; delete c._hasBrief;
      delete (c.triage || {}).seenAt;
      state.aiConfigured = true;
      if (window.openWorkspace) openWorkspace(c.id);
      return { ok: true };
    }, cid, null);
    await pause(900);
    await drive(() => { const b = document.querySelector('#ws-tabs [data-ws-tab="terms"]');
      if (b) b.click(); });
    await pause(600);
    const read11 = () => drive(() => {
      const e = document.getElementById('kt-triage');
      const card = document.getElementById('brief-card');
      const tile = e ? e.querySelectorAll('.kt-tri-tile')[0] : null;
      const t = x => (x ? x.textContent.replace(/\s+/g, ' ').trim() : '');
      return { head: t(tile && tile.querySelector('.kt-tri-th')),
        detail: t(tile && tile.querySelector('.kt-tri-td')),
        cardTxt: t(card),
        cardWrite: !!(card && card.querySelector('[data-kt-brief="run"]')),
        cardOpen: !!(card && card.querySelector('[data-kt-brief="open"]')) };
    }, undefined, null);
    const before11 = await read11();
    check('11a · the reported starting state — no brief, on both boxes (control)',
      !!(staged11 && before11 && /No brief|Ingen sammanfattning/.test(before11.head)
         && before11.cardWrite === true && before11.cardOpen === false),
      before11 && { head: before11.head, write: before11.cardWrite });

    /* The provider, stood in for at the route. stopReason max_tokens is what a
       thorough brief really hits, and the flag is what the record now keeps. */
    await ctx.route('**/api/ai/brief', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ brief: { v: 1, at: new Date().toISOString(), by: 'Copilot',
        inputHash: 'h', truncated: true,
        data: { overview: 'A haulage contract for the northern route, running a year.',
          watchouts: [], unusual: [], term: {}, money: {} } },
        notice: 'The Copilot answer was longer than the space allowed.' }) }));
    await drive(() => { const b = document.querySelector('#brief-card [data-kt-brief="run"]');
      if (b) b.click(); });
    await pause(1400);
    await page.screenshot({ path: path.join(OUT, '11-partial-brief.png'), fullPage: false });
    const after11 = await read11();
    check('11b · the press really wrote one (control)',
      !!(after11 && after11.cardOpen === true), after11 && { open: after11.cardOpen });
    check('11c · THE REPORTED FAULT: the strip repaints with the card, no reload',
      !!(after11 && /Brief written|Sammanfattning skriven/.test(after11.head)),
      after11 && after11.head);
    check('11d · and it says the answer was cut short rather than serving half a memo whole',
      !!(after11 && /cut short|klipptes/i.test(after11.detail)),
      after11 && after11.detail);
    check('11e · the card beside it says it too, in the same breath',
      !!(after11 && /cut short|Part of this|klipptes|En del av/i.test(after11.cardTxt)),
      after11 && after11.cardTxt.slice(0, 120));
    check('11f · and the way forward is ON the card — write it again',
      !!(after11 && after11.cardWrite === true && after11.cardOpen === true),
      after11 && { write: after11.cardWrite, open: after11.cardOpen });
    await ctx.unroute('**/api/ai/brief');

    check('9 · and the whole journey raised no page error',
      errors.length === 0, errors.slice(0, 4));

  } catch (e) {
    check('RUN COMPLETED', false, String(e && e.message || e));
  } finally {
    await browser.close();
    await h.stop();
  }
  const pass = results.filter(r => r.pass).length;
  if (blocked.length)
    console.log(`\n(${blocked.length} driven call(s) could not run on this build: ${blocked[0]})`);
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
