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
   STAGE 6 — UNUSUAL FOR YOU (6a/6b RETIRED 17 Nov 2026, #762, round 6 default 11: not on the new Dossier)
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

    /* RETIRED 22 Nov 2026 (owner, 22 Nov 2026: "There is not asking a column again only the features related to discovery"): stage 2 (2a–2h: Ask a column's form, the answer column on Contracts, its card's Draw it,
       Show the N at risk and the why card) and stage 3 (3a′: "Keep in Discover" on the column's card). The form, the
       column and the card are deleted; a question is asked, read, kept and shown on Discover (discover-page-verify,
       reads-and-columns-as-drawn-verify 6) */

    if (stage(4)){
      await fresh(page);
      const LAW = "Which country's law governs this contract?";
      /* a column of the law question, up on the list (kept by asking it of the empty contract: free) */
      /* asked of every contract but DV-07, which is left to arrive in 4d */
      const lk = await page.evaluate(q => api('ai/column', 'POST', { question: q, name: 'Governing law', ids: state.contracts.map(c => c.id).filter(id => id !== 'DV-07') }), LAW);
      /* RE-POINTED 22 Nov 2026 (owner, 22 Nov 2026: "There is not asking a column again only the features related to discovery"): 4a′ ("Keep as a company fact" on the column's card) RETIRED with the card; the fact
         is made as the card made it, by the server's own route */
      await page.evaluate(id => api('columns/' + id, 'PUT', { fact: true }), lk.ask.id);
      const isFact = (await W.admin.json('/api/columns/summary')).asks.find(a => a.id === lk.ask.id).fact;
      check('4a the question is a company fact', isFact === true);
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
      check('4b″ a new one is added through the one door, Discover — no second way in',
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
      /* RETIRED 22 Nov 2026 (owner, 22 Nov 2026: "There is not asking a column again only the features related to discovery"): 4f (the Contracts list's box handing a wording question to Ask a column's form,
         askColTakes) — the form is deleted; a counting question turned down on Discover is f1064 */
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
      /* RE-POINTED 22 Nov 2026 (owner, 22 Nov 2026: "There is not asking a column again only the features related to discovery"): 5a′ (the watch offered on a company fact's column card) RETIRED with the card; the
         watch is set as the card set it (watchCreate), and what it does when it fires is still checked (5b, 5c) */
      const set = await page.evaluate(id => askColSummary(true).then(() => watchCreate({ kind: 'answer', params: { askId: id } })).then(() => true, () => false), ck.ask.id);
      check('5a the watch is set', set);
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
      /* RETIRED 17 Nov 2026 (#762, round 6 default 11): 6a/6b "Unusual for you" on DV-04's Dossier and its "Show the 3" — the
         line was drawn only on the old Dossier and stays off the new one-card Dossier. The fact column above is still made,
         so the stages after this one run on the same workspace. */
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
    /* RETIRED 22 Nov 2026 (owner, 22 Nov 2026: "There is not asking a column again only the features related to discovery"): stage 11 (11a–11d) — Stop and Carry on in Ask a column's reading card on Contracts. The
       card is deleted; Stop and "Read the N left" on Discover's own screen are pinned by stop-and-reads-verify and
       discover-page-verify 5 */
  } catch (e){ check('the run itself', false, String(e && e.stack || e)); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
