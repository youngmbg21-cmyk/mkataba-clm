/* ============================================================
   F455 — Take it in turns
   ============================================================
   Young picked "Take it in turns" by name from three: the clause lock becomes
   a baton you can ask for.

   THE GAP. The lock built in September is an ADVISORY and that is what makes
   it safe, but it left the second person with exactly one thing to do: wait.
   Two minutes is not long; not knowing how long is. A colleague who reaches
   for a clause and is told somebody else has it has no way to say "I need
   this" and no way to know when it comes free, so they either sit refreshing
   or go round the wall by editing somewhere else.

   SO A REFUSAL CARRIES ITS WAY FORWARD, which is the rulebook's own rule said
   on a new door: the second person asks, the holder is told somebody is
   waiting, and handing it over is one press.

   NOTHING ABOUT THE WALL CHANGES. An ask takes no lock, moves no wording and
   refuses nothing — it is a request written on the lock, and the holder keeps
   every power they had including the power to ignore it. The lock still lapses
   on its own, so a holder who shut their laptop frees the clause in two
   minutes whether they were asked or not.

   AND THE HAND-OVER IS DIRECT, which is the whole of why this is a baton
   rather than a Please-Finish button: releasing the lock and letting the asker
   race for it would hand the clause to whoever's browser polled first, which
   on a busy afternoon is not the person who asked.

   THE FAULT THIS BUILD FOUND, measured rather than reasoned about: refreshing
   a lock IS taking it again — the lock's own rule, so there is one act rather
   than two that could disagree about what a lock is — and a holder's browser
   refreshes every few seconds while they type. Writing a bare new lock
   therefore WIPED the asks on it, so a colleague's ask vanished the moment the
   holder touched a key and nobody was ever told anybody was waiting. Fixed in
   both copies, and pinned here. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

const LOCK = read('js/clauselock.js');
const SRV = read('server/server.js');
const NEG = read('js/views/negotiation.js');
const CE = read('js/views/clauseeditor.js');
const CSS = read('js/views/negotiation-css.js');
const I18N = read('js/i18n.js');

const MODEL = bare(LOCK);
const ROUTE = bare(SRV.slice(SRV.indexOf("app.post('/api/contracts/:id/lock'"),
  SRV.indexOf('/* ============================================================\n   WHO IS IN THE ROOM')));

describe('f455 (1) — one door, two verbs', () => {
  test('the ask and the hand-over ride the route the lock already has', () => {
    assert.match(MODEL, /release: !!o\.release, ask: !!o\.ask, handTo: o\.handTo \|\| null/,
      'a second route would be a second way for two browsers to disagree about '
      + 'who holds a clause — this route\'s own recorded rule');
    assert.equal((SRV.match(/app\.post\('\/api\/contracts\/:id\/lock'/g) || []).length, 1);
  });

  test('and the route is still json only — presence is not an edit', () => {
    assert.match(ROUTE, /UPDATE contracts SET json=\? WHERE id=\?/);
    assert.ok(!/version|updated_at/.test(ROUTE.replace(/baseVersion/g, '')),
      'a record that read as edited every forty-five seconds would churn the '
      + 'register\'s own updated column and every watcher in the workspace');
  });
});

describe('f455 (2) — asking takes nothing', () => {
  test('the ask does not touch the lock', () => {
    const br = ROUTE.slice(ROUTE.indexOf('if (b.ask)'), ROUTE.indexOf('} else if (b.handTo)'));
    assert.ok(br.length > 100, 'the branch is there to be read');
    assert.match(br, /locks\[clauseId\] = \{ \.\.\.held, asked:/,
      'the holder and their timestamp are carried through untouched — only the '
      + 'queue on the lock moves');
    assert.ok(!/delete locks\[clauseId\]|by: me/.test(br),
      'an ask that took the clause, or freed it, would be the wall giving way');
  });

  test('there is nothing to ask for on a free clause or your own', () => {
    const br = ROUTE.slice(ROUTE.indexOf('if (b.ask)'), ROUTE.indexOf('} else if (b.handTo)'));
    assert.match(br, /!held \|\| mine\) return res\.status\(409\)/,
      'refused rather than recorded, because an ask nobody can answer would sit '
      + 'on the record for ever');
    assert.match(MODEL, /function clauseLockAsk[\s\S]*?clauseLockHeldByOther\(c, id\);\s*if \(!l\) return false;/,
      'and the browser asks the same question, so the button is never drawn '
      + 'over an act the route will refuse');
  });

  test('one ask per person, and a cap', () => {
    const br = ROUTE.slice(ROUTE.indexOf('if (b.ask)'), ROUTE.indexOf('} else if (b.handTo)'));
    assert.match(br, /\.filter\(r => String\(r\.id\) !== String\(me\.id\)\)/,
      'a second press is not a louder ask, and a list that grew on every press '
      + 'would turn "2 waiting" into a lie');
    assert.match(br, /slice\(-ASK_CAP\)/, 'a queue cannot be used to grow a record without bound');
    assert.match(MODEL, /if \(!clauseLockAskedByMe\(l, me\)\) l\.asked\.push/);
  });

  test('a lapsed ask is not an ask, measured by the lock\'s own window', () => {
    assert.match(ROUTE, /const askLive = r =>[\s\S]*?SRV_CLAUSE_LOCK_MS/,
      'two windows and a holder and an asker come to disagree about whether '
      + 'anybody is waiting');
    assert.match(MODEL, /function clauseLockAsks[\s\S]*?clauseLockLive\(r\)/);
  });
});

describe('f455 (3) — a refresh keeps the queue', () => {
  test('the server keeps the asks when the holder takes it again', () => {
    const br = ROUTE.slice(ROUTE.indexOf('const keep ='), ROUTE.indexOf('const next = { ...c }'));
    assert.match(br, /mine && Array\.isArray\(held\.asked\)/,
      'MEASURED: a bare new lock wiped the asks, and a holder\'s browser '
      + 'refreshes every few seconds while they type — so an ask vanished the '
      + 'moment the holder touched a key');
    assert.match(br, /keep\.length[\s\S]*?asked: keep/);
  });

  test('and so does the browser\'s copy of the same act', () => {
    const fn = MODEL.slice(MODEL.indexOf('function clauseLockTake'), MODEL.indexOf('const clauseLockKeep'));
    assert.match(fn, /String\(had\.by\.id \|\| ''\) === String\(me\.id \|\| ''\)/);
    assert.match(fn, /keep\.length \? \{ by: me, at: new Date\(\)\.toISOString\(\), asked: keep \}/);
  });

  test('a NEW holder starts with none, which is the hand-over\'s clean slate', () => {
    const br = ROUTE.slice(ROUTE.indexOf('} else if (b.handTo)'), ROUTE.indexOf('} else if (b.release)'));
    assert.match(br, /locks\[clauseId\] = \{ by: \{ id: to\.id, name: to\.name \|\| '' \}, at: new Date\(\)\.toISOString\(\) \}/,
      'no asked field at all: the queue was for the clause, and the clause has moved');
  });
});

describe('f455 (4) — the two walls on the hand-over', () => {
  test('only the holder may hand a clause over', () => {
    const br = ROUTE.slice(ROUTE.indexOf('} else if (b.handTo)'), ROUTE.indexOf('} else if (b.release)'));
    assert.match(br, /!held \|\| !mine\) return res\.status\(403\)/);
  });

  test('and only to somebody who asked', () => {
    const br = ROUTE.slice(ROUTE.indexOf('} else if (b.handTo)'), ROUTE.indexOf('} else if (b.release)'));
    assert.match(br, /asked\.find\(r => String\(r\.id\) === String\(b\.handTo\)\)/);
    assert.match(br, /!to\) return res\.status\(409\)/,
      'a hand-over to a name that never asked would be a way of locking a '
      + 'colleague out of a clause from across the office');
  });

  test('the browser keeps both too, so the button is never drawn over a refusal', () => {
    const fn = MODEL.slice(MODEL.indexOf('function clauseLockHandOver'), MODEL.indexOf('function clauseLockWaitingLine'));
    assert.match(fn, /clauseLockMineWaiting\(c, id\)/,
      'which answers nothing unless the lock is live AND yours');
    assert.match(fn, /waiting\.find\(r => String\(r\.id \|\| ''\) === String\(toId \|\| ''\)\)/);
  });

  test('and your own lock\'s queue is a reading of its own', () => {
    const fn = MODEL.slice(MODEL.indexOf('function clauseLockMineWaiting'), MODEL.indexOf('function clauseLockHandOver'));
    assert.match(fn, /String\(l\.by\.id \|\| ''\) !== String\(me\.id \|\| ''\)\) return \[\]/,
      'clauseLockHeldByOther answers null for your own lock on purpose — your '
      + 'own lock is not a lock to you, but the queue on it is yours to see');
  });
});

describe('f455 (5) — the refusal carries its way forward, and only there', () => {
  test('the sign offers the ask', () => {
    assert.match(MODEL, /function clauseLockSign[\s\S]*?mayAsk: !askedMine && !!clauseLockMe\(\)/,
      'one reading, so no door can offer an ask the model would refuse');
    assert.match(NEG, /data-rl-lock-ask="/,
      'and it is drawn where a person meets the refusal — the pencil\'s own corner');
  });

  test('once asked it is a word, not a second button', () => {
    const br = NEG.slice(NEG.indexOf('const ask = held.mayAsk'), NEG.indexOf('return `<span class="rl-cp-lock"'));
    assert.match(br, /held\.asked \? `<span class="rl-cp-lock-asked"/,
      'a second press is not a louder ask');
  });

  test('the press is delegated, and takes the contract at press time', () => {
    const h = bare(NEG.slice(NEG.indexOf("const askBtn = t.closest('[data-rl-lock-ask]')"),
      NEG.indexOf("const sgA = t.closest('[data-dk-adopt]')")));
    assert.match(h, /rlLadderContract\(\)/,
      'a listener armed at module load that captured a contract would act on '
      + 'whatever was open when the page first drew');
    assert.match(h, /clauseLockAsk\(cc, cid\)/);
    assert.match(h, /toast\(i18t\('cl_asked_done'/, 'an act that leaves this browser confirms');
  });

  test('and the ask is the quietest control on the paper, scaled with it', () => {
    assert.match(CSS, /\.redline-page \.rl-cp-lock-ask\{[^}]*var\(--accent-ink-700\)/,
      'the ink token, never the raw accent ramp as text');
    assert.match(CSS, /\.redline-page \.rl-cp-lock-ask\{[^}]*font-size:inherit/,
      'the paper scales and so does its furniture');
  });
});

describe('f455 (6) — the holder is told where the holder is', () => {
  test('the editor\'s foot carries a slot for it', () => {
    assert.match(CE, /<span id="ce-waiting"><\/span>/,
      'you hold a clause because you have it open, so this is where the news '
      + 'belongs — and a slot, because the queue moves while the holder types '
      + 'and nobody presses anything');
    assert.match(bare(CE), /clauseLockMineWaiting\(_ceC, _ceClauseId\)/, 'one reading');
    assert.match(bare(CE), /clauseLockWaitingLine\(rows\)/, 'and one sentence');
  });

  test('it draws nothing when nobody is waiting', () => {
    const fn = bare(CE.slice(CE.indexOf("const wait = _ceQ('#ce-waiting')"),
      CE.indexOf("const foot = _ceQ('#ce-railfoot')")));
    assert.match(fn, /wait\.innerHTML = line[\s\S]*?: '';/,
      'which is every ordinary sitting');
  });

  test('handing over asks first, and says what it does NOT do', () => {
    const br = bare(CE.slice(CE.indexOf("case 'handover':"), CE.indexOf("case 'save':") > CE.indexOf("case 'handover':")
      ? CE.indexOf("case 'save':") : CE.indexOf("case 'handover':") + 1800));
    assert.match(br, /confirmDialog\(/,
      'it is the one act here that gives something away: the clause goes to a '
      + 'colleague and this reader can no longer type in it');
    assert.match(br, /cl_hand_title/, 'and the message says the draft is kept and nothing is filed');
    assert.ok(!/ceDiscard|ceSave|negoEditClause/.test(br),
      'nothing is filed and nothing is lost — the draft in the box is untouched');
  });

  test('and the amber key is earned: this IS work waiting on the reader', () => {
    assert.match(CE, /\.ce-foot \.ce-wait-k\{[^}]*var\(--st-amber-fg\)/,
      'amber means work waiting on the reader, and somebody is held up by this one');
  });
});

describe('f455 (7) — the baton arriving is news, exactly once', () => {
  test('it is said where the server\'s map lands', () => {
    const fn = MODEL.slice(MODEL.indexOf('function clauseLockMerge'), MODEL.length);
    assert.match(fn, /cl_your_turn/,
      'a hand-over happens in somebody else\'s browser, so the only thing that '
      + 'can tell this reader is the answer that carries it');
    assert.match(fn, /if \(wasMine \|\| !nowMine\) return;/, 'asked as a difference');
    assert.match(fn, /!clauseLockAskedByMe\(was, me\)\) return;/,
      'only a baton you asked for — a clause that merely came free is not news');
  });

  test('once per clause per sitting, and never on the record', () => {
    const fn = MODEL.slice(MODEL.indexOf('function clauseLockMerge'), MODEL.length);
    assert.match(fn, /_clSaid\[key\]/);
    assert.match(MODEL, /const _clSaid = Object\.create\(null\)/,
      'per sitting and in memory: the rulebook\'s rule that per-sitting marks '
      + 'never reach the record');
  });

  test('it is a toast, not a band', () => {
    const fn = MODEL.slice(MODEL.indexOf('function clauseLockMerge'), MODEL.length);
    assert.match(fn, /window\.toast\([\s\S]{0,120}'ok'\)/,
      'a transient confirmation of a thing that just happened is the cheapest '
      + 'channel that does the job — and a bare toast prints nothing');
    assert.ok(!/innerHTML|insertAdjacent|appendChild/.test(fn), 'nothing is added to the page');
  });
});

describe('f455 (8) — and every sentence is in both books', () => {
  test('the baton\'s strings are a complete pair', () => {
    const keys = [...new Set([...MODEL.matchAll(/_clT\('(cl_[a-z_]+)'/g),
      ...bare(NEG).matchAll(/i18t\('(cl_[a-z_]+)'/g),
      ...bare(CE).matchAll(/_cet\('(cl_[a-z_]+)'/g)].map(m => m[1]))];
    assert.ok(keys.length >= 6, 'the model is written in the string book, not in the page');
    for (const k of keys)
      assert.ok(I18N.split(k + ':').length - 1 >= 2, k + ' is missing from one of the two books');
    for (const k of ['cl_waiting_one', 'cl_waiting_other'])
      assert.ok(I18N.split(k + ':').length - 1 >= 2, k + ' — the plural comes as a complete pair');
  });
});
