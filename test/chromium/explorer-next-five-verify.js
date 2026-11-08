/* Chromium verification: EXPLORER, THE NEXT FIVE
   ===================================================================
   The owner saw the five ideas drawn ("Explorer Next Five", and the Board's
   figure menu drawn on its own) and said "Build it and all the other 4 all at
   once" (8 Nov 2026):

   1. PRESS A FIGURE, CHOOSE WHERE IT GOES — a Board figure opens a small menu:
      Open the list (lit, Enter takes it: where the press always landed) · Show
      on the map (Explorer on those contracts, the figure's view and lens, the
      head line's ‹ Board). Esc and the figure again close it.
   2. THE MORNING BRIEFING — six stops, each a view and a lens and a sentence
      counted from the book, ‹ › Stop on the head line, Pin as my morning view;
      Stop puts the map back.
   3. THE RENEWAL CLIFF — the decision timeline counts by month, a crowded
      month amber, a red pin on each renewal soon to decide, a month's card.
   4. WHAT IF A PARTY LEFT — the party's contracts and the ones hanging on them
      through a link lit, the value at stake on the head line, the advice one
      press with its cost said.
   5. THEN AND NOW FOR EVERY LENS — the legend's Today · 3 · 6 months ago; each
      row's count then with today's beside it, and one sentence of what moved.

   Red at the parent: none of the five exists, so each check reports rather
   than times out.

   Run: node test/chromium/explorer-next-five-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-next-five');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/* days counted from today, so the fixture means the same whatever day it runs */
const day = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); };
const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
/* the 15th of the month m months from now: the crowded month and the quiet ones, whatever day it runs */
const mid = m => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(15); d.setMonth(d.getMonth() + m); return iso(d); };
const ST = ['proc', 'sales', 'mfg'];
const F = (id, sev, title) => ({ id, sev, title, kind: 'risk', what: title, why: title });
/* 16 contracts. Juno holds MK-N0 and MK-N1; MK-N2 (Savanna) has a duty that comes after Juno's — the link.
   Decision days: four in the month after next (the crowd), one in each of five other months, the rest far off.
   Added: ten long ago (200 days), five a month ago, one today. */
