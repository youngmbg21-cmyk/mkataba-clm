/* ============================================================
   F454 — Who is in the room
   ============================================================
   Young picked "On this contract" by name from three: a row of initials in the
   contract's header, and nothing on the paper.

   THE GAP. Two colleagues open the same agreement on a Tuesday afternoon and
   neither knows. The product already stops them colliding INSIDE a clause —
   the clause lock has recorded who is typing where since September and refuses
   the second pencil by name — but a lock is about the forty seconds somebody
   is in a box. It says nothing about the hour two people spend working the
   same contract in parallel, each assuming they are alone, and finding out
   from the audit trail afterwards.

   AND NOTHING ON THE PAPER, which was the owner's own instruction and is also
   the right answer. Cursors and coloured names in the wording make a document
   people stop trusting, and the agreement's pixels are the agreement's
   (CLAUDE.md's third question): a presence mark that moved while somebody was
   reading a liability cap would be the worst possible place to spend them.

   IT IS THE CLAUSE LOCK'S OWN FACT, ONE STEP WIDER, so it is written in the
   same place on the record and under the same discipline — a merge on the
   stored row, json only, never `version` and never `updated_at`. That route's
   own words, which are this one's reason too: *"presence is not an edit, and a
   record that read as edited every forty-five seconds would churn the
   register's own updated column and every watcher in the workspace"*.

   WHY IT IS ITS OWN ROUTE AND NOT THE LOCK'S. Two acts, not one. Holding a
   clause is an EDITOR's act and /lock refuses anybody else; reading a contract
   is something a VIEWER does all day, and a viewer in the room is exactly who
   you want to see. One door per act is the rule; two doors onto one act is
   what it forbids.

   WHAT THIS FILE WATCHES: the record being churned, the fact reaching the
   counterparty, a save wiping somebody out of a room they are sitting in, a
   renderer turning a repaint into a request, and a beat that outlives the
   page it was started on. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* READ TOLERANTLY, so a run against a tree WITHOUT the module reports every
   claim rather than throwing on line one. A probe that throws proves nothing —
   the house rule — and the point of running this file at the parent commit is
   to see each claim fail by name. */
const readMaybe = rel => { try { return read(rel); } catch (_) { return ''; } };
const PZ = readMaybe('js/presence.js');
const SRV = read('server/server.js');
const APP = read('js/app.js');
const CT = read('js/views/contract.js');
const CORE = read('js/core.js');
const HTML = read('index.html');
const I18N = read('js/i18n.js');
const WORLD = read('test/world.js');
const PORTALWORLD = read('test/portalworld.js');

/* COMMENTS ARE NOT CODE — the rulebook's rule, and this run broke two other
   tests by forgetting it in both directions on one night. */
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const MOD = bare(PZ);
/* PINNED TO THE REGION, not a byte count (re-pointed 4 Oct 2026, f473: the
   route grew the ask refresh and its 1800-character window cut it short). */
const ROUTE = bare(SRV.slice(SRV.indexOf("app.post('/api/contracts/:id/here'"),
  SRV.indexOf('/* ---------- executed records are immutable')));
const SRVMODEL = bare(SRV.slice(SRV.indexOf('const SRV_PRESENCE_MS'),
  SRV.indexOf("app.post('/api/contracts/:id/here'")));

