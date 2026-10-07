/* THE BOARD DRAWS WHAT YOU ASK, HOWEVER YOU SAY IT (Young, 7 Oct 2026, the
   one-build work order, part A)
   ============================================================
   Typed into Home's ask box on the Board:
     A0/A1. every phrase of the work order's table reaches the board FREE and
        draws its picture — "bubble chart of value against time left" too;
     A2. the five openings (bare, "show me", "give me", "can you draw",
        "I want to see") give the same reading, and two of them, typed, draw
        the same card; "show me <a contract>" and "bring up <one name>" still
        open the contract; "the map" still turns to Explorer;
     A3. the hidden map's grouping and look never change for a board question
        — not even when Copilot answers in the map's language with no board
        actions (a scripted reply): a picture HaTi read becomes a card;
        otherwise Copilot is asked once more, then one plain line;
     A4. no reply sentence names a chart when no card landed.
   Every driven half is GUARDED — a build without the feature REPORTS.
   Screenshots: test/chromium/shots/board-says-it-plain/ (or HATI_SHOT_DIR).
   Run: node test/chromium/board-says-it-plain-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-says-it-plain');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};
const until = async (page, fn, arg, ms = 8000) => {
  const t0 = Date.now();
  for (;;){
    let v = null;
    try{ v = await page.evaluate(fn, arg); }catch(_){ v = null; }
    if (v) return v;
    if (Date.now() - t0 > ms) return v;
    await new Promise(r => setTimeout(r, 120));
  }
};
const iso = off => { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10); };

/* [phrase, the picture(s) it may draw, what it counts] — the work order's table */
const TABLE = [
  ['bubble chart of value against time left', ['bubbles'], 'value'],
  ['value against time left', ['bubbles'], 'value'],
  ['bubbles', ['bubbles'], null],
  ['contracts by stage as a pie', ['ring'], 'count'],
  ['value by stream', ['bars', 'blocks'], 'value'],
  ['signed contracts by month with a trend', ['cols'], 'count'],
  ['top 5 counterparties by value', ['bars', 'blocks'], 'value'],
  ['timeline of contracts ending in the next 6 months', ['gantt'], null],
  ['value by stream and stage as stacked columns', ['stack'], 'value'],
  ['contracts by stream and payment terms as a heat map', ['heat'], null],
  ['value by counterparty as a treemap', ['blocks'], 'value'],
  ['median days to sign by quarter over the last 2 years', ['cols'], 'medianDaysToSign'],
  ['risk exposure by stream', ['bars', 'blocks'], 'exposure'],
  ['value signed this year as a running total', ['cols'], 'value'],
  ['contracts ending by quarter compared with last year', ['cols'], 'count'],
  ['a pie of payment terms', ['ring'], null],
  ['payment terms pie', ['ring'], null],
  ['chart of renewals by month', ['cols'], null],
];
const OPEN = ['', 'show me ', 'give me ', 'can you draw ', 'I want to see '];

