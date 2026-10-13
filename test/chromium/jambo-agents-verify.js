/* JAMBO'S AGENTS BEHIND INSIGHTS (Young, 12 Oct 2026: "have two folders when
   you hover over it one for insights and the other for the agents. Just like
   when you have hover over the contracts page", then the house she chose, a
   speed, a contract typed by its number, per-agent points in Settings, and a
   new agent moving into the house and Settings by itself).

   WHAT THIS PINS, driven in a real browser on a seeded book
     1 the menu: Insights is an opener; hovering it opens a fly-out with
       Insights and Jambo's agents; a second press on the opener closes it
     2 the page: one room per agent in AG_KEYS (a card each in the score
       panel), the house drawn at the height its floors need, three tabs
     3 the points are the server's record: three briefs used, a chase thrown
       away and an answer changed come to 75 − 4 + 27 = 98 points; a refresh
       lands back on the page with the same total
     4 the contract typed by its number: the list narrows as you type, Enter
       takes the top match, and the total is that contract's alone; × widens it
     5 the architect's drawing is the same house, drawn taller (a roof; its title
       block removed, owner 13 Oct 2026);
       the Look is a dropdown whose choice is the person's default (owner, 13 Oct 2026)
     6 the speed is a labelled box, and Play moves the replay
    13 the end card closes by its ×, Esc, or a press beside it (owner, 13 Oct 2026)
    17 the agents' past rebuilt from the records: previewed, written marked as
       rebuilt, scored only where clear, never twice, removable (13 Oct 2026)
    16 C–F: an agent moves only for its real work, a pop names its contract, a
       quiet room says why and every room its setting, and the panel and end
       card count contracts touched, dates caught, chases and nudges (13 Oct 2026)
    15 work shows when Jambo prepares it: the four reading agents report what
       they laid out (checked by the server, kept once), the replay shows
       "prepared", and a person's press decides that same piece (13 Oct 2026)
    14 one agent at a time: a pressed card names itself on Play, the replay
       plays that agent alone, the end card counts it alone (owner, 13 Oct 2026)
     7 Settings → Jambo's agents carries one points row per agent; a box left
       is saved for everyone, and the house counts with it
     8 the Board's "The agents" opens this page (one place for the agents)
     2 the house fits the window and is drawn at its real size (owner, 13 Oct
       2026: "too big … grainy"); no facts line under the title; the filters
       are labelled boxes beside the tabs, Play rides in the house's header, and
       the house never scrolls inside itself — a very short window takes four
       rooms a floor (owner picked "Beside the tabs", 13 Oct 2026); an opened
       dropdown wears no dark outline (owner, 13 Oct 2026)
    12 opened a moment before sign-in finishes, the page waits and reads after it
    11 a 2× screen gets twice the pixels; a short window shrinks the floors
     9 no free room (owner, 13 Oct 2026): the agents fill every floor evenly and
       the rooms widen; a new floor only when every floor holds three
    10 the period is a transition, not a reload: the page and its house stay;
       Custom… takes a typed number of days (1–120), refuses others with the
       reason, and a refresh keeps it

   Run: node test/chromium/jambo-agents-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
let ptsTab = async () => {};
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };

const DAY = 86400000, ago = d => new Date(Date.now() - d * DAY).toISOString();
const CONTRACTS = [
  H.fixtureContract('MK-JA1', 'Raw milk supply', 'Nandi Dairy', H.FOLDER_A, 12e6, 'Signed'),
  H.fixtureContract('MK-JA2', 'Cold chain logistics', 'Siginon Group', H.FOLDER_A, 8e6, 'Under Review'),
  H.fixtureContract('MK-JA3', 'Office lease', 'Britam Properties', H.FOLDER_B, 4e6, 'Signed'),
  H.fixtureContract('MK-JA4', 'Packaging services', 'Nampak Kenya', H.FOLDER_B, 3e6, 'Draft'),
  H.fixtureContract('MK-JA5', 'Mutual NDA', 'Juno Ltd', H.FOLDER_A, 0, 'Signed'),
];
/* History for the rebuild (section 17): a file imported 10 days ago and checked
   a day later; an approval asked 8 days ago and given the next day. */
Object.assign(CONTRACTS[3], { migration: { importedAt: ago(10), needsReview: false },
  audit: [{ at: ago(9), user: 'Ama Reviewer', action: 'Migration review', detail: 'Extracted details confirmed' }] });
Object.assign(CONTRACTS[2], { signApprovals: [{ id: 'sa1', askedAt: ago(8), status: 'approved', decidedAt: ago(7), decidedBy: { name: 'Ama Approver' } }] });

