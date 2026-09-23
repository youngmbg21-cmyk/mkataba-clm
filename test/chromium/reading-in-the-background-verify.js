/* Chromium verification: PLAIN ENGLISH READS IN THE BACKGROUND
   (fix 6, Young's go on the preview, 23 Sep 2026)
   ============================================================
   f373 proves the route; this file proves what the owner SEES, on a 130-clause
   contract whose middle page the stand-in holds back until the test lets it go:

     1  pressing Plain English opens the column AT ONCE — it no longer waits
        for the whole contract — with the lit half of the switch still
        pressable;
     2  while the middle page is out, the column's own heading says
        "Reading 70 of 130", seventy readings stand beside their clauses and a
        quiet "Reading…" stands beside each of the sixty still to come, level
        with its own clause;
     3  leaving the page and coming back finds it still going: the second press
        JOINS the reading, and the provider is not asked again;
     4  when the page lands the column is whole, the heading says nothing about
        reading, and no "Reading…" is left.

   AT THE PARENT 8 of 16 are red — the report reproduced: `{"open":false}` and
   `aria-pressed false · disabled true` a moment after the press, because the
   column waited for the whole contract. The eight that pass there are the
   END state (the parent does finish, eventually) and 3b, which passes there
   only because the parent's press was refused outright while it read.

   Every driven half is GUARDED so a build without it REPORTS, never hangs.
   Run: node test/chromium/reading-in-the-background-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'reading-in-the-background');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const N = 130;
const body = '<h1>MASTER SERVICES AGREEMENT</h1>' + Array.from({ length: N }, (_, k) =>
  `<h2>${k + 1}. Clause ${k + 1}</h2><p>The Supplier shall perform the obligations in this clause ${k + 1} with reasonable skill and care, in accordance with good industry practice.</p>`).join('');

/* THE STAND-IN READS THE PAGE IT WAS SENT and answers under each row's own key,
   echoing each row's own heading — and HOLDS the page carrying clause 61 until
   the test releases it. */
