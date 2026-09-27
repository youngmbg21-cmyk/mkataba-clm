/* ============================================================
   F395 — WHAT THIS CONTRACT NEEDS FROM YOU: THE SIDE PANEL'S CHECKLIST
   (Young picked "Checklist" by name, 27 Sep 2026, off the "Attention Banner
   Options" page: "Implement checklist.")
   ============================================================
   *"a nicely designed banner in the contract's inspector side panel that
   explains what attention is needed. It would sit right under the party names
   and in color."* A checklist under the name block: a head that counts, one
   row per thing owed by this reader by name, each coloured by its urgency and
   carrying the press that does it. Nothing owed draws nothing.

   What this file pins:
     1  one reading, and it is Home's: every source is the function Home's
        card asks, of a one-contract list; lateness is one rule for both
     2  the reading: only what is owed, most urgent first, a renewal only on a
        contract you own, nothing owed / archived / nobody signed in → nothing
     3  one contract's renewal decision (hmRenewalDue), lifted out of the
        dashboard's slices, and the slices built from it
     4  the drawing: under the name block, above the status line; the head
        counts, the rows carry kind, colour, words and one verb; a page's skip
     5  the words: the days are the asks table's own count, the standard is on
        the hover, the signature names the Signing tab's first thing
     6  every button is one door (needsYouGo), wired in the panel's listener
     7  the words in both books, the clothes in HaTi's sheet, the names published

   RED AT THE PARENT (c8a049d), measured in a worktree: 25 of 26 FAIL. The
   one that passed there was 1d, a [wall] saying Home's card still listed its
   six kinds — and it is REVERSED IN PLACE the same day (27 Sep 2026), when
   Young said yes to the card listing the checklist's own five: measured, at
   c8a049d all 26 FAIL and at a007cdb (the checklist) only 1d does. The card's
   behaviour is DRIVEN in f382 (3); 1d holds the source to the same shape.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
/* Code only — a claim that a name is CALLED must not be satisfied by prose. */
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const HOME = read('js/views/home.js');
const INS = read('js/views/inspector.js');
const AP = read('js/views/approvalsview.js');
const CSS = read('index.html');
const I18N = read('js/i18n.js');
const CORE = read('js/core.js');
/* One function's own region: from its declaration to the next top-level one. */
function fnOf(src, name){
  const at = src.indexOf('function ' + name + '(');
  if (at < 0) return '';
  const next = src.slice(at + 1).search(/\n(?:async )?function [A-Za-z_$]/);
  return src.slice(at, next < 0 ? undefined : at + 1 + next);
}
const has = (win, name) => typeof win[name] === 'function';
const day = n => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); };

const ME = { id: 'u-young', name: 'Young Mbagaya', email: 'admin@example.co.ke', role: 'admin' };
function world(){
  const w = buildWorld({ registerView: true, homeView: true, obligations: true });
  const win = w.win;
  win.state = Object.assign({}, win.state, { contracts: [] });
  win.currentUser = () => ME;
  win.getContract = id => (win.state.contracts || []).find(c => c.id === id) || null;
  /* THE REAL owner check, lifted out of core.js (this world does not load it):
     a stand-in kinder than the real function would turn the ownership claims
     into descriptions. */
  const own = fnOf(CORE, 'contractOwnedBy');
  if (own && !has(win, 'contractOwnedBy')) win.eval(own + ';window.contractOwnedBy=contractOwnedBy;');
  return win;
}
function contract(over){
  return Object.assign({ id: 'MK-149', name: 'Retail Supply — Modern Trade', counterparty: 'Carrefour Kenya',
    status: 'Under Review', folder: 'sales', fields: {}, metadata: {}, audit: [], changes: [] }, over || {});
}
/* The five sources, answering for the ONE contract they are asked about and
   in the shapes the real functions return — the assembly is under test here;
   the real sources are driven in inspector-checklist-verify. */
function sources(win, o){
  const only = (list, fn) => cs => (cs || []).filter(c => list && list[c.id]).map(c => fn(c, list[c.id]));
  win.deskStaleInboxFor = only(o.quiet, (c, s) => ({ c, stale: s }));
  win.reviewInboxFor = only(o.review, (c, r) => ({ c, rv: r.rv, st: r.st }));
  win.deskJoinInboxFor = only(o.join, (c, r) => ({ c, req: r }));
  win.nextSigner = c => (o.sign && o.sign[c.id]) ? { party: 'internal', memberId: ME.id, signed: false } : null;
  win.signReadiness = c => ({ n: (o.sign && o.sign[c.id] && o.sign[c.id].n) || 0,
    holds: ((o.sign && o.sign[c.id] && o.sign[c.id].holds) || []) });
  win.signRouteOf = () => 'inside';
}

