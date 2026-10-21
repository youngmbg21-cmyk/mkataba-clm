/* FILL IN, "OWED FIRST" (round 8 of the redesign: the owner picked "Owed
   first" by name and said yes to both questions — an NDA's two facts count as
   missing until a person confirms them, and base pay counts — 17 Oct 2026;
   js/paperdesk.js pdFillMark, js/views/contract.js detailsOf)

   RE-POINTED 20 Oct 2026 to THE LEGORA WAY (the owner's pick, which reverses
   this face): the same claims, on Still owed's grid and its Key terms.
   WHAT THIS PINS, driven in a real browser on three drafts: an uploaded
   framework agreement with three blanks, an NDA and an employment agreement
     1 Fill in is one worklist: "Still to fill" with its count (detailsOf's),
       every owed box under it — the contract's details and the paper's
       questions alike — and the answered ones behind one "Filled" line,
       which opens and shuts on a press
     2 a box answered stays where it is while the count drops (never moved
       under the hand); drawn again, it is in the fold
     3 the paper does not move when the face opens
     4 an NDA owes its two facts until a person confirms them: two rows, in
       the count, their door the facts' own editor; confirmed, they are paid
     5 an employment agreement owes its base pay: its row reads as pay, its
       door Edit pay
     6 the owner's three screens: the first owed box in view, nothing sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/owed-first-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const WORDING = ['<h1>FRAMEWORK AGREEMENT FOR FREIGHT SERVICES</h1>',
  '<p>between Lindqvist &amp; Co AB (the “Customer”) and Baltic Freight Oy, Helsinki (the “Carrier”)</p>',
  '<h4>1. Scope</h4><p>1.1 This Agreement sets the terms on which the Carrier carries goods for the Customer by road and sea between Sweden and Finland.</p>',
  '<h4>2. Term</h4><p>2.1 This Agreement starts on [Start date] and runs for two years. Either Party may end it on [Notice period] written notice.</p>',
  '<h4>3. Rates</h4><p>3.1 The expected yearly spend is [Expected yearly value].</p>'].join('');
const base = (id, name, extra) => Object.assign({ id, name, counterparty: 'Baltic Freight Oy', party: 'Lindqvist & Co AB', folder: 'proc', status: 'Draft', source: 'upload', format: 'rich', value: 0,
  template: null, fields: {}, redlineText: WORDING, upload: { fileName: id + '.docx', fileHash: 'h-' + id, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  metadata: { currency: 'SEK' }, comments: [], rounds: [], versions: [], signatures: [], compliance: { consent: false }, audit: [] }, extra || {});

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: { org: 'Lindqvist & Co AB', name: 'Maria Lindgren', email: 'admin@example.co.ke', password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });
  await admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [] } });
  const NDA_TEXT = '<h1>MUTUAL NON-DISCLOSURE AGREEMENT</h1><h4>1. Confidentiality</h4><p>Each party keeps the other party\'s confidential information secret for three (3) years after this Agreement ends.</p>';
  for (const c of [base('MK-0405', 'Framework agreement'),
    base('MK-0406', 'Mutual NDA with Kettle & Co', { counterparty: 'Kettle & Co', redlineText: NDA_TEXT, value: 0, valueType: 'none' }),
    base('MK-0407', 'Employment agreement — CFO', { counterparty: 'Annika Holm', redlineText: '<h1>EMPLOYMENT AGREEMENT</h1><p>The Employee starts as chief financial officer.</p>', metadata: { currency: 'SEK', category: 'employment' } })])
    await admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await page.$('#li-email')) { await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go'); }
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0405'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    /* RE-POINTED 20 Oct 2026 — THE LEGORA WAY (owner picked it by name; it
       REVERSES "Owed first"'s face): Still owed's grid is the one worklist,
       every owed fact a row with its box; the answered ones are Key terms'
       lines, folded under it */
    const FACE = () => { const og = document.getElementById('pd-og'); if (!og) return null;
      const vis = el => !!(el && (el.checkVisibility ? el.checkVisibility() : el.getClientRects().length) && getComputedStyle(el).display !== 'none');
      const kt = document.getElementById('pd-kt');
      const rows = [...og.querySelectorAll('tr.pd-og-row:not(.is-saved)')].filter(r => /^(kt|nda|tplf|blank)$/.test(r.getAttribute('data-pd-og-kind') || ''))
        .map(r => ({ k: r.getAttribute('data-pd-og-row'), vis: vis(r), top: Math.round(r.getBoundingClientRect().top), label: ((r.querySelector('.pd-og-f b') || {}).textContent || '').trim() }));
      const head = document.querySelector('#pd-needs .pd-gl-h b');
      return { head: head ? head.textContent.trim() : '', headTop: head ? Math.round(head.getBoundingClientRect().top) : null, rows, left: detailsOf(pdContract()).left,
        fold: kt ? (kt.querySelector('summary') || {}).textContent.replace(/\s+/g, ' ').trim() : '', foldTop: kt ? Math.round(kt.getBoundingClientRect().top) : null,
        open: !!(kt && kt.open), ktRows: kt ? [...kt.querySelectorAll('tr[data-pd-og-row]')].map(r => ({ k: r.getAttribute('data-pd-og-row'), vis: vis(r) })) : [] }; };
    const PAPER_AT = () => { const sc = document.getElementById('ig-paper-scroll'), sh = document.querySelector('#ig-paper .pg-sheet, #ig-paper .doc-surface');
      return sc && sh ? Math.round(sh.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop) : null; };
    const openFill = async id => { await page.evaluate(i => { setView('dashboard'); pdOpenOnHome(i, 'doc'); }, id);
      await until(i => window.intel && intel.paper && intel.paper.id === i && !!document.getElementById('ig-canvas'), id);
      const firstAt = await page.evaluate(PAPER_AT);
      await page.evaluate(i => pdFillOpen(i), id);
      await until(i => !!document.querySelector(`#pd-og[data-pd-og-for="${i}"] tr.pd-og-row`), id);
      await page.waitForTimeout(300);
      return firstAt; };

    /* 1 one worklist */
    const at0 = await openFill('MK-0405');
    const F = await page.evaluate(FACE);
    check('1a Still owed\'s grid: one row per owed fact (detailsOf\'s count), the details and the paper\'s questions alike',
      !!F && F.rows.length === F.left && F.rows.every(r => r.vis && r.top > F.headTop) && F.rows.some(r => /Start date/.test(r.label)) && F.rows.some(r => /Effective/.test(r.label)), JSON.stringify(F));
    check('1b the answered ones are Key terms\' lines, folded under the grid', !!F && /^Key terms/.test(F.fold) && F.ktRows.length > 0 && F.ktRows.every(r => !r.vis) && F.foldTop > Math.max(...F.rows.map(r => r.top)) && !F.open, F && F.fold);
    await page.click('#pd-kt summary');
    const opened = await page.evaluate(FACE);
    check('1c pressed, the fold opens and shows them', opened.open && opened.ktRows.every(r => r.vis), JSON.stringify(opened.ktRows));
    await page.click('#pd-kt summary');
    check('1d pressed again, it shuts', !(await page.evaluate(FACE)).open);
    await shot(page, 'owed-first-1440x780');

    /* 2 a box answered stays put under the hand */
    await page.click('#pd-og [data-blankf="up_notice_period"]');
    const before = await page.evaluate(() => { const b = document.querySelector('#pd-og [data-blankf="up_notice_period"]'); return b ? Math.round(b.getBoundingClientRect().top) : null; });
    await page.keyboard.type('6 months');
    await page.keyboard.press('Tab');
    await until(l => detailsOf(pdContract()).left === l - 1, F.left, 5000);
    const after = await page.evaluate(() => { const b = document.querySelector('#pd-og [data-blankf="up_notice_period"]'); return { top: b ? Math.round(b.getBoundingClientRect().top) : null, inGrid: !!b, left: detailsOf(pdContract()).left }; });
    check('2a stored as the box is left, the row stays where it is while the hand is in the grid', before != null && after.top === before && after.inGrid && after.left === F.left - 1, JSON.stringify({ before, after }));
    await page.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); });
    const again = await until(() => !document.querySelector('#pd-og tr:not(.is-saved) [data-blankf="up_notice_period"]') && !!document.querySelector('#pd-kt tr[data-pd-og-row="up_notice_period"]'), null, 4000);
    check('2b the hand gone, it is drawn again: no longer owed, a Key terms line', !!again);

    /* 3 the paper holds still */
    const at1 = await page.evaluate(PAPER_AT);
    check('3 the paper does not move when the grid is asked', at0 != null && at1 != null && Math.abs(at1 - at0) <= 2, `${at0} → ${at1}`);

    /* 4 an NDA's two facts */
    await openFill('MK-0406');
    const N = await page.evaluate(() => { const c = pdContract(), d = detailsOf(c);
      return { items: d.items.filter(x => x.kind === 'nda').map(x => x.key + ':' + x.open), left: d.left,
        rows: [...document.querySelectorAll('#pd-og tr[data-pd-og-row^="nda"]')].map(r => ({ k: r.getAttribute('data-pd-og-row'), cls: r.className, t: r.textContent.replace(/\s+/g, ' ').trim(), ok: !!r.querySelector('[data-pd-og-ok]'),
          dir: (r.querySelector('[data-pd-og-nda="dir"]') || {}).value || '' })) }; });
    check('4a an NDA owes its two facts: two rows of the grid, in the count, each with Confirm',
      JSON.stringify(N.items) === JSON.stringify(['ndaDir:true', 'ndaEnds:true']) && N.rows.length === 2 && N.rows.every(r => r.ok), JSON.stringify(N));
    /* this upload carries no read text, so the grid says the wording was not read for it — never a guess */
    /* RE-POINTED 21 Oct 2026 (owner: no grey line under an owed fact): an unread row is amber instead of saying "not in the wording" */
    check('4b the wording\'s reading is in the box as a suggestion, else the row is amber', N.rows.every(r => /suggested by|read from/.test(r.t) || /is-amb/.test(r.cls)), JSON.stringify(N.rows));
    await page.selectOption('#pd-og [data-pd-og-nda="dir"]', 'mutual');
    await page.click('#pd-og [data-pd-og-ok="ndaDir"]');
    const ed = await until(() => { const c = getContract('MK-0406'); return !!(c.nda && c.nda.dir === 'mutual'); }, null, 6000);
    check('4c Confirm is the facts\' own writer (ndaSet): who keeps it secret is stored', !!ed);
    const paid = await page.evaluate(async () => { const c = getContract('MK-0406'); const was = detailsOf(c).left;
      const ok = await ndaSet(c, { dir: 'mutual', ends: '2031-12-31', forGood: false }); const d = detailsOf(getContract('MK-0406'));
      return { ok, was, now: d.left, ndaOpen: d.items.some(x => x.kind === 'nda' && x.open) }; });
    check('4d confirmed by a person, both are paid', paid.now === paid.was - 1 && !paid.ndaOpen, JSON.stringify(paid));

    /* 5 base pay */
    await openFill('MK-0407');
    const P = await page.evaluate(() => { const c = pdContract(), d = detailsOf(c), it = d.items.find(x => x.key === 'value');
      const r = document.querySelector('#pd-og tr[data-pd-og-row="value"]');
      return { it: it ? it.label + ':' + it.open : null, want: i18t('ov_f_pay') + ':true', row: !!r, label: r ? ((r.querySelector('.pd-og-f b') || {}).textContent || '') : '', door: !!(r && r.querySelector('[data-pd-og-pay]')), box: !!(r && r.querySelector('input[data-kt="value"]')) }; });
    check('5 an employment agreement owes its base pay: counted, its row reads as pay, its door Edit pay, no plain value box', P.it === P.want && P.row && P.want.startsWith(P.label + ':') && P.door && !P.box, JSON.stringify(P));

    /* 6 the three screens */
    await openFill('MK-0405');
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      await page.evaluate(() => pdFillOpen('MK-0405'));
      await page.waitForTimeout(600);
      const S = await page.evaluate(() => { const r = document.querySelector('#pd-og tr.pd-og-row:not(.is-saved)'); const b = r && r.getBoundingClientRect();
        return { inView: !!b && b.top >= 0 && b.bottom <= window.innerHeight, side: document.documentElement.scrollWidth <= window.innerWidth + 1 }; });
      check(`6 ${w}×${ht}: the first owed row in view, nothing sideways`, S.inView && S.side, JSON.stringify(S));
      await shot(page, `owed-first-${w}x${ht}`);
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
