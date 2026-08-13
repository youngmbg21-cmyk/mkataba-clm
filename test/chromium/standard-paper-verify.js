/* Chromium verification: company standard paper is a window per clause
   ============================================================
   The reported document (Young, 04 Aug 2026) — a freight and logistics
   agreement brought in as company standard paper, whose ONLY heading is its
   own name and whose clauses are ordinary numbered paragraphs. In the browser
   it drew as ONE clause box holding the whole agreement, with one Direct Edit
   button at the foot of the page.

   jsdom pins the clause model and the markup (test/f145). What it cannot see is
   the thing that was reported: how many boxes a reader actually looks at, and
   whether a verb is reachable on the clause under their pointer. That is
   measured here, off getBoundingClientRect on the real page.

   Screenshots go to test/chromium/shots/standard-paper/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'standard-paper');
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

/* Exactly what templateFormDocHtml emits for the reported .docx. */
const FREIGHT = [
  '<h1>FREIGHT &amp; LOGISTICS SERVICES AGREEMENT</h1>',
  '<p>Contract No. LOG-2026-0042</p>',
  '<p>This Agreement is entered into on 4 August 2026 between:</p>',
  '<p>Nordkraft Bygg AB, Reg. No. 556677-8899, Årstäängsvägen 21, 117 43 Stockholm, Sweden ("Customer"); and</p>',
  '<p>Baltic Line Transport ApS, CVR No. 41229876, Havnegade 12, 1058 Copenhagen, Denmark ("Carrier").</p>',
  '<p>1. Services. Carrier shall provide road freight transport of palletised construction materials between Customer sites in Sweden and Denmark.</p>',
  '<p>2. Term. This Agreement starts on 1 September 2026 and runs for twelve (12) months, renewing automatically for further twelve-month periods.</p>',
  '<p>3. Rates &amp; Payment. Rates are set out in Annex A. Invoices are issued monthly and payable within forty-five (45) days.</p>',
  '<p>4. Service Levels. Carrier shall achieve 95% on-time delivery measured monthly.</p>',
  '<p>5. Liability. Carrier’s liability for loss or damage to goods is governed by the CMR Convention.</p>',
  '<p>6. Insurance. Carrier shall maintain CMR liability insurance of at least EUR 500,000 per event.</p>',
  '<p>7. Subcontracting. Carrier may subcontract up to 30% of shipment volume with Customer’s prior written consent.</p>',
  '<p>8. Termination. Either party may terminate for material breach not remedied within thirty (30) days of written notice.</p>',
  '<p>9. Confidentiality. Each party shall keep the other’s pricing, volumes and business information confidential.</p>',
  '<p>10. Governing Law. This Agreement is governed by Swedish law. Disputes shall be settled by the Stockholm District Court.</p>',
  '<p>Signed by the duly authorised representatives of the parties:</p>',
].join('');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/redline.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => check('no page error', false, e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);

  /* The harness's own contract out, the reported one in — through the same
     intake every document uses. */
  await page.evaluate(RICH => {
    const c = { id: 'MK-300', name: 'Freight & Logistics Services Agreement',
      counterparty: 'Baltic Line Transport ApS', template: 'WH', status: 'Under Review',
      folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
      signatures: [], comments: [], redlineText: RICH, format: 'rich' };
    negoInit(c);
    state.contracts.unshift(c);
    state.activeId = c.id;
    state.view = 'redline';
    renderRedline();
  }, FREIGHT);
  await pause(300);
  await page.screenshot({ path: path.join(OUT, '01-clauses.png'), fullPage: false });

  /* ---- 1. how many boxes does the reader see ---- */
  const boxes = await page.evaluate(() => {
    const els = [...document.querySelectorAll('#rl-doc .rl-clause[data-clause]')];
    return els.map(el => {
      const r = el.getBoundingClientRect();
      return { h: Math.round(r.height), text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) };
    });
  });
  check('1 the agreement is more than one clause box', boxes.length > 1, `${boxes.length} boxes`);
  check('1 no box holds the whole agreement',
    !boxes.some(b => /Termination/.test(b.text) && /Governing Law/.test(b.text)),
    boxes.map(b => b.text.slice(0, 18)).join(' | ').slice(0, 200));

  /* ---- 2. a verb on each of them, not one at the foot of the page ---- */
  const verbs = await page.evaluate(() => {
    const els = [...document.querySelectorAll('#rl-doc .rl-clause[data-clause]')];
    return { clauses: els.length,
      edit: els.filter(el => el.querySelector('[data-nego-edit]')).length,
      ai: els.filter(el => el.querySelector('[data-nego-ai-clause]')).length };
  });
  check('2 every clause carries Direct Edit', verbs.edit === verbs.clauses,
    `${verbs.edit} of ${verbs.clauses}`);
  check('2 every clause carries the Copilot', verbs.ai === verbs.clauses,
    `${verbs.ai} of ${verbs.clauses}`);

  /* ---- 3. the toolbar sits on ITS clause, not somewhere down the page ----
     The reported symptom in one number: the distance from the button to the
     bottom of the clause it belongs to. */
  const drift = await page.evaluate(() => {
    const els = [...document.querySelectorAll('#rl-doc .rl-clause[data-clause]')];
    let worst = 0, which = '';
    for (const el of els){
      const btn = el.querySelector('[data-nego-edit]');
      if (!btn) continue;
      const d = Math.abs(btn.getBoundingClientRect().bottom - el.getBoundingClientRect().bottom);
      if (d > worst){ worst = d; which = (el.textContent || '').trim().slice(0, 24); }
    }
    return { worst: Math.round(worst), which };
  });
  check('3 no clause\'s verbs are more than 20px from its own foot',
    drift.worst <= 20, `${drift.worst}px (${drift.which})`);

  /* ---- 4. clause 8 is workable without opening clause 1 ---- */
  const eight = await page.evaluate(() => {
    const el = [...document.querySelectorAll('#rl-doc .rl-clause[data-clause]')]
      .find(x => /^8\. Termination/.test((x.textContent || '').trim()));
    if (!el) return null;
    el.querySelector('[data-nego-edit]').click();
    const ed = document.querySelector('[data-nego-editor]');
    return { opened: !!ed, inClause: !!(ed && el.contains(ed)),
      text: ed ? (ed.textContent || '').replace(/\s+/g, ' ').trim() : '' };
  });
  check('4 Direct Edit on clause 8 opens on clause 8', !!(eight && eight.opened && eight.inClause),
    eight ? eight.text.slice(0, 60) : 'clause 8 not found');
  check('4 and it holds clause 8 alone',
    !!eight && /^8\. Termination/.test(eight.text) && !/Governing Law/.test(eight.text),
    eight ? String(eight.text.length) + ' chars' : '');
  await page.screenshot({ path: path.join(OUT, '02-editing-clause-8.png'), fullPage: false });

  /* ---- 5. the Copilot opens from the clause, with the clause in it ---- */
  const menu = await page.evaluate(() => {
    document.querySelector('[data-nego-cancel]')?.click();
    const el = [...document.querySelectorAll('#rl-doc .rl-clause[data-clause]')]
      .find(x => /^9\. Confidentiality/.test((x.textContent || '').trim()));
    if (!el) return null;
    el.querySelector('[data-nego-ai-clause]').click();
    const m = document.querySelector('.nego-selmenu');
    if (!m) return { open: false };
    const r = m.getBoundingClientRect();
    const btn = el.querySelector('[data-nego-ai-clause]').getBoundingClientRect();
    return { open: true, onScreen: r.top >= 0 && r.left >= 0
        && r.bottom <= window.innerHeight && r.right <= window.innerWidth,
      box: { top: Math.round(r.top), left: Math.round(r.left),
        bottom: Math.round(r.bottom), right: Math.round(r.right) },
      btn: { top: Math.round(btn.top), left: Math.round(btn.left), bottom: Math.round(btn.bottom) },
      win: { w: window.innerWidth, h: window.innerHeight },
      text: (m.textContent || '').replace(/\s+/g, ' ').trim(),
      items: m.querySelectorAll('[data-nego-ai]').length };
  });
  check('5 the Copilot menu opens from the clause toolbar', !!(menu && menu.open));
  check('5 it is scoped to that clause', !!menu && /This clause/.test(menu.text)
    && /Confidentiality/.test(menu.text), menu ? menu.text.slice(0, 70) : '');
  check('5 it offers the Copilot actions', !!menu && menu.items >= 1, menu ? menu.items : 0);
  check('5 and it is drawn on screen', !!menu && menu.onScreen,
    menu && JSON.stringify({ menu: menu.box, btn: menu.btn, win: menu.win }));
  await page.screenshot({ path: path.join(OUT, '03-copilot-on-clause.png'), fullPage: false });

  await browser.close();
  srv.close();
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed · shots in ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
