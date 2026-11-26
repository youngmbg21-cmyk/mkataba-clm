/* f1240 — A MOVE IS STYLED ONCE, NOT THE WHOLE PAGE OVER AND OVER (owner, 26 Nov 2026: "please review why hati is slow
   to respond by a second or two when navigating through the workspace", then "start").

   Measured in a browser at an ordinary laptop's speed: each move took 0.4–1.9 s, and most of it was the browser working
   out the styles again. Three causes, each pinned here:
   (1) A `:has()` rule whose last part is a bare `:not(…)` (or `*`) gives the browser nothing to aim at, so ANY change
       inside the panel made it re-style the WHOLE page from <html> down — twelve such rules doubled the styling work of
       every move. The subject now names what it can be (`:where(div, span, …)`, no weight added), so only the head's
       own children are looked at again.
   (2) The panels asked "how wide is the room?" many times in one move (Settings: about seventeen), and each ask between
       two writes made the browser lay the page out anew. insRoom now measures once a turn; a resize or the next turn
       measures afresh.
   (3) Settings drew its list and its head again for every late reading (about ten in one visit) even when they read
       the same; what would read the same is no longer written (sddPut). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const fnSrc = (src, name) => {
  const at = src.search(new RegExp('\\nfunction ' + name + '\\(')); assert.ok(at >= 0, name + ' exists');
  let i = src.indexOf('{', at), d = 0;
  for (; i < src.length; i++){ if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) break; }
  return src.slice(at + 1, i + 1);
};

/* the selectors of every <style> block, comments out */
function selectorsOf(html){
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  const out = []; let depth = 0, buf = '';
  for (const ch of css){
    if (ch === '{'){ const s = buf.trim(); if (s && !s.startsWith('@')) out.push(s); buf = ''; depth++; continue; }
    if (ch === '}'){ buf = ''; depth = Math.max(0, depth - 1); continue; }
    if (ch === ';' ){ buf = ''; continue; }
    buf += ch;
  }
  return out;
}
/* split at top-level commas, and a selector into its compounds at top-level combinators */
function topSplit(s, isSep){
  const parts = []; let d = 0, cur = '';
  for (let i = 0; i < s.length; i++){ const ch = s[i];
    if (ch === '(' || ch === '[') d++; else if (ch === ')' || ch === ']') d--;
    if (d === 0 && isSep(ch, s, i)){ parts.push(cur); cur = ''; continue; }
    cur += ch; }
  parts.push(cur); return parts.map(x => x.trim()).filter(Boolean);
}
const subjectOf = sel => { const c = topSplit(sel.replace(/\s*([>+~])\s*/g, ' '), ch => ch === ' '); return c[c.length - 1] || ''; };

