/* ============================================================
   f326 — CATEGORY AND VALUE STREAM ARE THE COMPANY'S LISTS
   ============================================================
   Young, 17 Sep 2026, off the "New standard template" dialog: *"it is not
   clear how you create category and value stream but also how you delete
   them. There should be a fairly simply process of creating the folders."*

   MEASURED BEFORE ANYTHING MOVED, and it was worse than unclear:

     · A VALUE STREAM WAS SAVED IN ONE BROWSER. addCustomFolder wrote to
       localStorage and no colleague ever learned of it, so a company standard
       template filed under one was filed under a stream that did not exist for
       the person beside them. The settings panel admitted this in a note,
       which is honest and is not a product.

     · A CATEGORY COULD NOT BE CREATED AT ALL. TPLLIB_CATEGORIES was five
       words in the source with no writer anywhere in js/ or server/ — not a
       hidden door, not an admin screen. The feature had never been built.

     · NEITHER PICKER SAID SO. The stream select in that dialog was the one
       stream picker in the product that did NOT carry the `__new__` sentinel
       every other one has had since the folders feature.

   The claims below are the three fixes and the walls around them. Every one
   is red at the parent except those named as controls.
   ============================================================ */
const test = require('node:test');
const { describe } = test;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* THE SWEEPS READ CODE, NOT PROSE — the comments below name the very stores
   they forbid ("no colleague ever learned of it"), so a grep over raw source
   would find the warning and report it as the fault. */
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const TPL = read('js/templates.js');
const TPL_CODE = strip(TPL);
const LIB = read('js/views/templatelib.js');
const LIB_CODE = strip(LIB);
const API = strip(read('js/api.js'));
const SET = strip(read('js/views/settings.js'));
const SRV = strip(read('server/server.js'));
const I18N = read('js/i18n.js');

