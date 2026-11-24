/* Chromium verification: THE REVIEW DESK (work order O-32..O-35, 7 Oct 2026)
   ============================================================
   On a real contract, with Copilot's reading held from its arrival:
     RE-POINTED 23 Nov 2026 ("Duties, end to end"): 1. the Duties card says what waits; 2. it opens the contract's
     Duties page, nothing to tick, no Add all; 3. each duty is decided in the sheet over the page, one at a time, with
     whose job; 4. Skip then Bring back; a skipped item stays skipped after a reload;
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
      pdOpenOnHome(c.id, 'copilot');
      return c.id;
    }, FOUND);
    /* RE-POINTED 23 Nov 2026 (owner: "it should be mandatory to go through adding or skipping the pop up as you add a duty
       therefore no mass additions"; the drawing "Duties, end to end"): the one door is the Dossier's Duties card; it opens
       the contract's Duties page (no ticks, no Add all); each duty is decided in the sheet over the page, one at a time */
    await until(id => window.pdContract && pdContract() && pdContract().id === id, cid);
    const CARD = () => { const b = document.querySelector('#ig-dock [data-pd2-dtc]'); return b ? b.innerText.replace(/\s+/g, ' ').trim() : null; };
    const card = await until(CARD);
    check('1. the card says what waits: 4 to decide', card && /4 to decide/.test(card), card);
    if (!card) throw new Error('no Duties card on the Dossier');
    await until(id => { const c = getContract(id); const s = (typeof pbOpenCheckState === 'function') ? pbOpenCheckState(c) : null; return !(s && s.run); }, cid, 15000);
    await page.click('#ig-dock [data-pd2-dtc]');
    const desk = await until(() => { const d = document.getElementById('dtp'); if (!d) return null;
      return { rows: d.querySelectorAll('tr.dtp-r').length, ticks: d.querySelectorAll('input[type=checkbox]').length, addAll: !!document.querySelector('#obd-all, #or-add, [data-obd-group]'),
        left: (d.querySelector('[data-dtp-tab="left"] span') || {}).textContent, w: Math.round(d.getBoundingClientRect().width), vw: innerWidth }; });
    check('2a. the Duties page opens with the four to decide', desk && desk.rows === 4 && desk.left === '4', JSON.stringify(desk));
    check('2b. nothing to tick, no Add all', desk && desk.ticks === 0 && !desk.addAll, JSON.stringify(desk));
    check('5. the one already on the contract is not offered again', desk && desk.rows === 4);
    await page.screenshot({ path: path.join(OUT, '1-desk.png') });
    await page.click('[data-dtp-first]');
    const sh = await until(() => { const o = document.querySelector('.dts-ov'); return o ? { page: !!document.getElementById('dtp'), save: document.getElementById('of-save').disabled, txt: o.innerText.replace(/\s+/g, ' ') } : null; });
    check('3a. the sheet opens over the page, Add duty waiting for whose duty', sh && sh.page && sh.save === true && /1 of 4/.test(sh.txt), sh && sh.txt.slice(0, 120));
    await page.screenshot({ path: path.join(OUT, '2-sheet.png') });
    /* first: Pay each invoice (ours); second: the quarterly report (theirs); third: skipped */
    await page.click('.dts-ov [data-of-party="ours"]'); await page.click('.dts-ov #of-save');
    const two = await until(() => { const o = document.querySelector('.dts-ov'); return o && /2 of 4/.test(o.innerText) ? true : null; });
    check('3b. the next one opens by itself', !!two);
    await page.click('.dts-ov [data-of-party="theirs"]'); await page.click('.dts-ov #of-save');
    await until(() => { const o = document.querySelector('.dts-ov'); return o && /3 of 4/.test(o.innerText) ? true : null; });
    await page.click('.dts-ov #of-skip');
    check('4a. Skip marks it', !!(await until(() => (document.querySelector('[data-dtp-tab="skipped"] span') || {}).textContent === '1')));
    await page.click('.dts-ov #of-cancel');
    await page.click('[data-dtp-tab="skipped"]'); await page.click('[data-dtp-back]');
    check('4b. Bring back returns it', !!(await until(() => (document.querySelector('[data-dtp-tab="skipped"] span') || {}).textContent === '0')));
    await page.click('[data-dtp-tab="left"]');
    await page.click('button[data-dtp-decide]');
    await until(() => !!document.querySelector('.dts-ov #of-skip'));
    await page.click('.dts-ov #of-skip');
    await page.click('.dts-ov #of-cancel').catch(() => {});
    const after = await until(id => { const c = getContract(id); return c.obligations.length === 3 ? c.obligations.map(o => o.desc + ':' + (o.party || '')) : null; }, cid);
    check('3c. exactly the two decided are added, with whose job', after && after.some(x => x === 'Deliver the quarterly sales report:theirs') && after.some(x => x === 'Pay each invoice within thirty days of receipt:ours'), JSON.stringify(after));
    await until(() => typeof dirty === 'undefined' || !dirty.size, null, 6000);
    await page.waitForTimeout(1200);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(id => window.state && state.contracts && state.contracts.some(c => c.id === id) && typeof currentUser === 'function' && currentUser(), cid, { timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.evaluate(async id => { const c = getContract(id); if (typeof ensureFull === 'function') await ensureFull(c); pdOpenOnHome(id, 'copilot'); }, cid);
    /* RE-POINTED 23 Nov 2026 (A REFRESH LANDS AT THE SAME SPOT, and the Duties page is the one door: a refresh with the
       contract's Duties page up puts that page back in the middle, hbPlace 'duties', where the Dossier's card is not
       drawn): what is left to decide is read off whichever stands — the page's To decide count, else the card */
    const card2 = await until(() => { const d = document.getElementById('dtp');
      if (d){ const n = (d.querySelector('[data-dtp-tab="left"] span') || {}).textContent; return n != null ? 'page: ' + n + ' to decide' : null; }
      const b = document.querySelector('#ig-dock [data-pd2-dtc]'); return b ? b.innerText.replace(/\s+/g, ' ').trim() : null; });
    const dbg = await page.evaluate(id => { const c = getContract(id); return JSON.stringify({ r: c.obReview, light: !!c._light }); }, cid);
    check('4c. after a reload the skip is kept: one left to decide', card2 && /(^|\D)1 to decide/.test(card2), card2 + ' ' + dbg);
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
