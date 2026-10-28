/* Chromium verification: AN OVERVIEW TAB ON EVERY PAGE, THEN THE JAMBO TAB — AND NOTHING LOST.
   ============================================================
   The owner, 26 Oct 2026: "Build Jambo's Overview tab The Legora Way" (the brief and the drawing they picked), then
   "we will have an overview tab side panel in each page followed by the jambo tab" — answered by press: "Yes, every
   page", "Dossier is its Overview", "Opens on Overview" — and, of Settings' "Open the Menu": every existing feature
   is kept. So, on every page with Jambo's panel (Home's Board, Contracts, Explorer, Calendar and the New agreement
   sheet; the list pages; Import; Settings, You and Company):
   1 the panel's tabs are Overview first, then Jambo, and it OPENS on Overview — RE-POINTED 28 Oct 2026 (owner picked
     "Door above the box"): Overview first and NO Jambo tab; his conversation is opened the way an answer opens it;
   2 the Overview holds no greeting ([data-jb-hello]); the Jambo tab's first words are his greeting;
   3 the Overview is drawn by the one builder (.jov) — the Dossier beside a paper is its own and is not asked;
   4 NOTHING IS LOST: every button and link the page's panel offered before (the INVENTORY, test/overview-inventory.json,
     taken at origin/main 6cbdd77 before this change, by running this file with OV_INVENTORY_WRITE=1) is still
     offered by the panel's Overview or the chips under it, by its words;
   5 on Contracts, Discover stands above the list's facts, with no drop card (a pop-up now) and no "Ask me" (owner,
     28 Oct 2026; was "Discover above the drop area", 26 Oct 2026);
   6 Settings' "Open the Menu" is still first.
   AT THE PARENT (origin/main 6cbdd77) claims 1, 2 and 3 FAIL on the list pages, Import, the Board, Explorer and the
   sheet (they were his one window, or led with the greeting), and 5 fails (the drop stood first); 4 is the parent's
   own inventory and holds there by construction.
   Run: node test/chromium/overview-tab-verify.js */
