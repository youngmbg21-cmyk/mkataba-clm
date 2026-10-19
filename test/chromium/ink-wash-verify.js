/* ============================================================
   INK WASH AND SENTENCE CASE — HaTi without grey (owner, 9 Oct 2026)
   ============================================================
   docs/WORKORDER-ink-wash-and-sentence-case.md. Light mode's greys become
   ONE ink per brand (black + the theme colour, softened with a pale wash of
   it), and headers and labels stop being set in capitals. On pages AND in
   pop-ups.

   WHAT MUST NOT MOVE, each the owner's own words, is measured against a
   census recorded from the code BEFORE the change (ink-wash-baseline.json):
     · dark mode, exactly as today ("Dark mode should stay as is today")
     · the contract paper ("this should not impact the paper contract")
     · the redline cards' buttons ("do not change the colors of the redline
       cards Buttons")
     · danger buttons and the amber / green / ruby status colours
     · every text size ("exclude the Type Scale from this work")
   A census, not a pixel hash: every element in the scope is asked for its
   resolved colours (or size) and the whole set is tallied — the same method
   theme-tokens-verify uses, for the same reason.

     node test/chromium/ink-wash-verify.js --save   (record, on the code BEFORE)

   RE-RECORDED 18 Oct 2026 (eighteenth), OWNER-ASKED ("The SAP way, and call
   it Home"): no tab row above the page; the bar reads ‹ · Ha · the page's
   name ▾ and opens Recent. Audited by key: counts moved on every screen (the
   row left, everything under it moved up); GONE only the tab row's own
   colours in the dark themes (the pressed pill's accent wash and edge, the
   "‹ The counter" link's ink, the × ink, the bar divider's fill now hidden)
   and, on Our paper's sheet, one number box's HOVER tint — the census signs
   in by a click, the mouse stays there, and before the change that box sat
   under it (measured: rest .16, hover .28; the box's own clothes did not
   move). NEW only fill rgb(255,255,255) in the dark themes: the ▾ beside the
   page's name, the bar's own white. No colour new to the product.
   RE-RECORDED 18 Oct 2026 (seventeenth), OWNER-ASKED ("this should not be on
   paper at all"): the ladder's step chip and its tally chip left the paper
   (THE PAPER CARRIES NO LADDER), so the negotiate screen's paper counts two
   fewer elements. Audited by key: every theme, counts only, each down by 2;
   no key new, none gone, no colour or size moved.
   RE-RECORDED 18 Oct 2026 (sixteenth), OWNER-ASKED (the owner's yes to round
   24's question: the left-sidebar switch goes from Settings → You): the
   settings screen lost one row, so its counts fell. Audited by key: settings
   only, no key new; one key gone in the two dark themes, the off switch's
   fill (rgb 138,151,149), which was that switch. No colour new.
   RE-RECORDED 18 Oct 2026 (fifteenth), OWNER-ASKED (the overnight build,
   same standing yes): Round 24, "One sheet" — Settings → You is one sheet of
   rows under its headings with a contents list, so the settings screen's
   counts moved (more 12px small print, fewer 13px card lines). Audited by
   key: light themes, counts only; dark themes add the rows' hairline and
   the accent's icon stroke (both already worn on other screens) and the off
   switch's fill, which is --field-line, the product's control-edge token.
   No colour new to the product.
   RE-RECORDED 18 Oct 2026 (fourteenth), OWNER-ASKED (the overnight build,
   same standing yes): Round 21, "Paper first" — Our paper's book draws an
   index of templates and the chosen template's own paper, so the ourpaper
   screen's counts moved and its paper is measured for the first time (the
   PAPER reading now knows .tpl-pf-sheet, as it knows .pg-sheet). Audited by
   key: the new keys are the paper's own colours and sizes (the ones every
   other paper already wears) and the chosen row's accent tint; no colour new
   to the product.
   RE-RECORDED 18 Oct 2026 (thirteenth), OWNER-ASKED (the overnight build,
   same standing yes): Round 17, "Then and now" — Your book is a table (then,
   today, change, line) and the stage bar is drawn twice, so on the home
   screen the figures moved from 20 to 16px and the labels' counts rose.
   Audited by key: sizes only, no colour moved.
   RE-RECORDED 18 Oct 2026 (twelfth), OWNER-ASKED (the overnight build, same
   standing yes): Round 16, "Week by week" — the calendar (and Home showing
   it) opens on this week by the hour and five more weeks instead of the
   month, so its counts moved and the week's 16px day numbers are new to that
   screen. Audited by key: no colour new; in dark the month's greyed day
   numbers (#8B9895) and its filled "today" square left the opening screen
   with the month (both still drawn on Month).
   RE-RECORDED 18 Oct 2026 (eleventh), OWNER-ASKED (the overnight build, same
   standing yes): recorded on Round 15, "One worklist"; the counts that moved
   (the signing screen's 12 and 13px and dividers, by a few) were Round 10's
   late route-link fix arriving here — see "eighth, again" — not the worklist,
   which this census does not draw. Audited by key: no colour new, none gone.
   RE-RECORDED 18 Oct 2026 (tenth), OWNER-ASKED (the overnight build, same
   standing yes): Round 13, "Wall of papers" — the Contracts place's papers
   carry their facts under them (number · value, party, a private stream's
   lock) and the archive is its own button, so on the contracts screen and the
   dialog, alerts and toast drawn over it the 13px count and the dividers'
   counts rose. Audited by key: no colour new, none gone.
   RE-RECORDED 18 Oct 2026 (ninth), OWNER-ASKED (the overnight build, same
   standing yes): Round 12, "Two sides" — History reads as two lanes (ours,
   the days, theirs) with a bubble per entry, so on the History screen the
   12 and 13px counts and the dividers' counts moved, and in dark the Board's
   own side pair (#7FA6F0 ours, #B3A2F0 theirs) and two divider tones are new
   to that screen. Audited by key: only History moved; nothing gone.
   RE-RECORDED 18 Oct 2026 (eighth, again), OWNER-ASKED (the overnight
   build, same standing yes): Round 10's late fix — the route's own "Signing
   paper" link stays drawn while it is not the reader's turn; only the Sign
   button is held back — so on the signing screen the 12 and 13px counts and
   the dividers' counts rose by a few. Audited by key: only the signing
   screen moved; no colour new, none gone.
   RE-RECORDED 17 Oct 2026 (eighth), OWNER-ASKED (the overnight build, same
   standing yes): Round 10, "The road" — Before you sign draws its stops
   (Ready to sign, who signs, sealed and sent) above and around the column, so
   on the signing screen the 11, 12 and 13px counts rose and, in dark, counts
   of colours already in the palette. Audited by key: nothing new, nothing gone.
   RE-RECORDED 17 Oct 2026 (seventh), OWNER-ASKED (the overnight build, same
   standing yes): Round 9, "Piles" — a Redlines row says who and when and the
   reason they gave, the reference rides its hover: on the negotiate screen
   the 12px and 13px counts rose, the 10px count fell, and in dark the counts
   of colours already in the palette moved. Audited by key: nothing new, nothing gone.
   RE-RECORDED 17 Oct 2026 (sixth), OWNER-ASKED (the overnight build: "Build
   and update record even on new ones"): Round 7, "Read down" — a contract
   brought up is a page of its own on the desk, so the History screen (a
   strip on its History page) no longer draws the Board's own furniture
   around it: colours and counts only went away. Audited as a set
   difference: nothing new.
   RE-RECORDED 17 Oct 2026 (fifth), OWNER-ASKED (the overnight build: "Build
   and update record even on new ones"): Round 6, "One line" — the paper's
   line draws the stage as the house's pill, so on dark screens that show an
   In Review paper the amber stage wash and its ink (rgb(58,42,15) behind,
   rgb(235,173,70) ink and underline colour, the palette's own --st-amber-*)
   are new to those screens' census; elsewhere only counts moved (the bold
   name, Notes' word, the code-name mark). Audited as a set difference.
   RE-RECORDED 17 Oct 2026 (fourth), OWNER-ASKED (the overnight build, same
   standing yes): Round 5, "Jambo's tray" — the drop area gained its one
   "Several files? Import contracts" link, so on light screens the 12px and
   13px counts rose by one, on dark screens counts of colours already in the
   palette. Audited as a set difference: no colour and no text size new.
   RE-RECORDED 17 Oct 2026 (third), OWNER-ASKED (the overnight build: "Build
   and update record even on new ones. Complete the job"): Round 3, Jambo's
   panel "Tabs and faces" — on light screens two text sizes' counts rose
   (10px: the count on Jambo's tab; 12px: "‹ Jambo"), on dark screens counts
   of colours already in the palette (the amber count, its ink, the dark
   surface as its edge). Audited as a set difference: no colour and no text
   size new to the census.
   RE-RECORDED 17 Oct 2026 (second), OWNER-ASKED ("Yes, update the record";
   then "update the colour lists and merge when green"): Rounds 1 and 2, the
   Counter and the desk tabs — the left menu is not drawn on a computer, so
   headcounts fell on every screen (266 counts) and two rose (12px text and
   one dark divider: the desk tabs and their row). Audited as a set
   difference: no colour and no text size new to the census anywhere.
   RE-RECORDED 17 Oct 2026, OWNER-ASKED ("Yes"): the Away card on Settings'
   You tab (a stand-in while you're away) moved headcounts on the settings
   screen only (44 counts, all three themes). Audited as a set difference:
   no key new and none gone — no colour and no text size new to the census;
   every other screen byte-identical. All 170 claims passed after.
   RE-RECORDED 16 Oct 2026 (second), OWNER-ASKED ("Yes, update the record"):
   the Contracts place's stage tabs became the Stage box and its filters moved
   to the row above the card, and Jambo sits on the chips row of Home's panel;
   headcounts moved on the contracts, home and history screens and the three
   pop-ups drawn over Contracts. Audited as a set difference: no value new
   anywhere; the lit tab's tint (the accent at 12%, dark themes) gone from
   the contracts screen and its pop-ups.
   RE-RECORDED 16 Oct 2026, OWNER-ASKED ("Yes, update the record"): the
   Control Room built in full redrew Settings (cards, doors, Needs you rows,
   the side panel's tabs), which moved headcounts on the settings screen only.
   Audited as a set difference: no text size new; two dark tints new to that
   screen were already in the census on other screens; no colour new to it.
   RE-RECORDED 15 Oct 2026, on the owner's "approve a record": the Needs you
   card on Home's Board (and the count on Jambo's tab, now in the bell's own
   dark ink on amber) moved headcounts on Home and History and the screens
   drawn over Home (the count is drawn on the Board only, so the screens
   over Home's other faces are as they were). Audited as a set difference: no
   colour and no text size new to the census. Every Ink Wash claim passed after.
   RE-RECORDED 10 Oct 2026, OWNER-ASKED ("yes, update the record"): the
   page redesigns after 9 Oct (SAP batches, pop-ups as drawn, the obligations
   table, the History fold) moved the headcounts and a few dark-mode colours.
   Audited first as a set difference against the 9 Oct record: one new 15px
   text on Home; in dark mode a drawn pop-up's danger ground, the dialog foot,
   the table edges on Obligations and Settings, and the accent rule and strokes
   the History and Document redesigns removed. Every Ink Wash claim (ramp, no
   grey, no capitals, status, paper, redline and danger buttons) passed before
   and after. From here the record is today's pages.
   RE-RECORDED 11 Oct 2026, OWNER-ASKED ("yes, update the record"): the "My
   notes" menu door adds a few rows on every page (counts only), and in dark
   mode the Calendar's new layer keys add two swatches (the contract-dates dot
   --st-ruby-dot and Copilot's plan dashed edge --alt). Audited as a set
   difference: 8 new keys, all those swatches; 0 gone. Every Ink Wash claim
   passed before and after.
   RE-RECORDED AGAIN 11 Oct 2026, OWNER-ASKED ("Yes, update it"): the
   Calendar became one card with Copilot beside it (the design). Audited as a
   set difference: only the three calendar screens moved (green-light sizes,
   green-dark and navy-dark colours); every other screen is byte-identical.
   RE-RECORDED 11 Oct 2026 (third), OWNER-ASKED ("Yes, update the record"):
   Your book's six figures became one strip (the new Board design). Audited
   as a set difference: only dark Home's counts moved (five tile grounds and
   edges became the strip's one); 0 keys new, 0 gone; every other screen is
   identical.
   RE-RECORDED 12 Oct 2026, OWNER-ASKED ("Yes, update the record"): Jambo's
   face on his own doors (the top bar's ✦ and Home's Jambo tab became his
   picture). Audited first as a set difference: no colour appeared or vanished
   (the two faces carry data-ink-exempt and no tinted disc); counts moved by
   one element per page (svg + use → img), text sizes by one.
   RE-RECORDED 11 Oct 2026 (fifth), OWNER-ASKED ("yes go ahead with both"):
   the four builds (WORKORDER-four-builds) — the Calendar row left the menu
   (one 13px label and one 11px count fewer on every page), the calendar draws
   on Home's Calendar tab, the zoom stands where A⁻/A⁺ stood. Audited first as a
   set difference: 254 counts moved, NO colour appeared or vanished, light
   mode's colours unchanged (text-size counts only), status colours as before.
   RE-RECORDED 13 Oct 2026 (second), OWNER-ASKED ("revert all the buttons
   back to the previous thin grey outline"): --btn-edge is the hairline again.
   Audited as a set difference: light mode nothing moved; dark mode the
   accent edges (teal / blue) gone from buttons, steppers and switches (6
   keys), the dark rule's count up (38 keys new or moved), nothing else.
   170 of 170 pass after.
   RE-RECORDED 13 Oct 2026 with the owner's asked palette change ("the page
   adjustment buttons on the paper pages need to go back to what it was"):
   the zoom's edge is the grey hairline again and the Overview's card edits
   again. Audited as a set difference first: light mode no colour moved (one
   text-size count on the Overview); dark mode 8 keys new (the Overview's
   restored edit card edge, the zoom's grey edge on Negotiate), 0 gone, moves
   on Overview, Document and Negotiate only. 170 of 170 pass after.
   RE-RECORDED 12 Oct 2026, OWNER-ASKED ("yes, update the record"): after
   #233-#236 (the Details tab as a form, the SAP-way buttons). Audited first as
   a set difference: light mode NO colour new, gone or moved (text-size counts
   only, on every screen); dark mode 26 keys new and 78 gone, all the buttons'
   grey edges and white icons becoming the theme's lighter ink (the SAP way,
   owner picked 12 Oct). 170 of 170 pass after.
   RE-RECORDED 11 Oct 2026 (fourth), OWNER-ASKED ("yes"): the Board as drawn
   (rounds 1-3, owner-approved). Audited as a set difference: only Home moved,
   0 other screens. Light Home: counts only. Dark Home: 2 new (a card edge at
   .12 where it was .10) and 11 gone per brand (the old blocks' teal, amber
   and blue fills and strokes, now one hue squarified; the old agent-icon
   squares' glow grounds; an amber tile edge). Every Ink Wash claim passed
   before and after; the check passes twice running on the new record.
   RE-RECORDED 13 Oct 2026, OWNER-ASKED ("Yes"): Stakes on Home's Clauses
   tab (its head: one sentence, "Read the deal" and its cost line). Audited
   first as a set difference: only the Document screen moved. Light mode: no
   colour new, gone or moved (12px 51→54, 12.5px 64→67). Dark mode: counts
   +1 to +6, and per brand three new keys — the filled button's edge in the
   brand colour (top, bottom, left), a colour the screen already carried as a
   ground. 0 keys gone; every Ink Wash claim passed before and after.
   RE-RECORDED 13 Oct 2026 (second), OWNER-ASKED (the build: "You were also
   supposed to delete breakdown", "This is how the panel should look like but
   with a plain English button", then "merge to main once tests pass"): the
   Breakdown face left Home's pill, and Home's Clauses lost its title row,
   colour filter and the open row's marks. Audited first as a set difference:
   only Home, Calendar and Document moved. Light mode: text-size counts only.
   Dark mode: counts, the filled "Read the deal" button's brand edge GONE (the
   read starts itself now), and the status ruby text NEW on Document — the
   reading's refusal said where the reader looks (this stage's Jambo cannot
   answer). Every Ink Wash claim passed before and after.
   RE-RECORDED 13 Oct 2026 (third), OWNER-ASKED ("Yes, update the record"):
   Home's panel lost its Overview tab, and the company view's summary, ribbon
   and key gave way to three filters. Audited first as a set difference: only
   the Document screen moved, and only in counts (light: 13px 245→243, 10px
   5→4, 15px 5→4; dark: a handful fewer of the same colours). No key new, none
   gone. Every Ink Wash claim passed before and after.
   RE-RECORDED 13 Oct 2026 (fourth), OWNER-ASKED ("Yes, update the record"):
   the Negotiate page lost its Focus button and its Obligations and Risk scan
   squares, and gained Open workspace. Audited first as a set difference: only
   the Negotiate screen moved, and only in counts (light: 13px 269→257; dark:
   fewer of the same colours). No key new, none gone. Every Ink Wash claim
   passed before and after.
   RE-RECORDED 14 Oct 2026, OWNER-ASKED ("Yes, re-record it"): stage 5 of
   the one-page Home plan redrew five screens — Overview (two room tabs),
   Document, Signing (Jambo's Before you sign face beside the signing copy),
   History (the Board's view) and Negotiate (the Redlines face beside Home's
   paper). Audited first as a set difference: only those five moved; nothing
   new in light mode; the values new to the whole record are existing styles
   now seen on these screens — 11.5px (the panel's pill, .pd-pill), the navy
   theme's accent-400 rgb(91,130,207) on Jambo's suggestion chips in dark, and
   the Board's own dark text inks on History. Gone: the Negotiate page's paper
   frame and kicker. Every Ink Wash claim passed before and after.
   RE-RECORDED 15 Oct 2026 (the overnight run, step 8) WITHOUT THE OWNER'S
   YES — flagged for his morning summary, to be undone with
   `git checkout <the step 8 parent> -- test/chromium/ink-wash-baseline.json`
   if he says no. Not a palette change: the History screen gained the Side
   switch the step 8 work order draws (All sides · Ours · Theirs, the owner's
   "History gets filtering on sides"), three more buttons on that screen.
   Audited first as a set difference against the 14 Oct record: only the
   History screen moved; no colour or size new or gone in any appearance,
   only counts (green-light 12px 77→80 and 13px 271→272; in dark the same
   colours a few more times). Every other screen and pop-up byte for byte.
   RE-RECORDED 15 Oct 2026 (second), OWNER-ASKED ("Yes, update it"): the
   seven fixes and Amend beside the paper. The contract's views went, so the
   History door opens the Board's contract card; the paper's ⋯ and the
   Redlines face's foot went; the panel gained the Menu tab. Audited first as
   a set difference: only Document, Signing, History and Negotiate moved. In
   light mode one size new to History (16px, the Board's own) and Negotiate's
   12.5px gone (the foot). In dark the values new to History are the Board's
   own dark palette (--hb-gw 56,205,184, its ink and line rgba, the amber
   242,178,76), seen there because History now opens on the Board; gone: the
   ⋯ icon's fill on three screens. No colour new to the product.
     node test/chromium/ink-wash-verify.js          (check)
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, CAL_TODAY_ASIDE } = require('../helpers');

const BASELINE = path.join(__dirname, 'ink-wash-baseline.json');
const OUT = path.join(__dirname, 'shots', 'ink-wash');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SAVE = process.argv.includes('--save');
const pause = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
  ok ? pass++ : fail++;
};

/* THE TABLE IN THE WORK ORDER, as the browser reports it. */
const INK = {
  green: { text: 'rgb(3, 46, 42)', n600: 'rgb(58, 95, 90)', n500: 'rgb(58, 95, 90)', n400: 'rgb(84, 121, 116)',
           n300: 'rgb(190, 214, 209)', n200: 'rgb(220, 233, 230)', n100: 'rgb(240, 245, 244)', bg: 'rgb(244, 248, 247)' },
  navy:  { text: 'rgb(9, 25, 56)', n600: 'rgb(55, 74, 109)', n500: 'rgb(55, 74, 109)', n400: 'rgb(80, 100, 138)',
           n300: 'rgb(186, 200, 228)', n200: 'rgb(218, 226, 241)', n100: 'rgb(238, 242, 249)', bg: 'rgb(243, 246, 251)' },
};

