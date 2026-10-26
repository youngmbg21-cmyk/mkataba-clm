/* global regState, regRepaint, regPlaceSet, setView, state, api, askColSummary, renderIntelDock, closeModal, askColBring, openSettingsAt, closeSettingsDrawer, askColFactsArrive, getContract, regOpenContract, pdContract, pdKtMid, watchLoad, watchesFired, watchFiredWords, watchGo, contractPlainText, precedentMemoryOf, rlRowReadHtml, apSetTab, cuSelectParty */
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
        the list, every card offers the door to the full report
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
   STAGE 5 — A WATCH ON AN ANSWER
     5a a company fact's card offers "Tell me when a new contract answers at
        risk"; pressed, the watch is set and Discover tags it watched
     5b a new answer at risk fires it: it is on the bell's list in words that
        name the contract, the fact and the answer
     5c its press lands on the contract on Home's paper
   STAGE 6 — UNUSUAL FOR YOU
     6a DV-04's Dossier says, in its Jambo read card, that its liability cap
        stands apart from the other services contracts
     6b "Show the 3" lands on the Contracts list narrowed to those three
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
/* HATI_DV_ONLY=4 for one stage, or 4,5 for a few (a fault that only shows
   when a stage runs after another is reproduced without the whole run) */
const stage = n => !ONLY || ONLY.split(',').map(x => x.trim()).includes(String(n));
/* each stage starts on the Contracts list, nothing left open by the stage before */
async function fresh(page){ await page.evaluate(() => { try { if (document.querySelector('#modal-root [role="dialog"]')) closeModal(); } catch (_){ /* none open */ } }); return toList(page); }

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  /* the deep limiter counts REQUESTS, and a read of eleven contracts is now
     more than one (it goes in batches so it can be stopped); this check drives
     a dozen reads in a minute, which is not what the limit is there for */
  const h = await startHati({ AI_RATE_DEEP: '400' });
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
      const read = await until(page, () => document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)').length >= 11, null, 20000);
      const col = await page.evaluate(() => ({
        heads: [...document.querySelectorAll('.reg-table thead th')].map(th => th.textContent.trim()),
        cells: Object.fromEntries([...document.querySelectorAll('td.ac-cell')].map(td => [td.getAttribute('data-ac-cid'), { t: td.innerText.replace(/\s+/g, ' ').trim(), red: !!td.querySelector('.ac-ans.tone-ruby'), green: !!td.querySelector('.ac-ans.tone-green') }])),
        foot: (document.querySelector('#reg-showing') || {}).innerText || '' }));
      check('2b′ the column is named from the question', read && col.heads.some(x => /Liability cap/.test(x)), JSON.stringify(col.heads));
      const oneLine = ['DV-01', 'DV-03', 'DV-07'].every(id => col.cells[id] && !/“/.test(col.cells[id].t) && !/\n/.test(col.cells[id].t) && col.cells[id].t.length < 40);
      /* RE-POINTED (owner picked "Lights", 26 Oct 2026): one line per cell —
         the light and the short answer. The words it was read from are in the
         panel's reading of the chosen row, checked at 2h. */
      check('2c each cell is one line: a light and the answer, no quote fighting it', oneLine, JSON.stringify(col.cells['DV-01']));
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
      if (ONLY === '3'){ /* the column up, as stage 2 would have left it */
        const k = await page.evaluate(q => api('ai/column', 'POST', { question: q, name: '', ids: state.contracts.map(c => c.id) }), CAP_Q);
        await page.evaluate(id => { regState().ask = [id]; regRepaint(); return askColBring(id); }, k.ask.id);
      }
      /* ONLY WHAT YOU KEEP (the owner picked it, 26 Oct 2026): a question joins
         the team's list by ONE press on its card; until then it is answered,
         free to bring back, and out of the way behind the folded line. */
      const keepable = await until(page, () => !!document.querySelector('#ig-dock [data-ac-keep]'));
      await page.click('#ig-dock [data-ac-keep]');
      const keptNow = await until(page, () => !document.querySelector('#ig-dock [data-ac-col] [data-ac-keep]'));
      check('3a′ "Keep in Discover" puts the question on the team\'s list', keepable && keptNow);
      await page.evaluate(() => { regState().ask = []; regState().only = null; regRepaint(); });
      await page.evaluate(() => askColSummary(true).then(() => renderIntelDock()));
      const disc = await until(page, () => /Liability cap/.test((document.querySelector('#ig-dock #ac-disc') || {}).innerText || ''));
      const dt = await page.evaluate(() => (document.querySelector('#ig-dock #ac-disc') || {}).innerText || '');
      check('3a Discover stands in the panel beside the list: the kept question, counted, at risk said', disc && /Discover/.test(dt) && /2 at risk/.test(dt) && /Due diligence · 5 questions/.test(dt) && /Ask a new question/.test(dt), dt.replace(/\s+/g, ' ').slice(0, 300));
      await page.screenshot({ path: path.join(OUT, '3-discover.png') });
      /* a question nobody kept is not on the list; the folded line finds it,
         and from there it can be kept or deleted (owner, 26 Oct 2026) */
      await page.evaluate(() => api('ai/column', 'POST', { question: 'Which country\u2019s law governs this contract?', name: 'Governing law', ids: ['DV-01'] }));
      await page.evaluate(() => askColSummary(true).then(() => renderIntelDock()));
      const folded = await until(page, () => /other question/.test((document.querySelector('#ig-dock #ac-disc') || {}).innerText || ''));
      const noLaw = await page.evaluate(() => !/Governing law/.test((document.querySelector('#ig-dock #ac-disc') || {}).innerText || ''));
      check('3a″ a question nobody kept stays off the list, counted in one folded line', folded && noLaw,
        await page.evaluate(() => (document.querySelector('#ig-dock #ac-disc') || {}).innerText.replace(/\s+/g, ' ').slice(0, 200)));
      await page.click('#ig-dock [data-ac-disc-all="1"]');
      const shown = await until(page, () => /Governing law/.test((document.querySelector('#ig-dock #ac-disc') || {}).innerText || ''));
      const acts = await page.evaluate(() => { const r = [...document.querySelectorAll('#ig-dock .ac-disc-row')].find(x => /Governing law/.test(x.innerText));
        return r ? { keep: !!r.querySelector('[data-ac-keep]'), del: !!r.querySelector('[data-ac-del]') } : null; });
      check('3a‴ the folded line opens them, each with Keep and Delete', shown && acts && acts.keep && acts.del, JSON.stringify(acts));
      /* ON A SCREEN THAT CANNOT HOVER THEY SIMPLY STAND THERE (the owner's
         iPad). Keep and Delete rest until the pointer arrives, which on a
         finger-only screen never happens — so the quiet is kept behind
         (hover:hover), the house pattern the width grip already follows.
         Read off the live stylesheet, not the file: a rule moved out of its
         media block is the fault, wherever the bytes end up. */
      const hv = await page.evaluate(() => {
        for (const sh of document.styleSheets){
          let rules; try { rules = sh.cssRules; } catch (_) { continue; }
          for (const r of rules || []){
            if (!r.cssRules || !/hover\s*:\s*hover/.test(r.conditionText || '')) continue;
            for (const k of r.cssRules) if (/\.ac-disc-acts/.test(k.selectorText || '') && /opacity:\s*0/.test(k.style.cssText || '')) return true;
          }
        }
        return false;
      });
      check('3a⁗ on a screen that cannot hover, Keep and Delete simply stand there', hv);
      await page.click('#ig-dock [data-ac-disc-all="0"]');
      await until(page, () => !/Governing law/.test((document.querySelector('#ig-dock #ac-disc') || {}).innerText || ''));
      const c0 = h.ai.calls.length;
      await page.click('#ig-dock [data-ac-bring]');
      /* >= 10, not 11: a paper drawn from its template keeps no answer of its
         own (the server writes none), so DV-11 is read only where the drawing
         travelled with the ask — which stage 2 does and HATI_DV_ONLY=3 cannot */
      const up = await until(page, () => [...document.querySelectorAll('.reg-table thead th')].some(th => /Liability cap/.test(th.textContent)) && document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)').length >= 10);
      check('3b a press brings its column onto the list, no call', up && h.ai.calls.length === c0,
        JSON.stringify({ calls: h.ai.calls.length - c0, cells: await page.evaluate(() => document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)').length), heads: await page.evaluate(() => [...document.querySelectorAll('.reg-table thead th')].map(t => t.textContent.trim())) }));
      /* THE DOOR TO THE FULL REPORT IS ON EVERY COLUMN (owner, 26 Oct 2026:
         "when you have 3 columns or company facts that you run … you do not
         get the full report … They should all have the door to the full
         report"). Here one column stands on the list and no pack was run:
         red at the parent, where the door only appeared after a pack's read. */
      const door = await until(page, () => !!document.querySelector('#ig-dock [data-ac-col] [data-ac-table]'));
      check('3b′ a column asked on its own carries the door to the full report', door,
        await page.evaluate(() => ((document.querySelector('#ig-dock [data-ac-col]') || {}).innerText || '(no card)').replace(/\s+/g, ' ').slice(0, 220)));
      await page.click('#ig-dock [data-ac-col] [data-ac-table]');
      const solo = await until(page, () => !!document.querySelector('#ac-table-page .ac-tt-table'));
      const soloCols = await page.evaluate(() => ({
        cols: document.querySelectorAll('#ac-table-page thead th').length,
        head: [...document.querySelectorAll('#ac-table-page thead th')].map(t => t.textContent.trim()).join(' | '),
        rows: document.querySelectorAll('#ac-table-page tbody tr').length }));
      check('3b″ it opens over the column in play, every contract under it', solo && soloCols.cols === 2 && /Liability cap/.test(soloCols.head) && soloCols.rows >= 10, JSON.stringify(soloCols));
      await page.click('#ac-tt-back');
      await until(page, () => !document.querySelector('#ac-table-page'));
      await page.click('#ig-dock [data-ac-pack]');
      await until(page, () => !!document.querySelector('#ig-dock [data-ac-pack-form]'));
      const pf = await page.evaluate(() => (document.querySelector('#ig-dock [data-ac-pack-form]') || {}).innerText || '');
      check('3c the pack opens in the same form: five questions, one read each against five apart', ['Notice to end', 'Liability cap', 'Governing law', 'Auto-renewal', 'Personal data'].every(n => pf.includes(n)) && /about 11 Jambo calls/.test(pf) && /55 Jambo calls/.test(pf), pf.replace(/\s+/g, ' ').slice(0, 400));
      await page.screenshot({ path: path.join(OUT, '3-pack-form.png') });
      /* CHOOSE WHICH OF THE PACK TO RUN (owner, 26 Oct 2026) */
      const ticks = await page.evaluate(() => document.querySelectorAll('#ig-dock [data-ac-pick]').length);
      await page.uncheck('#ig-dock [data-ac-pick="4"]');
      await page.uncheck('#ig-dock [data-ac-pick="3"]');
      const picked = await until(page, () => /3 of 5 chosen/.test((document.querySelector('#ig-dock [data-ac-pack-form]') || {}).innerText || ''));
      check('3c′ each question has a tick: untick two and the count and the cost follow', ticks === 5 && picked,
        await page.evaluate(() => (document.querySelector('#ig-dock [data-ac-pack-form]') || {}).innerText.replace(/\s+/g, ' ').slice(0, 220)));
      await page.check('#ig-dock [data-ac-pick="3"]');
      await page.check('#ig-dock [data-ac-pick="4"]');
      await until(page, () => /5 of 5 chosen/.test((document.querySelector('#ig-dock [data-ac-pack-form]') || {}).innerText || ''));
      const c1 = h.ai.calls.length;
      await page.click('#ig-dock [data-ac-ask]');
      const three = await until(page, () => document.querySelectorAll('.reg-table thead th.ac-th').length === 3 && !!document.querySelector('#ig-dock [data-ac-table]'), null, 20000);
      const spent = h.ai.calls.length - c1;
      const heads = await page.evaluate(() => [...document.querySelectorAll('.reg-table thead th.ac-th')].map(th => th.textContent.trim()));
      check('3d asked: one call per contract read (11), three columns stand, the full report offered', three && spent <= 11 && heads.length === 3, JSON.stringify({ spent, heads }));
      await page.click('#ig-dock [data-ac-table]');
      const pg = await until(page, () => !!document.querySelector('#ac-table-page'));
      const tt = await page.evaluate(() => {
        const first = document.querySelector('#ac-table-page tbody th.ac-tt-a');
        return { cols: document.querySelectorAll('#ac-table-page thead th').length, rows: document.querySelectorAll('#ac-table-page tbody tr').length,
          copy: !!document.querySelector('#ac-tt-copy'), wide: document.documentElement.scrollWidth > window.innerWidth,
          card: !!document.querySelector('#ac-table-page .ac-tt-card'), sub: (document.querySelector('.ac-tt-sub') || {}).innerText || '',
          stuck: first ? getComputedStyle(first).position : '', legend: (document.querySelector('.ac-tt-foot') || {}).innerText || '',
          risk: !!document.querySelector('#ac-tt-risk'), heads: (document.querySelector('#ac-table-page thead') || {}).innerText || '' };
      });
      check('3e the whole table is a page: five answer columns, every contract, Copy the table, nothing spilling the window', pg && tt.cols === 6 && tt.rows === 11 && tt.copy && !tt.wide, JSON.stringify({ cols: tt.cols, rows: tt.rows, copy: tt.copy, wide: tt.wide }));
      /* THE LEDGER (the owner picked it, 26 Oct 2026) */
      check('3e′ one framed card: what was read said under the title, the contract column standing still, the legend in the foot',
        tt.card && /answers/.test(tt.sub) && /read/.test(tt.sub) && tt.stuck === 'sticky' && /inside our rule/.test(tt.legend),
        JSON.stringify({ card: tt.card, sub: tt.sub.replace(/\s+/g, ' '), stuck: tt.stuck }));
      check('3e″ the at-risk count stands in the head of the column it belongs to, and Only at risk narrows the table',
        /at risk/.test(tt.heads) && tt.risk, tt.heads.replace(/\s+/g, ' ').slice(0, 160));
      if (tt.risk){
        await page.click('#ac-tt-risk');
        const fewer = await until(page, () => document.querySelectorAll('#ac-table-page tbody tr').length < 11);
        check('3e‴ pressed, only the rows at risk stand; pressed again they all come back', fewer && await (async () => {
          await page.click('#ac-tt-risk');
          return until(page, () => document.querySelectorAll('#ac-table-page tbody tr').length === 11);
        })());
      }
      await page.screenshot({ path: path.join(OUT, '3-table.png') });
      await page.click('#ac-tt-back');
      check('3f Back to the list closes it', await until(page, () => !document.querySelector('#ac-table-page')));
    }

    if (stage(4)){
      await fresh(page);
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
      /* a second question, kept but not a fact: it belongs under "Add a fact",
         never in the table of facts (the owner's note 5) */
      const nk = await page.evaluate(() => api('ai/column', 'POST', { question: 'How much notice does each side need to end the contract early?', name: 'Notice to end', ids: ['DV-01'] }));
      await page.evaluate(id => api('columns/' + id + '/keep', 'POST', { kept: true }), nk.ask.id);
      /* 4b the Settings panel */
      await page.evaluate(() => openSettingsAt('platform', 'facts'));
      const panel = await until(page, () => /Governing law/.test((document.querySelector('#fa-panel') || {}).innerText || ''));
      const pt = await page.evaluate(() => (document.querySelector('#fa-panel') || {}).innerText || '');
      const sw = await page.evaluate(id => { const b = document.querySelector(`[data-fa-tog="${id}"]`); return b ? b.getAttribute('aria-pressed') : null; }, lk.ask.id);
      check('4b Settings › Company facts lists the kept questions, rules and switches, and the cost per arrival', panel && /Our rule/.test(pt) && sw === 'true' && /every contract that arrives costs about 1 Jambo call/.test(pt), pt.replace(/\s+/g, ' ').slice(0, 300));
      /* EVERY KEPT QUESTION STANDS HERE, EACH WITH ITS SWITCH (owner, 26 Oct
         2026: "you are hiding the 5 company facts which were there before …
         They should be there and you can toggle them on or off and also add
         new ones if you would like"). This REVERSES the facts-only page of
         earlier the same day: that one listed a question only once it was
         already on, so the page read as empty with nothing to press. What the
         page must never list is a counting question — and it cannot, because
         one never becomes a column at all (4f, 4g), which is the owner's
         note 5 of 26 Oct still holding. */
      const only = await page.evaluate(ids => {
        const t = document.querySelector('#fa-panel');
        const tog = id => { const b = t && t.querySelector(`[data-fa-tog="${id}"]`); return b ? b.getAttribute('aria-pressed') : null; };
        return { rows: t ? t.querySelectorAll('tbody tr').length : -1, tog: t ? t.querySelectorAll('[data-fa-tog]').length : -1,
          onSw: tog(ids.on), offSw: tog(ids.off), go: t ? t.querySelectorAll('[data-fa-go]').length : -1,
          txt: t ? t.innerText.replace(/\s+/g, ' ') : '' };
      }, { on: lk.ask.id, off: nk.ask.id });
      check('4b′ every kept question stands on the page, the one that is on switched on and the other off',
        only.rows === 2 && only.tog === 2 && only.onSw === 'true' && only.offSw === 'false'
        && /Governing law/.test(only.txt) && /Notice to end/.test(only.txt)
        && /Read on arrival/.test(only.txt), JSON.stringify(only));
      check('4b″ a new one is added through the one door, the Contracts list — no second way in',
        only.go === 1 && /Add a fact/.test(only.txt) && /kept in Discover/.test(only.txt), JSON.stringify(only));
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
      /* 4f a counting question is nobody's column: the list's box hands it to
         Jambo, and the server refuses it even when asked outright */
      const took = await page.evaluate(() => askColTakes('contracts', 'How many contracts have 30 day payment terms?'));
      const wording = await page.evaluate(() => askColTakes('contracts', 'How much notice does each side need to end the contract early?'));
      check('4f the list\'s box: a counting question is not a column, a wording question is', took === false && wording === true, JSON.stringify({ took, wording }));
      await page.evaluate(() => askColClose());   /* the wording question above OPENED the form: shut it behind us */
      const refused = await page.evaluate(() => api('ai/column', 'POST', { question: 'How many contracts have risks', ids: ['DV-01'] }).then(() => null, e => String(e && e.message)));
      const facts2 = await W.admin.json('/api/columns/summary?all=1');
      check('4g asked outright, the server turns it away, so it is never kept and can never be a fact',
        /not about the wording/.test(refused || '') && !facts2.asks.some(a => /how many/i.test(a.question)), String(refused).slice(0, 120));
      await page.screenshot({ path: path.join(OUT, '4-key-terms.png') });
    }

    if (stage(5)){
      await fresh(page);
      /* the cap question as a company fact, with its rule, its column up (asked of all but DV-05, left to arrive) */
      /* its own wording of the cap question, so nothing an earlier stage read is kept for DV-05; the rule and the
         fact written FIRST (a new rule lets go of the answers kept without it), then asked of all but DV-05 */
      const Q5 = 'Is our liability capped at all, and if so at what amount?';
      const k5 = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: Q5, name: 'Liability cap', ids: ['DV-11'] } });
      await W.admin.json('/api/columns/' + k5.ask.id, { method: 'PUT', body: { fact: true, rule: 'Capped at no more than one year of fees' } });
      const ck = await page.evaluate(q => api('ai/column', 'POST', { question: q, name: 'Liability cap', ids: state.contracts.map(c => c.id).filter(id => id !== 'DV-05'),
        texts: { 'DV-11': contractPlainText(getContract('DV-11')) } }), Q5);
      await page.evaluate(id => { regState().ask = [id]; regState().only = null; regRepaint(); return askColSummary(true).then(() => askColBring(id)); }, ck.ask.id);
      await until(page, () => /answered/.test((document.querySelector('#ig-dock [data-ac-col]') || {}).innerText || ''), null, 10000);
      await until(page, () => !!document.querySelector('#ig-dock [data-ac-watch]'), null, 10000);
      const wc = await page.evaluate(() => (document.querySelector('#ig-dock [data-ac-watch]') || {}).textContent || '');
      check('5a′ a company fact\'s card offers the watch', /Tell me when a new contract answers at risk/.test(wc),
        wc || await page.evaluate(() => (document.querySelector('#ig-dock') || {}).innerText.replace(/\s+/g, ' ').slice(0, 400)));
      await page.click('#ig-dock [data-ac-watch]');
      const set = await until(page, () => !!document.querySelector('#ig-dock [data-ac-unwatch]'));
      await page.evaluate(() => { regState().ask = []; regRepaint(); renderIntelDock(); });
      const tagged = await until(page, () => /watched/.test((document.querySelector('#ig-dock #ac-disc') || {}).innerText || ''));
      check('5a pressed, the watch is set and Discover tags it watched', set && tagged);
      /* DV-05 arrives and answers outside the rule; the sweep runs */
      await page.evaluate(() => askColFactsArrive(getContract('DV-05')));
      for (let i = 0; i < 40; i++){ const f = await W.admin.json('/api/columns/facts/DV-05'); if (f.facts.some(x => x.answer)) break; await new Promise(r => setTimeout(r, 100)); }
      await W.admin.json('/api/watches/run', { method: 'POST', body: {} });
      await page.evaluate(() => watchLoad(true));
      const fired = await page.evaluate(() => watchesFired().map(w => watchFiredWords(w)));
      check('5b a new answer at risk fires it, in words naming the contract, the fact and the answer', fired.length === 1 && /DV-05/.test(fired[0]) && /Liability cap/.test(fired[0]) && /at risk/.test(fired[0]) && /Not capped/.test(fired[0]), JSON.stringify(fired));
      await page.evaluate(() => watchGo(watchesFired()[0].id));
      const landed = await until(page, () => typeof pdContract === 'function' && pdContract() && pdContract().id === 'DV-05', null, 10000);
      check('5c its press lands on the contract on Home\'s paper', landed);
      await page.screenshot({ path: path.join(OUT, '5-landed.png') });
    }

    if (stage(6)){
      await fresh(page);
      /* asked as the page asks it: DV-11's paper is drawn from its template, so its drawn wording travels (contractPlainText) */
      const ck = await page.evaluate(q => api('ai/column', 'POST', { question: q, name: 'Liability cap', ids: state.contracts.map(c => c.id),
        texts: { 'DV-11': contractPlainText(getContract('DV-11')) } }), CAP_Q);
      await W.admin.json('/api/columns/' + ck.ask.id, { method: 'PUT', body: { fact: true } });
      await page.evaluate(() => regOpenContract('DV-04'));
      await until(page, () => typeof pdContract === 'function' && pdContract() && pdContract().id === 'DV-04', null, 10000);
      const said = await until(page, () => /Unusual for you/.test((document.querySelector('[data-ac-odd-for="DV-04"]') || {}).innerText || ''), null, 10000);
      const line = await page.evaluate(() => (document.querySelector('[data-ac-odd-for="DV-04"]') || {}).innerText || '');
      check('6a DV-04\'s Dossier says its cap stands apart from the other services contracts', said && /Liability cap here is “Not capped”/.test(line) && /3 of your other 3/.test(line), line.replace(/\s+/g, ' '));
      await page.screenshot({ path: path.join(OUT, '6-dossier.png') });
      await page.click('[data-ac-odd-show]');
      const three = await until(page, () => document.querySelectorAll('#reg-tbody tr[data-row]').length === 3, null, 10000);
      const rows = await page.evaluate(() => [...document.querySelectorAll('#reg-tbody tr[data-row]')].map(tr => tr.getAttribute('data-row')).sort());
      check('6b "Show the 3" lands on the list narrowed to those three', three && rows.join() === 'DV-03,DV-10,DV-11', JSON.stringify(rows));
    }

    if (stage(7)){
      await fresh(page);
      const m = await page.evaluate(() => {
        const ch = (o) => ({ id: o.id, clauseId: 'c1', clauseLabel: 'Termination', oldText: 'on ninety (90) days written notice', newText: o.newText,
          status: o.status, authorSide: 'counterparty', author: 'Them', createdAt: '2026-03-01T00:00:00.000Z', updatedAt: '2026-03-02T00:00:00.000Z' });
        const a = getContract('DV-01'), b = getContract('DV-02');
        const keepA = a.changes, keepB = b.changes;
        a.changes = [ch({ id: 'MEM-NOW', status: 'pending', newText: 'on thirty (30) days written notice' })];
        b.changes = [ch({ id: 'MEM-OLD', status: 'accepted', newText: 'on sixty (60) days written notice' })];
        try {
          return { mem: precedentMemoryOf(a, a.changes[0]), ours: rlRowReadHtml(a, a.changes[0], 'owner'), theirs: rlRowReadHtml(a, a.changes[0], 'counterparty') };
        } finally { a.changes = keepA; b.changes = keepB; }
      });
      const div = await page.evaluate(h => { const d = document.createElement('div'); d.innerHTML = h; return d.innerText; }, m.ours || '');
      check('7a their new ask draws the memory line under the verdict, naming Siginon', !!(m.mem && m.mem.withThem) && /Siginon/.test(div) && /data-rl-row-memory/.test(m.ours || ''), JSON.stringify({ mem: m.mem && m.mem.line, div }));
      check('7b the counterparty\'s seat draws no memory', !/data-rl-row-memory/.test(m.theirs || ''));
    }

    if (stage(8)){
      await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r-dv', name: 'Finance director', order: 1,
        cond: { type: 'value', op: '>=', value: 1000000 }, approver: { kind: 'role', role: 'admin' } }] } });
      await W.admin.json('/api/contracts/DV-AP1', { method: 'PUT', body: { baseVersion: 0, contract: {
        id: 'DV-AP1', name: 'Managed IT Services', counterparty: 'Equity Bank', folder: 'sales', status: 'Under Review', value: 145000000, expiry: '2028-01-31',
        valueType: 'standard', template: 'RM', fields: {}, metadata: { value: 145000000, currency: 'KES' }, comments: [], audit: [], signatures: [], format: 'text',
        redlineText: 'MANAGED IT SERVICES\n\n1. Liability\nNothing in this Agreement limits the Supplier\'s liability arising from the Services.\n\n2. Term\nThis Agreement ends on 31 January 2028.' } } });
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.some(c => c.id === 'DV-AP1'), null, 15000);
      await page.evaluate(() => { apSetTab('approvals'); setView('approvals'); });
      const listed = await until(page, () => !!document.querySelector('[data-ap-row="DV-AP1"]'), null, 10000);
      if (listed) await page.click('[data-ap-row="DV-AP1"]');
      const card = await until(page, () => !!document.querySelector('#ins-panel [data-ap-what-for="DV-AP1"]'), null, 10000);
      const t = await page.evaluate(() => (document.querySelector('#ins-panel [data-ap-what-for]') || {}).innerText || '');
      const above = await page.evaluate(() => { const a = document.querySelector('#ins-panel .ap-what'), b = [...document.querySelectorAll('#ins-panel *')].find(x => /^Why it waits$/.test((x.textContent || '').trim()));
        return !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)); });
      check('8a the panel says What you are approving above Why it waits: money, unchecked standards said, plain words offered', listed && card && above
        && /What you are approving/.test(t) && /KES/.test(t) && /2028-01-31/.test(t) && /not been checked/.test(t) && /Put it in plain words/.test(t), t.replace(/\s+/g, ' ').slice(0, 400));
      await page.screenshot({ path: path.join(OUT, '8-approvals.png') });
      const c0 = h.ai.calls.length;
      await page.click('#ins-panel [data-ap-what-brief]');
      /* RE-POINTED (the owner picked "Jambo's card", 26 Oct 2026): his words
         come back in HIS card — the one soft grey card on the panel, named for
         him — not as a paragraph among the facts, where it was missed. */
      const said = await until(page, () => !!document.querySelector('#ins-panel [data-ap-what-say]:not(.is-ask) .jb-say-b'), null, 10000);
      const say = await page.evaluate(() => { const el = document.querySelector('#ins-panel [data-ap-what-say]');
        if (!el) return null; const cs = getComputedStyle(el);
        return { cls: el.className, head: (el.querySelector('.jb-say-h') || {}).innerText || '', fill: cs.backgroundColor, r: cs.borderRadius, pad: cs.padding }; });
      check('8b "Put it in plain words" spends one call and the brief is said there', said && h.ai.calls.length - c0 === 1, String(h.ai.calls.length - c0));
      check('8b′ it comes back in Jambo\'s own card: his name on it, the soft grey fill, 18px corners, 16px inside',
        !!say && /jb-say/.test(say.cls) && /Jambo/.test(say.head) && /In plain words/.test(say.head)
        && say.fill !== 'rgba(0, 0, 0, 0)' && parseFloat(say.r) >= 16 && parseFloat(say.pad) >= 16, JSON.stringify(say));
      check('8c Approve and Refuse are where they were', await page.evaluate(() => !!document.querySelector('#ins-panel [data-ins-act="approve"]') && !!document.querySelector('#ins-panel [data-ins-act="refuse"]')));
    }

    if (stage(9)){
      await fresh(page);
      await page.evaluate(() => cuSelectParty('siginon group'));
      const sec = await until(page, () => /Before the call/.test((document.querySelector('#ins-panel') || {}).innerText || '') && !!document.querySelector('#ins-panel [data-cu-brief]'), null, 10000);
      const t = await page.evaluate(() => ((document.querySelector('#ins-panel [data-cu-brief-for]') || {}).innerText || ''));
      check('9a the party\'s panel says Before the call and offers the brief for one call', sec && /How they negotiate|No settled rounds/.test(t) && /1 Jambo call/.test(t), t.replace(/\s+/g, ' ').slice(0, 300));
      await page.screenshot({ path: path.join(OUT, '9-party.png') });
      const c0 = h.ai.calls.length;
      await page.click('#ins-panel [data-cu-brief]');
      const said = await until(page, () => !!document.querySelector('#ins-panel .cu-br-text'), null, 10000);
      const t2 = await page.evaluate(() => ((document.querySelector('#ins-panel [data-cu-brief-for]') || {}).innerText || ''));
      check('9b pressed: one call, the brief said, the unfound figure named', said && h.ai.calls.length - c0 === 1 && /2 agreements/.test(t2) && /check them: 999/.test(t2), t2.replace(/\s+/g, ' ').slice(0, 300));
      const psay = await page.evaluate(() => { const el = document.querySelector('#ins-panel [data-cu-br-say]');
        if (!el) return null; const cs = getComputedStyle(el);
        return { cls: el.className, head: (el.querySelector('.jb-say-h') || {}).innerText || '', fill: cs.backgroundColor, r: cs.borderRadius }; });
      check('9b\u2032 the two minutes wear the same card as the approver\'s brief (one builder, both panels)',
        !!psay && /jb-say/.test(psay.cls) && /The two minutes/.test(psay.head) && psay.fill !== 'rgba(0, 0, 0, 0)' && parseFloat(psay.r) >= 16, JSON.stringify(psay));
    }
    /* ============ 11. STOP WHILE HE READS (the owner's note 1, 26 Oct 2026) ============ */
    if (stage(11)){
      await fresh(page);
      /* every contract shown: an earlier stage may have narrowed the list, and
         Stop can only be pressed where there is a batch still to come */
      await page.evaluate(() => { regState().only = null; regState().ask = []; regState().page = 1; regRepaint(); });
      await until(page, () => document.querySelectorAll('#reg-tbody tr[data-row]').length >= 11);
      const shownN = await page.evaluate(() => document.querySelectorAll('#reg-tbody tr[data-row]').length);
      h.ai.slow(500);                      /* so the read lasts long enough to stop */
      const c0 = h.ai.calls.length;
      /* a question nobody has asked yet: a kept answer costs no call, so a
         cached question would be read before the check could press Stop */
      await page.evaluate(() => askColOpen({ question: 'Does this agreement name a court or an arbitrator for disputes?', name: 'Disputes' }));
      await until(page, () => !!document.querySelector('#ac-q'));
      await page.click('#ig-dock [data-ac-ask]');
      const counting = await until(page, () => /answered/.test((document.querySelector('#ig-dock .ac-busy') || {}).innerText || ''), null, 20000);
      const line = await page.evaluate(() => (document.querySelector('#ig-dock .ac-busy') || {}).innerText || '');
      const bar = await page.evaluate(() => { const i = document.querySelector('#ig-dock .ac-prog>i'); return i ? i.style.width : ''; });
      check('11a while he reads, the line counts what has landed and a bar follows it', counting && line.includes(`Reading ${shownN} contracts`) && /\d+ answered/.test(line) && /%/.test(bar), JSON.stringify({ line: line.replace(/\s+/g, ' '), bar, shownN }));
      await page.screenshot({ path: path.join(OUT, '11-reading.png') });
      await page.click('#ig-dock [data-ac-stop]');
      const stopped = await until(page, () => !!document.querySelector('#ig-dock #ac-stopped'), null, 20000);
      const st = await page.evaluate(() => (document.querySelector('#ig-dock #ac-stopped') || {}).innerText || '');
      const spent = h.ai.calls.length - c0;
      const kept = await page.evaluate(() => document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)').length);
      check('11b Stop: it says what was read and kept, what was not, and offers the rest with its cost',
        stopped && /read and kept/.test(st) && /not read/.test(st) && /Carry on/.test(st), st.replace(/\s+/g, ' ').slice(0, 220));
      check('11c nothing already read is lost, and no more was read after the press', kept > 0 && kept === spent && spent < shownN, JSON.stringify({ kept, spent, shownN }));
      await page.screenshot({ path: path.join(OUT, '11-stopped.png') });
      h.ai.slow(0);
      await page.click('#ig-dock [data-ac-carry]');
      const done = await until(page, n => !document.querySelector('#ig-dock #ac-stopped') && document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)').length >= n - 1, shownN, 30000);
      const all = h.ai.calls.length - c0;
      const cells = await page.evaluate(() => document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)').length);
      check('11d Carry on reads only the rest: every contract answered, each read once', done && all === cells, JSON.stringify({ calls: all, cells, shownN }));
    }
  } catch (e){ check('the run itself', false, String(e && e.stack || e)); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
