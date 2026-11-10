/* Chromium verification: ONE WHITE SHEET (Round 1 of the platform sweep, owner, 9 Nov 2026).
   =====================================================================
   The owner, over a picture of Settings: "the settings page also needs to be
   on a full white paper but it looks as if it was built on cards which is
   incorrect. Review whether there are other areas where the pages are not
   built on full white paper." And: "the white pages should be considered as
   the future state and bugs are only to be identified on the new visuals."

   WHAT MAKES A PAGE READ AS CARDS, measured on the painted page in the NEW
   LOOK, at the owner's three screens, on every place of the tidy sweep:
     GROUND   grey ground (#F5F5F7) or desk ground (#EFEEEB) painted LEFT of
              Jambo's panel by one element over at least 300×48 px — the
              paper's own canvas (a sheet on its desk) and the designed grey
              parts (a chosen row, a day cell, the drop area, a legend strip)
              excepted
     EDGE     a grey strip of ANY width running down the page's right edge,
              beside Jambo's panel (owner, 9 Nov 2026, over the Settings
              drawing: "still with a grey divider" — the page's scroll gutter
              left the ground showing 10px wide, under GROUND's 300px floor)
     PIN      a place's own column that must never scroll by itself (Settings'
              middle column: its second scroller shows only at a zoomed wide
              window, so it is pinned directly)
     NESTED   a box that scrolls on its own INSIDE another box that is also
              scrolling (Settings' middle column inside the page): on Windows
              each draws a grey track, and the inner box reads as a card.
              A list scrolling inside a sheet that does not itself scroll is
              fine (the Harmony rule: a long list scrolls inside its own box).

   THE ALLOWANCES (WHITE_KNOWN) carry the owner's rulings of 9 Nov 2026 and
   ONLY SHRINK: an allowance that no longer fires FAILS the run, so a fix
   takes its line off the same day. Both kinds are planted and caught before
   any page is measured (a probe that finds nothing because it is broken
   measures nothing).

   MEASURED AT THE PARENT (3ef3596, 9 Nov 2026): GROUND on the Board, the Board
   under its side list, Jambo's work, the side panel, a template's page and the
   builder, at all three screens. NESTED fires on the planted pair; Settings'
   two scrollers (the owner's picture) need a zoomed wide window, so at the
   three screens Settings shows one scroller and is measured clean here — the
   fix round pins its column directly.

   Run: node test/chromium/white-sheet-verify.js
        HATI_WHITE_ONLY=settings,board node test/chromium/white-sheet-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'white-sheet');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

/* THE OWNER'S THREE SCREENS (CLAUDE.md, STANDING LESSONS). */
const SCREENS = [
  { k: 'laptop-a', w: 1440, h: 780 },
  { k: 'laptop-b', w: 1536, h: 730 },
  { k: 'ipad', w: 1366, h: 950 },
];

/* ONE LIST OF PLACES: the tidy sweep's own, read from its file, so a place added there is measured here too. */
const PLACES = (() => {
  const src = fs.readFileSync(path.join(__dirname, 'tidy-sweep-verify.js'), 'utf8');
  const m = /\nconst PLACES = (\[[\s\S]*?\n\]);/.exec(src);
  if (!m) throw new Error('the tidy sweep\'s PLACES list was not found — has it moved?');
  return new Function('return ' + m[1])();
})();

/* THE ALLOWANCES — each with the owner's word, 9 Nov 2026. Only shrinks. */
const WHITE_KNOWN = [
  /* Settings, a template's page and the builder came off on 9 Nov 2026 (the fix round: built as drawn, one white sheet);
     Settings' middle column is pinned (PINS), never a scroller of its own */
  { place: 'board', kind: 'ground', why: 'Your book, Needs you and Today\'s insights are cards on grey — owner: Not now (9 Nov 2026)' },
  { place: 'board-sheet', kind: 'ground', why: 'the Board under its side list — owner: Not now (9 Nov 2026)' },
  { place: 'agents', kind: 'ground', why: 'Jambo\'s work is the Board\'s Needs you card on grey — owner: Not now (9 Nov 2026)' },
  { place: 'brief', kind: 'ground', why: 'the Board under Jambo\'s side panel — owner: Not now (9 Nov 2026)' },
  /* the Pulse board's grey legend strip came off on 9 Nov 2026: it was the window's ground behind the shell's scroll
     channel, white since the fix round (index.html, ONE WHITE SHEET) */
];

