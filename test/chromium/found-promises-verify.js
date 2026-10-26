/* Chromium verification — PROMISES JAMBO FOUND ARE ON NEEDS YOU UNTIL SOMEBODY
   CONFIRMS THEM (flag E of the flow report; the owner's "fix all the flags",
   26 Oct 2026).
   ============================================================
   Before: on a signed contract, the duties Jambo read on arrival waited in the
   review desk unticked, and once his "new paper" piece was put away nothing on
   Home or the bell said so — a contract full of promises looked as if it owed
   nothing, and nobody was reminded of a duty that was never added.

     1  a signed contract the reader owns, with two promises found and not
        decided: Needs you holds ONE row, not urgent, "Jambo found 2 promises
        to confirm", on Home and in the bell's count, button "Review";
     2  the same finds on a contract still in negotiation give no row (they are
        not duties yet);
     3  the row's Review opens the review desk on those two, nothing ticked;
     4  each is decided at the desk (one added, one skipped): the row is gone;
     5  the owner's three screens: the row whole on one line, nothing
        sideways.
   Red at the parent: 1, 3 and 4 (no row to press).
   Run: node test/chromium/found-promises-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
};
const until = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_){ return false; } };
const SIGNED = 'MK-A1', LIVE = 'MK-A2';

(async () => {
  process.env.HATI_AGENTS_AUTO = 'off';
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => typeof window.getContract === 'function' && !!getContract('MK-A1'), null, 15000);

    /* ---- the stage: two contracts the reader owns, each with two promises Jambo found and nobody decided ---- */
    const stage = await page.evaluate(async ids => {
      const me = currentUser(), now = new Date().toISOString();
      const out = {};
      for (const id of ids){
        const c = getContract(id); await ensureFull(c);
        c.owner = { id: me.id, name: me.name };
        c.obligations = (c.obligations || []).filter(o => !/monthly volume report|within thirty days of invoice/i.test(String(o && o.desc || '')));
        c.triage = { v: 1, at: now, seenAt: now, steps: { oblig: { ok: true, found: [
          { desc: 'Send the monthly volume report', party: 'theirs', clause: '2', quote: 'The Supplier shall send a monthly volume report.' },
          { desc: 'Pay each invoice within thirty days of invoice', party: 'ours', clause: '1', quote: 'payable within thirty days' } ] } } };
        out[id] = { status: c.status, owner: contractOwnedBy(c, me), waiting: obReviewWaiting(c).length };
      }
      return out;
    }, [SIGNED, LIVE]);
    check('0 · stage: a signed and a live contract, each the reader’s, each with 2 promises found and undecided',
      stage[SIGNED].status === 'Signed' && stage[LIVE].status !== 'Signed' && stage[SIGNED].owner && stage[SIGNED].waiting === 2 && stage[LIVE].waiting === 2, stage);

    /* ---- 1 · Needs you ---- */
    const need = await page.evaluate(([a, b]) => {
      const L = needsYouOf(getContract(a)).filter(x => x.kind === 'promises');
      const w = L[0] ? insNeedWords(getContract(a), L[0]) : null;
      return { n: L.length, count: L[0] ? L[0].n : 0, urgent: !!(L[0] && L[0].urgent), title: w ? w.title : '', plain: w ? w.plain : '',
        desk: ndRead().you.some(r => r.key === 'c:' + a + ':promises'), live: needsYouOf(getContract(b)).some(x => x.kind === 'promises') };
    }, [SIGNED, LIVE]);
    check('1a the signed contract holds one row, not urgent: "Jambo found 2 promises to confirm"',
      need.n === 1 && need.count === 2 && !need.urgent && need.title === 'Jambo found 2 promises to confirm' && /Nobody is reminded/.test(need.plain), need);
    check('1b the one desk carries it, so Home and the bell count it', need.desk, need);
    check('2 the same finds on a contract still in negotiation give no row', !need.live, need);
    /* Home shows the first three; the whole list is the Board's "Show all", narrowed to duties */
    await page.evaluate(() => setView('counter'));
    await page.evaluate(() => ndOpenBoard('you'));
    if (await until(page, () => !!document.querySelector('[data-nd-kind="duty"]'), null, 8000)) await page.click('[data-nd-kind="duty"]');
    const sel = `.nd-br[data-nd-row="c:${SIGNED}:promises"]`;
    const homeRow = await until(page, s => !!document.querySelector(s), sel, 8000);
    const row = await page.evaluate(s => { const r = document.querySelector(s); const b = r && r.querySelector('button');
      return { text: r ? r.textContent.replace(/\s+/g, ' ').trim() : '', btn: b ? b.textContent.trim() : '' }; }, sel);
    check('1c the full Needs you list shows the row with its one-word button "Review"', homeRow && /promises to confirm/.test(row.text) && row.btn === 'Review', row);

    /* ---- 5 · the owner's three screens: the row whole ---- */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]){
      await page.setViewportSize({ width: w, height: ht });
      await until(page, s => !!document.querySelector(s), sel, 6000);
      const fit = await page.evaluate(s => {
        const r = document.querySelector(s); if (!r) return { row: false };
        const rr = r.getBoundingClientRect(), b = r.querySelector('button'), br = b && b.getBoundingClientRect();
        const t = r.querySelector('.nd-c-what b'), tr = t && t.getBoundingClientRect();
        return { row: true, side: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
          btnIn: !!br && br.right <= rr.right + 1 && br.left >= rr.left - 1, btnOneLine: !!br && br.height <= 40,
          titleIn: !!tr && tr.right <= rr.right + 1 && t.scrollWidth <= t.clientWidth + 1 };
      }, sel);
      check(`5 ${w}×${ht}: the row is whole — its words and its button inside it, the button on one line, nothing sideways`,
        fit.row && fit.side && fit.btnIn && fit.btnOneLine && fit.titleIn, fit);
      if (OUT) await page.screenshot({ path: path.join(OUT, `found-promises-home-${w}x${ht}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    /* ---- 3 · Review opens the desk on the two, nothing ticked ---- */
    if (homeRow) await page.click(`${sel} button`);
    const desk = await until(page, () => document.querySelectorAll('.obd-row').length >= 2, null, 8000);
    const d = await page.evaluate(() => ({ rows: [...document.querySelectorAll('.obd-row')].map(r => r.querySelector('.obd-desc') && r.querySelector('.obd-desc').textContent),
      ticked: [...document.querySelectorAll('.obd-row .obd-tick')].filter(x => x.checked).length }));
    check('3 Review opens the review desk on the two found, nothing ticked', desk && d.rows.length === 2 && d.ticked === 0, d);
    if (OUT) await page.screenshot({ path: path.join(OUT, 'found-promises-desk.png') });

    /* ---- 4 · each decided at the desk: the row goes ---- */
    let decided = false;
    if (desk){
      await page.click('.obd-row[data-obd-sel="0"]');
      if (await until(page, () => !!document.querySelector('[data-obd-skip]'), null, 4000)) await page.click('[data-obd-skip]');
      await until(page, () => !!document.querySelector('.obd-row[data-obd-sel="0"].is-done'), null, 4000);
      await page.click('.obd-row[data-obd-sel="1"]');
      if (await until(page, () => !!document.querySelector('[data-obd-skip]'), null, 4000)) await page.click('[data-obd-skip]');
      decided = await until(page, id => obReviewWaiting(getContract(id)).length === 0, SIGNED, 6000);
    }
    const gone = await page.evaluate(id => !needsYouOf(getContract(id)).some(x => x.kind === 'promises') && !ndRead().you.some(r => r.key === 'c:' + id + ':promises'), SIGNED);
    check('4 once each is decided at the desk, the row is gone', decided && gone, { decided, gone });

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the stage ran to the end', false, String(e && e.message || e).split('\n')[0]);
  } finally {
    await browser.close();
    await h.stop();
    const failed = results.filter(r => !r.pass).length;
    console.log(`\n${results.length - failed} of ${results.length} passed`);
    process.exit(failed ? 1 : 0);
  }
})();
