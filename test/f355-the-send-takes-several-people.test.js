/* f355 — THE SEND SCREEN TAKES SEVERAL PEOPLE
   ============================================================================
   Young, 21 September 2026: *"in Door B, you should be able to add multiple
   people to send the document to."*

   ONE SEND, ONE ROUND, SEVERAL LINKS. Everything that happens once still
   happens once — the round, the handover, leaving Draft, the version capture —
   and every person ticked gets a link of their own, addressed to them. The
   list is the contract's OWN people, so a round goes to the people this
   agreement has always been with rather than to an address typed again.

   WHAT THIS FILE PINS
     · the extras are sent AFTER the primary and only if it landed
     · nothing about a round happens twice
     · each link writes its own audit line, and a refusal is counted and said
     · the primary recipient is not offered to themselves
     · the record kind never offers it — that one travels to a colleague
     · one purpose for the whole send; a purpose per row is a different
       feature and the owner has not ruled on it

   Run: node --test test/f355-the-send-takes-several-people.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const read = p => { try{ return fs.readFileSync(path.join(__dirname, '..', p), 'utf8'); }
  catch(_){ return ''; } };
const CORE = read('js/core.js');
const PARTICIPANTS = read('js/participants.js');
const I18N = read('js/i18n.js');

const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++; else if (ch === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
};

const w = () => {
  const world = buildWorld({ participants: true });
  world.win.currentUser = () => ({ id: 'u-me', name: 'Ingrid' });
  world.win.getUsers = () => [];
  return world;
};
const c3 = (win) => {
  const c = { id: 'MK-900', name: 'Nordwind supply', status: 'Under Review',
    counterparty: 'Nordwind GmbH', audit: [], obligations: [], comments: [] };
  win.participantAdd(c, { name: 'Mara Kessler', email: 'mara@nw.de', role: 'negotiate' });
  win.participantAdd(c, { name: 'Lars Holm', email: 'lars@nw.de', role: 'cpsign' });
  win.participantAdd(c, { name: 'Dr Vogt', email: 'vogt@legal.de', role: 'advise' });
  win.participantAdd(c, { name: 'Ingrid', email: 'i@ours.se', role: 'sign' });
  return c;
};

/* ============================================================================
   1 · WHO IS OFFERED
   ==========================================================================*/
describe('f355 (1) the list is the contract’s own people', () => {
  test('their side only, in the role menu’s order', () => {
    const { win } = w();
    const html = win.shareMoreRowsHtml(c3(win), 'negotiate', '');
    assert.ok(html.includes('mara@nw.de') && html.includes('lars@nw.de') && html.includes('vogt@legal.de'),
      'all three of theirs');
    assert.ok(!html.includes('i@ours.se'), 'and nobody on ours — a link is for the other side');
    assert.ok(html.indexOf('lars@nw.de') < html.indexOf('mara@nw.de'),
      'the signer leads, as the role menu does');
  });

  test('the person already in the box is not offered to themselves', () => {
    const { win } = w();
    const html = win.shareMoreRowsHtml(c3(win), 'negotiate', 'MARA@NW.DE');
    assert.ok(!html.includes('mara@nw.de'), 'matched by address, folded');
    assert.ok(html.includes('lars@nw.de'), 'the rest still are');
  });

  test('the record kind never offers it', () => {
    /* That one travels to a colleague, not to the other side. */
    const { win } = w();
    assert.equal(win.shareMoreRowsHtml(c3(win), 'history', ''), '');
  });

  test('a contract with nobody named draws nothing at all', () => {
    const { win } = w();
    const bare = { id: 'MK-901', audit: [], obligations: [], comments: [] };
    assert.equal(win.shareMoreRowsHtml(bare, 'negotiate', ''), '');
  });

  test('each row says which role the person has', () => {
    const { win } = w();
    const html = win.shareMoreRowsHtml(c3(win), 'negotiate', '');
    assert.ok(html.includes(win.participantRoleLabel('advise')), 'the adviser is named as one');
  });
});

