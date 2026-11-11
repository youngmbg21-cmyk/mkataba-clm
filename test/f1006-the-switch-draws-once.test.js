/* f1006 — THE CLEAN | REDLINE | THEIR VIEW SWITCH DRAWS ONCE
   ==========================================================
   The owner, 11 Nov 2026: "why is the press from clean to redlines and so
   forth have a delay?"

   THE FAULT, MEASURED (a 40-section contract, a real Chromium, the owner's
   1440×780): a press took 250–400 ms, Their view 700 ms.
     · eight rules asked body:has(#ig-dock > …), and four asked
       ":has(> #sh-lt-goes) > *" with nothing named in front. With them on the
       page ANY small change anywhere (a class, a note, a page mark) made the
       browser read every style on the page again: about 25 ms a time against
       0.2 ms without, several times a press;
     · the old paper's width watcher heard itself leave the page as "width 0"
       and laid every note out a second time;
     · Their view drew the whole paper twice, once on the press and once when
       its panel opened;
     · the notes narrowed the sheet AFTER it had been cut into pages, so the
       whole contract was laid out again.
   After: 105 ms, 190 ms and 230 ms on the same contract.

   WHAT IS PINNED HERE (the browser's half is switch-draws-once-verify):
     1 · no rule asks body:has(#ig-dock …); the page carries the two facts
     2 · renderIntelDock writes them at every one of its writes
     3 · no ":has(> #sh-lt-goes)"; the Send column says it itself
     4 · a ":has" with nothing named in front of it is not added (only shrinks)
     5 · a paper taken off the page is not a width that moved
     6 · the switch does not draw the paper before opening Their view's panel
     7 · the paper takes its notes' width before it is cut into pages

   Run: node --test test/f1006-the-switch-draws-once.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = f => { try { return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); } catch (_) { return ''; } };
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ');
const stripJs = t => strip(t).replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1 ');
const CSS = strip(read('index.html'));
const IG = stripJs(read('js/views/intelligence.js'));
const PD = stripJs(read('js/paperdesk.js'));
const CORE = stripJs(read('js/core.js'));

/* the body of one function, found by name */
function fnBody(src, name) {
  const at = src.search(new RegExp('function\\s+' + name + '\\s*\\('));
  if (at < 0) return '';
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') d++;
    else if (src[i] === '}' && --d === 0) return src.slice(open, i + 1);
  }
  return '';
}

/* A ":has" WITH NOTHING NAMED IN FRONT OF IT is asked of every element on the
   page. The two that stood before this change (neither sits over the paper;
   BUGLOG 11 Nov 2026) may leave; none may join. */
const BARE_HAS_KNOWN = [':has(> #ins-panel.is-jambo)', ':has(> .lh-foot)'];

describe('f1006 — the Clean | Redline | Their view switch draws once', () => {
  test('1 · no rule asks the whole body what the panel is: the page carries it', () => {
    assert.ok(!/body:has\(\s*#ig-dock/.test(CSS), 'no body:has(#ig-dock …) in index.html');
    assert.match(CSS, /#ig-page\[data-igd-head="paper"\]/, 'the paper head is read off #ig-page');
    assert.match(CSS, /#ig-page\[data-igd-door\]/, 'the folded door is read off #ig-page');
    assert.match(CSS, /:where\(\[data-igd-head="paper"\]\)/);
    assert.match(CSS, /:where\(\[data-igd-door\]\)/);
  });

  test('2 · renderIntelDock writes the two facts at every one of its writes', () => {
    const body = fnBody(IG, 'renderIntelDock');
    assert.ok(body, 'renderIntelDock found');
    const writes = (body.match(/dock\.innerHTML\s*=/g) || []).length;
    const marks = (body.match(/igDockMarks\(/g) || []).length;
    assert.ok(writes >= 3, 'the three writes are still there');
    assert.equal(marks, writes, 'one igDockMarks for each dock.innerHTML=');
    const m = fnBody(IG, 'igDockMarks');
    assert.match(m, /data-igd-head/);
    assert.match(m, /data-igd-door/);
    assert.match(m, /getElementById\('ig-page'\)/);
  });

  test('3 · the Send column says it holds "What goes": no ":has(> #sh-lt-goes)"', () => {
    assert.ok(!/:has\(\s*>\s*#sh-lt-goes\s*\)/.test(CSS));
    assert.match(CSS, /#share-step-1:where\(\.sh-lt-hasgoes\)\s*>\s*\*/);
    assert.match(CORE, /sh-lt-hasgoes/, 'js/core.js writes the class on #share-step-1');
  });

  test('4 · a ":has" with nothing named in front of it is not added', () => {
    const bare = [];
    const re = /(^|[\s>+~,{};])(:has\((?:[^()]|\([^()]*\))*\))/gm;
    let m; while ((m = re.exec(CSS))) bare.push(m[2]);
    const fresh = bare.filter(b => !BARE_HAS_KNOWN.includes(b));
    assert.deepEqual(fresh, [], 'name the element in front of :has (a class or an id)');
    assert.ok(!/:has\([^{]*\)\s*>\s*\*\s*[{,]/.test(CSS.replace(/#share-step-1:where\(\.sh-lt-hasgoes\)\s*>\s*\*/g, '')), 'no ":has(…) > *"');
  });

  test('5 · a paper taken off the page is not a width that moved', () => {
    const body = fnBody(PD, 'pd2NotesPaint');
    const at = body.indexOf('new ResizeObserver(');
    assert.ok(at > 0);
    const cb = body.slice(at, at + 400);
    assert.ok(cb.indexOf('isConnected') > 0 && cb.indexOf('isConnected') < cb.indexOf('clientWidth === w0'), 'asked before the width is compared');
    assert.match(cb, /disconnect\(\)/);
  });

  test('6 · Their view: the panel\'s opening draws the paper, the press does not draw it first', () => {
    const at = IG.indexOf("closest('[data-ig-red]')");
    assert.ok(at > 0);
    const reg = IG.slice(at, at + 1400);
    const open = reg.indexOf('pdRedOpen(p.id)'), paint = reg.indexOf('igPaintPaper()');
    assert.ok(open > 0 && paint > 0);
    assert.ok(open < paint, 'pdRedOpen comes before any igPaintPaper in the press');
    assert.match(reg, /_igPaperPaints===n0\)\s*igPaintPaper\(\)/, 'drawn here only where the opening drew none');
    assert.match(fnBody(IG, 'igPaintPaper'), /_igPaperPaints\+\+/);
  });

  test('7 · the paper takes its notes\' width before it is cut into pages', () => {
    const body = fnBody(IG, 'igPaintPaper');
    const pre = body.indexOf('pd2SheetPre(c)'), pag = body.indexOf('igPaperPaginate(c)'), html = body.indexOf('host.innerHTML=igPaperHtml(c)');
    assert.ok(html > 0 && pre > html && pag > pre, 'drawn, then pd2SheetPre, then igPaperPaginate');
    assert.match(PD, /Object\.assign\(window,\s*\{[^}]*\bpd2SheetPre\b/, 'published');
    assert.match(fnBody(PD, 'pd2NotesOff'), /_pd2Geo\s*=\s*null/, 'notes put away forget the width');
    const place = fnBody(PD, 'pd2NotesPlace');
    assert.ok(place.indexOf('offsetHeight') < place.indexOf('style.top'), 'every height is read before any note is moved');
  });
});
