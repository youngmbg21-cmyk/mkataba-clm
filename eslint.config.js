/* THE PROOFREADER.
 *
 * WHY THIS EXISTS. Nothing in this project checked that a name being called is
 * a name that exists. rlPaperFootHtml was written, called from signatureBlock
 * and never added to its module's window exports, so for a year every screen
 * silently took the fallback branch and drew a placeholder foot instead of the
 * parties. Nothing caught it because nothing was looking: a call to a function
 * that is defined nowhere is not a syntax error, it is a runtime error on the
 * one path that reaches it, and this app has a great many paths.
 *
 * WHAT IT IS NOT. It is not a style police. Every rule below is here because a
 * violation of it is a BUG — something that will misbehave at runtime, not
 * something that offends a convention. Formatting, naming and spacing are
 * deliberately unjudged: this codebase has its own voice and a linter arguing
 * with it would be noise, and noise is how a check gets ignored.
 *
 * HOW THE GLOBALS WORK, and why there is no list to maintain. index.html loads
 * js/*.js as plain scripts, so every top-level declaration is a global that
 * every other file may call. A hand-written list of those names would be stale
 * within a week and would then start reporting real code as broken. So the
 * list is READ OUT OF THE CODE at config load: every top-level function, const,
 * let, var and class across js/ becomes a known name. Add a function tomorrow
 * and it is known tomorrow, with nothing to remember.
 *
 * That is also precisely what gives no-undef its teeth here: a name that no
 * file declares and no browser provides is a name nothing will ever resolve.
 */

const fs = require('fs');
const path = require('path');

/* Every top-level declaration in js/ — column 0, which is this codebase's own
   convention for "this is a global". Indented declarations are locals and are
   deliberately not collected: they are not reachable from another file. */
function topLevelNames(dir, out = new Set()) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { topLevelNames(full, out); continue; }
    if (!entry.name.endsWith('.js')) continue;
    let src;
    try { src = fs.readFileSync(full, 'utf8'); } catch { continue; }
    /* A binary-ish file (js/aimd.js carries embedded data) reads fine as utf8
       but has nothing to collect; the patterns simply find nothing. */
    /* THE SECOND WAY THIS APP MAKES A GLOBAL, and leaving it out is what made
       the first run of this config report 506 problems that were not problems:
       `window.PORTAL_MODE = …` and `Object.assign(window, {…})` are as much a
       declaration here as `const` is. Collected at any indentation, because a
       window assignment is routinely written inside an if or a function. */
    for (const m of src.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) out.add(m[1]);
    /* Brace-counted rather than matched with a non-greedy regex. An export list
       routinely holds a value with braces of its own —
       `tplLibAll: () => ({ list: … })` — and a lazy `\{...\}` stops at the
       FIRST inner close, silently truncating the list from that point on. That
       is what made tplLibAll read as undefined at four call sites while being
       exported in plain sight. */
    for (const m of src.matchAll(/Object\.assign\(\s*window\s*,\s*\{/g)) {
      let i = m.index + m[0].length, depth = 1;
      while (i < src.length && depth > 0) {
        const ch = src[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        i++;
      }
      /* Comments come out first. This codebase explains its exports in prose
         right above them, and that prose carries brackets and commas of its
         own — which both skews the depth count and leaves the name buried
         behind a paragraph where the reader below cannot find it. */
      const body = src.slice(m.index + m[0].length, i - 1)
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\/\/[^\n]*/g, ' ');
      /* Names at depth 0 of this object: a key, shorthand or otherwise. */
      let d = 0, buf = '';
      const take = () => {
        const n = /^\s*([A-Za-z_$][\w$]*)\s*[:,]?\s*$|^\s*([A-Za-z_$][\w$]*)\s*:/.exec(buf);
        if (n) out.add(n[1] || n[2]);
        buf = '';
      };
      for (const ch of body) {
        if ('{(['.includes(ch)) d++;
        else if ('})]'.includes(ch)) d--;
        if (ch === ',' && d === 0) { take(); continue; }
        buf += ch;
      }
      take();
    }
    for (const line of src.split('\n')) {
      let m = /^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/.exec(line);
      if (m) { out.add(m[1]); continue; }
      m = /^class\s+([A-Za-z_$][\w$]*)/.exec(line);
      if (m) { out.add(m[1]); continue; }
      m = /^(?:const|let|var)\s+(.+)$/.exec(line);
      if (m) {
        /* `const A = 3, B = 14;` declares two globals, so take every name that
           sits at the head of a declarator rather than only the first. */
        for (const d of m[1].split(',')) {
          const n = /^\s*([A-Za-z_$][\w$]*)\s*(?:=|;|$)/.exec(d);
          if (n) out.add(n[1]);
        }
      }
    }
  }
  return out;
}

