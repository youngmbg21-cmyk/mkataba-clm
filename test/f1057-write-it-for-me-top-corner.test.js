/* f1057 — "WRITE IT FOR ME" IN THE TOP CORNER (owner's pick by name, 15 Nov 2026: "The write for me seems to be inside
   the email … it stays on the top right of the email body and it never goes to the receiver of the email"; "build Top
   corner"). A grey tool pill with Jambo's sparkle, level with the letter's first line in its top-right corner, off the
   note's line; only that first line keeps clear of it; the note then has the letter's whole width. Screen only: the
   email is built from the letter's parts (js/sharemail.js), never from the button. Pins the sheet's region and the
   builder, comments stripped; the painted screen is GitHub's (send-note-on-the-paper-verify part 5).
   Red at the parent: the button was a green underlined link after the note, the fit took its width off the note. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CSS = read('index.html').replace(/\/\*[\s\S]*?\*\//g, '');
const CORE = read('js/core.js').replace(/\/\*[\s\S]*?\*\//g, '');
const M = require('../js/sharemail.js');
const X = 'html.lg-new :is(#modal-root,#ig-page,#content) [data-share-sap].sh-letter #sh-letter.sh-lt.is-sap.is-steps';

test('f1057 (1) the button stands in the letter\'s top-right corner, level with its first line, off the note\'s line', () => {
  assert.ok(CSS.includes(X + '.is-note-paper .sh-lt-b{position:relative}'));
  assert.ok(CSS.includes(X + '.is-note-paper .sh-lt-note:not(.is-nowhere) > .sh-nl-jb{position:absolute;top:18px;right:0;margin:0;padding:0}'));
  assert.ok(CSS.includes(X + '.is-note-paper .sh-lt-b > #sh-lt-before > .sh-lt-p:first-child::before{content:"";float:right;width:144px;height:var(--s-4)}'), 'only the first line keeps clear of it');
});
test('f1057 (2) it is a grey tool pill with Jambo\'s sparkle, never a green underlined link', () => {
  assert.ok(CSS.includes(X + ' .sh-nl-jb .sh-nl-write{display:inline-flex;align-items:center;gap:var(--s-1);height:var(--ctl-h);padding:0 var(--s-3);border-radius:999px;background:var(--surface-2);color:var(--color-text);'));
  assert.ok(/\.sh-nl-jb \.sh-nl-write\{[^}]*text-decoration:none/.test(CSS.slice(CSS.indexOf(X + ' .sh-nl-jb .sh-nl-write{'))));
  assert.match(CORE, /data-sh-nl-write="\$\{esc\(c\.id\)\}">\$\{typeof icon==='function'\?icon\('sparkle','w-3\.5 h-3\.5'\):''\}\$\{esc\(i18t\('sh_nl_write'\)\)\}<\/button>/);
});
test('f1057 (3) the note has the letter\'s whole width: the fit takes nothing off for the button', () => {
  const i = CORE.indexOf('function shareLetterNoteFit('); const f = CORE.slice(i, CORE.indexOf('\nfunction ', i + 10));
  assert.match(f, /const room=Math\.max\(160, body\.clientWidth\);/);
  assert.doesNotMatch(f, /jb\.getBoundingClientRect\(\)\.width/);
});
test('f1057 (4) it never reaches the receiver: the email carries no "Write it for me"', () => {
  const m = M.shareMailOf({ channel: 'email', purpose: 'negotiate', sender: 'Amina Otieno', org: 'Highland', cName: 'Warehousing agreement',
    recName: 'Kari Lunde', link: 'https://hati.example/#share=t:a', round: 2, drawn: true, answers: { lines: [], own: [] } });
  assert.ok(!/Write it for me/i.test(m.body + m.html + m.subject));
});
