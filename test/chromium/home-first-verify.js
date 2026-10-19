/* ============================================================
   HOME FIRST (Young, 8 Oct 2026: "Yes to all decisions, build them")
   ============================================================
   The work stays on Home. Driven where the reader looks:
     1  an answer that names contracts leads with Read them on Paper, then
        Show on the Board; the Contracts page and Export are small links last
     2  Read them on Paper walks the set: "1 of 3", Next moves to the second
     3  the Paper's desk: Facts · Obligations · Signing · History · Deal, each
        drawn from the contract's own readings; Signing's Send stays grey
        while the list holds anything
     4  a reference in an answer opens that contract on Paper
     5  Review on Late promises opens that contract on Paper at Obligations,
        with the chase there
     6  where Copilot wrote the answer, the answer comes first and what the map
        did rides the hover ("How this was drawn")
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'home-first');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const day = n => iso(n).slice(0, 10);
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const owner = { id: me.id, name: me.name };
    const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    await put(Object.assign(fixtureContract('MK-HF1', 'Master Supply Agreement', 'Nordvane AB', FOLDER_A, 9000000, 'Under Review', DOC), { owner }));
    await put(Object.assign(fixtureContract('MK-HF2', 'Freight Services Agreement', 'Kabras Logistics', FOLDER_A, 7000000, 'Draft', DOC), { owner }));
    await put(Object.assign(fixtureContract('MK-HF3', 'Office Lease', 'Hill Plaza', FOLDER_A, 5000000, 'Draft', DOC), { owner }));
    const ob = fixtureContract('MK-HF4', 'Stock reporting', 'Savanna Foods Ltd', FOLDER_A, 900000, 'Signed', DOC);
    Object.assign(ob, { owner, hash: 'x', counterpartyEmail: 'ops@savanna.example',
      obligations: [{ id: 'o1', desc: 'Deliver the Q3 stock report', party: 'theirs', due: day(-5), status: 'open' }] });
    await put(ob);

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await page.$('#li-email')) {
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    }
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length >= 4, null, { timeout: 15000 }).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    await page.evaluate(() => setView('dashboard'));
    await page.waitForSelector('[data-hb-face="board"]', { timeout: 10000 }).catch(() => {});
    await page.evaluate(f => { if (state.view === 'dashboard' && document.getElementById('hb-head')) hbSetFace(f); else { hbS().face = f; hbSave(); setView('dashboard'); } }, 'board');

    /* ===== 1. THE ANSWER OFFERS HOME FIRST ===== */
    await page.evaluate(() => intelAsk('Top 3 contracts by value'));
    await page.waitForSelector('#ig-dock [data-ig-paper-go]', { timeout: 8000 }).catch(() => {});
    const doors = await page.evaluate(() => {
      const row = document.querySelector('#ig-dock .igd-doors');
      return { btns: row ? [...row.querySelectorAll('button')].map(b => b.textContent.trim() + (b.classList.contains('ui-btn-primary') ? '*' : '')) : [],
        small: [...document.querySelectorAll('#ig-dock .igd-small .ui-link')].map(b => b.textContent.trim()),
        smallAfter: !!(row && row.nextElementSibling && row.nextElementSibling.classList.contains('igd-small')) };
    });
    /* the tab is called Workspace since 15 Oct 2026 (owner), so the door names it */
    ok('1a the answer leads with Read all 3 in Workspace (filled; Paper was called Document 11 Oct 2026, Workspace 15 Oct), then Show on the Board',
      doors.btns.join('|') === 'Read all 3 in Workspace*|Show on the Board', JSON.stringify(doors));
    ok('1b the Contracts page and Export are small links after them', doors.smallAfter && doors.small.length === 2 && /Contracts page/.test(doors.small[0]), JSON.stringify(doors.small));
    await page.screenshot({ path: path.join(OUT, '1-answer.png') });

    /* ===== 2. WALK THE SET ON PAPER ===== */
    await page.click('#ig-dock [data-ig-paper-go]');
    await page.waitForFunction(() => hbFace() === 'paper' && !!document.querySelector('#ig-strip .ig-walk'), null, { timeout: 8000 }).catch(() => {});
    const w1 = await page.evaluate(() => ({ face: hbFace(), id: intel.paper && intel.paper.id, walk: (document.querySelector('#ig-strip .ig-walk b') || {}).textContent }));
    ok('2a Read them on Paper opens the first on Home\'s Paper side, "1 of 3"', w1.face === 'paper' && w1.id === 'MK-HF1' && w1.walk === '1 of 3', JSON.stringify(w1));
    await page.click('#ig-strip [data-ig-walk="1"]');
    await page.waitForFunction(() => intel.paper && intel.paper.id === 'MK-HF2', null, { timeout: 8000 }).catch(() => {});
    const w2 = await page.evaluate(() => ({ id: intel.paper && intel.paper.id, walk: (document.querySelector('#ig-strip .ig-walk b') || {}).textContent }));
    ok('2b Next moves to the second, "2 of 3"', w2.id === 'MK-HF2' && w2.walk === '2 of 3', JSON.stringify(w2));

    /* ===== 3. THE PAPER'S DESK — HEADER ICONS (8 Oct 2026) ===== */
    await page.waitForSelector('#ig-dock [data-pd-tab="doc"]', { timeout: 5000 }).catch(() => {});
    const head = await page.evaluate(() => ({ title: /Intelligence panel/.test((document.querySelector('#ig-dock .igd-head') || {}).textContent || ''), desk: !!document.getElementById('ig-desk'),
      tabs: [...document.querySelectorAll('#ig-dock .igd-head [data-pd-tab]')].map(b => b.getAttribute('data-pd-tab')) }));
    /* RE-POINTED 10 Oct 2026 (owner: "delete signing tab"), and 11 Oct 2026
       ("delete the deal tab ... and also delete history"; Document is Clauses), and
       13 Oct 2026 ("delete the overview tab from document page") */
    ok('3a0 the title row is the tabs: Copilot then two; no Overview, Signing, Deal or History, no "Intelligence panel", no column beside the paper',
      !head.title && !head.desk && head.tabs.join(',') === 'copilot,doc,oblig,menu', JSON.stringify(head));   /* + the Menu tab, 15 Oct 2026 */
    const tabs = {};
    for (const t of ['doc', 'oblig']) {
      const b = await page.$(`#ig-dock [data-pd-tab="${t}"]`); if (b) await b.click();
      await page.waitForSelector(`#ig-dock [data-pd-tab="${t}"].on`, { timeout: 3000 }).catch(() => {});
      tabs[t] = await page.evaluate(() => (document.getElementById('pd-body') || {}).innerText || '');
    }
    ok('3a two contract tabs, each drawn', Object.values(tabs).every(x => x.trim().length > 5), JSON.stringify(Object.fromEntries(Object.entries(tabs).map(([k, v]) => [k, v.slice(0, 60)]))));
    /* LIFTED (Young, 8 Oct 2026: "yes to words under the symbols"): every symbol
       carries its word, whole — a word cut to "Docu…" is not a word */
    const sym = await page.evaluate(() => [...document.querySelectorAll('#ig-dock .igd-head .pd-tab')].map(b => { const w = b.querySelector('.pd-tab-w');
      return { k: b.getAttribute('data-pd-tab'), on: b.classList.contains('on'), txt: w ? w.textContent.trim() : '', whole: !!w && w.scrollWidth <= w.clientWidth + 1, glyph: b.querySelector('.pd-tab-g img.jambo-face') ? 'FACE' : ((b.querySelector('.pd-tab-g') || {}).textContent || ''), name: b.getAttribute('title') }; }));
    /* the artifact's symbols, exactly (owner, 10 Oct 2026); Jambo's tab wears his face (owner, 12 Oct 2026).
       RE-POINTED 19 Oct 2026: the first tab's word is "Overview" — the owner: "you land on the page and if
       you want to chat with jambo it takes you to a new jambo tab but you can go back to the landing side
       panel"; "Jambo" names only the conversation. The face stays its mark. */
    ok('3a2 symbols — the artifact\'s marks — each with its word under it, whole; one lit', sym.length === 4 && sym.map(s => s.glyph.replace('\uFE0E', '')).join('') === 'FACE\u25A2\u2691\u2630' && sym.map(s => s.txt).join('|') === 'Overview|Clauses|Obligations|Menu' && sym.every(s => s.name && s.txt.length > 2 && s.whole) && sym.filter(s => s.on).length === 1, JSON.stringify(sym.map(s => s.glyph + ' ' + s.txt + (s.whole ? '' : ' (cut)'))));
    /* WHITE, UNDER THE GREETING ROW (owner, 10 Oct 2026; reverses Lifted) */
    const white = await page.evaluate(() => { const d = document.getElementById('ig-dock');
      return { dock: getComputedStyle(d).backgroundColor, card: getComputedStyle(d, '::before').content, top: Math.round(d.getBoundingClientRect().top), bar: Math.round(document.getElementById('ig-strip').getBoundingClientRect().top) }; });
    ok('3a4 the panel is plain white, no lifted card, its top level with the contract strip', white.dock === 'rgb(255, 255, 255)' && (white.card === 'none' || white.card === 'normal') && white.top === white.bar, JSON.stringify(white));
    /* 3b "Overview carries the parties" RETIRED 13 Oct 2026: the Overview tab is
       gone from Home's panel (owner); the parties stay on the room's Overview */
    const noFacts = await page.evaluate(() => !document.querySelector('#ig-dock [data-pd-tab="facts"]'));
    ok('3b there is no Overview tab on Home\'s panel', noFacts, String(noFacts));
    /* THE DOCUMENT TAB IS THE CLAUSE LIST (owner, 10 Oct 2026) */
    await page.click('#ig-dock [data-pd-tab="doc"]');
    await page.waitForSelector('#pd-thread .doc-th-row', { timeout: 4000 }).catch(() => {});
    const doc = await page.evaluate(() => { const t = document.getElementById('pd-thread'); return { rows: t ? t.querySelectorAll('.doc-th-row').length : 0,
      beads: t ? t.querySelectorAll('.doc-th-bead').length : 0, close: !!(t && t.querySelector('[data-th-close]')), blanks: /still blank|Copies/.test((document.getElementById('pd-body') || {}).innerText || '') }; });
    ok('3c the Document tab is the clause list, its beads down the line; no ×, no blanks, no copies', doc.rows >= 2 && doc.beads === doc.rows && !doc.close && !doc.blanks, JSON.stringify(doc));
    const wide = await page.evaluate(() => ({ sheet: Math.round((document.querySelector('#ig-paper .pg-sheet') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect().width),
      ws: !!document.querySelector('#ig-strip [data-ig-ws]'), ask: !!document.getElementById('igd-input') }));
    /* RE-POINTED 12 Oct 2026 (owner): the ask box stands on the Copilot tab only — this is the Clauses tab, so none */
    ok('3d the paper keeps its width (the Home paper\'s 720, owner 8 Oct 2026), "Open workspace" is gone from Home, no ask box on the Clauses tab', wide.sheet >= 700 && !wide.ws && !wide.ask, JSON.stringify(wide));
    /* ONE BAR (Young, 8 Oct 2026): the strip and the panel's symbols share one top, one
       bottom and one colour, side by side; the sheet starts 87px under the strip's top
       since 11 Oct 2026 (it was 56): the zoom's own 31px row stands above it, the
       owner's "inside the page area" (one-zoom-verify). It was (56px under
       the bar's top), so the wording did not move */
    const bar = await page.evaluate(() => { const R = e => e.getBoundingClientRect();
      const s = document.getElementById('ig-strip'), hd = document.querySelector('#ig-dock > .igd-head'), sh = document.querySelector('#ig-paper .pg-sheet');
      const a = R(s), b = R(hd); return { st: Math.round(a.top), sb: Math.round(a.bottom), ht: Math.round(b.top), hb: Math.round(b.bottom), gap: Math.round(b.left - a.right),
        same: getComputedStyle(s).backgroundColor === getComputedStyle(hd).backgroundColor, sheet: Math.round(R(sh).top - a.top) }; });
    ok('3f the strip and the symbols are one bar, and the wording has not moved', bar.st === bar.ht && bar.sb === bar.hb && Math.abs(bar.gap) <= 1 && bar.same && bar.sheet === 87, JSON.stringify(bar));
    await page.screenshot({ path: path.join(OUT, '3-desk.png') });
    await page.click('#ig-dock [data-pd-tab="copilot"]');
    ok('3e Copilot\'s symbol brings the conversation back', await page.evaluate(() => !!document.querySelector('#igd-feed:not([hidden])') && !document.getElementById('pd-body')));

    /* ===== 4. A REFERENCE IN AN ANSWER IS A DOOR ===== */
    await page.evaluate(() => { intel.history.push({ role: 'assistant', text: 'The lease, MK-HF3, ends first.' }); renderIntelDock(); });
    const ref = await page.$('#igd-feed .ig-ref-go[data-ig-open="MK-HF3"]');
    ok('4a the reference is drawn as a press', !!ref);
    if (ref) await ref.click();
    await page.waitForFunction(() => intel.paper && intel.paper.id === 'MK-HF3', null, { timeout: 8000 }).catch(() => {});
    const r = await page.evaluate(() => ({ id: intel.paper && intel.paper.id, walk: !!intel.walk }));
    ok('4b pressing it opens that contract on Paper, outside the walk', r.id === 'MK-HF3' && !r.walk, JSON.stringify(r));

    /* ===== 5. REVIEW ON LATE PROMISES OPENS THE PAPER AT OBLIGATIONS ===== */
    await page.evaluate(f => { if (state.view === 'dashboard' && document.getElementById('hb-head')) hbSetFace(f); else { hbS().face = f; hbSave(); setView('dashboard'); } }, 'board');
    await page.waitForSelector('[data-hb-review-paper="late"]', { timeout: 8000 }).catch(() => {});
    const late = await page.$('[data-hb-review-paper="late"]');
    ok('5a the Late promises row\'s Review is a door onto the Paper', !!late);
    if (late) await late.click();
    await page.waitForFunction(() => intel.paper && intel.paper.id === 'MK-HF4' && !!document.getElementById('pd-body'), null, { timeout: 8000 }).catch(() => {});
    const l = await page.evaluate(() => ({ face: hbFace(), id: intel.paper && intel.paper.id, tab: pdTab(),
      chase: [...document.querySelectorAll('#pd-body button')].some(b => /Chase/.test(b.textContent)) }));
    ok('5b it lands on the contract at Obligations, with the chase there', l.face === 'paper' && l.id === 'MK-HF4' && l.tab === 'oblig' && l.chase, JSON.stringify(l));
    await page.screenshot({ path: path.join(OUT, '5-late.png') });

    /* ===== 5c. A WORK CARD NAMES ITS CONTRACT (Young, 8 Oct 2026: "no contract number in the card") ===== */
    await page.evaluate(() => hbOpenAgent('late'));
    /* RE-POINTED 19 Oct 2026 (the owner's answer (18), "Fold to one line"): the
       reference rides each piece's own one-line row, beside what it is */
    await page.waitForSelector('.hb-ag-work .hb-pc-ref', { timeout: 8000 }).catch(() => {});
    const refd = await page.evaluate(() => [...document.querySelectorAll('.hb-ag-work .hb-pc-ref')].map(e => (e.querySelector('.hati-ref') || {}).textContent || ''));
    ok('5c Copilot\'s work card leads its contract line with the reference', refd.length > 0 && refd[0] === 'MK-HF4', JSON.stringify(refd));

    /* ===== 6. THE ANSWER FIRST ===== */
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'views', 'intelligence.js'), 'utf8');
    /* RE-POINTED 18 Oct 2026 (owner: where the map only regroups, HaTi's line is
       read first): the summary moves to the hover over a SET only (or on the
       Board); f730 (4) and imported-on-the-map-verify 3b pin the other half */
    ok('6 the map\'s own summary moves to the hover where Copilot wrote the answer over a set',
/if\(line&&ownHtml&&graphSaysMore\(own,res\.note,parts\[0\]\)\)\{\s*if\(\(ids&&ids\.length\)\|\|onBoard\)\{ how=parts\.filter\(x=>x!==capSaid\)/.test(src) && /class="igd-how" title=/.test(src));

    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
