/* A CONTRACT BROUGHT UP IS A PAGE ON THE DESK — "READ DOWN" (round 7 of the
   redesign: the owner picked "Read down" by name and said yes to Details
   reading the value as amended, 17 Oct 2026; js/views/boardstrip.js)

   WHAT THIS PINS, driven in a real browser on a signed supply agreement with a
   signed amendment that raised its value, auto-renewing
     1 bring up: the strip is a page of its own — its contract's desk tab in
       front, none of the Board's furniture, no × of its own, the Board's
       Present hidden; its head is the page's
     2 one tab per contract, remembering which of its two ways was in front:
       the paper put up on the same tab, the Board tab back to the Board (the
       strips still stand there), the contract's tab back to what it showed
     3 the tab's × puts the page away (the strip goes with it); Let it go
       takes the strip and its tab
     4 the life line names the renewal it draws ("If it renews"), marks the
       signed amendment where it took effect with what it set, and the
       sentence under it says so
     5 Details reads the value as amended, the signed figure beside it
     6 a refresh comes back to the page
     7 the owner's three screens: nothing scrolls sideways; the phone keeps
       its own contract screen
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/contract-page-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const day = n => { const t = new Date(); t.setDate(t.getDate() + n); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
const DOC = ['SUPPLY AGREEMENT', '', '1. Supply', '', 'Brightwater Foods supplies the products in Schedule 1.', '', '2. Payment', '', 'Each correct invoice is paid within 30 days of receipt.', '', '3. Term', '', 'This agreement runs for two years from signature.'].join('\n');
const SIG = n => [{ party: 'first', name: 'Amina Otieno', at: new Date(Date.now() - n * 864e5).toISOString() }, { party: 'counterparty', name: 'Hanna Brightwater', at: new Date(Date.now() - n * 864e5).toISOString() }];

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const A = H.fixtureContract('MK-0377', 'Supply agreement', 'Brightwater Foods', H.FOLDER_A, 6400000, 'Signed', DOC);
  Object.assign(A, { expiry: day(560), fields: { value: '6400000', effDate: day(-170) }, signedAt: new Date(Date.now() - 172 * 864e5).toISOString(), signatures: SIG(172),
    metadata: { value: 6400000, currency: 'SEK', contractType: 'supply', renewalType: 'auto-renew', noticePeriodDays: 90, renewalTermMonths: 12, governingLaw: 'Swedish law' },
    obligations: [{ id: 'o1', desc: 'Check the September invoice', party: 'ours', due: day(-5), status: 'open' }, { id: 'o2', desc: 'Food safety certificate', party: 'theirs', due: day(75), status: 'open' }] });
  const A1 = H.fixtureContract('MK-0377-A1', 'Amendment 1 to the Supply agreement', 'Brightwater Foods', H.FOLDER_A, 7100000, 'Signed', 'AMENDMENT 1\n\n1. Volumes\n\nThe yearly volume is raised by ten per cent.');
  Object.assign(A1, { parentId: 'MK-0377', relation: 'amendment', valueSetHere: true, expiry: null, metadata: { value: 7100000, currency: 'SEK', effectiveDate: day(-20) }, signedAt: new Date(Date.now() - 20 * 864e5).toISOString(), signatures: SIG(20) });
  const B = H.fixtureContract('MK-0378', 'Cleaning agreement', 'Städ AB', H.FOLDER_A, 90000, 'Draft', DOC);
  await H.seedWorkspace(h, { contracts: [A, A1, B], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0377'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const kept = k => until(k => String(localStorage.getItem(DK_KEY) || '').includes('"' + k + '"'), k, 4000);

    /* 1 bring up */
    await page.evaluate(() => hbStripBring('MK-0377'));
    const up = await until(() => !!document.querySelector('#bs-strip-MK-0377 .bs-chart') && window.bsCardId && bsCardId() === 'MK-0377');
    const P = await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-0377'), t = el && el.querySelector('.bs-head .hb-ct');
      return { key: deskKeyNow(), furniture: !!document.querySelector('#hb-board .hb-note, #hb-board .hb-prep, #hb-board .hb-grid'), others: document.querySelectorAll('#bs-strips > .bs-strip').length,
        x: !!(el && el.querySelector('[data-bs-x]')), present: (() => { const p = document.getElementById('hb-present'); return !p || p.hidden; })(), desk: !!(el && el.classList.contains('bs-on-desk')), title: t ? parseFloat(getComputedStyle(t).fontSize) : 0,
        tab: (document.getElementById('dk-page') || {}).textContent }; });
    /* RE-POINTED 18 Oct 2026 (the SAP way): the bar names the page; Present is Recent's row, and not on a contract's page */
    await page.click('#dk-page'); await until(() => !document.getElementById('dk-recent').hidden);
    P.presentRow = await page.evaluate(() => !!document.querySelector('#dk-recent [data-dk-present]'));
    await page.keyboard.press('Escape');
    check('1a bring up: a page of its own, its contract named in the bar', up && P.key === 'c:MK-0377' && /MK-0377/.test(P.tab || ''), JSON.stringify(P));
    check('1b none of the Board\'s furniture, one card, no × of its own, no Present', !P.furniture && P.others === 1 && !P.x && P.present && !P.presentRow, JSON.stringify(P));
    check('1c its head is the page\'s (the name at the page size)', P.desk && P.title >= 18, JSON.stringify(P));
    await shot(page, 'contract-page-1440x780');

    /* 2 one tab per contract */
    await kept('c:MK-0377');
    await page.evaluate(() => pdOpenOnHome('MK-0377', 'copilot'));
    await until(() => window.intel && intel.paper && intel.paper.id === 'MK-0377' && hbFace() === 'paper');
    await page.waitForTimeout(450);
    const tabs1 = await page.evaluate(() => deskRecentRows().map(t => t.k));
    check('2a the paper is on the same Recent row: one row per contract', tabs1.filter(k => k === 'c:MK-0377').length === 1, JSON.stringify(tabs1));
    await page.evaluate(() => hbStripBring('MK-0377'));
    await until(() => bsCardId() === 'MK-0377');
    await page.waitForTimeout(450);
    await page.evaluate(() => deskTabOpen('home:board'));
    const board = await until(() => hbFace() === 'board' && !bsCardId() && !!document.querySelector('#hb-board .hb-note') && !!document.querySelector('#bs-strip-MK-0377 [data-bs-x]'));
    check('2b the Board tab is the Board, the strip standing there with its ×', !!board);
    await page.evaluate(() => deskTabOpen('c:MK-0377'));
    const back = await until(() => bsCardId() === 'MK-0377' && hbFace() === 'board');
    check('2c the contract\'s tab brings back what it showed (its page)', !!back);

    /* 3 put away */
    await page.evaluate(() => hbStripBring('MK-0378'));
    await until(() => bsCardId() === 'MK-0378');
    await kept('c:MK-0378');
    await page.click('#dk-page'); await until(() => !!document.querySelector('#dk-recent [data-dk-x="c:MK-0378"]'));
    await page.click('#dk-recent [data-dk-x="c:MK-0378"]');
    const away = await until(() => !hbS().strips.some(x => x.id === 'MK-0378') && !String(localStorage.getItem(DK_KEY) || '').includes('"c:MK-0378"'));
    check('3a its × in Recent puts the page away: the strip goes with it', !!away);
    await page.evaluate(() => hbStripBring('MK-0378'));
    await until(() => !!document.querySelector('#bs-strip-MK-0378 [data-bs-letgo]'));
    await kept('c:MK-0378');
    await page.click('#bs-strip-MK-0378 [data-bs-letgo]');
    const gone = await until(() => !hbS().strips.some(x => x.id === 'MK-0378') && !String(localStorage.getItem(DK_KEY) || '').includes('"c:MK-0378"') && !bsCardId());
    check('3b Let it go takes the strip and its tab', !!gone);

    /* 4 the life line */
    await page.evaluate(() => hbStripBring('MK-0377'));
    await until(() => !!document.querySelector('#bs-strip-MK-0377 .bs-chart'));
    const L = await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-0377');
      const amd = [...el.querySelectorAll('.bs-chart .bs-amd')];
      return { legend: el.querySelector('.bs-lg').textContent, renew: !!el.querySelector('.bs-chart .bs-seg-renew'), amd: amd.length, tip: amd[0] ? amd[0].textContent : '',
        lab: [...el.querySelectorAll('.bs-chart .bs-lab')].map(t => t.textContent), cap: el.querySelector('.bs-cap').textContent,
        want: fmtMoneyShortIn(7100000, 'SEK') }; });
    check('4a the renewal the line draws is named: "If it renews"', L.renew && /If it renews/.test(L.legend), L.legend);
    check('4b the signed amendment is a mark on the line, named, its hover saying what it set', L.amd === 1 && L.lab.includes('Amendment No. 1') && /MK-0377-A1/.test(L.tip) && L.tip.includes(L.want), JSON.stringify(L));
    check('4c the sentence under the line says so', /Amendment No\. 1 took effect on .* and set the value to /.test(L.cap) && L.cap.includes(L.want), L.cap);

    /* 5 Details reads the value as amended */
    await page.evaluate(() => bsStripPage('MK-0377', 'details'));
    const V = await until(() => { const dd = [...document.querySelectorAll('#bs-strip-MK-0377 [data-bs-host="details"] #ov-ess .sec-f, #bs-strip-MK-0377 [data-bs-host="details"] #ov-ess dl > div, #bs-strip-MK-0377 [data-bs-host="details"] #ov-ess [class*="sec-f"]')]
      .map(x => x.textContent.replace(/\s+/g, ' ').trim()).find(t => /^Value/.test(t)); return dd || null; });
    const want = await page.evaluate(() => ({ now: fmtMoneyOf(effectiveValueView(getContract('MK-0377'))), signed: fmtMoneyOf(getContract('MK-0377')) }));
    check('5 Details reads the value as amended, the signed figure beside it', !!V && V.includes(want.now) && /as amended/.test(V) && V.includes(want.signed + ' signed'), JSON.stringify({ V, want }));
    await page.evaluate(() => bsStripPage('MK-0377', 'ov'));

    /* 6 a refresh */
    await page.reload({ waitUntil: 'networkidle' });
    await until(() => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    const again = await until(() => state.view === 'dashboard' && window.bsCardId && bsCardId() === 'MK-0377' && !!document.querySelector('#bs-strip-MK-0377.bs-on-desk'), null, 10000);
    check('6 a refresh comes back to the page', !!again);

    /* 7 the three screens, and the phone */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      await until(() => !!document.querySelector('#bs-strip-MK-0377 .bs-chart'));
      await page.waitForTimeout(400);
      const F = await page.evaluate(() => { const el = document.getElementById('bs-strip-MK-0377'); const r = el.getBoundingClientRect(), head = el.querySelector('.bs-head').getBoundingClientRect();
        return { side: document.documentElement.scrollWidth <= window.innerWidth + 1 && el.scrollWidth <= el.clientWidth + 1, headIn: head.top >= 0 && head.bottom <= window.innerHeight, kpis: !!el.querySelector('.bs-kpis') && el.querySelector('.bs-kpis').getBoundingClientRect().bottom <= window.innerHeight, w: Math.round(r.width) }; });
      check(`7 ${w}×${ht}: nothing sideways; the head and the figures in view`, F.side && F.headIn && F.kpis, JSON.stringify(F));
      await shot(page, `contract-page-${w}x${ht}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    await page.evaluate(() => openWorkspace('MK-0377'));
    await page.waitForTimeout(1200);
    const phone = await page.evaluate(() => ({ view: state.view, card: !!document.querySelector('#bs-strip-MK-0377.bs-on-desk:not([hidden])') && state.view === 'dashboard' }));
    check('7d the phone keeps its own contract screen', phone.view === 'workspace' && !phone.card, JSON.stringify(phone));
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
