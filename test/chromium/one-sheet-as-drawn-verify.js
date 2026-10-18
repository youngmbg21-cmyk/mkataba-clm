/* DRAFT FROM A SENTENCE, "ONE SHEET", EVERY DRAWN PART (round 4 of the
   redesign, option 2 "One sheet"; the owner's yes of 18 Oct 2026 to build
   every gap between the picked drawing and HaTi; js/wizard.js
   openNewAgreement, js/copilotacts.js caDraftRank / caDraftWhatOf,
   js/core.js dlgPageAdopt)

   WHAT THIS PINS, driven in a real browser from the Counter's box
     1 the head: "New agreement · not created yet", the desk's way back and its
       tab "New agreement ×", the reason beside Create draft, Cancel — and no
       "Skip the questions"
     2 the sheet stands on the desk beside Jambo's panel, which says in one
       line what he read ("… an NDA, with Volvo Cars. The closest of our paper
       is our NDA; you pick. …") — no line before it, no doors back to a sheet
       that is up, no wall furniture
     3 From your words: What · With (amber, not in Parties yet) · What it is
       for (Not read yet) · Let Jambo fill the form
     4 1 Start from: the three closest as cards with a radio and their shelf's
       facts, the closest marked, nothing picked; the search and Legal on the
       step's line
     5 picked: its questions say "N questions · only Counterparty is needed
       now", the counterparty "✦ from your words"; who else says nobody is
       emailed until you send; the cost of reading stands on the stream's row
     6 a stream chosen: the reason goes, Create makes the draft
     7 ‹ The counter in the sheet's head goes back to the Counter
     8 the owner's three screens: the head and Create in view, nothing
       sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/one-sheet-as-drawn-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const SAY = 'NDA with Volvo Cars for a pilot';

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { contracts: [H.fixtureContract('MK-A1', 'Refined Sugar Supply', 'Kabras Sugar', H.FOLDER_A, 48000000, 'Under Review')], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.length > 0, null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const ask = async () => {
      await page.evaluate(() => { if (window.deskGoCounter) deskGoCounter(); });
      await until(() => !!document.getElementById('cn-q'), null, 8000);
      await page.fill('#cn-q', SAY); await page.keyboard.press('Enter');
      return until(() => !!document.getElementById('na-root') && !!document.querySelector('#ig-dock .ca-dr-said'), null, 12000); };
    const SHEET = () => { const panel = document.querySelector('[data-dlg-page]'), head = panel && panel.querySelector('.dlg-pg-head');
      const vis = el => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none');
      const t = el => (el ? el.innerText : '').replace(/\s+/g, ' ').trim();
      const dock = document.getElementById('ig-dock'), frame = panel && panel.parentElement;
      const fr = frame && frame.getBoundingClientRect(), dr = dock && dock.getBoundingClientRect();
      const cards = [...document.querySelectorAll('#na-closest .na-pick')];
      return { title: t(head && head.querySelector('.dlg-pg-title')), crumb: t(head && head.querySelector('.dlg-pg-crumb')),
        acts: [...(head ? head.querySelectorAll('.dlg-pg-acts > *') : [])].filter(vis).map(x => t(x)),
        skip: !!document.getElementById('na-skip'), create: (document.getElementById('na-create') || {}).disabled,
        beside: !!(fr && dr && vis(dock) && Math.abs(fr.right - dr.left) <= 2), dockVis: vis(dock),
        said: t(document.querySelector('#ig-dock .ca-dr-said .ca-say')), saidActs: vis(document.querySelector('#ig-dock .ca-dr-said .ca-acts')),
        lines: [...document.querySelectorAll('#ig-dock .ai-msg .ai-bub')].filter(vis).map(t),
        wall: ['.pd-hello', '#pd-drop', '[data-ig-chips]'].some(s => vis(document.querySelector('#ig-dock ' + s))),
        words: [...document.querySelectorAll('#na-words .na-w-c')].map(c => ({ t: t(c), owed: c.classList.contains('is-owed') })), fill: t(document.getElementById('dr-read')),
        step1: t(document.querySelector('#wz-pick .na-step')), cards: cards.map(c => ({ t: t(c), radio: !!c.querySelector('.na-radio'), checked: c.getAttribute('aria-checked') })),
        sub: t(document.getElementById('na-card-sub')), cardName: t(document.getElementById('na-card-name')),
        cp: t([...document.querySelectorAll('#na-form label > span:first-child')].find(sp => /Counterparty/.test(sp.textContent))),
        people: t(document.querySelector('#na-people > summary')), file: (() => { const row = document.querySelector('#na-file .na-file-b'), cost = row && row.querySelector('.na-file-cost');
          return row && cost ? { cost: t(cost), inRow: cost.getBoundingClientRect().top < row.getBoundingClientRect().bottom && cost.getBoundingClientRect().top >= row.getBoundingClientRect().top - 1 } : null; })() }; };

    /* 1 + 2 the head, the sheet beside Jambo */
    check('0 the Counter\'s box brings the sheet and Jambo\'s line', !!(await ask()));
    await page.waitForTimeout(400);
    const S1 = await page.evaluate(SHEET);
    check('1a "New agreement · not created yet"', S1.title === 'New agreement not created yet', S1.title);
    check('1b the desk\'s way back and its tab, in the sheet\'s head: "‹ The counter · New agreement ×"', S1.crumb === '‹ The counter New agreement ×', S1.crumb);
    check('1c the reason beside Create draft, then Cancel — no "Skip the questions"', S1.acts.join('|') === 'Pick a template first|Create draft|Cancel' && !S1.skip && S1.create, JSON.stringify(S1.acts));
    check('2a the sheet stands on the desk beside Jambo\'s panel', S1.beside, JSON.stringify({ beside: S1.beside, dock: S1.dockVis }));
    check('2b Jambo says in one line what he read, as drawn', S1.said === 'I’ve opened a new agreement on the desk with what I read: an NDA, with Volvo Cars. The closest of our paper is our NDA; you pick. Nothing is created until you press Create.', S1.said);
    check('2c no line in front of it, no doors back to a sheet that is up, no wall furniture', !S1.lines.some(l => /carry this/.test(l)) && !S1.saidActs && !S1.wall, JSON.stringify({ lines: S1.lines, acts: S1.saidActs, wall: S1.wall }));
    /* 3 From your words */
    const W3 = S1.words.map(w => w.t);
    check('3 From your words: What · With (amber, not in Parties yet) · What it is for (Not read yet) · Let Jambo fill the form',
      W3.length === 3 && /^What /.test(W3[0]) && W3[1] === 'With · not in Parties yet Volvo Cars' && S1.words[1].owed && W3[2] === 'What it is for Not read yet' && /^Let Jambo fill the form/.test(S1.fill), JSON.stringify({ W3, fill: S1.fill }));
    /* 4 Start from */
    check('4a 1 Start from: the three closest on our paper, nothing picked for you; the search and Legal on its line',
      /^1 Start from the three closest on our paper · nothing is picked for you Search all our paper \(\d+\) · None fits\? Ask Legal with a request$/.test(S1.step1), S1.step1);
    check('4b three cards, each with a radio and its shelf, the closest marked, none checked', S1.cards.length === 3 && S1.cards.every(c => c.radio && c.checked === 'false')
      && /the closest/.test(S1.cards[0].t) && S1.cards.every(c => /template|standard/i.test(c.t)), JSON.stringify(S1.cards));
    await shot(page, '4-one-sheet-1440x780');
    /* 5 picked */
    await page.click('#na-closest .na-pick');
    await until(() => !!document.querySelector('#na-form input'), null, 8000);
    await page.waitForTimeout(300);
    const S5 = await page.evaluate(SHEET);
    check('5a the closest picked: its radio checked', S5.cards[0].checked === 'true', JSON.stringify(S5.cards[0]));
    check('5b its questions: "N questions · only Counterparty is needed now"', /^\d+ questions · only Counterparty is needed now$/.test(S5.sub) && /asks$/.test(S5.cardName), `${S5.cardName} · ${S5.sub}`);
    check('5c the counterparty the sentence filled says so: "✦ from your words"', /^Counterparty \*? ?✦ from your words$/.test(S5.cp.replace(/\s+/g, ' ')), S5.cp);
    check('5d who else: "Who else is on this agreement · nobody is emailed until you send"', /^Who else is on this agreement · nobody is emailed until you send/.test(S5.people), S5.people);
    check('5e the cost of reading on the stream\'s own row', !!S5.file && S5.file.inRow && /^When it is created, Jambo reads it/.test(S5.file.cost), JSON.stringify(S5.file));
    check('5f the reason is now the stream\'s', S5.acts.join('|') === 'Choose a stream first|Create draft|Cancel', JSON.stringify(S5.acts));
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(450);
      const S = await page.evaluate(() => { const c = document.getElementById('na-create'), r = c && c.getBoundingClientRect();
        const why = document.getElementById('na-why'), wr = why && why.getBoundingClientRect();
        return { create: !!r && r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth, why: !!wr && wr.width > 0, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`8 ${w}×${ht}: Create and its reason in view in the head, nothing sideways`, S.create && S.why && S.side, JSON.stringify(S));
      await shot(page, `4-one-sheet-${w}x${ht}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);
    /* 6 a stream, then Create */
    await page.click('#na-file [data-na-stream]');
    const S6 = await until(() => { const b = document.getElementById('na-create'); return b && !b.disabled ? (document.getElementById('na-why') || {}).textContent : null; }, null, 6000);
    check('6a a stream chosen: Create wakes, the reason goes', S6 === '', JSON.stringify(S6));
    const n0 = await page.evaluate(() => state.contracts.length);
    await page.click('#na-create');
    const made = await until(n => !document.getElementById('na-root') && state.contracts.length > n, n0, 15000);
    check('6b Create makes the draft', !!made);
    /* 7 the way back */
    await ask();
    await page.click('[data-na-counter]');
    const back = await until(() => !document.getElementById('na-root') && state.view === 'counter', null, 6000);
    check('7 ‹ The counter in the sheet\'s head goes back to the Counter', !!back);
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
