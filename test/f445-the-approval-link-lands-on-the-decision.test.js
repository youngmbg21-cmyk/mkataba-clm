/* ============================================================
   f445 — THE APPROVAL LINK LANDS ON THE DECISION (Young ruled 3 Oct 2026)
   ============================================================
   "Finally build idea number 3" — approve straight from the email. The owner
   was offered the two shapes it can take and picked one by name:

     · a one-time code in the email, so Approve works with no sign-in — NOT
       TAKEN. HaTi has never put a secret in an inbox addressed to its own
       staff (`notifyInternalSignerTurn`, app URL not token) and that rule
       stands.
     · a plain link that opens HaTi and asks them to sign in first, and then
       the press is one — TAKEN.

   So the whole of this change is a DESTINATION. The mail carries the app
   link it always carried; what it gains is a word saying what the reader came
   to do, and the app lands them on the card with Approve and Refuse on it
   instead of on the tab that contains it.

   THE CLAIMS:
     1  contractUrl takes an optional `go` and builds it onto the hash
     2  the mails that ask for a decision carry it; the ones that report an
        outcome do not — the asker has nothing to press
     3  NO SECRET IS IN THE MAIL: no token, code or signature anywhere near it
     4  the browser honours a NARROW list, as it does for the tab beside it,
        and an unknown word is simply not acted on
     5  it is not a second door onto deciding: the arrival scrolls and lights,
        and presses nothing
     6  the landing is bounded, so a reader with no card leaves no timer

   Run: node --test test/f445-the-approval-link-lands-on-the-decision.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const SERVER = read('server/server.js');
const CORE = read('js/core.js');
const I18N = read('js/i18n.js');
const APPROVALS = read('js/approvals.js');
const INDEX = read('index.html');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const chunk = (src, from, to) => {
  const i = src.indexOf(from);
  assert.ok(i > 0, 'found: ' + from);
  const j = src.indexOf(to, i + from.length);
  return src.slice(i, j > i ? j : i + 4000);
};

describe('f445 (1) the link can name a destination', () => {
  const fn = chunk(SERVER, 'const contractUrl = (req, contractId, tab, go)', 'const contractSignUrl');
  test('contractUrl takes go and writes it onto the hash', () => {
    assert.match(fn, /go \? `&go=\$\{encodeURIComponent\(go\)\}`/, 'encoded, like the tab beside it');
  });
  test('and a call that passes none builds exactly what it always did', () => {
    assert.match(fn, /: ''\)\s*;?\s*$/m, 'the empty tail is still the default');
    /* Word boundaries on purpose: "encodeURIComponent" carries the letters of
       "code" and is exactly what this line should be doing. */
    assert.doesNotMatch(strip(fn), /\btoken\b|\bsecret\b|\bcode\b/i, 'nothing else joined the link');
  });
});

describe('f445 (2) only the mails that ask for a decision carry it', () => {
  const fn = chunk(SERVER, 'async function saSendApprovalMail', '\napp.post(');
  test('ask, remind and escalate land on the decision', () => {
    const asks = (fn.match(/decideLink/g) || []).length;
    assert.ok(asks >= 3, 'three deciding mails, found ' + asks + ' uses');
  });
  test('and the outcome notices do not — the asker has nothing to press', () => {
    const outcome = fn.slice(fn.indexOf("r.status === 'approved'"));
    assert.doesNotMatch(outcome, /decideLink/,
      'landing somebody on a decision already made is a dead end');
    assert.match(outcome, /\blink\b/, 'they still get the plain link');
  });
  test('the deciding link is built once, with the word, from the one builder', () => {
    assert.match(fn, /const decideLink = contractUrl\(req, c\.id, 'sign', 'approval'\)/);
  });
});

describe('f445 (3) nothing secret is in the mail', () => {
  const fn = strip(chunk(SERVER, 'async function saSendApprovalMail', '\napp.post('));
  test('no token, code, key or signature anywhere in the builder', () => {
    for (const bad of [/\btoken\b/i, /\bone[- ]?time\b/i, /\bhmac\b/i, /\bsign(ed)?Url\b/i])
      assert.doesNotMatch(fn, bad, 'the owner chose the plain link: ' + bad);
  });
  test('and the standing rule it rests on is still true of the signer mail', () => {
    assert.match(SERVER, /contractSignUrl = \(req, contractId\) => contractUrl\(req, contractId, 'sign'\)/,
      'an internal signer is still told with an app URL and no token');
  });
});

describe('f445 (4) the browser honours a narrow list', () => {
  test('go is read off the hash beside the tab', () => {
    assert.match(CORE, /\(\?:&go=\(\[a-z\]\+\)\)\?\$/i, 'an optional word, at the end');
  });
  test('and resolved through a table, never acted on blind', () => {
    assert.match(CORE, /const HASH_GO = \{ approval: \{ tab:'sign', sel:'#sa-card' \} \}/);
    assert.match(CORE, /const go=HASH_GO\[String\(m\[3\]\|\|''\)\.toLowerCase\(\)\]\|\|null/,
      'a word the table does not know answers null and nothing happens');
  });
  test('the card it names is the one the approval really draws', () => {
    assert.match(APPROVALS, /id="sa-card"/, 'the selector is not invented here');
  });
});

describe('f445 (5) it is not a second door onto deciding', () => {
  const fn = chunk(CORE, '  if(go){', '  return true;\n}');
  test('the arrival scrolls and lights, and presses nothing', () => {
    assert.match(fn, /scrollIntoView/);
    assert.match(fn, /classList\.add\('is-landed'\)/);
    assert.doesNotMatch(fn, /\.click\(\)|signApprovalDecide|approveContract/,
      'the press is still the in-app button, behind the same guard');
  });
  test('and the mark takes itself off, so nothing permanent is added', () => {
    assert.match(fn, /classList\.remove\('is-landed'\)/);
  });
  test('the ring costs the page no layout, and respects reduced motion', () => {
    assert.match(INDEX, /\.sa-card\.is-landed\{outline:/, 'an outline is drawn outside the box');
    assert.doesNotMatch(chunk(INDEX, '.sa-card.is-landed{', '.sa-card-h{'), /margin|padding|border-width/,
      'nothing that would move the card');
    assert.match(INDEX, /prefers-reduced-motion: reduce\)\{ \.sa-card\.is-landed\{animation:none/);
  });
});

describe('f445 (6) the landing is bounded', () => {
  const fn = chunk(CORE, '  if(go){', '  return true;\n}');
  test('it gives up rather than waiting for ever', () => {
    assert.match(CORE, /const HASH_GO_WAIT = \d+, HASH_GO_TRIES = \d+, HASH_GO_LIT = \d+/,
      'the three numbers are named once');
    assert.match(fn, /\+\+tries<HASH_GO_TRIES/, 'a reader who never gets a card leaves no timer running');
  });
  test('a reader with no decision to make simply arrives on the tab', () => {
    assert.match(fn, /if\(!el\)\{/, 'no card is not an error to explain away');
    assert.doesNotMatch(fn, /toast\(/, 'and nothing is said about it');
  });
});

describe('f445 (7) the mail says what the link does, in both books', () => {
  test('one wording, two books', () => {
    const hits = (I18N.match(/^\s*mail_sa_open:/gm) || []).length;
    assert.equal(hits, 2, 'found ' + hits);
  });
  test('and it names the act rather than the page', () => {
    const en = /mail_sa_open: '([^']+)'/.exec(I18N);
    assert.ok(en, 'the English line is there');
    assert.match(en[1], /[Aa]pprove/, 'the reader is told what they came to do: ' + en[1]);
  });
});
