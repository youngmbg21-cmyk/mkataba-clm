/* ============================================================
   THE GLITCH AUDIT — a measuring instrument, not a test
   (owner's work order, 23 Oct 2026: "identify the glitch bugs, stutters and
   press glitches that i see … moving from page to page slow where I have to
   press twice … moving from page to page is not smooth")
   ============================================================
   It asserts nothing. It walks HaTi the way a person does, in a real
   Chromium, presses every door once with a real pointer (or a finger), and
   prints what each press did:
     moved      did anything a person can SEE change (a visible mutation, or
                the view / face / panel changed)? If not, it presses AGAIN and
                says whether the second press moved — the "press twice" fault
     first      ms from the press to the first visible change
     settled    ms from the press until nothing changed for 300 ms (bounded)
     longTasks  browser freezes of 50 ms or more during the move (count / worst)
     gaps       frames that took more than 34 ms (a dropped frame; count / worst)
     redraws    big replacements (≥ 60 elements thrown away at once), and the
                parts that were thrown away MORE THAN ONCE for one press
     toasts     what the black box SAID — and "said, not shown" when it spoke
                while nothing in view changed
     banned     animations of width, height, left or top while it moved
   And three still measurements: sitting on the Board and on Explorer for 3 s,
   scrolling a long list, and whether ‹ brings a list back to where it was.

   Book: the four fixtures cloned to about 400 contracts (HATI_GA_N).
   Screens: the owner's three (HATI_GA_SCREENS=1440x780,1536x730,1366x950t —
   a trailing t presses with a finger).
     node test/chromium/_audit/glitch-audit.js
     HATI_GA_OUT=/some/file.json node test/chromium/_audit/glitch-audit.js
   ============================================================ */
/* global PerformanceObserver */
'use strict';
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../../helpers');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const N = +process.env.HATI_GA_N || 400;
const SCREENS = String(process.env.HATI_GA_SCREENS || '1440x780,1536x730,1366x950t').split(',').map(s => {
  const m = /^(\d+)x(\d+)(t?)$/.exec(s.trim()); return { w: +m[1], h: +m[2], touch: !!m[3], name: s.trim() }; });
const ONLY = process.env.HATI_GA_ONLY ? new RegExp(process.env.HATI_GA_ONLY, 'i') : null;
const OUTF = process.env.HATI_GA_OUT || '';
const pause = ms => new Promise(r => setTimeout(r, ms));

/* ---- THE BOOK ---- */
function book(){
  const out = FIXTURES.map(c => JSON.parse(JSON.stringify(c)));
  const st = ['Under Review', 'Signed', 'Signed', 'Under Review', 'Draft'];
  for (let i = 0; out.length < N; i++){
    const f = JSON.parse(JSON.stringify(FIXTURES[i % FIXTURES.length]));
    f.id = 'MK-G' + String(1000 + i); f.name = f.name + ' ' + (i + 1);
    f.counterparty = ['Kabras Sugar', 'Nandi Dairy', 'Naivas Supermarkets', 'Bidco Africa', 'Safaricom PLC', 'Twiga Foods', 'Kenya Power'][i % 7] + (i % 3 ? '' : ' Ltd');
    f.status = st[i % st.length];
    const d = new Date(); d.setDate(d.getDate() + ((i * 37) % 900) - 200);
    f.expiry = d.toISOString().slice(0, 10);
    f.value = f.metadata.value = 1000000 * (1 + (i * 13) % 90); f.fields.value = String(f.value);
    if (f.status === 'Signed' && i % 2 === 0){
      const due = off => { const t = new Date(); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };
      f.obligations = [{ id: 'ob-' + f.id + '-1', desc: 'Send the monthly supply report', due: due((i % 40) - 10), party: 'ours', status: 'open' },
        { id: 'ob-' + f.id + '-2', desc: 'Deliver the quarterly batch', due: due((i % 60) - 5), party: 'theirs', status: 'open' }];
    }
    out.push(f);
  }
  return out;
}

