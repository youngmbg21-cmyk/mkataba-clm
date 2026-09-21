/* f341 — seven off four screenshots (Young, 20 Sep 2026)
   =======================================================
   *"Image 1, go to wording is not working. Image 2, Delete the Playbook Review
   Symbol button then move the Chat Symbol from the top bar and one to be next
   to the more button. After this, there should be an alert that Pops up on the
   chat, obligations and Copilot Scan Buttons alerting on the numbers … Image
   3, the brief Witten and obligations should have Doors to the respective
   cards. Also make sure the Field actually Field the contracts correctly.
   Image 4, the start and end Dates entry Fields should be the same size as the
   other Field."*

   THREE OF THE SEVEN WERE INVISIBLE IN THE SOURCE and only showed up when the
   control was pressed: a walk that names one page's canvas, a listener bound
   to a node the next render throws away, and a tile reporting silence as
   success. Every claim below was proved red against the commit before the fix;
   the handful that are named CONTROLS say so on the line.

   THE PIXEL HALVES ARE NOT HERE. A badge that is drawn, a tile that is a
   press, a date box that overflows its column — those are browser
   measurements and belong in a real browser. What is here is the declaration
   and the reading that make each one true. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (_) { return ''; } };
/* COMMENTS ARE PROSE. Every note in this codebase quotes the defect it fixed,
   so a sweep reading a file whole finds the very shape it is banning — the
   standing lesson, paid for again on 19 Sep. */
const CODE = f => SRC(f).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

const AI = SRC('js/ai.js');
const AI_CODE = CODE('js/ai.js');
const CONTRACT = SRC('js/views/contract.js');
const CONTRACT_CODE = CODE('js/views/contract.js');
const NEGO_CODE = CODE('js/views/negotiation.js');
const APP_CODE = CODE('js/app.js');
const BLANKS = SRC('js/blanks.js');
const TRIAGE_CODE = CODE('js/triage.js');
const HTML = SRC('index.html');
const I18N = SRC('js/i18n.js');
const COMPONENTS = SRC('js/components.js');

/* PIN THE REGION, NOT A BYTE COUNT — this rulebook's own lesson, paid three
   times already (f213's slice, f277's painter claim, f273's 900 characters).
   A function's own boundary is the region; everything read here is written at
   the top level of its file. */
const fnBody = (src, name) => {
  const at = src.indexOf(`function ${name}(`);
  if (at < 0) return '';
  const end = src.indexOf('\nfunction ', at + 10);
  return src.slice(at, end < 0 ? src.length : end);
};

/* ============================================================
   1 — "GO TO THE WORDING" LANDS ON WHICHEVER PAGE IS OPEN
   ============================================================
   MEASURED: the press works on the Document tab and does nothing on the
   Negotiate page. Every walk read `#doc-canvas` by name; that element is drawn
   by ONE surface, and the three check buttons that open this panel are drawn
   on the OTHER one. */
