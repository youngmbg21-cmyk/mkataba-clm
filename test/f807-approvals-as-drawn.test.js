'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f807 — APPROVALS & SIGNING, "ONE WORKLIST" AS DRAWN (round 15 of the
   redesign, the owner's pick, and their "build all the gaps", 18 Oct 2026)

   (1) A STAND-IN'S ANSWER SAYS WHOM IT IS FOR: "You · for Jonas" in Whose
       turn, "for Jonas" beside the party in Jambo's panel, "Your answer, for
       Jonas", "Approve for Jonas · Refuse…", and the sentence saying how it is
       recorded — When you're away's own readings (approverForOf, awayForOf,
       awayByLabel), never a right of their own.
   (2) THE PANEL'S FACTS AS ROWS: Why it waits · Asked by (who · when) · Value
       · Since last look, the last read from the approval's OWN stamp (the
       question's, f808; a named approval's) against the record now.
   (3) THE LIST AS DRAWN: Why it waits in two lines, "9 days · late", a
       colleague's signature on the reader's own contract under Waiting on
       others ("Jonas signs · back Friday"), the card's head ("· 4 · late after
       7 days" and its sort), "Showing 4 of 4", the counts on the title's line
       and Approval rules beside them.
   (4) NOTHING CHOSEN: the page said in Jambo's words from the list's own
       counts, whom the reader stands in for, and the page's own doors.

   AT THE PARENT (8dc306a) every claim FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const AP = read('js/views/approvalsview.js');
const APP = read('js/app.js');
const APPROVALS = read('js/approvals.js');
const I18N = read('js/i18n.js');
const fnOf = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && v[k] != null ? v[k] : ''));
const t = (k, v) => fill(BOOKS.en[k] != null ? BOOKS.en[k] : k, v);
const tn = (k, n, v) => t(k + (n === 1 ? '_one' : '_other'), Object.assign({ n }, v || {}));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const stampOf = new Function(/function approvalStamp\(c\)\{[\s\S]*?\n\}/.exec(APPROVALS)[0] + '; return approvalStamp;')();
const stage = (names, extra) => { const ctx = Object.assign({ i18t: t, i18tn: tn, esc, window: {}, Date }, extra || {});
  vm.createContext(ctx); vm.runInContext(names.map(n => fnOf(AP, n)).concat(/const AP_SINCE_WORDS=\{[^}]*\};/.exec(AP)[0].replace('const', 'var')).join('\n'), ctx); return ctx; };
const JONAS = { id: 'u-j', name: 'Jonas Berg' };

