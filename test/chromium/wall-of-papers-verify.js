/* THE CONTRACTS PLACE, "WALL OF PAPERS" (round 13 of the redesign: the owner
   picked "Wall of papers" by name and said yes to the archive leaving the
   Quick filters box for a button of its own, 17 Oct 2026; js/views/register.js
   regArchiveBtnHtml, js/views/intelligence.js igWallCardHtml)

   WHAT THIS PINS, driven in a real browser on the Contracts place
     1 each contract is a small paper — the top of its first page, its title
       and party on it, nothing stamped over them — and under it the stage in
       words, the number with its value, the party
     2 a contract on a private stream wears a lock with its stream's name; a
       deal kept to its list is a hatched paper with its code name, its stream
       where the value would be and "Kept to its list" for the party
     3 the archive is its own button beside Wall | List, with its count (the
       shelf it opens); one press shows the shelf, a second the live book;
       the Quick filters box no longer offers it
     4 the owner's three screens: the head with Archive · Wall · List and two
       rows of papers in view, nothing sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/wall-of-papers-verify.js */
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

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const extra = [1, 2, 3, 4, 5, 6, 7, 8].map(i => H.fixtureContract('MK-W' + i, 'Supply agreement ' + i, 'Party ' + i + ' AB', H.FOLDER_A, 100000 * i, i % 2 ? 'Signed' : 'Draft'));
  const arch = H.fixtureContract('MK-AR1', 'Old lease', 'Landlord AB', H.FOLDER_A, 50000, 'Signed'); arch.archived = true;
  await H.seedWorkspace(h, { contracts: [...H.FIXTURES, ...extra, arch], approvalRules: [] });
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
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-W8'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    /* a private stream, and a deal kept to its list (its stand-in, as the server sends it) */
    const folder = await page.evaluate(() => { const c = getContract('MK-W1');
      state.settings = state.settings || {}; state.settings.privateStreams = { [c.folder]: { on: true, ids: [currentUser().id] } };
      state.contracts.push({ id: 'MK-0412', contractNo: 'MK-0412', name: 'Project Falcon', counterparty: '', folder: c.folder, status: 'Under Review', _codeNamed: true, _light: true });
      return ((FOLDERS || {})[c.folder] || {}).name || ''; });
    /* 20 Oct 2026 (owner: "make the contracts landing page be on list as opposed to paper"): the Contracts
       place lands on the List now; this check is about the Wall, so it picks Wall as a reader would */
    await page.evaluate(() => { if (window.regPlaceSet) regPlaceSet({ show: 'wall' }); });
    await page.evaluate(() => setView('register'));
    await until(() => document.querySelectorAll('#ig-wall .igw-card').length > 8, null, 10000);
    const CARD = id => { const b = document.querySelector(`#ig-wall .igw-card[data-ig-pick="${id}"]`); if (!b) return null;
      const s = b.querySelector('.igw-sheet').getBoundingClientRect(), t = b.querySelector('.igw-sheet .igw-t');
      return { w: Math.round(s.width), h: Math.round(s.height), t: t ? t.textContent : '', stamp: !!b.querySelector('.igw-stamp'),
        coded: b.querySelector('.igw-sheet').classList.contains('is-coded'), bg: getComputedStyle(b.querySelector('.igw-sheet')).backgroundImage,
        m: (b.querySelector('.igw-m') || {}).textContent || '', ref: ((b.querySelector('.igw-rl') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
        nm: (b.querySelector('.igw-nm') || {}).textContent || '', lock: ((b.querySelector('.igw-lock') || {}).textContent || '').trim(),
        under: b.querySelector('.igw-ref').getBoundingClientRect().top >= s.bottom }; };

    /* 1 the paper and its facts */
    const D = await page.evaluate(CARD, 'MK-W2');
    check('1a a small paper, the top of its first page (wider than tall), its title on it and nothing stamped over it',
      !!D && D.w >= 110 && D.w <= 170 && D.w / D.h > 1.4 && D.w / D.h < 1.7 && /Supply agreement 2/.test(D.t) && !D.stamp, JSON.stringify(D));
    const val = await page.evaluate(() => fmtMoneyShortOf(getContract('MK-W2')));
    check('1b under it: the stage in words, the number with its value, the party', !!D && D.under && /Draft/.test(D.m) && D.ref === `MK-W2 · ${val}` && D.nm === 'Party 2 AB', JSON.stringify({ m: D && D.m, ref: D && D.ref, nm: D && D.nm, val }));

    /* 2 private and kept to its list */
    const P = await page.evaluate(CARD, 'MK-W1');
    check('2a a contract on a private stream wears a lock with its stream\'s name', !!P && !!folder && P.lock === folder, JSON.stringify({ lock: P && P.lock, folder }));
    /* the stand-in is the book's last paper: the wall draws twelve at a time
       since 18 Oct 2026 (round 13 as drawn), so Show more brings it */
    while (!(await page.$('#ig-wall .igw-card[data-ig-pick="MK-0412"]')) && await page.$('#ig-wall [data-ig-wall-more]')) { await page.click('#ig-wall [data-ig-wall-more]'); await page.waitForTimeout(250); }
    const C = await page.evaluate(CARD, 'MK-0412');
    check('2b a deal kept to its list: a hatched paper with its code name, its stream for a value, "Kept to its list"',
      !!C && C.coded && /repeating-linear-gradient/.test(C.bg) && /Project Falcon/.test(C.t) && C.ref === `MK-0412 · ${folder}` && C.nm === 'Kept to its list' && !C.lock, JSON.stringify(C));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'wall-of-papers-1440x780.png') });

    /* 3 the archive's own button */
    const A0 = await page.evaluate(() => { const b = document.querySelector('[data-reg-home] [data-ct-archive]'), seg = document.querySelector('[data-reg-home] .ct-seg');
      const opts = [...document.querySelectorAll('#reg-view-sel option')].map(o => o.value);
      return b ? { word: (b.querySelector('span') || {}).textContent, n: (b.querySelector('.ct-arch-n') || {}).textContent || '', pressed: b.getAttribute('aria-pressed'),
        beside: !!seg && b.getBoundingClientRect().right <= seg.getBoundingClientRect().left + 1 && Math.abs(b.getBoundingClientRect().top - seg.getBoundingClientRect().top) < 6,
        inBox: opts.includes('archived'), live: document.querySelectorAll('#ig-wall .igw-card').length } : null; });
    check('3a the archive is its own button beside Wall | List, with the shelf\'s count; the Quick filters box no longer offers it',
      !!A0 && A0.word === 'Archive' && A0.n === '1' && A0.pressed === 'false' && A0.beside && !A0.inBox, JSON.stringify(A0));
    await page.click('[data-reg-home] [data-ct-archive]');
    const A1 = await until(() => { const b = document.querySelector('[data-reg-home] [data-ct-archive]'); if (!b || b.getAttribute('aria-pressed') !== 'true') return null;
      return { ids: [...document.querySelectorAll('#ig-wall .igw-card')].map(x => x.getAttribute('data-ig-pick')) }; });
    check('3b one press shows the shelf — the archived, and only them', !!A1 && JSON.stringify(A1.ids) === JSON.stringify(['MK-AR1']), JSON.stringify(A1));
    await page.click('[data-reg-home] [data-ct-archive]');
    const A2 = await until(() => { const b = document.querySelector('[data-reg-home] [data-ct-archive]'); if (!b || b.getAttribute('aria-pressed') !== 'false') return null;
      return { n: document.querySelectorAll('#ig-wall .igw-card').length, want: Math.min(12, regFiltered().length), arch: !!document.querySelector('#ig-wall .igw-card[data-ig-pick="MK-AR1"]') }; });
    /* the live book's first twelve again: a new narrowing starts at twelve (round 13 as drawn) */
    check('3c pressed again, the live book is back', !!A2 && A2.n === A2.want && A2.n >= Math.min(12, A0.live) && !A2.arch, JSON.stringify(A2));

    /* 4 the owner's three screens */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      const F = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const a = r('[data-reg-home] [data-ct-archive]'), seg = r('[data-reg-home] .ct-seg');
        const cards = [...document.querySelectorAll('#ig-wall .igw-card')].map(x => x.getBoundingClientRect());
        const tops = [...new Set(cards.map(c => Math.round(c.top)))].sort((x, y) => x - y);
        const second = cards.filter(c => Math.round(c.top) === tops[1]);
        return { head: !!a && !!seg && a.top >= 0 && seg.right <= innerWidth, rows2: tops.length >= 2 && second.length > 0 && second.every(c => c.bottom <= innerHeight),
          side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`4 ${w}×${ht}: Archive · Wall · List in view, two rows of papers on the screen, nothing sideways`, F.head && F.rows2 && F.side, JSON.stringify(F));
      if (OUT) await page.screenshot({ path: path.join(OUT, `wall-of-papers-${w}x${ht}.png`) });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
