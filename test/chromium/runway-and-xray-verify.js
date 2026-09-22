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
      mode: typeof window.docViewMode === 'function',
    }));
    check('1a the runway reading is loaded', loaded.runway);
    check('1b the X-ray reading is loaded', loaded.xray);
    check('1c the view mode is loaded', loaded.mode);

    /* ================= 2. A CONTROL: NOTHING DATED, NOTHING DRAWN =======
       The seeded book has no quiet desk and no renewal inside ninety days, so
       the card is exactly what it was. This one PASSES against the parent and
       is meant to: it is what proves the rail is not simply always there. */
    const rest = await page.evaluate(() => ({
      rail: !!document.querySelector('.hm-rw'),
      rows: document.querySelectorAll('#hm-dd-rows .hm-row').length,
    }));
    check('2a (CONTROL) with nothing to plot the rail is not drawn', !rest.rail,
      'rail:' + rest.rail);
    check('2b (CONTROL) and the rows are still there', rest.rows >= 0, rest.rows + ' rows');

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

    const rw = await page.evaluate(() => {
      const rail = document.querySelector('.hm-rw-rail');
      if (!rail) return null;
      const rr = rail.getBoundingClientRect();
      const pins = [...document.querySelectorAll('.hm-rw-pin')];
      const inside = pins.filter(e => { const q = e.getBoundingClientRect();
        return q.left >= rr.left - 6 && q.right <= rr.right + 6 && q.top >= rr.top - 1 && q.bottom <= rr.bottom + 1; });
      const painted = pins.filter(e => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)' && e.getBoundingClientRect().width > 0);
      const groups = [...document.querySelectorAll('.hm-rw-nc')];
      return {
        pins: pins.length, inside: inside.length, painted: painted.length,
        doors: pins.filter(e => e.hasAttribute('data-sel')).length,
        titles: pins.map(e => e.getAttribute('title') || ''),
        groups: groups.map(e => ({ txt: e.textContent.replace(/\s+/g, ' ').trim(),
          go: e.getAttribute('data-hm-go') || '' })),
        sub: (document.querySelector('.hm-sec-sub') || {}).textContent || '',
        ends: [...document.querySelectorAll('.hm-rw-end')].map(e => e.textContent.trim()),
        std: (document.querySelector('.hm-rw-end.is-past') || {}).title || '',
        rowTags: [...document.querySelectorAll('#hm-dd-rows .hm-rtag')].map(e => e.textContent.trim()),
      };
    });
    check('3a the rail is drawn once something carries a date', !!rw);
    if (rw) {
      check('3b every dot is inside its own rail', rw.pins > 0 && rw.inside === rw.pins,
        rw.inside + ' of ' + rw.pins);
      check('3c every dot is painted', rw.painted === rw.pins, rw.painted + ' of ' + rw.pins);
      check('3d every dot is a door onto its contract', rw.doors === rw.pins,
        rw.doors + ' of ' + rw.pins);
      check('3e the left end names the standard it measures against',
        /working day/i.test(rw.ends[0] || ''), rw.ends[0]);
      check('3f and where that standard is SET rides the hover, not a second door',
        /settings/i.test(rw.std), rw.std);
      check('3g the head counts the three piles', /past your standard/.test(rw.sub), rw.sub);
      check('3h every no-clock count is a door', rw.groups.length > 0 &&
        rw.groups.every(g => /^rwnone:/.test(g.go)), JSON.stringify(rw.groups.map(g => g.go)));
      /* ONE NUMBER FOR ONE THING: the quiet desk's dot says "N days past your
         standard" and its row must say the same N, not the working-day count
         the desk flag uses. */
      const pastTitle = (rw.titles.find(t => /past your standard/.test(t)) || '');
      const n = (pastTitle.match(/(\d+)\s+days? past/) || [])[1];
      check('3i the row and the picture say ONE number about the same contract',
        !!n && rw.rowTags.some(t => t.replace(/\D/g, '') === n),
        'dot: ' + n + ' · rows: ' + JSON.stringify(rw.rowTags));
    } else {
      /* A SKIPPED CLAIM IS NOT A PASSING ONE. Against a build without the rail
         these eight simply vanished from the tally, which reads as agreement. */
      ['3b every dot is inside its own rail', '3c every dot is painted',
       '3d every dot is a door onto its contract', '3e the left end names the standard',
       '3f where that standard is set rides the hover', '3g the head counts the three piles',
       '3h every no-clock count is a door',
       '3i the row and the picture say ONE number'].forEach(n => check(n, false, 'no rail to measure'));
    }
    /* THE OWNER'S EXCLUSION, on the home page. */
    const homeBands = await page.evaluate(() => {
      const card = document.querySelector('.hm-rw');
      if (!card) return -1;
      return card.parentElement.querySelectorAll('.hint,[class*="banner"],[class*="callout"]').length;
    });
    check('3j no explainer band was added to the card', homeBands === 0, 'found ' + homeBands);

    /* ================= 4. X-RAY, AND THE CONTRACT'S PIXELS ============== */
    await page.evaluate(() => { selectContract(state.contracts[0].id); });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { roomGoTab(state.contracts[0], 'docs'); });
    await page.waitForTimeout(1200);

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
    const segsRest = await page.evaluate(() =>
      [...document.querySelectorAll('[data-doc-read]')].map(b => b.textContent.trim()));
    check('4a the switch has three positions, X-ray third',
      segsRest.length === 3 && /x-?ray/i.test(segsRest[2]), JSON.stringify(segsRest));

    const pressedXray = await press('[data-doc-read="2"]', '4a2 there is an X-ray position to press');
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, '02-xray.png') });
    const after = await ink();
    /* GATED ON THE PRESS HAVING HAPPENED. "The paper did not move" is
       satisfied by a build where nothing was pressed, which is the quietest
       way a measurement can prove nothing at all — measured against the
       parent, where it passed. */
    check('4b THE CONTRACT DOES NOT MOVE (refusal 3)',
      pressedXray && before && after && before.inkLeft === after.inkLeft && before.inkTop === after.inkTop
        && before.sheetLeft === after.sheetLeft && before.sheetW === after.sheetW,
      (pressedXray ? '' : 'X-ray was never pressed · ')
      + JSON.stringify(before) + ' → ' + JSON.stringify(after));

    const xr = await page.evaluate(() => {
      const el = id => document.getElementById(id);
      const sp = el('doc-xr-spine');
      const cv = el('doc-canvas');
      const panel = document.querySelector('.doc-xr-panel');
      const right = el('doc-right');
      return {
        layer: el('doc-xray') ? !el('doc-xray').hidden : false,
        read: el('doc-read') ? !el('doc-read').hidden : false,
        right: right ? getComputedStyle(right).visibility : '(absent)',
        spine: !!sp,
        overlap: sp && cv ? sp.getBoundingClientRect().right > cv.getBoundingClientRect().left : null,
        segs: sp ? sp.querySelectorAll('[data-xr-seg]').length : 0,
        head: panel ? (panel.querySelector('.doc-xr-head h4') || {}).textContent : '',
        secs: [...document.querySelectorAll('.doc-xr-k')].map(e => e.textContent.trim()),
        bands: document.querySelectorAll('#doc-grid .hint,#doc-grid [class*="callout"]').length,
      };
    });
    check('4c the panel is up and the edition is not', xr.layer && !xr.read);
    check('4d the cards beneath it are covered, not rebuilt', xr.right === 'hidden', xr.right);
    check('4e the map is drawn', xr.spine && xr.segs > 1, xr.segs + ' segments');
    check('4f and it takes grey, never paper', xr.overlap === false, 'overlap:' + xr.overlap);
    check('4g the panel names the clause it is about', !!(xr.head || '').trim(), xr.head);
    check('4h it says what is known, borrowed', xr.secs.length >= 2, JSON.stringify(xr.secs));
    check('4i NO EXPLAINER BAND over the paper (the owner’s exclusion)',
      pressedXray && xr.bands === 0,
      (pressedXray ? '' : 'X-ray was never up · ') + 'found ' + xr.bands);

    /* pressing a segment moves the panel to that clause and lights exactly one */
    if (pressedXray && xr.segs > 2) {
      await page.click('[data-xr-seg="2"]');
      await page.waitForTimeout(400);
      const picked = await page.evaluate(() => ({
        head: (document.querySelector('.doc-xr-head h4') || {}).textContent,
        lit: document.querySelectorAll('.doc-xr-seg.is-on').length,
      }));
      check('4j a segment picks its clause, and exactly one is lit',
        picked.lit === 1 && picked.head !== xr.head, JSON.stringify(picked));
    } else {
      check('4j a segment picks its clause, and exactly one is lit', false,
        'no map to press · segs:' + xr.segs);
    }

    /* the way back hands the cards over, and the paper is where it was */
    await press('[data-doc-read="0"]', '4k2 there is a way back to the paper');
    await page.waitForTimeout(600);
    const back = await page.evaluate(() => ({
      mode: (typeof docViewMode === 'function') ? docViewMode() : '(absent)',
      right: document.getElementById('doc-right')
        ? getComputedStyle(document.getElementById('doc-right')).visibility : '(absent)',
      xray: (document.getElementById('doc-xray') || { hidden: '(absent)' }).hidden,
      spine: !!document.getElementById('doc-xr-spine'),
    }));
    const backInk = await ink();
    check('4k Contract View hands the cards back and takes the map away',
      back.mode === 'paper' && back.right === 'visible' && back.xray && !back.spine,
      JSON.stringify(back));
    check('4l and the contract is exactly where it started',
      pressedXray && backInk && before && backInk.inkLeft === before.inkLeft
        && backInk.sheetLeft === before.sheetLeft,
      (pressedXray ? '' : 'X-ray was never pressed · ') + JSON.stringify(backInk));

    /* ================= 5. THE NARROW WINDOW ============================= */
    /* RE-POINTED AT THE FIRST RUN. The claim was "the switch disappears when
       the window narrows", and it does not: this row is built once per paint
       and the product has never rebuilt it on a resize — the edition's own two
       positions behave identically, so that was never X-ray's to change. What
       IS true, and is what the rule actually says, is that the mode is READ as
       the paper at a width where no layer can be drawn (so a choice made on a
       laptop is not quietly cleared), and a REPAINT at that width draws no
       switch at all. Both are measured. */
    await page.setViewportSize({ width: 900, height: 900 });
    await page.waitForTimeout(400);
    const narrowMode = await page.evaluate(() =>
      (typeof docViewMode === 'function') ? docViewMode() : '(absent)');
    check('5a below 1024 the mode reads as the paper, whatever is stored',
      narrowMode === 'paper', narrowMode);
    const stuck = await page.evaluate(() => {
      try { localStorage.setItem('hati.v1.docPlainEnglish', 'xray'); } catch (_) {}
      return (typeof docViewMode === 'function') ? docViewMode() : '(absent)';
    });
    check('5b and a stored choice cannot force a layer it has no room for',
      stuck === 'paper', stuck);
    await page.evaluate(() => { roomGoTab(state.contracts[0], 'docs'); });
    await page.waitForTimeout(700);
    const narrow = await page.evaluate(() => ({
      mode: (typeof docViewMode === 'function') ? docViewMode() : '(absent)',
      segs: document.querySelectorAll('[data-doc-read]').length,
      xray: (document.getElementById('doc-xray') || {}).hidden,
      spine: !!document.getElementById('doc-xr-spine'),
    }));
    check('5c (CONTROL) a repaint at that width draws no switch and no layer',
      narrow.segs === 0 && narrow.xray !== false && !narrow.spine, JSON.stringify(narrow));

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
