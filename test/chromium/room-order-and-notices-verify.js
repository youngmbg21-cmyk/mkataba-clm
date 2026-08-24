/* Chromium verification: THE CONTRACT ROOM — ORDER, NOTICES, AND THE TAB ROW.
   ============================================================
   Three things asked for together (Young, 12 Aug 2026), all measured on the
   real page because none of them can be answered without a box model.

   1  DECIDED CHANGES SINK. On the All tab a change decided rounds ago could sit
      above one still waiting for an answer. It is a SORT and not a filter, so
      what is checked is both halves: the order moved, and the counts did not.

   2  NOTHING BANDS THE TOP OF THE CONTRACT. Not on the Document tab, not on
      Negotiate, on either side. The notices float bottom-right instead. Proved
      by SCANNING the strip between the tab row and the first word of the
      agreement for anything page-wide — a rule that names its offenders one by
      one is a rule the next band walks around — and then by opening the stack
      and reading the sentences back, because a message that moved somewhere
      nobody can reach has been lost, not moved.

   3  THE DOCUMENT TAB'S CONTROLS ARE VISIBLE PIXELS. The text-size stepper and
      Open Negotiate went missing from that corner and came back later on the
      same contract: the slot was built once per render from whichever tab
      happened to be current then. The reproduction is driven here, in order,
      and the controls are measured rather than merely found.

   Screenshots go to test/chromium/shots/room-order-and-notices/.
   Run: node test/chromium/room-order-and-notices-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'room-order-and-notices');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* ---- WHAT COUNTS AS A BAND ----
   Anything in the vertical strip between the bottom of the tab row and the top
   of the paper that is wide enough to read as a band across the page and tall
   enough to see. Deliberately generic: naming the offenders one at a time is
   how the next one gets in. */
const BAND_SCAN = `(() => {
  const page = document.documentElement.getBoundingClientRect();
  const row = document.querySelector('.room-tabrow') || document.querySelector('.rl-tabrow');
  const paper = document.querySelector('.nego-doc, .m-paper, #doc-canvas, .rl-paper-head')
    || document.querySelector('#rl-doc') || document.querySelector('#doc-scroll');
  if (!row || !paper) return { scanned: false };
  const top = row.getBoundingClientRect().bottom;
  const bottom = paper.getBoundingClientRect().top;
  const bands = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.height < 9 || r.width < page.width * 0.6) return;      // not band-shaped
    if (r.top < top - 1 || r.bottom > bottom + 1) return;        // not in the strip
    if (el.querySelector('*')) {                                  // report the innermost only
      const inner = Array.from(el.querySelectorAll('*')).some(k => {
        const kr = k.getBoundingClientRect();
        return kr.height >= 9 && kr.width >= page.width * 0.6
          && kr.top >= top - 1 && kr.bottom <= bottom + 1;
      });
      if (inner) return;
    }
    bands.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0])
      + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)
      + ' — ' + (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60));
  });
  return { scanned: true, top: Math.round(top), bottom: Math.round(bottom), bands };
})()`;

