/* THE DOSSIER'S ROWS ARE ONE GRID, AND EVERY BUTTON ONE SIZE (owner, 29 Oct 2026: "all the buttons always have to be
   the same size … the smaller font words ruin the whole format of the panel"; drawing XmhHqN2tRyY8EATL4iK9Jj;
   docs/MAP-HISTORY.md "THE DOSSIER'S ROWS, ONE GRID"). On a contract with changes of ours not sent and a note of
   mine overdue (the owner's MK-382):
     1 · every press in the last column is the same width, in English and in Swedish, the word whole
     2 · the rows "4 changes not sent." and "1 note was due …" are rows like the rest: a name in the first column
         ("Changes", "Your note"), what it says in the second, one button
     3 · every row's words are one size: the name, the value and no smaller second line
     4 · the three columns line up: every name starts at one edge, every value at one edge, every button at one edge
     5 · the three screens: nothing spills out of the panel; pictures saved
   Run: node test/chromium/dossier-rows-verify.js   (pictures: DOSSIER_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.DOSSIER_SHOTS || path.join(__dirname, 'shots', 'dossier-rows');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const BODY = 'WAREHOUSING AND TRANSPORTATION SERVICES AGREEMENT\n\nThis Agreement is made between Highland Corporate Ltd and AIT Worldwide Logistics Norway AS.\n\n1. Services\nThe Provider shall store and move the Goods as the Customer asks in writing.\n\n2. Fees\nThe Customer shall pay the fees within thirty days of each invoice.\n\n3. Liability\nThe Provider is liable for loss of the Goods while in its care.\n\n4. Term\nThis Agreement runs for two years from signature.\n\n5. Termination\nEither party may end this Agreement on ninety days\' written notice.';

/* the Dossier's rows as they stand: every press in the last column, its row, the row's name and value, their boxes and
   font sizes. A row is whatever holds the press: a grid line (.pd-ck-hd), Jambo read's and the owed rows (.ds-rr), the
   Obligations line, or a row of some other shape — which is then reported by its words */
