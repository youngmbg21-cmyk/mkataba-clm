/* F349 — NINE OFF FIVE IMAGES (Young ruled 21 Sep 2026)
   ========================================================================
   *"these cards ... are still not the same size. Make them the same and not
   big either. Image 2, the open fields does not tell you how many fields are
   still open. And the standard check does not have a door to the panel for
   playbook review. I also feel that there should be a mandatory option to
   press a button and run the brief again ... and the brief appears from the
   panel right after it runs. This is still not working [Copilot repeating the
   clause name]. Image 3, I should ne able to expand the window to read better.
   With regards to prepared redlines, if a clause is missing ... then a new
   clause from the playbook can be added ... But if there is a clause and it
   does not truly meet the standards you want, then add the copilot version
   which adjusts or redlines a clause ... Image 4, the drop downs look clunky
   and do not match the soft corners of Hati. Image 5, the bars should be
   slightly thinner like in the artifact."*

   Every claim here was proved red at the parent. The painted halves — a card's
   measured height, a menu's painted corner, the bar's painted height — are in
   nine-off-five-images-verify, because a token read out of the source is not a
   pixel on a page. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
/* Comments are prose. A sweep that asks "does the code call this" has to read
   code — the lesson this file's neighbours paid for twice in one week. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

const WIZ  = read('js/wizard.js');
const CSS  = read('index.html');
const TRI  = read('js/triage.js');
const CT   = read('js/views/contract.js');
const NEG  = read('js/views/negotiation.js');
const PB   = read('js/playbook.js');
const CE   = read('js/views/clauseeditor.js');
const CORE = read('js/core.js');
const CAL  = read('js/views/calendar.js');
const REG  = read('js/views/register.js');
const I18N = read('js/i18n.js');

/* ── (1) EVERY LINE OF A NEW AGREEMENT CARD IS RESERVED ──
   MEASURED at the parent: 103px against 121px on one screen. The DESCRIPTION
   slot was already reserved (21 Sep) and doing its job; what differed was the
   NAME — a long one wrapped to two lines, and a grid stretches every cell in a
   row to the tallest. So the reserve is not a property of one line: a card
   whose height must not vary has to reserve all of them. */
test('F349 (1) — the New agreement card reserves every line it draws', async t => {
  /* REVERSED IN PLACE 22 Sep 2026 — Young chose proposal C, the cards became
     a rail of rows, and with no grid there is nothing to stretch a row to a
     sibling's height. The reasoning above is kept whole because it is what
     makes that safe. What survives is the part that was never about the grid:
     a line is CUT rather than wrapped, and the whole of it rides one hover
     built by one function. */
  await t.test('(1a) the row\'s name takes one line and is cut', () => {
    const r = /\.na-pick-n\{[^}]*\}/.exec(CSS);
    assert.ok(r, '.na-pick-n has a rule of its own');
    assert.match(r[0], /white-space:nowrap/);
    assert.match(r[0], /text-overflow:ellipsis/);
  });
  await t.test('(1b) so does its figure line', () => {
    const r = /\.na-pick-m\{[^}]*\}/.exec(CSS)[0];
    assert.match(r, /white-space:nowrap/);
    assert.match(r, /text-overflow:ellipsis/);
    assert.match(r, /font-family:var\(--font-mono\)/, 'figures are data, and wear the figure face');
  });
  await t.test('(1c) and no card rule survives to reserve anything', () => {
    /* READ CODE, NOT PROSE — the standing lesson. The note that says those
       rules are gone names them, so the comments come off first. */
    const css = strip(CSS);
    assert.ok(!/\.na-door/.test(css) && !/\.na-chip/.test(css), 'the card and chip rules are gone, not stubbed');
  });
  await t.test('(1d) a cut is not a silent trim — the whole of each rides one hover', () => {
    assert.match(WIZ, /function naCardTitle\(r\)\{/);
    /* ONE BUILDER, AND NOW FOR ALL THREE SHELVES: the chip used to carry a
       different hover from the card's, which is exactly the drift two
       builders for one act produce. */
    assert.match(strip(WIZ), /const pickRow=r=>\{ const meta=\[r\.go\|\|'', r\.stream\|\|''\]\.filter\(Boolean\)\.join\(' · '\), hint=naCardTitle\(r\);/);
    /* ASKED ONCE, BY THE ONE BUILDER — counted inside openNewAgreement, since
       naCardTitle's own definition names the same argument. */
    const na = strip(WIZ).slice(strip(WIZ).indexOf('function openNewAgreement'));
    assert.equal((na.match(/naCardTitle\(r\)/g) || []).length, 1, 'one asker');
    assert.equal((na.match(/const pickRow=/g) || []).length, 1, 'and one row builder');
    assert.match(WIZ, /naCardSub,naCardHint,naCardTitle/, 'published (the ES-module rule)');
  });
  await t.test('(1e) [wall] it carries the name, the shown sentence and the raw one', () => {
    const fn = /function naCardTitle\(r\)\{[\s\S]*?\n\}/.exec(WIZ)[0];
    assert.match(fn, /naCardSub\(r\)/, 'what the face shows');
    assert.match(fn, /r\.name/);
    assert.match(fn, /filter\(Boolean\)/, 'an absent part is left out rather than printed empty');
  });
});

