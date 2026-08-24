/* Chromium verification: "COUNTERPARTY READY TO SIGN" IS SAID WHERE THE
   READER IS LOOKING.
   ============================================================
   Owner-reported 23 Aug 2026, off four screenshots, in three parts:

     1. "An alert saying counterparty was ready to sign is not appearing on
        the side panel."
     2. "When the counterparty has signalled that they are ready to sign, the
        bell sign at the bottom of the right corner should loudly turn green
        and blink signalling this. You can click on the bell to see the alert
        then it goes back to yellow."
     3. "Where it says in review, it should also say counterparty ready to
        sign unless you resume negotiations again which will then revert back
        to in review."

   f237 pins the rules that can be read off the source — that there is ONE
   predicate rather than four, that the alert kind is registered, that the
   words exist in both languages, and the bell's own news arithmetic. THIS file
   exists because buildWorld deliberately never loads the shell, so
   cpReadyToSign, the three status builders and buildAlerts cannot be DRIVEN
   there at all — and because two of the three reported items are colours, and
   this codebase has been caught more than once by a rule that reads perfectly
   in the source and loses a cascade fight on the way to the screen.

   So everything here is measured on the real page:

     · the head row's status word, and its computed COLOUR
     · the register row's short form, in a real table cell
     · a real press of the bell in the header, and the row inside the panel
     · the bell bottom-right: the class, the computed background, and the
       ANIMATION NAME — the only place "it blinks" can be asked
     · the whole loop the owner described: green, press, read, amber
     · and filing one more change putting every one of them back

   Run: node test/chromium/ready-to-sign-signal-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* Measured against the product's own tokens rather than against the words
   "green" and "yellow": --st-green-bg and --st-amber-bg as they resolve in the
   light theme. */
/* ---- THE TONE IS ON THE COUNT BADGE NOW, NOT ON A BUTTON'S FACE ----
   These were --st-green-bg / --st-amber-bg: the WASH behind the floating bell,
   which was a soft-filled pill. That bell is retired (owner-asked 23 Aug 2026,
   "I do not want anything floating over the page") and the treatment moved to
   the header bell, which is an icon with a count badge — so the badge is what
   carries the tone and the DOT tokens are what it wears. Same two facts, read
   off the surface that states them now. */
