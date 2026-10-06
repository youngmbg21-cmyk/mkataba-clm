/* Chromium verification: PLAIN ENGLISH READS IN THE BACKGROUND
   (fix 6, Young's go on the preview, 23 Sep 2026)
   ============================================================
   f373 proves the route; this file proves what the owner SEES, on a 130-clause
   contract whose middle page the stand-in holds back until the test lets it go:

     1  pressing "Explain all" on the open row starts the reading AT ONCE — the
        row says so within a moment, it does not wait for the whole contract;
     2  while the middle page is out, a row still to come (clause 61, opened)
        says "Reading 70 of 130", seventy rows say "Read" and each of the sixty
        still to come says "Reading…" on its own row;
     3  leaving the page and coming back finds it still going, and the provider
        is not asked again;
     4  when the page lands every row says Read, the open row no longer says
        it is reading, and no "Reading…" is left.

   RE-POINTED 5 Oct 2026 (the Thread): the Plain English column and its switch
   became the Thread — one row per clause in the right column, the reading in
   the open row. Same claims, read off the rows.

   RE-POINTED 6 Oct 2026 (Young: "the translation is supposed to be one clause
   at a time only" / "there should never be an option to translate all
   clauses"): "Explain all" is gone. The claims are now asked of ONE clause's
   Plain press, on the held clause 61: the row says Reading… at once and only
   that row does; leaving and coming back finds it still going with no second
   call; when it lands that row shows its reading — one call in all.

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
      const b = await page.$('#doc-thread .doc-th-row.is-open [data-th-explain]');
      if (!b) return false;
      try { await b.click({ timeout: 3000 }); return true; } catch (_) { return false; }
    };
    /* clause 61 is the one the stand-in holds back */
    const open61 = async () => {
      await page.evaluate(() => {
        const r = [...document.querySelectorAll('#doc-thread .doc-th-row')].find(x => /^61\. Clause 61/.test((x.querySelector('.doc-th-name') || {}).textContent || ''));
        const b = r && r.querySelector('[data-th-go]'); if (b) b.click();
      }).catch(() => {});
      await page.waitForTimeout(1300);
    };
    const read = () => page.evaluate(() => {
      const th = document.getElementById('doc-thread');
      const open = th && th.querySelector('.doc-th-row.is-open');
      const wait = open && open.querySelector('.doc-th-wait');
      const rows = th ? [...th.querySelectorAll('.doc-th-row')] : [];
      const txt = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
      const waits = rows.filter(r => r.querySelector('.doc-th-state .is-wait'));
      const r61 = rows.find(r => /^61\. Clause 61/.test(txt(r.querySelector('.doc-th-name'))));
      return {
        open: !!th && !th.hidden && !!open,
        head: wait ? txt(wait) : '',
        notes: rows.filter(r => r.querySelector('.doc-th-state .is-read')).length,
        waits: waits.length,
        waitText: r61 ? txt(r61.querySelector('.doc-th-name')) + ' ' + txt(r61.querySelector('.doc-th-state')) : '',
        onRow: !!(r61 && r61.querySelector('.doc-th-state .is-wait')),
        all: !!(th && th.querySelector('[data-th-explain-all]')),
        openText: txt(open && open.querySelector('.doc-th-plain')),
      };
    }).catch(() => ({ open: false, head: '', notes: -1, waits: -1, waitText: '', onRow: null, all: null, openText: '' }));

    /* ===== 1. THE READING STARTS ON THE PRESS — FOR THE ONE CLAUSE ===== */
    await openDocs();
    await open61();
    const before = await read();
    check('1- there is no "Explain all" press anywhere in the thread', before.all === false, String(before.all));
    const pressed = await pressPlain();
    check('1-b Plain could be pressed on clause 61', pressed);
    await page.waitForTimeout(700);
    const early = await read();
    await page.screenshot({ path: path.join(OUT, '01-reading.png') }).catch(() => {});
    check('1a its row says Reading… within a moment of the press', early.open && /Reading/.test(early.head) && early.onRow === true,
      JSON.stringify({ head: early.head, onRow: early.onRow }));
    check('1b and ONLY that row does — no other clause is being read', early.waits === 1, early.waits);
    check('1c one call, carrying one clause', prov.calls.length === 1
      && ([...String(prov.calls[0].messages[0].content).matchAll(/\[R\d+\] CLAUSE/g)].length === 1), prov.calls.length + ' call(s)');

    /* ===== 3. LEAVE, COME BACK, AND IT IS STILL GOING ===== */
    await page.evaluate(() => setView('register')).catch(() => {});
    await page.waitForTimeout(1500);
    const postsBefore = posts, callsBefore = prov.calls.length;
    await openDocs();
    const back = await read();
    check('3- coming back, the thread is up with the paper (no mode to land on)', back.open, JSON.stringify({ open: back.open }));
    await page.waitForTimeout(1200);
    await open61();
    const joined = await read();
    check('3a and clause 61\'s row shows the reading still going, with no second press', joined.open && /Reading/.test(joined.head) && joined.onRow === true,
      joined.head.slice(0, 80) + ' · ' + joined.waitText);
    check('3b and the provider was not asked again', prov.calls.length === callsBefore,
      `${prov.calls.length - callsBefore} new call(s), ${posts - postsBefore} press(es) sent`);

    /* ===== 4. IT LANDS ===== */
    prov.release();
    let end = joined;
    for (let k = 0; k < 25 && !(end.notes >= 1 && !end.waits); k++) { await page.waitForTimeout(400); end = await read(); }
    await page.screenshot({ path: path.join(OUT, '04-landed.png') }).catch(() => {});
    check('4a clause 61\'s row says Read, and only it', end.notes === 1 && /Read/.test(end.waitText), end.notes + ' · ' + end.waitText);
    check('4b no "Reading…" is left', end.waits === 0, end.waits);
    check('4c and the open row shows its reading', end.head === '' && /Clause 61 asks for care/.test(end.openText || ''), (end.head || end.openText || '').slice(0, 80));
    check('4d one call in all, for one press', prov.calls.length === 1, prov.calls.length);
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
