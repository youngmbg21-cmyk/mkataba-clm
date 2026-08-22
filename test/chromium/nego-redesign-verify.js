/* Chromium verification: THE NEGOTIATION PAGE TAKES THE MOCK-UP'S TREATMENT.
   ============================================================
   Owner-approved render, 22 Aug 2026, as amended the same day. Six marked
   places: two white bands at the top, the reading tabs, the right-hand
   controls, a fluid contract, a change column a size larger, and the Copilot
   band kept.

   THE RENDER'S OWN BOTTOM HALF WAS REVERSED BY THE OWNER — two panels under the
   contract (the other live negotiations, and the same changes read side by
   side) were built and then removed on the ask: "the page should resemble the
   previous page". Section 7 is now that absence, asserted, because a feature
   taken out on request is the kind that comes back by accident.

   WHY THIS IS A BROWSER FILE AND NOT A NODE TEST. Every claim below is either
   a COMPUTED STYLE or a JOURNEY, and jsdom can answer neither:

     · this page's redesign is written as a block at the END of a 3,500-line
       stylesheet, and a rule that loses a cascade fight looks perfectly correct
       in the source. That is this codebase's own most expensive lesson (see the
       .rl-rej note in CLAUDE.md: two verbs described as outlined computed to
       border-width 0 for a year, and a source-reading test passed on it
       throughout). Everything here reads getComputedStyle;
     · "the sheet fills its column" is a measurement against a neighbour;
     · "the working area fills the window and nothing scrolls past it" is a
       measurement against the viewport;
     · "nothing sits under the contract" is a claim about pixels that must be
       ABSENT, and jsdom will happily report a hidden element as present.

   Screenshots go to test/chromium/shots/nego-redesign/.
   Run: node test/chromium/nego-redesign-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'nego-redesign');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* Two changes on one contract, one from each side, filed through the funnel's
   own doors so the ops are real ops — a hand-built change has no marks and the
   versus boxes would be measuring nothing. */
const SEED = async () => {
  const live = state.contracts.filter(x => x.status !== 'Signed' && x.status !== 'Declined').slice(0, 3);
  for (let i = 0; i < live.length; i++){
    const c = live[i];
    negoInit(c);
    const cl = negoClauseList(c);
    if (cl[0]) await negoEditClause(c, cl[0].clauseId,
      cl[0].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(Number(String(m).replace(/,/g, '')) + 500)),
      { author: i ? 'Amina Otieno' : 'Erik Lindqvist', side: i ? 'owner' : 'counterparty',
        why: 'Aligns with the volumes we have shipped this year.' });
    if (!i && cl[1]){
      const nb = cl[1].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(Number(String(m).replace(/,/g, '')) + 15));
      await negoFileChange(c, { clauseId: cl[1].clauseId, changeType: 'modify', oldText: cl[1].text,
        newText: richToText(nb), bodyHtml: nb, clauseLabel: negoClauseLabel(cl[1]) },
      { author: 'Amina Otieno', side: 'owner', why: 'Matches the Transportation stream.' });
    }
  }
  return live[0].id;
};

