/* NEGOTIATE, AS DRAWN (SAP benchmark, batch 4, owner 9 Oct 2026: "Keep the
   Name Redline otherwise, build").

   WHAT THIS PINS, driven in a real browser on a contract in negotiation
     1 the bar names the place, "Negotiate"
     2 the way back stands on the title's line, says "Back to Document", and
       lands on the Document tab
     3 the quiet line under the title names the Lead
     4 the facts strip steps aside, as on the Document tab
     5 the parties' colour key has a thin row of its own under the controls,
       and the control row keeps its one 44px line
     6 the reading tab keeps its name, "Redline"

   Run: node test/chromium/negotiate-as-drawn-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };
const day = off => { const t = new Date(); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };

const LIVE = { ...H.fixtureContract('MK-N1', 'Raw Milk Collection', 'Nandi Dairy Co-operative', H.FOLDER_A, 36000000, 'Under Review'),
  expiry: day(300),
  negotiation: { round: 2, rounds: [{ n: 1, at: day(-15) }] },
  changes: [
    { id: 'CHG-1', clauseId: 'cl_a2', clauseLabel: 'Article 2 Price', changeType: 'edit', status: 'pending', authorSide: 'counterparty', summary: 'Price reviewed every month', createdAt: day(-1), roundN: 2 },
  ] };

(async () => {
  const h = await H.startHati();
  await H.seedWorkspace(h, { contracts: [LIVE], approvalRules: [] });
  const b = await chromium.launch({ executablePath: EXEC });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => typeof openRedlineWorkbench === 'function' && state.contracts && state.contracts.length > 0, null, { timeout: 15000 });
    await page.evaluate(() => openWorkspace('MK-N1'));
    await page.waitForFunction(() => !!document.querySelector('#ws-tabs'), null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1200);
    await page.evaluate(() => openRedlineWorkbench('MK-N1'));
    await page.waitForFunction(() => !!document.querySelector('#view-redline #ws-head .room-name h1'), null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1200);

    const r = await page.evaluate(() => {
      const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
      const back = document.querySelector('#view-redline #ws-head .room-name #ws-back');
      const row = document.querySelector('#view-redline .rl-tabrow');
      const key = document.querySelector('#view-redline .rl-keyrow .rl-ctl-legend');
      const rr = row && row.getBoundingClientRect(), kr = key && key.getBoundingClientRect();
      return {
        bar: ((document.getElementById('shell-title') || {}).textContent || '').trim(),
        back: back ? back.textContent.replace(/\s+/g, ' ').trim() : null,
        backBeforeTitle: !!(back && back.nextElementSibling && back.parentElement.querySelector('h1')
          && back.getBoundingClientRect().right <= back.parentElement.querySelector('h1').getBoundingClientRect().left + 1),
        sub: ((document.querySelector('#view-redline #ws-head .room-sub') || {}).textContent || '').replace(/\s+/g, ' '),
        facts: vis(document.querySelector('#view-redline #ws-head .room-facts')),
        rowH: rr ? Math.round(rr.height) : null,
        keyInRow: !!(row && row.querySelector('.rl-ctl-legend')),
        keyUnder: !!(kr && rr && vis(key) && kr.top >= rr.bottom - 1),
        keyText: key ? key.textContent.replace(/\s+/g, ' ').trim() : '',
        tab: ((document.querySelector('#view-redline .rl-readwrap .rl-seg.on') || {}).textContent || '').replace(/\s+/g, ' ').trim() };
    });

    console.log('\n1 · the bar');
    ok('1 the bar names the place, Negotiate', r.bar === 'Negotiate', r.bar);
    console.log('\n2 · the way back');
    ok('2a it stands on the title\'s line, left of the name', r.backBeforeTitle, String(r.back));
    ok('2b and says Back to Document', /Back to Document/.test(r.back || ''), String(r.back));
    console.log('\n3 · the quiet line');
    ok('3 it names the Lead', /Lead: /.test(r.sub), r.sub);
    console.log('\n4 · the facts');
    ok('4 the facts strip steps aside', !r.facts);
    console.log('\n5 · the colour key');
    ok('5a the key has its own row under the controls', !r.keyInRow && r.keyUnder && /Nandi Dairy/.test(r.keyText), r.keyText);
    ok('5b the control row keeps its one 44px line', r.rowH === 44, String(r.rowH));
    console.log('\n6 · the name');
    ok('6 the reading tab is still called Redline', /^Redline/.test(r.tab), r.tab);

    if (r.backBeforeTitle) {
      await page.click('#view-redline #ws-head .room-name #ws-back');
      await page.waitForFunction(() => !!document.querySelector('#ws-tabs [data-ws-tab="docs"].on'), null, { timeout: 8000 }).catch(() => {});
      ok('2c pressing it lands on the Document tab',
        await page.evaluate(() => !!document.querySelector('#ws-tabs [data-ws-tab="docs"].on')));
    }
  } catch (e) {
    fail++; console.log('  FAIL harness — ' + e.message);
  }
  ok('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close();
  await h.stop();
  process.exit(fail ? 1 : 0);
})();
