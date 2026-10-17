/* PRIVATE STREAMS — where the reader looks
   ==========================================
   Owner picked "Stream page — the SAP way", 17 Oct 2026 (piece 2 of the
   sensitive-contracts plan; decision 1: admins see a private stream only if
   named). f695 asks the server, which is the wall. This file asks the
   reader's questions in a real browser:
     · the folder list: every row is a door to its folder's own page, a
       private one carries a lock and how many are named
     · the page: three facts, Access and People, the choice, the named list,
       "Add yourself"; nobody named is refused in the drawer's foot
     · saved, the admin's own book loses the folder's contracts at once
     · the named person's drawer says so, with a door back; the folder is
       not on their tick list
     · the admin names themself: the named person's bell says so, and the
       press lands on that folder's contracts
     · the named person's figures add nothing of it, while its own amount
       still reads on its own
   Photographed at the owner's three screens; the Save must be on screen at
   the shortest.

   Run: node test/chromium/private-streams-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'private-streams');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0, passes = 0;
const check = (ok, what, detail) => {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail ? ' — ' + detail : ''));
  if (ok) passes++; else failures++;
};
/* A WAIT ASKS FOR THE STATE, BOUNDED — never a fixed pause */
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};
/* painted, not merely present: the middle of the element is the element */
const visible = (page, sel) => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height || r.bottom > innerHeight || r.right > innerWidth) return false;
  const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!at && (at === el || el.contains(at));
}, sel);

let BASE;
async function login(browser, email, pass) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await until(page, () => !!(window.currentUser && window.currentUser() && Array.isArray(window.state.contracts) && window.state.contracts.length), null, 15000);
  return { ctx, page, errors };
}
const book = page => page.evaluate(() => state.contracts.map(c => c.id).sort().join(','));

