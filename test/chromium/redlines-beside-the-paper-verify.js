/* ============================================================
   REDLINES, BESIDE THE PAPER — stage 3 of the one-page Home plan (the owner
   picked "Column" by name on 14 Oct 2026, with all three recommendations:
   the paper turns Redlined while the face is open and back when it closes;
   every door from outside opens the face, the Negotiate page staying on the
   rail until stage 5; notes stay on Negotiate until stage 5. RE-POINTED for
   stage 5, 14 Oct 2026: the page folded into Home — the head has no Open
   Negotiate, the rail's door is the list whose rows open this face, and a
   note count opens the note on Home)
   ============================================================
   Their round has three asks on a SaaS agreement. Driven in a real browser:
     1  the checklist's door lands on Home's paper with Jambo's panel on the
        Negotiate page's own column; the paper turns Redlined; the Negotiate
        page is never drawn on the way
     2  the column as on Negotiate: Redlines N, the piles, every row's verbs,
        Risks to look at; its head carries × (no Open Negotiate since stage 5); its foot the
        page's three acts
     3  a row's press takes the paper to its clause; a press on a changed
        clause picks its row
     4  Accept settles it where it stands: the row moves to Settled, the face
        and the page stay
     5  Counter opens the clause editor over Home; Exit lands back on the face
        at the same spot, nothing filed
     6  a counter saved there lands under "Your drafts", Send all · 1 not sent,
        same spot; Send all asks the page's own question and sends
     7  Clean still wins while it is open; × goes back to the conversation and
        the paper back to Clean; Their view draws their seat (stage 5)
     8  the word "redline", the bell's row and the list panel's Negotiation
        door open it; the rail's Negotiations door shows the list, and its row
        opens the face (stage 5)
     9  a row's note count opens the notes drawer on Home on that change (stage 5)
    10  the owner's three screens: the paper neither moves nor shrinks when
        the face opens; the face fits; its head and foot are in sight
    11  Svenska; the phone carries on to its own page
   AT THE PARENT every claim FAILS: there is no Redlines face there.
     node test/chromium/redlines-beside-the-paper-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'redlines-beside-the-paper');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };
/* the owner's three screens (CLAUDE.md: two laptops and an iPad Pro 12.9") */
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

const DOC = ['SOFTWARE AS A SERVICE AGREEMENT', '', '1. Scope', '', 'The Supplier shall deliver the Services described in Schedule 1.', '',
  '5. Payment', '', 'Customer shall pay each correct invoice within 90 days of receipt.', '',
  '8. Changes to the Services', '', 'Supplier may not change the Services without Customer\'s written consent.', '',
  '26. Limitation of liability', '', 'Each Party\'s total liability shall not exceed twelve months of Charges.', '',
  '34. Insurance', '', 'Supplier shall hold adequate insurance.'].join('\n');
