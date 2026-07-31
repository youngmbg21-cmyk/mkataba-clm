/* Chromium verification of owner / counterparty parity.
   ============================================================
   THIS FILE EXISTS BECAUSE JSDOM CANNOT SEE THE DEFECT IT MEASURES.

   The counterparty's contract pane was 419px wide where the owner's was 925px,
   their page was 2.6 screens tall where the owner's filled the window, the
   Discussion tab was clipped at the panel edge, the origin badge truncated to
   "Count", and change cards broke mid-identifier — all while roughly a hundred
   test files passed. jsdom has no layout engine and no cascade, so every one of
   those is invisible to it by construction. A claim about how a page LOOKS is
   not proven by a test that cannot look.

   ONE CONTRACT, TWO SURFACES. Both sides render from the same record through
   the product's own code — renderRedline() for the owner, renderSharePortal()
   off a payload from the real buildSharePayload() for the counterparty. Two
   fixtures would let the pages differ for reasons that have nothing to do with
   the layout under test.

   WHAT IS MEASURED, and why each one:
     1  the contract pane, both sides, within tolerance
     2  the change index, both sides
     3  the page does not scroll — the columns scroll inside themselves
     4  both sidebar tabs are fully inside the panel and clickable
     5  no label is truncated (badge, tab, card identifier)
     6  exactly one document surface on the counterparty's page
     7  the owner's distribution and round controls are absent from their seat
     8  no AI control on their side

   Every number comes from getBoundingClientRect or getComputedStyle. None is
   read out of a stylesheet.

   Screenshots go to test/chromium/shots/parity/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'parity');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

/* How far apart the two sides may be before it is a defect rather than a
   rounding difference. 5% of the owner's width — the counterparty's page
   legitimately carries a banner the owner's does not, so demanding equality
   would be demanding the wrong thing. */
const TOLERANCE = 0.05;

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

/* Measured on whichever surface is currently mounted. Selectors are the shared
   component's own ids, which is the point: if the counterparty's page stops
   mounting the shared component, these come back null and the checks fail
   rather than quietly measuring something else. */
