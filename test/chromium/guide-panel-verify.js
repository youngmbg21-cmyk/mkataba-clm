/* Chromium verification: THE GUIDE — every page in the order a contract lives.
   ============================================================
   Owner, 19 Oct 2026: "a menu page that slides from the right hand panel like
   activities but it is a menu like a nav panel for the entire platform. It
   simply alerts you to all the pages available in Hati but it's more of a
   guide than a nav panel" — and of the three drawn, "Journey it is".

   Claims: the right-hand panel draws its tabs (Guide · Alerts · Notes ·
   Activity; Notes GREY AND NOT PRESSABLE with no contract in front, with its
   reason on the hover — owner, 27 Oct 2026); the Guide is a face of the SAME panel;
   it lists Home, six numbered stages in order and Settings at the foot; the
   page in front says "You are here"; a count is the page's own door number; a
   press lets the panel go and lands on that page; the tab's "new" goes once
   the Guide has been opened; it fits the owner's three screens.

   Screenshots go to test/chromium/shots/guide/.
   Run: node test/chromium/guide-panel-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'guide');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
async function until(page, fn, arg, ms = 8000){
  const t0 = Date.now();
  while (Date.now() - t0 < ms){ const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await page.waitForTimeout(100); }
  return null;
}
const READ = () => { const p = document.getElementById('context-panel'); if (!p) return null;
  const tabs = [...document.querySelectorAll('#panel-tabs [data-pt-face]')].map(b => ({ k: b.getAttribute('data-pt-face'), w: b.textContent.trim(), on: b.classList.contains('on'), dead: b.disabled, title: b.title }));
  return { open: p.classList.contains('open'), face: p.dataset.face, title: (document.getElementById('panel-title') || {}).textContent, tabs,
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the Guide by stage (.gdn): "You are here" first, then
       each stage a heading (.gdn-h) over a group (.gdn-g) of rows (.gdn-r), a row's pages its doors (.gdn-go), its count
       .gdn-n (.is-owed when owed) */
    ...(() => { const g = p.querySelector('.gdn'); if (!g) return { stages: [], first: null, last: null, here: [], pills: {} };
      const heads = [...g.querySelectorAll(':scope > .gdn-h')].slice(1);
      const stages = heads.map(hd => { const grp = hd.nextElementSibling; return { h: hd.textContent.trim(), rows: grp ? [...grp.querySelectorAll('.gdn-go[data-gd-go]')].map(r => r.getAttribute('data-gd-go')) : [] }; });
      const all = stages.flatMap(st => st.rows);
      const grps = heads.map(hd => hd.nextElementSibling).filter(Boolean);
      const here = grps.flatMap(x => [...x.querySelectorAll('.gdn-r.is-here .gdn-go[aria-current="page"]')].map(r => r.getAttribute('data-gd-go')));
      const pills = {}; grps.forEach(x => x.querySelectorAll('.gdn-r').forEach(r => { const ks = [...r.querySelectorAll('.gdn-go[data-gd-go]')]; if (ks.length === 1){ const n = r.querySelector('.gdn-n.is-owed'); pills[ks[0].getAttribute('data-gd-go')] = n ? n.textContent.trim() : ''; } }));
      return { stages, first: all[0] || null, last: all[all.length - 1] || null, here, pills }; })() }; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.view && Array.isArray(state.contracts) && state.contracts.length && typeof openPanel === 'function'), null, 15000);
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.guideSeen'); } catch (_){} setView('counter'); });
    await until(page, () => (state.view === 'dashboard' && !document.body.classList.contains('pre-auth') && !!document.getElementById('hb-bhead')));

    /* 1 the panel's tabs, from the existing door */
    await page.evaluate(() => openPanel('activity'));
    const A = await until(page, () => { const p = document.getElementById('context-panel'); return p && p.classList.contains('open') && document.querySelector('#panel-tabs [data-pt-face]') ? true : null; });
    const R1 = await page.evaluate(READ);
    check('1a the panel draws its tabs: Guide · Alerts · Notes · Activity; with no contract in front Notes is grey with its reason (owner, 27 Oct 2026)', !!A && R1.tabs.map(t => t.k).join() === 'guide,alerts,notes,activity' && (R1.tabs.find(t => t.k === R1.face) || {}).on
      && (R1.tabs.find(t => t.k === 'notes') || {}).dead === true && /Open a contract/.test((R1.tabs.find(t => t.k === 'notes') || {}).title || ''),
      JSON.stringify(R1 && R1.tabs));
    /* RETIRED 16 Nov 2026 (#762): 1b and 2f (the Guide tab says "new" until opened) — the new look draws no "new" on the tab (js/app.js, !newLookOn()) */

    /* 1c the grey tab is not pressable: a press leaves the face where it was */
    const deadPress = await page.evaluate(() => { const b = document.querySelector('#panel-tabs [data-pt-face="notes"]'); const d = b && b.disabled;
      try { b.click(); } catch (_){} return { dead: !!d, face: document.getElementById('context-panel').dataset.face, open: document.getElementById('context-panel').classList.contains('open') }; });
    check('1c a press on the grey Notes tab does nothing', deadPress.dead && deadPress.face !== 'notes' && deadPress.open, JSON.stringify(deadPress));

    /* 2 the Guide face */
    await page.click('#panel-tabs [data-pt-face="guide"]');
    await until(page, () => document.getElementById('context-panel').dataset.face === 'guide' && !!document.querySelector('.gdn .gdn-g'));
    const R2 = await page.evaluate(READ);
    check('2a it is a face of the same panel, headed "Guide"', R2.open && R2.face === 'guide' && R2.title === 'Guide', JSON.stringify({ face: R2.face, title: R2.title }));
    /* RE-POINTED (owner, 10 Nov 2026: Home deleted): the Board heads the Guide */
    /* RE-POINTED 16 Nov 2026 (#762): the new look's Guide heads with "You are here" — the Board, from the Board — and the
       Board's own row stands in The book; Settings & rules is still at the foot */
    const top = await page.evaluate(() => (document.querySelector('#context-panel .gdn .gdn-go[data-gd-go]') || { getAttribute: () => null }).getAttribute('data-gd-go'));
    check('2b the Board first, Settings & rules at the foot', top === 'board' && R2.last === 'settings', JSON.stringify([top, R2.last]));
    /* RE-POINTED 16 Nov 2026 (#762): the new look's stages (round 7 as drawn) — Arrive · Negotiate · sign · Live · The book */
    check('2c the stages, in the order a contract lives', R2.stages.map(s => s.h).join(' | ') === 'Arrive | Negotiate · sign | Live | The book', R2.stages.map(s => s.h).join(' | '));
    /* RE-POINTED 28 Oct 2026 (THE THREAD): Reads joins Keep it alive (rule 9c) */
    /* RE-POINTED 16 Nov 2026 (#762): each stage holds the pages its own list names (GUIDE_NL), and every page the old
       Journey held is still on the Guide (none lost, rule 9c) */
    const want = await page.evaluate(() => (window.GUIDE_NL || []).map(st => st.rows.flat()));
    const had = ['requests', 'import', 'ourpaper', 'draft', 'document', 'negotiations', 'parties', 'people', 'approvals', 'contracts', 'reads', 'oblig', 'calendar', 'mynotes', 'pulse', 'explorer', 'house'];
    const drawnAll = R2.stages.flatMap(st => st.rows);
    check('2d each stage holds its pages as drawn, and none the Guide had is lost', JSON.stringify(R2.stages.map(st => st.rows)) === JSON.stringify(want) && had.every(k => drawnAll.includes(k)),
      JSON.stringify({ drawn: R2.stages.map(st => st.rows), lost: had.filter(k => !drawnAll.includes(k)) }));
    check('2e the Board is the page in front: "You are here"', R2.here.join() === 'board', JSON.stringify(R2.here));
    const nums = await page.evaluate(() => ({ approvals: approvalsDoorCount(), oblig: obligationsDoorCount(), requests: requestsDoorCount() }));
    const numOk = ['approvals', 'oblig', 'requests'].every(k => nums[k] > 0 ? (R2.pills[k] || '') === String(nums[k]) : !R2.pills[k]);
    check('2g a count is the page\'s own door number, and none is drawn at zero', numOk, JSON.stringify({ nums, pills: { approvals: R2.pills.approvals, oblig: R2.pills.oblig, requests: R2.pills.requests } }));
    await page.click('#panel-tabs [data-pt-face="guide"]');
    const still = await page.evaluate(() => document.getElementById('context-panel').classList.contains('open') && document.getElementById('context-panel').dataset.face === 'guide');
    check('2h pressing the tab in front does nothing', still);
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]){
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(250);
      const F = await page.evaluate(() => { const p = document.getElementById('context-panel').getBoundingClientRect(); const b = document.getElementById('panel-body');
        return { inside: p.right <= innerWidth + 1 && p.left >= 0, side: document.documentElement.scrollWidth <= innerWidth + 1, scrolls: b.scrollHeight > b.clientHeight ? 'scrolls' : 'fits' }; });
      check(`3 ${w}×${ht}: the panel stands inside the window, nothing sideways`, F.inside && F.side, JSON.stringify(F));
      await page.screenshot({ path: path.join(OUT, `guide-${w}x${ht}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* 4 a press lands on the page, and the panel lets go */
    await page.click('#context-panel [data-gd-go="approvals"]');
    const landed = await until(page, () => state.view === 'approvals' ? { open: document.getElementById('context-panel').classList.contains('open') } : null);
    check('4a "Approvals & signing" lands on its page and the panel lets go', !!landed && !landed.open, JSON.stringify(landed));
    await page.evaluate(() => openPanel('guide'));
    await until(page, () => !!document.querySelector('.gdn .gdn-g'));
    const R4 = await page.evaluate(READ);
    check('4b reopened there, "You are here" is on Approvals & signing', R4.here.join() === 'approvals', JSON.stringify(R4.here));
    await page.click('#context-panel [data-gd-go="calendar"]');
    const cal = await until(page, () => state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'calendar');
    check('4c "Calendar" lands on Home\'s Calendar', !!cal);

    /* 5 Notes joins the tabs with a contract in front */
    await page.evaluate(() => { const c = state.contracts.find(x => x && x.status !== 'Signed'); pdOpenOnHome(c.id, 'copilot'); });
    await until(page, () => typeof pdOnPaper === 'function' && pdOnPaper() && !!pdContract());
    await page.evaluate(() => openPanel('guide'));
    await until(page, () => !!document.querySelector('.gdn .gdn-g'));
    const R5 = await page.evaluate(READ);
    /* RE-POINTED 20 Nov 2026 (owner: "leave contracts and delete workspace from both the guide and nav panel"): with a
       contract in front, Contracts is "You are here" */
    check('5a with a contract in front the tabs are Guide · Alerts · Notes · Activity, and Contracts is "You are here"',
      R5.tabs.map(t => t.k).join() === 'guide,alerts,notes,activity' && R5.here.join() === 'contracts', JSON.stringify({ tabs: R5.tabs.map(t => t.k), here: R5.here }));
    await page.click('#panel-tabs [data-pt-face="notes"]');
    const nf = await until(page, () => document.getElementById('context-panel').dataset.face === 'notes' ? true : null);
    check('5b its Notes tab opens that contract\'s notes in the same panel', !!nf);
    check('5c with a contract in front the Notes tab is live', (R5.tabs.find(t => t.k === 'notes') || {}).dead === false);

    /* 6 THE ROOMS SHARE THE ROW EQUALLY; a long party name ends in "…" and its count stays whole (owner, 27 Oct 2026) */
    await page.evaluate(() => { const c = pdContract(); c.counterparty = 'AIT Worldwide Logistics Norway AS Scandinavian Holdings Group'; delete c.parties; openNotesPanel(c.id, null, { force: true }); });
    const R6 = await until(page, () => { const tabs = [...document.querySelectorAll('#context-panel .rl-np-tabs .rl-np-tab')]; if (tabs.length < 2) return null;
      return tabs.map(b => { const nm = b.querySelector('.rl-np-nm'), i = b.querySelector('i'); const r = b.getBoundingClientRect(), ri = i.getBoundingClientRect();
        return { w: Math.round(r.width), name: nm ? nm.textContent : b.textContent, cut: !!nm && nm.scrollWidth > nm.clientWidth + 1, ellipsis: nm ? getComputedStyle(nm).textOverflow : '', countWhole: ri.right <= r.right + 0.5 && ri.width >= 5 && i.scrollWidth <= i.clientWidth + 1 && getComputedStyle(i).flexShrink === '0', title: b.title }; /* RE-POINTED 13 Nov 2026 (the Thread): the count is a bare number now, "(N)" lost its brackets — whole means drawn, not squeezed, inside the tab */ }); });
    check('6a every room tab takes the same width', !!R6 && Math.max(...R6.map(t => t.w)) - Math.min(...R6.map(t => t.w)) <= 1, JSON.stringify(R6));
    check('6b the long party name ends in "…" and its count stays whole; the full name is on the hover', !!R6 && R6.some(t => t.cut && t.ellipsis === 'ellipsis' && t.countWhole && /AIT Worldwide/.test(t.title)), JSON.stringify(R6));
    await page.screenshot({ path: path.join(OUT, 'notes-rooms-equal.png') });

    /* 7 turning to the Board leaves no contract in front: the notes face goes, and the tab is grey again */
    await page.evaluate(() => hbSetFace('board'));
    const R7 = await until(page, () => { const p = document.getElementById('context-panel'); return (!p.classList.contains('open') || p.dataset.face !== 'notes') ? { open: p.classList.contains('open'), face: p.dataset.face } : null; });
    check('7a on the Board the notes drawer is put away', !!R7, JSON.stringify(R7));
    await page.evaluate(() => openPanel('activity'));
    const R7b = await until(page, () => { const b = document.querySelector('#panel-tabs [data-pt-face="notes"]'); return b ? { dead: b.disabled } : null; });
    check('7b and its Notes tab is grey again', !!R7b && R7b.dead, JSON.stringify(R7b));

    /* 8 a door that NAMES its contract (the bell's note alert) opens its notes from the Board, and they stay */
    await page.evaluate(() => { const c = state.contracts.find(x => x && x.status !== 'Signed'); openNotesPanel(c.id, null, { force: true }); });
    await page.waitForTimeout(400);
    await page.evaluate(() => { if (window.paintChatDoor) paintChatDoor(); });
    const R8 = await until(page, () => { const p = document.getElementById('context-panel'), b = document.querySelector('#panel-tabs [data-pt-face="notes"]');
      return p ? { open: p.classList.contains('open'), face: p.dataset.face, tabDead: b ? b.disabled : null } : null; });
    check('8 the bell\'s note door opens a contract\'s notes on the Board and they stay, the tab lit and live', !!R8 && R8.open && R8.face === 'notes' && R8.tabDead === false, JSON.stringify(R8));
    await page.keyboard.press('Escape');
  } catch (e) {
    check('the walk ran to the end', false, e && e.message);
  }
  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close(); await h.stop();
  const bad = results.filter(r => !r.pass).length;
  console.log(bad ? `\n${bad} FAILED` : '\nALL PASSED');
  process.exit(bad ? 1 : 0);
})();
