/* ============================================================
   JAMBO'S WORDS — STAGE 1 OF THE ONE-PAGE HOME PLAN (the owner agreed the
   plan on 14 Oct 2026 and picked "Chips" by name)
   ============================================================
     1  On Home's Document, the chips stand above the box and say the next
        words for the contract on the paper; work owed leads, in the accent's outline (round 3 as drawn; amber before 18 Oct 2026)
     2  "/" on the Document lists the places, and nothing of the Board's
     3  a typed word moves the reader ("board"), and the panel offers the way
        back; Back returns to the same paper
     4  "/" on the Board is one list: the places first, then its own moves
     5  a word that is work opens its door ("redline" → the Redlines face
        beside the paper, stage 3; was Negotiate)
     6  the top bar's search offers the same places ("calen" → the Calendar)
     7  Svenska: the chips are Swedish words, and a Swedish word goes
   AT THE PARENT every claim FAILS: no chips with words, no places in "/",
   no way back, nothing in the search.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'jambo-words');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const DOC = 'SOFTWARE AS A SERVICE AGREEMENT\n\n1. TERM\n\nThis Agreement runs for twenty-four (24) months.\n\n2. FEES\n\nThe Customer shall pay the Fees within thirty (30) days of invoice.';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const owner = { id: me.id, name: me.name };
    const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    /* MK-W1 still owes its details (no value, no start date): "fill in" leads */
    const w1 = fixtureContract('MK-W1', 'SaaS Agreement', 'Nordkust Industri AB', FOLDER_A, 0, 'Draft', DOC);
    w1.owner = owner; w1.fields = Object.assign({}, w1.fields, { effDate: '' });
    await put(w1);
    await put(Object.assign(fixtureContract('MK-W2', 'Supply Agreement', 'Kilima Foods Ltd', FOLDER_A, 900000, 'Under Review', DOC), { owner }));

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await page.$('#li-email')) {
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    }
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length >= 2, null, { timeout: 15000 }).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.jamboUses'); } catch (_){} setView('dashboard'); });
    const onPaper = id => page.evaluate(i => pdOpenOnHome(i, 'copilot'), id);
    const settle = () => page.waitForFunction(() => !intel.busy, null, { timeout: 8000 }).catch(() => {});
    const type = async (text, enter) => {
      await page.click('#igd-input');
      await page.fill('#igd-input', '');
      await page.type('#igd-input', text, { delay: 15 });
      if (enter) { await page.keyboard.press('Enter'); await settle(); }
    };
    const pop = () => page.evaluate(() => [...document.querySelectorAll('#hb-askpop .hb-pop-opt b')].map(b => b.textContent.trim()));

    /* ===== 1. THE CHIPS ===== */
    await onPaper('MK-W1');
    const chipsUp = await page.waitForSelector('[data-ig-chips] [data-ca-chip]', { timeout: 8000 }).then(() => true, () => false);
    ok('1a on the Document, the chips stand above the box', chipsUp);
    const c1 = await page.evaluate(() => [...document.querySelectorAll('[data-ig-chips] [data-ca-chip]')].map(b => ({
      k: b.getAttribute('data-ca-chip'), text: b.textContent.trim(), owed: b.classList.contains('ca-chip-owed'),
      bg: getComputedStyle(b).backgroundColor, want: getComputedStyle(document.documentElement).getPropertyValue('--st-amber-bg').trim() })));
    ok('1b details owed: "fill in" leads', c1[0] && c1[0].k === 'fill' && c1[0].text === 'fill in', JSON.stringify(c1.map(x => x.text)));
    /* RE-POINTED 18 Oct 2026 (round 3 as drawn, "Tabs and faces"): the lead
       chip wears the accent's outline and the label weight, on the other
       chips' own ground — not amber */
    const lead = await page.evaluate(() => { const b = document.querySelector('[data-ig-chips] .ca-chip-owed'); const o = document.querySelector('[data-ig-chips] [data-ca-chip]:not(.ca-chip-owed)');
      const d = document.createElement('i'); d.style.color = 'var(--accent-solid)'; document.body.appendChild(d); const acc = getComputedStyle(d).color; d.remove();
      return b ? { edge: getComputedStyle(b).borderTopColor, acc, bg: getComputedStyle(b).backgroundColor, otherBg: o ? getComputedStyle(o).backgroundColor : null, otherEdge: o ? getComputedStyle(o).borderTopColor : null } : null; });
    ok('1c the lead is drawn as owed work — the accent outline — the rest are not', c1[0] && c1[0].owed && c1.slice(1).every(x => !x.owed) && !!lead && lead.edge === lead.acc && lead.bg === lead.otherBg && lead.otherEdge !== lead.acc, JSON.stringify(lead));
    ok('1d the chips agree with the side panel\'s checklist', await page.evaluate(() => caChipLead(getContract('MK-W1')) === 'fill'));
    await page.screenshot({ path: path.join(OUT, '1-chips-on-the-paper.png') });

    /* ===== 2. "/" ON THE DOCUMENT ===== */
    await type('/');
    await page.waitForSelector('#hb-askpop', { timeout: 4000 }).catch(() => {});
    const p2 = await pop();
    ok('2a "/" lists the places', p2[0] === '/redline' && p2.includes('/board') && p2.includes('/sign'), JSON.stringify(p2));
    ok('2b nothing of the Board\'s own moves off the Board', !p2.includes('/trend') && !p2.includes('/compare'));
    await page.screenshot({ path: path.join(OUT, '2-slash-on-the-paper.png') });
    await page.keyboard.press('Escape');

    /* ===== 3. A WORD MOVES; THE WAY BACK ===== */
    await type('board', true);
    const onBoard = await page.waitForFunction(() => hbFace() === 'board', null, { timeout: 5000 }).then(() => true, () => false);
    ok('3a "board" opens the Board', onBoard);
    const back = await page.waitForSelector('.ca-back', { timeout: 4000 }).then(e => e.textContent(), () => '');
    ok('3b the panel offers the way back', /Back to MK-W1 on the paper/.test(back), back);
    await page.screenshot({ path: path.join(OUT, '3-board-with-the-way-back.png') });

    /* ===== 4. "/" ON THE BOARD: ONE LIST ===== */
    await type('/');
    await page.waitForSelector('#hb-askpop', { timeout: 4000 }).catch(() => {});
    const p4 = await pop();
    const heads = await page.evaluate(() => [...document.querySelectorAll('#hb-askpop h5')].map(h => h.textContent.trim()));
    const firstMove = p4.findIndex(w => w === '/compare' || w === '/trend');
    ok('4a the places first, then the Board\'s moves', p4[0] === '/board' || p4[0] === '/redline', JSON.stringify(p4));
    ok('4b the Board\'s moves are all still there', p4.includes('/trend') && p4.includes('/compare') && firstMove > 0 && p4.length >= 8);
    ok('4c two headed groups', heads.length === 2 && heads[0] === 'Most used', JSON.stringify(heads));
    ok('4d a place used counts ("board" once)', await page.evaluate(() => (caSlashRows('')[0] || {}).k === 'board'));
    await page.screenshot({ path: path.join(OUT, '4-slash-on-the-board.png') });
    await page.keyboard.press('Escape');
    await type('/tr');
    const p4e = await pop();
    ok('4e "/tr" still finds the trend move', p4e.includes('/trend'), JSON.stringify(p4e));
    await page.keyboard.press('Escape');
    await page.fill('#igd-input', '');

    /* back to the paper */
    await page.click('.ca-back');
    const backOk = await page.waitForFunction(() => hbFace() === 'paper' && intel.paper && intel.paper.id === 'MK-W1', null, { timeout: 5000 }).then(() => true, () => false);
    ok('3c Back returns to the same paper', backOk);

    /* ===== 5. WORK OPENS TODAY'S DOOR ===== */
    await onPaper('MK-W2');
    await page.waitForSelector('[data-ig-chips] [data-ca-chip]', { timeout: 8000 }).catch(() => {});
    await type('redline', true);
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 3): the redlines
       open beside the paper, in Jambo's panel */
    const nego = await page.waitForFunction(() => state.view === 'dashboard' && !!document.getElementById('pd-redface') && intel.paper && intel.paper.id === 'MK-W2', null, { timeout: 8000 }).then(() => true, () => false);
    ok('5 "redline" opens the redlines of the contract on the paper', nego, await page.evaluate(() => state.view + ' ' + (intel.paper && intel.paper.id) + ' face ' + !!document.getElementById('pd-redface')));

    /* ===== 6. THE TOP BAR'S SEARCH ===== */
    await page.evaluate(() => openCommandPalette());
    const pal = await page.waitForSelector('#cp-input', { timeout: 4000 }).catch(() => null);
    if (pal) {
      await pal.type('calen', { delay: 20 });
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, '6-search-offers-the-place.png') });
      await page.keyboard.press('Enter');
    }
    const cal = await page.waitForFunction(() => state.view === 'dashboard' && hbFace() === 'calendar', null, { timeout: 6000 }).then(() => true, () => false);
    ok('6 "calen" in the search opens the Calendar', !!pal && cal);

    /* ===== 7. SVENSKA ===== */
    const sv = await page.$('.lang-btn[data-lang="sv"]');
    if (sv) await sv.click();
    ok('7 the Svenska switch is there', !!sv);
    await page.evaluate(() => setView('dashboard'));
    await onPaper('MK-W1');
    await page.waitForSelector('[data-ig-chips] [data-ca-chip]', { timeout: 8000 }).catch(() => {});
    const c7 = await page.evaluate(() => [...document.querySelectorAll('[data-ig-chips] [data-ca-chip]')].map(b => b.textContent.trim()));
    ok('7a the chips are Swedish words', c7[0] === 'fyll i' && c7.includes('förhandla') && c7.includes('dela') /* re-pointed 15 Oct 2026: the next steps, redlines → share → sign */, JSON.stringify(c7));
    const back7 = await page.evaluate(() => { const b = document.querySelector('.ca-back'); return b ? b.textContent.trim() : ''; });
    /* the redlines are on the paper now (stage 3): the way back is to it, and the face is there */
    /* RE-WORDED 14 Oct 2026 (the one-page Home plan, stage 6): the plan's Swedish
       spells the paper as the book mostly does, "papperet" */
    ok('7c the way back names the page it returns to', back7 === '‹ Tillbaka till MK-W2 på papperet', back7);
    await page.screenshot({ path: path.join(OUT, '7-svenska.png') });
    await type('kalender', true);
    const svCal = await page.waitForFunction(() => hbFace() === 'calendar', null, { timeout: 5000 }).then(() => true, () => false);
    ok('7b "kalender" opens the Calendar', svCal);
    const en2 = await page.$('.lang-btn[data-lang="en"]'); if (en2) await en2.click();

    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the check ran to the end', false, (e && e.stack) || String(e));
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
