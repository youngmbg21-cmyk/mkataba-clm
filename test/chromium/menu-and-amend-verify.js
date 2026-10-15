/* THE MENU TAB, JAMBO'S WORDS FOR IT, THE CONTRACT NUMBER, THE HIGHLIGHT'S
   NOTE AND AMEND BESIDE THE PAPER (owner, 15 Oct 2026: "go with beside paper
   and build the rest as well", the Seven Fixes artifact).

   1 the panel's Menu tab ("Next up") holds the paper's old ⋯ rows; the ⋯ is
     gone from the paper's line
   2 asking Jambo for a Menu act answers with the row itself as the button
     ("export" → PDF · Word), nothing spent; a press opens the Menu tab and
     presses the row
   3 a contract number in any form ("mk B1", "mkB1") opens that contract on
     Home; a number in an answer is a link that opens it
   4 a highlight's Comment keeps its words on the saved note, on a contract
     not negotiated yet too
   5 Amend, beside the paper: only on a signed agreement; a press on a clause
     adds a numbered change marked on the paper; Create amendment draft makes
     the linked draft and the signed agreement is untouched
   RED AT THE PARENT: none of these names exist there, and (4) saved the note
   without its words. */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'menu-and-amend');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
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
    const have = await page.evaluate(() => ['pdMenuHtml', 'caReadMenu', 'caRefFix', 'caRefLinkPaint', 'pdAmendOpen', 'hbOpenRef'].filter(n => typeof window[n] !== 'function'));
    ok('0 the parts exist', have.length === 0, have.length ? 'missing ' + have.join(', ') : null);
    if (have.length) throw new Error('nothing to drive');
    const ask = async q => { await page.fill('#igd-input', q); await page.click('#igd-go'); await page.waitForTimeout(500); };
    const lastCard = () => page.evaluate(() => { const cs = document.querySelectorAll('#igd-feed [data-ca-menu]'); const k = cs[cs.length - 1];
      return k ? { menu: k.dataset.caMenu, btns: [...k.querySelectorAll('button')].map(b => b.textContent.trim() + (b.disabled ? ' (grey)' : '')) } : null; });

    /* 1 the Menu tab */
    await page.evaluate(() => { setView('dashboard'); igAnalyze('MK-B2'); });
    await until(page, () => !!document.querySelector('#ig-dock [data-pd-tab="menu"]'), null, 10000);
    ok('1a no ⋯ on the paper\'s line', await page.evaluate(() => !document.querySelector('#ig-strip #ws-more')));
    await page.click('#ig-dock [data-pd-tab="menu"]');
    await until(page, () => !!(document.querySelector('#pd-body .pd-menu') || {}).dataset?.wired, null, 8000);
    const menu = await page.evaluate(() => ({ cards: document.querySelectorAll('#pd-body .pd-mn-card').length,
      groups: [...document.querySelectorAll('#pd-body .pd-mn-g summary')].map(x => x.textContent.trim()),
      rows: ['#ws-pdf', '#ws-word', '#ws-filing', '#ws-import'].filter(s => document.querySelector('#pd-body .pd-mn-rows ' + s)) }));
    ok('1b the Menu tab: suggestions first, then the ⋯ rows in their groups', menu.cards >= 1 && menu.cards <= 3 && menu.groups.length >= 3 && menu.rows.length === 4, JSON.stringify(menu));
    await page.screenshot({ path: path.join(OUT, '1-menu.png') });

    /* 2 Jambo's words for a Menu act */
    await page.click('#ig-dock [data-pd-tab="copilot"]');
    await until(page, () => !!document.querySelector('#igd-input'), null, 5000);
    const spentBefore = await page.evaluate(() => (window.intel && intel.history || []).filter(m => m.role === 'assistant' && !m.act).length);
    await ask('export');
    const ex = await lastCard();
    ok('2a "export" answers with the rows themselves: PDF · Word', !!ex && ex.menu === 'export' && ex.btns[0] === 'PDF' && ex.btns[1] === 'Word', JSON.stringify(ex));
    ok('2b nothing went to the model', await page.evaluate(n => (window.intel && intel.history || []).filter(m => m.role === 'assistant' && !m.act).length === n, spentBefore));
    await ask('add a signed document');
    ok('2c "add a signed document" is the Menu\'s own row', ((await lastCard()) || {}).menu === 'signed');
    ok('2d a question about the thing stays a question', await page.evaluate(() => caReadMenu('who are the signers?') === null));
    await ask('filing');
    await page.evaluate(() => { const cs = document.querySelectorAll('#igd-feed [data-ca-menu]'); const b = cs[cs.length - 1].querySelector('button:not([disabled])'); b.click(); });
    /* the row's own act: Filing and stream opens the contract's Details sheet at its filing rows */
    const landed = await until(page, () => !!document.getElementById('ov-record'), null, 6000);
    ok('2e the press presses the Menu\'s own row (Filing and stream lands on the filing rows)', landed);

    /* 3 a contract number in any form */
    const forms = await page.evaluate(() => ['mk B1', 'mkB1', 'MK-B1', 'open mk b1', 'show me mkB1'].map(q => { const r = hbParse(q); return r && r.act === 'openc' ? r.id : String(r && r.act); }));
    ok('3a every form reads as the one contract', forms.every(x => x === 'MK-B1'), JSON.stringify(forms));
    ok('3b words that only look like a number stay words', await page.evaluate(() => caRefFix('in 2026') === 'in 2026' && hbParse('what is the value of mk B1').act === 'card'));
    await page.click('#ig-dock [data-pd-tab="copilot"]').catch(() => {});
    await until(page, () => !!document.querySelector('#igd-input'), null, 5000);
    await ask('mk b1'); await page.waitForTimeout(1200);
    ok('3c typing "mk b1" opens it on Home', await page.evaluate(() => !!(window.intel && intel.paper && intel.paper.id === 'MK-B1')));
    const link = await page.evaluate(() => {
      intel.history.push({ role: 'assistant', text: 'MK-B2 waits on their signature.' }); renderIntelDock();
      const a = document.querySelector('#igd-feed .ai-bub [data-ref-open="MK-B2"]'); if (!a) return null;
      a.click(); return a.textContent;
    });
    await page.waitForTimeout(1200);
    ok('3d a number in an answer is a link that opens it', link === 'MK-B2' && await page.evaluate(() => intel.paper && intel.paper.id === 'MK-B2'), String(link));

    /* 4 the highlight's Comment keeps its words */
    await page.evaluate(() => { setView('dashboard'); igAnalyze('MK-B2'); });
    await until(page, () => !!document.querySelector('#ig-canvas [data-anchor="c1"] p, #ig-canvas [data-anchor="c1"]'), null, 10000);
    await page.waitForTimeout(600);
    const words = await page.evaluate(() => {
      const el = document.querySelector('#ig-canvas [data-anchor="c1"]'); const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let tn; while ((tn = w.nextNode())) if (tn.nodeValue.trim().length > 25) break;
      const r = document.createRange(); r.setStart(tn, 0); r.setEnd(tn, 24);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      document.querySelector('#ig-canvas').dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      return s.toString().replace(/\s+/g, ' ').trim();
    });
    await page.waitForTimeout(400);
    await page.locator('.nego-selmenu button', { hasText: 'Comment' }).click();
    await until(page, () => !!document.querySelector('[data-rl-np-pin] q'), null, 5000);
    const box = await page.$('.rl-np textarea, [data-rl-np-input], .rl-np-input');
    if (box){ await box.fill('A note on these words'); await page.locator('button', { hasText: 'Add note' }).last().click(); }
    await page.waitForTimeout(1500);
    const kept = await page.evaluate(w => { const t = [...document.querySelectorAll('.rl-np *')].map(e => e.textContent).join(' ');
      return t.includes('A note on these words') && t.includes(w.slice(0, 15)); }, words);
    ok('4 the saved note carries the highlighted words', kept, words);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);

    /* 5 Amend, beside the paper */
    ok('5a not offered on an agreement still being written', await page.evaluate(() => pdAmendOpen('MK-B2') === false && !document.querySelector('#pd-amendface')));
    await page.evaluate(() => { setView('dashboard'); igAnalyze('MK-B1'); });
    await until(page, () => !!document.querySelector('#ig-dock [data-pd-tab="menu"]'), null, 10000);
    await page.click('#ig-dock [data-pd-tab="menu"]');
    await until(page, () => !!(document.querySelector('#pd-body .pd-menu') || {}).dataset?.wired, null, 8000);
    await page.evaluate(() => { const b = document.querySelector('#pd-body .pd-mn-rows #ws-m-amend'); b.closest('details').open = true; b.click(); });
    ok('5b the Menu row opens Amend beside the paper', await until(page, () => !!document.querySelector('#pd-amendface'), null, 5000));
    await page.waitForTimeout(400);
    const signedBefore = await page.evaluate(() => JSON.stringify([getContract('MK-B1').redlineText || '', getContract('MK-B1').status, (getContract('MK-B1').signatures || []).length]));
    await page.locator('#ig-canvas [data-anchor="c1"]').first().click({ position: { x: 30, y: 8 } });
    await page.waitForTimeout(300);
    await page.fill('#pd-amendface [data-pd-am-txt="0"]', 'The Supplier shall supply an estimated 6000 metric tonnes per annum.');
    await page.fill('#pd-amendface [data-pd-am-fact="expiry"]', '2028-12-31');
    await page.waitForTimeout(200);
    const marked = await page.evaluate(() => ({ items: document.querySelectorAll('#pd-amendface .pd-am-it').length,
      mark: (document.querySelector('#ig-canvas [data-anchor="c1"] .pd-am-mk') || {}).textContent || '', ins: !!document.querySelector('#ig-canvas .pd-am-insert'),
      go: !document.querySelector('#pd-amendface [data-pd-am-go]').disabled }));
    ok('5c a clause pressed is change 1, numbered on the paper with its new words', marked.items === 1 && marked.mark === '1' && marked.ins && marked.go, JSON.stringify(marked));
    await page.screenshot({ path: path.join(OUT, '5-amend.png') });
    await page.click('#pd-amendface [data-pd-am-go]');
    await page.waitForTimeout(1500);
    const made = await page.evaluate(() => { const k = state.contracts.find(c => c.parentId === 'MK-B1');
      return k ? { status: k.status, n: (k.amends || []).length, op: k.amends && k.amends[0] && k.amends[0].op, end: k.amendFacts && k.amendFacts.expiry, on: intel.paper && intel.paper.id === k.id } : null; });
    ok('5d Create amendment draft makes the linked draft and opens it', !!made && made.status === 'Draft' && made.n === 1 && made.op === 'replace' && made.end === '2028-12-31' && made.on, JSON.stringify(made));
    const signedAfter = await page.evaluate(() => JSON.stringify([getContract('MK-B1').redlineText || '', getContract('MK-B1').status, (getContract('MK-B1').signatures || []).length]));
    ok('5e the signed agreement is untouched', signedBefore === signedAfter);
    ok('5f no marks are left on any paper', await page.evaluate(() => !document.querySelector('#ig-canvas .pd-am-mk, #ig-canvas .pd-am-insert')));

    ok('6 no page errors', errs.length === 0, errs.slice(0, 2).join(' | ') || null);
  } catch (e) { fail++; console.log('FAIL  the check threw — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
