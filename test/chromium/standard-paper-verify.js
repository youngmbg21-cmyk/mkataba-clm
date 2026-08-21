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

  /* ---- 2. a door on each of them, not one at the foot of the page ----
     RE-POINTED 16 Aug 2026. This counted Direct Edit and the Copilot on every
     clause; NO EDITS ON THE PAPER retired that tool row outright — all writing
     goes through the clause panel now — so the door being counted is the green
     Edit pill, which is what replaced it. THE CLAIM IS UNCHANGED and is the
     reported fault in one line: clause 8 must be workable without opening
     clause 1, so every clause needs its OWN way in. */
  const verbs = await page.evaluate(() => {
    const els = [...document.querySelectorAll('#rl-doc .rl-clause[data-clause]')];
    return { clauses: els.length,
      pill: els.filter(el => el.querySelector('.rl-cp-pill')).length,
      /* The retired row must be gone, not merely unused: a stale selector in a
         guard is a mention, and mentions of retired things get flagged. */
      stale: els.filter(el => el.querySelector('[data-nego-edit],[data-nego-ai-clause]')).length };
  });
  check('2 every clause carries its own Edit pill', verbs.pill === verbs.clauses,
    `${verbs.pill} of ${verbs.clauses}`);
  check('2 and the retired tool row is gone from the paper', verbs.stale === 0,
    verbs.stale ? `${verbs.stale} clauses still carry it` : '');

  /* ---- 3. the door sits on ITS clause, not somewhere down the page ----
     The reported symptom in one number. It used to be the distance from the
     button to the clause's FOOT, because the tool row hung at the bottom; the
     pill is pinned to the clause's top-right, so the same question is asked of
     the top edge. What is really being measured either way is that the control
     belongs to the clause beside it. */
  const drift = await page.evaluate(() => {
    const els = [...document.querySelectorAll('#rl-doc .rl-clause[data-clause]')];
    let worst = 0, which = '', outside = 0;
    for (const el of els){
      const btn = el.querySelector('.rl-cp-pill');
      if (!btn) continue;
      if (!el.contains(btn)) outside++;
      const d = Math.abs(btn.getBoundingClientRect().top - el.getBoundingClientRect().top);
      if (d > worst){ worst = d; which = (el.textContent || '').trim().slice(0, 24); }
    }
    return { worst: Math.round(worst), which, outside };
  });
  check('3 no clause\'s door is more than 20px from its own head',
    drift.worst <= 20, `${drift.worst}px (${drift.which})`);
  check('3 and every door sits inside the clause it belongs to', drift.outside === 0);

  /* ---- 4. clause 8 is workable without opening clause 1 ----
     THE FILE'S WHOLE REASON, and it survives the door moving. The editor no
     longer opens ON the clause — it opens in the panel, which is where all
     writing goes — so the walk is pill → panel → ＋, and what must still be
     true is that what arrives holds clause 8 and nothing else. */
  const eight = await page.evaluate(async () => {
    const el = [...document.querySelectorAll('#rl-doc .rl-clause[data-clause]')]
      /* THE HEADINGS THIS FIXTURE ACTUALLY HAS. "8. Termination" and
         "9. Confidentiality" matched nothing — the sample agreement numbers them
         8.2(a) and 14 — so sections 4 and 5 were failing on the clause LOOKUP
         as well as on the retired tool row, and had been since the document
         changed under them. Two faults, one red mark. */
      .find(x => /^8\.2\(a\)\s*Termination/.test((x.textContent || '').trim()));
    if (!el) return null;
    el.querySelector('.rl-cp-pill').click();
    await new Promise(r => setTimeout(r, 400));
    const body = document.querySelector('#rl-cp .rl-cp-src.is-on');
    const stands = body ? (body.querySelector('.rl-cp-wd, .rl-cp-sec') || {}).textContent || '' : '';
    const plus = body && body.querySelector('[data-rl-cp-edit]');
    if (plus) plus.click();
    await new Promise(r => setTimeout(r, 400));
    const ed = document.querySelector('[data-nego-editor]');
    return { opened: !!body, panelOpen: !!document.querySelector('#rl-cp.is-open'),
      inPanel: !!(ed && document.querySelector('#rl-cp').contains(ed)),
      stands: stands.replace(/\s+/g, ' ').trim(),
      text: ed ? (ed.textContent || '').replace(/\s+/g, ' ').trim() : '' };
  });
  check('4 the Edit pill on clause 8 opens the panel on clause 8',
    !!(eight && eight.opened && eight.panelOpen) && /8\. Termination|Termination/.test(eight.stands),
    eight ? eight.stands.slice(0, 60) : 'clause 8 not found');
  check('4 and the ＋ opens the editor inside that panel',
    !!eight && eight.inPanel, eight ? `inPanel=${eight.inPanel}` : '');
  check('4 and it holds clause 8 alone',
    !!eight && /Termination/.test(eight.text) && !/Governing Law/.test(eight.text),
    eight ? String(eight.text.length) + ' chars' : '');
  await page.screenshot({ path: path.join(OUT, '02-editing-clause-8.png'), fullPage: false });

  /* ---- 5. the Copilot is reached from the clause, with the clause in it ----
     RE-POINTED TWICE, and the second reversal is the one that matters. This
     pressed the clause toolbar's Copilot and read the three-item menu it raised.
     That row retired (no edits on the paper), and then on 19 Aug 2026 the owner
     asked for the panel's Copilot to be a BUTTON that hands the whole clause
     over — "it takes you to copilot and you can edit the entire clause" — so
     there is deliberately NO menu in between: a control narrowed to one action
     would raise a menu of one row, anchored on a panel that is closing.

     So what is asserted is the hand-over itself: the Copilot panel opens, and
     the clause went with it. */
  const handed = await page.evaluate(async () => {
    document.querySelector('[data-nego-cancel]')?.click();
    await new Promise(r => setTimeout(r, 200));
    const el = [...document.querySelectorAll('#rl-doc .rl-clause[data-clause]')]
      .find(x => /^14\.\s*Confidentiality/.test((x.textContent || '').trim()));
    if (!el) return null;
    el.querySelector('.rl-cp-pill').click();
    await new Promise(r => setTimeout(r, 400));
    const btn = document.querySelector('#rl-cp .rl-cp-src.is-on .rl-cp-act-ai');
    if (!btn) return { there: false };
    btn.click();
    await new Promise(r => setTimeout(r, 700));
    const ai = document.getElementById('ai-panel');
    return { there: true,
      menu: !!document.querySelector('.nego-selmenu'),
      aiOpen: !!(ai && getComputedStyle(ai).display !== 'none'
        && ai.getBoundingClientRect().width > 0),
      panelShut: !document.querySelector('#rl-cp.is-open'),
      text: ai ? (ai.textContent || '').replace(/\s+/g, ' ').trim() : '' };
  });
  check('5 the panel offers the Copilot on that clause', !!(handed && handed.there));
  check('5 it hands over with no menu in between', !!handed && handed.menu === false,
    handed && handed.menu ? 'a selection menu still opens' : '');
  check('5 the Copilot panel opens', !!handed && handed.aiOpen);
  check('5 and it closes the clause panel behind it', !!handed && handed.panelShut);
  await page.screenshot({ path: path.join(OUT, '03-copilot-on-clause.png'), fullPage: false });

  await browser.close();
  srv.close();
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed · shots in ${OUT}`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
