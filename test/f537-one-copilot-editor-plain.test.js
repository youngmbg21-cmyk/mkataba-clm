/* f537 — ONE COPILOT EDITOR FOR REDLINES AND RISKS (Young, 6 Oct 2026: the
   Copilot editor job order, built on "Go with your recommendations")
   ============================================================================
     (1) B1 PLAIN WORDS OVER THE WORDING — a reply with Copilot's working notes
         and two drafts ("Wait, I should reconsider… Let me refine:") gives the
         LAST draft and never the notes; Copilot is asked for "whyChange" and
         "whatItDoes"; a reply whose explanation is notes shows one fixed
         sentence; both doors draw the two labelled parts;
     (2) B2 ONE SHORT TITLE — riskTitleOf: a scan rule's fixed title in both
         books (every rule that needs wording has one), Copilot's title cut at
         six words, an older brief named "Topic · problem" from its topic; the
         brief is asked for "Topic · problem"; the stored title is not changed;
     (3) B3 THE DROPDOWN — it takes the disclaimer's place; clauses grouped
         Their asks · Our asks · Settled, risks worst first; HaTi's own list
         draws groups, dots and state words only when asked (data-sm-groups);
         "✦ Copilot · check before sending" under Copilot's answers only;
     (4) B4 THE SELECTED CARD IS GONE — a tag inside the ask box;
     (5) B5/B6 THE RISK DOOR — a heading with no box, Why it matters, no step
         count; the card in the Redlines column wears the short title.
   Browser: one-copilot-editor-plain-verify. Run: node --test test/f537-one-copilot-editor-plain.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CE = read('js/views/clauseeditor.js'), RK = read('js/risks.js'), CORE = read('js/core.js'), SRV = read('server/server.js'), I18N = read('js/i18n.js');
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}\n', i) + 2); };
function stage(files){
  const store = {};
  const el = () => ({ addEventListener(){}, querySelectorAll(){ return []; }, querySelector(){ return null; }, innerHTML: '', value: '', style: {}, textContent: '',
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, appendChild(){}, setAttribute(){}, focus(){} });
  const sb = { console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error, isNaN, parseInt, parseFloat, setTimeout, Promise,
    document: { getElementById: () => el(), querySelector: () => null, querySelectorAll: () => [], addEventListener(){}, createElement: () => el(), head: el(), body: el() },
    state: { contracts: [], view: '' }, icon: () => '', esc: s => String(s), toast(){}, getContract(){ return null; }, currentUser(){ return { name: 'You' }; },
    API_MODE(){ return false; }, innerWidth: 1400, addEventListener(){}, lsGet: k => (k in store ? store[k] : null), lsSet: (k, v) => { store[k] = v; }, getOrg: () => null, persist(){} };
  sb.window = sb; vm.createContext(sb);
  for (const f of files) vm.runInContext(read(f), sb, { filename: f });
  return sb;
}
const NOTES = 'Now I have the context. The contract is a Software as a Service Agreement. However, I notice the user said "The drafter has now asked".\n\n'
  + 'Let me draft a response that limits the audit.\n{"advice":"Let me draft","whyChange":"x","whatItDoes":"y","proposedText":"First draft wording."}\n\n'
  + 'Wait, I should reconsider. Let me refine:\n'
  + '{"advice":"Worth proposing.","whyChange":"As written, Maersk can audit each scope every year, and you pay for any audit that finds a 5% overcharge.",'
  + '"whatItDoes":"One audit a year in total, 30 days\' notice, and you pay only reasonable, direct audit costs.","proposedText":"The Customer may audit the Supplier once in each contract year on thirty (30) days\' written notice."}';

describe('f537 (1) B1 plain words over the wording', () => {
  test('a reply with working notes and two drafts gives the LAST draft and its two plain parts, never the notes', async () => {
    const ai = stage(['js/i18n.js', 'js/jurisdiction.js', 'js/ai.js']);
    ai.window.copilotAsk = async () => NOTES;
    const r = await ai.copilotPropose({ ask: 'Rewrite.', passage: 'The Customer may audit the Supplier.' });
    assert.match(r.proposedText, /once in each contract year/);
    assert.ok(r.explain, 'the two parts came back');
    assert.match(r.explain.why, /^As written, Maersk can audit/);
    assert.match(r.explain.does, /^One audit a year in total/);
    assert.ok(!/Now I have|Let me|Wait/.test(JSON.stringify(r)), 'no working notes anywhere in what the editor draws from');
  });
  test('an explanation that is working notes is never shown: one fixed sentence, and the wording is still the answer', async () => {
    const ai = stage(['js/i18n.js', 'js/jurisdiction.js', 'js/ai.js']);
    ai.window.copilotAsk = async () => '{"advice":"Now I have the context. Let me draft something for the user.","proposedText":"New wording."}';
    const r = await ai.copilotPropose({ ask: 'Rewrite.', passage: 'Old wording.' });
    assert.equal(r.proposedText, 'New wording.');
    assert.equal(r.explain, null);
    assert.equal(r.advice, 'Copilot suggested new wording. Read it before you apply it.');
    ai.window.copilotAsk = async () => '{"advice":"Worth proposing: it caps the cost.","proposedText":"New wording."}';
    assert.equal((await ai.copilotPropose({ ask: 'Rewrite.', passage: 'Old wording.' })).advice, 'Worth proposing: it caps the cost.', 'clean advice stands');
    ai.window.copilotAsk = async () => '{"advice":"I cannot tell which clause you mean.","proposedText":""}';
    assert.equal((await ai.copilotPropose({ ask: 'Rewrite.', passage: 'Old wording.' })).advice, 'I cannot tell which clause you mean.', 'an answer with no wording is the answer, untouched');
  });
  test('the working-notes reading, and every object in a reply', () => {
    const ai = stage(['js/i18n.js', 'js/jurisdiction.js', 'js/ai.js']);
    for (const t of ['Now I have the context.', 'Let me refine:', 'Wait, I should reconsider.', 'I notice the user said', 'The drafter asked'])
      assert.equal(ai.aiWorkingNotes(t), true, t);
    for (const t of ['As written, you pay for every audit.', 'One audit a year, on notice.', 'Settlement within thirty days.'])
      assert.equal(ai.aiWorkingNotes(t), false, t);
    assert.deepEqual(Array.from(ai.aiJsonObjects('a {"x":"}{"} b {"y":{"z":1}} c')), ['{"x":"}{"}', '{"y":{"z":1}}']);
  });
  test('Copilot is asked for the two parts and told to keep its notes to itself, on both answer shapes', async () => {
    const ai = stage(['js/i18n.js', 'js/jurisdiction.js', 'js/ai.js']);
    for (const placements of [false, true]){
      let seen = '';
      ai.window.copilotAsk = async m => { seen = m[0].content; return '{"advice":"a","proposedText":"b"}'; };
      await ai.copilotPropose({ ask: 'Rewrite.', passage: 'x', placements });
      assert.match(seen, /"whyChange": "One or two plain sentences to the reader/);
      assert.match(seen, /"whatItDoes": "One or two plain sentences to the reader/);
      assert.match(seen, /Never write your working notes or thinking anywhere in the reply/);
    }
  });
  test('both doors draw the two labelled parts with the one builder', () => {
    assert.match(fn(CE, 'ceTurnHtml'), /t\.explain \? ceExplainHtml\(t\.explain\) : t\.text \?/);
    assert.match(fn(CE, 'ceExplainHtml'), /_cet\('ce_why_change'\)[\s\S]*_cet\('ce_what_it_does'\)/);
    assert.match(CE, /explain: wording \? \(res\.explain \|\| null\) : null/, 'the clause door');
    assert.match(fn(RK, 'riskAnswerOf'), /explain: _rk\.explain\[w\.key\] \|\| null/, 'the risk door');
    assert.match(fn(RK, 'riskEditorDraft'), /_rk\.explain\[key\] = \(res && res\.explain\) \|\| null;/);
  });
});

describe('f537 (2) B2 one short title', () => {
  const rk = () => stage(['js/i18n.js', 'js/clausemodel.js', 'js/risks.js']);
  test('a scan rule wears its fixed title; Copilot\'s is cut at six words; an older brief is named from its topic', () => {
    const w = rk();
    assert.equal(w.riskTitleOf({ src: 'scan', id: 'rm-index', title: 'Price review clause references commodity indices without naming one' }), 'Price index · not named');
    assert.equal(w.riskTitleOf({ src: 'scan', id: 't-law', kind: 'missing', title: 'No governing law clause' }), 'Governing law · missing');
    assert.equal(w.riskTitleOf({ src: 'brief', title: 'Audit costs · could fall on us', say: 'Long sentence.' }), 'Audit costs · could fall on us');
    assert.equal(w.riskTitleOf({ src: 'brief', title: 'Maersk can audit the supplier performance including site visits', say: 'Long.' }), 'Maersk can audit the supplier performance…');
    assert.equal(w.riskTitleOf({ src: 'brief', title: 'The liability cap leaves out indirect losses only.', say: '' }), 'Liability · worth a look');
    assert.equal(w.riskTitleOf({ src: 'odd', title: 'Payment is due within ninety days of the invoice date.', say: '' }), 'Payment terms · unusual term');
  });
  test('every scan rule that needs wording has a short title in both books, of at most six words', () => {
    const w = rk();
    const ids = Object.keys(w.RK_NEEDS_WORDING).filter(k => w.RK_NEEDS_WORDING[k] && !/^g-/.test(k));
    assert.ok(ids.length >= 30);
    for (const id of ids){
      const k = 'rk_title_' + id.replace(/[^a-z0-9]+/gi, '_');
      assert.equal((I18N.match(new RegExp('\\n    ' + k + ":", 'g')) || []).length, 2, k);
      const t = w.riskTitleOf({ src: 'scan', id: id.split('_')[0], kind: id.split('_')[1] || '', title: 'x' });
      assert.ok(t.split(/\s+/).filter(x => /[\p{L}\p{N}]/u.test(x)).length <= 6 && / · /.test(t), id + ': ' + t);
    }
  });
  test('the brief is asked for "Topic · problem"; the stored title and the record\'s name are untouched', () => {
    assert.match(SRV, /const BRIEF_TITLE = 'A short name for this point in the form "Topic · problem", at most six words/);
    assert.match(fn(RK, 'riskItemsOf'), /title: String\(f\.title \|\| ''\)/, 'a scan finding keeps its own title as its record name');
    assert.match(RK, /const _rkTopicText = it => \(it && it\.src !== 'scan' && it\.say\) \? it\.say : String\(\(it && it\.title\) \|\| ''\);/);
  });
});

describe('f537 (3) B3 the dropdown', () => {
  test('it takes the disclaimer\'s place, on our seat only, and the disclaimer line is gone', () => {
    assert.match(CE, /\$\{ceNoAi\(\) \? '' : `<div class="ce-pick" id="ce-pick"><\/div>`\}/);
    assert.ok(!/<div class="ce-disc">/.test(CE), 'no "Written by Copilot" line');
    assert.match(fn(CE, 'ceRenderTabs'), /ceRenderPick\(\);/, 'painted with the tabs, so a tab change repaints it');
  });
  test('clauses grouped Their asks · Our asks · Settled with a dot and a state word; risks by short title, worst first', () => {
    const P = fn(CE, 'ceRenderPick');
    assert.match(P, /const rows = risks \? cePickRiskRows\(\) : cePickClauseRows\(\);/);
    assert.match(P, /<select id="ce-pick-sel" data-sm-groups/);
    assert.match(CE, /const CE_PICK_ORDER = \['none', 'theirs', 'ours', 'settled', 'high', 'med', 'low'\];/);
    assert.match(fn(CE, 'cePickRiskRows'), /riskOpenOf\(c\)[\s\S]*riskTitleOf\(it\)/);
    assert.match(fn(CE, 'cePickClauseRows'), /ch\.status === 'superseded'/, 'read RAW off the changes');
    for (const k of ['ce_pick_g_theirs', 'ce_pick_g_ours', 'ce_pick_g_settled', 'ce_pick_st_their', 'ce_pick_st_unsent', 'ce_pick_st_sent', 'ce_pick_st_settled', 'ce_ai_check'])
      assert.equal((I18N.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2, k);
  });
  test('a pick moves the editor the way the pencil or the risk\'s Edit does, asking first over a draft', () => {
    const G = fn(CE, 'cePickGo');
    assert.match(G, /ceLeaveGuard\(\(\) => \{ if \(window\.riskWalkTo\) riskWalkTo\(c, v\); \}\)/);
    assert.match(G, /ceGoClause\(v,/);
    assert.match(fn(RK, 'riskWalkTo'), /return _rkEditorOpen\(c, key, t\);/);
  });
  test('HaTi\'s list draws groups, dots and state words only for a select that asks', () => {
    const O = fn(CORE, 'selectMenuOpen');
    assert.match(O, /if \(sel\.hasAttribute && sel\.hasAttribute\('data-sm-groups'\)\)\{/);
    assert.match(O, /\} else box\.innerHTML = \[\.\.\.sel\.options\]\.map\(row\)\.join\(''\);/, 'every other select as before');
  });
  test('"✦ Copilot · check before sending" goes under Copilot\'s answers and never under HaTi\'s', () => {
    assert.match(CE, /const ceAiFootHtml = t => t && t\.ai \?/);
    assert.equal((CE.match(/who: 'ai', ai: true/g) || []).length, 5, 'the round prep, an answer, a proposal, held wording, the risk\'s answer');
    assert.ok(!/ai: true/.test(fn(CE, 'ceLadderCardHtml')), 'the ladder card is worked out, not written');
    assert.match(fn(CE, 'ceLadderCardHtml'), /<div class="ce-card ce-lcard" title="\$\{_ceea\(_cet\('ce_lc_cost'\)\)\}">/, 'its "no model was called" line rides the hover');
  });
});

describe('f537 (4) B4 the Selected card is gone', () => {
  test('a tag inside the ask box, and nothing over it', () => {
    const S = fn(CE, 'ceRenderScope');
    assert.ok(!/ce-scope is-/.test(S), 'no card');
    assert.match(CE, /<div class="ce-askbox">[\s\S]{0,300}<span class="ce-tag" id="ce-scope"><\/span>/);
    assert.match(S, /words\.slice\(0, CE_TAG_WORDS\)/, 'a highlight shows its first few words');
    assert.match(S, /data-ce-act="scope-off"/); assert.match(S, /data-ce-act="scope-cut"/, 'the one press that strikes words out stays');
    assert.match(CE, /case 'scope-off': ceDetachPassage\(\); break;/, '× goes back to the whole clause');
  });
});

describe('f537 (5) B5 and B6 the risk door and the card', () => {
  test('the heading has no box, says the short title and the severity, then Why it matters; no step count', () => {
    const L = fn(RK, 'riskLaneHtml');
    assert.match(L, /<div class="rk-ce-head"><b class="rk-t" title="\$\{_rkE\(_rkTopicText\(it\)\)\}">\$\{_rkE\(riskTitleOf\(it\)\)\}<\/b>\$\{_rkSevHtml\(it\.sev\)\}<\/div>/);
    assert.ok(!/rk-ce-step"><span>/.test(L), 'the dropdown says which risk this is');
    assert.ok(!/rk-ce-card/.test(L));
    assert.match(RK, /\.rk-ce-head\{display:flex;align-items:baseline;justify-content:space-between/);
  });
  test('every row that names a risk wears the one short title', () => {
    assert.match(fn(RK, '_rkRowHtml'), /\$\{_rkE\(shown\)\}/);
    assert.equal((RK.match(/\$\{_rkE\(riskTitleOf\(it\)\)\}/g) || []).length, 3, 'the covered row, the discarded row and the risk door\'s heading');
  });
});
