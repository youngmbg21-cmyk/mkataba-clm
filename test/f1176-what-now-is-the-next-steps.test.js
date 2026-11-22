/* ============================================================
   f1176 — "what now" and "vad nu" are the next steps
   ============================================================
   Bug log: caPlaceOf drops a trailing "now"/"nu" ("go to explorer now")
   before it matches the place words, so the listed phrases "what now" and
   "vad nu" became "what" and "vad" and matched nothing. The words as typed
   are now asked first. Red at the parent: both read as no place.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const CA = fs.readFileSync(path.join(__dirname, '..', 'js/copilotacts.js'), 'utf8');
const slice = (start, end) => { const i = CA.indexOf(start); return CA.slice(i, CA.indexOf(end, i) + end.length); };
const fnBody = name => { const i = CA.indexOf('function ' + name + '('); return CA.slice(i, CA.indexOf('\n}', i) + 2); };

function reader(){
  const ctx = { _caChosen: new Map(), caContracts: () => [], caRef: c => c.id, caOnBoard: () => false };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext([slice('const CA_PLACES = [', '\n];'), slice('const CA_PLACE_LEAD', ';\n'),
    'const CA_PLACE_MAX = 60;', fnBody('caPlaceOf'), 'this.caPlaceOf = caPlaceOf;'].join('\n'), ctx);
  return ctx.caPlaceOf;
}
describe('f1176 — the next steps by their own words', () => {
  const read = reader();
  for (const q of ['what now', 'What now?', 'vad nu', "what's next"])
    test(JSON.stringify(q), () => assert.equal((read(q) || {}).place, 'next'));
  test('"go to explorer now" still lets "now" go', () => assert.equal((read('go to explorer now') || {}).place, 'explorer'));
});
