/* THE CONTRACT ROOM'S HEADER SNAPS — SAP Fiori's dynamic page header
   (25 Aug 2026). The title, the status and the acts persist; the FACT ROW
   scrolls away and comes back at the top.

   THREE THINGS THIS FILE EXISTS TO PIN, and each is a way the feature could
   be built wrong rather than not built:
     - the manual control must WIN. Snapping that overrides a reader's own
       press means they open the facts, scroll one notch, and watch them shut.
     - the fact row must stay REACHABLE. A snap that hides four facts also
       removes them from the tab order unless focus re-expands it — Fiori
       documents exactly that behaviour and it is the accessible half.
     - the title, status and acts must NOT move. A head whose buttons jump
       when it folds is a head you stop trusting, and that is the reason the
       fold was scoped to the facts in the first place. */
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
  /* Deliberately short, so the room's own content is taller than the pane and
     there is something to scroll. */
  const page = await b.newPage({ viewport: { width: 1440, height: 700 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(1600);
  await page.evaluate(() => setView('register'));
  await page.waitForTimeout(900);
  await page.evaluate(() => document.querySelector('#reg-tbody [data-row]').click());
  await page.waitForTimeout(1400);

  const folded = () => page.evaluate(() => {
    const el = document.getElementById('ws-facts');
    return el ? el.classList.contains('is-folded') : null;
  });
  /* THE ROOM'S SCROLLER IS NOT #content-scroll — MEASURED, that has 0px of
     scroll here. The head sits above the room's own inner scroller and each
     tab mounts a different one (#doc-scroll on Document, its own column on
     Key terms). The test drives whichever one is actually scrollable, the
     same way the feature's capture listener finds it. */
  const scrollTo = y => page.evaluate(async v => {
    const main = document.getElementById('content-scroll');
    const inner = [...main.querySelectorAll('*')]
      .find(el => el.scrollHeight - el.clientHeight > 40 && el.clientHeight > 120
                  && /auto|scroll/.test(getComputedStyle(el).overflowY));
    const s = inner || main;
    s.scrollTop = v;
    s.dispatchEvent(new Event('scroll', { bubbles: false }));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, y);
  const anchors = () => page.evaluate(() => {
    const pick = sel => { const e = document.querySelector(sel); if (!e) return null;
      const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top) }; };
    return { title: pick('#ws-head h1, .room-name h1, .room-head h1'),
             acts: pick('#ws-head .room-acts'), back: pick('#ws-back') };
  });

  console.log('\n1 · the room is up and the facts are open');
  ok('the fact row exists', (await folded()) !== null);
  ok('and starts open', (await folded()) === false);
  const scrollable = await page.evaluate(() => {
    const main = document.getElementById('content-scroll');
    const inner = [...main.querySelectorAll('*')]
      .find(el => el.scrollHeight - el.clientHeight > 40 && el.clientHeight > 120
                  && /auto|scroll/.test(getComputedStyle(el).overflowY));
    const s = inner || main;
    return s.scrollHeight - s.clientHeight;
  });
  ok('there is something to scroll', scrollable > 60, scrollable + 'px of scroll');

  console.log('\n2 · it snaps on scroll, both ways');
  const before = await anchors();
  await scrollTo(240);
  ok('scrolling down folds the facts', (await folded()) === true);
  const after = await anchors();
  ok('the title did not move', JSON.stringify(before.title) === JSON.stringify(after.title),
     JSON.stringify(before.title) + ' → ' + JSON.stringify(after.title));
  ok('the acts did not move', JSON.stringify(before.acts) === JSON.stringify(after.acts));
  await scrollTo(0);
  ok('back at the top it opens again', (await folded()) === false);

  console.log('\n3 · what was deliberately NOT built');
  /* Fiori's dynamic header re-expands when its content takes keyboard focus.
     It is not built here, and this section pins WHY so nobody adds it back
     without changing the fold first:
       - the fold is display:none, and a display:none subtree cannot receive
         focus at all, so a focusin handler could never fire;
       - the folded region holds only divs, so folding removes nothing from
         the tab order to begin with;
       - and a handler watching the whole row would have fired for the
         Collapse button, which sits inside #ws-facts but outside the fold —
         popping the facts open on the one press that means the opposite. */
  ok('nothing in the folded region is focusable, so the fold costs no tab stop',
     (await page.evaluate(() => document.querySelectorAll(
       '#ws-facts .room-facets a,#ws-facts .room-facets button,#ws-facts .room-facets [tabindex]').length)) === 0);
  await scrollTo(240);
  ok('and the region really is display:none when folded', await page.evaluate(() => {
    const f = document.querySelector('#ws-facts .room-facets');
    return getComputedStyle(f).display === 'none';
  }));
  ok('tabbing to Collapse does NOT pop the row open', await page.evaluate(async () => {
    document.getElementById('ws-facts-toggle').focus();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return document.getElementById('ws-facts').classList.contains('is-folded');
  }));

  console.log('\n4 · the reader\'s own press wins over the snap');
  await scrollTo(0);
  await page.waitForTimeout(200);
  await page.click('#ws-facts-toggle');
  await page.waitForTimeout(250);
  const pinnedShut = await folded();
  ok('pressing Collapse folds it', pinnedShut === true);
  await scrollTo(0);
  ok('and scrolling to the top does NOT undo the reader', (await folded()) === true);
  await page.click('#ws-facts-toggle');
  await page.waitForTimeout(250);
  ok('pressing again opens it', (await folded()) === false);
  await scrollTo(300);
  ok('and scrolling down does NOT undo that either', (await folded()) === false);

  console.log('\n5 · the control still says what it does');
  const lbl = await page.evaluate(() => {
    const t = document.getElementById('ws-facts-toggle');
    return { exp: t.getAttribute('aria-expanded'), word: t.textContent.trim() };
  });
  ok('aria-expanded tracks the state', lbl.exp === 'true', JSON.stringify(lbl));
  ok('and it is translated, not a raw key', lbl.word.length > 0 && !/^ct_/.test(lbl.word), lbl.word);

  console.log('\n' + (errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close();
  await h.stop();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS:', e.message); process.exit(2); });