(async () => {
  const h = await H.startHati();
  await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const b = await chromium.launch({ executablePath: EXEC });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  /* the agents' cards sit on the panel's Points tab (the Work log is the first) */
  ptsTab = () => page.evaluate(() => { const t = document.querySelector('[data-jh-ptab="points"]'); if (t && t.getAttribute('aria-selected') !== 'true') t.click(); });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => typeof setView === 'function' && state.contracts && state.contracts.length === 5, null, { timeout: 15000 });

    console.log('\n1 · the menu');
    await page.hover('[data-nav-fold-open="insights"]');
    await page.waitForFunction(() => document.querySelector('.nav-fold[data-nav-fold="insights"]').classList.contains('is-hover'), null, { timeout: 3000 }).catch(() => {});
    const fly = await page.evaluate(() => {
      const f = document.querySelector('.nav-fold[data-nav-fold="insights"]'), sub = f && f.querySelector('.nav-sub');
      const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden');
      return { open: vis(sub), items: sub ? [...sub.querySelectorAll('.nav-item')].filter(vis).map(x => x.getAttribute('data-view')) : [],
        face: !!(sub && sub.querySelector('[data-view="jambo"] img.jambo-face[src^="data:image"]')), beside: sub ? Math.round(sub.getBoundingClientRect().left) > Math.round(f.getBoundingClientRect().right) - 2 : false };
    });
    ok('1a hovering Insights opens a fly-out beside the menu', fly.open && fly.beside, JSON.stringify(fly));
    ok('1b …with two folders: Insights and Jambo\'s agents (his face on it)', fly.items.join(' ') === 'intel jambo' && fly.face, fly.items.join(' '));
    await page.mouse.move(900, 500);
    await page.click('[data-nav-fold-open="insights"]');
    const opened = await page.evaluate(() => document.querySelector('.nav-fold[data-nav-fold="insights"]').classList.contains('is-open'));
    await page.click('[data-nav-fold-open="insights"]');
    const shut = await page.evaluate(() => !document.querySelector('.nav-fold[data-nav-fold="insights"]').classList.contains('is-open'));
    ok('1c a press opens it and a second press closes it', opened && shut, `${opened} ${shut}`);

    console.log('\n2 · the page');
    await page.click('[data-nav-fold-open="insights"]');
    await page.click('.nav-item[data-view="jambo"]');
    await page.waitForFunction(() => !!document.querySelector('#jh-cv') && document.querySelectorAll('[data-jh-agent]').length > 0, null, { timeout: 8000 }).catch(() => {});
    const pg = await page.evaluate(() => ({ view: state.view, cards: [...document.querySelectorAll('[data-jh-agent]')].map(x => x.getAttribute('data-jh-agent')),
      keys: AG_KEYS.slice(), h: document.getElementById('jh-cv').height, tabs: [...document.querySelectorAll('[data-jh-tab]')].map(x => x.getAttribute('data-jh-tab')),
      current: document.querySelector('[data-nav-fold-open="insights"]').classList.contains('is-current') }));
    /* the agents' cards live on the panel's Points tab; the Work log is the first */
    const logFirst = await page.evaluate(() => { const lg = document.getElementById('jh-log'); const first = !!lg && !lg.hidden; document.querySelector('[data-jh-ptab="points"]').click(); return first; });
    ok('2a0 the panel opens on the Work log, the agents\' cards one tab away', logFirst);
    ok('2a one card per agent in AG_KEYS', pg.cards.length === pg.keys.length && pg.keys.every(k => pg.cards.includes(k)), pg.cards.join(' '));
    const fit = () => page.evaluate(() => { const cv = document.getElementById('jh-cv'), st = document.getElementById('jh-stage'), dpr = window.devicePixelRatio || 1;
      return { bottom: Math.round(st.getBoundingClientRect().bottom), win: window.innerHeight, sharp: cv.width === Math.round(cv.clientWidth * dpr) && Math.abs(cv.height - Math.round(cv.clientHeight * dpr)) <= 1,
        floors: jhGeom().floors, fh: jhGeom().fh, scrolls: st.scrollHeight > st.clientHeight + 1 }; });
    const f2 = await fit();
    const offices = await page.evaluate(() => AG_KEYS.filter(k => !AG_READINGS.includes(k)).length), cols2 = await page.evaluate(() => jhGeom().cols);
    ok('2b the office fits the window (no part below the screen): two floors of shared rooms, the agents\' offices three (or four) a floor, your desk on top', f2.bottom <= f2.win && f2.floors === 3 + Math.ceil(offices / cols2), JSON.stringify({ f2, offices, cols2 }));
    ok('2b2 drawn at its real size on screen, not a stretched picture', f2.sharp, JSON.stringify(f2));
    ok('2b3 no facts line under the title', await page.evaluate(() => !document.getElementById('jh-facts') && !document.querySelector('.jh-band .page-facts')));
    ok('2c three tabs: the house, jobs, how points work', pg.tabs.join(' ') === 'house jobs how', pg.tabs.join(' '));
    const row = await page.evaluate(() => { const bar = document.querySelector('.jh-band .jh-tabbar'), tabs = bar && bar.querySelector('.jh-tabs'), fb = bar && bar.querySelector('.jh-fb');
      const inBar = ['jh-range', 'jh-one', 'jh-look', 'jh-speed'].map(id => !!(bar && bar.querySelector('#' + id)));
      const tb = tabs && tabs.getBoundingClientRect(), fr = fb && fb.getBoundingClientRect();
      return { inBar, oldRows: document.querySelectorAll('.jh-bar').length, sameLine: !!(tb && fr && Math.abs((tb.top + tb.bottom) / 2 - (fr.top + fr.bottom) / 2) < 12 && fr.left > tb.right),
        playInHouse: !!document.querySelector('.jh-housecard .jh-sh [data-jh-play]') && !!document.querySelector('.jh-housecard .jh-sh [data-jh-restart]') && !!document.querySelector('.jh-housecard .jh-sh #jh-prog') }; });
    ok('2f the four filters are labelled boxes on the tab row, beside the tabs (no control rows above the house)', row.inBar.every(Boolean) && row.oldRows === 0 && row.sameLine, JSON.stringify(row));
    ok('2g Play, Start again and the progress line ride in the house\'s own header', row.playInHouse, JSON.stringify(row));
    const rings = await page.evaluate(() => ['jh-range', 'jh-look', 'jh-speed'].map(id => { const e = document.getElementById(id); e.focus(); const c = getComputedStyle(e);
      const r = { id, outline: c.outlineStyle === 'none' || parseFloat(c.outlineWidth) === 0 ? '' : c.outlineStyle + ' ' + c.outlineWidth + ' ' + c.outlineColor, shadow: c.boxShadow }; e.blur(); return r; }));
    ok('2i an opened dropdown wears no dark outline (owner, 13 Oct 2026)', rings.every(r => !r.outline && r.shadow === 'none'), JSON.stringify(rings));
    ok('2h the house never scrolls inside itself', await page.evaluate(() => { const st = document.getElementById('jh-stage'); return !/(auto|scroll)/.test(getComputedStyle(st).overflowY) && st.scrollHeight <= st.clientHeight + 1; }));
    ok('2d the opener wears "you are here" on the page', pg.current);
    const painted = await page.evaluate(() => { const cv = document.getElementById('jh-cv'), x = cv.getContext('2d'), d = x.getImageData(0, 0, cv.width, cv.height).data;
      let ink = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i] < 200 || d[i + 1] < 200 || d[i + 2] < 200) ink++; return ink; });
    ok('2e the house is painted (not a blank canvas)', painted > 50, String(painted));

    console.log('\n3 · the points are the server\'s record');
    const said = await page.evaluate(async () => {
      const go = b => api('agents/outcome', 'POST', b).then(() => true, e => e.message);
      return [await go({ agent: 'paper', contractId: 'MK-JA1', outcome: 'used', ref: 'a' }), await go({ agent: 'paper', contractId: 'MK-JA2', outcome: 'used', ref: 'b' }),
        await go({ agent: 'paper', contractId: 'MK-JA3', outcome: 'used', ref: 'c' }), await go({ agent: 'late', contractId: 'MK-JA2', outcome: 'thrown', ref: 'o1' }),
        await go({ agent: 'round', contractId: 'MK-JA1', outcome: 'changed', ref: 'k1' }), await go({ agent: 'nope', outcome: 'used' }), await go({ agent: 'paper', outcome: 'maybe' })];
    });
    ok('3a outcomes are taken for real agents, refused for an unknown agent or outcome', said.slice(0, 5).every(x => x === true) && said[5] !== true && said[6] !== true, JSON.stringify(said));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof state !== 'undefined' && state.view === 'jambo' && document.getElementById('jh-total') && document.getElementById('jh-total').textContent !== '0', null, { timeout: 12000 }).catch(() => {});
    const tot = await page.evaluate(() => ({ view: state.view, t: (document.getElementById('jh-total') || {}).textContent }));
    ok('3b a refresh lands back on the page', tot.view === 'jambo', tot.view);
    ok('3c 3 briefs used × 25, a chase thrown −4, an answer changed 27 → 98 points', tot.t === '98', tot.t);

    console.log('\n4 · the contract typed by its number');
    await page.click('#jh-one');
    await page.keyboard.type('JA2');
    await page.waitForFunction(() => document.querySelectorAll('[data-jh-one]').length > 0, null, { timeout: 3000 }).catch(() => {});
    const opts = await page.evaluate(() => [...document.querySelectorAll('[data-jh-one]')].map(x => x.getAttribute('data-jh-one')));
    ok('4a the list narrows as you type', opts.length === 1 && opts[0] === 'MK-JA2', opts.join(' '));
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => (document.getElementById('jh-total') || {}).textContent === '21', null, { timeout: 4000 }).catch(() => {});
    const one = await page.evaluate(() => ({ t: (document.getElementById('jh-total') || {}).textContent, v: document.getElementById('jh-one').value }));
    ok('4b Enter takes it, and the total is that contract\'s alone (25 − 4 = 21)', one.t === '21' && /MK-JA2/.test(one.v), JSON.stringify(one));
    await page.click('#jh-one-x');
    await page.waitForFunction(() => (document.getElementById('jh-total') || {}).textContent === '98', null, { timeout: 4000 }).catch(() => {});
    ok('4c × goes back to every contract', await page.evaluate(() => document.getElementById('jh-total').textContent) === '98');
    await page.click('#jh-one'); await page.keyboard.type('XYZ-999');
    const none = await page.evaluate(() => (document.getElementById('jh-one-list') || {}).textContent || '');
    ok('4d a number with no work says so in the list', /XYZ-999/.test(none), none.slice(0, 120));
    await page.keyboard.press('Escape');

    console.log('\n5 · the architect\'s drawing');
    await page.evaluate(() => { document.querySelector('.jh-page').dataset.mark5 = 'same'; });
    await page.selectOption('#jh-look', '1', { timeout: 3000 }).catch(() => {});
    await page.waitForFunction(() => jhGeom().top === 128, null, { timeout: 4000 }).catch(() => {});
    const f5 = await fit(), g5 = await page.evaluate(() => jhGeom());
    ok('5a the drawing fits the same window, sharp', g5.top === 128 && f5.bottom <= f5.win && f5.sharp && !f5.scrolls, JSON.stringify({ f5, g5 }));
    ok('5a2 its title block is gone: the foot holds only the ground and measuring lines', g5.h - g5.top - g5.floors * g5.fh === 48, JSON.stringify(g5));
    ok('5b the Look is one dropdown, and changing it redraws in place (no rebuild)', await page.evaluate(() => !document.querySelector('[data-jh-look]') && document.querySelector('.jh-page').dataset.mark5 === 'same'));
    await page.waitForFunction(() => window.REMOTE && REMOTE.me && REMOTE.me.prefs && REMOTE.me.prefs.agentsLook === 'drawing', null, { timeout: 4000 }).catch(() => {});
    const noPlace = await page.evaluate(() => !('look' in jhPlace()));
    await page.evaluate(() => setView('dashboard'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof setView === 'function' && state.contracts && state.contracts.length === 5, null, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => setView('jambo'));
    await page.waitForFunction(() => !!document.getElementById('jh-look') && !!document.getElementById('jh-cv'), null, { timeout: 8000 }).catch(() => {});
    const kept5 = await page.evaluate(() => ({ v: state.view, sel: (document.getElementById('jh-look') || {}).value, h: (document.getElementById('jh-cv') || {}).height }));
    ok('5c the choice is this person\'s default: a fresh visit opens on it, kept in their account (not the browser\'s place)', noPlace && kept5.sel === '1', JSON.stringify(kept5) + ' noPlace=' + noPlace);
    await page.selectOption('#jh-look', '0', { timeout: 3000 }).catch(() => {});
    await page.waitForFunction(() => window.REMOTE && REMOTE.me && REMOTE.me.prefs && REMOTE.me.prefs.agentsLook === 'plan', null, { timeout: 4000 }).catch(() => {});

    console.log('\n6 · speed and play');
    await page.selectOption('#jh-speed', '4');
    const sp = await page.evaluate(() => ({ v: document.getElementById('jh-speed').value, kept: jhPlace().speed }));
    ok('6a Speed is a labelled box, and Fastest is taken', sp.v === '4' && sp.kept === 4, JSON.stringify(sp));
    await page.click('[data-jh-play]');
    await page.waitForFunction(() => { const w = parseFloat((document.getElementById('jh-prog') || {}).style.width || '0'); return w > 5 && w < 100; }, null, { timeout: 5000 }).catch(() => {});
    const w = await page.evaluate(() => parseFloat(document.getElementById('jh-prog').style.width || '0'));
    ok('6b Play moves the replay', w > 5, String(w));
    await page.click('[data-jh-play]');

    console.log('\n13 · the end card closes');
    const endShut = async how => { await page.evaluate(() => jhFinish()); const shown = await page.evaluate(() => !document.getElementById('jh-end').hidden);
      if (how === 'x') await page.click('[data-jh-end-x]');
      else if (how === 'esc') await page.keyboard.press('Escape');
      else { const b = await page.evaluate(() => { const r = document.getElementById('jh-end').getBoundingClientRect(); return { x: r.left + 12, y: r.top + 12 }; }); await page.mouse.click(b.x, b.y); }
      return shown && await page.evaluate(() => document.getElementById('jh-end').hidden); };
    ok('13a the × in its corner closes it', await endShut('x'));
    ok('13b Esc closes it', await endShut('esc'));
    ok('13c a press beside the card closes it', await endShut('out'));

    console.log('\n14 · one agent at a time');
    await ptsTab(); await page.click('[data-jh-agent="paper"]');
    const word14 = await page.evaluate(() => document.querySelector('[data-jh-play]').textContent);
    ok('14a pressing an agent\'s card names it on Play', /Play/.test(word14) && word14.includes(await page.evaluate(() => i18t('ag_paper'))), word14);
    await page.click('[data-jh-play]');
    await page.waitForFunction(() => /❚/.test(document.querySelector('[data-jh-play]').textContent), null, { timeout: 3000 }).catch(() => {});
    const mid14 = await page.evaluate(() => ({ lateQuiet: jhUptoFor('late', 1e15) === 0, paperLive: jhUptoFor('paper', 1e15) === 1e15 }));
    ok('14b while it plays, the other agents are quiet and the chosen one is live', mid14.lateQuiet && mid14.paperLive, JSON.stringify(mid14));
    await page.waitForFunction(() => !document.getElementById('jh-end').hidden, null, { timeout: 15000 }).catch(() => {});
    const end14 = await page.evaluate(() => ({ t: document.getElementById('jh-end-t').textContent, l: document.getElementById('jh-end-l').textContent, total: document.getElementById('jh-total').textContent, back: jhUptoFor('late', 1e15) }));
    ok('14c the end card counts that agent alone (3 briefs × 25 = 75), and every room is back at rest', /^75\b/.test(end14.t) && end14.back === 1e15 && end14.total === '98', JSON.stringify(end14));
    const hw = await page.evaluate(() => [jhHoursWords(1.2), jhHoursWords(0.4), jhHoursWords(3.6), jhHoursWords(1, 1), jhHoursWords(2.04, 1)]);
    ok('14e hours agree with their number: "about 1 hour", never "1 hours"', /about 1 hour of work/.test(end14.l) && hw.join('|') === '1 hour|0.4 hours|4 hours|1 hour|2.0 hours', JSON.stringify({ l: end14.l, hw }));
    await page.click('[data-jh-end-x]');
    await ptsTab(); await page.click('[data-jh-agent="paper"]');
    ok('14d pressing the card again goes back to every agent', await page.evaluate(() => document.querySelector('[data-jh-play]').textContent === i18t('jh_play')));

    console.log('\n9 · no free room: the rooms widen to fill each floor');
    const fc = await page.evaluate(() => { const bad = [];
      for (let n = 1; n <= 30; n++){ const c = jhFloorCounts(n, 3), F = Math.ceil(n / 3);
        if (c.length !== F || c.reduce((s, x) => s + x, 0) !== n || c.some(x => x > 3 || x < Math.max(...c) - 1)) bad.push(n + ':' + c.join(',')); }
      return bad; });
    ok('9a any number of agents fills every floor, evenly, never more than three a floor', fc.length === 0, fc.join(' '));
    const fc4 = await page.evaluate(() => { const bad = []; for (let n = 1; n <= 30; n++){ const c = jhFloorCounts(n, 4); if (c.reduce((s, x) => s + x, 0) !== n || c.some(x => x > 4 || x < Math.max(...c) - 1)) bad.push(n + ':' + c.join(',')); } return bad; });
    ok('9a2 four a floor fills every floor evenly too', fc4.length === 0, fc4.join(' '));
    const edges = await page.evaluate(() => { const g = jhGeom(), out = [];
      for (let f = 0; f < g.floors; f++){ const y = g.top + (g.floors - f) * g.fh - g.fh / 2; out.push(!!jhRoomAt(210, y) && !!jhRoomAt(1140, y)); } return out; });
    ok('9b every floor has a room from wall to wall (no empty room at either end)', edges.length > 0 && edges.every(Boolean), JSON.stringify(edges));

    console.log('\n10 · the period: a transition, and a typed number of days');
    await page.evaluate(() => { document.querySelector('.jh-page').dataset.mark = 'same'; document.getElementById('jh-cv').dataset.mark = 'same'; });
    await page.selectOption('#jh-range', '7');
    await page.waitForFunction(() => /7/.test((document.getElementById('jh-total-l') || {}).textContent || ''), null, { timeout: 5000 }).catch(() => {});
    const kept = await page.evaluate(() => ({ page: (document.querySelector('.jh-page') || {}).dataset?.mark, cv: (document.getElementById('jh-cv') || {}).dataset?.mark,
      pressed: document.getElementById('jh-range').value,
      words: (document.getElementById('jh-total-l') || {}).textContent }));
    ok('10a a period choice keeps the page and the house (nothing is rebuilt, no flash)', kept.page === 'same' && kept.cv === 'same', JSON.stringify(kept));
    ok('10b …and says the new period where the total is', kept.pressed === '7' && /7 days/.test(kept.words || ''), JSON.stringify(kept));
    await page.selectOption('#jh-range', 'custom');
    const boxOpen = await page.evaluate(() => !document.getElementById('jh-days').hidden && document.activeElement && document.activeElement.id === 'jh-days-n');
    ok('10c Custom… opens a box for the number of days, ready to type', boxOpen);
    await page.fill('#jh-days-n', '0'); await page.keyboard.press('Enter');
    const refused = await page.evaluate(() => ({ bad: !document.getElementById('jh-days-bad').hidden, words: document.getElementById('jh-total-l').textContent }));
    ok('10d a number outside 1–120 is refused, with the reason beside the box', refused.bad && /7 days/.test(refused.words), JSON.stringify(refused));
    await page.fill('#jh-days-n', '45'); await page.keyboard.press('Enter');
    await page.waitForFunction(() => /45/.test((document.getElementById('jh-total-l') || {}).textContent || ''), null, { timeout: 5000 }).catch(() => {});
    const typed = await page.evaluate(() => { const sel = document.getElementById('jh-range'); return { btn: sel.selectedOptions[0].textContent, pressed: String(sel.value === '45'),
      shut: document.getElementById('jh-days').hidden, words: document.getElementById('jh-total-l').textContent, page: document.querySelector('.jh-page').dataset.mark }; });
    ok('10e 45 days is taken: the box says it, the box closes, the page is the same page', typed.btn === '45 days' && typed.pressed === 'true' && typed.shut && /45 days/.test(typed.words) && typed.page === 'same', JSON.stringify(typed));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!document.getElementById('jh-range'), null, { timeout: 8000 }).catch(() => {});
    const back = await page.evaluate(() => { const b = document.getElementById('jh-range'); return b ? b.selectedOptions[0].textContent + '|' + String(b.value === '45') : ''; });
    await page.click('[data-jh-tab="jobs"]');
    const tabsF = { jobs: await page.evaluate(() => [...document.querySelectorAll('.jh-fb select, .jh-fb input')].map(x => x.id).filter(Boolean).join()) };
    await page.click('[data-jh-tab="how"]');
    tabsF.how = await page.evaluate(() => document.querySelectorAll('.jh-fb').length);
    await page.click('[data-jh-tab="house"]');
    await page.waitForFunction(() => !!document.getElementById('jh-cv'), null, { timeout: 8000 }).catch(() => {});
    ok('10g Jobs carries only its period, How points work no filters', tabsF.jobs === 'jh-range,jh-days-n' && tabsF.how === 0, JSON.stringify(tabsF));
    ok('10f a refresh keeps the typed period', back === '45 days|true', back);

    console.log('\n11 · a sharp screen and a short window');
    const ctx2 = await b.newContext({ viewport: { width: 1440, height: 760 }, deviceScaleFactor: 2, storageState: await page.context().storageState() });
    const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push(e.message));
    await p2.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p2.waitForFunction(() => typeof setView === 'function' && state.contracts && state.contracts.length === 5, null, { timeout: 15000 }).catch(() => {});
    await p2.evaluate(() => setView('jambo'));
    await p2.waitForFunction(() => !!document.getElementById('jh-cv') && typeof jhGeom === 'function', null, { timeout: 8000 }).catch(() => {});
    const f11 = await p2.evaluate(() => { const cv = document.getElementById('jh-cv'), st = document.getElementById('jh-stage');
      return { dpr: window.devicePixelRatio, bw: cv.width, cw: cv.clientWidth, bottom: Math.round(st.getBoundingClientRect().bottom), win: window.innerHeight, fh: jhGeom().fh, scrolls: st.scrollHeight > st.clientHeight + 1 }; });
    ok('11a on a 2× screen the house is drawn with twice the pixels (crisp, not grainy)', f11.dpr === 2 && f11.bw === Math.round(f11.cw * 2), JSON.stringify(f11));
    ok('11b in a short window the floors shrink so the house still ends on screen, with no scroll inside it', f11.bottom <= f11.win && f11.fh < 132 && !f11.scrolls, JSON.stringify(f11));
    await p2.setViewportSize({ width: 1440, height: 600 });
    await p2.waitForFunction(() => jhGeom().cols === 4, null, { timeout: 4000 }).catch(() => {});
    const f11s = await p2.evaluate(() => { const st = document.getElementById('jh-stage'); return { g: jhGeom(), scrolls: st.scrollHeight > st.clientHeight + 1, bottom: Math.round(st.getBoundingClientRect().bottom), win: innerHeight }; });
    ok('11b2 in a very short window the house takes four rooms a floor rather than scroll', f11s.g.cols === 4 && !f11s.scrolls && f11s.bottom <= f11s.win, JSON.stringify(f11s));
    await p2.setViewportSize({ width: 1440, height: 1000 });
    await p2.waitForFunction(fh => jhGeom().fh > fh, f11.fh, { timeout: 4000 }).catch(() => {});
    ok('11c a taller window lets the floors grow back (refits on resize)', await p2.evaluate(fh => jhGeom().fh > fh, f11.fh));
    await ctx2.close();

    console.log('\n12 · opened before sign-in finishes: no "Not signed in"');
    const ctx3 = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p3 = await ctx3.newPage(); const refused12 = []; p3.on('pageerror', e => errs.push(e.message));
    p3.on('response', r => { if (/\/api\/agents\/pieces/.test(r.url()) && r.status() === 401) refused12.push(r.status()); });
    await p3.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p3.evaluate(() => { try { setView('jambo'); } catch (_) {} });
    await p3.fill('#li-email', 'admin@example.co.ke'); await p3.fill('#li-pass', 'adminpassword1'); await p3.click('#li-go');
    await p3.waitForFunction(() => window.REMOTE && REMOTE.me, null, { timeout: 15000 }).catch(() => {});
    await p3.evaluate(() => setView('jambo'));
    await p3.waitForFunction(() => !!document.getElementById('jh-cv') && !!document.getElementById('jh-notes'), null, { timeout: 8000 }).catch(() => {});
    const n12 = await p3.evaluate(() => (document.getElementById('jh-notes') || {}).textContent || '');
    ok('12a the agents\' record is never asked for before sign-in, and the page carries no "Not signed in"', refused12.length === 0 && !/not signed in/i.test(n12), JSON.stringify({ refused12, n12 }));
    await ctx3.close();

    console.log('\n7 · Settings → Jambo\'s agents: the points');
    await page.evaluate(() => openSettingsAt('platform', 'agents'));
    await page.waitForFunction(() => document.querySelectorAll('#st-ag-points [data-ag-pt-row]').length > 0, null, { timeout: 6000 }).catch(() => {});
    const rows = await page.evaluate(() => [...document.querySelectorAll('#st-ag-points [data-ag-pt-row]')].map(x => x.getAttribute('data-ag-pt-row')));
    ok('7a one points row per agent', rows.length === pg.keys.length && pg.keys.every(k => rows.includes(k)), rows.join(' '));
    await page.fill('#st-ag-points input[data-ag-pt="paper"][data-ag-pt-f="mins"]', '30');
    await page.press('#st-ag-points input[data-ag-pt="paper"][data-ag-pt-f="mins"]', 'Tab');
    await page.waitForFunction(() => state.settings && state.settings.agentPoints && state.settings.agentPoints.paper && state.settings.agentPoints.paper.mins === 30, null, { timeout: 5000 }).catch(() => {});
    const saved = await page.evaluate(() => (state.settings.agentPoints || {}).paper || null);
    ok('7b a box left is saved for everyone', !!saved && saved.mins === 30, JSON.stringify(saved));
    if (typeof page.keyboard.press === 'function') await page.keyboard.press('Escape');
    await page.evaluate(() => { if (typeof closeModal === 'function') try { closeModal(); } catch (_) {} if (typeof closeSidePanel === 'function') try { closeSidePanel(); } catch (_) {} setView('jambo'); });
    await page.waitForFunction(() => (document.getElementById('jh-total') || {}).textContent === '113', null, { timeout: 5000 }).catch(() => {});
    const t7 = await page.evaluate(() => ({ v: state.view, t: (document.getElementById('jh-total') || {}).textContent }));
    ok('7c the house counts with it (3 × 30 − 4 + 27 = 113)', t7.t === '113', JSON.stringify(t7));

    console.log('\n8 · the Board\'s "The agents" is this page');
    const board = await page.evaluate(() => { setView('dashboard'); const btn = document.createElement('button'); btn.setAttribute('data-hb-agents-page', ''); document.body.appendChild(btn);
      btn.click(); btn.remove(); return state.view; });
    ok('8a it lands on Jambo\'s agents', board === 'jambo', board);

    console.log('\n15 · work shows when Jambo prepares it');
    const me15 = await page.evaluate(() => REMOTE.me.id);
    const r15 = await page.evaluate(async me => { const go = pieces => api('agents/prepared', 'POST', { pieces }).then(r => r, e => ({ err: e.message }));
      return { first: await go([{ agent: 'quiet', contractId: 'MK-JA1', ref: 'quiet:MK-JA1' }]), again: await go([{ agent: 'quiet', contractId: 'MK-JA1', ref: 'quiet:MK-JA1' }]),
        wrong: await go([{ agent: 'paper', contractId: 'MK-JA1', ref: 'x' }, { agent: 'request', contractId: '', ref: 'no-such-request' }, { agent: 'week', contractId: '', ref: 'week:2026-10-12:someone-else' }, { agent: 'approve', contractId: '', ref: '' }]),
        week: await go([{ agent: 'week', contractId: '', ref: 'week:2026-10-12:' + me }]) }; }, me15);
    ok('15a a reading agent\'s prepared work is kept once, and anything unchecked is refused', r15.first.added === 1 && r15.again.kept === 1 && r15.wrong.refused === 4 && r15.week.added === 1, JSON.stringify(r15));
    await page.evaluate(() => agReportPrepared({ quiet: { ready: [{ agent: 'quiet', kind: 'quiet', key: 'quiet:MK-JA2', cid: 'MK-JA2' }] }, approve: { ready: [] }, request: { ready: [] }, week: { ready: [] } }));
    await page.evaluate(() => agPreparedSettled());
    await page.evaluate(() => { setView('dashboard'); setView('jambo'); });
    await page.waitForFunction(() => !!document.getElementById('jh-cv') && typeof agPointsTally === 'function', null, { timeout: 8000 }).catch(() => {});
    await page.selectOption('#jh-range', '7').catch(() => {});
    await page.waitForFunction(() => /7/.test((document.getElementById('jh-total-l') || {}).textContent || ''), null, { timeout: 6000 }).catch(() => {});
    const w15 = await page.evaluate(async () => { const d = await api('agents/pieces?days=7'); const q = d.pieces.filter(p => p.agent === 'quiet');
      return { quiet: q.length, open: q.filter(p => !p.outcome).length, week: d.pieces.filter(p => p.agent === 'week').length }; });
    ok('15b the page\'s own report lands too: two quiet pieces waiting, one week laid out', w15.quiet === 2 && w15.open === 2 && w15.week === 1, JSON.stringify(w15));
    await page.click('[data-jh-play]');
    await page.waitForFunction(() => jhPopsSoft() > 0, null, { timeout: 12000 }).catch(() => {});
    ok('15c the replay shows the moment Jambo prepared it ("prepared" rises in the room)', await page.evaluate(() => jhPopsSoft() > 0));
    await page.waitForFunction(() => !document.getElementById('jh-end').hidden, null, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => { const x = document.querySelector('[data-jh-end-x]'); if (x) x.click(); });
    const s15 = await page.evaluate(async () => { const before = (await api('agents/pieces?days=7')).pieces.filter(p => p.agent === 'quiet' && !p.outcome).length;
      await api('agents/outcome', 'POST', { agent: 'quiet', contractId: 'MK-JA1', outcome: 'used', ref: 'quiet:MK-JA1' });
      const after = (await api('agents/pieces?days=7')).pieces.filter(p => p.agent === 'quiet'); return { before, after: after.length, open: after.filter(p => !p.outcome).length, used: after.filter(p => p.outcome === 'used').length }; });
    ok('15d a person\'s press decides THAT piece (no second one): waiting 2 → 1, used 1', s15.before === 2 && s15.after === 2 && s15.open === 1 && s15.used === 1, JSON.stringify(s15));

    console.log('\n16 · the house shows the work as it is (C–F)');
    const c16 = await page.evaluate(() => { const S = []; for (let t = 0; t <= 1.0001; t += 0.01) S.push(t);
      const still = S.every(t => { const m = jhMotionOf('renew', t); return m && m.kind === 'idle'; });
      const moves = S.some(t => { const m = jhMotionOf('quiet', t); return m && m.kind !== 'idle'; });
      return { still, moves }; });
    ok('16a C: an agent with no work stands still all replay; one with work moves at its moments', c16.still && c16.moves, JSON.stringify(c16));
    const d16 = await page.evaluate(() => jhPopRef({ cid: 'MK-JA1' }));
    ok('16b D: a pop names the contract it was on', d16 === ' · MK-JA1', d16);
    const e16 = await page.evaluate(() => ({ why: jhRoomQuietWhy('renew'), state: jhRoomStateWords('quiet'), stateRound: jhRoomStateWords('round') }));
    ok('16c E: a quiet room says why, and every room says how its agent is set', e16.why === 'nothing came up' && !!e16.state && !!e16.stateRound, JSON.stringify(e16));
    const f16 = await page.evaluate(() => ({ res: [...document.querySelectorAll('#jh-res b')].map(b => b.textContent) }));
    await page.click('[data-jh-play]');
    await page.waitForFunction(() => !document.getElementById('jh-end').hidden, null, { timeout: 15000 }).catch(() => {});
    const f16e = await page.evaluate(() => (document.getElementById('jh-end-r') || {}).textContent || '');
    ok('16d F: the panel shows contracts touched, dates caught, chases and nudges; the end card says them', f16.res.length === 3 && /contracts? touched/.test(f16e) && /chases? (and|or) nudges?/.test(f16e), JSON.stringify({ f16, f16e }));
    const w16 = await page.evaluate(() => ({ btn: document.querySelector('[data-jh-play]').textContent, play: i18t('jh_play'), one: jhUnitWords('approve', 1), two: jhUnitWords('approve', 2) }));
    ok('16e a replay that ends by itself puts Play back on the button', w16.btn === w16.play, JSON.stringify(w16));
    ok('16f a count and its unit agree: "1 approval laid out", "2 approvals laid out"', w16.one === '1 approval laid out' && w16.two === '2 approvals laid out', JSON.stringify(w16));

    console.log('\n17 · the agents\' past, rebuilt from the records');
    const r17 = await page.evaluate(async () => {
      await api('intake', 'POST', { title: 'A supply deal', need: 'We need a supply contract with a new vendor.' });
      const dry = await api('agents/rebuild', 'POST', { dry: true });
      const before = (await api('agents/pieces?days=60')).pieces.length;
      const run = await api('agents/rebuild', 'POST', {});
      const after = await api('agents/pieces?days=60');
      const again = await api('agents/rebuild', 'POST', { dry: true });
      return { dry, before, run, after: after.pieces.length, rebuilt: after.pieces.filter(p => p.rebuilt).map(p => p.agent + ':' + (p.outcome || 'waiting')).sort(), again: again.total, already: again.already };
    });
    ok('17a the preview finds the import (used), the approval (used) and the open request (waiting), writing nothing', r17.dry.byAgent.import && r17.dry.byAgent.import.used === 1 && r17.dry.byAgent.approve && r17.dry.byAgent.approve.used === 1
      && r17.dry.byAgent.request && r17.dry.byAgent.request.waiting === 1 && r17.dry.written === 0, JSON.stringify(r17.dry));
    ok('17b Rebuild writes them, each marked as rebuilt, and nothing for agents whose live record has begun', r17.run.written === r17.dry.total && r17.after === r17.before + r17.dry.total
      && r17.rebuilt.join() === 'approve:used,import:used,request:waiting' && !r17.dry.byAgent.paper && !r17.dry.byAgent.round, JSON.stringify(r17));
    ok('17c running it again adds nothing', r17.again === 0 && r17.already === 3, JSON.stringify({ again: r17.again, already: r17.already }));
    const u17 = await page.evaluate(async () => { const r = await api('agents/rebuild', 'POST', { undo: true }); const left = (await api('agents/pieces?days=60')).pieces.filter(p => p.rebuilt).length; return { removed: r.removed, left }; });
    ok('17d Remove takes every rebuilt piece out again, and only those', u17.removed === 3 && u17.left === 0, JSON.stringify(u17));
    const b17 = await page.evaluate(() => { const h = document.createElement('div'); h.innerHTML = agPointsTableHtml('company'); return !!h.querySelector('[data-ag-rebuild]') && !!h.querySelector('[data-ag-rebuild-undo]'); });
    ok('17e Settings → Jambo\'s agents carries Rebuild and Remove', b17);

    console.log('\n18 · Jambo\'s office: offices, shared rooms, your desk on top, paper that piles up');
    await page.evaluate(() => { const b = document.querySelector('[data-jh-agent].is-on, [data-jh-agent][aria-pressed="true"]'); if (b) b.click(); });
    const o18 = await page.evaluate(() => { const o = jhOfficeOf(), shared = o.shared.map(s => s.id + '@' + s.f).sort().join(',');
      const agentsOk = o.rooms.filter(r => !r.reading).every(r => r.f >= 2 && r.f <= o.floors - 2) && o.rooms.filter(r => r.reading).every(r => r.f === 0);
      return { shared, top: o.desk.f === o.floors - 1, wall: o.desk.x0 <= 206.5 && o.desk.x1 >= 1143.5, agentsOk, reads: o.rooms.filter(r => r.reading).map(r => r.k).sort().join(',') }; });
    ok('18a your desk is the big office across the top floor; the shared rooms below; every agent has an office; the readings sit in reception', o18.top && o18.wall && o18.agentsOk
      && o18.shared === 'jambo@1,mail@1,money@1,people@0,reception@0,vault@0' && o18.reads === 'approve,quiet,request,week', JSON.stringify(o18));
    const t18 = await page.evaluate(() => { const seen = []; for (let t = 0; t <= 1.00001; t += 0.0004){ const m = jhMotionOf('paper', t); if (m && m.stop && seen[seen.length - 1] !== m.stop) seen.push(m.stop); } return seen.join(','); });
    ok('18b a piece is a trip through the rooms its agent really uses, ending in its tray on your desk', /^vault,money,jambo,desk/.test(t18), t18);
    const l18 = await page.evaluate(async () => { document.querySelector('[data-jh-ptab="log"]').click(); document.querySelector('[data-jh-restart]').click();
      await new Promise(res => { const t0 = Date.now(); (function w(){ if (!_jhPlaying() || Date.now() - t0 > 20000) return res(); setTimeout(w, 200); })(); });
      const lines = [...document.querySelectorAll('#jh-log .jh-log-l')].map(x => x.textContent); document.querySelector('[data-jh-ptab="points"]').click(); return lines; });
    ok('18d the Work log writes every step as it happens: the room, what was done there, the contract', l18.length > 0 && l18.some(x => /contract vault/.test(x)) && l18.some(x => /tray on your desk/.test(x)), JSON.stringify(l18.slice(0, 4)));
    const w18 = await page.evaluate(() => { const r = jhOfficeOf().rooms.find(x => x.k === 'paper'); let maxStep = 0, prev = null, crooked = 0;
      for (let t = 0; t <= 1.00001; t += 0.0005){ const m = jhMotionOf('paper', t); if (m && m.kind !== 'idle' && prev && prev.kind !== 'idle'){ const dx = Math.abs(m.x - prev.x), dy = Math.abs(m.y - prev.y); maxStep = Math.max(maxStep, Math.hypot(dx, dy)); if (dx > 1 && dy > 1 && m.j === prev.j) crooked++; } prev = m; }
      return { maxStep: Math.round(maxStep), crooked }; });
    ok('18e a calm walk on right angles: never a jump across the house, never a diagonal', w18.maxStep < 60 && w18.crooked === 0, JSON.stringify(w18));
    const s18 = await page.evaluate(() => ({ vault: jhSheetsIn('vault', 1), money: jhSheetsIn('money', 1), mail: jhSheetsIn('mail', 0) }));
    ok('18c the paper piles up in the rooms it came through (none before the replay starts)', s18.vault > 0 && s18.money > 0 && s18.mail === 0, JSON.stringify(s18));
    console.log('\n19 · the owner\'s shortest screen (1536 × 730): nothing overlaps, in both looks');
    const ctx19 = await b.newContext({ viewport: { width: 1536, height: 730 }, storageState: await page.context().storageState() });
    const p19 = await ctx19.newPage();
    p19.on('pageerror', e => errs.push(e.message));
    await p19.goto(h.base + '/#jambo', { waitUntil: 'networkidle' });
    await p19.waitForFunction(() => typeof setView === 'function' && window.REMOTE && REMOTE.me, null, { timeout: 15000 }).catch(() => {});
    await p19.evaluate(() => setView('jambo'));
    await p19.waitForFunction(() => !!document.getElementById('jh-cv') && typeof jhOverlapAudit === 'function' && jhGeom().h > 0, null, { timeout: 8000 }).catch(() => {});
    const a19 = await p19.evaluate(async () => { const out = {}; for (const v of ['0', '1']){ const s = document.getElementById('jh-look'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 400)); out[v] = { ...jhOverlapAudit(), fh: jhGeom().fh }; } return out; });
    ok('19a Floor plan: every word and pile stays in its room, none touch', a19['0'] && a19['0'].ok && a19['0'].words > 30, JSON.stringify(a19['0']).slice(0, 400));
    ok('19b Architect\'s drawing: the same', a19['1'] && a19['1'].ok && a19['1'].words > 30, JSON.stringify(a19['1']).slice(0, 400));
    await ctx19.close();
    ok('no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  } catch (e) { ok('the run finished', false, e.message); }
  finally { await b.close(); await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
