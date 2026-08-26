/* ============================================================
   PHASE T — THREE TREATMENTS, AS CLOSE-UPS. THE OWNER RULES.
   ============================================================
   "The whole product is set at label size. 826 declarations at 12px and 667 at
   13px against 328 at 14px. It reads cramped rather than dense."

   THIS IS NOT A CHANGE AND MUST NOT BECOME ONE. Phase C's type sweep was
   explicitly zero visual change — it renamed 12px to the token that MEANS
   12px. Making the product read less cramped means RAISING sizes, which moves
   every screen in the platform, and that is the owner's decision.

   FIRST VERSION SHOWED WHOLE SCREENS AND THAT WAS USELESS, which is worth
   recording rather than quietly fixing. A 1440x900 screenshot displayed three
   across on a page is about 390px wide — 27% of actual size — and a ONE PIXEL
   difference in type at 27% scale is physically invisible. The owner's first
   words on seeing it were "I do not see a difference", and they were right.

   SO IT SHOOTS CLOSE-UPS, at 2x pixel density, of the regions where the type
   actually lives: a table row, a filter label, a Key terms row, a change card,
   a card title. Each crop is small enough to show at FULL SIZE or larger, so
   one pixel looks like one pixel.

   THE TREATMENTS ARE TOKEN OVERRIDES AND NOTHING ELSE. Anything that needed a
   second edit would mean the ladder still had a gap.

   Run: node test/chromium/type-treatments-shots.js
   Shots: test/chromium/shots/type-treatments/
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
const OUT = path.join(__dirname, 'shots', 'type-treatments');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const BASE = ['RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY & SPECIFICATION', '1. The Supplier shall supply an estimated 5000 metric tonnes per annum meeting the agreed specification and the applicable KEBS/EAS standard.',
  '2. PRICE & CONTRACT VALUE', '2. The estimated annual contract value is KES 78,000,000, reviewed quarterly against published commodity indices.',
  '3. QUALITY & REJECTION', '3. Consignments failing specification may be rejected within 3 days of delivery.',
  '4. PAYMENT TERMS', '4. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n\n');

/* AND THE THIRD TREATMENT HAD TO BE RE-CUT, which is worth stating.
   The work order describes C as "the ladder applied as the spec intends —
   body at 14, metadata at 13, labels at 12, micro at 11". MEASURED: HaTi's
   ladder ALREADY says exactly that, so written literally C is A with a
   different name and the owner would be ruling on two pictures, not three.
   The complaint underneath is that 826 declarations sit at 12px and 667 at
   13px against 328 at 14 — things that are body copy are set at label size —
   and Phase C's rename preserved that faithfully. So C is the honest bolder
   option: one rung up across the WHOLE interface ladder. */
const TREATMENTS = [
  ['A', ''],
  ['B', ':root{--t-meta:14px;--t-label:13px;}'],
  ['C', ':root{--t-body:15px;--t-meta:14px;--t-label:13px;--t-micro:12px;--t-card:16px;--t-section:18px;}'],
];

/* WHERE THE TYPE ACTUALLY LIVES. Each is one region, cropped tight, so it can
   be shown at full size. `pad` grows the crop a little so a row is not clipped
   at its own edge. */