const seen = `(el => { if (!el) return null; const r = el.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), on: r.width > 0 && r.height > 0 }; })`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---- a round with one of every state on it ---- */
    const built = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status === 'Under Review') || state.contracts[0];
      state.activeId = c.id; state.selId = c.id;
      negoInit(c);
      const cl = negoClauseList(c);
      /* Four clauses is the minimum this fixture needs; a contract with fewer
         would silently file fewer changes and prove less than it claims. */
      if (cl.length < 4) return { id: c.id, ids: [], clauses: cl.length };
      const file = (i, side, text, summary) => negoEditClause(c, cl[i].clauseId, `<p>${text}</p>`,
        { side, author: side === 'owner' ? 'Wanjiru Kamau' : 'Erik Lindqvist', summary });
      /* Filed oldest first, so filing order and the order asked for differ. */
      await file(0, 'counterparty', 'Payment falls due within forty-five (45) days.', 'Net-45');
      await file(1, 'counterparty', 'Either party may terminate on ninety (90) days notice.', 'Notice to 90');
      await file(2, 'counterparty', 'The cap is limited to the fees paid.', 'Cap to fees paid');
      await file(3, 'owner', 'Certificates are furnished each quarter.', 'Certificates quarterly');
      const chs = negoChanges(c);
      /* first ADOPTED (settled), second REFUSED (decided, still blocking),
         third and fourth left on the table */
      negoResolve(c, chs[0].id, 'accepted', { by: 'Wanjiru Kamau' });
      negoResolve(c, chs[1].id, 'rejected', { by: 'Wanjiru Kamau' });
      persist(c);
      return { id: c.id, ids: chs.map(x => x.id) };
    });
    console.log('   fixture: ' + built.id + ' — ' + built.ids.join(', '));
    if (!built.ids.length){
      check('the fixture contract has enough clauses to file four changes on',
        false, `only ${built.clauses} clauses`);
      throw new Error('fixture too small');
    }

    /* ================= 1. DECIDED CHANGES SINK ============================= */
    await page.evaluate(id => openRedlineWorkbench(id), built.id);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(OUT, '01-negotiate.png') });

    const order = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#rl-changes [data-nego-card]')]
        .map(e => e.getAttribute('data-nego-card'));
      const ids = window.redlineCardIds ? redlineCardIds(getContract(state.activeId), { side: 'owner' }) : [];
      const byId = {};
      negoChanges(getContract(state.activeId)).forEach(x => { byId[x.id] = x; });
      return { cards, ids, states: cards.map(id => (byId[id] || {}).status + (byId[id] && byId[id].withdrawn ? '/withdrawn' : '')) };
    });
    check('the column and the pill\'s own list are the same list, in the same order',
      JSON.stringify(order.cards) === JSON.stringify(order.ids),
      `cards ${order.cards.join(',')} · ids ${order.ids.join(',')}`);
    /* Pending before refused, refused before anything adopted — and nothing
       still awaiting an answer may sit under something decided. */
    const rank = s => (s === 'pending' ? 0 : s === 'rejected' ? 1 : 2);
    const ranks = order.states.map(rank);
    check('nothing still awaiting an answer sits under a decided change',
      ranks.every((r, i) => i === 0 || ranks[i - 1] <= r),
      order.cards.map((id, i) => `${id}:${order.states[i]}`).join(' · '));

    /* ---- RE-POINTED 24 Aug 2026, claim unchanged ----
       The All / Mine / Theirs control became a DROPDOWN on the owner's ask,
       so reading it as three chips reported a fault that was not there. What
       this check is really about is untouched and is what it still asks: the
       filter offers all three cuts and every one carries its OWN count, so a
       sort can never be mistaken for something that hides a change. */
    const counts = await page.evaluate(() => {
      const sel = document.querySelector('#rl-cardfilter, [data-rl-cardfilter]');
      const opts = sel && sel.options
        ? [...sel.options].map(o => o.textContent.replace(/\s+/g, ' ').trim())
        : [...document.querySelectorAll('[data-rl-cardfilter]')]
            .map(b => b.textContent.replace(/\s+/g, ' ').trim());
      const c = getContract(state.activeId);
      const all = redlineCardIds(c, { side: 'owner', countAll: true }).length;
      return { chips: opts, all };
    });
    check('the All / Mine / Theirs cuts are untouched — this is a sort, not a filter',
      counts.chips.length >= 3 && counts.chips.every(t => /\d/.test(t)),
      counts.chips.join(' | '));
    check('and the column still holds every card the record says it should',
      order.cards.length === counts.all, `${order.cards.length} of ${counts.all}`);

    /* the counterparty's own column, where settled cards genuinely stay */
    const theirs = await page.evaluate(() => {
      const c = getContract(state.activeId);
      const held = negoChanges(c).filter(x => x.authorSide === 'owner').map(x => x.id);
      const opts = { side: 'counterparty', holdsDecisions: true, heldDecisionIds: held,
        sentDecisionIds: [], hiddenIds: [] };
      const ids = redlineCardIds(c, opts);
      const d = document.createElement('div');
      d.innerHTML = redlineChangeCardsHtml(c, opts);
      const cards = [...d.querySelectorAll('[data-nego-card]')].map(e => e.getAttribute('data-nego-card'));
      return { ids, cards };
    });
    check('the counterparty\'s column agrees with its own pill too',
      JSON.stringify(theirs.ids) === JSON.stringify(theirs.cards),
      `${theirs.ids.join(',')} vs ${theirs.cards.join(',')}`);

    /* ================= 2. NO BANDS ON NEGOTIATE =========================== */
    const negoBands = await page.evaluate(BAND_SCAN);
    check('Negotiate: nothing bands the strip between the tabs and the contract',
      negoBands.scanned && negoBands.bands.length === 0,
      negoBands.scanned ? (negoBands.bands.join(' | ') || 'clear') : 'could not scan');

    const negoStack = await page.evaluate(([s]) => {
      const seenFn = eval(s);
      return { band: seenFn(document.getElementById('nego-ready-signal')),
        bell: seenFn(document.querySelector('#rl-notices [data-rl-notices-open]')),
        stackRight: (() => { const el = document.getElementById('rl-notices');
          if (!el) return null; const r = el.getBoundingClientRect();
          return Math.round(window.innerWidth - r.right); })() };
    }, [seen]);
    check('and the readiness signal is not a band any more',
      !negoStack.band || !negoStack.band.on, JSON.stringify(negoStack.band));

    /* the readiness signal, moved and still readable */
    await page.evaluate(() => {
      const c = getContract(state.activeId);
      negoChanges(c).forEach(x => { if (x.status === 'pending' || x.status === 'rejected')
        negoResolve(c, x.id, 'accepted', { by: x.authorSide === 'owner' ? 'Erik Lindqvist' : 'Wanjiru Kamau',
          side: x.authorSide === 'owner' ? 'counterparty' : undefined }); });
      negoSignalReady(c, { side: 'counterparty', by: 'Erik Lindqvist' });
      renderRedline();
    });
    await page.waitForTimeout(900);
    /* ---- REVERSED IN PLACE TWICE, 23 Aug 2026, owner-asked ----
       First: the signal used to arrive FOLDED behind a floating bell, and the
       check pressed the bell to get the sentence back. Then the bell became a
       door onto the workspace alerts panel and the notices drew in place.
       NOW NOTHING FLOATS AT ALL ("I do not want anything floating over the
       page"), so the readiness card has left this page — and the SUBJECT of
       these checks is unchanged, because it was never "there is a card": it
       was that a reader on this page learns their counterparty is ready, and
       that the fact does not band the top of the contract.

       THREE SURFACES CARRY IT AND TWO ARE ON THIS SCREEN, which is why the
       card could go: the head's own status word (cpReadyToSign) and the alerts
       panel's cp-ready row. The third is the ACT, and it is deliberately not
       here — this head's slot is filled by the round's own verbs, so the act
       is offered on the contract room's head instead, which section 3 pins. */
    const signalled = await page.evaluate(([s]) => {
      const seenFn = eval(s);
      const st = document.getElementById('ws-status');
      return { floatingCard: seenFn(document.getElementById('nego-ready-signal')),
        floatingBell: seenFn(document.querySelector('#rl-notices .rl-notices-fab')),
        status: st ? st.textContent.replace(/\s+/g, ' ').trim() : '',
        headBell: seenFn(document.getElementById('hdr-notify')),
        panelRow: (window.buildAlerts ? buildAlerts() : [])
          .filter(a => a && a.kind === 'cp-ready').length };
    }, [seen]);
    await page.screenshot({ path: path.join(OUT, '02-negotiate-notices.png') });
    check('nothing floats over the contract to say they are ready',
      !signalled.floatingCard && !signalled.floatingBell,
      JSON.stringify({ card: signalled.floatingCard, bell: signalled.floatingBell }));
    check('the head says it in words instead, on the row with the contract\'s name',
      /ready to sign/i.test(signalled.status), signalled.status.slice(0, 110));
    check('the workspace bell is the door, and it carries the row',
      !!signalled.headBell && signalled.headBell.on && signalled.panelRow === 1,
      JSON.stringify({ bell: signalled.headBell, rows: signalled.panelRow }));
    check('the bands did not come back with it',
      (await page.evaluate(BAND_SCAN)).bands.length === 0);

    /* ================= 3. NO BANDS ON THE DOCUMENT TAB ==================== */
    await page.evaluate(id => openWorkspace(id), built.id);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(OUT, '03-document.png') });
    const docBands = await page.evaluate(BAND_SCAN);
    check('Document: nothing bands the strip between the tabs and the paper',
      docBands.scanned && docBands.bands.length === 0,
      docBands.scanned ? (docBands.bands.join(' | ') || 'clear') : 'could not scan');

    /* ---- REVERSED IN PLACE 23 Aug 2026, owner-asked: nothing floats ----
       These three checks pinned a floating stack in the bottom-right corner of
       this tab holding a "ready to sign" strip and the edited-working-text
       note. THREE CARDS RETIRED and the stack came down into the flow, above
       the panes and below the tab row.

       WHAT EACH CHECK WAS REALLY ABOUT SURVIVES, which is why they are reversed
       rather than deleted: the readiness fact still reaches this tab (the head
       says it and the lead act offers it — the SAME two surfaces the negotiate
       page uses, so the two screens cannot come to disagree), the working-text
       note is still off the paper, and nothing overlaps the contract. */
    const docStack = await page.evaluate(([s]) => {
      const seenFn = eval(s);
      const stack = document.getElementById('ws-notices');
      const panes = document.getElementById('ws-panes') || document.querySelector('.ws-pane');
      const sr = stack ? stack.getBoundingClientRect() : null;
      const pr = panes ? panes.getBoundingClientRect() : null;
      const st = document.getElementById('ws-status');
      return { stack: seenFn(stack),
        aboveThePanes: !!(sr && pr) ? sr.bottom <= pr.top + 1 : null,
        ready: seenFn(document.getElementById('ready-strip')),
        working: !!(stack && stack.querySelector('#ws-working-note')),
        status: st ? st.textContent.replace(/\s+/g, ' ').trim() : '',
        act: seenFn(document.querySelector('#ws-next-action[data-na="issue-signing"]')),
        actSays: (document.getElementById('ws-next-action') || {}).textContent || '',
        onPaper: !!document.querySelector('#doc-zoom [data-anchor="recital"]') };
    }, [seen]);
    check('nothing floats over the Document tab either',
      !docStack.ready && !docStack.working,
      JSON.stringify({ ready: docStack.ready, working: docStack.working }));
    check('and where the room does have a notice, it draws above the panes',
      !docStack.stack || docStack.aboveThePanes === true,
      docStack.stack ? `aboveThePanes=${docStack.aboveThePanes}` : 'no notice on this contract');
    check('this tab says it in words AND offers the act, where the card used to',
      /ready to sign/i.test(docStack.status) && !!docStack.act && docStack.act.on,
      JSON.stringify({ status: docStack.status,
        act: docStack.actSays.replace(/\s+/g, ' ').trim() }));
    check('and the "edited working text" note is still off the paper',
      !docStack.onPaper, `onPaper=${docStack.onPaper}`);

    /* ================= 4. THE TAB ROW'S CONTROLS ========================== */
    /* The reported sequence, in order: sit on Key terms, let the room render,
       then press Document. Before the fix that corner came up empty. */
    const journey = [];
    const cornerNow = () => page.evaluate(([s]) => {
      const seenFn = eval(s);
      return { tab: (document.querySelector('#ws-tabs .on') || {}).textContent || '',
        stepper: seenFn(document.querySelector('.room-tabrow .rl-type-step')),
        toNego: seenFn(document.getElementById('ws-to-nego')) };
    }, [seen]);
    journey.push(['arrived on the room', await cornerNow()]);
    await page.evaluate(() => document.querySelector('[data-ws-tab="terms"]').click());
    await page.waitForTimeout(500);
    journey.push(['on Key terms', await cornerNow()]);
    await page.evaluate(id => openWorkspace(id), built.id);     // the room re-renders under them
    await page.waitForTimeout(1300);
    journey.push(['room re-rendered while on Key terms', await cornerNow()]);
    await page.evaluate(() => document.querySelector('[data-ws-tab="docs"]').click());
    await page.waitForTimeout(700);
    const back = await cornerNow();
    journey.push(['pressed Document', back]);
    await page.screenshot({ path: path.join(OUT, '04-tabrow.png') });

    check('the stepper is visible pixels on the Document tab, after switching to it',
      !!back.stepper && back.stepper.on, JSON.stringify(back.stepper));
    check('and so is Open Negotiate — the corner the reader found empty',
      !!back.toNego && back.toNego.on, JSON.stringify(back.toNego));
    const onTerms = journey.find(j => j[0] === 'room re-rendered while on Key terms')[1];
    check('and they are correctly absent on a tab that is not Document',
      (!onTerms.stepper || !onTerms.stepper.on) && (!onTerms.toNego || !onTerms.toNego.on),
      onTerms.tab);

    /* AND THE DOOR STILL WORKS EXACTLY ONCE. Repainting a slot on every tab
       press is how a handler comes to be added twice. */
    const pressed = await page.evaluate(async () => {
      for (const k of ['terms', 'docs', 'sign', 'docs', 'history', 'docs']){
        document.querySelector(`[data-ws-tab="${k}"]`).click();
        await new Promise(r => setTimeout(r, 90));
      }
      let opens = 0;
      const real = window.openRedlineWorkbench;
      window.openRedlineWorkbench = () => { opens++; };
      document.getElementById('ws-to-nego').click();
      await new Promise(r => setTimeout(r, 200));
      window.openRedlineWorkbench = real;
      return opens;
    });
    check('after six tab presses the door still fires exactly once',
      pressed === 1, `${pressed} time(s)`);

    check('no page errors on the desktop journey', errors.length === 0,
      errors.join(' | ') || 'clean');
    /* Minted here, while a signed-in owner is still on the page. The link is
       then opened in a context that has never signed in, because a browser
       carrying an owner session renders the app and not the portal. */
    const token = await page.evaluate(async id => {
      const c = getContract(id);
      const payload = await buildSharePayload(c, 'deadbeef', null, { purpose: 'negotiate' });
      const r = await api('shares', 'POST', { payload, channel: 'link',
        recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' },
        expiryDays: 14, durable: true, purpose: 'negotiate' });
      return r.token;
    }, built.id);
    await ctx.close();

    /* ================= 5. THE COUNTERPARTY'S PAGE ========================= */
    /* Their wall line is the ONE deliberate exception and must still be there:
       it says their decisions stay on the page until they press Send, and a
       reader who has not read it answers under a false idea of what a click
       does. Everything else must have left the top. */
    const cctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const cpage = await cctx.newPage();
    const cerrors = [];
    cpage.on('pageerror', e => cerrors.push(e.message));
    await cpage.goto(`${h.base}/#share=t:${token}`, { waitUntil: 'networkidle' });
    await cpage.waitForTimeout(2800);
    await cpage.screenshot({ path: path.join(OUT, '05-counterparty.png') });
    const cp = await cpage.evaluate(([s]) => {
      const seenFn = eval(s);
      const wall = document.querySelector('#rl-banner .rl-wall');
      return { wall: seenFn(wall), said: wall ? wall.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) : '',
        readyBand: seenFn(document.getElementById('nego-ready-signal')),
        /* ON THE PAGE, not merely in the document. The signal now lives inside
           a panel parked off the right-hand edge, and an element inside a
           translated container still reports a box — reading "it has a box" as
           "the reader can see it" is the exact fault the alerts panel's own
           checks are written around. So this asks whether it is inside the
           window. */
        readyOnPage: (() => { const el=document.getElementById('nego-ready-signal');
          if(!el) return false; const r=el.getBoundingClientRect();
          return r.width>0 && r.height>0 && r.left < innerWidth-1 && r.right > 1; })(),
        floatBell: seenFn(document.querySelector('[data-rl-notices-open]')),
        headBell: seenFn(document.getElementById('pt-bell')),
        panel: !!document.getElementById('pt-alerts'),
        inPanel: !!(document.getElementById('pt-alerts')
          && document.getElementById('nego-ready-signal')
          && document.getElementById('pt-alerts').contains(document.getElementById('nego-ready-signal'))) };
    }, [seen]);
    check('the counterparty still reads the wall line before they start',
      !!cp.wall && cp.wall.on && /until you press Send/i.test(cp.said), cp.said);
    /* ---- CLAIM UPDATED, 13 Aug 2026, OWNER-ASKED ----
       This used to read "the readiness signal is behind THEIR bell, like ours",
       and the bell it looked for was the floating amber one. On 13 August the
       counterparty's page got a bell of its own, in the header, with an alerts
       panel behind it — and two bells about one contract, both amber, is worse
       than none, so the floating one stood down on that page (and only there;
       the owner's workbench keeps its own, checked above).

       The SUBJECT of the check is unchanged and is why it is kept: the signal
       is not a band across the top of their contract, it is one press away.
       What moved is which press. */
    check('but the readiness signal is one press away, behind their header bell',
      !cp.readyOnPage && !!cp.headBell && cp.headBell.on && cp.inPanel,
      `on the page ${cp.readyOnPage}, head bell ${JSON.stringify(cp.headBell)}, in panel ${cp.inPanel}`);
    check('and there is only ONE bell on their page',
      !cp.floatBell || !cp.floatBell.on, JSON.stringify(cp.floatBell));
    check('no page errors on the counterparty page', cerrors.length === 0,
      cerrors.join(' | ') || 'clean');
    await cctx.close();

    /* ================= 6. THE PHONE ======================================= */
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const mpage = await mctx.newPage();
    const merrors = [];
    mpage.on('pageerror', e => merrors.push(e.message));
    await mpage.goto(h.base + '/', { waitUntil: 'networkidle' });
    await mpage.waitForTimeout(600);
    await mpage.fill('#li-email', 'admin@example.co.ke');
    await mpage.fill('#li-pass', 'adminpassword1');
    await mpage.click('#li-go');
    await mpage.waitForTimeout(2600);
    const phone = await mpage.evaluate(([id, s]) => {
      const seenFn = eval(s);
      /* An EXECUTED contract, because its "sealed" notice is the one phone
         notice that is true unconditionally — a fixture that happened to have
         nothing to say would let this section pass without testing anything. */
      const c = state.contracts.find(x => x.status === 'Signed') || getContract(id);
      state.activeId = c.id;
      window.mGo('contract');
      const stack = document.getElementById('m-notices');
      const paper = document.querySelector('.m-paper');
      const bell = document.querySelector('#m-notices [data-rl-notices-open]');
      const r = stack ? stack.getBoundingClientRect() : null;
      const pr = paper ? paper.getBoundingClientRect() : null;
      return { any: !!stack, bell: seenFn(bell),
        aboveThePaper: !!(r && pr && r.bottom <= pr.top),
        fromBottom: r ? Math.round(window.innerHeight - r.bottom) : null,
        inFlowNotice: !!document.querySelector('.m-scroll > .m-notice'),
        contract: !!c };
    }, [built.id, seen]);
    await mpage.screenshot({ path: path.join(OUT, '06-phone.png') });
    check('the phone draws no notice in flow above the contract',
      !phone.inFlowNotice, `inFlow=${phone.inFlowNotice}`);
    check('its notices float, with a bell a thumb can hit, clear of the launcher',
      phone.any && !!phone.bell && phone.bell.on && phone.bell.h >= 44 && phone.fromBottom > 90,
      `${JSON.stringify(phone.bell)} · ${phone.fromBottom}px up from the bottom`);
    const mopen = await mpage.evaluate(() => {
      document.querySelector('#m-notices [data-rl-notices-open]').click();
      return new Promise(r => setTimeout(() => {
        const st = document.getElementById('m-notices');
        r({ said: st ? st.textContent.replace(/\s+/g, ' ').trim() : '',
          cards: st ? st.querySelectorAll('.m-notice').length : 0 });
      }, 300));
    });
    await mpage.screenshot({ path: path.join(OUT, '07-phone-open.png') });
    check('and pressing the bell gives the phone reader the sentence back',
      mopen.cards > 0 && mopen.said.length > 20, mopen.said.slice(0, 90));
    check('no page errors on the phone', merrors.length === 0, merrors.join(' | ') || 'clean');
    await mctx.close();
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) { console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
