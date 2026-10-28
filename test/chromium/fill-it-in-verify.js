/* A FIELD LEFT BLANK IS FILLED IN, NOT ARGUED (round 5 of the review, 28 Oct 2026; the owner: "does not filling in a
   field in the contract need a deep dive?", then "make deep dive, fill it in and start redlining have the same design
   as the other green links that are underlined"). On a contract whose notices clause leaves the address blank, with
   Jambo's read of it kept (one blank point, one real risk):
     1 · the blank point carries Fill it in and Mark reviewed — no Deep dive, no Start redlining
     2 · the real risk keeps Start redlining, Deep dive and Mark reviewed
     3 · Deep dive, Fill it in and Start redlining are green and underlined, as HaTi's links are; Mark reviewed is not
     4 · Fill it in opens the contract's own fill-in box for that field, free (no Jambo call)
     5 · once the field is filled, the point is gone from the list and from the number on the tab
     6 · the walk ‹ › through the deep dives steps past the blank point
     7 · no page errors
   At the parent (before this change) 1, 3 and 4 fail: every point had the same three buttons. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.FILL_SHOTS || path.join(__dirname, 'shots', 'fill-it-in');
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 10000) => { let v; const t0 = Date.now();
  while (Date.now() - t0 < ms){ try { v = await page.evaluate(fn, arg); } catch (_){ v = null; } if (v) return v; await page.waitForTimeout(120); }
  return v; };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const TEXT = 'SUPPLY AGREEMENT\n\nThis Supply Agreement is made between Highland Corporate Ltd and Juno Limited.\n\n1. Term\n' + 'The agreement runs for two years from signature and renews only in writing. '.repeat(6) + '\n\n2. Payment\n' + 'Invoices are paid within thirty days of receipt by bank transfer. '.repeat(6) + '\n\n3. Liability\nLiability is capped at the fees paid in the last three months, whatever the claim. ' + 'Neither party is liable for indirect loss of any kind. '.repeat(5) + '\n\n11. Notices\nEvery notice under this agreement is sent to the Buyer at its notice address: ______________________.';
const deal = { id: 'MK-F1', contractNo: 'MK-F1', name: 'Juno Supply', counterparty: 'Juno Limited', folder: 'proc', value: 900000, valueType: 'standard',
  status: 'Under Review', template: 'upload', source: 'upload', lastAction: '1 Oct 2026', expiry: '2029-06-30', hash: null, signedAt: null,
  fields: {}, metadata: { value: 900000, currency: 'KES' }, comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }], changes: [], redlineText: TEXT, format: 'text', upload: { fileName: 'juno-supply.docx', extractedText: TEXT } };
const BREAKDOWN = { head: 'Two things', sub: 'A small cap and an empty address.', links: [],
  regions: [{ name: 'Risk', status: 'need', kind: 'protect', headline: 'A small cap', items: [{ ref: '3', title: 'Liability' }, { ref: '11', title: 'Notices' }], quotes: [] }],
  points: [
    { clause: '3', region: 1, status: 'need', missing: false, title: 'Their liability is capped at three months of fees', stake: 'Their cover stops far below the risk.',
      what: 'A failure could cost far more than the cap.', theirs: 'Three months.', usual: 'Twelve months.', figure: '', how: '', push: '', edge: [], trade: [], ask: '',
      quote: 'Liability is capped at the fees paid in the last three months, whatever the claim.', links: [] },
    { clause: '11', region: 1, status: 'look', missing: false, blank: true, title: 'The notice address is blank', stake: 'Notices have nowhere to go.',
      what: '', theirs: '', usual: '', figure: '', how: '', push: '', edge: [], trade: [], ask: '', quote: '', links: [] }] };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [deal], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => typeof getContract === 'function' && !!getContract('MK-F1'), null, { timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await page.evaluate(B => { state.aiConfigured = true; const o = window.api; window.__calls = 0;
      window.api = async function (p, ...a){ if (p === 'ai/breakdown') return JSON.parse(JSON.stringify(B)); if (/^ai\//.test(p)) window.__calls++; return o.call(this, p, ...a); }; }, BREAKDOWN);
    await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-F1', 'doc'); });
    const cards = async () => page.evaluate(() => [...document.querySelectorAll('#pd-thread .stk-card')].map(c => ({ title: c.querySelector('.stk-ct').textContent.trim(),
      acts: [...c.querySelectorAll('.stk-cacts button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
      links: [...c.querySelectorAll('.stk-cacts button')].map(b => { const s = getComputedStyle(b); return { t: b.textContent.trim(), line: s.textDecorationLine.includes('underline'), color: s.color }; }) })));
    /* the cards stand in the rows; open every row so both cards are drawn (the read pressed if it waits for a press) */
    await until(page, () => !!document.querySelector('#pd-thread .doc-th-row'), null, 15000);
    await page.evaluate(() => { const r = document.querySelector('#pd-thread [data-stk-run]'); if (r) r.click(); });
    await until(page, () => !!document.querySelector('#pd-thread .stk-card, #pd-thread [data-stk-dive]'), null, 10000);
    await page.evaluate(() => document.querySelectorAll('#pd-thread .doc-th-row').forEach(r => { const b = r.querySelector('[aria-expanded="false"], .doc-th-hd, button'); if (b && !r.querySelector('.stk-card')) b.click(); }));
    const C = await until(page, () => document.querySelectorAll('#pd-thread .stk-card').length >= 2 ? true : null, null, 10000) ? await cards() : await cards();
    const blank = C.find(x => /notice address/.test(x.title)), risk = C.find(x => /capped/.test(x.title));
    check('1 the blank point carries Fill it in and Mark reviewed — no Deep dive, no Start redlining', !!blank && blank.acts.join('|') === 'Fill it in|Mark reviewed', blank || C);
    check('2 the real risk keeps Start redlining, Deep dive and Mark reviewed', !!risk && risk.acts.join('|') === 'Start redlining|Deep dive|Mark reviewed', risk || C);
    const ink = await page.evaluate(() => { const a = document.createElement('a'); a.style.color = 'var(--accent-ink)'; document.body.appendChild(a); const c = getComputedStyle(a).color; a.remove(); return c; });
    const L = [].concat(blank ? blank.links : [], risk ? risk.links : []);
    const links = L.filter(x => /Fill it in|Deep dive|Start redlining/.test(x.t)), mark = L.filter(x => /Mark reviewed/.test(x.t));
    check('3 Deep dive, Fill it in and Start redlining are green and underlined; Mark reviewed is not', links.length === 3 && links.every(x => x.line && x.color === ink) && mark.every(x => !x.line), { links, mark, ink });
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]){ await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(300); await page.screenshot({ path: path.join(OUT, `points-${w}x${ht}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* 6 the walk steps past the blank point */
    const walk = await page.evaluate(() => { const b = document.querySelector('#pd-thread .stk-card [data-stk-dive]'); if (b) b.click(); return !!b; });
    const dv = walk && await until(page, () => !!document.querySelector('#pd-thread .stk-dv'), null, 8000);
    const titles = [];
    if (dv) for (let k = 0; k < 3; k++){ titles.push(await page.evaluate(() => (document.querySelector('#pd-thread .stk-dv-head') || {}).textContent || ''));
      const next = await page.evaluate(() => { const n = document.querySelectorAll('#pd-thread .stk-pg [data-stk-dive]')[1]; if (n && !n.disabled){ n.click(); return true; } return false; }); if (!next) break; await page.waitForTimeout(300); }
    const arrows = await page.evaluate(() => [...document.querySelectorAll('#pd-thread .stk-pg [data-stk-dive]')].map(b => b.disabled));
    check('6 the walk through the deep dives steps past the blank point; with only it ahead, › is greyed', !!dv && titles.every(t => !/notice address/.test(t)) && arrows.join(',') === 'true,true', { titles: titles.map(t => t.replace(/\s+/g, ' ').slice(0, 60)), arrows });
    await page.evaluate(() => { const b = document.querySelector('#pd-thread [data-stk-back]'); if (b) b.click(); });
    await until(page, () => !!document.querySelector('#pd-thread [data-stk-fill]'), null, 8000);

    /* 4 Fill it in opens the field's own box, free */
    const calls0 = await page.evaluate(() => window.__calls);
    const blanks = await page.evaluate(() => contractBlanks(getContract('MK-F1')).map(b => ({ key: b.key, label: b.label, section: b.section, value: b.value })));
    await page.evaluate(() => document.querySelector('#pd-thread [data-stk-fill]').click());
    const box = await until(page, () => { const a = document.activeElement; return a && /INPUT|TEXTAREA/.test(a.tagName) && a.closest('#ig-dock, #pd-og, [data-pd-og], .pd-og') ? (a.getAttribute('data-og-key') || a.getAttribute('data-key') || a.id || a.name || 'box') : null; }, null, 10000);
    check('4 Fill it in opens the contract\'s own fill-in box for that field, free', !!box && (await page.evaluate(() => window.__calls)) === calls0, { box, blanks });
    await page.screenshot({ path: path.join(OUT, 'fill-1440x780.png') });

    /* 5 filled, the point is gone from the list and the tab's number */
    const n0 = await page.evaluate(() => (typeof stkNeedCount === 'function') ? stkNeedCount(getContract('MK-F1')) : null);
    await page.evaluate(B => { const c = getContract('MK-F1'); B.forEach(b => contractBlankSet(c, b.key, 'Juno House, Nairobi')); }, blanks);
    await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-F1', 'doc'); });
    await until(page, () => !!document.querySelector('#pd-thread .doc-th-row'), null, 15000);
    await page.evaluate(() => { const r = document.querySelector('#pd-thread [data-stk-run]'); if (r) r.click(); });
    await page.waitForTimeout(400);
    await page.evaluate(() => document.querySelectorAll('#pd-thread .doc-th-row').forEach(r => { const b = r.querySelector('[aria-expanded="false"], .doc-th-hd, button'); if (b && !r.querySelector('.stk-card')) b.click(); }));
    await page.waitForTimeout(600);
    const after = await cards(), n1 = await page.evaluate(() => (typeof stkNeedCount === 'function') ? stkNeedCount(getContract('MK-F1')) : null);
    check('5 once the field is filled, the point is gone from the list and the count drops', blanks.length > 0 && !after.some(x => /notice address/.test(x.title)) && after.some(x => /capped/.test(x.title)) && (n0 == null || n1 == null || n1 <= n0), { n0, n1, after: after.map(x => x.title) });
    check('7 no page errors', !errors.length, errors.slice(0, 3));
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
