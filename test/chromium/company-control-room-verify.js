/* SETTINGS → COMPANY, "CONTROL ROOM" (round 25 of the redesign: the owner
   picked "Control room" by name, 17 Oct 2026 — today's page, tidied;
   js/views/settings.js)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 Needs your attention: each row two lines (the second under the first),
       its button on the right; the head says what the buttons do
     2 nine even cards, People & access one of them, three to a row
     3 the ladder runs across the page under the cards, the access sheet
       under it
     4 no line on a card is cut short (it was "signi…" at 1440); The
       agreement's facts are the drawing's — Approval rules, Internal review
       (re-pointed 18 Oct 2026, round 25 as drawn: "Who must say yes before
       signing" is found in the Menu, no longer a fact on the card)
     5 it fits the owner's three screens
   At the parent (round 24's head) every check fails but 5 and the console.
   Waits ask for the state, bounded.
   Run: node test/chromium/company-control-room-verify.js */
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
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
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
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts), null, { timeout: 20000 });
    const toCompany = () => until(() => {
      if (!document.getElementById('set-page') || settingsTab() !== 'company') { setView('team'); settingsGoTab('company'); return null; }
      return document.querySelector('#st-board .st-cards') ? true : null; }, null, 15000);

    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await toCompany(); await page.waitForTimeout(300);
      const m = await page.evaluate(() => {
        const R = el => el.getBoundingClientRect();
        const rows = [...document.querySelectorAll('#st-att .st-need[data-st-need]')].map(r => {
          const t = r.querySelector('.st-need-t'), s = r.querySelector('.st-need-s'), b = r.querySelector('.st-need-go');
          return { two: !!(t && s) && R(s).top >= R(t).bottom - 1, btnRight: !!b && R(b).right > R(t).right };
        });
        const sub = (document.querySelector('#st-needs-h .st-needs-sub') || {}).textContent || '';
        const cards = [...document.querySelectorAll('#st-board .st-cards > [data-st-card]')];
        const widths = cards.map(c => Math.round(R(c).width));
        const tops = [...new Set(cards.map(c => Math.round(R(c).top)))];
        const ladder = document.querySelector('#st-board > [data-st-card="ladder"]');
        const grid = document.querySelector('#st-board .st-cards');
        const sheet = document.getElementById('st-sheet-card');
        const cut = [...document.querySelectorAll('#st-board .st-fact-n, #st-board .st-fact-s, #st-att .st-need-t, #st-att .st-need-s')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim().slice(0, 40));
        const who = [...document.querySelectorAll('#st-board [data-st-card="agreement"] .st-fact-n')].map(e => e.textContent.trim());
        return { rows, sub, n: cards.length, first: cards[0] && cards[0].getAttribute('data-st-card'), widths, rowsOf: tops.length,
          ladder: !!ladder && Math.abs(R(ladder).width - R(grid).width) < 2 && R(ladder).top > R(grid).bottom - 1,
          sheet: !!sheet && !!ladder && R(sheet).top > R(ladder).bottom - 1, cut, who,
          sx: document.scrollingElement.scrollWidth > innerWidth };
      });
      const tag = `at ${w}×${hh}`;
      check(`1a ${tag}: each row two lines, its button on the right`, m.rows.length > 0 && m.rows.every(r => r.two && r.btnRight), JSON.stringify(m.rows));
      check(`1b ${tag}: the head says what the buttons do`, m.sub === 'each row’s button opens what settles it', m.sub);
      check(`2 ${tag}: nine even cards, People first, three to a row`, m.n === 9 && m.first === 'people' && Math.max(...m.widths) - Math.min(...m.widths) <= 1 && m.rowsOf === 3, JSON.stringify({ n: m.n, w: m.widths, rows: m.rowsOf }));
      check(`3 ${tag}: the ladder across the page under the cards, the access sheet under it`, m.ladder && m.sheet);
      check(`4 ${tag}: no line cut short; The agreement's facts as drawn`, m.cut.length === 0 && m.who.join('|') === 'Approval rules|Internal review', JSON.stringify({ cut: m.cut, who: m.who }));
      check(`5 ${tag}: no sideways scroll`, !m.sx);
      await shot(page, `company-control-room-${w}x${hh}`);
    }
    check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
