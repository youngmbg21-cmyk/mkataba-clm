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

/* THE SERVER IS STOPPED WITH SIGKILL (test/helpers.js), and V8 writes its
   coverage only on a clean exit — so every route read as never run. In a
   server process, write it every second instead. takeCoverage() is
   cumulative and never resets, so each write replaces this process's last. */
const fs = require('node:fs');
const v8 = require('node:v8');
const covDir = process.env.NODE_V8_COVERAGE;
if (covDir && /server[\\/]server\.js$/.test(process.argv[1] || '')) {
  const mine = () => { try { return fs.readdirSync(covDir).filter(f => f.startsWith(`coverage-${process.pid}-`)); } catch (_) { return []; } };
  setInterval(() => {
    const before = mine();
    try { v8.takeCoverage(); } catch (_) { return; }
    const after = mine();
    if (after.length > before.length) for (const f of before) { try { fs.unlinkSync(path.join(covDir, f)); } catch (_) {} }
  }, 1000).unref();
}
