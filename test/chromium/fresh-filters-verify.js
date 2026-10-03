/* Chromium verification: A DOOR FROM ANOTHER PAGE LANDS ON FRESH FILTERS.
   ======================================================================
   Young, 27 Sep 2026, over the Contracts page reading "Needs your decision ✕
   Stage Drafting": *"i was on the home page and clicked on the main graph to
   take me to contracts and look at the contracts in draft stage. Then i went
   back to home and clicked on the needs your decision and it took me back to
   the contracts page but i did not see all the contracts that need my decision
   because they were filtered still on draft then needs your decision ... When
   you have chosen a new filter from outside the page and you are landed to
   the results, the previous filters should not be there."*

   THIS FILE MAKES HIS PRESSES, IN HIS ORDER, ON THE REAL APP — the Map's stage
   bar, the rail's Home door, See all — and counts the rows that arrive. What
   only a browser can say: that the list holds exactly the number the door
   promised, that no chip is lit that the reader did not choose on this page,
   and that the shell bar's box does not go on saying "Raw" over a list it no
   longer narrows. f397 pins the model; the files name each other.

   A: the owner's journey — stage bar, Home, See all
   B: the reverse — a stream and a search left on the page, then the stage bar
   C: the shell search typed on Home lands fresh; typed on Contracts it narrows
      inside (a CONTROL)
   D: the phone's tile lands fresh
   Every check that a build without the fix could satisfy by accident is a
   named CONTROL; every press is guarded so a missing door is REPORTED.

   Screenshots go to $HATI_SHOT_DIR (or test/chromium/shots/fresh-filters/).
   Run: node test/chromium/fresh-filters-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR
  ? path.join(process.env.HATI_SHOT_DIR, 'fresh-filters')
  : path.join(__dirname, 'shots', 'fresh-filters');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* The day, n days from now, as the record writes one. Renewal decisions are
   a claim about the calendar, so they are built off today and inside the
   ninety-day window by a margin no day of the year can cross. */
const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); const q = x => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + q(d.getMonth() + 1) + '-' + q(d.getDate()); };

/* A book across every stage. Four signed agreements the reader OWNS come up
   for renewal inside the window — the owner's own "Needs your decision" rows —
   and none of them is a draft, so a stale Stage · Drafting hides every one. */