const GREEN_BG = 'rgb(16, 185, 129)';    /* --st-green-dot */
const AMBER_BG = 'rgb(245, 158, 11)';    /* --st-amber-dot */

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---------- the stage ----------
       A live negotiation whose one ask has been settled, and then the
       counterparty's signal recorded THROUGH THE MODEL'S OWN DOOR
       (negoSignalReady). A hand-stamped `ready` block would prove nothing
       about the reading: the two could disagree about the shape and the test
       would still pass.

       It is persisted and flushed, because an in-memory change is overwritten
       by the server refetch the moment the room opens — a fixture that quietly
       undoes itself proves nothing. */
    const cid = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      await ensureFull(c); negoInit(c);
      const cl = negoClauseList(c);
      await negoEditClause(c, cl[0].clauseId,
        cl[0].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(+String(m).replace(/,/g, '') + 500)),
        { author: 'Ola Nordmann', side: 'counterparty', why: 'Volumes.' });
      const ch = c.changes[c.changes.length - 1];
      negoResolve(c, ch.id, 'accepted', { by: 'Amina Otieno' });
      negoSignalReady(c, { side: 'counterparty', by: 'Ola Nordmann', at: new Date().toISOString() });
      persist(c); await flushSaves();
      return c.id;
    });
    await page.waitForTimeout(1400);

    const staged = await page.evaluate(id => {
      const c = state.contracts.find(x => x.id === id);
      const sig = window.negoReadySignal ? negoReadySignal(c, 'counterparty') : null;
      return { status: c.status, by: sig && sig.by, stale: sig && sig.stale, ready: cpReadyToSign(c) };
    }, cid);
    check('the stage really is what the report describes',
      staged.ready === true && staged.stale === false && staged.status === 'Under Review',
      JSON.stringify(staged));
    check('and the STORED status has not moved — this is an overlay, not a fourth value',
      staged.status === 'Under Review', staged.status);

    /* ---------- 1. the status word (the owner's image 3 & 4) ---------- */
    await page.evaluate(id => openWorkspace(id), cid);
    await page.waitForTimeout(2000);
    const st = await page.evaluate(() => {
      const e = document.querySelector('.room-head .room-stat');
      return e ? { text: e.textContent.trim(), color: getComputedStyle(e).color } : null;
    });
    check('the contract head says they are ready, in words',
      !!st && /ready to sign/i.test(st.text), st && st.text);
    check('and it is GREEN, not the amber "In Review" wore',
      !!st && st.color !== 'rgb(180, 83, 9)' && /rgb\(\s*\d+,\s*1[0-9]\d,\s*\d+\s*\)/.test(st.color),
      st && st.color);

    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(1600);
    const row = await page.evaluate(id => {
      const tr = [...document.querySelectorAll('#reg-tbody tr')].find(r => r.textContent.includes(id));
      if (!tr) return null;
      const chip = tr.querySelector('.badge[title]');
      return { text: tr.textContent, title: chip && chip.getAttribute('title') };
    }, cid);
    check('the register row says the SHORT form — a column has no room for a sentence',
      !!row && /Ready to sign/i.test(row.text) && !/Counterparty ready/i.test(row.text),
      row && row.text.slice(0, 90));
    check('but the whole sentence is still on its hover',
      !!row && /Counterparty ready to sign/i.test(row.title || ''), row && row.title);

    /* ---------- 2. the alerts panel (the owner's image 1) ----------
       ONLY THE BUILDER IS ASKED HERE, and the ordering matters: opening this
       panel is what SETTLES the news (renderContextPanel marks it seen as it
       paints), so a press at this point would spend the very thing section 3
       exists to measure. The panel is opened for real below, through the door
       the owner named — the bell on the contract — and the header's own door is
       proved at the end, once there is nothing left to spend. */
    const built = await page.evaluate(() =>
      buildAlerts().filter(r => r.kind === 'cp-ready').map(r => r.text));
    check('a cp-ready row is built — the reported gap', built.length === 1, JSON.stringify(built));
    check('and it is FIRST in the list — they have done their part, the move is yours',
      await page.evaluate(() => (buildAlerts()[0] || {}).kind) === 'cp-ready');

    /* ---------- 3. the bell (the owner's image 2) ----------
       The animation NAME is the whole reason this check is in a browser:
       nothing else can say a rule survived the cascade to actually run. */
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await page.waitForTimeout(2400);
    /* ---- THE BELL MOVED, THE OWNER'S SENTENCE DID NOT (23 Aug 2026) ----
       This measured the FLOATING bell in the bottom-right corner, which is
       where the owner asked for the green blink. That afternoon they asked that
       nothing float over the page, so the floating bell went and the green
       treatment moved to the HEADER bell — the only one left, and the one that
       already opened this same panel with this same count. Every claim below is
       word for word what it was; only the element it is asked of has changed.
       THE COLOUR IS READ OFF THE DOT rather than the button: the header bell is
       an icon with a count badge, so the badge is what carries the tone, while
       the blink plays on the button around it. */
    let bell = await page.evaluate(() => {
      const b = document.getElementById('hdr-notify');
      if (!b) return null;
      const cs = getComputedStyle(b);
      const dot = document.getElementById('hdr-notify-dot');
      return { news: b.classList.contains('is-news'),
        bg: dot ? getComputedStyle(dot).backgroundColor : null,
        anim: cs.animationName, count: cs.animationIterationCount,
        label: b.getAttribute('title') };
    });
    check('the bell is green', !!bell && bell.news && bell.bg === GREEN_BG,
      bell && bell.bg);
    check('and it is really blinking — the animation is running, not merely declared',
      !!bell && bell.anim === 'hdr-bell-news', bell && bell.anim);
    check('a few times and then it stops',
      !!bell && Number(bell.count) > 0 && Number(bell.count) < 10, bell && bell.count);
    /* THE LABEL IS THE HEADER BELL'S OWN — it names the COUNT, because it is
       the workspace's bell and speaks for every row behind it, not for one
       contract. What the news is, is said by the green and by the row itself.
       Said out loud rather than quietly dropped: the floating bell's label
       named the signal, and that sentence is not on the bell any more. */
    check('and it still says what is waiting, in the header bell\'s own words',
      !!bell && /\d/.test(bell.label || ''), bell && bell.label);

    /* ---- REVERSED IN PLACE 23 Aug 2026, owner-asked ----
       This used to press the bell to UNFOLD the notice, then press Hide and
       measure the bell going amber. The bell opens the workspace ALERTS PANEL
       now, and the notices it used to fold draw in place — so the notice needs
       no press at all, and what the press has to be measured on is the panel.
       The claim underneath is the owner's own sentence and has not moved: you
       click the bell, you see the alert, and it goes back to yellow. */
    /* REVERSED AGAIN, same day: the readiness NOTICE left this page's stack
       when the stack stopped floating — four surfaces for one fact was three
       too many, and the one that took a row over the work is the one that went.
       It is said by the status word beside the contract's name and by the row
       in the panel, both of which this file already measures. */
    check('the head says it instead — no card, no press, no floating box',
      await page.evaluate(() =>
        /ready to sign/i.test((document.getElementById('ws-status') || {}).textContent || '')));

    await page.evaluate(() => document.getElementById('hdr-notify').click());
    await page.waitForTimeout(900);
    const opened = await page.evaluate(() => {
      const panel = document.getElementById('context-panel');
      const open = !!(panel && panel.classList.contains('open'));
      const rows = panel ? [...panel.querySelectorAll('[data-alert-i]')] : [];
      const mine = rows.find(r => /ready to sign/i.test(r.innerText || ''));
      return { open, title: (document.getElementById('panel-title') || {}).textContent || '',
        hit: !!mine, good: !!(mine && mine.classList.contains('al-good')),
        anim: mine ? getComputedStyle(mine).animationName : null,
        vis: mine ? Math.round(mine.getBoundingClientRect().height) : 0 };
    });
    check('pressing the bell opens the ALERTS panel — "the side panel alert system"',
      opened.open && /alert/i.test(opened.title), JSON.stringify({ open: opened.open, title: opened.title }));
    check('with the ready-to-sign row inside it, as visible pixels',
      opened.hit && opened.vis > 8, JSON.stringify({ hit: opened.hit, vis: opened.vis }));
    check('the row is GREEN — the only good news on a list of chores',
      opened.good, opened.good);
    check('and it FLASHES, once, on the sitting it is first seen — the animation is running',
      opened.anim === 'al-row-news', opened.anim);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
    bell = await page.evaluate(() => {
      const b = document.getElementById('hdr-notify');
      const cs = b && getComputedStyle(b);
      const dot = document.getElementById('hdr-notify-dot');
      return b ? { news: b.classList.contains('is-news'),
        bg: dot ? getComputedStyle(dot).backgroundColor : null,
        anim: cs.animationName } : null;
    });
    check('"then it goes back to yellow"',
      !!bell && !bell.news && bell.bg === AMBER_BG && bell.anim === 'none', JSON.stringify(bell));

    /* AND THE ROW IS CALM THE SECOND TIME. Opening the panel is what counts as
       having seen it: the flash is over, the green is not. */
    await page.evaluate(() => document.getElementById('hdr-notify').click());
    await page.waitForTimeout(800);
    const again = await page.evaluate(() => {
      const r = [...document.querySelectorAll('#context-panel [data-alert-i]')]
        .find(x => /ready to sign/i.test(x.innerText || ''));
      return r ? { good: r.classList.contains('al-good'), news: r.classList.contains('al-news'),
        anim: getComputedStyle(r).animationName } : null;
    });
    check('reopening it: still green, no longer flashing',
      !!again && again.good && !again.news && again.anim === 'none', JSON.stringify(again));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    /* AMBER IS WORK AND GREEN IS NEWS, and this is the pair that says so.
       Looking cleared the news; it must NOT have cleared the fact. */
    const stillWork = await page.evaluate(id =>
      cpReadyToSign(state.contracts.find(x => x.id === id)), cid);
    check('but the WORK is untouched — the standing rule holds', stillWork === true, stillWork);

    /* ---- AND THE HEADER'S BELL IS THE SAME DOOR ONTO THE SAME PANEL ----
       Two doors, one room. Asked last because by now the news is spent, so
       nothing here can be confused with the flash measured above.
       #cmd-panel and #hdr-notify are the two BUTTONS; #context-panel is the one
       shell they both fill. Reaching for the button's id is a mistake this file
       made once and is worth not repeating. */
    await page.click('#hdr-notify');
    await page.waitForTimeout(900);
    const inPanel = await page.evaluate(() => {
      const panel = document.getElementById('context-panel');
      const rows = panel ? [...panel.querySelectorAll('[data-alert-i]')] : [];
      const mine = rows.find(r => /ready to sign/i.test(r.innerText || ''));
      return { title: (document.getElementById('panel-title') || {}).textContent || '',
        hit: !!mine, doors: rows.length,
        vis: mine ? Math.round(mine.getBoundingClientRect().height) : 0 };
    });
    check('the header bell fills the same panel with the same row',
      inPanel.hit && inPanel.vis > 8, JSON.stringify(inPanel));
    check('every row in that panel is a door, this one included',
      inPanel.doors >= 1, inPanel.doors);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    /* ---------- 4. "unless you resume negotiations" ---------- */
    await page.evaluate(async id => {
      const c = state.contracts.find(x => x.id === id);
      const cl = negoClauseList(c);
      await negoEditClause(c, cl[1].clauseId,
        cl[1].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(+String(m).replace(/,/g, '') + 7)),
        { author: 'Amina Otieno', side: 'owner', why: 'One more.' });
    }, cid);
    await page.waitForTimeout(1200);

    const after = await page.evaluate(id => {
      const c = state.contracts.find(x => x.id === id);
      return { ready: cpReadyToSign(c), alerts: buildAlerts().filter(r => r.kind === 'cp-ready').length,
        stage: contractStage(c), stamp: !!(c.negotiation.ready && c.negotiation.ready.counterparty) };
    }, cid);
    check('one more ask and the whole thing reverts to In Review',
      after.ready === false && after.stage !== 'Ready to sign', JSON.stringify(after));
    check('the alert row goes with it', after.alerts === 0, after.alerts);
    check('and the counterparty\'s signal is still ON THE RECORD — they said it',
      after.stamp === true, after.stamp);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
