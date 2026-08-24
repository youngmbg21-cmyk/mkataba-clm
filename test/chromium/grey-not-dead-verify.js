/* Chromium verification of GREY, NOT DEAD.
   ============================================================
   f242 pins the SOURCE — one reading decides both what a button does and
   whether it draws live, and every reason exists in both languages. Four
   claims cannot be made there at all, and the first is the reason this file
   exists rather than a second source check:

     1  WHICH BUTTONS A READER ACTUALLY MEETS. Measuring the running product
        is the only way to learn it, and here it overturned an assumption:
        the batch Accept all / Reject all pair — two of the seven the work
        order named — is drawn on NO SEAT today. It left the owner's page and
        the counterparty's page on the same day (10 Aug 2026), and the three
        builders that still emit it are reached only through
        openNegotiationRoom, whose one live caller fires solely when that room
        is already open. CLAUDE.md's line "their seat keeps them" is stale.
        The guard on that pair was still repaired — it was genuinely wrong, it
        costs nothing, and the builders are exported — but it is asserted here
        as an ABSENCE, so nobody reads the fix as covering a live screen.

     2  THE BROWSER MUST REALLY REFUSE THE PRESS. `disabled` is what makes a
        dimmed control unclickable and tells a keyboard reader why. A button
        merely styled to look dim still fires, and no source check can tell
        the two apart.

     3  A GREY BUTTON MUST CARRY ITS REASON. A dimmed control that cannot say
        why is a wall — worse than a silent press, because the reader cannot
        even try.

     4  AND IT MUST COME BACK. The half that matters most: a button wrongly
        greyed locks the reader out with nothing on screen to say why. Both
        live grey-outs are asserted BOTH WAYS in one run, on one contract,
        with the state changed in between through the app's own doors.

   Run: node test/chromium/grey-not-dead-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* Read a control the way a reader meets it: is it painted, does the BROWSER
   itself refuse the press, and does it say why. A real function, not an
   expression string — page.evaluate only forwards an argument to a function. */
