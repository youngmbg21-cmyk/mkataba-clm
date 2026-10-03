/* HOME IS THE BOARD AND THE MAP — measured in a real browser (Young ruled
 * 3 Oct 2026; f447 pins the readings and the server's walls).
 *
 * WHAT THIS DRIVES, where the user looks:
 *   1. Home lands on the board, Dark, six figures that are the book's own,
 *      and the map is NOT built while the board covers it;
 *   2. a figure is a door with a trail, and the trail's first crumb goes back;
 *   3. asking changes the lens and puts panels on the board, and side by side
 *      is two columns that do not run into each other (the missing-token
 *      fault this branch met on the way);
 *   4. "bring up MK-S1" draws the contract card; "show these on the map"
 *      flips to Explorer with the contract lit;
 *   5. what moved draws a chip only on a figure that moved;
 *   6. a watch becomes a row in the bell;
 *   7. a panel given to a colleague arrives on their Home, and the giver
 *      sees the seen tick;
 *   8. Present: the tools appear only while presenting, the pen paints, and
 *      Escape brings everything back;
 *   9. the screen's Light stays light when the PLATFORM is dark;
 *  10. Insights has no Explorer tab, and an old door to it lands on Home.
 * Every driven half is guarded, so a missing feature REPORTS rather than
 * times out (the house rule). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'home-board');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
function mk(id, name, cp, folder, value, status, extra) {
  return { id, name, counterparty: cp, folder, value, valueType: 'standard', status, template: 'RM',
    lastAction: '10 Jul 2026', expiry: '2027-06-30', hash: null, signedAt: null,
    fields: { value: String(value) }, metadata: { value, currency: 'KES' },
    comments: [], audit: [{ at: new Date().toISOString(), user: 'System', action: 'Created', detail: 'fixture' }],
    signatures: [], obligations: [], rounds: [], ...extra };
}
/* Day-relative fixtures (ending in forty days, ended twelve days ago, a duty
   six days late), so no answer below depends on the day it runs. */
