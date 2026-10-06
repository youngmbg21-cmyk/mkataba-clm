/* Chromium verification: EVERY STORY CHAPTER DRAWS, READS AND OPENS (Young,
   6 Oct 2026, over a story whose deeper chapters were blank or too small to
   read: "some of the story charts do not appear and some charts are so small
   … there is not option to expand"; then "Go with your recommendations")
   ============================================================
   Dig deeper on the friction story, Copilot a stub that takes four steps:
   a grid of streams by stage, an answer pack, a set HaTi cannot match, and
   a ranking by counterparty whose chapter names columns by month.
     1. no deeper chapter is blank: the grid and the pack draw, the pack
        chapter offers the whole answer, the unmatched one says why;
     2. the grid chapter takes the story's whole row, and none of its
        writing is drawn under 12px — at 1440 and at 1024 wide;
     3. the chapter that named a picture draws it (columns by month), not
        the step's own ranking;
     4. every drawn chapter has the board's expand button: one press opens
        it enlarged with HaTi's reading, and the trail leads back to the
        story — a HaTi chapter and a deeper one (a ranked list of bars is
        drawn at its full size already, each row a door, and has none);
     5. no page errors.
   Run: node test/chromium/story-chapters-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'story-chapters');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthsAgo = (m, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - m); d.setDate(day); return d; };
/* twelve signings over the last year, each raised some days before, each with
   a negotiation of 1–4 rounds and redlines on named clauses */
