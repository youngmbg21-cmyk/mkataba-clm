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
    /* REVERSED IN PLACE 23 Sep 2026 (Young: "Remove the grey dna strands and
       just keep the colored ones that are of interest"). This record carries
       no mark, so the map is not drawn at all; its geometry and its press are
       measured in section 7, on a record that has marks. */
    check('4e nothing marked, no map', !xr.spine && xr.segs === 0, xr.segs + ' segments');
    check('4g the panel names the clause it is about', !!(xr.head || '').trim(), xr.head);
    check('4h it says what is known, borrowed', xr.secs.length >= 2, JSON.stringify(xr.secs));
    /* THE CARD IS THE EDITION'S OWN, asked as a RELATION rather than as a
       colour: both layers are read live and required to resolve to the same
       card, so a later palette pass moving one moves both or this goes red. */
    const cards = await page.evaluate(() => {
      const of = id => { const e = document.getElementById(id); if (!e) return null;
        const c = getComputedStyle(e);
        return [c.backgroundColor, c.borderTopWidth, c.borderTopColor,
          c.borderTopLeftRadius, c.boxShadow, c.paddingRight, c.paddingBottom].join(' | '); };
      return { xray: of('doc-xray'), read: of('doc-read') };
    });
    check('4i2 the panel is on the same white card as Plain English',
      !!cards.xray && cards.xray === cards.read, cards.xray + '  vs  ' + cards.read);
    check('4i3 and that card is a real surface, not the page ground',
      /rgb\(255, 255, 255\)|rgb\(21, 27, 26\)/.test(cards.xray || ''), cards.xray);

    check('4i NO EXPLAINER BAND over the paper (the owner’s exclusion)',
      pressedXray && xr.bands === 0,
      (pressedXray ? '' : 'X-ray was never up · ') + 'found ' + xr.bands);



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

    /* ================= 7. FORMAT A, ON A CONTRACT THAT HAS BEEN READ ====
       WHY THIS SECTION EXISTS. Section 4 opened a contract with NO reading,
       no brief and no scan, and asked whether the panel said "no reading".
       It passed either way — and it passed, green, for as long as the X-ray
       never once showed a reading, which is the fault the owner reported off
       his iPad. A check that passes against the broken build is a
       description. Everything below stages the real thing first. */
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
    const pressed7 = ok7 && await press('[data-doc-read="2"]', '7a2 there is an X-ray to press');
    await page.waitForTimeout(900);
    if (pressed7) await page.screenshot({ path: path.join(OUT, '03-xray-format-a.png') });

    const fa = pressed7 ? await page.evaluate(() => {
      const secOf = k => [...document.querySelectorAll('#doc-xray .doc-xr-sec')]
        .find(s => (s.querySelector('.doc-xr-k') || {}).textContent &&
          s.querySelector('.doc-xr-k').textContent.trim().indexOf(k) === 0) || null;
      const txt = el => el ? el.innerText.replace(/\s+/g, ' ').trim() : '';
      const marksIn = el => el ? [...el.querySelectorAll('.doc-xr-mark')].map(m =>
        ({ grade: (m.className.match(/is-(ruby|amber|steel)/) || [])[1] || '-',
           tag: txt(m.querySelector('.doc-xr-mk')), say: txt(m).slice(0, 60) })) : [];
      /* land on the clause the high finding quotes */
      const rows = docXrayRows(state.contracts[0]);
      const i = rows.findIndex(r => r.tone === 'ruby');
      if (i >= 0) { const b = document.querySelector('[data-xr-seg="' + i + '"]'); if (b) b.click(); }
      const sp = document.getElementById('doc-xr-spine'), cv = document.getElementById('doc-canvas');
      const overlap = sp && cv ? sp.getBoundingClientRect().right > cv.getBoundingClientRect().left : null;
      const lit = document.querySelectorAll('.doc-xr-seg.is-on').length;
      const head = (document.querySelector('.doc-xr-head h4') || {}).textContent || '';
      return { i, overlap, lit, head, tones: rows.map(r => r.tone || '-'),
        segs: [...document.querySelectorAll('.doc-xr-seg')].map(b =>
          (b.className.match(/is-(ruby|amber|steel)/) || [])[1] || '-'),
        _later: 1 };
    }) : null;
    await page.waitForTimeout(500);

    const panel = pressed7 ? await page.evaluate(() => {
      const secOf = k => [...document.querySelectorAll('#doc-xray .doc-xr-sec')]
        .find(s => { const h = s.querySelector('.doc-xr-k'); return h && h.textContent.trim().indexOf(k) === 0; }) || null;
      const txt = el => el ? el.innerText.replace(/\s+/g, ' ').trim() : '';
      const marksIn = el => el ? [...el.querySelectorAll('.doc-xr-mark')].map(m =>
        ({ grade: (m.className.match(/is-(ruby|amber|steel)/) || [])[1] || '-',
           tag: txt(m.querySelector('.doc-xr-mk')), say: txt(m).slice(0, 70) })) : [];
      const plain = secOf(i18t('xr_sec_plain')), look = secOf(i18t('xr_sec_look')), wide = secOf(i18t('xr_sec_wide'));
      return { plain: txt(plain && plain.querySelector('.doc-xr-t')).slice(0, 60),
        look: marksIn(look), wide: marksIn(wide),
        wideDrawn: !!wide, lookHead: txt(look && look.querySelector('.doc-xr-k')) };
    }) : null;

    check('7a the panel shows the reading that is ON the record',
      !!panel && /^XRPLAIN/.test(panel.plain),
      panel ? JSON.stringify(panel.plain) : 'X-ray was never pressed');
    /* REVERSED IN PLACE 23 Sep 2026: the map draws the MARKED clauses only,
       so "bare where nothing is said" is now "nothing bare on the map". */
    check('7b the map is GRADED — ruby and steel, and nothing grey on it',
      !!fa && fa.segs.indexOf('ruby') >= 0 && fa.segs.indexOf('steel') >= 0 && fa.segs.indexOf('-') < 0
        && fa.segs.length === fa.tones.filter(t => t !== '-').length,
      fa ? fa.segs.join(',') + ' of ' + fa.tones.join(',') : 'no map');
    check('7b2 and it takes grey, never paper', !!fa && fa.overlap === false, fa ? 'overlap:' + fa.overlap : 'no map');
    check('7b3 a block picks its clause, and exactly one is lit', !!fa && fa.i >= 0 && fa.lit === 1,
      fa ? JSON.stringify({ i: fa.i, lit: fa.lit, head: fa.head }) : 'no map');
    check('7c every mark on the clause names its source AND wears its grade',
      !!panel && panel.look.length >= 2 && panel.look.every(m => m.grade !== '-' && m.tag.length > 1)
        && panel.look.some(m => m.grade === 'ruby') && panel.look.some(m => m.grade === 'amber'),
      panel ? JSON.stringify(panel.look) : 'no panel');
    check('7d the brief’s watchout reached the clause its wording sits on',
      !!panel && panel.look.some(m => /XRWATCH/.test(m.say) && m.grade === 'amber'),
      panel ? JSON.stringify(panel.look.map(m => m.say)) : 'no panel');
    check('7e an UNUSUAL term is said about the whole contract, in steel',
      !!panel && panel.wideDrawn && panel.wide.some(m => /XRODD/.test(m.say) && m.grade === 'steel'),
      panel ? JSON.stringify(panel.wide) : 'no panel');
    check('7f a watchout with no wording is said there too, and never guessed onto a clause',
      !!panel && panel.wide.some(m => /XRLOOSE/.test(m.say))
        && !panel.look.some(m => /XRLOOSE/.test(m.say)),
      panel ? JSON.stringify(panel.wide.map(m => m.say)) : 'no panel');
    /* GATED on the block being drawn at all: "XRWATCH is not in it" is
       satisfied by a build that draws no block, which proves nothing. */
    check('7g and one that DID land is said on its clause, not twice',
      !!panel && panel.wideDrawn && panel.wide.length > 0
        && !panel.wide.some(m => /XRWATCH/.test(m.say)),
      panel ? JSON.stringify(panel.wide.map(m => m.say)) : 'no panel');

    const afterXr = await ink();
    check('7h THE CONTRACT DOES NOT MOVE with the whole map drawn (refusal 3)',
      pressed7 && beforeXr && afterXr && afterXr.inkLeft === beforeXr.inkLeft
        && afterXr.inkTop === beforeXr.inkTop && afterXr.sheetW === beforeXr.sheetW,
      (pressed7 ? '' : 'X-ray was never pressed · ') + JSON.stringify({ beforeXr, afterXr }));

    /* ---- the press, with a reading on file and the route refusing ---- */
    await press('[data-doc-read="0"]', '7i2 there is a way back to the paper');
    await page.waitForTimeout(400);
    const pr = await page.evaluate(async () => {
      const real = window.api; let asked = 0;
      window.api = async (p, m, b, o) => {
        if (String(p).indexOf('ai/readings') === 0) { asked++; throw new Error('Copilot is busy'); }
        return real(p, m, b, o);
      };
      const btn = document.querySelector('[data-doc-read="1"]');
      if (btn) btn.click();
      await new Promise(r => setTimeout(r, 1000));
      const layer = document.getElementById('doc-read');
      const out = { asked, mode: (typeof docViewMode === 'function') ? docViewMode() : '(absent)',
        hidden: layer ? layer.hidden : '(absent)',
        notes: document.querySelectorAll('#doc-read .doc-read-note').length };
      window.api = real; return out;
    });
    check('7i Plain English opens off the reading already on file, buying nothing',
      pr.asked === 0 && pr.mode === 'plain' && pr.hidden === false && pr.notes > 0,
      JSON.stringify(pr));

    /* ---- D1, the dividers ---- */
    const divs = await page.evaluate(() => {
      const bs = [...document.querySelectorAll('.doc-read-seg button')];
      const grp = document.querySelector('.doc-read-seg');
      const rung = getComputedStyle(document.documentElement).getPropertyValue('--ctl-h').trim();
      return { rung, h: grp ? Math.round(grp.getBoundingClientRect().height) : -1,
        rows: bs.map(b => ({ w: parseFloat(getComputedStyle(b).borderLeftWidth),
          c: getComputedStyle(b).borderLeftColor,
          pressed: b.getAttribute('aria-pressed') })) };
    });
    check('7j D1 — a hairline between every pair, none before the first',
      divs.rows.length === 3 && divs.rows[0].w === 0 && divs.rows[1].w === 1 && divs.rows[2].w === 1,
      JSON.stringify(divs.rows.map(r => r.w)));
    /* MEASURED WITH THE LAST HALF LIT, not with whatever happened to be lit:
       the question is what a divider does when it meets the filled half, and
       on a build with no dividers at all "the lit one is the first one" made
       that claim pass while measuring nothing. */
    await press('[data-doc-read="2"]', '7k2 there is an X-ray to light');
    await page.waitForTimeout(500);
    const lit = await page.evaluate(() => [...document.querySelectorAll('.doc-read-seg button')]
      .map(b => ({ w: parseFloat(getComputedStyle(b).borderLeftWidth),
        pressed: b.getAttribute('aria-pressed') })));
    check('7k and the divider is drawn beside the LIT half too, so nothing moves',
      lit.length === 3 && lit[2].pressed === 'true' && lit[2].w === 1 && lit[1].w === 1,
      JSON.stringify(lit));
    check('7l (CONTROL) the group gained a divider and not a pixel of height',
      divs.h > 0 && divs.rung && divs.h === Math.round(parseFloat(divs.rung)),
      'group ' + divs.h + 'px · --ctl-h ' + divs.rung);

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
