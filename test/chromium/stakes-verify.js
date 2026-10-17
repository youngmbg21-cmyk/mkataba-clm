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
   3i–3l no section squares; every coloured dot explains itself; a filter
     drops an open clause with nothing it keeps; a finger on a filter opens
     one list (the box is never focused after a touch)
   5c–5f Start redlining lands on its clause in Edit with Jambo, nothing
     filed; \u2039 Back to clauses returns to the same point and filter
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
  /* a contract the risk scan read: one finding on clause 4's wording (the paper is the RM template's) */
  const d3 = deal('MK-S3', 'Haulage Scanned');
  d3.scan = { findings: [{ id: 'f1', sev: 'high', title: 'Renews on its own for twelve months', why: 'It renews unless notice is given ninety days before the end.',
    quote: 'The term is three (3) years from the effective date' }], dismissed: [] };
  await seedWorkspace(h, { contracts: [d1, deal('MK-S2', 'Haulage Refused'), d3], approvalRules: [] });
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
        if (p === 'ai/breakdown/point'){ window.__dives = (window.__dives || 0) + 1; await new Promise(r => setTimeout(r, 700));
          return { what: 'Prices could rise in any month with no warning.', theirs: 'Nothing.', usual: 'Ninety days of written notice.', figure: '', how: 'No figure in the wording.',
            push: 'They will say prices follow the market.', edge: ['Ask for ninety days of notice.'], trade: [], ask: 'The Supplier shall give ninety (90) days written notice of any price change.' }; }
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
    const faces = await page.evaluate(() => HB_FACES.slice());   /* Home's faces (desk tabs on a computer since 17 Oct 2026) */
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

      /* 3i NO SECTION SQUARE after a clause's name (owner, 13 Oct 2026: "remove
         these green dots as no one knows what they are for") */
      const f7 = await page.evaluate(() => ({ sq: document.querySelectorAll('#pd-thread .stk-rsq').length,
        named: document.querySelectorAll('#pd-thread .doc-th-row .doc-th-name').length }));
      ok('3i no coloured section square after any clause name', f7.named > 0 && f7.sq === 0, JSON.stringify(f7));
      /* 3k AN OPEN CLAUSE WITH NOTHING THE FILTER KEEPS LEAVES THE LIST (owner,
         13 Oct 2026): open the Term row (no points), then Severity: Needs you */
      const f9 = await page.evaluate(async () => {
        const row = [...document.querySelectorAll('#pd-thread .doc-th-row')].find(r => /^1\b/.test((r.querySelector('.doc-th-name') || {}).innerText || ''));
        if (!row) return { row: false };
        const at = row.getAttribute('data-th-row');
        if (!row.classList.contains('is-open')){ row.querySelector('[data-th-go]').click(); await new Promise(z => setTimeout(z, 900)); }
        const el = document.querySelector('#pd-thread [data-stk-f="sev"]'); el.value = 'need'; el.dispatchEvent(new Event('change', { bubbles: true }));
        const r2 = document.querySelector(`#pd-thread .doc-th-row[data-th-row="${at}"]`);
        const out = { row: true, open: r2.classList.contains('is-open'), shown: r2.getClientRects().length > 0 };
        const el2 = document.querySelector('#pd-thread [data-stk-f="sev"]'); el2.value = ''; el2.dispatchEvent(new Event('change', { bubbles: true }));
        return out;
      });
      ok('3k an open clause with nothing the filter keeps leaves the filtered list', f9.row && f9.open && !f9.shown, JSON.stringify(f9));
      /* 3l ONE DROPDOWN PER PRESS, ON AN iPAD TOO (owner, 3 Oct and again 13 Oct
         2026): a finger opens HaTi's list, picks from it, and the box is NOT
         focused afterwards — on iPadOS a focused select IS the system picker */
      const f10 = await page.evaluate(async () => {
        const sel = document.querySelector('#pd-thread [data-stk-f="sev"]');
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        const tap = el => { const r = el.getBoundingClientRect();
          el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch', clientX: r.x + 5, clientY: r.y + 5 })); };
        tap(sel);
        const menu = document.querySelector('.hati-selmenu');
        const row = menu && [...menu.querySelectorAll('[data-sm]')].find(b => /look/i.test(b.textContent));
        if (row){ tap(row); row.click(); }
        await new Promise(z => setTimeout(z, 300));
        const a = document.activeElement;
        const out = { menu: !!menu, picked: (document.querySelector('#pd-thread [data-stk-f="sev"]') || {}).value, focusedSelect: !!(a && a.tagName === 'SELECT') };
        const s2 = document.querySelector('#pd-thread [data-stk-f="sev"]'); s2.value = ''; s2.dispatchEvent(new Event('change', { bubbles: true }));
        return out;
      });
      ok('3l a finger picks from HaTi\'s list and the box is not focused (no iPad picker over it)', f10.menu && f10.picked === 'look' && !f10.focusedSelect, JSON.stringify(f10));
      if (process.env.STK_SHOT) await page.screenshot({ path: process.env.STK_SHOT + '-list.png' });
      await openRowOf(0);
      await page.click('#pd-thread .doc-th-row [data-stk-dive="0"]');
      const dived = await page.waitForSelector('#pd-thread .stk-dv h3', { timeout: 4000 }).then(() => true, () => false);
      const e4 = await page.evaluate(() => {
        const dv = document.querySelector('#pd-thread .stk-dv'); const t = dv ? dv.innerText : '';
        const listShown = [...document.querySelectorAll('#pd-thread .doc-th-rows')].some(el => el.offsetParent !== null);
        return { title: (dv.querySelector('h3') || {}).innerText, fig: (dv.querySelector('.stk-fig') || {}).innerText, edge: !!dv.querySelector('.stk-edge li'),
          ask: !!dv.querySelector('.stk-ask'), reg: !!dv.querySelector('.stk-reg'), regWord: /\bRisk\b/.test((dv.querySelector('.stk-dv-head .stk-meta') || {}).innerText || ''), usual: /Twelve months of fees/.test(t), wording: /fees paid in the last three months/.test(t), listShown };
      });
      if (process.env.STK_SHOT) await page.screenshot({ path: process.env.STK_SHOT + '-dive.png' });
      ok('4 Deep dive opens its own panel, carries no section label, and repeats none of the contract wording', dived && !e4.reg && !e4.regWord && /capped/.test(e4.title || '') && e4.fig === 'KES 675,000' && e4.edge && e4.ask && e4.usual && !e4.wording && !e4.listShown, JSON.stringify(e4));
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

      /* 5b TWO STEPS (owner, 13 Oct 2026: the loading took too long): the list
         read leaves a point's dive for its own read, asked on the press of Deep
         dive, with the turning ring and its cost while it reads, and kept — a
         second visit asks nothing */
      const d1 = await page.evaluate(async () => {
        const c = getContract('MK-S1'); const p = c.breakdown.points[1];
        ['what', 'theirs', 'usual', 'figure', 'how', 'push', 'ask'].forEach(f => { p[f] = ''; }); p.edge = []; p.trade = []; delete p._dove;
        window.__dives = 0;
        const i = [...document.querySelectorAll('#pd-thread [data-stk-dive]')].map(b => Number(b.getAttribute('data-stk-dive'))).sort((x, y) => y - x)[0];
        stkDiveOpen(c, 1);
        await new Promise(r => setTimeout(r, 150));
        const ring = !!document.querySelector('#pd-thread .stk-dv .stk-busy .ob-spin'), cost = /once for this point/.test((document.querySelector('#pd-thread .stk-dv') || {}).innerText || '');
        await new Promise(r => setTimeout(r, 1200));
        const t = (document.querySelector('#pd-thread .stk-dv') || {}).innerText || '';
        stkDiveClose(c); stkDiveOpen(c, 1); await new Promise(r => setTimeout(r, 300));
        const t2 = (document.querySelector('#pd-thread .stk-dv') || {}).innerText || '';
        stkDiveClose(c);
        return { i, ring, cost, filled: /Ninety days of written notice/.test(t) && /ninety days of notice/i.test(t), busyGone: !/reading this point/.test(t), again: /Ninety days/.test(t2), dives: window.__dives };
      });
      ok('5b a point\'s deep dive is its own read on the press: the ring and its cost while it reads, then the dive, asked once', d1.ring && d1.cost && d1.filled && d1.busyGone && d1.again && d1.dives === 1, JSON.stringify(d1));

      /* 5c "START REDLINING WITH THIS ASK" LANDS ON ITS CLAUSE AND FILES NOTHING,
         AND THE WAY BACK RETURNS TO THE SAME POINT (owner, 13 Oct 2026) */
      const j1 = await page.evaluate(async () => {
        const c = getContract('MK-S1'); const before = (c.changes || []).length;
        await new Promise(r => { const t = setInterval(() => { if (document.querySelector('#pd-thread .doc-th-row')){ clearInterval(t); r(); } }, 100); setTimeout(r, 4000); });
        const el = document.querySelector('#pd-thread [data-stk-f="sev"]'); el.value = 'need'; el.dispatchEvent(new Event('change', { bubbles: true }));
        stkDiveOpen(c, 0); await new Promise(r => setTimeout(r, 300));
        const title = (document.querySelector('#pd-thread .stk-dv h3') || {}).innerText || '';
        document.querySelector('#pd-thread [data-stk-redline]').click();
        await new Promise(r => setTimeout(r, 2500));
        const ceId = window.clauseEditorOpen && clauseEditorOpen() ? clauseEditorClauseId() : null;
        const cl = ceId ? negoClauseList(getContract('MK-S1')).find(x => x.clauseId === ceId) : null;
        const bk = document.querySelector('#shell-title [data-rl-back-clauses]');
        const pane = document.getElementById('clause-editor'), ptxt = pane ? pane.innerText : '';
        return { title, view: state.view, face: !!(window.pdRedFor && String(pdRedFor()) === 'MK-S1'), editor: !!ceId, clause: cl ? clauseLabel(cl) : null,
          card: /Jambo's proposed ask/.test(ptxt), say: /This is the ask you came with/.test(ptxt), askOnCard: /12 months before the claim/.test(ptxt),
          apply: !!(pane && [...pane.querySelectorAll('button')].some(b => /^Apply$/.test(b.textContent.trim()))),
          box: (document.getElementById('ce-ask') || {}).value || '', filed: (getContract('MK-S1').changes || []).length - before,
          back: bk ? bk.textContent : '', bold: bk ? Number(getComputedStyle(bk).fontWeight) : 0,
          crumb: (document.getElementById('shell-title') || {}).innerText || '' };
      });
      /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the trip now
         passes through Jambo's Redlines face beside Home's paper (view
         'dashboard', the face on MK-S1), the clause editor opening over Home */
      ok('5c "Start redlining with this ask" opens its own clause in Edit with Jambo, the ask waiting on a card with Apply, nothing filed',
        j1.view === 'dashboard' && j1.face && j1.editor && /\b3\b/.test(j1.clause || '') && j1.card && j1.say && j1.askOnCard && j1.apply && !j1.box && j1.filed === 0, JSON.stringify(j1));
      ok('5d the bar offers a bold "‹ Back to Clauses" on that trip, and still names the clause being edited',
        /‹ Back to Clauses/.test(j1.back) && j1.bold >= 600 && /Edit\b/.test(j1.crumb), JSON.stringify({ back: j1.back, bold: j1.bold, crumb: j1.crumb }));
      const ja = await page.evaluate(async () => {
        const before = (getContract('MK-S1').changes || []).length;
        const btn = [...document.querySelectorAll('#clause-editor button')].find(b => /^Apply$/.test(b.textContent.trim()));
        if (!btn) return { btn: false };
        btn.click(); await new Promise(r => setTimeout(r, 800));
        const box = document.getElementById('ce-clausebody') || document.querySelector('#clause-editor [contenteditable]');
        return { btn: true, dirty: !!(window.clauseEditorDirty && clauseEditorDirty()), inBox: /12 months before the claim/.test(box ? box.innerText : ''),
          filed: (getContract('MK-S1').changes || []).length - before };
      });
      ok('5c2 Apply puts the ask into the clause as a draft; nothing is filed until Save', ja.btn && ja.dirty && ja.inBox && ja.filed === 0, JSON.stringify(ja));
      if (process.env.STK_SHOT) await page.screenshot({ path: process.env.STK_SHOT + '-landed.png' });
      /* GUARDED (14 Oct 2026, stage 5): where the bar draws no "‹ Back to
         Clauses" (5d reports that), the way back is pressed through the very
         handler that link presses (rlBackToClauses), so 5e still measures
         where the way back LANDS instead of the stage stopping on a null */
      const j2 = await page.evaluate(async () => {
        const link = document.querySelector('#shell-title [data-rl-back-clauses]');
        if (link) link.click(); else if (window.rlBackToClauses) rlBackToClauses();
        await new Promise(r => setTimeout(r, 2500));
        if (document.getElementById('confirm-overlay')){ const go = document.querySelector('#confirm-overlay #cf-ok'); if (go) go.click(); await new Promise(r => setTimeout(r, 2000)); }
        return { view: state.view, title: (document.querySelector('#pd-thread .stk-dv h3') || {}).innerText || '',
          sev: (document.querySelector('#pd-thread [data-stk-f="sev"]') || {}).value, crumbGone: !document.querySelector('[data-rl-back-clauses]'),
          via: link ? 'the bar\'s link' : 'rlBackToClauses (no link in the bar)' };
      });
      ok('5e the way back lands on the Clauses tab, the same point open, the same filter', j2.view === 'dashboard' && j2.title === j1.title && j2.sev === 'need' && j2.crumbGone, JSON.stringify(j2));
      await page.evaluate(() => { const c = getContract('MK-S1'); stkDiveClose(c); const el = document.querySelector('#pd-thread [data-stk-f="sev"]'); if (el){ el.value = ''; el.dispatchEvent(new Event('change', { bubbles: true })); } });
      /* 5f ANOTHER DOOR ONTO NEGOTIATE FORGETS THE TRIP: no way back offered */
      /* RE-POINTED 14 Oct 2026 (stage 5): another door lands on the face,
         which draws no bar link at all, so "offers no way back" is also asked
         of the product's own memory of the trip (rlCameFrom) — forgotten */
      const j3 = await page.evaluate(async () => { openRedlineWorkbench('MK-S1'); await new Promise(r => setTimeout(r, 1500));
        const out = !document.querySelector('[data-rl-back-clauses]') && !(window.rlCameFrom && rlCameFrom('MK-S1')); setView('dashboard'); pdOpenOnHome('MK-S1', 'doc'); await new Promise(r => setTimeout(r, 1200)); return out; });
      ok('5f Negotiate opened by another door offers no way back to the clauses', j3);
      /* 5g "ASK JAMBO ABOUT THIS" TAKES THE QUESTION TO JAMBO IN THE EDIT ROOM
         (owner, 13 Oct 2026: "the question posed is terribly framed", then
         "ask jambo is supposed to take me to the jambo in the redline editing
         page"): the clause opens in Edit with Jambo, a whole question — the
         clause by number, no quote marks — waits in his ask box, unsent */
      const j4 = await page.evaluate(async () => {
        const c = getContract('MK-S1'); const before = (c.changes || []).length;
        stkDiveOpen(c, 0); await new Promise(r => setTimeout(r, 400));
        document.querySelector('#pd-thread [data-stk-ask]').click(); await new Promise(r => setTimeout(r, 2500));
        const box = document.getElementById('ce-ask');
        return { view: state.view, face: !!(window.pdRedFor && String(pdRedFor()) === 'MK-S1'), editor: !!(window.clauseEditorOpen && clauseEditorOpen()), q: box ? box.value : '',
          filed: (getContract('MK-S1').changes || []).length - before, back: !!document.querySelector('[data-rl-back-clauses]') };
      });
      /* RE-POINTED 14 Oct 2026 (stage 5): through the face, over Home */
      ok('5g "Ask Jambo about this" opens the clause in Edit with Jambo, a whole question in his ask box, unsent',
        j4.view === 'dashboard' && j4.face && j4.editor && /^In clause 3: Their liability is capped at three months of fees\. Explain in plain English what this means for us, and what we should ask for instead\.$/.test(j4.q) && !/"/.test(j4.q) && j4.filed === 0 && j4.back, JSON.stringify(j4));
      await page.evaluate(async () => { const b = document.getElementById('ce-ask'); if (b) b.value = '';
        if (window.rlBackToClauses) rlBackToClauses(); await new Promise(r => setTimeout(r, 1500));
        if (document.getElementById('confirm-overlay')){ const go = document.querySelector('#confirm-overlay #cf-ok'); if (go) go.click(); await new Promise(r => setTimeout(r, 1200)); }
        stkDiveClose(getContract('MK-S1')); });

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
    /* 9 EVERY COLOURED DOT EXPLAINS ITSELF (owner, 13 Oct 2026: "Yes, build
       it"): the risk scan's finding is a point under its clause — counted,
       red, its reason in the open row, "Found by: Risk scan" */
    const sc = await page.evaluate(async () => {
      window.__bd.refuse = false;
      pdOpenOnHome('MK-S3', 'doc');
      for (let i = 0; i < 40 && !document.querySelector('#pd-thread .stk-line'); i++) await new Promise(r => setTimeout(r, 250));
      const by = [...document.querySelectorAll('#pd-thread [data-stk-f="by"] option')].map(o => o.value);
      const row = [...document.querySelectorAll('#pd-thread .doc-th-row')].find(r => /^4\b/.test((r.querySelector('.doc-th-name') || {}).innerText || ''));
      if (!row) return { row: false, by };
      const red = row.classList.contains('stk-b-need'), say = (row.querySelector('.stk-n') || {}).textContent || '';
      if (!row.classList.contains('is-open')){ row.querySelector('[data-th-go]').click(); await new Promise(r => setTimeout(r, 900)); }
      const r2 = document.querySelector(`#pd-thread .doc-th-row[data-th-row="${row.getAttribute('data-th-row')}"]`);
      const line = r2 && r2.querySelector('.stk-line'), vis = !!line && line.getClientRects().length > 0;
      return { row: true, by, red, say, vis, text: line ? line.innerText : '' };
    });
    ok('9 a risk-scan finding is a point under its clause: red, counted, its reason shown when opened, "Found by: Risk scan"',
      sc.row && sc.by.includes('scan') && sc.red && /1 to review/.test(sc.say) && sc.vis && /ninety days/.test(sc.text), JSON.stringify(sc));
    /* 8 THE OVERVIEW TAB IS GONE from Home's panel (owner, 13 Oct 2026); an old
       door onto it lands on Jambo */
    const tabs = await page.evaluate(() => { pdOpenOnHome('MK-S1', 'facts');
      return new Promise(r => setTimeout(() => r({ tabs: [...document.querySelectorAll('#ig-dock [data-pd-tab]')].map(b => b.getAttribute('data-pd-tab')), on: pdTab() }), 900)); });
    ok('8 Home\'s panel has no Overview tab, and its old door lands on Jambo', tabs.tabs.join(',') === 'copilot,doc,oblig,menu' && tabs.on === 'copilot'   /* + the Menu tab, 15 Oct 2026 */, JSON.stringify(tabs));
    /* 10 THE READING FOLLOWS THE READER (owner, 15 Oct 2026: "Make the deep
       dive answer in the reader's language"): the reading made in English (the
       scanned contract, read in step 9 and untouched since) is not served to a
       Swedish reader — opening Clauses reads it again, once, the server naming
       the language it wrote in, and that one is kept; back in English, the
       same sitting, it reads again once (the latch does not hold it shut) */
    const lg = await page.evaluate(async () => {
      const wait = async f => { for (let i = 0; i < 40 && !f(); i++) await new Promise(r => setTimeout(r, 250)); return !!f(); };
      const o = window.api;
      window.api = async function (p, ...a){ const r = await o.call(this, p, ...a); if (p === 'ai/breakdown' && r && !r.error) r.lang = langId(); return r; };
      const n0 = window.__bd.n, was = (getContract('MK-S3').breakdown || {}).lang || 'en';
      langSet('sv');
      pdOpenOnHome('MK-S3', 'doc');
      const read = await wait(() => (getContract('MK-S3').breakdown || {}).lang === 'sv' && document.querySelector('#pd-thread .stk-line'));
      const n1 = window.__bd.n;
      pdOpenOnHome('MK-S3', 'copilot'); await new Promise(r => setTimeout(r, 300));
      pdOpenOnHome('MK-S3', 'doc'); await wait(() => document.querySelector('#pd-thread .stk-line'));
      await new Promise(r => setTimeout(r, 800));
      const n2 = window.__bd.n;
      langSet('en');
      pdOpenOnHome('MK-S3', 'copilot'); await new Promise(r => setTimeout(r, 300));
      pdOpenOnHome('MK-S3', 'doc');
      const back = await wait(() => (getContract('MK-S3').breakdown || {}).lang === 'en' && document.querySelector('#pd-thread .stk-line'));
      const n3 = window.__bd.n, again = !!document.querySelector('#pd-thread [data-stk-run]');
      window.api = o;
      return { was, read, n0, n1, n2, back, n3, again };
    });
    ok('10 a Swedish reader is not served the English reading: Clauses reads it again once, in Swedish, and keeps it',
      lg.was === 'en' && lg.read && lg.n1 === lg.n0 + 1 && lg.n2 === lg.n1, JSON.stringify(lg));
    ok('10b back in English the same sitting, it reads again once in English, with no Read again press',
      lg.back && lg.n3 === lg.n2 + 1 && !lg.again, JSON.stringify(lg));
    ok('7 no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  } finally { await browser.close(); await h.stop(); }
  console.log(`${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
