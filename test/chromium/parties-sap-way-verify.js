/* PARTIES, "THE SAP WAY" (round 19 of the redesign: the owner picked "The SAP
   way" by name and said "Leave it off" to a code-named deal on Parties, 17 Oct
   2026; js/views/customers.js cuNeedsOf, cuPanelNeedsHtml)

   WHAT THIS PINS, driven in a real browser on Parties
     1 the Status tabs (All · Live · Ended; RE-POINTED 21 Oct 2026, Part 8,
       the list head the Legora way: the Status box is the tab row); Ended
       narrows the list to the parties everything with has ended
     2 "Waiting on you" says what waits, in words, on the list and the panel
     3 the panel lists what waits, each with its door (a detail to fill opens
       Fill in beside the paper), and the party's agreements, each a door onto
       its paper
     4 a deal kept to its list is not on Parties
     5 the owner's three screens: the list and its panel in view, nothing
       sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/parties-sap-way-verify.js */
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

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const old = H.fixtureContract('MK-OLD', 'Old supply', 'Retired Supplies AB', H.FOLDER_A, 50000, 'Signed');
  old.metadata = Object.assign({}, old.metadata, { expiryDate: '2020-01-31' }); old.expiry = '2020-01-31';
  await H.seedWorkspace(h, { contracts: [...H.FIXTURES, old], approvalRules: [] });
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
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-OLD'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { state.contracts.push({ id: 'MK-0412', contractNo: 'MK-0412', name: 'Project Falcon', counterparty: 'Falcon AB', folder: state.contracts[0].folder, status: 'Under Review', _codeNamed: true, _light: true }); setView('customers'); });
    await until(() => document.querySelectorAll('#cu-tbody [data-cu-cust]').length >= 3, null, 10000);

    /* ---- 1 the tabs ---- */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762; Parties as drawn, round 6): the tabs are Folders ·
       List · Waiting on you · No NDA ([data-cun-tab]), the page opening on List; Waiting on you narrows to the parties
       with something waiting. The Status tabs All · Live · Ended are not drawn (a party's standing is its column) —
       RETIRED: "Ended narrows to the parties everything with has ended" */
    const TAB = '.cun-page [data-cun-tab]';
    const S0 = await page.evaluate(t => ({ opts: [...document.querySelectorAll(t)].map(o => o.getAttribute('data-cun-tab')), lit: (document.querySelector(t + '.is-on') || { getAttribute: () => null }).getAttribute('data-cun-tab'), n: document.querySelectorAll('#cu-tbody [data-cu-cust]').length }), TAB);
    let S1 = null;
    if (S0.opts.includes('wait')){
      await page.click(TAB + '[data-cun-tab="wait"]');
      /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): Waiting on you is a WORKLIST — one row per thing that waits (tr.cun-wrow), what waits in words, its
         kind a soft badge, its act at the row's end; the parties it names are fewer than All's, and the chip counts its rows */
      S1 = await until(n => { const on = document.querySelector('.cun-page [data-cun-tab="wait"].is-on'); const rows = [...document.querySelectorAll('#cu-tbody tr.cun-wrow[data-cu-cust]')];
        const parties = [...new Set(rows.map(r => r.getAttribute('data-cu-cust')))];
        const chipN = Number(((on && on.querySelector('span')) || {}).textContent || NaN);
        return on && document.querySelector('.cun-table.is-wait') && rows.length && parties.length < n && chipN === rows.length
          && rows.every(r => /[a-z]/i.test(((r.querySelector('td.cun-what') || {}).textContent || '')) && !!r.querySelector('.cun-badge') /* RE-POINTED 21 Nov 2026 (P-25, as drawn): the kind a soft square badge (.cun-badge) */) ? parties : null; }, S0.n);
    }
    /* RE-POINTED 19 Nov 2026 (owner's yes on the Parties drawings): the Folders tab and "NDA missing" are gone — the tabs
       are All · Waiting on you, the page opening on All. RETIRED: Folders first, List second, No NDA */
    check('1 the tabs (All · Waiting on you), opening on All; Waiting on you narrows to the parties something waits on',
      S0.opts[0] === 'all' && S0.opts.includes('wait') && !S0.opts.includes('folders') && !S0.opts.includes('nda') && S0.lit === 'all' && !!S1, JSON.stringify({ S0, S1 }));
    if (S0.opts.length){
      await page.click(TAB + '[data-cun-tab="all"]');
      await until(n => document.querySelectorAll('#cu-tbody [data-cu-cust]').length === n, S0.n);
    }

    /* ---- 2 waiting in words ---- */
    const W = await page.evaluate(() => [...document.querySelectorAll('#cu-tbody [data-cu-cust]')].map(r => ({ k: r.getAttribute('data-cu-cust'), w: ((r.querySelector('td.cun-wait') || {}).textContent || '').trim() })));
    const waits = W.filter(r => r.w && r.w !== '—');
    check('2a "Waiting on you" says what waits, in words', waits.length > 0 && waits.every(r => /[a-z]/i.test(r.w) && !/^\d+$/.test(r.w)), JSON.stringify(W));
    const key = (waits[0] || {}).k;
    if (key) await page.click(`#cu-tbody [data-cu-cust="${key}"]`);
    /* RE-POINTED 16 Nov 2026 (#762; JAMBO'S PANELS — THE FIVE PARTS, owner 15 Nov 2026): the party's panel lists its
       agreements as rows, each a door onto its paper. RETIRED: 2b "the panel's Waiting on you begins with the column's
       first item" and 3b "a waiting row's door lands on its work" — the drawn panel carries no Waiting section (what
       waits is said on the row) */
    /* RE-POINTED 19 Nov 2026: the party's facts come first now; the agreements are their own section (data-jov5-sec="ags") */
    /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): the agreements' group is gone — all of them on Contracts is the black button (.jov5-go[data-cun-cts]);
       what waits is the panel's first group, its row opening Contracts showing only those ([data-cun-attn]) */
    const P = await until(() => { const p = document.getElementById('ins-panel'); const g = p && p.querySelector('.jov5 .jov5-go[data-cun-cts]'); if (!g) return null;
      return { label: g.textContent.trim(), ags: 1, attn: p.querySelectorAll('.jov5-row.is-door[data-cun-attn]').length }; });
    check('3a the panel links to the party\'s agreements', !!P && P.ags > 0, JSON.stringify(P));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'parties-sap-way-1440x780.png') });

    /* ---- 3 the doors ---- */
    /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): the door is the black button Open on Contracts */
    const agName = await page.evaluate(() => { const r = document.querySelector('#ins-panel .jov5 .jov5-go[data-cun-cts]'); return r ? r.textContent.trim() : null; });
    if (agName) await page.click('#ins-panel .jov5 .jov5-go[data-cun-cts]');
    const opened = agName ? await until(() => document.querySelectorAll('#ct-place #reg-tbody tr[data-row]').length || null, null, 12000) : null;
    check('3c "All N agreements" in the panel opens Contracts showing that party\'s agreements', !!opened, String(opened));

    /* ---- 4 the code-named deal ---- */
    await page.evaluate(() => setView('customers'));
    await until(() => document.querySelectorAll('#cu-tbody [data-cu-cust]').length >= 3);
    const coded = await page.evaluate(() => !!document.querySelector('#cu-tbody [data-cu-cust="falcon ab"]') || /Falcon|Project Falcon/.test(document.getElementById('cu-tbody').textContent));
    check('4 a deal kept to its list is not on Parties', !coded, String(coded));

    /* ---- 5 the owner's three screens ---- */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      const F = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const t = r('.cun-table'), p = r('#ins-panel'); /* RE-POINTED 16 Nov 2026 (#762): the new look's table */
        return { list: !!t && t.top < innerHeight, panel: !!p && p.right <= innerWidth + 1, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`5 ${w}×${ht}: the list and its panel in view, nothing sideways`, F.list && F.panel && F.side, JSON.stringify(F));
      if (OUT) await page.screenshot({ path: path.join(OUT, `parties-sap-way-${w}x${ht}.png`) });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
