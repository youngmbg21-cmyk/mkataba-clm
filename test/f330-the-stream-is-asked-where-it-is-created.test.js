/* ============================================================
   f330 — THE HOVER CARD IS PUT AWAY, THE BUTTON IS RENAMED, AND THE VALUE
   STREAM IS ASKED WHERE THE CONTRACT IS MADE
   ============================================================
   Young, 18 Sep 2026, three asks in one message:

     · *"Remove the hovering feature in the ladder card for now"* — the card a
       rung opened on a point. "For now" is not "delete it": the builder, its
       stylesheet rules and its two words are KEPT and dormant, and what
       survives is the PRESS, which takes the reader to that clause on the
       paper and is the larger door the card was ever a shortcut to.

     · *"Highlighted button should be named '+ Build new template'"* — the
       filled button on the Templates page.

     · *"As for the converting a document option, there should have an option
       to categorize it into a Value Stream. All created contracts should have
       a door to being categorized by value stream."*

   MEASURED BEFORE ANYTHING MOVED, and the third was true of every door but
   one: the UPLOAD asked which stream and nothing else did. The wizard, the
   company-standard door, the saved-template door and bulk creation all took
   the stream SILENTLY off the template — and a template serves more than one
   part of a business, so a supply agreement drafted by procurement landed
   wherever that template happened to be filed. After creation, moving it is
   an admin's act by the owner's own 14 Aug ruling, so for everybody else
   there was no door at all. "Convert a document" asked for neither a category
   nor a stream while the dialog beside it asked for both.

   Every claim below is red at the parent except those named as controls.
   ============================================================ */
const test = require('node:test');
const { describe } = test;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* THE SWEEPS READ CODE, NOT PROSE — the notes beside each change name the very
   things they forbid, so a grep over raw source would find the explanation and
   report it as the fault. */
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const NEGO = read('js/views/negotiation.js');
const NEGOCSS = read('js/views/negotiation-css.js');
const TPLS = read('js/templates.js');
const TFLD = read('js/templatefields.js');
const WIZ = read('js/wizard.js');
const TLIB = read('js/views/templatelib.js');
const LIB = read('js/views/library.js');
const SRV = read('server/server.js');
const I18N = read('js/i18n.js');

/* A function's whole body, found by its signature and read to the brace that
   closes it — never a byte count, which is the trap this suite has paid for
   three times in one week. The parameter list is skipped so `opts = {}` cannot
   be mistaken for the body's own opening brace. */
