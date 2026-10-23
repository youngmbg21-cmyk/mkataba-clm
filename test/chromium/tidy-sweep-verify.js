/* Chromium verification: THE TIDY SWEEP — nothing spills, nothing squeezes,
   nothing overlaps (owner, 22 Oct 2026, over two screenshots).
   =====================================================================
   "how do i ensure I have instructions for claude cleans up all these
   attention to detail issues like the one highlighted in the image? I have
   also seen numbers get out of their cards in the board." Then, over the
   Board's side list: "This is very very poor showing me a cut off card and
   you have to scroll to have visibility ... This should be part of the whole
   platform sweep."

   The first picture: the New agreement sheet's "the closest" tag folded onto
   two lines and sat on the template's name. The second: the Board's contract
   card in a side list wider than its room (a sideways scrollbar, "Clause 20 ·
   LIMITAT" cut mid-word), "4 open · 0 settled · 0 rounds" broken over three
   lines, boxes cut at the bottom edge.

   WHAT THIS MEASURES, on the painted page, at the owner's three screens
   (1440×780, 1536×730, 1366×950), on every page a person can open:
     SPILL     a thing painted past the edge of the card it sits in
     CUT       words clipped mid-word (overflow hidden, no ellipsis) or the
               page/a panel scrolling sideways
     SQUEEZE   a one-line thing (button, tag, chip, count, figure) on two lines
     OVERLAP   two pieces of text painted on top of each other
   A pane that scrolls DOWN is not a fault (a long list is allowed to run on);
   sideways is. Shortening with "…" is a choice, not a cut, and is only counted.

   MEASURED AT THE PARENT (e05849a, before the fixes): "the closest" on two
   lines at 1440 and on the iPad (13px past its card there); the Board's side
   list card 615px wider than its 560px panel, its action row 633px and a
   clause link 246px past their boxes; Jambo's house 3px wider than the page.
   One alarm was the check's own: the Dossier's rows below the feed's bottom
   are carried by a scroller and never painted (now `clipped`).

   Run: node test/chromium/tidy-sweep-verify.js
        HATI_TIDY_ONLY=board,draft node test/chromium/tidy-sweep-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'tidy-sweep');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

/* THE OWNER'S THREE SCREENS (CLAUDE.md, STANDING LESSONS). */
const SCREENS = [
  { k: 'laptop-a', w: 1440, h: 780 },
  { k: 'laptop-b', w: 1536, h: 730 },
  { k: 'ipad', w: 1366, h: 950 },
];

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const blocked = [];
const drive = async (page, fn, arg, fallback) => {
  try { return arg === undefined ? await page.evaluate(fn) : await page.evaluate(fn, arg); }
  catch (e) { blocked.push(String((e && e.message) || e).split('\n')[0]); return fallback; }
};
const waitFor = async (page, fn, arg, ms = 10000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};
const settle = async page => { await page.evaluate(() => document.fonts.ready).catch(() => {}); await page.waitForTimeout(700); };

/* ============================================================
   THE MEASURE, run inside the page. One reading of everything painted in the
   window: what spills, what is cut, what is squeezed, what overlaps.
   ============================================================ */
