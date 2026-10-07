/* f544 — CREATING AN AMENDMENT (work order O, part 2, 7 Oct 2026)
   (1) the door: live on a signed agreement, greyed with its reason on a
       draft; the reverse link is a small question set apart (O-9).
   (2) the dialog asks one question first and offers two ways on (O-10).
   (3) one numbered item per change, remembered with the clause it changes,
       and the proposed facts kept as suggestions (O-11, O-15).
   (4) Copilot's route drops a proposal whose quote of the signed wording is
       not in the agreement, and says how many it dropped (O-12).
   (5) once an amendment is signed, the agreement's value reads from it,
       without the stored value being rewritten (O-16).
   (6) As amended: the original's clauses with the signed change marked and
       labelled (O-17).
   (7) every new word is in both books. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const I18N = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;
const BODY = '<h2>3. Term</h2><p>This Agreement continues until 31 December 2026 unless terminated earlier.</p>'
  + '<h2>6. Fees</h2><p>The Customer shall pay an annual fee of SEK 1,200,000, invoiced quarterly in advance.</p>';

const ME = { id: 'u_y', name: 'Young Mbagaya', role: 'admin', email: 'y@hati.co.ke' };
function world(){
  const w = buildWorld({ user: ME, family: true, contractView: true, negotiationView: true }).win;
  w.state = { settings: {}, contracts: [], activeId: null, view: 'workspace' };
  w.FIRST_PARTY = 'HaTi Ltd';
  w.getUsers = () => [ME];
  w.getContract = id => w.state.contracts.find(x => x.id === id) || null;
  w.canEdit = () => true;
  w.openModal = html => { const r = w.document.getElementById('modal-root') || w.document.body.appendChild(Object.assign(w.document.createElement('div'), { id: 'modal-root' })); r.innerHTML = html; };
  w.closeModal = () => {};
  return w;
}
function parent(w, over){
  const c = Object.assign({ id: 'MK-318', name: 'Supply Agreement', counterparty: 'Delta LLC', party: 'HaTi Ltd',
    status: 'Signed', hash: 'h', format: 'rich', redlineText: BODY, value: 1200000, expiry: '2026-12-31',
    audit: [], signatures: [], fields: {} }, over || {});
  w.state.contracts.unshift(c);
  return c;
}

test('f544 (1) the door is live on a signed agreement and greyed on a draft', () => {
  const w = world();
  let host = w.document.getElementById('family-section');
  if (!host){ host = w.document.body.appendChild(w.document.createElement('div')); host.id = 'family-section'; }
  w.renderFamilySection(parent(w));
  let b = w.document.getElementById('fam-create');
  assert.ok(b && !b.disabled, 'live on a signed agreement');
  assert.match(host.textContent, /Is this agreement itself an amendment\?/, 'the reverse act is a question');
  assert.ok(w.document.querySelector('.fam-rev #fam-link'), 'set apart from the buttons');
  w.renderFamilySection(parent(w, { id: 'MK-319', status: 'Draft', hash: null }));
  b = w.document.getElementById('fam-create');
  assert.ok(b.disabled, 'greyed on a draft');
  assert.match(host.textContent, /Still a draft: change the wording directly/);
  assert.ok(w.document.getElementById('fam-edit'), 'with the way forward');
});

test('f544 (2) the dialog asks what should change, with two ways on', () => {
  const w = world();
  w.openCreateAmendmentModal(parent(w));
  const d = w.document;
  assert.ok(d.getElementById('am-note'), 'one box for the change');
  assert.ok(d.querySelectorAll('[data-am-chip]').length >= 5, 'shortcuts');
  assert.ok(d.getElementById('am-rel') && d.getElementById('am-name'), 'kind and name are small facts');
  assert.ok(d.getElementById('am-blank'), 'the manual way');
  assert.ok(d.getElementById('am-ai'), 'and Copilot');
  d.getElementById('am-blank').click();
  assert.equal(d.getElementById('am-dlg').dataset.step, 'pick');
  assert.equal(d.querySelectorAll('[data-am-pick]').length, 2, 'the signed agreement\'s two clauses');
});

test('f544 (3) one numbered item per change, remembered, facts kept as suggestions', () => {
  const w = world();
  const p = parent(w);
  const made = w.createAmendment(p, { relation: 'amendment', name: 'Amendment No. 1 to Supply Agreement',
    items: [{ clauseLabel: '3. Term', clauseNumber: '3', op: 'replace', signed: 'until 31 December 2026', amended: 'This Agreement continues until 31 December 2027 unless terminated earlier.' }],
    facts: { expiry: '2027-12-31', value: 1320000 } });
  const c = made.contract;
  assert.match(c.redlineText, /<strong>1\. Term\.<\/strong> Clause 3 is deleted and replaced with: &ldquo;This Agreement continues until 31 December 2027/);
  assert.equal(c.amends.length, 1);
  assert.equal(c.amends[0].clauseNumber, '3');
  assert.deepEqual(JSON.parse(JSON.stringify(c.amendFacts)), { expiry: '2027-12-31', value: 1320000 });
  assert.ok(!(c.value > 0), 'nothing applied by itself');
  const sug = w.amendSuggestions(c).map(x => x.k);
  assert.ok(sug.includes('value'), 'the value is offered to confirm');
});

describe('f544 (4) Copilot\'s proposals are checked against the signed wording', () => {
  let h, ai, W;
  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { approvalRules: [] });
  });
  after(async () => { await h.stop(); await ai.stop(); });
  test('a quote not in the agreement is dropped and counted', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu1', name: 'draft_amendment', input: { kind: 'amendment', items: [
      { clauseNumber: '3', clauseLabel: '3. Term', op: 'replace', signed: 'This Agreement continues until 31 December 2026 unless terminated earlier.', amended: 'This Agreement continues until 31 December 2027 unless terminated earlier.' },
      { clauseNumber: '6', clauseLabel: '6. Fees', op: 'replace', signed: 'The Customer pays nothing at all.', amended: 'x' }],
      facts: { expiry: '2027-12-31', value: 1320000 } } }]);
    const r = await W.admin.json('/api/ai/amend', { method: 'POST', body: {
      text: '3. Term\nThis Agreement continues until 31 December 2026 unless terminated earlier.\n6. Fees\nThe Customer shall pay an annual fee of SEK 1,200,000.',
      ask: 'Extend by one year.' } });
    assert.equal(r.items.length, 1, 'the true quote stands');
    assert.equal(r.items[0].clauseNumber, '3');
    assert.equal(r.dropped, 1, 'the invented one is counted, not shown');
    assert.equal(r.facts.expiry, '2027-12-31');
  });
});

test('f544 (5) a signed amendment sets the value the agreement reads, stored value untouched', () => {
  const w = world();
  const p = parent(w);
  const kid = { id: 'MK-318-A1', parentId: 'MK-318', relation: 'amendment', name: 'Amendment No. 1', status: 'Signed', hash: 'k',
    value: 1320000, metadata: { effectiveDate: '2027-01-01' }, amends: [] };
  w.state.contracts.push(kid);
  if (w.familyIndexDirty) w.familyIndexDirty();
  const e = w.effectiveTerm(p, 'value');
  assert.equal(e.v, 1320000);
  assert.equal(e.from.id, 'MK-318-A1');
  assert.equal(p.value, 1200000, 'the stored value is not rewritten');
  kid.status = 'Draft'; kid.hash = null; if (w.familyIndexDirty) w.familyIndexDirty();
  assert.equal(w.effectiveTerm(p, 'value').v, 1200000, 'an unsigned amendment changes nothing');
});

test('f544 (6) As amended draws the change, marked and labelled', () => {
  const w = world();
  const p = parent(w);
  w.state.contracts.push({ id: 'MK-318-A1', parentId: 'MK-318', relation: 'amendment', name: 'Amendment No. 1', status: 'Signed', hash: 'k',
    amends: [{ clauseNumber: '3', clauseLabel: '3. Term', op: 'replace', amended: 'This Agreement continues until 31 December 2027 unless terminated earlier.' }] });
  if (w.familyIndexDirty) w.familyIndexDirty();
  const html = w.asAmendedHtml(p);
  assert.ok(html, 'there is something to read');
  assert.match(html, /<del class="am-del">2026<\/del>/);
  assert.match(html, /<ins class="am-ins">2027<\/ins>/);
  assert.match(html, /<span class="am-tag">Amendment No\. 1<\/span>/);
  assert.match(html, /The signed originals are what bind/);
});

test('f544 (7) every new word is in both books', () => {
  for (const k of ['fa_amend_title', 'fa_amend_sub_ai', 'fa_chip_extend', 'fa_start_blank', 'fa_draft_with_copilot',
    'fa_found_n_one', 'fa_found_n_other', 'fa_create_amendment_go', 'fa_pick_title', 'fa_draft_no_amend', 'fa_is_itself',
    'fa_what_changes', 'fa_still_to_fill', 'fa_confirm_these', 'ct_from_doc', 'fa_original', 'fa_as_amended', 'fa_as_amended_foot'])
    assert.ok(inBoth(k), k);
});
