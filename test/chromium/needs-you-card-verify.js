/* NEEDS YOU — ONE READING, ON THE COUNTER, measured in a real browser.
 *
 * The owner picked "Jambo's note" by name on 15 Oct 2026 (Needs you back as
 * its own card), and on 18 Oct 2026 said yes to round 17 as drawn: Needs you
 * LEAVES THE BOARD — it lives on Home (once the Counter) — and Jambo's
 * Board greeting says where. RE-POINTED that day from the Board's card to the
 * Counter, its one reading unchanged (hbNeedsList over needsYouOf).
 *
 * WHAT THIS DRIVES, where the user looks:
 *   0. the Board draws no Needs you card;
 *   1. the Counter lists what is owed, its number the checklist's own reading
 *      over the book (needsYouOf) with Jambo's work and the company's row;
 *   2. Jambo on the Board says it: "What needs you is on Home: N
 *      things", N the Counter's own number, his tab the same, and "what needs
 *      me" under it;
 *   4. a colleague's look waits on the Counter after the urgent renewal
 *      (urgent first, then oldest — the owner kept that order, 18 Oct 2026);
 *      beside its paper, Needs you here answers it with its own Done
 *      (needsYouGo → lookDone), and every count goes one down;
 *   5. a row's button is the checklist's own door (details → Fill in);
 *   6. the word "needs me" opens Home and LANDS on Needs you (landOn), lit;
 *   (PASS 3, 18 Oct 2026: the owner's answer 14 keeps Jambo's work ON the
 *   Board — only Needs you left it; the Counter is named Home.)
 *   7. nothing is waiting → the Counter says so, Jambo says so, his tab is
 *      quiet;
 *   8. none of it costs a model.
 *
 * RE-POINTED 22 Oct 2026 (Round A, the one desk): Needs you is ONE reading
 * (ndRead) — Jambo's prepared pieces and your move. A thing Jambo prepared
 * for (the urgent renewal's memo) is HIS row, first while late; Home draws
 * three of each group; the whole of it stands on the Board under Your book.
 *
 * Every driven half is guarded, so a missing feature REPORTS rather than
 * times out (the house rule). Run at the owner's shortest screen. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'needs-you-card');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
function mk(id, name, cp, folder, value, status, extra) {
  return { id, name, counterparty: cp, folder, value, valueType: 'standard', status, template: 'RM',
    lastAction: '10 Jul 2026', expiry: '2027-06-30', hash: null, signedAt: null,
    fields: { value: String(value) }, metadata: { value, currency: 'KES' },
    comments: [], audit: [], signatures: [], obligations: [], rounds: [], ...extra };
}
/* Two renewals the reader owns (one urgent, inside the soon window), and the
   fixtures' details still to fill — more than three things, so "All N"
   has something to show. Day-relative: no answer depends on the day. */
