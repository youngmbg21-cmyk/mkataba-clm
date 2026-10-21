/* ============================================================
   JAMBO'S WORK · OPEN LANDS ON THE CARD, WHATEVER WAS ON THE BOARD BEFORE
   (owner, 21 Oct 2026: "review why when i press jambos work it does not take
   me to the correct location" — then "fix it")
   ============================================================
   Measured before the fix: once a contract's report had been brought up on
   the Board (any Open from a list, Show on the Board), Home's "Jambo's work ·
   Open" switched to the Board with that report still the page on top — the
   Jambo's work card was never drawn, and the lander's missing line said
   "Jambo has nothing prepared right now" over a row counting the work.
   hbOpenAgent now puts a held card away first, as every other door onto the
   Board's own page does (bsCardLeave). Driven in a real browser:
     1  from a clean start: Open lands on the Jambo's work card, in view
     2  after a contract's report was brought up on the Board, then Home:
        Open lands on the card — no contract report, no "nothing prepared"
     3  with a contract's report on screen, the house's door (hbOpenAgent)
        lands on the card too
     4  the owner's three screens: the card in view, nothing sideways
     node test/chromium/jambos-work-open-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'jambos-work-open');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await pause(100); } return null; };
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

/* where the press arrived, read where the reader looks */
const WHERE = () => {
  const t = document.getElementById('hm-agents'); const r = t && t.getBoundingClientRect();
  const hit = r ? document.elementFromPoint(Math.round(r.left + 40), Math.round(Math.max(r.top, 0) + 16)) : null;
  const toasts = [...document.querySelectorAll('.toast')].map(x => x.textContent.trim()).join(' | ');
  return { view: state.view, face: typeof hbFace === 'function' ? hbFace() : '', card: typeof bsCardId === 'function' ? bsCardId() : null,
    agents: !!t, seen: !!(hit && t && t.contains(hit)), landed: !!(t && t.classList.contains('is-landed')),
    nothing: /nothing prepared/i.test(toasts), sideways: document.documentElement.scrollWidth > window.innerWidth + 1 };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  let staged = true;
  for (let i = 1; i <= 6; i++) {
    const id = 'MK-JWO' + i;
    const c = Object.assign(fixtureContract(id, 'Supply Agreement ' + i, 'Party ' + i + ' Ltd', 'dist', 100000 * i, 'Under Review',
      'SUPPLY AGREEMENT\n\n1. Services\n\nThe Supplier shall deliver goods.\n\n2. Payment\n\nInvoices are payable within 30 days.'), {
      owner: { id: me.id, name: me.name },
      triage: { at: new Date(Date.now() - 864e5).toISOString(), by: 'Jambo', steps: { brief: { ok: true }, playbook: { ok: true, dev: 1 },
        oblig: { ok: true, found: [{ desc: 'Pay within 30 days', party: 'ours' }] } } } });
    const put = await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    staged = staged && !!(put && put.ok);
  }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  /* a press on a control that is not there reports, it does not time out */
  const click = sel => page.click(sel, { timeout: 3000 }).then(() => true, () => false);
  const home = async () => { await page.evaluate(() => setView('counter')); return waitFor(page, () => !!document.querySelector('[data-cn-jw]'), 8000); };
  const openFromHome = async () => { if (!(await home())) return null; if (!(await click('[data-cn-jw]'))) return null;
    return waitFor(page, () => { const t = document.getElementById('hm-agents'); return t && t.classList.contains('is-landed') ? true : null; }, 6000); };
  try {
    check('0 six contracts read on arrival are staged', staged);
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await click('#li-go');
    await waitFor(page, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-JWO1'), 15000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en' && typeof langSet === 'function') langSet('en'); });

    console.log('\n1 · from a clean start');
    const l1 = await openFromHome(); const w1 = await page.evaluate(WHERE);
    check('1 Open lands on the Jambo\'s work card, in view', !!l1 && w1.face === 'board' && !w1.card && w1.agents && w1.seen, JSON.stringify(w1));

    console.log('\n2 · after a contract\'s report was on the Board');
    await page.evaluate(() => hbStripBring('MK-JWO3'));
    const held = await waitFor(page, () => typeof bsCardId === 'function' && bsCardId() === 'MK-JWO3', 8000);
    check('2- a contract\'s report is held on the Board (the case being measured)', !!held);
    const l2 = await openFromHome(); const w2 = await page.evaluate(WHERE);
    check('2a Open lands on the Jambo\'s work card, not the old report', !!l2 && w2.face === 'board' && !w2.card && w2.agents && w2.seen, JSON.stringify(w2));
    check('2b and never says "nothing prepared" over waiting work', !w2.nothing, JSON.stringify(w2));
    await page.screenshot({ path: path.join(OUT, 'after-a-report-1440x780.png') });

    console.log('\n3 · with a contract\'s report on screen');
    await page.evaluate(() => hbStripBring('MK-JWO5'));
    const held3 = await waitFor(page, () => state.view === 'dashboard' && typeof bsCardId === 'function' && bsCardId() === 'MK-JWO5', 8000);
    await page.evaluate(() => hbOpenAgent());
    const l3 = await waitFor(page, () => { const t = document.getElementById('hm-agents'); return t && t.classList.contains('is-landed') ? true : null; }, 6000);
    const w3 = await page.evaluate(WHERE);
    check('3 the house\'s door from a contract\'s report lands on the card', !!held3 && !!l3 && !w3.card && w3.agents && w3.seen && !w3.nothing, JSON.stringify(w3));

    console.log('\n4 · the owner\'s three screens');
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh });
      await page.evaluate(() => hbStripBring('MK-JWO2'));
      await waitFor(page, () => typeof bsCardId === 'function' && bsCardId() === 'MK-JWO2', 8000);
      const l = await openFromHome(); await pause(300); const m = await page.evaluate(WHERE);
      check(`4 ${w}x${hh}: the card in view, nothing sideways`, !!l && m.agents && m.seen && !m.card && !m.sideways, JSON.stringify(m));
      await page.screenshot({ path: path.join(OUT, `open-${w}x${hh}.png`) });
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
