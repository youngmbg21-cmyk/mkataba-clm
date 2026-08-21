/* J8 (second half) — DOES THE AMENDED TERM REACH EVERY SURFACE?
   family card · Key terms · register row · calendar · dashboard ·
   the renewal reminder EMAIL · the daily brief.
   Server + real mail provider stand-in + real browser, one workspace. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHatiWithMail, seedWorkspace } = require('../../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SHOTS = path.join(__dirname, 'shots');
const results = [];
const check = (n, p, d) => { results.push({ name: n, pass: !!p, detail: d }); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d != null ? ' — ' + d : ''}`); };

/* a date N days from today, YYYY-MM-DD */
/* The sweeps send fire-and-forget, so the provider is written to after the
   route has already answered. Give it a tick before reading what arrived. */
const settle = () => new Promise(r => setTimeout(r, 2500));
const NAMES = /MK-FAM1|Refined Sugar Supply Family/;   // NOT /g — .test() on a global regex is stateful
const inDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

(async () => {
  const h = await startHatiWithMail({ mode: 'ok' });
  const W = await seedWorkspace(h);
  const A = W.admin;
  let browser;
  try {
    /* ---- a SIGNED master whose OWN expiry is 20 days out (inside the 30-day admin window) ---- */
    const PARENT_EXP = inDays(30);   // an EXACT milestone — the sweep fires at 90/60/30, not 'inside 30'
    const CHILD_EXP  = inDays(400);      // well outside every window
    const put = async (id, mut) => {
      const full = await A.json('/api/contracts/' + id);
      const bv = full._v; delete full._v;
      mut(full);
      await A.json('/api/contracts/' + id, { method: 'PUT', body: { contract: full, baseVersion: bv } });
      return full;
    };
    /* A FRESH signed master. MK-FAM1 is already executed and the server rightly
       refuses to move an executed contract's expiry — so the parent is born
       with the term it needs rather than edited into it. */
    await A.json('/api/contracts/MK-FAM1', { method: 'PUT', body: { contract: {
      id: 'MK-FAM1', name: 'Refined Sugar Supply Family', counterparty: 'Kabras Sugar',
      counterpartyEmail: 'procurement@kabras.co.ke', folder: 'proc',
      party: 'Highland Corporate Ltd', value: 48000000, valueType: 'standard',
      status: 'Signed', template: 'RM', signedAt: '2026-02-01T00:00:00.000Z',
      expiry: PARENT_EXP, metadata: { effectiveDate: '2026-01-31', expiryDate: PARENT_EXP, value: 48000000, currency: 'KES' },
      redlineText: '<p>Supply agreement.</p>', format: 'rich',
      fields: {}, comments: [], signatures: [], obligations: [], rounds: [],
      audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'family stage' }],
    } } });
    const p0 = await A.json('/api/contracts/MK-FAM1');
    check('stage: the master is Signed and states its own expiry', p0.status === 'Signed' && (p0.metadata||{}).expiryDate === PARENT_EXP, `${p0.status} · ${PARENT_EXP}`);

    /* ---- a DRAFT amendment proposing a much later term ---- */
    const kid = {
      id: 'MK-AMD1', name: 'Amendment No. 1 to Refined Sugar Supply',
      counterparty: 'Kabras Sugar', folder: 'proc', party: 'Highland Corporate Ltd',
      value: 0, valueType: 'standard', status: 'Draft', template: null, source: 'amendment',
      parentId: 'MK-FAM1', relation: 'amendment', linkConfirmed: true,
      expiry: CHILD_EXP, metadata: { expiryDate: CHILD_EXP, effectiveDate: '2026-08-01' },
      redlineText: '<p>Amendment No. 1</p>', format: 'rich',
      fields: {}, comments: [], signatures: [], obligations: [], rounds: [],
      audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'amendment' }],
    };
    await A.json('/api/contracts/MK-AMD1', { method: 'PUT', body: { contract: kid } });
    const k0 = await A.json('/api/contracts/MK-AMD1');
    check('stage: the amendment exists as a DRAFT, filed against the master', k0.status === 'Draft' && k0.parentId === 'MK-FAM1', `${k0.status} → ${k0.parentId}`);

    /* ============ ROUND 1 — the amendment is a DRAFT ============ */
    h.mail.sent.length = 0;
    const rem1 = await A.json('/api/reminders/run', { method: 'POST', body: {} });
    await settle();
    const mailsDraft = h.mail.sent.slice();
    const expiryMailDraft = mailsDraft.filter(m => /MK-FAM1|Refined Sugar/.test(m.subject + m.text));
    check('DRAFT: the reminder sweep fires the 30-day renewal notice on the master',
      expiryMailDraft.length > 0, `${expiryMailDraft.length} message(s); subjects: ${expiryMailDraft.map(m=>m.subject).join(' | ').slice(0,160)}`);
    const draftMailNames = expiryMailDraft.map(m => m.text).join('\n');
    check('DRAFT: the reminder email does NOT quote the draft amendment\'s later date',
      !draftMailNames.includes(CHILD_EXP), `looked for ${CHILD_EXP} in the mail body`);

    /* ============ ROUND 2 — the amendment is EXECUTED ============ */
    await put('MK-AMD1', c => { c.status = 'Signed'; c.signedAt = new Date().toISOString(); });
    const k1 = await A.json('/api/contracts/MK-AMD1');
    check('stage: the amendment is now genuinely executed', k1.status === 'Signed', k1.status);

    h.mail.sent.length = 0;
    /* clear the dedupe so the sweep can speak again about the same contract */
    const rem2 = await A.json('/api/reminders/run', { method: 'POST', body: {} });
    await settle();
    const mailsSigned = h.mail.sent.slice();
    const expiryMailSigned = mailsSigned.filter(m => /MK-FAM1|Refined Sugar/.test(m.subject + m.text));
    check('SIGNED: the master no longer hits the 30-day mark once the amendment is signed',
      expiryMailSigned.length === 0,
      expiryMailSigned.length ? `still mailed: ${expiryMailSigned.map(m=>m.subject).join(' | ')}` : 'no expiry mail — the term moved');

    /* ---- the DAILY BRIEF must agree with the sweep ---- */
    h.mail.sent.length = 0;
    const db1 = await A.json('/api/daily-brief/run', { method: 'POST', body: {} });
    await settle();
    const briefs = h.mail.sent.slice();
    const briefText = briefs.map(m => m.subject + '\n' + m.text).join('\n----\n');
    fs.writeFileSync(path.join(__dirname, 'mail-daily-brief.txt'), briefText || '(nothing sent)');
    check('SIGNED: the daily brief does not list the master as expiring inside 30 days',
      !/Refined Sugar Supply Family/g.test(briefText) || !briefText.includes(PARENT_EXP),
      briefs.length ? `${briefs.length} brief(s); parent expiry ${PARENT_EXP} present: ${briefText.includes(PARENT_EXP)}` : 'no brief sent (quiet day)');
    check('the reminder sweep and the daily brief agree with each other',
      (expiryMailSigned.length === 0) === (!briefText.includes(PARENT_EXP)),
      `sweep mailed=${expiryMailSigned.length} · brief names parent expiry=${briefText.includes(PARENT_EXP)}`);

    /* ============ THE SCREENS ============ */
    browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2800);

    const model = await page.evaluate(({ PARENT_EXP, CHILD_EXP }) => {
      const p = getContract('MK-FAM1');
      return {
        loaded: !!p,
        own: window.ownExpiry ? ownExpiry(p) : null,
        eff: window.effectiveExpiry ? effectiveExpiry(p) : null,
        src: window.expirySource ? (expirySource(p) || {}).id : null,
        prop: window.proposedExpiry ? proposedExpiry(p) : null,
        PARENT_EXP, CHILD_EXP,
      };
    }, { PARENT_EXP, CHILD_EXP });
    check('BROWSER MODEL: the master\'s effective expiry is the amendment\'s date', model.eff === CHILD_EXP, `own=${model.own} effective=${model.eff} from=${model.src}`);

    /* --- REGISTER ROW --- */
    await page.evaluate(() => { setView('register'); });
    await page.waitForTimeout(1200);
    const reg = await page.evaluate(() => {
      const row = document.querySelector('tr[data-row="MK-FAM1"], tr[data-sel="MK-FAM1"]')
        || [...document.querySelectorAll('#reg-body tr, table tr')].find(t => t.textContent.includes('Refined Sugar'));
      return row ? row.innerText.replace(/\s+/g, ' ').trim() : null;
    });
    await page.screenshot({ path: path.join(SHOTS, 'j8-register.png'), fullPage: false });
    const regDot = d => d ? d.slice(8,10) + '.' + d.slice(5,7) + '.' + d.slice(0,4) : '';
    check('REGISTER ROW prints the effective (amended) date, not the master\'s own',
      !!reg && reg.includes(regDot(CHILD_EXP)) && !reg.includes(regDot(PARENT_EXP)),
      `row="${reg}" — want ${regDot(CHILD_EXP)}, must not show ${regDot(PARENT_EXP)}`);

    /* --- KEY TERMS + FAMILY CARD --- */
    await page.evaluate(() => { state.activeId = 'MK-FAM1'; state.selId = 'MK-FAM1'; setView('workspace'); });
    await page.waitForTimeout(1800);
    /* Press the Key terms tab for real — _wsTabWant is module-local and cannot
       be set from outside, and pressing is what a person does anyway. */
    await page.click('[data-ws-tab="terms"]');
    await page.waitForTimeout(1800);
    const kt = await page.evaluate(() => {
      const fam = document.querySelector('#family-section');
      const pane = document.querySelector('#kt-side') || document.querySelector('.terms-grid');
      return {
        famText: fam ? fam.innerText.replace(/\s+/g, ' ').trim() : null,
        famVisible: fam ? (fam.getBoundingClientRect().width > 4 && fam.getBoundingClientRect().height > 4) : false,
        sideText: pane ? pane.innerText.replace(/\s+/g, ' ').trim() : null,
        ktAll: (document.querySelector('#view-workspace') || document.body).innerText.replace(/\s+/g, ' ').trim(),
      };
    });
    await page.screenshot({ path: path.join(SHOTS, 'j8-keyterms.png') });
    check('FAMILY CARD is drawn on Key terms', kt.famVisible, kt.famText ? kt.famText.slice(0, 200) : 'absent');
    check('FAMILY CARD states the live expiry and names where it came from',
      !!kt.famText && kt.famText.includes(CHILD_EXP.slice(0,4)) && /MK-AMD1/.test(kt.famText),
      kt.famText ? kt.famText.slice(0, 260) : 'absent');
    check('KEY TERMS shows the amended term, not the superseded one',
      kt.ktAll.includes(CHILD_EXP) || kt.ktAll.includes(regDot(CHILD_EXP)),
      `looked for ${CHILD_EXP}/${regDot(CHILD_EXP)}`);

    /* --- CALENDAR --- */
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(1500);
    const cal = await page.evaluate(() => (document.querySelector('#view-calendar') || document.body).innerText.replace(/\s+/g, ' ').trim());
    await page.screenshot({ path: path.join(SHOTS, 'j8-calendar.png') });

    /* --- DASHBOARD --- */
    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(1800);
    const dash = await page.evaluate(({ PARENT_EXP }) => {
      const s = window.hmDashSlices ? hmDashSlices() : null;
      const names = s && s.expiring ? s.expiring.map(c => c.id) : null;
      return { expiringIds: names, text: (document.querySelector('#view-dashboard')||document.body).innerText.replace(/\s+/g,' ').trim().slice(0, 900) };
    }, { PARENT_EXP });
    await page.screenshot({ path: path.join(SHOTS, 'j8-dashboard.png') });
    check('DASHBOARD: the master is NOT counted as expiring soon once the amendment is signed',
      !dash.expiringIds || !dash.expiringIds.includes('MK-FAM1'),
      `expiring slice = ${JSON.stringify(dash.expiringIds)}`);

    /* --- the family card's AMBER proposal line, back on a DRAFT --- */
    const amber = await page.evaluate(() => {
      const k = getContract('MK-AMD1'); k.status = 'Draft'; delete k.signedAt;
      const p = getContract('MK-FAM1');
      const prop = proposedExpiry(p);
      return { eff: effectiveExpiry(p), prop: prop && prop.date, propId: prop && prop.id };
    });
    check('back on a DRAFT: the live date reverts and the proposal is stated beside it',
      amber.eff === PARENT_EXP && amber.prop === CHILD_EXP,
      `live=${amber.eff} proposed=${amber.prop} from ${amber.propId}`);

    check('no page errors across the surfaces walk', errors.length === 0, errors.join(' | ') || 'none');
    fs.writeFileSync(path.join(__dirname, 'surfaces.json'), JSON.stringify({ PARENT_EXP, CHILD_EXP, model, reg, kt: { famText: kt.famText }, dash, rem1, rem2, db1, mailsDraft: mailsDraft.map(m=>({to:m.to,subject:m.subject})), mailsSigned: mailsSigned.map(m=>({to:m.to,subject:m.subject})) }, null, 2));
  } catch (e) {
    check('J8 surfaces walk completed without throwing', false, e.message + '\n' + e.stack);
  } finally {
    const pass = results.filter(r => r.pass).length;
    console.log(`\n${pass}/${results.length} checks passed`);
    fs.writeFileSync(path.join(__dirname, 'results-surfaces.json'), JSON.stringify(results, null, 2));
    if (browser) await browser.close();
    await h.stop();
    process.exit(pass === results.length ? 0 : 1);
  }
})();
