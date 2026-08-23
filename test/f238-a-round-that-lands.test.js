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

  test('and it is reported once per sitting, never nagged', () => {
    assert.match(body, /_pollTold\.has\(key\)/);
    assert.match(body, /_pollTold\.add\(key\)/);
  });

  test('a success clears the memory, so a later failure is news again', () => {
    assert.match(body, /_pollTrouble\.delete\(key\);\s*_pollTold\.delete\(key\)/);
  });

  test('IT WRITES NOTHING TO THE RECORD on the failure path', () => {
    assert.ok(!/logAudit|persist\(/.test(body),
      'persisting a contract we have just failed to apply an answer to is the ' +
      'one moment not to be writing to it');
  });

  test('the toast is a warn with a way forward, never a dead end', () => {
    assert.match(body, /'warn'/);
    assert.match(body, /action:\{ label:i18t\('co_answer_stuck_act'\)/);
  });

  test('and it never claims anything was lost', () => {
    const en = I18N.match(/co_answer_stuck: "([^"]*)"/)[1];
    assert.match(en, /Nothing is lost/i);
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
    const body = fn(PORTAL, 'portalDeliveryLine');
    assert.match(body, /if\(!st\) return ''/);
  });

  test('the sentence draws on BOTH wall branches', () => {
    assert.equal((PORTAL.match(/\$\{portalDeliveryLine\(p\)\}/g) || []).length, 2,
      'the read-only branch is the one that needs it most: the page can flip ' +
      'read-only at exactly the moment the answer lands');
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
  for (const k of ['co_answer_stuck', 'co_answer_stuck_act', 'po_answer_received', 'po_answer_waiting']){
    test(k + ' is in both dictionaries', () => {
      const hits = I18N.split('\n').filter(l => l.trim().startsWith(k + ':')).length;
      assert.ok(hits >= 2, k + ' appears ' + hits + ' time(s)');
    });
  }
});