(async () => {
  const h = await startHati();
  BASE = h.base;
  const W = await seedWorkspace(h);
  const RID = W.users.restricted.id;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    /* ============ 1. THE FOLDER LIST: A DOOR ON EVERY ROW ============ */
    const A = await login(browser, 'admin@example.co.ke', 'adminpassword1');
    await A.page.evaluate(() => openSettingsAt('company', 'folders'));
    const listUp = await until(A.page, () => document.querySelectorAll('#st-folder-list .st-frow .st-fopen').length >= 6);
    check(listUp, '1a every folder row carries its door');
    const name = await A.page.evaluate(() => FOLDERS.sales.name);
    const wraps = await A.page.evaluate(() => { const n = document.querySelector('[data-st-folder="proc"] .st-fname'); const r = n.getBoundingClientRect(); return Math.round(r.height); });
    check(wraps < 30, '1b a long folder name sits on one line now', wraps + 'px');
    await A.page.click('[data-st-folder="sales"] .st-fopen');
    const pageUp = await until(A.page, () => !!document.getElementById('st-ps'));
    check(pageUp, '1c the door opens the folder\'s own page');
    const head = await A.page.evaluate(() => ({ title: (document.querySelector('#st-dhead .rvd-title') || {}).textContent || '',
      back: (document.querySelector('#st-dhead .st-dback') || {}).textContent || '',
      facts: document.querySelectorAll('.st-ps-facts > div').length,
      tabs: [...document.querySelectorAll('.st-ps-tab')].map(t => t.textContent.trim()) }));
    /* Keeping joined between them for an admin (17 Oct 2026, "Keeping on each stream — the SAP way") */
    check(head.title.includes(name) && /‹/.test(head.back) && head.facts === 3 && head.tabs.length === 3
      && head.tabs[0] === 'Access' && head.tabs[1] === 'Keeping' && /^People/.test(head.tabs[2]),
      '1d its name, the way back, three facts and three tabs: Access · Keeping · People', JSON.stringify(head));

    /* ============ 2. THE CHOICE, THE LIST, THE REFUSAL ============ */
    await A.page.click('input[name="st-ps-on"][value="1"]');
    await A.page.click('#st-dsave');
    const refused = await until(A.page, () => { const r = document.getElementById('st-drawer-refusal'); return r && !r.hidden && r.textContent.trim().length > 10; });
    check(refused, '2a nobody named is refused in the drawer\'s foot, in words');
    check(await visible(A.page, '#st-drawer-refusal'), '2b and the refusal is painted, not hidden behind something');
    check(await A.page.evaluate(() => !!document.querySelector('[data-st-ps-add][data-st-ps-add="' + currentUser().id + '"]')),
      '2c the admin is offered "Add yourself" — not named by default');
    await A.page.click('[data-st-ps-adding]');
    check(await until(A.page, () => !!document.querySelector('.st-ps-pick')), '2d "Add people" unfolds the people not yet named');
    await A.page.click('[data-st-ps-adding]');
    check(await until(A.page, () => !document.querySelector('.st-ps-pick')), '2e pressed again, it closes');
    await A.page.click('[data-st-ps-adding]');
    await A.page.click(`.st-ps-pick [data-st-ps-add="${RID}"]`);
    check(await until(A.page, r => !!document.querySelector(`[data-st-ps-rm="${r}"]`), RID), '2f the person joins the named list, not saved yet');
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await A.page.setViewportSize({ width: w, height: ht });
      check(await visible(A.page, '#st-dsave'), `2g at ${w}×${ht} Save is on screen`);
      const over = await A.page.evaluate(() => { const b = document.getElementById('st-dbody'); return b ? b.scrollWidth - b.clientWidth : -1; });
      check(over <= 0, `2h at ${w}×${ht} nothing runs off the drawer's side`, over + 'px');
      await A.page.screenshot({ path: path.join(OUT, `1-page-${w}x${ht}.png`) });
    }
    await A.page.setViewportSize({ width: 1440, height: 780 });

    /* ============ 3. SAVED: THE ADMIN'S OWN BOOK LOSES IT AT ONCE ============ */
    const before = await book(A.page);
    await A.page.click('#st-dsave');
    const back = await until(A.page, () => !!document.getElementById('st-folder-list') && !document.getElementById('st-ps'));
    check(back, '3a Save lands back on the folder list');
    check(await until(A.page, () => !state.contracts.some(c => c.folder === 'sales')), '3b the admin\'s own book no longer holds the folder\'s contracts',
      before + ' → ' + await book(A.page));
    const row = await A.page.evaluate(() => (document.querySelector('[data-st-folder="sales"] .st-fmeta') || {}).textContent || '');
    const hasLock = await A.page.evaluate(() => !!document.querySelector('[data-st-folder="sales"] .st-ps-lock'));
    check(hasLock && /1/.test(row) && /2/.test(row), '3c the row: a lock, how many are named, and the server\'s count of its contracts', row.trim());
    await A.page.screenshot({ path: path.join(OUT, '2-list-private.png') });

    /* ============ 4. THE NAMED PERSON'S DRAWER SAYS SO ============ */
    await A.page.evaluate(r => stDrawerOpen('person:' + r), RID);
    await until(A.page, () => !!document.querySelector('.st-ps-mine'));
    const mine = await A.page.evaluate(() => ({ line: (document.querySelector('.st-ps-mine') || {}).textContent || '',
      door: !!document.querySelector('.st-ps-mine [data-st-panel="stream:sales"]'),
      tick: !!document.querySelector('[data-tm-folder="sales"]') }));
    check(mine.line.includes(name) && mine.door && !mine.tick, '4a their drawer names the folder, with a door back, and it is not on their tick list', JSON.stringify(mine));

    /* ============ 5. THE ADMIN NAMES THEMSELF: THE NAMED PERSON IS TOLD ============ */
    await A.page.evaluate(() => stDrawerOpen('stream:sales'));
    await until(A.page, () => !!document.getElementById('st-ps'));
    await A.page.evaluate(() => document.querySelector(`[data-st-ps-add="${currentUser().id}"]`).click());
    await A.page.click('#st-dsave');
    await until(A.page, () => state.contracts.some(c => c.folder === 'sales'));
    check(await A.page.evaluate(() => state.contracts.some(c => c.folder === 'sales')), '5a named now, the admin\'s book holds the folder again');
    check(A.errors.length === 0, '5b no page errors for the admin', A.errors.join(' | ') || 'clean');
    await A.ctx.close();

    const R = await login(browser, 'restricted@example.co.ke', 'their-own-pass-9');
    check((await book(R.page)).includes('MK-B1'), '5c the named person reads the folder\'s contracts — naming is the grant');
    await R.page.evaluate(() => openPanel('alerts'));
    await until(R.page, () => !!document.querySelector('[data-alert-i]'));
    const lineText = await R.page.evaluate(n => { const el = [...document.querySelectorAll('[data-alert-i]')].find(x => x.textContent.includes(n)); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }, name);
    check(/Amina Otieno/.test(lineText), '5d their bell says the admin added themself', lineText.slice(0, 120));
    await R.page.screenshot({ path: path.join(OUT, '3-bell.png') });
    await R.page.evaluate(n => [...document.querySelectorAll('[data-alert-i]')].find(x => x.textContent.includes(n)).click(), name);
    const landed = await until(R.page, () => state.view === 'register' || !!document.getElementById('ct-place'));
    const filter = await R.page.evaluate(() => (window.regState ? regState().type : null));
    check(landed && filter === 'sales', '5e the press lands on that folder\'s contracts', String(filter));
    const gone = await R.page.evaluate(() => (currentUser().streamNews || []).length);
    check(gone === 0, '5f and the line is pressed away');

    /* ============ 6. ITS MONEY ADDS NOTHING, ITS OWN AMOUNT STILL READS ============ */
    /* the Board's headline value over the whole book: proc only (48M + 36M) */
    const money = await R.page.evaluate(() => { const c = getContract('MK-B1');
      return { board: hbBookData('all', { whole: true }).figs.value.v, report: fxHomeValue(c), own: fxHome(c).v, print: fmtMoneyOf(c) }; });
    check(money.board === 84000000 && money.report === 0, '6a the Board and every report add nothing of it', JSON.stringify(money));
    check(money.own === 85000000 && /85/.test(money.print.replace(/[^0-9]/g, '')), '6b its own page still states its amount', money.print);
    /* ============ 7. WHO OPENED IT, IN ITS OWN TRAIL (owner picked "In the trail") ============ */
    await R.page.evaluate(() => hbStripBring('MK-B1', 'hist'));
    const trail = await until(R.page, () => !!document.querySelector('.hist-trail .hist-ev.is-open'), null, 15000);
    check(trail, '7a the contract\'s History draws its opens');
    const t7 = await R.page.evaluate(() => ({ cap: (document.querySelector('.hist-cap') || {}).textContent || '',
      eye: !!document.querySelector('.hist-ev.is-open .hist-dot.is-eye svg'),
      named: [...document.querySelectorAll('.hist-ev')].some(e => /Added themself to/.test(e.textContent)),
      who: [...document.querySelectorAll('.hist-ev.is-open .hist-who')].map(x => x.textContent.trim()) }));
    check(t7.eye && /open/i.test(t7.cap), '7b each open wears the eye, and the head counts the opens', t7.cap.trim());
    check(t7.named && t7.who.some(w => /Restricted Legal/.test(w)), '7c the folder\'s own record is in the trail: the admin adding themself, and who opened it', JSON.stringify(t7.who));
    await R.page.evaluate(() => document.querySelector('.hist-head').scrollIntoView({ block: 'start' }));
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await R.page.setViewportSize({ width: w, height: ht });
      await R.page.screenshot({ path: path.join(OUT, `4-trail-${w}x${ht}.png`) });
    }
    await R.page.setViewportSize({ width: 1440, height: 780 });
    await R.page.click('#hist-filter-btn');
    const listed = await until(R.page, () => !!document.querySelector('[data-ht-filter="opens"]'));
    check(listed, '7d the Filter offers Opens on a contract that has them');
    await R.page.selectOption('[data-ht-filter="opens"]', 'only');
    const only = await until(R.page, () => { const all = document.querySelectorAll('.hist-ev'), op = document.querySelectorAll('.hist-ev.is-open'); return all.length && all.length === op.length; });
    check(only, '7e "Only opens" leaves only the opens');
    await R.page.selectOption('[data-ht-filter="opens"]', 'hide');
    check(await until(R.page, () => document.querySelectorAll('.hist-ev').length && !document.querySelector('.hist-ev.is-open')), '7f "Hide them" takes them away');
    await R.page.evaluate(() => hbStripBring('MK-A1', 'hist'));
    await until(R.page, () => { const h = document.querySelector('.hist-head'); return h && /Refined Sugar|MK-A1/.test((h.closest('[data-bs-id]') || document.body).textContent); });
    const notListed = await R.page.evaluate(() => { const b = [...document.querySelectorAll('#hist-filters')].pop(); return !(b && b.querySelector('[data-ht-filter="opens"]')); });
    check(notListed, '7g a contract in an ordinary folder lists no Opens choice — a choice with nothing behind it is not offered');
    check(R.errors.length === 0, '6c no page errors for the named person', R.errors.join(' | ') || 'clean');
    await R.ctx.close();
  } catch (e) {
    console.error(e); failures++;
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${passes}/${passes + failures} passed`);
  process.exit(failures ? 1 : 0);
})();
