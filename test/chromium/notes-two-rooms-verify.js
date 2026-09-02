/* ============================================================
   notes-two-rooms-verify — the Notes panel, driven in a real browser
   ============================================================
   Owner-ruled 27 Aug 2026. The node file (f248) pins the MODEL — which room a
   note lands in, what the gate answers, what travels. This file exists for the
   three things node cannot see:

     · THAT THE DOOR IS NOT A DEAD PRESS. The count on a change's row and the
       row in the ⋯ menu carry data-rl-notes and nothing else; the listener that
       finds them is armed on document at module load, and openNotesPanel lives
       in another module. Nothing catches a call that is never made — this
       codebase's most repeated defect — and only a real press finds it.
     · THAT THE DRAWER REALLY OPENS, with the panel painted in it. The panel is
       the shell's, and the browser harnesses build their own script lists
       without app.js, so this drives the REAL app.
     · THAT THE PAGE BEHIND IS NOT DIMMED. The owner ruled the contract stays
       lit and pressable; the scrim is a computed style and a node test cannot
       read one.
   ============================================================ */
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const R = [];
const check = (n, p, d) => { R.push(!!p); console.log((p ? 'PASS' : 'FAIL') + '  ' + n + (d != null ? ' — ' + d : '')); };

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
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2600);

    /* A real change on a real contract, with one note already in each room, put
       there through the product's own writer rather than by hand. */
    const set = await page.evaluate(async () => {
      const c = (state.contracts || []).find(x => x && x.status !== 'Signed');
      if (!c) return { ok: false, why: 'no contract to negotiate' };
      await ensureFull(c);
      negoInit(c);
      const cl = negoClauseList(c)[1] || negoClauseList(c)[0];
      const ch = await negoEditClause(c, cl.clauseId, '<p>Pay within forty-five (45) days.</p>',
        { side: 'counterparty', author: 'Priya Nair · Saw Sawa Ltd' });
      negoPostComment(c, ch.id, 'Our fallback is thirty days.',
        { side: 'owner', author: currentUser().name, visibility: 'internal' });
      negoPostComment(c, ch.id, 'We can hold at thirty if the rebate stands.',
        { side: 'owner', author: currentUser().name, visibility: 'shared' });
      state.activeId = c.id;
      openRedlineWorkbench(c.id);
      return { ok: true, id: c.id, ch: ch.id };
    });
    check('a negotiation with a note in each room is on screen', set.ok, set.why || set.ch);
    await page.waitForTimeout(900);

    /* ---- 1. THE DOOR IS REAL PIXELS AND A REAL PRESS ---- */
    const door = await page.evaluate(id => {
      const el = document.querySelector(`#rl-changes [data-rl-notes="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { on: r.width > 0 && r.height > 0, text: (el.textContent || '').trim() };
    }, set.ch);
    check('the count on the change row is drawn, and says how many', !!door && door.on, door && door.text);

    /* ---- REVERSED IN PLACE 31 Aug 2026 (owner-ruled C) ----
       It pinned that this press opens the DRAWER. The owner's own words moved
       it: "this note is stored and can only be accessed by owner via the
       highlight in image 2 where if clicked, THE POP UP COMES UP AGAIN where
       you can edit or delete" — so one window writes a note and the same window
       reads it back, which is what makes it learnable. The drawer is not
       retired: it is Chat, it has a door of its own in the shell bar, and it
       shows the WHOLE contract's conversation. Section 6 drives that. */
    const before = await page.evaluate(() => !!document.querySelector('#context-panel.open'));
    await page.click(`#rl-changes [data-rl-notes="${set.ch}"]`);
    await page.waitForTimeout(500);
    const dlg = await page.evaluate(chId => {
      const ov = document.getElementById('rl-note-overlay');
      if (!ov) return { up: false };
      const panel = ov.querySelector('[role="dialog"]');
      const r = panel && panel.getBoundingClientRect();
      return { up: true, painted: !!(r && r.width > 0 && r.height > 0),
        head: (ov.querySelector('.rl-note-h') || {}).textContent,
        value: (ov.querySelector('#rl-note-in') || {}).value,
        go: (ov.querySelector('#rl-note-ok') || {}).textContent,
        del: !!ov.querySelector('#rl-note-del'),
        past: (ov.querySelector('.rl-note-past') || {}).textContent,
        chat: !!ov.querySelector('#rl-note-chat'),
        mine: (() => { const c = (state.contracts || [])
            .find(x => String(x.id) === String(state.activeId));
          const ch = negoChangeById(c, chId);
          const m = negoMyNote(c, ch, currentUser());
          return m && m.text; })(),
        drawer: !!document.querySelector('#context-panel.open'),
        lead: (ov.querySelector('.rl-note-lead') || {}).textContent };
    }, set.ch);
    check('THE PRESS RAISES THE NOTE — not a dead press', dlg.up && dlg.painted);
    check('and it names the change it belongs to', /CHG-/.test(dlg.head || ''), (dlg.head || '').trim());
    /* PINNED AS THE RELATION, NOT THE SENTENCE: the box holds the last note of
       this reader's own that has not reached anybody yet, which is exactly what
       negoMyNote answers. A literal here would be a fact about the fixture's
       staging rather than about the window. */
    check('prefilled with what you wrote, and offering Save and Delete',
      !!dlg.mine && (dlg.value || '').trim() === String(dlg.mine).trim()
        && /save|spara/i.test(dlg.go || '') && dlg.del === true,
      `"${(dlg.value || '').slice(0, 34)}" · ${(dlg.go || '').trim()} · delete ${dlg.del}`);
    check('it does not claim to have just filed — the reader opened it',
      !/^Filed\./.test((dlg.lead || '').trim()), (dlg.lead || '').trim().slice(0, 40));
    check('THE DRAWER DOES NOT OPEN — it is Chat now, with a door of its own',
      dlg.drawer === false);
    /* ---- REVERSED IN PLACE 1 Sep 2026 (owner-asked: Option A) ----
       It pinned a COUNT of the other notes on the change plus a line pressing
       through to the drawer to read them. Option A prints them instead, quietly
       above the box — so a reader coming back to a change does not write the
       same sentence twice, and so an explanation that has already gone is
       visible as a record rather than as something to correct. The claim is the
       stronger of the two: the words are on screen rather than counted. */
    check('the other notes on this change are PRINTED above the box, not counted',
      /fallback is thirty/.test(dlg.past || '') && dlg.chat === false,
      (dlg.past || '').replace(/\s+/g, ' ').trim().slice(0, 60));

    /* ---- THE PER-CHANGE PANEL IS STAGED BY ITS ONE DOOR ----
       On OUR seat that panel no longer has a press of its own: the Notes row
       raises the window above, which is the whole of decision C. It is still
       what the COUNTERPARTY's page draws and what the shell's own openNotesPanel
       opens with a change named, so the rooms below are staged through that one
       function rather than through a control this seat does not carry. Section
       6 drives the door this seat DOES carry, with a real press. */
    await page.click('#rl-note-skip');
    await page.waitForTimeout(300);
    await page.evaluate(id => openNotesPanel(state.activeId, id), set.ch);
    await page.waitForTimeout(500);
    const opened = await page.evaluate(() => {
      const p = document.querySelector('#context-panel');
      const r = p && p.getBoundingClientRect();
      return {
        open: !!(p && p.classList.contains('open')),
        onScreen: !!(r && r.width > 0 && r.right <= innerWidth + 1 && r.left < innerWidth),
        title: (document.getElementById('panel-title') || {}).textContent,
        rooms: [...document.querySelectorAll('[data-rl-np-room]')].map(t => t.textContent.replace(/\s+/g, ' ').trim()),
        live: (document.querySelector('.rl-np-tab.on') || {}).textContent,
        box: !!document.querySelector('.rl-np-in'),
        dlgGone: !document.getElementById('rl-note-overlay'),
      };
    });
    check('the per-change panel opens in the drawer', !before && opened.open);
    check('and the panel is actually on screen', opened.onScreen);
    check('and the window is gone rather than standing over it', opened.dlgGone === true);
    check('the drawer says which of its three faces it is showing', /note/i.test(opened.title || ''), opened.title);
    check('two rooms, and it opens on Internal', opened.rooms.length === 2 && /internal/i.test(opened.live || ''),
      opened.rooms.join(' | ') + '  live=' + (opened.live || '').trim());
    check('with a box to type in', opened.box);

    /* ---- 2. THE PAGE BEHIND IS NOT DIMMED (the owner's own clause-panel rule) ---- */
    const scrim = await page.evaluate(() => {
      const s = document.getElementById('panel-scrim');
      const cs = s && getComputedStyle(s);
      return { open: !!(s && s.classList.contains('open')), opacity: cs && cs.opacity, pe: cs && cs.pointerEvents };
    });
    check('the scrim does not come up — the contract stays lit',
      !scrim.open && Number(scrim.opacity) === 0, `opacity ${scrim.opacity}, pointer-events ${scrim.pe}`);

    /* ---- 3. THE ROOMS REALLY HOLD DIFFERENT NOTES ---- */
    const roomA = await page.evaluate(() => document.querySelector('.rl-np-list').textContent.replace(/\s+/g, ' '));
    await page.click('[data-rl-np-room="external"]');
    await page.waitForTimeout(250);
    const roomB = await page.evaluate(() => ({
      text: document.querySelector('.rl-np-list').textContent.replace(/\s+/g, ' '),
      whoLine: !!document.querySelector('.rl-np-who'),
      foot: !!document.querySelector('.rl-np-foot.out'),
      ph: (document.querySelector('.rl-np-in') || {}).placeholder || '',
      /* READ OFF THE RECORD, never typed: the fixture takes whichever contract
         the seeded workspace offers, so its counterparty is not ours to know. */
      cp: ((state.contracts || []).find(x => String(x.id) === String(state.activeId)) || {}).counterparty || '',
      live: (document.querySelector('.rl-np-tab.on') || {}).textContent,
    }));
    check('the internal room holds the internal note', /fallback is thirty/.test(roomA));
    check('and NOT the shared one', !/rebate stands/.test(roomA));
    check('the external room holds the shared note', /rebate stands/.test(roomB.text));
    check('and NOT the internal one — the two never share a note', !/fallback is thirty/.test(roomB.text));
    /* REVERSED IN PLACE 2 Sep 2026 (owner-asked: "remove the highlighted areas.
       People are smart enough to know without being given explicit writing").
       The sentence over each room has gone from our seat, so what tells the
       two apart is measured where it now lives — the box's own mark, its
       placeholder, and the live tab. MEASURED AS PAINT: the placeholder is
       what names the counterparty at the moment of typing, so its absence
       would be a real loss rather than a tidy-up. */
    check('the external room looks different from the internal one', roomB.foot && !roomB.whoLine,
      `box wears the crossing mark, and no sentence explains it — who-line ${roomB.whoLine}`);
    check('and the counterparty is still named where you type',
      !!roomB.cp && roomB.ph.toLowerCase().includes(roomB.cp.toLowerCase()),
      `${JSON.stringify(roomB.ph)} names ${JSON.stringify(roomB.cp)}`);
    check('and the tab row says which room you are in', /external/i.test(roomB.live || ''), (roomB.live || '').trim());

    /* ---- 4. A NOTE REALLY FILES, FROM THE ROOM YOU ARE STANDING IN ---- */
    await page.click('[data-rl-np-room="internal"]');
    await page.waitForTimeout(250);
    await page.fill('.rl-np-in', 'Finance will not go past thirty-five.');
    await page.click('[data-rl-np-send]');
    await page.waitForTimeout(900);
    const filed = await page.evaluate(id => {
      const c = (state.contracts || []).find(x => String(x.id) === String(state.activeId));
      const ch = negoChangeById(c, id);
      const last = (ch.thread || [])[(ch.thread || []).length - 1];
      return { text: last && last.text, vis: last && last.visibility,
        onScreen: /thirty-five/.test(document.querySelector('.rl-np-list').textContent) };
    }, set.ch);
    check('a press really files the note', /thirty-five/.test(filed.text || ''), filed.text);
    check('AS INTERNAL, because that is the room it was written in', filed.vis === 'internal', filed.vis);
    check('and it is on screen without a reload', filed.onScreen);

    /* ---- 5. THE CLAUSE PANEL DRAWS NO SECOND BOX ---- */
    const one = await page.evaluate(id => ({
      boxes: document.querySelectorAll(`textarea#nego-ti-${id}`).length,
      inPanel: !!document.querySelector(`#context-panel textarea#nego-ti-${id}`),
      oldBlocks: document.querySelectorAll('.rl-cnotes').length,
    }), set.ch);
    check('EXACTLY ONE composer for the change in the whole document', one.boxes === 1, String(one.boxes));
    check('and it is the panel\'s', one.inPanel);
    check('the retired block draws nowhere', one.oldBlocks === 0, String(one.oldBlocks));

    /* ============================================================
       6. CHAT — THE DOOR IN THE SHELL BAR (owner-ruled 31 Aug 2026)
       ============================================================
       "means to access the notes in the side panel should have its own door
       called Chat which should be accessed via a symbol which should be ...
       between copilot and alerts."

       f264 pins the placement and the reading. This is here for the three
       things only a browser answers: that the SYMBOL resolves (a <use> pointing
       at a missing symbol renders an empty box, with no error), that the press
       is not dead, and that the door is really DISABLED where pressing it would
       put a panel up behind the clause editor. */
    await page.evaluate(() => { if (window.closeContextPanel) closeContextPanel(); });
    await page.waitForTimeout(300);
    const btn = await page.evaluate(() => {
      const b = document.getElementById('hdr-chat');
      if (!b) return { there: false };
      const r = b.getBoundingClientRect();
      const svg = b.querySelector('svg');
      let box = null;
      try { box = svg.getBBox ? svg.getBBox() : null; } catch (_){}
      const ai = document.getElementById('cmd-ai').getBoundingClientRect();
      const bell = document.getElementById('hdr-notify').getBoundingClientRect();
      return { there: true, painted: r.width > 0 && r.height > 0,
        drawn: !!(box && box.width > 0 && box.height > 0),
        between: ai.left < r.left && r.left < bell.left,
        dead: b.disabled, title: b.title };
    });
    check('the Chat door is drawn in the shell bar', btn.there && btn.painted);
    check('its SYMBOL really resolves — a missing one paints an empty box in silence',
      btn.drawn === true);
    check('and it sits between Copilot and the bell, where the owner ringed it',
      btn.between === true);
    check('it is live on a contract, with what it is on its hover',
      btn.dead === false && /chat/i.test(btn.title || ''), btn.title);

    await page.click('#hdr-chat');
    await page.waitForTimeout(600);
    const chat = await page.evaluate(() => {
      const p = document.querySelector('#context-panel');
      const rows = [...document.querySelectorAll('.rl-chat-row')];
      return { open: !!(p && p.classList.contains('open')),
        title: (document.getElementById('panel-title') || {}).textContent,
        rows: rows.length,
        onLines: rows.map(r => (r.querySelector('.rl-chat-on') || {}).textContent
          .replace(/\s+/g, ' ').trim()),
        text: (document.querySelector('.rl-chat') || {}).textContent
          ? document.querySelector('.rl-chat').textContent.replace(/\s+/g, ' ') : '',
        panel: !!document.querySelector('#context-panel .rl-np.rl-chat .rl-np-which'),
        tabs: document.querySelectorAll('#context-panel [data-rl-np-room]').length,
        who: !!document.querySelector('#context-panel .rl-chat .rl-np-who'),
        scope: !!document.querySelector('#context-panel .rl-chat .rl-np-scope'),
        box: !!document.querySelector('#context-panel .rl-np-in') };
    });
    check('THE PRESS OPENS CHAT — not a dead press', chat.open === true);
    check('and the heading says Chat, not Notes — two scopes, one shell',
      /chat|chatt/i.test(chat.title || ''), chat.title);
    /* ---- REVERSED IN PLACE 1 Sep 2026 (owner-asked: "revert back to the
       previous style of the panel shown in image 3") ----
       It pinned "both rooms in one list", which was the first build's own flat
       treatment. Chat wears the per-change panel's clothes now, so the rooms
       are TABS here exactly as they are there — which is the stronger claim of
       the two, because it is the same reading drawn the same way on both
       surfaces rather than a second arrangement of one conversation. */
    check('it holds this contract\'s internal notes, in the panel\'s own rooms',
      chat.rows >= 2 && /fallback is thirty/.test(chat.text)
        && /thirty-five/.test(chat.text) && !/rebate stands/.test(chat.text),
      `${chat.rows} rows`);
    check('and each row about a redline says which change it is',
      chat.onLines.filter(Boolean).every(t => /CHG-/.test(t)), chat.onLines[0]);
    /* RE-POINTED 2 Sep 2026: the room's own sentence has gone from our seat
       (owner-asked), so it can no longer stand for "dressed like the panel" —
       what does is the panel's own shape, its two tabs and its running order,
       and the ABSENCE of the line is asserted beside them, because Chat always
       draws tabs and a sentence under them would be that fact twice. */
    check('it is dressed as the per-change panel, not as a list of its own',
      chat.panel && chat.tabs === 2 && !chat.who && chat.scope,
      `panel ${chat.panel} · tabs ${chat.tabs} · who-line ${chat.who} · oldest-first ${chat.scope}`);
    /* ---- REVERSED IN PLACE 2 Sep 2026 (owner-asked) ----
       It pinned that Chat drew NO composer, on the reasoning that there is one
       note box per change and it lives on the change. The owner reversed it in
       their own words: "This means a need to open an open text field to enter
       notes which was the case previously but has changed without my ask."
       A note that belongs to no redline had nowhere to be written; it has the
       contract's own thread now, and the box is the panel's own foot. */
    check('THE BOX IS BACK — a note that belongs to no redline can be written here',
      chat.box === true);
    /* THE OTHER ROOM IS ONE PRESS, and it holds what the internal one does not. */
    await page.click('#context-panel [data-rl-np-room="external"]');
    await page.waitForTimeout(300);
    const ext = await page.evaluate(() => ({
      text: (document.querySelector('.rl-chat') || {}).textContent || '',
      live: (document.querySelector('.rl-np-tab.on') || {}).textContent }));
    check('the external room holds the note that crossed, and not the internal ones',
      /rebate stands/.test(ext.text) && !/fallback is thirty/.test(ext.text),
      (ext.live || '').trim());
    await page.click('#context-panel [data-rl-np-room="internal"]');
    await page.waitForTimeout(250);

    /* ============================================================
       6b. A NOTE THAT BELONGS TO NO REDLINE (owner-asked 2 Sep 2026)
       ============================================================
       *"you should also be able to ... add any notes internally or externally
       unrelated to a redline."* Driven for real, because the whole point is
       that the box exists and the press reaches the record. */
    await page.fill('#context-panel .rl-np-in', 'Renewal talks start in March.');
    await page.click('#context-panel [data-rl-chat-send]');
    await page.waitForTimeout(900);
    const free = await page.evaluate(() => {
      const c = (state.contracts || []).find(x => String(x.id) === String(state.activeId));
      const own = (c.thread || []);
      const last = own[own.length - 1] || {};
      const rows = [...document.querySelectorAll('.rl-chat-row')];
      const mine = rows.find(r => /March/.test(r.textContent || ''));
      return { onContract: last.text, vis: last.visibility,
        /* AND IT IS NOT ON ANY CHANGE — the two stores are separate, which is
           what stops a general note appearing under a redline it is not about. */
        onAnyChange: (c.changes || []).some(ch =>
          (ch.thread || []).some(m => /March/.test(m.text || ''))),
        onScreen: !!mine,
        /* A ROW WITH NO CHANGE DRAWS NO REFERENCE LINE: a door reading "the
           contract" on a panel about that contract is a press going nowhere. */
        ref: !!(mine && mine.querySelector('.rl-chat-on')),
        boxCleared: (document.querySelector('#context-panel .rl-np-in') || {}).value };
    });
    check('a note with no redline files onto the CONTRACT, not onto a change',
      /March/.test(free.onContract || '') && free.onAnyChange === false,
      `"${(free.onContract || '').slice(0, 30)}" · on a change: ${free.onAnyChange}`);
    check('AS INTERNAL, because that is the room it was written in',
      free.vis === 'internal', free.vis);
    check('and it is on screen without a reload', free.onScreen === true);
    check('drawn with NO reference line — there is no change to go to',
      free.ref === false);
    check('the box empties after the send', free.boxCleared === '');
    /* IT SITS WITH THE REDLINE NOTES rather than in a list of its own — the
       owner's own words, "should be able to sit in the panel". */
    const together = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.rl-chat-row')];
      return { total: rows.length,
        withRef: rows.filter(r => r.querySelector('.rl-chat-on')).length };
    });
    check('and it sits in ONE list with the redline notes',
      together.total >= 3 && together.withRef >= 2
        && together.withRef < together.total,
      `${together.total} rows, ${together.withRef} of them about a redline`);

    /* ---- ALL THREE PANEL DOORS ARE DEAD WHILE THE CLAUSE EDITOR COVERS THE
       WINDOW ---- (Chat since 31 Aug; the bell and Activity since 1 Sep, on
       the owner's ask.)
       The drawer sits at z-index 46 and that page mounts at 54, so any of
       those presses would open a panel BEHIND it: a live control that appears
       to do nothing, which is the fault this rule exists to prevent. Only a
       browser can answer this — buildWorld never loads the shell, so neither
       the doors nor the drawer exist in node.

       AND A DRAWER THAT WAS ALREADY OPEN IS THE HARDER HALF, so it is staged
       that way deliberately: three dead buttons over a panel still showing
       behind the page would be the same fault by another route. */
    await page.evaluate(() => { openPanel('alerts'); });
    await page.waitForTimeout(350);
    const wasOpen = await page.evaluate(() => {
      const p = document.getElementById('context-panel');
      return { open: p.classList.contains('open'), n: alertCount() };
    });
    check('a drawer is open before the page mounts — the harder half',
      wasOpen.open === true, `${wasOpen.n} alert(s)`);

    const covered = await page.evaluate(() => {
      const c = (state.contracts || []).find(x => String(x.id) === String(state.activeId));
      const cl = negoClauseList(c)[0];
      rlOpenClauseEditor(c, cl.clauseId, {});
      return new Promise(r => setTimeout(() => {
        const g = id => document.getElementById(id);
        const p = g('context-panel'), dot = g('hdr-notify-dot');
        r({ page: !!g('clause-editor'),
          chat: { dead: g('hdr-chat').disabled, title: g('hdr-chat').title },
          bell: { dead: g('hdr-notify').disabled, title: g('hdr-notify').title },
          act:  { dead: g('cmd-panel').disabled, title: g('cmd-panel').title },
          panelOpen: p.classList.contains('open'),
          /* THE PRESS HAS TO WORK, NOT MERELY BE ALLOWED. A live button that
             opens a panel BEHIND the page passes every disabled check and is
             the exact fault the greying was written for, so this reads the
             PAINT: what is actually on top at the middle of the drawer. */
          onTop: (() => { const r = p.getBoundingClientRect();
            const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return !!(el && el.closest && el.closest('#context-panel')); })(),
          n: alertCount(), dotHidden: dot.hidden });
      }, 900));
    });
    check('the clause editor really opened over the page', covered.page === true);
    /* ---- REVERSED IN PLACE 2 Sep 2026 (owner-asked: "the sliding panels should
       not be hidden or muted when in the editor page") ----
       These three asserted the doors were DEAD here, and the diagnosis behind
       that was right: a panel at 46 behind a page at 54 is a dead press. The
       remedy moved to the other side of the same collision — the page sits at
       38, under both slide-overs — so the doors are live because the press
       WORKS, which is the only honest way to un-grey a control. */
    check('CHAT IS LIVE WHILE THE EDITOR IS UP, with its ordinary hover',
      covered.chat.dead === false && !/covers this panel|t\u00e4cker/i.test(covered.chat.title || ''),
      (covered.chat.title || '').slice(0, 60));
    check('THE BELL IS LIVE TOO',
      covered.bell.dead === false && !/covers this panel|t\u00e4cker/i.test(covered.bell.title || ''),
      (covered.bell.title || '').slice(0, 60));
    check('AND ACTIVITY',
      covered.act.dead === false && !/covers this panel|t\u00e4cker/i.test(covered.act.title || ''),
      (covered.act.title || '').slice(0, 60));
    check('the drawer that was open STAYS open — nothing is hidden here',
      covered.panelOpen === true);
    check('AND IT IS ON TOP OF THE PAGE, measured as paint — not a live press that does nothing',
      covered.onTop === true);
    /* THE COUNT IS NOT THE DOOR. A shut door and an empty queue are two
       different facts: a number that vanishes says "nothing is waiting", which
       is false. Written as a RELATION so it bites whichever way the seeded book
       falls — the dot is hidden exactly when there is nothing to count. */
    check('and the count survives the shut door — hidden only at zero',
      covered.dotHidden === (covered.n === 0),
      `${covered.n} alert(s), dot ${covered.dotHidden ? 'hidden' : 'drawn'}`);

    const back = await page.evaluate(() => {
      rlCloseClauseEditor({});
      return new Promise(r => setTimeout(() => {
        const g = id => document.getElementById(id);
        r({ chat: g('hdr-chat').disabled, bell: g('hdr-notify').disabled,
          act: g('cmd-panel').disabled,
          panelOpen: g('context-panel').classList.contains('open') });
      }, 600));
    });
    check('and all three are still live on the way out',
      back.chat === false && back.bell === false && back.act === false,
      `chat ${back.chat} · bell ${back.bell} · activity ${back.act}`);
    /* The reader's own choice is never written here, so the drawer they left
       open is the drawer they get back — on the way in AND on the way out. */
    check('with the drawer the reader had open', back.panelOpen === true);
    await page.evaluate(() => { if (window.closeContextPanel) closeContextPanel(); });
    await page.waitForTimeout(200);

    /* ============================================================
       7 — A TAGGED NAME, AND THE MARK ON THE SYMBOL
       ============================================================
       Owner-asked 2 Sep 2026. THE COLOUR CLAIM BELONGS HERE AND NOWHERE ELSE:
       the rule was scoped to `.redline-page` and this drawer is the SHELL's
       panel, so on the negotiation page the tag drew coloured and in the drawer
       it drew as ordinary text — one builder, two homes, one of them dressed.
       Only a real cascade can tell those apart. */
    const tagged = await page.evaluate(async () => {
      const c = (state.contracts || []).find(x => String(x.id) === String(state.activeId));
      const who = (window.reviewCandidates ? reviewCandidates(c) : []) || [];
      if (who.length < 2) return { ok: false, why: 'need two colleagues to tag' };
      const ch = (c.changes || [])[0];
      negoPostComment(c, ch.id, '@' + who[0].name + ' can you look at this?',
        { side: 'owner', author: currentUser().name, visibility: 'internal' });
      negoPostComment(c, ch.id, '@' + who[1].name + ' and you too please.',
        { side: 'owner', author: currentUser().name, visibility: 'internal' });
      openNotesPanel(c.id);
      return new Promise(r => setTimeout(() => {
        const ats = [...document.querySelectorAll('#context-panel .rl-np-at')];
        r({ ok: true, n: ats.length,
          names: ats.map(a => a.textContent),
          weights: ats.map(a => getComputedStyle(a).fontWeight),
          colours: ats.map(a => getComputedStyle(a).color),
          bodyInk: getComputedStyle(document.querySelector('#context-panel .rl-np-note p')).color });
      }, 700));
    });
    check('two colleagues were tagged in the drawer', tagged.ok && tagged.n >= 2,
      tagged.why || (tagged.n + ' tags: ' + JSON.stringify(tagged.names)));
    if (tagged.ok){
      check('A TAGGED NAME IS BOLD — in the drawer, where the rule did not reach',
        tagged.weights.every(w => Number(w) >= 600), JSON.stringify(tagged.weights));
      /* THE RELATION, NOT A LITERAL: a tag is not the colour of the words
         around it, and two different people are not the colour of each other.
         Written this way so a palette pass costs no edit here. */
      check('and it is COLOURED — not the ink of the sentence it sits in',
        tagged.colours.every(c2 => c2 !== tagged.bodyInk),
        JSON.stringify(tagged.colours) + ' vs body ' + tagged.bodyInk);
      check('EVERY NAME ITS OWN CODE — two people, two colours',
        new Set(tagged.colours).size >= 2, JSON.stringify(tagged.colours));
    }

    /* THE MARK. The record is staged by hand on purpose: negoMentionsIn
       resolves a name against reviewCandidates, which EXCLUDES you, so no note
       filed through the product can name its own reader — which is right, and
       means a colleague's note is the only thing that produces this shape. The
       claim here is about how the DOOR reads it. */
    const mark = await page.evaluate(() => {
      if (window.closeContextPanel) closeContextPanel();
      const c = (state.contracts || []).find(x => String(x.id) === String(state.activeId));
      const me = currentUser();
      (c.thread = c.thread || []).push({
        who: 'Amina Wanjiru', byId: 'someone-else', side: 'owner', visibility: 'internal',
        /* NOW, not the future. "Seen" is a stamp of when this reader last
           looked, so a note dated ahead of the clock can never be marked read
           — the same property the per-change unread dot has always had, and
           deliberately not special-cased here: the two must agree about what
           reading means. Staging it in the future tested the staging. */
        at: new Date().toISOString(),
        text: '@' + me.name + ' what do you think of change 009?',
        mentions: [{ id: me.id, name: me.name }] });
      paintChatDoor();
      const dot = document.getElementById('hdr-chat-dot');
      return { n: negoMentionsWaiting(c), text: dot.textContent, shown: !dot.hidden,
        title: document.getElementById('hdr-chat').title };
    });
    check('THE CHAT SYMBOL CARRIES A MARK when somebody has named you',
      mark.shown === true && mark.text === '1', JSON.stringify(mark));
    check('and the hover says what it is', /named you|name you/i.test(mark.title || ''),
      (mark.title || '').slice(0, 60));

    const cleared = await page.evaluate(() => {
      const c = (state.contracts || []).find(x => String(x.id) === String(state.activeId));
      openNotesPanel(c.id);
      return new Promise(r => setTimeout(() => {
        const dot = document.getElementById('hdr-chat-dot');
        r({ shown: !dot.hidden, n: negoMentionsWaiting(c) });
      }, 700));
    });
    check('READING CHAT CLEARS IT — both halves, or the mark never goes',
      cleared.shown === false && cleared.n === 0, JSON.stringify(cleared));
    await page.evaluate(() => { if (window.closeContextPanel) closeContextPanel(); });
    await page.waitForTimeout(200);

    check('no page errors along the way', errors.length === 0, errors.join(' | ') || 'none');
  } catch (e) {
    check('the run completed', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  const pass = R.filter(Boolean).length;
  console.log(`\n${pass}/${R.length} passed`);
  process.exit(pass === R.length ? 0 : 1);
})();
