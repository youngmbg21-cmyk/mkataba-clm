/* THE MENU TAB, JAMBO'S WORDS FOR IT, THE CONTRACT NUMBER, THE HIGHLIGHT'S
   NOTE AND AMEND BESIDE THE PAPER (owner, 15 Oct 2026: "go with beside paper
   and build the rest as well", the Seven Fixes artifact).

   1 the panel's Menu tab ("Next up") holds the paper's old ⋯ rows; the ⋯ is
     gone from the paper's line
   2 asking Jambo for a Menu act answers with the row itself as the button
     ("export" → PDF · Word), nothing spent; a press opens the Menu tab and
     presses the row; a file coming IN is not the PDF copy going out, and
     "import from excel" is not the other side's file (owner, 18 Oct 2026:
     "Fix the Menu reader's pdf and import misreads")
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
    /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): the Menu tab is retired into the dossier's All acts fold */
    await until(page, () => !!document.querySelector('#ig-dock .ds-fold[data-ds-fold="acts"]'), null, 10000);
    ok('1a no ⋯ on the paper\'s line', await page.evaluate(() => !document.querySelector('#ig-strip #ws-more')));
    await page.evaluate(() => { const f = document.querySelector('#ig-dock .ds-fold[data-ds-fold="acts"]'); if (f) f.open = true; });
    await until(page, () => !!(document.querySelector('#ig-dock .ds-nx') || {}).dataset?.wired, null, 8000);
    const menu = await page.evaluate(() => ({ tab: !!document.querySelector('#ig-dock [data-pd-tab="menu"]'),
      groups: [...document.querySelectorAll('#ig-dock .ds-fold[data-ds-fold="acts"] .ds-fold-h')].map(x => x.textContent.trim()),
      rows: ['#ws-pdf', '#ws-word', '#ws-filing', '#ws-import'].filter(s => document.querySelector('#ig-dock .ds-fold .pd-mn-rows ' + s)) }));
    ok('1b All acts: the ⋯ rows in their groups, no Menu tab', !menu.tab && menu.groups.length >= 3 && menu.rows.length === 4, JSON.stringify(menu));
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
    /* A FILE COMING IN, AND SOMEBODY ELSE'S IMPORT, ARE NOT THESE ROWS (18 Oct 2026) */
    const reads = await page.evaluate(() => ({
      inbound: ['I want to upload a pdf', 'attach the pdf', 'we got a pdf from them', 'ladda upp en pdf'].map(q => [q, (caReadMenu(q) || {}).menu || null]),
      signedPdf: (caReadMenu('add a signed pdf') || {}).menu || null,
      outbound: ['get me a pdf', 'save as pdf', 'download the pdf'].map(q => [q, (caReadMenu(q) || {}).menu || null]),
      bulk: ['import from excel', 'import our old contracts', 'importera gamla avtal'].map(q => [q, (caReadMenu(q) || {}).menu || null]),
      theirs: ['import their changes', 'import the word file', 'importera deras ändringar'].map(q => [q, (caReadMenu(q) || {}).menu || null]) }));
    ok('2f a file coming in is not the PDF copy going out; "add a signed pdf" is the signed-document row',
      reads.inbound.every(([, m]) => m === null) && reads.signedPdf === 'signed' && reads.outbound.every(([, m]) => m === 'pdf'), JSON.stringify(reads));
    ok('2g the import row is the other side\'s file only; an import from elsewhere is not it',
      reads.bulk.every(([, m]) => m === null) && reads.theirs.every(([, m]) => m === 'import'), JSON.stringify(reads));
    const cards0 = await page.evaluate(() => document.querySelectorAll('#igd-feed [data-ca-menu]').length);
    await ask('I want to upload a pdf');
    /* RE-POINTED 19 Oct 2026 (Jambo as a tab you flip to, and back; the owner: "you land on the page and
       if you want to chat with jambo it takes you to a new jambo tab but you can go back to the landing side
       panel"): the landing's own cards are not in the conversation view, so the count is of the cards the
       answer drew — none in the conversation — never the landing's less the conversation's */
    const up = await page.evaluate(n => { const m = intel.history[intel.history.length - 1] || {};
      const talk = document.querySelector('#igd-feed.igd-talk');
      return { cards: talk ? talk.querySelectorAll('[data-ca-menu]').length : Math.max(0, document.querySelectorAll('#igd-feed [data-ca-menu]').length - n), act: m.act ? { kind: m.act.kind, place: m.act.place } : null }; }, cards0);
    ok('2h typed beside the paper, "I want to upload a pdf" goes to the upload, no PDF card', up.cards === 0 && !!up.act && up.act.kind === 'go' && up.act.place === 'upload', JSON.stringify(up));
    /* RE-POINTED 18 Oct 2026 (LAND ON IT, the owner's rule): the upload lands on
       Jambo's drop area on the Contracts place, lit — the paper is left — so the
       next ask brings the paper back first */
    ok('2h2 and it lands on the drop area on the Contracts place, lit', await until(page, () => { const d = document.getElementById('pd-drop');
      return !!d && d.classList.contains('is-landed') && !!document.getElementById('ct-place'); }, null, 6000));
    const toJambo = async () => { await page.evaluate(() => { setView('dashboard'); igAnalyze('MK-B2'); });
      await until(page, () => window.intel && intel.paper && intel.paper.id === 'MK-B2' && !!document.querySelector('#ig-dock [data-pd-tab="copilot"]'), null, 10000);
      await page.click('#ig-dock [data-pd-tab="copilot"]').catch(() => {});
      return until(page, () => { const i = document.querySelector('#igd-input'); return !!i && i.getBoundingClientRect().width > 0 && !intel.busy; }, null, 8000); };
    await toJambo();
    await ask('filing');
    await page.evaluate(() => { const cs = document.querySelectorAll('#igd-feed [data-ca-menu]'); const b = cs[cs.length - 1].querySelector('button:not([disabled])'); b.click(); });
    /* the row's own act: Filing and stream opens the contract's Details sheet at its filing rows */
    const landed = await until(page, () => !!document.getElementById('ov-record'), null, 6000);
    ok('2e the press presses the Menu\'s own row (Filing and stream lands on the filing rows)', landed);
    /* back to Jambo beside the paper (the Details sheet left his panel on another tab, as step 3 knows) */
    ok('2i · Jambo beside the paper again', await toJambo());
    await ask('import from excel');
    ok('2j "import from excel" beside the paper opens the Import page, not the other side\'s file', await until(page, () => state.view === 'migration', null, 6000),
      await page.evaluate(() => state.view));
    await toJambo();
    /* A WORD FILE COMING IN, OR KEPT HERE, IS NOT THE COPY SENT TO THE OTHER SIDE (18 Oct 2026) */
    const wd = await page.evaluate(() => {
      const door = q => (caReadDoor(q) || {}).door || null;
      const act = q => { const a = caActOf(q) || {}; return a.kind === 'door' ? 'door:' + a.door : a.kind === 'menu' ? 'menu:' + a.menu : a.kind === 'go' ? 'go:' + a.place : String(a.kind || null); };
      return {
        inbound: ['add a word file', 'I want to upload a word file', 'we got a word copy from them', 'import the word file', 'attach the word document'].map(q => [q, door(q)]),
        kept: ['download a word copy', 'save it as a word file', 'export a word version'].map(q => [q, door(q)]),
        sent: ['send them a word version', 'email the word file to them', 'share a word copy', 'with tracked changes'].map(q => [q, door(q)]),
        routed: [['add a word file', 'go:upload'], ['import the word file', 'menu:import'], ['download a word copy', 'menu:wordx'], ['send them a word version', 'door:word']].map(([q, want]) => [q, act(q), want]) };
    });
    ok('2k a Word file coming in, or kept here, is not the Word copy for the other side; sending one still is',
      wd.inbound.every(([, d]) => d === null) && wd.kept.every(([, d]) => d === null) && wd.sent.every(([, d]) => d === 'word'), JSON.stringify(wd));
    ok('2l each goes to its own door: upload · their file · the Word download · the Word copy to send', wd.routed.every(([, got, want]) => got === want), JSON.stringify(wd.routed));
    const doors0 = await page.evaluate(() => document.querySelectorAll('#igd-feed .ca-card').length);
    await ask('add a word file');
    const wup = await page.evaluate(n => { const m = intel.history[intel.history.length - 1] || {};
      return { cards: document.querySelectorAll('#igd-feed .ca-card').length - n, door: !!(m.act && m.act.kind === 'door'), act: m.act ? { kind: m.act.kind, place: m.act.place } : null }; }, doors0);
    ok('2m typed beside the paper, "add a word file" goes to the upload, no Word copy card', !wup.door && !!wup.act && wup.act.kind === 'go' && wup.act.place === 'upload', JSON.stringify(wup));
    await toJambo();

    /* 3 a contract number in any form */
    const forms = await page.evaluate(() => ['mk B1', 'mkB1', 'MK-B1', '#mk-b1'].map(q => { const r = hbParse(q); return r && r.act === 'openc' ? r.id : String(r && r.act); })
      .concat(['open mk b1', 'show me mkB1'].map(q => { const f = hbFindContract(q); return f && f.c ? f.c.id : 'none'; })));
    ok('3a every form reads as the one contract (alone it opens it)', forms.every(x => x === 'MK-B1'), JSON.stringify(forms));
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
    /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): the row stands in the dossier's All acts fold */
    await until(page, () => !!(document.querySelector('#ig-dock .ds-nx') || {}).dataset?.wired && intel.paper && intel.paper.id === 'MK-B1', null, 10000);
    await page.evaluate(() => { const b = document.querySelector('#ig-dock .ds-fold .pd-mn-rows #ws-m-amend'); if (!b) return; b.closest('details').open = true; b.click(); });
    ok('5b the All acts row opens Amend beside the paper', await until(page, () => !!document.querySelector('#pd-amendface'), null, 5000));
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
