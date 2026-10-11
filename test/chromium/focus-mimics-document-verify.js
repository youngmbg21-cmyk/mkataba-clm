/* Chromium verification: FOCUS MODE MIMICS THE DOCUMENT PAGE
   =========================================================
   Young, 19 Sep 2026: "When in negotiation page make it mimic the document
   page when on focus mode." Ruled over a render of the two side by side.

   THIS FILE EXISTS BECAUSE THE RULING IS ABOUT THE SHELL, and the shell is not
   on any harness page: the dark bar, the sidebar and the app grid live in
   index.html, outside the negotiate page's own markup, so only the real app
   can say whether they are still standing. f94 pins the rules; this measures
   the screen.

   MEASURED AT THE PARENT (70b831f), entering focus on the negotiate page:
     dark bar   44 -> 0
     side rail 240 -> 0
     head card 146 -> 0
     ROW        44 -> 0      <- the fault
   and on the Document tab the same press leaves bar 44, rail 240, row 39 and
   drops only the head card. One button, two meanings.

   The row is what carries As agreed, With changes, the Deal board, the text
   size, the Internal/Counterparty seat and All negotiations — every one of
   them unreachable from inside the mode a reader entered in order to read.

   THE CONTROLS ARE NAMED: 1a-1d (the page draws a control row at rest at all)
   pass at the parent. They are what prove the stage bites. (Sections 4-5,
   the Document tab side of the comparison, retired 11 Oct 2026: the Document
   tab is gone, owner.)

   Run: node test/chromium/focus-mimics-document-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'focus-mimics');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* EVERY DRIVEN HALF IS GUARDED, so a build without the change REPORTS its
   failures rather than throwing on the third check and proving nothing about
   the rest. This file is run against the parent before it is trusted. */
const blocked = [];
const drive = async (page, fn, arg, fallback) => {
  try { return arg === undefined ? await page.evaluate(fn) : await page.evaluate(fn, arg); }
  catch (e) { blocked.push(String((e && e.message) || e).split('\n')[0]); return fallback; }
};

/* ONE READING OF "what is standing", asked of both pages so the two cannot be
   compared by two different measures. A zero height is the product's own way
   of saying display:none here — every one of these elements is hidden by a
   rule, never removed. */
