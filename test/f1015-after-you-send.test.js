'use strict';
/* f1015 — AFTER YOU SEND (owner, 12 Nov 2026: picked "Legora and said once" over the drawing "After you send").
   PART 1, WAITING ON THEM (The Legora Way): once the move is theirs, the Dossier's card says who it waits on, when it
   went and whether they opened it, Remind as a green link through the ONE send-again door (shareSendAgainRun, which
   the Shares section's "Send it again" runs too), and under "Meanwhile, yours" an approval I may give with the
   black button.
   PART 2, OUR PAPER GOES OUT CLEAN THE FIRST TIME (Said Once; the owner's rules: our paper never seen by them goes
   clean; their paper and anything already sent always tracked): negoFoldOwnFirstSend folds our pending fixes into
   the baseline on the first send of OUR paper, keeps them in c.negotiation.folded (never sent, in the chain), says
   so in the history; it refuses wherever any doubt stands. The Send screen says it once ("· clean copy" and one
   line), and its "Goes" row says the same.
   (1) the waiting card's reading and door; (2) the fold's refusals; (3) the fold's acts; (4) the chain keeps the
   folded; (5) both send paths fold, the Send screen re-fingerprints and saves before the link; (6) the copy that
   travels carries no `folded` (the allow-list); (7) the words in both books; (8) the map and the Handbook. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const fnOf = (src, name) => { const m = stripCom(src).match(new RegExp('(?:async )?function ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}')); assert.ok(m, name + ' is defined'); return m[0]; };
const PD = read('js/paperdesk.js'), NG = read('js/negotiation.js'), CORE = read('js/core.js'), I = read('js/i18n.js');

test('f1015 (1) the waiting card: whose move, when, opened, Remind through the one door, my approval', () => {
  const of = fnOf(PD, 'pd2WaitOf');
  assert.match(of, /negWhoseMove\(c\)/, 'whose move is the Negotiations page\'s own reading');
  assert.match(of, /counterpartySeenState\(c, cachedShares\(c\)\)/, 'when it went and whether they opened it: the share records');
  assert.match(of, /approvalDecidableNow\(c\)/, 'an approval only where it is mine to give');
  assert.match(of, /pd2RoadWarm\(c\)/, 'the sent links are read (again after a send)');
  const h = fnOf(PD, 'pd2WaitCardHtml');
  assert.match(h, /data-pd2-wt-remind/); assert.match(h, /data-pd2-wt-approve/);
  assert.equal((h.match(/ui-btn-primary/g) || []).length, 1, 'one black button, and only on my own job');
  assert.match(stripCom(PD), /const WT = pd2WaitOf\(c, D\);\s*if \(WT\) return pd2WaitCardHtml\(c, D, WT\);/, 'the card asks after the road');
  assert.match(stripCom(PD), /\[data-pd2-wt-remind\][\s\S]{0,200}shareSendAgainRun\(/, 'Remind is the one send-again door');
  assert.match(stripCom(CORE), /getElementById\('seen-resend'\)\?\.addEventListener\('click',e=>shareSendAgainRun\(c, e\.currentTarget/, '"Send it again" runs the same door');
  assert.match(fnOf(CORE, 'shareSendAgainRun'), /reshareToLastRecipient\(c\)/);
});

test('f1015 (2) the fold refuses wherever any doubt stands', () => {
  const f = fnOf(NG, 'negoFoldOwnFirstSend');
  assert.match(f, /if \(c\.upload \|\| c\.source === 'upload'\) return 0;/, 'their paper: never');
  assert.match(f, /if \(c\.status !== 'Draft'\) return 0;/, 'anything but a Draft: never (the record\'s own word for never sent)');
  assert.match(fnOf(NG, 'negoFoldWouldTake'), /if \(c\.status !== 'Draft'\) return 0;/, 'the Send screen\'s reading the same');
  assert.match(f, /if \(negoWordingFrozen\(c\)\) return 0;/, 'a frozen record: never');
  assert.match(f, /n\.turnAt \|\| \(n\.rounds && n\.rounds\.length\) \|\| \(Number\(n\.round\) \|\| 1\) > 1\) return 0;/, 'anything handed over or closed: never');
  assert.match(f, /!window\.sharesKnown\(c\)\) return 0;/, 'links not yet read: never');
  assert.match(f, /window\.cachedShares\(c\) : \[\]\)\.length\) return 0;/, 'any link on record: never');
  assert.match(f, /x\.authorSide !== 'owner' \|\| x\.status !== 'pending' \|\| x\.withdrawn \|\| x\.review\)\) return 0;/, 'only our own pending fixes, none under review');
  assert.match(f, /if \(held\.length\) return 0;/, 'nothing held back');
});

test('f1015 (3) the fold moves the baseline through the one builder and commit, and says so', () => {
  const f = fnOf(NG, 'negoFoldOwnFirstSend');
  assert.match(f, /const body = negoBuildBody\(c, x => ids\.has\(x\.id\)\);/);
  assert.match(f, /n\.baselineBody = body;[\s\S]*negoCommitBody\(c, body\);[\s\S]*c\.changes = \[\];/);
  assert.match(f, /n\.folded = \(Array\.isArray\(n\.folded\) \? n\.folded : \[\]\)\.concat\(/, 'kept, never dropped');
  assert.match(f, /logAudit\(c, 'Edited',[\s\S]*Clean copy for the first send/, 'the history says what was folded');
  assert.match(fnOf(NG, 'negoFoldWouldTake'), /return held\.length \? 0 : list\.length;/, 'the Send screen\'s reading refuses alike');
});

test('f1015 (4) the chain keeps what was folded', () => {
  assert.match(fnOf(NG, 'negoIssuances'), /for \(const d of \(c\.negotiation\.folded \|\| \[\]\)\) out\.push\(\{ \.\.\.d, revision: true \}\);/);
});

test('f1015 (5) both send paths fold; the Send screen takes the fingerprint again and saves before the link', () => {
  const C = stripCom(CORE);
  assert.match(C, /let docHash=await sha256\(canonicalDoc\(c\)\);/);
  assert.match(C, /negoFoldOwnFirstSend\(c\)\)\{\s*const pc=payloadObj\.purposeChosen;\s*docHash=await sha256\(canonicalDoc\(c\)\);\s*payloadObj=buildSharePayload\(c, docHash, null, \{ purpose:payloadObj\.purpose \}\);[\s\S]{0,120}persist\(c\); try\{ await flushSaves\(\); \}/);
  assert.match(C, /if\(typeof negoFoldOwnFirstSend==='function' && negoFoldOwnFirstSend\(c\)\) persist\(c\);\s*try\{ await flushSaves\(\); \}catch\(_\)\{\}\s*const docHash=await sha256\(canonicalDoc\(c\)\);/, 'the signing route\'s links too');
});

test('f1015 (6) the copy that travels carries no folded fixes', () => {
  const m = stripCom(CORE).match(/negotiation: c\.negotiation \? \{ round:c\.negotiation\.round\|\|1,[\s\S]*?\} : undefined/);
  assert.ok(m, 'the negotiation allow-list is found');
  assert.doesNotMatch(m[0], /folded/);
});

test('f1015 (7) the words in both books, and the Send screen says it once', () => {
  ['pd2_wt_at', 'pd2_wt_head', 'pd2_wt_sent_markup', 'pd2_wt_sent_sign', 'pd2_wt_opened', 'pd2_wt_unopened', 'pd2_wt_remind', 'pd2_wt_yours', 'pd2_wt_approval',
    'sh_nl_clean_face', 'sh_nl_clean_say_one', 'sh_nl_clean_say_other', 'sh_goes_clean'].forEach(k =>
    assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k + ' in English and Swedish'));
  assert.match(fnOf(CORE, 'shareNlLinesPaint'), /negoFoldWouldTake\(c\)[\s\S]*sh_nl_clean_face[\s\S]*sh_nl_clean_say/);
  assert.match(stripCom(CORE), /negoFoldWouldTake\(c\)\) items\.push\(i18t\('sh_goes_clean'\)\);/);
});

test('f1015 (8) the flow map and the Handbook name both', () => {
  assert.match(read('js/flowmap.js'), /our paper goes out clean the first time/);
  const H = read('js/handbook.js');
  assert.match(H, /goes as a clean copy/); assert.match(H, /\{ui:pd2_wt_at\}/);
});
