/* ASK A COLUMN — one question asked of the wording of many contracts, each
   answer a cell on the Contracts list (owner, 20 Oct 2026: "In Jambo's panel"
   picked by name, with "The SAP way" for show-why and "Tick in the cell" for
   checked-by; limit 50; anyone who can edit contracts may ask;
   js/views/askcolumn.js, POST /api/ai/column)

   WHAT THIS PINS, driven in a real browser
     1 THE DOOR: "Ask a column" in the list's own head; a press opens the
       question in Jambo's panel — Your question, Column name, the cost said
       first (contracts and Jambo calls), Ask N contracts · Cancel; the same
       press closes it again.
     2 THE COLUMN: Ask fills one column per question, each contract a cell
       with its answer and the line under it, "not checked" until a person
       ticks; Owner steps aside, as drawn; the panel says the column (the
       question, counts, Save as a view · Ask again · Remove column).
     3 THE SAP WAY: a press on an answer CHOOSES it (the row lit, the row's
       contract not opened) and the panel says Answer · Why · Source · Clause ·
       Read with Go to clause; a second press lets it go.
     4 TICK IN THE CELL: the circle ticks it ("checked AO"), the panel counts
       "1 of 4", "show the 3 not checked" narrows the list to those three.
     5 KEPT: a refresh keeps the column and its answers and spends nothing;
       the team's question is a chip, and asked again it costs nothing.
     6 GO TO CLAUSE: the contract opens on Home's paper with the sentence lit.
     7 JAMBO'S BOX: "ask a column" opens the same question beside the list.
     8 A VIEWER: the door is greyed and says why.
     9 the owner's three screens: the list and the panel fit, nothing sideways.
   AT THE PARENT (b8671fc) every stage FAILS: no such door exists.
   Run: node test/chromium/ask-a-column-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'ask-a-column');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const until = async (page, fn, arg, ms = 6000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const Q = 'How much notice does each side need to end the contract early?';

async function signIn(page, base, email, pass_) {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', email); await page.fill('#li-pass', pass_); await page.click('#li-go');
  await until(page, () => typeof window.setView === 'function' && window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, 15000);
}
async function toList(page) {
  await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
  return until(page, () => !!document.querySelector('#reg-tbody tr[data-row]'));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const w = await seedWorkspace(h);
  await w.admin.json('/api/users', { method: 'POST', body: { name: 'Vera Viewer', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  const vc = h.client('viewer');
  await vc.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
  await vc.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => errors.push(String(e)));
    await signIn(page, h.base, 'admin@example.co.ke', 'adminpassword1');
    check('0 the Contracts list is up', await toList(page));

    /* ============ 1. THE DOOR ============ */
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner's pick "The Legora way"): the
       list's own card head is gone; "Ask a column" stands at the list head's
       chip row's end */
    const btn = await page.evaluate(() => { const b = document.querySelector('.lh-chips [data-ac-open]'); return b ? { txt: b.textContent.trim(), dis: b.disabled } : null; });
    check('1a "Ask a column" stands in the list\'s own head', !!btn && /Ask a column/.test(btn.txt) && !btn.dis, JSON.stringify(btn));
    await page.click('[data-ac-open]');
    const opened = await until(page, () => !!document.querySelector('#ig-dock #ac-form #ac-q'));
    const form = await page.evaluate(() => { const f = document.querySelector('#ac-form'); return f ? f.innerText : ''; });
    check('1b the question opens in Jambo\'s panel', opened && /Your question/.test(form) && /Column name/.test(form), form.slice(0, 120));
    check('1c the cost is said before the press: the contracts and the Jambo calls', /4 contracts/.test(form) && /4 Jambo calls/.test(form) && /Ask 4 contracts/.test(form) && /Cancel/.test(form));
    await page.click('[data-ac-open]');
    check('1d the same press closes it again', await until(page, () => !document.querySelector('#ac-form')));
    await page.screenshot({ path: path.join(OUT, '01-closed.png') });

    /* ============ 2. THE COLUMN ============ */
    await page.click('[data-ac-open]'); await until(page, () => !!document.querySelector('#ac-q'));
    await page.fill('#ac-q', Q); await page.fill('#ac-name', 'Notice to end');
    await page.screenshot({ path: path.join(OUT, '02-asking.png') });
    const before = h.ai.calls.length;
    await page.click('[data-ac-ask]');
    const filled = await until(page, () => document.querySelectorAll('td.ac-cell .ac-ans').length === 4, null, 15000);
    const col = await page.evaluate(() => ({
      heads: [...document.querySelectorAll('.reg-table thead th')].map(th => th.textContent.trim()),
      cells: [...document.querySelectorAll('td.ac-cell')].map(td => td.innerText.replace(/\s+/g, ' ').trim()),
      panel: (document.querySelector('#ig-dock [data-ac-col]') || {}).innerText || '' }));
    check('2a one column, every contract answered', filled && col.heads.includes('Notice to end'), JSON.stringify(col.heads));
    check('2b each cell: its answer and "not checked" under it', col.cells.every(t => /30 days/.test(t) && /not checked/.test(t)), JSON.stringify(col.cells));
    check('2c Owner steps aside while an answer column stands, as drawn', !col.heads.includes('Owner'));
    check('2d the panel says the column, with its three doors', /Notice to end/.test(col.panel) && /4 answered/.test(col.panel) && /Save as a view/.test(col.panel) && /Ask again/.test(col.panel) && /Remove column/.test(col.panel), col.panel.slice(0, 200));
    check('2e the calls said are the calls made', h.ai.calls.length - before === 4, String(h.ai.calls.length - before));
    await page.screenshot({ path: path.join(OUT, '03-column.png') });

    /* ============ 3. THE SAP WAY ============ */
    const view = await page.evaluate(() => state.view);
    await page.click('td.ac-cell[data-ac-cid="MK-A1"] .ac-a');
    const why = await until(page, () => !!document.querySelector('#ig-dock .ac-why-card'));
    const card = await page.evaluate(() => ({ t: (document.querySelector('#ig-dock .ac-why-card') || {}).innerText || '',
      lit: !!document.querySelector('tr.ac-row-on td.ac-cell.is-on'), view: state.view, paper: !!(window.pdContract && pdContract()) }));
    check('3a a press chooses the answer: the row lit, nothing opened', why && card.lit && card.view === view && !card.paper, JSON.stringify({ lit: card.lit, paper: card.paper }));
    check('3b the panel says Answer · Why · Source · Clause · Read, with Go to clause', ['Answer', 'Why', 'Source', 'Clause', 'Read', 'Go to clause 9'].every(k => card.t.includes(k)) && /procurement@kabras/.test(card.t), card.t.replace(/\s+/g, ' ').slice(0, 220));
    await page.screenshot({ path: path.join(OUT, '04-why.png') });
    await page.click('td.ac-cell[data-ac-cid="MK-A1"] .ac-a');
    check('3c a second press lets it go', await until(page, () => !document.querySelector('#ig-dock .ac-why-card') && !document.querySelector('tr.ac-row-on')));

    /* ============ 4. TICK IN THE CELL ============ */
    await page.click('td.ac-cell[data-ac-cid="MK-A1"] [data-ac-ck]');
    const ticked = await until(page, () => /checked AO/.test((document.querySelector('td.ac-cell[data-ac-cid="MK-A1"]') || {}).innerText || ''));
    const line = await page.evaluate(() => (document.querySelector('#ig-dock .ac-ckline') || {}).innerText || '');
    check('4a the circle ticks it, with the initials of who', ticked);
    check('4b the panel counts it: 1 of 4, and offers the 3 not checked', /1 of 4 answers checked by a person/.test(line) && /show the 3 not checked/.test(line), line);
    await page.screenshot({ path: path.join(OUT, '05-ticked.png') });
    await page.click('[data-ac-unck]');
    const three = await until(page, () => document.querySelectorAll('#reg-tbody tr[data-row]').length === 3);
    const rows = await page.evaluate(() => [...document.querySelectorAll('#reg-tbody tr[data-row]')].map(tr => tr.getAttribute('data-row')));
    const cells3 = (await page.$$('td.ac-cell')).length;
    check('4c "show the 3 not checked" narrows the list to those three, the column kept', three && !rows.includes('MK-A1') && cells3 === 3, JSON.stringify(rows));

    /* ============ 5. KEPT ============ */
    const spent = h.ai.calls.length;
    await page.reload({ waitUntil: 'networkidle' });
    await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, 15000);
    await page.evaluate(() => { regPlaceSet({ show: 'list', only: null }); setView('register'); });
    const back = await until(page, () => document.querySelectorAll('td.ac-cell .ac-ans').length === 4, null, 10000);
    check('5a a refresh keeps the column and its answers, and spends nothing', back && h.ai.calls.length === spent, String(h.ai.calls.length - spent));
    await page.click('[data-ac-remove]');
    /* RE-POINTED 21 Oct 2026 (Part 8): Owner is hidden at rest under Columns
       now, so the list comes back to the drawing's four, not to Owner */
    check('5b Remove column takes it off the list', await until(page, () => !document.querySelector('td.ac-cell') && [...document.querySelectorAll('.reg-table thead th')].some(th => th.textContent.trim() === 'Value')));
    await page.click('[data-ac-open]'); await until(page, () => !!document.querySelector('[data-ac-chip]'));
    await page.click('[data-ac-chip]');
    const kept = await until(page, () => /4 answers are already kept and cost nothing/.test((document.querySelector('#ac-form') || {}).innerText || ''));
    check('5c the team\'s question is a chip; chosen, the kept answers are said free', kept, await page.evaluate(() => (document.querySelector('#ac-form .ac-cost') || {}).innerText));
    const spent2 = h.ai.calls.length;
    await page.click('[data-ac-ask]');
    await until(page, () => document.querySelectorAll('td.ac-cell .ac-ans').length === 4, null, 10000);
    check('5d asked again, it costs nothing', h.ai.calls.length === spent2, String(h.ai.calls.length - spent2));

    /* ============ 6. GO TO CLAUSE ============ */
    await page.click('td.ac-cell[data-ac-cid="MK-A1"] .ac-a');
    await until(page, () => !!document.querySelector('[data-ac-go]'));
    await page.click('[data-ac-go]');
    const onPaper = await until(page, () => window.pdContract && pdContract() && pdContract().id === 'MK-A1' && !!document.querySelector('#ig-canvas span.ig-mark'), null, 10000);
    check('6 Go to clause opens the contract on Home\'s paper with the sentence lit', onPaper);
    await page.screenshot({ path: path.join(OUT, '06-go-to-clause.png') });

    /* ============ 7. JAMBO'S BOX ============ */
    await toList(page);
    await page.evaluate(() => { const a = caActOf('ask a column'); if (a) caGo(a); });
    check('7 "ask a column" in Jambo\'s box opens the same question beside the list', await until(page, () => !!document.querySelector('#ig-dock #ac-form #ac-q')));

    /* ============ 9. THE OWNER'S THREE SCREENS ============ */
    await page.click('[data-ac-cancel]').catch(() => {});
    for (const [wd, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: wd, height: ht });
      await toList(page);
      await until(page, () => document.querySelectorAll('td.ac-cell .ac-ans').length === 4);
      await page.click('td.ac-cell[data-ac-cid="MK-A2"] .ac-a').catch(() => {});
      await until(page, () => !!document.querySelector('#ig-dock .ac-why-card'));
      const fit = await page.evaluate(() => {
        const sc = document.documentElement, t = document.querySelector('.reg-table'), host = t && t.closest('#reg-scroll');
        const card = document.querySelector('#ig-dock .ac-why-card'), r = card && card.getBoundingClientRect();
        return { side: sc.scrollWidth - sc.clientWidth, tbl: host ? host.scrollWidth - host.clientWidth : -1, card: r ? [Math.round(r.left), Math.round(r.right), innerWidth] : null };
      });
      check(`9 ${wd}×${ht}: nothing sideways, the why card in view`, fit.side <= 0 && fit.tbl <= 1 && fit.card && fit.card[1] <= fit.card[2], JSON.stringify(fit));
      await page.screenshot({ path: path.join(OUT, `09-${wd}x${ht}.png`) });
      await page.click('td.ac-cell[data-ac-cid="MK-A2"] .ac-a').catch(() => {});
    }

    /* ============ 8. A VIEWER ============ */
    const vp = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    vp.on('pageerror', e => errors.push(String(e)));
    await signIn(vp, h.base, 'viewer@example.co.ke', 'their-own-pass-9');
    await toList(vp);
    await until(vp, () => { const b = document.querySelector('[data-ac-open]'); return !!b && b.disabled; });
    const vb = await vp.evaluate(() => { const b = document.querySelector('[data-ac-open]'); return b ? { dis: b.disabled, title: b.title } : null; });
    check('8 a viewer sees the door greyed, with why', !!vb && vb.dis && /edit contracts/.test(vb.title), JSON.stringify(vb));
  } finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})().catch(e => { console.error(e); process.exit(1); });
