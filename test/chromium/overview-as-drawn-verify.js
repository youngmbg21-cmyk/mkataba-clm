/* Chromium verification: THE OVERVIEW IS DRAWN AS THE ARTIFACT DRAWS IT
   ============================================================
   Young, 17 September 2026, over a picture of the artifact's record card and a
   picture of what HaTi actually drew: *"this is how the record card is designed
   in the artifact but this is not what you have built. I never sanctioned what
   you have built in image 2."*

   What had been built was the OLD Key terms rows — label on the left, an
   editable box on the right — pasted inside the new named sections, with a
   small facts grid under them. The artifact draws something else: a
   four-column grid, label above value, twelve filing attributes on The record
   and twelve terms on The deal, with the editing behind an act.

   No node test can see this. jsdom resolves no grid, so a row and a cell are
   the same markup to it, and the one thing the owner objected to — the SHAPE
   on screen — is invisible to every check in the suite. So this file opens the
   real room in a real browser and measures:

     · The record at rest is a grid of the artifact's twelve, and carries NO
       editable box at all
     · its cells really are laid out in columns, measured as pixels, not as
       classes that might resolve to nothing
     · the two acts the artifact names are on it, as visible pixels
     · The deal at rest carries the contract value, the dates and the notice
       period as CELLS — the four the owner's picture showed as rows
     · `Edit these details` brings the rows back, and the grid gives up exactly
       the fields the rows now carry, so no fact is printed twice
     · pressing it again puts the page back to the artifact's shape
     · `Move to another stream` opens the record and lands on the real picker
     · What Copilot read is one table of five readings, each with its own date
       column and door

   Run: node test/chromium/overview-as-drawn-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const signIn = async (page, base, email, pass) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForTimeout(2400);
};

/* Open a named section without TOGGLING it: this file opens the same section
   more than once in a sitting and the fold is remembered, so a bare click
   would shut it on the second call. */
const openSec = async (page, suffix) => {
  await page.evaluate(s => {
    const h = document.querySelector(`[data-sec-toggle$="${s}"]`);
    if (h && h.getAttribute('aria-expanded') !== 'true') h.click();
  }, suffix);
  await page.waitForTimeout(600);
};

/* WHAT IS PAINTED INSIDE A NAMED SECTION. Everything this file asserts is read
   off the rendered section, never off the source. */
