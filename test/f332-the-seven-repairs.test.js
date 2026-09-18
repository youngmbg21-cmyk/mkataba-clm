/* ============================================================
   f332 — THE SEVEN REPAIRS
   ============================================================
   Young, 18 Sep 2026: *"In an overnight run, implement ideas 4 through 9 and
   the 7 repairs."*  The seven are the repair list in "HaTi, today and next" —
   defects rather than missing capabilities, three of which lose somebody's
   work.  This file holds the claims for the seven; the six upgrades are in
   f333 beside it.

   Every claim below is red at the parent except those named as controls.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* ------------------------------------------------------------------
   R1 — A RE-RUN DOES NOT THROW AWAY WHAT SOMEBODY DECIDED
   ------------------------------------------------------------------ */
describe('f332 (1) the standards check keeps accepted departures', () => {
  const PB = read('js/playbook.js');

  test('1a pbCarryDecisions exists and is published', () => {
    assert.match(PB, /function pbCarryDecisions\(prev, next\)/,
      'the carry is one named reading in js/playbook.js');
    assert.match(PB, /Object\.assign\(window,\{[^\n]*pbCarryDecisions/,
      'and it is published, or every caller reading it takes a silent fallback');
  });

  test('1b it is asked inside runPlaybookReview, so all eight callers inherit it', () => {
    const fn = PB.slice(PB.indexOf('async function runPlaybookReview'));
    const body = fn.slice(0, fn.indexOf('\nfunction deviationSummary'));
    assert.match(body, /pbCarryDecisions\(c && c\.playbook, r\)/,
      'the carry belongs in the funnel that BUILDS a review, not at each of its callers');
    /* the review has more than one caller, which is why it may not live at one */
    const callers = (read('js/views/contract.js') + read('js/views/negotiation.js') +
      read('js/triage.js') + read('js/views/clauseeditor.js')).match(/runPlaybookReview\(/g) || [];
    assert.ok(callers.length >= 5, 'runPlaybookReview has many callers: ' + callers.length);
  });

  const W = () => buildWorld({ standards: true }).win;

  test('1c an acceptance carries onto a departure that is still open', () => {
    const w = W();
    const prev = { verdicts: [{ category:'Payment terms', status:'deviation', quote:'within 60 days',
      accepted:{ by:'Amina', byId:'3', role:'admin', at:'2026-09-01T10:00:00Z', why:'agreed with finance', quote:'within 60 days' } }] };
    const next = { verdicts: [{ category:'Payment terms', status:'deviation', quote:'within 60 days' }] };
    const out = w.pbCarryDecisions(prev, next);
    assert.equal(out.verdicts[0].accepted.why, 'agreed with finance');
    assert.equal(out.verdicts[0].accepted.by, 'Amina');
    assert.ok(!out.verdicts[0].accepted.staleQuote, 'same wording, so it is not asked again');
  });

  test('1d the escalation is carried too — it is the other half of the decision', () => {
    const w = W();
    const prev = { verdicts: [{ category:'Liability cap', status:'missing',
      escalation:{ to:{ id:'7', name:'Wanjiru' }, at:'2026-09-02T09:00:00Z' } }] };
    const next = { verdicts: [{ category:'Liability cap', status:'missing' }] };
    const out = w.pbCarryDecisions(prev, next);
    assert.equal(out.verdicts[0].escalation.to.name, 'Wanjiru');
  });

  test('1e two verdicts of one category are paired IN ORDER, never both from the first', () => {
    const w = W();
    /* the supply playbook really does carry "Liability cap" as a position AND
       as a range, so a map keyed on the category alone is wrong */
    const prev = { verdicts: [
      { category:'Liability cap', status:'missing', accepted:{ at:'x', why:'first', quote:'' } },
      { category:'Liability cap', status:'deviation', accepted:{ at:'x', why:'second', quote:'' } } ] };
    const next = { verdicts: [
      { category:'Liability cap', status:'missing' },
      { category:'Liability cap', status:'deviation' } ] };
    const out = w.pbCarryDecisions(prev, next);
    assert.equal(out.verdicts[0].accepted.why, 'first');
    assert.equal(out.verdicts[1].accepted.why, 'second');
  });

  test('1f nothing is carried onto a verdict that is now aligned', () => {
    const w = W();
    const prev = { verdicts: [{ category:'Payment terms', status:'deviation',
      accepted:{ at:'x', why:'we let it go', quote:'within 60 days' } }] };
    const next = { verdicts: [{ category:'Payment terms', status:'aligned', quote:'within 30 days' }] };
    const out = w.pbCarryDecisions(prev, next);
    assert.equal(out.verdicts[0].accepted, undefined,
      'the departure was fixed — there is nothing left to have accepted');
  });

  test('1g wording that moved under the acceptance keeps the stamp and marks it', () => {
    const w = W();
    const prev = { verdicts: [{ category:'Payment terms', status:'deviation', quote:'within 60 days',
      accepted:{ by:'Amina', at:'x', why:'agreed with finance', quote:'within 60 days' } }] };
    const next = { verdicts: [{ category:'Payment terms', status:'deviation', quote:'within 75 days of receipt' }] };
    const out = w.pbCarryDecisions(prev, next);
    assert.equal(out.verdicts[0].accepted.why, 'agreed with finance', 'the reason is a record and is kept');
    assert.equal(out.verdicts[0].accepted.staleQuote, true, 'and it is asked again');
  });

  test('1h an acceptance with no quote on it is carried as it stands', () => {
    const w = W();
    /* one made before this was written: an absence is not a claim */
    const prev = { verdicts: [{ category:'Payment terms', status:'deviation', quote:'within 60 days',
      accepted:{ at:'x', why:'older record' } }] };
    const next = { verdicts: [{ category:'Payment terms', status:'deviation', quote:'within 75 days' }] };
    const out = w.pbCarryDecisions(prev, next);
    assert.equal(out.verdicts[0].accepted.why, 'older record');
    assert.ok(!out.verdicts[0].accepted.staleQuote);
  });

  test('1i the acceptance records the wording it answered', () => {
    const CT = read('js/views/contract.js');
    const fn = CT.slice(CT.indexOf('async function signCheckAccept'));
    const body = fn.slice(0, fn.indexOf('\nasync function', 10));
    assert.match(body, /quote:String\(v\.quote\|\|''\)/,
      'without it a later re-run cannot tell a reworded departure from the same one');
  });

  test('1j a stale acceptance does not settle the row, and says why', () => {
    const SC = read('js/signcheck.js');
    assert.match(SC, /function signCheckAcceptStale\(v\)/);
    assert.match(SC, /signCheckAcceptStale,/, 'published');
    assert.match(SC, /settled: !!f\.accepted && properly && !stale/,
      'settled asks BOTH questions — who accepted it, and whether the paper has moved since');
    assert.match(SC, /staleAccept: !!f\.accepted && properly && stale/);
    assert.match(read('js/views/contract.js'), /r\.staleAccept.*sc_stale_accept/s,
      'and the row prints it rather than going quiet');
  });

  test('1k the sentence is in both books', () => {
    const I = read('js/i18n.js');
    assert.equal((I.match(/\n\s+sc_stale_accept:/g) || []).length, 2,
      'a key in one book leaves a screen half-English');
  });
});

/* ------------------------------------------------------------------
   R2 / R3 / R4 — THE THREE IN THE TEMPLATE BUILDER
   ------------------------------------------------------------------ */
describe('f332 (2) Apply answers the whole section', () => {
  const TB = read('js/views/templatebuilder.js');

  test('2a the remover exists, is published, and Apply calls it', () => {
    assert.match(TB, /function tbDropExtraBody\(sec, keep\)/);
    assert.match(TB, /tbSectionText, tbDropExtraBody,/, 'published');
    const fn = TB.slice(TB.indexOf('async function tbAccept'));
    const body = fn.slice(0, fn.indexOf('\n}\n'));
    assert.match(body, /_tb\.blocks\[bi\]\.content = a\.text;\s*\n\s*tbDropExtraBody\(sec, bi\);/,
      'the accepted text replaces the section, so the blocks it replaced go');
  });

  test('2b the model really is shown every block, which is why one was not enough', () => {
    assert.match(TB, /const tbSectionText = \(sec, blocks\) =>[\s\S]{0,200}sec\.body\.map/,
      'tbSectionText joins EVERY body block — Apply answered all of them and wrote one');
  });

  test('2c it removes highest index first', () => {
    const fn = TB.slice(TB.indexOf('function tbDropExtraBody'));
    const body = fn.slice(0, fn.indexOf('\n}\n'));
    assert.match(body, /sort\(\(a, b\) => b - a\)/,
      'lowest first would move every index still to come');
    assert.ok(!/\.push\(/.test(body), 'removal only — tbAddBlock is the one push into _tb.blocks');
  });

  test('2d the three writers of block content are still three', () => {
    const writes = TB.match(/_tb\.blocks\[[a-z]+\]\.content = [^;]+;/g) || [];
    assert.equal(writes.length, 3, 'Apply, a kept blank, and typing');
  });
});

describe('f332 (3) the number the document will print', () => {
  const { templateFormDocHtml, tplFormHeadingNumbered } = require('../js/templateform.js');

  test('3a the first heading is the title and carries no number', () => {
    const html = templateFormDocHtml({ fields: [], values: {}, blocks: [
      { orderIndex:0, blockType:'heading', content:'Supply Agreement' },
      { orderIndex:1, blockType:'heading', content:'Definitions' },
      { orderIndex:2, blockType:'heading', content:'Payment' } ] });
    assert.match(html, /<h1>Supply Agreement<\/h1>/);
    assert.match(html, /<h2>1\. Definitions<\/h2>/, 'the clauses number from 1, not from 2');
    assert.match(html, /<h2>2\. Payment<\/h2>/);
  });

  test('3b a heading carrying its own number keeps it — the punctuation is a quotation', () => {
    const html = templateFormDocHtml({ fields: [], values: {}, blocks: [
      { orderIndex:0, blockType:'heading', content:'Supply Agreement' },
      { orderIndex:1, blockType:'heading', content:'ARTICLE 2 — SCOPE' } ] });
    assert.match(html, /<h2>ARTICLE 2 — SCOPE<\/h2>/);
    assert.ok(!/1\. ARTICLE/.test(html));
  });

  test('3c a leading year is a title, not a number', () => {
    assert.equal(tplFormHeadingNumbered('2019 Data Protection Act'), false);
    assert.equal(tplFormHeadingNumbered('Payment terms'), false);
    for (const h of ['1. Definitions', '1.1 Scope', '(3) Term', 'ARTICLE 4 TERM', 'Schedule 2'])
      assert.equal(tplFormHeadingNumbered(h), true, h);
  });

  test('3d it is one reading, shared with the server and asked by the builder', () => {
    const TF = read('js/templateform.js');
    assert.match(TF, /module\.exports = \{[^}]*tplFormHeadingNumbered/s, 'the server requires this file');
    assert.match(TF, /Object\.assign\(window, \{[^}]*tplFormHeadingNumbered/s);
    const TB = read('js/views/templatebuilder.js');
    assert.match(TB, /typeof tplFormHeadingNumbered === 'function'\) && tplFormHeadingNumbered\(b\.content\)/,
      'the builder asks the renderer rather than keeping a second rule');
    assert.match(TB, /const clauseNo = \(n === 1 \|\| own\) \? '' : String\(n - 1\) \+ '\.'/,
      'and it draws the number the document will print, not the position in the list');
  });
});

describe('f332 (4) the blanks call is counted and its failures are spoken', () => {
  const TB = read('js/views/templatebuilder.js');
  const body = () => { const i = TB.indexOf('async function tbBlanksRun');
    return TB.slice(i, TB.indexOf('\nfunction tbKeepBlank')); };

  test('4a it counts itself like the other two metered calls', () => {
    assert.match(body(), /_tb\.reads\+\+/, 'it is metered on the server, so it belongs in "read N"');
    assert.equal((TB.match(/_tb\.reads\+\+/g) || []).length, 3, 'outline, propose, blanks');
  });

  test('4b a refusal is said on the section, through the one sentence builder', () => {
    assert.match(body(), /catch \(e\) \{[\s\S]{0,600}tbSay\(e\)/,
      'no key, the daily ceiling and a provider refusal each have their own sentence');
    assert.ok(!/catch \(_\) \{ \/\* a blank nobody proposed/.test(TB),
      'the swallow is gone');
  });

  test('4c an empty answer is still silent — that is the ordinary case', () => {
    assert.match(body(), /if \(rows\.length\)/,
      'no rows simply adds nothing; only the call not coming back is reported');
  });
});

/* ------------------------------------------------------------------
   R5 / R6 / R7 — THE THREE ABOUT A RECORD
   ------------------------------------------------------------------ */
describe('f332 (5) a contract can be renamed', () => {
  const CT = read('js/views/contract.js');

  test('5a the name is a row on the record, and the resting grid prints it', () => {
    assert.match(CT, /\['name', ktRowHtml\('name', i18t\('ov_f_name'\)/,
      'one builder, so the grid and the editable row cannot disagree');
    assert.match(CT, /\['name', i18t\('ov_f_name'\), R\.name\]/);
    assert.match(CT, /only:\['name','party','counterparty'/, 'first on the record');
    assert.match(CT, /new Set\(\['name','party','counterparty'/,
      'and the grid gives the field up where the editable row is drawn, so it is not printed twice');
  });

  test('5b it writes on blur, not on every keystroke, and writes one audit line', () => {
    assert.match(CT, /\|\|key==='name'\)\?'change':'input'/,
      'a rename is an act — one audit line, not one per letter');
    assert.match(CT, /logAudit\(c,'Record',`Renamed from "\$\{was\}" to "\$\{now\}"`\)/);
  });

  test('5c an empty box never clears the name', () => {
    assert.match(CT, /else if\(!now\) inp\.value=was;/,
      'a nameless contract is unfindable in every list that draws it');
  });

  test('5d and the server still freezes it once executed', () => {
    assert.match(read('server/server.js'), /'status', 'name', 'party', 'expiry', 'metadata',/,
      'name is on EXECUTED_IMMUTABLE — this opens a door, it does not move a wall');
  });

  test('5e the label is in both books', () => {
    const I = read('js/i18n.js');
    assert.equal((I.match(/\n\s+ov_f_name:/g) || []).length, 2);
  });
});

describe('f332 (6) which side of the money we are on is asked at creation', () => {
  test('6a both creation lists ask it, and map it to the field paySide reads', () => {
    for (const f of ['js/templates.js', 'js/templatefields.js']) {
      const src = read(f);
      assert.match(src, /key:'side'[\s\S]{0,200}type:'select'[\s\S]{0,60}maps:'category'/, f);
      assert.match(src, /v:'customer'[\s\S]{0,120}v:'supplier'/, f + ' offers both sides');
    }
    assert.match(read('js/payterms.js'), /paySide = c => PAY_SIDES\[\(c && c\.metadata && c\.metadata\.category\)/,
      'the same field the upload path fills — one reading, not two');
  });

  test('6b "neither" writes nothing at all', () => {
    assert.match(read('js/templatefields.js'), /v:'', l:i18t\('tf_side_none'\)/);
    assert.match(read('js/templatefields.js'), /if\(v==='' \|\| v==null\) continue;/,
      'applyTemplateValues skips an empty answer, so no category is claimed');
  });

  test('6c an option may carry its own words, through one reading', () => {
    const TF = read('js/templatefields.js');
    assert.match(TF, /const fieldOpt = o =>/);
    assert.match(TF, /Object\.assign\(window,\{[^\n]*fieldOpt/, 'published');
    assert.match(TF, /\(f\.opts\|\|\[\]\)\.map\(fieldOpt\)/, 'the coercer asks it');
    assert.match(TF, /f\.type==='select'\) return `<label/, 'the essentials form draws a select at all');
    assert.match(read('js/wizard.js'), /fieldOpt\(o\)/, 'and so does the wizard, through the same reading');
  });

  test('6d the labels are in both books', () => {
    const I = read('js/i18n.js');
    for (const k of ['tf_our_side', 'tf_side_none', 'tf_side_customer', 'tf_side_supplier'])
      assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k);
  });
});

describe('f332 (7) re-filing can be delegated, and is off by default', () => {
  const SRV = read('server/server.js');

  test('7a the grant is a column, an admin-only field, and one server reading', () => {
    assert.match(SRV, /addColumnIfMissing\('users', 're_file', 'INTEGER NOT NULL DEFAULT 0'\)/,
      'DEFAULT 0 — the deploy changes nothing for anyone');
    assert.match(SRV, /'twoStep', 'newPaper', 'reFile'\]/, 'stripped from a colleague\'s copy');
    assert.match(SRV, /const mayReFileRow = u => !!u && \(u\.role === 'admin' \|\| Number\(u\.re_file \|\| 0\) !== 0\)/);
  });

  test('7b the server is still the wall, and it asks the grant', () => {
    assert.match(SRV, /if \(prev && !mayReFileRow\(req\.user\)\s*\n\s*&& String\(prev\.folder/,
      'asked as a difference, exactly as before');
  });

  test('7c it is an admin\'s to give, never self-service, and refused on the two roles that answer for themselves', () => {
    const i = SRV.indexOf('if (b.reFile !== undefined)');
    assert.ok(i > 0);
    const body = SRV.slice(i, i + 700);
    assert.match(body, /role === 'admin' && !b\.reFile/, 'an admin may always re-file');
    assert.match(body, /role === 'viewer' && b\.reFile/, 'a viewer may not edit at all');
    assert.match(SRV, /UPDATE users SET re_file=\?/);
  });

  test('7d the browser has ONE reading and every door asks it', () => {
    assert.match(read('js/core.js'), /const mayReFile = \(u\) =>[\s\S]{0,200}p\.role==='admin' \|\| p\.reFile===true/);
    assert.match(read('js/core.js'), /mayMakeNewPaper,mayReFile,/, 'published');
    const CT = read('js/views/contract.js');
    assert.equal((CT.match(/mayReFile\(\)/g) || []).length, 2, 'the stream row and the Overview\'s act');
  });

  test('7e the person drawer carries the row, beside the other grant', () => {
    const ST = read('js/views/settings.js');
    assert.match(ST, /id="tm-refile"/);
    assert.match(ST, /const stReFileOn=u=>/);
    assert.match(ST, /if\(reFileChanged\) patch\.reFile=reFileTo;/);
    assert.match(ST, /if\(patch\.reFile!==undefined\) body\.reFile=patch\.reFile;/);
  });

  test('7f the sentences are in both books', () => {
    const I = read('js/i18n.js');
    for (const k of ['st_refile_admin', 'st_refile_on', 'st_refile_off', 'st_refile_note'])
      assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k);
  });
});
