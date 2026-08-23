/* f238 — A ROUND THAT LANDS, AND ONE THAT SAYS WHY IT HAS NOT
   ============================================================
   Owner-reported 23 Aug 2026 on MK-349, and reproduced end to end before
   anything was touched: the counterparty accepted an ask and sent one of their
   own, both reached the server, and the owner sat on the negotiation page
   watching a screen that did not move. Reloading fixed it, which is what named
   the cause.

   THREE FIXES, AND THE FIRST IS THE REPORTED ONE.

   1 · THE NEGOTIATION PAGE NEVER ASKED. Two predicates decide when this app
       goes looking for the other side's answer — "you have just opened a
       contract, catch up now" (setView, js/app.js) and "this contract is out
       with them, look every 12s instead of 45" (pollWaitingOnThem, js/core.js).
       BOTH read `view==='workspace'`, written when Negotiate was a TAB on the
       contract workspace. It became its own view on 12 Aug 2026 and neither was
       told. So the one page in the product built for watching a live round was
       the only page that never asked whether anything had arrived, and it sat
       on the slowest beat while the reader watched it.

       THE TWO MUST AGREE. A page that catches up on arrival and is then not
       counted as watching is half a fix, so the pair is asserted as a pair.

   2 · A FAILURE THAT REPEATS MUST SAY SO. pollPendingResponses had three silent
       holes: a response naming a contract this browser does not hold was
       skipped for ever without a word, applyResponse returning false left the
       row unmarked and re-refused on every beat, and one catch swallowed the
       applying along with the network. Retrying is right and stays; being
       invisible is what was wrong. The SECOND consecutive failure is reported,
       once per sitting.

   3 · THEIR PAGE COULD NOT TELL EITHER. It stamps a change "Sent" off its own
       memory of pressing the button and had no way to learn what happened next.
       `applied` is the exact fact and the server already records it. Three
       readings — received, waiting, and an older link that records nothing,
       which says NOTHING, because an unknown is not a "no" (negoTheirCopy's
       rule for the mirror of this question).

   WHY THIS FILE IS SOURCE-READING. Every one of these is a claim about a live
   page: two browser contexts, a real server, a real timer. They are driven in
   round-delivery-verify, which stages the whole hand-off and measures it. What
   is here is the half a browser cannot answer — that the two view lists AGREE,
   that the failure path writes nothing to the record, and that the words exist
   in both languages. The f236 split, on purpose: cause here, effect there. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const APP = read('js/app.js');
const CORE = read('js/core.js');
const PORTAL = read('js/views/portal.js');
const SERVER = read('server/server.js');
const I18N = read('js/i18n.js');

/* One branch of applyResponse's action ladder, cut from the RAW source and
   stripped afterwards — stripping first collapses the comments the markers sit
   between and the slice stops matching. */
const branch = (action) => {
  /* The BRANCH, not the first mention: `r.action==='ready'` also appears in the
     docChanged guard forty lines above the ladder, and slicing from there
     returns the whole of the sign branch instead. */
  const start = CORE.indexOf("} else if(r.action==='" + action + "'){");
  assert.ok(start > 0, 'no ' + action + ' branch');
  const rest = CORE.slice(start + 2);
  const end = rest.indexOf("} else if(r.action===", 10);
  return strip(end > 0 ? rest.slice(0, end) : rest);
};
const fn = (src, name) => {
  const m = strip(src).match(new RegExp('function\\s+' + name + '\\s*\\([\\s\\S]*?\\n\\}'));
  assert.ok(m, name + ' not found');
  return m[0];
};

