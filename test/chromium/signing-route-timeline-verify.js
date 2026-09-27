/* Chromium verification: THE SIGNING ROUTE IS A TIMELINE (Young ruled it
   27 Sep 2026: "1, Yes. 2, Yes, 3, Yes. Then build timeline").
   ====================================================================
   "Create render options for this pop up. The current design is frankly very
   poor." Three designs were drawn working on the real Signing tab; the owner
   picked Timeline by name and answered the three questions the page ended on:
     1 · Save refuses a signer on their side who has no email;
     2 · Save refuses when the only name for a party is the company's;
     3 · Save refuses a party that signs (a guarantor) with nobody named.

   f398 pins what the code SAYS. This file drives the REAL window on the real
   Signing tab and measures what a reader sees and what the record holds:

   1 · the window is a timeline: numbered steps, "signs in any order" where
       two share a step, a complete person resting as one line that says who
       they sign for, no Step box and no side dropdown, one filled button in a
       pinned foot, and a lead line that is true for every order;
   2 · the owner's own NDA — the company's name as their "signer", no email —
       opens on that card, says why, and Save REFUSES in the window with the
       reason; typing the person's name moves the reason on to the missing
       email without losing the caret, and the email clears it; Save then files
       the person and their address;
   3 · the colleague picker, the add menu, the ⋯ menu (a step of their own,
       Alt+↑, Remove), Escape closing the smallest thing open, an empty place
       for a side with nobody, and Cancel leaving the record alone;
   4 · the guarantor: removing their signer shows an empty place, Save refuses
       naming the guarantor, and "Add who signs" files a signer for THAT party;
   5 · a NEW route never opens with the company's name in their box;
   6 · the phone hands the WHOLE route to the one save: a guarantor's signer is
       kept, and the new refusals are said on the phone's sheet too.

   Every claim is GATED on the window being on the page, so a build without
   the change REPORTS its failures rather than timing out. AT THE PARENT
   (5409902) 34 of the 37 FAIL, MEASURED in a worktree at unmodified main. The
   three that pass there pass on both sides by design: the stage line, 6a (the
   phone's sheet opening — it is the STAGE for section 6 and existed before),
   and the page-error sweep.

   Run: node test/chromium/signing-route-timeline-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'signing-route-timeline');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* What the window shows, read off the painted page. null where there is no
   window at all. */
