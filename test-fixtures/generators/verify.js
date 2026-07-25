// Verification pass: re-run the reproductions from TESTREPORT.md.
const { as, shot, txt, nav, login } = require('./lib.js');
const { launch, BASE } = require('./drv.js');
const FIX = '/home/user/mkataba-clm/test-fixtures/';
const hook = pg => pg.evaluate(() => { window.__toasts = []; const o = window.toast; window.toast = (m, k) => { window.__toasts.push((k || 'ok') + ': ' + m); return o(m, k); }; });
const ok = (label, pass, detail) => console.log((pass ? '  PASS  ' : '  FAIL  ') + label + (detail ? '  — ' + detail : ''));

(async () => {
  const { b, pg } = await as('amina@mwangifoods.co.ke');
  await hook(pg);
  await pg.waitForTimeout(1200);

  // ---------- F-002 / F-003 / F-004 : manifest parsing
  await nav(pg, 'migration');
  await pg.setInputFiles('#mig-manifest-file', FIX + 'manifest-03-uk-dates.csv');
  await pg.waitForTimeout(1000);
  let m = await pg.evaluate(() => ({ rows: window.state.mig.manifest.map(r => [r.file, r.effective, r.expiry]), problems: (window.state.mig.manifestProblems || []).map(p => p.field + ': ' + p.message), order: window.state.mig.manifestDateOrder }));
  ok('F-002 impossible dates rejected', !JSON.stringify(m.rows).includes('2024-15-03') && !JSON.stringify(m.rows).includes('2026-31-12'), JSON.stringify(m.rows));
  ok('F-002 problems reported', m.problems.length > 0, m.problems.slice(0, 3).join(' | '));
  ok('F-002 file-wide date order sniffed', !!m.order, JSON.stringify(m.order));

  await pg.setInputFiles('#mig-manifest-file', FIX + 'manifest-08-kenyan-values.csv');
  await pg.waitForTimeout(1000);
  m = await pg.evaluate(() => ({ vals: window.state.mig.manifest.map(r => [r.name, r.value]), problems: (window.state.mig.manifestProblems || []).length }));
  ok('F-003 Kenyan money notation', JSON.stringify(m.vals) === JSON.stringify([['Sugar supply', 2500000], ['Carton supply', 2500000], ['Freight', 750000], ['Lease', 1200000]]), JSON.stringify(m.vals));

  await pg.setInputFiles('#mig-manifest-file', FIX + 'manifest-07-missing-required.csv');
  await pg.waitForTimeout(1000);
  const banner = await txt(pg);
  ok('F-004 rejected manifest is named on screen', /manifest-07-missing-required\.csv was not loaded/.test(banner) && /Still using/.test(banner));

  // ---------- F-005 : ten distinct contracts import cleanly
  await pg.setInputFiles('#mig-manifest-file', FIX + 'manifest-01-clean.csv');
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { window.__toasts = []; });
  await pg.setInputFiles('#mig-files', Array.from({ length: 10 }, (_, i) => FIX + 'batch-' + String(i + 1).padStart(2, '0') + '.pdf'));
  for (let i = 0; i < 150; i++) { if (i && !(await pg.evaluate(() => window.state.mig.running))) break; await pg.waitForTimeout(1000); }
  await pg.waitForTimeout(1500);
  let q = await pg.evaluate(() => window.state.mig.queue.map(x => x.status));
  ok('F-005 ten distinct contracts, none parked as duplicates', q.filter(x => x === 'dupe').length === 0, JSON.stringify(q.reduce((a, x) => (a[x] = (a[x] || 0) + 1, a), {})));
  ok('F-005 all ten imported', q.filter(x => x === 'saved').length === 10);

  // ---------- F-006 / F-007 / F-009 : bad files
  await pg.evaluate(() => { window.__toasts = []; });
  await pg.setInputFiles('#mig-files', [FIX + 'zero-byte.pdf', FIX + 'corrupt.pdf']);
  for (let i = 0; i < 90; i++) { if (i && !(await pg.evaluate(() => window.state.mig.running))) break; await pg.waitForTimeout(1000); }
  await pg.waitForTimeout(1200);
  const bad = await pg.evaluate(() => ({ q: window.state.mig.queue.map(x => x.status + ':' + x.note), t: window.__toasts }));
  ok('F-006 zero-byte file refused', /error:empty file/.test(bad.q[0]), bad.q[0]);
  ok('F-007 batch summary does not claim OCR', !/read by OCR/.test(JSON.stringify(bad.t)), JSON.stringify(bad.t));

  await pg.evaluate(() => { window.__toasts = []; });
  await pg.setInputFiles('#mig-files', [FIX + 'batch-11.pdf', FIX + 'batch-11.pdf']);
  for (let i = 0; i < 90; i++) { if (i && !(await pg.evaluate(() => window.state.mig.running))) break; await pg.waitForTimeout(1000); }
  await pg.waitForTimeout(1200);
  const twice = await pg.evaluate(() => window.state.mig.queue.map(x => x.status + ':' + x.note));
  ok('F-009 no "identical to null"', !/identical to null/.test(JSON.stringify(twice)), twice[1]);

  await b.close();
})();
