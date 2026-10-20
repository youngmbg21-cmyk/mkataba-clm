'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f742 — A CONTRACT BROUGHT UP AS A PAGE, AS DRAWN (round 7 of the redesign,
   "Read down"; the gaps the owner said "build all" to, 18 Oct 2026)
   (1) Jambo's panel beside the page says that contract: "<ref> at a glance"
       with its stage pill — the obligation late (ours · due …, → Obligations),
       whose move while a negotiation is live (→ Redlines), the newest signed
       amendment (what it changed, the value it set, → Bring it up), the notice
       day — every line the page's own reading (bsLifeData, bsAmendMarks,
       histMoveOf); nothing owed or due: it says so. The head names it; the box
       asks about that contract.
   (2) The page itself, as drawn: the stage is the paper line's pill with its
       round; the id line says when it was signed; "As amended by <ref>" leads
       the value's line; a late next obligation is in the late colour and says
       how late; the foot's first act is "Open the paper".
   (3) Both books.
   (4) PASS 3 (the checker's differences, 18 Oct 2026): the life line's
       sentence says how late a late obligation is ("Next up: Check the
       September invoice (…), 7 days late."), never "by" a day gone — one
       reading with the figure (bsLateDays); the Obligations table says Late
       before Next.
   AT THE PARENT (8dc306a) every test here FAILS.
   The browser half: test/chromium/home-held-contract-verify.js (section 2).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js');
const BS = R('js/views/boardstrip.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const lineOf = (src, start) => { const i = src.indexOf(start); if (i < 0) return ''; return src.slice(i, src.indexOf('\n', i) + 1); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): (?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'),?\s*$/gm)){
    const v = m[2] != null ? m[2] : m[3];
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const say = (k, v) => { const t = BOOKS.en[k]; if (t == null) return k; return t.replace(/\{(\w+)\}/g, (_, x) => (v && v[x] != null) ? v[x] : ''); };
const sayN = (k, n, v) => say(k + (n === 1 ? '_one' : '_other'), Object.assign({ n }, v));
/* the day the small world calls today, and days around it — fixed, so no
   answer here depends on the day the test runs */
const TODAY = '2026-10-19';
const dayAt = n => { const t = new Date(Date.UTC(2026, 9, 19 + n)); return t.toISOString().slice(0, 10); };

/* the strip's own module, whole, in a small world */
function strip(over){
  const ctx = Object.assign({ console, Date, Math, JSON, Number, String, Array, Object, Set, Map, isNaN, isFinite, parseFloat, setTimeout, clearTimeout,
    i18t: say, i18tn: sayN, todayISO: () => TODAY, langLocale: () => 'en-GB',
    contractCurrency: () => 'SEK', fmtMoneyShortIn: (n, cur) => `${cur} ${(n / 1e6).toFixed(2)}M`,
    isMonetary: () => true, canViewValues: () => true, getContract: id => ctx.book[id] || null,
    obligationDue: o => o.due, obState: o => o.status === 'done' ? 'done' : (o.due < TODAY ? 'overdue' : 'open'), obligationParty: o => o.party,
    contractParty: () => 'Lindqvist & Co AB', book: {} }, over || {});
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(BS, ctx);
  return ctx;
}
const SUPPLY = () => ({ id: 'MK-0377', name: 'Supply agreement', counterparty: 'Brightwater Foods', status: 'Signed', value: 6400000, metadata: { renewalTermMonths: 12 },
  obligations: [{ id: 'o1', desc: 'Check the September invoice', party: 'ours', due: dayAt(-7), status: 'open' }, { id: 'o2', desc: 'Food safety certificate', party: 'theirs', due: dayAt(70), status: 'open' }] });

describe('f742 (1) Jambo beside a page: "<ref> at a glance"', () => {
  const FNS = ['pdDaysSince', 'pdShortDay', 'pdCardGlanceRows', 'pdCardGlanceRowHtml', 'pdCardGlanceHtml'];
  const glance = over => {
    const ctx = Object.assign({ Array, JSON, Math, Number, String, Object, Date, isFinite, i18t: say, i18tn: sayN, todayISO: () => TODAY,
      histWhen: iso => ({ day: new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC', ...(iso.slice(0, 4) === TODAY.slice(0, 4) ? {} : { year: 'numeric' }) }) }),
      contractRef: c => c.id, contractStatusTextHtml: c => `<pill ${c.status}>`, negoClauseName: s => s, negoMayStart: () => ({ ok: true }),
      bsLifeData: () => ({ O: { rows: [{ st: 'overdue', what: 'Check the September invoice', due: dayAt(-7), theirs: false }, { st: 'open', what: 'Food safety certificate', due: dayAt(70), theirs: true }] },
        M: { noticeBy: new Date(Date.UTC(2028, 0, 31)), end: new Date(Date.UTC(2028, 3, 30)), auto: true } }),
      histMoveOf: () => null,
      bsAmendMarks: () => [{ d: new Date(Date.UTC(2026, 8, 28)), label: 'Amendment No. 1', ref: 'MK-0377-A1', id: 'MK-0377-A1', value: 'SEK 7.10M' }],
      getContract: id => (id === 'MK-0377-A1' ? { id, amends: [{ clauseNumber: '4', clauseLabel: 'Volumes' }] } : null),
    }, over || {});
    ctx.window = ctx; vm.createContext(ctx);
    /* the days are counted from the small world's today */
    vm.runInContext([lineOf(PD, 'const _pdE = '), lineOf(PD, 'const _pdT = '), lineOf(PD, 'const _pdTn = ')].concat(FNS.map(f => fnBody(PD, f))).join('\n')
      .replace('Date.now()', 'Date.parse("' + TODAY + 'T12:00:00Z")'), ctx);
    return ctx;
  };
  test('1a the rows: the obligation late, the signed amendment, the notice day — in that order', () => {
    for (const f of FNS) assert.ok(fnBody(PD, f), f + ' is defined');
    const g = glance();
    assert.deepEqual(JSON.parse(JSON.stringify(g.pdCardGlanceRows({ id: 'MK-0377', status: 'Signed', metadata: { renewalTermMonths: 12 } }).map(r => r.k))), ['late', 'amend', 'notice']);
  });
  test('1b each row in the reader\'s words, with its door', () => {
    const h = glance().pdCardGlanceHtml({ id: 'MK-0377', status: 'Signed', metadata: { renewalTermMonths: 12 } });
    assert.match(h, /^<div id="pd-cardglance" class="pd-glance pd-cglance" data-pd-held-for="MK-0377"><div class="pd-gl-h"><b>MK-0377 at a glance<\/b><span class="pd-gl-sp"><\/span><pill Signed><\/div>/);
    assert.match(h, /<span>1 obligation is late: Check the September invoice, 7 days\.<small>ours · due 12 Oct<\/small><\/span><button type="button" class="ui-btn ui-btn-sm" data-pd-cg-go="oblig">Obligations<\/button>/);
    assert.match(h, /<span>Amendment No\. 1, signed 28 Sept?, changed 4 Volumes: the value is SEK 7\.10M as amended\.<\/span><button type="button" class="ui-btn ui-btn-sm" data-pd-cg-bring="MK-0377-A1">Bring it up<\/button>/);
    assert.match(h, /<span>Notice by 31 Jan 2028, or it renews for 12 months\.<\/span><\/div>/);
  });
  test('1c a live negotiation says whose move it is, with the Redlines door; nothing to say: it says so', () => {
    const g = glance({ histMoveOf: () => ({ k: 'you', days: 4, party: 'Nordvik', open: 2, theirs: [{}, {}], ours: [] }) });
    const h = g.pdCardGlanceHtml({ id: 'MK-0382', status: 'Under Review' });
    assert.match(h, /<span>Your move: 2 of their changes are open\.<small>4 days<\/small><\/span><button type="button" class="ui-btn ui-btn-sm" data-pd-cg-go="red">Redlines<\/button>/);
    /* RE-POINTED (pass 4): a draft nobody is named to sign says so (the CFO
       agreement's glance, as drawn), so "nothing to say" is a page whose
       signers are named */
    const none = glance({ bsLifeData: () => ({ O: { rows: [] }, M: null, signers: [{ name: 'Amina Otieno' }] }), bsAmendMarks: () => [] }).pdCardGlanceHtml({ id: 'MK-1', status: 'Draft' });
    assert.match(none, /<div class="pd-gl-none"><i aria-hidden="true">✓<\/i><span>Nothing is late, and nothing here waits on you\.<\/span><\/div>/);
  });
  test('1d the panel says it beside the page, follows the page, and its doors are the page\'s own', () => {
    assert.match(fnBody(PD, 'pdHolds'), /return pdCardPage\(c\) === 'hist' \? 'hist' : 'card';/);
    assert.match(fnBody(PD, 'pdHeldTopHtml'), /k === 'hist' \? pdHistGlanceHtml\(c\) : k === 'card' \? pdCardDossierHtml\(c\) : pdChosenHtml\(c\)/);
    /* RE-POINTED (pass 4): the door opens (pdHeldOpen), then lands on its
       target through the one lander (pdHeldGo → pdHeldLand) */
    assert.match(fnBody(PD, 'pdHeldGo'), /const done = pdHeldOpen\(c, w\);\n\s+if \(done && c\) pdHeldLand\(w, c\.id\);/);
    const go = fnBody(PD, 'pdHeldOpen');
    assert.match(go, /w === 'oblig'\) return \(typeof obOpenContract === 'function'\)/);
    assert.match(go, /w === 'history'\) return \(typeof bsStripPage === 'function'\) \? bsStripPage\(c\.id, 'hist'\)/);
    assert.match(go, /w === 'amend'\) return \(typeof pdAmendOpen === 'function'\) \? pdAmendOpen\(c\.id\)/);
    assert.match(fnBody(BS, 'bsPaintHosts'), /window\.pdHeldFollow\(\)/, 'every Board paint asks the panel to follow the page');
    assert.match(PD, /const PD_HELD_CHIPS = \{ card: \['oblig', 'history', 'amend'\], open: \['redline', 'history', 'oblig'\] \};/, 'chips obligations · history · amend, as drawn');
  });
});

