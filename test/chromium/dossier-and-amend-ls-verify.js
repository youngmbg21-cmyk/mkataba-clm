'use strict';
/* dossier-and-amend-ls-verify — THE DOSSIER AND AMEND, THE LEGORA + STRIPE WAY (the owner's "Build Dossier L+S and Amend
   L+S", 22 Nov 2026; f1153 pins the readers). Driven in the new look, where the reader looks:

   1  a signed agreement's Dossier: the card's one black button is Amend this agreement; the Family card stands open
      ABOVE the facts; "amend" is not among the links above Jambo's box
   2  Amend is ONE full page over the paper (no grey card, no zoom): tabs Changes · Signed paper · Amendment paper
   3  a clause pressed on the signed paper keeps its figures (KES 85,000,000 — never "KES , based")
   4  typing the new words in the row: the row says what it does, its press makes the end date the amendment's suggestion,
      and the panel shows it — with no money in the panel
   5  the Amendment paper is what Create writes ("In clause 4, … is replaced by …")
   6  Create: the draft carries the figures; back on the agreement the card says Continue, the line carries the tag,
      the family row is a door; the draft's line says Amends MK-B1
   8  TELL JAMBO THE CHANGE (the owner's pick, 23 Nov 2026): the door asks "What do you want to change?" in a pop-up; Jambo's
      answer (a stand-in here) lands on Approve the changes, each change WAITING with why its clause was chosen; Next and
      Create stay grey until each is approved; what no clause covers says Not found; the check step shows Before you
      create and, on a press, the agreement as amended
   1d–1h THE DOSSIER END TO END, STEP 1 (owner, 23 Nov 2026; f1194): on the signed agreement the headline never says
      "Nothing is owed on this contract"; Where the deal stands ticks both sides; no Fill in on a signed paper, in the
      facts or the notes beside it; the Family card draws its first node; the life line only where the record has days
   Each half guarded: a missing feature reports, it does not time out. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const until = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati(); await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length && typeof currentUser === 'function' && currentUser() && currentUser().role, null, 20000);
    await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
    await page.reload({ waitUntil: 'networkidle' });
    await until(page, () => window.state && state.contracts && state.contracts.length && typeof newLookOn === 'function' && newLookOn(), null, 20000);

    /* 1 — the Dossier of a signed agreement */
    await page.evaluate(() => roomHomeLand('MK-B1'));
    const d1 = await until(page, () => !!document.querySelector('#ig-dock .pd2-card [data-pd-ds-famact="create"]'));
    check('1a the card\'s one black button is Amend this agreement', d1);
    const d1b = await page.evaluate(() => {
      const fam = document.querySelector('#ig-dock [data-pd2-famc]'), facts = document.querySelector('#ig-dock .pd2-facts');
      const links = [...document.querySelectorAll('#ig-dock .igd-foot [data-ca-chip], #ig-dock [data-ca-chip]')].map(b => b.getAttribute('data-ca-chip'));
      return { fam: !!fam, above: !!(fam && facts && (fam.compareDocumentPosition(facts) & Node.DOCUMENT_POSITION_FOLLOWING)), amendLink: links.includes('amend') };
    });
    check('1b the Family card stands open above the facts', d1b.fam && d1b.above, JSON.stringify(d1b));
    check('1c "amend" is not among the links above Jambo\'s box', !d1b.amendLink);
    /* 1d–1h — THE DOSSIER END TO END, STEP 1 (f1194): the signed card's headline, the two sides ticked, no Fill in on a
       signed paper (facts and notes), the family's first node, the life line where the record holds both days */
    const d1d = await page.evaluate(() => {
      const g = document.querySelector('#ig-dock #pd-glance'), c = pdContract();
      const head = (document.querySelector('#ig-dock .pd2-card [data-pd2-next]') || {}).textContent || '';
      const sides = [...document.querySelectorAll('#ig-dock .pd2-two-s')].map(x => x.className);
      const day = v => /^\d{4}-\d{2}-\d{2}/.test(String(v || ''));
      const hasDays = !!(c && (day(c.signedAt) || day(c.fields && c.fields.effDate)) && day(typeof effectiveExpiry === 'function' ? effectiveExpiry(c) : c.expiry));
      return { head, sides, fill: !!(g && g.querySelector('[data-pd-fill-key]')), noteFill: !!document.querySelector('[data-pd2-go="fill"]'),
        fam: !!document.querySelector('#ig-dock .pd2-fam-chain, #ig-dock .pd2-fam-row'), life: !!document.querySelector('#ig-dock .pd2-life'), hasDays,
        sealed: typeof pd2Sealed === 'function' && pd2Sealed(c) };
    });
    check('1d a signed agreement\'s headline never says "Nothing is owed on this contract"', d1d.sealed && !/Nothing is owed on this contract/.test(d1d.head), JSON.stringify({ head: d1d.head, sealed: d1d.sealed }));
    check('1e Where the deal stands shows the two sides, both ticked once signed', d1d.sides.length === 2 && d1d.sides.every(x => /is-ok/.test(x)), d1d.sides.join(' | '));
    check('1f no Fill in on a signed paper — not in the facts, not in the notes beside the paper', !d1d.fill && !d1d.noteFill, JSON.stringify(d1d));
    check('1g the Family card draws the original (and its amendments when there are some)', d1d.fam);
    check('1h the life line stands where the record holds a start and an end, and only there', d1d.life === d1d.hasDays, JSON.stringify({ life: d1d.life, hasDays: d1d.hasDays }));
    /* 1i–1k PLAN THE READ (the Dossier L+S, step 2; f1195): a paper not yet read carries the Plan tab between Dossier and
       Clauses; it opens the one Legora sheet asking what you want; Cancel writes nothing */
    const pid = await page.evaluate(() => { const c = state.contracts.find(x => x && x.status !== 'Signed' && typeof pd2PlanTabOn === 'function' && !x.hash && !(x.breakdown && x.breakdown.ok)); return c ? c.id : ''; });
    if (pid){
      await page.evaluate(id => roomHomeLand(id), pid);
      const tabs = await until(page, () => !!document.querySelector('#ig-dock [data-pd-tab="plan"]'));
      const order = await page.evaluate(() => [...document.querySelectorAll('#ig-dock [data-pd-tab]')].map(b => b.getAttribute('data-pd-tab')).join(','));
      check('1i a paper not read yet carries the Plan tab, after the Dossier and before Clauses', tabs && /copilot,plan,doc/.test(order), order);
      await page.evaluate(() => { const b = document.querySelector('#ig-dock [data-pd-tab="plan"]'); if (b) b.click(); });
      const op = await until(page, () => !!document.querySelector('#ig-dock [data-pd2-plan-open]'));
      if (op) await page.evaluate(() => document.querySelector('#ig-dock [data-pd2-plan-open]').click());
      const sheet = await until(page, () => !!document.querySelector('#pd2-plan-sheet #pd2-plan-ask'));
      check('1j Plan the read opens the one sheet asking what you want', op && sheet);
      if (sheet) await page.evaluate(() => { const x = document.querySelector('#pd2-plan-sheet [data-lgp-close]'); if (x) x.click(); });
      const none = await page.evaluate(id => !(getContract(id) || {}).readPlan, pid);
      check('1k closing the sheet writes no plan', none);
    } else check('1i a paper not read yet is in the seeded book', false, 'none found');
    /* 1l THE CLAUSES TAB STEPS ONE CLAUSE (the Dossier L+S, step 3; f1196): › under the list's head opens the next clause */
    await page.evaluate(() => { const b = document.querySelector('#ig-dock [data-pd-tab="doc"]'); if (b) b.click(); });
    const navOk = await until(page, () => !!document.querySelector('#pd-thread .doc-th-nav [data-th-nav-step="1"]'));
    const k0 = await page.evaluate(() => (document.querySelector('#pd-thread .doc-th-k') || {}).textContent || '');
    if (navOk) await page.evaluate(() => { const b = document.querySelector('#pd-thread [data-th-nav-step="1"]'); if (b && !b.disabled) b.click(); });
    const moved = navOk && await until(page, k => ((document.querySelector('#pd-thread .doc-th-k') || {}).textContent || '') !== k, k0, 4000);
    check('1l the Clauses tab says which clause of how many, and › opens the next', navOk && moved, k0);

    /* 2 — one full page */
    /* RE-POINTED 23 Nov 2026 (the Dossier L+S steps 2 and 3 added 1i–1l, which leave MK-B1 for a paper not yet read):
       the signed agreement is brought back, on its Dossier, before its Amend door is pressed; the wait asks for the door */
    await page.evaluate(() => roomHomeLand('MK-B1'));
    await until(page, () => !!(window.pdContract && pdContract() && pdContract().id === 'MK-B1') && !!document.querySelector('#ig-dock .pd2-card [data-pd-ds-famact="create"]'));
    await page.click('#ig-dock .pd2-card [data-pd-ds-famact="create"]').catch(() => {});
    /* RE-POINTED 23 Nov 2026 (Tell Jambo the change): the door asks first; "or choose the clauses yourself" is the page */
    const ask = await until(page, () => !!document.querySelector('#pd2-amk #pd2-amk-q'));
    check('2 the Amend door asks what should change, in a pop-up', ask);
    if (ask) await page.click('#pd2-amk [data-pd2-amk-manual]');
    const p2 = await until(page, () => !!document.querySelector('#ig-paper-scroll.is-amx > .pd2-amx'));
    check('2a Amend opens one page over the paper', p2);
    const p2b = await page.evaluate(() => {
      const sc = document.getElementById('ig-paper-scroll'), pg = sc && sc.querySelector(':scope > .pd2-amx');
      const r = pg ? pg.getBoundingClientRect() : null, s = sc ? sc.getBoundingClientRect() : null;
      return { tabs: [...document.querySelectorAll('.pd2-amx [data-pd2-amx-tab]')].map(b => b.getAttribute('data-pd2-amx-tab')).join(','),
        edge: r && s ? Math.round(Math.abs(r.left - s.left) + Math.abs(r.right - s.right)) : -1 };
    });
    /* RE-POINTED 23 Nov 2026 (the steps in their order): 1 the signed paper · 2 the changes · 3 the amendment */
    check('2b its steps are the signed paper · the changes · the amendment', p2b.tabs.startsWith('signed,changes,paper'), p2b.tabs);
    check('2c the page runs edge to edge (no card inside a desk)', p2b.edge >= 0 && p2b.edge <= 2, `${p2b.edge}px off the edges`);

    /* 3 — a pressed clause keeps its figures */
    await page.click('.pd2-amx [data-pd2-amx-tab="signed"]').catch(() => {});
    /* THE PRESS LANDS ON A STILL CLAUSE (24 Nov 2026, red on GitHub on one run in two: the press fell on the preamble): the
       clause is brought into view, then its place must hold for six frames running (bounded at 90) and the point must
       be the clause's own (elementFromPoint) before the mouse goes down */
    const press = async re => { const b = await page.evaluate(async r => {
      const p = [...document.querySelectorAll('#ig-canvas [data-anchor]')].find(n => new RegExp(r).test(n.textContent)); if (!p) return null;
      p.scrollIntoView({ block: 'center' });
      const frame = () => new Promise(f => requestAnimationFrame(() => f()));
      let last = null, held = 0;
      for (let k = 0; k < 90 && held < 6; k++){ await frame(); const y = Math.round(p.getBoundingClientRect().top); if (y === last) held++; else { held = 0; last = y; } }
      const q = p.getBoundingClientRect(), x = q.left + 60, y = q.top + 14, hit = document.elementFromPoint(x, y);
      return (hit && p.contains(hit)) ? { x, y } : null; }, re); if (b) await page.mouse.click(b.x, b.y); return !!b; };
    const pr = (await press('Price & Contract Value')) && (await press('Term and Renewal'));
    check('3a two clauses pressed on the signed paper', pr);
    await page.click('.pd2-amx [data-pd2-amx-tab="changes"]').catch(() => {});
    await until(page, () => document.querySelectorAll('.pd2-amx [data-pd2-amx-row]').length >= 2);
    const was = await page.evaluate(() => (document.querySelector('.pd2-amx [data-pd2-amx-row="0"] .pd2-amx-was') || {}).textContent || '');
    check('3b the signed words keep their figures', /85,000,000/.test(was) && !/KES\s*,/.test(was), was.slice(0, 80));

    /* 4 — typing a row */
    const typeRow = async (i, fn) => { await page.click(`.pd2-amx [data-pd2-amx-edit="${i}"]`).catch(() => {}); const box = await page.$(`.pd2-amx [data-pd2-amx-txt="${i}"]`); if (!box) return false; const v = await box.inputValue(); await box.fill(fn(v)); await page.mouse.click(700, 150); return true; };
    const t1 = await typeRow(1, v => v.replace('three (3)', 'four (4)'));
    check('4a a row\'s new words are typed in the row', t1);
    const use = await until(page, () => !!document.querySelector('.pd2-amx [data-pd2-amx-use="expiry"]'));
    check('4b the term row offers its new end date in one press', use);
    if (use) await page.click('.pd2-amx [data-pd2-amx-use="expiry"]');
    const p4 = await page.evaluate(() => ({ ok: !!document.querySelector('.pd2-amx .pd2-amx-ans.is-ok'), panel: (document.querySelector('#pd-amendface') || {}).innerText || '' }));
    check('4c pressed, the row and the panel say the new end', p4.ok && /2028/.test(p4.panel), p4.panel.replace(/\s+/g, ' ').slice(0, 120));
    check('4d no money in the Amend panel', !/KES\s?\d/.test(p4.panel));

    /* 5 — the amendment's paper */
    await page.click('.pd2-amx [data-pd2-amx-tab="paper"]').catch(() => {});
    const paper = await page.evaluate(() => (document.querySelector('.pd2-amx-sheet') || {}).innerText || '');
    check('5 the Amendment paper says exactly what is replaced', /In clause 4, .*three \(3\).* is replaced by .*four \(4\)/.test(paper), paper.replace(/\s+/g, ' ').slice(0, 160));

    /* 6 — Create, and the doors back */
    await page.click('.pd2-amx-next[data-pd2-am-create]').catch(() => {});
    const kid = await until(page, () => state.contracts.some(x => x.parentId === 'MK-B1'));
    const k = await page.evaluate(() => { const x = state.contracts.find(y => y.parentId === 'MK-B1'); return x ? { id: x.id, body: String(x.redlineText || '') } : null; });
    check('6a Create makes the draft, filed against the agreement', kid && !!k);
    check('6b the draft carries the figures', !!k && !/KES\s*,/.test(k.body), k ? k.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 120) : '');
    await page.evaluate(() => roomHomeLand('MK-B1'));
    const cont = await until(page, () => !!document.querySelector('#ig-dock .pd2-card [data-fam-go]') && !!document.querySelector('#ig-strip .fam-tag'));
    check('6c back on the agreement: Continue on the card, the family tag on the line', cont);
    const row = await until(page, () => !!document.querySelector('#ig-dock [data-pd2-famc] [data-pd-ds-fam]'));
    check('6d the family row is a door to the amendment', row);
    if (k){ await page.evaluate(id => roomHomeLand(id), k.id);
      const back = await until(page, id => { const t = document.querySelector('#ig-strip .fam-tag'); return !!(t && t.getAttribute('data-fam-go') === 'MK-B1'); }, k.id);
      check('6e the draft\'s line says which agreement it amends, a door back', back); }

    /* 7 — start from today's deal: Amendment 1 signed (its record marked here), a second amendment quotes today's words */
    if (k){
      await page.evaluate(id => { const x = getContract(id); x.status = 'Signed'; x.signedAt = new Date().toISOString(); if (typeof familyIndexDirty === 'function') familyIndexDirty(); }, k.id);
      await page.evaluate(() => roomHomeLand('MK-B1'));
      const amend2 = await until(page, () => !!document.querySelector('#ig-dock .pd2-card [data-pd-ds-famact="create"]'));
      if (amend2) await page.click('#ig-dock .pd2-card [data-pd-ds-famact="create"]');
      if (await until(page, () => !!document.querySelector('#pd2-amk [data-pd2-amk-manual]'))) await page.click('#pd2-amk [data-pd2-amk-manual]');
      const today = await until(page, () => !!document.querySelector('#ig-canvas .pd-am-today'));
      check('7a the signed paper shows a changed clause as it stands today', today);
      await page.click('.pd2-amx [data-pd2-amx-tab="paper"]').catch(() => {});
      const p7 = await page.evaluate(() => (document.querySelector('.pd2-amx-sheet') || {}).innerText || '');
      check('7b the second amendment says it amends the agreement as amended', /as amended by Amendment No\. 1/.test(p7), p7.replace(/\s+/g, ' ').slice(0, 160));
    }

    /* 8 — Tell Jambo the change, on another signed agreement (MK-A1) */
    /* RE-POINTED 23 Nov 2026: the stand-in answer names a clause by its number and heading, as the reader does; a
       preamble with neither drew as "New clause" and matched nothing on the agreement as amended (8f) */
    await page.route('**/api/ai/amend', async r => { const c = await page.evaluate(() => amendParentClauses(getContract('MK-A1')).filter(x => x.text && x.num && x.label).slice(0, 1));
      const x = c[0] || { num: '1', label: '1. Term', text: 'The term is one year.' };
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ clauseNumber: x.num, clauseLabel: x.label, op: 'replace', signed: x.text, amended: x.text + ' This clause is amended.', why: 'it is the clause asked about' }],
        notFound: [{ what: 'Interest on late payments' }], facts: {} }) }); });
    await page.evaluate(() => roomHomeLand('MK-A1'));
    const d8 = await until(page, () => !!document.querySelector('#ig-dock .pd2-card [data-pd-ds-famact="create"]'));
    if (d8) await page.click('#ig-dock .pd2-card [data-pd-ds-famact="create"]');
    const q8 = await until(page, () => !!document.querySelector('#pd2-amk #pd2-amk-q'));
    check('8a the question pop-up opens on the door', q8);
    if (q8){ await page.click('#pd2-amk [data-pd2-amk-go]');
      check('8b nothing said is refused, and said where the reader looks', await until(page, () => !!document.querySelector('#pd2-amk .lgp-err')));
      await page.fill('#pd2-amk #pd2-amk-q', 'make it longer and add interest on late payments'); await page.click('#pd2-amk [data-pd2-amk-go]'); }
    /* what he found, ticked in from his answer, then one button (the owner's pick "Real finds, then a button") */
    const f8 = await until(page, () => !!document.querySelector('#pd2-amk [data-pd2-amk-see]'), null, 12000);
    const fl = f8 ? await page.evaluate(() => [...document.querySelectorAll('#pd2-amk .pd2-amk-finds li')].map(li => li.textContent.replace(/\s+/g, ' ').trim())) : [];
    check('8b2 the pop-up lists what he found, and what no clause covers', fl.length === 2 && /Found in/.test(fl[0]) && /Interest on late payments/.test(fl[1]), JSON.stringify(fl));
    if (f8) await page.click('#pd2-amk [data-pd2-amk-see]');
    const r8 = await until(page, () => !!document.querySelector('.pd2-amr .pd2-amr-row'), null, 12000);
    const w8 = r8 ? await page.evaluate(() => ({ wait: !!document.querySelector('.pd2-amr-row .pd2-badge.is-amber'), why: /chose this clause/i.test((document.querySelector('.pd2-amr-why') || {}).textContent || ''),
      nf: /Interest on late payments/.test((document.querySelector('.pd2-amr-miss') || {}).textContent || ''), next: !!(document.querySelector('.pd2-amx-next') || {}).disabled })) : {};
    check('8c Jambo\'s change waits for a person, says why its clause, and the Next stays grey', r8 && w8.wait && w8.why && w8.next, JSON.stringify(w8));
    check('8d what no clause covers says Not found, never invented', !!w8.nf);
    if (r8){ await page.click('.pd2-amr [data-pd2-amx-ok="0"]'); }
    const ok8 = await until(page, () => { const n = document.querySelector('.pd2-amx-next'); return !!(n && !n.disabled); });
    check('8e Use it approves the change and the Next opens', ok8);
    if (ok8) await page.click('.pd2-amx-next');
    const c8 = await until(page, () => !!document.querySelector('.pd2-amc .pd2-amc-checks li'));
    if (c8) await page.click('.pd2-amc [data-pd2-amx-view="today"]');
    const t8 = await until(page, () => !!document.querySelector('.pd2-amc .pd2-amc-cl.is-changed'));
    check('8f the check step lists Before you create, and shows the agreement as amended on a press', c8 && t8);

    check('no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) { check('the run completed', false, e.message); }
  finally { await browser.close(); await h.stop(); }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
