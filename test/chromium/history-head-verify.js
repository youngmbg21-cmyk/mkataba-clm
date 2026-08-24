/* Chromium verification: THE HISTORY HEAD — ONE SWITCH, ONE HANDLE.
   ============================================================
   Owner-reported, 13 Aug 2026, from two photographs: "you have the ours,
   theirs, everyone buttons but then when you go to ours or theirs, you have the
   dropdown that gives you all the same information."

   It was true. The chips and the Side dropdown wrote the SAME f.side —
   deliberately, so they could not disagree — but pressing a chip counted as "a
   filter is on", which sprang the filter panel open, which showed the reader
   their own choice repeated back in a different vocabulary. Two handles on one
   switch, and the second one opened by itself to say so.

   What was done: the chips are gone, the Filter LID is gone (the five controls
   sit in the open), "⋯" gained its word, and the Side options now read Ours /
   Theirs — from the READER's chair, which is not the same chair on all three
   screens this record is drawn on.

   Everything here is measured in a real browser because the claims are about
   PIXELS and PRESSES: "visible without a press", "one control not two", "a
   menu, not a select". jsdom resolves no class rules and presses hidden
   buttons, so none of this can be proved in a node test.

   THREE SCREENS, because the record is drawn three times:
     1  the room's History tab            (the one that changed)
     2  the pop-out record                (owner's chair)
     3  the counterparty's read-only copy (their chair — Ours means THEM)

   Screenshots go to test/chromium/shots/history-head/.
   Run: node test/chromium/history-head-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'history-head');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* Visible pixels, not merely present in the markup. */
const SEEN = `(el => { if (!el) return null; const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return { w: Math.round(r.width), h: Math.round(r.height),
    on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }; })`;

