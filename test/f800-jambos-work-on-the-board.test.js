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
   (6) RE-POINTED 19 Oct 2026 (the owner's answer (18), "Fold to one line"):
       the folded piece's readings are back, ON THE BOARD'S CARD (agPieceTitle,
       agPieceLine, agPieceRefHtml, agRowActOf, agLookHtml, the room colour
       tag jhAgentColour) — Home still draws no piece in place. Was "the
       in-place readings are gone".
   (7) The words, in both books, filling the same holes.
   (8) FOLDED TO ONE LINE (the owner's answer (18)): each piece the card draws
       is one row — the agent's tag in its room's colour, what it is, its
       reference, one sentence — with Look · its own act · Put away, and no
       body until Look is pressed.
   (9) LOOK opens the piece under its row (a chase: the letter and where it
       goes; else the piece's body, its other acts under it); pressed again it
       folds; another piece's Look moves it there. The act is the filled
       button only while its piece is open (one filled button per area).
   (10) THE CARD'S HEAD SAYS HOME'S WORDS: "Jambo's work · N prepared ·
       nothing sent or filed until you press" — one press apart, one wording.
   AT MAIN (a59a692, LAND ON IT without this lane) every test here FAILS but
   3b (main's chase panel already ended in Put away; 3a is the one that
   asks it of every kind) and 7b (it holds over main's words). At this lane's
   last commit (9cde108) (6), (8), (9), (10) and the re-pointed 3b and 4a FAIL.
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
function boardWork(win, look){
  const defs = ['hbChaseItems', 'hbChaseManyHtml', 'hbAgPieceHtml', 'hbAgentWorkHtml'].map(n => fnBody(HB, n)).join('\n');
  const make = win.eval(`(function(look){ const agLoadWhole = null; const HB_AG_WORK_MAX = 8; const _hbAgLoaded = new Set(); const _hbAgMore = new Map();
    let _hbAgLook = look || null;
    const _hbE = s => esc(s); const _hbN = n => String(n || 0);
    ${defs}
    return hbAgentWorkHtml; })`);
  return make(look);
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
    /* RE-POINTED 19 Oct 2026 (answer (18)): the folded row draws Put away
       itself, last, beside Look and the one act — still one per piece */
    assert.equal((html.match(/<button type="button" class="ui-link" data-ag-act="away">Put away<\/button>/g) || []).length, late.length);
    assert.match(html, /data-ag-act="away">Put away<\/button><\/div><\/div>/, 'the last of the row\'s acts');
  });
});

describe('f800 (4) a chase shows the email whole on the card', () => {
  test('4a To, Subject, the letter, and where it goes', () => {
    const { win, its } = staged();
    const chase = its.find(i => i.kind === 'chase');
    /* RE-POINTED 19 Oct 2026 (answer (18)): the letter is under its row once
       Look is pressed — folded, the row says one sentence and no letter */
    assert.doesNotMatch(boardWork(win)({ key: 'ag:late', items: [{ key: chase.key }] }), /class="ag-mail/);
    const html = boardWork(win, chase.key)({ key: 'ag:late', items: [{ key: chase.key }] });
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

describe('f800 (6) the folded piece\'s readings, on the Board\'s card (RE-POINTED 19 Oct 2026, answer (18))', () => {
  test('6a they are back, published, and the Board draws them; Home still lists no piece in place', () => {
    const { win } = staged();
    for (const n of ['agPieceTitle', 'agPieceLine', 'agPieceRefHtml', 'agRowActOf', 'agLookHtml', 'agChaseLookHtml'])
      assert.equal(typeof win[n], 'function', n + ' is published');
    assert.match(R('js/views/jambohouse.js'), /function jhAgentColour\(k\)\{/, 'each agent\'s room colour, read once');
    assert.match(fnBody(HB, 'hbAgPieceHtml'), /jhAgentColour\(it\.agent\)/);
    assert.match(fnBody(HB, 'hbAgentWorkHtml'), /const cards = shown\.map\(hbAgPieceHtml\)\.join\(''\);/);
    const CN = R('js/views/counter.js').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(CN, /cnJwPiecesHtml|CN_JW_MAX|data-cn-ag-item|data-cn-look/, 'LAND ON IT stands: Home lists no piece in place');
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
    /* 19 Oct 2026: and the folded piece's own words (ag_pc_, ag_ln_), every one in both books */
    for (const k of Object.keys(BOOKS.en).filter(k => /^(cn_|ag_a_|ag_pc_|ag_ln_|mail_ob_chase_|jh_wait_)/.test(k))){
      if (/^ag_(pc|ln)_/.test(k)) assert.ok(BOOKS.sv[k] != null, k + ' sv');
      if (BOOKS.sv[k] != null) assert.equal(vars(BOOKS.sv[k]), vars(BOOKS.en[k]), k);
    }
  });
});

describe('f800 (8) each piece folded to one line (the owner\'s answer (18), 19 Oct 2026)', () => {
  test('8a tag in its room\'s colour · what it is · its reference · one sentence; Look · its act · Put away; no body', () => {
    const { win, of } = staged();
    win.jhAgentColour = k => ({ round: '#6d28d9', late: '#dc2626', paper: '#3b6fd8', import: '#ea580c' }[k] || '');
    win.refHtml = c => `<span class="hati-ref">${c.id}</span>`;
    const work = boardWork(win);
    const row = (k, agent) => work({ key: 'ag:' + agent, items: [{ key: of(k).key }] });
    const ans = row('answer', 'round');
    assert.match(ans, /<span class="hb-pc-tag" style="--hb-pc-c:#6d28d9"><i aria-hidden="true"><\/i>Their round came back<\/span><span class="hb-pc-name">Nordvik Logistik’s answer<\/span><span class="hb-pc-ref"><span class="hati-ref">MK-PR-2<\/span><\/span>/);
    assert.match(ans, /<span class="hb-pc-line" title="Answers to their 2 redlines, read against our standards: [^"]+">/);
    assert.match(ans, /data-hb-ag-look="answer:MK-PR-2"[^>]*>Look<\/button><button type="button" class="ui-btn ui-btn-sm" data-ag-act="nego">Answer on Redlines<\/button><button type="button" class="ui-link" data-ag-act="away">Put away<\/button>/);
    assert.doesNotMatch(ans, /hb-pc-body|ag-p-body|ag-p-head/, 'folded: one line, no body');
    const chase = row('chase', 'late');
    assert.match(chase, /<span class="hb-pc-name">A chase to Kettle &amp; Co<\/span>/);
    assert.match(chase, />Their insurance certificate is 5 days late\. The first chase is ready, to the address on the contract\.</);
    assert.match(chase, /data-ag-act="chase">Send the chase</);
    const imp = row('import', 'import');
    assert.match(imp, /<span class="hb-pc-name">3 imports to check<\/span><span class="hb-pc-ref">Import of [^<]+<\/span>/);
    assert.match(imp, />3 files wait for your check: Lease Göteborg\.pdf, NDA Kettle 2023\.docx and Freight terms scan\.pdf\.</);
    assert.match(imp, /data-ag-act="import">Check the 3 files</);
  });
  test('8b a new contract\'s read: its act is Fill in while details are owed, as drawn', () => {
    const { win, of } = staged();
    win.detailsOf = () => ({ left: 3, all: 5, live: true });
    const html = boardWork(win)({ key: 'ag:paper', items: [{ key: of('read').key }] });
    assert.match(html, /<span class="hb-pc-name">A read of Baltic Freight<\/span>/);
    assert.match(html, />Read on arrival: a brief, 2 obligations found, 3 details to fill and 1 departure from our standards \(notice period\)\.</);
    assert.match(html, /data-ag-act="fill">Fill in 3 details</);
  });
  test('8c the dress: one list, a hairline between rows, the line cut at its end until it is opened', () => {
    const css = R('index.html');
    assert.match(css, /\.hb-ag-works\.is-lines\{gap:0;/);
    assert.match(css, /\.hb-ag-work\.is-line \+ \.hb-ag-work\.is-line\{border-top:1px solid rgba\(var\(--hb-ln\),\.12\)\}/);
    assert.match(css, /\.hb-pc-line\{[^}]*white-space:nowrap;overflow:hidden;text-overflow:ellipsis\}/);
    assert.match(css, /\.hb-ag-work\.is-look \.hb-pc-line\{white-space:normal\}/);
    assert.match(css, /\.hb-pc-tag\{--hb-pc-c:var\(--hb-mute\);/);
    assert.match(css, /\.hb-pc-tag i\{[^}]*background:var\(--hb-pc-c\)/);
  });
});

describe('f800 (9) Look opens the piece under its row; pressed again it folds', () => {
  test('9a open: the chase\'s letter and where it goes; its act filled; Look pressed', () => {
    const { win, of } = staged();
    const k = of('chase').key;
    const html = boardWork(win, k)({ key: 'ag:late', items: [{ key: k }] });
    assert.match(html, /class="hb-ag-work is-line is-look"/);
    assert.match(html, /aria-pressed="true" aria-expanded="true">Look</);
    assert.match(html, /<div class="hb-pc-body is-mail"><div class="ag-mail"/);
    assert.match(html, /class="ag-p-note ag-mail-foot">It goes to the address on the contract\. You are asked once more before it is sent\.</);
    assert.match(html, /class="ui-btn ui-btn-sm ui-btn-primary" data-ag-act="chase">Send the chase</, 'the open piece\'s act is the filled one');
  });
  test('9b open, any other piece: its body, and its other acts under it — none lost by folding', () => {
    const { win, of } = staged();
    win.detailsOf = () => ({ left: 3, all: 5, live: true });
    const k = of('read').key;
    const html = boardWork(win, k)({ key: 'ag:paper', items: [{ key: k }] });
    const body = html.slice(html.indexOf('hb-pc-body'));
    assert.ok(body.length > 30, 'the body is drawn');
    for (const act of ['brief', 'overview', 'seen']) assert.match(body, new RegExp('data-ag-act="' + act + '"'), act + ' stands under the piece');
    assert.doesNotMatch(body, /data-ag-act="fill"|data-ag-act="away"/, 'the row\'s own act and Put away are not drawn twice');
  });
  test('9c the press: Look toggles, another Look moves it; the acts run the house\'s own runner', () => {
    const t = fnBody(HB, 'hbAgLookToggle');
    assert.match(t, /_hbAgLook = _hbAgLook === key \? null : key;/);
    assert.match(HB, /if \(\(el = on\('\[data-hb-ag-look\]'\)\)\)\{ e\.stopPropagation\(\); hbAgLookToggle\(el\.getAttribute\('data-hb-ag-look'\)\); return; \}/);
    assert.match(fnBody(HB, 'hbAgentWorkPress'), /agRunAct\(key, act\.getAttribute\('data-ag-act'\)\)/);
  });
  test('9d Draft a reply opens its piece first: the draft, or why there is none, is never folded out of sight (19 Oct 2026)', () => {
    assert.match(fnBody(HB, 'hbAgentWorkPress'), /if \(act\.getAttribute\('data-ag-act'\) === 'draftreply'\) _hbAgLook = key;\s*if \(typeof agRunAct === 'function'\) agRunAct/);
  });
});

describe('f800 (10) the card\'s head says Home\'s words', () => {
  test('10a "N prepared · nothing sent or filed until you press" — one wording one press apart', () => {
    assert.match(fnBody(HB, 'hbPrepHtml'), /i18tn\('cn_jw_n', A\.ready, \{ n: _hbN\(A\.ready\) \}\) \+ ' · ' \+ i18t\('cn_jw_said'\)/);
    assert.doesNotMatch(fnBody(HB, 'hbPrepHtml'), /hm_ag_sub/);
    assert.equal(BOOKS.en.cn_jw_n_other, '{n} prepared');
    assert.equal(BOOKS.sv.cn_jw_n_other, '{n} förberedda');
  });
});
