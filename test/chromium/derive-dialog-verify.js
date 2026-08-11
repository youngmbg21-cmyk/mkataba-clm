/* Chromium verification of the adviser copy's one hand-over.
   ============================================================
   THIS FILE EXISTS BECAUSE JSDOM CANNOT SEE THE DEFECT IT MEASURES.

   The standing panel that listed every read-only link this reader had minted
   was removed at the owner's ask (12 Aug 2026). It was also the ONLY place a
   minted link was ever drawn — so the hand-over moved into a dialog that opens
   the moment the link is made. f127 proves that in jsdom: the dialog exists,
   carries the link, says what the ticket is, and survives a backdrop click.

   What jsdom cannot answer is whether a person can USE it. It has no layout
   engine, so a dialog rendered behind the page, clipped to nothing, or with
   its link box collapsed to zero width passes every node assertion ever
   written about it. This page has already shipped that exact class of fault
   twice — f180's unreachable verb bar, and the [hidden] that lost to .ui-btn
   one commit ago. A live, owner-revocable grant of access to a contract is
   not the thing to get wrong a third time.

   Measured here: the strip carries no panel, the dialog paints over the page
   rather than under it, its link box is real and holds the whole URL, and its
   two controls have pressable boxes.

   Screenshots go to test/chromium/shots/derive-dialog/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'derive-dialog');
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
const LINK = 'https://hati.example/#s=t:tok_child_for_counsel';

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

  /* ---- 1. the strip has no panel hanging off it ---- */
  const strip = await page.evaluate(() => {
    const foot = document.getElementById('pt-nego-foot');
    const r = foot ? foot.getBoundingClientRect() : null;
    return { h: r ? Math.round(r.height) : null,
      panel: !!document.getElementById('pt-derive-out'),
      rows: document.querySelectorAll('[data-pt-derived]').length,
      deriveBtn: !!document.getElementById('pt-derive') };
  });
  check('the strip carries no read-only panel', !strip.panel && strip.rows === 0,
    `panel=${strip.panel} rows=${strip.rows}`);
  check('and the button that mints one is still on it', strip.deriveBtn);
  check('the strip is a single band, not a stack', strip.h != null && strip.h < 90,
    `${strip.h}px tall`);
  await page.screenshot({ path: path.join(OUT, '01-strip-no-panel.png') });

  /* ---- 2. mint one, with the route and the name prompt stood in for ---- */
  await page.evaluate(link => {
    window.promptDialog = async () => 'Nordfrakt insurers';
    window.api = async (p) => {
      if (/derive-view$/.test(p)) return { ok: true, link, expiresAt: '2026-09-01T00:00:00Z' };
      return { ok: true };
    };
  }, LINK);
  await page.click('#pt-derive');
  await pause(600);
  await page.screenshot({ path: path.join(OUT, '02-handover-dialog.png') });

  const d = await page.evaluate(() => {
    const box = sel => { const el = document.querySelector(sel);
      if (!el) return null; const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height),
        top: Math.round(r.top), left: Math.round(r.left) }; };
    const ov = document.getElementById('pt-derive-dialog');
    const input = document.getElementById('pt-derived-link');
    if (!ov || !input) return { ov: null };
    const card = ov.querySelector('[role="dialog"]');
    const cr = card.getBoundingClientRect();
    /* Is the dialog actually on top? Ask the browser what it would hit at the
       centre of the card, not what the z-index says. */
    const hit = document.elementFromPoint(Math.round(cr.left + cr.width / 2),
      Math.round(cr.top + 24));
    return {
      ov: box('#pt-derive-dialog'), card: box('[role="dialog"]'),
      input: box('#pt-derived-link'), copy: box('#pt-derive-copy'),
      done: box('#pt-derive-done'),
      onTop: !!(hit && card.contains(hit)),
      value: input.value,
      /* The whole URL has to be reachable, not a box showing the first third
         with no way to see the rest. select() + the value is what a Copy
         press uses, so the readable claim is that the value is whole. */
      valueWhole: input.value.length > 0 && input.scrollWidth >= input.clientWidth - 1,
      said: (card.textContent || '').replace(/\s+/g, ' '),
      inView: cr.top >= 0 && cr.bottom <= window.innerHeight + 1,
    };
  });

  check('the hand-over dialog opened by itself', !!d.ov);
  check('its card is painted over the page, not behind it', d.onTop);
  check('and it is fully within the window', d.inView);
  check('the link box has a real box', !!d.input && d.input.w > 100 && d.input.h > 0,
    d.input ? `${d.input.w}x${d.input.h}` : 'absent');
  check('and holds the whole link', d.value === LINK, d.value);
  check('Copy is pressable', !!d.copy && d.copy.w > 0 && d.copy.h > 0,
    d.copy ? `${d.copy.w}x${d.copy.h}` : 'absent');
  check('Done is pressable', !!d.done && d.done.w > 0 && d.done.h > 0,
    d.done ? `${d.done.w}x${d.done.h}` : 'absent');
  check('it says this is the only sight of the link',
    /only time it is shown/i.test(d.said || ''));
  check('and what the holder may not do',
    /cannot accept, reject, propose wording or sign/i.test(d.said || ''));

  /* ---- 3. closing leaves nothing behind ---- */
  const after = await page.evaluate(() => {
    document.getElementById('pt-derive-done').click();
    return { ov: !!document.getElementById('pt-derive-dialog'),
      panel: !!document.getElementById('pt-derive-out'),
      rows: document.querySelectorAll('[data-pt-derived]').length,
      stillMintable: !!document.getElementById('pt-derive') };
  });
  check('Done closes it', !after.ov);
  check('and no panel grew back in its place', !after.panel && after.rows === 0,
    `panel=${after.panel} rows=${after.rows}`);
  check('another copy can still be minted', after.stillMintable);
  await page.screenshot({ path: path.join(OUT, '03-after-done.png') });

  await browser.close();
  srv.close();
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length){ console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  process.exit(failed.length ? 1 : 0);
})();
