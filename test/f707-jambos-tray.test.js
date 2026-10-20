'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f707 — UPLOAD, "JAMBO'S TRAY" (round 5 of the redesign: the owner picked
   "Jambo's tray" by name and answered "Yes and Read it at once", 17 Oct 2026)
   (1) ONE WAY IN: on a computer every door that opened the upload pop-up (the
       new-agreement menu's Upload, the + menu, a page's Upload, the arrivals
       agent's own door) lands on the drop area in Jambo's panel (pdDropDoor);
       the pop-up stays for what a drop hands it and on the phone. The
       importer's one door moved under the drop area with the pop-up's job.
   (2) WHAT JAMBO FOUND, at a glance: the brief's first lines, departures from
       our standards and obligations found (while signing is ahead), a line
       under each row naming what it counts, and when it was read on arrival.
   (3) A file dropped into a private stream is read at once, as today (the
       owner's "Read it at once"): the drop still counts as the yes.
   AT THE PARENT (51b7d25) every test here FAILS but two controls: 2e (a
   reading writes nothing) and 3a (the behaviour the owner kept).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const J = x => JSON.parse(JSON.stringify(x));
const PD = R('js/paperdesk.js');
const WZ = R('js/wizard.js');
const APP = R('js/app.js');
const AG = R('js/views/agents.js');
const CT = R('js/views/contract.js');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();

function pdStage({ status = 'Draft', playbook = null, obligations = null, brief = null, triage = null, items = [] } = {}){
  const c = { id: 'MK-1', contractNo: 'MK-1', counterparty: '', status, playbook, obligations, _brief: brief, triage };
  const ctx = {
    intel: { paper: { id: 'MK-1' }, dockOpen: true }, state: { view: 'dashboard' },
    getContract: id => (id === c.id ? c : null), contractRef: x => x.contractNo,
    i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : ''), i18tn: (k, n) => k + ':' + n,
    igHomePaperFace: () => true, hbFace: () => 'paper', canEdit: () => true,
    detailsOf: () => ({ left: items.filter(x => x.open).length, all: items.length, live: true, items }),
    signBlockers: () => [], negoMayStartLine: () => '', contractStatusTextHtml: () => '',
    deviationSummary: cc => (cc.playbook ? { dev: cc.playbook.verdicts.filter(v => v.status === 'deviation').length, miss: cc.playbook.verdicts.filter(v => v.status === 'missing').length } : null),
    obligationIsTheirs: o => o.party === 'theirs',
    triageReadAnything: cc => !!(cc.triage && cc.triage.steps && Object.values(cc.triage.steps).some(s => s && s.ok)),
    langLocale: () => 'en-GB', renderIntelDock: () => {}, setTimeout: () => 0,
  };
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(PD, ctx);
  return { ctx, c };
}
const PB = { verdicts: [{ category: 'liability cap', status: 'deviation' }, { category: 'governing law', status: 'missing' }, { category: 'payment terms', status: 'aligned' }] };
const OBS = [{ desc: 'Report', party: 'theirs' }, { desc: 'Insure', party: 'theirs' }, { desc: 'Pay', party: 'ours' }, { desc: 'Old', party: 'ours', status: 'done' }];

describe('f707 (1) one way in: the tray', () => {
  test('1a every door that opened the pop-up asks the tray first', () => {
    const DOOR = "if(typeof pdDropDoor==='function' && pdDropDoor()) return; ";
    assert.equal((WZ.match(new RegExp(DOOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "if\\(typeof openUploadModal==='function'\\) openUploadModal\\(\\);", 'g')) || []).length, 2, 'the new-agreement menu, both of its builders');
    assert.ok(APP.includes("menu.classList.add('hidden'); " + DOOR + 'openUploadModal();'), 'the + menu');
    assert.ok(APP.includes('if(up){ ' + DOOR + 'if(window.openUploadModal) openUploadModal(); return; }'), "a page's Upload");
    assert.ok(AG.includes("if (which === 'upload'){ if (typeof pdDropDoor === 'function' && pdDropDoor()) return;"), "the arrivals agent's own door");
    assert.match(CT, /function openUploadModal\(\)\{/, 'the pop-up itself is kept, for what a drop hands it');
  });
  test('1b the tray is the Contracts place with Jambo open on his drop area, never on the phone, refused to a viewer', () => {
    const d = PD.slice(PD.indexOf('function pdDropDoor('), PD.indexOf('\n}', PD.indexOf('function pdDropDoor(')));
    assert.match(d, /window\.innerWidth < 768\)\) return false;/);
    assert.match(d, /if \(!pdDropMay\(\)\)\{[^}]*ct_viewers_no_add/);
    assert.match(d, /hbOpenContracts\(\);/); assert.match(d, /intel\.dockOpen = true/); assert.match(d, /pdSetTab\('copilot'\);/);
    /* RE-POINTED 18 Oct 2026 (LAND ON IT): lit by the house's one lander, Choose files ready */
    assert.match(d, /landOn\('#pd-drop', \{ focus: '\[data-pd-drop-pick\]' \}\)/, 'the drop area is lit where the door brings you');
  });
  test('1c several files: the importer\'s one door is under the drop area, with what waits there', () => {
    assert.match(PD, /\$\{pdDropImportHtml\(\)\}`;\n\}/);
    const f = PD.slice(PD.indexOf('function pdDropImportHtml('), PD.indexOf('function pdDropDoor('));
    assert.match(f, /_pdT\('ct_several_q'\)[\s\S]*data-pd-drop-import[\s\S]*_pdT\('ct_import_contracts_link'\)/);
    assert.match(f, /navCounts\(\)[\s\S]*migration/);
    assert.match(PD, /\[data-pd-drop-import\][\s\S]{0,120}setView\('migration'\)/);
  });
});

describe('f707 (2) what Jambo found, at a glance', () => {
  test('2a departures and obligations while signing is ahead, after the risks, each opening this panel\'s tab', () => {
    const { ctx, c } = pdStage({ playbook: PB, obligations: OBS });
    assert.deepEqual(J(ctx.pdGlanceRows(c)), [{ k: 'std', n: 2 }, { k: 'oblig', n: 3 }]);
    assert.deepEqual(J(ctx.PD_GLANCE.std), ['pd_gl_std', 'pd_tab_clauses', '', 'doc']);
    assert.deepEqual(J(ctx.PD_GLANCE.oblig), ['pd_gl_obls', 'tab_obligations', '', 'oblig']);
    const html = ctx.pdGlanceHtml(c);
    assert.match(html, /pd_gl_std:2[\s\S]*data-pd-glance-tab="doc">pd_tab_clauses</);
    assert.match(html, /pd_gl_obls:3[\s\S]*data-pd-glance-tab="oblig">tab_obligations</);
    for (const status of ['Signed', 'Declined'])
      assert.deepEqual(J(pdStage({ status, playbook: PB, obligations: OBS }).ctx.pdGlanceRows(pdStage({ status, playbook: PB, obligations: OBS }).c)), [], status + ': no findings rows');
    assert.deepEqual(J(pdStage({ playbook: null, obligations: [] }).ctx.pdGlanceRows(pdStage().c)), [], 'a check not run, no obligations: nothing said');
  });
  test('2b each row names what it counts', () => {
    const { ctx, c } = pdStage({ playbook: PB, obligations: OBS, items: [{ label: 'Other party', open: true }, { label: 'Value', open: true }, { label: 'Who we are', open: false }] });
    assert.equal(ctx.pdGlanceSub(c, { k: 'std' }), 'Liability cap, Governing law');
    assert.equal(ctx.pdGlanceSub(c, { k: 'oblig' }), 'pd_gl_obls_split[2,1]', 'theirs and ours, done ones not counted');
    assert.equal(ctx.pdGlanceSub(c, { k: 'fill' }), 'Other party, Value', 'only the boxes still empty');
    /* round 3 as drawn (18 Oct 2026): "Nobody named to sign for us · Needed before signing" */
    assert.equal(ctx.pdGlanceSub(c, { k: 'sign' }), 'pd_gl_signers_sub');
    const many = pdStage({ items: ['a', 'b', 'c', 'd', 'e'].map(l => ({ label: l, open: true })) });
    assert.equal(many.ctx.pdGlanceSub(many.c, { k: 'fill' }), 'a, b, c …', 'a cap is said, never a silent trim');
  });
  test('2c the brief\'s own first lines, its press opens the brief; none written, none drawn', () => {
    const { ctx, c } = pdStage({ brief: { data: { overview: 'Arctic Cold Chain carries our goods.' } } });
    /* RE-POINTED 20 Oct 2026 (owner: "'the brief' should be a button called Contract Briefing"): the label is the button, the first lines under it */
    assert.match(ctx.pdGlanceBriefHtml(c), /<button[^>]*data-pd-gl-brief[^>]*>pd_gl_brief_btn<\/button><span[^>]*>Arctic Cold Chain carries our goods\.<\/span>/);
    assert.equal(pdStage().ctx.pdGlanceBriefHtml(pdStage().c), '');
    assert.match(PD, /\[data-pd-gl-brief\]'\)\)\{[\s\S]{0,200}openCheckPanel\(getContract\(cc\.id\) \|\| cc, 'brief'\)/);
  });
  test('2d when it was read on arrival, only if the reading read anything', () => {
    const at = new Date().toISOString();
    const { ctx, c } = pdStage({ triage: { at, steps: { risk: { ok: true } } } });
    assert.match(ctx.pdGlanceFootHtml(c), /class="pd-gl-foot">pd_gl_read\[\d{2}:\d{2}\]</);
    assert.equal(pdStage({ triage: { at, steps: { risk: { ok: false } } } }).ctx.pdGlanceFootHtml(pdStage({ triage: { at, steps: { risk: { ok: false } } } }).c), '');
    assert.equal(pdStage().ctx.pdGlanceFootHtml(pdStage().c), '');
  });
  test('2e reading writes nothing', () => {
    const { ctx, c } = pdStage({ playbook: PB, obligations: OBS, brief: { data: { overview: 'x' } } });
    const before = JSON.stringify(c);
    ctx.pdGlanceHtml(c); ctx.pdGlanceRows(c);
    assert.equal(JSON.stringify(c), before);
  });
  test('2f the new words, in both books', () => {
    for (const k of ['pd_gl_std_one', 'pd_gl_std_other', 'pd_gl_obls_one', 'pd_gl_obls_other', 'pd_gl_obls_split', 'pd_gl_brief_btn', 'pd_gl_read'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});

describe('f707 (3) a private stream\'s drop is read at once, as today (the owner kept it)', () => {
  test('3a [control] the drop still asks the reading: contractArrived passes asked for the drop area', () => {
    assert.match(CT, /submitUpload\(\{ drop:true, folder:uploadDropFolder\(h\.folder\), route:uploadRouteDefault\(\), read:true \}\)/);
  });
});
