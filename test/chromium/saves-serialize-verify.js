/* ============================================================
   saves-serialize-verify — THE CONFLICT WINDOW DOES NOT OPEN ON ITS OWN
   ============================================================
   Young, 15 Sep 2026: "this pop up appears for no reason at times so please
   fix it", over "This contract just changed on the server — Someone else saved
   a change to MK-291 while you were editing".

   f314 holds the reading; only a real browser can hold the RACE, because the
   fault is two saves overlapping in time and nothing in a source file says how
   long a PUT takes. So the PUT is held here on purpose — the network a long
   contract really has — and the contract is edited twice across that window,
   which is exactly what a person typing does.

   AGAINST THE CODE OF AN HOUR BEFORE this opens the window with nobody else on
   the record: the second save leaves carrying the version the first one has
   already spent.
   ============================================================ */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const b = await chromium.launch({ executablePath: EXEC });
  const page = await b.newPage({ viewport: { width: 1440, height: 940 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  /* THE PUT IS SLOW, which is the whole point: 400ms of debounce against a
     save that takes longer than that is the window the fault lives in. Every
     other request is untouched. */
  const puts = [];
  await page.route('**/api/contracts/*', async route => {
    const req = route.request();
    if (req.method() !== 'PUT') return route.continue();
    puts.push(Date.now());
    await pause(900);
    return route.continue();
  });

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(1800);

  const cid = await page.evaluate(() => {
    const c = (state.contracts || []).find(x => x && x.id);
    if (c) openWorkspace(c.id);
    return c && c.id;
  });
  await page.waitForTimeout(1600);
  ok('a contract is open to save', !!cid, cid || 'none');

  /* TWO EDITS ACROSS THE SLOW SAVE — a person typing, with the second keystroke
     landing while the first save is still in the air. */
  const before = await page.evaluate(id => (getContract(id) || {})._v, cid);
  await page.evaluate(id => { const c = getContract(id); c.name = c.name + ' A'; persist(c); }, cid);
  await page.waitForTimeout(650);          // past the 400ms debounce, inside the 900ms PUT
  await page.evaluate(id => { const c = getContract(id); c.name = c.name + ' B'; persist(c); }, cid);
  await page.waitForTimeout(4000);

  const out = await page.evaluate(id => {
    const c = getContract(id) || {};
    /* confirmDialog mounts its own overlay (#confirm-overlay), so that is what
       is asked — a selector that cannot see the window would make this claim a
       description that passes on the very fault it is for. */
    const dlg = document.getElementById('confirm-overlay') || document.getElementById('modal-root');
    const txt = dlg ? (dlg.textContent || '') : '';
    return { v: c._v, name: c.name, asked: /changed on the server/i.test(txt), dlg: !!dlg };
  }, cid);

  /* THE HEADLINE. */
  ok('no conflict window opened — nobody else touched the record',
     out.asked === false, out.asked ? 'the window was raised' : 'quiet');
  ok('both edits reached the server, one save after the other',
     out.v >= (before || 0) + 2, `version ${before} → ${out.v}`);
  ok('and the wording on the record is the later of the two',
     /A B$/.test(String(out.name || '')), String(out.name || ''));
  ok('the saves did not overlap in time',
     puts.length >= 2 && puts.every((t, i) => i === 0 || t - puts[i - 1] >= 850),
     puts.map((t, i) => (i ? t - puts[i - 1] : 0) + 'ms').join(' · '));
  ok('no page errors along the way', errs.length === 0, errs.slice(0, 2).join(' | ') || 'none');

  /* ============================================================
     2. AN EMPTY FLUSH MUST NOT STOP THE NEXT ONE
     ============================================================
     Young, 16 Sep 2026, off the round-delivery check: a counterparty's
     acceptance showed on the owner's screen while the record read back off the
     server still said pending.

     THE SHAPE IS ORDINARY AND IT IS EVERYWHERE. `persist` sets a 400 ms timer;
     several callers then drain the queue BY HAND straight afterwards, because
     they must have the write on the server before the page repaints over it
     (applyResponse does, auto-triage does, every "save now" door does). The
     hand drain empties the queue, and 400 ms later the timer fires on an EMPTY
     one. That empty flush is the one that used to poison the latch, and from
     then on nothing this browser did was ever saved again.

     So this drives exactly that sequence and then asks the only question that
     matters: does the NEXT edit reach the server. Nothing is held back here —
     the fault needs an ordinary fast network, not a slow one. */
  await page.unroute('**/api/contracts/*');
  await page.waitForTimeout(500);

  const seq = await page.evaluate(async id => {
    const c = getContract(id);
    c.name = c.name + ' C';
    persist(c);                 // sets the 400ms timer
    await flushSaves();         // and the queue is drained by hand first
    return (getContract(id) || {})._v;
  }, cid);
  await page.waitForTimeout(900);   // the stale timer fires on an empty queue

  const third = await page.evaluate(async id => {
    const c = getContract(id);
    c.name = c.name + ' D';
    persist(c);
    return c.name;
  }, cid);
  await page.waitForTimeout(2500);

  const land = await page.evaluate(async id => {
    const c = getContract(id) || {};
    const srv = await api('contracts/' + id);
    return { mem: c.name, srv: srv && srv.name, v: c._v, queued: dirty.size };
  }, cid);

  /* AT THE PARENT: the queue still holds the contract, the server still carries
     the wording from before the empty flush, and nothing anywhere said so. */
  ok('an edit after an empty flush still reaches the server',
     land.srv === third, `record "${land.srv}" · screen "${land.mem}"`);
  ok('and the queue is empty afterwards, not silently holding work',
     land.queued === 0, `${land.queued} contract(s) still queued`);
  ok('the version moved for it, so the write really happened',
     land.v > seq, `v${seq} → v${land.v}`);

  await b.close(); await h.stop();
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
