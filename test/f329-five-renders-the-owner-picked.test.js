/* f329 — THE FIVE RENDERS THE OWNER PICKED
   ============================================================
   Young, 17 September 2026, having been shown five boards and asked for
   letters: *"Image 1 = B, Image 2 = D, Image 3 = A, Image 4 = as recommended,
   Image 5 = A."*

   WHAT WAS PICKED, and what each one reverses:
     1 (B) "Run the check" becomes HaTi's ordinary secondary button and SAYS
           how many readings the press will make. It was a bare accent word at
           --t-label/700 beside a stage heading at --t-micro/700 in the quiet
           ink — near enough in size and identical in weight that the pair read
           as one label, which is the owner's *"it is very easy to miss"*.
     2 (D) The redline row becomes THREE lines: the clause name, the summary,
           and the verbs on a row of their own at the right wall. REVERSES the
           two-thirds-above-a-floor grid of 26 Aug 2026 for this row, and with
           it the reason symbols were ever wanted — the words stay. Discard
           leaves the middle of the row for its end, and takes ruby ink.
     3 (A) Pressing into the negotiation with fields still empty asks first,
           NAMING the first three. Once per contract per sitting.
     4     Both directions of the field link, because it is one machinery.
     5 (A) A ladder rung shows its whole clause on a sheet beside the panel.

   THE RULE UNDER 1, 3 AND 5 IS THE SAME ONE: a count, a question or a card
   that says something the press then contradicts is worse than saying nothing.
   So each of the three rests on a reading the ACT itself obeys —
   signCheckWillRun, contractBlanksOpen, ladderRungs — never on a second tally.

   WHAT IS MEASURED IN A BROWSER INSTEAD: every pixel claim. jsdom resolves no
   layout, so nothing here can tell a three-line row from a one-line row, a
   drawn button from an undrawn one, or a card that covers the contract from
   one that sits beside it. Those live in the -verify files named per section.

   Run: node --test test/f329-five-renders-the-owner-picked.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
/* A MISSING FILE IS A FAILED CLAIM, NEVER A CRASH AT LOAD. */
const read = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (_) { return ''; } };
/* Comments are not code. Every claim below is about what RUNS, and a rule
   quoted in a note above the thing it governs would otherwise pass for it. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
/* PIN THE REGION, NOT A BYTE COUNT — this file's own predecessors paid for
   that twice in one week (f213 and f306, both re-pointed on 17 Sep). */
const bodyOf = (src, sig) => {
  const at = src.indexOf(sig);
  if (at < 0) return '';
  /* SKIP THE PARAMETER LIST FIRST. `function f(id, opts = {})` puts a brace
     before the body, and matching from it returns the SIGNATURE — a string
     with no code in it, which then passes every "it never calls X" claim in
     this file by having nothing to call. Caught on the first run here; it is
     the same fault class as a grep over a file that does not exist. */
  let i = src.indexOf('(', at), p = 0;
  if (i < 0) return '';
  for (; i < src.length; i++) {
    if (src[i] === '(') p++;
    else if (src[i] === ')') { p--; if (!p) { i++; break; } }
  }
  i = src.indexOf('{', i);
  if (i < 0) return '';
  let d = 0;
  for (let k = i; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(at, k + 1); }
  }
  return '';
};
/* AND A BODY THAT IS ALL SIGNATURE IS NOT A BODY. Every absence claim below
   goes through this, so a helper that silently returns nothing fails loudly
   rather than reporting a clean sweep. */
const realBody = (src, sig) => {
  const b = bodyOf(src, sig);
  assert.ok(b.length > sig.length + 40, sig + ' has a body to read');
  return b;
};

const SIGNCHECK = read('js/signcheck.js');
const CONTRACT = read('js/views/contract.js');
const NEGO = read('js/views/negotiation.js');
const NEGOCSS = read('js/views/negotiation-css.js');
const INDEX = read('index.html');
const I18N = read('js/i18n.js');

/* ============================================================
   1 · "RUN THE CHECK" IS A BUTTON THAT SAYS WHAT IT COSTS   (Image 1 = B)
   ============================================================ */
