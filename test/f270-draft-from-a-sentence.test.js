/* f270 — draft from a sentence
   ============================
   Owner-asked (9 Sep 2026): "start on 1. But I need this to be an option and
   not the default when you click on draft template." Type what you need in a
   sentence, and the template this workspace already holds that fits opens
   pre-filled.

   WHAT THIS FILE IS GUARDING is not the wording of a screen. It is the four
   refusals the feature rests on, each of which is a way it could quietly
   become something nobody asked for:

   1. IT PICKS FROM YOUR OWN PAPER. Every candidate is a template the ordinary
      picker already offers, read from the same three sources it reads. A
      model writing clauses from scratch walks around the playbook, the clause
      library and every guard this product has.
   2. IT MINTS NOTHING. The last thing it does is press a door that already
      exists, so the contract is created by the same function with the same
      validation and the same audit line as one drafted by hand.
   3. NOTHING ARRIVES UNSEEN, AND NOTHING ARRIVES IN A BOX THE TEMPLATE DOES
      NOT HAVE. The value lands on a field's default and the reader confirms
      it; a key the chosen template does not declare is dropped on BOTH hosts.
   4. IT IS AN OPTION. "Draft from a template" is untouched, and the new row
      sits beside it rather than in front of it.

   The reading half runs on a small stage (js/draft.js has no view of its
   own); the route runs against a real server with a scripted provider. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const SRC = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* Read so that a build WITHOUT this feature reports its failures one at a
   time rather than aborting on the first missing file — a probe that throws
   proves nothing, which is this suite's own rule. */
const SRC_OPT = f => { try { return SRC(f); } catch (_) { return ''; } };
const DRAFT = SRC_OPT('js/draft.js');
const APP = SRC('js/app.js');

/* ---- the stage -----------------------------------------------------------
   js/draft.js reads the three template sources through `typeof`, so a stage
   supplying none of them is a legitimate one and is tested as such. The
   RECORDERS are what the hand-off assertions read back: nothing here creates
   anything, which is the whole point of the module. */
function load(opts = {}){
  const el = () => ({ addEventListener(){}, querySelector: () => null,
    querySelectorAll: () => [], innerHTML: '', value: '', textContent: '',
    disabled: false, style: {}, focus(){},
    classList: { add(){}, remove(){}, contains(){ return false; } } });
  const box = {};
  const sandbox = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp,
    Set, Map, Error, Promise, isNaN, parseInt, parseFloat, setTimeout,
    document: { getElementById: id => (box[id] === undefined ? el() : box[id]),
      querySelector: () => null, querySelectorAll: () => [], addEventListener(){},
      createElement: () => el() },
    state: { contracts: [], aiConfigured: opts.aiConfigured !== false },
    API_MODE: () => opts.apiMode !== false,
    canEdit: () => opts.canEdit !== false,
    toast(msg, kind){ sandbox.toasts.push({ msg, kind }); },
    openModal(html){ sandbox.modal = html; }, closeModal(){ sandbox.closed = true; },
    api(url, method, body){ sandbox.posted.push({ url, method, body });
      if (opts.apiThrows) return Promise.reject(new Error(opts.apiThrows));
      return Promise.resolve(opts.apiAnswer || {}); },
    toasts: [], posted: [], boxes: box,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SRC('js/i18n.js'), sandbox, { filename: 'i18n.js' });
  /* The doors, as recorders. A press must reach one of these and nothing
     else — there is no fourth way to make a contract here. */
  sandbox.opened = [];
  sandbox.openWizard = (tid, prefill) => sandbox.opened.push({ door: 'wizard', tid, prefill });
  sandbox.createFromCustomTemplate = (id, prefill) => sandbox.opened.push({ door: 'mine', tid: id, prefill });
  sandbox.tplLibNewContract = (id, prefill) => sandbox.opened.push({ door: 'lib', tid: id, prefill });
  if (opts.builtins) sandbox.myCreatableTemplates = () => opts.builtins;
  if (opts.mine) sandbox.customTemplates = () => opts.mine;
  if (opts.lib) sandbox.tplLibPublished = () => opts.lib;
  if (opts.builtins || opts.mine) sandbox.templateFields = t => (t && t.fields) || [];
  vm.runInContext(DRAFT, sandbox, { filename: 'draft.js' });
  return sandbox;
}

