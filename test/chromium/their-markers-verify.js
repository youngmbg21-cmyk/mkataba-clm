/* THEIR COMMENT MARKERS OPEN ON A PRESS — measured in a real browser
   (the owner's list, 27 Sep 2026).

   "On the other side's page, pressing a numbered comment marker in the margin
   does nothing — the press crashes." PORTAL_MODE is a BOOLEAN and the marker's
   press called it as a function: on their page it threw "PORTAL_MODE is not a
   function" before reaching their notes aside. f401 measures the same press
   in jsdom; this file presses it with a REAL MOUSE on their real page, mounted
   by the product's own renderSharePortal off a real buildSharePayload (the
   parity harness), and reads what a person would see.

   The marker is placed exactly as rlPaintNoteMarks places one — same class,
   same three attributes, in the page's own mount — because a real anchored
   note on their page arrives through the share channel, which this harness
   does not run. What is under test is the PRESS: the delegated handler and
   the aside it opens.

   Against the parent (3ee647b) this file reports 4 of 5 failed: a page error
   per press, an aside that never opens (so it cannot close either). 1 is the
   stage. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

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

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };

(async () => {
  const srv = await serve();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await page.evaluate(() => window.SHOW_COUNTERPARTY());
  await page.waitForTimeout(500);

  const staged = await page.evaluate(() => {
    const mount = document.getElementById('pt-nego');
    const clause = mount && mount.querySelector('.rl-doc [data-clause]');
    if (!mount || !clause) return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rl-note-mk out';
    b.textContent = '1';
    b.setAttribute('data-rl-note-open', 'k-their-1');
    b.setAttribute('data-rl-note-home', '');
    b.setAttribute('data-rl-note-c', (window.PORTAL_OPTS && PORTAL_OPTS.payload && PORTAL_OPTS.payload.contract && PORTAL_OPTS.payload.contract.id) || 'x');
    clause.style.position = clause.style.position || 'relative';
    clause.appendChild(b);
    return { portal: window.PORTAL_MODE, aside: !!document.getElementById('pt-notes') };
  });
  ok('1 their page is mounted, with its notes aside, and the flag is the boolean true',
     !!staged && staged.portal === true && staged.aside, JSON.stringify(staged));

  const openNow = () => page.evaluate(() => {
    const a = document.getElementById('pt-notes');
    return !!(a && a.classList.contains('open') && a.getAttribute('aria-hidden') === 'false');
  });
  const box = await page.locator('.rl-note-mk.out').boundingBox();
  const before = errs.length;
  if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  ok('2 a real press on the marker throws nothing', errs.length === before, errs.slice(before).join(' | '));
  const opened = await openNow();
  ok('3 the press opens their notes', opened);
  /* The aside is a layer over the page; the marker is under it once it is
     open, so the second press is dispatched on the element itself — the
     owner's rule is that the press that opened a sliding panel closes it. */
  await page.evaluate(() => document.querySelector('.rl-note-mk.out').click());
  await page.waitForTimeout(300);
  /* GATED on 3: an aside that never opened is also "not open", so ungated this
     claim passes on the broken code and proves nothing. */
  ok('4 the same press closes them again', opened && !(await openNow()), opened ? '' : 'never opened');
  ok('5 no page error anywhere in the run', errs.length === 0, errs.join(' | '));

  await browser.close();
  srv.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
