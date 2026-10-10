/* Chromium verification: THE POP-UPS, THE SAP WAY (owner's go, 10 Oct 2026:
   "build the pops the SAP way per the artifact").

   WHAT THIS PINS, driven in a real browser
     1 the act first, Cancel last — in the "are you sure?" box, the "type an
       answer" box and an ordinary dialog's foot, in the DOM (Tab order) and
       in the drawing
     2 a pop-up's date is HaTi's own: a face that prints the day in words, a
       calendar that writes the ISO day into the real box, 'change' fired
     3 a pop-up's closed dropdown wears HaTi's face, not the browser's
     4 a delete that worked says so calmly, never as a red error
     5 a pop-up that would only say "no" does not open: Compare with one
       version greys in the ⋯ menu with its reason
     6 "Draft new agreement" drops its two doors as a menu under the button
     7 the counterparty's response comes in on two tabs, the buttons last
     8 a removed obligation comes back from its toast's Undo
     9 an approval rule is read back as a sentence
    10 Alerts that say the same thing are one group with a count
    11 a question that ends something (Decline) is red, with a warning sign

   Every half is guarded: a missing feature REPORTS, never times out.
   Run: node test/chromium/sap-popups-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d != null ? '  → ' + d : '')); };
const wait = async (page, fn, arg, ms = 5000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};
const CONTRACTS = [
  H.fixtureContract('MK-P1', 'Raw Milk Collection', 'Nandi Dairy', H.FOLDER_A, 36000000, 'Under Review'),
  { ...H.fixtureContract('MK-P2', 'Packaging Supply', 'Nampak Kenya', H.FOLDER_A, 4000000, 'Draft'), status: 'Draft' },
];

(async () => {
  const h = await H.startHati();
  await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const b = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await wait(page, () => typeof window.openModal === 'function' && window.state && state.contracts && state.contracts.length > 1, null, 15000);

    /* ---- 1. THE ACT FIRST, CANCEL LAST ---- */
    console.log('\n1 · the act first, Cancel last');
    const order = sel => page.evaluate(([a, c]) => {
      const A = document.querySelector(a), C = document.querySelector(c);
      if (!A || !C) return null;
      return { dom: !!(A.compareDocumentPosition(C) & Node.DOCUMENT_POSITION_FOLLOWING),
        drawn: C.getBoundingClientRect().left > A.getBoundingClientRect().left };
    }, sel);
    await page.evaluate(() => { window._q = confirmDialog({ title: 'Delete this?', confirmLabel: 'Delete', danger: true }); });
    await wait(page, () => !!document.getElementById('cf-ok'));
    const cf = await order(['#cf-ok', '#cf-cancel']);
    ok('1a "are you sure?": the act first, Cancel last', cf && cf.dom && cf.drawn, JSON.stringify(cf));
    await page.click('#cf-cancel').catch(() => {});
    await page.evaluate(() => { window._p = promptDialog({ title: 'Name this view', confirmLabel: 'Save view' }); });
    await wait(page, () => !!document.getElementById('pd-ok'));
    const pd = await order(['#pd-ok', '#pd-cancel']);
    ok('1b "type an answer": the act first, Cancel last', pd && pd.dom && pd.drawn, JSON.stringify(pd));
    await page.click('#pd-cancel').catch(() => {});
    await page.evaluate(() => { const c = getContract('MK-P1'); state.activeId = c.id; setView('workspace'); });
    await page.waitForTimeout(900);
    await page.evaluate(() => openObligationForm(getContract('MK-P1')));
    const formUp = await wait(page, () => !!document.querySelector('#modal-root [role="dialog"] [data-dlg-cancel]'));
    const ob = formUp ? await page.evaluate(() => {
      const c = document.querySelector('#modal-root [role="dialog"] [data-dlg-cancel]');
      const row = c.parentElement, btns = [...row.children].filter(e => e.tagName === 'BUTTON' && e.getClientRects().length);
      const r = e => e.getBoundingClientRect().left;
      return { last: btns[btns.length - 1] === c, rightmost: btns.every(x => x === c || r(x) < r(c)), n: btns.length };
    }) : null;
    ok('1c a dialog\'s Cancel is the foot\'s last button, in the DOM and drawn', ob && ob.last && ob.rightmost && ob.n > 1, JSON.stringify(ob));

    /* ---- 2. A DATE ON HaTi'S OWN CALENDAR ---- */
    console.log('\n2 · the date');
    const dp = await page.evaluate(() => {
      const inp = document.querySelector('#modal-root input[type="date"]');
      const face = inp && inp.nextElementSibling;
      return inp ? { id: inp.id, hidden: getComputedStyle(inp).display === 'none', face: !!(face && face.classList.contains('dp-face')),
        faceText: face ? face.textContent.trim() : null } : null;
    });
    ok('2a the date box is hidden behind HaTi\'s own face', dp && dp.hidden && dp.face, JSON.stringify(dp));
    if (dp && dp.face) {
      await page.click(`#modal-root input[type="date"] + .dp-face`);
      const popUp = await wait(page, () => !!document.querySelector('.dp-pop [data-dp-day]'));
      ok('2b pressing it opens HaTi\'s calendar', popUp);
      if (popUp) {
        const want = await page.evaluate(() => {
          const d = [...document.querySelectorAll('.dp-pop [data-dp-day]:not([disabled])')].find(x => !x.classList.contains('dp-other') && x.textContent.trim() === '15');
          window._chg = 0; const inp = document.querySelector('#modal-root input[type="date"]');
          inp.addEventListener('change', () => { window._chg++; });
          d.click(); return d.dataset.dpDay;
        });
        const got = await page.evaluate(() => {
          const inp = document.querySelector('#modal-root input[type="date"]');
          return { v: inp.value, face: inp.nextElementSibling.textContent.trim(), chg: window._chg, open: !!document.querySelector('.dp-pop') };
        });
        ok('2c the picked day is written to the real box as an ISO day', got.v === want, `${got.v} vs ${want}`);
        ok('2d and the face says it in words, the calendar closed, change fired',
          /\b15\b/.test(got.face) && !/\d{4}-\d{2}-\d{2}/.test(got.face) && !got.open && got.chg === 1, JSON.stringify(got));
        const set = await page.evaluate(() => {
          const inp = document.querySelector('#modal-root input[type="date"]');
          inp.value = '2030-01-02'; return inp.nextElementSibling.textContent.trim();
        });
        ok('2e a day written by code repaints the face', /2030/.test(set) && /\b2\b/.test(set), set);
      }
    }

    /* ---- 3. THE CLOSED DROPDOWN ---- */
    console.log('\n3 · the dropdown');
    const sel = await page.evaluate(() => {
      const s = [...document.querySelectorAll('#modal-root select')].find(x => x.getClientRects().length);
      return s ? { app: getComputedStyle(s).appearance, img: /gradient/.test(getComputedStyle(s).backgroundImage) } : null;
    });
    ok('3 a pop-up\'s dropdown wears HaTi\'s face', sel && sel.app === 'none' && sel.img, JSON.stringify(sel));
    await page.evaluate(() => closeModal());

    /* ---- 4. A DONE DELETE IS CALM ---- */
    console.log('\n4 · the done delete');
    await page.evaluate(() => { setView('register'); deleteContract('MK-P2'); });
    if (await wait(page, () => !!document.getElementById('cf-ok'))) {
      await page.click('#cf-ok');
      const kind = await wait(page, () => [...document.querySelectorAll('#toast-root [data-toast-kind]')].some(t => /deleted/.test(t.textContent)))
        ? await page.evaluate(() => [...document.querySelectorAll('#toast-root [data-toast-kind]')].find(t => /deleted/.test(t.textContent)).dataset.toastKind)
        : null;
      ok('4 "deleted" is a calm toast, not a red error', kind === 'ok', String(kind));
    } else ok('4 the delete question opened', false);

    /* ---- 5. COMPARE, ONE VERSION: GREY WITH ITS REASON ---- */
    console.log('\n5 · no pop-up to say no');
    await page.evaluate(() => { const c = getContract('MK-P1'); state.activeId = c.id; setView('workspace'); });
    await page.waitForTimeout(1000);
    const cmp = await page.evaluate(() => { const b = document.getElementById('ws-compare');
      return b ? { dis: b.disabled, why: b.title, note: (b.querySelector('.mnote') || {}).textContent || '' } : null; });
    ok('5 Compare with one version is greyed, with its reason on the row', cmp && cmp.dis && /one/i.test(cmp.note) && /nothing to compare/.test(cmp.why), JSON.stringify(cmp));

    /* ---- 6. THE TWO DOORS ARE A MENU ---- */
    console.log('\n6 · the two doors');
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(900);
    const newBtn = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find(b => b.getClientRects().length && /Draft new agreement/.test(b.textContent)));
    if (newBtn && await newBtn.evaluate(b => !!b)) {
      await newBtn.click();
      const m = await wait(page, () => !!document.querySelector('#nd-menu [data-nd-door="draft"]'));
      const md = m ? await page.evaluate(() => ({ dlg: !!document.querySelector('#modal-root [role="dialog"]'),
        n: document.querySelectorAll('#nd-menu [data-nd-door]').length })) : null;
      ok('6 the doors drop as a menu, with no dialog behind them', md && !md.dlg && md.n === 2, JSON.stringify(md));
      await page.keyboard.press('Escape');
      ok('6b Escape folds the menu away', await wait(page, () => !document.getElementById('nd-menu')));
    } else ok('6 the Draft new agreement button is on the page', false);

    /* ---- 7. THEIR RESPONSE ON TWO TABS ---- */
    console.log('\n7 · their response');
    await page.evaluate(() => openImportModal(getContract('MK-P1')));
    await wait(page, () => !!document.querySelector('[data-imp-tab]'));
    const imp = await page.evaluate(() => {
      const d = document.querySelector('#modal-root [role="dialog"]');
      const btns = [...d.querySelectorAll('button')].filter(b => b.getClientRects().length);
      const last = btns[btns.length - 1];
      return { tabs: d.querySelectorAll('[data-imp-tab]').length, last: last && last.id,
        wordHidden: d.querySelector('[data-imp-pane="word"]').hidden };
    });
    ok('7a two tabs, the Word pane folded', imp.tabs === 2 && imp.wordHidden, JSON.stringify(imp));
    ok('7b Cancel is the last thing in the dialog', imp.last === 'imp-cancel', imp.last);
    await page.click('[data-imp-tab="word"]');
    const imp2 = await page.evaluate(() => ({ word: !document.querySelector('[data-imp-pane="word"]').hidden, go: document.getElementById('imp-go').hidden }));
    ok('7c the Word tab shows the file box and stands Import down', imp2.word && imp2.go, JSON.stringify(imp2));
    await page.evaluate(() => closeModal());

    /* ---- 8. UNDO, NOT A QUESTION ---- */
    console.log('\n8 · undo');
    const u = await page.evaluate(async () => {
      const c = getContract('MK-P1');
      c.obligations = [{ id: 'ob-u1', desc: 'Deliver the monthly report', due: '2030-01-01', party: 'ours', status: 'open' }];
      const p = obligationRemove(c, 0);
      await new Promise(r => setTimeout(r, 250));
      const asked = !!document.getElementById('cf-ok');
      await p;
      const gone = c.obligations.length === 0;
      const t = [...document.querySelectorAll('#toast-root [data-toast-act]')].pop();
      if (t) t.click();
      await new Promise(r => setTimeout(r, 100));
      const back = getContract('MK-P1').obligations.map(o => o.id);
      return { asked, gone, undo: !!t, back };
    });
    ok('8 removed at once, no question, and Undo puts it back', !u.asked && u.gone && u.undo && u.back.join() === 'ob-u1', JSON.stringify(u));

    /* ---- 9. THE RULE READ BACK ---- */
    console.log('\n9 · the rule read back');
    await page.evaluate(() => { setView('team'); });
    await page.waitForTimeout(800);
    await page.evaluate(() => openApprovalRuleEditor(-1));
    const says = await wait(page, () => /Reads as:/.test((document.getElementById('ar-says') || {}).textContent || ''))
      ? await page.evaluate(() => document.getElementById('ar-says').textContent) : null;
    ok('9a the rule reads back as a sentence', says && /approves at step 1 when/.test(says), says);
    if (says) {
      /* RE-POINTED 10 Oct 2026 (the pop-ups as drawn): "Approves in step" is a
         SELECT of the steps the rules have (drawn), not a number box, so the
         check picks a step from the list — the last one, and when the list has
         only one, it changes who approves — and asks the sentence to follow. */
      const last = await page.evaluate(() => { const s = document.getElementById('ar-order'); return s ? s.options[s.options.length - 1].value : null; });
      let s2 = '', want = null;
      if (last && last !== '1'){
        await page.selectOption('#ar-order', last);
        await wait(page, n => new RegExp('step ' + n).test((document.getElementById('ar-says') || {}).textContent || ''), last);
        s2 = await page.evaluate(() => document.getElementById('ar-says').textContent); want = new RegExp('step ' + last);
      } else {
        const other = await page.evaluate(() => { const s = document.getElementById('ar-approver'); const o = [...s.options].find(x => !x.selected); return o ? o.value : null; });
        if (other) await page.selectOption('#ar-approver', other);
        await wait(page, prev => (document.getElementById('ar-says') || {}).textContent !== prev, says);
        s2 = await page.evaluate(() => document.getElementById('ar-says').textContent); want = { test: x => x !== says };
      }
      ok('9b and follows every change', !!want && want.test(s2), s2);
    }
    await page.evaluate(() => closeModal());

    /* ---- 10. ALERTS: ONE GROUP, ONE COUNT ---- */
    console.log('\n10 · alerts');
    const al = await page.evaluate(() => {
      const rows = Array.from({ length: 5 }, (_, i) => ({ kind: 'approval', tone: 'amber', text: 'Waiting for your approval', name: 'Contract ' + i, id: 'MK-X' + i, go: () => {} }));
      {
        const d = document.createElement('div'); d.innerHTML = alertsPanelHtml(rows);
        return { groups: d.querySelectorAll('[data-al-grp]').length, count: (d.querySelector('.al-n') || {}).textContent,
          shown: [...d.querySelectorAll('[data-al-grp] > .al-row')].length, folded: d.querySelectorAll('[data-al-folded] .al-row').length,
          more: !!d.querySelector('[data-al-more]'), rows: d.querySelectorAll('[data-alert-i]').length };
      }
    });
    ok('10 five alike are one group: count 5, three shown, two behind "Show 2 more", every row still pressable',
      al.groups === 1 && al.count === '5' && al.shown === 3 && al.folded === 2 && al.more && al.rows === 5, JSON.stringify(al));

    /* ---- 11. A QUESTION THAT ENDS SOMETHING ---- */
    console.log('\n11 · decline');
    await page.evaluate(() => { regDeclineAsk(getContract('MK-P1')); });
    await wait(page, () => !!document.getElementById('pd-ok'));
    const dc = await page.evaluate(() => { const b = document.getElementById('pd-ok');
      return { bg: getComputedStyle(b).backgroundColor, sign: !!document.querySelector('#prompt-overlay [role="dialog"] svg') }; });
    ok('11 Decline is a red act with a warning sign', /^rgb\((1[6-9]\d|2\d\d), /.test(dc.bg) && dc.sign, JSON.stringify(dc));
    await page.click('#pd-cancel').catch(() => {});
  } catch (e) {
    fail++; console.log('  FAIL harness — ' + e.message);
  }
  ok('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close();
  await h.stop();
  process.exit(fail ? 1 : 0);
})();
