/* THE BUG LOG'S NEWEST LAYOUT FAULTS, MEASURED (owner, 12 Nov 2026: "4 is also yes" — browser checks for the newest
   bug-log layout faults, so GitHub can say which are still real). A measuring instrument, not a test: it prints, for
   each fault, REAL (seen, with the numbers), NOT SEEN (measured and fine), GONE (the new look no longer draws that part)
   or NOT REACHED (the page or the part could not be put on screen), at the owner's three screens, and it never fails a run. Run by .github/workflows/layout-measure.yml.
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

      /* A · Our paper's preview: a built-in paper chosen (a press chooses, the preview stands beside it); any blank
         (.tpl-pf-blank, tplPfBlanksHtml) whose box overlaps the words on either side of it, or another blank */
      try {
        await page.evaluate(() => setView('templates'));
        await until(page, () => !!document.querySelector('[data-tpl-pf]'), null, 10000);
        await page.evaluate(() => { const rs = [...document.querySelectorAll('[data-tpl-pf]')]; const p = rs.find(x => /^builtin:/.test(x.getAttribute('data-tpl-pf'))) || rs[0]; if (p) p.click(); });
        if (!(await until(page, () => !!document.querySelector('.tpl-pf-blank'), null, 6000)))
          await page.evaluate(() => { const p = document.querySelector('[data-tpl-pf].is-on, [data-tpl-pf][aria-pressed="true"]'); if (p) p.click(); });
        await until(page, () => !!document.querySelector('.tpl-pf-blank'), null, 6000);
        const A = await page.evaluate(() => {
          const blanks = [...document.querySelectorAll('.tpl-pf-blank')].filter(b => b.getClientRects().length);
          const hits = []; const ov = (r, q) => { const ix = Math.min(r.right, q.right) - Math.max(r.left, q.left), iy = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top); return ix > 2 && iy > 2 ? Math.round(ix) : 0; };
          const textRects = n => { if (!n) return []; const rg = document.createRange(); rg.selectNodeContents(n); return [...rg.getClientRects()]; };
          for (const b of blanks){
            const rs = [...b.getClientRects()];
            const near = [b.previousSibling, b.nextSibling].filter(Boolean);
            for (const n of near){ const qs = n.nodeType === 3 ? textRects(n) : [...n.getClientRects()];
              for (const r of rs) for (const q of qs){ const px = ov(r, q); if (px) hits.push({ blank: (b.textContent || '').trim().slice(0, 30), beside: (n.textContent || '').trim().slice(0, 30), px }); } }
          }
          for (let i = 0; i < blanks.length; i++) for (let j = i + 1; j < blanks.length; j++){ const px = ov(blanks[i].getBoundingClientRect(), blanks[j].getBoundingClientRect()); if (px) hits.push({ blank: blanks[i].textContent.trim().slice(0, 30), beside: blanks[j].textContent.trim().slice(0, 30), px }); }
          const sheet = document.querySelector('.tpl-pf-sheet');
          return { paper: (document.querySelector('[data-tpl-pf].is-on .tpln-n, [data-tpl-pf].is-on b') || {}).textContent || null, blanks: blanks.length, sheet: !!sheet, hits };
        });
        if (!A.blanks) say('A', nm, 'NOT REACHED', A);
        else say('A', nm, A.hits.length ? 'REAL' : 'NOT SEEN', A.hits.length ? { paper: A.paper, hits: A.hits.slice(0, 3) } : `${A.paper || 'a paper'}: ${A.blanks} blanks, none overlapping`);
        const sh = await page.$('.tpl-pf-sheet'); if (sh) await sh.scrollIntoViewIfNeeded().catch(() => {});
        await page.screenshot({ path: path.join(OUT, `A-${nm}.png`) });
      } catch (e) { say('A', nm, 'NOT REACHED', String(e).slice(0, 160)); }

      /* B · Jambo's agents: the "Pieces of work" figures' inset inside their cards — the card's own padding (what the
         rule sets) and, once laid out, where the words actually start */
      try {
        await page.evaluate(() => setView('jambo'));
        await until(page, () => !!document.querySelector('.jh-kpis > div'), null, 10000);
        await page.evaluate(() => { const k = document.querySelector('.jh-kpis'); if (k) k.scrollIntoView({ block: 'center' }); });
        await until(page, () => { const d = document.querySelector('.jh-kpis > div'); return !!d && d.getBoundingClientRect().width > 0; }, null, 5000);
        const B = await page.evaluate(() => [...document.querySelectorAll('.jh-kpis > div')].map(d => { const r = d.getBoundingClientRect(), cs = getComputedStyle(d);
          const kids = [...d.children].map(k => k.getBoundingClientRect()).filter(k => k.width);
          return { padTop: parseFloat(cs.paddingTop), padLeft: parseFloat(cs.paddingLeft), shown: r.width > 0,
            left: kids.length ? Math.round(Math.min(...kids.map(k => k.left)) - r.left) : null, top: kids.length ? Math.round(Math.min(...kids.map(k => k.top)) - r.top) : null }; }));
        if (!B.length) say('B', nm, 'NOT REACHED', 'no .jh-kpis on the page');
        else { const tight = B.filter(x => x.padTop < 16 || x.padLeft < 16 || (x.left != null && x.left < 16) || (x.top != null && x.top < 16));
          say('B', nm, tight.length ? 'REAL' : 'NOT SEEN', { cards: B.length, shown: B.filter(x => x.shown).length, first: B[0] }); }
        await page.screenshot({ path: path.join(OUT, `B-${nm}.png`) });
      } catch (e) { say('B', nm, 'NOT REACHED', String(e).slice(0, 160)); }

      /* C · the map's head: "Save view" (#ig-save, shown once the map is grouped by anything but folder) on more than one line */
      try {
        await page.evaluate(() => { if (typeof hbOpenExplorer === 'function') hbOpenExplorer(); else { setView('dashboard'); if (typeof hbSetFace === 'function') hbSetFace('explorer'); } });
        await until(page, () => typeof intel === 'object' && !!document.querySelector('#ig-page, .ig-camerabar, canvas'), null, 12000);
        await page.evaluate(() => { try { if (typeof intelGraphApply === 'function') intelGraphApply('', { action: 'group', groupBy: 'status' }); } catch (_) {}
          if (intel.groupBy === 'folder' || !intel.groupBy) intel.groupBy = 'status';
          if (typeof updateIntelNote === 'function') updateIntelNote(); });
        await until(page, () => !!document.getElementById('ig-save'), null, 6000);
        const C = await page.evaluate(() => { const b = document.getElementById('ig-save');
          if (!b || !b.getClientRects().length) return null; const rs = b.getClientRects(), r = b.getBoundingClientRect(), cs = getComputedStyle(b);
          return { lines: rs.length > 1 ? rs.length : Math.max(1, Math.round((r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / (parseFloat(cs.lineHeight) || 18))), h: Math.round(r.height), w: Math.round(r.width), groupBy: intel.groupBy }; });
        if (!C) say('C', nm, 'NOT REACHED', '"Save view" did not show with the map grouped');
        else say('C', nm, C.lines > 1 ? 'REAL' : 'NOT SEEN', C);
        await page.screenshot({ path: path.join(OUT, `C-${nm}.png`) });
      } catch (e) { say('C', nm, 'NOT REACHED', String(e).slice(0, 160)); }

      /* D · the Handbook's "Which one do I need?" table (hbkPickTableHtml) against Jambo's panel. In the new look the
         Handbook is a chapter list (hbknRender), which draws no such table: then GONE, with what it does draw */
      try {
        await page.evaluate(() => setView('handbook'));
        await until(page, () => !!document.getElementById('hbk-page'), null, 10000);
        const D = await page.evaluate(() => {
          const pick = document.querySelector('.hbk-pick'); const newLook = !!document.querySelector('.hbkn-page');
          if (!pick) return { pick: false, newLook };
          const table = pick.querySelector('table'); pick.scrollIntoView({ block: 'center' });
          const r = table.getBoundingClientRect(); const panel = document.getElementById('ins-panel'); const pr = panel && panel.getBoundingClientRect();
          const cells = [...table.querySelectorAll('tr:first-child > *')]; const last = cells[cells.length - 1]; const lr = last && last.getBoundingClientRect();
          const atLast = lr ? document.elementFromPoint(Math.min(lr.left + lr.width / 2, innerWidth - 2), lr.top + lr.height / 2) : null;
          return { pick: true, newLook, tableRight: Math.round(r.right), panelLeft: pr && pr.width ? Math.round(pr.left) : null, under: !!(pr && pr.width && r.right > pr.left + 2), lastCellShows: !!(atLast && last.contains(atLast)) };
        });
        if (!D.pick) say('D', nm, D.newLook ? 'GONE' : 'NOT REACHED', D.newLook ? 'the new look\'s Handbook draws no "Which one do I need?" table' : 'no table and not the new look');
        else say('D', nm, (D.under || !D.lastCellShows) ? 'REAL' : 'NOT SEEN', D);
        await page.screenshot({ path: path.join(OUT, `D-${nm}.png`) });
      } catch (e) { say('D', nm, 'NOT REACHED', String(e).slice(0, 160)); }

      /* E · Parties: the longest-named party chosen through the one door (cuSelectParty); its "Draft an agreement with …"
         button (.cu-draft-with, data-cu-draft-with) against Jambo's panel */
      try {
        await page.evaluate(() => setView('customers'));
        await until(page, () => typeof cuCustomers === 'function' && cuCustomers().length > 0, null, 10000);
        const who = await page.evaluate(() => { const all = cuCustomers(); const long = all.slice().sort((a, b) => String(b.name).length - String(a.name).length);
          const pick = long.find(r => !(r.needs || []).some(x => x.it && x.it.kind === 'request')) || long[0]; if (pick) cuSelectParty(pick.key); return pick ? pick.name : null; });
        /* in the new look the list's panel carries no such button: the party's own page carries it, worded
           "Start a new agreement with …" (cunPartyPanelHtml) — the same door, measured there */
        if (!(await until(page, () => !!document.querySelector('[data-cu-draft-with]'), null, 5000)))
          await page.evaluate(() => { const all = cuCustomers(); const long = all.slice().sort((a, b) => String(b.name).length - String(a.name).length)[0]; if (long && typeof cuOpenCustomer === 'function') cuOpenCustomer(long.key); });
        await until(page, () => !!document.querySelector('[data-cu-draft-with]'), null, 8000);
        const E = await page.evaluate(() => { const bs = [...document.querySelectorAll('[data-cu-draft-with]')].filter(x => x.getClientRects().length); const b = bs.find(x => x.closest('#ins-panel')) || bs[0];
          if (!b || !b.getClientRects().length) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); const p = b.closest('#ins-panel') || b.closest('section, aside'); const pr = p ? p.getBoundingClientRect() : null;
          return { inPanel: !!b.closest('#ins-panel'), text: (b.textContent || '').trim().slice(0, 70), right: Math.round(r.right), panelRight: pr ? Math.round(pr.right) : null, spills: !!(pr && r.right > pr.right - 15), cut: b.scrollWidth > b.clientWidth + 1, lines: Math.round(r.height / (parseFloat(getComputedStyle(b).lineHeight) || 18)) }; });
        if (!E) say('E', nm, 'NOT REACHED', { party: who, why: 'no "Draft an agreement with" in the panel' });
        else say('E', nm, (E.spills || E.cut) ? 'REAL' : 'NOT SEEN', Object.assign({ party: who }, E));
        await page.screenshot({ path: path.join(OUT, `E-${nm}.png`) });
      } catch (e) { say('E', nm, 'NOT REACHED', String(e).slice(0, 160)); }

      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log('\n=== SUMMARY ===\n' + rows.join('\n'));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(0); });
