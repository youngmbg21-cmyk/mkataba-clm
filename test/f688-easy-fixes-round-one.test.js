/* f688 — THE EASY FIXES, ROUND ONE (the owner's "Go", 15 Oct 2026)
   ========================================================================
   The review of 15 Oct 2026 listed repairs that restore what the product
   already promises and need no decision. Pinned here:
     1  the Board's contract card reads the brief in its stored shape
        ({ data: { overview } }), through the one reader that knows it
     3  History's "Ours" keeps what our own people did (an upload, a re-file),
        written in their names; an entry in HaTi's own name stays out, and a
        trail line about one of THEIR changes is folded away, not shown as ours
     4  the paper put away (the wall) or turned to another contract ends the
        presence beat for the contract that was on it
     9  the signing route's two refusals are said in the reader's language
   The file-name cleaner (item 6) is pinned with its siblings in f457 (5). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const grab = (src, name) => {
  const i = src.indexOf('function ' + name + '(');
  assert.ok(i > -1, name + ' is defined');
  /* the body's brace, after the parameters (a default like f={} is not it) */
  let d = 0; const j = src.indexOf('){', i) + 1;
  for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1); }
  throw new Error('unbalanced ' + name);
};

describe('F688 (1) — the Board card reads the brief as it is stored', () => {
  const HB = read('js/views/homeboard.js');
  const TRI = read('js/triage.js');
  test('the card asks triageBriefLine, never a summary/text field the brief does not have', () => {
    const body = strip(grab(HB, 'hbCardData'));
    assert.match(body, /triageBriefLine\(c\._brief\)/);
    assert.doesNotMatch(body, /_brief\.summary|_brief\.text/);
  });
  test('a stored brief gives the card its first sentence; no brief gives none', () => {
    const line = vm.runInNewContext('(' + grab(TRI, 'triageBriefLine') + ')');
    const stored = { data: { overview: 'A two-year courier services agreement between Mkataba Ltd and Sendy, paid monthly. Renews unless notice is given.' } };
    assert.equal(line(stored), 'A two-year courier services agreement between Mkataba Ltd and Sendy, paid monthly.');
    assert.equal(line({ summary: 'the old shape' }), '');
  });
});

describe('F688 (3) — History\'s "Ours" keeps our own people\'s entries', () => {
  const ROOM = read('js/views/contract.js');
  function run(f, audit, users){
    const nego = [
      { at: '2026-10-02T09:00:00Z', kind: 'proposed', side: 'counterparty', text: '#CHG-001 proposed by Sendy', ch: { id: 'CHG-001' } },
      { at: '2026-10-03T09:00:00Z', kind: 'proposed', side: 'owner', text: '#CHG-002 proposed by Jane Wanjiru', ch: { id: 'CHG-002' } }
    ];
    const ctx = {
      window: {},
      negoTimeline: (c, ff) => nego.filter(e => !(ff && ff.side) || e.side === ff.side).map(e => ({ ...e })),
      getUsers: () => users,
      currentUser: () => users[0] || null
    };
    ctx.window.negoTimeline = ctx.negoTimeline;
    vm.createContext(ctx);
    vm.runInContext([grab(ROOM, '_histKey'), grab(ROOM, 'roomHistoryEvents'), grab(ROOM, '_histOurPeople')].join('\n'), ctx);
    return ctx.roomHistoryEvents({ audit }, f);
  }
  const audit = [
    { at: '2026-10-01T08:00:00Z', user: 'Jane Wanjiru', action: 'Uploaded', detail: 'Courier Services Agreement.docx' },
    { at: '2026-10-02T09:00:00Z', user: 'Jane Wanjiru', action: 'Recorded', detail: '#CHG-001 proposed by Sendy' },
    { at: '2026-10-04T08:00:00Z', user: 'HaTi', action: 'Signature', detail: 'Peter Otieno for Sendy signed via share link' }
  ];
  const users = [{ id: 'u1', name: 'Jane Wanjiru' }];
  test('with no filter every entry shows, as before', () => {
    const all = run({}, audit, users);
    assert.ok(all.some(e => /Uploaded/.test(e.text)));
    assert.ok(all.some(e => /signed via share link/.test(e.text)));
  });
  test('"Ours" keeps the upload our colleague made', () => {
    const ours = run({ side: 'owner' }, audit, users);
    assert.ok(ours.some(e => e._k === 'system' && /Uploaded/.test(e.text)), JSON.stringify(ours.map(e => e.text)));
  });
  test('"Ours" leaves out an entry in HaTi\'s own name (their signature is written so)', () => {
    const ours = run({ side: 'owner' }, audit, users);
    assert.ok(!ours.some(e => /signed via share link/.test(e.text)));
  });
  test('"Ours" folds away a trail line about THEIR change instead of showing it as ours', () => {
    const ours = run({ side: 'owner' }, audit, users);
    assert.ok(!ours.some(e => /CHG-001/.test(e.text)), JSON.stringify(ours.map(e => e.text)));
    assert.ok(ours.some(e => /CHG-002/.test(e.text)));
  });
  test('"Theirs" and every other filter still drop system entries', () => {
    assert.ok(!run({ side: 'counterparty' }, audit, users).some(e => e._k === 'system'));
    assert.ok(!run({ side: 'owner', round: 2 }, audit, users).some(e => e._k === 'system'));
  });
  test('with nobody known as ours, "Ours" shows no system entry (nothing is guessed)', () => {
    assert.ok(!run({ side: 'owner' }, audit, []).some(e => e._k === 'system'));
  });
});

