/* Chromium verification of the negotiation history screen.
   ============================================================
   THE GAP THIS CLOSES. f120 and f121 prove the timeline's behaviour — the
   right events in the right order, filters that combine, labels read as they
   were at the time, tamper-detection that names the first broken record — and
   all of it in jsdom, which has no layout engine. jsdom can prove an event is
   PRESENT. It cannot prove it is VISIBLE. The Playwright check was deferred
   from Session 14 to Session 20 and recorded as still open at the close of
   Stage 9.

   That is not a theoretical gap in this product. The counterparty's workbench
   shipped with every test green while rendering 419px wide against the owner's
   925px — caught only when test/chromium/parity-verify.js was built to look.
   A long chronological list with a filter bar over it is the likeliest thing
   here to repeat it, and the first run of this harness found that it had:
   the screen asks for 820px and openModal was capping it at its 32rem default.

   Every number printed below is measured from getBoundingClientRect or
   getComputedStyle in a real browser, never read out of a stylesheet.

     1  the screen gets the width it asks for
     2  one scrolling container, not two nested
     3  no control in the filter bar is clipped or out of its row
     4  nothing overflows the panel sideways
     5  every event is drawn, and none of them collapsed to nothing
     6  the redlines inside events wrap instead of scrolling
     7  the page behind the modal does not scroll
     8  Verify integrity writes a visible verdict
     9  filtering redraws the screen and keeps it whole
    10  a narrow window still fits

   Screenshots go to test/chromium/shots/timeline/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'timeline');
const ROOT = path.join(__dirname, '..', '..');
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

const MEASURE = () => {
  const q = s => document.querySelector(s);
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top),
      bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) }; };
  const ht = q('#history-timeline');
  const panel = q('.modal-in');
  const scrolls = el => !!el && el.scrollHeight > el.clientHeight + 1;
  /* WHAT THE COMPONENT ASKED FOR, read off the element rather than written
     down here — so the check follows the design if the design changes, and
     fails only when the width is UNREACHABLE rather than merely different. */
  const asked = ht ? parseFloat(getComputedStyle(ht).maxWidth) : 0;
  return {
    ok: !!(ht && panel),
    count: ht ? Number(ht.getAttribute('data-count')) : -1,
    ht: box(ht), panel: box(panel),
    asked: Number.isFinite(asked) ? Math.round(asked) : 0,
    /* Two boxes with overflow-y:auto inside one another is a scrollbar inside
       a scrollbar: the reader's wheel acts on whichever the pointer is over. */
    scrollers: [panel, ht].filter(scrolls).length,
    rows: document.querySelectorAll('.ht-ev').length,
    emptyRows: Array.from(document.querySelectorAll('.ht-ev'))
      .filter(el => el.getBoundingClientRect().height < 8).length,
    /* Anything drawn past the panel's own right edge is off the screen or
       under a scrollbar the reader has to find. */
    outside: (() => {
      if (!panel) return [];
      const pr = panel.getBoundingClientRect();
      return Array.from(ht ? ht.querySelectorAll('*') : [])
        .filter(el => { const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > pr.right + 1 || r.left < pr.left - 1); })
        .slice(0, 6).map(el => el.tagName.toLowerCase() + '.' + (el.className || '').toString().slice(0, 24));
    })(),
    clipped: Array.from(document.querySelectorAll('.ht-filters select, .ht-filters button, .ht-f span'))
      .filter(el => el.scrollWidth > el.clientWidth + 1)
      .map(el => (el.textContent || el.value || '').trim().slice(0, 30)),
    /* A filter control sitting outside the bar that is supposed to hold it. */
    strayControls: (() => {
      const bar = q('.ht-filters'); if (!bar) return 0;
      const br = bar.getBoundingClientRect();
      return Array.from(bar.querySelectorAll('select, button')).filter(el => {
        const r = el.getBoundingClientRect();
        return r.right > br.right + 1 || r.bottom > br.bottom + 1;
      }).length;
    })(),
    wideRedlines: Array.from(document.querySelectorAll('.ht-redline'))
      .filter(el => el.scrollWidth > el.clientWidth + 1).length,
    redlines: document.querySelectorAll('.ht-redline').length,
    pageH: document.documentElement.scrollHeight,
    pageW: document.documentElement.scrollWidth,
    winH: window.innerHeight, winW: window.innerWidth,
    verdict: (() => { const v = q('#ht-verify-result');
      if (!v) return null; const r = v.getBoundingClientRect();
      return { h: Math.round(r.height), text: (v.textContent || '').trim().slice(0, 60) }; })(),
  };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/timeline.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(350);

  const m = await page.evaluate(MEASURE);
  await page.screenshot({ path: path.join(OUT, '01-history.png') });

  if (!m.ok){
    check('0 the history screen mounts at all', false, JSON.stringify(m));
    console.log('\n0/1 checks passed'); await browser.close(); srv.close(); process.exit(1);
  }
  check('0 the history screen mounts, with every event on it',
    m.rows > 0 && m.rows === m.count, `${m.rows} rows, data-count ${m.count}`);

  /* ---- 1. THE WIDTH IT ASKS FOR ----
     The check the deferral was hiding. A component whose declared max-width
     cannot be reached is one drawn inside a container that overrules it —
     which is how a screen designed at 820px shipped at 510. */
  const reach = m.asked ? m.ht.w / m.asked : 0;
  check('1 the screen reaches the width it asks for',
    m.asked > 0 && reach >= 0.95 && m.winW > m.asked + 80,
    `asks ${m.asked}px, gets ${m.ht.w}px (${Math.round(reach * 100)}%) in a ${m.winW}px window`);

  /* ---- 2. ONE SCROLLER ---- */
  check('2 exactly one scrolling box, not a scrollbar inside a scrollbar',
    m.scrollers === 1, `${m.scrollers} scrolling`);

  /* ---- 3. THE FILTER BAR ---- */
  check('3 no filter control is clipped', m.clipped.length === 0, m.clipped.join(' | ') || 'none');
  check('3 no filter control sits outside the bar holding it', m.strayControls === 0, m.strayControls);

  /* ---- 4. NOTHING SIDEWAYS ---- */
  check('4 nothing is drawn past the panel edge', m.outside.length === 0,
    m.outside.join(', ') || 'none');

  /* ---- 5. EVERY EVENT DRAWN ---- */
  check('5 no event collapsed to nothing', m.emptyRows === 0, `${m.emptyRows} of ${m.rows}`);

  /* ---- 6. REDLINES WRAP ---- */
  check('6 the screen carries rendered redlines', m.redlines > 0, m.redlines);
  check('6 and none of them scrolls sideways', m.wideRedlines === 0,
    `${m.wideRedlines} of ${m.redlines}`);

  /* ---- 7. THE PAGE BEHIND ---- */
  check('7 the page behind the modal does not scroll',
    m.pageH <= m.winH + 2 && m.pageW <= m.winW + 2, `${m.pageW}x${m.pageH} in ${m.winW}x${m.winH}`);

  /* ---- 8. THE VERDICT IS WRITTEN, NOT TOASTED ---- */
  await page.click('#ht-verify');
  await pause(500);
  const afterVerify = await page.evaluate(MEASURE);
  await page.screenshot({ path: path.join(OUT, '02-verified.png') });
  check('8 Verify integrity writes a verdict that is actually on screen',
    !!afterVerify.verdict && afterVerify.verdict.h > 10,
    afterVerify.verdict ? `${afterVerify.verdict.h}px — "${afterVerify.verdict.text}"` : 'no panel');
  check('8 and the screen is still whole after it',
    afterVerify.outside.length === 0 && afterVerify.scrollers === 1,
    `outside ${afterVerify.outside.length}, scrollers ${afterVerify.scrollers}`);

  /* ---- 9. FILTERING REDRAWS IT ---- */
  await page.evaluate(() => window.SHOW_FILTERED());
  await pause(350);
  const filtered = await page.evaluate(MEASURE);
  await page.screenshot({ path: path.join(OUT, '03-filtered.png') });
  check('9 a filter narrows the list', filtered.rows > 0 && filtered.rows < m.rows,
    `${m.rows} → ${filtered.rows}`);
  check('9 and the filtered screen keeps its width and its single scroller',
    filtered.asked > 0 && filtered.ht.w / filtered.asked >= 0.95 && filtered.scrollers <= 1,
    `${filtered.ht.w}px of ${filtered.asked}px, ${filtered.scrollers} scrolling`);

  /* ---- 10. A NARROW WINDOW ----
     A laptop at 1280 and a small one at 1024. The screen may not reach its
     full width here and is not asked to — what it must not do is push the
     page sideways or spill out of the panel. */
  await page.evaluate(() => window.SHOW_HISTORY());
  for (const width of [1280, 1024]){
    await page.setViewportSize({ width, height: 800 });
    await pause(300);
    const n = await page.evaluate(MEASURE);
    await page.screenshot({ path: path.join(OUT, `04-narrow-${width}.png`) });
    check(`10 at ${width}px the page still does not scroll sideways`,
      n.pageW <= n.winW + 2, `${n.pageW}px in ${n.winW}px`);
    check(`10 at ${width}px nothing spills out of the panel`,
      n.outside.length === 0, n.outside.join(', ') || 'none');
  }

  check('no page error', errors.length === 0, errors.join(' | ') || 'none');

  await browser.close();
  srv.close();
  const passed = results.filter(r => r.pass).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  console.log(`screenshots → test/chromium/shots/timeline`);
  process.exit(passed === results.length ? 0 : 1);
})();
