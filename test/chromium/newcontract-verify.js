/* Chromium verification: EVERY WAY OF MAKING A CONTRACT ASKS THE SAME THINGS.
   ============================================================
   Reported by the owner: creating from a HaTi standard template popped up a
   form asking who the contract is with, what it is worth and when it runs —
   and creating from a COMPANY standard template asked nothing at all. It
   created the contract and dropped you in the workspace with the counterparty,
   the value and the dates all empty.

   Those five facts are not template wording. They are the contract record: the
   register filters on the counterparty, the reports total the value, the
   calendar runs off the dates, and sharing and signing both need the email.
   Which template the document came from is no reason to ask or not ask.

   So this asserts, for every path that makes a contract from a template:
     1  the essentials form appears
     2  filling it in puts the answers ON the contract
     3  "Skip for now" still creates the draft, with the fields left empty —
        because somebody drafting for their own file may not know the
        counterparty yet, and refusing over it would be worse

   Run: node test/chromium/newcontract-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const FORM = () => {
  const has = id => !!document.getElementById(id);
  return { open: has('ce-create'), skip: has('ce-skip'), cancel: has('ce-cancel'),
    fields: ['ce-counterparty', 'ce-cpemail', 'ce-value', 'ce-effDate', 'ce-expiry'].filter(has) };
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);

  /* A published company standard template — the path that asked nothing. */
  const t = await W.admin.json('/api/templates', { method: 'POST', body: {
    name: 'Master Services Agreement', category: 'sales', description: 'Company standard.' } });
  const tid = t.template.id;
  const vers = await W.admin.json(`/api/templates/${tid}`);
  const vid = (vers.versions && vers.versions[0] && vers.versions[0].id) || vers.template.latestVersionId;
  await W.admin.json(`/api/templates/${tid}/versions/${vid}`, { method: 'PUT', body: {
    blocks: [{ orderIndex: 0, blockType: 'heading', content: '1. Services' },
             { orderIndex: 1, blockType: 'fixed_text', content: '<p>The Supplier shall supply.</p>' }],
    fields: [] } });
  await W.admin.json(`/api/templates/${tid}/versions/${vid}/publish`, { method: 'POST', body: {} });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2400);

  /* ---------- 1. COMPANY STANDARD TEMPLATE — the reported gap ---------- */
  await page.evaluate(id => window.tplLibNewContract(id), tid);
  await page.waitForTimeout(700);
  let m = await page.evaluate(FORM);
  check('company standard template: the form appears at all',
    m.open, m.open ? `${m.fields.length} fields` : 'no form — this is the reported defect');
  check('company standard template: it asks all five essentials',
    m.fields.length === 5, m.fields.join(', '));
  check('company standard template: Skip is offered', m.skip);

  const before = await page.evaluate(() => window.state.contracts.length);
  await page.fill('#ce-counterparty', 'Naivas Supermarkets Ltd');
  await page.fill('#ce-cpemail', 'legal@naivas.co.ke');
  await page.fill('#ce-value', '2500000');
  await page.fill('#ce-effDate', '2026-09-01');
  await page.fill('#ce-expiry', '2027-08-31');
  await page.click('#ce-create');
  await page.waitForTimeout(1800);
  const made = await page.evaluate(() => {
    const c = window.state.contracts[0];
    return c ? { id: c.id, cp: c.counterparty, em: c.counterpartyEmail, val: c.value,
      exp: c.expiry, eff: (c.fields || {}).effDate, n: window.state.contracts.length } : null;
  });
  check('company standard template: the draft is created', made && made.n === before + 1, made ? made.id : 'none');
  check('company standard template: the counterparty lands on the contract',
    made && made.cp === 'Naivas Supermarkets Ltd', made && made.cp);
  check('company standard template: the email lands on the contract',
    made && made.em === 'legal@naivas.co.ke', made && made.em);
  check('company standard template: the value lands on the contract',
    made && Number(made.val) === 2500000, made && String(made.val));
  check('company standard template: the dates land on the contract',
    made && made.eff === '2026-09-01' && made.exp === '2027-08-31', made && `${made.eff} → ${made.exp}`);

  /* ---------- 2. SKIP still creates the draft ---------- */
  await page.evaluate(() => window.setView('templates'));
  await page.waitForTimeout(500);
  const beforeSkip = await page.evaluate(() => window.state.contracts.length);
  await page.evaluate(id => window.tplLibNewContract(id), tid);
  await page.waitForTimeout(700);
  await page.click('#ce-skip');
  await page.waitForTimeout(1800);
  const skipped = await page.evaluate(() => {
    const c = window.state.contracts[0];
    return { n: window.state.contracts.length, cp: c && c.counterparty, id: c && c.id };
  });
  check('Skip for now still creates the draft',
    skipped.n === beforeSkip + 1, `${beforeSkip} → ${skipped.n}`);
  check('Skip for now leaves the fields empty rather than inventing them',
    !skipped.cp, `counterparty="${skipped.cp}"`);

  /* ---------- 3. HaTi STANDARD TEMPLATE — already asked, now also skippable ---------- */
  await page.evaluate(() => window.setView('templates'));
  await page.waitForTimeout(400);
  const tplId = await page.evaluate(() => {
    const ts = window.myCreatableTemplates ? window.myCreatableTemplates() : [];
    return ts.length ? ts[0].id : null;
  });
  check('a HaTi standard template is available to test', !!tplId, String(tplId));
  if (tplId) {
    await page.evaluate(id => window.openWizard(id), tplId);
    await page.waitForTimeout(700);
    const wz = await page.evaluate(() => ({
      create: !!document.getElementById('wz-create'), skip: !!document.getElementById('wz-skip') }));
    check('HaTi standard template: the form still appears', wz.create);
    check('HaTi standard template: Skip is now offered too', wz.skip);
    const beforeW = await page.evaluate(() => window.state.contracts.length);
    await page.click('#wz-skip');
    await page.waitForTimeout(1200);
    const afterW = await page.evaluate(() => ({
      n: window.state.contracts.length, cp: window.state.contracts[0].counterparty }));
    check('HaTi standard template: Skip creates the draft with blanks intact',
      afterW.n === beforeW + 1 && !afterW.cp, `${beforeW} → ${afterW.n}, counterparty="${afterW.cp}"`);
  }

  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  await browser.close();
  await h.stop();
  process.exit(pass === results.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
