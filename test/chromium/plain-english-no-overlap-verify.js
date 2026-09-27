/* Chromium verification: NOTHING IN THE PLAIN ENGLISH COLUMN IS DRAWN ON TOP
   OF ANYTHING ELSE (Young reported it 26 Sep 2026)
   ============================================================
   "When the contract is loading the page says reading clause X and when the
   translation to plain English comes up, the words reading still display
   beneath the translation so they are on top of each other."

   TWO FAULTS, ONE SYMPTOM, both measured before a line moved:

     1  A LATER PAGE LANDS FIRST. Three pages of a long contract are read at
        once, so clauses 61-120 can come back before 1-60. The mirror of the
        front matter stopped at the first PAIRED clause — clause 61 — so the
        WORDING of clauses 1 to 60 was copied into the column, and each of
        their "Reading…" lines was drawn on top of that copy. At the parent,
        with the first page held back: 104 lines drawn over each other.

     2  A LONG PREAMBLE. The column is narrower than the paper, so a recital
        wraps onto more lines here than there, and the floor is reset under
        the mirror so the first reading keeps its own clause's line. The tail
        of the copy was drawn under the first clause's reading. At the parent:
        5 lines drawn over each other.

   Every check below that could pass on an empty page is GATED on the column
   actually holding what it measures, so a build without the feature REPORTS.
   Run: node test/chromium/plain-english-no-overlap-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'plain-english-no-overlap');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const N = 130;
const LONG = '<h1>MASTER SERVICES AGREEMENT</h1><p>THIS AGREEMENT is made between the parties named below.</p>'
  + Array.from({ length: N }, (_, k) => `<h2>${k + 1}. Clause ${k + 1}</h2><p>The Supplier shall perform the obligations in this clause ${k + 1} with reasonable skill and care, in accordance with good industry practice.</p>`).join('');
const recital = k => `<p>WHEREAS the Supplier (${k}) carries on the business of manufacturing, packaging, warehousing and distributing fast-moving consumer goods across East Africa and has represented that it holds every licence, permit and approval required to do so in each territory in which it operates.</p>`;
const PREAMBLE = '<h1>MASTER SERVICES AGREEMENT</h1>' + [1, 2, 3, 4, 5].map(recital).join('')
  + Array.from({ length: 8 }, (_, k) => `<h2>${k + 1}. Clause ${k + 1}</h2><p>The Supplier shall perform the obligations in this clause ${k + 1} with reasonable skill and care.</p>`).join('');

/* THE STAND-IN READS THE PAGE IT WAS SENT and answers under each row's own
   key, echoing the row's heading — and HOLDS the page carrying clause 1 until
   the test lets it go, so a later page lands first. */
function startProvider(){
  let release = null;
  const gate = new Promise(r => { release = r; });
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
        const reply = () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: 'm', type: 'message', role: 'assistant', model: 'stub', content: answer(b),
            usage: { input_tokens: 1, output_tokens: 1 }, stop_reason: 'end_turn' }));
        };
        const text = String(b.messages && b.messages[0] && b.messages[0].content || '');
        if (/heading: 1\. Clause 1\n/.test(text) && /Clause 60/.test(text)) gate.then(reply); else reply();
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve({ base: 'http://127.0.0.1:' + srv.address().port,
      release: () => release(), stop: () => new Promise(r => srv.close(r)) }));
  });
}

const CONTRACT = (id, body) => ({ baseVersion: 0, contract: {
  id, name: 'Master services agreement', counterparty: 'Nordvane AB', party: 'Highland Corporate Ltd',
  folder: 'proc', status: 'Under Review', format: 'rich', redlineText: body, fields: {}, comments: [], rounds: [],
  versions: [], signatures: [], compliance: {}, audit: [], obligations: [] } });

/* Every pair of drawn things in the column whose boxes share more than a
   pixel of height. A mirror hidden by the cut does not count — it is not drawn. */
