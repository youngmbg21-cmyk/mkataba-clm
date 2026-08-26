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
  /* ---- CLAIM REVERSED IN PLACE 22 Aug 2026 ----
     Publish Round moved onto the head's own line beside the title, on the
     owner's ask off the design mock-up, where it LEADS the verb group instead
     of ending the control row. So this row's last control is the way OUT —
     the line reads left to right as what you are looking at, then how, then
     where else you could go. */
  check('1 the way out of this negotiation ends the row',
    /rl-livelist/.test(head.lastAct), head.lastAct);
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
  /* ---- CLAIM REVERSED IN PLACE, 22 Aug 2026 (owner-approved render) ----
     The shadow was there so a cream sheet FLOATING on a slate page read as a
     page rather than a stain. The sheet does not float any more: it fills its
     column edge to edge, and the render draws it flat. What made the shadow
     necessary — an edge of its own — is the hairline asserted directly above,
     which is untouched and is now doing the whole job. */
  check('2 and it is FLAT — a sheet that fills its column has nothing to float above',
    sheet.paperShadow === 'none' || !sheet.paperShadow, sheet.paperShadow);
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
     reported the feature still absent. The sheet was made a fixed 660px page
     again with a zoom layer fitting it to the column, exactly as the Document
     tab does.

     ---- AND THE THIRD, 22 Aug 2026, with the owner-approved render: the
     magnification is GONE and the sheet is FLUID, capped at RL_SHEET_MAX
     (860px, .rl-paper's own rule) and centred past it. So "fills its column"
     is true up to that cap and deliberately false beyond it — a line of an
     agreement past 860px stops being readable, and the reader's own A⁻/A⁺
     stepper is what changes the size of the words now.
     THE CAP STARTED BITING ON AN ORDINARY WINDOW the same day, when the
     working area's page inset went 48 → 24 to close the dead strip beside the
     change column (owner-reported): the doc track gained those pixels and at
     1500 it is 916 against a sheet of 860. That is the surplus going to the
     contract side and turning into margin beside a centred page, which is what
     the owner chose. So the claim is now the BOUND plus the centring, and the
     centring check below — which was already the regression net for a sheet
     pinned to one side — is what carries the weight. */
  check('2 the sheet fills its column up to its readable measure, then stops',
    sheet.paperWidth > 720
      && (sheet.paperWidth >= sheet.colWidth - 12 || Math.round(sheet.paperWidth) === 860)
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
  /* 40 -> 60, 22 Aug 2026: the render's sheet margin is 56px (it was 36), and
     this is a CEILING on a one-sided gutter rather than a claim about the
     margin itself. The lopsidedness it exists to catch — the engine's 100px
     badge column landing on one side — is 100px and still fails it. */
  check('2b the text sits on the sheet\'s own padding, not a reserved gutter',
    inset.padL <= 60 && Math.abs(inset.padL - inset.padR) <= 2,
    `${inset.padL}px / ${inset.padR}px inside the sheet`);
  /* A floor, not an equality, and the arithmetic behind it has moved twice.
     13 Aug 2026: the page became the Document tab's 660px rather than 720, so
     36px each side was 89.1% instead of 90%. 22 Aug 2026: the sheet is FLUID
     and its margin is the render's 56px, so on a 660-wide column the text is
     about 83% of it and on a wide one rather more. The floor drops to match.
     What the check is for is untouched — it fails the moment anything reserves
     a FURTHER gutter inside the sheet, which is how the 100px badge column got
     in the first time. */
  check('2b nothing is reserved inside the sheet beyond its own padding',
    inset.textWidth / inset.paperWidth >= 0.84,
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
  /* THE CLAIM IS THE RELATION, NOT THE NUMBER, and it is asserted as one now.
     This read 12px, then 13 after the platform-wide one-step type lift (22 Aug
     2026, owner-asked from the design's scale) — and pinning the literal made a
     test about HIERARCHY fail for a reason that had nothing to do with
     hierarchy. What matters is that the card's furniture stays smaller than the
     contract's own words, so the paper reads as the content and the column as
     the apparatus. */
  check('7 and the card head is set smaller still than the contract body',
    parseFloat(type.meta) < parseFloat(type.body),
    `card ${type.meta} vs contract ${type.body}`);

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

  /* ---- 14. THE CARD SAYS WHAT IS BEING DECIDED, AND THE BANDS SORT THE PILES
     (claims reversed in place 25 Aug 2026, the owner's own drawing of this
     column, which supersedes Option 4 of 16 Aug).

     WHAT OPTION 4 SETTLED and how the drawing answers the same question:
       · "a card must say what is being decided" — it did that with a two-line
         greyed preview of the redline; the card says it in the change's own
         SUMMARY now, in bold, on its own line. .rl-card-diff is STALE;
       · "finished business must stop costing card-height" — it did that by
         shrinking a change that needs nothing to a one-line receipt; the four
         BANDS do it now, so a reader skips a whole pile by skipping a heading.
         .rl-receipt is the COUNTERPARTY's shape and is measured on their seat;
       · "the pop-out stays gone" — unchanged, and still asserted here;
       · "the card carries a door onto the clause panel" — unchanged, and it is
         a row in the card's ⋯ menu rather than a button on the face. */
  const delta = await page.evaluate(() => {
    const working = [...document.querySelectorAll('#rl-changes .rl-card')]
      .find(el => el.querySelector('.rl-card-verbs'));
    const wr = working && working.getBoundingClientRect();
    const base = {
      workingSum: working ? (working.querySelector('.rl-card-sum') || { textContent: '' }).textContent.trim() : '',
      workingDiff: !!(working && working.querySelector('.rl-card-diff')),
      workingMeta: working ? (working.querySelector('.rl-card-meta') || { textContent: '' }).textContent.trim() : '',
      marked: document.querySelectorAll('#rl-doc ins, #rl-doc del').length,
      moreBtn: !!(working && working.querySelector('.rl-more-btn')),
      openRow: !!(working && working.querySelector('.rl-more-menu [data-rl-cp-open]')),
      popBtn: !!document.querySelector('#rl-changes [data-rl-pop]'),
      body: !!document.querySelector('#rl-changes .rl-card-body'),
      workingH: wr ? Math.round(wr.height) : 0 };
    /* THE FIXTURE HOLDS NO SENT CHANGE, so the sent state is STAGED — the
       owner's draft is handed over, measured, and the stamp put back exactly,
       so every later section reads the fixture it always read. */
    const n = CONTRACT.negotiation;
    const save = { turn: n.turn, turnAt: n.turnAt,
      ver: CONTRACT.versions.length, aud: CONTRACT.audit.length };
    negoHandOver(CONTRACT, { to: 'counterparty' });
    renderRedline();
    const bands = [...document.querySelectorAll('#rl-changes .rl-band')]
      .map(el => el.getAttribute('data-rl-band'));
    /* EVERY CARD SITS UNDER THE BAND THAT IS TRUE OF IT — read by walking the
       column in DOCUMENT ORDER, which is the only way the claim means
       anything: a heading that repeats, or a card under the wrong heading, is
       exactly what a rank-ordered list would produce. */
    let cur = null; let wrong = 0; const seen = [];
    for (const el of document.querySelectorAll('#rl-changes .rl-band, #rl-changes .rl-card')){
      if (el.classList.contains('rl-band')){
        cur = el.getAttribute('data-rl-band');
        if (seen.includes(cur)) wrong++;
        seen.push(cur);
      } else if (!cur) wrong++;
    }
    const sentCard = [...document.querySelectorAll('#rl-changes .rl-card')]
      .find(el => !el.querySelector('[data-rl-send]') && el.querySelector('.rl-badge'));
    const staged = {
      bands, bandRepeats: wrong,
      sentSendable: sentCard ? !!sentCard.querySelector('[data-rl-send]') : null,
      sentDiff: sentCard ? !!sentCard.querySelector('.rl-card-diff') : null,
      receipt: !!document.querySelector('#rl-changes .rl-card.rl-receipt') };
    n.turn = save.turn; n.turnAt = save.turnAt;
    CONTRACT.versions.length = save.ver; CONTRACT.audit.length = save.aud;
    renderRedline();
    return Object.assign(base, staged);
  });
  check('14 a working card says what is being decided', !!delta.workingSum, delta.workingSum);
  check('14 and not as a second copy of the paper', !delta.workingDiff);
  check('14 and names its clause', !!delta.workingMeta, delta.workingMeta);
  check('14 and the document still marks it, so nothing was lost', delta.marked > 0, delta.marked);
  check('14 the card carries a ⋯ whose menu opens the clause panel',
    delta.moreBtn && delta.openRow && !delta.popBtn && !delta.body);
  check('14 the column is banded, and every band is drawn once',
    delta.bands.length > 0 && delta.bandRepeats === 0,
    `${delta.bands.join(' / ')} · out of place ${delta.bandRepeats}`);
  check('14 a sent ask cannot be sent again, and carries no second copy',
    delta.sentSendable === false && delta.sentDiff === false,
    `send ${delta.sentSendable}, diff ${delta.sentDiff}`);
  check('14 and the receipt shape has left our seat with it', !delta.receipt);

  /* ---- 14a. THE COLUMN'S OWN HEAD, AS PIXELS (owner-asked 25 Aug 2026) ----
     The heading names the column and carries the total; the three-way cut is
     LABELLED beside it, because a dropdown reading "All (6)" says what it is
     set to and not what it is about. Both are measured as painted boxes rather
     than read out of the markup: a label that resolves to nothing, or one that
     wraps off the row, is exactly what a source read cannot see. */
  const idxHead = await page.evaluate(() => {
    const box = el => { if (!el) return null; const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left),
               mid: Math.round(r.top + r.height / 2), text: el.textContent.trim() }; };
    return { title: box(document.querySelector('.rl-idx-title')),
             open: box(document.querySelector('.rl-idx-open')),
             label: box(document.querySelector('.rl-idx-fk')),
             filter: box(document.querySelector('#rl-cardfilter')),
             cards: document.querySelectorAll('#rl-changes [data-nego-card]').length };
  });
  check('14a the column names itself and carries the total',
    idxHead.title && idxHead.title.w > 0
      && new RegExp(`\\(${idxHead.cards}\\)`).test(idxHead.title.text),
    idxHead.title && `${idxHead.title.text} · ${idxHead.cards} cards`);
  check('14a and the old name is gone',
    idxHead.title && !/change index/i.test(idxHead.title.text));
  check('14a the filter wears a visible label',
    idxHead.label && idxHead.label.w > 0 && idxHead.label.text.length > 0,
    idxHead.label && idxHead.label.text);
  check('14a to the LEFT of the control it labels, on the same line',
    idxHead.label && idxHead.filter
      && idxHead.label.x < idxHead.filter.x
      && Math.abs(idxHead.label.mid - idxHead.filter.mid) <= 4,
    idxHead.label && idxHead.filter
      ? `label x${idxHead.label.x}/mid${idxHead.label.mid} vs filter x${idxHead.filter.x}/mid${idxHead.filter.mid}`
      : 'missing');

  /* ---- 14b. THE ⋯ MENU RAISES THE CLAUSE PANEL; THE COLUMN DOES NOT MOVE ----
     The pop-out is retired (16 Aug 2026) and the door moved into the card's ⋯
     menu (25 Aug 2026, the owner's drawing). Opening a change's reading matter
     must still move nothing in the column, pressing the row must still only
     navigate, and hovering must still do nothing at all.

     THE MENU IS PRESSED FIRST AND ITS ROW IS MEASURED AS PIXELS, because a row
     reached straight out of hidden markup proves the handler and not the door:
     f180's rule is that a verb has to be visible, and for a menu that means
     the ⋯ is on the face and the row is on screen once it is pressed. */
  const pop = await page.evaluate(async () => {
    const settle = () => new Promise(r => setTimeout(r, 360));
    /* FOLLOWED BY ID, not by position: every press repaints the column. */
    const ID = document.querySelector('#rl-changes [data-nego-card]').getAttribute('data-nego-card');
    const card = () => document.querySelector(`#rl-changes [data-nego-card="${CSS.escape(ID)}"]`);
    const press = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const shown = el => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    };
    const door = () => {
      press(card().querySelector('.rl-more-btn'));
      return card().querySelector('.rl-more-menu [data-rl-cp-open]');
    };
    const h = () => Math.round(card().getBoundingClientRect().height);
    const colH = () => Math.round(document.getElementById('rl-changes').scrollHeight);
    const panelOpen = () => !!document.querySelector('#rl-cp.is-open');
    const start = { h: h(), col: colH(), panel: panelOpen(),
      menuShut: !shown(card().querySelector('.rl-more-menu [data-rl-cp-open]')) };
    const d1 = door();
    const rowVisible = shown(d1);
    press(d1); await settle();
    const opened = { h: h(), col: colH(), panel: panelOpen(), rowVisible };
    press(door()); await settle();
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
  check('14b nothing is popped out to begin with, and the menu is shut',
    !pop.start.panel && pop.start.menuShut, JSON.stringify(pop.start));
  check('14b the ⋯ reveals a real row — visible pixels, not hidden markup',
    pop.opened.rowVisible);
  check('14b and it raises the clause panel', pop.opened.panel, JSON.stringify(pop.opened));
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
      /* Publish Round moved to the head's line on 22 Aug 2026; it is the same
         proxy onto the same postbox, so this looks for it in either place. */
      toolbarProxy: !!document.querySelector(
        '.room-acts [data-redline-proxy="nego-send"], .rl-tabrow [data-redline-proxy="nego-send"]'),
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
  check('13 the head\'s Publish Round is one of them, the unsent band the other',
    !!blast && blast.toolbarProxy && blast.bandProxy,
    blast && `head:${blast.toolbarProxy} band:${blast.bandProxy}`);
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
    const bar = document.querySelector('.room-acts [data-redline-proxy]')
      || document.querySelector('.rl-tabrow [data-redline-proxy]');
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
    const ed = document.getElementById('clause-editor');
    const stands = ed && ed.querySelector('#ce-stands');
    return { editor: !!ed,
      rail: !!(ed && ed.querySelector('.ce-rail')),
      wording: stands ? stands.innerText.replace(/\s+/g, ' ').trim().length : 0,
      lane: (ed && ed.querySelector('#ce-lane')) ? ed.querySelector('#ce-lane').childElementCount : 0,
      panelHeld: !!document.querySelector('#rl-cp.is-open'),
      dialogs: document.querySelectorAll('.nego-aipop').length,
      modals: document.querySelectorAll('#modal-root *').length };
  });
  /* ---- REVERSED IN PLACE 25 Aug 2026 ---- the destination moved. This route
     used to open the Copilot DRAWER — a chat about a clause you cannot see —
     and since f245 it opens the clause EDITOR: a page about that one clause,
     with the wording as it stands above the wording being proposed and Copilot
     down a third of it. Every claim this block was really making is kept and
     re-pointed: the hand-over is straight, nothing pops over the document, no
     modal is involved, and the clause's own wording is on screen beside it. */
  check('4 the clause editor opens', routed.editor);
  check('4 with its Copilot rail beside the wording', routed.rail && routed.wording > 20,
    `${routed.wording} characters of standing wording`);
  check('4 and the clause panel is still standing behind it', routed.panelHeld);
  check('3 the hand-over lands on the page, not in a popover',
    routed.lane > 0 && routed.dialogs === 0,
    JSON.stringify({ lane: routed.lane, dialogs: routed.dialogs }));
  check('3 no modal anywhere on the redline route', routed.modals === 0, routed.modals);
  await page.screenshot({ path: path.join(OUT, '04-copilot-panel.png') });
  /* CLOSED AGAIN: it is a fixed layer over the whole window, and every check
     below this point measures pixels it would otherwise be covering. */
  await page.evaluate(() => { if (window.rlCloseClauseEditor) rlCloseClauseEditor(); });
  await new Promise(r => setTimeout(r, 300));

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

  /* ---- 6. ONE FILLED ACT, AND THE OTHERS ARE COLOURED WORDS ----
     THE HISTORY IS WHY THIS CHECK EXISTS AT ALL, so it is kept whole.
     A CSS rule that loses on specificity is the visual twin of a guard that is
     always false: no error, no warning, and the stylesheet reads as though the
     thing were implemented. MEASURED 22 Aug 2026: ".redline-page
     .rl-card-verbs button" sets border:0 and scores (0,2,1), so the bare
     ".redline-page .rl-rej" outline the stylesheet's own comment described —
     "the no and the alternative recede to an outline" — had never once drawn.
     Reject and Edit had been bare coloured words beside a filled Accept for as
     long as they had existed, and f89 read the declaration and passed on it
     throughout.

     REVERSED IN PLACE THE SAME DAY, owner-reported off the mock-up's own card:
     "for the cards, the bottom buttons do not have lines around them". Its
     .h-btn carries `border:1px solid transparent` and only Open (ghost) and
     Send (filled) show an edge — so the accident was what the design wanted
     and the intention was not. The border is gone deliberately now; the
     three-class selectors stay, so a future edge would actually draw.

     WHAT IS ASSERTED THEREFORE FLIPPED, AND THE CHECK DID NOT MOVE: still a
     COMPUTED-STYLE read, still the only place either the old fault or this
     decision can be seen, because the rule is present and correct in the
     source either way and only the browser can say which declaration won. The
     INK is what carries these two now and it is asserted here — with no
     border, a verb that lost its colour would be indistinguishable from a
     caption, which is the 17 Aug furniture lesson. */
  const verbs = await page.evaluate(() => {
    const g = (sel) => { const e = document.querySelector(sel); if (!e) return null;
      const cs = getComputedStyle(e);
      return { w: parseFloat(cs.borderTopWidth) || 0, col: cs.borderTopColor,
               ink: cs.color, bg: cs.backgroundColor }; };
    return { acc: g('.rl-card-verbs .rl-acc'), rej: g('.rl-card-verbs .rl-rej'),
             edit: g('.rl-card-verbs .rl-edit') };
  });
  /* ---- REVERSED IN PLACE AGAIN, 25 Aug 2026, against the design reference ----
     24 Aug's owner ruling — "all the buttons should have a similar border line
     like share and more have in the platform right now" — was about the HEAD
     ROW, and applying it to the change rows was the wrong precedent. The
     reference draws these verbs as BARE COLOURED WORDS, and three bordered
     buttons on a 460px row are what crushed the reference line and the summary
     the row exists to show. So on OUR seat the line goes and the FILL stays
     gone; the counterparty's card and every head row are untouched, which is
     what the scoping to .rl-card-d buys.

     THIS IS STILL THE ONLY PLACE THE QUESTION CAN BE ASKED, which is why the
     claim is reversed here rather than deleted: the rule is present and
     correct in the source whichever way it goes, and only a browser can say
     which declaration won. The INK claim is untouched and is now doing ALL the
     work — with neither a line nor a fill, a verb that lost its colour would
     be indistinguishable from a caption, which is the 17 Aug furniture
     lesson. */
  for (const [k, label, ink] of [['acc', 'Accept', /rgb\(17, 94, 89\)/],
                                 ['rej', 'Reject', /rgb\(185, 28, 28\)/],
                                 ['edit', 'Edit', /rgb\(15, 118, 110\)/]]) {
    const v = verbs[k];
    check(`6 ${label} is a bare word — no line, no fill`,
      !!v && v.w === 0 && v.bg === 'rgba(0, 0, 0, 0)', JSON.stringify(v));
    check(`6 ${label} still carries its own ink, so it is not a caption`,
      !!v && ink.test(v.ink || ''), JSON.stringify(v && v.ink));
  }

  /* ---- 16. THE QUEUE DOOR IS ONE LINE, AND SHORTER (owner-reported 24 Aug
         2026: "the highlighted words in this rounds queue should not wrap text
         and the strip should be shorter") ----
     The door is a VERTICAL tab, so its line runs down the page and the label
     broke into two columns of text whenever the working area was short, growing
     the strip a second track to hold them. THE CLAIM IS THE GUARANTEE, not a
     height: the label may never wrap at any window size, which is what
     white-space:nowrap buys, and it is asked by counting the LINE BOXES the
     text really paints — a range over the text node returns one rect per line,
     which is the only way to ask "did this wrap" without knowing the height. */
  await page.evaluate(() => { document.querySelector('[data-rl-read="marks"]').click(); });
  await pause(300);
  const rail = await page.evaluate(() => {
    const tab = document.querySelector('.rl-q-tab');
    const k = tab && tab.querySelector('.rl-q-tab-k');
    const n = tab && tab.querySelector('.rl-q-tab-n');
    if (!tab || !k) return null;
    const lines = el => { const r = document.createRange(); r.selectNodeContents(el);
      return r.getClientRects().length; };
    const h = el => el ? Math.round(el.getBoundingClientRect().height) : 0;
    /* every direct child, the chevron included — the strip's height is its
       contents plus the padding and the gaps, and it is the padding that was
       trimmed */
    const content = [...tab.children].reduce((a, e) => a + h(e), 0);
    return { lines: lines(k), ws: getComputedStyle(k).whiteSpace,
      tab: h(tab), label: h(k), count: h(n), content };
  });
  check('16 the queue label paints on one line, never two',
    rail && rail.lines === 1, rail && `${rail.lines} line(s)`);
  check('16 and it cannot wrap at any window size',
    rail && rail.ws === 'nowrap', rail && rail.ws);
  /* SHORTER, AS A RELATION: the strip is its contents plus padding, and the
     padding is what was trimmed — so it must not exceed them by much. */
  check('16 the strip is no taller than what it carries',
    rail && rail.tab - rail.content <= 34,
    rail && `${rail.tab}px for ${rail.content}px of content`);

  /* ---- 17. A READING IS NOT A WORKING POSTURE (owner-asked 24 Aug 2026) ----
     "Remove the strip from the top of the contract in both as agreed and with
     changes pages. Beyond that, remove the ability to edit in those pages and
     grey out the change index card ... which should indicate that to make any
     edits they need to go back to redline page."
     Measured on the OWNER's bench, in both non-default readings, because the
     fault would be a control that looks alive and decides a change against a
     document the reader is not being shown. */
  const readings = {};
  for (const mode of ['agreed', 'proposed']){
    await page.evaluate(m => { document.querySelector(`[data-rl-read="${m}"]`).click(); }, mode);
    await pause(400);
    readings[mode] = await page.evaluate(() => {
      const pane = document.getElementById('rl-changes-col');
      const cs = pane && getComputedStyle(pane);
      const strip = document.querySelector('.rl-idx-reading');
      const seen = el => { if (!el) return false; const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
      return {
        band: !!document.getElementById('rl-read-note'),
        pills: document.querySelectorAll('.rl-cp-pill').length,
        greyed: !!document.querySelector('.rl-side.is-reading'),
        opacity: cs ? Number(cs.opacity) : 1,
        inert: cs ? cs.pointerEvents : 'auto',
        cards: document.querySelectorAll('#rl-changes .rl-card').length,
        stripSeen: seen(strip),
        /* the way out must be OUTSIDE the inert pane, or it is a button
           nobody can press */
        backLive: (() => { const b = document.querySelector('.rl-tabrow [data-rl-read="marks"]');
          return !!b && getComputedStyle(b).pointerEvents !== 'none'
            && !b.closest('#rl-changes-col'); })(),
      };
    });
  }
  for (const mode of ['agreed', 'proposed']){
    const r = readings[mode];
    check(`17 ${mode}: the band across the top of the contract is gone`, !r.band);
    check(`17 ${mode}: no clause offers an edit`, r.pills === 0, `${r.pills} pencils`);
    check(`17 ${mode}: the change column is greyed`,
      r.greyed && r.opacity < 1, `opacity ${r.opacity}`);
    check(`17 ${mode}: and it really refuses the press, not merely dims`,
      r.inert === 'none', r.inert);
    check(`17 ${mode}: the cards still draw, so the round's shape is readable`,
      r.cards > 0, `${r.cards} cards`);
    /* REVERSED IN PLACE 24 Aug 2026 (WO-14, owner-asked: "Just delete the
       strip for now"). The STRIP of words went; the GREYING above stayed,
       and it is the half that carries the claim — a column that refuses the
       press is a column that has said a reading cannot be acted on.
       THE WAY BACK IS NOT LOST, which is the condition on removing it: the
       three reading tabs are drawn on every paint, they are where the reader
       pressed to get here, and the strip's own button was a proxy for them.
       Measured for the same two properties as before — pressable, and outside
       the inert pane. */
    check(`17 ${mode}: the strip of words is gone (WO-14)`, !r.stripSeen);
    check(`17 ${mode}: and the way back is pressable, outside the inert pane`, r.backLive);
  }
  /* AND THE WAY BACK REALLY WORKS — pressed for real, not inferred. */
  await page.evaluate(() => { document.querySelector('.rl-tabrow [data-rl-read="marks"]').click(); });
  await pause(500);
  const back = await page.evaluate(() => ({
    mode: window.rlReadMode(),
    greyed: !!document.querySelector('.rl-side.is-reading'),
    pills: document.querySelectorAll('.rl-cp-pill').length,
    inert: getComputedStyle(document.getElementById('rl-changes-col')).pointerEvents }));
  check('17 pressing it lands back on the redline, with the column live again',
    back.mode === 'marks' && !back.greyed && back.pills > 0 && back.inert !== 'none',
    JSON.stringify(back));

  /* ================================================================
     18. FOUR OFF FOUR SCREENSHOTS OF THIS COLUMN (owner-asked 26 Aug 2026)
     ----------------------------------------------------------------
     ALL OF IT IS MEASURED IN A BROWSER because all of it is a computed value
     or a geometry: whether a rule is uppercase, how thick a ring paints, which
     way a menu opened, and whether pressing one thing moved another. jsdom
     resolves no cascade and lays nothing out, so it can answer none of them.
     ================================================================ */

  /* THE CLAUSE PANEL IS SHUT FIRST, and that is not housekeeping. Section 16
     leaves it open, it is an overlay sitting in the cards column's own grid
     track, and every press below lands on the cards underneath it — the run
     failed here first with Playwright reporting the panel "intercepts pointer
     events". Shut through the app's own setter rather than by pressing
     Escape, so this does not quietly become a test of the key handler. */
  await page.evaluate(() => {
    if (typeof window.rlCpSetShown === 'function') window.rlCpSetShown(document, null);
    document.querySelectorAll('.rl-cp.is-open').forEach(el => el.classList.remove('is-open'));
  });
  await pause(350);

  /* ---- 18a. "Whose asks" is a label, not a signpost ----
     It wore this product's micro-caps — 11px uppercase with .09em — a few
     pixels from "Tracked changes (N)" in sentence case, so the smaller of the
     two was the louder. PINNED AS A RELATION against the title beside it, not
     as a number, so a later type pass costs no edit here. */
  const fk = await page.evaluate(() => {
    const l = document.querySelector('#view-redline .rl-idx-fk');
    const t = document.querySelector('#view-redline .rl-idx-title');
    if (!l || !t) return null;
    const ls = getComputedStyle(l), ts = getComputedStyle(t);
    return { tf: ls.textTransform, size: ls.fontSize, tsize: ts.fontSize,
      track: ls.letterSpacing, text: l.textContent.trim(),
      painted: l.getBoundingClientRect().height > 0 };
  });
  check('18a the whose-asks label is drawn', !!fk && fk.painted, fk && fk.text);
  check('18a it is not shouted in capitals', fk && fk.tf === 'none', fk && fk.tf);
  check('18a and it is set like the title beside it, not smaller',
    fk && fk.size === fk.tsize, fk && `${fk.size} vs title ${fk.tsize}`);

  /* ---- 18b. the ⋯ menu carries no head ----
     It named the change — "CHG-001 · PAYMENT TERMS" — repeating two facts the
     card three centimetres to the left already carries. The NAME is still owed
     to a reader who cannot see the card, so the button's accessible name is
     checked in the same breath: removing the head must not remove the fact. */
  const moreBtn = '#rl-changes .rl-card-d .rl-more-btn';
  const menuShape = await page.evaluate(sel => {
    const b = document.querySelector(sel);
    if (!b) return null;
    const card = b.closest('[data-nego-card]');
    return { head: !!b.parentElement.querySelector('.rl-more-head'),
      aria: b.getAttribute('aria-label') || '',
      id: card.getAttribute('data-nego-card') };
  }, moreBtn);
  check('18b the dropdown has no header', menuShape && !menuShape.head);
  check('18b and the ⋯ still names its change to a screen reader',
    menuShape && menuShape.aria.includes(menuShape.id), menuShape && menuShape.aria);

  /* ---- 18c. pressing the ⋯ lights the card AND takes you to the clause ----
     "Merely selecting the 3 dots ... should also highlight the card and take
     you to the clause in the contract not only clicking the card." Measured as
     the PAPER ACTUALLY MOVING, not as a class appearing: is-linked could be set
     by a handler that never scrolls, and the ask is about arriving at the
     clause. */
  await page.evaluate(() => {
    document.querySelectorAll('.is-linked').forEach(n => n.classList.remove('is-linked'));
    const d = document.getElementById('rl-doc');
    if (d) d.scrollTop = 0;
  });
  await pause(200);
  await page.click(moreBtn);
  await pause(900);
  const pressed = await page.evaluate(sel => {
    const b = document.querySelector(sel);
    const card = b.closest('[data-nego-card]');
    const id = card.getAttribute('data-nego-card');
    const clause = document.querySelector(`#rl-doc [data-nego-card-anchor~="${id}"]`);
    const doc = document.getElementById('rl-doc');
    const menu = b.parentElement.querySelector('.rl-more-menu');
    return { cardLit: card.classList.contains('is-linked'),
      clauseLit: !!(clause && clause.classList.contains('is-linked')),
      menuOpen: menu && !menu.hidden,
      scrolled: doc ? doc.scrollTop : -1 };
  }, moreBtn);
  check('18c pressing the ⋯ highlights its own card', pressed && pressed.cardLit);
  check('18c and lights the clause it belongs to on the paper', pressed && pressed.clauseLit);
  check('18c and the menu is open at the same time — one press, both jobs',
    pressed && pressed.menuOpen);
  await page.screenshot({ path: path.join(OUT, '18-more-menu.png'), fullPage: false });

  /* ---- 18d. the selected card's ring is visible but faint ----
     It was 2px of solid accent plus a matching border — the heaviest object on
     a column that is flat rows on one surface. PINNED AS A RELATION: one pixel
     rather than two, and no second mark beside it. The colour is deliberately
     NOT pinned to a literal — accent is what says "this and that are one thing
     shown twice", and that must survive a palette pass. */
  const ring = await page.evaluate(() => {
    const el = document.querySelector('#rl-changes .rl-card.is-linked');
    if (!el) return null;
    /* MEASURED ON ONE CARD, TOGGLED — never against a neighbour. A first pass
       compared this card's border to some other row's and reported a
       difference that was only its POSITION in the list: these rows are
       separated by hairlines, so the first row and a middle row legitimately
       carry different edges. Comparing an element with itself is the only
       reading of "selecting it changes nothing but the ring". */
    const read = () => { const s = getComputedStyle(el);
      return { shadow: s.boxShadow, top: s.borderTopWidth, bottom: s.borderBottomWidth,
        left: s.borderLeftWidth, right: s.borderRightWidth, col: s.borderTopColor }; };
    const on = read();
    el.classList.remove('is-linked');
    const off = read();
    el.classList.add('is-linked');
    /* The spread is the FOURTH length in "rgb(...) 0px 0px 0px 1px" — the first
       is offset-x and reading that reports 0 whatever the ring is doing. */
    const lens = (on.shadow.match(/(-?\d+(?:\.\d+)?)px/g) || []).map(parseFloat);
    return { on, off, spread: lens.length >= 4 ? lens[3] : null };
  });
  check('18d the selected card is marked at all',
    ring && ring.on.shadow !== 'none' && ring.off.shadow !== ring.on.shadow,
    ring && ring.on.shadow);
  check('18d but faintly — one pixel of ring, not two',
    ring && ring.spread !== null && ring.spread > 0 && ring.spread <= 1,
    ring && `spread ${ring.spread}px`);
  check('18d and the ring is the ONLY mark — selecting moves no border',
    ring && ['top', 'bottom', 'left', 'right', 'col'].every(k => ring.on[k] === ring.off[k]),
    ring && `borders ${ring.on.top}/${ring.on.bottom} unchanged, colour ${ring.on.col}`);

  /* ---- 18e. the menu is never clipped, and drops UP at the bottom ----
     "The dropdown always has to be fully visible. If you are at the bottom of
     the page then the dropdown should drop up." Driven on the LAST card in the
     column, scrolled to the bottom, which is the state that produced the
     report. What is asserted is the requirement itself — every row inside the
     menu is within its scroller — rather than the mechanism, because flipping
     up is only one of the two ways to satisfy it and a short window needs the
     other. */
  const lastMore = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('#rl-changes .rl-card-d .rl-more-btn')];
    const b = btns[btns.length - 1];
    if (!b) return false;
    b.closest('[data-nego-card]').scrollIntoView({ block: 'end' });
    b.setAttribute('data-probe-last', '1');
    return true;
  });
  check('18e there is a last card with a menu to test', lastMore);
  if (lastMore) {
    await pause(400);
    await page.click('[data-probe-last]');
    await pause(500);
    const fit = await page.evaluate(() => {
      const b = document.querySelector('[data-probe-last]');
      const menu = b.parentElement.querySelector('.rl-more-menu');
      if (!menu || menu.hidden) return { open: false };
      const m = menu.getBoundingClientRect();
      let host = null;
      for (let el = b.parentElement; el && el !== document.body; el = el.parentElement){
        const cs = getComputedStyle(el);
        if (/auto|scroll|hidden/.test(cs.overflowY + ' ' + cs.overflow)
            && el.scrollHeight > el.clientHeight + 1){ host = el; break; }
      }
      const bound = host ? host.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };
      const rows = [...menu.querySelectorAll('.rl-more-row, .rl-more-verbs button')];
      const lastRow = rows.length ? rows[rows.length - 1].getBoundingClientRect() : null;
      return { open: true, up: menu.classList.contains('rl-more-up'),
        overflowsBottom: +(m.bottom - bound.bottom).toFixed(1),
        overflowsTop: +(bound.top - m.top).toFixed(1),
        scrolls: menu.scrollHeight > menu.clientHeight + 1,
        lastRowInside: lastRow ? lastRow.bottom <= m.bottom + 1 : true,
        rows: rows.length };
    });
    check('18e the last card\'s menu opens', fit.open);
    check('18e and it is not cut off by the column it hangs in',
      fit.open && fit.overflowsBottom <= 1 && fit.overflowsTop <= 1,
      fit.open ? `over bottom ${fit.overflowsBottom}px, over top ${fit.overflowsTop}px`
        + (fit.up ? ' (dropped up)' : ' (dropped down)') : '');
    check('18e every choice in it is reachable — nothing hidden below the fold',
      fit.open && (fit.lastRowInside || fit.scrolls),
      fit.open ? `${fit.rows} rows${fit.scrolls ? ', scrolls inside itself' : ''}` : '');
  }

  await browser.close();
  srv.close();
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  console.log(`screenshots → ${path.relative(ROOT, OUT)}`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
