/* Chromium verification: CHARTS THAT EXPLAIN (Young, 5 Oct 2026, "HaTi Board:
   Charts That Explain": "build what it is suggesting in totality")
   ============================================================
   On Home's board, with a staged book (risks read on some contracts, the
   standards check on some, renewals ahead):
     1. each of the owner's four questions opens its ANSWER PACK where answers
        open, free: cards, a ranked list with a reason per row, how HaTi
        worked it out, next questions, and the summary press;
     2. a number in a pack is a door onto exactly the contracts it counts;
     3. a pack's summary is written from its fact sheet and a number that is
        not on the sheet never reaches the screen;
     4. "Summarise my board" sits on the board's top line and answers there;
     5. DIG DEEPER (analyst mode): an open question Copilot answers in steps,
        each step HaTi's calculation, the steps shown as "How HaTi worked
        this out", the cards drawn through the one applier;
     6. photographed, Dark and Light; no page errors.
   Copilot is a stub (no key in CI); everything else is the app.
   Screenshots: test/chromium/shots/charts-that-explain/ (or HATI_SHOT_DIR).
   Run: node test/chromium/charts-that-explain-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'charts-that-explain');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayOff = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const BOOK = [];
const add = (id, cp, value, o) => { const c = fixtureContract(id, 'Supply ' + id, cp, 'proc', value, 'Signed'); c.signedAt = dayOff(-400); Object.assign(c, o || {}); BOOK.push(c); };
const HIGH = { at: '1 Oct 2026', findings: [{ id: 't-liab', sev: 'high', kind: 'risk', title: 'No liability cap', anchor: 'doc', what: 'No cap.', why: 'Unlimited loss.', fix: 'Add a cap.' }], dismissed: [] };
const LOW = { at: '1 Oct 2026', findings: [{ id: 't-dp', sev: 'low', kind: 'missing', title: 'No data-protection terms', anchor: 'doc', what: 'None.', why: 'Data.', fix: 'Add.' }], dismissed: [] };
const OFF = { verdicts: [{ category: 'Payment terms', status: 'deviation', quote: '', position: '30 days' }] };
const MET = { verdicts: [{ category: 'Payment terms', status: 'aligned', quote: '', position: '30 days' }] };
add('MK-N1', 'Nordkemi AB', 9e6, { scan: HIGH, playbook: OFF, expiry: dayOff(120), metadata: { renewalType: 'auto-renew', noticePeriodDays: 60 } });
add('MK-N2', 'Baltic Freight', 6e6, { scan: HIGH, playbook: OFF, expiry: dayOff(150), metadata: { renewalType: 'auto-renew', noticePeriodDays: 30 } });
add('MK-N3', 'Vasa Energi', 4e6, { scan: LOW, playbook: MET, expiry: dayOff(150) });
add('MK-N4', 'Juno AB', 2e6, { scan: LOW, playbook: MET, expiry: dayOff(300) });
for (let k = 0; k < 4; k++) add('MK-U' + k, 'Unread Oy', 1e6, { expiry: dayOff(200 + k * 30) });
const ALL = FIXTURES.concat(BOOK);
const Q = { risks: 'Show me our top risk contracts', ending: 'Which month and year will the most value come to an end?',
  standards: 'Which contracts violate our company standards?', next12: 'What should concern me most over the next 12 months?' };

let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: ALL, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    if (!(await page.evaluate(() => typeof hbPackOfQ === 'function'))) throw new Error('this build has no answer packs');
    await page.evaluate(() => {
      window._asked = [];
      window.copilotAvailable = () => true;
      window.copilotAsk = async (msgs) => { window._asked.push(msgs[0].content);
        return { answer: 'Nordkemi AB and Baltic Freight lead the risk. Prices rose 37% last year. Fix those two first.' }; };
      const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.why = {}; s.digBig = false; s.path = []; s.screen = 'dark';
      hbSave(); setView('dashboard'); });
    await until(() => !!document.querySelector('#hb-board, .hb-note'));

    /* 1 — the four packs */
    for (const [k, q] of Object.entries(Q)){
      await page.evaluate(q => hbAsk(q), q);
      const P = await until(k => { const p = document.querySelector('#hb-focus .hb-pack[data-hb-pack="' + k + '"]'); if (!p) return null;
        return { cards: p.querySelectorAll('.hb-pack-card').length, rows: p.querySelectorAll('.hb-pk-t tbody tr').length,
          how: !!p.querySelector('.hb-how'), next: p.querySelectorAll('[data-hb-next]').length, ask: !!p.querySelector('[data-hb-why="pk:' + k + '"]'),
          read: ((p.querySelector('.hb-read') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160) }; }, k);
      check(`1 ${k}: the pack opens with cards, a ranked list, how it was worked out, next questions and the summary press`,
        !!P && P.cards >= 1 && P.rows >= 1 && P.how && P.next === 3 && P.ask, JSON.stringify(P));
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(OUT, `1-pack-${k}.png`), fullPage: false });
    }

    /* 2 — a door */
    await page.evaluate(q => hbAsk(q), Q.standards);
    await until(() => !!document.querySelector('#hb-focus .hb-pack[data-hb-pack="standards"]'));
    const dr = await page.evaluate(() => { const b = [...document.querySelectorAll('#hb-focus .hb-pack .hb-read .hb-read-n')][0]; if (!b) return null; const k = b.getAttribute('data-hb-dig'), n = b.textContent.trim(); b.click(); return { k, n }; });
    const at = dr && await until(k => { const p = hbS().path || []; return p[p.length - 1] === k ? { n: hbDigData(k, 'all').n } : null; }, dr.k);
    check('2 a number in a pack opens exactly the contracts it counts', !!at && String(at.n) === dr.n, JSON.stringify({ dr, at }));

    /* 3 — the pack's summary */
    await page.evaluate(q => hbAsk(q), Q.risks);
    await until(() => !!document.querySelector('#hb-focus [data-hb-why="pk:risks"]'));
    await page.evaluate(() => document.querySelector('#hb-focus [data-hb-why="pk:risks"]').click());
    const sum = await until(() => { const b = document.querySelector('#hb-focus .hb-pack .hb-why .hb-why-b'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : null; });
    const sent = await page.evaluate(() => window._asked.slice(-1)[0] || '');
    check('3a the summary is written from the pack\'s fact sheet', /^FACT SHEET — /.test(sent) && /- Coverage: /.test(sent), sent.slice(0, 80));
    check('3b a number not on the sheet never reaches the screen', !!sum && /Nordkemi AB/.test(sum) && !/37%/.test(sum), sum);
    await page.screenshot({ path: path.join(OUT, '2-pack-summary.png') });

    /* 4 — summarise my board */
    await page.evaluate(() => { const s = hbS(); s.path = []; hbSave(); hbPaintBoard(); });
    const bs = await until(() => { const b = document.querySelector('.hb-note [data-hb-why="board:all"]'); return b ? b.textContent.trim() : null; });
    check('4a "Summarise my board" sits on the board\'s top line', bs === 'Summarise my board', bs);
    if (bs){ await page.evaluate(() => document.querySelector('.hb-note [data-hb-why="board:all"]').click());
      const box = await until(() => { const n = document.querySelector('.hb-note'); const w = n && n.nextElementSibling; return w && w.classList.contains('hb-why') && w.querySelector('.hb-why-b') ? w.textContent.replace(/\s+/g, ' ').trim() : null; });
      check('4b its answer is under the top line, checked', !!box && !/37%/.test(box), box && box.slice(0, 140)); }
    await page.screenshot({ path: path.join(OUT, '3-board-summary.png') });

    /* 5 — dig deeper: the analyst, played back (no key in CI); the board's
       own arithmetic runs every step */
    await page.evaluate(() => {
      const real = window.api; window._dd = [];
      const steps = [
        { name: 'calculate', input: { why: 'Who holds the value', which: { all: true }, recipe: { pic: 'bars', split: { by: 'counterparty' }, measure: 'value', top: 5 } } },
        { name: 'pack', input: { why: 'Which of them carry risk', name: 'risks' } },
        { name: 'finish', input: { summary: 'Nordkemi AB and Baltic Freight hold the risk. Prices rose 37% last year.', cards: [{ which: { all: true }, recipe: { pic: 'ring', split: { by: 'risks' } }, title: 'Risk' }], next: ['Which end first?'] } }];
      window.api = async (p, m, body) => {
        if (p === 'ai/graph') return { actions: [{ do: 'add_card', which: { all: true }, recipe: { pic: 'bars', split: { by: 'counterparty' }, measure: 'value' } }], answer: 'Value sits with two suppliers.', note: 'x' };
        if (p === 'board/analyst'){ window._dd.push(body); return { step: steps[Math.min(window._dd.length - 1, 2)] }; }
        return real(p, m, body); };
      state.aiConfigured = true;
      const s = hbS(); s.path = []; hbSave(); hbPaintBoard(); });
    await page.evaluate(() => intelAsk('Why is so much value concentrated with so few suppliers?'));
    const go = await until(() => { const b = document.querySelector('[data-hb-deeper]'); return b ? { t: b.textContent.trim(), cost: (b.parentElement.querySelector('.hb-dd-cost') || {}).textContent || '' } : null; });
    check('5a "Dig deeper" sits under Copilot\'s board answer, its cost beside it', !!go && go.t === 'Dig deeper' && /up to 5 steps/.test(go.cost), JSON.stringify(go));
    if (go){
      await page.evaluate(() => document.querySelector('[data-hb-deeper]').click());
      const dd = await until(() => { const c = document.querySelector('#hb-focus .hb-dd'); if (!c || !c.querySelector('.hb-why-b')) return null;
        return { steps: c.querySelectorAll('.hb-dd-step').length, doors: c.querySelectorAll('.hb-dd-step [data-hb-open], .hb-dd-step [data-hb-dig]').length,
          ans: c.querySelector('.hb-why-b').textContent.replace(/\s+/g, ' ').trim(), add: !!c.querySelector('[data-hb-dd-add]'), sent: window._dd.length,
          sheet: (window._dd[1] && window._dd[1].steps[0] && window._dd[1].steps[0].result || '').slice(0, 40) }; });
      check('5b each step is HaTi\'s count, its fact sheet sent back, shown with a door', !!dd && dd.steps === 2 && dd.doors === 2 && dd.sent === 3 && /^FACT SHEET — /.test(dd.sheet), JSON.stringify(dd));
      check('5c the answer is checked: a number on no sheet never shows', !!dd && /Nordkemi AB/.test(dd.ans) && !/37%/.test(dd.ans), dd && dd.ans);
      const n0 = await page.evaluate(() => hbS().panels.length);
      if (dd && dd.add){ await page.evaluate(() => document.querySelector('[data-hb-dd-add]').click());
        const n1 = await until(n0 => hbS().panels.length > n0 ? hbS().panels.length : null, n0);
        check('5d the offered card is added on the press, through the one applier', n1 === n0 + 1, `${n0} → ${n1}`); }
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(OUT, '4-dig-deeper.png') });
      await page.evaluate(() => { const d = document.querySelector('#hb-focus .hb-dd-how'); if (d) d.open = true; });
      await page.evaluate(() => { hbS().screen = 'light'; hbSave(); hbApplyScreen(); hbPaintBoard(); });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, '5-dig-deeper-light.png') });
    }

    check('9 no page errors', errors.length === 0, errors.join(' | ') || 'none');
  } catch (e){
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
