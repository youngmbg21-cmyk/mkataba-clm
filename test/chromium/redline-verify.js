/* Chromium verification of the Redline Workbench refactor.
   ============================================================
   jsdom has no layout engine and no cascade, so everything the refactor claims
   about how the page LOOKS is asserted at the rule level in
   test/f89-negotiation-workbench-refactor.test.js and has to be confirmed
   against a real box model here. Every number this prints is measured from
   getComputedStyle or getBoundingClientRect, not read out of a stylesheet:

     1  the header carries no border and no card shadow
     2  the contract sheet has exactly ONE frame, not a sheet inside a panel
     3  no modal or floating dialog opens on the redline route
     4  a selection drives the docked Copilot panel
     5  the selection menu offers exactly three actions
     6  the uploaded headings and block structure survive to the canvas
     7  the contract body and the Tracked Changes diff compute to one size
     8  every marked span carries a "Last updated by …" tooltip
     9  folding the discussion re-deals the row to two thirds / one third
    10  only live redlines have cards
    11  the four card verbs compute to the specified fills
    12  Edit scrolls the document to the clause and opens the editor
    13  the batch send is in the toolbar, counted and animated
    14  a Tracked Changes card holds the delta and nothing else
    15  clause <-> card lights and scrolls, both directions, really scrolling

   Item 16 — one-click Send, and the Draft -> Sent states after it — is NOT
   here, and cannot be: the send routes through counterpartyContact and
   reshareToLastRecipient, both of which live in js/core.js, which this harness
   does not load. Verified in the running app instead, against a real server.
   f89 covers the routing and the states.

   Screenshots go to test/chromium/shots/redline/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'redline');
const ROOT = path.join(__dirname, '..', '..');
/* Which Chromium. The dev sandbox pre-installs one at a fixed path; CI (and
   anyone else) runs `npx playwright-core install chromium` and lets
   playwright-core resolve its own registry. Hardcoding only the sandbox path is
   why these checks could not run anywhere else — which is how nine of them
   stayed red for a day without anyone seeing. CHROMIUM_BIN overrides both. */
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
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

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/redline.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => check('no page error', false, e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(250);
  await page.screenshot({ path: path.join(OUT, '01-workbench.png'), fullPage: false });

  /* ---- 1. the header is a band ---- */
  const head = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector('#view-redline .rl-head'));
    return { border: s.borderTopWidth, shadow: s.boxShadow, radius: s.borderTopLeftRadius,
      bg: s.backgroundColor };
  });
  check('1 header has no border', head.border === '0px', head.border);
  check('1 header has no card shadow', head.shadow === 'none', head.shadow);
  check('1 header has no fill of its own',
    /rgba\(0, 0, 0, 0\)|transparent/.test(head.bg), head.bg);

  /* ---- 2. one sheet, not a sheet inside a panel ----
     Counted rather than asserted: the failure was two visible frames a few
     pixels apart, so what is measured is how many painted borders sit between
     the column edge and the first clause. */
  const sheet = await page.evaluate(() => {
    const col = document.getElementById('rl-doc');
    const paper = col.querySelector('.nego-doc');
    const framed = el => {
      const s = getComputedStyle(el);
      return parseFloat(s.borderTopWidth) > 0 || (s.boxShadow !== 'none' && s.boxShadow !== '');
    };
    let n = 0, el = paper;
    while (el && el !== col.parentElement){ if (framed(el)) n++; el = el.parentElement; }
    const pr = paper.getBoundingClientRect(), cr = col.getBoundingClientRect();
    return { frames: n, paperBorder: getComputedStyle(paper).borderTopWidth,
      paperShadow: getComputedStyle(paper).boxShadow,
      paperBg: getComputedStyle(paper).backgroundColor,
      colBorder: getComputedStyle(col).borderTopWidth,
      colBg: getComputedStyle(col).backgroundColor,
      paperWidth: pr.width, colWidth: cr.width,
      gutterL: Math.round(pr.left - cr.left), gutterR: Math.round(cr.right - pr.right) };
  });
  /* ---- WHAT THIS SECTION USED TO ASSERT, AND WHY IT NO LONGER DOES ----
     These five checks encoded the flattening of 0b0f42f and 84ea572: one
     painted frame, no shadow on the sheet, and a contract running the full
     width of its column. 1390c55 DELIBERATELY reversed that ("Float the
     redline document as a centred sheet with gutters") so the Redline page and
     the Doc page stop reading as two different documents — a 720px sheet
     carrying its own shadow, floating on the column as canvas. ca1473d caught
     the jsdom tests up and did not catch these up, because browser checks are
     not run on every branch; they have been red ever since, which is the whole
     hazard of a check nobody watches.

     Re-pointed at the design that is actually intended, and deliberately NOT
     rewritten as "whatever the stylesheet says" — each one still has to be
     capable of failing. The sheet is paper on canvas: bounded, centred, its own
     shadow, its own background. */
  check('2 the sheet carries no border — it is paper, edged by shadow',
    sheet.paperBorder === '0px', sheet.paperBorder);
  check('2 and it does carry that shadow', sheet.paperShadow !== 'none' && !!sheet.paperShadow,
    sheet.paperShadow);
  check('2 the sheet reads as paper against the column behind it',
    sheet.paperBg !== sheet.colBg, `${sheet.paperBg} on ${sheet.colBg}`);
  /* The measure the Doc page sets, so the two tabs typeset the contract to the
     same line length. Bounded is the point: a sheet that grew with the window
     would be the edge-to-edge look this replaced. */
  check('2 the sheet is bounded to the design\'s 720px measure',
    Math.abs(sheet.paperWidth - 720) <= 1 && sheet.paperWidth < sheet.colWidth - 24,
    `${Math.round(sheet.paperWidth)} of ${Math.round(sheet.colWidth)}px`);
  /* THE REGRESSION THIS SECTION IS NOW FOR. 6662667: the type-scale rule
     out-specified the centring rule and pinned the sheet to the left of the
     column with all the spare width on the right. Equal gutters is the one
     measurement that catches it, and it cannot be read off a stylesheet. */
  check('2 and centred, with the spare width split evenly',
    Math.abs(sheet.gutterL - sheet.gutterR) <= 2,
    `${sheet.gutterL}px left / ${sheet.gutterR}px right`);

  /* ---- 2b. how much of the column the contract actually occupies ----
     The complaint this answers is "there is too much space at the edges", and
     it is a measurement, not an opinion: before the fix the text sat 116px in
     from the left of its column and 46px from the right — lopsided, because
     the engine's 100px badge gutter was landing on one side only. */
  const inset = await page.evaluate(() => {
    const col = document.getElementById('rl-doc').getBoundingClientRect();
    const bodies = [...document.querySelectorAll('#rl-doc .rl-clause .nego-body')];
    const left = Math.min(...bodies.map(b => b.getBoundingClientRect().left));
    const right = Math.max(...bodies.map(b => b.getBoundingClientRect().right));
    const tools = document.querySelector('#rl-doc .rl-tools');
    const cls = [...document.querySelectorAll('#rl-doc .rl-clause')];
    const gaps = cls.slice(1).map((c, i) =>
      Math.round(c.getBoundingClientRect().top - cls[i].getBoundingClientRect().bottom));
    const paper = document.querySelector('#rl-doc .rl-paper').getBoundingClientRect();
    return { left: Math.round(left - col.left), right: Math.round(col.right - right),
      colWidth: Math.round(col.width), paperWidth: Math.round(paper.width),
      padL: Math.round(left - paper.left), padR: Math.round(paper.right - right),
      textWidth: Math.round(right - left), gaps,
      toolsOpacity: tools ? getComputedStyle(tools).opacity : null,
      toolsPosition: tools ? getComputedStyle(tools).position : null,
      toolsPE: tools ? getComputedStyle(tools).pointerEvents : null };
  });
  check('2b the text sits the same distance from both edges',
    Math.abs(inset.left - inset.right) <= 2, `${inset.left}px left / ${inset.right}px right`);
  /* MEASURED INSIDE THE SHEET, not inside the column. The original complaint
     survives the redesign and is still the thing worth catching: the engine's
     100px badge gutter landing on ONE side, so the text sat 116px from the left
     of its container and 46px from the right. Against the column that now reads
     as the sheet's own gutters (103px each side, by design); against the SHEET
     it is still exactly the lopsidedness it always was, and .rl-paper's own
     36px padding is what it must equal. */
  check('2b the text sits on the sheet\'s own padding, not a reserved gutter',
    inset.padL <= 40 && Math.abs(inset.padL - inset.padR) <= 2,
    `${inset.padL}px / ${inset.padR}px inside the sheet`);
  /* A floor, not an equality: .rl-paper's 36px each side is exactly 90% of its
     720px, so this passes today by design and fails the moment anything
     reserves a further gutter INSIDE the sheet — which is how the 100px badge
     column got in the first time. */
  check('2b nothing is reserved inside the sheet beyond its own padding',
    inset.textWidth / inset.paperWidth >= 0.89,
    `${(inset.textWidth / inset.paperWidth * 100).toFixed(1)}% of the sheet`);
  /* The toolbar is an overlay: hidden at rest and OUT OF THE FLOW, so being
     hidden costs no height — the failure mode both of its predecessors had
     (a reserved blank row, then a permanently busy page) is measured against
     here, not asserted from the stylesheet. */
  check('2b at rest the toolbar is hidden and costs no height',
    inset.toolsOpacity === '0' && inset.toolsPosition === 'absolute' && inset.toolsPE === 'none',
    `opacity ${inset.toolsOpacity}, position ${inset.toolsPosition}, pointer-events ${inset.toolsPE}`);
  check('2b the gaps between clauses are even and tight',
    inset.gaps.every(g => g <= 20), JSON.stringify(inset.gaps));

  /* A REAL hover, through the input pipeline, because :hover cannot be faked
     from script and a class-toggle simulation would be testing the simulation. */
  await page.hover('#rl-doc .rl-clause');
  await pause(300);                                   // the .15s reveal transition
  const hovered = await page.evaluate(() => {
    const t = document.querySelector('#rl-doc .rl-clause:hover .rl-tools')
      || document.querySelector('#rl-doc .rl-clause .rl-tools');
    return { op: getComputedStyle(t).opacity, pe: getComputedStyle(t).pointerEvents };
  });
  check('2b hovering a clause reveals its tools, clickably',
    hovered.op === '1' && hovered.pe !== 'none', `opacity ${hovered.op}, pointer-events ${hovered.pe}`);
  await page.mouse.move(5, 5);                        // park the pointer off the document
  await pause(250);

  /* ---- 6. the uploaded document survives ---- */
  const struct = await page.evaluate(() => {
    const doc = document.getElementById('rl-doc');
    const heads = [...doc.querySelectorAll('.rl-clause-h')].map(h => h.textContent.trim());
    /* The headings the FILE carried, read back out of the uploaded markup.
       Compared as sets rather than pattern-matched, because the only correct
       answer to "what does this heading say" is "whatever the document says". */
    const src = [...new DOMParser().parseFromString(CONTRACT.redlineText, 'text/html')
      .querySelectorAll('h2')].map(h => h.textContent.replace(/\s+/g, ' ').trim());
    const payment = [...doc.querySelectorAll('.rl-clause')]
      .find(s => /Payment Terms/i.test(s.textContent));
    return { heads, src,
      bold: !!doc.querySelector('.nego-body strong'),
      list: doc.querySelectorAll('.nego-body ol li').length,
      paras: payment ? payment.querySelectorAll('.nego-body .rl-line, .nego-body > p').length : 0 };
  });
  check('6 every heading is drawn exactly as the file wrote it',
    struct.heads.join('|') === struct.src.join('|'),
    `${JSON.stringify(struct.heads)} vs ${JSON.stringify(struct.src)}`);
  check('6 "1.1 Definitions" survives verbatim', struct.heads.includes('1.1 Definitions'));
  check('6 "8.2(a)" is not re-punctuated',
    struct.heads.some(h => h.indexOf('8.2(a)') === 0)
    && !struct.heads.some(h => /^8\.2\.\s*\(a\)/.test(h)));
  check('6 bold survives ingestion', struct.bold);
  check('6 a numbered sub-clause list stays a list', struct.list === 2, struct.list);
  check('6 a two-paragraph clause stays two blocks', struct.paras >= 2, struct.paras);

  /* ---- 7. two computed type scales, each holding its own ----
     The canvas reads at the Doc page's contract size (~15px) so switching
     tabs never resizes the wording being judged; the cards stay compact —
     a two-line pointer is not the document. */
  const type = await page.evaluate(() => {
    const body = document.querySelector('#rl-doc .nego-body');
    /* The card's own scale, read off the head — the diff it used to be read
       from is gone, because the card no longer carries a copy of the wording. */
    const meta = document.querySelector('#rl-changes .rl-card-meta');
    return { body: getComputedStyle(body).fontSize,
      cardScale: getComputedStyle(document.querySelector('.redline-page')).getPropertyValue('--rl-type').trim(),
      meta: meta ? getComputedStyle(meta).fontSize : null };
  });
  check('7 the contract body reads at the Doc page scale', type.body === '15px', type.body);
  check('7 the card scale stays compact', type.cardScale === '11.5px', type.cardScale);
  check('7 and the card head is set smaller still', type.meta === '10.5px', type.meta);

  /* ---- 8. attribution on every mark ---- */
  const marks = await page.evaluate(() => {
    const els = [...document.querySelectorAll('#rl-doc ins, #rl-doc del')];
    return { n: els.length,
      titled: els.filter(e => /^Last updated by /.test(e.getAttribute('title') || '')).length,
      sample: els.length ? els[0].getAttribute('title') : '' };
  });
  check('8 the document carries marked wording', marks.n > 0, marks.n);
  check('8 every mark names who last touched it', marks.n > 0 && marks.titled === marks.n,
    `${marks.titled}/${marks.n} · ${marks.sample}`);

  /* ---- 10 / 11. the column and its verbs ---- */
  const cards = await page.evaluate(() => {
    const live = negoChanges(CONTRACT).filter(x => x.status === 'pending').length;
    /* Colour is read as NUMBERS, not as a hex string to be matched. A wash can
       be retuned without breaking a check; what may not change is that it stays
       readable and stays distinguishable from the other verb. */
    const rgb = s => (String(s).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => {
      const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const btn = sel => {
      const b = document.querySelector('#rl-changes ' + sel);
      if (!b) return null;
      const s = getComputedStyle(b);
      const bg = rgb(s.backgroundColor), fg = rgb(s.color);
      const L1 = Math.max(lum(bg), lum(fg)), L2 = Math.min(lum(bg), lum(fg));
      return { bg: s.backgroundColor, fg: s.color, bgv: bg, fgv: fg,
        contrast: Math.round(((L1 + 0.05) / (L2 + 0.05)) * 100) / 100 };
    };
    return { cards: document.querySelectorAll('#rl-changes [data-nego-card]').length,
      clauses: document.querySelectorAll('#rl-doc .rl-clause').length, live,
      acc: btn('button.rl-acc'), rej: btn('button.rl-rej'),
      edit: btn('button.rl-edit'), send: btn('button.rl-send') };
  });
  check('10 one card per live redline, not per clause',
    cards.cards === cards.live && cards.clauses > cards.cards,
    `${cards.cards} cards · ${cards.live} live · ${cards.clauses} clauses`);
  /* ---- THE VERBS WEAR THE STATUS CHIPS' CLOTHING ----
     These three used to pin the exact solid fills — emerald-600, red-600.
     e76ec83 deliberately replaced them: "The card verbs were solid emerald and
     red fills - a row of alarms on every card", so they became a tint
     background with tone text. The checks were not updated and have been red
     since.

     Re-pointed at what the soft wash must not cost, rather than at a hex code
     that may be retuned again. A wash has two failure modes a solid never had —
     it can stop being legible, and two washes can stop being tellable apart —
     and both are measured here. */
  const wash = (name, b, hue) => {
    if (!b) return check(`11 ${name} exists`, false);
    const [r, g] = b.bgv;
    check(`11 ${name} is a soft ${hue} wash, not a solid alarm`,
      Math.min(...b.bgv) > 200 && (hue === 'green' ? g > r : r > g),
      `${b.bg}`);
    /* The whole point of the tone text: a near-white tint with pale text on it
       is the way a soft wash goes wrong, and it goes wrong invisibly. */
    check(`11 ${name} stays legible on it`, b.contrast >= 4.5,
      `contrast ${b.contrast}:1 (${b.fg} on ${b.bg})`);
  };
  wash('Accept', cards.acc, 'green');
  wash('Reject', cards.rej, 'red');
  wash('Send', cards.send, 'green');
  /* And the two decisions must not read as the same button at a glance — the
     one thing a row of tints can lose that a row of solids could not. */
  check('11 Accept and Reject are tellable apart by hue',
    cards.acc && cards.rej
    && Math.abs((cards.acc.bgv[1] - cards.acc.bgv[0]) - (cards.rej.bgv[1] - cards.rej.bgv[0])) > 30,
    cards.acc && cards.rej ? `${cards.acc.bg} vs ${cards.rej.bg}` : 'missing');
  check('11 Edit is slate-200 on slate-800', cards.edit && cards.edit.bg === 'rgb(226, 232, 240)',
    cards.edit && `${cards.edit.bg} / ${cards.edit.fg}`);

  /* ---- 14. the card is a handle, not a second copy of the wording ----
     It used to carry the redline clamped to two lines, beside a document pane
     already showing the same words in full. The copy is gone; what has to hold
     is that the wording is still reachable and the card still points at it. */
  const delta = await page.evaluate(() => {
    const card = document.querySelector('#rl-changes .rl-card');
    const clause = document.querySelector('#rl-doc .rl-clause.is-changed .nego-body').textContent;
    const sq = s => s.replace(/\s+/g, ' ').trim();
    const phrase = sq(clause).split(' ').slice(3, 9).join(' ');
    return { noDiff: !document.querySelector('#rl-changes .rl-card-diff'),
      repeatsClause: phrase.length > 0 && sq(card.textContent).includes(phrase),
      marked: document.querySelectorAll('#rl-doc ins, #rl-doc del').length,
      caret: !!card.querySelector('[data-rl-caret]'),
      sample: sq(card.textContent).slice(0, 70) };
  });
  check('14 the card carries no copy of the wording', delta.noDiff && !delta.repeatsClause, delta.sample);
  check('14 and the document still marks it, so nothing was lost', delta.marked > 0, delta.marked);
  check('14 the card says it can fold', delta.caret);

  /* ---- 15. clause <-> card, both directions, with real scrolling ---- */
  const sync = await page.evaluate(async () => {
    const id = document.querySelector('#rl-changes [data-nego-card]').getAttribute('data-nego-card');
    const clause = document.querySelector(`#rl-doc [data-nego-card-anchor="${CSS.escape(id)}"]`);
    const card = document.querySelector(`#rl-changes [data-nego-card="${CSS.escape(id)}"]`);
    const docScroll = document.getElementById('nego-scroll-work');
    const colScroll = document.getElementById('nego-cards');
    const seen = (el, box) => {
      const b = el.getBoundingClientRect(), v = box.getBoundingClientRect();
      return b.top < v.bottom && b.bottom > v.top;
    };
    /* Both ends pushed out of sight first, so "it is on screen afterwards" is
       a fact about the scroll and not about a short document.

       Through scrollTo with behavior:'auto', not by assigning scrollTop: the
       pane carries scroll-behavior:smooth, which turns a plain assignment into
       an ANIMATION. Measured a moment later it had travelled 8px of 781, so
       the setup silently did nothing and the check that followed was reading a
       document that had never moved. And 'instant', not 'auto': 'auto' means
       "obey the stylesheet", which here says smooth — measured, the pane had
       travelled 8px of 781 while the card column beside it, which carries no
       scroll-behavior, had gone the whole way. */
    const top = el => el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
    top(docScroll); top(colScroll);
    await new Promise(r => setTimeout(r, 120));
    const hidBefore = { clause: !seen(clause, docScroll), card: !seen(card, colScroll) };

    card.click();
    await new Promise(r => setTimeout(r, 700));
    const fromCard = { clauseLit: clause.classList.contains('is-linked'),
      cardLit: card.classList.contains('is-linked'), clauseSeen: seen(clause, docScroll) };

    top(docScroll); top(colScroll);
    await new Promise(r => setTimeout(r, 120));
    clause.click();
    await new Promise(r => setTimeout(r, 700));
    const fromClause = { cardLit: card.classList.contains('is-linked'),
      cardSeen: seen(card, colScroll) };
    return { hidBefore, fromCard, fromClause,
      lit: document.querySelectorAll('#view-redline .is-linked').length };
  });
  check('15 both ends were genuinely out of view first',
    sync.hidBefore.clause && sync.hidBefore.card, JSON.stringify(sync.hidBefore));
  check('15 card -> contract lights both ends', sync.fromCard.clauseLit && sync.fromCard.cardLit);
  check('15 card -> contract scrolls the clause into view', sync.fromCard.clauseSeen);
  check('15 contract -> card lights and scrolls the card', sync.fromClause.cardLit && sync.fromClause.cardSeen);
  check('15 exactly one pair is lit', sync.lit === 2, `${sync.lit} elements`);

  /* ---- 13. the batch send ---- */
  const blast = await page.evaluate(() => {
    const b = document.querySelector('[data-rl-blast]');
    if (!b) return null;
    const s = getComputedStyle(b);
    const headBox = document.querySelector('.rl-head').getBoundingClientRect();
    return { text: b.textContent.replace(/\s+/g, ' ').trim(), bg: s.backgroundColor,
      anim: s.animationName, inHeader: b.getBoundingClientRect().top < headBox.bottom + 1,
      unsent: negoUnsentAsks(CONTRACT, 'owner').length };
  });
  check('13 the batch send is in the toolbar', !!blast && blast.inHeader);
  check('13 it counts the unsent drafts',
    !!blast && blast.text.indexOf(`(${blast.unsent})`) >= 0, blast && blast.text);
  check('13 it is animated', !!blast && blast.anim === 'rlBlast', blast && blast.anim);
  check('13 it is emerald-600', !!blast && blast.bg === 'rgb(5, 150, 105)', blast && blast.bg);

  /* ---- 9. two panes, one sidebar, one face at a time ----
     Measured as a RATIO of the grid's own width, which is what "two thirds"
     means; a rule that stops applying would show up here and nowhere else. */
  const panes = await page.evaluate(() => {
    const grid = document.getElementById('rl-grid');
    const vis = el => el.offsetParent !== null && el.getBoundingClientRect().width > 0;
    const w = () => ({ grid: grid.getBoundingClientRect().width,
      doc: document.getElementById('rl-doc').getBoundingClientRect().width,
      side: document.getElementById('rl-side').getBoundingClientRect().width,
      chg: vis(document.getElementById('rl-changes-col')),
      disc: vis(document.getElementById('rl-disc-col')) });
    const changes = w();
    rlSetSideMode('disc');
    const disc = w();
    rlSetSideMode('changes');
    return { changes, disc };
  });
  const ratio = (a, b) => a / b;
  check('9 the document takes two thirds of the row',
    Math.abs(ratio(panes.changes.doc, panes.changes.grid) - 2 / 3) < 0.04,
    ratio(panes.changes.doc, panes.changes.grid).toFixed(3));
  check('9 the one sidebar takes the other third',
    Math.abs(ratio(panes.changes.side, panes.changes.grid) - 1 / 3) < 0.04,
    ratio(panes.changes.side, panes.changes.grid).toFixed(3));
  check('9 changes mode shows the cards and not the discussion',
    panes.changes.chg && !panes.changes.disc, JSON.stringify(panes.changes));
  check('9 discussion mode shows the threads and not the cards',
    panes.disc.disc && !panes.disc.chg, JSON.stringify(panes.disc));
  check('9 the split does not move when the face flips',
    Math.abs(panes.disc.doc - panes.changes.doc) < 2,
    `${panes.changes.doc} vs ${panes.disc.doc}`);

  /* ---- 9b. the handle really drags the split ---- */
  const drag = await page.evaluate(async () => {
    const grid = document.getElementById('rl-grid');
    const rez = document.getElementById('rl-resizer');
    const before = document.getElementById('rl-doc').getBoundingClientRect().width;
    const r = rez.getBoundingClientRect();
    const x0 = r.left + r.width / 2, y = r.top + Math.min(200, r.height / 2);
    const fire = (type, x) => {
      const ev = new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
      (type === 'pointerdown' ? rez : window).dispatchEvent(ev);
    };
    fire('pointerdown', x0); fire('pointermove', x0 - 160); fire('pointerup', x0 - 160);
    await new Promise(res => requestAnimationFrame(res));
    const after = document.getElementById('rl-doc').getBoundingClientRect().width;
    rez.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await new Promise(res => requestAnimationFrame(res));
    const reset = document.getElementById('rl-doc').getBoundingClientRect().width;
    return { before, after, reset, gridW: grid.getBoundingClientRect().width };
  });
  check('9b dragging the handle narrows the document',
    drag.after < drag.before - 100, `${drag.before} -> ${drag.after}`);
  check('9b double-click puts the default split back',
    Math.abs(drag.reset - drag.before) < 8, `${drag.reset} vs ${drag.before}`);

  /* ---- 12. Edit lands on the clause ---- */
  const jump = await page.evaluate(async () => {
    const btn = document.querySelector('#rl-changes [data-rl-edit]');
    const id = btn.getAttribute('data-rl-edit');
    const clause = document.querySelector(`#rl-doc [data-clause="${CSS.escape(id)}"]`);
    const scroller = document.getElementById('nego-scroll-work');
    const seen = () => {
      const b = clause.getBoundingClientRect(), v = scroller.getBoundingClientRect();
      return b.top < v.bottom && b.bottom > v.top;
    };
    /* scrollTo with behavior:'instant', not scrollTop and not 'auto': the pane
       carries scroll-behavior:smooth, so an assignment animates and 'auto'
       defers to that same smooth — either way a measurement taken straight
       after reads a pane that has barely moved. */
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 120));
    /* Whether it WAS out of view is recorded rather than assumed: a document
       short enough to fit the column cannot scroll, and a check that demanded
       movement would fail on a contract with nothing wrong with it. What must
       hold either way is that the clause is on the screen afterwards. */
    const wasHidden = !seen();
    btn.click();
    await new Promise(r => setTimeout(r, 600));
    return { wasHidden, inView: seen(),
      lit: clause.classList.contains('rl-jump'),
      editing: !!clause.querySelector('[data-nego-editor]'),
      modals: document.querySelectorAll('#modal-root *').length };
  });
  check('12 Edit puts the clause on screen', jump.inView,
    jump.wasHidden ? 'it had scrolled out of view and came back' : 'the document fits the column');
  check('12 the clause says it has arrived', jump.lit);
  check('12 and the editor opens on the clause itself, inline', jump.editing);
  check('12 no modal was opened to do it', jump.modals === 0, jump.modals);
  await page.screenshot({ path: path.join(OUT, '02-edit-jump.png') });

  /* ---- 12b. AN OPEN EDITOR STILL READS AS THE DOCUMENT ----
     Reported with a screenshot (f144): the clause card came apart the moment
     Direct Edit opened on it. Every typographic rule for a clause body is
     written for .nego-body, and the editor REPLACES .nego-body with
     .nego-editing — so the wording lost its wrapping, its block spacing, its
     table width and its preformatted overflow all at once.

     This is the half that cannot be asserted from a stylesheet. f144 pins the
     rule-level claim (every .nego-body rule has a .nego-editing twin); these
     four are the box model, taken from the SAME clause before and after the
     editor opens, so each is a comparison rather than a magic number.

     And the hover row: :focus-within is what reveals it, a caret in the editor
     IS focus within the clause, and the row is absolutely positioned at
     bottom:-9px — right where the editor's own Save change / Cancel bar lands.
     It was painted over the two buttons the writer actually needed. */
  const dressed = await page.evaluate(async () => {
    const clause = [...document.querySelectorAll('#rl-doc .rl-clause[data-clause]')]
      .find(s => s.querySelector('[data-nego-edit]') && s.querySelector('.nego-body p'));
    const read = el => { const s = getComputedStyle(el);
      return { ws: s.whiteSpace, size: s.fontSize, lh: s.lineHeight }; };
    const before = read(clause.querySelector('.nego-body p'));
    clause.querySelector('[data-nego-edit]').click();
    await new Promise(r => setTimeout(r, 120));
    const ed = clause.querySelector('[data-nego-editor]');
    const after = read(ed.querySelector('p'));
    const w = el => Math.round(el.getBoundingClientRect().width);
    const tools = clause.querySelector('.rl-tools');
    const bar = clause.querySelector('.nego-edit-bar');
    const t = tools.getBoundingClientRect(), b = bar.getBoundingClientRect();
    return { before, after,
      /* Injected rather than looked for: the harness contract has no table or
         pre in a clause body, and the failure is about how the editor DRESSES
         them, not about whether this fixture happens to carry one. */
      blocks: (() => {
        ed.insertAdjacentHTML('beforeend',
          '<table><tbody><tr><td>BUYER</td><td>SUPPLIER</td></tr></tbody></table>'
          + '<pre>Name: [Authorised Officer]        Title: Procurement Director</pre>');
        const tbl = ed.querySelector('table'), pre = ed.querySelector('pre');
        return { tableW: w(tbl), editorW: w(ed),
          preOverflow: pre.scrollWidth - w(pre), preOx: getComputedStyle(pre).overflowX };
      })(),
      gap: getComputedStyle(ed.firstElementChild).marginBottom,
      toolsOpacity: getComputedStyle(tools).opacity,
      toolsPE: getComputedStyle(tools).pointerEvents,
      /* Recorded, not asserted: the row is still geometrically over the bar,
         and that is fine as long as it is invisible and takes no clicks. */
      overGeometrically: !(t.right < b.left || t.left > b.right || t.bottom < b.top || t.top > b.bottom) };
  });
  check('12b the wording wraps in the editor exactly as it does in the document',
    dressed.after.ws === dressed.before.ws && dressed.after.ws !== 'pre-wrap',
    `${dressed.before.ws} → ${dressed.after.ws}`);
  check('12b and is set at the same size and leading',
    dressed.after.size === dressed.before.size && dressed.after.lh === dressed.before.lh,
    `${dressed.before.size}/${dressed.before.lh} → ${dressed.after.size}/${dressed.after.lh}`);
  check('12b a table in the editor fills the clause',
    dressed.blocks.tableW === dressed.blocks.editorW,
    `${dressed.blocks.tableW} of ${dressed.blocks.editorW}px`);
  check('12b a preformatted block scrolls inside the clause rather than out of it',
    dressed.blocks.preOx === 'auto' && dressed.blocks.preOverflow <= 0,
    `overflow-x:${dressed.blocks.preOx}, spilling ${dressed.blocks.preOverflow}px`);
  check('12b the blocks keep the document\'s 9px between them',
    dressed.gap === '9px', dressed.gap);
  check('12b and the hover verbs stand down while the clause is being typed in',
    dressed.toolsOpacity === '0' && dressed.toolsPE === 'none',
    `opacity ${dressed.toolsOpacity}, pointer-events ${dressed.toolsPE}`
      + `, still over the Save bar: ${dressed.overGeometrically}`);
  await page.screenshot({ path: path.join(OUT, '02b-edit-dressed.png') });

  /* ---- 3 / 4 / 5. the Copilot route ---- */
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(250);
  const menu = await page.evaluate(async () => {
    /* The REAL entry: highlight words in a clause and release the mouse. The
       clause toolbar's AI Assist is gone — a selection is the one door, and
       this drives the same engine hook a person's drag does. */
    const para = document.querySelector('#rl-doc .rl-clause .nego-body p')
      || document.querySelector('#rl-doc .rl-clause p');
    const textNode = [...para.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim().length > 30)
      || para.firstChild;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, Math.min(28, textNode.nodeValue.length));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
    document.getElementById('nego-scroll-work').dispatchEvent(
      new MouseEvent('mouseup', { bubbles: true }));
    await new Promise(r => setTimeout(r, 60));
    const m = document.querySelector('.nego-selmenu');
    return { open: !!m,
      noToolbarAi: ![...document.querySelectorAll('#rl-doc .rl-tool')]
        .some(b => /AI Assist/.test(b.textContent)),
      items: m ? [...m.querySelectorAll('[data-nego-ai]')].map(b => b.textContent.trim()) : [],
      dialogs: document.querySelectorAll('.nego-aipop, .lab-aipop').length,
      modals: document.querySelectorAll('#modal-root *').length };
  });
  check('5 AI Assist is gone from the clause toolbar', menu.noToolbarAi);
  check('5 the selection menu offers exactly three actions', menu.items.length === 3,
    JSON.stringify(menu.items));
  /* "Edit with Copilot", not "Rephrase with Copilot": the first verb was
     renamed when the action learned to ADD wording as well as replace it, and
     rephrasing is now one of the things it does rather than the whole of it.
     This assertion still named the old label and had gone red unnoticed —
     browser checks were not run on every branch, which is exactly how a stale
     one survives a deliberate rename. (Since fixed both ways: the workflow now
     runs them on every push, and the failing item list is passed as the detail
     below, so a failure prints the menu rather than only the verdict — the one
     fact that tells "the label changed" from "the menu never opened".) */
  check('5 they are edit, shorten, tag',
    /Edit with Copilot/.test(menu.items[0] || '')
    && /Shorten & Simplify/.test(menu.items[1] || '')
    && /Tag with internal note/.test(menu.items[2] || ''),
    JSON.stringify(menu.items));
  /* A SEPARATE CLAIM, and worth its own check: not merely that the first item
     is Edit, but that Rephrase is nowhere. The rename could have been done as a
     fourth entry beside the old one, and two doors reading the same to anyone
     moving at speed is the failure this guards. */
  check('5 and rephrase is gone from the menu',
    !menu.items.some(t => /Rephrase/.test(t)), JSON.stringify(menu.items));
  check('3 opening the menu opens no dialog', menu.dialogs === 0 && menu.modals === 0);
  await page.screenshot({ path: path.join(OUT, '03-selection-menu.png') });

  const routed = await page.evaluate(async () => {
    const btn = [...document.querySelectorAll('.nego-selmenu [data-nego-ai]')]
      .find(b => b.getAttribute('data-nego-ai') === 'shorten');
    /* mousedown, as a pointer would deliver it: the selection-path menu acts
       before the mouseup that would collapse the selection under it. */
    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 700));
    const panel = document.getElementById('ai-panel');
    return { open: panel.classList.contains('open'), docked: panel.classList.contains('docked'),
      scrim: document.getElementById('ai-scrim').classList.contains('open'),
      card: !!document.querySelector('#ai-feed .ai-proposal'),
      dialogs: document.querySelectorAll('.nego-aipop').length,
      modals: document.querySelectorAll('#modal-root *').length,
      docVisible: document.getElementById('rl-doc').getBoundingClientRect().width > 200 };
  });
  check('4 the Copilot panel opens', routed.open);
  check('4 docked, with no scrim over the document', routed.docked && !routed.scrim);
  check('4 the document is still on screen beside it', routed.docVisible);
  check('3 the proposal is a card in the panel, not a popover', routed.card && routed.dialogs === 0,
    JSON.stringify({ card: routed.card, dialogs: routed.dialogs }));
  check('3 no modal anywhere on the redline route', routed.modals === 0, routed.modals);
  await page.screenshot({ path: path.join(OUT, '04-copilot-panel.png') });

  /* Tagging goes to the Discussion column, not to a dialog either. */
  const tagged = await page.evaluate(async () => {
    const ch = negoChanges(CONTRACT).find(x => x.status === 'pending');
    const ok = rlTagInternalNote({ c: CONTRACT, clauseId: ch.clauseId, text: 'thirty (30) days' });
    await new Promise(r => setTimeout(r, 120));
    const input = document.getElementById('nego-ti-' + ch.id);
    const pressed = [...document.querySelectorAll(`[data-nego-vis][data-for="${ch.id}"]`)]
      .filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.getAttribute('data-nego-vis'));
    return { ok, focused: document.activeElement === input, value: input ? input.value : '',
      inDiscussion: !!(input && input.closest('#rl-disc-col')), pressed,
      dialogs: document.querySelectorAll('.nego-aipop, .lab-notepop').length };
  });
  check('5 Tag lands in the Discussion column', tagged.ok && tagged.inDiscussion);
  check('5 with the internal switch pressed',
    tagged.pressed.length === 1 && tagged.pressed[0] === 'internal', JSON.stringify(tagged.pressed));
  check('5 the field is focused and carries the quote',
    tagged.focused && /thirty \(30\) days/.test(tagged.value), tagged.value);
  check('3 and it opened no dialog', tagged.dialogs === 0);
  await page.screenshot({ path: path.join(OUT, '05-tag-note.png') });

  await browser.close();
  srv.close();
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  console.log(`screenshots → ${path.relative(ROOT, OUT)}`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
