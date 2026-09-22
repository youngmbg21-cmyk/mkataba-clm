/* f354 — WHO IS ON THIS CONTRACT, AND WHAT EACH ONE MAY SEE
   ============================================================================
   Young, 21 September 2026: *"when you draft a new agreement, before you
   create the draft you should have the option to add the other participants to
   the contract, roles and their access levels. Should you choose to skip this,
   there should be another door in the contract page."* And, of the one
   decision put back to him: *"narrow only."*

   THE DESIGN IS THAT THIS IS NOT A SECOND PERMISSIONS SYSTEM. HaTi already
   decides who may open a contract, and naming somebody here cannot widen that
   by a single field. What it adds is an ANSWER, EARLY, to questions the
   product already asks late: who signs, who approves, who checks it, who
   argues it, who may read it.

   WHAT THIS FILE PINS
     · every role names the list it fills, and that sentence is on the screen
     · access narrows and never grants; a colleague who cannot reach the
       contract is SAID SO on their own row, never quietly added
     · three writers and no others; one person, one row per role
     · it emails nobody, has no route and no server field, and it does not
       travel to the counterparty
     · held while the paper is chosen, claimed by the one funnel every
       creation site registers with — and a bulk import claims nothing
     · saveSignerPlan stays the one authority: an empty plan is FILLED, an
       arranged one is never touched
     · one builder, two doors

   Run: node --test test/f354-who-is-on-this-contract.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

/* A MISSING FILE READS AS EMPTY, so this file can be run against a build that
   does not have the module yet and report a claim at a time. A net that cannot
   load says nothing about the behaviour it was written for. */
const read = p => { try{ return fs.readFileSync(path.join(__dirname, '..', p), 'utf8'); }
  catch(_){ return ''; } };
const PARTICIPANTS = read('js/participants.js');
const CONTRACT = read('js/views/contract.js');
const WIZARD = read('js/wizard.js');
const APPROVALS = read('js/approvals.js');
const TRIAGE = read('js/triage.js');
const CORE = read('js/core.js');
const SERVER = read('server/server.js');
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

const w = (opts) => {
  const world = buildWorld({ participants: true });
  world.win.currentUser = () => ({ id: 'u-me', name: 'Ingrid Sjoberg' });
  world.win.getUsers = () => (opts && opts.users) || [];
  world.win.canAccessFolder = (f, u) => !(opts && opts.deny && opts.deny.includes(u && u.id));
  return world;
};
const live = () => ({ id: 'MK-800', name: 'Nordwind supply', status: 'Draft',
  folder: 'proc', audit: [], obligations: [], comments: [] });

/* ============================================================================
   1 · EVERY ROLE IS A JOB THE PRODUCT ALREADY KEEPS A LIST FOR
   ==========================================================================*/
describe('f354 (1) a role answers a question the product already asks', () => {
  test('both sides are named, and every role says which list it fills', () => {
    const { win } = w();
    assert.deepEqual(win.PARTY_SIDES, ['ours', 'theirs']);
    const ours = win.PARTY_ROLES.filter(r => r.side === 'ours').map(r => r.k);
    const theirs = win.PARTY_ROLES.filter(r => r.side === 'theirs').map(r => r.k);
    assert.deepEqual(ours, ['owner', 'sign', 'approve', 'review', 'contribute', 'read']);
    assert.deepEqual(theirs, ['cpsign', 'negotiate', 'advise', 'cpread']);
    win.PARTY_ROLES.forEach(r => {
      assert.ok(r.label && r.label !== r.k, r.k + ' has a name');
      assert.ok(r.fills && r.fills.length > 8, r.k + ' says what naming somebody did');
      assert.ok(r.list, r.k + ' names the list it belongs to');
    });
  });

  test('and the sentence is printed on the row, not left to be guessed', () => {
    const b = fnBody(PARTICIPANTS, 'participantRowHtml');
    assert.ok(/participantFills\(p\.role\)/.test(b), 'every row says what its role fills in');
  });
});

/* ============================================================================
   2 · ACCESS NARROWS; IT NEVER GRANTS
   ==========================================================================*/
