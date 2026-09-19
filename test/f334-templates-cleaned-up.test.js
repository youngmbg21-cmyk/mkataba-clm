/* f334 — THE TEMPLATES PAGE, CLEANED UP (Young ruled all eight, 19 Sep 2026).
 *
 * Eight reports off five screenshots of the section that had shipped the day
 * before. Each is measured below, and each measurement is quoted beside the
 * claim that holds it — because seven of the eight were invisible in the
 * source and only a rendered page could show them.
 *
 *   1  "i do not want to have to hover over a contract in order to see the
 *       other choices I have as far as buttons"
 *   2  "this pop up does not look like they are buttons or selections it
 *       looks like a written paper"
 *   3  "i do not understand what the pop up error means"
 *   4  "the buttons have to align on a straight align across all the tabs"
 *   5  "the page needs to look like it is on a paper contract not just across
 *       the screen"
 *   6  "when i click across the different options it seems like it is clunky
 *       and there are delays in navigation"
 *   7  "You also have not implemented how the paper is doing tab"
 *   8  "Make entire templates tab more professional"
 *
 * WHAT THIS FILE CANNOT SEE, and where to look instead. Four of the eight are
 * GEOMETRY or PAINT — where a button starts, whether a menu row looks like a
 * control, whether a sheet is a sheet, whether a press moves the reader — and
 * a source test cannot answer any of them. templates-cleaned-up-verify drives
 * a real browser for those; what is pinned here is the MACHINERY each one
 * rests on, so a later edit that quietly takes the mechanism away fails here
 * even if the pixels happen to survive.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, STUB_FOLDERS } = require('./dom');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js/views/library.js'), 'utf8');
const LIB = fs.readFileSync(path.join(__dirname, '..', 'js/views/templatelib.js'), 'utf8');
const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const I18N = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
const ago = d => new Date(Date.now() - d * 86400000).toISOString();
const raised = d => [{ action: 'Created', at: ago(d) }];

/* PIN THE REGION, NOT A BOUNDARY THAT HAPPENS TO HOLD. A slice that runs to
   the next thing that happens to be written below is a slice that stops being
   the function it names the moment somebody writes between them — this file's
   own f244 sibling paid for that on 19 Sep 2026. */
const fnBody = (src, name) => {
  const at = src.indexOf('function ' + name + '(');
  if (at < 0) return '';
  /* AND `async function` ENDS A REGION TOO. f213 paid for this on 17 Sep and
     this file paid for it again on its first run: tplLibArchivedAsk is
     followed by `async function tplLibEdit`, which `\nfunction ` does not
     match, so the slice ran on through three more functions and the claim
     failed on a date formatted in one of them. */
  const ends = [src.indexOf('\nfunction ', at + 1), src.indexOf('\nasync function ', at + 1)]
    .filter(i => i > 0);
  return src.slice(at, ends.length ? Math.min(...ends) : src.length);
};
/* A CHECK ABOUT CODE MUST NOT READ COMMENTS. The first run failed "NO SCORE"
   on the source's own note explaining that there is no score — a true
   sentence, read as a violation. */
const noComments = src => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

/* tpl_1 is company paper four contracts have come off: three checked, two of
   those off-standard, one never checked. ct1 is a saved template with one
   contract nobody has checked. ND/PS/LE are HaTi's own, nothing drafted. */