describe('f395 (1) — one reading, and it is Home\'s', () => {
  test('1a the reading asks the very functions Home\'s card asks, of a one-contract list', () => {
    const f = code(fnOf(HOME, 'needsYouOf'));
    assert.ok(f, 'needsYouOf exists in js/views/home.js');
    for (const call of ['deskStaleInboxFor(one, me)', 'reviewInboxFor(one, me)', 'deskJoinInboxFor(one, me)', 'hmMySignings(one)', 'hmRenewalDue(c)', 'contractOwnedBy(c, me)'])
      assert.ok(f.includes(call), 'asks ' + call);
  });
  test('1b lateness is ONE rule with two askers — Home\'s card and the checklist', () => {
    const card = code(fnOf(HOME, 'hmDecisionItems'));
    const list = code(fnOf(HOME, 'needsYouOf'));
    assert.ok(/urgent:hmReviewLate\(x\.rv\)/.test(card), 'the card asks hmReviewLate');
    assert.ok(/urgent:x\.d<=HM_SOON_DAYS/.test(card), 'the card asks HM_SOON_DAYS');
    assert.ok(/hmReviewLate\(rv\)/.test(list) && /HM_SOON_DAYS/.test(list), 'the checklist asks both');
    assert.ok(!/todayISO\(\)/.test(card), 'the card no longer carries its own copy of "today"');
  });
  test('1c the dashboard\'s renewal decisions are built from hmRenewalDue — one question, not two', () => {
    const slices = code(fnOf(HOME, 'hmDashSlices'));
    assert.ok(/const decisions=cs\.map\(c=>hmRenewalDue\(c\)\)\.filter\(Boolean\)/.test(slices), 'decisions from hmRenewalDue');
    assert.ok(!/renewalDecided\|\|/.test(slices), 'the inline copy of the question is gone from the slices');
  });
  /* REVERSED IN PLACE the same day (27 Sep 2026). For one commit this was a
     [wall] — "Home's card still lists its six kinds; the checklist narrowed
     nothing on Home". Then Young said yes to the card listing the SAME five
     kinds as the checklist: "Waiting on review" left it (every contract
     sitting in review, a queue nobody owns and a line the checklist never
     had), and a renewal is a row only for the contract's owner — the question
     needsYouOf asks. */
  test('1d Home\'s card lists the checklist\'s five kinds, and asks the checklist\'s ownership question of a renewal', () => {
    const card = code(fnOf(HOME, 'hmDecisionItems'));
    for (const src of ['myReviews', 'myStaleDesks', 'myJoinAsks', 'mySignings', 'decisions'])
      assert.ok(card.includes(src), 'the card reads ' + src);
    assert.ok(!card.includes('waitingLongest'), 'and no longer reads the review queue nobody owns');
    assert.ok(/\.filter\(x=>!deskIds\.has\(x\.c\.id\)&&owns\(x\.c\)\)/.test(card), 'a renewal row is asked whether the reader owns it');
    assert.ok(/contractOwnedBy\(c, me\)/.test(card), 'and that is contractOwnedBy, asked as the checklist asks it');
  });
});

