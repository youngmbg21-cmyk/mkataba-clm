/* Chromium verification: THE TABLE'S FOOT IS THE COUNT AND THE PAGER
   (Young ruled 24 Sep 2026, over a screenshot of the Contracts page's foot:
   "delete this from both the contracts and negotiations pages").
   ====================================================================
   What went: the VALUE STREAMS key (every stream's colour beside its name) and
   the page-size note ("40 per page" on Contracts, "one page — every group
   whole" on Negotiations — the owner ruled the second one by name when asked).
   The same key drawn ABOVE the Contracts page's Board view went with it,
   because that is the same page. My Queue — a separate page that draws the
   same board and was not named — keeps its key, and is measured here as a
   CONTROL so a later change cannot take it by accident.

   WHY A BROWSER FILE. "It is gone" is easy to satisfy in the source and
   wrong on the screen — the foot is ONE builder drawing two pages, and the
   board is a second builder drawing a third place. Only the painted page says
   what a reader sees in each of them. And the reason the owner asked is a
   GEOMETRY: the foot wrapped into three lines ("the strip read as a wall"),
   which no source read can measure.

   CONTROLS, which pass on both sides by design and prove the change is
   narrow: the count, the pager, the board's own columns and cards, every row
   and card still naming its stream beside its colour, and My Queue's key.

   Run: node test/chromium/register-foot-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES, fixtureContract, FOLDER_A, FOLDER_B } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'register-foot');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* FIFTY CONTRACTS, so the Contracts table really has a second page and the
   pager is really drawn — "the pager is still there" is a claim nothing can
   make about a book of four. */
const BOOK = FIXTURES.concat(Array.from({ length: 46 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return fixtureContract('MK-P' + n, 'Packaging Supply ' + n, 'Supplier ' + n,
    i % 2 ? FOLDER_A : FOLDER_B, 1000000 + i * 25000, i % 3 ? 'Under Review' : 'Draft');
}));

/* What the foot draws, read off the painted page. The foot is the element
   that holds the count — the one fact on it that nobody asked to remove. */
const FOOT = `(() => {
  const show = document.getElementById('reg-showing');
  if (!show) return null;
  const foot = show.parentElement, fr = foot.getBoundingClientRect();
  const kids = [...foot.children].filter(k => {
    const r = k.getBoundingClientRect(), cs = getComputedStyle(k);
    return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
  });
  /* CENTRE LINES, NOT TOPS: the count is a line of text and the pager is a
     row of taller buttons, so on one line their tops differ by the buttons'
     own padding while their centres agree. */
  const mids = kids.map(k => { const r = k.getBoundingClientRect(); return Math.round(r.top + r.height / 2); });
  const pager = document.getElementById('reg-pager');
  return {
    text: foot.textContent.replace(/\\s+/g, ' ').trim(),
    kids: kids.map(k => k.id || k.tagName.toLowerCase()),
    oneLine: mids.length > 0 && Math.max(...mids) - Math.min(...mids) <= 4,
    tops: mids.join('/'),
    h: Math.round(fr.height),
    showing: show.textContent.replace(/\\s+/g, ' ').trim(),
    showOn: show.getBoundingClientRect().width > 0,
    pagerBtns: pager ? pager.querySelectorAll('button').length : -1,
    scrollH: Math.round((document.getElementById('reg-scroll') || { getBoundingClientRect: () => ({ height: 0 }) })
      .getBoundingClientRect().height),
  };
})()`;

/* Every VALUE STREAMS key painted anywhere in the page's own content — asked
   by its heading word, in the reader's language, never by a typed English
   string. `#content` is the page; the rail and the shell bar are not. */
