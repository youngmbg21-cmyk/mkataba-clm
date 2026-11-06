/* THE NEW LOOK'S HOME — EVERY BUTTON DOES SOMETHING (owner-reported 6 Nov 2026: "the open and look and decide
   buttons do not work"). The new look draws Home as #cn2-page; its rows carry the same doors as today's Home, but
   the row handler only listened inside #cn-page, so Look, Decide and Open did nothing.
     1 · A row's Look opens Jambo's piece in its row (this one already worked; kept so it stays so)
     2 · "Company needs you" Open goes to Settings
     3 · A row's Approve…/Decide goes to its contract
     4 · A row's Fill in goes to its contract's form
     5 · The counts, the week's days, the panel's Open links and its ways all move something
   At the parent 2–4 fail: the presses land on nothing.
   Run: node test/chromium/home-new-look-buttons-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const W = require('../round7-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati();
  await W.seedRound7(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-IT'), null, 40000);
  await page.evaluate(W.R7_IN_PAGE);
  await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });

  const home = async () => {
    await page.evaluate(() => { try { if (typeof closeModal === 'function') closeModal(); } catch (_){} caGo({ kind: 'go', place: 'counter' }); });
    return until(page, () => !!document.querySelector('#cn2-page #cn2-list .cn2-row'), null, 15000);
  };
  const snap = () => page.evaluate(() => ({ view: state.view, modal: (document.getElementById('modal-root') || {}).childElementCount || 0,
    cid: (typeof pdContract === 'function' && pdContract()) ? pdContract().id : '',
    look: [...document.querySelectorAll('#cn2-list .cn2-look')].map(x => x.getAttribute('data-hb-ag-item')).join(','),
    page: (document.querySelector('#dk-page') || {}).textContent || '' }));
  /* press the first visible element matching sel whose words match re; say whether anything moved */
  const press = async (sel, re, rowRe) => {
    if (!(await home())) return { found: false };
    const found = await page.evaluate(([s, src, rsrc]) => { document.querySelectorAll('[data-pp]').forEach(e => e.removeAttribute('data-pp'));
      const rx = new RegExp(src); const el = [...document.querySelectorAll(s)].find(e => e.getClientRects().length && rx.test((e.textContent || '').trim()) && (!rsrc || new RegExp(rsrc).test(((e.closest('.cn2-row') || {}).textContent || ''))));
      if (!el) return false; el.setAttribute('data-pp', '1'); el.scrollIntoView({ block: 'center' }); return true; }, [sel, re.source, rowRe ? rowRe.source : '']);
    if (!found) return { found: false };
    const before = await snap();
    await page.click('[data-pp="1"]', { timeout: 5000 }).catch(() => {});
    await until(page, b => { const a = { view: state.view, modal: (document.getElementById('modal-root') || {}).childElementCount || 0,
      look: [...document.querySelectorAll('#cn2-list .cn2-look')].length, page: (document.querySelector('#dk-page') || {}).textContent || '' };
      return a.view !== b.view || a.modal !== b.modal || a.look !== (b.look ? b.look.split(',').length : 0) || a.page !== b.page; }, before, 5000);
    const after = await snap();
    return { found: true, before, after, moved: Object.keys(after).filter(k => after[k] !== before[k]) };
  };

  const row = '#cn2-list .cn2-row .cn2-ac button';
  const r1 = await press(row, /^Look$|^Review$/);
  check('1 · a row\'s Look opens Jambo\'s piece in its row', r1.found && !!r1.after.look && r1.after.look !== r1.before.look, r1);
  const r2 = await press(row, /^Open$/, /needs you/);
  check('2 · a row\'s Open (Company needs you) goes to its place', r2.found && r2.moved.length > 0, r2);
  const r3 = await press(row, /^Approve|^Decide/);
  check('3 · a row\'s Approve…/Decide goes to its contract', r3.found && !!r3.after.cid && r3.after.view !== 'counter', r3);
  const r4 = await press(row, /^Fill in/);
  check('4 · a row\'s Fill in goes to its contract', r4.found && !!r4.after.cid && r4.after.view !== 'counter', r4);

  const dead = [];
  for (const [sel, re] of [['#cn2-counts button', /./], ['#cn-week button', /./], ['#jl-body button.ui-link', /^Open$/], ['#ins-panel button.jb-way', /./]]){
    const r = await press(sel, re); if (!r.found || !r.moved.length) dead.push(sel);
  }
  check('5 · the counts, the week, the panel\'s Open and its ways all move something', dead.length === 0, dead);

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
