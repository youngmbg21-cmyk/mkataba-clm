/* Chromium verification: STORIES ON THE BOARD (Young, 6 Oct 2026: "Use Dig
   deeper as the name, build it now", over the "Trend Story Agents" proposal)
   ============================================================
   On Home's board, a book with a year of signings, negotiations and redlines:
     1. "build me a story of our negotiation friction over the last year"
        opens the story on the board: four chapters, each drawn, the clause
        chapter naming the clause redlined most;
     2. the words: ONE Copilot call; the lead and each chapter's sentences
        are on the page, a planted sentence with a number HaTi did not count
        is not, and the foot says one was left out;
     3. Dig deeper on the story: its cost beside it; one press sends the
        story's own fact sheets with the question; the run stays on the story;
        a deeper chapter is drawn, with What to watch and Ideas set aside;
     4. the story reads on the board's Dark AND Light screens (the lead, a
        chapter's words and the cost line stand off the card);
     5. Share opens the give form on the story;
     6. a refresh lands back on the story with its words, and no new call;
     7. no page errors;
     8. the other seven topics: the quarterly review and one counterparty's
        story ("brief me on Kevian Kenya Ltd") open with four chapters drawn.
   Copilot is a stub on its routes (no key in CI). Waits ask for the state.
   Run: node test/chromium/board-stories-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-stories');
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
const rgb = s => (String(s).match(/[\d.]+/g) || []).map(Number);
const over = (fg, bg) => { const [r, g, b, a = 1] = rgb(fg); const [R, G, B] = bg; return [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)]; };
const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const CARD = { dark: over('rgba(4,25,26,.82)', [2, 16, 17]), light: over('rgba(255,255,255,.62)', [255, 255, 255]) };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  let chats = 0; const analyst = [];
  await page.route('**/api/ai/chat/stream', r => r.abort());
  await page.route('**/api/ai/chat', async r => { chats++;
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ answer:
      'LEAD: Negotiations took more rounds as the year went on.\nC1: Rounds per contract peaked at 4.\nC2: Signing took longer at the peak. It once took 9999 days.\nC3: Limitation of liability was redlined most.\nC4: Kevian Kenya Ltd took the most rounds.' }) }); });
  await page.route('**/api/board/analyst', async r => {
    const body = JSON.parse(r.request().postData() || '{}'); analyst.push(body);
    const step = (body.steps || []).length === 0
      ? { name: 'calculate', input: { why: 'Is one counterparty behind the rise?', which: { all: true }, recipe: { pic: 'bars', split: { by: 'counterparty' }, measure: 'rounds' } } }
      : { name: 'finish', input: { summary: 'Kevian Kenya Ltd took the most rounds.', cards: [], next: [],
          chapters: [{ step: 1, title: 'Who drove it', text: 'Kevian Kenya Ltd took the most rounds.' }],
          watch: [{ text: 'Kevian Kenya Ltd has the most contracts.', step: 1 }], aside: [{ idea: 'Bigger contracts take more rounds', why: 'Only a weak link.' }] } };
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ step, steps: (body.steps || []).length, max: 15 }) });
  });
  const until = async (fn, arg, ms = 10000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms){ try { v = await page.evaluate(fn, arg); } catch (_){ v = null; } if (v) return v; await page.waitForTimeout(120); } return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.digBig = false; s.recipe = {}; s.screen = 'dark'; delete s.sy; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    await page.evaluate(() => { state.aiConfigured = true; intel.history = []; });

    /* 1. the story opens */
    await page.evaluate(async () => { await intelAsk('build me a story of our negotiation friction over the last year'); });
    const opened = await until(() => { const sy = document.querySelector('#hb-board .hb-sy'); return sy && (hbS().path || []).slice(-1)[0] === 'sy:friction' ? true : null; });
    check('1a the story opens on the board', opened);
    const chs = await page.evaluate(() => [...document.querySelectorAll('#hb-board .hb-sy-chs')[0].children].map(ch => ({ t: (ch.querySelector('h4') || {}).textContent, drawn: !!ch.querySelector('svg, .hb-chart') })));
    check('1b four chapters, each drawn', chs.length === 4 && chs.every(c => c.drawn), JSON.stringify(chs));
    const c3 = await page.evaluate(() => { const ch = document.querySelectorAll('#hb-board .hb-sy-chs')[0].children[2]; return ch ? ch.innerText.replace(/\s+/g, ' ') : ''; });
    check('1c the clause chapter names the clause redlined most', /Limitation of liability/.test(c3), c3.slice(0, 160));

    /* 2. the words */
    const words = await until(() => { const l = document.querySelector('#hb-board .hb-sy-lead'); return l && /more rounds/.test(l.textContent) ? document.querySelector('#hb-board .hb-sy').innerText.replace(/\s+/g, ' ') : null; });
    check('2a one Copilot call writes the words', chats === 1 && !!words, 'calls ' + chats);
    check('2b the lead and a chapter\'s sentences are on the page', /Negotiations took more rounds as the year went on/.test(words || '') && /Limitation of liability was redlined most/.test(words || ''));
    check('2c a sentence with a number HaTi did not count is not, and the foot says so', !/9999/.test(words || '') && /1 sentence was left out/.test(words || ''), (words || '').slice(-200));
    await page.screenshot({ path: path.join(OUT, 'story-dark.png') });

    /* 4. both screens read (measured before Dig deeper fills the card) */
    for (const scr of ['dark', 'light']){
      await page.click(`[data-hb-screen="${scr}"]`);
      await until(scr => { const p = document.getElementById('hb-page') || document.getElementById('ig-page'); return p && p.classList.contains('hb-' + scr) && document.querySelector('#hb-board .hb-sy-lead') ? true : null; }, scr);
      const m = await page.evaluate(() => { const c = sel => { const e = document.querySelector(sel); return e ? getComputedStyle(e).color : null; };
        return { lead: c('#hb-board .hb-sy-lead'), para: c('#hb-board .hb-sy-p'), cost: c('#hb-board .hb-sy .hb-dd-cost') }; });
      const r = Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v ? ratio(over(v, CARD[scr]), CARD[scr]) : 0]));
      check(`4${scr === 'dark' ? 'a' : 'b'} ${scr} screen: the lead, a chapter's words and the cost line stand off the card (≥ 4.5)`, r.lead >= 4.5 && r.para >= 4.5 && r.cost >= 4.5, JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.toFixed(2)]))));
      await page.screenshot({ path: path.join(OUT, `story-${scr}.png`) });
    }
    await page.click('[data-hb-screen="dark"]');

    /* 3. Dig deeper on the story */
    const cost = await page.evaluate(() => { const b = document.querySelector('#hb-board [data-hb-sy-deeper]'); const c = document.querySelector('#hb-board .hb-sy .hb-dd-cost');
      return { on: !!b && !b.disabled, label: b ? b.textContent.trim() : '', cost: c ? c.textContent : '' }; });
    check('3a "Dig deeper" on the story, its cost beside it', cost.on && /Dig deeper/.test(cost.label) && /up to 15 steps/.test(cost.cost), JSON.stringify(cost));
    await page.click('#hb-board [data-hb-sy-deeper]');
    const deep = await until(() => { const d = document.querySelector('#hb-board .hb-sy-deep'); return d && d.querySelector('.hb-sy-ch.is-deep') ? d.innerText.replace(/\s+/g, ' ') : null; });
    check('3b one press sends the story\'s own fact sheets with the question', analyst.length >= 1 && /STORY — Negotiation friction/.test(analyst[0].story || ''), String((analyst[0] || {}).story || '').slice(0, 60));
    check('3c the run stays on the story', await page.evaluate(() => (hbS().path || []).slice(-1)[0] === 'sy:friction'));
    check('3d a deeper chapter is drawn, with What to watch and Ideas set aside', !!deep && /5 of 5 · deeper/.test(deep) && /What to watch/i.test(deep) && /Ideas set aside/i.test(deep)
      && await page.evaluate(() => !!document.querySelector('#hb-board .hb-sy-ch.is-deep svg, #hb-board .hb-sy-ch.is-deep .hb-chart')), (deep || '').slice(0, 200));
    await page.waitForTimeout(600);
    { const el = await page.$('#hb-board .hb-sy-deep'); if (el) await el.screenshot({ path: path.join(OUT, 'story-deeper.png') }); }

    /* 5. Share */
    await page.click('#hb-board [data-hb-sy-give]');
    check('5 Share opens the give form on the story', !!(await until(() => document.querySelector('#hb-board .hb-sy [data-hb-give-form="sy:friction"], #hb-board .hb-sy .hb-inl') ? true : null, null, 4000)));

    /* 8. the other seven topics: the quarterly review and one counterparty's story */
    for (const [q, sid, n] of [['build our quarterly contract review', 'quarter', '8a'], ['brief me on Kevian Kenya Ltd before the renewal meeting', 'party~Kevian%20Kenya%20Ltd', '8b']]){
      await page.evaluate(async q => { await intelAsk(q); }, q);
      const got = await until(sid => { const p = (hbS().path || []).slice(-1)[0]; const g = document.querySelector('#hb-board .hb-sy-chs');
        return p === 'sy:' + sid && g ? [...g.children].map(ch => ({ t: (ch.querySelector('h4') || {}).textContent, drawn: !!ch.querySelector('svg, .hb-chart, .hb-quiet') })) : null; }, sid);
      check(`${n} "${q}" opens its story: four chapters, each drawn`, !!got && got.length === 4 && got.every(c => c.drawn), JSON.stringify(got));
    }
    const party = await page.evaluate(() => (document.querySelector('#hb-focus .hb-ct') || {}).textContent || '');
    check('8c one counterparty\'s story wears their name', /Kevian Kenya Ltd/.test(party), party);
    await page.screenshot({ path: path.join(OUT, 'story-party.png') });

    /* 6. a refresh lands back on the story with its words, and no new call */
    const before = chats;
    await page.reload({ waitUntil: 'networkidle' });
    await page.evaluate(() => { state.aiConfigured = true; });
    const back = await until(() => { const l = document.querySelector('#hb-board .hb-sy-lead'); return l && /more rounds/.test(l.textContent) ? true : null; }, null, 15000);
    check('6 a refresh lands back on the story with its words, and no new call', !!back && chats === before, 'calls ' + chats);
    check('7 no page errors', !errors.length, JSON.stringify(errors.slice(0, 3)));
  } catch (e){ check('the stage ran to the end', false, e.message); }
  finally { await browser.close(); await h.stop(); }
  const failed = results.filter(r => !r.pass).length;
  console.log(failed ? `${failed} of ${results.length} failed` : `${results.length}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
