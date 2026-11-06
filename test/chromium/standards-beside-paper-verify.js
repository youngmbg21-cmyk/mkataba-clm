/* THE NEW LOOK: OUR STANDARDS BESIDE THE PAPER (owner picked "Beside the paper", 6 Nov 2026). The old side panel
   ("Playbook review") is not opened in the new look; what the check found stands in the margin beside the paper.
     1 · A standard the paper differs from stands in its clause's group, by the words it differs in, amber, with Start redlining
     2 · The missing ones gather in one red group at the paper's end, "Not in the contract", with Add our clauses
     3 · The Dossier's Standards line lands on them; no side panel opens
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
  const pay = r1.groups.find(g => g.std.some(t => /Differs from your standard · Payment/.test(t)));
  check('1 · Payment stands in § 2\'s group, amber, with Start redlining', !!pay && /Price/i.test(pay.h) && pay.std.some(t => /Start redlining/.test(t)), r1);
  const miss = r1.groups.find(g => /Not in the contract/.test(g.h));
  const last = r1.groups[r1.groups.length - 1];
  check('2 · the missing ones in one red group at the end, with Add our clauses', !!miss && /is-miss/.test(miss.cls) && miss === r1.groups.find(g => g === last) && /Insurance · Liability cap/.test(miss.std.join()) && /Add our clauses/.test(miss.std.join()), r1);

  /* 3 the Dossier's Standards line */
  await page.evaluate(() => { const sc = document.getElementById('ig-paper-scroll'); if (sc) sc.scrollTop = 0; });
  const ds = await until(page, () => !!document.querySelector('#ig-dock [data-pd-ds-std]'), null, 8000);
  if (ds) await page.click('#ig-dock [data-pd-ds-std]');
  await page.waitForTimeout(900);
  const r3 = await page.evaluate(() => { const g = document.querySelector('#pd2-notes .pd2-mg-i.is-std'), sc = document.getElementById('ig-paper-scroll');
    const gr = g && g.getBoundingClientRect(), sr = sc && sc.getBoundingClientRect();
    return { side: !!document.querySelector('#side-panel #playbook-section'), inView: !!(gr && sr && gr.top >= sr.top && gr.bottom <= sr.bottom + 1), top: sc ? sc.scrollTop : null }; });
  check('3 · the Dossier\'s Standards line lands on them; no side panel', ds && !r3.side && r3.inView, r3);

  /* 4 Add our clauses: the one door (Draft from our standards), which asks first */
  const add = await page.evaluate(() => { const b = [...document.querySelectorAll('#pd2-notes [data-pd2-go="std-draft"]')].find(x => /Add our clauses/.test(x.textContent)); if (b){ b.setAttribute('data-pp', '1'); return true; } return false; });
  if (add) await page.click('[data-pp="1"]');
  const asked = await until(page, () => /Draft from our standards/.test((document.getElementById('confirm-overlay') || {}).innerText || ''), null, 6000);
  check('4 · Add our clauses opens Draft from our standards, which asks first', add && asked);
  await page.evaluate(() => { const o = document.getElementById('confirm-overlay'); const b = o && [...o.querySelectorAll('button')].find(x => /Cancel/.test(x.textContent)); if (b) b.click(); });
  await page.waitForTimeout(300);

  /* 5 no check kept: Check runs it */
  await page.evaluate(() => { const c = getContract('MK-CR'); const kept = c.playbook; delete c.playbook;
    window.runPlaybookReview = async () => kept; pdGlanceRepaint(); pd2NotesPaint(c); });
  await page.waitForTimeout(400);
  const none = await page.evaluate(() => !document.querySelector('#pd2-notes .pd2-mg-i.is-std'));
  const chk = await page.evaluate(() => { const b = document.querySelector('#ig-dock [data-pd-ds-std]'); if (b){ b.click(); return true; } return false; });
  const back = await until(page, () => !!document.querySelector('#pd2-notes .pd2-mg-i.is-std') && !!getContract('MK-CR').playbook, null, 8000);
  const r5 = await R();
  check('5 · no check kept: Check runs it and the notes appear (no side panel)', none && chk && back && !r5.side, { none, chk, back, side: r5.side });

  /* 6 the new look off */
  await page.evaluate(async () => { await stPrefSet('newLook', false); newLookApply(); openCheckPanel(getContract('MK-CR'), 'playbook'); });
  const old = await until(page, () => !!document.querySelector('#side-panel #playbook-section'), null, 8000);
  check('6 · the new look off: the old side panel, as before', old);

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
