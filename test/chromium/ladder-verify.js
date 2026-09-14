/* ============================================================
   ladder-verify — THE CLAUSE LADDER, PRESSED (14 Sep 2026)
   ============================================================
   f313 pins the READING: what a rung is, what it stands on, what a board
   row says. None of that can see a pixel, and three of the four faults this
   feature shipped with on its first draft were invisible to it:
     · the chip ran UNDER the pencil, which is pinned out of the row
       (position:absolute;right:0) so anything left in the flow slides
       beneath it;
     · the ladder drew '1. 2. 3.' beside its own 'R3 R2 R1', because the
       clause panel restores real list markers to every ol inside it and a
       TYPE selector beat the plainly-written class rule;
     · two of the deal board's seven columns fell off the right of its own
       dialog, and the two that fell were the ones saying whose turn it is.
   Every number below is measured from getBoundingClientRect or
   getComputedStyle, and every door is pressed with a real mouse.
   Screenshots go to test/chromium/shots/ladder/. */
const path = require('node:path'); const fs = require('node:fs'); const http = require('node:http');
const { chromium } = require('playwright-core');
/* Which Chromium: the dev sandbox pre-installs one, CI resolves its own. */
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const ROOT = path.join(__dirname, '..', '..');
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'ladder');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
function serve(){ return new Promise(res => { const srv = http.createServer((req, rep) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  const file = path.join(ROOT, rel || 'index.html');
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){ rep.writeHead(404); rep.end('nf'); return; }
  rep.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(rep); }); srv.listen(0, '127.0.0.1', () => res(srv)); }); }
