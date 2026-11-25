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
/* global state, setView, hbSetFace, hbOpenContracts, openNewAgreement, openNegotiations, openSettingsAt, closeModal, jlToWords , jamboTalkOpen, calPlanRepaint, jlTalkPress, pdTalkReopen, jamboTalkUp, jamboTalkBack */
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
/* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Settings is one list, its Jambo the list panel (#ins-panel) */
const HOST = { dock: '#ig-dock', cal: '#cal-plan', list: '#ins-panel', mig: '#mig-side', st: '#ins-panel' };

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
        /* RE-POINTED 25 Nov 2026 (owner, P-18: "the green links stand BESIDE that press, never on a line above it … a long
           word takes its short form, and what still does not fit is left out, never wrapped"): the row above the box rides
           the line of "Jambo ›" / "‹ Overview" (jamboWaysCarry, .jb-ways.is-carried) — the same presses, so asked there —
           and a link fitted to its short form is the same press under its full words (data-jb-full, jamboWaysFitOne).
           A link left out (is-fit-off) is not shown, and is still lost */
        const carried = e => !!e.closest('.jb-ways.is-carried');
        const inBody = e => carried(e) || (!(head && head.contains(e)) && !(foot && foot.contains(e)) && !e.closest('[data-jl-door], .st-side-unfold, .igd-door'));
        const press = [...root.querySelectorAll('button, a[href], [role="button"]')].filter(e => vis(e) && inBody(e))
          .map(e => (e.getAttribute('data-jb-full') || (e.getAttribute('aria-label') && !e.textContent.trim() ? e.getAttribute('aria-label') : e.textContent)).replace(/\s+/g, ' ').trim()).filter(Boolean);
        const helloIn = [...root.querySelectorAll('[data-jb-hello]')].filter(vis).length;
        const jov = [...root.querySelectorAll('.jov')].filter(vis).length, apn5 = [...root.querySelectorAll('.apn5')].filter(vis).length,
          calLs = [...root.querySelectorAll('.cal-ls-side .cls-side')].filter(vis).length;
        /* RE-POINTED 28 Oct 2026 (owner: "keep them as is but keep them below the discover features. Also remove the
           Ask me details"; the drop card is a pop-up): Discover first, the list's facts under it, no drop card, no Ask me */
        const disc = root.querySelector('.ac-disc, [data-ac-disc], .ac-discover'), facts = root.querySelector('.pd-wall-facts');
        const order = disc && facts && !root.querySelector('#pd-drop') && !root.querySelector('.jov-asks')
          ? (disc.compareDocumentPosition(facts) & Node.DOCUMENT_POSITION_FOLLOWING ? 'disc-first' : 'facts-first') : null;
        const menuFirst = (() => { const d = root.querySelector('[data-st-jb-menu-door]'); if (!d || !vis(d)) return null; const first = press[0] || ''; return d.textContent.includes(first); })();
        /* the box's + (Add a file, the one upload door) stands in the panel's foot in the new look */
        const plus = [...root.querySelectorAll('[data-jb-file]')].some(vis);
        return { tabWords, lit: lit ? lit.textContent.replace(/\d+/g, '').replace(/[^\p{L} ]/gu, '').trim() : '', press, helloIn, jov, apn5, calLs, order, menuFirst, plus };
      }, host);
      if (!read){ check(`${key}: the panel is drawn`, false, host); continue; }
      if (WRITE){ inv[key] = read.press; console.log(`INVENTORY ${key}: ${read.press.length} — ${JSON.stringify(read.press)}`); continue; }
      /* RE-POINTED 9 Nov 2026 (owner: "Your day first"): on Explorer Your day stands before the Overview, the one exception */
      const ov = (key === 'explorer' && /Your day/.test(read.tabWords[0] || '') ? read.tabWords[1] : read.tabWords[0]) || '', jb = read.tabWords[1] || '';
      /* RETIRED 17 Nov 2026 (#762, round 6 default): 1 approvals "Overview first" — Approvals' chosen-row panel opens on
         "Before you decide" (apnLeadFiveHtml), no Overview tab; the "no Jambo tab" half is still asked below */
      /* RE-POINTED 21 Nov 2026 (P-39, the Board's panel as drawn): no head row at all — no Overview tab, no Jambo tab */
      /* RE-POINTED 21 Nov 2026 (P-36, New agreement as drawn): the sheet's panel has no head row either */
      if (key === 'board' || key === 'sheet') check(`1 ${key}: no tab row, no Jambo tab (as drawn)`, !read.tabWords.length, JSON.stringify({ tabs: read.tabWords }));
      /* RE-POINTED 21 Nov 2026 (P-31, as drawn): the Contracts place's panel has no tab row either; its summary is the Overview */
      else if (key === 'contracts') check(`1 ${key}: no tab row, no Jambo tab (as drawn)`, !read.tabWords.length, JSON.stringify({ tabs: read.tabWords }));
      else if (key === 'approvals') check(`1 ${key}: no Jambo tab`, !read.tabWords.some(w => /Jambo/.test(w)), JSON.stringify({ tabs: read.tabWords, lit: read.lit }));
      else check(`1 ${key}: Overview first, no Jambo tab, landing on Overview`, /Overview/.test(ov) && !read.tabWords.some(w => /Jambo/.test(w)) && /Overview/.test(read.lit), JSON.stringify({ tabs: read.tabWords, lit: read.lit, jb }));
      check(`2 ${key}: no greeting on the Overview`, !read.helloIn, String(read.helloIn));
      /* RE-POINTED 21 Nov 2026 (P-30, as drawn): a chosen approval's panel is the drawn panel (.apn5), not the Overview builder */
      /* RE-POINTED 23 Nov 2026 (P-14, the Calendar the Legora + Stripe way, owner's "Build P-14"): the Calendar's panel follows
         the tab in plain sections (calLsSideHtml), no cards — the drawn panel, as Approvals' is */
      check(`3 ${key}: drawn by the one Overview builder`, read.jov >= 1 || (key === 'approvals' && read.apn5 >= 1) || (key === 'calendar' && read.calLs >= 1), String(read.jov) + (key === 'calendar' ? ' · calendar side ' + read.calLs : ''));
      /* nothing lost: each pressable of the old panel is still pressable here, by its words (case, cost and spacing aside) */
      const norm = s => String(s || '').toLowerCase().replace(/·.*$/, '').replace(/[^\p{L}\p{N}]+/gu, '');
      const now = read.press.map(norm).join('|');
      const was = (inv && inv[key]) || [];
      /* MOVED, NOT LOST (owner, 28 Oct 2026: "the card no longer sits on a panel … it shows up as a pop up card"): the
         drop card's two presses now live in the pop-up that "upload a document" (still on the panel) opens */
      const POPUP = { contracts: ['Choose a file', 'Import contracts'] };
      const viaPopup = w => (POPUP[key] || []).includes(w) && now.includes(norm('upload a document'));
      /* RENAMED, NOT LOST (owner, 12 Nov 2026, "Discover is a page"): the Reads page is named Discover, so its chip
         beside Contracts says "discover"; on Discover's own panel "Ask a column" became "Ask a question" (the ask box) */
      const RENAMED = { contracts: { reads: 'discover' }, reads: { 'Ask a column': 'Ask a question' } };
      const viaName = w => !!(RENAMED[key] && RENAMED[key][w]) && now.includes(norm(RENAMED[key][w]));
      /* GONE WITH THE OLD LOOK (16 Nov 2026, #762): Settings has no left menu in the new look — its pages are linked at
         the foot of its one list (owner's pick, 14 Nov 2026, f1045) — so the panel's "Open the Menu" has nothing to open */
      /* RETIRED 17 Nov 2026 (#762, owner's ruling 4): the Parties panel has no all-parties list — "all parties" is gone on purpose */
      /* RETIRED 17 Nov 2026 (#762, round 6 default 3: "no suggestion chips", with the five parts built as drawn, owner 15 Nov
         2026): the old panels' suggestion chips are not drawn on the new panels — Contracts' "Due diligence · 5 questions",
         "Ask a new question" and "calendar", Approvals' "approval rules", Obligations' "find time for what is due",
         Negotiations' "our move" and "start a negotiation", Settings' suggestion chips. Their acts keep their own doors. */
      /* RETIRED 21 Nov 2026 (P-43, Settings the Legora + Stripe way): "Ask" (Ask an admin) is for a person who is not one —
         an admin's panel no longer carries it (the fault logged that day); this check signs in as an admin */
      const RETIRED = { 'settings-you': ['Open the Menu', 'brief me once a week', 'switch to Svenska', 'turn off my suggestions', 'Ask'],
        'settings-company': ['Open the Menu', 'review the quarterly access review', 'what should I turn on next?', 'who can open Procurement & Raw Materials?', 'Ask'],
        customers: ['all parties'], contracts: ['Due diligence · 5 questions', 'Ask a new question', 'calendar'], approvals: ['approval rules'],
        obligations: ['find time for what is due · 1 call'], negotiations: ['our move', 'start a negotiation'],
        /* RETIRED 21 Nov 2026 (P-39, the Board's panel as drawn: no suggestion chips under Jambo's pieces) */
        board: ['which 2 end in 90 days?', 'value by stream', 'what needs me'],
        /* RETIRED 23 Nov 2026 (P-14, the Calendar's panel as drawn: plain sections, its one plan act "Plan my week"; the
           planner's other ask is still asked in Jambo's box at the panel's foot) */
        calendar: ['find time for what is due · 1 call'],
        /* RE-POINTED 24 Nov 2026 (owner: Explorer's Brain and Wiring hidden for now): the lobes are the Brain's, so the
           map opens on the Floors and their two questions are not offered; they come back with the Brain */
        explorer: ['Shade the lobes by liability cap', 'Size the lobes by value'] };
      /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762): "Add a file" is the box's + (data-jb-file) in the
         panel's foot, outside the body read above — still offered, so asked there */
      const viaFoot = w => w === 'Add a file' && read.plus;
      const viaRetired = w => (RETIRED[key] || []).includes(w);
      const lost = was.filter(w => norm(w) && !now.includes(norm(w)) && !viaPopup(w) && !viaName(w) && !viaRetired(w) && !viaFoot(w));
      check(`4 ${key}: nothing the panel offered before is lost (${was.length} kept)`, !!inv && !lost.length, lost.length ? 'lost: ' + JSON.stringify(lost) : '');
      /* RETIRED 16 Nov 2026 (#762): 5 "contracts: Discover stands above the list's facts" — the new look's Contracts panel is
         the folder's plain sentences, the Legora way (owner's pick, 14 Nov 2026, f1053); no Discover card or facts list there */
      /* RETIRED 16 Nov 2026 (#762): 6 "settings: Open the Menu is still first" — the new look's Settings has no left menu (f1045) */
      /* the Jambo tab's first words are his greeting */
      /* the conversation, turned to as an answer turns it (each host's own reopen), opens on his greeting */
      /* RE-POINTED 16 Nov 2026 (#762): Settings' talk opens as the list panel's (jlTalkPress), below */
      await P.evaluate(k => {
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
