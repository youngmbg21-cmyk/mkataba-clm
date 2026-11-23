/* DISCOVER (owner, 12 Nov 2026; RE-POINTED 15 Nov 2026 to THE NEW DISCOVER, f1055) — the flow, in a browser, at the owner's
   three screens, in the new look:
     1 · Contracts: no Discover button in the list's head; the "discover" link above Jambo's box
     2 · the link lands on the list of reads: its name, New read, chips All · Kept and four "+ filter" chips, seven columns,
         what each answered (RE-POINTED, P-42, owner's pick 20 Nov 2026: Discover the Legora + Stripe way)
     3 · a read chosen shows its summary; its results: search, answer chips, rows, the paper with its two links; ‹ All reads back
     4 · New read: the question on top, a folder ticked, the button says how many; the read on its own screen with Stop;
         Open the results shows that folder's contracts, said where; the page never left for Contracts
     5 · Stop: the read stops, the same place offers the rest beside Open the results
     6 · nothing spills; no page errors
   Run: node test/chromium/discover-page-verify.js   (pictures with DISCOVER_PAGE_SHOTS=<dir>) */
/* global state, setView, stPrefSet, newLookApply, regPlaceSet, regFoldersShut, currentUser, AC */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedDiscoverWorld } = require('../discover-world');

