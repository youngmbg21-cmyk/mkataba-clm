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
    /* ---- RE-POINTED 11 Sep 2026 (Young: "whenever you want to comment, the
       comments / chat slide panel slides in and you comment there instead").
       The window this block drove is retired: the Notes row opens the DRAWER
       on the change, with what was already said on the list — Reply and Done
       under each note — and the box at the foot. */
    const dlg = await page.evaluate(chId => {
      const panel = document.querySelector('#context-panel');
      const open = !!(panel && panel.classList.contains('open'));
      const list = panel && panel.querySelector('.rl-np-list');
      const c = (state.contracts || []).find(x => String(x.id) === String(state.activeId));
      const ch = negoChangeById(c, chId);
      const m = negoMyNote(c, ch, currentUser());
      const mineRoom = m ? negoNoteRoom(m) : null;
      return { up: open && !!panel.querySelector(`[data-rl-np="${chId}"]`),
        roomShown: rlNpRoom(), mineRoom,
        window: !!document.getElementById('rl-note-overlay'),
        head: (panel && panel.querySelector('.rl-np-which .id') || {}).textContent,
        mine: m && m.text,
        list: list ? list.textContent.replace(/\s+/g, ' ') : '',
        reply: !!(panel && panel.querySelector('[data-rl-np-reply]')),
        done: !!(panel && panel.querySelector('[data-rl-np-done]')),
        clock: !!(panel && [...panel.querySelectorAll('.rl-np-top span')].some(x => /20\d\d/.test(x.textContent))),
        pin: !!(panel && panel.querySelector('.rl-np-pin')) };
    }, set.ch);
    check('THE PRESS OPENS THE DRAWER ON THE CHANGE — not a dead press, and no window', dlg.up && dlg.window === false);
    check('and it names the change it belongs to', /CHG-/.test(dlg.head || ''), (dlg.head || '').trim());
    check('what you wrote is on the list of its room, with Reply and Done under the notes',
      !!dlg.mine && (dlg.mineRoom !== dlg.roomShown || dlg.list.includes(String(dlg.mine).trim())) && dlg.reply && dlg.done,
      `"${String(dlg.mine || '').slice(0, 34)}" in ${dlg.mineRoom}, showing ${dlg.roomShown} · reply ${dlg.reply} · done ${dlg.done}`);
    check('every note carries its full date and time', dlg.clock === true);
    check('opened from the row, nothing is pinned — the box is the change’s own', dlg.pin === false);
    check('the other notes on this change are on the list',
      /fallback is thirty/.test(dlg.list || ''), (dlg.list || '').slice(0, 60));
    await page.evaluate(() => closeContextPanel());
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

    /* ---- 2. THE PAGE BEHIND IS BLURRED, NOT SHADED — and pressing it closes the drawer ----
       REVERSED IN PLACE 11 Sep 2026 (round three; Young: "Slight blur the
       negotiate background so that you can still see the writing in the
       contract. And pressing the blurred area should close the drawer.") —
       on the NEGOTIATION PAGE only. The 27 Aug rule (no scrim, the contract
       stays lit) holds on every other page; section 2b below keeps it. */
    const scrim = await page.evaluate(() => {
      const s = document.getElementById('panel-scrim');
      const cs = s && getComputedStyle(s);
      const bf = cs && (cs.backdropFilter || cs.webkitBackdropFilter);
      const paper = document.querySelector('.redline-page .rl-paper, #rl-doc');
      const pr = paper && paper.getBoundingClientRect();
      return { open: !!(s && s.classList.contains('open')), blur: !!(s && s.classList.contains('is-blur')),
        opacity: cs && cs.opacity, pe: cs && cs.pointerEvents, bg: cs && cs.backgroundColor, bf,
        paperPainted: !!(pr && pr.width > 0 && pr.height > 0), view: state.view };
    });
    const blurPx = /blur\((\d+(?:\.\d+)?)px\)/.exec(scrim.bf || '');
    check('on the negotiation page the scrim comes up as a SLIGHT blur with no shade — the contract stays readable',
      scrim.view === 'redline' && scrim.open && scrim.blur && Number(scrim.opacity) === 1 && !!blurPx && Number(blurPx[1]) < 3
      && /rgba\(0, 0, 0, 0\)|transparent/.test(scrim.bg || '') && scrim.paperPainted,
      `open ${scrim.open} blur ${scrim.bf} bg ${scrim.bg} opacity ${scrim.opacity}`);
    await page.evaluate(() => { const s = document.getElementById('panel-scrim'); const r = s.getBoundingClientRect(); s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + 40, clientY: r.top + 300 })); });
    await page.waitForTimeout(400);
    const pressed = await page.evaluate(() => ({ open: !!document.querySelector('#context-panel.open'), scrim: !!document.getElementById('panel-scrim').classList.contains('open') }));
    check('and pressing the blurred page closes the drawer', !pressed.open && !pressed.scrim, JSON.stringify(pressed));
    await page.evaluate(id => openNotesPanel(state.activeId, id, { force: true }), set.ch);
    await page.waitForTimeout(500);

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
    /* ---- AND A SECOND PRESS SHUTS IT (owner-asked 10 Sep 2026) ----
       "just like the alerts button, when i click on the chat button once it
       should appear which it does today but when i click on it again it should
       collapse." IT HAS TO BE DRIVEN: the source says the state flips, and
       whether the drawer actually leaves the screen is a class on a rendered
       panel. The BELL is measured beside it as the CONTROL — it has toggled
       since it was built, so a run where neither closes is a broken stage
       rather than a broken door. */
    await page.click('#hdr-chat');
    await page.waitForTimeout(500);
    check('a SECOND press on Chat shuts the drawer',
      (await page.evaluate(() =>
        !document.querySelector('#context-panel').classList.contains('open'))) === true);
    await page.click('#hdr-chat');
    await page.waitForTimeout(500);
    check('and a third opens it again — it is a toggle, not a one-shot',
      (await page.evaluate(() =>
        document.querySelector('#context-panel').classList.contains('open'))) === true);
    /* THE SWAP MUST NOT BE READ AS A SECOND PRESS. Pressing the BELL while
       Chat is up has to show alerts rather than close the drawer, or moving
       between two faces costs two presses. */
    await page.click('#hdr-notify');
    await page.waitForTimeout(500);
    check('pressing the bell over Chat SWAPS the face rather than closing',
      (await page.evaluate(() => ({
        open: document.querySelector('#context-panel').classList.contains('open'),
        title: (document.getElementById('panel-title') || {}).textContent })))
        .open === true);
    check('the bell still toggles too — the control for this pair',
      (await (async () => { await page.click('#hdr-notify'); await page.waitForTimeout(500);
        return page.evaluate(() =>
          !document.querySelector('#context-panel').classList.contains('open')); })()) === true);
    /* Back to Chat for the rest of the section. */
    await page.click('#hdr-chat');
    await page.waitForTimeout(600);
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

    /* ============ D-6 (11 Sep 2026), IN THE DRAWER: INTERNAL AT REST, A DRAFT
       PER ROOM, AND BOTH POST — one per press ============
       RE-POINTED the same evening: the window is retired and the pin carries
       its rulings. D-5 (one height in both rooms) was about the window's lead
       line and has no counterpart on the pin. */
    const d6 = await page.evaluate(async () => {
      const c = (state.contracts || []).find(x => String(x.id) === String(state.activeId));
      const cl = negoClauseList(c)[2] || negoClauseList(c)[0];
      const ch = await negoEditClause(c, cl.clauseId, '<p>Deliver within ten (10) days.</p>', { side: 'owner' });
      const before = (ch.thread || []).length;
      const p = openChangeNoteDialog(c, ch, { filed: true, side: 'owner' });
      await new Promise(r => setTimeout(r, 200));
      const panel = () => document.getElementById('context-panel');
      const pin = () => panel().querySelector('.rl-np-pin');
      const lit = () => [...pin().querySelectorAll('[data-rl-np-pin-room]')].find(b => b.getAttribute('aria-pressed') === 'true').getAttribute('data-rl-np-pin-room');
      const atRest = lit();
      const box = () => panel().querySelector('.rl-np-in');
      box().value = 'For us: hold at ten.'; box().dispatchEvent(new Event('input', { bubbles: true }));
      pin().querySelector('[data-rl-np-pin-room="external"]').click();
      await new Promise(r => setTimeout(r, 120));
      const extEmpty = box().value === '';
      box().value = 'Ten days is what your own order form says.'; box().dispatchEvent(new Event('input', { bubbles: true }));
      panel().querySelector('[data-rl-np-send]').click();
      await new Promise(r => setTimeout(r, 800));
      /* RE-POINTED 11 Sep 2026 (evening, Young: "when you click add note,
         these cards should disappear"): ONE press posts both drafts, each to
         its own room, and the pin is gone. */
      const gone = !pin();
      /* NEVER WAIT FOREVER: the door's promise resolves when the pin is spent
         or dropped; if neither happened the drawer is closed by hand, which
         drops it, and the value says what happened. */
      if (pin()) closeContextPanel();
      const out = await Promise.race([p, new Promise(r => setTimeout(() => r('timeout'), 1500))]);
      const posted = (ch.thread || []).slice(before);
      return { atRest, extEmpty, gone, out,
        n: posted.length, vis: posted.map(m => m.visibility || 'internal'), texts: posted.map(m => m.text) };
    });
    check('D-6 the pin opens on Internal', d6.atRest === 'internal', d6.atRest);
    check('D-6 External opens on its own empty draft', d6.extEmpty === true, `empty ${d6.extEmpty}`);
    check('D-6 one Add note and the pin is gone (round two)', d6.gone === true, String(d6.gone));
    check('D-6 both drafts post, each to its own room, and the door answers added', d6.out === 'added' && d6.n === 2
      && d6.vis.includes('internal') && d6.vis.includes('shared'), `${d6.n} posted: ${d6.vis.join(', ')} · ${d6.out}`);
    await page.evaluate(() => { if (window.closeContextPanel) closeContextPanel(); });
    await page.waitForTimeout(200);

    /* ---- THE OPEN CONTROL WEARS THE HEAD BUTTONS' EDGE (owner-asked 11 Sep
       2026: "the outline of the open are too faint") — measured as computed
       colours on the real page, against the head's own .ui-btn. ---- */
    const openEdge = await page.evaluate(() => {
      const open = document.querySelector('#rl-changes .rl-card-open:not([aria-expanded="true"])');
      const head = document.querySelector('#ws-head .ui-btn:not(.ui-btn-primary)');
      if (!open || !head) return { open: !!open, head: !!head };
      const o = getComputedStyle(open), h = getComputedStyle(head);
      return { open: true, head: true, edge: o.borderTopColor, headEdge: h.borderTopColor, ink: o.color, headInk: h.color };
    });
    check('the card’s Open control carries the same edge as Internal review / Share / More',
      openEdge.open && openEdge.head && openEdge.edge === openEdge.headEdge, JSON.stringify(openEdge));
    check('and the same ink', openEdge.open && openEdge.head && openEdge.ink === openEdge.headInk, `${openEdge.ink} vs ${openEdge.headInk}`);

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