/* A value built inside the VM carries that realm's Object.prototype, so
   assert.deepEqual refuses it as "same structure, not reference-equal". Read
   it back as plain data before comparing. */
const plain = v => JSON.parse(JSON.stringify(v));

/* A field list of the shape every template in this product answers with. */
const F = [
  { key: 'counterparty', label: 'Counterparty', type: 'party', maps: 'counterparty', required: true, def: '' },
  { key: 'value',        label: 'Contract value (KES)', type: 'num', maps: 'value', def: '' },
  { key: 'effDate',      label: 'Start date', type: 'date', maps: 'effDate', def: '' },
  { key: 'payDays',      label: 'Payment terms (days)', type: 'num', maps: 'paymentTerms', def: '30' },
];

describe('f270 (1) the wall — a value only ever reaches a box this template has', () => {
  test('a value moves onto that field default', () => {
    const w = load();
    const out = w.draftApplyPrefill(F, { counterparty: 'Nandi Dairy' });
    assert.equal(out.find(f => f.key === 'counterparty').def, 'Nandi Dairy');
  });

  /* THE HALF THAT MATTERS. A key this template does not declare is dropped
     rather than carried into a form that has nowhere to put it — and the
     route drops the same key for the same reason, so neither host has to
     trust the other about what this template asks. */
  test('a key the template does not declare is dropped', () => {
    const w = load();
    const out = w.draftApplyPrefill(F, { counterparty: 'Nandi Dairy', governingLaw: 'Kenya', nonsense: 'x' });
    assert.equal(out.length, F.length, 'no field is invented');
    assert.ok(!out.some(f => f.key === 'governingLaw'));
    assert.ok(!out.some(f => f.key === 'nonsense'));
  });

  test('an empty value leaves the field exactly as it was', () => {
    const w = load();
    const out = w.draftApplyPrefill(F, { payDays: '', value: '   ' });
    assert.equal(out.find(f => f.key === 'payDays').def, '30', "the template's own default stands");
  });

  test('no prefill at all changes nothing', () => {
    const w = load();
    for (const p of [null, undefined, {}]) {
      const out = w.draftApplyPrefill(F, p);
      assert.deepEqual(plain(out.map(f => f.def)), F.map(f => f.def));
    }
  });

  /* THE GETTER TRAP, which THE MAP records four times over: a built-in's
     `label` and `def` are getters that name the workspace currency and the
     workspace itself, and {...f} reads them once and freezes the answer. This
     list is copied by DESCRIPTOR, so a label that follows the reader goes on
     following them. */
  test('a live label survives being prefilled', () => {
    const w = load();
    let currency = 'KES';
    const live = [{ key: 'value', type: 'num', get label(){ return 'Contract value (' + currency + ')'; }, def: '' }];
    const out = w.draftApplyPrefill(live, { value: '400000' });
    currency = 'SEK';
    assert.equal(out[0].label, 'Contract value (SEK)', 'the label is still a getter');
    assert.equal(out[0].def, '400000');
  });

  test('the source list is never written through', () => {
    const w = load();
    const src = JSON.parse(JSON.stringify(F));
    w.draftApplyPrefill(src, { counterparty: 'Nandi Dairy', payDays: '45' });
    assert.equal(src.find(f => f.key === 'counterparty').def, '');
    assert.equal(src.find(f => f.key === 'payDays').def, '30');
  });

  test('draftPrefillFor is the same rule as a plain map', () => {
    const w = load();
    assert.deepEqual(plain(w.draftPrefillFor(F, { counterparty: 'Nandi Dairy', governingLaw: 'Kenya', value: '  ' })),
      { counterparty: 'Nandi Dairy' });
  });

  /* Named, never valued: the values are one press away in boxes that can be
     corrected, and printing them twice makes the uneditable copy read as
     decided. */
  test('what was filled is reported by LABEL', () => {
    const w = load();
    assert.deepEqual(plain(w.draftFilledLabels(F, { counterparty: 'Nandi Dairy', payDays: '45' })),
      ['Counterparty', 'Payment terms (days)']);
    assert.deepEqual(plain(w.draftFilledLabels(F, {})), []);
  });
});

