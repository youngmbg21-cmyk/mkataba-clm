'use strict';
/* f1187 — TELL JAMBO THE CHANGE (the owner's pick, 23 Nov 2026: "press on a button, the pop up appears and you tell the pop
   up what you want changed. It then chooses the respective clauses, makes the changes then share with you for your
   approval"; drawn, then "build it").

   (1) THE QUESTION FIRST: a fresh Amend asks in a pop-up (pd2AmAskOpen); "or choose the clauses yourself" is the manual
       way (pdAmendOpen(id, { manual:true })); an amendment already under way opens where it stands.
   (2) JAMBO PROPOSES, A PERSON APPROVES: his changes land WAITING (ok:false, by:'jambo'); Create and the Next wait for
       every change; a clause pressed by hand, or words typed, are the person's own (ok:true).
   (3) WHAT NO CLAUSE COVERS IS SAID, NEVER INVENTED: the reader's tool has notFound, the prompt forbids an invented clause,
       the answer carries it, the page shows it with Write it as a new clause · Leave it out.
   (4) ONE DOOR: Jambo's box beside Amend goes the pop-up's way (pd2AmSay → pd2AmAskRun).
   (5) NO SILENT FAILURE: a refusal, no key or nothing found is said in the pop-up, the words kept.
   (6) THE RECORD SAYS JAMBO DRAFTED IT, from the words asked. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const PD = R('js/paperdesk.js'), FAM = R('js/family.js'), SRV = R('server/server.js');
const fnOf = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name + ' exists');
  let d = 0, j = src.indexOf('{', src.indexOf(')', i)); for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}'){ d--; if (!d) return strip(src.slice(i, k + 1)); } } return strip(src.slice(i)); };

test('f1187 (1) the question first; the manual way kept', () => {
  const open = fnOf(PD, 'pdAmendOpen');
  assert.match(open, /!\(opts && opts\.manual\) && !_pdAm\.items\.length && !_pdAm\.asked && !pdAmendShows\(\)\)\{ pd2AmAskOpen\(/, 'a fresh Amend asks first');
  const ask = fnOf(PD, 'pd2AmAskOpen');
  assert.match(ask, /lgpOpen\(\{/, 'the Legora pop-up');
  assert.match(ask, /data-pd2-amk-manual/, 'or choose the clauses yourself');
  assert.match(ask, /pdAmendOpen\(id, \{ manual: true \}\)/, 'which opens the signed paper');
  assert.match(ask, /pd2AmAskRun\(id, v, true\)/, 'Ask Jambo runs the one reading');
});

test('f1187 (2) Jambo proposes, a person approves', () => {
  assert.match(fnOf(PD, 'pd2AmPutJambo'), /by: 'jambo', ok: false/, 'his changes wait');
  assert.match(fnOf(PD, 'pdAmendReady'), /!_pdAm\.items\.some\(x => !x\.ok\)/, 'Create waits for every change');
  assert.match(fnOf(PD, 'pdAmendAdd'), /\{ ok: true \}/, 'a clause pressed by hand is the person\'s own');
  assert.match(strip(PD), /it\.amended = String\(t\.value \|\| ''\)\.slice\(0, 4000\); it\.ok = true;/, 'words typed are the person\'s own');
  const tabs = fnOf(PD, 'pd2AmxTabsHtml');
  assert.match(tabs, /n && !wait \? ''/, 'the Next to the check waits too');
  const rev = fnOf(PD, 'pd2AmxReviewHtml');
  for (const a of ['data-pd2-amx-ok', 'data-pd2-amx-edit', 'data-pd2-amx-rm', 'data-pd2-amx-undo', 'pd2_amr_why', 'pd2AmxSentenceHtml(it)', 'pd2AmxMarksHtml(it)'])
    assert.ok(rev.includes(a), 'the approval row carries ' + a);
  assert.match(fnOf(PD, 'pd2AmTake'), /_pdAm\.items\.filter\(x => x\.by !== 'jambo'\)/, 'asking again replaces his changes, never the person\'s own');
});

test('f1187 (3) what no clause covers is said, never invented', () => {
  const route = SRV.slice(SRV.indexOf("app.post('/api/ai/amend'"), SRV.indexOf("app.post('/api/ai/amend'") + 9000);
  assert.match(route, /notFound: \{ type: 'array'/, 'the tool has notFound');
  assert.match(route, /never into an invented clause/, 'the prompt forbids an invented clause');
  assert.match(route, /notFound: \(Array\.isArray\(inp\.notFound\)/, 'the answer carries it');
  const rev = fnOf(PD, 'pd2AmxReviewHtml');
  assert.match(rev, /data-pd2-amk-write/, 'Write it as a new clause');
  assert.match(rev, /data-pd2-amk-leave/, 'Leave it out');
  assert.match(fnOf(PD, 'pd2AmWriteNew'), /x\.op === 'insert'/, 'a new clause only on that press, waiting like the rest');
});

test('f1187 (4) one door: Jambo\'s box goes the pop-up\'s way', () => {
  assert.match(fnOf(PD, 'pd2AmSay'), /pd2AmAskRun\(String\(c\.id\), String\(text\)\.trim\(\), false\); return;/);
});

test('f1187 (5) no silent failure', () => {
  const run = fnOf(PD, 'pd2AmAskRun');
  assert.match(run, /if \(err\)\{ pd2AmAskOpen\(id, text, err\); return; \}/, 'said in the pop-up, the words kept');
  assert.match(run, /if \(seq !== _pdAm\.seq\) return;/, 'Stop, or a later question, drops a late answer');
  assert.match(fnOf(PD, 'pd2AmBusyOpen'), /busyHtml/, 'something moves while he reads');
  assert.match(fnOf(PD, 'pd2AmBusyOpen'), /pd2-amk-bar/, 'a moving bar, as drawn');
  /* what he found is shown from his answer, never faked while he reads; then one button */
  assert.match(run, /pd2AmFoundOpen\(id, text,/);
  const found = fnOf(PD, 'pd2AmFoundOpen');
  assert.match(found, /_pdAm\.items\.filter\(x => x\.by === 'jambo'\)/);
  assert.match(found, /_pdAm\.missing\.map/);
  assert.match(found, /data-pd2-amk-see/);
});

