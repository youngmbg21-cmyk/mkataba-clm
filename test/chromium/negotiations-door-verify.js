/* Chromium verification: NEGOTIATE IS A PLACE, NOT A TAB.
   ============================================================
   Owner's design, 12 Aug 2026. Negotiate left the contract room's tab row and
   became a door in the sidebar; the way in is Open Negotiate on the Document
   tab, and the way out is the head's back arrow.

   WHY THIS IS A BROWSER FILE AND NOT A NODE TEST. Every rule here is about
   PIXELS AND JOURNEYS, and jsdom can report neither:

     · a door is only a door if it is on screen and pressable — jsdom will
       happily click a button with no box, which is exactly how the
       counterparty's page shipped for a week with no way to answer (f180);
     · "four tabs" is a claim about what a reader SEES on the contract page and
       about what they see on the negotiation page, which is nothing;
     · the loop — Document → Negotiate → back to Document → and the sidebar door
       reopens it — is four navigations through the real shell, with the real
       router, the real repaints and the real memory in localStorage;
     · the sidebar count is written by updateSidebarCounts on every view change,
       and its value has to survive those repaints.

   And one rule that can ONLY be checked here: counting must not start a
   negotiation. The sidebar count runs over every contract in the workspace on
   every view change, and negoInit() creates a negotiation on any contract that
   has none. The node test proves the function is safe; this proves the running
   app never trips it.

   Screenshots go to test/chromium/shots/negotiations-door/.
   Run: node test/chromium/negotiations-door-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'negotiations-door');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* A box, and whether it is really on screen. Not `offsetParent`, not a class:
   a control hidden by a cascade fight still has an offsetParent. */
