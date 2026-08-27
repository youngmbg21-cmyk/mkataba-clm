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

    const before = await page.evaluate(() => !!document.querySelector('#context-panel.open'));
    await page.click(`#rl-changes [data-rl-notes="${set.ch}"]`);
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
      };
    });
    check('THE PRESS OPENS THE DRAWER — not a dead press', !before && opened.open);
    check('and the panel is actually on screen', opened.onScreen);
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