function startProvider(){
  const calls = [];
  let release = null;
  const gate = { held: new Promise(r => { release = r; }) };
  const answer = b => {
    const rows = [...String(b.messages[0].content).matchAll(/\[(R\d{1,3})\] (?:CLAUSE|SECTION)[^\n]*\nheading: ([^\n]*)/g)];
    return [{ type: 'tool_use', id: 'tu', name: 'clause_readings', input: { readings: rows.map(m => ({
      key: m[1], heading: m[2], plain: `In plain words, ${m[2]} asks for care and skill.` })) } }];
  };
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let raw = ''; req.on('data', d => { raw += d; });
      req.on('end', () => {
        let b = {}; try { b = JSON.parse(raw); } catch (_) {}
        calls.push(b);
        const reply = () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: 'm', type: 'message', role: 'assistant', model: 'stub', content: answer(b),
            usage: { input_tokens: 1, output_tokens: 1 }, stop_reason: 'end_turn' }));
        };
        const text = String(b.messages && b.messages[0] && b.messages[0].content || '');
        if (/heading: 61\. Clause 61\n/.test(text)) gate.held.then(reply); else reply();
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve({ base: 'http://127.0.0.1:' + srv.address().port, calls,
      release: () => release(), stop: () => new Promise(r => srv.close(r)) }));
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const prov = await startProvider();
  const h = await startHati({ ANTHROPIC_BASE_URL: prov.base });
  const W = await seedWorkspace(h);
  await W.admin.json('/api/contracts/MK-BG1', { method: 'PUT', body: { baseVersion: 0, contract: {
    id: 'MK-BG1', name: 'Master services agreement', counterparty: 'Nordvane AB', party: 'Highland Corporate Ltd',
    folder: 'proc', status: 'Under Review', format: 'rich', redlineText: body, fields: {}, comments: [], rounds: [],
    versions: [], signatures: [], compliance: {}, audit: [], obligations: [] } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  let posts = 0;
  try {
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (r.method() === 'POST' && /\/api\/ai\/readings$/.test(r.url())) posts++; });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    const openDocs = async () => {
      await page.evaluate(() => openWorkspace('MK-BG1')).catch(() => {});
      await page.waitForTimeout(1000);
      await page.evaluate(() => roomGoTab(getContract('MK-BG1'), 'docs')).catch(() => {});
      await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1200);
    };
    const pressPlain = async () => {
      const b = await page.$('.doc-read-seg button[data-doc-read="1"]');
      if (!b) return false;
      try { await b.click({ timeout: 3000 }); return true; } catch (_) { return false; }
    };
    const read = () => page.evaluate(() => {
      const layer = document.getElementById('doc-read');
      const head = layer && layer.querySelector('.doc-read-head');
      const btn = document.querySelector('.doc-read-seg button[data-doc-read="1"]');
      const canvas = document.getElementById('doc-canvas');
      const heads = canvas ? [...canvas.querySelectorAll('h2')] : [];
      const waits = [...document.querySelectorAll('.doc-read-wait')];
      /* LEVEL WITH ITS OWN CLAUSE: the wait for clause 61 against the paper's
         own "61. Clause 61" heading. */
      const h61 = heads.find(h => /^61\. Clause 61/.test((h.textContent || '').trim()));
      const w61 = waits.find(w => /^61\./.test((w.textContent || '').trim()));
      return {
        open: !!layer && !layer.hidden,
        head: head ? head.textContent.replace(/\s+/g, ' ').trim() : '',
        notes: document.querySelectorAll('.doc-read-note').length,
        waits: waits.length,
        waitText: w61 ? w61.textContent.replace(/\s+/g, ' ').trim() : '',
        level: (h61 && w61) ? Math.round(Math.abs(h61.getBoundingClientRect().top - w61.getBoundingClientRect().top)) : null,
        lit: btn ? btn.getAttribute('aria-pressed') : null,
        dead: btn ? !!btn.disabled : null,
      };
    }).catch(() => ({ open: false, head: '', notes: -1, waits: -1, waitText: '', level: null, lit: null, dead: null }));

    /* ===== 1. THE COLUMN OPENS ON THE PRESS ===== */
    await openDocs();
    const pressed = await pressPlain();
    check('1- the Plain English half could be pressed', pressed);
    await page.waitForTimeout(700);
    const early = await read();
    check('1a the column is open within a moment of the press — it does not wait for the whole contract',
      early.open, JSON.stringify({ open: early.open, head: early.head.slice(0, 60) }));
    check('1b the half that opened it is lit and still pressable', early.lit === 'true' && early.dead === false,
      `aria-pressed ${early.lit} · disabled ${early.dead}`);

    /* ===== 2. HALF WAY THROUGH ===== */
    let mid = early;
    for (let k = 0; k < 20 && !(mid.notes >= 70); k++) { await page.waitForTimeout(400); mid = await read(); }
    await page.screenshot({ path: path.join(OUT, '02-half-way.png') }).catch(() => {});
    check('2a the heading says how far it has got', /Reading 70 of 130/i.test(mid.head), mid.head.slice(0, 80));
    check('2b seventy readings stand beside their clauses', mid.notes === 70, mid.notes);
    check('2c and a quiet "Reading…" beside each of the sixty still to come', mid.waits === 60, mid.waits);
    check('2d the "Reading…" beside clause 61 carries its own number', /^61\.\s*Reading/.test(mid.waitText), mid.waitText);
    check('2e and stands level with its own clause', mid.level != null && mid.level <= 4, mid.level + 'px');
    await page.evaluate(() => {
      const h = [...document.querySelectorAll('#doc-canvas h2')].find(x => /^59\. Clause 59/.test(x.textContent.trim()));
      const sc = document.getElementById('doc-scroll');
      if (h && sc) sc.scrollTop += h.getBoundingClientRect().top - sc.getBoundingClientRect().top - 40;
    }).catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '02b-still-to-come.png') }).catch(() => {});

    /* ===== 3. LEAVE, COME BACK, AND IT IS STILL GOING ===== */
    await page.evaluate(() => setView('register')).catch(() => {});
    await page.waitForTimeout(1500);
    const postsBefore = posts, callsBefore = prov.calls.length;
    await openDocs();
    const back = await read();
    check('3- coming back lands on Contract View (the 23 Sep ruling)', !back.open, JSON.stringify({ open: back.open }));
    await pressPlain();
    await page.waitForTimeout(2200);
    const joined = await read();
    check('3a pressing Plain English again shows the reading still going', joined.open && /Reading 70 of 130/i.test(joined.head),
      joined.head.slice(0, 80));
    check('3b and the provider was not asked again', prov.calls.length === callsBefore,
      `${prov.calls.length - callsBefore} new call(s), ${posts - postsBefore} press(es) sent`);

    /* ===== 4. IT FINISHES WHOLE ===== */
    prov.release();
    let end = joined;
    for (let k = 0; k < 25 && !(end.notes >= N); k++) { await page.waitForTimeout(400); end = await read(); }
    await page.screenshot({ path: path.join(OUT, '04-whole.png') }).catch(() => {});
    check('4a every clause has its reading', end.notes === N, end.notes);
    check('4b no "Reading…" is left', end.waits === 0, end.waits);
    check('4c and the heading no longer says it is reading', !/Reading/i.test(end.head.replace(/^PLAIN ENGLISH/i, '')), end.head.slice(0, 80));
    check('4d three pages were read in all, for two presses', prov.calls.length === 3, prov.calls.length);
  } catch (e) {
    check('the run completed', false, e && e.message);
  } finally {
    check('no page errors', errors.length === 0, errors.length ? errors.slice(0, 3).join(' | ') : 'clean');
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    await prov.stop().catch(() => {});
  }
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