describe('f742 (2) the page itself, as drawn', () => {
  test('2a "As amended by <ref>" leads the value\'s line, then what it comes to a year', () => {
    const s = strip({ ov2Model: () => ({ start: new Date(Date.UTC(2026, 4, 1)), end: new Date(Date.UTC(2028, 3, 30)) }),
      effectiveTerm: () => ({ v: 7100000, from: { id: 'MK-0377-A1' } }), contractRef: c => c.id });
    const D = s.bsLifeData(SUPPLY());
    assert.match(D.K.value.sub, /^As amended by MK-0377-A1 · SEK 3\.5\dM a year$/);
  });
  test('2b a late next obligation: the late colour, and how late where whose stood', () => {
    const D = strip().bsLifeData(SUPPLY());
    assert.equal(D.K.next.tone, 'bad');
    assert.equal(D.K.next.sub, 'Check the September invoice · 7 days late');
    assert.equal(D.K.next.tip, 'Check the September invoice · Lindqvist & Co AB', 'whose rides the hover');
    const onTime = strip().bsLifeData({ ...SUPPLY(), obligations: [{ id: 'o2', desc: 'Food safety certificate', party: 'theirs', due: dayAt(70), status: 'open' }] });
    assert.equal(onTime.K.next.tone, ''); assert.equal(onTime.K.next.sub, 'Food safety certificate · Brightwater Foods');
  });
  test('2c the id line says when it was signed; before that, when it was made', () => {
    const s = strip({ contractSignedAt: c => c.signed || null });
    const D = s.bsLifeData({ ...SUPPLY(), signed: '2026-04-28' });
    assert.match(s.bsIdKpiHtml(D), /· signed 28 Apr 2026<\/p>/);
    const D2 = s.bsLifeData({ ...SUPPLY(), status: 'Draft', createdAt: '2026-10-01' });
    assert.match(s.bsIdKpiHtml(D2), /· created 1 Oct 2026<\/p>/);
  });
  test('2d the head\'s stage is the paper line\'s pill with its round; the ref wears its one dress', () => {
    const s = strip({ contractStatusTextHtml: (c, more) => `<span class="room-stat">In Review${more ? ' · ' + more : ''}</span>`, igLineRound: () => 2, refHtml: c => `<span class="hati-ref">${c.id}</span>`, contractRef: c => c.id });
    s.book['MK-0382'] = { id: 'MK-0382', name: 'Master services agreement', counterparty: 'Nordvik', status: 'Under Review' };
    const h = s.bsStripHtml({ id: 'MK-0382', page: 'hist' }, { desk: true });
    assert.match(h, /<span class="bs-ref"><span class="hati-ref">MK-0382<\/span> · Nordvik<\/span><span class="bs-stage"><span class="room-stat">In Review · round 2<\/span><\/span>/);
  });
  test('2e the foot\'s first act is "Open the paper" (Svenska: "Öppna papperet")', () => {
    assert.equal(BOOKS.en.bs_open, 'Open the paper'); assert.equal(BOOKS.sv.bs_open, 'Öppna papperet');
  });
});

