/* ============================================================
   PHASE T — THREE TREATMENTS, SIDE BY SIDE. THE OWNER RULES.
   ============================================================
   "The whole product is set at label size. 826 declarations at 12px and 667 at
   13px against 328 at 14px. It reads cramped rather than dense."

   THIS IS NOT A CHANGE AND MUST NOT BECOME ONE. Phase C's type sweep was
   explicitly zero visual change — it renamed 12px to the token that MEANS
   12px. Making the product read less cramped means RAISING sizes, which moves
   every screen in the platform, and that is the owner's decision.

   So this produces PICTURES, not prose. Eight screens the owner actually
   uses, in three treatments:

     A · as it is today
     B · one rung up for body copy only  (--t-meta 13->14, --t-label 12->13;
         labels and micro text unmoved)
     C · the ladder as the spec intends  (body 14, metadata 13, label 12,
         micro 11 — which is what the tokens already say, so C is A plus the
         off-ladder sizes resolved; see the note below)

   HOW B AND C ARE APPLIED, AND WHY IT IS HONEST: by overriding the TOKENS at
   :root and nothing else. That is only possible because Phase C gave the
   ladder 4,991 consumers — before it, a size decision could not be applied in
   one edit, which is exactly why the work order sequenced T after C.

   IT ALSO REPORTS WHAT EACH COSTS in rows-per-screen at 1440x900, because
   that is the number the decision actually turns on.

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
fs.mkdirSync(OUT, { recursive: true });

const BASE = ['RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY & SPECIFICATION', '1. The Supplier shall supply an estimated 5000 metric tonnes per annum meeting the agreed specification and the applicable KEBS/EAS standard.',
  '2. PRICE & CONTRACT VALUE', '2. The estimated annual contract value is KES 78,000,000, reviewed quarterly against published commodity indices.',
  '3. QUALITY & REJECTION', '3. Consignments failing specification may be rejected within 3 days of delivery.',
  '4. PAYMENT TERMS', '4. All invoices are payable within thirty (30) days from the date of issue.',
  '5. TERM & RENEWAL', '5. This agreement runs for twelve (12) months and renews automatically unless either party gives sixty (60) days written notice.',
].join('\n\n');

/* THE TREATMENTS ARE TOKEN OVERRIDES AND NOTHING ELSE. Anything that needed a
   second edit would mean the ladder still had a gap. */
/* AND THE THIRD TREATMENT HAD TO BE RE-CUT, which is worth stating.
   The work order describes C as "the ladder applied as the spec intends —
   body at 14, metadata at 13, labels at 12, micro at 11". MEASURED: HaTi's
   ladder ALREADY says exactly that, so written literally C is A with a
   different name and the owner would be ruling on two pictures, not three.
   The complaint underneath is that 826 declarations sit at 12px and 667 at
   13px against 328 at 14 — things that are body copy are set at label size —
   and Phase C's rename preserved that faithfully: a 12px became --t-label
   whether or not it was semantically a label. So C is the honest bolder
   option: one rung up across the WHOLE interface ladder. */
const TREATMENTS = [
  ['A-today', ''],
  ['B-metadata-up-one',
   ':root{--t-meta:14px;--t-label:13px;}'],
  ['C-whole-ladder-up-one',
   ':root{--t-body:15px;--t-meta:14px;--t-label:13px;--t-micro:12px;--t-card:16px;--t-section:18px;}'],
];

const SCREENS = [
  ['home',      async p => { await p.evaluate(() => setView('dashboard')); await pause(800); }],
  ['contracts', async p => { await p.evaluate(() => setView('register'));  await pause(800); }],
  ['calendar',  async p => { await p.evaluate(() => setView('calendar'));  await pause(700); }],
  ['insights',  async p => { await p.evaluate(() => setView('intel'));     await pause(1000); }],
  ['document',  async p => { await p.evaluate(() => { openWorkspace('MK-82'); roomGoTab(getContract('MK-82'), 'docs'); }); await pause(900); }],
  ['keyterms',  async p => { await p.evaluate(() => roomGoTab(getContract('MK-82'), 'terms')); await pause(700); }],
  ['negotiate', async p => { await p.evaluate(() => openRedlineWorkbench('MK-82'));
                             await p.waitForSelector('#view-redline #rl-doc', { timeout: 10000 }); await pause(900); }],
  ['settings',  async p => { await p.evaluate(() => setView('team'));      await pause(800); }],
];

/* WHAT A TREATMENT COSTS, in the unit the decision turns on: how much of each
   screen you can see at once on a 1440x900 laptop.

   AND THE FIRST ANSWER WAS A SURPRISE WORTH KEEPING. The obvious measure is
   rows-per-screen on the contracts list, and it comes back IDENTICAL for all
   three treatments — because that row's height is DECLARED (--reg-row-h, the
   owner's own 36px) rather than emergent from its type. Raising the type costs
   nothing there. Where it costs is on the surfaces whose height comes from
   their content, so those are what this measures:
     · the contract's own words        — lines of the agreement on screen
     · the tracked-changes column      — cards on screen
     · Key terms                       — rows on screen
   plus the register's row, reported anyway so the reader can see that it does
   not move and know that is the reason. */
