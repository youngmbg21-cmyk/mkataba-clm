/* Chromium verification: EVERY JAMBO PANEL BEHAVES ALIKE (owner, 27 Oct 2026, from four screenshots).
   ============================================================
   The owner found, on one page each, faults that turned out to be on many: Calendar's Overview words standing
   2px from the panel's edge; the list pages', Import's and Calendar's Jambo tab showing only his greeting, not the
   one conversation (21 Oct 2026: "a page draws the whole conversation"); no bin to clear it outside Home; no hand
   over Settings' and Calendar's Overview tab; and Jambo saying "I've opened New agreement beside me" when nothing
   had opened. So, on EVERY page with Jambo's panel:
   1 the Overview's words stand at least 16px inside the panel, left and right (16PX INSIDE EVERY CARD);
   2 every tab in the panel's head shows the hand, on the Overview and on the Jambo tab;
   3 the Jambo tab shows the conversation said elsewhere (ONE CONVERSATION);
   4 the Jambo tab carries the bin (one builder, jamboBinHtml), it shows the hand, and pressing it empties the one
     conversation and the panel;
   and on Home:
   5 asked by the AI to draft (aiGotoRun, task draft), the New agreement sheet IS open when he says it is;
   6 typed "draft an NDA with Volvo", the sheet is open and his card's buttons carry their words.
   AT THE PARENT (origin/main 963997a): 1 fails on Calendar; 2 on Settings and Calendar; 3 on the list pages,
   Import and Calendar; 4 everywhere but Home; 5 fails (the sheet stays shut).
   Run: node test/chromium/jambo-panels-alike-verify.js */
