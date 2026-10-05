/* f522 — RISK CARD TITLES, AND A RISK CARD GOES TO ITS CLAUSE
   (Young, 5 Oct 2026: "Build both fixes with your recommendations", and the
   same day: "where possible, when I click on a risk card it should take me to
   the clause being impacted just like in redline cards")
   ============================================================================
   The browser half is risk-card-titles-verify; this pins, fast:

     (1) THE CARD HOLDS THE COLUMN'S WIDTH — .rk-row and .rk-ce-card are
         minmax(0,1fr), so a one-line title can never set the card's width;
     (2) THE BRIEF NAMES EACH POINT — both of the brief's lists ask for a
         required `title` with one shared description, and the prompt says so;
         the light list copy carries it;
     (3) THE READERS CARRY IT — docXrayBriefWatch/docXrayBriefOdd give
         `title`, '' when absent (both shapes);
     (4) THE CARD WEARS IT — a titled brief item shows its short title, `say`
         holds the sentence, the key is still the sentence's; an untitled
         item keeps today's shape;
     (5) ONE READER OF WHAT A RISK IS ABOUT — _rkTopicText is what cover,
         Edit's lookup, de-duplication, the audit line and provenance read;
     (6) THE HOVER AND THE OPENED WHY print the whole sentence;
     (7) "WORTH A LOOK" leads with the title;
     (8) ONE CLAUSE LOOKUP — riskClauseOf, asked by Edit and by the press;
     (9) THE HEAD IS THE DOOR — data-rk-act="go" on open and covered rows,
         never on a missing risk or a discarded row; nothing draws the stale
         data-rk-go;
    (10) THE PRESS — lights the card, flashes the quote inside the clause,
         and where HaTi cannot tell says rk_go_none as a warning (both books).

   Run: node --test test/f522-risk-card-titles.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const J = v => JSON.parse(JSON.stringify(v));
const SRC = read('js/risks.js');
const CM = read('js/clausemodel.js');
const CV = read('js/views/contract.js');
const SRV = read('server/server.js');
const I18N = read('js/i18n.js');
const KINDS = CM.slice(CM.indexOf('const CLAUSE_KINDS = ['), CM.indexOf('/* ---------- reading a heading'));
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); return src.slice(i, src.indexOf('\n}\n', i) + 2); };
const BRIEF_READERS = fnSrc(CV, 'docXrayBriefWatch') + fnSrc(CV, 'docXrayBriefOdd');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

function load(extra = {}){
  const ctx = { console, ...extra };
  ctx.window = ctx;
  ctx.persist = () => {};
  ctx.document = ctx.document || { getElementById: () => null, querySelector: () => null };
  vm.createContext(ctx);
  vm.runInContext(KINDS + '\nObject.assign(window, { CLAUSE_KINDS, clauseKindByKey, clauseKind, ruleKind });', ctx);
  vm.runInContext(BRIEF_READERS, ctx);
  vm.runInContext(SRC, ctx);
  return ctx;
}
const SENT = "The contract can be ended by either side with just 30 days' notice, with no minimum term.";
const SENT2 = 'Very short 12-hour window to report delivery problems before the delivery is treated as correct.';
const briefContract = () => ({ id: 'K1', changes: [], scan: { findings: [], dismissed: [] },
  _brief: { data: {
    watchouts: [{ point: SENT, title: "Ended on 30 days' notice", why: 'You could lose the account at short notice.', wording: true }],
    unusual: [{ point: SENT2, why: 'Unusual.', wording: true }, 'A bare old unusual term that is long enough.'],
  } } });

describe('(1) the card holds the column\'s width', () => {
  test('.rk-row and .rk-ce-card are one minmax(0,1fr) column', () => {
    assert.match(SRC, /\.rk-row\{display:grid;grid-template-columns:minmax\(0,1fr\);/);
    assert.match(SRC, /\.rk-ce-card\{display:grid;grid-template-columns:minmax\(0,1fr\);/);
    assert.doesNotMatch(SRC, /\.rk-row[^{]*\{[^}]*!important/);
  });
});

describe('(2) the brief names each point', () => {
  test('BRIEF_TITLE is one shared description, on both lists, required', () => {
    assert.match(SRV, /const BRIEF_TITLE = 'A short name for this point, two to six words/);
    const i = SRV.indexOf("name: 'contract_brief'");
    const tool = SRV.slice(i, SRV.indexOf('const prompt', i));
    assert.equal((tool.match(/title: \{ type: 'string', description: BRIEF_TITLE \}/g) || []).length, 2);
    assert.equal((tool.match(/required: \['point', 'title', 'why', 'wording'\]/g) || []).length, 2);
    const p = SRV.slice(SRV.indexOf('const prompt', i), SRV.indexOf('\n', SRV.indexOf('const prompt', i)));
    assert.match(p, /short title of two to six words/);
  });
  test('the light list copy carries the title', () => {
    const l = SRV.slice(SRV.indexOf('const briefLiteOf'), SRV.indexOf('const HEAVY'));
    assert.match(l, /title: String\(w\.title \|\| ''\)/);
    assert.match(l, /title: '', quote: ''/);
  });
});

describe('(3) the readers carry it', () => {
  test('watchouts and both shapes of unusual terms', () => {
    const w = load();
    const c = briefContract();
    assert.equal(J(w.docXrayBriefWatch(c))[0].title, "Ended on 30 days' notice");
    const odd = J(w.docXrayBriefOdd(c));
    assert.equal(odd[0].title, '');
    assert.equal(odd[1].title, '');
    assert.equal(odd[1].say, 'A bare old unusual term that is long enough.');
  });
});

describe('(4) the card wears it', () => {
  test('a titled item: short title, sentence in say, key on the sentence', () => {
    const w = load();
    const items = J(w.riskItemsOf(briefContract()));
    const t = items.find(x => x.src === 'brief');
    assert.equal(t.title, "Ended on 30 days' notice");
    assert.equal(t.say, SENT);
    assert.equal(t.key, w.riskKeyOf('brief', SENT));
  });
  test('an untitled item keeps today\'s shape', () => {
    const w = load();
    const o = J(w.riskItemsOf(briefContract())).find(x => x.src === 'odd');
    assert.equal(o.title, SENT2);
    assert.equal(o.say, '');
  });
});

describe('(5) one reader of what a risk is about', () => {
  test('_rkTopicText is read by cover, lookup, de-duplication, audit and provenance', () => {
    assert.match(SRC, /const _rkTopicText = it => \(it && it\.src !== 'scan' && it\.say\) \? it\.say : String\(\(it && it\.title\) \|\| ''\);/);
    const body = n => fnSrc(SRC, n);
    assert.match(body('riskCoverOf'), /_rkKind\(_rkTopicText\(it\)\)/);
    assert.match(body('riskClauseOf'), /_rkKind\(_rkTopicText\(it\)\)/);
    assert.match(body('riskItemsOf'), /_rkNorm\(_rkTopicText\(it\)\)/);
    assert.match(body('riskFiled'), /_rkTopicText\(it\)\.slice\(0, 160\)/);
    assert.match(SRC, /const riskProvenance = it => 'Copilot — Risk scan: ' \+ _rkTopicText\(it\)/);
    for (const n of ['riskCoverOf', 'riskClauseOf', 'riskEditTarget'])
      assert.doesNotMatch(strip(body(n)), /_rkKind\(it\.title\)/, n);
  });
  test('a titled item is recorded with its sentence', () => {
    const w = load();
    const it = J(w.riskItemsOf(briefContract())).find(x => x.src === 'brief');
    assert.equal(w.riskProvenance(it), 'Copilot — Risk scan: ' + SENT);
  });
});

describe('(6) the hover and the opened Why print the sentence', () => {
  test('a titled card', () => {
    const w = load();
    const c = briefContract();
    const it = w.riskItemsOf(c).find(x => x.src === 'brief');
    let html = w._rkRowHtml ? w._rkRowHtml(c, it) : vm.runInContext('_rkRowHtml', w)(c, it);
    assert.ok(html.includes('title="' + SENT.replace(/'/g, '&#39;') + '"') || html.includes('title="' + SENT + '"'), 'the hover is the sentence');
    vm.runInContext(`_rk.whyOpen[${JSON.stringify(it.key)}] = true`, w);
    html = vm.runInContext('_rkRowHtml', w)(c, it);
    assert.match(html, /<span class="rk-why-full">The contract can be ended/);
    assert.match(html, />Ended on 30 days(&#39;|')? notice</);
  });
});

describe('(7) Worth a look leads with the title', () => {
  test('_xrBriefMark and _xrOddMark lead with it', () => {
    assert.match(CV, /const _xrBriefMark = w => \(\{ k:'brief', grade:'amber', tag:i18t\('xr_m_brief'\), lead:w\.title\|\|'',/);
    assert.match(CV, /const _xrOddMark = u => \(\{ k:'odd', grade:'steel', tag:i18t\('xr_m_odd'\), lead:u\.title\|\|'',/);
  });
});

describe('(8) one clause lookup', () => {
  test('riskEditTarget and riskGoClause both ask riskClauseOf', () => {
    assert.match(fnSrc(SRC, 'riskEditTarget'), /riskClauseOf\(c, it\)/);
    assert.match(fnSrc(SRC, 'riskGoClause'), /riskClauseOf\(c, it\)/);
    assert.doesNotMatch(strip(fnSrc(SRC, 'riskEditTarget')), /rlPbFindClause|_rkAnchorClause/);
    assert.match(SRC, /riskClauseOf, riskGoClause,/);
  });
});

describe('(9) the head is the door', () => {
  test('open rows and covered rows, never a missing risk or a discarded row', () => {
    const w = load();
    const c = briefContract();
    const it = w.riskItemsOf(c).find(x => x.src === 'brief');
    const row = vm.runInContext('_rkRowHtml', w);
    assert.match(row(c, it), /class="rk-head is-door" data-rk-act="go" role="button" tabindex="0"/);
    assert.doesNotMatch(row(c, { ...it, missing: true }), /data-rk-act="go"/);
    const cov = vm.runInContext('_rkCoveredHtml', w);
    vm.runInContext('_rk.showCovered.K1 = true', w);
    assert.match(cov(c, [{ ...it, covered: { id: 'CHG-1', clause: 'Term', clauseId: 'cl3' } }]), /data-rk-act="go"/);
    assert.doesNotMatch(cov(c, [{ ...it, covered: { id: 'CHG-1', clause: 'Term', clauseId: '' } }]), /data-rk-act="go"/);
    const pile = fnSrc(SRC, 'rlRisksPileHtml');
    const gone = pile.slice(pile.indexOf('showGone ? gone.map'));
    assert.doesNotMatch(gone, /data-rk-act="go"|_rkHeadHtml/);
    assert.doesNotMatch(strip(SRC), /data-rk-go|data-rk-target/);
  });
});

describe('(10) the press', () => {
  test('lights the card, flashes inside the clause, and says where it cannot', () => {
    const toasts = [], flashes = [];
    const linked = [];
    const clauseEl = { id: 'clause', scrollIntoView: () => {} };
    const rowEl = { classList: { add: k => linked.push(k) } };
    let haveClause = true;
    const page = {
      querySelector: sel => (haveClause && sel.startsWith('#rl-doc [data-clause=')) ? clauseEl : null,
      querySelectorAll: () => [],
    };
    const w = load({
      toast: (m, k) => toasts.push([m, k]),
      scrollToQuote: (q, o) => { flashes.push(o && o.root); return true; },
      CSS: { escape: v => v },
      document: { getElementById: id => id === 'view-redline' ? page : null,
        querySelector: sel => sel.startsWith('#rl-risks') ? rowEl : null },
      negoClauseList: () => [{ clauseId: 'cl3', title: 'Termination', headingText: '3. Termination', text: 'notice' }],
      rlPbFindClause: () => ({ clauseId: 'cl3' }),
    });
    const c = briefContract();
    c._brief.data.watchouts[0].quote = "Either party may end this agreement on thirty (30) days' written notice.";
    const key = w.riskKeyOf('brief', SENT);
    assert.equal(w.riskGoClause(c, key), true);
    assert.deepEqual(linked, ['is-linked']);
    assert.equal(flashes[0], clauseEl, 'the quote is looked for inside the clause');
    haveClause = false;
    assert.equal(w.riskGoClause(c, key), false);
    assert.deepEqual(toasts.at(-1), [w.i18t ? w.i18t('rk_go_none') : toasts.at(-1)[0], 'warn']);
    assert.match(fnSrc(SRC, 'riskGoClause'), /toast\(_rkT\('rk_go_none'\), 'warn'\)/);
  });
  test('the sentence is in both books', () => {
    assert.match(I18N, /rk_go_none: "HaTi can't tell which clause this is about\. Edit lets you choose it\.",/);
    assert.match(I18N, /rk_go_none: 'HaTi kan inte avgöra vilken klausul det gäller\. Med Redigera kan du välja den\.',/);
  });
  test('Enter and Space on the head do what a press does', () => {
    assert.match(SRC, /closest\('#rl-risks \[data-rk-act="go"\]'\)/);
    assert.match(SRC, /if \(act === 'go'\)\{ riskGoClause\(c, key\); return; \}/);
  });
});
