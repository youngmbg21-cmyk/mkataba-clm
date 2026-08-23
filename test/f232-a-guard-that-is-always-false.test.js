/* ============================================================
   F232 — a guard that is always false
   ============================================================
   Reported as "when I click export nothing happens", and the button was
   innocent. `exportWordTracked` is defined in js/views/contract.js and reached
   from two OTHER modules through `window.exportWordTracked && …` — and it was
   never published to window. The guard had always been false, so the call had
   never once run, and because a false guard is silence rather than an error
   nothing anywhere said so.

   THE FILES ARE ES MODULES. index.html loads one `type="module"` entry and
   every other file is imported, so each has its OWN scope: a top-level
   `function foo` is NOT a global. The only way one module reaches another's
   function is the explicit `Object.assign(window, {…})` each one ends with. A
   name missing from that list is unreachable, and every caller guarded on
   `window.foo` silently takes its fallback.

   THIS IS THE rlPaperFootHtml FAULT, WHICH CLAUDE.md ALREADY RECORDS: that
   builder went unexported for a year while a placeholder drew in its place on
   every screen. It has now happened at least four more times — the round's
   Export button (exportContractPdf, fixed 21 Aug), wordVersionList, persistUi,
   and these three. It is this codebase's most repeated defect, and the reason
   is structural rather than careless: nothing fails, nothing logs, and the
   fallback branch is usually plausible enough to look like the feature.

   THE PROOFREADER CANNOT SEE IT. eslint.config.js sweeps for names defined
   NOWHERE, which is the right net for a typo and the wrong one for this: these
   names are all defined, just not reachable from where they are called. That
   gap is what this file closes.

   WHAT IT FOUND ON THE DAY IT WAS WRITTEN, all three fixed in the same commit:
     exportWordTracked  the Word export was dead on the Negotiations page AND
                        on the counterparty's own share page. It worked in the
                        contract room, where the call is direct and in-scope —
                        which is why it was never reported before.
     rlActorHeld        defined in negotiation.js and called BARE at six sites
                        in that same file; two sites guarded it on window, so a
                        narrowed reviewer was offered the Copilot band and the
                        batch Send — two controls whose only outcome for them
                        is a refusal.
     regionCodeFor      changing the market never moved the region with it.  */
'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js')) files.push(p);
  }
})(path.join(ROOT, 'js'));

const blank = s => s.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
                    .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));

/* The keys at depth 1 of the object literal whose '{' is at `open`. */
function keysOfObjectAt(s, open) {
  let d = 1, i = open + 1, buf = '';
  const out = [];
  const take = () => { const n = /^\s*([A-Za-z_$][\w$]*)\s*(?::|$)/.exec(buf); if (n) out.push(n[1]); buf = ''; };
  while (i < s.length && d > 0) {
    const ch = s[i];
    if ('{(['.includes(ch)) d++; else if ('})]'.includes(ch)) d--;
    if (d === 0) break;
    if (ch === ',' && d === 1) { take(); i++; continue; }
    buf += ch; i++;
  }
  take();
  return out;
}

/* Everything any module actually puts on window. Both shapes are in use:
   a literal, and a named constant (jurisdiction.js ends `Object.assign(window,
   JX_API)`) — reading only the literal shape reports 60 false alarms. */
