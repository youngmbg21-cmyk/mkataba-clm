/* THE WALL TEST, STANDING (13 Oct 2026, phase 1 of the best-in-class plan).
   ============================================================
   The crash course: "internal notes stay internal — a leak here is a serious
   business harm; test this with a real second account". HaTi walls many
   things from the other side (the review and who was asked, a colleague's
   suggestion, the trail, the brief, the risks, the standards check, who is in
   the room, the stream a contract is filed in…), and each wall had its own
   check in its own file. This file is ONE LIST and ONE CHECK: every field that
   must never cross is named below with a sentinel value, the product's own
   payload builder and the product's own share routes are run against a
   contract that carries all of them, and the answer the other side gets is
   searched for every sentinel. A field added to the record and not named here
   either never crosses (fine) or crosses and fails this file.

   TWO HALVES, ONE LIST.
     A  the browser's builder, buildSharePayload (js/core.js), is an allow-list:
        the payload it builds must carry no sentinel, and every key it does
        carry must be on PASS below — a new key fails until it is named.
     B  the server's doors: the payload goes through POST /api/shares, and the
        other side's GET /api/shares/:token and the status link GET /deal/:token
        are read anonymously; neither answer may carry a sentinel, and the
        status page carries no person's name at all.

   Run: node --test --test-reporter=dot test/wall-standing.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');

/* ---- THE LIST ----
   One entry per thing that must never reach the other side: the key on the
   record, a value shaped like the real one, and the sentinel inside it. */
const S = k => `WALL-${k}-7f3a9c`;
const WALL = [
  { key: 'review',        why: 'who was asked to look, and what they said',   value: { status: 'open', reviewer: { id: 'u_boss', name: S('REVIEWER') }, by: S('ASKER'), note: S('REVIEW-NOTE'), ids: ['ch1'] } },
  { key: 'revisions',     why: 'the review\'s history',                        value: [{ at: '2026-10-01T09:00:00.000Z', note: S('REVISION') }] },
  { key: 'comments',      why: 'internal chatter',                             value: [{ at: '2026-10-01T09:00:00.000Z', by: S('COMMENTER'), text: S('COMMENT') }] },
  { key: 'audit',         why: 'the trail',                                    value: [{ at: '2026-10-01T09:00:00.000Z', user: S('TRAIL-USER'), action: S('TRAIL-ACTION'), detail: S('TRAIL-DETAIL') }] },
  { key: 'asks',          why: 'colleagues\' asks',                            value: [{ id: 'a1', kind: 'review', to: { name: S('ASK-TO') }, note: S('ASK-NOTE'), open: true }] },
  { key: 'risks',         why: 'the risk scan',                                value: [{ id: 'r1', title: S('RISK'), why: S('RISK-WHY') }] },
  { key: '_brief',        why: 'the brief (transport)',                        value: { v: 1, at: '2026-10-01T09:00:00.000Z', by: S('BRIEF-BY'), data: { overview: S('BRIEF') } } },
  { key: 'brief',         why: 'the brief (record)',                           value: { overview: S('BRIEF-REC') } },
  { key: 'breakdown',     why: 'the company view',                             value: { points: [{ title: S('STAKE'), stake: S('STAKE-WHY') }] } },
  { key: 'playbook',      why: 'the standards check',                          value: { label: S('PLAYBOOK'), verdicts: [{ category: S('STANDARD'), status: 'deviation', note: S('VERDICT') }] } },
  { key: 'datedWindows',  why: 'Jambo\'s dated windows',                       value: [{ label: S('WINDOW'), from: '2026-01-01', to: '2026-02-01' }] },
  { key: 'obReview',      why: 'the obligations review desk',                  value: { hash: 'x', decisions: { d1: S('OBREVIEW') } } },
  { key: 'notesRead',     why: 'who read which note',                          value: { u_boss: S('NOTES-READ') } },
  { key: 'signSpots',     why: 'marks on the paper',                           value: [{ id: 's1', clauseId: S('SPOT'), by: S('SPOT-BY') }] },
  { key: 'signApprovals', why: 'a named person\'s yes before signing',         value: [{ id: 'sa1', approver: { name: S('APPROVER') }, status: 'pending', note: S('APPROVAL-NOTE') }] },
  { key: 'here',          why: 'who is in the room',                           value: { u_boss: { name: S('PRESENCE'), at: '2026-10-01T09:00:00.000Z' } } },
  { key: 'obligations',   why: 'the duties we track',                          value: [{ id: 'o1', desc: S('DUTY'), owner: S('DUTY-OWNER') }] },
  { key: 'folder',        why: 'the stream it is filed in',                    value: S('STREAM') },
  { key: 'owner',         why: 'the owner, a person',                          value: { id: 'u_me', name: S('OWNER') } },
  { key: 'participants',  why: 'people on this contract',                      value: [{ id: 'p1', name: S('PARTICIPANT'), role: 'reader' }] },
  { key: 'triage',        why: 'Jambo\'s arrival reading',                     value: { at: '2026-10-01T09:00:00.000Z', why: S('TRIAGE') } },
  { key: 'desk',          why: 'the negotiation desk',                         value: { lead: { id: 'u_me', name: S('DESK-LEAD') }, roster: [{ name: S('DESK-ROSTER') }] } },
  { key: 'textFingerprint', why: 'the fingerprint (f12: stays behind)',        value: S('FINGERPRINT') },
  { key: 'simhash',       why: 'the simhash (f12: stays behind)',              value: S('SIMHASH') },
  { key: 'negotiation',   why: 'our side\'s notes inside the negotiation',     value: { notes: [{ id: 'n1', side: 'internal', text: S('NEGO-NOTE'), by: S('NEGO-NOTE-BY') }], rounds: [] } },
];
/* ON A CHANGE: colleagues' names DO travel with a change (by design, see the
   legal audit); the review's ruling, who resolved it and the desk's suggestion
   do not. */
