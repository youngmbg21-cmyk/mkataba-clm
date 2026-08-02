/* Screenshots of what this branch changed, taken in a real browser.

   Not a test — f141/f142/f143 are the tests. This drives each changed surface
   the way a person drives it and photographs the result, so the four changes
   can be LOOKED AT rather than read about:

     the reason field on the edit bar, offered and not blocking;
     the change card carrying the reason — and saying so when there is none;
     the Share dialog refusing a round whose asks are unexplained;
     the counterparty's history and the export, with its colours fixed.

   Shots land in test/chromium/shots/reasons/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'reasons');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = '/opt/pw-browsers/chromium';
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
const pause = ms => new Promise(r => setTimeout(r, ms));
const shot = async (target, name) => {
  const f = path.join(OUT, name + '.png');
  await target.screenshot({ path: f });
  console.log('  shot  ' + name);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const BASE = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('  PAGE ERROR: ' + e.message));
  await page.goto(`${BASE}/test/chromium/room-shots.html`, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(500);

  /* ---- 1. THE EDIT BAR: the question offered, the save not blocked ---- */
  const clauseId = await page.evaluate(() => {
    const cl = negoClauseList(window.CONTRACT).find(x => x.num === '1');
    const el = document.querySelector(`.nego-pane.working [data-clause="${cl.clauseId}"]`);
    if (el) el.scrollIntoView({ block: 'center' });
    return cl.clauseId;
  });
  await pause(250);
  await page.click(`.nego-pane.working [data-clause="${clauseId}"] [data-nego-edit]`);
  await pause(250);
  await shot(await page.$(`.nego-pane.working [data-clause="${clauseId}"]`), '01-edit-bar-reason-field');

  /* Typed, to show the fast path being used while the wording is under hand. */
  await page.fill(`[data-nego-why="${clauseId}"]`, 'Storage scope must name the facility, or Annex A governs by default.');
  await pause(150);
  await shot(await page.$(`.nego-pane.working [data-clause="${clauseId}"] .nego-edit-bar`), '02-reason-typed');
  await page.click(`[data-nego-save="${clauseId}"]`);
  await pause(500);

  /* ---- 2. A CHANGE FILED WITH NO REASON: the card says so ---- */
  await page.evaluate(async () => {
    const cl = negoClauseList(window.CONTRACT).find(x => x.num === '4');
    await negoEditClause(window.CONTRACT, cl.clauseId,
      '<p>All invoices are payable within sixty (60) days from the date of issue (Net-60).</p>',
      { side: 'owner', author: 'Wanjiru Kamau', summary: 'Payment terms extended to Net-60' });
    if (window.negoRepaintOpenRoom) negoRepaintOpenRoom(window.CONTRACT);
    else if (window.renderRedline) renderRedline();
  });
  await pause(500);
  const cards = await page.$$('#rl-changes .rl-card, #nego-cards .nego-card');
  if (cards.length) await shot(cards[0], '03-card-reason-and-absence');
  const col = await page.$('#rl-changes') || await page.$('#nego-cards');
  if (col) await shot(col, '04-change-column');

  /* ---- 3. THE SHARE DIALOG REFUSES THE ROUND ---- */
  await page.evaluate(() => { window.toast = m => { window.__toast = String(m); }; });
  await page.evaluate(() => openShareModal(window.CONTRACT, { purpose: 'negotiate' }));
  await pause(700);
  const panel = await page.$('#share-reasons');
  if (panel) await shot(panel, '05-share-reasons-panel');
  const step1 = await page.$('#share-step-1');
  if (step1) await shot(step1, '06-share-step-whole');
  await page.click('#share-next');
  await pause(350);
  console.log('  refusal: ' + await page.evaluate(() => window.__toast || '(none)'));
  const modal = await page.$('#modal-root > div');
  if (modal) await shot(modal, '07-share-next-refused');

  /* ---- 4. THE COUNTERPARTY'S PAGE: history, timeline, export ---- */
  const cp = await browser.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 });
  cp.on('pageerror', e => console.log('  CP PAGE ERROR: ' + e.message));
  await cp.goto(`${BASE}/test/chromium/room-shots.html`, { waitUntil: 'load' });
  await cp.evaluate(() => window.READY);
  await pause(400);
  await cp.evaluate(async () => {
    /* The fixture opens the OWNER's room, which is a fixed full-window overlay
       — left mounted it paints over the counterparty's page and every element
       screenshot below would photograph it instead. */
    if (window.closeNegotiationRoom) closeNegotiationRoom();
    document.getElementById('modal-root').innerHTML = '';
    document.getElementById('nego-tab').innerHTML = '';
    document.getElementById('content').innerHTML = '<div id="share-root"></div>';
    const c = window.CONTRACT;
    /* One owner ask carrying a reason, so their screen shows a real one. */
    const cl = negoClauseList(c).find(x => x.num === '4');
    await negoEditClause(c, cl.clauseId,
      '<p>All invoices are payable within sixty (60) days from the date of issue (Net-60).</p>',
      { side: 'owner', author: 'Wanjiru Kamau · Copilot (Shorten & Simplify)',
        summary: 'Payment terms extended to Net-60',
        rationale: 'Our cash cycle cannot support Net-30 at this volume.' });
    const payload = buildSharePayload(c, 'dochash', { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' },
      { purpose: 'negotiate' });
    payload.purpose = 'negotiate'; payload.purposeChosen = 'negotiate';
    window.__saved = null;
    window.downloadFile = (n, content) => { window.__saved = content; };
    renderSharePortal(payload, { token: 't', share: { recipientName: 'Erik Lindqvist' } });
    await new Promise(r => setTimeout(r, 300));
  });
  await pause(400);
  /* The reading bar photographed BEFORE the timeline opens over it. */
  const barEl = await cp.$('#pt-history');
  if (barEl) await shot(barEl, '08-counterparty-history-button');

  const exportedHtml = await cp.evaluate(async () => {
    document.getElementById('pt-hist')?.click();
    await new Promise(r => setTimeout(r, 400));
    document.getElementById('ht-export')?.click();
    await new Promise(r => setTimeout(r, 700));
    return window.__saved;
  });
  await pause(400);
  const tl = await cp.$('#modal-root > div');
  if (tl) await shot(tl, '09-counterparty-history-timeline');

  /* The exported report, opened as the file it is. */
  if (exportedHtml){
    const rep = await browser.newPage({ viewport: { width: 900, height: 1100 }, deviceScaleFactor: 2 });
    await rep.setContent(exportedHtml, { waitUntil: 'load' });
    await pause(300);
    await shot(rep, '10-exported-history-colours');
    fs.writeFileSync(path.join(OUT, 'exported-history.html'), exportedHtml);
    console.log('  saved exported-history.html');
  } else {
    console.log('  NO EXPORT captured');
  }

  await browser.close();
  srv.close();
  console.log(`\nshots in ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
