/* ============================================================
   SIX-ROUND CROSS-PARTY AUDIT — the new negotiation flow, end to end
   ============================================================
   Two real browsers against a real server:
     · the OWNER (Wanjiru) in her signed-in workspace, on the Redline Workbench
     · the COUNTERPARTY (Erik) on the share-link page — the same workbench,
       reached through the one durable link he is ever emailed

   Six rounds of redlines travel back and forth through the platform. After
   every round the audit re-checks the promises the flow makes:

     LEAK   nothing internal reaches Erik's page: no Copilot rationale
            (ch.note), no internal thread, no unsent draft, ever
     MAIL   Erik is emailed exactly once before execution — the link delivery —
            and once after it: the signed copy
     TURN   the turn and the round move only when something actually travels
     PARITY the two screens tell one story: same fingerprints, same statuses

   Endgame: readiness on both sides, a signing link, Erik signs LAST, and the
   audit checks that execution closes the standing link, that the final email
   carries the signed copy's door, and that nothing on the dead link can act.

   Run: node test/chromium/six-round-audit.js
   Screenshots: test/chromium/shots/audit/ */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, nameASigner } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'audit');
/* THE SAME LADDER EVERY OTHER HARNESS USES: an override, then the dev sandbox's
   own copy IF IT EXISTS, then whatever playwright installed. The bare path was
   true in exactly one place — on a CI runner playwright installs its own build
   and /opt/pw-browsers does not exist, so the launch threw before a single
   check ran. */
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const CID = 'MK-NEG';
const ERIK = 'erik@nordfrakt.se';

const BASE_TEXT = [
  'WAREHOUSING AND LOGISTICS SERVICES AGREEMENT',
  '1. SCOPE',
  '1. The Provider shall receive, store, handle and dispatch the goods.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
  '3. STORAGE',
  '3. Stored goods may remain in the facility for a maximum of one hundred and twenty (120) days.',
  '4. TERMINATION',
  '4. Either party may terminate by giving not less than sixty (60) days written notice.',
  '5. LIABILITY',
  '5. Liability is capped at the fees paid in the preceding six (6) months.',
].join('\n');

/* Internal tripwires: if any of these strings ever appears on Erik's page,
   the wall has failed. They are planted on the owner's record on purpose. */
const TRIPWIRES = [
  'Copilot — Explain Legal Risk',
  'our exposure on payment terms',
  'Our ceiling is Net-60 — do not reveal',
  'walk-away point',
];