test('f1240 (1) no :has() rule ends on a bare :not() or *, which re-styles the whole page on every change', () => {
  const bad = [];
  for (const rule of selectorsOf(read('index.html'))) for (const sel of topSplit(rule, ch => ch === ',')){
    if (!sel.includes(':has(')) continue;
    const subj = subjectOf(sel);
    if (/^(:not\(|\*(?![\w-]))/.test(subj) || subj === '') bad.push(sel.slice(0, 160));
  }
  assert.deepEqual(bad, [], 'a :has() rule whose last part is a bare :not()/* — give it what it can be: :where(div, span, …):not(…)');
});

test('f1240 (1b) the panel heads still hide the same parts, with no weight added', () => {
  const H = read('index.html');
  assert.match(H, /> :where\(div,span,button,a,i,b,em,strong,small,h1,h2,h3,h4,h5,h6,p,svg,label,input,select,textarea,section,nav,aside,header,footer,ul,ol,li,img,form,details,summary,table,canvas,time,kbd,mark,figure,output,progress,meter\):not\(#igd-collapse, \.flex-1\)\{display:none\}/);
  assert.match(H, /\.jl-head > :where\([^)]*\):not\(\.jl-fold, \.jl-sp\)\{display:none\}/);
  assert.match(H, /:has\(> \.pd2-amx:not\(\.is-signed\)\) > :where\([^)]*\):not\(\.pd2-amx\)\{display:none\}/);
});

/* (2) insRoom, run with a counted measure */
function roomWorld(){
  const SRC = read('js/views/inspector.js');
  const code = ['let _insRoomNow = null;', fnSrc(SRC, 'insRoomForget'), fnSrc(SRC, 'insRoom')].join('\n');
  const timers = [], listeners = {};
  const el = { reads: 0, w: 1040, get clientWidth(){ this.reads++; return this.w; } };
  const ctx = { document: { getElementById: id => id === 'content' ? el : null }, jlReserved: () => 400,
    setTimeout: f => timers.push(f), window: { addEventListener: (k, f) => (listeners[k] = f) } };
  vm.createContext(ctx); vm.runInContext(code + '\nthis.insRoom = insRoom; this.insRoomForget = insRoomForget;', ctx);
  return { ctx, el, flush: () => timers.splice(0).forEach(f => f()) };
}

test('f1240 (2) the room is measured once a turn, and afresh the next turn', () => {
  const { ctx, el, flush } = roomWorld();
  const a = [1, 2, 3, 4, 5].map(() => ctx.insRoom());
  assert.deepEqual(a, [1440, 1440, 1440, 1440, 1440]);
  const once = el.reads;
  assert.ok(once <= 2, 'five asks in one turn measure once (read ' + once + ' times)');
  flush(); el.w = 900;
  assert.equal(ctx.insRoom(), 1300, 'the next turn measures again');
});

test('f1240 (2b) nothing measured is never kept, and a resize forgets', () => {
  const { ctx, el } = roomWorld();
  el.w = 0; ctx.insRoom(); el.w = 1040;
  assert.equal(ctx.insRoom(), 1440, 'a page not laid out yet (0) is asked again');
  el.w = 600; ctx.insRoomForget();
  assert.equal(ctx.insRoom(), 1000, 'a resize (insRoomForget) measures afresh in the same turn');
  assert.match(read('js/views/inspector.js'), /window\.addEventListener\('resize', insRoomForget, true\)/, 'the window\'s resize forgets');
});

/* (3) Settings' late readings write only what changed */
test('f1240 (3) Settings draws its list and head only when they would read differently', () => {
  const SRC = read('js/views/settings.js');
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fnSrc(SRC, 'sddPut') + '\nthis.sddPut = sddPut;', ctx);
  let writes = 0;
  const el = { _v: '', firstChild: null, get innerHTML(){ return this._v; }, set innerHTML(v){ writes++; this._v = v; this.firstChild = v ? {} : null; } };
  assert.equal(ctx.sddPut(el, '<b>a</b>'), true); assert.equal(writes, 1);
  assert.equal(ctx.sddPut(el, '<b>a</b>'), false, 'the same again writes nothing'); assert.equal(writes, 1);
  el._v = '<b>a</b><i>moved</i>';
  assert.equal(ctx.sddPut(el, '<b>a</b>'), true, 'something else wrote into it since: written'); assert.equal(writes, 2);
  assert.equal(ctx.sddPut(el, '<b>b</b>'), true, 'new words are written'); assert.equal(writes, 3);
  const R = fnSrc(SRC, 'sddRepaint'), L = fnSrc(SRC, 'sddListPaint');
  assert.match(R, /sddPut\(h, sddHeadHtml\(stIsAdmin\(\)\)\)/, 'the head through sddPut');
  assert.match(L, /sddPut\(m, sddMainHtml\(stIsAdmin\(\)\)\)/, 'the list through sddPut');
});

test('f1240 (4) the panel frame writes only what changed', () => {
  const SRC = read('js/views/inspector.js');
  assert.match(fnSrc(SRC, 'jlLayout'), /h\.style\.getPropertyValue\('--jl-top'\) !== top \+ 'px'/, 'the top is set only when it moved');
  assert.match(fnSrc(SRC, 'jlHeadPaint'), /if \(w\.textContent !== word\) w\.textContent = word;/, 'the word only when it changed');
  assert.match(fnSrc(SRC, 'jlGreetPut'), /if \(g\._jlGreet !== gh \|\| g\.innerHTML !== g\._jlGreetSer\)/, 'the greeting only when it changed');
});