describe('f454 (1) — one route, and it is not an edit', () => {
  test('the route exists once, and takes no clause', () => {
    assert.equal((SRV.match(/app\.post\('\/api\/contracts\/:id\/here'/g) || []).length, 1);
    assert.match(ROUTE, /srvHereOthers/, 'the route is there to be read');
    assert.ok(!/clauseId/.test(ROUTE),
      'reading a contract is not holding a clause — two acts, two doors');
  });

  test('a VIEWER may say they are here', () => {
    assert.match(ROUTE, /\/here', auth, \(req, res\)/,
      'not `editor`: a viewer reads contracts all day, and a viewer in the room '
      + 'is exactly who the row exists to show. /lock keeps its own guard');
  });

  test('and it is scope-checked, like every route that names a contract', () => {
    assert.match(ROUTE, /inScope\(folderScopeFor\(req\.user\), row\.folder\)/,
      'a contract in a stream this person cannot reach is not found');
  });

  test('IT MOVES NEITHER version NOR updated_at', () => {
    assert.match(ROUTE, /UPDATE contracts SET json=\? WHERE id=\?/,
      'presence is not an edit. A record that read as edited every twenty-five '
      + 'seconds would churn the register\'s updated column and every watcher '
      + 'in the workspace — the exact fault the lock route records in its own words');
    assert.ok(!/version|updated_at/.test(ROUTE));
  });

  test('a sealed record takes no courtesy write', () => {
    assert.match(ROUTE, /isExecutedRow\(c\)\) return res\.json\(\{ here:/,
      'aiNoteRead\'s own lesson, and it answers with the live row rather than '
      + 'an error — a screen asking about a signed contract is asking an '
      + 'honest question');
  });

  test('and the answer is the OTHERS, with a name and a time and nothing else', () => {
    assert.match(SRVMODEL, /function srvHereLive|const srvHereLive/);
    assert.match(SRVMODEL, /\.filter\(k => String\(k\) !== String\(meId\)\)/,
      'a row that counted you would say "2 here" to somebody alone in the room');
    const shape = SRVMODEL.slice(SRVMODEL.indexOf('const srvHereOthers'),
      SRVMODEL.indexOf('const srvHereOthers') + 420);
    assert.ok(!/email|role|seat|folder/.test(shape),
      'a fact about who is reading, not a directory');
  });
});

describe('f454 (2) — a save cannot wipe somebody out of a room', () => {
  test('the PUT keeps the stored map, exactly as it keeps the locks', () => {
    assert.match(bare(SRV), /if \(prev && prev\.here\) c\.here = prev\.here; else delete c\.here;/,
      'it travels out on a GET, so an ordinary save echoes it back — and a '
      + 'browser holding the record from before a colleague arrived would echo '
      + 'back a map without them');
    const i = bare(SRV).indexOf('prev.locks) c.locks');
    const j = bare(SRV).indexOf('prev.here) c.here');
    assert.ok(i > 0 && j > i, 'and it sits with the locks, which is the rule it borrows');
  });
});

describe('f454 (3) — it never travels', () => {
  test('the payload builder does not carry it', () => {
    const fn = bare(CORE.slice(CORE.indexOf('function buildSharePayload'),
      CORE.indexOf('function shareAdviceBody')));
    assert.ok(fn.length > 2000, 'the builder is there to be read');
    assert.ok(!/\bhere\b\s*:/.test(fn),
      'how many of our people are reading their paper right now is a '
      + 'negotiating fact. buildSharePayload is an allow-list, so this is true '
      + 'by construction');
  });

  test('and the ROUTE strips it as well, because an allow-list holds only until somebody adds a field', () => {
    assert.match(bare(SRV), /delete payload\.contract\.here;/,
      'the discipline the brief beside it keeps');
  });

  test('nothing is drawn on the counterparty\'s page', () => {
    assert.match(MOD, /function presenceOn[\s\S]*?PORTAL_MODE/,
      'who is in OUR room is ours');
    assert.ok(!/presenceRowHtml|presenceStart|presencePaint/.test(bare(readMaybe('js/views/portal.js'))),
      'and their page does not call it at all');
  });
});

describe('f454 (4) — reading never writes, and the beat is honest', () => {
  test('the reading answers out of the last beat and never fetches', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceHere'), MOD.indexOf('async function presenceSay'));
    assert.ok(!/api\(|fetch\(/.test(fn),
      'a renderer that turned a repaint into a request is the fault deskInit '
      + 'and reviewInit both record');
    assert.match(fn, /_pzSeen\[cid\]/);
  });

  test('it drops you out of your own row, and the dead out of everybody\'s', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceHere'), MOD.indexOf('async function presenceSay'));
    assert.match(fn, /String\(r\.id \|\| ''\) !== String\(me\.id \|\| ''\)/);
    assert.match(fn, /_pzLive\(r\)/);
    assert.match(MOD, /PRESENCE_GONE_MS = 75000/,
      'three missed beats. Two would make a slow network look like somebody '
      + 'leaving the room, and the cost of being wrong that way is a colleague '
      + 'believing they are alone');
    /* PIN THE RELATION, NOT THE NUMBER — and here the relation is between two
       files. The browser filters the row it draws and the server filters the
       row it answers with; two different windows and the header would show a
       colleague the record has already dropped, or drop one the record still
       holds. The clause lock keeps the same pair for the same reason and says
       so in its own words. */
    const srvN = Number((SRV.match(/const SRV_PRESENCE_MS = (\d+)/) || [])[1] || 0);
    const pzN = Number((MOD.match(/PRESENCE_GONE_MS = (\d+)/) || [])[1] || 0);
    assert.ok(srvN > 0 && srvN === pzN,
      'the server and the browser must measure "still here" with one number');
  });

  test('a latch may not be its own promise', () => {
    const fn = MOD.slice(MOD.indexOf('async function presenceSay'), MOD.indexOf('function presenceStart'));
    const raise = fn.indexOf('_pzBusy = true');
    const away = fn.indexOf('await');
    assert.ok(raise > 0 && away > raise,
      'an async body runs synchronously only to its first await, so the guard '
      + 'is raised before the promise exists');
    assert.match(fn, /finally \{ _pzBusy = false; \}/);
  });

  test('it asks nothing while the window is hidden', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceStart'), MOD.indexOf('function presenceStop'));
    assert.match(fn, /document\.hidden\) return;/,
      'a tab behind three others is not somebody in the room, and it is the '
      + 'courteous thing as well as the honest one');
  });

  test('a beat that fails says nothing at all', () => {
    const fn = MOD.slice(MOD.indexOf('async function presenceSay'), MOD.indexOf('function presenceStart'));
    assert.match(fn, /catch \(_\)\{/, 'the act is there to be read');
    assert.ok(!/toast\(|alert|buildAlerts/.test(fn),
      'nobody asked for this and a network blip is not news — the row empties '
      + 'as the last answer ages out');
  });

  test('and it repaints only where the answer moved', () => {
    const fn = MOD.slice(MOD.indexOf('async function presenceSay'), MOD.indexOf('function presenceStart'));
    assert.match(fn, /JSON\.stringify\(rows\) !== before/,
      'a header that redrew itself every twenty-five seconds would steal the '
      + 'reader\'s hover and, on the negotiation page, their scroll');
  });

  test('starting twice does not open two beats, and leaving the page stops it', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceStart'), MOD.indexOf('function presenceWatching'));
    assert.match(fn, /_pzCid === id && _pzTimer/, 'idempotent per contract');
    assert.match(fn, /presenceStop\(\);/, 'and a different contract takes the beat over');
    assert.match(bare(APP), /window\.presenceStop\) try\{ presenceStop\(\); \}catch\(_\)\{\}/,
      'setView is the one place a page change is recorded, which is why the '
      + 'stop is there and not in six renderers');
    assert.match(bare(CT), /presenceStart\(c\.id, presencePaint\); presencePaint\(c\.id\)/,
      'and applyWsTabs is where the room lands on every render');
  });
});

