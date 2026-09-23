/* Chromium verification: APPROVAL BEFORE SIGNING (Young ruled 23 Sep 2026:
   "Implement scenario 2").
   ============================================================
   The whole journey, driven with real presses on the real app, three people:
     1  the admin sets it on the person — Off | Always, who approves, who
        steps in, when it bites — and the People row says it; the old
        workspace switch is gone from the approval rules panel;
     2  the lead is at the door: the readiness list holds on "Approval: not
        asked yet", the Sign button reads "Send for approval", and the other
        side's row on the signing order waits;
     3  the request window says who approves, who steps in and exactly what is
        approved; sending it emails the approver and the button says who it
        waits on;
     4  the approver finds it on their Approvals page and on the contract's
        own card; a refusal needs a reason and goes back to the lead;
     5  sent again and approved, the button reads "Sign as …";
     6  a real change afterwards lapses it — the button goes back to "Send for
        approval" and the row says what moved;
     7  the contract does not move by a pixel for any of it;
     8  sent again, the approver answers from a phone, note and all.
   Every claim a stage without the feature could satisfy is GATED.
   Run: node test/chromium/approval-before-signing-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SHOTS = process.env.HATI_SHOT_DIR || null;
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const shot = async (page, name) => { if (SHOTS) try { await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: false }); } catch (_) {} };

async function login(browser, email, pass) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(H.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForTimeout(2200);
  return { ctx, page, errors };
}
let H;

(async () => {
  H = await startHati();
  const W = await seedWorkspace(H);
  const U = W.users.unrestricted, R = W.users.restricted, N = W.users.novalues;
  /* THE CONTRACT: the lead leads it and is named to sign it; the other side
     signs second. */
  {
    const c = await W.admin.json('/api/contracts/MK-A2');
    const v = c._v; delete c._v;
    c.owner = { id: U.id, name: U.name };
    c.signerPlan = [
      { id: 'sg1', party: 'internal', name: U.name, memberId: U.id, email: U.email, order: 1, signed: false },
      { id: 'sg2', party: 'counterparty', name: 'Grace Wanjiru', email: 'grace@nandi.co.ke', order: 2, signed: false }];
    await W.admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: c, baseVersion: v } });
  }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const pageErrors = [];
  try {
    /* ================= 1 · THE ADMIN SETS IT ON THE PERSON ================= */
    const A = await login(browser, 'admin@example.co.ke', 'adminpassword1');
    pageErrors.push(...A.errors);
    await A.page.evaluate(() => { if (window.setView) setView('team'); });
    await A.page.waitForTimeout(900);
    const hasRow = await A.page.$(`[data-st-panel="person:${U.id}"]`);
    check('1a  the People list draws the person', !!hasRow);
    if (hasRow) {
      await A.page.click(`[data-st-panel="person:${U.id}"]`);
      await A.page.waitForTimeout(600);
    }
    const drawer = await A.page.evaluate(() => ({
      seg: !!document.querySelector('[data-sa-set="always"]'),
      backup: !!document.getElementById('tm-sa-backup'),
      lead: !!document.getElementById('tm-sa-lead'), sign: !!document.getElementById('tm-sa-sign'),
      says: (document.getElementById('tm-ov-says') || {}).textContent || '' }));
    check('1b  section 6 draws Off | Always, the backup and when it applies', drawer.seg && drawer.backup && drawer.lead && drawer.sign, JSON.stringify(drawer));
    if (drawer.seg) {
      await A.page.selectOption('#tm-overseer', R.id);
      await A.page.selectOption('#tm-sa-backup', N.id);
      await A.page.click('[data-sa-set="always"]');
      await A.page.waitForTimeout(200);
    }
    const says = await A.page.evaluate(() => (document.getElementById('tm-ov-says') || {}).textContent || '');
    check('1c  the sentence reads the rule back before it is saved',
      /Nothing Unrestricted Legal leads or signs is signed until Restricted Legal approves it/.test(says) && /No Values Legal steps in/.test(says), says);
    await shot(A.page, 'sa-01-drawer');
    if (drawer.seg) {
      await A.page.click('#st-dsave');
      await A.page.waitForTimeout(900);
    }
    const saved = await W.admin.json('/api/bootstrap');
    const u1 = saved.users.find(x => x.id === U.id) || {};
    check('1d  Save writes the four fields on the person', u1.overseerOn === 'always' && u1.overseerId === R.id
      && u1.overseerBackupId === N.id, JSON.stringify({ on: u1.overseerOn, a: u1.overseerId, b: u1.overseerBackupId, w: u1.overseerWhen }));
    await A.page.evaluate(() => { if (window.setView) setView('team'); });
    await A.page.waitForTimeout(700);
    const rowText = await A.page.evaluate(id => ((document.querySelector(`[data-st-sa="${id}"]`) || {}).textContent || ''), U.id);
    check('1e  the People row says who approves', /Needs approval to sign · approver: Restricted Legal/.test(rowText), rowText);
    const oldSwitch = await A.page.evaluate(() => !!document.getElementById('ov-rule-on'));
    check('1f  the old workspace switch is not on the page', oldSwitch === false);

    /* ================= 2 · THE LEAD IS AT THE DOOR ================= */
    const L = await login(browser, 'everything@example.co.ke', 'their-own-pass-9');
    pageErrors.push(...L.errors);
    const stage = async () => L.page.evaluate(async () => {
      const c = getContract('MK-A2');
      await ensureFull(c);
      /* The rest of the list is clear, as in signing-flow-verify: a brief on
         file and read, the boxes filled, the standards and the promises read
         against THIS wording — so the one thing left is the approval. */
      c._brief = { v: 1, at: new Date(Date.now() + 60000).toISOString(), by: 'Stage', truncated: false, data: {} };
      if (window.briefMarkRead) briefMarkRead(c);
      if (window.contractBoxesOpen && window.contractBlankSet) contractBoxesOpen(c).forEach(b =>
        contractBlankSet(c, b.key, b.type === 'date' ? '2026-10-01' : 'Stated', { quiet: true, hold: true }));
      const hash = playbookHashOf(playbookText(c));
      c.playbook = { label: 'Default', wordingHash: hash, verdicts: [] };
      c.obligationsReadHash = hash;
      c.compliance = {};
      /* No value rule in the way — the workspace's legacy 5M default would
         add an admin's step this file is not about (signing-flow-verify's
         own staging). */
      state.settings = { ...(state.settings || {}), approvalRules: [] };
      persist(c); await flushSaves();
      return { needs: (signApprovalNeeds(c) || []).length };
    });
    const st0 = await stage();
    check('2a  the lead\'s browser knows the contract needs an approval', st0.needs === 1, JSON.stringify(st0));
    const openSign = async (P) => {
      await P.evaluate(() => { const c = getContract('MK-A2'); openWorkspace(c.id); });
      await P.waitForTimeout(700);
      await P.evaluate(() => { const c = getContract('MK-A2'); roomGoTab(c, 'sign'); });
      await P.waitForTimeout(700);
    };
    await openSign(L.page);
    const read2 = async () => L.page.evaluate(() => {
      const b = document.getElementById('sign-btn');
      const row = document.querySelector('#sign-check [data-sc-row^="sa:"]');
      const cp = Array.from(document.querySelectorAll('#signing-order .font-mono')).map(x => x.textContent.trim());
      const canvas = document.getElementById('doc-canvas');
      const first = canvas && canvas.getBoundingClientRect().top;
      return { label: b ? b.textContent.replace(/\s+/g, ' ').trim() : '', ask: b ? b.getAttribute('data-sa-ask-btn') : null,
        row: row ? row.textContent.replace(/\s+/g, ' ').trim() : '', rowHolds: !!(row && row.classList.contains('is-hold')),
        verb: !!(row && row.querySelector('[data-sa-ask]')), meta: cp.join(' | '), canvasTop: first,
        gate: ((document.getElementById('sign-side') || {}).textContent || '').replace(/\s+/g, ' '),
        /* What the signing order offers while the approval holds: a resend
           button or an "email failed" badge on a row whose notice is being
           HELD would be a door that cannot work and a failure that is not one. */
        notify: !!document.querySelector('#signing-order [data-sp-notify]'),
        failed: /email failed/i.test(((document.getElementById('signing-order') || {}).textContent || '')),
        sendLive: Array.from(document.querySelectorAll('#signing-order [data-sp-send]')).filter(x => !x.disabled).length };
    });
    const s2 = await read2();
    check('2b  the list holds on "Approval: not asked yet", with Send for approval on the row',
      s2.rowHolds && /Approval: not asked yet/.test(s2.row) && s2.verb, s2.row);
    check('2c  the Sign button reads "Send for approval" — it is the one thing left', /^Send for approval$/.test(s2.label) && s2.ask === '1', s2.label);
    check('2d  the approval gate names the step and says it is not asked yet',
      /Unrestricted Legal’s contracts|Unrestricted Legal's contracts/.test(s2.gate) && /not asked yet/.test(s2.gate), s2.gate.slice(0, 240));
    check('2e  the signing order says every row waits for the approval', /waits — approval first/.test(s2.meta), s2.meta);
    await shot(L.page, 'sa-02-ready');
    const top0 = s2.canvasTop;

    /* ================= 3 · SEND FOR APPROVAL ================= */
    await L.page.click('#sign-btn');
    await L.page.waitForTimeout(500);
    const dlg = await L.page.evaluate(() => {
      const d = document.querySelector('.sa-dlg');
      return { there: !!d, text: d ? d.textContent.replace(/\s+/g, ' ') : '' };
    });
    check('3a  the press opens the request: approver, backup and exactly what is approved',
      dlg.there && /Restricted Legal/.test(dlg.text) && /No Values Legal/.test(dlg.text) && /approves exactly this/.test(dlg.text), dlg.text.slice(0, 260));
    check('3b  it says the other side\'s link waits too', /Grace Wanjiru’s signing link waits too|Grace Wanjiru's signing link waits too/.test(dlg.text));
    await shot(L.page, 'sa-03-send');
    if (dlg.there) {
      await L.page.fill('#sa-ask-note', 'Standard terms. Price held from last year.');
      await L.page.click('#sa-ask-go');
      await L.page.waitForTimeout(1500);
    }
    const s3 = await read2();
    check('3c  the button now says who it waits on', /Waiting on Restricted Legal’s approval|Waiting on Restricted Legal's approval/.test(s3.label), s3.label);
    check('3d  the row says when it was asked and that the email is in the outbox (no provider here)',
      /Asked .* by Unrestricted Legal/.test(s3.row) && /Not emailed: email is off here\./.test(s3.row), s3.row);
    check('3g  while it waits, the signing order offers no resend, says no email failed and sends no link',
      !s3.notify && !s3.failed && s3.sendLive === 0, JSON.stringify({ notify: s3.notify, failed: s3.failed, sendLive: s3.sendLive }));
    const rec3 = await W.admin.json('/api/contracts/MK-A2');
    const q3 = (rec3.signApprovals || [])[0] || {};
    check('3e  the request is on the record, stamped by the server, with the note', q3.status === 'pending' && q3.approverId === R.id
      && /Price held/.test(q3.note || '') && q3.stamp && q3.stamp.value === '36000000', JSON.stringify({ s: q3.status, a: q3.approverId, n: q3.note }));
    const mails = ((await W.admin.json('/api/outbox')).items || []);
    check('3f  the approver was written to', mails.some(m => m.to_addr === 'restricted@example.co.ke' && /Please approve/.test(m.subject)));
    await shot(L.page, 'sa-04-waiting');

    /* ================= 4 · THE APPROVER ================= */
    const P = await login(browser, 'restricted@example.co.ke', 'their-own-pass-9');
    pageErrors.push(...P.errors);
    await P.page.evaluate(() => { if (window.setView) setView('approvals'); });
    await P.page.waitForTimeout(900);
    const list = await P.page.evaluate(() => {
      const tr = document.querySelector('[data-ap-row="MK-A2"]');
      return tr ? tr.textContent.replace(/\s+/g, ' ').trim() : '';
    });
    check('4a  it is on the approver\'s Approvals page, named for the person, asked by the lead',
      /Unrestricted Legal/.test(list) && /Needs approval to sign/.test(list), list);
    await shot(P.page, 'sa-05-list');
    await openSign(P.page);
    const card = await P.page.evaluate(() => {
      const c = document.getElementById('sa-card');
      return { there: !!c, text: c ? c.textContent.replace(/\s+/g, ' ') : '',
        approve: !!(c && c.querySelector('[data-sa-approve]')), refuse: !!(c && c.querySelector('[data-sa-refuse]')) };
    });
    check('4b  the approver\'s own card leads the column, with the note and what they approve',
      card.there && /asks you to approve this before anyone signs it/.test(card.text) && /Price held/.test(card.text)
      && /You approve/.test(card.text) && card.approve && card.refuse, card.text.slice(0, 260));
    await shot(P.page, 'sa-06-decide');
    if (card.refuse) {
      await P.page.click('[data-sa-refuse]');
      await P.page.waitForTimeout(400);
      const empty = await P.page.evaluate(() => !!document.getElementById('pd-input'));
      check('4c  Refuse asks why', empty);
      if (empty) {
        await P.page.click('#pd-ok');
        await P.page.waitForTimeout(400);
        const still = await P.page.evaluate(async () => { const c = getContract('MK-A2'); return (c.signApprovals || [])[0].status; });
        check('4d  a refusal with no reason is not a refusal', still === 'pending', still);
        await P.page.click('[data-sa-refuse]').catch(() => {});
        await P.page.waitForTimeout(400);
        if (await P.page.$('#pd-input')) {
          await P.page.fill('#pd-input', 'Ask Nandi for 45 days to pay. The price is fine.');
          await P.page.click('#pd-ok');
          await P.page.waitForTimeout(1500);
        }
      }
    }
    const rec4 = await W.admin.json('/api/contracts/MK-A2');
    const q4 = (rec4.signApprovals || [])[0] || {};
    check('4e  the refusal is on the record with its reason, by the approver', q4.status === 'refused' && /45 days/.test(q4.decision || '')
      && q4.decidedBy && q4.decidedBy.id === R.id, JSON.stringify({ s: q4.status, d: q4.decision }));

    /* ================= 5 · SENT AGAIN, AND APPROVED ================= */
    await L.page.reload({ waitUntil: 'networkidle' });
    await L.page.waitForTimeout(2000);
    await stage();
    await openSign(L.page);
    const s5 = await read2();
    check('5a  the lead sees who refused and why, and may send it again', /Refused by Restricted Legal/.test(s5.row) && /45 days/.test(s5.row)
      && /^Send for approval$/.test(s5.label), `${s5.row} · ${s5.label}`);
    await shot(L.page, 'sa-07-refused');
    await L.page.click('#sign-btn');
    await L.page.waitForTimeout(500);
    if (await L.page.$('#sa-ask-go')) { await L.page.fill('#sa-ask-note', 'Now 45 days, as asked.'); await L.page.click('#sa-ask-go'); await L.page.waitForTimeout(1500); }
    await P.page.reload({ waitUntil: 'networkidle' });
    await P.page.waitForTimeout(2000);
    await openSign(P.page);
    if (await P.page.$('[data-sa-approve]')) {
      await P.page.fill('#sa-dec-note', 'Fine by me.');
      await P.page.click('[data-sa-approve]');
      await P.page.waitForTimeout(1500);
    }
    const rec5 = await W.admin.json('/api/contracts/MK-A2');
    const q5 = (rec5.signApprovals || []).slice(-1)[0] || {};
    check('5b  approved on the record, by the approver, with the note', q5.status === 'approved' && q5.decidedBy && q5.decidedBy.id === R.id
      && q5.decision === 'Fine by me.', JSON.stringify({ s: q5.status, d: q5.decision }));
    await L.page.reload({ waitUntil: 'networkidle' });
    await L.page.waitForTimeout(2000);
    await stage();
    await openSign(L.page);
    const s5b = await read2();
    check('5c  the Sign button signs now', /^Sign as Unrestricted Legal$/.test(s5b.label), s5b.label);
    const settled = await L.page.evaluate(() => {
      const fold = document.querySelector('#sign-check [data-sc-fold]');
      return fold ? fold.textContent.replace(/\s+/g, ' ').trim() : '';
    });
    check('5d  the approval folds away as settled, naming who gave it', /Approved by Restricted Legal/.test(settled), settled);
    await shot(L.page, 'sa-08-approved');
    check('7a  the contract did not move by a pixel', top0 != null && s5b.canvasTop === top0, `${top0} → ${s5b.canvasTop}`);

    /* ================= 6 · A REAL CHANGE LAPSES IT ================= */
    await L.page.evaluate(async () => {
      const c = getContract('MK-A2');
      c.value = 38000000; c.metadata = { ...(c.metadata || {}), value: 38000000 };
      /* The readings are re-made against the new wording, as the lead would
         press Run for — so what is left holding is the approval alone. */
      const hash = playbookHashOf(playbookText(c));
      c.playbook = { ...(c.playbook || {}), wordingHash: hash };
      c.obligationsReadHash = hash;
      persist(c); await flushSaves();
      renderSignSide(c); renderSignButton(c);
    });
    await L.page.waitForTimeout(500);
    const s6 = await read2();
    const holds6 = await L.page.evaluate(() => signReadiness(getContract('MK-A2')).holds.map(r => r.kind));
    check('6a  the button goes back to "Send for approval"', /^Send for approval$/.test(s6.label), s6.label + ' · ' + holds6.join(','));
    check('6b  the row says what moved since the approval', /Changed since Restricted Legal approved/.test(s6.row) && /value changed/.test(s6.row), s6.row);
    await shot(L.page, 'sa-09-changed');

    /* ================= 8 · APPROVED FROM A PHONE ================= */
    /* The lead sends the changed contract again; the approver answers on a
       phone. The phone files nothing of its own — its Approve presses the
       desktop's own approveContract, which hands a personal approval to the
       one decider — so what is proved here is that the door is drawn, the
       note box is there, and the answer lands on the record. */
    await L.page.click('#sign-btn');
    await L.page.waitForTimeout(500);
    if (await L.page.$('#sa-ask-go')) { await L.page.click('#sa-ask-go'); await L.page.waitForTimeout(1500); }
    const M = await (async () => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(H.base + '/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      await page.fill('#li-email', 'restricted@example.co.ke');
      await page.fill('#li-pass', 'their-own-pass-9');
      await page.click('#li-go');
      await page.waitForTimeout(2200);
      return { ctx, page, errors };
    })();
    pageErrors.push(...M.errors);
    await M.page.evaluate(() => { if (window.mGo) window.mGo('approvals'); });
    await M.page.waitForTimeout(700);
    const onPhone = await M.page.evaluate(() => !!document.querySelector('[data-m-appr="MK-A2"]'));
    check('8a  the phone lists it for the approver', onPhone);
    if (onPhone) {
      await M.page.evaluate(() => document.querySelector('[data-m-appr="MK-A2"]').click());
      await M.page.waitForTimeout(500);
      const mc = await M.page.evaluate(() => {
        const box = document.getElementById('m-appr-note');
        const btn = document.querySelector('[data-m-approve="MK-A2"]');
        const card = btn ? btn.closest('.m-card') : null;
        return { box: !!box, btn: !!btn, text: card ? card.textContent.replace(/\s+/g, ' ') : '' };
      });
      check('8b  the phone card says what is approved, who asked, and carries the note box',
        mc.box && mc.btn && /You approve/.test(mc.text) && /Unrestricted Legal/.test(mc.text), mc.text.slice(0, 220));
      await shot(M.page, 'sa-10-phone');
      if (mc.box && mc.btn) {
        await M.page.fill('#m-appr-note', 'Approved from my phone.');
        await M.page.evaluate(() => document.querySelector('[data-m-approve="MK-A2"]').click());
        await M.page.waitForTimeout(1800);
      }
    }
    const rec8 = await W.admin.json('/api/contracts/MK-A2');
    const q8 = (rec8.signApprovals || []).slice(-1)[0] || {};
    check('8c  the phone\'s answer is on the record, by the approver, with the note', q8.status === 'approved'
      && q8.decidedBy && q8.decidedBy.id === R.id && q8.decision === 'Approved from my phone.', JSON.stringify({ s: q8.status, d: q8.decision }));
  } catch (e) {
    check('the journey ran to the end', false, e && e.stack);
  } finally {
    check('no page threw', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
    await browser.close();
    await H.stop();
  }
  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} passed`);
  process.exit(bad ? 1 : 0);
})();
