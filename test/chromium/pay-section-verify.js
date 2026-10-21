/* PAY IS NOT DEAL VALUE — where the reader looks
   ================================================
   Owner picked "Pay section — the SAP way", 17 Oct 2026 (piece 1 of the
   sensitive-contracts plan). f696 asks the arithmetic and the server. This
   file asks the reader's questions in a real browser:
     1 · an employment contract's panel on Home: the job's five tiles (Role,
         Starts, Probation ends, Notice, Whose move), no Value tile, and a Pay
         table in the life line's place — base pay first, then each part
     2 · no figure adds it: the Board's total, the Contracts place's head and
         the List's value cell (a dash); a deal's panel is unchanged
     3 · Edit pay: the table as boxes, a refusal with its way forward, a part
         added, Save reaching the server, Cancel leaving the record alone
     4 · Details: the Pay cell reads base pay and how often; in Edit it is
         not a box — its door is Edit pay, back on the panel
     5 · a signed contract says why pay does not open; a reader who may not
         see money sees no pay
     6 · Svenska; the phone's terms say Pay
     7 · the owner's three screens: nothing scrolls sideways, Save on screen
   Run: node test/chromium/pay-section-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'pay-section');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0, passes = 0;
const check = (ok, what, detail) => {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail ? ' — ' + detail : ''));
  if (ok) passes++; else failures++;
};
/* A WAIT ASKS FOR THE STATE, BOUNDED — never a fixed pause */
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};

const PAY = { every: 'month', from: '2026-10-01', parts: [
  { id: 'p1', label: 'Housing allowance', every: 'month', amount: 60000 },
  { id: 'p2', label: 'Transport allowance', every: 'month', amount: 15000 },
  { id: 'p3', label: 'Performance bonus', every: 'year', words: 'Up to 15% of base' }] };
const EMP = (id, status, body) => ({ ...fixtureContract(id, 'Employment contract — Senior Accountant', 'Lucy Achieng', 'corp', 420000, status, body),
  template: null, expiry: null, fields: { effDate: '2026-10-01' },
  metadata: { category: 'employment', currency: 'KES', value: 420000, jobTitle: 'Senior Accountant', probationMonths: 3, noticePeriodDays: 90, effectiveDate: '2026-10-01' },
  pay: PAY });
const BODY = 'EMPLOYMENT CONTRACT\n\n1. Role\n\nThe Employee is employed as Senior Accountant.\n\n2. Pay\n\nThe Employer shall pay KES 420,000 a month.';

