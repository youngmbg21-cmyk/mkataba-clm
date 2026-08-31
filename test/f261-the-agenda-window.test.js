/* f261 — THE AGENDA WINDOW IS A CONTROL (J-5.4)
   ========================================================================
   Owner-asked 31 Aug 2026, off a screenshot of the Calendar with the panel's
   head ringed: *"the highlighted area that shows the next 14 days, change that
   to a filter where you can look next 14, 30, 60, 90 days."*

   HALF OF IT WAS ALREADY BUILT — calUpcoming has always taken a window and
   every caller passed nothing, so the fortnight was simply the only value
   anybody handed it. What was missing is the control.

   WHAT IS PINNED:
     1  four windows, and the reading really changes with them
     2  ONE value answers for the reading, the heading and the empty state
     3  the heading IS the control — not a title beside a dropdown
     4  the 40-row cap stops being silent, and says nothing below it
     5  Share carries the window on screen; Export deliberately does not
     6  per sitting, like the tab and the scope beside it
     7  the default is still a fortnight for a reader who touches nothing
     8  the month grid, the Horizon and the scope switch are unchanged */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18n = require('../js/i18n.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const CAL = read('js/views/calendar.js');
const CAL_CODE = strip(CAL);

describe('f261 (1) — four windows, and one value answers for all three', () => {
  test('the four are named once', () => {
    assert.match(CAL_CODE, /const CAL_AGENDA_WINDOWS = \[14, 30, 60, 90\];/);
    assert.match(CAL_CODE, /const CAL_AGENDA_DAYS = 14;/, 'and the fortnight survives as the DEFAULT');
  });

  test('an unknown value falls back rather than drawing a blank panel', () => {
    /* calView's own rule, one control along: a reader whose stored tab was
       'list' lands on the month rather than on nothing. */
    assert.match(CAL_CODE, /function calAgendaDays\(\)\{[\s\S]{0,180}CAL_AGENDA_WINDOWS\.includes\(n\) \? n : CAL_AGENDA_DAYS;/);
  });

  test('the reading takes the chosen window, never a literal', () => {
    assert.match(CAL_CODE, /function calUpcoming\(evs, days\)\{\s*const n=days\|\|calAgendaDays\(\);/);
  });

  test('the panel asks ONCE and hands the same value to everything below', () => {
    /* This panel has been caught once headed 30 with an empty state saying 60.
       The correction was to make one number answer for all three, and that
       property is the condition on making it a choice. */
    assert.match(CAL_CODE, /function calPanelHtml\(evs\)\{\s*const win=calAgendaDays\(\);\s*const up=calUpcoming\(evs,win\);/);
    assert.match(CAL_CODE, /i18t\('cal_nothing_due',\{n:win\}\)/, 'the empty state names the live window');
    assert.ok(!/cal_nothing_due',\{n:CAL_AGENDA_DAYS\}/.test(CAL_CODE),
      'and neither sentence is still pinned to the default');
  });

  test('the reading really changes with the window', () => {
    /* Driven rather than read: the arithmetic is what a reader is choosing. */
    const day = n => { const d = new Date(); d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10); };
    const evs = [5, 20, 45, 75, 200].map(n => ({ date: day(n), type: 'expiry', cid: 'c', cname: 'x' }));
    const upto = n => evs.filter(e => {
      const t = Date.parse(e.date + 'T00:00:00') - Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00');
      const d = Math.round(t / 86400000);
      return d >= 0 && d <= n;
    }).length;
    assert.equal(upto(14), 1); assert.equal(upto(30), 2);
    assert.equal(upto(60), 3); assert.equal(upto(90), 4);
  });
});

describe('f261 (2) — the heading IS the control', () => {
  test('there is no title beside it', () => {
    /* A heading reading "Next 14 days" twelve pixels from a control set to 14
       days is one fact printed twice, and the second printing is the one that
       reads as furniture. */
    const head = CAL.slice(CAL.indexOf('<div class="cal-panel-head">'), CAL.indexOf('id="cal-agenda"'));
    assert.match(head, /<select id="cal-days"/);
    assert.ok(!/<h5>/.test(head), 'the h5 the control replaced is gone');
    assert.match(head, /CAL_AGENDA_WINDOWS\.map\(n=>`<option value="\$\{n\}"\$\{n===win\?' selected':''\}>/,
      'and it is set to the live cut, so a narrowed list states its own narrowing');
  });

  test('it is wired beside the scope switch', () => {
    assert.match(CAL_CODE, /getElementById\('cal-days'\)\?\.addEventListener\('change',e=>calSetAgendaDays\(e\.target\.value\)\)/);
  });

  test('per sitting, in memory, like the tab and the scope', () => {
    /* A reader who widened to ninety days last Tuesday should not quietly still
       be on ninety a week later. */
    assert.match(CAL_CODE, /let calState = \{ ym:null, view:'month', scope:'all', days:null \};/);
    assert.ok(!/regColSetWidths|localStorage[^)]*calState\.days/.test(CAL_CODE), 'nothing stores it');
    /* AND IT IS NOT IN ITS OWN TEMPORAL DEAD ZONE: calState is built at load
       and CAL_AGENDA_DAYS is a const declared below it. */
    assert.ok(CAL_CODE.indexOf('let calState =') < CAL_CODE.indexOf('const CAL_AGENDA_DAYS'));
    assert.ok(!/days:CAL_AGENDA_DAYS/.test(CAL_CODE));
  });
});

describe('f261 (3) — the cap stops being silent', () => {
  test('past forty it says how many of how many', () => {
    /* A list that quietly stops at 40 of 137 reads as a list of 40. A cap is a
       FACT, never a silent trim. */
    assert.match(CAL_CODE, /const CAL_AGENDA_ROWS = 40;/);
    assert.match(CAL_CODE, /up\.length>CAL_AGENDA_ROWS\?`<div class="cal-panel-cap">\$\{_esc\(i18t\('cal_showing_of',\{shown:CAL_AGENDA_ROWS,total:up\.length\}\)\)\}/);
  });

  test('and below it says nothing', () => {
    /* A caveat that is always there is one nobody reads. */
    assert.match(CAL_CODE, /up\.length>CAL_AGENDA_ROWS\?/);
    assert.match(CAL_CODE, /:''\}/);
  });

  test('the rows and the cap read the same number', () => {
    assert.match(CAL_CODE, /const rows=up\.slice\(0,CAL_AGENDA_ROWS\)/);
    assert.ok(!/slice\(0,40\)/.test(CAL_CODE), 'no literal 40 is left to drift from it');
  });
});

describe('f261 (4) — what leaves the page is what is on it', () => {
  test('Share carries the window', () => {
    assert.match(CAL_CODE, /function calSummaryLines\(evs, days\)\{\s*return calUpcoming\(evs, days\|\|calAgendaDays\(\)\)\.slice\(0,CAL_AGENDA_ROWS\)/);
  });

  test('EXPORT DELIBERATELY DOES NOT CHANGE', () => {
    /* The .ics carries the PERIOD — the month or the horizon on screen — which
       is a different question from the agenda's window, and somebody exporting
       August expects August. Named so nobody "fixes" it. */
    const ics = CAL_CODE.slice(CAL_CODE.indexOf('function calIcsFor'));
    assert.ok(!/calAgendaDays|CAL_AGENDA/.test(ics.slice(0, ics.indexOf('\n}'))),
      'the calendar file knows nothing about the agenda window');
  });
});

describe('f261 (5) — nothing else on that page moved', () => {
  test('the month grid, the Horizon, the tones and the scope switch', () => {
    for (const anchor of ['function calMonthGridHtml', 'function calHorizonHtml',
                          'const CAL_EVENT', 'function calSetScope', 'data-cal-scope'])
      assert.ok(CAL_CODE.includes(anchor), anchor + ' is untouched');
    assert.match(CAL_CODE, /const CAL_VIEWS = \['month','horizon'\];/);
  });

  test('and the Done button on an obligation row', () => {
    assert.match(CAL_CODE, /data-ob-done="/);
  });
});

describe('f261 (6) — both languages', () => {
  for (const lang of ['en', 'sv']) {
    test(`${lang}: the new words are there`, () => {
      const d = i18n.STRINGS[lang];
      for (const k of ['cal_window_title', 'cal_showing_of'])
        assert.ok(d[k] && String(d[k]).trim(), `${lang}.${k}`);
      assert.match(String(d.cal_showing_of), /\{shown\}[\s\S]*\{total\}/, 'and states both numbers');
    });
  }
  test('and the heading still takes its window as a value', () => {
    for (const lang of ['en', 'sv']) {
      assert.match(String(i18n.STRINGS[lang].cal_next_30), /\{n\}/);
      assert.ok(!/\b\d{2}\b/.test(String(i18n.STRINGS[lang].cal_next_30)),
        'it spells no number of its own — the control names each option');
    }
  });
});