/* THE PINS: a place's own column that must never scroll by itself. Each answers null, or why it fails. */
const PINS = {
  settings: async () => {
    const m = document.querySelector('.stn-main'); if (!m) return 'Settings\' middle column was not found';
    const o = getComputedStyle(m).overflowY;
    if (/(auto|scroll)/.test(o)) return `Settings' middle column scrolls by itself (overflow-y ${o}): at a zoomed wide window it is a second scroller inside the page`;
    /* THE HANDLE SHOWS WHILE YOU SCROLL, and only then (as drawn, 9 Nov 2026): at rest none; scrolled, the shell's thin
       handle; a moment after, none again */
    const sc = document.getElementById('content-scroll'); if (!sc) return 'the page scroller was not found';
    const tone = () => getComputedStyle(sc).scrollbarColor;
    const rest = tone(); if (!/^transparent transparent$|rgba\(0, 0, 0, 0\) rgba\(0, 0, 0, 0\)/.test(rest)) return `the handle shows at rest (${rest})`;
    if (sc.scrollHeight <= sc.clientHeight + 2) return null; /* nothing to scroll at this screen */
    const top0 = sc.scrollTop; sc.scrollTop = top0 + 120; await new Promise(r => setTimeout(r, 120));
    const moving = tone(); if (/^transparent transparent$|rgba\(0, 0, 0, 0\) rgba\(0, 0, 0, 0\)/.test(moving)) { sc.scrollTop = top0; return 'scrolled, the handle does not show'; }
    await new Promise(r => setTimeout(r, 1300)); const after = tone(); sc.scrollTop = top0; await new Promise(r => setTimeout(r, 1300));
    return /^transparent transparent$|rgba\(0, 0, 0, 0\) rgba\(0, 0, 0, 0\)/.test(after) ? null : `the handle stays after scrolling (${after})`;
  },
};

let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const blocked = [];
const drive = async (page, fn, arg, fallback) => {
  try { return arg === undefined ? await page.evaluate(fn) : await page.evaluate(fn, arg); }
  catch (e) { blocked.push(String((e && e.message) || e).split('\n')[0]); return fallback; }
};
const waitFor = async (page, fn, ms = 10000) => { try { await page.waitForFunction(fn, null, { timeout: ms }); return true; } catch (_) { return false; } };
const settle = async page => { await page.evaluate(() => document.fonts.ready).catch(() => {}); await page.waitForTimeout(1200); }; /* a live list (the Pulse board) draws its sheet a beat after its rows */

/* ============================================================
   THE MEASURE, run inside the page.
   ============================================================ */
