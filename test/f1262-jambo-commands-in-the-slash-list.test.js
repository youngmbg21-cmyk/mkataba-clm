'use strict';
/* f1262 — JAMBO'S COMMANDS IN EVERY "/" LIST (owner, 27 Nov 2026; round 1 by the owner's pick "Menu + easy four first"):
   Prepare my call, Check against a Notebook document, Handover pack and What's changed stand first in every "/" list
   (every Jambo box, the list panel's box, the Board's box). A choice WRITES Jambo's question into the box and waits
   for Enter, as the Board's "/" rows always have: nothing is asked, sent or written by the choice itself. A command
   about one contract only with a contract in front; Check one row per Notebook document the reader may see. */
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CA = strip(R('js/copilotacts.js')), INS = strip(R('js/views/inspector.js')), HB = strip(R('js/views/homeboard.js')), I = R('js/i18n.js');

/* the readers run on their own, with the English book's words */
function load(){
  const en = {};
  for (const m of I.matchAll(/^ {4}(ca_cmd_[a-z_]+): (['"])((?:(?!\2)[^\\]|\\.)*)\2,$/gm)) if (!(m[1] in en)) en[m[1]] = m[3].replace(/\\'/g, "'");
  const store = {};
  const ctx = { window: {}, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
    todayISO: () => '2026-11-28', currentUser: () => ({ id: 'u1' }), contractRef: c => c.contractNo || c.id,
    _caT: (k, v) => String(en[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null) ? v[n] : ''),
    _caE: s => String(s) };
  vm.createContext(ctx);
  const grab = name => { const at = CA.indexOf(name); assert.ok(at >= 0, name); return CA.slice(at, CA.indexOf('\n}\n', at) + 3); };
  const line = n => CA.slice(CA.indexOf(n), CA.indexOf('\n', CA.indexOf(n)) + 1);
  const src = CA.slice(CA.indexOf('const CA_CMDS'), CA.indexOf('];\n', CA.indexOf('const CA_CMDS')) + 3)
    + ['const CA_CMD_NB_MAX', 'const CA_SINCE_KEY', 'const CA_CMD_CT ', 'const CA_CMD_CT_MAX', 'const _caCmdBook'].map(line).join('')
    + ['function caUsesWho', 'function caRef'].map(line).join('')
    + ['function caCmdWord', 'function caCmdNbDocs', 'function caCmdRows', 'function caCmdRefOf', 'function caCmdCtRows', 'function caCmdDocRows', 'function caSlashList'].map(grab).join('\n');
  vm.runInContext(src + '\nthis.caCmdRows = caCmdRows; this.caSlashList = caSlashList; this.reset = () => {};', ctx);
  return { ctx, store };
}
const W = rows => Array.from(rows).map(r => r.word).join(' | ');

describe('f1262 (1) "/" is the eight commands, and nothing else (owner, 28 Nov 2026)', () => {
  test('the eight, in the drawing\'s order, none naming the contract in front', () => {
    const { ctx } = load(); ctx.canEdit = () => true;
    ctx.state = { contracts: [{ id: 'MK-398', name: 'Supply', counterparty: 'Ventura' }] };
    const R = ctx.caSlashList('/', ctx.state.contracts[0]);
    assert.equal(W(R), '/prepare | /check | /handover | /request | /changed | /chase | /amend-many | /approve');
    assert.ok(R.every(r => r.kind === 'cmd' && !/MK-398|Ventura/.test(r.sub)), 'no command is tied to the open contract');
    assert.equal(W(ctx.caSlashList('/hand', null)), '/handover');
  });
  test('a Viewer is offered the four that only read', () => {
    const { ctx } = load(); ctx.canEdit = () => false;
    assert.equal(W(ctx.caSlashList('/', null)), '/prepare | /check | /handover | /changed');
  });
  test('a contract command asks which contract: the reader\'s contracts, narrowed by what is typed, the open one first', () => {
    const { ctx } = load(); ctx.canEdit = () => true;
    const A = { id: 'MK-398', name: 'Supply agreement', counterparty: 'Ventura' }, B = { id: 'MK-401', name: 'Distribution agreement', counterparty: 'Ventura' }, C = { id: 'MK-402', name: 'Service level agreement', counterparty: 'Nordvik' };
    ctx.state = { contracts: [B, C, A] };
    const R = ctx.caSlashList('/prepare ', A);
    assert.equal(R[0].kind, 'ct'); assert.equal(R[0].c, A, 'the open one first'); assert.equal(R[0].badge, 'open now');
    assert.equal(W(ctx.caSlashList('/prepare MK-40', A)), 'MK-401 · Distribution agreement | MK-402 · Service level agreement');
    assert.equal(W(ctx.caSlashList('/handover nordvik', null)), 'MK-402 · Service level agreement');
    const none = ctx.caSlashList('/prepare MK-999', A);
    assert.equal(none.length, 1); assert.equal(none[0].kind, 'none', 'nothing found is said, so Enter cannot send the half-made line');
  });
  test('every contract is reachable: all listed up to the cap, the count in the head, the rest counted, never cut silently', () => {
    const { ctx } = load(); ctx.canEdit = () => true;
    ctx.state = { contracts: Array.from({ length: 130 }, (_, i) => ({ id: 'MK-' + (500 + i), name: 'Paper ' + i, counterparty: 'P' })) };
    const R = ctx.caSlashList('/request ', null);
    assert.equal(R.filter(r => r.kind === 'ct').length, 100);
    assert.equal(R[R.length - 1].kind, 'none'); assert.match(R[R.length - 1].word, /and 30 more/);
    assert.match(R[0].head, /All 130 are below; type a number or name to narrow/);
    assert.match(ctx.caSlashList('/request MK-62', null)[0].head, /match "MK-62"/);
  });
  test('Check then asks which Notebook document; Email request leaves the words to the reader', () => {
    const { ctx } = load(); ctx.canEdit = () => true;
    const A = { id: 'MK-401', name: 'Distribution agreement' };
    ctx.state = { contracts: [A] }; ctx.window.nbFilters = { docs: [{ id: 'n1', name: 'Data protection policy' }, { id: 'n2', name: 'Old', deletedAt: 'x' }] };
    const D = ctx.caSlashList('/check MK-401 ', null);
    assert.equal(W(D), 'Data protection policy'); assert.equal(D[0].kind, 'doc');
    assert.equal(ctx.caSlashList('/request MK-401 ', null).length, 0, 'the list steps aside while the request is typed');
  });
  test('What\'s changed acts at once (f1264), it writes no question', () => {
    const { ctx } = load(); ctx.canEdit = () => true;
    const r = Array.from(ctx.caCmdRows('changed')).find(x => x.k === 'changed');
    assert.equal(r.act, true); assert.equal(r.q, undefined);
  });

});

describe('f1262 (2) one list in every box; a choice writes, never asks', () => {
  test('every box draws the one list; the panel\'s and the Board\'s own "/" lists stand down', () => {
    assert.match(CA, /const rows = caSlashList\(inp\.value, caOpenContract\(\)\);/);
    assert.match(CA, /if \(r\.kind === 'cmd' \|\| r\.kind === 'ct' \|\| r\.kind === 'doc'\)\{ caSlClose\(\); caSlashTake\(P\.inp, r\); return; \}/);
    assert.match(INS, /function jlPopRead\(inp\)\{\s*jlPopClose\(\);\s*\}/);
    assert.match(HB, /if \(\/\^\\s\*\\\/\/\.test\(t\)\) return null;/);
    assert.match(strip(R('js/views/intelligence.js')), /<textarea id="igd-input" rows="1" data-ca-slash /);
  });
  test('the list is as wide as Jambo\'s whole box (owner, 28 Nov 2026), measured off its card', () => {
    assert.match(CA, /const r = \(\(_caSl\.inp\.closest && _caSl\.inp\.closest\('\.jb-card'\)\) \|\| _caSl\.inp\)\.getBoundingClientRect\(\);/);
  });
  test('a choice writes the next step or the question, and nothing else', () => {
    const f = CA.slice(CA.indexOf('function caSlashTake'), CA.indexOf('\n}\n', CA.indexOf('function caSlashTake')));
    assert.doesNotMatch(f, /requestSubmit|\.click\(\)|caAskAnywhere|aiAskWords|intelAsk|api\(/);
    assert.match(f, /if \(r\.k === 'check' \|\| r\.k === 'request'\) return put\(`\$\{caCmdWord\(r\.k\)\} \$\{ref\} `\);/);
    assert.match(f, /return put\(_caT\('ca_cmd_q_' \+ r\.k, \{ ref \}\)\);/);
  });
  test('the words are in both books', () => {
    for (const k of ['ca_cmd_head', 'ca_cmd_go', 'ca_cmd_go_choose', 'ca_cmd_which_ct', 'ca_cmd_which_doc', 'ca_cmd_open_now', 'ca_cmd_no_ct', 'ca_cmd_no_doc',
      'ca_cmd_g_prepare', 'ca_cmd_g_check', 'ca_cmd_g_handover', 'ca_cmd_g_request', 'ca_cmd_g_changed', 'ca_cmd_g_chase', 'ca_cmd_g_amend', 'ca_cmd_g_approve',
      'ca_cmd_q_prepare', 'ca_cmd_q_check', 'ca_cmd_q_handover'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});

/* ROUND 2 (owner, 27 Nov 2026: "build them all"): Chase everyone, Email request, Amend many, Approve the ones that meet
   our standards. Two act at once and answer in rows, two lead with words the person finishes; every row ends in a door
   HaTi already has, one press each; a Viewer is offered none. */
describe('f1262 (3) round 2: the four that act', () => {
  function load2(){
    const L = load(); const ctx = L.ctx;
    const grab = name => { const at = CA.indexOf(name); assert.ok(at >= 0, name); return CA.slice(at, CA.indexOf('\n}\n', at) + 3); };
    vm.runInContext(['const CA_CHASE_DAYS'].map(n => CA.slice(CA.indexOf(n), CA.indexOf('\n', CA.indexOf(n)) + 1)).join('')
      + ['function caCmdChaseRows', 'function caCmdStdOf', 'function caCmdAmendRows'].map(grab).join('\n')
      + '\nthis.caCmdChaseRows = caCmdChaseRows; this.caCmdStdOf = caCmdStdOf; this.caCmdAmendRows = caCmdAmendRows;', ctx);
    return L;
  }
  test('Chase reads only their duties, late or due within the window, never one held behind an earlier step', () => {
    const { ctx } = load2();
    ctx.state = { contracts: [{ id: 'A', obligations: [{ id: 1, due: 'late', party: 'theirs' }, { id: 2, due: 'soon', party: 'theirs' }, { id: 3, due: 'far', party: 'theirs' },
      { id: 4, due: 'late', party: 'ours' }, { id: 5, due: 'late', party: 'theirs', status: 'done' }, { id: 6, due: 'late', party: 'theirs', held: true }] }] };
    ctx.window.daysUntil = d => ({ late: -3, soon: 5, far: 40 })[d];
    ctx.window.obligationIsTheirs = o => o.party === 'theirs';
    ctx.window.obligationBlocked = o => !!o.held;
    assert.equal(ctx.caCmdChaseRows(null).map(x => x.o.id).join(','), '1,2');
  });
  test('Approve is offered only where the stored check met every position AND asked every one', () => {
    const { ctx } = load2();
    ctx.window.deviationSummary = c => c.s;
    assert.equal(ctx.caCmdStdOf({ s: { ok: true, complete: true } }).k, 'meets');
    assert.equal(ctx.caCmdStdOf({ s: { ok: true, complete: false } }).k, 'departs');
    assert.equal(ctx.caCmdStdOf({ s: null }).k, 'none');
  });
  test('Amend many lists every signed agreement the Amend door is open on, the open one\'s party first', () => {
    const { ctx } = load2();
    ctx.state = { contracts: [{ id: 'A', counterparty: 'Ventura' }, { id: 'B', counterparty: 'Other' }, { id: 'C', counterparty: 'Ventura', shut: true }] };
    ctx.window.amendmentShutWhy = c => c.shut ? 'no' : '';
    assert.equal(ctx.caCmdAmendRows({ counterparty: 'Other' }).map(c => c.id).join(','), 'B,A', 'the whole book, the open one\'s party first');
    assert.equal(ctx.caCmdAmendRows(null).map(c => c.id).join(','), 'A,B');
  });
  test('every row ends in an existing door, one press each; the typed words are read first in every box', () => {
    for (const re of [/go === 'amend' && c && typeof window\.pd2AmAskOpen === 'function'\)\{ window\.pd2AmAskOpen\(c\.id, b\.getAttribute\('data-say'\) \|\| ''\)/,
      /if \(d && d\.kind === 'rule' && typeof window\.approveContract === 'function'\) ok = !!\(await window\.approveContract\(c\)\);/,
      /await window\.openShareModal\(c, \{ purpose: 'status' \}\)/]) assert.match(CA, re);
    assert.match(CA, /function caAskAnywhere\(text, opts = \{\}\)\{\s*const t = String\(text \|\| ''\)\.trim\(\); if \(!t\) return false;\s*if \(caCmdTyped\(t, opts\.win \? 'ai' : null\)\) return true;/);
    assert.match(INS, /if \(typeof caCmdTyped === 'function' && caCmdTyped\(t, 'jl'\)\) return 'said';/);
    assert.match(strip(R('js/views/intelligence.js')), /if\(typeof window\.caCmdTyped==='function'&&caCmdTyped\(q, 'ig'\)\) return;/);
  });
});
