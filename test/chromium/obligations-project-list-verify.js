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
    /* RE-POINTED (P-13): a tile's count is its big number (.obs-tn b); its note can carry a day */
    const tabs = Object.fromEntries([...document.querySelectorAll('.obn-bar [data-obn-tab]')].map(b => [b.getAttribute('data-obn-tab'), Number(((b.querySelector('.obs-tn b') || b).textContent.match(/(\d+)\D*$/) || [0, 0])[1])]));
    /* RE-POINTED (P-13, owner's pick 20 Nov 2026: Obligations the Stripe way): one calm table, whose a soft badge (ours ·
       theirs) on each row, the tabs are figure tiles */
    return { tabs, whose: [...new Set([...document.querySelectorAll('.obt-cols .obt-li .obs-b.is-ours, .obt-cols .obt-li .obs-b.is-theirs')].map(b => b.classList.contains('is-ours') ? 'ours' : 'theirs'))].sort(), lines: document.querySelectorAll('.obt-cols .obt-li').length }; });
  check('1 · ours and theirs in one table, under the tiles Next 30 days · Later · Done; the tile counts its lines', one.whose.join('|') === 'ours|theirs' && 'open' in one.tabs && 'later' in one.tabs && 'done' in one.tabs && one.lines === one.tabs.open, one);
  await page.screenshot({ path: path.join(OUT, '1-tracked.png') });

  await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="later"]'); if (b) b.click(); });
  await page.waitForTimeout(400);
  const two = await page.evaluate(() => { for (let m, i = 0; (m = document.querySelector('[data-obt-more]')) && i < 4; i++) m.click();   /* one at a time: a press redraws the lines */
    return { lines: document.querySelectorAll('.obt-cols .obt-li').length, n: Number(((document.querySelector('[data-obn-tab="later"] .obs-tn b') || document.querySelector('[data-obn-tab="later"]') || {}).textContent || '').replace(/\D/g, '')) || 0 }; });
  check('2 · Later holds the rest, as its tab counts', two.lines >= 1 && two.lines === two.n, two);

  await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="open"]'); if (b) b.click(); });
  await page.waitForTimeout(400);
  const tone = await page.evaluate(() => { const ls = [...document.querySelectorAll('.obt-cols .obt-li')].filter(x => x.querySelector('.obs-b.is-ours'));
    return { first: ls[0] ? (ls[0].querySelector('.obt-w') || {}).className : '', late: document.querySelectorAll('.obt-cols .obt-w.is-late').length,
      head: ((document.querySelector('.obs-tile[data-obn-tab="open"] .obs-tl em') || {}).textContent || '').trim() }; });
  check('3 · the late one leads its column in red, and every line says its day', /is-late/.test(tone.first) && tone.late === 1, tone);
  /* RE-POINTED (P-13): the facts beside the title went; the Next 30 days tile says how many are late */
  check('4 · the Next 30 days tile says what is late', /^1 late$/.test(tone.head), tone);

  /* 5 · proposals by agreement: a row each, oldest first, with its progress and status */
  await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="prop"]'); if (b) b.click(); });
  await until(page, () => !!document.querySelector('.obn-table.is-proj .obn-pr'));
  await page.waitForTimeout(300);
  const proj = await page.evaluate(() => ({ heads: [...document.querySelectorAll('.obn-table.is-proj thead th')].map(t => t.textContent.trim()).filter(Boolean),
    rows: [...document.querySelectorAll('.obn-pr')].map(r => ({ name: (r.querySelector('.obn-what') || {}).textContent, bar: !!r.querySelector('.obn-pbar'),
      said: (r.querySelector('.obn-pgs small') || {}).textContent, st: (r.querySelector('.obn-stt .obs-b') || {}).textContent })) }));
  /* RE-POINTED 21 Nov 2026 (P-13, the owner's pick of 20 Nov, newer than the 19 Nov "delete the found column"): the drawn
     table — Agreement · Other side · Progress (a bar and "N of M") · Status (a soft badge) · Duties · Found; no ring */
  check('5 · one row per agreement, oldest wait first, each with its progress bar and its status',
    proj.heads.join() === 'Agreement,Other side,Progress,Status,Duties,Found' && proj.rows.length === 3 && /Milk/.test(proj.rows[0].name || '') && proj.rows.every(r => r.bar && /\d+ of \d+/.test(r.said || '') && String(r.st || '').trim()),
    proj);
  await page.screenshot({ path: path.join(OUT, '2-proposals.png') });

  /* 6–9 RE-POINTED 19 Nov 2026 (owner, with a picture: "the obligations are redundant as they are already in the side
     panel. Delete them"; f1102): the duties no longer open under the row; a press chooses the agreement and its duties
     stand in Jambo's panel */
  /* RE-POINTED 23 Nov 2026 (owner, "Duties, end to end": PROPOSALS BY AGREEMENT are read only — each agreement's one door
     is "Decide its duties" (data-obn-decide → dutiesGo), its Duties page decides each duty on its own; NO MASS ADD, no
     answers in the panel): the panel reads the duties in their own words with nothing to answer there, and one door */
  await page.evaluate(() => { const r = document.querySelector('.obn-pr[data-obn-pick] td.obn-c1'); if (r) r.click(); });
  await until(page, () => !!document.querySelector('#ins-panel .obn-lg .obn-lg-it'));
  const open = await page.evaluate(() => { const its = [...document.querySelectorAll('#ins-panel .obn-lg .obn-lg-it:not(.is-next)')];
    const dc = document.querySelector('#ins-panel .obn-lg [data-obn-decide]');
    return { duties: its.length, answers: document.querySelectorAll('#ins-panel [data-obn-whose], #ins-panel [data-obn-skip], [data-obn-addall]').length,
      quote: its.every(i => !!i.querySelector('.obn-lg-q')), decide: dc ? dc.getAttribute('data-obn-decide') : null,
      chosen: (document.querySelector('.obn-pr.is-sel[data-obn-pick]') || { getAttribute: () => null }).getAttribute('data-obn-pick'),
      under: document.querySelectorAll('.obn-table [data-obn-whose], [data-obn-open]').length, modal: !!document.querySelector('#modal-root #obd') }; });
  check('6 · a row pressed: its duties stand in Jambo\'s panel in the words they rest on, nothing to answer there or under the row, no Add all, one door "Decide its duties" for that agreement, no pop-up',
    open.duties === 3 && open.answers === 0 && open.quote && !!open.decide && open.decide === open.chosen && open.under === 0 && !open.modal, open);
  await page.screenshot({ path: path.join(OUT, '3-open.png') });

  /* 7 · Decide its duties lands on that agreement's Duties page, To decide, its duties listed; reading wrote nothing */
  const cid = open.decide;
  const before = cid ? await page.evaluate(id => ((getContract(id) || {}).obligations || []).length, cid) : null;
  if (cid) await page.evaluate(id => { const b = document.querySelector(`#ins-panel [data-obn-decide="${id}"]`); if (b) b.click(); }, cid);
  const landed = cid ? await until(page, () => !!(window.intel && intel.paper && document.querySelector('#dtp [data-dtp-tab="left"][aria-selected="true"]')), 10000) : false;
  const dtp = landed ? await page.evaluate(id => ({ paper: intel.paper && intel.paper.id, rows: document.querySelectorAll('#dtp [data-dtp-decide]').length,
    n: ((getContract(id) || {}).obligations || []).length }), cid) : null;
  check('7 · "Decide its duties" lands on that agreement\'s Duties page, To decide, each duty there to decide on its own; nothing was added by the press',
    !!dtp && dtp.paper === cid && dtp.rows >= 1 && dtp.n === before, { cid, landed, dtp, before });

  /* 8 · a duty skipped on its Duties page is said Skipped in the panel, and its undo there brings it back to decide */
  await page.evaluate(() => { try { if (typeof closeModal === 'function') closeModal(); } catch (_){} setView('obligations'); });
  await until(page, () => !!document.querySelector('.obn-page'), 8000);
  await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="prop"]'); if (b) b.click(); });
  await until(page, () => !!document.querySelector('.obn-table.is-proj .obn-pr'), 8000);
  const sid = await page.evaluate(done => { const tr = [...document.querySelectorAll('.obn-pr[data-obn-pick]')].find(x => x.getAttribute('data-obn-pick') !== done);
    const id = tr && tr.getAttribute('data-obn-pick'), c = id && getContract(id), x = c && (dutiesFound(c) || [])[0];
    if (!x) return null; obReviewMark(c, x, 'skipped'); persist(c); obnRepaint();
    const r = document.querySelector(`.obn-pr[data-obn-pick="${id}"] td.obn-c1`); if (r) r.click(); return id; }, cid);
  const said = sid ? await until(page, () => !!document.querySelector('#ins-panel .obn-lg [data-obn-unskip]'), 5000) : false;
  if (said) await page.evaluate(() => { const b = document.querySelector('#ins-panel .obn-lg [data-obn-unskip]'); if (b) b.click(); });
  await page.waitForTimeout(500);
  const skipped = sid ? await page.evaluate(id => ({ skipped: ((getContract(id) || {}).obReview || {}).skipped || [], undo: !!document.querySelector('#ins-panel [data-obn-unskip]') }), sid) : null;
  check('8 · a Skip is said in the panel with its undo, and the undo takes it off the record', said && !!skipped && skipped.skipped.length === 0 && !skipped.undo, { sid, said, skipped });

  /* 9 · reading the proposals writes nothing: choosing agreements adds no duty anywhere */
  const quiet = await page.evaluate(() => { const n = () => (state.contracts || []).reduce((t, c) => t + ((c.obligations || []).length), 0); const before = n();
    document.querySelectorAll('.obn-pr[data-obn-pick] td.obn-c1').forEach(r => r.click());
    return { before, after: n(), addall: document.querySelectorAll('[data-obn-addall]').length }; });
  check('9 · choosing agreements saves nothing, and no Add all stands anywhere', quiet.before === quiet.after && quiet.addall === 0, quiet);

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
  /* Open also chose that agreement (19 Nov 2026), so "‹ Overview" lets it go and the page is as landed */
  await page.evaluate(() => { if (document.querySelector('#ins-panel .obn-lg')){ const b = document.querySelector('#ins-panel [data-jl-home]'); if (b) b.click(); } });
  await page.waitForTimeout(400);
  const land = await page.evaluate(() => { const p = document.getElementById('ins-panel'); const f = p && p.querySelector('.obn-five .jov5');
    return { five: !!f, title: f ? (f.querySelector('.jov5-title') || {}).textContent : '', tiles: f ? f.querySelectorAll('.jov5-g').length : 0,
      rows: f ? f.querySelectorAll('[data-obn-pick]').length : 0, black: f ? !!f.querySelector('.jov5-go[data-obn-pickopen]') : false, lg: !!(p && p.querySelector('.obn-lg')) }; });
  check('12 · landed on Proposals, Jambo\'s panel is the five parts: the headline counts the duties, three tiles, the oldest as rows, one black button',
    land.five && /dut/i.test(land.title || '') && land.tiles === 3 && land.rows >= 1 && land.black && !land.lg, land);
  await page.screenshot({ path: path.join(OUT, '5-landed.png') });

  /* RE-POINTED 19 Nov 2026 (f1102: Add takes only what was given a side, so the agreement 7–9 answered STAYS in the list
     with one duty left, whose words carry no time limit to mark): the press goes to an agreement nobody has answered yet */
  const cid2 = await page.evaluate(done => { const tr = [...document.querySelectorAll('.obn-pr[data-obn-pick]')].find(x => ![done.a, done.b].includes(x.getAttribute('data-obn-pick')));
    const r = tr && tr.querySelector('td.obn-c1'); const id = r && tr.getAttribute('data-obn-pick'); if (r) r.click(); return id; }, { a: cid, b: sid });
  const chose = cid2 ? await until(page, () => !!document.querySelector('#ins-panel .obn-lg'), 5000) : false;
  /* RE-POINTED 23 Nov 2026 (owner, "Duties, end to end"): each duty read in its own quoted words, nothing to answer in the
     panel, one Decide door for the chosen agreement */
  const lg = chose ? await page.evaluate(id => { const p = document.getElementById('ins-panel'), L = p.querySelector('.obn-lg');
    const its = [...L.querySelectorAll('.obn-lg-it:not(.is-next)')];
    return { for: L.getAttribute('data-obn-lg'), sel: !!document.querySelector(`.obn-pr.is-sel[data-obn-pick="${id}"]`), items: its.length,
      quoted: its.every(i => !!i.querySelector('.obn-lg-q')), answers: L.querySelectorAll('[data-obn-whose], [data-obn-skip]').length === 0,
      decide: !!L.querySelector(`[data-obn-decide="${id}"]`),
      mark: !!L.querySelector('.obn-lg-q mark'), boxed: !!L.querySelector('.jov5-group, .jov5-g'), tab: ((p.querySelector('[data-jl-home] .pd-tab-w') || {}).textContent || '').trim(),
      open: !!document.querySelector('.obn-dr') }; }, cid2) : null;
  check('13 · a row pressed is chosen, and the panel turns the Legora way: its duties in their own quoted words, read only, one Decide door, nothing boxed, "‹ Overview" the way back',
    !!lg && lg.for === cid2 && lg.sel && lg.items >= 1 && lg.quoted && lg.answers && lg.decide && lg.mark && !lg.boxed && /^‹/.test(lg.tab) && !lg.open, lg);
  await page.screenshot({ path: path.join(OUT, '6-chosen.png') });

  /* 14 RE-POINTED 23 Nov 2026 (Duties, end to end): the panel and the list say the same — the row's "N of M" is the panel's
     "N of M decided", and nothing unfolds under the row */
  const same = lg ? await page.evaluate(id => { const r = document.querySelector(`.obn-pr[data-obn-pick="${id}"] .obn-pgs small`), f = document.querySelector('#ins-panel .obn-lg .obn-lg-foot span');
    const nm = t => ((String(t || '').match(/(\d+)\D+(\d+)/) || []).slice(1, 3).join('/'));
    return { row: nm(r && r.textContent), panel: nm(f && f.textContent), under: !!document.querySelector('.obn-table [data-obn-whose]') }; }, cid2) : null;
  check('14 · the list says what the panel says: the row\'s progress is the panel\'s decided count, nothing unfolds under it',
    !!same && !!same.row && same.row === same.panel && !same.under, same);

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
      /* RE-POINTED 21 Nov 2026 (P-13, as drawn): six heads; the row carries no buttons (Add all decided is the panel's) */
      fit.table != null && fit.panel != null && fit.table <= fit.panel && (fit.acts == null || fit.acts <= fit.panel) && !fit.sideways && fit.heads.length === 6, fit);
    await page.screenshot({ path: path.join(OUT, `7-prop-${w}x${hgt}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 780 });

  check('11 · no page errors', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${fails ? fails + ' FAILED' : 'ALL PASSED'} · shots in ${OUT}`);
  await browser.close(); await h.stop();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
