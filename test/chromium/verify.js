/* Chromium verification of the negotiation room.
   ============================================================
   jsdom has no layout engine, so everything visual in this component is tested
   at the RULE level there and has to be confirmed in a real browser here. This
   script renders the room with prototype.html's own six-clause contract
   (clauses 1, 4, 5, 6, 9, 12) and checks it against the prototype:

     · exactly one badge per CHANGED clause, and none on the unchanged ones
     · a real title on every clause — the defect this session exists for
     · unchanged clauses shown clean
     · the redline readable: a rewritten clause is one strikeout and one
       insertion, not interleaved shreds
     · the badge really sits in the margin, outside the text column
     · sync-highlight lighting all three panes at once
     · the Verified pill saying Verified only after the chain is walked

   Every number it prints is measured from getBoundingClientRect, not asserted
   from a stylesheet. Screenshots go to test/chromium/shots/. */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');

const http = require('node:http');
const OUT = path.join(__dirname, 'shots');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = '/opt/pw-browsers/chromium';

/* Served over http, not opened as a file://. On an opaque origin Chromium
   throws on the first localStorage access, which aborts js/core.js partway
   through — leaving every `const` after that point permanently in the temporal
   dead zone and the page failing with "Cannot access 'currentUser' before
   initialization". A static server is one line and removes the whole class. */
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
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

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/room.html`;
  const browser = await chromium.launch({ executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  /* /favicon.ico is requested by the browser itself, not by the page, and this
     harness serves no icon — so it is excluded by name rather than by loosening
     the check. Everything else that 404s or throws is a real failure. */
  const noise = u => /\/favicon\.ico$/.test(String(u || ''));
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).split('\n')[0]));
  page.on('response', r => { if (r.status() >= 400 && !noise(r.url())) errors.push(r.status() + ' ' + r.url()); });
  page.on('console', m => { if (m.type() === 'error' && !noise(m.location().url)) errors.push('console: ' + m.text()); });

  await page.goto(PAGE);
  await page.waitForFunction(() => window.READY !== undefined);
  await page.evaluate(() => window.READY);
  await page.waitForSelector('.nego-room .nego-pane.working .nego-clause', { timeout: 10000 });

  check('the room renders with no page errors', errors.length === 0, errors.join(' | ') || 'clean');

  /* ---------- clause structure ---------- */
  const doc = await page.evaluate(() => {
    const q = sel => Array.from(document.querySelectorAll(sel));
    const working = q('.nego-room .nego-pane.working .nego-clause');
    const baseline = q('.nego-room .nego-pane.baseline .nego-clause');
    return {
      workingCount: working.length,
      baselineCount: baseline.length,
      titles: working.map(n => (n.querySelector('h2') || {}).textContent || '').map(s => s.replace(/\s+/g, ' ').trim()),
      badged: working.filter(n => n.querySelector('.nego-badge')).map(n => n.querySelector('.nego-badge').textContent.trim()),
      unbadged: working.filter(n => !n.querySelector('.nego-badge'))
        .map(n => (n.querySelector('h2') || {}).textContent.replace(/\s+/g, ' ').trim()),
      cards: q('.nego-room .nego-card').length,
    };
  });

  check('six clauses in the working pane', doc.workingCount === 6, `${doc.workingCount} clauses`);
  check('six clauses in the baseline pane', doc.baselineCount === 6, `${doc.baselineCount} clauses`);
  check('every clause has a real title', doc.titles.every(t => /^Clause \d+ · \S/.test(t)),
    doc.titles.join(' | '));
  check('titles are the prototype’s own, with its non-contiguous numbering',
    doc.titles.map(t => (t.match(/^Clause (\d+)/) || [])[1]).join(',') === '1,4,5,6,9,12',
    doc.titles.map(t => (t.match(/^Clause (\d+)/) || [])[1]).join(','));
  check('exactly one badge per CHANGED clause — four of six', doc.badged.length === 4,
    doc.badged.join(' '));
  check('and none on the unchanged clauses 1 and 12',
    doc.unbadged.length === 2 && /Clause 1 ·/.test(doc.unbadged[0]) && /Clause 12 ·/.test(doc.unbadged[1]),
    doc.unbadged.join(' | '));
  check('four cards in the change index', doc.cards === 4, `${doc.cards} cards`);

  /* ---------- the redline is readable ---------- */
  const redline = await page.evaluate(() => {
    const clause = Array.from(document.querySelectorAll('.nego-room .nego-pane.working .nego-clause'))
      .find(n => /Clause 6 ·/.test((n.querySelector('h2') || {}).textContent || ''));
    const p = clause.querySelector('p');
    return {
      dels: Array.from(p.querySelectorAll('.nego-del')).map(n => n.textContent),
      inss: Array.from(p.querySelectorAll('.nego-ins')).map(n => n.textContent),
      text: p.textContent.replace(/\s+/g, ' ').trim(),
    };
  });
  check('a rewritten clause is ONE strikeout and ONE insertion, not shreds',
    redline.dels.length === 1 && redline.inss.length === 1,
    `${redline.dels.length} del / ${redline.inss.length} ins`);
  check('the deletion reads as one passage', /full replacement value of the affected goods/.test(redline.dels[0] || ''),
    JSON.stringify((redline.dels[0] || '').slice(0, 60)));
  check('the insertion reads as one passage', /EUR 250,000 in the aggregate per contract year/.test(redline.inss[0] || ''),
    JSON.stringify((redline.inss[0] || '').slice(0, 60)));

  const small = await page.evaluate(() => {
    const clause = Array.from(document.querySelectorAll('.nego-room .nego-pane.working .nego-clause'))
      .find(n => /Clause 4 ·/.test((n.querySelector('h2') || {}).textContent || ''));
    const p = clause.querySelector('p');
    return { dels: Array.from(p.querySelectorAll('.nego-del')).map(n => n.textContent),
      inss: Array.from(p.querySelectorAll('.nego-ins')).map(n => n.textContent),
      untouched: /Invoices shall be issued monthly in arrears/.test(p.textContent) };
  });
  check('a small edit marks only what moved, as one run each way',
    small.dels.length === 1 && small.inss.length === 1
      && /thirty \(30\)/.test(small.dels[0]) && /forty-five \(45\)/.test(small.inss[0]),
    `${JSON.stringify(small.dels)} → ${JSON.stringify(small.inss)}`);
  check('and the untouched sentences stay as plain context', small.untouched);

  /* ---------- layout, measured ---------- */
  const layout = await page.evaluate(() => {
    const clause = document.querySelector('.nego-room .nego-pane.working .nego-clause .nego-badge').closest('.nego-clause');
    const badge = clause.querySelector('.nego-badge');
    const body = clause.querySelector('p');
    const b = badge.getBoundingClientRect(), t = body.getBoundingClientRect();
    const panes = ['baseline', 'working', 'index'].map(k => {
      const el = document.querySelector('.nego-room .nego-pane.' + k);
      const r = el.getBoundingClientRect();
      return { k, x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) };
    });
    return {
      badge: { x: Math.round(b.x), right: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) },
      body: { x: Math.round(t.x), right: Math.round(t.right), w: Math.round(t.width) },
      panes,
      docWidth: Math.round(document.querySelector('.nego-room .nego-doc').getBoundingClientRect().width),
      bodyScrollW: document.body.scrollWidth, innerW: window.innerWidth,
    };
  });
  check('the badge sits OUTSIDE the text column, in the margin',
    layout.badge.right <= layout.body.x,
    `badge right ${layout.badge.right}px ≤ text left ${layout.body.x}px`);
  check('all three panes are laid out side by side with real width',
    layout.panes.every(p => p.w > 200) && layout.panes[0].x < layout.panes[1].x && layout.panes[1].x < layout.panes[2].x,
    layout.panes.map(p => `${p.k} ${p.w}×${p.h} @${p.x}`).join(', '));
  check('the page does not scroll horizontally',
    layout.bodyScrollW <= layout.innerW, `scrollWidth ${layout.bodyScrollW} ≤ ${layout.innerW}`);

  /* ---------- the Verified pill ---------- */
  const pill = await page.evaluate(() => {
    const p = document.querySelector('.nego-room .nego-card [data-verify]');
    const seg = document.querySelector('.nego-room #nego-integrity');
    return { text: p ? p.textContent.trim() : null, state: p ? p.getAttribute('data-verify') : null,
      strip: seg ? seg.textContent.replace(/\s+/g, ' ').trim() : null };
  });
  check('the Verified pill says Verified, and only because the chain was walked',
    pill.state === 'ok' && pill.text === 'Verified', `${pill.text} (${pill.state})`);
  check('the status strip reports how many records were verified',
    /Fingerprints: 4 verified/.test(pill.strip || ''), pill.strip);

  await page.screenshot({ path: path.join(OUT, '01-room-full.png') });

  /* ---------- synchronised highlighting ---------- */
  await page.click('.nego-room .nego-card');
  await page.waitForTimeout(300);
  const sync = await page.evaluate(() => {
    const act = sel => document.querySelectorAll(sel).length;
    return {
      baseline: act('.nego-room .nego-pane.baseline .nego-clause.is-active'),
      working: act('.nego-room .nego-pane.working .nego-clause.is-active'),
      card: act('.nego-room .nego-card.is-active'),
      badge: act('.nego-room .nego-badge.is-active'),
    };
  });
  check('clicking a card lights the clause in all three panes at once',
    sync.baseline === 1 && sync.working === 1 && sync.card === 1,
    `baseline ${sync.baseline}, working ${sync.working}, card ${sync.card}, badge ${sync.badge}`);
  await page.screenshot({ path: path.join(OUT, '02-sync-highlight.png') });

  /* ---------- a decision, and what it looks like ---------- */
  const firstId = await page.evaluate(() => document.querySelector('.nego-room [data-nego-accept]').getAttribute('data-nego-accept'));
  await page.click(`.nego-room [data-nego-accept="${firstId}"]`);
  await page.waitForTimeout(400);
  const accepted = await page.evaluate(id => {
    const badge = document.querySelector(`.nego-room .nego-pane.working [data-badge="${id}"]`);
    const clause = badge.closest('.nego-clause');
    return { badge: badge.textContent.trim(), cls: badge.className,
      note: (clause.querySelector('.nego-note') || {}).textContent || '',
      hasDel: !!clause.querySelector('.nego-del'),
      text: clause.querySelector('p').textContent.replace(/\s+/g, ' ').trim().slice(0, 80) };
  }, firstId);
  check('an accepted change gains a tick and the wording moves',
    /✓$/.test(accepted.badge) && /is-accepted/.test(accepted.cls) && !accepted.hasDel
      && /forty-five \(45\)/.test(accepted.text),
    `${accepted.badge} · ${accepted.note} · ${accepted.text.slice(0, 50)}…`);
  await page.screenshot({ path: path.join(OUT, '03-accepted.png') });

  /* ---------- the clause tools ---------- */
  await page.hover('.nego-room .nego-pane.working .nego-clause');
  await page.waitForTimeout(200);
  const tools = await page.evaluate(() => {
    const c = document.querySelector('.nego-room .nego-pane.working .nego-clause');
    const t = c.querySelector('.nego-tools');
    if (!t) return null;
    const r = t.getBoundingClientRect(), b = c.querySelector('p').getBoundingClientRect();
    return { opacity: getComputedStyle(t).opacity, left: Math.round(r.x), textRight: Math.round(b.right),
      buttons: Array.from(t.querySelectorAll('button')).map(x => x.textContent.trim()) };
  });
  check('the clause tools appear on hover, in the opposite margin',
    tools && Number(tools.opacity) === 1 && tools.left >= tools.textRight,
    tools ? `opacity ${tools.opacity}, left ${tools.left}px ≥ text right ${tools.textRight}px, [${tools.buttons.join(', ')}]` : 'missing');
  await page.screenshot({ path: path.join(OUT, '04-clause-tools.png') });

  await browser.close();
  srv.close();

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  console.log('measurements:', JSON.stringify(layout));
  if (failed.length){ console.log('FAILED:', failed.map(f => f.name).join('; ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
