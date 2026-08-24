/* ============================================================
   f156 — choosing a reviewer in a company of hundreds
   ============================================================
   Two faults reported off one screenshot, and they are unrelated except that
   both reached a real user's eyes.

   1. THE FIELD WAS INVISIBLE. Every input in this feature carried
      class="ui-input", which this application does not define anywhere — so
      they rendered with the browser's bare default and the reviewer picker, the
      one control the dialog exists to set, read as a line of stray text. The
      test is blunt: no element in the review's markup may claim a class the app
      does not style, and the picker must carry a real border.

   2. THE LIST DOES NOT SCALE. A <select> is a list you scroll, and it stops
      being usable somewhere around thirty people. It takes typing now, matched
      against names AND addresses, because half the time what you have is an
      email somebody sent you.

   AND THE REFUSALS ARE THE INTERESTING PART. A reviewer must be a colleague
   with a seat: they have to clear or hold each change, and a hold is liftable
   only by them. Post a review to an address with no seat behind it and the
   wording sits behind a wall nobody can open, with the gate holding it there —
   a deadlock created by a typo. So four different mistakes get four different
   sentences rather than one grey button.

   3. AND THE MOJIBAKE. "There is nothing to review â nothing unsent of yours"
      shipped to a screen. The dictionary block was inserted through
      .decode('unicode_escape'), which reads bytes as Latin-1, so every literal
      em dash came out double-encoded. The guard below is not about that one
      string: a C1 control character (U+0080–U+009F) cannot occur in real prose
      in any language, so its presence anywhere in the dictionary is proof of a
      broken encoding, whatever produced it.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const ME    = { id: 'u_me',   name: 'Wanjiru Kamau',  role: 'legal',  email: 'wanjiru@wanjiru.co.ke' };
const BOSS  = { id: 'u_boss', name: 'Achieng Otieno', role: 'admin',  email: 'achieng@wanjiru.co.ke' };
const TWIN  = { id: 'u_twin', name: 'Achieng Wafula', role: 'legal',  email: 'a.wafula@wanjiru.co.ke' };
const VIEW  = { id: 'u_view', name: 'Read Only',      role: 'viewer', email: 'ro@wanjiru.co.ke' };

/* A company big enough that a dropdown is the wrong control — which is the
   whole point of the change. */
function crowd(n){
  const out = [ME, BOSS, TWIN, VIEW];
  for (let i = 0; i < n; i++)
    out.push({ id: 'u_' + i, name: 'Person Number ' + i, role: 'legal', email: 'p' + i + '@wanjiru.co.ke' });
  return out;
}

function world(people){
  const w = buildWorld({ user: ME });
  w.win.state = { settings: {}, contracts: [] };
  w.win.getUsers = () => people || [ME, BOSS, TWIN, VIEW];
  w.win.userById = id => (people || [ME, BOSS, TWIN, VIEW]).find(u => u.id === id) || null;
  return w.win;
}

/* ============================================================
   1 — THE DICTIONARY IS NOT MANGLED
   ============================================================ */
describe('f156 · the dictionary carries no broken encoding', () => {
  test('no C1 control character appears anywhere in i18n.js', () => {
    const src = read('js/i18n.js');
    const bad = [];
    src.split('\n').forEach((line, i) => {
      /* U+0080–U+009F. Legitimate prose never contains these; double-encoded
         UTF-8 always does. */
      if (/[-]/.test(line)) bad.push((i + 1) + ': ' + line.trim().slice(0, 90));
    });
    assert.deepEqual(bad, [],
      'a mangled string reaches the screen as "â" — see the header of this file');
  });

  test('the string that shipped broken reads properly now', () => {
    const win = world();
    win.langSet && win.langSet('en');
    assert.match(win.i18t('rv_nothing_to_review'), /nothing to review — nothing unsent/,
      'a real em dash, not three Latin-1 characters');
  });

  test('every other source file is clean too', () => {
    for (const f of ['js/review.js', 'js/views/negotiation.js', 'js/views/settings.js',
                     'js/views/home.js', 'js/mobile-contract.js']){
      assert.ok(!/[-]/.test(read(f)), f + ' carries a double-encoded character');
    }
  });
});

/* ============================================================
   2 — THE FIELD LOOKS LIKE A FIELD
   ============================================================ */
describe('f156 · the picker is visible', () => {
  test('nothing claims the phantom ui-input class any more', () => {
    /* Comments are stripped WHOLESALE rather than line by line: the note in
       review.js explaining this bug quotes the class name, and a line-prefix
       filter does not recognise the middle lines of a block comment. */
    const code = f => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const f of ['js/review.js', 'js/views/settings.js']){
      assert.ok(!/class="[^"]*\bui-input\b/.test(code(f)),
        f + ' still styles a field with a class the application does not define');
    }
  });

  test('the reviewer field is drawn with a real border and a label bound to it', () => {
    const win = world();
    const c = { id: 'MK-1', name: 'A', counterparty: 'B', audit: [], versions: [], rounds: [],
      redlineText: '<h1>T</h1><h2>1. One</h2><p>alpha</p>', format: 'rich' };
    win.negoInit(c);
    const html = win.reviewAskModalHtml(c);
    assert.match(html, /id="rv-who"/);
    assert.match(html, /<label for="rv-who"/, 'the label points at the field');
    const field = html.slice(html.indexOf('id="rv-who"') - 400, html.indexOf('id="rv-who"') + 400);
    /* REVERSED IN PLACE 23 Aug 2026 — the CLAIM is unchanged and is the point:
       this field has the house border rather than an invented one. The house
       border moved from --color-divider to --field-line in the design-system
       pass, because WCAG 1.4.11 wants 3:1 on a control's own boundary and the
       divider measures about 1.3:1 — a field edge nobody can see is not an
       edge. Pinned as the TOKEN, not as a colour, so the next retune is free. */
    assert.match(field, /border:1px solid var\(--field-line\)/, 'it has the house field border');
    assert.match(field, /role="combobox"/, 'and it is a combobox, not a bare select');
    assert.ok(!/<select id="rv-who"/.test(html), 'the scrolling list is gone');
  });
});