function book(){
  const owned = (id, name, cp, folder, days) => Object.assign(
    fixtureContract(id, name, cp, folder, 1000000, 'Signed'),
    { expiry: iso(days), owner: { name: 'Amina Otieno' },
      metadata: { value: 1000000, currency: 'KES', expiryDate: iso(days), noticePeriodDays: 30 } });
  return [
    fixtureContract('MK-D1', 'Draft Sugar Supply', 'Kabras Sugar', FOLDER_A, 2000000, 'Draft'),
    fixtureContract('MK-D2', 'Draft Retail Listing', 'Carrefour Kenya', FOLDER_B, 3000000, 'Draft'),
    fixtureContract('MK-R1', 'Milk Collection', 'Nandi Dairy', FOLDER_A, 4000000, 'Under Review'),
    fixtureContract('MK-R2', 'Retail Supply — Coast', 'Naivas Supermarkets', FOLDER_B, 5000000, 'Under Review'),
    owned('MK-S1', 'Raw Materials Supply', 'Juno Limited', FOLDER_A, 45),
    owned('MK-S2', 'Packaging Supply', 'Samsung', FOLDER_A, 51),
    owned('MK-S3', 'Modern Trade Listing', 'Naivas Supermarkets', FOLDER_B, 57),
    owned('MK-S4', 'Logistics Services', 'Maersk', FOLDER_B, 63),
  ];
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: book() });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3000);

    /* What the page says is on screen, read the way the reader reads it. */
    const onContracts = () => page.evaluate(() => {
      const R = window.regState ? regState() : {};
      return { view: state.view,
        rows: [...document.querySelectorAll('tr[data-row]')].map(r => r.getAttribute('data-row')).sort(),
        lit: [...document.querySelectorAll('.reg-chip.on')].map(c => ((c.querySelector('.reg-f-l') || c).textContent || '').replace(/\s+/g, ' ').trim()),
        only: (document.getElementById('reg-only-chip') || {}).textContent || '',
        stage: R.stage, type: R.type, query: R.query, onlyIds: R.only ? R.only.ids.slice().sort() : null,
        box: (document.getElementById('cmd-search') || {}).value };
    });
    const goHome = async () => {
      await page.click('#side-nav [data-view="dashboard"]');
      await page.waitForTimeout(1000);
    };

    /* ================ A. THE OWNER'S JOURNEY ============================== */
    const dd = await page.evaluate(() => {
      const list = window.hmDecisionItems ? hmDecisionItems() : [];
      const btn = document.querySelector('[data-hm-go="needsyou"]');
      return { ids: [...new Set(list.map(x => x.cid))].sort(),
        seeAll: !!btn, n: btn ? Number((/(\d+)/.exec(btn.textContent) || [])[1]) : null,
        draftDoor: !!document.querySelector('#hb-board .hb-stagekey [data-hb-dig="st:Draft"]') };
    });
    /* RE-POINTED 28 Sep 2026 (Young: "lets add just this part to the home
       page and discard the current 2 cards"): Home's decisions card and its
       See all are gone, so the stage asks only for the Map's door. */
    check('A0 the stage is set: a Drafting bar to press (control)', dd.draftDoor, JSON.stringify(dd));

    /* RE-POINTED 3 Oct 2026 (Young: Home is the board): a stage on Your book
       digs in first, and the dig-in's "Open these" is the door onto Contracts. */
    const openStage = async k => {
      await page.click(`#hb-board .hb-stagekey [data-hb-dig="st:${k}"]`).catch(() => {});
      await page.waitForSelector(`#hb-board .hb-dig [data-hb-stage="${k}"]`, { timeout: 5000 }).catch(() => {});
      await page.click(`#hb-board .hb-dig [data-hb-stage="${k}"]`).catch(() => {});
    };
    if (dd.draftDoor) await openStage('Draft');
    await page.waitForTimeout(1100);
    const a1 = await onContracts();
    check('A1 the stage bar opens Contracts on Drafting (control — the first press works either way)',
      a1.view === 'register' && a1.stage === 'Draft' && a1.rows.join(',') === 'MK-D1,MK-D2',
      `${a1.view} · stage ${a1.stage} · ${a1.rows.join(', ')}`);
    await page.screenshot({ path: path.join(OUT, '01-drafting-from-the-map.png') });

    /* A2–A5 RETIRED 28 Sep 2026 with Home's See all (the decisions card left
       Home). The rule they drove — a door from another page lands on fresh
       filters — is still driven below by the Map's Signed bar (B1–B3) and the
       shell search (C). What stands in their place: the door is gone. */
    await goHome();
    const noSeeAll = await page.evaluate(() => !document.querySelector('[data-hm-go="needsyou"]'));
    check('A2 Home has no See all onto a named set any more', noSeeAll);
    await page.click('#side-nav [data-view="register"]').catch(() => {});
    await page.waitForTimeout(900);

    /* ================ B. STALE PAGE FILTERS UNDER THE STAGE BAR ============ */
    /* What a reader leaves on the page: a stream picked from its chip, and a
       search typed into the shell bar while Contracts is on screen. */
    await page.evaluate(f => { const s = document.getElementById('reg-type-sel');
      if (s){ s.value = f; s.dispatchEvent(new Event('change', { bubbles: true })); } }, FOLDER_A);
    await page.waitForTimeout(600);
    await page.fill('#cmd-search', 'Raw');
    await page.waitForTimeout(700);
    const b0 = await onContracts();
    check('B0 typed on Contracts, the search narrows inside what is there — the stream stays (control)',
      b0.view === 'register' && b0.type === FOLDER_A && b0.query === 'Raw',
      `stream ${b0.type} · query "${b0.query}"`);

    await goHome();
    const signedN = await page.evaluate(() => { const s = (window.hbBookData ? hbBookData('all') : { stages: [] }).stages.find(x => x.k === 'Signed');
      return s ? s.n : null; });
    const hasSigned = await page.locator('#hb-board .hb-stagekey [data-hb-dig="st:Signed"]').count();
    if (hasSigned) await openStage('Signed');
    await page.waitForTimeout(1100);
    const b1 = await onContracts();
    await page.screenshot({ path: path.join(OUT, '03-signed-from-the-map.png') });
    check('B1 the stage bar lands on its whole stage — the number on the bar',
      b1.view === 'register' && b1.stage === 'Signed' && b1.rows.length === signedN,
      `bar said ${signedN} · list shows ${b1.rows.length} (${b1.rows.join(', ') || 'nothing'})`);
    check('B2 and the stream, the search and the named set left behind are gone',
      b1.type === 'all' && b1.query === '' && b1.onlyIds === null && b1.lit.length === 1,
      `stream ${b1.type} · query "${b1.query}" · named set ${JSON.stringify(b1.onlyIds)} · lit ${JSON.stringify(b1.lit)}`);
    check('B3 the shell bar\'s box no longer says "Raw" over a list it does not narrow',
      b1.box === '', `box "${b1.box}"`);

    /* ================ C. THE SHELL SEARCH TYPED ON HOME ==================== */
    await goHome();
    await page.fill('#cmd-search', 'Naivas');
    await page.waitForTimeout(1100);
    const c1 = await onContracts();
    await page.screenshot({ path: path.join(OUT, '04-search-from-home.png') });
    check('C1 a search typed on Home lands on every match, whatever stage was left on',
      c1.view === 'register' && c1.stage === 'all' && c1.query === 'Naivas' && c1.rows.join(',') === 'MK-R2,MK-S3',
      `stage ${c1.stage} · query "${c1.query}" · ${c1.rows.join(', ') || 'nothing'}`);

    await page.evaluate(() => { const s = document.getElementById('reg-stage-sel');
      if (s){ s.value = 'Signed'; s.dispatchEvent(new Event('change', { bubbles: true })); } });
    await page.waitForTimeout(600);
    await page.fill('#cmd-search', 'Naiv');
    await page.waitForTimeout(700);
    const c2 = await onContracts();
    check('C2 typed while Contracts is on screen, the search keeps the stage chosen there (control)',
      c2.stage === 'Signed' && c2.query === 'Naiv' && c2.rows.join(',') === 'MK-S3',
      `stage ${c2.stage} · query "${c2.query}" · ${c2.rows.join(', ') || 'nothing'}`);

    /* ================ D. THE PHONE'S TILE ================================= */
    await page.evaluate(() => { const R = regState(); R.category = 'customer'; });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    await page.evaluate(() => { if (window.mGo) mGo('home'); });
    await page.waitForTimeout(900);
    const tile = await page.evaluate(() => {
      const pick = ['expiring90', 'approvals', 'avgcycle'].map(k => document.querySelector(`[data-m-kpi="${k}"]`)).find(Boolean);
      if (!pick) return null;
      const k = pick.getAttribute('data-m-kpi');
      pick.click();
      return k;
    });
    await page.waitForTimeout(900);
    const d1 = await page.evaluate(() => { const R = regState(); return { stage: R.stage, type: R.type, category: R.category, query: R.query, view: R.view }; });
    await page.screenshot({ path: path.join(OUT, '05-phone-tile.png') });
    check('D1 a phone tile lands on its own question, with nothing left from the desk',
      !!tile && d1.category === 'all' && d1.type === 'all' && d1.query === '',
      `tile ${tile} · ${JSON.stringify(d1)}`);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(600);

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run reached its end', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  console.log(`screenshots → ${path.relative(process.cwd(), OUT)}`);
  process.exit(failed.length ? 1 : 0);
})();