const CONTRACTS = [
  mk('MK-W1', 'Packaging Supply', 'Kenya Cartons', 'proc', 12000000, 'Signed', { expiry: day(40) }),
  mk('MK-W2', 'Fleet Servicing', 'Coast Motors', 'proc', 6000000, 'Signed', { expiry: day(12) }),
  ...FIXTURES,
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const ctx = await browser.newContext({ viewport: { width: 1536, height: 730 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message));
    const aiCalls = [];
    await page.route('**/api/ai/**', r => {
      const u = r.request().url();
      if (!/\/api\/ai\/(usage|config|spend)\b/.test(u)) aiCalls.push(u);
      return r.continue();
    });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    await page.evaluate(() => { hbS().face = 'board'; hbSave(); setView('dashboard'); });
    const landed = await until(page, () => document.querySelectorAll('#hb-board .hb-fig').length === 5);
    ok('0 Home lands on the Board', landed);
    ok('0b the Board draws no Needs you card', await page.evaluate(() => !document.querySelector('#hb-board #hb-needs, #hb-board .hb-ny')));

    /* ===== 1. THE COUNTER LISTS IT, COUNTING THE CHECKLIST'S OWN ===== */
    const book = await page.evaluate(() => (state.contracts || []).filter(c => c && !c.archived).reduce((a, c) => a + ((typeof needsYouOf === 'function') ? needsYouOf(c).length : 0), 0));
    await page.evaluate(() => setView('counter'));
    const drawn = await until(page, () => !!document.querySelector('#cn-needs [data-cn-need]'));
    const one = await page.evaluate(() => ({ rows: document.querySelectorAll('#cn-needs [data-cn-need]').length, list: hbNeedsList().length, n: counterNeedsCount(),
      mine: ndRead().you.filter(r => r.y && r.y.k === 'c').length, all: ndRead().n,
      shown: window.CN_ROWS, cnt: Number((document.querySelector('#cn-needs .cn-cnt') || {}).textContent || 0) }));
    ok('1a the Counter lists what is owed', drawn && one.rows > 0, JSON.stringify(one));
    /* RE-POINTED AT THE INTEGRATION (19 Oct 2026): Home draws CN_ROWS rows
       (3, round 23 as drawn by lane G — "Show 3 more · …" holds the rest),
       not seven; the number is still the Counter's and the list the book's */
    ok('1b its rows are the checklist\'s own reading over the book (what Jambo prepared for is his row), its number the one reading\'s', book >= 4 && one.list === book && one.cnt === one.n && one.n === one.all && typeof one.shown === 'number' && one.rows === Math.min(one.mine, one.shown), JSON.stringify({ book, ...one }));
    await page.screenshot({ path: path.join(OUT, '1-counter.png') });

    /* ===== 2. JAMBO ON THE BOARD SAYS WHERE IT IS ===== */
    await page.evaluate(() => { hbS().face = 'board'; hbSave(); setView('dashboard'); });
    /* RE-POINTED 24 Oct 2026 (ONE WINDOW WHERE THERE IS NOTHING ELSE TO SHOW, pdSolo): on the Board his
       panel is the conversation under its one tab "Jambo", which carries no number; the Counter's number
       is said in his words (2b) */
    const said = await until(page, () => {
      const t = document.querySelector('#ig-dock [data-pd-tab="copilot"]');
      return !!(t && document.querySelectorAll('#ig-dock .hb-jb-hello').length > 1);
    });
    const two = await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock .hb-jb-hello')];
      return { tab: ((document.querySelector('#ig-dock [data-pd-tab="copilot"] .pd-tab-n') || {}).textContent || ''),
        where: b[1] ? b[1].querySelector('.ai-bub').textContent.replace(/\s+/g, ' ').trim() : '',
        chip: b[1] ? ((b[1].querySelector('[data-igsug]') || {}).textContent || '').trim() : '' }; });
    ok('2a his one tab carries no number of its own (the number is in his words)', said && two.tab === '' && new RegExp(`: ${one.n} things`).test(two.where), JSON.stringify(two));
    /* the Counter is named Home since 18 Oct 2026 (main's own rename; code keeps "counter") */
    ok('2b he says where the owed work went', new RegExp(`^What needs you is on Home: ${one.n} things`).test(two.where), two.where);
    ok('2c "what needs me" stands under it', two.chip === 'what needs me', two.chip);

    /* ===== 4. A COLLEAGUE'S LOOK: AFTER WHAT CANNOT WAIT, ANSWERED BY ITS OWN DONE ===== */
    const asked = await page.evaluate(() => {
      const me = currentUser(); const c = state.contracts.find(x => x.id === 'MK-W1');
      if (!c || typeof askOpen !== 'function') return 'no ask writer';
      askOpen(c, { kind: 'look', of: c.id, by: { id: 'u-colleague', name: 'Wanjiru Kamau' },
        to: { id: String(me.id), name: me.name, email: me.email },
        /* asked two hours ago: a look turns urgent after SA_REMIND_WORKDAYS
           working days, so "3 days ago" made the order depend on the weekday
           (red Tuesday to Saturday) — a few hours is never late, any day */
        at: new Date(Date.now() - 2 * 36e5).toISOString(), note: 'Please look at the notice clause' });
      persist(c); return 'ok';
    });
    await page.evaluate(() => setView('counter'));
    const looked = asked === 'ok' && await until(page, () => !!document.querySelector('#cn-needs [data-cn-need="look"]'));
    const four = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#cn-needs [data-cn-need]')].map(b => ({ kind: b.getAttribute('data-cn-need'), id: b.getAttribute('data-cn-id') }));
      const D = ndRead();
      return { rows: rows.slice(0, 3), n: counterNeedsCount(), jambo0: D.jambo[0] ? { kind: D.jambo[0].it.kind, id: D.jambo[0].it.cid || (D.jambo[0].it.c && D.jambo[0].it.c.id), late: D.jambo[0].late } : null }; });
    ok('4a the look is on the Counter', looked, asked);
    const r0 = four.rows[0] || {};
    /* RE-POINTED 22 Oct 2026 (Round A): the urgent renewal is Jambo's memo, first of his group while late; the look leads your move */
    ok('4b the urgent renewal stays first: Jambo\'s memo for it leads his group, late', !!four.jambo0 && four.jambo0.kind === 'renewal' && four.jambo0.id === 'MK-W2' && four.jambo0.late === 1, JSON.stringify(four));
    ok('4c the look, having waited longest, leads your move', r0.kind === 'look' && r0.id === 'MK-W1', JSON.stringify(four.rows));
    if (looked){
      /* beside its paper the look's own button is Done (needsYouGo → lookDone) */
      await page.evaluate(() => pdOpenOnHome('MK-W1', 'copilot'));
      await until(page, () => !!document.querySelector('#pd-needs [data-pd-nd="look"]'), null, 10000);
      if (await page.$('#pd-needs [data-pd-nd="look"]')) await page.click('#pd-needs [data-pd-nd="look"]');
      await until(page, n => counterNeedsCount() === n - 1, four.n);
    }
    const after = await page.evaluate(() => ({ n: counterNeedsCount(),
      answered: (() => { const c = state.contracts.find(x => x.id === 'MK-W1'); return (c.asks || []).filter(a => a.kind === 'look' && a.state !== 'open').length; })() }));
    ok('4d Done answers it, and the Counter counts one less', after.n === four.n - 1 && after.answered === 1, JSON.stringify(after));

    /* ===== 5. A BUTTON IS THE CHECKLIST'S OWN DOOR ===== */
    await page.evaluate(() => setView('counter'));
    await until(page, () => !!document.querySelector('#cn-needs [data-cn-need]'));
    const det = await page.$('#cn-needs [data-cn-need="details"]');
    if (det) await det.click();
    /* RE-POINTED 20 Oct 2026 (the Legora way): it lands on the paper's Still owed grid, a row in the hand */
    const filled = det && await until(page, () => { const a = document.activeElement; return !!document.querySelector('#ig-dock #pd-og') && !!(a && a.closest && a.closest('#pd-og')); });
    ok('5a "details to fill" lands on Still owed\'s grid beside the paper', !!filled);
    await page.screenshot({ path: path.join(OUT, '5-fill.png') });

    /* ===== 6. "needs me" OPENS THE COUNTER ===== */
    await page.evaluate(() => { if (typeof intelAsk === 'function') intelAsk('needs me'); });
    const back = await until(page, () => state.view === 'counter' && !!document.querySelector('#cn-needs.is-landed [data-cn-need]'));
    ok('6a the word opens Home and LANDS on Needs you — in view, lit (landOn)', back, await page.evaluate(() => state.view + ' ' + ((document.getElementById('cn-needs') || {}).className || '')));

    /* ===== 7. NOTHING WAITING IS SAID, AND THE TAB IS QUIET ===== */
    await page.evaluate(() => { window.__ny = window.needsYouOf; window.needsYouOf = () => []; window.__ag = window.hbAgentsData; window.hbAgentsData = () => ({ ready: 0, rows: [], done: [] }); window.__cn = window.counterNeedsCount; window.counterNeedsCount = () => 0;
      hbS().face = 'board'; hbSave(); setView('dashboard'); });
    const quiet = await until(page, () => !document.querySelector('#ig-dock [data-pd-tab="copilot"] .pd-tab-n') && !!document.querySelector('#ig-dock .hb-jb-hello'));
    const seven = await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock .hb-jb-hello')];
      return { where: b[1] ? b[1].querySelector('.ai-bub').textContent.trim() : '', chip: b[1] ? !!b[1].querySelector('[data-igsug]') : true, n: counterNeedsCount() }; });
    ok('7a nothing waiting: Jambo says so, no chip, no count on his tab', quiet && seven.where === 'Nothing needs you on Home.' && !seven.chip, JSON.stringify(seven));
    await page.screenshot({ path: path.join(OUT, '7-empty.png') });
    await page.evaluate(() => { window.needsYouOf = window.__ny; window.hbAgentsData = window.__ag; window.counterNeedsCount = window.__cn; });

    ok('8 the Counter and his greeting called no AI route', aiCalls.length === 0, aiCalls.slice(0, 3).join(' | ') || 'none');
    ok('9 no page errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close();
    if (h.stop) await h.stop();
  }
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})();
