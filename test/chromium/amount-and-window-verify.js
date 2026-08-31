/* Chromium verification: AN OBLIGATION CARRIES AN AMOUNT (J-5.2), THE THREE
   FIND-OBLIGATIONS BUGS (J-5.3), AND THE AGENDA WINDOW (J-5.4).
   ====================================================================
   WHY THIS IS A BROWSER FILE:
     · "the dialog draws every field it drew before, plus Amount" is a claim
       about PIXELS in an order, and the render this feature came from was
       drawn from intent rather than from the screen and got six fields wrong;
     · "a duplicate arrives unticked" is a rendered checkbox state, and the
       confirmation is a TOAST — which in this product prints nothing unless it
       carries a kind, so only a real toast root can say it appeared;
     · "the window changes what the list holds" has to be counted as ROWS on
       screen, never read off the control's own value;
     · a cap that says how many of how many only exists once forty rows do.

   It names f259, f260 and f261, which pin the arithmetic in node.
   Run: node test/chromium/amount-and-window-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'amount-and-window');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3000);

    const cid = await page.evaluate(async obs => {
      const c = state.contracts[0];
      c.obligations = obs;
      await persist(c);
      return c.id;
    }, [
      { id: 'ob_1', desc: 'Second tranche on commissioning', due: day(20), status: 'open', amount: 4000000, party: 'ours' },
      { id: 'ob_2', desc: 'Quarterly volume report', due: day(9), status: 'open', party: 'ours' },
      { id: 'ob_3', desc: 'Retention release', due: day(-6), status: 'open', amount: 1500000, party: 'theirs' },
      { id: 'ob_4', desc: 'Insurance certificate', due: day(-40), status: 'done', completedAt: day(-38), amount: 250000, party: 'ours' },
    ]);
    await page.waitForTimeout(1200);
    await page.evaluate(id => { openWorkspace(id); }, cid);
    await page.waitForTimeout(1600);
    await page.evaluate(id => roomGoTab(getContract(id), 'oblig'), cid);
    await page.waitForTimeout(900);
    const staged = await page.evaluate(id => (getContract(id).obligations || []).length, cid);
    check('the four staged obligations really reached the record', staged === 4, String(staged));
    await page.screenshot({ path: path.join(OUT, '01-tab.png') });

    /* ============ 1. THE AMOUNT ON THE CONTRACT'S OWN TAB ============ */
    const tab = await page.evaluate(() => {
      const amts = [...document.querySelectorAll('.obt-amt')].map(e => ({
        text: e.textContent.trim(), right: Math.round(e.getBoundingClientRect().right),
        none: e.classList.contains('is-none') }));
      const bands = [...document.querySelectorAll('.obt-band')].map(b => b.textContent.trim());
      const sums = [...document.querySelectorAll('.obt-bandsum')].map(b => b.textContent.trim());
      return { amts, bands, sums, rows: document.querySelectorAll('.obt-row').length };
    });
    check('every row carries an amount cell', tab.amts.length === tab.rows,
      `${tab.amts.length} of ${tab.rows}`);
    check('a figure is printed in the contract’s own money',
      tab.amts.some(a => /KES/.test(a.text)), JSON.stringify(tab.amts.map(a => a.text)));
    check('and one with none draws an em-dash, never an empty cell',
      tab.amts.some(a => a.none && /—|—/.test(a.text)),
      JSON.stringify(tab.amts.map(a => a.text)));
    check('the column is right-aligned — every cell ends on one vertical',
      new Set(tab.amts.map(a => a.right)).size === 1, JSON.stringify([...new Set(tab.amts.map(a => a.right))]));
    check('a band’s sum rides the heading that already carries its count',
      tab.sums.length >= 1 && tab.bands.some(b => /KES/.test(b)),
      JSON.stringify(tab.sums));

    /* ============ 2. THE DIALOG — EVERY FIELD IT DREW BEFORE ============ */
    await page.evaluate(() => { document.getElementById('obt-add').click(); });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '02-dialog.png') });
    const dlg = await page.evaluate(() => {
      const seen = id => { const e = document.getElementById(id); if (!e) return null;
        const r = e.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height) }; };
      return {
        desc: seen('of-desc'), due: seen('of-due'), recur: seen('of-recur'),
        amount: seen('of-amount'), assignee: seen('of-assignee'),
        party: document.querySelectorAll('[data-of-party]').length,
        partyWords: [...document.querySelectorAll('[data-of-party]')].map(b => b.textContent.trim()),
        save: !!document.getElementById('of-save'),
        prefix: (document.querySelector('.of-amt i') || {}).textContent,
      };
    });
    check('the description, due date and recurring are all still there',
      dlg.desc && dlg.due && dlg.recur, JSON.stringify({ d: !!dlg.desc, u: !!dlg.due, r: !!dlg.recur }));
    check('THE WHOSE-OBLIGATION TOGGLE IS STILL THERE — the render dropped it',
      dlg.party === 2, JSON.stringify(dlg.partyWords));
    check('Assign to is still there, and still called that', !!dlg.assignee);
    check('Save is still Save', dlg.save);
    check('AMOUNT is drawn, under Recurring and above the toggle',
      dlg.amount && dlg.amount.top > dlg.recur.top && dlg.amount.top < dlg.assignee.top,
      JSON.stringify({ recur: dlg.recur.top, amount: dlg.amount && dlg.amount.top }));
    check('with the contract’s own currency as a fixed prefix',
      /^[A-Z]{3}$/.test(String(dlg.prefix || '').trim()), String(dlg.prefix));

    /* THE AMOUNT DRAWS ON BOTH SIDES OF THE TOGGLE. */
    await page.evaluate(() => document.querySelector('[data-of-party="theirs"]').click());
    await page.waitForTimeout(300);
    const theirs = await page.evaluate(() => ({
      amount: !!document.getElementById('of-amount'),
      amountShown: !!(document.getElementById('of-amount') || {}).offsetParent,
      assigneeHidden: document.getElementById('of-assignee-wrap').classList.contains('hidden'),
    }));
    check('Assign to disappears when the obligation is theirs', theirs.assigneeHidden);
    check('AND THE AMOUNT DOES NOT — money they owe us matters as much',
      theirs.amount && theirs.amountShown);

    /* A figure typed on that side reaches the record. */
    await page.fill('#of-desc', 'Rebate reconciliation');
    await page.fill('#of-amount', '750000');
    await page.evaluate(() => document.getElementById('of-save').click());
    await page.waitForTimeout(900);
    const saved = await page.evaluate(id => {
      const o = (getContract(id).obligations || []).find(x => x.desc === 'Rebate reconciliation');
      return o ? { amount: o.amount, party: o.party } : null;
    }, cid);
    check('a typed figure lands on the record as a NUMBER',
      saved && saved.amount === 750000 && saved.party === 'theirs', JSON.stringify(saved));

    /* And one saved without carries no key at all. */
    await page.evaluate(() => { document.getElementById('obt-add').click(); });
    await page.waitForTimeout(500);
    await page.fill('#of-desc', 'Annual audit access');
    await page.evaluate(() => document.getElementById('of-save').click());
    await page.waitForTimeout(900);
    const blank = await page.evaluate(id => {
      const o = (getContract(id).obligations || []).find(x => x.desc === 'Annual audit access');
      return o ? { has: Object.prototype.hasOwnProperty.call(o, 'amount') } : null;
    }, cid);
    check('AND ONE SAVED WITHOUT ONE CARRIES NO amount KEY AT ALL',
      blank && blank.has === false, JSON.stringify(blank));

    /* ============ 3. THE WORKLIST: COLUMN, BAND SUMS, ONE TOTAL ======== */
    await page.evaluate(() => setView('obligations'));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '03-worklist.png') });
    const wl = await page.evaluate(() => ({
      amts: [...document.querySelectorAll('.obw-amt')].length,
      sums: [...document.querySelectorAll('.obw-bandsum')].map(e => e.textContent.trim()),
      total: (document.querySelector('.obw-total b') || {}).textContent,
      cols: [...document.querySelectorAll('.obw-table tr:not(.obw-band)')]
        .slice(0, 1).map(tr => tr.children.length)[0],
      over: (() => { const t = document.querySelector('.obw-table');
        return t ? Math.round(t.scrollWidth - t.clientWidth) : null; })(),
    }));
    check('the worklist carries the column too', wl.amts >= 1, String(wl.amts));
    check('each band states its own sum', wl.sums.length >= 1, JSON.stringify(wl.sums));
    check('and ONE total sits at the foot', !!wl.total && /\d/.test(wl.total), String(wl.total));
    check('the row has six cells and the table does not scroll sideways',
      wl.cols === 6 && (wl.over === null || wl.over <= 1), JSON.stringify(wl));

    /* ============ 4. FIND OBLIGATIONS — THE DUPLICATE IS SHOWN ========= */
    await page.evaluate(id => { openWorkspace(id); }, cid);
    await page.waitForTimeout(1000);
    await page.evaluate(id => roomGoTab(getContract(id), 'oblig'), cid);
    await page.waitForTimeout(700);
    /* The review dialog is opened with a proposal set that deliberately
       overlaps what the contract already holds — which is the shape a SECOND
       press of Find obligations produces, and the one that used to double the
       list. The scan itself is not run: it costs a model call and is not what
       this claim is about. */
    await page.evaluate(() => {
      openObligationsReview(getContract(state.activeId), [
        { desc: 'Second tranche on commissioning', quote: '…the second instalment…' },
        { desc: 'Quarterly volume report', quote: '…within thirty (30) days…' },
        { desc: 'Give 90 days notice of non-renewal', quote: '…ninety (90) days…' },
      ]);
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '04-review.png') });
    const rev = await page.evaluate(() => {
      const boxes = [...document.querySelectorAll('[data-ob-pick]')];
      return { n: boxes.length, checked: boxes.map(b => b.checked),
        reasons: [...document.querySelectorAll('.p-6 label')].map(l => l.textContent.trim()),
        button: (document.getElementById('or-add') || {}).textContent };
    });
    check('every proposal is DRAWN, including the ones already on the contract',
      rev.n === 3, String(rev.n));
    check('A DUPLICATE ARRIVES UNTICKED, and a fresh one is still ticked',
      JSON.stringify(rev.checked) === JSON.stringify([false, false, true]),
      JSON.stringify(rev.checked));
    check('and it says why, on the row it is true of',
      rev.reasons.filter(t => /already on this contract/i.test(t)).length === 2,
      JSON.stringify(rev.reasons.map(t => t.slice(0, 42))));
    check('THE BUTTON COUNTS WHAT WILL ACTUALLY BE ADDED',
      /\b1\b/.test(String(rev.button)), String(rev.button).trim());

    const beforeN = await page.evaluate(id => getContract(id).obligations.length, cid);
    await page.evaluate(() => document.getElementById('or-add').click());
    await page.waitForTimeout(900);
    const afterN = await page.evaluate(id => getContract(id).obligations.length, cid);
    check('PRESSING IT ADDS ONE, NOT THREE — the list is not doubled',
      afterN - beforeN === 1, `${beforeN} → ${afterN}`);
    const toastText = await page.evaluate(() => {
      const r = document.getElementById('toast-root');
      return r ? r.textContent.trim() : '';
    });
    check('AND THE CONFIRMATION IS NOT SILENT — it says what happened',
      /\d/.test(toastText) && /already/i.test(toastText), toastText.slice(0, 90));

    /* ============ 5. THE CALENDAR'S AGENDA WINDOW ============ */
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(OUT, '05-calendar.png') });
    const cal0 = await page.evaluate(() => {
      const sel = document.getElementById('cal-days');
      return { sel: !!sel, value: sel && sel.value,
        options: sel ? [...sel.options].map(o => ({ v: o.value, t: o.textContent.trim() })) : [],
        h5: !!document.querySelector('.cal-panel-head h5'),
        rows: document.querySelectorAll('#cal-agenda .cal-upn').length,
        count: (document.querySelector('.cal-cnt') || {}).textContent };
    });
    check('the heading IS the control, and there is no title beside it',
      cal0.sel && !cal0.h5, JSON.stringify({ sel: cal0.sel, h5: cal0.h5 }));
    check('four windows are offered, each naming its own',
      cal0.options.length === 4 && cal0.options.every(o => /14|30|60|90/.test(o.t)),
      JSON.stringify(cal0.options.map(o => o.t)));
    check('a reader who touches nothing still gets a fortnight',
      cal0.value === '14', String(cal0.value));

    await page.evaluate(() => {
      /* Four expiries, one inside the fortnight and three beyond it, so the
         window has something to include AND something to leave out. In memory:
         renderCalendar reads state.contracts directly. */
      const mk = (n, i) => { const d = new Date(); d.setDate(d.getDate() + n);
        return { id: 'WIN-' + i, name: 'Window ' + i, status: 'Signed', folder: 'proc',
          counterparty: 'Y', expiry: d.toISOString().slice(0, 10), obligations: [], audit: [] }; };
      state.contracts = state.contracts.concat([mk(5, 1), mk(25, 2), mk(50, 3), mk(80, 4)]);
      renderCalendar();
    });
    await page.waitForTimeout(600);
    const cal14 = await page.evaluate(() => document.querySelectorAll('#cal-agenda .cal-upn').length);
    check('with events staged, the fortnight holds only what falls inside it',
      cal14 >= 1, String(cal14));
    const widened = await page.evaluate(() => {
      calSetAgendaDays(90);
      return { value: (document.getElementById('cal-days') || {}).value,
        rows: document.querySelectorAll('#cal-agenda .cal-upn').length,
        count: (document.querySelector('.cal-cnt') || {}).textContent,
        empty: !!document.querySelector('#cal-agenda .cal-empty'),
        heading: (document.getElementById('cal-days') || {}).selectedOptions
          ? document.getElementById('cal-days').selectedOptions[0].textContent.trim() : '' };
    });
    await page.waitForTimeout(400);
    check('CHOOSING NINETY DAYS CHANGES WHAT THE LIST HOLDS — counted as rows',
      widened.rows > cal14, `${cal14} → ${widened.rows}`);
    check('and the heading, the count and the list all name the same window',
      /90/.test(widened.heading) && String(widened.count) === String(widened.rows || widened.count),
      JSON.stringify({ heading: widened.heading, count: widened.count, rows: widened.rows }));
    await page.screenshot({ path: path.join(OUT, '06-calendar-90.png') });

    /* THE EMPTY STATE NAMES THE WINDOW THAT IS SHOWING. */
    const emptyNames = await page.evaluate(() => {
      const keep = state.contracts;
      state.contracts = [];
      renderCalendar();
      const t = document.querySelector('#cal-agenda').textContent;
      state.contracts = keep;
      return t;
    });
    check('an empty window names THAT window, not the default',
      /90/.test(emptyNames) && !/\b14\b/.test(emptyNames), emptyNames.replace(/\s+/g, ' ').slice(0, 80));
    await page.evaluate(() => { calSetAgendaDays(14); renderCalendar(); });
    await page.waitForTimeout(500);

    /* THE CAP SAYS SO ONLY WHEN IT BITES. */
    const capped = await page.evaluate(() => {
      const before = !!document.querySelector('.cal-panel-cap');
      /* Fifty contracts expiring inside the window, so the forty-row ceiling
         is genuinely reached rather than asserted. */
      const extra = [];
      for (let i = 0; i < 50; i++) {
        const d = new Date(); d.setDate(d.getDate() + 3 + (i % 20));
        extra.push({ id: 'CAP-' + i, name: 'Cap ' + i, status: 'Signed', folder: 'proc',
          counterparty: 'X', expiry: d.toISOString().slice(0, 10), obligations: [], audit: [] });
      }
      const keep = state.contracts;
      state.contracts = keep.concat(extra);
      calSetAgendaDays(90); renderCalendar();
      const cap = (document.querySelector('.cal-panel-cap') || {}).textContent || '';
      const rows = document.querySelectorAll('#cal-agenda .cal-upn').length;
      state.contracts = keep; calSetAgendaDays(14); renderCalendar();
      return { before, cap: cap.trim(), rows };
    });
    check('below the cap it says NOTHING — a caveat always there is unread',
      capped.before === false);
    check('AND PAST FORTY IT SAYS HOW MANY OF HOW MANY',
      /40/.test(capped.cap) && /\d{2,}/.test(capped.cap) && capped.rows === 40,
      `${capped.rows} rows · "${capped.cap}"`);

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run completed', false, String(e).slice(0, 220));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
