/* NEEDS YOU — JAMBO'S NOTE, measured in a real browser.
 *
 * The owner picked "Jambo's note" by name on 15 Oct 2026, off the "Needs you"
 * options page, and so REVERSED the 4 Oct ruling "Remove waiting on you from
 * the home page permanently": the Contracts page's checklist had gone with
 * step 7, and with it the one book-wide list of what is owed by name.
 *
 * WHAT THIS DRIVES, where the user looks:
 *   1. the card is on the Board, first above Jambo's work (which still draws
 *      none of it), and its number is the checklist's own reading over the
 *      book (needsYouOf) — so the card cannot disagree with the side panel,
 *      the bell or the phone;
 *   2. Jambo says it too: his greeting names the count and the oldest, his
 *      tab carries the same number, and "What needs me?" leads his chips;
 *   3. "All N" shows every item, and pressed again folds back (the rule);
 *   4. a colleague's look has waited longest: Jambo's sentence names it, the
 *      urgent renewal stays first on the card (urgent first, then oldest —
 *      hbNeedsList; the owner, 18 Oct 2026: "Keep the urgent renewal first and
 *      update the check"), the look comes next, and its own Done answers it —
 *      the card, the tab and the greeting all count one less;
 *   5. a button opens the checklist's own door (details → Fill in);
 *   6. the word "needs me", typed on the paper, brings the Board and the
 *      whole list back;
 *   7. nothing is waiting → "Nothing is waiting on you", said in the card and
 *      by Jambo, with no count on his tab;
 *   8. the board costs no model.
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
    await page.evaluate(() => setView('dashboard'));
    const landed = await until(page, () => document.querySelectorAll('#hb-board .hb-fig').length === 5);
    ok('0 Home lands on the Board', landed);

    /* ===== 1. THE CARD, FIRST ABOVE JAMBO'S WORK, COUNTING THE CHECKLIST'S OWN ===== */
    const drawn = await until(page, () => !!document.querySelector('#hb-needs .hb-pill'));
    const one = await page.evaluate(() => {
      const card = document.getElementById('hb-needs'), work = document.getElementById('hm-agents');
      const book = (state.contracts || []).filter(c => c && !c.archived).reduce((a, c) => a + ((typeof needsYouOf === 'function') ? needsYouOf(c).length : 0), 0);
      return { card: !!card, book,
        n: card ? Number((card.querySelector('.hb-pill') || {}).textContent) : null,
        pills: card ? card.querySelectorAll('.hb-ny-go').length : 0,
        all: card ? ((card.querySelector('[data-hb-ny-all]') || {}).textContent || '').trim() : '',
        above: !!(card && work && (card.compareDocumentPosition(work) & Node.DOCUMENT_POSITION_FOLLOWING)),
        workRows: work ? work.querySelectorAll('[data-hb-ny], .hb-ny-p').length : 0 };
    });
    ok('1a the card is drawn on the Board', drawn && one.card);
    ok('1b its number is the checklist\'s own reading over the book', one.book >= 4 && one.n === one.book, JSON.stringify(one));
    ok('1c the top three are buttons, the rest behind "All N"', one.pills === 3 && one.all === `All ${one.book} ›`, JSON.stringify(one));
    ok('1d it stands first, above Jambo\'s work', one.above, JSON.stringify(one));
    ok('1e Jambo\'s work still draws none of it', one.workRows === 0, String(one.workRows));
    await page.screenshot({ path: path.join(OUT, '1-board.png') });

    /* ===== 2. JAMBO SAYS IT TOO ===== */
    const said = await until(page, n => {
      const t = document.querySelector('#ig-dock [data-pd-tab="copilot"] .pd-tab-n');
      return !!(t && Number(t.textContent) === n && document.querySelector('#ig-dock .hb-ny-hello'));
    }, one.book);
    const two = await page.evaluate(() => ({
      tab: ((document.querySelector('#ig-dock [data-pd-tab="copilot"] .pd-tab-n') || {}).textContent || ''),
      hello: ((document.querySelector('#ig-dock .hb-ny-hello') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
      chip: ((document.querySelector('#ig-dock [data-igsug]') || {}).textContent || '').trim() }));
    ok('2a his tab carries the same number', said && Number(two.tab) === one.book, JSON.stringify(two));
    ok('2b his greeting says how many, and the word that brings them back',
      new RegExp(`${one.book} things need you`).test(two.hello) && /needs me/.test(two.hello), two.hello);
    ok('2c "What needs me?" leads his chips', two.chip === 'What needs me?', two.chip);

    /* ===== 3. ALL N, AND PRESSED AGAIN IT FOLDS ===== */
    let three = { open: -1, shut: -1 };
    if (await page.$('#hb-needs [data-hb-ny-all]')) {
      await page.click('#hb-needs [data-hb-ny-all]');
      await until(page, () => document.querySelectorAll('#hb-needs .hb-ny-go').length > 3);
      three.open = await page.evaluate(() => document.querySelectorAll('#hb-needs .hb-ny-go').length);
      await page.click('#hb-needs [data-hb-ny-all]');
      await until(page, () => document.querySelectorAll('#hb-needs .hb-ny-go').length === 3);
      three.shut = await page.evaluate(() => document.querySelectorAll('#hb-needs .hb-ny-go').length);
    }
    ok('3a "All N" shows every item', three.open === one.book, JSON.stringify(three));
    ok('3b and pressed again folds back to three', three.shut === 3, JSON.stringify(three));

    /* ===== 4. A COLLEAGUE'S LOOK: WAITED LONGEST, NAMED IN THE SENTENCE, NEXT AFTER
       WHAT CANNOT WAIT, ANSWERED BY ITS OWN DONE =====
       The card is urgent first, then oldest (hbNeedsList, 15 Oct 2026). This
       step used to want the look first, ahead of the urgent renewal; the owner
       kept the card's order (18 Oct 2026). */
    const asked = await page.evaluate(() => {
      const me = currentUser(); const c = state.contracts.find(x => x.id === 'MK-W1');
      if (!c || typeof askOpen !== 'function') return 'no ask writer';
      askOpen(c, { kind: 'look', of: c.id, by: { id: 'u-colleague', name: 'Wanjiru Kamau' },
        to: { id: String(me.id), name: me.name, email: me.email },
        at: new Date(Date.now() - 3 * 864e5).toISOString(), note: 'Please look at the notice clause' });
      persist(c); hbPaintBoard(); return 'ok';
    });
    const looked = asked === 'ok' && await until(page, () => !!document.querySelector('#hb-needs [data-hb-ny-done]'));
    const four = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#hb-needs .hb-ny-go')].map(b => ({ kind: b.getAttribute('data-hb-ny'), id: b.getAttribute('data-hb-ny-id'),
        hot: !!(b.closest('.hb-ny-p') && b.closest('.hb-ny-p').classList.contains('is-hot')) }));
      return { first: rows[0] ? rows[0].kind : '', rows: rows.slice(0, 3),
        say: ((document.querySelector('#hb-needs .hb-ny-say') || {}).textContent || '').replace(/\s+/g, ' '),
        n: Number((document.querySelector('#hb-needs .hb-pill') || {}).textContent) }; });
    ok('4a the look is on the card, with its own Done', looked, asked);
    const r0 = four.rows[0] || {}, r1 = four.rows[1] || {};
    ok('4b the urgent renewal stays first on the card', r0.kind === 'renewal' && r0.id === 'MK-W2' && r0.hot, JSON.stringify(four.rows));
    ok('4c the look, having waited longest, comes next and is named in the sentence', r1.kind === 'look' && r1.id === 'MK-W1'
      && /cannot wait\. Waiting longest: .* on MK-W1, 3 days/.test(four.say), JSON.stringify(four));
    if (looked) {
      await page.click('#hb-needs [data-hb-ny-done]');
      await until(page, n => Number((document.querySelector('#hb-needs .hb-pill') || {}).textContent) === n - 1
        && Number((document.querySelector('#ig-dock [data-pd-tab="copilot"] .pd-tab-n') || {}).textContent) === n - 1, four.n);
    }
    const after = await page.evaluate(() => ({
      card: Number((document.querySelector('#hb-needs .hb-pill') || {}).textContent),
      tab: Number((document.querySelector('#ig-dock [data-pd-tab="copilot"] .pd-tab-n') || {}).textContent),
      done: !document.querySelector('#hb-needs [data-hb-ny-done]'),
      answered: (() => { const c = state.contracts.find(x => x.id === 'MK-W1'); return (c.asks || []).filter(a => a.kind === 'look' && a.state !== 'open').length; })() }));
    ok('4d Done answers it: the card and the tab both count one less', after.card === four.n - 1 && after.tab === four.n - 1 && after.done && after.answered === 1, JSON.stringify(after));

    /* ===== 5. A BUTTON IS THE CHECKLIST'S OWN DOOR ===== */
    const det = await page.$('#hb-needs [data-hb-ny="details"]');
    if (det) await det.click();
    const filled = det && await until(page, () => typeof pdFillShows === 'function' && pdFillShows());
    ok('5a "details to fill" opens Fill in beside the paper', !!filled);
    await page.screenshot({ path: path.join(OUT, '5-fill.png') });

    /* ===== 6. "needs me" BRINGS THE BOARD AND THE WHOLE LIST BACK ===== */
    await page.evaluate(() => { const i = document.getElementById('igd-input'); if (i) { i.value = 'needs me'; } if (typeof intelAsk === 'function') intelAsk('needs me'); });
    const back = await until(page, () => hbS().face === 'board' && document.querySelectorAll('#hb-needs .hb-ny-go').length > 3);
    ok('6a the word brings the Board up, every item shown', back,
      await page.evaluate(() => `${hbS().face} · ${document.querySelectorAll('#hb-needs .hb-ny-go').length}`));

    /* ===== 7. NOTHING WAITING IS SAID, AND THE TAB IS QUIET ===== */
    await page.evaluate(() => { window.__ny = window.needsYouOf; window.needsYouOf = () => []; hbPaintBoard(); });
    const quiet = await until(page, () => !!document.querySelector('#hb-needs.is-empty') && !document.querySelector('#ig-dock [data-pd-tab="copilot"] .pd-tab-n'));
    const seven = await page.evaluate(() => ({
      card: ((document.querySelector('#hb-needs') || {}).textContent || '').trim(),
      hello: ((document.querySelector('#ig-dock .hb-ny-hello') || {}).textContent || '').replace(/\s+/g, ' ').trim() }));
    ok('7a "Nothing is waiting on you" in the card, and no count on his tab', quiet && /^Nothing is waiting on you/.test(seven.card), JSON.stringify(seven));
    ok('7b and Jambo says so', /Nothing is waiting on you\.$/.test(seven.hello), seven.hello);
    await page.screenshot({ path: path.join(OUT, '7-empty.png') });
    await page.evaluate(() => { window.needsYouOf = window.__ny; hbPaintBoard(); });

    ok('8 the card and its greeting called no AI route', aiCalls.length === 0, aiCalls.slice(0, 3).join(' | ') || 'none');
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
