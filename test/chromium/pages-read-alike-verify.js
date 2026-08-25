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
    /* REVERSED IN PLACE A SECOND TIME, 23 Aug 2026, owner-asked ("publish round
       should not be bold") — and the two reversals were the same morning, which
       is worth reading as one movement rather than two.
         · It first read "only the FILLED act is bold", .rl-btn-go being this
           page's single fill.
         · The fill came off, so it became "exactly one act is bold — that is
           what leads now".
         · The owner has now taken the weight as well. NOTHING on the row is
           filled and NOTHING is bold; the round's own next step leads by
           POSITION and by its accent outline alone.
       WHAT THE CLAIM IS REALLY ABOUT SURVIVES INTACT, and it is why both halves
       are still pinned rather than deleted: the row must speak with ONE voice.
       Zero fills and zero bolds is that claim; one of either creeping back is
       the row disagreeing with itself again. Fourth time "one filled act per
       page" has been reversed on this owner's ask — see FIVE FIXES AND A
       CALENDAR, where the contract room's head gave its fill up the day before.
       The head's flatness is now owned end to end by flat-rows-and-alerts,
       which measures it against the neighbours it has to match. */
    check('5 nothing on the row is filled',
      heads.nego.every(b => !b.filled),
      heads.nego.map(b => `${b.t}:${b.filled ? 'FILLED' : 'flat'}`));
    check('5 and nothing on it is bold either — it leads by position, not weight',
      heads.nego.every(b => Number(b.fw) <= 400),
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

    /* ---- 8 · EVERY PAGE HEAD8 IS THE SAME SIZE AND STARTS AT THE SAME HEIGHT
       (owner-asked 25 Aug 2026: "All the headers in every page need to have the
       same size font in every page like highlighted in the picture. The home
       page sets the tone. Also, the distance between the edge at the top and
       the header should be the same across all pages.") ----
       HOME IS THE REFERENCE, so it is read off the page rather than typed: the
       claim is that the others AGREE WITH IT, which costs no edit the next
       time the type scale moves. MEASURED before this: 19/700 on the seven
       pages using the shared header, 20/600 on Negotiations, 15/600 on the
       Calendar's own band — and tops of 10, 13, 16 and 23.

       WIDENED 25 Aug 2026, owner-asked again: "the distance from the edge on
       top of the screen to the header should be the same across the platform
       and using home page as the reference." TWO THINGS WERE WRONG WITH THE
       FIRST PASS. It measured the h1's BOX rather than its first painted
       GLYPH, and those differ by the line box's half-leading — Home and the
       Calendar each centre their title against a 28px control, so their
       glyphs sat 2px lower on identical padding. And it swept the ten pages
       that draw a page head and NOT the contract room or the negotiation
       page, whose heads began 6px and 13px below the bar against everyone
       else's 16.

       SO IT MEASURES INK, AND IT SWEEPS ALL TWELVE. The size and weight
       claims stay scoped to the page heads — the room and the negotiation
       page carry a 15/600 title by an owner ruling of 22 Aug and are
       deliberately not in that comparison. */
    const HEAD8 = () => {
      const sels = ['#page-head h1', '.hm-greet h1', '.cal-head .ttl',
        '.ngl-head h2', '.room-head h1', '#content h1', '#content h2'];
      let h = null;
      for (const s of sels){ const e = document.querySelector(s);
        if (e){ const r = e.getBoundingClientRect(); if (r.width > 2 && r.height > 2){ h = e; break; } } }
      if (!h) return null;
      const cs = getComputedStyle(h);
      const bar = document.getElementById('top-header');
      const top = bar ? bar.getBoundingClientRect().bottom : 0;
      /* THE FIRST PAINTED GLYPH ANYWHERE IN THE HEADER BLOCK — what a reader
         calls "the header", whatever element happens to carry it. On the
         contract room that is the breadcrumb, not the title. A Range's own
         rect is the only honest way to ask: an element's box top is its line
         box, and half-leading puts the ink somewhere else inside it. */
      const blk = h.closest('#page-head, .hm-page, .cal-head, .ngl-head, #ws-head') || h;
      const w = document.createTreeWalker(blk, NodeFilter.SHOW_TEXT);
      let ink = null, txt = '';
      let n; while ((n = w.nextNode())){
        if (!n.textContent.trim()) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        const b = rg.getClientRects()[0]; if (!b || b.height < 2) continue;
        if (ink == null || b.top < ink){ ink = b.top; txt = n.textContent.trim().slice(0, 18); }
      }
      return { size: cs.fontSize, weight: cs.fontWeight, family: cs.fontFamily.split(',')[0],
        ink: ink == null ? null : Math.round(ink - top), inkText: txt,
        text: (h.textContent || '').trim().slice(0, 20) };
    };
    const PAGES8 = [
      ['Home',         () => setView('dashboard')],
      ['Contracts',    () => setView('register')],
      ['Negotiations', () => openNegotiations({ list: true })],
      ['Calendar',     () => setView('calendar')],
      ['Insights',     () => setView('intel')],
      ['Templates',    () => setView('templates')],
      ['Settings',     () => setView('team')],
      ['Reports',      () => setView('reports')],
      ['Approvals',    () => setView('queue')],
      ['Requests',     () => setView('intake')],
      ['People',       () => setView('directory')],
      /* The two the first pass missed, and the two that were really out. */
      ['Contract room',    id => openWorkspace(id)],
      ['Negotiation page', id => openRedlineWorkbench(id)],
    ];
    /* ---- AND IT SWEEPS AT TWO HEIGHTS (owner-reported 25 Aug 2026: "i do not
       see this in the platform as the headers are still vary as far as
       distance to the top edge") ----
       They lined up — at this file's own 1000px viewport, which is the only
       height the sweep that reported it measured. index.html's own short-laptop
       block says why that is worthless, in its own words: "almost no laptop has
       900px of page". MEASURED at 1440x800 before this: Home's header at 10,
       the Calendar's at 16 and the seven shared ones at 24, a 15px spread on
       every machine anybody uses. So the claim is checked TALL and SHORT, and
       760 is inside the max-height:820 band every laptop lands in. */
    const HEIGHTS8 = [1000, 760];
    const runs8 = {};
    for (const H of HEIGHTS8){
      await page.setViewportSize({ width: 1500, height: H });
      await pause(500);
      const heads = {};
      for (const [name, go] of PAGES8){
        try { await page.evaluate(go, cid); } catch (e) { continue; }
        await pause(1700);
        const h = await page.evaluate(HEAD8);
        if (h) heads[name] = h;
      }
      runs8[H] = heads;
    }
    await page.setViewportSize({ width: 1500, height: 1000 });
    await pause(600);
    const heads8 = runs8[1000];
    const home8 = heads8.Home;
    const others8 = Object.entries(heads8).filter(([k]) => k !== 'Home');
    /* The size/weight comparison is the PAGE HEADS only: the room and the
       negotiation page carry a 15/600 title by the owner's own ruling of
       22 Aug ("the two heads say the name at one size"), so demanding Home's
       20/700 there would be this file arguing with that decision. The TOP is
       every page, which is what the 25 Aug ask is about. */
    const ROOMS = ['Contract room', 'Negotiation page'];
    const pageHeads8 = others8.filter(([k]) => !ROOMS.includes(k));
    check('8 the sweep actually reached the pages', !!home8 && others8.length >= 8,
      `${Object.keys(heads8).length} heads8 read`);
    const offSize = pageHeads8.filter(([, h]) => h.size !== home8.size);
    check('8 every page head is the size Home sets',
      offSize.length === 0,
      offSize.map(([k, h]) => `${k} ${h.size} vs Home ${home8 && home8.size}`).join(' · ') || (home8 && home8.size));
    const offWeight = pageHeads8.filter(([, h]) => h.weight !== home8.weight);
    check('8 and the weight Home sets',
      offWeight.length === 0,
      offWeight.map(([k, h]) => `${k} ${h.weight}`).join(' · ') || (home8 && home8.weight));
    /* THE ONE THE 25 Aug ASK IS ABOUT, and it is every page including the two
       room heads. Measured on the INK, which is what a reader sees; ±1px is
       sub-pixel rounding on a Range rect, not a difference anybody can read. */
    check('8 every header block really painted something to measure',
      others8.every(([, h]) => h.ink != null) && home8 && home8.ink != null,
      others8.filter(([, h]) => h.ink == null).map(([k]) => k).join(' · ') || 'all read');
    for (const H of HEIGHTS8){
      const hh = runs8[H] || {};
      const ref = hh.Home;
      const rest = Object.entries(hh).filter(([k]) => k !== 'Home');
      const off = ref ? rest.filter(([, h]) => Math.abs(h.ink - ref.ink) > 1) : [];
      check(`8 at ${H}px tall, the first glyph of every header sits where Home's does`,
        !!ref && rest.length >= 10 && off.length === 0,
        off.map(([k, h]) => `${k} ${h.ink}px «${h.inkText}» vs Home ${ref && ref.ink}px`).join(' · ')
          || `all at ${ref && ref.ink}px, ${Object.keys(hh).length} pages`);
    }
    /* AND THE TIGHTENING IS REAL, not the token quietly ignored: a short
       window has to pull every header up TOGETHER, or the rule above is
       satisfied by nothing moving at all. */
    const tall8 = (runs8[1000] || {}).Home, short8 = (runs8[760] || {}).Home;
    check('8 and a short window pulls them all up rather than none of them',
      !!tall8 && !!short8 && short8.ink < tall8.ink,
      `${tall8 && tall8.ink}px at 1000 · ${short8 && short8.ink}px at 760`);


    /* ---- 9 · THE HEAD'S FACT VALUES ARE BOLD, ON BOTH HEADS
       (owner-asked 25 Aug 2026, off a screenshot of the negotiation head with
       these values boxed: "both in contracts and negotiations, the highlighted
       area needs to be in bold just like in the demo html") ----
       The enterprise reference draws its object-page header facts as a 12px
       label over a 14px/600 value. HaTi's `.room-facet .v` carried no weight
       at all, so the label and the fact under it read at ONE weight and the
       row had no hierarchy in it.
       WRITTEN AS RELATIONS, not as 600: the value is heavier than its own
       label, it is not the inherited default, and the two heads agree — which
       is the claim that matters, because roomFactsHtml is ONE BUILDER WITH TWO
       HOMES and a weight written at a call site is how they would drift. */
    const FACTS9 = () => [...document.querySelectorAll('#ws-facts .room-facet')].map(f => {
      const l = f.querySelector('.l'), v = f.querySelector('.v');
      const gl = l && getComputedStyle(l), gv = v && getComputedStyle(v);
      return { k: l && l.textContent.trim(),
        lw: gl && gl.fontWeight, vw: gv && gv.fontWeight, vs: gv && gv.fontSize };
    });
    await page.evaluate(id => openWorkspace(id), cid);
    await pause(1900);
    const f9room = await page.evaluate(FACTS9);
    await page.screenshot({ path: path.join(OUT, '09-room-facts.png') });
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await pause(2200);
    const f9nego = await page.evaluate(FACTS9);
    await page.screenshot({ path: path.join(OUT, '09-nego-facts.png') });
    check('9 the fact row drew on both heads',
      f9room.length >= 3 && f9nego.length === f9room.length,
      `room ${f9room.length} · negotiation ${f9nego.length}`);
    const light9 = [...f9room, ...f9nego].filter(f => +f.vw <= +f.lw);
    check('9 every value is heavier than its own label',
      f9room.length > 0 && light9.length === 0,
      light9.map(f => `${f.k} ${f.vw} vs label ${f.lw}`).join(' · ')
        || `values ${f9room[0] && f9room[0].vw} over labels ${f9room[0] && f9room[0].lw}`);
    const plain9 = [...f9room, ...f9nego].filter(f => +f.vw < 600);
    check('9 and none of them is back at the inherited default',
      f9room.length > 0 && plain9.length === 0,
      plain9.map(f => `${f.k} ${f.vw}`).join(' · ') || 'all 600 or heavier');
    const drift9 = f9room.filter((f, i) =>
      !f9nego[i] || f9nego[i].vw !== f.vw || f9nego[i].vs !== f.vs);
    check('9 and the two heads read the facts identically — one builder, two homes',
      f9room.length > 0 && drift9.length === 0,
      drift9.map(f => f.k).join(' · ') || `${f9room[0] && f9room[0].vs}/${f9room[0] && f9room[0].vw} on both`);

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
