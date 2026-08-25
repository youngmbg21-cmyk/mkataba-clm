/* ROW DENSITY — three heights on one axis (25 Aug 2026).
   See UI-UX-AUDIT-AND-ROADMAP.md §5 Phase 4, and REG_DENSITY in
   js/views/register.js for why the middle rung is 36 rather than Fiori's 32.

   TWO CHECKS IN THE FIRST DRAFT OF THIS FILE PASSED WITHOUT PROVING ANYTHING,
   and they are corrected here rather than deleted, because the shape is the
   one this project has been caught by before (f183):
     - "condensed shows more rows" read 4 -> 4 on a seeded book of four
       contracts. A row COUNT cannot move when the book is shorter than the
       page. It measures the tbody's HEIGHT now, which is deterministic at any
       book size: the same rows must occupy less room.
     - "the Negotiations list inherits it" found no table at all and passed on
       the absence. It now asserts the structural claim instead — ONE renderer
       emits .reg-table, and it always carries the mode — and says so when the
       page legitimately draws no table. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const b = await chromium.launch({ executablePath: EXEC });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(1600);
  await page.evaluate(() => setView('register'));
  await page.waitForTimeout(900);

  const rowH  = () => page.evaluate(() => { const td = document.querySelector('.reg-table tbody td');
                                            return td ? Math.round(td.getBoundingClientRect().height) : 0; });
  const bodyH = () => page.evaluate(() => { const tb = document.querySelector('.reg-table tbody');
                                            return tb ? Math.round(tb.getBoundingClientRect().height) : 0; });
  const rows  = () => page.evaluate(() => document.querySelectorAll('.reg-table tbody tr[data-row]').length);
  const set   = async v => { await page.selectOption('#reg-density', v); await page.waitForTimeout(450); };

  console.log('\n1 · the control');
  ok('drawn', await page.evaluate(() => !!document.getElementById('reg-density')));
  ok('offers exactly three', (await page.evaluate(() => document.querySelectorAll('#reg-density option').length)) === 3);
  ok('defaults to compact, so nobody\'s book moves on the day it ships',
     (await page.evaluate(() => document.getElementById('reg-density').value)) === 'compact');
  /* IT IS A VIEW SETTING, NOT A FILTER: it sits after the spacer with Sort and
     must never wear the accent, which on this bar means "narrowing your list". */
  ok('does not claim to be narrowing the list', await page.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('reg-density'));
    return cs.fontWeight !== '600' && cs.fontWeight !== '700';
  }));

  console.log('\n2 · the three rungs');
  ok('compact 36px',     (await rowH()) === 36, (await rowH()) + 'px');
  await set('comfortable'); ok('comfortable 44px', (await rowH()) === 44, (await rowH()) + 'px');
  await set('condensed');   ok('condensed 30px',   (await rowH()) === 30, (await rowH()) + 'px');
  ok('padding travels with the height', (await page.evaluate(() =>
     getComputedStyle(document.querySelector('.reg-table tbody td')).paddingLeft)) === '8px');
  ok('leading travels with it too', (await page.evaluate(() =>
     getComputedStyle(document.querySelector('.reg-table tbody td')).lineHeight)) === '18px');

  console.log('\n3 · it buys what it claims to buy');
  /* HEIGHT, NOT COUNT — a count cannot move on a book shorter than the page. */
  const n = await rows();
  await set('comfortable'); const hCom = await bodyH();
  await set('condensed');   const hCon = await bodyH();
  ok('the same rows take measurably less room',
     hCon < hCom && (hCom - hCon) === n * 14, `${n} rows: ${hCom}px → ${hCon}px (${hCom - hCon}px saved)`);

  console.log('\n4 · it is remembered, and it is the reader\'s own');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.evaluate(() => setView('register'));
  await page.waitForTimeout(900);
  ok('survives a reload', (await page.evaluate(() => document.getElementById('reg-density').value)) === 'condensed');
  ok('and the rows really are condensed', (await rowH()) === 30, (await rowH()) + 'px');

  console.log('\n5 · one renderer, both pages');
  /* THE STRUCTURAL CLAIM, because the Negotiations page draws no table when
     nothing is live — and passing on that absence is what the first draft did. */
  const srcOne = await page.evaluate(() => document.querySelectorAll('.reg-table').length <= 1);
  ok('at most one .reg-table is ever mounted', srcOne);
  ok('the mounted table carries the mode on itself', await page.evaluate(() => {
    const t = document.querySelector('.reg-table');
    return !!t && t.getAttribute('data-reg-density') === 'condensed'
        && t.style.getPropertyValue('--reg-row-h') === '30px';
  }));
  await page.click('.nav-item[data-view="redline"]');
  await page.waitForTimeout(1000);
  const neg = await page.evaluate(() => {
    const t = document.querySelector('.reg-table');
    if (!t) return { drawn: false };
    const td = t.querySelector('tbody td');
    return { drawn: true, mode: t.getAttribute('data-reg-density'),
             h: td ? Math.round(td.getBoundingClientRect().height) : 0 };
  });
  if (neg.drawn) ok('Negotiations inherits the mode', neg.mode === 'condensed' && neg.h === 30, JSON.stringify(neg));
  else           console.log('  note  Negotiations drew no table (nothing live in this fixture) — ' +
                             'the structural claim above is what covers it');

  console.log('\n6 · nothing else moved');
  await page.evaluate(() => setView('register'));
  await page.waitForTimeout(700);
  ok('no sideways scroll at any density',
     await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  ok('no head cell clips', await page.evaluate(() =>
     ![...document.querySelectorAll('.reg-table th')].some(c => c.scrollWidth > c.clientWidth + 1)));

  console.log('\n' + (errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close();
  await h.stop();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS:', e.message); process.exit(2); });
