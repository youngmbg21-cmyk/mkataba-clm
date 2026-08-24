/* Chromium verification: A CONTRACT'S STAGE FOLLOWS WHAT WAS DONE TO IT.
   ============================================================
   Owner-reported 23 Aug 2026: a contract negotiated for a week, with the
   counterparty signalling they were ready to sign, still read "Drafting" at the
   top of its own page. Two faults pulling opposite ways — nothing promoted on
   the commonest send, and opening a different negotiation demoted the one you
   left. f241 pins what the code says; this file drives it.

   WHY A BROWSER, and it is not a preference. `contractLeavesDrafting` cannot be
   reached in a node test at all: buildWorld deliberately never loads the shell
   (f215's rule), and MEASURED on a built world the function is `undefined`,
   because world.js stands its own logAudit and todayStr in for core.js's. And
   the promotion only happens at the end of a REAL send — a link minted against
   a real server, a payload posted, record() reached. There is nowhere else that
   journey exists.

   THE STAGING IS THE CAREFUL PART. A first round has no standing link to
   refresh, so counterpartyContact must resolve from the RECORD — hence the
   address written on the contract before the press. That is the honest shape of
   the reported case: a contract drafted from the wizard, a counterparty typed
   on Key terms, and every round thereafter published from the negotiation page
   without the share dialog ever being opened.

   Run: node test/chromium/drafting-stage-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

/* THE REPORTED SCALE, seeded rather than assumed. The standard world holds two
   live contracts; the fault was about a book of eighteen, where clicking
   through them demoted them one press at a time. Six is enough to show a walk
   and cheap enough to stage. */
const FOLDER_A = 'proc', FOLDER_B = 'sales';
const BOOK = [
  { ...fixtureContract('MK-A1', 'Refined Sugar Supply', 'Kabras Sugar', FOLDER_A, 48000000, 'Signed'),
    counterpartyEmail: 'procurement@kabras.co.ke' },
  fixtureContract('MK-A2', 'Raw Milk Collection', 'Nandi Dairy', FOLDER_A, 36000000, 'Under Review'),
  fixtureContract('MK-B2', 'Retail Supply — Coast', 'Naivas Supermarkets', FOLDER_B, 78000000, 'Under Review'),
  fixtureContract('MK-C1', 'Co-Packing — Juno', 'Juno Limited', FOLDER_B, 40000000, 'Under Review'),
  fixtureContract('MK-C2', 'Packaging Supply', 'Juno Limited', FOLDER_A, 12000000, 'Under Review'),
  fixtureContract('MK-C3', 'Warehousing — AIT', 'AIT Worldwide', FOLDER_B, 2500000, 'Under Review'),
  fixtureContract('MK-C4', 'Equipment Lease', 'Juno Limited', FOLDER_A, 9000000, 'Under Review'),
];

