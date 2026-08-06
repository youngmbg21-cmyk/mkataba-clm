/* ============================================================
   THEME TOKENS — the colour tidy-up changed nothing on screen
   ============================================================
   Step one of the three-theme work is plumbing: every brand colour that was
   typed straight into a file becomes a reference to one place. Nothing is
   meant to look different afterwards — not by a shade.

   "Not by a shade" is a claim you can only make by measuring.

   IT DOES NOT COMPARE PIXELS, and the first version of this did, which was a
   mistake worth recording. Hashing a screenshot of this app compares the phase
   of its animations as much as its colours: the live dot pulses, the Copilot
   badge breathes, relative times tick. Run twice on IDENTICAL code and the
   hashes differ. A test that fails against a baseline recorded ten seconds
   earlier is not a strict test, it is a broken one.

   So it compares COLOUR, which is the thing the refactor can actually break.
   Animation and transition are switched off, then every element on the page is
   asked for its resolved background, text, border, outline, fill, stroke and
   shadow — and the whole set is tallied into a sorted census: this exact shade,
   this many times. If one utility class stops resolving, or one hardcoded teal
   is replaced with a value a shade off, the census moves and it says which
   screen and which colour.

     node test/chromium/theme-tokens-verify.js --save     (record a baseline)
     node test/chromium/theme-tokens-verify.js            (check against it)

   It also asserts the thing the tidy-up is FOR: that changing the accent
   variables actually repaints the platform. A token nothing reads is not a
   token, and no census of the DEFAULT theme would ever notice.
*/
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const BASELINE = path.join(__dirname, 'theme-tokens-baseline.json');
const EXEC = '/opt/pw-browsers/chromium';
const SAVE = process.argv.includes('--save');
const pause = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  ok ? pass++ : fail++;
};

const BASE = ['RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY & SPECIFICATION', '1. The Supplier shall supply an estimated 5000 metric tonnes per annum meeting the agreed specification and the applicable KEBS/EAS standard.',
  '2. PRICE & CONTRACT VALUE', '2. The estimated annual contract value is KES 78,000,000, reviewed quarterly against published commodity indices.',
  '3. QUALITY & REJECTION', '3. Consignments failing specification may be rejected within 3 days of delivery.',
  '4. PAYMENT TERMS', '4. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n\n');

const SCREENS = [
  ['dashboard', async p => { await p.evaluate(() => setView('dashboard')); await pause(800); }],
  ['register',  async p => { await p.evaluate(() => setView('register')); await pause(600); }],
  ['calendar',  async p => { await p.evaluate(() => setView('calendar')); await pause(600); }],
  ['templates', async p => { await p.evaluate(() => setView('templates')); await pause(600); }],
  ['contract',  async p => { await p.evaluate(() => { openWorkspace('MK-82'); roomGoTab(getContract('MK-82'), 'docs'); }); await pause(800); }],
  ['keyterms',  async p => { await p.evaluate(() => roomGoTab(getContract('MK-82'), 'terms')); await pause(600); }],
  ['signing',   async p => { await p.evaluate(() => roomGoTab(getContract('MK-82'), 'signing')); await pause(600); }],
  ['history',   async p => { await p.evaluate(() => roomGoTab(getContract('MK-82'), 'history')); await pause(600); }],
  ['negotiate', async p => { await p.evaluate(() => openRedlineWorkbench('MK-82'));
                             await p.waitForSelector('#view-redline [id="rl-doc"]', { timeout: 10000 }); await pause(800); }],
  ['menu',      async p => { await p.evaluate(() => { openWorkspace('MK-82'); });
                             await p.waitForSelector('#ws-more'); await p.click('#ws-more'); await pause(300); }],
];

/* The census. Runs in the page: walks every element, takes the colour-bearing
   properties as the browser resolved them, and tallies. Sorted, so the order
   elements happen to be created in cannot move the answer. */