let BASE;
async function login(browser, email, pass, vp) {
  const ctx = await browser.newContext({ viewport: vp || { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await until(page, () => !!(window.currentUser && window.currentUser() && Array.isArray(window.state.contracts) && window.state.contracts.length > 4), null, 15000);
  return { ctx, page, errors };
}
const bring = async (page, id) => {
  await page.evaluate(x => hbStripBring(x, 'ov'), id);
  /* RE-POINTED 21 Oct 2026 (the report simplified): the facts row of The deal */
  return until(page, x => !!document.querySelector(`#bs-strip-${x} .bs-facts`), id);
};
const stripText = (page, id, sel) => page.evaluate(([x, s]) => { const el = document.querySelector(`#bs-strip-${x} ${s}`); return el ? el.innerText : null; }, [id, sel]);
const serverPay = page => page.evaluate(async () => { const r = await fetch('/api/contracts/MK-E1'); const j = await r.json(); return { value: j.value, pay: j.pay || null }; });
/* the save leaves after a short gather (persist's timer): ask the server until it says so, bounded */
const untilServer = async (page, ok, ms = 8000) => {
  const end = Date.now() + ms;
  for (;;) { const v = await serverPay(page); if (ok(v)) return true; if (Date.now() > end) return false; await page.waitForTimeout(150); }
};

(async () => {
  const h = await startHati();
  BASE = h.base;
  await seedWorkspace(h, { contracts: FIXTURES.concat([EMP('MK-E1', 'Draft', BODY), EMP('MK-E2', 'Signed', BODY)]) });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const A = await login(browser, 'admin@example.co.ke', 'adminpassword1');
    const P = A.page;
    /* a missing feature reports at once rather than waiting out the default */
    P.setDefaultTimeout(6000);

    /* ============ 1. THE JOB'S TILES AND THE PAY TABLE ============ */
    const up = await bring(P, 'MK-E1');
    check(up, '1a the employment contract comes up on the Board');
    const tiles = await P.evaluate(() => [...document.querySelectorAll('#bs-strip-MK-E1 .bs-f[data-bs-kpi]')].map(x => [x.getAttribute('data-bs-kpi'), x.querySelector('b').innerText, (x.querySelector('span') || {}).innerText || '']));
    check(JSON.stringify(tiles.map(t => t[0])) === JSON.stringify(['role', 'starts', 'probation', 'noticeLen']), '1b four facts: Role · Starts · Probation ends · Notice (whose move is a Needs you row since 21 Oct 2026)', tiles.map(t => t[0]).join(','));
    const t = Object.fromEntries(tiles.map(x => [x[0], x]));
    check(t.role && t.role[1] === 'Senior Accountant', '1c Role reads the job title, whole', t.role && t.role[1]);
    check(t.starts && t.starts[1] === '1 Oct 2026' && /No end date/.test(t.starts[2]), '1d Starts: the start day, and no end date said', t.starts && t.starts.join(' / '));
    check(t.probation && t.probation[1] === '31 Dec 2026' && /3 months/.test(t.probation[2]), '1e Probation ends on its last day, three months on', t.probation && t.probation.join(' / '));
    check(t.noticeLen && t.noticeLen[1] === '3 months', '1f Notice is a length, in months', t.noticeLen && t.noticeLen[1]);
    const rows = await P.evaluate(() => [...document.querySelectorAll('#bs-strip-MK-E1 .bs-pay-t tbody tr')].map(r => [...r.cells].map(c => c.innerText.trim())));
    check(rows.length === 4, '1g the Pay table: base pay and three parts', rows.length + ' rows');
    check(rows[0] && rows[0][0] === 'Base pay' && rows[0][1] === 'Monthly' && rows[0][2] === 'KES 420,000' && rows[0][3] === '1 Oct 2026', '1h base pay first: Monthly · KES 420,000 · from 1 Oct 2026', rows[0] && rows[0].join(' | '));
    check(rows[3] && rows[3][0] === 'Performance bonus' && rows[3][2] === 'Up to 15% of base', '1i a part in words stays words', rows[3] && rows[3].join(' | '));
    const lifeGone = await P.evaluate(() => !document.querySelector('#bs-strip-MK-E1 .bs-life') && !!document.querySelector('#bs-strip-MK-E1 .bs-pay'));
    check(lifeGone, '1j pay sits where a deal\'s life line does (the drawing picked)');
    const head = await stripText(P, 'MK-E1', '.bs-pay .bs-sec-h');
    check(/kept apart from deal value/.test(head || '') && /Edit pay/.test(head || ''), '1k the section says it is kept apart, and carries Edit pay', head);

    /* ============ 2. NOTHING ADDS IT ============ */
    const total = await P.evaluate(() => hbBookData('all', { whole: true }).figs.value.v);
    check(total === 48000000 + 36000000 + 85000000 + 78000000, '2a the Board\'s total is the deals alone', String(total));
    await bring(P, 'MK-A2');
    const deal = await P.evaluate(() => ({ kpis: [...document.querySelectorAll('#bs-strip-MK-A2 .bs-f[data-bs-kpi]')].map(x => x.getAttribute('data-bs-kpi')).join(','),
      life: !!document.querySelector('#bs-strip-MK-A2 .bs-line'), pay: !!document.querySelector('#bs-strip-MK-A2 .bs-pay') }));
    check(deal.kpis === 'value,notice' && deal.life && !deal.pay, '2b a deal\'s panel: Value first, its line, no Pay (the report simplified, 21 Oct 2026)', JSON.stringify(deal));
    await P.evaluate(() => { setView('register'); regPlaceSet({ show: 'list' }); regRepaint(); });
    const listed = await until(P, () => [...document.querySelectorAll('tr')].some(r => /MK-E1/.test(r.innerText)), null, 10000);
    const row = await P.evaluate(() => { const r = [...document.querySelectorAll('tr')].find(x => /MK-E1/.test(x.innerText)); return r ? r.innerText : ''; });
    check(listed && !/420/.test(row) && /—/.test(row), '2c the Contracts list\'s value cell is a dash', row.replace(/\s+/g, ' ').slice(0, 160));
    const placeHead = await P.evaluate(() => (document.querySelector('[data-reg-home]') || document.body).innerText.match(/KES [\d.,]+[KMB]? on paper/));
    check(!!placeHead && /247M/.test(placeHead[0]), '2d the place\'s head adds the deals alone', placeHead && placeHead[0]);
    await P.evaluate(() => { regPlaceSet({ show: 'wall' }); setView('dashboard'); });
    await until(P, () => !!document.getElementById('hb-board'));

    /* ============ 3. EDIT PAY ============ */
    await bring(P, 'MK-E1');
    await P.click('[data-bs-pay-edit="MK-E1"]');
    const ed = await until(P, () => !!document.querySelector('#bs-strip-MK-E1 .bs-pay-ed [data-bs-pay-f="amount"]'));
    check(ed, '3a Edit pay turns the table into boxes, in place');
    const boxes = await P.evaluate(() => ({ rows: document.querySelectorAll('#bs-strip-MK-E1 .bs-pay-ed tbody tr').length,
      base: document.querySelector('#bs-strip-MK-E1 [data-bs-pay-f="amount"][data-bs-pay-i="0"]').value,
      acts: [...document.querySelectorAll('#bs-strip-MK-E1 .bs-pay-acts button')].map(b => b.innerText.trim()).join(' · ') }));
    check(boxes.rows === 4 && boxes.base === '420000', '3b every row as boxes, base pay first', JSON.stringify(boxes));
    check(/Add a part · Save · Cancel$/.test(boxes.acts), '3c Add a part, then Save, Cancel last', boxes.acts);
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await P.setViewportSize(vp);
      await P.evaluate(() => { const b = document.querySelector('[data-bs-pay-save="MK-E1"]'); if (b) b.scrollIntoView({ block: 'center' }); });
      const fit = await P.evaluate(() => {
        const b = document.querySelector('[data-bs-pay-save="MK-E1"]'); const r = b.getBoundingClientRect();
        const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        const s = document.querySelector('#bs-strip-MK-E1');
        return { save: !!at && (at === b || b.contains(at)), side: s.scrollWidth - s.clientWidth, page: document.documentElement.scrollWidth - innerWidth };
      });
      check(fit.save && fit.side <= 1 && fit.page <= 1, `3d at ${vp.width}×${vp.height}: Save on screen, nothing scrolls sideways`, JSON.stringify(fit));
      const s = await P.$('#bs-strip-MK-E1'); if (s) await s.screenshot({ path: path.join(OUT, `edit-${vp.width}x${vp.height}.png`) });
    }
    await P.setViewportSize({ width: 1440, height: 780 });
    await P.fill('#bs-strip-MK-E1 [data-bs-pay-f="amount"][data-bs-pay-i="0"]', 'a lot');
    await P.click('[data-bs-pay-save="MK-E1"]');
    const refused = await until(P, () => [...document.querySelectorAll('.toast, [role="status"], #toast-host *')].some(x => /as a number/.test(x.textContent || '')), null, 4000);
    check(refused, '3e base pay in words is refused, with the way forward said');
    check((await serverPay(P)).value === 420000, '3f and nothing reached the record');
    await P.fill('#bs-strip-MK-E1 [data-bs-pay-f="amount"][data-bs-pay-i="0"]', '450,000');
    await P.click('[data-bs-pay-add="MK-E1"]');
    const added = await until(P, () => document.querySelectorAll('#bs-strip-MK-E1 .bs-pay-ed tbody tr').length === 5);
    const focused = await P.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-bs-pay-f'));
    check(added && focused === 'label', '3g Add a part draws a fifth row and puts the cursor in its name', String(focused));
    await P.fill('#bs-strip-MK-E1 [data-bs-pay-f="label"][data-bs-pay-i="4"]', 'Phone allowance');
    await P.fill('#bs-strip-MK-E1 [data-bs-pay-f="amount"][data-bs-pay-i="4"]', '5000');
    await P.click('[data-bs-pay-save="MK-E1"]');
    const back = await until(P, () => !document.querySelector('#bs-strip-MK-E1 .bs-pay-ed') && document.querySelectorAll('#bs-strip-MK-E1 .bs-pay-t tbody tr').length === 5);
    check(back, '3h Save closes the boxes and the table shows five rows');
    const reached = await untilServer(P, j => j.value === 450000 && !!j.pay && (j.pay.parts || []).some(p => p.label === 'Phone allowance' && p.amount === 5000));
    check(reached, '3i the server holds base pay 450,000 and the new part');
    const total2 = await P.evaluate(() => hbBookData('all', { whole: true }).figs.value.v);
    check(total2 === total, '3j a raise moves no total', String(total2));
    await P.click('[data-bs-pay-edit="MK-E1"]');
    await until(P, () => !!document.querySelector('#bs-strip-MK-E1 .bs-pay-ed'));
    await P.fill('#bs-strip-MK-E1 [data-bs-pay-f="amount"][data-bs-pay-i="0"]', '999999');
    await P.click('[data-bs-pay-cancel="MK-E1"]');
    const cancelled = await until(P, () => !document.querySelector('#bs-strip-MK-E1 .bs-pay-ed'));
    const kept = await serverPay(P);
    check(cancelled && kept.value === 450000, '3k Cancel leaves the record alone', JSON.stringify({ cancelled, value: kept.value }));
    await P.setViewportSize({ width: 1440, height: 780 });
    { const s = await P.$('#bs-strip-MK-E1'); if (s) await s.screenshot({ path: path.join(OUT, 'panel-1440x780.png') }); }

    /* ============ 4. DETAILS: THE PAY CELL, AND ITS ONE DOOR ============ */
    await P.evaluate(() => bsStripPage('MK-E1', 'details'));
    const det = await until(P, () => /Pay/.test((document.querySelector('#bs-strip-MK-E1 .bs-details') || {}).innerText || ''), null, 10000);
    const cells = await P.evaluate(() => (document.querySelector('#bs-strip-MK-E1 .bs-details') || {}).innerText || '');
    check(det && /KES 450,000 · Monthly/.test(cells), '4a the terms say Pay: base pay and how often', '');
    check(/Role/.test(cells) && /Probation \(months\)/.test(cells) && !/Payment terms/.test(cells) && !/Liability capped/i.test(cells), '4b Role and Probation stand in for payment terms and the liability cap; still eight');
    await P.click('#bs-strip-MK-E1 [data-ov-edit="all"]').catch(() => {});
    const door = await until(P, () => !!document.querySelector('#bs-strip-MK-E1 [data-ov-pay-edit="MK-E1"]'), null, 6000);
    const noBox = await P.evaluate(() => !document.querySelector('#bs-strip-MK-E1 .bs-details [data-kt="value"]'));
    check(door && noBox, '4c in Edit, the Pay cell is not a box: its door is Edit pay');
    if (door) await P.click('#bs-strip-MK-E1 [data-ov-pay-edit="MK-E1"]');
    const landed = await until(P, () => !!document.querySelector('#bs-strip-MK-E1[data-bs-on="ov"] .bs-pay-ed'), null, 6000);
    check(landed, '4d the door lands on the panel with the Pay boxes open');
    await P.evaluate(() => { const b = document.querySelector('[data-bs-pay-cancel="MK-E1"]'); if (b) b.click(); });

    /* ============ 5. SIGNED; AND A READER WHO MAY NOT SEE MONEY ============ */
    await bring(P, 'MK-E2');
    const signed = await stripText(P, 'MK-E2', '.bs-pay .bs-sec-h');
    const signedBtn = await P.$('[data-bs-pay-edit="MK-E2"]');
    check(!signedBtn && /a change of pay is an amendment/.test(signed || ''), '5a a signed contract says why pay does not open, where the button would be', signed);
    const N = await login(browser, 'novalues@example.co.ke', 'their-own-pass-9');
    await bring(N.page, 'MK-E1');
    const hidden = await N.page.evaluate(() => { const s = document.querySelector('#bs-strip-MK-E1'); return s ? s.innerText : ''; });
    check(!/420,000|450,000|60,000/.test(hidden) && /you are not shown money/.test(hidden), '5b no pay figure reaches them; the section says why');
    check(!(await N.page.$('[data-bs-pay-edit="MK-E1"]')), '5c and no Edit pay');
    await N.ctx.close();

    /* ============ 6. SVENSKA; THE PHONE ============ */
    await P.evaluate(() => { if (window.langSet) langSet('sv'); });
    await bring(P, 'MK-E1');
    const sv = await stripText(P, 'MK-E1', '.bs-pay');
    const svTiles = await stripText(P, 'MK-E1', '.bs-facts');
    check(/Lön/.test(sv || '') && /Grundlön/.test(sv || '') && /Roll/.test(svTiles || '') && /Uppsägningstid/.test(svTiles || ''), '6a in Swedish: Lön, Grundlön, Roll, Uppsägningstid');
    await P.evaluate(() => { if (window.langSet) langSet('en'); });
    const phone = await P.evaluate(() => (typeof mTermsHtml === 'function') ? mTermsHtml(getContract('MK-E1')).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ') : '');
    check(/Pay KES 450,000 · Monthly/.test(phone) && !/Contract value/.test(phone), '6b the phone\'s terms say Pay, with how often', phone.slice(0, 200));

    /* ============ 7. NO ERRORS ============ */
    check(!A.errors.length, '7 no page errors', A.errors.join(' | ').slice(0, 300));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
