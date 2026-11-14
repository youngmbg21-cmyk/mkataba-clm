/* Chromium verification: SETTINGS, THE LEGORA WAY — EVERY ROW OPENS WHAT IT NAMES (owner's pick, 13 Nov 2026).
   =====================================================================
   The left menu is GONE (it was the subject of this check on 9 Nov 2026: "a lot of the buttons … are not functioning").
   The owner picked "The Legora way" by name: nothing boxed, one list by area, a round coloured mark on each row,
   coloured chips to choose an area, the four pages as links at the foot.
   Driven in a real browser, the sample book, the new look on:
     0  no menu; the chips, the area heads in their tones, every row with its mark
     1  a row's own door opens what it opened (the drawer, or Jambo's agents' page)
     2  a switch is DRAWN (it measured 0×0 on this page at the parent) and a chip's press flips nothing
     3  a chip shows its area alone, its count is the rows it shows, All brings them back; the page never moves sideways
     4  People & roles, Streams & categories and Trail open their pages from the foot, one white sheet
     5  nothing is cut off under the window's foot: the last row and the page links are reached by scrolling
   Run: node test/chromium/settings-menu-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'settings-menu');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

/* what a press on a row's door, or on a link at the foot, should do */
const ROWS = { name: 'drawer', twostep: 'drawer', agents: 'view:jambo', approvals: 'drawer', review: 'drawer', signcap: 'drawer', linkcode: 'drawer', rates: 'drawer', mail: 'drawer' };
const FOOT = { 'data-st-page=team': 'page', 'data-st-page=streams': 'page', 'data-st-panel=lessons': 'drawer', 'data-st-panel=trail': 'page' };
const AREAS = { you: ['name', 'lang', 'agents'], sec: ['twostep', 'signcap', 'linkcode'], rule: ['approvals', 'review'], money: ['rates'], msg: ['push', 'mail', 'outsidelook'] };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => errors.push(String(e).slice(0, 180)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Amina Otieno');
    await page.fill('#su-email', 'admin@example.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample'); if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go');
    await waitFor(page, () => !!(window.state && Array.isArray(state.contracts) && state.contracts.length), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
    const open = async () => { await page.reload({ waitUntil: 'networkidle' }); await waitFor(page, () => typeof openSettingsAt === 'function' && !!(window.state && Array.isArray(state.contracts) && state.contracts.length) && typeof currentUser === 'function' && !!currentUser(), null, 20000); await page.keyboard.press('Escape').catch(() => {});
      if (!(await page.evaluate(() => document.documentElement.classList.contains('lg-new')))) await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
      await page.evaluate(() => openSettingsAt('you')); return waitFor(page, () => document.querySelectorAll('#stn-main .stn-row').length >= 10, null, 10000); };
    const scrim = () => page.evaluate(() => { const sc = document.getElementById('st-scrim'); return !!sc && getComputedStyle(sc).display !== 'none' && sc.getBoundingClientRect().width > 0; });
    const first = await open();
    check('0 Settings draws its list, the new look on', first);
    if (first) {
      const S = await page.evaluate(() => { const m = document.getElementById('stn-main');
        const tone = el => getComputedStyle(el).color;
        return { menu: !!document.querySelector('.stn-menu, .stn-mi'), chips: [...m.querySelectorAll('.stn-chip')].map(c => c.getAttribute('data-stn-area') + ':' + (c.querySelector('em') || {}).textContent),
          heads: [...m.querySelectorAll('h3.stn-h')].map(h => h.id.replace('stn-sec-', '')), headTones: new Set([...m.querySelectorAll('h3.stn-h')].map(tone)).size,
          rows: [...m.querySelectorAll('.stn-row')].map(r => ({ k: r.getAttribute('data-stn-row'), a: r.getAttribute('class').replace(/.*a-(\w+).*/, '$1'), mark: (() => { const k = r.querySelector('.stn-mark'), b = k && k.getBoundingClientRect(); return !!b && b.width >= 32 && !!k.querySelector('svg') && getComputedStyle(k).backgroundColor !== 'rgba(0, 0, 0, 0)'; })() })),
          sw: [...m.querySelectorAll('.st-swt')].map(b => { const r = b.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }),
          foot: [...m.querySelectorAll('#stn-pages .stn-pg')].map(b => { const a = [...b.attributes].find(x => /^data-st/.test(x.name)); return a ? a.name + '=' + a.value : ''; }) }; });
      const byArea = k => S.rows.filter(r => r.a === k).map(r => r.k);
      check('0 no menu; a chip per area with the count of its rows, All first', !S.menu && S.chips[0] === 'all:' + S.rows.length && Object.keys(AREAS).every(k => S.chips.includes(k + ':' + byArea(k).length)), JSON.stringify(S.chips));
      check('0 the rows stand under their area, in order, each with its coloured mark', S.heads.join() === Object.keys(AREAS).join() && Object.keys(AREAS).every(k => byArea(k).join() === AREAS[k].join()) && S.rows.every(r => r.mark) && S.headTones === 5, JSON.stringify({ heads: S.heads, rows: S.rows.map(r => r.a + '.' + r.k), tones: S.headTones }));
      check('2 every switch is drawn at its size', S.sw.length >= 1 && S.sw.every(x => x === '34x20'), JSON.stringify(S.sw));
      check('0 the four pages are links at the foot', S.foot.length === Object.keys(FOOT).length && S.foot.every(a => FOOT[a]), JSON.stringify(S.foot));
      await page.screenshot({ path: path.join(OUT, 'legora-1440x780.png') });

      /* 3 · the chips */
      const swWas = await page.evaluate(() => [...document.querySelectorAll('#stn-main .st-swt')].map(b => b.getAttribute('aria-checked')).join());
      await page.click('[data-stn-area="sec"]');
      const C = await page.evaluate(() => { const m = document.getElementById('stn-main'); return { rows: [...m.querySelectorAll('.stn-row')].map(r => r.getAttribute('data-stn-row')), n: (m.querySelector('[data-stn-area="sec"] em') || {}).textContent, on: m.querySelector('[data-stn-area="sec"]').getAttribute('aria-pressed'), all: m.querySelector('[data-stn-area="all"]').getAttribute('aria-pressed'), foot: !!m.querySelector('#stn-pages'), side: document.documentElement.scrollWidth - innerWidth, title: !!document.querySelector('.stn-title') }; });
      check('3 a chip shows its area alone; its count is the rows it shows', C.rows.join() === AREAS.sec.join() && C.n === String(C.rows.length) && C.on === 'true' && C.all === 'false' && C.foot && C.title && C.side <= 0 && !(await scrim()), JSON.stringify(C));
      await page.click('[data-stn-area="all"]');
      const back = await page.evaluate(() => ({ n: document.querySelectorAll('#stn-main .stn-row').length, sw: [...document.querySelectorAll('#stn-main .st-swt')].map(b => b.getAttribute('aria-checked')).join() }));
      check('3 All brings every row back; no switch was flipped', back.n === S.rows.length && back.sw === swWas, JSON.stringify(back));

      /* 5 · nothing cut off under the foot */
      const reach = await page.evaluate(async () => { const sc = document.getElementById('content-scroll'); sc.scrollTop = sc.scrollHeight; await new Promise(r => setTimeout(r, 200));
        const hit = el => { if (!el) return false; const r = el.getBoundingClientRect(); const x = r.left + Math.min(20, r.width / 2), y = r.top + r.height / 2; if (y < 48 || y > innerHeight) return false; const at = document.elementFromPoint(x, y); return !!at && (el === at || el.contains(at)); };
        const rows = [...document.querySelectorAll('#stn-main .stn-row')]; const out = { last: hit(rows[rows.length - 1]), foot: hit(document.querySelector('#stn-pages .stn-pg')) }; sc.scrollTop = 0; return out; });
      check('5 the last row and the page links are painted when scrolled to', reach.last && reach.foot, JSON.stringify(reach));

      /* 1 · each row's own door */
      for (const k of Object.keys(ROWS)) {
        if (!(await open())) { check(`${k}: Settings opened`, false); continue; }
        const sel = `#stn-${k} .stn-a :is([data-st-panel], [data-st-view], [data-st-page])`;
        if (!(await page.$(sel))) { check(`1 ${k}: the row has its door`, false); continue; }
        await page.click(sel);
        if (ROWS[k] === 'drawer') check(`1 ${k}: its door opens the drawer`, await waitFor(page, () => { const sc = document.getElementById('st-scrim'); return !!sc && getComputedStyle(sc).display !== 'none' && sc.getBoundingClientRect().width > 0; }));
        else { const v = ROWS[k].slice(5); check(`1 ${k}: its door opens ${v}`, await waitFor(page, x => window.state && state.view === x, v)); }
      }
      /* 4 · the links at the foot */
      for (const a of Object.keys(FOOT)) {
        if (!(await open())) { check(`${a}: Settings opened`, false); continue; }
        const sel = '#stn-pages [' + a.replace('=', '="') + '"]';
        await page.evaluate(s => { const b = document.querySelector(s); if (b) b.scrollIntoView({ block: 'center' }); }, sel);
        await page.click(sel);
        if (FOOT[a] === 'drawer') { check(`4 ${a}: opens the drawer`, await waitFor(page, () => { const sc = document.getElementById('st-scrim'); return !!sc && getComputedStyle(sc).display !== 'none' && sc.getBoundingClientRect().width > 0; })); continue; }
        const ok = await waitFor(page, () => !document.querySelector('.stn-main') && !!document.querySelector('#set-page.st-cr'));
        const flat = ok && await page.evaluate(() => { const cs = getComputedStyle(document.getElementById('content-scroll'));
          const cards = [...document.querySelectorAll('#set-page.st-cr :is(.st-people-card, .st-pg-card, .st-card)')];
          return cs.backgroundColor === 'rgb(255, 255, 255)' && cards.length > 0 && cards.every(c => parseFloat(getComputedStyle(c).borderTopLeftRadius) === 0 && getComputedStyle(c).boxShadow === 'none'); });
        check(`4 ${a}: opens its page, one white sheet`, ok && flat, JSON.stringify({ opened: ok, flat }));
        if (a === 'data-st-page=team') await page.screenshot({ path: path.join(OUT, 'people-1440x780.png') });
      }
    }
    check('no page errors', errors.length === 0, errors.join(' | ') || undefined);
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed — shots in ${OUT}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
