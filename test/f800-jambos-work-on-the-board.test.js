'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f800 — JAMBO'S WORK ON THE BOARD'S CARD, AS ROUND 23 DREW EACH PIECE
   (rebuilt 18 Oct 2026 for LAND ON IT: the owner reversed round 23's "Open in
   place" — "when you click on jambos work, it should take you to the jambos
   work card in the board", "remove the in-place list" — and kept the Board's
   Jambo's work card (the build's answer (14)). The pieces live on that card,
   so what round 23 drew on each piece is carried THERE. Was "a piece in one
   row", which tested the in-place list's own readings.)
   (1) Each act is named for what it does (agActsOf): Answer on Redlines,
       Send the chase, Check the 3 files, Fill in 3 details (a new contract's
       read while details are owed), Decide the renewal.
   (2) Fill in is the one door every "fill in" press passes (roomOpenAt).
   (3) PUT AWAY ON EVERY PIECE, on the Board's card: each piece the card draws
       ends its acts with Put away (agPanelActs), whatever its kind.
   (4) A CHASE SHOWS THE EMAIL WHOLE on the card: To, Subject, the letter, and
       "It goes to the address on the contract. You are asked once more
       before it is sent." — the card draws each piece whole, so the letter is
       in view without a second press.
   (5) The possessive of a name, in the reader's language (agPoss; Home's
       rows and chips: "Jonas's approval", "Sara's NDA request").
   (6) The in-place list's own readings are gone (agPieceTitle, agPieceLine,
       agRowActOf, agLookHtml, the room colour tag) — nothing draws pieces in
       place any more.
   (7) The words, in both books, filling the same holes.
   AT MAIN (a59a692, LAND ON IT without this lane) every test here FAILS but
   3b (main's chase panel already ended in Put away; 3a is the one that
   asks it of every kind), 6a (an absence) and 7b (it holds over main's words).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const AG = R('js/views/agents.js');
const HB = R('js/views/homeboard.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
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
/* the Board's own builder of an agent's work below the card, run in the world
   (the world does not load the Board; its builder is read from the source) */
function boardWork(win){
  const defs = ['hbChaseItems', 'hbChaseManyHtml', 'hbAgentWorkHtml'].map(n => fnBody(HB, n)).join('\n');
  return win.eval(`(function(){ const agLoadWhole = null; const HB_AG_WORK_MAX = 8; const _hbAgLoaded = new Set(); const _hbAgMore = new Map();
    const _hbE = s => esc(s); const _hbN = n => String(n || 0);
    ${defs}
    return hbAgentWorkHtml; })()`);
}
const actsOf = (win, it) => win.agActsOf(it).map(a => a.act + ':' + a.label);

describe('f800 (1) each act is named for what it does', () => {
  test('1a as drawn: Answer on Redlines, Send the chase, Check the 3 files', () => {
    const { win, of } = staged();
    const lead = k => { const a = win.agActsOf(of(k)).find(x => x.cls === 'lead'); return a && a.act + ':' + a.label; };
    assert.equal(lead('answer'), 'nego:Answer on Redlines');
    assert.equal(lead('chase'), 'chase:Send the chase');
    assert.equal(lead('import'), 'import:Check the 3 files');
  });
  test('1b a new contract\'s read offers Fill in while details are owed, and not once they are filled', () => {
    const { win, of } = staged();
    const it = of('read');
    win.detailsOf = () => ({ left: 3, all: 5, live: true });
    assert.ok(actsOf(win, it).includes('fill:Fill in 3 details'));
    win.detailsOf = () => ({ left: 0, all: 5, live: true });
    assert.ok(!actsOf(win, it).some(a => a.startsWith('fill:')));
  });
});

describe('f800 (2) Fill in is the one door', () => {
  test('2a every "fill in" press passes roomOpenAt', () => {
    assert.match(fnBody(AG, 'agRunAct'), /if \(act === 'fill'\) return agGo\('details', it\.cid\);/);
    assert.match(fnBody(AG, 'agGo'), /if \(where === 'details'\)\{ if \(typeof roomOpenAt === 'function'\) roomOpenAt\(cid, 'details'\); return; \}/);
  });
});

describe('f800 (3) Put away on every piece, on the Board\'s card', () => {
  test('3a every piece of every agent ends its acts with Put away', () => {
    const { win, its } = staged();
    assert.ok(its.length >= 4, 'the stage prepared pieces of several kinds');
    for (const it of its){
      const L = win.agActsOf(it);
      assert.equal(L[L.length - 1].act + ':' + L[L.length - 1].label, 'away:Put away', it.kind);
    }
  });
  test('3b the card draws them: one Put away per piece, the quiet text button', () => {
    const { win, its } = staged();
    const work = boardWork(win);
    const late = its.filter(i => i.agent === 'late');
    assert.ok(late.length, 'a late promise was prepared');
    const html = work({ key: 'ag:late', items: late.map(i => ({ key: i.key })) });
    assert.equal((html.match(/data-hb-ag-item="/g) || []).length, late.length);
    assert.equal((html.match(/<button type="button" class="ui-link" data-ag-act="away">Put away<\/button>/g) || []).length, late.length);
  });
});

describe('f800 (4) a chase shows the email whole on the card', () => {
  test('4a To, Subject, the letter, and where it goes', () => {
    const { win, its } = staged();
    const chase = its.find(i => i.kind === 'chase');
    const html = boardWork(win)({ key: 'ag:late', items: [{ key: chase.key }] });
    assert.match(html, /class="ag-mail"/);
    assert.match(html, /<dt>To<\/dt><dd>ops@kettle\.example<\/dd>/);
    assert.match(html, /<dt>Subject<\/dt><dd>[^<]*insurance certificate[^<]*<\/dd>/);
    assert.match(html, /class="ag-mail-b">[^<]*This is a reminder about the insurance certificate under our /);
    assert.match(html, /It goes to the address on the contract\. You are asked once more before it is sent\./);
    assert.match(html, /data-ag-act="chase">Send the chase</);
  });
});

describe('f800 (5) the possessive, in the reader\'s language', () => {
  test('5a English', () => {
    const { win } = staged();
    assert.equal(win.agPoss('Sara'), 'Sara’s');
    assert.equal(win.agPoss('Jonas'), 'Jonas’s');
    assert.equal(win.agPoss('Brightwater Foods'), 'Brightwater Foods’');
  });
  test('5b Swedish', () => {
    const { win } = staged();
    const was = win.langId();
    try {
      win.langSet('sv');
      assert.deepEqual(['Sara', 'Jonas', 'Kettle & Co', 'IKEA', 'Nordvik Logistik'].map(n => win.agPoss(n)), ['Saras', 'Jonas', 'Kettle & Co:s', 'IKEA:s', 'Nordvik Logistiks']);
    } finally { win.langSet(was); }
  });
});

describe('f800 (6) nothing draws pieces in place any more', () => {
  test('6a the in-place readings are gone', () => {
    const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(strip(AG), /\b(agPieceTitle|agPieceLine|agPieceRefHtml|agRowActOf|agLookHtml|agChaseLookHtml)\b/);
    assert.doesNotMatch(strip(R('js/views/jambohouse.js')), /\bjhAgentColour\b/);
    assert.doesNotMatch(R('index.html'), /\.cn-jw-(list|i|name|tag|body|acts|foot)\b/);
  });
});

describe('f800 (7) the words', () => {
  test('7a in both books', () => {
    for (const k of ['ag_a_fill_one', 'ag_a_fill_other', 'ag_a_import_n_one', 'ag_a_import_n_other', 'ag_ln_and', 'ag_put_away_mine', 'ag_chase_note'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
    assert.equal(BOOKS.en.ag_a_answer, 'Answer on Redlines');
    assert.equal(BOOKS.en.ag_a_renewal, 'Decide the renewal');
    assert.equal(BOOKS.en.desk_discard, 'Put away', 'the owner kept the word');
    assert.equal(BOOKS.en.ag_chase_note, 'It goes to the address on the contract. You are asked once more before it is sent.');
  });
  test('7b both books fill the same holes on every word this lane says', () => {
    const vars = t => (String(t).match(/\{(\w+)\}/g) || []).sort().join(',');
    for (const k of Object.keys(BOOKS.en).filter(k => /^(cn_|ag_a_|mail_ob_chase_|jh_wait_)/.test(k)))
      if (BOOKS.sv[k] != null) assert.equal(vars(BOOKS.sv[k]), vars(BOOKS.en[k]), k);
  });
});