const APP_GLOBALS = {};
for (const n of topLevelNames(path.join(__dirname, 'js'))) APP_GLOBALS[n] = 'writable';

/* CALLED, BUT DEFINED NOWHERE — the standing list, and it is meant to shrink.
 *
 * Each of these is reached through a guard (`typeof x === 'function'` or
 * `window.x`), so nothing throws: the guard is simply always false and the
 * fallback branch is the only branch that has ever run. That is exactly the
 * shape of the rlPaperFootHtml fault this file was written for — the guard
 * makes the absence quiet, which is what let it live.
 *
 * THREE CAME OFF ON 21 Aug 2026, the day after the list was written, which is
 * the list working as intended:
 *   exportContractPdf  the round's Export button, which had never once produced
 *                      a file. exportPDF was there the whole time and is what
 *                      every other export in the product calls; the handler now
 *                      calls it. (Owner: keep the button and make it work.)
 *   wordVersionList    the version number in a Word round-trip's audit line.
 *                      listedVersions() is the real reading; the sentence had
 *                      always printed v2 whatever the truth was.
 *   persistUi          deleted rather than pointed anywhere: the line above it
 *                      already saved the preference, so the call bought nothing
 *                      even in principle.
 *
 * They are listed here rather than silenced at the call site so that this file
 * is the one place the outstanding set can be read, and so a NEW undefined name
 * anywhere still fails the run. When one is implemented, delete its line; when
 * one is confirmed dead, delete the call instead.
 *
 *   closeSidePanel     test/chromium/playbook-opens-read-verify.js — the
 *                      harness tries to shut the side panel before reading Key
 *                      terms. The guard is false, so it never shuts: the check
 *                      passes for a reason its author did not intend.
 *   portalContract     test/audit/sim-a-four-rounds.audit.js — the second half
 *                      of `PORTAL_OPTS.contract || (window.portalContract && …)`.
 *                      The first half is what has always answered.
 */
const KNOWN_ABSENT = ['closeSidePanel', 'portalContract'];
/* SCAN is not the app's — it is the scan harness's page builders, injected
   into the browser by test/scan/pagebuild.js through addInitScript, so the
   names inside a page.evaluate callback resolve to it exactly as the app's own
   globals do. Named here rather than left as two errors, because a proofreader
   with known noise in it is one people stop reading. */
KNOWN_ABSENT.push('SCAN');
for (const n of KNOWN_ABSENT) APP_GLOBALS[n] = 'readonly';

/* The browser's own furniture. Kept short and explicit rather than pulled from
   a package: this app targets an ordinary browser and the list does not move. */
const BROWSER = [
  'window', 'document', 'navigator', 'location', 'history', 'screen', 'console',
  'localStorage', 'sessionStorage', 'fetch', 'Headers', 'Request', 'Response',
  'FormData', 'URL', 'URLSearchParams', 'Blob', 'File', 'FileReader', 'Image',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask',
  'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback',
  'alert', 'confirm', 'prompt', 'getComputedStyle', 'matchMedia', 'crypto', 'btoa', 'atob',
  'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'PointerEvent', 'DragEvent',
  'Node', 'Element', 'HTMLElement', 'HTMLInputElement', 'HTMLCanvasElement', 'Text',
  'DOMParser', 'XMLSerializer', 'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
  'AbortController', 'WebSocket', 'Worker', 'performance', 'structuredClone',
  'TextEncoder', 'TextDecoder', 'Intl', 'Chart', 'getSelection', 'Range', 'Notification',
  'CSS', 'DocumentFragment', 'HTMLTextAreaElement', 'HTMLSelectElement', 'ClipboardItem',
  'NodeFilter', 'NodeIterator', 'TreeWalker', 'XPathResult',
  'CompressionStream', 'DecompressionStream', 'ReadableStream', 'WritableStream',
  /* Bare on the global object, so they are written without `window.` */
  'addEventListener', 'removeEventListener', 'dispatchEvent', 'scrollTo', 'scrollBy',
  'open', 'close', 'print', 'focus', 'blur', 'innerWidth', 'innerHeight', 'devicePixelRatio',
];
const browserGlobals = {};
for (const n of BROWSER) browserGlobals[n] = 'readonly';