/* ---- THE INSTRUMENT INSIDE THE PAGE ---- */
const INSTRUMENT = () => {
  const G = window.__ga = { t0: 0, muts: [], lt: [], gaps: [], anim: new Set(), on: false };
  const sizeOf = n => n.nodeType === 1 ? 1 + n.getElementsByTagName('*').length : 0;
  const nameOf = el => { if (!el || el.nodeType !== 1) return '?';
    const id = el.id ? '#' + el.id : ''; const cl = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return (el.tagName.toLowerCase() + id + cl).slice(0, 60); };
  const holderOf = el => { let e = el; while (e && e.nodeType === 1 && !e.id && e.parentElement) e = e.parentElement; return e; };
  new MutationObserver(list => { if (!G.on) return; const t = performance.now();
    for (const m of list){
      let removed = 0, added = 0;
      if (m.type === 'childList'){ m.removedNodes.forEach(n => { removed += sizeOf(n); }); m.addedNodes.forEach(n => { added += sizeOf(n); }); }
      const tg = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      G.muts.push({ t, type: m.type, removed, added, tg, attr: m.attributeName || '' });
    } }).observe(document, { childList: true, subtree: true, attributes: true, characterData: true,
      attributeFilter: ['class', 'hidden', 'style', 'aria-pressed', 'aria-expanded', 'open'] });
  try { new PerformanceObserver(l => { if (!G.on) return; for (const e of l.getEntries()) G.lt.push({ t: e.startTime, d: e.duration }); }).observe({ type: 'longtask', buffered: false }); } catch (_){}
  let last = performance.now(), k = 0;
  const BANNED = /^(width|height|left|top|max-height|max-width|min-height|min-width|all)$/;
  const tick = now => { if (G.on){ const g = now - last; if (g > 34) G.gaps.push({ t: now, d: g });
      if ((k++ & 3) === 0 && document.getAnimations){ for (const a of document.getAnimations()){
        let props = [];
        if (a.transitionProperty) props = [a.transitionProperty];
        else { try { const kf = a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []; for (const f of kf) props.push(...Object.keys(f)); } catch (_){} }
        for (const p of props) if (BANNED.test(p)){ const tgt = a.effect && a.effect.target; G.anim.add(p + ' on ' + nameOf(tgt)); }
      } } }
    last = now; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  const visible = el => { if (!el || !el.isConnected) return false; if (el === document.body || el === document.documentElement) return true;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    if (r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return false;
    const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity !== 0; };
  G.sig = () => { const s = window.state || {}; let hb = {};
    try { hb = window.hbS ? window.hbS() : {}; } catch (_){}
    const pd = document.querySelector('[data-pd-tab].on, [data-pd-tab][aria-selected="true"]');
    const dlg = document.querySelectorAll('#modal-root > *').length;
    const pnl = document.getElementById('context-panel'); const pOpen = pnl && getComputedStyle(pnl).display !== 'none' && pnl.getBoundingClientRect().width > 50;
    return [s.view, hb.face, hb.card || '', pd ? pd.getAttribute('data-pd-tab') : '', dlg, pOpen ? 'panel' : '', location.hash].join('|'); };
  G.toasts = [];
  G.wrapToast = () => { if (window.toast && !window.toast.__ga){ const o = window.toast;
      const w = function (m, k){ if (G.on && k) G.toasts.push((k || '') + ': ' + String(m).replace(/\s+/g, ' ').slice(0, 110) + '  ⟵ ' + (new Error().stack.split('\n').slice(2, 5).map(x => x.trim().replace(/^at /, '').replace(/\(?https?:\/\/[^/]+\//, '').replace(/\)$/, '')).join(' < '))); return o.apply(this, arguments); };
      w.__ga = true; window.toast = w; } };
  G.start = () => { G.wrapToast(); G.toasts = []; G.muts = []; G.lt = []; G.gaps = []; G.anim = new Set(); G.on = true; G.t0 = performance.now(); G.s0 = G.sig();
    const sc = document.getElementById('content-scroll'); G.sc0 = sc ? sc.scrollTop : 0; };
  G.quietFor = () => { const lm = G.muts.length ? G.muts[G.muts.length - 1].t : G.t0; return performance.now() - lm; };
  G.since = () => performance.now() - G.t0;
  G.stop = () => { G.on = false;
    const t0 = G.t0;
    const vis = G.muts.filter(m => { const inToast = m.tg && m.tg.closest && m.tg.closest('#toast-root');
      if (inToast) return false; if (m.type === 'attributes' && m.attr === 'style' && m.tg && m.tg.closest && m.tg.closest('.toast-in')) return false;
      return visible(m.tg) || (m.removed > 0 && m.tg && m.tg.isConnected && visible(holderOf(m.tg))); });
    const big = G.muts.filter(m => m.removed >= 60);
    const by = {}; for (const m of big){ const nm = nameOf(holderOf(m.tg)); by[nm] = (by[nm] || 0) + 1; }
    const toasts = G.toasts.slice();
    const s1 = G.sig();
    const last = G.muts.length ? G.muts[G.muts.length - 1].t - t0 : 0;
    return {
      moved: vis.length > 0 || s1 !== G.s0, sigChanged: s1 !== G.s0, s0: G.s0, s1,
      first: vis.length ? Math.round(vis[0].t - t0) : null, lastChange: Math.round(last),
      visMuts: vis.length,
      longTasks: G.lt.length, ltWorst: Math.round(Math.max(0, ...G.lt.map(x => x.d))), ltSum: Math.round(G.lt.reduce((a, x) => a + x.d, 0)),
      gaps: G.gaps.length, gapWorst: Math.round(Math.max(0, ...G.gaps.map(x => x.d))),
      redraws: big.length, twice: Object.entries(by).filter(([, n]) => n > 1).map(([k, n]) => k + '×' + n),
      redrawn: Object.keys(by).slice(0, 6),
      toasts, banned: [...G.anim],
      scroll: (() => { const sc = document.getElementById('content-scroll'); return sc ? [G.sc0, sc.scrollTop] : null; })(),
    };
  };
};

async function settle(page, maxMs = 6000){
  const end = Date.now() + maxMs; await pause(60);
  while (Date.now() < end){
    const q = await page.evaluate(() => window.__ga.quietFor()).catch(() => 999);
    if (q >= 300) return true; await pause(80);
  }
  return false;
}

async function home(page){
  for (let i = 0; i < 3; i++){ const open = await page.evaluate(() => document.querySelectorAll('#modal-root > *').length).catch(() => 0);
    if (!open) break; await page.keyboard.press('Escape').catch(() => {}); await pause(250); }
  await page.evaluate(() => { try { if (document.querySelectorAll('#modal-root > *').length && window.closeModal) closeModal(); } catch (_){}
    try { if (window.closeContextPanel) closeContextPanel(); } catch (_){}
    try { if (window.aiWinToggle && window.ai && ai.win && ai.win.open) aiWinToggle(false); } catch (_){}
    setView('counter'); });
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForFunction(() => document.getElementById('cn-q') && document.getElementById('cn-q').offsetParent, null, { timeout: 8000 }).catch(() => {});
  await pause(250);
}
async function typeIn(page, sel, words){
  await page.waitForSelector(sel, { state: 'visible', timeout: 6000 });
  await page.fill(sel, words);
}
async function openPaper(page, id){
  await home(page); await typeIn(page, '#cn-q', id); await page.press('#cn-q', 'Enter');
  await page.waitForFunction(() => { try { return window.hbS && hbS().face === 'paper'; } catch (_){ return false; } }, null, { timeout: 8000 }).catch(() => {});
  await pause(500);
}

/* ---- ONE PRESS, MEASURED ---- */
async function measure(page, scr, name, setup, press, opts = {}){
  if (ONLY && !ONLY.test(name)) return null;
  try { if (setup) await setup(page); } catch (e){ return { name, screen: scr.name, error: 'setup: ' + e.message.split('\n')[0] }; }
  await page.evaluate(() => window.__ga.start());
  let err = '';
  try { await press(page); } catch (e){ const ls = e.message.split('\n');
    err = ls[0].slice(0, 120) + ' ' + [...new Set(ls.filter(l => /intercepts|not stable|not visible|detached|outside of the viewport|waiting for/.test(l)).map(l => l.trim().slice(0, 140)))].slice(-3).join(' | '); }
  const quiet = await settle(page, opts.max || 6000);
  const r = await page.evaluate(() => window.__ga.stop());
  r.name = name; r.screen = scr.name; r.settled = quiet ? r.lastChange : '>' + (opts.max || 6000); if (err) r.error = err;
  if (!r.moved && !opts.mayStayStill && !err){
    /* THE SECOND PRESS: the owner's "I press again and then it moves" */
    await page.evaluate(() => window.__ga.start());
    try { await press(page); } catch (_){}
    await settle(page, 4000);
    const r2 = await page.evaluate(() => window.__ga.stop());
    r.secondPress = { moved: r2.moved, first: r2.first, s1: r2.s1, toasts: r2.toasts };
  }
  r.saidNotShown = r.toasts.length > 0 && r.visMuts === 0 && !r.sigChanged;
  return r;
}

const tap = (scr) => async (page, sel) => {
  const el = page.locator(sel).first();
  await el.waitFor({ state: 'visible', timeout: 5000 });
  if (scr.touch) await el.tap(); else await el.click();
};

/* ---- THE DOORS ---- */
function doors(scr){
  const press = tap(scr);
  const D = [];
  const PLACES = ['contracts', 'calendar', 'explorer', 'board', 'negotiations', 'approvals', 'requests', 'parties', 'people',
    'our paper', 'import', 'my notes', 'insights', 'agents', 'settings', 'brain', 'guide', 'alerts', 'activity', 'workspace'];
  for (const w of PLACES){
    D.push([`Home box: type "${w}" + Enter`, home, async p => { await typeIn(p, '#cn-q', w); await p.press('#cn-q', 'Enter'); }]);
    D.push([`‹ back from "${w}"`, async p => { await home(p); await typeIn(p, '#cn-q', w); await p.press('#cn-q', 'Enter'); await settle(p); await pause(300); },
      p => press(p, '#dk-back')]);
  }
  D.push(['Home: Needs you "Decide"', home, p => press(p, '#cn-needs [data-cn-need] >> visible=true')]);
  D.push(['Home: Needs you second row button', home, p => press(p, '#cn-needs [data-cn-need] >> visible=true >> nth=1')]);
  D.push(['Home: Needs you row (the words, not the button)', home, p => press(p, '#cn-needs [data-nd-row] >> visible=true, #cn-needs .nd-what >> visible=true')]);
  D.push(['Home: Needs you "Show all"', home, p => press(p, '#cn-needs :text("Show all") >> visible=true')]);
  D.push(['Home: a suggestion link under the box', home, p => press(p, '#cn-chips :is(a,button) >> visible=true')]);
  D.push(['Bar: HaTi mark from Approvals', async p => { await home(p); await p.evaluate(() => setView('approvals')); await pause(600); }, p => press(p, '#dk-mark')]);
  D.push(['Bar: page name opens Recent', home, p => press(p, '#dk-page')]);
  D.push(['Bar: page name pressed again closes Recent', async p => { await home(p); await press(p, '#dk-page'); await pause(400); }, p => press(p, '#dk-page')]);
  D.push(['Bar: bell opens Alerts', home, p => press(p, '#hdr-notify')]);
  D.push(['Bar: bell pressed again closes', async p => { await home(p); await press(p, '#hdr-notify'); await pause(600); }, p => press(p, '#hdr-notify')]);
  D.push(['Bar: ✦ opens Jambo', home, p => press(p, '#cmd-ai')]);
  D.push(['Bar: ✦ pressed again closes', async p => { await home(p); await press(p, '#cmd-ai'); await pause(600); }, p => press(p, '#cmd-ai')]);
  D.push(['Bar: Activity clock', home, p => press(p, '#cmd-panel')]);
  D.push(['Bar: search box ⌘K', home, p => press(p, '#cmd-search')]);
  /* a contract on Home's paper */
  const PAPER = p => openPaper(p, 'MK-A1');
  D.push(['Home box: type "MK-A1" + Enter (open a contract)', home, async p => { await typeIn(p, '#cn-q', 'MK-A1'); await p.press('#cn-q', 'Enter'); }]);
  const PAPER2 = p => openPaper(p, 'MK-B2');
  for (const [t, sel, pp] of [['Clauses', '[data-pd-tab="doc"]', PAPER], ['Jambo', '[data-pd-talk]', PAPER], ['Redlines (contract under review)', '[data-pd-tab="red"]', PAPER2]]){
    D.push([`Paper: Dossier panel tab "${t}"`, pp, p => press(p, sel)]);
  }
  D.push(['Paper: back to tab "Dossier" from Clauses', async p => { await PAPER(p); await press(p, '[data-pd-tab="doc"]'); await settle(p); }, p => press(p, '[data-pd-tab="copilot"]')]);
  D.push(['Paper: Clauses tab pressed again', async p => { await PAPER(p); await press(p, '[data-pd-tab="doc"]'); await settle(p); }, p => press(p, '[data-pd-tab="doc"]'), { mayStayStill: true }]);
  D.push(['Paper: Jambo tab pressed again (goes back)', async p => { await PAPER(p); await press(p, '[data-pd-talk]'); await settle(p); }, p => press(p, '[data-pd-talk]')]);
  D.push(['Paper: Notes', PAPER, p => press(p, '#hdr-chat')]);
  D.push(['Paper: Share', PAPER, p => press(p, '#ws-share')]);
  D.push(['Paper: Actions', PAPER, p => press(p, '#ig-actions')]);
  D.push(['Paper: Actions pressed again closes', async p => { await PAPER(p); await press(p, '#ig-actions'); await settle(p); }, p => press(p, '#ig-actions')]);
  D.push(['Paper: zoom +', PAPER, p => press(p, '.paper-zc [data-rl-type="1"]')]);
  D.push(['Paper: Dossier "All N ›"', PAPER, p => press(p, '[data-pd-acts-toggle], .pd-acts-all, button:has-text("All 1")')]);
  D.push(['Paper: Dossier "Key terms"', PAPER, p => press(p, 'text=Key terms')]);
  D.push(['Paper: Dossier "Obligations" line', PAPER, p => press(p, 'text=Obligations >> visible=true')]);
  D.push(['Paper: Dossier "Who else"', PAPER, p => press(p, 'text=Who else >> visible=true')]);
  D.push(['Paper: "‹ Back to the page you were on"', PAPER, p => press(p, 'text=Back to the page you were on')]);
  D.push(['Paper: chip "history"', PAPER, p => press(p, ':is(.jb-chip,a,button):text-is("history") >> visible=true')]);
  D.push(['Paper: ‹ (bar back) to Home', PAPER, p => press(p, '#dk-back')]);
  D.push(['Paper → Board (type "board" in Jambo box)', PAPER, async p => { const s = '#igd-input'; await typeIn(p, s, 'board'); await p.press(s, 'Enter'); }]);
  /* the Board and its contract */
  const BOARD = async p => { await home(p); await typeIn(p, '#cn-q', 'board'); await p.press('#cn-q', 'Enter'); await settle(p); await pause(400); };
  D.push(['Board: a stage number (Executed)', BOARD, p => press(p, '[data-hb-dig="st:Signed"] >> visible=true')]);
  D.push(['Board: a figure (live contracts)', BOARD, p => press(p, '[data-hb-dig="f:live"] >> visible=true')]);
  D.push(['Board: Needs you second tab', BOARD, p => press(p, '[data-nd-tab] >> visible=true >> nth=1')]);
  D.push(['Board: Needs you a row button', BOARD, p => press(p, '#hb-board [data-cn-need] >> visible=true')]);
  D.push(['Board: Jambo box focused empty', BOARD, p => press(p, '#igd-input')]);
  /* Contracts list */
  const LIST = async p => { await home(p); await typeIn(p, '#cn-q', 'contracts'); await p.press('#cn-q', 'Enter'); await settle(p); await pause(400); };
  D.push(['Contracts: a row', LIST, p => press(p, '#ct-place tbody tr >> nth=2')]);
  D.push(['Contracts: a stage tab', LIST, p => press(p, '#ct-place [data-reg-view="needs"] >> visible=true')]);
  /* the list pages: a press selects, a second opens */
  for (const [w, v] of [['negotiations', 'redline'], ['approvals', 'approvals'], ['obligations', 'obligations'], ['requests', 'intake'], ['people', 'directory'], ['parties', 'customers'], ['our paper', 'templates'], ['my notes', 'mynotes']]){
    const go = async p => { await home(p); await p.evaluate(v => setView(v), v); await settle(p); await pause(400); };
    const row = `#content tbody tr:not(.ins-grp):not(.ob-empty) >> visible=true >> nth=0`;
    D.push([`${w}: first press on a row`, go, p => press(p, row)]);
    D.push([`${w}: second press on the same row`, async p => { await go(p); await press(p, row); await settle(p); }, p => press(p, row)]);
    D.push([`${w}: a quick double press on a row`, go, async p => { const el = p.locator(row).first(); await el.waitFor({ state: 'visible', timeout: 5000 });
      if (scr.touch){ await el.tap(); await pause(90); await el.tap(); } else await el.dblclick(); }]);
  }
  /* Settings */
  const SET = async p => { await home(p); await p.evaluate(() => setView('team')); await settle(p); await pause(300); };
  D.push(['Settings: the Company tab', SET, p => press(p, '[data-st-tab="company"]')]);
  D.push(['Settings: a contents line', SET, p => press(p, '[data-st-toc] >> visible=true >> nth=2')]);
  D.push(['Approvals: open a contract, then ‹ once', async p => { await home(p); await p.evaluate(() => setView('approvals')); await settle(p);
    const el = p.locator('#content tbody tr >> visible=true').first(); await el.dblclick(); await settle(p); await pause(300); }, p => press(p, '#dk-back')]);
  D.push(['Contracts: Wall', LIST, p => press(p, '[data-ct-show="wall"] >> visible=true')]);
  D.push(['Settings: ‹ back to Home', SET, p => press(p, '#dk-back')]);
  return D;
}

/* ---- STILL AND SCROLL ---- */
async function still(page, scr, name, setup){
  if (ONLY && !ONLY.test(name)) return null;
  await setup(page); await settle(page);
  await page.evaluate(() => window.__ga.start()); await pause(3000);
  const r = await page.evaluate(() => window.__ga.stop()); r.name = name; r.screen = scr.name; r.kind = 'still'; return r;
}
async function scrollList(page, scr, name, setup, sel){
  if (ONLY && !ONLY.test(name)) return null;
  await setup(page); await settle(page);
  const box = await page.locator(sel).first().boundingBox().catch(() => null);
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 300));
  await page.evaluate(() => window.__ga.start());
  for (let i = 0; i < 24; i++){ await page.mouse.wheel(0, 140); await pause(35); }
  await pause(400);
  const r = await page.evaluate(() => window.__ga.stop()); r.name = name; r.screen = scr.name; r.kind = 'scroll'; return r;
}
async function keepsPlace(page, scr, name, view){
  if (ONLY && !ONLY.test(name)) return null;
  await home(page); await page.evaluate(v => setView(v), view); await settle(page);
  const before = await page.evaluate(() => { const tr = document.querySelector('#content tbody tr'); let s = tr; while (s && s !== document.body && !(s.scrollHeight > s.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(s).overflowY))) s = s.parentElement;
    if (!s || s === document.body) return null; s.setAttribute('data-ga-sc', '1'); s.scrollTop = 600; return s.scrollTop; });
  await pause(300);
  const row = page.locator('#content tr[data-ins-row] >> visible=true').nth(3);
  if (await row.count()) { await row.dblclick().catch(() => {}); }
  await settle(page); await pause(300);
  await page.locator('#dk-back').click().catch(() => {}); await settle(page); await pause(400);
  const after = await page.evaluate(() => { const tr = document.querySelector('#content tbody tr'); let s = tr; while (s && s !== document.body && !(s.scrollHeight > s.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(s).overflowY))) s = s.parentElement;
    return { top: s && s !== document.body ? s.scrollTop : null, view: state.view }; });
  return { name, screen: scr.name, kind: 'place', before, after: after.top, view: after.view };
}

(async () => {
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await seedWorkspace(h, { contracts: book() });
  for (let i = 0; i < 6; i++) await W.admin.json('/api/intake', { method: 'POST', body: { title: 'A supply agreement for depot ' + (i + 1), need: 'We need a supply agreement for the new depot, about KES 4M a year.', counterparty: 'Twiga Foods' } }).catch(() => {});
  for (let i = 0; i < 6; i++) await W.admin.json('/api/me/items', { method: 'POST', body: { kind: 'note', item: { title: 'Check the renewal ' + (i + 1), body: 'Look at the notice period before it renews.', contractId: 'MK-A1' } } }).catch(() => {});
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const all = [];
  try {
    for (const scr of SCREENS){
      const ctx = await browser.newContext({ viewport: { width: scr.w, height: scr.h }, hasTouch: scr.touch, isMobile: false, reducedMotion: 'no-preference' });
      await ctx.addInitScript(INSTRUMENT);
      const page = await ctx.newPage();
      const errs = []; page.on('pageerror', e => errs.push(e.message.split('\n')[0]));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 100, null, { timeout: 30000 });
      await pause(1500);
      for (const [name, setup, press, opts] of doors(scr)){
        let r; try { r = await measure(page, scr, name, setup, press, opts); } catch (e){ r = { name, screen: scr.name, error: e.message.split('\n')[0] }; }
        if (r){ all.push(r); process.stdout.write(line(r) + '\n'); }
      }
      const BOARD = async p => { await home(p); await typeIn(p, '#cn-q', 'board'); await p.press('#cn-q', 'Enter'); };
      const EXPL = async p => { await home(p); await typeIn(p, '#cn-q', 'explorer'); await p.press('#cn-q', 'Enter'); };
      for (const r of [await still(page, scr, 'Still: sitting on the Board 3 s', BOARD), await still(page, scr, 'Still: sitting on Explorer 3 s', EXPL),
        await still(page, scr, 'Still: sitting on a contract\'s paper 3 s', p => openPaper(p, 'MK-A1')),
        await scrollList(page, scr, 'Scroll: the Contracts list', async p => { await home(p); await typeIn(p, '#cn-q', 'contracts'); await p.press('#cn-q', 'Enter'); }, '#ct-place'),
        await scrollList(page, scr, 'Scroll: the Approvals list', async p => { await home(p); await p.evaluate(() => setView('approvals')); }, '#content'),
        await scrollList(page, scr, 'Scroll: a contract\'s paper', p => openPaper(p, 'MK-A1'), '#ig-paper, .ig-paper, #content'),
        await keepsPlace(page, scr, 'Place: Approvals list scrolled, open a row, ‹ back', 'approvals'),
        await keepsPlace(page, scr, 'Place: Obligations scrolled, open a row, ‹ back', 'obligations')]){
        if (r){ all.push(r); process.stdout.write(line(r) + '\n'); }
      }
      if (errs.length) all.push({ name: 'page errors', screen: scr.name, errors: [...new Set(errs)].slice(0, 20) });
      if (errs.length) console.log('PAGE ERRORS', scr.name, [...new Set(errs)].slice(0, 10));
      await ctx.close();
    }
  } finally { await browser.close(); await h.stop(); }
  if (OUTF) fs.writeFileSync(OUTF, JSON.stringify(all, null, 1));
})().catch(e => { console.error(e); process.exit(1); });

function line(r){
  if (r.kind === 'place') return `${r.screen.padEnd(10)} ${r.name.padEnd(56)} scroll before ${r.before} after ${r.after} (${r.view})`;
  if (r.error && r.moved === undefined) return `${r.screen.padEnd(10)} ${r.name.padEnd(56)} ERROR ${r.error}`;
  const f = [];
  f.push(r.moved ? 'moved' : 'STILL');
  if (r.secondPress) f.push('2nd press ' + (r.secondPress.moved ? 'MOVED' : 'still'));
  if (r.kind !== 'still' && r.kind !== 'scroll') f.push('first ' + r.first + 'ms', 'settled ' + r.settled + 'ms');
  f.push('lt ' + r.longTasks + '/' + r.ltWorst + 'ms', 'gaps ' + r.gaps + '/' + r.gapWorst + 'ms', 'redraws ' + r.redraws);
  if (r.twice && r.twice.length) f.push('TWICE ' + r.twice.join(','));
  if (r.saidNotShown) f.push('SAID-NOT-SHOWN');
  if (r.toasts && r.toasts.length) f.push('toast ' + JSON.stringify(r.toasts));
  if (r.banned && r.banned.length) f.push('BANNED ' + r.banned.join('; '));
  if (r.error) f.push('err ' + r.error);
  return `${r.screen.padEnd(10)} ${r.name.padEnd(56)} ${f.join(' · ')}`;
}
