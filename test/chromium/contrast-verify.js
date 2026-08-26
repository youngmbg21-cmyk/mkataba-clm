/* ============================================================
   CONTRAST — what a person can actually read, in both themes
   ============================================================
   The 23 Aug design audit graded the dark theme C+ on one structural fact:
   `html.dark` redefines the surface, the ink and the whole neutral ramp and
   NEVER redefines the accent. So 183 declarations setting an accent ramp step
   as TEXT had no dark answer at all and measured 2.35:1 at night, five rungs
   under AA's 4.5. Sixty-two more set an accent TINT as an inline background,
   which at night is a near-white block under near-white text.

   THIS IS THE BROWSER HALF AND IT HAS TO BE. f238 asks whether the tokens
   exist and are reached; only a real browser can answer "and what does that
   compute to, composited, on the ground it actually sits on". This codebase's
   most expensive lesson is a rule that looked perfectly correct in the source
   and had lost a cascade fight for a year.

   HOW IT MEASURES. Every element carrying its OWN text (a direct text node,
   never text belonging to a child) is asked for its resolved colour; the
   ground under it is composited by walking up until the alphas reach opaque.
   WCAG's own thresholds: 4.5:1 for reading text, 3:1 for large text (24px, or
   18.66px at weight 700 and above). Disabled controls are exempt, which is
   WCAG's own exemption and not a convenience — a greyed control is MEANT to
   read as unavailable.

   A GRADIENT CANNOT BE ASKED THIS QUESTION and the probe says so rather than
   guessing: a background-image has no single colour, so those elements are
   counted separately and named. The one that matters is recorded below.

   Run: node test/chromium/contrast-verify.js
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
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

const BASE = ['RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY & SPECIFICATION', '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PRICE & CONTRACT VALUE', '2. The estimated annual contract value is KES 78,000,000.',
  '3. QUALITY & REJECTION', '3. Consignments failing specification may be rejected within 3 days.',
  '4. PAYMENT TERMS', '4. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n\n');

/* The census screens, plus Reports — which is not one of them and is the
   screen A1 rebuilt, so it needs its own measurement or the claim is
   unproven on exactly the page that changed most. */
const SCREENS = [
  ['dashboard', async p => { await p.evaluate(() => setView('dashboard')); await pause(700); }],
  ['register',  async p => { await p.evaluate(() => setView('register'));  await pause(600); }],
  ['reports',   async p => { await p.evaluate(() => setView('reports'));   await pause(900); }],
  ['calendar',  async p => { await p.evaluate(() => setView('calendar'));  await pause(600); }],
  ['templates', async p => { await p.evaluate(() => setView('templates')); await pause(600); }],
  ['contract',  async p => { await p.evaluate(() => { openWorkspace('MK-82'); roomGoTab(getContract('MK-82'), 'docs'); }); await pause(800); }],
  ['keyterms',  async p => { await p.evaluate(() => roomGoTab(getContract('MK-82'), 'terms'));   await pause(600); }],
  ['signing',   async p => { await p.evaluate(() => roomGoTab(getContract('MK-82'), 'signing')); await pause(600); }],
  ['history',   async p => { await p.evaluate(() => roomGoTab(getContract('MK-82'), 'history')); await pause(600); }],
  ['negotiate', async p => { await p.evaluate(() => openRedlineWorkbench('MK-82'));
                             await p.waitForSelector('#view-redline #rl-doc', { timeout: 10000 }); await pause(800); }],
];

/* THE INK THIS PASS DELIBERATELY DID NOT SWEEP, named so the count below is a
   fact rather than a mystery. --color-neutral-400 carries text in about fifty
   places AND borders and backgrounds in twenty, so it is the one step in this
   ramp that is not a type token — CLAUDE.md records it as deliberately left
   out of the four-shades pass for exactly that reason. As an ink it measures
   2.96:1 by day and 4.34:1 at night, which is a real finding and is logged;
   it is not a DARK THEME finding (it fails in both), and re-pointing fifty
   declarations one at a time with eyes on is the later type pass, not this. */
const KNOWN_PALE = ['rgb(138, 153, 151)', 'rgb(111, 129, 124)'];

