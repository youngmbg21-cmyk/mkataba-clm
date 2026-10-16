/* THE AGREEMENT FAMILY ON THE BOARD'S CARD — measured in a real browser.
 *
 * The owner, 15 Oct 2026: "when a contract is open on the board and it has an
 * accompanying amendment, it should be clear in the board that it is tied to
 * another amendment" — the overview card, not the paper. Off the options page
 * the owner picked "Family line" by name: under the card's head, one line
 * names the original and every amendment, the one in front lit; a press on
 * another brings that one up.
 *
 * WHAT THIS DRIVES, where the user looks:
 *   1. the original's card carries the line: Original, then Amendment No. 1,
 *      each with its reference and status; the original is the one lit;
 *   2. a press on the amendment brings its card up on the Board, and there
 *      the amendment is the one lit;
 *   3. a contract with no amendment draws no line at all;
 *   4. at the owner's three screens the line stays inside the card.
 * Every driven half is guarded, so a missing feature REPORTS rather than
 * times out. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'agreement-family');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

const A1 = FIXTURES.find(c => c.id === 'MK-A1');
const KID = { ...JSON.parse(JSON.stringify(A1)), id: 'MK-A1-A1', parentId: 'MK-A1', relation: 'amendment',
  name: 'Amendment No. 1 to Refined Sugar Supply', status: 'Under Review', hash: null, signedAt: null,
  signatures: [], value: 52000000, audit: [] };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [...FIXTURES, KID], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    await page.evaluate(() => setView('dashboard'));
    await until(page, () => state.view === 'dashboard');
    const line = id => page.evaluate(i => {
      const card = document.getElementById('bs-strip-' + i); if (!card) return null;
      const fam = card.querySelector('.bs-fam'); if (!fam) return { card: true, fam: false };
      const pills = [...fam.querySelectorAll('.bs-fam-p')].map(p => ({
        id: p.getAttribute('data-bs-fam') || (p.classList.contains('is-here') ? i : ''),
        here: p.classList.contains('is-here'), ref: (p.querySelector('.bs-fam-r') || {}).textContent,
        word: (p.querySelector('.bs-fam-w') || {}).textContent, status: (p.querySelector('.bs-fam-s') || {}).textContent }));
      const cr = card.getBoundingClientRect(), fr = fam.getBoundingClientRect();
      return { card: true, fam: true, pills, inside: fr.left >= cr.left && fr.right <= cr.right + 0.5 };
    }, id);
    /* Home draws in steps after sign-in: ask again until the card stands */
    const bring = async id => {
      for (let i = 0; i < 4; i++) {
        await page.evaluate(x => hbStripBring(x), id);
        if (await until(page, x => !!document.getElementById('bs-strip-' + x), id, 3000)) {
          await page.waitForTimeout(400);
          if (await page.evaluate(x => !!document.getElementById('bs-strip-' + x), id)) return true;
        }
      }
      return false;
    };

    /* ===== 1. THE ORIGINAL'S CARD NAMES ITS FAMILY ===== */
    await bring('MK-A1');
    const l1 = await line('MK-A1');
    const p1 = (l1 && l1.pills) || [];
    ok('1a the original\'s card draws the family line', !!(l1 && l1.fam), JSON.stringify(l1));
    ok('1b it names the original, then Amendment No. 1, each with its reference and status',
      p1.length === 2 && p1[0].word === 'Original' && p1[0].ref === 'MK-A1' && /Amendment No\. 1/.test(p1[1].word || '')
        && p1[1].ref === 'MK-A1-A1' && !!p1[0].status && !!p1[1].status, JSON.stringify(p1));
    ok('1c the original is the one lit', p1.length === 2 && p1[0].here && !p1[1].here, JSON.stringify(p1.map(p => p.here)));
    await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-A1'); if (el) el.scrollIntoView({ block: 'start' }); });
    const card1 = await page.$('#bs-strip-MK-A1');
    if (card1) await card1.screenshot({ path: path.join(OUT, '1-original.png') });

    /* ===== 2. A PRESS BRINGS THE AMENDMENT UP, AND IT IS LIT THERE ===== */
    const press = await page.$('#bs-strip-MK-A1 .bs-fam-p[data-bs-fam="MK-A1-A1"]');
    if (press) await press.click();
    const up = press ? await until(page, () => !!document.getElementById('bs-strip-MK-A1-A1')) : false;
    ok('2a pressing Amendment No. 1 brings its card up on the Board', up);
    const l2 = up ? await line('MK-A1-A1') : null;
    const p2 = (l2 && l2.pills) || [];
    ok('2b on the amendment\'s card the amendment is the one lit, the original a press away',
      p2.length === 2 && !p2[0].here && p2[1].here && p2[0].id === 'MK-A1', JSON.stringify(p2));

    /* ===== 3. NO AMENDMENT, NO LINE ===== */
    await bring('MK-B2');
    const l3 = await line('MK-B2');
    ok('3 a contract with no amendment draws no line', !!(l3 && l3.card && !l3.fam), JSON.stringify(l3));

    /* ===== 4. THE OWNER'S THREE SCREENS ===== */
    await bring('MK-A1');
    for (const [w, ht] of SCREENS) {
      await page.setViewportSize({ width: w, height: ht });
      await page.waitForTimeout(250);
      await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-A1'); if (el) el.scrollIntoView({ block: 'start' }); });
      const l4 = await line('MK-A1');
      ok(`4 the line stays inside the card at ${w}×${ht}`, !!(l4 && l4.fam && l4.inside), JSON.stringify(l4 && l4.inside));
      await page.screenshot({ path: path.join(OUT, `4-${w}x${ht}.png`) });
    }

    ok('5 no page errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close();
    if (h.stop) await h.stop();
  }
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})();
