/* F346 — FIVE OFF FIVE IMAGES (Young ruled 21 Sep 2026)
   =====================================================
   *"Image 1, you have not added the highlighted area. Image 2, remove expiring
   in 30 and 60 days. Delete condensed. And the highlighted filters do not work
   properly and have not been pipped properly as they do not work at all. Image
   3, Hati horizon calendar needs to resemble what is in the artifact and image
   3. Image 4, the shared area needs to cover the entire button. Make this
   happen anywhere this is not the rule. Image 5, add a bit of color on pop ups
   that are completely bland."*

   WHY THESE ARE SOURCE CLAIMS AND THE BROWSER FILE CARRIES THE REST. Three of
   the five are GEOMETRY and are measured in a real page (five-images-verify):
   whether a press on a chip opens anything, whether a lit segment fills its
   button, where the verbs sit on a row. What belongs HERE is the shape that
   makes those geometries possible and the readings behind the new column —
   and, for the filter chips in particular, the ABSENCE of the rule that hid
   the control, because a rule deleted is the whole of that fix. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

/* COMMENTS ARE PROSE, and this file's own notes quote the expressions it is
   sweeping for. A sweep that reads CODE has to strip them first — the lesson
   f277 (18) paid for on 19 Sep 2026, in this costume. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const REG  = read('js/views/register.js');
const REGC = strip(REG);
const CAL  = read('js/views/calendar.js');
const CSS  = read('index.html');
const CORE = read('js/core.js');
const I18N = read('js/i18n.js');

test('F346 — five off five images', async t => {

  /* ═══════ 1. HOME'S PREPARED ROW KEEPS ITS VERBS AT THE RIGHT ═══════ */
  await t.test('(1) the desk row is a row, and its verbs sit at the right wall', () => {
    assert.match(CSS, /\.hm-row\.is-desk\{[^}]*display:flex/,
      'the prepared row lays out as a row');
    assert.match(CSS, /\.hm-row\.is-desk \.hm-desk-head\{[^}]*flex:1/,
      'the text takes the give');
    assert.match(CSS, /\.hm-row\.is-desk \.hm-desk-acts\{[^}]*margin-left:auto/,
      'and the verbs are pushed to the right wall');
    assert.match(CSS, /\.hm-row\.is-desk\{[^}]*flex-wrap:wrap/,
      'AND IT WRAPS — a narrow card drops the verbs under the sentence rather '
      + 'than squeezing it');
  });

  await t.test('(1b) the auto-triage row is NOT swept — it is a different surface', () => {
    assert.match(CSS, /\.hm-row\.is-tri\{[^}]*display:block/,
      'is-tri keeps the stack it was designed with');
    assert.ok(!/\.hm-row\.is-tri,\.hm-row\.is-desk\{display:block/.test(CSS),
      'and the two no longer share one layout rule');
  });

  await t.test('(1c) the English verb says what the act does, as the Swedish always has', () => {
    /* The confirm's own message says in BOTH books that nothing is deleted,
       and the Swedish button has read "Lägg undan" — put away — since the desk
       was built. Only the English word claimed otherwise, on the button. */
    assert.match(I18N, /desk_discard: 'Put away'/);
    assert.match(I18N, /desk_discard_all: 'Put all away'/);
    assert.match(I18N, /desk_discard: 'Lägg undan'/, 'the Swedish is untouched');
    assert.ok(!/desk_discard: 'Discard'/.test(I18N));
  });

  /* ═══════ 2. THE CONTRACTS PAGE ═══════ */
  await t.test('(2a) the two expiry windows inside 90 days are off the row', () => {
    const views = /const REG_VIEWS=\[([\s\S]*?)\n\];/.exec(REG);
    assert.ok(views, 'REG_VIEWS is readable');
    assert.ok(!/'expiring60'/.test(views[1]), 'no 60-day tab');
    assert.ok(!/'expiring30'/.test(views[1]), 'no 30-day tab');
    assert.match(views[1], /'expiring90'/, '90 stays — it is the renewal window');
  });

  await t.test('(2a2) and the FILTERS stay, because two Home tiles are doors onto them', () => {
    /* Taking the branches out with the tabs would leave the optional
       `expiring30` / `expiring60` tiles narrowing nothing. */
    assert.match(REG, /R\.view==='expiring60'/);
    assert.match(REG, /R\.view==='expiring30'/);
    assert.match(read('js/views/home.js'), /view:'expiring30'/);
    assert.match(read('js/views/home.js'), /view:'expiring60'/);
  });

  await t.test('(2b) condensed is gone from the ladder, and nothing branches on it', () => {
    const dens = /const REG_DENSITY = \{([\s\S]*?)\n\};/.exec(REG);
    assert.ok(dens, 'REG_DENSITY is readable');
    assert.ok(!/\bcondensed\s*:/.test(dens[1]), 'condensed is off the ladder');
    assert.match(dens[1], /\bcomfortable\s*:/);
    assert.match(dens[1], /\bcompact\s*:/);
    assert.ok(!/regDensity\(\)\s*[!=]==\s*'condensed'/.test(REGC),
      'and no reading guards on a rung that cannot happen');
  });

  await t.test('(2b2) the segment offers whatever is on the ladder, never a typed list', () => {
    /* A typed list is how a deleted rung comes back as a dead button. */
    assert.match(REG, /regSegHtml\('data-reg-density',Object\.keys\(REG_DENSITY\)/);
  });

  await t.test('(2c) THE CHIP IS THE CONTROL — the rule that hid it is DELETED', () => {
    /* MEASURED before the fix: the chip drew 93x30 and its <select> 22x28 in
       rgba(0,0,0,0), and the centre of the chip hit-tested to the label span.
       This claim is the ABSENCE of that rule, because a rule deleted is the
       whole of the fix. */
    assert.ok(!/\.reg-chip:not\(\.on\):not\(\.reg-chip-show\) select\{width:22px/.test(CSS),
      'no rule shrinks a resting chip’s control to a 22px sliver');
    assert.ok(!/color:transparent!important/.test(
      (/\.reg-filterbar \.reg-chip[\s\S]{0,1400}?\.reg-chip:hover/.exec(CSS) || ['', ''])[0]),
      'and nothing paints the control invisible while leaving it the only door');
  });

  await t.test('(2c2) the control covers the chip, and the chip says what is chosen', () => {
    assert.match(CSS, /\.reg-filterbar \.reg-chip\{[^}]*position:relative/);
    assert.match(CSS, /\.reg-filterbar \.reg-chip-sel\{[^}]*position:absolute;inset:0/,
      'the select is an overlay across the whole chip');
    assert.match(CSS, /\.reg-filterbar \.reg-chip-sel\{[^}]*opacity:0/);
    assert.match(REG, /const selChosen=/, 'ONE reading of what is chosen');
    assert.match(REG, /class="reg-chip-sel"/, 'and the builder marks the overlay');
    /* AND IT NO LONGER CARRIES A DROPDOWN'S INLINE DRESS — that block is what
       the old rules had to shout !important at, which is how a rule shrinking
       the control to 22px came to look reasonable. */
    const f = /const selFilter=\(id,opts,active,title,label,show\)=>\{[\s\S]*?\n  \};/.exec(REG);
    assert.ok(f, 'selFilter is readable');
    assert.ok(!/\$\{selStyle\}/.test(f[0]), 'selStyle is off the chip’s control');
  });

  await t.test('(2c3) nothing in the chip rules shouts !important any more', () => {
    const block = /\.reg-filterbar \.reg-chip\{[\s\S]*?\.reg-filterbar \.reg-chip:hover\{[^}]*\}/.exec(CSS);
    assert.ok(block, 'the chip block is readable');
    assert.ok(!/!important/.test(block[0]),
      'the builder stopped inlining a dropdown, so this sheet is the only thing talking');
  });

  /* ═══════ 3. THE HORIZON'S DECISION COLUMN ═══════ */
  await t.test('(3) the ruler and the row both carry a third track', () => {
    assert.match(CAL, /\.cal-hz-ruler\{display:grid;grid-template-columns:300px minmax\(0,1fr\) 150px/);
    assert.match(CAL, /\.cal-hz-row\{display:grid;grid-template-columns:300px minmax\(0,1fr\) 150px/);
    assert.match(CAL, /class="cal-hz-col cal-hz-col-dec"/, 'the head names it');
    assert.match(CAL, /class="cal-hz-dec \$\{dec\.k\}"/, 'and every row carries a cell');
  });

  await t.test('(3b) every word of it is BORROWED — nothing here works anything out', () => {
    const fn = /function calHorizonDecision\(r\)\{[\s\S]*?\n\}/.exec(CAL);
    assert.ok(fn, 'calHorizonDecision is readable');
    assert.match(fn[0], /renewalDecisionOf/, 'the one predicate every nag asks');
    assert.match(fn[0], /rn_ans_/, 'and the answer’s own word');
    assert.ok(!/new Date\(|Date\.now|\.getTime\(/.test(fn[0]),
      'it computes no date of its own');
    /* READING MUST NOT WRITE: nothing here initialises a negotiation, a
       renewal or anything else. */
    assert.ok(!/negoInit|renewalDecide|persist\(/.test(fn[0]));
  });

  await t.test('(3c) three states, and the absent one says nothing rather than guessing', () => {
    const fn = /function calHorizonDecision\(r\)\{[\s\S]*?\n\}/.exec(CAL)[0];
    assert.match(fn, /is-done/); assert.match(fn, /is-open/); assert.match(fn, /is-none/);
    assert.match(fn, /if\(r\.notice\)/,
      'an open question is drawn only where there IS a deadline');
    for (const k of ['cal_hz_decision', 'cal_hz_dec_done', 'cal_hz_dec_open', 'cal_hz_dec_none']) {
      assert.ok(I18N.split(k + ':').length === 3, k + ' is in BOTH books');
    }
  });

  await t.test('(3d) the day is printed by the reading this page already prints days with', () => {
    /* A raw ISO string is what a screen shows when it reaches for a formatter
       that is not on the stage — measured, `fmtDDay` is not published. */
    const fn = /function calHorizonDecision\(r\)\{[\s\S]*?\n\}/.exec(CAL)[0];
    assert.match(fn, /window\.regDotDate\?regDotDate\(day\):day/);
    assert.ok(!/fmtDDay/.test(fn));
  });

  /* ═══════ 4. THE LIT HALF FILLS ITS BUTTON ═══════ */
  await t.test('(4) the box clips and the halves stretch — .doc-read-seg’s own mechanism', () => {
    assert.match(CAL, /\.cal-seg\{display:inline-flex;align-items:stretch/,
      'stretch, never center — center sizes each half to its own line box');
    assert.match(CAL, /\.cal-seg\{[^}]*overflow:hidden/);
    assert.match(CAL, /\.cal-seg span,\.cal-seg a,\.cal-seg button\{[^}]*height:100%/);
    /* AND NOT A SECOND SET OF HEIGHTS, which would have to be kept in step
       with the group's for ever. */
    assert.ok(!/\.cal-seg span,\.cal-seg a,\.cal-seg button\{[^}]*height:2[0-9]px/.test(CAL));
  });

  /* ═══════ 5. A BIT OF COLOUR ON THE FRAME ═══════ */
  await t.test('(5) all three dialog frames carry one rule, said once', () => {
    assert.match(CORE, /const DLG_TOPBAR = t =>/, 'ONE declaration');
    const uses = CORE.match(/\$\{DLG_TOPBAR\(/g) || [];
    assert.equal(uses.length, 3, 'openModal, confirmDialog and promptDialog');
    assert.match(CORE, /DLG_TOPBAR\(danger\?'var\(--danger\)':'var\(--accent-fill\)'\)/,
      'and a dangerous question wears the danger tone');
  });

  await t.test('(5b) it is a background, not an element — no dialog moves by a pixel', () => {
    const fn = /const DLG_TOPBAR = t =>[^\n]*/.exec(CORE)[0];
    assert.match(fn, /linear-gradient/);
    assert.match(fn, /100% 3px no-repeat/);
    assert.match(fn, /var\(--color-surface\)/, 'the surface is still under it');
    assert.ok(!/::before|<span|<div/.test(fn), 'no markup is added');
    /* IT IS WRITTEN INTO THE INLINE STYLE because that is the only place that
       beats it: the frame states its own `background` shorthand there, and a
       stylesheet rule would lose to it while looking correct. */
    assert.ok(!/background:var\(--color-surface\);border:1px solid var\(--color-divider\);box-shadow:var\(--shadow-lg\);border-radius:var\(--radius-lg\)/
      .test(CORE), 'no frame still states a bare surface background');
  });
});
