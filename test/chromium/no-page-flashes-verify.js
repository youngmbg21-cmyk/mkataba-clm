/* NO PAGE FLASHES ON THE WAY (owner, 16-18 Nov 2026: "again, the issue of a flashing page before my destination …
   I have tried to address this issue many many times … not only in this particular case but overall"; f1095).
   Nothing ever watched for it: every check asked where a press LANDED, none what was painted on the way, so each fix
   held one door and the next change could bring a flash back unseen. This check presses the common doors for real
   and records EVERY painted frame (requestAnimationFrame) until it settles, on a slowed computer (CPU ×4, 150 ms on
   every answer from the server) at the ThinkPad's 1280 × 640, the screen the owner saw it on.
     A FLASH is a frame, between the press and the end, in which a NAMED page stands at the screen's middle that is
     neither the page pressed from nor the page arrived at: the paper, the Board, Contracts, the Cover. A loading
     state (the Cover's veil, a page's own loading line, nothing yet) is not a flash.
   Before f1095 it fails: Cover → Contracts and Contracts → a contract painted the paper on the way.
   Run: node test/chromium/no-page-flashes-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const W = 1280, H = 640, SLOW = 4, LATENCY = 150, WATCH_MS = 3000, SETTLE_MS = 2500;
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + JSON.stringify(more) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

/* the page standing at a point, by name; anything else is 'other' (a page we do not name), 'veil' or 'blank' */
const NAMER = `(() => {
  const name = (x, y) => { const e = document.elementFromPoint(x, y); if (!e || e === document.body || e === document.documentElement) return 'blank';
    if (e.id === 'cv-veil') return 'veil';
    if (e.closest('.cv-page')) return 'cover';
    if (e.closest('#modal-root [data-dlg-page]')) return 'page-over';
    if (e.closest('#ct-place')) return 'contracts';
    if (e.closest('#hb-board, .hb-board')) return 'board';
    if (e.closest('#ig-gwrap, .ig-gwrap, [data-ig-paper]')) return 'paper';
    return 'other'; };
  return () => name(innerWidth * 0.3, innerHeight * 0.55) + '|' + name(innerWidth * 0.55, innerHeight * 0.5);
})()`;
const NAMED = ['cover', 'contracts', 'board', 'paper'];