describe('F688 (4) — the paper put away or turned ends the presence beat', () => {
  const PD = read('js/paperdesk.js');
  const IG = strip(read('js/views/intelligence.js'));
  function stage(view, watching){
    const ctx = { window: {}, state: { view }, stopped: 0, _w: watching };
    ctx.window.state = ctx.state;
    ctx.presenceWatching = () => ctx._w;
    ctx.presenceStop = () => { ctx.stopped++; ctx._w = null; };
    vm.createContext(ctx);
    vm.runInContext(grab(PD, 'pdPresenceOff') + '\n' + grab(PD, 'pdPresenceLeft'), ctx);
    return ctx;
  }
  test('on Home, going to the wall stops the beat', () => {
    const s = stage('dashboard', 'MK-7'); s.pdPresenceLeft(null); assert.equal(s.stopped, 1);
  });
  test('on Home, another contract on the paper stops the old beat', () => {
    const s = stage('dashboard', 'MK-7'); s.pdPresenceLeft('MK-9'); assert.equal(s.stopped, 1);
  });
  test('the same contract keeps its beat', () => {
    const s = stage('dashboard', 'MK-7'); s.pdPresenceLeft('MK-7'); assert.equal(s.stopped, 0);
  });
  test('off Home (the Negotiate page opened by name) the page keeps its own beat', () => {
    const s = stage('negotiate', 'MK-7'); s.pdPresenceLeft(null); assert.equal(s.stopped, 0);
  });
  test('both ways the paper changes ask it: put away, and turned', () => {
    assert.match(grab(IG, 'igPaperHold'), /pdPresenceLeft\(c\.id\)/);
    assert.match(grab(IG, 'igPaintPaper'), /if\(!c\)\{\s*intel\.paper=null;\s*if\(typeof window\.pdPresenceLeft==='function'\) pdPresenceLeft\(null\);/);
    assert.match(PD, /pdPresenceOff, pdPresenceLeft, pdFaceNow/);
  });
});

describe('F688 (9) — the signing route\'s refusals speak the reader\'s language', () => {
  const CORE = strip(read('js/core.js'));
  const I18N = read('js/i18n.js');
  test('no English sentence is left in the signing route\'s two refusals', () => {
    assert.doesNotMatch(CORE, /signed out of order —/);
    assert.doesNotMatch(CORE, /signing step is already recorded/);
    assert.match(CORE, /i18t\('co_sign_out_of_order',\{name:r\.name,first:earlier\[0\]\.name\}\)/);
    assert.match(CORE, /i18t\('co_sign_step_done',\{name:boundRow\.name\}\)/);
  });
  test('both books carry both sentences, with the same blanks', () => {
    for (const k of ['co_sign_step_done', 'co_sign_out_of_order']){
      const rows = I18N.split('\n').filter(l => new RegExp('^\\s+' + k + ':').test(l));
      assert.equal(rows.length, 2, k + ' in English and Svenska');
      for (const r of rows){
        assert.match(r, /\{name\}/);
        if (k === 'co_sign_out_of_order') assert.match(r, /\{first\}/);
      }
    }
  });
});
