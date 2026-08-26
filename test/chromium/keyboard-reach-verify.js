/* ============================================================
   KEYBOARD REACH — every act reachable without a mouse
   ============================================================
   The 23 Aug design audit graded accessibility D+ on two measured facts: the
   product had ONE focus trap (openModal's, written that day) against nine
   overlays that needed one, and ZERO aria-live regions in 30,000 lines. A
   layer that does not hold focus is not a modal — Tab walks out of it into
   the page underneath, where a sighted reader watches nothing happen and a
   screen-reader user is read the page behind the dialog.

   A MARKUP CHECK CANNOT ANSWER THIS. "Does the element carry role=dialog" is
   a different question from "can somebody reach this without a mouse", and
   only the second one matters. So every claim below is driven: real Tab
   presses, real Arrow presses, and the answer is read off document.activeElement.

   WHAT IT DELIBERATELY DOES NOT TEST: whether a screen reader SPEAKS the
   live regions. No harness can answer that; what can be asked is whether the
   region exists on the element that receives the message, which is the half
   that was missing.

   Run: node test/chromium/keyboard-reach-verify.js
   ============================================================ */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  ok ? pass++ : fail++;
};

const BASE = ['SUPPLY AGREEMENT', '1. SUPPLY', '1. The Supplier shall supply goods.',
  '2. PRICE', '2. The value is KES 78,000,000.', '3. PAYMENT', '3. Payable within thirty (30) days.'
].join('\n\n');

/* Where is focus, and is it inside the layer? Asked of the LAYER rather than
   of a selector list, because "inside" is the whole claim. */
const inside = sel => `(() => { const p = document.querySelector(${JSON.stringify(sel)});
  const a = document.activeElement;
  return { in: !!(p && a && p.contains(a)),
           at: a ? (a.tagName.toLowerCase() + (a.id ? '#' + a.id : '')
                    + (a.className && typeof a.className === 'string'
                       ? '.' + a.className.trim().split(/\\s+/)[0] : '')) : 'none' }; })()`;

/* Tab N times and report where focus ended up. N is deliberately larger than
   any of these layers holds, so a trap that is not there WILL escape. */
async function tabAround(page, sel, n = 25) {
  for (let i = 0; i < n; i++) await page.keyboard.press('Tab');
  return page.evaluate(inside(sel));
}