const CONTRACTS = [
  mk('MK-S1', 'Packaging Supply', 'Kenya Cartons', 'proc', 12000000, 'Signed', { expiry: day(40),
    metadata: { value: 12000000, currency: 'KES', category: 'supplier', paymentTerms: '30 days' },
    obligations: [{ id: 'o1', desc: 'Pay the quarterly fee', party: 'ours', due: day(-6), status: 'open' }] }),
  mk('MK-S2', 'Fleet Servicing', 'Coast Motors', 'proc', 6000000, 'Signed', { expiry: day(-12),
    metadata: { value: 6000000, currency: 'KES', category: 'supplier', paymentTerms: '45 days' } }),
  mk('MK-C1', 'Retail Listing West', 'Quickmart', 'sales', 30000000, 'Signed', { expiry: day(300),
    metadata: { value: 30000000, currency: 'KES', category: 'customer', paymentTerms: '60 days' } }),
  mk('MK-J1', 'Juno Licence', 'Juno Ltd', 'proc', 4000000, 'Signed', { expiry: day(200) }),
  mk('MK-J2', 'Juno Retail', 'Juno Fresh AB', 'sales', 2000000, 'Draft', {}),
  mk('MK-C2', 'Hotel Supply', 'Serena Group', 'sales', 9000000, 'Under Review',
    { metadata: { value: 9000000, currency: 'KES', category: 'customer' } }),
  ...FIXTURES,
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  const signIn = async (page, email, pass) => {
    page.on('pageerror', e => errs.push(email + ': ' + e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    await page.evaluate(() => setView('dashboard'));
  };
  const ask = async (page, q) => {
    await page.fill('#igd-input', q); await page.keyboard.press('Enter');
  };
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await signIn(page, 'admin@example.co.ke', 'adminpassword1');

    /* ===== 1. THE LANDING ===== */
    const landed = await until(page, () => document.querySelectorAll('#hb-board .hb-fig').length === 6);
    ok('1a Home lands on the board with six figures', landed);
    const L = await page.evaluate(() => ({ face: typeof hbS === 'function' && hbS().face,
      dark: !!document.querySelector('#ig-page.hb-dark'), up: typeof igMapUp === 'function' ? igMapUp() : null,
      nums: [...document.querySelectorAll('.hb-fig .hb-fig-n')].map(e => e.textContent.trim()),
      want: typeof hbBookData === 'function' ? hbBookData('all').figs : null }));
    ok('1b the board side, on the Dark screen', L.face === 'board' && L.dark, JSON.stringify([L.face, L.dark]));
    ok('1c the map is not built while the board covers it', L.up === false);
    ok('1d live, ending, past and overdue print the book\'s own counts',
      !!L.want && L.nums[0] === String(L.want.live.n) && L.nums[2] === String(L.want.ending.n)
        && L.nums[3] === String(L.want.past.n) && L.nums[4] === String(L.want.overdue.n), JSON.stringify(L.nums));
    await page.screenshot({ path: path.join(OUT, '1-landing.png') });

    /* ===== 2. A FIGURE IS A DOOR WITH A TRAIL ===== */
    if (landed) await page.click('.hb-fig-main[data-hb-dig="f:live"]');
    ok('2a pressing Live contracts opens the dig-in', await until(page, () => !!document.querySelector('#hb-board .hb-dig')));
    ok('2b the dig-in lists the live contracts', await page.evaluate(() =>
      document.querySelectorAll('#hb-board .hb-dig [data-hb-dig^="c:"]').length === hbBookData('all').figs.live.n));
    await page.click('[data-hb-crumb="-1"]').catch(() => {});
    ok('2c the trail\'s first crumb goes back to the book', await until(page, () => !document.querySelector('#hb-board .hb-dig') && hbS().path.length === 0));

    /* ===== 3. ASKING ===== */
    await ask(page, 'suppliers only');
    ok('3a "suppliers only" changes the lens and the figures', await until(page, () =>
      hbS().lens === 'suppliers' && document.querySelector('.hb-fig .hb-fig-n').textContent.trim() === '2'));
    await ask(page, 'all contracts');
    await until(page, () => hbS().lens === 'all');
    await ask(page, 'payment terms suppliers vs customers');
    const split = await until(page, () => document.querySelectorAll('.hb-split > div').length === 2);
    ok('3b side by side puts a two-column panel on the board', split);
    const cols = await page.evaluate(() => {
      const [a, b] = [...document.querySelectorAll('.hb-split > div')];
      if (!a || !b) return null;
      const right = Math.max(...[...a.querySelectorAll('.hb-bar-n')].map(e => e.getBoundingClientRect().right));
      return { aRight: right, bLeft: b.getBoundingClientRect().left };
    });
    ok('3c the two columns do not run into each other', !!cols && cols.aRight + 8 <= cols.bLeft, JSON.stringify(cols));
    await page.screenshot({ path: path.join(OUT, '3-side-by-side.png') });

    /* ===== 4. THE CONTRACT CARD, AND SHOW ON THE MAP ===== */
    await ask(page, 'bring up MK-S1');
    ok('4a "bring up MK-S1" draws the contract card', await until(page, () =>
      !!document.querySelector('#hb-focus .hb-cref') && /MK-S1/.test(document.querySelector('#hb-focus .hb-cref').textContent)));
    await page.click('#hb-focus [data-hb-map]').catch(() => {});
    ok('4b "show on the map" flips to Explorer and builds the map', await until(page, () =>
      hbS().face === 'explorer' && igMapUp() && document.getElementById('hb-board').hidden, null, 10000));
    ok('4c the contract is lit on the map', await until(page, () => (intel.lenses || []).some(l => (l.ids || []).includes('MK-S1'))));
    await page.click('[data-hb-face="board"]').catch(() => {});
    await until(page, () => hbS().face === 'board' && !document.getElementById('hb-board').hidden);
    await page.click('[data-hb-crumb="-1"]').catch(() => {});

    /* ===== 5. WHAT MOVED ===== */
    await page.evaluate(() => { const s = hbS(); const base = JSON.parse(JSON.stringify(hbSeenNow(hbBookData('all'))));
      base.at = '2026-01-01'; base.figs.live.n -= 2; base.figs.live.ids = base.figs.live.ids.slice(2);
      s.seen = { base: null, last: base }; hbSave(); hbPaintBoard(); });
    const M = await page.evaluate(() => ({ live: (document.querySelector('.hb-fd[data-hb-dig="mv:live"]') || {}).textContent || '',
      others: document.querySelectorAll('.hb-fd').length }));
    ok('5a a figure that moved carries its chip', /2/.test(M.live), JSON.stringify(M));
    ok('5b a figure that did not move carries none', M.others === 1, JSON.stringify(M));

    /* ===== 6. WATCH A NUMBER ===== */
    await page.click('.hb-fig-main[data-hb-dig="f:live"]');
    await until(page, () => !!document.querySelector('[data-hb-watch]'));
    await page.click('[data-hb-watch]').catch(() => {});
    const formUp = await until(page, () => !!document.querySelector('[data-hb-watch-form]'));
    if (formUp) {
      await page.evaluate(() => { const f = document.querySelector('[data-hb-watch-form]'); f.dir.value = 'above'; f.n.value = '3'; });
      await page.click('[data-hb-watch-form] button[type="submit"]');
    }
    ok('6a a watch over the line is a row in the bell', await until(page, () =>
      buildAlerts().some(a => a.kind === 'watch')));
    await page.click('[data-hb-crumb="-1"]').catch(() => {});

    /* ===== 7. GIVE A PANEL ===== */
    const pid = await page.evaluate(() => (hbS().panels[0] || {}).id || null);
    if (pid) await page.click(`[data-hb-pid="${pid}"] [data-hb-act="give"]`).catch(() => {});
    const giveUp = await until(page, () => !!document.querySelector('[data-hb-give-form]'));
    ok('7a Give opens a form naming colleagues, not addresses', giveUp && await page.evaluate(() =>
      [...document.querySelectorAll('[data-hb-give-form] select[name="to"] option')].every(o => !/@/.test(o.textContent) && /^u_/.test(o.value))));
    if (giveUp) {
      await page.evaluate(() => { const f = document.querySelector('[data-hb-give-form]');
        f.to.value = [...f.to.options].find(x => /Unrestricted/.test(x.textContent)).value; f.note.value = 'Look at the supplier side'; });
      await page.click('[data-hb-give-form] button[type="submit"]');
    }
    ok('7b the giver sees who it went to', await until(page, () => /Unrestricted Legal/.test((document.querySelector('.hb-given') || {}).textContent || '')));
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p2 = await ctx2.newPage();
    await signIn(p2, 'everything@example.co.ke', 'their-own-pass-9');
    ok('7c the colleague\'s Home carries the panel and the note', await until(p2, () => {
      const g = document.querySelector('[data-hb-pid^="gift:"]');
      const from = g && g.querySelector('.hb-given.is-from');
      return !!from && /Amina Otieno/.test(from.textContent) && /Look at the supplier side/.test(from.title);
    }, null, 10000));
    await p2.screenshot({ path: path.join(OUT, '7-colleague.png') });
    await ctx2.close();
    await page.evaluate(() => hbGiftsLoad(true));
    ok('7d the giver sees the seen tick', await until(page, () => {
      const s = Object.values(hbGiftsFor().sent)[0]; return !!(s && s.seenAt);
    }));

    /* ===== 8. PRESENT, THE POINTER AND THE PEN ===== */
    const toolsAtRest = await page.evaluate(() => getComputedStyle(document.getElementById('hb-tools')).display);
    ok('8a the tools are not drawn outside Present', toolsAtRest === 'none', toolsAtRest);
    await page.click('#hb-present');
    ok('8b Present puts the page in presenting, the pointer on', await until(page, () =>
      document.getElementById('ig-page').classList.contains('hb-presenting') && !document.getElementById('hb-laser').hidden
      && getComputedStyle(document.getElementById('hb-tools')).display !== 'none'));
    await page.click('[data-hb-tool="pen"]').catch(() => {});
    await page.mouse.move(400, 300); await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(400 + i * 20, 300 + i * 8);
    await page.mouse.up();
    const inked = await page.evaluate(() => { const c = document.getElementById('hb-ink'); if (!c || !c.width) return 0;
      const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < x.length; i += 4) if (x[i]) n++; return n; });
    ok('8c the pen paints on the screen', inked > 50, String(inked));
    await page.screenshot({ path: path.join(OUT, '8-present.png') });
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    ok('8d Escape brings everything back', await until(page, () =>
      !document.getElementById('ig-page').classList.contains('hb-presenting')
      && getComputedStyle(document.getElementById('hb-tools')).display === 'none'));

    /* ===== 9. THE SCREEN'S OWN LIGHT ===== */
    await page.click('[data-hb-screen="light"]');
    await page.evaluate(() => { if (typeof setDark === 'function') setDark(true); });
    const ink = await page.evaluate(() => getComputedStyle(document.getElementById('ig-page')).getPropertyValue('--hb-ink').trim().toUpperCase());
    ok('9a Light stays light when the platform is dark', ink === '#141F1D', ink);
    await page.screenshot({ path: path.join(OUT, '9-light-on-dark-platform.png') });
    await page.evaluate(() => { if (typeof setDark === 'function') setDark(false); });
    await page.click('[data-hb-screen="dark"]');

    /* ===== 10. INSIGHTS KEEPS THE DETAIL ===== */
    await page.evaluate(() => setView('intel'));
    await until(page, () => state.view === 'intel' && !!document.querySelector('[data-ig-tab]'));
    ok('10a Insights has no Explorer tab', await page.evaluate(() =>
      !!document.querySelector('[data-ig-tab="frame"]') && !document.querySelector('[data-ig-tab="map"]')));
    await page.evaluate(() => { intel.tab = 'map'; setView('intel'); });
    ok('10b an old door to Explorer lands on Home\'s Explorer side', await until(page, () =>
      state.view === 'dashboard' && hbS().face === 'explorer' && igMapUp(), null, 10000));

    /* ===== 11. A QUESTION ASKED ON THE BOARD LANDS ON THE BOARD =====
       Young, 3 Oct 2026, off a screenshot: "the dashboard is not responding to
       my prompts although the explorer page does respond". A name, "expired",
       "past due", and a list that came back from the map all draw on the board. */
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.panels = []; s.path = []; hbSave(); setView('dashboard'); });
    await until(page, () => !!document.querySelector('#hb-board .hb-book'));
    const landsOn = async (q, test) => { await ask(page, q); return until(page, test, null, 10000); };
    ok('11a "Show me all Kenya Cartons contracts" lists that counterparty\'s contracts on the board', await landsOn('Show me all Kenya Cartons contracts', () =>
      /^q:/.test((hbS().path || []).slice(-1)[0] || '') && [...document.querySelectorAll('#hb-focus [data-hb-dig^="c:"]')].map(e => e.getAttribute('data-hb-dig')).join() === 'c:MK-S1'
      && /Kenya Cartons/.test((document.querySelector('#hb-focus .hb-ct') || {}).textContent || '')));
    /* ONE READER FOR BOTH SCREENS (the owner's review): the same question
       narrows the map to the same contracts, without Copilot, and "Show
       these on the map" narrows rather than lights. */
    await page.click('#hb-focus [data-hb-map]').catch(() => {});
    ok('11a2 "Show these on the map" narrows the map to exactly those, not everything lit', await until(page, () => {
      const a = intelActive(); return hbS().face === 'explorer' && !!a.ids && a.action === 'filter' && [...a.ids].join() === 'MK-S1'; }, null, 10000));
    await page.evaluate(() => { intel.lenses = []; intel.history = []; });
    await ask(page, 'Show me all Kenya Cartons contracts');
    ok('11a3 asked on the map, the same words narrow the map to the same contracts, free', await until(page, () => {
      const a = intelActive(); return !!a.ids && [...a.ids].join() === 'MK-S1' && !intel.busy; }, null, 10000));
    await page.click('[data-hb-face="board"]'); await until(page, () => hbS().face === 'board' && !document.getElementById('hb-board').hidden);
    await ask(page, 'show me the signed Juno contracts in procurement');
    ok('11a4 conditions combine: a name, a stage and a stream are one list', await until(page, () =>
      /^q:/.test((hbS().path || []).slice(-1)[0] || '') && [...document.querySelectorAll('#hb-focus [data-hb-dig^="c:"]')].map(e => e.getAttribute('data-hb-dig')).join() === 'c:MK-J1'));
    ok('11b "Show me all expired contracts" is past the end date, not ending soon', await landsOn('Show me all expired contracts', () =>
      (hbS().path || []).slice(-1)[0] === 'f:past' && !!document.querySelector('#hb-focus [data-hb-dig="c:MK-S2"]')));
    ok('11c "Show me agreements that are past due" puts the overdue obligations on the board', await landsOn('Show me agreements that are past due', () =>
      hbS().panels.some(p => p.kind === 'obl') && !!document.querySelector('#hb-board [data-hb-pid] .hb-ct')));
    /* a lens left on the map narrows a "top N" to what is showing (the map's
       own follow-up rule), so the map is cleared first */
    await page.evaluate(() => { intel.lenses = intel.lenses.filter(l => l.hb); });
    ok('11d a list the map answers with is drawn on the board too', await landsOn('show the 3 largest contracts', () =>
      (hbS().path || []).slice(-1)[0] === 'ls' && document.querySelectorAll('#hb-focus [data-hb-dig^="c:"]').length === 3));

    /* ===== 12. TWO TABS, ONE BOARD =====
       Each tab used to keep its own copy and write it back whole on every
       paint, so a panel added in one tab vanished when another tab saved. */
    const tab2 = await ctx.newPage();
    tab2.on('pageerror', e => errs.push('tab2: ' + e.message));
    await tab2.goto(h.base + '/', { waitUntil: 'networkidle' });
    await until(tab2, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    await tab2.evaluate(() => setView('dashboard'));
    await until(tab2, () => !!document.querySelector('#hb-board .hb-book'));
    await ask(page, 'show negotiation friction');
    await until(page, () => hbS().panels.some(p => p.kind === 'fric'));
    ok('12a the other tab picks up the panel this tab added', await until(tab2, () => hbS().panels.some(p => p.kind === 'fric')));
    await tab2.evaluate(() => hbPaintBoard());
    await page.reload({ waitUntil: 'networkidle' });
    await until(page, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    await page.evaluate(() => setView('dashboard'));
    ok('12b and after the other tab saves, a reload still has it', await until(page, () => hbS().panels.some(p => p.kind === 'fric')));
    await tab2.close();

    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
