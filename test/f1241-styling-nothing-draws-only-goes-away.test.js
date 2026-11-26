/* f1241 — STYLING NOTHING DRAWS ONLY GOES AWAY (owner, 26 Nov 2026: on how professional products keep fast, "start
   both now"). A rule in index.html's hand-written sheet is DEAD when every one of its selectors names a class or id that
   nothing in HaTi draws (js/, server/, vendor/ and the page's own markup; a name built at run time from a prefix, like
   `'is-' + x`, counts as drawn). On 26 Nov 2026 there were 1,271; the ones no check names (429) were taken out, the
   pages photographed identical before and after. The rest are named by older checks, so they wait; the number only
   goes down: a new rule for something nothing draws fails here, and so does one left behind when its part is removed.
   Red at the parent (1,271 dead rules against 857). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const DEAD_RULES_MAX = 857;

function deadRules(){
const R = path.join(__dirname, '..');
const html = fs.readFileSync(R + '/index.html', 'utf8');
// corpus: every js/server/vendor file + index.html with <style> blocks removed
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
let corpus = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, ' ');
for (const dir of ['js', 'server', 'vendor']) for (const f of walk(R + '/' + dir)) if (/\.(m?js|html|css|json)$/.test(f)) corpus += '\n' + fs.readFileSync(f, 'utf8');
for (const f of fs.readdirSync(R)) if (/\.(html|js)$/.test(f) && f !== 'index.html') corpus += '\n' + fs.readFileSync(R + '/' + f, 'utf8');
/* every name the code could draw, read once: whole words, and the prefixes it builds names from ('is-' + x, `st-${k}`) */
const words = new Set(corpus.match(/[\w-]+/g));
const prefixes = new Set([...corpus.matchAll(/([\w-]+-)(?=\$\{|['"`]\s*\+)/g)].map(m => m[1]));
function alive(tok){
  if (words.has(tok)) return true;
  const segs = tok.split('-');
  for (let i = segs.length - 1; i >= 1; i--) if (prefixes.has(segs.slice(0, i).join('-') + '-')) return true;
  return false;
}
// parse CSS of the hand-written blocks (not the compiled tailwind)
const blocks = [...html.matchAll(/<style(?![^>]*data-tw)[^>]*>([\s\S]*?)<\/style>/g)].map(m => ({ css: m[1], at: m.index + m[0].indexOf('>') + 1 }));
const rules = [];
for (const b of blocks){
  const s = b.css; let i = 0; const stack = []; let start = 0;
  // simple scanner: comments, strings, braces
  let sel = ''; let selStart = 0;
  while (i < s.length){
    const ch = s[i];
    if (ch === '/' && s[i+1] === '*'){ const e = s.indexOf('*/', i + 2); i = e < 0 ? s.length : e + 2; continue; }
    if (ch === '"' || ch === "'"){ const q = ch; i++; while (i < s.length && s[i] !== q){ if (s[i] === '\\') i++; i++; } i++; continue; }
    if (ch === '{'){ const head = s.slice(selStart, i).trim();
      if (head.startsWith('@')) { stack.push('at'); selStart = i + 1; i++; continue; }
      // a style rule: find its end
      let d = 1, j = i + 1; while (j < s.length && d){ if (s[j] === '/' && s[j+1] === '*'){ const e = s.indexOf('*/', j + 2); j = e < 0 ? s.length : e + 2; continue; } if (s[j] === '{') d++; else if (s[j] === '}') d--; j++; }
      rules.push({ sel: head, start: b.at + selStart, open: b.at + i, end: b.at + j });
      i = j; selStart = j; continue; }
    if (ch === '}'){ stack.pop(); i++; selStart = i; continue; }
    if (ch === ';' && !stack.length){ i++; selStart = i; continue; }
    i++;
  }
}
// selector analysis
const topSplit = (s, sep) => { const out = []; let d = 0, cur = ''; for (const c of s){ if ('(['.includes(c)) d++; else if (')]'.includes(c)) d--; if (d === 0 && sep(c)){ out.push(cur); cur = ''; continue; } cur += c; } out.push(cur); return out.map(x => x.trim()).filter(Boolean); };
const topLevel = s => { let d = 0, out = ''; for (const c of s){ if ('(['.includes(c)) { d++; continue; } if (')]'.includes(c)) { d--; continue; } if (d === 0) out += c; } return out; };
const tokensOf = sel => { const t = topLevel(sel.replace(/\/\*[\s\S]*?\*\//g, '')); return [...t.matchAll(/([.#])(-?[_a-zA-Z][\w-]*)/g)].map(m => m[2]).filter(x => !/^\d/.test(x)); };
let dead = 0, partial = 0, deadSel = 0, totalSel = 0, bytes = 0; const deadToks = new Map(); const sample = [];
for (const r of rules){
  const sels = topSplit(r.sel.replace(/\/\*[\s\S]*?\*\//g, ''), c => c === ',');
  const flags = sels.map(sel => { const toks = tokensOf(sel); const d = toks.filter(t => !alive(t)); d.forEach(t => deadToks.set(t, (deadToks.get(t) || 0) + 1)); return d.length > 0; });
  totalSel += sels.length; deadSel += flags.filter(Boolean).length;
  if (flags.length && flags.every(Boolean)){ dead++; bytes += r.end - r.start; if (sample.length < 15) sample.push(r.sel.slice(0, 120)); }
  else if (flags.some(Boolean)) partial++;
  r.flags = flags; r.sels = sels;
}
  return { rules: rules.length, dead, sample };
}

test('f1241 the rules for things nothing draws only go down', () => {
  const r = deadRules();
  assert.ok(r.rules > 10000, 'the sheet was read: ' + r.rules + ' rules');
  assert.ok(r.dead <= DEAD_RULES_MAX, r.dead + ' rules style things nothing draws (at most ' + DEAD_RULES_MAX + '); e.g. ' + r.sample.slice(0, 5).join(' | '));
});
