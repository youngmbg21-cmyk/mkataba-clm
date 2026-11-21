'use strict';
/* f1133 — A SETTINGS SHEET HOLDS ITS EDITS UNTIL SAVE (P-43, the owner's pick 21 Nov 2026: "the foot: … Cancel and
   SAVE (today only 'Done')"; built 22 Nov 2026).

   Every sheet from the right that wrote on each press now holds what the reader changes: the screen moves at once, the
   write waits in the sheet and leaves ONCE, on Save, through the writer it always used (saveSettings → PUT
   /api/settings; a person's flags → PUT /api/me/prefs). Cancel writes nothing and puts the screen back; ✕ asks while
   anything is held. A press that is an act of its own still goes when pressed.

   Driven on the settings stage with core.js's own saveSettings (its hold hook is what is under test) and an api stub
   that asks the hold first, as js/api.js does (its source is pinned below). Red at the parent: the review gate's foot
   said Done and every press wrote at once. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { settingsStage, fnBody, S, ROOT } = require('./settingsworld');

const CORE = fs.readFileSync(path.join(ROOT, 'js/core.js'), 'utf8');
const API = fs.readFileSync(path.join(ROOT, 'js/api.js'), 'utf8');

function stage(opts){
  return settingsStage(Object.assign({}, opts, { before: sb => {
    /* core.js's own saveSettings, so its hold hook is the one asked */
    vm.runInContext(fnBody(CORE, 'saveSettings'), sb, { filename: 'js/core.js#saveSettings' });
    /* the api as js/api.js asks it: a held route waits in the sheet */
    const raw = sb.api;
    sb.api = (p, m = 'GET', b, o) => { if (m !== 'GET' && !(o && o.unheld) && typeof sb.stHoldApi === 'function'){ const h = sb.stHoldApi(p, m, b); if (h) return h; } return raw(p, m, b, o); };
    sb.signCheckGate = () => (sb.state.settings && sb.state.settings.signCheckGate) || 'off';
    sb.SIGN_CHECK_GATES = ['off', 'advise', 'require'];
  } }));
}
const puts = g => g.log.api.filter(a => a.route === 'settings' && a.method === 'PUT');
const pick = (g, v) => { const r = g.q(`#sc-gate-panel input[name="sc-gate"][value="${v}"]`); r.checked = true; r.dispatchEvent(new g.win.Event('change', { bubbles: true })); };

test('f1133 (1) a press in a sheet moves the screen and writes nothing', () => {
  const g = stage();
  g.sb.stDrawerOpen('signcheck');
  pick(g, 'require');
  assert.equal(g.sb.state.settings.signCheckGate, 'require', 'the screen says what was pressed');
  assert.equal(g.q('#sc-gate-panel .sc6-o.is-on input').value, 'require');
  assert.equal(puts(g).length, 0, 'nothing written before Save');
  assert.equal(g.sb.stHoldDirty(), true, 'the sheet holds it');
});

test('f1133 (2) Cancel writes nothing and puts the setting back', () => {
  const g = stage({ state: { settings: { signCheckGate: 'advise' } } });
  g.sb.stDrawerOpen('signcheck');
  pick(g, 'require'); pick(g, 'off');
  g.click(g.q('#st-dfoot [data-st-dcancel]'));
  assert.equal(puts(g).length, 0, 'Cancel wrote nothing');
  assert.equal(g.sb.state.settings.signCheckGate, 'advise', 'the setting is what it was');
  assert.equal(g.sb.stHoldDirty(), false);
  assert.ok(g.$('st-drawer').hidden, 'the sheet is closed');
});

