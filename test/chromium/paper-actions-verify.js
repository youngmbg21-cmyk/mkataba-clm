/* ============================================================
   "ACTIONS" ON THE PAPER'S LINE — THE WHOLE LIST, ONE PRESS AWAY
   (owner, 23 Oct 2026: "the all button is hidden and impossible to know what is
   there. Please add it to the right of share button and call it something")
   ============================================================
   Driven in a real browser, with presses:
     1  the paper's line reads Notes · Share · Actions, Actions right of Share,
        on one line, inside the line
     2  Actions opens the Dossier's whole list of acts (the same fold "All N ›"
        opens) and lands on it; a draft's list ends in "Delete this draft"
     3  pressed again, the list folds
     4  from another tab (Clauses) it brings the Dossier back, list open
     5  in Swedish it reads "Åtgärder"
     6  the owner's three screens: on one line, nothing spills
   Red at the parent: there is no Actions button.
     node test/chromium/paper-actions-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'paper-actions');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await pause(100); } return null; };
const ID = 'MK-PA1';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const c = Object.assign(fixtureContract(ID, 'Renewal No. 1 to Mutual Non-Disclosure Agreement', 'Juno Limited', 'proc', 0,
    'Draft', 'RENEWAL NO. 1\n\n1. Term\n\nThe Agreement is extended.\n\n2. Rest\n\nAll other terms remain.'), {});
  const put = await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const click = sel => page.click(sel, { timeout: 3000 }).then(() => true, () => false);
  const line = () => page.evaluate(() => { const s = document.getElementById('ig-strip'), a = document.getElementById('ig-actions'), sh = document.getElementById('ws-share'),
      n = document.querySelector('#ig-strip #hdr-chat'); if (!s || !a) return { actions: false };
    const r = a.getBoundingClientRect(), sr = sh && sh.getBoundingClientRect(), lr = s.getBoundingClientRect(), nr = n && n.getBoundingClientRect();
    const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { actions: true, word: a.textContent.trim(), rightOfShare: !!sr && r.left >= sr.right - 1, oneRow: !!sr && Math.abs(r.top - sr.top) <= 2 && (!nr || Math.abs(nr.top - r.top) <= 2),
      inside: r.right <= lr.right + 1 && r.bottom <= lr.bottom + 1, painted: !!(at && a.contains(at)), oneLine: r.height <= 40, expanded: a.getAttribute('aria-expanded') }; });
  const fold = () => page.evaluate(id => { const f = typeof pdActsFold === 'function' ? pdActsFold(id) : null; if (!f) return null;
    const r = f.getBoundingClientRect(), b0 = f.querySelector('.pd-mn-rows button'), sum = b0.getBoundingClientRect(), at = document.elementFromPoint(sum.left + 20, sum.top + sum.height / 2);   /* the first row of the list, painted where the reader looks */
    return { open: f.open, inView: sum.top >= 0 && sum.bottom <= innerHeight && !!(at && f.contains(at)), rows: [...f.querySelectorAll('.pd-mn-rows button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()), tab: typeof pdTab === 'function' ? pdTab() : null, h: Math.round(r.height) }; }, ID);
  try {
    check('0 the draft is staged', !!(put && put.ok));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await click('#li-go');
    await waitFor(page, id => typeof getContract === 'function' && !!getContract(id), 15000, ID);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en') langSet('en'); });
    await page.evaluate(id => pdOpenOnHome(id, 'copilot'), ID);
    await waitFor(page, () => !!document.querySelector('#ig-strip #ws-share'), 12000);

    console.log('\n1 · the line');
    const l1 = await waitFor(page, async () => !!document.getElementById('ig-actions'), 4000) ? await line() : { actions: false };
    check('1 the paper\'s line reads Notes · Share · Actions: right of Share, one row, inside the line, painted', l1.actions && l1.word === 'Actions' && l1.rightOfShare && l1.oneRow && l1.inside && l1.painted, JSON.stringify(l1));
    await page.screenshot({ path: path.join(OUT, '1-line-1440x780.png') });

    console.log('\n2 · the press');
    if (l1.actions){
      await click('#ig-actions');
      const f2 = await waitFor(page, async id => { const f = typeof pdActsFold === 'function' ? pdActsFold(id) : null; return f && f.open; }, 5000, ID) ? await fold() : null;
      check('2a Actions opens the Dossier\'s whole list of acts and lands on it', !!f2 && f2.open && f2.inView && f2.rows.length > 3, JSON.stringify(f2 && { open: f2.open, inView: f2.inView, n: f2.rows.length }));
      check('2b a draft\'s list ends in "Delete this draft"', !!f2 && /Delete this draft/.test(f2.rows[f2.rows.length - 1] || ''), f2 && f2.rows.slice(-2).join(' | '));
      check('2c the button says it is open', (await line()).expanded === 'true');
      await page.screenshot({ path: path.join(OUT, '2-open-1440x780.png') });

      console.log('\n3 · again');
      await click('#ig-actions');
      const f3 = await waitFor(page, async id => { const f = typeof pdActsFold === 'function' ? pdActsFold(id) : null; return f && !f.open ? 'shut' : null; }, 3000, ID);
      check('3 pressed again, the list folds', f3 === 'shut' && (await line()).expanded === 'false', String(f3));

      console.log('\n4 · from another tab');
      await page.evaluate(() => { pdSetTab('doc'); renderIntelDock(); });
      await waitFor(page, () => pdTab() === 'doc', 3000);
      await click('#ig-actions');
      const f4 = await waitFor(page, async id => { const f = typeof pdActsFold === 'function' ? pdActsFold(id) : null; return f && f.open ? pdTab() : null; }, 5000, ID);
      check('4 from Clauses it brings the Dossier back with the list open', f4 === 'copilot', String(f4));
      await click('#ig-actions');
    }

    console.log('\n5 · Swedish');
    await page.evaluate(id => { langSet('sv'); pdOpenOnHome(id, 'copilot'); }, ID);
    const sv = await waitFor(page, () => { const a = document.getElementById('ig-actions'); return a ? a.textContent.trim() : null; }, 5000);
    check('5 in Swedish it reads "Åtgärder"', sv === 'Åtgärder', String(sv));
    await page.evaluate(id => { langSet('en'); pdOpenOnHome(id, 'copilot'); }, ID);

    console.log('\n6 · the owner\'s three screens');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await waitFor(page, () => !!document.getElementById('ig-actions'), 4000);
      await pause(300);
      const m = await line();
      const side = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      check(`6 ${w}x${hh}: Actions on the line, right of Share, one row, inside, painted, nothing sideways`, m.actions && m.rightOfShare && m.oneRow && m.inside && m.painted && m.oneLine && !side, JSON.stringify(m));
      await page.screenshot({ path: path.join(OUT, `line-${w}x${hh}.png`) });
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