const FACE = () => {
  const f = document.getElementById('pd-redface');
  return { up: !!f, view: state.view, face: window.hbFace ? hbFace() : null, paper: intel.paper && intel.paper.id,
    red: !!(window.igRedOn && intel.paper && igRedOn(getContract(intel.paper.id))),
    rows: f ? f.querySelectorAll('[data-nego-card]').length : 0 };
};
const bands = () => [...document.querySelectorAll('#pd-redface .rl-band')].map(b => b.textContent.replace(/\s+/g, ' ').trim());

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c0 = fixtureContract('MK-R1', 'SaaS Agreement', 'Parcelway ApS', FOLDER_A, 900000, 'Under Review', DOC);
  c0.owner = { id: me.id, name: me.name };
  await W.admin.json('/api/contracts/MK-R1', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const share = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Erik', email: 'erik@parcelway.example' },
    payload: { v: 1, kind: 'hati-share', org: 'Highland', sharedBy: 'Amina', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
      contract: { id: 'MK-R1', name: 'SaaS Agreement', counterparty: 'Parcelway ApS', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-R1'), 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    /* their round: three asks, sent from their link */
    const cls = await page.evaluate(async () => { const c = getContract('MK-R1'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      return negoClauseList(c).map(k => ({ id: k.clauseId, label: clauseLabel(k), text: String(k.text || k.body || '').trim() })); });
    const ask = (re, a, b) => { const k = cls.find(x => re.test(x.text)); return { clauseId: k.id, clauseLabel: k.label, oldText: k.text, newText: k.text.replace(a, b), why: 'Our position' }; };
    await h.client('erik').raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Erik', id: 'MK-R1', at: new Date().toISOString(),
      negoProposed: [ask(/90 days/, '90 days', '75 days'), ask(/twelve months/, 'twelve months', 'six months'), ask(/written consent/, 'without Customer\'s written consent', 'on 30 days\' notice')] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    await waitFor(page, () => (getContract('MK-R1').changes || []).length >= 3, 10000);
    await page.evaluate(() => setView('register')); await pause(400);
    /* the paper's place with the conversation up, for (10) */
    await page.evaluate(() => pdOpenOnHome('MK-R1', 'copilot'));
    await waitFor(page, () => !!document.getElementById('ig-canvas'), 8000);
    await pause(500);
    const sheetAt = () => page.evaluate(() => { const s = document.querySelector('#ig-paper .doc-surface, #ig-paper .pg-sheet'); const b = s && s.getBoundingClientRect();
      const sc = document.getElementById('ig-paper-scroll'); const r = sc && sc.getBoundingClientRect();
      return b ? { left: Math.round(b.left), width: Math.round(b.width), top: Math.round(r.top) } : null; });
    const sheetBefore = await sheetAt();
    await page.evaluate(() => setView('register')); await pause(400);

    /* ===== 1. THE CHECKLIST'S DOOR LANDS ON THE FACE ===== */
    await page.evaluate(() => { window._negoDrawn = 0; const was = window.renderRedline;
      window.renderRedline = function(){ window._negoDrawn++; return was.apply(this, arguments); }; });
    await page.evaluate(() => needsYouGo('quiet', 'MK-R1'));
    const up1 = await waitFor(page, () => document.querySelectorAll('#pd-redface [data-nego-card]').length >= 3, 10000);
    await pause(600);
    let f = await page.evaluate(FACE);
    check('1a the checklist\'s door lands on Home\'s paper with Jambo\'s panel on the redlines', up1 && f.view === 'dashboard' && f.face === 'paper' && f.paper === 'MK-R1', JSON.stringify(f));
    check('1b the paper turns Redlined', f.red && await page.evaluate(() => document.querySelectorAll('#ig-paper [data-nego-card-anchor]').length >= 3), String(f.red));
    check('1c the Negotiate page is never drawn on the way', await page.evaluate(() => window._negoDrawn === 0 && !document.getElementById('view-redline')));
    await shot('1-face');

    /* ===== 2. THE COLUMN, AS ON NEGOTIATE ===== */
    const col = await page.evaluate(() => {
      const f = document.getElementById('pd-redface');
      const head = f.querySelector('.rl-idx-top');
      const rows = [...f.querySelectorAll('[data-nego-card]')].map(r => [...r.querySelectorAll('button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean));
      return { title: (f.querySelector('.rl-idx-title') || {}).textContent || '', bands: [...f.querySelectorAll('.rl-band')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
        rows, x: !!head.querySelector('[data-pd-rf-close]'), nego: ((head.querySelector('[data-pd-rf-nego]') || {}).textContent || '').trim(),
        round: ((head.querySelector('.rl-round-at') || {}).textContent || '').trim(),
        risks: /Risks to look at/.test(f.textContent),
        foot: [...f.querySelectorAll('.pd-rf-foot button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()) };
    });
    check('2a Redlines with its count, the round, and the piles', /Redlines\s*3/.test(col.title.replace(/\s+/g, ' ')) && /Round 1/.test(col.round) && /Waiting on you\s*3/.test(col.bands.join('|')), JSON.stringify([col.title, col.round, col.bands]));
    check('2b each of their rows carries Accept · Reject · Counter · Ladder', col.rows.length === 3 && col.rows.every(r => ['Accept', 'Reject', 'Counter', 'Ladder'].every(v => r.some(t => t.endsWith(v)))), JSON.stringify(col.rows[0]));
    /* RE-POINTED 14 Oct 2026 (stage 5): the page folded into Home, so the
       head has no way back to it */
    check('2c the head carries ×, and no Open Negotiate', col.x && col.nego === '', col.nego);
    /* RE-POINTED 15 Oct 2026 (owner: "these need to go to the menu as well"):
       with changes in the column the foot's three acts live on the Menu tab */
    check('2d Risks to look at, and no foot: the three acts went to the Menu tab', col.risks && col.foot.length === 0, JSON.stringify(col.foot));
    check('2e the same column the Negotiate page draws (one builder)', await page.evaluate(() => !!document.querySelector('#pd-redface .redline-page.rl-face #rl-side.rl-col #rl-changes-col #nego-cards')));

    /* ===== 3. A ROW AND ITS CLAUSE ARE ONE THING SHOWN TWICE ===== */
    await page.evaluate(() => { const sc = document.getElementById('ig-paper-scroll'); if (sc) sc.scrollTop = 0; });
    await page.click('#pd-redface [data-nego-card="CHG-002"]', { position: { x: 60, y: 10 } });
    await pause(900);
    const p3 = await page.evaluate(() => { const a = document.querySelector('#ig-paper [data-nego-card-anchor~="CHG-002"]'); const sc = document.getElementById('ig-paper-scroll');
      const r = a && a.getBoundingClientRect(), s = sc.getBoundingClientRect();
      return { lit: !!document.querySelector('#pd-redface [data-nego-card="CHG-002"].is-linked'), inView: !!r && r.top >= s.top && r.bottom <= s.bottom, moved: sc.scrollTop > 0 }; });
    check('3a a row\'s press takes the paper to its clause, and the row is lit', p3.lit && p3.inView && p3.moved, JSON.stringify(p3));
    await page.evaluate(() => { const a = document.querySelector('#ig-paper [data-nego-card-anchor~="CHG-003"]'); a.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await pause(500);
    check('3b a press on a changed clause on the paper picks its row', await page.evaluate(() => !!document.querySelector('#pd-redface [data-nego-card="CHG-003"].is-linked')));

    /* ===== 4. ACCEPT ===== */
    await page.click('#pd-redface [data-nego-accept="CHG-001"]');
    await waitFor(page, () => getContract('MK-R1').changes.find(x => x.id === 'CHG-001').status === 'accepted', 5000);
    await pause(600);
    const b4 = await page.evaluate(bands);
    check('4 Accept settles it where it stands: Settled this round, the face and the page stay',
      /Settled this round\s*1/.test(b4.join('|')) && /Waiting on you\s*2/.test(b4.join('|')) && (await page.evaluate(FACE)).up && (await page.evaluate(() => state.view)) === 'dashboard', JSON.stringify(b4));

    /* ===== 5. COUNTER OPENS THE EDITOR; EXIT LANDS BACK ===== */
    const counter = () => page.evaluate(() => { const b = [...document.querySelectorAll('#pd-redface [data-nego-card="CHG-002"] button')].find(x => /Counter/.test(x.textContent)); b.click(); });
    await page.evaluate(() => { document.querySelector('#pd-redface #nego-cards').scrollTop = 40; });
    const at5 = await page.evaluate(() => document.querySelector('#pd-redface #nego-cards').scrollTop);
    await counter();
    const ed5 = await waitFor(page, () => !!document.getElementById('clause-editor'), 6000);
    check('5a Counter opens the clause editor over Home', ed5 && await page.evaluate(() => state.view === 'dashboard'));
    await shot('5-editor');
    await page.evaluate(() => { const x = document.querySelector('#clause-editor [data-ce-act="close"]'); if (x) x.click(); });
    await waitFor(page, () => !document.getElementById('clause-editor'), 4000);
    await page.evaluate(() => { const ok = document.querySelector('#confirm-overlay #cf-ok'); if (ok) ok.click(); });
    await pause(500);
    const back5 = await page.evaluate(() => ({ face: !!document.getElementById('pd-redface'), top: (document.querySelector('#pd-redface #nego-cards') || {}).scrollTop,
      ours: getContract('MK-R1').changes.filter(x => x.authorSide === 'owner').length }));
    check('5b Exit lands back on the face at the same spot, nothing filed', back5.face && back5.top === at5 && back5.ours === 0, JSON.stringify(back5) + ' want ' + at5);

    /* ===== 6. A COUNTER SAVED, AND SENT ===== */
    await page.evaluate(() => { document.querySelector('#pd-redface #nego-cards').scrollTop = 60; });
    const at6 = await page.evaluate(() => document.querySelector('#pd-redface #nego-cards').scrollTop);
    await counter();
    await waitFor(page, () => { const b = document.getElementById('ce-clausebody'); return b && b.getAttribute('contenteditable') === 'true'; }, 8000);
    await page.evaluate(() => { const b = document.getElementById('ce-clausebody'); const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())){ const i = n.textContent.indexOf('six'); if (i >= 0){ const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 3);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.focus(); return; } } });
    await page.keyboard.type('nine');
    await pause(300);
    await page.click('[data-ce-act="save"]');
    await waitFor(page, () => getContract('MK-R1').changes.some(x => x.authorSide === 'owner'), 6000);
    /* the filing's own ask for a note (owner-ruled 31 Aug 2026), skipped; then out of the editor and its drawer */
    await pause(600);
    await page.evaluate(() => { const k = [...document.querySelectorAll('#context-panel button')].find(x => /^Skip$/.test(x.textContent.trim())); if (k) k.click(); });
    await pause(300);
    await page.evaluate(() => { const x = document.querySelector('#clause-editor [data-ce-act="close"]'); if (x) x.click(); });
    await waitFor(page, () => !document.getElementById('clause-editor'), 4000);
    await page.evaluate(() => { const x = document.getElementById('panel-close'); if (x && document.querySelector('#context-panel.open')) x.click(); });
    await pause(500);
    const s6 = await page.evaluate(() => ({ send: ((document.querySelector('#pd-redface .rl-unsent-go') || {}).textContent || '').trim(),
      bands: [...document.querySelectorAll('#pd-redface .rl-band')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
      top: (document.querySelector('#pd-redface #nego-cards') || {}).scrollTop,
      ours: getContract('MK-R1').changes.filter(x => x.authorSide === 'owner').map(x => x.newText || '') }));
    check('6a the counter lands under "Your drafts", Send all · 1 not sent, at the same spot',
      /Your drafts, not yet sent\s*1/.test(s6.bands.join('|')) && s6.send === 'Send all · 1 not sent' && s6.top === at6 && /nine months/.test(s6.ours[0] || ''), JSON.stringify(s6) + ' want ' + at6);
    await shot('6-drafted');
    await page.click('#pd-redface .rl-unsent-go');
    const asked = await waitFor(page, () => !!document.querySelector('#confirm-overlay #cf-ok'), 5000);
    const q6 = await page.evaluate(() => ((document.getElementById('confirm-overlay') || {}).innerText || '').replace(/\s+/g, ' '));
    check('6b Send all asks the Negotiate page\'s own question', asked && /Send 1 change to Parcelway ApS/.test(q6), q6.slice(0, 120));
    await page.click('#confirm-overlay #cf-ok');
    await waitFor(page, () => window.negoUnsentAsks && negoUnsentAsks(getContract('MK-R1')).length === 0, 8000);
    await pause(800);
    const s6c = await page.evaluate(() => ({ unsent: negoUnsentAsks(getContract('MK-R1')).length, bands: [...document.querySelectorAll('#pd-redface .rl-band')].map(b => b.textContent.replace(/\s+/g, ' ').trim()) }));
    check('6c and sends: nothing unsent, the counter is with them', s6c.unsent === 0 && /With the counterparty\s*1/.test(s6c.bands.join('|')), JSON.stringify(s6c));

    /* ===== 7. CLEAN STILL WINS; × GOES BACK ===== */
    await page.click('[data-ig-red="0"]'); await pause(500);
    const c7 = await page.evaluate(FACE);
    check('7a a press on Clean while the face is open still wins; the face stays', !c7.red && c7.up, JSON.stringify(c7));
    await page.click('#pd-redface [data-pd-rf-close]'); await pause(500);
    const x7 = await page.evaluate(() => ({ face: !!document.getElementById('pd-redface'), feed: !!document.querySelector('#igd-feed:not([hidden])'),
      red: igRedOn(getContract('MK-R1')), box: !!document.getElementById('igd-input') }));
    check('7b × goes back to the conversation, and the paper stays as it was before the face', !x7.face && x7.feed && x7.box && !x7.red, JSON.stringify(x7));
    /* opened from Clean, closed: Clean again (decision 1) */
    await page.evaluate(() => pdRedOpen('MK-R1')); await waitFor(page, () => !!document.getElementById('pd-redface'), 5000);
    const o7 = await page.evaluate(FACE);
    await page.click('#pd-redface [data-pd-rf-close]'); await pause(400);
    const z7 = await page.evaluate(FACE);
    check('7c opened from Clean it turns Redlined, and closing puts Clean back', o7.red && !z7.red, `${o7.red} → ${z7.red}`);
    /* THEIR VIEW (stage 5, 14 Oct 2026): the Negotiate page's Internal |
       Counterparty switch, folded into Home's paper line as Clean | Redline |
       Their view — the same Redlined paper drawn from their seat */
    await page.evaluate(() => pdRedOpen('MK-R1'));
    await waitFor(page, () => !!document.querySelector('#ig-strip [data-ig-red="theirs"]'), 6000);
    if (await page.$('#ig-strip [data-ig-red="theirs"]')) await page.click('#ig-strip [data-ig-red="theirs"]');
    const tv = await waitFor(page, () => /:theirs$/.test(((document.getElementById('ig-paper') || {}).dataset || {}).for || '')
      && (document.querySelector('#ig-strip [data-ig-red="theirs"]') || {}).getAttribute?.('aria-pressed') === 'true'
      && !!document.querySelector('#ig-paper .ig-redpaper #ig-canvas'), 5000);
    check('7d Their view draws the Redlined paper from their seat, and the toggle says so', tv);
    if (await page.$('#ig-strip [data-ig-red="1"]')) await page.click('#ig-strip [data-ig-red="1"]');
    const back7 = await waitFor(page, () => /:red$/.test(((document.getElementById('ig-paper') || {}).dataset || {}).for || ''), 5000);
    check('7e and Redline puts our own seat back', back7);
    await page.evaluate(() => pdRedClose()); await pause(300);

    /* ===== 8. THE OTHER DOORS ===== */
    await page.fill('#igd-input', 'redline'); await page.keyboard.press('Enter');
    check('8a the word "redline" opens the face', await waitFor(page, () => !!document.getElementById('pd-redface'), 5000));
    await page.evaluate(() => pdRedClose()); await page.evaluate(() => setView('register')); await pause(400);
    await page.evaluate(() => { const al = buildAlerts().find(a => a.kind === 'negotiation' && a.id === 'MK-R1'); window._al8 = !!al; if (al) al.go(); });
    const al8 = await waitFor(page, () => !!document.getElementById('pd-redface') && state.view === 'dashboard', 6000);
    check('8b the bell\'s negotiation row opens the face', al8, String(await page.evaluate(() => window._al8)));
    await page.evaluate(() => pdRedClose()); await page.evaluate(() => setView('register')); await pause(400);
    await page.evaluate(() => { const d = (insDoorActs(getContract('MK-R1')) || []).find(x => x.k === 'door-nego'); window._d8 = d ? d.k : null; if (d) d.run(); });
    const ins8 = await waitFor(page, () => !!document.getElementById('pd-redface') && state.view === 'dashboard', 6000);
    check('8c the list panel\'s Negotiation door opens the face', ins8, String(await page.evaluate(() => window._d8)));
    /* RE-POINTED 14 Oct 2026 (stage 5; the owner's yes to decision 1): the
       rail's Negotiations door stays, as the LIST — never a bench — and a
       row opened from it lands on this face */
    await page.evaluate(() => { pdRedClose(); openNegotiations(); });
    const list8 = await waitFor(page, () => state.view === 'redline' && !document.querySelector('#rl-side') && /MK-R1|SaaS/.test((document.getElementById('content') || {}).innerText || ''), 8000);
    check('8d the rail\'s Negotiations door shows the list, not a bench', list8);
    await page.evaluate(() => regOpenRow('MK-R1', true));
    check('8e a row on that list opens the face on Home', await waitFor(page, () => state.view === 'dashboard' && !!document.getElementById('pd-redface') && intel.paper && intel.paper.id === 'MK-R1', 8000));

    /* ===== 9. A ROW'S NOTE COUNT OPENS THAT CHANGE'S NOTE ON HOME =====
       RE-POINTED 14 Oct 2026 (stage 5): the Negotiate page folded into Home;
       the count opens the notes drawer beside Home's paper on that change,
       the face kept */
    await page.evaluate(() => { const c = getContract('MK-R1'); negoPostComment(c, 'CHG-003', 'Check with finance first', { side: 'owner', visibility: 'internal' }); if (window.persist) persist(c); });
    await page.evaluate(() => pdRedOpen('MK-R1'));
    await waitFor(page, () => !!document.querySelector('#pd-redface [data-rl-notes="CHG-003"]'), 6000);
    await page.click('#pd-redface [data-rl-notes="CHG-003"]');
    const n9 = await waitFor(page, () => state.view === 'dashboard' && !!document.querySelector('#context-panel.open'), 8000);
    const n9b = await page.evaluate(() => ({ view: state.view, face: !!document.getElementById('pd-redface'),
      drawer: ((document.querySelector('#context-panel.open') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 400) }));
    check('9 a row\'s note count opens the notes drawer on Home on that change, the face kept', n9 && n9b.face && /CHG-003/.test(n9b.drawer) && /finance/.test(n9b.drawer), JSON.stringify(n9b));
    await page.evaluate(() => { const x = document.getElementById('panel-close'); if (x) x.click(); });

    /* ===== 10. THE OWNER'S THREE SCREENS ===== */
    await page.evaluate(() => pdRedOpen('MK-R1'));
    await waitFor(page, () => !!document.getElementById('pd-redface'), 6000);
    await pause(500);
    const sheetFace = await sheetAt();
    check('10a the paper neither moves nor shrinks when the face opens', !!sheetBefore && !!sheetFace && sheetBefore.left === sheetFace.left && sheetBefore.width === sheetFace.width && sheetBefore.top === sheetFace.top,
      JSON.stringify({ sheetBefore, sheetFace }));
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh }); await pause(600);
      const fit = await page.evaluate(() => {
        const f = document.getElementById('pd-redface'); const fr = f.getBoundingClientRect();
        const head = f.querySelector('.rl-idx-top').getBoundingClientRect(), footEl = f.querySelector('.pd-rf-foot'), foot = footEl ? footEl.getBoundingClientRect() : fr;
        const x = f.querySelector('[data-pd-rf-close]').getBoundingClientRect();
        const box = document.getElementById('igd-input').getBoundingClientRect();
        const wide = [...f.querySelectorAll('*')].filter(n => n.getBoundingClientRect().right > fr.right + 1 && n.getClientRects().length).map(n => n.className || n.tagName).slice(0, 3);
        return { headIn: head.top >= fr.top - 1 && head.bottom <= fr.bottom, footIn: foot.top >= fr.top && foot.bottom <= fr.bottom + 1, xIn: x.right <= fr.right + 1,
          boxIn: box.bottom <= innerHeight + 1, wide, docW: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      check(`10b ${w}×${hh}: the face fits — head, × (and a foot where drawn) in sight, the box at the panel's foot, nothing wider than the panel`,
        fit.headIn && fit.footIn && fit.xIn && fit.boxIn && !fit.wide.length && fit.docW <= 0, JSON.stringify(fit));
      await shot(`10-${w}x${hh}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 }); await pause(300);

    /* ===== 11. SVENSKA, AND THE PHONE ===== */
    const sv = await page.$('.lang-btn[data-lang="sv"]'); if (sv) { await sv.click(); await pause(800); }
    await page.evaluate(() => { if (!document.getElementById('pd-redface')) pdRedOpen('MK-R1'); });
    await waitFor(page, () => !!document.getElementById('pd-redface'), 5000);
    const s11 = await page.evaluate(() => ({ nego: ((document.querySelector('#pd-redface [data-pd-rf-nego]') || {}).textContent || '').trim(),
      title: ((document.querySelector('#pd-redface .rl-idx-title') || {}).textContent || '').trim(), x: (document.querySelector('#pd-redface [data-pd-rf-close]') || {}).title }));
    check('11a Svenska: the face speaks the reader\'s language', !s11.nego && !/Redlines/.test(s11.title) && !/Close/.test(s11.x || ''), JSON.stringify(s11));
    await shot('11-svenska');
    const en2 = await page.$('.lang-btn[data-lang="en"]'); if (en2) { await en2.click(); await pause(500); }
    await page.setViewportSize({ width: 390, height: 844 }); await pause(600);
    await page.evaluate(() => openRedlineWorkbench('MK-R1', { face: true }));
    await pause(1200);
    const ph = await page.evaluate(() => ({ view: state.view, face: !!document.getElementById('pd-redface') }));
    check('11b the phone carries on to its own negotiation page', ph.view === 'redline' && !ph.face, JSON.stringify(ph));

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('run', false, e && e.stack ? e.stack.slice(0, 500) : String(e));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
