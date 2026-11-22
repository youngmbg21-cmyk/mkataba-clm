/* READS AND COLUMNS AS DRAWN (owner, 8 Nov 2026, over the Reads & Contracts drawing: "From when you are asking for a read
   and how a new column is added during the read and how you remove that column from the contracts list afterwards …
   structure the panel and the top of the page so that the fonts are not too big and they are in a straight line";
   "do not remove the interactive feature in the top right of the side panel"; "in the iPad view, the words are extending
   or overlapping to neighboring columns"). New look on, a folder of 60, at the owner's three screens:
     1 · the folder's top on ONE line, nothing above 15px; "+ Ask a column" a grey pill; the panel: This folder
         (Contracts · Need you · Signed · On paper), then + Ask a column and All your reads
     2–5 RETIRED 22 Nov 2026 with Ask a column (form, reading card, column card and head, its ⋯ menu)
     6 · Discover's list of reads, the chosen read in the panel with Open the results and Delete question
   No word of cost anywhere on these screens. At the parent 1, 2, 4, 5 and 6 fail.
   Run: node test/chromium/reads-and-columns-as-drawn-verify.js (RC_SHOTS=<dir> takes the pictures) */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const SHOTS = process.env.RC_SHOTS || '';
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const COST = /\bcalls?\b|\bfree\b|costs? nothing|spent/i;

