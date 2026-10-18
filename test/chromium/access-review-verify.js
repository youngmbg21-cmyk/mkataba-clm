/* THE QUARTERLY ACCESS REVIEW — THE SHEET (owner picked "Review the sheet —
   the SAP way", 17 Oct 2026; piece 8 of the sensitive contracts and
   governance plan)

   WHAT THIS PINS, driven in a real browser (the server's claims — who may,
   the trail read, the verdicts, the stamp — are f701's)
     1 Needs your attention asks for the quarter's review, and so does the
       bell; Review opens Who holds what in review mode: "Reviewing · Q · 0 of
       3 reviewed"
     2 a column, Used in the last 90 days, read from the trail: a stream with
       no work for 200 days and a person not signed in for 130 days in amber,
       the active one "Used this week", the admin themself not reviewed
     3 Keep marks a row Kept; Change opens the person and their saved drawer
       marks the row Changed; Mark the review done is greyed with how many are
       left until everyone is decided
     4 done: an 'ok', the head says who stamped it and when, the Review column,
       the ask and the bell entry go
     5 the owner's three screens: the sheet fits
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/access-review-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
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
const daysAgo = n => new Date(Date.now() - n * 864e5).toISOString();
const qWord = () => { const d = new Date(); return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`; };

const CONTRACTS = [
  { ...H.fixtureContract('AR-1', 'Refined Sugar Supply', 'Kabras Sugar', H.FOLDER_A, 48e6, 'Signed'),
    audit: [{ at: daysAgo(200), user: 'Restricted Legal', action: 'Sent', detail: '' }, { at: daysAgo(2), user: 'Unrestricted Legal', action: 'Edited', detail: '' }],
    signatures: [{ name: 'Unrestricted Legal', email: 'everything@example.co.ke', at: daysAgo(10), party: 'first' }] },
  { ...H.fixtureContract('AR-2', 'Route-to-market distribution', 'Naivas Supermarkets', H.FOLDER_B, 12e6, 'Under Review'),
    audit: [{ at: daysAgo(150), user: 'No Values Legal', action: 'Edited', detail: '' }] },
];

(async () => {
  const h = await H.startHati();
  const W = await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const U = W.users;
  await W.admin.json('/api/users/' + U.unrestricted.id, { method: 'PATCH', body: { signCap: 5000000 } });
  /* they joined a year ago; one has not signed in for 130 days */
  const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
  try {
    db.prepare('UPDATE users SET created_at=? WHERE id IN (?,?,?)').run(daysAgo(365), U.restricted.id, U.novalues.id, U.unrestricted.id);
    db.prepare('UPDATE sessions SET created_at=?, last_seen=? WHERE user_id=?').run(daysAgo(130), daysAgo(130), U.novalues.id);
  } finally { db.close(); }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'AR-1'), null, { timeout: 20000 });

    console.log('\n1 · the ask, and the sheet in review mode');
    const ask = await until(() => {
      if (!document.getElementById('set-page') || settingsTab() !== 'company') { setView('team'); settingsGoTab('company'); return null; }
      const more = document.querySelector('#st-att [data-st-needs-all]'); if (more && more.getAttribute('aria-expanded') !== 'true') { more.click(); return null; }
      const r = document.querySelector('#st-att [data-st-need="review"]');
      return r ? { text: r.textContent.replace(/\s+/g, ' ').trim() } : null; }, null, 15000);
    check('1a Needs your attention asks for the quarter\'s review', !!ask && ask.text === `Quarterly access review · ${qWord()} 0 of 3 reviewed Review` /* two lines a row since round 25 */, ask && ask.text);
    const bell = await page.evaluate(() => (typeof buildAlerts === 'function' ? buildAlerts() : []).filter(a => a.kind === 'access-review').map(a => a.text).join(' | '));
    check('1b …and so does the bell', bell === `The quarterly access review is due · ${qWord()}`, bell);
    await shot(page, 'ar-needs');
    if (ask) await press('#st-att [data-st-need="review"] .st-need-go', '1c Review');
    const head = await until(() => { const p = document.querySelector('[data-st-pg="sheet"]'); return p ? (p.querySelector('.st-pg-t') || {}).textContent.replace(/\s+/g, ' ').trim() : null; });
    check('1c Review opens Who holds what, reviewing', head === `Who holds what Reviewing · ${qWord()} · 0 of 3 reviewed`, head);

    console.log('\n2 · used in the last 90 days, read from the trail');
    const used = await until(ids => {
      const cell = id => { const c = document.querySelector(`[data-st-ar-used="${id}"]`); if (!c) return null; const s = c.querySelector('.st-ar-used'); return { t: c.textContent.trim(), amber: !!c.querySelector('.st-amber') }; };
      const r = ids.map(cell); return r.every(x => x && x.t && x.t !== '…' && !/^\s*$/.test(x.t)) ? r : null; }, [U.unrestricted.id, U.restricted.id, U.novalues.id], 12000);
    check('2a the active one: Used this week', !!used && used[0].t === 'Used this week' && !used[0].amber, JSON.stringify(used && used[0]));
    check('2b a stream with no work for 200 days, in amber', !!used && used[1].t === 'Procurement & Raw Materials: no work in 200 days' && used[1].amber, JSON.stringify(used && used[1]));
    check('2c not signed in for 130 days, in amber', !!used && used[2].t === 'Not signed in for 130 days' && used[2].amber, JSON.stringify(used && used[2]));
    const meRow = await page.evaluate(() => { const me = currentUser(); const r = document.querySelector(`[data-st-ar-row="${me.id}"]`); return r ? r.textContent.trim() : null; });
    check('2d the admin themself is not reviewed', meRow === 'You', meRow);
    /* while reviewing the sheet carries two columns more: Keep · Change must
       sit inside the card, never cut and never off to the side */
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      const fit = await until(() => { const card = document.querySelector('.st-sheet-full'), b = [...document.querySelectorAll('[data-st-ar="change"]')].pop();
        if (!card || !b) return null; const cr = card.getBoundingClientRect(), br = b.getBoundingClientRect();
        return { inside: br.right <= cr.right + 1 && br.left >= cr.left, scroll: card.scrollWidth - card.clientWidth, page: document.documentElement.scrollWidth - innerWidth }; });
      await shot(page, `ar-sheet-${vp.width}x${vp.height}`);
      check(`2e ${vp.width}×${vp.height}: while reviewing, Keep · Change sit inside the card`, !!fit && fit.inside && fit.scroll <= 0 && fit.page <= 0, JSON.stringify(fit));
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    console.log('\n3 · keep, change, and the foot');
    await press(`[data-st-ar-row="${U.restricted.id}"] [data-st-ar="keep"]`, '3a Keep');
    const kept = await until(id => { const b = document.querySelector(`[data-st-ar-row="${id}"] [data-st-ar="keep"]`); return b && b.getAttribute('aria-pressed') === 'true' ? b.textContent.trim() : null; }, U.restricted.id);
    const foot1 = await page.evaluate(() => { const b = document.getElementById('st-ar-done'); return b ? { disabled: b.disabled, title: b.getAttribute('title') } : null; });
    check('3a Keep marks the row Kept; Mark the review done is greyed, saying 2 people left', kept === 'Kept ✓' && !!foot1 && foot1.disabled && foot1.title === '2 people left', JSON.stringify({ kept, foot1 }));
    await press(`[data-st-ar-row="${U.novalues.id}"] [data-st-ar="change"]`, '3b Change');
    const drawer = await until(() => { const d = document.getElementById('st-drawer'); return d && d.classList.contains('open') ? (document.querySelector('#st-dhead .rvd-title') || {}).textContent : null; });
    check('3b Change opens the person', drawer === 'No Values Legal', drawer);
    if (drawer) {
      await page.evaluate(() => { const t = document.getElementById('tm-title'); if (t) { t.value = 'Analyst'; t.dispatchEvent(new Event('input', { bubbles: true })); } });
      await press('#st-dsave', '3c Save');
    }
    const changed = await until(id => { const b = document.querySelector(`[data-st-ar-row="${id}"] [data-st-ar="change"]`); return b && b.getAttribute('aria-pressed') === 'true' ? b.textContent.trim() : null; }, U.novalues.id, 10000);
    check('3c …and the saved drawer marks the row Changed', changed === 'Changed ✓', changed);
    await press(`[data-st-ar-row="${U.unrestricted.id}"] [data-st-ar="keep"]`, '3d Keep the last');
    const ready = await until(() => { const b = document.getElementById('st-ar-done'); return b && !b.disabled ? (document.querySelector('.st-ar-foot') || {}).textContent.replace(/\s+/g, ' ').trim() : null; });
    check('3d everyone decided: the foot says so and the button is live', ready === 'Everyone is kept or changed. Mark the review done', ready);

    console.log('\n4 · done, stamped');
    await press('#st-ar-done', '4 Mark the review done');
    const done = await until(() => { const p = document.querySelector('[data-st-pg="sheet"]'); const t = p && (p.querySelector('.st-pg-t') || {}).textContent.replace(/\s+/g, ' ').trim();
      return t && /Reviewed/.test(t) ? { head: t, rev: document.querySelectorAll('[data-st-ar-row]').length, foot: !!document.querySelector('.st-ar-foot'), toast: (document.getElementById('toast-root') || {}).textContent || '' } : null; });
    check('4a an \'ok\' says it is stamped in the trail', !!done && /access review is done, and stamped in the trail/.test(done.toast), done && done.toast);
    check('4b the head says who stamped it; the Review column and the foot are gone', !!done && new RegExp(`^Who holds what Reviewed · ${qWord()} · .+ by Amina Otieno$`).test(done.head) && done.rev === 0 && !done.foot, JSON.stringify(done));
    const after = await page.evaluate(() => ({ ask: typeof stNeedsAll === 'function' ? stNeedsAll().some(r => r.key === 'review') : null,
      bell: (typeof buildAlerts === 'function' ? buildAlerts() : []).some(a => a.kind === 'access-review') }));
    check('4c the ask and the bell entry are gone', after.ask === false && after.bell === false, JSON.stringify(after));

    console.log('\n5 · the owner\'s three screens');
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      const fit = await page.evaluate(() => {
        const card = document.querySelector('.st-sheet-full'), tb = card && card.querySelector('table');
        return { page: document.documentElement.scrollWidth - innerWidth, table: tb && card ? Math.round(tb.getBoundingClientRect().right - card.getBoundingClientRect().right) : null };
      });
      await shot(page, `ar-done-${vp.width}x${vp.height}`);
      check(`5 ${vp.width}×${vp.height}: the sheet fits its card, no sideways scroll`, fit.page <= 0 && fit.table != null && fit.table <= 1, JSON.stringify(fit));
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