const SEEN = `(sel => { const el = document.querySelector(sel); if (!el) return null;
  const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
  return { w: Math.round(r.width), h: Math.round(r.height),
    on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none',
    text: (el.textContent || '').trim().slice(0, 60) }; })`;

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

    /* ---- 1. THE DOOR IS IN THE SIDEBAR, SECOND ---- */
    const door = await page.evaluate(seen => {
      const b = document.querySelector('.nav-item[data-view="redline"]');
      const items = [...document.querySelectorAll('#nav .nav-item[data-view]')]
        .filter(el => !el.classList.contains('hidden'))
        .map(el => el.getAttribute('data-view'));
      return { box: eval(seen)('.nav-item[data-view="redline"]'), order: items,
        label: b ? (b.querySelector('[data-i18n="nav_negotiations"]') || {}).textContent : null };
    }, SEEN);
    check('the sidebar carries a Negotiations door', !!door.box && door.box.on,
      door.box ? `${door.box.w}x${door.box.h}` : 'missing');
    check('it reads Negotiations — a noun among nouns', door.label === 'Negotiations', door.label);
    check('and it sits directly under Contracts',
      door.order.indexOf('redline') === door.order.indexOf('register') + 1,
      door.order.join(' › '));

    await page.screenshot({ path: path.join(OUT, '01-sidebar.png') });

    /* ---- 2. THE CONTRACT ROOM SHOWS FOUR TABS AND NO NEGOTIATE ---- */
    const cid = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      openWorkspace(c.id); return c.id;
    });
    await page.waitForTimeout(1200);
    const tabs = await page.evaluate(() =>
      [...document.querySelectorAll('#ws-tabs .room-tab')].map(b => b.textContent.trim()));
    check('the room shows four tabs', tabs.length === 4, tabs.join(' | '));
    check('and Negotiate is not one of them', !tabs.some(t => /Negotiat/i.test(t)), tabs.join(' | '));

    /* ---- 3. THE DOOR IN IS ON THE DOCUMENT TAB, AND IT DOES NOT HIDE ---- */
    await page.evaluate(id => roomGoTab(getContract(id), 'docs'), cid);
    await page.waitForTimeout(700);
    const fresh = await page.evaluate(seen => eval(seen)('#ws-to-nego'), SEEN);
    check('the Document tab offers a door even with nothing filed yet',
      !!fresh && fresh.on, fresh ? `${fresh.text} ${fresh.w}x${fresh.h}` : 'MISSING — a draft with no way in');
    check('and its word says the negotiation has not started',
      !!fresh && /Start negotiating/i.test(fresh.text), fresh && fresh.text);
    await page.screenshot({ path: path.join(OUT, '02-document-tab.png') });

    /* File one ask from the other side, so the state — and the word — moves.
       The wait is not padding: negoFileChange returns before the change is on
       the record (it settles through the funnel's own save), so probing in the
       same turn reads the page as it was a moment ago. */
    await page.evaluate(id => {
      const c = getContract(id);
      negoInit(c);
      negoFileChange(c, { clauseId: (clauseSegment(negoBaseBody(c))[0] || {}).id || 'c1',
        kind: 'edit', authorSide: 'counterparty', author: 'Erik Lindqvist',
        before: 'thirty (30) days', after: 'sixty (60) days', why: 'Our cycle runs monthly.' });
    }, cid);
    await page.waitForTimeout(1400);
    await page.evaluate(id => roomGoTab(getContract(id), 'docs'), cid);
    await page.waitForTimeout(600);
    const running = await page.evaluate(seen => eval(seen)('#ws-to-nego'), SEEN);
    check('once something is on the table the door says how much is waiting',
      !!running && /Open Negotiate/i.test(running.text) && /1 waiting/i.test(running.text),
      running && running.text);

    /* ---- 4. THE SIGNAL THE TAB'S COUNT USED TO CARRY ---- */
    await page.evaluate(id => roomGoTab(getContract(id), 'terms'), cid);
    await page.waitForTimeout(700);
    const onTerms = await page.evaluate(seen => eval(seen)('#ws-round-needs'), SEEN);
    check('a reader standing on Key terms still learns an answer is owed',
      !!onTerms && onTerms.on && /needs you/i.test(onTerms.text),
      onTerms ? onTerms.text : 'MISSING — the tab count vanished with the tab');
    await page.screenshot({ path: path.join(OUT, '03-key-terms-signal.png') });

    /* ---- 5. IN, AND THE PAGE HAS NO TABS ---- */
    await page.evaluate(id => roomGoTab(getContract(id), 'docs'), cid);
    await page.waitForTimeout(600);
    await page.click('#ws-to-nego');
    await page.waitForTimeout(1600);
    const inside = await page.evaluate(seen => ({
      view: state.view,
      tabs: document.querySelectorAll('#view-redline #ws-tabs .room-tab').length,
      back: eval(seen)('#view-redline #ws-back'),
      title: eval(seen)('#view-redline #ws-back-title'),
      navOn: [...document.querySelectorAll('#nav .nav-item.active')].map(b => b.getAttribute('data-view')),
    }), SEEN);
    check('pressing it lands on the negotiation screen', inside.view === 'redline', inside.view);
    check('which draws no room tabs at all', inside.tabs === 0, inside.tabs + ' tabs');
    check('the back arrow is on screen — the only way off the page',
      !!inside.back && inside.back.on, inside.back ? `${inside.back.w}x${inside.back.h}` : 'MISSING');
    check('and the contract name beside it is a door too',
      !!inside.title && inside.title.on, inside.title ? inside.title.text : 'MISSING');
    check('the sidebar lights Negotiations, not Contracts',
      inside.navOn.join(',') === 'redline', inside.navOn.join(',') || 'nothing lit');
    await page.screenshot({ path: path.join(OUT, '04-negotiation-screen.png') });

    /* ---- 6. THE SIDEBAR COUNT ---- */
    const count = await page.evaluate(() => {
      const el = document.querySelector('[data-count="negotiations"]');
      return { text: el ? el.textContent.trim() : null, tone: el ? el.getAttribute('data-tone') : null };
    });
    check('the door counts what is waiting on you, in amber',
      count.text === '1' && count.tone === 'amber', `${count.text} / ${count.tone}`);

    /* ---- 7. OUT, AND IT LANDS ON DOCUMENT ---- */
    await page.click('#view-redline #ws-back');
    await page.waitForTimeout(1500);
    const out = await page.evaluate(() => ({ view: state.view, tab: roomCurrentTab(),
      tabs: [...document.querySelectorAll('#ws-tabs .room-tab')].map(b => b.textContent.trim()) }));
    check('the arrow returns to the agreement', out.view === 'workspace', out.view);
    check('on its Document tab, where the door in lives', out.tab === 'docs', out.tab);
    check('and the four tabs are back with it', out.tabs.length === 4, out.tabs.join(' | '));

    /* ---- 7b. AND THE ROOM'S OWN BACK ARROW GOES TO CONTRACTS, NEVER BACK
       INTO THE NEGOTIATION (owner-asked 17 Aug 2026: "it should always take
       me to the contracts page… never the negotiations page which sometimes
       it does"). This is exactly the journey that showed it: the room was
       reached FROM the negotiation page, so the old "wherever you came from"
       reading sent this press to the negotiations list. */
    const roomBack = await page.evaluate(() => {
      const b = document.getElementById('ws-back');
      const title = b ? (b.getAttribute('title') || '') : '';
      if (b) b.click();
      return { title, view: state.view };
    });
    check('7b the room\'s back arrow lands on the Contracts page',
      roomBack.view === 'register', roomBack.view);
    check('7b and its label says so', /contracts/i.test(roomBack.title), roomBack.title);

    /* ---- 8. THE DOOR OPENS THE LIST, FROM ANYWHERE ----
       REVERSED IN PLACE 24 Aug 2026 (WO-17, owner-asked: "when i click on the
       contracts tab on the nav panel, i get a list of contracts. This should be
       the same when i click on the negotiation tab"). It used to reopen the
       negotiation you were last in, which is why this is measured with one
       freshly remembered — the reopen would fire here if it were still there.
       THE MEMORY IS KEPT, NOT DELETED: negoRememberOpened still records and
       negoLastOpened still answers, so this is one argument to put back. */
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(900);
    await page.click('.nav-item[data-view="redline"]');
    await page.waitForTimeout(1600);
    const back = await page.evaluate(() => ({ view: state.view, held: redlineHeldId(),
      /* The list is the CONTRACTS TABLE under its own head — `.ngl-wrap` is
         the EMPTY state's wrapper and is not drawn on this path. */
      list: !!document.querySelector('.ngl-head-table') && !!document.querySelector('.reg-table'),
      remembered: typeof negoLastOpened === 'function' ? !!negoLastOpened() : null }));
    check('the sidebar door opens the list, even with one remembered',
      back.view === 'redline' && back.list && !back.held,
      `${back.view} / held ${back.held} / list ${back.list}`);
    check('and the memory is still recorded, so the reopen is one argument away',
      back.remembered === true, String(back.remembered));
    await page.screenshot({ path: path.join(OUT, '05-reopened.png') });

    /* ---- 9. AND THE LIST IS THE CONTRACTS TABLE ----
       Since 12 Aug 2026, grouped by whose move it is. Everything below is about
       pixels for the reason the header of this file gives: the bands have to be
       real full-width rows in the real table. Measured here with the memory
       CLEARED as well, so the shape is proved from both directions. */
    await page.evaluate(() => { try{ localStorage.removeItem(
      'hati.v1.lastNegotiation.' + (currentUser().id || currentUser().email)); }catch(e){} });
    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(800);
    await page.click('.nav-item[data-view="redline"]');
    await page.waitForTimeout(1400);
    const list = await page.evaluate(seen => ({
      head: eval(seen)('.ngl-head-table'),
      live: (document.querySelector('.ngl-live') || {}).textContent,
      table: eval(seen)('.reg-table'),
      cols: [...document.querySelectorAll('.reg-table thead th')]
        .map(t => t.textContent.replace(/[\u25b2\u25bc\u2195]/g, '').trim()),
      bands: [...document.querySelectorAll('#reg-tbody tr.ngl-band')].map(r => ({
        k: (r.querySelector('.ngl-band-k') || {}).textContent,
        n: (r.querySelector('.ngl-band-n') || {}).textContent,
        w: Math.round(r.getBoundingClientRect().width),
        role: r.getAttribute('role'),
        press: r.querySelectorAll('button,a,input').length,
        row: r.getAttribute('data-row'),
      })),
      rows: [...document.querySelectorAll('#reg-tbody tr[data-row]')].map(r => ({
        id: r.getAttribute('data-row'),
        w: Math.round(r.getBoundingClientRect().width),
        state: (r.querySelector('.ngl-w') || {}).textContent,
        hover: (r.querySelector('.ngl-w') || { getAttribute: () => null }).getAttribute('title') })),
      sub: document.querySelectorAll('.ngl-head-table p').length,
      lock: eval(seen)('#reg-lock-chip'),
      lockOut: document.querySelectorAll('#reg-lock-chip button').length,
      /* It IS the register now — the filter bar is the point, not the fault. */
      filters: document.querySelectorAll('#reg-stage-sel, #reg-type-sel, #reg-sort').length,
      showing: (document.querySelector('#reg-showing') || {}).textContent,
    }), SEEN);
    check('with nothing to reopen it lands on the table', !!list.table && list.table.on,
      list.table ? `${list.table.w}x${list.table.h}` : 'MISSING');
    check('the heading carries the page\'s own live count', /\b1 live\b/.test(list.live || ''), list.live);
    /* THE RESTING SUBTITLE IS GONE (owner-asked 25 Aug 2026, off a screenshot
       with it boxed: "delete the added words highlighted") — it described the
       page to a reader already looking at exactly that, the same call the
       Contracts page's own note lost under WO-2. THE FILTERED SENTENCE IS A
       DIFFERENT THING and is asserted in 9b: it resolves a contradiction (the
       door counts CHANGES, the bands count AGREEMENTS), so it draws only when
       there is a filter on to create one. */
    check('and nothing else — the resting head carries no subtitle',
      list.sub === 0, `${list.sub} paragraph(s)`);
    check('the columns are the Contracts table\'s, ending in Whose move',
      list.cols.length === 8 && list.cols[0] === 'MK' && /Whose move/i.test(list.cols[7] || ''),
      list.cols.join(' | '));
    check('three bands, in fixed order, each a full-width row of its own',
      list.bands.length === 3
        && /Waiting on you/i.test(list.bands[0].k || '')
        && /other side/i.test(list.bands[1].k || '')
        && /Nothing outstanding/i.test(list.bands[2].k || '')
        && list.bands.every(b => b.w > 400),
      list.bands.map(b => `${b.k} ${b.n} ${b.w}px`).join(' · '));
    check('and a band is not a row — nothing to press, nothing to open',
      list.bands.every(b => b.role === 'presentation' && b.press === 0 && !b.row),
      list.bands.map(b => `${b.role}/${b.press}`).join(' '));
    check('the live negotiation is a real, pressable row',
      list.rows.length === 1 && list.rows[0].id === cid && list.rows[0].w > 0,
      list.rows.map(r => `${r.id} ${r.w}px ${r.state}`).join(' · '));
    /* REVERSED IN PLACE 25 Aug 2026 (owner-asked, off a screenshot with this
       column ringed: "change the highlighted area to simply Mine, theirs,
       etc."). THE CLAIM IS UNCHANGED — the row still says the answer is owed
       to THIS reader — it just says it in one word, with the count it used to
       print on the hover. Asserted as a PAIR, because losing the sentence
       altogether is as much a failure as losing the word. */
    check('and it says the answer is owed to this reader — in one word',
      /^(Mine|Min)$/.test(((list.rows[0] || {}).state || '').trim()),
      (list.rows[0] || {}).state);
    check('with the count it replaced still readable on the hover',
      /needs you/i.test((list.rows[0] || {}).hover || ''), (list.rows[0] || {}).hover);
    check('the filter bar is there — this page IS the register now',
      list.filters === 3, list.filters + ' controls');
    /* REVERSED IN PLACE 24 Aug 2026 (WO-15, owner-asked: "delete the filters i
       have highlighted so all the filters can fit in one line"). The chip is
       gone from the bar. WHAT IT PINNED IS NOT LOST and is the stronger claim
       anyway: the narrowing is a property of the PAGE — regScope — not a filter
       a reader can press away, so there was never anything for that chip's
       missing ✕ to do. Asserted as the absence plus the scope, and 9b below
       presses Clear for real and proves the page does not widen. */
    check('no locked chip on the bar — the scope is the page, not a filter',
      !list.lock, list.lock ? `${list.lock.text} still drawn` : 'gone');
    check('and the footer counts contract rows, never a band',
      /1/.test(list.showing || '') && !/of 4/.test(list.showing || ''), list.showing);
    await page.screenshot({ path: path.join(OUT, '06-list.png') });

    /* ---- 9b. CLEAR CANNOT WIDEN THE PAGE ---- */
    await page.evaluate(() => { const R = regState(); R.stage = 'Draft'; regRepaint(); });
    await page.waitForTimeout(700);
    const narrowed = await page.evaluate(() => {
      const h = document.querySelector('.ngl-head-table');
      const p = h && h.querySelector('p');
      return { n: h ? h.querySelectorAll('p').length : -1, txt: p ? p.textContent.trim() : '' };
    });
    check('but a filter brings back the sentence that explains the two counts',
      narrowed.n === 1 && /\bdoor\b/i.test(narrowed.txt), `${narrowed.n}: ${narrowed.txt.slice(0, 90)}`);
    const cleared = await page.evaluate(() => {
      const b = document.getElementById('reg-clear-filters');
      if (b) b.click();
      return null;
    });
    void cleared;
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => ({
      scope: regScope(),
      rows: document.querySelectorAll('#reg-tbody tr[data-row]').length,
      total: state.contracts.length,
    }));
    check('pressing Clear puts the reader\'s filters back and leaves the page alone',
      after.scope === 'negotiations' && after.rows === 1 && after.rows < after.total,
      `${after.rows} of ${after.total} rows · scope ${after.scope}`);

    /* Pressing a row goes in — to the NEGOTIATION, not the contract page. */
    await page.click(`#reg-tbody tr[data-row="${cid}"]`);
    await page.waitForTimeout(1500);
    check('pressing a row opens that negotiation',
      await page.evaluate(() => redlineHeldId()) === cid);

    /* ---- 10. COUNTING NEVER STARTED A NEGOTIATION ----
       The whole journey above changed views a dozen times, and each one ran the
       sidebar count over every contract in the workspace. */
    const started = await page.evaluate(id => state.contracts
      .filter(c => c.id !== id && c.negotiation).map(c => c.id), cid);
    check('after the whole journey, no other contract has been given a negotiation',
      started.length === 0,
      started.length ? 'STARTED ON: ' + started.join(', ') : 'none — the count read without writing');

    /* ---- 11. THE PAGE'S OWN DOOR BACK TO THE LIST (owner-asked, 12 Aug 2026)
       Once you are inside a negotiation the sidebar is no use for reaching the
       list — it reopens the one you are standing in, which is what section 8
       above proves it is FOR. So the control row carries a way back, far left,
       reading "Live negotiations" with the live count beside it.

       This is a browser file for the reason the header gives: the loop is four
       real navigations, and the count has to survive the repaints on the way. */
    const backDoor = await page.evaluate(seen => {
      const b = document.querySelector('.redline-page [data-rl-live-list]');
      const row = document.querySelector('.redline-page .rl-tabrow');
      return { box: eval(seen)('.redline-page [data-rl-live-list]'),
        first: !!b && !!row && row.children[0] === b,
        last: (() => { const acts = document.querySelector('.rl-actions');
          return !!b && !!acts && acts.children[acts.children.length - 1] === b; })(),
        flush: (!b || !row) ? null : Math.round(b.getBoundingClientRect().left
          - row.getBoundingClientRect().left),
        n: ((document.querySelector('.rl-livelist-n') || {}).textContent || '').trim() };
    }, SEEN);
    check('the negotiation page carries a way back to the list',
      !!backDoor.box && backDoor.box.on, backDoor.box ? `${backDoor.box.text} ${backDoor.box.w}x${backDoor.box.h}` : 'MISSING');
    /* "All negotiations" since 22 Aug 2026 (owner-approved render). It named
       the POPULATION the count is of; the render names the DESTINATION, which
       is what a reader leaving is looking for. The count beside it is unchanged
       and is still the live list's own. */
    check('it reads All negotiations and carries the count',
      /All negotiations/.test(backDoor.box.text || '') && /^\d+$/.test(backDoor.n),
      `${backDoor.box.text} · count "${backDoor.n}"`);
    /* ---- CLAIM REVERSED IN PLACE 22 Aug 2026 ----
       It read "the FIRST thing on the control row, at its far left", which was
       right on 12 Aug when this row began with the acts. The design mock-up
       leads the row with the three reading tabs — they name what the paper
       below is showing — and ends it with the way out, so a door at the far
       left would sit ahead of the thing it is a way out OF.

       WHAT STILL MATTERS AND IS STILL PINNED: it is on the control row, it is
       the LAST thing on it, and (above) it says what it is and carries its
       count. Only the end of the line it sits at has changed. */
    check('and it ENDS the control row — the way out reads last',
      backDoor.last, `last=${backDoor.last}, ${backDoor.flush}px from the row's left`)

    /* Press it: the LIST, not the negotiation it was pressed from. */
    await page.click('[data-rl-live-list]');
    await page.waitForTimeout(1500);
    const landed = await page.evaluate(seen => ({
      table: eval(seen)('.reg-table'),
      live: ((document.querySelector('.ngl-live') || {}).textContent || '').trim(),
      held: redlineHeldId(),
    }), SEEN);
    check('pressing it lands on the list, not back on the negotiation',
      !!landed.table && landed.table.on, landed.table ? 'the table is drawn' : 'MISSING');
    check('and the count on the button was the count in the heading',
      landed.live.indexOf(backDoor.n) === 0, `button "${backDoor.n}" · heading "${landed.live}"`);
    await page.screenshot({ path: path.join(OUT, '07-live-list-door.png') });

    /* A SECOND live negotiation, deliberately started, so the loop has
       somewhere else to go and the count has to move. This is an authoring
       act — section 10 above has already proved that nothing STARTED one by
       merely counting. */
    const cid2 = await page.evaluate(one => {
      const c = state.contracts.find(x => x.id !== one && x.status !== 'Signed'
        && x.status !== 'Declined' && !x.negotiation);
      if (!c) return null;
      negoInit(c);
      negoFileChange(c, { clauseId: (clauseSegment(negoBaseBody(c))[0] || {}).id || 'c1',
        kind: 'edit', authorSide: 'counterparty', author: 'Erik Lindqvist',
        before: 'thirty (30) days', after: 'forty-five (45) days', why: 'Second one.' });
      return c.id;
    }, cid);
    await page.waitForTimeout(1600);
    check('a second negotiation exists to travel to', !!cid2, cid2 || 'none available');

    /* Back into the first one, and press the door again — the count has moved
       and the other agreement is on the list to open. */
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await page.waitForTimeout(1600);
    const two = await page.evaluate(() =>
      ((document.querySelector('.rl-livelist-n') || {}).textContent || '').trim());
    check('the door\'s count follows the book — two live now', two === '2', two);
    await page.click('[data-rl-live-list]');
    await page.waitForTimeout(1500);
    const both = await page.evaluate(() => ({
      live: ((document.querySelector('.ngl-live') || {}).textContent || '').trim(),
      rows: [...document.querySelectorAll('#reg-tbody tr[data-row]')].map(r => r.getAttribute('data-row')),
    }));
    check('and the heading still agrees with it', both.live.indexOf('2') === 0,
      `button "2" · heading "${both.live}"`);
    check('both live negotiations are on the list',
      both.rows.length === 2 && both.rows.includes(cid) && both.rows.includes(cid2),
      both.rows.join(', '));

    /* Open the OTHER one from the list, and press the door from there too. */
    await page.click(`#reg-tbody tr[data-row="${cid2}"]`);
    await page.waitForTimeout(1600);
    check('a row opens the other negotiation',
      await page.evaluate(() => redlineHeldId()) === cid2);
    await page.click('[data-rl-live-list]');
    await page.waitForTimeout(1500);
    check('and the door works from that one as well',
      await page.evaluate(() => !!document.querySelector('.reg-table')));

    /* AND THE WHOLE LOOP STARTED NOTHING. Section 10's claim, re-asked after
       four more navigations — the door reads negoLiveList over every contract
       in the workspace on every paint of the page. */
    const startedNow = await page.evaluate(ids => state.contracts
      .filter(c => !ids.includes(c.id) && c.negotiation).map(c => c.id), [cid, cid2]);
    check('the journey through the door started no negotiations of its own',
      startedNow.length === 0,
      startedNow.length ? 'STARTED ON: ' + startedNow.join(', ') : 'none — the count read without writing');
    await page.screenshot({ path: path.join(OUT, '08-two-live.png') });

    /* ---- 9. CHANGING THE THEME IS NOT A NAVIGATION ----
       Owner-reported, 13 Aug 2026: standing on the Negotiations list, pick a
       different colour and the platform lands you inside some contract's
       workbench instead. Driven through the REAL control — the theme button,
       its menu, a row in it — because the whole fault lived in what setTheme
       does after it flips the class: it repaints the current view, and this
       page could not tell that repaint apart from "open this contract". */
    await page.evaluate(() => openNegotiations({ list: true }));
    await page.waitForTimeout(900);
    const onList = await page.evaluate(() => ({
      list: !!document.querySelector('#reg-tbody'),
      held: window.redlineHeldId ? redlineHeldId() : 'n/a',
      active: state.activeId }));
    check('9 standing on the list, with a contract still named in state',
      onList.list && !onList.held && !!onList.active,
      `list ${onList.list} · held ${onList.held} · activeId ${onList.active}`);
    await page.screenshot({ path: path.join(OUT, '09-list-before-theme.png') });

    /* RE-POINTED 24 Aug 2026, not re-scoped: the claim is that a REPAINT is not
       a navigation — changing the workspace's appearance while standing on the
       list must not throw the reader into some contract's workbench. What
       changed is the control. The three-row menu became two axes, so the press
       that repaints is now the brand swatch, which is the nearest thing to the
       colour change this check has always made. */
    const themed = await page.evaluate(async () => {
      const was = document.documentElement.getAttribute('data-brand') || 'green';
      const other = was === 'navy' ? 'green' : 'navy';
      const sw = document.getElementById('brand-' + other);
      if (!sw) return { pressed: false };
      sw.click();
      await new Promise(r => setTimeout(r, 700));
      return { pressed: true, was, picked: other,
        brand: document.documentElement.getAttribute('data-brand') || 'green',
        dark: document.documentElement.classList.contains('dark') };
    });
    check('9 the theme control is real and a different colour was picked',
      themed.pressed && themed.picked, themed.pressed ? `${themed.was} → ${themed.picked}` : 'no control');
    await page.waitForTimeout(400);
    const afterTheme = await page.evaluate(() => ({
      list: !!document.querySelector('#reg-tbody'),
      bench: !!document.querySelector('.redline-page .rl-paper'),
      held: window.redlineHeldId ? redlineHeldId() : 'n/a',
      rows: document.querySelectorAll('#reg-tbody tr[data-row]').length,
      live: ((document.querySelector('.ngl-live') || {}).textContent || '').trim() }));
    await page.screenshot({ path: path.join(OUT, '10-list-after-theme.png') });
    check('9 THE READER IS STILL ON THE LIST — the reported fault',
      afterTheme.list && !afterTheme.bench,
      `list ${afterTheme.list} · a contract's sheet drawn: ${afterTheme.bench} · held ${afterTheme.held}`);
    check('9 and it is the whole list, repainted, not an empty one',
      afterTheme.rows >= 2 && /\d/.test(afterTheme.live),
      `${afterTheme.rows} rows · heading "${afterTheme.live}"`);
    /* THE OTHER HALF: the fix must not cost the journey it protects. From the
       repainted list, a row must still open its own negotiation. */
    await page.click(`#reg-tbody tr[data-row="${cid2}"]`);
    await page.waitForTimeout(1100);
    const stillOpens = await page.evaluate(() => ({
      held: window.redlineHeldId ? redlineHeldId() : null,
      bench: !!document.querySelector('.redline-page .rl-paper') }));
    check('9 and a row on the repainted list still opens its negotiation',
      stillOpens.held === cid2 && stillOpens.bench,
      `held ${stillOpens.held} (wanted ${cid2}) · sheet drawn ${stillOpens.bench}`);
    /* And a repaint of a BENCH keeps that bench — the same rule from the other
       side, which is the half a "always show the list" fix would have broken. */
    await page.evaluate(() => setTheme(themeNow() === 'green' ? 'navy' : 'green'));
    await page.waitForTimeout(900);
    const benchHeld = await page.evaluate(() => ({
      held: window.redlineHeldId ? redlineHeldId() : null,
      bench: !!document.querySelector('.redline-page .rl-paper') }));
    check('9 a theme change INSIDE a negotiation keeps that negotiation',
      benchHeld.held === cid2 && benchHeld.bench,
      `held ${benchHeld.held} · sheet drawn ${benchHeld.bench}`);

    /* ---- 10. FOCUS MODE KEEPS THE PAGE AT THE WALL ----
       Owner-reported 16 Aug 2026: a wide dead-white void LEFT of the contract
       in focus mode. The shell's main column is pinned grid-column:2, and the
       focus rule used to collapse the shell to ONE column — pushing the pinned
       content into an implicit auto-sized column whose width followed the
       CONTENT's natural width. A column of full cards (paragraphs measure
       wide) hid the fault; a column of one-line RECEIPTS exposed it, which is
       why the staging here sends the asks first. jsdom computes no grid, so
       this geometry can only be measured here. */
    await page.evaluate(async () => {
      localStorage.setItem('hati.v1.rlLeftFrac', '0.45');
      const c = getContract(redlineHeldId());
      negoInit(c);
      const cl = negoClauseList(c);
      await negoEditClause(c, cl[0].clauseId, '<p>Focus-probe wording one.</p>',
        { side: 'owner', author: 'Amina Otieno', summary: 'probe' });
      negoHandOver(c, { to: 'counterparty', by: 'Amina Otieno' });
      renderRedline();
    });
    await page.waitForTimeout(600);
    const receiptsOnly = await page.evaluate(() =>
      document.querySelectorAll('#rl-changes .rl-receipt').length);
    check('10 the column holds a one-line receipt — the narrow content that showed the void',
      receiptsOnly >= 1, receiptsOnly + ' receipt(s)');
    await page.evaluate(() => rlSetFocus(true));
    await page.waitForTimeout(700);
    const focusGeo = await page.evaluate(() => {
      const g = document.querySelector('.redline-page .rl-grid').getBoundingClientRect();
      return { left: Math.round(g.left), right: Math.round(window.innerWidth - g.right),
        cols: getComputedStyle(document.getElementById('app-shell')).gridTemplateColumns };
    });
    /* ---- MEASURED AS SYMMETRY SINCE 22 Aug 2026, and that is a sharper test
       than the two ceilings it replaces ----
       The fault was ~490px of dead white on ONE SIDE: the shell collapsed to a
       single column, the pinned content fell into an implicit second one, and
       the explicit track sat empty on the left. A void is by nature lopsided.
       The page now spends a real page margin (48px each side) and centres the
       working area past its own ceiling, so a bare "left <= 24" would be
       measuring the design rather than the fault. Equal gutters plus a bound
       catches the void exactly and cannot be satisfied by an empty track. */
    check('10 IN FOCUS THE GRID IS CENTRED — no void on either side of the contract',
      Math.abs(focusGeo.left - focusGeo.right) <= 24 && focusGeo.left <= 160,
      `grid left ${focusGeo.left}px · right ${focusGeo.right}px · shell ${focusGeo.cols}`);
    check('10 and ends at the other wall — the width was not handed to an empty track',
      focusGeo.right <= 160, `gap right ${focusGeo.right}px`);
    check('10 the shell\'s first track is exactly zero, not a share of the window',
      /^0px /.test(focusGeo.cols), focusGeo.cols);
    await page.screenshot({ path: path.join(OUT, '10-focus-at-the-wall.png') });
    await page.evaluate(() => rlSetFocus(false));
    await page.waitForTimeout(500);
    const backGeo = await page.evaluate(() => {
      const g = document.querySelector('.redline-page .rl-grid').getBoundingClientRect();
      return { left: Math.round(g.left) };
    });
    check('10 leaving focus brings the sidebar and the old geometry back',
      backGeo.left > 60, `grid left ${backGeo.left}px`);

    /* ---- 11 · THE SEARCH BOX IS WHITE, LIKE EVERYTHING BESIDE IT ----
       Owner-reported 22 Aug 2026 off this very list. It was --color-bg, the
       PAGE's own grey, while all six dropdowns on the same row are
       --color-surface — so the one box a reader types into was the only sunk
       thing in a row of raised ones.
       ASSERTED AS A RELATION, against its own neighbours rather than against
       the word "white": if this product ever re-tones its controls, the claim
       that still matters is that this row agrees with itself. */
    await page.evaluate(() => openNegotiations({ list: true }));
    await page.waitForTimeout(1600);
    const box = await page.evaluate(() => {
      const s = document.getElementById('reg-search');
      const sels = [...document.querySelectorAll('#reg-stage-sel,#reg-type-sel,#reg-category,#reg-renewal')];
      const g = e => e ? getComputedStyle(e).backgroundColor : null;
      return { drew: !!document.querySelector('.reg-table'), found: !!s,
        search: g(s), neighbours: [...new Set(sels.map(g))] };
    });
    check('11 the list and its search box really drew', box.drew && box.found, JSON.stringify(box));
    check('11 the search box is the same colour as the controls beside it',
      box.neighbours.length === 1 && box.search === box.neighbours[0], JSON.stringify(box));

    check('no page errors on the whole journey', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} passed`);
  if (bad) process.exit(1);
})();