const WALL_ON_CHANGE = [
  { key: 'resolvedBy',  value: S('RESOLVED-BY') },
  { key: 'suggested',   value: { by: { id: 'u_c', name: S('SUGGESTED-BY') }, at: '2026-10-01T09:00:00.000Z' } },
  { key: 'reviewNote',  value: S('REVIEW-ON-CHANGE') },
  { key: 'review',      value: { status: 'open', by: S('CHANGE-REVIEW-BY') } },
  /* an internal note on the change's own thread: "internal means it stays on
     this record" (negoPostComment) — a shared one travels, this one must not */
  { key: 'thread',      value: [{ id: 'n1', who: S('THREAD-WHO'), byId: 'u_me', side: 'owner', visibility: 'internal', text: S('THREAD-TEXT'), body: S('THREAD-BODY'), at: '2026-10-01T09:00:00.000Z' }] },
];
const SENTINELS = [];
const collect = v => { if (typeof v === 'string') { if (/^WALL-/.test(v)) SENTINELS.push(v); } else if (v && typeof v === 'object') Object.values(v).forEach(collect); };
WALL.forEach(w => collect(w.value)); WALL_ON_CHANGE.forEach(w => collect(w.value));

/* ---- WHAT MAY CROSS (the allow-lists; recorded, and only widened on purpose) ---- */
const PASS_PAYLOAD = ['v', 'kind', 'purpose', 'purposeChosen', 'org', 'sharedBy', 'at', 'contract', 'party', 'lead', 'leadNotice', 'stands', 'negotiation', 'changes', 'rounds', 'ourProposals', 'signerPlan', 'signingOrder', 'signingOpen', 'docHash'];
const PASS_CONTRACT = ['id', 'name', 'counterparty', 'template', 'value', 'valueType', 'currency', 'fields', 'format', 'text', 'redlineText', 'clauses', 'docHtml', 'rounds', 'hash', 'contractNo', 'party', 'parties', 'partiesMulti', 'expiry', 'start', 'status', 'signedCopy', 'metadata',
  /* recorded 13 Oct 2026 from the builder as it stands */
  'source', 'signatures', 'changes', 'negotiation', 'upload', 'executed', 'templateForm', 'branding', 'docText', 'viewBody', 'adviseOn', 'adviseBody', 'openPoints', 'versions'];
const PASS_CHANGE = ['id', 'clauseId', 'clauseIdx', 'num', 'title', 'side', 'author', 'at', 'summary', 'before', 'after', 'beforeHtml', 'afterHtml', 'bodyHtml', 'hash', 'status', 'decision', 'decidedAt', 'kind', 'formattingOnly', 'superseded', 'supersededBy', 'counterOf', 'countered', 'bundle', 'onTop', 'round', 'sent', 'sentAt', 'via', 'unmarked', 'insert', 'deleted', 'ops', 'partyId', 'wordingHash', 'fingerprint', 'text', 'html'];

const BODY = '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>';

function walledContract(over = {}) {
  const c = { id: 'MK-W1', name: 'Cane Supply Agreement', counterparty: 'Nordfrakt Logistik AB', template: 'WH',
    status: 'Under Review', folder: FOLDER_A, fields: {}, metadata: {}, rounds: [], versions: [], signatures: [],
    value: 4800000, valueType: 'standard', redlineText: BODY, format: 'rich',
    changes: [{ id: 'ch1', clauseId: 'c4', side: 'owner', author: 'Wanjiru Kamau', at: '2026-10-01T09:00:00.000Z',
      summary: 'our ask', before: 'thirty (30) days', after: 'forty-five (45) days', status: 'open', sent: true }] };
  for (const w of WALL) c[w.key] = JSON.parse(JSON.stringify(w.value));
  for (const w of WALL_ON_CHANGE) c.changes[0][w.key] = JSON.parse(JSON.stringify(w.value));
  return Object.assign(c, over);
}
const crossed = text => SENTINELS.filter(s => text.includes(s));
const unknownKeys = (obj, pass) => Object.keys(obj || {}).filter(k => !pass.includes(k));

