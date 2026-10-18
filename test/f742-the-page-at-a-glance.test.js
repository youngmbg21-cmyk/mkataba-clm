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
    const none = glance({ bsLifeData: () => ({ O: { rows: [] }, M: null }), bsAmendMarks: () => [] }).pdCardGlanceHtml({ id: 'MK-1', status: 'Draft' });
    assert.match(none, /<div class="pd-gl-none"><i aria-hidden="true">✓<\/i><span>Nothing is late, and nothing here waits on you\.<\/span><\/div>/);
  });
  test('1d the panel says it beside the page, follows the page, and its doors are the page\'s own', () => {
    assert.match(fnBody(PD, 'pdHolds'), /return pdCardPage\(c\) === 'hist' \? 'hist' : 'card';/);
    assert.match(fnBody(PD, 'pdHeldTopHtml'), /k === 'hist' \? pdHistGlanceHtml\(c\) : k === 'card' \? pdCardGlanceHtml\(c\) : pdChosenHtml\(c\)/);
    const go = fnBody(PD, 'pdHeldGo');
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