/* ── (2) THE ARRIVAL STRIP'S NUMBER ──
   *"the open fields does not tell you how many fields are still open."* It
   could not: a `none` state forced the count to null, so the one tile with a
   number worth reading drew a steel dash and buried its total at the end of a
   detail the sheet then cut to two lines. */
test('F349 (2) — a nothing-to-do tile may still carry a number', async t => {
  await t.test('(2a) only `working` suppresses a count now', () => {
    const add = /const add = \(key, detail, count, live, none\) => \{[\s\S]*?\n  \};/.exec(TRI)[0];
    assert.match(strip(add), /count: \(working \|\| count == null\) \? null : count/);
    assert.ok(!/count: \(working \|\| nothing \|\| count == null\)/.test(strip(add)),
      'the `nothing` guard is what hid it');
  });
  await t.test('(2b) the fill tile counts what is OPEN where its head says open', () => {
    assert.match(strip(TRI), /\(fillNone === 'form' && openNames\.length\) \? openNames\.length/);
  });
  await t.test('(2c) and the detail names rather than tallies — one number per tile', () => {
    /* "— 16 more" beside a chip reading 19 is two numbers about one thing. */
    const fill = /add\('fill',[\s\S]*?fillNone\);/.exec(TRI)[0];
    const open = /\(fillNone === 'form' && openNames\.length\)[\s\S]*?: fillNone/.exec(strip(fill))[0];
    assert.ok(!/tri_fill_left/.test(open), 'the open branch no longer prints a second count');
    /* the FILLED branch keeps its own tail: there the chip counts what was
       filled and the tail says what was left, which are two real facts. */
    assert.match(strip(fill), /tri_fill_left/);
  });
  await t.test('(2d) the strip asks the number before the three old states', () => {
    const s = strip(CT);
    assert.match(s, /const tone=x\.working\?'is-busy'\s*\n?\s*:\(\(x\.count!=null&&x\.count>0\)\?'is-warn'/);
    assert.match(s, /const mark=x\.working\?[^\n]*\n\s*:\(\(x\.count!=null&&x\.count>0\)\?String\(x\.count\)/);
  });
});

/* ── (3) THE STANDARDS TILE IS A DOOR ──
   The 20 Sep note ends "Standards would open the playbook panel ... on his
   word". This is that word. */
test('F349 (3) — the standards tile opens the playbook review', async t => {
  await t.test('(3a) doorFor names it, and only once the review ran', () => {
    const f = /const doorFor = x =>[\s\S]*?: '';/.exec(strip(CT))[0];
    assert.match(f, /x\.key==='playbook' && x\.ok\) \? 'playbook'/);
  });
  await t.test('(3b) and it presses the Checks card\'s own act, never a second one', () => {
    assert.match(strip(CT), /if\(go==='playbook'\)\{ openCheckPanel\(c,'playbook'\); return; \}/);
  });
  await t.test('(3c) its hover is a real key in both books', () => {
    assert.equal(I18N.split('tri_go_playbook:').length, 3);
  });
});

/* ── (4) THE RE-WRITTEN BRIEF IS PUT IN FRONT OF THE READER ──
   *"You need to see the new brief again especially if there have been
   redlines."* The press already re-wrote it; it did not show it. */
test('F349 (4) — running the brief again opens it', async t => {
  const h = /host\.querySelector\('\[data-sc-brief\]'\)\?\.addEventListener[\s\S]*?\n  \}\);/.exec(CT)[0];
  await t.test('(4a) the panel opens after the run', () => {
    assert.match(strip(h), /openCheckPanel\(c,'brief'\)/);
  });
  await t.test('(4b) [wall] only where one was really written', () => {
    /* `c._brief` still holds the OLD brief after a refusal — opening on that
       would show the very summary this press exists to replace. */
    assert.match(strip(h), /ok=!!\(await runContractBrief\(/);
    assert.match(strip(h), /if\(ok\) openCheckPanel/);
  });
  await t.test('(4c) and the row still holds a signature until the check is current', () => {
    const SC = read('js/signcheck.js');
    assert.match(strip(SC), /if \(row\.kind === 'brief' \|\| row\.kind === 'standards-read'/);
  });
});

/* ── (5) THE CLAUSE'S NAME COMES OFF WHERE THE DRAFT IS READ ──
   The 21 Sep fix called pbFitWording "the one place every proposal passes
   through". MEASURED: it is not. `it.draft` is the raw string and BOTH "Use
   Copilot's draft" presses file that. */
test('F349 (5) — the repeated heading is dropped at the one producer', async t => {
  await t.test('(5a) rlPlaybookProposals cleans the draft it publishes', () => {
    const s = strip(NEG);
    assert.match(s, /let draft = String\(\(v && v\.redline\) \|\| ''\)\.trim\(\);/);
    assert.match(s, /draft = String\(pbDropRepeatedHeading\(draft, cl\) \|\| ''\)\.trim\(\)/);
  });
  await t.test('(5b) on a LOCATED clause only — an add has no name to repeat', () => {
    assert.match(strip(NEG), /if \(draft && cl && window\.pbDropRepeatedHeading\)/);
  });
  await t.test('(5c) [wall] pbFitWording keeps its own call, for its other caller', () => {
    assert.match(strip(PB), /if\(draft\) draft = pbDropRepeatedHeading\(draft, cl\);/);
  });
  await t.test('(5d) the reading itself still refuses rather than guesses', () => {
    const fn = /function pbDropRepeatedHeading\(text, cl\)\{[\s\S]*?\n\}/.exec(PB)[0];
    assert.match(fn, /split\(' '\)\.filter\(Boolean\)\.length < 2/, 'never a one-word heading');
    assert.match(fn, /_pbHeadFold\(m\[1\]\) !== hf/, 'the WHOLE heading must match');
  });
});

/* ── (6)(7) A MISSING CLAUSE IS ADDED WHOLE; A PRESENT ONE IS ADJUSTED ──
   *"this avoids the current build where hati deletes an entire clause in its
   subclauses only to add a company standard which does not address other
   clauses that were deleted automatically."* */
test('F349 (6) — an unaddressed draft is not "the smallest change"', async t => {
  await t.test('(6a) pbFitWording refuses one that would lose unquoted blocks', () => {
    const fn = /function pbFitWording\(cl,v,preferred,draft\)\{[\s\S]*?\n\}/.exec(PB)[0];
    assert.match(strip(fn), /if\(pbUnquotedLoss\(body,v&&v\.quote,draft\)>0\) return null;/);
  });
  await t.test('(6b) [relation] it asks the WALL\'s own reading, never a second one', () => {
    /* One reading, two readers: the preview, the lead and the filing door
       cannot come to different answers about what would be lost. */
    assert.match(PB, /function pbUnquotedLoss\(bodyHtml,quote,newText\)\{/);
    const fn = /function pbFitWording\(cl,v,preferred,draft\)\{[\s\S]*?\n\}/.exec(PB)[0];
    assert.ok(!/blocks\.forEach/.test(strip(fn)), 'it does not count blocks for itself');
  });
  await t.test('(6c) [wall] a one-block clause is untouched — nothing else to lose', () => {
    const fn = /function pbUnquotedLoss\(bodyHtml,quote,newText\)\{[\s\S]*?\n\}/.exec(PB)[0];
    assert.match(fn, /blocks\.length<2\) return 0/);
  });
});
test('F349 (7) — on a clause we already have, a stand-alone clause never leads', async t => {
  const lead = /lead: fit \? fit\.text :[\s\S]*?risk:/.exec(NEG)[0];
  await t.test('(7a) an EDIT with no fit has no lead at all', () => {
    assert.match(lead, /\(landing === 'edit' && asked\) \? null/);
  });
  await t.test('(7a2) [wall] but only where the fitted reading could be asked', () => {
    /* "Nothing fits" over a reading nobody made is a guess — this codebase's
       own rule in reverse. A stage without js/playbook.js keeps the lead it
       always had; in the product that module is always loaded. */
    assert.match(NEG, /const asked = !!window\.pbFitWording;/);
    assert.match(NEG, /const fit = \(landing === 'edit' && asked\)/);
  });
  await t.test('(7b) [control] an ADD is byte-identical — the library\'s wording whole', () => {
    assert.match(lead, /\(preferred \|\| fallback \|\| draft\)/);
    assert.match(lead, /\(preferred \? 'standard' : \(fallback \? 'fallback' : 'draft'\)\)/);
  });
  await t.test('(7c) the review window says so instead of drawing a paste', () => {
    assert.match(strip(NEG), /\$\{!it\.lead\s*\n?\s*\? `<div[^`]*ng_pb_nofit/);
  });
  await t.test('(7d) and so does the clause editor\'s scan rail', () => {
    assert.match(strip(CE), /group === 'here' \? `<span class="nofit">/);
  });
  await t.test('(7e) the sentence is a real key in both books', () => {
    assert.equal(I18N.split('ng_pb_nofit:').length, 3);
  });
  await t.test('(7f) [wall] the batch still files the fitted wording or nothing', () => {
    assert.match(strip(NEG), /const words = it\.landing === 'edit'\s*\n?\s*\? String\(\(it\.fit && it\.fit\.text\) \|\| ''\)/);
  });
});

/* ── (8) THE PREVIEW OPENS ──
   *"I should ne able to expand the window to read better."* */
test('F349 (8) — the scan rail\'s preview can be opened', async t => {
  await t.test('(8a) the cap is the RESTING shape and a class drops it', () => {
    assert.match(CE, /\.ce-rule \.pv\{[^}]*max-height:120px/);
    assert.match(CE, /\.ce-rule \.pv\.is-open\{max-height:none/);
  });
  await t.test('(8b) the control is drawn by MEASUREMENT, never by a character count', () => {
    const fn = /function ceScanFitPv\(lane\)\{[\s\S]*?\n\}/.exec(CE)[0];
    assert.match(fn, /pv\.scrollHeight > pv\.clientHeight/);
    assert.match(fn, /classList\.add\('is-live'\)/);
    assert.match(CE, /\.ce-rule \.pv-more\{[^}]*display:none/, 'and hidden until it answers yes');
  });
  await t.test('(8c) asked where the rail lands, and nowhere else', () => {
    assert.match(strip(CE), /lane\.innerHTML = ceScanHtml\(\); lane\.scrollTop = 0; ceScanFitPv\(lane\);/);
  });
  await t.test('(8d) the press is a class flip, never a repaint', () => {
    const fn = /function ceScanPvToggle\(i\)\{[\s\S]*?\n\}/.exec(CE)[0];
    assert.match(fn, /classList\.toggle\('is-open'\)/);
    assert.ok(!/ceRenderLane\(\)/.test(fn), 'a repaint would lose the reader\'s place in the rail');
    assert.match(strip(CE), /hit\('\[data-ce-pv\]'\)/);
  });
  await t.test('(8e) and the word turns round, from both books', () => {
    assert.equal(I18N.split('ce_pv_more:').length, 3);
    assert.equal(I18N.split('ce_pv_less:').length, 3);
  });
});

/* ── (9) A DROPDOWN THAT WEARS HaTi'S OWN CORNERS ── */
test('F349 (9) — the filter chips drop HaTi\'s own list', async t => {
  await t.test('(9a) the helper exists and is published', () => {
    assert.match(CORE, /function selectMenuWire\(root, selector\)\{/);
    assert.match(CORE, /selectMenuWire,selectMenuOpen,selectMenuClose,selectMenuShowing/);
  });
  await t.test('(9b) [wall] the <select> is still the truth, and its own event is what fires', () => {
    const fn = /function selectMenuOpen\(sel\)\{[\s\S]*?\n\}/.exec(CORE)[0];
    assert.match(strip(fn), /sel\.selectedIndex = i;/);
    assert.match(strip(fn), /sel\.dispatchEvent\(new Event\('change', \{ bubbles: true \}\)\)/);
  });
  await t.test('(9c) [wall] the keyboard is left to the select — no key handling but Escape', () => {
    const arm = /function _selMenuArmDoc\(\)\{[\s\S]*?\n\}/.exec(CORE)[0];
    assert.match(arm, /ev\.key === 'Escape'/);
    assert.ok(!/ArrowDown|ArrowUp/.test(CORE.slice(CORE.indexOf('function selectMenuOpen'),
      CORE.indexOf('const DLG_W'))), 'rebuilding arrow keys in a div is how a control loses behaviour');
  });
  await t.test('(9d) it is mounted on the body, so a sticky band cannot clip it', () => {
    const fn = /function selectMenuOpen\(sel\)\{[\s\S]*?\n\}/.exec(CORE)[0];
    assert.match(fn, /document\.body\.appendChild\(box\)/);
    assert.match(CSS, /\.hati-selmenu\{position:fixed/);
  });
  await t.test('(9e) the press that opens it closes it — the owner\'s standing rule', () => {
    const fn = /function selectMenuOpen\(sel\)\{[\s\S]*?\n\}/.exec(CORE)[0];
    assert.match(strip(fn), /const same = _selMenuFor === sel;/);
    assert.match(strip(fn), /if \(same\) return false;/);
  });
  await t.test('(9f) bound once per element, and the system pane never opens', () => {
    const fn = /function selectMenuWire\(root, selector\)\{[\s\S]*?\n\}/.exec(CORE)[0];
    assert.match(fn, /dataset\.selMenuBound/);
    assert.match(strip(fn), /ev\.preventDefault\(\)/);
    /* POINTERDOWN, because a touch synthesises a mouse event only AFTER the
       browser has decided what the tap does — preventing the mouse one can
       leave the system picker already on its way up. The product's own
       vocabulary: the layout dividers are built on pointer events. */
    assert.match(strip(fn), /addEventListener\('pointerdown'/);
    assert.ok(!/addEventListener\('mousedown'/.test(strip(fn)));
  });
  /* ---- RE-POINTED IN PLACE 21 Sep 2026: THE BAR IS NO LONGER ITS OWN ROOT ----
     This pinned the ONE call that existed the day the menu was built, on the
     Contracts filter bar. The owner then asked for HaTi's list everywhere
     ("make all drop downs in the platform similar to the ones in the contract
     and negotiation pages"), so the wire is armed ONCE on the document's body
     and is delegated — the bar is covered by that, and a second root over the
     same control would answer one press twice and open the menu twice.
     The claim that survives is the one this was making: the bar's chips really
     do drop HaTi's list. It is asked as the RELATION — the bar is inside the
     swept root and its selects are not among the ones that stay native —
     rather than as the name of a call that has moved. */
  await t.test('(9g) the filter bar is covered by the platform-wide sweep', () => {
    assert.ok(!/selectMenuWire\(fbar/.test(strip(REG)), 'the bar is not a second root');
    assert.match(strip(CORE), /function selectMenuSweep\(root\)\{/, 'there is one sweep');
    assert.match(strip(CORE), /try\{ selectMenuSweep\(\); \}catch\(_\)\{\}/, 'armed once, at the start');
    /* A filter chip's select carries none of the attributes that stay native,
       so the swept selector reaches it. */
    assert.match(strip(REG), /class="reg-chip-sel"/, "and the chip's control is an ordinary select");
    assert.ok(!/reg-chip-sel[^>]*multiple/.test(REG) && !/reg-chip-sel[^>]*\bsize=/.test(REG)
      && !/reg-chip-sel[^>]*data-native/.test(REG), 'carrying nothing that opts out');
  });
  await t.test('(9h) [relation] the menu wears the platform\'s card corner, not a number', () => {
    const r = /\.hati-selmenu\{[^}]*\}/.exec(CSS)[0];
    assert.match(r, /border-radius:var\(--radius-lg\)/);
    const row = /\.hati-selmenu-row\{[^}]*\}/.exec(CSS)[0];
    assert.match(row, /border-radius:var\(--radius\)/);
    assert.match(row, /height:var\(--ctl-h\)/);
    assert.match(CSS, /\.hati-selmenu-row\.on\{background:var\(--accent-fill\)/);
  });
});

/* ── (10) THE HORIZON BAR ── */
test('F349 (10) — the Horizon bar is the artifact\'s weight', async t => {
  await t.test('(10a) 8px, as the artifact draws it', () => {
    const r = /\.cal-hz-bar\{[^}]*\}/.exec(CAL)[0];
    assert.match(r, /height:8px/);
  });
  await t.test('(10b) [relation] and its centre line did not move', () => {
    /* The expiry tick and the notice nip are already placed against it. */
    const bar = /\.cal-hz-bar\{[^}]*\}/.exec(CAL)[0];
    const top = Number(/top:(\d+)px/.exec(bar)[1]);
    const h = Number(/height:(\d+)px/.exec(bar)[1]);
    const end = /\.cal-hz-end\{[^}]*\}/.exec(CAL)[0];
    const eTop = Number(/top:(\d+)px/.exec(end)[1]);
    const eH = Number(/height:(\d+)px/.exec(end)[1]);
    assert.equal(top + h / 2, eTop + eH / 2);
  });
  await t.test('(10c) [control] it is still a pill, cut where it runs past the ruler', () => {
    assert.match(CAL, /\.cal-hz-bar\{[^}]*border-radius:999px/);
    assert.match(CAL, /\.cal-hz-bar\.is-beyond\{border-radius:999px 0 0 999px\}/);
  });
});
