/* THE OVERVIEW'S DUTIES AND TERMS, AND THE OBLIGATIONS HEAD (owner, 9 Oct
   2026):
     · the duties panel "should look similar to" Where we are's Settled card —
       "the line across the page plus header, the single sentence plus
       checkmark on each obligation"
     · The terms card "should never get bigger than its original state. If the
       sentence is long then it should go to a scroll"
     · the Obligations top bar "needs to be the same height as" Approvals &
       signing's, "so remove the we owe xxx place"
     · '"All" filter always needs to be first'

   Run: node test/chromium/overview-and-obligations-polish-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };
const day = off => { const t = new Date(); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };
const LONG = 'Nairobi Centre for International Arbitration (NCIA) under its Arbitration Rules by a sole arbitrator appointed in accordance with said Rules. The seat of arbitration shall be Nairobi, Kenya.';

const SIGNED = { ...H.fixtureContract('MK-P1', 'Warehousing Services', 'Apex Logistics', H.FOLDER_A, 48000000, 'Signed', H.FIXTURE_BODY_A1),
  expiry: day(400),
  obligations: [
    { id: 'o1', desc: 'Provide ambient and cold-chain warehousing services at the Designated Facility for the whole of the term', due: day(20), party: 'ours', status: 'open' },
    { id: 'o2', desc: 'Pay invoice within 30 days', due: day(-3), party: 'ours', status: 'open', amount: 900000 },
    { id: 'o3', desc: 'Deliver monthly volumes report', due: day(5), party: 'theirs', status: 'open' },
  ] };

(async () => {
  const h = await H.startHati();
  await H.seedWorkspace(h, { contracts: [SIGNED], approvalRules: [] });
  const b = await chromium.launch({ executablePath: EXEC });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => typeof openWorkspace === 'function' && state.contracts && state.contracts.length > 0, null, { timeout: 15000 });
    await page.evaluate(() => openWorkspace('MK-P1'));
    await page.waitForFunction(() => !!document.querySelector('#ws-tabs'), null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1200);
    await page.evaluate(() => roomGoTab(getContract('MK-P1'), 'terms'));
    await page.waitForFunction(() => !!document.querySelector('#ov-ess'), null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);

    console.log('\n1 · the duties panel reads like the Settled card');
    await page.click('[data-ov-map-tab="ours"]').catch(() => {});
    await page.waitForTimeout(500);
    const du = await page.evaluate(() => {
      const pane = document.querySelector('[data-ov-map-pane]');
      const head = pane && pane.querySelector('.ov-map-ch');
      const rows = pane ? [...pane.querySelectorAll('.ov-map-list .ov-map-ob')] : [];
      const pr = pane && pane.getBoundingClientRect(), hr = head && head.getBoundingClientRect();
      const t = rows[0] && rows[0].querySelector('.ov-map-obt');
      return { head: head ? head.textContent.replace(/\s+/g, ' ').trim() : null,
        line: !!(head && getComputedStyle(head).borderBottomStyle === 'solid' && parseFloat(getComputedStyle(head).borderBottomWidth) >= 1),
        across: !!(hr && pr && hr.left - pr.left <= 1 && pr.right - hr.right <= 1),
        groups: pane ? pane.querySelectorAll('.ov-map-grp').length : -1,
        marks: rows.map(r => (r.querySelector('.ov-map-tick') || {}).textContent || ''),
        oneLine: !!(t && Math.round(t.getBoundingClientRect().height) <= 22 && getComputedStyle(t).textOverflow === 'ellipsis'),
        dated: rows.every(r => !!(r.querySelector('.ov-map-obd') || {}).textContent) };
    });
    ok('1a a header with its count', /Duties we owe \(2\)/.test(du.head || ''), du.head);
    ok('1b and a line under it across the whole panel', du.line && du.across);
    ok('1c one flat list, no group boxes', du.groups === 0 && du.marks.length === 2, JSON.stringify(du.marks));
    ok('1d every duty carries its mark first and its date at the right', du.marks.every(m => m.trim()) && du.dated);
    ok('1e the duty is one sentence on one line', du.oneLine);

    console.log('\n2 · The terms card never grows');
    const before = await page.evaluate(() => Math.round(document.querySelector('#ov-ess').getBoundingClientRect().height));
    await page.evaluate(long => { const c = getContract('MK-P1'); c.metadata = c.metadata || {}; c.metadata.disputes = long; roomGoTab(c, 'terms'); }, LONG);
    await page.waitForTimeout(700);
    const after = await page.evaluate(() => {
      const card = document.querySelector('#ov-ess');
      const v = [...document.querySelectorAll('#ov-ess .ov-ess-g .sec-f-v')].find(x => /Nairobi Centre/.test(x.textContent));
      return { h: Math.round(card.getBoundingClientRect().height), scrolls: !!(v && v.scrollHeight > v.clientHeight && getComputedStyle(v).overflowY === 'auto'),
        keys: !!(v && v.tabIndex === 0) };
    });
    ok('2a a long answer leaves the card its height', after.h === before, `${before} → ${after.h}`);
    ok('2b and scrolls inside its own cell', after.scrolls);
    ok('2c the keyboard can reach that scroll', after.keys);

    console.log('\n3 · the Obligations head is Approvals & signing\'s height');
    const band = async v => { await page.evaluate(v => setView(v), v); await page.waitForTimeout(1200);
      return page.evaluate(() => { const b = document.querySelector('.sap-band'); const r = b && b.getBoundingClientRect();
        return { bottom: r ? r.bottom : null, facts: ((document.getElementById('page-head-facts') || {}).textContent || '').trim(),
          tabs: [...document.querySelectorAll('.sap-band [data-obw-view]')].map(x => x.getAttribute('data-obw-view')) }; }); };
    const ap = await band('approvals');
    const ob = await band('obligations');
    ok('3a its band ends where Approvals\' does', ap.bottom !== null && ob.bottom !== null && Math.abs(ap.bottom - ob.bottom) <= 1, `${ob.bottom} vs ${ap.bottom}`);
    ok('3b no "we owe" line under the title', !ob.facts, ob.facts);

    console.log('\n4 · All is first');
    ok('4a on the Obligations page', ob.tabs[0] === 'all', ob.tabs.join(','));
    await page.evaluate(() => { openWorkspace('MK-P1'); setTimeout(() => roomGoTab(getContract('MK-P1'), 'oblig'), 300); });
    await page.waitForFunction(() => !!document.querySelector('.obt-head [data-obt-view]'), null, { timeout: 8000 }).catch(() => {});
    const tabV = await page.evaluate(() => [...document.querySelectorAll('.obt-head [data-obt-view]')].map(x => x.getAttribute('data-obt-view')));
    ok('4b and on the contract\'s Obligations tab', tabV[0] === 'all', tabV.join(','));
  } catch (e) {
    fail++; console.log('  FAIL harness — ' + e.message);
  }
  ok('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close();
  await h.stop();
  process.exit(fail ? 1 : 0);
})();