const CROPS = [
  { key: 'list-rows',  label: 'Contracts — four rows',
    go: async p => { await p.evaluate(() => setView('register')); await pause(800); },
    /* THE ROWS, NOT THE TBODY. `rows` indexes the matched list, and a selector
       matching ONE element cannot be clipped to four of anything — it took the
       whole 700px table. */
    sel: '#reg-tbody tr[data-row]', rows: 4 },
  { key: 'filters',    label: 'Contracts — the filter bar',
    go: async p => { await p.evaluate(() => setView('register')); await pause(800); },
    sel: '.reg-band' },
  { key: 'kpi-card',   label: 'Home — a metric card',
    go: async p => { await p.evaluate(() => setView('dashboard')); await pause(900); },
    sel: '[data-kpi-id]' },
  { key: 'decisions',  label: 'Home — the decisions list',
    go: async p => { await p.evaluate(() => setView('dashboard')); await pause(900); },
    sel: '.hm-row', rows: 3 },
  { key: 'kt-rows',    label: 'Key terms — the fact rows',
    go: async p => { await p.evaluate(() => { openWorkspace('MK-82'); roomGoTab(getContract('MK-82'), 'terms'); }); await pause(1000); },
    sel: '[data-kt-row]', rows: 5 },
  { key: 'change-card', label: 'Negotiation — a tracked change',
    go: async p => { await p.evaluate(() => openRedlineWorkbench('MK-82'));
                     await p.waitForSelector('#view-redline #rl-doc', { timeout: 10000 }); await pause(1000); },
    sel: '#rl-changes-col [data-rl-card], #rl-changes-col article' },
  { key: 'room-head',  label: 'Contract room — the header facts',
    go: async p => { await p.evaluate(() => { openWorkspace('MK-82'); }); await pause(900); },
    sel: '.room-facts, #ws-head' },
];

/* What each treatment costs, in the unit the decision turns on. */
const COST = () => {
  const fits = (sel, hostSel) => {
    const items = [...document.querySelectorAll(sel)];
    if (!items.length) return null;
    const host = hostSel ? document.querySelector(hostSel) : null;
    const hb = host ? host.getBoundingClientRect() : { height: window.innerHeight };
    const first = items[0].getBoundingClientRect();
    const each = items.length > 1
      ? (items[items.length - 1].getBoundingClientRect().bottom - first.top) / items.length
      : first.height;
    const avail = hb.height || (window.innerHeight - first.top);
    return each > 0 ? { each: Math.round(each * 10) / 10, fit: Math.floor(avail / each) } : null;
  };
  return {
    regRow: fits('#reg-tbody tr[data-row]', null),
    card:   fits('#rl-changes-col [data-rl-card], #rl-changes-col article', '#rl-changes-col'),
    ktRow:  fits('[data-kt-row]', '#kt-side'),
  };
};

