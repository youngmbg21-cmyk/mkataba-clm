/* ═══════════════════════════════════════════════════════════════════════════
   f1132 — NO BUTTON YOU CANNOT USE, AND NOTHING PRETENDS TO SAVE (Round C of
   the owner's ground rules, 20 Nov 2026: "go for round C then merge B and C
   together")

   Inside a contract a Viewer still met "Fill in 1 detail before anyone signs."
   with its buttons, Change and Check on the facts, Fill in · Start redlining ·
   Counter · Reject on the paper's notes, "I have read this" (which said
   "Recorded" and kept nothing), the Send and Amend forms, the clause editor,
   the highlight menu's Make it an obligation, and on the phone Edit, Share,
   Renumber and Save as template.

   WHAT THIS PINS — each shut at the ONE helper every door uses
     (1) the Dossier owes a Viewer nothing (dossierOwed), and the paper's notes
         keep their reading but lose their buttons (pd2ActsFor)
     (2) Change and Check on the facts are not drawn; the brief keeps its way
         to the top but not "I have read this", and its writer records nothing
         for a Viewer and says why
     (3) the Send screen, Amend, the clause editor and a risk's Edit refuse at
         the door with one line (viewer_reads_only)
     (4) a Viewer approves and decides nothing (userCanApprove, saMayDecide);
         Calendar offers no Decide; Jambo's house no level buttons; the signing
         check card is not drawn; the highlight menu offers only Ask and My
         notes; the Negotiations panel's Send and Chase follow the desk seat
     (5) the phone offers no Edit, Share, Renumber or Save as template, and its
         Details tab says the true reason
   AT THE PARENT (5a154f2) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js'), FA = R('js/family.js'), CE = R('js/views/clauseeditor.js'), RK = R('js/risks.js'), AP = R('js/approvals.js'),
  SA = R('js/signapproval.js'), CAL = R('js/views/calendar.js'), CO = R('js/core.js'), JH = R('js/views/jambohouse.js'), SC = R('js/signcheck.js'),
  CA = R('js/copilotacts.js'), CT = R('js/views/contract.js'), RG = R('js/views/register.js'), MC = R('js/mobile-contract.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const run = (src, ctx) => { ctx.window = ctx; vm.createContext(ctx); vm.runInContext(src, ctx); return ctx; };

describe('f1132 (1) the Dossier and the paper\'s notes', () => {
  test('1a nothing is owed by a Viewer', () => {
    const ctx = run(fnBody(PD, 'dossierOwed'), { mayActOn: () => false, detailsOf: () => ({ live: true, items: [{ open: true, key: 'k' }] }) });
    assert.deepEqual(Array.from(ctx.dossierOwed({ id: 'MK-1' })), []);
  });
  test('1b a note keeps its words, loses its buttons', () => {
    const ctx = run(fnBody(PD, 'pd2ActsFor'), { mayActOn: () => false });
    assert.equal(ctx.pd2ActsFor('<button>Fill in</button>'), '');
    const ok = run(fnBody(PD, 'pd2ActsFor'), { mayActOn: () => true });
    assert.equal(ok.pd2ActsFor('<button>Fill in</button>'), '<button>Fill in</button>');
    assert.equal((PD.match(/pd2ActsFor\([nx]\.acts\) \? `<div class="pd2-mn-a">\$\{pd2ActsFor\([nx]\.acts\)\}<\/div>`/g) || []).length, 3, 'every note painter asks it');
  });
});

describe('f1132 (2) facts, and the brief', () => {
  test('2a Change and Check are not drawn for a Viewer', () => {
    assert.match(PD, /const chk = \(typeof window\.mayActOn === 'function' && !window\.mayActOn\(c\)\) \? '' :/);
    assert.match(PD, /go: \(typeof window\.mayActOn === 'function' && !window\.mayActOn\(c\)\) \? '' : `data-pd-people=/);
  });
  test('2b the brief: no "I have read this"; its writer records nothing and says why', () => {
    assert.match(PD, /\(typeof window\.mayActOn === 'function' && !window\.mayActOn\(c\)\) \? \{ link: top \} : \{ label: _pdT\('br_mark_read'\)/);
    let said = '';
    const ctx = run(fnBody(SC, 'briefReadSave'), { mayActOn: () => false, toast: (m, k) => { said = k + ':' + m; }, i18t: k => k, briefMarkRead: () => { throw new Error('must not record'); } });
    assert.equal(ctx.briefReadSave({ id: 'MK-1' }), null);
    assert.equal(said, 'warn:viewer_reads_only');
  });
});

describe('f1132 (3) doors refuse with one line', () => {
  test('3a Send screen, Amend, the clause editor, a risk\'s Edit', () => {
    assert.match(strip(fnBody(CO, 'openShareModal')), /if\(typeof mayActOn==='function' && !mayActOn\(c\)\)\{ toast\(i18t\('viewer_reads_only'\),'warn'\); return; \}/);
    assert.match(strip(fnBody(PD, 'pdAmendOpen')), /toast\(i18t\('viewer_reads_only'\), 'warn'\); return false;/);
    assert.match(strip(fnBody(FA, 'amendmentShutWhy')), /return i18t\('viewer_reads_only'\);/);
    assert.match(strip(fnBody(CE, 'clauseEditorRefusal')), /!window\.mayActOn\(c\)\) return i18t\('viewer_reads_only'\);/);
    assert.match(strip(fnBody(RK, 'riskEditStart')), /toast\(i18t\('viewer_reads_only'\), 'warn'\); return false;/);
  });
});

describe('f1132 (4) approving, deciding, and the rest', () => {
  test('4a a Viewer approves and decides nothing', () => {
    const ap = run(fnBody(AP, 'userCanApprove'), { mayActOn: (c, u) => u.role !== 'viewer' });
    assert.equal(ap.userCanApprove({ kind: 'member', id: 'v1' }, { id: 'v1', role: 'viewer' }), false);
    assert.equal(ap.userCanApprove({ kind: 'member', id: 'e1' }, { id: 'e1', role: 'legal' }), true);
    const sa = run(fnBody(SA, 'saMayDecide'), {});
    assert.equal(sa.saMayDecide({ approverId: 'v1' }, { id: 'v1', role: 'viewer' }), null);
  });
  test('4b no Decide on the Calendar, no levels in Jambo\'s house, no signing check card', () => {
    const cal = run(fnBody(CAL, 'calChipAct'), { mayActOn: () => false });
    assert.equal(cal.calChipAct({ type: 'renewal' }, { k: 'decide' }), '');
    assert.match(strip(fnBody(JH, 'jhnMayHtml')), /!window\.mayActOn\(null\)\) return '';/);
    assert.match(strip(fnBody(CT, 'signCheckCardHtml')), /if\(typeof window\.mayActOn==='function' && !window\.mayActOn\(c\)\) return '';/);
  });
  test('4c the highlight menu offers Ask and My notes only; Send and Chase follow the desk seat', () => {
    const i = CA.indexOf('const CA_SEL_ACTIONS = () => ['), j = CA.indexOf('\n', CA.indexOf("const CA_SEL_WRITES = ['oblig', 'risk', 'note'];"));
    const ctx = run(CA.slice(i, j) + '\nthis.CA_SEL_ACTIONS = CA_SEL_ACTIONS;', { mayActOn: () => false, _caT: k => k });
    assert.deepEqual([...ctx.CA_SEL_ACTIONS().map(a => a.id)], ['ask', 'mine']);
    /* RE-POINTED 21 Nov 2026 (P-29, as drawn): the chosen deal's one act (Send · Remind) is read by ngnActOf, the row's and the panel's */
    assert.match(strip(fnBody(RG, 'ngnActOf')), /!\(typeof window\.deskMaySend === 'function' && !window\.deskMaySend\(c\)\)/);
  });
});

describe('f1132 (5) the phone', () => {
  test('5a no Edit, Share, Renumber or Save as template; Details says the true reason', () => {
    assert.match(MC, /^const M_ROW_WRITES = \['look-done', 'edit', 'edit-locked', 'share', 'renumber', 'renumber-locked', 'template'\];$/m);
    assert.match(strip(fnBody(MC, 'mOverflowSheetHtml')), /!window\.mayActOn\(c\)\) \|\| !M_ROW_WRITES\.includes\(i\.k\)/);
    assert.match(MC, /!window\.mayActOn\(c\)\) return rv;/);
    assert.match(strip(fnBody(MC, 'mDetHtml')), /mEsc\(i18t\('viewer_reads_only'\)\)/);
  });
});