const CENSUS = () => {
  const COLOUR_RE = /(rgba?\([^)]*\)|#[0-9a-f]{3,8})/gi;
  const PROPS = ['backgroundColor', 'color', 'borderTopColor', 'borderRightColor',
    'borderBottomColor', 'borderLeftColor', 'outlineColor', 'fill', 'stroke',
    'caretColor', 'textDecorationColor', 'columnRuleColor'];
  const tally = new Map();
  const add = v => {
    if (!v || v === 'none' || v === 'rgba(0, 0, 0, 0)') return;
    tally.set(v, (tally.get(v) || 0) + 1);
  };
  for (const el of document.querySelectorAll('*')){
    const s = getComputedStyle(el);
    for (const p of PROPS) add(s[p]);
    /* Shadows and gradients carry brand colour too, and a refactor can break
       them without touching a single background-color. */
    for (const p of ['boxShadow', 'backgroundImage', 'textShadow']){
      const v = s[p];
      if (v && v !== 'none') for (const m of String(v).match(COLOUR_RE) || []) add(m);
    }
  }
  return [...tally.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, n]) => `${k} ×${n}`).join('\n');
};

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
      { id: 'MK-84', name: 'Packaging Supply — Nairobi', counterparty: 'Bull Packaging Ltd',
        folder: 'proc', value: 12750000, valueType: 'standard', status: 'Draft',
        template: 'RM', lastAction: '05 Aug 2026', expiry: '2027-01-15', fields: {}, metadata: {},
        comments: [], audit: [], signatures: [], obligations: [], rounds: [], versions: [],
        redlineText: BASE, format: 'text' },
    ], settings: {} } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const [ck, cv] = String(admin.cookie || '').split('=');
  const census = {};

  async function open(){
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ name: ck, value: cv, url: h.base }]);
    const page = await ctx.newPage();
    page.on('pageerror', e => check('page error', false, e.message));
    await page.goto(h.base, { waitUntil: 'load' });
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length);
    /* Frozen: an animated box-shadow resolves to a different colour on every
       frame, which is exactly the instability that sank the pixel version. */
    await page.addStyleTag({ content:
      '*,*::before,*::after{animation:none!important;transition:none!important}' });
    await page.evaluate(async () => {
      const c = getContract('MK-82'); negoInit(c);
      const cls = negoClauseList(c);
      await negoEditClause(c, cls[0].clauseId,
        '<p>The Supplier shall deliver within fourteen (14) days of the order date.</p>',
        { side: 'counterparty', author: 'Grace Njeri', summary: 'Delivery in 14 days' });
      await negoEditClause(c, cls[1].clauseId,
        '<p>The estimated annual contract value is KES 74,000,000, reviewed twice yearly.</p>',
        { side: 'counterparty', author: 'Grace Njeri', summary: 'Value down to KES 74m' });
      negoResolve(c, negoChanges(c)[0].id, 'accepted', { by: 'Amina Otieno', side: 'owner' });
      persist(c);
    });
    await pause(400);
    return { ctx, page };
  }

  for (const theme of ['light', 'dark']){
    const { ctx, page } = await open();
    if (theme === 'dark'){ await page.evaluate(() => applyTheme('dark')); await pause(300); }
    for (const [name, go] of SCREENS){
      await go(page);
      await page.addStyleTag({ content:
        '*,*::before,*::after{animation:none!important;transition:none!important}' });
      census[`${name}--${theme}`] = await page.evaluate(CENSUS);
    }
    await ctx.close();
  }

  /* ---- THE POINT OF THE EXERCISE ----
     Change the accent variables; the platform must change with them. If the
     tidy-up missed a hardcoded colour it stays teal while the token says navy,
     and a census of the default theme would never notice. */
  {
    const { ctx, page } = await open();
    await page.evaluate(() => setView('dashboard'));
    await pause(700);
    const before = await page.evaluate(CENSUS);
    await page.evaluate(() => {
      const R = document.documentElement.style;
      R.setProperty('--color-accent-600', '#24488f');
      R.setProperty('--color-accent-600-rgb', '36 72 143');
      R.setProperty('--accent-solid', '#24488f');
    });
    await pause(400);
    const after = await page.evaluate(CENSUS);
    check('changing the accent variables repaints the platform', before !== after,
      'a token nothing reads is not a token');
    /* And the teal it replaced must be GONE, not merely joined by a navy. */
    check('and the colour it replaced leaves the screen',
      before.includes('rgb(13, 148, 136)') && !after.includes('rgb(13, 148, 136)'),
      'anything still teal is a colour the tidy-up missed');
    await ctx.close();
  }

  await browser.close();
  await h.stop();

  if (SAVE){
    fs.writeFileSync(BASELINE, JSON.stringify(census, null, 2) + '\n');
    console.log(`\nBaseline saved — ${Object.keys(census).length} screens.`);
    process.exit(0);
  }
  if (!fs.existsSync(BASELINE)){
    console.log('\nNo baseline recorded. Run with --save first.');
    process.exit(1);
  }
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  for (const k of Object.keys(base)){
    if (base[k] === census[k]){ check(`${k} — every colour unchanged`, true); continue; }
    const was = new Set(String(base[k]).split('\n'));
    const now = new Set(String(census[k] || '').split('\n'));
    const gone = [...was].filter(x => !now.has(x)).slice(0, 4);
    const added = [...now].filter(x => !was.has(x)).slice(0, 4);
    check(`${k} — every colour unchanged`, false,
      `\n        was: ${gone.join(' | ') || '(nothing)'}\n        now: ${added.join(' | ') || '(nothing)'}`);
  }

  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
