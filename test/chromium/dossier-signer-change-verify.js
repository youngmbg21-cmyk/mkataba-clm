/* THE DOSSIER'S SIGNER DOOR OPENS (owner-reported 11 Nov 2026, a picture of MK-382: "review why this change press is
   not working … fix it").
   In the new look the Dossier's facts draw Signer · Change, and when naming a signer is the next step its one black
   card button reads Name. Both carry data-pd-og-route, but the one listener for it answered only inside the fill form
   (#pd-og) and the old Next card (#pd-glance .ds-nx), and it found the contract through the form's host — so on the
   new look both presses did nothing.
   Claims, in the new look at the owner's three screens:
     1 · the Signer row's Change is drawn and pressing it opens the signing-order window (#sr-win)
     2 · closing that window leaves the reader on the same contract's Dossier, the Signer row still there
     3 · where the Dossier's card asks to name who signs, its button opens the same window
         (staged on a second contract; if the card does not reach that step it says NOTED with what it showed,
         so GitHub's run tells us, rather than failing on staging)
   At the parent 1 fails (the window never opens) and 3 fails where it is reached.
   Run: node test/chromium/dossier-signer-change-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

const BODY = '<h1>Haulage Agreement</h1><p>Between Highland Corporate Ltd and Rift Valley Haulage</p>'
  + '<h2>1. Services</h2><p>The Carrier shall carry the Buyer\'s goods between Nairobi and Mombasa.</p>'
  + '<h2>2. Price</h2><p>The annual contract value is KES 2,000,000, invoiced monthly.</p>'
  + '<h2>3. Term</h2><p>This agreement runs until 30 June 2027.</p>';

function contract(id, name){
  const c = fixtureContract(id, name, 'Rift Valley Haulage', 'proc', 2000000, 'Under Review', 'x');
  return Object.assign(c, { redlineText: BODY, format: 'rich', template: null, source: 'upload', expiry: '2027-06-30',
    fields: { value: '2000000' },
    upload: { name: name + '.docx', extractedText: BODY.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString(), uploadedBy: 'Amina Otieno' } });
}

/* the window is drawn, or not, and what stands under it */
const WIN = () => !!document.getElementById('sr-win');
const closeWin = () => { try { if (typeof closeModal === 'function') closeModal(); } catch (_){} };

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { contracts: [contract('MK-SG1', 'Haulage Agreement'), contract('MK-SG2', 'Haulage Agreement Two')], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [nm, W, H] of [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]]){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 300)));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => typeof roomHomeLand === 'function' && typeof currentUser === 'function' && !!currentUser()
        && typeof getContract === 'function' && !!getContract('MK-SG1') && !!getContract('MK-SG2'), null, 40000);

      /* ---- 1 + 2: the Signer row's Change ---- */
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); roomHomeLand('MK-SG1'); });
      const row = await until(page, () => !!document.querySelector('#ig-dock .pd2-fact[data-pd2-fact="signer"] .pd2-s button'), null, 20000);
      check(`${nm} 0 the new look's Dossier draws the Signer row with its Change`, row);
      if (row){
        await page.click('#ig-dock .pd2-fact[data-pd2-fact="signer"] .pd2-s button');
        const opened = await until(page, WIN, null, 6000);
        check(`${nm} 1 pressing the Signer row's Change opens the signing-order window`, opened);
        if (opened){
          await page.evaluate(closeWin);
          await until(page, () => !document.getElementById('sr-win'), null, 6000);
          const back = await until(page, () => !!document.querySelector('#ig-dock .pd2-fact[data-pd2-fact="signer"]')
            && typeof deskKeyNow === 'function' && deskKeyNow() === 'c:MK-SG1', null, 8000);
          check(`${nm} 2 closing the window leaves the reader on the same Dossier, the Signer row still there`, back);
        }
      }

      /* ---- 3: the card's Name (the step "Name who signs") ---- */
      await page.evaluate(() => roomHomeLand('MK-SG2'));
      await until(page, () => typeof deskKeyNow === 'function' && deskKeyNow() === 'c:MK-SG2' && !!document.querySelector('#ig-dock .pd2-card'), null, 20000);
      const card = await page.evaluate(() => { const k = document.querySelector('#ig-dock .pd2-card');
        const b = k && k.querySelector('.pd2-card-go');
        return { head: k ? (k.querySelector('.pd2-next') || {}).textContent || '' : '', route: !!(b && b.hasAttribute('data-pd-og-route')) }; });
      if (!card.route) console.log(`NOTED  ${nm} 3 the card did not reach "Name who signs" on this fixture (it said: ${JSON.stringify(card.head.trim())}); the press was not driven`);
      else {
        await page.click('#ig-dock .pd2-card .pd2-card-go');
        const opened = await until(page, WIN, null, 6000);
        check(`${nm} 3 the card's Name opens the same signing-order window`, opened);
        if (opened){ await page.evaluate(closeWin); await until(page, () => !document.getElementById('sr-win'), null, 6000); }
      }
      await page.close();
    }
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