const BOOK = [];
const CLAUSES = ['Limitation of liability', 'Payment terms', 'Indemnity'];
for (let k = 0; k < 12; k++){
  const c = fixtureContract('MK-' + (900 + k), 'Agreement ' + k, ['Kevian Kenya Ltd', 'Naivas', 'Juno AB'][k % 3], k % 2 ? 'proc' : 'sales', 1e6 * (k + 1), 'Signed');
  const signed = monthsAgo(11 - k, 12), raised = new Date(signed); raised.setDate(raised.getDate() - (12 + 3 * k));
  c.signedAt = signed.toISOString();
  c.audit = [{ at: raised.toISOString(), user: 'System', action: 'Created', detail: 'fixture' }];
  const rounds = 1 + (k % 4);
  c.negotiation = { round: rounds, rounds: Array.from({ length: rounds }, () => ({})), startedAt: raised.toISOString() };
  c.changes = CLAUSES.slice(0, 1 + (k % 3)).map((cl, i) => ({ id: 'ch' + k + i, clauseLabel: cl, authorSide: i % 2 ? 'owner' : 'counterparty', status: 'accepted', createdAt: raised.toISOString(), resolvedAt: signed.toISOString() }));
  c.expiry = iso(monthsAgo(-14 + k % 6, 10));
  BOOK.push(c);
}
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const STEPS = [
  { name: 'calculate', input: { why: 'Where does the friction sit?', which: { all: true }, recipe: { pic: 'heat', split: { by: 'folder' }, split2: { by: 'status' }, measure: 'count' } } },
  { name: 'pack', input: { why: 'When does the most value end?', name: 'ending' } },
  { name: 'calculate', input: { why: 'Are the zebra leases behind it?', which: { q: 'zqx zebra leases from mars' }, recipe: { pic: 'bars', split: { by: 'counterparty' } } } },
  { name: 'calculate', input: { why: 'Who drove it?', which: { all: true }, recipe: { pic: 'bars', split: { by: 'counterparty' }, measure: 'rounds' } } },
];
const FINISH = { name: 'finish', input: { summary: 'Kevian Kenya Ltd took the most rounds.', cards: [], next: [],
  chapters: [{ step: 1, title: 'Where it sits', text: 'One stream holds most of it.' }, { step: 2, title: 'The riskiest contracts', text: 'A few contracts carry most of the risk.' },
    { step: 3, title: 'Not the leases', text: 'The leases could not be found.' },
    { step: 4, title: 'It rose late in the year', text: 'Rounds rose toward the end.', recipe: { pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: 'rounds' } }],
  watch: [], aside: [] } };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/ai/chat/stream', r => r.abort());
  await page.route('**/api/ai/chat', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ answer: 'LEAD: Negotiations took more rounds.\nC1: Rounds rose.\nC2: Signing slowed.\nC3: Liability was redlined most.\nC4: Kevian Kenya Ltd took the most rounds.' }) }));
  await page.route('**/api/board/analyst', async r => {
    const body = JSON.parse(r.request().postData() || '{}'); const n = (body.steps || []).length;
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ step: n < STEPS.length ? STEPS[n] : FINISH, steps: n, max: 15 }) });
  });
  const until = async (fn, arg, ms = 12000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms){ try { v = await page.evaluate(fn, arg); } catch (_){ v = null; } if (v) return v; await page.waitForTimeout(120); } return v; };
  /* every deeper chapter: what it draws; the grid's smallest writing as drawn */
  const chapters = () => page.evaluate(() => [...document.querySelectorAll('#hb-board .hb-sy-deep .hb-sy-ch.is-deep')].map(ch => {
    const sv = ch.querySelector('svg.hb-svg'); let minPx = null;
    if (sv){ const vb = sv.viewBox.baseVal, k = sv.getBoundingClientRect().width / (vb && vb.width || 1);
      minPx = Math.min(...[...sv.querySelectorAll('text[font-size]')].map(t => Number(t.getAttribute('font-size')) * k)); }
    const row = ch.parentElement.getBoundingClientRect().width, me = ch.getBoundingClientRect().width;
    return { t: (ch.querySelector('h4') || {}).textContent, svg: sv ? sv.getAttribute('class') : null, none: !!ch.querySelector('.hb-sy-none'), lines: !!ch.querySelector('.hb-sy-lines'),
      pack: !!ch.querySelector('.hb-sy-packdoor'), wide: ch.classList.contains('is-wide'), full: me >= row - 2, minPx, big: !!ch.querySelector('[data-hb-sy-big]') };
  }));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.digBig = false; s.recipe = {}; s.screen = 'dark'; delete s.sy; s.an = {}; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    await page.evaluate(() => { state.aiConfigured = true; intel.history = []; });
    await page.evaluate(async () => { await intelAsk('build me a story of our negotiation friction over the last year'); });
    await until(() => document.querySelector('#hb-board .hb-sy [data-hb-sy-deeper]') && !document.querySelector('#hb-board [data-hb-sy-deeper]').disabled ? true : null);
    await page.click('#hb-board [data-hb-sy-deeper]');
    await until(() => document.querySelectorAll('#hb-board .hb-sy-deep .hb-sy-ch.is-deep').length >= 4 ? true : null, null, 20000);
    await page.waitForTimeout(500);
    let ch = await chapters();
    console.log(JSON.stringify(ch));
    const [grid, pk, un, pic] = ch;
    check('1a no deeper chapter is blank', ch.length === 4 && ch.every(c => c.svg || c.lines || c.none), JSON.stringify(ch.map(c => [c.t, !!c.svg, c.lines, c.none])));
    check('1b the answer-pack chapter draws a chart and offers the whole answer', !!(pk && pk.svg && pk.pack), JSON.stringify(pk));
    check('1c the chapter whose contracts no longer match says so', !!(un && un.none && !un.svg), JSON.stringify(un));
    check('2a the grid chapter takes the story\'s whole row', !!(grid && /hb-heat/.test(grid.svg || '') && grid.wide && grid.full), JSON.stringify(grid));
    check('2b at 1440 none of the grid\'s writing is under 12px', !!(grid && grid.minPx >= 11.95), grid && grid.minPx);
    check('3 the chapter that named a picture draws it: columns by month, not the step\'s ranking', !!(pic && /hb-cols/.test(pic.svg || '')), JSON.stringify(pic));
    { const el = await page.$('#hb-board .hb-sy-deep'); if (el) await el.screenshot({ path: path.join(OUT, 'deeper-1440.png') }); }

    await page.setViewportSize({ width: 1024, height: 900 }); await page.waitForTimeout(500);
    ch = await chapters();
    check('2c at 1024 none of the grid\'s writing is under 12px either', !!(ch[0] && ch[0].minPx >= 11.95), ch[0] && ch[0].minPx);
    { const el = await page.$('#hb-board .hb-sy-deep'); if (el) await el.screenshot({ path: path.join(OUT, 'deeper-1024.png') }); }
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.waitForTimeout(300);

    /* 4. expand: a HaTi chapter, then a deeper one */
    const drawn = await page.evaluate(() => [...document.querySelectorAll('#hb-board .hb-sy-ch')].filter(c => c.querySelector('svg.hb-svg')).every(c => c.querySelector('[data-hb-sy-big]')));
    check('4a every chapter drawn as a chart has the board\'s expand button (a ranked list is already its full size, each row a door)', drawn);
    for (const [sel, n] of [['#hb-board .hb-sy > .hb-sy-chs > .hb-sy-ch [data-hb-sy-big]', '4b a HaTi chapter'], ['#hb-board .hb-sy-deep .hb-sy-ch.is-deep [data-hb-sy-big]', '4c a deeper chapter']]){
      const key = await page.evaluate(sel => { const b = document.querySelector(sel); return b ? b.getAttribute('data-hb-sy-big') : null; }, sel);
      if (!key){ check(`${n}: opens enlarged with HaTi's reading, the trail leads back`, false, 'no expand button'); continue; }
      await page.click(sel);
      const big = await until(key => { const s = hbS(); return (s.path || []).slice(-1)[0] === key && s.digBig && document.querySelector('#hb-focus .hb-dig.is-big .hb-read') ? true : null; }, key);
      const back = await page.evaluate(() => { const b = [...document.querySelectorAll('#hb-focus .hb-trail [data-hb-crumb]')].find(x => /Negotiation friction/i.test(x.textContent)); if (b) b.click(); return !!b; });
      const home = back && await until(() => (hbS().path || []).slice(-1)[0] === 'sy:friction' && document.querySelector('#hb-board .hb-sy') ? true : null);
      check(`${n}: opens enlarged with HaTi's reading, the trail leads back`, !!big && !!home, JSON.stringify({ key, big: !!big, back, home: !!home }));
      if (n.startsWith('4b')) await page.screenshot({ path: path.join(OUT, 'chapter-big.png') });
      await page.evaluate(() => { const s = hbS(); s.digBig = false; hbSave(); });
    }
    check('5 no page errors', !errors.length, JSON.stringify(errors.slice(0, 3)));
  } catch (e){ check('the stage ran to the end', false, e.message); }
  finally { await browser.close(); await h.stop(); }
  const failed = results.filter(r => !r.pass).length;
  console.log(failed ? `${failed} of ${results.length} failed` : `${results.length}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
