/* THE READ TABLE, INSIDE READS (round 4 of the review; the owner picked "The Legora way", 28 Oct 2026; the drawing
   look/r8 p5). On 16 contracts, five with a rebate, the question read and one answer ticked:
     1 · Open the table on a Reads row opens it on the Reads page itself — the page never passes through
         Contracts on the way (item 5)
     2 · the head: ‹ All reads · Rebate · the question · 16 read; Copy the table and Ask again stand (17, 22)
     3 · a row leads with the agreement (bold name, party · ref under); a cell is the light, the short answer
         and its §; a Checked column (18, 19)
     4 · All 16 · Yes 5 · No 11, and the box narrows the rows (20)
     5 · a chosen row's reading is in Jambo's panel: the answer, where, the words ONCE (never in the table),
         Go to § and the tick (21)
     6 · ‹ All reads goes back to the list of reads (6); a refresh on the table lands on the table
     7 · the table at the owner's three screens; no page errors
   At the parent (before this change) 1 fails: the table opened over Contracts. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const OUT = process.env.READ_TABLE_SHOTS || path.join(__dirname, 'shots', 'read-table');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const PARTIES = ['Kabras Sugar', 'Nandi Dairy', 'Juno Logistics', 'Naivas Supermarkets', 'Bidco Africa', 'Twiga Foods', 'Unga Group', 'Brookside Dairy'];
const TYPES = [['Supply Agreement', 'proc'], ['Distribution Agreement', 'dist'], ['Framework Agreement', 'proc'], ['Retail Supply', 'sales']];
const REBATE = [1, 4, 7, 10, 13];
const BODY = (party, type, rebate) => `${type.toUpperCase()}\n\nThis ${type} is made between Highland Corporate Ltd and ${party}.\n\n3. Payment\nPayment is due within thirty days of invoice.${rebate ? '\n\n4. Rebate\nThe Supplier shall grant the Buyer a volume rebate of two per cent (2%) of the net invoiced value once annual purchases exceed KES 50 million.' : ''}\n\n9. Termination\nEither party may end this agreement on thirty days' written notice to the other.`;
const IDS = Array.from({ length: 16 }, (_, i) => `HC-${2001 + i}`);
const book = () => IDS.map((id, i) => { const party = PARTIES[i % PARTIES.length], [type, folder] = TYPES[i % TYPES.length];
  return fixtureContract(id, type, party, folder, (12 + i * 3) * 1000000, 'Signed', BODY(party, type, REBATE.includes(i))); });
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ AI_RATE_DEEP: '200' });
  const W = await seedWorkspace(h, { contracts: book() });
  const r = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: 'Does this contract mention a rebate?', name: 'Rebate', ids: IDS } });
  const askId = r.ask.id;
  await W.admin.json(`/api/columns/${encodeURIComponent(askId)}/check`, { method: 'POST', body: { contractId: 'HC-2014', checked: true } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    const errors = []; page.on('pageerror', e => errors.push(String(e && e.message || e)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length >= 16 && typeof window.readsOpen === 'function', null, 40000);
    await page.waitForTimeout(800);

    /* ---- 1 Open the table stays on Reads ---- */
    await page.evaluate(id => readsOpen(id), askId);
    await until(page, () => !!document.querySelector('#ins-panel [data-rd-act="table"]'), null, 15000);
    await page.evaluate(() => { window.__views = []; const t = setInterval(() => { window.__views.push(state.view); }, 30); window.__stopViews = () => clearInterval(t); });
    await page.click('#ins-panel [data-rd-act="table"]');
    const opened = await until(page, () => document.querySelectorAll('#rd-page [data-rdt-row]').length === 16, null, 15000);
    const views = await page.evaluate(() => { window.__stopViews(); return [...new Set(window.__views)]; });
    check('1 Open the table opens it on the Reads page, never by way of Contracts', opened && views.length === 1 && views[0] === 'reads', { views });

    /* ---- 2 the head ---- */
    const head = await page.evaluate(() => { const h = document.querySelector('#rd-page .rdt-head'); return h ? h.innerText.replace(/\s+/g, ' ').trim() : ''; });
    check('2 the head: ‹ All reads · Rebate · the question · 16 read, with Copy the table and Ask again', /^‹ All reads · Rebate “Does this contract mention a rebate\?” · 16 read/.test(head) && /Copy the table/.test(head) && /Ask again/.test(head), head);

    /* ---- 3 the row ---- */
    const row = await page.evaluate(() => { const tr = document.querySelector('#rd-page [data-rdt-row="HC-2014"]'); if (!tr) return null; const td = tr.querySelectorAll('td');
      return { first: td[0].innerText.replace(/\s+/g, ' ').trim(), bold: !!td[0].querySelector('.rd-nm'), light: !!td[1].querySelector('.ac-ans i'), cell: td[1].innerText.replace(/\s+/g, ' ').trim(), sec: !!td[1].querySelector('.rdt-sec'), ck: td[2].innerText.trim(),
        heads: [...document.querySelectorAll('#rd-page .rdt-t thead th')].map(t => t.textContent.trim()) }; });
    check('3 a row leads with the agreement, party · ref under; the light, the short answer and its §; Checked',
      row && row.bold && /^Distribution Agreement Twiga Foods · HC-2014$/.test(row.first) && row.light && row.sec && /§ 9/.test(row.cell) && /^Amina, /.test(row.ck) && row.heads.join('|') === 'Agreement|Rebate|Checked', row);

    /* ---- 4 tabs and the box ---- */
    const tabs = await page.evaluate(() => [...document.querySelectorAll('#rd-page [data-rdt-tab]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()));
    await page.click('#rd-page [data-rdt-tab="yes"]');
    const yes = await until(page, () => document.querySelectorAll('#rd-page [data-rdt-row]').length === 5);
    const yesIds = await page.evaluate(() => [...document.querySelectorAll('#rd-page [data-rdt-row]')].map(r => r.getAttribute('data-rdt-row')).sort());
    await page.click('#rd-page [data-rdt-tab="all"]');
    await page.fill('#rdt-q', 'twiga');
    const boxed = await until(page, () => document.querySelectorAll('#rd-page [data-rdt-row]').length === 2);
    const foot = await page.evaluate(() => (document.querySelector('#rd-page .rd-card .lh-foot') || {}).innerText || '');
    check('4 All 16 · Yes 5 · No 11; Yes shows the five with a rebate; the box narrows the rows',
      tabs.join('|') === 'All16|Yes5|No11' && yes && yesIds.join(',') === 'HC-2002,HC-2005,HC-2008,HC-2011,HC-2014' && boxed, { tabs, yesIds, foot });
    await page.fill('#rdt-q', '');
    await until(page, () => document.querySelectorAll('#rd-page [data-rdt-row]').length === 16);
    const foot16 = await page.evaluate(() => (document.querySelector('#rd-page .rd-card .lh-foot') || {}).innerText.replace(/\s+/g, ' ').trim());
    check('4b the foot says "16 contracts · 5 say yes"', /16 contracts · 5 say yes/.test(foot16), foot16);

    /* ---- 5 the chosen row in Jambo's panel ---- */
    await page.click('#rd-page [data-rdt-row="HC-2014"]');
    const side = await until(page, () => !!document.querySelector('#ins-panel [data-rdt-go]') && /Twiga/.test((document.querySelector('#ins-panel') || {}).innerText || ''));
    const S = await page.evaluate(() => { const p = document.querySelector('#ins-panel'); const t = p.innerText.replace(/\s+/g, ' ');
      return { text: t.slice(0, 400), quote: !!p.querySelector('.rdt-quote'), go: (p.querySelector('[data-rdt-go]') || {}).textContent, ck: (p.querySelector('[data-rdt-ck]') || {}).textContent,
        quoteInTable: [...document.querySelectorAll('#rd-page .rdt-t td')].some(td => /made between/.test(td.textContent)) }; });
    check('5 the chosen row\'s reading is in Jambo\'s panel: answer, where, the words once, Go to clause and the tick',
      side && S.quote && /Go to clause 9/.test(S.go || '') && /Untick/.test(S.ck || '') && /Answer/.test(S.text) && /Where/.test(S.text) && /Words/.test(S.text) && !S.quoteInTable, S);
    for (const [w, ht] of SCREENS){ await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(300); await page.screenshot({ path: path.join(OUT, `table-${w}x${ht}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 });
    const spill = await page.evaluate(() => [...document.querySelectorAll('#rd-page .rdt-head > *, #rd-page .rdt-bar > *, #rd-page .rdt-t td')].filter(e => e.scrollWidth > e.clientWidth + 1 && !e.querySelector('.rd-nm, .rd-sub, .rdt-w, .rdt-ck, .rdt-sub') && !e.classList.contains('rdt-sub')).map(e => e.className || e.tagName).slice(0, 5));
    check('5b nothing in the head, the bar or a cell spills', !spill.length, spill);

    /* ---- 6 back, and a refresh lands on the table ---- */
    await page.click('#rd-page [data-rdt-row="HC-2002"]');
    await page.waitForTimeout(200);
    await page.evaluate(() => { if (typeof placeSave === 'function') placeSave(); });
    await page.reload({ waitUntil: 'networkidle' });
    const again = await until(page, () => document.querySelectorAll('#rd-page [data-rdt-row]').length === 16 && !!document.querySelector('#rd-page [data-rdt-row="HC-2002"].is-sel'), null, 30000);
    check('6 a refresh on the table lands on the table, the same row chosen', again);
    await page.click('#rd-page [data-rdt-back]');
    const back = await until(page, () => !document.querySelector('#rd-page [data-rdt-row]') && !!document.querySelector('#rd-page [data-rd-row]'));
    check('6b ‹ All reads goes back to the list of reads', back && await page.evaluate(() => state.view === 'reads'));
    check('7 no page errors', !errors.length, errors.slice(0, 3));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