describe('f354 (2) narrow only — the owner’s own ruling', () => {
  test('there is no rung above "the whole contract"', () => {
    const { win } = w();
    assert.equal(win.PARTY_ACCESS[0].k, 'all', 'the widest is the default');
    assert.equal(win.PARTY_ACCESS_DEFAULT, 'all');
    assert.deepEqual(win.PARTY_ACCESS.map(a => a.k), ['all', 'nomoney', 'clauses', 'readonly']);
  });

  test('a colleague who cannot reach the value stream is said so, not granted it', () => {
    const users = [{ id: 'u-lars', name: 'Lars', email: 'lars@ours.se' }];
    const { win } = w({ users, deny: ['u-lars'] });
    const c = live();
    win.participantAdd(c, { name: 'Lars', email: 'lars@ours.se', role: 'read' });
    const r = win.participantReach(c, win.participantsOf(c)[0]);
    assert.equal(r.ok, false);
    assert.equal(r.why, 'nostream', 'and the row says which');
    /* THE WALL IS THE WORKSPACE'S: this reading asks canAccessFolder and
       nothing here writes folderAccess. */
    assert.ok(!/folderAccess|signFolders/.test(PARTICIPANTS),
      'naming somebody grants them nothing');
  });

  test('somebody who is not a colleague yet is a fact, not a refusal', () => {
    const { win } = w({ users: [] });
    const c = live();
    win.participantAdd(c, { name: 'New', email: 'new@ours.se', role: 'sign' });
    assert.equal(win.participantReach(c, win.participantsOf(c)[0]).why, 'notamember');
  });

  test('the other side is reached by a link, so there is nothing to check', () => {
    const { win } = w({ users: [] });
    const c = live();
    win.participantAdd(c, { name: 'Mara', email: 'mara@nordwind.de', role: 'negotiate' });
    assert.equal(win.participantReach(c, win.participantsOf(c)[0]).ok, true);
  });
});

/* ============================================================================
   3 · THREE WRITERS, AND NO OTHERS
   ==========================================================================*/
describe('f354 (3) the acts', () => {
  test('a contract that has never named anybody keeps no field', () => {
    const { win } = w();
    const c = live();
    assert.deepEqual(win.participantsOf(c), []);
    assert.equal('participants' in c, false, 'reading must not write');
  });

  test('one person, one row per role — the same role twice is refused', () => {
    const { win } = w();
    const c = live();
    assert.ok(win.participantAdd(c, { name: 'Lars', email: 'l@ours.se', role: 'sign' }));
    assert.equal(win.participantAdd(c, { name: 'Lars', email: 'l@ours.se', role: 'sign' }), null,
      'not de-duplicated silently — refused');
    assert.ok(win.participantAdd(c, { name: 'Lars', email: 'l@ours.se', role: 'review' }),
      'but the same colleague can do two jobs');
    assert.equal(win.participantsOf(c).length, 2);
  });

  test('an unknown role or access falls back rather than storing itself', () => {
    const { win } = w();
    const c = live();
    const p = win.participantAdd(c, { name: 'X', email: 'x@ours.se', role: 'admin-god', access: 'everything' });
    assert.equal(p.role, 'read');
    assert.equal(p.access, 'all');
    win.participantSet(c, p.id, { role: 'nonsense', access: 'nonsense' });
    assert.equal(p.role, 'read', 'and a patch cannot invent one either');
    assert.equal(p.access, 'all');
  });

  test('a patch touches only the keys it is allowed to', () => {
    const { win } = w();
    const c = live();
    const p = win.participantAdd(c, { name: 'X', email: 'x@ours.se', role: 'read' });
    const at = p.at;
    win.participantSet(c, p.id, { name: 'Y', at: '1999-01-01', id: 'pt_hack' });
    assert.equal(p.name, 'Y');
    assert.equal(p.at, at, 'the stamp is not somebody else’s to set');
    assert.equal(p.id.startsWith('pt_hack'), false);
  });

  test('remove takes exactly one row', () => {
    const { win } = w();
    const c = live();
    const a = win.participantAdd(c, { name: 'A', email: 'a@ours.se', role: 'read' });
    win.participantAdd(c, { name: 'B', email: 'b@ours.se', role: 'read' });
    assert.equal(win.participantRemove(c, a.id), true);
    assert.deepEqual(win.participantsOf(c).map(p => p.name), ['B']);
    assert.equal(win.participantRemove(c, 'pt_nothing'), false);
  });
});

/* ============================================================================
   4 · NO ROUTE, NO MAIL, AND IT DOES NOT TRAVEL
   ==========================================================================*/