const bodyOf = (src, sig) => {
  const at = src.indexOf(sig);
  if (at < 0) return '';
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
const realBody = (src, sig) => {
  const b = bodyOf(src, sig);
  assert.ok(b.length > sig.length + 40, sig + ' has a body to read');
  return b;
};

describe('f330 (1) — the hover card is dormant, not deleted', () => {
  test('nothing opens it any more, and the doors are GONE rather than guarded', () => {
    const src = strip(NEGO);
    assert.ok(!/_rlPeekWired/.test(src), 'the listener block is removed');
    assert.ok(!/addEventListener\('mouseover'/.test(src), 'nothing answers a point');
    assert.ok(!/addEventListener\('mouseout'/.test(src), 'nothing answers a point away');
    assert.ok(!/rlPeekShow\(cid, rid/.test(src), 'and no door calls the builder');
  });
  test('a listener on every mouse movement that answers nothing is a cost with no reader', () => {
    /* THE REASON IT IS A DELETION AND NOT A `return` AT THE TOP OF A HANDLER:
       mouseover fires for every element the pointer crosses. */
    const src = strip(NEGO);
    assert.equal((src.match(/document\.addEventListener\('keydown'/g) || []).length >= 1, true,
      'the keys that still have an act keep their listener');
    assert.match(src, /document\._rlRungKeysWired/, 'and it is armed once, by its own flag');
  });
  test('the builder answers no before it draws, and is otherwise untouched', () => {
    const fn = realBody(strip(NEGO), 'function rlPeekShow(');
    /* IT STANDS DOWN BEFORE IT READS ANYTHING — measured as the ORDER, because
       the body's own first line has always been an `if (!c) return false`, and
       a claim that only asked for a `return false` near the top would pass
       against the version that still drew the card. */
    assert.ok(fn.indexOf('return false;') < fn.indexOf('rlLadderContract()'),
      'nothing is looked up before it refuses');
    assert.match(fn, /rlRungPeekHtml\(c, clauseId, rungId\)/, 'and the rest of it is still there');
  });
  test('FOR NOW MEANS KEPT: the card, its words and its rules all survive', () => {
    assert.match(NEGO, /function rlRungPeekHtml\(/, 'the builder');
    assert.match(NEGOCSS, /\.redline-page \.rl-peek\{/, 'its sheet');
    for (const k of ['ng_peek_esc', 'ng_peek_none']) {
      assert.equal((I18N.match(new RegExp(k + ':', 'g')) || []).length, 2, k + ' stays in both books');
    }
  });
  test('the PRESS survives, because it is the larger door', () => {
    const src = strip(NEGO);
    assert.match(src, /rlLadderGoClause\(peekRow\.getAttribute\('data-rl-rung-peek'\)/,
      'a press on the row still goes to the clause');
    assert.match(src, /rlLadderGoClause\(row\.getAttribute\('data-rl-rung-peek'\), row\)/,
      'and Enter and Space still reach the same reading');
    assert.match(NEGOCSS, /\.rl-rung-row\[data-rl-rung-peek\]\{cursor:pointer\}/,
      'so the row still says it can be pressed');
  });
});

describe('f330 (2) — the button says what it does', () => {
  test('"+ Build new template", in both books', () => {
    assert.match(I18N, /lib_new_template: '\+ Build new template'/, 'English');
    assert.match(I18N, /lib_new_template: '\+ Bygg ny mall'/, 'Swedish');
    assert.equal((I18N.match(/lib_new_template:/g) || []).length, 2, 'one key, two books');
  });
  test('and it is still the one key the page draws', () => {
    /* RE-POINTED 18 Sep 2026: this allowed 160 characters between the id and
       the key, and the new-paper grant put a `disabled title=` expression
       between them. PIN THE REGION, NOT A BYTE COUNT — the region is the
       button element, and it is read to its own closing tag. */
    const src = strip(LIB);
    const at = src.indexOf('id="tpl-new"');
    assert.ok(at > 0, 'the button is drawn');
    const el = src.slice(at, src.indexOf('</button>', at));
    assert.match(el, /i18t\('lib_new_template'\)/,
      'the button reads the key rather than a literal');
  });
});

describe('f330 (3) — converting a document files it', () => {
  test('the dialog asks with the SAME builder the other dialog uses', () => {
    const fn = realBody(strip(TLIB), 'function tplLibUploadModal(');
    assert.match(fn, /tplLibCatStreamRowHtml\('tpllib-up-cat', 'tpllib-up-stream'/,
      'one builder, so the two screens cannot ask the question differently');
    assert.match(fn, /tplLibWireCatStream\('tpllib-up-cat', 'tpllib-up-stream'\)/,
      'and one wiring, so neither grows a dead option');
  });
  test('a sentinel never reaches the route', () => {
    const fn = realBody(strip(TLIB), 'function tplLibUploadModal(');
    assert.match(fn, /category: tplLibPick\('tpllib-up-cat', 'other'\)/, 'the category through the guard');
    assert.match(fn, /folder: tplLibPick\('tpllib-up-stream', ''\) \|\| null/, 'and the stream');
    assert.ok(!/document\.getElementById\('tpllib-up-stream'\)\.value/.test(fn),
      'never read raw off the box');
  });
  test('THE SERVER FILES IT, with the same two readings the other route uses', () => {
    const src = strip(SRV);
    const at = src.indexOf("app.post('/api/templates/upload'");
    assert.ok(at > 0, 'the route is there');
    const region = src.slice(at, src.indexOf("app.post('/api/templates/upload'", at + 10) > 0
      ? src.indexOf("app.post('/api/templates/upload'", at + 10) : at + 9000);
    assert.match(region, /INSERT INTO templates \(id,org_id,name,description,category,folder,/,
      'the row carries a folder now');
    assert.match(region, /tplFolderOf\(b\.folder\)/, 'read by the route that already had this question');
    assert.match(region, /TPL_CATEGORIES\.includes\(b\.category\)/, 'and the category by its own list');
  });
});

describe('f330 (4) — every creation door asks where it is filed', () => {
  /* PIN THE REGION, NOT A BOUNDARY THAT HAPPENS TO HOLD. This read to the
     first `];` in the file after the declaration — which was the list's own
     terminator only while no field carried an inline array. The moment one did
     (the side question's `opts`, 18 Sep 2026) the region stopped at that
     field and the claim went red over a list that still said what it says.
     The terminator at the START OF A LINE is the list's own. */
  const listEnd = (src, at) => { const i = src.indexOf('\n];', at); return i < 0 ? src.length : i; };
  test('the built-in templates ask it, as their LAST question', () => {
    const src = strip(TPLS);
    const at = src.indexOf('const TEMPLATE_BASE_FIELDS');
    const end = listEnd(src, at);
    const list = src.slice(at, end);
    assert.match(list, /key:'folder'[\s\S]{0,140}type:'stream'[\s\S]{0,60}maps:'folder'/,
      'the field is declared and mapped');
    assert.ok(list.indexOf("key:'folder'") > list.indexOf("key:'expiry'"),
      'filing comes after the terms of the agreement');
    assert.ok(!/key:'folder'[^}]*required:true/.test(list), 'and it is never required');
  });
  test('the TEMPLATE’S own stream is the answer already in the box, written by descriptor', () => {
    const fn = realBody(strip(TPLS), 'function builtinTemplateFields(');
    assert.match(fn, /_tplCloneField/, 'the list is cloned first');
    assert.match(fn, /out\.find\(f=>f\.key==='folder'\)/, 'and the default is written on the COPY');
    /* THE ORDER IS THE CLAIM: the clone happens BEFORE anything is written, so
       the thing written to is `out`'s own copy and never TEMPLATE_BASE_FIELDS
       itself — which would freeze one template's filing onto all twelve. */
    assert.ok(fn.indexOf('_tplCloneField') < fn.indexOf('.def ='),
      'the list is copied before a default is written');
    assert.ok(!/TEMPLATE_BASE_FIELDS\.find/.test(fn), 'and the shared list is never reached into');
  });
  test('the essentials form asks the same question, for the two template doors', () => {
    const src = strip(TFLD);
    const at = src.indexOf('const CONTRACT_ESSENTIALS');
    const list = src.slice(at, listEnd(src, at));
    assert.match(list, /key:'folder'[\s\S]{0,120}type:'stream'[\s\S]{0,40}maps:'folder'/);
  });
  test('and the caller’s stream reaches the box BY DESCRIPTOR, never by reference', () => {
    const fn = realBody(strip(TFLD), 'function openContractEssentials(');
    assert.match(fn, /Object\.getOwnPropertyDescriptors\(f\)/,
      'the getter trap, in its filing costume');
    assert.match(fn, /cl\.def = String\(o\.folder \|\| ''\)/, 'the copy takes the default');
  });
  test('BOTH FORMS DRAW THE PRODUCT’S OWN LIST, and bind the product’s own binder', () => {
    for (const [src, who] of [[strip(WIZ), 'the wizard'], [strip(TFLD), 'the essentials form']]) {
      assert.match(src, /type==='stream'/, who + ' draws a stream');
      assert.match(src, /folderOptionsHtml\(/, who + ' uses the one list');
      assert.match(src, /bindFolderSelect\(/, who + ' binds the one binder, so "+ New" works');
    }
  });
  test('the company-standard door SENDS it, and the route already checked it', () => {
    const src = strip(TLIB);
    assert.match(src, /folder: \(t && t\.folder\) \|\| ''/, 'the template’s stream prefills the form');
    assert.match(src, /folder: essentials\.folder \|\| ''/, 'and the answer travels');
    const rt = strip(SRV);
    const at = rt.indexOf("app.post('/api/templates/:id/contracts'");
    assert.ok(at > 0);
    const region = rt.slice(at, at + 2000);
    assert.match(region, /inScope\(scope, folder\)/,
      'THE SERVER IS THE WALL: a stream out of the reader’s reach is refused');
  });
  test('the saved-template door asks it too, on the form its own blanks do not carry', () => {
    const src = strip(LIB);
    assert.match(src, /id="tf-folder"/, 'the box is drawn');
    assert.match(src, /bindFolderSelect\(document\.getElementById\('tf-folder'\)\)/, 'and wired');
    assert.match(src, /buildFromCustomTemplate\(t, values, \{ counterpartyEmail:cpEmail\.trim\(\), party, folder \}\)/,
      'the answer travels with the other two record facts');
    assert.match(src, /folder:\(opts&&FOLDERS\[opts\.folder\]\) \? opts\.folder : \(FOLDERS\[t\.folder\]\?t\.folder:'corp'\)/,
      'the reader’s answer, else the template’s, else Other — one rung added on top');
  });
  test('THE VALUE IS STILL WALLED: only a real stream reaches the record', () => {
    /* A CONTROL where it matters: applyTemplateValues has always refused a
       folder that is not on the map, and adding a picker must not widen it. */
    const src = strip(TFLD);
    assert.match(src, /case 'folder': if\(FOLDERS\[v\]\) c\.folder=String\(v\); break;/,
      'the wall the new field files through is unchanged');
  });
  test('the label is one word in both books, and it is the one the other dialogs use', () => {
    assert.equal((I18N.match(/tl_stream:/g) || []).length, 2, 'tl_stream in both books');
    assert.match(strip(TPLS), /i18t\('tl_stream'\)/, 'the wizard’s field reads it');
    assert.match(strip(TFLD), /i18t\('tl_stream'\)/, 'the essentials field reads it');
    assert.match(strip(LIB), /i18t\('tl_stream'\)/, 'and the saved-template door');
  });
});
