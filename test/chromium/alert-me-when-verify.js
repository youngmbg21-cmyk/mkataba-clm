/* ALERT ME WHEN (owner's pick by name, 23 Nov 2026: the drawing "Alert Me When") — the flow, in a browser, in the new look:
     1 · Discover's results head: Export ▾ is ONE button (no separate Download as Excel), Alert me when beside it
     2 · Export opens its small menu (Copy the table · Download as Excel); Esc closes it; a press opens, the same press shuts
     3 · Alert me when opens the window: with (this read's answers, Not found, Outside our playbook — none chosen), in,
         tell me; choose "Not capped", Start alerting; the button now reads "Alerting · Not capped"
     4 · a NEW contract not capped is stored through the API and the sweep runs: the bell's Alerts shows it under
         "Your alerts" with its tag "Your alert · …", the paper's words and Open
     5 · the tag opens the alert's own page with the hit (its "New · arrived" badge)
     6 · Discover's list has Reads · Alerts; Alerts lists the alert
     7 · nothing spills; no page errors
   AT THE PARENT every step fails: no Alert me when. Photos at the owner's three screens with ALERT_SHOTS=<dir>.
   Run: node test/chromium/alert-me-when-verify.js */
/* global state, setView, stPrefSet, newLookApply, dsnRuns, AC, loadBootstrap, watchLoad, panelDoorPress, openPanel, closeContextPanel, renderReads */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, fixtureContract } = require('../helpers');
const { seedDiscoverWorld } = require('../discover-world');

const SHOTS = process.env.ALERT_SHOTS || '';
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const until = async (page, fn, arg, ms = 10000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
let fails = 0;
const check = (name, ok, got) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  ' + JSON.stringify(got === undefined ? null : got).slice(0, 600)}`); };
const CAP = 'Is our liability capped, and at what?';
const NONE = 'Nothing in this Agreement limits or excludes the Supplier\'s liability arising from the provision of the Services.';
const body = (t, p) => `${t.toUpperCase()}\n\nThis agreement is made between Highland Corporate Ltd and ${p}.\n\n1. Definitions\nWords in this agreement have their ordinary meaning.\n\n2. Liability\n${NONE}`;

/* nothing spills out of its box, nothing runs under the side panel */
const spills = page => page.evaluate(() => {
  const out = [], panel = document.getElementById('ins-panel'), pr = panel ? panel.getBoundingClientRect() : null;
  document.querySelectorAll('#rd-page .dsn-racts > *, #rd-page .dsn-xmenu button, #rd-page .ctf-h, #rd-page .dsn-sub, #rd-page .apn-tab, .lgp .amw-chip, #rd-page .dsn-ltabs, #rd-page tr.dsn-row td').forEach(el => {
    const r = el.getBoundingClientRect(); if (!r.width) return;
    if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow === 'visible' && !el.closest('.dsn-xmenu')) out.push('spills ' + (el.className || el.tagName));
    if (pr && !el.closest('.lgp') && r.right > pr.left + 1 && r.left < pr.left) out.push('under the panel ' + (el.className || el.tagName));
  });
  return out.slice(0, 6);
});

