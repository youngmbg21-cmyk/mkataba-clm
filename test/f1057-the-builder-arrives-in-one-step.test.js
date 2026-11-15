/* f1057 — THE BUILDER ARRIVES IN ONE STEP (owner, 15 Nov 2026: "when I press to go to builder, it first flashes the
   our paper page before going to builder. This is unacceptable"):
     1 nsOpen neither closes the start's page nor turns the view BEFORE the Builder is read: both ride opts.arrive
     2 openTemplateBuilder runs arrive only AFTER both reads and BEFORE the Builder is drawn; a failed read is thrown to
       the start (its button and line say it) instead of a toast over a page that stayed
     3 no start closes its page just before nsOpen (closing first showed the page underneath)
     4 driven: the view turns and the page closes in the same step the Builder is drawn, never while it is being read
   At the parent (1), (2), (3) and (4) fail: nsOpen called setView('templates') first, and every start closed first.
   Run: node --test test/f1057-the-builder-arrives-in-one-step.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const body = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return strip(src.slice(i, src.indexOf('\n}', i) + 2)); };
const NS = read('js/views/newstandard.js'), TB = read('js/views/templatebuilder.js');

test('f1057 (1) nsOpen hands the close and the view turn to the Builder as arrive', () => {
  const b = body(NS, 'nsOpen');
  const at = b.indexOf('openTemplateBuilder(');
  assert.ok(at > 0);
  assert.ok(b.indexOf("setView('templates')") > at, 'the view turns inside arrive, not before the read');
  assert.ok(b.indexOf('closeModal()') > at, 'the page closes inside arrive, not before the read');
  assert.match(b, /arrive: \(\) => \{/);
});

test('f1057 (2) openTemplateBuilder: read, then arrive, then draw; a failure is thrown to the door', () => {
  const b = body(TB, 'openTemplateBuilder');
  const r2 = b.indexOf('await api(`templates/${tid}/versions/${vid}`)'), go = b.indexOf('if (arrive) { arrive();'), paint = b.indexOf('tbPaint({ fresh: true })');
  assert.ok(r2 > 0 && go > r2 && paint > go, 'arrive after both reads and before the paint');
  assert.match(b, /catch \(e\) \{ if \(arrive\) throw e; toast\(e\.message, 'err'\); return; \}/);
  assert.match(b, /if \(arrive\) throw new Error\(why\)/);
});

test('f1057 (3) no start closes its page just before nsOpen', () => {
  const src = strip(NS);
  assert.doesNotMatch(src, /closeModal\(\);\s*(?:return |await )?nsOpen\(/);
});

test('f1057 (4) driven: nothing turns while the Builder is read', async () => {
  const log = [];
  let release;
  const gate = new Promise(r => { release = r; });
  const sandbox = {
    window: {}, state: { view: 'dashboard' },
    tplLibRefresh: () => Promise.resolve(),
    closeModal: () => log.push('close'),
    setView: v => { log.push('view:' + v); sandbox.state.view = v; },
    openTemplateBuilder: async (tid, vid, o) => { log.push('reading'); await gate; o.arrive(); log.push('drawn'); },
  };
  const fn = new Function(...Object.keys(sandbox), body(NS, 'nsOpen') + '\nreturn nsOpen;')(...Object.values(sandbox));
  const p = fn('t1', 'v1', { kind: 'scratch' });
  await Promise.resolve();
  assert.deepEqual(log, ['reading'], 'while the Builder is being read, the start page stays and the view does not turn');
  release(); await p;
  assert.deepEqual(log, ['reading', 'close', 'view:templates', 'drawn']);
});