describe('f395 (2) — the reading: only what is owed, most urgent first', () => {
  test('2a nothing owed, an archived contract, or nobody signed in — nothing', () => {
    const win = world();
    assert.ok(has(win, 'needsYouOf'), 'needsYouOf is published');
    sources(win, {});
    const c = contract();
    assert.equal(win.needsYouOf(c).length, 0, 'nothing owed');
    sources(win, { quiet: { 'MK-149': { days: 7, since: day(-9), n: 3, lead: { name: 'Young Mbagaya' } } } });
    assert.equal(win.needsYouOf(Object.assign({}, c, { archived: { at: day(-1) } })).length, 0, 'archived');
    win.currentUser = () => null;
    assert.equal(win.needsYouOf(c).length, 0, 'nobody signed in');
  });
  test('2b the late item leads; the rest keep the fixed order — quiet, review, join, sign, renewal', () => {
    const win = world();
    assert.ok(has(win, 'needsYouOf'), 'needsYouOf is published');
    sources(win, {
      review: { 'MK-149': { rv: { by: 'Amina Otieno', due: day(5) }, st: { total: 2 } } },
      join: { 'MK-149': { name: 'Peter Kamau', why: 'I handle the account', at: day(-2) } },
      quiet: { 'MK-149': { days: 7, since: day(-9), n: 3, lead: { name: 'Young Mbagaya' } } },
    });
    const kinds = win.needsYouOf(contract()).map(x => x.kind + ':' + (x.urgent ? 'late' : 'owed'));
    assert.equal(kinds.join(','), 'quiet:late,review:owed,join:owed');
  });
  test('2c a review past its date is late and leads; one not yet due is not', () => {
    const win = world();
    assert.ok(has(win, 'needsYouOf'), 'needsYouOf is published');
    sources(win, {
      review: { 'MK-149': { rv: { by: 'Amina Otieno', due: day(-2) }, st: { total: 2 } } },
      join: { 'MK-149': { name: 'Peter Kamau', why: '', at: day(-2) } },
    });
    const late = win.needsYouOf(contract());
    assert.equal(late.map(x => x.kind + ':' + x.urgent).join(','), 'review:true,join:false');
    assert.equal(win.hmReviewLate({ due: day(3) }), false, 'due in three days is not late');
    assert.equal(win.hmReviewLate({}), false, 'no date is not late');
  });
  test('2d a renewal on a contract you own is yours; on somebody else\'s it is theirs', () => {
    const win = world();
    assert.ok(has(win, 'needsYouOf') && has(win, 'contractOwnedBy'), 'needsYouOf and the real owner check');
    sources(win, {});
    const soon = contract({ id: 'MK-143', status: 'Signed', expiry: day(64), metadata: { expiryDate: day(64), noticePeriodDays: 30 } });
    const mine = Object.assign({}, soon, { owner: { id: ME.id, name: ME.name } });
    const theirs = Object.assign({}, soon, { owner: { id: 'u-grace', name: 'Grace Ndungu' } });
    const got = win.needsYouOf(mine);
    assert.equal(got.length, 1, 'one row on the contract you own');
    assert.equal(got[0].kind, 'renewal');
    assert.ok(got[0].d >= 32 && got[0].d <= 36, 'the decision falls in about 34 days: ' + got[0].d);
    assert.equal(got[0].urgent, false, 'more than 30 days away is owed, not late');
    assert.equal(win.needsYouOf(theirs).length, 0, 'somebody else\'s renewal is theirs to decide');
    const close = Object.assign({}, mine, { expiry: day(40), metadata: { expiryDate: day(40), noticePeriodDays: 30 } });
    assert.equal(win.needsYouOf(close)[0].urgent, true, 'inside 30 days it is late');
  });
  test('2e your signature is a row, counted by what stands before it', () => {
    const win = world();
    assert.ok(has(win, 'needsYouOf'), 'needsYouOf is published');
    sources(win, { sign: { 'MK-158': { n: 3, holds: [{ kind: 'brief' }] } } });
    const got = win.needsYouOf(contract({ id: 'MK-158' }));
    assert.equal(got.map(x => x.kind + ':' + x.n).join(','), 'sign:3');
  });
  test('2f READING MUST NOT WRITE — the record comes back exactly as it went in', () => {
    const win = world();
    assert.ok(has(win, 'needsYouOf'), 'needsYouOf is published');
    const c = contract({ status: 'Signed', owner: { id: ME.id, name: ME.name }, expiry: day(64), metadata: { expiryDate: day(64), noticePeriodDays: 30 } });
    const before = JSON.stringify(c);
    win.needsYouOf(c);
    assert.equal(JSON.stringify(c), before);
  });
});

