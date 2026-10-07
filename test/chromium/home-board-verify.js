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
      dark: !!document.querySelector('#ig-page.hb-dark'), light: !!document.querySelector('#ig-page.hb-light'),
      order: [...document.querySelectorAll('#hb-head [data-hb-screen]')].map(b => b.getAttribute('data-hb-screen')).join(','), up: typeof igMapUp === 'function' ? igMapUp() : null,
      nums: [...document.querySelectorAll('.hb-fig .hb-fig-n')].map(e => e.textContent.trim()),
      want: typeof hbBookData === 'function' ? hbBookData('all').figs : null }));
    /* the Board LANDS LIGHT, Light before Dark (Young, 6 Oct 2026) */
    ok('1b the board side, on the Light screen, Light first', L.face === 'board' && L.light && !L.dark && L.order === 'light,dark', JSON.stringify([L.face, L.light, L.order]));
    ok('1c the map is not built while the board covers it', L.up === false);
    ok('1d live, ending, past and overdue print the book\'s own counts',
      !!L.want && L.nums[0] === String(L.want.live.n) && L.nums[2] === String(L.want.ending.n)
        && L.nums[3] === String(L.want.past.n) && L.nums[4] === String(L.want.overdue.n), JSON.stringify(L.nums));
    await page.screenshot({ path: path.join(OUT, '1-landing.png') });

    /* ===== 2. A FIGURE IS A DOOR WITH A TRAIL ===== */
    if (landed) await page.click('.hb-fig-main[data-hb-dig="f:live"]');
    ok('2a pressing Live contracts opens the dig-in', await until(page, () => !!document.querySelector('#hb-board .hb-dig')));
    /* CHART FIRST (3 Oct 2026): the dig-in opens as a chart; its set is read
       off the card's own data, and 13c proves the list switch */
    const digIds = () => page.evaluate(() => (hbDigData((hbS().path || []).slice(-1)[0], hbS().lens) || { ids: [] }).ids.slice());
    ok('2b the dig-in counts the live contracts', (await digIds()).length === await page.evaluate(() => hbBookData('all').figs.live.n)
      && await page.evaluate(() => /\d/.test((document.querySelector('#hb-focus .hb-chart-lead') || {}).textContent || '')));
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
    /* the pointer waits for its button (Young, 6 Oct 2026) */
    ok('8b Present puts the page in presenting, the pointer OFF', await until(page, () =>
      document.getElementById('ig-page').classList.contains('hb-presenting')
      && !(document.getElementById('hb-laser') && !document.getElementById('hb-laser').hidden)
      && !document.getElementById('ig-page').classList.contains('hb-pointing')
      && getComputedStyle(document.getElementById('hb-tools')).display !== 'none'));
    await page.click('[data-hb-tool="pointer"]').catch(() => {});
    /* THE POINTER ONLY POINTS (Young, 7 Oct 2026): a veil over the whole
       screen carries the dot; its Exit is the one thing that takes a click */
    ok('8b2 Pointer turns it on', await until(page, () => !!document.getElementById('hb-veil')
      && document.getElementById('ig-page').classList.contains('hb-pointing')));
    await page.click('#hb-veil .hb-veil-exit').catch(() => {});
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
      /^q:/.test((hbS().path || []).slice(-1)[0] || '') && hbDigData((hbS().path || []).slice(-1)[0], 'all').ids.join() === 'MK-S1'
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
      /^q:/.test((hbS().path || []).slice(-1)[0] || '') && hbDigData((hbS().path || []).slice(-1)[0], 'all').ids.join() === 'MK-J1'));
    ok('11b "Show me all expired contracts" is past the end date, not ending soon', await landsOn('Show me all expired contracts', () =>
      (hbS().path || []).slice(-1)[0] === 'f:past' && hbDigData('f:past', 'all').ids.includes('MK-S2')));
    ok('11c "Show me agreements that are past due" puts the overdue obligations on the board', await landsOn('Show me agreements that are past due', () =>
      hbS().panels.some(p => p.kind === 'obl') && !!document.querySelector('#hb-board [data-hb-pid] .hb-ct')));
    /* a lens left on the map narrows a "top N" to what is showing (the map's
       own follow-up rule), so the map is cleared first */
    await page.evaluate(() => { intel.lenses = intel.lenses.filter(l => l.hb); });
    ok('11d a list the map answers with is drawn on the board too', await landsOn('show the 3 largest contracts', () =>
      (hbS().path || []).slice(-1)[0] === 'ls' && hbDigData('ls', 'all').ids.length === 3 && !!document.querySelector('#hb-focus .hb-chart-lead')));

    /* ===== 13. CHART FIRST (Young, 3 Oct 2026 evening) =====
       "the output should be in chart format and then you can get an option
       to make it a list" — measured where the owner looks. */
    await page.click('[data-hb-crumb="-1"]').catch(() => {});
    await page.evaluate(() => { intel.lenses = intel.lenses.filter(l => l.hb); });
    await ask(page, 'Show me all Juno contracts');
    ok('13a a list answer draws a chart first, no rows — the Ring for a plain question, every slice a door', await until(page, () =>
      !!document.querySelector('#hb-focus .hb-chart-lead') && document.querySelectorAll('#hb-focus .hb-svg.hb-ring [data-hb-dig^="qg:"]').length >= 2 && !document.querySelector('#hb-focus .hb-rows')));
    /* THE CHART FAMILY (Young picked the recommendation, 4 Oct 2026): the
       ring is painted and read by a keyboard; Bars is on the switch */
    const ring = await page.evaluate(() => { const p = document.querySelector('#hb-focus .hb-ring [data-hb-dig] path'); const r = p.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + 2; const hit = document.elementFromPoint(cx, cy); return { w: Math.round(r.width), painted: getComputedStyle(p).fill !== 'none' && getComputedStyle(p).fill !== 'rgba(0, 0, 0, 0)', hit: !!(hit && hit.closest('.hb-ring')), title: (p.parentNode.querySelector('title') || {}).textContent || '' }; });
    ok('13h the ring is painted on the page and every slice says what it is on hover', ring.w > 60 && ring.painted && ring.hit && /\d/.test(ring.title), JSON.stringify(ring));
    await page.focus('#hb-focus .hb-ring [data-hb-dig^="qg:"]');
    await page.keyboard.press('Enter');
    ok('13i Enter on a focused slice digs one step deeper', await until(page, () => (hbS().path || []).length === 2 && /^qg:/.test((hbS().path || [])[1])));
    await page.click('[data-hb-crumb="0"]').catch(() => {});
    await until(page, () => (hbS().path || []).length === 1);
    const pick = async (part, v) => { await page.click(`#hb-focus [data-hb-rc="${part}"]`); await until(page, p => !!document.querySelector(`#hb-focus [data-hb-rset="${p}"]`), part + ':' + v); await page.click(`#hb-focus [data-hb-rset="${part}:${v}"]`); };
    await pick('pic', 'bars');
    await until(page, () => document.querySelectorAll('#hb-focus .hb-cbar').length >= 2);
    /* the bar grows in over 0.7 s: asked for the state, bounded */
    await until(page, () => { const b = document.querySelector('#hb-focus .hb-cbar[data-hb-dig] .hb-cbar-f'); return !!b && b.getBoundingClientRect().width > 4; });
    const bar = await page.evaluate(() => { const b = document.querySelector('#hb-focus .hb-cbar[data-hb-dig]'); const r = b.getBoundingClientRect(); const f = b.querySelector('.hb-cbar-f').getBoundingClientRect();
      return { h: Math.round(r.height), filled: f.width > 4, painted: getComputedStyle(b.querySelector('.hb-cbar-f')).backgroundColor !== 'rgba(0, 0, 0, 0)', text: b.textContent.replace(/\s+/g, ' ').trim() }; });
    ok('13b on the Bars picture every bar is a painted button with its words and its number', bar.h >= 30 && bar.filled && bar.painted && /\d/.test(bar.text), JSON.stringify(bar));
    const h0 = await page.evaluate(() => document.querySelector('#hb-focus .hb-dig').getBoundingClientRect().height);
    await page.click('#hb-focus [data-hb-digbig]');
    ok('13e expanded, the chart grows for the room', await until(page, h => !!document.querySelector('#hb-focus .hb-dig.is-big') && document.querySelector('#hb-focus .hb-dig').getBoundingClientRect().height > h + 40, h0));
    await page.click('#hb-focus [data-hb-digbig]');
    await until(page, () => !document.querySelector('#hb-focus .hb-dig.is-big'));
    await pick('pic', 'list');
    ok('13c the List picture shows the list the owner had', await until(page, () => document.querySelectorAll('#hb-focus .hb-rows [data-hb-dig^="c:"]').length >= 2 && !document.querySelector('#hb-focus .hb-chart-lead')));
    await pick('pic', 'ring');
    await until(page, () => !!document.querySelector('#hb-focus .hb-ring'));
    await page.click('#hb-focus .hb-ring .hb-sv-row[data-hb-dig]');
    ok('13d a legend row digs one step deeper and the trail says so', await until(page, () =>
      (hbS().path || []).length === 2 && /^qg:/.test((hbS().path || [])[1]) && document.querySelectorAll('#hb-focus .hb-trail button').length >= 2 && !!document.querySelector('#hb-focus .hb-chart-lead')));
    await page.click('[data-hb-crumb="-1"]').catch(() => {});
    await ask(page, 'how many contracts have value between 2 million and 40 million?');
    ok('13f a value range is answered free, as the Blocks sized by value, with the count in the panel', await until(page, () =>
      /^q:/.test((hbS().path || []).slice(-1)[0] || '') && !!document.querySelector('#hb-focus .hb-blocks [data-hb-dig^="c:"]') && /between 2M and 40M/.test((intel.history.slice(-1)[0] || {}).text || '') && !intel.busy));
    await page.click('[data-hb-crumb="-1"]').catch(() => {});
    await ask(page, 'which contracts end in the next 12 months');
    ok('13g a date question is the Timeline: today marked, each month with an ending a door, each pill a contract', await until(page, () =>
      document.querySelectorAll('#hb-focus .hb-tl [data-hb-dig^="qm:"]').length >= 1 && document.querySelectorAll('#hb-focus .hb-tl [data-hb-dig^="c:"]').length >= 1 && !!document.querySelector('#hb-focus .hb-tl .hb-sv-today')));
    const big = await page.evaluate(() => { const s = document.querySelector('#hb-focus .hb-svg'); return s ? s.getBoundingClientRect().width : 0; });
    await page.click('#hb-focus [data-hb-digbig]');
    ok('13j expanded, the timeline grows with the room', await until(page, w => { const s = document.querySelector('#hb-focus .hb-dig.is-big .hb-svg'); return !!s && s.getBoundingClientRect().width > w + 100; }, big));
    await page.click('#hb-focus [data-hb-digbig]');
    await until(page, () => !document.querySelector('#hb-focus .hb-dig.is-big'));

    /* ===== 14. THE COUNT FOLLOWS THE QUESTION (Young: "the top constant 6
       cards should also change based on the results of the latest output") */
    await page.click('[data-hb-crumb="-1"]').catch(() => {});
    await until(page, () => !hbCountKey());
    const whole = await page.evaluate(() => hbBookData('all', { whole: true }).figs.live.n);
    await ask(page, 'Show me all Juno contracts');
    const counted = await page.evaluate(() => { const d = hbBookData('all'); return { live: d.figs.live.n, set: hbDigData(hbCountKey(), 'all').ids.length, tile: (document.querySelector('#hb-book .hb-fig .hb-fig-n') || {}).textContent, sub: (document.querySelector('#hb-book .hb-cs') || {}).textContent, chip: (document.querySelector('.hb-counting .is-count') || {}).textContent }; });
    ok('14a the six figures recount for the question\'s set, the tile says so, and the chip names it', counted.live < whole && counted.live <= counted.set && String(counted.tile).replace(/\D/g, '') === String(counted.live) && /Juno/.test(counted.sub) && /Juno/.test(counted.chip), JSON.stringify({ whole, ...counted }));
    ok('14a2 the live line above the book names the set too', await page.evaluate(() => /Juno/i.test((document.querySelector('#hb-board .hb-note') || {}).textContent || '')));
    await page.click('[data-hb-face="explorer"]');
    ok('14b flipped to Explorer, the map is narrowed to the same set', await until(page, () => { const L = intel.lenses.find(l => l.id === 'hbcount'); return !!L && L.on && L.action === 'filter' && L.ids.length === hbDigData(hbCountKey(), 'all').ids.length; }));
    await page.click('[data-hb-face="board"]');
    await until(page, () => hbS().face === 'board' && !!document.querySelector('.hb-counting .is-count [data-hb-crumb="-1"]'));
    /* 14d (Young, 4 Oct 2026: "when I press any one of the cards, the numbers
       return to the whole list") — a card pressed while counting opens within it */
    const liveBtn = await page.$('#hb-book [data-hb-dig="f:live"]');
    if (liveBtn) await liveBtn.click();
    ok('14d a card pressed while counting Juno opens within Juno: the six stay, the trail names Juno, the list is Juno\'s', !!liveBtn && await until(page, n => {
      const p = hbS().path || [], trail = (document.querySelector('#hb-focus .hb-crumbs, #hb-focus .hb-trail') || document.querySelector('#hb-focus') || {}).textContent || '';
      return p.length === 2 && p[1] === 'f:live' && /^q:/.test(p[0]) && hbBookData('all').figs.live.n === n
        && String((document.querySelector('#hb-book .hb-fig .hb-fig-n') || {}).textContent).replace(/\D/g, '') === String(n)
        && /Juno/.test(trail) && hbDigData('f:live', 'all').ids.length === n && !!document.querySelector('.hb-counting .is-count');
    }, counted.live), JSON.stringify(await page.evaluate(() => ({ path: hbS().path, live: hbBookData('all').figs.live.n }))));
    await page.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter(a => a.effect && a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))), new Promise(r => setTimeout(r, 2000))]));
    await page.screenshot({ path: path.join(OUT, '14d-card-within-the-count.png') });
    await page.click('.hb-counting .is-count [data-hb-crumb="-1"]');
    /* RE-POINTED 4 Oct 2026: the whole book no longer says so. "Counting ·
       All contracts" was the reader's own default read back to them, and the
       owner asked for it off the top of the page — so the way back is the
       chip DISAPPEARING, not a chip that names everything. */
    ok('14c the chip\'s × brings the whole book back, and says nothing once it is back', await until(page, w =>
      !hbCountKey() && hbBookData('all').figs.live.n === w
      && !document.querySelector('.hb-counting .is-all')
      && !(document.querySelector('.hb-counting') || {}).textContent.trim(), whole));

    /* ===== 15. THE RECIPE (Young, "Build it", 4 Oct 2026: "when I ask for a
       timeline by month the charts do not come out as I asked") — measured
       where the owner looks */
    await ask(page, 'Show Juno contracts by month');
    /* ONE RECIPE LANGUAGE (work order Part 1, 4 Oct 2026): the row gained
       Then by, Order, Period and Compare, behind one "More" until used */
    ok('15a "by month" draws month columns, each a door, with the recipe\'s dropdowns and the trend switch on the card', await until(page, () =>
      document.querySelectorAll('#hb-focus .hb-cols [data-hb-dig^="qm:"]').length >= 1 && ['which', 'split', 'pic', 'measure'].every(p => document.querySelector(`#hb-focus .hb-recipe [data-hb-rc="${p}"]`)) && !!document.querySelector('#hb-focus .hb-recipe [data-hb-rmore]') && !!document.querySelector('#hb-focus .hb-recipe [data-hb-rtrend]') && /month/i.test(document.querySelector('#hb-focus [data-hb-rc="split"]').textContent)));
    await page.click('#hb-focus [data-hb-rc="pic"]');
    const menu = await page.evaluate(() => { const m = document.querySelector('#hb-focus .hb-rmenu'); if (!m) return null; const r = m.getBoundingClientRect(); const top = document.elementFromPoint(r.left + 30, r.top + 14);
      return { h: Math.round(r.height), onTop: !!(top && top.closest('.hb-rmenu')), dead: [...m.querySelectorAll('button:disabled')].map(b => b.title).filter(Boolean).length, opts: m.querySelectorAll('button').length }; });
    const nPics = await page.evaluate(() => HB_PICS.length);
    ok('15b the Picture dropdown is painted on top, every picture listed, a dead one says why', !!menu && menu.onTop && menu.opts === nPics && menu.dead >= 1 && menu.h > 100, JSON.stringify(menu));
    await page.keyboard.press('Escape');
    ok('15c Escape closes it and gives the keyboard back to the dropdown', await until(page, () => !document.querySelector('#hb-focus .hb-rmenu') && (document.activeElement || {}).getAttribute && document.activeElement.getAttribute('data-hb-rc') === 'pic'));
    await pick('pic', 'gantt');
    ok('15d one press turns the same set into contract bars, and it is kept for this card', await until(page, () => !!document.querySelector('#hb-focus .hb-tl [data-hb-dig^="c:"]') && (hbS().recipe[(hbS().path || []).slice(-1)[0]] || {}).pic === 'gantt'));
    /* RE-POINTED 7 Oct 2026 (the one-build work order A2): the opening word
       "Show" is read away, so the card's key is its own — read off the trail */
    await page.click('[data-hb-crumb="-1"]').catch(() => {});
    await ask(page, 'Is time to sign getting faster?');
    ok('15e a trend question draws columns with the trend on — a line and its sentence, or the plain reason there is not enough history', await until(page, () =>
      document.querySelector('#hb-focus [data-hb-rtrend]').getAttribute('aria-pressed') === 'true'
      && (!!document.querySelector('#hb-focus .hb-sv-trend') && /→/.test((document.querySelector('#hb-focus .hb-tr-say') || {}).textContent || '') || /Not enough history yet/.test((document.querySelector('#hb-focus .hb-chart-note') || {}).textContent || ''))));
    await page.click('[data-hb-crumb="-1"]').catch(() => {});
    await ask(page, 'How many live contracts did we have each month?');
    ok('15f live contracts each month read the monthly picture of the book from the server', await until(page, () =>
      !!document.querySelector('#hb-focus .hb-sv-trend-dot') && /monthly picture/.test(document.querySelector('#hb-focus').textContent)), await page.evaluate(() => JSON.stringify({ t: ((document.querySelector('#hb-focus') || {}).textContent || '').slice(0, 300), path: hbS().path, snaps: typeof _hbSnaps })));
    ok('15g a chart of the whole book does not recount Your book', await page.evaluate(() => !hbCountKey() || !hbCountIds('all')));
    await page.click('[data-hb-crumb="-1"]').catch(() => {});

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
