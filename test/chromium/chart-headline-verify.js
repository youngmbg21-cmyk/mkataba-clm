/* Chromium verification: HEADLINE — THE CHART'S POINT ON THE SMALL CARD
   (Young picked "Headline", 5 Oct 2026, "Chart Reading Options")
   ============================================================
   On Home's board, the owner's own card — the whole book, by month signed —
   at its NORMAL size:
     1. under the totals, one line says the chart's point (HaTi's own reading,
        never the totals said again), with Read more beside it; nothing is
        spent and the full reading is not drawn;
     2. a number in the line opens exactly the contracts it counts;
     3. Read more opens the whole reading INSIDE the same card (the card is not
        enlarged), the label turns to Show less, and "What could explain this?"
        is in it with its cost — Copilot is not asked until it is pressed;
     4. Show less folds it again;
     5. Value under contract, at normal size, says its point in one line too;
     6. enlarged, the card is as it was: the full reading, no headline;
     7. photographed, Dark and Light; no page errors.
   Waits ask for the state, bounded. Copilot is a stub that records any call.
   Screenshots: test/chromium/shots/chart-headline/ (or HATI_SHOT_DIR).
   Run: node test/chromium/chart-headline-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'chart-headline');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const SIGNED = [];
const add = (id, signed) => { const c = fixtureContract(id, 'Supply ' + id, 'Juno AB', 'proc', 1e6, 'Signed'); c.signedAt = signed; SIGNED.push(c); };
for (let k = 0; k < 4; k++) add('MK-E' + k, dayIn(-30 - k, 10));
for (let k = 0; k < 11; k++) add('MK-J' + k, dayIn(-3, 3 + k));
for (let k = 0; k < 14; k++) add('MK-A' + k, dayIn(-2, 3 + k));
const BOOK = FIXTURES.concat(SIGNED);
const KEY = 'q:contracts by month signed';

let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const card = () => page.evaluate(() => {
    const d = document.querySelector('#hb-focus .hb-dig'); if (!d) return null;
    const hl = d.querySelector('.hb-head-line'), more = d.querySelector('[data-hb-read-more]');
    const lead = d.querySelector('.hb-chart-lead');
    return { big: d.classList.contains('is-big'), line: hl ? (hl.querySelector('p') || {}).textContent.replace(/\s+/g, ' ').trim() : null,
      more: more ? more.textContent.trim() : null, expanded: more ? more.getAttribute('aria-expanded') : null,
      read: !!d.querySelector('.hb-read'), why: !!d.querySelector('[data-hb-why]'),
      cost: ((d.querySelector('.hb-why-ask .hb-quiet') || {}).textContent || '').trim(),
      afterLead: !!(hl && lead && (lead.compareDocumentPosition(hl) & Node.DOCUMENT_POSITION_FOLLOWING)),
      chart: !!d.querySelector('svg'), doors: hl ? [...hl.querySelectorAll('.hb-read-n')].map(b => ({ k: b.getAttribute('data-hb-dig'), n: b.textContent.trim() })) : [] };
  });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), SIGNED.map(c => c.id), { timeout: 20000 });
    if (!(await page.evaluate(() => typeof hbHeadlineOf === 'function'))) throw new Error('this build has no headline');
    await page.evaluate(k => {
      window._asked = [];
      window.copilotAvailable = () => true;
      window.copilotAsk = async (msgs) => { window._asked.push(msgs[0].content); return { answer: 'A late burst.' }; };
      const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.why = {}; s.digBig = false; s.path = [k]; s.screen = 'dark';
      s.recipe = s.recipe || {}; s.recipe[k] = { which: 'all', pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: 'count', trend: true };
      hbSave(); setView('dashboard'); }, KEY);
    const up = await until(() => !!document.querySelector('#hb-focus .hb-dig'));
    if (!up) throw new Error('no card');

    /* 1 — at rest */
    const c1 = await card();
    check('1a at normal size the card says its point in one line', !!c1 && !c1.big && !!c1.line, c1 && c1.line);
    check('1b under the totals, never the totals said again', !!c1 && c1.afterLead && !/are counted here|is counted here|under contract, (in|across)/.test(c1.line || ''), c1 && c1.line);
    check('1c it is the chart\'s own point: the busiest stretch', !!c1 && /busiest|Most of them/i.test(c1.line || ''), c1 && c1.line);
    check('1d Read more beside it; the full reading is not drawn and nothing is asked',
      !!c1 && c1.more === 'Read more' && c1.expanded === 'false' && !c1.read && c1.chart, JSON.stringify({ more: c1 && c1.more, read: c1 && c1.read }));
    await page.screenshot({ path: path.join(OUT, '1-headline-dark.png') });
    await page.evaluate(() => { const s = hbS(); s.screen = 'light'; hbSave(); hbPaintBoard(); });
    await page.screenshot({ path: path.join(OUT, '2-headline-light.png') });
    await page.evaluate(() => { const s = hbS(); s.screen = 'dark'; hbSave(); hbPaintBoard(); });

    /* 2 — a number is a door */
    const door = (c1 && c1.doors || [])[0];
    if (door){
      const opened = await page.evaluate(k => { const b = document.querySelector(`#hb-focus .hb-head-line [data-hb-dig="${k}"]`); b.click(); return true; }, door.k);
      const at = opened && await until(k => { const p = hbS().path || []; return p[p.length - 1] === k ? { n: hbDigData(k, 'all').n } : null; }, door.k);
      check('2 a number in the line opens exactly the contracts it counts', !!at && String(at.n) === door.n.replace(/\D/g, ''), JSON.stringify({ door, at }));
      await page.evaluate(k => { const s = hbS(); s.path = [k]; hbSave(); hbPaintBoard(); }, KEY);
      await until(() => !!document.querySelector('#hb-focus .hb-head-line'));
    } else check('2 a number in the line opens exactly the contracts it counts', false, 'no door in the line');

    /* 3 — Read more */
    await page.click('#hb-focus [data-hb-read-more]');
    const c3 = await until(() => { const d = document.querySelector('#hb-focus .hb-dig'); return d && d.querySelector('.hb-read') ? true : null; }) && await card();
    check('3a Read more opens the whole reading inside the same card, which stays its size', !!c3 && c3.read && !c3.big, JSON.stringify(c3 && { read: c3.read, big: c3.big }));
    check('3b the label turns to Show less', !!c3 && c3.more === 'Show less' && c3.expanded === 'true', c3 && c3.more);
    check('3c "What could explain this?" is in it with its cost, and nothing has been asked',
      !!c3 && c3.why && /contracts|kontrakt/i.test(c3.cost) && (await page.evaluate(() => window._asked.length)) === 0, c3 && c3.cost);
    await page.screenshot({ path: path.join(OUT, '3-read-more.png') });

    /* 4 — Show less */
    await page.click('#hb-focus [data-hb-read-more]');
    const c4 = await until(() => { const d = document.querySelector('#hb-focus .hb-dig'); return d && !d.querySelector('.hb-read') ? true : null; }) && await card();
    check('4 Show less folds it again', !!c4 && !c4.read && c4.more === 'Read more', c4 && c4.more);

    /* 6 — enlarged: as it was */
    await page.click('#hb-focus [data-hb-digbig]');
    const c6 = await until(() => document.querySelector('#hb-focus .hb-dig.is-big .hb-read') ? true : null) && await card();
    check('6 enlarged, the card is as it was: the full reading, no headline', !!c6 && c6.big && c6.read && !c6.line, JSON.stringify(c6 && { big: c6.big, read: c6.read, line: c6.line }));
    await page.click('#hb-focus [data-hb-digbig]');

    /* 5 — Value under contract */
    await page.evaluate(() => { const s = hbS(); s.path = []; s.digBig = false; hbSave(); hbPaintBoard(); });
    const fv = await until(() => document.querySelector('#hb-board [data-hb-dig="f:value"]') ? true : null);
    if (fv) await page.click('#hb-board [data-hb-dig="f:value"]');
    const v5 = fv && await until(() => { const d = document.querySelector('#hb-focus .hb-dig'); const l = d && d.querySelector('.hb-head-line p'); return l ? l.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('5 Value under contract says its point in one line too', !!v5, v5);

    check('7 no page errors', errors.length === 0, errors.join(' | ') || 'none');
  } catch (e){
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
