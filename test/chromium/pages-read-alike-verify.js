/* Chromium verification: THE ROOM AND THE NEGOTIATION PAGE READ ALIKE, AND THE
   NEGOTIATIONS LIST HOLDS STILL WHEN YOU SCROLL IT.
   ============================================================
   Four owner reports off three screenshots, 22 Aug 2026, all four the morning
   after the negotiation page took the mock-up's treatment:

     (1) "you have placed the buttons on the left side of the screen which is
         not how the mock up is designed."
     (2) "the font size in the documents page header should be the same size as
         in the negotiations page."
     (3) "the font type for the tab navigation highlighted should also be
         similar to what we have in the negotiations page."
     (4) "when you scroll in the negotiations list of contracts, it breaks."

   NOBODY HAD PLACED ANY BUTTON ANYWHERE. The head WRAPPED: .room-head is
   flex-wrap:wrap for the contract page, which needs it (its breadcrumb and its
   fact row are full-width items that each take a line), and the negotiation
   page has neither — so a long contract name pushed the four acts onto a
   second line, where they start at the left margin like any wrapped flex item.
   MEASURED against the code of the morning before, on an 81-character name:
   the head grew from 52px to 85px and the acts moved 42px down and 581px away
   from its right edge. That is the whole of report (1), and it is why check 1
   forces a long name into the live head rather than trusting the seeded book,
   whose longest name is 21 characters.

   WHY THIS IS A BROWSER FILE AND NOT A NODE TEST. Every claim here is a
   COMPUTED VALUE or a GEOMETRY:

     · reports (2) and (3) are two pages' rules compared, and the negotiation
       page's are written as a scoped block at the end of a 3,500-line
       stylesheet while the room's are in index.html. A rule that loses a
       cascade fight looks perfectly correct in the source — this codebase's
       own most expensive lesson (.rl-rej computed to border-width 0 for a year
       while a source-reading test passed on it throughout). So the two pages
       are asked what they DRAW, and the claim is that the two answers are the
       SAME, never that either is a particular number: pin the relation, not
       the number, or the next type pass costs five test edits;
     · report (1) is "does this row wrap", which is a measurement against a
       neighbour under a name long enough to make it wrap;
     · report (4) is two position:sticky elements resting against each other,
       and jsdom resolves no sticky at all. The band's offset was typed as 38px
       against a header that renders 35, so a 3px slot sat between them that
       every row scrolled visibly through. Check 4 finds the pinned band by
       PROXIMITY rather than by an exact match — matching exactly would report
       "no band is pinned" for the very fault being measured — and then counts
       the rows painting in the slot. 3 of its 6 claims fail against the code
       of the morning before, with slot 2.7px and one row leaking through.

   Run: node test/chromium/pages-read-alike-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'pages-read-alike');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* Live negotiations on several contracts, filed through the funnel's own door,
   so the Negotiations list draws a real table with its bands rather than the
   empty card. */
