'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f748 — "<ref> AT A GLANCE" AND THE CHIPS, AS DRAWN (rounds 3 and 6 of the
   redesign; the owner's "build all the gaps", 18 Oct 2026)
   (1) Their round leads the glance: "<party> sent N redlines <when>." ·
       "Your move." · Redlines (the redline row's own door, its shut reason
       kept); then one row per ask that waits on us — "Clause 7: they ask for
       100% of the fees, up from 50%." · their ask · Go to it (PASS 2, the
       checker's "the word 'days' is lost": a number says what it is OF — the
       words after it on the paper, to a stop — and which way it moved) — said
       from the ask's OWN stored ops, widened to whole words, never a sentence
       about what it means; any other change quoted as before; past
       PD_GL_ASKS_MAX the rest are said in one row (a cap is a fact). Their
       asks are read RAW (negoNeedsYouIds), never through a reading that
       starts a negotiation.
   (2) "Nobody has been named to sign yet." says "Needed before signing";
       "Risks not read yet" · "Reading is free: HaTi's own rules, no Jambo
       call" · Read it (PASS 3, the owner's answer (6) of 18 Oct 2026: the read
       is FREE — the rules scan, runScanFor — reversing pass 2's deep read);
       offered only while signing is ahead, the scan has not run (c.scan), and
       this person may act on the wording (riskMayAct, canEdit).
   PASS 3, (1) again: a number of days in a payment clause is "days to pay",
       in a termination clause "days' notice" (PD_GL_DAYS_FOR, read off the
       clause's own heading by clauseKind) — "Clause 11: they ask for 60 days
       to pay, up from 30." as drawn.
   (3) The stage pill carries its round, as the paper's line does.
   (4) Go to it Redlines Home's paper and brings the clause up (pdGlGoTo →
       igPaperGoClause); Read it runs the deep read and opens the Clauses tab,
       where the reading is drawn as it comes.
   (5) The chips lead with what is owed (caOwedSteps): the checklist's lead
       (since Chambers, 20 Oct 2026, every chip is an underlined link, the
       owed lead at the strong weight),
       then "answer the redlines" while their asks wait, then "name a
       signer" while nobody is named — never also "redline" or "sign" — and
       four of them (CA_NEXT_MAX), as drawn; "answer the redlines" opens the
       Redlines face, "name a signer" the signing route.
   (6) Reading writes nothing; both books.
   AT THE PARENT (8dc306a) every test here FAILS but the four guards (1e,
   2c, 5c, 6a: what is NOT offered, and reading writes nothing), which hold
   there too: none of these rows, readings or chips exist, and CA_NEXT_MAX
   is 3.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js');
const CA = R('js/copilotacts.js');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v && k in v) ? v[k] : m);
/* the one reading of what a clause is, from its heading (js/clausemodel.js), run as it stands */
const CM = R('js/clausemodel.js');
const CLAUSE_KIND = CM.slice(CM.indexOf('const CLAUSE_KINDS = ['), CM.indexOf('const clauseKindByKey')) + CM.slice(CM.indexOf('function clauseKind(cl){'), CM.indexOf('\n}\n', CM.indexOf('function clauseKind(cl){')) + 3);
const words = { i18t: (k, v) => fill(k in BOOKS.en ? BOOKS.en[k] : k, v), i18tn: (k, n, v) => fill(BOOKS.en[k + (n === 1 ? '_one' : '_other')] || k, Object.assign({ n }, v || {})) };
const daysAgo = n => new Date(Date.now() - n * 864e5).toISOString();
const ask = (id, label, ops, extra) => Object.assign({ id, status: 'pending', authorSide: 'counterparty', clauseId: 'cl_' + id, clauseLabel: label, ops, createdAt: daysAgo(4) }, extra || {});
const SWAP = [{ op: 'keep', text: 'shall not exceed ' }, { op: 'del', text: '50%' }, { op: 'ins', text: '100%' }, { op: 'keep', text: ' of the fees' }];

