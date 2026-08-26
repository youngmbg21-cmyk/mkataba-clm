/* ============================================================
   THE LADDERS, READ FROM :root — one resolver, so no test types a number
   ============================================================
   Phase C renamed 4,991 hand-typed sizes, weights and spacings onto the
   design tokens, and the tests that used to read `font-size:13px` out of the
   source now read `font-size:var(--t-meta)`. Most of those claims are simple
   enough to re-point at the token by name. A handful are RELATIONS — "the
   count leads the caption by a clear step", "nothing in the band is smaller
   than the cards it is a reading of" — and a relation needs the NUMBERS.

   THIS IS THE ONE PLACE THAT MAPS A TOKEN TO ITS VALUE, read out of
   index.html's own :root rather than typed here. A second copy would be a
   test asserting against a number the product had already moved — which is
   the exact fault the rulebook records as "pin the relation, not the number".

   px('--t-meta')      -> 13
   px('font-size:var(--t-meta)') also works, so a test can hand it whatever
   fragment it already has and get a number back; a literal `13px` in that
   fragment answers 13 too, which keeps a mixed claim readable.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');

const INDEX = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

/* :root only — never html.dark, whose values are the night answers and would
   silently win the last-one-wins race if the whole file were scanned. */
const ROOT = (() => {
  const at = INDEX.indexOf(':root{');
  if (at < 0) return '';
  /* Brace-match rather than slice to the first '\n  }': a comment written
     between the brace and the first token once made an anchored slice come
     back EMPTY, every token read undefined, and a perfectly true claim fail.
     F96 has already paid for that once. */
  let d = 0, i = INDEX.indexOf('{', at);
  for (let j = i; j < INDEX.length; j++) {
    if (INDEX[j] === '{') d++;
    else if (INDEX[j] === '}') { d--; if (!d) return INDEX.slice(i + 1, j); }
  }
  return '';
})();

const RAW = name => {
  const m = new RegExp('(?:^|[;\\s])' + name + '\\s*:\\s*([^;]+)').exec(ROOT);
  return m ? m[1].trim() : null;
};

/* One level of indirection is resolved, because several rungs are declared as
   another token (--field-size:var(--t-body)) and a test asking for the field's
   size wants a number, not a name. */
function px(input) {
  const s = String(input == null ? '' : input);
  const tok = /var\((--[a-z0-9-]+)\)/.exec(s);
  const name = tok ? tok[1] : (/^--[a-z0-9-]+$/.test(s.trim()) ? s.trim() : null);
  if (!name) {
    const lit = /(-?[0-9.]+)px/.exec(s);
    return lit ? Number(lit[1]) : NaN;
  }
  let v = RAW(name);
  for (let i = 0; i < 4 && v && /var\(/.test(v); i++) {
    const inner = /var\((--[a-z0-9-]+)/.exec(v);
    v = inner ? RAW(inner[1]) : null;
  }
  const n = v && /(-?[0-9.]+)/.exec(v);
  return n ? Number(n[1]) : NaN;
}

/* The same question for a weight, which carries no unit. */
const weight = input => px(input);

module.exports = { px, weight, RAW, ROOT };