const PARTY = i => i < 2 ? 'Juno Logistics' : ['Kipande', 'Savanna', 'Mvua'][i % 3];
const BOOK = Array.from({ length: 16 }, (_, i) => {
  const c = fixtureContract('MK-N' + i, ['Freight Services', 'Retail Supply', 'Component Supply'][i % 3] + ' ' + i,
    PARTY(i), ST[i % 3], ((i * 37) % 90 + 5) * 1e6, 'Signed');
  c.expiry = i < 4 ? mid(2) : i < 9 ? mid(3 + i) : day(700 + i * 20);
  c.metadata = Object.assign({}, c.metadata, { expiryDate: c.expiry });
  c.audit = [{ at: i < 10 ? ago(200) : i < 15 ? ago(30) : ago(0), user: 'System', action: 'Created', detail: 'fixture' }];
  if (i % 5 !== 4) {
    const f = [];
    if (i % 3 === 0) f.push(F('f' + i + 'a', 'high', 'Liability not capped'), F('f' + i + 'b', 'high', 'Termination on 30 days'));
    if (i % 3 === 1) f.push(F('f' + i + 'a', 'med', 'Renews by itself'));
    c.scan = { at: new Date().toISOString(), findings: f, dismissed: [] };
  }
  const late = i % 5 === 0;
  c.obligations = [{ id: 'ob' + i, desc: 'Monthly service report ' + i, due: late ? day(-6 - i) : day(12 + i * 9), status: 'open', party: i % 2 ? 'ours' : 'theirs' }];
  if (i === 2) c.obligations[0].after = 'ob0';
  return c;
});
const JUNO_REACH = ['MK-N0', 'MK-N1', 'MK-N2'];

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 2).join(' ')));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const has = name => page.evaluate(n => typeof window[n] === 'function', name);
  const toExplorer = async () => {
    await page.evaluate(() => { intel.cam = null; intel.tab = 'map'; intel.dockOpen = true; setView('dashboard'); hbSetFace('explorer'); });
    await until(() => hbFace() === 'explorer' && window.IG && IG.nodes && IG.nodes.filter(n => n.kind === 'contract').length === 16);
    await page.waitForTimeout(600);
  };
  const note = () => page.evaluate(() => (document.getElementById('ig-note') || {}).textContent || '');
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-N7'), null, { timeout: 15000 });
    await until(() => state.view === 'counter', null, 10000);

    /* ================= 1. THE BOARD'S FIGURE MENU ================= */
    await page.evaluate(() => { setView('dashboard'); hbSetFace('board'); });
    const fig = await until(() => !!document.querySelector('#hb-book .hb-fig-main[data-hb-dig="f:ending"]:not([disabled])'), null, 10000);
    check('1a the Board shows "Ending in 90 days" as a figure that can be pressed', fig);
    if (fig){
      await page.click('#hb-book .hb-fig-main[data-hb-dig="f:ending"]'); await page.waitForTimeout(300);
      const m = await page.evaluate(() => { const el = document.getElementById('hb-figmenu'); if (!el) return null;
        const r = el.getBoundingClientRect(), f = document.querySelector('#hb-book .hb-fig-main[data-hb-dig="f:ending"]').getBoundingClientRect();
        return { opts: [...el.querySelectorAll('[data-hb-fm]')].map(b => [b.getAttribute('data-hb-fm'), b.querySelector('b').textContent.trim()]),
          focus: document.activeElement && document.activeElement.getAttribute('data-hb-fm'), under: r.top >= f.bottom - 1 && r.top - f.bottom < 20,
          inView: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, moved: state.view === 'dashboard' && hbFace() === 'board' }; });
      check('1b a press opens the menu under the figure: Open the list · Show on the map, nothing moved yet',
        m && JSON.stringify(m.opts) === JSON.stringify([['list', 'Open the list'], ['map', 'Show on the map']]) && m.under && m.inView && m.moved, JSON.stringify(m));
      check('1c Open the list is the one readied (Enter takes it)', m && m.focus === 'list', m && m.focus);
      await page.screenshot({ path: path.join(OUT, '1-figure-menu.png') });
      await page.keyboard.press('Escape'); await page.waitForTimeout(150);
      const esc = await page.evaluate(() => !document.getElementById('hb-figmenu'));
      await page.click('#hb-book .hb-fig-main[data-hb-dig="f:ending"]'); await page.waitForTimeout(200);
      await page.click('#hb-book .hb-fig-main[data-hb-dig="f:ending"]'); await page.waitForTimeout(200);
      const again = await page.evaluate(() => !document.getElementById('hb-figmenu'));
      check('1d Esc closes it, and so does the figure pressed again', esc && again, JSON.stringify({ esc, again }));
      await page.click('#hb-book .hb-fig-main[data-hb-dig="f:ending"]'); await page.waitForTimeout(200);
      await page.keyboard.press('Enter'); await page.waitForTimeout(700);
      const listed = await page.evaluate(() => ({ chip: !!document.getElementById('reg-only-chip'), menu: !!document.getElementById('hb-figmenu') }));
      check('1e Enter lands where the press always landed: the Contracts list narrowed to those contracts', listed.chip && !listed.menu, JSON.stringify(listed));
      await page.evaluate(() => { setView('dashboard'); hbSetFace('board'); });
      await until(() => !!document.querySelector('#hb-book .hb-fig-main[data-hb-dig="f:ending"]'));
      const want = await page.evaluate(() => hbFigContractIds('ending').slice().sort());
      await page.click('#hb-book .hb-fig-main[data-hb-dig="f:ending"]'); await page.waitForTimeout(200);
      await page.click('#hb-figmenu [data-hb-fm="map"]');
      await until(() => hbFace() === 'explorer' && window.IG && IG.nodes);
      await page.waitForTimeout(700);
      const map = await page.evaluate(() => { const L = intel.lenses.find(l => l.kind === 'board');
        return { ids: L ? L.ids.slice().sort() : null, label: L && L.label, lens: intel.lens, view: igbCam().view, time: intel.timeBy,
          shown: IG.nodes.filter(n => n.kind === 'contract').length, back: !!document.querySelector('#ig-note [data-ig-note="board"]') }; });
      check('1f Show on the map opens Explorer on exactly those contracts, from the Board, on the Timeline with the Obligations lens',
        map.ids && JSON.stringify(map.ids) === JSON.stringify(want) && map.shown === want.length && /From the Board/.test(map.label) && map.lens === 'obligations' && map.view === 4 && map.time === 'decision', JSON.stringify({ map, want }));
      check('1g the head line carries ‹ Board', map.back && /‹ Board/.test(await note()), await note());
      await page.screenshot({ path: path.join(OUT, '1-from-the-board.png') });
      await page.click('#ig-note [data-ig-note="board"]'); await page.waitForTimeout(500);
      check('1h ‹ Board goes back to the Board', await page.evaluate(() => hbFace() === 'board'), await page.evaluate(() => hbFace()));
    }

    /* ================= 2. THE MORNING BRIEFING ================= */
    await page.evaluate(() => { intel.lenses = []; intel.lens = null; intel.timeBy = null; });
    await toExplorer();
    if (await has('igBriefStart')){
      await page.evaluate(() => { igSetView(0); rebuildIntelGraph(); });
      const before = await page.evaluate(() => JSON.stringify({ v: igbCam().view, lens: intel.lens, g: intel.groupBy }));
      await page.evaluate(() => intelAsk('Brief me')); await until(() => !!intel.brief);
      const b = await page.evaluate(() => ({ stops: intel.brief.steps.map(s => s.k), rows: document.querySelectorAll('#ig-dock .ig-brief-s').length,
        say: [...document.querySelectorAll('#ig-dock .ig-brief-s')].map(r => r.textContent.trim()) }));
      check('2a "Brief me" starts the briefing: six stops, each a row under Jambo\'s hello',
        JSON.stringify(b.stops) === JSON.stringify(['needs', 'risk', 'duties', 'money', 'since', 'back']) && b.rows === 6, JSON.stringify(b));
      check('2b the head line says where it is: Your briefing · 1 of 6, with Stop and Pin', /Your briefing · 1 of 6/.test(await note()) && /Stop/.test(await note()) && /Pin as my morning view/.test(await note()), await note());
      await page.click('#ig-note [data-ig-note="brief-next"]'); await page.waitForTimeout(500);
      const s2 = await page.evaluate(() => ({ lens: intel.lens, at: intel.brief.at, lit: IG.nodes.filter(n => n.g && n.g.classList.contains('hi')).length, hi: intel.brief.steps[1].ids.length }));
      check('2c the next stop turns the Risk lens on and lights the high risk', s2.lens === 'risk' && s2.at === 1 && s2.hi === 5 && s2.lit === s2.hi, JSON.stringify(s2));
      const riskSay = b.say[1] || '';
      check('2d the risk stop is counted from the book: 5 high, all in one stream, 3 not checked', /5 high risk/.test(riskSay) && /all in/.test(riskSay) && /3 not checked yet/.test(riskSay), riskSay);
      await page.click('#ig-dock [data-ig-brief-go="3"]'); await page.waitForTimeout(500);
      const s4 = await page.evaluate(() => ({ view: igbCam().view, time: intel.timeBy, lens: intel.lens, n: intel.brief.steps[3].ids.length }));
      check('2e "Money ending" moves to the renewal decision timeline, no lens', s4.view === 4 && s4.time === 'decision' && !s4.lens && s4.n >= 4, JSON.stringify(s4));
      await page.screenshot({ path: path.join(OUT, '2-briefing.png') });
      await page.click('#ig-note [data-ig-note="brief-pin"]'); await page.waitForTimeout(200);
      const pin = await page.evaluate(() => igBriefPinned());
      await page.click('#ig-note [data-ig-note="brief-stop"]'); await page.waitForTimeout(500);
      const after = await page.evaluate(() => JSON.stringify({ v: igbCam().view, lens: intel.lens, g: intel.groupBy }));
      check('2f Pin keeps it as the morning view; Stop ends it and puts the map back as it was', pin && after === before && !(await page.evaluate(() => !!intel.brief)), JSON.stringify({ pin, before, after }));
      await page.evaluate(() => { try { localStorage.removeItem('hati.v1.igBriefPin'); } catch (_){} });
    } else check('2 the morning briefing exists', false, 'igBriefStart missing');

    /* ================= 3. THE RENEWAL CLIFF ================= */
    await page.evaluate(() => { intel.lenses = []; intel.lens = null; intel.timeBy = 'decision'; igSetView(4); rebuildIntelGraph(); });
    await page.waitForTimeout(1200);
    const tl = await page.evaluate(() => ({ step: IG.tl && IG.tl.stripStep, strip: (IG.tl && IG.tl.strip || []).map(s => [s.n, !!s.crowded]), pins: (IG._cliffPins || []).length }));
    check('3a the decision timeline counts by month', tl.step === 1, JSON.stringify(tl));
    const crowd = (tl.strip || []).filter(x => x[1]);
    check('3b the month with four decisions is amber, and only it', crowd.length === 1 && crowd[0][0] === 4, JSON.stringify(tl.strip));
    check('3c a red pin stands on each renewal to decide within 120 days', tl.pins === 4 || tl.pins === 5, String(tl.pins));
    const hit = await page.evaluate(() => { const H = (IG._stripHit || []).find(x => x.s.crowded); if (!H) return null; const r = document.getElementById('ig-gwrap').getBoundingClientRect(); return { x: r.left + H.x + H.w / 2, y: r.top + H.y + H.h - 4 }; });
    if (hit){ await page.mouse.click(hit.x, hit.y); await page.waitForTimeout(300); }
    const card = await page.evaluate(() => { const el = document.getElementById('ig-cliff-card'); return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('3d pressing the crowded month opens its card: 4 decisions, value ending, earliest notice day, Show these 4',
      !!card && /4 decisions/.test(card) && /Value ending/.test(card) && /Earliest notice day/.test(card) && /Show these 4/.test(card), card);
    await page.screenshot({ path: path.join(OUT, '3-renewal-cliff.png') });
    if (card){ await page.click('#ig-cliff-card [data-ig-cliff-show]'); await page.waitForTimeout(500); }
    const lit = await page.evaluate(() => { const L = intel.lenses.find(l => l.kind === 'cliff'); return L ? L.ids.length : 0; });
    check('3e Show these lights the month\'s four', lit === 4, String(lit));

    /* ================= 4. WHAT IF A PARTY LEFT ================= */
    await page.evaluate(() => { intel.lenses = []; igSetView(0); rebuildIntelGraph(); });
    await page.evaluate(() => intelAsk('What if Juno left?')); await page.waitForTimeout(900);
    const wi = await page.evaluate(() => { const L = intel.lenses.find(l => l.kind === 'whatif'); const last = intel.history[intel.history.length - 1];
      return { ids: L ? L.ids.slice().sort() : null, stake: L && L.stake, view: igbCam().view, said: last && last.text,
        ask: !!document.querySelector('#ig-dock [data-ig-whatif="ask"]'), cost: (document.querySelector('#ig-dock .ig-whatif-links .igd-cost') || {}).textContent || '' }; });
    check('4a "What if Juno left?" lights Juno\'s two and the one hanging on them through a link, on the Wiring',
      wi.ids && JSON.stringify(wi.ids) === JSON.stringify(JUNO_REACH) && wi.view === 1, JSON.stringify(wi));
    check('4b Jambo says it, counted: two with them, one through a link, the value at stake', /If Juno Logistics left: 2 with them and 1 more hanging on them/.test(wi.said || '') && /at stake/.test(wi.said || ''), wi.said);
    check('4c the head line says the stake with Stop', /3 contracts · KES/.test(await note()) && /at stake/.test(await note()), await note());
    /* RE-POINTED (owner, 8 Nov 2026: "remove all information related to jambo calls"): no cost is said */
    check('4d the advice is one press, no cost said beside it', wi.ask && !/call|free/i.test(wi.cost), wi.cost);
    await page.screenshot({ path: path.join(OUT, '4-what-if.png') });
    if (wi.ids){ await page.click('#ig-note [data-ig-note="whatif-stop"]'); await page.waitForTimeout(300); }
    check('4e Stop takes it off', await page.evaluate(() => !intel.lenses.some(l => l.kind === 'whatif')), '');

    /* ================= 5. THEN AND NOW FOR EVERY LENS ================= */
    await page.evaluate(() => { intel.lenses = []; intel.asOf = null; igLensSet('risk', { noPush: true }); rebuildIntelGraph(); });
    await page.waitForTimeout(600);
    const pills = await page.evaluate(() => [...document.querySelectorAll('#ig-legend [data-ig-lens-then]')].map(b => [b.textContent.trim(), b.getAttribute('aria-pressed')]));
    check('5a a lens\'s legend offers Today · 3 months ago · 6 months ago, Today pressed', JSON.stringify(pills) === JSON.stringify([['Today', 'true'], ['3 months ago', 'false'], ['6 months ago', 'false']]), JSON.stringify(pills));
    if (pills.length){ await page.click('#ig-legend [data-ig-lens-then="3"]'); await page.waitForTimeout(800); }
    const tn = await page.evaluate(() => ({ asOf: intel.asOf, rows: [...document.querySelectorAll('#ig-legend [data-ig-lens-row]')].map(r => [r.getAttribute('data-ig-lens-row'), (r.querySelector('.igl-n') || {}).textContent]),
      moved: (document.querySelector('#ig-legend [data-ig-lens-moved]') || {}).textContent || '' }));
    const high = (tn.rows || []).find(r => r[0] === 'high');
    check('5b three months ago: each row says its count then, with today\'s beside it (high risk 3 then, 5 today)', !!tn.asOf && high && /^3today5$/.test(high[1].replace(/\s+/g, '')) , JSON.stringify(tn.rows));
    /* RE-POINTED 8 Nov 2026 (the risk check dates): these checks were stored before HaTi kept the days, and it says so */
    check('5c one sentence says what moved, and that checks kept without their days read as today', /went from/.test(tn.moved) && /checked before HaTi kept the days, and read as today/.test(tn.moved), tn.moved);
    check('5d the head line says Back to now', /Back to now/.test(await note()), await note());
    await page.screenshot({ path: path.join(OUT, '5-then-and-now.png') });

    /* ================= 8. THE RISK CHECK DATES (owner: "Yes, add the risk check dates") ================= */
    if (await has('igRiskAsOf')){
      /* a check keeps the day each finding was first found, and keeps it on the next check */
      const keep = await page.evaluate(() => { const c = getContract('MK-N4'); const was = c.scan; c.scan = null; c.counterparty = '';
        runScan(c); const a = c.scan.findings.find(f => f.id === 'g-cp'); const first = c.scan.first, s1 = a && a.seen;
        a.seen = '2026-01-05'; c.scan.first = '2026-01-05'; runScan(c); const b = c.scan.findings.find(f => f.id === 'g-cp');
        const out = { s1, first, kept: b && b.seen, keptFirst: c.scan.first, today: todayISO() };
        c.counterparty = 'Juno Logistics'; c.scan = was; return out; });
      check('8a a check stamps each finding with the day it was first found, and the next check keeps that day',
        keep.s1 === keep.today && keep.first === keep.today && keep.kept === '2026-01-05' && keep.keptFirst === '2026-01-05', JSON.stringify(keep));
      /* the book's checks, dated: all first checked 200 days ago; MK-N3's second risk and both of MK-N6's found 20 days ago */
      await page.evaluate(([old, recent]) => { state.contracts.forEach(c => { if (!c.scan) return; c.scan.on = old; c.scan.first = old;
          c.scan.findings.forEach(f => { f.seen = (c.id === 'MK-N6' || (c.id === 'MK-N3' && /b$/.test(f.id))) ? recent : old; }); });
        intel.asOf = null; intel.lenses = []; igLensSet('risk', { noPush: true }); rebuildIntelGraph(); }, [day(-200), day(-20)]);
      await page.waitForTimeout(400);
      await page.click('#ig-legend [data-ig-lens-then="3"]'); await page.waitForTimeout(800);
      const r8 = await page.evaluate(() => ({ rows: [...document.querySelectorAll('#ig-legend [data-ig-lens-row]')].map(r => [r.getAttribute('data-ig-lens-row'), (r.querySelector('.igl-n') || {}).textContent.replace(/\s+/g, '')]),
        moved: (document.querySelector('#ig-legend [data-ig-lens-moved]') || {}).textContent || '',
        badges: Object.assign({}, ...(intel.lenses.filter(l => l.kind === 'asof').map(l => l.badges || {}))) }));
      const hi8 = (r8.rows || []).find(r => r[0] === 'high');
      check('8b three months ago, High risk counts the risks found by then: 1 then, 5 today', hi8 && hi8[1] === '1today5', JSON.stringify(r8.rows));
      check('8c the sentence says two we already had gained a risk since, and two were added since, read from the day each was found',
        /went from 1 to 5/.test(r8.moved) && /2 contracts we already had gained a risk since/.test(r8.moved) && /2 contracts added since/.test(r8.moved) && /Read from the day each risk was found/.test(r8.moved), r8.moved);
      check('8d the contracts that gained a risk since wear "+N since" on the map', r8.badges['MK-N3'] === '+1 since' && r8.badges['MK-N6'] === '+2 since', JSON.stringify(r8.badges));
      await page.screenshot({ path: path.join(OUT, '8-risk-dates.png') });
    } else check('8 the risk check dates exist', false, 'igRiskAsOf missing');

    /* ================= 6. THE OWNER'S THREE SCREENS ================= */
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]){
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(500);
      const fit = await page.evaluate(() => { const g = document.getElementById('ig-legend'), st = document.getElementById('ig-gwrap'); if (!g || !st) return null;
        const a = g.getBoundingClientRect(), b = st.getBoundingClientRect(); return a.top >= b.top - 1 && a.bottom <= b.bottom + 1; });
      check(`6 ${w}×${hh}: the legend with its then-and-now stays inside the stage`, fit === true, String(fit));
      await page.screenshot({ path: path.join(OUT, `6-${w}x${hh}.png`) });
    }
    check('7 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack ? e.stack.split('\n').slice(0, 3).join(' ') : String(e));
  } finally {
    await browser.close(); await h.stop();
  }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})();