const MEASURE = `(() => {
  const vw = innerWidth, vh = innerHeight, STEP = 16, TOP = 56;
  const R = el => el.getBoundingClientRect();
  const CS = new Map(); const cs = el => { let c = CS.get(el); if (!c) { c = getComputedStyle(el); CS.set(el, c); } return c; };
  const who = el => { const id = el.id ? '#' + el.id : ''; const cl = (typeof el.className === 'string' ? el.className : '').split(/\\s+/).filter(Boolean).slice(0, 2).map(c => '.' + c).join(''); return el.tagName.toLowerCase() + id + cl; };
  const alpha = c => { const m = /rgba?\\(([^)]+)\\)/.exec(c); if (!m) return 0; const p = m[1].split(',').map(s => s.trim()); return p.length > 3 ? +p[3] : 1; };
  const GREY = { 'rgb(245, 245, 247)': 'ground', 'rgb(239, 238, 235)': 'desk' };
  const panel = [...document.querySelectorAll('#ig-dock, #ins-panel, #st-side, #tb-rail, #cal-plan')].find(el => { const r = R(el); return r.width > 0 && r.height > 0 && cs(el).display !== 'none'; }) || null;
  const right = panel ? R(panel).left : vw;
  const inPanel = el => !!(panel && panel.contains(el));
  const skipTree = el => !!el.closest('#modal-root, .toast, [data-white-plant]') && !el.closest('[data-white-plant]');
  /* the paper's own canvas and the designed grey parts */
  const PAPER = '#ig-paper-scroll, .ig-paper-scroll, #ig-paper, .paper-zc, .rl-paper, .pd2-br-sheet, .pd2-am-sheet, .doc-surface, .sign-copy, .hb-dark, #ig-canvas, .igx-stage, .tpl-dt-paper:has(.tpl-dt-sheet)';
  const DESIGNED = 'tr.is-sel, .is-sel, .cal-day, .cal-cell, .cal-wk-slot, .cal-month td, .cal-hz-rm, #mig-drop, .mig-drop-card, .pu-key, .lh-box, .lh-q, .ac-nl-form, .jl-bub, .cn2-jcard, .dl2-cmp, .hist-redline, .jh-office, .jh-floor, .hbk-pic-wrap, .fm-lane, .na-askbox, .ctf-bar, .hb-stagebar';

  /* GROUND — sampled on a grid, each grey point attributed to the element that paints it */
  const painters = new Map();
  for (let y = TOP + STEP / 2; y < vh; y += STEP) for (let x = STEP / 2; x < right; x += STEP) {
    /* THE PAINTER IS THE FIRST OPAQUE BOX UNDER THE POINT IN PAINT ORDER — not the first opaque ancestor: a
       white layer that is a sibling, not a parent, of the rows (the Pulse board's sheet) paints what shows */
    const stack = document.elementsFromPoint(x, y); if (!stack.length) continue;
    const el = stack[0]; if (!el || el === document.documentElement) continue;
    if (inPanel(el) || skipTree(el)) continue;
    let p = null, tone = null;
    for (const q of stack) { if (q === document.documentElement) break; const bg = cs(q).backgroundColor; if (alpha(bg) > 0.05) { p = q; tone = GREY[bg] || null; break; } }
    if (!tone || !p) continue;
    if (p.matches(PAPER) || p.closest(PAPER) || p.matches(DESIGNED) || p.closest(DESIGNED)) continue;
    let rec = painters.get(p); if (!rec) { rec = { el: p, tone, n: 0, x0: x, x1: x, y0: y, y1: y }; painters.set(p, rec); }
    rec.n++; rec.x0 = Math.min(rec.x0, x); rec.x1 = Math.max(rec.x1, x); rec.y0 = Math.min(rec.y0, y); rec.y1 = Math.max(rec.y1, y);
  }
  /* EDGE — the 24px left of the panel, every 16px down: a grey strip there reads as a divider, however narrow and
     however short (four rows, 64px: Our standards' strip beside its head was 70px tall) */
  const edgeRows = new Map(); let rows = 0;
  for (let y = TOP + STEP / 2; y < vh - 8; y += STEP) {
    rows++;
    for (let x = Math.max(0, right - 24); x < right; x += 2) {
      const stack = document.elementsFromPoint(x, y); if (!stack.length) continue;
      const el = stack[0]; if (!el || el === document.documentElement || inPanel(el) || skipTree(el)) continue;
      let p = null, tone = null;
      for (const q of stack) { if (q === document.documentElement) break; const bg = cs(q).backgroundColor; if (alpha(bg) > 0.05) { p = q; tone = GREY[bg] || null; break; } }
      if (!tone || !p || p.matches(PAPER) || p.closest(PAPER) || p.matches(DESIGNED) || p.closest(DESIGNED)) continue;
      let rec = edgeRows.get(p); if (!rec) { rec = { el: p, tone, ys: new Set(), x0: x, x1: x }; edgeRows.set(p, rec); }
      rec.ys.add(y); rec.x0 = Math.min(rec.x0, x); rec.x1 = Math.max(rec.x1, x);
    }
  }
  const edge = [];
  for (const rec of edgeRows.values()) if (rec.ys.size >= 4) edge.push({ who: who(rec.el), tone: rec.tone, w: rec.x1 - rec.x0 + 2, rows: rec.ys.size + '/' + rows, at: rec.x0 });
  const ground = [];
  for (const rec of painters.values()) {
    const w = rec.x1 - rec.x0 + STEP, h = rec.y1 - rec.y0 + STEP;
    if (w >= 300 && h >= 48 && rec.n >= 40) ground.push({ who: who(rec.el), tone: rec.tone, w, h, at: Math.round(rec.x0 - STEP / 2) + ',' + Math.round(rec.y0 - STEP / 2), px: rec.n * STEP * STEP });
  }
  ground.sort((a, b) => b.px - a.px);

  /* NESTED — an active vertical scroller inside another active vertical scroller, left of the panel */
  const vis = el => { const r = R(el); if (!(r.width >= 120 && r.height >= 120 && r.right > 0 && r.left < right && r.bottom > TOP && r.top < vh)) return false; for (let p = el; p && p !== document.body; p = p.parentElement) { const c = cs(p); if (c.display === 'none' || c.visibility === 'hidden') return false; } return true; };
  const active = el => { const c = cs(el); return /(auto|scroll)/.test(c.overflowY) && el.scrollHeight > el.clientHeight + 2; };
  const scrollers = [...document.querySelectorAll('*')].filter(el => !inPanel(el) && !skipTree(el) && vis(el) && active(el));
  if (document.scrollingElement && document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight + 2) scrollers.push(document.scrollingElement);
  const nested = [];
  for (const outer of scrollers) for (const inner of scrollers) {
    if (outer === inner || !outer.contains(inner)) continue;
    if (inner.closest(PAPER)) continue; /* the paper scrolls inside its desk by design */
    nested.push({ outer: who(outer), inner: who(inner), innerAt: Math.round(R(inner).left) + ',' + Math.round(R(inner).top) + ' ' + Math.round(R(inner).width) + '×' + Math.round(R(inner).height), over: inner.scrollHeight - inner.clientHeight });
  }
  return { ground, edge, nested, panel: panel ? who(panel) : null, right: Math.round(right) };
})()`;

