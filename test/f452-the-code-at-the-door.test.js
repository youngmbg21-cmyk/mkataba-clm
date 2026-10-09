/* ============================================================
   F452 — The code at the door
   ============================================================
   Young picked "The guest list" by name from three, in the decision pack of
   4 October 2026: *several named people per outside party, each with their own
   link and their own code.*

   TWO THIRDS OF IT WAS ALREADY BUILT, which is why this was one night's work
   and not a week's — and the first draft of this build did not notice:

     · THE GUEST LIST. js/participants.js has held several named people per
       contract since September, and the send screen has minted one link each
       through shareSendExtras since the day it learned to copy a colleague.
     · AND THE CODE. share_otp, POST /api/shares/:token/otp and /verify-otp
       have minted a six-digit code, mailed it to the address ON THE ROW,
       hashed it, counted wrong guesses and handed back a ticket since the
       signing work.

   THE FIRST DRAFT WROTE A SECOND PAIR OF ROUTES ANYWAY — four new columns on
   `shares`, two new rate-limit buckets, its own expiry, its own ticket — and
   f358 (7e) failed, by name: *"a second door onto an act that already has
   one"*. That test exists because this exact mistake was made once before and
   reverted. It was reverted again here, and every line of it is gone.

   SO WHAT THIS BUILD ADDED IS ONE QUESTION ASKED IN ONE MORE PLACE. The code
   gated SIGNING and nothing gated OPENING, so a link addressed to one person
   opened for anybody they forwarded it to. The payload route now asks.

   ONE CODE, ONE PROOF, TWO GATES. The proof the door wants is exactly the
   proof the signature wants — this address, this person, this link — so a
   guest who proved their inbox to open the link does not prove it again to
   sign. Minting a second code for the same question would be the weakening:
   two codes in one inbox, neither meaning anything in particular.

   THE ADDRESS IS NEVER TAKEN FROM A CALLER, which the existing route already
   kept and f358 (7b) already pins. A route that mailed a code to an address
   the caller supplied would be a machine for turning somebody else's link into
   your own.

   OFF BY DEFAULT, like the desk rule, the review gate and approval before
   signing. With it off not one link behaves differently, which is what lets it
   be switched on later with no migration and nothing to undo.

   AND NOT ON A STATUS LINK. That page was built on 3 October to be read with
   no account by whoever is sent it; it carries no wording, no names and no copy
   of the contract, so there is nothing behind it for a code to protect. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const SRV = read('server/server.js');
const CORE = read('js/core.js');
const PORTAL = read('js/views/portal.js');
const SETTINGS = read('js/views/settings.js');
const I18N = read('js/i18n.js');

/* COMMENTS ARE NOT CODE. Every sweep below runs on source with the block and
   line comments taken out, because this build lost an hour to a check that
   passed on a sentence somebody wrote ABOUT the code — and then broke f354's
   participants wall with a comment, which is the same fault from the other end. */
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

const HELPERS = bare(SRV.slice(SRV.indexOf('const shareCodeOn ='),
  SRV.indexOf("app.get('/api/shares/:token'")));
const OTP = bare(SRV.slice(SRV.indexOf("app.post('/api/shares/:token/otp'"),
  SRV.indexOf("app.post('/api/shares/:token/verify-otp'")));
const VERIFY = bare(SRV.slice(SRV.indexOf("app.post('/api/shares/:token/verify-otp'"),
  SRV.indexOf("app.post('/api/shares/:token/verify-otp'") + 2600));
const PAYLOAD = bare(SRV.slice(SRV.indexOf("app.get('/api/shares/:token'"),
  SRV.indexOf("app.post('/api/shares/:token/respond'")));
const SCREEN = bare(PORTAL.slice(PORTAL.indexOf('function portalCodeScreen'),
  PORTAL.indexOf('function renderSharePortal')));