/* THE RULES. Each one answers "will this misbehave when it runs?" */
const BUG_RULES = {
  'no-undef': 'error',              // a name nothing defines — the reason this file exists
  'no-const-assign': 'error',       // writing to something declared unchangeable
  'no-func-assign': 'error',        // a function quietly overwritten
  'no-dupe-keys': 'error',          // {a:1, a:2} — the first is silently discarded
  'no-dupe-args': 'error',
  'no-dupe-class-members': 'error',
  'no-dupe-else-if': 'error',
  'no-duplicate-case': 'error',
  'no-unreachable': 'error',        // code after a return: dead, and usually meant to run
  'no-fallthrough': 'error',
  'no-cond-assign': 'error',        // if (a = b) when if (a === b) was meant
  'no-self-compare': 'error',
  'no-self-assign': 'error',
  'no-sparse-arrays': 'error',
  'no-unsafe-negation': 'error',
  'no-unsafe-finally': 'error',
  'no-compare-neg-zero': 'error',
  'no-constant-binary-expression': 'error',
  'use-isnan': 'error',
  'valid-typeof': 'error',
  'getter-return': 'error',
  'no-obj-calls': 'error',
  'no-import-assign': 'error',
  'no-new-native-nonconstructor': 'error',
  'require-yield': 'error',
  /* A WARNING, NOT AN ERROR, AND THE DIFFERENCE IS DELIBERATE. Everything above
     is a bug: it will misbehave when it runs, so it stops the build. A local
     that nobody reads is untidy — it does not misbehave, it just sits there.
     Making it an error would have put this whole check in the red on the day it
     shipped over 65 pre-existing ones, and a check that is red on arrival is a
     check people learn to scroll past. So they are printed on every run, and
     the count is a tidy-up list; the alarm is reserved for the rules that mean
     something is actually broken.
     Locals only: a top-level function that no OTHER file calls is still called
     from index.html or a data- attribute, so flagging globals here would report
     the whole app as dead code. */
  'no-unused-vars': ['warn', { vars: 'local', args: 'none', caughtErrors: 'none' }],
};

module.exports = [
  { ignores: ['node_modules/**', 'prototype/**', 'test/chromium/shots/**', 'js/aimd.js'] },

  /* The app: plain scripts in a browser, sharing one global namespace. */
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: {
        ...browserGlobals,
        ...APP_GLOBALS,
        /* Several files close with `if (typeof module !== 'undefined') module.exports = …`
           so the node tests can require them directly. Both shells, one file. */
        module: 'writable', exports: 'writable', require: 'readonly',
      },
    },
    rules: BUG_RULES,
  },

  /* THE FIVE FILES THAT REALLY ARE MODULES. js/app.js imports every other file
     in load order, and four of the views carry an import or an export of their
     own; the rest are plain scripts. Read as a script, an `import` line is a
     parse error and the whole file goes unchecked — which is how the largest
     entry point in the app was being skipped entirely. Their globals are the
     same: the imports are for load ORDER and side effects, and the names still
     travel between files on window. */
  {
    files: ['js/app.js', 'js/negotiation.js', 'js/views/contract.js',
            'js/views/settings.js', 'js/views/migration.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...browserGlobals, ...APP_GLOBALS, module: 'writable', exports: 'writable' },
    },
    rules: BUG_RULES,
  },

  /* The server and the tests: node, and they say what they need with require.
   *
   * THE TESTS GET THE PAGE'S GLOBALS TOO, and that is not laziness. A browser
   * harness in test/chromium is a node script whose middle is browser code —
   * `page.evaluate(() => document.querySelector(…))` — and the names inside
   * that callback resolve in the PAGE, where document, window and every app
   * global are real. Read as plain node, those callbacks reported 2,828
   * undefined names that are all perfectly defined where they actually run.
   * A checker that cries wolf 2,828 times is one nobody reads.
   */
  {
    files: ['server/**/*.js', 'test/**/*.js', 'probe2.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        ...browserGlobals,
        ...APP_GLOBALS,
        /* The harnesses park the contract under test on the page as
           window.CONTRACT and then read it by its bare name inside evaluate. */
        CONTRACT: 'writable',
        require: 'readonly', module: 'writable', exports: 'writable',
        __dirname: 'readonly', __filename: 'readonly', process: 'readonly',
        Buffer: 'readonly', console: 'readonly', global: 'writable',
        setTimeout: 'readonly', clearTimeout: 'readonly',
        setInterval: 'readonly', clearInterval: 'readonly', setImmediate: 'readonly',
        URL: 'readonly', URLSearchParams: 'readonly', TextEncoder: 'readonly',
        TextDecoder: 'readonly', AbortController: 'readonly', fetch: 'readonly',
        structuredClone: 'readonly', queueMicrotask: 'readonly', performance: 'readonly',
      },
    },
    rules: BUG_RULES,
  },
];
