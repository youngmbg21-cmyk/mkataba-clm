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
    /* the label's and the value's own tops, so 1e can ask "above" as pixels */
    ly: f.querySelector('.sec-f-l') ? Math.round(f.querySelector('.sec-f-l').getBoundingClientRect().top) : null,
    vy: f.querySelector('.sec-f-v') ? Math.round(f.querySelector('.sec-f-v').getBoundingClientRect().top) : null,
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
    /* RE-POINTED 21 Sep 2026: every field on the card can be typed now, and
       the nineteen that are ordinary metadata carry [data-ktm]. Counting only
       [data-kt] would report five boxes on a card showing twenty-four. */
    boxes: box.querySelectorAll('[data-kt], [data-ktm]').length,
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
    /* REVERSED IN PLACE, 22 Sep 2026. For one day the parties block sat at the
       top of this card and the grid gave up Counterparty and Their email so
       nothing was printed twice. The block has its own named section now, so
       the card keeps the ruled twelve. */
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
    /* 1e compared a cell's x with itself (no-self-compare, the one standing
       lint error in the suite until 20 Sep 2026) and so proved nothing. The
       claim is a GEOMETRY: in every cell the label's top edge is above the
       value's. */
    const stacked = rec.cells.filter(c => c.ly != null && c.vy != null);
    check('1e label sits ABOVE its value', stacked.length > 1 && stacked.every(c => c.ly < c.vy),
      stacked.length ? stacked.slice(0, 3).map(c => `${c.label.trim()} ${c.ly}<${c.vy}`).join(' · ') : 'no cells measured');

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
    /* NO FACT PRINTED TWICE — REVERSED IN PLACE 21 Sep 2026.
       It used to ask that the grid GIVE UP the four fields the editable rows
       carried above it, which was right while the edit posture was a second
       shape stacked on the first. It is one shape now: the box is drawn in the
       cell's own place, so the four labels are still there and SHOULD be. The
       claim underneath is unchanged and is asked directly — no label on the
       section appears twice — which is strictly the stronger question. */
    const seen = {}, twice = [];
    dealEd.labels.forEach(l => { const k = l.trim().toLowerCase(); if (!k) return;
      if (seen[k]) { if (twice.indexOf(l.trim()) < 0) twice.push(l.trim()); } seen[k] = 1; });
    check('4b and no fact on it is printed twice', twice.length === 0,
      twice.length ? 'said twice: ' + twice.join(', ') : dealEd.labels.length + ' cells, none repeated');
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

    /* ═══ 9 · THE DEAL CARD IS EVERY CONTRACT'S (Young ruled 21 Sep 2026) ═══
       *"the deal card in the overview page is very sales dimensional. The
       fields there should be ones that are found in most contracts no matter
       the type of contract."* Then: *"only where something is recorded."*
       Measured on a REAL page, because whether a card is drawn at all is a
       question about painted pixels — a `return ''` and a card of em-dashes
       read identically in the markup a node check can see. */
    await openSec(page, '.deal');
    const SUPPLY = ['Volume rebate', 'Rebate tiers', 'Price review', 'Rejection window', 'Exclusivity'];
    const dealNow = await page.evaluate(SEC, '.deal');
    const stray = SUPPLY.filter(w => dealNow.labels.some(l => l.trim().toLowerCase() === w.toLowerCase()));
    check('9a no supply-only term is drawn on every contract', stray.length === 0,
      stray.length ? 'still on the card: ' + stray.join(', ') : dealNow.labels.length + ' cells, none of the five');
    const UNIVERSAL = ['Confidentiality', 'Disputes', 'Assignment'];
    const gone = UNIVERSAL.filter(w => !dealNow.labels.some(l => l.trim().toLowerCase() === w.toLowerCase()));
    check('9b and the three nearly every agreement has are', gone.length === 0,
      gone.length ? 'missing: ' + gone.join(', ') : UNIVERSAL.join(' · '));
    /* NOTHING RECORDED, NO CARD — asked as painted pixels, because a
       `return ''` and a card full of em-dashes read the same in markup.
       The card is OPENED before its fields are counted: a shut section draws
       no body at all, so counting it shut would report zero either way. */
    /* THE PRESS AND THE MEASUREMENT ARE TWO TRIPS. Opening a section repaints
       the whole pane, so anything measured in the same breath is measured on a
       node that has already been thrown away — which reported nought fields on
       a card whose own head said one. */
    const alsoOpen = async () => {
      await page.evaluate(() => {
        const h = [...document.querySelectorAll('[data-sec-toggle]')]
          .find(x => /\.also$/.test(x.getAttribute('data-sec-toggle') || ''));
        if (h && h.getAttribute('aria-expanded') !== 'true') h.click();
      });
      await page.waitForTimeout(400);
      return page.evaluate(() => {
        const h = [...document.querySelectorAll('[data-sec-toggle]')]
          .find(x => /\.also$/.test(x.getAttribute('data-sec-toggle') || ''));
        if (!h) return { drawn: false, w: 0, fields: 0, dashes: 0, head: '' };
        const box = h.closest('.sec-box'), r = box.getBoundingClientRect();
        return { drawn: r.width > 2 && r.height > 2, w: Math.round(r.width),
          fields: box.querySelectorAll('.sec-fields .sec-f').length,
          dashes: box.querySelectorAll('.sec-f-v.is-none').length,
          head: (h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) };
      });
    };
    const alsoAt = alsoOpen;
    /* THE GATE: empty the eight through the product's own painter first, so
       "not drawn" is a measurement and not an accident of the seed. */
    const ALSO_KEYS = ['volumeRebate', 'rebateTiers', 'priceReview', 'rejectionWindowDays',
      'exclusivity', 'retentionPct', 'retentionReleaseDays', 'warrantyMonths'];
    await page.evaluate((keys) => {
      const c = window.getContract(window.state.activeId);
      c.metadata = c.metadata || {};
      keys.forEach(k => { delete c.metadata[k]; });
      window.renderKeyTerms(c);
    }, ALSO_KEYS);
    await page.waitForTimeout(500);
    const before = await alsoAt();
    check('9c GATE/CONTROL — with nothing recorded there is no card at all', !before.drawn,
      before.drawn ? 'drawn ' + before.w + 'px wide, ' + before.fields + ' fields' : 'not drawn');
    /* RECORD ONE, through the same painter. */
    await page.evaluate(() => {
      const c = window.getContract(window.state.activeId);
      c.metadata = c.metadata || {}; c.metadata.exclusivity = 'exclusive';
      window.renderKeyTerms(c);
    });
    await page.waitForTimeout(500);
    const after = await alsoAt();
    check('9d record one and the card appears', after.drawn, after.drawn ? after.head : 'still not drawn');
    check('9e holding only the one that is answered', after.fields === 1,
      after.fields + ' field' + (after.fields === 1 ? '' : 's'));
    check('9f and it can never be a row of em-dashes', after.drawn && after.dashes === 0,
      after.dashes + ' unanswered fields drawn');
    /* EVERY FIELD CAN BE TYPED — counted against the card's own cells. */
    await page.click('[data-ov-edit$=".deal"]');
    await page.waitForTimeout(800);
    const ed = await page.evaluate(SEC, '.deal');
    /* One cell is DERIVED from the two dates beside it and is never a box. */
    check('9g every field on the card is a box bar the one worked out for you',
      ed.boxes >= ed.cells.length - 1, ed.boxes + ' boxes against ' + ed.cells.length + ' cells');
    await page.click('[data-ov-edit$=".deal"]');
    await page.waitForTimeout(600);

    /* ═══ 10 · BEFORE SIGNING, THE CARD MARKS WHAT IS HOLDING IT ═══
       (Young ruled 21 Sep 2026.) Measured on a REAL page: whether a cell is
       painted amber, and whether the grid moves when a mark clears, are
       questions only a laid-out page can answer. */
    const cellAt = async (label) => page.evaluate((lab) => {
      const f = [...document.querySelectorAll('#kt-deal-facts .sec-f')]
        .find(x => ((x.querySelector('.sec-f-l') || {}).textContent || '').trim().toLowerCase() === lab);
      if (!f) return null;
      const cs = getComputedStyle(f), r = f.getBoundingClientRect();
      const n = f.querySelector('.sec-f-n');
      return { bg: cs.backgroundColor, left: cs.borderLeftWidth, top: Math.round(r.top),
        note: n ? (n.textContent || '').trim() : null, door: !!f.querySelector('[data-ov-fix]'),
        tag: n ? n.tagName : '' };
    }, label);
    /* PUT THE CONTRACT INTO THE SIGNING PHASE WITH ONE THING OWED. */
    await page.evaluate(() => {
      const c = window.getContract(window.state.activeId);
      c.status = 'Under Review'; c.valueType = 'estimated'; c.value = 0;
      window.renderKeyTerms(c);
    });
    await page.waitForTimeout(600);
    const marked = await cellAt('contract value');
    check('10a the field holding the signature is marked, as painted pixels',
      !!marked && marked.left !== '0px' && marked.bg !== 'rgba(0, 0, 0, 0)',
      marked ? 'bg ' + marked.bg + ' · left rule ' + marked.left : 'no value cell');
    check('10b and it says so in words, on a real button',
      !!marked && !!marked.note && marked.tag === 'BUTTON' && marked.door,
      marked ? JSON.stringify({ note: marked.note, tag: marked.tag, door: marked.door }) : 'none');
    const headChip = await page.evaluate(() => {
      const h = document.querySelector('[data-sec-toggle$=".deal"]');
      const chip = h && h.querySelector('.sec-chip');
      return chip ? (chip.textContent || '').trim() : '';
    });
    check('10c the head counts the same thing', /\d/.test(headChip), headChip || 'no chip');
    /* NOTHING MOVES WHEN A MARK APPEARS OR CLEARS, and it is asked as the
       relation that makes that true rather than as two page measurements: a
       marked line and an unmarked one measure the same height, IN THE SAME
       RENDER, so no cell in a row can be taller for carrying a mark. (Two
       renders would also be measuring the value's own text — an em-dash in
       the body face against a figure in the mono one, which really is two
       pixels and is nothing to do with the mark.) */
    const lineHeights = await page.evaluate(() => {
      const ns = [...document.querySelectorAll('#kt-deal-facts .sec-f-n')];
      const hold = ns.find(n => n.classList.contains('is-hold'));
      const plain = ns.find(n => !n.classList.contains('is-hold'));
      if (!hold || !plain) return null;
      return { hold: Math.round(hold.getBoundingClientRect().height),
        plain: Math.round(plain.getBoundingClientRect().height), n: ns.length };
    });
    check('10e a marked line and an empty one are the same height',
      !!lineHeights && lineHeights.hold === lineHeights.plain && lineHeights.hold > 0,
      lineHeights ? 'marked ' + lineHeights.hold + 'px · empty ' + lineHeights.plain
        + 'px over ' + lineHeights.n + ' cells' : 'no lines drawn');
    await page.evaluate(() => {
      const c = window.getContract(window.state.activeId);
      c.value = 4200000;
      window.renderKeyTerms(c);
    });
    await page.waitForTimeout(600);
    const cleared = await cellAt('contract value');
    check('10d CONTROL — answering it clears the mark', !!cleared && cleared.left === '0px',
      cleared ? 'left rule ' + cleared.left + ' · note "' + (cleared.note || '') + '"' : 'gone');
    /* AND A DRAFT DRAWS NO LINE AT ALL — the card a reader sees every day. */
    await page.evaluate(() => {
      const c = window.getContract(window.state.activeId);
      c.status = 'Draft'; window.renderKeyTerms(c);
    });
    await page.waitForTimeout(600);
    const asDraft = await page.evaluate(() =>
      document.querySelectorAll('#kt-deal-facts .sec-f-n').length);
    check('10f CONTROL — a draft keeps its old shape to the byte', asDraft === 0,
      asDraft + ' reserved lines');

    /* ═══ 11 · WHO IS ON THIS CONTRACT — THE SECOND DOOR ═══
       (Young ruled 21 Sep 2026: *"should you choose to skip this, there
       should be another door in the contract page."*) Driven, because whether
       a row can be added and whether it says what the role fills in are
       questions about a rendered, wired panel. */
    await page.evaluate(() => {
      const c = window.getContract(window.state.activeId);
      c.status = 'Under Review'; c.participants = [];
      window.renderKeyTerms(c);
    });
    await page.waitForTimeout(500);
    const pplHead = await page.evaluate(() => {
      const h = [...document.querySelectorAll('[data-sec-toggle]')]
        .find(x => /\.people$/.test(x.getAttribute('data-sec-toggle') || ''));
      if (!h) return null;
      if (h.getAttribute('aria-expanded') !== 'true') h.click();
      return (h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    });
    await page.waitForTimeout(400);
    check('11a the contract page has its own door onto the list', !!pplHead,
      pplHead || 'no section');
    const added = await page.evaluate(() => {
      const b = document.querySelector('#kt-people [data-pt-add]');
      if (!b) return { ok: false, why: 'no Add' };
      b.click();
      return { ok: true };
    });
    await page.waitForTimeout(500);
    const row = await page.evaluate(() => {
      const r = document.querySelector('#kt-people [data-pt-row]');
      if (!r) return null;
      const sel = r.querySelector('[data-pt-f="role"]');
      if (sel){ sel.value = 'cpsign'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      return { ok: true };
    });
    await page.waitForTimeout(500);
    const said = await page.evaluate(() => {
      const r = document.querySelector('#kt-people [data-pt-row]');
      if (!r) return null;
      const sel = r.querySelector('[data-pt-f="role"]');
      return { role: sel ? sel.value : '',
        says: ((r.querySelector('.pt-says') || {}).textContent || '').trim(),
        reached: ((r.querySelector('.pt-reached') || {}).textContent || '').trim(),
        access: !!r.querySelector('[data-pt-f="access"]'),
        stored: (window.getContract(window.state.activeId).participants || []).length };
    });
    check('11b Add someone really adds a row', added.ok && !!said,
      added.why || (said ? 'one row' : 'no row'));
    check('11c the row says what that role fills in', !!said && said.says.length > 8,
      said ? said.role + ' \u2192 ' + said.says : 'nothing');
    check('11d and what has reached them, which is nothing yet', !!said && !!said.reached,
      said ? said.reached : 'no column');
    check('11e access is on the row, and the record holds it',
      !!said && said.access && said.stored === 1,
      said ? 'access box ' + said.access + ' \u00b7 ' + said.stored + ' on the record' : 'none');

    /* ============ 6. WHAT COPILOT READ IS ONE TABLE OF FIVE ============ */
    await openSec(page, '.copilot');
    const cop = await page.evaluate(SEC, '.copilot');
    check('6a every reading is one table of five rows', cop && cop.readRows === 5,
      cop ? cop.readRows + ' rows' : 'section missing');
    check('6b each carries the date it was made', cop && cop.readDates === 5, cop && cop.readDates + ' date cells');
    check('6c and a door into it where there is one', cop && cop.readDoors >= 4, cop && cop.readDoors + ' doors');

    /* ═══ 8 · THE NAME OF A FIELD IS NOT BOLD; ITS ANSWER IS ═══
       (Young ruled 20 Sep 2026: "the names of the fields are currently in bold
       grey letters. They should not be in bold letters. The answered fields
       should stay in black bold letters.") Measured as PAINTED WEIGHTS — the
       source reads a token either way. */
    const ty = await page.evaluate(() => {
      const head = document.querySelector('[data-sec-toggle$="deal"]');
      const box = head && head.closest('.sec-box');
      if (!box) return null;
      const f = box.querySelector('.sec-fields .sec-f');
      const answered = [...box.querySelectorAll('.sec-f-v')].find(v => !v.classList.contains('is-none'));
      const empty = box.querySelector('.sec-f-v.is-none');
      const g = el => el ? getComputedStyle(el) : null;
      const l = g(f && f.querySelector('.sec-f-l')), a = g(answered), e = g(empty);
      return { label: l && l.fontWeight, labelCase: l && l.textTransform, labelInk: l && l.color,
        answered: a && a.fontWeight, answeredInk: a && a.color,
        empty: e && e.fontWeight, bodyInk: getComputedStyle(document.body).color,
        answeredText: answered ? (answered.textContent || '').trim() : null };
    });
    check('8a GATE — the deal grid is painted with a label and an answered value',
      !!(ty && ty.label && ty.answered && ty.answeredText && ty.answeredText !== '—'),
      ty ? JSON.stringify(ty) : 'no section');
    check('8b the field NAME is not bold', !!ty && Number(ty.label) <= 400,
      ty ? 'label weight ' + ty.label : 'not measured');
    check('8c CONTROL — and it keeps the product\'s own label treatment otherwise',
      !!ty && ty.labelCase === 'uppercase', ty ? String(ty.labelCase) : 'not measured');
    check('8d CONTROL — an ANSWERED field stays bold', !!ty && Number(ty.answered) >= 600,
      ty ? 'value weight ' + ty.answered : 'not measured');
    check('8e CONTROL — and stays in the page\'s own ink, not the label\'s grey',
      !!ty && ty.answeredInk === ty.bodyInk && ty.answeredInk !== ty.labelInk,
      ty ? (ty.answeredInk + ' against body ' + ty.bodyInk + ' / label ' + ty.labelInk) : 'not measured');
    check('8f CONTROL — an em-dash is still the light one',
      !!ty && (ty.empty == null || Number(ty.empty) <= 400),
      ty ? 'empty weight ' + ty.empty : 'not measured');

    /* ===== 12. WHO THE AGREEMENT IS BETWEEN IS ON THE PAGE AT REST =====
       Young, 22 September 2026: *"i do not see the changes in the overview
       page"*. The parties block was built at the top of The record, which
       OPENS SHUT — and a shut section draws no body at all, so the block was
       not hidden, it was not in the document. MEASURED at the parent:
       `#kt-parties` absent, 0 rows.

       EVERY CLAIM HERE IS PAINTED PIXELS ON A PAGE NOBODY HAS CLICKED — and
       THE PAGE MUST BE RELOADED FIRST. The fold is per sitting and in memory,
       so by this point in the file The record is already open from section 1
       and the block is drawn whatever the placement is. MEASURED: the first
       draft of 12a PASSED at the parent for exactly that reason. A reload
       drops the remembered folds; the session cookie keeps us signed in. */
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1600);
    await page.evaluate(x => { state.activeId = x; state.selId = x; setView('workspace'); }, c.id);
    await page.waitForTimeout(1400);
    await page.click('#ws-tabs [data-ws-tab="terms"]');
    await page.waitForTimeout(1200);
    const py = await page.evaluate(() => {
      const box = document.querySelector('[data-sec-toggle$=".parties"]');
      const sec = box && box.closest('.sec-box');
      const blk = document.querySelector('#kt-parties');
      const r = blk ? blk.getBoundingClientRect() : null;
      const order = [...document.querySelectorAll('[data-sec-toggle]')]
        .map(h => String(h.getAttribute('data-sec-toggle')).split('.').pop());
      return {
        drawn: !!blk,
        /* PAINTED, not merely present: a rect is not a painted pixel. */
        painted: !!(blk && getComputedStyle(blk).display !== 'none' && r.height > 0 && r.width > 0),
        open: box ? box.getAttribute('aria-expanded') : null,
        rows: blk ? blk.querySelectorAll('.py-row').length : 0,
        text: sec ? (sec.innerText || '').replace(/\s+/g, ' ') : '',
        add: !!document.querySelector('.sec-acts [data-py-add]'),
        /* NULL IS NOT ZERO: with no section there is nothing to count, and
           reporting 0 would make 12f pass on a page that has no parties at
           all. It says -1 so the claim can refuse it. */
        heads: sec ? sec.querySelectorAll('.py-head').length : -1,
        order,
      };
    });
    check('12a the parties are drawn on the page nobody has clicked',
      py.drawn && py.painted, py.drawn ? ('painted ' + py.painted) : 'no #kt-parties at all');
    check('12b and the section they are in is OPEN at rest', py.open === 'true',
      'aria-expanded ' + py.open);
    check('12c one row per party, ours included', py.rows === 2,
      py.rows + ' rows');
    check('12d each names its party and what it may do',
      py.text.includes(c.counterparty) && /NEGOTIATES AND SIGNS|OURS/i.test(py.text),
      py.text.slice(0, 160));
    check('12e the one door onto naming another party is on it',
      py.add, py.add ? 'in the section acts' : 'no + Add a party');
    check('12f the name is said ONCE — the section carries it, not the block',
      py.heads === 0, py.heads < 0 ? 'no parties section at all' : (py.heads + ' block heads inside it'));
    /* IT SITS ABOVE THE RECORD, which is where the artifact drew it. */
    check('12g it reads above The record',
      py.order.indexOf('parties') > -1 && py.order.indexOf('parties') < py.order.indexOf('record'),
      py.order.join(' \u00b7 '));

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
