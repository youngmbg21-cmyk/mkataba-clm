/* HOME, MORNING LIGHT (round 2 of the Legora way, owner picked "Morning light", 31 Oct 2026). On a book with a late
   duty and details owed:
     1 · the warm top: Home's ask card is drawn on the morning tone, fading to white
     2 · the counts as coloured words under the greeting, from the one desk (ndRead): late in ruby, waiting on you in
         amber; a count of nothing is not drawn; each is a dot and a word
     3 · the doors above the box (round 1): board · contracts · calendar · explorer · reads
     4 · a count's press opens the Board's Needs you on that list
     5 · the three screens: on one line, inside the card, nothing sideways; pictures
     6 · YOUR WEEK (owner, 31 Oct 2026: "build both"): seven days from today under the counts, read from the
         Calendar's own reading — today red while something is late, a duty due green, an end date amber, the rest
         grey; the words say the same; an empty day is not a button
     7 · MORNING LIGHT'S ROW ("green link as drawn"): every Needs you row led by its initials (or a drawn mark),
         its kind a tinted word (the late one "Late"), its verb a green link, no grey button
     8 · a day with something on it opens the Calendar's agenda ON that day
   At the parent (before this change) 2 fails: no counts; 6, 7 and 8 fail: no week, rows with grey buttons.
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

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const a = fixtureContract('MK-911', 'Refined Sugar Supply', 'Kabras Sugar', 'proc', 48000000, 'Signed', BODY);
  a.signatures = [{ party: 'first', name: 'Amina Otieno', at: iso(-40) }, { party: 'counterparty', name: 'Their CEO', at: iso(-39) }];
  a.obligations = [{ id: 'o1', title: 'Return the pallets', due: day(-3), owner: 'us' }];
  /* a duty of ours due in two days (a green day on the week line) */
  a.obligations.push({ id: 'o2', title: 'Send the monthly supply report', due: day(2), owner: 'us' });
  const b = fixtureContract('MK-912', 'Raw Milk Collection', 'Nandi Dairy', 'proc', 36000000, 'Under Review', BODY);
  /* an end date in four days (an amber day) */
  b.expiry = day(4); b.metadata = Object.assign({}, b.metadata, { expiryDate: day(4) });
  await seedWorkspace(h, { contracts: [a, b], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const SCREENS = [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]];
  try {
    for (const [nm, W, H] of SCREENS){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => { console.log('PAGE ERROR', String(e)); fails++; });
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 2 && typeof caGo === 'function', null, 40000);
      /* THE NEW LOOK (owner, 31 Oct 2026): these parts are built behind the admin's own switch until approved for everyone */
      await until(page, () => typeof currentUser === 'function' && !!currentUser() && typeof stPrefSet === 'function', null, 20000);
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
      await page.evaluate(() => caGo({ kind: 'go', place: 'counter' }));
      const on = await until(page, () => state.view === 'counter' && !!document.querySelector('#cn-page .cn-ask'), null, 20000);
      check(`${nm} Home stands`, on); if (!on){ await page.close(); continue; }
      await until(page, () => !!document.querySelector('#cn-counts .cn-ct') && !!document.querySelector('#cn-page .jb-ways'), null, 15000);
      const M = await page.evaluate(() => {
        const ask = document.querySelector('#cn-page .cn-ask'), bg = getComputedStyle(ask).backgroundImage;
        const cts = [...document.querySelectorAll('#cn-counts .cn-ct')].map(b => ({ tab: b.getAttribute('data-cn-count'), tone: [...b.classList].find(c => c.startsWith('is-')), word: b.textContent.trim(), dot: !!b.querySelector('i'), h: Math.round(b.getBoundingClientRect().height) }));
        const D = ndRead();
        const box = document.getElementById('cn-counts').getBoundingClientRect(), card = ask.getBoundingClientRect();
        return { warm: /gradient/.test(bg), cts, late: D.late, you: D.you.reduce((s, r) => s + r.n, 0), jambo: D.jambo.reduce((s, r) => s + r.n, 0),
          oneLine: cts.length ? new Set([...document.querySelectorAll('#cn-counts .cn-ct')].map(b => Math.round(b.getBoundingClientRect().top))).size === 1 : true,
          inside: box.left >= card.left && box.right <= card.right, sideways: document.documentElement.scrollWidth - innerWidth,
          doors: [...document.querySelectorAll('#cn-page .jb-ways [data-jb-way]')].map(x => x.getAttribute('data-jb-way')) };
      });
      check(`${nm} 1 the warm top`, M.warm, M.warm);
      const want = [M.late ? 'all' : null, M.you ? 'you' : null, M.jambo ? 'jambo' : null].filter(Boolean);
      check(`${nm} 2 the counts as coloured words, from the desk; nothing drawn for a zero; a dot and a word`, M.cts.map(c => c.tab).join() === want.join() && M.late >= 1 && M.cts.every(c => c.dot && /\d/.test(c.word)) && M.cts[0].tone === 'is-ruby', M);
      check(`${nm} 3 the doors above the box`, M.doors.join() === 'board,contracts,calendar,explorer,reads', M.doors);
      check(`${nm} 5 on one line, inside the card, nothing sideways`, M.oneLine && M.inside && M.sideways <= 0, { oneLine: M.oneLine, inside: M.inside, sideways: M.sideways });
      const WK = await page.evaluate(() => {
        const w = document.getElementById('cn-week'), card = document.querySelector('#cn-page .cn-ask');
        if (!w) return null; const r = w.getBoundingClientRect(), c = card.getBoundingClientRect();
        const days = [...w.querySelectorAll('.cn-wk-d')].map(d => ({ btn: d.tagName === 'BUTTON', today: d.classList.contains('is-today'), tone: ((d.querySelector('i') || {}).className || ''), go: d.getAttribute('data-cn-wk') || d.getAttribute('data-cn-count') || '' }));
        return { days, say: (w.querySelector('.cn-wk-say') || {}).textContent || '', inside: r.left >= c.left && r.right <= c.right, oneLine: r.height <= 44, sideways: document.documentElement.scrollWidth - innerWidth };
      });
      const d2 = await page.evaluate(() => { const t = new Date(calToday() + 'T00:00:00'); const f = n => { const x = new Date(t.getFullYear(), t.getMonth(), t.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }; return [f(2), f(4)]; });
      check(`${nm} 6 your week: seven days from today, today red (something late), a duty green, an end amber, the words say it, an empty day no button, inside the card`,
        !!WK && WK.days.length === 7 && WK.days[0].today && /is-ruby/.test(WK.days[0].tone) && WK.days[0].btn
        && /is-green/.test(WK.days[2].tone) && WK.days[2].go === d2[0] && /is-amber/.test(WK.days[4].tone) && WK.days[4].go === d2[1]
        && WK.days.filter((d, i) => i && !/is-(green|amber|ruby)/.test(d.tone)).every(d => !d.btn)
        && /late today/.test(WK.say) && /ends /.test(WK.say) && /due /.test(WK.say) && WK.inside && WK.oneLine && WK.sideways <= 0, WK);
      const RW = await page.evaluate(() => [...document.querySelectorAll('#cn-needs .nd-r')].map(r => {
        const av = r.firstElementChild, k = r.querySelector('.nd-kind'), v = r.querySelector('.nd-btn');
        return { av: !!(av && av.classList.contains('nd-av')), avTxt: av ? av.textContent.trim() : '', kind: k ? k.textContent.trim() : '', link: !!(v && v.classList.contains('nd-link') && !v.classList.contains('ui-btn')),
          ink: v ? getComputedStyle(v).color : '', line: v ? getComputedStyle(v).textDecorationLine : '', name: (r.querySelector('.nd-t') || {}).textContent || '' }; }));
      const accent = await page.evaluate(() => { const x = document.createElement('i'); x.style.color = 'var(--accent-ink)'; document.body.appendChild(x); const c = getComputedStyle(x).color; x.remove(); return c; });
      check(`${nm} 7 the rows: initials lead (Raw Milk Collection "ND"), the kind a tinted word (the late one "Late"), the verb a green link`,
        RW.length >= 2 && RW.every(r => r.av && r.kind && r.link && r.ink === accent && /underline/.test(r.line))
        && RW.some(r => r.name === 'Raw Milk Collection' && r.avTxt === 'ND') && RW.some(r => r.name === 'Refined Sugar Supply' && r.kind === 'Late'), RW);
      await page.screenshot({ path: path.join(OUT, `home-${nm}.png`) });
      if (nm === 'ipad'){
        await page.click(`#cn-week [data-cn-wk="${d2[0]}"]`);
        const landed = await until(page, d => { const el = document.querySelector(`#hb-cal [data-cal-ag-day="${d}"]`); if (!el) return false; const r = el.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; }, d2[0], 20000);
        check('8 a day on the week line opens the Calendar\'s agenda on that day', landed, await page.evaluate(() => ({ view: state.view, face: window.hbFace ? hbFace() : null })));
      }
      if (nm === 'laptop-a'){
        await page.click('#cn-counts [data-cn-count="you"]');
        const went = await until(page, () => state.view === 'dashboard', null, 20000);
        check('4 a count opens the Board on its list', went);
      }
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
