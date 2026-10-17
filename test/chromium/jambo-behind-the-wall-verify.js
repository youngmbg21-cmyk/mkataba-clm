/* JAMBO BEHIND THE WALL — where the reader looks
   ================================================
   Owner picked "One press — the SAP way", 17 Oct 2026 (piece 3 of the
   sensitive-contracts plan; decision 2: Jambo reads a private folder's
   contracts only when one of its people asks). f697 asks the server's night
   helpers. This file asks the reader's questions in a real browser:
     1 · a private contract on Home's Board: its "What Jambo read" section
         says "Not read · private folder" and carries one press, Read it now,
         with its cost; the readings it would fill say "Not read yet"; and
         bringing it up spent nothing
     2 · no door reads it unasked — arrival, the send-for-review moment, the
         one launcher — while a contract outside a private folder still reads
         on arrival (the rule both ways)
     3 · its Clauses tab does not read itself either: it says so, with the
         same press and its cost
     4 · Read it now reads it: the ring turns, Jambo is asked, the state goes
     5 · Svenska; the owner's three screens (the press on screen, nothing
         scrolls sideways)
   Run: node test/chromium/jambo-behind-the-wall-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startAiStub, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'jambo-behind-the-wall');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0, passes = 0;
const check = (ok, what, detail) => {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail ? ' — ' + detail : ''));
  if (ok) passes++; else failures++;
};
/* A WAIT ASKS FOR THE STATE, BOUNDED — never a fixed pause */
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};

const B3 = { ...fixtureContract('MK-B3', 'Uploaded Listing Terms', 'Carrefour Kenya', 'sales', 5000000, 'Under Review',
  'LISTING TERMS\n\n1. Payment\n\nPayment is due within thirty days of invoice.\n\n2. Term\n\nThis agreement runs for one year.'), template: null };