const MEASURE = `(() => {
  const vw = innerWidth, vh = innerHeight;
  const R = el => el.getBoundingClientRect();
  const vis = el => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = R(el); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw; };
  const words = el => (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
  const who = el => { const id = el.id ? '#' + el.id : ''; const cls = (typeof el.className === 'string' ? el.className : '').split(/\\s+/).filter(Boolean).slice(0, 2).map(c => '.' + c).join('');
    return el.tagName.toLowerCase() + id + cls; };
  const inside = el => { let p = el.parentElement, out = []; while (p && p !== document.body && out.length < 3) { out.push(who(p)); p = p.parentElement; } return out.join(' < '); };
  /* an ancestor hides its children only by display, visibility or opacity — a zero-height holder of fixed things (#modal-root) shows them still */
  const gone = el => { const cs = getComputedStyle(el); return cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0; };
  const hidden = el => { if (!vis(el)) return true; for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { if (gone(p)) return true; } return false; };
  /* COVERED: a thing under a page, a sheet or a dialog is not what the reader sees — the painted pixel at its middle decides */
  const covered = el => { const r = R(el); const x = Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(vh - 1, Math.max(0, r.top + Math.min(r.height / 2, 8)));
    const top = document.elementFromPoint(x, y); if (!top) return true; return !(top === el || el.contains(top) || top.contains(el)); };
  const every = [...document.body.querySelectorAll('*')].filter(el => !el.closest('script,style,svg,canvas,template,noscript,.sr-only,[aria-hidden="true"]'));
  const shown = every.filter(el => !hidden(el));
  const all = shown.filter(el => !covered(el));
  const whyHidden = el => { for (let p = el; p && p !== document.body; p = p.parentElement) { if (!vis(p)) { const cs = getComputedStyle(p), r = R(p); return who(p) + ' display=' + cs.display + ' vis=' + cs.visibility + ' op=' + cs.opacity + ' rect=' + [r.left, r.top, r.width, r.height].map(Math.round).join(','); } } return 'shown'; };
  const feed = document.getElementById('igd-feed');
  const tally = { vw, vh, every: every.length, shown: shown.length, seen: all.length, feed: feed ? [feed.getBoundingClientRect().top, feed.getBoundingClientRect().bottom, getComputedStyle(feed).overflowY, feed.scrollTop].map(x => typeof x === 'number' ? Math.round(x) : x).join(',') : 'none',
    best: (() => { const t = document.querySelector('.na-best'); if (!t) return 'none'; const c = t.closest('.na-pick'), n = c && c.querySelector('.na-pick-n'); const rr = r => [r.left, r.right, r.width].map(Math.round).join(','); return 'tag ' + rr(t.getBoundingClientRect()) + ' name ' + rr(n.getBoundingClientRect()) + ' card ' + rr(c.getBoundingClientRect()) + ' cols ' + getComputedStyle(c).gridTemplateColumns; })(), naBest: document.querySelector('.na-best') ? whyHidden(document.querySelector('.na-best')) : 'none', sampleCovered: shown.filter(el => covered(el)).slice(0, 6).map(el => { const r = R(el); const top = document.elementFromPoint(Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), Math.min(vh - 1, Math.max(0, r.top + Math.min(r.height / 2, 8)))); return who(el) + ' under ' + (top ? who(top) : 'nothing'); }) };
  const out = { spill: [], cut: [], squeeze: [], overlap: [], scrollX: [], ellipsis: 0, counted: all.length, tally };
  const line = el => parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.3;

  /* SIDEWAYS SCROLL: the page, or any box, wider than its room. */
  if (document.documentElement.scrollWidth > vw + 1) out.scrollX.push({ who: 'the page', by: document.documentElement.scrollWidth - vw });
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && /(auto|scroll)/.test(cs.overflowX) && el.clientHeight > 40)
      out.scrollX.push({ who: who(el), in: inside(el), by: el.scrollWidth - el.clientWidth });
  }

  /* CUT: a text-bearing box clipping its own words with no ellipsis. */
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (!/(hidden|clip)/.test(cs.overflowX)) continue;
    if (el.scrollWidth <= el.clientWidth + 2 || el.clientWidth <= 0) continue;
    const w = words(el); if (!w || w.length > 160) continue;
    if (cs.textOverflow === 'ellipsis' && cs.whiteSpace === 'nowrap') { out.ellipsis++; continue; }
    /* a box whose child is itself a scroller or an ellipsised line is that child's story */
    if ([...el.children].some(ch => { const c = getComputedStyle(ch); return /(auto|scroll)/.test(c.overflowX) || (c.textOverflow === 'ellipsis' && c.whiteSpace === 'nowrap'); })) continue;
    out.cut.push({ who: who(el), in: inside(el), text: w.slice(0, 60), by: el.scrollWidth - el.clientWidth });
  }

  /* SQUEEZE: a thing meant for one line painted on two. */
  const ONE = 'button, .hb-chip, .jb-chip, .na-best, .reg-chip, .lh-chip, .ui-chip, .chip, .tag, .pill, .badge, .hb-fig-n, .igx-fig-n, .lh-tab, .ph-tab, .reg-stg, [class*="-count"], [class*="-tag"], [class*="-badge"], [class*="-pill"], .ui-btn, .hb-btn, .hb-link, .ui-link, th';
  for (const el of all) {
    if (!el.matches(ONE)) continue;
    const cs = getComputedStyle(el);
    if (cs.whiteSpace === 'normal' && cs.display === 'block') continue; /* a paragraph-like link: wraps by rule */
    /* two lines BY DESIGN: a figure's word over its number (Your book's row, the card's tile), a tab's count over its word, a sentence with its act in it */
    if (el.matches('.ui-link-say, .hb-say, .hb-mi, [data-dlg-cancel], .hb-fig-main, .hb-fig, .hb-cfig, .pd-tab, .hb-payk-i, .igx-fig, .na-pick, .hb-card, .tpl-pf-i')) continue;
    const w = words(el); if (!w || w.length > 48) continue;
    if (el.querySelector('br, p, div, ul, table')) continue;
    /* THE LINES THE WORDS TOOK, not the box's height: a tag with a fixed height folds its words inside it and the box never grows */
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const rects = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) { if (!n.textContent.trim()) continue; const pe = n.parentElement; if (!pe || hidden(pe)) continue;
      let abs = false; for (let q = pe; q && q !== el; q = q.parentElement) { const qc = getComputedStyle(q); if (qc.position === 'absolute' || qc.position === 'fixed') { abs = true; break; } } if (abs) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); rects.push(...rg.getClientRects()); }
    const lh = line(el), tops = rects.filter(q => q.width > 2 && q.height > 2).map(q => q.top).sort((a, b) => a - b);
    let lines = tops.length ? 1 : 0; for (let i = 1; i < tops.length; i++) if (tops[i] - tops[i - 1] > lh * 0.6) lines++;
    if (lines > 1) out.squeeze.push({ who: who(el), in: inside(el), text: w.slice(0, 48), lines, h: Math.round(R(el).height) });
  }

  /* SPILL: anything painted past the card it sits in, where that card does not scroll. */
  const CARD = '.hb-card, .hb-fig, .hb-sheet, .igx-card, .igx-fig, .ph-card, .ca-card, .jb-card, .na-pick, .na-sec, .sap-page > section, .rl-card, .hb-csec, .hb-cfig, .ins-panel, #ins-panel, .dlg, .ui-dialog, .room-band, .ct-card, .lh-head, .hb-chead, .hb-ag, .hb-ins, .jl-frame, .dk-notice, .ob-card, .st-card, .cu-card, .dir-card, .mig-side, .tpl-card, .hb-sheet-b';
  for (const card of all) {
    if (!card.matches(CARD)) continue;
    const ccs = getComputedStyle(card); if (/(auto|scroll|hidden|clip)/.test(ccs.overflow) || /(auto|scroll|hidden|clip)/.test(ccs.overflowX)) continue;
    const cr = R(card);
    for (const el of card.querySelectorAll('*')) {
      if (hidden(el) || el.closest('svg,canvas')) continue;
      const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.position === 'absolute') continue;
      /* a scroller between the two keeps its own children */
      let p = el.parentElement, kept = false; while (p && p !== card) { const pc = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(pc.overflow) || /(auto|scroll|hidden|clip)/.test(pc.overflowX)) { kept = true; break; } p = p.parentElement; }
      if (kept) continue;
      const r = R(el); if (!r.width || !r.height) continue;
      const over = Math.max(r.right - cr.right, r.bottom - cr.bottom, cr.left - r.left);
      if (over > 2 && words(el)) out.spill.push({ who: who(el), in: who(card), text: words(el).slice(0, 48), by: Math.round(over) });
    }
  }
  /* one line per card, the worst spill */
  const best = {}; for (const s of out.spill) { if (!best[s.in] || best[s.in].by < s.by) best[s.in] = s; } out.spill = Object.values(best);

  /* OVERLAP: two text leaves painted on each other (neither inside the other). */
  /* NOT PAINTED: a thing carried past the box of a scroller it sits in (the Dossier's rows below the feed's bottom) — its rect still intersects, its pixels do not */
  const clipped = el => { const r = R(el); for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (!/(auto|scroll|hidden|clip)/.test(cs.overflowY + cs.overflowX)) continue; const b = p.getBoundingClientRect(); if (r.bottom <= b.top + 1 || r.top >= b.bottom - 1 || r.right <= b.left + 1 || r.left >= b.right - 1) return true; } return false; };
  /* WHAT IS PAINTED OF IT: the rect cut down to every scroller it sits in — the last row of a feed, half under its foot, overlaps nothing with the half that shows */
  const visRect = el => { let r = R(el), l = r.left, t = r.top, rt = r.right, bt = r.bottom; for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (!/(auto|scroll|hidden|clip)/.test(cs.overflowY + cs.overflowX)) continue; const b = p.getBoundingClientRect(); l = Math.max(l, b.left); t = Math.max(t, b.top); rt = Math.min(rt, b.right); bt = Math.min(bt, b.bottom); } return { left: l, top: t, right: rt, bottom: bt, width: rt - l, height: bt - t }; };
  const leaves = all.filter(el => !clipped(el)).filter(el => { if (!el.childNodes.length) return false; let t = false; for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) t = true; return t; })
    .map(el => ({ el, r: visRect(el), w: words(el) })).filter(x => x.w && x.r.width > 4 && x.r.height > 4);
  const seen = new Set();
  for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
    const a = leaves[i], b = leaves[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (ox < 4 || oy < 6) continue;
    /* one on top of the other by design (a pop-up, a panel, a dialog, a tip, a fixed bar): different stacking roots */
    const stackOf = el => { let p = el; while (p && p !== document.body) { const cs = getComputedStyle(p); if (cs.position === 'fixed' || (cs.position !== 'static' && cs.zIndex !== 'auto')) return p; p = p.parentElement; } return document.body; };
    if (stackOf(a.el) !== stackOf(b.el)) continue;
    /* the painted pixel decides: the point in the overlap belongs to one of them */
    const px = Math.max(a.r.left, b.r.left) + ox / 2, py = Math.max(a.r.top, b.r.top) + oy / 2;
    const top = document.elementFromPoint(px, py); if (!top) continue;
    const hit = x => top === x.el || x.el.contains(top) || top.contains(x.el);
    if (!(hit(a) && hit(b)) && !(hit(a) || hit(b))) continue;
    const key = a.w.slice(0, 20) + '|' + b.w.slice(0, 20); if (seen.has(key)) continue; seen.add(key);
    const rr = r => [r.left, r.top, r.right, r.bottom].map(Math.round).join(',');
    out.overlap.push({ a: a.w.slice(0, 40), b: b.w.slice(0, 40), who: who(a.el) + ' × ' + who(b.el), in: inside(a.el), ox: Math.round(ox), oy: Math.round(oy), ar: rr(a.r), br: rr(b.r), top: who(top) });
  }
  return out;
})()`;

