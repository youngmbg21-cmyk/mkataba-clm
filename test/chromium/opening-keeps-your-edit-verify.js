/* OPENING A CONTRACT NEVER UNDOES AN EDIT — measured in a real browser
   (the owner's list, 27 Sep 2026).

   "Opening a contract can quietly undo a change you made a moment before."
   The loader every screen uses to fetch the whole record (ensureFull, js/core.js)
   copied the stored record over the one on screen, and an edit waits in the save
   queue before it leaves. Take a contract off hold from its row and open it at
   once, and the copy put the stored hold back on the very object the queue then
   saved: the room said the contract was still on hold, and the server wrote the
   hold back — with nothing said to anybody.

   Driven the way a person does it, on the real app: the Contracts page's full
   table (where one press opens a row), MK-A2 staged ON HOLD, its own ⋯ pressed,
   Release from hold, and the row pressed straight away. The save is HELD on its
   way (the route answers it 1.5 s late) so the open meets it in flight whatever
   the machine's speed. A release is the telling edit: it takes a field AWAY,
   and a copy of the stored record puts it straight back — a field ADDED on
   screen survives a copy that does not carry it, which is why the fault stayed
   quiet for so long. Section 2 is the other half: an edit made WHILE the open's
   own read is out (that answer held back instead).

   Against the parent this file reports 1b, 1c, 2b and 2c red — the room says
   the contract is still on hold, the server writes the hold back, and the edit
   made during the read is thrown away on screen and on file. 1a and 2a are the
   stage; 3 is the CONTROL that a row opened with nothing pending still loads
   its whole record; 4 is the error sweep. */
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
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  { /* MK-A2 on hold, on file, before anybody opens a page. */
    const c = await W.admin.json('/api/contracts/MK-A2');
    const v = c._v; delete c._v;
    c.hold = { at: '2026-09-26T09:00:00Z', by: 'Amina Otieno', why: 'Disputed delivery — hold while legal looks' };
    await W.admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: c, baseVersion: v } });
  }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2200);
    /* The full table, where one press opens a row (the Inspector's own stage
       door; a selection there loads the record first and would hide nothing). */
    await page.evaluate(() => { if (window.insForce) insForce(false); setView('register'); });
    await page.waitForTimeout(900);

    const stored = async id => page.evaluate(async x => {
      const r = await fetch('/api/contracts/' + x, { credentials: 'same-origin' });
      return r.json();
    }, id);

    /* ================= 1 · AN EDIT ON ITS WAY, THEN THE OPEN ================= */
    await page.route('**/api/contracts/MK-A2', async route => {
      if (route.request().method() === 'PUT') await sleep(1500);
      await route.continue();
    });
    const before = await page.evaluate(() => {
      const c = getContract('MK-A2');
      return { light: !!(c && c._light), loaded: !!(c && c._loaded), hold: !!(c && c.hold),
        row: !!document.querySelector('#reg-tbody tr[data-row="MK-A2"]') };
    });
    check('1a GATE — MK-A2 is a list row nobody has loaded, on hold, and drawn',
      before.light && !before.loaded && before.hold && before.row, JSON.stringify(before));
    if (before.row) {
      await page.click('#reg-tbody [data-menu="MK-A2"]');
      await page.waitForTimeout(200);
      await page.click('#reg-tbody [data-menu-pop="MK-A2"] [data-act="release"]');
      await page.click('#reg-tbody tr[data-row="MK-A2"] .reg-title');   // straight away, the way a person does
    }
    await page.waitForTimeout(3200);
    const room = await page.evaluate(() => {
      const c = getContract('MK-A2');
      /* The status word the head prints (contractStatusTextHtml) — never the
         head's whole text, whose menu offers "Put on hold" once released. */
      const stat = ((document.querySelector('#ws-head .room-stat') || {}).textContent || '').trim();
      return { view: state.view, active: state.activeId, hold: !!(c && c.hold), stat, onHoldWord: /^on hold/i.test(stat) };
    });
    check('1b the contract room opens on it, released — the hold it was just taken off is not back',
      room.view === 'workspace' && room.active === 'MK-A2' && !room.hold && !!room.stat && !room.onHoldWord, JSON.stringify(room));
    /* One more ordinary save of the same contract — whatever the screen holds
       is what gets written, so a hold put back on screen is put back on file. */
    await page.evaluate(async () => { const c = getContract('MK-A2'); persist(c); await flushSaves(); });
    await page.waitForTimeout(400);
    const s1 = await stored('MK-A2');
    check('1c and it is released on file after the next save', !!s1 && !s1.hold, JSON.stringify(s1 && s1.hold || null));
    await page.unroute('**/api/contracts/MK-A2');

    /* ================= 2 · AN EDIT MADE WHILE THE OPEN'S READ IS OUT ================= */
    await page.evaluate(() => { setView('register'); });
    await page.waitForTimeout(700);
    let heldRead = null;
    await page.route('**/api/contracts/MK-B2', async route => {
      if (route.request().method() !== 'GET') return route.continue();
      const resp = await route.fetch();                  // the stored record as it is NOW
      heldRead = true;
      await sleep(1500);                                 // …answered late, after the edit below
      await route.fulfill({ response: resp });
    });
    const b2 = await page.evaluate(() => {
      const c = getContract('MK-B2');
      return { light: !!(c && c._light), loaded: !!(c && c._loaded), name: c && c.name };
    });
    check('2a GATE — MK-B2 is a list row nobody has loaded', b2.light && !b2.loaded, JSON.stringify(b2));
    await page.click('#reg-tbody tr[data-row="MK-B2"] .reg-title');
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      /* The reader writes into the record while it is still loading — the
         product's own write, through the one queue. */
      const c = getContract('MK-B2');
      c.name = 'Renamed while it was still loading'; persist(c);
    });
    await page.waitForTimeout(3200);
    const b2room = await page.evaluate(() => {
      const c = getContract('MK-B2');
      return { name: c && c.name, audit: Array.isArray(c && c.audit) ? c.audit.length : -1, loaded: !!(c && c._loaded) };
    });
    check('2b the name typed during the read is still the one on screen — and the record behind it was completed',
      b2room.name === 'Renamed while it was still loading' && b2room.audit > 0 && b2room.loaded, JSON.stringify({ ...b2room, heldRead }));
    await page.evaluate(async () => { await flushSaves(); });
    const s2 = await stored('MK-B2');
    check('2c and it is the name on file', s2 && s2.name === 'Renamed while it was still loading', s2 && s2.name);
    await page.unroute('**/api/contracts/MK-B2');

    /* ================= 3 · CONTROL: NOTHING PENDING, THE WHOLE RECORD LOADS ================= */
    await page.evaluate(() => { setView('register'); });
    await page.waitForTimeout(700);
    const b1was = await page.evaluate(() => { const c = getContract('MK-B1'); return { light: !!c._light, audit: (c.audit || []).length }; });
    await page.click('#reg-tbody tr[data-row="MK-B1"] .reg-title');
    await page.waitForTimeout(2200);
    const b1 = await page.evaluate(() => { const c = getContract('MK-B1'); return { loaded: !!c._loaded, light: !!c._light, audit: (c.audit || []).length, view: state.view }; });
    const s3 = await stored('MK-B1');
    check('3 CONTROL — a row opened with nothing pending loads its whole stored record, as before',
      b1was.light && b1.loaded && !b1.light && b1.audit === (s3.audit || []).length && b1.view === 'workspace',
      JSON.stringify({ b1was, b1, storedAudit: (s3.audit || []).length }));
  } finally {
    check('4 no page error anywhere in the run', errors.length === 0, errors.join(' | ') || 'none');
    await browser.close();
    await h.stop();
  }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { console.log('FAILED:\n  ' + bad.map(b => b.name).join('\n  ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
