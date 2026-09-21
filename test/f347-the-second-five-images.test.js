/* F347 — THE SECOND FIVE IMAGES (Young ruled 21 Sep 2026)
   ======================================================
   *"ensure the dates match and the fonts (bold or not) in the artifact like in
   the image are reflected like for like in hati. Insights tab should be after
   home page. Image 2, the highlighted cards have nonsensical words in them ...
   Describe what you need area should be able to wrap text. Image 3, Hati is
   not writing contracts briefs and the open fields is not sharing anything
   meaningful. Image 4, first remove the lines running across the card ...
   The open doors should be buttons with outlines. Image 5, remove the line
   going across the card and also remove the number of days that appears in
   the Term."*

   WHAT BELONGS HERE rather than in five-images-two-verify: the SHAPE of the
   readings under those screens — that a day has one printer and it follows the
   language, that a provenance string can never be printed as a description,
   that every failed reading goes through one plain-English reading rather than
   four raw ones, and that the route stopped writing the string this is all
   about. The pixels are measured in the browser file. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
/* COMMENTS ARE PROSE: this file's own notes quote what it sweeps for. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

const REG  = read('js/views/register.js');
const CAL  = read('js/views/calendar.js');
const CSS  = read('index.html');
const WIZ  = read('js/wizard.js');
const TRI  = read('js/triage.js');
const BLK  = read('js/blanks.js');
const CTR  = read('js/views/contract.js');
const NEG  = read('js/views/negotiation-css.js');
const SRV  = read('server/server.js');
const I18N = read('js/i18n.js');

test('F347 — the second five images', async t => {

  /* ═══════ 1. THE DATES AND THE RAIL ═══════ */
  await t.test('(1) one day printer, and it is the artifact\'s shape', () => {
    const fn = /function regDotDate\(iso\)\{[\s\S]*?\n\}/.exec(REG);
    assert.ok(fn, 'regDotDate is readable');
    assert.match(fn[0], /month:'short'/, 'a short month, as the artifact prints it');
    assert.ok(!/padStart\(2,'0'\)\}\./.test(fn[0]), 'and not the dotted shape');
    /* THE MONTH FOLLOWS THE LANGUAGE, never jxLocale and never a hand-written
       English name — f148's standing sweep, asked here at the source. */
    assert.match(fn[0], /langLocale\(\)/);
    assert.ok(!/jxLocale/.test(fn[0]), 'a month never goes through the number locale');
    /* A DAY IS A DAY: the guard belongs on the ONE printer. */
    assert.match(fn[0], /isNaN\(d\.getTime\(\)\)/, 'it refuses rather than printing NaN');
  });

  await t.test('(1b) both date columns wear one class, and it is the figure face', () => {
    assert.match(REG, /class="reg-day"/);
    assert.equal((REG.match(/class="reg-day"/g) || []).length >= 2, true, 'signed and expiry');
    assert.match(CSS, /\.reg-table \.reg-day\{[^}]*font-family:var\(--font-mono\)/);
    assert.match(CSS, /\.reg-table \.reg-day\{[^}]*font-size:var\(--t-label\)/);
  });

  await t.test('(1c) Insights sits directly after Home in the rail markup', () => {
    const rail = CSS.slice(CSS.indexOf('data-section="work"'));
    const home = rail.indexOf('data-view="dashboard"');
    const intel = rail.indexOf('data-view="intel"');
    const reg = rail.indexOf('data-view="register"');
    assert.ok(home >= 0 && intel > home && reg > intel,
      'Home, then Insights, then Contracts — markup order is the whole of it');
  });

  await t.test('(1d) the density segment wears the artifact\'s own word', () => {
    assert.match(I18N, /reg_density_comfortable: 'Cozy'/);
    assert.ok(!/reg_density_comfortable: 'Comfortable'/.test(I18N));
    assert.match(I18N, /reg_density_comfortable: 'Luftig'/, 'the Swedish is untouched');
  });

  /* ═══════ 2. THE NEW AGREEMENT CARDS ═══════ */
  await t.test('(2) a provenance string is never printed as a description', () => {
    assert.match(WIZ, /const NA_PROVENANCE = /, 'the shape is named once');
    assert.match(WIZ, /function naCardSub\(r\)/, 'ONE reading of what a card says');
    assert.match(WIZ, /function naCardHint\(r\)/, 'and the provenance rides the hover');
    /* THE FALLBACK IS A FACT OFF THE RECORD, never a summary HaTi invented of
       a document nobody has described. */
    const fn = /function naCardSub\(r\)\{[\s\S]*?\n\}/.exec(WIZ)[0];
    assert.match(fn, /tplCategoryName/, 'the category, through the one presenting reading');
    assert.ok(!/api\(|fetch\(|copilot/i.test(fn), 'it asks no model and no route');
  });

  await t.test('(2b) AND THE ROUTE STOPPED WRITING IT — the real fix', () => {
    /* Where a document came from is `origin` and `source_type`, both stored one
       line down, and templateProvenanceHtml is what draws it. */
    assert.ok(!/`Converted from \$\{fileName\} \(original stored: \$\{fileId\}\)`/.test(SRV),
      'no route writes provenance into a description column');
    assert.match(SRV, /origin,source_contract_id/, 'origin is still stored');
  });

  /* RE-POINTED IN PLACE 21 Sep 2026 (Young: "still not the same size. Make
     them the same and not big either"). The RULE — the slot is always drawn
     and reserves a fixed number of lines — is exactly what this claim is
     about and is untouched; what moved is how many, from two to ONE, because
     "not big" is measured against the artifact's own ~80px card. And the
     reserve is no longer the sentence's alone: the name and the foot take one
     line each too, which is what actually made the cards equal — see
     f349 (1). Asked as the RELATION so a retune does not break it. */
  await t.test('(2c) the sentence slot is always drawn, and reserves its lines', () => {
    assert.match(WIZ, /<span class="na-about">/, 'always drawn — reserving is what fixes the height');
    const r = /\.na-door \.na-about\{[^}]*\}/.exec(CSS)[0];
    assert.match(r, /height:1\.4em/);
    assert.match(r, /line-height:1\.4/);
  });

  await t.test('(2d) the describe box is a textarea and keeps everything it had', () => {
    assert.match(WIZ, /<textarea id="dr-say" class="na-inp na-say"/);
    assert.ok(!/<input id="dr-say"/.test(WIZ));
    assert.match(WIZ, /maxlength="\$\{\(typeof DRAFT_SENTENCE_MAX/, 'the same cap');
    assert.match(WIZ, /e\.key==='Enter'&&!e\.shiftKey/, 'Enter still presses Find');
    assert.match(CSS, /\.na-inp\.na-say\{[^}]*height:auto/);
  });

  /* ═══════ 3. WHY A READING DID NOT HAPPEN, AND WHAT IS OPEN ═══════ */
  await t.test('(3) one reading turns a failure into words, and every step asks it', () => {
    assert.match(TRI, /function triageWhy\(e\)/);
    assert.match(TRI, /function triageFail\(e\)/);
    /* FOUR CATCHES PRINTED A RAW MESSAGE AND ONE WAS REPORTED. A fix at one of
       four call sites is waiting for the next one. */
    assert.ok(!/String\(e && e\.message \|\| e\)/.test(strip(TRI)),
      'no step prints a transport error straight onto a tile');
    /* SIX: the five steps of the run plus the risk scan's own. Pinned as the
       COUNT OF CATCHES rather than a number typed once — a seventh step that
       printed a raw message would have to add a catch, and the sweep above
       would fail on it. */
    assert.equal((TRI.match(/= triageFail\(e\);/g) || []).length,
      (strip(TRI).match(/\}catch\s*\(e\)\s*\{\s*t\.steps\./g) || []).length,
      'every step catch goes through it');
    const fn = /function triageWhy\(e\)\{[\s\S]*?\n\}/.exec(TRI)[0];
    for (const k of ['tri_why_nokey', 'tri_why_ratelimit', 'tri_why_spend', 'tri_why_provider', 'tri_why_offline'])
      assert.match(fn, new RegExp(k), k + ' is one of the kinds');
    assert.match(fn, /return \{ say, raw \}/, 'the technical sentence is kept, not thrown away');
  });

  await t.test('(3b) all five sentences are in BOTH books', () => {
    for (const k of ['tri_why_nokey', 'tri_why_ratelimit', 'tri_why_spend', 'tri_why_provider', 'tri_why_offline'])
      assert.equal(I18N.split(k + ':').length, 3, k + ' is in both dictionaries');
  });

  await t.test('(3c) the open fields have names, from ONE reading of both kinds', () => {
    assert.match(BLK, /function contractOpenFieldNames\(c\)/);
    assert.match(BLK, /BLANK_NONE_REASONS, contractBlanksNone, contractOpenFieldNames,/,
      'published — a name another module reads must leave its file');
    const fn = /function contractOpenFieldNames\(c\)\{[\s\S]*?\n\}/.exec(BLK)[0];
    assert.match(fn, /tplFormOpenFields/, 'a company standard\'s declared list');
    assert.match(fn, /contractBlanksOpen/, 'and everything else\'s blanks in the paper');
    assert.ok(!/api\(|fetch\(|persist\(/.test(fn), 'no route, no store');
    /* ONE FILTER, NOT TWO: the count is derived from the list rather than
       written a second time. */
    assert.match(CTR, /function tplFormOpenCount\(c\)\{ return tplFormOpenFields\(c\)\.length; \}/);
  });

  /* RE-POINTED IN PLACE 21 Sep 2026. The claim — the tile NAMES the open
     fields rather than describing the screen — stands and is asked below.
     What went is the "— N more" tail: the total moved onto the CHIP, and two
     numbers about one thing on one tile is what Young reported reading as
     nothing at all. The tail survives on the FILLED branch, where the chip
     counts what was filled and the tail says what was left — two real facts. */
  await t.test('(3d) and the tile names them rather than describing the screen', () => {
    assert.match(TRI, /const openNames = \(fillNone === 'form'/);
    assert.match(TRI, /contractOpenFieldNames\(c\)/);
    assert.match(TRI, /\(fillNone === 'form' && openNames\.length\)\s*\n?\s*\? openNames\.slice\(0, 3\)/,
      'the first few, by name');
    assert.match(TRI, /i18tn\('tri_fill_left', fl\.left/, 'and the filled branch keeps its own tail');
  });

  /* ═══════ 4. WHAT COPILOT READ ═══════ */
  await t.test('(4) the colour is the RESULT, not whether the reading ran', () => {
    assert.match(CTR, /const OV_READ_TONE=\{ yes:'green', no:'', stale:'amber', look:'amber', bad:'ruby' \};/);
    /* Each row works out its own beside the figure it is about. */
    assert.match(CTR, /state:hasBrief\?\(briefPart\?'look':'yes'\):'no'/, 'a cut-short brief wants you');
    assert.match(CTR, /\(dev\?'look':'yes'\)/, 'departures are work');
    assert.match(CTR, /\(high\?'bad':\(open\?'look':'yes'\)\)/, 'a high finding is serious');
  });

  await t.test('(4b) no rule runs across the card, and the door is an outlined button', () => {
    const block = /\.ov-reads\{[\s\S]*?\.ov-reads \.ov-r-d\{[^}]*\}/.exec(CSS);
    assert.ok(block, 'the table block is readable');
    assert.ok(!/border-bottom:1px/.test(block[0]), 'no row or head rule');
    assert.match(CSS, /\.ov-reads \.ov-r-s\{ font-weight:var\(--w-strong\); \}/);
    assert.match(CTR, /<td class="ov-r-d">\$\{r\.tab\?`<button type="button" class="ui-btn"/);
    assert.ok(!/class="ui-btn-plain" style="font-size:var\(--t-label\)" data-ov-read-go/.test(CTR));
  });

  /* ═══════ 5. THE NEGOTIATE HEAD ═══════ */
  await t.test('(5) no line across the head card', () => {
    const rule = /\.redline-page #ws-head\{[\s\S]*?\n    align-items:center\}/.exec(NEG);
    assert.ok(rule, 'the head rule is readable');
    assert.ok(!/box-shadow:inset 0 -1px/.test(strip(rule[0])),
      'the inset rule is gone — and the room\'s own band never drew one');
  });

  await t.test('(5b) the Term says its length once', () => {
    assert.match(CTR, /const termCell=term;/);
    assert.ok(!/ct_fact_days',\{n:daysLeft\}/.test(CTR), 'the day count is off this row');
    /* STALE ON THE FACE, live elsewhere — a key is retired by not calling it. */
    assert.equal(I18N.split('ct_fact_days:').length, 3, 'and the key stays in both books');
  });
});