(async () => {
  const h = await startHati({});
  const extra = [
    { ...FIXTURES[0], id: 'MK-BP1', name: 'Cold store lease', counterparty: 'Tundra Cold Chain Ltd', status: 'Signed', expiry: iso(60), value: 3000000 },
    { ...FIXTURES[2], id: 'MK-BP2', name: 'Fleet fuel cards', counterparty: 'Savanna Fuels', status: 'Signed', expiry: iso(200), value: 9000000 },
  ];
  await seedWorkspace(h, { contracts: FIXTURES.concat(extra), approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.join(OUT, n) }).catch(() => {});
  const mapNow = () => page.evaluate(() => JSON.stringify({ r: typeof igRecipeNow === 'function' ? igRecipeNow() : null, g: window.intel ? intel.groupBy : null, v: window.intel ? intel.view : null }));
  /* one question typed into the board's box; what landed */
  const ask = async q => {
    const n0 = await page.evaluate(() => (window.intel && intel.history ? intel.history.length : 0));
    const p0 = await page.evaluate(() => JSON.stringify(hbS().path || []) + '|' + (hbS().panels || []).length);
    await page.fill('#igd-input', q);
    await page.keyboard.press('Enter');
    await until(page, n0 => !intel.busy && intel.history.length > n0, n0, 15000);
    await page.waitForTimeout(150);
    return page.evaluate(([p0, n0]) => {
      const s = hbS(); const path = s.path || []; const key = path.slice(-1)[0];
      const panelsNow = (s.panels || []).length, panels0 = Number(String(p0).split('|')[1]);
      let P = null; try { const D = key ? hbDigData(key, s.lens) : null; if (D && D.kind === 'list') P = hbPlan(D); } catch (_){ P = null; }
      const said = intel.history.slice(n0).filter(m => m.role === 'assistant').map(m => String(m.text || '').replace(/<[^>]+>/g, ' ')).join(' ').replace(/\s+/g, ' ');
      return { moved: JSON.stringify(path) !== String(p0).split('|')[0] || panelsNow > panels0, added: panelsNow > panels0, key, face: s.face, pic: P && P.pic, measure: P && P.measure, split: P && P.split && P.split.by, said };
    }, [p0, n0]);
  };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length), null, 15000);
    await page.evaluate(() => setView('dashboard'));
    if (!(await until(page, () => document.querySelectorAll('#hb-board .hb-fig').length > 0 && !!document.getElementById('igd-input'), null, 12000))) throw new Error('the board did not draw');
    /* no Copilot key for the table: every row must be HaTi's own */
    await page.evaluate(() => { state.aiConfigured = false; });
    const map0 = await mapNow();

    /* ---- A2 (read): the five openings read alike ---- */
    const reads = await page.evaluate(([T, O]) => T.map(([p]) => {
      const cells = O.map(o => { const A = hbAskReadingOf(o + p); return A ? A.road + ':' + (A.kind || '') + ':' + JSON.stringify(A.r || A.fu || null) : 'null'; });
      return { p, same: cells.every(c => c === cells[0]), free: cells.every(c => /^free:/.test(c)), cells };
    }), [TABLE, OPEN]);
    const notSame = reads.filter(r => !r.same), notFree = reads.filter(r => !r.free);
    check(!notSame.length, `A2 every phrase reads the same in all five openings (${reads.length - notSame.length}/${reads.length})`, notSame.map(r => r.p + ' → ' + r.cells.join(' | ')).slice(0, 3).join(' ;; '));
    check(!notFree.length, `A1 every phrase is HaTi's own reading, free (${reads.length - notFree.length}/${reads.length})`, notFree.map(r => r.p + ' → ' + r.cells[0]).slice(0, 4).join(' ;; '));

    /* ---- A0 (typed): the bare phrase and "can you draw" draw the same card ---- */
    const bad = [];
    for (const [p, pics, measure] of TABLE){
      const a = await ask(p);
      const b = await ask('can you draw ' + p);
      const ok = a.moved && pics.includes(a.pic) && (!measure || a.measure === measure)
        && b.pic === a.pic && b.measure === a.measure && b.split === a.split;
      if (!ok) bad.push(p + ' → ' + JSON.stringify([a.pic, a.measure, a.split, b.pic, b.measure, b.split, a.moved]));
    }
    check(!bad.length, `A0 every phrase lands its card, alike with "can you draw" (${TABLE.length - bad.length}/${TABLE.length})`, bad.slice(0, 4).join(' ;; '));
    const bubble = await ask('bubble chart of value against time left');
    check(bubble.pic === 'bubbles' && /free/i.test(bubble.said), 'A1 "bubble chart of value against time left" draws bubbles, free', JSON.stringify(bubble));
    await shot('1-bubbles.png');
    check((await mapNow()) === map0, 'A3 the hidden map is untouched by every board question so far', await mapNow());

    /* ---- not a chart ---- */
    const one = await ask('show me MK-BP2');
    check(/^c:MK-BP2$/.test(one.key || ''), '2a "show me MK-BP2" opens the contract', JSON.stringify(one));
    const two = await ask('bring up Tundra Cold Chain Ltd');
    check(/^c:MK-BP1$/.test(two.key || ''), '2b "bring up <one name>" opens the contract', JSON.stringify(two));
    const three = await ask('show me Tundra Cold Chain Ltd by month');
    check(!/^c:/.test(three.key || '') && three.moved, '2c the same name WITH chart words draws a chart, not the contract', JSON.stringify(three));
    await page.evaluate(() => { hbS().face = 'board'; });
    const mapped = await ask('the map');
    check(mapped.face === 'explorer', '2d "the map" still turns to Explorer', JSON.stringify(mapped));
    await page.evaluate(() => hbSetFace('board'));
    await until(page, () => hbS().face === 'board' && !!document.getElementById('igd-input'));

    /* ---- A3/A4: Copilot answers in the map's language ---- */
    const mapBefore = await mapNow();
    await page.evaluate(() => {
      state.aiConfigured = true; window._bpCalls = 0;
      const real = window.api;
      window._bpReal = real;
      window.api = async (p, m, body) => {
        if (p === 'ai/graph'){ window._bpCalls++;
          return { visibleIds: null, where: null, action: 'filter', answer: 'This bubble chart plots contracts by expiry date and sizes them by value. The 4 contracts ending soon stand out.',
            groupBy: 'expiry', sizeBy: 'value', timeBy: 'expiry', colourBy: 'value', labelBy: 'counterparty', actions: null, chart: null, choices: null, kind: 'map' }; }
        return real(p, m, body);
      };
    });
    /* picture words HaTi read, plus words it could not: the card is drawn from what it read */
    const pic = await ask('bubble chart of value for the grumpy suppliers please');
    check(pic.added && /Bubbles/.test(pic.said), 'A3a a picture HaTi read becomes a card on the board', JSON.stringify(pic));
    check(!/Grouped|Sized by|Timeline by/i.test(pic.said), 'A3b the map\'s sentence is never said on the board', pic.said);
    check((await mapNow()) === mapBefore, 'A3c the hidden map is exactly as it was', await mapNow());
    const calls0 = await page.evaluate(() => window._bpCalls);
    const none = await ask('tell me something clever about the grumpy suppliers');
    const calls = await page.evaluate(() => window._bpCalls) - calls0;
    check(calls === 2, 'A3d with nothing to draw Copilot is asked ONCE more for board actions', calls);
    check(/could not draw/i.test(none.said) && !none.moved, 'A3e then one plain line, and nothing is drawn', none.said);
    check(!/bubble chart|plots/i.test(none.said), 'A4 no sentence names a chart when no card landed', none.said);
    check((await mapNow()) === mapBefore, 'A3f the hidden map is still exactly as it was', await mapNow());
    await shot('2-plain-line.png');
    await page.evaluate(() => { window.api = window._bpReal; });
  } catch (e){
    console.log('  FAIL — stopped: ' + (e && e.message));
    failures++;
  }
  check(errors.length === 0, '9 no page errors', errors.join(' | ') || 'none');
  await browser.close();
  await h.stop();
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