describe('f395 (3) — one contract\'s renewal decision', () => {
  test('3a due inside 90 days and not answered → the day and how far; otherwise nothing', () => {
    const win = world();
    assert.ok(has(win, 'hmRenewalDue'), 'hmRenewalDue is published');
    const at = (exp, notice, over) => contract(Object.assign({ status: 'Signed', expiry: day(exp), metadata: { expiryDate: day(exp), noticePeriodDays: notice } }, over || {}));
    const r = win.hmRenewalDue(at(64, 30));
    assert.ok(r && r.dd && r.d === win.daysUntil(r.dd), 'the day and its distance, by the one day counter');
    assert.equal(win.hmRenewalDue(at(300, 30)), null, 'too far away');
    assert.equal(win.hmRenewalDue(at(10, 30)), null, 'the notice deadline has passed');
    assert.equal(win.hmRenewalDue(at(64, 30, { status: 'Declined' })), null, 'a declined contract');
    /* A decision counts only for the question it answered (renewalDecisionOf):
       the same expiry and notice, stamped. */
    const asked = at(64, 30);
    const q = win.renewalQuestionOf(asked);
    asked.renewalDecision = { answer: 'renew', at: day(-1), by: 'Young Mbagaya', expiry: q.expiry, notice: q.notice, decideBy: day(34) };
    assert.equal(win.hmRenewalDue(asked), null, 'answered already');
  });
});

describe('f395 (4) — the drawing', () => {
  const items = [
    { kind: 'quiet', urgent: true, n: 3, since: new Date(Date.now() - 9 * 864e5).toISOString() },
    { kind: 'review', urgent: false, who: 'Amina Otieno', n: 2, due: day(5) },
  ];
  test('4a nothing owed draws nothing', () => {
    const win = world();
    assert.ok(has(win, 'insNeedsHtml'), 'insNeedsHtml is published');
    win.needsYouOf = () => [];
    assert.equal(win.insNeedsHtml(contract()), '');
  });
  test('4b a frame in the worst row\'s colour, a head that counts, a row per item with its kind, colour and one verb', () => {
    const win = world();
    assert.ok(has(win, 'insNeedsHtml'), 'insNeedsHtml is published');
    win.needsYouOf = () => items;
    const d = win.document.createElement('div');
    d.innerHTML = win.insNeedsHtml(contract());
    const sec = d.querySelector('section.ins-need');
    assert.ok(sec, 'a section');
    assert.ok(sec.classList.contains('is-ruby'), 'the frame takes the late row\'s colour');
    assert.equal(sec.getAttribute('aria-label'), win.i18t('ins_need_label'));
    assert.equal(sec.querySelector('.ins-need-h').textContent.trim(), win.i18tn('ins_need_head', 2, { n: 2 }));
    const rows = [...sec.querySelectorAll('.ins-need-r')];
    assert.equal(rows.map(r => r.getAttribute('data-ins-need-row') + ':' + (r.classList.contains('is-ruby') ? 'ruby' : 'amber')).join(','), 'quiet:ruby,review:amber');
    assert.equal(rows.map(r => r.querySelector('button[data-ins-need]').getAttribute('data-ins-need')).join(','), 'quiet,review');
    assert.equal(rows.map(r => r.querySelector('button').textContent.trim()).join(','), [win.i18t('home_verb_answer'), win.i18t('home_verb_review')].join(','));
    assert.ok(rows.every(r => r.querySelector('button').classList.contains('ui-btn-sm')), 'the row rung');
    assert.equal(rows[0].querySelector('button').getAttribute('title'), win.i18t('ins_need_go_nego'), 'the hover says where it goes');
  });
  test('4c all owed, none late — an amber frame', () => {
    const win = world();
    assert.ok(has(win, 'insNeedsHtml'), 'insNeedsHtml is published');
    win.needsYouOf = () => [items[1]];
    assert.match(win.insNeedsHtml(contract()), /class="ins-need is-amber"/);
  });
  test('4d a page\'s skip leaves out what it already says, and an unknown kind is never drawn', () => {
    const win = world();
    assert.ok(has(win, 'insNeedsHtml'), 'insNeedsHtml is published');
    win.needsYouOf = () => [{ kind: 'sign', urgent: false, n: 0 }, { kind: 'mystery', urgent: true }];
    assert.equal(win.insNeedsHtml(contract(), ['sign']), '', 'the signature left out and nothing else drawn');
    assert.ok(!/mystery/.test(win.insNeedsHtml(contract())), 'an unknown kind');
  });
  test('4e it sits under the name block — the party names and the agreement\'s name together — and above the status line', () => {
    const win = world();
    assert.ok(has(win, 'insNeedsHtml'), 'insNeedsHtml is published');
    win.needsYouOf = () => items;
    const d = win.document.createElement('div');
    d.innerHTML = win.insHeadHtml(contract(), { acts: [] });
    const kids = [...d.querySelector('.ins-h').children].map(x => x.className.split(' ')[0]);
    assert.equal(kids.slice(0, 5).join(' > '), 'ins-eb > ins-cp > ins-sub > ins-need > ins-st');
    d.innerHTML = win.insHeadHtml(contract({ name: '' }), { acts: [] });
    const bare = [...d.querySelector('.ins-h').children].map(x => x.className.split(' ')[0]);
    assert.equal(bare.slice(0, 4).join(' > '), 'ins-eb > ins-cp > ins-need > ins-st', 'with no agreement name it follows the party names');
  });
  test('4f the Approvals & signing page leaves the signature out on its signing panel, and only there', () => {
    const f = code(fnOf(AP, 'apInsPaint'));
    assert.ok(/needsSkip:tab==='signatures'\?\['sign'\]:\[\]/.test(f), 'the signatures tab passes its skip');
    assert.ok(code(fnOf(INS, 'insHeadHtml')).includes('insNeedsHtml(c, o.needsSkip)'), 'the head hands the skip on');
  });
});

