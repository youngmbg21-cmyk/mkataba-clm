/* THE BUG LOG'S NEWEST LAYOUT FAULTS, MEASURED (owner, 12 Nov 2026: "4 is also yes" — browser checks for the newest
   bug-log layout faults, so GitHub can say which are still real). A measuring instrument, not a test: it prints, for
   each fault, REAL (seen, with the numbers), NOT SEEN (measured and fine) or NOT REACHED (the page or the part could not
   be put on screen), at the owner's three screens, and it never fails a run. Run by .github/workflows/layout-measure.yml.
     A · BUGLOG 21941 — Our paper's preview: a blank ("Counterparty") overlaps the words beside it
     B · BUGLOG 21941 — Jambo's agents: the "Pieces of work" figures sit less than 16px inside their cards
     C · BUGLOG 22020 — the map's head: "Save view" wraps to a second line at 1366 wide
     D · BUGLOG 21882 — the Handbook's "Which one do I need?" table runs under Jambo's panel
     E · BUGLOG 21843 — Parties' "Draft an agreement with <party>" runs past its panel with a long name
   Run: node test/chromium/_audit/buglog-layout-measure.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../../helpers');
const { seedHandbookWorld } = require('../../handbook-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, '..', 'shots', 'buglog-layout');
const SCREENS = [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]];
const rows = [];
const say = (k, nm, verdict, more) => { const line = `${verdict.padEnd(11)} ${k} ${nm}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`; rows.push(line); console.log(line); };
const until = async (page, fn, arg, ms = 12000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  try { await seedHandbookWorld(h); } catch (e) { console.log('seed failed', String(e).slice(0, 200)); }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [nm, W, H] of SCREENS){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => typeof setView === 'function' && typeof currentUser === 'function' && !!currentUser() && typeof state === 'object' && (state.contracts || []).length > 0, null, 40000);
      await page.evaluate(async () => { try { await stPrefSet('newLook', true); newLookApply(); } catch (_) {} });

      /* A · Our paper's preview: any blank whose box overlaps a neighbouring word's box */
      try {
        await page.evaluate(() => setView('templates'));
        await until(page, () => !!document.querySelector('.tpl-page'), null, 10000);
        await page.evaluate(() => { const p = document.querySelector('[data-tpl-pf="builtin:RM"], [data-tpl-pf]'); if (p) p.click(); });
        await page.waitForTimeout(1200);
        const A = await page.evaluate(() => {
          const host = document.querySelector('.tpl-page'); if (!host) return null;
          const blanks = [...host.querySelectorAll('.field-frozen, [data-field], [data-upblank], .tpl-blank')].filter(b => b.offsetParent);
          const hits = [];
          for (const b of blanks){
            const r = b.getBoundingClientRect(); if (!r.width || !r.height) continue;
            const sibs = [b.previousElementSibling, b.nextElementSibling].filter(Boolean);
            for (const s of sibs){ const q = s.getBoundingClientRect(); const ix = Math.min(r.right, q.right) - Math.max(r.left, q.left), iy = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
              if (ix > 2 && iy > 2) hits.push({ blank: (b.textContent || '').trim().slice(0, 30), beside: (s.textContent || '').trim().slice(0, 30), px: Math.round(ix) }); }
          }
          return { blanks: blanks.length, hits };
        });
        if (!A || !A.blanks) say('A', nm, 'NOT REACHED', A || 'no preview with blanks on screen');
        else say('A', nm, A.hits.length ? 'REAL' : 'NOT SEEN', A.hits.length ? A.hits.slice(0, 3) : `${A.blanks} blanks, none overlapping`);
        await page.screenshot({ path: path.join(OUT, `A-${nm}.png`) });
      } catch (e) { say('A', nm, 'NOT REACHED', String(e).slice(0, 160)); }

      /* B · Jambo's agents: the figures' inset inside their cards */
      try {
        await page.evaluate(() => setView('jambo'));
        await until(page, () => !!document.querySelector('.jh-kpis > div'), null, 10000);
        const B = await page.evaluate(() => [...document.querySelectorAll('.jh-kpis > div')].map(d => { const r = d.getBoundingClientRect(), cs = getComputedStyle(d);
          const kids = [...d.children].map(k => k.getBoundingClientRect()).filter(k => k.width);
          const left = Math.min(...kids.map(k => k.left)) - r.left, top = Math.min(...kids.map(k => k.top)) - r.top;
          return { pad: cs.padding, left: Math.round(left), top: Math.round(top) }; }));
        if (!B.length || B.some(x => x.left == null || x.top == null)) say('B', nm, 'NOT REACHED', B.length ? 'the cards hold nothing measurable (no laid-out child)' : 'no .jh-kpis on screen');
        else { const tight = B.filter(x => x.left < 16 || x.top < 16); say('B', nm, tight.length ? 'REAL' : 'NOT SEEN', tight.length ? tight.slice(0, 2) : B.slice(0, 2)); }
        await page.screenshot({ path: path.join(OUT, `B-${nm}.png`) });
      } catch (e) { say('B', nm, 'NOT REACHED', String(e).slice(0, 160)); }

      /* C · the map's head: "Save view" on more than one line */
      try {
        await page.evaluate(() => { setView('dashboard'); if (typeof hbSetFace === 'function') hbSetFace('explorer'); });
        await page.waitForTimeout(2500);
        const C = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.offsetParent && /^Save view$/.test((x.textContent || '').trim()));
          if (!b) return null; const r = b.getBoundingClientRect(), lh = parseFloat(getComputedStyle(b).lineHeight) || 18;
          return { h: Math.round(r.height), lines: Math.round((b.scrollHeight - (parseFloat(getComputedStyle(b).paddingTop) || 0) - (parseFloat(getComputedStyle(b).paddingBottom) || 0)) / lh), w: Math.round(r.width) }; });
        if (!C) say('C', nm, 'NOT REACHED', '"Save view" not on screen in this state (it shows once a set is drawn)');
        else say('C', nm, C.lines > 1 ? 'REAL' : 'NOT SEEN', C);
        await page.screenshot({ path: path.join(OUT, `C-${nm}.png`) });
      } catch (e) { say('C', nm, 'NOT REACHED', String(e).slice(0, 160)); }

      /* D · the Handbook's "Which one do I need?" table against Jambo's panel */
      try {
        await page.evaluate(() => setView('handbook'));
        await page.waitForTimeout(1500);
        const D = await page.evaluate(() => {
          const head = [...document.querySelectorAll('h1,h2,h3,h4,b,strong,p')].find(x => /Which one do I need\?/.test(x.textContent || ''));
          if (!head) return null;
          let t = head.closest('section, div'); let table = t && t.querySelector('table'); if (!table){ let n = head; for (let i = 0; i < 6 && n && !table; i++){ n = n.nextElementSibling; table = n && (n.matches('table') ? n : n.querySelector && n.querySelector('table')); } }
          if (!table) return { head: true, table: false };
          table.scrollIntoView({ block: 'center' });
          const r = table.getBoundingClientRect();
          const panel = [...document.querySelectorAll('#ins-panel, #ig-dock, .jl-frame, .hbk-side, [data-jl]')].map(p => p.getBoundingClientRect()).filter(p => p.width && p.left > r.left)[0] || null;
          const cells = [...table.querySelectorAll('tr:first-child > *')];
          const last = cells[cells.length - 1]; const lr = last && last.getBoundingClientRect();
          const atLast = lr ? document.elementFromPoint(Math.min(lr.left + lr.width / 2, innerWidth - 2), lr.top + lr.height / 2) : null;
          return { tableRight: Math.round(r.right), panelLeft: panel ? Math.round(panel.left) : null, under: !!(panel && r.right > panel.left + 2), lastCellShows: !!(atLast && last.contains(atLast)) };
        });
        if (!D || !D.head) say('D', nm, 'NOT REACHED', 'the table is not on the Handbook\'s first page');
        else say('D', nm, (D.under || D.lastCellShows === false) ? 'REAL' : 'NOT SEEN', D);
        await page.screenshot({ path: path.join(OUT, `D-${nm}.png`) });
      } catch (e) { say('D', nm, 'NOT REACHED', String(e).slice(0, 160)); }

      /* E · Parties: the longest party's "Draft an agreement with …" button against its panel */
      try {
        await page.evaluate(() => setView('customers'));
        await until(page, () => document.querySelectorAll('[data-cu-row], tr[data-ins-row]').length > 0, null, 10000);
        await page.evaluate(() => { const rs = [...document.querySelectorAll('[data-cu-row], tr[data-ins-row]')];
          const long = rs.sort((a, b) => (b.textContent || '').length - (a.textContent || '').length)[0]; if (long) long.click(); });
        await page.waitForTimeout(1200);
        const E = await page.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find(x => x.offsetParent && /^Draft an agreement with/.test((x.textContent || '').trim()));
          if (!b) return null; const r = b.getBoundingClientRect(); const p = b.closest('#ins-panel, .ins-panel, aside, .jl-frame'); const pr = p ? p.getBoundingClientRect() : null;
          return { text: (b.textContent || '').trim().slice(0, 60), right: Math.round(r.right), panelRight: pr ? Math.round(pr.right) : null, spills: !!(pr && r.right > pr.right + 1), cut: b.scrollWidth > b.clientWidth + 1 }; });
        if (!E) say('E', nm, 'NOT REACHED', 'no "Draft an agreement with" on screen');
        else say('E', nm, (E.spills || E.cut) ? 'REAL' : 'NOT SEEN', E);
        await page.screenshot({ path: path.join(OUT, `E-${nm}.png`) });
      } catch (e) { say('E', nm, 'NOT REACHED', String(e).slice(0, 160)); }

      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log('\n=== SUMMARY ===\n' + rows.join('\n'));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(0); });