const KEYS = `(() => {
  const word = i18t('fo_value_streams');
  const root = document.getElementById('content') || document.body;
  return [...root.querySelectorAll('span')]
    .filter(s => s.textContent.trim() === word && s.getBoundingClientRect().width > 0).length;
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3200);

    /* ════════ 1. THE CONTRACTS TABLE ════════ */
    await page.evaluate(() => { regSetMode('table'); setView('register'); });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, '01-contracts-table.png') });
    const words = await page.evaluate(() => ({
      key: i18t('fo_value_streams'),
      perPage: i18t('reg_per_page', { n: REG_PAGE }),
      noPaging: i18t('ngl_no_paging'),
    }));
    const c1 = await page.evaluate(FOOT);
    const k1 = await page.evaluate(KEYS);
    ok('1a the Contracts page draws no value-streams key', k1 === 0, `${k1} key(s) painted`);
    ok('1b and its foot does not say it', !!c1 && c1.text.indexOf(words.key) < 0,
      c1 ? c1.text : 'no foot');
    ok('1c the page-size note is gone', !!c1 && c1.text.indexOf(words.perPage) < 0,
      c1 ? `"${words.perPage}" ${c1.text.indexOf(words.perPage) < 0 ? 'absent' : 'still there'}` : 'no foot');
    ok('1d the foot holds the count and the pager, and nothing else',
      !!c1 && c1.kids.join(',') === 'reg-showing,reg-pager', c1 ? c1.kids.join(',') : 'no foot');
    ok('1e and it is one line, not a wall', !!c1 && c1.oneLine, c1 ? `centres ${c1.tops} · ${c1.h}px` : 'no foot');
    ok('1f CONTROL the count is still there', !!c1 && c1.showOn && /50/.test(c1.showing),
      c1 ? c1.showing : 'no foot');
    ok('1g CONTROL the pager is still there on a book of two pages', !!c1 && c1.pagerBtns >= 3,
      c1 ? `${c1.pagerBtns} buttons` : 'no foot');
    /* ---- 1h RE-POINTED LATER THE SAME DAY (24 Sep 2026) ----
       It was a CONTROL: "every row still names its stream beside its colour",
       the fact the key used to explain. Hours later the owner took the stream
       COLUMN off both pages too ("Remove the value stream column from both
       pages as well but not from the filter"), so there is no colour left on a
       row for any key to explain — asserted as that, beside the filter that
       stays. */
    const rows = await page.evaluate(() => ({
      bars: [...document.querySelectorAll('#reg-tbody tr[data-row]')].slice(0, 5)
        .filter(tr => [...tr.querySelectorAll('td span')].some(s => {
          const r = s.getBoundingClientRect(); return r.width > 0 && r.width <= 6 && r.height >= 8;
        })).length,
      filter: !!document.getElementById('reg-type-sel'),
    }));
    ok('1h no row draws a stream colour now, and the Stream filter stays',
      rows.bars === 0 && rows.filter, JSON.stringify(rows));

    /* ════════ 2. THE CONTRACTS PAGE'S BOARD ════════
       The same page, drawn as cards. The key used to sit above the columns. */
    await page.evaluate(() => { regSetMode('board'); regRepaint(); });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '02-contracts-board.png') });
    const b = await page.evaluate(() => {
      const wrap = document.querySelector('.reg-board-wrap');
      const cols = document.querySelector('.reg-board-wrap .board-cols');
      const cards = [...document.querySelectorAll('.reg-board-wrap .q-card')];
      const first = cards[0];
      const bar = first && [...first.querySelectorAll('span span')].find(s => {
        const r = s.getBoundingClientRect(); return r.width > 0 && r.width <= 6 && r.height >= 8;
      });
      return { wrap: !!wrap, cols: cols ? cols.children.length : 0, cards: cards.length,
        stream: bar ? bar.parentElement.textContent.trim() : '' };
    });
    const k2 = await page.evaluate(KEYS);
    ok('2a the Board view draws no value-streams key either', b.wrap && k2 === 0,
      b.wrap ? `${k2} key(s) painted` : 'no board');
    ok('2b CONTROL the board still draws its four columns and its cards',
      b.cols === 4 && b.cards > 0, `${b.cols} columns · ${b.cards} cards`);
    ok('2c CONTROL and a card still names its stream beside its colour', b.stream.length > 0,
      b.stream || '(none)');
    await page.evaluate(() => { regSetMode('table'); });

    /* ════════ 3. THE NEGOTIATIONS PAGE ════════
       Staged: the list is only drawn over a LIVE negotiation, and the seeded
       book has none. One change filed through the funnel is what makes one. */
    const cid = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined' && !x.negotiation);
      if (!c) return null;
      negoInit(c);
      /* The funnel is ASYNC — read the record after it has answered. */
      await negoFileChange(c, { clauseId: (clauseSegment(negoBaseBody(c))[0] || {}).id || 'c1',
        kind: 'edit', authorSide: 'counterparty', author: 'Erik Lindqvist',
        before: 'thirty (30) days', after: 'forty-five (45) days', why: 'Staged for the foot.' });
      return negoIsLive(c) ? c.id : null;
    });
    ok('3-stage a negotiation really is live', !!cid, cid || 'none');
    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(700);
    await page.click('.nav-item[data-view="redline"]');
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, '03-negotiations.png') });
    const n = await page.evaluate(FOOT);
    const k3 = await page.evaluate(KEYS);
    const onList = await page.evaluate(() => !!document.querySelector('.ngl-head-table') && !!document.querySelector('.reg-table'));
    ok('3a the Negotiations list is really on screen', onList);
    ok('3b the Negotiations page draws no value-streams key', onList && k3 === 0, `${k3} key(s) painted`);
    ok('3c and its paging note is gone too', !!n && n.text.indexOf(words.noPaging) < 0,
      n ? n.text : 'no foot');
    ok('3d its foot holds the count alone (no pager on a page that never pages)',
      !!n && n.kids.join(',') === 'reg-showing', n ? n.kids.join(',') : 'no foot');
    ok('3e CONTROL the count is still there', !!n && n.showOn && n.showing.length > 0,
      n ? n.showing : 'no foot');

    /* ════════ 4. MY QUEUE — NOT NAMED, SO UNTOUCHED ════════ */
    await page.evaluate(() => setView('pipeline'));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '04-my-queue.png') });
    const k4 = await page.evaluate(KEYS);
    ok('4a CONTROL My Queue still draws its key (the owner named two pages, not this one)',
      k4 === 1, `${k4} key(s) painted`);

    /* ════════ 5. NOTHING THREW ════════ */
    ok('5a no page errors on the way', errors.length === 0, errors.join(' | ') || 'none');
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
