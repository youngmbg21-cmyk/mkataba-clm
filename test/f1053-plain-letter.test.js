/* f1053 — PLAIN LETTER (owner's pick by name, 14 Nov 2026: "build Plain letter", after "the page looks chaotic"; and
   step 1 "the words are overlapping the grey area"). The drawn letter says the round in ONE sentence in the sender's
   voice (smRoundSentence, js/sharemail.js, both hosts) instead of two lists; the note is a line of the letter with
   "Write it for me" after it; "Kind regards," the letter's size; step 1 keeps 16px inside its grey, lists its person
   once and "+ Add someone" on one line. Pins the reading and the sheet's region, comments stripped; the painted screen
   is GitHub's (send-note-on-the-paper-verify). Red at the parent: no smRoundSentence, the lists, none of the rules. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../js/sharemail.js');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CSS = read('index.html').replace(/\/\*[\s\S]*?\*\//g, '');
const I = read('js/i18n.js');
const base = { channel: 'email', purpose: 'negotiate', sender: 'Amina Otieno', org: 'Highland Corporate Ltd', cName: 'Warehousing agreement',
  recName: 'Kari Lunde', link: 'https://hati.example/#share=t:abc', round: 2, drawn: true };
const own = names => names.map(c => ({ clause: c }));

test('f1053 (1) the round is one sentence in the sender\'s voice, as drawn', () => {
  assert.strictEqual(typeof M.smRoundSentence, 'function');
  assert.strictEqual(M.smRoundSentence({ lines: [{ clause: 'Clause 2 · Term and Termination', say: 'they accept your change.' }],
    own: own(['Clause 3 · Pricing and Payment', 'Clause 5 · Limitation of Liability', 'Data Protection', 'Quality & Rejection', 'Liability']) }),
  'We accept your change to clause 2, Term and Termination, and propose changes to five clauses: Pricing and Payment, Limitation of Liability, Data Protection, Quality & Rejection, and Liability.');
  assert.strictEqual(M.smRoundSentence({ lines: [{ clause: 'Clause 5 · Payment', say: 'they propose 45 days (you asked for 60).' }], own: [] }),
    'We propose 45 days for clause 5, Payment (you asked for 60).');
  assert.strictEqual(M.smRoundSentence({ lines: [{ clause: 'Clause 4 · Fees', say: 'they keep the current wording.' }, { clause: 'Clause 7 · Notice', say: 'they propose new wording.' }], own: own(['Clause 1 · Scope']) }),
    'We keep the current wording of clause 4, Fees, propose new wording for clause 7, Notice, and propose a change to clause 1, Scope.');
  assert.strictEqual(M.smRoundSentence({ lines: [], own: [] }), '');
  assert.strictEqual(M.smRoundSentence(null), '');
});
test('f1053 (2) the drawn email carries the sentence, never the lists; with a note, the note speaks instead', () => {
  const answers = { asked: 1, lines: [{ clause: 'Clause 2 · Term', say: 'they accept your change.' }], own: own(['Clause 3 · Price']) };
  const m = M.shareMailOf(Object.assign({}, base, { answers }));
  assert.match(m.body, /^Dear Kari,\n\nWe accept your change to clause 2, Term, and propose a change to clause 3, Price\.\n\n/);
  assert.ok(!m.parts.some(p => p.k === 'ans'), 'no list lines');
  assert.ok(!/has answered|of its own/.test(m.body), 'no list heads');
  assert.match(m.html, /<p style="margin:0 0 14px;white-space:pre-wrap">We accept your change to clause 2, Term, and propose a change to clause 3, Price\.<\/p>/);
  const n = M.shareMailOf(Object.assign({}, base, { answers, message: 'Thanks for round 1.' }));
  assert.ok(!/We accept/.test(n.body), 'the note speaks instead');
  const old = M.shareMailOf(Object.assign({}, base, { answers, drawn: false }));
  assert.match(old.body, /has answered your redline:/, 'the old look keeps its letter');
});
test('f1053 (3) step 1: 16px inside the open step, its person once, "+ Add someone" one line', () => {
  const X = 'html.lg-new :is(#modal-root,#ig-page,#content) [data-share-sap].sh-letter #sh-letter.sh-lt.is-sap.is-steps';
  assert.ok(CSS.includes(X + ' .sh-lt-row.sh-st.is-open{padding:var(--s-4)}'));
  assert.ok(CSS.includes(X + ' .sh-lt-row.sh-st #sh-lt-tosay:not(.hidden){display:none}'));
  assert.ok(CSS.includes(X + ' .sh-st-add > button{display:inline-flex;'));
});
test('f1053 (4) the note is a line of the letter: a row, no label on show, its empty words said; Kind regards the letter\'s size', () => {
  const X = 'html.lg-new :is(#modal-root,#ig-page,#content) [data-share-sap].sh-letter #sh-letter.sh-lt.is-sap.is-steps';
  assert.ok(CSS.includes(X + '.is-note-paper .sh-lt-note:not(.is-nowhere){display:flex;flex-direction:row;flex-wrap:wrap;'));
  assert.ok(CSS.includes(X + '.is-note-paper .sh-lt-note:not(.is-nowhere) > label{display:contents}'));
  assert.ok(CSS.includes(X + '.is-note-paper .sh-lt-note:not(.is-nowhere) textarea::placeholder{color:var(--color-neutral-400);font-style:italic;'));
  assert.ok(CSS.includes(X + ' #sh-lt-after .sh-lt-say.is-lead{font-family:var(--font-doc);font-size:15px;'));
  assert.strictEqual((I.match(/\n {4}sh_lt_note_ph: /g) || []).length, 2, 'both books');
  const core = read('js/core.js').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(core, /if\(onPaper && host\.classList\.contains\('is-steps'\) && !\(st && st\.purpose==='history'\)\)\{ const ph=i18t\('sh_lt_note_ph'\)/);
  assert.match(core, /ta\.style\.width=want<=room \? want\+'px' : '100%';/);
  assert.match(core, /p\.k==='ans' \|\| p\.k==='round'/, 'Jambo is told the sentence goes');
});