const SHOT = (rowSel) => {
  const box = sel => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { h: Math.round(r.height), w: Math.round(r.width),
      top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left) };
  };
  const row = document.querySelector(rowSel);
  let bg = null, painted = null, padTop = null;
  if (row){
    const cs = getComputedStyle(row);
    bg = cs.backgroundColor;
    padTop = cs.paddingTop;
    const r = row.getBoundingClientRect();
    /* A RECT IS NOT A PAINTED PIXEL. Sampled a third of the way in and a
       third of the way down, which is inside the row and clear of its
       controls' own edges. */
    const hit = document.elementFromPoint(r.left + r.width / 3, r.top + r.height / 3);
    painted = !!hit && (hit === row || row.contains(hit) || hit.contains(row));
  }
  const pageEl = document.querySelector('.redline-page') || document.querySelector('.room-band');
  const tok = n => pageEl ? getComputedStyle(pageEl).getPropertyValue(n).trim() : '';
  /* ---- WHAT COLOUR IS PAINTED JUST UNDER THE DARK BAR ----
     Asked of the SCREEN rather than of an element, because the two pages hold
     that white in different elements — the room on its .room-band, this page
     on the row itself — and a claim written against either one's tree cannot
     be asked of the other. Walks up for the first real background, which is
     what the reader actually sees. */
  let underBar = null;
  const bar = document.querySelector('#top-header');
  const rail = document.querySelector('#side-nav');
  if (bar && row){
    const br = bar.getBoundingClientRect();
    const rl = rail ? rail.getBoundingClientRect().width : 0;
    let n = document.elementFromPoint(rl + (window.innerWidth - rl) * 0.4, br.bottom + 2);
    while (n && n !== document.documentElement){
      const c = getComputedStyle(n).backgroundColor;
      if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'){ underBar = c; break; }
      n = n.parentElement;
    }
  }
  return { bar: box('#top-header'), rail: box('#side-nav'),
    head: box('#ws-head'), row: box(rowSel), bg, painted, padTop, underBar,
    padT: tok('--page-pad-t'), rowH: tok('--rl-tabrow-h'),
    exit: !!document.querySelector('.rl-focus-exit:not([hidden]), #ws-focus-out') };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2600);
    const cid = await drive(page, () => (state.contracts || [])[0].id);

    /* ═══════════ 1 · THE NEGOTIATE PAGE AT REST ═══════════
       The CONTROLS. If the page does not draw a head card and a control row at
       rest, everything after this is measuring nothing. */
    await drive(page, id => openRedlineWorkbench(id), cid, null);
    await pause(2400);
    const rest = await drive(page, SHOT, '#view-redline .rl-tabrow', {});
    check('1a CONTROL — the dark bar is drawn', !!rest.bar && rest.bar.h > 0,
      rest.bar ? `${rest.bar.h}px` : 'absent');
    check('1b CONTROL — the side rail is drawn', !!rest.rail && rest.rail.w > 0,
      rest.rail ? `${rest.rail.w}px wide` : 'absent');
    check('1c CONTROL — the head card is drawn', !!rest.head && rest.head.h > 0,
      rest.head ? `${rest.head.h}px` : 'absent');
    check('1d CONTROL — the control row is drawn', !!rest.row && rest.row.h > 0,
      rest.row ? `${rest.row.h}px at y=${rest.row.top}` : 'absent');
    await page.screenshot({ path: path.join(OUT, '01-nego-rest.png') });

    /* ═══════════ 2 · FOCUS KEEPS THE ROW AND THE SHELL ═══════════ */
    const on = await drive(page, async sel => {
      const b = document.querySelector('#view-redline [data-ws-focus]') /* the control-row door since 21 Sep 2026 */;
      if (!b) return { err: 'no Focus button on the negotiate page' };
      b.click();
      await new Promise(r => setTimeout(r, 500));
      return null;
    }, '#view-redline .rl-tabrow', { err: 'blocked' });
    await pause(400);
    const foc = on && on.err ? { err: on.err }
      : await drive(page, SHOT, '#view-redline .rl-tabrow', {});
    check('2a the head card really goes away', !foc.err && !!foc.head && foc.head.h === 0,
      foc.err || (foc.head ? `${rest.head && rest.head.h}px before / ${foc.head.h}px after` : 'absent'));
    check('2b THE CONTROL ROW STAYS — this is the report',
      !foc.err && !!foc.row && foc.row.h > 0,
      foc.err || (foc.row ? `${foc.row.h}px` : 'absent'));
    check('2c and it is PAINTED, not merely measured',
      !foc.err && foc.painted === true, foc.err || String(foc.painted));
    check('2d the dark bar stays', !foc.err && !!foc.bar && foc.bar.h > 0,
      foc.err || (foc.bar ? `${foc.bar.h}px` : 'absent'));
    check('2e the side rail stays', !foc.err && !!foc.rail && foc.rail.w > 0,
      foc.err || (foc.rail ? `${foc.rail.w}px wide` : 'absent'));
    check('2f the way out is drawn', !foc.err && foc.exit === true,
      foc.err || String(foc.exit));
    await page.screenshot({ path: path.join(OUT, '02-nego-focus.png') });

    /* ═══════════ 3 · THE BAND, MEASURED AS A RELATION ═══════════
       The row is WHITE and its white starts directly under the dark bar, with
       the page's own top padding INSIDE it — which is exactly the band the
       Document tab draws. Every claim here is a relation between two things
       on the page or a token read off it; not one is a typed pixel. */
    /* ---- EVERY CLAIM HERE IS GATED ON THE ROW ACTUALLY STANDING ----
       A hidden row still computes a white background and still measures 0, so
       "its white starts under the bar" and "it starts left of the rail" are
       both satisfied by 0 === 0 on a build where the row is not there at all.
       That is a check passing on the wrong thing, and this file exists to
       catch exactly that build. `standing` is the gate. */
    const standing = !foc.err && !!foc.row && foc.row.h > 0;
    /* RE-POINTED 7 Oct 2026 (Young, the mockup): both rows sit on the PAGE GROUND now — the Document tab's band went transparent and Negotiate's row follows it. */
    /* RE-POINTED 9 Oct 2026 (SAP batch 3): the Document tab's head is a white
       band again, as drawn, and Negotiate's row follows it — white, as the
       Negotiate drawing paints its head too. */
    const white = await page.evaluate(() => { const d = document.createElement('div'); d.style.background = 'var(--color-surface)';
      document.body.appendChild(d); const v = getComputedStyle(d).backgroundColor; d.remove(); return v; });
    check('3a the row is white, as the Document tab\'s band is',
      standing && foc.bg === white,
      foc.err || (standing ? String(foc.bg) : 'the row is not standing'));
    check('3b its white starts directly under the dark bar',
      standing && !!foc.bar && foc.bar.h > 0 && Math.abs(foc.row.top - foc.bar.bottom) <= 1,
      foc.err || (standing && foc.bar ? `row top ${foc.row.top} / bar bottom ${foc.bar.bottom}`
        : 'the row or the bar is not standing'));
    check('3c the gap above the controls is the page\'s own padding token',
      !foc.err && !!foc.padT && foc.padTop === foc.padT,
      foc.err || `padding-top ${foc.padTop} / --page-pad-t ${foc.padT}`);
    check('3d and the row grew by exactly that gap, so nothing in it is squashed',
      !foc.err && !!foc.row && !!rest.row && (foc.row.h - rest.row.h) === parseFloat(foc.padT || '0'),
      foc.err || (foc.row && rest.row ? `${rest.row.h} -> ${foc.row.h}, gap ${foc.padT}` : 'absent'));
    check('3e the row starts at the rail\'s edge, so the shell is intact',
      standing && !!foc.rail && foc.rail.w > 0 && foc.row.left >= foc.rail.w,
      foc.err || (standing && foc.rail ? `row left ${foc.row.left} / rail ${foc.rail.w}`
        : 'the row or the rail is not standing'));

    /* ═══════════ 3f · AND ALL NEGOTIATIONS DOES NOT STRAND THE MODE ═══════════
       New the day the row survived: that door is ON the row, and it paints the
       list without going through setView, where the reset lives. */
    const list = await drive(page, async () => {
      /* RE-POINTED 10 Oct 2026: the row's door is "Open document" now (owner). */
      const d = document.querySelector('#view-redline [data-rl-open-doc]');
      if (!d) return { err: 'no Open document door on the row' };
      const wasOn = !!(window.rlFocusOn && rlFocusOn());
      d.click();
      await new Promise(r => setTimeout(r, 700));
      return { wasOn, nowOn: !!(window.rlFocusOn && rlFocusOn()),
        body: document.body.classList.contains('rl-focused'),
        rail: !!document.querySelector('#side-nav') };
    }, undefined, { err: 'blocked' });
    check('3f pressing Open document from focus leaves the mode behind',
      !list.err && list.wasOn === true && list.nowOn === false && list.body === false,
      list.err || `was ${list.wasOn} / now ${list.nowOn} / body ${list.body}`);

    /* ═══════════ 4 and 5 · THE DOCUMENT TAB, AND THE TWO AGREEING ═══════════
       RETIRED 11 Oct 2026: the Document tab is gone (owner), and its Focus
       door with it - the contract room draws no Focus door on any tab now
       (wsTabRowEndHtml returns the Negotiate door alone on the Overview). The
       comparison had nothing left to compare against. What this file is
       about - Negotiate's focus mode keeps the bar, the rail and its control
       row, in white, under the bar (sections 1-3) - is still measured above. */

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run finished', false, String((e && e.message) || e));
  } finally {
    if (blocked.length) console.log('\nblocked evaluations: ' + blocked.slice(0, 4).join(' | '));
    await browser.close();
    await h.stop();
    await ai.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
