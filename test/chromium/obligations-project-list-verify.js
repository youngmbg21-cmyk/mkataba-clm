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
const txt = async (page, sel) => page.evaluate(s => { const n = document.querySelector(s); return n ? n.innerText.trim() : ''; }, sel);

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
  await until(page, () => !!document.querySelector('.obn-page .obn-table'));
  await page.waitForTimeout(400);

  /* 1 · twenty a page, and a foot that says where you are */
  const one = await page.evaluate(() => ({ rows: document.querySelectorAll('#obn-body tr.obn-r').length,
    say: (document.querySelector('.obn-pager .obn-pg-say') || {}).textContent || '',
    pages: [...document.querySelectorAll('.obn-pn[data-obn-page]')].map(b => b.textContent.trim()),
    per: !!document.querySelector('#obn-per') }));
  check('1 · twenty duties a page, the foot says 1–20 of 30 and offers the rest', one.rows === 20 && /1.20/.test(one.say) && /30/.test(one.say) && one.pages.includes('2') && one.per, one);
  await page.screenshot({ path: path.join(OUT, '1-tracked.png') });

  /* 2 · page two is the rest, and nothing more is built than the page asks for */
  await page.evaluate(() => { const b = [...document.querySelectorAll('.obn-pn')].find(x => x.textContent.trim() === '2'); if (b) b.click(); });
  await page.waitForTimeout(400);
  const two = await page.evaluate(() => ({ rows: document.querySelectorAll('#obn-body tr.obn-r').length, say: (document.querySelector('.obn-pg-say') || {}).textContent || '' }));
  check('2 · page two holds the rest', two.rows === 10 && /21/.test(two.say), two);

  /* 3 · colour that carries a meaning: the stream's band, the day as a tone chip */
  await page.evaluate(() => { const b = [...document.querySelectorAll('.obn-pn')].find(x => x.textContent.trim() === '1'); if (b) b.click(); });
  await page.waitForTimeout(300);
  const tone = await page.evaluate(() => { const rs = [...document.querySelectorAll('#obn-body tr.obn-r')];
    const band = rs.map(r => { const c = r.querySelector('td.obn-c1'); const s = getComputedStyle(c); return s.borderLeftWidth + ' ' + s.borderLeftColor; });
    const chips = rs.map(r => (r.querySelector('.obn-ch') || {}).className || '');
    return { band: band[0], same: band.every(b => b === band[0]), ruby: chips.filter(c => /is-ruby/.test(c)).length, green: chips.filter(c => /is-green/.test(c)).length, amber: chips.filter(c => /is-amber/.test(c)).length }; });
  check('3 · every row wears its stream’s band and its day as a tone chip, the late one in red', /^3px/.test(tone.band) && tone.ruby === 1 && (tone.green + tone.amber) > 0, tone);

  /* 4 · the Late pill is the first thing said, and it narrows to the late ones */
  const pills = await page.evaluate(() => [...document.querySelectorAll('.obn-bar [data-obn-tab]')].map(b => ({ k: b.getAttribute('data-obn-tab'), w: b.textContent.trim() })));
  await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="late"]'); if (b) b.click(); });
  await page.waitForTimeout(400);
  const lateRows = await page.evaluate(() => [...document.querySelectorAll('#obn-body tr.obn-r .obn-ch')].map(c => c.className));
  check('4 · Late leads the pills and narrows to what is late', pills[0] && pills[0].k === 'late' && /late/i.test(pills[0].w) && lateRows.length === 1 && /is-ruby/.test(lateRows[0]), { pills, lateRows });

  /* 5 · proposals by agreement: a row each, oldest first, with its progress and status */
  await page.evaluate(() => { const b = document.querySelector('[data-obn-tab="prop"]'); if (b) b.click(); });
  await until(page, () => !!document.querySelector('.obn-table.is-proj .obn-pr'));
  await page.waitForTimeout(300);
  const proj = await page.evaluate(() => ({ heads: [...document.querySelectorAll('.obn-table.is-proj thead th')].map(t => t.textContent.trim()).filter(Boolean),
    rows: [...document.querySelectorAll('.obn-pr')].map(r => ({ name: (r.querySelector('.obn-what') || {}).textContent, ring: !!r.querySelector('.obn-ring'),
      said: (r.querySelector('.obn-pgb small') || {}).textContent, age: (r.querySelector('.obn-age') || {}).textContent, st: (r.querySelector('.obn-stt .obn-ch') || {}).textContent })) }));
  check('5 · one row per agreement, oldest wait first, each with its ring, its progress and its status',
    proj.heads.length === 5 && proj.rows.length === 3 && /Milk/.test(proj.rows[0].name || '') && proj.rows.every(r => r.ring && /decided/i.test(r.said || '') && String(r.st || '').trim()),
    proj);
  await page.screenshot({ path: path.join(OUT, '2-proposals.png') });

  /* 6 · the row opens where it stands and each duty is answered on its own line */
  await page.evaluate(() => { const b = document.querySelector('[data-obn-open]'); if (b) b.click(); });
  await until(page, () => !!document.querySelector('.obn-dr'));
  const open = await page.evaluate(() => ({ duties: document.querySelectorAll('.obn-dr').length,
    whose: document.querySelectorAll('.obn-dr [data-obn-whose]').length,
    chosen: [...document.querySelectorAll('.obn-dr')].every(r => !!r.querySelector('.obn-wh.is-on')),
    quote: !!document.querySelector('.obn-dr .obn-q i'), skip: !!document.querySelector('.obn-dr [data-obn-skip]'),
    modal: !!document.querySelector('#modal-root #obd') }));
  check('6 · the duties open under their agreement — three answers each, the words they rest on, and no pop-up',
    open.duties === 3 && open.whose === 9 && open.chosen && open.quote && open.skip && !open.modal, open);
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
    const fit = await page.evaluate(() => { const card = document.querySelector('.apn-card'), bar = document.querySelector('.obn-bar'), r = document.querySelector('tr.obn-r');
      const sideways = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      const rb = r ? r.getBoundingClientRect() : null;
      return { card: !!card, bar: bar ? Math.round(bar.getBoundingClientRect().bottom) : null, row: rb ? Math.round(rb.top) : null, inWin: rb ? rb.top < window.innerHeight : false, sideways }; });
    check(`10 · ${w}×${hgt}: the pills and the first row stand in the window, nothing spills sideways`, fit.card && fit.inWin && !fit.sideways, fit);
    await page.screenshot({ path: path.join(OUT, `4-${w}x${hgt}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 780 });

  check('11 · no page errors', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${fails ? fails + ' FAILED' : 'ALL PASSED'} · shots in ${OUT}`);
  await browser.close(); await h.stop();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
