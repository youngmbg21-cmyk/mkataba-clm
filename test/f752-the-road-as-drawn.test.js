'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f752 — BEFORE YOU SIGN, "THE ROAD", EVERY DRAWN PART (the owner's yes of
   18 Oct 2026 to build every gap between the picked drawing and HaTi; round
   10, option 2 "The road")
   (1) Ready to sign names its checks: "5 checks clear: wording, standards,
       promises, details, the brief", or "3 to settle: standards, …".
   (2) A named person's yes is its own stop, "<approver>'s yes", framed where
       it is the reader's work: where the approval stands (asked › waiting ›
       approved · or refused, lapsed), Jambo's line where the reader stands in
       for the approver (When you're away), what the yes covers, and its acts
       — Approve for <them> · Refuse… — the lists' own decide door
       (signApprovalDecideAsk). The column's own card is not drawn twice.
   (3) Each signer's stop says what it waits for: "their link opens after the
       yes"; an away signer of ours "back <day> · only they can sign".
   (4) The foot: "Who signs can change until the first signature. · Change"
       (the route's own editor); the checks fold behind "Show" while the yes
       is framed. Reading writes nothing.
   AT THE PARENT (8dc306a) every test here FAILS.
   The browser half: test/chromium/the-road-as-drawn-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js');
const AP = R('js/approvals.js');
const CT = R('js/views/contract.js');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    const v = m[2].replace(/\\'/g, "'");
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v && k in v) ? v[k] : '{' + k + '}');
const TODAY = '2026-10-19';           // a Monday, fixed: the stage's own clock, never the day the test runs
function stage({ holds = [], rows = [], plan = [], me = { id: 'u-maria', name: 'Maria Lind', role: 'legal' }, sa = null, covering = [], signed = false } = {}){
  const c = { id: 'MK-0391', counterparty: 'Helio Energy AB', status: 'Under Review', signerPlan: plan, signatures: signed ? [{ at: 'x' }] : [],
    obligations: [{ desc: 'Pay', status: 'open' }, { desc: 'Deliver', status: 'open' }] };
  const steps = () => { const by = new Map(); plan.slice().sort((a, b) => a.order - b.order).forEach(s => { const k = s.step || s.order; if (!by.has(k)) by.set(k, []); by.get(k).push(s); });
    return [...by.keys()].sort((a, b) => a - b).map((k, i) => ({ n: i + 1, rows: by.get(k) })); };
  const ctx = {
    i18t: (k, v) => fill(k in BOOKS.en ? BOOKS.en[k] : k, v), i18tn: (k, n, v) => fill(BOOKS.en[k + (n === 1 ? '_one' : '_other')] || k, v),
    signReadiness: () => ({ holds, rows }), signSteps: steps,
    signStepNow: () => { const st = steps().find(x => !x.rows.every(r => r.signed)); return st ? st.n : 0; },
    nextSigner: () => plan.slice().sort((a, b) => a.order - b.order).find(s => !s.signed) || null,
    currentUser: () => me, contractParty: () => 'Lindqvist & Co AB', negoExecuted: () => false,
    signApprovalStateOf: () => sa || { rows: [], ok: true, started: false, open: [] },
    saMayDecide: (req, u, cv) => { if (String(req.approverId) === String(u.id)) return 'approver'; if (covering.some(x => String(x.userId) === String(req.approverId))) return 'deputy'; return u.role === 'admin' ? 'admin' : null; },
    signingLocked: () => signed, canEdit: () => true, openSignerPlanEditor: () => {}, todayISO: () => TODAY, langLocale: () => 'en-GB',
    fmtMoneyShortIn: (n, cur) => `${cur} ${(n / 1e6).toFixed(1)} M`, contractCurrency: () => 'SEK',
    awayByLabel: (by, f) => f && f.name ? `${by} for ${f.name}` : by,
    state: { away: { covering } }, setTimeout: () => 0,
  };
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(PD, ctx);
  return { ctx, c };
}
const J = x => JSON.parse(JSON.stringify(x));
const need = { key: 'u-jonas', approverId: 'u-jonas', approverName: 'Jonas Berg', backupId: '', people: [{ id: 'u-lina', name: 'Lina Ek', why: ['lead'] }] };
const pending = { rows: [{ need, status: 'pending', req: { id: 'sa_1', status: 'pending', approverId: 'u-jonas', askedAt: '2026-10-17T09:00:00Z',
  askedBy: { id: 'u-lina', name: 'Lina Ek' }, shows: { round: 3, value: 8100000, currency: 'SEK', signers: ['Henrik Dahl', 'Jonas Berg'] } } }], started: false, ok: false, open: [] };
const PLAN = [{ id: 'a', party: 'counterparty', name: 'Henrik Dahl', order: 1 }, { id: 'b', party: 'internal', name: 'Jonas Berg', memberId: 'u-jonas', order: 2 }];
const AWAY = [{ userId: 'u-jonas', userName: 'Jonas Berg', from: '2026-10-19', to: '2026-10-23' }];

describe('f752 (1) Ready to sign names its checks', () => {
  test('1a clear: "5 checks clear: wording, standards, promises, details, the brief"', () => {
    const { ctx, c } = stage({ plan: PLAN });
    assert.equal(ctx.pdRoadStops(c).stops[0].sub, '5 checks clear: wording, standards, promises, details, the brief');
  });
  test('1b open: the count, then which checks, in the checks\' order', () => {
    const { ctx, c } = stage({ holds: [{ kind: 'obligations' }, { kind: 'standards-read' }, { kind: 'brief' }, { kind: 'turn' }] });
    assert.equal(ctx.pdRoadStops(c).stops[0].sub, '3 to settle: standards, promises, the brief');
    assert.equal(ctx.pdRoadCheckOf('blanks'), 'wording'); assert.equal(ctx.pdRoadCheckOf('fields'), 'details'); assert.equal(ctx.pdRoadCheckOf('nothing-known'), 'wording');
  });
});

describe('f752 (2) a named person\'s yes, framed where it is the reader\'s work', () => {
  test('2a the stop is "<approver>\'s yes"; the stand-in reader decides it, the checks fold behind Show', () => {
    const { ctx, c } = stage({ holds: [{ kind: 'signapproval', short: 'approval before signing' }], plan: PLAN, sa: pending, covering: AWAY });
    const R0 = J(ctx.pdRoadStops(c));
    assert.deepEqual(R0.stops.map(x => x.k), ['ready', 'yes', 'step1', 'step2', 'sealed']);
    assert.equal(R0.stops[1].t, 'Jonas Berg’s yes');
    assert.equal(R0.cur, 1); assert.equal(R0.yesAt, 1); assert.equal(R0.fold, true); assert.equal(R0.route, true);
    assert.equal(R0.stops[1].yes.as, 'deputy'); assert.equal(R0.stops[1].yes.signs, true, 'Jonas also signs for us');
  });
  test('2b the frame: where it stands, Jambo\'s line, what it covers, Approve for Jonas · Refuse…, the card\'s id for the email\'s landing', () => {
    const { ctx, c } = stage({ holds: [{ kind: 'signapproval' }], plan: PLAN, sa: pending, covering: AWAY });
    const y = ctx.pdRoadYesOf(c);
    const h = ctx.pdRoadYesHtml(c, y);
    assert.match(h, /^<div class="pd-rd-card sa-card" id="sa-card" data-pd-rd-yes="pending" data-sa-req="sa_1">/);
    const states = [...h.matchAll(/<span class="pd-rd-st( [a-z-]+)?">([^<]+)<\/span>/g)].map(m => (m[1] || '').trim() + ':' + m[2]);
    assert.deepEqual(states, ['is-past:Asked 17 Oct', 'is-cur:Waiting', ':Approved', ':Refused', ':Lapsed']);
    assert.match(h, /<i>· or<\/i>/);
    assert.match(h, /Jonas is away until Friday\. You may give their yes for them; their signature still waits for them\./);
    assert.match(h, /Lina Ek asked\. It covers round 3 as it stands, SEK 8\.1 M and the signers below; a change undoes it\./);
    assert.match(h, /data-pd-rd-approve="sa_1" data-pd-rd-as="deputy">Approve for Jonas</);
    assert.match(h, /data-pd-rd-refuse="sa_1">Refuse…</);
  });
  test('2c the asker sees where it stands and Remind, never Approve; an admin\'s Approve asks why', () => {
    const lina = stage({ holds: [{ kind: 'signapproval' }], plan: PLAN, sa: pending, me: { id: 'u-lina', name: 'Lina Ek', role: 'legal' } });
    const hl = lina.ctx.pdRoadYesHtml(lina.c, lina.ctx.pdRoadYesOf(lina.c));
    assert.ok(!/data-pd-rd-approve/.test(hl) && !/id="sa-card"/.test(hl)); assert.match(hl, /data-pd-rd-remind="sa_1">Remind Jonas</);
    assert.ok(!/is away until/.test(hl), 'the stand-in line is the stand-in\'s');
    const adm = stage({ holds: [{ kind: 'signapproval' }], plan: PLAN, sa: pending, me: { id: 'u-adm', name: 'Amina', role: 'admin' } });
    assert.match(adm.ctx.pdRoadYesHtml(adm.c, adm.ctx.pdRoadYesOf(adm.c)), /data-pd-rd-as="admin">Approve…</);
  });
  test('2d given: the stop is ticked and says who, for whom, when', () => {
    const given = { rows: [{ need, status: 'approved', req: { ...pending.rows[0].req, status: 'approved', decidedBy: { name: 'Maria Lind' }, for: { id: 'u-jonas', name: 'Jonas Berg' }, decidedAt: '2026-10-19T08:00:00Z' } }], started: false, ok: true, open: [] };
    const { ctx, c } = stage({ rows: [{ kind: 'signapproval', settled: true }], plan: PLAN, sa: given });
    const yes = J(ctx.pdRoadStops(c)).stops[1];
    assert.equal(yes.done, true); assert.equal(yes.sub, 'Approved by Maria Lind for Jonas Berg, today');
  });
  test('2e one decide door: the lists\' approvalDecideAsk and the road both press signApprovalDecideAsk; the column\'s card stands down on the face', () => {
    assert.match(AP, /async function signApprovalDecideAsk\(c, row, verdict\)\{/);
    assert.match(AP, /return signApprovalDecideAsk\(c, d\.row, verdict\);/);
    assert.match(PD, /await signApprovalDecideAsk\(c, \{ req: y\.req, as: y\.as \}, yesB\.hasAttribute\('data-pd-rd-approve'\) \? 'approved' : 'refused'\);/);
    assert.match(CT, /\$\{\(!closed&&window\.signApprovalAskCardHtml&&!host\.closest\('#pd-signface'\)\)\?signApprovalAskCardHtml\(c\):''\}/);
  });
});

describe('f752 (3) each signer\'s stop says what it waits for', () => {
  test('3a while the yes holds: their link opens after it; an away signer of ours is back on the next working day, and only they can sign', () => {
    const { ctx, c } = stage({ holds: [{ kind: 'signapproval' }], plan: PLAN, sa: pending, covering: AWAY });
    const st = J(ctx.pdRoadStops(c)).stops;
    assert.equal(st[2].t, 'Helio Energy AB signs'); assert.equal(st[2].sub, 'Henrik Dahl · their link opens after the yes');
    assert.equal(st[3].t, 'Lindqvist & Co AB signs'); assert.equal(st[3].sub, 'Jonas Berg · back 26 Oct · only they can sign', 'away until Friday the 23rd: back the Monday after, a week ahead, so its date');
    assert.equal(st[4].sub, 'Copies to both sides · 2 obligations start');
  });
  test('3b a day as a person says it', () => {
    const { ctx } = stage();
    assert.equal(ctx.pdDayWord(TODAY), 'today'); assert.equal(ctx.pdDayWord('2026-10-23'), 'Friday'); assert.equal(ctx.pdDayWord('2026-11-02'), '2 Nov');
    assert.equal(ctx.pdBackDay('2026-10-23'), '26 Oct', 'Friday away: back the Monday after');
  });
});

describe('f752 (4) the foot, the fold, and reading writes nothing', () => {
  test('4a who signs can change until the first signature — not after', () => {
    assert.equal(stage({ plan: PLAN }).ctx.pdRoadStops(stage({ plan: PLAN }).c).route, true);
    const s = stage({ plan: PLAN, signed: true }); assert.equal(s.ctx.pdRoadStops(s.c).route, false);
    const f = PD.slice(PD.indexOf('function pdRoadPaint('), PD.indexOf('function pdSignFaceHtml('));
    assert.match(f, /_pdT\('pd_rd_change_line'\)[\s\S]*data-pd-rd-route>\$\{_pdE\(_pdT\('pd_rd_change'\)\)\}/);
    assert.match(f, /body\.style\.display = \(R\.fold && !_pdRdShow\) \? 'none' : '';/);
    assert.match(PD, /if \(hit\('\[data-pd-rd-route\]'\)\)\{ e\.preventDefault\(\); if \(typeof openSignerPlanEditor === 'function'\) openSignerPlanEditor\(c\); return; \}/);
  });
  test('4b reading writes nothing', () => {
    const { ctx, c } = stage({ holds: [{ kind: 'signapproval' }], plan: PLAN, sa: pending, covering: AWAY });
    const before = JSON.stringify(c); ctx.pdRoadStops(c); ctx.pdRoadYesHtml(c, ctx.pdRoadYesOf(c)); assert.equal(JSON.stringify(c), before);
  });
  test('4c the words, in both books', () => {
    for (const k of ['pd_rd_ck_wording', 'pd_rd_ck_standards', 'pd_rd_ck_promises', 'pd_rd_ck_details', 'pd_rd_ck_brief', 'pd_rd_checks_clear', 'pd_rd_show', 'pd_rd_hide',
      'pd_rd_today', 'pd_rd_yes_of', 'pd_rd_yes_admin', 'pd_rd_y_given', 'pd_rd_st_aria', 'pd_rd_st_asked', 'pd_rd_st_unasked', 'pd_rd_st_waiting', 'pd_rd_st_approved',
      'pd_rd_st_or', 'pd_rd_st_refused', 'pd_rd_st_lapsed', 'pd_rd_standin', 'pd_rd_standin_nosign', 'pd_rd_y_facts', 'pd_rd_y_round', 'pd_rd_y_now', 'pd_rd_y_signers',
      'pd_rd_y_and', 'pd_rd_approve', 'pd_rd_approve_for', 'pd_rd_approve_why', 'pd_rd_refuse', 'pd_rd_moved', 'pd_rd_remind', 'pd_rd_send', 'pd_rd_send_again',
      'pd_rd_change_again', 'pd_rd_after_yes_theirs', 'pd_rd_after_yes', 'pd_rd_back', 'pd_rd_only_they', 'pd_rd_change_line', 'pd_rd_change'])
      for (const l of ['en', 'sv']) assert.ok(BOOKS[l][k], k + ' ' + l);
  });
});
