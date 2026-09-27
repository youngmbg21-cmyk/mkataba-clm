/* A CONFIRMED REVIEW KEEPS WHAT WAS TYPED — measured in a real browser
   (the owner's list, 27 Sep 2026).

   "Confirming a key-terms review replaces every recorded term. Anything typed
   on the Overview that the review did not include is lost without warning."

   The settings backfill reads a contract AGAIN and opens the review dialog
   filled from that fresh reading, so a term somebody typed on the Overview
   and the reading could not find arrives as an EMPTY box — and Confirm wrote
   the dialog's answer over the whole record. This file drives exactly that
   path with the product's own functions (extractMetadata → openMetaReview →
   applyMetadata → persist), presses Confirm with a real mouse, and reads the
   record back off the server after a reload.

   Against the parent (3ee647b) this file reports 4 of 8 failed — the parent
   prints the un-read list as "consent" (its first choice) and files it over
   the typed "prohibited", and blanks the two typed text terms. 1 is the
   stage; 6 says the confirm landed; 7 is the CONTROL that a value the
   reviewer confirmed still wins; 8 is the error sweep. */
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

/* Wording the pattern reader can find a counterparty and a value in, and
   nothing about assignment, confidentiality or disputes. */
const TEXT = [
  'SUPPLY AGREEMENT',
  'This Agreement is made between Highland Corporate Ltd and Nordkust Industri AB.',
  '1. SUPPLY. The Supplier shall supply packaging materials to the Buyer as ordered from time to time.',
  '2. PRICE. The Buyer shall pay KES 1,200,000 for the materials, invoiced monthly in arrears.',
  '3. DELIVERY. Goods shall be delivered to the Buyer’s warehouse in Nairobi within fourteen days of an order.',
].join('\n\n');

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const id = 'MK-RV-1';
  await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
    id, name: 'Packaging Supply Agreement', counterparty: 'Nordkust Industri AB', folder: 'proc',
    status: 'Under Review', source: 'upload', value: 0, fields: {}, comments: [], audit: [],
    signatures: [], rounds: [], versions: [], obligations: [],
    upload: { fileName: 'supply.txt', mime: 'text/plain', extractedText: TEXT },
    /* WHAT A PERSON TYPED ON THE OVERVIEW, plus two things no review draws. */
    /* `prohibited`, NOT the list's first choice: a typed `consent` passed at
       the parent by coincidence, because the dialog's un-read list defaulted
       to its first option, which is `consent`. */
    metadata: { assignment: 'prohibited', confidentiality: 'Five years after termination',
      disputes: 'Arbitration in Nairobi', party: 'Highland Logistics (K) Ltd',
      templateFields: { material: 'Corrugated board' },
      confidence: { assignment: 'high', confidentiality: 'high', disputes: 'high', party: 'high' } },
  } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1400, height: 950 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* THE BACKFILL'S OWN THREE STEPS, for this one contract. */
    const opened = await page.evaluate(async id => {
      const c = window.getContract(id);
      if (!c) return null;
      try { await window.ensureFull(c); } catch (_) {}
      const meta = await window.extractMetadata(c.upload.extractedText, { counterparty: c.counterparty, value: c.value, expiry: c.expiry });
      window.__read = meta;
      window.openMetaReview(meta, m => { window.applyMetadata(c, m); window.persist(c); window.__saved = true; });
      const sel = k => { const el = document.querySelector(`[data-mf="${k}"]`); return el ? el.value : null; };
      return { dialog: !!document.getElementById('mr-save'), read: { assignment: meta.assignment || '', category: meta.category || '' },
        box: { assignment: sel('assignment'), category: sel('category'), liabilityCapped: sel('liabilityCapped'), confidentiality: sel('confidentiality') } };
    }, id);
    check('1 GATE — the review opens on a fresh reading that did NOT find the typed terms',
      !!opened && opened.dialog && !opened.read.assignment, opened && JSON.stringify(opened.read));
    check('2 a list term nothing was read for shows as empty, never as its first choice',
      !!opened && opened.box.assignment === '' && opened.box.liabilityCapped === '' && opened.box.category === (opened.read.category || ''),
      opened && JSON.stringify(opened.box));

    const box = await page.locator('#mr-save').boundingBox();
    if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.flushSaves && window.flushSaves());
    await page.waitForTimeout(800);

    /* READ BACK OFF THE SERVER, after a reload — what is on file. */
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    const stored = await page.evaluate(async id => {
      const r = await fetch('/api/contracts/' + id, { credentials: 'same-origin' });
      const c = await r.json();
      return c && c.metadata ? c.metadata : null;
    }, id);
    check('3 a list term typed on the Overview survives the confirm',
      !!stored && stored.assignment === 'prohibited', stored && `assignment=${stored.assignment}`);
    check('4 a text term typed on the Overview survives the confirm',
      !!stored && stored.confidentiality === 'Five years after termination' && stored.disputes === 'Arbitration in Nairobi',
      stored && `confidentiality=${stored.confidentiality} · disputes=${stored.disputes}`);
    check('5 what no review draws — our party, the template’s own answers — survives',
      !!stored && stored.party === 'Highland Logistics (K) Ltd' && stored.templateFields && stored.templateFields.material === 'Corrugated board',
      stored && `party=${stored.party} · material=${stored.templateFields && stored.templateFields.material}`);
    check('6 and the confirm itself landed', !!stored && !!stored.confirmedAt, stored && `confirmedAt=${stored.confirmedAt}`);
    check('7 CONTROL — a value the reading found and the reviewer confirmed is on file',
      !!stored && stored.counterparty === 'Nordkust Industri AB', stored && `counterparty=${stored.counterparty}`);
    check('8 no page error anywhere in the run', errors.length === 0, errors.join(' | ') || 'none');
  } finally {
    await browser.close();
    await h.stop();
  }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { console.log('FAILED:\n  ' + bad.map(b => b.name).join('\n  ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
