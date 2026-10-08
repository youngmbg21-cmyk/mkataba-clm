/* Chromium verification: A PASS IS A HAND-OFF (Young, 8 Oct 2026: "fix the
   two broken rules" — the nine flow rules 3 and 8)
   ============================================================
   f562 proves the record and the walls; this file proves what the COLLEAGUE
   sees after somebody passed them a contract for review:

     1  their Contracts page: the contract's checklist names who sent it and
        the note, with one "Done" button
     2  their bell carries the same hand-off
     3  "Done" answers it: the row goes, the saved record says yes, and the
        History line the SERVER wrote when it was sent is on the trail
*/
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'a-pass-is-a-hand-off');
const EXEC = process.env.CHROMIUM_BIN
  || ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => { try { return fs.existsSync(p); } catch (_) { return false; } });

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 200) : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const mate = W.users.unrestricted;
  const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.';
  const c = fixtureContract('MK-HO1', 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 480000, 'Under Review', DOC);
  await W.admin.json('/api/contracts/MK-HO1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const sent = await W.admin.json('/api/contracts/MK-HO1/pass', { method: 'POST', body: { memberId: mate.id, note: 'Please check the term', review: true } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1600, height: 950 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = (fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'everything@example.co.ke');
    await page.fill('#li-pass', 'their-own-pass-9');
    await page.click('#li-go');
    await until(() => !!window.state && Array.isArray(state.contracts) && state.contracts.some(k => k.id === 'MK-HO1'), null, 15000);

    /* ===== 1. THE CHECKLIST ON THEIR CONTRACTS PAGE ===== */
    await page.evaluate(() => setView('register'));
    await until(() => !!document.querySelector('tr[data-row="MK-HO1"]'));
    await page.click('tr[data-row="MK-HO1"]');
    const shown = await until(() => !!document.querySelector('#ins-panel [data-ins-need-row="look"]'));
    const row = await page.evaluate(() => { const r = document.querySelector('#ins-panel [data-ins-need-row="look"]');
      if (!r) return null; const b = r.querySelector('[data-ins-need="look"]'); const rc = r.getBoundingClientRect();
      return { text: r.textContent.replace(/\s+/g, ' ').trim(), btn: b ? b.textContent.trim() : '', h: Math.round(rc.height) }; });
    check('1 the checklist names who sent it for review', shown && row && /Amina Otieno asked you to review/.test(row.text), row && row.text);
    check('1b and carries the note', !!row && /Please check the term/.test(row.text));
    check('1c with one "Done" button, painted', !!row && row.btn === 'Done' && row.h > 0, row && `${row.btn} ${row.h}px`);
    await page.screenshot({ path: path.join(OUT, '01-checklist.png') });

    /* ===== 2. THE BELL ===== */
    const bell = await page.evaluate(() => (window.buildAlerts ? buildAlerts() : []).filter(a => a && (a.kind === 'look' || a.k === 'look'))
      .map(a => String(a.text || a.title || '')));
    check('2 their bell carries the hand-off', bell.length === 1 && /asked you to review/.test(bell[0]), JSON.stringify(bell));

    /* ===== 3. DONE ===== */
    await page.click('#ins-panel [data-ins-need="look"]');
    const gone = await until(() => !document.querySelector('#ins-panel [data-ins-need-row="look"]'));
    check('3 Done takes the row away', gone);
    if (await page.evaluate(() => typeof flushSaves === 'function')) await page.evaluate(() => flushSaves()).catch(() => {});
    let rec = null;
    for (let k = 0; k < 40; k++) {
      rec = await W.admin.json('/api/contracts/MK-HO1');
      const a = ((rec.contract || rec).asks || []).find(x => x.id === sent.askId);
      if (a && a.state === 'yes') break;
      await new Promise(r => setTimeout(r, 150));
    }
    const C = (rec && (rec.contract || rec)) || {};
    const ask = (C.asks || []).find(x => x.id === sent.askId);
    check('3b the saved record says it is done, in their name', !!ask && ask.state === 'yes' && ask.answeredBy && ask.answeredBy.name === mate.name,
      ask && JSON.stringify({ state: ask.state, by: ask.answeredBy }));
    check('3c the trail holds the server\'s two lines: sent, and looked at', (C.audit || []).some(x => x.action === 'Sent to a colleague')
      && (C.audit || []).some(x => x.action === 'Looked at it'));
    const bellAfter = await page.evaluate(() => (window.buildAlerts ? buildAlerts() : []).filter(a => a && (a.kind === 'look' || a.k === 'look')).length);
    check('3d and the bell is quiet', bellAfter === 0, String(bellAfter));
    check('9 no page errors', !errors.length, errors.join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