async function readWin(page){
  return page.evaluate(() => {
    const w = document.getElementById('sr-win');
    if (!w) return null;
    const d = w.closest('[role="dialog"]');
    const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const steps = [...w.querySelectorAll('.sr-step')].map(s => ({
      node: (s.querySelector('.sr-node') || {}).textContent || '',
      head: ((s.querySelector('.sr-sh') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
      people: [...s.querySelectorAll('.sr-card')].map(cd => ({
        id: cd.getAttribute('data-sp-row'),
        open: cd.classList.contains('is-open'),
        name: cd.classList.contains('is-open')
          ? ((cd.querySelector('[data-sp-f="name"]') || {}).value || '')
          : (((cd.querySelector('.sr-who b') || {}).textContent) || ''),
        forTx: ((cd.querySelector('.sr-for') || {}).textContent || '').trim(),
      })),
    }));
    return {
      lead: ((w.querySelector('p') || {}).textContent || '').trim(),
      steps,
      misses: [...w.querySelectorAll('.sr-miss')].map(m => (m.querySelector('span') || {}).textContent || ''),
      hints: [...w.querySelectorAll('.sr-hint')].filter(h => !h.hidden && vis(h)).map(h => h.textContent),
      say: ((w.querySelector('#sr-say') || {}).textContent || '').trim(),
      numberBoxes: w.querySelectorAll('input[type="number"]').length,
      selects: w.querySelectorAll('select').length,
      filled: [...d.querySelectorAll('.ui-btn-primary')].filter(vis).map(b => b.textContent.trim()),
      footPinned: (() => { const f = w.querySelector('.dlg-foot'); return !!f && getComputedStyle(f).position === 'sticky'
        && !!f.querySelector('#sp-save') && !!f.querySelector('#sp-cancel'); })(),
      active: document.activeElement ? (document.activeElement.getAttribute('data-sp-f') || document.activeElement.id || '') : '',
    };
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org');
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Young Mbagaya');
    await page.fill('#su-email', 'young@highland.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    const s = await page.$('#su-sample'); if (s && !(await s.isChecked())) await s.check();
    await page.click('#su-go'); await pause(3500); await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await pause(800); }

    /* THE STAGE: three colleagues; the owner's NDA carrying the route their
       screenshot shows (a colleague, then the company's name with no address);
       a distributor contract between us, the distributor and its guarantor,
       the two of them signing first and together, then us. */
    const staged = await page.evaluate(async () => {
      for (const [name, email, title] of [['Amina Otieno', 'amina@highland.co.ke', 'Head of Legal'], ['Wanjiru Kamau', 'wanjiru@highland.co.ke', 'Legal Counsel'], ['Peter Mwangi', 'peter.mwangi@highland.co.ke', 'Finance Director']]) {
        try { await api('users', 'POST', { name, email, title, role: 'legal', password: 'memberpass123' }); } catch (e) {}
      }
      try { await loadBootstrap(); } catch (e) {}
      const users = getUsers();
      const amina = users.find(u => u.name === 'Amina Otieno'), peter = users.find(u => u.name === 'Peter Mwangi');
      const live = state.contracts.filter(c => c.status !== 'Signed' && c.status !== 'Declined' && !c.archived && !(c.signatures || []).length);
      const nda = live.find(c => /NDA/i.test(c.name || '')) || live[0];
      const dist = live.find(c => /Regional Distributor/.test(c.name || '') && c !== nda) || live.find(c => c !== nda);
      const fresh = live.find(c => c !== nda && c !== dist && c.counterparty);
      for (const c of [nda, dist, fresh]) { try { await ensureFull(c); } catch (e) {} }
      nda.counterparty = 'Juno Logistics Ltd';
      nda.signerPlan = [
        { id: 'sg_a1', party: 'internal', name: 'Amina Otieno', role: 'Head of Legal', email: 'amina@highland.co.ke', memberId: amina ? amina.id : '', order: 1, signed: false },
        { id: 'sg_b1', party: 'counterparty', name: 'Juno Logistics Ltd', role: '', email: '', memberId: '', order: 2, signed: false },
      ];
      dist.counterparty = 'Muranga Distributors Ltd';
      partiesSet(dist, [
        { side: 'ours', name: 'Highland Corporate Ltd' },
        { side: 'theirs', name: 'Muranga Distributors Ltd', role: 'Distributor' },
        { side: 'theirs', name: 'Muranga Holdings Ltd', role: 'Guarantor', involvement: 'sign' },
      ]);
      const th = partiesTheirs(dist);
      dist.signerPlan = [
        { id: 'sg_c1', party: 'counterparty', name: 'Joseph Kariuki', role: 'Managing Director', email: 'j.kariuki@murangadistributors.co.ke', memberId: '', order: 1, step: 1, partyId: th[0].id, signed: false },
        { id: 'sg_c2', party: 'counterparty', name: 'Grace Wambui', role: 'Director', email: 'grace.wambui@murangaholdings.co.ke', memberId: '', order: 2, step: 1, partyId: th[1].id, signed: false },
        { id: 'sg_c3', party: 'internal', name: 'Peter Mwangi', role: 'Finance Director', email: 'peter.mwangi@highland.co.ke', memberId: peter ? peter.id : '', order: 3, step: 2, signed: false },
      ];
      fresh.signerPlan = [];
      delete fresh.counterpartyEmail;
      [nda, dist, fresh].forEach(c => persist(c));
      try { await flushSaves(); } catch (e) {}
      return { nda: nda.id, dist: dist.id, fresh: fresh.id, freshCp: fresh.counterparty, holdings: th[1].id };
    });
    ok('the stage: an NDA, a contract with a guarantor, a contract with no route', !!(staged.nda && staged.dist && staged.fresh), staged);

    const openOn = async id => {
      await page.evaluate(id => { if (document.getElementById('sr-win')) closeModal(); openWorkspace(id); }, id); await pause(1000);
      await page.evaluate(id => { roomGoTab(getContract(id), 'sign'); }, id); await pause(900);
      await page.evaluate(id => { openSignerPlanEditor(getContract(id)); }, id); await pause(500);
      return readWin(page);
    };

    /* ---------- 1 · THE WINDOW IS A TIMELINE ---------- */
    const g = await openOn(staged.dist);
    await page.screenshot({ path: path.join(OUT, '1-guarantor.png') });
    ok('1a the route is drawn as numbered steps', !!g && g.steps.length === 2 && g.steps.map(x => x.node).join(',') === '1,2',
      g && g.steps.map(x => x.node));
    ok('1b two people in one step are said to sign in any order, one alone is not',
      !!g && /any order/.test(g.steps[0].head) && !/any order/.test(g.steps[1].head), g && g.steps.map(x => x.head));
    ok('1c a complete person rests as one line and says which party they sign for',
      !!g && g.steps[0].people.length === 2 && g.steps[0].people.every(p => !p.open)
        && g.steps[0].people[1].forTx === 'For Muranga Holdings Ltd' && g.steps[1].people[0].forTx === 'For Highland Corporate Ltd',
      g && g.steps.map(x => x.people.map(p => (p.open ? 'open ' : 'rest ') + p.name + ' / ' + p.forTx)));
    ok('1d one way to set the order: no Step number box and no side dropdown',
      !!g && g.numberBoxes === 0 && g.selects === 0, g && { numberBoxes: g.numberBoxes, selects: g.selects });
    ok('1e one filled button, Save route, in a foot pinned beside Cancel',
      !!g && g.filled.length === 1 && /Save route/.test(g.filled[0]) && g.footPinned, g && { filled: g.filled, pinned: g.footPinned });
    ok('1f the top line is true for every order', !!g && /top step down/.test(g.lead) && !/internal signature/.test(g.lead), g && g.lead);

    /* ---------- 2 · THE OWNER'S NDA ---------- */
    const n = await openOn(staged.nda);
    await page.screenshot({ path: path.join(OUT, '2-nda.png') });
    const their = n && n.steps[1] && n.steps[1].people[0];
    ok('2a the company standing in for a person opens, and says why',
      !!their && their.open && n.hints.includes('That is the company’s name. Who signs for it?')
        && n.hints.includes('Needed to send their signing link.'), n && { their, hints: n.hints });
    await page.click('#sp-save').catch(() => {}); await pause(400);
    const r2 = await readWin(page);
    ok('2b Save REFUSES in the window, naming the company, and the window stays',
      !!r2 && r2.say === 'Juno Logistics Ltd is the company. Name the person who signs for it.', r2 && r2.say);
    ok('2c the reader is put in the box that answers it', !!r2 && r2.active === 'name', r2 && r2.active);
    const still = await page.evaluate(id => (getContract(id).signerPlan || []).map(s => s.name), staged.nda);
    /* GATED on the window still standing: at the parent the old window's Save
       filed the route exactly as it already was, so "nothing moved" was true
       there for the wrong reason (measured). */
    ok('2d and nothing was filed', !!r2 && still.join('|') === 'Amina Otieno|Juno Logistics Ltd', still);
    const nameSel = '#sr-win .sr-card.is-open [data-sp-f="name"]';
    if (await page.$(nameSel)) { await page.fill(nameSel, ''); await page.type(nameSel, 'Grace Njeri', { delay: 15 }); }
    await pause(200);
    const r2e = await readWin(page);
    const typed = await page.$eval(nameSel, el => el.value).catch(() => '');
    ok('2e typing the person moves the reason on to the missing email, in place',
      !!r2e && r2e.say === 'Add an email for Grace Njeri. Their signing link is sent to it.', r2e && r2e.say);
    ok('2f without taking the caret: every letter landed', typed === 'Grace Njeri', typed);
    const emailSel = '#sr-win .sr-card.is-open [data-sp-f="email"]';
    if (await page.$(emailSel)) await page.type(emailSel, 'grace.njeri@junologistics.co.ke', { delay: 5 });
    await pause(200);
    const r2g = await readWin(page);
    ok('2g the address clears the refusal', !!r2g && r2g.say === '', r2g && r2g.say);
    await page.click('#sp-save').catch(() => {}); await pause(600);
    const saved2 = await page.evaluate(id => { const c = getContract(id);
      return { open: !!document.getElementById('sr-win'), plan: (c.signerPlan || []).map(s => [s.party, s.name, s.email, s.step]),
        audit: (c.audit || []).some(e => /Signing route/.test(e.action || '')) }; }, staged.nda);
    ok('2h Save files the person and their address, and closes', !!saved2 && !saved2.open
      && JSON.stringify(saved2.plan) === JSON.stringify([['internal', 'Amina Otieno', 'amina@highland.co.ke', 1], ['counterparty', 'Grace Njeri', 'grace.njeri@junologistics.co.ke', 2]])
      && saved2.audit, saved2);

    /* ---------- 3 · THE PICKER, THE MENUS, THE EMPTY PLACE ---------- */
    await openOn(staged.nda);
    const addTo1 = await page.$('#sr-win [data-sp-add="1"]');
    if (addTo1) { await addTo1.click(); await pause(200); }
    const menu3 = await page.evaluate(() => [...document.querySelectorAll('#sr-win .sr-menu .sr-mi')].map(b => b.textContent.trim()));
    ok('3a "Add someone to step 1" asks who they sign for',
      menu3.join('|') === 'For Highland Corporate Ltd|For Juno Logistics Ltd', menu3);
    const pickUs = await page.$('#sr-win .sr-menu .sr-mi');
    if (pickUs) { await pickUs.click(); await pause(300); }
    const r3b = await page.evaluate(() => ({ focus: document.activeElement && document.activeElement.getAttribute('data-sp-combo') != null,
      list: [...document.querySelectorAll('#sr-win .sr-cbl .sr-cbi b')].map(b => b.textContent) }));
    ok('3b the new person opens with the caret in the name and the team listed', r3b.focus && r3b.list.length >= 3, r3b);
    await page.keyboard.type('pe', { delay: 20 }); await pause(200);
    const r3c = await page.evaluate(() => [...document.querySelectorAll('#sr-win .sr-cbl .sr-cbi b')].map(b => b.textContent));
    ok('3c typing narrows the team', r3c.join('|') === 'Peter Mwangi', r3c);
    await page.keyboard.press('Enter'); await pause(300);
    const r3d = await page.evaluate(() => {
      const card = [...document.querySelectorAll('#sr-win .sr-card.is-open')].find(c => (c.querySelector('[data-sp-f="name"]') || {}).value === 'Peter Mwangi');
      return card ? { title: card.querySelector('[data-sp-f="role"]').value, email: card.querySelector('[data-sp-f="email"]').value,
        focus: document.activeElement === card.querySelector('[data-sp-f="role"]') } : null;
    });
    ok('3d Enter picks the colleague: their title and email fill in, and the caret moves on',
      !!r3d && r3d.title === 'Finance Director' && r3d.email === 'peter.mwangi@highland.co.ke' && r3d.focus, r3d);
    const r3e = await readWin(page);
    ok('3e step 1 now holds two people who sign in any order',
      !!r3e && r3e.steps[0].people.length === 2 && /any order/.test(r3e.steps[0].head), r3e && r3e.steps.map(x => x.head));
    const peterId = r3e && (r3e.steps[0].people.find(p => p.name === 'Peter Mwangi') || {}).id;
    const menuOf = async id => { const b = await page.$(`#sr-win [data-sp-menu="${id}"]`); if (b) { await b.click(); await pause(200); }
      return page.evaluate(() => [...document.querySelectorAll('#sr-win .sr-menu .sr-mi')].map(b => ({ t: b.textContent.trim(), d: b.disabled }))); };
    const m3 = peterId ? await menuOf(peterId) : [];
    ok('3f the ⋯ menu offers the moves, who they sign for, and Remove',
      ['Move up', 'Move down', 'Sign on a step of their own', 'Highland Corporate Ltd', 'Juno Logistics Ltd', 'Remove'].every(t => m3.some(x => x.t === t)), m3.map(x => x.t));
    await page.keyboard.press('Escape'); await pause(200);
    const afterEsc = await page.evaluate(() => ({ win: !!document.getElementById('sr-win'), menu: !!document.querySelector('#sr-win .sr-menu') }));
    ok('3g Escape closes the menu and keeps the window', afterEsc.win && !afterEsc.menu, afterEsc);
    if (peterId) { await menuOf(peterId); const split = await page.$('#sr-win .sr-menu .sr-mi[data-sp-do="split"]'); if (split) { await split.click(); await pause(300); } }
    const r3h = await readWin(page);
    ok('3h "Sign on a step of their own" gives them a step after the one they shared',
      !!r3h && r3h.steps.length === 3 && r3h.steps[1].people.map(p => p.name).join() === 'Peter Mwangi', r3h && r3h.steps.map(x => x.people.map(p => p.name)));
    const focusIn = await page.$(`#sr-win [data-sp-row="${peterId}"] [data-sp-f="role"]`);
    if (focusIn) { await focusIn.focus(); await page.keyboard.press('Alt+ArrowUp'); await pause(300); }
    const r3i = await readWin(page);
    ok('3i Alt+↑ moves them above the step before, and keeps the caret with them',
      !!r3i && r3i.steps[0].people.map(p => p.name).join() === 'Peter Mwangi' && r3i.active === 'role', r3i && { steps: r3i.steps.map(x => x.people.map(p => p.name)), active: r3i.active });
    if (peterId) { await menuOf(peterId); const rm = await page.$('#sr-win .sr-menu .sr-mi[data-sp-do="remove"]'); if (rm) { await rm.click(); await pause(300); } }
    const graceId = await page.evaluate(() => { const c = [...document.querySelectorAll('#sr-win .sr-card')].find(x => /Grace Njeri/.test(x.textContent)); return c && c.getAttribute('data-sp-row'); });
    if (graceId) { await menuOf(graceId); const rm = await page.$('#sr-win .sr-menu .sr-mi[data-sp-do="remove"]'); if (rm) { await rm.click(); await pause(300); } }
    const r3j = await readWin(page);
    ok('3j a side with nobody is an empty place that carries the act',
      !!r3j && r3j.misses.join('|') === 'Nobody signs for Juno Logistics Ltd yet'
        && await page.$('#sr-win [data-sp-miss] [data-sp-addfor]') !== null, r3j && r3j.misses);
    await page.click('#sp-save').catch(() => {}); await pause(400);
    const r3k = await readWin(page);
    ok('3k Save refuses with the side that is missing, and points at the empty place',
      !!r3k && /Name who signs for Juno Logistics Ltd/.test(r3k.say)
        && await page.evaluate(() => !!(document.activeElement && document.activeElement.hasAttribute('data-sp-addfor'))), r3k && r3k.say);
    await page.click('#sp-cancel').catch(() => {}); await pause(400);
    const after3 = await page.evaluate(id => ({ open: !!document.getElementById('sr-win'), plan: (getContract(id).signerPlan || []).map(s => s.name) }), staged.nda);
    ok('3l Cancel closes and leaves the record as it was', !after3.open && after3.plan.join('|') === 'Amina Otieno|Grace Njeri', after3);

    /* ---------- 4 · THE GUARANTOR ---------- */
    await openOn(staged.dist);
    const gw = await page.evaluate(() => { const c = [...document.querySelectorAll('#sr-win .sr-card')].find(x => /Grace Wambui/.test(x.textContent)); return c && c.getAttribute('data-sp-row'); });
    if (gw) { await menuOf(gw); const rm = await page.$('#sr-win .sr-menu .sr-mi[data-sp-do="remove"]'); if (rm) { await rm.click(); await pause(300); } }
    const r4 = await readWin(page);
    ok('4a the guarantor with nobody is an empty place', !!r4 && r4.misses.join('|') === 'Nobody signs for Muranga Holdings Ltd yet', r4 && r4.misses);
    await page.click('#sp-save').catch(() => {}); await pause(400);
    const r4b = await readWin(page);
    ok('4b Save REFUSES a party that signs with nobody named, a guarantor included',
      !!r4b && r4b.say === 'Name who signs for Muranga Holdings Ltd. Every party that signs the agreement needs someone named.', r4b && r4b.say);
    ok('4c and puts the reader on that party\'s own empty place',
      await page.evaluate(h => !!(document.activeElement && document.activeElement.getAttribute('data-sp-addfor') === h), staged.holdings));
    await page.screenshot({ path: path.join(OUT, '4-guarantor-refused.png') });
    const addFor = await page.$(`#sr-win [data-sp-addfor="${staged.holdings}"]`);
    if (addFor) { await addFor.click(); await pause(300); }
    const newName = '#sr-win .sr-card.is-open [data-sp-f="name"]';
    if (await page.$(newName)) { await page.type(newName, 'Grace Wambui', { delay: 5 });
      await page.type('#sr-win .sr-card.is-open [data-sp-f="email"]', 'grace.wambui@murangaholdings.co.ke', { delay: 2 }); }
    await page.click('#sp-save').catch(() => {}); await pause(600);
    const saved4 = await page.evaluate(id => { const c = getContract(id); const holdings = partiesTheirs(c)[1];
      return { open: !!document.getElementById('sr-win'),
        grace: (c.signerPlan || []).filter(s => s.name === 'Grace Wambui').map(s => ({ partyId: s.partyId, forHoldings: s.partyId === holdings.id, step: s.step })) }; }, staged.dist);
    ok('4d "Add who signs" files a signer for THAT party, on a step of their own',
      !saved4.open && saved4.grace.length === 1 && saved4.grace[0].forHoldings && saved4.grace[0].step === 3, saved4);

    /* ---------- 5 · A NEW ROUTE ---------- */
    const f = await openOn(staged.fresh);
    const freshTheirs = f && f.steps.flatMap(x => x.people).find(p => /^For /.test(p.forTx) && p.forTx !== 'For Highland Corporate Ltd');
    ok('5a a new route never opens with the company\'s name in their box',
      !!freshTheirs && freshTheirs.open && freshTheirs.name !== staged.freshCp, freshTheirs);
    ok('5b where the record knows nobody there, it asks the question instead',
      !!freshTheirs && (freshTheirs.name !== '' || f.hints.includes('Who signs for ' + staged.freshCp + '?')), f && { name: freshTheirs && freshTheirs.name, hints: f.hints });
    await page.evaluate(() => { if (document.getElementById('sr-win')) closeModal(); });
    await page.screenshot({ path: path.join(OUT, '5-closed.png') });

    /* ---------- 6 · THE PHONE HANDS THE WHOLE ROUTE TO THE ONE SAVE ---------- */
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const pp = await phone.newPage();
    pp.on('pageerror', e => errs.push('phone: ' + String(e).slice(0, 200)));
    await pp.goto(h.base + '/', { waitUntil: 'networkidle' }); await pause(600);
    await pp.fill('#li-email', 'young@highland.co.ke').catch(() => {}); await pp.fill('#li-pass', 'adminpassword1').catch(() => {});
    await pp.click('#li-go').catch(() => {}); await pause(2600);
    const sheet = await pp.evaluate(async id => {
      const c = getContract(id); if (!c) return null;
      try { await ensureFull(c); } catch (e) {}
      window.mGo('contract', { activeId: id }); window.state.activeId = id; window.mRender();
      await new Promise(r => setTimeout(r, 500));
      window.mOpenSheet('signers', { signersErr: '', signers: null, signersFor: null });
      await new Promise(r => setTimeout(r, 400));
      return { fields: document.querySelectorAll('[data-m-signer]').length, n: (c.signerPlan || []).length };
    }, staged.dist);
    ok('6a the phone\'s sheet opens on the guarantor contract', !!sheet && sheet.fields === 6 && sheet.n === 3, sheet);
    await pp.fill('[data-m-signer="theirs.email"]', '').catch(() => {});
    await pp.locator('[data-m-act="signers-save"]').click().catch(() => {}); await pause(500);
    const phErr = await pp.evaluate(() => (document.querySelector('#m-root .m-err') || {}).textContent || '');
    ok('6b a signer on their side with no email is refused on the phone too', /^Add an email for Joseph Kariuki\./.test(phErr), phErr);
    await pp.fill('[data-m-signer="theirs.email"]', 'joseph@murangadistributors.co.ke').catch(() => {});
    await pp.locator('[data-m-act="signers-save"]').click().catch(() => {}); await pause(800);
    const phSaved = await pp.evaluate(id => (getContract(id).signerPlan || []).map(s => s.name + ' · ' + s.step), staged.dist);
    ok('6c the save keeps every signer on the route — the guarantor\'s included, in order',
      phSaved.join('|') === 'Joseph Kariuki · 1|Peter Mwangi · 2|Grace Wambui · 3', phSaved);
    await phone.close();

    ok('no page errors', errs.length === 0, errs);
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