const SHOTS = process.env.DISCOVER_PAGE_SHOTS || '';
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const until = async (page, fn, arg, ms = 10000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
let fails = 0;
const check = (name, ok, got) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  ' + JSON.stringify(got === undefined ? null : got).slice(0, 600)}`); };

(async () => {
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const h = await startHati();
  const W = await seedDiscoverWorld(h);
  const ALL = ['DV-01', 'DV-02', 'DV-03', 'DV-04', 'DV-05', 'DV-06', 'DV-07', 'DV-08', 'DV-09', 'DV-10', 'DV-11'];
  const CAP = 'Is our liability capped, and at what?';
  const k0 = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, name: 'Liability cap', ids: ['DV-01'] } });
  await W.admin.json('/api/columns/' + k0.ask.id, { method: 'PUT', body: { rule: 'Capped at no more than one year of fees', fact: true } });
  await W.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, name: 'Liability cap', ids: ALL } });
  await W.admin.json('/api/ai/column', { method: 'POST', body: { question: 'When must an invoice be paid?', name: 'Payment days', ids: ALL.slice(0, 4) } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [wd, ht] of SCREENS) {
      const nm = `${wd}x${ht}`;
      const page = await browser.newPage({ viewport: { width: wd, height: ht } });
      const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
      const shot = async n => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${nm}-${n}.png`) }); };
      if (h.ai && typeof h.ai.slow === 'function') h.ai.slow(0);
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 11 && typeof currentUser === 'function' && !!currentUser() && typeof window.regPlaceSet === 'function', null, 30000);
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); if (typeof regFoldersShut === 'function') regFoldersShut(); regPlaceSet({ show: 'list' }); setView('register'); });

      /* 1 · Contracts */
      /* RE-POINTED (owner, 15 Nov 2026: "Remove discover button but leave the door or discover link"): no Discover button
         in the list's head; the way in is the "discover" link above Jambo's box */
      const WAY = '[data-ca-chip="reads"]';
      const list = await until(page, way => !!document.querySelector('#reg-tbody tr[data-row]') && !!document.querySelector(way), WAY, 15000);
      const C = await page.evaluate(way => { const b = document.querySelector(way);
        return { label: b ? b.innerText.trim() : '', pill: !!document.querySelector('#ct-place [data-ac-discover]'), old: !!document.querySelector('[data-ac-open]'), disc: !!document.querySelector('#ac-disc'), dock: (document.getElementById('ig-dock') || {}).innerText || '' }; }, WAY);
      check(`${nm} 1 Contracts: no Discover button in the list's head, the "discover" link above Jambo's box, no "+ Ask a column", no Discover section in Jambo's panel`,
        list && C.label === 'discover' && !C.pill && !C.old && !C.disc && !/Ask a pack|Ask a new question/.test(C.dock), C);
      await shot('1-contracts');

      /* RE-POINTED (owner, 15 Nov 2026: THE NEW DISCOVER, f1055): four screens — the list of reads, New read (the question
         on top, folders to tick), while it reads (its own screen), the results of that one read */
      /* 2 · the list of reads */
      if (list) await page.click(WAY);
      const up = list && await until(page, () => !!document.querySelector('#rd-page.dsn-page tr[data-dsn-run]') && !!document.getElementById('dsn-new'), null, 15000);
      /* RE-POINTED 17 Nov 2026 (#762): what each read found is drawn once its answers have loaded — asked for, bounded (on GitHub
         the first screen was read before the chips came) */
      /* RE-POINTED (P-42, owner's pick 20 Nov 2026: Discover the Legora + Stripe way): the four filters are "+ filter" chips
         (their menus carry data-dsn-fset), beside All · Kept; the table is Question · Status · Answered · To look at · Where ·
         By · When; what each found is the Answered bar (found against chosen), its status a soft badge */
      if (up) await until(page, () => !!document.querySelector('#rd-page tr[data-dsn-run] td:nth-child(3) .dsn-abar'), null, 6000);
      const P = up ? await page.evaluate(() => ({ view: state.view, head: (document.querySelector('.rdn-head .ctf-h') || {}).innerText, rows: document.querySelectorAll('#rd-page tr[data-dsn-run]').length,
        tabs: [...document.querySelectorAll('#rd-page .dsn-bar [data-dsn-ltab]')].map(x => x.getAttribute('data-dsn-ltab')),
        filters: [...new Set([...document.querySelectorAll('#rd-page .dsn-bar [data-dsn-fset]')].map(x => x.getAttribute('data-dsn-fset')))],
        selects: document.querySelectorAll('#rd-page select[data-dsn-f]').length,
        cols: [...document.querySelectorAll('#rd-page .dsn-table thead th')].map(t => t.textContent.trim()),
        found: [...document.querySelectorAll('#rd-page tr[data-dsn-run] td:nth-child(3) .dsn-abar')].length,
        status: [...document.querySelectorAll('#rd-page tr[data-dsn-run] td:nth-child(2) .apn-st')].length,
        cost: /Jambo call/i.test(document.getElementById('rd-page').innerText) })) : {};
      check(`${nm} 2 the list of reads: its name, New read, chips All · Kept and + Folder · Question · Asked by · When, Question · Status · Answered · To look at · Where · By · When, a status badge and an answered bar on each read, no cost`,
        up && P.view === 'reads' && P.head === 'Discover' && P.rows >= 2 && P.tabs.join('|') === 'all|kept' && P.filters.join('|') === 'folder|ask|by|when' && !P.selects
        && P.cols.join('|') === 'Question|Status|Answered|To look at|Where|By|When' && P.found >= 1 && P.status >= 1 && !P.cost, P);
      await shot('2-discover');

      /* 3 · a read chosen, then its results */
      if (up) await page.click('#rd-page tr[data-dsn-run]');
      const sum = up && await until(page, () => !!document.querySelector('#ins-panel [data-dsn-open]'), null, 8000);
      if (sum) await page.click('#ins-panel [data-dsn-open]');
      const res = sum && await until(page, () => !!document.getElementById('dsn-q') && document.querySelectorAll('#rd-page tr[data-dsn-row]').length >= 2 && !!document.querySelector('#ins-panel .dsc-paper'), null, 15000);
      /* RE-POINTED (P-42, owner's pick 20 Nov 2026: Discover the Legora + Stripe way): the tiles are chips — All N and the
         answers' own groups with their dots (data-dsn-tab) — the search at the right of them; Ask another and Export in the head.
         RE-POINTED 23 Nov 2026 (owner): search, All, then Answers ▾ whose menu items carry data-dsn-tab */
      const O = res ? await page.evaluate(() => ({ search: document.getElementById('dsn-q').type, tiles: document.querySelectorAll('#rd-page .dsn-bar [data-dsn-tab]').length, oldTiles: document.querySelectorAll('#rd-page .rdsc-tile').length,
        acts: !!document.querySelector('#rd-page [data-dsn-again]') && !!document.querySelector('#rd-page [data-dsn-copy]'), rows: document.querySelectorAll('#rd-page tr[data-dsn-row]').length,
        /* RE-POINTED 22 Nov 2026 (P-42 review, as drawn): the result's two acts are buttons under its title in the panel */
        links: [...document.querySelectorAll('#ins-panel .dsr-acts [data-dsc-open], #ins-panel .dsr-acts [data-dsc-redline]')].map(b => b.innerText.trim()), back: !!document.querySelector('#rd-page [data-dsn-back]') })) : {};
      check(`${nm} 3a a read chosen shows its summary; Open the results: a search, answer chips that filter (no tiles), Ask another and Export, its rows, the paper with its two links`,
        sum && res && O.search === 'search' && O.tiles >= 2 && !O.oldTiles && O.acts && O.rows >= 2 && O.links.join('|') === 'Open the paper|Redline it' && O.back, O);
      await shot('3-results');
      if (res) await page.click('#rd-page [data-dsn-back]');
      const backed = res && await until(page, () => !!document.querySelector('#rd-page tr[data-dsn-run]') && !document.getElementById('dsn-q'), null, 8000);
      check(`${nm} 3b ‹ All reads goes back to the list`, backed, { backed });

      /* 4 · New read: the question on top, a folder ticked, the read on its own screen, then its results */
      const Q = `Which country's law governs this contract? (${nm})`;
      if (backed) await page.click('#dsn-new');
      const nw = backed && await until(page, () => !!document.getElementById('dsc-q') && !!document.querySelector('#rd-page [data-dsn-pick="all"]'), null, 8000);
      const all = nw ? await page.evaluate(() => document.getElementById('dsc-go').innerText.trim()) : '';
      if (nw){ await page.fill('#dsc-q', Q); await page.click('#rd-page [data-dsn-pick="proc"]'); }
      const four = nw && await until(page, () => (document.getElementById('dsc-go') || {}).innerText === 'Read 4 contracts', null, 5000);
      check(`${nm} 4a New read: the box on top, "Read 11 contracts" for all, "Read 4 contracts" once one folder is ticked`, nw && all === 'Read 11 contracts' && four, { all, four });
      await shot('4-new');
      if (h.ai && typeof h.ai.slow === 'function') h.ai.slow(400);
      const calls0 = h.ai && h.ai.calls ? h.ai.calls.length : 0;
      const views = []; await page.exposeFunction('__dscView', v => { views.push(v); });
      await page.evaluate(() => { const was = window.setView; window.__dscWas = was; window.setView = function (v){ window.__dscView(String(v)); return was.apply(this, arguments); }; });
      if (four) await page.click('#dsc-go');
      /* RE-POINTED (P-42, owner's pick 20 Nov 2026): while it reads, the page is The Reading Room (.dsn-room) — the old flipbook is gone */
      /* RE-POINTED 22 Nov 2026 (P-42 review, as drawn): the reading title is the question itself */
      const live = four && await until(page, q => ((document.querySelector('#rd-page .ctf-h') || {}).innerText || '').trim() === q && !!document.getElementById('dsc-stop') && !!document.querySelector('#rd-page .dsn-room') && !document.querySelector('#rd-page .dsn-leg'), Q, 15000);
      await shot('5-reading');
      /* RE-POINTED (owner, 16 Nov 2026: "once the run is over, it should immediately jump to the results page instead of
         leaving us to press to get there"; f1072): a read that finished lands on its results by itself — no press */
      const done = live && await until(page, () => !(window.AC && AC.busy) && !!document.getElementById('dsn-q'), null, 40000);
      const after = done && !(await page.$('#rd-page [data-dsn-results]'));
      /* RE-POINTED (P-42): the line under the results' head is .dsn-sub (was .rdsc-sub) */
      const D = after ? await page.evaluate(() => ({ view: state.view, sub: (document.querySelector('#rd-page .dsn-sub') || {}).innerText || '', rows: document.querySelectorAll('#rd-page tr[data-dsn-row]').length, cols: (state.reg && state.reg.ask) || [] })) : {};
      check(`${nm} 4b the read stands on its own screen with Stop, then lands on its results by itself: the 4 of that folder, said where; the page never left; no column was brought onto Contracts`,
        live && done && after && D.view === 'reads' && /Procurement/.test(D.sub) && /\b4 read\b/.test(D.sub) && D.rows === 4 && !views.includes('register') && !D.cols.length
        && (!h.ai || !h.ai.calls || h.ai.calls.length > calls0), { live, done, after, D, views });
      await shot('6-after');

      /* 5 · Stop */
      if (after){ await page.click('#rd-page [data-dsn-back]'); await until(page, () => !!document.getElementById('dsn-new'), null, 8000); await page.click('#dsn-new'); await until(page, () => !!document.getElementById('dsc-q'), null, 8000); }
      if (h.ai && typeof h.ai.slow === 'function') h.ai.slow(900);
      if (after){ await page.click('#rd-page [data-dsn-pick="all"]'); await page.fill('#dsc-q', `Does the contract renew by itself? (${nm})`); await page.click('#dsc-go'); }
      const live2 = after && await until(page, () => !!document.getElementById('dsc-stop'), null, 15000);
      if (live2) await page.click('#dsc-stop');
      const stopped = live2 && await until(page, () => !document.getElementById('dsc-stop') && !!document.getElementById('dsc-carry') && !(window.AC && AC.busy), null, 20000);
      /* RE-POINTED 22 Nov 2026 (P-42 review, as drawn): stopped, the head offers Ask another; the bar offers the rest */
      const S = stopped ? await page.evaluate(() => ({ carry: (document.getElementById('dsc-carry') || {}).innerText || '', again: !!document.querySelector('#rd-page [data-dsn-again]'), view: state.view })) : {};
      check(`${nm} 5 Stop: the read stops on its own screen, and offers the rest ("Read the N left"), Ask another in its head`, live2 && stopped && S.view === 'reads' && /^Read the \d+ left$/.test(S.carry) && S.again, { live2, stopped, S });
      if (h.ai && typeof h.ai.slow === 'function') h.ai.slow(0);

      /* 6 · fits */
      const F = await page.evaluate(() => { const over = el => el ? el.scrollWidth - el.clientWidth : 0;
        /* a button sized to its words reads a pixel or two wider than its box on a fractional width; a CUT is a box narrower than its words by more than that */
        /* RE-POINTED (P-42): no cards on Discover now — the buttons, chips and pills of the page itself */
        const cut = [...document.querySelectorAll('#rd-page .dsc-btn, #rd-page .dsc-chip, #rd-page .rfp-pill, #rd-page .apn-chip, #rd-page .apn-tab, #rd-page #dsc-carry')].filter(e => e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().height > 40).length;
        return { page: document.documentElement.scrollWidth - window.innerWidth, ins: over(document.getElementById('ins-panel')), card: over(document.querySelector('#rd-page .apn-card')), cut }; });
      check(`${nm} 6 nothing spills: the page, the panel, the card; every button, chip and tab on one line`, F.page <= 0 && F.ins <= 1 && F.card <= 1 && F.cut === 0, F);
      check(`${nm} 7 no page errors`, !errs.length, errs);
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
