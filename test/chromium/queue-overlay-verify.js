/* Chromium verification: THIS ROUND'S QUEUE SLIDES OVER THE PAGE.
   ============================================================
   Owner's ask, 12 Aug 2026: the queue should stop taking width away from the
   contract and slide over the page the way the Activity panel does.

   WHY THIS IS A BROWSER FILE. Every claim here is about PIXELS, and jsdom
   resolves no class rules at all — it would report a transformed-off-screen
   panel as present and a 300px column as absent, which is the wrong answer in
   both directions. The one that matters most is a MEASUREMENT: the contract's
   own box must be the same width with the queue open as with it shut. A node
   test cannot see that number.

   Screenshots go to test/chromium/shots/queue-overlay/.
   Run: node test/chromium/queue-overlay-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'queue-overlay');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const BOX = `(sel => { const el = document.querySelector(sel); if (!el) return null;
  const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
  return { x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height),
    on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
        && r.right > 0 && r.left < innerWidth,
    pos: cs.position, text: (el.textContent || '').replace(/\\s+/g,' ').trim().slice(0, 50) }; })`;

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

    /* A negotiation with something on the table, so the queue has rows. */
    const cid = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      negoInit(c);
      negoFileChange(c, { clauseId: (clauseSegment(negoBaseBody(c))[0] || {}).id || 'c1',
        kind: 'edit', authorSide: 'counterparty', author: 'Erik Lindqvist',
        before: 'thirty (30) days', after: 'sixty (60) days', why: 'Our cycle runs monthly.' });
      return c.id;
    });
    await page.waitForTimeout(1400);
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await page.waitForTimeout(1800);

    /* ---- 1. IT ARRIVES SHUT, AND THE DOOR CARRIES THE SCORE ---- */
    const shut = await page.evaluate(box => ({
      queue: eval(box)('#rl-queue'),
      tab: eval(box)('#rl-q-tab'),
      scrim: eval(box)('#rl-q-scrim'),
      doc: eval(box)('#rl-doc'),
      cards: eval(box)('#rl-side'),
      tracks: getComputedStyle(document.querySelector('.rl-grid')).gridTemplateColumns,
    }), BOX);
    check('the page arrives with the queue shut — nothing over the contract',
      !!shut.queue && !shut.queue.on, shut.queue ? `x=${shut.queue.x} w=${shut.queue.w}` : 'MISSING');
    check('and it is a fixed layer, not a column', shut.queue && shut.queue.pos === 'fixed',
      shut.queue && shut.queue.pos);
    check('THE GRID HAS TWO TRACKS, NOT THREE',
      (shut.tracks || '').trim().split(/\s+/).length === 2, shut.tracks);
    check('the door is on screen and reads out the round',
      !!shut.tab && shut.tab.on && /\d+\/\d+/.test(shut.tab.text || ''),
      shut.tab ? shut.tab.text : 'MISSING — closing it would cost the score');
    check('the scrim is there and inert', !!shut.scrim, shut.scrim ? shut.scrim.pos : 'MISSING');
    await page.screenshot({ path: path.join(OUT, '01-shut.png') });

    /* ---- 2. IT DOES NOT COLLIDE WITH THE BOTTOM-RIGHT FURNITURE ---- */
    const clash = await page.evaluate(() => {
      const t = document.querySelector('#rl-q-tab');
      /* Everything that lives on the page's own furniture: the floating notices
         stack and its two faces, and the Copilot's launcher and panel. */
      const others = ['.rl-notices', '.rl-notices-min', '.rl-notices-fab',
        '.copilot-wrap', '#ai-panel']
        .map(s => document.querySelector(s)).filter(Boolean)
        .filter(o => { const b = o.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
      const a = t.getBoundingClientRect();
      const hit = others.filter(o => { const b = o.getBoundingClientRect();
        return !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top); });
      return { n: others.length, hit: hit.map(o => o.className || o.id) };
    });
    check('the door does not overlap the notices stack or the Copilot launcher',
      clash.hit.length === 0, `${clash.n} checked, overlapping: ${clash.hit.join(', ') || 'none'}`);

    /* ---- 3. OPENING IT LEAVES THE CONTRACT EXACTLY WHERE IT WAS ---- */
    await page.click('#rl-q-tab');
    await page.waitForTimeout(600);
    const open = await page.evaluate(box => ({
      queue: eval(box)('#rl-queue'),
      doc: eval(box)('#rl-doc'),
      cards: eval(box)('#rl-side'),
      tracks: getComputedStyle(document.querySelector('.rl-grid')).gridTemplateColumns,
      scrimOn: getComputedStyle(document.querySelector('#rl-q-scrim')).opacity,
    }), BOX);
    check('the panel is on screen', !!open.queue && open.queue.on,
      open.queue ? `x=${open.queue.x} w=${open.queue.w}` : 'MISSING');
    check('THE CONTRACT DID NOT MOVE OR NARROW',
      open.doc.w === shut.doc.w && open.doc.x === shut.doc.x,
      `was ${shut.doc.w}px at ${shut.doc.x}, now ${open.doc.w}px at ${open.doc.x}`);
    check('nor did the change column',
      open.cards.w === shut.cards.w, `was ${shut.cards.w}px, now ${open.cards.w}px`);
    check('and the grid still has the same two tracks',
      open.tracks === shut.tracks, open.tracks);
    check('a dimmed scrim sits behind it', Number(open.scrimOn) > 0.2, open.scrimOn);
    await page.screenshot({ path: path.join(OUT, '02-open.png') });

    /* ---- 4. IT SLIDES FROM THE LEFT, WHERE THE QUEUE HAS ALWAYS BEEN ---- */
    check('it arrives from the left edge', open.queue.x === 0, 'x=' + open.queue.x);

    /* ---- 5. ESCAPE, THE SCRIM AND THE CLOSE ALL SHUT IT ---- */
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    check('Escape closes it', !(await page.evaluate(box => eval(box)('#rl-queue').on, BOX)));
    await page.click('#rl-q-tab'); await page.waitForTimeout(500);
    await page.click('#rl-q-scrim', { position: { x: 900, y: 500 } });
    await page.waitForTimeout(500);
    check('a click outside closes it', !(await page.evaluate(box => eval(box)('#rl-queue').on, BOX)));
    await page.click('#rl-q-tab'); await page.waitForTimeout(500);
    await page.click('#rl-q-min'); await page.waitForTimeout(500);
    check('and so does its own close button',
      !(await page.evaluate(box => eval(box)('#rl-queue').on, BOX)));

    /* ---- 6. A ROW IS A DOOR, AND IT CLOSES THE PANEL BEHIND IT ---- */
    await page.click('#rl-q-tab'); await page.waitForTimeout(500);
    const hasRow = await page.evaluate(() => !!document.querySelector('#rl-queue [data-rl-queue]'));
    check('the queue has a row to press', hasRow);
    if (hasRow) {
      await page.click('#rl-queue [data-rl-queue]');
      await page.waitForTimeout(700);
      const after = await page.evaluate(box => ({
        q: eval(box)('#rl-queue'), open: rlQueueOpen(),
      }), BOX);
      check('pressing a row stands the panel down — a door must not open onto a wall',
        !after.q.on && after.open === false, `on=${after.q.on}`);
    }
    await page.screenshot({ path: path.join(OUT, '03-after-row.png') });

    /* ---- 7. THE DRAG HANDLE STILL PLACES A TWO-TRACK SPLIT ---- */
    const drag = await page.evaluate(() => {
      const grid = document.querySelector('.rl-grid');
      const rez = document.querySelector('#rl-resizer');
      const before = rez.getBoundingClientRect().left;
      const doc = document.querySelector('#rl-doc').getBoundingClientRect();
      return { rez: Math.round(before), docRight: Math.round(doc.right),
        gap: Math.round(before - doc.right), gridLeft: Math.round(grid.getBoundingClientRect().left) };
    });
    check('the handle sits on the boundary between the two columns, not inside one',
      Math.abs(drag.gap) < 20, `handle at ${drag.rez}, contract ends at ${drag.docRight}`);

    /* And a one-pixel drag moves it by about one pixel, which is the fault the
       three-track maths produced. */
    const moved = await page.evaluate(async () => {
      const rez = document.querySelector('#rl-resizer');
      const r = rez.getBoundingClientRect();
      const x0 = r.left + r.width / 2, y0 = r.top + 40;
      const before = document.querySelector('#rl-doc').getBoundingClientRect().width;
      rez.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x0, clientY: y0 }));
      window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x0 + 120, clientY: y0 }));
      window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x0 + 120, clientY: y0 }));
      const after = document.querySelector('#rl-doc').getBoundingClientRect().width;
      return { before: Math.round(before), after: Math.round(after) };
    });
    check('and 120px of pointer buys about 120px of column',
      Math.abs((moved.after - moved.before) - 120) < 25,
      `${moved.before} → ${moved.after} (${moved.after - moved.before}px)`);

    check('no page errors on the whole journey', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} passed`);
  if (bad) process.exit(1);
})();
