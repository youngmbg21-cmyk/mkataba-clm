/* ============================================================
   export-button-verify — the round's Export button actually exports
   ============================================================
   WHY THIS FILE EXISTS. Until 21 Aug 2026 the negotiation's Export button
   called `exportContractPdf`, a name nothing in this product defines, through a
   `window.` guard. The guard was therefore always false, the else branch was
   the only branch that had ever run, and the button had never once produced a
   file. It was HONEST about it — it said "Export is unavailable on this page"
   rather than doing nothing — which is the only reason nobody reported it, and
   is also why every existing test passed: they all asked whether the button was
   drawn and what it SAID. Nothing pressed it.

   The owner's ruling was to keep the button and make it work, so this is the
   file that says it works. It presses the real control on the real page and
   reads what came out.

   HOW AN EXPORT IS OBSERVED WITHOUT A PRINTER. exportPDF (js/views/portal.js)
   writes the finished sheet into #print-root and then calls window.print(). So
   the two things worth knowing — did it reach the exporter, and did the
   exporter produce the contract — are both readable in the page: print is
   stubbed and counted, and #print-root is read for the agreement's own words.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'export-button');

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  fs.mkdirSync(OUT, { recursive: true });

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* A contract with a NEGOTIATION on it, settled. The button is refused while
       anything is still pending — deliberately, because a clean copy of a
       contract half the parties are still arguing about is a misleading
       document — so the state under test is "everything is agreed". */
    const setUp = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Declined');
      if (!c) return null;
      state.activeId = c.id; state.selId = c.id;
      /* Through the model's own funnel, not by writing changes by hand: a
         change staged into the array is not a change this product filed. */
      const cl = (typeof negoClauseList === 'function') ? negoClauseList(c) : [];
      if (cl.length && typeof negoEditClause === 'function') {
        /* AWAITED. negoEditClause is async — it fingerprints the change, which
           is a crypto call — so firing and forgetting it leaves the round empty
           and the check measuring an export of nothing. */
        await negoEditClause(c, cl[0].clauseId, '<p>Amended by the export check.</p>',
          { why: 'so there is a round to export' });
      }
      /* …and settled, so the refusal does not fire. */
      (c.changes || []).filter(x => x.status === 'pending').forEach(ch => {
        if (typeof negoResolve === 'function')
          negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Admin' });
      });
      return { id: c.id, name: c.name,
        changes: (c.changes || []).length,
        pending: (c.changes || []).filter(x => x.status === 'pending').length };
    });
    check('a contract with a settled round to export', !!setUp && setUp.pending === 0,
      setUp ? `${setUp.changes} change(s), ${setUp.pending} pending` : 'no contract');

    /* THE REAL CONTROL, ON THE REAL PAGE — pressed, not called. A synthetic
       call to the handler would prove only that the function runs when you run
       it; the fault being guarded against is a BUTTON that reaches nothing.
       The room is where negoRoomActionsHtml draws it.
       roomGoTab('redline') goes to the negotiation PAGE — a different surface
       since "Negotiate is a place, not a tab" — and that page has no Export. */
    await page.evaluate(() => {
      const c = getContract(state.activeId);
      if (typeof openNegotiationOwnerRoom === 'function') openNegotiationOwnerRoom(c);
    });
    await page.waitForTimeout(1500);
    const there = await page.evaluate(() => {
      const b = document.getElementById('nego-export');
      if (!b) return { there: false };
      const r = b.getBoundingClientRect();
      return { there: true, disabled: b.hasAttribute('disabled'),
        visible: r.width > 0 && r.height > 0, label: (b.textContent || '').trim() };
    });
    check('the Export button is on the page as visible pixels',
      there.there && there.visible, JSON.stringify(there));
    check('and it is live, because the round is settled', there.there && !there.disabled,
      there.disabled ? 'drawn disabled' : '');

    const exported = await page.evaluate(async () => {
      window.__printed = 0;
      const realPrint = window.print;
      window.print = () => { window.__printed++; };
      const root = document.getElementById('print-root');
      if (root) root.innerHTML = '';
      const btn = document.getElementById('nego-export');
      if (!btn) return { pressed: false };
      btn.click();
      await new Promise(r => setTimeout(r, 900));
      const out = document.getElementById('print-root');
      window.print = realPrint;
      return { pressed: true, printed: window.__printed,
        len: out ? out.innerHTML.length : 0,
        text: out ? (out.textContent || '').replace(/\s+/g, ' ').trim() : '' };
    });
    check('pressing it reaches the exporter, not a dead guard',
      exported.pressed && exported.printed === 1, `print called ${exported.printed} time(s)`);
    check('and a print sheet was built, not left empty',
      exported.len > 500, `${exported.len} chars of markup`);
    /* THE CONTRACT'S OWN WORDS, not merely "something rendered". An exporter
       that produced a branded empty page would pass every check above. */
    check('the sheet carries this agreement',
      !!setUp && exported.text.includes(setUp.name.split('—')[0].trim().slice(0, 18)),
      exported.text.slice(0, 80));
    check('and the wording that was agreed in the round',
      /Amended by the export check/.test(exported.text),
      /Amended by the export check/.test(exported.text) ? '' : 'the adopted wording is not on the sheet');

    await page.screenshot({ path: path.join(OUT, '01-exported.png') });

    /* AND IT IS WRITTEN DOWN. Our own exports are audited — that is the rule
       exportPDF already keeps, and it is worth pinning here because the seat
       that must NOT write (the counterparty's) shares this component. */
    const audited = await page.evaluate(() => {
      const c = getContract(state.activeId);
      return (c.audit || []).filter(a => /Export/i.test(a.action || '')).length;
    });
    check('the export is on the record, as our own exports are', audited >= 1,
      `${audited} audit line(s)`);

    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed · shots in ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
