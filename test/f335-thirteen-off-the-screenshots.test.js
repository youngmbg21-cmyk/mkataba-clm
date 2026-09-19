/* f335 — THIRTEEN REPORTS OFF A MORNING OF SCREENSHOTS (Young, 19 Sep 2026).
 *
 * Every one was measured against the live product before a line moved, and
 * every measurement is quoted beside the claim that holds it. Four of the
 * thirteen were INVISIBLE IN THE SOURCE — an empty <select>, a head folded a
 * moment too late, a finger that fires no wheel, a dialog with one row in it —
 * which is the standing lesson of this codebase, paid again.
 *
 *   1  "the on hold filter has a bug and also pops up as a tiny drop down
 *       filter with no width"
 *   2  "when I click share, this pops up and the highlighted area appears then
 *       disappears immediately"
 *   3  "remove this highlighted wording"            (the Contract Graph caption)
 *   4  "delete these highlighted options"           (Review vs Playbook only)
 *   5  "the internal / external button should resemble how the contract /
 *       plain english button design looks like including the outline"
 *   6  "Image 2 is an option but when trying to address it you get image 1
 *       error"                                      (Fill it in)
 *   7  "While on an iPad, I am unable to scroll on the plain english side"
 *   8  "there is still no option for putting a hold"  + "Legal/Admin only"
 *   9  "lets put a cap of how many words ... maybe 15 words max"
 *  10  "There are multiple references to the key terms page which we did away
 *       with previously and replaced with Overview"
 *  11  "focus mode button and copilot risk scan symbols look almost exactly
 *       the same"
 *  12  "copilot should add bold letters plus highlight ... amber"
 *  13  "pop ups in the templates page are very bland"
 *
 * WHAT THIS FILE CANNOT SEE: whether a select renders at 28px or 180, whether
 * a head flashes, whether a finger scrolls. Those are PAINT and a source test
 * cannot answer them — they are driven in the browser files named per claim.
 * What is pinned here is the MACHINERY each one rests on, so an edit that
 * quietly takes the mechanism away fails here even if the pixels survive.
 *
 * MEASURED AT THE PARENT (9eed1b3): 53 of 67 claims RED. The fourteen that
 * pass are the named WALLS and CONTROLS — the reading the seat switch is
 * matched TO, the shield that keeps the playbook pass, Prepare redlines
 * staying, the phone's own tab, the chip that is deliberately not swept, the
 * two retired sentences left inert, and the three "must not" sweeps that were
 * already true and must stay true. A claim that passes before the fix is a
 * description; a wall that passes before and after is the point.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const REG = read('js/views/register.js');
const CORE = read('js/core.js');
const INTEL = read('js/views/intelligence.js');
const NEGO = read('js/views/negotiation.js');
const NCSS = read('js/views/negotiation-css.js');
const CONTRACT = read('js/views/contract.js');
const SETTINGS = read('js/views/settings.js');
const LIBRARY = read('js/views/library.js');
const COMPONENTS = read('js/components.js');
const SERVER = read('server/server.js');
const HTML = read('index.html');
const I18N = read('js/i18n.js');

/* PIN THE REGION, NOT A BOUNDARY THAT HAPPENS TO HOLD — f213 and f334 both
   paid for a slice that ran to whatever was written next. `async function`
   ends a region too. */