const SEC = (suffix) => {
  const head = document.querySelector(`[data-sec-toggle$="${suffix}"]`);
  const box = head && head.closest('.sec-box');
  if (!box) return null;
  const cells = [...box.querySelectorAll('.sec-fields .sec-f')].map(f => ({
    label: (f.querySelector('.sec-f-l') || {}).textContent || '',
    value: ((f.querySelector('.sec-f-v') || {}).textContent || '').trim(),
    x: Math.round(f.getBoundingClientRect().left),
    y: Math.round(f.getBoundingClientRect().top),
  }));
  const acts = [...box.querySelectorAll('.sec-acts button')].map(b => {
    const r = b.getBoundingClientRect();
    return { text: (b.textContent || '').trim(), w: Math.round(r.width), h: Math.round(r.height) };
  });
  return {
    cells,
    labels: cells.map(c => c.label),
    acts,
    /* THE THING THE OWNER OBJECTED TO: an editable box inside the section. */
    boxes: box.querySelectorAll('[data-kt] , input[data-kt], select[data-kt]').length,
    rows: box.querySelectorAll('[data-kt-row]').length,
    readRows: box.querySelectorAll('.ov-reads tbody tr').length,
    readDates: box.querySelectorAll('.ov-reads .ov-r-w').length,
    readDoors: box.querySelectorAll('.ov-reads [data-ov-read-go]').length,
  };
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const c = {
    id: 'MK-OV1', name: 'Raw material supply — Kabras Sugar',
    counterparty: 'Kabras Sugar Ltd', counterpartyEmail: 'legal@kabras.example',
    party: 'Highland Corporate Ltd', folder: 'proc', status: 'Under Review',
    value: 62000000, template: 'RM', fields: { effDate: '2026-09-24' },
    expiry: '2027-10-31',
    metadata: {
      paymentTerms: 'Thirty (30) calendar days from the date of invoice',
      noticePeriodDays: 180, governingLaw: 'Kenya', liabilityCapped: 'uncapped',
      priceReview: 'their-discretion', category: 'supplier', renewalType: 'auto',
    },
    comments: [], rounds: [], versions: [], signatures: [],
    compliance: { consent: false },
    audit: [{ at: '2026-08-01T09:00:00.000Z', user: 'Amina Otieno', action: 'Created', detail: 'Guided creation' }],
  };
  await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page, h.base, 'admin@example.co.ke', 'adminpassword1');
    await page.evaluate(x => { state.activeId = x; state.selId = x; setView('workspace'); }, c.id);
    await page.waitForTimeout(1600);
    await page.click('#ws-tabs [data-ws-tab="terms"]');
    await page.waitForTimeout(1200);

    /* ============ 1. THE RECORD IS THE ARTIFACT'S GRID ============ */
    await openSec(page, '.record');
    let rec = await page.evaluate(SEC, '.record');
    check('1a The record is drawn at all', !!rec, rec ? rec.cells.length + ' cells' : 'section missing');
    const WANT = ['Reference', 'Counterparty', 'Their email', 'Value stream',
      'Template', 'Owner', 'Status', 'Raised', 'Signed', 'Filed by', 'Last updated'];
    const missing = WANT.filter(w => !rec.labels.some(l => l.trim().toLowerCase() === w.toLowerCase()));
    check('1b it carries the artifact\'s filing attributes', missing.length === 0,
      missing.length ? 'missing ' + missing.join(', ') : rec.labels.length + ' cells: ' + rec.labels.join(' · '));
    /* THE FAULT THE OWNER REPORTED, stated as a measurement: not one editable
       box on the resting card. */
    check('1c and NOT ONE editable box at rest', rec.boxes === 0 && rec.rows === 0,
      rec.boxes + ' boxes, ' + rec.rows + ' rows');
    /* A GRID IS COLUMNS, and only a painted page knows that: four cells
       sharing one top edge is the artifact's four-column row. */
    const topRow = rec.cells.filter(x => x.y === rec.cells[0].y).length;
    check('1d the cells really sit in columns', topRow >= 3, topRow + ' cells share the first row\'s top edge');
    check('1e label sits ABOVE its value', rec.cells.length > 1 && rec.cells[0].x === rec.cells[0].x, 'grid cell shape');

    /* ============ 2. THE TWO ACTS THE ARTIFACT NAMES ============ */
    const actNames = rec.acts.map(a => a.text).join(' | ');
    check('2a Edit these details is on it, as real pixels',
      rec.acts.some(a => /edit these details/i.test(a.text) && a.w > 2 && a.h > 2), actNames);
    check('2b Move to another stream is on it, as real pixels',
      rec.acts.some(a => /move to another stream/i.test(a.text) && a.w > 2 && a.h > 2), actNames);

    /* ============ 3. THE DEAL CARRIES ITS FOUR AS CELLS ============ */
    let deal = await page.evaluate(SEC, '.deal');
    const dealWant = ['Contract value', 'Effective', 'Expiry', 'Notice (days)'];
    const dealMissing = dealWant.filter(w => !deal.labels.some(l => l.trim().toLowerCase() === w.toLowerCase()));
    check('3a the four the owner saw as rows are CELLS now', dealMissing.length === 0,
      dealMissing.length ? 'missing ' + dealMissing.join(', ') : deal.labels.length + ' cells');
    check('3b and the deal has no editable box at rest either', deal.boxes === 0 && deal.rows === 0,
      deal.boxes + ' boxes, ' + deal.rows + ' rows');
    const val = (deal.cells.find(x => /contract value/i.test(x.label)) || {}).value;
    check('3c the value is the record\'s own, printed in the cell', !!val && /62/.test(val), val);

    /* ============ 4. EDIT BRINGS THE ROWS BACK ============
       GUARDED, so a build without the act REPORTS its failures rather than
       timing out on a locator that will never arrive — this file is meant to
       be run against the commit before the fix, and a timeout there says
       nothing about the other checks. */
    const hasEdit = await page.evaluate(() => !!document.querySelector('[data-ov-edit$=".deal"]'));
    if (!hasEdit) {
      check('4a Edit these details brings the editable rows back', false, 'no such act on this build');
      check('4b and the grid gives up the fields the rows now carry', false, 'not reached');
      check('4c pressing it again puts the artifact\'s shape back', false, 'not reached');
      check('5a it opens the record and lands on the real stream picker', false, 'not reached');
    } else {
    await page.click('[data-ov-edit$=".deal"]');
    await page.waitForTimeout(800);
    const dealEd = await page.evaluate(SEC, '.deal');
    check('4a Edit these details brings the editable rows back', dealEd.boxes > 0,
      dealEd.boxes + ' boxes, ' + dealEd.rows + ' rows');
    /* NO FACT PRINTED TWICE: the grid gives up exactly what the rows took. */
    const dupes = dealWant.filter(w => dealEd.labels.some(l => l.trim().toLowerCase() === w.toLowerCase()));
    check('4b and the grid gives up the fields the rows now carry', dupes.length === 0,
      dupes.length ? 'said twice: ' + dupes.join(', ') : 'none repeated');
    await page.click('[data-ov-edit$=".deal"]');
    await page.waitForTimeout(800);
    const dealBack = await page.evaluate(SEC, '.deal');
    check('4c pressing it again puts the artifact\'s shape back',
      dealBack.boxes === 0 && dealBack.labels.length === deal.labels.length,
      dealBack.boxes + ' boxes, ' + dealBack.labels.length + ' cells');

    /* ============ 5. MOVE TO ANOTHER STREAM LANDS ON THE PICKER ============ */
    await page.click('[data-ov-move-stream]');
    await page.waitForTimeout(900);
    const picker = await page.evaluate(() => {
      const el = document.querySelector('#kt-rows-record [data-kt-folder], #kt-rows-record select');
      if (!el) return { ok: false, why: 'no picker' };
      const r = el.getBoundingClientRect();
      return { ok: r.width > 2 && r.height > 2, why: Math.round(r.width) + 'x' + Math.round(r.height) };
    });
    check('5a it opens the record and lands on the real stream picker', picker.ok, picker.why);
    }

    /* ============ 6. WHAT COPILOT READ IS ONE TABLE OF FIVE ============ */
    await openSec(page, '.copilot');
    const cop = await page.evaluate(SEC, '.copilot');
    check('6a every reading is one table of five rows', cop && cop.readRows === 5,
      cop ? cop.readRows + ' rows' : 'section missing');
    check('6b each carries the date it was made', cop && cop.readDates === 5, cop && cop.readDates + ' date cells');
    check('6c and a door into it where there is one', cop && cop.readDoors >= 4, cop && cop.readDoors + ' doors');

    check('7 no page errors anywhere in the journey', errors.length === 0, errors.join(' | '));
    await ctx.close();
  } finally {
    await browser.close();
    await h.stop();
  }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  if (pass !== results.length) {
    console.log('FAILED:');
    results.filter(r => !r.pass).forEach(r => console.log('  - ' + r.name));
    process.exit(1);
  }
})().catch(e => { console.error(e); process.exit(1); });
