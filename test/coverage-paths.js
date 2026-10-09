/* Loaded ONLY by `npm run coverage` (through NODE_OPTIONS), never by the
   ordinary test run.

   WHY. The harnesses run the app's own files into jsdom with
   vm.Script / vm.runInContext and a RELATIVE filename ("js/core.js"), so a
   thrown error reads short. The coverage tool (c8) matches what V8 ran to a
   file on disk by that filename, and a relative one matches nothing — the
   report then says the screens' code was never run at all. This makes every
   relative filename absolute while coverage is being measured, and changes
   nothing else. */
const path = require('node:path');
const vm = require('node:vm');

const abs = (f) => (typeof f === 'string' && f && !path.isAbsolute(f) && !/^[a-z]+:/i.test(f))
  ? path.resolve(process.cwd(), f) : f;
const fixOpts = (o) => {
  if (typeof o === 'string') return abs(o);
  if (o && typeof o === 'object' && o.filename) return { ...o, filename: abs(o.filename) };
  return o;
};

const OrigScript = vm.Script;
vm.Script = class Script extends OrigScript {
  constructor(code, opts) { super(code, fixOpts(opts)); }
};
for (const name of ['runInContext', 'runInNewContext']) {
  const orig = vm[name];
  vm[name] = (code, ctx, opts) => orig(code, ctx, fixOpts(opts));
}
const origThis = vm.runInThisContext;
vm.runInThisContext = (code, opts) => origThis(code, fixOpts(opts));
