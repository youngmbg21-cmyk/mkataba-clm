/* Chromium verification: OVERVIEW 2 — THE TIME MACHINE (work order O-36..O-42)
   ============================================================
   On a real signed contract with obligations, a renewal and a signed amendment:
     1. the tab exists right after Overview and a refresh lands on it;
     2. the three blocks are in order — essentials, the Time Machine, Related
        agreements LAST;
     3. the track is drawn at the card's real width, 150 high; Today, the
        jumps and the range move the date; Play moves it on its own;
     4. a late obligation turns the sentence and its row red;
     5. a contract with no end date draws the arrow; one with no family says
        it is standalone;
     6. measured colours equal the design's table (Blue, light and dark);
     7. photographed at 1440 and 1920, light and dark; no page errors.
   Waits ask for the state, bounded.
   Screenshots: test/chromium/shots/overview-two/ (or HATI_SHOT_DIR).
   Run: node test/chromium/overview-two-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'overview-two');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const iso = d => d.toISOString().slice(0, 10);
const T = new Date(); T.setUTCHours(0, 0, 0, 0);
const dayIn = n => iso(new Date(+T + n * 864e5));

let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const login = async () => {
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0 && typeof currentUser === 'function' && currentUser(), null, { timeout: 20000 });
    await page.waitForTimeout(1200);
  };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => { document.documentElement.setAttribute('data-brand', 'navy'); });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await login();
    if (!(await page.evaluate(() => typeof paintOverview2 === 'function'))) throw new Error('this build has no Overview 2');
    const ids = await page.evaluate(async D => {
      /* a contract still under review: a signed record refuses a change to its
         dates (EXECUTED_IMMUTABLE), and this stage writes them */
      const c = state.contracts.find(x => x.status === 'Under Review') || state.contracts.find(x => x.status === 'Draft') || state.contracts[0];
      if (typeof ensureFull === 'function') await ensureFull(c);
      c.fields = Object.assign({}, c.fields, { effDate: D.start });
      c.expiry = D.end;
      c.metadata = Object.assign({}, c.metadata, { renewalType: 'auto-renew', noticePeriodDays: 90, governingLaw: 'Kenya', paymentTerms: '45 days from invoice', liabilityCapped: 'capped' });
      c.obligations = [
        { id: 'ob_a', desc: 'We pay the monthly invoice', due: D.late, recurring: 'monthly', status: 'open', party: 'ours', amount: 500000, clause: '5.2' },
        { id: 'ob_b', desc: 'Quarterly quality certificate', due: D.soon, recurring: 'quarterly', status: 'open', party: 'theirs', clause: '6.1' },
        { id: 'ob_c', desc: 'Annual volume review', due: D.later, status: 'open', party: 'ours' }];
      c.datedWindows = { hash: (typeof triageWordingHash === 'function' ? triageWordingHash(c) : ''), ok: true, windows: [{ label: 'Prices fixed', kind: 'fixed', from: D.start, to: D.fixedTo, clause: '4.1', rule: 'Prices cannot change.', quote: 'x' }] };
      await persist(c);
      return { cid: c.id };
    }, { start: dayIn(-200), end: dayIn(500), late: dayIn(-40), soon: dayIn(10), later: dayIn(120), fixedTo: dayIn(150) });
    const cid = ids.cid;
    await page.evaluate(id => openWorkspace(id), cid);
    await until(id => state.activeId === id, cid);
    const tabs = await until(() => { const r = document.getElementById('ws-tabs'); return r ? [...r.querySelectorAll('[data-ws-tab]')].map(b => b.getAttribute('data-ws-tab')) : null; });
    check('1a. the tab is right after Overview', tabs && tabs[0] === 'terms' && tabs[1] === 'ov2', tabs && tabs.join(','));
    await page.click('[data-ws-tab="ov2"]');
    const blocks = await until(() => { const r = document.getElementById('ov2'); return r && r.querySelector('svg.tsvg') ? [...r.children].map(x => x.id) : null; });
    check('2. essentials, the Time Machine, its cards, Related agreements last', blocks && blocks.join(',') === 'ov2-ess,ov2-tm,ov2-cards,ov2-fam', blocks && blocks.join(','));
    const trk = await page.evaluate(() => { const s = document.querySelector('#ov2 svg.tsvg'), r = s.getBoundingClientRect(); return { w: Math.round(r.width), vb: s.getAttribute('viewBox'), h: Math.round(r.height) }; });
    check('3a. the track is drawn at its real width, 150 high', trk && trk.h === 150 && Math.abs(Number(trk.vb.split(' ')[2]) - trk.w) <= 2, JSON.stringify(trk));
    const say0 = await page.evaluate(() => ({ say: document.getElementById('ov2-say').textContent, red: document.getElementById('ov2-say').classList.contains('is-late'), d: document.getElementById('ov2-d').textContent, row: (document.querySelector('#ov2-obs [data-ov2-st="r"]') || {}).textContent || '' }));
    check('4a. a late obligation turns the sentence red', say0.red && /late on this date/.test(say0.say), say0.say);
    check('4b. and its row', /We pay the monthly invoice/.test(say0.row), say0.row);
    await page.waitForTimeout(600); /* the tab underline's own transition */
    await page.screenshot({ path: path.join(OUT, '1-light-1440.png'), fullPage: false });
    await page.evaluate(() => { const p = document.querySelector('[data-ws-pane="ov2"]'); if (p) p.scrollTop = 99999; });
    await page.screenshot({ path: path.join(OUT, '1b-light-1440-lower.png') });
    await page.evaluate(() => { const p = document.querySelector('[data-ws-pane="ov2"]'); if (p) p.scrollTop = 0; });
    const j = await page.evaluate(() => [...document.querySelectorAll('#ov2 [data-ov2-j]')].map(b => b.textContent.trim()));
    check('3b. Today and the jumps are there', j[0] === 'Today' && j.includes('The end') && j.includes('Last day for notice'), j.join(' | '));
    await page.click('#ov2 [data-ov2-j]:last-child');
    const moved = await until(d0 => { const d = document.getElementById('ov2-d').textContent; return d !== d0 ? d : null; }, say0.d);
    check('3c. a jump moves the date', !!moved, moved);
    const pressed = await page.evaluate(() => document.querySelector('#ov2 [data-ov2-j]:last-child').getAttribute('aria-pressed'));
    check('3d. the pressed jump shows pressed', pressed === 'true');
    await page.click('#ov2 [data-ov2-j]');
    await page.click('#ov2-play');
    await page.waitForTimeout(900);
    const played = await page.evaluate(d0 => ({ moved: document.getElementById('ov2-d').textContent !== d0, d: document.getElementById('ov2-d').textContent, b: document.getElementById('ov2-play').textContent, v: document.getElementById('ov2-r').value }), say0.d);
    check('3e. Play moves the date on its own', played.moved, JSON.stringify(played) + ' from ' + say0.d);
    await page.click('#ov2-play');
    /* colours */
    const col = await page.evaluate(() => { const g = getComputedStyle(document.querySelector('#ov2 .card')); const pill = document.querySelector('#ov2 .tm-ctl .btn.fill'); return { surface: g.backgroundColor, line: g.borderTopColor, fill: getComputedStyle(pill).backgroundColor }; });
    check('6a. light colours are the design\'s', col.surface === 'rgb(255, 255, 255)' && col.line === 'rgb(226, 231, 229)' && col.fill === 'rgb(38, 76, 158)', JSON.stringify(col));
    await page.evaluate(() => { document.documentElement.classList.add('dark'); });
    await page.waitForTimeout(300);
    const dk = await page.evaluate(() => { const g = getComputedStyle(document.querySelector('#ov2 .card')); return { surface: g.backgroundColor, line: g.borderTopColor }; });
    check('6b. dark colours are the design\'s', dk.surface === 'rgb(21, 27, 26)' && dk.line === 'rgb(38, 48, 46)', JSON.stringify(dk));
    await page.screenshot({ path: path.join(OUT, '2-dark-1440.png') });
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); });
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    const trk2 = await page.evaluate(() => { const s = document.querySelector('#ov2 svg.tsvg'), r = s.getBoundingClientRect(); return { w: Math.round(r.width), vb: Number(s.getAttribute('viewBox').split(' ')[2]) }; });
    check('3f. a wider window draws the track again, not stretched', Math.abs(trk2.vb - trk2.w) <= 2, JSON.stringify(trk2));
    await page.screenshot({ path: path.join(OUT, '3-light-1920.png') });
    await page.setViewportSize({ width: 1440, height: 900 });
    /* refresh lands on the tab */
    await page.waitForTimeout(800);
    await page.reload({ waitUntil: 'networkidle' });
    await login();
    const back = await until(() => { const b = document.querySelector('[data-ws-tab="ov2"]'); return b && b.getAttribute('aria-selected') === 'true' && document.querySelector('#ov2 svg.tsvg'); });
    check('1b. a refresh lands on Overview 2', !!back);
    /* no end date, no family */
    const alone = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.id !== state.activeId && x.status !== 'Draft') || state.contracts.find(x => x.id !== state.activeId);
      if (typeof ensureFull === 'function') await ensureFull(c);
      c.expiry = ''; c.metadata = Object.assign({}, c.metadata, { renewalType: 'evergreen' });
      openWorkspace(c.id); return c.id; });
    await until(id => state.activeId === id, alone);
    await page.evaluate(id => roomGoTab(getContract(id), 'ov2'), alone);
    const ar = await until(() => { const s = document.querySelector('#ov2 svg.tsvg'); return s ? { arrow: !!s.querySelector('path[d^="M"]'), alone: (document.querySelector('#ov2 .fam-alone') || {}).textContent || '' } : null; });
    check('5a. no end date draws the arrow', ar && ar.arrow);
    check('5b. no family says it is standalone', ar && /standalone agreement/i.test(ar.alone), ar && ar.alone);
    await page.screenshot({ path: path.join(OUT, '4-no-end.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '5-narrow.png') });
    check('7. no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) {
    check('run', false, e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