const SEED = async () => {
  const live = state.contracts.filter(x => x.status !== 'Signed' && x.status !== 'Declined').slice(0, 12);
  for (let i = 0; i < live.length; i++){
    const c = live[i]; negoInit(c);
    const cl = negoClauseList(c);
    if (cl[0]) await negoEditClause(c, cl[0].clauseId,
      cl[0].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(Number(String(m).replace(/,/g, '')) + 500)),
      { author: i % 2 ? 'Amina Otieno' : 'Erik Lindqvist', side: i % 2 ? 'owner' : 'counterparty',
        why: 'Aligns with the volumes we have shipped this year.' });
  }
  return live[0].id;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);
    const cid = await page.evaluate(SEED);
    await pause(1800);

    /* ---- THE ROOM, then THE NEGOTIATION PAGE, on the SAME contract ---- */
    await page.evaluate(id => openWorkspace(id), cid);
    await pause(2000);
    await page.screenshot({ path: path.join(OUT, '01-room.png') });
    const room = await page.evaluate(() => {
      const g = e => e ? getComputedStyle(e) : null;
      const h1 = document.querySelector('.room-head h1');
      const tabs = [...document.querySelectorAll('#ws-tabs .room-tab')];
      const rest = tabs.find(t => !t.classList.contains('on'));
      const on = tabs.find(t => t.classList.contains('on'));
      return { h1: h1 && { fs: g(h1).fontSize, fw: g(h1).fontWeight },
        rest: rest && { fs: g(rest).fontSize, fw: g(rest).fontWeight, c: g(rest).color },
        on: on && { fs: g(on).fontSize, fw: g(on).fontWeight, c: g(on).color },
        tabs: tabs.length };
    });

    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await pause(2200);
    await page.screenshot({ path: path.join(OUT, '02-negotiation.png') });
    const nego = await page.evaluate(() => {
      const g = e => e ? getComputedStyle(e) : null;
      const h1 = document.querySelector('#view-redline #ws-head .room-name h1');
      const segs = [...document.querySelectorAll('#view-redline .rl-readwrap .rl-seg')];
      const rest = segs.find(s => !s.classList.contains('on'));
      const on = segs.find(s => s.classList.contains('on'));
      const head = document.querySelector('#view-redline #ws-head');
      const acts = document.querySelector('#view-redline #ws-head .room-acts');
      const hr = head && head.getBoundingClientRect(), ar = acts && acts.getBoundingClientRect();
      return { h1: h1 && { fs: g(h1).fontSize, fw: g(h1).fontWeight },
        rest: rest && { fs: g(rest).fontSize, fw: g(rest).fontWeight, c: g(rest).color },
        on: on && { fs: g(on).fontSize, fw: g(on).fontWeight, c: g(on).color },
        wrap: head && g(head).flexWrap, headH: hr && Math.round(hr.height),
        dTop: (ar && hr) ? Math.round(ar.top - hr.top) : null,
        gapRight: (ar && hr) ? Math.round(hr.right - ar.right) : null,
        segs: segs.length };
    });

    /* ---- 1 · THE ACTS ARE AT THE HEAD'S RIGHT, ON ITS OWN LINE ---- */
    check('1 the negotiation head does not wrap', nego.wrap === 'nowrap', nego.wrap);
    check('1 it is ONE line', nego.headH <= 60, nego.headH);
    check('1 the acts start at the head\'s own top', nego.dTop !== null && nego.dTop < 26, nego.dTop);
    check('1 and they end at its right edge', nego.gapRight !== null && nego.gapRight < 40, nego.gapRight);
    /* THE REPORTED NAME WAS LONG — the seeded book's longest is 21 characters
       and a heavy record is re-read from the server on open, so the name is
       forced into the live head and the row re-measured. Nothing else on the
       head changes, so this is exactly the geometry the report is about. */
    const longName = await page.evaluate(() => {
      const h1 = document.querySelector('#view-redline #ws-head .room-name h1');
      const back = h1.querySelector('.room-title-back') || h1;
      back.textContent = 'Master Manufacturing, Distribution and Route-to-Market Services Agreement (KE/SE)';
      const head = document.querySelector('#view-redline #ws-head');
      const acts = document.querySelector('#view-redline #ws-head .room-acts');
      const hr = head.getBoundingClientRect(), ar = acts.getBoundingClientRect();
      return { len: h1.textContent.trim().length, headH: Math.round(hr.height),
        dTop: Math.round(ar.top - hr.top), gapRight: Math.round(hr.right - ar.right),
        overflows: hr.right < ar.right };
    });
    await page.screenshot({ path: path.join(OUT, '03-long-name.png') });
    check('1 the name under it is genuinely long', longName.len >= 60, longName.len);
    check('1 the head is STILL one line under it',
      longName.headH <= 60 && longName.dTop < 26, longName);
    check('1 and the acts are still at its right, neither dropped nor pushed off',
      longName.gapRight >= 0 && longName.gapRight < 40 && !longName.overflows, longName);

    /* ---- 2 · BOTH HEADS SAY THE NAME AT ONE SIZE ----
       The RELATION, not the number: whatever this product decides a room title
       is, one contract must not wear two of them. */
    check('2 the same size on both pages',
      room.h1.fs === nego.h1.fs, { room: room.h1.fs, nego: nego.h1.fs });
    check('2 and the same weight',
      room.h1.fw === nego.h1.fw, { room: room.h1.fw, nego: nego.h1.fw });

    /* ---- 3 · THE TWO TAB ROWS READ ALIKE ---- */
    check('3 both rows really drew', room.tabs >= 3 && nego.segs >= 3,
      { room: room.tabs, nego: nego.segs });
    check('3 a resting tab is the same ink',
      room.rest.c === nego.rest.c, { room: room.rest.c, nego: nego.rest.c });
    check('3 resting size and weight agree',
      room.rest.fs === nego.rest.fs && room.rest.fw === nego.rest.fw,
      { room: room.rest, nego: nego.rest });
    check('3 and the live tab agrees on all three',
      room.on.c === nego.on.c && room.on.fw === nego.on.fw && room.on.fs === nego.on.fs,
      { room: room.on, nego: nego.on });

    /* ---- 4 · THE NEGOTIATIONS LIST HOLDS STILL WHEN YOU SCROLL IT ---- */
    await page.evaluate(() => openNegotiations({ list: true }));
    await pause(1600);
    const band = await page.evaluate(async () => {
      const sc = document.getElementById('reg-scroll');
      if (!sc) return { err: 'the list drew no table' };
      const th = sc.querySelector('.reg-table thead th');
      const bd = sc.querySelector('.ngl-band > td');
      if (!th || !bd) return { err: 'no header or no band' };
      const prop = getComputedStyle(sc).getPropertyValue('--reg-head-h').trim();
      const thH = Math.round(th.getBoundingClientRect().height);
      const top = getComputedStyle(bd).top;
      /* The seeded book yields a handful of live negotiations, which fit. What
         is being measured is sticky pinning, so the scroller is given a height
         it cannot fit in — the state a full register puts it in every day. */
      sc.style.height = '150px'; sc.style.flex = 'none';
      await new Promise(r => requestAnimationFrame(r));
      sc.scrollTop = Math.min(300, sc.scrollHeight - sc.clientHeight);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const thR = th.getBoundingClientRect();
      /* A pinned band is one that has stopped moving with its rows and come to
         rest near the top. Found by PROXIMITY, never by an exact match: an
         exact match reports "nothing is pinned" for the very fault this is
         about, and then the slot below is never measured. */
      const pinned = [...sc.querySelectorAll('.ngl-band > td')].map(e => e.getBoundingClientRect())
        .filter(r => r.height > 0 && r.top >= thR.top - 1 && r.top < thR.bottom + 14);
      let leak = 0, slot = null;
      if (pinned.length){
        slot = +(pinned[0].top - thR.bottom).toFixed(2);
        if (slot > 0.6) for (const tr of sc.querySelectorAll('tbody tr:not(.ngl-band)')){
          const r = tr.getBoundingClientRect();
          if (r.bottom > thR.bottom + 0.6 && r.top < pinned[0].top - 0.6) leak++;
        }
      }
      return { prop, thH, top, pinnedCount: pinned.length, slot, leak,
        scrolled: Math.round(sc.scrollTop) };
    });
    await page.screenshot({ path: path.join(OUT, '04-list-scrolled.png') });
    check('4 --reg-head-h is the header\'s own measured height',
      band.prop === band.thH + 'px', band);
    check('4 the band pins at exactly that height, never a typed number',
      band.top === band.thH + 'px', band);
    check('4 the list really scrolled', band.scrolled > 0, band);
    check('4 a band really is pinned near the header', band.pinnedCount >= 1, band);
    check('4 no slot between the header and the pinned band',
      band.slot !== null && band.slot < 1, band);
    check('4 and no row shows through between them', band.leak === 0, band);

    check('no page errors', errors.length === 0, errors.slice(0, 3));
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  console.log(`Screenshots: ${OUT}`);
  process.exit(bad.length ? 1 : 0);
})();