(async () => {
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const h = await startHati();
  const W = await seedDiscoverWorld(h);
  const ALL = ['DV-01', 'DV-02', 'DV-03', 'DV-04', 'DV-05', 'DV-06', 'DV-07', 'DV-08', 'DV-09', 'DV-10', 'DV-11'];
  /* the company's rule first (an answer read before a rule is read again after it), then every contract */
  const k0 = await W.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, name: 'Liability cap', ids: ['DV-01'] } });
  await W.admin.json('/api/columns/' + k0.ask.id, { method: 'PUT', body: { rule: 'Capped at no more than one year of fees' } });
  await W.admin.json('/api/ai/column', { method: 'POST', body: { question: CAP, name: 'Liability cap', ids: ALL } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  let started = false;
  try {
    for (const [wd, ht] of SCREENS) {
      const nm = `${wd}x${ht}`;
      const page = await browser.newPage({ viewport: { width: wd, height: ht } });
      const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
      const shot = async n => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${nm}-${n}.png`) }); };
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 11 && typeof window.dsnRuns === 'function', null, 30000);
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); setView('reads'); });

      /* 1 · the results head */
      const listed = await until(page, () => !!document.querySelector('#rd-page.dsn-page tr[data-dsn-run]') && typeof dsnRuns === 'function' && dsnRuns().length > 0, null, 15000);
      /* what each read found is drawn once its answers have loaded (as discover-page-verify waits) */
      if (listed) await until(page, () => !!document.querySelector('#rd-page tr[data-dsn-run] td:nth-child(3) .dsn-abar'), null, 8000);
      if (listed) await page.evaluate(q => { const r = dsnRuns().find(x => x.askIds.length === 1) || null; void q; if (r){ const row = document.querySelector(`#rd-page tr[data-dsn-run="${r.id}"]`); if (row){ row.click(); document.querySelector(`#rd-page tr[data-dsn-run="${r.id}"]`).click(); } } }, CAP);
      const res = listed && await until(page, () => !!document.querySelector('#rd-page tr[data-dsn-row]') && !!document.querySelector('#rd-page [data-dsn-xopen]'), null, 15000);
      if (!started && res) await until(page, () => !!document.querySelector('#rd-page [data-amw-open]'), null, 8000);
      const H = res ? await page.evaluate(() => {
        const vis = el => !!el && !!el.offsetParent;
        return { exp: (document.querySelector('#rd-page [data-dsn-xopen]') || {}).innerText || '', xlsxShown: vis(document.querySelector('#rd-page [data-dsn-xlsx]')),
          amw: (document.querySelector('#rd-page [data-amw-open], #rd-page [data-amw-page]') || {}).innerText || '',
          order: [...document.querySelectorAll('#rd-page .dsn-racts > *')].map(x => x.getAttribute('data-dsn-again') ? 'again' : x.querySelector && x.querySelector('[data-dsn-xopen]') ? 'export' : x.matches('.dsn-amw') ? 'alert' : x.getAttribute('data-dsn-more') ? 'more' : '?') };
      }) : {};
      check(`${nm} 1 the results head: Export ▾ one button, no separate Download as Excel, Alert me when beside it`,
        res && /Export/.test(H.exp) && !H.xlsxShown && /Alert me when|Alerting/.test(H.amw) && H.order.indexOf('export') >= 0 && H.order.indexOf('alert') === H.order.indexOf('export') + 1, H);
      await shot('1-head');

      /* 2 · the Export menu */
      if (res) await page.click('#rd-page [data-dsn-xopen]');
      const M1 = res ? await page.evaluate(() => { const m = document.querySelector('#rd-page .dsn-xmenu'); return { open: !!m && !m.hidden, items: m ? [...m.querySelectorAll('[role="menuitem"] b')].map(b => b.textContent) : [] }; }) : {};
      await page.waitForTimeout(700); await shot('2-menu');
      if (res) await page.keyboard.press('Escape');
      const esc = res ? await page.evaluate(() => document.querySelector('#rd-page .dsn-xmenu').hidden) : false;
      if (res){ await page.click('#rd-page [data-dsn-xopen]'); await page.click('#rd-page [data-dsn-xopen]'); }
      const twice = res ? await page.evaluate(() => document.querySelector('#rd-page .dsn-xmenu').hidden) : false;
      check(`${nm} 2 Export opens its menu: Copy the table · Download as Excel; Esc closes it; the same press again closes it`,
        M1.open && M1.items.join('|') === 'Copy the table|Download as Excel' && esc && twice, { M1, esc, twice });

      /* 3 · the window, then Start alerting (once; the other screens photograph the window and the running button) */
      if (res && !started){
        await page.click('#rd-page [data-amw-open]');
        const win = await until(page, () => !!document.querySelector('#amw-form [data-amw-go]'), null, 6000);
        const Wd = win ? await page.evaluate(() => ({ title: document.querySelector('#amw-form .lgp-h').textContent, sub: document.querySelector('#amw-form .lgp-sub').textContent,
          chips: [...document.querySelectorAll('#amw-form .amw-chip')].map(c => c.textContent.trim()), on: document.querySelectorAll('#amw-form .amw-chip.is-on').length,
          rows: [...document.querySelectorAll('#amw-form .amw-row .lgp-k')].map(k => k.textContent), go: (document.querySelector('#amw-form [data-amw-go]') || {}).textContent,
          last: [...document.querySelectorAll('#amw-form .lgp-ft .ui-btn')].pop().textContent })) : {};
        check(`${nm} 3a the window: Alert me when, the question, with · in · tell me, this read's answers plus Not found and Outside our playbook, none chosen, Start alerting then Cancel last`,
          win && Wd.title === 'Alert me when' && Wd.sub.includes(CAP) && Wd.rows.join('|') === 'with|in|tell me' && Wd.chips.includes('Not capped') && Wd.chips.includes('Not found') && Wd.chips.includes('Outside our playbook') && Wd.on === 0 && Wd.go === 'Start alerting' && Wd.last === 'Cancel', Wd);
        /* in: "change" shows Discover's folders to tick; one ticked is said; All folders again clears them */
        if (win){
          await page.click('#amw-form [data-amw-fchange]');
          const F0 = await page.evaluate(() => [...document.querySelectorAll('#amw-form [data-amw-folder]')].map(x => x.getAttribute('data-amw-folder')));
          if (F0.length > 1) await page.click(`#amw-form [data-amw-folder="${F0[1]}"]`);
          const said = await page.evaluate(() => document.querySelector('#amw-form .amw-in > span').textContent);
          await page.click('#amw-form [data-amw-folder=""]');
          const back = await page.evaluate(() => document.querySelector('#amw-form .amw-in > span').textContent);
          await page.click('#amw-form [data-amw-fchange]');
          check(`${nm} 3c in: change lists the folders, one ticked is said, All folders I can see clears it`, F0[0] === '' && F0.length > 1 && said !== 'All folders I can see' && back === 'All folders I can see', { F0, said, back });
        }
        if (win){
          await page.evaluate(() => { const c = [...document.querySelectorAll('#amw-form .amw-chip')].find(x => x.textContent.trim() === 'Not capped'); if (c) c.click(); });
          await page.waitForTimeout(700); await shot('3-window');
          await page.click('#amw-form [data-amw-go]');
        }
        const on = win && await until(page, () => !document.querySelector('#amw-form') && /Alerting · Not capped/.test((document.querySelector('#rd-page .dsn-amw.is-on') || {}).innerText || ''), null, 8000);
        check(`${nm} 3b Start alerting: the button reads "Alerting · Not capped", soft green`, on, await page.evaluate(() => (document.querySelector('#rd-page .dsn-amw') || {}).outerHTML || ''));
        started = !!on;
        await shot('4-alerting');

        /* 4 · a new contract not capped arrives; the sweep reads it */
        await W.admin.json('/api/contracts/DV-21', { method: 'PUT', body: { contract: fixtureContract('DV-21', 'Fleet Services', 'Savanna Fuels', 'sales', 5e6, 'Signed', body('Fleet Services', 'Savanna Fuels')) } });
        const run = await W.admin.json('/api/watches/run', { method: 'POST', body: {} });
        check(`${nm} 4a the sweep reads the new contract and catches it once`, run.questions && run.questions.alerted === 1, run.questions);
      } else if (res){
        /* the other screens: the window over the page (opened by Change when on the running alert) */
        await page.click('#rd-page [data-amw-page]');
        if (await until(page, () => !!document.querySelector('#rd-page [data-amw-change]'), null, 8000)){
          await page.click('#rd-page [data-amw-change]');
          await until(page, () => !!document.querySelector('#amw-form'), null, 6000);
          await page.waitForTimeout(700); await shot('3-window');
          await page.click('#amw-form [data-amw-cancel]');
          await until(page, () => !document.querySelector('#amw-form'), null, 4000);
          await page.click('#rd-page [data-amw-all]');
          await page.evaluate(q => { const r = dsnRuns().find(x => x.askIds.length === 1) || null; void q; if (r){ const row = document.querySelector(`#rd-page tr[data-dsn-run="${r.id}"]`); if (row){ row.click(); document.querySelector(`#rd-page tr[data-dsn-run="${r.id}"]`).click(); } } }, CAP);
          await until(page, () => !!document.querySelector('#rd-page .dsn-amw.is-on'), null, 8000);
          await shot('4-alerting');
        }
      }

      /* the bell: Your alerts, the hit, its tag */
      await page.evaluate(async () => { if (typeof loadBootstrap === 'function') await loadBootstrap(); if (typeof watchLoad === 'function') await watchLoad(true); });
      await page.evaluate(() => panelDoorPress());
      const bell = await until(page, () => !!document.querySelector('[data-ndb-head="alerts"]') && !!document.querySelector('.ndb-amw [data-cn-amw]'), null, 8000);
      const B = bell ? await page.evaluate(() => { const r = document.querySelector('.ndb-amw');
        return { head: document.querySelector('[data-ndb-head="alerts"]').textContent, title: r.querySelector('b').textContent, sub: r.querySelector('.ndb-w > span').textContent,
          quote: (r.querySelector('.ndb-q') || {}).textContent || '', tag: r.querySelector('[data-cn-amw]').textContent, open: r.querySelector('.ndb-amw-open').textContent, first: document.querySelector('.ndb .ndb-h').getAttribute('data-ndb-head') }; }) : {};
      check(`${nm} 4b Alerts: "Your alerts" first, "Alert: a new contract is not capped", the contract and its party, the paper's words, the tag and Open`,
        bell && B.head === 'Your alerts' && B.first === 'alerts' && B.title === 'Alert: a new contract is not capped' && /Fleet Services · Savanna Fuels/.test(B.sub) && /^§ \d+ · \S/.test(B.quote) && /^Your alert · Is our liability capped\?$/.test(B.tag) && B.open === 'Open', B);
      await page.waitForTimeout(700); await shot('5-alerts');

      /* 5 · the tag opens the alert's own page, the hit on it */
      if (bell) await page.click('.ndb-amw [data-cn-amw]');
      const pg = bell && await until(page, () => !!document.querySelector('#rd-page tr[data-amw-row="DV-21"]'), null, 8000);
      const PG = pg ? await page.evaluate(() => ({ back: (document.querySelector('#rd-page [data-amw-all]') || {}).textContent, title: document.querySelector('#rd-page .ctf-h').textContent,
        acts: [...document.querySelectorAll('#rd-page .dsn-racts button')].map(b => b.textContent), badge: (document.querySelector('#rd-page tr[data-amw-row] .amw-new') || {}).textContent || '',
        search: !!document.getElementById('amw-q'), chips: [...document.querySelectorAll('#rd-page [data-amw-tab]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
        cols: [...document.querySelectorAll('#rd-page .amw-table thead th')].map(t => t.textContent.trim()), panel: !!document.querySelector('#ins-panel .dsr-acts') })) : {};
      check(`${nm} 5 the tag opens the alert's page: ‹ All alerts, its name, Change when · Stop alerting, All 1 · Not capped 1, a search, the hit with "New · arrived", the paper beside it`,
        pg && PG.back === '‹ All alerts' && PG.title === 'Alert: a new contract is not capped' && PG.acts.join('|') === 'Change when|Stop alerting' && /^New · arrived/.test(PG.badge)
          /* RE-POINTED 23 Nov 2026 (Discover: search, All and an Answers dropdown on one line): the answers are items of
             the Answers menu, each its word then its count in their own spans (no space between them in the text) */
          && PG.search && PG.chips[0] === 'All 1' && PG.chips.some(c => /^Not capped\s*1$/.test(c)) && PG.cols.join('|') === 'Contract|Answer|Against our playbook|§' && PG.panel, PG);
      if (pg) await page.evaluate(() => { if (typeof closeContextPanel === 'function') closeContextPanel(); });
      await page.waitForTimeout(250);
      const S1 = pg ? await spills(page) : [];
      await shot('6-page');

      /* 6 · Discover's list: Reads · Alerts */
      if (pg) await page.click('#rd-page [data-amw-all]');
      const tabs = pg && await until(page, () => !!document.querySelector('#rd-page [data-amw-lrow]'), null, 8000);
      const T = tabs ? await page.evaluate(() => ({ tabs: [...document.querySelectorAll('#rd-page .dsn-ltabs [role="tab"]')].map(t => t.textContent.replace(/\s+/g, ' ').trim()),
        on: (document.querySelector('#rd-page .dsn-ltabs [aria-selected="true"]') || {}).getAttribute ? document.querySelector('#rd-page .dsn-ltabs [aria-selected="true"]').getAttribute('data-dsn-lview') : '',
        row: (document.querySelector('#rd-page [data-amw-lrow]') || {}).innerText || '' })) : {};
      check(`${nm} 6 Discover's list: Reads · Alerts, the Alerts tab lists the alert (its question, Not capped, 1 caught)`,
        tabs && T.tabs.length === 2 && /^Reads \d+$/.test(T.tabs[0]) && T.tabs[1] === 'Alerts 1' && T.on === 'alerts' && T.row.includes(CAP) && /Not capped/.test(T.row), T);
      const S2 = tabs ? await spills(page) : [];
      await shot('7-alerts-tab');
      check(`${nm} 7 nothing spills or runs under the panel; no page errors`, !S1.length && !S2.length && !errs.length, { S1, S2, errs });
      await page.close();
    }
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
