/* Chromium verification: THE OVERVIEW'S DUTIES MAP READS WHOLE
   ============================================================
   Work order "Home speed", Part 9 (the owner's screenshot, 8 Oct 2026: both
   companies' circles piled in the map's top-left corner, names overlapping,
   the "we owe" curve in two stubs). The Safari cause (a CSS pop-in transform
   replacing a node's SVG transform) is pinned in f442 (9); WebKit is not
   installed here. In Chromium, at 1440, 1280 and 1100, light and dark, with
   0, 1 and 9 duties:
     1. our circle's centre is in the map's left third, theirs in its right
        third
     2. no two labels in the map overlap (names, curve labels)
     3. the upper curve is mostly visible: its label sits above it
     4. the panel's "Renewal" heading is in view without scrolling the panel
     5. with no duties, no "0 duties" is drawn, and the empty line is
     6. no page errors
   Waits ask for the state, bounded. Red at main e18f309 (4, 5).
   Run: node test/chromium/duties-map-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const day = o => { const d = new Date(); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10); };
const duties = n => Array.from({ length: n }, (_, i) => ({ id: 'o' + i, desc: ['Pay the monthly invoice', 'Deliver stock to the depot', 'Send the quality report'][i % 3] + ' ' + (i + 1),
  due: day(-40 + i * 15), status: i < 2 && n > 1 ? 'done' : 'open', party: i % 3 === 2 ? 'theirs' : 'ours', amount: i % 2 ? 250000 : 0 }));
const contract = (id, n) => ({ id, contractNo: id, name: 'Supply ' + id, counterparty: 'Kenpack Industries Ltd', party: 'Highland Corporate Ltd',
  folder: 'proc', status: 'Signed', value: 24000000, template: 'RM', fields: { effDate: '2025-02-01' }, expiry: '2027-01-31',
  metadata: { paymentTerms: '45 days', noticePeriodDays: 90, governingLaw: 'Kenya', renewalType: 'auto-renew' },
  obligations: duties(n), comments: [], rounds: [], versions: [], signatures: [], compliance: { consent: false },
  audit: [{ at: '2026-08-01T09:00:00.000Z', user: 'Amina Otieno', action: 'Created', detail: 'x' }] });
const BOOK = [['MK-D0', 0], ['MK-D1', 1], ['MK-D9', 9]];

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  for (const [id, n] of BOOK) await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: contract(id, n), baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const dark of [false, true]) for (const width of [1440, 1280, 1100]) {
      const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
      page.on('pageerror', e => errors.push(e.message));
      const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
        while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
        return v; };
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke');
      await page.fill('#li-pass', 'adminpassword1');
      await page.click('#li-go');
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-D9'), null, { timeout: 20000 });
      if (dark) await page.evaluate(() => setDark(true));
      for (const [id, n] of BOOK) {
        const tag = `${dark ? 'dark' : 'light'} ${width} ${n} duties`;
        await page.evaluate(id => { state.activeId = id; state.selId = id; setView('workspace'); }, id);
        await until(() => !!document.querySelector('#ws-tabs [data-ws-tab="terms"]'));
        await page.click('#ws-tabs [data-ws-tab="terms"]');
        const up = await until(() => { const m = document.querySelector('#ov-map svg'); return m && m.getBoundingClientRect().width > 100 ? true : null; });
        if (!up) { check(`0. ${tag}: the map is drawn`, false); continue; }
        await page.evaluate(() => document.getElementById('ov-map').scrollIntoView({ block: 'start' }));
        await page.waitForTimeout(800);
        const m = await page.evaluate(() => {
          const svg = document.querySelector('#ov-map svg'), sr = svg.getBoundingClientRect();
          const cen = sel => { const g = svg.querySelector(sel + ' circle[r="64"], ' + sel + ' circle[r="66"]'); if (!g) return null; const r = g.getBoundingClientRect(); return (r.left + r.width / 2 - sr.left) / sr.width; };
          const texts = [...svg.querySelectorAll('text.ov-map-nm, text.ov-map-big, text.ov-map-sm')].map(t => { const r = t.getBoundingClientRect(); return { t: t.textContent, l: r.left, r: r.right, top: r.top, b: r.bottom }; }).filter(x => x.r - x.l > 1);
          const clash = []; texts.forEach((a, i) => texts.forEach((b, j) => { if (j > i && a.l < b.r - 1 && b.l < a.r - 1 && a.top < b.b - 1 && b.top < a.b - 1) clash.push(a.t + ' × ' + b.t); }));
          /* the upper curve: share of points along it not under its label */
          const path = svg.querySelector('.ov-map-ln'); let seen = null;
          if (path) { const L = path.getTotalLength(); let vis = 0; const chip = path.closest('[data-ov-map]').querySelector('.ov-map-chip').getBBox();
            for (let k = 0; k <= 40; k++) { const p = path.getPointAtLength(L * k / 40); if (!(p.x > chip.x && p.x < chip.x + chip.width && p.y > chip.y && p.y < chip.y + chip.height)) vis++; } seen = vis / 41; }
          const pane = document.querySelector('[data-ov-map-pane]'), ph = pane && pane.querySelector('h3'), pr = pane && pane.getBoundingClientRect(), hr = ph && ph.getBoundingClientRect();
          return { us: cen('[data-ov-map="ours"].ov-map-us'), them: cen('.ov-map-them'), clash, seen,
            head: !!hr && hr.top >= pr.top && hr.bottom <= pr.bottom, zero: /\b0 duties/.test(svg.textContent), empty: !!document.querySelector('#ov-map .ov-map-empty') };
        });
        check(`1. ${tag}: our circle left, theirs right`, m.us != null && m.us < 1 / 3 && m.them != null && m.them > 2 / 3, `${m.us && m.us.toFixed(2)} / ${m.them && m.them.toFixed(2)}`);
        check(`2. ${tag}: no two labels overlap`, m.clash.length === 0, m.clash.join(' | ') || 'none');
        if (n) check(`3. ${tag}: the upper curve is mostly visible`, m.seen != null && m.seen > 0.5, String(m.seen && m.seen.toFixed(2)));
        check(`4. ${tag}: the panel's Renewal heading is in view`, m.head);
        if (!n) check(`5. ${tag}: no "0 duties", the empty line instead`, !m.zero && m.empty, JSON.stringify({ zero: m.zero, empty: m.empty }));
      }
      await page.close();
    }
    check('6. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