/* ============================================================
   3 — SEARCH, AT THE SIZE A REAL COMPANY IS
   ============================================================ */
describe('f156 · finding somebody among hundreds', () => {
  test('an empty query offers a capped list and says how many it left out', () => {
    const win = world(crowd(400));
    const r = win.reviewSearchPeople('', 8);
    assert.equal(r.hits.length, 8, 'capped');
    assert.ok(r.total > 400, 'and it knows the real total');
    const html = win.reviewPickerListHtml('', null);
    assert.match(html, /more match/, 'the list says it is not showing everybody');
  });

  test('typing matches on the name', () => {
    const win = world(crowd(400));
    const hits = win.reviewSearchPeople('achieng', 8).hits.map(u => u.name);
    assert.ok(hits.indexOf('Achieng Otieno') >= 0);
    assert.ok(hits.indexOf('Achieng Wafula') >= 0, 'both people called Achieng');
  });

  test('and on the email, which is what you usually have in your hand', () => {
    const win = world(crowd(400));
    const hits = win.reviewSearchPeople('a.wafula@', 8).hits;
    assert.equal(hits.length, 1);
    assert.equal(hits[0].name, 'Achieng Wafula');
  });

  test('an exact match sorts above a partial one', () => {
    const win = world(crowd(50));
    const hits = win.reviewSearchPeople('achieng@wanjiru.co.ke', 8).hits;
    assert.equal(hits[0].name, 'Achieng Otieno');
  });

  test('viewers and you are never in the list', () => {
    const win = world();
    const names = win.reviewSearchPeople('', 20).hits.map(u => u.name);
    assert.ok(names.indexOf('Read Only') < 0, 'a viewer cannot rule, so it is not offered');
    assert.ok(names.indexOf('Wanjiru Kamau') < 0, 'nobody reviews their own ask');
  });
});

/* ============================================================
   4 — WHAT A TYPED STRING RESOLVES TO
   ============================================================ */
describe('f156 · resolving what was typed', () => {
  test('a pasted email address resolves without opening the list', () => {
    const win = world(crowd(400));
    const r = win.reviewResolvePerson('achieng@wanjiru.co.ke');
    assert.equal(r.ok, true);
    assert.equal(r.user.id, BOSS.id);
  });

  test('the value the list itself writes back resolves too', () => {
    const win = world();
    const r = win.reviewResolvePerson('Achieng Otieno <achieng@wanjiru.co.ke>');
    assert.equal(r.ok, true, 'a chosen value that is re-read must still resolve');
    assert.equal(r.user.id, BOSS.id);
  });

  test('one unambiguous partial match is a match; two are a question', () => {
    const win = world();
    assert.equal(win.reviewResolvePerson('wafula').ok, true, 'only one Wafula');
    const two = win.reviewResolvePerson('achieng');
    assert.equal(two.ok, false);
    assert.match(two.why, /matches 2 people/, 'and it says how many, rather than guessing');
  });

  test('an address with no seat behind it is refused, and the refusal says why', () => {
    const win = world();
    const r = win.reviewResolvePerson('someone@elsewhere.example');
    assert.equal(r.ok, false);
    assert.match(r.why, /not a member of this workspace/);
    assert.match(r.why, /clear or hold/, 'and explains what a reviewer has to be able to do');
  });

  test('a viewer is refused by name, with the fix', () => {
    const win = world();
    const r = win.reviewResolvePerson('ro@wanjiru.co.ke');
    assert.equal(r.ok, false);
    assert.match(r.why, /Read Only is a Viewer/);
    assert.match(r.why, /Admin to change their role/);
  });

  test('yourself is refused as its own mistake', () => {
    const win = world();
    const r = win.reviewResolvePerson('wanjiru@wanjiru.co.ke');
    assert.equal(r.ok, false);
    assert.match(r.why, /cannot review your own changes/);
  });

  test('nonsense that is not an address gets the other message', () => {
    const win = world();
    const r = win.reviewResolvePerson('zzzz');
    assert.equal(r.ok, false);
    assert.match(r.why, /Nobody in this workspace matches/);
  });

  test('the client and the server refuse the same things', () => {
    /* The route resolves the reviewer from the users table and refuses a
       stranger and a viewer. If the screen ever allowed one through, the send
       would simply fail later with no explanation. */
    const srv = read('server/server.js');
    const at = srv.indexOf("app.post('/api/contracts/:id/review-request'");
    assert.ok(at > 0, 'the route still exists');
    const route = srv.slice(at, at + 2000);
    assert.match(route, /not a member of this workspace/);
    assert.match(route, /role === 'viewer'/);
  });
});