describe('f329 (1) — the run control is a button, and its count is the press\u2019s own', () => {
  test('signCheckWillRun is the ONE reading, and it reads nothing else', () => {
    const fn = realBody(strip(SIGNCHECK), 'function signCheckWillRun(');
    assert.ok(fn, 'the reading exists');
    assert.match(fn, /out\.n\s*=/, 'it answers a count');
    /* READING MUST NOT WRITE, and it must not spend: a function asked on every
       paint of the signing card may not reach a route or the record. */
    for (const bad of ['persist(', 'api(', 'fetch(', 'logAudit(', 'toast(']) {
      assert.ok(!fn.includes(bad), `it never calls ${bad}`);
    }
  });
  test('a record the check cannot run on answers zero, so the button keeps its plain word', () => {
    const fn = realBody(strip(SIGNCHECK), 'function signCheckWillRun(');
    assert.match(fn, /if\s*\(!r\s*\|\|\s*!r\.ready\)\s*return out/, 'not ready is zero, not a guess');
  });
  test('the button asks it, and prints the plain word at zero', () => {
    const card = realBody(strip(CONTRACT), 'function signCheckCardHtml(');
    assert.ok(card, 'the card exists');
    assert.match(card, /signCheckWillRun\(rc\)\.n/, 'the label comes from the press\u2019s own reading');
    assert.match(card, /willN\?i18tn\('sc_run_n',willN[\s\S]{0,40}:i18t\('sc_run'\)/,
      '"Run 0 readings" is a button describing nothing');
  });
  test('it carries the magnifier and keeps #sc-run', () => {
    const card = realBody(strip(CONTRACT), 'function signCheckCardHtml(');
    assert.match(card, /id="sc-run"/, 'every wiring and every test that reaches for it is untouched');
    assert.match(card, /use href="#i-search"/, 'the sprite\u2019s own magnifier, never a drawn one');
  });
  test('it is the secondary button, NOT the filled one', () => {
    const m = /\.sc-stage-act\{[\s\S]*?\}/.exec(INDEX);
    assert.ok(m, 'the class is dressed');
    assert.match(m[0], /border:1px solid var\(--btn-edge\)/, 'the accent edge');
    assert.match(m[0], /background:transparent/, 'and a transparent face');
    assert.match(m[0], /min-height:var\(--ctl-h\)/, 'on the product\u2019s own rung');
    /* ONE FILLED BUTTON PER SCREEN, and on this screen that is Sign. The owner
       was offered the filled one by name and did not take it. */
    assert.ok(!/\.sc-stage-act\{[^}]*background:var\(--accent-fill\)/.test(INDEX),
      'never filled');
  });
  test('greyed is still a button', () => {
    const m = /\.sc-stage-act:disabled\{[\s\S]*?\}/.exec(INDEX);
    assert.ok(m, 'the disabled face exists');
    assert.match(m[0], /border-color:/, 'the edge goes quiet rather than away');
  });
  test('the count\u2019s words are in BOTH books', () => {
    assert.equal((I18N.match(/sc_run_n_one:/g) || []).length, 2);
    assert.equal((I18N.match(/sc_run_n_other:/g) || []).length, 2);
  });
});

/* ============================================================
   2 · THE REDLINE ROW IS THREE LINES                        (Image 2 = D)
   ============================================================ */
describe('f329 (2) — the row is one column, and the verbs have a row of their own', () => {
  test('the grid is ONE column, so the name and the summary take the whole width', () => {
    const m = /\.redline-page \.rl-card-d\{[\s\S]*?\n {4}align-items:start;gap:2px\}/.exec(NEGOCSS);
    assert.ok(m, 'the row is a single-column grid');
    assert.ok(!/\.redline-page \.rl-card-d\{[\s\S]{0,2000}?grid-template-columns:minmax\(0,2fr\)/.test(NEGOCSS),
      'the two-thirds split is gone from this row');
  });
  /* A NAMED CONTROL: it passes at the parent and must. It is a wall against
     a tidy-up that removes a token this row stopped using but their seat did
     not — the class of fault this codebase calls "the rlPaperFootHtml family". */
  test('and --rl-verb-floor is still declared, because their seat still reads it', () => {
    assert.match(NEGOCSS, /--rl-verb-floor:127px/,
      'the counterparty\u2019s boxed card and their receipt are untouched by any of this');
  });
  test('the verbs sit at the right wall and wrap rather than clip', () => {
    const m = /\.redline-page \.rl-card-d \.rl-card-side\{[\s\S]*?\}/.exec(NEGOCSS);
    assert.ok(m, 'the verbs row is dressed');
    assert.match(m[0], /justify-content:flex-end/, 'at the right wall');
    assert.match(m[0], /flex-wrap:wrap/,
      'clipping a verb off the end is the one thing --rl-verb-floor existed to prevent');
  });
  test('Discard is LAST on our own row, after Ladder', () => {
    const fn = realBody(strip(NEGO), 'const rlRowFaceVerbs =');
    assert.ok(fn, 'the funnel exists');
    /* It is held out where it used to be pushed, and pushed on at the end. */
    assert.match(fn, /discard\s*=\s*relabel\(take\(\/data-rl-retract=\\?\/\)/,
      'held out of the middle');
    const held = fn.indexOf('if (discard) out.push(discard);');
    const ladder = fn.indexOf('data-rl-ladder=');
    assert.ok(held > 0 && ladder > 0 && held > ladder, 'and pushed on after Ladder');
  });
  test('and it is ruby, because it is the only press that throws work away', () => {
    assert.match(NEGOCSS, /\[data-rl-retract\]\{color:var\(--st-ruby-fg\)\}/);
    assert.ok(!/\[data-rl-retract\]\{color:var\(--color-neutral-600\)\}/.test(NEGOCSS),
      'the grey read as "unavailable" on a row where every verb is a bare word');
  });
  /* THE SECOND NAMED CONTROL, and the same kind: it passes at the parent
     because the parent has no symbols either. It is here so that the day
     somebody reaches for A or B instead, this says out loud that the owner
     picked the height over the symbols on 17 Sep 2026. */
  test('THE VERBS KEEP THEIR WORDS — no symbol was introduced', () => {
    const fn = realBody(strip(NEGO), 'const rlRowFaceVerbs =');
    assert.ok(!/<svg|<use /.test(fn),
      'symbols were only ever wanted because the words were stealing the width');
  });
});

/* ============================================================
   3 · THE FIELDS ARE OFFERED BEFORE THE ARGUMENT            (Image 3 = A)
   ============================================================ */
describe('f329 (3) — opening Negotiate offers to fill the open fields first', () => {
  test('it asks at the ONE funnel, after the sealed-record wall', () => {
    const fn = realBody(strip(NEGO), 'function openRedlineWorkbench(');
    assert.ok(fn, 'the funnel exists');
    const wall = fn.indexOf('negoMayStart(held).ok');
    const ask = fn.indexOf('_rlBlanksAsked.has(String(target))');
    assert.ok(wall > 0 && ask > 0 && ask > wall,
      'a contract nobody may negotiate is refused for that reason, not asked about its blanks');
  });
  test('ONCE per contract per sitting, in memory, never persisted', () => {
    const src = strip(NEGO);
    assert.match(src, /const _rlBlanksAsked = new Set\(\)/, 'a set, in memory');
    const fn = realBody(src, 'function openRedlineWorkbench(');
    assert.match(fn, /_rlBlanksAsked\.add\(String\(target\)\)/, 'stamped on the way in');
    assert.ok(!/_rlBlanksAsked[\s\S]{0,200}(persist|localStorage|lsSet)/.test(src),
      'a question you answered and are asked again on the next press stops being read');
  });
  /* ---- THE OFFER MUST BE ONE THE PRODUCT CAN HONOUR (found by measurement,
     17 Sep 2026) ----
     contractBlanksOpen reads the WORDING, which still carries blanks on a
     contract that has left Draft; renderBlankFormSection asks docFillable and
     draws nothing at all once it has. Without this wall the question fired on
     a contract whose fill panel does not exist, and "Fill them in" landed the
     reader on a page with no boxes on it. competing-redlines-verify caught it
     — its contracts are mid-negotiation, so past Draft — and every reading of
     the source looked correct. */
  test('it never offers to fill boxes the page will not draw', () => {
    const fn = realBody(strip(NEGO), 'function negoBlanksOpen(');
    assert.match(fn, /docFillable\(c\)/,
      'the product\u2019s own reading of "may this paper still be typed into"');
    const at = fn.indexOf('docFillable');
    const ask = fn.indexOf('contractBlanksOpen(c)');
    assert.ok(at > 0 && ask > at, 'and it is asked BEFORE the count, not after');
  });
  test('the count is contractBlanksOpen\u2019s own, never a second tally', () => {
    const fn = realBody(strip(NEGO), 'function negoBlanksOpen(');
    assert.ok(fn, 'the reading exists');
    assert.match(fn, /contractBlanksOpen\(c\)/, 'the same count the panel prints');
    assert.match(fn, /PORTAL_MODE/, 'and never on their seat');
  });
  test('it NAMES the first three, then counts the rest', () => {
    const fn = realBody(strip(NEGO), 'async function negoBlanksAsk(');
    assert.ok(fn, 'the ask exists');
    assert.match(fn, /NG_BLANKS_NAMED/, 'three, from one constant');
    assert.match(fn, /ng_blanks_these_more/, 'and what was left out is counted, never trimmed in silence');
  });
  test('BOTH DOORS ARE ON THE SCREEN, and Escape takes you through', () => {
    const fn = realBody(strip(NEGO), 'async function negoBlanksAsk(');
    assert.match(fn, /confirmLabel:\s*i18t\('ng_blanks_fill'\)/, 'the recommended act is the filled one');
    assert.match(fn, /cancelLabel:\s*i18t\('ng_blanks_go'\)/, 'and the other door is beside it');
    assert.match(fn, /return fill \? 'fill' : 'go'/,
      'dismissing the suggestion carries on with what was pressed for');
  });
  test('the answer RE-ENTERS the funnel rather than carrying on inline', () => {
    const fn = realBody(strip(NEGO), 'function openRedlineWorkbench(');
    assert.match(fn, /openRedlineWorkbench\(target, Object\.assign\(\{\}, opts, \{ blanksAsked: true \}\)\)/,
      'one path into the page, so the dialog cannot become a second one');
  });
  test('"Fill them in" lands on the Document tab with the cursor in the first box', () => {
    const fn = realBody(strip(NEGO), 'function negoBlanksFill(');
    assert.ok(fn, 'the landing exists');
    assert.match(fn, /roomGoTab\(c, 'docs'\)/, 'the tab the boxes are on');
    assert.match(fn, /contractFieldFocus\(c\)/, 'and the door that puts the cursor there');
    assert.match(fn, /setTimeout/, 'after the paint — a box not on the page yet takes no cursor');
  });
  test('its words are in BOTH books', () => {
    for (const k of ['ng_blanks_title', 'ng_blanks_fill', 'ng_blanks_go', 'ng_blanks_msg_other']) {
      assert.equal((I18N.match(new RegExp(k + ':', 'g')) || []).length, 2, k);
    }
  });
});

/* ============================================================
   4 · THE FIELD AND ITS WORD ON THE PAPER                   (Image 4)
   ============================================================ */
describe('f329 (4) — a cursor in a field lights that spot on the paper, and back', () => {
  test('ONE reading answers all four shapes the product draws', () => {
    const fn = realBody(strip(CONTRACT), 'function contractFieldKeyOf(');
    assert.ok(fn, 'the reading exists');
    for (const a of ['data-blankf', 'data-sync', 'data-field', 'data-field-key', 'data-tplf']) {
      assert.ok(fn.includes(a), `it knows ${a}`);
    }
    assert.match(fn, /templateForm\.fields\[Number\(idx\)\]/,
      'the template form keys by INDEX, so the contract is what turns it back into a key');
  });
  test('it reads and lights, and writes NOTHING', () => {
    for (const name of ['function contractFieldKeyOf(', 'function contractFieldPeer(',
      'function contractFieldLight(', 'function wireFieldLink(']) {
      const fn = realBody(strip(CONTRACT), name);
      assert.ok(fn, name);
      for (const bad of ['persist(', 'contractBlankSet(', 'logAudit(', 'api(', 'fetch(']) {
        assert.ok(!fn.includes(bad), `${name} never calls ${bad}`);
      }
    }
  });
  test('ONE light at a time, on either side', () => {
    const fn = realBody(strip(CONTRACT), 'function contractFieldLight(');
    assert.match(fn, /querySelectorAll\('\.is-fieldlit'\)[\s\S]{0,80}remove\('is-fieldlit'\)/,
      'a reader tabbing down a form leaves no trail of lit words');
  });
  test('the paper LANDS rather than travels', () => {
    const fn = realBody(strip(CONTRACT), 'function contractFieldLight(');
    assert.match(fn, /behavior: 'auto'/, 'a smooth scroll on a keystroke reads as the page wobbling');
    assert.match(fn, /block: 'center'/, 'so the sentence around the word is readable');
  });
  test('THE OTHER WAY ROUND NEVER TAKES THE CURSOR', () => {
    const fn = realBody(strip(CONTRACT), 'function wireFieldLink(');
    assert.ok(fn, 'the wiring exists');
    const canvas = fn.slice(fn.indexOf("canvas._fieldLinkWired = true"));
    assert.ok(canvas.includes("contractFieldPeer(key, 'panel')"), 'the panel is what lights');
    assert.ok(!canvas.includes('.focus('),
      'moving focus out from under a reader mid-word is the opposite of the point');
  });
  test('two delegated listeners, bound once each', () => {
    const fn = realBody(strip(CONTRACT), 'function wireFieldLink(');
    assert.match(fn, /panel\._fieldLinkWired/, 'once on the panel');
    assert.match(fn, /canvas\._fieldLinkWired/, 'once on the canvas');
    assert.equal((fn.match(/addEventListener\('focusin'/g) || []).length, 2, 'one each');
  });
  test('BOTH panels get it, from the one function that knows a panel was drawn', () => {
    const fn = realBody(strip(CONTRACT), 'function paintContractForm(');
    assert.ok(fn, 'the chooser exists');
    assert.match(fn, /wireFieldLink\(c\)/, 'armed after whichever panel was written');
    /* IT IS STILL ONE SLOT, ONE DECISION: the early return that used to leave
       the second builder unreachable has become a branch, so exactly one of
       the two still writes and the link is armed either way. */
    assert.match(fn, /renderTemplateFormSection\(c\)[\s\S]{0,40}\}\s*else\s*\{/, 'one or the other, never both');
  });
  test('the light costs the contract NO layout', () => {
    const m = /\.is-fieldlit\{[\s\S]*?\}/.exec(INDEX);
    assert.ok(m, 'the light is dressed');
    assert.match(m[0], /outline:/, 'an outline, painted outside layout');
    assert.ok(!/\.is-fieldlit\{[^}]*(?:^|[^-])border:|\.is-fieldlit\{[^}]*padding:|\.is-fieldlit\{[^}]*font-size:/.test(INDEX),
      'never a border, padding or a bigger font — the sentence around it would move');
  });
});

/* ============================================================
   5 · A RUNG'S WHOLE CLAUSE, BESIDE THE LADDER              (Image 5 = A)
   ============================================================ */
describe('f329 (5) — a ladder rung shows its whole clause', () => {
  test('IT COSTS NOTHING: no route, no model, no write', () => {
    const fn = realBody(strip(NEGO), 'function rlRungPeekHtml(');
    assert.ok(fn, 'the card exists');
    for (const bad of ['api(', 'fetch(', 'persist(', 'copilot', 'aiAsk', 'logAudit(']) {
      assert.ok(!fn.includes(bad), `it never calls ${bad}`);
    }
  });
  test('READING MUST NOT WRITE — it never initialises a negotiation', () => {
    const fn = realBody(strip(NEGO), 'function rlRungPeekHtml(');
    for (const bad of ['negoInit', 'negoChanges(', 'negoClauseList(', 'negoRound(']) {
      assert.ok(!fn.includes(bad), `it never calls ${bad}`);
    }
    assert.match(fn, /ladderRungs\(c,/, 'it reads the ladder, which reads c.changes raw');
  });
  test('the wording comes from the ONE builder, so it cannot disagree with the card', () => {
    const fn = realBody(strip(NEGO), 'function rlRungPeekHtml(');
    assert.match(fn, /rlChangeWordingHtml\(r\.ch/, 'the same builder the row\u2019s own wording uses');
  });
  test('R0 is drawn plain, because nothing has moved yet', () => {
    const fn = realBody(strip(NEGO), 'function rlRungPeekHtml(');
    assert.match(fn, /base === '0'/, 'R0 is named');
    assert.match(fn, /ladderBaseText\(rungs\)/, 'and takes the agreed wording');
  });
  test('an absence is STATED, never left blank', () => {
    const fn = realBody(strip(NEGO), 'function rlRungPeekHtml(');
    assert.match(fn, /ng_peek_none/, 'a rung with no wording says so');
  });
  test('HOVER ALONE IS NOT ENOUGH: a point, a tab, a press and Escape', () => {
    const src = strip(NEGO);
    const m = src.slice(src.indexOf("document._rlPeekWired = true"));
    assert.ok(m, 'the listeners are armed');
    assert.match(m.slice(0, 2600), /addEventListener\('mouseover'/, 'pointing');
    assert.match(m.slice(0, 2600), /addEventListener\('focusin'/, 'tabbing');
    assert.match(m.slice(0, 2600), /ev\.key === 'Escape'/, 'and Escape closes it');
    assert.match(src, /data-rl-rung-peek="\$\{_nea\(id\)\}" data-rung="\$\{_nea\(r\.id\)\}" tabindex="0"/,
      'every move rung is reachable by keyboard');
    assert.match(src, /data-rl-rung-peek="\$\{_nea\(id\)\}" data-rung="0" tabindex="0"/,
      'and R0, which is the row the owner named first');
  });
  test('POINTING OPENS IT LOOSELY; PRESSING PINS IT, and the same press lets it go', () => {
    const src = strip(NEGO);
    assert.match(src, /rlPeekShow\(pcid, prid, \{ pinned: true/, 'a press pins');
    assert.match(src, /_rlPeek\.pinned[\s\S]{0,140}rlPeekHide\(true\)/,
      'the press that opens a sliding panel closes it');
    const hide = realBody(src, 'function rlPeekHide(');
    assert.match(hide, /if \(!force && _rlPeek && _rlPeek\.pinned\) return false/,
      'and pointing away cannot take a pinned card');
  });
  test('a press on a VERB inside the row is still that verb', () => {
    const src = strip(NEGO);
    assert.match(src, /peekRow && !\(t\.closest && t\.closest\('button,a,input,select,textarea'\)\)/,
      'the row stands down for anything pressable');
  });
  test('it finds whichever surface the ladder is drawn on', () => {
    const fn = realBody(strip(NEGO), 'function rlPeekShow(');
    assert.ok(fn, 'the mount exists');
    assert.match(fn, /closest\('#rl-cp'\)/, 'the clause panel');
    assert.match(fn, /closest\('\.ce-rail'\)/, 'and the clause editor\u2019s Ladder tab');
    assert.match(fn, /PORTAL_MODE/, 'never on their seat');
  });
  test('it sits OVER THE GREY, not over the wording', () => {
    const m = /\.redline-page \.rl-peek\{[\s\S]*?\}/.exec(NEGOCSS);
    assert.ok(m, 'the card is dressed');
    assert.match(m[0], /position:absolute/, 'a layer, not a column');
    assert.match(m[0], /right:100%/, 'on the seam between the cards and the paper\u2019s track');
    assert.match(m[0], /border-radius:0/, 'the contract keeps its square corner');
  });
  test('the wording scrolls inside the card rather than past the window', () => {
    const m = /\.redline-page \.rl-peek-body\{[\s\S]*?\}/.exec(NEGOCSS);
    assert.ok(m, 'the body is dressed');
    assert.match(m[0], /overflow:auto/, 'a forty-clause rung has a reachable foot');
    assert.match(m[0], /overscroll-behavior:contain/, 'and does not scroll the page behind it');
  });
  test('its words are in BOTH books', () => {
    for (const k of ['ng_peek_esc', 'ng_peek_none']) {
      assert.equal((I18N.match(new RegExp(k + ':', 'g')) || []).length, 2, k);
    }
  });
});

/* ============================================================
   THE STANDING NETS, asked of everything above
   ============================================================ */
describe('f329 (6) — every new name is published, and nothing writes that should not', () => {
  test('the new names are on their modules\u2019 window lists', () => {
    for (const [src, names] of [
      [SIGNCHECK, ['signCheckWillRun']],
      [CONTRACT, ['contractFieldKeyOf', 'contractFieldPeer', 'contractFieldLight',
        'contractFieldUnlight', 'contractFieldFocus', 'wireFieldLink']],
      [NEGO, ['negoBlanksOpen', 'negoBlanksAsk', 'negoBlanksFill', 'NG_BLANKS_NAMED',
        'rlRungPeekHtml', 'rlPeekShow', 'rlPeekHide', 'rlPeekLater', 'rlPeekOpenId']],
    ]) {
      const tail = src.slice(src.lastIndexOf('Object.assign(window'));
      for (const n of names) assert.ok(new RegExp('\\b' + n + '\\b').test(tail), n + ' is published');
    }
  });
  test('and every one of them is DEFINED, not just published', () => {
    for (const [src, names] of [
      [SIGNCHECK, ['signCheckWillRun']],
      [CONTRACT, ['contractFieldKeyOf', 'contractFieldPeer', 'contractFieldLight',
        'contractFieldUnlight', 'contractFieldFocus', 'wireFieldLink']],
      [NEGO, ['negoBlanksOpen', 'negoBlanksAsk', 'negoBlanksFill',
        'rlRungPeekHtml', 'rlPeekShow', 'rlPeekHide', 'rlPeekLater', 'rlPeekOpenId']],
    ]) {
      for (const n of names) {
        assert.ok(new RegExp('function ' + n + '\\(').test(src), n + ' has a body');
      }
    }
  });
});
