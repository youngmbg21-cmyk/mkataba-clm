/* Chromium verification: ONE LIST BEFORE THE SIGNATURE (13 Sep 2026).
   ============================================================
   The signing audit's flow, driven with real presses on the Signing tab:
     1  the button reads "Sign — N to settle" and is a DOOR onto the first
        held row of the card above it;
     2  an escalated departure offers "Ask a colleague" and is asked through a
        real dialog; the hold stays until an admin accepts it with a reason;
     3  once nothing holds the button reads "Sign — N noted" (the ordinary
        departure, signed over with eyes open) and opens the pad;
     4  the pad's first line is the intent statement: Adopt & sign refuses
        without it, and with it the signature lands and consent is stamped;
     5  the head's Sign carries the same count and lands on the same list.
   Run: node test/chromium/signing-flow-verify.js */
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

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---- THE FIXTURE: at the door (a signer each side, nothing on the
       table), an escalated departure and an ordinary one on file against
       THIS wording, obligations read from it, no approval rule in the way. */
    const setup = await page.evaluate(async (colId) => {
      const c = getContract('MK-A2');
      await ensureFull(c);
      const me = currentUser();
      c.signerPlan = [
        { id: 'sg_me', party: 'internal', name: me.name, memberId: me.id, email: me.email, order: 1, signed: false },
        { id: 'sg_cp', party: 'counterparty', name: 'Ola Nordmann', email: 'ola@nandi.co.ke', order: 2, signed: false } ];
      const hash = playbookHashOf(playbookText(c));
      c.playbook = { label: 'Default', wordingHash: hash, verdicts: [
        { category: 'Governing law', status: 'deviation', escalate: true, position: 'Kenyan law', quote: '' },
        { category: 'Payment terms', status: 'deviation', escalate: false, position: '<= 45 days', quote: '' } ] };
      /* STEP 0 — THE CHECK HAS NOT RUN FOR PROMISES: the row holds and the
         button counts it (owner-reported 13 Sep 2026). */
      c.compliance = {};
      state.settings = { ...(state.settings || {}), approvalRules: [] };
      persist(c); await flushSaves();
      openWorkspace(c.id);
      await new Promise(r => setTimeout(r, 500));
      roomGoTab(c, 'sign');
      await new Promise(r => setTimeout(r, 500));
      const b0 = document.getElementById('sign-btn');
      const card0 = document.getElementById('sign-check');
      window.__step0 = { label: b0 && b0.textContent.replace(/\s+/g, ' ').trim(),
        row: !!(card0 && Array.from(card0.querySelectorAll('.sc-find.is-hold')).some(r => /promises/.test(r.textContent) && r.querySelector('[data-sc-run]'))) };
      c.obligationsReadHash = hash;
      persist(c); await flushSaves();
      renderSignSide(c); renderSignButton(c);
      await new Promise(r => setTimeout(r, 300));
      const b = document.getElementById('sign-btn');
      const card = document.getElementById('sign-check');
      const head = document.getElementById('ws-next-action');
      return { label: b && b.textContent.replace(/\s+/g, ' ').trim(), disabled: b && b.disabled,
        holds: b && b.getAttribute('data-sign-holds'),
        rows: card ? Array.from(card.querySelectorAll('.sc-find')).map(r => r.className + '|' + r.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)) : [],
        ask: !!(card && card.querySelector('[data-sc-escalate]')),
        accept: card ? card.querySelectorAll('[data-sc-accept]').length : 0,
        headLabel: head ? head.textContent.replace(/\s+/g, ' ').trim() : '',
        tick: !!document.querySelector('[data-comp="consent"]'),
        n: signReadiness(c).n, step0: window.__step0 };
    }, W.users.unrestricted.id);
    check('0   before the check has read the wording for promises, that row holds and the button counts it',
      setup.step0 && /^Sign — 2 to settle/.test(setup.step0.label || '') && setup.step0.row, JSON.stringify(setup.step0));
    check('1a  the button reads "Sign — 1 to settle", live, wearing the count',
      /^Sign — 1 to settle/.test(setup.label || '') && setup.disabled === false && setup.holds === '1',
      `${setup.label} · disabled=${setup.disabled}`);
    check('1b  the card leads with the escalated row, held, offering Ask a colleague',
      setup.rows.length >= 2 && /is-hold/.test(setup.rows[0]) && /Governing law/.test(setup.rows[0]) && setup.ask,
      setup.rows.join(' ‖ '));
    check('1c  the ordinary departure is shown, not held', setup.rows.some(r => !/is-hold/.test(r) && /Payment terms/.test(r)));
    check('1d  the intent tick-box is no longer on the page', setup.tick === false);
    check('5a  the head\'s Sign carries the same count', /1 to settle/.test(setup.headLabel), setup.headLabel);

    /* 1 · the held button is a door onto the first held row */
    await page.click('#sign-btn');
    await page.waitForTimeout(500);
    const landed = await page.evaluate(() => {
      const row = document.querySelector('#sign-check .sc-find.is-hold');
      const r = row && row.getBoundingClientRect();
      return { flash: !!(row && row.classList.contains('anchor-flash')), inView: !!(r && r.top >= 0 && r.bottom <= window.innerHeight) };
    });
    check('1e  pressing the held button lands on the first held row and lights it', landed.flash && landed.inView, JSON.stringify(landed));

    /* 2 · Ask a colleague, through the real dialog */
    await page.click('#sign-check [data-sc-escalate]');
    await page.waitForTimeout(400);
    const dlg = await page.evaluate(id => {
      const sel = document.getElementById('sc-esc-who'); if (!sel) return { there: false };
      sel.value = id; return { there: true, options: sel.options.length, picked: sel.value === id };
    }, W.users.unrestricted.id);
    check('2a  Ask a colleague opens a picker of colleagues who can open the contract', dlg.there && dlg.options >= 1 && dlg.picked, JSON.stringify(dlg));
    await page.fill('#sc-esc-note', 'Can we live with Kenyan law here?');
    await page.click('#sc-esc-go');
    await page.waitForTimeout(900);
    const asked = await page.evaluate(() => {
      const c = getContract('MK-A2'); const v = c.playbook.verdicts[0];
      const b = document.getElementById('sign-btn');
      return { to: v.escalation && v.escalation.to && v.escalation.to.name, label: b && b.textContent.replace(/\s+/g, ' ').trim(),
        line: (document.querySelector('#sign-check .sc-find.is-hold .sc-find-w') || {}).textContent || '', modal: !!document.getElementById('sc-esc-who') };
    });
    check('2b  the ask is stamped on the verdict, the dialog is gone, and the row still holds',
      asked.to === 'Unrestricted Legal' && !asked.modal && /1 to settle/.test(asked.label) && /Asked Unrestricted Legal/.test(asked.line), JSON.stringify(asked));
    /* THE COLLEAGUE'S TURN, and the wall: the signer cannot accept it; the
       server refuses a signature over it even if the browser were bypassed. */
    const wall = await W.admin.json('/api/contracts/MK-A2').then(async seen => {
      try { await W.admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: { ...seen, signatures: [
        { name: 'Amina Otieno', email: 'admin@example.co.ke', at: new Date().toISOString(), method: 'session-authenticated' }] }, baseVersion: seen._v } }); return 'let through'; }
      catch (e) { return String(e.message || e); } });
    check('2c  the server refuses a signature over the open escalation', /escalated departure/i.test(wall), wall.slice(0, 90));
    /* An admin (the person at this screen) may accept it with a reason. */
    const acceptBtn = await page.$('#sign-check [data-sc-accept="0"]');
    check('2d  an admin is offered Accept with a reason on the escalated row', !!acceptBtn);
    await acceptBtn.click();
    await page.waitForTimeout(400);
    await page.fill('#pd-input', 'Kenyan law is acceptable for this supplier; Legal agreed.');
    await page.click('#pd-ok');
    await page.waitForTimeout(700);
    const after = await page.evaluate(() => {
      const c = getContract('MK-A2'); const v = c.playbook.verdicts[0];
      const b = document.getElementById('sign-btn'); const head = document.getElementById('ws-next-action');
      return { role: v.accepted && v.accepted.role, label: b && b.textContent.replace(/\s+/g, ' ').trim(), title: b && b.title,
        headLabel: head ? head.textContent.replace(/\s+/g, ' ').trim() : '', n: signReadiness(c).n, settled: document.querySelectorAll('#sign-check [data-sc-fold]').length };
    });
    check('3a  accepted by the admin, nothing holds: the button reads "Sign — 1 noted" and names the row on the hover',
      after.role === 'admin' && after.n === 0 && /^Sign — 1 noted/.test(after.label || '') && /Payment terms/.test(after.title || ''), `${after.label} · ${after.title}`);
    check('3b  the settled row folds under its count', after.settled === 1);
    check('5b  the head\'s Sign no longer carries a count', after.headLabel === 'Sign', after.headLabel);

    /* 4 · the pad, and its first line */
    await page.click('#sign-btn');
    await page.waitForTimeout(700);
    const pad = await page.evaluate(() => ({ there: !!document.getElementById('sig-pad'), intent: !!document.getElementById('sig-intent'),
      first: (() => { const p = document.getElementById('sig-pad'); const row = p && document.getElementById('sig-intent-row'); const go = p && document.getElementById('sig-adopt-go');
        return !!(row && go && row.getBoundingClientRect().top < go.getBoundingClientRect().top); })() }));
    check('4a  the pad opens with the intent statement inside it, above Adopt & sign', pad.there && pad.intent && pad.first, JSON.stringify(pad));
    await page.click('[data-sig-tab="type"]');
    await page.fill('#sig-typed', 'Amina Otieno');
    await page.click('#sig-adopt-go');
    await page.waitForTimeout(500);
    const refused = await page.evaluate(() => ({ padStill: !!document.getElementById('sig-pad'),
      consent: !!(getContract('MK-A2').compliance || {}).consent, sigs: (getContract('MK-A2').signatures || []).length }));
    check('4b  Adopt & sign without the tick is refused, and nothing is signed', refused.padStill && !refused.consent && refused.sigs === 0, JSON.stringify(refused));
    await page.click('#sig-intent');
    await page.click('#sig-adopt-go');
    await page.waitForTimeout(1500);
    const signed = await page.evaluate(() => { const c = getContract('MK-A2');
      return { padGone: !document.getElementById('sig-pad'), consent: !!(c.compliance || {}).consent,
        sigs: (c.signatures || []).length, mine: !!(c.signerPlan || []).find(s => s.id === 'sg_me' && s.signed),
        trail: (c.audit || []).some(a => a.action === 'Consent') }; });
    check('4c  with the tick the signature lands, consent is stamped on the record and the trail',
      signed.padGone && signed.consent && signed.sigs === 1 && signed.mine && signed.trail, JSON.stringify(signed));
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
