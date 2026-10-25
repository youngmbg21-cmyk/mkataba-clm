/* f882 — JAMBO'S NOTES NEVER BECOME CONTRACT WORDING (owner's list, 25 Oct 2026, item 8)

   The owner's review of the builder: "the way the parties was applied i think was
   in error". It was. Jambo's report of his own work — "Drafted the Parties
   section for the Swedish-law procurement template, naming HaTi … and leaving
   the counterparty as blanks …" — was read as wording and written into the
   section. Red at the parent: aiLooksConversational read that sentence as
   wording, and the builder had no look-over of a saved template's sections. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* Same stage as F88's, F97's and F98's loaders, deliberately. */
function loadAi(){
  const el = () => ({ addEventListener(){}, querySelectorAll(){ return []; },
    querySelector(){ return null; }, innerHTML: '', value: '', style: {},
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    focus(){}, setSelectionRange(){}, getBoundingClientRect(){ return { width: 430 }; } });
  const sandbox = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp,
    Set, Map, Error, isNaN, parseInt, parseFloat, setTimeout, Promise,
    document: { getElementById: () => el(), querySelector: () => null,
      querySelectorAll: () => [], addEventListener(){}, createElement: () => el(),
      body: { classList: { toggle(){} } } },
    state: { contracts: [], view: '' }, icon: () => '', esc: s => String(s),
    toast(){}, lsGet(){ return null; }, lsSet(){}, getContract(){ return null; },
    currentUser(){ return { name: 'You' }; }, API_MODE(){ return false; },
    innerWidth: 1400, addEventListener(){},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of ['i18n.js', 'jurisdiction.js', 'ai.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'),
      sandbox, { filename: f });
  return sandbox;
}


const THE_PARTIES_NOTE = 'Drafted the Parties section for the Swedish-law procurement template, naming HaTi as the Customer and leaving the supplier\'s name, registration number and address as blanks for each deal.';

describe('f882 — a report of work is a note, never wording', () => {
  test('the sentence that landed in Parties reads as a remark', () => {
    const ai = loadAi();
    assert.equal(ai.aiLooksConversational(THE_PARTIES_NOTE), true);
    assert.equal(ai.aiParseProposal(THE_PARTIES_NOTE).proposedText, '', 'nothing to Apply');
  });
  test('real wording that starts with the same verbs stays wording', () => {
    const ai = loadAi();
    for (const w of ['Drafted by the Supplier, each Statement of Work is approved by the Customer in writing before work begins.',
      'Kept records shall be made available to the Customer on reasonable notice.'])
      assert.equal(ai.aiLooksConversational(w), false, w.slice(0, 40));
  });
  test('the builder keeps a note off the paper, and looks a saved template over on open', () => {
    const TB = fs.readFileSync(path.join(__dirname, '..', 'js/views/templatebuilder.js'), 'utf8');
    assert.match(TB, /function tbSafeWords\(t\)\{ return tbCardWording\(\{ text: t \}\) \? t : ''; \}/);
    assert.match(TB, /const noted = tbNotesOnPaper\(\);/);
    assert.match(TB, /tone: 'amber' \}\); first = first \|\| sec;/);
  });
});
