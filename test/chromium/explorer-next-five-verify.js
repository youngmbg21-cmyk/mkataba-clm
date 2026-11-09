/* Chromium verification: EXPLORER, THE NEXT FIVE
   ===================================================================
   The owner saw the five ideas drawn ("Explorer Next Five", and the Board's
   figure menu drawn on its own) and said "Build it and all the other 4 all at
   once" (8 Nov 2026):

   1. PRESS A FIGURE, CHOOSE WHERE IT GOES — a Board figure opens a small menu:
      Open the list (lit, Enter takes it: where the press always landed) · Show
      on the map (Explorer on those contracts, the figure's view and lens, the
      head line's ‹ Board). Esc and the figure again close it.
   2. YOUR DAY (owner picked "The SAP Way", 9 Nov 2026; was a six-stop walk) —
      a tab before Overview: five labelled figures, each opening its page,
      lighting its contracts while pointed at; Pin as my morning view.
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

    /* ================= 2. YOUR DAY (owner picked "The SAP Way", 9 Nov 2026; RE-POINTED from the six-stop walk) ================= */
    await page.evaluate(() => { intel.lenses = []; intel.lens = null; intel.timeBy = null; try { localStorage.removeItem('hati.v1.igBriefPin'); } catch (_){} });
    await toExplorer();
    if (await has('igDayHtml')){
      await page.evaluate(() => { igSetView(0); rebuildIntelGraph(); renderIntelDock(); });
      const tabs = await page.evaluate(() => [...document.querySelectorAll('#ig-dock [data-pd-tab]')].map(b => b.getAttribute('data-pd-tab')));
      check('2a "Your day" is the first tab on Explorer\'s panel, before the Overview', tabs[0] === 'day' && tabs[1] === 'copilot', JSON.stringify(tabs));
      await page.click('#ig-dock [data-pd-tab="day"]'); await until(() => !!document.getElementById('ig-day'));
      const d = await page.evaluate(() => ({ tiles: [...document.querySelectorAll('#ig-day .ig-day-t')].map(t => ({ k: t.getAttribute('data-ig-day') || t.getAttribute('data-ig-day-none') || (t.hasAttribute('data-ig-day-pin') ? 'pin' : ''), btn: t.tagName === 'BUTTON', text: t.textContent.replace(/\s+/g, ' ').trim() })),
        needs: ndRead().n, head: document.querySelector('#ig-day .ig-day-hd')?.textContent || '', src: document.querySelector('#ig-day .ig-day-src')?.textContent || '' }));
      const T = k => d.tiles.find(t => t.k === k) || { text: '' };
      check('2b five labelled figures and the pin, under the day and the time counted',
        JSON.stringify(d.tiles.map(t => t.k)) === JSON.stringify(['needs', 'risk', 'duties', 'renew', 'since', 'pin']) && /Counted \d\d:\d\d/.test(d.head) && /Nothing is sent to Jambo/.test(d.src), JSON.stringify(d));
      check('2c each figure says what it counts, and every one shows on the map (owner, 9 Nov 2026)', T('needs').text.startsWith(String(d.needs)) && /Need you/.test(T('needs').text) && /Show on the map ›/.test(T('needs').text)
        && /^5High risk/.test(T('risk').text) && /all in/.test(T('risk').text) && /Show on the map ›/.test(T('risk').text)
        && /Duties due in 30 days/.test(T('duties').text) && /already late/.test(T('duties').text) && /Show on the map ›/.test(T('duties').text)
        && /Renewals to decide/.test(T('renew').text) && /in 90 days/.test(T('renew').text) && /Show on the map ›/.test(T('renew').text)
        && /^1New since yesterdayMK-N15 addedShow on the map ›/.test(T('since').text), JSON.stringify(d.tiles));
      await page.hover('#ig-day [data-ig-day="risk"]'); await page.waitForTimeout(300);
      const lit = await page.evaluate(() => IG.nodes.filter(n => n.g && n.g.classList.contains('hi')).length);
      await page.mouse.move(5, 5); await page.waitForTimeout(300);
      const off = await page.evaluate(() => IG.nodes.filter(n => n.g && n.g.classList.contains('hi')).length);
      check('2d pointing at a figure lights its contracts on the map; letting go puts the map back', lit === 5 && off === 0, JSON.stringify({ lit, off }));
      await page.screenshot({ path: path.join(OUT, '2-your-day.png') });
      await page.click('#ig-day [data-ig-day-pin]'); await page.waitForTimeout(200);
      const pin = await page.evaluate(() => ({ on: igBriefPinned(), pressed: document.querySelector('#ig-day [data-ig-day-pin]')?.getAttribute('aria-pressed') }));
      await page.click('#ig-day [data-ig-day-pin]'); await page.waitForTimeout(200);
      check('2e Pin as my morning view keeps it, pressed again lets go', pin.on && pin.pressed === 'true' && !(await page.evaluate(() => igBriefPinned())), JSON.stringify(pin));
      await page.click('#ig-day [data-ig-day="risk"]'); await page.waitForTimeout(700);
      const r = await page.evaluate(() => ({ lens: intel.lens, pick: (igLegendPickOn() || {}).pick, shown: IG.nodes.filter(n => n.kind === 'contract').length, day: !!document.getElementById('ig-day') }));
      check('2f High risk → Show on the map: the Risk lens with only the high risk drawn, the panel back to the Overview', r.lens === 'risk' && r.pick === 'lens:risk:high' && r.shown === 5 && !r.day, JSON.stringify(r));
      /* ON THE MAP, NOT A LIST (owner, 9 Nov 2026: "these should only show on the map not on the list"): Need you, Duties and Renewals
         narrow the map to their contracts in their own view and lens; the page stays Explorer */
      const onMap = {};
      for (const [k, want] of [['needs', { lens: null }], ['duties', { lens: 'obligations' }], ['renew', { lens: null, view: 4, time: 'decision' }], ['since', { lens: null }]]){
        await page.evaluate(() => { intel.lenses = []; igLensSet(null, { noPush: true }); igSetView(0); intel.dayTab = true; rebuildIntelGraph(); renderIntelDock(); });
        await until(() => !!document.querySelector('#ig-day [data-ig-day]'));
        await page.click(`#ig-day [data-ig-day="${k}"]`); await page.waitForTimeout(600);
        onMap[k] = await page.evaluate(([k, want]) => { const t = igDayData().find(x => x.k === k), shown = IG.nodes.filter(n => n.kind === 'contract').map(n => n.id).sort();
          return { face: hbFace(), view: state.view, same: JSON.stringify(shown) === JSON.stringify(t.ids.slice().sort()), n: shown.length, lens: intel.lens || null,
            vw: igbCam().view, time: intel.timeBy, day: !!document.getElementById('ig-day'), ok: (want.lens || null) === (intel.lens || null) && (want.view == null || igbCam().view === want.view) && (!want.time || intel.timeBy === want.time) }; }, [k, want]);
      }
      check('2f2 Need you, Duties due, Renewals and New since yesterday narrow the map to their own contracts in their own view and lens, never leaving Explorer',
        Object.values(onMap).every(r => r.face === 'explorer' && r.view === 'dashboard' && r.same && r.n > 0 && r.ok && !r.day), JSON.stringify(onMap));
      await page.screenshot({ path: path.join(OUT, '2-on-the-map.png') });
      await page.evaluate(() => { intel.lenses = []; igLensSet(null, { noPush: true }); rebuildIntelGraph(); });
      await page.evaluate(() => intelAsk('Brief me')); await until(() => !!document.getElementById('ig-day'));
      const typed = await page.evaluate(() => ({ day: !!document.getElementById('ig-day'), lit: document.querySelector('#ig-dock [data-pd-tab="day"]')?.getAttribute('aria-selected') }));
      check('2g "Brief me" typed turns the panel to Your day', typed.day && typed.lit === 'true', JSON.stringify(typed));
      await page.click('#ig-dock [data-pd-tab="day"]'); await page.waitForTimeout(300);
      check('2h the tab pressed again goes back to the Overview', !(await page.evaluate(() => !!document.getElementById('ig-day'))));
    } else check('2 Your day exists', false, 'igDayHtml missing');

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

    /* ================= 9. THE GUIDE AND THE LEGEND (owner: "Did you update the guide? … the legend should stay the same width") ================= */
    if (await has('igGuideRows')){
      const g = await page.evaluate(() => { const at = v => { igSetView(v); const R = igGuideRows(); return R.mine.concat(R.every).map(r => r.q); };
        return { tl: at(4), wiring: at(1), brain: at(0) }; });
      check('9a the Guide tab offers the briefing and then-and-now on the Risk lens on every view',
        ['brain', 'tl', 'wiring'].every(k => g[k].includes('Brief me') && g[k].includes('risk lens as of 3 months ago')), JSON.stringify(g));
      check('9b the Timeline\'s Guide offers the renewal cliff, the Wiring\'s a what-if on the biggest party', g.tl.includes('timeline by renewal decision') && g.wiring.some(q => /^What if .+ left\?$/.test(q)), JSON.stringify({ tl: g.tl, wiring: g.wiring }));
      await page.evaluate(() => { intel.asOf = null; intel.lenses = []; igLensSet(null, { noPush: true }); rebuildIntelGraph(); });
      await page.evaluate(() => intelAsk('risk lens as of 6 months ago', { guide: true })); await page.waitForTimeout(900);
      const gw = await page.evaluate(() => ({ lens: intel.lens, asOf: intel.asOf }));
      const six = await page.evaluate(() => igLensThenISO(6));
      check('9c "risk lens as of 6 months ago" turns the Risk lens on and the day six months back', gw.lens === 'risk' && gw.asOf === six, JSON.stringify({ gw, six }));
      const widths = [];
      for (const st of ['folded', 'open', 'risk', 'money', 'then']){
        await page.evaluate(st => { intel.legendFolded = st === 'folded'; if (st === 'open' || st === 'folded'){ intel.asOf = null; igLensSet(null, { noPush: true }); }
          if (st === 'risk'){ intel.asOf = null; igLensSet('risk', { noPush: true }); } if (st === 'money') igLensSet('money', { noPush: true });
          if (st === 'then'){ igLensSet('risk', { noPush: true }); } rebuildIntelGraph(); if (st === 'then') document.querySelector('#ig-legend [data-ig-lens-then="3"]')?.click(); }, st);
        await page.waitForTimeout(500);
        widths.push(await page.evaluate(() => Math.round(document.getElementById('ig-legend').getBoundingClientRect().width)));
      }
      check('9d the legend keeps one width: folded, open, with a lens, and with then-and-now', widths.every(w => w === widths[0]) && widths[0] > 200, JSON.stringify(widths));
    } else check('9 the Guide exists', false, 'igGuideRows missing');

    /* ================= 10. ONE LINE, AND THE LEGEND TO PRESS (owner, 9 Nov 2026) ================= */
    if (await has('igLegendPick')){
      await page.evaluate(() => { intel.asOf = null; intel.lenses = []; intel.legendFolded = true; igLensSet('risk', { noPush: true }); rebuildIntelGraph(); });
      await page.waitForTimeout(500);
      const line = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); if (!e) return null; const x = e.getBoundingClientRect(); return { t: Math.round(x.top), h: Math.round(x.height), l: Math.round(x.left), r: Math.round(x.right) }; };
        const st = document.getElementById('ig-gwrap').getBoundingClientRect();
        return { legend: r('#ig-legend'), lens: r('.ig-viewbar .ig-lensrow'), views: r('.ig-viewbar .ig-seg:not(.ig-lens)'), fold: (() => { const e = document.getElementById('ig-foldall'); const x = e && e.closest('.ig-seg').getBoundingClientRect(); return x && { t: Math.round(x.top), h: Math.round(x.height) }; })(), cam: r('.ig-camerabar'), stageTop: Math.round(st.top), stageRight: Math.round(st.right),
          fonts: [...new Set(['#ig-legend .igl-head .igl-k', '.ig-viewbar [data-ig-lens="risk"]', '.ig-viewbar [data-ig-view="0"]', '#ig-foldall'].map(q => getComputedStyle(document.querySelector(q)).fontSize))] }; });
      check('10a the legend, the Lens group, the views and Fold all stand on ONE line, one height, one type size',
        line.legend && [line.lens, line.views, line.fold].every(x => x && x.t === line.legend.t && x.h === line.legend.h) && line.fonts.length === 1, JSON.stringify(line));
      check('10b the zoom and Still stand in the map\'s top-right corner', line.cam && line.cam.t - line.stageTop < 20 && line.stageRight - line.cam.r < 20, JSON.stringify(line.cam));
      await page.evaluate(() => { intel.legendFolded = false; rebuildIntelGraph(); }); await page.waitForTimeout(400);
      const all = await page.evaluate(() => IG.nodes.filter(n => n.kind === 'contract').length);
      await page.click('#ig-legend [data-ig-pick="lens:risk:high"]'); await page.waitForTimeout(600);
      const p1 = await page.evaluate(() => ({ shown: IG.nodes.filter(n => n.kind === 'contract').map(n => igLensBucketOf(n.c, 'risk')), pressed: document.querySelector('#ig-legend [data-ig-pick="lens:risk:high"]')?.getAttribute('aria-pressed'),
        rows: document.querySelectorAll('#ig-legend [data-ig-lens-row]').length, note: (document.getElementById('ig-note') || {}).textContent || '' }));
      check('10c pressing "High risk" in the legend shows only the high-risk contracts, the row pressed, every other row still there to press',
        p1.shown.length === 5 && p1.shown.every(k => k === 'high') && p1.pressed === 'true' && p1.rows >= 4 && /Showing 5 of 16/.test(p1.note), JSON.stringify(p1));
      await page.click('#ig-legend [data-ig-pick="lens:risk:high"]'); await page.waitForTimeout(600);
      const p2 = await page.evaluate(() => ({ n: IG.nodes.filter(n => n.kind === 'contract').length, pick: !!igLegendPickOn() }));
      check('10d pressing it again puts the whole map back', p2.n === all && !p2.pick, JSON.stringify({ p2, all }));
      await page.click('#ig-legend [data-ig-pick="status:Signed"]'); await page.waitForTimeout(600);
      const p3 = await page.evaluate(() => IG.nodes.filter(n => n.kind === 'contract').every(n => n.c.status === 'Signed'));
      await page.click('#ig-legend [data-ig-pick="lens:risk:unscanned"]'); await page.waitForTimeout(600);
      const p4 = await page.evaluate(() => ({ ks: IG.nodes.filter(n => n.kind === 'contract').map(n => igLensBucketOf(n.c, 'risk')), picks: intel.lenses.filter(l => l.kind === 'legend').length }));
      check('10e a status row narrows too, and another row takes its place', p3 && p4.picks === 1 && p4.ks.length === 3 && p4.ks.every(k => k === 'unscanned'), JSON.stringify({ p3, p4 }));
      await page.screenshot({ path: path.join(OUT, '10-legend-pick.png') });
      await page.evaluate(() => { intel.lenses = []; rebuildIntelGraph(); });
      /* THE LEGEND MOVES (owner, 9 Nov 2026): open, a drag on its head moves it; a change of view keeps it there and open;
         folded, it goes back to its corner */
      await page.evaluate(() => { intel.legendFolded = false; intel.legendPos = null; igSetView(0); rebuildIntelGraph(); });
      await page.waitForTimeout(500);
      const at = () => page.evaluate(() => { const el = document.getElementById('ig-legend'), p = el.offsetParent.getBoundingClientRect(), r = el.getBoundingClientRect();
        return { x: Math.round(r.left - p.left), y: Math.round(r.top - p.top), bottomGap: Math.round(p.bottom - r.bottom), folded: el.classList.contains('is-folded'), w: Math.round(p.width), h: Math.round(p.height), lw: Math.round(r.width), lh: Math.round(r.height) }; });
      const home = await at();
      const head = await page.evaluate(() => { const r = document.querySelector('#ig-legend [data-ig-legend-head] .igl-k').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.move(head.x, head.y); await page.mouse.down();
      await page.mouse.move(head.x + 300, head.y - 200, { steps: 8 }); await page.mouse.up();
      const moved = await at();
      check('10f open, the legend\'s head drags it across the stage', !home.folded && Math.abs(moved.x - home.x - 300) <= 2 && Math.abs(moved.y - home.y + 200) <= 2, JSON.stringify({ home, moved }));
      await page.mouse.move(head.x + 300, head.y - 200); await page.mouse.down();
      await page.mouse.move(head.x + 5000, head.y - 5000, { steps: 4 }); await page.mouse.up();
      const edge = await at();
      check('10g it never leaves the stage: dragged past the corner it stops at the edge', edge.x === edge.w - edge.lw && edge.y === 0, JSON.stringify(edge));
      await page.mouse.move(head.x + 5000, head.y - 5000); await page.mouse.down();
      await page.mouse.move(head.x + 200, head.y - 150, { steps: 4 }); await page.mouse.up();
      const kept = await at();
      await page.evaluate(() => { igSetView(3); rebuildIntelGraph(); }); await page.waitForTimeout(700);
      const afterView = await at();
      check('10h a change of view keeps it where it was dragged, and open', !afterView.folded && afterView.x === kept.x && afterView.y === kept.y, JSON.stringify({ kept, afterView }));
      await page.screenshot({ path: path.join(OUT, '10-legend-moved.png') });
      await page.click('#ig-legend [data-ig-legend-fold]'); await page.waitForTimeout(300);
      const folded = await at();
      await page.click('#ig-legend [data-ig-legend-fold]'); await page.waitForTimeout(300);
      const reopened = await at();
      check('10i folded, it goes back to its bottom-left corner, and opens there again', folded.folded && folded.x === home.x && folded.bottomGap === home.bottomGap && !reopened.folded && reopened.x === home.x && reopened.bottomGap === home.bottomGap, JSON.stringify({ home, folded, reopened }));
      await page.evaluate(() => { igSetView(0); rebuildIntelGraph(); });
    } else check('10 the legend can be pressed', false, 'igLegendPick missing');

    /* ================= 6. THE OWNER'S THREE SCREENS ================= */
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]){
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(500);
      const fit = await page.evaluate(() => { const g = document.getElementById('ig-legend'), st = document.getElementById('ig-gwrap'); if (!g || !st) return null;
        const a = g.getBoundingClientRect(), b = st.getBoundingClientRect(); return a.top >= b.top - 1 && a.bottom <= b.bottom + 1; });
      check(`6 ${w}×${hh}: the legend with its then-and-now stays inside the stage`, fit === true, String(fit));
      await page.screenshot({ path: path.join(OUT, `6-${w}x${hh}.png`) });
      /* YOUR DAY at each screen (9 Nov 2026): every figure and the pin in sight without scrolling, each line inside its tile */
      const dfit = await page.evaluate(() => { intel.dayTab = true; renderIntelDock(); const d = document.getElementById('ig-day'); if (!d) return null;
        const box = d.getBoundingClientRect(), T = [...d.querySelectorAll('.ig-day-t')];
        const inView = T.every(t => { const r = t.getBoundingClientRect(); return r.bottom <= box.bottom + 1 && r.right <= box.right + 1; });
        const inside = T.every(t => { const r = t.getBoundingClientRect(); return [...t.children].every(c => { const q = c.getBoundingClientRect(); return q.left >= r.left - 1 && q.right <= r.right + 1; }); });
        return { tiles: T.length, inView, inside }; });
      check(`6b ${w}×${hh}: Your day's five figures and the pin are in sight, every line inside its tile`, !!dfit && dfit.tiles === 6 && dfit.inView && dfit.inside, JSON.stringify(dfit));
      await page.waitForTimeout(700);  /* the panel's crossfade finished before the picture */
      await page.screenshot({ path: path.join(OUT, `6-day-${w}x${hh}.png`) });
      await page.evaluate(() => { intel.dayTab = false; renderIntelDock(); });
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
