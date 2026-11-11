/* FILL IN ON THE PAPER, THE LEGORA WAY (owner picked "The Legora Way" by name, 11 Nov 2026: "Build fill in on the
   paper the Legora way"; and "Open the paper", "Yes, print them", "Back to the Dossier").
   A draft from our own template (two blanks in its opening, nobody named to sign), in the new look:
     0 · the Dossier's card offers "Fill in the contract"
     1 · pressing it fills ON THE PAPER, not in a form: the template's own blanks become lines where they stand, each
         signature line takes a name, the head says "Filling in on the paper · 1 of 4", the panel says "On the paper"
         with every space in the paper's order and where it stands (§ and the words around it)
     2 · Enter takes you to the next space still to fill, and the panel lights it
     3 · a signature line offers your team as you type; Enter takes the lit one and moves to their line
     4 · their signer typed by hand asks for the email the link goes to
     5 · Enter on the last space saves (the blanks through their writer, the signers through the route's one writer),
         goes back to the Dossier, and the server holds it all
     6 · the signing copy prints the names under the lines
     7 · Stop with something typed asks again in its own words; a second press leaves and nothing is saved
     8 · at the owner's three screens: the first space in view, nothing sideways
   At the parent (before this change) 1–7 fail: the button opens the white form and a template's blanks are never
   turned into lines.
   Run: node test/chromium/fill-on-the-paper-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'fill-on-the-paper');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 12000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const focusOf = () => { const a = document.activeElement; return a ? (a.getAttribute('data-pd2-bl') ? 'b:' + a.getAttribute('data-pd2-bl') : a.getAttribute('data-pd2-ps-name') ? 'n:' + a.getAttribute('data-pd2-ps-name') : a.getAttribute('data-pd2-ps-mail') ? 'm:' + a.getAttribute('data-pd2-ps-mail') : a.tagName) : ''; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const draft = (id) => Object.assign(fixtureContract(id, 'Cold Chain Haulage', 'Juno Logistics', 'proc', 2000000, 'Draft'), { template: 'RM', fields: { value: '2000000' } });
  await seedWorkspace(h, { contracts: [draft('MK-FP1'), draft('MK-FP2'), draft('MK-FP3'), draft('MK-FP4')], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const screens = [['laptop-a', 1440, 780, 'MK-FP1'], ['laptop-b', 1536, 730, 'MK-FP2'], ['ipad', 1366, 950, 'MK-FP3']];
    for (const [nm, W, H, id] of screens){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 300)));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, id => typeof roomHomeLand === 'function' && typeof currentUser === 'function' && !!currentUser() && typeof getContract === 'function' && !!getContract(id), id, 40000);
      await page.evaluate(async id => { await stPrefSet('newLook', true); newLookApply(); roomHomeLand(id); }, id);
      const card = await until(page, id => typeof deskKeyNow === 'function' && deskKeyNow() === 'c:' + id && !!document.querySelector('#ig-dock .pd2-card .pd2-card-go[data-pd-ds-fill]') && !!document.querySelector('#ig-canvas span.field-frozen[data-field]'), id, 20000);
      check(`${nm} 0 the Dossier's card offers Fill in the contract`, card);
      if (!card){ await page.close(); continue; }
      await page.click('#ig-dock .pd2-card .pd2-card-go');
      const on = await until(page, () => !!document.getElementById('pd2-fill-head') && document.querySelectorAll('#ig-canvas [data-pd2-bl]').length >= 2, null, 8000);
      const S = await page.evaluate(() => ({
        form: !!document.querySelector('#pd-og.is-form, [data-pd-mid^="form:"]'),
        head: (document.querySelector('[data-pd2-fh-m]') || {}).textContent || '',
        blanks: [...document.querySelectorAll('#ig-canvas [data-pd2-bl]')].map(b => b.getAttribute('data-pd2-bl')),
        names: document.querySelectorAll('#ig-canvas [data-pd2-ps-name]').length,
        title: ((document.querySelector('#ig-dock .pd2-fp-head b') || {}).textContent || ''),
        rows: [...document.querySelectorAll('#ig-dock [data-pd2-fp-go]')].map(r => r.getAttribute('data-pd2-fp-go')),
        quote: ((document.querySelector('#ig-dock [data-pd2-fp-go="b:effDate"] .pd2-fp-q') || {}).textContent || ''),
        first: (() => { const a = document.activeElement, r = a && a.getBoundingClientRect(); return { f: a && a.getAttribute('data-pd2-bl'), inView: !!r && r.top >= 0 && r.bottom <= innerHeight }; })(),
        sideways: document.documentElement.scrollWidth - innerWidth }));
      check(`${nm} 1 the black button fills on the paper: the template's blanks and both signature lines, "1 of 4", the panel "On the paper" with where each stands`,
        on && !S.form && /1 of 4/.test(S.head) && S.blanks.includes('effDate') && S.blanks.includes('material') && S.names === 2
        && /On the paper/.test(S.title) && S.rows.join() === 'b:effDate,b:material,s:0,s:1' && /^§ .+“.*____.*”$/.test(S.quote.trim()), S);
      check(`${nm} 8 the first space in view, nothing sideways`, S.first.f === 'effDate' && S.first.inView && S.sideways <= 0, S.first);
      await page.screenshot({ path: path.join(OUT, `start-${nm}.png`) });
      if (nm !== 'laptop-a'){ await page.close(); continue; }

      /* 2 Enter walks to the next space and the panel lights it */
      await page.keyboard.type('12012026');
      await page.keyboard.press('Enter');
      const f2 = await until(page, () => document.activeElement && document.activeElement.getAttribute('data-pd2-bl') === 'material' && !!document.querySelector('#ig-dock [data-pd2-fp-go="b:material"].is-cur'), null, 5000);
      check('2 Enter takes you to the next space, and the panel lights it', f2, await page.evaluate(focusOf));
      await page.keyboard.type('pasteurised milk');
      await page.keyboard.press('Enter');
      /* 3 our signature line: the team offered as you type, Enter takes the lit one */
      const f3a = await until(page, () => document.activeElement && document.activeElement.getAttribute('data-pd2-ps-name') === '0:0', null, 5000);
      const me = await page.evaluate(() => currentUser().name);
      await page.keyboard.type(me.slice(0, 3));
      const dd = await until(page, () => { const d = document.querySelector('#ig-canvas [data-pd2-ps-dd="0:0"]'); return d && !d.hidden && /your team/.test(d.textContent); }, null, 4000);
      await page.keyboard.press('Enter');
      const f3 = await until(page, () => document.activeElement && document.activeElement.getAttribute('data-pd2-ps-name') === '1:0', null, 5000);
      check('3 our signature line offers the team as you type; Enter takes it and moves to their line', f3a && dd && f3, await page.evaluate(focusOf));
      /* 4 their signer by hand asks for the email */
      /* a name nobody knows lights "Someone new"; Enter takes it */
      await page.keyboard.type('Wanjiru Otieno');
      await until(page, () => { const d = document.querySelector('#ig-canvas [data-pd2-ps-dd="1:0"]'); return d && !d.hidden && !!d.querySelector('[data-pd2-ps-new].is-on'); }, null, 4000);
      await page.keyboard.press('Enter');
      const f4 = await until(page, () => document.activeElement && document.activeElement.getAttribute('data-pd2-ps-mail') === '1:0', null, 5000);
      check('4 their signer typed by hand asks for the email the link goes to', f4, await page.evaluate(focusOf));
      await page.keyboard.type('wanjiru@junologistics.co.ke');
      await page.screenshot({ path: path.join(OUT, 'signers-laptop-a.png') });
      /* 5 the last Enter saves and goes back to the Dossier; the server holds it */
      await page.keyboard.press('Enter');
      const back = await until(page, id => !document.getElementById('pd2-fill-head') && !!document.querySelector('#ig-dock .pd2-card'), id, 8000);
      const srv = await page.evaluate(async id => { for (let i = 0; i < 40; i++){ const r = await fetch('/api/contracts/' + id, { credentials: 'include' }); const j = await r.json(); const c = j.contract || j;
        const f = c.fields || {}, plan = (c.signerPlan || []).map(s => [s.party, s.name, s.email]);
        if (f.effDate && f.material && plan.length === 2) return { effDate: f.effDate, material: f.material, plan }; await new Promise(z => setTimeout(z, 250)); } return null; }, id);
      check('5 the last Enter saves the blanks and the signers and goes back to the Dossier; the server holds them', back && srv && srv.effDate === '2026-12-01' && srv.material === 'pasteurised milk'
        && srv.plan.some(p => p[0] === 'internal' && p[1] === me) && srv.plan.some(p => p[0] === 'counterparty' && p[1] === 'Wanjiru Otieno' && p[2] === 'wanjiru@junologistics.co.ke'), srv);
      /* 6 the signing copy prints the names */
      await page.evaluate(id => pdSignOpen(id), id);
      const printed = await until(page, () => document.querySelectorAll('#ig-canvas .rl-sigplan').length === 2, null, 8000);
      const P = await page.evaluate(() => [...document.querySelectorAll('#ig-canvas .rl-sigplan')].map(x => x.textContent.trim()));
      check('6 the signing copy prints the signers under the lines', printed && P.some(t => t.includes('Wanjiru Otieno')), P);
      await page.close();
    }

    /* 7 STOP asks again, then leaves with nothing saved (a fourth draft) */
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => typeof roomHomeLand === 'function' && typeof getContract === 'function' && !!getContract('MK-FP4'), null, 40000);
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); roomHomeLand('MK-FP4'); });
      const card = await until(page, () => deskKeyNow() === 'c:MK-FP4' && !!document.querySelector('#ig-dock .pd2-card .pd2-card-go[data-pd-ds-fill]'), null, 20000);
      if (card){
        await page.click('#ig-dock .pd2-card .pd2-card-go');
        const on = await until(page, () => !!document.querySelector('#ig-canvas [data-pd2-bl="material"]'), null, 8000);
        if (on){
          await page.click('#ig-canvas [data-pd2-bl="material"]'); await page.keyboard.type('chilled cream');
          await page.click('[data-pd2-fill-discard]');
          const asked = await page.evaluate(() => ({ head: !!document.getElementById('pd2-fill-head'), word: (document.querySelector('[data-pd2-fill-discard]') || {}).textContent || '' }));
          await page.click('[data-pd2-fill-discard]');
          const gone = await until(page, () => !document.getElementById('pd2-fill-head'), null, 5000);
          const kept = await page.evaluate(() => (getContract('MK-FP4').fields || {}).material || '');
          check('7 Stop with something typed asks again in its own words; a second press leaves and nothing is saved', asked.head && /without saving/i.test(asked.word) && gone && !kept, { asked, kept });
        } else check('7 Stop asks again (the filling never opened)', false);
      } else check('7 Stop asks again (the card never came)', false);
      await page.close();
    }
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