describe('f270 (2) it offers your own paper and nothing else', () => {
  const BUILTIN = [{ id: 'RM', kind: 'Raw Material Supply', blurb: 'supply', fields: F }];
  const MINE = [{ id: 'ct_1', name: 'Our services agreement', description: 'saved', fields: F }];
  const LIB = [{ id: 'lib_1', name: 'Company standard NDA', description: 'published' }];

  test('the three groups the ordinary picker reads, and their kinds', () => {
    const w = load({ builtins: BUILTIN, mine: MINE, lib: LIB });
    const c = plain(w.draftCandidates());
    assert.deepEqual(c.map(x => x.kind), ['builtin', 'mine', 'lib']);
    assert.deepEqual(c.map(x => x.id), ['RM', 'ct_1', 'lib_1']);
    assert.equal(c[0].name, 'Raw Material Supply');
    assert.equal(c[0].fields.length, F.length);
    assert.equal(c[0].fields[0].key, 'counterparty');
    assert.equal(c[0].fields[0].required, true);
  });

  /* A stage carrying only the built-ins is a real one — every one of these is
     read through `typeof`, so what is absent is simply not offered. */
  test('a stage with none of the three sources offers nothing rather than throwing', () => {
    assert.deepEqual(plain(load().draftCandidates()), []);
  });

  /* The saved templates and the published standards are editor-only doors in
     the picker, and they are editor-only here. */
  test('a reader who cannot edit is offered neither saved templates nor standards', () => {
    const w = load({ builtins: BUILTIN, mine: MINE, lib: LIB, canEdit: false });
    assert.deepEqual(plain(w.draftCandidates()).map(x => x.kind), ['builtin']);
  });

  test('a candidate with no id or no name is not offered', () => {
    const w = load({ builtins: [{ id: '', kind: 'Nameless', fields: [] }, { id: 'RM', kind: '', fields: [] }] });
    assert.deepEqual(plain(w.draftCandidates()), []);
  });
});

describe('f270 (3) it mints nothing of its own', () => {
  /* Rule 2 as a sweep. The whole safety of this feature is that it ends by
     pressing a door that already exists — so a creation written HERE would be
     a fourth way to make a contract, with its own idea of what validation and
     an audit line are. */
  const body = DRAFT.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const bad of ['state.contracts.unshift', 'nextId(', 'persist(', 'logAudit(',
    'createFromWizard(', 'buildFromCustomTemplate(', 'tplLibCreate(', 'applyTemplateValues('])
    test('no ' + bad + ' anywhere in the module', () => assert.ok(!body.includes(bad)));

  test('the three doors are the only way out', () => {
    const doors = (body.match(/\b(openWizard|createFromCustomTemplate|tplLibNewContract)\(/g) || []);
    assert.ok(doors.length >= 3, 'all three groups have a door');
  });
});

describe('f270 (4) the hand-off presses the door that already exists', () => {
  const cases = [
    { kind: 'builtin', id: 'RM', door: 'wizard' },
    { kind: 'mine', id: 'ct_1', door: 'mine' },
    { kind: 'lib', id: 'lib_1', door: 'lib' },
  ];
  for (const c of cases) test(c.kind + ' hands to the ' + c.door + ' door, pre-filled', () => {
    const w = load();
    w.draftHandOff({ kind: c.kind, id: c.id, name: 'x', fields: F }, { counterparty: 'Nandi Dairy' });
    assert.equal(w.opened.length, 1);
    assert.deepEqual(plain(w.opened[0]), { door: c.door, tid: c.id, prefill: { counterparty: 'Nandi Dairy' } });
    assert.equal(w.closed, true, 'the sentence screen closes behind it');
  });
});

