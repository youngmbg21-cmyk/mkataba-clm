/* THE OBLIGATIONS PAGE AS A PROJECT LIST (owner picked "The SAP Way, the project list", 10 Nov 2026)
   ============================================================
   The owner's three complaints about the page as it stood: it was slow because the whole book was
   drawn at once, it was dull, and the Proposed tab's shape was confusing. The picked drawing answers
   all three: TWENTY A PAGE with a foot that says where you are, COLOUR THAT CARRIES A MEANING (the
   stream's own band down each row, the day as a tone chip, a status), and PROPOSALS BY AGREEMENT —
   one row per agreement with a progress ring, opening where it stands so each duty is answered on
   its own line and the whole agreement added in one press.

   Measured in a real browser because every claim is about what is drawn and what a press does.
   At the parent every check here fails: the page had five tabs, no paging, no bands, no chips, and
   its proposals opened a pop-up desk for one contract at a time.
   Run: node test/chromium/obligations-project-list-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'obligations-project-list');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more !== undefined ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, ms = 15000) => { try { await page.waitForFunction(fn, null, { timeout: ms }); return true; } catch (_) { return false; } };
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };


/* a book big enough to page: 30 duties on one contract, three agreements of Jambo's finds, one late */
function world(){
  const cs = [];
  const big = fixtureContract('MK-PG', 'Supply of Packaging', 'Kenpoly', 'proc', 4200000, 'Signed');
  big.obligations = [{ id: 'ob_late', desc: 'Send the late stock report', due: day(-9), status: 'open', party: 'ours', recurring: 'none' }];
  for (let i = 0; i < 29; i++) big.obligations.push({ id: 'ob_' + i, desc: 'Monthly volume statement ' + (i + 1), due: day(20 + i), status: 'open', party: i % 4 === 0 ? 'theirs' : 'ours', recurring: 'none' });
  cs.push(big);
  const kinds = [['Give 30 days’ notice to terminate', 'unless earlier terminated by either Party giving thirty (30) days’ notice', 'event', ''],
    ['Agreement stays in force until 30 November 2026', 'These Terms remain valid until 30 November 2026', 'dated', day(60)],
    ['All other terms remain in force', 'the Agreement remain in full force and effect.', 'standing', '']];
  [['MK-F1', 'Milk Collection', 'Nandi Dairy', 3, 11], ['MK-F2', 'Warehouse Services', 'Juno Logistics', 5, 4], ['MK-F3', 'Brand Campaign', 'Pixel Agency', 2, 0]]
    .forEach(([id, name, party, n, age]) => {
      const c = fixtureContract(id, name, party, 'dist', 2500000, 'Signed');
      const found = [];
      for (let k = 0; k < n; k++){ const d = kinds[k % kinds.length];
        found.push({ desc: d[0] + (k >= kinds.length ? ' (' + (k + 1) + ')' : ''), quote: d[1], clause: '6', kind: d[2], due: d[3], party: 'us' }); }
      c.triage = { at: new Date(Date.now() - age * 864e5).toISOString(), steps: { oblig: { ok: true, found } }, seenAt: null };
      cs.push(c);
    });
  return cs;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { contracts: world() });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-PG'), 40000);
  await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); setView('obligations'); });
  await until(page, () => !!document.querySelector('.obn-page .obn-table, .obt-page .obt-cols'));
  await page.waitForTimeout(400);

  /* 1–4 RE-POINTED 19 Nov 2026 (We owe · They owe, the owner's pick "Build as drawn"; replaces Late · Tracked and twenty a
     page): the tabs Next 30 days · Later · Done; two columns; late first; each line's day a toned word */
  await until(page, () => !!document.querySelector('.obt-cols .obt-li'), 8000);
  const one = await page.evaluate(() => { for (let m, i = 0; (m = document.querySelector('[data-obt-more]')) && i < 4; i++) m.click();   /* one at a time: a press redraws the lines */
    const tabs = Object.fromEntries([...document.querySelectorAll('.obn-bar [data-obn-tab]')].map(b => [b.getAttribute('data-obn-tab'), Number((b.textContent.match(/\d+/) || [0])[0])]));
    return { tabs, cols: [...document.querySelectorAll('.obt-colh b')].map(b => b.textContent.trim()), lines: document.querySelectorAll('.obt-cols .obt-li').length }; });
  check('1 · We owe and They owe, under the tabs Next 30 days · Later · Done; the tab counts its lines', one.cols.join('|') === 'We owe|They owe' && 'open' in one.tabs && 'later' in one.tabs && 'done' in one.tabs && one.lines === one.tabs.open, one);
  await page.screenshot({ path: path.join(OUT, '1-tracked.png') });

  await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="later"]'); if (b) b.click(); });
  await page.waitForTimeout(400);
  const two = await page.evaluate(() => { for (let m, i = 0; (m = document.querySelector('[data-obt-more]')) && i < 4; i++) m.click();   /* one at a time: a press redraws the lines */
    return { lines: document.querySelectorAll('.obt-cols .obt-li').length, n: Number(((document.querySelector('[data-obn-tab="later"]') || {}).textContent || '').replace(/\D/g, '')) || 0 }; });
  check('2 · Later holds the rest, as its tab counts', two.lines >= 1 && two.lines === two.n, two);

  await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="open"]'); if (b) b.click(); });
  await page.waitForTimeout(400);
  const tone = await page.evaluate(() => { const ls = [...document.querySelectorAll('.obt-col[data-obt-side="ours"] .obt-li')];
    return { first: ls[0] ? (ls[0].querySelector('.obt-w') || {}).className : '', late: document.querySelectorAll('.obt-cols .obt-w.is-late').length,
      head: ((document.getElementById('page-head-facts') || {}).textContent || '').trim() }; });
  check('3 · the late one leads its column in red, and every line says its day', /is-late/.test(tone.first) && tone.late === 1, tone);
  check('4 · the head says what of ours is late', /1 of ours late/.test(tone.head), tone);

  /* 5 · proposals by agreement: a row each, oldest first, with its progress and status */
  await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="prop"]'); if (b) b.click(); });
  await until(page, () => !!document.querySelector('.obn-table.is-proj .obn-pr'));
  await page.waitForTimeout(300);
  const proj = await page.evaluate(() => ({ heads: [...document.querySelectorAll('.obn-table.is-proj thead th')].map(t => t.textContent.trim()).filter(Boolean),
    rows: [...document.querySelectorAll('.obn-pr')].map(r => ({ name: (r.querySelector('.obn-what') || {}).textContent, ring: !!r.querySelector('.obn-ring'),
      said: (r.querySelector('.obn-pgb small') || {}).textContent, age: (r.querySelector('.obn-age') || {}).textContent, st: (r.querySelector('.obn-stt .obn-ch') || {}).textContent })) }));
  check('5 · one row per agreement, oldest wait first, each with its ring, its progress and its status',
    /* RE-POINTED 19 Nov 2026: four heads — the owner had Found taken off ("delete the found column"); age is said in Jambo's panel */
    proj.heads.length === 4 && !proj.heads.includes('Found') && proj.rows.length === 3 && /Milk/.test(proj.rows[0].name || '') && proj.rows.every(r => r.ring && /decided/i.test(r.said || '') && String(r.st || '').trim()),
    proj);
  await page.screenshot({ path: path.join(OUT, '2-proposals.png') });

  /* 6 · the row opens where it stands and each duty is answered on its own line */
  await page.evaluate(() => { const b = document.querySelector('[data-obn-open]'); if (b) b.click(); });
  await until(page, () => !!document.querySelector('.obn-dr'));
  const open = await page.evaluate(() => ({ duties: document.querySelectorAll('.obn-dr').length,
    whose: document.querySelectorAll('.obn-dr [data-obn-whose]').length,
    chosen: [...document.querySelectorAll('.obn-dr')].every(r => !!r.querySelector('.obn-wh.is-on')),
    quote: !!document.querySelector('.obn-dr .obn-q i'), skip: !!document.querySelector('.obn-dr [data-obn-skip]'),
    modal: !!document.querySelector('#modal-root #obd'), lg: !!document.querySelector('#ins-panel .obn-lg .obn-lg-it') }));
  check('6 · the duties open under their agreement — three answers each, the words they rest on, no pop-up, and Jambo\'s panel turns to it the Legora way',
    open.duties === 3 && open.whose === 9 && open.chosen && open.quote && open.skip && !open.modal && open.lg, open);
  await page.screenshot({ path: path.join(OUT, '3-open.png') });

  /* 7 · the chips decide whose job it is, and Add all adds them that way */
  const cid = await page.evaluate(() => { const b = [...document.querySelectorAll('.obn-dr [data-obn-whose="them"]')][0]; const id = b && b.getAttribute('data-cid'); if (b) b.click(); return id; });
  await page.waitForTimeout(300);
  await page.evaluate(id => { const b = document.querySelector(`[data-obn-addall="${id}"]`); if (b) b.click(); }, cid);
  await page.waitForTimeout(900);
  const added = await page.evaluate(id => { const c = getContract(id); return { n: (c.obligations || []).length, parties: (c.obligations || []).map(o => o.party),
    left: obReviewWaiting(c).length, rows: document.querySelectorAll('.obn-pr').length }; }, cid);
  check('7 · Add all adds every undecided duty the way the chips say, and the agreement leaves the list',
    added.n === 3 && added.parties.filter(p => p === 'theirs').length === 1 && added.left === 0 && added.rows === 2, added);

  /* 8 · a Skip is kept as the desk keeps it, and can be undone */
  await page.evaluate(() => { const b = document.querySelector('[data-obn-open]'); if (b) b.click(); });
  await until(page, () => !!document.querySelector('.obn-dr'));
  const sid = await page.evaluate(() => { const b = document.querySelector('[data-obn-skip]'); const id = b && b.getAttribute('data-cid'); if (b) b.click(); return id; });
  await page.waitForTimeout(700);
  const skipped = await page.evaluate(id => ({ skipped: ((getContract(id) || {}).obReview || {}).skipped || [], undo: !!document.querySelector('[data-obn-unskip]') }), sid);
  check('8 · a Skip is kept on the record and offers its undo', skipped.skipped.length === 1 && skipped.undo, skipped);

  /* 9 · nothing is saved until Add all: the chips alone write no obligation */
  const quiet = await page.evaluate(id => { const c = getContract(id); const before = (c.obligations || []).length;
    const b = [...document.querySelectorAll(`.obn-dr [data-obn-whose="them"]`)][0]; if (b) b.click();
    return { before, after: ((getContract(id) || {}).obligations || []).length }; }, sid);
  check('9 · pressing an answer saves nothing until Add all is pressed', quiet.before === quiet.after, quiet);

  /* 10 · the three screens: the head, the first row and the foot all stand inside the window */
  for (const [w, hgt] of [[1440, 780], [1536, 730], [1366, 950]]){
    await page.setViewportSize({ width: w, height: hgt });
    await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="open"]'); if (b) b.click(); });
    await page.waitForTimeout(400);
    const fit = await page.evaluate(() => { const card = document.querySelector('.apn-card'), bar = document.querySelector('.obn-bar'), r = document.querySelector('.obt-li');
      const sideways = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      const rb = r ? r.getBoundingClientRect() : null;
      return { card: !!card, bar: bar ? Math.round(bar.getBoundingClientRect().bottom) : null, row: rb ? Math.round(rb.top) : null, inWin: rb ? rb.top < window.innerHeight : false, sideways }; });
    check(`10 · ${w}×${hgt}: the pills and the first row stand in the window, nothing spills sideways`, fit.card && fit.inWin && !fit.sideways, fit);
    await page.screenshot({ path: path.join(OUT, `4-${w}x${hgt}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 780 });

  /* 12–16 · PROPOSALS' PANEL AND FIT (owner, 19 Nov 2026: "when you land on the page it should be five parts. When you
     press a row it should be legora way … the page seems to extend behind the panel so delete the found column and
     find ways to make the page fit without hiding"). At the parent: the panel was four counted lines and a sentence
     about loading, a row press did nothing, and at 1366 the table ran 160px under the panel. Every driven half is
     guarded, so a missing part reports FAIL rather than timing out. */
  await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="prop"]'); if (b) b.click(); });
  await until(page, () => !!document.querySelector('.obn-table.is-proj .obn-pr'), 8000);
  /* the row step 8 opened is shut again, so 14 sees a second press open it */
  await page.evaluate(() => { const b = document.querySelector('.obn-pill.is-on[data-obn-open]'); if (b) b.click(); });
  /* Open also chose that agreement (19 Nov 2026), so "‹ Overview" lets it go and the page is as landed */
  await page.evaluate(() => { if (document.querySelector('#ins-panel .obn-lg')){ const b = document.querySelector('#ins-panel [data-jl-home]'); if (b) b.click(); } });
  await page.waitForTimeout(400);
  const land = await page.evaluate(() => { const p = document.getElementById('ins-panel'); const f = p && p.querySelector('.obn-five .jov5');
    return { five: !!f, title: f ? (f.querySelector('.jov5-title') || {}).textContent : '', tiles: f ? f.querySelectorAll('.jov5-g').length : 0,
      rows: f ? f.querySelectorAll('[data-obn-pick]').length : 0, black: f ? !!f.querySelector('.jov5-go[data-obn-pickopen]') : false, lg: !!(p && p.querySelector('.obn-lg')) }; });
  check('12 · landed on Proposals, Jambo\'s panel is the five parts: the headline counts the duties, three tiles, the oldest as rows, one black button',
    land.five && /dut/i.test(land.title || '') && land.tiles === 3 && land.rows >= 1 && land.black && !land.lg, land);
  await page.screenshot({ path: path.join(OUT, '5-landed.png') });

  const cid2 = await page.evaluate(() => { const r = document.querySelector('.obn-pr[data-obn-pick] td.obn-c1'); const id = r && r.closest('tr').getAttribute('data-obn-pick'); if (r) r.click(); return id; });
  const chose = cid2 ? await until(page, () => !!document.querySelector('#ins-panel .obn-lg'), 5000) : false;
  const lg = chose ? await page.evaluate(id => { const p = document.getElementById('ins-panel'), L = p.querySelector('.obn-lg');
    const its = [...L.querySelectorAll('.obn-lg-it:not(.is-next)')];
    return { for: L.getAttribute('data-obn-lg'), sel: !!document.querySelector(`.obn-pr.is-sel[data-obn-pick="${id}"]`), items: its.length,
      quoted: its.every(i => !!i.querySelector('.obn-lg-q')), answers: its.every(i => i.querySelectorAll('[data-obn-whose]').length === 3 && !!i.querySelector('[data-obn-skip]')),
      mark: !!L.querySelector('.obn-lg-q mark'), boxed: !!L.querySelector('.jov5-group, .jov5-g'), tab: ((p.querySelector('[data-jl-home] .pd-tab-w') || {}).textContent || '').trim(),
      open: !!document.querySelector('.obn-dr') }; }, cid2) : null;
  check('13 · a row pressed is chosen, and the panel turns the Legora way: its duties in their own quoted words, each answered in its row, nothing boxed, "‹ Overview" the way back',
    !!lg && lg.for === cid2 && lg.sel && lg.items >= 1 && lg.quoted && lg.answers && lg.mark && !lg.boxed && /^\u2039/.test(lg.tab) && !lg.open, lg);
  await page.screenshot({ path: path.join(OUT, '6-chosen.png') });

  /* 14 · an answer in the panel is the list's own answer: the row pressed again opens its duties, lit the same way */
  if (lg) await page.evaluate(() => { const b = document.querySelector('#ins-panel .obn-lg [data-obn-whose="them"]'); if (b) b.click(); });
  await page.waitForTimeout(300);
  if (lg) await page.evaluate(id => { const r = document.querySelector(`.obn-pr[data-obn-pick="${id}"] td.obn-c1`); if (r) r.click(); }, cid2);
  const same = lg ? await until(page, () => !!document.querySelector('.obn-dr'), 5000) && await page.evaluate(() => {
    const li = document.querySelector('.obn-dr .obn-wh.is-on'), pa = document.querySelector('#ins-panel .obn-lg .obn-lg-w.is-on');
    return { list: li && li.getAttribute('data-obn-whose'), panel: pa && pa.getAttribute('data-obn-whose') }; }) : null;
  check('14 · answered in the panel, the list says the same; the chosen row pressed again opens its duties',
    !!same && same.list === 'them' && same.panel === 'them', same);

  /* 15 · "‹ Overview" lets the row go and the five parts come back */
  await page.evaluate(() => { const b = document.querySelector('#ins-panel [data-jl-home]'); if (b) b.click(); });
  const back = await until(page, () => !!document.querySelector('#ins-panel .obn-five .jov5') && !document.querySelector('.obn-pr.is-sel'), 5000);
  check('15 · "‹ Overview" lets the row go, and the five parts return', back);

  /* 16 · the three screens: Proposals stands beside the panel, nothing under it, nothing sideways, no column hidden */
  for (const [w, hgt] of [[1440, 780], [1536, 730], [1366, 950]]){
    await page.setViewportSize({ width: w, height: hgt });
    await page.waitForTimeout(600);
    const fit = await page.evaluate(() => { const t = document.querySelector('.obn-table.is-proj'), list = document.getElementById('obn-list'), p = document.getElementById('ins-panel');
      const acts = [...document.querySelectorAll('.obn-pr td.obn-act')].map(td => Math.round(td.getBoundingClientRect().right));
      return { table: t ? Math.round(t.getBoundingClientRect().right) : null, panel: p ? Math.round(p.getBoundingClientRect().left) : null,
        acts: acts.length ? Math.max(...acts) : null, sideways: list ? list.scrollWidth > list.clientWidth + 1 : true,
        heads: t ? [...t.querySelectorAll('thead th')].map(x => x.textContent.trim()).filter(Boolean) : [] }; });
    check(`16 · ${w}×${hgt}: Proposals ends before Jambo's panel begins, its buttons in sight, nothing sideways, four heads`,
      fit.table != null && fit.panel != null && fit.table <= fit.panel && fit.acts <= fit.panel && !fit.sideways && fit.heads.length === 4, fit);
    await page.screenshot({ path: path.join(OUT, `7-prop-${w}x${hgt}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 780 });

  check('11 · no page errors', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${fails ? fails + ' FAILED' : 'ALL PASSED'} · shots in ${OUT}`);
  await browser.close(); await h.stop();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