describe('f452 (1) — ONE DOOR: no second code was built', () => {
  test('there are no code routes of their own', () => {
    assert.ok(!/shares\/:token\/code/.test(SRV),
      'f358 (7e) is the standing test for this and it caught the first draft of '
      + 'this build. The code a guest proves their inbox with is the code the '
      + 'signature already asks for');
    assert.equal((SRV.match(/app\.post\('\/api\/shares\/:token\/otp'/g) || []).length, 1);
  });

  test('and no second store, no second clock and no second counter', () => {
    for (const col of ['code_hash', 'code_at', 'code_tries', 'code_ticket'])
      assert.ok(!new RegExp("addColumnIfMissing\\('shares', '" + col + "'").test(SRV),
        col + ' was a column on shares in the first draft; share_otp already held it');
    assert.ok(!/rateLimit\('codesend'|rateLimit\('codetry'/.test(SRV),
      'rlOtp and rlOtpToken already ration this act, per IP and PER SHARE TOKEN');
    assert.ok(!/SHARE_CODE_MINUTES|SHARE_CODE_TRIES/.test(SRV),
      'share_otp carries expires and attempts, and OTP_MAX_ATTEMPTS is the one cap');
  });

  test('the browser presses the product\'s own two routes', () => {
    assert.match(SCREEN, /\/otp'/, 'ask for one');
    assert.match(SCREEN, /\/verify-otp'/, 'and guess it');
    assert.ok(!/\/code'|\/code\/verify'/.test(SCREEN));
    assert.match(SCREEN, /portalTicketPut\(token, j\.verify\)/,
      'and the ticket it keeps is the ticket that route hands back');
  });
});

describe('f452 (2) — the wall is on the route that hands over the contract', () => {
  test('the payload route itself refuses, so no page can be skipped past', () => {
    assert.match(PAYLOAD, /shareNeedsCode\(s\)\s*&&\s*!shareDoorOtpOk\(s\.token,/,
      'a code screen is a page, and a page can be closed; the thing that must '
      + 'not be reachable is the wording, the changes and the thread, and they '
      + 'are handed over here');
    assert.match(PAYLOAD, /status\(401\)/,
      'and it answers unauthorised rather than empty, so the page knows what to draw');
  });

  test('the refusal carries the masked address and nothing else', () => {
    const line = PAYLOAD.slice(PAYLOAD.indexOf('Check it is you'),
      PAYLOAD.indexOf('Check it is you') + 320);
    assert.match(line, /needsCode: true/);
    assert.match(line, /shareCodeMask\(s\.recipient_email\)/,
      'enough for the holder to know which inbox to open');
    assert.ok(!/contract|changes|thread|wording/i.test(line),
      'a refusal that leaked one fact about the deal would make the wall decorative');
  });

  test('it stands BELOW the two answers that say the link is dead', () => {
    const gate = PAYLOAD.indexOf('shareNeedsCode(s)');
    const revoked = PAYLOAD.indexOf("gone: 'revoked'");
    const expired = PAYLOAD.indexOf("gone: 'expired'");
    assert.ok(revoked > 0 && expired > 0 && gate > revoked && gate > expired,
      'a withdrawn or expired link is dead for everybody. Asking "prove who you '
      + 'are" first would send its holder off to fetch a code the code route '
      + 'itself refuses — a door asking for a key to a room that is gone');
  });

  test('and above it stands the status link\'s own refusal, untouched', () => {
    assert.ok(PAYLOAD.indexOf('shareIsStatus(s)') < PAYLOAD.indexOf('shareNeedsCode(s)'),
      'the two walls are about different things and neither may swallow the other');
  });

  test('the ticket is compared whole, in constant time', () => {
    assert.match(HELPERS, /function shareDoorOtpOk[\s\S]*?timingSafeEqual/,
      'a plain === on a secret leaks its length and its prefix a byte at a time');
    assert.match(HELPERS, /want\.length === got\.length/,
      'and timingSafeEqual throws on a length mismatch, so the lengths are asked first');
    assert.match(HELPERS, /row\.verified && row\.verify/,
      'an unspent row has a verify of null, and null must never be a ticket');
  });
});

describe('f452 (3) — which links ask, decided in one place', () => {
  test('a status link never asks', () => {
    assert.match(HELPERS, /function shareNeedsCode[\s\S]*?shareIsStatus\(s\)\) return false/,
      'that page exists to be read with no account and carries nothing a code could protect');
  });

  test('a link with no address to mail to never asks', () => {
    assert.match(HELPERS, /function shareNeedsCode[\s\S]*?recipient_email \|\| ''\)\.trim\(\)/,
      'a code that cannot be delivered is a locked door with the key thrown away — '
      + 'the link would simply never open, for anybody');
  });

  test('one reading answers it for every door', () => {
    assert.ok([...bare(SRV).matchAll(/shareNeedsCode\(/g)].length >= 5,
      'the helper, the payload gate, and the two escapes on the code routes');
  });
});

describe('f452 (4) — off by default, and it is the STORED rule that decides', () => {
  test('the server reads the setting itself and falls to false', () => {
    assert.match(HELPERS, /const shareCodeOn =[\s\S]*?getSetting\('appSettings'\)[\s\S]*?linkCode/,
      'the same blob the desk rule and the review gate live in');
    assert.match(HELPERS, /catch \(_\) \{ return false; \}/,
      'a rule that cannot be read is a rule that is not on');
  });

  test('it is never read from the request', () => {
    assert.ok(HELPERS.includes('shareCodeOn') && HELPERS.length > 600,
      'a not-doing proves nothing over an empty slice, so the slice is asked for first');
    assert.ok(!/req\.(body|query|headers)[\s\S]{0,40}linkCode/.test(HELPERS + OTP + VERIFY + PAYLOAD),
      'THE SERVER IS THE WALL: a caller who could say "this link asks no code" '
      + 'would have switched the whole feature off from outside');
  });

  test('and the browser\'s copy starts off too', () => {
    assert.match(CORE, /const LINK_CODE_DEFAULT = \{ on:false \}/);
    assert.match(CORE, /function linkCodeCfg\(\)[\s\S]*?on:!!g\.on/,
      'read as a boolean, so a half-written setting is off rather than truthy');
  });
});

describe('f452 (5) — the escape on the code routes is narrow, and reverses nothing', () => {
  test('a read-only or adviser link is still refused a SIGNING code', () => {
    assert.match(OTP, /if \(!shareNeedsCode\(s\)\) \{\s*if \(refuseIfViewOnly\(s, res\)\) return;\s*if \(refuseIfAdvice\(s, res\)\) return;/,
      'f144 measured that a view token could make the server email a signing '
      + 'code, and that wall stays. The escape applies only where this route is '
      + 'also the only way its holder can OPEN the link at all');
  });

  test('dead is dead, for everybody', () => {
    const after = OTP.slice(OTP.indexOf('shareNeedsCode(s)'));
    assert.match(after, /s\.revoked_at \|\| shareExpired\(s\)/,
      'and it is NOT inside the escape — a revoked link mails nothing to anybody');
    assert.ok(OTP.indexOf('revoked_at') > OTP.indexOf('if (!shareNeedsCode(s))'));
  });

  test('a spent one-shot link may still be opened by the person it was sent to', () => {
    assert.match(OTP, /s\.response && !s\.durable && !shareNeedsCode\(s\)/,
      'otherwise answering the link once would lock its own reader out of reading it back');
    assert.match(VERIFY, /sh\.response && !sh\.durable && !shareNeedsCode\(shFull\)/,
      'and the same escape on the other half, or the code could be asked for and never spent');
  });
});

describe('f452 (6) — the address is said back without being given away', () => {
  test('the name is masked and the domain is not', () => {
    assert.match(HELPERS, /function shareCodeMask[\s\S]*?u\.slice\(0, 2\)\) \+ '…@' \+ d/,
      'what every sign-in screen does. The first draft masked the domain too '
      + 'and printed e…g@n…g.example for a real address — a wall doing no work '
      + 'and no help left either. The domain is the company whose link this is; '
      + 'the part worth hiding is which person at it');
  });

  test('a string that is not an address masks to nothing', () => {
    assert.match(HELPERS, /if \(at < 1\) return ''/,
      'rather than printing whatever was in the column');
  });

  test('and the screen draws the same mask the refusal does', () => {
    assert.match(PORTAL, /function portalMaskAddress[\s\S]*?u\.slice\(0,2\)\)\+'…@'/,
      'the /otp route answers with the whole address — the sender\'s own choice, '
      + 'returned since the signing work — so the screen masks it to the same '
      + 'shape rather than printing it, and one screen cannot read two ways');
  });
});

describe('f452 (7) — the browser carries the ticket; it never decides', () => {
  test('the ticket lives for the sitting only', () => {
    assert.match(PORTAL, /sessionStorage\.getItem\(PT_TICKET_KEY/,
      'localStorage would leave a borrowed laptop inside somebody else\'s deal tomorrow');
    assert.ok(!/localStorage[\s\S]{0,40}PT_TICKET_KEY/.test(PORTAL));
  });

  test('it is handed to the route that decides, and that is all it does', () => {
    assert.match(PORTAL, /'api\/shares\/'\+encodeURIComponent\(token\)\+\(t\?\('\?t='/,
      'the server compares it; the page only carries it');
  });

  test('a stale ticket is dropped rather than argued with', () => {
    assert.match(PORTAL, /status===401 && d && d\.needsCode\)\{ portalTicketPut\(token, ''\)/,
      'the ticket the server just refused is the one thing we know is no good');
  });

  test('the code screen holds nothing of the deal', () => {
    assert.match(SCREEN, /pt-code-in/, 'the screen is here to be read, or this claim is about nothing');
    assert.ok(!/\bp\.contract\b|negoChanges|redlineDocHtml|docSheetHtml|c\.body/.test(SCREEN),
      'and not because it hides it: the payload was refused, so this screen has '
      + 'not been given a contract to show. There is nothing to skip to');
  });

  test('a refresh does not spend the mail again', () => {
    assert.match(SCREEN, /sentAlready\(\)\) say\(noMail\?i18t\('po_code_outbox_ask',\{who:asker\}\):i18t\('po_code_already'\)/,  // 8 Oct 2026: with email off it says who to ask
      'the first arrival sends because opening the link IS the ask; every later '
      + 'one waits for the press');
  });

  test('"sent" means sent, in the four states the report has', () => {
    assert.match(SCREEN, /j\.emailSent\?i18t\('po_code_sent'/);
    assert.match(SCREEN, /!j\.emailSent&&!j\.emailConfigured/,
      'no provider means the code queued to the admin-only outbox, which is '
      + 'honest delivery and not a failure');
    assert.match(SCREEN, /j\.emailError/,
      'and a provider that refused says so, in the words mailReportPublic chose');
  });

  test('and every sentence on it is HaTi\'s own words, in both books', () => {
    const keys = [...SCREEN.matchAll(/i18t\('(po_code_[a-z_]+)'/g)].map(m => m[1]);
    assert.ok(keys.length >= 8, 'the screen is written in the string book, not in the page');
    for (const k of [...new Set(keys)])
      assert.ok(I18N.split(k + ':').length - 1 >= 2,
        k + ' is missing from one of the two books');
  });
});

describe('f452 (8) — the switch is an admin\'s, and it is one switch', () => {
  test('it sits in a group named for what it does, and the group holds four at most', () => {
    const panel = SETTINGS.slice(SETTINGS.indexOf('  linkcode:{'),
      SETTINGS.indexOf('  desk:{'));
    assert.match(panel, /tab:'platform', group:'links'/,
      'MEASURED FIRST: dropping this row into "The agreement" made a group of '
      + 'five, and settings-groups 1c holds every group to four. It is also the '
      + 'truer home — the rules above decide who must SAY YES before a step, '
      + 'this one decides who may OPEN what has already left the building');
    assert.match(SETTINGS, /\{ key:'links',\s+tab:'platform', sub:true \}/,
      'and the group is declared, or the row lands in the last group of the tab '
      + 'instead of the one it names');
    assert.match(panel, /mandatory:false/, 'nothing is required of a workspace that leaves it off');
  });

  test('a non-admin can read it and cannot move it', () => {
    const fn = SETTINGS.slice(SETTINGS.indexOf('function renderLinkCodePanel'),
      SETTINGS.indexOf('function renderDeskRulePanel'));
    assert.match(fn, /const admin=isAdmin\(\)/);
    assert.match(fn, /admin&&!blocked\?'':' disabled'/);  // 8 Oct 2026: also greyed while email is off
    assert.match(fn, /if\(!admin\) return;/,
      'greyed AND unwired: a dead button wearing a live one\'s clothes is a fault');
  });

  test('and there is no number here to get wrong', () => {
    const fn = SETTINGS.slice(SETTINGS.indexOf('function renderLinkCodePanel'),
      SETTINGS.indexOf('function renderDeskRulePanel'));
    assert.match(fn, /lc-rule-on/, 'the panel is here to be read, or this claim is about nothing');
    assert.ok(!/minutes|tries|OTP_MAX/.test(fn),
      'how long a code lives and how many guesses it takes are what stops '
      + 'guessing, not something an admin has an opinion about — they stay on the server');
  });
});
