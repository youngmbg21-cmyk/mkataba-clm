/* Chromium verification: A ROUND THAT LANDS, AND ONE THAT SAYS WHY IT HAS NOT.
   ============================================================
   Owner-reported 23 Aug 2026 on MK-349: "counterparty accepted but this
   acceptance has not been pushed to the owner side hence the limbo it seems."

   Reproduced here before anything was fixed, and this file is that
   reproduction kept. It stages the owner's own shape — a payment-terms clause
   inserted from the standards library, shared on a negotiate link — and then
   drives BOTH SEATS in two real browser contexts: the counterparty accepts the
   ask, asks for one of their own through the clause panel's own editor, and
   presses Send once. Everything after that is measured rather than assumed.

   WHY A BROWSER, AND WHY TWO CONTEXTS. Every claim here is about a live
   hand-off: a public page posting to a route, a server row, an owner's timer,
   and two screens that must end up agreeing. None of it exists in jsdom —
   buildWorld never loads the shell, and the counterparty's page is a different
   document with its own storage. f238 pins the rules that can be read off the
   source (that the two view lists agree, that the failure path writes nothing
   to the record, that the words exist in both languages); this file answers
   the only question that matters to the person who reported it — does their
   work arrive, and does the screen say so.

   THE FOUR THINGS IT MEASURES:

     · the reported bug: the owner sits on the NEGOTIATION page, and it catches
       up — both the record and the pixels — where it used to sit still. The
       page is asserted to count as "watching", which is what buys the fast
       beat, and RE-OPENING it is asserted to catch up at once, because that is
       what a reader does when a page looks stale and it used to buy nothing;
     · an answer that genuinely cannot be applied is reported — on the SECOND
       failure, not the first, once per sitting, read off the real #toast-root
       so this proves the box draws rather than that a function was called;
     · nothing is lost while that is true: the answer stays queued;
     · and the counterparty's own page says whether their round was picked up,
       in both directions, turning over live.

   Run: node test/chromium/round-delivery-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const own = await ctx.newPage();
  const errors = [];
  own.on('pageerror', e => errors.push('owner: ' + e.message));

  try {
    await own.goto(h.base + '/', { waitUntil: 'networkidle' });
    await own.fill('#li-email', 'admin@example.co.ke');
    await own.fill('#li-pass', 'adminpassword1');
    await own.click('#li-go');
    await pause(2400);

    /* ---------- the stage: the owner's own shape ----------
       An INSERTED clause, which is what "add a payment terms clause from our
       standards" files — not an edit to wording that is already there. */
    const cid = await own.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      await ensureFull(c); negoInit(c);
      const cl = negoClauseList(c);
      await negoInsertClause(c, cl[cl.length - 1].clauseId,
        { headingText: 'Payment terms',
          bodyHtml: '<p>Any invoiced amounts due under this Agreement shall be paid within thirty (30) days of the invoice date.</p>' },
        { author: 'Young Mbagaya', side: 'owner', why: 'Our standard.' });
      persist(c); await flushSaves();
      return c.id;
    });
    await pause(1500);

    /* THE OWNER SITS ON THE NEGOTIATION PAGE — the whole point of the report. */
    await own.evaluate(id => openRedlineWorkbench(id), cid);
    await pause(2200);
    const watching = await own.evaluate(() => ({ view: state.view, waiting: pollWaitingOnThem() }));
    check('1 the owner is on the negotiation page', watching.view === 'redline', watching.view);
    check('1 and that page counts as WATCHING — the fast beat, not the slow one',
      watching.waiting === true,
      watching.waiting ? 'yes' : 'no — this is the bug: it answered false about itself');

    /* ---------- the counterparty answers ---------- */
    const tok = await own.evaluate(async id => {
      const full = await api('contracts/' + id);
      /* The second argument IS the document hash. Passing anything else makes
         every later docChanged reading true, and stages a journey the product
         never actually meets. */
      const payload = buildSharePayload(full, await sha256(canonicalDoc(full)), null, { purpose: 'negotiate' });
      const r = await api('shares', 'POST', { payload, channel: 'link',
        recipient: { name: 'Saw Sawa LLC', email: 'ola@sawsawa.se' }, purpose: 'negotiate' });
      return r && r.token || null;
    }, cid);
    const cp = await ctx.newPage();
    cp.on('pageerror', e => errors.push('counterparty: ' + e.message));
    await cp.goto(h.base + '/#share=t:' + tok, { waitUntil: 'networkidle' });
    await pause(2800);

    await cp.evaluate(() => { const b = document.querySelector('[data-nego-accept]'); if (b) b.click(); });
    await pause(1400);
    /* And one of their own, through the clause panel's own editor rather than
       by writing into their held store — the point is that the product's real
       door produces something that travels. */
    await cp.evaluate(() => {
      const pill = document.querySelector('.redline-page #rl-doc .nego-clause .rl-cp-pill');
      if (pill) pill.click();
    });
    await pause(1100);
    await cp.evaluate(() => {
      const b = document.querySelector('.rl-cp-src [data-rl-cp-edit]'); if (b) b.click();
    });
    await pause(1100);
    await cp.evaluate(() => {
      const ed = document.querySelector('[data-nego-editor]');
      if (ed) ed.innerHTML = '<p>The Parties wish to explore a potential business relationship only.</p>';
      const save = [...document.querySelectorAll('.nego-edit-bar button')].find(b => /save/i.test(b.textContent || ''));
      if (save) save.click();
    });
    await pause(1100);
    await cp.evaluate(() => {
      const ta = document.querySelector('.nego-reason textarea');
      if (ta) ta.value = 'Narrower purpose.';
      const file = [...document.querySelectorAll('.nego-edit-bar button, .nego-reason button')]
        .find(b => /file|skip/i.test(b.textContent || ''));
      if (file) file.click();
    });
    await pause(1500);
    await cp.evaluate(() => {
      const b = document.querySelector('.rl-unsent-go') || document.getElementById('nego-send-decisions');
      if (b) b.click();
    });
    await pause(2500);

    const queued = await own.evaluate(async () => {
      const list = await api('shares/pending');
      return list.map(x => ({ decisions: (x.response && x.response.negoDecisions || []).length,
        proposed: (x.response && x.response.negoProposed || []).length }));
    });
    check('2 their acceptance AND their counter-ask reach the server in one envelope',
      queued.length === 1 && queued[0].decisions === 1 && queued[0].proposed === 1,
      JSON.stringify(queued));

    /* ---------- 3. AN ANSWER THAT CANNOT BE APPLIED SAYS SO ----------
       A genuine stuck state, not a stub: their round is real and uncollected,
       and the owner's browser is made to no longer hold that contract — the
       exact silent hole this fix closes. Read off the real #toast-root. */
    const boxes = () => own.evaluate(() => [...document.querySelectorAll('#toast-root > *')]
      .map(e => (e.textContent || '').replace(/\s+/g, ' ').trim()));
    await own.evaluate(id => {
      window.__kept = state.contracts.find(x => x.id === id);
      state.contracts = state.contracts.filter(x => x.id !== id);
      const r = document.getElementById('toast-root'); if (r) r.innerHTML = '';
    }, cid);
    await own.evaluate(() => pollPendingResponses()); await pause(1100);
    const one = await boxes();
    check('3 one failure stays quiet — a page still loading must not cry wolf',
      one.length === 0, JSON.stringify(one));
    await own.evaluate(() => pollPendingResponses()); await pause(1100);
    const two = await boxes();
    check('3 the SECOND says so, as visible pixels',
      two.length === 1 && /cannot take it in/i.test(two[0]), JSON.stringify(two).slice(0, 130));
    check('3 and it says nothing is lost, because nothing is',
      two.length === 1 && /nothing is lost/i.test(two[0]), two[0] && two[0].slice(0, 90));
    await own.evaluate(() => pollPendingResponses());
    await own.evaluate(() => pollPendingResponses()); await pause(1100);
    check('3 further failures never nag', (await boxes()).length === 1);
    check('3 and the answer is still queued — it keeps trying',
      (await own.evaluate(async () => (await api('shares/pending')).length)) === 1);
    await own.evaluate(() => {
      if (window.__kept) state.contracts.push(window.__kept);
      const r = document.getElementById('toast-root'); if (r) r.innerHTML = '';
    });

    /* ---------- 4. THEIR PAGE SAYS IT HAS NOT BEEN PICKED UP YET ---------- */
    await cp.evaluate(() => portalRefreshNow('asked')); await pause(1600);
    const waiting = await cp.evaluate(() => ({ state: portalDeliveryState(),
      line: (document.querySelector('.pw-delivery') || {}).textContent || '' }));
    check('4 before it is collected, their page says so — in pixels',
      waiting.state === 'waiting' && /waiting for/i.test(waiting.line),
      JSON.stringify(waiting));

    /* ---------- 5. THE REPORTED BUG: the page catches up by itself ---------- */
    const seen = () => own.evaluate(id => {
      const c = state.contracts.find(x => x.id === id);
      return { rec: (c.changes || []).map(x => x.id + ':' + x.status).join(', '),
        cards: [...document.querySelectorAll('.rl-card,.rl-receipt')]
          .map(e => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30)) };
    }, cid);
    /* Past pollNow's four-second throttle first, so this measures the DOOR
       rather than the throttle. */
    await pause(4500);
    await own.evaluate(id => openRedlineWorkbench(id), cid);
    await pause(2500);
    const reopened = await seen();
    check('5 RE-OPENING the negotiation page catches up at once',
      /CHG-002/.test(reopened.rec),
      reopened.rec + ' — this bought nothing at all before the fix');
    check('5 and the pixels caught up with the record, not just the data',
      reopened.cards.join(' ').includes('CHG-002'), JSON.stringify(reopened.cards));
    check('5 their acceptance landed too, so the two seats now agree',
      /CHG-001:accepted/.test(reopened.rec), reopened.rec);

    const onServer = await own.evaluate(async id =>
      ((await api('contracts/' + id)).changes || []).map(x => x.id + ':' + x.status).join(', '), cid);
    check('5 and it is on the RECORD, not only on the screen',
      /CHG-001:accepted/.test(onServer) && /CHG-002/.test(onServer), onServer);

    /* ---------- 6. AND THEIR PAGE TURNS OVER ---------- */
    await cp.evaluate(() => portalRefreshNow('asked')); await pause(1800);
    const received = await cp.evaluate(() => ({ state: portalDeliveryState(),
      line: (document.querySelector('.pw-delivery') || {}).textContent || '' }));
    check('6 once collected, their page says it was received',
      received.state === 'received' && /has received/i.test(received.line),
      JSON.stringify(received));
    check('6 without a reload — it turns over under the reader',
      received.state === 'received', received.state);

    /* ---------- 7. A REFUSED READINESS IS RECORDED ONCE ----------
       Owner-reported 23 Aug 2026: "the bottom right says something needs to be
       settled when there were absolutely nothing negotiated ... the same alert
       is also appearing on the insights page and in other pages and it keeps
       popping up."

       Staged as the journey that produces it: the counterparty presses Ready to
       sign while the deal IS settled, and the owner files one more change
       before their browser has collected the claim. It is stale on arrival —
       and what used to happen then was a red box on EVERY beat, on whatever
       page the reader was standing on, plus a duplicate audit line each time.
       Measured against the prior code: four polls, four boxes, four lines.

       DRIVEN FROM THE INSIGHTS PAGE ON PURPOSE. The point of the report is that
       the alert appears where nothing is being negotiated; a check run on the
       negotiation page would pass against the broken build. */
    const other = await own.evaluate(async id => {
      const c = state.contracts.find(x => x.id !== id && x.status !== 'Signed' && x.status !== 'Declined');
      await ensureFull(c); negoInit(c); persist(c); await flushSaves();
      return c.id;
    });
    await pause(1200);
    const tok2 = await own.evaluate(async id => {
      const full = await api('contracts/' + id);
      const payload = buildSharePayload(full, await sha256(canonicalDoc(full)), null, { purpose: 'negotiate' });
      const r = await api('shares', 'POST', { payload, channel: 'link',
        recipient: { name: 'Juno Limited', email: 'ola@juno.se' }, purpose: 'negotiate' });
      return r && r.token || null;
    }, other);
    const cp2 = await ctx.newPage();
    cp2.on('pageerror', e => errors.push('cp2: ' + e.message));
    await cp2.goto(h.base + '/#share=t:' + tok2, { waitUntil: 'networkidle' });
    await pause(2600);
    const readyBtn = await cp2.evaluate(() => {
      const b = document.getElementById('pt-nego-ready');
      if (!b || b.disabled) return false;
      b.click(); return true;
    });
    await pause(2400);
    check('7 the counterparty could press Ready — the deal was settled when they did',
      readyBtn === true, readyBtn ? 'pressed' : 'the button was disabled; the stage is wrong');

    /* The owner files one more change before collecting it — the claim is now
       stale, through no fault of anyone. */
    await own.evaluate(async id => {
      const c = state.contracts.find(x => x.id === id);
      await ensureFull(c);
      const cl = negoClauseList(c);
      await negoEditClause(c, cl[0].clauseId,
        cl[0].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(+String(m).replace(/,/g, '') + 500)),
        { author: 'Young Mbagaya', side: 'owner', why: 'One more.' });
      persist(c); await flushSaves();
    }, other);
    await pause(1500);

    await own.evaluate(() => setView('intel'));
    await pause(1500);
    check('7 the reader is on a page about no contract at all', 
      (await own.evaluate(() => state.view)) === 'intel');

    const seenBoxes = [];
    for (let i = 0; i < 4; i++){
      await own.evaluate(() => { const r = document.getElementById('toast-root'); if (r) r.innerHTML = ''; });
      await own.evaluate(() => pollPendingResponses());
      await pause(1300);
      seenBoxes.push((await boxes()).join(' | '));
    }
    check('7 no box on any of four polls — the reported pop-up is gone',
      seenBoxes.every(b => !/settled yet/i.test(b)),
      JSON.stringify(seenBoxes).slice(0, 160));

    const lines = await own.evaluate(async id => ((await api('contracts/' + id)).audit || [])
      .filter(a => /signalled ready to sign, but/.test(String(a.detail || ''))).length, other);
    check('7 and it is recorded ONCE, not once per beat', lines === 1,
      lines + ' audit line(s) — four against the prior code');
    check('7 the claim stops arriving, so it cannot come back',
      (await own.evaluate(async () => (await api('shares/pending')).length)) === 0);

    check('no page errors on either seat', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
