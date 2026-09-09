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

    /* ============ 3 · THE CARD ON HOME ============ */
    await page.evaluate(() => setView('dashboard'));
    await pause(1200);
    await page.screenshot({ path: path.join(OUT, '02-home-card.png'), fullPage: true });
    const card = await page.evaluate(cid => {
      const el = document.querySelector(`[data-tri-row="${cid}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const vis = getComputedStyle(el);
      /* IS IT ACTUALLY ON SCREEN, or merely in the markup? Ask the document
         what is painted at the card's own top-left corner. */
      const at = document.elementFromPoint(r.left + 6, r.top + 6);
      return { w: Math.round(r.width), h: Math.round(r.height),
        display: vis.display, edge: vis.borderLeftColor, edgeW: vis.borderLeftWidth,
        onTop: !!(at && el.contains(at)),
        tiles: el.querySelectorAll('div > div > div').length,
        acts: [...el.querySelectorAll('[data-tri-act]')].map(b => b.textContent.trim()),
        txt: el.textContent.replace(/\s+/g, ' ').trim() };
    }, id);
    check('3a · the card draws in the decisions list, as visible pixels',
      !!(card && card.w > 200 && card.h > 60 && card.onTop),
      card && { w: card.w, h: card.h, onTop: card.onTop });
    check('3b · it arrives OPEN, carrying what was found rather than a one-liner',
      !!(card && card.acts.length === 3), card && { acts: card.acts });
    check('3c · the three acts are the ones agreed — and no "change the route"',
      !!(card && !card.acts.some(a => /route/i.test(a))
         && card.acts.some(a => /redline/i.test(a))
         && card.acts.some(a => /brief/i.test(a))
         && card.acts.some(a => /decline/i.test(a))), card && card.acts);
    check('3d · the FILED tile reports the stream and the owner',
      !!(card && /Wanjiru Kamau/.test(card.txt)), card && card.txt.slice(0, 220));
    /* NO TILE REPORTS A NUMBER WITH NOTHING UNDER IT. Written against the
       wrong field the obligations tile printed its count and no words — a
       number the reader cannot act on — and every source check passed.
       WHAT THIS STAGE CAN AND CANNOT SAY, out loud: the scripted stand-in
       answers the three paid readings with nothing, so the counts here are
       zeroes. That is a real state and the one most worth drawing — a
       contract that arrived clean — and it means the tile CONTENT behind a
       non-zero count is proved in f273, against the product's own heuristic
       with real obligations in it. What is asked here is the relation that
       has to hold on any stage. */
    const tiles = await drive(cid => {
      const c = state.contracts.find(x => x.id === cid);
      return (typeof triageTiles === 'function' ? triageTiles(c) : [])
        .map(t => ({ key: t.key, count: t.count, detail: t.detail || '' }));
    }, id, []);
    check('3d2 · no tile reports a number with nothing under it',
      tiles.length === 4 && tiles.every(t => t.count == null || t.count === 0
        || (t.detail && t.detail.length > 2)),
      tiles.map(t => t.key + ':' + t.count));
    check('3e · and no tile claims to know who signs',
      !!(card && !/signing route/i.test(card.txt)), card && /signing/i.test(card.txt));

    /* IT LEADS THE LIST. A claim about DOCUMENT ORDER on a rendered page —
       nothing in the model can be asked this. */
    const order = await page.evaluate(cid => {
      const host = document.querySelector(`[data-tri-row="${cid}"]`);
      if (!host) return null;
      const list = host.parentElement;
      const kids = [...list.children];
      return { i: kids.indexOf(host), n: kids.length };
    }, id);
    check('3f · and it leads the list it shares with the approvals',
      !!(order && order.i === 0), order);

    /* ============ 4 · THE FOLD ============ */
    const folded = await page.evaluate(async cid => {
      const b = document.querySelector(`[data-tri-fold="${cid}"]`);
      if (!b) return null;
      b.click();
      await new Promise(r => setTimeout(r, 500));
      const el = document.querySelector(`[data-tri-row="${cid}"]`);
      return el ? { h: Math.round(el.getBoundingClientRect().height),
        acts: el.querySelectorAll('[data-tri-act]').length } : null;
    }, id);
    check('4a · the caret folds it to an ordinary row',
      !!(folded && folded.acts === 0 && folded.h < (card ? card.h : 999)),
      { before: card && card.h, after: folded && folded.h });
    const unfolded = await page.evaluate(async cid => {
      const b = document.querySelector(`[data-tri-fold="${cid}"]`);
      if (!b) return null;
      b.click();
      await new Promise(r => setTimeout(r, 500));
      const el = document.querySelector(`[data-tri-row="${cid}"]`);
      return el ? el.querySelectorAll('[data-tri-act]').length : null;
    }, id);
    check('4b · and opens it again', unfolded === 3, { acts: unfolded });
    const stillThere = await drive(cid =>
      !!triageOf((state.contracts.find(x => x.id === cid) || {})) &&
      !triageSeen(state.contracts.find(x => x.id === cid)), id, null);
    check('4c · folding is a posture — it acknowledges nothing',
      stillThere === true, { unseen: stillThere });

    /* ============ 5 · THE ACTS ============ */
    /* THE BRIEF DOOR, DRIVEN. It must acknowledge the card AND land on the
       contract — a press that does one without the other is half a journey. */
    const acted = await page.evaluate(async cid => {
      const b = document.querySelector(`[data-tri-act="brief:${cid}"]`);
      if (!b) return null;
      b.click();
      await new Promise(r => setTimeout(r, 900));
      const c = state.contracts.find(x => x.id === cid);
      return { seen: triageSeen(c), view: state.view, active: state.activeId };
    }, id);
    check('5a · pressing an act acknowledges the card',
      !!(acted && acted.seen), acted);
    check('5b · and lands on that contract',
      !!(acted && acted.active === id), acted && { view: acted.view, active: acted.active });
    await page.evaluate(() => setView('dashboard'));
    await pause(1000);
    const gone = await page.evaluate(cid => !document.querySelector(`[data-tri-row="${cid}"]`), id);
    check('5c · so the card clears and does not come back',
      gone === true, { gone });

    /* ============ 6 · A CONTRACT IT COULD NOT READ ============ */
    const badId = await drive(async () => {
      const c = { id: 'MK-413', name: 'Scanned lease', counterparty: 'Momo Beach',
        status: 'Under Review', source: 'upload', folder: 'proc', value: 0,
        valueType: 'none', template: null, fields: {}, metadata: {}, obligations: [],
        audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
        owner: { id: 'u1', name: 'Wanjiru Kamau' },
        upload: { name: 'Momo_Beach_lease_scan.pdf', extractedText: '' } };
      state.contracts.unshift(c);
      await triageRun(c);
      return c.id;
    }, undefined, 'MK-413');
    await page.evaluate(() => setView('dashboard'));
    await pause(1200);
    await page.screenshot({ path: path.join(OUT, '03-could-not-read.png'), fullPage: true });
    const bad = await page.evaluate(cid => {
      const el = document.querySelector(`[data-tri-row="${cid}"]`);
      if (!el) return null;
      const c = state.contracts.find(x => x.id === cid);
      return { edge: getComputedStyle(el).borderLeftColor,
        readAnything: triageReadAnything(c),
        txt: el.textContent.replace(/\s+/g, ' ').trim() };
    }, badId);
    check('6a · a contract nothing could be read from still gets a card',
      !!bad, bad && bad.txt.slice(0, 120));
    check('6b · and it says so rather than pretending it was checked',
      !!(bad && bad.readAnything === false && /Not read|Oläst/.test(bad.txt)),
      bad && { readAnything: bad.readAnything });
    check('6c · drawn amber, not the teal of one that arrived read',
      !!(bad && card && bad.edge !== card.edge),
      { could_not_read: bad && bad.edge, read: card && card.edge });
    /* AND THE HEADLINE AGREES WITH THE REST OF THE CARD. This is what found
       the fault: the tag said "Not read", the sub-line said no text came out
       of the file, and the TITLE — the one line set biggest — said "read and
       ready for you". Only a rendered card shows a card arguing with itself. */
    check('6d · and its headline does not claim it was read',
      !!(bad && !/read and ready|läst och klart/i.test(bad.txt)
         && /could not be read|gick inte att läsa/i.test(bad.txt)),
      bad && bad.txt.slice(0, 90));
    check('6e · while the one that WAS read still says so',
      !!(card && /read and ready|läst och klart/i.test(card.txt)),
      card && card.txt.slice(0, 90));

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
    check('8e · "Got it" puts it away and stamps the same seen the card reads',
      put.pressed === true && put.gone === true && put.seen === true, put);

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
