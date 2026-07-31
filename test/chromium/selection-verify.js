/* Chromium verification of the Copilot SELECTION path.
   ============================================================
   test/f96 drives the same journeys through jsdom, which is the right place
   for the splice assertions — but jsdom has no layout, no ::marker, and no
   cascade, and three of the bugs this verifies live in exactly those gaps:

     the list markers the clause model stores are drawn by the browser as
       ::marker pseudo-elements, so a REAL selection across two sub-clauses
       cannot contain them. In jsdom there is no ::marker to be absent, so the
       asymmetry has to be simulated — here it is genuine;
     the clause toolbar is opacity:0 and sits inside the clause box, and
       whether a real drag sweeps it up is a question about user-select and the
       real cascade;
     and a drag that overshoots into the margin below a clause is a question
       about where a real browser puts a boundary point, not about what a test
       chose to pass in.

   So the gestures here are real: a genuine Range on a laid-out document, and
   for the whole-clause case a real pointer drag across real coordinates. What
   is asserted is what the LAWYER sees — the menu opens, the Copilot is asked,
   and no refusal claims something about the document that is not true.

   Screenshots go to test/chromium/shots/selection/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'selection');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = '/opt/pw-browsers/chromium';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.join(ROOT, rel || 'index.html');
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
        rep.writeHead(404); rep.end('not found'); return;
      }
      rep.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(rep);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* Installed in the page: the recorder for what the Copilot was asked and what
   the panel was told. The workbench's refusals all land in the panel feed
   (rlSayInPanel), so a refusal is readable the same way a proposal is. */
