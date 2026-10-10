/* Chromium verification: BODY FIRST, AND ANGLED NAMES (owner picked both by
   name, 10 Oct 2026, off the "Track and Chart Labels" proposals: "the
   highlighted trackers ... used to be a bit apart covering the page" ·
   "where the words are big and you cant fit them, try making them smaller
   and at an angle")
   ============================================================
   On a contract whose main body (30 clauses) is followed by four long
   schedules, with five body clauses flagged:
     1. Home's Paper: the rail spans the main body and the schedules fold
        into a short, named piece at the bottom; the flags spread down most
        of the rail (true to the page they sat in its top 40%); each sits at
        its clause's place IN THE BODY; no label overlaps another or the
        schedules' name
     2. the Document tab draws the same
     3. a contract with no schedules is drawn true to the page, unfolded
   On the Board, with twelve long party names:
     4. a heat grid's column names do not fit flat, so each is drawn
        smaller and slanted, whole (no "…"), inside the chart, none on
        another, none over the grid
     5. a stacked column chart's names likewise, under the axis
     6. short names (the stages) stay flat
     7. no page errors
   Waits ask for the state, bounded. Red at unmodified main (1, 2, 4, 5).
   Screenshots: test/chromium/shots/body-first-and-angled/.
   Run: node test/chromium/body-first-and-angled-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'body-first-and-angled');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

const PARA = k => `The Supplier shall perform the duties in clause ${k} with reasonable skill and care, in accordance with good industry practice and all applicable laws, and shall report to the Customer each month on its progress.`;
const SCHED = k => `<h2>SCHEDULE ${k} – PART ${k}</h2>` + Array.from({ length: 40 }, (_, j) => `<p>${j + 1}. The table in this schedule sets out item ${j + 1} of part ${k}, its unit price, its delivery window and the service level that applies to it.</p>`).join('');
const BODY = '<h1>MASTER SUPPLY AGREEMENT</h1>'
  + Array.from({ length: 30 }, (_, k) => `<h2>${k + 1}. Clause ${k + 1}</h2><p>${k + 1}.1\t${PARA(k + 1)}</p><p>${k + 1}.2\t${PARA(k + 1)}</p>`).join('')
  + [1, 2, 3, 4].map(SCHED).join('');
const FLAGGED = [3, 9, 16, 23, 29];
const LONG = ['Procurement & Raw Materials Ltd', 'Manufacturing & Operations Group', 'Warehousing & Distribution AB', 'Sales & Route-to-Market Partners',
  'Marketing & Brand Services', 'Franchise Partnerships International', 'Leasing & Real Estate Holdings', 'Mergers & Acquisitions Advisory',
  'Corporate & Compliance Office', 'Logistics & Transport Nordic', 'Hotel & Hospitality Group', 'Energy & Utilities Supply Co'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  await W.admin.json('/api/contracts/MK-BF', { method: 'PUT', body: { baseVersion: 0, contract: {
    id: 'MK-BF', name: 'Master Supply Agreement', counterparty: 'Nordic Supply AB', party: 'Highland Corporate Ltd', folder: 'proc', status: 'Under Review',
    fields: {}, comments: [], rounds: [], versions: [], signatures: [], compliance: {}, audit: [], obligations: [], format: 'rich', redlineText: BODY } } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 12000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-BF') && typeof pdOpenOnHome === 'function', null, { timeout: 20000 });

    /* flag five body clauses through the risk scan, on the paper named */
    const flag = (canvasId, flagged) => page.evaluate(({ canvasId, flagged }) => {
      const c = getContract('MK-BF'); const canvas = document.getElementById(canvasId);
      const rows = docXrayRows(c, canvas);
      const pick = flagged.map(n => rows.find(r => String(r.cite).replace(/\.$/, '') === n + '.2'));
      if (pick.some(x => !x)) return { err: 'clauses not found: ' + rows.slice(0, 8).map(r => r.cite).join(',') };
      c.scan = { findings: pick.map((r, k) => ({ id: 'bf' + k, sev: k % 2 ? 'medium' : 'high', title: 'Flag ' + k, why: 'Why ' + k,
        quote: String(r.row.text || '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 8).join(' ') })), dismissed: [] };
      return { n: pick.length };
    }, { canvasId, flagged });
    /* the rail read back: the fold, the marks' places, the labels' boxes */
    const readTrack = (spId, scId, canvasId) => page.evaluate(({ spId, scId, canvasId }) => {
      const sp = document.getElementById(spId), sc = document.getElementById(scId);
      if (!sp || sp.hidden) return { none: true, why: !sp ? 'no rail' : 'hidden', labs: sp ? sp.querySelectorAll('.ig-trk-lab').length : 0,
        marked: docXraySpineRows(docXrayRows(getContract('MK-BF'), document.getElementById(canvasId))).length,
        scan: (getContract('MK-BF').scan || { findings: [] }).findings.length, rows: docXrayRows(getContract('MK-BF'), document.getElementById(canvasId)).length,
        q: ((getContract('MK-BF').scan || { findings: [] }).findings[0] || {}).quote, t0: (docXrayRows(getContract('MK-BF'), document.getElementById(canvasId)).find(r => /^3\.?$/.test(r.cite)) || { row: {} }).row.text };
      const H = sp.clientHeight, top = 14, bot = H - 14, total = sc.scrollHeight, scTop = sc.getBoundingClientRect().top - sc.scrollTop;
      const fold = sp._trkFold || null;
      const marks = [...sp.querySelectorAll('.ig-trk-svg rect[style]')].map(r => Number(r.getAttribute('y')));
      const rows = docXrayRows(getContract('MK-BF'), document.getElementById(canvasId));
      const labs = [...sp.querySelectorAll('.ig-trk-lab')];
      const at = labs.map((b, k) => { const i = Number(b.getAttribute('data-xr-seg')); const row = rows.find(x => x.i === i); const r = row.el.getBoundingClientRect();
        return { paper: (r.top - scTop) / total, rail: marks[k] }; });
      const boxes = labs.map(b => b.getBoundingClientRect()).concat([...sp.querySelectorAll('.ig-trk-sec')].map(s => s.getBoundingClientRect()));
      let overlap = 0; for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++)
        if (boxes[i].top < boxes[j].bottom - 0.5 && boxes[j].top < boxes[i].bottom - 0.5) overlap++;
      const sec = sp.querySelector('.ig-trk-sec');
      return { fold, top, bot, at, overlap, tail: !!sp.querySelector('.ig-trk-tail'), sec: sec ? sec.textContent : '', size: sp.dataset.trackSize,
        lastRail: (Math.max(...marks) - top) / (bot - top) };
    }, { spId, scId, canvasId });
    const judge = (tag, T) => {
      if (T && T.none){ check(`${tag}a the Track is drawn`, false, JSON.stringify(T)); return; }
      /* named where the Track has its full width; slim and hairline draw the piece alone */
      check(`${tag}a the schedules fold into a short piece, named at full width`, !!(T && T.fold && T.tail && (T.size === 'full' ? T.sec === 'Schedules' : !T.sec)),
        T ? `fold ${T.fold ? T.fold.b.toFixed(2) : 'none'} · tail ${T.tail} · ${T.size} · "${T.sec}"` : 'no track');
      if (!T || !T.fold) return;
      check(`${tag}b the body is under half the paper, so true to the page the flags sat in its top half`, T.fold.b < 0.5, T.fold.b.toFixed(2));
      check(`${tag}c the flags now spread down most of the rail`, T.lastRail > 0.65, (T.lastRail * 100).toFixed(0) + '% down');
      const want = x => T.top + x.paper / T.fold.b * (T.fold.bodyBot - T.top);
      const worst = Math.max(...T.at.map(x => Math.abs(want(x) - x.rail) / (T.fold.bodyBot - T.top)));
      check(`${tag}d each flag sits at its clause's place in the body (within 2%)`, worst <= 0.02, (worst * 100).toFixed(2) + '%');
      check(`${tag}e no label overlaps another, nor the schedules' name`, T.overlap === 0, T.overlap + ' overlaps');
    };

    /* ===== 1. HOME'S PAPER ===== */
    console.log('\n1 · Home\'s Paper');
    await page.evaluate(() => pdOpenOnHome('MK-BF'));
    const homeUp = await until(() => !!document.querySelector('#ig-paper:not([hidden]) #ig-canvas .pg-sheet, #ig-paper:not([hidden]) #ig-canvas') && !!document.getElementById('ig-spine'), null, 15000);
    check('1. the contract is on Home\'s Paper', !!homeUp);
    const f1 = await flag('ig-canvas', FLAGGED);
    check('1. five body clauses flagged', !f1.err, f1.err || String(f1.n));
    await page.evaluate(() => igPaintPaper());
    await until(() => { const sp = document.getElementById('ig-spine'); return sp && !sp.hidden && sp.querySelectorAll('.ig-trk-lab').length >= 5; });
    await page.waitForTimeout(300);
    judge('1', await readTrack('ig-spine', 'ig-paper-scroll', 'ig-canvas'));
    await page.screenshot({ path: path.join(OUT, '1-home-paper.png') });

    /* ===== 2. THE DOCUMENT TAB ===== */
    console.log('\n2 · the Document tab');
    await page.evaluate(() => { openWorkspace('MK-BF'); setTimeout(() => roomGoTab(getContract('MK-BF'), 'docs'), 250); });
    await until(() => !!document.querySelector('#ws-tabs [data-ws-tab="docs"].on') && !!document.getElementById('doc-canvas'), null, 12000);
    const f2 = await flag('doc-canvas', FLAGGED);
    check('2. five body clauses flagged', !f2.err, f2.err || String(f2.n));
    await page.evaluate(() => docThreadPaint(getContract('MK-BF')));
    await until(() => { const sp = document.getElementById('doc-track'); return sp && !sp.hidden && sp.querySelectorAll('.ig-trk-lab').length >= 5; });
    await page.waitForTimeout(300);
    judge('2', await readTrack('doc-track', 'doc-scroll', 'doc-canvas'));
    await page.screenshot({ path: path.join(OUT, '2-document-tab.png') });

    /* ===== 3. NO SCHEDULES, NO FOLD ===== */
    const plain = await page.evaluate(() => {
      if (typeof igTrackBodyEnd !== 'function') return { missing: true };
      const rows = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ text: n + '. Clause ' + n, cite: String(n), headed: true }));
      const sched = rows.concat([{ text: 'SCHEDULE 1 – PRICES', cite: '1', headed: true }]);
      const restart = rows.concat([{ text: '1. Definitions', cite: '1', headed: true }]);
      const inBody = [{ text: '1. Scope', cite: '1', headed: true }, { text: '2. Schedule of payments', cite: '2', headed: true }, { text: '3. Term', cite: '3', headed: true }];
      return { none: igTrackBodyEnd(rows), sched: igTrackBodyEnd(sched), restart: igTrackBodyEnd(restart), inBody: igTrackBodyEnd(inBody),
        shortTail: igTrackFold(0.9, 14, 500), tail: !!igTrackFold(0.4, 14, 500) };
    });
    if (plain.missing) check('3. the body-first reading exists', false, 'igTrackBodyEnd is not defined');
    else {
    check('3a a contract with no schedules is not folded', plain.none === -1, String(plain.none));
    check('3b a schedule heading ends the body; numbering that starts again does too', plain.sched === 8 && plain.restart === 8, `${plain.sched} · ${plain.restart}`);
    check('3c a body clause NAMED "Schedule of payments" does not', plain.inBody === -1, String(plain.inBody));
    check('3d schedules shorter than the piece are drawn true to the page', plain.shortTail === null && plain.tail, JSON.stringify(plain.shortTail));
    }

    /* ===== 4–6. THE BOARD'S NAMES ===== */
    console.log('\n4 · the Board');
    await page.evaluate(names => {
      state.contracts.slice(0, 24).forEach((c, i) => { c.counterparty = names[i % names.length]; });
      const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.recipe = {}; s.undo = []; hbSave(); setView('dashboard');
    }, LONG);
    await until(() => !!document.getElementById('hb-board'), null, 12000);
    const addCard = (title, recipe) => page.evaluate(({ title, recipe }) => { hbBoardApply([{ do: 'add_card', which: { all: true }, title, recipe }], 'add ' + title); }, { title, recipe });
    const readNames = (cls, first) => page.evaluate(({ cls, first }) => {
      const svg = [...document.querySelectorAll('#hb-board svg.' + cls)].find(x => new RegExp('^\\W*\\w+ ' + first, 'i').test(x.getAttribute('aria-label') || '') || (x.getAttribute('aria-label') || '').toLowerCase().indexOf(first) > -1 && (x.getAttribute('aria-label') || '').toLowerCase().indexOf(first) < (x.getAttribute('aria-label') || '').toLowerCase().indexOf(first === 'party' ? 'stage' : 'party')); if (!svg) return null;
      const box = svg.getBoundingClientRect();
      const angled = [...svg.querySelectorAll('text.hb-sv-angled')];
      const rs = angled.map(t => t.getBoundingClientRect());
      let overlap = 0; for (let i = 1; i < angled.length; i++){ const a = rs[i - 1], b = rs[i];
        /* slanted boxes overlap as rectangles by design; ask the baselines: each name starts right of the one before */
        if (b.left <= a.left) overlap++; }
      const cells = [...svg.querySelectorAll('.hb-sv-cbox rect')].map(r => r.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
      const gridTop = cells.length ? Math.min(...cells.map(r => r.top)) : null, gridBot = cells.length ? Math.max(...cells.map(r => r.bottom)) : null;
      return { n: angled.length, words: angled.map(t => t.textContent), cut: angled.filter(t => /…$/.test(t.textContent)).length,
        fs: angled.length ? getComputedStyle(angled[0]).fontSize : '', outside: rs.filter(r => r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1).length,
        overlap, gridTop, gridBot, labTop: rs.length ? Math.min(...rs.map(r => r.top)) : null, labBot: rs.length ? Math.max(...rs.map(r => r.bottom)) : null,
        flat: [...svg.querySelectorAll('text.hb-sv-ink2:not(.hb-sv-angled)')].length,
        flatFs: (() => { const t = document.querySelector('#hb-board svg text.hb-sv-ink2:not(.hb-sv-angled)'); return t ? getComputedStyle(t).fontSize : ''; })(), label: svg.getAttribute('aria-label') };
    }, { cls, first });
    await addCard('Party and stage', { pic: 'heat', split: { by: 'counterparty' }, split2: { by: 'status' } });
    await until(() => !!document.querySelector('#hb-board svg.hb-heat'), null, 10000);
    await page.waitForTimeout(600);
    const heat = await readNames('hb-heat', 'party');
    check('4a the heat grid slants its long column names', !!heat && heat.n >= 5, heat ? heat.n + ' slanted' : 'no heat grid');
    if (heat && heat.n){
      check('4b each name is whole, no "…"', heat.cut === 0, heat.words.join(' | '));
      check('4c no larger than the flat ones, never under the 12px floor', parseFloat(heat.fs) >= 12 && parseFloat(heat.fs) <= parseFloat(heat.flatFs || heat.fs), heat.fs + ' · flat ' + heat.flatFs);
      check('4d every name inside the chart', heat.outside === 0, heat.outside + ' outside');
      check('4e in order, none starting on another', heat.overlap === 0, heat.overlap + '');
      check('4f none over the grid', heat.labBot <= heat.gridTop + 1, `names end ${Math.round(heat.labBot)} · grid starts ${Math.round(heat.gridTop)}`);
    }
    await page.screenshot({ path: path.join(OUT, '4-heat-grid.png') });
    await addCard('Party by stage', { pic: 'stack', split: { by: 'counterparty' }, split2: { by: 'status' } });
    await until(() => !!document.querySelector('#hb-board svg.hb-stack'), null, 10000);
    await page.waitForTimeout(600);
    const stack = await readNames('hb-stack', 'party');
    check('5a the stacked columns slant their long names', !!stack && stack.n >= 5, stack ? stack.n + ' slanted' : 'no stacked chart');
    if (stack && stack.n){
      check('5b each whole, inside the chart, in order', stack.cut === 0 && stack.outside === 0 && stack.overlap === 0, `cut ${stack.cut} · outside ${stack.outside} · order ${stack.overlap}`);
      check('5c under the columns, never on them', stack.labTop >= stack.gridBot - 2, `names start ${Math.round(stack.labTop)} · columns end ${Math.round(stack.gridBot)}`);
    }
    await page.screenshot({ path: path.join(OUT, '5-stacked.png') });
    await addCard('Stage and party', { pic: 'heat', split: { by: 'status' }, split2: { by: 'counterparty' } });
    await page.waitForTimeout(800);
    const flat = await readNames('hb-heat', 'stage');
    check('6. short names (the stages) stay flat', !!flat && flat.n === 0 && flat.flat > 0, flat ? `${flat.n} slanted · ${flat.flat} flat` : 'no chart');
    await page.screenshot({ path: path.join(OUT, '6-flat.png') });

    check('7. no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(failures ? `\n${failures} failed` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