function stage(over = {}) {
  const T = {};
  for (const [id, kind] of Object.entries({ ND: 'NDA', PS: 'Professional Services', LE: 'Lease' }))
    T[id] = { id, kind, name: kind, blurb: kind + ' paper', folder: 'proc', valueType: 'estimated', ic: 'file' };
  const V = (category, status) => ({ category, status, quote: '', position: '', redline: '', escalate: false });
  const contracts = [
    { id: 'MK-1', name: 'A', templateId: 'tpl_1', audit: raised(5),
      playbook: { verdicts: [V('Liability cap', 'deviation'), V('Payment terms', 'deviation')] } },
    { id: 'MK-2', name: 'B', templateId: 'tpl_1', audit: raised(10),
      playbook: { verdicts: [V('Liability cap', 'ok')] } },
    { id: 'MK-3', name: 'C', templateId: 'tpl_1', audit: raised(200),
      playbook: { verdicts: [V('Liability cap', 'missing')] } },
    { id: 'MK-4', name: 'D', templateId: 'tpl_1', audit: raised(3) },
    { id: 'MK-5', name: 'E', templateRef: 'ct1', audit: raised(1) },
  ];
  return loadViews(['js/richdoc.js', 'js/views/reports.js', 'js/playbook.js', 'js/views/library.js'], {
    TEMPLATES: T, FOLDERS: STUB_FOLDERS, folderColor: () => '#2e9f80',
    templateFormat: () => 'plain', isRich: () => false,
    templateAllowedForRole: () => true, canEdit: () => true,
    currentUser: () => ({ name: 'Amina', role: 'admin' }),
    openModal() {}, closeModal() {}, setView() {}, setActiveNav() {},
    DLG_W: { s: '400px', m: '520px', l: '640px', xl: '760px' },
    state: { contracts, settings: { customTemplates: [
      { id: 'ct1', name: 'Naivas Supply Terms', folder: 'sales', at: ago(2), source: 'paste',
        text: 'x'.repeat(400), format: 'plain' } ] }, view: 'templates' },
    tplLibAll: () => ({ canManage: true, loaded: true, list: [
      { id: 'tpl_1', name: 'Wanjiru Standard MSA', status: 'published', publishedVersion: 4,
        category: 'services', contractsCreated: 38, lastUsedAt: ago(1) },
      { id: 'tpl_2', name: 'Warehousing Agreement', status: 'draft', publishedVersion: null,
        category: 'services', contractsCreated: 0 } ] }),
    TPLLIB_CATEGORIES: { services: 'Services' },
    API_MODE: () => false,
    ...over,
  });
}

