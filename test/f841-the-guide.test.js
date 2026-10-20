'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f841 — THE GUIDE: EVERY PAGE IN THE ORDER A CONTRACT LIVES (owner, 19 Oct
   2026: "a menu page that slides from the right hand panel like activities
   but it is a menu like a nav panel for the entire platform … more of a
   guide than a nav panel"; of the three drawn, "Journey it is")

   (1) A FACE OF THE ONE PANEL: 'guide' joins PANEL_FACES, so it opens from the
       panel's own door and adds none; the panel draws its tabs (Activity ·
       Alerts · Notes only with a contract in front · Guide).
   (2) THE JOURNEY: Home first, six stages in the order a contract lives,
       Settings & rules at the foot; each row through Jambo's one mover
       (caGo), "New agreement" through the one form (caDraftForm).
   (3) A COUNT IS THE PAGE'S OWN DOOR NUMBER (the door readings, never a new
       count), none drawn at zero; "You are here" off the page in front.
   (4) The words in both books.
   AT THE PARENT (0a1fc1b3) every claim here FAILS: PANEL_FACES is three, and
   nothing called the Guide exists.
   The browser half: test/chromium/guide-panel-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const R = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const APP = R('js/app.js');
const I18N = R('js/i18n.js');
const IDX = R('index.html');
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '');
const fnOf = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };

describe('f841 (1) a face of the one panel', () => {
  test('1a guide is a face of PANEL_FACES; the panel holds one tab row, painted by panelTabsPaint', () => {
    assert.match(APP, /const PANEL_FACES = \['guide', 'alerts', 'notes', 'activity'\];/);
    assert.match(IDX, /<nav id="panel-tabs" class="pt-tabs" role="tablist"[^>]*hidden><\/nav>\s*<div id="panel-body"/);
    assert.match(code(fnOf(APP, 'renderContextPanel')), /panelTabsPaint\(face\);/);
  });
  test('1b Notes is a tab only with a contract in front; the tab in front does nothing; a computer only', () => {
    const f = code(fnOf(APP, 'panelTabsPaint'));
    assert.match(f, /concat\(cid\|\|face==='notes'\?\[\['notes','ng_card_notes'\]\]:\[\]\)/);
    assert.match(f, /if\(k===panelFace\(\)\) return;/);
    assert.match(f, /deskShellOn/);
  });
});

describe('f841 (2) the journey', () => {
  test('2a six stages in the order a contract lives, the pages as drawn', () => {
    const m = APP.match(/const GUIDE_STAGES = (\[[\s\S]*?\n\]);/);
    assert.ok(m, 'GUIDE_STAGES');
    const st = Function('return ' + m[1])();
    assert.deepEqual(st.map(s => s.k), ['ask', 'draft', 'agree', 'sign', 'keep', 'see']);
    assert.deepEqual(st.map(s => s.rows), [['requests', 'import'], ['ourpaper', 'draft'], ['document', 'negotiations', 'parties', 'people'], ['approvals'], ['contracts', 'oblig', 'calendar', 'mynotes'], ['board', 'explorer', 'house']]);
  });
  test('2b Home first, Settings at the foot', () => {
    const f = code(fnOf(APP, 'guidePanelHtml'));
    assert.ok(f.indexOf("guideRowHtml('counter'") < f.indexOf('GUIDE_STAGES.map') && f.indexOf('GUIDE_STAGES.map') < f.indexOf("guideRowHtml('settings'"));
  });
  test('2c a press lets the panel go and moves through Jambo\'s one mover; New agreement through the one form', () => {
    const f = code(fnOf(APP, 'guideGo'));
    assert.match(f, /closeContextPanel\(\);/);
    assert.match(f, /caGo\(\{ kind:'go', place:k \}\)/);
    assert.match(f, /caDraftForm\(null\)/);
  });
  test('2d a page this reader cannot use is not listed (Import needs the right to add)', () => {
    assert.match(code(fnOf(APP, 'guideRowShown')), /k!=='import'\|\|\(typeof caMayAdd!=='function'\)\|\|caMayAdd\(\)/);
  });
});

describe('f841 (3) counts and where you are', () => {
  test('3a every count is a door\'s own reading, none drawn at zero', () => {
    const f = code(fnOf(APP, 'guideCountOf'));
    ['counterNeedsCount', 'requestsDoorCount', 'navCounts().migration', 'negoNeedsYouTotal', 'approvalsDoorCount', 'obligationsDoorCount', 'mineNotesDue', 'agentsDoorCount']
      .forEach(n => assert.ok(f.includes(n), n));
    assert.match(f, /return v>0\?/);
  });
  test('3b "You are here" off the page in front', () => {
    const f = code(fnOf(APP, 'guideHereKey'));
    assert.match(f, /approvals:'approvals'/);
    assert.match(f, /calendar:'calendar'/);
    assert.match(f, /return c\?'document':'contracts'/);
  });
});

describe('f841 (4) both books', () => {
  test('4a every Guide word stands in English and in Swedish', () => {
    const keys = [...new Set((APP.match(/'gd_[a-z_]+'/g) || []).map(k => k.slice(1, -1)))]
      .flatMap(k => k.endsWith('_') ? [] : [k]);
    const need = ['gd_title', 'gd_tab', 'gd_new', 'gd_here', 'gd_say_b', 'gd_say'];
    ['ask', 'draft', 'agree', 'sign', 'keep', 'see'].forEach(s => need.push('gd_s_' + s, 'gd_s_' + s + '_w'));
    ['counter', 'requests', 'import', 'ourpaper', 'draft', 'document', 'negotiations', 'parties', 'people', 'approvals', 'contracts', 'oblig', 'calendar', 'mynotes', 'board', 'explorer', 'house', 'settings']
      .forEach(p => need.push('gd_p_' + p, 'gd_w_' + p));
    ['counter', 'requests', 'import', 'negotiations', 'approvals', 'oblig', 'mynotes', 'house'].forEach(p => need.push('gd_n_' + p));
    keys.concat(need).forEach(k => {
      const n = (I18N.match(new RegExp('^\\s+' + k + ':', 'gm')) || []).length;
      assert.equal(n, 2, k + ' in both books');
    });
  });
});
