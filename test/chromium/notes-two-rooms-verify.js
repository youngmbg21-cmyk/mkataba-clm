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
    const dlg = await page.evaluate(() => {
      const ov = document.getElementById('rl-note-overlay');
      if (!ov) return { up: false };
      const panel = ov.querySelector('[role="dialog"]');
      const r = panel && panel.getBoundingClientRect();
      return { up: true, painted: !!(r && r.width > 0 && r.height > 0),
        head: (ov.querySelector('.rl-note-h') || {}).textContent,
        value: (ov.querySelector('#rl-note-in') || {}).value,
        go: (ov.querySelector('#rl-note-ok') || {}).textContent,
        del: !!ov.querySelector('#rl-note-del'),
        others: (ov.querySelector('#rl-note-chat') || {}).textContent,
        drawer: !!document.querySelector('#context-panel.open'),
        lead: (ov.querySelector('.rl-note-lead') || {}).textContent };
    });
    check('THE PRESS RAISES THE NOTE — not a dead press', dlg.up && dlg.painted);
    check('and it names the change it belongs to', /CHG-/.test(dlg.head || ''), (dlg.head || '').trim());
    check('prefilled with what you wrote, and offering Save and Delete',
      /fallback is thirty/.test(dlg.value || '') && /save|spara/i.test(dlg.go || '') && dlg.del === true,
      `"${(dlg.value || '').slice(0, 34)}" · ${(dlg.go || '').trim()} · delete ${dlg.del}`);
    check('it does not claim to have just filed — the reader opened it',
      !/^Filed\./.test((dlg.lead || '').trim()), (dlg.lead || '').trim().slice(0, 40));
    check('THE DRAWER DOES NOT OPEN — it is Chat now, with a door of its own',
      dlg.drawer === false);
    check('and notes that are not yours are counted, with a way to read them',
      /other note/i.test(dlg.others || ''), (dlg.others || '').replace(/\s+/g, ' ').trim());

    /* THAT LINE IS A REAL DOOR, and it names this change — so it is also how
       the rooms below are staged, through a press rather than by hand. */
    await page.click('#rl-note-chat');
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
    check('OPEN CHAT REALLY OPENS THE DRAWER — not a dead press', !before && opened.open);
    check('and the panel is actually on screen', opened.onScreen);
    check('the dialog goes with it, rather than standing over the panel it opened',
      opened.dlgGone === true);
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
      tinted: !!document.querySelector('.rl-np-who.out'),
      foot: !!document.querySelector('.rl-np-foot.out'),
      live: (document.querySelector('.rl-np-tab.on') || {}).textContent,
    }));
    check('the internal room holds the internal note', /fallback is thirty/.test(roomA));
    check('and NOT the shared one', !/rebate stands/.test(roomA));
    check('the external room holds the shared note', /rebate stands/.test(roomB.text));
    check('and NOT the internal one — the two never share a note', !/fallback is thirty/.test(roomB.text));
    check('the external room looks different from the internal one', roomB.tinted && roomB.foot,
      'who-line and box both wear the crossing mark');
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
        box: !!document.querySelector('#context-panel .rl-np-in') };
    });
    check('THE PRESS OPENS CHAT — not a dead press', chat.open === true);
    check('and the heading says Chat, not Notes — two scopes, one shell',
      /chat|chatt/i.test(chat.title || ''), chat.title);
    check('it holds every note on the contract, in both rooms',
      chat.rows >= 3 && /fallback is thirty/.test(chat.text)
        && /rebate stands/.test(chat.text) && /thirty-five/.test(chat.text),
      `${chat.rows} rows`);
    check('and each row says which change it is about',
      chat.onLines.every(t => /CHG-/.test(t)), chat.onLines[0]);
    check('no composer — there is one note box per change and it is on the change',
      chat.box === false);

    /* ---- IT IS DEAD WHILE THE CLAUSE EDITOR COVERS THE WINDOW ----
       The drawer sits at z-index 46 and that page mounts at 54, so a press
       would open a panel behind it: a live control that appears to do nothing,
       which is the fault this rule exists to prevent. */
    await page.evaluate(() => { if (window.closeContextPanel) closeContextPanel(); });
    await page.waitForTimeout(250);
    const covered = await page.evaluate(() => {
      const c = (state.contracts || []).find(x => String(x.id) === String(state.activeId));
      const cl = negoClauseList(c)[0];
      rlOpenClauseEditor(c, cl.clauseId, {});
      return new Promise(r => setTimeout(() => {
        const b = document.getElementById('hdr-chat');
        r({ page: !!document.getElementById('clause-editor'),
          dead: b.disabled, title: b.title });
      }, 800));
    });
    check('the clause editor really opened over the page', covered.page === true);
    check('CHAT IS DEAD WHILE IT COVERS THE WINDOW, with the reason on its hover',
      covered.dead === true && /clause|klausul/i.test(covered.title || ''),
      (covered.title || '').slice(0, 60));
    const back = await page.evaluate(() => {
      rlCloseClauseEditor({});
      return new Promise(r => setTimeout(() => {
        const b = document.getElementById('hdr-chat');
        r({ dead: b.disabled, title: b.title });
      }, 500));
    });
    check('and it comes back on the way out — both halves, or it stays dead',
      back.dead === false, back.title);

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
