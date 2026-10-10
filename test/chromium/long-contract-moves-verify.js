/* Chromium verification: A LONG CONTRACT MOVES LIKE ANY OTHER (Young, 9–10 Oct
   2026: "when I try to navigate through this contract inside Hati, it is slow
   and dragging" · "It moving from tab to tab" · a 9,562-word part, "94% of the
   paper", that Plain could never read — option 1 chosen)
   ============================================================
   f656 proves the readings; this file proves what the owner SEES:
     1  Negotiate on a 250-clause contract freezes the page for under twelve
        times what it does on an 8-clause one (at the parent: about seventy
        times — every clause split the whole contract again)
     2  a certificate whose "PREFERRED STOCK" heading holds sections numbered
        "1." … "9." lists those sections in the clause drawer, each its own
        row, none of them past the long-part limit
     3  Plain on a section longer than one answer reads it in pieces and the
        row shows ONE reading carrying every piece
     4  Plain on a part too long even for the pieces says "too long" on its
        row and asks Copilot nothing
     5  no page errors
   A "freeze" is a browser long task. Waits ask for the state, bounded; every
   driven half is guarded so a build without it reports, never hangs.
   Run: node test/chromium/long-contract-moves-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'long-contract-moves');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

const PARA = 'The Supplier shall perform the Services described in this clause with reasonable skill and care, in accordance with good industry practice, all applicable laws and the Service Order agreed between the parties.';
const msa = n => '<h1>MASTER SERVICES AGREEMENT</h1>' + Array.from({ length: n }, (_, k) =>
  `<h2>${k + 1}. Clause ${k + 1}</h2><p>${k + 1}.1\t${PARA}</p><p>${k + 1}.2\t${PARA}</p>`).join('');
const SENT = k => `Sentence ${k} says the holders of the Series A Preferred Stock shall be paid before any other class of stock.`;
const words = chars => { let t = '', k = 0; while (t.length < chars) t += SENT(k++) + ' '; return t.trim(); };
const SECTIONS = ['Dividends', 'Liquidation', 'Voting', 'Optional Conversion', 'Mandatory Conversion', 'Redemption', 'Redeemed Shares', 'Waiver', 'Notices'];
const CERT = '<h1>CERTIFICATE OF DESIGNATION</h1><h2>SANERGY, INC.</h2><p>A Delaware corporation.</p>'
  + '<h2>COMMON STOCK</h2><p>The common stock carries one vote a share.</p>'
  + '<h2>PREFERRED STOCK</h2><p>The following rights apply to the Series A Preferred Stock.</p>'
  + SECTIONS.map((s, i) => `<p><strong>${i + 1}. ${s}.</strong></p><p>${words(i === 8 ? 30000 : 2200)}</p>`).join('')
  + `<h2>SCHEDULE OF HOLDERS</h2><p>${words(100000)}</p>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  const W = await seedWorkspace(h, { approvalRules: [] });
  const base = { counterparty: 'Sanergy, Inc.', party: 'Highland Corporate Ltd', folder: 'proc', status: 'Under Review',
    fields: {}, comments: [], rounds: [], versions: [], signatures: [], compliance: {}, audit: [], obligations: [], format: 'rich' };
  for (const [id, body] of [['MK-LM-SMALL', msa(8)], ['MK-LM-BIG', msa(250)], ['MK-LM-CERT', CERT]])
    await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: { ...base, id, name: id, redlineText: body } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 15000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(150); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 3, null, { timeout: 20000 });
    await page.evaluate(() => { window.__lt = []; new window.PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(e.duration); }).observe({ type: 'longtask' }); });

    /* ===== 1. NEGOTIATE ON A LONG CONTRACT ===== */
    const negotiateFreeze = async id => {
      await page.evaluate(i => openWorkspace(i), id);
      await until(i => state.activeId === i && !!document.getElementById('doc-canvas'), id);
      await page.waitForTimeout(1500);
      await page.evaluate(() => { window.__lt = []; roomGoTab(getContract(state.activeId), 'redline'); });
      await until(() => state.view === 'redline' && !!document.querySelector('#view-redline .rl-clause'));
      await page.waitForTimeout(800);
      return Math.round(Math.max(0, ...await page.evaluate(() => window.__lt)));
    };
    const small = await negotiateFreeze('MK-LM-SMALL');
    const big = await negotiateFreeze('MK-LM-BIG');
    check('1. Negotiate on 250 clauses freezes under twelve times what it does on 8',
      big < 12 * Math.max(small, 50), `250 clauses ${big} ms · 8 clauses ${small} ms`);
    await page.screenshot({ path: path.join(OUT, '01-negotiate-250.png') });

    /* ===== 2. THE CERTIFICATE'S SECTIONS ARE ITS PARTS ===== */
    await page.evaluate(() => { openWorkspace('MK-LM-CERT'); });
    await until(() => state.activeId === 'MK-LM-CERT' && !!document.getElementById('doc-canvas'));
    await page.evaluate(() => { const c = getContract('MK-LM-CERT'); roomGoTab(c, 'docs'); if (window.docThreadDrawerSet) docThreadDrawerSet(c, true); });
    await until(() => document.querySelectorAll('#doc-thread .doc-th-row').length > 3);
    const parts = await page.evaluate(() => (typeof docReadSheet === 'function' ? docReadSheet(getContract('MK-LM-CERT')) : [])
      .map(r => ({ num: r.num || '', name: (r.ownHead || r.heading || '').slice(0, 40), words: r.text.split(/\s+/).length })));
    const sec = SECTIONS.map(s => parts.findIndex(p => p.name.startsWith(s)));
    check('2a every section under PREFERRED STOCK is its own part, numbered 1 to 9',
      sec.every((at, i) => at >= 0 && parts[at].num === String(i + 1)), parts.map(p => `${p.num || '-'} ${p.name.slice(0, 18)} ${p.words}w`).join(' | '));
    const drawn = await page.evaluate(() => [...document.querySelectorAll('#doc-thread .doc-th-row')].map(r => r.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)));
    check('2b and the clause drawer draws a row for each', SECTIONS.every(s => drawn.some(t => t.includes(s))), drawn.length + ' rows');
    const giant = parts.filter(p => p.words > 1500 && !/SCHEDULE/.test(p.name) && !p.name.startsWith('Notices'));
    check('2c no part but the two genuinely long ones is past the long-part limit', giant.length === 0, JSON.stringify(giant));
    await page.screenshot({ path: path.join(OUT, '02-certificate-sections.png') });

    const rowOf = name => page.evaluate(n => { const rows = docReadSheet(getContract('MK-LM-CERT')); return rows.findIndex(r => (r.ownHead || r.heading || '').startsWith(n)); }, name);
    const press = async i => {
      await page.evaluate(k => { const b = document.querySelector(`#doc-thread [data-th-go="${k}"]`); if (b) b.click(); }, i);
      /* SLOW-RUNNER WAIT (10 Oct 2026, "get main to green"): a fixed 1.2 s
         pause here was not always enough on GitHub's runner — the pressed row
         had not opened yet, so its Plain was never pressed. Ask for the state:
         the pressed row is the open one and carries its Plain, bounded. */
      await page.waitForFunction(k => { const r = document.querySelector('#doc-thread .doc-th-row.is-open');
        return !!(r && r.querySelector(`[data-th-go="${k}"]`) && r.querySelector('[data-th-explain]')); }, i, { timeout: 10000 }).catch(() => {});
      const btn = await page.$('#doc-thread .doc-th-row.is-open [data-th-explain]');
      if (!btn) return false;
      await btn.click(); return true;
    };
    const openText = () => page.evaluate(() => { const r = document.querySelector('#doc-thread .doc-th-row.is-open'); return r ? r.textContent.replace(/\s+/g, ' ').trim() : ''; });

    /* ===== 3. PLAIN ON A SECTION LONGER THAN ONE ANSWER ===== */
    const piece = body => { const m = /\(part (\d+) of (\d+)\)/.exec(JSON.stringify(body));
      return [{ type: 'tool_use', id: 'tu', name: 'clause_readings', input: { readings: [{ key: 'R0', heading: 'x', plain: m ? `PIECE ${m[1]} OF ${m[2]} in plain words.` : 'WHOLE in plain words.' }] } }]; };
    for (let k = 0; k < 8; k++) ai.script(piece);
    const calls0 = ai.calls.length;
    const notices = await rowOf('Notices');
    const pressed3 = notices >= 0 && await press(notices);
    await until(() => /PIECE \d+ OF \d+/.test((document.querySelector('#doc-thread .doc-th-row.is-open') || {}).textContent || ''), null, 20000);
    const t3 = await openText();
    const n3 = ai.calls.length - calls0;
    check('3. Plain on a 30,000-character section reads it in pieces and shows ONE reading carrying them all',
      pressed3 && n3 >= 2 && new RegExp(`PIECE 1 OF ${n3}`).test(t3) && new RegExp(`PIECE ${n3} OF ${n3}`).test(t3), `${n3} asks · ${t3.slice(0, 160)}`);
    await page.screenshot({ path: path.join(OUT, '03-plain-in-pieces.png') });

    /* ===== 4. TOO LONG EVEN FOR THE PIECES ===== */
    const calls1 = ai.calls.length;
    const sched = await rowOf('SCHEDULE');
    const pressed4 = sched >= 0 && await press(sched);
    await until(() => !!document.querySelector('#doc-thread .doc-th-row.is-open .doc-th-cannot'), null, 20000);
    const t4 = await openText();
    check('4. a part too long even for the pieces says "too long" on its row and asks Copilot nothing',
      pressed4 && /too long for Copilot to read in one go/.test(t4) && ai.calls.length === calls1, `${ai.calls.length - calls1} asks · ${t4.slice(0, 160)}`);
    await page.screenshot({ path: path.join(OUT, '04-too-long.png') });

    check('5. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close();
    await h.stop(); await ai.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
