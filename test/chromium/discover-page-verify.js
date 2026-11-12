/* DISCOVER IS A PAGE (owner, 12 Nov 2026; drawn first, artifact Ri22tYVLWnB74aVhDjzurp) — the flow, in a browser, at
   the owner's three screens, in the new look:
     1 · Contracts: a Discover pill where "+ Ask a column" stood; no Discover section in Jambo's panel
     2 · the press lands on the Discover page: its name, the ask box and its one button saying how many contracts
         (the list as filtered), the chips, Kept · Packs · Every read, Reads' five columns
     3 · a question opens under its row: answers with their words; the panel shows the paper, the words lit, with
         Open this contract · Start redlining this clause and Jambo's box under it; pressed again it closes and the
         panel is the question's summary
     4 · asked: the question leads the table while Jambo reads, Stop stands in the box, the panel shows a paper; at
         the end the new question is open in front, on Every read; the page never left for Contracts
     5 · Stop: the read stops, the same place offers the rest
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
      const list = await until(page, () => !!document.querySelector('#reg-tbody tr[data-row]') && !!document.querySelector('[data-ac-discover]'), null, 15000);
      const C = await page.evaluate(() => { const b = document.querySelector('[data-ac-discover]');
        return { label: b ? b.innerText.trim() : '', before: b ? getComputedStyle(b, '::before').content : '', old: !!document.querySelector('[data-ac-open]'), disc: !!document.querySelector('#ac-disc'), dock: (document.getElementById('ig-dock') || {}).innerText || '' }; });
      check(`${nm} 1 Contracts: a Discover pill (no "+"), no "+ Ask a column", no Discover section in Jambo's panel`,
        list && C.label === 'Discover' && !/\+/.test(C.before) && !C.old && !C.disc && !/Ask a pack|Ask a new question/.test(C.dock), C);
      await shot('1-contracts');

      /* 2 · the page */
      if (list) await page.click('[data-ac-discover]');
      const up = list && await until(page, () => !!document.querySelector('#rd-page.dsc-page tr[data-rd-row]') && !!document.getElementById('dsc-go'), null, 15000);
      const P = up ? await page.evaluate(() => ({ view: state.view, head: (document.querySelector('.rdn-head .ctf-h') || {}).innerText, btn: document.getElementById('dsc-go').innerText.trim(), box: !!document.getElementById('dsc-q'),
        tabs: [...document.querySelectorAll('[data-rdn-tab]')].map(b => b.textContent.replace(/\s+/g, ' ').trim().replace(/ \d+$/, '')), scope: (document.querySelector('.dsc-scope') || {}).innerText || '',
        chips: [...document.querySelectorAll('.dsc-chips [data-dsc-pack]')].map(b => b.innerText.trim()), team: document.querySelectorAll('.dsc-chips [data-dsc-q]').length, cols: [...document.querySelectorAll('.dsc-table thead th')].map(t => t.textContent.trim()),
        cost: /Jambo call/i.test(document.getElementById('rd-page').innerText) })) : {};
      check(`${nm} 2 the Discover page: its name, one box, "Ask 11 contracts", the chips, Kept · Packs · Every read, the five columns, the list said, no cost`,
        up && P.view === 'reads' && P.head === 'Discover' && P.box && P.btn === 'Ask 11 contracts' && P.tabs.join('|') === 'Kept|Packs|Every read' && /All · 11/.test(P.scope)
        && P.chips.some(c => /Due diligence/.test(c)) && P.team >= 1 && P.team <= 4 && P.cols.join('|') === 'Question|Read|Answers|On the list of|Asked' && !P.cost, P);
      await shot('2-discover');

      /* 3 · open and close */
      if (up) await page.click('#rd-page tr[data-rd-row]');
      const open = up && await until(page, () => document.querySelectorAll('#rd-page .dsc-opn .dsc-a').length >= 2 && !!document.querySelector('#ins-panel .dsc-paper mark'), null, 15000);
      const O = open ? await page.evaluate(() => ({ rows: document.querySelectorAll('#rd-page .dsc-opn .dsc-a').length, first: (document.querySelector('#rd-page .dsc-opn .dsc-a .ac-ans') || {}).className || '',
        links: [...document.querySelectorAll('#ins-panel .jb-ways.is-own .jb-way')].map(b => b.innerText.trim()), box: !!document.querySelector('#ins-panel .jl-foot textarea, #ins-panel .jl-foot input, #ins-panel [data-jl-ask]'),
        mark: document.querySelector('#ins-panel .dsc-paper mark').innerText.length, tab: (document.querySelector('#ins-panel [data-jl-home] .pd-tab-w') || {}).textContent })) : {};
      check(`${nm} 3a a question opens under its row: its answers, the risky first; the panel is the paper with the words lit, the two links and Jambo's box under it`,
        open && O.rows >= 2 && O.rows <= 7 && O.mark > 5 && O.links.join('|') === 'Open this contract|Start redlining this clause' && O.box && O.tab === 'Where it was read', O);
      await shot('3-open');
      if (open) await page.click('#rd-page tr[data-rd-row].is-open');
      const shut = open && await until(page, () => !document.querySelector('#rd-page .dsc-opn') && /Where it shows/i.test((document.getElementById('ins-panel') || {}).innerText || ''), null, 8000);
      check(`${nm} 3b pressed again it closes; the panel is the question's summary (Where it shows, Delete question)`, shut && /Delete question/.test(await page.evaluate(() => document.getElementById('ins-panel').innerText)), { shut });
      await shot('4-closed');

      /* 4 · ask */
      const Q = `Which country's law governs this contract? (${nm})`;
      if (h.ai && typeof h.ai.slow === 'function') h.ai.slow(400);
      const calls0 = h.ai && h.ai.calls ? h.ai.calls.length : 0;
      const views = []; await page.exposeFunction('__dscView', v => { views.push(v); });
      await page.evaluate(() => { const was = window.setView; window.__dscWas = was; window.setView = function (v){ window.__dscView(String(v)); return was.apply(this, arguments); }; });
      if (up){ await page.fill('#dsc-q', Q); await page.click('#dsc-go'); }
      const live = up && await until(page, () => !!document.querySelector('#rd-page tr.is-live') && !!document.getElementById('dsc-stop'), null, 15000);
      const paper = live && await until(page, () => !!document.querySelector('#ins-panel .dsc-paper') && /^Reading/.test((document.querySelector('#ins-panel [data-jl-home] .pd-tab-w') || {}).textContent || ''), null, 15000);
      await shot('5-reading');
      const done = live && await until(page, () => !document.querySelector('#rd-page tr.is-live') && !!document.getElementById('dsc-go') && !!document.querySelector('#rd-page tr[data-rd-row].is-open'), null, 60000);
      const D = done ? await page.evaluate(() => ({ view: state.view, tab: (document.querySelector('[data-rdn-tab].is-on') || {}).getAttribute('data-rdn-tab'), q: (document.querySelector('#rd-page tr.is-open .cun-sub') || {}).innerText || '',
        read: (document.querySelector('#rd-page tr.is-open td:nth-child(2)') || {}).innerText || '', box: document.getElementById('dsc-q').value, cols: (state.reg && state.reg.ask) || [] })) : {};
      check(`${nm} 4 asked: the question leads the table while Jambo reads, Stop in the box, a paper in the panel; then it stands open on Every read, read 11 of 11; the page never left; no column was brought onto the list`,
        live && paper && done && D.view === 'reads' && D.tab === 'all' && D.q === Q && /11 of 11/.test(D.read) && D.box === '' && !views.includes('register') && !D.cols.length
        && (!h.ai || !h.ai.calls || h.ai.calls.length > calls0), { live, paper, done, D, views });
      await shot('6-after');

      /* 5 · Stop */
      if (h.ai && typeof h.ai.slow === 'function') h.ai.slow(900);
      if (done){ await page.fill('#dsc-q', `Does the contract renew by itself? (${nm})`); await page.click('#dsc-go'); }
      const live2 = done && await until(page, () => !!document.getElementById('dsc-stop'), null, 15000);
      if (live2) await page.click('#dsc-stop');
      const stopped = live2 && await until(page, () => !document.getElementById('dsc-stop') && (!!document.getElementById('dsc-carry') || !!document.getElementById('dsc-go')) && !(window.AC && AC.busy), null, 30000);
      const S = stopped ? await page.evaluate(() => ({ carry: (document.getElementById('dsc-carry') || {}).innerText || '', view: state.view })) : {};
      check(`${nm} 5 Stop: the read stops here, and the same place offers the rest ("Read the N left")`, live2 && stopped && S.view === 'reads' && /^Read the \d+ left$/.test(S.carry), { live2, stopped, S });
      if (h.ai && typeof h.ai.slow === 'function') h.ai.slow(0);

      /* 6 · fits */
      const F = await page.evaluate(() => { const over = el => el ? el.scrollWidth - el.clientWidth : 0;
        const cut = [...document.querySelectorAll('#rd-page .dsc-btn, #rd-page .dsc-chip, #rd-page .apn-tab')].filter(e => e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().height > 40).length;
        return { page: document.documentElement.scrollWidth - window.innerWidth, ins: over(document.getElementById('ins-panel')), card: over(document.querySelector('#rd-page .apn-card')), cut }; });
      check(`${nm} 6 nothing spills: the page, the panel, the card; every button, chip and tab on one line`, F.page <= 0 && F.ins <= 1 && F.card <= 1 && F.cut === 0, F);
      check(`${nm} 7 no page errors`, !errs.length, errs);
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
