/* Chromium verification: YOUR NEWEST CHOICE WINS — a late read never moves you
   ============================================================
   Owner, 16 Oct 2026: "review why when sometimes I am moved to this wall of
   paper, HaTi moves me to a contract page like image 2 without me pressing
   anything."

   The first time a contract is opened in a sitting its whole record is read
   from the server before its paper goes up (igAnalyze → ensureFull). On a
   slow server that read takes seconds, and the paper went up when it came
   back — wherever the reader had gone meanwhile. Two ways in: a paper pressed
   on the wall (nothing on screen moved while it read, so the reader carried
   on), and a refresh putting the last paper back (hbPlacePut) while the
   reader had already chosen the wall.

   Each read here is slowed by the browser (page.route), the way a sleeping
   server slows it. Waits ask for the state, bounded.

   Red at the parent (feb17f1): 1a (no ring on the pressed paper), 1b (the
   Board turned back to the paper), 1c (the older read replaced the newer
   paper), 2a and 2b (the refresh put the paper back over the wall the reader
   chose). 1d and 2c held there too: they guard the opening that must still
   happen.

   Run: node test/chromium/late-open-stays-put-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'late-open-stays-put');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BOOK = FIXTURES.concat(Array.from({ length: 24 }, (_, i) =>
  fixtureContract('MK-L' + i, 'Cold Chain Logistics', 'Bidco', 'proc', 5e6, 'Under Review')));
const SLOW = 3000;

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  /* the reads to slow down, by contract id; everything else answers at once */
  let slow = new Set();
  await page.route(/\/api\/contracts\/MK-L\d+$/, async route => {
    const id = route.request().url().split('/').pop();
    if (route.request().method() === 'GET' && slow.has(id)) await new Promise(r => setTimeout(r, SLOW));
    route.continue();
  });
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(100); }
    return v; };
  const now = () => page.evaluate(() => ({ view: state.view, face: hbS().face, paper: intel.paper ? intel.paper.id : null,
    wall: !!document.getElementById('ct-place') && !intel.paper }));
  const onWall = () => until(() => !!(document.querySelector('#ct-place [data-ig-pick]') && !intel.paper));
  /* RE-POINTED 18 Oct 2026 (round 13 as drawn): a press on a paper CHOOSES it
     and a second press opens it, and the wall draws twelve at a time — so the
     paper is brought into the wall (Show more) and pressed twice */
  const pressOpen = async id => {
    const sel = `#ig-wall .igw-card[data-ig-pick="${id}"]`;
    for (let i = 0; i < 6 && !(await page.$(sel)) && await page.$('#ig-wall [data-ig-wall-more]'); i++){ await page.click('#ig-wall [data-ig-wall-more]'); await page.waitForTimeout(200); }
    await page.click(sel); await page.click(sel);
  };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-L7'), null, { timeout: 15000 });

    /* ============ 1. A PAPER PRESSED ON THE WALL, READ SLOWLY ============ */
    await page.evaluate(() => hbOpenContracts());
    const w0 = await onWall();
    check('1-  the Contracts place shows its wall of papers', !!w0);

    /* 1a: the press shows that it worked — the paper wears the turning ring */
    slow = new Set(['MK-L3']);
    await pressOpen('MK-L3');
    await page.waitForTimeout(400);
    const ring = await page.evaluate(() => { const b = document.querySelector('[data-ig-pick="MK-L3"]');
      return b ? { busy: b.getAttribute('aria-busy'), spin: !!b.querySelector('.igw-opening .ob-spin'), word: (b.querySelector('.igw-opening') || {}).textContent || '' } : null; });
    await page.screenshot({ path: path.join(OUT, '1a-opening.png') });
    check('1a a pressed paper still being read wears the turning ring and says so', !!(ring && ring.spin && ring.busy === 'true' && /Opening/.test(ring.word)), JSON.stringify(ring));

    /* 1b: the reader goes to the Board meanwhile — the read comes back and nothing moves */
    await page.evaluate(f => { if (state.view === 'dashboard' && document.getElementById('hb-head')) hbSetFace(f); else { hbS().face = f; hbSave(); setView('dashboard'); } }, 'board');
    await page.waitForTimeout(SLOW + 800);
    const b1 = await now();
    check('1b a read that comes back after the reader went to the Board leaves them on the Board', b1.face === 'board' && !b1.paper, JSON.stringify(b1));

    /* 1c: two papers pressed — the older, slower read does not replace the newer */
    await page.evaluate(() => hbOpenContracts());
    await onWall();
    slow = new Set(['MK-L5']);
    await pressOpen('MK-L5');
    await page.waitForTimeout(300);
    /* the reader thinks nothing happened and presses back to the wall, then another paper */
    await page.evaluate(() => hbOpenContracts());
    await onWall();
    await pressOpen('MK-L6');
    const c1 = await until(() => intel.paper && intel.paper.id === 'MK-L6');
    await page.waitForTimeout(SLOW + 800);
    const c2 = await now();
    check('1c the newer paper stays up when the older read comes back', !!c1 && c2.paper === 'MK-L6', JSON.stringify(c2));

    /* 1d: and a press the reader waits on still opens its paper */
    await page.evaluate(() => hbOpenContracts());
    await onWall();
    slow = new Set(['MK-L8']);
    await pressOpen('MK-L8');
    const d1 = await until(() => intel.paper && intel.paper.id === 'MK-L8', null, SLOW + 6000);
    const cleared = await page.evaluate(() => !document.querySelector('.igw-card.is-opening') && !intel.opening);
    check('1d a paper the reader waits for opens, and its ring is gone', !!d1 && cleared, JSON.stringify(await now()));

    /* ============ 2. A REFRESH PUTTING THE LAST PAPER BACK ============ */
    const reload = async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 20 && window.hbS && window.intel, null, { timeout: 15000 });
    };
    /* 2a: back on the wall by the Contracts door while the paper is read again */
    await page.evaluate(() => hbOpenContracts()); await onWall();
    slow = new Set();
    await pressOpen('MK-L10');
    await until(() => intel.paper && intel.paper.id === 'MK-L10');
    slow = new Set(['MK-L10']);
    await reload();
    await page.waitForTimeout(500);
    const a0 = await now();
    await page.evaluate(() => hbOpenContracts());
    await page.waitForTimeout(SLOW + 1200);
    const a1 = await now();
    await page.screenshot({ path: path.join(OUT, '2a-stays-on-wall.png') });
    check('2a after a refresh, the Contracts door keeps the reader on the wall when the read comes back', !a0.paper && !a1.paper && a1.face === 'paper', JSON.stringify({ a0, a1 }));

    /* 2b: the reader's hand on the wall (a scroll) while the paper is read again */
    await page.evaluate(() => hbOpenContracts()); await onWall();
    await pressOpen('MK-L11');
    await until(() => intel.paper && intel.paper.id === 'MK-L11', null, SLOW + 6000);
    slow = new Set(['MK-L11']);
    await reload();
    const w2 = await onWall();
    await page.mouse.move(500, 500);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(SLOW + 1200);
    const b2 = await now();
    check('2b after a refresh, a scroll on the wall keeps the reader there when the read comes back', !!w2 && !b2.paper, JSON.stringify(b2));

    /* 2c: a refresh the reader does not touch still brings the paper back */
    await page.evaluate(() => hbOpenContracts()); await onWall();
    await pressOpen('MK-L12');
    await until(() => intel.paper && intel.paper.id === 'MK-L12', null, SLOW + 6000);
    slow = new Set(['MK-L12']);
    await reload();
    const back = await until(() => intel.paper && intel.paper.id === 'MK-L12', null, SLOW + 8000);
    check('2c a refresh nobody touches still puts the paper back where it was', !!back, JSON.stringify(await now()));

    check('3  no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop?.();
    const failed = results.filter(r => !r.pass).length;
    console.log(`\n${results.length - failed}/${results.length} pass`);
    process.exit(failed ? 1 : 0);
  }
})();
