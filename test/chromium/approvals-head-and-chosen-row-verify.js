/* APPROVALS & SIGNING: THE HEAD STAYS AT THE TOP, THE CHOSEN ROW KEEPS ITS ROOM (owner's screenshots, 10 Nov 2026).
   The new look, a worklist long enough to scroll (the round-5 world and twelve more approvals), the three screens:
     1 · scrolled, the column head sits AT the sheet's top edge — no strip above it where rows show through — and
         what is painted just above its words is the head itself, not a row
     2 · scrolled, the head still has its hairline under it
     3 · the chosen row's bar stands at least 10px left of the row's mark, and the pixel between them is the row's
         grey, inside the sheet's margin (nothing pushed sideways: the mark has not moved)
   At the parent 1 and 3 fail: the head stops 20px short with rows above it; the bar touches the mark.
   Run on GitHub (run-all.js); here only by name: node test/chromium/approvals-head-and-chosen-row-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const { r5Contracts, R5_RULES, iso } = require('../round5-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const NAMES = [['E-commerce Distribution Agreement', 'Copia Global'], ['Digital & Influencer Campaign', 'Aleph Group'], ['Last-Mile Distribution — Western Region', 'Wasoko'],
  ['Corrugated Carton Supply', 'Statpack Industries Ltd'], ['Trade Activation & Field Marketing', 'Ogilvy Kenya'], ['Raw Material Supply Agreement — Juno Limited', 'Juno Limited'],
  ['Cold Chain Warehousing', 'Bidco'], ['Packaging Film Supply', 'Polyflex'], ['Fleet Leasing', 'Rift Haulage'], ['Security Services', 'KK Guards'], ['Sugar Haulage', 'Mumias Movers'], ['Shelf Space Rental', 'Quickmart']];

(async () => {
  const h = await startHati();
  const extra = NAMES.map((n, i) => Object.assign(fixtureContract('MK-1' + (10 + i), n[0], n[1], 'proc', 21000000 + i * 1300000, 'Under Review'), { lastAction: iso(-(116 - i * 3)) }));
  await seedWorkspace(h, { contracts: r5Contracts().concat(extra), approvalRules: R5_RULES });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
    const page = await browser.newPage({ viewport: { width: w, height: hh } });
    page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
    const at = `${w}×${hh}`;
    try {
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && typeof getContract === 'function' && !!getContract('MK-110'), null, 40000);
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
      await page.evaluate(() => caGo({ kind: 'go', place: 'approvals' }));
      const up = await until(page, () => document.querySelectorAll('#ap-scroll .apn-table tbody tr[data-ap-row]').length >= 8, null, 15000);
      if (!up) { check(`${at} the worklist is drawn`, false); await page.close(); continue; }
      /* 3 · the chosen row (before any scroll) */
      await page.click('#ap-scroll .apn-table tbody tr[data-ap-row]:nth-child(3) td:nth-child(2)');
      const sel = await until(page, () => !!document.querySelector('#ap-scroll .apn-table tr.is-sel'), null, 8000);
      const row = sel ? await page.evaluate(() => {
        const tr = document.querySelector('#ap-scroll .apn-table tr.is-sel'), td = tr.querySelector('td');
        const mark = td.querySelector('.ls-mk') || td.firstElementChild;
        const m = mark.getBoundingClientRect(), t = td.getBoundingClientRect(), sc = document.getElementById('ap-scroll').getBoundingClientRect();
        const b = getComputedStyle(td, '::before');
        const barX = t.left + (parseFloat(b.left) || 0);
        const barW = parseFloat(b.borderLeftWidth) || 0;
        const first = document.querySelector('#ap-scroll .apn-table tbody tr[data-ap-row]:not(.is-sel) td');
        const fm = (first.querySelector('.ls-mk') || first.firstElementChild).getBoundingClientRect();
        return { has: b.content !== 'none' && b.position === 'absolute', barW, gap: Math.round(m.left - (barX + barW)), inside: barX >= sc.left, same: Math.abs(fm.left - m.left) < 0.6,
          fill: b.backgroundColor, rowFill: getComputedStyle(td).backgroundColor };
      }) : null;
      check(`${at} 3 the chosen row's bar stands clear of the mark, inside the sheet, the mark where the others are`, !!row && row.has && row.barW >= 2 && row.gap >= 10 && row.inside && row.same && row.fill === row.rowFill, row);
      /* 1, 2 · scrolled */
      const moved = await page.evaluate(() => { const s = document.getElementById('ap-scroll'); s.scrollTop = 170; return s.scrollTop; });
      await until(page, () => document.getElementById('ap-scroll').scrollTop > 100, null, 4000);
      const head = await page.evaluate(() => {
        const s = document.getElementById('ap-scroll'), th = s.querySelector('.apn-table thead th');
        const a = s.getBoundingClientRect(), b = th.getBoundingClientRect(), cs = getComputedStyle(th);
        const hit = document.elementFromPoint(b.left + 20, b.top + 3);
        const above = document.elementFromPoint(b.left + 20, Math.max(a.top + 1, b.top - 6));
        return { gap: Math.round(b.top - a.top), hitHead: !!(hit && hit.closest('thead')), rowAbove: !!(above && above.closest('tbody')), line: /inset/.test(cs.boxShadow) || parseFloat(cs.borderBottomWidth) > 0, bg: cs.backgroundColor };
      });
      check(`${at} 1 scrolled, the head sits at the sheet's top with no row above it`, moved > 100 && head.gap <= 1 && head.hitHead && !head.rowAbove && !/rgba\(0, 0, 0, 0\)|transparent/.test(head.bg), Object.assign({ moved }, head));
      check(`${at} 2 scrolled, the head keeps its hairline`, head.line, head);
    } catch (e) { check(`${at} ran`, false, String(e).slice(0, 200)); }
    await page.close();
  }
  await browser.close();
  try { if (h.stop) await h.stop(); else if (h.close) await h.close(); } catch (_) {}
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
