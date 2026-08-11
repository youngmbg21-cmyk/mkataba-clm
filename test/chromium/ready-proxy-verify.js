/* Chromium verification of the counterparty's second Ready to sign.
   ============================================================
   THIS FILE EXISTS BECAUSE JSDOM CANNOT SEE THE DEFECT IT MEASURES.

   f181 pins the behaviour of the header's Ready to sign in jsdom — that it
   mirrors the strip's gate, forwards the click, and posts once. What jsdom
   cannot answer is the only question that decides whether a reader can use
   it, and this project has already paid for that lesson twice: f180's verb
   bar was pressable markup no human could see, and every test stayed green.

   Two things here are invisible to jsdom BY CONSTRUCTION:

     1  IS IT ON THE SCREEN, next to Compare wording, with a real box? jsdom
        has no layout engine, so getBoundingClientRect is all zeroes and
        "beside" has no meaning in it.

     2  DOES THE HIDE ACTUALLY HIDE? index.html sets .ui-btn{display:inline-flex},
        and an author rule beats the browser's own [hidden]{display:none}. So
        on a link with no readiness to signal, the bare attribute would leave
        the button standing. jsdom does not resolve class rules at all — it
        reports a <button> as inline-block whatever the stylesheet says — so
        it答s "hidden" for a reason that has nothing to do with the cascade
        under test. Measured here against the real one.

   Mounted through the parity fixture, which renders the counterparty's page
   from a payload built by the real buildSharePayload. Screenshots go to
   test/chromium/shots/ready-proxy/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'ready-proxy');
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

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => check('no page error', false, e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await page.evaluate(() => window.SHOW_COUNTERPARTY());
  await pause(500);
  await page.screenshot({ path: path.join(OUT, '01-header.png') });

  const m = await page.evaluate(() => {
    const box = sel => { const el = document.querySelector(sel);
      if (!el) return null; const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height),
        top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right) }; };
    const top = document.getElementById('pt-ready-top');
    const cmp = document.getElementById('pt-compare');
    const real = document.getElementById('pt-nego-ready');
    /* THE HIDE, MEASURED AGAINST THE REAL CASCADE. Flip the attribute the
       mirror flips and ask the browser what it did — the one question jsdom
       answers for the wrong reason. Put back immediately. */
    let hiddenDisplay = null, shownDisplay = null;
    if (top){
      shownDisplay = getComputedStyle(top).display;
      const was = top.hasAttribute('hidden');
      top.hidden = true;
      hiddenDisplay = getComputedStyle(top).display;
      top.hidden = was;
    }
    return {
      top: box('#pt-ready-top'), cmp: box('#pt-compare'), real: box('#pt-nego-ready'),
      decline: box('#pt-nego-decline'),
      focusGone: !document.getElementById('pt-focus')
        && !document.querySelector('.pt-focus-btn'),
      sameRow: !!(top && cmp && top.closest('.pw-id-read') === cmp.closest('.pw-id-read')),
      label: top ? (top.textContent || '').replace(/\s+/g, ' ').trim() : null,
      hasIcon: !!(top && top.querySelector('svg') && top.querySelector('svg').innerHTML.trim()),
      topDisabled: top ? top.disabled : null,
      realDisabled: real ? real.disabled : null,
      hiddenDisplay, shownDisplay,
    };
  });

  /* ---- 1. it is on the screen at all ---- */
  check('the header Ready to sign has a real box',
    !!m.top && m.top.w > 0 && m.top.h > 0,
    m.top ? `${m.top.w}x${m.top.h}` : 'absent');

  /* ---- 2. beside Compare wording, which is what was asked for ---- */
  check('it sits in the same row as Compare wording', m.sameRow);
  check('and on the same line, to its right',
    !!m.top && !!m.cmp && Math.abs(m.top.top - m.cmp.top) <= 2 && m.top.left >= m.cmp.right - 2,
    m.top && m.cmp ? `compare right=${m.cmp.right}, ready left=${m.top.left}` : 'missing one');

  /* ---- 3. it reads as the pair beside it: words and an icon ---- */
  check('it says Ready to sign', /Ready to sign/.test(m.label || ''), m.label);
  check('and carries a drawn icon, like the two verbs beside it', m.hasIcon,
    m.hasIcon ? 'svg has paths' : 'EMPTY svg — icon() answered ICONS[name]||""');

  /* ---- 4. THE HIDE ACTUALLY HIDES — the .ui-btn cascade trap ----
     The pair is the assertion, not either half: shown it must be laid out,
     hidden it must be gone. Which flex value the row settles on is the row's
     business and not a claim worth pinning. */
  check('shown, it is laid out rather than removed', m.shownDisplay !== 'none',
    m.shownDisplay);
  check('hidden, the browser really removes it (beats .ui-btn display)',
    m.hiddenDisplay === 'none',
    m.hiddenDisplay !== 'none'
      ? `${m.hiddenDisplay} — [hidden] LOST to .ui-btn; the button would stand on a dead link`
      : m.hiddenDisplay);

  /* ---- 5. the strip is untouched — f180 stays true ---- */
  check('the strip keeps its own Ready to sign, visible',
    !!m.real && m.real.w > 0 && m.real.h > 0, m.real ? `${m.real.w}x${m.real.h}` : 'absent');
  check('and Decline beside it', !!m.decline && m.decline.w > 0);

  /* ---- 6. the mirror agrees in a real browser too ---- */
  check('both doors are shut while nothing is answered',
    m.topDisabled === true && m.realDisabled === true,
    `header=${m.topDisabled} strip=${m.realDisabled}`);

  /* ---- 7. focus mode is gone ---- */
  check('the focus button is gone from the page', m.focusGone);

  /* ---- 8. THE MIRROR HOLDS THROUGH A DECISION ----
     The fixture's round cannot be driven to alignment from this seat — most of
     its changes are not the counterparty's to answer, so the gate stays shut
     and says so. That is the right behaviour to measure here anyway: what a
     browser can prove that jsdom cannot is that the two buttons stay in step
     ON SCREEN as the page repaints under them. Whether the open gate posts
     once is logic, and f181 proves it where logic belongs.

     Deciding repaints the strip, which is where a header button rendered once
     and never synced would drift away from it. */
  const drive = await page.evaluate(async () => {
    const read = () => {
      const top = document.getElementById('pt-ready-top');
      const real = document.getElementById('pt-nego-ready');
      return { topOn: top ? !top.disabled : null, realOn: real ? !real.disabled : null,
        topWhy: top ? top.title : null, realWhy: real ? real.title : null,
        topBox: top ? Math.round(top.getBoundingClientRect().width) : 0 };
    };
    const before = read();
    for (const btn of Array.from(document.querySelectorAll('[data-nego-accept]'))){
      btn.click(); await new Promise(r => setTimeout(r, 150));
    }
    return { before, after: read(),
      stillPending: document.querySelectorAll('[data-nego-accept]').length };
  });
  await page.screenshot({ path: path.join(OUT, '02-after-decision.png') });

  check('the two doors agree before any decision',
    drive.before.topOn === drive.before.realOn,
    `header open=${drive.before.topOn} strip open=${drive.before.realOn}`);
  check('and still agree after the strip repaints under a decision',
    drive.after.topOn === drive.after.realOn,
    `header open=${drive.after.topOn} strip open=${drive.after.realOn}`);
  check('the header explains itself in the strip\'s own words',
    !!drive.after.topWhy && drive.after.topWhy === drive.after.realWhy,
    drive.after.topWhy);
  check('and it is still on the screen after the repaint', drive.after.topBox > 0,
    `${drive.after.topBox}px wide`);

  await browser.close();
  srv.close();
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length){ console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  process.exit(failed.length ? 1 : 0);
})();
