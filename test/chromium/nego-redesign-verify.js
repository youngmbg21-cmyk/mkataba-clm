/* Chromium verification: THE NEGOTIATION PAGE TAKES THE MOCK-UP'S TREATMENT.
   ============================================================
   Owner-approved render, 22 Aug 2026. Eight marked places: two white bands at
   the top, the reading tabs, the right-hand controls, a fluid contract, a
   change column a size larger, the Copilot band kept, and two panels under the
   contract that did not exist — Live threads and Proposals on the table.

   WHY THIS IS A BROWSER FILE AND NOT A NODE TEST. Every claim below is either
   a COMPUTED STYLE or a JOURNEY, and jsdom can answer neither:

     · this page's redesign is written as a block at the END of a 3,500-line
       stylesheet, and a rule that loses a cascade fight looks perfectly correct
       in the source. That is this codebase's own most expensive lesson (see the
       .rl-rej note in CLAUDE.md: two verbs described as outlined computed to
       border-width 0 for a year, and a source-reading test passed on it
       throughout). Everything here reads getComputedStyle;
     · "the sheet fills its column" is a measurement against a neighbour;
     · "the panels show the same list as the column" is only true if pressing a
       verb in one moves the other, which needs a real click and a real repaint;
     · "not on the counterparty's seat" is a claim about pixels that must be
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

    /* ---- 7. LIVE THREADS ---- */
    await page.evaluate(() => { document.getElementById('redline-host').scrollTop = 99999; });
    await pause(500);
    await page.screenshot({ path: path.join(OUT, '02-panels.png') });
    const threads = await page.evaluate(seen => {
      const s = eval(seen);
      const rows = [...document.querySelectorAll('#rl-below .rl-thread')];
      return { panel: s('#rl-below .rl-threads'), n: rows.length,
        here: rows.filter(r => r.classList.contains('on')).length,
        hereIsInert: rows.filter(r => r.classList.contains('on'))
          .every(r => !r.hasAttribute('data-rl-thread')),
        moves: rows.map(r => (r.querySelector('.rl-thread-mv') || {}).textContent || ''),
        closed: !!document.querySelector('#rl-below [data-rl-closed]'),
        headCount: (document.querySelector('#rl-below .rl-threads .rl-panel-n') || {}).textContent,
        listCount: String((window.negoLiveList ? negoLiveList().length : -1)) };
    }, SEEN);
    check('7 Live threads is on the page, under the contract',
      !!threads.panel && threads.panel.on,
      threads.panel ? `${threads.panel.w}x${threads.panel.h}` : 'MISSING');
    check('7 it lists every live negotiation, and its count is the list\'s own',
      threads.n >= 2 && String(threads.headCount).trim() === threads.listCount,
      `${threads.n} rows · head "${threads.headCount}" · negoLiveList ${threads.listCount}`);
    check('7 every row says whose move it is',
      threads.moves.length === threads.n && threads.moves.every(m => m.trim().length > 0),
      threads.moves.join(' | '));
    /* THE ROW YOU ARE ON IS NOT A DOOR — a press whose only outcome is
       redrawing the page you are already on reads as a dead button. */
    check('7 the one you are reading is marked and is not pressable',
      threads.here === 1 && threads.hereIsInert, `${threads.here} marked`);

    /* ---- 7b. AND PRESSING ANOTHER ONE GOES THERE ---- */
    const before = await page.evaluate(() => redlineHeldId());
    await page.click('#rl-below .rl-thread[data-rl-thread]');
    await pause(1800);
    const after = await page.evaluate(() => redlineHeldId());
    check('7b pressing another thread opens that negotiation',
      after && after !== before, `${before} → ${after}`);
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await pause(1800);

    /* ---- 8. PROPOSALS ON THE TABLE ---- */
    await page.evaluate(() => { document.getElementById('redline-host').scrollTop = 99999; });
    await pause(400);
    const props = await page.evaluate(seen => {
      const s = eval(seen);
      const rows = [...document.querySelectorAll('#rl-below .rl-prop')];
      return { panel: s('#rl-below .rl-props'), n: rows.length,
        colN: document.querySelectorAll('#rl-changes .rl-card').length,
        ids: rows.map(r => r.getAttribute('data-rl-prop')),
        colIds: [...document.querySelectorAll('#rl-changes .rl-card')]
          .map(r => r.getAttribute('data-nego-card')),
        versus: rows.map(r => r.querySelectorAll('.rl-vs').length),
        marks: rows.map(r => r.querySelectorAll('.rl-vs ins, .rl-vs del').length),
        theirs: rows.map(r => !!r.querySelector('.rl-vs.theirs')),
        tags: rows.map(r => (r.querySelector('.rl-prop-tag') || {}).textContent || ''),
        why: rows.filter(r => r.querySelector('.rl-prop-why')).length,
        verbs: rows.map(r => [...r.querySelectorAll('.rl-card-verbs button')]
          .map(b => b.textContent.replace(/\s+/g, ' ').trim())),
        /* AND NOT A SECOND CARD: the panel must not answer to the id the page
           uses to find A card, or "the card for CHG-004" becomes ambiguous. */
        dupCards: document.querySelectorAll('#rl-below [data-nego-card]').length,
        sub: !!document.querySelector('#rl-below .rl-props .rl-panel-sub') };
    }, SEEN);
    check('8 Proposals on the table is on the page',
      !!props.panel && props.panel.on,
      props.panel ? `${props.panel.w}x${props.panel.h}` : 'MISSING');
    /* THE CLAIM THE WHOLE PANEL RESTS ON. Two surfaces printing one set of
       changes is how they come to disagree; this one IS the card renderer under
       a layout flag, so the lists are the same list. Proved by their ids. */
    check('8 it shows exactly the changes the column shows — one list, not two',
      props.n === props.colN && props.ids.join() === props.colIds.join(),
      `panel ${props.ids.join()} · column ${props.colIds.join()}`);
    check('8 and it says so on the page, in words', props.sub);
    check('8 each proposal draws two wordings side by side',
      props.n > 0 && props.versus.every(v => v === 2), props.versus.join(', '));
    check('8 with the marks on them — struck out on one side, inserted on the other',
      props.marks.every(m => m > 0), props.marks.join(', '));
    check('8 and the other side\'s box sits on the warm ground',
      props.theirs.every(Boolean), props.theirs.join(', '));
    check('8 each is tagged whose it is', props.tags.every(t => t.trim().length > 0),
      props.tags.join(' | '));
    check('8 the author\'s reason reads under them', props.why === props.n,
      `${props.why} of ${props.n}`);
    check('8 the panel carries no second card id', props.dupCards === 0, props.dupCards + ' found');
    /* THE VERBS ARE THE CARD'S OWN — their asks get Accept/Reject, our unsent
       draft gets Send. Not a second set built here. */
    const flat = props.verbs.flat().join(' ');
    check('8 the verbs follow the change, exactly as the column\'s do',
      /Accept/.test(flat) && /Reject/.test(flat) && /Send/.test(flat),
      props.verbs.map((v, i) => props.ids[i] + ': ' + v.join('/')).join(' | '));

    /* ---- 8b. AND A PRESS IN THE PANEL RUNS THE ORDINARY FUNNEL ---- */
    const beforeN = await page.evaluate(id =>
      (getContract(id).changes || []).filter(x => x.status === 'pending').length, cid);
    const accepted = await page.evaluate(() => {
      const b = [...document.querySelectorAll('#rl-below .rl-prop .rl-card-verbs button')]
        .find(x => x.hasAttribute('data-nego-accept'));
      if (!b) return null;
      const id = b.getAttribute('data-nego-accept'); b.click(); return id;
    });
    await pause(1800);
    const afterN = await page.evaluate(id =>
      (getContract(id).changes || []).filter(x => x.status === 'pending').length, cid);
    const st = await page.evaluate(([id, ch]) =>
      (getContract(id).changes.find(x => x.id === ch) || {}).status, [cid, accepted]);
    check('8b Accept in the panel really decides the change — the ordinary funnel',
      !!accepted && st === 'accepted' && afterN === beforeN - 1,
      `${accepted} → ${st} · pending ${beforeN} → ${afterN}`);
    await page.screenshot({ path: path.join(OUT, '03-after-accept.png') });

    /* ---- 9. NOT ON THE COUNTERPARTY'S SEAT ---- */
    await page.click('#view-redline [data-redline-side="counterparty"]');
    await pause(1600);
    const preview = await page.evaluate(() => ({
      below: (document.getElementById('rl-below') || {}).innerHTML || '',
      threads: document.querySelectorAll('.rl-thread').length,
      props: document.querySelectorAll('.rl-prop').length }));
    /* WHICH OTHER COMPANIES WE ARE ARGUING WITH is the most internal list this
       product holds. The preview is a window onto what THEY see. */
    check('9 neither panel is drawn in Counterparty View',
      preview.below.trim() === '' && preview.threads === 0 && preview.props === 0,
      `threads ${preview.threads} · proposals ${preview.props}`);
    await page.screenshot({ path: path.join(OUT, '04-preview.png') });
    await page.click('#view-redline [data-redline-side="owner"]');
    await pause(1400);

    /* ---- 10. THE WORKING AREA IS STILL ONE SCREENFUL ---- */
    const geom = await page.evaluate(() => {
      const s = document.getElementById('redline-host');
      const panes = document.querySelector('#redline-host > .rl-root');
      const cards = document.getElementById('nego-cards');
      return { scrollH: Math.round(s.clientHeight), hostH: Math.round(panes.getBoundingClientRect().height),
        scrollable: s.scrollHeight > s.clientHeight + 20,
        cardsScrollsItself: cards ? getComputedStyle(cards).overflowY : null,
        pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    });
    check('10 the contract and the cards still fill one screenful',
      Math.abs(geom.hostH - geom.scrollH) <= 46, `panes ${geom.hostH} of ${geom.scrollH}`);
    check('10 and the panels are a scroll away, not a squeeze', geom.scrollable);
    check('10 the change column still scrolls inside itself',
      /auto|scroll/.test(geom.cardsScrollsItself || ''), geom.cardsScrollsItself);
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