describe('f742 (4) pass 3: how late, said once and alike', () => {
  test('4a the caption says how late, as the figure does; an obligation on time keeps "by <day>"', () => {
    const s = strip({ ov2Model: () => ({ start: new Date(Date.UTC(2026, 4, 1)), end: new Date(Date.UTC(2028, 3, 30)) }) });
    const D = s.bsLifeData(SUPPLY());
    assert.match(s.bsCaption(D), /Next up: Check the September invoice \(Lindqvist & Co AB\), 7 days late\.$/);
    assert.equal(s.bsLateDays(D.O, D.O.next), 7, 'one reading for the figure and the sentence');
    const onTime = s.bsLifeData({ ...SUPPLY(), obligations: [{ id: 'o2', desc: 'Food safety certificate', party: 'theirs', due: dayAt(70), status: 'open' }] });
    assert.match(s.bsCaption(onTime), /Next up: Food safety certificate \(Brightwater Foods\), by /);
    assert.equal(s.bsLateDays(onTime.O, onTime.O.next), null);
    const one = s.bsLifeData({ ...SUPPLY(), obligations: [{ id: 'o1', desc: 'Pay', party: 'ours', due: dayAt(-1), status: 'open' }] });
    assert.match(s.bsCaption(one), /\(Lindqvist & Co AB\), 1 day late\.$/);
  });
  test('4b the Obligations table: Late first, then Next', () => {
    const s = strip();
    const h = s.bsLifeHtml(SUPPLY(), { id: 'MK-0377' });
    assert.match(h, /<td>Check the September invoice<span class="bs-late">Late<\/span><span class="bs-nx">Next<\/span><\/td>/);
  });
  test('4c both books', () => {
    for (const k of ['bs_cap_next_late_one', 'bs_cap_next_late_other']){ assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k); }
  });
});

