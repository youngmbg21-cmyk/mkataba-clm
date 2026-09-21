/* F348 — THE NAME, THE TAG, THE CHOICES AND THE HORIZON (Young, 21 Sep 2026)
   ========================================================================
   *"In the prepared redlines ... Copilot added the name of the clause when the
   name of the clause was already there. Ensure copilot does not duplicate
   information. Image 2, the card in hati does not include the highlighted
   features so fix this. Image 3, the outline of the drop down should have soft
   corners and i need to see the choices in the dropdowns as currently they are
   white and blending in to the background. Image 4 shows the calendar i want
   which is in the artifact and image 5 shows what is currently in hati and do
   not want. In the new calendar, make sure the contracts and dates scroll under
   the first line that has Agreement and the months."* */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

const PB   = read('js/playbook.js');
const HOME = read('js/views/home.js');
const CAL  = read('js/views/calendar.js');
const CSS  = read('index.html');
const SRV  = read('server/server.js');
const I18N = read('js/i18n.js');

/* The reading under test, lifted out and run for real — a regex this narrow
   is only worth pinning by BEHAVIOUR. `richToText` is the one name it reaches
   for and it only does so where headingText is absent. */
const heads = (() => {
  /* GUARDED: a build without the reading must REPORT its failures rather than
     throw the whole file away — a probe that throws proves nothing. The
     stand-in answers the input unchanged, which is exactly the fault. */
  try {
    const parts = [/function pbClauseHeadWords[\s\S]*?^\}/m, /^const _pbHeadFold = [^\n]*/m,
      /function pbDropRepeatedHeading[\s\S]*?^\}/m].map(re => re.exec(PB));
    if (parts.some(m => !m)) throw new Error('not built');
    // eslint-disable-next-line no-new-func
    return new Function('window', parts.map(m => m[0]).join('\n')
      + '\nreturn { pbDropRepeatedHeading, pbClauseHeadWords };')(
      { richToText: h => String(h).replace(/<[^>]*>/g, '') });
  } catch (e) {
    return { pbDropRepeatedHeading: t => t, pbClauseHeadWords: c => String((c && c.headingText) || '') };
  }
})();