const ROWS = () => {
  const dock = document.querySelector('#ig-dock'), host = dock && dock.querySelector('.pd-dossier'); if (!host) return { rows: [], dock: null };
  const fs_ = el => el ? parseFloat(getComputedStyle(el).fontSize) : null;
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), t: Math.round(r.top), h: Math.round(r.height) }; };
  const out = [];
  host.querySelectorAll('.ds-go, .pd-ck-chev.is-word, .pd-nd-row > .ui-btn, .pd-gl-row > .ui-btn').forEach(b => {
    if (!b.getClientRects().length || b.closest('.ds-acts') || b.closest('.ds-sp-st') || b.closest('.pd-gl-h')) return;
    const row = b.closest('button.pd-ck-hd, .ds-rr, .ds-ob-line, .pd-gl-row') || b.parentElement;
    const nm = row.querySelector(':scope > .ds-nm, :scope > b'), v = row.querySelector(':scope > .ds-val, :scope > .pd-ck-v, :scope > .ds-this-v');
    const small = [...row.querySelectorAll('small')].filter(x => x.getClientRects().length && (x.textContent || '').trim()).map(x => (x.textContent || '').trim());
    out.push({ kind: row.getAttribute('data-pd-nd-kind') || row.getAttribute('data-pd-gl') || row.getAttribute('data-pd-ds') || '', name: nm ? nm.textContent.replace(/\s+/g, ' ').trim() : '', val: v ? v.textContent.replace(/\s+/g, ' ').trim() : '',
      btn: (b.textContent || '').trim(), words: (row.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      nb: box(nm), vb: box(v), bb: box(b), nf: fs_(nm), vf: fs_(v), small, bw: b.scrollWidth <= b.clientWidth + 1 });
  });
  return { rows: out, dock: box(dock) };
};
/* the rows of every stage of the Dossier's spine: a stage is a press, and its rows come under it */
const ALL_STAGES = async page => {
  const stages = await page.evaluate(() => [...document.querySelectorAll('#pd-glance button.ds-ln-st[data-ds-focus]')].map(b => b.getAttribute('data-ds-focus')));
  const rows = [], seen = new Set();
  for (const k of stages){
    await page.click(`#pd-glance button.ds-ln-st[data-ds-focus="${k}"]`).catch(() => {});
    await page.waitForTimeout(250);
    const R = await page.evaluate(ROWS);
    R.rows.forEach(r => { const key = r.words + '|' + r.btn; if (!seen.has(key)){ seen.add(key); rows.push(Object.assign({ stage: k }, r)); } });
  }
  return { stages, rows, dock: (await page.evaluate(ROWS)).dock };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const c = fixtureContract('MK-382', 'Warehousing and Transportation Services', 'AIT Worldwide Logistics Norway AS', 'proc', 2500000, 'Under Review', BODY);
  await seedWorkspace(h, { contracts: [c] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    const errors = []; page.on('pageerror', e => errors.push(String(e && e.message || e)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length >= 1 && typeof window.openWorkspace === 'function', null, 40000);
    await page.waitForTimeout(800);
    /* changes of ours, not sent; a note of mine due on it yesterday */
    await page.evaluate(async () => { const c = getContract('MK-382'); await ensureFull(c);
      for (const cl of negoClauseList(c).slice(1, 5)){ const now = negoClauseNowById(c, cl.clauseId); const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || cl.text || '') + '</p>';
        await negoEditClause(c, cl.clauseId, body.replace(/<\/p>(?![\s\S]*<\/p>)/, ' Both parties shall keep a copy.</p>'), { side: 'owner' }); }
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      await mineSave('note', { title: 'Check the insurance broker', body: 'Check the insurance broker before we sign.', contractId: 'MK-382', reviewBy: y }); });
    await page.evaluate(() => openWorkspace('MK-382'));
    const up = await until(page, () => !!document.querySelector('#ig-dock .pd-dossier [data-pd-gl="share"]') && !!document.querySelector('#ig-dock .pd-dossier [data-pd-nd-kind="mynote"]'), null, 20000);
    check('0 the Dossier stands with changes not sent and the note', up);
    await page.waitForTimeout(600);
    let R = await ALL_STAGES(page);
    const widths = [...new Set(R.rows.filter(r => r.bb).map(r => r.bb.w))];
    check('1 every press in the last column is one width, its word whole', R.rows.length >= 6 && widths.length === 1 && R.rows.every(r => r.bw), { widths, rows: R.rows.map(r => `${r.name}: ${r.btn} ${r.bb && r.bb.w}`) });
    const shapeless = R.rows.filter(r => !r.name || !r.nb || !r.vb).map(r => r.stage + ': ' + r.words);
    check('1′ every row is three columns: a name, what it says, the press', !shapeless.length, shapeless);
    const ch = R.rows.find(r => r.kind === 'share'), nt = R.rows.find(r => r.kind === 'mynote');
    check('2a "4 changes not sent." is a row: Changes · 4 not sent · Send', !!ch && ch.name === 'Changes' && ch.val === '4 not sent' && ch.btn === 'Send', ch);
    check('2b the note is a row: Your note · Due …, late · Open', !!nt && nt.name === 'Your note' && /^Due .+, late$/.test(nt.val) && nt.btn === 'Open', nt);
    const amber = await page.evaluate(() => { const v = document.querySelector('#ig-dock [data-pd-nd-kind="mynote"] .ds-val'); return v ? getComputedStyle(v).color : ''; });
    check('2c a note that is late says so in amber, as "1 needed" does', amber === 'rgb(138, 90, 10)', amber);
    const nsz = [...new Set(R.rows.map(r => r.nf).filter(Boolean))], vsz = [...new Set(R.rows.map(r => r.vf).filter(Boolean))];
    check('3 every row\'s words are one size — every name alike, every value alike — with no smaller second line', nsz.length === 1 && vsz.length === 1 && R.rows.every(r => !r.small.length), { nsz, vsz, small: R.rows.filter(r => r.small.length).map(r => r.name + ': ' + r.small.join(' | ')) });
    const edge = k => [...new Set(R.rows.filter(r => r[k]).map(r => r[k].l))];
    const bEdge = [...new Set(R.rows.filter(r => r.bb).map(r => r.bb.r))];
    check('4 the three columns line up: one edge for the names, one for the values, one for the buttons', edge('nb').length === 1 && edge('vb').length === 1 && bEdge.length === 1, { names: edge('nb'), values: edge('vb'), buttons: bEdge, rows: R.rows.map(r => `${r.stage} ${r.name} ${r.nb && r.nb.l}/${r.vb && r.vb.l}/${r.bb && r.bb.r}`) });
    await page.screenshot({ path: path.join(OUT, '1-1440x780.png') });

    /* Swedish: the widest word in either book sets the one width */
    await page.evaluate(() => { langSet('sv'); });
    await page.waitForTimeout(800);
    await page.evaluate(() => openWorkspace('MK-382'));
    await until(page, () => !!document.querySelector('#ig-dock .pd-dossier [data-ds-row]'), null, 15000);
    await page.waitForTimeout(500);
    const RS = await ALL_STAGES(page);
    const wsv = [...new Set(RS.rows.filter(r => r.bb).map(r => r.bb.w))];
    check('1″ in Swedish too, one width, the same as in English, every word whole', RS.rows.some(r => r.btn === 'Öppna') && wsv.length === 1 && wsv[0] === widths[0] && RS.rows.every(r => r.bw), { wsv, rows: RS.rows.map(r => `${r.btn} ${r.bb && r.bb.w}`) });
    await page.screenshot({ path: path.join(OUT, '1-sv.png') });
    await page.evaluate(() => { langSet('en'); });
    await page.waitForTimeout(600);

    for (const [w, hh] of SCREENS){
      await page.setViewportSize({ width: w, height: hh });
      await page.evaluate(() => openWorkspace('MK-382'));
      await until(page, () => !!document.querySelector('#ig-dock .pd-dossier [data-ds-row]'), null, 15000);
      await page.waitForTimeout(500);
      R = await ALL_STAGES(page);
      const spill = R.rows.filter(r => [r.nb, r.vb, r.bb].some(b => b && (b.r > R.dock.r + 1 || b.l < R.dock.l - 1))).map(r => r.name);
      const ws = [...new Set(R.rows.filter(r => r.bb).map(r => r.bb.w))];
      check(`5 ${w}×${hh}: one button width, nothing spills out of the panel`, ws.length === 1 && !spill.length, { ws, spill });
      await page.screenshot({ path: path.join(OUT, `5-${w}x${hh}.png`) });
    }
    check('no page errors', !errors.length, errors.slice(0, 3));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
