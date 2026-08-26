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
        padX: cs && cs.paddingLeft, padXR: cs && cs.paddingRight,
        bandX: getComputedStyle(document.documentElement).getPropertyValue('--band-pad-x').trim(),
        rule: cs && cs.boxShadow,
        crumb: !!document.querySelector('#view-redline .room-crumb'),
        back: s('#view-redline #ws-back'),
        title: s('#view-redline #ws-back-title'),
        facts: !!document.querySelector('#view-redline #ws-head .room-facts'),
        sub: !!document.querySelector('#view-redline #ws-head .room-headsub'),
        acts: [...document.querySelectorAll('#view-redline #ws-head .room-acts > *')]
          .filter(e => getComputedStyle(e).display !== 'none')
          .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
          .map(e => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 22)) };
    }, SEEN);
    check('1 the head is a white band', head.bg === 'rgb(255, 255, 255)', head.bg);
    /* REVERSED IN PLACE 25 Aug 2026 — this pinned the literal `9px 24px`, and
       the vertical half of that is not a claim about anything: it is whatever
       lands this head's title on the same vertical as every other page's, and
       pages-read-alike section 8 owns that. The horizontal IS the claim, and
       it is a RELATION — the band's own inset, read off the token, so a change
       to the measure costs no edit here. */
    check('1 with a hairline under it and the band measure inside it',
      /inset/.test(head.rule || '')
        && head.padX === head.bandX && head.padXR === head.bandX,
      `${head.pad} · x ${head.padX}/${head.padXR} vs --band-pad-x ${head.bandX} · ${head.rule}`);
    /* ---- REVERSED IN PLACE 24 Aug 2026 (owner-approved render) ----
       The head was one line because the render it was built from drew one. The
       owner's new render gives this page the design's FACTS STRIP and a quiet
       sub-line under the title — you could argue a contract's wording all week
       without once seeing what it is worth or when it expires. So the head is
       three rows now, and what this claim was really guarding moved with it:
       the ACTS must never wrap, which was the 22 Aug report and is what the
       one-line rule was standing in for. That is asserted directly below, at
       three widths and on a long name, which is stronger than a height. */
    check('1 the head carries the facts strip and its sub-line',
      !!head.facts && !!head.sub, `facts ${!!head.facts} · sub ${!!head.sub}`);
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
    /* REVERSED IN PLACE 23 Aug 2026, owner-asked ("the publish round 1 button
       should also not be shaded"). This read "exactly one of them is filled —
       the platform button rule", and Publish Round was that one fill. It is the
       THIRD time that rule has been reversed by the same hand: the contract
       room's head gave its fill up the day before for the same reason, and the
       pattern is settled — this owner reads a filled face as shouting rather
       than leading. WHAT THE CLAIM IS REALLY ABOUT SURVIVES: the row must speak
       with ONE voice, so the number of fills is pinned at zero rather than left
       unasserted. THE WEIGHT WENT THE SAME MORNING ("publish round should not
       be bold"), so the act now leads by POSITION and its accent outline alone
       — pinned in pages-read-alike-verify section 5 and measured against its
       neighbours in flat-rows-and-alerts-verify section 3. */
    check('1b none of them is filled — the row leads by position, not by fill',
      acts.filled.length === 0, acts.filled.join(', ') || 'all flat');
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
        rule: rcs.boxShadow, segs, count: n && n.textContent.trim(),
        allCount: (() => { const f = document.querySelector('.rl-idx-title');
          return f ? ((f.textContent.match(/\((\d+)\)/) || [])[1] || null) : null; })() };
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
    /* RE-POINTED 24 Aug 2026 onto the filter's All option, and AGAIN 26 Aug
       2026 when that filter was deleted — the column's own count is on the
       head's own title now. The claim is the one that matters and has never
       changed: the tab's number is the COLUMN's number, not a second reading. */
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
        scrollPad: getComputedStyle(document.getElementById('redline-host')).paddingRight,
        headPad: getComputedStyle(document.querySelector('#view-redline #ws-head')).paddingRight };
    });
    check('4 the sheet fills its column', sheet.paper >= sheet.col - 12,
      `${sheet.paper} of ${sheet.col}`);
    check('4 and is not magnified to do it', sheet.zoom === 1, `zoom ${sheet.zoom}`);
    check('4 the contract reads at 14px on the render\'s own margins',
      sheet.body === '14px' && sheet.pad === '30px 56px 34px', `${sheet.body} · ${sheet.pad}`);
    /* ---- ONE INSET, SHARED WITH THE BANDS ABOVE (owner-reported 22 Aug 2026:
       "the tracked changes cards are leaving space on the right hand side") ----
       This asserted 48px — the render's own .h-content measure, which the
       render also uses against a head and a bar inset 24. MEASURED, that
       difference IS a dead strip: the change column's right edge sat 49px
       inside the head's at every width, so the cards stopped short of a page
       that carried on without them. The claim is now the RELATION the report
       was really about — the working area lines up with the bands above it —
       rather than a number, so the next change to the page measure costs no
       test edit. pages-read-alike-verify holds the same claim as a geometry. */
    check('4 the working area shares the bands\' own page inset',
      sheet.scrollPad === sheet.headPad, `${sheet.scrollPad} vs head ${sheet.headPad}`);
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
        cap: cs('.rl-idx-title') && cs('.rl-idx-title').fontSize,
        capRule: cs('.rl-idx-title') && cs('.rl-idx-title').borderBottomWidth,
        capRuleColor: cs('.rl-idx-title') && cs('.rl-idx-title').borderBottomColor,
        filterText: (document.getElementById('rl-cardfilter') || {}).textContent || '',
        /* the front edge, by whose ask it is — what replaced the filter */
        edgeOurs: (() => { const el = document.querySelector('#rl-changes .rl-card-d[data-rl-origin="us"]');
          return el ? getComputedStyle(el).borderLeftColor : null; })(),
        edgeTheirs: (() => { const el = document.querySelector('#rl-changes .rl-card-d[data-rl-origin="them"]');
          return el ? getComputedStyle(el).borderLeftColor : null; })(),
        filter: cs('#rl-cardfilter') && cs('#rl-cardfilter').fontSize,
        restCount: cs('.rl-fseg:not(.on) .rl-fseg-n') && cs('.rl-fseg:not(.on) .rl-fseg-n').borderTopWidth,
        cardWording: cs('.rl-card-sum') && cs('.rl-card-sum').fontSize,
        oldPreview: !!document.querySelector('#view-redline .rl-card-diff'),
        cardMeta: cs('.rl-card-meta') && cs('.rl-card-meta').fontSize,
        badge: cs('.rl-badge') && cs('.rl-badge').fontSize,
        verb: cs('.rl-card-verbs button') && cs('.rl-card-verbs button').height,
        copilot: !!document.querySelector('#view-redline .rl-plan'),
        band: !!document.querySelector('#view-redline .rl-unsent') };
    });
    /* RE-POINTED 25 Aug 2026 (the owner's own drawing of this column): what
       says WHAT IS BEING DECIDED is the change's own summary in bold, where it
       was a two-line greyed preview of the marked wording. The claim is the
       relation this always made — the sentence a reader scans is set larger
       than the reference line above it — so a later type pass costs no edit
       here. .rl-card-diff is stale and its absence is asserted. */
    check('5 the summary reads larger than the meta line it sits under',
      parseFloat(col.cardWording) > parseFloat(col.cardMeta) && !col.oldPreview,
      `${col.cardWording} / ${col.cardMeta}`);
    /* RE-POINTED 24 Aug 2026 — the caption is the change index's title and the
       filter is a select on its own line. RE-POINTED AGAIN 25 Aug 2026 against
       the design reference: the title is the column's one TAB and was set well
       above the filter under it.
       REVERSED IN PLACE 26 Aug 2026, and the reversal is the owner's, not this
       sweep's. The column was rebuilt to the owner's own drawing and the title
       came DOWN to the rows' own size on purpose — that rule's comment says so
       in its own words: "with the size gone [the 2px accent rule] is the whole
       of what marks this as the column's name", and "nothing below it ends up
       larger". So SIZE stopped being the title's marker, and the old claim
       survived that change only by the accident of a half-pixel — the filter
       was 12.5px, which this product's own whole-pixel rule then rounded to 13.
       WHAT THE CLAIM PROTECTS IS UNCHANGED and is asserted the other way up:
       the column still names itself unmistakably (the 2px accent rule is drawn
       and is a real colour), the filter is still there, and nothing under the
       title is set larger than it. */
    /* RE-POINTED 26 Aug 2026: the WHOSE ASKS filter is deleted, so the half of
       this that measured it against the title has nothing to measure. What the
       claim protects is untouched — the column still names itself
       unmistakably, by the 2px accent rule that its own comment calls "the
       whole of what marks this as the column's name". */
    check('5 the index names itself, by its rule rather than its size',
      parseFloat(col.capRule) >= 2 && !/^rgba\(0, 0, 0, 0\)$/.test(col.capRuleColor || ''),
      `rule ${col.capRule} ${col.capRuleColor} · cap ${col.cap}`);
    check('5 and the whose-asks filter is gone from the head',
      !col.filter, String(col.filter));
    /* AND THE VERBS ARE BARE WORDS ON THIS COLUMN, so there is no button box
       left to have a height: what carries them is the line they sit on. The
       30px box was the bordered button the reference does not draw. */
    check('5 the verbs sit on the row\'s own line, with no box of their own',
      parseFloat(col.verb) > 0 && parseFloat(col.verb) <= 22, col.verb);
    /* THE OWNER'S OWN DECISION, KEPT AGAINST THE MOCK-UP. The render boxes this
       column in white; at the 300px the divider allows, a box round a column of
       boxes reads as clutter — so the pane stays transparent. Asserted so a
       later pass cannot quietly take it. */
    check('5 and the column is STILL NOT A CARD — no ground, no border',
      col.paneBg === 'rgba(0, 0, 0, 0)' && parseFloat(col.paneBorder) === 0,
      `${col.paneBg} border ${col.paneBorder}`);
    /* ---- REVERSED IN PLACE 23 Aug 2026, owner-chose render B1 ----
       This asserted the hairline box round a resting count, on the grounds that
       Render B's markers were a measured contrast decision older than the
       redesign and not part of what it reversed. B1 reverses them on purpose:
       the count is 19px now — the largest thing on the column — so the box and
       the live one's fill are a second mark for a fact the size already
       carries, and the underline is back as the single marker.
       WHAT THE CLAIM PROTECTS IS UNCHANGED and is asserted the other way up:
       the live cut must be unmistakable and the resting counts must stay
       readable. panel-alerts-and-head-verify measures both in full; here it is
       the one line that used to say the opposite. */
    /* REVERSED AGAIN 24 Aug 2026 — there are no resting counts to box: the
       three cuts are a dropdown's options, and each carries its count in its
       own words. What the claim protects is unchanged and is asserted where it
       can be: every option states its number, so the split reads without
       opening the control. */
    /* REVERSED IN PLACE 26 Aug 2026. This held every cut of the filter to its
       own count, which is what made a change-hiding control safe. The control
       is deleted, and the question it asked — whose ask is this — is answered
       by the coloured front edge of every row instead. So what is measured is
       the property that replaced it. */
    check('5 whose ask it is is answered by the front edge instead',
      col.edgeOurs && col.edgeTheirs && col.edgeOurs !== col.edgeTheirs,
      `${col.edgeOurs} vs ${col.edgeTheirs}`);
    /* REVERSED IN PLACE 24 Aug 2026 (WO-3, owner-asked: "delete the copilot
       first pass feature completely", then "Just delete the strip for now").
       This pinned that the 22 Aug redesign had not quietly taken the band with
       it — a real claim then, and the owner has now asked for it to go. The
       UNSENT band is a different object and is untouched, which is the half
       still worth pinning: two bands went out of this column on two different
       days for two different reasons, and only one of them was asked for. */
    check('6 the Copilot band is gone (WO-3) and the unsent band is not',
      !col.copilot && col.band, `copilot ${col.copilot} · unsent ${col.band}`);

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

    /* ---- 13 · THE THREE CHECK SYMBOLS (WO-10, owner-asked 24 Aug 2026) ----
       "add the red highlighted symbols to where image 3 shows in the
       negotiation page. They should then act like buttons so you can click on
       them to run the respective scans but if they were already ran while in
       the documents page, then the results simply appear from the panel on the
       right hand side."
       IN A BROWSER because the two things that could be wrong here cannot be
       asked anywhere else: whether a NEW control is a dead press — the fault
       this codebase records more than any other — and whether it lands on the
       facts line or takes one of its own, which is a cascade question and looks
       perfectly correct in the source either way. */
    const checks = await page.evaluate(() => {
      const g = e => e ? getComputedStyle(e) : null;
      const box = e => { if (!e) return null; const r = e.getBoundingClientRect();
        return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left),
          r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; };
      const wrap = document.querySelector('#view-redline .room-checks');
      const btns = [...document.querySelectorAll('#view-redline .room-check')];
      return { wrap: box(wrap), facets: box(document.querySelector('#view-redline .room-facets')),
        facts: box(document.querySelector('#view-redline .room-facts')),
        head: box(document.querySelector('#view-redline #ws-head')),
        n: btns.length,
        kinds: btns.map(b => b.getAttribute('data-room-check')),
        titled: btns.every(b => (b.getAttribute('title') || '').trim().length > 3),
        labelled: btns.every(b => (b.getAttribute('aria-label') || '').trim().length > 3),
        /* SYMBOLS ONLY — the owner's ruling. A button carrying a word here
           would be the strip this page just lost, in new clothes. */
        wordless: btns.every(b => (b.textContent || '').trim() === ''),
        painted: btns.every(b => { const r = b.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && g(b).visibility !== 'hidden'; }) };
    });
    check('13 three symbols, one per check, in the order they are worked in',
      checks.n === 3 && checks.kinds.join(',') === 'oblig,playbook,risk',
      checks.kinds.join(','));
    check('13 they are drawn as visible pixels', !!checks.wrap && checks.painted);
    check('13 symbols only — the name lives on the hover, per the ruling',
      checks.wordless && checks.titled && checks.labelled,
      JSON.stringify({ wordless: checks.wordless, titled: checks.titled }));
    /* THEY SHARE THE FACTS' LINE AND SIT AT ITS RIGHT WALL. `.room-facts` was a
       plain block when this shipped, so its two children stacked and the
       `margin-left:auto` had nothing to push against — MEASURED, the symbols
       took a whole line at the LEFT wall and added 28px to a head meant to be
       compact. Both halves are pinned, as RELATIONS. */
    const onLine = checks.wrap && checks.facets
      && checks.wrap.t < checks.facets.b && checks.wrap.b > checks.facets.t;
    check('13 they share the facts line rather than taking one of their own',
      onLine, JSON.stringify({ checks: checks.wrap, facets: checks.facets }));
    check('13 and they sit at that line\'s right wall',
      checks.wrap && checks.facts && Math.abs(checks.wrap.r - checks.facts.r) <= 2,
      `${checks.wrap && checks.wrap.r} vs ${checks.facts && checks.facts.r}`);

    /* ---- AND THE PRESS REALLY LANDS ---- */
    const before = await page.evaluate(() =>
      !!document.querySelector('#side-panel, .side-panel'));
    await page.evaluate(() => { window.__cvBefore =
      (typeof checkVerdict === 'function')
        ? !!checkVerdict(getContract(state.activeId), 'oblig') : null; });
    await page.click('#view-redline .room-check[data-room-check="oblig"]');
    await pause(2500);
    const after = await page.evaluate(() => {
      const p = document.querySelector('#side-panel, .side-panel');
      const on = p && p.getBoundingClientRect().width > 0;
      return { on: !!on, ran: window.__cvBefore,
        /* the panel BORROWS the obligations card by its element id — the same
           trick openCheckPanel already plays, so it is the card moved whole and
           never a second rendering */
        borrowed: !!document.querySelector('#side-panel #obligations-section, .side-panel #obligations-section'),
        toast: (document.querySelector('#toast-root') || {}).textContent || '' };
    });
    void before;
    check('13 pressing one is not a dead press — something happens',
      after.on || /\S/.test(after.toast),
      JSON.stringify({ panel: after.on, alreadyRun: after.ran, toast: after.toast.slice(0, 60) }));
    check('13 and where the check had already run, the panel shows its findings',
      after.ran === false || after.borrowed || after.on,
      JSON.stringify({ alreadyRun: after.ran, borrowed: after.borrowed }));
    await page.keyboard.press('Escape');
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
