/* Chromium verification: THE RUNWAY, AND X-RAY
   ============================================================================
   Young, 22 September 2026: *"build the Runway into the home page and build
   the X-ray next to plain English"*, and *"you have explanations between the
   top card and the paper so please exclude that from the implementation."*

   WHY THIS IS A BROWSER FILE and not more claims in f363/f364. Everything that
   could be silently wrong here is a PIXEL:
     · "the rail is drawn where there is something to plot" is a measurement
       after a paint, and a dot outside its own rail is invisible in markup;
     · "the row and the picture say ONE number about the same contract" was
       measured wrong once already — 42 beside a dot the rail had put at 53;
     · THE CONTRACT DOES NOT MOVE is refusal 3, and it is the whole reason the
       map floats over the column's grey rather than sitting in the flow. It is
       measured INSIDE the document — the first ink's offset from the canvas —
       so a scroll can never be mistaken for a move;
     · "the map does not overlap the sheet" is two rectangles;
     · and the owner's exclusion is an ABSENCE on a painted page.

   Screenshots go to test/chromium/shots/runway-and-xray/.
   Run: node test/chromium/runway-and-xray-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'runway-and-xray');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });
    /* EVERY DRIVEN HALF IS GUARDED. Run against a build without the feature
       this file must REPORT each claim as failed, not die on the first click
       waiting thirty seconds for a control that is not there — which is what
       it did the first time it was pointed at the parent. */
    const has = async sel => (await page.locator(sel).count()) > 0;
    const press = async (sel, name) => {
      if (!await has(sel)) { check(name, false, 'no ' + sel + ' to press'); return false; }
      await page.click(sel); return true;
    };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3000);

    /* ================= 1. THE MODULE IS ON THE FLOOR ==================== */
    const loaded = await page.evaluate(() => ({
      runway: typeof window.rwSplit === 'function',
      xray: typeof window.docXrayRows === 'function',
      thread: typeof window.docThreadPaint === 'function' && typeof window.docViewMode !== 'function',
    }));
    check('1a the runway reading is loaded', loaded.runway);
    check('1b the X-ray reading is loaded', loaded.xray);
    check('1c the Thread is loaded, and the view mode is gone (5 Oct 2026)', loaded.thread);

    /* ================= 2. A CONTROL: NOTHING DATED, NOTHING DRAWN =======
       The seeded book has no quiet desk and no renewal inside ninety days, so
       the card is exactly what it was. This one PASSES against the parent and
       is meant to: it is what proves the rail is not simply always there. */
    const rest = await page.evaluate(() => ({
      rail: !!document.querySelector('.hm-rw'),
      /* RE-POINTED IN PLACE 24 Sep 2026: the rows lived on "Needs your
         decision", which LEFT HOME on the owner's word. What this CONTROL
         guards is that Home still draws its own card — the decisions card at
         the parent, the Map here — so it still passes on both. */
      /* and since 3 Oct 2026 the board's Your book (Young: Home is the board) */
      card: !!document.querySelector('#hb-book, #hm-map, #hm-dd-rows'),
    }));
    check('2a (CONTROL) with nothing to plot the rail is not drawn', !rest.rail,
      'rail:' + rest.rail);
    check('2b (CONTROL) and Home still draws its own card', rest.card, 'card:' + rest.card);

    /* ================= 3. STAGE DATED WORK, AND MEASURE THE RAIL ========
       Three renewals at known distances and a quiet desk whose oldest ask is
       sixty days old — the two kinds that carry a date, plus whatever the book
       already holds with none. */
    await page.evaluate(() => {
      const iso = n => { const d = new Date(); d.setDate(d.getDate() + n);
        const q = x => String(x).padStart(2, '0');
        return d.getFullYear() + '-' + q(d.getMonth() + 1) + '-' + q(d.getDate()); };
      const me = currentUser();
      const live = state.contracts.filter(c => c.status !== 'Declined' && !isArchived(c));
      [10, 35, 70].forEach((d, i) => { const c = live[i]; if (!c) return;
        c.metadata = c.metadata || {};
        c.metadata.expiryDate = iso(d); c.metadata.noticePeriodDays = 0; c.expiry = iso(d); });
      const q = live[3];
      if (q) { q.desk = { leadId: me.id, leadName: me.name };
        q.changes = [{ id: 'x1', clauseId: 'cl_1', authorSide: 'counterparty', status: 'pending',
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), summary: 's', type: 'modify' }]; }
      renderDashboard();
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '01-home-runway.png') });

    /* REVERSED IN PLACE 24 Sep 2026 (Young: "instead of needs your decision,
       delete it and replace with prepared for you", then "Build it"). The rail
       sat on that card and LEFT HOME with it; js/runway.js is kept whole, and
       f363 pins the reading. WHAT STOOD HERE measured the rail's pixels — dots
       inside their rail, painted, each a door, the standard named at the left
       end, three piles counted in the head, one number beside a dot — and
       every claim was right for the card it was written for.

       WHAT HAS TO HOLD NOW is that the DATED WORK the rail plotted is still on
       the page, where a reader can press it: each staged renewal counted in
       the month its term ends on the Map, that month a door, the ones inside
       ninety days in the window's own count, and the quiet desk a row in the
       bell — the one screen it moved to, since nothing else in the product
       said it. Measured on the page, never read off the source. */
    /* RE-POINTED IN PLACE 3 Oct 2026 (Young: Home is the board and the map):
       the Map's month columns left Home with the Map. The dated work is on
       the board now: every staged renewal inside ninety days is counted in
       Your book's "Ending in 90 days", that figure is a door, and its dig-in
       lists each one by name. */
    const rw = await page.evaluate(() => {
      const live = state.contracts.filter(c => c.status !== 'Declined' && !isArchived(c));
      const d = window.hbBookData ? hbBookData('all') : null;
      const renewals = live.slice(0, 3).map(c => {
        let w = null; try { w = renewalWindow(c); } catch (_) { w = null; }
        if (!w || !w.expiry || !d) return { id: c.id, inForce: !!(w && w.expiry) };
        return { id: c.id, inForce: true, days: w.expiresDays, counted: d.figs.ending.ids.includes(c.id) };
      });
      const q = live[3];
      const bell = (window.buildAlerts ? buildAlerts() : []).filter(a => a.kind === 'desk-quiet');
      const fig = document.querySelector('#hb-book .hb-fig-main[data-hb-dig="f:ending"]');
      return {
        rail: !!document.querySelector('.hm-rw, .hm-rw-rail'),
        map: !!d, renewals,
        door: !!fig && !fig.disabled,
        quiet: q ? bell.some(a => a.id === q.id) : null,
        quietSub: q ? ((bell.find(a => a.id === q.id) || {}).sub || '') : '',
      };
    });
    const ren = rw.renewals.filter(r => r.inForce && r.days <= 90);
    check('3a the rail left Home with its card — dated work staged, and no rail drawn',
      rw.map && !rw.rail, `board ${rw.map} · rail ${rw.rail}`);
    check('3b every staged renewal inside ninety days is counted in Your book\'s "Ending in 90 days"',
      ren.length > 0 && ren.every(r => r.counted), JSON.stringify(ren.map(r => [r.id, r.days, r.counted])));
    check('3c and that figure is a door', rw.door, 'door ' + rw.door);
    if (rw.door) await page.click('#hb-book .hb-fig-main[data-hb-dig="f:ending"]');
    await page.waitForTimeout(500);
    const listed = await page.evaluate(() => [...document.querySelectorAll('#hb-board .hb-dig [data-hb-dig^="c:"]')].map(e => e.getAttribute('data-hb-dig').slice(2)));
    check('3d its dig-in lists each one by name',
      ren.length > 0 && ren.every(r => listed.includes(r.id)), JSON.stringify({ want: ren.map(r => r.id), listed }));
    check('3e the quiet desk the rail plotted is a row in the bell now',
      rw.quiet === true, 'in the bell: ' + rw.quiet);
    check('3f and the row leads with how long it has sat, as the card\'s tag did',
      /^\d+ days?\b/.test(rw.quietSub), rw.quietSub || 'no sub-line');
    /* THE OWNER'S EXCLUSION, on the home page — asked of the card that is
       there now. */
    const homeBands = await page.evaluate(() => {
      const card = document.getElementById('hb-book');
      if (!card) return -1;
      return card.parentElement.querySelectorAll('.hint,[class*="banner"],[class*="callout"]').length;
    });
    check('3j no explainer band was added to the card', homeBands === 0, 'found ' + homeBands);

    /* ================= 4. THE THREAD, AND THE CONTRACT'S PIXELS ============== */
    /* RE-POINTED 5 Oct 2026 (the Thread). The three-position switch, the Plain
       English column and the X-ray panel became ONE card in the right column:
       every clause a row, the open row the clause at the line 24px below the
       paper's top, the reading in the paper's face, Worth a look and Who does
       what under it. What this section asked of the X-ray it asks of the
       Thread: the contract does not move, the cards beneath are not covered,
       nothing marked means nothing toned, the open row names its clause and
       says what is known, no explainer band. */
    await page.evaluate(() => { selectContract(state.contracts[0].id); });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { roomGoTab(state.contracts[0], 'docs'); });
    await page.waitForTimeout(1400);

    /* Measured INSIDE the document: the first ink's offset from the canvas,
       so scrolling can never read as the paper moving. */
    const ink = () => page.evaluate(() => {
      const cv = document.getElementById('doc-canvas'); if (!cv) return null;
      const w = document.createTreeWalker(cv, NodeFilter.SHOW_TEXT,
        { acceptNode: n => n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
      const n = w.nextNode(); if (!n) return null;
      const r = document.createRange(); r.selectNodeContents(n);
      const q = r.getBoundingClientRect(), cb = cv.getBoundingClientRect();
      const sc = document.getElementById('doc-scroll').getBoundingClientRect();
      return { inkLeft: +(q.left - cb.left).toFixed(1), inkTop: +(q.top - cb.top).toFixed(1),
        sheetLeft: +(cb.left - sc.left).toFixed(1), sheetW: Math.round(cb.width) };
    });
    const before = await ink();
    const segsRest = await page.evaluate(() => ({
      segs: document.querySelectorAll('[data-doc-read]').length,
      rows: document.querySelectorAll('#doc-thread .doc-th-row').length,
      sheet: (typeof docReadSheet === 'function') ? (docReadSheet(state.contracts[0]) || []).length : -1,
      up: !!document.getElementById('doc-thread') && !document.getElementById('doc-thread').hidden }));
    check('4a there is no switch; the Thread is up with one row per painted clause',
      segsRest.segs === 0 && segsRest.up && segsRest.rows > 0 && segsRest.rows === segsRest.sheet, JSON.stringify(segsRest));

    const pressedRow = await press('#doc-thread [data-th-go="1"]', '4a2 there is a second row to press');
    await page.waitForTimeout(1300);
    await page.screenshot({ path: path.join(OUT, '02-thread.png') });
    const after = await ink();
    /* GATED ON THE PRESS HAVING HAPPENED. "The paper did not move" is
       satisfied by a build where nothing was pressed, which is the quietest
       way a measurement can prove nothing at all. The paper SCROLLS on a
       press (that is the glide); its ink inside the canvas and its width do
       not move. */
    check('4b THE CONTRACT DOES NOT MOVE (refusal 3)',
      pressedRow && before && after && before.inkLeft === after.inkLeft && before.inkTop === after.inkTop
        && before.sheetLeft === after.sheetLeft && before.sheetW === after.sheetW,
      (pressedRow ? '' : 'no row was pressed · ')
      + JSON.stringify(before) + ' → ' + JSON.stringify(after));

    const xr = await page.evaluate(() => {
      const el = id => document.getElementById(id);
      const th = el('doc-thread');
      const open = th && th.querySelector('.doc-th-row.is-open');
      const right = el('doc-right');
      return {
        open: open ? Number(open.dataset.thRow) : -1,
        line: (typeof docThreadAtLine === 'function') ? docThreadAtLine() : -2,
        right: right ? getComputedStyle(right).visibility : '(absent)',
        toned: th ? th.querySelectorAll('.doc-th-row.is-ruby,.doc-th-row.is-amber,.doc-th-row.is-steel').length : -1,
        spine: !!el('doc-xr-spine'),
        head: open ? (open.querySelector('.doc-th-name') || {}).textContent : '',
        secs: open ? [...open.querySelectorAll('.doc-th-look, .doc-xr-sec.is-who')].map(e => e.className) : [],
        bands: document.querySelectorAll('#doc-grid .hint,#doc-grid [class*="callout"]').length,
      };
    });
    check('4c the pressed row is open, and it is the one at the line', pressedRow && xr.open === 1 && xr.line === 1, JSON.stringify({ open: xr.open, line: xr.line }));
    check('4d the cards beneath it are not covered — the Thread is a card among them', xr.right === 'visible', xr.right);
    /* REVERSED IN PLACE 23 Sep 2026 (Young: "Remove the grey dna strands and
       just keep the colored ones that are of interest"), and again here: this
       record carries no mark, so no row wears a tone, and no strand is drawn. */
    check('4e nothing marked, nothing toned, no strand', xr.toned === 0 && !xr.spine, xr.toned + ' toned');
    check('4g the open row names the clause it is about', !!(xr.head || '').trim(), xr.head);
    check('4h it says what is known, borrowed — Worth a look and Who does what', xr.secs.length >= 2, JSON.stringify(xr.secs));
    /* THE CARD IS A REAL SURFACE, asked live. */
    const cards = await page.evaluate(() => {
      const e = document.getElementById('doc-thread'); if (!e) return null;
      const c = getComputedStyle(e);
      return { bg: c.backgroundColor, radius: c.borderTopLeftRadius };
    });
    check('4i3 and that card is a real surface, not the page ground',
      !!cards && /rgb\(255, 255, 255\)|rgb\(21, 27, 26\)/.test(cards.bg), cards && cards.bg);

    check('4i NO EXPLAINER BAND over the paper (the owner’s exclusion)',
      pressedRow && xr.bands === 0,
      (pressedRow ? '' : 'nothing was pressed · ') + 'found ' + xr.bands);

    /* the reader's hand: scrolling the paper to the top opens the first row,
       and the paper is where it was */
    await page.evaluate(() => { document.getElementById('doc-scroll').scrollTop = 0; });
    await page.waitForTimeout(600);
    const back = await page.evaluate(() => ({
      open: Number((document.querySelector('#doc-thread .doc-th-row.is-open') || { dataset: {} }).dataset.thRow),
      right: document.getElementById('doc-right')
        ? getComputedStyle(document.getElementById('doc-right')).visibility : '(absent)',
    }));
    const backInk = await ink();
    check('4k a scroll back to the top opens the first row again',
      back.open === 0 && back.right === 'visible',
      JSON.stringify(back));
    check('4l and the contract is exactly where it started',
      pressedRow && backInk && before && backInk.inkLeft === before.inkLeft && backInk.inkTop === before.inkTop
        && backInk.sheetLeft === before.sheetLeft,
      (pressedRow ? '' : 'nothing was pressed · ') + JSON.stringify(backInk));

    /* ================= 5. THE NARROW WINDOW ============================= */
    /* The Thread is up where two working columns fit (1024); below that it
       stands down and the paper has the tab, and a repaint at that width
       draws no row at all. */
    await page.setViewportSize({ width: 900, height: 900 });
    await page.waitForTimeout(400);
    const narrowOn = await page.evaluate(() => (typeof docThreadOn === 'function') ? docThreadOn() : '(absent)');
    check('5a below 1024 the Thread reads itself as off', narrowOn === false, String(narrowOn));
    await page.evaluate(() => { roomGoTab(state.contracts[0], 'docs'); });
    await page.waitForTimeout(700);
    const narrow = await page.evaluate(() => ({
      hidden: (document.getElementById('doc-thread') || {}).hidden,
      rows: document.querySelectorAll('#doc-thread .doc-th-row').length,
      segs: document.querySelectorAll('[data-doc-read]').length,
    }));
    check('5c (CONTROL) a repaint at that width draws no row and no switch',
      narrow.hidden === true && narrow.rows === 0 && narrow.segs === 0, JSON.stringify(narrow));

    /* ================= 7. FORMAT A, ON A CONTRACT THAT HAS BEEN READ ====
       WHY THIS SECTION EXISTS. Section 4 opened a contract with NO reading,
       no brief and no scan. It passed either way — and it passed, green, for
       as long as the X-ray never once showed a reading, which is the fault
       the owner reported off his iPad. A check that passes against the
       broken build is a description. Everything below stages the real thing
       first. */
    await page.setViewportSize({ width: 1500, height: 950 });
    await page.waitForTimeout(300);
    await page.evaluate(() => { selectContract(state.contracts[0].id); });
    await page.waitForTimeout(1100);
    await page.evaluate(() => { roomGoTab(state.contracts[0], 'docs'); });
    await page.waitForTimeout(1100);

    /* A reading per painted row, a brief whose first watchout quotes real
       wording and whose second carries none, two unusual terms, and a high
       plus a low finding quoting two different clauses. */
    const staged = await page.evaluate(() => {
      const c = state.contracts[0];
      let sheet = [];
      try { sheet = docReadSheet(c) || []; } catch (_) { sheet = []; }
      if (sheet.length < 4) return { rows: sheet.length };
      c._readings = { at: '21 Sep 2026', over: 0,
        items: sheet.map((r, i) => ({ i, heading: r.heading, plain: 'XRPLAIN' + i + ' a reading of this clause.' })) };
      const long = sheet.filter(r => String(r.text || '').split(/\s+/).length > 12);
      const snip = r => String(r.text || '').split(/\s+/).slice(0, 8).join(' ');
      const q0 = long[0] ? snip(long[0]) : '', q1 = long[1] ? snip(long[1]) : '';
      c._brief = { at: '21 Sep 2026', data: { overview: 'x',
        watchouts: [{ point: 'XRWATCH this one rests on wording.', quote: q0 },
                    { point: 'XRLOOSE this one carries no wording at all.' }],
        unusual: ['XRODD a term unusual for this kind of contract.'] } };
      c.scan = { on: '2026-09-21', dismissed: [], findings: [
        { id: 'xf1', sev: 'high', kind: 'risk', title: 'XRHIGH', why: 'It could hurt you.', quote: q0 },
        { id: 'xf2', sev: 'low', kind: 'risk', title: 'XRLOW', why: 'Worth knowing.', quote: q1 }] };
      return { rows: sheet.length, q0: !!q0, q1: !!q1 };
    });
    const ok7 = staged.rows >= 4 && staged.q0 && staged.q1;
    if (!ok7) check('7 (stage) a contract with four painted clauses to read', false, JSON.stringify(staged));

    const beforeXr = await ink();
    /* THE REPAINT BUYS NOTHING: the readings are on the record, so painting
       the thread with them sends no request. */
    const pr = ok7 ? await page.evaluate(async () => {
      const real = window.api; let asked = 0;
      window.api = async (p, m, b, o) => {
        if (String(p).indexOf('ai/readings') === 0) { asked++; throw new Error('Copilot is busy'); }
        return real(p, m, b, o);
      };
      docThreadPaint(state.contracts[0]);
      await new Promise(r => setTimeout(r, 600));
      window.api = real;
      return { asked, read: document.querySelectorAll('#doc-thread .doc-th-state .is-read').length };
    }) : null;
    const fa = ok7 ? await page.evaluate(async () => {
      /* land on the clause the high finding quotes */
      const rows = docXrayRows(state.contracts[0]);
      const i = rows.findIndex(r => r.tone === 'ruby');
      if (i >= 0) { const b = document.querySelector('#doc-thread [data-th-go="' + i + '"]'); if (b) b.click(); }
      await new Promise(z => setTimeout(z, 1300));
      const th = document.getElementById('doc-thread'), cv = document.getElementById('doc-canvas');
      const overlap = th && cv ? th.getBoundingClientRect().left < cv.getBoundingClientRect().right : null;
      const lit = document.querySelectorAll('#doc-thread .doc-th-row.is-open').length;
      const open = document.querySelector('#doc-thread .doc-th-row.is-open');
      return { i, overlap, lit, head: open ? open.querySelector('.doc-th-name').textContent : '',
        got: open ? Number(open.dataset.thRow) : -1, line: docThreadAtLine(),
        tones: rows.map(r => r.tone || '-'),
        segs: [...document.querySelectorAll('#doc-thread .doc-th-row')].map(b =>
          (b.className.match(/is-(ruby|amber|steel)/) || [])[1] || '-') };
    }) : null;
    if (fa) await page.screenshot({ path: path.join(OUT, '03-thread-format-a.png') });

    const panel = fa ? await page.evaluate(() => {
      const open = document.querySelector('#doc-thread .doc-th-row.is-open');
      const txt = el => el ? el.innerText.replace(/\s+/g, ' ').trim() : '';
      const marksIn = el => el ? [...el.querySelectorAll('.doc-xr-mark')].map(m =>
        ({ grade: (m.className.match(/is-(ruby|amber|steel)/) || [])[1] || '-',
           tag: txt(m.querySelector('.doc-xr-mk')), say: txt(m).slice(0, 70) })) : [];
      const look = open && open.querySelector('.doc-th-look'), wide = open && open.querySelector('.doc-xr-sec.is-wide');
      const plain = open && open.querySelector('.doc-th-plain');
      return { plain: txt(plain).slice(0, 60), look: marksIn(look), wide: marksIn(wide), wideDrawn: !!wide,
        face: plain ? getComputedStyle(plain).fontFamily : '', paper: getComputedStyle(document.querySelector('#doc-canvas .doc-surface') || document.getElementById('doc-canvas')).fontFamily };
    }) : null;

    check('7a the open row shows the reading that is ON the record, in the paper\'s face',
      !!panel && /^XRPLAIN/.test(panel.plain) && !!panel.face && panel.face === panel.paper,
      panel ? JSON.stringify({ plain: panel.plain, face: panel.face.slice(0, 30), paper: panel.paper.slice(0, 30) }) : 'nothing staged');
    check('7b the rows are GRADED — ruby and steel where the record says so, and a tone on exactly the marked ones',
      !!fa && fa.segs.indexOf('ruby') >= 0 && fa.segs.indexOf('steel') >= 0
        && fa.segs.every((g, k) => g === fa.tones[k]),
      fa ? fa.segs.join(',') + ' of ' + fa.tones.join(',') : 'no thread');
    check('7b2 and the Thread takes the column, never the paper', !!fa && fa.overlap === false, fa ? 'overlap:' + fa.overlap : 'no thread');
    check('7b3 a press opens its row, exactly one, at the line', !!fa && fa.i >= 0 && fa.lit === 1 && fa.got === fa.i && fa.line === fa.i,
      fa ? JSON.stringify({ i: fa.i, got: fa.got, line: fa.line, lit: fa.lit, head: fa.head }) : 'no thread');
    check('7c every mark on the clause names its source AND wears its grade',
      !!panel && panel.look.length >= 2 && panel.look.every(m => m.grade !== '-' && m.tag.length > 1)
        && panel.look.some(m => m.grade === 'ruby') && panel.look.some(m => m.grade === 'amber'),
      panel ? JSON.stringify(panel.look) : 'no row');
    check('7d the brief’s watchout reached the clause its wording sits on',
      !!panel && panel.look.some(m => /XRWATCH/.test(m.say) && m.grade === 'amber'),
      panel ? JSON.stringify(panel.look.map(m => m.say)) : 'no row');
    /* REVERSED IN PLACE 25 Sep 2026 (Young: "this 'about contract x' portion
       should be excluded from the x-ray so there is only one red highlighted
       area which is the worth a look area"). What lands on no clause is never
       GUESSED onto one. */
    check('7e About this contract is not drawn, though the brief has an unusual term that lands nowhere',
      !!panel && !panel.wideDrawn && !panel.look.some(m => /XRODD/.test(m.say)),
      panel ? JSON.stringify({ wide: panel.wideDrawn, look: panel.look.map(m => m.say) }) : 'no row');
    check('7f a watchout with no wording is never guessed onto a clause',
      !!panel && !panel.look.some(m => /XRLOOSE/.test(m.say)),
      panel ? JSON.stringify(panel.look.map(m => m.say)) : 'no row');
    /* GATED on the clause's own list holding something: "not in a block" is
       satisfied by a build that draws nothing, which proves nothing. */
    check('7g and one that DID land is said on its clause, once',
      !!panel && panel.look.length > 0 && panel.look.filter(m => /XRWATCH/.test(m.say)).length === 1,
      panel ? JSON.stringify(panel.look.map(m => m.say)) : 'no row');

    const afterXr = await ink();
    check('7h THE CONTRACT DOES NOT MOVE with the whole thread drawn (refusal 3)',
      !!fa && beforeXr && afterXr && afterXr.inkLeft === beforeXr.inkLeft
        && afterXr.inkTop === beforeXr.inkTop && afterXr.sheetW === beforeXr.sheetW,
      (fa ? '' : 'nothing staged · ') + JSON.stringify({ beforeXr, afterXr }));
    check('7i the readings on file are shown without buying anything',
      !!pr && pr.asked === 0 && pr.read >= 4, JSON.stringify(pr));
    /* 7j–7l (the switch's dividers) RETIRED 5 Oct 2026 with the switch. */

    check('6a no page errors anywhere in the run', errors.length === 0,
      errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  if (bad.length) { console.log('FAILED:'); bad.forEach(b => console.log('  · ' + b.name + ' — ' + b.detail)); }
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
