/* f1049 — ONE DOOR TO START, AND THE COMPANY LOOK (owner's yes to each drawing, 14 Nov 2026: "Build but reserve our paper
   for last"):
     1 the Board: Draft agreement is a green pill the size of its neighbours, and "draft" leads the links above Jambo's box
     2 the New agreement page: From scratch is the third tab, drawn only with the right to write new paper; it shows the
       four starts in the page ("From nothing" first) and a start's Back and Cancel come back to it
     3 the Builder: one whole paper, no Branding bar, Jambo's panel the normal 384
     4 Publish: one clear choice, Use our company look or Design it now; the design step dresses one paper and never writes
       the company look; then Draft a contract from it opens New agreement with the paper chosen
     5 the server: the company look is an admin's; looks by stream; which look wins (paper, stream, company); a contract's
       look follows its stream until it is signed; Use the company look puts a paper back (admin only)
     6 Settings, How our contracts look (the Legora way): the page, its sentence read without AI, its admins-only Save
     7 the send screen, Four steps: 1 To · 2 What goes · 3 What they can do · 4 How it goes, a step opens in place
   At the parent every part fails: none of these names or rules exist there.
   Run: node --test test/f1049-one-door-and-the-company-look.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./helpers');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CSS = read('index.html');
const body = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return src.slice(i, src.indexOf('\n}', i) + 2); };
const EN = require('../js/i18n.js').STRINGS.en, SV = require('../js/i18n.js').STRINGS.sv;

test('f1049 (1) the Board: Draft agreement green and the size of its neighbours; "draft" first above Jambo\'s box', () => {
  const HB = read('js/views/homeboard.js');
  assert.match(body(HB, 'hbDraftBtnHtml'), /class="hb-btn is-sm hb-draft-go"/);
  assert.doesNotMatch(body(HB, 'hbDraftBtnHtml'), /is-primary/, 'not the black button');
  assert.match(CSS, /\.hb-btn\.hb-draft-go\{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;flex:none;background:var\(--st-green-bg\);color:var\(--accent-ink\)/);
  assert.match(read('js/flowmap.js'), /k: 'board'[\s\S]{0,400}d: \['draft', 'ourpaper', 'contracts', 'explorer', 'calendar'\]/);
});

test('f1049 (2) New agreement: From scratch is the third tab, only with the right, its four starts in the page', () => {
  const W = read('js/wizard.js');
  assert.match(body(W, 'naNewPaperOk'), /mayMakeNewPaper\(\)/, 'drawn only for a person with the new-paper grant');
  assert.match(body(W, 'naNewPaperDoorHtml'), /if\(!naNewPaperOk\(\)\) return '';/);
  assert.match(W, /\$\{naNewPaperDoorHtml\(\)\}<\/div>/, 'the third tab beside Our paper and Their paper');
  assert.match(body(W, 'naNewPaperPaneHtml'), /window\.NS_STARTS\.map/, 'the same four starts the new-standard question offers');
  assert.match(body(W, 'naNewPaperGo'), /openNewStandard\(\{ start:k\|\|'scratch', back \}\)/);
  assert.match(body(W, 'naNewPaperGo'), /openNewAgreement\(\{ newPaper:true \}\)/, 'Back comes to this tab');
  assert.match(W, /if\(o&&o\.newPaper\) naNewPaperShow\(root,true\);/);
  const NS = read('js/views/newstandard.js');
  assert.match(NS, /_nsFrom = typeof opts\.back === 'function' \? opts\.back : null;/);
  assert.match(NS, /const nsBack = \(\) => \{[^}]*if \(typeof _nsFrom === 'function'\) return _nsFrom\(\);/);
  assert.equal(EN.ns_scratch, 'From nothing'); assert.equal(EN.na_tab_newpaper, 'From scratch');
  assert.ok(SV.ns_scratch && SV.na_tab_newpaper, 'both books');
});

test('f1049 (3) the Builder: one whole paper, no Branding bar, Jambo the normal width', () => {
  const TB = read('js/views/templatebuilder.js');
  assert.doesNotMatch(TB, /id="tb-branding"/);
  assert.match(TB, /if \(!_tb\.blocks\.length\) html \+= `<p class="tb-empty-line">/);
  assert.match(CSS, /html\.lg-new #tb-page #tb-paper\{aspect-ratio:1 \/ 1\.4142\}/);
  assert.match(CSS, /grid-template-columns:minmax\(0,1fr\) calc\(384px - var\(--page-pad-x\)\)/);
  assert.match(TB, /const TB_SPLIT_KEY = 'hati\.v1\.tbLeftFrac2';/, 'an old wide drag is forgotten once');
});

test('f1049 (4) Publish: one clear choice; the design step dresses one paper; then Draft a contract from it', () => {
  const TB = read('js/views/templatebuilder.js');
  assert.match(body(TB, 'tbPublishGo'), /return tbLookAsk\(\);/);
  const L = body(TB, 'tbLookAsk');
  assert.match(L, /row\('company', i18t\('tb_look_company'\)/); assert.match(L, /row\('design', i18t\('tb_look_design'\)/);
  assert.match(L, /\{ changeNote, design: null \}/, 'the company look: this paper wears no look of its own');
  assert.match(L, /tbPublishedLand\(_tb\.tid, name, r\.versionNumber\)/);
  assert.match(body(TB, 'tbPublishedLand'), /openNewAgreement\(\{ pick: \{ kind: 'lib', id: tid \} \}\)/);
  const DS = read('js/views/designstep.js');
  assert.match(DS, /if \(_ds\.mode !== 'publish'\) await saveOrgBranding\(dsOrgPayload\(\)\);/, 'publishing one paper never writes the company look');
  assert.doesNotMatch(DS, /id="ds-default"/, 'the make-it-the-company-default tick is gone');
  assert.match(DS, /tbPublishedLand\(tid, tname, vn\)/);
});

describe('f1049 (5) the server: the look is an admin\'s, looks by stream, which wins, follows the stream until signed', () => {
  let h, W;
  before(async () => { h = await H.startHati({ HATI_AGENTS_AUTO: 'off' }); W = await H.seedWorkspace(h); });
  after(async () => { if (h) await h.stop(); });

  test('an Editor who moves the look is refused with where to go; an admin saves it, with looks by stream', async () => {
    const r = await W.unrestricted.raw('/api/org/branding', { method: 'PUT', body: { designId: 'modern-minimal' } });
    assert.equal(r.status, 403); assert.match(String((r.json || {}).error || ''), /How our contracts look/);
    const ok = await W.admin.raw('/api/org/branding', { method: 'PUT', body: { designId: 'classic-letterhead', streamLooks: { proc: { designId: 'modern-minimal' } } } });
    assert.equal(ok.status, 200);
    const got = await W.admin.json('/api/org/branding');
    assert.equal(got.branding.designId, 'classic-letterhead');
    assert.deepEqual(got.streamLooks, { proc: { designId: 'modern-minimal', structureId: null, logoPosition: null, accentColor: null } });
    const bad = await W.admin.raw('/api/org/branding', { method: 'PUT', body: { streamLooks: { proc: { designId: 'no-such' } } } });
    assert.equal(bad.status, 400, 'an unknown design is said, never dropped');
  });
});

test('f1049 (5b) which look wins, and a move before signing follows the stream (the server\'s readings)', () => {
  const S = read('server/server.js');
  const look = body(S, 'srvLookOf');
  assert.ok(look.indexOf("lookFrom: 'paper'") < look.indexOf("lookFrom: 'stream'") && look.indexOf("lookFrom: 'stream'") < look.indexOf("lookFrom: 'company'"), 'paper, then stream, then company');
  const f = body(S, 'srvLookFollowStream');
  assert.match(f, /next\.branding\.lookFrom === 'paper' \|\| anySignatureRow\(next\) \|\| next\.execution \|\| next\.status === 'Signed'/, 'a paper\'s own look and anything signed stay put');
  assert.match(f, /if \(!next\.libraryTemplateId\) return null;/, 'the other side\'s paper is never dressed');
  assert.match(S, /if \(prev\) \{ const moved = srvLookFollowStream\(prev, c\); if \(moved\) c\.branding = moved; \}/);
  assert.match(S, /\.\.\.srvLookOf\(branding, tplDesign, folder\) \} : null,/, 'a new contract from a standard takes its look the same way');
  assert.match(S, /app\.put\('\/api\/templates\/:id\/look', auth, admin, passwordCurrent,/, 'Use the company look: admins only');
});

test('f1049 (6) Settings, How our contracts look: its page, a sentence read without AI, admins only', () => {
  const ST = read('js/views/settings.js');
  assert.match(ST, /const ST_PAGES=\['team','sheet','roles','streams','data','panel','look'\];/);
  assert.match(ST, /if\(_stPage==='look'\) return \(typeof window\.clPageHtml==='function'\)\?window\.clPageHtml\(\):'';/);
  assert.match(ST, /\{ key:'company-look', what:/, 'the Editor\'s lost door is a named closure');
  const sb = { window: {}, i18t: k => k };
  const DS = read('js/views/designstep.js');
  assert.match(body(DS, 'clPageHtml'), /clAdmin\(\)/, 'Save only for an admin');
  /* the sentence reader, run */
  const fn = new Function('DS_ACCENTS', 'DOC_DESIGNS', 'DOC_STRUCTURES', 'i18t', body(DS, 'clReadLook').replace('function clReadLook', 'return function') .replace(/^/, `const CL_ACCENTS = DS_ACCENTS.map(([hex, , word]) => [hex, word]); const CL_POS_WORD = { 'top-left': 'l', 'top-center': 'c', 'top-right': 'r', footer: 'f' };\n`));
  const ACC = [['#0f766e', 'Teal', 'teal'], ['#004c78', 'Navy', 'navy'], ['#1e3a8a', 'Royal blue', 'blue'], ['#1f5d3a', 'Forest', 'green'], ['#8e3550', 'Claret', 'claret'], ['#9a4a1f', 'Rust', 'rust'], ['#5b3a6e', 'Aubergine', 'purple'], ['#37474f', 'Slate', 'slate']];
  const read1 = fn(ACC, [{ id: 'formal-legal', name: 'Formal Legal' }, { id: 'modern-minimal', name: 'Modern Minimal' }], [{ id: 'two-column', name: 'Two Columns' }], k => k);
  const r = read1('use our navy and put the logo on the left, formal legal, two columns');
  assert.deepEqual(r.got, { accentColor: '#004c78', logoPosition: 'top-left', designId: 'formal-legal', structureId: 'two-column' });
  assert.deepEqual(read1('make it nicer').said, [], 'nothing read, nothing changed');
  void sb;
});

test('f1049 (7) the send screen, Four steps', () => {
  const C = read('js/core.js');
  assert.match(C, /const SH_STEPS=\[\['to','\.sh-lt-to','sh_st_to'\],\['what','#sh-lt-what-row','sh_st_what'\],\['can','#sh-lt-can-row','sh_st_can'\],\['by','#sh-lt-by-row','sh_st_by'\]\];/);
  assert.match(body(C, 'shareLetterPaint'), /shareStepsArrange\(host\);/);
  assert.match(body(C, 'shareStepsAddNew'), /data-sh-more="\$\{esc\(email\)\}"/, 'a new person is one more ticked person (shareMoreChosen sends them)');
  assert.match(body(C, 'shareStepsDrop'), /_shSetMain\(next\.getAttribute\('data-sh-more-name'\)\|\|'', next\.getAttribute\('data-sh-more'\)\)/, 'taking the main person off promotes the next');
  assert.match(CSS, /#sh-letter\.sh-lt\.is-steps \.sh-st:not\(\.is-open\) > \.sh-lt-v\{display:none\}/, 'a closed step shows only its line');
  assert.equal(EN.sh_st_what, 'What goes'); assert.ok(SV.sh_st_what);
});
