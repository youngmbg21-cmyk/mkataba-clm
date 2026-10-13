/* Chromium verification: STAKES — Home's Clauses tab carries the deep read
   (owner picked "Stakes" by name, 13 Oct 2026; one company view).

   0 Home has no Breakdown face any more (owner, 13 Oct 2026)
   1 opening Clauses is the press: the contract is read ONCE with no other
     press, and the cost is said while it reads
   2 the head says the points and draws the region ribbon
   3 each point stands under its clause as ONE company line with a Deep dive door;
     a point about something missing stands under "Not in the contract"
   4 Deep dive opens its own panel (title, cost, what we should get, our edge,
     the ask) and repeats none of the contract's wording
   5 ‹ › walk the points; Back and Esc return to the same list
   6 a refusal is said where the reader looks with Try again, and is not
     retried in a loop
   7 no page errors

   The Jambo route is stubbed in the page (window.api), so nothing is spent.
   Run: node test/chromium/stakes-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const PAY = 'Invoices are paid within thirty days of receipt. ';
const deal = (id, name) => ({ id, contractNo: id, name, counterparty: 'Juno Limited', folder: 'proc', value: 900000, valueType: 'standard',
  status: 'Under Review', template: 'RM', lastAction: '1 Oct 2026', expiry: '2029-06-30', hash: null, signedAt: null,
  fields: {}, metadata: { value: 900000, currency: 'KES' }, comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }], changes: [],
  body: '<h2>1. Term</h2><p>' + 'The agreement runs for two years from signature. '.repeat(6) + '</p><h2>2. Payment</h2><p>'
    + PAY.repeat(6) + '</p><h2>3. Liability</h2><p>' + 'Liability is capped at the fees paid in the last three months. '.repeat(5) + '</p>' });

(async () => {
  const h = await startHati();
  /* the KEPT standards check (owner, 13 Oct 2026: "Found by" — Jambo or Our standards) */
  const d1 = deal('MK-S1', 'Haulage Stakes');
  d1.playbook = { key: '_default', source: 'heuristic', verdicts: [
    { category: 'Payment terms', status: 'deviation', quote: 'Prices are exclusive of VAT and invoices fall due within', position: 'Paid within 14 days', redline: 'Invoices are paid within 14 days of receipt.', escalate: false },
    { category: 'Governing law', status: 'aligned', quote: '', position: '', redline: '', escalate: false }] };
  await seedWorkspace(h, { contracts: [d1, deal('MK-S2', 'Haulage Refused')], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => typeof getContract === 'function' && !!getContract('MK-S1'), null, { timeout: 15000 });
    await page.evaluate(() => {
      state.aiConfigured = true;
      window.__bd = { n: 0, refuse: false };
      const o = window.api;
      window.api = async function (p, ...a){
        if (p !== 'ai/breakdown') { (window.__calls = window.__calls || []).push(p); return o.call(this, p, ...a); }
        window.__bd.n++;
        if (window.__bd.refuse) return { error: 'Jambo found no regions in this wording.' };
        return { head: 'Fix the cap first', sub: 'Their cover stops at three months of fees.', links: [],
          regions: [{ name: 'Money', status: 'look', kind: 'pay', headline: 'Thirty days', items: [{ ref: '2', title: 'Payment' }], quotes: [] },
            { name: 'Risk', status: 'need', kind: 'protect', headline: 'A small cap', items: [{ ref: '3', title: 'Liability' }], quotes: [] }],
          points: [
            { clause: '3', region: 2, status: 'need', missing: false, title: 'Their liability is capped at three months of fees', stake: 'Their cover stops at KES 225,000, far below the risk.',
              what: 'A single failure could cost us far more than the cap.', theirs: 'Three months of fees.', usual: 'Twelve months of fees.', figure: 'KES 675,000',
              how: '12 months less 3 months of fees.', push: 'They will say the fees are small.', edge: ['Ask for a mutual cap tied to a year of fees.'],
              trade: [{ give: 'Accept twelve months', get: 'Data breach outside the cap' }], ask: 'Each party’s liability shall not exceed the fees payable in the 12 months before the claim.',
              quote: 'Liability is capped at the fees paid in the last three months.', links: [2] },
            { clause: '', after: '2', region: 1, status: 'look', missing: true, title: 'No notice before a price rise', stake: 'Prices could rise with no warning.',
              what: 'Nothing says how much notice we get.', theirs: 'Nothing.', usual: '90 days of notice.', figure: '', how: 'No figure in the wording.',
              push: '', edge: ['Ask for 90 days of notice.'], trade: [], ask: '', quote: '', links: [1] }] };
      };
      setView('dashboard');
      pdOpenOnHome('MK-S1', 'doc');
    });
    const faces = await page.evaluate(() => [...document.querySelectorAll('[data-hb-face]')].map(b => b.dataset.hbFace));
    ok('0 Home has no Breakdown face', faces.length > 0 && !faces.includes('breakdown'), faces.join(','));
    const listed = await page.waitForSelector('#pd-thread .doc-th-row', { timeout: 10000 }).then(() => true, () => false);
    const read = await page.waitForSelector('#pd-thread .stk-line', { state: 'attached', timeout: 10000 }).then(() => true, () => false);
    const e1 = await page.evaluate(() => ({ n: window.__bd.n, runBtn: !!document.querySelector('#pd-thread [data-stk-run]') }));
    ok('1 opening Clauses reads the contract once, with no other press', listed && read && e1.n === 1 && !e1.runBtn, JSON.stringify(e1));

    if (read) {
      /* RE-POINTED 13 Oct 2026 (owner, as drawn): the head is the title line and
         three filters; the summary, the ribbon and its key are gone. Each box
         lists only what this contract's points hold. */
      const e2 = await page.evaluate(() => ({ count: (document.querySelector('#pd-thread .stk-view') || {}).innerText || '',
        boxes: [...document.querySelectorAll('#pd-thread .stk-flt')].map(l => (l.querySelector('span') || {}).innerText),
        gone: !document.querySelector('#pd-thread .stk-ribbon, #pd-thread .stk-legend, #pd-thread .stk-sum') }));
      const o2 = await page.evaluate(() => Object.fromEntries(['reg', 'sev', 'by'].map(k => [k, [...document.querySelectorAll(`#pd-thread [data-stk-f="${k}"] option`)].map(o => o.value).join(',')])));
      ok('2 the head says the points and draws three filters, no summary, ribbon or key',
        /3 points/.test(e2.count) && /1 need you/.test(e2.count) && e2.boxes.join('|') === 'Section|Severity|Found by' && e2.gone
        && o2.reg === ',1,2' && o2.sev === ',need,look' && o2.by === ',jambo,std', JSON.stringify({ e2, o2 }));

      const e3 = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('#pd-thread .doc-th-row')];
        const under = rows.find(r => r.querySelector('.stk-line'));
        const miss = document.querySelector('#pd-thread .stk-miss');
        return { underName: under ? under.querySelector('.doc-th-name').innerText : null, lines: document.querySelectorAll('#pd-thread .doc-th-row .stk-line').length,
          missH: miss ? miss.querySelector('.stk-miss-h').innerText : null, doors: document.querySelectorAll('#pd-thread [data-stk-dive]').length };
      });
      ok('3 a point stands under its clause; a missing one under Not in the contract', /^2\b/.test(e3.underName || '') && e3.lines === 2 && /Not in the contract \(1\)/.test(e3.missH || '') && e3.doors === 3, JSON.stringify(e3));
      /* 3b A FILTER NARROWS THE LIST: Found by → Our standards leaves the one
         standards point, on the Payment row; rows with nothing step aside; the
         box keeps the keyboard */
      /* a point's box shows only under its open clause: open the row that holds Deep dive i */
      const openRowOf = i => page.evaluate(async i => { const b = document.querySelector(`#pd-thread .doc-th-row [data-stk-dive="${i}"]`);
        const r = b && b.closest('.doc-th-row'); if (r && !r.classList.contains('is-open')){ r.querySelector('[data-th-go]').click(); await new Promise(z => setTimeout(z, 900)); } }, i);
      const pick = (k, v) => page.evaluate(([k, v]) => { const el = document.querySelector(`#pd-thread [data-stk-f="${k}"]`); el.focus(); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }, [k, v]);
      await pick('by', 'std');
      const f1 = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('#pd-thread .doc-th-row')].filter(r => r.offsetParent !== null);
        return { count: (document.querySelector('#pd-thread .stk-view') || {}).innerText || '', lines: [...document.querySelectorAll('#pd-thread .stk-line .stk-st')].map(l => l.textContent),
          shown: rows.length, onlyKept: rows.every(r => r.classList.contains('is-open') || !!r.querySelector('.stk-line')), focus: document.activeElement && document.activeElement.getAttribute('data-stk-f') };
      });
      ok('3b Found by: Our standards keeps the one standards point and hides rows with none', /1 point\b/.test(f1.count) && f1.lines.length === 1 && /Payment terms/.test(f1.lines[0])
        && f1.onlyKept && f1.shown <= 2 && f1.focus === 'by', JSON.stringify(f1));
      await pick('by', '');
      await pick('sev', 'need');
      const f2 = await page.evaluate(() => ({ count: (document.querySelector('#pd-thread .stk-view') || {}).innerText || '', lines: document.querySelectorAll('#pd-thread .stk-line').length }));
      ok('3c Severity: Needs you keeps only what needs us', /1 point · 1 need you/.test(f2.count) && f2.lines === 1, JSON.stringify(f2));
      await pick('sev', '');
      /* 3d A POINT'S SECTION IS READ OFF ITS CLAUSE when Jambo named none (owner,
         13 Oct 2026: "the Region which we should call Section"): the standards
         point names no section, yet stands on clause 2, which the reading puts
         in Money — so Section: Money keeps it */
      await pick('reg', '1');
      const f3 = await page.evaluate(() => ({ count: (document.querySelector('#pd-thread .stk-view') || {}).innerText || '',
        lines: [...document.querySelectorAll('#pd-thread .stk-line .stk-st')].map(l => l.textContent) }));
      ok('3d Section: Money keeps the points whose clause sits in Money, the standards one too', /2 points/.test(f3.count) && f3.lines.some(t => /Payment terms/.test(t)) && f3.lines.some(t => /price rise|warning/i.test(t)), JSON.stringify(f3));
      await pick('reg', '');
      /* 3e THE ARTIFACT'S BOXES: a point is a shaded box in its severity's tint,
         its words dark — the colour is the box, never the writing */
      const f4 = await page.evaluate(() => {
        const tok = n => { const p = document.createElement('span'); p.style.color = `var(${n})`; document.body.appendChild(p); const v = getComputedStyle(p).color; p.remove(); return v; };
        const need = document.querySelector('#pd-thread .stk-line.is-need'), look = document.querySelector('#pd-thread .stk-line.is-look');
        const bg = el => el ? getComputedStyle(el).backgroundColor : null, ink = el => el ? getComputedStyle(el.querySelector('.stk-st')).color : null;
        return { needBg: bg(need), lookBg: bg(look), ruby: tok('--st-ruby-bg'), amber: tok('--st-amber-bg'), needInk: ink(need), lookInk: ink(look), text: tok('--color-text') };
      });
      ok('3e each point is a shaded box in its severity\'s tint, its words dark', f4.needBg === f4.ruby && f4.lookBg === f4.amber && f4.needInk === f4.text && f4.lookInk === f4.text, JSON.stringify(f4));
      /* 3f A POINT'S BOX SHOWS ONLY UNDER THE OPEN CLAUSE (owner, 13 Oct 2026:
         "you should only be able to see this once you click on the clause
         header"): closed, the row says "1 to review" and no box shows; pressed,
         its box shows; the dot wears the worst point (red: it needs you) */
      const f5 = await page.evaluate(async () => {
        const vis = el => !!el && el.getClientRects().length > 0;
        const row = [...document.querySelectorAll('#pd-thread .doc-th-row')].find(r => r.querySelector('.stk-line.is-need'));
        if (!row) return { row: false };
        const before = { open: row.classList.contains('is-open'), box: vis(row.querySelector('.stk-line')), say: (row.querySelector('.stk-n') || {}).textContent || '' };
        row.querySelector('[data-th-go]').click(); await new Promise(r => setTimeout(r, 900));
        const r2 = document.querySelector(`#pd-thread [data-th-row="${row.getAttribute('data-th-row')}"]`);
        const bead = getComputedStyle(r2.querySelector('.doc-th-bead')).backgroundColor;
        const tok = n => { const p = document.createElement('span'); p.style.color = `var(${n})`; document.body.appendChild(p); const v = getComputedStyle(p).color; p.remove(); return v; };
        return { row: true, before, after: { open: r2.classList.contains('is-open'), box: vis(r2.querySelector('.stk-line')) }, bead, ruby: tok('--st-ruby-dot') };
      });
      ok('3f a closed clause hides its boxes and says "1 to review"; pressed, its box shows', f5.row && !f5.before.open && !f5.before.box && /1 to review/.test(f5.before.say) && f5.after.open && f5.after.box, JSON.stringify(f5));
      ok('3g the dot wears its clause\'s worst point: red where a point needs you', f5.row && f5.bead === f5.ruby, JSON.stringify({ bead: f5.bead, ruby: f5.ruby }));
      /* 3h "Not in the contract" opens the same way: its title is the press */
      const f6 = await page.evaluate(async () => {
        const vis = el => !!el && el.getClientRects().length > 0;
        const t = document.querySelector('#pd-thread .stk-miss-row [data-stk-mopen]'); if (!t) return { t: false };
        const box = () => vis(t.closest('.stk-miss-row').querySelector('.stk-line'));
        const a = box(); t.click(); const b = box(); t.click(); const c = box();
        return { t: true, closed: a, opened: b, again: c };
      });
      ok('3h a point not in the contract opens its box on a press of its title, and closes on another', f6.t && !f6.closed && f6.opened && !f6.again, JSON.stringify(f6));

      if (process.env.STK_SHOT) await page.screenshot({ path: process.env.STK_SHOT + '-list.png' });
      await openRowOf(0);
      await page.click('#pd-thread .doc-th-row [data-stk-dive="0"]');
      const dived = await page.waitForSelector('#pd-thread .stk-dv h3', { timeout: 4000 }).then(() => true, () => false);
      const e4 = await page.evaluate(() => {
        const dv = document.querySelector('#pd-thread .stk-dv'); const t = dv ? dv.innerText : '';
        const listShown = [...document.querySelectorAll('#pd-thread .doc-th-rows')].some(el => el.offsetParent !== null);
        return { title: (dv.querySelector('h3') || {}).innerText, fig: (dv.querySelector('.stk-fig') || {}).innerText, edge: !!dv.querySelector('.stk-edge li'),
          ask: !!dv.querySelector('.stk-ask'), usual: /Twelve months of fees/.test(t), wording: /fees paid in the last three months/.test(t), listShown };
      });
      if (process.env.STK_SHOT) await page.screenshot({ path: process.env.STK_SHOT + '-dive.png' });
      ok('4 Deep dive opens its own panel and repeats none of the contract wording', dived && /capped/.test(e4.title || '') && e4.fig === 'KES 675,000' && e4.edge && e4.ask && e4.usual && !e4.wording && !e4.listShown, JSON.stringify(e4));
      /* 4b THE WHOLE CARD SCROLLS (owner, 13 Oct 2026): the head rides inside the
         one scroller with the body; only the Back bar stands outside it */
      const e4b = await page.evaluate(() => {
        const sc = document.querySelector('#pd-thread .stk-dv-scroll'), body = document.querySelector('#pd-thread .stk-dv-body');
        return { scroller: !!sc && getComputedStyle(sc).overflowY === 'auto', headInside: !!(sc && sc.querySelector('.stk-dv-head')),
          bodyStill: !!body && getComputedStyle(body).overflowY === 'visible', barOutside: !!document.querySelector('#pd-thread .stk-dv-top') && !(sc && sc.querySelector('.stk-dv-top')) };
      });
      ok('4b the whole card scrolls: the head inside the one scroller, the Back bar outside', e4b.scroller && e4b.headInside && e4b.bodyStill && e4b.barOutside, JSON.stringify(e4b));

      await page.click('#pd-thread .stk-pg [data-stk-dive="1"]');
      const t2 = await page.evaluate(() => (document.querySelector('#pd-thread .stk-dv h3') || {}).innerText || '');
      await page.click('#pd-thread [data-stk-back]');
      const back = await page.evaluate(() => ({ dive: !!document.querySelector('#pd-thread .stk-dv'), list: [...document.querySelectorAll('#pd-thread .doc-th-rows')].some(el => el.offsetParent !== null) }));
      await openRowOf(0);
      await page.click('#pd-thread .doc-th-row [data-stk-dive="0"]');
      await page.keyboard.press('Escape');
      const esc = await page.evaluate(() => !document.querySelector('#pd-thread .stk-dv'));
      ok('5 the arrows walk the points; Back and Esc return to the list', /price rise/.test(t2) && !back.dive && back.list && esc, JSON.stringify({ t2, back, esc }));

      await page.evaluate(() => { window.__bd.refuse = true; window.__bd.n = 0; pdOpenOnHome('MK-S2', 'doc'); });
      const said = await page.waitForSelector('#pd-thread .stk-err', { timeout: 8000 }).then(() => true, () => false);
      await page.waitForTimeout(1500);   // a loop would have asked again by now
      const f = await page.evaluate(() => ({ n: window.__bd.n, err: (document.querySelector('#pd-thread .stk-err') || {}).innerText || null,
        again: !!document.querySelector('#pd-thread [data-stk-run]') }));
      ok('6 a refusal is said with Try again, and is not retried in a loop', said && f.n === 1 && !!f.err && f.again, JSON.stringify(f));

      /* 6b A PAINT FOR ANOTHER CONTRACT TAKES NOTHING (owner's screenshot,
         13 Oct 2026: Plain English said "There is no wording here to read
         yet." and "Jambo is reading…" never ended). A background paint for a
         contract not on the panel moved the list's host to the room, which is
         gone; the list stayed drawn and its presses read no paper. */
      const g = await page.evaluate(async () => {
        const toasts = []; const ot = window.toast; window.toast = (m, k, ...r) => { toasts.push(String(m)); return ot && ot(m, k, ...r); };
        window.__calls = [];
        docThreadPaint(getContract('MK-S1'));
        if (!document.querySelector('#pd-thread .doc-th-row.is-open')) { const go = document.querySelector('#pd-thread [data-th-go]'); if (go) go.click(); await new Promise(r => setTimeout(r, 900)); }
        const b = document.querySelector('#pd-thread .doc-th-row.is-open [data-th-explain]');
        if (b) b.click();
        await new Promise(r => setTimeout(r, 1500));
        window.toast = ot;
        return { btn: !!b, toasts, asked: window.__calls.filter(p => /readings/.test(p)).length };
      });
      ok('6b after a paint for another contract, Plain English still reads the paper on screen', g.btn && g.asked >= 1 && !g.toasts.some(t => /no wording here/i.test(t)), JSON.stringify(g));
    } else {
      ['2', '3', '4', '5', '6'].forEach(k => ok(k + ' (not reached)', false, 'the Clauses tab was never read'));
    }
    /* 8 THE OVERVIEW TAB IS GONE from Home's panel (owner, 13 Oct 2026); an old
       door onto it lands on Jambo */
    const tabs = await page.evaluate(() => { pdOpenOnHome('MK-S1', 'facts');
      return new Promise(r => setTimeout(() => r({ tabs: [...document.querySelectorAll('#ig-dock [data-pd-tab]')].map(b => b.getAttribute('data-pd-tab')), on: pdTab() }), 900)); });
    ok('8 Home\'s panel has no Overview tab, and its old door lands on Jambo', tabs.tabs.join(',') === 'copilot,doc,oblig' && tabs.on === 'copilot', JSON.stringify(tabs));
    ok('7 no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  } finally { await browser.close(); await h.stop(); }
  console.log(`${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
