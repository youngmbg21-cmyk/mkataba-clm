/* Chromium verification: THE REVIEW DESK (work order O-32..O-35, 7 Oct 2026)
   ============================================================
   On a real contract, with Copilot's reading held from its arrival:
     1. the Obligations tab's door says "Review N proposed", N the desk's own;
     2. pressing it opens the desk: three groups with counts, nothing ticked,
        the window 920 wide and inside the screen;
     3. a group tick then "Add N ticked" adds exactly those, with whose job;
     4. Skip then Undo; a skipped item stays skipped after a reload;
     5. duplicates sit under "Already on this contract" with nothing to decide;
     6. photographed; no page errors.
   Waits ask for the state, bounded.
   Screenshots: test/chromium/shots/review-desk/ (or HATI_SHOT_DIR).
   Run: node test/chromium/review-desk-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'review-desk');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const FOUND = [
  { desc: 'Pay each invoice within thirty days of receipt', recurring: 'monthly', kind: 'dated', party: 'us', clause: '6.2', amount: 120000, quote: 'within thirty (30) days of receipt of a valid invoice', why: 'it repeats every month' },
  { desc: 'Deliver the quarterly sales report', recurring: 'quarterly', kind: 'dated', party: 'them', clause: '9.1', quote: 'shall deliver a sales report each quarter' },
  { desc: 'Notify a security breach within 48 hours', kind: 'event', party: 'both', clause: '12.4', quote: 'within forty-eight (48) hours of becoming aware' },
  { desc: 'Keep product liability insurance in force', kind: 'standing', party: 'them', clause: '14.1', doc: true, quote: 'shall maintain product liability insurance' },
  { desc: 'Give 90 days notice of non-renewal', kind: 'dated', party: 'us', clause: '3.2', quote: 'ninety (90) days' }];

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
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0 && typeof currentUser === 'function' && currentUser(), null, { timeout: 20000 });
    await page.waitForTimeout(1500);
    if (!(await page.evaluate(() => typeof obReviewTally === 'function'))) throw new Error('this build has no review desk');
    const cid = await page.evaluate(async F => {
      const c = state.contracts.find(x => x.status === 'Signed') || state.contracts[0];
      if (typeof ensureFull === 'function') await ensureFull(c);
      c.obligations = [{ id: 'ob_x', desc: 'Give 90 days notice of non-renewal', due: '', status: 'open', party: 'ours' }];
      c.triage = Object.assign({}, c.triage || {}, { at: new Date().toISOString(), steps: Object.assign({}, (c.triage || {}).steps || {}, { oblig: { ok: true, found: F } }) });
      await persist(c);
      openWorkspace(c.id);
      return c.id;
    }, FOUND);
    await until(id => state.activeId === id, cid);
    await page.evaluate(id => roomGoTab(getContract(id), 'oblig'), cid);
    const door = await until(() => { const b = document.getElementById('obt-find'); return b && /Review/.test(b.textContent) ? b.textContent.trim() : null; });
    check('1. the door says "Review N proposed", N the desk\'s own', door && /Review 4 proposed/.test(door), door);
    await page.click('#obt-find');
    const desk = await until(() => { const d = document.getElementById('obd'); if (!d) return null;
      const r = d.closest('[role="dialog"]') ? d.closest('[role="dialog"]').getBoundingClientRect() : d.getBoundingClientRect();
      /* RE-POINTED 10 Oct 2026 (owner picked "Table", the SAP way): a kind
         is a band row of the table, an item already on the contract a row
         marked is-already */
      return { groups: [...d.querySelectorAll('.obd-band:not([data-obd-band="already"]) .obd-band-w')].map(x => x.textContent.trim()),
        ticked: [...d.querySelectorAll('[data-ob-pick]')].filter(b => b.checked).length,
        already: d.querySelectorAll('.obd-row.is-already').length, alreadyBoxes: d.querySelectorAll('.obd-row.is-already [data-ob-pick]').length,
        w: Math.round(d.getBoundingClientRect().width), bottom: Math.round(r.bottom), vh: innerHeight, foot: d.querySelector('#obd-count').textContent }; });
    check('2a. the desk opens with its three groups', desk && desk.groups.join('|') === 'Dated or repeating|Only when something happens|Standing promises', desk && desk.groups.join('|'));
    check('2b. nothing arrives ticked', desk && desk.ticked === 0);
    check('2c. 920 wide and inside the screen', desk && desk.w <= 920 && desk.w >= 860 && desk.bottom <= desk.vh, desk && `${desk.w} wide, bottom ${desk.bottom}`);
    check('5. the one already on the contract is not offered again', desk && desk.already === 0);
    check('2d. the foot counts what is left', desk && /4 to decide · 0 added · 0 skipped/.test(desk.foot), desk && desk.foot);
    await page.screenshot({ path: path.join(OUT, '1-desk.png') });
    await page.click('[data-obd-sel="1"]');
    await page.screenshot({ path: path.join(OUT, '2-desk-theirs.png') });
    await page.click('[data-obd-sel="2"]');
    await page.click('[data-obd-skip]');
    check('4a. Skip marks it', !!(await until(() => /1 skipped/.test(document.getElementById('obd-count').textContent))));
    await page.click('[data-obd-sel="2"]');
    await page.click('[data-obd-undo]');
    check('4b. Undo brings it back', !!(await until(() => /0 skipped/.test(document.getElementById('obd-count').textContent))));
    await page.click('[data-obd-skip]');
    await page.click('[data-obd-group="dated"]');
    const lab = await page.evaluate(() => document.getElementById('or-add').textContent);
    check('3a. a group tick counts on the button', /Add 2 ticked/.test(lab), lab);
    await page.click('#or-add');
    const after = await until(id => { const c = getContract(id); return !document.getElementById('obd') && c.obligations.length === 3 ? c.obligations.map(o => o.desc + ':' + (o.party || '')) : null; }, cid);
    check('3b. exactly the ticked two are added', !!after, JSON.stringify(after));
    check('3c. with whose job', after && after.some(x => x === 'Deliver the quarterly sales report:theirs') && after.some(x => x === 'Pay each invoice within thirty days of receipt:ours'));
    /* the save is on its way (persist waits 400ms); let it land */
    await until(() => typeof dirty === 'undefined' || !dirty.size, null, 6000);
    await page.waitForTimeout(1200);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(id => window.state && state.contracts && state.contracts.some(c => c.id === id) && typeof currentUser === 'function' && currentUser(), cid, { timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.evaluate(async id => { const c = getContract(id); if (typeof ensureFull === 'function') await ensureFull(c); openWorkspace(id); }, cid);
    await until(id => state.activeId === id, cid);
    await page.evaluate(id => roomGoTab(getContract(id), 'oblig'), cid);
    const door2 = await until(() => { const b = document.getElementById('obt-find'); return b ? b.textContent.trim() : null; });
    const dbg = await page.evaluate(id => { const c = getContract(id); return JSON.stringify({ r: c.obReview, h: triageWordingHash(c), light: !!c._light }); }, cid);
    check('4c. after a reload the skip is kept: one left', door2 && /Review 1 proposed/.test(door2), door2 + ' ' + dbg);
    await page.screenshot({ path: path.join(OUT, '3-tab-after.png') });
    check('6. no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) {
    check('run', false, e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