describe('f354 (4) the walls', () => {
  test('the reading has no route of its own and sends no mail [WALL]', () => {
    assert.ok(!/\bapi\(|fetch\(|sendEmail|notify[A-Z]|mailto:/.test(PARTICIPANTS),
      'no route and nobody is emailed by naming them');
  });

  test('the server has no participants field, because there is no route to it [WALL]', () => {
    assert.ok(!/participants/.test(SERVER), 'it is an ordinary field on the contract json');
  });

  test('and it never reaches the counterparty [WALL]', () => {
    /* buildSharePayload is an ALLOW-LIST by construction: it builds the object
       key by key. Who is on OUR side of an agreement is not their business. */
    const b = fnBody(CORE, 'buildSharePayload');
    assert.ok(b, 'the payload builder is there');
    assert.ok(!/participants/.test(b), 'the list is not on the payload');
  });

  test('every new key is in both books', () => {
    for (const k of ['ppl_title', 'ppl_sub', 'ppl_add', 'ppl_r_sign', 'ppl_f_sign',
      'ppl_a_all', 'ppl_narrows', 'ppl_no_stream', 'ppl_reached_none', 'ppl_open_signers']) {
      const n = (I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length;
      assert.equal(n, 2, k + ' is in both books exactly once');
    }
  });
});

/* ============================================================================
   5 · NAMED BEFORE THE RECORD EXISTS
   ==========================================================================*/
describe('f354 (5) held while the paper is chosen, claimed when it is minted', () => {
  test('the hold is in memory and never persisted [WALL]', () => {
    const b = fnBody(PARTICIPANTS, 'participantsHold');
    assert.ok(!/localStorage|persist\(/.test(b + fnBody(PARTICIPANTS, 'participantsClaim')),
      'nothing is stored until there is a contract to store it on');
  });

  test('claiming moves them onto the contract exactly once', () => {
    const { win } = w();
    const c = live();
    win.participantsHold([{ id: 'pt_a', name: 'Mara', email: 'm@nw.de', role: 'negotiate', access: 'all' }]);
    assert.equal(win.participantsClaim(c), 1);
    assert.equal(win.participantsOf(c).length, 1);
    assert.equal(win.participantsClaim(c), 0, 'the hold is spent');
  });

  test('cancelling the screen drops them', () => {
    const { win } = w();
    win.participantsHold([{ id: 'pt_a', name: 'X', email: 'x@nw.de', role: 'read' }]);
    win.participantsDrop();
    assert.equal(win.participantsClaim(live()), 0);
  });

  test('it is claimed by the one funnel every creation site registers with', () => {
    const b = fnBody(TRIAGE, 'contractArrived');
    assert.ok(/participantsClaim/.test(b), 'contractArrived claims them');
    /* BEFORE THE GUARDS: a contract too empty to be worth reading is still one
       somebody just named three colleagues on. */
    assert.ok(b.indexOf('participantsClaim') < b.indexOf('if (!c || o.bulk) return false;'),
      'and before the reading’s own guards');
    assert.ok(/!o\.bulk/.test(b.slice(0, b.indexOf('participantsClaim'))),
      'a bulk import claims nothing — nobody stood at that screen');
  });

  test('the drafting screen holds them, and the SCREEN going is what drops them', () => {
    assert.ok(/participantsHold\(scratch\.participants\)/.test(WIZARD), 'held as they are typed');
    /* FIVE WAYS OUT, ONE SIGNAL. Cancel and the ✕ are two of them; Escape and
       the scrim call closeModal directly and Create tears the screen down
       itself, so hanging the drop off the buttons left people held after an
       Escape — and the next contract minted ANYWHERE would have claimed them.
       Measured in a browser before this was changed. */
    assert.ok(/MutationObserver/.test(WIZARD) && /na-root/.test(WIZARD),
      'the screen\u2019s own disappearance is the signal');
    assert.ok(/_naClaimed\s*=\s*true/.test(WIZARD),
      'and creating is the one way out that keeps them');
    assert.ok(/id="na-people"/.test(WIZARD) && /<details/.test(WIZARD),
      'shut by default: it is an offer, not a question');
  });
});

/* ============================================================================
   6 · saveSignerPlan IS STILL THE ONE AUTHORITY
   ==========================================================================*/
describe('f354 (6) the answer already in the box, never a second writer', () => {
  test('nothing here writes the signing order [WALL]', () => {
    /* READ CODE, NOT PROSE: the file NAMES saveSignerPlan twice, in the two
       notes saying it is the one authority — which is the opposite of calling
       it. Comments are stripped before the sweep. */
    const code = PARTICIPANTS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    assert.ok(!/signerPlan\s*=/.test(code), 'the list writes no plan');
    assert.ok(!/saveSignerPlan\s*\(/.test(code), 'and calls no writer');
  });

  test('an EMPTY plan opens on the people who are named', () => {
    const { win } = w();
    const c = live();
    win.participantAdd(c, { name: 'Ingrid', email: 'i@ours.se', role: 'sign', memberId: 'u-me' });
    win.participantAdd(c, { name: 'Ola', email: 'ola@nw.de', role: 'cpsign' });
    const rows = win.participantSignerRows(c);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].party, 'internal', 'ours first, as the editor’s own new rows are');
    assert.equal(rows[1].party, 'counterparty');
    assert.equal(rows[1].memberId, '', 'the other side carries no member id');
  });

  test('and a plan somebody arranged is never touched', () => {
    const b = fnBody(APPROVALS, 'openSignerPlanEditor');
    assert.ok(/if\(!plan\.length/.test(b), 'only an empty plan is filled');
    assert.ok(/participantSignerRows/.test(b), 'from the one reading');
  });

  test('a role that fills no list contributes no signer row', () => {
    const { win } = w();
    const c = live();
    win.participantAdd(c, { name: 'A', email: 'a@ours.se', role: 'review' });
    win.participantAdd(c, { name: 'B', email: 'b@nw.de', role: 'advise' });
    assert.deepEqual(win.participantSignerRows(c), []);
  });
});

/* ============================================================================
   7 · ONE BUILDER, TWO DOORS
   ==========================================================================*/
describe('f354 (7) the drafting screen and the Overview draw one list', () => {
  test('both call the same builder', () => {
    assert.ok(/participantsPanelHtml\(/.test(WIZARD), 'the drafting screen');
    assert.ok(/participantsPanelHtml\(c,\{/.test(CONTRACT), 'and the Overview');
  });

  test('the Overview carries what has reached each person; the drafting screen does not', () => {
    assert.ok(/reached:true/.test(CONTRACT), 'the contract page asks for it');
    assert.ok(!/reached:\s*true/.test(WIZARD), 'nothing has reached anybody before the record exists');
  });

  test('what has reached them is borrowed, and unknown is honest', () => {
    const b = fnBody(PARTICIPANTS, 'participantReached');
    assert.ok(/signerPlan/.test(b) && /cachedShares/.test(b), 'the product’s own two lists');
    assert.ok(/unknown/.test(b), 'a page that has not asked does not claim nothing was sent');
  });

  test('the new section is named in the Overview’s repaint router', () => {
    /* A section this pane draws must be named there or its fold flips and the
       wrong host repaints — measured once already, the week this was built.
       RE-POINTED IN PLACE, 22 Sep 2026: this pinned the alternation VERBATIM,
       so adding a fifth section broke a claim about `people`. The claim is
       that `people` is ON that list, whatever else joins it. */
    const m = CONTRACT.match(/test\(key\)\) renderKeyTerms/);
    const line = m ? CONTRACT.slice(CONTRACT.lastIndexOf('if(', m.index), m.index) : '';
    const keys = (line.match(/\(([a-z|]+)\)\$/) || [])[1] || '';
    assert.ok(keys.split('|').includes('people'),
      'people is on the router — the router reads: ' + (keys || 'NOT FOUND'));
  });

  test('and every name is published', () => {
    const { win } = w();
    for (const n of ['participantsOf', 'participantAdd', 'participantSet', 'participantRemove',
      'participantReach', 'participantReached', 'participantSignerRows', 'participantSendRows',
      'participantsHold', 'participantsClaim', 'participantsPanelHtml', 'participantsWire',
      'PARTY_ROLES', 'PARTY_ACCESS'])
      assert.ok(win[n] != null, n + ' is reachable from another module');
  });
});

/* ============================================================================
   8 · WHAT THE SEND SCREEN WILL READ
   ==========================================================================*/
describe('f354 (8) each of their people carries the purpose their role means', () => {
  test('the four purposes are the product’s own four', () => {
    const { win } = w();
    assert.deepEqual(win.PARTY_PURPOSE_OF,
      { cpsign: 'sign', negotiate: 'negotiate', advise: 'advise', cpread: 'view' });
  });

  test('only the other side is offered, and only with an address', () => {
    const { win } = w();
    const c = live();
    win.participantAdd(c, { name: 'Ingrid', email: 'i@ours.se', role: 'sign' });
    win.participantAdd(c, { name: 'Mara', email: 'm@nw.de', role: 'negotiate' });
    win.participantAdd(c, { name: 'Nameless', email: '', role: 'advise' });
    const rows = win.participantSendRows(c);
    assert.deepEqual(rows.map(r => r.name), ['Mara']);
    assert.equal(rows[0].purpose, 'negotiate');
    assert.equal(rows[0].access, 'all', 'and what was asked for rides with them');
  });

  test('they come in the menu’s own order', () => {
    const { win } = w();
    const c = live();
    win.participantAdd(c, { name: 'Adviser', email: 'a@x.de', role: 'advise' });
    win.participantAdd(c, { name: 'Signer', email: 's@x.de', role: 'cpsign' });
    assert.deepEqual(win.participantSendRows(c).map(r => r.role), ['cpsign', 'advise']);
  });
});
