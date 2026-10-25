/* f880 — THE TEMPLATE'S PAGE GIVES THE PAPER THE ROOM, AND JAMBO IS ONE WINDOW
   (owner, 25 Oct 2026: "always give more room to the paper. Optimize the top
   bar as space is wasted" · "this page does not need an overview page …
   can go below the welcoming message in the jambo panel")

   Measured before: the template's page spent 422px above the first line of
   wording at 1440 (a Library row, a tall card, a second head "The wording ·
   Showing v1 · Edit") and had no Jambo; Our paper's panel had three tabs,
   Overview · Jambo · the template's name, squeezed to "✦ J…"; the bar said
   "Builder"; the New agreement panel said one line, no greeting.
   Red at the parent: none of tpl-dt, solo, tplDtPanelPaint, tplPfReadOf or
   ca_go_draft_can existed. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const TL = read('js/views/templatelib.js'), LIB = read('js/views/library.js'), INS = read('js/views/inspector.js');
const CNT = read('js/views/counter.js'), PD = read('js/paperdesk.js'), I18N = read('js/i18n.js');

describe('f880 — the template\'s page: one thin line, the paper, Jambo beside it', () => {
  const page = fnBody(TL, 'openTemplateLibDetail');
  test('one line: ‹ Library · name · ● status vN · facts · Edit · ⋯ · + New contract', () => {
    assert.match(page, /class="ph-card tpl-dt-line"/);
    const line = page.slice(page.indexOf('tpl-dt-line'), page.indexOf('</div>', page.indexOf('tpl-dt-line')));
    ['tpllib-back', 'tpl-dt-name', 'tpl-dt-st', 'tpl-dt-facts', 'tpllib-edit-wording', 'tpl-dt-more', 'tpllib-use']
      .reduce((at, k) => { const i = line.indexOf(k, at); assert.ok(i > at, k + ' in order on the line'); return i; }, -1);
  });
  test('Rename, New draft version, Archive or Restore and Delete are in the ⋯, not on the page', () => {
    for (const k of ["k: 'meta'", "k: 'newversion'", "k: 'archive'", "k: 'restore'", "k: 'delete'"]) assert.ok(page.includes(k), k);
    assert.ok(!/id="tpllib-(edit-meta|archive|delete|newversion)"/.test(page), 'no separate buttons for them');
  });
  test('the second head over the wording is gone; the description goes to Jambo', () => {
    assert.ok(!page.includes("i18t('tl_the_wording')"), 'no "The wording" head');
    assert.ok(!page.includes('tl_no_description'), 'no description line on the page');
    assert.match(fnBody(TL, 'tplDtPanelPaint'), /tplPfJamboHtml\(card, read, \{ desc: t\.description \|\| '' \}\)/);
    assert.match(fnBody(LIB, 'tplPfJamboHtml'), /if \(o && o\.desc\) lines\.splice\(1, 0, _tplEsc\(o\.desc\)\)/);
  });
  test('Jambo beside it, drawn only where the panel fits, as one window', () => {
    assert.match(page, /\$\{INS \? `<aside id="ins-panel" class="ins-panel"/);
    assert.match(fnBody(TL, 'tplDtPanelPaint'), /head: false, solo: true/);
  });
  test('Jambo\'s lines read the paper without painting marks on it (tplPfReadOf)', () => {
    const r = fnBody(LIB, 'tplPfReadOf');
    assert.ok(r && !/insertBefore|\.remove\(\)/.test(r), 'a reading only');
  });
  test('the bar says "Our paper" on the template\'s page, before the builder\'s word', () => {
    const d = fnBody(CNT, 'deskPageName');
    assert.ok(d.indexOf("getElementById('tpl-dt')") > 0 && d.indexOf("getElementById('tpl-dt')") < d.indexOf('tbOnScreen'));
    assert.match(d, /getElementById\('tpl-dt'\)\) return _cnT\('nav_tpl_std'\)/);
  });
});

describe('f880 — one Jambo window for an item said in his words', () => {
  test('insPaintPanel: `solo` puts the item under his greeting, no Overview and no name tab', () => {
    const p = fnBody(INS, 'insPaintPanel');
    assert.match(p, /const soloItem = jl && !c && !!item && !!opt\.solo;/);
    assert.match(p, /host\._jlSolo = !\(c \|\| item\) \|\| soloItem;/);
    assert.match(p, /jlHeadPaint\(host, opt, !!\(c \|\| item\) && !soloItem\)/);
    assert.match(p, /else if \(soloItem\)\{ body\.innerHTML = ''; jlGreetPut\(host, opt\.body \|\| ''\); \}/);
  });
  test('Our paper\'s chosen template is said that way', () => {
    assert.match(fnBody(LIB, 'tplPfPanelPaint'), /head:false, solo:true,/);
  });
  test('the empty New agreement panel: his greeting, then what he can do there', () => {
    const h = fnBody(PD, 'pdWallHelloHtml');
    assert.match(h, /naSheetUp\(\)\)\s*\n\s*return `\$\{typeof jamboHelloHtml === 'function' \? jamboHelloHtml\(\) : ''\}/);
    assert.match(h, /\['ca_go_draft_can1', 'ca_go_draft_can2', 'ca_go_draft_can3'\]/);
  });
  test('both books carry the words', () => {
    ['tl_dt_library', 'tl_dt_rename', 'tl_dt_new_version', 'tl_dt_archive', 'tl_dt_delete', 'ca_go_draft_can_h', 'ca_go_draft_can1', 'ca_go_draft_can2', 'ca_go_draft_can3']
      .forEach(k => assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k));
  });
});