const READ = sel => {
  const b = document.querySelector(sel);
  if (!b) return null;
  const r = b.getBoundingClientRect(), cs = getComputedStyle(b);
  return { drawn: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !b.hidden,
    disabled: !!b.disabled, aria: b.getAttribute('aria-disabled'),
    title: (b.title || '').trim(), opacity: Number(cs.opacity), cursor: cs.cursor };
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await pause(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await pause(2200);

  const cid = await page.evaluate(async () => {
    const c = window.state.contracts.find(x => x.status === 'Under Review')
      || window.state.contracts.find(x => x.status !== 'Signed');
    await (window.ensureFull ? window.ensureFull(c) : Promise.resolve());
    window.openWorkspace(c.id);
    await new Promise(r => setTimeout(r, 900));
    return c.id;
  });
  check('a real contract is open', !!cid, cid);

  /* ---------- 1 · THE BATCH PAIR IS ON NO SEAT — MEASURED, NOT ASSUMED ---------- */
  await page.evaluate(id => openRedlineWorkbench(id), cid);
  await pause(2000);
  const onOwner = await page.evaluate(() =>
    ['nego-bulk-acc', 'nego-bulk-rej', 'nego-all-acc', 'nego-all-rej']
      .filter(id => document.getElementById(id)));
  check("the owner's negotiation page draws no batch verbs",
    onOwner.length === 0, onOwner.join(', ') || 'none');

  const tok = await page.evaluate(async id => {
    const full = await api('contracts/' + id);
    const payload = buildSharePayload(full, await sha256(canonicalDoc(full)), null, { purpose: 'negotiate' });
    /* DURABLE, because that is what a negotiate link IS: a one-shot link is
       spent by its first answer and its whole verb row stands down, which
       stages a page the product does not make. */
    const r = await api('shares', 'POST', { payload, channel: 'link', durable: true,
      recipient: { name: 'Saw Sawa LLC', email: 'ola@sawsawa.se' }, purpose: 'negotiate' });
    return (r && r.token) || null;
  }, cid);
  const cp = await ctx.newPage();
  cp.on('pageerror', e => errors.push('counterparty: ' + e.message));
  await cp.goto(h.base + '/#share=t:' + tok, { waitUntil: 'networkidle' });
  await pause(2800);
  const onCp = await cp.evaluate(() =>
    ['nego-bulk-acc', 'nego-bulk-rej', 'nego-all-acc', 'nego-all-rej']
      .filter(id => document.getElementById(id)));
  check("nor does the counterparty's — CLAUDE.md's \"their seat keeps them\" is stale",
    onCp.length === 0, onCp.join(', ') || 'none');
  check('so the batch-pair repair is correct and reaches no live screen — said out loud',
    onOwner.length === 0 && onCp.length === 0);
  await cp.close();

  /* ---------- 2 · RESTORE THIS VERSION — DEAD, THEN LIVE ---------- */
  /* Two versions whose wording really DIFFERS, or the second capture is a
     duplicate of the first and the picker has nothing to offer. */
  const staged = await page.evaluate(async id => {
    const c = window.getContract(id);
    window.captureVersion(c, 'as it was', 'Amina Otieno');
    const was = c.redlineText || '';
    c.redlineText = was + '<p>An added paragraph, so the two versions differ.</p>';
    window.captureVersion(c, 'after an edit', 'Amina Otieno');
    /* Put the wording back to EXACTLY v1, so restoring v1 would change nothing. */
    c.redlineText = was;
    window.persist(c);
    window.openCompareModal(c);
    await new Promise(r => setTimeout(r, 900));
    return (c.versions || []).length;
  }, cid);
  check('two versions are on the record', staged >= 2, String(staged));

  /* The picker opens on the newest; pick the one the wording already matches. */
  await page.evaluate(() => {
    const sel = document.getElementById('cmp-a');
    const same = [...sel.options].find(o => /as it was/i.test(o.textContent));
    if (same) { sel.value = same.value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await pause(500);
  const resBefore = await page.evaluate(READ, '#cmp-restore');
  check('Restore is drawn — greyed, never hidden', resBefore && resBefore.drawn,
    resBefore && String(resBefore.drawn));
  check('and the BROWSER refuses the press when it would change nothing',
    resBefore && resBefore.disabled === true);
  check('and a keyboard reader is told', resBefore && resBefore.aria === 'true',
    resBefore && resBefore.aria);
  check('and it says WHY on hover, rather than leaving a wall',
    resBefore && /already reads|redan/i.test(resBefore.title), resBefore && resBefore.title);

  const vBefore = await page.evaluate(id => (window.getContract(id).versions || []).length, cid);
  await page.locator('#cmp-restore').click({ force: true, timeout: 3000 }).catch(() => {});
  await pause(600);
  const vAfter = await page.evaluate(id => (window.getContract(id).versions || []).length, cid);
  check('a forced press on it restores nothing', vBefore === vAfter, `${vBefore} → ${vAfter}`);

  /* Now pick the version the wording does NOT match. */
  await page.evaluate(() => {
    const sel = document.getElementById('cmp-a');
    const diff = [...sel.options].find(o => /after an edit/i.test(o.textContent));
    if (diff) { sel.value = diff.value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await pause(500);
  const resAfter = await page.evaluate(READ, '#cmp-restore');
  check('Restore comes back to life for a version that WOULD change the wording',
    resAfter && resAfter.disabled === false, resAfter && String(resAfter.disabled));
  check('and its tooltip becomes what it does, not why it cannot',
    resAfter && resBefore && resAfter.title !== resBefore.title,
    resAfter && resAfter.title.slice(0, 60));
  await page.evaluate(() => window.closeModal && window.closeModal());
  await pause(400);

  /* ---------- 3 · RESUBMIT IS PROVED AT SOURCE, NOT HERE — SAID OUT LOUD ----------
     Its panel draws the button only for the contract's OWNER, and staging a
     workspace where approvalPanelHtml renders that state is more fixture than
     this file can carry honestly. f242 asserts it both ways off the source:
     the guard reads the chain's own rejected/stale steps — the same set
     resubmitApproval itself requires — and the reason is on the tooltip. What
     is NOT browser-proved is the disabled attribute reaching that particular
     button, and that is written down rather than quietly skipped. */

  check('no page errors through the whole journey', errors.length === 0, errors.slice(0, 3).join(' | '));

  await ctx.close();
  await browser.close();
  await h.stop();

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
