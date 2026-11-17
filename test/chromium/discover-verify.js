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
/* the column card's More… list, opened if it is shut (the column card, the Legora way, 29 Oct 2026) */
let page = null;
const openMore = async () => { if (page && !await page.$('#ig-dock .ac-col-more')){ const m = await page.$('#ig-dock [data-ac-more]'); if (m) await m.click(); await page.waitForTimeout(150); } };
const CAP_Q = 'Is our liability capped, and at what?';

async function signIn(page, base){
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  /* and the signed-in person (the race adapt-filters had): Ask a column is an editor's, so the form waits on who is signed in */
  await until(page, () => typeof window.setView === 'function' && window.state && Array.isArray(state.contracts) && state.contracts.length > 0
    && typeof window.currentUser === 'function' && !!window.currentUser(), null, 15000);
}
async function toList(page){
  await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
  /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the Contracts place opens on its Folders; the head's
     List pill is the way to the list */
  if (await until(page, () => !!document.querySelector('[data-ctf-show="list"]')) && !(await page.$('#reg-tbody tr[data-row]'))) await page.click('[data-ctf-show="list"]').catch(() => {});
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
    page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => errors.push(String(e)));
    await signIn(page, h.base);
    check('0 the Contracts list is up', await toList(page));

    /* the company's rule on the cap question, written by the admin (kept by asking it of the empty contract: free) */
    const k = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP_Q, name: 'Liability cap', ids: ['DV-11'] } });
    await W.admin.json('/api/columns/' + k.ask.id, { method: 'PUT', body: { rule: 'Capped at no more than one year of fees' } });

    if (stage(2)){
      /* 2a RE-POINTED 29 Oct 2026 (round 1 "The Legora way", owner's yes): the list's own box is a quiet filter and hands
         nothing on; the form's door is "Ask a column" — opened, the question typed, nothing read */
      const calls0 = h.ai.calls.length;
      /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the list's head carries no "Ask a column" (owner,
         15 Nov 2026: no Discover button on Contracts); the form is the one the Reads and Discover doors open on Contracts
         (rdOnContracts → askColOpen), drawn in Jambo's panel (askColFormDrawnHtml) */
      await page.evaluate(() => askColOpen());
      await until(page, () => !!document.querySelector('#ig-dock #ac-form #ac-q'));
      await page.fill('#ig-dock #ac-form #ac-q', CAP_Q);
      const filled = await until(page, () => { const q = document.querySelector('#ig-dock #ac-form #ac-q'); return !!q && /liability capped/.test(q.value) && !!document.querySelector('#ac-named, #ac-name'); });
      check('2a Ask a column opens the form; the question typed there, nothing read', filled && h.ai.calls.length === calls0);
      /* 2b the name, said */ /* RE-POINTED 28 Oct 2026 (round 2 of the review): the form has one box; the name is said under it, with Change */
      /* RE-POINTED 16 Nov 2026 (#762): the drawn form gives the column's name its own box under the question, filled from it */
      await until(page, () => /Liability capped/.test((document.querySelector('#ac-name') || {}).value || ''), null, 3000);
      const hint = await page.evaluate(() => (document.querySelector('#ac-name') || {}).value || '');
      check('2b the form says the column\'s name under the question, where it can be changed', hint === 'Liability capped', hint);
      await page.click('[data-ac-ask]');
      /* RE-POINTED 28 Oct 2026 (EACH ANSWER THE MOMENT IT IS READ): the cells fill while the desk still stands,
         so the card is read once the read has ended */
      const read = await until(page, () => document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)').length >= 11 && !document.querySelector('[data-ac-stop]') && !!document.querySelector('#ig-dock [data-ac-col]'), null, 25000);
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
      /* RE-POINTED 16 Nov 2026 (#762): a finished read lands on the column's short drawn card; its "‹ Overview" is the step
         to the column card with Show · Draw it · Copy the table */
      if (await page.$('#ig-dock [data-ac-colback]')) { await page.click('#ig-dock [data-ac-colback]').catch(() => {}); await until(page, () => !document.querySelector('#ig-dock [data-ac-colback]'), null, 4000); }
      const card = await page.evaluate(() => (document.querySelector('#ig-dock [data-ac-col]') || {}).innerText || '');
      check('2f′ the card offers Show the 2 at risk · Draw it · Copy the table', /Show the 2 at risk/.test(card) && /Draw it/.test(card) && /Copy the table/.test(card), card.slice(0, 300));
      const callsDraw = h.ai.calls.length;
      await page.click('[data-ac-draw]');
      /* RE-POINTED 29 Oct 2026 (the column card, the Legora way): Draw it draws one bar per answer, in its colour */
      const bars = await until(page, () => document.querySelectorAll('#ig-dock .ac-draw .ac-bar').length === 2);
      const drawn = await page.evaluate(() => [...document.querySelectorAll('#ig-dock .ac-draw .ac-bar')].map(b => b.innerText.replace(/\s+/g, ' ').trim()));
      check('2g Draw it draws the counts in the card (9 inside, 2 outside: DV-11 has its template paper from its template), no call spent', bars && drawn.some(t => /^Not capped 2$/.test(t)) && drawn.some(t => /^30 days 9$/.test(t)) && h.ai.calls.length === callsDraw, JSON.stringify(drawn));
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
      /* RETIRED 16 Nov 2026 (#762): 3a, 3a″, 3a‴, 3a⁗, 3b–3f — "Discover beside the list" (#ac-disc, its kept questions,
         packs and the whole-table page opened from it) is the old look's only: askColDiscoverHtml returns nothing in the new
         look, which has its Discover page (dsnRender), pinned by discover-page-verify, read-table-verify,
         reads-and-columns-as-drawn-verify and reads-new-look-fixes-verify */
    }

    if (stage(4)){
      await fresh(page);
      const LAW = "Which country's law governs this contract?";
      /* a column of the law question, up on the list (kept by asking it of the empty contract: free) */
      /* asked of every contract but DV-07, which is left to arrive in 4d */
      const lk = await page.evaluate(q => api('ai/column', 'POST', { question: q, name: 'Governing law', ids: state.contracts.map(c => c.id).filter(id => id !== 'DV-07') }), LAW);
      await page.evaluate(id => { regState().ask = [id]; regState().only = null; regRepaint(); }, lk.ask.id);
      await page.evaluate(id => askColBring(id), lk.ask.id);
      /* RE-POINTED 29 Oct 2026 (the column card, the Legora way): Keep as a company fact and the watch stand under More… */
      await until(page, () => !!document.querySelector('#ig-dock [data-ac-fact], #ig-dock [data-ac-more]'));
      await openMore();
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
      /* RE-POINTED (owner, 8 Nov 2026: "remove all information related to jambo calls"): no cost is said */ check('4b Settings › Company facts lists the kept questions, rules and switches, no cost per arrival', panel && /Our rule/.test(pt) && sw === 'true' && !/\bJambo calls?\b|\b\d+ calls?\b|\bone call\b|\bfree\b|costs? nothing|\bcosts about\b/i.test(pt), pt.replace(/\s+/g, ' ').slice(0, 300));
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
      /* HOW MANY kept questions there are depends on which stages ran before
         this one (stage 3 keeps a pack's five), so the check is on the RULE,
         not on a number: every kept question has a row and a switch, and the
         two this stage knows about are switched the way it left them. */
      check('4b′ every kept question stands on the page, the one that is on switched on and the other off',
        only.rows >= 2 && only.tog === only.rows && only.onSw === 'true' && only.offSw === 'false'
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
      await until(page, () => /are read/.test((document.querySelector('#ig-dock [data-ac-col]') || {}).innerText || ''), null, 10000);
      await until(page, () => !!document.querySelector('#ig-dock [data-ac-watch], #ig-dock [data-ac-more]'), null, 10000);
      await openMore();
      await until(page, () => !!document.querySelector('#ig-dock [data-ac-watch]'), null, 10000);
      const wc = await page.evaluate(() => (document.querySelector('#ig-dock [data-ac-watch]') || {}).textContent || '');
      check('5a′ a company fact\'s card offers the watch', /Tell me when a new contract answers at risk/.test(wc),
        wc || await page.evaluate(() => (document.querySelector('#ig-dock') || {}).innerText.replace(/\s+/g, ' ').slice(0, 400)));
      await page.click('#ig-dock [data-ac-watch]');
      const set = await until(page, () => !!document.querySelector('#ig-dock [data-ac-unwatch]'));
      /* RE-POINTED 16 Nov 2026 (#762): the "watched" tag stood in Discover beside the list (#ac-disc), which the new look does
         not draw (askColDiscoverHtml returns nothing); the watch itself is asked as before: set, and Unwatch offered */
      check('5a pressed, the watch is set', set);
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
      await page.click('[data-ac-odd-show]', { timeout: 5000 }).catch(() => {});   /* a door not drawn REPORTS (6b), the run goes on */
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

    /* RETIRED 16 Nov 2026 (#762): stage 8 (8a, 8b, 8b′, 8c) — the old Approvals inspector panel's "What you are approving"
       with its "Put it in plain words" press (#ins-panel [data-ap-what-for]); the new look's chosen approval's panel is the
       five parts (apnLeadFiveHtml: no button, Approve/Decline on the row), pinned by approve-from-the-list-verify and
       approve-on-row-verify */

    /* RETIRED 17 Nov 2026 (#762, owner's ruling 4): stage 9 (9a, 9b, 9b′) — the party's panel "Before the call" with its
       two-minute brief ([data-cu-brief]); the new look's Parties panel has no Before the call brief, and the owner ruled
       it stays gone */
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
      /* RE-POINTED 28 Oct 2026 (THE READING DESK): the foot line counts done · at risk so far · calls */
      const counting = await until(page, () => /\d+ done/.test((document.querySelector('#ig-dock .ac-busy') || {}).innerText || ''), null, 20000);
      const line = await page.evaluate(() => (document.querySelector('#ig-dock .ac-busy') || {}).innerText || '');
      const bar = await page.evaluate(() => { const i = document.querySelector('#ig-dock .ac-prog>i'); return i ? i.style.width : ''; });
      /* RE-POINTED 28 Oct 2026 (round 2 of the review): one box, the name said; the button says what it spends; the card a read leaves heads the column's card, with no bar */
      /* RE-POINTED (owner, 8 Nov 2026: "remove all information related to jambo calls"): no cost is said */ check('11a while he reads, the line counts what has landed (no bar: the counts say how far), no cost', counting && line.includes(`Reading ${shownN} contracts`) && /\d+ done/.test(line) && !/\bJambo calls?\b|\b\d+ calls?\b|\bone call\b|\bfree\b|costs? nothing|\bcosts about\b/i.test(line) && bar === '', JSON.stringify({ line: line.replace(/\s+/g, ' '), bar, shownN }));
      await page.screenshot({ path: path.join(OUT, '11-reading.png') });
      await page.click('#ig-dock [data-ac-stop]');
      /* RE-POINTED 29 Oct 2026 (the column card, the Legora way): the stop is said in the question's own card, whose one button carries on */
      const stopped = await until(page, () => /You stopped at/.test((document.querySelector('#ig-dock .ac-col.is-open') || {}).innerText || ''), null, 20000);
      const st = await page.evaluate(() => (document.querySelector('#ig-dock .ac-col.is-open') || {}).innerText || '');
      const spent = h.ai.calls.length - c0;
      const kept = await page.evaluate(() => document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)').length);
      /* RE-POINTED (owner, 8 Nov 2026: "remove all information related to jambo calls"): no cost is said */ check('11b Stop: it says what was read and kept, what was not, and offers the rest, no cost',
        stopped && /You stopped at \d+ of \d+\. \d+ of \d+ are read, \d+ to go\./.test(st) && /Carry on · \d+ contracts?/.test(st) && !/\bJambo calls?\b|\b\d+ calls?\b|\bone call\b|\bfree\b|costs? nothing|\bcosts about\b/i.test(st), st.replace(/\s+/g, ' ').slice(0, 220));
      /* RE-POINTED 28 Oct 2026 (STOP MEANS STOP): Stop ends the stream at once, so a batch can be cut midway; the
         reads already with Jambo finish on the server and are kept, so what is shown is at most what was spent */
      check('11c nothing already read is lost, and no more was read after the press', kept <= spent && spent < shownN, JSON.stringify({ kept, spent, shownN }));
      await page.screenshot({ path: path.join(OUT, '11-stopped.png') });
      h.ai.slow(0);
      await page.click('#ig-dock [data-ac-carry]');
      const done = await until(page, n => !AC.busy && !document.querySelector('#ig-dock #ac-stopped') && document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)').length >= n - 1, shownN, 30000);
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