function glance({ asks = [ask('a', '7. Limitation of liability', SWAP), ask('b', '11. Payment terms', [{ op: 'keep', text: 'within ' }, { op: 'del', text: '30' }, { op: 'ins', text: '60' }, { op: 'keep', text: ' days' }])],
  read = null, signers = false, may = true, round = 2, status = 'Under Review', keyed = true } = {}){
  const c = { id: 'MK-0382', contractNo: 'MK-0382', counterparty: 'Nordvik Logistik AB', status, breakdown: read, negotiation: { round }, changes: asks };
  const calls = [];
  const ctx = Object.assign({
    intel: { paper: { id: c.id, red: false } }, state: { view: 'dashboard', aiConfigured: keyed }, API_MODE: () => true,
    stkOf: cc => (cc.breakdown ? { regions: [] } : null), stkRun: cc => { calls.push(['read', cc.id]); },
    getContract: id => (id === c.id ? c : null), contractRef: x => x.contractNo,
    igHomePaperFace: () => true, hbFace: () => 'paper', canEdit: () => may, PORTAL_MODE: false,
    detailsOf: () => ({ left: 0, all: 4, live: true, items: [] }),
    signBlockers: () => signers ? [] : [{ key: 'signers' }], negoMayStartLine: () => '',
    contractStatusTextHtml: (cc, more) => `<span class="room-stat">In Review${more ? ' · ' + more : ''}</span>`,
    igLineRound: cc => (cc.status === 'Under Review' && cc.negotiation ? cc.negotiation.round : 0),
    negoNeedsYouIds: cc => (cc.changes || []).filter(x => x.status === 'pending' && x.authorSide === 'counterparty').map(x => x.id),
    clauseParseHeading: t => { const m = /^(\d+)\.?\s+(.*)$/.exec(String(t)); return m ? { num: m[1], title: m[2] } : { num: '', title: t }; },
    clauseNameShown: t => t, riskMayAct: () => may,
    runScanFor: cc => { calls.push(['scan', cc.id]); cc.scan = { at: 'now' }; },
    igPaintPaper: () => calls.push(['paint', ctx.intel.paper.red]), igPaperGoClause: id => { calls.push(['go', id]); return { id }; },
    renderIntelDock: () => {}, setTimeout: () => 0,
  }, words);
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(CLAUSE_KIND, ctx); vm.runInContext(PD, ctx);
  return { ctx, c, calls };
}
const J = x => JSON.parse(JSON.stringify(x));