describe('f341 (1) — the scan walk asks which canvas is on screen', () => {
  test('there is one reading, and it names both surfaces', () => {
    const b = fnBody(AI, 'scanCanvas');
    assert.ok(b, 'scanCanvas exists');
    assert.match(b, /doc-canvas/, 'the Document tab’s article');
    assert.match(b, /rl-doc/, 'and the Negotiate page’s own sheet');
  });

  test('it is published, so another module can ask it', () => {
    /* f232 is the net: a name missing from the assign list is unreachable, and
       every caller guarded on `window.foo && …` silently takes its fallback. */
    assert.match(AI, /Object\.assign\(window,\s*\{[\s\S]*?scanCanvas/, 'on the export list');
  });

  test('the three walks ask it instead of naming an element', () => {
    for (const fn of ['clearQuoteMarks', 'scrollToQuote', 'scanGoTo']) {
      const b = CODE('js/ai.js').slice(AI_CODE.indexOf(`function ${fn}(`));
      const region = b.slice(0, b.indexOf('\nfunction ', 10));
      assert.match(region, /scanCanvas\(\)/, `${fn} asks the reading`);
      assert.ok(!/getElementById\('doc-canvas'\)/.test(region),
        `${fn} no longer names the Document tab’s element`);
      assert.ok(!/querySelector\(['"`]#doc-canvas /.test(region),
        `${fn} no longer scopes a query to it either`);
    }
  });

  test('the anchor fallback is asked INSIDE the root, never as #doc-canvas …', () => {
    const b = fnBody(AI, 'scanGoTo');
    assert.match(b, /root\.querySelector\(`\[data-anchor="\$\{anchor\}"\]`\)/,
      'the hint, inside whichever canvas is up');
    assert.ok(!/#doc-canvas \[data-anchor/.test(b),
      'and not the one-page selector that could only ever answer on the Document tab');
  });

  test('and it knows the Negotiate page’s own limb', () => {
    /* That sheet carries no [data-anchor] at all, so without this the walk
       there would always fall through to the whole document. */
    assert.match(fnBody(AI, 'scanGoTo'), /rl-clause\[data-clause-id=/,
      'a clause is a landing place on that page');
  });

  test('a refusal carries its way forward on the same screen', () => {
    const b = fnBody(AI, 'scanGoTo');
    assert.match(b, /if\(!root\)\{[\s\S]*?toast\(i18t\('sc_goto_no_doc'\)/,
      'no canvas is SAID, never a silent false');
    for (const book of ['sc_goto_no_doc']) {
      assert.equal((I18N.match(new RegExp(`\\b${book}:`, 'g')) || []).length, 2,
        `${book} is in both books`);
    }
  });

  test('the flash pane is asked of the element, not named', () => {
    /* `#doc-scroll` is the Document tab’s scroller and the Negotiate page
       scrolls in `.nego-scroll`. Named, `pane` was null there — and a null
       pane made `small` true unconditionally, which would flash the WHOLE
       sheet whenever the walk fell through to the root. */
    const b = fnBody(AI, 'scanGoTo');
    assert.match(b, /closest\('#doc-scroll, \.nego-scroll'\)/, 'asked of the node');
    assert.match(b, /const small=!!pane &&/,
      'and no pane means no flash, rather than flashing everything');
  });
});

/* ============================================================
   2 — ONE DOOR ONTO THE PLAYBOOK READ, AND IT IS THE RICHER ONE
   ============================================================ */
describe('f341 (2) — the shield goes, the More-menu row comes back', () => {
  test('roomChecksHtml draws two checks, and neither is the playbook', () => {
    const b = fnBody(CONTRACT_CODE, 'roomChecksHtml');
    assert.match(b, /\['oblig','calendar','ob_obligations'\]/, 'obligations stays');
    assert.match(b, /\['risk','readpaper','ct_copilot_risk_scan'\]/, 'the scan stays');
    assert.ok(!/'playbook'/.test(b), 'the shield is gone');
    assert.ok(!/'shield'/.test(b), 'and so is its glyph');
  });

  test('the More menu draws the row again, with the handler that never left', () => {
    assert.ok(!/const menuRow = ''/.test(NEGO_CODE), 'menuRow is built');
    assert.match(NEGO_CODE, /data-rl-pbreview/, 'the row carries the attribute');
    assert.match(NEGO_CODE, /\[data-rl-pbreview\]'\)\?\.addEventListener/,
      'and the listener is the one that was kept wired for this day');
  });

  test('it is the window that lets you CHOOSE, which is what was lost', () => {
    /* A NAMED CONTROL: the handler and rlOpenPlaybookReview never left — the
       19 Sep note kept them "wired for that day" — so this passes at the
       parent. It is here because the row coming back is only worth anything
       if it arrives at the RICHER door rather than the plain run. */
    assert.match(NEGO_CODE, /rlOpenPlaybookReview\(c, \(\) => renderRedline\(\)\)/,
      'the pass, then the tick-boxes — not the plain run the shield did');
  });

  test('the glyph is in the markup, never in the word', () => {
    /* The key carried its own ✦ and the row drew one too, which is why the
       menu read "✦ ✦ Review vs Playbook" in the 19 Sep screenshot. */
    assert.ok(!/ng_review_vs_playbook: '&#10022;/.test(I18N),
      'no glyph baked into either book');
    assert.equal((I18N.match(/\bng_review_vs_playbook:/g) || []).length, 2,
      'and the label is in both books');
    assert.equal((I18N.match(/\bng_review_vs_playbook_title:/g) || []).length, 2,
      'so is its hover');
  });

  test('exactly one of the two is drawn ON THAT PAGE — the pair is the real claim', () => {
    /* SCOPED TO THE NEGOTIATE PAGE'S OWN HEAD, which is what the 19 Sep
       ruling was about. The Document tab's Checks card draws its own playbook
       row and always has; that is a different surface, not a second door
       twelve pixels away, and it is deliberately untouched. */
    const shield = /'playbook','shield'/.test(fnBody(CONTRACT_CODE, 'roomChecksHtml'));
    const row = /data-rl-pbreview/.test(NEGO_CODE);
    assert.ok(!(row && shield), 'never both on one head');
    assert.ok(row || shield, 'and never neither — the reading always keeps a way in');
    assert.ok(row, 'today it is the row, and the shield is gone');
  });

  test('the Document tab\u2019s Checks card is untouched', () => {
    /* A NAMED CONTROL: it passes at the parent, and it is here to prove the
       change is narrow. Young ringed the three squares on the Negotiate page. */
    assert.match(CONTRACT_CODE, /row\('playbook','shield',i18t\('ct_playbook_review'\)\)/,
      'the Checks card still carries its playbook row');
  });
});

/* ============================================================
   3 — THE CHAT DOOR MOVED INTO THE CONTRACT’S OWN ROW
   ============================================================ */
describe('f341 (3) — chat sits beside More, and there is still only one', () => {
  test('index.html draws it nowhere', () => {
    assert.ok(!/id="hdr-chat"/.test(HTML),
      'moved, never copied — two doors onto one act is the drift this removes');
  });

  test('roomChatDoorHtml is the one builder, and keeps every name', () => {
    const b = fnBody(CONTRACT, 'roomChatDoorHtml');
    assert.match(b, /id="hdr-chat"/, 'same id, so paintChatDoor still answers');
    assert.match(b, /id="hdr-chat-dot"/, 'same dot');
    assert.match(b, /i18t\('ng_chat_title'\)/, 'same words');
    assert.match(b, /class="room-check room-chat"/, 'the checks group’s own clothes');
    assert.match(b, /PORTAL_MODE/, 'and never on the counterparty’s seat');
  });

  test('it is written FIRST inside the checks group, which is what puts it beside More', () => {
    const b = fnBody(CONTRACT_CODE, 'roomChecksHtml');
    assert.match(b, /class="room-checks">\$\{roomChatDoorHtml\(\)\}/,
      'first child of the group that is order 4, with More at 3');
  });

  test('its glyph is a key the ICONS map really carries', () => {
    /* `icon()` states a 24-box viewBox and a key that is not in the map renders
       an EMPTY SVG — the sprite fault in this map’s own costume. */
    const name = (fnBody(CONTRACT, 'roomChatDoorHtml').match(/icon\('([a-z]+)'/) || [])[1];
    assert.equal(name, 'chat', 'it draws through icon()');
    assert.match(COMPONENTS, /\n\s*chat:'/, 'and chat is in the ICONS map');
  });

  test('the press is delegated, because that head is rebuilt every render', () => {
    assert.match(APP_CODE, /_hdrChatWired/, 'one listener, kept to one');
    assert.match(APP_CODE, /closest\('#hdr-chat'\)/, 'resolving the live node at press time');
    assert.ok(!/getElementById\('hdr-chat'\)\?\.addEventListener/.test(APP_CODE),
      'never bound to the node found at boot — f295’s own lesson');
  });

  test('and its state is painted where the head lands', () => {
    assert.match(fnBody(CONTRACT_CODE, 'wireRoomHead'), /paintChatDoor\(\)/,
      'updateAlertBadge runs on the view change, BEFORE this markup is in the DOM');
  });
});

/* ============================================================
   4 — A COUNT ON THE CONTROL, SILENT AT ZERO
   ============================================================ */
describe('f341 (4) — the three buttons carry their own numbers', () => {
  test('one builder, and nothing at zero', () => {
    const b = fnBody(CONTRACT_CODE, 'roomCheckBadge');
    assert.ok(b, 'roomCheckBadge exists');
    assert.match(b, /if\(v <= 0\) return ''/,
      'a mark that is always there is one people learn to ignore');
    assert.match(b, /ROOM_BADGE_MAX/, 'and two digits is the most a 28px box carries');
  });

  test('the figure is the verdict\u2019s own, so there is ONE arithmetic', () => {
    /* The first build wrote a second count here and it disagreed with the
       sentence on the hover: it called obState with two arguments where it
       takes one, so two overdue obligations drew an amber 2 beside a ruby
       label reading "2 overdue". Found by driving the page. The verdict
       already knew both, so it carries `n` and nothing recounts. */
    const v = fnBody(CONTRACT_CODE, 'checkVerdict');
    assert.match(v, /tone:'bad',n:over/, 'overdue is the number the label leads with');
    assert.match(v, /tone:'warn',n:open/, 'and so is open');
    assert.match(v, /n:open\.length/, 'the scan counts what is open');
    assert.ok(!/function roomCheckCount/.test(CONTRACT_CODE),
      'the second arithmetic is gone, not merely unused');
  });

  test('the tone is the check\u2019s own verdict, never a second opinion', () => {
    const b = fnBody(CONTRACT_CODE, 'roomChecksHtml');
    assert.match(b, /roomCheckBadge\(v\.n,v\.tone\)/,
      'the badge takes both the figure and the colour from the one reading');
  });

  test('it is drawn only where the check has run', () => {
    assert.match(fnBody(CONTRACT_CODE, 'roomChecksHtml'), /const badge=\(v&&v\.n\)\?/,
      'before that there is nothing counted, and a mark would be a claim');
  });

  test('the badge rule dresses all three the same, and hides', () => {
    const rule = (HTML.match(/\n\s*\.room-badge\{[\s\S]*?\}/) || [''])[0];
    assert.match(rule, /--st-amber-bg/, 'amber is something open');
    assert.match(rule, /position:absolute/, 'on the corner of the button');
    assert.match(HTML, /\.room-badge\.is-bad\{[\s\S]*?--st-ruby-bg/, 'ruby is something late');
    assert.match(HTML, /\.room-badge\[hidden\]\{\s*display:none/,
      'and hidden really hides, whatever a display rule above says');
    assert.match(HTML, /\.room-check\{ position:relative/,
      'the badge has something to be absolute against');
  });
});

/* ============================================================
   5 — AN ARROW AFTER THE HEADING, AND THE TILE IS THE DOOR
   ============================================================ */
describe('f341 (5) — two arrival tiles open the card that owns their reading', () => {
  test('the arrow is drawn only where there is a target', () => {
    const b = fnBody(CONTRACT_CODE, 'ktTriageStripHtml');
    assert.match(b, /const doorFor = x =>/, 'one reading of which tiles have a door');
    assert.match(b, /x\.key==='brief'\s*&& x\.ok/, 'the brief, once written');
    assert.match(b, /x\.key==='oblig'\s*&& x\.ok/, 'the obligations, once found');
    assert.match(b, /door\?'<span class="kt-tri-go" aria-hidden="true">&rarr;<\/span>':''/,
      'an arrow that leads nowhere is the dead press this whole day is about');
  });

  test('a working tile is never a door', () => {
    assert.match(fnBody(CONTRACT_CODE, 'ktTriageStripHtml'),
      /const door=x\.working\?'':doorFor\(x\)/,
      'a reading still in flight has nothing to open yet');
  });

  test('one producer of the body, whichever shape the tile takes', () => {
    /* A tile that is a door is a <button> and one that is not is a <div>. Two
       shapes, ONE body — written out in both branches it would be the
       duplication warning in its smallest costume. */
    assert.equal((CONTRACT.match(/class="kt-tri-td"/g) || []).length, 1,
      'the reserved two lines are stated once');
    assert.match(fnBody(CONTRACT_CODE, 'ktTriageStripHtml'), /const body=`<div class="kt-tri-td"/,
      'and it is a named local, beside the head');
  });

  test('the whole tile is the press, and it is a real button', () => {
    const b = fnBody(CONTRACT_CODE, 'ktTriageStripHtml');
    assert.match(b, /<button type="button" class="kt-tri-tile is-door" data-kt-tri-go=/,
      'a 9px arrow would be a worse target than the control that was there');
  });

  test('the doors are armed where the strip was painted', () => {
    const b = fnBody(CONTRACT_CODE, 'paintKtTriage');
    assert.match(b, /\[data-kt-tri-go\]/, 'this is the function that knows it landed');
    assert.match(b, /roomGoTab\(c,'oblig'\)/, 'obligations go to the tab that owns them');
    /* REVERSED IN PLACE 20 Sep 2026 (Young: "Brief Witten is supposed to pull
       the brief side Panel but it does not"). It scrolled to `#brief-card`,
       which is the card ABOUT the brief rather than the brief itself — the
       reader landed beside a heading and still had to find its Open button,
       which is precisely what the tile's arrow promises to have done. */
    assert.match(b, /openCheckPanel\(c,'brief'\)/, 'the brief tile opens the brief panel');
    assert.ok(!/getElementById\('brief-card'\)/.test(b), 'and no longer merely scrolls to its card');
  });

  test('TWO DOORS, ONE ACT — the tile and the card\'s Open button make the same call', () => {
    const tile = fnBody(CONTRACT_CODE, 'paintKtTriage');
    const card = fnBody(CONTRACT_CODE, 'wireKtBriefCard') || CONTRACT_CODE;
    assert.match(tile, /openCheckPanel\(c,'brief'\)/);
    assert.match(card, /openCheckPanel\(c,'brief'\)/,
      'the card\'s own Open button is the act the tile borrows');
  });

  test('a door tile is dressed so it does not become a second kind of tile', () => {
    const rule = (HTML.match(/\.kt-tri-tile\.is-door\{[\s\S]*?\}/) || [''])[0];
    assert.match(rule, /font:inherit/, 'a <button> carries the browser’s own font');
    assert.match(rule, /text-align:left/, 'and its own alignment');
    assert.match(HTML, /\.kt-tri-go\{ margin-left:auto/, 'the arrow pins to the tile’s wall');
  });

  test('and its words are in both books', () => {
    for (const k of ['tri_go_brief', 'tri_go_oblig']) {
      assert.equal((I18N.match(new RegExp(`\\b${k}:`, 'g')) || []).length, 2, `${k} in both`);
    }
  });
});

/* ============================================================
   6 & 7 — THE FILL TILE TELLS THE TRUTH
   ============================================================
   MEASURED: the tile read "Open fields filled in ✓" with nothing under it,
   over a contract with placeholders still open. Nothing was filled. The tick
   meant "I found no boxes to fill" and the words said "I filled them in". */
describe('f341 (6) — why there were no blanks, not merely whether', () => {
  test('one reading, four answers, and null where there IS something to fill', () => {
    const b = fnBody(BLANKS, 'contractBlanksNone');
    assert.ok(b, 'contractBlanksNone exists');
    for (const r of ['upload', 'nego', 'none', 'form']) {
      assert.ok(b.includes(`'${r}'`), `${r} is an answer`);
    }
    assert.match(b, /contractBlanksOpen\(c\)\.length \? null : 'none'/,
      'it looked, and there was something — the honest null');
  });

  test('it is published, and it decides nothing about which panel draws', () => {
    assert.match(BLANKS, /Object\.assign\(window,[\s\S]*?contractBlanksNone/, 'on the export list');
    /* contractHasBlanks is still the one gate on the PANEL, so widening this
       could never make two panels draw on one contract. */
    assert.match(fnBody(CONTRACT_CODE, 'paintContractForm'),
      /if\(c && c\.templateForm\)/, 'paintContractForm is untouched');
    assert.ok(!/contractBlanksNone/.test(fnBody(CONTRACT_CODE, 'paintContractForm')),
      'and it does not ask this reading');
  });

  test('a company-standard contract is not "nothing to fill" — item 7', () => {
    const b = fnBody(BLANKS, 'contractBlanksNone');
    assert.match(b, /tplFormOpenCount/,
      'the panel that contract already draws counts its own open fields');
    assert.match(b, /open > 0 \? 'form' : 'none'/,
      'BOTH answers are reasons and neither is a tick \u2014 returning null for '
      + 'the open case let the tile fall through to the very tick being retired');
  });

  test('and the two kinds of nothing get two heads', () => {
    /* A head reading "No open fields to fill" over a body saying "fills in
       from its own panel" is a tile contradicting itself twelve pixels apart. */
    assert.match(TRIAGE_CODE, /none: 'tri_t_fill_none', form: 'tri_t_fill_panel'/,
      'the honest emptiness, and the pointer');
    assert.match(TRIAGE_CODE, /heads\[none\] \|\| heads\.none/,
      'the reason picks the head');
    assert.equal((I18N.match(/\btri_t_fill_panel:/g) || []).length, 2, 'in both books');
  });

  test('the tile has a fourth head, and only this reading has one', () => {
    assert.match(TRIAGE_CODE, /none: 'tri_t_fill_none'/, 'a head per outcome');
    assert.ok(!/brief:.*none:/.test(TRIAGE_CODE), 'and no other step gained one');
    for (const k of ['tri_t_fill_none', 'tri_fill_form', 'tri_fill_upload',
                     'tri_fill_nego', 'tri_fill_nothing']) {
      assert.equal((I18N.match(new RegExp(`\\b${k}:`, 'g')) || []).length, 2,
        `${k} is in both books`);
    }
  });

  /* RE-POINTED IN PLACE 21 Sep 2026 (Young: "the open fields does not tell
     you how many fields are still open"). The rule was that `none` is asked
     before `ok`, and it still is — what moved above BOTH of them is the
     COUNT, because a tile that filled nothing and has nineteen fields open is
     not a steel dash, it is a nineteen. The half this claim exists to hold is
     untouched: a `none` tile with NO number is still steel and still a dash,
     which is what stops the tick coming back. */
  test('nothing-to-do is asked before ok, so the tick cannot come back', () => {
    const b = fnBody(CONTRACT_CODE, 'ktTriageStripHtml');
    assert.match(b, /\(x\.none\?'is-none':\(x\.ok\?'is-ok'/,
      'steel, not green — nothing is wrong and nothing was achieved');
    assert.match(b, /\(x\.none\?'&mdash;':\(x\.ok\?'&#10003;'/, 'and a dash, never a tick');
    /* AND THE NUMBER OUTRANKS BOTH, in the mark and in the tone alike, so the
       two cannot come to different answers about one tile. */
    assert.match(b, /const tone=x\.working\?'is-busy'\s*\n?\s*:\(\(x\.count!=null&&x\.count>0\)\?'is-warn'/);
    assert.match(b, /const mark=x\.working\?[^\n]*\n\s*:\(\(x\.count!=null&&x\.count>0\)\?String\(x\.count\)/);
    assert.match(HTML, /\.kt-tri-chip\.is-none\{[\s\S]*?--st-steel-bg/,
      'the tone this product already uses for "nothing is owed"');
  });

  test('a failure still reads as a failure, and a run in flight as working', () => {
    const b = TRIAGE_CODE.slice(TRIAGE_CODE.indexOf('const add = ('));
    assert.match(b, /const nothing = !working && ok && !!none/,
      'only ever true where the step really ran and really filled nothing');
  });

  /* REVERSED IN PLACE 21 Sep 2026. The old rule — "no count on a tile that
     filled nothing" — read the head and the number as one fact, and they are
     two: "nothing was FILLED" is what `none` says, and "nineteen are still
     OPEN" is a different sentence about the same tile. Forcing the count to
     null hid the one number on this strip worth reading, which is what Young
     reported. The concern under the old claim still holds and is held by the
     STRIP: a `none` tile with no number is a steel dash, never a tick — see
     the claim above. */
  test('only a reading in flight suppresses a count', () => {
    const b = TRIAGE_CODE.slice(TRIAGE_CODE.indexOf('const add = ('));
    assert.match(b, /count: \(working \|\| count == null\) \? null : count/);
    /* AND THE FILL TILE COUNTS WHAT ITS OWN HEAD IS ABOUT: where the head
       says the fields are open, the number is how many are open. */
    assert.match(TRIAGE_CODE, /\(fillNone === 'form' && openNames\.length\) \? openNames\.length/);
  });

  test('the run records the reason, and the tile falls back to a live reading', () => {
    /* A note is durable and the contract is not: a record that gains a blank
       tomorrow must not keep yesterday’s "nothing to fill". The brief’s own
       shape, for the brief’s own reason. */
    assert.match(TRIAGE_CODE, /none: \(\(f\.filled \|\| \[\]\)\.length \|\| \(f\.left \|\| \[\]\)\.length\) \? null/,
      'stamped at the moment it was true');
    assert.match(TRIAGE_CODE, /fillNone = contractBlanksNone\(c\)/,
      'and read live where the step is older than this and carries none');
  });
});

/* ============================================================
   8 — A DATE BOX IS AN ORDINARY BOX
   ============================================================
   Reported twice. The first pair of declarations was on main and the boxes
   still ran past their column on an iPad, so the metrics are STATED. Chromium
   needs none of them and is unchanged by all of them — said out loud rather
   than called proved. */
describe('f341 (8) — the date boxes are told their own size', () => {
  test('the box states its metrics rather than asking', () => {
    const rule = (HTML.match(/\.field-grid input\[type="date"\]\{[\s\S]*?\}/) || [''])[0];
    for (const d of ['appearance:none', 'box-sizing:border-box', 'width:100%', 'min-width:0']) {
      assert.ok(rule.includes(d), `${d} is stated`);
    }
  });

  test('the picker pins right instead of shoving the value about', () => {
    assert.match(HTML, /::-webkit-calendar-picker-indicator\{[\s\S]*?margin-left:auto/);
    assert.match(HTML, /::-webkit-inner-spin-button\{[\s\S]*?display:none/,
      'and a stepper is not a thing this form has room for');
  });

  test('every rule is scoped to the three creation forms, nowhere else', () => {
    /* A NAMED CONTROL: true at the parent, and here to prove the widening
       stayed inside .field-grid rather than reaching the rest of the product. */
    assert.doesNotMatch(CODE('index.html'), /(?<!\.field-grid )input\[type="date"\]/,
      'no unscoped date rule reaches the rest of the product');
  });
});