/* THE SELF-CHECK: one of each fault planted, so a kind that reports nothing is known to be looking. */
const PLANT = `(() => {
  const d = document.createElement('div'); d.id = 'white-sheet-plant'; d.setAttribute('data-white-plant', '1');
  d.style.cssText = 'position:fixed;left:40px;top:120px;z-index:99999;font:13px system-ui';
  d.innerHTML = '<div style="background:#F5F5F7;width:400px;height:120px;padding:12px">PLANT ground</div>'
    + '<div data-plant-outer style="overflow-y:auto;width:400px;height:160px;margin-top:12px;background:#fff;border:1px solid #ccc"><div data-plant-inner style="overflow-y:auto;width:360px;height:120px;border:1px solid #ddd"><div style="height:600px">PLANT nested inner</div></div><div style="height:400px">PLANT nested outer</div></div>';
  document.body.appendChild(d);
  const pn = [...document.querySelectorAll('#ig-dock, #ins-panel, #st-side, #tb-rail, #cal-plan')].find(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none'; });
  const at = pn ? pn.getBoundingClientRect().left : innerWidth;
  const e = document.createElement('div'); e.setAttribute('data-white-plant', 'edge');
  e.style.cssText = 'position:fixed;top:56px;bottom:0;width:10px;z-index:99999;background:#F5F5F7;left:' + (at - 10) + 'px';
  d.appendChild(e);
})()`;