/* ============================================================
   THE PLACES — every page a person can open on a computer, by its own door.
   Each is guarded: a door that is not there reports, never throws.
   ============================================================ */
const PLACES = [
  { k: 'home', name: 'Home', go: `setView('counter')`, wait: `document.querySelector('#cn-needs, #cn-q')` },
  { k: 'board', name: 'Board', go: `setView('dashboard')`, wait: `document.querySelector('#hb-board .hb-card')` },
  { k: 'board-sheet', name: 'Board · side list', go: `setView('dashboard'); setTimeout(() => { const el = [...document.querySelectorAll('svg.hb-svg [data-hb-dig], .hb-chart [data-hb-dig], .hb-chart-bars [data-hb-dig], .hb-ctab [data-hb-dig], .hb-small [data-hb-dig], .hb-stagebar [data-hb-dig], .hb-stagekey [data-hb-dig]')].find(e => !e.disabled); if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, 600)`, wait: `document.querySelector('.hb-sheet tr[data-hb-sheet-c]')` },
  { k: 'board-card', name: 'Board · a row of the side list, landed on its Dossier', go: `setView('dashboard'); let t1 = 0; const w1 = setInterval(() => { const el = document.querySelector('.hb-stagekey [data-hb-dig="st:Under Review"]'); if (!el && ++t1 < 25) return; clearInterval(w1); if (!el) return; el.dispatchEvent(new MouseEvent('click', { bubbles: true })); let t2 = 0; const w2 = setInterval(() => { const tr = document.querySelector('.hb-sheet tr[data-hb-sheet-c="MK-400"]'); if (!tr && ++t2 < 25) return; clearInterval(w2); if (tr) tr.click(); }, 200); }, 200)`, wait: `document.querySelector('#pd-glance') && /MK-400/.test((document.querySelector('#dk-page') || document.body).textContent) && !document.querySelector('.hb-sheet')` },
  { k: 'contracts', name: 'Contracts', go: `setView('register')`, wait: `document.querySelector('#ct-place table, .reg-table, #ct-place')` },
  { k: 'paper', name: 'Workspace · a paper with its Dossier', go: `(() => { const c = state.contracts.find(c => c.status === 'Under Review') || state.contracts[0]; pdOpenOnHome(c.id, 'copilot'); })()`, wait: `document.querySelector('#ig-paper') && document.querySelector('#pd-glance')` },
  { k: 'checklist', name: 'Workspace · the Checklist', go: `(() => { const c = state.contracts.find(c => c.status === 'Under Review') || state.contracts[0]; pdOpenOnHome(c.id, 'doc'); })()`, wait: `document.querySelector('#pd-thread, #ig-dock [data-pd-tab]')` },
  { k: 'redlines', name: 'Workspace · Redlines', go: `(() => { const c = state.contracts.find(c => c.status === 'Under Review' && (c.changes || []).length) || state.contracts.find(c => c.status === 'Under Review') || state.contracts[0]; openRedlineWorkbench(c.id); })()`, wait: `document.querySelector('.rl-column, .rl-idx, #nego-send, .rl-card')` },
  { k: 'negotiations', name: 'Negotiations', go: `openNegotiations()`, wait: `document.querySelector('.ngl-page, #ngl-root, .ngl-head')` },
  { k: 'calendar', name: 'Calendar', go: `setView('calendar')`, wait: `document.querySelector('#hb-cal .cal-week, #hb-cal')` },
  /* Explorer's door (hbSetFace('explorer')) lands on the Insights view in this build; measured as it lands */
  { k: 'explorer', name: 'Explorer · where its door lands', go: `setView('dashboard'); setTimeout(() => { try { hbSetFace('explorer'); } catch (e) { hbOpenExplorer(); } }, 500)`, wait: `document.querySelector('#ig-page[data-hb-side="explorer"] svg, #ig-page[data-hb-side="explorer"] canvas, .igx-card, #ig-gwrap svg')` },
  { k: 'obligations', name: 'Obligations', go: `setView('obligations')`, wait: `document.querySelector('.obw-wk, #obw-root, .ob-list')` },
  { k: 'approvals', name: 'Approvals', go: `setView('approvals')`, wait: `document.querySelector('.ap-page, #ap-root, .sap-page')` },
  { k: 'requests', name: 'Requests', go: `setView('intake')`, wait: `document.querySelector('.ik-page, #ik-root, .sap-page')` },
  { k: 'import', name: 'Import', go: `setView('migration')`, wait: `document.querySelector('#mig-drop, #mig-side')` },
  { k: 'paper-book', name: 'Our paper', go: `setView('templates')`, wait: `document.querySelector('.tpl-pf, #tpl-new, .tpl-shelf')` },
  { k: 'standards', name: 'Our standards', go: `setView('playbook')`, wait: `document.querySelector('.sd-page, #sd-root, .sap-page')` },
  { k: 'people', name: 'People', go: `setView('directory')`, wait: `document.querySelector('.dir-td-wrap, .dir-table, .sap-page')` },
  { k: 'customers', name: 'Customers', go: `setView('customers')`, wait: `document.querySelector('.cu-page, .cu-table, .sap-page')` },
  { k: 'mynotes', name: 'My notes', go: `setView('mynotes')`, wait: `document.querySelector('.mn-page, #mn-root, .sap-page')` },
  { k: 'jambo', name: "Jambo's house", go: `setView('jambo')`, wait: `document.querySelector('#jh-log, #jh-office')` },
  /* RE-POINTED 22 Oct 2026 (Round A, the one desk): Jambo's work is the Board's Needs you card, its rows .nd-br */
  { k: 'agents', name: "Jambo's work", go: `hbOpenAgent()`, wait: `document.querySelector('#hm-agents .nd-br')` },
  { k: 'settings', name: 'Settings · You', go: `openSettingsAt('you')`, wait: `document.querySelector('#st-side')` },
  { k: 'company', name: 'Settings · Company', go: `openSettingsAt('company')`, wait: `document.querySelector('#st-side')` },
  { k: 'draft', name: 'New agreement · from a sentence', go: `setView('dashboard'); setTimeout(() => caDraftRun(caReadDraft("draft a warehousing contract with Lisa's Baby Care")), 600)`, wait: `document.querySelector('#na-root.na-one .na-closest .na-pick')` },
  { k: 'new', name: 'New agreement · the form', go: `openNewAgreement({ streamAsk: true })`, wait: `document.querySelector('#na-root')` },
  { k: 'brief', name: "Jambo's side panel", go: `setView('dashboard'); setTimeout(() => { try { aiSideToggle(true); } catch (e) { try { aiSideToggle(); } catch (_) {} } }, 400)`, wait: `document.querySelector('#ai-panel.is-in, #ai-panel[data-side], #ai-panel .jb-card')` },
];

