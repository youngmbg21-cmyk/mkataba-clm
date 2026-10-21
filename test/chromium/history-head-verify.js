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
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the room's
       History tab went home — the door that named it (roomOpenAt 'history')
       opens the Board's History view for this contract, drawn by the room's own
       painter (roomPaintHistory) into #bs-strips [data-bs-host="hist"] with the
       same inner markup; #ws-history-pane is gone, so every claim below reads
       the Board's host. The wait asks for the trail itself. */
    await page.evaluate(id => window.roomOpenAt(id, 'history'), built.id);
    await page.waitForFunction(() => !!document.querySelector('#bs-strips [data-bs-host="hist"] .hist-ev'), null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '01-history-tab.png') });

    const head = await page.evaluate(`(() => {
      const seen = ${SEEN};
      const host = document.querySelector('#bs-strips [data-bs-host="hist"]');
      if (!host) return { mounted: false };
      return {
        mounted: true,
        chips: host.querySelectorAll('.hist-seg, [data-ht-side]').length,
        sideSwitch: [...host.querySelectorAll('.hist-side [data-ht-side]')].map(b => b.getAttribute('data-ht-side') + '=' + b.textContent.trim()),
        sideSeen: seen(host.querySelector('.hist-side')),
        lanes: [...host.querySelectorAll('.hist-trail.is-lanes > .hist-lh')].map(x => x.textContent.replace(/\\s+/g, ' ').trim()),
        cols: [...host.querySelectorAll('.hist-trail.is-table > .hist-th > *')].map(x => x.textContent.trim()),
        sides: [...host.querySelectorAll('.hist-trail.is-table .hist-c-side')].map(x => x.textContent.trim()),
        lid: !!host.querySelector('#hist-filter'),
        btn: seen(host.querySelector('#hist-filter-btn')),
        btnExp: (host.querySelector('#hist-filter-btn') || {}).getAttribute
          ? host.querySelector('#hist-filter-btn').getAttribute('aria-expanded') : null,
        row: seen(host.querySelector('.hist-filters')),
        selects: [...host.querySelectorAll('.hist-f select')].map(s =>
          ({ k: s.getAttribute('data-ht-filter'), ...seen(s) })),
        labels: [...host.querySelectorAll('.hist-f > span')].map(s => s.textContent.trim()),
        clear: seen(host.querySelector('#ht-clear')),
        more: (() => { const b = host.querySelector('#hist-more');
          return b ? { tag: b.tagName, text: (b.textContent || '').replace(/\\s+/g, ' ').trim(), aria: b.getAttribute('aria-label') || '', tip: b.getAttribute('title') || '',
            expanded: b.getAttribute('aria-expanded'), ...seen(b) } : null; })(),
        selectsOnHead: host.querySelectorAll('#hist-more, #hist-more ~ select').length,
        rows: host.querySelectorAll('.hist-ev').length,
        pill: (host.querySelector('.pill-x') || {}).textContent,
      };
    })()`);

    check('the History tab mounts with its record on it', head.mounted && head.rows > 0, `${head.rows} events`);
    /* RE-POINTED 15 Oct 2026 (the overnight work order, step 8; owner's "Go",
       14 Oct 2026: History "gets filtering on sides"): Side is in the open
       again as ONE switch — All sides · Ours · Theirs — and the Side box left
       the fold with it, so it is still one handle on one switch (the 13 Aug
       complaint was two). */
    /* RE-POINTED AGAIN 17 Oct 2026 (round 12: the owner picked "Two sides"):
       each side is its own lane, so whose step it was is read where it
       stands; the switch is gone (reverses the 15 Oct switch in the open). */
    /* RE-POINTED 21 Oct 2026 (the owner picked "The SAP way"): ONE TABLE —
       the side is a column of words, read on every row; no switch, no lanes */
    check('no side switch: the side is a column of the one table (Time · Who · Side · What happened · Outcome)',
      head.chips === 0 && head.sideSwitch.length === 0 && head.lanes.length === 0 && JSON.stringify(head.cols) === JSON.stringify(['Time', 'Who', 'Side', 'What happened', 'Outcome']),
      `${head.chips} switch buttons · lanes ${head.lanes.length} · columns ${head.cols.join(' | ')}`);
    check('the old Filter lid (#hist-filter) is gone', !head.lid, head.lid ? 'still there' : 'none');
    /* RE-POINTED 21 Oct 2026 (the SAP way): the filters stand IN THE OPEN as
       labelled boxes in the band beside the search — the Filter button that
       folded them (SAP batch 3, 9 Oct) is gone. What still holds: the
       filters, Clear, one handle per filter, Side not among them. */
    check('the filters stand in the open at rest: no Filter button, every box on screen, Clear with them',
      !(head.btn && head.btn.on) && head.selects.length >= 4 && head.selects.every(s => s.on) && !!(head.clear && head.clear.on),
      head.selects.map(s => `${s.k}:${s.w}x${s.h}`).join(' · ') + ` · button ${head.btn ? 'present' : 'absent'}`);
    check('in the drawing\'s order, and side is NOT among them (one handle)',
      !head.selects.some(s => s.k === 'side') && JSON.stringify(head.selects.map(s => s.k)) === JSON.stringify(['actor', 'clauseId', 'outcome', 'round']),
      head.selects.map(s => s.k).join(' · '));
    check('the band still names each filter', head.labels.length === 4, head.labels.join(' | '));

    /* ---- the Side column says Ours / Theirs, in the owner's chair ---- */
    check('the Side column says whose, in plain words: Ours and Theirs',
      head.sides.includes('Ours') && head.sides.includes('Theirs'), head.sides.join(' | '));

    /* ============ 2. "MORE" IS NAMED, AND IS STILL A MENU =============== */
    /* RE-POINTED 18 Oct 2026 (round 12, "Two sides", as drawn): ⋯ stands
       alone at the toolbar's end; its name is said to a screen reader and on
       the hover, and the menu's rows still say what each does */
    check('the ⋯ button is named: "More" for a screen reader, what it holds on the hover', !!(head.more && head.more.aria === 'More' && /Verify/.test(head.more.tip)),
      head.more ? `<${head.more.tag}> "${head.more.text}" aria="${head.more.aria}" tip="${head.more.tip}"` : 'absent');
    /* A select would sit there afterwards wearing the last act as a setting. */
    check('and it is a button opening a menu, NOT a <select> of actions',
      !!head.more && head.more.tag === 'BUTTON', head.more ? head.more.tag : 'absent');
    check('it starts closed and says so', head.more && head.more.expanded === 'false',
      head.more ? head.more.expanded : 'absent');

    await page.click('#bs-strips [data-bs-host="hist"] #hist-more');
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
    /* RE-POINTED 14 Oct 2026 (stage 5): on Home's Board (stage 4) Print and
       Download stand on the Board's own line and press these same two acts —
       one door each — so the menu here keeps Verify alone; the two are asked
       of the Board's line instead, as visible pixels. */
    /* RE-POINTED 15 Oct 2026 (owner: the contract's views went): the trail is
       the strip's History page, and its own menu carries Verify, Download and
       Print again (the Board's line that carried the two is gone) */
    /* RE-POINTED 17 Oct 2026 (round 12, the owner's "Yes"): an admin on a
       server finds a fourth row under them, the whole trail as a file. */
    const admin = await page.evaluate(() => !!(window.isAdmin && isAdmin() && window.API_MODE && API_MODE()));
    check('and the menu holds Verify integrity, Download and Print (and, for an admin, the whole trail)',
      opened.items.length === (admin ? 4 : 3) && opened.items[0].includes('Verify') && opened.items.some(t => /Print/.test(t))
      && (!admin || /whole trail/.test(opened.items[3] || '')), opened.items.join(' | '));
    check('the button says it is open', opened.expanded === 'true', String(opened.expanded));

    /* RE-POINTED 24 Aug 2026 — .hist-rail went with the two-column
       layout; the trail's rows are direct children of the pane. What this
       press means is unchanged: somewhere outside the menu. (15 Oct 2026:
       the menu holds three rows again and covers the first row, so the
       press is on the trail's last row.)
       RE-POINTED (B1 pass 4, round 12's menu as drawn: each act with its line
       under it, about 290px tall, so it may cover the last rows of a short or
       narrowed trail): the press is on the "Ours" lane head, at the left,
       never under a menu that opens at the toolbar's right end. */
    await page.click('#bs-strips [data-bs-host="hist"] .hist-th');   /* a press outside: the table's head row (21 Oct 2026, the SAP way) */
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
    /* RE-POINTED 17 Oct 2026 (round 12): with the side switch gone, the
       narrowing is asked of the Person filter in the fold (still open). */
    const person = await page.evaluate(() => { const s = document.querySelector('#bs-strips [data-bs-host="hist"] [data-ht-filter="actor"]');
      const o = s && [...s.options].find(x => x.value); return o ? o.value : ''; });
    await page.selectOption('#bs-strips [data-bs-host="hist"] [data-ht-filter="actor"]', person);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, '03-filtered-ours.png') });
    const narrowed = await page.evaluate(`(() => {
      const host = document.querySelector('#bs-strips [data-bs-host="hist"]');
      return { rows: host.querySelectorAll('.hist-ev').length,
        pill: ((host.querySelector('.hist-cap') || {}).textContent || '').trim(),
        side: (host.querySelector('[data-ht-filter="actor"]') || {}).value,
        /* the band's own filter, not its wrapper (which takes no box since the SAP way) */
        row: ${SEEN}(host.querySelector('[data-ht-filter="actor"]')) };
    })()`);
    check('picking a person narrows the record', narrowed.rows > 0 && narrowed.rows < before,
      `${before} → ${narrowed.rows}`);
    check('the count says how much of the record is showing', /of/.test(narrowed.pill || ''), narrowed.pill);
    check('the repaint keeps the choice on the control that made it',
      !!person && narrowed.side === person, narrowed.side);
    check('and the filter row is still in the open after a repaint',
      !!(narrowed.row && narrowed.row.on), narrowed.row ? `${narrowed.row.w}x${narrowed.row.h}` : 'absent');

    /* The armed-once outside-press listener: this function repaints on every
       filter change, and it used to add a document listener per paint. Proved
       from the reader's chair — after several repaints the menu must still take
       exactly one press to open and one to shut. */
    await page.selectOption('#bs-strips [data-bs-host="hist"] [data-ht-filter="actor"]', '');
    await page.waitForTimeout(450);
    await page.selectOption('#bs-strips [data-bs-host="hist"] [data-ht-filter="actor"]', person);
    await page.waitForTimeout(450);
    await page.click('#bs-strips [data-bs-host="hist"] #hist-more');
    await page.waitForTimeout(300);
    const stillOpens = await page.evaluate(`!!(${SEEN}(document.getElementById('hist-more-menu')) || {}).on`);
    /* RE-POINTED 24 Aug 2026 — .hist-rail went with the two-column
       layout; the trail's rows are direct children of the pane. What this
       press means is unchanged: somewhere outside the menu (the last row: the
       three-row menu covers the first, 15 Oct 2026). RE-POINTED (B1 pass 4):
       the "Ours" lane head, as above — the drawn menu covers a narrowed trail. */
    await page.click('#bs-strips [data-bs-host="hist"] .hist-th');   /* a press outside: the table's head row (21 Oct 2026, the SAP way) */
    await page.waitForTimeout(300);
    const stillCloses = await page.evaluate(`!!(${SEEN}(document.getElementById('hist-more-menu')) || {}).on`);
    check('after three repaints the menu still opens and shuts on one press each',
      stillOpens && !stillCloses, `opened=${stillOpens} closedAfter=${!stillCloses}`);

    await page.click('#bs-strips [data-bs-host="hist"] #ht-clear');
    await page.waitForTimeout(700);
    const cleared = await page.evaluate(`(() => {
      const host = document.querySelector('#bs-strips [data-bs-host="hist"]');
      return { rows: host.querySelectorAll('.hist-ev').length,
        side: (host.querySelector('[data-ht-filter="actor"]') || {}).value,
        pill: ((host.querySelector('.hist-cap') || {}).textContent || '').trim() };
    })()`);
    check('Clear is the one way back, and it puts every filter back',
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
    /* RE-POINTED 14 Oct 2026 (stage 5): the Board's History view, as above. */
    await page.evaluate(id => window.roomOpenAt(id, 'history'), built.id);
    await page.waitForFunction(() => !!document.querySelector('#bs-strips [data-bs-host="hist"] .hist-ev'), null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(800);

    /* PRINT LIVES BEHIND THE "..." MENU, which starts shut — the button is in
       the DOM the whole time, so a presence check alone passes while the press
       times out on an invisible element. Open the menu, then assert it can
       actually be seen. */
    /* RE-POINTED 14 Oct 2026 (stage 5): Print stands on the Board's line
       ([data-hb-cv-act="print"]), which runs the same negoHistoryPrintRun —
       the latched call this fix lives in — so the press below is the same
       act; the "..." menu is not opened for it. */
    const PRINT = '#bs-strips [data-bs-host="hist"] #ht-print';
    await page.click('#bs-strips [data-bs-host="hist"] #hist-more').catch(() => {});
    await page.waitForTimeout(350);
    const hasPrint = await page.evaluate(sel => {
      const b = document.querySelector(sel); if (!b) return false;
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(b).visibility !== 'hidden' && !b.disabled;
    }, PRINT);
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
      await page.click(PRINT);
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
