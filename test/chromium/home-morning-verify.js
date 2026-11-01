/* HOME, THE NEW LOOK (round 2 of the Legora way rebuilt behind the switch; owner, 31 Oct 2026: "start Home", the six
   answers — one list, the box in Jambo's panel, the paper's words only where known, approvals off the week line, Jambo
   says only what he has read, his work opens in place). On a book with a late duty, a renewal to decide, owed details
   and Jambo's prepared work, with the new look on, at the owner's three screens:
     1 · Home is the sheet beside Jambo's panel: no box in the middle; his box at the panel's foot; the panel's tab "Jambo"
     2 · the greeting in the title serif, and one sentence counted from the list
     3 · the counts as coloured words (late ruby, your move amber, prepared by Jambo violet), each a door
     4 · your week, Monday to Sunday: today underlined, red while something is late, a duty green on its day, an end
         amber on its day, an empty day not a button
     5 · ONE list: late first, then your move, then Jambo's work; each row led by round initials (or a drawn mark), its
         kind a tinted word, its verb a green link; no groups, no "Show all"
     6 · Jambo's panel: the late one first, read from the record (no call); Likely next, each "free"; the map's doors
     7 · his work opens IN PLACE under its row, and the same press closes it
     8 · nothing sideways; the foot says how many things
     9 · a count opens the Board on its list; a day on the week line opens the Calendar's agenda on that day
    10 · the switch off: today's Home, unchanged
    11 · THE FIRST DAY (no contract yet): three doors, Upload filled; Jambo's "What I never do" and "Set up once"
   At the parent (before this change) 1–9 and 11 fail: Home is today's centred card.
   Run: node test/chromium/home-morning-verify.js   (pictures: MORNING_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.MORNING_SHOTS || path.join(__dirname, 'shots', 'morning');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const day = off => new Date(Date.now() + off * 864e5).toISOString().slice(0, 10);
const iso = off => new Date(Date.now() + off * 864e5).toISOString();
const BODY = 'SUPPLY AGREEMENT\n\n3. Payment\nPayment is due within thirty days of invoice.\n\n4. Delivery\nPallets shall be returned within 14 days.';

const signIn = async (page, h) => {
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  return until(page, () => window.state && Array.isArray(state.contracts) && typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && typeof stPrefSet === 'function', null, 40000);
};
const newLook = (page, on) => page.evaluate(async on => { await stPrefSet('newLook', on); newLookApply(); }, on);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const a = fixtureContract('MK-911', 'Refined Sugar Supply', 'Kabras Sugar', 'proc', 48000000, 'Signed', BODY);
  a.signatures = [{ party: 'first', name: 'Amina Otieno', at: iso(-40) }, { party: 'counterparty', name: 'Their CEO', at: iso(-39) }];
  a.obligations = [{ id: 'o1', title: 'Return the pallets', due: day(-3), owner: 'us' }, { id: 'o2', title: 'Send the monthly supply report', due: day(2), owner: 'us' }];
  const b = fixtureContract('MK-912', 'Raw Milk Collection', 'Nandi Dairy', 'proc', 36000000, 'Under Review', BODY);
  b.expiry = day(4); b.metadata = Object.assign({}, b.metadata, { expiryDate: day(4) });
  await seedWorkspace(h, { contracts: [a, b], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const SCREENS = [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]];
  try {
    for (const [nm, W, H] of SCREENS){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => { console.log('PAGE ERROR', String(e)); fails++; });
      if (!await signIn(page, h)){ check(`${nm} signed in`, false); await page.close(); continue; }
      if (nm === 'laptop-a'){
        await page.evaluate(() => caGo({ kind: 'go', place: 'counter' }));
        const old = await until(page, () => state.view === 'counter' && !!document.querySelector('#cn-page #cn-q') && !document.getElementById('cn2-page'), null, 20000);
        check('10 the switch off: today\'s Home, unchanged (the centred card and its box)', old);
        /* 10b the switch turned on WHILE Home is showing (the owner, 1 Nov 2026: "not converting to the new page design even when
           changed"): Home is drawn again at once in the new look, Jambo's panel beside it; turned off again, the old Home at once */
        await page.evaluate(() => stNewLookSet(true));
        const nowNew = await until(page, () => state.view === 'counter' && !!document.getElementById('cn2-page') && !!document.querySelector('#ins-panel .jb-card'), null, 10000);
        await page.evaluate(() => stNewLookSet(false));
        const backOld = await until(page, () => state.view === 'counter' && !document.getElementById('cn2-page') && !!document.querySelector('#cn-page #cn-q'), null, 10000);
        check('10b the switch turned on while Home shows: Home is drawn again in the new look at once; turned off, the old Home at once', nowNew && backOld, { nowNew, backOld });
      }
      await newLook(page, true);
      await page.evaluate(() => caGo({ kind: 'go', place: 'counter' }));
      const on = await until(page, () => state.view === 'counter' && !!document.getElementById('cn2-page') && !!document.querySelector('#ins-panel .jb-card'), null, 20000);
      check(`${nm} Home stands in the new look`, on); if (!on){ await page.close(); continue; }
      await page.waitForTimeout(600);
      const M = await page.evaluate(() => {
        const tab = document.querySelector('#ins-panel [data-jl-home] .pd-tab-w');
        const h1 = document.querySelector('#cn2-page .cn2-hello'), cs = h1 && getComputedStyle(h1);
        const rows = [...document.querySelectorAll('#cn2-list .cn2-row')].map(r => {
          const av = r.querySelector('.nd-av'), k = r.querySelector('.nd-kind'), v = r.querySelector('.cn2-ac .nd-btn');
          return { k: k ? k.className.replace(/.*is-/, '') : '', round: !!av && getComputedStyle(av).borderTopLeftRadius === '50%', link: !!v && v.classList.contains('nd-link') && /underline/.test(getComputedStyle(v).textDecorationLine), name: (r.querySelector('.cn2-nm') || {}).textContent || '' }; });
        const cts = [...document.querySelectorAll('#cn2-counts .cn-ct')].map(b => ({ tone: [...b.classList].find(c => c.startsWith('is-')), word: b.textContent.trim() }));
        const accent = (() => { const x = document.createElement('i'); x.style.color = 'var(--accent-ink)'; document.body.appendChild(x); const c = getComputedStyle(x).color; x.remove(); return c; })();
        const v = document.querySelector('#cn2-list .cn2-row .nd-btn');
        return { midBox: !!document.querySelector('#cn2-page .cn2-sheet .jb-card, #cn-q'), panelBox: !!document.querySelector('#ins-panel .jb-card'), tab: tab ? tab.textContent.trim() : '',
          serif: !!cs && /Source Serif/.test(cs.fontFamily), hello: h1 ? h1.textContent : '', say: (document.querySelector('#cn2-page .cn2-say') || {}).textContent || '',
          rows, cts, linkInk: v ? getComputedStyle(v).color : '', accent, groups: document.querySelectorAll('#cn2-page .nd-g, #cn2-page [data-nd-all]').length,
          foot: (document.querySelector('#cn2-page .cn2-foot') || {}).textContent || '', sideways: document.documentElement.scrollWidth - innerWidth,
          footIn: (() => { const f = document.querySelector('#cn2-page .cn2-foot'); if (!f) return false; const r = f.getBoundingClientRect(); return r.bottom <= innerHeight && r.top > 0; })() };
      });
      check(`${nm} 1 the sheet beside Jambo's panel: no box in the middle, his box at the panel's foot, the tab "Jambo"`, !M.midBox && M.panelBox && M.tab === 'Jambo', { midBox: M.midBox, panelBox: M.panelBox, tab: M.tab });
      check(`${nm} 2 the greeting in the title serif, one sentence counted from the list`, M.serif && /^Good (morning|afternoon|evening), Amina\.$/.test(M.hello) && /late/.test(M.say) && /\.$/.test(M.say), { hello: M.hello, say: M.say });
      check(`${nm} 3 the counts as coloured words: late ruby, your move amber, prepared by Jambo violet`, M.cts.length >= 2 && M.cts[0].tone === 'is-ruby' && /late/.test(M.cts[0].word) && M.cts.every(c => /\d/.test(c.word)), M.cts);
      const order = M.rows.map(r => ({ late: 0, you: 1, jambo: 2, week: 3 }[r.k] ?? 9));
      check(`${nm} 5 ONE list, late first, then your move, then Jambo's work; round initials, a kind on every row, a green link; no groups, no Show all`,
        M.rows.length >= 3 && order.every((v, i) => i === 0 || v >= order[i - 1]) && M.rows[0].k === 'late' && M.rows.every(r => r.round && r.k && r.link) && M.linkInk === M.accent && M.groups === 0, M.rows);
      check(`${nm} 8 nothing sideways; the foot in sight says how many things`, M.sideways <= 0 && M.footIn && /\d+ things?/.test(M.foot), { sideways: M.sideways, foot: M.foot, footIn: M.footIn });
      const WK = await page.evaluate(() => {
        const w = document.querySelector('#cn2-page #cn-week'); if (!w) return null;
        const days = [...w.querySelectorAll('.cn-wk-d')].map(d => ({ btn: d.tagName === 'BUTTON', today: d.classList.contains('is-today'), tone: ((d.querySelector('i') || {}).className || ''), go: d.getAttribute('data-cn-wk') || '' }));
        const t = new Date(calToday() + 'T00:00:00'), mon = new Date(t.getFullYear(), t.getMonth(), t.getDate() - ((t.getDay() + 6) % 7));
        const f = n => { const x = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
        const iso = n => { const x = new Date(t.getFullYear(), t.getMonth(), t.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
        return { days, idx: Array.from({ length: 7 }, (_, i) => f(i)), todayIdx: (t.getDay() + 6) % 7, d2: iso(2), d4: iso(4), say: (w.querySelector('.cn-wk-say') || {}).textContent || '' };
      });
      const at = d => WK ? WK.idx.indexOf(d) : -1;
      check(`${nm} 4 your week, Monday to Sunday: today underlined and red (something late); a duty green and an end amber on their days; an empty day no button`,
        !!WK && WK.days.length === 7 && WK.days[WK.todayIdx].today && /is-ruby/.test(WK.days[WK.todayIdx].tone)
        && (at(WK.d2) < 0 || /is-green/.test(WK.days[at(WK.d2)].tone)) && (at(WK.d4) < 0 || /is-amber/.test(WK.days[at(WK.d4)].tone))
        && WK.days.filter(d => !/is-(green|amber|ruby)/.test(d.tone)).every(d => !d.btn) && /late today/.test(WK.say), WK);
      const P = await page.evaluate(() => {
        const p = document.getElementById('ins-panel');
        return { head: (p.querySelector('.jov-head') || {}).textContent || '', src: (p.querySelector('.jov-src') || {}).textContent || '',
          likely: [...p.querySelectorAll('.cn2-lk')].map(l => l.textContent.trim()), doors: [...p.querySelectorAll('.jb-ways [data-jb-way]')].map(x => x.getAttribute('data-jb-way')) };
      });
      check(`${nm} 6 Jambo's panel: the late one first, read from the record (no call); Likely next each free; the map's doors`,
        /^The late one first/.test(P.head) && /no call/.test(P.src) && P.likely.length >= 1 && P.likely.every(l => /free$/.test(l)) && P.doors.join() === 'board,contracts,calendar,explorer,reads', P);
      const jb = await page.$('#cn2-list [data-cn2-look]');
      if (jb){
        await jb.click();
        const open = await until(page, () => !!document.querySelector('#cn2-list .cn2-look') && document.querySelector('#cn2-list .cn2-look').textContent.trim().length > 0, null, 8000);
        const key = await page.evaluate(() => (document.querySelector('#cn2-list .cn2-look') || {}).getAttribute && document.querySelector('#cn2-list .cn2-look').getAttribute('data-hb-ag-item'));
        await page.screenshot({ path: path.join(OUT, `home-${nm}-open.png`) });
        await page.click(`#cn2-list [data-cn2-look="${key}"]`);
        const shut = await until(page, () => !document.querySelector('#cn2-list .cn2-look'), null, 8000);
        check(`${nm} 7 Jambo's work opens in place under its row, and the same press closes it; Home stays`, open && shut && await page.evaluate(() => state.view === 'counter'), { open, shut });
      } else check(`${nm} 7 Jambo's work opens in place (a prepared piece on the list)`, false, 'no prepared piece on the list');
      await page.screenshot({ path: path.join(OUT, `home-${nm}.png`) });
      if (nm === 'laptop-a'){
        await page.click('#cn2-counts [data-cn-count="all"]');
        check('9 a count opens the Board on its list', await until(page, () => state.view === 'dashboard', null, 20000));
        await page.evaluate(() => caGo({ kind: 'go', place: 'counter' }));
        await until(page, () => !!document.querySelector('#cn2-page #cn-week'), null, 15000);
        const d = await page.evaluate(() => { const b = document.querySelector('#cn2-page #cn-week [data-cn-wk]'); return b ? b.getAttribute('data-cn-wk') : null; });
        if (d){
          await page.click(`#cn2-page #cn-week [data-cn-wk="${d}"]`);
          check('9b a day on the week line opens the Calendar\'s agenda on that day', await until(page, d => { const el = document.querySelector(`#hb-cal [data-cal-ag-day="${d}"]`); if (!el) return false; const r = el.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; }, d, 20000));
        }
      }
      await newLook(page, false);
      await page.close();
    }
    /* 11 · THE FIRST DAY: a workspace with no contract */
    const h2 = await startHati();
    await seedWorkspace(h2, { contracts: [], approvalRules: [] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    if (await signIn(page, h2)){
      await newLook(page, true);
      await page.evaluate(() => caGo({ kind: 'go', place: 'counter' }));
      await until(page, () => !!document.querySelector('#cn2-page.is-first'), null, 20000);
      const F = await page.evaluate(() => ({ doors: [...document.querySelectorAll('#cn2-page [data-cn2-first]')].map(b => ({ k: b.getAttribute('data-cn2-first'), filled: b.classList.contains('ui-btn-primary') })),
        never: document.querySelectorAll('#ins-panel .cn2-pr').length, once: [...document.querySelectorAll('#ins-panel [data-cn2-go]')].map(b => b.getAttribute('data-cn2-go')) }));
      check('11 the first day: three doors (Upload filled, Draft, Import); Jambo\'s three rules he keeps and the set-up links',
        F.doors.map(d => d.k).join() === 'upload,draft,import' && F.doors[0].filled && !F.doors[1].filled && F.never === 3 && F.once.join() === 'people,settings,standards', F);
      await page.screenshot({ path: path.join(OUT, 'home-first-day.png') });
      await newLook(page, false);
    } else check('11 the first day signed in', false);
    await page.close(); await h2.stop();
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
