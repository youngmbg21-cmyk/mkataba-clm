/* Chromium verification: THE WALL OF PAPER ON HOME'S DOCUMENT TAB
   ============================================================
   Owner, 13 Oct 2026, picking "Wall of paper" from three options: on the
   Document tab with no contract open, instead of a short list, EVERY contract
   stands as a small paper with its contract number below it, all down the
   page; search, sort and stage narrow it; a press on a paper opens it. "I want
   them small ... maybe 6 per line on a thinkpad laptop."

   Red at the parent: the Document tab drew a card of at most 12 text rows, no
   paper, no sort, no stage buttons.
   RE-POINTED AT STEP 7 OF THE OVERNIGHT WORK ORDER (15 Oct 2026): the wall is
   the Contracts place's Wall, under ONE head shared with its List — the
   register's stage tabs, filters, set and sort (state.reg). So the wall's own
   find box, sort select and stage chips are the place's: the search is the
   top bar's box (it narrows the place where it stands), the sort is the
   List's Sort on the wall's count line (its own directions: a reference runs
   lowest first, a counterparty A to Z), and a stage is a tab — a tab with
   nothing in it stays quiet (no count) rather than leaving the row, and All
   lets a stage go. The papers are the very rows the List holds (regFiltered).

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
  const wallUp = () => page.waitForFunction(() => !!document.querySelector('#ig-paper [data-reg-home][data-ct-show="wall"] #ig-wall .igw-count'), null, { timeout: 15000 }).then(() => true, () => false);

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#li-email', { timeout: 15000 });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, { timeout: 20000 });

    await page.evaluate(() => { if (window.intel) intel.paper = null; setView('dashboard'); });
    /* attached, not visible: on a computer Home's head row is gone by design (the SAP way, 18 Oct 2026) */
    await page.waitForSelector('#hb-head', { state: 'attached', timeout: 15000 });
    await page.evaluate(f => { if (state.view === 'dashboard' && document.getElementById('hb-head')) hbSetFace(f); else { hbS().face = f; hbSave(); setView('dashboard'); } }, 'paper');
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
      const want = regFiltered().map(c => contractRef(c));
      const cards = [...document.querySelectorAll('#ig-paper .igw-card')];
      const got = cards.map(b => b.querySelector('.igw-ref').textContent.trim());
      const below = cards.every(b => b.querySelector('.igw-ref').getBoundingClientRect().top >= b.querySelector('.igw-sheet').getBoundingClientRect().bottom);
      return { want: want.length, got: got.length, same: JSON.stringify(want) === JSON.stringify(got), below,
        count: document.querySelector('.igw-count').textContent.trim(), list: !!document.querySelector('#ig-paper .ig-pick-list') };
    });
    /* RE-POINTED 18 Oct 2026 (round 13 as drawn, the owner's "build all the
       gaps"): the wall draws twelve papers at a time, in the List's own order,
       its foot saying "Showing 12 of N" with Show more for the rest; at rest
       the count line says the book ("24 contracts · newest first") */
    const first = await page.evaluate(() => {
      const want = regFiltered().map(c => contractRef(c)).slice(0, 12);
      const got = [...document.querySelectorAll('#ig-paper .igw-card')].map(b => b.querySelector('.igw-ref').textContent.trim());
      return { got: got.length, same: JSON.stringify(want) === JSON.stringify(got), foot: ((document.querySelector('#ig-wall .igw-shown') || {}).textContent || '').trim() };
    });
    check('1a the first twelve stand on the wall, in the List\'s own order (newest work first), the foot saying how many of all',
      all.want > 12 && first.got === 12 && first.same && first.foot === `Showing 12 of ${all.want}` && !all.list, JSON.stringify({ all, first }));
    while (await page.$('#ig-wall [data-ig-wall-more]')) { await page.click('#ig-wall [data-ig-wall-more]'); await page.waitForTimeout(250); }
    const every = await page.evaluate(() => {
      const want = regFiltered().map(c => contractRef(c));
      const got = [...document.querySelectorAll('#ig-paper .igw-card')].map(b => b.querySelector('.igw-ref').textContent.trim());
      return { n: got.length, same: JSON.stringify(want) === JSON.stringify(got) };
    });
    check('1a2 Show more brings the rest, in the same order, until every contract stands', every.n === all.want && every.same, JSON.stringify(every));
    check('1b each contract\'s number sits below its paper', all.below);
    check('1c at rest the count says the book', new RegExp(`^${all.want} contracts$`).test(all.count), all.count);

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
    /* RE-POINTED 17 Oct 2026 (round 13, the owner picked "Wall of papers"):
       each paper is the top of its first page — wider than tall — so two rows
       stand on a laptop's screen; the facts sit under it */
    check('2b the papers are small (about 120–160 px wide), the top of a page',
      fit.w >= 110 && fit.w <= 160 && Math.abs(fit.w / fit.h - 1.55) < 0.08, JSON.stringify(fit));
    check('2c the first paper is painted where it stands', fit.painted);

    /* ================= 3. SEARCH NARROWS (the top bar's box, the place's one search) ================= */
    const one = await page.evaluate(() => contractRef(regFiltered()[0]));
    await page.fill('#cmd-search', one);
    await page.waitForTimeout(400);
    const found = await page.evaluate(() => ({ refs: [...document.querySelectorAll('#ig-paper .igw-ref')].map(e => e.textContent.trim()),
      place: !!document.querySelector('#ig-paper [data-reg-home][data-ct-show="wall"]'),
      focus: document.activeElement && document.activeElement.id === 'cmd-search' }));
    check('3a typing a contract number narrows the wall to it, where it stands, and the box keeps the caret',
      found.place && found.refs.includes(one) && found.refs.length >= 1 && found.refs.length < all.want && found.focus, JSON.stringify({ one, ...found }));
    await page.fill('#cmd-search', '');
    await page.waitForTimeout(400);

    /* ================= 4. SORT (the List's Sort, on the wall's count line) ================= */
    await page.selectOption('#ig-paper #ig-wall #reg-sort', 'ref');
    await page.waitForTimeout(400);
    const sorted = await page.evaluate(() => {
      const got = [...document.querySelectorAll('#ig-paper .igw-ref')].map(e => e.textContent.trim());
      const want = got.slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      return { ok: JSON.stringify(got) === JSON.stringify(want), first: got.slice(0, 3), list: state.reg.sort };
    });
    check('4a sorting by contract number runs lowest first, as the List does', sorted.ok && sorted.list === 'ref', JSON.stringify(sorted));
    await page.selectOption('#ig-paper #ig-wall #reg-sort', 'party');
    await page.waitForTimeout(400);
    const byCp = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('#ig-paper .igw-card')].map(b => b.getAttribute('data-ig-pick'));
      const cps = ids.map(id => String(getContract(id).counterparty || ''));
      return cps.every((v, i) => i === 0 || cps[i - 1].localeCompare(v, undefined, { sensitivity: 'base' }) <= 0);
    });
    check('4b sorting by counterparty runs A to Z', byCp);

    /* ================= 5. THE STAGE BOX (the place's, over the Wall and the List) ================= */
    /* RE-POINTED 16 Oct 2026 (owner: "take the status choices and put them in
       a dropdown as well"): the stages are the Stage box's choices; a stage
       with nothing in it is not offered at all (a filter's choice that cannot
       give results is not listed), every other carries its number. */
    const chips = await page.evaluate(() => { const s = document.querySelector('#ig-paper [data-reg-home] #reg-stage-sel');
      return s ? [...s.options].map(o => ({ k: o.value, n: Number((/\((\d+)\)\s*$/.exec(o.textContent) || [0, 0])[1]) })) : []; });
    check('5a the Stage box offers each stage that holds a paper, with its number, and no empty one', chips.length >= 2 && chips[0].k === 'all' && chips.every(c => c.k === 'all' || c.n > 0), JSON.stringify(chips));
    const stage = chips.find(c => c.k !== 'all' && c.k !== 'awaiting' && c.n > 0);
    if (stage){
      await page.selectOption('#ig-paper [data-reg-home] #reg-stage-sel', stage.k);
      await page.waitForTimeout(400);
      const on = await page.evaluate(k => {
        const ids = [...document.querySelectorAll('#ig-paper .igw-card')].map(b => b.getAttribute('data-ig-pick'));
        return { n: ids.length, all: ids.every(id => getContract(id).status === k),
          pressed: (document.querySelector('#ig-paper #reg-stage-sel') || {}).value };
      }, stage.k);
      check('5b a stage chosen shows only that stage, and its number matches the papers behind it',
        on.all && on.n === stage.n && on.pressed === stage.k, JSON.stringify({ stage, on }));
      await page.selectOption('#ig-paper [data-reg-home] #reg-stage-sel', 'all');
      await page.waitForTimeout(400);
      const back = await page.evaluate(() => ({ n: document.querySelectorAll('#ig-paper .igw-card').length, stage: state.reg.stage }));
      /* a new narrowing starts again at twelve (round 13 as drawn) */
      check('5c All lets it go — the first twelve papers again', back.stage === 'all' && back.n === Math.min(12, all.want), JSON.stringify(back));
    } else check('5b a stage to choose', false, JSON.stringify(chips));

    /* ================= 6. A REFRESH KEEPS THE SORT ======================== */
    await page.evaluate(() => { if (window.placeSave) placeSave(); });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, { timeout: 20000 });
    const kept = await wallUp() && await page.evaluate(() => ({ sort: state.reg.sort, sel: (document.querySelector('#ig-paper #ig-wall #reg-sort') || {}).value }));
    check('6a a refresh lands on the wall with the same sort', kept && kept.sort === 'party' && kept.sel === 'party', JSON.stringify(kept));

    /* ================= 7. A PRESS OPENS THE PAPER ========================= */
    const pick = await page.evaluate(() => document.querySelector('#ig-paper .igw-card').getAttribute('data-ig-pick'));
    /* RE-POINTED 18 Oct 2026 (round 13 as drawn): a press CHOOSES the paper,
       a second press opens it */
    await page.click(`#ig-paper .igw-card[data-ig-pick="${pick}"]`);
    await page.click(`#ig-paper .igw-card[data-ig-pick="${pick}"]`);
    const opened = await page.waitForFunction(id => window.intel && intel.paper && String(intel.paper.id) === String(id) && !document.querySelector('#ig-paper #ig-wall'), pick, { timeout: 15000 }).then(() => true, () => false);
    check('7a pressing a paper twice (choose, then open) opens that contract on the Document tab', opened, pick);
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
