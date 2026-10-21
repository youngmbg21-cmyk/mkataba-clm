/* HISTORY, "TWO SIDES" (round 12 of the redesign: the owner picked "Two
   sides" by name and said yes to the admin's door to the whole trail, 17 Oct
   2026; js/views/contract.js histLaneOf, roomHistoryHtml)

   WHAT THIS PINS, driven in a real browser on the strip's History page
     1 three lanes under one head: Ours · our party, Day, Theirs · their party;
       the head says "our side left, theirs right"; no side switch
     2 our proposal stands in the left lane, theirs in the right, a trail entry
       one of our people wrote on our side; the days run down one middle line,
       each day a pill on it
     3 what only we can see (who opened it) sits on the middle line as a
       dashed pill; nothing is hidden by the lanes (every entry is drawn)
     4 ⋯ More: for an admin, "The whole trail, as a file ›" under "Every
       contract · admins only", and it lands on Settings → Data & backup on The
       trail; a colleague who is not an admin is not offered it
     5 the owner's three screens: the head and the first day in view, the two
       lanes side by side, nothing sideways
   RE-POINTED 21 Oct 2026: the owner picked "The SAP way" for History (one
   table, Time · Who · Side · What happened · Outcome), which reverses the
   lanes; 1, 2, 3a and 5 now read the Side column; 4 (the admin's door) holds.
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/two-sides-verify.js */
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
const HP = '#bs-strips [data-bs-host="hist"]';

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (pg, fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await pg.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await pg.waitForTimeout(120); }
      return v; };
    const login = async (pg, email, pass) => {
      await pg.goto(h.base + '/', { waitUntil: 'networkidle' });
      await pg.fill('#li-email', email); await pg.fill('#li-pass', pass); await pg.click('#li-go');
      await until(pg, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
      await pg.keyboard.press('Escape').catch(() => {});
    };
    await login(page, 'admin@example.co.ke', 'adminpassword1');
    const me = await page.evaluate(() => currentUser().name);
    /* a negotiation: our ask, theirs refused by us; a trail entry by one of ours */
    await page.evaluate(async me => {
      const c = getContract('MK-A2'); if (c._light && window.ensureFull) await ensureFull(c);
      negoInit(c);
      const cl = negoClauseList(c);
      await negoEditClause(c, cl[0].clauseId, '<p>Payment falls due within thirty (30) days.</p>', { side: 'owner', author: me, summary: 'Net-30' });
      await negoEditClause(c, cl[1].clauseId, '<p>Either party may end this on ninety (90) days notice.</p>', { side: 'counterparty', author: 'Erik Lindqvist', summary: 'Notice to 90' });
      const chs = negoChanges(c); negoResolve(c, chs[1].id, 'rejected', { by: me });
      persist(c);
    }, me);
    await page.evaluate(() => roomOpenAt('MK-A2', 'history'));
    await until(page, s => !!document.querySelector(s + ' .hist-ev'), HP, 12000);
    await page.mouse.move(2, 2);
    const READ = sel => { const host = document.querySelector(sel); if (!host) return null;
      const tr = host.querySelector('.hist-trail'); if (!tr) return { trail: false };
      const R = tr.getBoundingClientRect(), mid = R.left + R.width / 2;
      const b = getComputedStyle(tr, '::before');
      const rows = [...tr.querySelectorAll(':scope > .hist-ev')].map(r => { const box = (r.querySelector('.hist-bub, .hist-inside') || r).getBoundingClientRect();
        return { lane: r.getAttribute('data-hist-lane'), text: (r.querySelector('.hist-text') || {}).textContent || '', l: box.left, r: box.right,
          dashed: getComputedStyle(r.querySelector('.hist-bub, .hist-inside') || r).borderTopStyle,
          side: ((r.querySelector('.hist-c-side') || {}).textContent || '').trim(), sideX: r.querySelector('.hist-c-side') ? Math.round(r.querySelector('.hist-c-side').getBoundingClientRect().left) : null,
          inside: r.classList.contains('is-inside') }; });
      const days = [...tr.querySelectorAll(':scope > .hist-day-h')].map(d => { const x = d.getBoundingClientRect(); return Math.abs((x.left + x.width / 2) - mid); });
      return { trail: true, lanes: [...tr.querySelectorAll(':scope > .hist-lh')].map(x => x.textContent.trim()),
        cols: [...tr.querySelectorAll(':scope > .hist-th > *')].map(x => x.textContent.trim()),
        dayCounts: [...tr.querySelectorAll(':scope > .hist-day-h small')].map(x => x.textContent.trim()),
        cap: (host.querySelector('.hist-cap') || {}).textContent || '', sw: host.querySelectorAll('[data-ht-side]').length,
        spine: b.content !== 'none' && b.display !== 'none' ? Math.abs(R.left + parseFloat(b.left) - mid) : null,
        mid, rows, days }; };
    let A = await page.evaluate(READ, HP);
    const party = await page.evaluate(() => { const c = getContract('MK-A2'); return { us: (window.contractParty && contractParty(c)) || FIRST_PARTY, them: c.counterparty }; });
    /* RE-POINTED 21 Oct 2026: the owner picked "The SAP way" for History, which reverses "Two sides".
       Whose step it was is still read on every row — histLaneOf's reading, said in the Side column. */
    check('1a ONE TABLE under one head: Time · Who · Side · What happened · Outcome; no lanes',
      A && A.lanes.length === 0 && JSON.stringify(A.cols) === JSON.stringify(['Time', 'Who', 'Side', 'What happened', 'Outcome']), JSON.stringify(A && { lanes: A.lanes, cols: A.cols }));
    check('1b the head no longer says "our side left, theirs right", and there is no side switch', A && !/our side left/.test(A.cap) && A.sw === 0, JSON.stringify(A && { cap: A.cap, sw: A.sw }));
    void party;
    const ours = A.rows.find(r => /Net-30/.test(r.text)), theirs = A.rows.find(r => /Notice to 90/.test(r.text) && r.lane === 'theirs');
    check('2a our proposal reads "Ours", theirs "Theirs", in one straight Side column',
      !!ours && ours.lane === 'ours' && ours.side === 'Ours' && !!theirs && theirs.side === 'Theirs' && ours.sideX === theirs.sideX, JSON.stringify({ ours, theirs }));
    const decided = A.rows.find(r => /rejected/i.test(r.text));
    check('2b our refusal of their ask is ours', !!decided && decided.lane === 'ours' && decided.side === 'Ours', JSON.stringify(decided));
    check('2c no line runs down the trail; each day is a row with its count', A.spine == null && A.dayCounts.length > 0 && A.dayCounts.every(d => /event/.test(d)), JSON.stringify({ spine: A.spine, days: A.dayCounts }));

    /* 3 the inside-only line, and nothing hidden */
    await page.evaluate(sel => { const c = getContract('MK-A2'); const host = document.querySelector(sel);
      c._opens = [{ at: new Date(Date.now() - 60000).toISOString(), by: { name: 'Erik Ström' } }];
      roomPaintHistory(c, host._histF || {}, host); }, HP);
    A = await page.evaluate(READ, HP);
    const open = A.rows.find(r => r.lane === 'mid' && /opened/i.test(r.text));
    check('3a who opened it is a quiet row of the table like any other, its side a dash', !!open && open.inside && open.side === '\u2014', JSON.stringify(open));
    const all = await page.evaluate(() => roomHistoryEvents(getContract('MK-A2'), {}).length);
    check('3b the table hides nothing: every entry is drawn', A.rows.length === all, `${A.rows.length} of ${all}`);
    if (OUT) await (await page.$(HP)).screenshot({ path: path.join(OUT, 'two-sides-strip.png') }).catch(() => {});
    await page.evaluate(sel => { const c = getContract('MK-A2'); delete c._opens; const host = document.querySelector(sel); roomPaintHistory(c, host._histF || {}, host); }, HP);

    /* 4 the admin's door */
    await page.click(HP + ' #hist-more');
    const M = await until(page, () => { const m = document.getElementById('hist-more-menu'); if (!m || m.classList.contains('hidden')) return null;
      /* RE-POINTED (B1 pass 4, round 12's menu as drawn: "This contract" heads the menu, then "Every contract · admins only"
         over the trail door): the group that stands over the door */
      const t = m.querySelector('#ht-trail'); let g = t && t.previousElementSibling; while (g && !g.classList.contains('hist-mg')) g = g.previousElementSibling;
      return { group: (g || {}).textContent || '', door: (t || {}).textContent || '' }; });
    check('4a an admin finds the whole trail under "Every contract · admins only"', M && /Every contract · admins only/.test(M.group) && /The whole trail, as a file/.test(M.door), JSON.stringify(M));
    await page.click('#ht-trail');
    const landed = await until(page, () => { const t = document.querySelector('[data-st-bk-tab="trail"]');
      return t && (t.getAttribute('aria-selected') === 'true' || t.classList.contains('on') || t.getAttribute('aria-pressed') === 'true') ? 'trail' : null; }, null, 10000);
    check('4b and it lands on Settings → Data & backup, on The trail', landed === 'trail', String(landed));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'two-sides-trail-door.png') });
    const p2 = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    p2.on('pageerror', e => errors.push(e.message));
    await login(p2, 'everything@example.co.ke', 'their-own-pass-9');
    await p2.evaluate(() => roomOpenAt('MK-A2', 'history'));
    await until(p2, s => !!document.querySelector(s + ' .hist-ev'), HP, 12000);
    const non = await p2.evaluate(() => ({ admin: !!(window.isAdmin && isAdmin()), door: !!document.getElementById('ht-trail') }));
    check('4c a colleague who is not an admin is not offered it', non && !non.admin && !non.door, JSON.stringify(non));

    /* 5 the owner's three screens (the Settings drawer put away first) */
    await page.keyboard.press('Escape').catch(() => {});
    await until(page, () => !document.querySelector('.st-drawer.is-open, [data-st-drawer].is-open'), null, 3000);
    await page.evaluate(() => roomOpenAt('MK-A2', 'history'));
    await until(page, s => !!document.querySelector(s + ' .hist-ev'), HP, 12000);
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      await page.evaluate(sel => { const el = document.querySelector(sel); if (el) el.scrollIntoView({ block: 'start' }); }, HP);
      const F = await page.evaluate(sel => { const host = document.querySelector(sel), hd = host && host.querySelector('.hist-head'), d1 = host && host.querySelector('.hist-day-h');
        const tr = host && host.querySelector('.hist-trail');
        const r = x => x && x.getBoundingClientRect();
        return { head: !!hd && r(hd).top >= 0 && r(hd).bottom <= innerHeight, day: !!d1 && r(d1).bottom <= innerHeight,
          whole: !!tr && tr.scrollWidth <= tr.clientWidth + 1, side: document.documentElement.scrollWidth <= innerWidth + 1 }; }, HP);
      check(`5 ${w}×${ht}: the head and the first day in view, the table whole, nothing sideways`, F.head && F.day && F.whole && F.side, JSON.stringify(F));
      if (OUT) await page.screenshot({ path: path.join(OUT, `two-sides-${w}x${ht}.png`) });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