(async () => {
  const h = await startHati();
  const admin = h.client('admin');
  const bulk = Array.from({ length: 40 }, (_, i) => ({
    id: 'MK-3' + String(100 + i), name: 'Distribution agreement ' + (i + 1),
    counterparty: 'Counterparty ' + (i + 1), folder: i % 2 ? 'proc' : 'dist',
    value: 4000000 + i * 250000, valueType: 'standard',
    status: ['Draft', 'Under Review', 'Signed'][i % 3], template: 'RM',
    lastAction: '05 Aug 2026', expiry: '2027-0' + (1 + i % 9) + '-15',
    fields: {}, metadata: {}, comments: [], audit: [], signatures: [],
    obligations: [], rounds: [], versions: [], redlineText: BASE, format: 'text' }));
  await admin.json('/api/setup', { method: 'POST', body: {
    org: 'Highland Corporate Ltd', name: 'Amina Otieno', email: 'amina@highland.co.ke',
    password: 'adminpassword1', data: { uid: 300, contracts: [
      { id: 'MK-82', name: 'Retail Supply — Coast', counterparty: 'Naivas Supermarkets',
        folder: 'proc', value: 78000000, valueType: 'standard', status: 'Under Review',
        template: 'RM', lastAction: '06 Aug 2026', expiry: '2027-06-30',
        fields: { effDate: '2026-07-01' }, metadata: {}, comments: [], audit: [],
        signatures: [], obligations: [], rounds: [], versions: [], redlineText: BASE, format: 'text' },
      ...bulk,
    ], settings: {} } } });

  /* 2x PIXEL DENSITY, so a crop shown at full size is actually sharp rather
     than a blown-up 1x image. */
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const [ck, cv] = String(admin.cookie || '').split('=');
  const cost = {};

  for (const [name, css] of TREATMENTS) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await ctx.addCookies([{ name: ck, value: cv, url: h.base }]);
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('  page error:', e.message));
    await page.goto(h.base, { waitUntil: 'load' });
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts)
      && state.contracts.some(c => c && c.id === 'MK-82'));
    await page.addStyleTag({ content:
      '*,*::before,*::after{animation:none!important;transition:none!important}' });
    await page.evaluate(async () => {
      const c = getContract('MK-82'); negoInit(c);
      const cls = negoClauseList(c);
      for (let i = 0; i < 2 && i < cls.length; i++)
        await negoEditClause(c, cls[i].clauseId,
          `<p>Amended limb ${i + 1}: the Supplier shall deliver within fourteen (14) days.</p>`,
          { side: 'counterparty', author: 'Grace Njeri', summary: 'Delivery within 14 days' });
      persist(c);
    });

    /* APPENDED TO THE BODY, NOT THE HEAD, AND THAT IS NOT A DETAIL.
       HaTi declares its whole :root token block in a <style> inside the BODY
       — so Playwright's own addStyleTag, which appends to <head>, lands
       EARLIER in the document and loses the source-order tie to every token it
       is trying to override. Measured: three identical sets of screenshots and
       a --t-meta still reading 13px under a treatment that sets it to 14. */
    const wear = t => page.evaluate(css => {
      if (!css) return;
      const prev = document.getElementById('tt-treatment');
      if (prev) prev.remove();
      const el = document.createElement('style');
      el.id = 'tt-treatment'; el.textContent = css;
      document.body.appendChild(el);
    }, t);
    await wear(css);

    /* PROVE THE TREATMENT REACHED THE PAGE BEFORE PHOTOGRAPHING IT. A shot
       taken through an override that never applied is three identical pictures
       and a confident report. */
    const reached = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return { meta: cs.getPropertyValue('--t-meta').trim(),
               label: cs.getPropertyValue('--t-label').trim(),
               body: cs.getPropertyValue('--t-body').trim() };
    });
    console.log(`  ${name} — body ${reached.body}, metadata ${reached.meta}, label ${reached.label}`);

    for (const crop of CROPS) {
      await crop.go(page);
      await wear(css);
      await page.addStyleTag({ content:
        '*,*::before,*::after{animation:none!important;transition:none!important}' });
      const box = await page.evaluate(({ sel, rows }) => {
        const els = [...document.querySelectorAll(sel)].filter(e => e.getClientRects().length);
        if (!els.length) return null;
        const first = els[0].getBoundingClientRect();
        const last = (rows && els[rows - 1]) ? els[rows - 1].getBoundingClientRect() : first;
        return { x: Math.max(0, first.left - 8), y: Math.max(0, first.top - 8),
                 width: Math.min(760, Math.max(first.width, last.right - first.left) + 16),
                 height: Math.max(24, last.bottom - first.top + 16) };
      }, { sel: crop.sel, rows: crop.rows });
      if (!box) { console.log(`    (${crop.key} not on this screen)`); continue; }
      await page.screenshot({ path: path.join(OUT, `${crop.key}--${name}.png`), clip: box });
      if (name === 'A') crop._box = box;
    }

    const c = await page.evaluate(COST);
    cost[name] = c;
    await ctx.close();
  }

  await browser.close();
  await h.stop();

  const LABEL = { regRow: 'contracts list, one row', card: 'a tracked-change card',
                  ktRow: 'a Key terms row' };
  console.log('\nWHAT EACH TREATMENT COSTS, at 1440x900:');
  const base = cost.A || {};
  for (const key of Object.keys(LABEL)) {
    if (!base[key]) continue;
    const line = Object.entries(cost).map(([k, v]) => v[key]
      ? `${k} ${String(v[key].each).padStart(6)}px/${String(v[key].fit).padStart(3)} on screen` : null)
      .filter(Boolean).join('   ');
    console.log(`  ${LABEL[key].padEnd(26)} ${line}`);
  }
  console.log(`\nCrops: ${OUT}`);
})();
