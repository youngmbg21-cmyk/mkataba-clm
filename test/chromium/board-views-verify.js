/* ============================================================
   THE CONTRACT'S VIEWS ON THE BOARD — stage 4 of the one-page Home plan (the
   owner picked "Views" by name on 14 Oct 2026, with all three
   recommendations: Share gives a view to colleagues inside HaTi only;
   Download is one file per view that looks like its print; every door from
   outside lands here, the Negotiate page's Deal board tab and the room's
   Obligations and History tabs staying until stage 5)
   ============================================================
   A SaaS agreement under review: their round has three asks, two duties
   (one of theirs late), and a trail. Driven in a real browser:
     1  the switch: none with nothing on the paper; with a contract there,
        Your book · Deal board 3 · Obligations 1 · History, for whom
     2  Deal board: the Negotiate page's own board takes the Board whole;
        a press selects, a filter narrows, a second press opens the clause on
        Home's paper with Jambo's Redlines face; the Negotiate page is never
        drawn
     3  Obligations: the room's own table and panel, the overdue count the
        switch's; a duty done repaints the view and the switch
     4  History: the room's own trail, its search keeps the typed word; its
        menu keeps Verify alone (Print and Download stand on the Board's line);
        something new put on the Board (an agent's work) lands on Your book
     5  Print and Download: one page each way, for every view
     6  Share: the form opens and closes (again, Esc, outside); Give reaches a
        colleague's bell and Board; the server refuses a colleague who cannot
        open the contract and a contract the giver cannot see
     7  the doors: the words, the panel's old Deal and History doors, and the
        bell's trail rows all land on the Board's views
     8  a refresh comes back to the same view of the same contract
     9  the owner's three screens: one line, nothing scrolls sideways, the
        view fills the Board
    10  Svenska; the phone opens the room's own tab
   AT THE PARENT every claim FAILS: there is no switch there.
     node test/chromium/board-views-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'board-views');
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
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const day = n => iso(n).slice(0, 10);

const DOC = ['SOFTWARE AS A SERVICE AGREEMENT', '', '1. Scope', '', 'The Supplier shall deliver the Services described in Schedule 1.', '',
  '5. Payment', '', 'Customer shall pay each correct invoice within 90 days of receipt.', '',
  '8. Changes to the Services', '', 'Supplier may not change the Services without Customer\'s written consent.', '',
  '26. Limitation of liability', '', 'Each Party\'s total liability shall not exceed twelve months of Charges.', '',
  '34. Insurance', '', 'Supplier shall hold adequate insurance.'].join('\n');
const BAR = () => {
  const b = document.getElementById('hb-cv-bar');
  return { up: !!b, tabs: b ? [...b.querySelectorAll('[data-hb-cv]')].map(x => x.textContent.replace(/\s+/g, ' ').trim()) : [],
    on: b ? (b.querySelector('[data-hb-cv][aria-selected="true"]') || {}).getAttribute?.('data-hb-cv') : null,
    who: b ? ((b.querySelector('.hb-cv-for') || {}).textContent || '').replace(/\s+/g, ' ').trim() : '',
    acts: b ? [...b.querySelectorAll('[data-hb-cv-act]')].filter(x => !x.closest('.hb-cv-share')).map(x => x.textContent.replace(/\s+/g, ' ').trim()) : [],
    body: (document.getElementById('hb-cv-body') || {}).getAttribute?.('data-hb-cv') || null,
    book: !!document.querySelector('#hb-board .hb-note'), view: state.view, face: window.hbFace ? hbFace() : null };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c0 = fixtureContract('MK-V1', 'SaaS Agreement', 'Parcelway ApS', FOLDER_A, 900000, 'Under Review', DOC);
  Object.assign(c0, { owner: { id: me.id, name: me.name },
    obligations: [{ id: 'o1', desc: 'Deliver the monthly service report', party: 'theirs', due: day(-2), status: 'open' },
      { id: 'o2', desc: 'Pay the first invoice', party: 'ours', due: day(20), status: 'open', amount: 75000 }] });
  await W.admin.json('/api/contracts/MK-V1', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const cB = fixtureContract('MK-VB', 'Sales Agreement', 'Juno Retail', FOLDER_B, 400000, 'Under Review', DOC);
  await W.admin.json('/api/contracts/MK-VB', { method: 'PUT', body: { contract: cB, baseVersion: 0 } });
  const share = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Erik', email: 'erik@parcelway.example' },
    payload: { v: 1, kind: 'hati-share', org: 'Highland', sharedBy: 'Amina', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
      contract: { id: 'MK-V1', name: 'SaaS Agreement', counterparty: 'Parcelway ApS', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-V1'), 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    /* their round: three asks, sent from their link */
    const cls = await page.evaluate(async () => { const c = getContract('MK-V1'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      return negoClauseList(c).map(k => ({ id: k.clauseId, label: clauseLabel(k), text: String(k.text || k.body || '').trim() })); });
    const ask = (re, a, b) => { const k = cls.find(x => re.test(x.text)); return { clauseId: k.id, clauseLabel: k.label, oldText: k.text, newText: k.text.replace(a, b), why: 'Our position' }; };
    await h.client('erik').raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Erik', id: 'MK-V1', at: new Date().toISOString(),
      negoProposed: [ask(/90 days/, '90 days', '75 days'), ask(/twelve months/, 'twelve months', 'six months'), ask(/written consent/, 'without Customer\'s written consent', 'on 30 days\' notice')] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    await waitFor(page, () => (getContract('MK-V1').changes || []).length >= 3, 10000);

    /* ===== 1. THE SWITCH ===== */
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; hbSave(); setView('dashboard'); });
    await waitFor(page, () => !!document.querySelector('#hb-board .hb-note'), 10000);
    let b = await page.evaluate(BAR);
    check('[wall] 1a with nothing on the paper the Board draws no switch: the book as before (true before stage 4 too)', !b.up && b.book, JSON.stringify(b));
    await page.evaluate(() => pdOpenOnHome('MK-V1', 'copilot'));
    await waitFor(page, () => !!document.getElementById('ig-canvas'), 8000);
    await page.evaluate(() => hbSetFace('board'));
    await waitFor(page, () => !!document.getElementById('hb-cv-bar'), 5000);
    b = await page.evaluate(BAR);
    check('1b with a contract on the paper: Your book · Deal board 3 · Obligations 1 · History', b.up && JSON.stringify(b.tabs) === JSON.stringify(['Your book', 'Deal board3', 'Obligations1', 'History']), JSON.stringify(b.tabs));
    check('1c it says whose views they are, and Your book is shown, the book drawn as before', /^for MK-V1 · Parcelway ApS$/.test(b.who) && b.on === 'book' && b.book && !b.body && !b.acts.length, JSON.stringify(b));
    await shot('1-switch-book');
    /* a missing switch reports here rather than timing out on every press below */
    if (!b.up) throw new Error('no switch on the Board: every claim below fails');

    /* ===== 2. DEAL BOARD ===== */
    await page.evaluate(() => { window._negoDrawn = 0; const was = window.renderRedline;
      window.renderRedline = function(){ window._negoDrawn++; return was.apply(this, arguments); }; });
    await page.click('#hb-cv-bar [data-hb-cv="deal"]');
    await waitFor(page, () => document.querySelectorAll('#hb-cv-body [data-rl-board-pick]').length >= 3, 6000);
    b = await page.evaluate(BAR);
    const db = await page.evaluate(() => { const host = document.getElementById('hb-cv-body'), bar = document.getElementById('hb-cv-bar'), brd = document.getElementById('hb-board');
      const ids = [...host.querySelectorAll('[data-rl-board-pick]')].map(x => x.getAttribute('data-rl-board-pick'));
      const want = [...new DOMParser().parseFromString(dealBoardHtml(getContract('MK-V1'), 'owner'), 'text/html').querySelectorAll('[data-rl-board-pick]')].map(x => x.getAttribute('data-rl-board-pick'));
      const acts = [...bar.querySelectorAll('[data-hb-cv-act]')].map(x => Math.round(x.getBoundingClientRect().top));
      return { ids, want, needs: /Needs you\s*3/.test(host.textContent), card: !!host.querySelector('.db-card'),
        oneLine: new Set(acts.concat(Math.round(bar.querySelector('.hb-cv-seg').getBoundingClientRect().top))).size <= 2 && Math.max(...acts) - Math.min(...acts) <= 2,
        fills: Math.abs(host.getBoundingClientRect().bottom - brd.getBoundingClientRect().bottom) < 40 };
    });
    check('2a the Negotiate page\'s own board takes the Board whole: the same points, Needs you 3, one point whole', b.on === 'deal' && b.body === 'deal' && !b.book && db.ids.join() === db.want.join() && db.ids.length === 3 && db.needs && db.card, JSON.stringify([b, db.ids]));
    check('2b Print · Share · Download on the switch\'s line', JSON.stringify(b.acts) === JSON.stringify(['Print', 'Share', 'Download']) && db.oneLine, JSON.stringify(b.acts));
    check('2c the view fills the Board to its foot', db.fills);
    await shot('2-deal-board');
    const second = await page.evaluate(() => document.querySelectorAll('#hb-cv-body [data-rl-board-pick]')[1].getAttribute('data-rl-board-pick'));
    await page.click(`#hb-cv-body [data-rl-board-pick="${second}"]`);
    await pause(300);
    const picked = await page.evaluate(id => ({ on: (document.querySelector('#hb-cv-body [data-rl-board-pick][aria-current="true"]') || {}).getAttribute?.('data-rl-board-pick'),
      card: (document.querySelector('#hb-cv-body .db-card') || {}).getAttribute?.('data-db-card') }), second);
    check('2d a press selects: the row and the card are that point, drawn in the Board\'s host', picked.on === second && picked.card === second, JSON.stringify(picked));
    const fk = await page.evaluate(() => { const f = document.querySelector('#hb-cv-body [data-rl-board-f="you"]'); return f ? 'you' : null; });
    if (fk) await page.click('#hb-cv-body [data-rl-board-f="you"]');
    await pause(300);
    check('2e a filter narrows, in the Board\'s host', await page.evaluate(() => !!document.querySelector('#hb-cv-body [data-rl-board-f="you"].on') && document.querySelectorAll('#hb-cv-body [data-rl-board-pick]').length === 3));
    await page.click('#hb-cv-body [data-rl-board-f="you"]'); await pause(200);
    check('2f the Negotiate page is never drawn on the way', await page.evaluate(() => window._negoDrawn === 0 && !document.getElementById('view-redline')));
    /* the filter put the pick back on the first point: a press selects, a second opens */
    await page.click(`#hb-cv-body [data-rl-board-pick="${second}"]`); await pause(300);
    await page.click(`#hb-cv-body [data-rl-board-pick="${second}"]`);
    const landed = await waitFor(page, id => { const p = document.querySelector(`#ig-paper [data-clause="${CSS.escape(id)}"]`); return hbFace() === 'paper' && !!document.getElementById('pd-redface') && !!p && p.classList.contains('rl-arrived'); }, 8000, second);
    check('2g a second press opens the clause on Home\'s paper with Jambo\'s Redlines face, lit', landed, await page.evaluate(id => JSON.stringify({ face: hbFace(), red: !!document.getElementById('pd-redface'),
      clauses: document.querySelectorAll('#ig-paper [data-clause]').length, anchors: [...document.querySelectorAll('#ig-paper [data-nego-card-anchor]')].map(a => a.getAttribute('data-nego-card-anchor')),
      want: id, ids: [...document.querySelectorAll('#ig-paper [data-clause]')].map(x => x.getAttribute('data-clause') + ':' + x.className), face2: !!document.querySelector('.redline-page.rl-face'), embed: !!document.querySelector('.redline-page.rl-embed'), lit: [...document.querySelectorAll('#ig-paper .rl-arrived, #ig-paper .is-lit')].map(x => x.className).slice(0, 3) }), second));
    await shot('2g-clause-on-paper');

    /* ===== 3. OBLIGATIONS ===== */
    await page.evaluate(() => hbSetFace('board'));
    await waitFor(page, () => !!document.getElementById('hb-cv-bar'), 5000);
    await page.click('#hb-cv-bar [data-hb-cv="oblig"]');
    await waitFor(page, () => document.querySelectorAll('#hb-cv-body .ob-lt [data-ins-row]').length >= 1, 6000);
    const ob = await page.evaluate(() => { const host = document.getElementById('hb-cv-body');
      const tabs = [...host.querySelectorAll('[data-obt-view]')].map(x => x.textContent.replace(/\s+/g, ' ').trim());
      return { tabs, rows: host.querySelectorAll('.ob-lt [data-ins-row]').length, panel: !!host.querySelector('#obt-panel'), ins: host.classList.contains('is-ins') }; });
    check('3a the room\'s own obligations: its tabs, its rows, its panel; Overdue 1 is the switch\'s number', ob.ins && ob.panel && ob.tabs.some(t => /^Overdue\s*1$/.test(t)) && ob.rows >= 1, JSON.stringify(ob));
    await page.click('#hb-cv-body [data-obt-view="all"]'); await pause(300);
    check('3b its tabs work where it stands: All shows both duties', await page.evaluate(() => document.querySelectorAll('#hb-cv-body .ob-lt [data-ins-row]').length === 2 && !!document.getElementById('hb-cv-bar')));
    await page.click('#hb-cv-body .ob-lt [data-ins-row]'); await pause(300);
    check('3c a row press shows its panel, with Mark done', await page.evaluate(() => /Mark done/.test((document.getElementById('obt-panel') || {}).textContent || '')));
    await shot('3-obligations');
    await page.evaluate(() => { const c = getContract('MK-V1'); const i = c.obligations.findIndex(o => o.id === 'o1'); toggleObligation(c, i, { from: 'test' }); });
    const redrawn = await waitFor(page, () => !/Obligations1/.test(document.getElementById('hb-cv-bar').textContent.replace(/\s+/g, '')) && /Completed\s*1/.test(document.getElementById('hb-cv-body').textContent), 5000);
    check('3d a duty done anywhere repaints the view and the switch\'s number', redrawn, await page.evaluate(() => document.getElementById('hb-cv-bar').textContent.replace(/\s+/g, ' ')));

    /* ===== 4. HISTORY ===== */
    await page.click('#hb-cv-bar [data-hb-cv="hist"]');
    await waitFor(page, () => document.querySelectorAll('#hb-cv-body .hist-ev').length >= 1, 8000);
    const hi = await page.evaluate(() => { const host = document.getElementById('hb-cv-body');
      return { rows: host.querySelectorAll('.hist-ev').length, all: roomHistoryEvents(getContract('MK-V1'), {}).length,
        menu: [...host.querySelectorAll('#hist-more-menu button')].map(x => x.id), card: getComputedStyle(host).borderTopStyle };
    });
    check('4a the room\'s own trail, every event, on a card', hi.rows === hi.all && hi.rows >= 2 && hi.card === 'solid', JSON.stringify(hi));
    check('4b its menu keeps Verify alone: Print and Download stand on the Board\'s line', JSON.stringify(hi.menu) === JSON.stringify(['ht-verify']), JSON.stringify(hi.menu));
    await page.click('#hb-cv-body #hist-q'); await page.keyboard.type('Round');
    await pause(400);
    const hq = await page.evaluate(() => ({ v: (document.querySelector('#hb-cv-body #hist-q') || {}).value, focus: document.activeElement && document.activeElement.id,
      rows: document.querySelectorAll('#hb-cv-body .hist-ev').length }));
    await page.evaluate(() => hbPaintBoard()); await pause(200);
    const hq2 = await page.evaluate(() => ({ v: (document.querySelector('#hb-cv-body #hist-q') || {}).value, focus: document.activeElement && document.activeElement.id }));
    check('4c its search narrows where it stands, and a Board repaint keeps the typed word', hq.v === 'Round' && hq.focus === 'hist-q' && hq.rows < hi.rows && hq2.v === 'Round' && hq2.focus === 'hist-q', JSON.stringify([hq, hq2]));
    await page.fill('#hb-cv-body #hist-q', ''); await pause(300);
    await shot('4-history');
    /* something new put on the book while a view shows (an agent's work, an answer) is shown on the book */
    await page.evaluate(() => hbOpenAgent('round'));
    const stepped = await waitFor(page, () => !document.getElementById('hb-cv-body') && !!document.querySelector('#hb-board .hb-note') && !!document.getElementById('hb-focus')
      && (document.querySelector('#hb-cv-bar [data-hb-cv][aria-selected="true"]') || {}).getAttribute?.('data-hb-cv') === 'book', 6000);
    check('4d something new put on the Board while a view shows lands on Your book, in sight', stepped, await page.evaluate(() => JSON.stringify({ body: !!document.getElementById('hb-cv-body'), focus: !!document.getElementById('hb-focus') })));

    /* ===== 5. PRINT AND DOWNLOAD ===== */
    await page.evaluate(() => {
      window._opened = []; window._saved = [];
      window.open = () => { const w = { printed: 0, html: '', document: { open(){}, write(x){ w.html += x; }, close(){} }, addEventListener(){}, focus(){}, print(){ w.printed++; }, close(){} }; window._opened.push(w); return w; };
      window.downloadFile = (name, content, type) => { window._saved.push({ name, content: String(content), type }); };
    });
    const runAll = async v => {
      await page.click(`#hb-cv-bar [data-hb-cv="${v}"]`); await pause(400);
      await page.evaluate(() => { window._opened.length = 0; window._saved.length = 0; });
      await page.click('#hb-cv-bar [data-hb-cv-act="print"]'); await pause(900);
      await page.click('#hb-cv-bar [data-hb-cv-act="down"]'); await pause(900);
      return page.evaluate(() => ({ opened: window._opened.length, printed: window._opened.map(w => w.printed), printHtml: (window._opened[0] || {}).html || '',
        saved: window._saved.map(s => s.name), savedHtml: (window._saved[0] || {}).content || '' }));
    };
    const pd = await runAll('deal');
    const dealDoc = /<title>Deal board · MK-V1<\/title>/.test(pd.savedHtml) && (pd.savedHtml.match(/<article>/g) || []).length === 3 && /Fallback|Standard|Needs you/.test(pd.savedHtml);
    check('5a Deal board: Print opens one page and asks the printer once; Download saves MK-V1-deal-board.html', pd.opened === 1 && pd.printed[0] === 1 && JSON.stringify(pd.saved) === '["MK-V1-deal-board.html"]' && dealDoc, JSON.stringify({ ...pd, printHtml: pd.printHtml.length, savedHtml: pd.savedHtml.length }));
    const when = x => String(x).replace(/(record on )[^<.]*/, '$1');
    check('5b the printed page and the file are one page, standing on its own (no var())', when(pd.printHtml) === when(pd.savedHtml) && pd.savedHtml.length > 500 && !/var\(--/.test(pd.savedHtml));
    const po = await runAll('oblig');
    check('5c Obligations: the same, MK-V1-obligations.html, every duty', po.opened === 1 && po.printed[0] === 1 && JSON.stringify(po.saved) === '["MK-V1-obligations.html"]' && /Deliver the monthly service report/.test(po.savedHtml) && /Pay the first invoice/.test(po.savedHtml) && !/var\(--/.test(po.savedHtml), JSON.stringify(po.saved));
    const ph = await runAll('hist');
    check('5d History: its own report both ways (Export history\'s file, Print history\'s page)', ph.opened === 1 && ph.printed[0] === 1 && JSON.stringify(ph.saved) === '["MK-V1-negotiation-history.html"]', JSON.stringify(ph.saved));

    /* ===== 6. SHARE ===== */
    await page.click('#hb-cv-bar [data-hb-cv="deal"]'); await pause(300);
    await page.click('#hb-cv-bar [data-hb-cv-act="share"]'); await pause(200);
    const sh = await page.evaluate(() => { const f = document.querySelector('.hb-cv-share'); const btn = document.querySelector('[data-hb-cv-act="share"]');
      return f ? { opts: [...f.querySelectorAll('select option')].map(o => o.textContent), note: (f.querySelector('.hb-quiet') || {}).textContent || '', ta: !!f.querySelector('textarea'),
        under: f.getBoundingClientRect().top >= btn.getBoundingClientRect().bottom, inView: f.getBoundingClientRect().right <= innerWidth, foot: [...f.querySelectorAll('.hb-cv-sh-f button')].map(x => x.textContent) } : null; });
    check('6a Share opens its form under the button: colleagues only, a note, and it says it stays inside HaTi', !!sh && sh.opts.includes('Unrestricted Legal') && sh.ta && /stays inside HaTi/.test(sh.note) && /Parcelway ApS never sees it/.test(sh.note) && sh.under && sh.inView && JSON.stringify(sh.foot) === '["Give","Cancel"]', JSON.stringify(sh));
    await shot('6-share');
    await page.click('#hb-cv-bar [data-hb-cv-act="share"]'); await pause(150);
    const shut1 = await page.evaluate(() => !document.querySelector('.hb-cv-share'));
    await page.click('#hb-cv-bar [data-hb-cv-act="share"]'); await pause(150); await page.keyboard.press('Escape'); await pause(150);
    const shut2 = await page.evaluate(() => !document.querySelector('.hb-cv-share'));
    await page.click('#hb-cv-bar [data-hb-cv-act="share"]'); await pause(150); await page.click('#hb-cv-bar .hb-cv-for'); await pause(150);
    const shut3 = await page.evaluate(() => !document.querySelector('.hb-cv-share'));
    check('6b it closes on Share pressed again, on Esc, and on a press outside', shut1 && shut2 && shut3, JSON.stringify([shut1, shut2, shut3]));
    /* the colleague, signed in and working on another page before the give */
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', e => errors.push('colleague: ' + e.message));
    await p2.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p2.fill('#li-email', 'everything@example.co.ke'); await p2.fill('#li-pass', 'their-own-pass-9'); await p2.click('#li-go');
    await waitFor(p2, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-V1'), 20000);
    await p2.keyboard.press('Escape').catch(() => {});
    const en2 = await p2.$('.lang-btn[data-lang="en"]'); if (en2) await en2.click();
    await p2.evaluate(() => setView('register'));
    await page.click('#hb-cv-bar [data-hb-cv-act="share"]'); await pause(150);
    const uid = W.users.unrestricted.id;
    await page.selectOption('.hb-cv-share select', String(uid));
    await page.fill('.hb-cv-share textarea', 'Can you check 5 before I answer Erik?');
    await page.evaluate(() => { window._toasts = []; const t = window.toast; window.toast = (m, k) => { window._toasts.push([m, k]); return t && t(m, k); }; });
    await page.click('.hb-cv-share [type="submit"]');
    const given = await waitFor(page, () => window._toasts.some(([m, k]) => /Given to Unrestricted Legal/.test(m) && k === 'ok') && !document.querySelector('.hb-cv-share'), 6000);
    check('6c Give says so (ok) and the form goes', given, await page.evaluate(() => JSON.stringify(window._toasts)));
    const r1 = await W.admin.raw('/api/home/gifts', { method: 'POST', body: { to: W.users.restricted.id, kind: 'cv', spec: { v: 'deal', cid: 'MK-VB' } } });
    const r2 = await W.restricted.raw('/api/home/gifts', { method: 'POST', body: { to: W.users.unrestricted.id, kind: 'cv', spec: { v: 'deal', cid: 'MK-VB' } } });
    const r3 = await W.admin.raw('/api/home/gifts', { method: 'POST', body: { to: W.users.unrestricted.id, kind: 'cv', spec: { v: 'price', cid: 'MK-V1' } } });
    check('6d the server refuses a colleague who cannot open the contract, a contract the giver cannot see, and a view it does not know', r1.status === 400 && r2.status === 404 && r3.status === 400, JSON.stringify([r1.status, r2.status, r3.status]));
    /* the minute the bell waits between reads, passed */
    await p2.evaluate(() => hbGiftsLoad(true));
    const rang = await waitFor(p2, () => { try { return buildAlerts().some(a => a.kind === 'gift'); } catch (_){ return false; } }, 8000);
    const row = await p2.evaluate(() => (buildAlerts().find(a => a.kind === 'gift') || {}).text || '');
    check('6e the colleague\'s bell has it, off Home too: who gave which view of which contract', rang && /^Amina Otieno gave you MK-V1: Deal board$/.test(row), row);
    await p2.evaluate(() => openPanel('alerts')); await pause(400);
    await p2.click('[data-alert-kind="gift"]');
    const opened2 = await waitFor(p2, () => state.view === 'dashboard' && hbFace() === 'board' && (document.getElementById('hb-cv-body') || {}).getAttribute?.('data-hb-cv') === 'deal'
      && document.querySelectorAll('#hb-cv-body [data-rl-board-pick]').length === 3, 8000);
    check('6f its press opens the deal board of MK-V1 on their Board, and the row is gone', opened2 && await p2.evaluate(() => !buildAlerts().some(a => a.kind === 'gift')));
    await p2.click('#hb-cv-bar [data-hb-cv="book"]'); await pause(500);
    const card2 = await p2.evaluate(() => { const c = [...document.querySelectorAll('#hb-board .hb-card')].find(x => /Deal board · MK-V1/.test(x.textContent)); return c ? c.textContent.replace(/\s+/g, ' ') : ''; });
    check('6g and on their Board\'s book: the card, from whom, with the note, and its Open', /From Amina Otieno/.test(card2) && /Can you check 5 before I answer Erik\?/.test(card2) && /Open/.test(card2), card2.slice(0, 160));
    await p2.screenshot({ path: path.join(OUT, '6g-colleague-card.png') });
    await ctx2.close();

    /* ===== 7. THE DOORS ===== */
    const landsOn = async (fn, v) => { await page.evaluate(() => setView('register')); await pause(300);
      await page.evaluate(fn);
      return waitFor(page, want => state.view === 'dashboard' && hbFace() === 'board' && intel.paper && intel.paper.id === 'MK-V1'
        && (document.getElementById('hb-cv-body') || {}).getAttribute?.('data-hb-cv') === want, 8000, v); };
    check('7a the panel\'s old Deal door lands on the Board\'s deal board', await landsOn(() => pdOpenOnHome('MK-V1', 'deal'), 'deal'));
    check('7b the panel\'s old History door lands on the Board\'s history', await landsOn(() => pdOpenOnHome('MK-V1', 'hist'), 'hist'));
    await page.evaluate(() => { setView('dashboard'); hbSetFace('paper'); }); await pause(400);
    await page.evaluate(() => intelAsk('deal board MK-V1'));
    check('7c the words: "deal board MK-V1" turns the Board to it', await waitFor(page, () => hbFace() === 'board' && (document.getElementById('hb-cv-body') || {}).getAttribute?.('data-hb-cv') === 'deal', 8000));
    await page.evaluate(() => intelAsk('history'));
    check('7d and "history" with the contract on the paper, its history', await waitFor(page, () => (document.getElementById('hb-cv-body') || {}).getAttribute?.('data-hb-cv') === 'hist', 8000));
    await page.evaluate(() => { igPickAgain(); setView('register'); }); await pause(300);
    await page.evaluate(() => { state.activityFeed = [{ id: 'MK-V1', ref: 'MK-V1', txt: 'Proposed — Erik proposed 3 changes', at: new Date().toISOString(), when: 'now', cat: 'amber' }]; openPanel('activity'); });
    await pause(400);
    await page.click('#panel-body [data-sel-act="MK-V1"]');
    check('7e a row of the bell\'s trail opens that contract\'s history on the Board', await waitFor(page, () => state.view === 'dashboard' && hbFace() === 'board' && (document.getElementById('hb-cv-body') || {}).getAttribute?.('data-hb-cv') === 'hist' && intel.paper && intel.paper.id === 'MK-V1', 8000));
    await page.evaluate(() => { try { closeContextPanel(); } catch (_){} });

    /* ===== 8. A REFRESH ===== */
    await page.click('#hb-cv-bar [data-hb-cv="deal"]'); await pause(400);
    await page.evaluate(() => placeSave());
    await page.reload({ waitUntil: 'networkidle' });
    const back = await waitFor(page, () => window.state && state.view === 'dashboard' && (document.getElementById('hb-cv-body') || {}).getAttribute?.('data-hb-cv') === 'deal'
      && document.querySelectorAll('#hb-cv-body [data-rl-board-pick]').length === 3, 15000);
    check('8 a refresh comes back to the deal board of MK-V1', back, await page.evaluate(() => JSON.stringify({ view: state.view, face: window.hbFace && hbFace(), paper: intel.paper && intel.paper.id })));

    /* ===== 9. THE OWNER'S THREE SCREENS ===== */
    for (const [w, ht] of SCREENS){
      await page.setViewportSize({ width: w, height: ht }); await pause(500);
      for (const v of ['deal', 'oblig', 'hist']){
        await page.click(`#hb-cv-bar [data-hb-cv="${v}"]`); await pause(500);
        const m = await page.evaluate(() => { const bar = document.getElementById('hb-cv-bar'), host = document.getElementById('hb-cv-body'), brd = document.getElementById('hb-board');
          const kids = [...bar.children].filter(x => x.getBoundingClientRect().width > 0);
          const tops = kids.map(x => Math.round(x.getBoundingClientRect().top + x.getBoundingClientRect().height / 2));
          const acts = [...bar.querySelectorAll('[data-hb-cv-act]')].map(x => x.getBoundingClientRect());
          return { oneLine: Math.max(...tops) - Math.min(...tops) <= 4, side: document.documentElement.scrollWidth <= innerWidth + 1,
            seen: acts.every(r => r.right <= brd.getBoundingClientRect().right + 1 && r.bottom <= innerHeight),
            fills: Math.abs(host.getBoundingClientRect().bottom - brd.getBoundingClientRect().bottom) < 40 }; });
        check(`9 ${w}×${ht} ${v}: one line, its acts in sight, nothing sideways, the view fills the Board`, m.oneLine && m.side && m.seen && m.fills, JSON.stringify(m));
        await shot(`9-${w}x${ht}-${v}`);
      }
    }
    await page.setViewportSize({ width: 1440, height: 780 }); await pause(300);

    /* ===== 10. SVENSKA, AND THE PHONE ===== */
    const sv = await page.$('.lang-btn[data-lang="sv"]'); if (sv) await sv.click();
    await waitFor(page, () => /Förhandlingstavla/.test((document.getElementById('hb-cv-bar') || {}).textContent || ''), 6000);
    b = await page.evaluate(BAR);
    check('10a Svenska: the switch and its line in the reader\'s language', /^Din avtalsportfölj$/.test(b.tabs[0]) && /^Förhandlingstavla/.test(b.tabs[1]) && /^Åtaganden/.test(b.tabs[2]) && b.tabs[3] === 'Historik'
      && JSON.stringify(b.acts) === JSON.stringify(['Skriv ut', 'Dela', 'Ladda ner']) && /^för MK-V1/.test(b.who), JSON.stringify(b));
    await shot('10a-svenska');
    const en3 = await page.$('.lang-btn[data-lang="en"]'); if (en3) await en3.click();
    await pause(300);
    await page.setViewportSize({ width: 390, height: 844 }); await pause(500);
    await page.evaluate(() => hbOpenView('MK-V1', 'hist'));
    await pause(1200);
    const ph2 = await page.evaluate(() => ({ view: state.view, board: !!document.getElementById('hb-cv-bar') }));
    check('10b the phone opens the room\'s own tab', ph2.view !== 'dashboard' && !ph2.board, JSON.stringify(ph2));

    check('no page error', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run completed', false, e.stack || e.message);
  } finally {
    await browser.close();
    await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