/* The options on a <select>, read as the reader reads them: label first. */
const OPTS = `(sel => sel ? [...sel.options].map(o => o.value + '=' + o.textContent.trim()) : null)`;

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
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---- a record with events from BOTH sides ----
       The Side filter cannot be shown to narrow anything on a record where one
       side has never asked for a thing. */
    const built = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status === 'Under Review') || state.contracts[0];
      state.activeId = c.id; state.selId = c.id;
      negoInit(c);
      const cl = negoClauseList(c);
      if (cl.length < 3) return { id: c.id, ids: [], clauses: cl.length };
      const file = (i, side, text, summary) => negoEditClause(c, cl[i].clauseId, `<p>${text}</p>`,
        { side, author: side === 'owner' ? 'Wanjiru Kamau' : 'Erik Lindqvist', summary });
      await file(0, 'owner', 'Payment falls due within thirty (30) days.', 'Net-30');
      await file(1, 'counterparty', 'Either party may terminate on ninety (90) days notice.', 'Notice to 90');
      await file(2, 'counterparty', 'The cap is limited to the fees paid.', 'Cap to fees paid');
      const chs = negoChanges(c);
      negoResolve(c, chs[1].id, 'rejected', { by: 'Wanjiru Kamau' });
      persist(c);
      return { id: c.id, ids: chs.map(x => x.id) };
    });
    console.log('   fixture: ' + built.id + ' — ' + built.ids.join(', '));
    if (!built.ids.length) {
      check('the fixture contract has enough clauses to file changes on', false, `only ${built.clauses} clauses`);
      throw new Error('fixture too small');
    }

    /* ============ 1. THE ROOM'S HISTORY TAB, ON ARRIVAL ================== */
    await page.evaluate(id => window.openWorkspace(id), built.id);
    await page.waitForTimeout(1200);
    await page.click('#ws-tabs [data-room-tab="history"]');
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, '01-history-tab.png') });

    const head = await page.evaluate(`(() => {
      const seen = ${SEEN};
      const host = document.getElementById('ws-history-pane');
      if (!host) return { mounted: false };
      return {
        mounted: true,
        chips: host.querySelectorAll('.hist-seg, [data-ht-side]').length,
        lid: !!host.querySelector('#hist-filter'),
        row: seen(host.querySelector('.hist-filters')),
        selects: [...host.querySelectorAll('.hist-f select')].map(s =>
          ({ k: s.getAttribute('data-ht-filter'), ...seen(s) })),
        labels: [...host.querySelectorAll('.hist-f > span')].map(s => s.textContent.trim()),
        clear: seen(host.querySelector('#ht-clear')),
        more: (() => { const b = host.querySelector('#hist-more');
          return b ? { tag: b.tagName, text: (b.textContent || '').replace(/\\s+/g, ' ').trim(),
            expanded: b.getAttribute('aria-expanded'), ...seen(b) } : null; })(),
        selectsOnHead: host.querySelectorAll('#hist-more, #hist-more ~ select').length,
        rows: host.querySelectorAll('.hist-ev').length,
        pill: (host.querySelector('.pill-x') || {}).textContent,
      };
    })()`);

    check('the History tab mounts with its record on it', head.mounted && head.rows > 0, `${head.rows} events`);
    check('the Everyone / Ours / Theirs chips are gone from the head',
      head.chips === 0, `${head.chips} found`);
    check('the Filter button that hid the row is gone too', !head.lid, head.lid ? 'still there' : 'none');
    /* THE WHOLE POINT: no press was made between arriving and reading this. */
    check('the filter row is visible pixels on arrival, with nothing pressed',
      !!(head.row && head.row.on), head.row ? `${head.row.w}x${head.row.h}` : 'absent');
    check('all five filters are on screen, side among them',
      head.selects.length === 5 && head.selects.every(s => s.on),
      head.selects.map(s => `${s.k}:${s.w}x${s.h}`).join(' · '));
    check('and its Clear is on screen with them', !!(head.clear && head.clear.on),
      head.clear ? `${head.clear.w}x${head.clear.h}` : 'absent');
    check('the row still names each filter', head.labels.length === 5, head.labels.join(' | '));

    /* ---- the Side control says Ours / Theirs, in the owner's chair ---- */
    const sideOpts = await page.evaluate(`${OPTS}(document.querySelector('#ws-history-pane [data-ht-filter="side"]'))`);
    check('Side offers exactly All / Ours / Theirs — our own record, in plain words',
      JSON.stringify(sideOpts) === JSON.stringify(['=All', 'owner=Ours', 'counterparty=Theirs']),
      (sideOpts || []).join(' · '));

    /* ============ 2. "MORE" IS NAMED, AND IS STILL A MENU =============== */
    check('the ⋯ button carries a word now', !!(head.more && /More/.test(head.more.text)),
      head.more ? `<${head.more.tag}> "${head.more.text}"` : 'absent');
    /* A select would sit there afterwards wearing the last act as a setting. */
    check('and it is a button opening a menu, NOT a <select> of actions',
      !!head.more && head.more.tag === 'BUTTON', head.more ? head.more.tag : 'absent');
    check('it starts closed and says so', head.more && head.more.expanded === 'false',
      head.more ? head.more.expanded : 'absent');

    await page.click('#hist-more');
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(OUT, '02-more-open.png') });
    const opened = await page.evaluate(`(() => {
      const seen = ${SEEN};
      const m = document.getElementById('hist-more-menu'), b = document.getElementById('hist-more');
      return { menu: seen(m), expanded: b && b.getAttribute('aria-expanded'),
        items: m ? [...m.querySelectorAll('button')].map(x => x.textContent.replace(/\\s+/g, ' ').trim().slice(0, 22)) : [] };
    })()`);
    check('pressing it opens a menu that is really on screen',
      !!(opened.menu && opened.menu.on), opened.menu ? `${opened.menu.w}x${opened.menu.h}` : 'absent');
    check('and the menu holds the three acts, Verify integrity among them',
      opened.items.length === 3 && opened.items.join(' ').includes('Verify'), opened.items.join(' | '));
    check('the button says it is open', opened.expanded === 'true', String(opened.expanded));

    /* RE-POINTED 24 Aug 2026 — .hist-rail went with the two-column
       layout; the trail's rows are direct children of the pane. What this
       press means is unchanged: somewhere outside the menu. */
    await page.click('#ws-history-pane .hist-ev');
    await page.waitForTimeout(300);
    const closed = await page.evaluate(`(() => {
      const seen = ${SEEN};
      const m = document.getElementById('hist-more-menu'), b = document.getElementById('hist-more');
      return { on: !!(seen(m) || {}).on, expanded: b && b.getAttribute('aria-expanded') };
    })()`);
    check('a press outside shuts it, and the button says so',
      !closed.on && closed.expanded === 'false', `on=${closed.on} expanded=${closed.expanded}`);

    /* ============ 3. FILTERING, FROM THE ROW IN THE OPEN ================ */
    const before = head.rows;
    await page.selectOption('#ws-history-pane [data-ht-filter="side"]', 'owner');
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, '03-filtered-ours.png') });
    const narrowed = await page.evaluate(`(() => {
      const host = document.getElementById('ws-history-pane');
      return { rows: host.querySelectorAll('.hist-ev').length,
        pill: ((host.querySelector('.hist-cap') || {}).textContent || '').trim(),
        side: (host.querySelector('[data-ht-filter="side"]') || {}).value,
        row: ${SEEN}(host.querySelector('.hist-filters')) };
    })()`);
    check('picking Ours narrows the record', narrowed.rows > 0 && narrowed.rows < before,
      `${before} → ${narrowed.rows}`);
    check('the count says how much of the record is showing', /of/.test(narrowed.pill || ''), narrowed.pill);
    check('the repaint keeps the choice on the control that made it',
      narrowed.side === 'owner', narrowed.side);
    check('and the filter row is still in the open after a repaint',
      !!(narrowed.row && narrowed.row.on), narrowed.row ? `${narrowed.row.w}x${narrowed.row.h}` : 'absent');

    /* The armed-once outside-press listener: this function repaints on every
       filter change, and it used to add a document listener per paint. Proved
       from the reader's chair — after several repaints the menu must still take
       exactly one press to open and one to shut. */
    await page.selectOption('#ws-history-pane [data-ht-filter="side"]', 'counterparty');
    await page.waitForTimeout(450);
    await page.selectOption('#ws-history-pane [data-ht-filter="side"]', 'owner');
    await page.waitForTimeout(450);
    await page.click('#hist-more');
    await page.waitForTimeout(300);
    const stillOpens = await page.evaluate(`!!(${SEEN}(document.getElementById('hist-more-menu')) || {}).on`);
    /* RE-POINTED 24 Aug 2026 — .hist-rail went with the two-column
       layout; the trail's rows are direct children of the pane. What this
       press means is unchanged: somewhere outside the menu. */
    await page.click('#ws-history-pane .hist-ev');
    await page.waitForTimeout(300);
    const stillCloses = await page.evaluate(`!!(${SEEN}(document.getElementById('hist-more-menu')) || {}).on`);
    check('after three repaints the menu still opens and shuts on one press each',
      stillOpens && !stillCloses, `opened=${stillOpens} closedAfter=${!stillCloses}`);

    await page.click('#ws-history-pane #ht-clear');
    await page.waitForTimeout(700);
    const cleared = await page.evaluate(`(() => {
      const host = document.getElementById('ws-history-pane');
      return { rows: host.querySelectorAll('.hist-ev').length,
        side: (host.querySelector('[data-ht-filter="side"]') || {}).value,
        pill: ((host.querySelector('.hist-cap') || {}).textContent || '').trim() };
    })()`);
    check('Clear is the one way back, and it puts side back with the rest',
      cleared.rows === before && cleared.side === '', `${cleared.rows} rows · side "${cleared.side}" · ${cleared.pill}`);

    /* ============ 4. THE POP-OUT RECORD — SAME CHAIR ==================== */
    await page.evaluate(id => window.openHistoryTimeline(getContract(id)), built.id);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, '04-popout.png') });
    const popout = await page.evaluate(`(() => {
      const seen = ${SEEN};
      return { side: ${OPTS}(document.getElementById('ht-f-side')),
        bar: seen(document.querySelector('.ht-filters')),
        chips: document.querySelectorAll('#history-timeline .hist-seg, #history-timeline [data-ht-side]').length };
    })()`);
    check('the pop-out record reads Ours / Theirs from the owner\'s chair too',
      JSON.stringify(popout.side) === JSON.stringify(['=All', 'owner=Ours', 'counterparty=Theirs']),
      (popout.side || []).join(' · '));
    check('its filter row is in the open, as it always was — all three screens now agree',
      !!(popout.bar && popout.bar.on) && popout.chips === 0,
      popout.bar ? `${popout.bar.w}x${popout.bar.h}, ${popout.chips} chips` : 'absent');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    /* ============ 5. THEIR CHAIR — "OURS" MEANS THEM ==================== */
    const token = await page.evaluate(async id => {
      const c = JSON.parse(JSON.stringify(getContract(id)));
      const r = await api('shares', 'POST', {
        payload: { kind: 'hati-share', purpose: 'history', org: 'Highland Corporate Ltd',
          sharedBy: 'Wanjiru Kamau', contract: c },
        recipient: { name: 'Juno Limited', email: 'legal@juno.example' },
        channel: 'link', purpose: 'history' });
      return r.token || ((r.link || '').split('share=t:')[1] || '');
    }, built.id);
    check('a history link can be minted to read their copy from', !!token, token ? 'ok' : 'no token');

    if (token) {
      /* The app boots the share link out of the hash, and a hash-only change is
         not a navigation — the reload is what makes this the reader's journey
         and not a fragment edit on the page we were already standing on. */
      await page.goto(h.base + '/#share=t:' + token, { waitUntil: 'networkidle' });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2600);
      await page.screenshot({ path: path.join(OUT, '05-their-copy.png'), fullPage: true });
      const theirs = await page.evaluate(`(() => {
        const seen = ${SEEN};
        return { side: ${OPTS}(document.getElementById('ht-f-side')),
          bar: seen(document.querySelector('.ht-filters')),
          rows: document.querySelectorAll('.ht-ev').length,
          shell: (() => { const s = document.getElementById('app-shell');
            return s ? !s.classList.contains('hidden') && getComputedStyle(s).display !== 'none' : false; })() };
      })()`);
      check('their copy of the record draws, with the events on it', theirs.rows > 0, `${theirs.rows} events`);
      /* THE ONE LINE THAT TURNS OVER. Written from our chair it said "Owner
         side" to the people on the other side of the table. */
      check('and its Side filter is written from THEIR chair — owner reads Theirs, they read Ours',
        JSON.stringify(theirs.side) === JSON.stringify(['=All', 'owner=Theirs', 'counterparty=Ours']),
        (theirs.side || []).join(' · '));
      check('the workspace shell is still nowhere on their page', !theirs.shell, String(theirs.shell));
    }

    /* ================================================================
       PRINT HISTORY: ONE DIALOG, AND IT GOES AWAY WHEN YOU DISMISS IT
       ================================================================
       Owner-reported 23 Aug 2026: "you click on print history then decide to
       click cancel, there is a bug because it flashes then the whole page
       reappears again without cancelling."

       TWO FAULTS. print() was called TWICE on the report window — once from its
       load handler and once from a 350ms timer, both of which fired — so Cancel
       dismissed the first dialog and the second re-opened it. MEASURED against
       the code before the fix: 2. And nothing ever closed the window, so the
       report stood there afterwards whatever you chose.

       WHY THE STUB IS HONEST. A real print dialog cannot be driven from a test
       runner, so print() is replaced by something that does what Cancel does:
       record the call, then fire afterprint. That is the whole of the contract
       this fix relies on, and it lets the run assert the two things the report
       was actually about — how many dialogs, and whether the window goes.

       THE TALLY IS KEPT ON THE OPENER, not in the popup: with the fix in, the
       window closes so fast that reading a counter inside it races the close
       and comes back empty. That is the fix working, and it would have read as
       a broken test. */
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    await page.evaluate(id => window.openWorkspace(id), built.id);
    await page.waitForTimeout(1800);
    await page.click('#ws-tabs [data-room-tab="history"]');
    await page.waitForTimeout(1400);

    /* PRINT LIVES BEHIND THE "..." MENU, which starts shut — the button is in
       the DOM the whole time, so a presence check alone passes while the press
       times out on an invisible element. Open the menu, then assert it can
       actually be seen. */
    await page.click('#hist-more');
    await page.waitForTimeout(500);
    const hasPrint = await page.evaluate(() => {
      const b = document.getElementById('ht-print'); if (!b) return false;
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(b).visibility !== 'hidden';
    });
    check('Print history is on the History tab to press, as visible pixels',
      hasPrint, String(hasPrint));

    if (hasPrint) {
      await page.evaluate(() => {
        window.__tally = 0;
        /* Stand in for the dialog on whichever window the report lands in. */
        const stub = w => { try {
          w.print = function (){
            try { if (w.opener) w.opener.__tally = (w.opener.__tally || 0) + 1; } catch (_) {}
            try { w.dispatchEvent(new Event('afterprint')); } catch (_) {}
          };
        } catch (_) {} };
        const realOpen = window.open;
        window.open = function (...a){ const w = realOpen.apply(window, a); if (w) stub(w); return w; };
      });
      const popupP = ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null);
      await page.click('#ht-print');
      const popup = await popupP;
      /* Past the 350ms fallback, so the SECOND trigger has had its chance. */
      await page.waitForTimeout(2200);
      const tally = await page.evaluate(() => window.__tally || 0);

      check('the report window really opened', !!popup, popup ? 'yes' : 'no popup');
      check('ONE dialog, not two — the second trigger finds the latch shut',
        tally === 1, `print() called ${tally} time(s) (was 2 before the fix)`);
      check('and dismissing it closes the report window',
        !popup || popup.isClosed(), popup ? String(popup.isClosed()) : 'n/a');
    }

    /* THE FALLBACK IS STILL THERE, and it is a source claim because the path it
       covers is the one where `load` never reaches the handler — which is
       precisely what a test cannot stage. Both triggers must remain, and both
       must go through the SAME latched call, or the fix trades a double dialog
       for a button that sometimes does nothing. */
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const fn = src.slice(src.indexOf('async function negoHistoryPrintRun'),
      src.indexOf('function negoVerifyResultHtml'));
    check('both triggers survive — the load handler and the timed fallback',
      /w\.onload\s*=\s*ask/.test(fn) && /setTimeout\(ask,\s*350\)/.test(fn),
      fn.includes('setTimeout(ask') ? 'both wired to ask()' : 'MISSING');
    check('and each goes through the one latched call, not its own print()',
      (fn.match(/w\.print\(\)/g) || []).length === 1,
      `${(fn.match(/w\.print\(\)/g) || []).length} print() call site(s)`);
    check('the close is registered BEFORE print, which blocks until dismissed',
      fn.indexOf("addEventListener('afterprint'") < fn.indexOf('w.print()'),
      'listener first');

    check('no page error', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const passed = results.filter(r => r.pass).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  console.log('screenshots → ' + path.relative(process.cwd(), OUT));
  process.exit(passed === results.length ? 0 : 1);
})();
