/* Screenshots of what this branch changed, taken in a real browser.

   Not a test — verify.js is the test. This drives the room the way a person
   would and photographs each surface, so the four specifications can be looked
   at rather than read about. Shots land in test/chromium/shots/feature/.

   The Copilot is stubbed in room-shots.html: these are pictures of the proposal
   flow, not of a model's wording. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'feature');
const ROOT = path.join(__dirname, '..', '..');
/* THE SAME LADDER EVERY OTHER HARNESS USES: an override, then the dev sandbox's
   own copy IF IT EXISTS, then whatever playwright installed. The bare path was
   true in exactly one place — on a CI runner playwright installs its own build
   and /opt/pw-browsers does not exist, so the launch threw before a single
   check ran. */
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
        rep.writeHead(404); rep.end('not found'); return;
      }
      rep.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(rep);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}
const shot = async (page, name, el) => {
  const f = path.join(OUT, name + '.png');
  if (el) await el.screenshot({ path: f }); else await page.screenshot({ path: f });
  console.log('  shot  ' + name);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/room-shots.html`;
  const browser = await chromium.launch({ executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('  PAGE ERROR: ' + e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(400);

  /* ---- 1. the whole room, and the mode banner at the top of it ---- */
  await shot(page, '01-room');
  const mode = await page.$('.nego-mode');
  if (mode) await shot(page, '02-mode-banner', mode);

  /* ---- 2. THE STRUCTURE CASE ----
     Clause 7 under redline: heading, numbered sub-clauses, lettered
     sub-paragraphs. Before this branch the whole thing printed as one
     paragraph. */
  const c7 = await page.evaluate(() => {
    const id = negoChanges(window.CONTRACT).find(x => /Termination notice/.test(x.summary || ''))?.clauseId;
    const el = document.querySelector(`.nego-pane.working [data-clause="${id}"]`);
    if (el) el.scrollIntoView({ block: 'center' });
    return id;
  });
  await pause(300);
  const clause7 = await page.$(`.nego-pane.working [data-clause="${c7}"]`);
  if (clause7) await shot(page, '03-structured-redline', clause7);

  /* The same clause rendered the OLD way, for the comparison that makes the
     point. Built from the same stored ops through the same renderer with the
     block grouping switched off — so the difference in the two pictures is
     exactly the change this branch made, and nothing else. */
  await page.evaluate(() => {
    const ch = negoChanges(window.CONTRACT).find(x => /Termination notice/.test(x.summary || ''));
    const host = document.createElement('div');
    host.id = 'old-render';
    host.style.cssText = 'position:fixed;left:0;top:0;width:640px;z-index:999;background:#fff;'
      + 'padding:18px 22px;font-family:Georgia,serif;font-size:13px;line-height:1.75;color:#1a2733';
    host.innerHTML = '<div style="font:600 11px/1.4 system-ui;letter-spacing:.08em;'
      + 'text-transform:uppercase;color:#8a6a2a;margin-bottom:10px">Before — one paragraph</div>'
      + '<p style="margin:0;white-space:pre-wrap">' + redlineOpsHtml(ch.ops) + '</p>';
    document.body.appendChild(host);
  });
  await pause(200);
  const oldEl = await page.$('#old-render');
  if (oldEl) await shot(page, '04-structure-before', oldEl);
  await page.evaluate(() => document.getElementById('old-render')?.remove());

  /* ---- 3. the selection menu ---- */
  await page.evaluate(id => {
    const el = document.querySelector(`.nego-pane.working [data-clause="${id}"] p, .nego-pane.working [data-clause="${id}"] .rl-line`);
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    const t = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim().length > 20)
      || el.firstChild;
    const r = document.createRange();
    r.setStart(t, 0);
    r.setEnd(t, Math.min(38, t.textContent.length));
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    document.querySelector('.nego-pane.working .nego-doc')?.dispatchEvent(
      new MouseEvent('mouseup', { bubbles: true }));
  }, c7);
  await pause(400);
  await shot(page, '05-selection-menu');

  /* ---- 4. the AI proposal, and the fact that nothing has moved yet ---- */
  await page.evaluate(() => document.querySelector('[data-nego-ai="advantage"]')
    ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
  await pause(700);
  const pop = await page.$('.nego-aipop');
  if (pop) await shot(page, '06-ai-proposal', pop);
  await shot(page, '07-ai-proposal-in-page');
  await page.evaluate(() => document.querySelector('.nego-aipop [data-ai-cancel]')?.click());
  await pause(200);

  /* ---- 5. comment visibility: the badges and the composer switch ---- */
  const threadShot = await page.evaluate(() => {
    const ch = negoChanges(window.CONTRACT)[0];
    document.querySelector(`[data-nego-card="${ch.id}"]`)?.click();
    document.querySelector(`[data-nego-discuss="${ch.id}"]`)?.click();
    return ch.id;
  });
  await pause(300);
  await page.evaluate(id => {
    const t = document.getElementById('nego-thread-' + id);
    if (t) t.scrollIntoView({ block: 'center' });
  }, threadShot);
  await pause(250);
  const thread = await page.$('#nego-thread-' + threadShot);
  if (thread) await shot(page, '08-comment-visibility', thread);

  /* ---- 6. a fingerprint badge singles its conversation out ---- */
  await page.evaluate(() => {
    const b = document.querySelector('.nego-pane.working .nego-badge[data-badge]');
    if (b){ b.scrollIntoView({ block: 'center' }); b.click(); }
  });
  await pause(400);
  await shot(page, '09-badge-linked');
  const bar = await page.$('.nego-filterbar');
  if (bar){
    await page.evaluate(() => document.getElementById('nego-only')?.click());
    await pause(300);
    const idx = await page.$('#nego-index');
    if (idx) await shot(page, '10-narrowed-to-one', idx);
    await page.evaluate(() => document.getElementById('nego-unfilter')?.click());
    await pause(250);
  }

  /* ---- 7. Accept All Non-Risk, and what it refuses to take ----
     The liability ask carries a playbook deviation, so a batch accept must
     leave it behind and say so. */
  await page.evaluate(() => document.getElementById('nego-bulk-acc')?.click());
  await pause(500);
  await shot(page, '11-batch-heldback');
  const held = await page.evaluate(() => {
    const t = document.querySelector('.toast, #toast, [class*="toast"]');
    return { toast: t ? t.textContent.trim() : '(no toast found)',
      statuses: negoChanges(window.CONTRACT).map(x => `${x.id}:${x.status}`) };
  });
  console.log('\n  batch result: ' + held.statuses.join('  '));
  console.log('  toast: ' + held.toast + '\n');

  /* ---- 8. the mode banner, once everything on the table has been sent ---- */
  await shot(page, '12-room-after-batch');

  await browser.close();
  srv.close();
  console.log('shots in ' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
