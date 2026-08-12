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

    /* ---- 8. THE DOOR REOPENS THE LAST ONE, FROM ANYWHERE ---- */
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(900);
    await page.click('.nav-item[data-view="redline"]');
    await page.waitForTimeout(1600);
    const back = await page.evaluate(() => ({ view: state.view, held: redlineHeldId(),
      list: !!document.querySelector('.ngl-wrap') }));
    check('the sidebar door reopens the negotiation you were last in',
      back.view === 'redline' && back.held === cid && !back.list, `${back.view} / ${back.held}`);
    await page.screenshot({ path: path.join(OUT, '05-reopened.png') });

    /* ---- 9. AND FALLS THROUGH TO THE LIST WHEN THERE IS NOTHING TO REOPEN ---- */
    await page.evaluate(() => { try{ localStorage.removeItem(
      'hati.v1.lastNegotiation.' + (currentUser().id || currentUser().email)); }catch(e){} });
    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(800);
    await page.click('.nav-item[data-view="redline"]');
    await page.waitForTimeout(1400);
    const list = await page.evaluate(seen => ({
      wrap: eval(seen)('.ngl-wrap'),
      rows: [...document.querySelectorAll('.ngl-row')].map(r => ({
        id: r.getAttribute('data-ngl-open'),
        w: Math.round(r.getBoundingClientRect().width),
        state: (r.querySelector('.ngl-w') || {}).textContent })),
      says: (document.querySelector('.ngl-head p') || {}).textContent,
      /* A signpost, not a second register. */
      filters: document.querySelectorAll('.ngl-wrap input, .ngl-wrap select').length,
    }), SEEN);
    check('with nothing to reopen it lands on the list', !!list.wrap && list.wrap.on,
      list.wrap ? `${list.wrap.w}x${list.wrap.h}` : 'MISSING');
    check('which says so at the top', /Nothing open/i.test(list.says || ''), list.says);
    check('the live negotiation is a real, pressable row',
      list.rows.length === 1 && list.rows[0].id === cid && list.rows[0].w > 0,
      list.rows.map(r => `${r.id} ${r.w}px ${r.state}`).join(' · '));
    check('and it says the answer is owed to this reader',
      /needs you/i.test((list.rows[0] || {}).state || ''), (list.rows[0] || {}).state);
    check('no filter, no search — it is a signpost, not a second register',
      list.filters === 0, list.filters + ' inputs');
    await page.screenshot({ path: path.join(OUT, '06-list.png') });

    /* Pressing a row goes in. */
    await page.click(`.ngl-row[data-ngl-open="${cid}"]`);
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