describe('f270 (5) where it cannot run it says so', () => {
  const BUILTIN = [{ id: 'RM', kind: 'Raw Material Supply', blurb: 'supply', fields: F }];

  test('no Copilot key: the screen opens, says why, and offers the ordinary picker', () => {
    const w = load({ builtins: BUILTIN, aiConfigured: false });
    w.openDraftFromSentence();
    assert.match(w.modal, /dr-pick/, 'the way forward is on the same screen');
    assert.ok(!/id="dr-read"/.test(w.modal), 'no button that could only fail');
    assert.match(w.modal, new RegExp(w.i18t('dr_no_ai').slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  test('static mode is the same answer', () => {
    const w = load({ builtins: BUILTIN, apiMode: false });
    assert.equal(w.draftAiReady(), false);
  });

  test('a viewer is refused in words and nothing opens', () => {
    const w = load({ builtins: BUILTIN, canEdit: false });
    w.openDraftFromSentence();
    assert.equal(w.modal, undefined);
    assert.equal(w.toasts[0].kind, 'err');
  });

  test('nothing to draft from is refused in words', () => {
    const w = load();
    w.openDraftFromSentence();
    assert.equal(w.modal, undefined);
    assert.equal(w.toasts[0].msg, w.i18t('wz_no_templates_role'));
  });

  test('with a key it draws the sentence box and the read button', () => {
    const w = load({ builtins: BUILTIN });
    w.openDraftFromSentence();
    assert.match(w.modal, /id="dr-say"/);
    assert.match(w.modal, /id="dr-read"/);
    assert.match(w.modal, /id="dr-pick"/);
  });
});

describe('f270 (6) reading a sentence — one call, and the second half of the wall', () => {
  const cand = [{ kind: 'builtin', id: 'RM', name: 'Raw Material Supply', blurb: '', fields: F }];
  function stage(answer, opts = {}){
    const w = load(Object.assign({ builtins: [], apiAnswer: answer }, opts));
    const rec = { html: '' };
    w.boxes['dr-say'] = { value: opts.sentence === undefined ? 'Two-year supply with Nandi Dairy' : opts.sentence,
      focus(){}, addEventListener(){} };
    w.boxes['dr-read'] = { textContent: 'Read it', disabled: false, addEventListener(){} };
    w.boxes['dr-out'] = { set innerHTML(v){ rec.html = v; }, get innerHTML(){ return rec.html; },
      addEventListener(){}, querySelector: () => null };
    /* The one press the offer wires, kept so a hand-off can be read back
       through it rather than inferred from markup. */
    w.boxes['dr-go'] = { addEventListener: (_, fn) => { w._go = fn; } };
    w.document.getElementById = id => (w.boxes[id] || null);
    return { w, rec };
  }

  test('one press posts once, carrying the sentence and the candidates', async () => {
    const { w } = stage({ templateId: 'RM', why: 'It is a supply agreement.', fields: [] });
    await w.draftRead(cand);
    assert.equal(w.posted.length, 1, 'one press, one call, one spend');
    assert.equal(w.posted[0].url, 'ai/draft');
    assert.equal(w.posted[0].body.sentence, 'Two-year supply with Nandi Dairy');
    assert.equal(w.posted[0].body.candidates[0].id, 'RM');
    assert.ok(Array.isArray(w.posted[0].body.candidates[0].fields));
  });

  test('a stray key from the route is dropped before it reaches a form', async () => {
    const { w } = stage({ templateId: 'RM', why: '', fields: [
      { key: 'counterparty', value: 'Nandi Dairy' },
      { key: 'governingLaw', value: 'Kenya' },
      { key: 'payDays', value: '   ' },
    ] });
    await w.draftRead(cand);
    assert.match(w.boxes['dr-out'].innerHTML, /dr-found/);
    /* THE PREFILL IS READ BACK THROUGH THE PRESS, never off the markup: what
       reaches the fill screen is what this claim is about. */
    w._go();
    assert.deepEqual(plain(w.opened[0].prefill), { counterparty: 'Nandi Dairy' },
      'governingLaw belongs to no field here, and a blank is not an answer');
  });

  test('nothing fits: it says so and creates nothing', async () => {
    const { w, rec } = stage({ templateId: '', why: '', fields: [] });
    await w.draftRead(cand);
    assert.match(rec.html, /dr-note/);
    assert.ok(rec.html.includes(w.i18t('dr_nothing_fits').slice(0, 40)));
    assert.equal(w.opened.length, 0);
  });

  test('an empty sentence is refused before anything is spent', async () => {
    const { w, rec } = stage({}, { sentence: '   ' });
    await w.draftRead(cand);
    assert.equal(w.posted.length, 0, 'nothing was asked');
    assert.match(rec.html, /dr-note/);
  });

  /* A refusal SAYS which — the reader is looking at this screen, and a toast
     that has already faded is what the renewal card's own note warns about. */
  test('a refusal from the route is printed where the reader is looking', async () => {
    const { w, rec } = stage({}, { apiThrows: 'Daily Copilot budget reached' });
    await w.draftRead(cand);
    assert.match(rec.html, /Daily Copilot budget reached/);
    assert.equal(w.opened.length, 0);
  });

  test('the offer names what was filled and never prints its values', () => {
    const w = load();
    let html = '';
    w.document.getElementById = id => (id === 'dr-out'
      ? { set innerHTML(v){ html = v; }, get innerHTML(){ return html; } }
      : { addEventListener(){} });
    w.draftOffer({ kind: 'builtin', id: 'RM', name: 'Raw Material Supply', fields: F },
      { counterparty: 'Nandi Dairy', payDays: '45' }, 'It is a supply agreement.');
    assert.match(html, /Raw Material Supply/);
    assert.match(html, /Counterparty/);
    assert.match(html, /Payment terms \(days\)/);
    assert.ok(!html.includes('Nandi Dairy'), 'the value belongs in the editable box, not here');
    assert.ok(!html.includes('45'));
  });
});

describe('f270 (7) it is an option, never the default', () => {
  /* The owner's own condition. "Draft from a template" is the first row and
     behaves exactly as it did; this is a fourth row beside it. */
  test('the first row is untouched and still opens the ordinary picker', () => {
    assert.match(APP, /id="menu-wizard"/);
    assert.match(APP, /#menu-wizard[\s\S]{0,160}openWizard\(\)/);
    assert.match(APP, /'Draft from a template'/);
  });

  test('the new row exists, and reads after the first one', () => {
    assert.match(APP, /id="menu-describe"/);
    assert.ok(APP.indexOf('id="menu-wizard"') < APP.indexOf('id="menu-describe"'));
  });

  test('the row opens the sentence screen through window, so a stage without the module is not a crash', () => {
    assert.match(APP, /#menu-describe[\s\S]{0,200}window\.openDraftFromSentence/);
  });

  test('js/draft.js is loaded by the app', () => {
    assert.match(APP, /import '\.\/draft\.js'/);
  });

  /* The three fill screens each take the prefill through ONE reading, so a
     value cannot be applied one way on one screen and another way on another. */
  for (const [file, fn] of [['js/wizard.js', 'openWizard'],
    ['js/views/library.js', 'openTemplateFillModal'],
    ['js/templatefields.js', 'openContractEssentials']])
    test(fn + ' fills through draftApplyPrefill and nothing else', () => {
      const s = SRC(file);
      assert.match(s, /draftApplyPrefill\(/);
      assert.ok(!/\bdef\s*=\s*prefill\[/.test(s), 'no second way to apply a value');
    });

  test('every door carries the prefill through', () => {
    assert.match(SRC('js/wizard.js'), /function openWizard\(preTid, prefill\)/);
    assert.match(SRC('js/views/library.js'), /function createFromCustomTemplate\(tid, prefill\)/);
    assert.match(SRC('js/views/templatelib.js'), /function tplLibNewContract\(id, prefill\)/);
  });
});

describe('f270 (8) both languages', () => {
  const KEYS = ['dr_title', 'dr_lead', 'dr_ph', 'dr_example', 'dr_read_it', 'dr_pick_myself',
    'dr_say_something', 'dr_no_ai', 'dr_nothing_fits', 'dr_failed', 'dr_suggests', 'dr_use_it',
    'dr_also_filled_one', 'dr_also_filled_other', 'dr_filled_none'];
  test('every key answers in English and in Swedish, and differently', () => {
    const S = load().STRINGS;
    for (const k of KEYS) {
      assert.ok(S.en[k] && String(S.en[k]).trim(), k + ' has no English');
      assert.ok(S.sv[k] && String(S.sv[k]).trim(), k + ' has no Swedish');
      assert.notEqual(S.en[k], S.sv[k], k + ' was never translated');
    }
  });
  test('the filled line takes its list', () => {
    const w = load();
    assert.match(w.i18tn('dr_also_filled', 2, { list: 'Counterparty, Start date' }), /Counterparty, Start date/);
  });
});

/* ---- the route, against a real server ----------------------------------- */
describe('f270 (9) the route', () => {
  let ai, h, W;
  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h);
  });
  after(async () => { await h.stop(); await ai.stop(); });

  const CANDS = [
    { id: 'RM', name: 'Raw Material Supply', blurb: 'supply', fields: [
      { key: 'counterparty', label: 'Counterparty', type: 'party' },
      { key: 'payDays', label: 'Payment terms (days)', type: 'num' }] },
    { id: 'ND', name: 'Mutual NDA', blurb: 'confidentiality', fields: [
      { key: 'counterparty', label: 'Counterparty', type: 'party' }] },
  ];
  const tool = input => [{ type: 'tool_use', id: 'tu_1', name: 'draft_from_sentence', input }];
  const ask = (client, body) => client.json('/api/ai/draft', { method: 'POST', body });

  test('it answers with the pick and that template\'s own answers', async () => {
    ai.reset();
    ai.script(tool({ templateId: 'RM', why: 'A supply agreement is what you described.',
      fields: [{ key: 'counterparty', value: 'Nandi Dairy' }, { key: 'payDays', value: '45' }] }));
    const r = await ask(W.admin, { sentence: 'Two-year supply agreement with Nandi Dairy, 45-day payment', candidates: CANDS });
    assert.equal(r.templateId, 'RM');
    assert.match(r.why, /supply/i);
    assert.deepEqual(r.fields, [{ key: 'counterparty', value: 'Nandi Dairy' }, { key: 'payDays', value: '45' }]);
    assert.equal(ai.calls.length, 1, 'one press, one call');
  });

  /* THE WALL'S OTHER HALF. A key the CHOSEN template does not ask for cannot
     reach the browser at all — which is what makes the browser's own drop a
     second guard rather than the only one. */
  test('a key the chosen template does not ask for is dropped', async () => {
    ai.reset();
    ai.script(tool({ templateId: 'ND', why: 'An NDA.', fields: [
      { key: 'counterparty', value: 'Nandi Dairy' },
      { key: 'payDays', value: '45' },
      { key: 'governingLaw', value: 'Kenya' }] }));
    const r = await ask(W.admin, { sentence: 'An NDA with Nandi Dairy', candidates: CANDS });
    assert.equal(r.templateId, 'ND');
    assert.deepEqual(r.fields.map(f => f.key), ['counterparty'],
      "payDays belongs to the OTHER template and governingLaw to neither");
  });

  test('a template nobody offered is refused, and answers as nothing fitting', async () => {
    ai.reset();
    ai.script(tool({ templateId: 'SOMETHING_ELSE', why: 'x', fields: [{ key: 'counterparty', value: 'y' }] }));
    const r = await ask(W.admin, { sentence: 'Anything', candidates: CANDS });
    assert.equal(r.templateId, '');
    assert.deepEqual(r.fields, []);
  });

  test('an honest "nothing fits" travels as itself', async () => {
    ai.reset();
    ai.script(tool({ templateId: '', why: '', fields: [] }));
    const r = await ask(W.admin, { sentence: 'A shareholders agreement', candidates: CANDS });
    assert.equal(r.templateId, '');
  });

  test('a blank value is not an answer', async () => {
    ai.reset();
    ai.script(tool({ templateId: 'ND', why: '', fields: [
      { key: 'counterparty', value: '   ' }] }));
    const r = await ask(W.admin, { sentence: 'An NDA', candidates: CANDS });
    assert.deepEqual(r.fields, []);
  });

  test('the same key twice is answered once', async () => {
    ai.reset();
    ai.script(tool({ templateId: 'ND', why: '', fields: [
      { key: 'counterparty', value: 'First' }, { key: 'counterparty', value: 'Second' }] }));
    const r = await ask(W.admin, { sentence: 'An NDA', candidates: CANDS });
    assert.deepEqual(r.fields, [{ key: 'counterparty', value: 'First' }]);
  });

  /* THE ORDER OF THE TWO FILTERS IS THE CLAIM. De-duplicated first, a blank
     entry marks the key seen and swallows the real answer standing behind
     it — which is a silent loss rather than a visible one. */
  test('a blank first entry does not swallow the answer behind it', async () => {
    ai.reset();
    ai.script(tool({ templateId: 'ND', why: '', fields: [
      { key: 'counterparty', value: '   ' }, { key: 'counterparty', value: 'Nandi Dairy' }] }));
    const r = await ask(W.admin, { sentence: 'An NDA', candidates: CANDS });
    assert.deepEqual(r.fields, [{ key: 'counterparty', value: 'Nandi Dairy' }]);
  });

  test('no sentence and no candidates are each refused before anything is spent', async () => {
    ai.reset();
    const a = await W.admin.raw('/api/ai/draft', { method: 'POST', body: { candidates: CANDS } });
    const b = await W.admin.raw('/api/ai/draft', { method: 'POST', body: { sentence: 'x', candidates: [] } });
    assert.equal(a.status, 400);
    assert.equal(b.status, 400);
    assert.equal(ai.calls.length, 0, 'a refusal costs nothing');
  });

  /* Creating a contract is an editor's act, so reading a sentence into one is
     too — and it spends money besides. */
  test('a viewer is refused', async () => {
    const created = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Read Only', email: 'readonly-draft@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    assert.ok(created.user);
    const c = h.client('readonly-draft@example.co.ke');
    await c.json('/api/login', { method: 'POST', body: { email: 'readonly-draft@example.co.ke', password: 'temporary-pass-1' } });
    await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
    ai.reset();
    const r = await c.raw('/api/ai/draft', { method: 'POST', body: { sentence: 'An NDA', candidates: CANDS } });
    assert.equal(r.status, 403);
    assert.equal(ai.calls.length, 0, 'a refusal costs nothing');
  });

  /* Templates are not contracts and folder scope does not govern them (THE
     MAP: "filing a template is not access control"), so a member who can see
     one stream still gets the whole picker — exactly as the ordinary picker
     gives them. */
  test('a folder-restricted member still gets an answer', async () => {
    ai.reset();
    ai.script(tool({ templateId: 'ND', why: 'An NDA.', fields: [] }));
    const r = await ask(W.restricted, { sentence: 'An NDA', candidates: CANDS });
    assert.equal(r.templateId, 'ND');
  });

  test('the prompt tells the model not to guess, and to answer only the chosen keys', () => {
    const p = ai.calls[ai.calls.length - 1].body.messages[0].content;
    assert.match(p, /LEAVE A QUESTION OUT rather than guess/);
    assert.match(p, /Never invent a counterparty, a value, a date or a term/);
    assert.match(p, /only the CHOSEN template's keys/);
  });

  test('the spend is booked to its own name, never Other', async () => {
    const cfg = await W.admin.json('/api/ai/config');
    assert.ok(cfg.featureLabels && cfg.featureLabels.draft, 'the feature is named');
  });
});