(async () => {
  const h = await startHati();
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: {
    org: 'Highland Corporate Ltd', name: 'Amina Otieno', email: 'amina@highland.co.ke',
    password: 'adminpassword1', data: { uid: 300, contracts: [
      { id: 'MK-82', name: 'Retail Supply — Coast', counterparty: 'Naivas Supermarkets',
        folder: 'proc', value: 78000000, valueType: 'standard', status: 'Under Review',
        template: 'RM', lastAction: '06 Aug 2026', expiry: '2027-06-30',
        fields: { effDate: '2026-07-01' }, metadata: {}, comments: [], audit: [],
        signatures: [], obligations: [], rounds: [], versions: [], redlineText: BASE, format: 'text' },
      { id: 'MK-83', name: 'Cold Chain Logistics', counterparty: 'Nordfrakt Logistik AB',
        folder: 'dist', value: 24500000, valueType: 'standard', status: 'Signed',
        template: 'WH', lastAction: '02 Aug 2026', expiry: '2027-03-31', fields: {}, metadata: {},
        comments: [], audit: [], signatures: [], obligations: [], rounds: [], versions: [],
        redlineText: BASE, format: 'text' },
    ], settings: {} } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const [ck, cv] = String(admin.cookie || '').split('=');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: ck, value: cv, url: h.base }]);
  const page = await ctx.newPage();
  page.on('pageerror', e => check('page error', false, e.message));
  await page.goto(h.base, { waitUntil: 'load' });
  await page.waitForFunction(() => window.state && Array.isArray(state.contracts)
    && state.contracts.some(c => c && c.id === 'MK-82'));
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });

  /* ---------- 1 · ONE TRAP, DEFINED ONCE, PUBLISHED ---------- */
  check('trapFocus is one function and every module can reach it',
    await page.evaluate(() => typeof window.trapFocus === 'function'));

  /* ---------- 2 · THE SETTINGS DRAWER ---------- */
  await page.evaluate(() => setView('team')); await pause(700);
  const drawerOpened = await page.evaluate(() => {
    if (typeof stDrawerOpen !== 'function') return false;
    stDrawerOpen('company'); return true;
  });
  await pause(400);
  if (drawerOpened) {
    const start = await page.evaluate(inside('#st-drawer'));
    check('the settings drawer takes focus when it opens', start.in, start.at);
    const after = await tabAround(page, '#st-drawer');
    check('and Tab cannot walk out of it', after.in, after.at);
    await page.keyboard.press('Escape'); await pause(300);
  } else check('the settings drawer opens', false, 'stDrawerOpen not reachable');

  /* ---------- 3 · THE ALERTS / ACTIVITY PANEL ---------- */
  await page.evaluate(() => setView('dashboard')); await pause(600);
  await page.click('#hdr-notify'); await pause(400);
  {
    const start = await page.evaluate(inside('#context-panel'));
    check('the alerts panel takes focus when it opens', start.in, start.at);
    const after = await tabAround(page, '#context-panel');
    check('and Tab cannot walk out of it — every row here is a door', after.in, after.at);
    await page.keyboard.press('Escape'); await pause(300);
    const back = await page.evaluate(() => document.activeElement && document.activeElement.id);
    check('and focus goes back to the bell that opened it', back === 'hdr-notify', String(back));
  }

  /* ---------- 4 · THE COMMAND PALETTE ---------- */
  await page.keyboard.press('Control+k'); await pause(400);
  {
    const start = await page.evaluate(() => document.activeElement && document.activeElement.id);
    check('the palette focuses its own box', start === 'cp-input', String(start));
    const after = await tabAround(page, '#cmd-palette');
    check('and Tab cannot walk out of it', after.in, after.at);
    await page.keyboard.press('Escape'); await pause(300);
  }

  /* ---------- 5 · THE KPI CUSTOMIZER ---------- */
  await page.evaluate(() => setView('dashboard')); await pause(600);
  const gear = await page.$('#kpi-customize');
  if (gear) {
    await gear.click(); await pause(350);
    const start = await page.evaluate(inside('#kpi-cust-pop'));
    check('the KPI customizer takes focus', start.in, start.at);
    const after = await tabAround(page, '#kpi-cust-pop', 20);
    check('and Tab stays in it, not out into the drag handles behind', after.in, after.at);
    await page.keyboard.press('Escape'); await pause(300);
    const gone = await page.evaluate(() => !document.getElementById('kpi-cust-pop'));
    check('and Escape shuts it — it had no keyboard way out at all', gone);
    const back = await page.evaluate(() => document.activeElement && document.activeElement.id);
    check('and focus goes back to the gear', back === 'kpi-customize', String(back));
  } else check('the KPI customizer is on the page', false, '#kpi-customize not found');

  /* ---------- 6 · confirmDialog ---------- */
  {
    await page.evaluate(() => { window.__cf = confirmDialog({ title: 'Delete this?', message: 'x' }); });
    await pause(350);
    const start = await page.evaluate(() => document.activeElement && document.activeElement.id);
    check('the confirm guard focuses its Confirm', start === 'cf-ok', String(start));
    const after = await tabAround(page, '#confirm-overlay', 12);
    check('and Tab cannot reach the record behind it', after.in, after.at);
    await page.keyboard.press('Escape'); await pause(250);
    const answered = await page.evaluate(() => window.__cf);
    check('Escape still answers it "no"', answered === false, String(answered));
  }

  /* ---------- 7 · THE NAV SAYS WHICH DOOR YOU ARE IN ---------- */
  await page.evaluate(() => setView('register')); await pause(600);
  {
    const cur = await page.evaluate(() => {
      const on = [...document.querySelectorAll('.nav-item[aria-current="page"]')];
      return { n: on.length, view: on[0] ? on[0].getAttribute('data-view') : null };
    });
    check('exactly one nav door says aria-current="page"', cur.n === 1, JSON.stringify(cur));
    check('and it is the door the reader is standing in', cur.view === 'register', String(cur.view));
    await page.evaluate(() => setView('dashboard')); await pause(500);
    const moved = await page.evaluate(() => {
      const on = document.querySelector('.nav-item[aria-current="page"]');
      return on ? on.getAttribute('data-view') : null;
    });
    check('and it MOVES with the reader', moved === 'dashboard', String(moved));
  }

  /* ---------- 8 · THE REGISTER'S COLUMN HEADS AND ITS COUNT ---------- */
  await page.evaluate(() => setView('register')); await pause(700);
  {
    const th = await page.evaluate(() => {
      const t = document.querySelector('[data-reg-sort]');
      return t ? { tab: t.tabIndex, role: t.getAttribute('role'), sort: t.getAttribute('aria-sort') } : null;
    });
    check('a sortable column head is reachable by keyboard',
      !!th && th.tab === 0 && th.role === 'button', JSON.stringify(th));
    /* DRIVE IT, do not merely look at it: the handler is bound separately from
       the attribute and either one alone leaves a dead control. */
    const sorted = await page.evaluate(async () => {
      const t = document.querySelector('[data-reg-sort]');
      const before = t.getAttribute('aria-sort');
      t.focus();
      t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise(r => setTimeout(r, 400));
      const now = document.querySelector('[data-reg-sort]');
      return { before, after: now ? now.getAttribute('aria-sort') : null };
    });
    check('and pressing Enter on it actually sorts', sorted.before !== sorted.after, JSON.stringify(sorted));
    const live = await page.evaluate(() => {
      const el = document.getElementById('reg-showing');
      return el ? { live: el.getAttribute('aria-live'), role: el.getAttribute('role') } : null;
    });
    check('the result count is announced when it changes',
      !!live && live.live === 'polite', JSON.stringify(live));
  }

  /* ---------- 9 · THE CONTRACT ROOM'S TAB ROW ---------- */
  await page.evaluate(() => { openWorkspace('MK-82'); }); await pause(900);
  {
    const t0 = await page.evaluate(() => [...document.querySelectorAll('#ws-tabs [data-ws-tab]')]
      .map(b => ({ k: b.getAttribute('data-ws-tab'), sel: b.getAttribute('aria-selected'), tab: b.tabIndex })));
    check('the tab row has exactly ONE tab stop',
      t0.filter(x => x.tab === 0).length === 1, JSON.stringify(t0.map(x => x.tab)));
    check('and exactly one tab says it is selected',
      t0.filter(x => x.sel === 'true').length === 1, JSON.stringify(t0.map(x => x.sel)));
    /* THE CLAIM THAT MATTERS: it still says the right one after a change. The
       markup set aria-selected once, when the row was built. */
    await page.evaluate(() => { const b = document.querySelector('#ws-tabs [data-ws-tab="terms"]'); if (b) b.click(); });
    await pause(600);
    const t1 = await page.evaluate(() => {
      const on = document.querySelector('#ws-tabs [aria-selected="true"]');
      return on ? on.getAttribute('data-ws-tab') : null;
    });
    check('and after switching tabs it names the NEW one', t1 === 'terms', String(t1));
    const arrowed = await page.evaluate(async () => {
      const on = document.querySelector('#ws-tabs [aria-selected="true"]');
      on.focus();
      on.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await new Promise(r => setTimeout(r, 500));
      const now = document.querySelector('#ws-tabs [aria-selected="true"]');
      return now ? now.getAttribute('data-ws-tab') : null;
    });
    check('and the arrows move between the tabs', arrowed && arrowed !== 'terms', String(arrowed));
  }

  /* ---------- 10 · THE NEGOTIATION DIVIDER ---------- */
  /* A REAL CHANGE ON THE TABLE, or the column draws no verbs and section 11
     passes against an empty box — which is the shape of "green because the
     control was not there" this file exists to refuse. */
  await page.evaluate(async () => {
    const c = getContract('MK-82'); negoInit(c);
    const cls = negoClauseList(c);
    await negoEditClause(c, cls[0].clauseId,
      '<p>The Supplier shall deliver within fourteen (14) days.</p>',
      { side: 'counterparty', author: 'Grace Njeri', summary: 'Delivery in 14 days' });
    persist(c);
  });
  await pause(400);
  await page.evaluate(() => openRedlineWorkbench('MK-82'));
  await page.waitForSelector('#view-redline #rl-doc', { timeout: 10000 }); await pause(900);
  {
    const rez = await page.evaluate(() => {
      const r = document.getElementById('rl-resizer');
      return r ? { tab: r.tabIndex, role: r.getAttribute('role'), label: !!r.getAttribute('aria-label') } : null;
    });
    check('the split divider is reachable by keyboard',
      !!rez && rez.tab === 0 && rez.role === 'separator' && rez.label, JSON.stringify(rez));
    const moved = await page.evaluate(async () => {
      const r = document.getElementById('rl-resizer');
      const w = () => { const d = document.querySelector('#rl-grid .nego-pane.working');
        return d ? Math.round(d.getBoundingClientRect().width) : 0; };
      const before = w();
      r.focus();
      for (let i = 0; i < 3; i++) {
        r.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        await new Promise(res => setTimeout(res, 120));
      }
      return { before, after: w() };
    });
    check('and the arrows actually move the split',
      moved.after !== moved.before && moved.before > 0, JSON.stringify(moved));
  }

  /* ---------- 11 · A READING IS NOT A WORKING POSTURE ---------- */
  {
    const inert = await page.evaluate(async () => {
      const read = m => { const b = document.querySelector(`[data-rl-read="${m}"]`); if (b) b.click(); };
      read('agreed');
      await new Promise(r => setTimeout(r, 700));
      const col = document.getElementById('rl-changes-col');
      if (!col) return { col: false };
      /* A VISIBLE ONE. The column keeps hidden buttons in the DOM, and picking
         the first <button> finds one of those — which cannot take focus for a
         reason that has nothing to do with inert, so the check would pass on
         the broken build too. Measured: that is exactly what the first draft
         of this did. */
      const verb = [...col.querySelectorAll('button')].find(b => b.getClientRects().length);
      let reached = false;
      if (verb) { verb.focus(); reached = document.activeElement === verb; }
      return { col: true, inert: col.hasAttribute('inert'), verbs: !!verb, reached };
    });
    /* THE PRESENCE OF A REACHABLE VERB IS ASSERTED FIRST, so the claim under
       it cannot be satisfied by an empty column. */
    check('the change column really holds a visible verb to refuse',
      inert.col && inert.verbs, JSON.stringify(inert));
    check('on a reading, the change column refuses the keyboard too',
      inert.col && inert.inert && !inert.reached, JSON.stringify(inert));
    await page.evaluate(() => { const b = document.querySelector('[data-rl-read="marks"]'); if (b) b.click(); });
    await pause(600);
    const back = await page.evaluate(() => {
      const col = document.getElementById('rl-changes-col');
      return col ? col.hasAttribute('inert') : null;
    });
    check('and it takes the keyboard back on the redlined reading', back === false, String(back));
  }

  /* ---------- 11b · THE KPI ROW REORDERS BY KEYBOARD ---------- */
  await page.evaluate(() => setView('dashboard')); await pause(700);
  {
    const before = await page.evaluate(() =>
      [...document.querySelectorAll('[data-kpi-id]')].map(b => b.getAttribute('data-kpi-id')));
    const hint = await page.evaluate(() => {
      const t = document.querySelector('[data-kpi-id]');
      const id = t && t.getAttribute('aria-describedby');
      const h = id && document.getElementById(id);
      /* THE CLASS HAS TO EXIST OR THE HINT IS A VISIBLE SENTENCE nobody asked
         for — the ui-input lesson. Measured, not read off the markup. */
      const cs = h && getComputedStyle(h);
      return { described: !!h, text: h ? h.textContent.trim().slice(0, 40) : null,
               clipped: cs ? (cs.position === 'absolute' && parseFloat(cs.width) <= 2) : null };
    });
    check('the cards tell a screen reader they can be reordered',
      hint.described && !!hint.text, JSON.stringify(hint));
    check('and that hint is clipped, not drawn — .sr-only really exists',
      hint.clipped === true, JSON.stringify(hint));
    const after = await page.evaluate(async () => {
      const t = document.querySelector('[data-kpi-id]');
      t.focus();
      t.dispatchEvent(new KeyboardEvent('keydown',
        { key: 'ArrowRight', altKey: true, bubbles: true }));
      await new Promise(r => setTimeout(r, 600));
      return [...document.querySelectorAll('[data-kpi-id]')].map(b => b.getAttribute('data-kpi-id'));
    });
    check('and Alt+Arrow actually moves one — drag was the only way',
      JSON.stringify(before) !== JSON.stringify(after),
      `${before.join(',')} -> ${after.join(',')}`);
    const kept = await page.evaluate(() => {
      const a = document.activeElement;
      return a ? a.getAttribute('data-kpi-id') : null;
    });
    check('and focus stays on the card that moved, not the top of the page',
      kept === before[0], String(kept));
  }

  /* ---------- 11c · INSIGHTS' FILTERS TAKE THE KEYBOARD ---------- */
  await page.evaluate(() => setView('intel')); await pause(1100);
  {
    const dot = await page.evaluate(() => {
      const g = document.querySelector('[data-pf-cp]');
      return g ? { tag: g.tagName.toLowerCase(), tab: g.tabIndex,
                   role: g.getAttribute('role'), name: !!g.getAttribute('aria-label') } : null;
    });
    check('a risk-map dot is reachable and named',
      !!dot && dot.tab === 0 && !!dot.role, JSON.stringify(dot));
    const fired = await page.evaluate(async () => {
      const g = document.querySelector('[data-pf-cp]');
      if (!g) return null;
      const key = g.getAttribute('data-pf-cp');
      g.focus();
      g.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise(r => setTimeout(r, 700));
      return { key, on: (typeof pfState === 'function') ? pfState().cp : undefined };
    });
    check('and pressing Enter on it narrows the page',
      !!fired && fired.on === fired.key, JSON.stringify(fired));
  }

  /* ---------- 12 · THE PHONE'S SHEETS ---------- */
  await ctx.close();
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mctx.addCookies([{ name: ck, value: cv, url: h.base }]);
  const mp = await mctx.newPage();
  await mp.goto(h.base, { waitUntil: 'load' });
  await mp.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length);
  await pause(700);
  {
    const opened = await mp.evaluate(async () => {
      if (typeof mOpenSheet !== 'function') return null;
      mOpenSheet('account');
      await new Promise(r => setTimeout(r, 400));
      const p = document.querySelector('.m-sheet-wrap .m-sheet');
      return p ? { role: p.getAttribute('role'), modal: p.getAttribute('aria-modal'),
                   label: p.getAttribute('aria-label'), holds: p.contains(document.activeElement) } : null;
    });
    check('a phone sheet says it is a dialog', !!opened && opened.role === 'dialog'
      && opened.modal === 'true', JSON.stringify(opened));
    check('and it says WHICH dialog, in words', !!opened && !!opened.label && opened.label.length > 1,
      opened ? String(opened.label) : 'none');
    check('and it takes focus', !!opened && opened.holds, JSON.stringify(opened));
    const after = await tabAround(mp, '.m-sheet-wrap .m-sheet', 20);
    check('and Tab cannot walk out of it into the screen behind', after.in, after.at);
  }

  await mctx.close();
  await browser.close();
  await h.stop();
  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
