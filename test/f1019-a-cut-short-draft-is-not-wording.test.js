/* f1019 — A CUT-SHORT DRAFT IS NOT WORDING (owner's screenshot, 12 Nov 2026)
   ============================================================================
   Jambo's answer to "draft for the ticked points" stopped part-way:
       { "advice": "Worth proposing: …", "whyChange": "As it st
   No object closes, so the parser's last fallback took the raw text, labels
   and all, for the clause, and the card offered it under Apply.
     (1) the parser marks a broken proposal object and hands back NO wording;
     (2) every drafting door (clause, template) gets the non-answer mark and a
         true sentence, never a card; a whole answer still stands;
     (3) the chat routes say `truncated` as a FACT beside the notice, and the
         browser-only path reads stop_reason;
     (4) the sentence is in both books and the clause editor says it.
   Run: node --test test/f1019-a-cut-short-draft-is-not-wording.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
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
/* the owner's screenshot, as it arrived */
const CUT = '{\n"advice": "Worth proposing: right now Young has no route at all to recover lost production or lost sales if Juno fails to supply. '
  + 'Juno is likely to push back on the doubled cap and on how widely \\"failure to supply\\" is defined, so expect that to be the next round of negotiation.",\n"whyChange": "As it st';
const WHOLE = '{"advice":"Worth proposing: it caps the cost.","whyChange":"As it stands you carry every loss.","whatItDoes":"A higher ceiling for lost sales.","proposedText":"Each party\\u2019s aggregate liability is capped at twice the fees paid."}';
const PASSAGE = 'Each party’s aggregate liability under this Agreement is capped at the total fees paid.';

describe('f1019 (1) the parser', () => {
  const ai = stage(['js/i18n.js', 'js/jurisdiction.js', 'js/ai.js']);
  test('a proposal object that never closes is marked and carries no wording', () => {
    const r = ai.aiParseProposal(CUT);
    assert.equal(r.cutShort, true);
    assert.equal(r.proposedText, '');
    assert.equal(r.advice, '', 'half a thought is not shown as advice either');
  });
  test('cut anywhere: inside the wording, after a note in front, inside a fence', () => {
    for (const t of ['{"advice":"Fine.","proposedText":"Each party’s aggregate liab', 'Here is my answer:\n{ "whyChange": "As it st', '```json\n{"proposedText": "Each par'])
      assert.equal(ai.aiParseProposal(t).cutShort, true, t);
  });
  test('a whole answer, and plain wording with no wrapper, read as before', () => {
    const w = ai.aiParseProposal(WHOLE);
    assert.equal(w.cutShort, undefined); assert.equal(w.strict, true); assert.match(w.proposedText, /twice the fees paid/);
    const p = ai.aiParseProposal('Each party’s aggregate liability is capped at twice the fees paid.');
    assert.equal(p.cutShort, undefined); assert.match(p.proposedText, /twice the fees paid/);
    /* a blank in wording keeps its braces and is not an object */
    assert.equal(ai.aiParseProposal('The fee is {{fee}} per month.').cutShort, undefined);
  });
});

describe('f1019 (2) every drafting door', () => {
  test('the clause door: a cut-short answer is a non-answer with a true sentence, never wording', async () => {
    const ai = stage(['js/i18n.js', 'js/jurisdiction.js', 'js/ai.js']);
    ai.window.copilotAsk = async () => ({ answer: CUT });
    const r = await ai.copilotPropose({ ask: 'Rewrite.', passage: PASSAGE });
    assert.equal(r.unfinished, true); assert.equal(r.cutShort, true);
    assert.equal(r.proposedText, '');
    assert.match(r.advice, /cut short/);
    assert.ok(!/whyChange|"advice"|\{/.test(JSON.stringify([r.advice, r.proposedText])), 'no label and no brace in anything a door draws');
  });
  test('the route said it ran out of room: plain words are not taken for the whole clause, a whole object still stands', async () => {
    const ai = stage(['js/i18n.js', 'js/jurisdiction.js', 'js/ai.js']);
    ai.window.copilotAsk = async () => ({ answer: 'Each party’s aggregate liability under this Agreement is capped at', truncated: true });
    const cut = await ai.copilotPropose({ ask: 'Rewrite.', passage: PASSAGE });
    assert.equal(cut.unfinished, true); assert.equal(cut.proposedText, '');
    ai.window.copilotAsk = async () => ({ answer: WHOLE, truncated: true });
    const whole = await ai.copilotPropose({ ask: 'Rewrite.', passage: PASSAGE });
    assert.ok(!whole.unfinished); assert.match(whole.proposedText, /twice the fees paid/);
  });
  test('the template door', async () => {
    const ai = stage(['js/i18n.js', 'js/jurisdiction.js', 'js/ai.js']);
    ai.window.copilotAsk = async () => ({ answer: CUT });
    const r = await ai.copilotPropose({ template: true, heading: 'Limitation of Liability', instruction: 'Write it.' });
    assert.equal(r.unfinished, true); assert.equal(r.proposedText, ''); assert.match(r.advice, /cut short/);
  });
});

describe('f1019 (3) the cap is a fact, and (4) the words', () => {
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
  test('both chat routes send `truncated` beside the notice; the browser-only path reads stop_reason', () => {
    const SRV = strip(read('server/server.js'));
    assert.equal(SRV.split('...(truncated ? { truncated: true } : {})').length - 1, 2);
    const AI = strip(read('js/ai.js'));
    assert.match(AI, /stop_reason==='max_tokens'\) cut=true/);
    assert.match(AI, /if\(cut\) final\.truncated=true/);
  });
  test('the sentence is in both books, and the clause editor says it with Try again', () => {
    const I18N = read('js/i18n.js');
    assert.equal(I18N.split('ce_ask_cut_short:').length - 1, 2);
    const CE = strip(read('js/views/clauseeditor.js'));
    assert.match(CE, /text: String\(res\.advice \|\| ''\)\.trim\(\) \|\| _cet\('ce_ask_unfinished'\), retry: q/);
  });
});