describe('f326 — the filing lists are the company\'s', () => {

  /* ---------------------------------------------------------- */
  describe('1 · a value stream belongs to the workspace, not to a browser', () => {
    test('the writer puts it in the shared settings blob and sends it', () => {
      const i = TPL_CODE.indexOf('function saveValueStreams(');
      assert.ok(i > 0, 'the one writer is where it says it is');
      const w = TPL_CODE.slice(i, TPL_CODE.indexOf('\n}\n', i));
      assert.match(w, /state\.settings\.valueStreams *=/, 'the company\'s own list');
      assert.match(w, /saveFilingSettings\(\)/, 'and it leaves the building');
    });
    test('and it rides ONE route, the templates route\'s twin', () => {
      const i = TPL_CODE.indexOf('function saveFilingSettings(');
      const w = TPL_CODE.slice(i, TPL_CODE.indexOf('\n}\n', i));
      assert.match(w, /api\('settings\/filing', *'PUT'/, 'its own atomic route');
      assert.match(w, /valueStreams/, 'both lists ride it');
      assert.match(w, /templateCategories/, 'both lists ride it');
    });
    test('adding one no longer ends at localStorage', () => {
      const i = TPL_CODE.indexOf('function addCustomFolder(');
      const w = TPL_CODE.slice(i, TPL_CODE.indexOf('\n}\n', i));
      assert.match(w, /saveValueStreams\(\)/, 'the company\'s writer');
      assert.ok(!/saveCustomFolders\(\)/.test(w),
        'the browser-only store is no longer what an add means');
    });
    test('the shared list really reaches FOLDERS — the one map every screen reads', () => {
      const w = loadViews(['js/templates.js'],
        { state: { settings: { valueStreams: [{ id: 'cf_legal', name: 'Legal & Regulatory' }] } } });
      assert.ok(w.FOLDERS.cf_legal === undefined, 'not before the bootstrap has landed (control)');
      w.foldersFromSettings();
      assert.equal(w.FOLDERS.cf_legal.name, 'Legal & Regulatory', 'and there it is');
      assert.equal(w.FOLDERS.cf_legal.custom, true);
      assert.ok(w.visibleFolders().some(f => f.id === 'cf_legal'),
        'so every picker, filter, stripe and report has it by construction');
    });
    test('a shared stream outranks a browser-only one of the same id', () => {
      const w = loadViews(['js/templates.js'],
        { state: { settings: { valueStreams: [{ id: 'cf_x', name: 'The company\'s' }] } } });
      w.FOLDERS.cf_x = { id: 'cf_x', name: 'Mine alone', custom: true, local: true };
      w.foldersFromSettings();
      assert.equal(w.FOLDERS.cf_x.name, 'The company\'s', 'two people who typed one name land on one stream');
      assert.ok(!w.FOLDERS.cf_x.local, 'and it stops offering to be shared');
    });
    test('the bootstrap is where it is merged, because that is when settings first exist', () => {
      assert.match(API, /window\.foldersFromSettings\) foldersFromSettings\(\)/,
        'called once the bootstrap has set state.settings');
      const i = API.indexOf('state.settings=b.settings');
      const j = API.indexOf('foldersFromSettings()');
      assert.ok(i > 0 && j > i, 'and AFTER it, not before');
    });
  });

  /* ---------------------------------------------------------- */
  describe('2 · a category is a list a company keeps', () => {
    const stage = (settings = {}) => loadViews(['js/views/templatelib.js'],
      { state: { contracts: [], settings, view: 'templates' }, api: async () => ({}) });
    test('the five built-ins still lead, and the company\'s own follow', () => {
      const w = stage({ templateCategories: [{ id: 'tc_distribution', name: 'Distribution' }] });
      const rows = w.templateCategories();
      assert.equal(rows.slice(0, 5).map(c => c.id).join(','), 'sales,procurement,employment,nda,other');
      assert.ok(rows.every(c => c.id === 'tc_distribution' ? c.custom : !c.custom),
        'and only the company\'s own are marked as its own');
      assert.equal(rows[rows.length - 1].name, 'Distribution');
    });
    test('ONE presenting reading, so the card and the picker cannot disagree', () => {
      const w = stage({ templateCategories: [{ id: 'tc_distribution', name: 'Distribution' }] });
      assert.equal(w.tplCategoryName('tc_distribution'), 'Distribution',
        'the card used to print "Other" for exactly this template');
      assert.equal(w.tplCategoryName('nda'), 'NDA');
      assert.ok(!/TPLLIB_CATEGORIES\[t\.category\]/.test(LIB_CODE),
        'no screen reads the built-in map directly any more');
    });
    test('adding one is a single act that writes the shared list', () => {
      const w = stage({});
      const made = w.addTemplateCategory('Distribution');
      assert.equal(made.name, 'Distribution');
      assert.equal(w.state.settings.templateCategories.map(c => c.name).join(','), 'Distribution');
      assert.equal(w.addTemplateCategory('distribution').id, made.id,
        'the same name twice is the same category, never a second one');
    });
    test('renaming and removing are the same one list', () => {
      const w = stage({ templateCategories: [{ id: 'tc_d', name: 'Distribution' }] });
      assert.equal(w.renameTemplateCategory('tc_d', 'Route to market'), true);
      assert.equal(w.state.settings.templateCategories[0].name, 'Route to market');
      assert.equal(w.removeTemplateCategory('tc_d'), true);
      assert.equal(w.state.settings.templateCategories.length, 0);
      assert.equal(w.removeTemplateCategory('nda'), false,
        'a built-in has no store to be removed from, so it is refused');
      assert.equal(w.renameTemplateCategory('nda', 'X'), false);
    });
  });

  /* ---------------------------------------------------------- */
  describe('3 · both pickers say how one is made', () => {
    const stage = (settings = {}) => loadViews(['js/views/templatelib.js'],
      { state: { contracts: [], settings, view: 'templates' }, api: async () => ({}) });
    test('the category select carries the create door, last', () => {
      const html = stage({}).tplLibCategoryOptions('other');
      assert.match(html, /<option value="__new__">/, 'the door is on the list');
      assert.ok(html.lastIndexOf('__new__') > html.lastIndexOf('value="nda"'), 'and it is last');
    });
    test('the value stream select carries the product\'s OWN sentinel — not a second one', () => {
      assert.match(LIB_CODE, /<option value="__new__">\$\{esc\(i18t\('fo_create_new'\)\)\}<\/option>/,
        'the same sentinel and the same words folderOptionsHtml has always used');
      assert.match(TPL_CODE, /sel\.value==='__new__'/,
        'and bindFolderSelect is still the one thing that answers it');
    });
    test('both dialogs are wired from ONE function, so neither has a dead option', () => {
      const wires = (LIB_CODE.match(/tplLibWireCatStream\(/g) || []).length;
      assert.equal(wires, 3, 'the definition and exactly two callers');
      assert.match(LIB_CODE, /tplLibWireCatStream\('tpllib-cat', 'tpllib-stream'\)/);
      assert.match(LIB_CODE, /tplLibWireCatStream\('tpllib-m-cat', 'tpllib-m-stream'\)/);
    });
    test('a sentinel never reaches the route', () => {
      const w = stage({});
      assert.equal(w.tplLibPick('nothing-here', 'other'), 'other', 'an absent box falls back');
      assert.ok(!/category: document\.getElementById\('tpllib-cat'\)\.value/.test(LIB_CODE),
        'the create dialog reads through the guard');
      assert.ok(!/category: document\.getElementById\('tpllib-m-cat'\)\.value/.test(LIB_CODE),
        'and so does the details dialog');
    });
    test('ONE name box, two lists', () => {
      const i = TPL_CODE.indexOf('function promptNewFolder(');
      const w = TPL_CODE.slice(i, TPL_CODE.indexOf('\n}\n', i));
      assert.match(w, /promptNewName\(/, 'the stream prompt is a caller, not a second overlay');
      assert.equal((TPL_CODE.match(/newfolder-overlay/g) || []).length, 2,
        'and the overlay itself is written once (the stale-node check and the id)');
      assert.match(LIB_CODE, /promptNewName\(\{ title: i18t\('tl_new_category'\)/,
        'the category prompt is the second caller');
    });
  });

  /* ---------------------------------------------------------- */
  describe('4 · the server is the wall, and a name is not a permission', () => {
    test('the route exists, and is gated like the templates route beside it', () => {
      assert.match(SRV, /app\.put\('\/api\/settings\/filing', auth, templateManager,/,
        'Admin + Legal — the people who file a template');
    });
    test('it stores an ALLOW-LIST, bounded, never the body', () => {
      const i = SRV.indexOf('const filingRows =');
      const w = SRV.slice(i, SRV.indexOf('app.put(\'/api/settings/filing\'', i));
      assert.match(w, /slice\(0, FILING_MAX\)/, 'the list is bounded');
      assert.match(w, /slice\(0, 64\)/, 'and every value is');
      assert.match(w, /\.filter\(Boolean\)/, 'a row with no id or no name is dropped');
      const r = SRV.slice(SRV.indexOf('app.put(\'/api/settings/filing\''));
      const body = r.slice(0, r.indexOf('});'));
      assert.ok(!/\.\.\.b\b/.test(body), 'the request body is never spread into appSettings');
    });
    test('it does not touch the access map — H-3\'s own rule', () => {
      const r = SRV.slice(SRV.indexOf('app.put(\'/api/settings/filing\''));
      const body = r.slice(0, r.indexOf('});'));
      assert.ok(!/folderAccess/.test(body),
        'creating a stream grants nobody sight of anything');
      assert.ok(!/signFolders/.test(body));
    });
  });

  /* ---------------------------------------------------------- */
  describe('5 · the panel tells the truth about both lists', () => {
    test('the note that said "this browser only" is replaced, not left lying', () => {
      assert.ok(!/i18t\('st_p_folders_local'\)/.test(SET),
        'the false sentence has no caller');
      assert.match(SET, /st_p_folders_shared_note/, 'and a true one took its place');
      assert.match(I18N, /st_p_folders_local:/, 'the key stays inert in the book, never deleted');
    });
    test('a stream still local to one browser says so ON ITS ROW, and offers the press', () => {
      assert.match(SET, /f\.custom&&f\.local\?/, 'drawn only where it is true');
      assert.match(SET, /st_p_folders_thisbrowser/);
      assert.match(SET, /shareCustomFolder\(id\)/, 'one press, the store\'s own act');
    });
    test('categories are managed on the same panel, and a removal in use is refused', () => {
      assert.match(SET, /function stPaintCategories\(/);
      assert.match(SET, /st_p_cats_holds/, 'refused while templates still use it');
      assert.match(SET, /removeTemplateCategory\(id\)/);
      assert.match(SET, /addTemplateCategory\(name\)/);
    });
    test('every new sentence is in BOTH books', () => {
      for (const k of ['st_p_cats', 'st_p_cats_add', 'st_p_cats_body', 'st_p_cats_holds',
        'st_p_cats_added', 'st_p_cats_renamed', 'st_p_cats_removed',
        'st_p_folders_shared_note', 'st_p_folders_thisbrowser', 'st_p_folders_share',
        'st_p_folders_share_t', 'st_p_folders_shared',
        'tl_new_category', 'tl_new_category_sub', 'tl_new_category_eg',
        'tl_create_category', 'tl_create_new_category',
        'fo_new_stream_sub', 'fo_new_stream_eg', 'fo_save_failed'])
        assert.equal((I18N.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2,
          k + ' is in English and Swedish');
      for (const k of ['st_p_cats_used_one', 'st_p_cats_used_other'])
        assert.equal((I18N.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2, k);
    });
  });
});