const only = (process.env.HATI_WHITE_ONLY || '').split(',').map(s => s.trim()).filter(Boolean);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'], ignoreDefaultArgs: ['--hide-scrollbars'] });
  const errors = [], report = [], fired = new Set();
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
    /* THE NEW LOOK IS THE FUTURE STATE: this check runs with the admin's switch on, always */
    await page.evaluate(async () => { if (typeof stPrefSet === 'function') await stPrefSet('newLook', true); if (typeof newLookApply === 'function') newLookApply(); });
    await page.waitForTimeout(800);
    check('0 — signed in with the sample book, the new look on', await drive(page, () => Array.isArray(state.contracts) && state.contracts.length > 5 && document.documentElement.classList.contains('lg-new'), undefined, false));
    {
      await drive(page, PLANT, undefined, null);
      const m = await drive(page, MEASURE, undefined, null);
      await drive(page, () => { const d = document.getElementById('white-sheet-plant'); if (d) d.remove(); }, undefined, null);
      const sawGround = !!(m && m.ground.some(g => g.tone === 'ground' && g.w >= 380 && g.w <= 420 && g.h >= 100 && g.h <= 140));
      const sawNested = !!(m && m.nested.some(n => /data-plant|div/.test(n.inner) && n.over >= 400));
      const sawEdge = !!(m && m.edge.some(e => e.tone === 'ground' && e.w >= 8 && e.w <= 26));
      check('0 — the planted grey block is seen', sawGround, sawGround ? undefined : JSON.stringify(m && m.ground));
      check('0 — the planted nested scroller is seen', sawNested, sawNested ? undefined : JSON.stringify(m && m.nested));
      check('0 — the planted 10px strip beside the panel is seen', sawEdge, sawEdge ? undefined : JSON.stringify(m && m.edge));
      if (!(sawGround && sawNested && sawEdge) && !process.env.HATI_WHITE_ANYWAY) throw new Error('the instrument is blind — nothing else was measured');
    }
    for (const S of SCREENS) {
      await page.setViewportSize({ width: S.w, height: S.h });
      for (const P of PLACES) {
        if (only.length && !only.includes(P.k)) continue;
        await page.keyboard.press('Escape').catch(() => {});
        await page.keyboard.press('Escape').catch(() => {});
        await drive(page, () => { try { closeModal && closeModal(); } catch (_) {} try { const x = document.querySelector('.hb-sheet [data-hb-sheet-x]'); if (x) x.click(); } catch (_) {} try { if (typeof aiSideToggle === 'function' && document.querySelector('#ai-panel.is-in')) aiSideToggle(false); } catch (_) {} }, undefined, null);
        const opened = await drive(page, P.go, undefined, 'threw');
        const there = await waitFor(page, P.wait);
        await settle(page);
        await page.mouse.move(2, S.h - 4).catch(() => {});
        const m = await drive(page, MEASURE, undefined, null);
        const row = { screen: S.k, place: P.k, name: P.name, there, opened: opened !== 'threw', m };
        report.push(row);
        if (!there) check(`${S.k} · ${P.name} — the door opened`, false, opened === 'threw' ? 'the door threw: ' + blocked[blocked.length - 1] : 'the page did not paint what the probe waits for');
        if (!m) { check(`${S.k} · ${P.name} — measured`, false, 'the probe threw'); continue; }
        const known = WHITE_KNOWN.filter(k => k.place === P.k);
        const allowed = kind => known.find(k => k.kind === kind);
        const faults = [];
        for (const g of m.ground) { const a = allowed('ground'); if (a) { fired.add(a); console.log(`      KNOWN     GROUND ${g.who} ${g.w}×${g.h} (${g.tone}) · ${a.why}`); } else faults.push(`GROUND ${g.who} ${g.w}×${g.h} at ${g.at} (${g.tone})`); }
        /* a grey strip beside the panel is grey ground too: a place allowed its ground is allowed its edge */
        for (const e of m.edge) { const a = allowed('edge') || allowed('ground'); if (a) { fired.add(a); console.log(`      KNOWN     EDGE ${e.who} ${e.w}px wide, ${e.rows} rows · ${a.why}`); } else faults.push(`EDGE ${e.who} ${e.w}px wide beside the panel, ${e.rows} rows, from x=${e.at} (${e.tone})`); }
        const pin = PINS[P.k]; if (pin) { const why = await drive(page, pin, undefined, 'the pin threw'); if (why) faults.push('PIN ' + why); }
        for (const n of m.nested) { const a = allowed('nested'); if (a) { fired.add(a); console.log(`      KNOWN     NESTED ${n.inner} inside ${n.outer} · ${n.over}px more than fits · ${a.why}`); } else faults.push(`NESTED ${n.inner} (${n.innerAt}, ${n.over}px more than fits) inside ${n.outer}`); }
        if (faults.length) await page.screenshot({ path: path.join(OUT, `${S.k}-${P.k}.png`) }).catch(() => {});
        check(`${S.k} · ${P.name} — one white sheet`, faults.length === 0, faults.length ? faults.join(' · ') : `panel ${m.panel || 'none'} · ${m.ground.length} grey, ${m.nested.length} nested, all allowed`);
        for (const f of faults) console.log(`      ${f}`);
      }
    }
    /* THE ALLOWANCES ONLY SHRINK: one that never fired is a fix that landed — take its line off */
    if (!only.length) for (const k of WHITE_KNOWN) check(`allowance still needed — ${k.place} · ${k.kind}`, fired.has(k), fired.has(k) ? undefined : 'it no longer fires: take it off WHITE_KNOWN');
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
    check('every probe ran', blocked.length === 0, blocked.join(' | ') || undefined);
    check('no page errors', errors.length === 0, errors.join(' | ') || undefined);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed — shots and report.json in ${OUT}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