describe('f742 (3) both books', () => {
  test('3a every new word in English and Svenska', () => {
    for (const k of ['pd_cg_late_one', 'pd_cg_late_other', 'pd_cg_days_one', 'pd_cg_days_other', 'pd_cg_since_today', 'pd_cg_ours', 'pd_cg_theirs', 'pd_cg_due',
      'pd_cg_move_you_one', 'pd_cg_move_you_other', 'pd_cg_move_you_plain', 'pd_cg_move_them', 'pd_cg_move_open_one', 'pd_cg_move_open_other',
      'pd_cg_amend', 'pd_cg_amend_changed', 'pd_cg_amend_value', 'pd_cg_amend_changed_value', 'pd_cg_bring',
      'pd_cg_notice_renews_one', 'pd_cg_notice_renews_other', 'pd_cg_notice_renews_plain', 'pd_cg_notice_ends', 'pd_cg_none',
      'bs_id_signed', 'bs_k_next_late_one', 'bs_k_next_late_other']){ assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k); }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   (5) PASS 4 (the checker's differences, 18 Oct 2026, after main moved on):
   the CFO agreement's glance — a private contract's line, the details owed,
   nobody named to sign — so "nothing here waits on you" is said only where it
   is true; the lock in the glance's and the page's head; the chips change
   with the contract; what Jambo read in the drawing's words; what the
   amendment did in its maker's words; no line through a word on the life
   line; Details as drawn (Filing, People, the value and renewal whole, the
   family's rows with Bring it up, its acts on ⋯).
   AT THE LANE'S PREVIOUS COMMIT (dfe908f) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const CT = R('js/views/contract.js');
const FAM = R('js/family.js');
const INDEX = R('index.html');
describe('f742 (5) pass 4: the page owes what it owes, and says it as drawn', () => {
  const FNS5 = ['pdDaysSince', 'pdShortDay', 'pdListSay', 'pdDetWord', 'pdCardGlanceRows', 'pdCardGlanceRowHtml', 'pdCardGlanceHtml'];
  const glance5 = over => {
    const ctx = Object.assign({ Array, JSON, Math, Number, String, Object, Date, isFinite, Intl, i18t: say, i18tn: sayN, todayISO: () => TODAY, langLocale: () => 'en-GB',
      histWhen: () => ({ day: '12 Oct' }), contractRef: c => c.id, contractStatusTextHtml: c => `<pill ${c.status}>`, negoClauseName: s => s, negoMayStart: () => ({ ok: true }),
      bsLifeData: () => ({ O: { rows: [] }, M: null, signers: [] }), histMoveOf: () => null, bsAmendMarks: () => [], getContract: () => null,
      bsPrivateOf: c => c.priv ? { fid: 'board', stream: 'Board', names: ['Maria Lindgren', 'Erik Ström'], first: ['Maria', 'Erik'] } : null,
      bsPrivatePillHtml: c => c.priv ? '<lock Private · Board>' : '',
      detailsOf: c => ({ left: (c.owed || []).length, items: (c.owed || []).map(label => ({ label, open: true })) }),
    }, over || {});
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext([lineOf(PD, 'const _pdE = '), lineOf(PD, 'const _pdT = '), lineOf(PD, 'const _pdTn = '), lineOf(PD, 'const PD_CG_NAMES_MAX = '), lineOf(PD, 'const PD_CG_DET_WORD = ')].concat(FNS5.map(f => fnBody(PD, f))).join('\n'), ctx);
    return ctx;
  };
  const CFO = { id: 'MK-0399', status: 'Draft', priv: true, owed: ['Collective agreement', 'Pension provider'] };
  test('5a the CFO agreement: its private line, 2 details to fill (Fill in), nobody named to sign (Signing) — never "nothing waits on you"', () => {
    const g = glance5();
    assert.deepEqual(JSON.parse(JSON.stringify(g.pdCardGlanceRows(CFO).map(r => r.k))), ['private', 'details', 'signer']);
    const h = g.pdCardGlanceHtml(CFO);
    assert.match(h, /<div class="pd-gl-h"><b>MK-0399 at a glance<\/b><span class="pd-gl-sp"><\/span><pill Draft><lock Private · Board><\/div>/, 'the head: its stage, then its lock');
    assert.match(h, /<span>Private · Board\. Only Maria and Erik open it; every open is recorded\.<\/span>/);
    assert.match(h, /<span>2 details to fill: collective agreement and pension provider\.<\/span><button type="button" class="ui-btn ui-btn-sm" data-pd-cg-go="fill">Fill in<\/button>/);
    assert.match(h, /<span>Nobody is named to sign yet\.<\/span><button type="button" class="ui-btn ui-btn-sm" data-pd-cg-go="sign">Signing<\/button>/);
    assert.doesNotMatch(h, /Nothing is late/);
    /* the record's own boxes said in a sentence (the browser check met "1 detail to fill: effective.") */
    const kt = glance5({ detailsOf: () => ({ left: 2, items: [{ kind: 'kt', key: 'effDate', label: 'Effective', open: true }, { kind: 'kt', key: 'value', label: 'Pay', open: true }] }), fxIsPay: () => true });
    assert.match(kt.pdCardGlanceHtml({ id: 'MK-0399', status: 'Draft' }), /<span>2 details to fill: the start date and base pay\.<\/span>/);
    const named = g.pdCardGlanceRows({ id: 'MK-W19', status: 'Draft', owed: ['Effective date'] });
    assert.deepEqual(JSON.parse(JSON.stringify(named.map(r => r.k))), ['details', 'signer'], 'a plain draft owes its detail and a signer too');
    const signed = glance5({ bsLifeData: () => ({ O: { rows: [] }, M: null, signers: [] }) }).pdCardGlanceRows({ id: 'MK-1', status: 'Signed' });
    assert.deepEqual(JSON.parse(JSON.stringify(signed)), [], 'a signed page owes no signer');
  });
  test('5b the chips change with the contract: owed first (fill in · pay · who can open it), then the page\'s usual steps', () => {
    assert.ok(fnBody(PD, 'pdHeldOwes'), 'the one reading of what a page owes');
    const ctx = { Array, JSON, Math, Number, String, Object, negoExecuted: c => c.status === 'Signed', caChipShut: () => false,
      detailsOf: c => ({ left: (c.owed || []).length }), fxIsPay: c => !!c.pay, payEditOpen: () => true, bsPrivateOf: c => c.priv ? { fid: 'board' } : null, isAdmin: () => true };
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext([lineOf(PD, 'const PD_HELD_CHIPS = '), lineOf(PD, 'const PD_HELD_CHIPS_MAX = '), fnBody(PD, 'pdHeldOwes'), fnBody(PD, 'pdHeldChips')].join('\n'), ctx);
    const ks = c => JSON.parse(JSON.stringify(ctx.pdHeldChips(c, 'card'))).map(x => x.go);
    assert.deepEqual(ks({ id: 'MK-0399', status: 'Draft', owed: ['a', 'b'], pay: true, priv: true }), ['fill', 'pay', 'access'], 'the CFO agreement, as drawn');
    assert.deepEqual(ks({ id: 'MK-0377', status: 'Signed' }), ['oblig', 'history', 'amend'], 'the signed supply agreement, as drawn');
    ctx.isAdmin = () => false;
    assert.deepEqual(ks({ id: 'MK-0399', status: 'Draft', owed: ['a'], pay: true, priv: true }), ['fill', 'pay', 'redline'], 'who may open it is an admin\'s door');
    assert.match(PD, /const PD_HELD_CHIP_WORD = \{ pay: 'pd_chip_pay', access: 'pd_chip_access' \};/);
    const open = fnBody(PD, 'pdHeldOpen');
    assert.match(open, /if \(w === 'fill'\) return pdFillOpen\(c\.id\);/);
    assert.match(open, /if \(w === 'sign'\) return pdSignOpen\(c\.id\);/);
    assert.match(open, /if \(w === 'pay'\) return \(typeof payEditOpen === 'function'\) \? payEditOpen\(c\.id\) : false;/);
    assert.match(open, /openSettingsAt\('company', 'stream:' \+ P\.fid\)/);
  });
  test('5c a private page wears its lock beside its stage, the one pill builder', () => {
    const s = strip({ contractStatusTextHtml: () => '<span class="room-stat">Drafting</span>', igLineRound: () => 0, refHtml: c => c.id, contractRef: c => c.id,
      streamIsPrivate: f => f === 'board', regStreamName: () => 'Board', privateStreamsMap: () => ({ board: { on: true, ids: ['u1', 'u2'] } }), privateStreamIds: p => p.ids,
      getUsers: () => [{ id: 'u1', name: 'Maria Lindgren' }, { id: 'u2', name: 'Erik Ström' }], icon: () => '<svg/>' });
    s.book['MK-0399'] = { id: 'MK-0399', name: 'Employment agreement', counterparty: 'Chief financial officer', status: 'Draft', folder: 'board' };
    const P = s.bsPrivateOf(s.book['MK-0399']);
    assert.deepEqual(JSON.parse(JSON.stringify(P)), { fid: 'board', stream: 'Board', names: ['Maria Lindgren', 'Erik Ström'], first: ['Maria', 'Erik'] });
    const h = s.bsStripHtml({ id: 'MK-0399', page: 'ov' }, { desk: true });
    assert.match(h, /<span class="bs-stage"><span class="room-stat">Drafting<\/span><\/span><span class="bs-lockp" title="[^"]*"><svg\/>Private · Board<\/span>/);
    assert.match(s.bsPrivatePillHtml(s.book['MK-0399'], { short: true }), /<svg\/>Private<\/span>$/, 'beside the stream\'s own name it says only Private');
    assert.equal(s.bsPrivateOf({ id: 'X', folder: 'board', _codeNamed: true }), null, 'a code-named stand-in says nothing more');
  });
  test('5d what Jambo read, in the drawing\'s words: "See the risk ›" for one, "7 of 8", no first-due line', () => {
    assert.equal(BOOKS.en.bs_jb_risk_go, 'See the risk ›'); assert.ok(BOOKS.sv.bs_jb_risk_go);
    assert.equal(BOOKS.en.bs_jb_std_n, '{k} of {n}'); assert.equal(BOOKS.sv.bs_jb_std_n, '{k} av {n}');
    const J = fnBody(BS, 'bsJamboHtml') || BS;
    assert.match(J, /D\.riskN === 1 \? 'bs_jb_risk_go' : 'bs_jb_risks_go'/);
    assert.match(J, /\[bsT\('bs_jb_ob_sides', \{ a: O\.ours, b: O\.theirs \}\)\] : \[bsT\('bs_jb_ob_none'\)\]/);
    assert.doesNotMatch(J.replace(/\/\*[\s\S]*?\*\//g, ''), /bs_jb_ob_first/);
  });
  test('5e what the amendment did, in its maker\'s words — the glance and the caption, never a purpose guessed', () => {
    const g = glance5({ bsAmendMarks: () => [{ d: new Date(Date.UTC(2026, 8, 28)), label: 'Amendment No. 1', id: 'MK-0377-A1', value: 'SEK 7.10M' }],
      getContract: id => (id === 'MK-0377-A1' ? { id, relationNote: 'raised the yearly volume by 10%' } : null), bsLifeData: () => ({ O: { rows: [] }, M: null, signers: [{ name: 'X' }] }) });
    const h = g.pdCardGlanceHtml({ id: 'MK-0377', status: 'Signed' });
    assert.match(h, /<span>Amendment No\. 1, signed 12 Oct: “raised the yearly volume by 10%” — the value is SEK 7\.10M as amended\.<\/span>/);
    const s = strip({ ov2Model: () => ({ start: new Date(Date.UTC(2026, 4, 1)), end: new Date(Date.UTC(2028, 3, 30)) }) });
    s.bsAmendMarks = () => [{ d: new Date(Date.UTC(2026, 8, 28)), label: 'Amendment No. 1', id: 'MK-0377-A1', value: 'SEK 7.10M' }];
    s.book['MK-0377-A1'] = { id: 'MK-0377-A1', relationNote: 'raised the yearly volume by 10%' };
    assert.match(s.bsCaption(s.bsLifeData(SUPPLY())), /Amendment No\. 1 \(28 Sept? 2026\): “raised the yearly volume by 10%”\./);
    s.book['MK-0377-A1'] = { id: 'MK-0377-A1' };
    assert.match(s.bsCaption(s.bsLifeData(SUPPLY())), /Amendment No\. 1 took effect on 28 Sept? 2026 and set the value to SEK 7\.10M\./, 'no note: the value it set');
  });
  test('5f no line runs through a word: an amendment\'s name sits before its diamond, and a label a later mark\'s line would cross moves up', () => {
    const U = (y, m, d) => new Date(Date.UTC(y, m, d));
    const s = strip({ ov2Model: () => ({ t0: U(2026, 3, 1), t1: U(2029, 4, 31), today: U(2026, 9, 19), start: U(2026, 4, 1), end: U(2028, 3, 30), signed: U(2026, 3, 28), noticeBy: U(2028, 0, 31), auto: true, bands: [] }) });
    s.bsAmendMarks = () => [{ d: U(2026, 8, 28), label: 'Amendment No. 1', id: 'MK-0377-A1', ref: 'MK-0377-A1', value: 'SEK 7.10M' }];
    for (const W of [700, 760, 900, 1100]){
      const D = s.bsLifeData(SUPPLY());
      const svg = s.bsChartSvg(D, W);
      const labels = [...svg.matchAll(/<text class="bs-lab[^"]*" x="([\d.-]+)" y="(\d+)" text-anchor="(start|end)">([^<]+)<\/text>/g)]
        .map(m => { const x = +m[1], w = m[4].length * 6.4 + 6; return { t: m[4], y: +m[2], s0: m[3] === 'end' ? x - w : x, s1: m[3] === 'end' ? x : x + w }; });
      const ticks = [...svg.matchAll(/<line class="bs-tick[^"]*" x1="([\d.-]+)" y1="([\d.-]+)" x2="[\d.-]+" y2="([\d.-]+)">/g)].map(m => ({ x: +m[1], y1: +m[2], y2: +m[3] }));
      const am = labels.find(l => /^Amendment/.test(l.t));
      assert.ok(am, 'the amendment is named at ' + W);
      for (const L of labels) for (const T of ticks)
        assert.ok(!(T.x > L.s0 + 2 && T.x < L.s1 - 2 && T.y1 < L.y - 2 && T.y2 > L.y - 10), `${W}px: a line at ${T.x} runs through "${L.t}"`);
    }
  });
  test('5g Details as drawn: Filing at rest, People on this contract, two columns; the value and renewal whole; the family\'s rows; its acts on ⋯', () => {
    const P = fnBody(CT, 'ovSheetPaint');
    assert.match(P, /<div class="ov-det2"><div class="ov-det2-l"><div id="kt-people"><\/div><div id="kt-side"><\/div><\/div><div class="ov-det2-r"><div id="kt-filing"><\/div><\/div><\/div>/);
    assert.match(P, /ovPeopleRestPaint\(c\); ovFilingRestPaint\(c\);/);
    const ctx = { Array, JSON, String, Object, Intl, i18t: say, esc: s => String(s), langLocale: () => 'en-GB', FOLDERS: { proc: { name: 'Procurement' }, board: { name: 'Board' } },
      bsPrivateOf: c => c.folder === 'board' ? { fid: 'board', stream: 'Board', names: ['Maria Lindgren', 'Erik Ström'], first: ['Maria', 'Erik'] } : null,
      bsPrivatePillHtml: () => '<lock Private>', mayReFile: () => true, isAdmin: () => true, regCatLabel: k => ({ supplier: 'Supplier' })[k] || k };
    ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fnBody(CT, 'ovFilingRestHtml'), ctx);
    const f = ctx.ovFilingRestHtml({ id: 'MK-0377', folder: 'proc', metadata: { category: 'supplier' } });
    assert.match(f, /<h5>Filing<\/h5>/);
    assert.match(f, /<span class="ov-fk">Stream<\/span><span class="ov-fv"><b>Procurement<\/b><\/span><span class="ov-fa"><button type="button" class="ui-btn ui-btn-sm" data-ov-fil-refile="MK-0377">Re-file<\/button><\/span>/);
    assert.match(f, /<span class="ov-fk">Category<\/span><span class="ov-fv"><b>Supplier<\/b><\/span>/);
    assert.match(f, /<div id="kt-codename"><\/div><\/section>$/, 'the code-name line is Filing\'s third row');
    const pv = ctx.ovFilingRestHtml({ id: 'MK-0399', folder: 'board', metadata: {} });
    assert.match(pv, /<b>Board<\/b><lock Private><span class="ov-fs">Only the people named on Board open it: Maria Lindgren and Erik Ström\. Admins too, only if named\. Every open is recorded in History under Opens\.<\/span>/);
    assert.match(pv, /data-ov-fil-access="MK-0399">Who may open it<\/button>/);
    ctx.mayReFile = () => false;
    assert.match(ctx.ovFilingRestHtml({ id: 'MK-1', folder: 'proc', metadata: {} }), /data-ov-fil-refile="MK-1" disabled title="[^"]+">Re-file/, 'grey with the reason, never a dead button in a live one\'s clothes');
    assert.match(fnBody(CT, 'cnRowHtml'), /<div class="ov-cn ov-frow" data-cn-row>/);
    assert.match(fnBody(CT, 'ovPeopleRestHtml'), /i18t\('ov_people_h'\)[\s\S]*i18t\('ov_people_note'\)/);
    const V = fnBody(CT, 'ktFieldCell');
    assert.match(V, /<span class="ov-amd ov-amd-signed">\$\{esc\(i18t\('ov_value_signed',\{ v:shortOf\(c\) \}\)\)\}<\/span>/);
    assert.match(INDEX, /#ov-ess \.ov-amd-signed\{ display:block; \}\n\s+#ov-ess \.ov-rn-by\{ display:none; \}/);
    const RN = fnBody(CT, 'ovEssRenewalRead');
    assert.match(RN, /i18tn\('ov_rn_months',n,\{ n \}\)/); assert.match(RN, /<span class="ov-rn-by">/);
    assert.match(fnBody(FAM, 'familyDrawnRowsHtml'), /data-fam-bring="\$\{_famAttr\(x\.id\)\}">\$\{_famEsc\(i18t\('pd_cg_bring'\)\)\}<\/button>/);
    assert.match(CT, /renderFamilySection\(c,\{bare:true,drawn:true\}\)/);
    assert.match(fnBody(FAM, 'familyActs'), /k:'create'[\s\S]*k:'add'[\s\S]*k:'check'[\s\S]*k:'unlink'/);
    /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier" with 4b): the family's
       acts left the strip's ⋯ for the dossier's Family fold beside the paper */
    const PDS = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js', 'paperdesk.js'), 'utf8');
    assert.ok(!/data-bs-famact=/.test(BS), 'the strip\'s ⋯ draws no family acts');
    assert.match(PDS, /data-pd-ds-famact="\$\{_pdE\(a\.k\)\}"/);
    assert.match(PDS, /familyActRun\(cc, dfa\.getAttribute\('data-pd-ds-famact'\)/);
  });
  test('5h both books', () => {
    for (const k of ['pd_cg_private', 'pd_cg_private_plain', 'pd_cg_details_one', 'pd_cg_details_other', 'pd_cg_details_plain_one', 'pd_cg_details_plain_other', 'pd_cg_fill', 'pd_cg_signer', 'pd_cg_signing',
      'pd_cg_amend_note', 'pd_cg_amend_note_value', 'pd_chip_pay', 'pd_chip_access', 'bs_cap_amend_note', 'bs_private_pill', 'bs_private_pill_short', 'bs_jb_risk_go',
      'cn_row_none_w', 'cn_row_none_sub', 'ov_fil_h', 'ov_fil_stream', 'ov_fil_category', 'ov_fil_refile', 'ov_fil_refile_no', 'ov_fil_access', 'ov_fil_private_sub', 'ov_fil_private_sub_plain',
      'ov_people_h', 'ov_people_note', 'ov_people_owner', 'ov_people_none', 'ov_value_amended_w', 'ov_value_signed', 'ov_rn_by', 'ov_rn_months_one', 'ov_rn_months_other',
      'fa_related_none', 'fa_signed_on', 'bs_fam_acts', 'pd_cg_det_effdate', 'pd_cg_det_value', 'pd_cg_det_pay', 'pd_cg_det_counterparty']){ assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k); }
  });
});
