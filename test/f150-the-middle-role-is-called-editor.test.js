/* ============================================================
   f150 — the middle role is called Editor, and only on screen

   The three permission levels were Admin / Legal / Viewer. "Legal" read as a
   department — the legal team — when it never meant that: it is the level that
   drafts, negotiates and signs, held by a COO or a CIO as readily as by a
   lawyer. It is now called Editor.

   The rename is WORDS ONLY. The stored role id is still `legal`: it is a
   database CHECK constraint, a permission key on every server route and the
   value in every existing account row. Renaming the id would be a migration
   that buys nothing, and a half-done one locks people out of their own
   workspace.

   What this file pins:

     · the id did not move — the server still checks admin/legal/viewer
     · both words for the role say Editor: ROLE_LABEL (what a new record is
       stamped with) and roleName() (what the screen shows)
     · a signature that carries the OLD word is still recognised as a
       permission level and suppressed — history does not shift under a reader
     · no role-naming string in either dictionary calls the level "Legal" or
       "Jurist" any more
     · the words that legitimately mean the legal PROFESSION are untouched —
       the playbook's escalation flag still asks for Legal approval, because
       that one really does mean a lawyer
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const { STRINGS } = require('../js/i18n.js');

const ROOT = path.join(__dirname, '..');
const core = () => loadViews(['js/core.js'], {
  TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
  docBody: () => '<p>doc</p>', captureVersion: () => null, docFormat: f => f,
  updateSidebarCounts() {}, renderWorkspace() {}, setView() {}, renderSignButton() {},
});

/* Every string whose job is to NAME the permission level. Each is checked in
   both languages, so a rename that lands in one dictionary and not the other
   fails here rather than on a customer's screen. */
const ROLE_NAMING_KEYS = [
  'role_legal', 'set_role_legal', 'set_role_help', 'set_any_legal',
  'ap_a_legal_approver', 'ap_admin_or_legal', 'lib_admin_legal_edit',
  'tl_admin_legal_only', 'set_admin_legal_change', 'mig_viewers_readonly',
];

describe('f150 — Editor is a new word, not a new role', () => {
  test('the stored id did not move', () => {
    const server = fs.readFileSync(path.join(ROOT, 'server/server.js'), 'utf8');
    assert.ok(server.includes("role IN ('admin','legal','viewer')"),
      'the accounts table still stores the middle role as `legal`');
    assert.ok(server.includes("['admin','legal','viewer'].includes(role)"),
      'and the create-user route still accepts exactly those three ids');
  });

  test('both words for the role say Editor', () => {
    const { ROLE_LABEL, roleName } = core();
    assert.equal(ROLE_LABEL.legal, 'Editor', 'the word a new record is stamped with');
    assert.equal(roleName('legal'), 'Editor', 'the word the screen shows');
    assert.equal(ROLE_LABEL.admin, 'Admin');
    assert.equal(ROLE_LABEL.viewer, 'Viewer');
  });

  test('a signature carrying the old word is still not a capacity', () => {
    const { signatureCapacity } = core();
    const sig = role => ({ name: 'Amina Otieno', role });
    assert.equal(signatureCapacity(sig('Legal')), '', 'signed before the rename');
    assert.equal(signatureCapacity(sig('Editor')), '', 'signed after it');
    assert.equal(signatureCapacity(sig('Finance Director')), 'Finance Director',
      'a real capacity still shows');
  });

  for (const lang of Object.keys(STRINGS)) {
    test(`no ${lang} role-naming string still calls the level Legal`, () => {
      const stale = ROLE_NAMING_KEYS.filter(k => /\b(legal|jurist)/i.test(STRINGS[lang][k] || ''));
      assert.deepEqual(stale, [], `these still name the role after the old word: ${stale.join(', ')}`);
    });

    test(`every ${lang} role-naming string names the level`, () => {
      const missing = ROLE_NAMING_KEYS.filter(k => !/(editor|redigerar)/i.test(STRINGS[lang][k] || ''));
      assert.deepEqual(missing, [], `these lost the role's name entirely: ${missing.join(', ')}`);
    });
  }

  test('the legal PROFESSION is left alone', () => {
    // the playbook's escalation flag means a lawyer signs off, not that a
    // member holding the Editor level does — renaming it would change a rule
    assert.match(STRINGS.en.pb_needs_legal, /Legal/);
    assert.match(STRINGS.en.set_flag_legal, /Legal/);
    assert.match(STRINGS.en.ad_st_submitted_desc, /legal team/i);
  });
});
