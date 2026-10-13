/* Chromium verification: THE WALL OF PAPER ON HOME'S DOCUMENT TAB
   ============================================================
   Owner, 13 Oct 2026, picking "Wall of paper" from three options: on the
   Document tab with no contract open, instead of a short list, EVERY contract
   stands as a small paper with its contract number below it, all down the
   page; search, sort and stage narrow it; a press on a paper opens it. "I want
   them small ... maybe 6 per line on a thinkpad laptop."

   Red at the parent: the Document tab drew a card of at most 12 text rows, no
   paper, no sort, no stage buttons.

   Driven at 1280 × 800 (a ThinkPad at 150%), where the rail floats and
   Jambo's panel stands open beside the wall.
   Screenshots go to test/chromium/shots/document-wall/.
   Run: node test/chromium/document-wall-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'document-wall');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const wallUp = () => page.waitForFunction(() => !!document.querySelector('#ig-paper .ig-wall [data-igw-body]'), null, { timeout: 15000 }).then(() => true, () => false);

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#li-email', { timeout: 15000 });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, { timeout: 20000 });

    await page.evaluate(() => { if (window.intel) intel.paper = null; setView('dashboard'); });
    await page.waitForSelector('[data-hb-face="paper"]', { timeout: 15000 });
    await page.click('[data-hb-face="paper"]');
    const up = await wallUp();
    check('0 the Document tab with nothing open shows the wall', up);
    if (!up) throw new Error('the wall never drew');
    /* the seed holds four contracts; twenty more (in this page only, never saved)
       prove the wall is not capped at the old list's twelve and fills a line of six */
    await page.evaluate(() => {
      const base = state.contracts.slice();
      for (let i = 0; i < 20; i++){
        const src = base[i % base.length];
        state.contracts.push({ ...src, id: 'MK-W' + (i + 1), contractNo: 'MK-W' + (i + 1), name: src.name + ' ' + (i + 1),
          updatedAt: '2020-01-' + String(i + 1).padStart(2, '0') + 'T00:00:00Z', parentId: null });
      }
      if (window.familyIndexDirty) familyIndexDirty();
      igPaintPaper();
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, '1-wall.png') });

    /* ================= 1. EVERY CONTRACT, AS A PAPER, NUMBER BELOW ========= */
    const all = await page.evaluate(() => {
      const want = igPickRows('').map(c => contractRef(c));
      const cards = [...document.querySelectorAll('#ig-paper .igw-card')];
      const got = cards.map(b => b.querySelector('.igw-ref').textContent.trim());
      const below = cards.every(b => b.querySelector('.igw-ref').getBoundingClientRect().top >= b.querySelector('.igw-sheet').getBoundingClientRect().bottom);
      return { want: want.length, got: got.length, same: JSON.stringify(want) === JSON.stringify(got), below,
        count: document.querySelector('.igw-count').textContent.trim(), list: !!document.querySelector('#ig-paper .ig-pick-list') };
    });
    check('1a every contract the tab can read stands on the wall, newest work first — no cap',
      all.want > 12 && all.got === all.want && all.same && !all.list, JSON.stringify(all));
    check('1b each contract\'s number sits below its paper', all.below);
    check('1c the count says how many are shown of how many', new RegExp(`^${all.want} of ${all.want} `).test(all.count), all.count);

    /* ================= 2. SIX A LINE ON A THINKPAD, SMALL, PAINTED ========= */
    const fit = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#ig-paper .igw-card')];
      const top0 = cards[0].getBoundingClientRect().top;
      const perLine = cards.filter(b => Math.abs(b.getBoundingClientRect().top - top0) < 2).length;
      const s = cards[0].querySelector('.igw-sheet').getBoundingClientRect();
      const hit = document.elementFromPoint(s.left + s.width / 2, s.top + s.height / 2);
      const dock = document.getElementById('ig-dock');
      return { perLine, w: Math.round(s.width), h: Math.round(s.height), painted: !!(hit && hit.closest('.igw-card') === cards[0]),
        dock: dock ? Math.round(dock.getBoundingClientRect().width) : 0, total: cards.length };
    });
    check('2a six papers a line at 1280 wide with Jambo\'s panel open',
      fit.perLine === 6 && fit.dock > 0, JSON.stringify(fit));
    check('2b the papers are small (about 120–150 px wide) and shaped like a page',
      fit.w >= 110 && fit.w <= 160 && Math.abs(fit.h / fit.w - 1.414) < 0.08, JSON.stringify(fit));
    check('2c the first paper is painted where it stands', fit.painted);

    /* ================= 3. SEARCH NARROWS ================================== */
    const one = await page.evaluate(() => contractRef(igPickRows('')[0]));
    await page.fill('#ig-paper [data-ig-pick-find]', one);
    await page.waitForTimeout(200);
    const found = await page.evaluate(() => ({ refs: [...document.querySelectorAll('#ig-paper .igw-ref')].map(e => e.textContent.trim()),
      focus: document.activeElement && document.activeElement.matches('[data-ig-pick-find]') }));
    check('3a typing a contract number narrows the wall to it, and the box keeps the caret',
      found.refs.includes(one) && found.refs.length >= 1 && found.refs.length < all.want && found.focus, JSON.stringify({ one, ...found }));
    await page.fill('#ig-paper [data-ig-pick-find]', '');
    await page.waitForTimeout(200);

    /* ================= 4. SORT ============================================ */
    await page.selectOption('#ig-paper [data-igw-sort]', 'ref');
    await page.waitForTimeout(200);
    const sorted = await page.evaluate(() => {
      const got = [...document.querySelectorAll('#ig-paper .igw-ref')].map(e => e.textContent.trim());
      const want = got.slice().sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
      return { ok: JSON.stringify(got) === JSON.stringify(want), first: got.slice(0, 3) };
    });
    check('4a sorting by contract number puts the highest number first', sorted.ok, JSON.stringify(sorted));
    await page.selectOption('#ig-paper [data-igw-sort]', 'cp');
    await page.waitForTimeout(200);
    const byCp = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('#ig-paper .igw-card')].map(b => b.getAttribute('data-ig-pick'));
      const cps = ids.map(id => String(getContract(id).counterparty || ''));
      return cps.every((v, i) => i === 0 || cps[i - 1].localeCompare(v, undefined, { sensitivity: 'base' }) <= 0);
    });
    check('4b sorting by counterparty runs A to Z', byCp);

    /* ================= 5. STAGE BUTTONS =================================== */
    const chips = await page.evaluate(() => [...document.querySelectorAll('#ig-paper [data-igw-stage]')].map(b => ({ k: b.getAttribute('data-igw-stage'), n: Number((b.querySelector('.n') || {}).textContent || -1) })));
    check('5a a stage with nothing in it is not listed', chips.length >= 2 && chips.every(c => c.k === 'all' || c.n > 0), JSON.stringify(chips));
    const stage = chips.find(c => c.k !== 'all' && c.k !== 'need');
    if (stage){
      await page.click(`#ig-paper [data-igw-stage="${stage.k}"]`);
      await page.waitForTimeout(200);
      const on = await page.evaluate(k => {
        const ids = [...document.querySelectorAll('#ig-paper .igw-card')].map(b => b.getAttribute('data-ig-pick'));
        return { n: ids.length, all: ids.every(id => igWallStage(getContract(id)) === k),
          pressed: document.querySelector(`#ig-paper [data-igw-stage="${k}"]`).getAttribute('aria-pressed') };
      }, stage.k);
      check('5b a stage button shows only that stage, and its number matches the papers behind it',
        on.all && on.n === stage.n && on.pressed === 'true', JSON.stringify({ stage, on }));
      await page.click(`#ig-paper [data-igw-stage="${stage.k}"]`);
      await page.waitForTimeout(200);
      const back = await page.evaluate(() => ({ n: document.querySelectorAll('#ig-paper .igw-card').length, stage: igWall.stage }));
      check('5c pressing the lit stage again lets it go — back to All', back.stage === 'all' && back.n === all.want, JSON.stringify(back));
    } else check('5b a stage button to press', false, JSON.stringify(chips));

    /* ================= 6. A REFRESH KEEPS THE SORT ======================== */
    await page.evaluate(() => { if (window.placeSave) placeSave(); });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, { timeout: 20000 });
    const kept = await wallUp() && await page.evaluate(() => ({ sort: igWall.sort, sel: document.querySelector('#ig-paper [data-igw-sort]').value }));
    check('6a a refresh lands on the wall with the same sort', kept && kept.sort === 'cp' && kept.sel === 'cp', JSON.stringify(kept));

    /* ================= 7. A PRESS OPENS THE PAPER ========================= */
    const pick = await page.evaluate(() => document.querySelector('#ig-paper .igw-card').getAttribute('data-ig-pick'));
    await page.click(`#ig-paper .igw-card[data-ig-pick="${pick}"]`);
    const opened = await page.waitForFunction(id => window.intel && intel.paper && String(intel.paper.id) === String(id) && !document.querySelector('#ig-paper .ig-wall'), pick, { timeout: 15000 }).then(() => true, () => false);
    check('7a pressing a paper opens that contract on the Document tab', opened, pick);
    await page.screenshot({ path: path.join(OUT, '2-opened.png') });

    check('8 no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) {
    check('run completed', false, (e && e.stack) || String(e));
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