const results = [];
const gaps = [];
const check = (round, name, pass, detail) => {
  results.push({ round, name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  [R${round}] ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) gaps.push({ round, name, detail: String(detail || '') });
};
const pause = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: {
    org: 'Wanjiru Catering Ltd', name: 'Wanjiru Kamau', email: 'wanjiru@wcl.co.ke',
    password: 'adminpassword1', data: { uid: 200, contracts: [{
      id: CID, name: 'Warehousing and Logistics Services Agreement',
      counterparty: 'Nordfrakt Logistik AB', folder: 'proc', value: 900000,
      valueType: 'standard', status: 'Under Review', template: 'RM',
      lastAction: '10 Jul 2026', expiry: '2027-06-30', hash: null, signedAt: null,
      fields: {}, metadata: {}, comments: [], audit: [], signatures: [],
      obligations: [], rounds: [], versions: [],
      redlineText: BASE_TEXT, format: 'text',
    }], settings: {} },
  } });

  /* Every email the counterparty has ever been sent. The MAIL invariant is
     counted against this, not against the whole outbox — mail to the OWNER
     ("Erik responded") is a different promise and not under audit here. */
  const mailToErik = async () =>
    ((await admin.json('/api/outbox')).items || []).filter(m => String(m.to_addr).includes(ERIK));

  /* NAMING THE SIGNERS IS WHAT OPENS SIGNING (11 Aug 2026), and this journey
     predates it. The endgame issues a signing link through the real hand-off,
     and since that rule a link cannot be minted until somebody is named on each
     side — defaultSharePurpose even answers 'negotiate' while nobody is, which
     is why the dialog was quietly producing a second negotiate link rather than
     refusing. It is the PRECONDITION of the endgame, not its subject: the six
     rounds under audit are unchanged by it. */
  await nameASigner(admin, CID, { name: 'Erik Lindqvist', email: ERIK });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });

  /* ---- the owner's browser, signed in with the admin cookie ---- */
  const [ck, cv] = String(admin.cookie || '').split('=');
  const ownerCtx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  await ownerCtx.addCookies([{ name: ck, value: cv, url: h.base }]);
  const owner = await ownerCtx.newPage();
  owner.on('pageerror', e => check('-', 'owner page error', false, e.message));
  await owner.goto(h.base, { waitUntil: 'load' });
  await owner.waitForFunction(() => window.state && Array.isArray(state.contracts)
    && state.contracts.length, null, { timeout: 20000 });

  /* ---- Erik's browser: separate context, no cookies, no login ---- */
  const cpCtx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  const cp = await cpCtx.newPage();
  cp.on('pageerror', e => check('-', 'counterparty page error', false, e.message));

  const ownerOpenBench = async () => {
    await owner.evaluate(id => { openRedlineWorkbench(id); }, CID);
    await owner.waitForSelector('#view-redline [id="rl-doc"]', { timeout: 10000 });
  };
  const ownerPoll = async () => {
    await owner.evaluate(() => pollNow('audit'));
    await pause(700);
  };
  const ownerFlush = async () => { await owner.evaluate(() => flushSaves()); };

  /* File a clause edit through the REAL controls on whichever page.
     RE-POINTED 16 Aug 2026. This pressed the clause's Direct Edit, which NO
     EDITS ON THE PAPER retired: the paper carries one control now, the green
     Edit pill, and every way to write is inside the clause panel it opens. So
     the walk is pill → ＋ → editor, and the editor is in the PANEL rather than
     in the clause, which is why it is looked for on the document rather than
     inside the doc root. Everything after that — the two-step save, the skip,
     the funnel it files through — is unchanged, which is the point: this file
     audits six real rounds and only the door moved. */
  /* RE-POINTED 11 Oct 2026: wording is changed in the clause EDITOR on both
     seats now — our paper carries no pencil from 1024px up (Young, 9 Oct:
     "No pen on any paper"; the door is "Edit clause"), and theirs has had
     none since 28 Sep (their door is Edit at the top). Both doors end in the
     mount's own openEditor (host._rlOpenEditor), which is what is called
     here, on the clause named by its heading; the words are replaced the way
     a person types them (a selection, then insertText), and Save files it. */
  async function directEdit(page, root, headingRe, replaceRe, replacement){
    const did = await page.evaluate(async ({ root, headingRe, replaceRe, replacement }) => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const scope = document.querySelector(root); if (!scope) return 'no root';
      const clause = Array.from(scope.querySelectorAll('.rl-clause')).find(cl =>
        new RegExp(headingRe).test((cl.querySelector('.rl-clause-h') || {}).textContent || ''));
      if (!clause) return 'no clause';
      const id = clause.getAttribute('data-clause');
      const host = [scope, ...scope.querySelectorAll('*')].find(e => typeof e._rlOpenEditor === 'function');
      if (!host) return 'no editor door';
      host._rlOpenEditor(id, { typing: true });
      for (let i = 0; i < 30 && !document.getElementById('ce-clausebody'); i++) await wait(100);
      const box = document.getElementById('ce-clausebody');
      if (!box) return 'no editor';
      box.focus();
      const rx = new RegExp(replaceRe);
      const tw = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
      let hit = null;
      while (tw.nextNode()){ const n = tw.currentNode, m = rx.exec(n.data); if (m){ hit = { n, i: m.index, len: m[0].length }; break; } }
      if (!hit) return 'wording not found';
      const rg = document.createRange(); rg.setStart(hit.n, hit.i); rg.setEnd(hit.n, hit.i + hit.len);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg);
      document.execCommand('insertText', false, replacement);
      await wait(300);
      const save = document.querySelector('#clause-editor [data-ce-act="save"]');
      if (!save) return 'no save';
      save.click();
      await wait(900);
      /* their seat asks why (portalAskReason); a person with nothing to add
         answers "Not now". */
      const why = document.querySelector('#prompt-overlay #pd-cancel'); if (why) { why.click(); await wait(400); }
      if (window.clauseEditorDirty && clauseEditorDirty()) return 'not saved';
      if (window.rlCloseClauseEditor) rlCloseClauseEditor();
      await wait(300);
      if (window.closeContextPanel && window.state && state.panelOpen) closeContextPanel();
      await wait(200);
      return 'ok';
    }, { root, headingRe, replaceRe, replacement });
    return did;
  }

  const bodyText = page => page.evaluate(() => document.body.textContent);
  const leakCheck = async (round) => {
    const text = await bodyText(cp);
    const hit = TRIPWIRES.filter(t => text.includes(t));
    check(round, 'no internal material on the counterparty page', hit.length === 0,
      hit.length ? 'LEAKED: ' + hit.join(' | ') : 'all tripwires held');
  };
  const mailCheck = async (round, expected, what) => {
    const n = (await mailToErik()).length;
    check(round, `emails to the counterparty: ${expected} (${what})`, n === expected,
      `outbox holds ${n}`);
  };

  const cpOpen = async (token) => {
    /* Same URL, fresh copy: navigating to an identical URL is a same-document
       hop that re-renders nothing, so go via blank — the durable link's whole
       claim is that REOPENING it shows current state. */
    await cp.goto('about:blank');
    await cp.goto(h.base + '/#share=t:' + token, { waitUntil: 'load' });
    await cp.waitForSelector('#pt-nego .rl-embed', { timeout: 15000 });
    await pause(300);
  };

  /* WHAT THEIR SEND ASKS, ANSWERED AS A PERSON WOULD (11 Oct 2026): their
     name, once per device ("Your name"), then the send's own question naming
     what travels (portalSendCheck). */
  const cpAnswer = async () => {
    for (let i = 0; i < 3; i++){
      await pause(400);
      const did = await cp.evaluate(() => {
        const pr = document.getElementById('prompt-overlay');
        if (pr){ const inp = pr.querySelector('input, textarea'); if (inp && !inp.value) { inp.value = 'Erik Lindqvist'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
          const go = pr.querySelector('#pd-ok') || [...pr.querySelectorAll('button')].find(b => /save/i.test(b.textContent)); if (go){ go.click(); return 'name'; } }
        const ok = document.getElementById('cf-ok'); if (ok){ ok.click(); return 'confirm'; }
        return '';
      });
      if (!did) break;
    }
  };

  let token = null;

  /* ================= ROUND 1 — the owner proposes and sends ================= */
  {
    await ownerOpenBench();
    /* The address is a KEY TERM, set once on that tab and never asked for
       again. It used to be a strip across the top of this bench; the bench
       carries nothing about it now, which is the first thing checked. */
    check(1, 'the bench carries no email strip — that question moved to Key terms',
      !(await owner.$('#nego-cp-setup')));
    await owner.evaluate(id => { openWorkspace(id); }, CID);
    /* RE-POINTED 11 Oct 2026: the Overview redesign (8 Oct) moved their
       email into the filing details, opened by the ⋯ row "Filing and
       stream" (ws-filing → ovOpenFiling) — the same row, the same handler. */
    await owner.evaluate(() => ovOpenFiling(getContract(state.activeId)));
    await owner.waitForSelector('[data-kt-row="cpEmail"]', { timeout: 10000 });
    await owner.click('[data-kt-row="cpEmail"] [data-kt-edit]');
    await owner.fill('[data-kt="cpEmail"]', ERIK);
    await pause(300);
    check(1, 'the counterparty email is recorded on Key terms',
      await owner.evaluate(() => (getContract(state.activeId) || {}).counterpartyEmail || '') === ERIK);
    await ownerOpenBench();

    const r1 = await directEdit(owner, '#view-redline', 'PAYMENT',
      'thirty \\(30\\) days', 'forty-five (45) days');
    check(1, 'the owner files a redline through Direct Edit', r1 === 'ok', r1);
    await pause(400);

    // Plant the internal material the wall must hold back.
    await owner.evaluate(() => {
      const c = getContract(state.activeId);
      const ch = negoChanges(c)[0];
      ch.note = 'Copilot — Explain Legal Risk: our exposure on payment terms is the whole margin.';
      negoPostComment(c, ch.id, 'Our ceiling is Net-60 — do not reveal. This is our walk-away point.',
        { side: 'owner', author: 'Wanjiru Kamau' });      // internal by default
      persist(c);
      renderRedline();
    });
    await pause(300);

    const sent = await owner.evaluate(() => {
      const b = document.getElementById('nego-send');
      if (!b) return 'no send button';
      b.click(); return 'ok';
    });
    check(1, 'the batch send is on the page and pressed', sent === 'ok', sent);
    /* The send names what travels and asks once ("Send 1 change to …?"),
       as the later rounds' sends below already answer. */
    await pause(400); await owner.evaluate(() => { const ok = document.getElementById('cf-ok'); if (ok) ok.click(); });
    await pause(1500); await ownerFlush(); await pause(400);

    const shares = (await admin.json(`/api/contracts/${CID}/shares`)).shares || [];
    check(1, 'the first send minted ONE durable link', shares.length === 1
      && !!shares[0].durable, `${shares.length} share(s), durable=${shares[0] && shares[0].durable}`);
    token = shares[0] && shares[0].token;
    await mailCheck(1, 1, 'the link delivery — the one email with a job');
    const mail = (await mailToErik())[0];
    check(1, 'that email carries the link', !!mail && new RegExp(token).test(
      String(mail.body || '') + String(mail.dev_hint || '')));

    await cpOpen(token);
    await leakCheck(1);
    const cpText = await bodyText(cp);
    check(1, 'Erik sees the redline', /forty-five \(45\)/.test(cpText));
    check(1, 'and it is his to answer', !!(await cp.$('[data-nego-accept]')));
    await cp.screenshot({ path: path.join(OUT, 'r1-counterparty.png') });
  }

  /* ============ ROUND 2 — Erik decides, counter-proposes, sends ============ */
  {
    await cp.evaluate(() => { document.querySelector('[data-nego-accept]').click(); });
    await pause(600);
    const r2 = await directEdit(cp, '#pt-nego', 'STORAGE',
      'one hundred and twenty \\(120\\) days', 'ninety (90) days');
    check(2, 'Erik counter-proposes through the same Direct Edit', r2 === 'ok', r2);
    await pause(600);

    const send = await cp.evaluate(() => {
      const b = document.getElementById('nego-send-decisions') || document.getElementById('pt-nego-send');
      if (!b) return 'no send';
      b.click(); return 'ok';
    });
    await cpAnswer();
    check(2, 'his postbox sends the held answer and the counter-ask', send === 'ok', send);
    await pause(1500);
    await mailCheck(2, 1, 'no new email for his answer — the platform carried it');

    await ownerPoll();
    const applied = await owner.evaluate(() => {
      const c = getContract(state.activeId) || state.contracts.find(x => x.id === 'MK-NEG');
      return { accepted: (negoChanges(c).find(x => /forty-five/.test(x.newText || '')) || {}).status,
               theirs: negoChanges(c).filter(x => x.authorSide === 'counterparty').length };
    });
    check(2, 'the owner\'s record took his acceptance', applied.accepted === 'accepted', applied.accepted);
    check(2, 'and his counter-ask arrived as a fingerprint', applied.theirs >= 1, `${applied.theirs} counterparty ask(s)`);
  }

  /* ====== ROUND 3 — the owner refuses with a reason, asks again, sends ====== */
  {
    await ownerOpenBench();
    const refused = await owner.evaluate(async () => {
      const c = getContract(state.activeId);
      const theirs = negoChanges(c).find(x => x.authorSide === 'counterparty' && x.status === 'pending');
      if (!theirs) return 'nothing to refuse';
      window.promptDialog = async () => 'One hundred and twenty days of storage is the whole point of the facility.';
      const btn = document.querySelector(`[data-nego-reject="${theirs.id}"]`);
      if (!btn) return 'no reject control';
      btn.click();
      return 'ok';
    });
    check(3, 'the owner refuses Erik\'s ask with a reason', refused === 'ok', refused);
    await pause(800);

    const r3 = await directEdit(owner, '#view-redline', 'TERMINATION',
      'sixty \\(60\\) days', 'thirty (30) days');
    check(3, 'and asks for shorter notice', r3 === 'ok', r3);
    await pause(400);
    await owner.evaluate(() => { const b = document.getElementById('nego-send'); if (b) b.click(); });
    /* Send all names what travels and asks once (9 Oct 2026). */
    await pause(400); await owner.evaluate(() => { const ok = document.getElementById('cf-ok'); if (ok) ok.click(); });
    await pause(1500); await ownerFlush(); await pause(300);

    const shares = (await admin.json(`/api/contracts/${CID}/shares`)).shares || [];
    check(3, 'still ONE link — the round refreshed it in place', shares.length === 1,
      `${shares.length} share(s)`);
    /* RE-POINTED 11 Oct 2026: since the process review (4 Oct 2026, owner:
       "build all the fixes") a round handed to them carries ONE "it is your
       turn" email (roundTurnMail) — an email alone is never a hand-off, but a
       hand-off is told where they look. Their answers and the comments still
       send nothing. So the count grows by one per hand-over, and by nothing
       else. */
    await mailCheck(3, 2, 'the link, then one "your turn" email for this hand-over');

    await cpOpen(token);
    await leakCheck(3);
    const text = await bodyText(cp);
    /* RE-POINTED 16 Aug 2026: the ask tags came off the paper, so a refusal's
       reason is no longer a tooltip on a pill beside the heading. It is in the
       clause panel, on the clause the refusal is about — which is a press away
       rather than a hover away, so the walk opens each clause's panel until it
       finds the words. The claim is unchanged: Erik must be able to READ why he
       was refused. */
    /* RE-POINTED 11 Oct 2026: their paper has carried no pencil since 28 Sep
       (Edit at the top is their door), so the clause panel is opened on the
       clause the refusal is about — the one whose panel carries the reason —
       and the reason is read off the OPEN panel, as before. */
    const refusalSeen = await cp.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const src = [...document.querySelectorAll('#rl-cp .rl-cp-src')].find(b =>
        [...b.querySelectorAll('.rl-cp-why')].some(n => /whole point of the facility/.test(n.textContent)));
      if (!src || !window.rlCpSetShown) return '';
      rlCpSetShown(document, src.getAttribute('data-rl-cp-for'));
      await wait(400);
      const on = document.querySelector('#rl-cp .rl-cp-src.is-on');
      const vis = on && on.getBoundingClientRect().height > 0;
      const said = on ? [...on.querySelectorAll('.rl-cp-why')].map(n => n.textContent).join(' | ') : '';
      rlCpSetShown(document, null); await wait(200);
      return vis ? said : '';
    });
    check(3, 'Erik reads the refusal reason in the clause panel',
      /whole point of the facility/.test(refusalSeen), refusalSeen.slice(0, 70));
    check(3, 'the new ask reached him', /thirty \(30\) days written notice/.test(text));
    check(3, 'his refused ask offers Withdraw', !!(await cp.$('[data-nego-withdraw]')));
  }

  /* The change both sides reply on, carried between rounds 4 and 5. */
  let replyOn = null;

  /* ========= ROUND 4 — Erik withdraws, decides, replies in a thread ========= */
  {
    await cp.evaluate(() => { document.querySelector('[data-nego-withdraw]').click(); });
    await pause(700);
    const dec = await cp.evaluate(() => {
      const b = document.querySelector('[data-nego-accept]');
      if (!b) return { r: 'nothing to decide' };
      const id = b.getAttribute('data-nego-accept');
      b.click(); return { r: 'ok', id };
    });
    check(4, 'Erik accepts the termination ask', dec.r === 'ok', dec.r);
    replyOn = dec.id;
    await pause(500);

    /* A SHARED reply on the round — it must reach the owner's thread.
       NAMED, NOT "WHICHEVER IS FIRST". The composer moved into the clause panel
       on 16 Aug 2026 and the panel renders a body for EVERY clause, so a bare
       [data-nego-vis="shared"] now matches the first clause on the paper rather
       than the change being replied to — the reply went somewhere real and to
       the wrong thread, which reads exactly like the reply being lost. The
       change's own id is what addresses it. */
    const said = await cp.evaluate(async id => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const input = document.getElementById('nego-ti-' + id);
      if (!input) return 'no reply box for ' + id;
      const sh = document.querySelector(`[data-nego-vis="shared"][data-for="${id}"]`);
      if (!sh) return 'no shared switch for ' + id;
      sh.click();
      await wait(150);
      input.value = 'Agreed on notice — please confirm storage stays at 120 days.';
      const send = document.querySelector(`[data-nego-send="${id}"]`);
      if (!send) return 'no reply send for ' + id;
      send.click(); return 'ok';
    }, replyOn);
    check(4, 'Erik replies on that change, marked shared', said === 'ok', said);
    await pause(1200);

    await cp.evaluate(() => {
      const b = document.getElementById('nego-send-decisions') || document.getElementById('pt-nego-send');
      if (b) b.click();
    });
    await cpAnswer();
    await pause(1500);
    await mailCheck(4, 2, 'his answer sends nothing to him');

    await ownerPoll();
    await ownerOpenBench();
    /* WHERE A THREAD IS READ NOW. #rl-threads was the Discussion COLUMN, and
       that column left this page when the notes moved onto the change itself;
       nothing renders that id any more (three references to it survive in
       js/views/negotiation.js with nothing to find — stale, and worth a sweep).
       A change's conversation is in the clause panel's row for that change, and
       every clause's body is rendered whether or not the panel is open, so the
       words are readable without pressing anything. */
    /* RE-POINTED 11 Oct 2026: on OUR seat a change's conversation is read in
       the Notes drawer (one drawer, a room per party — notes-two-rooms); the
       drawer is opened on the change and its outside room is the one read. */
    const ownerThread = await owner.evaluate(async id => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      openNotesPanel(state.activeId, id, { force: true }); await wait(500);
      const ext = [...document.querySelectorAll('#context-panel [data-rl-np-room]')].find(b => b.getAttribute('data-rl-np-room') !== 'internal');
      if (ext){ ext.click(); await wait(400); }
      const t = ((document.getElementById('context-panel') || {}).textContent || '').replace(/\s+/g, ' ');
      if (window.closeContextPanel) closeContextPanel();
      return t;
    }, replyOn);
    const ownerSees = await owner.evaluate(id => ({
      thread: '',
      withdrawn: (() => { const c = getContract(state.activeId);
        return negoChanges(c).filter(x => x.withdrawn).length; })(),
      termination: (() => { const c = getContract(state.activeId);
        const ch = negoChanges(c).find(x => /thirty \(30\) days/.test(x.newText || ''));
        return ch && ch.status; })(),
    }), replyOn);
    check(4, 'his shared reply is on the owner\'s thread',
      /please confirm storage stays/.test(ownerThread), ownerThread.slice(0, 120));
    check(4, 'the withdrawal settled the contested ask', ownerSees.withdrawn >= 1);
    check(4, 'the termination ask is accepted on the record', ownerSees.termination === 'accepted');
  }

  /* ====== ROUND 5 — the owner answers the thread and closes the round ====== */
  {
    await ownerOpenBench();
    /* THE SAME THREAD, named by the same change id — see round 4. */
    /* RE-POINTED 11 Oct 2026: our reply is written in the Notes drawer, in
       the outside party's room (a shared note), on the same change. */
    const said = await owner.evaluate(async id => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      openNotesPanel(state.activeId, id, { force: true }); await wait(500);
      const ext = [...document.querySelectorAll('#context-panel [data-rl-np-room]')].find(b => b.getAttribute('data-rl-np-room') !== 'internal');
      if (ext){ ext.click(); await wait(400); }
      const input = document.querySelector('#context-panel .rl-np-in');
      if (!input) return 'no note box for ' + id;
      input.value = 'Confirmed — storage stays at one hundred and twenty (120) days.';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const send = document.querySelector('#context-panel [data-rl-np-send], #context-panel [data-rl-chat-send]');
      if (!send) return 'no note send for ' + id;
      send.click(); await wait(500);
      if (window.closeContextPanel) closeContextPanel();
      return 'ok';
    }, replyOn);
    check(5, 'the owner replies in the same thread', said === 'ok', said);
    await pause(1200);

    await cpOpen(token);
    await leakCheck(5);
    /* RE-POINTED 11 Oct 2026: their notes are read in their Notes drawer
       (#pt-notes-door → portalOpenNotes), opened as the reader would. */
    const cpNotes = await cp.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const door = document.getElementById('pt-notes-door'); if (door) door.click(); else if (window.portalOpenNotes) portalOpenNotes();
      await wait(600);
      const p = document.getElementById('pt-notes');
      const t = p ? p.textContent.replace(/\s+/g, ' ') : '';
      if (window.portalNotesClose) portalNotesClose();
      return t;
    });
    check(5, 'the reply is on Erik\'s page without any re-send',
      /Confirmed — storage stays/.test(cpNotes), cpNotes.slice(0, 120));
    await mailCheck(5, 2, 'a comment is a comment — no email');
  }

  /* ============== ROUND 6 — alignment, readiness, both sides ============== */
  {
    // Anything still pending is decided now, from whichever side owns it.
    await ownerPoll(); await ownerOpenBench();
    await owner.evaluate(async () => {
      const c = getContract(state.activeId);
      for (const ch of negoChanges(c).filter(x => x.status === 'pending' && x.authorSide === 'counterparty'))
        negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
      persist(c); renderRedline();
    });
    await owner.evaluate(() => { const b = document.getElementById('nego-send'); if (b) b.click(); });
    /* Send all names what travels and asks once (9 Oct 2026). */
    await pause(400); await owner.evaluate(() => { const ok = document.getElementById('cf-ok'); if (ok) ok.click(); });
    await pause(1200); await ownerFlush();

    await cpOpen(token);
    const pendingOnCp = await cp.evaluate(() =>
      Array.from(document.querySelectorAll('[data-nego-accept]')).length);
    if (pendingOnCp){
      await cp.evaluate(() => { document.querySelectorAll('[data-nego-accept]').forEach(b => b.click()); });
      await pause(600);
      await cp.evaluate(() => {
        const b = document.getElementById('nego-send-decisions') || document.getElementById('pt-nego-send');
        if (b) b.click();
      });
      await cpAnswer();
      await pause(1200);
      await ownerPoll();
      await cpOpen(token);
    }

    const ready = await cp.evaluate(() => {
      const b = document.getElementById('pt-nego-ready');
      if (!b) return 'no ready verb';
      if (b.hasAttribute('disabled')) return 'disabled: ' + (b.title || '');
      b.click(); return 'ok';
    });
    check(6, 'Erik\'s Ready to sign is live and pressed', ready === 'ok', ready);
    await pause(1500);
    await leakCheck(6);
    await mailCheck(6, 3, 'six rounds in: the link and one "your turn" email per hand-over (rounds 3 and 6)');

    await ownerPoll(); await ownerOpenBench();
    /* RE-POINTED 23 Aug 2026, owner-asked: NOTHING FLOATS OVER THE PAGE.
       The readiness signal used to be a band at the top of the contract, then
       a card in a floating stack behind an amber bell — which is what this
       block used to press. The card is retired: the fact is the head's own
       STATUS WORD on this page (cpReadyToSign), and the hand-off is the
       contract room's lead act. So this reads the head here, and the endgame
       below presses the act where it now lives. */
    const signal = await owner.evaluate(() => {
      const st = document.getElementById('ws-status');
      return { said: st ? st.textContent.replace(/\s+/g, ' ').trim() : '',
        floating: !!document.getElementById('nego-ready-signal') };
    });
    check(6, 'the owner sees the readiness signal, with nothing to press first',
      /ready to sign/i.test(signal.said) && !signal.floating, JSON.stringify(signal));
    await owner.evaluate(id => { openWorkspace(id); }, CID);
    await pause(1200);
    const handoff = await owner.evaluate(() => {
      const b = document.querySelector('#ws-next-action[data-na="issue-signing"]');
      return b ? b.textContent.replace(/\s+/g, ' ').trim() : '';
    });
    check(6, 'and holds the hand-off — Issue a signing link', /sign/i.test(handoff), handoff);
    await owner.screenshot({ path: path.join(OUT, 'r6-owner-signal.png') });
  }

  /* ================= ENDGAME — sign, seal, close the link =================
     The product's order without a signing route: the counterparty signs FIRST
     through the signing link (sealing closes every link, so the owner's
     signature has to be the last act), then the owner countersigns on the
     Docs sign panel — which seals, fingerprints and distributes the copy. */
  {
    // The signing link is issued through the REAL control: the readiness
    // banner's hand-off, then the share dialog it opens, prefilled with the
    // address the owner set once at round 1.
    await ownerOpenBench();
    /* RE-POINTED with the block above: the hand-off is the room head's own
       lead act now, so the room is where it is pressed. */
    await owner.evaluate(id => { openWorkspace(id); }, CID);
    await owner.waitForSelector('#ws-next-action[data-na="issue-signing"]', { timeout: 10000 });
    /* A toast still fading over the corner intercepts the press exactly as the
       panel does. Both are cleared rather than clicked through: forcing a click
       past something that is really on top would prove the button reachable
       when it is not. */
    await owner.evaluate(() => {
      const shut = document.querySelector('#rl-cp [data-rl-cp-close], #rl-cp-min');
      if (shut) shut.click();
      const tr = document.getElementById('toast-root'); if (tr) tr.innerHTML = '';
    });
    await pause(300);
    await owner.click('#ws-next-action[data-na="issue-signing"]');
    /* ONE SCREEN since 13 Sep 2026: what is going out and who it goes to are
       drawn together, so there is no Next between the dialog opening and the
       address being on screen. */
    await owner.waitForSelector('#share-send', { timeout: 10000 });
    const prefill = await owner.evaluate(() =>
      (document.getElementById('sh-email') || {}).value || '');
    check('E', 'the signing dialog is prefilled with the set-once address',
      prefill === ERIK, prefill);
    await owner.click('#share-send');
    await pause(2000); await ownerFlush();
    const shares2 = (await admin.json(`/api/contracts/${CID}/shares`)).shares || [];
    const signShare = shares2.find(s => s.purpose === 'sign');
    check('E', 'a signing link exists, separate from the standing link', !!signShare,
      shares2.map(s => s.purpose).join(','));
    await mailCheck('E', 2, 'the signing link is the second email — a link delivery again');

    // The standing negotiation link is now retired for answering.
    const gate = await admin.raw('/api/shares/' + token + '/respond', { method: 'POST', body: {
      v: 1, kind: 'hati-response', id: CID, action: 'decisions', name: 'Erik Lindqvist',
      negoDecisions: [{ id: 'CHG-001', status: 'rejected' }], at: new Date().toISOString() } });
    check('E', 'the standing link refuses new answers once signing begins', gate.status === 409,
      `status ${gate.status}`);

    // Erik signs through the signing link — typed signature, no OTP configured.
    await cp.goto('about:blank');
    await cp.goto(h.base + '/#share=t:' + signShare.token, { waitUntil: 'load' });
    await cp.waitForSelector('#pt-name', { timeout: 15000 });
    await pause(500);
    await cp.fill('#pt-name', 'Erik Lindqvist');
    const hasEmailField = await cp.$('#pt-email');
    if (hasEmailField) await cp.fill('#pt-email', ERIK);
    await cp.click('#pt-sign');
    await cp.waitForSelector('#sig-pad', { timeout: 10000 });
    await cp.click('[data-sig-tab="type"]');
    await cp.fill('#sig-typed', 'Erik Lindqvist');
    await pause(300);
    await cp.click('#sig-adopt-go');
    /* No mail provider on this server, so the page offers the unverified-sign
       confirmation — the signature is real, the record says it was not
       independently verified. */
    await cp.waitForSelector('#pt-unver-go', { timeout: 10000 });
    await cp.click('#pt-unver-go');
    await pause(2500);
    const signResp = ((await admin.json(`/api/contracts/${CID}/shares`)).shares || [])
      .find(s => s.token === signShare.token);
    check('E', 'Erik\'s signature reached the server', signResp && signResp.state === 'signed',
      signResp && signResp.state);

    // The owner's open workspace applies the countersignature — nothing seals
    // yet, because the owner's own mark is still to come.
    await ownerPoll(); await pause(1200); await ownerFlush(); await pause(400);
    const mid = await admin.json('/api/contracts/' + CID);
    const cMid = mid.contract || mid;
    check('E', 'Erik\'s signature is on the owner\'s record', (cMid.signatures || [])
      .some(s => s.party === 'counterparty'), `${(cMid.signatures || []).length} signature(s)`);
    check('E', 'and the contract is not sealed on his mark alone', cMid.status !== 'Signed', cMid.status);

    // The owner countersigns LAST, through the real sign panel: consent, Sign,
    // the signature pad, adopt.
    await owner.evaluate(id => { openWorkspace(id); }, CID);
    await owner.waitForSelector('[data-comp="consent"]', { state: 'attached', timeout: 10000 });
    await owner.evaluate(() => { const b = document.querySelector('[data-comp="consent"]');
      if (b && !b.checked) b.click(); });
    await pause(600);
    await owner.waitForSelector('#sign-btn:not([disabled])', { state: 'attached', timeout: 10000 });
    await owner.evaluate(() => document.getElementById('sign-btn').click());
    await owner.waitForSelector('#sig-pad', { timeout: 10000 });
    await owner.click('[data-sig-tab="type"]');
    await owner.fill('#sig-typed', 'Wanjiru Kamau');
    await pause(300);
    await owner.click('#sig-adopt-go');
    await pause(2500); await ownerFlush(); await pause(600);

    const record = await admin.json('/api/contracts/' + CID);
    const c = record.contract || record;
    check('E', 'the last signature executed the contract', c.status === 'Signed',
      `status=${c.status}, signatures=${(c.signatures || []).length}`);
    check('E', 'the seal is written', !!c.hash && c.hash !== 'null', String(c.hash).slice(0, 18));

    const mails = await mailToErik();
    const finalMail = mails.find(m => /Fully executed/i.test(String(m.subject)));
    check('E', 'the final email went to Erik automatically', !!finalMail,
      mails.map(m => m.subject).join(' | '));
    check('E', 'and it carries his door to the signed copy', !!finalMail
      && /#share=/.test(String(finalMail.body)), finalMail && finalMail.body
        && (String(finalMail.body).match(/#share=[\w:]+/) || [])[0]);
    check('E', 'emails to Erik, whole negotiation: 3 (link, signing link, signed copy)',
      mails.length === 3, `${mails.length}`);

    // The standing link is dead for action, alive for reading the sealed copy.
    const after = await admin.raw('/api/shares/' + token);
    check('E', 'the standing link still opens (he may read what was agreed)', after.status === 200);
    check('E', 'but reports the deal as executed', !!(after.json && after.json.executed));
    const deadAct = await admin.raw('/api/shares/' + token + '/respond', { method: 'POST', body: {
      v: 1, kind: 'hati-response', id: CID, action: 'decisions', name: 'Erik Lindqvist',
      negoDecisions: [{ id: 'CHG-001', status: 'rejected' }], at: new Date().toISOString() } });
    check('E', 'and refuses every action', deadAct.status === 409, `status ${deadAct.status}`);

    await cp.goto('about:blank');
    await cp.goto(h.base + '/#share=t:' + token, { waitUntil: 'load' });
    await pause(1500);
    const sealedText = await bodyText(cp);
    check('E', 'his page says the wording is final', /executed and sealed|wording is final/i.test(sealedText));
    check('E', 'and offers nothing to press', !(await cp.$('[data-nego-accept]')) && !(await cp.$('#pt-nego-send')));
    await cp.screenshot({ path: path.join(OUT, 'end-sealed.png') });
  }

  await browser.close();
  await h.stop();

  const failed = results.filter(r => !r.pass);
  console.log(`\n==== AUDIT: ${results.length - failed.length}/${results.length} checks passed ====`);
  if (failed.length){
    console.log('GAPS:');
    for (const g of failed) console.log(`  [R${g.round}] ${g.name} — ${g.detail}`);
    process.exit(1);
  }
  process.exit(0);
})().catch(e => { console.error('DRIVER ERROR:', e); process.exit(2); });
