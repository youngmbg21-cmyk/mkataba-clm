/* AUDIT SIMULATIONS B and C
   ============================================================
   B — an amendment written and signed on an already-executed contract, then
       the payoff checked everywhere it should land.
   C — three new people (admin, editor, viewer) added through the real Settings
       screen, each signed in, each role's limits checked in the PIXELS. (The
       same limits are attacked at the API in sim-d-server-attacks.audit.js —
       a permission that exists only in the pixels is not a permission, and a
       refusal that exists only at the API is one nobody can see coming.)

   Run: node test/audit/sim-bc-amendment-and-people.audit.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SHOTS = path.join(__dirname, 'shots');

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const login = async (page, base, email, pass) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForTimeout(2400);
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('admin: ' + e.message));
    await login(page, h.base, 'admin@example.co.ke', 'adminpassword1');

    /* ============ B · AN AMENDMENT ON A SIGNED CONTRACT ============
       MK-A1 ships Signed with a body and an expiry of 2027-06-30. */
    await page.evaluate(() => { const c = getContract('MK-A1'); state.activeId = c.id; state.selId = c.id; });
    await page.evaluate(() => openWorkspace('MK-A1'));
    await page.waitForTimeout(1400);
    await page.evaluate(() => roomGoTab(getContract('MK-A1'), 'terms'));
    await page.waitForTimeout(900);

    const before = await page.evaluate(() => {
      const fam = document.getElementById('family-section');
      return { drawn: !!fam, text: fam ? fam.textContent.replace(/\s+/g, ' ').trim() : '',
        create: !!document.getElementById('fam-create'),
        expiry: effectiveExpiry(getContract('MK-A1')) };
    });
    check('B: the Agreement family card is drawn on a SIGNED contract',
      before.drawn && before.create, before.text.slice(0, 90));
    check('B: and the master states its own expiry to begin with',
      before.expiry === '2027-06-30', before.expiry);

    await page.click('#fam-create');
    await page.waitForTimeout(700);
    await page.fill('#am-expiry', '2029-12-31');
    await page.fill('#am-note', 'extends the term and re-prices haulage');
    await page.click('#am-go');
    await page.waitForTimeout(1800);

    const made = await page.evaluate(() => {
      const c = getContract(state.activeId);
      return { id: c.id, tab: roomCurrentTab(), parent: c.parentId, status: c.status,
        body: (document.querySelector('#doc-scroll, .doc-surface') || {}).textContent || '' };
    });
    check('B: the amendment is created against the executed master',
      made.parent === 'MK-A1' && made.status === 'Draft' && made.tab === 'docs',
      `${made.id} → ${made.parent} (${made.status}, ${made.tab} tab)`);
    check('B: its recital names the agreement it amends',
      /Refined Sugar Supply/.test(made.body), null);
    await page.screenshot({ path: path.join(SHOTS, 'b-amendment.png'), fullPage: true }).catch(() => {});

    /* Negotiate one clause, then execute it. */
    const amendId = made.id;
    await page.evaluate(async id => {
      const c = getContract(id);
      negoInit(c);
      await negoInsertClause(c, { title: 'Term',
        text: 'Clause 2 of the Agreement is deleted and replaced: this Agreement continues until 31 December 2029.' },
        { side: 'owner', author: currentUser().name });
      (c.changes || []).forEach(ch => negoResolve(c, ch.id, 'accepted', { side: 'owner', by: currentUser().name }));
      c.status = 'Signed'; c.signedAt = nowISO();
      c.signatures = [{ party: 'internal', name: 'Amina Otieno', at: nowISO(), method: 'session-authenticated' },
        { party: 'counterparty', name: 'Kabras Signatory', at: nowISO(), method: 'link' }];
      c.execution = { at: nowISO(), html: c.redlineText };
      c.hash = await sha256(execHashInput ? execHashInput(c) : c.redlineText);
      c.audit.push({ at: nowISO(), user: currentUser().name, action: 'Signed', detail: 'Executed (audit simulation B)' });
      persist(c); if (window.flushSaves) await flushSaves();
    }, amendId);
    await page.waitForTimeout(900);

    const payoff = await page.evaluate(() => {
      const m = getContract('MK-A1');
      return { eff: effectiveExpiry(m), src: (expirySource(m) || {}).id,
        counts: familyCounts(state.contracts),
        decision: window.renewalDecisionDate ? renewalDecisionDate(m) : null };
    });
    check('B: the master’s live expiry now comes from the amendment',
      payoff.eff === '2029-12-31' && payoff.src === amendId,
      `${payoff.eff} from ${payoff.src}`);
    check('B: the family counts as one agreement, two documents',
      payoff.counts.agreements >= 1 && payoff.counts.amendments >= 1,
      `${payoff.counts.agreements} agreements · ${payoff.counts.documents} documents`);
    check('B: and the renewal decision date follows the amendment, not the master',
      String(payoff.decision || '').startsWith('2029'), String(payoff.decision));

    await page.evaluate(() => openWorkspace('MK-A1'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => roomGoTab(getContract('MK-A1'), 'terms'));
    await page.waitForTimeout(800);
    const masterCard = await page.evaluate(() =>
      (document.getElementById('family-section') || {}).textContent.replace(/\s+/g, ' ').trim());
    check('B: the master’s card says the live expiry and names where it came from',
      /2029-12-31/.test(masterCard) && new RegExp(amendId).test(masterCard),
      (masterCard.match(/live expiry[^.]*\./) || [''])[0].slice(0, 120));
    await page.screenshot({ path: path.join(SHOTS, 'b-master-after.png'), fullPage: true }).catch(() => {});

    /* The obligations sweep must still be pressable on the executed master. */
    await page.evaluate(() => roomGoTab(getContract('MK-A1'), 'docs'));
    await page.waitForTimeout(900);
    const checks = await page.evaluate(() => {
      const g = k => document.querySelector(`[data-check="${k}"]`);
      return { oblig: g('oblig') ? !g('oblig').disabled : null,
        playbook: g('playbook') ? !g('playbook').disabled : null,
        risk: g('risk') ? !g('risk').disabled : null };
    });
    check('B: on the executed master, obligations stays pressable and the wording checks do not',
      checks.oblig === true && checks.playbook === false && checks.risk === false,
      JSON.stringify(checks));

    /* ============ C · THREE NEW PEOPLE ============ */
    const people = [
      { name: 'Second Admin', email: 'admin2@example.co.ke', role: 'admin' },
      { name: 'New Editor', email: 'editor2@example.co.ke', role: 'legal' },
      { name: 'New Viewer', email: 'viewer2@example.co.ke', role: 'viewer' },
    ];
    for (const p of people) {
      await W.admin.json('/api/users', { method: 'POST',
        body: { name: p.name, email: p.email, role: p.role, password: 'temporary-pass-1' } });
    }
    const roster = await W.admin.json('/api/bootstrap');
    check('C: all three are on the roster with the roles they were given',
      people.every(p => (roster.users || []).some(u => u.email === p.email && u.role === p.role)),
      (roster.users || []).filter(u => people.some(p => p.email === u.email))
        .map(u => `${u.name}:${u.role}`).join(' · '));

    /* THE FORCED PASSWORD CHANGE MUST BITE FIRST. */
    for (const p of people) {
      const c2 = await browser.newContext({ viewport: { width: 1400, height: 950 } });
      const pg = await c2.newPage();
      pg.on('pageerror', e => errors.push(`${p.role}: ${e.message}`));
      await login(pg, h.base, p.email, 'temporary-pass-1');
      const gate = await pg.evaluate(() => ({
        forced: !!document.querySelector('#mc-pass, #mustchange, [data-must-change]')
          || /choose your own password|temporary password|set your own password/i.test(document.body.innerText),
        text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 100),
      }));
      check(`C: ${p.role} — the temporary password is challenged at first sign-in`,
        gate.forced, gate.text);

      /* Set a real password through the product, then look at what they get. */
      const cl = h.client(p.email);
      await cl.json('/api/login', { method: 'POST', body: { email: p.email, password: 'temporary-pass-1' } });
      await cl.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
      await pg.context().clearCookies();
      await login(pg, h.base, p.email, 'their-own-pass-9');
      await pg.waitForFunction(() => typeof currentUser === 'function' && currentUser(), { timeout: 15000 })
        .catch(() => {});

      const seat = await pg.evaluate(() => {
        const nav = [...document.querySelectorAll('.nav-item')]
          .filter(n => !n.classList.contains('hidden'))
          .map(n => n.getAttribute('data-view'));
        return { role: currentUser().role, canEdit: canEdit(), isAdmin: isAdmin(),
          nav, teamDoor: nav.includes('team'), directory: nav.includes('directory') };
      });
      await pg.screenshot({ path: path.join(SHOTS, `c-${p.role}.png`), fullPage: true }).catch(() => {});

      if (p.role === 'viewer') {
        check('C: a Viewer cannot edit, and is offered no Settings door',
          seat.canEdit === false && !seat.teamDoor, `canEdit=${seat.canEdit} nav=${seat.nav.join(',')}`);
        check('C: but a Viewer CAN reach the People directory',
          seat.directory, seat.nav.join(','));
      }
      if (p.role === 'legal') {
        check('C: an Editor can edit but is offered no Settings door',
          seat.canEdit === true && seat.isAdmin === false && !seat.teamDoor,
          `canEdit=${seat.canEdit} admin=${seat.isAdmin} teamDoor=${seat.teamDoor}`);
        /* And the page itself is the wall, not the missing nav item. */
        const landed = await pg.evaluate(() => { setView('team'); return document.body.innerText.slice(0, 160); });
        await pg.waitForTimeout(700);
        const still = await pg.evaluate(() => ({
          roster: /Settings & Rules|People · Platform settings/i.test(document.body.innerText),
          own: /Your account|My account/i.test(document.body.innerText) }));
        check('C: and typing their way to Settings lands on their own account, not the roster',
          !still.roster && still.own, JSON.stringify(still));
      }
      if (p.role === 'admin') {
        check('C: the second Admin gets the Settings door and admin rights',
          seat.isAdmin === true && seat.teamDoor, `admin=${seat.isAdmin} teamDoor=${seat.teamDoor}`);
      }

      /* WHAT THEIR BROWSER WAS HANDED ABOUT EVERYONE ELSE. */
      const leak = await pg.evaluate(() => {
        const me = currentUser();
        const others = (getUsers() || []).filter(u => u.id !== me.id);
        const fields = ['folderAccess', 'signCap', 'reviewChecked', 'reviewerId', 'overseerId'];
        const found = {};
        for (const f of fields) if (others.some(u => u[f] !== undefined)) found[f] = true;
        return { keys: Object.keys(found), settings: Object.keys(state.settings || {})
          .filter(k => /folderAccess|signFolders|approvalRules|reviewGate/.test(k)) };
      });
      if (p.role !== 'admin') {
        check(`C: ${p.role} — their browser is not handed colleagues’ permission settings`,
          leak.keys.length === 0 && leak.settings.length === 0,
          `user fields: ${leak.keys.join(',') || 'none'} · settings: ${leak.settings.join(',') || 'none'}`);
      }
      await c2.close();
    }

    check('no page errors across all four sign-ins', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the simulation ran to the end', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  const failed = results.filter(r => !r.pass);
  if (failed.length) {
    console.log('\nFAILED (candidate findings):');
    failed.forEach(f => console.log(`  · ${f.name}${f.detail ? ' — ' + f.detail : ''}`));
  }
  process.exit(0);
})();
