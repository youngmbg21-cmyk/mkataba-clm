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
  /* RE-POINTED 21 Oct 2026 (Part 8, the list head the Legora way): the
     card's head goes (ruling 5) — its count is the All tab's number, its
     title and "late after 7 days" are the All tab's hover, the sort stands
     at the end of the head's chip row; the foot is the head's own, "1–n of
     n" (lhFootHtml) */
  test('3c the head carries what the card\'s head said, its sort and its foot; the waiting cell says "late"', () => {
    const f = fnOf(AP, 'renderApprovalsPage');
    assert.doesNotMatch(f, /ap-card-h|ap-card-n|ap-card-m/, 'no card head of its own');
    assert.match(fnOf(AP, 'apTabs'), /const late=i18tn\('jl_ap_late_after',AP_LATE_DAYS,\{n:AP_LATE_DAYS\}\);/);
    assert.match(fnOf(AP, 'apTabs'), /title:k==='all'\?`\$\{i18t\('ap_wl_title'\)\} \\u00b7 \$\{late\}`:''/);
    assert.match(fnOf(AP, 'apSortHtml'), /regSortIconHtml\(sortOpts,'ap-sort'\)/);
    assert.match(fnOf(AP, 'apHeadRegister'), /right:\(\)=>apSortHtml\(\)/);
    assert.match(f, /lhFootHtml\('approvals',n,n,0,\{ cls:'ap-foot ap-wl-foot' \}\)/);
    /* RE-POINTED 24 Oct 2026 (Round 2, owner's yes): "104 days", red already says late; the word rides the hover */
    assert.match(f, /title="\$\{esc\(i18t\('jl_late'\)\)\}"`:''\}>\$\{esc\(r\.done\?i18t\('ap_pg_approved'\):r\.idle==null\?'—':apWaitingText\(r\.idle\)\)\}/);
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
    /* RE-POINTED 24 Oct 2026 (Round 2): Kind is drawn only where the rows differ (apSameCols) */
    assert.match(f, /\{t:i18t\('reg_col_ref'\),w:72\},\{t:i18t\('reg_col_party'\)\},\.\.\.\(same\.kind\?\[\]:\[\{t:i18t\('ap_wl_kind'\),w:100\}\]\)/);
  });
  test('10b a long name takes a second line, never an ellipsis; the agreement under it keeps its cut', () => {
    assert.match(HTML, /\.ap-table\.ap-ins \.ap-id \.ap-name\{white-space:normal;overflow-wrap:anywhere;\}/);
    assert.doesNotMatch(HTML, /\.ap-table\.ap-ins \.ap-name,\.ap-table\.ap-ins \.ap-sub\{white-space:nowrap/);
  });
});

/* ═══ PART 8 (21 Oct 2026): THE LIST HEAD, THE LEGORA WAY ═══════════════════
   The owner picked "The Legora way" for every list page and answered "tabs
   only" for this one: ONE plain table, the group rows gone, the tabs doing
   their job.
   (11) THE TABS ARE THE GROUPS, COUNTED: All · Yours to answer · Waiting on
        others, each the rows its press shows with every other cut held
        (the words, the filters); All is always drawn.
   (12) THE FILTERS ARE READ OFF THE ROWS: Kind, Stream, Whose turn; a value
        that leaves nothing is never offered, and a filter whose rows all
        carry one value is not offered until it is chosen.
   (13) A REFRESH LANDS AT THE SAME SPOT: the tab, filters, words and sort
        go into the place store and come back, checked.
   (14) LAND ON IT: a door naming one row puts the list at rest only where
        the row is hidden; a row the list does not hold changes nothing.
   (15) THE HEAD'S SPEC: the page's own tab attribute, the noun, words that
        repaint the rows only, the sort at the chip row's end, the place pair.
   AT THE PARENT (c70f4b09) every claim FAILS: none of these names exists. */
describe('f807 (11–15) the list head, the Legora way', () => {
  const region = (() => { const a = AP.indexOf('const AP_VIEWS='), b = AP.indexOf("/* the seat a row's panel is drawn for");
    return a >= 0 && b > a ? AP.slice(a, b) : ''; })();
  /* the rows as apWorkRows gives them (a signature the reader signs, an
     approval they answer, one a colleague answers), with the words
     apTurnText would say for each (stubbed: r.turn) — matched by their
     CODE (apTurnKey), the words the label only (12c) */
  const A = { c: { id: 'A', counterparty: 'Helio AB', name: 'Power deal', folder: 'f1' }, type: 'signature', kind: 'sign', turn: 'You sign' };
  const B = { c: { id: 'B', counterparty: 'Kustfrakt AB', name: 'Freight', folder: 'f1' }, type: 'approval', mine: true, turn: 'You' };
  const C = { c: { id: 'C', counterparty: 'Stratos Ltd', name: 'Support', folder: 'f2' }, type: 'approval', turn: 'Sara', st: { next: { approver: { kind: 'member', id: 'u-s' } } } };
  const mk = extra => {
    const seen = { painted: 0, listed: 0, box: [] };
    const ctx = Object.assign({ i18t: t, i18tn: tn, esc, Promise, String, Object, Array, Set, Map, Number,
      apWorkRows: () => ({ yours: [A, B], others: [C], rows: [A, B, C] }), apTurnText: r => r.turn, apWhyLines: r => [r.why || '', ''],
      contractRef: c => c.id, AP_LATE_DAYS: 7, AP_SORTS: ['wait', 'value', 'ref'], AP_SORT_WORDS: { wait: 'jl_ap_sort_wait', value: 'jl_ap_sort_value', ref: 'jl_ap_sort_ref' },
      FOLDERS: { f1: { name: 'Procurement' }, f2: { name: 'Sales' } }, STREAM_SHORT: {},
      lhRegister: (seat, spec) => { ctx.__spec = spec; return spec; }, lhBoxSet: (s, w) => seen.box.push([s, w]),
      renderApprovalsPage: () => { seen.painted++; }, apPaintList: () => { seen.listed++; }, placeSave: () => {}, regSortIconHtml: (o, id) => `<label><select id="${id}">${o}</select></label>` }, extra || {});
    vm.createContext(ctx);
    vm.runInContext("var _apSort='wait';\n" + region + '\nvar __get=()=>({ view:_apView, f:_apF, q:_apQ, sort:typeof _apSort==="undefined"?null:_apSort });\nvar __set=(v,f,q)=>{ _apView=v; _apF=Object.assign({},AP_F_DEF,f||{}); _apQ=q||""; _apBookMemo=null; };', ctx);
    ctx.__seen = seen;
    return ctx;
  };
  const tabs = ctx => ctx.apTabs().map(x => `${x.k} ${x.n}`).join(' · ');
  test('11a the three tabs, counted from the one reading; All carries the old card head\'s words on its hover', () => {
    assert.ok(region, 'the region is there');
    const ctx = mk();
    assert.equal(tabs(ctx), 'all 3 · yours 2 · others 1');
    const all = ctx.apTabs()[0];
    assert.equal(all.keep, true, 'All is always drawn');
    assert.equal(all.title, 'What waits for a yes or a signature · late after 7 days');
  });
  test('11b words and filters cut every tab, the tab swapped alone', () => {
    const ctx = mk();
    ctx.__set('yours', {}, 'stratos');
    assert.equal(tabs(ctx), 'all 1 · yours 0 · others 1', 'the words find the party');
    ctx.__set('all', { kind: 'approval' }, '');
    assert.equal(tabs(ctx), 'all 2 · yours 1 · others 1');
    assert.deepEqual(ctx.apListNow().rows.map(r => r.c.id), ['B', 'C'], 'the rows on screen, yours first');
  });
  test('12a the filters, read off the rows, counted with every other cut held', () => {
    const ctx = mk();
    const F = Object.fromEntries(ctx.apFilters().map(f => [f.k, f.opts.map(o => `${o[1]} (${o[2]})`).join(', ')]));
    assert.equal(F.kind, 'Signature (1), Approval (2)');
    assert.equal(F.stream, 'Procurement (2), Sales (1)');
    assert.equal(F.turn, 'You sign (1), You (1), Sara (1)');
  });
  test('12b a filter whose rows all carry one value is not offered; once chosen it keeps its values', () => {
    const ctx = mk();
    ctx.__set('yours', {}, '');
    const F = Object.fromEntries(ctx.apFilters().map(f => [f.k, f.opts.length]));
    assert.equal(F.stream, 0, 'both of yours are in one stream: choosing it would narrow nothing');
    assert.equal(F.kind, 2);
    ctx.__set('yours', { stream: 'f1' }, '');
    assert.equal(ctx.apFilters().find(f => f.k === 'stream').opts.length, 1, 'the chosen value stays to choose again');
    assert.equal(ctx.apFilters().find(f => f.k === 'stream').cur, 'f1');
  });
  test('12c Whose turn is matched by a CODE, its words only the label: a language switch or the next day keeps the choice', () => {
    const ctx = mk();
    assert.equal(ctx.apFilters().find(f => f.k === 'turn').opts.map(o => o[0]).join(' | '), 'you-sign | you | waits:m:u-s', 'stable codes, never the translated words');
    ctx.__set('all', { turn: 'waits:m:u-s' }, '');
    assert.equal(ctx.apListNow().rows.map(r => r.c.id).join(), 'C');
    /* the words change (Svenska; "back Friday" turning into another day): the choice still holds its rows, named in the new words */
    ctx.apTurnText = r => r.turn === 'Sara' ? 'Sara (sv)' : r.turn + ' (sv)';
    assert.equal(ctx.apListNow().rows.map(r => r.c.id).join(), 'C', 'the kept choice still matches after the words changed');
    const turn = ctx.apFilters().find(f => f.k === 'turn');
    assert.equal(turn.cur, 'waits:m:u-s');
    assert.ok(turn.opts.some(o => o[0] === 'waits:m:u-s' && o[1] === 'Sara (sv)'), 'its label is said in the words of now');
    /* a kept value no row of the book carries goes back to rest at the page's paint */
    assert.match(code(fnOf(AP, 'renderApprovalsPage')), /if\(_apF\.turn!=='all'&&L\.W\.rows\.length&&!L\.turnWords\.has\(_apF\.turn\)\)\{ _apF\.turn='all'; L=apListNow\(\); \}/);
  });
  test('13 the place keeps the tab, the filters, the words and the sort — checked on the way back', () => {
    const ctx = mk();
    ctx.__set('others', { turn: 'waits:m:u-s' }, 'stra');
    const p = JSON.parse(JSON.stringify(ctx.apPlace()));
    assert.deepEqual(p, { view: 'others', f: { kind: 'all', stream: 'all', turn: 'waits:m:u-s' }, q: 'stra', sort: 'wait' });
    ctx.__set('all', {}, '');
    ctx.apPlacePut(Object.assign({}, p, { sort: 'value' }));
    assert.deepEqual(JSON.parse(JSON.stringify(ctx.__get())), { view: 'others', f: { kind: 'all', stream: 'all', turn: 'waits:m:u-s' }, q: 'stra', sort: 'value' });
    ctx.apPlacePut({ view: 'nope', f: { evil: 'x' }, q: null, sort: 'nope' });
    assert.deepEqual(JSON.parse(JSON.stringify(ctx.__get())), { view: 'all', f: { kind: 'all', stream: 'all', turn: 'all' }, q: '', sort: 'wait' });
  });
  test('14 LAND ON IT: only a hidden row puts the list at rest; a row not on the list changes nothing', () => {
    const ctx = mk();
    ctx.__set('others', {}, '');
    assert.equal(ctx.apShowRow('C'), false, 'shown already: the reader\'s tab stays');
    assert.equal(ctx.__get().view, 'others');
    assert.equal(ctx.apShowRow('ZZ'), false, 'not on the list');
    assert.equal(ctx.__get().view, 'others');
    assert.equal(ctx.apShowRow('A'), true, 'hidden by the tab');
    assert.deepEqual(JSON.parse(JSON.stringify(ctx.__get())).view, 'all');
    assert.deepEqual(ctx.__seen.box.pop(), ['approvals', ''], 'the box shows the list at rest');
    for (const [file, src] of [['directory.js', read('js/views/directory.js')], ['paperdesk.js', read('js/paperdesk.js')], ['settings.js', read('js/views/settings.js')]])
      assert.match(src, /apShowRow\((c\.id|id)\)/, file + ' lands on its row through it');
  });
  test('15 the head\'s spec: the page\'s own tab attribute, words repaint the rows only, the sort at the end, the place pair', () => {
    const ctx = mk();
    const spec = ctx.apHeadRegister();
    assert.equal(spec.tabAttr, 'data-ap-view');
    assert.equal(spec.noun, 'approvals');
    spec.setQuery('helio');
    assert.equal(ctx.__get().q, 'helio');
    assert.deepEqual([ctx.__seen.listed, ctx.__seen.painted], [1, 0], 'the rows only, never the head');
    spec.tab('yours');
    assert.equal(ctx.__get().view, 'yours');
    spec.apply({ kind: 'signature' });
    assert.equal(ctx.__get().f.kind, 'signature');
    assert.match(spec.right(), /id="ap-sort"/);
    assert.match(APP, /approvals:\['apPlace','apPlacePut'\]/);
    assert.doesNotMatch(code(fnOf(AP, 'renderApprovalsPage')), /getElementById\('ap-sort'\)\?\.addEventListener/, 'the sort\'s own listener went: one delegated listener');
    assert.match(AP, /window\._apSortWired=true;/);
  });
});