const COST = () => {
  const box = (el) => el ? el.getBoundingClientRect() : null;
  const fits = (sel, hostSel) => {
    const items = [...document.querySelectorAll(sel)];
    if (!items.length) return null;
    const host = hostSel ? document.querySelector(hostSel) : null;
    const hb = box(host) || { top: 0, height: window.innerHeight };
    const first = box(items[0]);
    const avail = hb.height || (window.innerHeight - first.top);
    const each = items.length > 1
      ? (box(items[items.length - 1]).bottom - first.top) / items.length
      : first.height;
    return each > 0 ? { each: Math.round(each * 10) / 10, fit: Math.floor(avail / each) } : null;
  };
  return {
    regRow:  fits('#reg-tbody tr[data-row]', null),
    docLine: fits('#rl-doc .rl-clause p, #rl-doc .rl-clause', '#rl-doc'),
    card:    fits('#rl-changes-col [data-rl-card], #rl-changes-col article', '#rl-changes-col'),
    ktRow:   fits('[data-kt-row]', '#kt-side'),
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

  /* THE TRACKED-CHANGES COLUMN NEEDS SOMETHING ON THE TABLE, or the one
     surface here whose height really is content-driven measures nothing. */
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const [ck, cv] = String(admin.cookie || '').split('=');
  const cost = {};

  for (const [name, css] of TREATMENTS) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
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
      for (let i = 0; i < 3 && i < cls.length; i++)
        await negoEditClause(c, cls[i].clauseId,
          `<p>Amended limb ${i + 1}: the Supplier shall deliver within fourteen (14) days.</p>`,
          { side: 'counterparty', author: 'Grace Njeri', summary: 'Delivery in 14 days' });
      persist(c);
    });
    /* APPENDED TO THE BODY, NOT THE HEAD, AND THAT IS NOT A DETAIL.
       HaTi declares its whole :root token block in a <style> inside the BODY
       (index.html's second style tag, after </head>) — so Playwright's own
       addStyleTag, which appends to <head>, lands EARLIER in the document and
       loses the source-order tie to every token it is trying to override.
       Measured: three identical sets of screenshots and a --t-meta still
       reading 13px under a treatment that sets it to 14. */
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
       and a confident report — which is exactly the failure this whole run has
       been guarding against. */
    const reached = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const el = document.createElement('div');
      el.style.fontSize = 'var(--t-meta)'; document.body.appendChild(el);
      const painted = getComputedStyle(el).fontSize; el.remove();
      return { meta: cs.getPropertyValue('--t-meta').trim(),
               label: cs.getPropertyValue('--t-label').trim(), painted };
    });
    console.log(`  ${name} — tokens: --t-meta ${reached.meta}, --t-label ${reached.label}, painted ${reached.painted}`);

    for (const [screen, go] of SCREENS) {
      await go(page);
      await wear(css);
      await page.addStyleTag({ content:
        '*,*::before,*::after{animation:none!important;transition:none!important}' });
      await page.screenshot({ path: path.join(OUT, `${screen}--${name}.png`) });
      const c = await page.evaluate(COST);
      cost[name] = cost[name] || {};
      for (const [k, v] of Object.entries(c)) if (v && !cost[name][k]) cost[name][k] = v;
    }
    await ctx.close();
    console.log(`  ${name} — eight screens`);
  }

  await browser.close();
  await h.stop();

  const LABEL = { regRow: 'contracts list, one row', docLine: "the contract's own words",
                  card: 'tracked-changes cards', ktRow: 'Key terms rows' };
  console.log('\nNOTE — three of these four surfaces have a DECLARED height');
  console.log('(--reg-row-h is the owner\'s own 36px; the contract\'s words are');
  console.log('pinned to the reader\'s A-/A+ setting and were excluded from the');
  console.log('ladder sweep for that reason). So raising the type costs almost');
  console.log('nothing in what fits on screen — which is the number this');
  console.log('decision was expected to turn on, and it does not.');
  console.log('\nWHAT EACH TREATMENT COSTS, at 1440x900:');
  const base = cost['A-today'] || {};
  for (const key of ['regRow', 'docLine', 'card', 'ktRow']) {
    if (!base[key]) continue;
    console.log(`\n  ${LABEL[key]}`);
    for (const [k, v] of Object.entries(cost)) {
      const m = v[key]; if (!m) continue;
      const d = m.fit - base[key].fit;
      console.log(`    ${k.padEnd(16)} ${String(m.each).padStart(6)}px each   ${String(m.fit).padStart(3)} on screen`
        + (k === 'A-today' ? '   (the reference)' : `   ${d >= 0 ? '+' : ''}${d}`));
    }
  }
  console.log(`\nPictures: ${OUT}`);
  console.log('Three treatments x eight screens = 24 images. The owner rules from the pictures.');
})();
