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

/* The chip, as it DRAWS — the question is its dress as much as its words, and
   a stylesheet cannot answer either. */
const READ_CHIP = () => {
  const e = document.getElementById('dk-chip');
  if (!e) return { absent: true };
  const cs = getComputedStyle(e), r = e.getBoundingClientRect();
  return { text: (e.textContent || '').replace(/\s+/g, ' ').trim(),
    h: Math.round(r.height), bg: cs.backgroundColor,
    bd: cs.borderTopWidth, pad: cs.padding, cursor: cs.cursor };
};

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

    /* ---- 5 · EVERY BUTTON IN A HEAD ROW IS ONE HEIGHT ----
       Owner-reported 22 Aug 2026: "the height of the buttons for more,
       internal review, share, publish round should be the same height. Confirm
       this is the case because I saw differences previously." They had seen
       it: MEASURED on the negotiation head, THREE heights in one row of four —
       More at 34 (.ws-more-btn set its own), Share at 28 (.ui-btn-lg's), and
       Publish Round and Internal review at 32.1875, a FRACTION, because
       .rl-btn and .rl-pb-btn name no height and theirs fell out of 13px type
       plus 6px of padding. Two of the four were a size smaller as well.

       THE CLAIM IS A RELATION, NOT A NUMBER — "they all agree", never "28px" —
       so a future change to .ui-btn-lg costs no test edit. And it is asked of
       EVERY button the row draws rather than of the four that were reported:
       a check naming today's four is one that the next button added there
       walks straight past.

       BOTH HEADS, because .ws-more-btn was wrong on the contract room's too
       and only one of them was in the screenshot. And the TOPS as well as the
       heights: two buttons of equal height sitting on different baselines is
       the same complaint wearing different clothes. */
    /* Section 4 left the page on the Negotiations LIST — reopen the bench, or
       this reads an empty row and passes on nothing. */
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await pause(2200);
    const heads = await page.evaluate(() => {
      const read = sel => [...document.querySelectorAll(sel)]
        .filter(b => b.getBoundingClientRect().height > 0)
        .map(b => { const c = getComputedStyle(b), r = b.getBoundingClientRect();
          return { t: (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20),
            h: +r.height.toFixed(2), top: +r.top.toFixed(1),
            fs: c.fontSize, fw: c.fontWeight,
            filled: c.backgroundColor !== 'rgba(0, 0, 0, 0)' }; });
      return { nego: read('#view-redline #ws-head .room-acts button') };
    });
    const uniq = (rows, k) => [...new Set(rows.map(r => r[k]))];
    check('5 the negotiation head really draws the four that were reported',
      heads.nego.length >= 4, heads.nego.map(b => b.t));
    check('5 every button in it is the same height',
      uniq(heads.nego, 'h').length === 1, uniq(heads.nego, 'h'));
    check('5 on the same baseline',
      uniq(heads.nego, 'top').length === 1, uniq(heads.nego, 'top'));
    check('5 at the same size',
      uniq(heads.nego, 'fs').length === 1, uniq(heads.nego, 'fs'));
    /* WEIGHT IS THE ONE THING ALLOWED TO DIFFER, and exactly one act may carry
       it. REVERSED IN PLACE 23 Aug 2026, owner-asked ("the publish round 1
       button should also not be shaded"): this used to read "only the FILLED
       act is bold", because .rl-btn-go was this page's single fill. It is not
       filled any more — so weight is now the whole of what marks the round's
       own next step, and the claim is written as the relation it was always
       about: exactly one bold act, and nothing on the row filled. The third
       time "one filled act per page" has been reversed on the owner's ask; see
       FIVE FIXES AND A CALENDAR, where the contract room's head gave its fill
       up the day before for the same reason. */
    check('5 nothing on the row is filled',
      heads.nego.every(b => !b.filled),
      heads.nego.map(b => `${b.t}:${b.filled ? 'FILLED' : 'flat'}`));
    check('5 and exactly one act is bold — that is what leads now',
      heads.nego.filter(b => b.fw === '700').length === 1,
      heads.nego.map(b => `${b.t}:${b.fw}`));

    await page.evaluate(id => openWorkspace(id), cid);
    await pause(1800);
    const room2 = await page.evaluate(() => [...document.querySelectorAll('.room-head .room-acts button')]
      .filter(b => b.getBoundingClientRect().height > 0)
      .map(b => { const r = b.getBoundingClientRect();
        return { t: (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20),
          h: +r.height.toFixed(2), top: +r.top.toFixed(1) }; }));
    check('5 the contract room\'s head agrees with itself too',
      room2.length >= 3 && [...new Set(room2.map(b => b.h))].length === 1
        && [...new Set(room2.map(b => b.top))].length === 1,
      room2);
    /* AND NO HEIGHT IN EITHER ROW IS A FRACTION. A button whose height falls
       out of type plus padding lands between device pixels and reads soft —
       the same fault the 22 Aug type sweep spent 865 replacements on. */
    check('5 and no button height is a fraction of a pixel',
      [...heads.nego, ...room2].every(b => Number.isInteger(b.h)),
      [...heads.nego, ...room2].map(b => b.h));

    /* ---- 6 · THE PEOPLE CHIP IS ONE CHIP (owner-reported 22 Aug 2026: "the
       nobody assigned yet should resemble the negotiations page … also, do not
       put a grey box around it") ----
       Both pages call deskChipHtml, so the WORDS already agreed — measured on
       one contract, both read "AO You lead". What differed was the dress: the
       negotiation page had stripped the box in a scoped rule of its own, and
       the contract room kept a bordered grey pill 34px tall against buttons of
       28. The flat treatment is the BASE rule now and the scoped one is gone.
       ASSERTED AS A RELATION on both halves — same words AND same dress — so
       this catches a future page that re-boxes it as readily as one that makes
       it say something else. */
    await page.evaluate(id => openWorkspace(id), cid);
    await pause(1800);
    const chipRoom = await page.evaluate(READ_CHIP);
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await pause(2200);
    const chipNego = await page.evaluate(READ_CHIP);
    check('6 the chip really drew on both pages',
      !chipRoom.absent && !chipNego.absent, { room: chipRoom, nego: chipNego });
    check('6 and says the same thing on both',
      chipRoom.text === chipNego.text, { room: chipRoom.text, nego: chipNego.text });
    check('6 with no box round it — no border, no fill',
      chipRoom.bd === '0px' && chipRoom.bg === 'rgba(0, 0, 0, 0)',
      { border: chipRoom.bd, background: chipRoom.bg });
    check('6 and it is dressed identically on both pages',
      chipRoom.bd === chipNego.bd && chipRoom.bg === chipNego.bg
        && chipRoom.h === chipNego.h && chipRoom.pad === chipNego.pad,
      { room: chipRoom, nego: chipNego });

    /* ---- 7 · EVERY BUTTON IN A HEAD ROW WEARS THE SAME OUTLINE ----
       Owner-reported 23 Aug 2026, off two screenshots: "the more buttons
       should have the same color outline like the other buttons", and "the
       publish round 1 button should also not be shaded."

       MEASURED before it was touched: .ws-more-btn named a GREY border of its
       own — the one button in the row not wearing .ui-btn's accent — while
       .rl-btn-go carried the accent FILL. So the row had two odd men out, at
       opposite ends: one too quiet to read as a button and one loud enough to
       read as a second primary. Both are the same defect this file has already
       recorded twice in other clothes: a control dressing itself instead of
       inheriting the class every other control on the row inherits.

       A RELATION AGAIN, not a colour: every button in the row agrees, and the
       one they agree on is not "no outline". Both heads, because .ws-more-btn
       draws on the contract room's too and only the negotiation head was in
       the screenshot. */
    const outlines = async () => page.evaluate(sel =>
      [...document.querySelectorAll(sel)]
        .filter(b => b.getBoundingClientRect().height > 0)
        .map(b => { const c = getComputedStyle(b);
          return { t: (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 18),
            bd: c.borderTopColor, bw: c.borderTopWidth,
            bg: c.backgroundColor }; }),
      '#ws-head .room-acts button, .room-head .room-acts button');

    const oNego = await outlines();
    check('7 the negotiation head draws its row', oNego.length >= 4, oNego.map(b => b.t));
    check('7 every button in it has an outline', oNego.every(b => parseFloat(b.bw) > 0),
      oNego.map(b => `${b.t}:${b.bw}`));
    check('7 and they are all the same colour — More included',
      [...new Set(oNego.map(b => b.bd))].length === 1, [...new Set(oNego.map(b => b.bd))]);
    check('7 none of them is shaded inside',
      oNego.every(b => b.bg === 'rgba(0, 0, 0, 0)'), oNego.map(b => `${b.t}:${b.bg}`));

    await page.evaluate(id => openWorkspace(id), cid);
    await pause(1800);
    const oRoom = await outlines();
    check('7 the contract room\'s head agrees with itself the same way',
      oRoom.length >= 3 && [...new Set(oRoom.map(b => b.bd))].length === 1
        && oRoom.every(b => parseFloat(b.bw) > 0), oRoom);
    check('7 and both heads settled on the SAME outline — one class, two pages',
      oRoom[0].bd === oNego[0].bd, { room: oRoom[0].bd, nego: oNego[0].bd });

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