const only = (process.env.HATI_TIDY_ONLY || '').split(',').map(s => s.trim()).filter(Boolean);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [], report = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errors.push(String(e).slice(0, 180)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd');
    await page.fill('#su-name', 'Amina Otieno');
    await page.fill('#su-email', 'admin@example.co.ke');
    await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample');
    if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go');
    await page.waitForTimeout(3500);
    await page.keyboard.press('Escape').catch(() => {});
    check('0 — signed in with the sample book', await drive(page, () => Array.isArray(state.contracts) && state.contracts.length > 5, undefined, false));
    /* THE OWNER'S OWN NAMES: the faults in both pictures are content-shaped —
       a long party name, a long paper name, a clause's name in capitals — and
       the sample book's short names never trip them. One deal and one standard
       with the owner's lengths join the book in the browser (nothing saved). */
    const seeded = await drive(page, () => {
      const base = state.contracts.find(c => c.status === 'Under Review') || state.contracts[0]; if (!base) return false;
      const iso = off => new Date(Date.now() + off * 86400000).toISOString();
      const ch = (i, label) => ({ id: 'TIDY-CH-' + i, clauseId: 'cl-' + i, clauseLabel: label, authorSide: 'counterparty', status: 'pending', createdAt: iso(-3 - i), withdrawn: false, op: 'edit', bodyHtml: '<p>x</p>' });
      const c = Object.assign({}, JSON.parse(JSON.stringify(base)), { id: 'MK-400', contractNo: 'MK-400', name: 'Master Supply and Distribution Agreement — Nordvane Consumer Brands AB', counterparty: 'Nordvane Consumer Brands AB',
        status: 'Under Review', value: 185000000, metadata: Object.assign({}, base.metadata || {}, { value: 185000000, currency: 'SEK' }), expiry: '2028-12-31', _loaded: true, _light: false,
        changes: [ch(1, 'Clause 20 · LIMITATION OF LIABILITY AND INDEMNIFICATION'), ch(2, 'Clause 7 · INVOICING AND PAYMENT TERMS'), ch(3, 'Clause 12 · TERMINATION FOR CONVENIENCE'), ch(4, 'Clause 3 · EXCLUSIVITY AND MINIMUM PURCHASE')],
        negotiation: Object.assign({}, base.negotiation || {}, { round: 1, rounds: [{ n: 1, changes: [] }], turn: 'owner' }) });
      state.contracts.unshift(c);
      state.settings = state.settings || {}; state.settings.customTemplates = (state.settings.customTemplates || []).concat([
        { id: 'tidy-wla', name: 'Warehousing Logistics Agreement', description: 'Warehousing and logistics services, our standard', format: 'rich', body: '<p>1. Parties</p><p>2. Services</p>', fields: [] },
        { id: 'tidy-saas', name: 'Software as a Service Agreement', description: 'SaaS subscription on our paper', format: 'rich', body: '<p>1. Parties</p><p>2. Services</p>', fields: [] }]);
      return true;
    }, undefined, false);
    check('0 — the owner-length names are on the book', seeded);

    for (const S of SCREENS) {
      await page.setViewportSize({ width: S.w, height: S.h });
      for (const P of PLACES) {
        if (only.length && !only.includes(P.k)) continue;
        /* back to a clean footing between places: every pop-up and sheet away */
        await page.keyboard.press('Escape').catch(() => {});
        await page.keyboard.press('Escape').catch(() => {});
        await drive(page, () => { try { closeModal && closeModal(); } catch (_) {} try { const x = document.querySelector('.hb-sheet [data-hb-sheet-x]'); if (x) x.click(); } catch (_) {} try { if (typeof aiSideToggle === 'function' && document.querySelector('#ai-panel.is-in')) aiSideToggle(false); } catch (_) {} }, undefined, null);
        const opened = await drive(page, P.go, undefined, 'threw');
        const there = await waitFor(page, P.wait);
        await settle(page);
        await page.mouse.move(2, S.h - 4).catch(() => {});
        const shot = `${S.k}-${P.k}.png`;
        await page.screenshot({ path: path.join(OUT, shot) }).catch(() => {});
        const m = await drive(page, MEASURE, undefined, null);
        const row = { screen: S.k, w: S.w, h: S.h, place: P.k, name: P.name, there, opened: opened !== 'threw', shot, m };
        report.push(row);
        if (!there) { const st = await drive(page, () => ({ sheet: !!document.querySelector('.hb-sheet'), page: (document.querySelector('#dk-page') || {}).textContent, glance: !!document.querySelector('#pd-glance'), view: state.view }), undefined, null);
          check(`${S.k} · ${P.name} — the door opened`, false, (opened === 'threw' ? 'the door threw: ' + blocked[blocked.length - 1] : 'the page did not paint what the probe waits for') + ' · ' + JSON.stringify(st)); continue; }
        if (!m) { check(`${S.k} · ${P.name} — measured`, false, 'the probe threw'); continue; }
        if (process.env.HATI_TIDY_DEBUG) console.log('      tally', JSON.stringify(m.tally));
        const n = m.spill.length + m.cut.length + m.squeeze.length + m.overlap.length + m.scrollX.length;
        check(`${S.k} · ${P.name} — tidy`, n === 0, n ? `${m.scrollX.length} sideways · ${m.cut.length} cut · ${m.squeeze.length} squeezed · ${m.spill.length} spilt · ${m.overlap.length} overlapping` : `${m.counted} things looked at`);
        for (const x of m.scrollX) console.log(`      SIDEWAYS  ${x.who}${x.in ? ' in ' + x.in : ''} · ${x.by}px wider than its room`);
        for (const x of m.cut) console.log(`      CUT       "${x.text}" ${x.who} in ${x.in} · ${x.by}px lost`);
        for (const x of m.squeeze) console.log(`      SQUEEZED  "${x.text}" ${x.who} in ${x.in} · on ${x.lines} lines in a ${x.h}px box`);
        for (const x of m.spill) console.log(`      SPILT     "${x.text}" ${x.who} past ${x.in} by ${x.by}px`);
        for (const x of m.overlap) console.log(`      OVERLAP   "${x.a}" × "${x.b}" (${x.who}) in ${x.in}${process.env.HATI_TIDY_DEBUG ? ' · a=' + x.ar + ' b=' + x.br + ' top=' + x.top : ''}`);
      }
    }
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
    check('every probe ran', blocked.length === 0, blocked.join(' | ') || undefined);
    check('no page errors', errors.length === 0, errors.join(' | ') || undefined);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed — shots and report.json in ${OUT}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
