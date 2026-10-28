/* JAMBO'S JOURNEY, ROUND 2 — where the reader looks
   ============================================================
   Round 2 of docs/PLAN-jambo-journey.md (22 Oct 2026). f863 pins the readings;
   this file asks the reader's questions in a real browser:
     1 · "I'd take it": on each ask of theirs in Jambo's Redlines panel, a line
         under the row says his verdict and its reason — painted, our seat
         only — and "Why?" hands the question to Jambo's conversation
     2 · after the signature: beside the Dossier of a contract signed today he
         says, once, what it now asks of each side and when, with the duties
         ahead listed by date
     3 · "Add to my own calendar" gives a calendar file of exactly those
         dates; "Show my calendar" opens the Calendar
     4 · "Make it my standard": where your rounds keep settling payment terms
         at 60 days he offers the standards page's own proposal; "Show me the
         proposal" opens that standard on Our standards
     5 · once: the paper again adds nothing
     6 · the owner's three screens: his words on screen, nothing sideways
   Run: node test/chromium/jambo-round-two-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startAiStub, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'jambo-round-two');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0, passes = 0;
const check = (ok, what, detail) => {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : ''));
  if (ok) passes++; else failures++;
};
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};
const still = page => until(page, () => !document.getAnimations().some(a => a.playState === 'running'), null, 4000);

const day = n => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';
const SIXTY = 'Invoices are payable within sixty (60) days.';
const THIRTY = 'Invoices are payable within thirty (30) days.';

(async () => {
  const ai = await startAiStub();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  /* three earlier deals where their ask for 60 days was agreed: the pattern the standards page learns from */
  const past = [1, 2, 3].map(i => Object.assign(fixtureContract('MK-P' + i, 'Earlier supply ' + i, 'Nordkust Industri AB', FOLDER_A, 100000, 'Signed', DOC),
    { signedAt: day(-20 - i), changes: [{ id: 'P' + i, clauseId: 'cl_pay', clauseLabel: '2. PAYMENT', status: 'accepted', authorSide: 'counterparty',
      newText: SIXTY, oldText: THIRTY, createdAt: iso(-20 - i), updatedAt: iso(-20 - i) }] }));
  /* signed today: their 60 days agreed, two dated duties ahead */
  const signed = Object.assign(fixtureContract('MK-S1', 'Cane Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 480000, 'Signed', DOC),
    { signedAt: day(0), expiry: day(365),
      changes: [{ id: 'S1', clauseId: 'cl_pay', clauseLabel: '2. PAYMENT', status: 'accepted', authorSide: 'counterparty', newText: SIXTY, oldText: THIRTY, createdAt: iso(-3), updatedAt: iso(-1) }],
      obligations: [{ id: 'OB1', desc: 'Deliver the first shipment', due: day(10), party: 'ours', status: 'open' },
        { id: 'OB2', desc: 'Pay the first invoice', due: day(40), party: 'theirs', status: 'open' }] });
  /* a live round: their ask waits on us */
  const live = Object.assign(fixtureContract('MK-L1', 'Freight Services Agreement', 'Nordkust Industri AB', FOLDER_A, 480000, 'Under Review', DOC),
    { negotiation: { round: 2, turn: 'owner', turnAt: iso(-2), rounds: [] },
      changes: [{ id: 'L1', clauseId: 'cl_pay', clauseLabel: '2. PAYMENT', status: 'pending', authorSide: 'counterparty', author: 'Erik Lindqvist',
        summary: '“30” → “90”', newText: 'Invoices are payable within ninety (90) days.', oldText: THIRTY, createdAt: iso(-2) }] });
  await seedWorkspace(h, { contracts: past.concat([signed, live]), approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [], blocked = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 }, acceptDownloads: true });
    const P = await ctx.newPage();
    P.setDefaultTimeout(8000);
    P.on('pageerror', e => errors.push(String(e && e.message || e)));
    const drive = async (fn, arg, fallback) => {
      try { return await P.evaluate(fn, arg); } catch (e) { blocked.push(String(e && e.message || e).split('\n')[0]); return fallback; }
    };
    const press = async label => drive(l => {
      const b = [...document.querySelectorAll('#ig-dock [data-ig-choice]')].find(x => x.innerText.trim() === l);
      if (!b) return false; b.click(); return true;
    }, label, false);
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke');
    await P.fill('#li-pass', 'adminpassword1');
    await P.click('#li-go');
    await until(P, () => !!(window.currentUser && currentUser() && typeof getContract === 'function' && getContract('MK-L1') && getContract('MK-S1')), null, 15000);
    await P.evaluate(() => { state.aiConfigured = true; });

    /* ============ 1 · HIS READ ON THEIR ROW ============ */
    await drive(() => pdOpenOnHome('MK-L1', 'copilot'), null, null);
    await until(P, () => !!(window.pdContract && pdContract() && pdContract().id === 'MK-L1'), null, 8000);
    await drive(() => pdRedOpen('MK-L1'), null, null);
    const lit = await until(P, () => !!document.querySelector('#ig-dock [data-rl-row-read]'), null, 10000);
    check(lit, '1a his read is on the row of their ask in the Redlines panel');
    const read = await drive(() => {
      const r = document.querySelector('#ig-dock [data-rl-row-read]'); if (!r) return null;
      r.scrollIntoView({ block: 'center' });
      const b = r.getBoundingClientRect(); const at = document.elementFromPoint(b.left + 10, b.top + Math.min(8, b.height / 2));
      return { verdict: r.getAttribute('data-rl-row-read'), text: r.innerText.replace(/\s+/g, ' '), painted: !!(at && r.contains(at)),
        /* RE-POINTED 24 Oct 2026 (owner picked "Advice or no advice"): "Ask Jambo more" is the last verb of the same card */
        why: !!(r.closest('.rl-card') || r).querySelector('.rl-card-side [data-rl-read-why]') };
    }, null, null);
    check(!!(read && read.painted && read.why), '1b it is painted, with Ask Jambo more on its card', read);
    check(!!(read && /Escalate|Push back|Take it|Read it/.test(read.text) && read.text.length > 20), '1c it says the verdict and its reason', read && read.text);
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-row-read.png') });
    /* THE WRONG CONTRACT (owner, 27 Oct 2026: beside MK-398's Redlines Jambo answered "I can't tell which contract you
       mean"): what the brain is told and the line under his answer name the contract on the paper, the same one */
    const told = await drive(() => ({ ctx: (window.aiChatContext && aiChatContext().activeContractId) || null,
      line: (window.aiReadFrom && aiReadFrom().cid) || null }), null, {});
    check(told.ctx === 'MK-L1' && told.line === 'MK-L1', '1h beside the paper\'s Redlines, the brain is told which contract is open, the same one the line names', told);
    /* THE CARD'S VERDICT TRAVELS (owner picked A, 28 Oct 2026): the brain is handed what the card said, so "why do you
       say Escalate?" is explained from it, never denied */
    const cardSaid = await drive(() => { const r = (window.aiChatContext && aiChatContext().cardReads) || []; const v = document.querySelector('#ig-dock [data-rl-row-read] .rl-card-read-v');
      return { reads: r, card: v ? v.textContent.trim() : '' }; }, null, {});
    check(!!cardSaid.card && cardSaid.reads.some(x => x.id === 'L1' && x.verdict === cardSaid.card && x.why.length > 10), '1i the brain is handed the card\'s own verdict and reason for their ask', cardSaid);
    /* RE-POINTED 27 Oct 2026 (owner: "it is taking me to the wrong jambo. I believe it should be taking me to the
       editor jambo"): the press opens the clause editor on this change, from the row, with the card's reading as
       Jambo's first line, and the question is asked THERE — not in the conversation beside the paper. */
    const n0 = await drive(() => intel.history.length, null, 0);
    const readSaid = await drive(() => { const r = document.querySelector('#ig-dock [data-rl-row-read] .rl-card-read-v'); return r ? r.textContent.trim() : ''; }, null, '');
    /* the fixture's 'cl_pay' names no clause on its plain-text paper (one clause, stamped with its own id); the
       editor opens a REAL clause, so the change is put on the paper's own, as every filed change is */
    await drive(() => { const c = getContract('MK-L1'), cl = (negoClauseList(c) || [])[0]; if (cl) c.changes.find(x => x.id === 'L1').clauseId = cl.clauseId; }, null, null);
    await drive(() => document.querySelector('#ig-dock [data-rl-read-why]').click(), null, null);
    const asked = await until(P, () => { const lane = document.querySelector('#clause-editor #ce-lane'); return !!(lane && /Why do you say/.test(lane.innerText)); }, null, 8000);
    check(asked, '1d Ask Jambo more opens the clause editor and asks the question in its Jambo');
    const ed = await drive(() => { const lane = document.querySelector('#clause-editor #ce-lane'), pg = document.getElementById('clause-editor');
      return { lane: lane ? lane.innerText.replace(/\s+/g, ' ') : '', fromRow: !!(pg && pg.classList.contains('ce-rowmode')) }; }, null, {});
    check(!!readSaid && ed.lane.indexOf(readSaid) >= 0 && ed.lane.indexOf(readSaid) < ed.lane.indexOf('Why do you say'), '1e the card\'s reading is Jambo\'s first line there, before the question', { readSaid, lane: ed.lane.slice(0, 300) });
    check(ed.fromRow, '1f it opens as a Redlines row\'s door does, with its way back to Redlines');
    const chatN = await drive(() => intel.history.filter(m => m && m.role === 'user' && /^Why do you say/.test(String(m.text || ''))).length, null, -1);
    check(chatN === 0 && n0 >= 0, '1g and the conversation beside the paper is not asked', chatN);
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-ask-more-editor.png') });
    await drive(() => { if (window.rlCloseClauseEditor) rlCloseClauseEditor(); }, null, null);

    /* ============ 2 · AFTER THE SIGNATURE ============ */
    await drive(() => { try { localStorage.removeItem('hati.v1.jbSigned'); } catch (_) {} pdOpenOnHome('MK-S1', 'copilot'); }, null, null);
    const spoke = await until(P, () => (intel.history || []).some(m => m && m.signedTurn === 'MK-S1') && !!document.querySelector('#ig-dock [data-ig-choice]'), null, 10000);
    check(spoke, '2a beside the Dossier of a contract signed today, he speaks');
    const words = await drive(() => [...document.querySelectorAll('#ig-dock .jb-turn')].map(t => t.innerText.replace(/\s+/g, ' ')).join(' | '), null, '');
    check(/what it now asks of each side/.test(words) && /Deliver the first shipment/.test(words) && /Pay the first invoice/.test(words), '2b he lists the duties ahead, each side\'s', words.slice(0, 500));
    check(/It ends/.test(words), '2c and when it ends');
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-signed.png') });

    /* ============ 5 · THE OWNER'S THREE SCREENS, while he speaks ============ */
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh });
      await drive(() => { const t = [...document.querySelectorAll('#ig-dock .jb-turn')].find(x => /each side/.test(x.innerText)); if (t) t.scrollIntoView({ block: 'nearest' }); }, null, null);
      const fit = await drive(() => { const t = [...document.querySelectorAll('#ig-dock .jb-turn')].find(x => /each side/.test(x.innerText)); if (!t) return { words: false };
        const r = t.getBoundingClientRect(); const at = document.elementFromPoint(r.left + 30, r.top + 12);
        return { side: document.documentElement.scrollWidth > window.innerWidth + 1, words: !!(at && t.contains(at)) }; }, null, {});
      check(!fit.side && fit.words, `5 ${w}×${hh}: his words are on screen, nothing scrolls sideways`, fit);
      await still(P); await P.screenshot({ path: path.join(OUT, `${w}x${hh}.png`) });
    }
    await P.setViewportSize({ width: 1440, height: 780 });

    /* ============ 3 · THE CALENDAR ============ */
    const dl = P.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    check(await press('Add to my own calendar'), '3a "Add to my own calendar" is there to press');
    const file = await dl;
    let ics = '';
    if (file){ const fp = await file.path(); ics = fp ? fs.readFileSync(fp, 'utf8') : ''; }
    const evs = (ics.match(/BEGIN:VEVENT/g) || []).length;
    check(!!file && /\.ics$/.test(file.suggestedFilename()) && evs === 3 && /first shipment/.test(ics) && /first invoice/.test(ics), '3b it gives a calendar file of exactly those dates', { name: file && file.suggestedFilename(), evs });
    check(await press('Show my calendar'), '3c "Show my calendar" is there to press');
    check(await until(P, () => typeof hbFace === 'function' && hbFace() === 'calendar', null, 8000), '3d it opens the Calendar');

    /* ============ 4 · MAKE IT MY STANDARD ============ */
    await drive(() => pdOpenOnHome('MK-S1', 'copilot'), null, null);
    await until(P, () => !!(window.pdContract && pdContract() && pdContract().id === 'MK-S1'), null, 8000);
    await drive(() => { if (typeof pdTalkReopen === 'function') pdTalkReopen(); }, null, null);
    const offered = await until(P, () => [...document.querySelectorAll('#ig-dock [data-ig-choice]')].some(b => b.innerText.trim() === 'Show me the proposal'), null, 8000);
    const learnWords = await drive(() => [...document.querySelectorAll('#ig-dock .jb-turn')].map(t => t.innerText.replace(/\s+/g, ' ')).find(t => /Next time I'd start/.test(t)) || '', null, '');
    check(offered && /60 days/.test(learnWords), '4a he offers the standards page\'s proposal: settle payment at 60 days', learnWords);
    check(await press('Show me the proposal'), '4b "Show me the proposal" is there to press');
    check(await until(P, () => window.state && state.view === 'playbook', null, 8000), '4c it opens Our standards');
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-standards.png') });

    /* ============ 5 · ONCE ============ */
    const before = await drive(() => intel.history.filter(m => m && m.signedTurn === 'MK-S1').length, null, -1);
    await drive(() => pdOpenOnHome('MK-S1', 'copilot'), null, null);
    await until(P, () => !!(window.pdContract && pdContract() && pdContract().id === 'MK-S1'), null, 8000);
    await drive(() => typeof renderIntelDock === 'function' && renderIntelDock(), null, null);
    const after = await drive(() => intel.history.filter(m => m && m.signedTurn === 'MK-S1').length, null, -1);
    check(before > 0 && after === before, '5a the paper again adds nothing: he spoke once', { before, after });
    check(!errors.length, 'no page errors', errors.slice(0, 3));
  } catch (e) {
    check(false, 'the run finished', String(e && e.stack || e).split('\n').slice(0, 3).join(' '));
  } finally {
    if (blocked.length) console.log('BLOCKED  ' + [...new Set(blocked)].join(' · '));
    await browser.close(); await h.stop(); await ai.stop();
    console.log(`\n${passes} passed, ${failures} failed`);
    process.exit(failures ? 1 : 0);
  }
})();