describe('f238 (1) — the negotiation page asks for waiting answers', () => {
  test('POLL_ON_ARRIVAL names both watching views', () => {
    const m = APP.match(/const POLL_ON_ARRIVAL\s*=\s*\[([^\]]*)\]/);
    assert.ok(m, 'the list is declared');
    assert.match(m[1], /'workspace'/);
    assert.match(m[1], /'redline'/, 'the reported page — this is the whole fix');
  });

  test('setView asks the LIST, never a hard-coded view', () => {
    const body = strip(APP).match(/function setView[\s\S]*?\n\}/)[0];
    assert.match(body, /POLL_ON_ARRIVAL\.includes\(view\)[\s\S]{0,80}pollNow/);
    assert.ok(!/view===['"]workspace['"]\s*&&\s*window\.pollNow/.test(body),
      'the old single-view branch is gone, not merely joined');
  });

  test('pollWaitingOnThem answers for the same two views', () => {
    const body = fn(CORE, 'pollWaitingOnThem');
    assert.match(body, /state\.view!=='workspace'\s*&&\s*state\.view!=='redline'/);
  });

  test('AND THE TWO AGREE — a page that catches up must also be watched', () => {
    const listed = (APP.match(/const POLL_ON_ARRIVAL\s*=\s*\[([^\]]*)\]/)[1]
      .match(/'([a-z]+)'/g) || []).map(x => x.replace(/'/g, '')).sort();
    const body = fn(CORE, 'pollWaitingOnThem');
    const watched = [...new Set((body.match(/state\.view!=='([a-z]+)'/g) || [])
      .map(x => x.replace(/.*'([a-z]+)'.*/, '$1')))].sort();
    assert.deepEqual(watched, listed,
      'setView catches up on ' + listed.join('+') + ' but pollWaitingOnThem watches ' + watched.join('+'));
  });

  test('on the negotiation page it asks the contract PAINTED, not the global', () => {
    const body = fn(CORE, 'pollWaitingOnThem');
    assert.match(body, /window\.redlineHeldId/,
      'read through window — this module cannot see the negotiation view\'s names');
    assert.match(body, /redlineHeldId\(\)/);
    assert.match(body, /if\(!id\) return false/,
      'the negotiations LIST is no single contract, and answers false');
  });

  test('redlineHeldId really is published, or the read above is always null', () => {
    assert.match(read('js/views/negotiation.js'), /\n\s*redlineHeldId,/);
  });
});