(async () => {
  const ai = await startAiStub();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  const W = await seedWorkspace(h, { contracts: FIXTURES.concat([B3]), approvalRules: [] });
  const adminId = (await W.admin.json('/api/bootstrap')).me.id;
  /* the admin names themself: Sales is private, and theirs to open */
  await W.admin.json('/api/private-streams/sales', { method: 'PUT', body: { on: true, ids: [adminId] } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const P = await ctx.newPage();
    P.setDefaultTimeout(6000);
    P.on('pageerror', e => errors.push(String(e && e.message || e)));
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke');
    await P.fill('#li-pass', 'adminpassword1');
    await P.click('#li-go');
    await until(P, () => !!(window.currentUser && currentUser() && typeof getContract === 'function' && getContract('MK-B3')), null, 15000);
    /* every Jambo route the page asks is counted, and still answered */
    await P.evaluate(() => {
      state.aiConfigured = true;
      window.__ai = [];
      const o = window.api;
      window.api = function (p, ...a){ if (/^ai\//.test(String(p))) window.__ai.push(String(p)); return o.call(this, p, ...a); };
    });
    const aiCalls = () => P.evaluate(() => window.__ai.slice());

    /* ============ 1. THE PANEL: THE STATE AND THE ONE PRESS ============ */
    check(await P.evaluate(() => jamboOnPress(getContract('MK-B3')) && !jamboOnPress(getContract('MK-A2'))), '1a a contract in the private folder waits for a press; one outside it does not');
    await P.evaluate(() => hbStripBring('MK-B3', 'ov'));
    const up = await until(P, () => !!document.querySelector('#bs-strip-MK-B3 .bs-jb .bs-jb-state') && !!(getContract('MK-B3') || {})._loaded, null, 10000);
    const sec = await P.evaluate(() => {
      const s = document.querySelector('#bs-strip-MK-B3 .bs-jb'); if (!s) return null;
      const cell = k => { const c = s.querySelector(`[data-bs-jcell="${k}"]`); return c ? c.innerText.replace(/\s+/g, ' ') : ''; };
      return { state: (s.querySelector('.bs-jb-state') || {}).innerText, btn: (s.querySelector('[data-bs-go="read"]') || {}).innerText,
        cost: [...s.querySelectorAll('.bs-sec-h .bs-note')].map(n => n.innerText).join(' '), line: (s.querySelector('.bs-brief') || {}).innerText,
        risks: cell('risks'), std: cell('std') };
    });
    check(up && sec && sec.state === 'Not read · private folder', '1b the section says it is not read, and why', sec && sec.state);
    check(!!sec && sec.btn === 'Read it now' && /About three Jambo calls/.test(sec.cost), '1c one press, Read it now, its cost beside it', sec && `${sec.btn} / ${sec.cost}`);
    check(!!sec && /only when one of its people asks/.test(sec.line || ''), '1d one sentence says why it waits', sec && sec.line);
    check(!!sec && /—/.test(sec.risks) && /Not read yet/.test(sec.risks) && /Not read yet/.test(sec.std), '1e the readings it would fill say "Not read yet", not a count never taken', sec && `${sec.risks} | ${sec.std}`);
    check((await aiCalls()).length === 0, '1f bringing it up asked Jambo nothing', (await aiCalls()).join(','));

    /* ============ 2. NO DOOR READS IT UNASKED ============ */
    await P.evaluate(() => { const c = getContract('MK-B3'); contractArrived(c); triageAndPaint(c); triageAndPaint(c, { fresh: true }); });
    await P.waitForLoadState('networkidle');
    check((await aiCalls()).length === 0, '2a arrival and the one launcher leave a private contract unread', (await aiCalls()).join(','));
    const ctrl = await P.evaluate(async () => { const c = getContract('MK-A2'); if (c._light && !c._loaded) await ensureFull(c); const p = triageAndPaint(c); try { await p; } catch (_) {} return window.__ai.length; });
    check(ctrl > 0, '2b the same launcher still reads a contract outside a private folder (the rule both ways)', `${ctrl} Jambo calls`);
    await P.evaluate(() => { window.__ai.length = 0; });

    /* ============ 3. ITS CLAUSES TAB WAITS TOO ============ */
    await P.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-B3', 'doc'); });
    const rows = await until(P, () => !!document.querySelector('#pd-thread .doc-th-row') && !!document.querySelector('#pd-thread .stk-head'), null, 10000);
    const head = await P.evaluate(() => { const hd = document.querySelector('#pd-thread .stk-head'); return hd ? { state: (hd.querySelector('.jb-state') || {}).innerText, btn: (hd.querySelector('[data-stk-run]') || {}).innerText, text: hd.innerText.replace(/\s+/g, ' ') } : null; });
    check(rows && !!head && head.state === 'Not read · private folder' && head.btn === 'Read it now', '3a Clauses says it is not read, with the same press', head && head.text);
    check(!(await aiCalls()).some(p => /breakdown/.test(p)), '3b opening Clauses read nothing', (await aiCalls()).join(','));
    await P.evaluate(() => { setView('dashboard'); if (typeof hbSetFace === 'function') hbSetFace('board'); hbStripBring('MK-B3', 'ov'); });
    await until(P, () => !!document.querySelector('#bs-strip-MK-B3 [data-bs-go="read"]'));

    /* ============ 5 (first). THE OWNER'S THREE SCREENS, BEFORE THE PRESS ============ */
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await P.setViewportSize(vp);
      await P.evaluate(() => { const b = document.querySelector('#bs-strip-MK-B3 [data-bs-go="read"]'); if (b) b.scrollIntoView({ block: 'center' }); });
      const fit = await P.evaluate(() => {
        const b = document.querySelector('#bs-strip-MK-B3 [data-bs-go="read"]'); if (!b) return { press: false };
        const r = b.getBoundingClientRect(); const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        const s = document.querySelector('#bs-strip-MK-B3');
        return { press: !!at && (at === b || b.contains(at)), side: s.scrollWidth - s.clientWidth, page: document.documentElement.scrollWidth - innerWidth };
      });
      check(fit.press && fit.side <= 1 && fit.page <= 1, `5a at ${vp.width}×${vp.height}: Read it now on screen, nothing scrolls sideways`, JSON.stringify(fit));
      await P.screenshot({ path: path.join(OUT, `waiting-${vp.width}x${vp.height}.png`) });
    }
    await P.setViewportSize({ width: 1440, height: 780 });

    /* ============ 4. READ IT NOW READS IT ============ */
    await P.click('#bs-strip-MK-B3 [data-bs-go="read"]');
    const ring = await until(P, () => !!document.querySelector('#bs-strip-MK-B3 .bs-jb .ob-spin') || window.__ai.length > 0, null, 4000);
    check(ring, '4a the press turns the ring');
    const asked = await until(P, () => window.__ai.length > 0, null, 10000);
    check(asked, '4b and Jambo is asked', (await aiCalls()).join(','));
    const done = await until(P, () => { const s = document.querySelector('#bs-strip-MK-B3 .bs-jb'); return !!s && !s.querySelector('.bs-jb-state') && !s.querySelector('.ob-spin'); }, null, 20000);
    const tri = await P.evaluate(() => !!(getContract('MK-B3') || {}).triage);
    check(done && tri, '4c read, the state and the press are gone and the reading is on the record');

    /* ============ 5. SVENSKA ============ */
    await W.admin.json('/api/private-streams/sales', { method: 'PUT', body: { on: true, ids: [adminId] } });
    const sv = await P.evaluate(() => { langSet('sv'); const c = getContract('MK-A1'); return { s: i18t('jb_state_private'), b: i18t('jb_read_now'), cost: i18t('jb_read_cost'), c: !!c }; });
    check(sv.s === 'Inte läst · privat mapp' && sv.b === 'Läs det nu' && /Jambo-anrop/.test(sv.cost), '5b in Swedish: Inte läst · privat mapp, Läs det nu, Jambo-anrop', JSON.stringify(sv));
    await P.evaluate(() => langSet('en'));

    check(!errors.length, '6 no page errors', errors.join(' | ').slice(0, 300));
  } finally {
    await browser.close();
    await h.stop();
    await ai.stop();
  }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