function core() { return loadViews(['js/richdoc.js', 'js/core.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS }); }
const WHO = { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' };

describe('A — the browser\'s builder is an allow-list', () => {
  test('the list itself is whole: every walled entry carries a sentinel', () => {
    assert.ok(SENTINELS.length >= WALL.length + WALL_ON_CHANGE.length, `${SENTINELS.length} sentinels for ${WALL.length + WALL_ON_CHANGE.length} entries`);
  });
  test('no walled field reaches the payload, for a negotiation link', () => {
    const s = core();
    const p = s.buildSharePayload(walledContract(), 'hash', { ...WHO, purpose: 'negotiate' }, { purpose: 'negotiate' });
    const leaked = crossed(JSON.stringify(p));
    assert.deepEqual(leaked, [], `crossed into the payload: ${leaked.join(', ')}`);
  });
  test('every key the payload carries is on the allow-list (a new key is named here before it travels)', () => {
    const s = core();
    const p = s.buildSharePayload(walledContract(), 'hash', { ...WHO, purpose: 'negotiate' }, { purpose: 'negotiate' });
    assert.deepEqual(unknownKeys(p, PASS_PAYLOAD), [], 'top-level keys not on PASS_PAYLOAD');
    assert.deepEqual(unknownKeys(p.contract, PASS_CONTRACT), [], 'contract keys not on PASS_CONTRACT');
    const changes = (p.contract && p.contract.changes) || p.changes || [];
    for (const ch of changes) assert.deepEqual(unknownKeys(ch, PASS_CHANGE), [], 'change keys not on PASS_CHANGE');
  });
  test('the same for a signing link and a status link', () => {
    const s = core();
    for (const purpose of ['sign', 'status']) {
      const p = s.buildSharePayload(walledContract(), 'hash', { ...WHO, purpose }, { purpose });
      const leaked = crossed(JSON.stringify(p));
      assert.deepEqual(leaked, [], `${purpose}: crossed: ${leaked.join(', ')}`);
    }
  });
});

describe('B — the server\'s doors', () => {
  test('the other side\'s link and the status page carry no walled field and the status page no person\'s name', async () => {
    const h = await startHati();
    try {
      const W = await seedWorkspace(h, { contracts: [walledContract()] });
      const admin = W.admin;

      /* the payload the browser really builds, through the route every send goes through */
      const s = core();
      const payload = s.buildSharePayload(walledContract(), 'hash', { ...WHO, purpose: 'negotiate' }, { purpose: 'negotiate' });
      const made = await admin.json('/api/shares', { method: 'POST', body: { payload, recipient: { name: 'Ola Nordmann', email: 'ola@nordfrakt.se' }, channel: 'link', purpose: 'negotiate', expiryDays: 14 } });
      assert.ok(made && made.token, `a negotiation link is minted: ${JSON.stringify(made).slice(0, 200)}`);

      const them = h.client('them');
      const got = await them.json('/api/shares/' + made.token);
      const text = JSON.stringify(got);
      const leaked = crossed(text);
      assert.deepEqual(leaked, [], `crossed to the other side: ${leaked.join(', ')}`);
      assert.ok(got && got.payload && got.payload.contract, 'the link answers with the contract');
      assert.deepEqual(unknownKeys(got.payload, PASS_PAYLOAD), [], 'served payload keys not on PASS_PAYLOAD');
      assert.deepEqual(unknownKeys(got.payload.contract, PASS_CONTRACT), [], 'served contract keys not on PASS_CONTRACT');

      /* the status link, from the stored record, read by anyone holding it */
      const st = await admin.json('/api/shares', { method: 'POST', body: { payload: { v: 1, kind: 'hati-share', purpose: 'status', purposeChosen: 'status', org: WHO.org, sharedBy: WHO.sharedBy, at: new Date().toISOString(), contract: { id: 'MK-W1' } }, recipient: { name: 'Ola Nordmann', email: 'ola@nordfrakt.se' }, channel: 'link', purpose: 'status', expiryDays: 14 } });
      assert.ok(st && st.token, `a status link is minted: ${JSON.stringify(st).slice(0, 200)}`);
      const page = await them.raw('/deal/' + st.token);
      assert.equal(page.status, 200, 'the status page opens');
      const leakedPage = crossed(page.text);
      assert.deepEqual(leakedPage, [], `crossed onto the status page: ${leakedPage.join(', ')}`);
      for (const name of ['Wanjiru Kamau', 'Amina Otieno', 'Ola Nordmann']) assert.ok(!page.text.includes(name), `a person's name on the status page: ${name}`);
      assert.ok(page.text.includes('Nordfrakt Logistik AB'), 'the other party is named on the status page');
    } finally { await h.stop(); }
  });
});
