/* Chromium verification: ANALYZE CONTRACT ON THE CONTRACT GRAPH
   ============================================================
   Young ruled 26 Sep 2026: "Build the all in one option and merge to main."
   The Intelligence panel's card carries three doors — Analyze contract (the
   filled one), Open workspace, Compare. Analyze puts one contract's paper
   where the nodes were; a question goes out with that contract's wording;
   every verbatim passage the server kept comes back as a chip, pins the
   words on the paper and lights them; the X-ray map runs down the paper's
   side; Focus folds the page head away; a Graph | Paper switch on the strip
   goes back and forth without losing anything; the panel's bin ends it.

   DRIVEN ON THE REAL APP against a scripted provider, because every claim
   here is about pixels a jsdom stage does not have: what covers the nodes,
   where a pin sits relative to its words, whether the paper scrolled to them.

   The contract analyzed is MK-A2 — DRAFTED from a template, no stored
   wording — on purpose: at the parent the server verified a quote only
   against the stored body, which for template paper holds no wording at
   all, so every quote from it was dropped and no pin could ever land. 2c is
   the claim that proves the fix; the rest are red at the parent because
   the door did not exist.

   Screenshots go to test/chromium/shots/analyze-on-the-graph/.
   Run: node test/chromium/analyze-on-the-graph-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'analyze-on-the-graph');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const sysText = s => Array.isArray(s) ? s.map(b => (b && b.text) || '').join('\n') : String(s || '');
const deliver = (id, answer, citations) => ({ content: [{ type: 'tool_use', id, name: 'deliver_answer', input: { answer, citations } }] });

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const settled = () => page.waitForFunction(() => !window.intel || !intel.busy, null, { timeout: 20000 });

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    await page.evaluate(() => { intel.tab = 'map'; intel.history = []; intel.paper = null; intel.lenses = []; intel.groups = null; setView('intel'); });
    await page.waitForTimeout(1800);

    /* ================= 1. THE CARD, AND THE PRESS ========================== */
    /* The node explain fires a Copilot briefing of its own; it takes the
       stand-in's default answer and the queue stays empty for the real asks. */
    await page.evaluate(() => igExplain('MK-A2'));
    await settled();
    await page.waitForTimeout(400);
    const card = await page.evaluate(() => {
      const a = document.querySelector('#ig-dock [data-ig-analyze]');
      const ws = document.querySelector('#ig-dock [data-ig-ws]');
      const cmp = document.querySelector('#ig-dock [data-ig-cmp]');
      const box = a && a.closest('[data-ig-hoverid]'); const br = box && box.getBoundingClientRect();
      const inside = [a, ws, cmp].every(b => { if (!b || !br) return false; const r = b.getBoundingClientRect(); return r.right <= br.right + 1 && r.left >= br.left - 1; });
      return { analyze: !!a, filled: !!(a && a.classList.contains('ui-btn-primary')),
        wsFilled: !!(ws && ws.classList.contains('ui-btn-primary')), cmp: !!cmp,
        first: !!(a && ws && (a.compareDocumentPosition(ws) & Node.DOCUMENT_POSITION_FOLLOWING)),
        inside, nodes: IG.nodes.length, word: a && a.textContent.trim() };
    });
    check('1a the card carries three doors: Analyze contract first and filled, Open workspace unfilled, Compare kept',
      card.analyze && card.filled && !card.wsFilled && card.cmp && card.first, JSON.stringify(card));
    check('1a2 all three doors sit inside the card — none is cut off at the panel\'s width', card.inside, `inside ${card.inside}`);
    await page.screenshot({ path: path.join(OUT, '01-card.png') });

    await page.click('#ig-dock [data-ig-analyze]');
    await page.waitForTimeout(900);
    const up = await page.evaluate(n0 => {
      const paper = document.getElementById('ig-paper'), svg = document.getElementById('ig-svg');
      const r = svg.getBoundingClientRect();
      const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const canvas = document.getElementById('ig-canvas'), strip = document.getElementById('ig-strip');
      const sw = strip && strip.querySelector('.ig-sw [aria-pressed="true"]');
      const inp = document.getElementById('igd-input');
      const sheet = document.querySelector('#ig-paper .pg-sheet.pg-work');
      const ink = (() => { if (!canvas) return null; const w = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
        let n; while ((n = w.nextNode())) { if (n.nodeValue.trim()) { const rg = document.createRange(); rg.selectNodeContents(n); return Math.round(rg.getBoundingClientRect().top); } } return null; })();
      return { hidden: paper.hidden, covered: !!(at && paper.contains(at)), canvas: !!canvas,
        words: (canvas && canvas.textContent || '').replace(/\s+/g, ' ').trim().split(' ').length,
        nodes: IG.nodes.length, same: IG.nodes.length === n0, svgThere: !!document.getElementById('ig-svg'),
        strip: !!strip && !strip.hidden, sw: sw && sw.getAttribute('data-ig-mode'), stripText: strip && strip.textContent.replace(/\s+/g, ' ').trim(),
        placeholder: inp.placeholder, title: inp.title, sheet: !!sheet, ink };
    }, card.nodes);
    check('1b Analyze covers the nodes with MK-A2\'s paper: the point where the graph was hit-tests to the paper, and the wording is there',
      up.covered && !up.hidden && up.canvas && up.words > 150, `covered ${up.covered} · ${up.words} words`);
    check('1c the nodes are covered, not rebuilt: the graph and every node are still there underneath',
      up.svgThere && up.same, `${up.nodes} nodes, was ${card.nodes}`);
    check('1d the strip is drawn with the switch on Paper and the contract named', up.strip && up.sw === 'paper' && /MK-A2/.test(up.stripText), up.stripText);
    check('1e the ask box says which contract it asks about, and its hover says what a question costs',
      /MK-A2/.test(up.placeholder) && /MK-A2/.test(up.title) && /\d/.test(up.title), `${up.placeholder} · ${up.title}`);
    check('1f the paper is the working copy — the same sheet the Document tab draws', up.sheet, `first ink ${up.ink}px from the top of the window`);
    await page.screenshot({ path: path.join(OUT, '02-paper.png') });

    /* ================= 2. A QUESTION, AND WHERE ITS ANSWER LANDS =========== */
    const sentence = await page.evaluate(() => {
      const c = document.getElementById('ig-canvas');
      const ps = [...c.querySelectorAll('p,li,div')].map(e => e.textContent.replace(/\s+/g, ' ').trim())
        .filter(t => t.length > 60 && t.length < 260 && !/\n/.test(t));
      return ps[Math.floor(ps.length / 2)] || ps[0] || '';
    });
    check('2 stage: the paper carries a sentence to quote', sentence.length > 60, sentence.slice(0, 60));
    ai.script(deliver('tu_q1', 'It is in the clause quoted below.', [{ id: 'MK-A2', quote: sentence }]));
    await page.fill('#igd-input', 'What does it say about that?');
    await page.press('#igd-input', 'Enter');
    await settled();
    await page.waitForTimeout(900);
    const call = ai.calls[ai.calls.length - 1] || { body: { messages: [] } };
    const msgs = (call.body && call.body.messages) || [];
    const lastMsg = msgs[msgs.length - 1] || {};
    const content = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content || '');
    check('2a the question went out with the wording of MK-A2 behind it, and the rule to quote it verbatim',
      /THE WORDING OF MK-A2/.test(content) && content.includes(sentence.slice(0, 40)) && /character for character/.test(content),
      `${content.length} chars`);
    check('2b the system block names the contract open on screen', /MK-A2/.test(sysText(call.body && call.body.system)));
    const pinned = await page.evaluate(() => {
      const canvas = document.getElementById('ig-canvas');
      const mark = canvas.querySelector('span.ig-mark[data-ig-pin="1"]');
      const pin = canvas.querySelector('button.ig-pin[data-ig-pin="1"]');
      const chips = [...document.querySelectorAll('#ig-dock .ig-cite[data-ig-cite]')];
      const chip = chips[chips.length - 1];
      const n = chip && chip.querySelector('.ig-cite-n');
      const sc = document.getElementById('ig-paper-scroll'), spine = document.getElementById('ig-spine');
      const mr = mark && mark.getBoundingClientRect(), pr = pin && pin.getBoundingClientRect(), sr = sc.getBoundingClientRect();
      return { mark: !!mark, pin: !!pin, chip: !!chip, chipN: n && n.textContent,
        pinLeftOfText: !!(pr && mr && pr.right <= mr.left),
        inView: !!(mr && mr.top >= sr.top && mr.bottom <= sr.bottom),
        strip: document.getElementById('ig-strip').textContent.replace(/\s+/g, ' '),
        spine: spine && !spine.hidden ? spine.querySelectorAll('[data-xr-seg]').length : 0,
        spineW: spine ? Math.round(spine.getBoundingClientRect().width) : 0,
        spineLeftOfSheet: !!(spine && sc && spine.getBoundingClientRect().right <= document.querySelector('#ig-paper .pg-sheet').getBoundingClientRect().left),
        blockPainted: (() => { const b = spine && spine.querySelector('[data-xr-seg]'); if (!b) return false; const rr = b.getBoundingClientRect(); return rr.width > 4 && rr.height > 4; })(),
        lit: mark && getComputedStyle(mark).backgroundColor, pins: intel.paper.pins.length,
        nothing: !!document.querySelector('#ig-dock .ig-nothing') };
    });
    check('2c the server KEPT a quote from template paper (the drafted-contract fix): the answer carries its passage as a chip numbered 1',
      pinned.chip && pinned.chipN === '1' && !pinned.nothing, JSON.stringify({ chip: pinned.chip, n: pinned.chipN, nothing: pinned.nothing }));
    check('2d the words are lit on the paper and stay lit', pinned.mark && pinned.lit && pinned.lit !== 'rgba(0, 0, 0, 0)', pinned.lit);
    check('2e the pin sits in the margin, left of the words it marks', pinned.pin && pinned.pinLeftOfText);
    check('2f the paper scrolled so the passage is in view', pinned.inView);
    check('2g the strip counts the pin', /1 pin/.test(pinned.strip), pinned.strip);
    check('2h the map beside the paper marks the clause the answer touched — a PAINTED block in a strip that has width, left of the sheet',
      pinned.spine >= 1 && pinned.spineW >= 20 && pinned.spineLeftOfSheet && pinned.blockPainted,
      `${pinned.spine} block(s) · strip ${pinned.spineW}px · left of sheet ${pinned.spineLeftOfSheet} · painted ${pinned.blockPainted}`);
    await page.screenshot({ path: path.join(OUT, '03-pinned.png') });

    /* A pin in the margin finds its answer in the panel. */
    await page.evaluate(() => { const f = document.getElementById('igd-feed'); f.scrollTop = 0; });
    await page.click('#ig-canvas button.ig-pin[data-ig-pin="1"]');
    await page.waitForTimeout(900);
    const found = await page.evaluate(() => {
      const f = document.getElementById('igd-feed'); const t = f.querySelector('[data-ig-turn] .ig-cite[data-ig-cite]');
      const turn = t && t.closest('[data-ig-turn]'); const r = turn && turn.getBoundingClientRect(), fr = f.getBoundingClientRect();
      return { inView: !!(r && r.top >= fr.top - 2 && r.top <= fr.bottom), on: !!(t && t.classList.contains('is-on')) };
    });
    check('2i a press on the pin brings its answer into view in the panel and lights the chip', found.inView && found.on, JSON.stringify(found));

    /* ================= 3. A QUOTE THAT IS NOT IN THE WORDING ============== */
    ai.script(deliver('tu_q2', 'Nothing in the wording says so.', [{ id: 'MK-A2', quote: 'The moon is made of green cheese and this sentence appears nowhere in the paper at all.' }]));
    await page.fill('#igd-input', 'Is there anything about the moon?');
    await page.press('#igd-input', 'Enter');
    await settled();
    await page.waitForTimeout(600);
    const dropped = await page.evaluate(() => {
      const turns = [...document.querySelectorAll('#igd-feed [data-ig-turn]')]; const last = turns[turns.length - 1];
      const txt = last ? last.textContent : '';
      return { notice: /could not be matched/.test(txt), nothing: !!(last && last.querySelector('.ig-nothing')),
        chips: last ? last.querySelectorAll('.ig-cite').length : -1, pins: intel.paper.pins.length };
    });
    check('3a a quote that is not in the wording lands nowhere: the server\'s notice says so ONCE (no second line), no chip is drawn, no pin is minted',
      dropped.notice && !dropped.nothing && dropped.chips === 0 && dropped.pins === 1, JSON.stringify(dropped));

    /* ================= 4. GRAPH | PAPER ==================================== */
    await page.click('#ig-strip [data-ig-mode="graph"]');
    await page.waitForTimeout(500);
    const g = await page.evaluate(() => {
      const paper = document.getElementById('ig-paper'), svg = document.getElementById('ig-svg'), strip = document.getElementById('ig-strip');
      const r = svg.getBoundingClientRect(); const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { hidden: paper.hidden, graphShows: !!(at && !paper.contains(at)), canvasKept: !!document.getElementById('ig-canvas'),
        marksKept: document.querySelectorAll('#ig-canvas span.ig-mark').length, strip: !strip.hidden,
        sw: strip.querySelector('.ig-sw [aria-pressed="true"]').getAttribute('data-ig-mode'),
        placeholder: document.getElementById('igd-input').placeholder, pinsCtl: !!strip.querySelector('[data-ig-pins-clear]'), focusCtl: !!strip.querySelector('[data-ig-focus]') };
    });
    check('4a Graph puts the nodes back and keeps the strip, with the switch on Graph', g.graphShows && g.hidden && g.strip && g.sw === 'graph', JSON.stringify(g));
    check('4b nothing is thrown away: the paper and its lit words are kept underneath', g.canvasKept && g.marksKept >= 1, `${g.marksKept} marks kept`);
    check('4c the box asks about the portfolio again, and the paper\'s own controls stand down', !/MK-A2/.test(g.placeholder) && !g.pinsCtl && !g.focusCtl, g.placeholder);
    await page.screenshot({ path: path.join(OUT, '04-graph.png') });
    await page.click('#ig-strip [data-ig-mode="paper"]');
    await page.waitForTimeout(500);
    const back = await page.evaluate(() => ({ hidden: document.getElementById('ig-paper').hidden,
      marks: document.querySelectorAll('#ig-canvas span.ig-mark').length, pins: document.querySelectorAll('#ig-canvas button.ig-pin').length,
      placeholder: document.getElementById('igd-input').placeholder }));
    check('4d Paper brings it all back as it was: the words lit, the pin in the margin, the box asking about MK-A2',
      !back.hidden && back.marks >= 1 && back.pins === 1 && /MK-A2/.test(back.placeholder), JSON.stringify(back));

    /* ================= 5. FOCUS =========================================== */
    const before = await page.evaluate(() => document.getElementById('ig-gwrap').getBoundingClientRect().height);
    await page.click('#ig-strip [data-ig-focus]');
    await page.waitForTimeout(500);
    const fo = await page.evaluate(() => ({ head: getComputedStyle(document.getElementById('ig-head')).display,
      cls: document.getElementById('ig-page').classList.contains('ig-focus'), h: document.getElementById('ig-gwrap').getBoundingClientRect().height,
      dock: !!document.getElementById('igd-input'), bar: !!document.getElementById('top-header') && getComputedStyle(document.getElementById('top-header')).display !== 'none',
      word: document.querySelector('#ig-strip [data-ig-focus]').textContent.trim() }));
    check('5a Focus folds the page head away and the paper takes the column\'s full height; the panel and the shell stay',
      fo.head === 'none' && fo.cls && fo.h > before + 40 && fo.dock && fo.bar, `${Math.round(before)} → ${Math.round(fo.h)}px`);
    await page.screenshot({ path: path.join(OUT, '05-focus.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const fx = await page.evaluate(() => ({ head: getComputedStyle(document.getElementById('ig-head')).display, cls: document.getElementById('ig-page').classList.contains('ig-focus') }));
    check('5b Escape puts the head back', fx.head !== 'none' && !fx.cls, JSON.stringify(fx));

    /* ================= 6. THE BIN ENDS IT ================================== */
    await page.click('#igd-history-clear');
    await page.waitForTimeout(500);
    const gone = await page.evaluate(() => ({ paper: intel.paper, strip: document.getElementById('ig-strip').hidden, canvas: !!document.getElementById('ig-canvas'), host: document.getElementById('ig-paper').hidden }));
    check('6a the panel\'s bin ends the analysis with the conversation: no strip, no paper, nothing kept', gone.paper === null && gone.strip && !gone.canvas && gone.host, JSON.stringify(gone));

    check('7 no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) {
    check('run completed', false, (e && e.stack) || String(e));
  } finally {
    await browser.close();
    await h.stop();
    await ai.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