(async () => {
  const h = await startHati(); await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 300)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    const ready = await until(page, () => typeof regOpenContract === 'function' && typeof currentUser === 'function' && !!currentUser() && (state.contracts || []).length > 2, null, 40000);
    check('0 signed in, the book loaded', ready);
    await page.evaluate(async () => { if (typeof stPrefSet === 'function') await stPrefSet('newLook', true); if (typeof newLookApply === 'function') newLookApply(); });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: SLOW });
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: LATENCY, downloadThroughput: -1, uploadThroughput: -1 });
    const ids = await page.evaluate(() => { const all = state.contracts || []; const a = all.find(x => x && x.status === 'Under Review') || all[0]; const b = all.find(x => x && x.id !== a.id) || a; return [a.id, b.id]; });

    const clear = () => page.evaluate(() => { try { if (document.querySelector('#modal-root [role="dialog"]')) closeModal(); } catch (_){} try { if (typeof closeContextPanel === 'function') closeContextPanel(); } catch (_){} });
    const S = {
      board: async () => { await clear(); await page.evaluate(() => setView('dashboard')); return until(page, () => !!document.querySelector('#hb-board, .hb-board'), null, 15000); },
      contracts: async () => { await clear(); await page.evaluate(() => setView('register')); return until(page, () => !!document.querySelector('#ct-place'), null, 15000); },
      cover: async () => { if (!await S.contracts()) return false; await page.waitForTimeout(800); await page.evaluate(id => regOpenContract(id), ids[0]); return until(page, () => !!document.querySelector('.cv-page'), null, 20000); },
      /* the paper with its Dossier on its first tab: by its Cover when one stands, else already on the paper (a contract
         left on another face reopens there); the Dossier tab pressed so every move starts from the same face */
      paper: async () => {
        if (!await S.contracts()) return false; await page.waitForTimeout(800);
        await page.evaluate(id => regOpenContract(id), ids[0]);
        if (!await until(page, () => !!document.querySelector('.cv-page') || (!!document.querySelector('#ig-dock') && typeof pdContract === 'function' && !!pdContract()), null, 20000)) return false;
        if (await page.$('.cv-open')){ await page.waitForTimeout(400); await page.click('.cv-open'); }
        if (!await until(page, () => !document.querySelector('.cv-page') && !!document.querySelector('#ig-dock'), null, 15000)) return false;
        if (await page.$('[data-pd-tab="copilot"]')){ await page.click('[data-pd-tab="copilot"]'); await page.waitForTimeout(600); }
        return until(page, () => !!document.querySelector('[data-pd-tab="copilot"][aria-selected="true"], [data-pd-tab="copilot"].is-on, [data-pd-tab="copilot"].on') || !!document.querySelector('#ig-dock .pd2-card'), null, 8000);
      },
    };
    const moves = [
      ['Board → Contracts (symbol strip)', S.board, { strip: 'contracts' }],
      ['Board → Negotiations (symbol strip)', S.board, { strip: 'negotiations' }],
      ['Board → Obligations (symbol strip)', S.board, { strip: 'oblig' }],
      ['Board → Settings (symbol strip)', S.board, { strip: 'settings' }],
      ['Contracts → a contract (lands on its Cover)', S.contracts, { js: `regOpenContract('${ids[0]}')` }],
      ['Contracts → another contract', S.contracts, { js: `regOpenContract('${ids[1]}')` }],
      ['Cover → Contracts ›', S.cover, { click: '.cv-door' }],
      ['Cover → The brief', S.cover, { click: '[data-cv-go="brief"]' }],
      ['Cover → Open the dossier', S.cover, { click: '.cv-open' }],
      ['Paper → Clauses tab', S.paper, { click: '[data-pd-tab="doc"]' }],
      ['Paper → Redlines tab', S.paper, { click: '[data-pd-tab="red"]' }],
      ['Paper → the bar\'s ‹ back', S.paper, { click: '#dk-back' }],
      ['Paper → Contracts (symbol strip)', S.paper, { strip: 'contracts' }],
      ['Paper → Board (symbol strip)', S.paper, { strip: 'board' }],
    ];
    for (const [name, setup, act] of moves){
      let frames = null, why = '';
      try {
        if (!await setup()){ why = 'could not reach the starting page'; throw new Error(why); }
        await page.waitForTimeout(SETTLE_MS);
        if (act.strip){ await page.click('#dk-nav'); if (!await until(page, k => !!document.querySelector(`#gd-strip [data-gds-go="${k}"]`), act.strip, 5000)){ why = 'no symbol for ' + act.strip; throw new Error(why); } }
        if (act.click && !await page.$(act.click)){ why = 'nothing to press: ' + act.click; throw new Error(why); }
        const rec = page.evaluate(({ NAMER, MS }) => new Promise(res => { const what = eval(NAMER);
          const out = []; let t0 = 0, last = '';
          const tick = () => { const w = what(), t = Math.round(performance.now() - t0); if (w !== last){ out.push([t, w]); last = w; } if (t < MS) requestAnimationFrame(tick); else res(out); };
          window.__nfGo = () => { t0 = performance.now(); last = what(); out.push([0, last]); requestAnimationFrame(tick); }; }), { NAMER, MS: WATCH_MS });
        await until(page, () => typeof window.__nfGo === 'function', null, 5000);
        await page.evaluate(() => { const g = window.__nfGo; delete window.__nfGo; g(); });
        if (act.click) await page.click(act.click, { timeout: 8000 });
        else if (act.strip) await page.click(`#gd-strip [data-gds-go="${act.strip}"]`, { timeout: 8000 });
        else await page.evaluate(c => eval(c), act.js);
        frames = await rec;
      } catch (e){ why = why || String(e.message).split('\n')[0].slice(0, 160); }
      if (!frames){ check(`${name}: ran`, false, why); continue; }
      const [first, last] = [frames[0][1], frames[frames.length - 1][1]];
      const ends = new Set([...first.split('|'), ...last.split('|')]);
      const flashes = [];
      for (let i = 1; i < frames.length - 1; i++){
        const [t, s] = frames[i], dur = frames[i + 1][0] - t;
        for (const pg of s.split('|')) if (NAMED.includes(pg) && !ends.has(pg)) flashes.push(`${pg} at ${t}ms for ${dur}ms`);
      }
      check(`${name}: no other page painted on the way`, !flashes.length, flashes.length ? { flashes, frames } : undefined);
    }
    await page.close();
  } finally { await browser.close(); }
  console.log(`\n${fails ? fails + ' FAILED' : 'all passed'}`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
