/* ============================================================
   requests-reach-the-team-verify — the Requests stream of the process
   review (4 Oct 2026), driven in a real Chromium against a real server:
     1 · a colleague's request is a row in the editor's bell, and the press
         lands on the Requests page with that request lit;
     2 · the ask form draws the essentials Create asks, all optional, and
         the window holds them without a sideways scroll;
     3 · Draft it opens the ordinary drafting screen with the request's
         answers already in its boxes, and Create links the new contract
         to the request as "drafted, not yet sent".
   Run: node test/chromium/requests-reach-the-team-verify.js
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'requests-reach-the-team');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
};
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Young Mbagaya');
    await page.fill('#su-email', 'admin@example.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample'); if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go'); await page.waitForTimeout(3500); await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(800); }
    await page.evaluate(async () => {
      try { await api('users', 'POST', { name: 'Faith Njeri', email: 'faith@highland.co.ke', role: 'viewer', password: 'memberpass123' }); } catch (e) {}
    });

    /* A colleague who may not draft raises a request, from her own session. */
    const faith = h.client('faith');
    await faith.json('/api/login', { method: 'POST', body: { email: 'faith@highland.co.ke', password: 'memberpass123' } });
    await faith.json('/api/password/change', { method: 'POST', body: { current: 'memberpass123', password: 'faiths-own-pass-9' } });
    const made = await faith.json('/api/intake', { method: 'POST', body: {
      title: 'Cold-chain storage for the coast', need: 'We need cold storage at the Mombasa depot from November.',
      counterparty: 'Polar Stores Ltd', answers: { cpemail: 'legal@polar.example', effDate: '2026-11-01', expiry: '2027-10-31', side: 'customer' } } });
    const rid = made.request.id;

    /* ---- 1 · THE BELL ---- */
    await page.evaluate(async () => { await intakeRefresh(); });
    const bell = await page.evaluate(id => buildAlerts().filter(a => a.kind === 'request').map(a => ({ text: a.text, sub: a.sub })), rid);
    ok('1a the request is a row in the editor\'s bell', bell.length === 1 && /Cold-chain storage/.test(bell[0].text), bell);
    ok('1b the row says who asked', bell[0] && /Faith Njeri/.test(bell[0].sub || ''), bell[0] && bell[0].sub);
    await page.evaluate(() => openPanel('alerts')); await page.waitForTimeout(500);
    const row = await page.$('[data-alert-kind="request"]');
    ok('1c it is drawn in the panel', !!row);
    await page.screenshot({ path: path.join(OUT, '1-bell.png') });
    if (row) { await row.click(); }
    const landed = await until(page, id => state.view === 'intake' && /Cold-chain storage/.test((document.getElementById('ins-panel') || {}).textContent || ''), rid);
    ok('1d the press lands on Requests with that request lit', landed,
      await page.evaluate(() => ({ view: state.view, panel: ((document.getElementById('ins-panel') || {}).textContent || '').slice(0, 80) })));
    await page.screenshot({ path: path.join(OUT, '1d-landed.png') });

    /* ---- 2 · THE FORM ---- */
    await page.evaluate(() => openIntakeForm()); await page.waitForTimeout(500);
    const form = await page.evaluate(() => {
      const ids = ['ik-title', 'ik-need', 'ik-e-party', 'ik-cp', 'ik-e-cpemail', 'ik-e-value', 'ik-e-side', 'ik-e-effDate', 'ik-e-expiry', 'ik-folder'];
      const missing = ids.filter(id => !document.getElementById(id));
      const box = document.querySelector('#modal-root [role="dialog"], #modal-root .modal-card') || document.getElementById('ik-title').closest('div[style*="padding:24px"]');
      const sc = box ? box.scrollWidth - box.clientWidth : 0;
      return { missing, sideways: sc, party: (document.getElementById('ik-e-party') || {}).value || '' };
    });
    ok('2a the essentials Create asks are on the form', form.missing.length === 0, form);
    ok('2b our party is filled with the workspace, for them to overtype', !!form.party, form.party);
    ok('2c nothing scrolls sideways', form.sideways <= 1, form.sideways);
    await page.screenshot({ path: path.join(OUT, '2-form.png') });
    await page.fill('#ik-title', 'x'); await page.fill('#ik-need', 'y'); await page.fill('#ik-e-cpemail', 'not-an-address');
    await page.click('#ik-send'); await page.waitForTimeout(300);
    const refused = await page.evaluate(() => (document.getElementById('ik-err') || {}).textContent || '');
    ok('2d a bad email is refused in words, on the form', /email/i.test(refused), refused);
    await page.evaluate(() => closeModal()); await page.waitForTimeout(300);

    /* ---- 3 · DRAFT IT ---- */
    await page.evaluate(id => intakeDraft(id), rid);
    const opened = await until(page, () => !!document.getElementById('na-root') && !!document.querySelector('#na-form input'));
    ok('3a Draft it opens the ordinary drafting screen', opened);
    const pre = await page.evaluate(() => {
      const vals = [...document.querySelectorAll('#na-form input, #na-form select')].map(e => e.value);
      return { has: vals.some(v => v === 'Polar Stores Ltd'), mail: vals.some(v => v === 'legal@polar.example'), start: vals.some(v => v === '2026-11-01') };
    });
    ok('3b the request\'s answers are already in its boxes', pre.has && pre.mail && pre.start, pre);
    await page.screenshot({ path: path.join(OUT, '3-drafting.png') });
    await page.click('#na-create');
    const linked = await until(page, id => { const r = (_intakeState.list || []).find(x => x.id === id); return !!(r && r.status === 'drafted' && r.contractId); }, rid, 12000);
    const after = await page.evaluate(id => { const r = (_intakeState.list || []).find(x => x.id === id) || {};
      const c = r.contractId ? getContract(r.contractId) : null;
      return { status: r.status, contractId: r.contractId, onRecord: c ? c.intakeRequestId : null, cp: c ? c.counterparty : null }; }, rid);
    ok('3c Create links the contract to the request — drafted, not yet sent', linked && after.onRecord === rid, after);
    ok('3d the contract carries the request\'s counterparty', after.cp === 'Polar Stores Ltd', after.cp);
    ok('4 [control] the whole journey raised no page error', errs.length === 0, errs.length ? errs : 'clean');
  } catch (e) {
    ok('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