describe('f748 (1) their round and each of their asks', () => {
  test('1a their round leads, then one row per ask, in order', () => {
    const { ctx, c } = glance();
    assert.deepEqual(J(ctx.pdGlanceRows(c).map(r => r.k)), ['move', 'ask:a', 'ask:b', 'sign', 'scan']);
  });
  test('1b who sent how many, and when; "Your move." · Redlines', () => {
    const { ctx, c } = glance();
    const html = ctx.pdGlanceHtml(c);
    /* RE-POINTED 20 Oct 2026 (the Dossier, #386): Still owed names each of their asks, how long it waits, and Reply › onto the Redlines */
    assert.match(html, /data-pd-gl="ask" data-pd-gl-ch="a"><span>[^<]+<small>waits 4 days ago<\/small><\/span><button type="button" class="pd-go ds-go" data-pd-glance="redline">Reply ›<\/button>/);
    const today = glance({ asks: [ask('a', '7. Limitation of liability', SWAP, { createdAt: new Date().toISOString() })] });
    assert.equal(today.ctx.pdGlMoveSay(today.c, today.c.changes), 'Nordvik Logistik AB sent 1 redline today.');
  });
  test('1c each ask in its own stored words — what goes, what comes — with Go to it', () => {
    const { ctx, c } = glance();
    const html = ctx.pdGlanceHtml(c);
    assert.match(html, /data-pd-gl="ask" data-pd-gl-ch="a"><span>Clause 7: they ask for 100% of the fees, up from 50%\.<small>/);
    assert.match(html, /Clause 11: they ask for 60 days to pay, up from 30\./, 'days in a payment clause are days to pay (as drawn)');
    const say = (ops, extra) => ctx.pdAskSay(c, ask('x', '4. Fees', ops, extra));
    /* what the number is OF: the words after it, to a stop, without a dangling "of the" */
    assert.equal(say([{ op: 'keep', text: 'within ' }, { op: 'del', text: '30' }, { op: 'ins', text: '60' }, { op: 'keep', text: ' days of receipt. Late' }]), 'Clause 4: they ask for 60 days to pay, up from 30.', '"Fees" is a payment clause');
    const sayIn = (label, ops) => ctx.pdAskSay(c, ask('y', label, ops));
    const DAYS = [{ op: 'keep', text: 'within ' }, { op: 'del', text: '30' }, { op: 'ins', text: '60' }, { op: 'keep', text: ' days of receipt. Late' }];
    assert.equal(sayIn('11. Payment terms', DAYS), 'Clause 11: they ask for 60 days to pay, up from 30.');
    assert.equal(sayIn('14. Termination', [{ op: 'keep', text: 'on ' }, { op: 'del', text: '90' }, { op: 'ins', text: '30' }, { op: 'keep', text: ' days written notice' }]), 'Clause 14: they ask for 30 days’ notice, down from 90.');
    assert.equal(sayIn('8. Insurance', DAYS), 'Clause 8: they ask for 60 days of receipt, up from 30.', 'a clause of another kind keeps its own words');
    assert.equal(say([{ op: 'keep', text: 'at least ' }, { op: 'del', text: '10' }, { op: 'ins', text: '5' }, { op: 'keep', text: ' million of the' }]), 'Clause 4: they ask for 5 million, down from 10.');
    /* a change inside a number or a word is widened to the whole of it */
    assert.equal(say([{ op: 'keep', text: 'pay within 4' }, { op: 'del', text: '5' }, { op: 'ins', text: '0' }, { op: 'keep', text: ' days' }]), 'Clause 4: they ask for 40 days to pay, down from 45.');
    assert.equal(say([{ op: 'keep', text: 'governed by ' }, { op: 'del', text: 'Swed' }, { op: 'ins', text: 'Engl' }, { op: 'keep', text: 'ish law' }]), 'Clause 4: they ask for “English” in place of “Swedish”.');
    assert.equal(say([{ op: 'keep', text: 'pays ' }, { op: 'ins', text: 'promptly ' }]), 'Clause 4: they ask to add “promptly”.');
    assert.equal(say([{ op: 'keep', text: 'pays ' }, { op: 'del', text: 'monthly ' }]), 'Clause 4: they ask to take out “monthly”.');
    assert.equal(say([], { changeType: 'deleteClause' }), 'Clause 4: they ask to delete it.');
    assert.equal(say([], { changeType: 'insertClause', clauseLabel: 'Audit rights' }), 'They ask for a new clause: Audit rights.');
    assert.equal(say([{ op: 'keep', text: 'x' }]), 'Clause 4: they ask to change its wording.');
    const long = say([{ op: 'del', text: 'a'.repeat(80) }, { op: 'ins', text: 'b' }]);
    assert.ok(/“a{39}…”/.test(long), 'a long quote is cut, and says so: ' + long);
  });
  test('1d past the cap the rest are one row, with Redlines', () => {
    const many = ['a', 'b', 'c', 'd', 'e'].map((k, i) => ask(k, `${i + 1}. Clause`, SWAP));
    const { ctx, c } = glance({ asks: many });
    const rows = J(ctx.pdGlanceRows(c).map(r => Object.assign({}, r, { ch: undefined })));
    assert.equal(rows.filter(r => r.kind === 'ask').length, ctx.PD_GL_ASKS_MAX);
    assert.deepEqual(J(rows.find(r => r.k === 'asks-more')), { k: 'asks-more', n: 5 - ctx.PD_GL_ASKS_MAX });
    assert.match(ctx.pdGlanceHtml(c), /data-pd-gl="ask-more"><span>2 more of their asks\.<\/span>|data-pd-gl="ask"><span>2 more of their asks\.<\/span><button type="button" class="pd-go ds-go" data-pd-glance="redline">Reply ›</);
  });
  test('1e our own asks, a decided ask and a withdrawn one are not theirs waiting', () => {
    const { ctx, c } = glance({ asks: [ask('a', '7. X', SWAP, { authorSide: 'owner' }), ask('b', '8. Y', SWAP, { status: 'accepted' })] });
    assert.ok(!ctx.pdGlanceRows(c).some(r => r.k === 'move' || r.kind === 'ask'));
  });
  test('1f read RAW: no reading that starts a negotiation', () => {
    const fns = PD.slice(PD.indexOf('const PD_GL_ASKS_MAX'), PD.indexOf('function pdGlGoTo('));
    assert.match(fns, /negoNeedsYouIds\(c\)/);
    assert.ok(!/negoChanges\(|negoRound\(|negoInit\(|negoClauseList\(/.test(fns));
  });
});

describe('f748 (2) who signs, and the risks not read yet', () => {
  test('2a "Nobody has been named to sign yet." · Needed before signing · Signing', () => {
    const { ctx, c } = glance();
    /* RE-POINTED 20 Oct 2026 (the Legora way): nobody named is the grid's Signer row, both sides asked on it */
    assert.match(ctx.pdGlanceHtml(c), /data-pd-og-row="signers"[^>]*><td class="pd-og-f"><b>Signer<\/b><span class="pd-og-src is-none">not in the wording · from your people<\/span>[\s\S]*data-pd-og-sg="tname"[\s\S]*data-pd-og-ok="signers"/);
  });
  /* RE-POINTED (pass 3, the owner's answer 6): the read is free, the rules scan */
  test('2b "Risks not read yet" · "Reading is free: HaTi\'s own rules, no Jambo call" · Read it', () => {
    const { ctx, c } = glance();
    /* RE-POINTED 20 Oct 2026 (the Dossier, #386): What Jambo read's risks row, the free read said on its button */
    assert.match(ctx.pdGlanceHtml(c), /data-pd-ds="risks"><span>Risks — not read yet · free<\/span><button type="button" class="ui-btn ui-btn-sm" data-pd-gl-scan title="Reading is free: HaTi’s own rules, no Jambo call">Read it</);
  });
  test('2b2 no key needed: the free read is offered either way', () => {
    const { ctx, c } = glance({ keyed: false });
    assert.match(ctx.pdGlanceHtml(c), /data-pd-gl-scan[^>]*>Read it</);
  });
  test('2c not offered once scanned, signed, or to someone who may not act on the wording', () => {
    for (const o of [{ scanned: true }, { status: 'Signed' }, { may: false }]){
      const g = glance(o); if (o.scanned) g.c.scan = { at: 'x' };
      assert.ok(!g.ctx.pdGlanceRows(g.c).some(r => r.k === 'scan'), JSON.stringify(o));
    }
  });
});

describe('f748 (3) the stage pill carries its round', () => {
  test('3 "In Review · round 2", as the paper\'s line says it', () => {
    const { ctx, c } = glance();
    /* RE-POINTED 20 Oct 2026 (the Dossier, #386): the stage is the spine's lit Negotiate */
    assert.match(ctx.pdGlanceHtml(c), /class="ds-st is-(?:now|on)[^"]*" role="listitem" data-ds-st="nego"/);
  });
});

describe('f748 (4) the presses', () => {
  test('4a Go to it Redlines Home\'s paper and brings the clause up', () => {
    const { ctx, calls } = glance();
    ctx.pdGlGoTo('cl_a');
    assert.deepEqual(calls, [['paint', true], ['go', 'cl_a']]);
    const again = glance(); again.ctx.intel.paper.red = true; again.ctx.pdGlGoTo('cl_b');
    assert.deepEqual(again.calls, [['go', 'cl_b']], 'already Redlined: only the walk');
  });
  test('4b the wiring: Go to it and Read it', () => {
    const wiring = PD.slice(PD.indexOf('document._pdJamboTopWired = true'), PD.indexOf('JAMBO, ALIVE'));
    assert.match(wiring, /const gg = t\.closest\('\[data-pd-gl-go\]'\);\s*if \(gg\)\{ e\.preventDefault\(\); pdGlGoTo\(gg\.getAttribute\('data-pd-gl-go'\)\); return; \}/);
    assert.match(wiring, /\[data-pd-gl-scan\][\s\S]{0,200}Promise\.resolve\(runScanFor\(getContract\(cc\.id\) \|\| cc\)\)\.then\(\(\) => \{ try \{ pdGlanceRepaint\(\); pdNeedsRepaint\(\); \}/, 'the free scan, then the cards painted again');
    assert.ok(!/stkRun/.test(wiring.slice(wiring.indexOf('[data-pd-gl-scan]'), wiring.indexOf('[data-pd-gl-scan]') + 400)), 'never the deep read that costs a call');
  });
});

describe('f748 (5) the chips lead with what is owed', () => {
  function chips({ need = [], asks = 0, signers = false, executed = false, face = '' } = {}){
    const c = { id: 'MK-9', contractNo: 'MK-9', status: 'Under Review' };
    const calls = [];
    const ctx = Object.assign({ intel: { paper: { id: 'MK-9' }, history: [] }, state: { contracts: [c], view: 'dashboard' },
      getContract: id => (id === c.id ? c : null), contractRef: x => x.contractNo, currentUser: () => ({ id: 'u1' }), getUsers: () => [],
      localStorage: { getItem: () => null, setItem: () => {} }, setTimeout: () => 0,
      needsYouOf: () => need.map(kind => ({ kind })), negoNeedsYouIds: () => Array.from({ length: asks }, (_, i) => 'ch' + i),
      signBlockers: () => signers ? [] : [{ key: 'signers' }], pdSignAhead: () => !executed,
      negoExecuted: () => executed, negoMayStart: () => ({ ok: !executed }), pdFaceNow: () => face, pdAmendMay: () => false,
      igHomePaperFace: () => true, igPaperUp: () => true,
      pdRedOpen: id => { calls.push(['red', id]); return true; }, openSignerPlanEditor: cc => calls.push(['route', cc.id]), renderIntelDock: () => {} }, words);
    ctx.window = ctx;
    vm.createContext(ctx); vm.runInContext(CA, ctx);
    return { ctx, c, calls };
  }
  test('5a their asks waiting and nobody named: "answer the redlines · name a signer · share · history"', () => {
    const { ctx, c } = chips({ asks: 2 });
    assert.deepEqual(J(ctx.caOwedSteps(c)), ['answer', 'signer']);
    const L = J(ctx.caPaperChips());
    assert.deepEqual(L.map(x => x.k), ['answer', 'signer', 'share', 'history']);
    assert.deepEqual(L.slice(0, 2).map(x => x.label), ['answer the redlines', 'name a signer']);
    assert.ok(L[0].owed && !L[1].owed, 'the first owed leads, at the strong weight');
    /* RE-POINTED 20 Oct 2026 (Chambers: a suggestion is a link, not a chip):
       every chip wears the one link class; the owed lead is the same link at
       the strong weight — no accent outline any more (was 18 Oct's). */
    const html = ctx.caChipsHtml();
    assert.match(html, /data-ca-chip="answer" class="jb-chip ca-chip-owed"/);
    assert.match(html, /data-ca-chip="signer" class="jb-chip"/, 'the rest are plain links');
    assert.doesNotMatch(html, /bg-canvas|rounded-full/, 'no chip pill is drawn');
    const css = R('index.html').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.match(css, /\.ca-chip-owed\{font-weight:var\(--w-strong\)\}/, 'as drawn: the strong weight, not amber');
    assert.doesNotMatch(css, /\.ca-chip-owed\{[^}]*border:/, 'no accent outline on the owed lead');
    assert.match(css, /\.jb-chip\{[^}]*border:0;[^}]*color:var\(--accent-ink\);text-decoration:underline/, 'a link in the accent ink');
    /* one class each, so the later rule wins: the owed lead's weight must come
       after the link's own (font-weight:var(--w-body)) or it loses the fight */
    assert.ok(css.indexOf('.ca-chip-owed{') > css.indexOf('.jb-chip{'), 'the owed lead\'s weight is not overruled by the link\'s');
    assert.equal(ctx.CA_NEXT_MAX, 4);
  });
  test('5b details owed lead; nothing owed, the journey as before', () => {
    assert.deepEqual(J(chips({ need: ['details'], asks: 2 }).ctx.caNextSteps({ id: 'MK-9' })), ['fill', 'answer', 'signer', 'share']);
    assert.deepEqual(J(chips({ signers: true }).ctx.caNextSteps({ id: 'MK-9' })), ['redline', 'share', 'sign', 'history']);
  });
  test('5c executed: nothing owed is offered; on the Redlines face answering is not offered again', () => {
    assert.ok(!chips({ asks: 2, executed: true }).ctx.caNextSteps({ id: 'MK-9' }).some(k => k === 'answer' || k === 'signer'));
    assert.ok(!chips({ asks: 2, face: 'red' }).ctx.caNextSteps({ id: 'MK-9' }).includes('answer'));
  });
  test('5d the presses: the Redlines face and the signing route', () => {
    const { ctx, c, calls } = chips({ asks: 2 });
    ctx.caNextRun(c, 'answer'); ctx.caNextRun(c, 'signer');
    assert.deepEqual(J(calls), [['red', 'MK-9'], ['route', 'MK-9']]);
  });
});

describe('f748 (6) reading writes nothing; both books', () => {
  test('6a the record is the same after the glance is drawn', () => {
    const { ctx, c } = glance();
    const before = JSON.stringify(c); ctx.pdGlanceHtml(c); ctx.pdGlanceRows(c); assert.equal(JSON.stringify(c), before);
  });
  for (const k of ['pd_gl_sent_one', 'pd_gl_sent_other', 'pd_gl_your_move', 'pd_gl_ago_today', 'pd_gl_ago_days_one', 'pd_gl_ago_days_other', 'pd_gl_clause_n',
    'pd_gl_ask_swap', 'pd_gl_ask_up', 'pd_gl_ask_down', 'pd_gl_ask_add', 'pd_gl_ask_cut', 'pd_gl_ask_new', 'pd_gl_ask_del', 'pd_gl_ask_words', 'pd_gl_their_ask', 'pd_gl_go_to_it',
    'pd_gl_asks_more_one', 'pd_gl_asks_more_other', 'pd_gl_signers_sub', 'pd_gl_scan', 'pd_gl_scan_cost', 'pd_gl_scan_go', 'ca_next_answer', 'ca_next_signer'])
    test(k, () => { assert.ok(BOOKS.en[k] && BOOKS.sv[k] && BOOKS.en[k] !== BOOKS.sv[k], k); });
});