(async () => {
  const h = await startHati();
  const cs = []; const P = ['Juno LLC', 'Saw Sawa LLC', 'Delta LLC', 'Jumenza LLC', 'Bull', 'Nandi Dairy'];
  for (let i = 0; i < 60; i++) cs.push(fixtureContract('MK-' + (300 + i), i % 3 ? 'Mutual Non-Disclosure' : 'Warehousing Logistics Agreement', P[i % 6], 'proc', i % 2 ? 0 : 800000 * (i + 1),
    i % 2 ? 'Drafting' : 'Under Review', '1. Governing law\nThis agreement is governed by the laws of ' + (i % 4 ? 'Kenya' : 'Sweden') + '.\n\n2. Payment\nInvoices are paid within 30 days.'));
  await seedWorkspace(h, { contracts: cs });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [nm, VW, VH] of [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]]){
      const page = await browser.newPage({ viewport: { width: VW, height: VH } });
      const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
      const shot = async n => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/rc-${n}-${nm}.png` }); };
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => typeof currentUser === 'function' && !!currentUser() && typeof setView === 'function' && state.contracts.length >= 60, null, 40000);
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); regPlaceSet({ show: 'list' }); setView('register'); });
      await until(page, () => [...document.querySelectorAll('[data-ctf-folder]')].some(b => /Procurement/.test(b.innerText)), null, 15000);
      /* RE-POINTED (P-31, owner's pick 20 Nov 2026: Contracts the Legora + Stripe way): a folder's row on the landing's table
         CHOOSES on the first press (.is-sel, the panel sums it up) and opens on the second */
      await page.evaluate(() => { const b = [...document.querySelectorAll('.ctf-ftable tr[data-ctf-folder]')].find(x => /Procurement/.test(x.innerText)); if (b) b.click(); });
      if (await until(page, () => !!document.querySelector('.ctf-ftable tr.is-sel[data-ctf-folder]'), null, 4000))
        await page.evaluate(() => { const b = document.querySelector('.ctf-ftable tr.is-sel[data-ctf-folder]'); if (b) b.click(); });
      /* RE-POINTED 21 Nov 2026 (P-31, as drawn): the folder's panel is the list's own (#ig-dock .ctls-list): a sentence of its rows, where they stand, when they end, what needs you; no money */
      await until(page, () => !!document.querySelector('#reg-tbody tr[data-row]') && !!document.querySelector('#ig-dock .ctls-list'), null, 15000);
      await page.evaluate(() => document.fonts && document.fonts.ready);

      /* 1 · the top and the folder's panel */
      const T = await page.evaluate(() => { const top = document.querySelector('#ct-place .ct-top');
        if (!top) return { err: 'no #ct-place .ct-top: the folder\'s list was not drawn' };
        const parts = [...top.querySelectorAll('.ctf-back, .ctf-crumb, .ct-h, .ct-facts')].filter(e => e.getBoundingClientRect().width);
        const cy = parts.map(e => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; }), mids = Math.max(...cy) - Math.min(...cy) <= 4 ? 1 : 2;
        const ac = document.querySelector('#ct-place .ac-btn'), p = document.querySelector('#ig-dock .ctls-list');
        return { mids, big: parts.filter(e => parseFloat(getComputedStyle(e).fontSize) > 15).map(e => e.className), crumb: (top.querySelector('.ctf-crumb') || {}).textContent,
          pill: !!ac && getComputedStyle(ac).backgroundColor !== 'rgba(0, 0, 0, 0)' && getComputedStyle(ac).textDecorationLine === 'none', panel: p ? p.innerText : '' }; });
      /* RE-POINTED (owner's pick by name, 15 Nov 2026: At a Glance): the panel counts the folder, then When they end, Where
         the money is; Discover is no longer in the panel (the list head keeps its pill until Discover moves to the Board) */
      /* RE-POINTED (owner, 15 Nov 2026): no Discover button in the list's head; the "discover" link above Jambo's box stays */
      /* RE-POINTED 19 Nov 2026 (the Contracts list as drawn, owner's "the new design for contracts lists page"): the top
         STACKS — "‹ Folders" small over the title, the title serif at 26px with the counts beside it; no "/" crumb */
      check(`${nm} 1 the top: "‹ Folders" over the title, only the title above 15px, no "/" crumb; no Discover button; the panel At a Glance (owner, 15 Nov 2026), no money in it (P-31)`,
        T.mids === 2 && T.big.length === 1 && /\bct-h\b/.test(T.big[0]) && !T.crumb && !T.pill && /^\s*60\s*contracts[\s\S]*WHEN THEY END/i.test(T.panel) && !/WHERE THE MONEY IS/i.test(T.panel) /* RE-POINTED, INVERTED (P-31, owner's pick 20 Nov 2026: MONEY IS NEVER A BIG PART OF A PAGE — no money in a side panel) */ && !/Discover/.test(T.panel) && !/Ask a column|All your reads/.test(T.panel) && !COST.test(T.panel), T);
      await shot('1-rest');

      /* RETIRED 22 Nov 2026 (owner: "There is not asking a column again only the features related to discovery"): checks 2–5b —
         Ask a column's form, its reading card, the column's card and head, the head's ⋯ menu (Sort · Read the other N · Rename
         · Remove, Undo). All of it is deleted: a question is asked on Discover's New read and its answers stand there. The read
         check 6 needs is made through the one engine route, as Discover's New read makes it. Every question asked in Discover,
         and no question column on Contracts: every-question-in-discover-verify. */
      if (nm === 'laptop-a') await page.evaluate(() => api('ai/column', 'POST', { question: 'What are the governing laws?', name: 'Governing law', ids: state.contracts.slice(0, 50).map(c => c.id) }));

      /* 6 · Reads — RE-POINTED (owner, 15 Nov 2026: THE NEW DISCOVER, f1055): the list of reads — one top line with New
         read, When · Question · Where · Read · Found · By, nothing out of its cell; the chosen read's summary in the panel
         with Open the results and Delete question; no cost
         RE-POINTED (P-42, owner's pick 20 Nov 2026: Discover the Legora + Stripe way): the title stands alone with New read
         (its facts line is gone), the ask box under it (#dsn-ask, it only fills New read), and the table is Question · Status ·
         Answered · To look at · Where · By · When
         RE-POINTED 22 Nov 2026 (P-42 review: the picked drawing): beside the title, one quiet line — "Every read your team has
         run · N reads · N questions" (.dsn-facts) — and New read with its "+" */
      await page.evaluate(() => setView('reads'));
      await until(page, () => !!document.querySelector('#rd-page.dsn-page tbody tr[data-dsn-run]') && !!document.querySelector('#ins-panel [data-dsn-open]'), null, 15000);
      const R = await page.evaluate(() => { const hd = document.querySelector('.rdn-head');
        const mids = [...hd.querySelectorAll('.ctf-h, #dsn-new')].map(e => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; });
        const out = [...document.querySelectorAll('.dsn-table td, .dsn-table th')].filter(td => { const r = td.getBoundingClientRect(); return [...td.querySelectorAll('*')].some(e => { const x = e.getBoundingClientRect(); return x.width && (x.right > r.right + 1 || x.left < r.left - 1); }); }).length;
        return { head: hd.innerText.replace(/\s+/g, ' ').trim(), ask: !!document.querySelector('#rd-page #dsn-ask'), facts: !!hd.querySelector('.ctf-hf'), oneLine: Math.max(...mids) - Math.min(...mids) <= 6,
          cols: [...document.querySelectorAll('.dsn-table thead th')].map(t => t.textContent.trim()), out, panel: document.getElementById('ins-panel').innerText, page: document.getElementById('rd-page').innerText }; });
      check(`${nm} 6 Discover's list of reads: the title alone on one top line with New read, the ask box under it, the seven columns, nothing out of its cell; the panel's Open the results and Delete question`,
        /^Discover\s*Every read your team has run · \d+ reads? · \d+ questions?\s*\+\s*New read$/.test(R.head) && !R.facts && R.ask && R.oneLine && R.cols.join('|') === 'Question|Status|Answered|To look at|Where|By|When' && R.out === 0
        && /Open the results/.test(R.panel) && /Delete question/.test(R.panel) && !COST.test(R.panel + R.page), { head: R.head, ask: R.ask, facts: R.facts, oneLine: R.oneLine, cols: R.cols, out: R.out, panel: R.panel.slice(0, 300) });
      await shot('7-reads');
      check(`${nm} 7 no page errors`, !errs.length, errs);
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