/* ============================================================================
   2 · ONE SEND, ONE ROUND
   ==========================================================================*/
describe('f355 (2) everything that happens once still happens once', () => {
  test('the extras are sent after the primary, inside the branch that succeeded', () => {
    const b = fnBody(CORE, 'shareSendExtras');
    assert.ok(b, 'the sender is there');
    /* NOT A SECOND ROUND: it advances nothing, hands nothing over and does
       not touch the contract's stage — doSend did all of that once. */
    for (const forbidden of ['negoHandOver', 'contractLeavesDrafting', 'negoAdvanceRound',
      'shareRememberRecipient', 'refreshShareOverview'])
      assert.ok(!b.includes(forbidden), forbidden + ' happens once, above');
  });

  test('and it is called after the primary landed, not before', () => {
    const i = CORE.indexOf('await shareSendExtras(');
    assert.ok(i > 0, 'it is called');
    const lead = CORE.slice(0, i);
    assert.ok(lead.lastIndexOf('contractLeavesDrafting(c,') < i, 'after the stage moved');
    assert.ok(lead.lastIndexOf("logAudit(c,'Shared'") < i, 'and after the primary’s own line');
  });

  test('one audit line per address, because a link is a fact about one address', () => {
    const b = fnBody(CORE, 'shareSendExtras');
    assert.ok(/logAudit\(c,'Shared'/.test(b), 'each link says where it went');
    assert.ok(/p\.email/.test(b), 'naming the address');
  });

  test('a refusal is counted and said, never swallowed', () => {
    const b = fnBody(CORE, 'shareSendExtras');
    assert.ok(/failed\+\+/.test(b) && /co_more_failed/.test(b), 'counted and reported');
    assert.ok(/catch/.test(b), 'and one bad address cannot undo a round that has gone');
  });

  test('it posts through the product’s own route with the same payload and purpose', () => {
    const b = fnBody(CORE, 'shareSendExtras');
    assert.ok(/api\('shares','POST'/.test(b), 'the one route');
    assert.ok(/payload:o\.payloadObj/.test(b), 'the same payload');
    assert.ok(/purpose:o\.payloadObj\.purpose/.test(b), 'and the same purpose');
  });
});

/* ============================================================================
   3 · WHAT IT DOES NOT DO
   ==========================================================================*/
describe('f355 (3) one purpose for the whole send', () => {
  test('no row carries a purpose of its own [WALL]', () => {
    /* A purpose per row is a different feature: it would mean a signer and an
       adviser going out in one press with two kinds of link, and the owner has
       not ruled on it. Said out loud rather than half-built. */
    const b = fnBody(PARTICIPANTS, 'shareMoreRowsHtml');
    assert.ok(!/data-sh-more-purpose|<select/.test(b), 'the purpose is chosen once, above');
  });

  test('who was ticked is read at the press', () => {
    const b = fnBody(PARTICIPANTS, 'shareMoreChosen');
    assert.ok(/querySelectorAll\('\[data-sh-more\]:checked'\)/.test(b), 'off the live page');
    assert.ok(/@.+\\\.\+|test\(x\.email\)/.test(b), 'and an address that cannot work is dropped');
  });

  test('every new key is in both books', () => {
    for (const k of ['co_more_head', 'co_more_note', 'co_more_sent_one', 'co_more_sent_other',
      'co_more_failed_one', 'co_more_failed_other']) {
      const n = (I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length;
      assert.equal(n, 2, k + ' is in both books exactly once');
    }
  });

  test('and every new name is published', () => {
    /* THE TWO BUILDERS LIVE WITH THE LIST THEY DRAW, in js/participants.js —
       they are about the people, not about the dialog, and putting them there
       is what makes them drivable off a stage that has no js/core.js. */
    assert.ok(/shareMoreRowsHtml, shareMoreChosen/.test(PARTICIPANTS), 'the two builders');
    assert.ok(/shareSendExtras/.test(CORE.slice(CORE.indexOf('Object.assign(window'))),
      'and the sender');
  });
});