describe('f238 (2) — a failure that repeats says so', () => {
  const body = fn(CORE, 'pollPendingResponses');

  test('the network is caught apart from the applying', () => {
    assert.match(body, /catch\(e\)\{ return; \}/,
      'a fetch that fails between beats is ordinary and stays quiet');
    assert.ok(!/try\{[\s\S]*const list=await api[\s\S]*for\(const item[\s\S]*\}catch/.test(body),
      'the loop is no longer inside the network catch');
  });

  test('the second consecutive failure is reported, not the first', () => {
    assert.match(CORE, /const POLL_TROUBLE_AT = 2/);
    assert.match(body, /n>=POLL_TROUBLE_AT/);
  });

  /* ---- REVERSED IN PLACE 23 Aug 2026, owner-asked ----
     This shipped as a warn toast, and on a real workspace with four answers in
     this state the reader got FOUR orange boxes stacked over the change column:
     "I never want to see this in the platform again." The three claims below
     used to pin the toast — once per sitting, its 'warn' kind, and its action.
     What they were really protecting is that the fact is REPORTED and that
     nothing is lost, and both survive: it is a row in the alerts panel now,
     recorded by this loop and read by buildAlerts. */
  test('REVERSED — the failure is RECORDED for the panel, not thrown at the reader', () => {
    assert.ok(!/toast\(/.test(body),
      'nothing in this loop draws — a poller running every twelve seconds must not');
    assert.match(body, /_pollStuck\.set\(key,/, 'it records the answer instead');
    assert.match(CORE, /function pollStuckAnswers\(\)\{ return \[\.\.\._pollStuck\.values\(\)\]; \}/,
      'behind ONE reading the panel can ask for');
    assert.match(CORE, /Object\.assign\(window,\{[\s\S]*?pollStuckAnswers,/,
      'and it is published, or nothing can read it (the ES-module rule)');
  });

  test('a success clears the memory, so a later failure is news again', () => {
    assert.match(body, /_pollTrouble\.delete\(key\); _pollStuck\.delete\(key\)/);
  });

  test('the panel is repainted only on a beat that changed something', () => {
    /* This loop runs every twelve seconds on a watched contract; rebuilding an
       open panel each time would fight a reader scrolling it. */
    assert.match(body, /const before=_pollStuck\.size;/);
    assert.match(body, /if\(_pollStuck\.size!==before\)\{/);
    assert.match(body, /window\.updateAlertBadge/);
  });

  test('IT WRITES NOTHING TO THE RECORD on the failure path', () => {
    assert.ok(!/logAudit|persist\(/.test(body),
      'persisting a contract we have just failed to apply an answer to is the ' +
      'one moment not to be writing to it');
  });

  test('the row is a registered kind, amber, and names the contract', () => {
    const APP = read('js/app.js');
    assert.match(APP, /\{ k:'answer-stuck',tone:'amber'/,
      'a registered kind, never a special case at the draw');
    assert.match(APP, /stuck\.forEach\(sk=>push\('answer-stuck',\{ id:sk\.id, name:sk\.name\|\|sk\.id \}/,
      'and the row carries the contract it is about');
  });

  test('the rows are NOT scoped to state.contracts, and that is the point', () => {
    /* The commonest reason an answer will not land is that this browser does
       not hold the contract at all, so filtering by the list would drop exactly
       the rows worth drawing. It is safe because the SERVER scoped it: these
       come off shares/pending, which answers for the caller's own links. */
    const APP = read('js/app.js');
    const blk = APP.slice(APP.indexOf("if(window.pollStuckAnswers)"),
      APP.indexOf('/* 2. Changes waiting on this reader'));
    assert.ok(blk.length > 40, 'the block was found');
    assert.ok(!/\bcs\b/.test(blk), 'it never reaches for the scoped contract list');
  });

  test('and it never claims anything was lost', () => {
    /* The panel row is short because the two lines under it name the agreement
       and its reference; what it must never do is read as a failure. */
    const en = I18N.match(/al_answer_stuck: '([^']*)'/)[1];
    assert.ok(!/fail|lost|error/i.test(en), 'nothing is lost and nothing was refused: ' + en);
    assert.match(en, /reload/i, 'and it says the one thing shown to clear it');
  });

  test('the id-mismatch refusal is no longer a silent bare toast', () => {
    assert.match(CORE, /if\(r\.id!==c\.id\)\{ toast\([^;]*,'err'\); return false; \}/);
  });
});

describe('f238 (3) — their page learns whether the round landed', () => {
  test('the server reports `applied` off the answer\'s own row', () => {
    assert.match(SERVER, /SELECT response, at, applied FROM share_responses/);
    assert.match(SERVER, /applied: lastR\.applied == null \? null : lastR\.applied === 1/);
  });

  test('and a ONE-SHOT link gets the same fact — it had none at all before', () => {
    assert.match(SERVER, /: \(s\.response \? \{ response: s\.response, at: s\.responded_at \|\| null, applied: s\.applied \} : null\)/);
  });

  test('portalDeliveryState has THREE readings and the third is silence', () => {
    const body = fn(PORTAL, 'portalDeliveryState');
    assert.match(body, /applied===true\) return 'received'/);
    assert.match(body, /applied===false\) return 'waiting'/);
    assert.equal((body.match(/return null/g) || []).length, 2,
      'nothing sent, and an older link that records nothing — both say nothing');
  });

  test('an unknown is never printed as a "no"', () => {
    /* RE-POINTED 23 Aug 2026 with the move into the bell: the guard used to sit
       in portalDeliveryLine and now sits on the push. The claim is the same one
       — a third reading that says nothing must add nothing. */
    assert.match(PORTAL, /const dlv = portalDeliveryState\(\);\s*\n\s*if \(dlv\) push\(/);
  });

  test('IT IS IN THE BELL, NOT STANDING ON THE PAGE', () => {
    /* REVERSED IN PLACE 23 Aug 2026, owner-reported: "keep the alerts in the
       bell ... because they are now popping up and staying on screen which is
       distracting." This asserted the sentence drew on BOTH wall branches — and
       the wall band is drawn on every paint and never goes away, so the one
       thing added to that page was also the one thing permanently in front of
       the reader. It is a STATUS, and the bell is the shelf this page already
       keeps for one. The FACT is unchanged; only its shelf moved. */
    assert.ok(!/portalDeliveryLine/.test(PORTAL),
      'the standing sentence and its builder are gone, not merely hidden');
    assert.ok(!/pw-delivery/.test(PORTAL), 'and so is its dress');
  });

  test('the row never wears amber — that means work owed by THIS reader', () => {
    const m = PORTAL.match(/if \(dlv\) push\([\s\S]{0,300}/);
    assert.ok(m, 'the push is there');
    const head = m[0].split('\n').slice(0, 4).join('\n');
    assert.match(head, /'green' : 'gray'/);
    assert.ok(!/amber/.test(head), head);
  });

  test('it turns over live — the signature carries the flip', () => {
    const body = strip(PORTAL).match(/function portalSignature[\s\S]*?\n\}/)[0];
    assert.match(body, /lastResponse&&d\.lastResponse\.applied!=null/);
  });

  test('and the opts carry it, or the reading is always null', () => {
    assert.match(PORTAL, /lastResponse:d\.lastResponse\|\|null/);
  });
});

describe('f238 (4) — the words exist in both languages', () => {
  /* co_answer_stuck / co_answer_stuck_act were the toast's and are RETIRED —
     left inert in the dictionary, the way this codebase retires a key, so a
     caller reaching for one still gets English rather than a blank. */
  for (const k of ['al_answer_stuck', 'al_answer_stuck_them', 'po_answer_received', 'po_answer_waiting']){
    test(k + ' is in both dictionaries', () => {
      const hits = I18N.split('\n').filter(l => l.trim().startsWith(k + ':')).length;
      assert.ok(hits >= 2, k + ' appears ' + hits + ' time(s)');
    });
  }
});

describe('f238 (5) — a refusal that must not draw, and must not loop', () => {
  /* Owner-reported 23 Aug 2026: "the bottom right says something needs to be
     settled when there were absolutely nothing negotiated ... the same alert is
     also appearing on the insights page and in other pages and it keeps popping
     up." Reproduced on a real server before it was touched: a readiness claim
     that goes stale between the press and the collection was refused, drawn,
     and NOT marked handled — so it came back on every beat, drew a red box on
     whatever page the reader was on about a contract they were not looking at,
     and wrote a duplicate audit line each time. Four polls, four boxes, four
     lines. */
  test('negoSignalReady no longer toasts — a model must not draw', () => {
    const body = fn(read('js/negotiation.js'), 'negoSignalReady');
    assert.ok(!/toast\(/.test(body),
      'its one caller runs from the background poller; a model that draws ' +
      'draws in the background');
    assert.match(body, /if \(!a\.aligned\) return null/,
      'it refuses by returning null and lets the caller decide what to say');
  });

  test('and the caller still has the sentence, guarded by whether anyone is watching', () => {
    const body = branch('ready');
    assert.match(body, /if\(!opts\.background\) toast\(i18t\('co_readiness_mismatch'\),'err'\)/);
  });

  test('A REFUSED READINESS IS RECORDED ONCE — it is reported handled', () => {
    const body = branch('ready');
    assert.ok(!/return !!\(done\.length\|\|withdrew\.length\)/.test(body),
      'reported unhandled, the poller re-fetches and re-records it for ever — ' +
      'which is what the comment beside it has always said must not happen');
    assert.match(body, /return true;/);
  });

  test('the branch still writes its one audit line, so nothing is hidden', () => {
    const body = branch('ready');
    assert.match(body, /logAudit\(c,'Negotiation',`\$\{who\} signalled ready to sign, but this contract is not settled/);
  });

  test('the decisions branch already had this rule — the two now agree', () => {
    const body = branch('decisions');
    assert.match(body, /if\(!done\.length && !filed\.length && !withdrew\.length\)/,
      'f163 taught it there first: wording that cannot land must still stop arriving');
  });
});

describe('f238 (6) — the counterparty page tells the truth about its own state', () => {
  /* Three owner reports off one screenshot, 23 Aug 2026. */
  test('the spent Ready button has THREE readings, in order', () => {
    const body = fn(PORTAL, 'portalReadySpent');
    assert.match(body, /if\(PORTAL_READY_SENT\) return true/,
      'this sitting first — the record lags the press by up to a beat');
    assert.match(body, /n\.ready && n\.ready\.counterparty/,
      'then the RECORD, which survives any reload');
    assert.match(body, /lr\.action==='ready' && lr\.applied!==true/,
      'then the server, for the window where only it knows');
  });

  test('AND A REFUSED READINESS LEAVES THE BUTTON LIVE', () => {
    const body = fn(PORTAL, 'portalReadySpent');
    assert.match(body, /applied!==true/,
      'marked applied with no readiness on the record means it was REFUSED; ' +
      'spent there would strand the reader behind a signal nobody holds');
  });

  test('the gate reads the predicate, not the sitting flag', () => {
    assert.match(PORTAL, /const spent=portalReadySpent\(\)/);
    assert.ok(!/const spent=PORTAL_READY_SENT/.test(PORTAL));
  });

  test('the two reading buttons follow the contract, and always did', () => {
    /* Reported as "2 buttons are missing". They are drawn when there is
       something behind them and not when there is not — the product's own
       standing rule that a verb which cannot work is not drawn. Pinned so a
       future change to either predicate is a decision rather than a surprise. */
    assert.match(fn(PORTAL, 'portalHasHistory'), /chs\.length>0/);
    assert.match(PORTAL, /\$\{hist\?`<button id="pt-hist"/);
    assert.match(PORTAL, /\$\{cmp\?`<button id="pt-compare"/);
  });
});
