'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f800 — A PIECE IN ONE ROW (round 23's gaps, 18 Oct 2026: the picked "Open
   in place" draws each prepared piece as its room's tag, what it is in a few
   words, its reference and one sentence, then Look · its act · Put away)
   (1) What it is: "<who>’s answer", "A read of <who>", "A chase to <who>",
       "N imports to check" (agPieceTitle), with an import's day as its
       reference (agPieceRefHtml) — and the English possessive of a name that
       ends in s ("Brightwater Foods’") said right (agPoss).
   (2) One sentence of what it holds, off the readings it already carries
       (agPieceLine): "Read on arrival: a brief, 2 obligations found, …",
       "“the insurance certificate” is 5 days late. The first chase is ready,
       to the address on the contract.", "3 files wait for your check: …",
       "Answers to their N redlines, read against our standards: …".
   (3) Its ONE act, named for what it does (agRowActOf): Answer on Redlines,
       Fill in N details (a new contract's read while details are owed),
       Decide the renewal, Send the chase, Check the N files.
   (4) The Counter's row draws exactly Look · that act · Put away, and Look
       on a chase draws the letter only (agLookHtml → agChaseLookHtml).
   (5) The words, in both books.
   (6) SECOND PASS (the checker against the drawing, 18 Oct 2026): the chase
       reads "Their insurance certificate is 5 days late." (chaseWhatOf); a
       Swedish short date ending in its own stop does not end the sentence
       twice ("27 nov.."); the possessive is said in the reader's language
       ("Saras", "Kettle & Co:s"), so both books fill the same holes; the
       piece's name is never cut on the Counter (the reference goes under).
   AT THE PARENT (8dc306a) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CN = R('js/views/counter.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const constLine = (src, name) => { const m = src.match(new RegExp('^(const|let) ' + name + '\\b[^\\n]*$', 'm')); return m ? m[0] : ''; };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const day = n => iso(n).slice(0, 10);

function staged(){
  const { buildWorld, supplyContract } = require('./world');
  const { win } = buildWorld({ negotiationView: true, copilotRead: true, desk: true, agents: true });
  const late = supplyContract({ id: 'MK-PR-1', counterparty: 'Kettle & Co', status: 'Signed', counterpartyEmail: 'ops@kettle.example',
    obligations: [{ id: 'ob1', desc: 'the insurance certificate', due: day(-5), party: 'theirs' }] });
  const bare = supplyContract({ id: 'MK-PR-2', counterparty: 'Nordvik Logistik',
    changes: [{ id: 'CHG-1', status: 'pending', authorSide: 'counterparty', clauseId: 'cl_a', clauseLabel: '7. Liability cap', newText: 'Capped at 200%.', createdAt: iso(-4) },
      { id: 'CHG-2', status: 'pending', authorSide: 'counterparty', clauseId: 'cl_b', clauseLabel: '11. Payment terms', newText: 'Within 60 days.', createdAt: iso(-4) }] });
  const paper = supplyContract({ id: 'MK-PR-3', counterparty: 'Baltic Freight', _hasBrief: true,
    triage: { at: iso(-1), by: 'Wanjiru Kamau', steps: { brief: { ok: true }, playbook: { ok: true, dev: 1, miss: 0, cats: ['Notice period'] },
      oblig: { ok: true, found: [{ desc: 'a' }, { desc: 'b' }] } } } });
  const imp = ['Lease Göteborg.pdf', 'NDA Kettle 2023.docx', 'Freight terms scan.pdf'].map((f, i) => supplyContract({ id: 'MK-PR-I' + i, counterparty: 'Imported ' + i,
    upload: { fileName: f }, migration: { batch: 'B-12', importedAt: iso(-6), importedBy: 'Wanjiru Kamau', needsReview: true, blocked: null } }));
  win.state.contracts = [late, bare, paper, ...imp];
  const D = win.agentsData();
  const its = win.AG_KEYS.flatMap(k => D.agents[k].ready);
  return { win, its, of: k => its.find(i => i.kind === k) };
}

describe('f800 (1) what it is, in a few words', () => {
  test('1a the drawn titles', () => {
    const { win, of } = staged();
    assert.equal(win.agPieceTitle(of('answer')), 'Nordvik Logistik’s answer');
    assert.equal(win.agPieceTitle(of('read')), 'A read of Baltic Freight');
    assert.equal(win.agPieceTitle(of('chase')), 'A chase to Kettle & Co');
    assert.equal(win.agPieceTitle(of('import')), '3 imports to check');
  });
  test('1b a contract\'s reference is the one dress; an import\'s is its day', () => {
    const { win, of } = staged();
    assert.match(win.agPieceRefHtml(of('chase')), /MK-PR-1/);
    assert.match(win.agPieceRefHtml(of('import')), /^Import of /);
  });
  test('1c the English possessive of a name', () => {
    const { win } = staged();
    assert.equal(win.agPoss('Sara'), 'Sara’s');
    assert.equal(win.agPoss('Jonas'), 'Jonas’s');
    assert.equal(win.agPoss('Brightwater Foods'), 'Brightwater Foods’');
  });
});

describe('f800 (2) one sentence of what it holds', () => {
  test('2a a new contract\'s read, off the arrival reading and Fill in\'s own count', () => {
    const { win, of } = staged();
    const line = win.agPieceLine(of('read'));
    assert.match(line, /^Read on arrival: a brief, 2 obligations found/);
    assert.match(line, /1 departure from our standards \(notice period\)\.$/);
  });
  test('2b a chase: how late, and that the first chase is ready to the address on the contract', () => {
    const { win, of } = staged();
    /* RE-POINTED 18 Oct 2026 (second pass): as drawn, "Their insurance certificate is 5 days late." */
    assert.equal(win.agPieceLine(of('chase')), 'Their insurance certificate is 5 days late. The first chase is ready, to the address on the contract.');
  });
  test('2c an import names the files that wait', () => {
    const { win, of } = staged();
    assert.match(win.agPieceLine(of('import')), /^3 files wait for your check: .+, .+ and .+\.$/);
    assert.match(win.agPieceLine(of('import')), /Lease Göteborg\.pdf/);
  });
  test('2d their answer: each ask, by its clause, as the co-pilot reads it', () => {
    const { win, of } = staged();
    const line = win.agPieceLine(of('answer'));
    assert.match(line, /^Answers to their 2 redlines, read against our standards: /);
    assert.match(line, /clause 7 \(Liability cap\)/);
    assert.match(line, /clause 11 \(Payment terms\)/);
  });
  test('2e it reads, it does not write: the book is byte-identical after the words are read', () => {
    const { win, its } = staged();
    const before = JSON.stringify(win.state.contracts);
    its.forEach(it => { win.agPieceTitle(it); win.agPieceLine(it); win.agPieceRefHtml(it); win.agRowActOf(it); });
    assert.equal(JSON.stringify(win.state.contracts), before);
  });
});

describe('f800 (3) its one act', () => {
  test('3a named for what it does, as drawn', () => {
    const { win, of } = staged();
    const a = k => { const x = win.agRowActOf(of(k)); return x && x.act + ':' + x.label; };
    assert.equal(a('answer'), 'nego:Answer on Redlines');
    assert.equal(a('chase'), 'chase:Send the chase');
    assert.equal(a('import'), 'import:Check the 3 files');
  });
  test('3b a new contract\'s read leads with Fill in while details are owed, else its lead', () => {
    const { win, of } = staged();
    const it = of('read');
    win.detailsOf = () => ({ left: 3, all: 5, live: true });
    const x = win.agRowActOf(it);
    assert.equal(x.act + ':' + x.label, 'fill:Fill in 3 details');
    win.detailsOf = () => ({ left: 0, all: 5, live: true });
    assert.equal(win.agRowActOf(it).act, 'brief', 'nothing owed: Read the brief leads, as the panel does');
  });
  test('3c Fill in is the one door every "fill in" press passes', () => {
    const AG = R('js/views/agents.js');
    assert.match(fnBody(AG, 'agRunAct'), /if \(act === 'fill'\) return agGo\('details', it\.cid\);/);
    assert.match(fnBody(AG, 'agGo'), /if \(where === 'details'\)\{ if \(typeof roomOpenAt === 'function'\) roomOpenAt\(cid, 'details'\); return; \}/);
  });
});

describe('f800 (4) the Counter\'s row', () => {
  function counter(items){
    const by = {}; items.forEach(p => { by[p.key] = p; });
    const ctx = {
      i18t: (k, v) => String(BOOKS.en[k] || k).replace(/\{(\w+)\}/g, (_, x) => (v && x in v) ? v[x] : '{' + x + '}'),
      i18tn: (k, n, v) => String(BOOKS.en[k + (n === 1 ? '_one' : '_other')] || BOOKS.en[k] || k).replace(/\{(\w+)\}/g, (_, x) => (v && x in v) ? v[x] : (x === 'n' ? n : '{' + x + '}')),
      jamboFaceHtml: () => '', agFind: k => by[k] || null,
      agPieceTitle: it => 'T ' + it.key, agPieceLine: it => 'L ' + it.key, agPieceRefHtml: it => '<i>ref</i>',
      agRowActOf: it => ({ act: it.act, label: 'Act ' + it.key, cls: 'lead' }), agLookHtml: it => '<div class="ag-mail">mail ' + it.key + '</div>',
      jhAgentColour: () => '#dc2626', agLevelsSaid: () => null,
    };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(['_cnE', '_cnT', '_cnTn', '_cnFirst'].map(n => constLine(CN, n)).join('\n') + '\nlet _cnJwOpen = true, _cnJwLook = null;\n' + constLine(CN, 'CN_JW_MAX')
      + fnBody(CN, 'cnFace') + fnBody(CN, 'cnJwRowHtml') + fnBody(CN, 'cnJwPiecesHtml') + fnBody(CN, 'cnJwLevelsHtml') + ';this.look=k=>{_cnJwLook=k;};', ctx);
    return ctx;
  }
  const A = keys => ({ ready: keys.length, rows: [{ who: 'x', items: keys.map(key => ({ key })) }] });
  test('4a Look · the one act · Put away, the tag in its room\'s colour', () => {
    const w = counter([{ key: 'desk:MK-1:chase', agent: 'late', kind: 'chase', act: 'chase' }, { key: 'answer:MK-2', agent: 'round', kind: 'answer', act: 'nego' }]);
    const html = w.cnJwRowHtml(A(['desk:MK-1:chase', 'answer:MK-2']));
    for (const k of ['desk:MK-1:chase', 'answer:MK-2']){
      const part = html.slice(html.indexOf(`data-cn-ag-item="${k}"`), html.indexOf('</div></div>', html.indexOf(`data-cn-ag-item="${k}"`)) + 12);
      const ctl = [...part.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map(m => m[1]);
      assert.deepEqual(ctl, ['Look', 'Act ' + k, 'Put away'], k);
    }
    assert.match(html, /<span class="cn-jw-tag" style="--c:#dc2626"><i aria-hidden="true"><\/i>/);
    assert.match(html, /<span class="cn-jw-name">T answer:MK-2<\/span><span class="cn-jw-ref"><i>ref<\/i><\/span>/);
    assert.match(html, /<span class="cn-jw-line" title="L answer:MK-2">L answer:MK-2<\/span>/);
  });
  test('4b Look on a chase draws the letter, in its own frame, and its act is then the filled one', () => {
    const w = counter([{ key: 'desk:MK-1:chase', agent: 'late', kind: 'chase', act: 'chase' }]);
    w.look('desk:MK-1:chase');
    const html = w.cnJwRowHtml(A(['desk:MK-1:chase']));
    assert.match(html, /<div class="cn-jw-body is-mail"><div class="ag-mail">mail desk:MK-1:chase<\/div><\/div>/);
    assert.match(html, /class="ui-btn ui-btn-sm ui-btn-primary" data-ag-act="chase"/);
  });
  test('4c Look on a chase is the letter and its foot — no facts (agChaseLookHtml)', () => {
    const { win, of } = staged();
    const html = win.agLookHtml(of('chase'));
    assert.match(html, /class="ag-mail"/);
    assert.doesNotMatch(html, /class="ag-kv"/);
    assert.match(html, /It goes to the address on the contract\. You are asked once more before it is sent\./);
  });
});

describe('f800 (5) the words', () => {
  test('5a in both books', () => {
    for (const k of ['ag_pc_answer', 'ag_pc_read', 'ag_pc_chase', 'ag_pc_import_one', 'ag_pc_import_other', 'ag_pc_import_ref', 'ag_ln_read', 'ag_ln_chase_ready',
      'ag_ln_import_other', 'ag_ln_answer_other', 'ag_a_fill_other', 'ag_a_import_n_other', 'ag_ln_and', 'ag_ln_clause', 'ag_ln_clause_q', 'ag_ln_notice_by'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
    assert.equal(BOOKS.en.ag_a_answer, 'Answer on Redlines');
    assert.equal(BOOKS.en.ag_a_renewal, 'Decide the renewal');
    assert.equal(BOOKS.en.ag_chase_note, 'It goes to the address on the contract. You are asked once more before it is sent.');
  });
});

describe('f800 (6) second pass: the drawn words', () => {
  test('6a a promise written as an act keeps its quotation marks', () => {
    const { win, its } = staged();
    const it = its.find(i => i.kind === 'chase');
    it.ob = { ...it.ob, desc: 'Deliver the stock report' };
    assert.equal(win.agPieceLine(it), '“Deliver the stock report” is 5 days late. The first chase is ready, to the address on the contract.');
  });
  test('6b one sentence ends once: a Swedish short date keeps its own stop', () => {
    const AG = R('js/views/agents.js');
    const ctx = {}; vm.createContext(ctx);
    vm.runInContext(constLine(AG, '_agStop') + '\nthis.f = _agStop;', ctx);
    assert.equal(ctx.f('Det löper ut 27 nov.. Beslutet ska fattas senast 30 okt..'), 'Det löper ut 27 nov. Beslutet ska fattas senast 30 okt.');
    assert.equal(ctx.f('Wait... then go.'), 'Wait... then go.');
    assert.match(fnBody(AG, 'agPieceLine'), /return _agStop\(_agPieceLine\(it\)\);/);
  });
  test('6c the possessive in the reader\'s language', () => {
    const { win } = staged();
    const was = win.langId();
    try {
      win.langSet('sv');
      assert.deepEqual(['Sara', 'Jonas', 'Kettle & Co', 'IKEA', 'Nordvik Logistik'].map(n => win.agPoss(n)), ['Saras', 'Jonas', 'Kettle & Co:s', 'IKEA:s', 'Nordvik Logistiks']);
    } finally { win.langSet(was); }
    assert.equal(win.agPoss('Sara'), 'Sara’s');
  });
  test('6d both books fill the same holes on every word this lane says', () => {
    const vars = t => (String(t).match(/\{(\w+)\}/g) || []).sort().join(',');
    for (const k of Object.keys(BOOKS.en).filter(k => /^(cn_|ag_pc_|ag_ln_|mail_ob_chase_)/.test(k)))
      if (BOOKS.sv[k] != null) assert.equal(vars(BOOKS.sv[k]), vars(BOOKS.en[k]), k);
  });
  test('6e the piece\'s name is never cut: no ellipsis on it, the reference may go under', () => {
    const IX = R('index.html');
    const rule = (IX.match(/\.cn-jw-name\{[^}]*\}/) || [''])[0];
    assert.ok(rule, 'the rule');
    assert.doesNotMatch(rule, /ellipsis|overflow:hidden/);
    assert.match(IX, /\.cn-w b\.cn-jw-t\{display:block;white-space:normal/);
  });
});