test('F348 — the name, the tag, the choices and the horizon', async t => {

  /* ═══════ 1. A CLAUSE'S NAME IS NOT PART OF ITS WORDING ═══════ */
  await t.test('(1) the repeated heading is cut, and the wording is kept whole', () => {
    const cl = { headingText: '3. Stock Accuracy & Temperature SLA' };
    /* THE OWNER'S OWN CASE, verbatim from the screenshot. */
    assert.equal(heads.pbDropRepeatedHeading(
      '3.  Stock Accuracy & Temperature SLA.  The Provider shall maintain 99% stock accuracy.', cl),
      'The Provider shall maintain 99% stock accuracy.');
    assert.equal(heads.pbDropRepeatedHeading(
      'Stock Accuracy & Temperature SLA. The Provider shall maintain.', cl),
      'The Provider shall maintain.');
    assert.equal(heads.pbDropRepeatedHeading(
      'Stock Accuracy & Temperature SLA: the Provider shall maintain.', cl),
      'the Provider shall maintain.');
  });

  /* A NAMED CONTROL: it passes at the parent too, because the stand-in above
     answers the input unchanged — which is exactly "refuses". It is here to
     hold the refusals still once the reading exists, not to prove it does. */
  await t.test('(1b) IT REFUSES RATHER THAN GUESSES [control]', () => {
    const cl = { headingText: '3. Stock Accuracy & Temperature SLA' };
    /* Wording that merely shares a word with its heading is untouched. */
    assert.equal(heads.pbDropRepeatedHeading('Stock levels shall be reported weekly.', cl),
      'Stock levels shall be reported weekly.');
    /* A proposal that is ONLY the heading is handed back whole — the funnel's
       own empty-insert and no-op guards answer for it. */
    assert.equal(heads.pbDropRepeatedHeading('3. Stock Accuracy & Temperature SLA', cl),
      '3. Stock Accuracy & Temperature SLA');
    /* A ONE-WORD HEADING IS TOO LIKELY TO BE A REAL OPENING WORD. */
    assert.equal(heads.pbDropRepeatedHeading('Term. The term runs three years.', { headingText: '4. Term' }),
      'Term. The term runs three years.');
    /* Another clause's name is not this one's. */
    assert.equal(heads.pbDropRepeatedHeading('Payment. The Client shall pay.', { headingText: '2. Service Charge' }),
      'Payment. The Client shall pay.');
  });

  await t.test('(1c) the drafter\'s own number is not part of the name', () => {
    assert.equal(heads.pbClauseHeadWords({ headingText: '3.1. Stock Accuracy' }), 'Stock Accuracy');
    assert.equal(heads.pbClauseHeadWords({ headingText: '(4) Term' }), 'Term');
    assert.equal(heads.pbClauseHeadWords({ headingText: 'Governing Law' }), 'Governing Law');
  });

  await t.test('(1d) it is the WALL, at the one reading every proposal goes through', () => {
    assert.match(PB, /function pbFitWording\(cl,v,preferred,draft\)\{\n[^\n]*\n  if\(draft\) draft = pbDropRepeatedHeading\(draft, cl\);/,
      'applied at the top, so both branches and both callers inherit it');
    assert.match(PB, /pbClauseHeadWords,pbDropRepeatedHeading,/, 'published');
    /* THE PROMPT IS NOT THE WALL — but it should not ask for the fault either. */
    assert.match(SRV, /NEVER open with the clause's own heading or number/);
  });

  /* ═══════ 2. THE PREPARED ROW'S KIND ═══════ */
  await t.test('(2) every desk row carries its kind at the left', () => {
    assert.match(HOME, /const KIND_WORD=\{ chase:'desk_kind_chase', notice:'desk_kind_notice',/);
    assert.match(HOME, /class="hm-dk-tag \$\{tone\}"/,
      'its tone is the ROW\'s own, never a second table');
    assert.match(HOME, /\$\{tagChip\}\n      <div class="hm-desk-head">/, 'drawn first, at the left');
    for (const k of ['desk_kind_notice', 'desk_kind_read', 'desk_kind_memo', 'desk_kind_chase'])
      assert.equal(I18N.split(k + ':').length, 3, k + ' is in both books');
    assert.match(CSS, /\.hm-dk-tag\{[^}]*font-size:var\(--t-micro\)/);
    assert.match(CSS, /\.hm-dk-tag\.is-neg\{[^}]*--st-ruby-fg/);
  });

  /* ═══════ 3. THE DROPDOWN'S CHOICES ═══════ */
  await t.test('(3) a hidden control does not hand its colour to its own options', () => {
    const rule = /\.reg-filterbar \.reg-chip-sel\{[^}]*\}/.exec(CSS);
    assert.ok(rule, 'the control rule is readable');
    assert.ok(!/color:transparent/.test(rule[0]),
      'opacity hides the box; a transparent colour is inherited by the popup');
    assert.match(rule[0], /opacity:0/);
    assert.match(rule[0], /border-radius:999px/, 'the control takes the chip\'s own corner');
    assert.match(CSS, /\.reg-filterbar \.reg-chip-sel option\{[^}]*color:var\(--color-text\)/);
    assert.match(CSS, /\.reg-filterbar \.reg-chip-sel option\{[^}]*background:var\(--color-surface\)/);
  });

  /* ═══════ 4. THE HORIZON ═══════ */
  await t.test('(4) the ladder leads and the caption bar is gone', () => {
    const fn = /return `<section class="cal-card cal-grid cal-hz-card">[\s\S]*?<\/section>`;/.exec(CAL);
    assert.ok(fn, 'the horizon\'s shell is readable');
    assert.ok(fn[0].indexOf('cal-ladder') < fn[0].indexOf('cal-hz scroll-thin'),
      'the five bands are drawn before the table');
    assert.ok(!/cal-cardbar/.test(fn[0]), 'no caption bar');
    assert.ok(!/cal_hz_title|cal_hz_head/.test(strip(fn[0])),
      'and it no longer explains itself under its own title');
    /* STALE ON THE FACE, live in both books — a key is retired by not calling it. */
    assert.equal(I18N.split('cal_hz_title:').length, 3);
    assert.equal(I18N.split('cal_hz_head:').length, 3);
  });

  await t.test('(4b) the table is the scroller, which is what makes sticky stick', () => {
    assert.match(CAL, /\.cal-hz\{flex:1 1 auto;min-height:0;overflow:auto\}/);
    assert.match(CAL, /\.cal-hz-card\{flex:1 1 auto;min-height:0\}/);
    assert.match(CAL, /\.cal-hz-ruler\{[^}]*position:sticky;top:0/);
  });

  await t.test('(4c) the months read as a ruler, and the row is the artifact\'s', () => {
    const m = /\.cal-hz-months span\{[^}]*\}/.exec(CAL)[0];
    assert.match(m, /font-family:var\(--font-mono\)/);
    assert.ok(!/text-transform:uppercase/.test(m), 'mixed case, as the reference sets them');
    assert.ok(!/border-left/.test(m), 'the track\'s gridlines already say where a month begins');
    /* THE LABEL'S OWN ORDER: who it is with, the reference, then the value —
       and money only where the reader may see it. */
    assert.match(CAL, /r\.c\.counterparty\?_esc\(r\.c\.counterparty\):'', _esc\(r\.c\.id\)/);
    assert.match(CAL, /typeof canViewValues!=='function'\|\|canViewValues\(\)/);
  });

  await t.test('(4d) the ladder is five cards, each with its tone on the top edge', () => {
    assert.match(CAL, /\.cal-lad\{[^}]*border-top-width:3px/);
    assert.match(CAL, /\.cal-ladder\{[^}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
    /* AND IT STILL COUNTS WHAT IT COUNTED. The bands and the money are
       readings; only where they are drawn moved. */
    assert.match(CAL, /const CAL_LADDER = \[/);
    assert.match(CAL, /class="cal-lad-v"/, 'the money sub-line is kept');
  });
});

/* ── (5) THE BAR IS A PILL, AND A CUT RIGHT END MEANS IT RUNS PAST THE RULER ──
   Young, 21 Sep 2026, over two renders side by side: "These bars are not the
   same. They do not have round endings in the end."

   THE RELATION, NEVER THE NUMBER. The artifact writes 4px on an 8px-tall bar,
   which is a FULL PILL; HaTi's bar is 14px, so copying the 4 would copy the
   wrong thing and draw a shallow corner. 999px is this product's own way of
   saying "as round as this box can be" — the same idiom .rounded-full uses —
   and it goes on following the bar if the bar's height is ever retuned.

   AND THE RIGHT END SQUARES WHERE THE AGREEMENT OUTLASTS THE TWELVE MONTHS on
   the ruler, which is the artifact's rule too ('4px 0 0 4px' on an over-run).
   A pill says "it ends here". A cut end says "this is where the PICTURE stops,
   not the agreement". The flag is the row builder's own `beyond` — the very
   reading the note beside the bar already prints, so the shape and the words
   cannot come to disagree about whether a row runs past the year. */
test('F348 (5) — the horizon bar\'s own ends', async t => {
  await t.test('(5a) a bar is a pill', () => {
    const r = /\.cal-hz-bar\{[^}]*\}/.exec(CAL);
    assert.ok(r, '.cal-hz-bar still has a rule');
    assert.match(r[0], /border-radius:999px/);
  });

  await t.test('(5b) and the right end is cut where the row runs past the ruler', () => {
    assert.match(CAL, /\.cal-hz-bar\.is-beyond\{border-radius:999px 0 0 999px\}/);
  });

  await t.test('(5c) the flag is the row\'s own `beyond`, not a second reading', () => {
    /* ONE READING, TWO READERS: the same const decides the shape and the
       "beyond a year" words under it. */
    assert.match(CAL, /const end=calHorizonPos\(r\.exp\), beyond=r\.days>365;/);
    assert.match(CAL, /class="cal-hz-bar\$\{beyond\?' is-beyond':''\}"/);
    assert.match(CAL, /\$\{beyond\?' ·&nbsp;'\+_esc\(i18t\('cal_hz_beyond'\)\)/);
  });

  await t.test('(5d) [wall] no length of bar is given a square end by accident', () => {
    /* The only rule that takes the radius away names the over-run by class.
       A second one would put the owner's report straight back. */
    const hits = (CAL.match(/\.cal-hz-bar[^{]*\{[^}]*border-radius[^}]*\}/g) || []);
    assert.equal(hits.length, 2, 'exactly two rules speak about this bar\'s corners');
    assert.ok(hits.some(h => /\.is-beyond/.test(h)));
  });
});