/* ════════════════════════ 1 · NOTHING HIDES ════════════════════════════ */
describe('f334 (1) — every verb is visible at rest', () => {
  /* MEASURED at the parent on a 21-row table with no pointer on the page:
     the second and third buttons resolved `opacity: 0` and only a hover or a
     keyboard focus brought them back. This REVERSES 18 Sep's "two verbs at
     rest, the rest on demand" — and the reasoning that rule was built on is
     kept in the source beside it, because it is the half that was wrong. */
  test('the row builder emits no hover wrapper', () => {
    const body = fnBody(SRC, 'tplPageRowHtml');
    assert.ok(!/class="tpl-rest"/.test(body),
      'a verb wrapped in tpl-rest is a verb nobody can see until they go looking');
    assert.ok(!/const rest\s*=/.test(body), 'and the wrapper itself is gone, not merely unused');
  });

  test('and the rule that hid them is out of the sheet', () => {
    assert.ok(!/\.tpl-rest\s*\{/.test(HTML), 'the opacity:0 rule is gone');
    assert.ok(!/tr:hover \.tpl-rest/.test(HTML), 'and so is the hover that revealed it');
  });

  test('the name stays in the source as a retired one, never as a live emitter', () => {
    /* A class deleted without a word is a class somebody puts back. The note
       says it is stale; what must never come back is an EMITTER. */
    assert.match(SRC, /`\.tpl-rest` is STALE/, 'the retirement is written down');
    assert.equal((SRC.match(/class="tpl-rest"/g) || []).length, 0);
  });

  test('every kind of row still draws its full set of verbs', () => {
    const s = stage();
    const row = k => s.tplPageRowHtml(s.tplPageFiltered(s.tplPageRows()).find(r => r.kind === k)
      || s.tplPageRows().find(r => r.kind === k));
    /* company paper: draft a contract, edit, and the dots */
    const co = row('company');
    assert.match(co, /data-tpllib-use=/);
    assert.match(co, /data-tpllib-edit=/);
    assert.match(co, /data-tpl-dots=/);
    /* a saved template: draft, open, dots */
    const cp = row('cp');
    assert.match(cp, /data-tpl-use=/);
    assert.match(cp, /data-tpl-prev=/);
    assert.match(cp, /data-tpl-dots=/);
    /* HaTi's own: draft, make it ours, dots */
    const bi = row('builtin');
    assert.match(bi, /data-tpl-builtin=/);
    assert.match(bi, /data-tpl-ours=/);
    assert.match(bi, /data-tpl-dots=/);
  });
});

/* ══════════════════════ 2 · A MENU LOOKS LIKE A MENU ═══════════════════ */
describe('f334 (2) — the dots menu is a list of controls', () => {
  /* MEASURED on the real menu at the parent: every row drew
     `border: 0px none` on a transparent ground, 54px tall, in a 490px frame,
     each a bold line with a full sentence under it. Nine of those read as
     prose because nothing about them was shaped like a control. */
  test('a row carries a symbol, and the symbol comes from the shell’s own sprite', () => {
    const body = fnBody(SRC, 'tplRowMoreMenu');
    assert.match(body, /<use href="#i-\$\{n\}"\/>/, 'one sprite reference, built once');
    assert.ok(!/onmouseover=/.test(body),
      'the hover was two inline attributes writing style.background — which a keyboard never fires');
    assert.match(body, /class="tpl-m-row"/, 'and the row is a class the sheet can dress');
  });

  test('the explanation moves to the hover, and is never dropped', () => {
    const body = fnBody(SRC, 'tplRowMoreMenu');
    assert.match(body, /title="\$\{_tplEsc\(sub\|\|''\)\}"/,
      'every row still carries its sentence — on title, where a menu keeps one');
    for (const k of ['lib_m_versions_sub', 'lib_m_edit_sub', 'lib_m_blanks_sub', 'lib_m_bulk_sub',
      'lib_m_shelf_sub', 'lib_m_rename_sub', 'lib_m_delete_sub'])
      assert.ok(body.includes(k), `${k} is still passed — retired from the face, not from the product`);
  });

  test('the count is the row’s own slot, never welded into the verb', () => {
    const body = fnBody(SRC, 'tplRowMoreMenu');
    assert.match(body, /\$\{n==null\?'':`<i>\$\{n\}<\/i>`\}/,
      'so a row with no count is the same shape as a row with one');
    assert.ok(!/\$\{i18t\('lib_m_versions'\)\} \(\$\{/.test(body),
      'the old shape built "Versions (4)" as one translated string');
  });

  test('the destructive row sits under a divider, and in ruby', () => {
    const body = fnBody(SRC, 'tplRowMoreMenu');
    /* RE-POINTED IN PLACE (19 Sep 2026): the rows go through a `push(id, html)`
       helper now, so each one's ACT can be named once and a menu that would
       offer a single row can run it without a dialog. The divider is exactly
       where it was — what moved is how the row is appended, which this claim
       never meant to pin. So it pins the RELATION: `sep` immediately precedes
       the delete row's markup, however that row is pushed. */
    assert.match(body, /sep\+item\('tm-del'/, 'a divider before it, every time it is drawn');
    assert.ok(!/item\('tm-del'[\s\S]{0,40}\)\)?;\s*$/m.test(body.replace(/sep\+item\('tm-del'/, 'X')),
      'and nothing else pushes a delete row without one');
    assert.match(body, /danger\?' style="color:var\(--st-ruby-fg\)"':''/);
  });

  test('the frame states one width, from the ladder', () => {
    /* A DIALOG STATES ITS WIDTH ONCE, ON THE FRAME (13 Sep 2026). A menu as
       wide as a paragraph reads as a paragraph — 400 rather than the 490
       measured. */
    assert.match(fnBody(SRC, 'tplRowMoreMenu'), /\{maxWidth:DLG_W\.s\}/);
  });

  test('and the sheet dresses the row so a keyboard sees what a pointer sees', () => {
    assert.match(HTML, /\.tpl-m-row:hover,\.tpl-m-row:focus-visible\{/);
    assert.match(HTML, /\.tpl-m-sep\{/);
    /* The symbol's colour may not be inline — an inline declaration can only
       be beaten by !important, and a cascade fight is fixed by SCOPE here. */
    assert.match(HTML, /\.tpl-m-i\{[^}]*color:var\(--color-neutral-600\)/);
    assert.ok(!/style="flex:none;color:var\(--color-neutral-600\)"><use/.test(SRC),
      'so the svg carries a class, never a colour');
  });
});

/* ═══════════════ 3 · A REFUSAL CARRIES ITS WAY FORWARD ═════════════════ */
describe('f334 (3) — the archived refusal names the template and carries Restore', () => {
  test('pressing Edit on an archived template raises the question, never a toast', () => {
    assert.match(LIB, /if \(t\.status === 'archived'\) \{ tplLibArchivedAsk\(t\); return; \}/,
      'a toast cannot be answered, and this one asked the reader to go and find a door');
    assert.ok(!/toast\(i18t\('tl_edit_archived'\)/.test(LIB),
      'the old sentence is retired from the face');
  });

  test('and the sentence stays inert in BOTH books', () => {
    assert.equal((I18N.match(/tl_edit_archived:/g) || []).length, 2,
      'retire a key by leaving it in both, never by deleting it from one');
    assert.match(SRC + LIB, /STALE ON THE FACE|STALE/, 'and the retirement is written down');
  });

  test('the dialog names the template and offers three answers', () => {
    const body = fnBody(LIB, 'tplLibArchivedAsk');
    assert.match(body, /tl_arch_title.*name: t\.name/s, 'it names the template it refused');
    assert.match(body, /tl_arch_restore_edit/);
    assert.match(body, /tl_arch_restore/);
    assert.match(body, /tl_arch_leave/);
  });

  test('NO DATE IS INVENTED, because the record holds none', () => {
    /* `templates` carries no archived_at column. Printing updated_at and
       calling it the archive date would be a guess in a fact's clothes, and
       would read as a lie the first time somebody renamed an archived
       template. AN ABSENCE IS STATED, NEVER GUESSED. */
    const body = fnBody(LIB, 'tplLibArchivedAsk');
    assert.ok(!/updated_at|updatedAt|archivedAt|archived_at/.test(body));
    assert.ok(!/fmtD|toLocaleDateString/.test(body), 'and no date is formatted at all');
  });

  test('ONE WRITER, TWO DOORS — so the two cannot say different things', () => {
    assert.equal((LIB.match(/\{ status: 'restore' \}/g) || []).length, 1,
      'exactly one PATCH writes the restore');
    assert.match(fnBody(LIB, 'tplLibRestore'), /status: 'restore'/, 'and it is in tplLibRestore');
    assert.match(LIB, /tplLibRestore\(t, \(\) => openTemplateLibDetail\(t\.id\)\)/,
      'the detail page presses it');
    assert.match(LIB, /tplLibRestore\(t, \(\) => tplLibEdit\(t\.id\)\)/,
      'and so does the refusal, going on into the builder');
  });

  test('the re-press happens AFTER the record moved, or the wall refuses twice', () => {
    const body = fnBody(LIB, 'tplLibArchivedAsk');
    assert.match(body, /await tplLibRestore\(t, \(\) => tplLibEdit\(t\.id\)\)/,
      'tplLibEdit rides as the `after`, never beside the restore');
  });

  test('every new key is in both books', () => {
    for (const k of ['tl_arch_title', 'tl_arch_says', 'tl_arch_restore_edit', 'tl_arch_restore',
      'tl_arch_leave', 'tl_restored', 'tl_restore_failed'])
      assert.equal((I18N.match(new RegExp(k + ':', 'g')) || []).length, 2, k + ' must be in both books');
  });
});

/* ═════════════ 4 · THE VERBS START FROM ONE LINE ═══════════════════════ */
describe('f334 (4) — one straight column of verbs', () => {
  /* MEASURED at the parent, where each row's FIRST button began:
       saved templates    x = 1236
       HaTi's own twelve  x = 1195
       samples            x = 1316
     — three left edges, 121px apart, down one column. After: 1186 on all
     twenty-one rows. The pixel claim is in the browser file; what is pinned
     here is the mechanism that makes it true. */
  test('the acts cell packs from its own left edge, never from the right', () => {
    const body = fnBody(SRC, 'tplPageRowHtml');
    assert.ok(!/text-align:right;white-space:nowrap"><div style="display:inline-flex/.test(body),
      'right-aligning is what made a row start wherever the row behind it ended');
    assert.match(body, /<div class="tpl-acts">/, 'one class, so every row is packed the same way');
  });

  test('and the sheet states the packing once', () => {
    assert.match(HTML, /\.tpl-acts\{[^}]*justify-content:flex-start/);
  });

  test('the reasoning is written beside it, with the measurement in it', () => {
    assert.match(HTML, /1236[\s\S]{0,200}1195[\s\S]{0,200}1316/,
      'the three measured edges are recorded where the rule is');
  });
});

/* ═════════════ 5 · THE WORDING SITS ON PAPER ═══════════════════════════ */
describe('f334 (5) — a template’s wording is a contract, so it sits on a sheet', () => {
  /* MEASURED on the block before it moved: background transparent, box-shadow
     none, 1194px wide — the whole page — inside a box clipped to 420px with
     a scrollbar. */
  test('the sheet is the Document tab’s own, value for value', () => {
    const body = fnBody(LIB, 'tplLibSheetHtml');
    assert.match(body, /background:var\(--color-doc-warm\)/);
    assert.match(body, /border-color:var\(--color-doc-warm-line\)/);
    assert.match(body, /box-shadow:var\(--shadow-paper\)/);
    assert.match(body, /max-width:var\(--doc-sheet-max,860px\)/);
    assert.match(body, /margin:0 auto/, 'and it is centred');
  });

  test('THE CONTRACT STAYS SQUARE', () => {
    /* --radius is the platform's 2px corner and the paper has never taken it
       (26 Aug 2026). A literal 0 with the reason beside it. */
    assert.match(fnBody(LIB, 'tplLibSheetHtml'), /border-radius:0/);
  });

  test('the 420px clip is gone', () => {
    assert.ok(!/max-height:420px/.test(LIB),
      'a contract cut off at 420px with a scrollbar reads as a widget, not as paper');
  });

  test('the article/div pairing is what carries the design’s face', () => {
    /* The five design rules in index.html read [data-doc-body] as an ANCESTOR
       and name :is(.doc-surface,.rl-paper) — NOT .hati-doc — so a bare
       .hati-doc under the hook would get the sheet and not the typeface. This
       is the design step's own proven pairing. */
    const body = fnBody(LIB, 'tplLibSheetHtml');
    assert.match(body, /<article class="doc-surface"[^>]*><div class="hati-doc">/);
    assert.match(HTML, /:is\(\.doc-surface,\.rl-paper\)/, 'and those rules still name .doc-surface');
  });

  test('the design is the workspace’s, read through window in a try', () => {
    const body = fnBody(LIB, 'tplLibSheetHtml');
    assert.match(body, /resolveDocBranding\(null\)/,
      'null asks for the ORG default — what a contract drafted from this will wear');
    assert.match(body, /window\.resolveDocBranding/, 'branding.js is not on every stage this renders in');
    assert.match(body, /catch \(_\)/, 'and a stage without it draws the sheet anyway');
  });

  test('the wording block presses the one builder', () => {
    assert.match(LIB, /\$\{tplLibSheetHtml\(wording\)\}/);
    assert.equal((LIB.match(/function tplLibSheetHtml/g) || []).length, 1, 'one builder, one sheet');
  });
});

/* ═════════════ 6 · A FILTER REPAINTS THE ROWS ══════════════════════════ */
describe('f334 (6) — a press that filters may not move the reader', () => {
  /* MEASURED on one press of one rail row at the parent: the table is a
     DIFFERENT NODE afterwards, and so are the rail and the search box.

     AND A CORRECTION to this note's first draft, which read "scroll 420
     before, 0 after". Driven across four presses on both builds the scroll
     lands on the same number either way — the browser clamps it to what the
     new page can hold, and the handler's own `showAll=false` is what shortens
     the page. The rebuild is the fault; the clamp is not claimed. */
  test('neither filter handler rebuilds the page', () => {
    /* `tpl-search` is an INPUT ID in the markup long before it is a handler,
       so slicing to its first occurrence ran backwards. Anchored on the two
       handlers themselves. */
    const at = SRC.indexOf("document.querySelectorAll('[data-tpl-group]')");
    const wire = SRC.slice(at, SRC.indexOf("document.getElementById('tpl-search')?.addEventListener", at));
    assert.ok(wire.length > 0 && wire.length < 1200, 'the slice is the two handlers and nothing else');
    assert.ok(!/renderTemplatesPage\(\)/.test(wire),
      'rebuilding the page is what threw the reader to the top');
    assert.equal((wire.match(/tplPageRefilter\(\)/g) || []).length, 2,
      'the group rail and the stream rail, both through the one funnel');
  });

  test('the funnel repaints the rows and flips the lit row, and does nothing else', () => {
    const body = fnBody(SRC, 'tplPageRefilter');
    assert.match(body, /tplPagePaintRows\(\)/);
    assert.match(body, /classList\.toggle\('on'/, 'the lit state is a class flip');
    assert.ok(!/innerHTML\s*=/.test(body), 'it builds no markup of its own');
    assert.ok(!/renderTemplatesPage/.test(body));
  });

  test('which rail row is lit is a class, never an inline colour', () => {
    const body = fnBody(SRC, 'renderTemplatesPage');
    assert.match(body, /class="tpl-rail\$\{_tplPage\.group===key\?' on':''\}"/);
    assert.match(body, /class="tpl-rail tpl-rail-s\$\{_tplPage\.stream===f\.id\?' on':''\}"/);
    assert.ok(!/background:\$\{_tplPage\.group===key\?'var\(--color-accent-100\)'/.test(body),
      'an inline colour computed at build time is why a filter had to rebuild the page');
  });

  test('and the sheet carries the rail’s two states', () => {
    assert.match(HTML, /\.tpl-rail\{/);
    assert.match(HTML, /\.tpl-rail\.on\{background:var\(--color-accent-100\)/);
    assert.match(HTML, /\.tpl-rail\.on \.tpl-rail-n\{/);
  });

  test('the search box was already right and is left exactly as it was', () => {
    assert.match(SRC, /getElementById\('tpl-search'\)\?\.addEventListener\('input',e=>\{ _tplPage\.q=e\.target\.value; tplPagePaintRows\(\); \}\)/,
      'a keystroke has always repainted rows only — the rails are what did not');
  });
});

/* ═════════════ 7 · HOW THE PAPER IS DOING ══════════════════════════════ */
describe('f334 (7) — the first tab answers how the paper is doing', () => {
  test('the tab draws the health reading, not the category wall', () => {
    const body = fnBody(SRC, 'renderTemplatesPage');
    assert.match(body, /data-tpl-sec="overview"[^>]*>\$\{tplHealthHtml\(tplHealthData\(\)\)\}/);
    assert.ok(!/data-tpl-sec="overview"[^>]*>\$\{tplOverviewHtml\(ov\)\}/.test(body));
  });

  test('and the wall is still built, so it is one line from coming back', () => {
    assert.match(SRC, /function tplOverviewHtml\(/, 'kept whole, never deleted');
    assert.match(SRC, /tplOverviewHtml,/, 'and still published');
  });

  test('IT READS AND NEVER MEASURES — no route, no model, no spend', () => {
    const body = fnBody(SRC, 'tplHealthData') + fnBody(SRC, 'tplHealthHtml');
    for (const name of ['api(', 'fetch(', '/api/', 'anthropic', 'copilot'])
      assert.ok(!body.toLowerCase().includes(name.toLowerCase()),
        `the health reading must not reach for ${name}`);
  });

  test('READING MUST NOT WRITE', () => {
    const body = fnBody(SRC, 'tplHealthData');
    for (const name of ['negoInit', 'persist(', 'saveContract', 'logAudit', 'negoFileChange'])
      assert.ok(!body.includes(name), `${name} would create a record by being looked at`);
    /* and proved by running it: a record read twice is a record unchanged */
    const s = stage();
    const before = JSON.stringify(s.state.contracts);
    s.tplHealthData(); s.tplHealthData();
    assert.equal(JSON.stringify(s.state.contracts), before, 'byte-identical after two readings');
  });

  test('the arithmetic is the record’s own', () => {
    const d = stage().tplHealthData();
    /* tpl_1 has four contracts: three checked, two of them off-standard.
       ct1 has one, never checked. MK-3 is 200 days old — the window is the
       most-used panel's, never this reading's, so it still counts. */
    assert.equal(d.checked, 3, 'three contracts carry a playbook result');
    assert.equal(d.changed, 2, 'two of those came back changed');
    assert.equal(d.unchecked, 2, 'MK-4 and MK-5, counted and never folded in');
    assert.ok(Math.abs(d.rate - 2 / 3) < 1e-9, 'two thirds — of what was CHECKED');
  });

  test('NEVER-CHECKED IS NEVER COUNTED AS CLEAN', () => {
    const d = stage().tplHealthData();
    const clean = d.rows.filter(r => r.scanned > 0 && r.off === 0).length;
    assert.equal(d.clean, clean, 'clean means checked and unchanged, never merely unread');
    const unread = d.rows.find(r => r.scanned === 0);
    assert.ok(unread, 'a template nobody has checked is still drawn');
    assert.ok(unread.unscanned > 0, 'and says how many are waiting');
    /* the tile states it as its own figure, in its own words */
    assert.match(fnBody(SRC, 'tplHealthHtml'), /lib_h_unread_cap/);
    assert.match(I18N, /lib_h_unread_sub: 'counted as unknown'/);
  });

  test('NOTHING IS HIDDEN FOR THIN EVIDENCE', () => {
    /* A template with two contracts is SHOWN and says it has two, rather than
       dropped for failing a floor. TPL_DEV_MIN still governs what counts as
       an ALARM — it is the attention list's floor — never what is drawn. */
    const body = fnBody(SRC, 'tplHealthData');
    assert.ok(!/TPL_DEV_MIN/.test(body), 'no evidence floor on what is drawn');
    const d = stage().tplHealthData();
    assert.ok(d.rows.some(r => (r.scanned + r.unscanned) < 3),
      'a thin row is on the list, not off it');
  });

  test('NO SCORE — a figure a lawyer cannot re-derive is worse than a count', () => {
    const body = noComments(fnBody(SRC, 'tplHealthData') + fnBody(SRC, 'tplHealthHtml')).toLowerCase();
    for (const name of ['score', 'grade', 'rating', '/ 10', 'out of 10'])
      assert.ok(!body.includes(name), `no ${name} anywhere in the reading`);
  });

  test('worst first is the COUNT, not the rate', () => {
    /* One contract out of one is a 100% rate and one argument; nine of forty
       is 22% and nine. Both ride the row so a reader sees both. */
    const d = stage().tplHealthData();
    for (let i = 1; i < d.rows.length; i++)
      assert.ok(d.rows[i - 1].off >= d.rows[i].off, 'ordered by how many came back changed');
  });

  test('how few templates account for half the argument is WALKED, never assumed', () => {
    const d = stage().tplHealthData();
    assert.equal(d.few, 1, 'one template carries both of the two changes');
    assert.ok(Math.abs(d.fewShare - 1) < 1e-9, 'and it accounts for all of them');
    const empty = stage({ state: { contracts: [], settings: { customTemplates: [] }, view: 'templates' } })
      .tplHealthData();
    assert.equal(empty.few, 0, 'zero changes is zero templates, never "all of them"');
    assert.equal(empty.fewShare, null, 'and no share at all');
  });

  test('the clause they argue about most is counted PER CONTRACT', () => {
    const d = stage().tplHealthData();
    const liab = d.clauses.find(c => c.name === 'Liability cap');
    const pay = d.clauses.find(c => c.name === 'Payment terms');
    /* MK-1 argues both; MK-3 is a `missing` on Liability cap. One contract
       arguing a category twice would still be ONE argument about it. */
    assert.equal(liab.n, 2, 'MK-1 and MK-3');
    assert.equal(pay.n, 1, 'MK-1 alone');
    assert.ok(!d.clauses.some(c => c.name === ''), 'a verdict with no category is not a clause');
  });

  test('a verdict that is neither deviation nor missing is not an argument', () => {
    const s = stage({ state: { contracts: [
      { id: 'OK-1', name: 'Z', templateId: 'tpl_1', audit: raised(2),
        playbook: { verdicts: [{ category: 'Liability cap', status: 'ok' }] } },
    ], settings: { customTemplates: [] }, view: 'templates' } });
    assert.deepEqual(s.tplHealthData().clauses, [], 'an ok verdict is not an argument');
  });

  test('a sample is not our paper, and a template nothing came off is stated', () => {
    const d = stage().tplHealthData();
    assert.ok(!d.rows.some(r => r.kind === 'sample'), 'a sample has never left the building');
    assert.ok(d.idle > 0, 'and what nothing has been drafted from is counted');
    assert.match(fnBody(SRC, 'tplHealthHtml'), /lib_h_idle/, 'and said, never silently dropped');
  });

  test('nothing sent at all is its own sentence, never an empty panel', () => {
    /* `used` is the SERVER's count, so emptying state.contracts alone leaves
       tpl_1 reading 38 drafted with none of them loaded — which is the
       light-list case below, not an empty book. */
    const s = stage({ state: { contracts: [], settings: { customTemplates: [] }, view: 'templates' },
      tplLibAll: () => ({ canManage: true, loaded: true, list: [] }) });
    const d = s.tplHealthData();
    assert.equal(d.checked, 0);
    assert.equal(d.rate, null, 'no contracts checked is NO score, never a good one');
    assert.match(s.tplHealthHtml(d), /No contract has been drafted from any of your templates yet/);
  });

  test('a template whose paper is not loaded here is SAID, never reported on', () => {
    /* Found by driving it: `used` is the server's count and `scanned +
       unscanned` is the working set. A row built off `used` alone drew an
       empty track and said "0 drafted, not checked" — a sentence about this
       browser dressed as a fact about the book. */
    const s = stage({ state: { contracts: [], settings: { customTemplates: [] }, view: 'templates' } });
    const d = s.tplHealthData();
    assert.equal(d.rows.length, 0, 'nothing readable is nothing reported on');
    assert.ok(d.offBook > 0, 'and what was left out is counted');
    assert.equal(d.checked, 0, 'never folded into the figures');
    assert.match(s.tplHealthHtml(d), /are not loaded in this browser/,
      'the fxMissing rule: what was left out is counted and SAID');
  });

  test('every row is a door, and it is the door this page already had', () => {
    const s = stage();
    const html = s.tplHealthHtml(s.tplHealthData());
    assert.match(html, /data-tpl-ov-card="1" data-tpl-ov-name="/,
      'the name door — the same one the overview panels have always used');
    assert.ok(!/data-tpl-ov-bucket=/.test(html), 'the category door belongs to the wall');
  });

  test('the rows are capped and the cap says so', () => {
    assert.match(SRC, /const TPL_HEALTH_ROWS = 8;/);
    const s = stage();
    const d = s.tplHealthData();
    assert.ok(d.rows.length <= s.TPL_HEALTH_ROWS);
    assert.equal(typeof d.more, 'number', 'and what was left out is a number, not an absence');
  });

  test('every key is in both books, and the two captions are plural-aware', () => {
    const keys = [...new Set((I18N.match(/\blib_h_[a-z_]+(?=:)/g) || []))];
    assert.ok(keys.length >= 28, 'the health view brought a real vocabulary');
    for (const k of keys)
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2,
        k + ' must be in both books');
    /* "1 templates causing most of it" is what a non-plural caption prints. */
    for (const k of ['lib_h_few_cap', 'lib_h_clean_cap'])
      assert.ok(I18N.includes(k + '_one:') && I18N.includes(k + '_other:'),
        k + ' sits under a figure that can be 1');
    assert.match(fnBody(SRC, 'tplHealthHtml'), /i18tn\('lib_h_few_cap', d\.few/);
    assert.match(fnBody(SRC, 'tplHealthHtml'), /i18tn\('lib_h_clean_cap', d\.clean/);
  });
});

/* ═════════════ 8 · THE TABLE READS MORE SERIOUSLY ══════════════════════ */
describe('f334 (8) — one button weight, and the figures line up', () => {
  test('one filled button per row, at most', () => {
    const s = stage();
    for (const r of s.tplPageRows()) {
      const html = s.tplPageRowHtml(r);
      assert.ok((html.match(/ui-btn-primary/g) || []).length <= 1,
        `${r.name} draws more than one filled button — the row is then scanned by count, not by weight`);
    }
  });

  test('the head of a count column sits over its digits', () => {
    const body = fnBody(SRC, 'tplPagePaintRows');
    assert.match(body, /const th=\(t,num\)=>/, 'the head builder knows which columns are counts');
    assert.match(body, /\$\{th\(i18t\('lib_col_version'\),1\)\}\$\{th\(i18t\('lib_col_used'\),1\)\}/,
      'Version and Used, and nothing else — a label over words stays a label');
    assert.match(body, /num\?';font-variant-numeric:tabular-nums':''/);
  });

  test('and the cells under them already stated it', () => {
    assert.equal((fnBody(SRC, 'tplPageRowHtml').match(/font-variant-numeric:tabular-nums/g) || []).length, 2,
      'the two count cells — unchanged, which is why only the heads were ragged');
  });
});
