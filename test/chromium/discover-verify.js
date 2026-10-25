/* global regState, regRepaint, regPlaceSet, setView, state, api, askColSummary, renderIntelDock, closeModal, askColBring, openSettingsAt, closeSettingsDrawer, askColFactsArrive, getContract, regOpenContract, pdContract, pdKtMid */
/* DISCOVER — THE COLUMN THE LEGORA WAY, THE KEPT QUESTIONS, THE COMPANY'S
   FACTS AND WATCHES (docs/PLAN-jambo-discover.md, owner 25 Oct 2026), driven
   in a real browser over test/discover-world.js (eleven contracts, the
   stand-in AI: "out" of a rule only where the wording leaves liability
   unlimited, DV-04 and DV-05).

   STAGE 2 — THE ANSWERS THE LEGORA WAY, THE QUESTION WHERE IT WAS
     2a a question of the wording typed in the list's own box opens Ask a
        column's form, filled; nothing is read until the press
     2b the name box says Jambo names the column if it is left empty; asked
        with no name, the column names itself
     2c each cell: the answer, then the words it was read from
     2d the dot reads the company's rule first: the two outside it are red
     2e the list's foot says what each dot means
     2f the column's card: Show the 2 at risk narrows the list to those two
     2g Draw it draws the counts in the card (9 inside, 2 outside: DV-11 has its template paper from its template), no call spent; pressed again it goes
     2h the why card says the rule: outside, with the rule's words
   STAGE 3 — DISCOVER: THE KEPT QUESTIONS AND THE PACKS
     3a with no column up, Jambo's panel beside the list shows Discover under
        his greeting: the kept question, counted, at risk said
     3b a press brings that question's column onto the list, no call
     3c "Due diligence · 5 questions" opens the pack in the same form: its five
        questions, the cost (one read per contract, against five apart)
     3d asked: one call per contract read, not five; three columns stand on
        the list, the card offers "See all 5 answers"
     3e that opens the whole table as a page: five answer columns, Copy the
        table at the top; Back to the list closes it
   STAGE 4 — THE COMPANY'S FACTS
     4a an admin's column card offers "Keep as a company fact"; pressed, the
        question is a fact (Discover tags it)
     4b Settings › Company facts lists the kept questions with their rules and
        switches, and says the cost per arriving contract
     4c a rule written there is saved (the server holds it)
     4d a contract that arrives is read once for the facts that are on
     4e its Key terms carry the company's facts, with where on the paper
   Each stage's checks are added below as the stage is built.
   Run: node test/chromium/discover-verify.js   (HATI_DV_ONLY=2 for one stage) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedDiscoverWorld } = require('../discover-world');

const OUT = path.join(__dirname, 'shots', 'discover');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const ONLY = process.env.HATI_DV_ONLY || '';
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null && !ok ? ' — ' + detail : ''}`); };
const until = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const CAP_Q = 'Is our liability capped, and at what?';

async function signIn(page, base){
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof window.setView === 'function' && window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, 15000);
}
async function toList(page){
  await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
  return until(page, () => !!document.querySelector('#reg-tbody tr[data-row]'));
}
const stage = n => !ONLY || ONLY === String(n);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedDiscoverWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => errors.push(String(e)));
    await signIn(page, h.base);
    check('0 the Contracts list is up', await toList(page));

    /* the company's rule on the cap question, written by the admin (kept by asking it of the empty contract: free) */
    const k = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP_Q, name: 'Liability cap', ids: ['DV-11'] } });
    await W.admin.json('/api/columns/' + k.ask.id, { method: 'PUT', body: { rule: 'Capped at no more than one year of fees' } });

    if (stage(2)){
      /* 2a the list's own box hands a question of the wording to the form */
      const calls0 = h.ai.calls.length;
      await until(page, () => !!document.querySelector('#ct-q'));
      await page.fill('#ct-q', CAP_Q); await page.press('#ct-q', 'Enter');
      const filled = await until(page, () => { const q = document.querySelector('#ig-dock #ac-form #ac-q'); return !!q && /liability capped/.test(q.value); });
      check('2a a question of the wording in the list box opens the form, filled, nothing read', filled && h.ai.calls.length === calls0);
      /* 2b the name hint */
      const hint = await page.evaluate(() => (document.querySelector('#ac-name-say') || {}).textContent || '');
      check('2b the name box says Jambo names it if left empty', /Jambo names it/.test(hint), hint);
      await page.fill('#ct-q', '');
      await page.click('[data-ac-ask]');
      const read = await until(page, () => document.querySelectorAll('td.ac-cell .ac-ans').length >= 10, null, 20000);
      const col = await page.evaluate(() => ({
        heads: [...document.querySelectorAll('.reg-table thead th')].map(th => th.textContent.trim()),
        cells: Object.fromEntries([...document.querySelectorAll('td.ac-cell')].map(td => [td.getAttribute('data-ac-cid'), { t: td.innerText.replace(/\s+/g, ' ').trim(), red: !!td.querySelector('.ac-ans.tone-ruby'), green: !!td.querySelector('.ac-ans.tone-green') }])),
        foot: (document.querySelector('#reg-showing') || {}).innerText || '' }));
      check('2b′ the column is named from the question', read && col.heads.some(x => /Liability cap/.test(x)), JSON.stringify(col.heads));
      const withWords = ['DV-01', 'DV-03', 'DV-07'].every(id => col.cells[id] && /“[^”]{10,}/.test(col.cells[id].t));
      check('2c each cell: the answer, then the words it was read from', withWords, JSON.stringify(col.cells['DV-01']));
      check('2d the dot reads the rule first: the two outside it are red, the rest green',
        col.cells['DV-04'].red && col.cells['DV-05'].red && col.cells['DV-01'].green && Object.values(col.cells).filter(c => c.red).length === 2,
        JSON.stringify(Object.fromEntries(Object.entries(col.cells).map(([i, c]) => [i, c.red ? 'red' : c.green ? 'green' : '-']))));
      check('2e the foot says what each dot means', /usual, or inside our rule/.test(col.foot) && /a risk, or outside our rule/.test(col.foot) && /not found/.test(col.foot), col.foot);
      await page.screenshot({ path: path.join(OUT, '2-column.png') });
      /* 2f show the ones at risk */
      const card = await page.evaluate(() => (document.querySelector('#ig-dock [data-ac-col]') || {}).innerText || '');
      check('2f′ the card offers Show the 2 at risk · Draw it · Copy the table', /Show the 2 at risk/.test(card) && /Draw it/.test(card) && /Copy the table/.test(card), card.slice(0, 300));
      const callsDraw = h.ai.calls.length;
      await page.click('[data-ac-draw]');
      const bars = await until(page, () => document.querySelectorAll('#ig-dock .ac-draw .ac-bar').length === 4);
      const drawn = await page.evaluate(() => [...document.querySelectorAll('#ig-dock .ac-draw .ac-bar')].map(b => b.innerText.replace(/\s+/g, ' ').trim()));
      check('2g Draw it draws the counts in the card (9 inside, 2 outside: DV-11 has its template paper from its template), no call spent', bars && drawn.some(t => /outside our rule 2$/.test(t)) && drawn.some(t => /inside our rule 9$/.test(t)) && h.ai.calls.length === callsDraw, JSON.stringify(drawn));
      await page.screenshot({ path: path.join(OUT, '2-drawn.png') });
      await page.click('[data-ac-draw]');
      check('2g′ pressed again, the drawing goes', await until(page, () => !document.querySelector('#ig-dock .ac-draw')));
      await page.click('[data-ac-risk]');
      const two = await until(page, () => document.querySelectorAll('#reg-tbody tr[data-row]').length === 2);
      const rows = await page.evaluate(() => [...document.querySelectorAll('#reg-tbody tr[data-row]')].map(tr => tr.getAttribute('data-row')).sort());
      check('2f Show the 2 at risk narrows the list to those two', two && rows.join() === 'DV-04,DV-05', JSON.stringify(rows));
      /* 2h the why card says the rule */
      await page.click('td.ac-cell[data-ac-cid="DV-04"] .ac-a');
      await until(page, () => !!document.querySelector('#ig-dock .ac-why-card'));
      const why = await page.evaluate(() => (document.querySelector('#ig-dock .ac-why-card') || {}).innerText || '');
      check('2h the why card says the rule: outside, in the rule\'s own words', /Our rule/.test(why) && /Outside our rule: Capped at no more than one year of fees/.test(why), why.replace(/\s+/g, ' ').slice(0, 300));
      await page.screenshot({ path: path.join(OUT, '2-why.png') });
      await page.click('td.ac-cell[data-ac-cid="DV-04"] .ac-a');
      await page.evaluate(() => { regState().only = null; regRepaint(); });
    }

    if (stage(3)){
      /* no column up: the panel greets, Discover under it */
      await page.evaluate(() => { regState().ask = []; regState().only = null; regRepaint(); });
      if (ONLY === '3'){ /* the question kept, as stage 2 would have left it */
        await page.evaluate(q => api('ai/column', 'POST', { question: q, name: '', ids: state.contracts.map(c => c.id) }), CAP_Q);
      }
      await page.evaluate(() => askColSummary(true).then(() => renderIntelDock()));
      const disc = await until(page, () => /Liability cap/.test((document.querySelector('#ig-dock #ac-disc') || {}).innerText || ''));
      const dt = await page.evaluate(() => (document.querySelector('#ig-dock #ac-disc') || {}).innerText || '');
      check('3a Discover stands in the panel beside the list: the kept question, counted, at risk said', disc && /Discover/.test(dt) && /2 at risk/.test(dt) && /Due diligence · 5 questions/.test(dt) && /Ask a new question/.test(dt), dt.replace(/\s+/g, ' ').slice(0, 300));
      await page.screenshot({ path: path.join(OUT, '3-discover.png') });
      const c0 = h.ai.calls.length;
      await page.click('#ig-dock [data-ac-bring]');
      const up = await until(page, () => [...document.querySelectorAll('.reg-table thead th')].some(th => /Liability cap/.test(th.textContent)) && document.querySelectorAll('td.ac-cell .ac-ans').length >= 10);
      check('3b a press brings its column onto the list, no call', up && h.ai.calls.length === c0, String(h.ai.calls.length - c0));
      await page.click('#ig-dock [data-ac-pack]');
      await until(page, () => !!document.querySelector('#ig-dock [data-ac-pack-form]'));
      const pf = await page.evaluate(() => (document.querySelector('#ig-dock [data-ac-pack-form]') || {}).innerText || '');
      check('3c the pack opens in the same form: five questions, one read each against five apart', ['Notice to end', 'Liability cap', 'Governing law', 'Auto-renewal', 'Personal data'].every(n => pf.includes(n)) && /about 11 Jambo calls/.test(pf) && /55 Jambo calls/.test(pf), pf.replace(/\s+/g, ' ').slice(0, 400));
      await page.screenshot({ path: path.join(OUT, '3-pack-form.png') });
      const c1 = h.ai.calls.length;
      await page.click('#ig-dock [data-ac-ask]');
      const three = await until(page, () => document.querySelectorAll('.reg-table thead th.ac-th').length === 3 && !!document.querySelector('#ig-dock [data-ac-table]'), null, 20000);
      const spent = h.ai.calls.length - c1;
      const heads = await page.evaluate(() => [...document.querySelectorAll('.reg-table thead th.ac-th')].map(th => th.textContent.trim()));
      check('3d asked: one call per contract read (11), three columns stand, "See all 5 answers" offered', three && spent <= 11 && heads.length === 3, JSON.stringify({ spent, heads }));
      await page.click('#ig-dock [data-ac-table]');
      const pg = await until(page, () => !!document.querySelector('#ac-table-page'));
      const tt = await page.evaluate(() => ({ cols: document.querySelectorAll('#ac-table-page thead th').length, rows: document.querySelectorAll('#ac-table-page tbody tr').length,
        copy: !!document.querySelector('#ac-tt-copy'), wide: document.documentElement.scrollWidth > window.innerWidth }));
      check('3e the whole table is a page: five answer columns, every contract, Copy the table, nothing spilling the window', pg && tt.cols === 6 && tt.rows === 11 && tt.copy && !tt.wide, JSON.stringify(tt));
      await page.screenshot({ path: path.join(OUT, '3-table.png') });
      await page.click('#ac-table-page [data-dlg-cancel]');
      check('3e′ Back to the list closes it', await until(page, () => !document.querySelector('#ac-table-page')));
    }

    if (stage(4)){
      const LAW = "Which country's law governs this contract?";
      /* a column of the law question, up on the list (kept by asking it of the empty contract: free) */
      /* asked of every contract but DV-07, which is left to arrive in 4d */
      const lk = await page.evaluate(q => api('ai/column', 'POST', { question: q, name: 'Governing law', ids: state.contracts.map(c => c.id).filter(id => id !== 'DV-07') }), LAW);
      await page.evaluate(id => { regState().ask = [id]; regState().only = null; regRepaint(); }, lk.ask.id);
      await page.evaluate(id => askColBring(id), lk.ask.id);
      await until(page, () => !!document.querySelector('#ig-dock [data-ac-fact]'));
      const chip = await page.evaluate(() => (document.querySelector('#ig-dock [data-ac-fact]') || {}).textContent || '');
      check('4a′ an admin\'s column card offers "Keep as a company fact"', /Keep as a company fact/.test(chip), chip);
      await page.click('#ig-dock [data-ac-fact]');
      const kept = await until(page, () => !document.querySelector('#ig-dock [data-ac-fact]'));
      const isFact = (await W.admin.json('/api/columns/summary')).asks.find(a => a.id === lk.ask.id).fact;
      check('4a pressed, the question is a company fact', kept && isFact === true);
      /* 4b the Settings panel */
      await page.evaluate(() => openSettingsAt('platform', 'facts'));
      const panel = await until(page, () => /Governing law/.test((document.querySelector('#fa-panel') || {}).innerText || ''));
      const pt = await page.evaluate(() => (document.querySelector('#fa-panel') || {}).innerText || '');
      const sw = await page.evaluate(id => { const b = document.querySelector(`[data-fa-tog="${id}"]`); return b ? b.getAttribute('aria-pressed') : null; }, lk.ask.id);
      check('4b Settings › Company facts lists the kept questions, rules and switches, and the cost per arrival', panel && /Our rule/.test(pt) && sw === 'true' && /every contract that arrives costs about 1 Jambo call/.test(pt), pt.replace(/\s+/g, ' ').slice(0, 300));
      await page.screenshot({ path: path.join(OUT, '4-settings.png') });
      /* 4c a rule */
      await page.fill(`[data-fa-rule="${lk.ask.id}"]`, 'Kenya');
      await page.press(`[data-fa-rule="${lk.ask.id}"]`, 'Tab');
      let rule = '';
      for (let i = 0; i < 30 && rule !== 'Kenya'; i++){ rule = (await W.admin.json('/api/columns/summary')).asks.find(a => a.id === lk.ask.id).rule; if (rule !== 'Kenya') await page.waitForTimeout(100); }
      check('4c a rule written there is saved on the server', rule === 'Kenya', rule);
      await page.evaluate(() => { if (typeof closeSettingsDrawer === 'function') closeSettingsDrawer(); });
      /* 4d arrival: DV-07 arrives (its fact not read yet) */
      const c0 = h.ai.calls.length;
      await page.evaluate(() => askColFactsArrive(getContract('DV-07')));
      const read = await (async () => { for (let i = 0; i < 40; i++){ const f = await W.admin.json('/api/columns/facts/DV-07'); const x = f.facts.find(y => y.ask.id === lk.ask.id); if (x && x.answer) return x; await new Promise(r => setTimeout(r, 100)); } return null; })();
      check('4d a contract that arrives is read once for the facts that are on, judged against the rule', !!read && h.ai.calls.length - c0 === 1 && read.answer.verdict === 'in', JSON.stringify({ calls: h.ai.calls.length - c0, v: read && read.answer.verdict }));
      /* 4e Key terms */
      await page.evaluate(() => regOpenContract('DV-07'));
      await until(page, () => typeof pdContract === 'function' && pdContract() && pdContract().id === 'DV-07', null, 10000);
      await page.waitForTimeout(400);
      await page.evaluate(() => pdKtMid('DV-07'));
      const kt = await until(page, () => /Company facts/.test((document.querySelector('[data-ac-facts-for="DV-07"]') || {}).innerText || ''));
      const kx = await page.evaluate(() => (document.querySelector('[data-ac-facts-for="DV-07"]') || {}).innerText || '');
      check('4e its Key terms carry the company\'s facts, with where on the paper', kt && /Governing law/.test(kx) && /§ 9/.test(kx), kx.replace(/\s+/g, ' ').slice(0, 200));
      await page.screenshot({ path: path.join(OUT, '4-key-terms.png') });
    }
  } catch (e){ check('the run itself', false, String(e && e.stack || e)); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