function published() {
  const out = new Set();
  for (const f of files) {
    const s = blank(fs.readFileSync(f, 'utf8'));
    const re = /Object\.assign\(\s*window\s*,\s*/g;
    let m;
    while ((m = re.exec(s))) {
      const at = re.lastIndex;
      if (s[at] === '{') { keysOfObjectAt(s, at).forEach(n => out.add(n)); continue; }
      const id = /^([A-Za-z_$][\w$]*)/.exec(s.slice(at));
      if (!id) continue;
      const decl = new RegExp('(?:const|let|var)\\s+' + id[1] + '\\s*=\\s*\\{').exec(s);
      if (decl) keysOfObjectAt(s, s.indexOf('{', decl.index)).forEach(n => out.add(n));
    }
    const re2 = /window\.([A-Za-z_$][\w$]*)\s*=(?!=)/g;
    while ((m = re2.exec(s))) out.add(m[1]);
    /* ---- A THIRD PUBLISH SHAPE: Object.defineProperty ----
       A name whose VALUE changes — a last-refusal reason, a live counter — has
       to be published as a getter, or every reader gets the snapshot taken at
       load. That is a real export and this sweep could not see it, so the first
       one written failed here as an always-false guard: the sweep reporting a
       correctly-published name is exactly the false alarm that gets a sweep
       switched off. Both quote styles, because the codebase uses both. */
    const re3 = /Object\.defineProperty\(\s*window\s*,\s*['"]([A-Za-z_$][\w$]*)['"]/g;
    while ((m = re3.exec(s))) out.add(m[1]);
    const re4 = /window\[\s*['"]([A-Za-z_$][\w$]*)['"]\s*\]\s*=(?!=)/g;
    while ((m = re4.exec(s))) out.add(m[1]);
  }
  return out;
}

/* Every `window.foo` READ — never an assignment, never `a.window.foo`. */
function readThroughWindow() {
  const out = new Map();
  for (const f of files) {
    const s = blank(fs.readFileSync(f, 'utf8'));
    /* ---- THE BLIND SPOT THIS SWEEP HAD, AND IT LET TWO REAL BUGS THROUGH ----
       The pattern started `[a-z]`, so every CamelCase and UPPER_CASE read —
       window.FIRST_PARTY, window.SIGN_ROUTE_ON, window.M_DESK_MSG — was
       invisible to the one check built to catch an unreachable name. A sweep
       with a blind spot is worse than no sweep, because it is trusted. */
    const re = /(?<![.\w$])window\.([A-Za-z_$][A-Za-z0-9_$]*)\b(?!\s*=(?!=))/g;
    let m;
    while ((m = re.exec(s))) {
      const k = m[1];
      if (!out.has(k)) out.set(k, new Set());
      out.get(k).add(path.relative(ROOT, f));
    }
  }
  return out;
}

/* The browser's own furniture, kept explicit for the reason eslint.config.js
   gives for its own copy: this app targets an ordinary browser and the list
   does not move. A name added here must be a real browser property — adding an
   APP function to it would silence exactly what this file is for. */
const BROWSER = new Set([
  'location', 'document', 'navigator', 'history', 'screen', 'console',
  'localStorage', 'sessionStorage', 'fetch', 'open', 'close', 'print',
  'alert', 'confirm', 'prompt', 'scrollTo', 'scrollBy', 'scrollY', 'scrollX',
  'innerWidth', 'innerHeight', 'outerWidth', 'outerHeight',
  'addEventListener', 'removeEventListener', 'setTimeout', 'setInterval',
  'clearTimeout', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame',
  'requestIdleCallback', 'getComputedStyle', 'matchMedia', 'crypto', 'performance',
  'parent', 'top', 'self', 'name', 'origin', 'pageYOffset', 'pageXOffset',
  'devicePixelRatio', 'onerror', 'onbeforeunload', 'getSelection', 'btoa', 'atob',
  'isSecureContext', 'visualViewport', 'speechSynthesis', 'indexedDB',
  'frameElement', 'closed', 'focus', 'blur', 'postMessage', 'showOpenFilePicker',
  /* CamelCase browser furniture, which only became visible when this sweep
     stopped starting its pattern at [a-z] — see readThroughWindow. */
  'CSS', 'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
  'FileReader', 'DataTransfer', 'AbortController', 'Intl', 'Notification',
  /* Third-party libraries loaded from a script tag rather than imported: they
     land on window by construction, and the guards on them are the honest
     "is it here yet" question. */
  'Chart', 'Tesseract', 'pdfjsLib', 'html2canvas', 'jspdf',
]);

/* DELIBERATELY ABSENT, and each must say why it is not a bug. Empty today.
   A name belongs here only when the absence is the DESIGN — CLAUDE.md's own
   example is `state`, which core.js declares as a const and which every module
   must therefore read BARE, because `window.state && …` silently disabled the
   review gate once. Anything else on this list is debt with a note on it. */
const DELIBERATE = {
  /* ---- SETTINGS A DEPLOYMENT MAY OVERRIDE, AND USUALLY DOES NOT ----
     Each of these is read as `window.X || <the built-in default>`, so ABSENCE
     IS THE NORMAL CASE and the guard is doing exactly its job. They are set
     from outside this codebase — an operator's script tag, or a test harness —
     which is why no module publishes them and why publishing them would break
     the thing they are for. */
  HATI_OCR_PDFJS: 'an operator may point the PDF reader at their own copy instead of the CDN',
  HATI_OCR_PDFJS_WORKER: 'ditto, for its worker',
  HATI_OCR_TESSERACT: 'ditto, for the offline recogniser',
  HATI_OCR_TESSERACT_OPTS: 'ditto, for its options',
  RL_LIVE_POLL: 'set to false by test/world.js so a harness page does not open a live poll; absent in the product, which is what turns polling ON',
};

describe('F232 — every window.foo a module reads is one some module publishes', () => {

  test('f232-1 no guard in this product is always false', () => {
    const pub = published();
    const dead = [...readThroughWindow().entries()]
      .filter(([n]) => !pub.has(n) && !BROWSER.has(n) && !(n in DELIBERATE))
      .map(([n, where]) => `${n} — read in ${[...where].join(', ')}`);
    assert.deepEqual(dead, [],
      'these names are reached through `window.x` but no module publishes them, '
      + 'so every guard on them is false and the call never runs:\n  ' + dead.join('\n  '));
  });

  test('f232-2 the three found on the day this was written are published', () => {
    /* Named, so a future refactor that drops one from an export list fails
       here with the reason attached rather than only in the sweep above. */
    const pub = published();
    for (const n of ['exportWordTracked', 'regionCodeFor']) {
      assert.ok(pub.has(n), `${n} is unreachable again — a module calling it through window gets nothing`);
    }
  });

  test('f232-3 rlActorHeld is asked BARE, like its six neighbours', () => {
    /* It is defined in negotiation.js, so publishing it would work too — but
       the file already calls it directly six times, and one name reached two
       ways in one file is how the next reader comes to believe there is a
       reason for the difference. */
    const s = blank(fs.readFileSync(path.join(ROOT, 'js/views/negotiation.js'), 'utf8'));
    assert.ok(!/window\.rlActorHeld/.test(s),
      'a window guard is back on a function this file defines — it can only be false');
    assert.ok((s.match(/rlActorHeld\(/g) || []).length >= 6,
      'the calls themselves have gone, which is a different bug');
  });

  test('f232-4 the sweep can actually see the fault it was written for', () => {
    /* A net that cannot catch its own founding example is a description.
       Reproduces the reported bug in miniature rather than trusting the run
       above: a name read through window, published by nobody. */
    const pub = new Set(['somethingElse']);
    const read = new Map([['exportWordTracked', new Set(['js/views/negotiation.js'])]]);
    const dead = [...read.entries()].filter(([n]) => !pub.has(n) && !BROWSER.has(n));
    assert.equal(dead.length, 1);
    assert.equal(dead[0][0], 'exportWordTracked');
  });

  test('f232-5 both publish shapes are read — a literal and a named constant', () => {
    /* jurisdiction.js ends `Object.assign(window, JX_API)`. Reading only the
       literal shape reported ~60 false alarms, including every money formatter
       in the product, which is how a sweep gets switched off. */
    const pub = published();
    for (const n of ['fmtMoneyOf', 'fmtMoneyShortOf', 'fxHomeValue', 'fxMissing'])
      assert.ok(pub.has(n), `${n} rides a named export object and must still be seen`);
    for (const n of ['negoFileChange', 'reviewAsk'])
      assert.ok(pub.has(n), `${n} rides an object literal and must still be seen`);
    /* The third shape, added 23 Aug 2026 when the first getter-published name
       was written and this sweep called it dead. */
    assert.ok(pub.has('negoLastRefusal'),
      'a getter published with Object.defineProperty is published, and must be seen as such');
  });
});
