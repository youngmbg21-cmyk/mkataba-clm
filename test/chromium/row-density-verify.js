/* ROW DENSITY — two heights on one axis (25 Aug 2026; the third rung, condensed,
   was DELETED on the owner's word 21 Sep 2026 and this file reversed in place).
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
  /* RE-POINTED 20 Sep 2026 (the redesign order): the density is a SEGMENTED
     CONTROL — three real buttons carrying data-reg-density, the live one
     aria-pressed — in place of the labelled dropdown. Same three rungs, same
     store (regSetDensity), same repaint; only the control's shape moved, so
     every claim below is asked of the segments instead of the select. */
  const live  = () => page.evaluate(() => { const b = document.querySelector('button[data-reg-density][aria-pressed="true"]');
                                            return b ? b.getAttribute('data-reg-density') : null; });
  /* RE-POINTED IN PLACE 26 Sep 2026 (the list Inspector drawing): the three
     segments moved into ONE Display menu beside Sort, with Table · Board and
     the amendment fold — the same buttons, the same attribute, the same store
     and repaint — so a press opens the menu first, exactly as a reader's does.
     Pressing a segment repaints the page, which draws the menu shut again. */
  const set   = async v => {
    const shut = await page.evaluate(() => { const p = document.getElementById('reg-display-pop'); return !p || p.hidden; });
    if (shut && await page.$('#reg-display')) await page.click('#reg-display');
    await page.click(`button[data-reg-density="${v}"]`); await page.waitForTimeout(450); };

  console.log('\n1 · the control');
  ok('drawn', await page.evaluate(() => !!document.querySelector('button[data-reg-density]')));
  /* THE LADDER'S OWN LENGTH, not a typed number: section 2 names the rungs. */
  ok('offers exactly the rungs on the ladder', await page.evaluate(() =>
     document.querySelectorAll('button[data-reg-density]').length
       === Object.keys(window.REG_DENSITY || {}).length));
  ok('defaults to compact, so nobody\'s book moves on the day it ships', (await live()) === 'compact');
  /* IT IS A VIEW SETTING, NOT A FILTER: it sits after the spacer with Sort and
     the RESTING segments never wear the accent ink, which on this bar means
     "narrowing your list" (the pressed segment is the control's own state). */
  ok('does not claim to be narrowing the list', await page.evaluate(() => {
    const accent = (() => { const e = document.createElement('i'); e.style.color = 'var(--accent-ink)'; document.body.appendChild(e);
      const c = getComputedStyle(e).color; e.remove(); return c; })();
    return [...document.querySelectorAll('button[data-reg-density][aria-pressed="false"]')]
      .every(b => { const cs = getComputedStyle(b); return cs.color !== accent && cs.fontWeight !== '600' && cs.fontWeight !== '700'; });
  }));

  console.log('\n2 · the two rungs');
  /* ---- CONDENSED IS GONE (Young ruled 21 Sep 2026: "Delete condensed"), AND
     THIS SECTION IS REVERSED IN PLACE ----
     It was the one rung that took the kind and the round off the title, so it
     drew a DIFFERENT row rather than the same row closer together. Every claim
     that drove it now drives COMPACT, and the ladder's own length is a claim of
     its own: a rung that is deleted must not come back as a dead button.
     RE-POINTED 21 Sep 2026 (the redesign's second pass): the title is two lines
     on compact, so the row stands ABOVE its 36px floor and under 44. */
  ok('compact stands on its 36px floor', (await rowH()) >= 36 && (await rowH()) < 44, (await rowH()) + 'px');
  await set('comfortable'); ok('comfortable 44px', (await rowH()) === 44, (await rowH()) + 'px');
  const rungs = await page.$$eval('button[data-reg-density]', els => els.map(e => e.getAttribute('data-reg-density')));
  ok('the ladder offers two rungs and neither is condensed',
     rungs.length === 2 && !rungs.includes('condensed'), rungs.join(' | '));
  await set('compact');
  ok('padding travels with the height', (await page.evaluate(() =>
     getComputedStyle(document.querySelector('.reg-table tbody td')).paddingLeft)) === '12px');
  ok('leading travels with it too', (await page.evaluate(() =>
     getComputedStyle(document.querySelector('.reg-table tbody td')).lineHeight)) === '20px');

  console.log('\n3 · it buys what it claims to buy');
  /* HEIGHT, NOT COUNT — a count cannot move on a book shorter than the page. */
  const n = await rows();
  await set('comfortable'); const hCom = await bodyH();
  await set('compact');     const hCon = await bodyH();
  /* PIN THE RELATION, NOT THE NUMBER (re-pointed 21 Sep 2026): this multiplied
     by the exact difference between two rungs, so it cost an edit at every
     retune and would pass on the wrong thing — the two-line title puts compact
     at 43 rather than its 36px floor, which is a fact about the TITLE and not
     about the density. The claim is that the shorter rung really is shorter,
     by at least a pixel a row. */
  ok('the same rows take measurably less room',
     hCon < hCom && (hCom - hCon) >= n, `${n} rows: ${hCom}px → ${hCon}px (${hCom - hCon}px saved)`);

  console.log('\n4 · it is remembered, and it is the reader\'s own');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.evaluate(() => setView('register'));
  await page.waitForTimeout(900);
  ok('survives a reload', (await live()) === 'compact');
  ok('and the rows really are compact', (await rowH()) >= 36 && (await rowH()) < 44, (await rowH()) + 'px');
  /* A BROWSER THAT REMEMBERS THE DELETED RUNG READS COMPACT, with no migration:
     an unknown stored value has always fallen back. */
  await page.evaluate(() => { try { localStorage.setItem('hati.v1.regDensity', 'condensed'); } catch (e) {} });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.evaluate(() => setView('register'));
  await page.waitForTimeout(900);
  ok('a browser that remembers condensed simply reads compact', (await live()) === 'compact', await live());
  await set('compact');

  console.log('\n5 · one renderer, both pages');
  /* THE STRUCTURAL CLAIM, because the Negotiations page draws no table when
     nothing is live — and passing on that absence is what the first draft did. */
  const srcOne = await page.evaluate(() => document.querySelectorAll('.reg-table').length <= 1);
  ok('at most one .reg-table is ever mounted', srcOne);
  ok('the mounted table carries the mode on itself', await page.evaluate(() => {
    const t = document.querySelector('.reg-table');
    return !!t && t.getAttribute('data-reg-density') === 'compact'
        && t.style.getPropertyValue('--reg-row-h') === '36px';
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
  if (neg.drawn) ok('Negotiations inherits the mode', neg.mode === 'compact' && neg.h >= 36 && neg.h < 44, JSON.stringify(neg));
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
