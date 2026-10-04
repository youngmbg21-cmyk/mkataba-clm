'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   APPROVE FROM THE LIST — and the rules page, and Decline & close
   (4 Oct 2026, the process review; f466, f467 are the node halves)

   Driven where the reader looks:
     1  Approvals & signing, the inspector: a step this reader may decide
        carries Approve and Refuse in the panel; Refuse with no reason refuses
        nothing; with a reason the STORED step is refused with it; Approve
        stores the approval; the row leaves the list. Opening the Signing tab
        is still there.
     2  Settings → "Who must say yes before signing": nine painted rows, each
        with a door, and a door lands on its rule's own drawer.
     3  Contracts → Decline & close asks the reason and the stored record is
        Declined.
   ═══════════════════════════════════════════════════════════════════════════ */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const signIn = async (page, base, email, pass) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector('#li-email', { timeout: 15000 });
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, { timeout: 15000 });
};
/* A wait asks for the state, bounded. */
const until = async (page, fn, arg, ms = 6000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};
const PAINTED = sel => {
  const el = document.querySelector(sel);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if (!(r.width > 0 && r.height > 0)) return false;
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!hit && (hit === el || el.contains(hit));
};

const RULES = [{ id: 'r-fin', name: 'Finance director', order: 1,
  cond: { type: 'value', op: '>=', value: 1000000 }, approver: { kind: 'role', role: 'admin' } }];

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: RULES });
  const mk = async (id, name) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
    id, name, counterparty: 'Nordkust Industri AB', folder: FOLDER_A, status: 'Under Review', value: 6000000,
    valueType: 'estimated', template: 'RM', fields: {}, metadata: {}, comments: [], audit: [], signatures: [],
    owner: { id: W.users.unrestricted.id, name: W.users.unrestricted.name } } } });
  await mk('MK-AFL-1', 'Steel Supply');
  await mk('MK-AFL-2', 'Copper Supply');
  await mk('MK-AFL-3', 'Zinc Supply');
  const stored = async id => W.admin.json('/api/contracts/' + id);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page, h.base, 'admin@example.co.ke', 'adminpassword1');

    /* ============ 1. APPROVE AND REFUSE FROM THE LIST ============ */
    await page.evaluate(() => { apSetTab('approvals'); setView('approvals'); });
    const listed = await until(page, () => !!document.querySelector('[data-ap-row="MK-AFL-1"]'));
    check('1a. the step waiting on this reader is listed', listed);
    if (listed) {
      await page.click('[data-ap-row="MK-AFL-1"]');
      const verbs = await until(page, () => !!document.querySelector('#ins-panel [data-ins-act="approve"]'));
      check('1b. the panel carries Approve and Refuse, painted',
        verbs && await page.evaluate(PAINTED, '#ins-panel [data-ins-act="approve"]')
          && await page.evaluate(PAINTED, '#ins-panel [data-ins-act="refuse"]'));
      check('1c. and opening the Signing tab is still there',
        await page.evaluate(() => !!document.querySelector('#ins-panel [data-ins-act="gate"]')));

      /* Refuse, saying nothing: nothing is refused */
      await page.click('#ins-panel [data-ins-act="refuse"]');
      const asked = await until(page, () => !!document.getElementById('pd-input'));
      check('1d. Refuse asks the reason', asked);
      if (asked) { await page.click('#pd-ok'); }
      await page.waitForTimeout(400);
      let s = await stored('MK-AFL-1');
      check('1e. an empty reason refuses nothing', !((s.approvalChain || []).some(x => x.status === 'rejected')),
        JSON.stringify(s.approvalChain || null));

      /* Refuse, with a reason */
      await page.click('[data-ap-row="MK-AFL-1"]');
      await until(page, () => !!document.querySelector('#ins-panel [data-ins-act="refuse"]'));
      await page.click('#ins-panel [data-ins-act="refuse"]');
      await until(page, () => !!document.getElementById('pd-input'));
      await page.fill('#pd-input', 'The cap is below our floor.');
      await page.click('#pd-ok');
      const gone = await until(page, () => !document.querySelector('[data-ap-row="MK-AFL-1"]'));
      for (let i = 0; i < 30; i++) { s = await stored('MK-AFL-1'); if ((s.approvalChain || []).length) break; await page.waitForTimeout(150); }
      const step = (s.approvalChain || [])[0] || {};
      check('1f. with a reason, the STORED step is refused and carries it',
        step.status === 'rejected' && /below our floor/.test(step.comment || ''), JSON.stringify(step));
      check('1g. and the row leaves the list', gone);

      /* Approve */
      await page.click('[data-ap-row="MK-AFL-2"]');
      await until(page, () => !!document.querySelector('#ins-panel [data-ins-act="approve"]'));
      await page.click('#ins-panel [data-ins-act="approve"]');
      await until(page, () => !document.querySelector('[data-ap-row="MK-AFL-2"]'));
      for (let i = 0; i < 30; i++) { s = await stored('MK-AFL-2'); if ((s.approvalChain || []).length) break; await page.waitForTimeout(150); }
      check('1h. Approve stores the approval in the approver\'s name',
        ((s.approvalChain || [])[0] || {}).status === 'approved' && ((s.approvalChain || [])[0] || {}).by === 'Amina Otieno',
        JSON.stringify(s.approvalChain || null));
    } else {
      for (const n of ['1b', '1c', '1d', '1e', '1f', '1g', '1h']) check(n + '. (no row to press)', false);
    }

    /* ============ 2. THE RULES PAGE ============ */
    await page.evaluate(() => openSettingsAt('platform', 'rules'));
    const rules = await until(page, () => document.querySelectorAll('#st-rules-list [data-st-rule]').length === 9);
    check('2a. "Who must say yes before signing" draws nine rules', rules,
      String(await page.evaluate(() => document.querySelectorAll('#st-rules-list [data-st-rule]').length)));
    check('2b. each row is painted with a door',
      await until(page, PAINTED, '#st-rules-list [data-st-rule="approval"] [data-st-rule-go]'));
    await page.click('#st-rules-list [data-st-rule="signcap"] [data-st-rule-go]');
    check('2c. a door lands on its rule\'s own drawer', await until(page, () => !!document.getElementById('sc-rule-on')));

    /* ============ 3. DECLINE & CLOSE ============ */
    await page.keyboard.press('Escape');
    await page.evaluate(() => setView('contracts'));
    await page.waitForTimeout(600);
    await page.evaluate(() => regDeclineAsk(getContract('MK-AFL-3')));
    const dq = await until(page, () => !!document.getElementById('pd-input'));
    check('3a. Decline & close asks the reason', dq);
    if (dq) {
      await page.fill('#pd-input', 'They chose another supplier.');
      await page.click('#pd-ok');
    }
    let d = null;
    for (let i = 0; i < 30; i++) { d = await stored('MK-AFL-3'); if (d.status === 'Declined') break; await page.waitForTimeout(150); }
    check('3b. the stored contract is Declined, with the reason on its history',
      d.status === 'Declined' && (d.audit || []).some(a => a.action === 'Declined' && /another supplier/.test(a.detail || '')), d.status);

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  const ok = results.filter(r => r.pass).length;
  console.log(`\n${ok}/${results.length} passed`);
  process.exit(ok === results.length ? 0 : 1);
})();
