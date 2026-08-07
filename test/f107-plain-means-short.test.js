/* ============================================================
   F107 — Plain means short on a proposal too
   ============================================================
   Reported from a real session: "why is Copilot coming back with long long
   explanations?" — over a clause it had decided needed no change at all. The
   advice bubble ran a full paragraph to say so.

   It was not the model being chatty. It was doing as it was told. The advice
   field described itself to the model as a FOUR-PART CHECKLIST — what you
   changed, which risk it moves, what it costs to ask for it, and anything the
   drafter should check — so four points came back, including three whose
   honest answer was "none here": "No risk moves either way", "a Lessor will
   likely accept it as neutral".

   And the reader had a control for exactly this, sitting under the answer.
   PLAIN / LEGAL is the register (js/ai.js, `ai.style`), and its plain half —
   "short answers, two or three sentences" — travels on every call inside
   AI_STYLE_RULES. It changed nothing here, and could not: the four-part
   checklist was in the instruction beside the passage, and a specific
   enumeration next to the question beats a general rule in the background
   briefing every time. So the button's own tooltip ("Everyday language, short
   answers, no legal jargon") was describing something the product did not do
   on this path.

   What is pinned here:

     · the advice field answers to the register, in both formats;
     · LEGAL IS BYTE-FOR-BYTE WHAT IT WAS — the complaint was that the depth
       was compulsory, never that it was wrong;
     · the register and the brief agree rather than contradicting each other;
     · the SHAPE never varies with the register, because the parser reads one
       contract;
     · and it is read at call time, not frozen at load, or flipping the toggle
       would change the button and nothing else for the rest of the session. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

/* ai.js on a stage, with jurisdiction.js under it in js/app.js order — ai.js
   asks it what law this workspace is under. localStorage is real enough to
   hold the register, because persisting it is how "whoever needs one needs it
   every time" is kept. */
function loadAi(){
  const store = {};
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
    toast(){}, getContract(){ return null; }, currentUser(){ return { name: 'You' }; },
    API_MODE(){ return false; }, innerWidth: 1400, addEventListener(){},
    lsGet: k => (k in store ? store[k] : null), lsSet: (k, v) => { store[k] = v; },
    getOrg: () => null,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  /* i18n.js first, in js/app.js's own order: the Copilot panel reads its
     labels through i18t like every other renderer, so a stage without the
     dictionary throws on the first control it draws. */
  for (const f of ['js/i18n.js', 'js/jurisdiction.js', 'js/ai.js'])
    vm.runInContext(read(f), sandbox, { filename: f });
  return sandbox;
}

/* What actually left the building. The transport is stubbed at window.copilotAsk
   — the published binding copilotPropose calls — so this reads the real prompt
   the real builder assembled, not a reconstruction of it. */
const sent = async (ai, opts) => {
  let seen = '';
  ai.window.copilotAsk = async msgs => { seen = msgs[0].content; return '{"advice":"a","proposedText":"b"}'; };
  await ai.copilotPropose(Object.assign({ ask: 'Rewrite.', passage: 'x' }, opts || {}));
  return seen;
};

/* The four-part checklist, exactly as it stood before this change. Written out
   rather than derived, because the point of the assertion is that nobody
   rewrote it while making Plain shorter. */
const LEGAL_ADVICE = 'Your reasoning: what you changed, which risk it moves, what it '
  + 'costs to ask for it, and anything the drafter should check before proposing it.';
const LEGAL_ADVICE_EDIT = 'Your reasoning: what you changed or added, which risk it moves, what it '
  + 'costs to ask for it, and anything the drafter should check before proposing it.';

