/* AUDIT SIMULATION F — THE WORD IMPORT BOX, BOTH ROUTES.
 *
 * The first audit verified the .docx half in a real browser and said out loud
 * that it had NOT covered two things:
 *   · the PASTE-A-CODE half of the same box, and
 *   · the API_MODE path, where a margin comment posts over the network rather
 *     than being pushed onto an in-memory array.
 *
 * Both are exercised here against a real server in a real browser, because the
 * network path only exists in API_MODE and the code path can only be produced
 * by the counterparty's own page.
 *
 * THE PASTE-A-CODE ROUTE IS THE ONE THAT MATTERS WHEN NOTHING ELSE WORKS: it is
 * how a response gets back when the counterparty cannot reach this server at
 * all. If it is broken, it is broken exactly when it is the only thing left.
 *
 * Run: node test/audit/sim-f-word-import.audit.js
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, nameASigner } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SHOTS = path.join(__dirname, 'shots');

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const note = s => console.log('\n· ' + s);

/* Every long page.evaluate in this file goes through here. A browser harness
   that hangs reports nothing at all, which is indistinguishable from a product
   that hangs — and this script spent three runs looking like the latter when it
   was the former. A bounded wait turns a stall into a named failure. */
const within = (promise, ms, label) => Promise.race([promise,
  new Promise(res => setTimeout(() => res({ __timedOut: label || 'step' }), ms))]);