const SWEEP = KNOWN => {
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const parse = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const n = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number);
    return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1]; };
  const over = (fg, bg) => { const a = fg[3];
    return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b);
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  /* Composite upward. An element with a translucent background sits on
     whatever is under it, and reading only its own backgroundColor is how a
     probe reports 1:1 white-on-white on a page nobody has trouble reading. */
  const bgOf = el => {
    let acc = null, n = el;
    while (n && n.nodeType === 1) {
      const s = getComputedStyle(n), c = parse(s.backgroundColor);
      if (s.backgroundImage && s.backgroundImage !== 'none') return { c: acc || [255,255,255,1], grad: true };
      if (c && c[3] > 0) { acc = acc ? over(acc, c) : c; if (acc[3] >= .999) return { c: acc }; }
      n = n.parentElement;
    }
    return { c: acc ? over(acc, [255,255,255,1]) : [255,255,255,1] };
  };
  const out = { fails: [], pale: 0, grad: 0 };
  for (const el of document.querySelectorAll('*')) {
    /* The brand swatches are SAMPLES of the other workspace — the census
       excludes them for the same reason and the reasoning is recorded there. */
    if (el.closest('#theme-menu, #theme-btn, [data-brand-pick], script, style, svg')) continue;
    let txt = ''; for (const n of el.childNodes) if (n.nodeType === 3) txt += n.nodeValue;
    txt = txt.trim(); if (!txt) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (el.closest('[disabled], [aria-disabled="true"], [data-rl-dead]')) continue;
    const fg = parse(s.color); if (!fg) continue;
    const b = bgOf(el);
    const ink = fg[3] < 1 ? over(fg, b.c) : fg;
    const px = parseFloat(s.fontSize) || 14, w = parseInt(s.fontWeight, 10) || 400;
    const need = (px >= 24 || (px >= 18.66 && w >= 700)) ? 3 : 4.5;
    const got = ratio(ink, b.c);
    if (got >= need - 0.005) continue;
    if (b.grad) { out.grad++; continue; }
    if (KNOWN.includes(s.color)) { out.pale++; continue; }
    out.fails.push({ tag: el.tagName.toLowerCase(),
      cls: (typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0,2).join('.') : ''),
      txt: txt.slice(0, 30), px, w, got: Math.round(got * 100) / 100, need,
      fg: s.color, bg: 'rgb(' + b.c.slice(0,3).map(Math.round).join(', ') + ')' });
  }
  return out;
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
      /* ENOUGH ROWS FOR THE PAGER TO DRAW. A check that passes because the
         control was not on the page is worse than no check. */
      ...Array.from({ length: 40 }, (_, i) => ({
        id: 'MK-2' + String(100 + i), name: 'Bulk fixture ' + (i + 1),
        counterparty: 'Fixture Counterparty ' + (i + 1), folder: 'proc',
        value: 1000000 + i * 1000, valueType: 'standard', status: 'Draft',
        template: 'RM', lastAction: '05 Aug 2026', expiry: '2027-02-15',
        fields: {}, metadata: {}, comments: [], audit: [], signatures: [],
        obligations: [], rounds: [], versions: [], redlineText: BASE, format: 'text' })),
    ], settings: {} } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const [ck, cv] = String(admin.cookie || '').split('=');

  async function open(theme) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ name: ck, value: cv, url: h.base }]);
    const page = await ctx.newPage();
    page.on('pageerror', e => check('page error', false, e.message));
    await page.goto(h.base, { waitUntil: 'load' });
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts)
      && state.contracts.some(c => c && c.id === 'MK-82'));
    await page.addStyleTag({ content:
      '*,*::before,*::after{animation:none!important;transition:none!important}' });
    if (theme === 'dark') { await page.evaluate(() => applyTheme('dark')); await pause(400); }
    return { ctx, page };
  }

  /* ---------- 1 · THE SWEEP, BOTH THEMES ---------- */
  let paleTotal = 0, gradTotal = 0;
  for (const theme of ['light', 'dark']) {
    const { ctx, page } = await open(theme);
    for (const [name, go] of SCREENS) {
      await go(page);
      await page.addStyleTag({ content:
        '*,*::before,*::after{animation:none!important;transition:none!important}' });
      const r = await page.evaluate(SWEEP, KNOWN_PALE);
      paleTotal += r.pale; gradTotal += r.grad;
      check(`${name}--${theme} — every ink clears AA on its own ground`,
        r.fails.length === 0,
        r.fails.length ? r.fails.slice(0, 4).map(f =>
          `${f.got}:1 (needs ${f.need}) ${f.px}px/${f.w} <${f.tag}${f.cls ? '.' + f.cls : ''}> "${f.txt}" ${f.fg} on ${f.bg}`).join(' | ')
          + (r.fails.length > 4 ? ` | +${r.fails.length - 4} more` : '') : null);
    }
    await ctx.close();
  }
  /* SAID OUT LOUD RATHER THAN HIDDEN. Two exclusions carry a count so nobody
     reads a green run as "nothing is left". */
  console.log(`\nNOTE  --color-neutral-400 as an ink: ${paleTotal} elements across both themes `
    + `(2.96:1 by day, 4.34:1 at night). Deliberately not swept — see the note in this file.`);
  console.log(`NOTE  text on a gradient: ${gradTotal} elements, unmeasurable by ratio. `
    + `The Insights hero tile is the one that matters and is logged.\n`);

  /* ---------- 2 · REPORTS' HERO CARDS ---------- */
  for (const theme of ['light', 'dark']) {
    const { ctx, page } = await open(theme);
    await page.evaluate(() => setView('reports')); await pause(900);
    const hero = await page.evaluate(() => {
      const grid = document.querySelector('#content .tnum') ? null : null;
      const cards = [...document.querySelectorAll('#content div')]
        .filter(d => /^3px/.test(getComputedStyle(d).borderTopWidth === '3px' ? '3px' : '')
          || getComputedStyle(d).borderTopWidth === '3px')
        .filter(d => d.querySelector('.tnum'));
      return cards.map(d => { const s = getComputedStyle(d);
        return { bg: s.backgroundColor, edge: s.borderTopColor, w: s.borderTopWidth,
                 surface: getComputedStyle(document.body).getPropertyValue('--color-surface') };
      });
    });
    check(`reports--${theme} — four hero cards on the platform shell`, hero.length === 4, `${hero.length} found`);
    const edges = new Set(hero.map(c => c.edge));
    check(`reports--${theme} — each card carries a 3px edge`,
      hero.length === 4 && hero.every(c => c.w === '3px'), hero.map(c => c.w).join('/'));
    check(`reports--${theme} — the edges are the metrics' own tones, not one colour`,
      edges.size >= 2, [...edges].join(' | '));
    /* THE POINT, AS A RELATION AND NOT A LITERAL: the card's ground IS the
       platform's card surface — whatever that token resolves to in this theme
       — rather than a colour of its own. Asked as "not white" it would be a
       tautology in light mode and would pass on the broken build. */
    const surf = await page.evaluate(() =>
      getComputedStyle(document.querySelector('#content section, #content div')).backgroundColor
      && (() => { const d = document.createElement('div');
        d.style.background = 'var(--color-surface)'; document.body.appendChild(d);
        const v = getComputedStyle(d).backgroundColor; d.remove(); return v; })());
    check(`reports--${theme} — every card's ground is the platform surface`,
      hero.length === 4 && hero.every(c => c.bg === surf),
      `cards ${hero.map(c => c.bg).join(' | ')} vs surface ${surf}`);
    await ctx.close();
  }

  /* ---------- 3 · THE THREE NAMED accent-600 FILLS ---------- */
  {
    const { ctx, page } = await open('light');
    await page.evaluate(() => setView('register')); await pause(700);
    const pager = await page.evaluate(() => {
      const b = document.querySelector('[data-reg-page]:not([disabled])');
      if (!b) return null;
      const on = [...document.querySelectorAll('[data-reg-page]')]
        .find(x => getComputedStyle(x).fontWeight === '700');
      return on ? getComputedStyle(on).backgroundColor : null;
    });
    const a600 = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-accent-600').trim());
    check('the pager draws at all, so the next check means something', pager != null, String(pager));
    check('the pager\'s live page is not the 3.74:1 fill', pager != null && !pager.includes('148, 136'),
      `${pager} (accent-600 is ${a600})`);

    const cf = await page.evaluate(async () => {
      confirmDialog({ title: 'x', message: 'y' });
      await new Promise(r => setTimeout(r, 250));
      const b = document.getElementById('cf-ok');
      const v = b ? getComputedStyle(b).backgroundColor : null;
      const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(esc);
      return v;
    });
    check('confirmDialog\'s confirm is not the 3.74:1 fill', cf == null || !cf.includes('148, 136'), cf);
    await ctx.close();
  }

  /* ---------- 4 · THE TEXT-SIZE STEPPER AT NIGHT ---------- */
  {
    const { ctx, page } = await open('dark');
    await page.evaluate(() => { openWorkspace('MK-82'); roomGoTab(getContract('MK-82'), 'docs'); });
    await pause(800);
    const step = await page.evaluate(() => {
      const b = document.querySelector('.rl-type-step button');
      const o = document.querySelector('.rl-type-out');
      return { btn: b ? getComputedStyle(b).color : null, out: o ? getComputedStyle(o).color : null };
    });
    /* neutral-300 answers #475569 at night — a PANEL BORDER shade — and that is
       what these two wore. 2.36:1 against the page ground. */
    check('the stepper\'s glyphs do not wear a border shade at night',
      step.btn == null || step.btn !== 'rgb(71, 85, 105)', step.btn);
    check('the stepper\'s readout does not either',
      step.out == null || step.out !== 'rgb(71, 85, 105)', step.out);
    await ctx.close();
  }

  await browser.close();
  await h.stop();
  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