/* A box, and whether it is really on screen — not offsetParent, not a class. */
const SEEN = `(sel => { const el = document.querySelector(sel); if (!el) return null;
  const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
  return { w: Math.round(r.width), h: Math.round(r.height),
    x: Math.round(r.x), y: Math.round(r.y),
    on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none',
    text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 70) }; })`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);
    const cid = await page.evaluate(SEED);
    await pause(1800);
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await pause(2200);
    await page.screenshot({ path: path.join(OUT, '01-workbench.png') });

    /* ---- 1. THE HEAD IS ONE WHITE BAND, AND THE WAY BACK SURVIVED IT ---- */
    const head = await page.evaluate(seen => {
      const s = eval(seen);
      const el = document.querySelector('#view-redline #ws-head');
      const cs = el ? getComputedStyle(el) : null;
      return { box: s('#view-redline #ws-head'),
        bg: cs && cs.backgroundColor, pad: cs && cs.padding,
        rule: cs && cs.boxShadow,
        crumb: !!document.querySelector('#view-redline .room-crumb'),
        back: s('#view-redline #ws-back'),
        title: s('#view-redline #ws-back-title'),
        acts: [...document.querySelectorAll('#view-redline #ws-head .room-acts > *')]
          .filter(e => getComputedStyle(e).display !== 'none')
          .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
          .map(e => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 22)) };
    }, SEEN);
    check('1 the head is a white band', head.bg === 'rgb(255, 255, 255)', head.bg);
    check('1 with a hairline under it and the page measure inside it',
      /inset/.test(head.rule || '') && head.pad === '9px 24px', `${head.pad} · ${head.rule}`);
    check('1 it is ONE LINE — the head is under 60px tall',
      head.box && head.box.h <= 60, head.box && head.box.h + 'px');
    check('1 the breadcrumb has stood down on this page', !head.crumb);
    /* THE HALF THAT MATTERS. #ws-back is the only way off this page — it moved
       into the name row as the reference and must still be a real, pressable
       control, not a span. */
    check('1 and the way back survived it — the reference IS the button',
      !!head.back && head.back.on && /MK-/.test(head.back.text || ''),
      head.back ? `${head.back.text} ${head.back.w}x${head.back.h}` : 'MISSING — the page has no exit');
    check('1 the title is a second door to the same place',
      !!head.title && head.title.on, head.title && head.title.text);

    /* ---- 1b. FOUR ACTS, ONE FILLED, PLAYBOOK IN THE MENU ---- */
    const acts = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('#view-redline #ws-head .room-acts button')]
        .filter(b => b.offsetParent !== null && !b.closest('.room-menu'));
      const filled = btns.filter(b => {
        const bg = getComputedStyle(b).backgroundColor;
        return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
      });
      return { n: btns.length, filled: filled.map(b => b.textContent.replace(/\s+/g, ' ').trim()),
        onRow: btns.map(b => b.textContent.replace(/\s+/g, ' ').trim().slice(0, 20)),
        pbOnRow: btns.some(b => b.hasAttribute('data-rl-pbreview')),
        pbInMenu: !!document.querySelector('#view-redline #ws-more-menu [data-rl-pbreview]') };
    });
    check('1b the head carries four acts, no more', acts.n === 4, acts.onRow.join(' | '));
    check('1b exactly one of them is filled — the platform button rule',
      acts.filled.length === 1 && /Publish/i.test(acts.filled[0] || ''), acts.filled.join(', '));
    check('1b the playbook pass moved into the More menu, and is still reachable',
      !acts.pbOnRow && acts.pbInMenu, `on row ${acts.pbOnRow} · in menu ${acts.pbInMenu}`);

    /* ---- 2. THE READING TABS ARE TABS, WITH A COUNT ---- */
    const tabs = await page.evaluate(() => {
      const row = document.querySelector('#view-redline .rl-tabrow');
      const rcs = getComputedStyle(row);
      const segs = [...document.querySelectorAll('#view-redline .rl-readwrap .rl-seg')].map(b => {
        const cs = getComputedStyle(b);
        return { t: b.textContent.replace(/\s+/g, ' ').trim(), on: b.classList.contains('on'),
          size: cs.fontSize, weight: cs.fontWeight, shadow: cs.boxShadow, bg: cs.backgroundColor,
          h: Math.round(b.getBoundingClientRect().height) };
      });
      const n = document.querySelector('#view-redline .rl-readwrap .rl-seg.on .rl-seg-n');
      const all = document.querySelector('#view-redline .rl-fseg[data-rl-cardfilter="all"] .rl-fseg-n');
      return { bg: rcs.backgroundColor, h: Math.round(row.getBoundingClientRect().height),
        rule: rcs.boxShadow, segs, count: n && n.textContent.trim(), allCount: all && all.textContent.trim() };
    });
    check('2 the control bar is a white band 44px tall',
      tabs.bg === 'rgb(255, 255, 255)' && tabs.h === 44, `${tabs.bg} ${tabs.h}px`);
    check('2 the three readings are tabs at 14px, full height of the bar',
      tabs.segs.length === 3 && tabs.segs.every(s => s.size === '14px' && s.h >= 40),
      tabs.segs.map(s => `${s.t} ${s.size}/${s.h}px`).join(', '));
    /* THE MARK IS THE UNDERLINE, and the pill it replaced is gone: a raised
       white chip on a grey tray was the OLD control, and both at once would be
       two marks for one fact. */
    const live = tabs.segs.find(s => s.on);
    check('2 the live one is bold and carries a 2px underline',
      live && live.weight === '700' && /inset/.test(live.shadow) && /-2px/.test(live.shadow),
      live && `${live.weight} ${live.shadow}`);
    check('2 and the resting ones are flat — no chip, no tray',
      tabs.segs.filter(s => !s.on).every(s => s.bg === 'rgba(0, 0, 0, 0)' && s.shadow === 'none'),
      tabs.segs.filter(s => !s.on).map(s => s.bg).join(', '));
    /* ONE COUNT, TWO SURFACES. The tab's number is passed in by the caller
       precisely so it cannot be a second reading — proved by comparing it with
       the change column's own All tab. */
    check('2 Redlined carries a count, and it is the column\'s own',
      !!tabs.count && tabs.count === tabs.allCount,
      `tab "${tabs.count}" · column All "${tabs.allCount}"`);

    /* ---- 3. THE RIGHT-HAND CONTROLS ---- */
    const ctrls = await page.evaluate(seen => {
      const s = eval(seen);
      const cs = sel => { const el = document.querySelector(sel); return el ? getComputedStyle(el) : null; };
      const seat = cs('#view-redline .rl-actions .rl-segwrap .rl-seg.on');
      const needs = cs('#view-redline .rl-needs');
      const back = cs('#view-redline .rl-livelist');
      const step = cs('#view-redline .rl-type-step');
      return { seatBg: seat && seat.backgroundColor, seatInk: seat && seat.color,
        needsBorder: needs && needs.borderTopWidth, needsBg: needs && needs.backgroundColor,
        backBorder: back && back.borderTopWidth, backBg: back && back.backgroundColor,
        stepH: step && step.height, stepBorder: step && step.borderTopWidth,
        stepButtons: document.querySelectorAll('#view-redline .rl-tabrow .rl-type-step button').length,
        readout: (document.querySelector('#view-redline .rl-type-out') || {}).textContent,
        order: [...document.querySelectorAll('#view-redline .rl-actions > *')]
          .map(e => e.className.split(' ')[0]),
        backBox: s('#view-redline .rl-livelist') };
    }, SEEN);
    check('3 the seat switch FILLS on the live half', ctrls.seatInk === 'rgb(255, 255, 255)'
      && ctrls.seatBg !== 'rgba(0, 0, 0, 0)', `${ctrls.seatBg} / ${ctrls.seatInk}`);
    check('3 "needs you" is a way in, not an act — no box round it',
      parseFloat(ctrls.needsBorder) === 0 && ctrls.needsBg === 'rgba(0, 0, 0, 0)',
      `${ctrls.needsBorder} on ${ctrls.needsBg}`);
    check('3 the way back is plain words — no chip',
      parseFloat(ctrls.backBorder) === 0 && ctrls.backBg === 'rgba(0, 0, 0, 0)',
      `${ctrls.backBorder} on ${ctrls.backBg}`);
    /* ONE BOX — the two presses are kept (they are the control, and the
       Document tab draws the same builder) and read as a single 28px box. */
    check('3 the text size is ONE bordered box, with both presses inside it',
      ctrls.stepH === '28px' && parseFloat(ctrls.stepBorder) >= 1 && ctrls.stepButtons === 2,
      `${ctrls.stepH} border ${ctrls.stepBorder}, ${ctrls.stepButtons} presses, readout "${ctrls.readout}"`);
    check('3 and the way back ends the row',
      ctrls.order[ctrls.order.length - 1] === 'rl-livelist', ctrls.order.join(' › '));

    /* ---- 4. THE CONTRACT FILLS ITS COLUMN AT A STEADY SIZE ---- */
    const sheet = await page.evaluate(() => {
      const paper = document.querySelector('#view-redline .rl-paper');
      const col = document.querySelector('#view-redline #rl-doc');
      const wrap = paper.closest('.rl-zoom');
      const p = paper.getBoundingClientRect(), c = col.getBoundingClientRect();
      const line = paper.querySelector('p');
      return { paper: Math.round(p.width), col: Math.round(c.width),
        zoom: Number(getComputedStyle(wrap).zoom) || 1,
        pad: getComputedStyle(paper).padding,
        body: getComputedStyle(line).fontSize,
        grid: getComputedStyle(document.getElementById('rl-grid')).gridTemplateColumns,
        scrollPad: getComputedStyle(document.getElementById('redline-host')).padding };
    });
    check('4 the sheet fills its column', sheet.paper >= sheet.col - 12,
      `${sheet.paper} of ${sheet.col}`);
    check('4 and is not magnified to do it', sheet.zoom === 1, `zoom ${sheet.zoom}`);
    check('4 the contract reads at 14px on the render\'s own margins',
      sheet.body === '14px' && sheet.pad === '30px 56px 34px', `${sheet.body} · ${sheet.pad}`);
    check('4 the page carries the product\'s page measure',
      /48px/.test(sheet.scrollPad), sheet.scrollPad);
    /* THE DIVIDER RESTS WHERE THE CARDS ARE DRAWN TO. A width, not a fraction:
       460 is a fact about the cards and a fraction gives them a different
       number on every monitor. */
    check('4 the change column opens at 460px', / 460px$/.test(sheet.grid), sheet.grid);

    /* ---- 5. THE CHANGE COLUMN GREW A SIZE AND KEPT NO BOX ---- */
    const col = await page.evaluate(() => {
      const cs = sel => { const el = document.querySelector('#view-redline ' + sel);
        return el ? getComputedStyle(el) : null; };
      const pane = cs('.nego-pane.index');
      return { paneBg: pane && pane.backgroundColor, paneBorder: pane && pane.borderTopWidth,
        cap: cs('.rl-idx-k') && cs('.rl-idx-k').fontSize,
        filter: cs('.rl-fseg') && cs('.rl-fseg').fontSize,
        restCount: cs('.rl-fseg:not(.on) .rl-fseg-n') && cs('.rl-fseg:not(.on) .rl-fseg-n').borderTopWidth,
        cardWording: cs('.rl-card-diff') && cs('.rl-card-diff').fontSize,
        cardMeta: cs('.rl-card-meta') && cs('.rl-card-meta').fontSize,
        badge: cs('.rl-badge') && cs('.rl-badge').fontSize,
        verb: cs('.rl-card-verbs button') && cs('.rl-card-verbs button').height,
        copilot: !!document.querySelector('#view-redline .rl-plan'),
        band: !!document.querySelector('#view-redline .rl-unsent') };
    });
    check('5 the wording preview reads at 14px, the card meta at 13',
      col.cardWording === '14px' && col.cardMeta === '13px',
      `${col.cardWording} / ${col.cardMeta}`);
    check('5 the caption and the filter took the render\'s sizes',
      col.cap === '12px' && col.filter === '14px', `${col.cap} / ${col.filter}`);
    check('5 the verbs are 30px tall', col.verb === '30px', col.verb);
    /* THE OWNER'S OWN DECISION, KEPT AGAINST THE MOCK-UP. The render boxes this
       column in white; at the 300px the divider allows, a box round a column of
       boxes reads as clutter — so the pane stays transparent. Asserted so a
       later pass cannot quietly take it. */
    check('5 and the column is STILL NOT A CARD — no ground, no border',
      col.paneBg === 'rgba(0, 0, 0, 0)' && parseFloat(col.paneBorder) === 0,
      `${col.paneBg} border ${col.paneBorder}`);
    /* AND THE RENDER B COUNT MARKERS SURVIVED THE BUMP: the hairline box round
       a resting count is a measured contrast decision six days older than this
       redesign and was not part of what it reversed. */
    check('5 a resting count keeps its hairline box',
      parseFloat(col.restCount) >= 1, col.restCount);
    check('6 the Copilot band is still there, and so is the unsent band',
      col.copilot && col.band, `copilot ${col.copilot} · unsent ${col.band}`);

    /* ---- 7. NOTHING SITS UNDER THE CONTRACT ----
       A first build put two panels here — the other live negotiations, and the
       same changes read side by side — off the mock-up's own bottom half. The
       owner reversed it: this page is the contract and the change column, and
       nothing below them. So this section is the ABSENCE, asserted, because a
       feature removed on request is exactly the kind that comes back through a
       door nobody remembered. */
    const under = await page.evaluate(() => ({
      below: document.querySelectorAll('#rl-below, .rl-below').length,
      threads: document.querySelectorAll('.rl-threads, .rl-thread-nm').length,
      props: document.querySelectorAll('.rl-prop, .rl-versus, .rl-vs').length,
      /* The builders themselves, not just their pixels: a name still published
         is a panel one caller away from being back. */
      builders: ['rlThreadsPanelHtml', 'rlProposalsPanelHtml', 'negoClosedList']
        .filter(k => typeof window[k] === 'function') }));
    check('7 the page draws nothing under the contract',
      under.below === 0 && under.threads === 0 && under.props === 0,
      `below ${under.below} · threads ${under.threads} · proposals ${under.props}`);
    check('7 and the builders went with them, so nothing can call them back',
      under.builders.length === 0, under.builders.join(', ') || 'none');
    await page.screenshot({ path: path.join(OUT, '02-no-panels.png') });

    /* ---- 9. AND THE PREVIEW STILL SHOWS THE OTHER SEAT ----
       Counterparty View is a WINDOW, not a chair: the restyled row is drawn
       from our chair either way and goes dead, which is what stops the controls
       shuffling sideways on the one toggle whose purpose is comparing the two.
       Measured here because the restyle rewrote that row. */
    await page.click('#view-redline [data-redline-side="counterparty"]');
    await pause(1600);
    const preview = await page.evaluate(() => {
      const row = document.querySelector('#view-redline .rl-tabrow');
      const dead = [...row.querySelectorAll('button')].filter(b => b.hasAttribute('data-rl-dead'));
      return { seat: (document.querySelector('#view-redline .rl-actions .rl-segwrap .rl-seg.on') || {}).textContent,
        rowText: (row.textContent || '').replace(/\s+/g, ' ').trim(),
        deadN: dead.length, paper: !!document.querySelector('#view-redline .rl-paper') };
    });
    check('9 the toggle really moves the seat, and the paper still draws',
      /Counterparty/i.test(preview.seat || '') && preview.paper, preview.seat);
    /* THE ROW IS DRAWN FROM OUR CHAIR EITHER WAY. It used to swap every label
       for the other seat's and drop four of our controls, so flipping the
       toggle shuffled the row sideways and back — on the one control whose
       purpose is comparing the two views. Its acts live in the HEAD now, which
       is where the dead-in-preview treatment sits; what this checks is that the
       row itself still says what it said. */
    check('9 the row keeps its words and reads from our chair',
      /Redlined/i.test(preview.rowText) && /All negotiations/i.test(preview.rowText),
      preview.rowText.slice(0, 80));
    await page.screenshot({ path: path.join(OUT, '04-preview.png') });
    await page.click('#view-redline [data-redline-side="owner"]');
    await pause(1400);

    /* ---- 10. THE WORKING AREA IS THE WINDOW ----
       The rule this page has always had, and the one the panels briefly broke:
       the contract and the change column fill the window and each scrolls
       inside ITSELF, so reading the paper never loses your place in the cards.
       Nothing scrolls past the fold. */
    const geom = await page.evaluate(() => {
      const host = document.getElementById('redline-host');
      const cards = document.getElementById('nego-cards');
      const doc = document.getElementById('nego-scroll-work');
      const view = document.getElementById('view-redline');
      return { hostH: Math.round(host.clientHeight),
        hostScrolls: host.scrollHeight > host.clientHeight + 8,
        viewH: Math.round(view.getBoundingClientRect().height),
        winH: window.innerHeight,
        cardsScrollsItself: cards ? getComputedStyle(cards).overflowY : null,
        docScrollsItself: doc ? getComputedStyle(doc).overflowY : null,
        pageScrollsDown: document.documentElement.scrollHeight > document.documentElement.clientHeight + 8,
        pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    });
    check('10 the page ends at the fold — nothing to scroll down to',
      !geom.pageScrollsDown && !geom.hostScrolls,
      `page ${geom.pageScrollsDown} · working area ${geom.hostScrolls}`);
    check('10 the working area fills the window',
      geom.viewH <= geom.winH + 2 && geom.hostH > 300, `${geom.viewH} of ${geom.winH}`);
    check('10 the contract and the change column each scroll inside themselves',
      /auto|scroll/.test(geom.cardsScrollsItself || '') && /auto|scroll/.test(geom.docScrollsItself || ''),
      `cards ${geom.cardsScrollsItself} · contract ${geom.docScrollsItself}`);
    check('10 nothing makes the page scroll sideways', !geom.pageScrollsSideways);

    /* ---- 11. DARK, AND THE ACCENT INK SURVIVES IT ---- */
    await page.evaluate(() => setTheme('dark'));
    await pause(1500);
    const dark = await page.evaluate(() => {
      const rgb = s => (s.match(/\d+/g) || []).map(Number);
      const lum = c => { const [r, g, b] = c.map(v => { v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const ratio = (a, b) => { const l1 = lum(rgb(a)), l2 = lum(rgb(b));
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
      const tab = document.querySelector('#view-redline .rl-readwrap .rl-seg.on');
      const bar = document.querySelector('#view-redline .rl-tabrow');
      const back = document.querySelector('#view-redline .rl-livelist');
      return { tab: ratio(getComputedStyle(tab).color, getComputedStyle(bar).backgroundColor),
        back: ratio(getComputedStyle(back).color, getComputedStyle(bar).backgroundColor) };
    });
    await page.screenshot({ path: path.join(OUT, '05-dark.png') });
    /* THE FAULT THIS CATCHES, and it is one this page has had before: the dark
       theme does not redefine the accent ramp, so accent-800 is a deep green on
       an almost-black bar — 2.4:1, invisible. Found by photographing it. */
    check('11 the live tab is readable in dark', dark.tab >= 4, dark.tab.toFixed(1) + ':1');
    check('11 and so is the way back', dark.back >= 4, dark.back.toFixed(1) + ':1');
    await page.evaluate(() => setTheme('light'));
    await pause(1200);

    /* ---- 12. AND THE ROW STILL FITS ON A LAPTOP ---- */
    for (const w of [1280, 1366, 1440]){
      await page.setViewportSize({ width: w, height: 900 });
      await pause(800);
      const fit = await page.evaluate(() => {
        const row = document.querySelector('#view-redline .rl-tabrow');
        const words = [...document.querySelectorAll('#view-redline .rl-word')]
          .filter(e => getComputedStyle(e).display === 'none').length;
        return { cls: row.className, hidden: words,
          h: Math.round(row.getBoundingClientRect().height) };
      });
      check(`12 at ${w} the control row holds one line with its words on`,
        fit.h <= 46 && fit.hidden === 0 && !/rl-tabrow-(wrap|half|tight)/.test(fit.cls),
        `${fit.h}px · ${fit.cls} · ${fit.hidden} words folded`);
    }
    await page.setViewportSize({ width: 1500, height: 1000 });
    await pause(500);

    check('no page errors anywhere in the journey', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length){ console.log('FAILED:'); bad.forEach(b => console.log('  · ' + b.name)); }
  process.exit(bad.length ? 1 : 0);
})();
