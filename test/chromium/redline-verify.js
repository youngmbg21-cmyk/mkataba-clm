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
   12b  an open editor is still dressed as the document it edits
   12c  the clause you landed on is not shrunk to a dropdown's width
    13  the batch send sits with the drafts it publishes, counted and animated
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

  /* ---- 1. the head rides on the tab row ---- */
  const head = await page.evaluate(() => {
    const el = document.querySelector('#view-redline .rl-head');
    const s = getComputedStyle(el);
    const row = document.querySelector('#view-redline .rl-tabrow');
    const acts = el.querySelector('.rl-actions');
    const last = acts && acts.lastElementChild;
    const rr = row.getBoundingClientRect(), hr = el.getBoundingClientRect();
    return { border: s.borderTopWidth, shadow: s.boxShadow, bg: s.backgroundColor,
      isQuiet: el.classList.contains('room-quiet'),
      hasShell: !!document.querySelector('#view-redline .rl-shell'),
      inRow: el.parentElement === row,
      lastInRow: row.lastElementChild === el,
      lastAct: last ? (last.matches('[data-redline-proxy]') ? 'publish' : last.className) : 'none',
      /* wrapped or not, nothing may hang off the right edge of the row */
      clipped: Math.round(hr.right) > Math.round(rr.right) + 1,
      wrapped: Math.round(hr.top) >= Math.round(rr.top) + 10 };
  });
  /* NO FRAME AT ALL, WHICH IS WHERE "one frame, not two" ENDED UP. The strip
     was frameless because a TITLE CARD sat above it; the card went, so it
     became the shared quiet bar. Now it is not a band either — the tab row's
     right-hand half stood empty above it, so the controls moved onto that row
     (Young, 10 Aug 2026) and the contract got the band of height back. A band's
     clothes here would be exactly the second frame this check has always been
     about. */
  check('1 head draws no frame of its own', head.border === '0px' && !head.isQuiet,
    `${head.border} quiet=${head.isQuiet}`);
  check('1 head has no card shadow', head.shadow === 'none', head.shadow);
  check('1 head sits at the right of the tab row, and the title card is gone',
    head.inRow && head.lastInRow && !head.hasShell,
    `inRow=${head.inRow} last=${head.lastInRow} shell=${head.hasShell}`);
  check('1 Publish Round is the far-right control', head.lastAct === 'publish', head.lastAct);
  /* Whether it wrapped here depends on this fixture's controls, and that is
     the point — the row wraps on content, not on a guessed width. What must
     never happen at any width is the controls running off the right edge. */
  check('1 and nothing hangs off the right edge', !head.clipped,
    `wrapped=${head.wrapped} clipped=${head.clipped}`);

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
      /* THE SHEET IS SCALED NOW (13 Aug 2026 — it is a fixed page inside a
         zoom wrapper, like the Document tab's), so any length read off it is
         in a different space from the column's. Reported so the checks below
         can normalise rather than quietly comparing two coordinate systems. */
      zoom: (() => { const w = paper.closest('.rl-zoom');
        return w ? (Number(getComputedStyle(w).zoom) || 1) : 1; })(),
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
  /* IT HAS A BORDER NOW, and that is the point of the 10 Aug 2026 design: the
     sheet is warm paper with a warm hairline round it, not white paper edged
     by shadow alone. A cream sheet with no edge on a slate page reads as a
     stain rather than as a page. */
  /* CLAIM LOOSENED, 13 Aug 2026, AND ONLY IN ITS UNITS. It asserted exactly
     '1px'. The sheet now sits inside a zoom layer, and a hairline on a scaled
     sheet no longer computes to a whole pixel — it is one CSS pixel of the
     PAGE, which is what a printed hairline is. What the check is for — that
     the sheet has an edge of its own rather than being defined by shadow
     alone, which reads as a stain on a slate page — is unchanged. */
  check('2 the sheet is warm paper with its own hairline',
    parseFloat(sheet.paperBorder) > 0, `${sheet.paperBorder} at zoom ${sheet.zoom}`);
  check('2 and it does carry that shadow', sheet.paperShadow !== 'none' && !!sheet.paperShadow,
    sheet.paperShadow);
  check('2 the sheet reads as paper against the column behind it',
    sheet.paperBg !== sheet.colBg, `${sheet.paperBg} on ${sheet.colBg}`);
  /* ---- CLAIM UPDATED, 13 Aug 2026, OWNER-ASKED ----
     This pinned the sheet to exactly 720px. Reported: on this page and on the
     counterparty's, dragging the divider wider bought MARGIN and not one more
     word of contract. The measure is still BOUNDED — that half of the old
     claim is the half that matters, and a sheet growing to the full width of
     a large monitor is unreadable for its own reason — but the bound is now
     62 × the contract's own type size, so it rises with the stepper. At the
     default 15px that is 930px.

     AND THE SECOND REVISION, the same day, is the one that matters. Letting
     the sheet grow gave more WORDS per line and not bigger words; the owner
     reported the feature still absent. The sheet is a fixed 660px page again
     and a zoom layer fits it to the column, exactly as the Document tab does —
     so at any ordinary width it FILLS the column rather than sitting inside
     it, and the wording grows and shrinks as the divider moves. The 2x
     ceiling is the Document tab's own and only bites on a very wide column;
     paper-grows-verify measures that separately. */
  check('2 the sheet FILLS its column, the way the Document tab does',
    sheet.paperWidth > 720 && sheet.paperWidth >= sheet.colWidth - 12
      && sheet.paperWidth <= sheet.colWidth + 1,
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
    const cls = [...document.querySelectorAll('#rl-doc .rl-clause')];
    const gaps = cls.slice(1).map((c, i) =>
      c.getBoundingClientRect().top - cls[i].getBoundingClientRect().bottom);
    const sheetEl = document.querySelector('#rl-doc .rl-paper');
    const paper = sheetEl.getBoundingClientRect();
    /* ---- READ THE SHEET IN ITS OWN SPACE ----
       The sheet is a fixed page inside a zoom wrapper now, so every length
       inside it arrives on screen multiplied. These claims are about the
       sheet's own proportions — its padding, the evenness of its clause gaps —
       so they are divided back out. Comparing a scaled padding against an
       unscaled threshold is comparing two coordinate systems. */
    const wrap = sheetEl.closest('.rl-zoom');
    const z = wrap ? (Number(getComputedStyle(wrap).zoom) || 1) : 1;
    return { left: Math.round(left - col.left), right: Math.round(col.right - right),
      colWidth: Math.round(col.width), paperWidth: Math.round(paper.width), zoom: z,
      padL: Math.round((left - paper.left) / z), padR: Math.round((paper.right - right) / z),
      textWidth: Math.round(right - left), gaps: gaps.map(g => Math.round(g / z)),
      toolRows: document.querySelectorAll('#rl-doc .rl-tools, #rl-doc .rl-tool').length };
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
  /* A floor, not an equality, and the arithmetic behind it moved on 13 Aug
     2026: the page is the Document tab's 660px now rather than 720, so the
     sheet's own 36px each side is 89.1% of it instead of 90%. The floor drops
     to match. What the check is for is untouched — it fails the moment
     anything reserves a FURTHER gutter inside the sheet, which is how the
     100px badge column got in the first time. */
  check('2b nothing is reserved inside the sheet beyond its own padding',
    inset.textWidth / inset.paperWidth >= 0.88,
    `${(inset.textWidth / inset.paperWidth * 100).toFixed(1)}% of the sheet`);
  /* REVERSED IN PLACE, 16 Aug 2026. Two checks here kept the hover toolbar
     honest — hidden at rest costing no height, revealed clickably on a real
     hover. The toolbar is retired (owner-asked: "no ability to make edits on
     the contract itself … All edits will happen on the side panel"), so what
     is measured now is its absence and the door that replaced it: the Edit
     pill, drawn without a hover because a hover-only door is an invisible
     affordance. */
  check('2b the clause tool row is gone from the paper',
    inset.toolRows === 0, `${inset.toolRows} tool elements found`);
  check('2b the gaps between clauses are even and tight',
    inset.gaps.every(g => g <= 20), JSON.stringify(inset.gaps));
  const pillAtRest = await page.evaluate(() => {
    const p = document.querySelector('#rl-doc .rl-cp-pill');
    if (!p) return null;
    const s = getComputedStyle(p);
    return { op: s.opacity, pe: s.pointerEvents };
  });
  check('2b the Edit pill stands in its place, visible without a hover',
    !!pillAtRest && pillAtRest.op === '1' && pillAtRest.pe !== 'none',
    pillAtRest ? `opacity ${pillAtRest.op}, pointer-events ${pillAtRest.pe}` : 'no pill');

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
    /* The card token (--rl-type) is retired with its last consumer, the
       clamped diff (16 Aug 2026) — the routing row's chrome sizes are
       literal, so the compact claim is measured off the head directly. */
    const meta = document.querySelector('#rl-changes .rl-card-meta');
    return { body: getComputedStyle(body).fontSize,
      cardScale: getComputedStyle(document.querySelector('.redline-page')).getPropertyValue('--rl-type').trim(),
      meta: meta ? getComputedStyle(meta).fontSize : null };
  });
  check('7 the contract body reads at the Doc page scale', type.body === '15px', type.body);
  check('7 the retired card token declares nothing', type.cardScale === '', type.cardScale || 'gone');
  /* 12px since the one-size bump (owner-asked 16 Aug 2026) — still smaller
     than the 15px contract body, which is the claim. */
  check('7 and the card head is set smaller still', type.meta === '12px', type.meta);

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
    /* WHAT IS ACTUALLY BEHIND THE TEXT, not what the element declares. An
       outline button's own background is transparent, so measuring its label
       against `rgba(0,0,0,0)` measures the label against black and reports a
       failure that is not on the screen. Walk up until something paints. */
    const painted = el => {
      for (let n = el; n; n = n.parentElement){
        const b = getComputedStyle(n).backgroundColor;
        if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) return b;
      }
      return 'rgb(255, 255, 255)';
    };
    const btn = sel => {
      const b = document.querySelector('#rl-changes ' + sel);
      if (!b) return null;
      const s = getComputedStyle(b);
      const paint = painted(b);
      const bg = rgb(s.backgroundColor), fg = rgb(s.color), pv = rgb(paint);
      const L1 = Math.max(lum(pv), lum(fg)), L2 = Math.min(lum(pv), lum(fg));
      return { bg: s.backgroundColor, fg: s.color, bgv: bg, fgv: fg, paint,
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
  /* ---- ONE FILL PER CARD, AND EVERY LABEL LEGIBLE ----
     Three equal washes became a primary and two outlines: accepting is what
     most cards are for, and Reject and Counter are the exceptions. What is
     measured is what that must not cost — every label still readable against
     what is actually behind it, and the yes and the no still tellable apart.
     Contrast is measured against the COMPOSITED background, because an
     outline button's own background is transparent and comparing text to
     `rgba(0,0,0,0)` measures nothing. */
  const legible = (name, b) => {
    if (!b) return check(`11 ${name} exists`, false);
    check(`11 ${name} stays legible`, b.contrast >= 4.5,
      `contrast ${b.contrast}:1 (${b.fg} on ${b.paint || b.bg})`);
  };
  legible('Accept', cards.acc);
  legible('Reject', cards.rej);
  legible('Send', cards.send);
  legible('Edit', cards.edit);
  check('11 Accept is the one filled button on the card',
    cards.acc && Math.min(...cards.acc.bgv) < 200
      && cards.rej && /rgba\(0, 0, 0, 0\)|transparent/.test(cards.rej.bg)
      && cards.edit && /rgba\(0, 0, 0, 0\)|transparent/.test(cards.edit.bg),
    cards.acc ? `${cards.acc.bg} / ${cards.rej && cards.rej.bg} / ${cards.edit && cards.edit.bg}` : 'missing');
  /* And the two decisions must not read as the same button at a glance. */
  check('11 Accept and Reject are tellable apart',
    cards.acc && cards.rej && cards.acc.fg !== cards.rej.fg,
    cards.acc && cards.rej ? `${cards.acc.fg} vs ${cards.rej.fg}` : 'missing');

  /* ---- 14. WORK BIG, RECEIPTS SMALL (claims reversed again 16 Aug 2026,
     owner-asked — Option 4). A card with a decision or a send on it carries a
     two-line greyed preview of its redline; a change that needs nothing is a
     one-line receipt with no copy and no verbs, so finished business stops
     costing card-height. The pop-out stays gone on both kinds. */
  const delta = await page.evaluate(() => {
    const working = [...document.querySelectorAll('#rl-changes .rl-card:not(.rl-receipt)')]
      .find(el => el.querySelector('.rl-card-verbs'));
    const wr = working && working.getBoundingClientRect();
    const base = {
      workingDiff: !!(working && working.querySelector('.rl-card-diff')),
      workingMeta: working ? (working.querySelector('.rl-card-meta') || { textContent: '' }).textContent.trim() : '',
      marked: document.querySelectorAll('#rl-doc ins, #rl-doc del').length,
      openBtn: !!(working && working.querySelector('.rl-open-btn[data-rl-cp-open]')),
      popBtn: !!document.querySelector('#rl-changes [data-rl-pop]'),
      body: !!document.querySelector('#rl-changes .rl-card-body'),
      workingH: wr ? Math.round(wr.height) : 0 };
    /* THE FIXTURE HOLDS NO SENT CHANGE, so the receipt state is STAGED — the
       owner's draft is handed over, measured, and the stamp put back exactly,
       so every later section reads the fixture it always read. */
    const n = CONTRACT.negotiation;
    const save = { turn: n.turn, turnAt: n.turnAt,
      ver: CONTRACT.versions.length, aud: CONTRACT.audit.length };
    negoHandOver(CONTRACT, { to: 'counterparty' });
    renderRedline();
    const receipt = document.querySelector('#rl-changes .rl-card.rl-receipt');
    const rr = receipt && receipt.getBoundingClientRect();
    const staged = {
      hasReceipt: !!receipt,
      receiptVerbs: receipt ? receipt.querySelectorAll('.rl-card-verbs button').length : -1,
      receiptDiff: receipt ? !!receipt.querySelector('.rl-card-diff') : null,
      receiptOpen: !!(receipt && receipt.querySelector('.rl-open-btn')),
      receiptH: rr ? Math.round(rr.height) : 0 };
    n.turn = save.turn; n.turnAt = save.turnAt;
    CONTRACT.versions.length = save.ver; CONTRACT.audit.length = save.aud;
    renderRedline();
    return Object.assign(base, staged);
  });
  check('14 a working card says what is being decided, clamped', delta.workingDiff);
  check('14 and names its clause', !!delta.workingMeta, delta.workingMeta);
  check('14 and the document still marks it, so nothing was lost', delta.marked > 0, delta.marked);
  check('14 the card carries Open — the door to the clause panel',
    delta.openBtn && !delta.popBtn && !delta.body);
  check('14 a change needing nothing is a one-line receipt — no verbs, no copy, Open kept',
    delta.hasReceipt && delta.receiptVerbs === 0 && delta.receiptDiff === false && delta.receiptOpen,
    `verbs ${delta.receiptVerbs}, diff ${delta.receiptDiff}`);
  check('14 and the receipt is really SMALL — under half a working card',
    delta.receiptH > 0 && delta.receiptH * 2 < delta.workingH,
    `receipt ${delta.receiptH}px vs working ${delta.workingH}px`);

  /* ---- 14b. OPEN RAISES THE CLAUSE PANEL; THE COLUMN DOES NOT MOVE ----
     The pop-out is retired (16 Aug 2026). Open flips the page's ONE clause
     panel, so opening a change's reading matter must still move nothing in
     the column, pressing the row must still only navigate, and hovering must
     still do nothing at all. */
  const pop = await page.evaluate(async () => {
    const settle = () => new Promise(r => setTimeout(r, 360));
    /* FOLLOWED BY ID, not by position: every press repaints the column. */
    const ID = document.querySelector('#rl-changes [data-nego-card]').getAttribute('data-nego-card');
    const card = () => document.querySelector(`#rl-changes [data-nego-card="${CSS.escape(ID)}"]`);
    const press = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const h = () => Math.round(card().getBoundingClientRect().height);
    const colH = () => Math.round(document.getElementById('rl-changes').scrollHeight);
    const panelOpen = () => !!document.querySelector('#rl-cp.is-open');
    const start = { h: h(), col: colH(), panel: panelOpen() };
    press(card().querySelector('.rl-open-btn')); await settle();
    const opened = { h: h(), col: colH(), panel: panelOpen() };
    press(card().querySelector('.rl-open-btn')); await settle();
    const closed = { panel: panelOpen() };
    /* Pressing the card itself navigates and opens nothing. */
    press(card().querySelector('.rl-card-head')); await settle();
    const afterHead = { panel: panelOpen() };
    /* And hovering does nothing at all — the peek has been gone for a while
       and must stay gone. */
    card().dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    card().dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await settle();
    const hovered = { panel: panelOpen() };
    return { start, opened, closed, afterHead, hovered };
  });
  check('14b nothing is popped out to begin with', !pop.start.panel, JSON.stringify(pop.start));
  check('14b Open raises the clause panel', pop.opened.panel, JSON.stringify(pop.opened));
  check('14b AND THE COLUMN DOES NOT MOVE — the whole point of the change',
    pop.opened.h === pop.start.h && pop.opened.col === pop.start.col,
    `card ${pop.start.h}→${pop.opened.h}px, column ${pop.start.col}→${pop.opened.col}px`);
  check('14b the same press closes it', !pop.closed.panel, JSON.stringify(pop.closed));
  check('14b pressing the card takes you to the clause and opens nothing',
    !pop.afterHead.panel, JSON.stringify(pop.afterHead));
  check('14b and hovering opens nothing — the peek is gone', !pop.hovered.panel);

  /* ---- 14c. THE NOTICES NEVER SIT ON THE CONTRACT ----
     "these pop ups should never appear on top of the contract. They can appear
     on the bottom right of the screen and have the ability to clear them off."
     Measured as geometry, which is the only way to prove it: a band above the
     sheet and a card floating over the corner are the same markup at different
     coordinates. */
  const notices = await page.evaluate(() => {
    const box = document.querySelector('.rl-notices');
    const sheet = document.querySelector('.rl-paper');
    const banner = document.getElementById('rl-banner');
    const out = { inBanner: !!(banner && banner.querySelector('.rv-banner, .dk-notice')) };
    if (!box) return { ...out, present: false };
    const n = box.getBoundingClientRect(), s = sheet.getBoundingClientRect();
    return { ...out, present: true,
      fixed: getComputedStyle(box).position === 'fixed',
      overlapsSheet: !(n.right < s.left || n.left > s.right || n.bottom < s.top || n.top > s.bottom),
      bottomRight: n.right > window.innerWidth * 0.6 && n.bottom > window.innerHeight * 0.6,
      clears: box.querySelectorAll('[data-rv-act="rv-clear"], [data-dk-clear], .rl-note-btn').length };
  });
  check('14c no notice is drawn as a band above the document', !notices.inBanner);
  if (notices.present){
    check('14c the notices float, bottom-right, clear of the sheet',
      notices.fixed && notices.bottomRight && !notices.overlapsSheet, JSON.stringify(notices));
    check('14c and every one of them can be cleared', notices.clears > 0, notices.clears);
  }

  /* ---- 15. clause <-> card, both directions, with real scrolling ---- */
  const sync = await page.evaluate(async () => {
    const id = document.querySelector('#rl-changes [data-nego-card]').getAttribute('data-nego-card');
    /* ---- RE-QUERIED AFTER EVERY PRESS, NEVER HELD ----
       Pressing a card's head both jumps AND toggles it, and the toggle
       repaints the column. A node captured before the press is detached
       afterwards: its class never changes and its rect is zero, so every
       assertion about it reads false for a reason that has nothing to do with
       the behaviour under test. Held nodes are how this check reported "the
       jump does not scroll" on a jump that worked. */
    const clauseEl = () => document.querySelector(`#rl-doc [data-nego-card-anchor="${CSS.escape(id)}"]`);
    const cardEl = () => document.querySelector(`#rl-changes [data-nego-card="${CSS.escape(id)}"]`);
    const docScroll = () => document.getElementById('nego-scroll-work');
    const colScroll = () => document.getElementById('nego-cards');
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
    /* PUSH IT OUT OF SIGHT, WHICHEVER END THAT MEANS. This scrolled to the
       bottom and assumed the clause was above the fold, which held only while
       the column's first card was the OLDEST change. The column now leads with
       what is still being argued about (rlCardSort), so the first card's clause
       can be near the foot of the document and scrolling down leaves it in
       view — the precondition silently failed and the check reported a working
       jump as broken. It tries the bottom, then the top. */
    const hideClause = async () => {
      top(docScroll());
      await new Promise(r => setTimeout(r, 120));
      if (!seen(clauseEl(), docScroll())) return;
      docScroll().scrollTo({ top: 0, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 120));
    };
    await hideClause(); top(colScroll());
    await new Promise(r => setTimeout(r, 120));
    const hidBefore = { clause: !seen(clauseEl(), docScroll()), card: !seen(cardEl(), colScroll()) };

    /* THE HEAD IS THE PRESS TARGET, not the article. A card is a toggle now
       (see 14b) and only its head carries the listener, so clicking the
       article does nothing at all — which is what this check was doing, and
       silently reporting as "the jump does not scroll". */
    cardEl().querySelector('.rl-card-head').click();
    await new Promise(r => setTimeout(r, 700));
    const fromCard = { clauseLit: clauseEl().classList.contains('is-linked'),
      cardLit: cardEl().classList.contains('is-linked'),
      clauseSeen: seen(clauseEl(), docScroll()) };

    await hideClause(); top(colScroll());
    await new Promise(r => setTimeout(r, 120));
    clauseEl().click();
    await new Promise(r => setTimeout(r, 700));
    const fromClause = { cardLit: cardEl().classList.contains('is-linked'),
      cardSeen: seen(cardEl(), colScroll()) };
    return { hidBefore, fromCard, fromClause,
      lit: document.querySelectorAll('#view-redline .is-linked').length };
  });
  /* ONLY THE CLAUSE HAS TO BE HIDDEN FIRST. It used to demand both ends, and
     the card end stopped being demandable when cards began arriving shut: a
     column of two-line cards does not fill its pane, so there is nowhere to
     push a card out of view TO. What the check is for is the document's jump,
     and that precondition still holds. */
  check('15 the clause was genuinely out of view first',
    sync.hidBefore.clause, JSON.stringify(sync.hidBefore));
  check('15 card -> contract lights both ends', sync.fromCard.clauseLit && sync.fromCard.cardLit);
  check('15 card -> contract scrolls the clause into view', sync.fromCard.clauseSeen);
  check('15 contract -> card lights and scrolls the card', sync.fromClause.cardLit && sync.fromClause.cardSeen);
  check('15 exactly one pair is lit', sync.lit === 2, `${sync.lit} elements`);

  /* ---- 13. the batch send ----
     RE-POINTED, AND WHY. This asserted `inHeader` — the batch send flashing in
     the page toolbar — and had been red ever since negoIndexSendHtml
     deliberately moved it. The header copy was a PROXY for the engine's own
     control at the head of the Tracked Changes column: two buttons for one act,
     and the pair crowded the toolbar until the contract picker clipped
     mid-word. The proxy was removed and its identity (same words, same count,
     same blast styling) moved onto the real control, beside the cards it
     publishes.

     So the check now asserts the send is where the DRAFTS are, which is the
     claim the product actually makes — and is written to be capable of failing
     both ways: it must be inside the Tracked Changes column, and it must NOT
     have come back in the header beside it. A check that only said "it exists
     somewhere" would have passed before the move and after it, which is how
     this one came to sit red for a fortnight without anybody learning
     anything from it. */
  const blast = await page.evaluate(() => {
    const b = document.querySelector('[data-rl-blast]');
    if (!b) return null;
    const s = getComputedStyle(b);
    const headBox = document.querySelector('.rl-head').getBoundingClientRect();
    const col = document.getElementById('rl-changes-col');
    const cards = document.getElementById('rl-changes');
    return { text: b.textContent.replace(/\s+/g, ' ').trim(), bg: s.backgroundColor,
      anim: s.animationName, inHeader: b.getBoundingClientRect().top < headBox.bottom + 1,
      inChangesCol: !!col && col.contains(b),
      /* IT IS NO LONGER SEEN AT ALL. The column's own copy of the batch send is
         gone (10 Aug 2026) and Publish Round on the toolbar is the one act;
         #nego-send survives clipped out of the layout because that proxy
         clicks it. So what is checked is that it is still IN the column (the
         proxy has something to press) and still out of the reader's way. */
      clippedAway: !!b.closest('.rl-sendslot-hidden'),
      headerCopies: document.querySelectorAll('.rl-head [data-rl-blast]').length,
      proxies: document.querySelectorAll('[data-redline-proxy="nego-send"]').length,
      toolbarProxy: !!document.querySelector('.rl-tabrow [data-redline-proxy="nego-send"]'),
      bandProxy: !!document.querySelector('.rl-unsent [data-redline-proxy="nego-send"]'),
      unsent: negoUnsentAsks(CONTRACT, 'owner').length };
  });
  check('13 the engine\'s send is mounted in the column, out of the way',
    !!blast && blast.inChangesCol && blast.clippedAway,
    blast && `in the column: ${blast.inChangesCol}, clipped: ${blast.clippedAway}`);
  /* CLAIM WIDENED, 15 Aug 2026 (OI-9): the change column gained a "N not sent"
     band whose Send is a SECOND DOOR onto this same postbox — the pattern the
     per-card Send already used. What is under test is unchanged and is the
     thing that matters: one transport, no duplicate BUTTON in the header, and
     every door pressing the engine's own send rather than opening a route of
     its own. */
  check('13 and every door onto it is a proxy — one transport, no header copy',
    !!blast && blast.headerCopies === 0 && blast.proxies >= 1,
    blast && `${blast.headerCopies} copies, ${blast.proxies} proxies`);
  check('13 the toolbar is one of them, the unsent band the other',
    !!blast && blast.toolbarProxy && blast.bandProxy,
    blast && `toolbar:${blast.toolbarProxy} band:${blast.bandProxy}`);
  /* ---- AND EVERY DOOR ACTUALLY REACHES THE POSTBOX (15 Aug 2026) ----
     The proxy click was wired by scanning #content at a point BEFORE the panes
     are mounted, so a proxy in the page shell got its handler and one painted
     into the mount got nothing. That was harmless while the toolbar was the
     only proxy and made "Send all N" a dead button the day the band arrived:
     the toolbar pressed the postbox once, the band pressed it zero times.
     Counted here rather than inferred, on BOTH doors, because "a handler is
     attached" and "the press lands" are different claims — and because a
     document-level listener kept alongside the old element-bound one would
     make each press land TWICE, which on a send is worse than not landing. */
  const presses = await page.evaluate(() => {
    const post = document.getElementById('nego-send');
    if (!post) return null;
    /* OBSERVED, NOT FIRED. Capturing on the postbox itself and stopping the
       event dead means the press is counted and the round is NOT published —
       without this the check sends for real, the share dialog opens, and the
       next check (no modal was opened) fails on this one's side effect. */
    let n = 0;
    const count = ev => { n++; ev.stopImmediatePropagation(); ev.preventDefault(); };
    post.addEventListener('click', count, true);
    const band = document.querySelector('.rl-unsent [data-redline-proxy]');
    const bar = document.querySelector('.rl-tabrow [data-redline-proxy]');
    if (band) band.click();
    const afterBand = n; n = 0;
    if (bar) bar.click();
    const afterBar = n;
    post.removeEventListener('click', count, true);
    return { afterBand, afterBar };
  });
  check('13 the band\'s Send reaches the postbox exactly once',
    !!presses && presses.afterBand === 1, presses && `${presses.afterBand} presses`);
  check('13 and so does the toolbar\'s — one each, never two',
    !!presses && presses.afterBar === 1, presses && `${presses.afterBar} presses`);
  check('13 it counts the unsent drafts',
    !!blast && blast.text.indexOf(`(${blast.unsent})`) >= 0, blast && blast.text);
  check('13 it is animated', !!blast && blast.anim === 'rlBlast', blast && blast.anim);
  check('13 it is emerald-600', !!blast && blast.bg === 'rgb(5, 150, 105)', blast && blast.bg);

  /* ---- 9. two panes, one sidebar, one face at a time ----
     Measured as a RATIO of the width THE SPLIT GOVERNS, which is what "two
     thirds" means; a rule that stops applying would show up here and nowhere
     else.

     That width used to be the whole grid, and stopped being it when the round's
     queue took a third column in front of the pair (f130). The rule is
     unchanged — the handle still deals the contract two thirds and the sidebar
     one — but the queue is not part of the deal, so measuring against the grid
     would report a broken split on a layout whose split is exactly right.
     Deliberately measured against doc+side rather than "grid minus 300": the
     queue's width is negotiable (it narrows to keep the contract's 720px
     measure), so subtracting a constant would be asserting a number this file
     has no business knowing. */
  const panes = await page.evaluate(() => {
    const grid = document.getElementById('rl-grid');
    const vis = el => el.offsetParent !== null && el.getBoundingClientRect().width > 0;
    const w = () => ({ grid: grid.getBoundingClientRect().width,
      doc: document.getElementById('rl-doc').getBoundingClientRect().width,
      side: document.getElementById('rl-side').getBoundingClientRect().width,
      /* the width the drag handle actually deals out */
      split: document.getElementById('rl-doc').getBoundingClientRect().width
        + document.getElementById('rl-side').getBoundingClientRect().width,
      chg: vis(document.getElementById('rl-changes-col')),
      /* The Discussion face is gone (10 Aug 2026) — nothing can be flipped to
         and nothing can hide the cards. Reported rather than measured, so a
         column reappearing would fail here rather than pass quietly. */
      disc: !!document.getElementById('rl-disc-col'),
      modeTabs: document.querySelectorAll('[data-rl-mode]').length });
    const changes = w();
    rlSetSideMode('disc');
    const after = w();
    return { changes, after };
  });
  const ratio = (a, b) => a / b;
  check('9 the document takes two thirds of the row',
    Math.abs(ratio(panes.changes.doc, panes.changes.split) - 2 / 3) < 0.04,
    ratio(panes.changes.doc, panes.changes.split).toFixed(3));
  check('9 the one sidebar takes the other third',
    Math.abs(ratio(panes.changes.side, panes.changes.split) - 1 / 3) < 0.04,
    ratio(panes.changes.side, panes.changes.split).toFixed(3));
  check('9 there is one face, and it is the cards',
    panes.changes.chg && !panes.changes.disc && !panes.changes.modeTabs,
    JSON.stringify(panes.changes));
  check('9 nothing can flip it away — an old stored preference included',
    panes.after.chg && !panes.after.disc, JSON.stringify(panes.after));
  check('9 and the split does not move when it is asked to',
    Math.abs(panes.after.doc - panes.changes.doc) < 2,
    `${panes.changes.doc} vs ${panes.after.doc}`);

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
      lit: clause.classList.contains('rl-arrived'),
      editing: !!clause.querySelector('[data-nego-editor]'),
      modals: document.querySelectorAll('#modal-root *').length };
  });
  check('12 Edit puts the clause on screen', jump.inView,
    jump.wasHidden ? 'it had scrolled out of view and came back' : 'the document fits the column');
  check('12 the clause says it has arrived', jump.lit);
  /* REVERSED IN PLACE, 16 Aug 2026: this pressed the same button and required
     the engine's inline editor OPEN ON THE CLAUSE. The owner has closed that
     surface — "no ability to make edits on the contract itself … All edits
     will happen on the side panel" — so the card's Edit keeps its navigation
     half (a card is a handle on a passage) and an editor appearing on the
     paper would now be the fault. The panel's ＋ is where writing starts, and
     12b below drives that door for real. */
  check('12 and NO editor opens on the clause — writing moved to the panel', !jump.editing);
  check('12 no modal was opened to do it', jump.modals === 0, jump.modals);
  await page.screenshot({ path: path.join(OUT, '02-edit-jump.png') });

  /* ---- 12b. AN OPEN EDITOR STILL READS AS THE WORDING IT REPLACED ----
     Reported with a screenshot (f144): the clause came apart the moment the
     editor opened on it — the wording lost its wrapping, its block spacing,
     its table width and its preformatted overflow all at once, because the
     editor's .nego-editing rules had no twin for the body's.

     RE-STAGED IN THE PANEL, 16 Aug 2026. The editor used to open on the
     clause (Direct Edit); that door is retired — no edits on the paper, all
     writing through the panel — so the same claims are now measured where the
     editor actually opens: the ＋ replaces the panel's "As it stands" block,
     and the wording must arrive in the editor wearing the block's own dress.
     The old "hover verbs stand down while typing" check went with the hover
     verbs themselves. */
  const dressed = await page.evaluate(async () => {
    if (!document.querySelector('.redline-page .rl-cp.is-open')){
      const pill = document.querySelector('#rl-doc [data-rl-cp-open]');
      if (pill) pill.click();
    }
    await new Promise(r => setTimeout(r, 120));
    const body = document.querySelector('#rl-cp .rl-cp-src.is-on');
    const read = el => { const s = getComputedStyle(el);
      return { ws: s.whiteSpace, size: s.fontSize, lh: s.lineHeight }; };
    const before = read(body.querySelector('.rl-cp-stands p') || body.querySelector('.rl-cp-stands'));
    body.querySelector('[data-rl-cp-edit]').click();
    await new Promise(r => setTimeout(r, 120));
    const ed = document.querySelector('#rl-cp [data-nego-editor]');
    if (!ed) return { none: true };
    const after = read(ed.querySelector('p') || ed);
    const w = el => Math.round(el.getBoundingClientRect().width);
    return { before, after,
      /* Injected rather than looked for: the harness contract has no table or
         pre in a clause body, and the failure is about how the editor DRESSES
         them, not about whether this fixture happens to carry one. */
      blocks: (() => {
        ed.insertAdjacentHTML('beforeend',
          '<table><tbody><tr><td>BUYER</td><td>SUPPLIER</td></tr></tbody></table>'
          + '<pre>Name: [Authorised Officer]        Title: Procurement Director</pre>');
        const tbl = ed.querySelector('table'), pre = ed.querySelector('pre');
        /* Against the CONTENT box: the panel's editor wears its own 9px/11px
           padding (the clause's never did), and a table at width:100% fills
           the box inside it. */
        const s = getComputedStyle(ed);
        const contentW = Math.round(ed.getBoundingClientRect().width
          - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)
          - parseFloat(s.borderLeftWidth) - parseFloat(s.borderRightWidth));
        return { tableW: w(tbl), editorW: contentW,
          preOverflow: pre.scrollWidth - w(pre), preOx: getComputedStyle(pre).overflowX };
      })() };
  });
  check('12b the ＋ opens the editor over "As it stands"', !dressed.none,
    dressed.none ? 'no editor arrived in the panel' : 'editor in the panel');
  if (!dressed.none){
    check('12b the wording wraps in the editor exactly as it did in the block it replaced',
      dressed.after.ws === dressed.before.ws && dressed.after.ws !== 'pre-wrap',
      `${dressed.before.ws} → ${dressed.after.ws}`);
    check('12b and is set at the same size and leading',
      dressed.after.size === dressed.before.size && dressed.after.lh === dressed.before.lh,
      `${dressed.before.size}/${dressed.before.lh} → ${dressed.after.size}/${dressed.after.lh}`);
    check('12b a table in the editor fills its box',
      Math.abs(dressed.blocks.tableW - dressed.blocks.editorW) <= 2,
      `${dressed.blocks.tableW} of ${dressed.blocks.editorW}px`);
    check('12b a preformatted block scrolls inside the box rather than out of it',
      dressed.blocks.preOx === 'auto' && dressed.blocks.preOverflow <= 0,
      `overflow-x:${dressed.blocks.preOx}, spilling ${dressed.blocks.preOverflow}px`);
  }
  await page.screenshot({ path: path.join(OUT, '02b-edit-dressed.png') });

  /* ---- 12c. THE CLAUSE YOU LANDED ON IS STILL A CLAUSE ----
     Reported from the field with a screenshot, and invisible to every check
     above: pressing Edit on a Tracked Changes card put `rl-jump` on the clause
     to flash it, and `rl-jump` was ALSO the toolbar contract picker's class.
     `.redline-page .rl-jump` is two classes, so the clause inherited a select's
     dress — max-width:calc(220px + 9ch), overflow:hidden, white-space:nowrap,
     11px mono — and collapsed to 285px inside a 626px sheet with its heading
     clipped mid-word. It stuck until the next repaint.

     Measured as a COMPARISON against the clause's own width a moment earlier,
     so it cannot be satisfied by a magic number, and the two properties that
     did the damage are named individually — a future collision that brings
     back only `max-width` would otherwise hide inside a width that happens to
     match. */
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(250);
  const landed = await page.evaluate(async () => {
    const btn = document.querySelector('#rl-changes [data-rl-edit]');
    const id = btn.getAttribute('data-rl-edit');
    const clause = document.querySelector(`#rl-doc [data-clause="${CSS.escape(id)}"]`);
    const w = el => Math.round(el.getBoundingClientRect().width);
    const before = w(clause);
    btn.click();
    await new Promise(r => setTimeout(r, 700));
    const s = getComputedStyle(clause);
    const h = clause.querySelector('.rl-clause-h');
    return { before, after: w(clause), maxWidth: s.maxWidth, overflowX: s.overflowX,
      headWrap: h ? getComputedStyle(h).whiteSpace : null,
      /* The flash still has to happen — the whole point of the class. */
      lit: clause.classList.contains('rl-arrived') };
  });
  check('12c landing on a clause does not shrink it',
    landed.after === landed.before, `${landed.before} -> ${landed.after}px`);
  check('12c and does not hand it a dropdown\'s clamp or clipping',
    landed.maxWidth === 'none' && landed.overflowX === 'visible',
    `max-width:${landed.maxWidth}, overflow-x:${landed.overflowX}`);
  check('12c the heading still wraps rather than being cut off',
    landed.headWrap === 'normal', landed.headWrap);
  check('12c and the clause still says it has arrived', landed.lit);

  /* ---- 3 / 4 / 5. the Copilot route ---- */
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(250);
  /* ---- REVERSED IN PLACE, 19 Aug 2026 ---- this staged the paper's own
     highlight and measured the three-item menu that followed. The owner has
     taken editing off the contract itself: "there should not be possibility to
     edit the contract while on the contract in the left hand side. Only way to
     edit is to click edit and the edit happens in the panel on the right."

     So the paper's door is proved SHUT here, and the route that replaced it —
     the clause panel's Copilot button, which hands the whole clause over — is
     what drives the rest of this section. Everything below it is unchanged and
     still measured: the panel opens, docked, with no scrim, no dialog and the
     contract still on screen. (The narrowed menu the panel's own editor offers
     on a highlight is f210's and clause-door-verify's.) */
  const menu = await page.evaluate(async () => {
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
      selected: String(sel.toString() || '').trim().length,
      noToolbar: document.querySelectorAll('#rl-doc .rl-tool, #rl-doc [data-nego-ai-clause]').length === 0,
      items: m ? [...m.querySelectorAll('[data-nego-ai]')].map(b => b.textContent.trim()) : [],
      dialogs: document.querySelectorAll('.nego-aipop, .lab-aipop').length,
      modals: document.querySelectorAll('#modal-root *').length };
  });
  check('5 no clause carries a Copilot button — and no menu follows a highlight',
    menu.noToolbar && !menu.open, `menu ${menu.open}, items ${JSON.stringify(menu.items)}`);
  check('5 but the wording still selects, so it can still be copied',
    menu.selected > 3, `${menu.selected} characters selected`);
  check('3 and a highlight opens no dialog either', menu.dialogs === 0 && menu.modals === 0);
  await page.screenshot({ path: path.join(OUT, '03-selection-menu.png') });

  const routed = await page.evaluate(async () => {
    /* THE ROUTE THAT REPLACED IT: the Edit pill raises the clause panel, and
       the panel's Copilot button hands the whole clause over. Two real presses,
       the same two a person makes. */
    document.querySelector('#rl-doc .rl-clause .rl-cp-pill').click();
    await new Promise(r => setTimeout(r, 400));
    const btn = document.querySelector('#rl-cp .rl-cp-src.is-on [data-nego-ai-clause]');
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 700));
    const panel = document.getElementById('ai-panel');
    return { open: panel.classList.contains('open'), docked: panel.classList.contains('docked'),
      scrim: document.getElementById('ai-scrim').classList.contains('open'),
      card: !!document.querySelector('#ai-feed .ai-proposal'),
      feed: (document.querySelector('#ai-feed') || {}).childElementCount || 0,
      quoted: /Edit with Copilot|clause/i.test(
        (document.querySelector('#ai-feed') || {}).textContent || ''),
      dialogs: document.querySelectorAll('.nego-aipop').length,
      modals: document.querySelectorAll('#modal-root *').length,
      docVisible: document.getElementById('rl-doc').getBoundingClientRect().width > 200 };
  });
  check('4 the Copilot panel opens', routed.open);
  check('4 docked, with no scrim over the document', routed.docked && !routed.scrim);
  check('4 the document is still on screen beside it', routed.docVisible);
  /* ---- RE-POINTED 19 Aug 2026 ---- the old route pressed Simplify, a one-shot
     action that comes back with a proposal. The panel's Copilot button carries
     the EDIT action, which is conversational by design: it asks what the edit
     is for and spends nothing until it is told. So what is measured is what
     that route must deliver — the exchange lands IN the docked panel, and no
     popover opens over the document. */
  check('3 the hand-over lands in the panel, not in a popover',
    routed.feed > 0 && routed.dialogs === 0,
    JSON.stringify({ card: routed.card, dialogs: routed.dialogs }));
  check('3 no modal anywhere on the redline route', routed.modals === 0, routed.modals);
  await page.screenshot({ path: path.join(OUT, '04-copilot-panel.png') });

  /* Tagging is gone (Young, 03 Aug 2026) — the shortcut that opened the
     Discussion composer pre-set to internal was removed with the reason-on-
     the-change work. What must hold now is its absence, plus the thing the
     old check was really guarding: each silent change still has its own
     thread starter in the Discussion column. */
  const tagGone = await page.evaluate(() => {
    const ch = negoChanges(CONTRACT).find(x => x.status === 'pending');
    rlSetSideMode('disc');
    return { fnGone: typeof window.rlTagInternalNote !== 'function',
      noteBtns: document.querySelectorAll('[data-rl-note]').length,
      starter: !!document.getElementById('nego-ti-' + ch.id) };
  });
  check('5 the tag shortcut is gone', tagGone.fnGone && tagGone.noteBtns === 0,
    JSON.stringify({ fnGone: tagGone.fnGone, noteBtns: tagGone.noteBtns }));
  check('5 and the change can still be talked about', tagGone.starter);

  await browser.close();
  srv.close();
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  console.log(`screenshots → ${path.relative(ROOT, OUT)}`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
