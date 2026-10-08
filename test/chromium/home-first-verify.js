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
    await page.click('[data-hb-face="board"]');

    /* ===== 1. THE ANSWER OFFERS HOME FIRST ===== */
    await page.evaluate(() => intelAsk('Top 3 contracts by value'));
    await page.waitForSelector('#ig-dock [data-ig-paper-go]', { timeout: 8000 }).catch(() => {});
    const doors = await page.evaluate(() => {
      const row = document.querySelector('#ig-dock .igd-doors');
      return { btns: row ? [...row.querySelectorAll('button')].map(b => b.textContent.trim() + (b.classList.contains('ui-btn-primary') ? '*' : '')) : [],
        small: [...document.querySelectorAll('#ig-dock .igd-small .ui-link')].map(b => b.textContent.trim()),
        smallAfter: !!(row && row.nextElementSibling && row.nextElementSibling.classList.contains('igd-small')) };
    });
    ok('1a the answer leads with Read all 3 on Paper (filled), then Show on the Board',
      doors.btns.join('|') === 'Read all 3 on Paper*|Show on the Board', JSON.stringify(doors));
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
    await page.waitForSelector('#ig-dock [data-pd-tab="facts"]', { timeout: 5000 }).catch(() => {});
    const head = await page.evaluate(() => ({ title: /Intelligence panel/.test((document.querySelector('#ig-dock .igd-head') || {}).textContent || ''), desk: !!document.getElementById('ig-desk'),
      tabs: [...document.querySelectorAll('#ig-dock .igd-head [data-pd-tab]')].map(b => b.getAttribute('data-pd-tab')) }));
    ok('3a0 the title row is the tabs: Copilot then the room\'s six; no "Intelligence panel", no column beside the paper',
      !head.title && !head.desk && head.tabs.join(',') === 'copilot,facts,doc,sign,oblig,hist,deal', JSON.stringify(head));
    const tabs = {};
    for (const t of ['facts', 'doc', 'oblig', 'sign', 'hist', 'deal']) {
      const b = await page.$(`#ig-dock [data-pd-tab="${t}"]`); if (b) await b.click();
      await page.waitForSelector(`#ig-dock [data-pd-tab="${t}"].on`, { timeout: 3000 }).catch(() => {});
      tabs[t] = await page.evaluate(() => (document.getElementById('pd-body') || {}).innerText || '');
    }
    ok('3a six contract tabs, each drawn', Object.values(tabs).every(x => x.trim().length > 5), JSON.stringify(Object.fromEntries(Object.entries(tabs).map(([k, v]) => [k, v.slice(0, 60)]))));
    const sym = await page.evaluate(() => [...document.querySelectorAll('#ig-dock .igd-head .pd-tab')].map(b => ({ k: b.getAttribute('data-pd-tab'), on: b.classList.contains('on'), txt: b.textContent.trim(), icon: !!b.querySelector('svg use'), name: b.getAttribute('title') })));
    ok('3a2 symbols, each named on hover; only the lit one says its name', sym.length === 7 && sym.every(s => s.icon && s.name && (s.on ? s.txt === 'History' || s.txt === 'Deal' || s.txt.length > 2 : !s.txt)) && sym.filter(s => s.on).length === 1, JSON.stringify(sym));
    await page.click('#ig-dock [data-pd-tab="facts"]');
    const facts = await page.evaluate(() => (document.getElementById('pd-body') || {}).innerText || '');
    ok('3b Overview carries the parties', /Kabras Logistics/.test(facts), facts.slice(0, 120));
    await page.click('#ig-dock [data-pd-tab="sign"]');
    const sign = await page.evaluate(() => { const b = [...document.querySelectorAll('#pd-body button')].find(x => /Send for signing/.test(x.textContent));
      return { n: (signBlockers(getContract('MK-HF2')) || []).length, send: !!b, grey: !!(b && b.disabled) }; });
    ok('3c Signing is the Sign button\'s own list; Send stays grey while it holds anything', sign.n > 0 && sign.send && sign.grey, JSON.stringify(sign));
    const wide = await page.evaluate(() => ({ sheet: Math.round((document.querySelector('#ig-paper .pg-sheet') || { getBoundingClientRect: () => ({ width: 0 }) }).getBoundingClientRect().width),
      ws: !!document.querySelector('#ig-strip [data-ig-ws]'), ask: !!document.getElementById('igd-input') }));
    ok('3d the paper keeps its width, "Open workspace" is gone from Home, the ask box stays under every tab', wide.sheet >= 760 && !wide.ws && wide.ask, JSON.stringify(wide));
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
    await page.click('[data-hb-face="board"]');
    await page.waitForSelector('[data-hb-review-paper="late"]', { timeout: 8000 }).catch(() => {});
    const late = await page.$('[data-hb-review-paper="late"]');
    ok('5a the Late promises row\'s Review is a door onto the Paper', !!late);
    if (late) await late.click();
    await page.waitForFunction(() => intel.paper && intel.paper.id === 'MK-HF4' && !!document.getElementById('pd-body'), null, { timeout: 8000 }).catch(() => {});
    const l = await page.evaluate(() => ({ face: hbFace(), id: intel.paper && intel.paper.id, tab: pdTab(),
      chase: [...document.querySelectorAll('#pd-body button')].some(b => /Chase/.test(b.textContent)) }));
    ok('5b it lands on the contract at Obligations, with the chase there', l.face === 'paper' && l.id === 'MK-HF4' && l.tab === 'oblig' && l.chase, JSON.stringify(l));
    await page.screenshot({ path: path.join(OUT, '5-late.png') });

    /* ===== 6. THE ANSWER FIRST ===== */
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'views', 'intelligence.js'), 'utf8');
    ok('6 the map\'s own summary moves to the hover where Copilot wrote the answer',
/if\(line&&ownHtml&&graphSaysMore\(own,res\.note,parts\[0\]\)\)\{ how=parts\.filter\(x=>x!==capSaid\)/.test(src) && /class="igd-how" title=/.test(src));

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
