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
     5 the architect's drawing is the same house, drawn taller (roof, title block)
     6 the speed is a pressed choice, and Play moves the replay
     7 Settings → Jambo's agents carries one points row per agent; a box left
       is saved for everyone, and the house counts with it
     8 the Board's "The agents" opens this page (one place for the agents)
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
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };

const CONTRACTS = [
  H.fixtureContract('MK-JA1', 'Raw milk supply', 'Nandi Dairy', H.FOLDER_A, 12e6, 'Signed'),
  H.fixtureContract('MK-JA2', 'Cold chain logistics', 'Siginon Group', H.FOLDER_A, 8e6, 'Under Review'),
  H.fixtureContract('MK-JA3', 'Office lease', 'Britam Properties', H.FOLDER_B, 4e6, 'Signed'),
  H.fixtureContract('MK-JA4', 'Packaging services', 'Nampak Kenya', H.FOLDER_B, 3e6, 'Draft'),
  H.fixtureContract('MK-JA5', 'Mutual NDA', 'Juno Ltd', H.FOLDER_A, 0, 'Signed'),
];

(async () => {
  const h = await H.startHati();
  await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const b = await chromium.launch({ executablePath: EXEC });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
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
    ok('2a one card per agent in AG_KEYS', pg.cards.length === pg.keys.length && pg.keys.every(k => pg.cards.includes(k)), pg.cards.join(' '));
    const floors = Math.ceil(pg.keys.length / 3);
    ok('2b the house is as tall as its floors need', pg.h === 70 + floors * 132 + 16, `${pg.h} for ${floors} floors`);
    ok('2c three tabs: the house, jobs, how points work', pg.tabs.join(' ') === 'house jobs how', pg.tabs.join(' '));
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
    await page.click('[data-jh-look="1"]');
    const dh = await page.evaluate(() => document.getElementById('jh-cv').height);
    ok('5a the same house, drawn taller for its roof and title block', dh === 128 + floors * 132 + 104, String(dh));
    await page.click('[data-jh-look="0"]');

    console.log('\n6 · speed and play');
    await page.click('[data-jh-speed="4"]');
    const sp = await page.evaluate(() => [...document.querySelectorAll('[data-jh-speed]')].filter(x => x.getAttribute('aria-pressed') === 'true').map(x => x.getAttribute('data-jh-speed')));
    ok('6a Fastest is the pressed speed', sp.join() === '4', sp.join());
    await page.click('[data-jh-play]');
    await page.waitForFunction(() => { const w = parseFloat((document.getElementById('jh-prog') || {}).style.width || '0'); return w > 5 && w < 100; }, null, { timeout: 5000 }).catch(() => {});
    const w = await page.evaluate(() => parseFloat(document.getElementById('jh-prog').style.width || '0'));
    ok('6b Play moves the replay', w > 5, String(w));
    await page.click('[data-jh-play]');

    console.log('\n9 · no free room: the rooms widen to fill each floor');
    const fc = await page.evaluate(() => { const bad = [];
      for (let n = 1; n <= 30; n++){ const c = jhFloorCounts(n), F = Math.ceil(n / 3);
        if (c.length !== F || c.reduce((s, x) => s + x, 0) !== n || c.some(x => x > 3 || x < Math.max(...c) - 1)) bad.push(n + ':' + c.join(',')); }
      return bad; });
    ok('9a any number of agents fills every floor, evenly, never more than three a floor', fc.length === 0, fc.join(' '));
    const edges = await page.evaluate(() => { const n = AG_KEYS.length, F = Math.ceil(n / 3), out = [];
      for (let f = 0; f < F; f++){ const y = 70 + (F - f) * 132 - 66; out.push(!!jhRoomAt(210, y) && !!jhRoomAt(1140, y)); } return out; });
    ok('9b every floor has a room from wall to wall (no empty room at either end)', edges.length > 0 && edges.every(Boolean), JSON.stringify(edges));

    console.log('\n10 · the period: a transition, and a typed number of days');
    await page.evaluate(() => { document.querySelector('.jh-page').dataset.mark = 'same'; document.getElementById('jh-cv').dataset.mark = 'same'; });
    await page.click('[data-jh-range="7"]');
    await page.waitForFunction(() => /7/.test((document.getElementById('jh-total-l') || {}).textContent || ''), null, { timeout: 5000 }).catch(() => {});
    const kept = await page.evaluate(() => ({ page: (document.querySelector('.jh-page') || {}).dataset?.mark, cv: (document.getElementById('jh-cv') || {}).dataset?.mark,
      pressed: [...document.querySelectorAll('[data-jh-range]')].filter(x => x.getAttribute('aria-pressed') === 'true').map(x => x.getAttribute('data-jh-range')).join(),
      words: (document.getElementById('jh-total-l') || {}).textContent }));
    ok('10a a period press keeps the page and the house (nothing is rebuilt, no flash)', kept.page === 'same' && kept.cv === 'same', JSON.stringify(kept));
    ok('10b …and says the new period where the total is', kept.pressed === '7' && /7 days/.test(kept.words || ''), JSON.stringify(kept));
    await page.click('[data-jh-range="custom"]');
    const boxOpen = await page.evaluate(() => !document.getElementById('jh-days').hidden && document.activeElement && document.activeElement.id === 'jh-days-n');
    ok('10c Custom… opens a box for the number of days, ready to type', boxOpen);
    await page.fill('#jh-days-n', '0'); await page.keyboard.press('Enter');
    const refused = await page.evaluate(() => ({ bad: !document.getElementById('jh-days-bad').hidden, words: document.getElementById('jh-total-l').textContent }));
    ok('10d a number outside 1–120 is refused, with the reason beside the box', refused.bad && /7 days/.test(refused.words), JSON.stringify(refused));
    await page.fill('#jh-days-n', '45'); await page.keyboard.press('Enter');
    await page.waitForFunction(() => /45/.test((document.getElementById('jh-total-l') || {}).textContent || ''), null, { timeout: 5000 }).catch(() => {});
    const typed = await page.evaluate(() => ({ btn: document.querySelector('[data-jh-range="custom"]').textContent, pressed: document.querySelector('[data-jh-range="custom"]').getAttribute('aria-pressed'),
      shut: document.getElementById('jh-days').hidden, words: document.getElementById('jh-total-l').textContent, page: document.querySelector('.jh-page').dataset.mark }));
    ok('10e 45 days is taken: the button says it, the box closes, the page is the same page', typed.btn === '45 days' && typed.pressed === 'true' && typed.shut && /45 days/.test(typed.words) && typed.page === 'same', JSON.stringify(typed));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!document.querySelector('[data-jh-range="custom"]'), null, { timeout: 8000 }).catch(() => {});
    const back = await page.evaluate(() => { const b = document.querySelector('[data-jh-range="custom"]'); return b ? b.textContent + '|' + b.getAttribute('aria-pressed') : ''; });
    ok('10f a refresh keeps the typed period', back === '45 days|true', back);

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

    ok('no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  } catch (e) { ok('the run finished', false, e.message); }
  finally { await b.close(); await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
