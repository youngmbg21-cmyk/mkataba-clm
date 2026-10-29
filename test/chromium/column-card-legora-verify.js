/* THE COLUMN CARD, THE LEGORA WAY, NO GREY, AND STOP STANDS STILL (owner, 29 Oct 2026; docs/MAP-HISTORY.md
   "THE COLUMN CARD, THE LEGORA WAY"). Driven on a book of 60 contracts whose governing law is Kenya (24),
   Sweden (12), England, France, Norway (6 each) or none (6), with the test stand-in reading the country:
     1 · STOP STANDS STILL: while a read runs, Stop heads the card (top right) and its place never moves
     2 · THE ANSWERS COME FIRST: one row per answer, biggest first, the rest folded into "1 other answer",
         "say nothing about it" last; each a colour of its own, the same in the list's cells; no grey anywhere
     3 · the quote under the answers: the biggest group's first, › to the next, a group pressed shows its own;
         Show puts just that group on the list
     4 · A YES-OR-NO QUESTION COLOURS ITSELF: yes green, no blue; the legend says so
     5 · SEVERAL QUESTIONS, ONE OPEN: the last read open, the other folded; a press opens it and folds the other
     6 · while a read runs the questions before it stand folded under it; a Stop leaves no second card — the
         question says "You stopped at …" and its one button carries on
     7 · "NEXT 50" SHOWS THE READ: after a question to Jambo on Reads, Next 50 lands on Contracts with the
         panel on its Overview, where the read runs — not on his conversation
     8 · the three screens: nothing spills out of the panel; pictures saved
   Run: node test/chromium/column-card-legora-verify.js   (pictures: COLCARD_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.COLCARD_SHOTS || path.join(__dirname, 'shots', 'column-card-legora');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

const LANDS = ['Kenya', 'Kenya', 'Kenya', 'Kenya', 'Sweden', 'Sweden', 'France', 'England', 'Norway', ''];
const PARTIES = ['Kabras Sugar', 'Nandi Dairy', 'Juno Logistics', 'Naivas Supermarkets', 'Pixel Agency', 'Mara Logistics'];
function book(n){
  const out = [];
  for (let i = 0; i < n; i++){
    const land = LANDS[i % LANDS.length], party = PARTIES[i % PARTIES.length];
    const body = `SUPPLY AGREEMENT\n\nThis Supply Agreement is made between Highland Corporate Ltd and ${party}.\n\n3. Payment\nPayment is due within thirty days of invoice.\n\n12. Governing law\n${land ? `This Agreement shall be governed by the laws of ${land}.` : 'The parties shall meet to settle any dispute in good faith.'}`;
    const c = fixtureContract(`HC-${1001 + i}`, 'Supply Agreement', party, 'proc', 1000000 + i * 1000, 'Signed', body);
    c.lastAction = `${1 + (i % 27)} Oct 2026`;
    out.push(c);
  }
  return out;
}
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const Q1 = "Which country's law governs it?", N1 = 'Governing country';
const Q2 = 'Is the governing country France?', N2 = 'France';
const Q3 = 'Which country do the courts sit in?', N3 = 'Courts country';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ AI_RATE_DEEP: '200' });
  await seedWorkspace(h, { contracts: book(60) });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    const errors = []; page.on('pageerror', e => errors.push(String(e && e.message || e)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length >= 60 && typeof window.askColOpen === 'function', null, 40000);
    await page.waitForTimeout(1000);
    const toList = async () => { await page.evaluate(() => { regPlaceSet({ show: 'list', only: null }); setView('register'); }); await until(page, () => !!document.querySelector('#reg-tbody tr[data-row]')); await page.waitForTimeout(400); };
    await toList();
    const ask = async (q, name) => {
      await page.evaluate(([q, name]) => { acSizeSet(100); askColOpen({ question: q, name }); }, [q, name]);
      if (!await until(page, () => !!document.querySelector('[data-ac-ask]:not([disabled])'))) return false;
      await page.click('[data-ac-ask]');
      return until(page, () => !!AC.busy, null, 8000);
    };
    const ended = () => until(page, () => !AC.busy && !document.querySelector('[data-ac-stop]'), null, 60000);

    /* ---- 1 Stop stands still while the read runs ---- */
    h.ai.slow(500);
    const started = await ask(Q1, N1);
    check('1a a read starts', started);
    const tops = [];
    let inHead = null;
    for (let i = 0; i < 14 && started; i++){
      const m = await page.evaluate(() => { const b = document.querySelector('#ig-dock [data-ac-stop]'); if (!b) return null; const r = b.getBoundingClientRect(); const top = b.closest('.ac-dk-top'); return { top: Math.round(r.top), right: Math.round(r.right), inTop: !!top, done: AC.busy ? AC.busy.done : -1 }; });
      if (m){ tops.push(m); if (inHead === null) inHead = m.inTop; }
      await page.waitForTimeout(300);
    }
    const spread = tops.length ? Math.max(...tops.map(t => t.top)) - Math.min(...tops.map(t => t.top)) : 99;
    check('1b Stop heads the card, beside what is in flight', inHead === true);
    check('1c Stop never moves while answers land', tops.length >= 5 && spread <= 1 && new Set(tops.map(t => t.done)).size > 1, { samples: tops.length, spread, done: [...new Set(tops.map(t => t.done))] });
    await page.screenshot({ path: path.join(OUT, '1-running.png') });
    h.ai.slow(0);
    check('1d the read ends', await ended());
    await page.waitForTimeout(600);

    /* ---- 2 the answers come first, each its own colour, no grey ---- */
    const card = await page.evaluate(() => {
      const c = document.querySelector('#ig-dock .ac-col.is-open'); if (!c) return null;
      return { q: (c.querySelector('.ac-col-q') || {}).textContent || '', say: ((c.querySelector('.ac-col-say') || {}).textContent || '').trim(),
        rows: [...c.querySelectorAll('.ac-tl')].map(r => ({ n: (r.querySelector('.ac-tl-n') || {}).textContent, w: ((r.querySelector('.ac-tl-w') || {}).textContent || '').trim(), tone: ((r.querySelector('.ac-ans') || {}).className || '').replace('ac-ans ', '') })),
        btns: [...c.querySelectorAll('.ui-btn-primary')].length, links: [...c.querySelectorAll('.ac-col-links .ac-link')].map(b => b.textContent.trim()), stopped: !!document.querySelector('#ac-stopped'), rest: !!document.querySelector('[data-ac-desk-rest]') };
    });
    check('2a the open question leads, its words and one sentence', !!card && card.q === Q1 && /60 of 60 read|All 60 are read/.test(card.say), card && { q: card.q, say: card.say });
    const want = [['24', 'Kenya', 'tone-v1'], ['12', 'Sweden', 'tone-v2'], ['6', 'England', 'tone-v3'], ['6', 'France', 'tone-v4'], ['6', '1 other answer (Norway)', 'tone-v5'], ['6', 'say nothing about it', 'tone-none']];
    check('2b one row per answer, biggest first, the rest folded, nothing found last', !!card && JSON.stringify(card.rows.map(r => [r.n, r.w, r.tone])) === JSON.stringify(want), card && card.rows);
    check('2c no second card: no stopped card, no rest card', !!card && !card.stopped && !card.rest);
    check('2d three links and More…', !!card && card.links.length === 4 && /More/.test(card.links[3]), card && card.links);
    const colours = await page.evaluate(() => {
      const bg = sel => { const i = document.querySelector(sel); return i ? getComputedStyle(i).backgroundColor : ''; };
      const askId = Object.keys(AC.ans).find(k => (AC.asks[k] || {}).name === 'Governing country');
      const cell = land => { const m = AC.ans[askId] || {}; const tds = [...document.querySelectorAll(`td.ac-cell[data-ac="${askId}"]`)]; const td = tds.find(t => (m[t.getAttribute('data-ac-cid')] || {}).answer === land); const a = td && td.querySelector('.ac-ans'); return a ? a.className : ''; };
      return { grey: document.querySelectorAll('.tone-gray, .ac-lg-gray').length, v1: bg('#ig-dock .ac-tl .ac-ans.tone-v1 > i'), none: getComputedStyle(document.querySelector('#ig-dock .ac-tl .ac-ans.tone-none > i') || document.body).boxShadow,
        kenyaCell: cell('Kenya'), swedenCell: cell('Sweden'), legend: [...document.querySelectorAll('.ac-legend .ac-lg i')].map(i => i.className) };
    });
    check('2e nothing is grey', colours.grey === 0, colours.grey);
    check('2f a plain fact wears its answer\'s colour (violet for the biggest)', colours.v1 === 'rgb(122, 68, 184)', colours.v1);
    check('2g nothing found is an empty ring', /inset/.test(colours.none), colours.none);
    check('2h the list\'s cells wear the same colours as the panel', /tone-v1/.test(colours.kenyaCell) && /tone-v2/.test(colours.swedenCell), [colours.kenyaCell, colours.swedenCell]);
    check('2i the legend: yes · no · a plain fact · watch · risk · not found', JSON.stringify(colours.legend) === JSON.stringify(['ac-lg-green', 'ac-lg-steel', 'ac-lg-v1', 'ac-lg-amber', 'ac-lg-ruby', 'ac-lg-none']), colours.legend);
    await page.screenshot({ path: path.join(OUT, '2-answers.png') });

    /* ---- 3 the quote, ‹ ›, a group pressed, Show ---- */
    const qh = () => page.evaluate(() => ((document.querySelector('#ig-dock .ac-qw-h span') || {}).textContent || '').trim());
    check('3a the biggest group\'s first quote', /^Kenya · example 1 of 24$/.test(await qh()), await qh());
    const quote = await page.evaluate(() => ((document.querySelector('#ig-dock .ac-qw-q') || {}).textContent || ''));
    check('3b the words quoted are the paper\'s', /governed by the laws of Kenya/.test(quote), quote);
    await page.click('#ig-dock [data-ac-qstep="1"]');
    check('3c › walks to the next contract', await until(page, () => /example 2 of 24/.test((document.querySelector('#ig-dock .ac-qw-h span') || {}).textContent || '')));
    await page.click('#ig-dock .ac-tl-b[data-ac-grp]:not([data-ac-grp="__nf"]) >> nth=1');
    check('3d a group pressed shows its own quote', await until(page, () => /^Sweden · example 1 of 12$/.test(((document.querySelector('#ig-dock .ac-qw-h span') || {}).textContent || '').trim())));
    await page.click('#ig-dock [data-ac-grp-show] >> nth=1');
    check('3e Show puts just that group on the list', await until(page, () => (typeof regFiltered === 'function') && regFiltered().length === 12), await page.evaluate(() => regFiltered().length));
    await toList();

    /* ---- 4 a yes-or-no question colours itself ---- */
    check('4a a second question is read', await ask(Q2, N2) && await ended());
    await page.waitForTimeout(500);
    const yn = await page.evaluate(() => [...document.querySelectorAll('#ig-dock .ac-col.is-open .ac-tl')].map(r => [((r.querySelector('.ac-tl-w') || {}).textContent || '').trim(), ((r.querySelector('.ac-ans') || {}).className || '').replace('ac-ans ', '')]));
    const tone = w => (yn.find(r => r[0] === w) || [])[1];
    check('4b yes is green, no is blue', tone('France') === 'tone-green' && tone('Kenya') === 'tone-steel' && tone('Sweden') === 'tone-steel', yn);

    /* ---- 5 several questions, one open ---- */
    const qs = () => page.evaluate(() => ({ open: ((document.querySelector('#ig-dock .ac-col.is-open .ac-col-q') || {}).textContent || ''), folded: [...document.querySelectorAll('#ig-dock .ac-col-fold .ac-fd-h b')].map(b => b.textContent), eb: ((document.querySelector('#ig-dock .ac-col-eb') || {}).textContent || '') }));
    let s5 = await qs();
    check('5a the last read is open, the other folded under "Other questions on the list"', s5.open === Q2 && JSON.stringify(s5.folded) === JSON.stringify([N1]) && /Other questions/.test(s5.eb), s5);
    const fd = await page.evaluate(() => { const f = document.querySelector('#ig-dock .ac-col-fold'); return f ? { bar: f.querySelectorAll('.ac-gbar i').length, counts: (f.querySelector('.ac-fd-cs') || {}).textContent || '', n: (f.querySelector('.ac-fd-n') || {}).textContent || '' } : null; });
    check('5b a folded line: how far it is read, a coloured bar, its answers counted', !!fd && fd.bar >= 3 && /24 Kenya/.test(fd.counts) && /60 of 60 read/.test(fd.n), fd);
    await page.click('#ig-dock .ac-col-fold');
    s5 = await qs();
    check('5c a folded line pressed opens; the other folds', s5.open === Q1 && JSON.stringify(s5.folded) === JSON.stringify([N2]), s5);
    await page.click(`#reg-thead th[data-ac-th] >> text=${N2}`).catch(async () => { await page.evaluate(n => { const th = [...document.querySelectorAll('th[data-ac-th]')].find(x => x.textContent.includes(n)); if (th) th.click(); }, N2); });
    check('5d a column head pressed on the list opens its question', await until(page, q => ((document.querySelector('#ig-dock .ac-col.is-open .ac-col-q') || {}).textContent || '') === q, Q2, 4000));
    await page.screenshot({ path: path.join(OUT, '5-two-questions.png') });

    /* ---- 6 a read beside earlier questions; Stop leaves one card ---- */
    h.ai.slow(900);
    check('6a a third read starts', await ask(Q3, N3));
    const during = await until(page, () => !!document.querySelector('#ig-dock [data-ac-desk-card]') && document.querySelectorAll('#ig-dock .ac-col-fold').length === 2 && /Earlier questions/.test((document.querySelector('#ig-dock .ac-col-eb') || {}).textContent || ''), null, 6000);
    check('6b the running card leads; the two questions before it stand folded under "Earlier questions on the list"', during);
    await page.screenshot({ path: path.join(OUT, '6-running-with-earlier.png') });
    await until(page, () => AC.busy && AC.busy.done >= 10, null, 20000);
    await page.click('#ig-dock [data-ac-stop]');
    check('6c Stop ends the read', await ended());
    h.ai.slow(0);
    await page.waitForTimeout(500);
    const st = await page.evaluate(() => ({ second: !!document.querySelector('#ac-stopped'), say: ((document.querySelector('#ig-dock .ac-col.is-open .ac-col-say') || {}).textContent || '').trim(), q: (document.querySelector('#ig-dock .ac-col.is-open .ac-col-q') || {}).textContent || '', carry: !!document.querySelector('#ig-dock .ac-col.is-open [data-ac-carry]'), next: !!document.querySelector('#ig-dock .ac-col.is-open [data-ac-next]') }));
    const same = await page.evaluate(() => { const by = {}; document.querySelectorAll('td.ac-cell .ac-ans').forEach(a => { const w = (a.textContent || '').trim(); const t = (a.className.match(/tone-v\d/) || [])[0]; if (t) (by[w] || (by[w] = new Set())).add(t); }); return Object.entries(by).map(([w, s]) => [w, [...s]]); });
    check('6c′ a plain fact keeps one colour in every column', same.length >= 3 && same.every(([, t]) => t.length === 1), same);
    check('6d no second card: the stopped question says "You stopped at …" and its one button carries on', !st.second && st.q === Q3 && /^You stopped at \d+ of 60\. \d+ of 60 are read, \d+ to go\.$/.test(st.say) && st.carry && !st.next, st);
    await page.screenshot({ path: path.join(OUT, '6-stopped.png') });

    /* ---- 7 Next 50 from Reads shows the read, not Jambo's conversation ---- */
    /* as the owner had it: a question to Jambo on Reads; his answer is the one conversation, and Contracts'
       panel turned to it on arrival — hiding the read that the press started (red at the parent) */
    await page.evaluate(() => setView('reads'));
    await until(page, () => !!document.querySelector('[data-rd-next]') && !!document.querySelector('#jl-q'), null, 15000);
    await page.fill('#jl-q', 'what does this page tell me about my reads?'); await page.press('#jl-q', 'Enter');
    check('7a Jambo answers on Reads', await until(page, () => (ai.history || []).length >= 2 && !ai.busy, null, 15000));
    h.ai.slow(700);
    await page.click('[data-rd-next] >> nth=0');
    const back = await until(page, () => !!document.querySelector('#reg-tbody') && !!AC.busy && !!document.querySelector('#ig-dock [data-ac-desk-card]') && !(typeof pdTalkShows === 'function' && pdTalkShows()), null, 20000);
    check('7b Next 50 lands on Contracts with the panel on its Overview, the read in sight', back, await page.evaluate(() => ({ view: state.view, busy: !!AC.busy, talk: typeof pdTalkShows === 'function' && pdTalkShows() })));
    await page.screenshot({ path: path.join(OUT, '7-next-from-reads.png') });
    h.ai.slow(0);
    await ended();

    /* ---- 8 the three screens ---- */
    await page.evaluate(() => { AC.openQ = null; renderIntelDock(); });
    for (const [w, hh] of SCREENS){
      await page.setViewportSize({ width: w, height: hh });
      await page.waitForTimeout(500);
      const spill = await page.evaluate(() => {
        const dock = document.querySelector('#ig-dock'); if (!dock) return ['no dock'];
        const R = dock.getBoundingClientRect(), out = [];
        dock.querySelectorAll('.ac-col *, .ac-col-fold *').forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.right > R.right + 1 || r.left < R.left - 1)) out.push((el.className || el.tagName) + ':' + Math.round(r.right)); });
        return out.slice(0, 5);
      });
      check(`8 ${w}×${hh}: nothing spills out of the panel`, !spill.length, spill);
      await page.screenshot({ path: path.join(OUT, `8-${w}x${hh}.png`) });
    }
    check('no page errors', !errors.length, errors.slice(0, 3));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