/* ============================================================ */
describe('F107a — the advice field answers to the register', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  test('THE FIX: plain asks for two or three sentences, legal for the four points', () => {
    ai.aiSetStyle('plain');
    const plain = ai.AI_PROPOSAL_FORMAT();
    assert.match(plain, /two or three sentences/,
      'the length the Plain button has always promised in its tooltip');
    assert.doesNotMatch(plain, /which risk it moves/,
      'the checklist is what produced four answers to a question with one');

    ai.aiSetStyle('legal');
    assert.match(ai.AI_PROPOSAL_FORMAT(), /which risk it moves/);
  });

  test('plain is short in the EDIT format too, where a proposal may add wording', () => {
    /* Two formats, one field. A fix that reached only the replace path would
       leave "✨ Edit with Copilot" — the action people use most — long. */
    ai.aiSetStyle('plain');
    assert.match(ai.AI_EDIT_FORMAT(), /two or three sentences/);
    assert.doesNotMatch(ai.AI_EDIT_FORMAT(), /which risk it moves/);
  });

  test('plain drops the empty points rather than compressing four into three sentences', () => {
    /* This is the half that does the work. Three sentences that must still
       cover four headings is compression, not brevity, and comes back as a
       denser paragraph rather than a shorter one. */
    ai.aiSetStyle('plain');
    assert.match(ai.AI_ADVICE_FIELD('changed'), /only where there is genuinely one/);
  });

  test('and it never licenses leaving out a REAL risk', () => {
    /* The failure mode of the fix: a Copilot that stops mentioning the cost of
       an ask is worse than one that mentions it when there is none. The rule is
       conditional on there being something to say, not on brevity. */
    ai.aiSetStyle('plain');
    const f = ai.AI_ADVICE_FIELD('changed');
    assert.match(f, /a risk, a cost or something to check/i,
      'all three are still asked for where they exist');
  });
});

/* ============================================================ */
describe('F107b — and LEGAL did not move', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); ai.aiSetStyle('legal'); });

  test('the four-part checklist is the text it always was, to the character', () => {
    /* Nobody complained that the depth was wrong — only that it was
       compulsory. A reader who asks for depth gets exactly what they got
       before this change. */
    assert.ok(ai.AI_PROPOSAL_FORMAT().includes(LEGAL_ADVICE),
      'the replace format\'s advice field is unchanged');
    assert.ok(ai.AI_EDIT_FORMAT().includes(LEGAL_ADVICE_EDIT),
      'and the edit format\'s, which says "changed or added"');
  });

  test('legal is the longer instruction of the two, which is the whole point', () => {
    const legal = ai.AI_ADVICE_FIELD('changed');
    ai.aiSetStyle('plain');
    const plain = ai.AI_ADVICE_FIELD('changed');
    assert.notEqual(legal, plain, 'the register has to change something');
  });
});

/* ============================================================ */
describe('F107c — the brief and the instruction now agree', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  /* THE BUG, STATED AS A RULE. AI_STYLE_RULES rides in the system brief on
     every call and its plain half asks for two or three sentences. The advice
     field asked for four points in the instruction beside the passage. Both
     were sent, they contradicted, and the nearer one won. Neither may say
     "short" while the other says "four points" again. */
  test('in plain, both the brief and the field ask for the same length', () => {
    ai.aiSetStyle('plain');
    assert.match(ai.AI_STYLE_RULES(), /two or three sentences/);
    assert.match(ai.AI_ADVICE_FIELD('changed'), /two or three sentences/);
  });

  test('in legal, neither of them asks for it', () => {
    ai.aiSetStyle('legal');
    assert.doesNotMatch(ai.AI_STYLE_RULES(), /two or three sentences/);
    assert.doesNotMatch(ai.AI_ADVICE_FIELD('changed'), /two or three sentences/);
  });
});

/* ============================================================ */
describe('F107d — the shape never varies, whatever the register', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  test('both registers ask for the same fields by the same names', () => {
    /* aiParseProposal reads ONE contract. A register that renamed a field, or
       dropped one, would be a second contract to keep in step — and the day
       they drift is the day a perfectly good answer parses as nothing. */
    for (const style of ['plain', 'legal']){
      ai.aiSetStyle(style);
      for (const field of ['"advice"', '"proposedText"'])
        assert.ok(ai.AI_PROPOSAL_FORMAT().includes(field), `${field} in ${style}`);
      for (const field of ['"advice"', '"proposedText"', '"placement"', '"headingText"'])
        assert.ok(ai.AI_EDIT_FORMAT().includes(field), `${field} in ${style}`);
    }
  });

  test('the placement rules survive both registers', () => {
    /* The two instructions that stop this feature losing wording — "ADD must
       not be replace" and one list item per line — are not part of the
       register and must not be edited out by it. */
    for (const style of ['plain', 'legal']){
      ai.aiSetStyle(style);
      const f = ai.AI_EDIT_FORMAT();
      for (const p of ['replace', 'after', 'before', 'newClause'])
        assert.ok(f.includes(p), `${p} in ${style}`);
      assert.match(f, /ADD.*placement MUST NOT be "replace"/s, style);
      assert.match(f, /ONE ITEM PER LINE/, style);
    }
  });

  test('an answer still parses the same either way', () => {
    ai.aiSetStyle('plain');
    const p = ai.aiParseProposal('{"advice":"Already tight.","proposedText":"The Lessor shall install the equipment."}');
    assert.equal(p.strict, true);
    assert.equal(p.advice, 'Already tight.');
    assert.match(p.proposedText, /shall install/);
  });
});

