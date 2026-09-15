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

  await b.close(); await h.stop();
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