const measure = page => page.evaluate(() => {
  const drawn = el => getComputedStyle(el).display !== 'none';
  const box = el => { const r = el.getBoundingClientRect(); return { t: r.top, b: r.bottom, txt: (el.textContent || '').trim().slice(0, 40) }; };
  const waits = [...document.querySelectorAll('.doc-read-wait')].map(box);
  const mirrors = [...document.querySelectorAll('.doc-read-mirror')].filter(drawn).map(box);
  const notes = [...document.querySelectorAll('.doc-read-note')].map(box);
  const all = waits.concat(mirrors, notes);
  let over = 0; const sample = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j];
    if (a.t < b.b - 1 && b.t < a.b - 1) { over++; if (sample.length < 3) sample.push(a.txt + ' ⟂ ' + b.txt); }
  }
  /* A mirrored block that carries a CLAUSE'S wording is the fault itself. */
  const clauseCopies = [...document.querySelectorAll('.doc-read-mirror')]
    .filter(m => /The Supplier shall perform the obligations in this clause/.test(m.textContent || '')).length;
  const head = document.querySelector('.doc-read-head');
  return { waits: waits.length, mirrors: mirrors.length, notes: notes.length, over, sample, clauseCopies,
    cut: document.querySelectorAll('.doc-read-mirror.is-cut').length,
    head: head ? head.textContent.replace(/\s+/g, ' ').trim() : '' };
}).catch(() => ({ waits: -1, mirrors: -1, notes: -1, over: -1, sample: [], clauseCopies: -1, cut: -1, head: '' }));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const prov = await startProvider();
  const h = await startHati({ ANTHROPIC_BASE_URL: prov.base });
  const W = await seedWorkspace(h);
  await W.admin.json('/api/contracts/MK-OV1', { method: 'PUT', body: CONTRACT('MK-OV1', LONG) });
  await W.admin.json('/api/contracts/MK-OV2', { method: 'PUT', body: CONTRACT('MK-OV2', PREAMBLE) });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    const openDocs = async id => {
      await page.evaluate(i => openWorkspace(i), id).catch(() => {});
      await page.waitForTimeout(900);
      await page.evaluate(i => roomGoTab(getContract(i), 'docs'), id).catch(() => {});
      await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
    };
    const pressPlain = async () => {
      const b = await page.$('.doc-read-seg button[data-doc-read="1"]');
      if (!b) return false;
      try { await b.click({ timeout: 3000 }); return true; } catch (_) { return false; }
    };

    /* ===== 1. A LATER PAGE LANDS FIRST ===== */
    await openDocs('MK-OV1');
    check('1- the Plain English half could be pressed', await pressPlain());
    let mid = await measure(page);
    for (let k = 0; k < 24 && !(mid.notes >= 70); k++) { await page.waitForTimeout(500); mid = await measure(page); }
    const reading = mid.notes >= 70 && mid.waits >= 60;
    check('1a STAGE: seventy readings landed while the first page is still out',
      reading, `${mid.notes} reading(s), ${mid.waits} "Reading…" · ${mid.head.slice(0, 40)}`);
    await page.evaluate(() => { const sc = document.getElementById('doc-scroll'); if (sc) sc.scrollTop = 600; }).catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '1-first-page-held.png') }).catch(() => {});
    check('1b no "Reading…" is drawn on top of anything in the column', reading && mid.over === 0,
      `${mid.over} overlapping pair(s)${mid.sample.length ? ': ' + mid.sample.join(' | ') : ''}`);
    check('1c no clause\'s own wording is copied into the column as front matter', reading && mid.clauseCopies === 0,
      `${mid.clauseCopies} clause(s) copied`);
    check('1d the front matter above the first clause is still mirrored', reading && mid.mirrors >= 1 && mid.mirrors <= 3,
      `${mid.mirrors} mirrored block(s)`);
    prov.release();
    let end = mid;
    for (let k = 0; k < 30 && !(end.notes >= N && end.waits === 0); k++) { await page.waitForTimeout(500); end = await measure(page); }
    check('1e when it finishes every clause has its reading and nothing overlaps',
      end.notes === N && end.waits === 0 && end.over === 0, `${end.notes} reading(s), ${end.waits} waiting, ${end.over} overlap(s)`);

    /* ===== 2. A LONG PREAMBLE ===== */
    await page.evaluate(() => setView('register')).catch(() => {});
    await page.waitForTimeout(800);
    await openDocs('MK-OV2');
    check('2- the Plain English half could be pressed', await pressPlain());
    let pre = await measure(page);
    for (let k = 0; k < 20 && !(pre.notes >= 8); k++) { await page.waitForTimeout(500); pre = await measure(page); }
    await page.waitForTimeout(500);
    pre = await measure(page);
    await page.screenshot({ path: path.join(OUT, '2-long-preamble.png') }).catch(() => {});
    const whole = pre.notes >= 8;
    check('2a STAGE: the edition is whole', whole, `${pre.notes} reading(s)`);
    check('2b the copied preamble never runs under the first clause\'s reading', whole && pre.over === 0,
      `${pre.over} overlapping pair(s)${pre.sample.length ? ': ' + pre.sample.join(' | ') : ''}`);
    check('2c where the copy had to be cut it says so (it fades)', whole && pre.cut >= 1, `${pre.cut} cut block(s)`);
    const level = await page.evaluate(() => {
      const h1 = [...document.querySelectorAll('#doc-canvas h2')].find(x => /^1\. Clause 1/.test(x.textContent.trim()));
      const n1 = [...document.querySelectorAll('.doc-read-note')].find(x => /^1\./.test(x.textContent.trim()));
      return (h1 && n1) ? Math.round(Math.abs(h1.getBoundingClientRect().top - n1.getBoundingClientRect().top)) : null;
    }).catch(() => null);
    check('2d CONTROL: the first reading still stands level with its own clause', level != null && level <= 4, level + 'px');
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
