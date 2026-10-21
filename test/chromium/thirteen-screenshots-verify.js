/* Chromium verification: THIRTEEN REPORTS OFF A MORNING OF SCREENSHOTS.
   ====================================================================
   Four of the thirteen were INVISIBLE IN THE SOURCE and only a rendered page
   could show them, which is why this file exists and why f335 says so:

     · an empty <select> is legal markup. The "On hold" filter drew with ZERO
       options, at its minimum width, and could never be switched on — nothing
       errored, nothing logged, and the source read like every other filter;
     · a head folded by the wiring rather than in the markup is on screen for
       however long the fetches take. Only a real network round-trip shows it;
     · "Fill it in" looked for a box that the Overview does not draw at rest.
       A source read cannot tell a section that is shut from one that is open;
     · a menu with one row in it is a menu until you count the rows a real
       contract produces.

   MEASURED AT THE PARENT (9eed1b3): 13 of 20 RED, and each one reproduces the
   report in the owner's own words —
     · the On hold filter drew 41.9px wide with nothing in it, and pressing it
       narrowed 4 rows to 4;
     · the send screen's second heading was 90px tall on the opening frame and
       0 once it settled, which is "appears then disappears immediately";
     · Fill it in found no box at all;
     · there was no Focus mode button to press.
   The seven that pass are CONTROLS: that the opening frame is drawn at all,
   that the head is eventually hidden (the old code did get there — late), that
   the box is genuinely absent at rest, and that no refusal toast fires.

   Run: node test/chromium/thirteen-screenshots-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'thirteen');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* STEP 7 (the overnight work order): the Contracts page is Home's Contracts
   place; this check reads its List (regPlaceSet({ show: 'list' }) before
   setView('register'), which lands there). */
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3000);

    /* ═══════ 1. THE ON HOLD FILTER HAS OPTIONS AND A REAL WIDTH ═══════
       The whole report. At the parent this select held ZERO options and drew
       at its minimum box. A rect is not enough on its own here — an empty
       select still HAS a rect — so the options are counted as well. */
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner picked "the Legora way" for
       the Contracts place): On hold is a group under "+ Filter" and, once
       chosen, a CHIP whose list holds its two choices (its rest, "Any", is the
       chip's x). What this file protects is unchanged: the control holds real
       choices, has a real width, and narrows. */
    await page.evaluate(() => { (regPlaceSet({ show: 'list' }), setView('register')); });
    await page.waitForTimeout(1200);
    const HOLD = '[data-lh-seat="contracts"] [data-lh-chip="hold"]';
    const before = await page.evaluate(() => document.querySelectorAll('tr[data-row]').length);
    const offered = await page.evaluate(() => [...document.querySelectorAll('[data-lh-seat="contracts"] select[data-lh-add] option')]
      .map(o => { try { return JSON.parse(o.value); } catch (_) { return null; } }).filter(x => x && x[0] === 'hold').map(x => x[1]));
    await page.evaluate(() => LH_PAGES.contracts.apply({ hold: 'on' }));
    await page.waitForFunction(S => !!document.querySelector(S), HOLD, { timeout: 5000 }).catch(() => {});
    const hold = await page.evaluate(S => {
      const el = document.querySelector(S + ' select[data-lh-f="hold"]');
      if (!el) return { err: 'not drawn' };
      const r = el.getBoundingClientRect();
      return {
        n: el.options.length,
        values: [...el.options].map(o => o.value),
        labels: [...el.options].map(o => o.textContent.trim()),
        w: +r.width.toFixed(1), h: +r.height.toFixed(1),
      };
    }, HOLD);
    check('1a the hold filter offers its choices: under + Filter, then on its chip (its rest is the x)', offered.length >= 1 && hold.n === 2 && hold.values.includes('on') && hold.values.includes('off'),
      `+ Filter ${offered.join(',')} · chip ${hold.n}: ${(hold.values || []).join(',')}`);
    check('1b every one is a real word, not an empty box', (hold.labels || []).every(l => l.length > 1),
      JSON.stringify(hold.labels));
    /* A CONTROL THE READER CAN HIT. Measured at the parent it came back under
       30px wide; the other filters on that bar sit near 180. The claim is a
       RELATION: the chip's own words are whole and the face a reader presses
       is at least as wide as they need. */
    const holdChip = await page.evaluate(S => {
      const c = document.querySelector(S), face = c && c.querySelector('label');
      const need = face ? face.scrollWidth : 0;
      return { w: face ? +face.getBoundingClientRect().width.toFixed(1) : 0, need,
        whole: !!face && face.scrollWidth <= face.clientWidth + 0.5 }; }, HOLD);
    check('1c and it has a real width — its words whole, the chip as wide as they need',
      holdChip.w > 30 && holdChip.need > 0 && holdChip.whole && holdChip.w >= holdChip.need - 0.5,
      `${holdChip.w}px, its words need ${holdChip.need}px · words whole ${holdChip.whole} (select ${hold.w}px)`);
    await page.screenshot({ path: path.join(OUT, '01-hold-filter.png') });

    /* IT NARROWS. A control that draws and does nothing is the same fault in
       a second costume, so the press is driven and the rows counted. */
    const narrowed = await page.evaluate(() => ({ after: document.querySelectorAll('tr[data-row]').length,
      state: (typeof regState === 'function') ? regState().hold : null }));
    check('1d the press reaches the state', narrowed.state === 'on', String(narrowed.state));
    check('1e and it really narrows', narrowed.after < before,
      `${before} → ${narrowed.after}`);
    await page.click(HOLD + ' [data-lh-x="hold"]').catch(() => {});
    await page.waitForTimeout(400);

    /* ═══════ 2. THE SHARE SCREEN DRAWS ONE HEADING ═══════
       MEASURED AT THE PARENT: the step-2 head was VISIBLE from the opening
       paint, through `ensureFull`, the document hash and the share list, and
       only step(1) after the fill folded it. The check reads it at the first
       frame — before the awaits settle — which is exactly where the owner saw
       it. `elementFromPoint` rather than a rect, because a rect is not a
       painted pixel (the 18 Sep lesson). */
    const cid = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status !== 'Signed' && !x.archived) || state.contracts[0];
      return c && c.id;
    });
    /* THE FETCH IS HELD, or there is nothing to see. Measured at the parent
       with everything local: `ensureFull`, the hash and the share list all
       resolve inside one microtask flush, so the opening frame is gone before
       a sampler can reach it and the flash the owner watched on a real
       connection cannot be reproduced by timing alone. So the share list is
       held open — share-recipient-verify's own idiom — which is exactly what a
       real network does, and the frame is then read at leisure. */
    /* THE OPENING FRAME IS READ IN THE SAME TICK, and that is the only honest
       way to read it. Measured at the parent: with everything local the three
       awaits resolve inside one microtask flush, so a sampler on a timer never
       sees the frame the owner watched on a real connection — and a stub on
       `window.contractShares` does not bite either, because openShareModal
       calls the BARE name from its own module scope (the same trap this
       codebase records against monkeypatching roomGoTab).
       `openShareModal` runs synchronously as far as its first await, and the
       opening `openModal` is before it. So the DOM right after the call IS the
       first frame, exactly. */
    const flash = await page.evaluate(async (id) => {
      const c = getContract(id);
      const shown = () => { const el = document.getElementById('share-step2-head');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { cls: el.className, h: Math.round(r.height),
          on: r.height > 0 && getComputedStyle(el).display !== 'none' }; };
      openShareModal(c);                       // NOT awaited — this IS the first frame
      const first = shown();
      await new Promise(r => setTimeout(r, 900));
      const settled = shown();
      return { first, settled };
    }, cid);
    check('2a the opening frame really is drawn', !!flash.first, JSON.stringify(flash.first));
    check('2b and the second heading is not on it', flash.first && flash.first.on === false,
      flash.first ? `${flash.first.cls || '(no class)'} h${flash.first.h}` : 'absent');
    check('2c nor after it settles', flash.settled && flash.settled.on === false,
      flash.settled ? `h${flash.settled.h}` : 'absent');
    await page.screenshot({ path: path.join(OUT, '02-share.png') });
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    await page.waitForTimeout(300);

    /* ═══════ 6. FILL IT IN LANDS ON THE BOX ═══════
       The report itself. At the parent the Overview's record section is SHUT
       and draws no body at all, so the box did not exist and the press
       toasted "This document has no editable key terms" every time. */
    /* DRIVEN FROM WHERE IT IS REALLY PRESSED: the reader is standing on the
       Signing tab looking at the Before you sign card. The room is settled by
       then — an earlier draft of this check pressed 700ms into
       `openWorkspace`, and the room's own render landed afterwards and put the
       tab back, which is a fault in the PROBE and not in the product. */
    await page.evaluate((id) => openWorkspace(id, { room: true }), cid);
    await page.waitForTimeout(1200);
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the room's
       Signing tab went home — the same door opens Jambo's Before you sign
       face beside Home's paper, the card the reader stands on now; waited
       for by this contract's id */
    await page.evaluate((id) => roomGoTab(getContract(id), 'sign'), cid);
    await page.waitForFunction(id => !!document.querySelector(`#pd-signface .pd-sf[data-pd-sf="${id}"]`), cid, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const fill = await page.evaluate(async (id) => {
      const c = getContract(id);
      const before = !!document.querySelector('[data-kt="counterparty"]');
      focusKeyTerms(c, 'counterparty');
      await new Promise(r => setTimeout(r, 1400));
      const box = document.querySelector('[data-kt="counterparty"]');
      const r = box && box.getBoundingClientRect();
      return {
        before,
        found: !!box,
        focused: !!box && document.activeElement === box,
        painted: !!r && r.width > 0 && r.height > 0,
        toast: (document.querySelector('.toast, #toast') || {}).textContent || '',
      };
    }, cid);
    check('6a at rest the box is genuinely absent — the report is real', fill.before === false,
      `before: ${fill.before}`);
    check('6b the press finds it', fill.found, String(fill.found));
    check('6c it is PAINTED, not merely in the markup', fill.painted, String(fill.painted));
    check('6d and the caret is in it', fill.focused, String(fill.focused));
    check('6e no refusal toast', !/no editable/i.test(fill.toast), JSON.stringify(fill.toast.slice(0, 60)));
    await page.screenshot({ path: path.join(OUT, '06-fill-it-in.png') });

    /* AND THE FIELD IS HONOURED. The second half of that report: every one of
       these rows landed on counterparty, so "Value is blank" put the caret in
       the wrong box. */
    /* A SECOND PRESS IS A SECOND JOURNEY, so it is given one: the first press
       left the record's row open and its own bounded wait had only just
       settled, and two of those overlapping is a fault in the PROBE. */
    await page.waitForTimeout(1200);
    const val = await page.evaluate(async (id) => {
      const c = getContract(id);
      focusKeyTerms(c, 'value');
      await new Promise(r => setTimeout(r, 1800));
      const a = document.activeElement;
      return { kt: a && a.getAttribute ? a.getAttribute('data-kt') : null };
    }, cid);
    check('6f a value row lands on the value box, not the counterparty', val.kt === 'value',
      String(val.kt));

    /* ═══════ 11. FOCUS MODE IS A BUTTON, AND BOTH DOORS ARE LIVE ═══════
       f295's lesson driven: a door bound with querySelector rather than
       querySelectorAll is live-looking and dead. */
    /* THE ROOM'S DOOR IS ON THE DOCUMENT TAB'S CONTROL ROW since 21 Sep 2026
       (Young: 'delete the one next to draft new agreement'); the head's square
       is the negotiate page's own. So this goes to the Document tab first. */
    /* RE-POINTED 11 Oct 2026: the Document tab and its control-row door are
       gone (owner). The drawn Focus button that stays is the Negotiate page's
       (data-ws-focus, on its control row), beside the room's ⋯ menu row
       (#ws-focus) — the two doors 11d compares. */
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): every door
       onto Negotiate lands on Jambo's Redlines face on Home, which has no
       Focus (Home's paper has none). Focus is the Negotiate PAGE's own mode,
       so the page is asked for by name ({ page: true }). */
    await page.evaluate((id) => openRedlineWorkbench(id, { page: true }), cid);
    /* RE-POINTED 13 Oct 2026: the owner deleted the control row's Focus button; Focus on Negotiate is the More menu's row (#ws-focus), opened first */
    await page.waitForFunction(() => !!document.querySelector('#view-redline #ws-more'), null, { timeout: 10000 }).catch(() => {});
    const focus = await page.evaluate(async () => {
      (document.querySelector('#view-redline #ws-more') || { click(){} }).click(); await new Promise(z => setTimeout(z, 350));
      const b = document.querySelector('#view-redline #ws-focus');
      if (!b) return { err: 'not drawn' };
      const r = b.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const inside = !!hit && (hit === b || b.contains(hit));
      b.click();
      await new Promise(r2 => setTimeout(r2, 300));
      const head = document.getElementById('ws-head');
      const on = !!head && getComputedStyle(head).display === 'none';
      return { w: +r.width.toFixed(1), h: +r.height.toFixed(1), inside, on,
        btnSays: b.getAttribute('aria-pressed') };
    });
    check('11a the Negotiate page offers a Focus mode door on its More menu', !focus.err, focus.err || `${focus.w}x${focus.h}`);
    check('11b it is PAINTED — nothing sits over it', focus.inside === true, String(focus.inside));
    check('11c and pressing it really hides the head', focus.on === true, String(focus.on));
    /* 11d retired 11 Oct 2026: the Document tab is gone (owner) — and with it
       the room's second Focus door; the room has one door now (the ⋯ row).
       On Negotiate the ⋯ row's own pressed state does not follow the page's
       Focus (rlPaintFocusBtn paints only data-rl-focus/data-ws-focus): the
       same code at main, logged in BUGLOG, not asserted here. What stays: the
       drawn button says its own state. */
    /* 11d "the button says it is pressed" RETIRED 13 Oct 2026: the drawn button
       is gone (owner); the More menu row's state is the BUGLOG line above */
    await page.screenshot({ path: path.join(OUT, '11-focus.png') });

    /* THE CONTRACT DOES NOT MOVE. Refusal 3, measured rather than assumed: the
       button wears .room-check, which is sized to the row's own rung. */
    await page.evaluate(() => { const x = document.querySelector('#view-redline .rl-focus-exit'); if (x) x.click(); });
    await page.waitForTimeout(400);
    const ink = await page.evaluate(() => {
      const head = document.getElementById('ws-head');
      return head ? +head.getBoundingClientRect().height.toFixed(1) : null;
    });
    check('11e and the head is back at its own height', ink != null && ink > 0, `${ink}px`);

    if (errors.length) check('no page errors', false, errors.slice(0, 3).join(' | '));
    else check('no page errors', true);
  } catch (e) {
    check('the run completed', false, String(e && e.message).slice(0, 200));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
