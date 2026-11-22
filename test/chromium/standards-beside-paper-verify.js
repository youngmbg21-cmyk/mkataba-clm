/* THE NEW LOOK: OUR STANDARDS BESIDE THE PAPER (owner picked "Beside the paper", 6 Nov 2026). The old side panel
   ("Playbook review") is not opened in the new look; what the check found stands in the margin beside the paper.
     1 · A standard the paper differs from stands in its clause's group, by the words it differs in, amber, with Start redlining
     2 · The missing ones gather in one red group at the paper's end, "Not in the contract", with Add our clauses
     3 · The Dossier's Playbook line is the score ring with no Open (the notes need no press); no side panel opens
     4 · Add our clauses is the one door that drafts our standards (it asks first)
     5 · No check kept: the Dossier's Check runs it (Jambo's call stood in for) and the notes appear
     6 · The new look off: the old side panel, as before
   At the parent 1–5 fail: no standards beside the paper; the side panel opens.
   Run: node test/chromium/standards-beside-paper-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const W = require('../round7-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati();
  await W.seedRound7(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-CR'), null, 40000);
  await page.evaluate(async () => {
    const c = getContract('MK-CR'); if (window.ensureFull) await ensureFull(c);
    /* the payment standard differs in § 2's own words */
    const v = c.playbook.verdicts.find(x => x.category === 'Payment'); v.quote = 'invoices fall due within 30 days of receipt';
    await stPrefSet('newLook', true); newLookApply();
    roomHomeLand('MK-CR');
  });
  await until(page, () => window.pdContract && pdContract() && pdContract().id === 'MK-CR' && pdOnPaper() && !!document.querySelector('#pd2-notes'), null, 15000);
  await page.waitForTimeout(600);
  const R = () => page.evaluate(() => {
    const gs = [...document.querySelectorAll('#pd2-notes .pd2-mg')];
    return { groups: gs.map(g => ({ h: (g.querySelector('.pd2-mg-h') || {}).textContent || '', cls: g.className, std: [...g.querySelectorAll('.pd2-mg-i.is-std')].map(i => i.textContent.replace(/\s+/g, ' ').trim().slice(0, 120)) })),
      side: !!document.querySelector('#side-panel #playbook-section') };
  });
  const r1 = await R();
  const pay = r1.groups.find(g => g.std.some(t => /Differs from your position · Payment/.test(t)));
  check('1 · Payment stands in § 2\'s group, amber, with Start redlining', !!pay && /Price/i.test(pay.h) && pay.std.some(t => /Start redlining/.test(t)), r1);
  const miss = r1.groups.find(g => /Not in the contract/.test(g.h));
  const last = r1.groups[r1.groups.length - 1];
  check('2 · the missing ones in one red group at the end, with Add our clauses', !!miss && /is-miss/.test(miss.cls) && miss === r1.groups.find(g => g === last) && /Insurance · Liability cap/.test(miss.std.join()) && /Add our clauses/.test(miss.std.join()), r1);

  /* 3 the Dossier's Playbook line is the score ring and carries NO Open (owner, 19 Nov 2026: "simply delete the open
     option. the notes will be there anyway"): the notes stand beside the paper without a press; no side panel */
  const ring = await until(page, () => !!document.querySelector('#ig-dock .pd2-fact.is-ring'), null, 8000);
  const r3 = await page.evaluate(() => ({ open: !!document.querySelector('#ig-dock .pd2-fact.is-ring [data-pd-ds-std]'),
    notes: !!document.querySelector('#pd2-notes .pd2-mg-i.is-std'), side: !!document.querySelector('#side-panel #playbook-section') }));
  check('3 · the Playbook line is the ring with no Open; the notes stand beside the paper; no side panel', ring && !r3.open && r3.notes && !r3.side, r3);

  /* 4 Add our clauses: the one door (Draft from our standards), which asks first */
  const add = await page.evaluate(() => { const b = [...document.querySelectorAll('#pd2-notes [data-pd2-go="std-draft"]')].find(x => /Add our clauses/.test(x.textContent)); if (b){ b.setAttribute('data-pp', '1'); return true; } return false; });
  if (add) await page.click('[data-pp="1"]');
  const asked = await until(page, () => /Draft from our playbook/.test((document.getElementById('confirm-overlay') || {}).innerText || ''), null, 6000);
  check('4 · Add our clauses opens Draft from our standards, which asks first', add && asked);
  await page.evaluate(() => { const o = document.getElementById('confirm-overlay'); const b = o && [...o.querySelectorAll('button')].find(x => /Cancel/.test(x.textContent)); if (b) b.click(); });
  await page.waitForTimeout(300);

  /* 5 no check kept: Check runs it */
  await page.evaluate(() => { const c = getContract('MK-CR'); const kept = c.playbook; delete c.playbook;
    window.runPlaybookReview = async () => kept; pdGlanceRepaint(); pd2NotesPaint(c); });
  await page.waitForTimeout(400);
  const none = await page.evaluate(() => !document.querySelector('#pd2-notes .pd2-mg-i.is-std'));
  const chk = await page.evaluate(() => { const b = document.querySelector('#ig-dock [data-pd-ds-std]'); if (b){ b.click(); return true; } return false; });
  /* the standards page's own Check again asks first where it costs a call: answered yes */
  const asked5 = await until(page, () => !!document.getElementById('confirm-overlay'), null, 4000);
  if (asked5) await page.evaluate(() => { const o = document.getElementById('confirm-overlay'); const b = o && [...o.querySelectorAll('button')].find(x => !/Cancel/.test(x.textContent)); if (b) b.click(); });
  const back = await until(page, () => !!document.querySelector('#pd2-notes .pd2-mg-i.is-std') && !!getContract('MK-CR').playbook, null, 8000);
  const r5 = await R();
  check('5 · no check kept: Check runs it and the notes appear (no side panel)', none && chk && back && !r5.side, { none, chk, asked5, back, side: r5.side });

  /* RETIRED 16 Nov 2026 (#762): 6 "the new look off: the old side panel, as before" — there is no switch; the new look is the only look */

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
