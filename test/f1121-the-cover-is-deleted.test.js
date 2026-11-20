'use strict';
/* f1121 — THE COVER IS DELETED; A CONTRACT OPENS ON ITS DOSSIER (owner, 20 Nov 2026: "i want to delete the cover page
   from hati" … "Delete it, open the Dossier instead")
   (1) No Cover is built or opened anywhere: its builder, its page, its styles and its words are gone, in both books.
   (2) Every door that opened the contract on purpose (a list row, the Board, a typed number, Jambo's rows) lands on its
       paper with the face this reader opens contracts on — the Dossier unless they chose another (roomHomeLand open).
   (3) Our "Where we are" door, which opened the Cover, opens the Dossier.
   (4) Kept from the Cover's own checks (f1099 (4), f1096 (3)), which still hold for every page in the middle: a page
       opened from another page goes back there in ONE press, the paper never shown; a page arrives whole.
   At the parent (1)–(3) fail. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const glob = d => fs.readdirSync(path.join(__dirname, '..', d)).filter(f => f.endsWith('.js')).map(f => d + '/' + f);
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const PD = strip(read('js/paperdesk.js'));
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 9); return src.slice(i, j < 0 ? undefined : j); };

test('f1121 (1) no Cover is built or opened anywhere', () => {
  for (const f of [...glob('js'), ...glob('js/views')]) {
    const s = strip(read(f));
    assert.doesNotMatch(s, /\bpdCover(Go|Land|Leave|Held|Open|Show|Up|Of|Html|SheetHtml|RightHtml)\b|\bdeskCoverUp\b|\bcover: ?true\b|'cover:'/, f + ' still reaches for the Cover');
  }
  assert.doesNotMatch(strip(read('index.html')), /\.cv-page|is-cover|\.cv-desk/, 'its styles are gone');
  assert.doesNotMatch(read('js/i18n.js'), /^\s+cv_[a-z0-9_]+:/m, 'its words are gone from both books');
  assert.doesNotMatch(read('js/handbook.js'), /\bCover\b|omslag/, 'the Handbook no longer tells of it');
});

test('f1121 (2) a contract opened on purpose lands on its paper with the Dossier', () => {
  assert.match(fn(PD, 'pdOpenOnHome'), /if \(tab === 'open'\) tab = pdOpenTabOf\(c\);/);
  assert.match(fn(PD, 'pdOpenTabOf'), /return 'copilot';\s*\}?\s*$/, "the Dossier ('copilot') unless the reader chose another face");
  const land = fn(strip(read('js/views/contract.js')), 'roomHomeLand');
  assert.match(land, /return !!pdOpenOnHome\(c\.id,\(opts&&opts\.open\)\|\|mine!=='jambo'\?'open':'plain'\);/, 'a door that opens it on purpose asks for open');
  assert.match(strip(read('js/copilotacts.js')), /roomHomeLand\(R\.c\.id, R\.question \? undefined : \{ open: true \}\)/, 'a typed number alone opens it on purpose');
});

test('f1121 (3) "Where we are" opens the Dossier', () => {
  assert.match(PD, /function pd2StandsOpen\(id\)\{ return pdOpenOnHome\(id, 'copilot'\); \}/);
  assert.match(PD, /function pd2StandsUp\(\)\{ return false; \}/);
  assert.match(fn(strip(read('js/views/boardstrip.js')), 'hbStripBring'), /if \(page === 'where'\) return roomHomeLand\(c\.id, \{ open: true \}\) !== false;/);
});

test('f1121 (4) a page in the middle opened from another page goes back there in one press; a page arrives whole', () => {
  const on = fn(PD, 'pdMidOn');
  assert.match(on, /if \(a\.from && a\.from !== at && pc && String\(pc\.id\) === a\.id\) _pdMid\.from = a\.from;/, 'the page keeps where it was pressed from');
  assert.match(fn(PD, 'pdOpenOnHome'), /pdArriveNote\(id\);/, 'every door into a contract notes where it came from');
  assert.match(fn(PD, 'pdArriveNote'), /if \(veil\) _pdVeil\(true\);/, 'the paper is hidden while the page comes');
  assert.match(PD, /const _pdVeil = on => \{ if \(typeof pdMidVeil === 'function'\) pdMidVeil\(on\); \};/);
  for (const [file, name] of [['js/paperdesk.js', 'pd2BriefGo'], ['js/paperdesk.js', 'pdKtOpen'], ['js/views/boardstrip.js', 'hbStripBring'], ['js/views/boardstrip.js', 'payEditOpen']])
    assert.match(fn(strip(read(file)), name), /pdMidArriving\(/, name + ' says a page is coming');
  const back = fn(strip(read('js/views/counter.js')), 'deskGoBack');
  assert.ok(back.indexOf('pdMidFrom()') > 0 && back.indexOf('pdMidFrom()') < back.indexOf('window.pdMidClose()) return true;'), '‹ asks where the page came from before taking it away');
  assert.match(PD, /if \(e\.key !== 'Escape' \|\| e\.defaultPrevented \|\| !pdMidFrom\(\)/, 'Esc does the same');
  const CSS = strip(read('index.html'));
  const at = CSS.indexOf('.modal-in{animation:viewIn'), page = CSS.indexOf('.modal-in[data-dlg-page]{animation:none;}');
  assert.ok(at > 0 && page > at, 'a page pop-up has no fade-in, stated after the fade');
});
