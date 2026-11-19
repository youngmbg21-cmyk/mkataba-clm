'use strict';
/* f1099 — THE COVER IS A PAGE OF ITS OWN, NOT A SHEET LAID OVER THE PAPER (owner, 19 Nov 2026: "When i press on the
   contract, it goes white for a second then goes to cover but when i press the back button, the page takes me to the
   contract itself before i go back to the contracts page … this should apply to all the other areas where flashes
   are there. Go to the page not a sheet laid over").
   Before: a row's press opened the contract's paper and Dossier, then laid the Cover over them; ‹ took the Cover
   away and showed the paper, a second ‹ reached Contracts.
   (1) A contract opened on purpose draws its Cover FIRST, over the page pressed from (pdCoverGo; a heavy record read
       first, the wait said by the pointer); the paper is opened under it in the frame after, unseen (_cvHold), so every
       reading of "this contract is open" stays true.
   (2) ‹ and Esc go back to the page pressed from in ONE press (_pdMid.from), that page drawn first, the paper never shown. The bar names the contract and
       says where ‹ goes (deskCoverUp).
   (3) Going in (Open the dossier, a job): the paper is drawn UNDER the Cover, which goes only once it stands
       (pdCoverLeave, _cvHold keeps pdMidStale from taking it early), bounded by CV_LAND_MS.
   The pressed frames are measured on GitHub: no-page-flashes-verify. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const PD = strip(read('js/paperdesk.js'));
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 9); return src.slice(i, j < 0 ? undefined : j); };

test('f1099 (1) a contract opened on purpose shows its Cover first, the paper drawn under it unseen', () => {
  const go = fn(PD, 'pdCoverGo');
  assert.match(go, /ensureFull\(c\)/, 'a light row is read whole before the Cover is drawn');
  assert.match(go, /is-opening/, 'the wait is said by the pointer, nothing painted');
  const show = go.indexOf('pdCoverShow('), paper = go.indexOf("pdOpenOnHome(sid, 'open', { cover: false })");
  assert.ok(show > 0 && paper > show, 'the Cover is drawn before the paper is opened');
  assert.match(go, /requestAnimationFrame\(\(\) => setTimeout\(\(\) => \{/, 'the paper is drawn in a frame after the Cover is painted');
  assert.match(go, /_cvHold = sid;/, 'held: the paper drawn under it does not take it away');
  assert.match(go, /if \(from && from !== at\) _pdMid\.from = from;/, 'the page it was pressed from stays its way back');
  assert.match(fn(PD, 'pdCoverShow'), /openModal\(pdCoverHtml\(c\)/);
  assert.match(fn(PD, 'pdOpenOnHome'), /if \(pdCoverGo\(id\)\) return true;/, 'the door asks for the Cover first');
  const room = strip(read('js/views/contract.js'));
  assert.match(room, /if\s*\(opts\s*&&\s*opts\.cover\s*&&\s*typeof window\.pdCoverGo\s*===\s*'function'\s*&&\s*window\.pdCoverGo\(c\.id\)\)\s*return true;/, 'roomHomeLand({cover:true}) too');
});

test('f1099 (2) one ‹ goes back to the page pressed from, and the bar says so', () => {
  const C = strip(read('js/views/counter.js'));
  assert.match(fn(C, 'deskCoverUp'), /pdMidUp\('cover:' \+ id\)/);
  const bar = fn(C, 'deskBarPaint');
  assert.match(bar, /deskMidUp\(\)/, '‹ is live while a page stands in the middle');
  assert.match(bar, /if \(cover\)\{ const k = deskKeyNow\(\); where = k \? deskTabLabel\(k\) : ''; \}/, '‹ names the page under the Cover');
  assert.match(fn(C, 'deskPageName'), /const cv = deskCoverUp\(\); if \(cv\) return cv\.name;/, 'the bar names the contract');
  assert.match(fn(PD, 'pdMidSync'), /deskBarPaint\(\)/, 'the bar follows the middle');
  assert.match(fn(C, 'deskGoBack'), /pdMidClose\(\)\) return true;/, '‹ takes the Cover away, nothing else');
});

test('f1099 (3) going in, the Cover stays until the paper stands', () => {
  const leave = fn(PD, 'pdCoverLeave');
  assert.match(leave, /_cvHold = String\(id\)/);
  assert.match(leave, /CV_LAND_MS/, 'bounded');
  assert.match(fn(PD, 'pdMidStale'), /if \(_cvHold && _pdMid\.key === 'cover:' \+ _cvHold\) return false;/, 'the paper drawn under it does not take it early');
});

test('f1099 (4) every page in the middle opened from another page goes back there in one press, the paper never shown', () => {
  const on = fn(PD, 'pdMidOn');
  assert.match(on, /if \(a\.from && a\.from !== at && pc && String\(pc\.id\) === a\.id\) _pdMid\.from = a\.from;/, 'the page keeps where it was pressed from');
  assert.match(fn(PD, 'pdOpenOnHome'), /pdArriveNote\(id\);/, 'every door into a contract notes where it came from');
  assert.match(fn(PD, 'pdArriveNote'), /if \(veil\) _pdVeil\(true\);/, 'the paper is hidden while the page comes');
  assert.match(fn(PD, 'pdArriveNote'), /_pdArriveMs\(\)\);/, 'bounded');
  for (const [file, name] of [['js/paperdesk.js', 'pd2BriefGo'], ['js/paperdesk.js', 'pdKtOpen'], ['js/views/boardstrip.js', 'hbStripBring'], ['js/views/boardstrip.js', 'payEditOpen']])
    assert.match(fn(strip(read(file)), name), /pdMidArriving\(/, name + ' says a page is coming');
  assert.match(fn(strip(read('js/views/boardstrip.js')), 'hbStripBring'), /page === 'where' && typeof window\.pdCoverGo === 'function' && window\.pdCoverGo\(c\.id\)\) return true;/, 'Where we are is the Cover page');
  const back = fn(strip(read('js/views/counter.js')), 'deskGoBack');
  assert.ok(back.indexOf('pdMidFrom()') > 0 && back.indexOf('pdMidFrom()') < back.indexOf('window.pdMidClose()) return true;'), '‹ asks where the page came from before taking it away');
  assert.match(back, /if \(from === 'home'\) deskGoCounter\(\); else deskTabOpen\(from\);\s*if \(typeof window\.pdMidClose === 'function'\) window\.pdMidClose\(\);/, 'the page under is drawn first, then the middle goes');
  assert.match(PD, /if \(e\.key !== 'Escape' \|\| e\.defaultPrevented \|\| !pdMidFrom\(\)/, 'Esc does the same');
});