const INSTRUMENT = () => {
  window.__seen = { asked: [], said: [], cards: [] };
  const realPropose = window.copilotPropose;
  window.copilotPropose = async o => {
    window.__seen.asked.push(o);
    return { advice: 'Same effect, fewer words.',
      proposedText: 'Invoices are payable within thirty (30) days of issue.', strict: true };
  };
  const realPush = window.aiPush;
  window.aiPush = (role, m) => {
    window.__seen.said.push({ role, text: String((m && m.text) || '') });
    return realPush ? realPush(role, m) : null;
  };
  const realCard = window.aiOpenProposal;
  window.aiOpenProposal = o => { window.__seen.cards.push(o); return realCard ? realCard(o) : o; };
  window.__reset = () => { window.__seen = { asked: [], said: [], cards: [] };
    document.querySelectorAll('.nego-selmenu').forEach(n => n.remove());
    const s = window.getSelection(); if (s) s.removeAllRanges(); };
  /* Locate a clause section in the document canvas by the wording in it. */
  window.__clause = re => [...document.querySelectorAll('#rl-doc [data-clause]')]
    .find(el => new RegExp(re).test(el.textContent || '')) || null;
  /* Every text node under an element — the coordinate space a selection lives
     in. ::marker text is genuinely not here, which is the point. */
  window.__nodes = el => {
    const out = [];
    (function walk(n){
      for (const ch of n.childNodes){
        if (ch.nodeType === 3) out.push(ch);
        else if (ch.nodeType === 1) walk(ch);
      }
    })(el);
    return out;
  };
  window.__point = (el, needle, edge, nth) => {
    const nodes = window.__nodes(el);
    const full = nodes.map(n => n.nodeValue).join('');
    let idx = -1, k = 0;
    for (let i = full.indexOf(needle); i >= 0; i = full.indexOf(needle, i + 1), k++){
      if (k === (nth || 0)){ idx = i; break; }
    }
    if (idx < 0) return null;
    const pos = edge === 'end' ? idx + needle.length : idx;
    let run = 0;
    for (const n of nodes){
      if (pos <= run + n.nodeValue.length) return { node: n, offset: pos - run };
      run += n.nodeValue.length;
    }
    return null;
  };
  /* A real selection, then a real mouseup on the document — the gesture the
     page listens for. AWAITED: the page defers openSelMenu by a tick on
     purpose (a mouseup on a control is not a selection gesture, and the menu
     must not flicker under the pointer mid-drag), and in a real browser that
     tick is real. */
  window.__settle = (ms) => new Promise(r => setTimeout(r, ms || 40));
  window.__select = async (a, b, target) => {
    const r = document.createRange();
    r.setStart(a.node, a.offset); r.setEnd(b.node, b.offset);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(r);
    (target || a.node.parentElement).dispatchEvent(
      new MouseEvent('mouseup', { bubbles: true, view: window }));
    await window.__settle();
    return { text: sel.toString(), menu: !!document.querySelector('.nego-selmenu') };
  };
  window.__press = re => {
    const menu = document.querySelector('.nego-selmenu');
    if (!menu) return false;
    const btn = [...menu.querySelectorAll('[data-nego-ai]')]
      .find(b => new RegExp(re).test(b.textContent));
    if (!btn) return false;
    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    return true;
  };
  window.__said = re => window.__seen.said.some(m => new RegExp(re, 'i').test(m.text));
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/redline.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => check('no page error', false, e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await page.evaluate(INSTRUMENT);
  await pause(200);

  /* ---- 0. the furniture really is unselectable in a real cascade ---- */
  const cascade = await page.evaluate(() => {
    const t = document.querySelector('#rl-doc .rl-tools');
    const tag = document.querySelector('#rl-doc .rl-asktag');
    return { tools: t ? getComputedStyle(t).userSelect : 'missing',
      asktag: tag ? getComputedStyle(tag).userSelect : 'missing' };
  });
  check('0 the clause toolbar computes to user-select:none', cascade.tools === 'none', cascade.tools);
  check('0 and so does the ask tag', cascade.asktag === 'none', cascade.asktag);

  /* ---- 1. ::marker is genuinely absent from a real selection ----
     Measured before anything is asserted about matching, because it is the
     premise of the whole B2 fix and jsdom cannot show it. */
  const marker = await page.evaluate(() => {
    window.__reset();
    const cl = window.__clause('Either party may terminate');
    if (!cl) return { skip: true };
    const a = window.__point(cl, 'Either party may terminate', 'start', 0);
    const b = window.__point(cl, 'services already rendered', 'end', 0);
    if (!a || !b) return { skip: true };
    const r = document.createRange();
    r.setStart(a.node, a.offset); r.setEnd(b.node, b.offset);
    const stored = (window.negoClauseList(window.CONTRACT)
      .find(x => /Either party may terminate/.test(x.text || '')) || {}).text || '';
    return { selected: r.toString(), stored };
  });
  if (marker.skip) check('1 the list clause is on the page', false, 'not found');
  else {
    check('1 the stored clause carries list markers the screen does not print',
      /^\s*1\.\s/.test(marker.stored) || /\n\s*2\.\s/.test(marker.stored),
      JSON.stringify(marker.stored.slice(0, 40)));
    check('1 a real selection across two sub-clauses contains no marker',
      !/(^|\n)\s*[12]\.\s/.test(marker.selected),
      JSON.stringify(marker.selected.slice(0, 46)));
  }

  /* ---- 2. and the Copilot is still asked about it ---- */
  const lists = await page.evaluate(async () => {
    window.__reset();
    const cl = window.__clause('Either party may terminate');
    const a = window.__point(cl, 'Either party may terminate', 'start', 0);
    const b = window.__point(cl, 'services already rendered', 'end', 0);
    const got = await window.__select(a, b);
    const pressed = window.__press('Shorten');
    await new Promise(r => setTimeout(r, 60));
    return { ...got, pressed, asked: window.__seen.asked.length,
      refused: window.__said('couldn.t be matched|pending edits|more than one') };
  });
  check('2 a cross-sub-clause drag opens the menu', lists.menu);
  check('2 and reaches the Copilot', lists.asked === 1, `asked ${lists.asked}`);
  check('2 with no false refusal', !lists.refused);
  await page.screenshot({ path: path.join(OUT, '01-sub-clause-selection.png') });

  /* ---- 3. a whole clause, grabbed from its heading, by a REAL pointer drag ---- */
  const wholeClause = await page.evaluate(() => {
    window.__reset();
    /* A clause with NO redline on it: the payment clause carries a live
       counterparty ask in this fixture, and wording under a live redline is
       refused on purpose (see check 5). */
    const cl = window.__clause('Business Day');
    const h = cl.querySelector('.rl-clause-h') || cl.firstElementChild;
    const body = cl.querySelector('.nego-body') || cl;
    const hr = h.getBoundingClientRect();
    const brs = body.getClientRects();
    const last = brs[brs.length - 1];
    return { from: { x: hr.left + 2, y: hr.top + hr.height / 2 },
      to: { x: last.right - 2, y: last.bottom - Math.min(6, last.height / 2) } };
  });
  await page.mouse.move(wholeClause.from.x, wholeClause.from.y);
  await page.mouse.down();
  await page.mouse.move(wholeClause.to.x, wholeClause.to.y, { steps: 24 });
  await page.mouse.up();
  await pause(120);
  const whole = await page.evaluate(async () => {
    const sel = window.getSelection();
    const swept = sel.toString();
    const menu = !!document.querySelector('.nego-selmenu');
    const pressed = window.__press('Shorten');
    await new Promise(r => setTimeout(r, 60));
    return { swept, pressed, menu, asked: window.__seen.asked.length,
      passage: (window.__seen.asked[0] || {}).passage || '',
      refused: window.__said('couldn.t be matched|pending edits') };
  });
  check('3 a real pointer drag from the heading selects the clause',
    /Business Day/.test(whole.swept), JSON.stringify(whole.swept.slice(0, 44)));
  check('3 and the real drag really did sweep the heading in',
    /Definitions/.test(whole.swept), JSON.stringify(whole.swept.slice(0, 20)));
  check('3 the Copilot is asked about it', whole.asked === 1, `asked ${whole.asked}`);
  check('3 with no false refusal', !whole.refused);
  check('3 and the heading is not sent as if it were the wording',
    !!whole.passage && !/Definitions/i.test(whole.passage),
    JSON.stringify(String(whole.passage).slice(0, 46)));
  check('3 nor is the hover toolbar',
    !/Direct Edit|Propose deletion|Add Note/.test(String(whole.passage)));
  await page.screenshot({ path: path.join(OUT, '02-whole-clause-drag.png') });

  /* ---- 4. a drag that overshoots into the margin below the clause ---- */
  const over = await page.evaluate(async () => {
    window.__reset();
    const all = [...document.querySelectorAll('#rl-doc [data-clause]')];
    const cl = window.__clause('Business Day');
    const next = all[all.indexOf(cl) + 1];
    if (!next) return { skip: true };
    const a = window.__point(cl, 'In this Agreement', 'start', 0);
    /* Exactly what a browser leaves behind when the pointer lands in the gap:
       the end at offset 0 of the next clause, zero characters of it selected. */
    const r = document.createRange();
    r.setStart(a.node, a.offset); r.setEnd(next, 0);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(r);
    cl.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, view: window }));
    await window.__settle();
    const menu = !!document.querySelector('.nego-selmenu');
    const pressed = window.__press('Shorten');
    await new Promise(r2 => setTimeout(r2, 60));
    return { menu, pressed, asked: window.__seen.asked.length,
      spanned: window.__said('more than one clause') };
  });
  if (over.skip) check('4 there is a clause after the payment clause', false);
  else {
    check('4 an overshoot into the margin is not read as spanning two clauses', !over.spanned);
    check('4 and the Copilot is asked', over.asked === 1, `asked ${over.asked}`);
  }

  /* ---- 5. the true refusals still refuse ----
     The payment clause carries a LIVE counterparty redline in this fixture. */
  const live = await page.evaluate(async () => {
    window.__reset();
    const cl = window.__clause('forty-five \\(45\\) days|All invoices are payable');
    const marks = cl.querySelectorAll('ins,del,.nego-ins,.nego-del');
    if (!marks.length) return { skip: true };
    const a = window.__point(cl, 'All invoices', 'start', 0);
    const b = window.__point(cl, 'date of issue', 'end', 0);
    if (!a || !b) return { skip: true };
    await window.__select(a, b);
    const pressed = window.__press('Shorten');
    await new Promise(r => setTimeout(r, 60));
    return { pressed, asked: window.__seen.asked.length, pending: window.__said('pending edits') };
  });
  if (live.skip) check('5 the payment clause carries a live redline', false, 'no marks found');
  else {
    check('5 wording under a LIVE redline is still refused', live.pending);
    check('5 and nothing is asked of the model', live.asked === 0, `asked ${live.asked}`);
  }

  const cross = await page.evaluate(async () => {
    window.__reset();
    const a0 = window.__clause('Business Day');
    const b0 = window.__clause('All invoices are payable');
    const a = window.__point(a0, 'In this Agreement', 'start', 0);
    const b = window.__point(b0, 'date of issue', 'end', 0);
    if (!a || !b) return { skip: true };
    await window.__select(a, b, a0);
    const pressed = window.__press('Shorten');
    await new Promise(r => setTimeout(r, 60));
    return { pressed, asked: window.__seen.asked.length, spanned: window.__said('more than one clause') };
  });
  if (cross.skip) check('5 both clauses are on the page', false);
  else {
    check('5 a genuine drag across two numbered clauses is still refused', cross.spanned);
    check('5 and nothing is asked of the model', cross.asked === 0, `asked ${cross.asked}`);
  }

  /* ---- 6. front matter answers instead of doing nothing ---- */
  const front = await page.evaluate(async () => {
    window.__reset();
    const rec = document.querySelector('#rl-doc .rl-recital') || document.querySelector('#rl-doc .rl-paper-head');
    if (!rec) return { skip: true };
    const nodes = window.__nodes(rec).filter(n => n.nodeValue.trim().length > 12);
    if (!nodes.length) return { skip: true };
    const n = nodes[0];
    const r = document.createRange();
    r.setStart(n, 0); r.setEnd(n, Math.min(24, n.nodeValue.length));
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(r);
    rec.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, view: window }));
    await window.__settle();
    const menu = document.querySelector('.nego-selmenu');
    return { menu: !!menu, text: menu ? menu.textContent : '',
      verbs: menu ? menu.querySelectorAll('[data-nego-ai]').length : -1 };
  });
  if (front.skip) check('6 the page renders front matter', false);
  else {
    check('6 a highlight in the recital is answered, not ignored', front.menu);
    check('6 and it says what the wording is', /front matter|negotiable clause/i.test(front.text),
      JSON.stringify(String(front.text).slice(0, 60)));
    check('6 offering nothing to file', front.verbs === 0, `${front.verbs} verbs`);
  }
  await page.screenshot({ path: path.join(OUT, '03-front-matter.png') });

  await browser.close();
  srv.close();
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log(`screenshots → test/chromium/shots/selection`);
  process.exit(pass === results.length ? 0 : 1);
})();