test('f1133 (3) Save writes once, with the last word, and closes', async () => {
  const g = stage();
  g.sb.stDrawerOpen('signcheck');
  pick(g, 'require'); pick(g, 'advise'); pick(g, 'require');
  assert.equal(puts(g).length, 0);
  g.click(g.$('st-dsave')); await g.flush(); await g.flush();
  const w = puts(g);
  assert.equal(w.length, 1, 'one write');
  assert.equal(w[0].body.signCheckGate, 'require', 'the last word');
  assert.ok(g.$('st-drawer').hidden, 'closed after the save');
  assert.ok(g.log.toasts.some(t => t.m === S.en.st_hold_saved && t.kind === 'ok'), 'said once');
  assert.equal(g.log.toasts.filter(t => t.kind === 'ok').length, 1, 'no "saved" said while it only held');
});

test('f1133 (4) ✕ asks while anything is held; kept editing, nothing is written', async () => {
  const g = stage({ confirm: false });
  g.sb.stDrawerOpen('signcheck');
  g.click(g.q('#st-dhead [data-st-dclose]')); await g.flush();
  assert.equal(g.log.confirm, undefined, 'nothing held: ✕ closes without asking');
  assert.ok(g.$('st-drawer').hidden);
  g.sb.stDrawerOpen('signcheck'); pick(g, 'require');
  g.click(g.q('#st-dhead [data-st-dclose]')); await g.flush();
  assert.equal(g.log.confirm && g.log.confirm.title, S.en.st_leave_q, 'the house\'s leave question');
  assert.ok(!g.$('st-drawer').hidden, 'Keep editing: the sheet stays');
  assert.equal(g.sb.state.settings.signCheckGate, 'require', 'with what was pressed');
  assert.equal(puts(g).length, 0);
});

test('f1133 (5) another sheet while this one holds asks first; a yes throws the edits away', async () => {
  const g = stage({ state: { settings: { signCheckGate: 'advise' } } });
  g.sb.stDrawerOpen('signcheck'); pick(g, 'off');
  g.sb.stDrawerOpen('review'); await g.flush(); await g.flush();
  assert.equal(g.log.confirm && g.log.confirm.title, S.en.st_leave_q);
  assert.equal(g.sb.state.settings.signCheckGate, 'advise', 'thrown away');
  assert.equal(puts(g).length, 0, 'never written');
});

test('f1133 (6) a person\'s flags wait too, merged into one write; an act of its own goes now', async () => {
  const g = stage();
  g.sb.stDrawerOpen('signcheck');
  await g.sb.api('me/prefs', 'PUT', { a: 1 }); await g.sb.api('me/prefs', 'PUT', { b: 2 });
  assert.equal(g.log.api.filter(x => x.route === 'me/prefs').length, 0, 'held');
  await g.sb.api('reminders/run', 'POST', {});
  assert.equal(g.log.api.filter(x => x.route === 'reminders/run').length, 1, 'an act goes when it is pressed');
  g.click(g.$('st-dsave')); await g.flush(); await g.flush();
  const p = g.log.api.filter(x => x.route === 'me/prefs');
  assert.equal(p.length, 1, 'one write');
  assert.equal(JSON.stringify(p[0].body), JSON.stringify({ a: 1, b: 2 }), 'both flags, in one body');
});

test('f1133 (7) the hooks stand where every write passes, and the foot is Save first, Cancel last', () => {
  const save = fnBody(CORE, 'saveSettings');
  assert.match(save, /window\.stHoldTake\('settings'\)\) return true;/, 'core.js: the settings write asks the sheet first');
  assert.match(API.slice(API.indexOf('async function api('), API.indexOf('const res=await fetch(')), /window\.stHoldApi\(path, method, body\)/, 'api.js: a write asks the sheet first');
  const g = stage(); g.sb.stDrawerOpen('signcheck');
  const acts = g.qa('#st-dfoot .st-dfoot-acts > button').filter(b => !b.classList.contains('st-dnext'));
  assert.deepEqual(acts.map(b => b.id || (b.hasAttribute('data-st-dcancel') ? 'cancel' : '?')), ['st-dsave', 'cancel']);
});