const OUT = path.join(__dirname, 'shots', 'drafting-stage');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);

    /* ============================================================
       1 · PUBLISHING A ROUND TAKES A CONTRACT OUT OF DRAFTING
       ============================================================ */
    const staged = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      await ensureFull(c);
      /* THE REPORTED SHAPE: a draft with a counterparty on the record and no
         share link yet, negotiated from the negotiation page alone. */
      c.status = 'Draft';
      c.counterparty = c.counterparty || 'Juno Limited';
      c.counterpartyEmail = 'deals@juno.example';
      negoInit(c);
      const cl = negoClauseList(c);
      await negoEditClause(c, cl[0].clauseId,
        cl[0].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(+String(m).replace(/,/g, '') + 500)),
        { author: 'Amina Otieno', side: 'owner', why: 'Matches this year’s volumes.' });
      persist(c); await flushSaves();
      return { id: c.id, status: c.status };
    });
    check('1a staged: a real draft with a change on the table',
      staged.status === 'Draft', staged);

    await page.evaluate(id => openRedlineWorkbench(id), staged.id);
    await pause(2200);
    const before = await page.evaluate(() => {
      const e = document.getElementById('ws-status');
      return { word: e ? e.textContent.trim() : null,
        status: getContract(redlineHeldId()).status };
    });
    check('1b the head says Drafting, as the owner saw it',
      before.status === 'Draft' && /draft/i.test(before.word || ''), before);
    await page.screenshot({ path: path.join(OUT, '01-before.png') });

    /* THE REAL PRESS, not the model. Publish Round is a proxy onto the page's
       one postbox, so this exercises the whole send. */
    const pressed = await page.evaluate(() => {
      const b = [...document.querySelectorAll('#ws-head .room-acts button')]
        .find(x => /publish round/i.test(x.textContent || ''));
      if (!b) return false;
      b.click(); return true;
    });
    check('1c Publish Round is on the row and was pressed', pressed);
    await pause(4000);
    await page.screenshot({ path: path.join(OUT, '02-after.png') });

    const after = await page.evaluate(() => {
      const c = getContract(redlineHeldId());
      const e = document.getElementById('ws-status');
      return { status: c.status,
        word: e ? e.textContent.trim() : null,
        audit: (c.audit || []).map(a => `${a.action}: ${a.detail}`),
        round: (c.negotiation && c.negotiation.round) || null };
    });
    check('1d THE REPORTED FAULT: publishing a round leaves Drafting behind',
      after.status === 'Under Review', { status: after.status });
    check('1e and the head says so without a reload',
      /review/i.test(after.word || ''), { word: after.word });
    check('1f the record says what moved it',
      after.audit.some(l => /Status changed.*Under Review/.test(l)),
      after.audit.filter(l => /Status changed/.test(l)));
    check('1g and nothing claims it went back to Draft',
      !after.audit.some(l => /back to Draft/.test(l)),
      after.audit.filter(l => /Draft/.test(l)).slice(0, 3));

    /* IT REACHES THE LIST TOO — the register is where this was most wrong. */
    await page.evaluate(() => setView('register'));
    await pause(1800);
    const row = await page.evaluate(id => {
      const tr = document.querySelector(`#reg-tbody tr[data-row="${id}"]`);
      if (!tr) return { absent: true };
      return { chip: (tr.querySelector('.badge') || {}).textContent || '' };
    }, staged.id);
    check('1h and the contracts list agrees',
      !row.absent && /review/i.test(row.chip), row);

    /* ============================================================
       2 · OPENING A DIFFERENT NEGOTIATION MOVES NOBODY'S STAGE
       ============================================================ */
    const bench = await page.evaluate(async () => {
      /* Five live negotiations, all under review — the shape that made the
         reported fault: eighteen of them, demoted one press at a time. */
      const live = state.contracts
        .filter(x => x.status !== 'Signed' && x.status !== 'Declined');
      for (const c of live){
        await ensureFull(c); c.status = 'Under Review'; negoInit(c);
        const cl = negoClauseList(c);
        if (cl[0] && !(c.changes || []).length)
          await negoEditClause(c, cl[0].clauseId,
            cl[0].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(+String(m).replace(/,/g, '') + 11)),
            { author: 'Amina Otieno', side: 'owner', why: 'Round one.' });
        persist(c);
      }
      await flushSaves();
      return live.map(c => c.id);
    });
    check('2a staged: a book of live negotiations, all under review',
      bench.length >= 5, { n: bench.length, ids: bench });

    for (const id of bench){
      await page.evaluate(i => openRedlineWorkbench(i), id);
      await pause(900);
    }
    await page.screenshot({ path: path.join(OUT, '03-after-walk.png') });

    const walked = await page.evaluate(ids => ids.map(i => {
      const c = getContract(i);
      return { id: i, status: c.status,
        demoted: (c.audit || []).some(a => /back to Draft/.test(a.detail || '')) };
    }), bench);
    check('2b WALKING THE WHOLE BOOK DEMOTES NOBODY',
      walked.every(x => x.status === 'Under Review'),
      walked.map(x => `${x.id}:${x.status}`));
    check('2c and writes nothing to anybody’s history about it',
      walked.every(x => !x.demoted), walked.filter(x => x.demoted));
    check('2d the bench still records which contract is on it',
      await page.evaluate(() => redlineHeldId()) === bench[bench.length - 1]);

    /* THE ANNOUNCEMENT THAT NEVER WAS. The removed feature rested on a toast
       that was a BARE call and therefore drew nothing — the reason nobody could
       see this happening. Whatever else is on screen, that sentence is not. */
    const toasts = await page.evaluate(() =>
      [...document.querySelectorAll('#toast-root *')].map(e => e.textContent || '').join(' | '));
    check('2e nothing on screen says a contract was moved back',
      !/back to Draft/i.test(toasts), toasts.slice(0, 160));

    /* ============================================================
       3 · THE BOUNDS THAT MATTERED UNDER THE OLD RULE STILL HOLD
       ============================================================ */
    const sealed = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status === 'Signed');
      if (!c) return { none: true };
      await ensureFull(c); negoInit(c); persist(c); await flushSaves();
      return { id: c.id, before: c.status };
    });
    if (sealed.none) check('3a a signed contract exists to test with', false, sealed);
    else {
      await page.evaluate(id => openRedlineWorkbench(id), sealed.id);
      await pause(1400);
      await page.evaluate(id => openRedlineWorkbench(id), bench[0]);
      await pause(1400);
      const still = await page.evaluate(id => getContract(id).status, sealed.id);
      check('3a A SIGNED CONTRACT IS NEITHER DEMOTED NOR PROMOTED',
        still === 'Signed', { was: sealed.before, now: still });
    }

    check('no page errors anywhere in this run', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    check('the run completed', false, String(e && e.message || e));
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) { failed.forEach(f => console.log('  FAILED: ' + f.name)); process.exit(1); }
})();
