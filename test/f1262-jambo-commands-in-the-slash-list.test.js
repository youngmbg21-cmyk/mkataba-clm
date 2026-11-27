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

/* the four readers run on their own, with the English book's words */
function load(){
  const en = {};
  for (const m of I.matchAll(/^ {4}(ca_cmd_[a-z_]+): '((?:[^'\\]|\\.)*)',$/gm)) if (!(m[1] in en)) en[m[1]] = m[2].replace(/\\'/g, "'");
  const store = {};
  const ctx = { window: {}, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
    todayISO: () => '2026-11-27', currentUser: () => ({ id: 'u1' }), contractRef: c => c.contractNo || c.id,
    _caT: (k, v) => String(en[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null) ? v[n] : ''),
    _caE: s => String(s) };
  vm.createContext(ctx);
  const grab = name => { const at = CA.indexOf(name); assert.ok(at >= 0, name); return CA.slice(at, CA.indexOf('\n}\n', at) + 3); };
  const src = ['const CA_CMDS', 'const CA_CMD_NB_MAX', 'const CA_SINCE_KEY'].map(n => CA.slice(CA.indexOf(n), CA.indexOf('\n', CA.indexOf(n)) + 1)).join('')
    + 'let _caSince;\n' + ['function caUsesWho', 'function caRef'].map(n => CA.slice(CA.indexOf(n), CA.indexOf('\n', CA.indexOf(n)) + 1)).join('')
    + ['function caCmdSince', 'function caCmdWord', 'function caCmdNbDocs', 'function caCmdRows'].map(grab).join('\n');
  vm.runInContext(src + '\nthis.caCmdRows = caCmdRows; this.reset = () => { _caSince = undefined; };', ctx);
  return { ctx, store };
}

describe('f1262 (1) the rows', () => {
  test('with a contract: the four, first; Check one row per Notebook document', () => {
    const { ctx } = load();
    ctx.window.nbFilters = { docs: [{ id: 'n1', name: 'Data protection policy' }, { id: 'n2', name: 'Old', deletedAt: 'x' }] };
    const rows = ctx.caCmdRows('', { id: 'MK-1', contractNo: 'MK-398' });
    assert.equal(rows.map(r => r.word).join(' '), '/prepare /check /handover /changed');
    assert.match(rows[0].q, /^Prepare me for a call about MK-398:/);
    assert.match(rows[1].q, /^Check MK-398 against "Data protection policy" in the Notebook/);
    assert.ok(rows.every(r => r.kind === 'cmd'));
  });
  test('no contract in front: only What\'s changed; a typed word narrows', () => {
    const { ctx } = load();
    assert.equal(ctx.caCmdRows('', null).map(r => r.word).join(' '), '/changed');
    assert.equal(ctx.caCmdRows('hand', { id: 'MK-1' }).map(r => r.word).join(' '), '/handover');
    assert.equal(ctx.caCmdRows('zzz', { id: 'MK-1' }).length, 0);
  });
  test('"since you were last here" is the mark this browser kept; none = the last seven days', () => {
    const { ctx, store } = load();
    assert.match(ctx.caCmdRows('changed', null)[0].q, /in the last seven days/);
    store['hati.v1.jamboSince'] = JSON.stringify({ u1: '2026-11-20' }); ctx.reset();
    assert.match(ctx.caCmdRows('changed', null)[0].q, /since 2026-11-20\?/);
  });
});

describe('f1262 (2) every "/" list carries them; a choice writes, never asks', () => {
  test('the boxes\' list, the list panel\'s and the Board\'s', () => {
    assert.match(CA, /const rows = caCmdRows\(m\[1\]\.toLowerCase\(\), caOpenContract\(\)\)\.concat\(caSlashRows/);
    assert.match(CA, /if \(r\.kind === 'cmd'\)\{ caSlClose\(\); caCmdFill\(P\.inp, r\); return; \}/);
    assert.match(INS, /const cmds = \(typeof caCmdRows === 'function'\) \? caCmdRows\(m\[1\]\.toLowerCase\(\), jlHeldContract\(\) \|\| null\) : \[\];/);
    assert.match(INS, /if \(r\.kind === 'cmd'\)\{ jlPopClose\(\); const box = document\.getElementById\('jl-q'\); if \(box && typeof caCmdFill === 'function'\) caCmdFill\(box, r\); return; \}/);
    assert.match(HB, /rows: cmds\.concat\(places\.concat\(moves\)\.concat\(charts\)\)/);
    assert.match(HB, /if \(r\.kind === 'cmd'\)\{ _hbAskSet\(inp, r\.q\); return; \}/);
  });
  test('the fill writes the question and nothing else', () => {
    const f = CA.slice(CA.indexOf('function caCmdFill'), CA.indexOf('\n}\n', CA.indexOf('function caCmdFill')));
    assert.doesNotMatch(f, /requestSubmit|\.click\(\)|caAskAnywhere|aiAskWords|intelAsk|api\(/, 'a choice never asks Jambo by itself');
    assert.match(f, /inp\.value = r\.q;/);
  });
  test('the words are in both books', () => {
    for (const k of ['ca_cmd_head', 'ca_cmd_go', 'ca_cmd_w_prepare', 'ca_cmd_w_check', 'ca_cmd_w_handover', 'ca_cmd_w_changed', 'ca_cmd_s_prepare', 'ca_cmd_s_check_doc',
      'ca_cmd_s_handover', 'ca_cmd_s_changed', 'ca_cmd_q_prepare', 'ca_cmd_q_check', 'ca_cmd_q_handover', 'ca_cmd_q_changed', 'ca_cmd_q_changed_week', 'ca_cmd_q_changed_one', 'ca_cmd_q_changed_one_week'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});
