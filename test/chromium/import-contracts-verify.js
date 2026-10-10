/* Chromium verification: IMPORTING CONTRACTS (the Import contracts page)
   ============================================================
   Owner-asked 10 Oct 2026, after the coverage report showed the import screen
   (js/views/migration.js) was the least-checked part of HaTi and had no
   browser check at all. f653 pins its reading rules; this walks the page a
   person uses, end to end, against a real server, reading every claim off the
   RENDERED page or the stored record:

     1  THE PAGE OPENS: the drop zone and the figures across the top.
     2  THE CUSTOMER'S LIST (manifest CSV) loads: the page names it, and a value
        it could not read is LISTED, left empty rather than guessed.
     3  A BATCH OF SIX FILES: three good ones are imported; an identical copy is
        skipped and names the contract it matched; an empty file fails with its
        reason; an old .doc Word file is refused. Nothing vanishes silently.
     4  WHAT WAS FILED: the list's facts win over the file's (counterparty,
        value "KES 2.5m", a day-first date, stream, status), saved on the server.
     5  RECONCILIATION: the list row with no file is named; the file with no
        list row is counted.
     6  A PERSON CONFIRMS: Review opens the details, Confirm & save clears it.
     7  A REFRESH KEEPS IT ALL, and the filed contract is on the Contracts list.

   No Copilot on this stage: the pattern reader is the path every workspace
   without a key takes. A section that cannot be staged reports its failure
   rather than timing out.

   Run: node test/chromium/import-contracts-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'import-'));

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* Where the walk stops, every check it did not reach is reported FAILED by
   name, read off this file's own calls. */
