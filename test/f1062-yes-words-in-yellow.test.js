/* f1062 · THE WORDS THAT SAY YES, IN YELLOW (owner, 15 Nov 2026: "In the quotes on the side panel, can you highlight the
   quotes in yellow where the search comes back affirmative?"; drawing 9fYJUU6vQFMteWzNMGgi2Q; "Affirmative is the answer
   is yes and only words that say yes"). Jambo names the shortest run of words that says yes (`yes_words`); the server
   keeps them only where they stand in the quote as given; the panel marks them in yellow (`--hl-yes`) for a Yes answer
   only, with a Yes / No tag beside the name; anything not found is left unmarked, never guessed. Fails at the parent. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const SRV = strip(read('server/server.js')), RD = read('js/views/reads.js'), CSS = read('index.html'), TOK = read('docs/design/tokens.json');
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return src.slice(i, src.indexOf('\n}\n', i) + 3); };
const _rdE = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

test('f1062 (1) Jambo is asked for the words that say yes; the server keeps them only inside the quote, only for a Yes', () => {
  assert.match(SRV, /yes_words: \{ type: 'string', description: 'Only when yes is true: the shortest run of words, copied EXACTLY from quote/);
  assert.match(SRV, /yesWords: \(found && d\.yes === true && quote && s\(d\.yes_words\) && colFlat\(quote\)\.includes\(colFlat\(s\(d\.yes_words\)\)\)\) \? s\(d\.yes_words\)\.slice\(0, 300\) : '',/);
});

test('f1062 (2) the panel marks only those words, only for a Yes, and never guesses', () => {
  const dsnYesMarked = new Function('_rdE', fn(RD, 'dsnYesMarked') + '; return dsnYesMarked;')(_rdE);
  const q = "Each party's liability is capped at the total fees paid in the twelve (12) months before the claim.";
  assert.equal(dsnYesMarked({ yes: true, quote: q, yesWords: 'capped at the total  fees paid in the twelve (12) months' }),
    "Each party&#39;s liability is <mark class=\"dsn-yes\">capped at the total fees paid in the twelve (12) months</mark> before the claim.".replace('&#39;', "'"));
  assert.doesNotMatch(dsnYesMarked({ yes: true, quote: q, yesWords: 'limited to KES 5M' }), /<mark/, 'words not in the quote mark nothing');
  assert.doesNotMatch(dsnYesMarked({ yes: false, quote: q, yesWords: 'capped' }), /<mark/, 'a No marks nothing');
  assert.doesNotMatch(dsnYesMarked({ yes: true, quote: q }), /<mark/, 'no words named, nothing marked');
  assert.equal(dsnYesMarked({ yes: true, quote: 'Fees < 10 apply', yesWords: '< 10' }), 'Fees <mark class="dsn-yes">&lt; 10</mark> apply', 'escaped piece by piece');
  const D = fn(RD, 'dsnDriftHtml');
  assert.match(D, /“\$\{dsnYesMarked\(a\)\}”/);
  assert.match(D, /a\.yes === true \? 'is-yes' : a\.yes === false \? 'is-no' : ''/, 'a Yes / No tag only for a yes-or-no question');
});

test('f1062 (3) the yellow is a token, in the palette and its export', () => {
  assert.match(CSS, /--hl-yes:#FFF0B3;/);
  assert.match(CSS, /\.dsn-dreel mark\.dsn-yes\{[^}]*background:var\(--hl-yes\)/);
  assert.match(TOK, /hl-yes/);
});
