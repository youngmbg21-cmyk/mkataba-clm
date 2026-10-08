/* THE REVIEW GATE NAMES THE CHANGE NOBODY WAS ASKED ABOUT — 9 Oct 2026 review.
 *
 * Measured: with the review gate on, Send all refused a brand-new change that
 * had never been reviewed with "These changes are with <reviewer> for internal
 * review…" — naming the reviewer of an OLD request still open on another
 * change — and gave no way forward.
 *
 * Driven on a real server, the gate on, two people:
 *   1. a colleague files CHG-A and asks the admin to review it; then files
 *      CHG-B and asks nobody;
 *   2. pressing Send refuses with "#CHG-B has not been reviewed — ask a
 *      colleague…", says the other change is with the admin, and the toast
 *      carries the Review door;
 *   3. pressing that door opens the review dialog on CHG-B.
 * Every driven half is guarded, so a missing feature REPORTS rather than times
 * out (the house rule). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'review-gate-names-the-change');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (n, g, d) => { g ? pass++ : fail++; console.log(`${g ? 'PASS' : 'FAIL'}  ${n}${d != null ? ' — ' + d : ''}`); };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DEAL = {
  id: 'MK-G1', contractNo: 'MK-G1', name: 'Distribution Agreement',
  counterparty: 'Saw Sawa LLC', counterpartyEmail: 'ola@sawsawa.example',
  folder: 'proc', value: 900000, valueType: 'standard', status: 'Under Review',
  template: 'RM', lastAction: '2 Oct 2026', expiry: '2029-03-31', hash: null, signedAt: null,
  fields: {}, metadata: { value: 900000, currency: 'SEK' },
  comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }],
  changes: [], negotiation: { round: 1, rounds: [] },
  body: '<h2>4. Payment Terms</h2><p>Invoices are payable within 60 days.</p>'
    + '<h2>9. Liability Cap</h2><p>Liability is limited to 150% of fees paid.</p>',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [DEAL, ...FIXTURES], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (p, fn, arg, ms = 12000) => p.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  const login = async (email, pw, tag) => {
    const p = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
    p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p.fill('#li-email', email); await p.fill('#li-pass', pw); await p.click('#li-go');
    await until(p, () => typeof currentUser === 'function' && !!currentUser(), null, 15000);
    await until(p, () => typeof getContract === 'function' && !!getContract('MK-G1'), null, 15000);
    return p;
  };
  const file = (p, idx, add) => p.evaluate(async a => {
    const c = getContract('MK-G1'); c._loaded = false; await ensureFull(c);
    const cl = negoClauseList(c)[a.idx];
    if (!cl) return { err: 'no clause ' + a.idx };
    const now = negoClauseNowById(c, cl.clauseId);
    const body = (now && now.bodyHtml) || ('<p>' + ((now && now.text) || '') + '</p>');
    const ch = await negoEditClause(c, cl.clauseId, body + '<p>' + a.add + '</p>', { side: 'owner', author: currentUser().name });
    if (window.persist) persist(c);
    if (window.flushSaves) await flushSaves();
    return ch ? { id: ch.id } : { err: 'nothing filed' };
  }, { idx, add });
  try {
    const admin = await login('admin@example.co.ke', 'adminpassword1', 'admin');
    const on = await admin.evaluate(async () => {
      saveReviewGateCfg({ on: true, when: 'always', value: 0 });
      if (window.flushSaves) await flushSaves();
      return reviewGateCfg().on;
    });
    ok('0 the review gate is on', on === true, String(on));
    const me = await login('everything@example.co.ke', 'their-own-pass-9', 'colleague');
    const a = await file(me, 0, 'Late payment carries interest at 2% a month.');
    const asked = await me.evaluate(async id => {
      const c = getContract('MK-G1');
      const boss = (getUsers() || []).find(u => u.email === 'admin@example.co.ke');
      const rv = reviewAsk(c, { reviewer: { id: boss.id, name: boss.name, email: boss.email }, ids: [id], by: currentUser().name });
      if (window.persist) persist(c);
      if (window.flushSaves) await flushSaves();
      return { rv: !!rv, boss: boss.name };
    }, a.id);
    ok('1a the colleague asks the admin to review the first change', !!a.id && asked.rv, JSON.stringify({ a, asked }));
    const b = await file(me, 1, 'The cap shall not apply to product recalls.');
    ok('1b and files a second change nobody was asked about', !!b.id, JSON.stringify(b));

    await me.evaluate(async () => { await openRedlineWorkbench('MK-G1'); await new Promise(r => setTimeout(r, 900)); });
    const pressed = await me.evaluate(() => {
      const s = document.querySelector('#nego-send');
      if (!s) return false;
      s.click(); return true;
    });
    ok('2a the Send postbox is on the page', pressed);
    const toast = await until(me, () => [...document.querySelectorAll('#toast-root > div')].some(t => /has not been reviewed/.test(t.textContent)), null, 5000)
      ? await me.evaluate(() => {
        const t = [...document.querySelectorAll('#toast-root > div')].find(x => /has not been reviewed/.test(x.textContent));
        const btn = t.querySelector('[data-toast-act]');
        return { text: t.textContent.replace(/\s+/g, ' ').trim(), door: btn ? btn.textContent.trim() : null };
      }) : null;
    ok('2b the refusal names the change nobody was asked about',
      !!toast && new RegExp('#' + b.id + ' has not been reviewed — ask a colleague').test(toast.text), toast && toast.text);
    ok('2c and names the reviewer only for the change that is with them',
      !!toast && /The other change is with/.test(toast.text) && !/These changes are with/.test(toast.text), toast && toast.text);
    ok('2d the refusal carries the Review door', !!toast && !!toast.door, toast && toast.door);
    await me.screenshot({ path: path.join(OUT, '1-the-refusal.png') });
    if (toast && toast.door){
      await me.click('#toast-root [data-toast-act]');
      const dlg = await until(me, () => !!document.querySelector('.modal-in, [role="dialog"]'), null, 5000);
      const picked = dlg ? await me.evaluate(() => {
        const box = document.querySelector('.modal-in, [role="dialog"]');
        return [...document.querySelectorAll('.rv-pickch')].filter(x => x.checked).map(x => x.getAttribute('data-rv-ch')).join(',');
      }) : '';
      ok('3 the door opens the review dialog on that change, and only that one ticked', dlg && picked === b.id, picked);
      await me.screenshot({ path: path.join(OUT, '2-the-review-door.png') });
    }
  } catch (e) { ok('the run finished', false, String(e && e.stack || e)); }
  ok('no page error anywhere in the run', errs.length === 0, errs.join(' | ') || 'none');
  await browser.close();
  await h.stop().catch(() => {});
  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