test('f1187 (6) the record says Jambo drafted it', () => {
  assert.match(fnOf(PD, 'pdAmendCreate'), /byCopilot: !!_pdAm\.asked && _pdAm\.items\.some\(x => x\.by === 'jambo'\), asked: _pdAm\.asked/);
  assert.match(FAM, /drafted by Jambo from: “\$\{String\(opts\.asked\|\|opts\.note\|\|''\)/);
});

test('f1187 (7) the check step: the amendment or the agreement as amended, Before you create, what happens next', () => {
  const chk = fnOf(PD, 'pd2AmxCheckHtml');
  assert.match(chk, /data-pd2-amx-view="today"/);
  assert.match(chk, /pd2AmxTodayHtml\(c\)/);
  assert.match(chk, /pd2_amc_before/);
  assert.match(chk, /pd2-amc-tl/);
  assert.doesNotMatch(chk, /fmtMoney/, 'no money in the check');
  assert.match(chk, /id="pd2-amc-left"/, 'the paper scrolls in its own box, the check list and what happens next stay in view');
});

test('f1187 (8) the chips come from this paper: only where their clause is, its §, its own words', () => {
  const pd = R('js/paperdesk.js');
  const head = pd.slice(pd.indexOf('const PD2_AMK_HEAD ='), pd.indexOf('};', pd.indexOf('const PD2_AMK_HEAD =')) + 2);
  const pay = pd.slice(pd.indexOf('const PD2_AMK_PAY_RE ='), pd.indexOf(';\n', pd.indexOf('const PD2_AMK_PAY_RE =')) + 1);
  const T = (k, v) => k + (v ? ' ' + JSON.stringify(v) : '');
  const make = (cls, money) => new Function('_pdT', 'amendParentClauses', 'isMonetary', `${head}\n${pay}\n${fnOf(pd, 'pd2AmkChipsOf')}\nreturn pd2AmkChipsOf;`)(T, () => cls, () => money);
  const supply = [
    { num: '2', title: 'Price & Contract Value', text: 'The estimated annual contract value is KES 85,000,000, based on pricing. Invoices fall due within 30 days of receipt.' },
    { num: '4', title: 'Term and Renewal', text: 'The term is three (3) years from the effective date.' },
    { num: '5', title: 'Termination', text: 'Either party may terminate on ninety (90) days notice.' },
    { num: '10', title: 'Notices', text: 'Notices go to the addresses above.' }];
  const got = make(supply, true)({});
  assert.deepEqual(got.map(x => x.k), ['term', 'price', 'pay', 'notice', 'add']);
  assert.equal(got[0].at, '§ 4', 'the term chip names its clause, never Termination');
  assert.match(got[0].say, /three \(3\) years/, 'the sentence starts from the paper\'s own words');
  assert.match(got[1].say, /KES 85,000,000/);
  assert.match(got[2].say, /30 days/);
  /* an NDA: no money, no payment days, no notices clause, no term heading → only Add a clause */
  const nda = make([{ num: '1', title: 'Confidential Information', text: 'Each party keeps the other\'s information secret.' }], false)({});
  assert.deepEqual(nda.map(x => x.k), ['add'], 'a chip never shows where its clause is not');
  assert.match(fnOf(pd, 'pd2AmAskOpen'), /pd2AmkChipsOf\(c\)/, 'the pop-up draws them');
});