describe('f395 (5) — the words on each row', () => {
  test('5a their waiting redlines: counted, the days are the asks table\'s own count, and the standard is on the hover only', () => {
    const win = world();
    assert.ok(has(win, 'insNeedWords'), 'insNeedWords is published');
    const since = new Date(Date.now() - 9 * 864e5).toISOString();
    const w = win.insNeedWords(contract(), { kind: 'quiet', urgent: true, n: 3, since });
    assert.equal(w.title, win.i18tn('ins_need_quiet', 3, { n: 3, who: 'Carrefour Kenya' }));
    const days = win._insDaysWord(win._insDaysSince(since));
    assert.ok(w.sub.includes(win.i18t('ins_need_waiting', { days })), 'the line says how long, in the table\'s own number');
    assert.ok(/class="late"/.test(w.sub), 'and says it in the row\'s colour');
    const std = win.i18t('ins_over', { n: win.deskCfg().staleDays });
    assert.ok(!w.sub.includes(std) && w.plain.includes(std), 'the standard rides the hover, never the line');
  });
  test('5b your signature names the Signing tab\'s first thing and counts the rest; nothing in the way says so', () => {
    const win = world();
    assert.ok(has(win, 'insNeedWords'), 'insNeedWords is published');
    win.signReadiness = () => ({ n: 3, holds: [{ kind: 'brief', never: true }, { kind: 'standards-read' }, { kind: 'obligations' }] });
    win.signRowTitle = (c, r) => r.kind === 'brief' ? 'Nothing has briefed this contract' : r.kind;
    const w = win.insNeedWords(contract({ id: 'MK-158' }), { kind: 'sign', urgent: false, n: 3 });
    assert.equal(w.title, win.i18tn('ins_need_sign', 3, { n: 3 }));
    assert.equal(w.plain, 'Nothing has briefed this contract · ' + win.i18tn('ins_more_asks', 2, { n: 2 }));
    const ready = win.insNeedWords(contract({ id: 'MK-158' }), { kind: 'sign', urgent: false, n: 0 });
    assert.equal(ready.title, win.i18t('ins_need_sign_ready'));
    assert.equal(ready.plain, win.i18t('ins_need_sign_clear'));
  });
  test('5c a renewal: decide by the notice deadline, and how far away', () => {
    const win = world();
    assert.ok(has(win, 'insNeedWords'), 'insNeedWords is published');
    const w = win.insNeedWords(contract(), { kind: 'renewal', urgent: false, dd: day(34), d: 34 });
    assert.equal(w.title, win.i18t('ins_need_renew'));
    assert.ok(w.plain.endsWith(win.i18tn('ins_need_in', 34, { n: 34 })), w.plain);
    assert.ok(w.plain.startsWith(win.i18t('ins_need_decide_by', { day: win._insDay(day(34)) })), w.plain);
  });
  test('5d a review with no date says so rather than leaving the line empty; a late one says when it was due', () => {
    const win = world();
    assert.ok(has(win, 'insNeedWords'), 'insNeedWords is published');
    assert.equal(win.insNeedWords(contract(), { kind: 'review', urgent: false, who: 'Amina Otieno', n: 2, due: null }).plain, win.i18t('ins_need_no_due'));
    const late = win.insNeedWords(contract(), { kind: 'review', urgent: true, who: 'Amina Otieno', n: 2, due: day(-2) });
    assert.ok(/class="late"/.test(late.sub) && late.plain.startsWith(win.i18t('ins_need_was_due', { day: win._insDay(day(-2)) })), late.plain);
  });
});

