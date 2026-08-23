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
const GREEN_BG = 'rgb(209, 250, 229)';
const AMBER_BG = 'rgb(254, 243, 199)';

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

    /* ---------- 2. the alerts panel (the owner's image 1) ---------- */
    const built = await page.evaluate(() =>
      buildAlerts().filter(r => r.kind === 'cp-ready').map(r => r.text));
    check('a cp-ready row is built — the reported gap', built.length === 1, JSON.stringify(built));

    /* #cmd-panel and #hdr-notify are the two BUTTONS; #context-panel is the one
       shell they both fill. Reaching for the button's id here is a mistake this
       file made once and is worth not repeating. */
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
    check('and it draws as a row in the alerts panel — as visible pixels',
      inPanel.hit && inPanel.vis > 8, JSON.stringify(inPanel));
    check('every row in that panel is a door, this one included',
      inPanel.doors >= 1, inPanel.doors);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    /* ---------- 3. the bell (the owner's image 2) ----------
       The animation NAME is the whole reason this check is in a browser:
       nothing else can say a rule survived the cascade to actually run. */
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await page.waitForTimeout(2400);
    let bell = await page.evaluate(() => {
      const b = document.querySelector('.rl-notices-fab');
      if (!b) return null;
      const cs = getComputedStyle(b);
      return { news: b.classList.contains('is-news'), bg: cs.backgroundColor,
        anim: cs.animationName, count: cs.animationIterationCount,
        label: b.getAttribute('aria-label') };
    });
    check('the bell is green', !!bell && bell.news && bell.bg === GREEN_BG,
      bell && bell.bg);
    check('and it is really blinking — the animation is running, not merely declared',
      !!bell && bell.anim === 'rl-bell-news', bell && bell.anim);
    check('a few times and then it stops',
      !!bell && Number(bell.count) > 0 && Number(bell.count) < 10, bell && bell.count);
    check('and its label says what the news is',
      !!bell && /ready to sign/i.test(bell.label || ''), bell && bell.label);

    await page.evaluate(() => document.querySelector('.rl-notices-fab').click());
    await page.waitForTimeout(900);
    check('opening it shows the notice — "you can click on the bell to see the alert"',
      await page.evaluate(() =>
        /ready to sign/i.test((document.querySelector('.rl-notices') || {}).innerText || '')));

    await page.evaluate(() => { const m = document.querySelector('[data-rl-notices-min]'); if (m) m.click(); });
    await page.waitForTimeout(900);
    bell = await page.evaluate(() => {
      const b = document.querySelector('.rl-notices-fab');
      const cs = b && getComputedStyle(b);
      return b ? { news: b.classList.contains('is-news'), bg: cs.backgroundColor, anim: cs.animationName } : null;
    });
    check('"then it goes back to yellow"',
      !!bell && !bell.news && bell.bg === AMBER_BG && bell.anim === 'none', JSON.stringify(bell));

    /* AMBER IS WORK AND GREEN IS NEWS, and this is the pair that says so.
       Looking cleared the news; it must NOT have cleared the fact. */
    const stillWork = await page.evaluate(id =>
      cpReadyToSign(state.contracts.find(x => x.id === id)), cid);
    check('but the WORK is untouched — the standing rule holds', stillWork === true, stillWork);

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