/* global state, ai, intel, setView, hbSetFace, hbOpenContracts, openNewAgreement, openNegotiations, openSettingsAt, closeModal, jlToWords, aiGotoRun, naSheetUp, intelAsk, naClose, jamboTalkUp, jamboTalkBack */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { navContracts } = require('../nav-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
async function until(page, fn, arg, ms = 8000){
  const t0 = Date.now();
  while (Date.now() - t0 < ms){ const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await page.waitForTimeout(100); }
  return null;
}
/* a live negotiation, so Negotiations has rows and its panel */
function world(){
  const cs = navContracts();
  const a2 = cs.find(c => c.id === 'MK-A2');
  const at = new Date(Date.now() - 4 * 864e5).toISOString();
  a2.negotiation = { rounds: [{ n: 1 }], turn: 'us', turnAt: at };
  a2.changes = [{ id: 'ch1', clauseId: 'c1', clauseLabel: '3. Payment', status: 'pending', authorSide: 'counterparty', kind: 'edit', at, before: 'thirty', after: 'sixty' }];
  return cs;
}
const PAGES = [
  ['board', "setView('dashboard'); hbSetFace('board')", '#ig-dock'],
  ['contracts', 'hbOpenContracts()', '#ig-dock'],
  ['explorer', "hbSetFace('explorer')", '#ig-dock'],
  ['calendar', "setView('calendar')", '#cal-plan'],
  ['approvals', "setView('approvals')", '#ins-panel'],
  ['obligations', "setView('obligations')", '#ins-panel'],
  ['negotiations', 'openNegotiations()', '#ins-panel'],
  ['customers', "setView('customers')", '#ins-panel'],
  ['directory', "setView('directory')", '#ins-panel'],
  ['intake', "setView('intake')", '#ins-panel'],
  ['templates', "setView('templates')", '#ins-panel'],
  ['mynotes', "setView('mynotes')", '#ins-panel'],
  ['reads', "setView('reads')", '#ins-panel'],
  ['handbook', "setView('handbook')", '#ins-panel'],
  ['migration', "setView('migration')", '#mig-side'],
  ['settings-you', "setView('team')", '#st-side'],
  ['settings-company', "setView('team'); openSettingsAt('platform')", '#st-side'],
];
const TALK = h => `${h} [data-jl-talk], ${h} .pd-tab-talk, ${h} [data-st-talk], ${h} [data-cal-talk]`;
const HOME = h => `${h} [data-jl-home], ${h} [data-st-overview], ${h} [data-cal-talk-back], ${h} .pd-tab[data-pd-tab="copilot"]`;
const HEAD = '.jl-head, .igd-head, .st-side-head, .cal-plan-head';
/* the past exchange every page is asked to show */
const SAY = () => { ai.history.length = 0; ai.history.push({ role: 'user', text: 'HISTQ what ends soon?' }, { role: 'assistant', text: 'HISTA Two contracts end within 90 days.' }); };

(async () => {
  const h = await startHati({});
  await seedWorkspace(h, { contracts: world() });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1536, height: 730 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!(window.state && state.contracts && state.contracts.length > 5 && typeof openNewAgreement === 'function'), null, 20000);
    await P.waitForTimeout(1200);
    const ONLY = process.env.HATI_PANELS_ONLY ? process.env.HATI_PANELS_ONLY.split(',') : null;
    for (const [key, go, host] of PAGES){
      if (ONLY && !ONLY.includes(key)) continue;
      await P.evaluate(SAY);
      await P.evaluate(() => { try { closeModal(); } catch (_){} });
      await P.evaluate(g => { eval(g); }, go);
      const up = await until(P, s => { const e = document.querySelector(s); return e && e.getBoundingClientRect().width > 200; }, host);
      if (!up){ check(`${key}: the panel is drawn`, false, host); continue; }
      await P.waitForTimeout(600);
      /* the page lands on its Overview: a conversation just said (SAY) may have turned Home's panel to Jambo, as new
         words do; the page's own way back puts it on the Overview the claims below start from */
      await P.evaluate(() => { try { jlToWords(); } catch (_){} try { if (window.jamboTalkUp && jamboTalkUp()) jamboTalkBack(); } catch (_){} });
      await P.waitForTimeout(300);
      /* 1 THE OVERVIEW'S ROOM: where its words actually stand, against the panel's own box */
      const room = await P.evaluate(s => {
        const root = document.querySelector(s); const jov = [...root.querySelectorAll('.jov')].find(e => e.getBoundingClientRect().height > 0);
        if (!jov) return null;
        const c = root.getBoundingClientRect(), cs = getComputedStyle(root);
        const l0 = c.left + parseFloat(cs.borderLeftWidth), r0 = c.right - parseFloat(cs.borderRightWidth);
        let L = 1e9, R = -1e9;
        const w = document.createTreeWalker(jov, NodeFilter.SHOW_TEXT);
        for (let n; (n = w.nextNode());){ if (!n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n);
          for (const b of r.getClientRects()){ if (b.width < 1 || b.height < 1) continue; L = Math.min(L, b.left); R = Math.max(R, b.right); } }
        return { left: Math.round(L - l0), right: Math.round(r0 - R) };
      }, host);
      check(`1 ${key}: the Overview's words stand 16px inside the panel`, !!room && room.left >= 16 && room.right >= 16, JSON.stringify(room));
      const cursors = () => P.evaluate(([s, hd]) => { const root = document.querySelector(s); const head = root && root.querySelector(hd);
        return head ? [...head.querySelectorAll('.pd-tab, .jl-tab, .st-side-tab, [data-st-overview], [data-jb-bin], #igd-history-clear')].filter(e => e.getBoundingClientRect().width > 0)
          .map(e => ({ w: (e.textContent || e.getAttribute('aria-label') || '').replace(/[^\p{L} ]/gu, '').trim().slice(0, 14), c: getComputedStyle(e).cursor })) : []; }, [host, HEAD]);
      const c1 = await cursors();
      check(`2 ${key}: every tab shows the hand on the Overview`, c1.length >= 2 && c1.every(x => x.c === 'pointer'), JSON.stringify(c1));
      /* the Jambo tab */
      const tab = await P.$(TALK(host));
      if (!tab){ check(`3 ${key}: the Jambo tab is there to press`, false); continue; }
      await tab.click();
      const shows = await until(P, s => /HISTQ/.test(document.querySelector(s).innerText) && /HISTA/.test(document.querySelector(s).innerText), host, 3000);
      check(`3 ${key}: the Jambo tab shows the conversation said elsewhere`, !!shows);
      const c2 = await cursors();
      check(`2b ${key}: every tab shows the hand on the Jambo tab`, c2.length >= 2 && c2.every(x => x.c === 'pointer'), JSON.stringify(c2));
      const bin = await P.$(`${host} [data-jb-bin], ${host} #igd-history-clear`);
      const binOn = bin && await bin.evaluate(e => e.getBoundingClientRect().width > 0 && getComputedStyle(e).cursor === 'pointer');
      check(`4 ${key}: the Jambo tab carries the bin, with the hand`, !!binOn);
      if (binOn){
        await bin.click();
        const gone = await until(P, s => !ai.history.length && !/HISTQ/.test(document.querySelector(s).innerText), host, 3000);
        check(`4b ${key}: the bin empties the conversation and the panel`, !!gone);
      }
      await P.evaluate(s => { const b = document.querySelector(s); if (b) b.click(); }, HOME(host));
      await P.waitForTimeout(300);
    }
    /* 5 THE AI'S "DRAFT" ON HOME: said opened = open */
    await P.evaluate(() => { try { closeModal(); } catch (_){} ai.history.length = 0; setView('dashboard'); hbSetFace('board'); });
    await P.waitForTimeout(900);
    await P.evaluate(() => { aiGotoRun({ task: 'draft' }, 'i want to draft a new contract'); });
    const open5 = await until(P, () => (typeof naSheetUp === 'function' && naSheetUp()) || null, null, 4000);
    const said5 = await P.evaluate(() => ai.history.map(m => String(m.text || '')).join(' ').replace(/<[^>]+>/g, ' '));
    check('5 the AI\'s draft: the sheet is open when he says it is', !!open5 || !/opened New agreement/i.test(said5), JSON.stringify({ open: !!open5, said: said5.slice(0, 100) }));
    /* 6 TYPED ON HOME: the sheet opens and his card's buttons carry words */
    await P.evaluate(() => { try { closeModal(); } catch (_){} try { if (window.naClose) naClose(); } catch (_){} ai.history.length = 0; setView('dashboard'); hbSetFace('board'); });
    await P.waitForTimeout(900);
    await P.evaluate(() => intelAsk('draft an NDA with Volvo'));
    const open6 = await until(P, () => (typeof naSheetUp === 'function' && naSheetUp()) || null, null, 6000);
    await P.waitForTimeout(600);
    const bare = await P.evaluate(() => [...document.querySelectorAll('#ig-dock .jb-turn button, #ig-dock .ca-card button')].filter(b => b.getBoundingClientRect().width > 0)
      .filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length);
    check('6 typed "draft an NDA with Volvo": the sheet opens, no wordless button in his turn', !!open6 && bare === 0, JSON.stringify({ open: !!open6, bare }));
    check('7 no page errors', !errors.length, errors.slice(0, 3).join(' | '));
  } catch (e){ console.error('HARNESS', e); failures++; }
  finally { await browser.close(); await h.stop(); }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