/* ---------- the probes, run in the page ---------- */
const CENSUS = ([sel, props]) => {
  const out = {};
  const els = [];
  for (const root of document.querySelectorAll(sel)) { els.push(root, ...root.querySelectorAll('*')); }
  for (const el of new Set(els)) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    for (const p of props) { const v = s[p]; if (!v || v === 'none') continue;
      const k = p + ' ' + v; out[k] = (out[k] || 0) + 1; }
  }
  return out;
};
/* A colour is GREY when it is opaque enough to be seen as itself, is neither
   white nor near-black, and carries almost no hue (HSL saturation under 12%).
   Today's ramp measures 4–9%; every Ink Wash value measures 17% or more. */
const GREYS = () => {
  const parse = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const n = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1]; };
  const grey = c => { if (!c || c[3] < .5) return false;
    const mx = Math.max(c[0], c[1], c[2]) / 255, mn = Math.min(c[0], c[1], c[2]) / 255, l = (mx + mn) / 2;
    if (l < .06 || l > .975) return false;
    const sat = mx === mn ? 0 : (l > .5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn));
    return sat < .12; };
  const hits = {};
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.pg-sheet, #ig-canvas.rl-paper, .tpl-pf-sheet, svg, script, style, #theme-menu, [data-brand-pick], .hati-ref, .rl-card button, .rl-unsent-go, .rl-decisions-go, #nego-send, [data-ink-exempt]')) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    let own = ''; for (const n of el.childNodes) if (n.nodeType === 3) own += n.nodeValue;
    const props = [['backgroundColor', 1]];
    if (own.trim()) props.push(['color', 1]);
    if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none') props.push(['borderTopColor', 1]);
    if (parseFloat(s.borderBottomWidth) > 0 && s.borderBottomStyle !== 'none') props.push(['borderBottomColor', 1]);
    for (const [p] of props) { const v = s[p]; if (grey(parse(v))) {
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      const k = `${p} ${v} ${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}`;
      hits[k] = (hits[k] || 0) + 1; } }
  }
  return hits;
};
const CAPS = () => {
  const hits = {};
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.pg-sheet, #ig-canvas.rl-paper, .tpl-pf-sheet, svg, script, style, .hati-ref, kbd, [data-ink-exempt]')) continue;
    let own = ''; for (const n of el.childNodes) if (n.nodeType === 3) own += n.nodeValue;
    if (!/[a-z]/i.test(own)) continue;
    const s = getComputedStyle(el);
    if (s.textTransform !== 'uppercase') continue;
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const k = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''} "${own.trim().slice(0, 24)}"`;
    hits[k] = (hits[k] || 0) + 1;
  }
  return hits;
};

/* THE PAPER: every .pg-sheet and what is in it, except the GAP between pages,
   which shows the desk and follows it — and Home's Document paper, which is
   the same paper drawn without the page-maker's sheet (#ig-canvas.rl-paper,
   Redlined and Clean; added 11 Oct 2026 when the Document tab's paper moved
   there) — and Our paper's book, which draws the chosen template's own paper
   (.tpl-pf-sheet; added 18 Oct 2026, round 21, "Paper first"). */
const PAPER = props => {
  const out = {};
  for (const root of document.querySelectorAll('.pg-sheet, #ig-canvas.rl-paper, .tpl-pf-sheet')) for (const el of [root, ...root.querySelectorAll('*')]) {
    if (el.closest('.pg-gap')) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    for (const p of props) { const v = s[p]; if (!v || v === 'none') continue; const k = p + ' ' + v; out[k] = (out[k] || 0) + 1; }
  }
  return out;
};
const COLOUR_PROPS = ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'textDecorationColor', 'fill', 'stroke'];
const BTN_PROPS = ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor'];
const STATUS_TOKENS = ['amber', 'green', 'ruby'].flatMap(h => ['bg', 'fg', 'dot', 'line'].map(k => `--st-${h}-${k}`));

const diff = (a, b) => {
  const out = [];
  for (const k of new Set([...Object.keys(a || {}), ...Object.keys(b || {})]))
    if ((a || {})[k] !== (b || {})[k]) out.push(`${k}: ${(a || {})[k] || 0} → ${(b || {})[k] || 0}`);
  return out;
};

/* STEP 7 (the overnight work order): the Contracts page is Home's Contracts
   place; this check reads its List (regPlaceSet({ show: 'list' }) before
   setView('register'), which lands there). */
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h);
  /* THIS QUARTER'S ACCESS REVIEW IS DONE HERE (17 Oct 2026, the quarterly
     access review): an admin whose review is due carries one more count on
     the bell on every page — a headcount, not a colour. The census measures
     the pages it was recorded on, so the workspace has done its review; the
     record itself is not touched. */
  for (const u of Object.values(W.users))
    await W.admin.json('/api/access-review/mark', { method: 'POST', body: { userId: u.id, verdict: 'keep' } });
  await W.admin.json('/api/access-review/done', { method: 'POST', body: {} });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => check('no page error', false, e.message));
  const rec = {};
  const base = SAVE ? null : JSON.parse(fs.readFileSync(BASELINE, 'utf8'));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(500);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    /* where Sign in is pressed is where the pointer stays: kept, so History
       can be measured with the pointer parked and then put back (below) */
    const goBox = await page.locator('#li-go').boundingBox();
    const SIGNED_AT = goBox ? { x: goBox.x + goBox.width / 2, y: goBox.y + goBox.height / 2 } : null;
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length > 0);
    await pause(1500);
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });

    /* One contract with a change of ours AND an ask of theirs, so the redline
       column draws both rows: Edit · Send · Discard and Accept · Reject · Counter. */
    const cid = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      negoInit(c);
      const cl = negoClauseList(c);
      const bump = html => html.replace(/\b(\d[\d,]*)\b/, m => String(Number(String(m).replace(/,/g, '')) + 500));
      await negoEditClause(c, cl[0].clauseId, bump(cl[0].bodyHtml), { author: 'Amina Otieno', side: 'owner', why: 'Volumes.' });
      const other = cl.find((x, i) => i > 0 && /\d/.test(x.bodyHtml)) || cl[1];
      await negoEditClause(c, other.clauseId, bump(other.bodyHtml), { author: 'Henry M.', side: 'counterparty', why: 'Their ask.' });
      return c.id;
    });

    const SCREENS = [
      /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): 'signing',
         'history' and 'negotiate' are drawn on Home now (below), and each
         leaves Home turned to its own face — the Board's History view, Jambo's
         Before you sign and Redlines faces, the paper Redlined while the last
         is open. So Home is put back as the census always saw it, as the
         'document' visit's face was put back before: the face it had, Your
         book on the Board, Jambo's faces put away and the panel on the tab
         the Document door leaves it on. Nothing to put back on the first round. */
      ['home',        () => { if (window.__hbFaceWas) {
        if (window.pdRedAway) pdRedAway(); if (window.pdSignAway) pdSignAway(); if (window.pdFillAway) pdFillAway();
        if (window.hbCvSet) hbCvSet('book', null); if (window.pdSetTab) pdSetTab('doc');
        hbS().face = window.__hbFaceWas; hbSave(); delete window.__hbFaceWas; }
        setView('dashboard'); }],
      ['contracts',   () => (regPlaceSet({ show: 'list' }), setView('register'))],
      ['obligations', () => setView('obligations')],
      ['calendar',    () => setView('calendar')],
      ['ourpaper',    () => setView('templates')],
      ['settings',    () => setView('team')],
      ['overview',    id => { openWorkspace(id, { room: true }); roomGoTab(getContract(id), 'terms'); }],
      /* RE-POINTED 11 Oct 2026: the room's Document tab is gone (owner). The
         paper it drew is read on Home's Document now, so 'document' measures
         that; Home's face is put back afterwards so the next 'home' census
         sees the face it always saw. 'signing' used the key 'signing', which
         is no tab: it drew the Document tab's paper by fall-through, and with
         that tab gone it drew none — it measures the real Signing tab
         ('sign') now, where the signing copy lives. */
      ['document',    id => { window.__hbFaceWas = hbFace(); pdOpenOnHome(id, 'doc'); }],
      /* RE-POINTED 14 Oct 2026 (stage 5): the room's Signing and History tabs
         went home, by their own doors — 'signing' is Jambo's Before you sign
         face beside the signing copy on Home's paper, 'history' the Board's
         History view; 'negotiate' is Jambo's Redlines face beside Home's paper
         (every door onto Negotiate lands there). Home's face is put back at
         the next round's 'home', above. */
      ['signing',     id => { openWorkspace(id, { room: true }); roomGoTab(getContract(id), 'sign'); }],
      ['history',     id => { openWorkspace(id, { room: true }); roomGoTab(getContract(id), 'history'); }],
      ['negotiate',   id => openRedlineWorkbench(id)],
    ];
    /* THE POP-UPS the owner named: a dialog (with a danger button), the one
       panel (alerts), a toast. Each opened over the Contracts page. */
    const POPUPS = [
      ['dialog', () => { (regPlaceSet({ show: 'list' }), setView('register')); confirmDialog({ title: 'Delete this draft?', message: 'It cannot be brought back.', confirmLabel: 'Delete', danger: true }); }],
      ['alerts', () => { (regPlaceSet({ show: 'list' }), setView('register')); const b = document.querySelector('#hdr-notify'); if (b) b.click(); }],
      ['toast',  () => { (regPlaceSet({ show: 'list' }), setView('register')); toast('Saved', 'ok'); }],
    ];
    const closeLayers = async () => { await page.keyboard.press('Escape'); await pause(150); await page.keyboard.press('Escape'); await pause(150);
      await page.evaluate(() => { document.querySelectorAll('.modal-bg, [data-modal-bg]').forEach(n => n.remove()); window.toastsClear && toastsClear(); }); };

    const APPEAR = [['green', false], ['green', true], ['navy', false], ['navy', true]];
    for (const [brand, dark] of APPEAR) {
      const tag = `${brand}-${dark ? 'dark' : 'light'}`;
      await page.evaluate(([b, d]) => { setBrand(b); setDark(d); }, [brand, dark]);
      await pause(500);
      rec[tag] = { screens: {}, popups: {} };
      rec[tag].status = await page.evaluate(names => { const s = getComputedStyle(document.documentElement);
        return Object.fromEntries(names.map(n => [n, s.getPropertyValue(n).trim()])); }, STATUS_TOKENS);
      rec[tag].tokens = await page.evaluate(() => { const probe = document.createElement('div'); document.body.append(probe);
        const read = v => { probe.style.color = `var(${v})`; return getComputedStyle(probe).color; };
        const out = { text: read('--color-text'), n600: read('--color-neutral-600'), n500: read('--color-neutral-500'),
          n400: read('--color-neutral-400'), n300: read('--color-neutral-300'), n200: read('--color-neutral-200'),
          n100: read('--color-neutral-100'), bg: read('--color-bg') };
        probe.remove(); return out; });

      for (const [name, go] of [...SCREENS, ...POPUPS]) {
        const isPop = POPUPS.some(x => x[0] === name);
        await page.evaluate(`(${go.toString()})(${JSON.stringify(cid)})`);
        /* RE-POINTED 14 Oct 2026 (stage 5): each twin on Home waited for, by this contract's id */
        if (name === 'negotiate') await page.waitForFunction(id => !!document.querySelector(`#pd-redface [data-pd-rf="${id}"]`) && !!document.querySelector('#ig-canvas'), cid, { timeout: 10000 }).catch(() => {});
        if (name === 'document') await page.waitForSelector('#ig-canvas', { timeout: 10000 }).catch(() => {});
        if (name === 'signing') await page.waitForFunction(id => !!document.querySelector(`#pd-signface .pd-sf[data-pd-sf="${id}"]`) && !!document.querySelector('#ig-paper .pg-sheet.pg-sign'), cid, { timeout: 10000 }).catch(() => {});
        if (name === 'history') await page.waitForFunction(id => { const b = document.querySelector(`#hb-cv-body[data-hb-cv="hist"][data-hb-cv-cid="${id}"]`); return !!b && !b.querySelector('.hb-cv-wait'); }, cid, { timeout: 10000 }).catch(() => {});
        /* HISTORY IS MEASURED WITH THE POINTER PARKED (18 Oct 2026): the pointer
           stays where Sign in was pressed, and on GitHub's fonts an event of
           History's two lanes sat under it and was measured in its hover
           colour (one background, surface → surface-2, red there and green
           here). Parked in the bar's empty corner for this screen only and put
           back after, so every other screen's recorded counts still hold. */
        if (name === 'history') await page.mouse.move(2, 2);
        await pause(name === 'home' ? 1400 : 800);
        /* The week's today marks are drawn on weekdays only, so they come out
           before any count is taken (CAL_TODAY_ASIDE); theme-tokens-verify
           checks their look on any day. */
        await page.evaluate(CAL_TODAY_ASIDE);
        const r = {};
        if (dark) r.all = await page.evaluate(CENSUS, ['body', COLOUR_PROPS]);
        r.paper = await page.evaluate(PAPER, [...COLOUR_PROPS, 'textTransform', 'letterSpacing']);
        if (name === 'negotiate') r.redlineButtons = await page.evaluate(CENSUS,
          ['.rl-card button, .rl-unsent-go, .rl-decisions-go, #nego-send', BTN_PROPS]);
        if (name === 'dialog') r.danger = await page.evaluate(CENSUS, ['#cf-ok, .ui-btn-danger', BTN_PROPS]);
        if (!dark && brand === 'green') r.sizes = await page.evaluate(CENSUS, ['body', ['fontSize']]);
        if (!dark) { r.greys = await page.evaluate(GREYS); r.caps = await page.evaluate(CAPS); }
        if (!SAVE && !dark) await page.screenshot({ path: path.join(OUT, `${tag}-${name}.png`) });
        (isPop ? rec[tag].popups : rec[tag].screens)[name] = r;
        if (name === 'history' && SIGNED_AT) await page.mouse.move(SIGNED_AT.x, SIGNED_AT.y);
        if (isPop) await closeLayers();
      }
    }

    if (SAVE) {
      for (const t of Object.values(rec)) for (const g of [t.screens, t.popups]) for (const r of Object.values(g)) { delete r.greys; delete r.caps; }
      fs.writeFileSync(BASELINE, JSON.stringify(rec, null, 1) + '\n');
      console.log('saved', BASELINE);
      return;
    }

    for (const [tag, now] of Object.entries(rec)) {
      const was = base[tag];
      const dark = tag.endsWith('dark'), brand = tag.split('-')[0];
      check(`${tag}: amber, green and ruby status colours are as before`, !diff(was.status, now.status).length, diff(was.status, now.status));
      if (dark) check(`${tag}: the ramp is as before`, !diff(was.tokens, now.tokens).length, diff(was.tokens, now.tokens));
      else check(`${tag}: the ramp is Ink Wash`, !diff(INK[brand], now.tokens).length, diff(INK[brand], now.tokens));
      for (const kind of ['screens', 'popups']) for (const [name, r] of Object.entries(now[kind])) {
        const w = was[kind][name] || {};
        if (dark) { const d = diff(w.all, r.all); check(`${tag} ${name}: every colour as before (dark stays as today)`, !d.length, d.slice(0, 8)); }
        { const d = diff(w.paper, r.paper); check(`${tag} ${name}: the contract paper is as before`, !d.length, d.slice(0, 8)); }
        if (r.redlineButtons) { const d = diff(w.redlineButtons, r.redlineButtons);
          check(`${tag} ${name}: the redline cards' buttons are as before`, !d.length && Object.keys(r.redlineButtons).length > 0, d.slice(0, 8)); }
        if (r.danger) { const d = diff(w.danger, r.danger);
          check(`${tag} ${name}: the danger button is as before`, !d.length && Object.keys(r.danger).length > 0, d.slice(0, 8)); }
        if (r.sizes) { const d = diff(w.sizes, r.sizes); check(`${tag} ${name}: no text size moved`, !d.length, d.slice(0, 8)); }
        if (r.greys) { const k = Object.keys(r.greys); check(`${tag} ${name}: no grey left`, !k.length, k.slice(0, 12)); }
        if (r.caps) { const k = Object.keys(r.caps); check(`${tag} ${name}: no header or label in capitals`, !k.length, k.slice(0, 12)); }
      }
    }
  } catch (e) {
    check('the run finished', false, e && e.stack || String(e));
  } finally {
    await browser.close();
    await h.stop();
    if (!SAVE) { console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0; }
  }
})();
