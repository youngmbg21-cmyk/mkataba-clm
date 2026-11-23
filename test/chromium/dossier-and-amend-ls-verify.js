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

    /* 2 — one full page */
    await page.click('#ig-dock .pd2-card [data-pd-ds-famact="create"]').catch(() => {});
    const p2 = await until(page, () => !!document.querySelector('#ig-paper-scroll.is-amx > .pd2-amx'));
    check('2a Amend opens one page over the paper', p2);
    const p2b = await page.evaluate(() => {
      const sc = document.getElementById('ig-paper-scroll'), pg = sc && sc.querySelector(':scope > .pd2-amx');
      const r = pg ? pg.getBoundingClientRect() : null, s = sc ? sc.getBoundingClientRect() : null;
      return { tabs: [...document.querySelectorAll('.pd2-amx [data-pd2-amx-tab]')].map(b => b.getAttribute('data-pd2-amx-tab')).join(','),
        edge: r && s ? Math.round(Math.abs(r.left - s.left) + Math.abs(r.right - s.right)) : -1 };
    });
    check('2b its tabs are Changes · Signed paper · Amendment paper', p2b.tabs.startsWith('changes,signed,paper'), p2b.tabs);
    check('2c the page runs edge to edge (no card inside a desk)', p2b.edge >= 0 && p2b.edge <= 2, `${p2b.edge}px off the edges`);

    /* 3 — a pressed clause keeps its figures */
    await page.click('.pd2-amx [data-pd2-amx-tab="signed"]').catch(() => {});
    const press = async re => { const b = await page.evaluate(r => { const p = [...document.querySelectorAll('#ig-canvas [data-anchor]')].find(n => new RegExp(r).test(n.textContent)); if (!p) return null; p.scrollIntoView({ block: 'center' }); const q = p.getBoundingClientRect(); return { x: q.left + 60, y: q.top + 14 }; }, re); if (b) await page.mouse.click(b.x, b.y); return !!b; };
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
    await page.click('[data-pd2-am-create]').catch(() => {});
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
      const today = await until(page, () => !!document.querySelector('#ig-canvas .pd-am-today'));
      check('7a the signed paper shows a changed clause as it stands today', today);
      await page.click('.pd2-amx [data-pd2-amx-tab="paper"]').catch(() => {});
      const p7 = await page.evaluate(() => (document.querySelector('.pd2-amx-sheet') || {}).innerText || '');
      check('7b the second amendment says it amends the agreement as amended', /as amended by Amendment No\. 1/.test(p7), p7.replace(/\s+/g, ' ').slice(0, 160));
    }

    check('no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) { check('the run completed', false, e.message); }
  finally { await browser.close(); await h.stop(); }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
