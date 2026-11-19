'use strict';
/* f1100 — THE ONE EDIT POP-UP, THE LEGORA WAY, AND "TELL JAMBO, HE FILLS IT IN" (owner, 19 Nov 2026: "use legora way";
   "I am simply able to instruct jambo to add so and so as the contact for this company and then it does it for me and
   I just have to press add or save")
   1 · ONE builder (lgpHtml, js/components.js): a serif head, label-beside-words lines with no boxes, a paged tick list
       (six), ONE black button (type submit), a second grey act, Cancel last, Back on the left; published once.
   2 · The edits started in a panel open it: the party's facts, the contacts sheet (two steps), the code name, a party,
       Mark done, a Playbook decision; the people on an agreement sit in its frame. Nothing is typed in the panel.
   3 · One sentence is read by rule (cuContactRead): party, name, title, email, phone, role; the sheet opens filled,
       each such line "from your words"; nothing saved before Add. Every Jambo box asks it first (caAskAnywhere).
   At the parent none of these exist, so every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const COMP = read('js/components.js'), CU = read('js/views/customers.js'), PT = read('js/participants.js');

test('f1100 (1) one builder: serif head, lines without boxes, a list paged by six, one black button, Cancel last', () => {
  const H = strip(fnBody(COMP, 'lgpHtml'));
  assert.match(H, /class="lgp-h"/); assert.match(H, /type="submit" class="ui-btn ui-btn-primary lgp-go"/);
  assert.ok(H.indexOf('${prim}${alt}${cancel}') > 0, 'the black button, the grey act, then Cancel');
  assert.match(COMP, /const LGP_PAGE = 6;/);
  assert.match(strip(fnBody(COMP, 'lgpOpen')), /maxWidth: LGP_W, ownFrame: true/);
  const css = read('index.html');
  assert.match(css, /\.lgp \.lgp-in\{[^}]*border:0;[^}]*background:transparent/, 'a line, never a box');
  assert.ok(css.indexOf('.lgp .lgp-in{') < css.indexOf('html:not(#_):not(#_) :is(input:not'), 'before the closing field rule, which keeps a pressed line to one light edge');
});

test('f1100 (2) the panel edits open it; nothing is typed inside the panel', () => {
  assert.match(strip(fnBody(CU, 'partyRecordOpen')), /lgpOpen\(\{ id: 'cu-pr-form'/);
  assert.doesNotMatch(strip(fnBody(CU, 'cunPanelFiveHtml')), /<form|html: `<form/, 'the panel draws no form');
  assert.match(strip(fnBody(PT, 'partyContactsOpen')), /lgpOpen\(/);
  assert.match(strip(fnBody(PT, '_pcSheet')), /_pc\.step === 1/); assert.match(strip(fnBody(PT, '_pcSheet')), /lgpListHtml\(/);
  const CT = read('js/views/contract.js');
  assert.match(strip(fnBody(CT, 'cnEditOpen')), /lgpOpen\(/); assert.match(strip(fnBody(CT, 'openPartyEditor')), /lgpOpen\(\{ id:'py-form'/);
  assert.match(strip(fnBody(read('js/obligations.js'), 'openObligationDone')), /lgpOpen\(\{ id: 'od-form'/);
  assert.match(strip(fnBody(read('js/views/ladder.js'), 'ldDecideOpen')), /lgpOpen\(\{ id: 'ld-decide'/);
  assert.match(strip(fnBody(read('js/paperdesk.js'), 'pdPeopleOpen')), /lgpHtml\(\{ id: 'pd-ppl-form'/);
});

/* the reader, run for real against a small book of parties */
function reader(chosen){
  const sb = { state: { view: chosen ? 'customers' : 'dashboard' }, i18t: k => k,
    insSelected: () => chosen || null };
  vm.createContext(sb);
  const pick = ['cuKeyOf', 'cuShortName', 'cuContactRead'].map(n => fnBody(CU, n)).join('\n');
  vm.runInContext(`${pick}
    const CU_LEGAL_TAIL = ${/const CU_LEGAL_TAIL = (\/[^\n]+\/i);/.exec(CU)[1]};
    const CU_CONTACT_ASK = ${/const CU_CONTACT_ASK = (\/[^\n]+\/i);/.exec(CU)[1]};
    const CU_CONTACT_WORD = ${/const CU_CONTACT_WORD = (\/[^\n]+\/i);/.exec(CU)[1]};
    const BOOK = [{ name: 'Naivas Supermarkets' }, { name: 'Kabras Sugar' }];
    function cuCustomers(){ return BOOK; }
    function cuCustomerOf(k){ return BOOK.find(r => cuKeyOf(r.name) === k) || null; }
    this.read = cuContactRead;`, sb);
  return sb.read;
}

test('f1100 (3) one sentence fills a contact: the party, name, title, email, phone, role', () => {
  const r = reader(null)('Add Grace Wambui, Head of Buying, grace@naivas.co.ke, +254 722 418 305, she signs for them, as the contact for Naivas Supermarkets');
  assert.ok(r && r.party, 'the party is read from the words');
  assert.equal(r.party.name, 'Naivas Supermarkets');
  assert.deepEqual(JSON.parse(JSON.stringify(r.prefill)), { name: 'Grace Wambui', title: 'Head of Buying', email: 'grace@naivas.co.ke', phone: '+254 722 418 305', role: 'cpsign' });
});

test('f1100 (3b) the chosen party is used when none is named; a sentence that is not an add is left to the others', () => {
  const r = reader('kabras sugar')('add Peter Otieno, procurement lead, peter@kabras.co.ke as a contact');
  assert.equal(r.party.name, 'Kabras Sugar');
  assert.equal(r.prefill.name, 'Peter Otieno'); assert.equal(r.prefill.title, 'procurement lead'); assert.equal(r.prefill.email, 'peter@kabras.co.ke');
  assert.equal(r.prefill.role, 'negotiate', '"lead" reads as their lead');
  assert.equal(reader(null)('Show me the contracts with Naivas'), null);
  assert.equal(reader(null)('add a clause about data protection'), null, 'no contact word, no address: not ours');
  const none = reader(null)('Add Mary Achieng as a contact');
  assert.ok(none && !none.party, 'no party named or chosen: Jambo asks which');
});

test('f1100 (3c) every Jambo box asks it first; the sheet marks what Jambo filled and saves nothing before Add', () => {
  const ask = fnBody(read('js/copilotacts.js'), 'caAskAnywhere');
  assert.ok(ask.indexOf('cuContactAsk(t, opts.say)') > 0 && ask.indexOf('cuContactAsk(t, opts.say)') < ask.indexOf('caUnderstand(t, { box })'));
  assert.match(strip(fnBody(PT, 'partyContactsOpen')), /o\.prefill && !o\.edit/);
  assert.match(strip(fnBody(PT, '_pcSheet')), /from: f\('name'\)/);
  assert.match(strip(fnBody(COMP, 'lgpRowHtml')), /lgp_from_words/);
  assert.doesNotMatch(strip(fnBody(PT, 'partyContactsOpen')), /_pcSave|_pcApply/, 'opening never saves');
});