describe('f395 (6) — every button is one door', () => {
  test('6a each kind opens where it is answered', () => {
    const win = world();
    assert.ok(has(win, 'needsYouGo'), 'needsYouGo is published');
    const c = contract();
    win.state.contracts = [c];
    const log = [];
    win.openRedlineWorkbench = id => log.push('nego:' + id);
    win.openWorkspace = id => log.push('room:' + id);
    win.roomGoTab = (x, k) => log.push('tab:' + k);
    win.openDeskSheet = x => log.push('desk:' + x.id);
    for (const k of ['quiet', 'review', 'sign', 'renewal', 'join']) win.needsYouGo(k, 'MK-149');
    assert.equal(log.join(','), 'nego:MK-149,nego:MK-149,room:MK-149,tab:sign,room:MK-149,tab:terms,room:MK-149,desk:MK-149');
    log.length = 0;
    win.needsYouGo('quiet', 'MK-000');
    assert.equal(log.length, 0, 'a contract that is not there opens nothing');
  });
  test('6b the panel\'s one listener presses the door for a checklist button, with the contract it is showing', () => {
    const f = code(fnOf(INS, 'insPaintPanel'));
    assert.ok(/closest\('\[data-ins-need\]'\)/.test(f), 'the listener reads the checklist\'s buttons');
    assert.ok(/needsYouGo\(need\.getAttribute\('data-ins-need'\), cur\.c\.id\)/.test(f), 'and presses needsYouGo with the shown contract');
  });
});

describe('f395 (7) — the words, the clothes, the names', () => {
  const svAt = I18N.search(/\n\s*sv\s*:\s*\{/);
  const EN = I18N.slice(0, svAt), SV = I18N.slice(svAt);
  const hasKey = (k, b) => new RegExp('(^|[\\s,{])' + k + '\\s*:', 'm').test(b);
  test('7a every word the checklist prints is in both books, and every count has both its forms', () => {
    const src = code(INS);
    const once = new Set([...src.matchAll(/i18t\('(ins_need_[a-z_]+)'/g)].map(m => m[1]));
    const counted = new Set([...src.matchAll(/i18tn\('(ins_need_[a-z_]+)'/g)].map(m => m[1]));
    assert.ok(once.size >= 8 && counted.size >= 4, `found ${once.size} words and ${counted.size} counts`);
    const missing = [];
    for (const k of once) for (const [b, B] of [['en', EN], ['sv', SV]]) if (!hasKey(k, B)) missing.push(b + ':' + k);
    for (const k of counted) for (const f of ['_one', '_other']) for (const [b, B] of [['en', EN], ['sv', SV]]) if (!hasKey(k + f, B)) missing.push(b + ':' + k + f);
    assert.deepEqual(missing, []);
  });
  test('7b the clothes are in HaTi\'s sheet, every colour a token, and the button keeps the one light edge', () => {
    const block = (CSS.match(/\.ins-need\{[\s\S]*?\.ins-need \.ui-btn\.ins-need-go\{[^}]*\}/) || [''])[0];
    assert.ok(block, 'the rules exist');
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(block.replace(/\/\*[\s\S]*?\*\//g, '')), 'no literal colour');
    assert.ok(/var\(--st-ruby-fg\)/.test(block) && /var\(--st-amber-fg\)/.test(block), 'the product\'s ruby and amber');
    const btn = (block.match(/\.ins-need \.ui-btn\.ins-need-go\{([^}]*)\}/) || [])[1] || '';
    assert.ok(/color:var\(--nd-fg\)/.test(btn) && !/border/.test(btn), 'the word takes the row\'s colour; the edge stays the platform\'s');
  });
  test('7c the names are published', () => {
    const pub = src => (src.match(/Object\.assign\(window,\s*\{[\s\S]*?\}\);/g) || []).join('\n');
    for (const n of ['needsYouOf', 'needsYouGo', 'hmRenewalDue', 'hmReviewLate', 'HM_SOON_DAYS', 'NEEDS_YOU_ORDER'])
      assert.match(pub(HOME), new RegExp('\\b' + n + '\\b'), n);
    for (const n of ['insNeedsHtml', 'insNeedWords', 'INS_NEED_VERB', 'INS_NEED_GO'])
      assert.match(pub(INS), new RegExp('\\b' + n + '\\b'), n);
  });
});