describe('f454 (5) — the row is a slot, and it is quiet', () => {
  test('the head carries a slot the beat paints into', () => {
    assert.match(CT, /<span data-pz-slot="head"><\/span>/,
      'WIRE WHERE YOU PAINT: the head is built once per render, so the one fact '
      + 'that changes while nobody presses anything needs a slot');
    assert.match(MOD, /querySelectorAll\('\[data-pz-slot\]'\)/,
      'one function serves the room, the negotiate page and any head added later');
  });

  test('it draws nothing at all when nobody else is here', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceRowHtml'), MOD.indexOf('function presencePaint'));
    assert.match(fn, /if \(!here\.length\) return '';/,
      'an empty slot with a caption would be a band about an absence, which is '
      + 'the thing the owner ruled out by name');
  });

  test('four faces at most, then a count', () => {
    assert.match(MOD, /PRESENCE_FACES = 4/);
    const fn = MOD.slice(MOD.indexOf('function presenceRowHtml'), MOD.indexOf('function presencePaint'));
    assert.match(fn, /extra > 0 \? `<span class="pz-more">/,
      'six initials in a header is a crowd rather than a fact');
  });

  test('the initials are the desk\'s own, so one face never reads two ways', () => {
    assert.match(MOD, /function presenceInitials[\s\S]*?window\.deskInitials/,
      'with a fallback, because the module is loaded on stages that carry no desk');
  });

  test('and nothing is drawn on the paper', () => {
    assert.match(MOD, /function presenceRowHtml/, 'the module is there to be read');
    assert.ok(!/doc-surface|rl-paper|nego-clause|docSheetHtml|caret|cursor/.test(MOD),
      'the owner\'s own instruction, and the third question\'s refusal: the '
      + 'agreement\'s pixels are the agreement\'s');
  });

  test('and the row costs the contract NOTHING', () => {
    assert.match(HTML, /\.pz-row\{[^}]*height:0; overflow:visible/,
      'THE THIRD QUESTION\'S REFUSAL, measured and failed by the first build: a '
      + '17px face on a line of 12px text grows that line, and the paper moved '
      + '300.875 → 301.390625 the moment a second person opened the contract. '
      + 'A zero-high row forms the line box as if it were not there');
    assert.match(HTML, /\[data-pz-slot\]:empty\{ display:none; \}/,
      'and an empty slot generates no box at all');
  });

  test('its clothes are the desk\'s face, one rung smaller', () => {
    assert.match(HTML, /\.pz-face\{[^}]*width:17px/);
    assert.match(HTML, /\.pz-face\{[^}]*var\(--accent-ink-700\)/,
      'the ink token, never the raw accent ramp as text — f238 sweeps for that');
  });

  test('and its one sentence is in both books, as a pair', () => {
    for (const k of ['pz_here_one', 'pz_here_other'])
      assert.ok(I18N.split(k + ':').length - 1 >= 2, k + ' is missing from one of the two books');
  });
});

describe('f454 (6) — the module is loaded everywhere it is read', () => {
  test('the app imports it', () => {
    assert.match(APP, /import '\.\/presence\.js';/,
      'a top-level function is not a global — it is reachable only through the '
      + 'Object.assign(window) at the end of its file, and only if the file loads');
  });

  test('and both harness worlds list it', () => {
    assert.match(WORLD, /'js\/presence\.js'/,
      'THE BROWSER HARNESSES DO NOT LOAD index.html — a new js/ file must be '
      + 'added there or f232 passes over a module nothing ever loaded');
    assert.match(PORTALWORLD, /'js\/presence\.js'/);
  });

  test('as do the classic-script stages', () => {
    for (const f of ['parity.html', 'redline.html', 'room-shots.html', 'timeline.html'])
      assert.match(readMaybe('test/chromium/' + f), /js\/presence\.js/, f);
  });

  test('every shell function it reaches is asked through window', () => {
    assert.match(MOD, /Object\.assign\(window, \{/, 'the module is there to be read');
    assert.ok(!/^\s*(?:await )?(?:api|currentUser|getContract|i18t|i18tn|deskInitials)\(/m.test(MOD),
      'a `const` at the top of core.js is a LEXICAL binding, not a property of '
      + 'the global object, so a bare call resolves to core.js\'s own copy and '
      + 'can never be substituted in a harness');
    assert.match(MOD, /window\.api\(/);
    assert.match(MOD, /window\.currentUser \?/);
  });
});