/* ============================================================ */
describe('F107e — it reaches the model, and it is not frozen at load', () => {
  test('the prompt that leaves carries the plain instruction in plain', async () => {
    const ai = loadAi();
    ai.aiSetStyle('plain');
    const s = await sent(ai);
    assert.match(s, /two or three sentences/);
    assert.doesNotMatch(s, /which risk it moves/);
  });

  test('and the four points in legal', async () => {
    const ai = loadAi();
    ai.aiSetStyle('legal');
    assert.match(await sent(ai), /which risk it moves/);
  });

  test('the edit path carries it too', async () => {
    const ai = loadAi();
    ai.aiSetStyle('plain');
    const s = await sent(ai, { placements: true });
    assert.match(s, /two or three sentences/);
    assert.match(s, /"placement"/, 'and it is still the edit format');
  });

  test('THE FROZEN-CONST TRAP: flipping the register changes the NEXT call', async () => {
    /* A const string built at load would keep asking for the depth the reader
       just turned off, for the rest of the session — the same failure the
       ground rules hit when the market became a setting (F99). The toggle
       would repaint and change nothing that leaves the building. */
    const ai = loadAi();
    ai.aiSetStyle('legal');
    assert.match(await sent(ai), /which risk it moves/);
    ai.aiSetStyle('plain');
    const after = await sent(ai);
    assert.match(after, /two or three sentences/);
    assert.doesNotMatch(after, /which risk it moves/,
      'the register the reader is on now, not the one the module loaded under');
  });

  test('both formats are functions, so neither can be frozen by accident', () => {
    const ai = loadAi();
    assert.equal(typeof ai.AI_PROPOSAL_FORMAT, 'function');
    assert.equal(typeof ai.AI_EDIT_FORMAT, 'function');
    assert.equal(typeof ai.AI_ADVICE_FIELD, 'function');
  });

  test('and no caller reads them as a string', () => {
    /* A source guard, because this is the failure that reappears: the next
       caller somebody writes drops the parentheses, JavaScript stringifies the
       function object without complaint, and the model is sent
       "() => aiStyle() === 'legal' ? ..." as its instructions. Silent, and
       every proposal from that path comes back shapeless.

       The shape of the check matters. "Followed by a space is fine" would have
       passed the very line this change fixed —
       `placements ? AI_EDIT_FORMAT : AI_PROPOSAL_FORMAT` — so the rule is the
       strict one: outside its own declaration and the export list, a mention
       must be a call. */
    const NAMES = ['AI_PROPOSAL_FORMAT', 'AI_EDIT_FORMAT', 'AI_ADVICE_FIELD'];
    for (const f of ['js/i18n.js', 'js/ai.js', 'js/views/negotiation.js']){
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const name of NAMES){
        for (let i = src.indexOf(name); i !== -1; i = src.indexOf(name, i + 1)){
          if (/[A-Za-z0-9_$]/.test(src[i - 1] || '')) continue;   // a longer identifier
          if (src[i + name.length] === '(') continue;             // a call — the only good use
          const from = src.lastIndexOf('\n', i) + 1;
          const to = src.indexOf('\n', i);
          const line = src.slice(from, to === -1 ? undefined : to);
          if (/^\s*const\s+\w+\s*=/.test(line)) continue;         // its own declaration
          if (/^[\sA-Za-z0-9_,]+$/.test(line)) continue;          // the export list
          assert.fail(`${f} uses ${name} without calling it: "${line.trim()}"`);
        }
      }
    }
  });
});