/* global state, setView, hbSetFace, hbOpenContracts, openNewAgreement, openNegotiations, openSettingsAt, closeModal, jlToWords , stTalkReopen, jamboTalkOpen, calPlanRepaint, jlTalkPress, pdTalkReopen, jamboTalkUp, jamboTalkBack */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { navContracts } = require('../nav-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const INV = path.join(__dirname, '..', 'overview-inventory.json');
const WRITE = process.env.OV_INVENTORY_WRITE === '1';
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
async function until(page, fn, arg, ms = 8000){
  const t0 = Date.now();
  while (Date.now() - t0 < ms){ const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await page.waitForTimeout(100); }
  return null;
}
/* a live negotiation with two of their asks waiting on us, so Negotiations and Approvals have rows */
function world(){
  const cs = navContracts();
  const a2 = cs.find(c => c.id === 'MK-A2');
  const at = new Date(Date.now() - 4 * 864e5).toISOString();
  a2.negotiation = { rounds: [{ n: 1 }], turn: 'us', turnAt: at };
  a2.changes = [{ id: 'ch1', clauseId: 'c1', clauseLabel: '3. Payment', status: 'pending', authorSide: 'counterparty', kind: 'edit', at, before: 'thirty', after: 'sixty' },
    { id: 'ch2', clauseId: 'c2', clauseLabel: '7. Liability', status: 'pending', authorSide: 'counterparty', kind: 'edit', at, before: 'twelve', after: 'six' }];
  return cs;
}
/* each page, how it is opened, and which panel holds it */
const PAGES = [
  ['board', "setView('dashboard'); hbSetFace('board')", 'dock'],
  ['contracts', 'hbOpenContracts()', 'dock'],
  ['explorer', "hbSetFace('explorer')", 'dock'],
  ['calendar', "setView('calendar')", 'cal'],
  ['sheet', 'openNewAgreement()', 'dock'],
  ['approvals', "setView('approvals')", 'list'],
  ['obligations', "setView('obligations')", 'list'],
  ['negotiations', 'openNegotiations()', 'list'],
  ['customers', "setView('customers')", 'list'],
  ['directory', "setView('directory')", 'list'],
  ['intake', "setView('intake')", 'list'],
  ['templates', "setView('templates')", 'list'],
  ['mynotes', "setView('mynotes')", 'list'],
  ['reads', "setView('reads')", 'list'],
  ['handbook', "setView('handbook')", 'list'],
  ['migration', "setView('migration')", 'mig'],
  ['settings-you', "setView('team')", 'st'],
  ['settings-company', "setView('team'); openSettingsAt('platform')", 'st'],
];
const HOST = { dock: '#ig-dock', cal: '#cal-plan', list: '#ins-panel', mig: '#mig-side', st: '#st-side' };

(async () => {
  const h = await startHati({});
  await seedWorkspace(h, { contracts: world() });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 730 } });
  const P = await ctx.newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  const inv = WRITE ? {} : (fs.existsSync(INV) ? JSON.parse(fs.readFileSync(INV, 'utf8')) : null);
  if (!WRITE) check('0 the inventory taken before the change is here', !!inv, INV);
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!(window.state && state.contracts && state.contracts.length > 5 && typeof openNewAgreement === 'function'), null, 20000);
    await P.waitForTimeout(1200);
    for (const [key, go, kind] of PAGES){
      await P.evaluate(() => { try { closeModal(); } catch (_){} });
      await P.evaluate(go => { eval(go); }, go);
      const host = HOST[kind];
      await until(P, h => { const e = document.querySelector(h); return e && e.getBoundingClientRect().width > 200; }, host);
      await P.waitForTimeout(700);
      /* a list page lands with nothing chosen (its page's own words), the Overview being asked */
      if (kind === 'list' || kind === 'mig') await P.evaluate(() => { try { jlToWords(); } catch (_){} });
      await P.waitForTimeout(300);
      const read = await P.evaluate(h => {
        const root = document.querySelector(h); if (!root) return null;
        const vis = e => { const b = e.getBoundingClientRect(); if (!(b.width > 0 && b.height > 0)) return false; for (let x = e; x && x !== document.body; x = x.parentElement){ const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } return true; };
        const tabs = [...root.querySelectorAll('.jl-head .pd-tab, .igd-head .pd-tab, .st-side-head .st-side-tab, .cal-plan-head .pd-tab')].filter(vis);
        const tabWords = tabs.map(t => t.textContent.replace(/\d+/g, '').replace(/[^\p{L} ]/gu, '').trim());
        const lit = tabs.find(t => t.classList.contains('on') || t.getAttribute('aria-current') === 'true' || t.getAttribute('aria-selected') === 'true');
        /* the panel's body as shown: everything between its tab row and its ask box */
        const head = root.querySelector('.jl-head, .igd-head, .st-side-head, .cal-plan-head');
        const foot = root.querySelector('.jl-foot, .igd-foot, .st-side-foot, .cal-plan-foot');
        const inBody = e => !(head && head.contains(e)) && !(foot && foot.contains(e)) && !e.closest('[data-jl-door], .st-side-unfold, .igd-door');
        const press = [...root.querySelectorAll('button, a[href], [role="button"]')].filter(e => vis(e) && inBody(e))
          .map(e => (e.getAttribute('aria-label') && !e.textContent.trim() ? e.getAttribute('aria-label') : e.textContent).replace(/\s+/g, ' ').trim()).filter(Boolean);
        const helloIn = [...root.querySelectorAll('[data-jb-hello]')].filter(vis).length;
        const jov = [...root.querySelectorAll('.jov')].filter(vis).length;
        /* RE-POINTED 28 Oct 2026 (owner: "keep them as is but keep them below the discover features. Also remove the
           Ask me details"; the drop card is a pop-up): Discover first, the list's facts under it, no drop card, no Ask me */
        const disc = root.querySelector('.ac-disc, [data-ac-disc], .ac-discover'), facts = root.querySelector('.pd-wall-facts');
        const order = disc && facts && !root.querySelector('#pd-drop') && !root.querySelector('.jov-asks')
          ? (disc.compareDocumentPosition(facts) & Node.DOCUMENT_POSITION_FOLLOWING ? 'disc-first' : 'facts-first') : null;
        const menuFirst = (() => { const d = root.querySelector('[data-st-jb-menu-door]'); if (!d || !vis(d)) return null; const first = press[0] || ''; return d.textContent.includes(first); })();
        return { tabWords, lit: lit ? lit.textContent.replace(/\d+/g, '').replace(/[^\p{L} ]/gu, '').trim() : '', press, helloIn, jov, order, menuFirst };
      }, host);
      if (!read){ check(`${key}: the panel is drawn`, false, host); continue; }
      if (WRITE){ inv[key] = read.press; console.log(`INVENTORY ${key}: ${read.press.length} — ${JSON.stringify(read.press)}`); continue; }
      const ov = read.tabWords[0] || '', jb = read.tabWords[1] || '';
      check(`1 ${key}: Overview first, no Jambo tab, landing on Overview`, /Overview/.test(ov) && !read.tabWords.some(w => /Jambo/.test(w)) && /Overview/.test(read.lit), JSON.stringify({ tabs: read.tabWords, lit: read.lit, jb }));
      check(`2 ${key}: no greeting on the Overview`, !read.helloIn, String(read.helloIn));
      check(`3 ${key}: drawn by the one Overview builder`, read.jov >= 1, String(read.jov));
      /* nothing lost: each pressable of the old panel is still pressable here, by its words (case, cost and spacing aside) */
      const norm = s => String(s || '').toLowerCase().replace(/·.*$/, '').replace(/[^\p{L}\p{N}]+/gu, '');
      const now = read.press.map(norm).join('|');
      const was = (inv && inv[key]) || [];
      /* MOVED, NOT LOST (owner, 28 Oct 2026: "the card no longer sits on a panel … it shows up as a pop up card"): the
         drop card's two presses now live in the pop-up that "upload a document" (still on the panel) opens */
      const POPUP = { contracts: ['Choose a file', 'Import contracts'] };
      const viaPopup = w => (POPUP[key] || []).includes(w) && now.includes(norm('upload a document'));
      const lost = was.filter(w => norm(w) && !now.includes(norm(w)) && !viaPopup(w));
      check(`4 ${key}: nothing the panel offered before is lost (${was.length} kept)`, !!inv && !lost.length, lost.length ? 'lost: ' + JSON.stringify(lost) : '');
      if (key === 'contracts') check('5 contracts: Discover stands above the list\'s facts; no drop card, no Ask me', read.order === 'disc-first', String(read.order));
      if (key === 'settings-you' || key === 'settings-company') check(`6 ${key}: "Open the Menu" is still first`, read.menuFirst === true, String(read.menuFirst));
      /* the Jambo tab's first words are his greeting */
      /* the conversation, turned to as an answer turns it (each host's own reopen), opens on his greeting */
      await P.evaluate(k => { if (/^settings/.test(k)) return stTalkReopen();
        if (k === 'calendar'){ jamboTalkOpen('cal:week', document.getElementById('cal-plan-body')); return calPlanRepaint(); }
        if (document.querySelector('#ins-panel.is-jambo, #mig-side .jl-head')) return jlTalkPress();
        return pdTalkReopen(); }, key);
      const hello = await until(P, h => { const r = document.querySelector(h); return r && [...r.querySelectorAll('[data-jb-hello]')].some(e => e.getBoundingClientRect().height > 0) ? true : null; }, host, 3000);
      check(`2b ${key}: the conversation opens on his greeting`, !!hello);
      await P.evaluate(() => { try { if (window.jamboTalkUp && jamboTalkUp()) jamboTalkBack(); } catch (_){} });
    }
    if (WRITE){ fs.writeFileSync(INV, JSON.stringify(inv, null, 1) + '\n'); console.log('wrote ' + INV); }
    check('7 no page errors', !errors.length, errors.slice(0, 3).join(' | '));
  } catch (e){ console.error('HARNESS', e); failures++; }
  finally { await browser.close(); await h.stop(); }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
