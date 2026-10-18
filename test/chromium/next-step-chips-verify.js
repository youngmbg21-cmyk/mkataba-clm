/* THE CHIPS GO TO THE NEXT STEP, AND NO BUTTON TAKES YOU NOWHERE (owner,
   15 Oct 2026: "whenever this page is open, there is no point of having the
   redline button ... it should transition to ... the next natural step";
   "a button that will not take you anywhere is a waste — simply give a
   reason"; "you do not have an option to choose between that and an uploaded
   paper").

   1 with Jambo's Redlines face open there is no "redline" chip; an empty
     list shows its own Edit a clause, so no chip repeats it; with a change on
     the table "edit a clause" is offered, and its press opens the editor
   2 "what's next?" answers with the chips' own steps on a card
   3 a signed agreement: no "sign" chip; obligations, amend, history (and share, the fourth since round 3 as drawn)
   4 the same agreement EXPIRED: no "sign" and no "amend" chip; asking for an
     amendment says why, with no button; the Menu's amend row is grey with
     the same reason
   5 an answer about the contract already open says so, with no
     "Open … in Workspace" button
   6 "draft" asks our paper or theirs: Use our template · Upload their paper
   Photographed at the owner's three screens.
   RED AT THE PARENT: caNextSteps does not exist there, the redline chip is
   drawn on the Redlines face, "sign" on a signed agreement, the door is
   offered for the contract already open, and the draft card has one button.
     node test/chromium/next-step-chips-verify.js */
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'next-step-chips');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const until = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const page = await (await browser.newContext({ viewport: { width: 1536, height: 730 } })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B1') && state.contracts.some(c => c.id === 'MK-B2'), null, 15000);
    const have = await page.evaluate(() => ['caNextSteps', 'caNextRun', 'amendmentShutWhy'].filter(n => typeof window[n] !== 'function'));
    ok('0 the parts exist', have.length === 0, have.length ? 'missing ' + have.join(', ') : null);
    if (have.length) throw new Error('nothing to drive');
    const chips = () => page.evaluate(() => [...document.querySelectorAll('#ig-dock [data-ig-chips] [data-ca-chip]')].map(b => b.getAttribute('data-ca-chip')));
    const ask = async q => { await page.fill('#igd-input', q); await page.click('#igd-go'); await page.waitForTimeout(500); };
    const lastCard = () => page.evaluate(() => { const cs = document.querySelectorAll('#igd-feed .ca-card'); const k = cs[cs.length - 1];
      return k ? { title: (k.querySelector('.ca-ct') || {}).textContent || '', why: (k.querySelector('.ca-why') || {}).textContent || '',
        btns: [...k.querySelectorAll('button')].map(b => b.textContent.trim() + (b.disabled ? ' (grey)' : '')) } : null; });
    const shoot = async name => { for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(OUT, `${name}-${w}x${hh}.png`) }); } await page.setViewportSize({ width: 1536, height: 730 }); await page.waitForTimeout(300); };

    /* 1 the Redlines face */
    await page.evaluate(() => { setView('dashboard'); pdRedOpen('MK-B2'); });
    await until(page, () => !!document.querySelector('#pd-redface') && !!document.querySelector('#ig-dock [data-ig-chips] [data-ca-chip]'), null, 10000);
    const c0 = await chips();
    ok('1a with Redlines open there is no "redline" chip', c0.length > 0 && !c0.includes('redline'), JSON.stringify(c0));
    const own = await page.evaluate(() => !!document.querySelector('#pd-redface [data-rl-edit-first]'));
    ok('1b an empty list shows its own Edit a clause, so no chip repeats it', own && !c0.includes('edit'), JSON.stringify({ own, c0 }));
    /* one change of ours on the table: the list's own button goes, the chip comes */
    const filed = await page.evaluate(async () => { const c = getContract('MK-B2'); const cl = negoClauseList(c).find(x => x && x.clauseId && (x.text || '').length > 40);
      let r = null; try { r = await negoEditClause(c, cl.clauseId, (cl.bodyHtml || ('<p>' + cl.text + '</p>')) + '<p>Volumes are reviewed each quarter.</p>', { side: 'owner', author: 'Amina Otieno', why: 'volume' }); } catch (e){ r = 'threw ' + e.message; }
      pdRedRepaint(); return r && (r.id || String(r)); });
    ok('1b2 a change of ours is filed (the setup)', /^CHG-/.test(String(filed)), String(filed));
    await until(page, () => !document.querySelector('#pd-redface [data-rl-edit-first]') && !!document.querySelector('#ig-dock [data-ig-chips] [data-ca-chip]'), null, 8000);
    await page.waitForTimeout(400);
    const c1 = await chips();
    ok('1c with a change on the table "edit a clause" is the next step', c1.includes('edit') && !c1.includes('redline'), JSON.stringify(c1));
    await shoot('1-redlines');
    if (c1.includes('edit')){
      await page.click('#ig-dock [data-ca-next="edit"]');
      ok('1d its press opens the clause editor', await until(page, () => !!document.querySelector('#clause-editor'), null, 6000));
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      await page.evaluate(() => { const b = document.querySelector('#clause-editor [data-ce-act="close"], #clause-editor .ce-close'); if (b) b.click(); });
      await until(page, () => !document.querySelector('#clause-editor'), null, 4000);
      await page.evaluate(() => { const b = [...document.querySelectorAll('.dlg-f button, .modal button')].find(x => /leave|discard|close/i.test(x.textContent)); if (b) b.click(); });
    }

    /* 2 what's next */
    await page.evaluate(() => { ['pdRedClose', 'pdSignClose', 'pdFillClose', 'pdAmendClose'].forEach(f => { try { window[f] && window[f](); } catch (_){} }); setView('dashboard'); igAnalyze('MK-B2'); });
    await until(page, () => window.intel && intel.paper && intel.paper.id === 'MK-B2' && !!document.querySelector('#igd-input'), null, 10000);
    await page.waitForTimeout(400);
    const c2 = await chips();
    await ask("what's next");
    const k2 = await lastCard();
    const steps = await page.evaluate(() => caNextSteps(getContract('MK-B2')).map(k => caNextLabel(k)));
    ok('2 "what\'s next?" answers with the chips\' own steps', !!k2 && /MK-B2/.test(k2.title) && JSON.stringify(k2.btns) === JSON.stringify(steps) && c2.length === steps.length, JSON.stringify({ k2, steps, c2 }));

    /* 3 signed */
    await page.evaluate(() => igAnalyze('MK-B1'));
    await until(page, () => window.intel && intel.paper && intel.paper.id === 'MK-B1' && !!document.querySelector('#ig-dock [data-ig-chips] [data-ca-chip]'), null, 10000);
    await page.waitForTimeout(400);
    const c3 = await chips();
    /* RE-POINTED 18 Oct 2026 (round 3 as drawn: four chips, "answer the redlines · name a signer · share · history"): a signed one's fourth is share */
    ok('3 a signed agreement: no "sign" chip; obligations · amend · history · share', JSON.stringify(c3) === JSON.stringify(['oblig', 'amend', 'history', 'share']), JSON.stringify(c3));

    /* 4 expired (in this browser only: the end date moved into the past) */
    await page.evaluate(() => { const c = getContract('MK-B1'); c.expiry = '2020-01-31'; c.metadata = Object.assign({}, c.metadata, { expiryDate: '2020-01-31' }); renderIntelDock(); });
    await page.waitForTimeout(400);
    const c4 = await chips();
    ok('4a expired: no "sign" and no "amend" chip', c4.length > 0 && !c4.includes('sign') && !c4.includes('amend'), JSON.stringify(c4));
    await ask('amendment');
    const k4 = await lastCard();
    ok('4b asking for an amendment says why, with no button', !!k4 && /expired/i.test(k4.why) && k4.btns.length === 0, JSON.stringify(k4));
    await shoot('4-expired-amend');
    await page.click('#ig-dock [data-pd-tab="menu"]');
    await until(page, () => !!(document.querySelector('#pd-body .pd-menu') || {}).dataset?.wired, null, 8000);
    const row = await page.evaluate(() => { const b = document.querySelector('#pd-body .pd-mn-rows #ws-m-amend'); return b ? { grey: b.disabled, why: b.title } : null; });
    ok('4c the Menu\'s amend row is grey with the same reason', !!row && row.grey && /expired/i.test(row.why), JSON.stringify(row));
    await page.click('#ig-dock [data-pd-tab="copilot"]');
    await until(page, () => !!document.querySelector('#igd-input'), null, 5000);

    /* 5 an answer about the contract already open */
    const doors = await page.evaluate(() => {
      intel.history.push({ role: 'assistant', text: 'MK-B1 has no amendment on file.', cardIds: ['MK-B1'] }, { role: 'assistant', text: 'MK-B2 is the coast supply.', cardIds: ['MK-B2'] });
      renderIntelDock();
      const ms = document.querySelectorAll('#igd-feed .igd-doors, #igd-feed .igd-here');
      return [...ms].slice(-2).map(x => x.className + ':' + x.textContent.trim());
    });
    ok('5 the contract already open is said, not offered; another contract keeps its door',
      doors.length === 2 && /igd-here/.test(doors[0]) && /MK-B1/.test(doors[0]) && /igd-doors/.test(doors[1]) && /MK-B2/.test(doors[1]), JSON.stringify(doors));
    await shoot('5-already-open');

    /* 6 draft: our paper or theirs */
    await ask('draft');
    const k6 = await lastCard();
    ok('6 "draft" asks our paper or theirs: two buttons', !!k6 && k6.btns.length === 2 && /template/i.test(k6.btns[0]) && /upload/i.test(k6.btns[1]), JSON.stringify(k6));
    await shoot('6-draft');

    ok('9 no page errors', errs.length === 0, errs.slice(0, 2).join(' | ') || null);
  } catch (e){ fail++; console.log('FAIL  the run completed — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