const fnBody = (src, name) => {
  const at = src.search(new RegExp('(?:async )?function ' + name + '\\('));
  if (at < 0) return '';
  const rest = src.slice(at + 8);
  const end = rest.search(/\n(?:async )?function \w+\(/);
  return end < 0 ? rest : rest.slice(0, end);
};
/* Comments are prose, and the sweeps below read CODE. Every "is it still
   called" claim blanks them first, or a retired name quoted in its own
   gravestone reads as live. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

describe('f335 (1) — the On hold filter has options in it', () => {
  test('it ends with the .map every other filter on that bar ends with', () => {
    /* MEASURED at the parent: the raw array was interpolated into the <select>
       as bare text, the browser discarded it, and the control drew with ZERO
       options — minimum width, and unswitchable. Nothing errored. */
    const at = REG.indexOf('const holdOpts=');
    assert.ok(at > 0, 'holdOpts is still built here');
    const block = REG.slice(at, at + 400);
    assert.match(block, /\.map\(\(\[k,l\]\)=>`<option value="\$\{k\}"/,
      'holdOpts turns its pairs into <option> markup');
    assert.match(block, /\.join\(''\)/, 'and joins them into one string');
  });
  test('and it is not the only one — every pair-list filter on the bar does', () => {
    for (const name of ['renewalOpts', 'holdOpts', 'docsOpts']) {
      const at = REG.indexOf('const ' + name + '=');
      assert.ok(at > 0, name + ' is built');
      assert.match(REG.slice(at, at + 600), /\.map\(/, name + ' maps to options');
    }
  });
});

describe('f335 (2) — the send screen draws no second heading', () => {
  test("the step-2 head is hidden in the MARKUP, not by the wiring", () => {
    /* The kind step eight lines above already carries this note: "a step drawn
       open and then folded by the wiring is exactly the flash the owner saw".
       This one was left to step(1), which runs AFTER three awaits. */
    assert.match(CORE, /<div id="share-step2-head" class="hidden">/,
      'it starts hidden, so the opening frame cannot show it');
  });
  test('and `step` still owns it, so the two-screen shape is not lost', () => {
    assert.match(CORE, /share-step2-head'\)\?\.classList\.toggle\('hidden', one\)/,
      'a return to two screens reveals it exactly as before');
  });
});

describe('f335 (3) — the Contract Graph caption is gone', () => {
  test('the sentence is not drawn', () => {
    assert.ok(!/ask the panel to read, summarise/.test(strip(INTEL)),
      'the hard-coded English caption is retired');
  });
  test('and its stylesheet rule went with it', () => {
    assert.ok(!/\.ig-hd-sub\{/.test(HTML) && !/\.ig-hd-sub\s*\{/.test(HTML),
      'no dead rule left behind in index.html');
  });
});

describe('f335 (4) — Review vs Playbook is off the More menu', () => {
  test('the row is not built', () => {
    assert.ok(!/i18t\('ng_review_vs_playbook'\)/.test(strip(NEGO)),
      'the label is retired by not being called');
    assert.match(NEGO, /const menuRow = ''/, 'menuRow leads with nothing');
  });
  test('but the reading keeps its door — the shield runs the same pass', () => {
    assert.match(CONTRACT, /\['playbook','shield','ct_playbook_review'\]/,
      'the shield is still one of the three checks');
    assert.match(fnBody(CONTRACT, 'wireRoomChecks'), /runPlaybookReview\(c\)/,
      'and it still runs the playbook pass');
  });
  test("and Prepare redlines STAYS — the owner ruled on it by name", () => {
    assert.match(strip(NEGO), /rlPrepareRowHtml\(c, preview\)/,
      'its More-menu row is untouched');
  });
  test('the handler and its two null-safe readers stay wired for the day the window comes back', () => {
    assert.match(NEGO, /\[data-rl-pbreview\]'\)\?\.addEventListener/, 'handler kept');
    assert.match(NEGO, /const restore = btn \? btn\.innerHTML : ''/, 'and reads null-safely');
  });
});

describe('f335 (5) — the seat switch wears the Contract View switch clothes', () => {
  test('the box takes --accent-ink, the token with a night answer', () => {
    const at = NCSS.indexOf('.redline-page .rl-actions .rl-segwrap,');
    assert.ok(at > 0, 'the shared rule is still written once');
    const block = NCSS.slice(at, at + 700);
    assert.match(block, /border:1px solid var\(--accent-ink\)/, 'the outline is the accent');
    assert.ok(!/border:1px solid var\(--color-divider\)/.test(block),
      'and the grey hairline is gone');
  });
  test('the resting word takes the same ink', () => {
    const at = NCSS.indexOf('.redline-page .rl-actions .rl-segwrap .rl-seg,');
    const block = NCSS.slice(at, at + 400);
    assert.match(block, /color:var\(--accent-ink\)/, 'resting halves read as controls');
  });
  test('IT IS A RELATION: the Contract View switch is what it is matched to', () => {
    /* Not a colour typed twice. If .doc-read-seg ever moves, this claim is
       what says the pair must move together. */
    const seg = HTML.slice(HTML.indexOf('.doc-read-seg{'), HTML.indexOf('.doc-read-seg{') + 400);
    assert.match(seg, /border:1px solid var\(--accent-ink\)/,
      'the control being matched still uses that token');
  });
  test('and the clause panel moves with it, which is why the rule is shared', () => {
    assert.match(NCSS, /\.redline-page \.rl-cp-head \.rl-segwrap\{[^}]*--accent-ink/,
      'History | + notes is named in the same rule, as f236 pins');
  });
});

describe('f335 (6) — Fill it in opens the box it is looking for', () => {
  const body = fnBody(CONTRACT, 'focusKeyTerms');
  test('it opens the section and turns its rows on BEFORE it paints', () => {
    assert.match(body, /sectionSetOpen\(key, true\)/, 'the section is opened');
    assert.match(body, /ovSetEditing\(key, true\)/, 'and its rows turned on');
    const open = body.indexOf('sectionSetOpen');
    const tab = body.indexOf("roomGoTab(c,'terms')");
    assert.ok(open > 0 && tab > open, 'posture first, so ONE render does it');
  });
  test('and it honours the field it is handed', () => {
    assert.match(body, /KT_FIELD_HOME\[String\(field\|\|''\)\]/, 'the field decides');
    assert.match(body, /\[data-kt="\$\{home\.kt\}"\]/, 'and the box it hunts follows it');
  });
  test('the map covers every field the readiness rows can hand it', () => {
    const m = CONTRACT.slice(CONTRACT.indexOf('const KT_FIELD_HOME'), CONTRACT.indexOf('function focusKeyTerms'));
    /* signcheck.js's REC_FIELDS: value, effectiveDate, expiryDate,
       counterparty — plus the two blank kinds, counterparty and value. */
    for (const k of ['value', 'effectiveDate', 'expiryDate', 'counterparty'])
      assert.match(m, new RegExp('\\b' + k + ':'), k + ' has a home');
    assert.match(m, /counterparty:\s*\{ kt:'counterparty', sec:'record' \}/, 'and it names its section');
  });
  test('it still SPEAKS where there is genuinely no box — a viewer, a signed record', () => {
    assert.match(body, /ct_no_editable_terms/, 'the sentence is not deleted');
  });
  test('and the press hands the field over', () => {
    assert.match(CONTRACT, /focusKeyTerms\(c, b\.getAttribute\('data-sc-fix'\)\)/,
      'the attribute it always carried is finally read');
  });
});

describe('f335 (7) — a finger scrolls the Plain English column', () => {
  const near = CONTRACT.slice(CONTRACT.indexOf("layer.dataset.docReadWheel='1'"),
                              CONTRACT.indexOf("layer.dataset.docReadWheel='1'") + 2200);
  test('touch is forwarded to the paper, exactly as the wheel is', () => {
    assert.match(near, /addEventListener\('touchstart'/, 'the finger landing is remembered');
    assert.match(near, /addEventListener\('touchmove'/, 'and each move pushes the paper');
    assert.match(near, /getElementById\('doc-scroll'\)/, 'the SAME one surface moves');
  });
  test('THE EDITION STILL GROWS NO SCROLLER OF ITS OWN', () => {
    /* The whole reason the two columns cannot drift. A second real scroller
       here would be two scrollers racing over one reading. */
    assert.ok(!/layer\.style\.overflow\s*=/.test(near), 'the clip stays a clip');
    assert.match(near, /layer\.style\.touchAction='pan-y'/,
      'the browser is told the intent instead');
  });
  test('and the press is swallowed only where the paper actually moved', () => {
    assert.match(near, /if\(s\.scrollTop!==was\) e\.preventDefault\(\)/,
      'reaching the end hands the gesture back — the wheel\'s own rule');
  });
  test('one finger only: a pinch is left alone', () => {
    assert.match(near, /e\.touches\.length!==1/, 'two fingers are not a pan');
  });
});

describe('f335 (8) — a hold is a per-person grant, and it is on the row menu', () => {
  test('the predicate is the family\'s own shape: off by default, admin always, viewer never', () => {
    const m = /const mayHoldContract = \(u\) => \{([\s\S]{0,220}?)\};/.exec(CORE);
    assert.ok(m, 'mayHoldContract exists');
    assert.match(m[1], /p\.role!=='viewer'/, 'a viewer never');
    assert.match(m[1], /p\.role==='admin'/, 'an admin always');
    assert.match(m[1], /p\.holdContracts===true/, 'everybody else on an explicit yes');
  });
  test('THE SERVER IS THE WALL, and it is asked as a DIFFERENCE', () => {
    assert.match(SERVER, /const mayHoldRow = u => !!u && u\.role !== 'viewer'/, 'the row reading exists');
    const at = SERVER.indexOf('const was = !!(prev && prev.hold && prev.hold.at);');
    assert.ok(at > 0, 'the PUT asks what MOVED');
    const block = SERVER.slice(at, at + 700);
    assert.match(block, /was !== now && !mayHoldRow\(req\.user\)/,
      'a save carrying the hold it arrived with passes untouched');
    assert.match(block, /holdDenied: true/, 'and the refusal says which it is');
  });
  test('BOTH DIRECTIONS — lifting a freeze anyone could lift is worth nothing', () => {
    const at = SERVER.indexOf('const was = !!(prev && prev.hold && prev.hold.at);');
    assert.match(SERVER.slice(at, at + 700), /now\s*\?[\s\S]{0,400}:\s*'Releasing a hold/,
      'setting and releasing each get their own sentence');
  });
  test('the column, the field and the admin-only list', () => {
    assert.match(SERVER, /addColumnIfMissing\('users', 'hold_contracts', 'INTEGER NOT NULL DEFAULT 0'\)/,
      'DEFAULT 0 — off by default');
    assert.match(SERVER, /holdContracts: !!u\.hold_contracts/, 'it rides the user row');
    assert.match(SERVER, /ADMIN_ONLY_USER_FIELDS = \[[^\]]*'holdContracts'\]/,
      'and is stripped from a colleague\'s copy');
  });
  test('PATCH refuses a stored no on an admin and a stored yes on a viewer', () => {
    const at = SERVER.indexOf('if (b.holdContracts !== undefined)');
    assert.ok(at > 0, 'the admin grant exists');
    const block = SERVER.slice(at, at + 600);
    assert.match(block, /role === 'admin' && !b\.holdContracts/, 'an admin cannot be un-ticked');
    assert.match(block, /role === 'viewer' && b\.holdContracts/, 'a viewer cannot be ticked');
  });
  test('the act asks the grant, not canEdit', () => {
    const m = /async function contractSetHold\(c,on,why\)\{([\s\S]{0,400}?)const text=/.exec(CORE);
    assert.ok(m, 'contractSetHold exists');
    assert.match(m[1], /mayHoldContract\(\)/, 'freezing is no longer an everyday editor act');
    assert.ok(!/canEdit\(\)/.test(m[1]), 'and canEdit no longer answers for it');
  });
  test('IT IS ON THE CONTRACTS ROW MENU, which is what the drawing shows', () => {
    const at = REG.indexOf('const REG_ROW_ACTIONS=[');
    const block = REG.slice(at, REG.indexOf('];', at));
    assert.match(block, /\{k:'hold',/, 'Put on hold is a row');
    assert.match(block, /\{k:'release',/, 'and so is releasing it');
    assert.match(block, /mayHoldContract/, 'drawn only where it would work');
    assert.match(block, /contractOnHold\(c\)/, 'and only the one that applies');
  });
  test('NOT A SECOND ACT — the row presses contractSetHold, as Archive presses its own', () => {
    const at = REG.indexOf("else if(act==='hold'||act==='release')");
    assert.ok(at > 0, 'the dispatch answers both');
    const block = REG.slice(at, at + 800);
    assert.match(block, /contractSetHold\(c,false,''\)/, 'release writes nothing of its own');
    assert.match(block, /contractSetHold\(c,true,why\)/, 'and the hold hands the reason to the one act');
    assert.match(block, /hd_ask_title/, 'asking with the dialog the contract room already asks with');
  });
  test('THE REASON IS ON THE ROW, cut with the whole of it on the hover', () => {
    assert.match(CORE, /const HOLD_WHY_ROW = \d+/, 'the cut is one number');
    const m = /const contractStatusDotHtml = c => \{([\s\S]{0,700}?)\n\};/.exec(CORE);
    assert.ok(m, 'the row dress exists');
    assert.match(m[1], /holdWhyShort\(c\)/, 'the row prints the reason');
    assert.match(m[1], /title="\$\{_holdEsc\(full\)\}"/, 'and the hover carries the whole of it');
  });
  test('the chip is NOT swept — a card has room for a sentence, a table cell does not', () => {
    const at = CORE.indexOf('const contractStatusChip = c => contractOnHold(c)');
    assert.ok(at > 0, 'the chip still branches on the hold');
    assert.match(CORE.slice(at, at + 300), /hd_chip_title/,
      'the chip keeps its general sentence — a card has room for one');
  });
  test('the settings tick is drawn, saved and read through the one predicate', () => {
    assert.match(SETTINGS, /const stHoldOn=u=>\(typeof mayHoldContract==='function'\)/,
      'the reading asks the predicate, with a literal fallback');
    assert.match(SETTINGS, /id="tm-hold" type="checkbox"/, 'the box is drawn');
    assert.match(SETTINGS, /patch\.holdContracts=holdTo/, 'a change is patched');
    assert.match(SETTINGS, /body\.holdContracts=patch\.holdContracts/, 'and sent');
  });
});

describe('f335 (9) — fifteen words on the face', () => {
  test('one cut, so a row added tomorrow inherits it', () => {
    assert.match(CONTRACT, /const SIGN_WHY_WORDS = 15/, 'the cap is one number');
    const body = fnBody(CONTRACT, 'signWhyShort');
    assert.match(body, /w\.length <= SIGN_WHY_WORDS/, 'WORDS, not characters');
    assert.match(body, /\\u2026/, 'and an ellipsis only where something was dropped');
  });
  test('A CUT IS A FACT: the whole sentence is the row\'s hover', () => {
    assert.match(CONTRACT, /const whyFull = why;\s*\n\s*why = signWhyShort\(why\);/,
      'the full sentence is held before the cut');
    assert.match(CONTRACT, /whyFull!==why\?` title="\$\{esc\(whyFull\)\}"`:''/,
      'and drawn as the hover only where it differs');
  });
  test('a short sentence is byte-identical to what it was', () => {
    /* No ellipsis, no title attribute, nothing added. */
    const at = CONTRACT.indexOf('function signWhyShort');
    assert.match(CONTRACT.slice(at, at + 420), /if \(w\.length <= SIGN_WHY_WORDS\) return s;/,
      'under the cap it returns the sentence untouched');
  });
  test('and the standards row no longer prints two full stops', () => {
    assert.match(CONTRACT, /const pos=String\(r\.position\|\|''\)\.trim\(\)\.replace\(\/\[\.\\u3002\]\+\$\/,''\)/,
      'the playbook position loses its own trailing stop before the sentence adds one');
  });
});

describe('f335 (10) — the tab is Overview, and the sentences say so', () => {
  const live = [
    ['sc_row_blank', /is blank on Overview/],
    ['sc_fix_btn', /Fix on Overview/],
    ['rn_from_why', /recorded on Overview/],
    ['rn_no_notice', /Set it on Overview/],
    ['rn_no_notice_why', /notice period on Overview/],
    ['rn_before_filed', /notice period on Overview/],
    ['pt_empty_why', /typed on Overview/],
  ];
  for (const [key, re] of live) {
    test(key + ' points at the tab that exists', () => {
      const m = new RegExp('^    ' + key + ': ["\'](.*)["\'],$', 'm').exec(I18N);
      assert.ok(m, key + ' is in the English book');
      assert.match(m[1], re, key + ' names Overview');
      assert.ok(!/Key terms/.test(m[1]), key + ' no longer names a tab that is gone');
    });
  }
  test('THE PHONE IS DELIBERATELY UNTOUCHED — it draws its own tab', () => {
    assert.match(I18N, /tab_key_terms: 'Key terms'/,
      'the phone\'s own word stays, as the 16 Sep ruling says');
    assert.match(read('js/mobile-contract.js'), /i18t\('tab_key_terms'\)/,
      'and the phone is still what draws it');
  });
  test('both books moved together', () => {
    const en = (I18N.match(/is blank on Overview/g) || []).length;
    assert.equal(en, 1, 'the English sentence is written once');
    assert.match(I18N, /är tomt på Översikt/, 'and the Swedish twin moved with it');
  });
  test('the two stale renewal sentences are left inert, not deleted', () => {
    /* Retire a key by leaving it in BOTH books and calling it nowhere. */
    assert.match(I18N, /rn_fix_terms: /, 'still in the book');
    assert.ok(!/i18t\('rn_fix_terms'\)/.test(strip(read('js/views/contract.js')) + strip(read('js/core.js'))),
      'and still called nowhere');
  });
});

describe('f335 (11) — one mark, one meaning', () => {
  test('the reading family has its own symbol', () => {
    assert.match(COMPONENTS, /\n  readpaper:'<path/, 'readpaper is in the sprite');
  });
  test('and every reading caller moved onto it', () => {
    assert.match(CONTRACT, /\['risk','readpaper','ct_copilot_risk_scan'\]/, 'the risk check');
    assert.match(REG, /icon\('readpaper','w-2\.5 h-2\.5'\)/, 'the findings badge on a Contracts row');
    assert.match(read('js/playbook.js'), /icon\('readpaper'/, 'the playbook Run button');
    assert.match(read('js/ocr.js'), /icon\('readpaper'/, 'the machine-read line');
    assert.match(read('js/metadata.js'), /icon\('readpaper'/, 'the extraction line');
    assert.match(read('js/ai.js'), /icon\('readpaper'/, "Copilot's own pulse");
  });
  test('`scan` keeps Focus mode and NOTHING ELSE', () => {
    const files = ['js/views/contract.js', 'js/views/portal.js', 'js/views/register.js',
      'js/playbook.js', 'js/ocr.js', 'js/metadata.js', 'js/ai.js', 'js/components.js'];
    const hits = [];
    for (const f of files)
      for (const m of read(f).matchAll(/icon\('scan'/g)) hits.push(f);
    /* FOUR, and every one is Focus mode: the ⋯ row, the repaint that relabels
       it, the head's new button, and the counterparty page's own row. */
    assert.equal(hits.length, 4,
      'exactly the four Focus-mode callers, not ' + hits.length + ': ' + hits.join(', '));
    assert.equal(hits.filter(f => f === 'js/views/contract.js').length, 3);
    assert.equal(hits.filter(f => f === 'js/views/portal.js').length, 1);
  });
  test('Focus mode is a button on both heads, last in the row', () => {
    assert.match(CONTRACT, /class="room-check room-focus" data-ws-focus/, 'the button is drawn');
    assert.match(HTML, /\.room-acts-lead > \.room-focus\{ order:5; \}/,
      'after the checks on a lead row, after Draft new agreement on the other');
  });
  test('TWO DOORS, ONE HANDLER — querySelectorAll, never querySelector', () => {
    const body = fnBody(CONTRACT, 'wireWsFocus');
    assert.match(body, /querySelectorAll\('\[data-ws-focus\]'\)/,
      'the lesson f295 wrote down: a door bound with querySelector is live-looking and dead');
    assert.match(CONTRACT, /id="ws-focus"/, 'and the menu row stays — the owner kept it');
  });
  test('and both doors say the same state', () => {
    assert.match(fnBody(CONTRACT, 'applyWsFocus'),
      /querySelectorAll\('\[data-ws-focus\]'\)[\s\S]{0,260}aria-pressed/,
      'the pair can never disagree about which state the page is in');
  });
});

describe('f335 (12) — bold from facts, amber from the record', () => {
  test('the bold BORROWS the brief\'s own deterministic pass', () => {
    const body = fnBody(CONTRACT, 'docReadMark');
    assert.match(body, /briefMark/, 'it is the brief\'s reading, not a second copy');
    assert.match(body, /return esc\(t\)/, 'and a stage without that module is byte-identical');
  });
  test('NO MODEL DECIDES WHAT IS EMPHASISED', () => {
    const body = fnBody(CONTRACT, 'docReadFlags') + fnBody(CONTRACT, 'docReadMark');
    for (const bad of ['api(', 'fetch(', 'copilot', 'anthropic'])
      assert.ok(!body.includes(bad), 'neither reading spends anything: ' + bad);
  });
  test('the amber rests on facts HaTi already holds', () => {
    const body = fnBody(CONTRACT, 'docReadFlags');
    assert.match(body, /c\.playbook&&Array\.isArray\(c\.playbook\.verdicts\)/, "this workspace's own playbook");
    assert.match(body, /openFindings\(c\)/, 'and the risk scan already run');
    assert.match(body, /rlPbFindClause\(c,q,cat\)/,
      'placed through the ONE reading that refuses rather than guesses');
  });
  /* RE-POINTED IN PLACE 19 Sep 2026, and this file's own standing lesson is
     what it cost. The claim is about BEHAVIOUR — a finding rlPbFindClause
     could not place adds nothing — and it was pinned as the exact one-line
     shape the guard was written in on the day, `if(!cl||!cl.clauseId`.
     AND THE HALF IT PINNED WAS THE BUG. Measured in a browser the next day:
     that clause id was never going to match anything, because docReadSheet
     walks the PAINTED page and its rows carry no id at all — so the amber this
     claim was written to protect had never marked a single clause. The keying
     moved onto the clause's own heading, which both sides really hold, and the
     claim is pinned as the two REFUSALS it is actually about. */
  test('an unplaceable finding marks NOTHING rather than the wrong paragraph', () => {
    const body = fnBody(CONTRACT, 'docReadFlags');
    assert.match(body, /const add\s*=\s*\(cl,\s*why\)\s*=>\s*\{[\s\S]{0,60}?if\(!cl\|\|!why\) return;/,
      'a null clause adds no flag');
    assert.match(body, /if\(!k\) return;/,
      'and a clause it cannot key adds none either, rather than sharing one');
  });
  test('RED AND GREEN ARE ABSENT, and that is the ruling', () => {
    const at = HTML.indexOf('.doc-read-note.dr-watch');
    assert.ok(at > 0, 'the amber rule exists');
    const block = HTML.slice(at, at + 200);
    assert.match(block, /--st-amber-dot/, 'amber only');
    assert.ok(!/ruby|green/.test(block),
      'no colour saying "this is bad for you" on nothing, and none clashing with the redline');
  });
  test('READING MUST NOT WRITE, and it never sends a byte', () => {
    const body = fnBody(CONTRACT, 'docReadFlags');
    for (const bad of ['negoInit', 'persist(', 'changes.push'])
      assert.ok(!body.includes(bad), 'the flag reading writes nothing: ' + bad);
    /* THE WALL: what the route is sent does not move. */
    assert.ok(!fnBody(CONTRACT, 'docReadClauses').includes('docReadMark'),
      'the marking never reaches what is hashed and sent');
  });
  test('computed ONCE per paint, not per entry', () => {
    assert.match(CONTRACT, /const flags=docReadFlags\(c\);/,
      'or it is O(clauses x findings) on every repaint of a 200-clause contract');
  });
});

describe('f335 (13) — the templates pop-up', () => {
  test('a menu that would offer one thing offers it, with no dialog', () => {
    assert.match(LIBRARY, /if\(rows\.length===1 && only\)\{ only\(\); return; \}/,
      'no second press to reach a single act');
  });
  test('and the act is NAMED ONCE — the shortcut runs what the row runs', () => {
    const at = LIBRARY.indexOf('const ACT={');
    assert.ok(at > 0, 'the acts are a table');
    const block = LIBRARY.slice(at, LIBRARY.indexOf('};', at));
    for (const id of ['tm-vers', 'tm-edit', 'tm-blanks', 'tm-bulk', 'tm-bulk-b', 'tm-del'])
      assert.match(block, new RegExp("'" + id + "'"), id + ' has its one statement');
    assert.match(LIBRARY, /ids\.forEach\(id=>document\.getElementById\(id\)\?\.addEventListener\('click',ACT\[id\]\)\)/,
      'and the wiring presses the same table');
  });
  test('the built-in keeps its role check on the way through', () => {
    const at = LIBRARY.indexOf("'tm-bulk-b':");
    assert.match(LIBRARY.slice(at, at + 300), /templateAllowedForRole/,
      'the shortcut cannot skip a guard the row had');
  });
  test('the head has a rule under it and says what the template is', () => {
    assert.match(LIBRARY, /class="tpl-m-head"/, 'the head is its own element');
    assert.match(HTML, /\.tpl-m-head\{[^}]*border-bottom:2px solid var\(--color-accent\)/,
      'an accent rule, the mark this product already puts under a head');
    assert.match(HTML, /\.tpl-m-head \.tpl-m-chip\{/, 'and the chips are dressed');
  });
  test('the stream chip carries FOLDERS\' own colour, never a palette typed here', () => {
    assert.match(LIBRARY, /--tpl-m-dot:\$\{fold\.color\}/,
      'the one source of truth the card stripe and the map already read');
    assert.match(HTML, /background:var\(--tpl-m-dot,var\(--color-neutral-400\)\)/,
      'and the rule reads the token rather than knowing the palette');
  });
  test('A RULE, NOT A FILL — the frame is 400px', () => {
    const at = HTML.indexOf('.tpl-m-head{');
    assert.ok(!/background:/.test(HTML.slice(at, at + 200)),
      'a filled head at that width reads as a banner');
  });
});