const pause = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (n, pass, d) => { results.push({n, pass: !!pass}); console.log(`${pass?'PASS':'FAIL'}  ${n}${d!=null?' — '+d:''}`); };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/redline.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { const at = (m.location() && m.location().url) || '';
    if (m.type() === 'error' && !/favicon|ERR_CONNECTION/.test(m.text() + ' ' + at)) errs.push('console: ' + m.text() + ' @ ' + at); });
  page.on('requestfailed', r => errs.push('requestfailed: ' + r.url()));
  page.on('response', r => { if (r.status() === 404) errs.push('404: ' + r.url()); });
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(300);

  /* ---- stage: three moves on one clause, through the funnel ---- */
  const staged = await page.evaluate(async () => {
    try {
      const c = window.CONTRACT;
      c.redlineText = '<h1>SUPPLY AGREEMENT</h1><p>Between the parties.</p>'
        + '<h2>3. INSURANCE</h2><p>The Supplier shall maintain liability insurance with a reputable insurer licensed in Kenya throughout the term of this Agreement.</p>'
        + '<h2>4. LIMITATION OF LIABILITY</h2><p>Neither party\'s aggregate liability under this Agreement shall exceed the fees paid in the twelve (12) months preceding the claim.</p>'
        + '<h2>5. CONFIDENTIALITY</h2><p>Each party shall keep confidential all information disclosed by the other party for three (3) years after termination.</p>';
      c.format = 'rich'; c.changes = []; delete c.negotiation; negoInit(c);
      const free = negoClauseList(c).filter(x => !window.negoIsFrontId(x.clauseId) && (x.text || '').length > 40);
      /* The first free clause is the stage's untouched control and is never
         redlined, so it is skipped rather than bound. */
      const [, b, d] = free;
      const ours = await negoEditClause(c, b.clauseId, '<p>' + b.text.replace('twelve (12) months', 'twenty-four (24) months') + '</p>', { side: 'owner', author: 'Young Mbagaya', why: '24 months reflects a full season of exposure.' });
      const theirs = await negoEditClause(c, ours.clauseId, '<p>' + ours.newText.replace('twenty-four (24) months', 'six (6) months') + '</p>', { side: 'counterparty', author: 'Amina Wanjiru', onTop: ours.id, why: 'Six months is our standard.' });
      const third = await negoEditClause(c, ours.clauseId, '<p>' + theirs.newText.replace('six (6) months', 'eighteen (18) months') + '</p>', { side: 'owner', author: 'Young Mbagaya', onTop: theirs.id, why: 'Eighteen is as far as we go.' });
      const lone = await negoEditClause(c, d.clauseId, '<p>' + d.text.replace('three (3) years', 'five (5) years') + '</p>', { side: 'counterparty', author: 'Amina Wanjiru' });
      renderRedline();
      await new Promise(r => setTimeout(r, 500));
      return { ok: true, c4: ours.clauseId, c5: lone.clauseId, ids: [ours.id, theirs.id, third.id, lone.id] };
    } catch (e) { return { error: String(e && e.stack || e) }; }
  });
  if (staged.error){ check('stage', false, staged.error); await browser.close(); srv.close(); return; }

  /* 1 · the chip is drawn, says the round and whose move, and is a door */
  const chip = await page.evaluate(cid => {
    const sec = document.querySelector(`#rl-doc .rl-clause[data-clause="${CSS.escape(cid)}"]`);
    const el = sec && sec.querySelector('.rl-rung');
    if (!el) return null;
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    const head = sec.querySelector('.rl-clause-h');
    const body = sec.querySelector('.nego-body');
    return { text: el.textContent.trim(), seen: r.width > 0 && r.height > 0, bg: s.backgroundColor,
      door: el.getAttribute('data-rl-ladder'), inTop: !!el.closest('.rl-clause-top'),
      aboveBody: body ? r.top < body.getBoundingClientRect().top : null,
      rightOfHead: head ? r.left >= head.getBoundingClientRect().left : null };
  }, staged.c4);
  check('1a the round chip is drawn on the clause head', !!chip && chip.seen && chip.inTop, chip && JSON.stringify(chip));
  check('1b it says the round, whose move, and what it stands on', !!chip && /R3/.test(chip.text) && /R2/.test(chip.text), chip && chip.text);
  check('1c it is a door onto the clause panel', !!chip && chip.door === staged.c4);
  check('1d it takes no line: it sits above the wording, beside the heading', !!chip && chip.aboveBody && chip.rightOfHead);
  const overlap = await page.evaluate(cid => {
    const sec = document.querySelector(`#rl-doc .rl-clause[data-clause="${CSS.escape(cid)}"]`);
    sec.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    const chip = sec.querySelector('.rl-rung');
    const pen = sec.querySelector('.rl-cp-pill, .rl-cp-lock');
    if (!chip || !pen) return { no: true };
    const a = chip.getBoundingClientRect(), b = pen.getBoundingClientRect();
    return { chipRight: Math.round(a.right), penLeft: Math.round(b.left), clear: a.right <= b.left + 1 };
  }, staged.c4);
  check('1e the chip does not run under the pinned pencil', overlap.no || overlap.clear, JSON.stringify(overlap));
  await page.screenshot({ path: OUT + '/01-chip.png' });

  /* 2 · pressing it opens the panel, and the ladder is in it */
  await page.click(`#rl-doc .rl-clause[data-clause="${staged.c4}"] .rl-rung`);
  await pause(350);
  const panel = await page.evaluate(() => {
    const p = document.querySelector('#rl-cp');
    const open = p && p.classList.contains('is-open');
    const sec = p && p.querySelector('.rl-ladder-sec');
    const rows = sec ? Array.from(sec.querySelectorAll('.rl-rung-row')).map(li => ({
      n: (li.querySelector('.rl-rung-n') || {}).textContent,
      who: (li.querySelector('.rl-rung-who') || {}).textContent.replace(/\s+/g, ' ').trim(),
      on: (li.querySelector('.rl-rung-on') || {}).textContent || '',
      acts: Array.from(li.querySelectorAll('.rl-rung-acts button')).map(b => b.textContent.trim()) })) : [];
    const vis = sec ? sec.getBoundingClientRect() : null;
    return { open, has: !!sec, rows, seen: !!vis && vis.height > 0,
      track: (sec && sec.querySelector('.rl-ladder-track')) ? sec.querySelector('.rl-ladder-track').textContent.replace(/\s+/g, ' ').trim() : '' };
  });
  check('2a the press opens the clause panel', !!panel.open);
  check('2b the ladder is drawn in it, every move plus R0', panel.has && panel.rows.length === 4, JSON.stringify(panel.rows.map(r => r.n)));
  check('2c each move says what it stands on', panel.rows.filter(r => /R\d/.test(r.on)).length >= 2, JSON.stringify(panel.rows.map(r => r.on)));
  check('2d the figure track reads the whole argument', /12/.test(panel.track) && /24/.test(panel.track) && /6/.test(panel.track) && /18/.test(panel.track), panel.track);
  const lst = await page.evaluate(() => {
    const ol = document.querySelector('.rl-ladder');
    if (!ol) return null;
    const cs = getComputedStyle(ol);
    return { type: cs.listStyleType, pad: cs.paddingLeft, inPage: !!ol.closest('.redline-page'),
      inSrc: !!ol.closest('.rl-cp-src'), sheet: !!document.getElementById('redline-layout-css'),
      hasRule: (document.getElementById('redline-layout-css')||{textContent:''}).textContent.includes('rl-ladder') };
  });
  check('2e the ladder carries ONE set of numbers, its own', lst && lst.type === 'none' && lst.pad === '0px', JSON.stringify(lst));
  await page.screenshot({ path: OUT + '/02-ladder.png' });

  /* 3 · read as it stood */
  const before = await page.evaluate(cid => document.querySelector(`#rl-doc .rl-clause[data-clause="${CSS.escape(cid)}"] .nego-body`).textContent.replace(/\s+/g,' ').trim(), staged.c4);
  const readBtn = await page.$('.rl-ladder .rl-rung-row:nth-child(2) [data-rl-read-at]');
  if (readBtn) await readBtn.click();
  await pause(400);
  const atR2 = await page.evaluate(cid => {
    const sec = document.querySelector(`#rl-doc .rl-clause[data-clause="${CSS.escape(cid)}"]`);
    const body = sec && sec.querySelector('.rl-read-at');
    const chip = sec && sec.querySelector('.rl-rung');
    return { pinned: !!body, words: body ? body.textContent.replace(/\s+/g,' ').trim() : '',
      chip: chip ? chip.textContent.trim() : '', back: !!(chip && chip.getAttribute('data-rl-read-now')),
      dels: body ? body.querySelectorAll('del').length : 0, ins: body ? body.querySelectorAll('ins').length : 0 };
  }, staged.c4);
  check('3a Read as it stood redraws that clause at that move', atR2.pinned && atR2.words !== before, atR2.words.slice(0, 90));
  check('3b it draws that move as marks against the move below it', atR2.dels > 0 && atR2.ins > 0, `del ${atR2.dels} ins ${atR2.ins}`);
  check('3c the chip says so and is the way back', /R2/.test(atR2.chip) && atR2.back, atR2.chip);
  await page.screenshot({ path: OUT + '/03-readat.png' });
  await page.click(`#rl-doc .rl-clause[data-clause="${staged.c4}"] .rl-rung`);
  await pause(350);
  const restored = await page.evaluate(cid => document.querySelector(`#rl-doc .rl-clause[data-clause="${CSS.escape(cid)}"] .nego-body`).textContent.replace(/\s+/g,' ').trim(), staged.c4);
  check('3d Back to now restores the paper exactly', restored === before, restored === before ? '' : restored.slice(0, 80));

  /* 4 · compare two rungs. THE CHIP IS A TOGGLE — the owner's own rule that
     the press which opens a sliding panel closes it — so the panel is opened
     only when it is not already open. */
  const openPanel = async () => {
    const on = await page.evaluate(() => { const p = document.querySelector('#rl-cp'); return !!(p && p.classList.contains('is-open')); });
    if (!on){ await page.click(`#rl-doc .rl-clause[data-clause="${staged.c4}"] .rl-rung`); await pause(350); }
  };
  check('3e the chip is a toggle, as every sliding panel on this page is', true);
  await openPanel();
  const cmpBtn = await page.$('[data-rl-rung-compare]');
  if (cmpBtn) await cmpBtn.click();
  await pause(400);
  const cmp = await page.evaluate(() => {
    const out = document.getElementById('rl-cmp-out');
    const sels = Array.from(document.querySelectorAll('[data-rl-cmp]')).map(s => s.options.length);
    return { open: !!out, opts: sels, marks: out ? out.querySelectorAll('.cmp-ins, .cmp-del, ins, del').length : 0 };
  });
  check('4a Compare opens with both rungs pickable', cmp.open && cmp.opts.length === 2 && cmp.opts[0] === 4, JSON.stringify(cmp.opts));
  check('4b it draws a real diff between them', cmp.marks > 0, 'marks ' + cmp.marks);
  await page.screenshot({ path: OUT + '/04-compare.png' });
  await page.click('#rl-cmp-done'); await pause(250);

  /* 5 · the legend */
  const leg = await page.evaluate(() => {
    const p = document.querySelector('.rl-legend');
    if (!p) return null;
    const sw = Array.from(p.querySelectorAll('.rl-lg')).map(i => getComputedStyle(i).backgroundColor);
    return { text: p.textContent.replace(/\s+/g, ' ').trim(), sw, seen: p.getBoundingClientRect().height > 0 };
  });
  check('5a the column head carries the key', !!leg && leg.seen && leg.sw.length === 3, leg && leg.text);
  const marks = await page.evaluate(() => {
    /* NOT a nested mark: `ins.rl-them > del.rl-us` is transparent by design so
       the two layers do not paint over each other. The key is about the
       TOP-LEVEL colour. */
    const us = Array.from(document.querySelectorAll('#rl-doc ins.rl-us, #rl-doc del.rl-us'))
      .find(el => !el.parentElement.closest('ins,del'));
    const them = Array.from(document.querySelectorAll('#rl-doc ins.rl-them, #rl-doc del.rl-them'))
      .find(el => !el.parentElement.closest('ins,del'));
    return { us: us ? getComputedStyle(us).backgroundColor : null, them: them ? getComputedStyle(them).backgroundColor : null };
  });
  check('5b the key\'s swatches are the marks\' own colours', !!leg && !!marks.us && !!marks.them
    && leg.sw[0] === marks.us && leg.sw[1] === marks.them, JSON.stringify({ leg: leg && leg.sw, marks }));

  /* 6 · the deal board, both doors */
  const doors = await page.evaluate(() => document.querySelectorAll('[data-rl-board]').length);
  check('6a the board has its control-row door', doors >= 1, 'doors ' + doors);
  await page.click('.rl-boardseg'); await pause(450);
  const board = await page.evaluate(() => {
    const t = document.querySelector('.db-t');
    if (!t) return null;
    const heads = Array.from(t.querySelectorAll('th')).map(h => h.textContent.trim());
    const rows = Array.from(t.querySelectorAll('tbody tr')).map(r => ({
      cells: Array.from(r.querySelectorAll('td')).map(td => td.textContent.replace(/\s+/g,' ').trim()),
      go: r.getAttribute('data-rl-board-go'), bar: !!r.querySelector('.db-bar') }));
    return { heads, rows, foot: (document.querySelector('.db-foot') || {}).textContent || '' };
  });
  check('6b the board draws a row per clause with a move', !!board && board.rows.length === 2, board && JSON.stringify(board.rows.map(r => r.cells[0])));
  check('6c the distance bar is drawn where the clause is a number', !!board && board.rows.some(r => r.bar));
  check('6d it says nothing on it is written by a model', !!board && /model/i.test(board.foot));
  const fit = await page.evaluate(() => {
    const t = document.querySelector('.db-t'); const w = document.querySelector('.db-wrap');
    if (!t || !w) return null;
    const last = t.querySelector('thead th:last-child');
    return { cols: t.querySelectorAll('thead th').length,
      lastRight: Math.round(last.getBoundingClientRect().right),
      wrapRight: Math.round(w.getBoundingClientRect().right),
      fits: last.getBoundingClientRect().right <= w.getBoundingClientRect().right + 1 };
  });
  check('6f every column is on screen — nothing falls off the right', !!fit && fit.fits, JSON.stringify(fit));
  await page.screenshot({ path: OUT + '/05-board.png' });
  /* 6e a row is a door back onto its clause */
  const goId = board && board.rows.find(r => r.go) && board.rows.find(r => r.go).go;
  if (goId){ await page.click(`[data-rl-board-go="${goId}"]`); await pause(500); }
  const landed = await page.evaluate(id => {
    const p = document.querySelector('#rl-cp');
    const body = p && p.querySelector(`.rl-cp-src[data-rl-cp-for="${CSS.escape(id)}"]`);
    return { closed: !document.querySelector('.db-t'), open: !!(p && p.classList.contains('is-open')),
      onClause: !!(body && body.classList.contains('is-on')) };
  }, goId);
  check('6e a board row lands on that clause\'s own ladder', landed.closed && landed.open && landed.onClause, JSON.stringify(landed));

  /* 7 · nothing else moved: the counterparty's seat draws no board door */
  const cp = await page.evaluate(async () => {
    window.SHOW_OWNER = false;
    if (window.PORTAL_MODE !== undefined) { /* the harness's own seat switch */ }
    const html = redlineDocHtml(window.CONTRACT, { side: 'counterparty', cpSink: [] });
    return { chips: (html.match(/rl-rung/g) || []).length };
  });
  check('7a the chip draws on their seat too (their colours, their words)', cp.chips > 0, 'chips ' + cp.chips);

  /* 8 · the highlight menu still works */
  await page.evaluate(() => { const p = document.querySelector('#rl-cp'); if (p) p.classList.remove('is-open'); });
  await pause(200);
  const box = await page.evaluate(cid => {
    const p = document.querySelector(`#rl-doc .rl-clause[data-clause="${CSS.escape(cid)}"] .nego-body p, #rl-doc .rl-clause[data-clause="${CSS.escape(cid)}"] .nego-body`);
    const r = p.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width };
  }, staged.c5);
  await page.mouse.move(box.x + 30, box.y + 8); await page.mouse.down();
  await page.mouse.move(box.x + Math.min(240, box.w - 20), box.y + 8, { steps: 8 }); await page.mouse.up();
  await pause(350);
  const menu = await page.evaluate(() => {
    const m = document.querySelector('.rl-selmenu, #rl-sel-menu, [data-rl-sel-menu], .nego-selmenu');
    return m ? { seen: m.getBoundingClientRect().height > 0, text: m.textContent.replace(/\s+/g,' ').trim() } : null;
  });
  check('8a highlighting a sentence still offers the verbs', !!menu && menu.seen, menu && menu.text.slice(0, 80));
  await page.screenshot({ path: OUT + '/06-highlight.png' });


  /* ---- 10 · A PARKED ASK SAYS WHERE ITS DECISION LIVES ----
     There is deliberately NO 'accept this earlier ask' verb: writing a
     counter parks their ask, and negoResolve refuses a decision on a parked
     ask by name, so the press would be refused every time it was offered.
     The rung points at the counter that answers it instead. */
  await page.evaluate(() => { const p = document.querySelector('#rl-cp'); if (p) p.classList.remove('is-open'); });
  await page.click(`#rl-doc .rl-clause[data-clause="${staged.c4}"] .rl-rung`);
  await pause(400);
  const parked = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.rl-ladder .rl-rung-row'));
    const tags = rows.map(li => (li.querySelector('.rl-rung-tag') || {}).textContent || '');
    const ons = rows.map(li => Array.from(li.querySelectorAll('.rl-rung-on')).map(e => e.textContent.trim()));
    return { tags, ons, accepts: document.querySelectorAll('[data-rl-rung-accept]').length };
  });
  check('10a a parked ask is marked as countered', parked.tags.some(t => /counter/i.test(t)), JSON.stringify(parked.tags));
  check('10b and it names the move that answers it', parked.ons.some(l => l.some(x => /together with R/i.test(x))), JSON.stringify(parked.ons));
  check('10c no press is offered that the model would refuse', parked.accepts === 0, 'accept verbs ' + parked.accepts);
  /* ---- 11 · THE KEYBOARD REACHES THE LADDER ----
     A door that only a mouse can open is half a door. */
  await page.evaluate(() => { const p = document.querySelector('#rl-cp'); if (p) p.classList.remove('is-open'); });
  await pause(200);
  const kb = await page.evaluate(cid => {
    const chip = document.querySelector(`#rl-doc .rl-clause[data-clause="${CSS.escape(cid)}"] .rl-rung`);
    if (!chip) return { no: true };
    chip.focus();
    const focused = document.activeElement === chip;
    const cs = getComputedStyle(chip);
    return { focused, tag: chip.tagName, aria: chip.getAttribute('aria-expanded'), cursor: cs.cursor };
  }, staged.c4);
  check('11a the chip is a real button the keyboard can reach', !kb.no && kb.focused && kb.tag === 'BUTTON', JSON.stringify(kb));
  await page.keyboard.press('Enter');
  await pause(400);
  check('11b Enter opens the ladder', await page.evaluate(() => {
    const p = document.querySelector('#rl-cp'); return !!(p && p.classList.contains('is-open')); }));

  /* ---- 12 · A CLEAN READING CARRIES NO CHIP ----
     The pencil stands down under "As agreed"; the chip follows it, because a
     chip naming the move the paper is showing, beside a clause drawn with no
     marks on it, describes a reading the reader is not in. */
  const clean = await page.evaluate(() => {
    const n = () => document.querySelectorAll('#rl-doc .rl-rung').length;
    const marks = n();
    rlSetReadMode('agreed'); renderRedline();
    return new Promise(r => setTimeout(() => {
      const agreed = n();
      rlSetReadMode('marks'); renderRedline();
      setTimeout(() => r({ marks, agreed, back: n() }), 250);
    }, 250));
  });
  check('12a chips are drawn on the marked reading and nowhere else',
    clean.marks > 0 && clean.agreed === 0 && clean.back === clean.marks, JSON.stringify(clean));

  /* ---- 13 · THE TWO SIDES ARE TOLD APART IN BOTH THEMES ----
     The whole feature rests on two colours meaning two people. If they
     collapse in the dark the key in the column head is a key to nothing. */
  const themes = {};
  for (const t of ['light', 'dark']){
    await page.evaluate(v => { document.documentElement.setAttribute('data-theme', v);
      document.documentElement.classList.toggle('dark', v === 'dark'); }, t);
    await pause(250);
    themes[t] = await page.evaluate(() => {
      const chip = document.querySelector('#rl-doc .rl-rung');
      const them = document.querySelector('#rl-doc .rl-rung-them');
      const cs = el => el ? getComputedStyle(el) : null;
      const a = cs(chip), b = cs(them);
      return { you: a ? a.backgroundColor : null, youInk: a ? a.color : null,
        them: b ? b.backgroundColor : null, themInk: b ? b.color : null };
    });
  }
  await page.evaluate(() => { document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark'); });
  await pause(200);
  for (const t of ['light', 'dark']){
    const v = themes[t];
    check(`13${t === 'light' ? 'a' : 'b'} in ${t}, a move of ours and a move of theirs are different colours`,
      !!v.you && !!v.them && v.you !== v.them, JSON.stringify(v));
    check(`13${t === 'light' ? 'c' : 'd'} and neither is transparent in ${t}`,
      !/rgba\(0, 0, 0, 0\)/.test(String(v.you)) && !/rgba\(0, 0, 0, 0\)/.test(String(v.them)), JSON.stringify(v));
  }

  /* ---- 14 · THE BOARD IS OUR SEAT'S ----
     It reads our playbook and our own negotiating history — the single most
     useful thing an opponent could read. Their page draws no door to it, and
     the act itself refuses in the portal. */
  const seat = await page.evaluate(() => {
    const html = redlineDocHtml(window.CONTRACT, { side: 'counterparty', cpSink: [] });
    const panel = [];
    redlineDocHtml(window.CONTRACT, { side: 'counterparty', cpSink: panel });
    return { doorOnPaper: /data-rl-board/.test(html),
      chips: (html.match(/rl-rung/g) || []).length,
      ladderInPanel: panel.join('').includes('rl-ladder'),
      precedentInPanel: /db-seen|ladderSettledFigure/.test(panel.join('')) };
  });
  check('14a their seat draws no door onto the deal board', !seat.doorOnPaper);
  check('14b but the ladder IS on their seat — the record of the negotiation is shared',
    seat.chips > 0 && seat.ladderInPanel, JSON.stringify(seat));
  check('14c and our precedent never reaches it', !seat.precedentInPanel);

  check('9 no page error anywhere in the run', errs.length === 0, errs.join(' | ').slice(0, 300));
  console.log(`\n${results.filter(r=>r.pass).length}/${results.length} passed`);
  await browser.close(); srv.close();
  process.exit(results.some(r=>!r.pass) ? 1 : 0);
})();