describe('f807 (1) a stand-in\'s answer says whom it is for', () => {
  test('1a whom: the rule\'s member while the reader stands in for them; nobody where they answer as themself', () => {
    const me = { id: 'u-m', name: 'Maria Lindgren' };
    const ctx = stage(['apForWho'], { currentUser: () => me,
      approvalDecidableNow: () => ({ kind: 'rule', step: { approver: { kind: 'member', id: 'u-j' } } }),
      approverForOf: (a, u) => (u.id === 'u-m' && a.id === 'u-j') ? JONAS : null });
    assert.equal(ctx.apForWho({ type: 'approval', mine: true, c: {} }), JONAS);
    assert.equal(ctx.apForWho({ type: 'approval', mine: false, c: {} }), null, 'not the reader\'s to answer');
    assert.equal(ctx.apForWho({ type: 'signature', mine: true, c: {} }), null, 'never a signature');
    assert.match(fnOf(AP, 'apForWho'), /saMayDecide\(req, me\)==='deputy'&&typeof awayForOf==='function'/, 'a named approval: only as their deputy');
    assert.match(APPROVALS, /approverLabelOf,approverForOf,userCanApprove,/, 'the stand-in reading is published for the page');
  });
  test('1b Whose turn: "You for Jonas"; "Jonas signs · back <day>"; the rest as before', () => {
    const ctx = stage(['apTurnText', 'apDayAfter'], { apForWho: r => r.fw || null, jlAwayOf: id => id === 'u-j' ? { to: '2026-10-22' } : null, jlDayWord: d => 'D' + d });
    assert.equal(ctx.apTurnText({ type: 'approval', mine: true, fw: JONAS }), 'You for Jonas');
    assert.equal(ctx.apTurnText({ type: 'approval', mine: true }), 'You');
    assert.equal(ctx.apTurnText({ type: 'signature', kind: 'other', signer: { name: 'Jonas Berg', memberId: 'u-j' } }), 'Jonas signs · back D2026-10-23', 'back the day after the last day away');
    assert.equal(ctx.apTurnText({ type: 'signature', kind: 'other', signer: { name: 'Sara Nyström', memberId: 'u-s' } }), 'Sara signs');
    assert.equal(ctx.apTurnText({ type: 'signature', kind: 'sign' }), 'You sign');
  });
  test('1c the answer\'s buttons say it: "Approve for Jonas · Refuse… · Open Before you sign", drawn in "Your answer"', () => {
    const f = fnOf(AP, 'apInsActs');
    assert.match(f, /label:fw\?i18t\('jl_ap_approve_for',\{who:first\}\):i18t\('ap_pg_approve'\)/);
    assert.match(f, /\{ k:'refuse', inBody:true, label:i18t\('jl_ap_refuse'\)/);
    assert.match(f, /\{ k:'gate', inBody:true, label:i18t\('ap_pg_open_signing'\)/);
    assert.equal(t('jl_ap_approve_for', { who: 'Jonas' }), 'Approve for Jonas');
    assert.equal(t('jl_ap_refuse'), 'Refuse…');
    assert.equal(t('jl_ap_answer_for', { who: 'Jonas' }), 'Your answer, for Jonas');
  });
  test('1d the recorded-as sentence is When you\'re away\'s own words for the record', () => {
    assert.match(fnOf(AP, 'apLeadJlHtml'), /const as=\(typeof awayByLabel==='function'\)\?awayByLabel\(me\.name\|\|'', fw\)/);
    assert.equal(t('jl_ap_recorded', { as: 'Maria Lindgren for Jonas Berg', who: 'Jonas', day: 'Friday' }),
      'It is recorded as “Maria Lindgren for Jonas Berg”. Jonas is away until Friday; you answer their approvals and reviews, never their signature.');
  });
  test('1e the decision is still the room\'s own (approvalDecideAsk); this page writes nothing', () => {
    const code = AP.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.match(fnOf(AP, 'apInsActs'), /label:fw\?i18t\('jl_ap_approve_for',\{who:first\}\):i18t\('ap_pg_approve'\)[^\n]*run:c=>apDecide\(c\.id,'approved'\)/, 'the panel\'s "Approve for Jonas" presses the page\'s one decision');
    assert.match(fnOf(AP, 'apDecide'), /const ok=await approvalDecideAsk\(c, verdict\);/, 'which is the room\'s own');
    for (const bad of ['approveContract(', 'rejectApprovalStep(', 'signDocument(', 'askAnswer(', 'persist('])
      assert.ok(!code.includes(bad), bad + ' is never called from the page');
  });
});

describe('f807 (2) the panel\'s facts as rows, "Since last look" from the approval\'s own stamp', () => {
  const C = { id: 'MK-1', redlineText: 'Clause 1. The supplier delivers.', value: 8100000, fields: { term: '24 months' }, party: 'Lindqvist', counterparty: 'Helio' };
  const since = (c, ask) => stage(['apSinceLook'], { apAskOf: () => ask, approvalStamp: stampOf, apSaWaiting: () => null }).apSinceLook({ type: 'approval', c, st: { next: { ruleId: 'r1' } } });
  test('2a nothing moved since it was asked → "Nothing changed in the wording"', () => {
    assert.equal(since(C, { stamp: stampOf(C) }), 'same');
    assert.equal(t('jl_ap_since_same'), 'Nothing changed in the wording');
  });
  test('2b the wording moved / the value moved / a filled term moved', () => {
    assert.equal(since(Object.assign({}, C, { redlineText: C.redlineText + ' And invoices.' }), { stamp: stampOf(C) }), 'wording');
    assert.equal(since(Object.assign({}, C, { value: 9000000 }), { stamp: stampOf(C) }), 'value');
    assert.equal(since(Object.assign({}, C, { fields: { term: '36 months' } }), { stamp: stampOf(C) }), 'terms');
    assert.equal(since(Object.assign({}, C, { fields: { term: '24 months', more: 'x' } }), { stamp: stampOf(C) }), 'same', 'a blank filled since is not a change');
  });
  test('2c a question opened before it carried a stamp says so — never guessed', () => {
    assert.equal(since(C, { stamp: null }), 'unknown');
    assert.equal(since(C, null), 'unknown');
    assert.equal(t('jl_ap_since_unknown'), 'Not known — asked before HaTi kept what it covers');
  });
  test('2d a masked value (a reader who may not see money) is not read as a moved value', () => {
    const st = Object.assign(stampOf(C), { value: '' });
    assert.equal(since(C, { stamp: st }), 'same');
  });
  test('2e the rows as drawn: Why it waits · Asked by · Value · Since last look', () => {
    const f = fnOf(AP, 'apLeadJlHtml');
    const keys = [...f.matchAll(/\{ k:'(why|asked|value|waits|since)'/g)].map(m => m[1]);
    assert.equal(keys.slice(0, 5).join(','), 'why,asked,value,waits,since');
    const ctx = stage(['apAskedByText'], { i18tn: tn });
    assert.equal(ctx.apAskedByText({ who: 'Erik Ström', idle: 3 }), 'Erik Ström · 3 days ago');
  });
});

describe('f807 (3) the list as drawn', () => {
  test('3a why it waits in two lines', () => {
    const ctx = stage(['apWhyLines', 'apWaitsShort', 'apApproverMe'], { contractOwnerName: () => 'Erik Ström', approvalState: () => ({ chain: [] }), regDotDate: d => d });
    /* RE-POINTED 18 Oct 2026 (the checker against round 15: "Sara approves",
       the first name — as "Sara signs"); a role is said whole */
    const member = { next: { approver: { kind: 'member', id: 'u-s' } } };
    assert.equal(ctx.apWhyLines({ type: 'approval', rule: 'Over SEK 2 M', waitsOn: 'Sara Nyström', st: member }).join(' / '), 'Over SEK 2 M / Sara approves');
    assert.equal(ctx.apWhyLines({ type: 'approval', rule: 'Over SEK 2 M', waitsOn: 'An admin', st: { next: { approver: { kind: 'role', role: 'admin' } } } }).join(' / '), 'Over SEK 2 M / An admin approves');
    assert.equal(ctx.apWhyLines({ type: 'approval', rule: 'Jonas Berg’s yes before signing', ruleSub: 'x', c: {} }).join(' / '), 'Jonas Berg’s yes before signing / Erik’s contracts need it');
    assert.equal(ctx.apWhyLines({ type: 'signature', kind: 'sign', n: 0, c: {} }).join(' / '), 'Ready to sign / nothing in the way');
    const ctx2 = stage(['apWhyLines'], { approvalState: () => ({ chain: [{ status: 'approved', by: 'Erik Ström', at: '2026-10-14T10:00:00Z' }] }), regDotDate: () => '14 Oct' });
    assert.equal(ctx2.apWhyLines({ type: 'signature', kind: 'other', n: 0, c: {} }).join(' / '), 'Erik approved 14 Oct / ready to sign');
  });
  test('3b a colleague\'s signature on the reader\'s own contract waits on others — never on the door\'s count', () => {
    const me = { id: 'u-m', email: 'm@x' };
    const own = { id: 'C1', status: 'Under Review', owner: { id: 'u-m' } };
    const theirs = { id: 'C2', status: 'Under Review', owner: { id: 'u-x' } };
    const ctx = stage(['apOtherSignRows', 'apSignIdle'], { currentUser: () => me, state: { contracts: [own, theirs] },
      nextSigner: () => ({ party: 'internal', memberId: 'u-j', name: 'Jonas Berg' }), approvalState: () => ({ required: false, chain: [] }),
      signReadiness: () => ({ n: 0 }), deskLead: () => null });
    const rows = ctx.apOtherSignRows();
    assert.equal(rows.map(r => r.c.id).join(','), 'C1', 'only the reader\'s own');
    assert.equal(rows[0].kind, 'other');
    assert.match(fnOf(AP, 'approvalsDoorCount'), /apApprovalRows\(\)\.filter\(r=>r\.mine\)\.length \+ apSignatureRows\(\)\.length/, 'the door counts what is yours, as before');
    assert.match(fnOf(AP, 'apWorkRows'), /apOtherSignRows\(\)\.filter\(r=>!taken\.has\(r\.c\.id\)\)/);
  });
  test('3c the card\'s head, its sort and its foot; the waiting cell says "late"', () => {
    const f = fnOf(AP, 'renderApprovalsPage');
    assert.match(f, /<span class="ap-card-n is-pill">\$\{n\.toLocaleString\(loc\)\}<\/span> <span class="ap-card-m">\$\{esc\(i18tn\('jl_ap_late_after',AP_LATE_DAYS,\{n:AP_LATE_DAYS\}\)\)\}<\/span>/);
    assert.match(f, /regSortIconHtml\(sortOpts,'ap-sort'\)/);
    assert.match(f, /i18t\('jl_ap_showing',\{n:n\.toLocaleString\(loc\),total:n\.toLocaleString\(loc\)\}\)/);
    assert.match(f, /apWaitingText\(r\.idle\)\+\(apLate\(r\)\?' \\u00b7 '\+i18t\('jl_late'\):''\)/);
    assert.equal(tn('jl_ap_late_after', 7, { n: 7 }), 'late after 7 days');
    const ctx = stage(['apSortRows'], { _apSort: 'wait', AP_SORTS: ['wait', 'value', 'ref'] });
    vm.runInContext("var _apSort='wait', AP_SORTS=['wait','value','ref'];", ctx);
    const rows = [{ c: { id: 'a' }, idle: 1 }, { c: { id: 'b' }, idle: 9 }, { c: { id: 'c' }, idle: 3 }];
    assert.equal(ctx.apSortRows(rows).map(r => r.c.id).join(','), 'b,c,a', 'the longest wait first, as drawn');
  });
  test('3d the counts on the title\'s line, Approval rules beside them', () => {
    assert.match(APP, /approvals:'apPaintHead'/);
    const f = fnOf(AP, 'apPaintHead');
    assert.match(f, /document\.getElementById\('page-head-facts'\)/);
    assert.match(f, /data-ap-rules/);
    assert.doesNotMatch(fnOf(AP, 'renderApprovalsPage'), /sap-band ap-band/, 'no band of its own');
  });
});

describe('f807 (4) nothing chosen: the page in Jambo\'s words', () => {
  test('4a counted from the list: how many, whose, the late ones, whom the reader stands in for', () => {
    const W = { yours: [{ c: { id: 'A' }, idle: 3 }], others: [{ c: { id: 'B' }, idle: 9 }, { c: { id: 'C' }, idle: 1 }, { c: { id: 'D' }, idle: 4 }] };
    W.rows = W.yours.concat(W.others);
    const ctx = stage(['apSay', 'apLate'], { apWorkRows: () => W, AP_LATE_DAYS: 7, todayISO: () => '2026-10-19',
      state: { away: { covering: [{ userId: 'u-j', userName: 'Jonas Berg', from: '2026-10-16', to: '2026-10-23' }] } }, jlDayWord: () => 'Friday' });
    vm.runInContext('var AP_LATE_DAYS=7;', ctx);
    const say = ctx.apSay();
    assert.equal(say.lines[0].replace(/<[^>]+>/g, ''), '4 wait for a yes or a signature: 1 yours to answer and 3 waiting on others.');
    assert.equal(say.lines[1], '1 is late — past 7 days.');
    assert.equal(say.lines[2], 'You answer Jonas’s approvals and reviews until Friday.');
    assert.equal(say.chips[0].label, 'the first that is yours');
  });
  test('4b every word in both books', () => {
    const keys = [...new Set([...AP.matchAll(/i18tn?\('(jl_[a-z_]+)'/g)].map(m => m[1]))];
    const plural = new Set([...AP.matchAll(/i18tn\('(jl_[a-z_]+)'/g)].map(m => m[1]));
    assert.ok(keys.length > 15);
    for (const k of keys) for (const lang of ['en', 'sv'])
      assert.ok(plural.has(k) ? (BOOKS[lang][k + '_one'] && BOOKS[lang][k + '_other']) : BOOKS[lang][k] != null, `${k} ${lang}`);
  });
});

/* ═══ PASS 3 (18 Oct 2026), the checker against round 15 ═══════════════════
   (5) THE APPROVAL'S PANEL DRAWS NO DOORS: Ref · name, the party with "for
       Jonas", then straight into Why it waits — the picked drawing over the
       12 Oct "two doors on every list panel" for the one panel it draws; "Open
       Before you sign" is its way to the paper. A signature's panel keeps the
       two doors. Whose turn and Why it waits name a colleague by the first
       name ("Sara approves", "Sara"), a role whole.
   AT THE PARENT (8dc306a) and before this pass (14b2f8a) these FAIL. */
describe('f807 (5) the Approval panel as drawn: no doors; first names', () => {
  const doors = [{ k: 'door-nego', door: true }, { k: 'door-ws', door: true }];
  const mk = extra => stage(['apInsActs', 'apSignAway'], Object.assign({ insDoorActs: () => doors, apMayUndo: () => false, apMayDecide: () => null,
    apForWho: () => null, apOpenSigning(){}, apDecide(){}, apUndo(){} }, extra || {}));
  const keys = (ctx, tab, r) => ctx.apInsActs(tab, r).map(a => a.k).join(',');
  test('5a an approval waiting on others: its own verb only, no Negotiation · Workspace', () => {
    assert.equal(keys(mk(), 'approvals', { c: {}, mine: false }), 'gate');
  });
  test('5b an approval the reader answers: Approve · Refuse… · Open Before you sign, and nothing after', () => {
    assert.equal(keys(mk({ apMayDecide: () => ({ kind: 'rule' }) }), 'approvals', { c: {}, mine: true }), 'approve,refuse,gate');
  });
  test('5c an approval just given: Undo · Open Before you sign — still no doors', () => {
    assert.equal(keys(mk({ apMayUndo: () => true }), 'approvals', { c: {}, mine: true, done: { ruleId: 'r1' } }), 'undo,gate');
  });
  test('5d [control] a signature\'s panel keeps the two doors (not drawn otherwise)', () => {
    assert.equal(keys(mk(), 'signatures', { c: {}, kind: 'sign' }), 'sign,door-nego,door-ws');
  });
  test('5e Whose turn and the panel\'s Why name a colleague by the first name, a role whole', () => {
    const ctx = stage(['apTurnText', 'apWaitsShort', 'apWhySentence', 'apApproverMe'], { contractOwnerName: () => '' });
    const member = { next: { approver: { kind: 'member', id: 'u-s' } } };
    assert.equal(ctx.apTurnText({ type: 'approval', waitsOn: 'Sara Nyström', st: member }), 'Sara');
    assert.equal(ctx.apWhySentence({ rule: 'Over SEK 2 M', waitsOn: 'Sara Nyström', st: member }), 'Over SEK 2 M: Sara approves before anyone signs');
    assert.equal(ctx.apTurnText({ type: 'approval', waitsOn: 'The legal approver', st: { next: { approver: { kind: 'role', role: 'legal' } } } }), 'The legal approver');
  });
});

/* ═══ PASS 4 (18 Oct 2026, evening), the checker's second pass ═════════════
   (6) EVERY SIGNATURE ROW SAYS HOW LONG IT HAS WAITED ("Sara signs · 1 day",
       "4 days"): since the last yes or signature, else since the last thing the
       trail holds (_lastAuditAt on the light list) — the reader's own too;
       nothing on the record is "—", never guessed.
   (7) A SIGNER WHO IS AWAY: Jambo says the rule (only they sign; a stand-in
       never signs) and the proper step if it cannot wait — another signer named
       on Before you sign, before anyone has signed — and his sentence carries
       that door (rule 7b); once someone has signed, it says the signers stay.
   (8) THE READER IS "YOU": "You approve", "Over 10 M: you approve before
       anyone signs", never their own name in the third person.
   (9) APPROVAL RULES IS EVERYONE'S DOOR (round 15 draws it for an Editor): an
       admin goes to the rules; anyone else hears them from Jambo, each rule and
       who gives its yes, with the rule's own door, Ask an admin.
   (10) THE PARTY'S NAME READS WHOLE at 1366 beside the panel: Ref gives it
       room and a long name takes a second line; Kind keeps its pill whole.
   AT THE PARENT (8dc306a) every claim FAILS. */
describe('f807 (6) every signature row says how long it has waited', () => {
  const DAY = 864e5;
  const ago = n => new Date(Date.now() - n * DAY - 3600e3).toISOString();
  const ctx = () => stage(['apSignIdle'], { approvalState: () => ({ chain: [] }) });
  test('6a since the last yes or signature on the record', () => {
    const c = { signatures: [{ at: ago(4) }] };
    assert.equal(ctx().apSignIdle(c, { chain: [{ status: 'approved', at: ago(9) }] }), 4);
  });
  test('6b else since the last thing the trail holds — the light list\'s _lastAuditAt, or the record\'s own trail', () => {
    assert.equal(ctx().apSignIdle({ _lastAuditAt: ago(1) }, { chain: [] }), 1);
    assert.equal(ctx().apSignIdle({ audit: [{ at: ago(30) }, { at: ago(2) }] }, { chain: [] }), 2);
  });
  test('6c nothing on the record is said as none, never guessed', () => {
    assert.equal(ctx().apSignIdle({}, { chain: [] }), null);
  });
  test('6d every signature row reads it — the reader\'s own and a ready one too — and the cell draws it', () => {
    const f = fnOf(AP, 'apSignatureRows');
    assert.match(f, /kind:'sign', n:x\.n, idle:apSignIdle\(x\.c\)/);
    assert.match(f, /kind:'ready', by:r\.sig&&r\.sig\.by, idle:apSignIdle\(r\.c\)/);
    assert.match(fnOf(AP, 'apOtherSignRows'), /idle:apSignIdle\(c, st\)/);
    assert.match(fnOf(AP, 'renderApprovalsPage'), /r\.done\?i18t\('ap_pg_approved'\):r\.idle==null\?'—':apWaitingText\(r\.idle\)/);
    assert.doesNotMatch(fnOf(AP, 'renderApprovalsPage'), /r\.type==='signature'&&r\.kind!=='other'/, 'no signature row is blanked by its kind');
  });
});
describe('f807 (7) a signer who is away: the rule, the proper step, its door', () => {
  const r = { kind: 'other', c: { id: 'C' }, signer: { name: 'Jonas Berg', memberId: 'u-j' } };
  const mk = extra => stage(['apSignRuleHtml', 'apSignAway', 'apDayAfter'], Object.assign({
    jlAwayOf: id => id === 'u-j' ? { to: '2026-10-22' } : null, jlDayWord: () => 'Friday', signingLocked: () => false,
    insActBtnHtml: a => `<button data-ins-act="${a.k}">${a.label}</button>` }, extra || {}));
  const text = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  test('7a before anyone has signed: only Jonas signs; name another signer on Before you sign — and that door', () => {
    const h = mk().apSignRuleHtml(r, [{ k: 'sign', inBody: true, label: 'Open Before you sign' }]);
    assert.equal(text(h), 'If it cannot wait Only Jonas can sign it: a stand-in answers approvals and reviews, never a signature. If it cannot wait until Friday, name another signer on Before you sign, before anyone has signed. Open Before you sign');
    assert.match(h, /data-ins-act="sign"/, 'the sentence carries the door');
  });
  test('7b once someone has signed: the signers stay; it waits for Jonas', () => {
    const h = mk({ signingLocked: () => true }).apSignRuleHtml(r, []);
    assert.match(text(h), /Someone has already signed, so the signers stay as they are; it waits for Jonas, back Friday\./);
  });
  test('7c nobody away, or not a colleague\'s signature: nothing said', () => {
    assert.equal(mk({ jlAwayOf: () => null }).apSignRuleHtml(r, []), '');
    assert.equal(mk().apSignRuleHtml(Object.assign({}, r, { kind: 'sign' }), []), '');
  });
  test('7d the door rides the sentence, not the head; the panel draws it', () => {
    assert.match(fnOf(AP, 'apInsActs'), /if\(tab!=='approvals'&&apSignAway\(r\)\) lead\.inBody=true;/);
    assert.match(fnOf(AP, 'apLeadJlHtml'), /\+apSignRuleHtml\(r, acts\)\+/);
    for (const k of ['jl_ap_sign_rule_h', 'jl_ap_sign_rule', 'jl_ap_sign_rule_shut']) for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
describe('f807 (8) the reader is "You"', () => {
  const me = { id: 'u-j', name: 'Jonas Berg' };
  const ctx = () => stage(['apWhyLines', 'apWaitsShort', 'apApproverMe', 'apWhySentence'], { currentUser: () => me, contractOwnerName: () => 'Erik Ström',
    approvalState: () => ({ chain: [] }), apSaWaiting: () => ({ req: { approverId: 'u-j', approverName: 'Jonas Berg' } }) });
  const mine = { next: { approver: { kind: 'member', id: 'u-j' } } };
  test('8a the list: "You approve"; the panel: "Over 10 M: you approve before anyone signs"', () => {
    const c = ctx();
    assert.equal(c.apWhyLines({ type: 'approval', rule: 'Over 10 M', waitsOn: 'Jonas Berg', st: mine }).join(' / '), 'Over 10 M / You approve');
    assert.equal(c.apWhySentence({ rule: 'Over 10 M', waitsOn: 'Jonas Berg', st: mine }), 'Over 10 M: you approve before anyone signs');
  });
  test('8b a named approval asked of the reader: "Erik’s contracts need your yes before anyone signs"', () => {
    assert.equal(ctx().apWhySentence({ rule: 'x', ruleSub: 'y', waitsOn: 'Jonas Berg', c: {} }), 'Erik’s contracts need your yes before anyone signs');
  });
  test('8c [control] a colleague is still named', () => {
    assert.equal(ctx().apWhyLines({ type: 'approval', rule: 'Over 5 M', waitsOn: 'Sara Nyström', st: { next: { approver: { kind: 'member', id: 'u-s' } } } }).join(' / '), 'Over 5 M / Sara approves');
  });
});
describe('f807 (9) Approval rules is everyone\'s door', () => {
  test('9a the head draws it for everyone: an admin to the rules, anyone else to Jambo', () => {
    const f = code(fnOf(AP, 'apPaintHead'));
    assert.match(f, /a\.innerHTML=`<button type="button" class="ui-btn ap-rules" data-ap-rules>/);
    assert.match(f, /if\(admin\) openSettingsAt\('platform','approvals'\); else apRulesSay\(\);/);
  });
  test('9b Jambo says each rule and who gives its yes, "you" where it is the reader, with Ask an admin', () => {
    const pushed = [];
    const ctx = stage(['apRulesSay'], { approvalRules: () => [{ name: 'Over 5 M', order: 2, approver: { kind: 'member', id: 'u-s', name: 'Sara Nyström' } },
      { name: 'Over 10 M', order: 1, approver: { kind: 'member', id: 'u-j', name: 'Jonas Berg' } }, { name: 'Foreign law', order: 3, approver: { kind: 'role', role: 'legal' } }],
      currentUser: () => ({ id: 'u-j' }), approverLabelOf: a => a.kind === 'member' ? a.name : 'the legal approver',
      aiRuleDoorHtml: (d, q) => `<button data-ai-rule-door="${d.kind}" data-ai-rule="${d.rule}">Ask an admin</button>`,
      aiPush: (role, m) => pushed.push([role, m.text]), renderAIFeed: () => {}, jlOnScreen: () => ({}), jlToWords: () => true });
    assert.equal(ctx.apRulesSay(), true);
    assert.equal(pushed.length, 1);
    const h = pushed[0][1];
    assert.equal(h.replace(/<[^>]+>/g, '|').replace(/\|+/g, '|'), '|3 rules ask for a yes before anyone signs. An admin sets them:|Over 10 M: you approve before anyone signs|Over 5 M: Sara Nyström approves before anyone signs|Foreign law: the legal approver approves before anyone signs|Ask an admin|');
    assert.match(h, /data-ai-rule-door="ask_admin" data-ai-rule="approvals"/, 'the rule\'s own door (rule 7b)');
  });
  test('9c it spends nothing and changes nothing', () => {
    assert.doesNotMatch(code(fnOf(AP, 'apRulesSay')), /fetch\(|api\(|saveApprovalRules|aiAskWords/);
  });
});
describe('f807 (10) the party\'s name reads whole beside the panel', () => {
  const HTML = read('index.html');
  test('10a Ref gives the party room; Kind keeps its pill whole', () => {
    const f = fnOf(AP, 'renderApprovalsPage');
    assert.match(f, /\{t:i18t\('reg_col_ref'\),w:72\},\{t:i18t\('reg_col_party'\)\},\{t:i18t\('ap_wl_kind'\),w:100\}/);
  });
  test('10b a long name takes a second line, never an ellipsis; the agreement under it keeps its cut', () => {
    assert.match(HTML, /\.ap-table\.ap-ins \.ap-id \.ap-name\{white-space:normal;overflow-wrap:anywhere;\}/);
    assert.doesNotMatch(HTML, /\.ap-table\.ap-ins \.ap-name,\.ap-table\.ap-ins \.ap-sub\{white-space:nowrap/);
  });
});