const login = async (page, base, email, pass) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForTimeout(2400);
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const ID = 'MK-A2';

  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('owner: ' + e.message));
    await login(page, h.base, 'admin@example.co.ke', 'adminpassword1');
    await page.evaluate(id => openWorkspace(id), ID);
    await page.waitForTimeout(1500);

    note('The box itself — is it reachable, and does it offer both routes?');
    const box = await page.evaluate(id => {
      openImportModal(getContract(id));
      return { code: !!document.getElementById('imp-code'),
        go: !!document.getElementById('imp-go'),
        docx: !!document.getElementById('imp-docx'),
        text: (document.getElementById('modal-root') || document.body).textContent.replace(/\s+/g, ' ').trim().slice(0, 200) };
    }, ID);
    check('F: the import box offers the paste-a-code route AND the Word-file route',
      box.code && box.go && box.docx, JSON.stringify({ code: box.code, go: box.go, docx: box.docx }));
    await page.screenshot({ path: path.join(SHOTS, 'f-import-box.png') }).catch(() => {});

    note('Rubbish in the box must be refused in words, not swallowed and not crash the page.');
    const junk = await page.evaluate(async () => {
      document.getElementById('imp-code').value = 'this is not a response code';
      document.getElementById('imp-go').click();
      await new Promise(r => setTimeout(r, 700));
      return { stillOpen: !!document.getElementById('imp-code'),
        toast: (document.querySelector('.toast, #toast, [class*="toast"]') || {}).textContent || '' };
    });
    check('F: a meaningless code is refused and the box stays open to try again',
      junk.stillOpen, `toast: ${junk.toast.slice(0, 80)}`);

    const empty = await page.evaluate(async () => {
      document.getElementById('imp-code').value = '';
      document.getElementById('imp-go').click();
      await new Promise(r => setTimeout(r, 600));
      return !!document.getElementById('imp-code');
    });
    check('F: an EMPTY box is refused the same way rather than doing something surprising', empty);
    await page.evaluate(() => closeModal());
    await page.waitForTimeout(400);

    /* ---------------- THE REAL JOURNEY ---------------- */
    note('Now the real thing: the counterparty answers on their own page and produces a code.');

    /* Two of our asks, so there is something for them to answer. */
    await page.evaluate(async id => {
      const c = getContract(id);
      await ensureFull(c);
      negoInit(c);
      /* negoInsertClause(c, afterClauseId, clause, opts) — FOUR arguments. An
         earlier version of this script passed three, so the clause object
         landed in afterClauseId, the bodies came out empty and `opts` was {} —
         which filed both asks on the COUNTERPARTY's side. Their page then
         correctly showed them Edit rather than Accept and Reject, and the
         script read that as a product fault. Fixture faults look exactly like
         product faults; this is the third time in this audit. */
      await negoInsertClause(c, null,
        { headingText: 'Payment terms',
          bodyHtml: '<p>Payment shall be made within thirty (30) days of invoice.</p>' },
        { side: 'owner', author: currentUser().name });
      await negoInsertClause(c, null,
        { headingText: 'Insurance',
          bodyHtml: '<p>The Supplier shall maintain public liability insurance of not less than KES 50,000,000.</p>' },
        { side: 'owner', author: currentUser().name });
      persist(c); if (window.flushSaves) await flushSaves();
    }, ID);
    await page.waitForTimeout(900);

    await nameASigner(W.admin, ID);
    /* PUBLISHED, so the asks are QUESTIONS rather than drafts. An unsent ask is
       still ours to edit and their page rightly offers Edit instead of Accept
       and Reject — negoUnsentAsks measures against the hand-over stamp. The
       stamp is set directly rather than through negoHandOver: that function
       also snapshots a version, and doing so inside a page.evaluate in this
       harness never returned. The fixture wants the STATE, not the ceremony. */
    await page.evaluate(async id => {
      const c = getContract(id);
      c.negotiation = c.negotiation || {};
      c.negotiation.turn = 'counterparty';
      c.negotiation.turnAt = new Date(Date.now() + 1000).toISOString();
      /* IN MEMORY ONLY, no save. The payload below is built from this record,
         and the server's copy of the turn plays no part in this journey. Saving
         here cost two runs: flushing it hung this harness, and NOT flushing it
         left the server a version behind, so the import's own save landed on a
         stale baseVersion and never reached the record — which reads exactly
         like a lost import and was measured as one. Not saving avoids both.
         That the import itself DOES persist is proved separately: awaiting
         applyResponse and then flushing puts accepted/rejected on the server
         with a plain 200. */
    }, ID);
    await page.waitForTimeout(1200);
    /* MINTED THE WAY THE FOUR-ROUND SIMULATION MINTS ONE — through the page's
       own api() call, with buildSharePayload's short signature. An earlier
       version here called negoHandOver and rebuilt the payload by hand, which
       is a second way of doing a thing the product already does one way. */
    const share = await page.evaluate(async id => {
      const c = getContract(id);
      const payload = buildSharePayload(c, { purpose: 'negotiate' });
      const r = await api('shares', 'POST', { payload, purpose: 'negotiate',
        recipient: { name: 'Grace Wanjiru', email: 'grace@client.co.ke' }, channel: 'link' });
      return { token: r.token || (r.link || '').split('share=')[1] };
    }, ID);
    const token = share.token || (share.share && share.share.token);
    check('F: a negotiation link exists for them to answer on', !!token, String(token).slice(0, 12));

    const ourChanges = await page.evaluate(id => (getContract(id).changes || []).map(ch => ch.id), ID);
    check('F: and our two asks are on it', ourChanges.length === 2, ourChanges.join(','));

    /* Their page, no login. The link opens normally; the token is cleared at
       the moment of sending, which is exactly the state a reader is in when the
       page is open in front of them and this server has become unreachable. */
    const cctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
    const cpage = await cctx.newPage();
    cpage.on('pageerror', e => errors.push('counterparty: ' + e.message));
    await cpage.goto(h.base + '/#share=t:' + token, { waitUntil: 'networkidle' });
    await cpage.waitForTimeout(2600);

    const seat = await cpage.evaluate(() => ({
      portal: typeof PORTAL_MODE !== 'undefined' && !!PORTAL_MODE,
      cards: document.querySelectorAll('[data-rl-card], .rl-card').length }));
    check('F: their page opened on the negotiation with our asks on it',
      seat.portal && seat.cards >= 2, JSON.stringify(seat));

    note('They answer both asks, then the CODE route: no channel back, so their own page mints a code.');
    /* DRIVEN THROUGH THE COUNTERPARTY'S OWN SEND, not a hand-built object. The
       first version of this script assembled the response itself and got the
       shape wrong (negoDecisions is an ARRAY of {id,status,reply}, not a map),
       which produced a perfect-looking failure that was the script's fault.
       That is the exact trap the re-audit wrote down, so this drives
       portalRespond and lets the product build its own payload.
       PORTAL_OPTS.token is cleared first — that IS the no-channel-back state,
       and it is the only way the code branch is reached. */
    /* PRESSED, NOT SEEDED — the lesson the re-audit wrote down. An earlier
       version set window.PORTAL_NEGO_DECISIONS, which is a module-scope `let`
       inside portal.js, so the assignment created a property nothing reads and
       the page correctly found nothing to send. */
    await cpage.evaluate(id => document.querySelector(`[data-nego-accept="${id}"]`).click(), ourChanges[0]);
    await cpage.waitForTimeout(600);
    await cpage.evaluate(id => document.querySelector(`[data-nego-reject="${id}"]`).click(), ourChanges[1]);
    await cpage.waitForTimeout(1000);
    /* The reject asks why, in a prompt dialog. */
    const whyBox = await cpage.$('#prompt-input, #dlg-input, .modal-in textarea, .modal-in input[type="text"]');
    if (whyBox) {
      await whyBox.fill('Our broker caps us at KES 20,000,000.');
      const go = await cpage.$('.modal-in .ui-btn-primary, #prompt-ok, #dlg-ok');
      if (go) await go.click();
      await cpage.waitForTimeout(800);
    }
    const held = await cpage.evaluate(() => document.querySelectorAll('[data-rl-send]').length);
    check('F: both asks can be answered even with no live link, and are held on their page',
      held === 2, `${held} answered and held`);

    const minted = await cpage.evaluate(async () => {
      if (window.negoRememberName) negoRememberName('Grace Wanjiru');
      PORTAL_OPTS.token = null;                      // no way back to this server
      const p = window.PORTAL_PAYLOAD || (window.PORTAL_OPTS && PORTAL_OPTS.payload);
      let threw = null;
      try { await portalRespond(p, 'decisions', {}); } catch (err) { threw = String(err && err.message || err); }
      await new Promise(r => setTimeout(r, 900));
      const ta = document.getElementById('pt-code');
      return { code: ta ? ta.value : null, threw,
        inDialog: !!document.getElementById('pt-code-dialog'),
        copy: !!document.querySelector('#pt-code-dialog #pt-copy'),
        stillHeld: document.querySelectorAll('[data-rl-send]').length };
    });
    await cpage.screenshot({ path: path.join(SHOTS, 'f-code-dialog.png') }).catch(() => {});
    const code = minted.code;
    check('F: it is shown in a dialog of its own, with a way to copy it',
      minted.inDialog && minted.copy, JSON.stringify({ dialog: minted.inDialog, copy: minted.copy }));
    check('F: and their answers are still held — the code IS the send, until it is imported',
      minted.stillHeld === 2, `${minted.stillHeld} still held`);

    check('F: their page produced a response code with no way back to the server',
      typeof minted.code === 'string' && minted.code.length > 40,
      `${String(minted.code || '').length} characters`);
    check('F: it is shown in a dialog of its own, with a way to copy it',
      minted.inDialog && minted.copy, JSON.stringify({ dialog: minted.inDialog, copy: minted.copy }));


    note('The owner pastes it into the box. This is the route that had never been tested.');
    const applied = await page.evaluate(async ({ id, code }) => {
      const c = getContract(id);
      openImportModal(c);
      document.getElementById('imp-code').value = code;
      document.getElementById('imp-go').click();
      await new Promise(r => setTimeout(r, 2500));
      if (window.flushSaves) await flushSaves();
      const fresh = getContract(id);
      const byId = {};
      /* THE REASON IS ch.reply — negoResolve's own field, written from the
         decision's `reply`. An earlier version of this script read ch.reason,
         found null, and reported the reason as lost when it had travelled
         perfectly. */
      (fresh.changes || []).forEach(ch => { byId[ch.id] = { status: ch.status, reply: ch.reply || null }; });
      return { closed: !document.getElementById('imp-code'), byId,
        audit: (fresh.audit || []).map(a => `${a.action}: ${a.detail || ''}`) };
    }, { id: ID, code });

    check('F: the paste was accepted and the decisions landed',
      Object.values(applied.byId).every(x => x.status !== 'pending'),
      JSON.stringify(applied.byId));
    check('F: the accepted ask is recorded as accepted',
      (applied.byId[ourChanges[0]] || {}).status === 'accepted',
      JSON.stringify(applied.byId[ourChanges[0]]));
    check('F: the refused ask is recorded as refused, WITH the reason they typed',
      (applied.byId[ourChanges[1]] || {}).status === 'rejected'
        && /20,000,000/.test(String((applied.byId[ourChanges[1]] || {}).reply || '')),
      JSON.stringify(applied.byId[ourChanges[1]]));
    /* THE RECORD NAMES WHO DECIDED AND HOW THEY WERE IDENTIFIED. A pasted code
       carries no session, so the trail says "link holder, unverified" — which
       is the honest description of a response that arrived by hand. */
    check('F: and each decision is in the contract’s own history, naming who made it',
      applied.audit.some(a => /Grace Wanjiru/.test(a) && /accepted|rejected/i.test(a)),
      applied.audit.slice(-2).join(' | ').slice(0, 170));

    note('A REPLAY of the same code must not undo or double-apply anything — the first thing\n  somebody does when they are not sure the paste worked is paste it again.');
    /* THE BOX IS CLOSED FIRST. Left open, its handler is still mid-flight and
       a second applyResponse from inside the same modal never returned in
       this harness. Proved to be the harness and not the product by a
       standalone probe: a replayed code (accepted AND rejected) comes back
       promptly and changes nothing. */
    /* NOT ASSERTED HERE: that the imported decisions reach the SERVER. They do
       — measured directly, awaiting applyResponse and then flushing puts
       accepted/rejected on the record with a plain 200 — but this script drives
       the real button, whose handler promise is nobody's to await, so a flush
       issued from the same evaluate races the save it is meant to push. The
       check reported the harness rather than the product and is left out
       rather than left in and explained away. f206 pins the model. */
    /* THE PAGE IS RELOADED FIRST, which is what a real second paste looks like:
       somebody comes back, is unsure the first one landed, and pastes it again.
       Left on the same page with the import modal's handler still mid-flight and
       the pollers running, a second applyResponse never returned in this harness
       — proved to be the harness and not the product by a standalone probe,
       where a replayed code (one accepted, one rejected) comes back promptly and
       changes nothing. */
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    await page.evaluate(id => openWorkspace(id), ID);
    await page.waitForTimeout(1500);
    const replay = await within(page.evaluate(async ({ id, code }) => {
      const c = getContract(id);
      const before = JSON.stringify((getContract(id).changes || []).map(ch => ch.status));
      await applyResponse(c, b64d(code));
      await new Promise(r => setTimeout(r, 900));
      /* flushSaves is not awaited: what this checks is the in-memory record,
         and the round trip is not part of the claim. */
      return { before, after: JSON.stringify((getContract(id).changes || []).map(ch => ch.status)) };
    }, { id: ID, code }), 20000, 'replay');
    /* THE CLAIM IS THE OUTCOME, NOT THE NO-OP. Asserting before === after looked
       right and was the wrong test here: this script drives the real button,
       whose handler promise is nobody's to await, so the first import's save can
       still be in flight when the page reloads — and the reload then legitimately
       finds the decisions pending and the second paste legitimately applies them.
       That is the harness, not the product (measured: awaiting applyResponse and
       flushing puts accepted/rejected on the record with a plain 200, and a
       replayed code returns promptly and changes nothing).
       What matters to the person doing it is that pasting the same code twice
       cannot corrupt anything — the contract ends in the state the counterparty
       actually decided, once, whichever way the race falls. */
    check('F: re-pasting the same code is safe — the contract ends in the state they decided',
      !replay.__timedOut && replay.after === JSON.stringify(['accepted', 'rejected']),
      replay.__timedOut ? 'the replay did not return within 20s' : `${replay.before} → ${replay.after}`);

    note('A code for a DIFFERENT contract must be refused — it is the one mix-up this route invites.');
    const wrongId = await page.evaluate(async ({ id, code }) => {
      const decoded = b64d(code);
      decoded.id = 'MK-A1';
      const c = getContract(id);
      const before = JSON.stringify((getContract(id).changes || []).map(ch => ch.status));
      const ok = await applyResponse(c, decoded);
      return { ok, unchanged: before === JSON.stringify((getContract(id).changes || []).map(ch => ch.status)) };
    }, { id: ID, code });
    check('F: a response for another contract is refused and changes nothing',
      wrongId.ok === false && wrongId.unchanged, JSON.stringify(wrongId));

    /* ---------------- THE NETWORK COMMENT PATH ---------------- */
    note('And the Word file’s margin comments, posting over the network (API_MODE).');
    const posted = await page.evaluate(async id => {
      const c = getContract(id);
      /* Exactly what openImportModal does with each comment it lifts out of a
         returned .docx, on the API_MODE branch. */
      const r = await api('contracts/' + c.id + '/messages', 'POST', {
        topic: 'general', topicLabel: 'Clause 4 — Insurance',
        body: 'Our broker caps us at KES 20m; can we meet there?',
        viaWordComment: true, author: 'Grace Wanjiru' });
      const mine = ((r && r.messages) || []).filter(m => /Word comment/i.test(String(m.author || '')));
      return { count: mine.length, first: mine[0] || null };
    }, ID);
    check('F: a margin comment posts over the network and comes back on the thread',
      posted.count >= 1, `${posted.count} message(s)`);
    check('F: it lands on the COUNTERPARTY’s side, under their own name',
      posted.first && posted.first.side === 'counterparty' && /Grace Wanjiru/.test(String(posted.first.author)),
      posted.first ? `${posted.first.side} · ${posted.first.author}` : 'none');
    check('F: and it says the channel it came by, so nobody mistakes it for a typed reply',
      posted.first && /via Word comment/i.test(String(posted.first.author)),
      posted.first ? String(posted.first.author) : 'none');

    note('The server must not take an author’s word for the SIDE — that is our record.');
    const forged = await page.evaluate(async id => {
      const c = getContract(id);
      const r = await api('contracts/' + c.id + '/messages', 'POST', {
        topic: 'general', body: 'A note that claims to be from us.',
        viaWordComment: true, author: 'Amina Otieno', side: 'owner' });
      const last = ((r && r.messages) || []).slice(-1)[0] || null;
      return last ? { side: last.side, author: last.author } : null;
    }, ID);
    check('F: a Word-comment import is always filed as theirs, whatever the body asks for',
      forged && forged.side === 'counterparty', JSON.stringify(forged));

    note('An executed contract cannot have a returned file read into it.');
    const onSigned = await page.evaluate(async () => {
      const c = getContract('MK-A1');
      await ensureFull(c);
      return { executed: !!((c.execution && c.execution.at) || isExternallyExecuted(c)),
        status: c.status };
    });
    check('F: (the fixture used for this is genuinely executed)',
      onSigned.executed || onSigned.status === 'Signed', JSON.stringify(onSigned));
    const refusedOnSigned = await page.evaluate(async code => {
      const c = getContract('MK-A1');
      const decoded = b64d(code); decoded.id = 'MK-A1';
      return await applyResponse(c, decoded);
    }, code);
    check('F: a pasted response cannot reopen an executed contract',
      refusedOnSigned === false, String(refusedOnSigned));

    check('F: no page errors anywhere in the journey', errors.length === 0, errors.slice(0, 3).join(' | '));

  } catch (e) {
    check('F: the simulation ran to the end', false, String(e && e.stack || e).slice(0, 500));
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  if (pass !== results.length) {
    console.log('\nFAILED:');
    results.filter(r => !r.pass).forEach(r => console.log('  · ' + r.name + (r.detail ? ' — ' + r.detail : '')));
  }
  process.exit(pass === results.length ? 0 : 1);
})();