const MEASURE = () => {
  const box = sel => { const el = document.querySelector(sel);
    if (!el) return null; const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top),
      left: Math.round(r.left), right: Math.round(r.right) }; };
  /* A label is truncated when the text is wider than the box painting it. Read
     from scrollWidth vs clientWidth, which is the browser's own answer. */
  const clipped = sel => Array.from(document.querySelectorAll(sel))
    .filter(el => el.scrollWidth > el.clientWidth + 1)
    .map(el => (el.textContent || '').trim().slice(0, 40));
  const tabs = Array.from(document.querySelectorAll('.rl-side-tab')).map(el => {
    const r = el.getBoundingClientRect();
    const host = el.closest('.rl-side') || el.parentElement;
    const hr = host.getBoundingClientRect();
    return { text: (el.textContent || '').trim().slice(0, 24), w: Math.round(r.width),
      inside: r.left >= hr.left - 1 && r.right <= hr.right + 1,
      visible: r.width > 0 && r.height > 0 };
  });
  return {
    doc: box('#rl-doc') || box('.nego-doc'),
    index: box('#rl-changes-col') || box('.nego-pane.index'),
    pageH: document.documentElement.scrollHeight,
    winH: window.innerHeight,
    tabs,
    clippedLabels: clipped('.rl-side-tab, .nego-origin, .nego-chip, .nego-card-id'),
    /* Counted across BOTH renderings of a contract: .doc-surface is the plain
       document (the old #pt-doc, and the viewer's sheet) and .nego-doc is the
       workbench's marked-up pane. The claim is "one contract on the page", not
       "one of a particular class" — counting only one class is how a duplicate
       in the other shape would pass unnoticed. */
    docSurfaces: document.querySelectorAll('.doc-surface, .nego-doc').length,
    ids: ['pt-doc', 'portal-redline', 'portal-plain', 'pt-name', 'pt-sign', 'pt-accept',
      'nego-copilot', 'nego-insert-lib', 'nego-save-draft', 'nego-bulk-acc',
      'nego-exit', 'nego-publish-round', 'nego-close-round']
      .filter(id => !!document.getElementById(id)),
    bulkLabels: Array.from(document.querySelectorAll('.nego-bulk button'))
      .map(el => (el.textContent || '').trim()),
    sideToggle: document.querySelectorAll('[data-redline-side]').length,
    backArrow: document.querySelectorAll('[data-rl-back]').length,
    shellActs: Array.from(document.querySelectorAll('[data-rl-shell]')).map(el => el.getAttribute('data-rl-shell')),
  };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => check('no page error', false, e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(300);

  const owner = await page.evaluate(MEASURE);
  await page.screenshot({ path: path.join(OUT, '01-owner.png') });

  await page.evaluate(() => window.SHOW_COUNTERPARTY());
  await pause(400);
  const cp = await page.evaluate(MEASURE);
  await page.screenshot({ path: path.join(OUT, '02-counterparty.png'), fullPage: true });

  /* ---- 1. the contract pane ---- */
  if (!owner.doc || !cp.doc){
    check('1 both sides mount the shared document pane', false,
      `owner=${JSON.stringify(owner.doc)} counterparty=${JSON.stringify(cp.doc)}`);
  } else {
    const drift = Math.abs(owner.doc.w - cp.doc.w) / owner.doc.w;
    check('1 contract pane within 5% of the owner\'s',
      drift <= TOLERANCE, `owner ${owner.doc.w}px · counterparty ${cp.doc.w}px · ${(drift * 100).toFixed(1)}% apart`);
  }

  /* ---- 2. the change index ---- */
  if (owner.index && cp.index){
    const drift = Math.abs(owner.index.w - cp.index.w) / owner.index.w;
    check('2 change index within 5% of the owner\'s',
      drift <= TOLERANCE, `owner ${owner.index.w}px · counterparty ${cp.index.w}px`);
  } else check('2 both sides mount the change index', false,
    `owner=${!!owner.index} counterparty=${!!cp.index}`);

  /* ---- 3. the page does not scroll ---- */
  check('3 owner page fills the window and does not scroll',
    owner.pageH <= owner.winH + 2, `${owner.pageH}px in ${owner.winH}px`);
  check('3 counterparty page does not scroll either',
    cp.pageH <= cp.winH + 2, `${cp.pageH}px in ${cp.winH}px`);

  /* ---- 4. both tabs reachable ---- */
  check('4 counterparty has both sidebar tabs', cp.tabs.length === 2, cp.tabs.length);
  check('4 neither tab is clipped at the panel edge',
    cp.tabs.length === 2 && cp.tabs.every(t => t.inside && t.visible),
    JSON.stringify(cp.tabs.map(t => ({ t: t.text, in: t.inside, w: t.w }))));

  /* ---- 5. nothing truncated ---- */
  check('5 no label truncated on the counterparty\'s page',
    cp.clippedLabels.length === 0, cp.clippedLabels.join(' | ') || 'none');

  /* ---- 6. one document ---- */
  check('6 exactly one document surface on their page',
    cp.docSurfaces === 1, `${cp.docSurfaces} found`);
  check('6 the duplicate document and standalone editor are gone',
    !cp.ids.includes('pt-doc') && !cp.ids.includes('portal-redline') && !cp.ids.includes('portal-plain'),
    cp.ids.join(', ') || 'none present');

  /* ---- 7. the owner's controls are not on their seat ---- */
  check('7 no side toggle on their page', cp.sideToggle === 0, cp.sideToggle);
  check('7 no back arrow — there is no page behind theirs', cp.backArrow === 0, cp.backArrow);
  check('7 no Share or Import — distribution stays with the owner',
    !cp.shellActs.includes('share') && !cp.shellActs.includes('import'),
    cp.shellActs.join(', ') || 'none');
  check('7 no round controls', !cp.ids.includes('nego-publish-round') && !cp.ids.includes('nego-close-round'),
    cp.ids.join(', ') || 'none');

  /* ---- 8. no AI, no clause library, no draft state ---- */
  check('8 no AI or clause-library control on their side',
    !cp.ids.includes('nego-copilot') && !cp.ids.includes('nego-insert-lib') && !cp.ids.includes('nego-save-draft'),
    cp.ids.filter(i => /copilot|insert-lib|save-draft/.test(i)).join(', ') || 'none');
  /* Checked by LABEL, not by presence. The button keeps its id on both sides —
     it is the same act, accept the other side's pending asks — and what must
     not cross to the counterparty is the claim that HaTi has sorted the
     changes by risk, because that sorting reads our playbook and our scan
     signals. So the assertion is about what the button says it does. */
  check('8 no risk-derived bulk verb on their side',
    !/Non-Risk/i.test(cp.bulkLabels.join(' ')), cp.bulkLabels.join(' | ') || 'none');
  check('8 but they DO keep a plain Accept all',
    /Accept all/i.test(cp.bulkLabels.join(' ')), cp.bulkLabels.join(' | ') || 'MISSING');
  check('8 and the owner still gets the risk-sorted one',
    /Non-Risk/i.test(owner.bulkLabels.join(' ')), owner.bulkLabels.join(' | ') || 'MISSING');

  /* The owner's side is the control: if these were absent there too, every
     assertion above would be passing for the wrong reason. */
  check('control — the owner DOES have the controls being checked for',
    owner.ids.includes('nego-copilot') || owner.ids.includes('nego-bulk-acc'),
    owner.ids.join(', ') || 'none');

  await browser.close();
  srv.close();

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  console.log(`screenshots → test/chromium/shots/parity`);
  if (bad.length){ process.exitCode = 1; }
})();
