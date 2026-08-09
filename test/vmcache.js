/* Compile each source file ONCE per test process, run it into as many fresh
   contexts as the tests ask for.

   WHY. The three harnesses that boot the real modules — test/world.js,
   test/portalworld.js and test/dom.js — each did this, once per world:

     vm.runInContext(fs.readFileSync(abs, 'utf8'), ctx, { filename: rel })

   which re-reads the file from disk and asks V8 to PARSE AND COMPILE it again,
   every single time. The modules are not small: js/views/negotiation.js is
   622 KB, js/i18n.js 335 KB, js/views/contract.js 333 KB, js/core.js 285 KB.
   A single world build compiles somewhere north of 1.8 MB of JavaScript, and
   the heavy test files build a lot of worlds — f35 builds 32, f130 builds 24,
   f82 builds 15. The compile was being paid for all of them.

   WHAT CHANGES: nothing about semantics. A vm.Script is a compiled program,
   not a running one; runInContext still evaluates it fresh against whatever
   context it is handed, so every world still gets its own untouched globals.
   The only thing reused is V8's parse of bytes that did not change on disk
   during the run.

   WHY A SHARED FILE rather than the same three lines three times: it already
   WAS the same three lines three times, which is how a fix lands in one
   harness and misses the other two. */
const fs = require('node:fs');
const vm = require('node:vm');

const compiled = new Map();

/* Run one source file into a context, compiling it the first time only.
   `abs` is the path on disk; `filename` is what shows up in stack traces, and
   is kept as the caller's relative path so a thrown error still reads
   "js/core.js" rather than a machine-specific absolute path. */
function runFileInContext(abs, ctx, filename) {
  let script = compiled.get(abs);
  if (!script) {
    script = new vm.Script(fs.readFileSync(abs, 'utf8'), { filename: filename || abs });
    compiled.set(abs, script);
  }
  return script.runInContext(ctx);
}

module.exports = { runFileInContext };
