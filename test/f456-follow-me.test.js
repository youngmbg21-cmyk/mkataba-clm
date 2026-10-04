/* ============================================================
   F456 — Follow me
   ============================================================
   Young picked "Follow me" by name from three: one leader, the others' pages
   follow, one press to stop.

   THE GAP. Two people on a call, both with the contract open, and the whole
   first minute of every clause goes on *"which one are you on — no, the one
   above that"*. A screen share solves it by taking one person's whole machine
   and giving everybody else a video of it; what people actually want is to be
   looking at the same clause on their own screen, with their own text size,
   their own notes and their own hands.

   SO IT IS A DESTINATION AND NOT A MIRROR, and that is the whole design. What
   travels is ONE CLAUSE ID — where the leader is looking — and the follower's
   own page goes there through the SAME door a press on a card already uses.
   No cursor, no selection, no scroll position, no keystrokes. The follower
   keeps every power they had, and if they scroll away they simply arrive again
   when the leader moves on.

   IT RIDES THE BEAT THAT WAS ALREADY GOING. Presence (idea 5) was built the
   same night and already asks the server every twenty-five seconds who else is
   here; the spot is one more field on the row it already sends, so this feature
   adds no route, no table and no timer.

   THERE IS NO INVITATION AND NOTHING TO ACCEPT. A leader does not start a
   session; a follower picks a name from the row that is already there and
   presses it. That is why there is nothing to clean up when a call ends:
   following is per sitting and a reload is out.

   AND NO BAND WAS ADDED FOR THE STATE. A strip saying "Following Amina · Stop"
   would say what the lit face already says, and the owner's standing rule is
   that a band is asked for first. The face is the way in and the way out. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const readMaybe = rel => { try { return read(rel); } catch (_) { return ''; } };

const MOD = bare(readMaybe('js/presence.js'));
const SRV = read('server/server.js');
const NEG = read('js/views/negotiation.js');
const HTML = read('index.html');
const I18N = read('js/i18n.js');
const ROUTE = bare(SRV.slice(SRV.indexOf("app.post('/api/contracts/:id/here'"),
  SRV.indexOf("app.post('/api/contracts/:id/here'") + 2200));

describe('f456 (1) — one clause id, and nothing else', () => {
  test('what travels is a destination, not a mirror', () => {
    assert.match(MOD, /function presenceSpotNow/, 'the module is there to be read');
    assert.ok(!/selectionStart|getSelection|scrollTop|keyCode|clientX|innerHTML.*spot/.test(
      MOD.slice(MOD.indexOf('function presenceSpotNow'), MOD.indexOf('let _pzFollow'))),
      'no cursor, no selection, no scroll position, no keystrokes — the follower '
      + 'keeps every power they had');
  });

  test('the spot is the clause at the CENTRE of the paper', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceSpotNow'), MOD.indexOf('let _pzFollow'));
    assert.match(fn, /elementFromPoint\(x, y\)/,
      'a rect is not a painted pixel — "looking at" is a question about what is '
      + 'on the screen, so it is asked of the screen');
    assert.match(fn, /closest\('\[data-clause\]'\)/);
    assert.ok(!/rlCpOpenId|data-rl-cp-open/.test(fn),
      'not the clause whose pencil was last pressed, which is where the reader WAS');
  });

  test('and it answers null wherever there is no paper', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceSpotNow'), MOD.indexOf('let _pzFollow'));
    assert.match(fn, /if \(!box \|\| !box\.getBoundingClientRect\) return null;/);
    assert.match(fn, /if \(!r\.width \|\| !r\.height\) return null;/,
      'so a reader on a list, a dashboard or a signed contract sends nothing at all');
  });

  test('it rides the beat that was already going — no route, no table, no timer', () => {
    assert.match(MOD, /spot \? \{ spot \} : \{\}/,
      'one more field on the row presence already sends');
    assert.equal((bare(SRV).match(/app\.post\('\/api\/contracts\/:id\/here'/g) || []).length, 1);
    assert.ok(!/setInterval/.test(MOD.slice(MOD.indexOf('function presenceWalk'))),
      'and no clock of its own');
  });
});

describe('f456 (2) — the server clamps it to what a clause id is', () => {
  test('it is taken from the body, because nothing can look it up', () => {
    assert.match(ROUTE, /String\(\(req\.body \|\| \{\}\)\.spot \|\| ''\)/,
      'only that browser knows where its reader is looking');
  });

  test('and clamped to a shape and a length, so the field cannot become a notice board', () => {
    assert.match(ROUTE, /\.slice\(0, 64\)/);
    assert.match(ROUTE, /\/\^\[A-Za-z0-9_-\]\+\$\/\.test\(spot\)/,
      'a clause id and nothing else: no spaces, no markup, no sentences');
  });

  test('a browser that sends none simply has no spot', () => {
    assert.match(ROUTE, /okSpot\s*\?[\s\S]{0,140}: \{ name: me\.name, at: new Date\(\)\.toISOString\(\) \}/,
      'rather than an empty string that every reader then has to test for');
  });

  test('and it comes back on the others\' rows, with nothing added', () => {
    const fn = bare(SRV.slice(SRV.indexOf('const srvHereOthers'), SRV.indexOf('const srvHereOthers') + 600));
    assert.match(fn, /spot: \(map\[k\] \|\| \{\}\)\.spot \|\| null/);
    assert.ok(!/email|role|seat/.test(fn), 'a name, a time and a clause');
  });
});

describe('f456 (3) — the walk goes through the door a press already uses', () => {
  test('it calls the product\'s own jump and knows no other way to move a page', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceWalk'), MOD.indexOf('/* ---- THE ROW ----'));
    assert.match(fn, /window\.rlJumpToClause\(spot\)/,
      'which lights the clause and scrolls to it, so the follower\'s arrival '
      + 'looks exactly like their own press');
    assert.ok(!/scrollTo|scrollIntoView|scrollTop/.test(fn),
      'nothing here knows how to move a page of its own');
    assert.match(fn, /typeof window\.rlJumpToClause !== 'function'\) return false/,
      'and it stands down where that door does not exist');
  });

  test('it moves the page only when the leader has MOVED', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceWalk'), MOD.indexOf('/* ---- THE ROW ----'));
    assert.match(fn, /spot === _pzWent\) return false/,
      'otherwise the follower\'s page would re-centre itself every twenty-five '
      + 'seconds on a clause they are already reading — the page taking the '
      + 'reader\'s place rather than keeping up with somebody else');
  });

  test('and the leader leaving the room stands the follow down', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceWalk'), MOD.indexOf('/* ---- THE ROW ----'));
    assert.match(fn, /if \(!lead\)\{ _pzFollow = null; _pzWent = null; return false; \}/,
      'rather than left pointing at a name that is gone');
  });

  test('the walk happens after the answer and before the paint', () => {
    const say = MOD.slice(MOD.indexOf('async function presenceSay'), MOD.indexOf('function presenceStart'));
    const walk = say.indexOf('presenceWalk(rows)');
    const paint = say.indexOf('_pzAfter(id)');
    assert.ok(walk > 0 && paint > walk,
      'arriving at the leader\'s clause is what the reader is waiting for, and '
      + 'the row\'s lit face should already say who they are following');
  });
});

describe('f456 (4) — one at a time, per sitting, and the way out is the way in', () => {
  test('following two people is not possible', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceFollow(id)'), MOD.indexOf('/* ---- AND THE WALK ----'));
    assert.match(fn, /_pzFollow = \(to && _pzFollow !== to\) \? to : null/,
      'two pages fighting over one scroll');
  });

  test('the same press stops it', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceFollow(id)'), MOD.indexOf('/* ---- AND THE WALK ----'));
    assert.match(fn, /_pzFollow !== to\) \? to : null/,
      'pressing the face you are following turns it off — the owner\'s own rule '
      + 'that the press which opens a thing closes it');
  });

  test('it is per sitting and never on the record', () => {
    assert.match(MOD, /let _pzFollow = null, _pzWent = null;/);
    assert.ok(!/localStorage|sessionStorage|persist\(|api\([^)]*follow/.test(MOD),
      'there is nothing to clean up when a call ends, and a reload is out');
  });

  test('and a different contract is a different room', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceStart'), MOD.indexOf('function presenceStop'));
    assert.match(fn, /String\(_pzWas \|\| ''\) !== id\)\{ _pzFollow = null; _pzWent = null; \}/,
      'the names, the clauses and the colleagues are all different — while the '
      + 'SAME contract keeps the follow across the room and the negotiate page, '
      + 'which setView stops the beat between');
  });
});

describe('f456 (5) — the face is the control, and there is NO BAND', () => {
  test('each face is a real button, lit while it is the one being followed', () => {
    const fn = MOD.slice(MOD.indexOf('const faceHtml ='), MOD.indexOf('return `<span class="pz-row"'));
    assert.match(fn, /<button type="button" class="pz-face\$\{on \? ' is-following' : ''\}"/);
    assert.match(fn, /aria-pressed="\$\{on \? 'true' : 'false'\}"/,
      'a toggle says which way it is set, or a keyboard reader cannot tell');
    assert.match(fn, /data-pz-follow="/);
  });

  test('and the sentence is on it, because a face alone cannot say what a press does', () => {
    const fn = MOD.slice(MOD.indexOf('const faceHtml ='), MOD.indexOf('return `<span class="pz-row"'));
    assert.match(fn, /i18t\('pz_following'[\s\S]{0,60}i18t\('pz_follow'/);
    for (const k of ['pz_follow', 'pz_following'])
      assert.ok(I18N.split(k + ':').length - 1 >= 2, k + ' is missing from one of the two books');
  });

  test('NO BAND, NO STRIP AND NO NOTICE was added for the state', () => {
    assert.match(MOD, /data-pz-follow=/, 'the feature is there, or this not-doing is about nothing');
    assert.ok(!/pz-strip|pz-band|pz-bar|pz-notice/.test(MOD + HTML),
      'a strip saying "Following Amina · Stop" would say what the lit face '
      + 'already says. The owner\'s standing rule: a band is asked for first');
    assert.ok(!/toast\(/.test(MOD),
      'and a toast on every arrival would be the loudest possible way to say '
      + '"the page moved", about a page the reader is watching move');
  });

  test('the lit face keeps the face\'s exact size', () => {
    assert.match(HTML, /button\.pz-face\{ padding:0;/,
      'so the row does not move when the feature is on');
    assert.match(HTML, /button\.pz-face\.is-following\{ background:var\(--accent-solid\)/);
  });

  test('and it is a button ONLY where the walk can work', () => {
    const fn = MOD.slice(MOD.indexOf('const canWalk ='), MOD.indexOf('return `<span class="pz-row"'));
    assert.match(fn, /getElementById\('view-redline'\) \|\| document\.querySelector\('\.redline-page'\)/,
      'the walk needs the negotiate page\'s paper');
    assert.match(fn, /typeof window\.rlJumpToClause === 'function'/);
    assert.match(fn, /if \(!canWalk\) return `<span class="pz-face"/,
      'on the Document tab a button would quietly do nothing — the dead-button '
      + 'fault this codebase names in four other places. Presence is drawn '
      + 'everywhere; Follow me is offered where it works');
  });

  test('the press is delegated at module load, and resolves the live element', () => {
    assert.match(MOD, /document\.addEventListener\('click', ev =>[\s\S]*?closest\('\[data-pz-follow\]'\)/,
      'the row is painted into a slot on a head rebuilt every render, so a '
      + 'listener bound to the faces would be bound to faces that no longer exist');
  });
});

describe('f456 (6) — it runs where it is used', () => {
  test('the negotiate page starts the beat too', () => {
    assert.match(bare(NEG), /presenceStart\(c\.id, presencePaint\); presencePaint\(c\.id\)/,
      'this is the page Follow me walks, and the head here is the room\'s head '
      + 'so it already carries the slot');
  });

  test('and the two starts share one beat', () => {
    assert.equal([...bare(NEG + read('js/views/contract.js')).matchAll(/presenceStart\(/g)].length, 2,
      'the room and the negotiate page, and presenceStart is idempotent per '
      + 'contract so moving between them re-uses one beat');
  });
});