const EXPECT = (() => {
  const src = fs.readFileSync(__filename, 'utf8');
  const names = [...src.matchAll(/check\(\s*'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'"));
  return [...new Set(names)].filter(n => n !== 'the file ran to the end');
})();

/* Three readable contracts (over 200 characters each, so they are read, not
   flagged as having no text) and the files that must NOT become contracts. */
const body = (title, party, extra) => `${title}\n\nThis Agreement is made between Highland Corporate Ltd and ${party}.\n`
  + `1. Scope. The parties agree to the terms set out below for the supply of goods and services.\n`
  + `2. Payment. Invoices are payable within thirty days of receipt.\n${extra || ''}`
  + `3. Law. This Agreement is governed by the laws of Kenya.\n`;
const FILES = {
  'acme_supply_2024.txt': body('SUPPLY AGREEMENT', 'Acme Ltd'),
  'office_lease.txt': body('LEASE AGREEMENT', 'Riverside Properties Ltd'),
  'board_consultancy.txt': body('CONSULTANCY AGREEMENT', 'Mwangi Advisory LLP'),
};
const MANIFEST = [
  'filename,counterparty,stream,status,value,effective date,expiry date',
  'acme_supply_2024.txt,Acme Ltd,Procurement,Executed,KES 2.5m,01/02/2024,25/03/2027',
  'office_lease.txt,Riverside Properties Ltd,Corporate,Executed,"1,200,000/=",01/04/2024,2024-15-01',
  'never_sent.pdf,Ghost Supplies Ltd,Procurement,Executed,500000,01/01/2024,31/12/2026',
].join('\n');

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);
    const openImport = async () => {
      await page.evaluate(() => { state.aiConfigured = false; setView('migration'); });
      await page.waitForSelector('#mig-drop', { timeout: 8000 }).catch(() => {});
    };

    /* ===== 1. THE PAGE OPENS ===== */
    await openImport();
    const p1 = await page.evaluate(() => ({ drop: !!document.getElementById('mig-drop'),
      kpis: document.querySelectorAll('#mig-kpis > div').length, title: (document.getElementById('shell-title') || {}).textContent || '' }));
    await page.screenshot({ path: path.join(OUT, '1-page.png') });
    check('1a the Import contracts page opens with its drop zone and its figures', p1.drop && p1.kpis >= 4, JSON.stringify(p1));

    /* ===== 2. THE CUSTOMER'S LIST ===== */
    const mf = path.join(OUT, 'manifest.csv');
    fs.writeFileSync(mf, MANIFEST);
    await page.setInputFiles('#mig-manifest-file', mf);
    await page.waitForFunction(() => /manifest\.csv/.test(document.getElementById('content').innerText), null, { timeout: 8000 }).catch(() => {});
    const p2 = await page.evaluate(() => document.getElementById('content').innerText.replace(/\s+/g, ' '));
    await page.screenshot({ path: path.join(OUT, '2-manifest.png') });
    check('2a the page names the list it loaded and how many rows it has', /manifest\.csv loaded — 3 rows/.test(p2), (p2.match(/[^.]*manifest\.csv[^.]*/) || [''])[0].slice(0, 120));
    check('2b a value it could not read is listed by file and field, and left empty rather than guessed',
      /1 value in the manifest could not be read — those cells were left empty rather than guessed/.test(p2)
        && /office_lease\.txt · expiry date: "2024-15-01" is not a real date/.test(p2), (p2.match(/value[s]? in the manifest[^]{0,200}/) || [''])[0]);
    check('2c a list whose dates prove day-first is not flagged as unsure about its dates', !/Slashed dates are being read/.test(p2));

    /* ===== 3. A BATCH OF SIX FILES ===== */
    const paths = [];
    for (const [n, t] of Object.entries(FILES)) { const f = path.join(OUT, n); fs.writeFileSync(f, t); paths.push(f); }
    const copy = path.join(OUT, 'acme_supply_COPY.txt'); fs.writeFileSync(copy, FILES['acme_supply_2024.txt']); paths.push(copy);
    const empty = path.join(OUT, 'empty.txt'); fs.writeFileSync(empty, ''); paths.push(empty);
    const doc = path.join(OUT, 'old_contract.doc');
    fs.writeFileSync(doc, Buffer.concat([Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]), Buffer.alloc(2048, 1)])); paths.push(doc);
    await page.setInputFiles('#mig-files', paths);
    const finished = await page.waitForFunction(() => { const M = window.migState && migState(); return M && M.queue.length === 6 && !M.running; }, null, { timeout: 60000 })
      .then(() => true).catch(() => false);
    await page.waitForTimeout(800);
    check('3 · stage: the batch of six ran to the end', finished);
    const rows = await page.evaluate(() => {
      const M = migState();
      return M.queue.map(q => ({ name: q.name, status: q.status, note: q.note || '', id: q.id || '' }));
    });
    const qtext = await page.evaluate(() => (document.getElementById('mig-queue') || {}).innerText || '');
    await page.screenshot({ path: path.join(OUT, '3-batch.png'), fullPage: true });
    const row = n => rows.find(r => r.name === n) || {};
    const acmeId = row('acme_supply_2024.txt').id;
    check('3a the three readable contracts are imported, each with its own reference',
      ['acme_supply_2024.txt', 'office_lease.txt', 'board_consultancy.txt'].every(n => row(n).status === 'saved' && row(n).id)
        && new Set(rows.filter(r => r.id).map(r => r.id)).size === 3, JSON.stringify(rows.map(r => r.name + ':' + r.status)));
    check('3b an identical copy is skipped and names the contract it matched — never silently',
      row('acme_supply_COPY.txt').status === 'duplicate' && /identical to/.test(row('acme_supply_COPY.txt').note)
        && /Duplicate/.test(qtext), row('acme_supply_COPY.txt').note);
    check('3c an empty file fails, saying why', row('empty.txt').status === 'error' && /empty file/.test(row('empty.txt').note), row('empty.txt').note);
    check('3d an old .doc Word file is refused before anything is filed', row('old_contract.doc').status === 'word' && !row('old_contract.doc').id
      && /Word — not read/.test(qtext), row('old_contract.doc').note);
    check('3e the queue says the batch finished, with every file accounted for', /Batch B-[A-Z0-9]+ finished/.test(qtext) && /6\/6/.test(qtext),
      qtext.split('\n').slice(0, 2).join(' | '));

    /* ===== 4. WHAT WAS FILED — read back from the SERVER ===== */
    const rec = await page.evaluate(async id => {
      try { const c = await api('contracts/' + encodeURIComponent(id));
        return { cp: c.counterparty, value: c.value, expiry: c.expiry, folder: c.folder, status: c.status,
          manifest: !!(c.migration && c.migration.manifest), outside: !!(c.migration && c.migration.executedOutside),
          migrated: (c.audit || []).some(a => a && a.action === 'Migrated') };
      } catch (e) { return { err: String(e && e.message) }; }
    }, acmeId);
    check('4a the list\'s facts were filed: Acme Ltd, KES 2.5m read as 2,500,000, 25/03/2027 read day-first, Procurement, signed',
      rec.cp === 'Acme Ltd' && rec.value === 2500000 && rec.expiry === '2027-03-25' && rec.folder === 'proc' && rec.status === 'Signed', JSON.stringify(rec));
    check('4b the record says it was imported against the list, executed outside HaTi, and the trail says Migrated',
      rec.manifest && rec.outside && rec.migrated, JSON.stringify(rec));
    const leaseId = row('office_lease.txt').id;
    const leaseRow = await page.evaluate(id => { const tr = document.querySelector(`.mig-table tr[data-row="${id}"]`);
      return tr ? { text: tr.innerText.replace(/\s+/g, ' '), missing: [...tr.querySelectorAll('span[title$="— missing"]')].map(s => s.getAttribute('title')) } : null; }, leaseId);
    check('4c the date it could not read stays empty on the record, and its row shows the end-date gate as missing',
      leaseRow && leaseRow.missing.some(t => /expiry|evergreen|end/i.test(t)), JSON.stringify(leaseRow).slice(0, 220));
    const tableRows = await page.evaluate(() => document.querySelectorAll('.mig-table tbody tr[data-row]').length);
    check('4d the imported list on the page carries exactly the three imported contracts', tableRows === 3, String(tableRows));

    /* ===== 5. RECONCILIATION ===== */
    const p5 = await page.evaluate(() => document.getElementById('content').innerText.replace(/\s+/g, ' '));
    check('5a the figures say how much of the list was matched', /2\/3 Manifest matched/i.test(p5), (p5.match(/\d+\/\d+ Manifest matched/i) || [''])[0]);
    check('5b the list row with no file is named', /1 manifest row with no file received/.test(p5) && /never_sent\.pdf/.test(p5));
    check('5c the file with no list row is counted', /1 imported file had no manifest row/.test(p5));

    /* ===== 6. A PERSON CONFIRMS ===== */
    const toReview = await page.evaluate(() => { const b = document.querySelector('[data-mig-review]'); return b ? b.getAttribute('data-mig-review') : ''; });
    check('6 · stage: at least one imported contract is waiting for a person to confirm it', !!toReview);
    if (toReview) {
      await page.click(`[data-mig-review="${toReview}"]`);
      const opened = await page.waitForSelector('#mr-save', { timeout: 8000 }).then(() => true).catch(() => false);
      check('6a Review opens the details for a person to check', opened);
      if (opened) { await page.click('#mr-save'); await page.waitForTimeout(1500); }
      const after = await page.evaluate(async id => {
        try { await flushSaves(); } catch (_) {}
        const c = await api('contracts/' + encodeURIComponent(id));
        return { needs: !!(c.migration && c.migration.needsReview), btn: !!document.querySelector(`[data-mig-review="${id}"]`) };
      }, toReview);
      check('6b Confirm & save clears it — on the server, and its Review button goes', !after.needs && !after.btn, JSON.stringify(after));
    }

    /* ===== 7. A REFRESH KEEPS IT ALL ===== */
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await openImport();
    await page.waitForTimeout(800);
    const kept = await page.evaluate(() => document.querySelectorAll('.mig-table tbody tr[data-row]').length);
    await page.screenshot({ path: path.join(OUT, '7-after-refresh.png'), fullPage: true });
    check('7a after a refresh the three imported contracts are still listed', kept === 3, String(kept));
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(1200);
    const onList = await page.evaluate(id => { const c = getContract(id);
      const ref = c ? (window.contractRef ? contractRef(c) : c.id) : id;
      return [...document.querySelectorAll('.reg-table .reg-mk')].some(td => td.textContent.trim() === ref); }, acmeId);
    check('7b the imported contract is on the Contracts list', onList);

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the file ran to the end', false, String(e && e.stack || e).slice(0, 400));
    const why = 'not reached — ' + String((e && e.message) || e).split('\n')[0].slice(0, 140);
    const seen = new Set(results.map(r => r.name));
    for (const n of EXPECT) if (!seen.has(n)) check(n, false, why);
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed · shots in ${OUT}`);
  process.exit(failed ? 1 : 0);
})();
