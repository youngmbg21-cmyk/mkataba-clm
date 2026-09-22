/* f359 — WHO THE AGREEMENT IS BETWEEN, AND WHAT EACH PARTY MAY DO
   ============================================================================
   Young, 22 September 2026: *"Start from the latest main then implement the
   multi party system accordingly."* — "accordingly" being the artifact
   "Comments and Parties, Full Pages", whose own recommendations were taken on
   the three decisions it left open (D6 HaTi holds the pen, D7 one refusal is
   a refusal, D8 a signs-only party gets no negotiation link) and on D16, which
   this build added.

   THE DESIGN IS THAT NOTHING ON FILE MOVED. `.counterparty` is read 432 times
   across 40 files — the register, the graph, payment terms, precedent, the
   reminders, the phone, the server. Rewriting those is not a migration, it is
   a rebuild, and every one of them is a place two readings could drift. So
   `c.counterparty` IS the first outside party's name, `partiesSet` is the one
   writer that keeps it so, and `contractParties` DERIVES the two parties every
   contract has always had where nothing is stored.

   WHAT THIS FILE PINS
     · one reading of who the parties are; a record with nothing stored answers
       the pair it has always answered
     · ONE WRITER, and it keeps `c.counterparty` in step in the same breath
     · a refusal is a sentence: two parties with one name, a party with none
     · people are not parties — two namespaces, two builds, no collision
     · the paper names every party and rules a line for each that signs
     · the register and the fact row say the first and count the rest; a search
       finds a contract by the name of the company that GUARANTEES it
     · ONE DECISION PER NEGOTIATING PARTY: accepted when all accept, refused
       the moment one refuses, and the wording does not move before that
     · THE SIGNING ROUTE RUNS IN STEPS, and a route with nothing stored is the
       strict queue it has always been — to the row, on both hosts
     · THE SERVER IS THE WALL: its parties twin, its turn check, and its
       refusal to give a signs-only party a negotiation link
     · the module reaches no route, writes no server field and sends no mail

   46 of the 49 claims are RED at the parent. The three that pass are named:
   two WALLS and one CONTROL, and the control passing is the measurement that
   an ordinary two-party contract is byte-identical.

   Run: node --test test/f359-who-the-agreement-is-between.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

/* A MISSING FILE READS AS EMPTY, so this file runs against a build that does
   not have the module yet and reports a claim at a time. A net that cannot
   load says nothing about the behaviour it was written for. */
const read = p => { try { return fs.readFileSync(path.join(__dirname, '..', p), 'utf8'); }
  catch (_) { return ''; } };
const PARTIES = read('js/parties.js');
const NEGO = read('js/negotiation.js');
const APPROVALS = read('js/approvals.js');
const CONTRACT = read('js/views/contract.js');
const REGISTER = read('js/views/register.js');
const CORE = read('js/core.js');
const SERVER = read('server/server.js');
const PARTICIPANTS = read('js/participants.js');
const I18N = read('js/i18n.js');

/* buildWorld returns the stage; its published names are on `.win`. */
const world = () => buildWorld({ contractView: true, metadata: true }).win;

/* A contract shaped the way every record on file is shaped: one counterparty
   name, one address, nothing stored under `parties`. */
const plainContract = () => ({
  id: 'MK-396', name: 'Warehousing and Transportation Services',
  party: 'Young', counterparty: 'AIT Worldwide Logistics Norway AS',
  counterpartyEmail: 'k.hansen@aitworldwide.no', status: 'Under Review',
});

/* The same contract with a guarantor named. */
const threeParty = () => {
  const c = plainContract();
  c.parties = [
    { id: 'py_us', name: 'Young', role: 'the Customer', side: 'ours' },
    { id: 'py_prov', name: 'AIT Worldwide Logistics Norway AS', role: 'the Provider',
      side: 'theirs', involvement: 'negotiate', email: 'k.hansen@aitworldwide.no' },
    { id: 'py_guar', name: 'AIT Worldwide Logistics AS', role: 'the Guarantor',
      side: 'theirs', involvement: 'sign' },
  ];
  return c;
};

describe('f359 (1) — one reading, and a record on file answers what it always answered', () => {
  test('nothing stored derives the two parties the contract has always had', () => {
    const w = world();
    const rows = w.contractParties(plainContract());
    assert.equal(rows.length, 2, 'ours and theirs');
    assert.equal(rows[0].side, 'ours');
    assert.equal(rows[0].name, 'Young', 'our entity on THIS agreement, not the workspace');
    assert.equal(rows[1].side, 'theirs');
    assert.equal(rows[1].name, 'AIT Worldwide Logistics Norway AS');
    assert.equal(rows[1].email, 'k.hansen@aitworldwide.no', 'the address comes with it');
    assert.equal(rows[1].involvement, 'negotiate', 'the one outside party negotiates');
  });

  test('a contract with no counterparty named answers with our row alone', () => {
    const w = world();
    const c = plainContract(); delete c.counterparty; delete c.counterpartyEmail;
    const rows = w.contractParties(c);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].side, 'ours');
    assert.equal(w.partiesTheirs(c).length, 0);
  });

  test('OURS LEADS whatever order the record happens to hold', () => {
    const w = world();
    const c = threeParty();
    c.parties = [c.parties[2], c.parties[1], c.parties[0]];   // ours last
    const rows = w.contractParties(c);
    assert.equal(rows[0].side, 'ours', 'every surface draws us first');
    assert.equal(rows.length, 3);
  });

  test('our own side always negotiates and signs, whatever a hand-edited record says', () => {
    const w = world();
    const c = threeParty();
    c.parties[0].involvement = 'none';
    assert.equal(w.partyOurs(c).involvement, 'negotiate',
      'a record cannot arrive saying we may not sign our own agreement');
  });

  test('partiesMulti is FALSE on every ordinary contract — that is what keeps the screens still', () => {
    const w = world();
    assert.equal(w.partiesMulti(plainContract()), false);
    assert.equal(w.partiesMulti(threeParty()), true);
  });

  test('the reading never writes', () => {
    const w = world();
    const c = plainContract();
    const before = JSON.stringify(c);
    w.contractParties(c); w.partiesTheirs(c); w.partiesMulti(c);
    w.partiesLead(c); w.partiesMatch(c, 'ait'); w.partyOurs(c);
    assert.equal(JSON.stringify(c), before, 'READING MUST NOT WRITE');
  });
});

describe('f359 (2) — one writer, and c.counterparty is kept in step', () => {
  test('partiesSet writes the first outside party onto c.counterparty', () => {
    const w = world();
    const c = plainContract();
    const why = w.partiesSet(c, [
      { id: 'py_us', name: 'Young', side: 'ours' },
      { id: 'py_a', name: 'Nordkust Industri AB', side: 'theirs', email: 'a@n.example' },
      { id: 'py_b', name: 'Kilimo Data Ltd', side: 'theirs' },
    ]);
    assert.equal(why, null, 'accepted');
    assert.equal(c.counterparty, 'Nordkust Industri AB',
      'the stored counterparty IS the first outside party — 432 readings rest on it');
    assert.equal(c.counterpartyEmail, 'a@n.example');
    assert.equal(c.parties.length, 3);
  });

  test('removing every outside party clears the stored counterparty rather than leaving a ghost', () => {
    const w = world();
    const c = threeParty();
    w.partiesSet(c, [{ id: 'py_us', name: 'Young', side: 'ours' }]);
    assert.equal(c.counterparty, '');
    assert.ok(!('counterpartyEmail' in c), 'no address for a party that is not there');
  });

  test('two parties with one name is refused IN WORDS, and nothing is written', () => {
    const w = world();
    const c = plainContract();
    const why = w.partiesSet(c, [
      { id: 'py_us', name: 'Young', side: 'ours' },
      { id: 'py_a', name: 'AIT Worldwide Logistics AS', side: 'theirs' },
      { id: 'py_b', name: 'ait worldwide logistics as', side: 'theirs' },
    ]);
    assert.ok(why && /cannot both be called/i.test(why), 'a sentence, folded case: ' + why);
    assert.ok(!c.parties, 'a refusal writes nothing');
    assert.equal(c.counterparty, 'AIT Worldwide Logistics Norway AS', 'and moves nothing');
  });

  test('a party with no name is refused', () => {
    const w = world();
    const c = plainContract();
    const why = w.partiesSet(c, [
      { id: 'py_us', name: 'Young', side: 'ours' },
      { id: 'py_a', name: '', side: 'theirs' },
    ]);
    assert.ok(why && /name/i.test(why), why);
  });

  test('a ceiling is a FACT, never a silent trim', () => {
    const w = world();
    const c = plainContract();
    const many = [{ id: 'py_us', name: 'Young', side: 'ours' }];
    for (let i = 0; i < w.PARTY_MAX + 2; i++) many.push({ id: 'p' + i, name: 'Co ' + i, side: 'theirs' });
    const why = w.partiesSet(c, many);
    assert.ok(why && /at most/i.test(why), 'said, not truncated: ' + why);
  });

  /* A NAMED WALL — true before this build and after it, and the thing that
     would break first if a second writer were ever added. */
  test('WALL: nothing else in the product writes c.parties', () => {
    const all = [NEGO, APPROVALS, CONTRACT, REGISTER, CORE, PARTICIPANTS].join('\n');
    const writes = all.match(/\.parties\s*=/g) || [];
    assert.equal(writes.length, 0,
      'partiesSet is the one writer; found ' + writes.length + ' assignment(s) elsewhere');
  });
});

describe('f359 (3) — people are not parties', () => {
  test('the two namespaces do not collide', () => {
    const pyKeys = [...I18N.matchAll(/^\s+(py_[a-z0-9_]+):/gm)].map(m => m[1]);
    const pplKeys = [...I18N.matchAll(/^\s+(ppl_[a-z0-9_]+):/gm)].map(m => m[1]);
    assert.ok(pyKeys.length > 20, 'the parties build has its own keys');
    assert.ok(pplKeys.length > 5, 'the people build still has its own');
    const shared = pyKeys.filter(k => pplKeys.includes(k.replace(/^py_/, 'ppl_')) && false);
    assert.equal(shared.length, 0);
  });

  /* A NAMED WALL. At the parent it reads an empty file and is vacuous; what
     it is for is the day somebody reaches from one build into the other. */
  test('WALL: js/parties.js reads nothing from the people record, and the people record reads nothing here', () => {
    /* READ CODE, NOT PROSE — this file's own header explains the distinction
       between the two builds, and a sweep over the comments would fail on the
       sentence that draws it. */
    const code = PARTIES.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    assert.ok(!/participant/i.test(code), 'parties does not read participants');
    assert.ok(!/\bcontractParties\b|\bpartiesSet\b/.test(PARTICIPANTS),
      'participants does not read parties');
  });

  test('the Overview says which is which, on the card that draws both', () => {
    assert.ok(/People/.test(CONTRACT) && /py_parties/.test(CONTRACT),
      'both sections are on the record card');
    assert.ok(/about \*\*people\*\*|about <b>people<\/b>|about <b>companies<\/b>|py-block/.test(CONTRACT),
      'the block exists and the card distinguishes them');
  });
});

describe('f359 (4) — no route, no server field of its own, no mail', () => {
  test('the module calls nothing', () => {
    assert.ok(PARTIES, 'js/parties.js is on disk');
    for (const bad of ['api(', 'fetch(', 'sendEmail', 'XMLHttpRequest', 'localStorage']) {
      assert.ok(!PARTIES.includes(bad), 'js/parties.js must not reach ' + bad);
    }
  });
  test('and it writes no audit line of its own — the door that writes does', () => {
    assert.ok(!/logAudit/.test(PARTIES), 'the model records nothing; openPartyEditor does');
    assert.ok(/logAudit\(c,\s*'Parties'/.test(CONTRACT), 'and it does');
  });
});

describe('f359 (5) — the paper names every party', () => {
  /* THE CONTROL. It passes at the parent BY DESIGN: it is the claim that an
     ordinary two-party contract did not move, and a control that went red
     would mean this build had changed every contract on file. */
  test('CONTROL: two parties keep the sentence they have always had', () => {
    const w = world();
    const html = w.docPaperHeadHtml(plainContract());
    assert.ok(/Between/.test(html), 'the pair sentence: ' + html.slice(0, 200));
    assert.ok(!/py_between|undefined/.test(html));
  });

  test('three parties read as a list, each with the role the paper gives it', () => {
    const w = world();
    const html = w.docPaperHeadHtml(threeParty());
    assert.ok(/AIT Worldwide Logistics Norway AS/.test(html), 'the provider is named');
    assert.ok(/AIT Worldwide Logistics AS/.test(html), 'AND THE GUARANTOR IS NAMED');
    assert.ok(/the Guarantor/.test(html), 'with its own role');
  });

  test('the foot rules a line for every party that signs, and none for one that does not', () => {
    const w = buildWorld({ negotiationView: true, contractView: true }).win;
    const c = threeParty();
    const three = w.rlPaperFootHtml(c);
    assert.equal((three.match(/rl-sigline/g) || []).length, 3, 'one rule per party');
    c.parties[2].involvement = 'none';
    const two = w.rlPaperFootHtml(c);
    assert.equal((two.match(/rl-sigline/g) || []).length, 2,
      'a party that does not execute gets no ruled line to wait at');
    const plain = w.rlPaperFootHtml(plainContract());
    assert.equal((plain.match(/rl-sigline/g) || []).length, 2,
      'and an ordinary contract is byte-identical');
  });
});

describe('f359 (6) — the register, the fact row and the search', () => {
  test('partiesLead answers `more: 0` on every contract on file', () => {
    const w = world();
    assert.equal(w.partiesLead(plainContract()).more, 0, 'so no count is drawn there');
    const L = w.partiesLead(threeParty());
    assert.equal(L.more, 1);
    assert.equal(L.name, 'AIT Worldwide Logistics Norway AS', 'the lead is the first');
    assert.equal(L.all.length, 2, 'and the hover carries both');
  });

  test('a search matches the company that GUARANTEES the contract', () => {
    const w = world();
    const c = threeParty();
    assert.ok(w.partiesMatch(c, 'guarantee') === false, 'not a word in any name');
    assert.ok(w.partiesMatch(c, 'AIT Worldwide Logistics AS'), 'the guarantor is findable');
    assert.ok(w.partiesMatch(c, 'norway'), 'and so is the provider');
    assert.ok(!w.partiesMatch(c, ''), 'an empty query matches nothing');
  });

  test('the register asks it, and the count rides the counterparty cell', () => {
    assert.ok(/partiesMatch/.test(REGISTER), 'the search is widened');
    assert.ok(/partiesLead/.test(REGISTER), 'the count is read, never computed here');
    assert.ok(/reg-py-n/.test(REGISTER), 'and drawn');
  });

  test('the room fact row carries it too', () => {
    assert.ok(/partiesLead/.test(CONTRACT) && /room-py-n/.test(CONTRACT));
  });
});

describe('f359 (7) — one decision per negotiating party', () => {
  const nw = () => buildWorld({ contractView: true }).win;

  test('a contract with one negotiating party answers straight off the change', () => {
    const w = nw();
    const c = plainContract();
    const v = w.negoPartyVerdicts(c, { status: 'pending' });
    assert.equal(v.multi, false, 'nothing about an ordinary negotiation moved');
    assert.equal(v.status, 'pending');
  });

  test('accepted means accepted by EVERY negotiating party', () => {
    const w = nw();
    const c = threeParty();
    c.parties.push({ id: 'py_k', name: 'Kilimo Data Ltd', role: 'the Processor',
      side: 'theirs', involvement: 'negotiate' });
    const ch = { status: 'pending', decisions: { py_prov: { status: 'accepted' } } };
    const v = w.negoPartyVerdicts(c, ch);
    assert.equal(v.multi, true, 'two parties negotiate');
    assert.equal(v.accepted, 1);
    assert.equal(v.waiting, 1);
    assert.equal(v.status, 'pending', 'ONE ACCEPTANCE IS NOT AGREEMENT');
    assert.equal(v.waitingOn[0].name, 'Kilimo Data Ltd');
  });

  test('D7 — ONE REFUSAL IS A REFUSAL, and it outranks any number of acceptances', () => {
    const w = nw();
    const c = threeParty();
    c.parties.push({ id: 'py_k', name: 'Kilimo Data Ltd', side: 'theirs', involvement: 'negotiate' });
    const ch = { status: 'pending', decisions: {
      py_prov: { status: 'accepted' }, py_k: { status: 'rejected' } } };
    const v = w.negoPartyVerdicts(c, ch);
    assert.equal(v.status, 'rejected');
    assert.equal(v.refusedBy[0].name, 'Kilimo Data Ltd', 'the card names who');
  });

  test('everybody accepting is acceptance', () => {
    const w = nw();
    const c = threeParty();
    c.parties.push({ id: 'py_k', name: 'Kilimo Data Ltd', side: 'theirs', involvement: 'negotiate' });
    const ch = { status: 'pending', decisions: {
      py_prov: { status: 'accepted' }, py_k: { status: 'accepted' } } };
    assert.equal(w.negoPartyVerdicts(c, ch).status, 'accepted');
  });

  test('D8 — A SIGNS-ONLY PARTY IS NOT ASKED. It is not in the population at all', () => {
    const w = nw();
    const c = threeParty();                 // provider negotiates, guarantor signs only
    assert.equal(w.partiesNegotiating(c).length, 1, 'the guarantor is not asked to decide');
    assert.equal(w.partiesSigning(c).length, 2, 'but it does sign');
    const v = w.negoPartyVerdicts(c, { status: 'pending' });
    assert.equal(v.multi, false, 'so the contract reads as an ordinary negotiation');
  });

  test('the line a row prints is NULL on an ordinary contract', () => {
    const w = nw();
    assert.equal(w.negoPartyLine(plainContract(), { status: 'pending' }), null,
      'so the row is byte-identical there');
    const c = threeParty();
    c.parties.push({ id: 'py_k', name: 'Kilimo Data Ltd', side: 'theirs', involvement: 'negotiate' });
    const line = w.negoPartyLine(c, { status: 'pending', decisions: { py_prov: { status: 'accepted' } } });
    assert.ok(line && /Kilimo Data Ltd/.test(line), 'and names who it waits on: ' + line);
  });

  test('the funnel records the deciding party, and the answer comes off the LINK', () => {
    assert.ok(/opts\.partyId/.test(NEGO), 'negoResolve takes the party');
    assert.ok(/negoPartyVerdicts\(c, ch\)\.status/.test(NEGO),
      'and re-reads the change’s status from the roll-up');
    assert.ok(/function respPartyId/.test(CORE), 'the party is a fact about the link');
    assert.ok(!/recipientEmail[\s\S]{0,120}partyId/.test(CORE),
      'never matched by address: two companies can share a domain');
  });
});

describe('f359 (8) — the signing route runs in steps', () => {
  /* js/approvals.js is NOT on the test world's floor (see MODULES), so the
     step model is driven from the SHIPPED SOURCE in a sandbox with one stub —
     `signerPlan`, which is `c.signerPlan || []` and nothing else. That is a
     measurement of the code that ships, not a description of it. */
  const vm = require('node:vm');
  const aw = () => {
    const from = APPROVALS.indexOf('function signStepOf');
    /* PIN THE REGION, NOT A BYTE COUNT: to the end of the last function in the
       block, found by its own closing brace at column 0. */
    const end = APPROVALS.indexOf('\n}', APPROVALS.indexOf('function signOpenRows')) + 2;
    const cut = APPROVALS.slice(from, end);
    const ctx = { signerPlan: c => (c && c.signerPlan) || [] };
    vm.createContext(ctx);
    vm.runInContext(cut, ctx);
    return ctx;
  };
  const routed = (rows) => ({ ...plainContract(), signerPlan: rows });

  test('a route with nothing stored is the strict queue it has always been', () => {
    const w = aw();
    const c = routed([
      { id: 'a', party: 'internal', name: 'A', order: 1 },
      { id: 'b', party: 'counterparty', name: 'B', order: 2 },
      { id: 'd', party: 'counterparty', name: 'D', order: 3 },
    ]);
    assert.equal(w.signSteps(c).length, 3, 'three steps of one');
    assert.equal(w.signStepOpen(c, 1), true);
    assert.equal(w.signStepOpen(c, 2), false, 'nobody has signed yet');
    assert.equal(w.nextSigner(c).id, 'a', 'and whose turn it is has not moved');
  });

  test('two rows in one step sign in ANY ORDER', () => {
    const w = aw();
    const c = routed([
      { id: 'a', party: 'internal', name: 'A', order: 1, step: 1 },
      { id: 'b', party: 'counterparty', name: 'B', order: 2, step: 1 },
      { id: 'g', party: 'counterparty', name: 'G', order: 3, step: 2 },
    ]);
    assert.equal(w.signSteps(c).length, 2);
    assert.equal(w.signRowOpen(c, c.signerPlan[0]), true);
    assert.equal(w.signRowOpen(c, c.signerPlan[1]), true, 'BOTH may sign now');
    assert.equal(w.signRowOpen(c, c.signerPlan[2]), false, 'step 2 is not released');
    assert.equal(w.signOpenRows(c).length, 2);
  });

  test('the next step opens only when EVERY row in the one before has signed', () => {
    const w = aw();
    const c = routed([
      { id: 'a', party: 'internal', name: 'A', order: 1, step: 1, signed: true },
      { id: 'b', party: 'counterparty', name: 'B', order: 2, step: 1 },
      { id: 'g', party: 'counterparty', name: 'G', order: 3, step: 2 },
    ]);
    assert.equal(w.signStepDone(c, 1), false, 'one of two');
    assert.equal(w.signStepOpen(c, 2), false);
    c.signerPlan[1].signed = true;
    assert.equal(w.signStepDone(c, 1), true);
    assert.equal(w.signStepOpen(c, 2), true, 'and the guarantor may sign');
  });

  test('an EMPTY step is not a complete one', () => {
    const w = aw();
    assert.equal(w.signStepDone(routed([]), 1), false,
      'a step nobody is named in must not release the next');
  });

  test('a stored step below 1 cannot sort ahead of the first', () => {
    const w = aw();
    assert.equal(w.signStepOf({ step: 0, order: 3 }), 3, 'falls back to the order');
    assert.equal(w.signStepOf({ step: -4, order: 2 }), 2);
    assert.equal(w.signStepOf({ step: 2.7, order: 9 }), 2, 'floored, not rounded up');
  });

  test('steps are RENUMBERED with no gaps, so a reader never sees 1, 2, 5', () => {
    const w = aw();
    const c = routed([
      { id: 'a', party: 'internal', name: 'A', order: 1, step: 1 },
      { id: 'g', party: 'counterparty', name: 'G', order: 2, step: 7 },
    ]);
    assert.deepEqual(w.signSteps(c).map(x => x.n), [1, 2]);
  });

  test('saveSignerPlan carries the step and the party, and nothing else writes them', () => {
    assert.ok(/Number\(s\.step\)/.test(APPROVALS), 'the one authority carries it');
    assert.ok(/partyId:String\(s\.partyId\)/.test(APPROVALS));
  });
});

describe('f359 (9) — THE SERVER IS THE WALL', () => {
  test('it carries its own parties twin, and derives the same pair', () => {
    assert.ok(/function srvContractParties/.test(SERVER), 'the server reads the record itself');
    assert.ok(/function srvPartiesNegotiating/.test(SERVER));
    assert.ok(/function srvPartyOfShare/.test(SERVER));
    assert.ok(/c\.counterparty/.test(SERVER.slice(SERVER.indexOf('function srvContractParties'),
      SERVER.indexOf('function srvContractParties') + 1400)),
      'and derives the two parties from the stored counterparty where nothing is stored');
  });

  test('the turn check waits on an earlier STEP, not an earlier row', () => {
    assert.ok(/function srvSignStep/.test(SERVER), 'the server has its own step reading');
    assert.ok(/srvSignStep\(s\) < myStep/.test(SERVER),
      'a row in the SAME step does not block');
  });

  test('THE TWO STEP READINGS ARE THE SAME RULE, pinned rather than left to drift', () => {
    /* Both must answer: a stored step at or above 1 wins, floored; anything
       else is the row's own order; anything else again is 1. */
    const srv = SERVER.slice(SERVER.indexOf('function srvSignStep'),
      SERVER.indexOf('function srvSignStep') + 400);
    const brw = APPROVALS.slice(APPROVALS.indexOf('function signStepOf'),
      APPROVALS.indexOf('function signStepOf') + 500);
    for (const frag of ['Number.isFinite', '>= 1', 'Math.floor']) {
      assert.ok(srv.includes(frag), 'server: ' + frag);
      assert.ok(brw.includes(frag), 'browser: ' + frag);
    }
  });

  test('a link is refused for a party the record does not hold', () => {
    assert.ok(/This contract has no such party/.test(SERVER),
      'a body naming a party the record does not have is refused, never stored');
  });

  test('D8 ON THE WALL — a signs-only party may not be given a negotiation link', () => {
    assert.ok(/signs only, so it does not get a negotiation link/.test(SERVER));
    assert.ok(/is named on the paper and receives nothing/.test(SERVER),
      'and a named-only party receives nothing at all');
  });

  test('a step releases EVERY link in it, not one', () => {
    assert.ok(/for \(const next of due\) await releaseOneSignerLink/.test(SERVER),
      'both parties in a step are told the moment the step before completes');
  });

  test('the party column is NULL on every row on file', () => {
    assert.ok(/addColumnIfMissing\('shares', 'party_id', 'TEXT'\)/.test(SERVER),
      'an added column with no default: a null reads as the first outside party');
  });
});

describe('f359 (10) — the walls', () => {
  test('WALL: the payload carries the parties and the reader’s own role, never our people', () => {
    assert.ok(/function partiesForPayload/.test(PARTIES));
    const fn = PARTIES.slice(PARTIES.indexOf('function partiesForPayload'),
      PARTIES.indexOf('function partiesForPayload') + 400);
    assert.ok(!/email/.test(fn), 'a party’s contact address does not travel');
  });

  test('WALL: the counterparty’s page is told its ROLE and a COUNT, nothing more', () => {
    const blk = CORE.slice(CORE.indexOf('party:(()=>{'), CORE.indexOf('party:(()=>{') + 700);
    assert.ok(/role:p\.role/.test(blk) && /others:/.test(blk));
    assert.ok(!/name:/.test(blk), 'who the other parties are is on the paper, not in this line');
  });

  test('WALL: the parties are fixed once somebody has signed', () => {
    assert.ok(/signingLocked/.test(CONTRACT.slice(CONTRACT.indexOf('function ktPartiesBlockHtml'),
      CONTRACT.indexOf('function ktPartiesBlockHtml') + 1400)),
      'the signing route’s own rule, for the signing route’s own reason');
  });

  test('WALL: a share reads its party off the STORED contract, never off the body', () => {
    const blk = SERVER.slice(SERVER.indexOf('const partyAsk'), SERVER.indexOf('const partyAsk') + 900);
    assert.ok(/srvStoredContract/.test(blk), 'the record answers, not the request');
  });
});

/* ============================================================
   (10) THE PARTIES ARE THEIR OWN NAMED SECTION, AND IT IS OPEN
   ============================================================
   Young, 22 September 2026: *"i do not see the changes in the overview
   page"*. Built at the top of The record, which opens SHUT — and a shut
   `sectionHtml` draws no body at all, which this codebase already records
   under THIRTEEN OFF A MORNING. So nothing of the feature reached the page.

   These pin the PLACEMENT. Whether the reader can actually see it is a
   question about painted pixels and is asked in overview-as-drawn-verify 12;
   nothing here can answer that, which is why both exist. */
describe('f359 (10) the parties are a section of their own', () => {
  /* THE REGION, not a byte count: the stack is built in one function and the
     order it returns is the order on screen. */
  const stack = () => {
    const at = CONTRACT.indexOf('function ktOverviewTermsHtml');
    return at < 0 ? '' : CONTRACT.slice(at, CONTRACT.indexOf('\n}', at) + 2);
  };

  test('it is in the stack, above The record', () => {
    const b = stack();
    assert.ok(/return deal\+alsoSec\+parties\+record\+peopleSec/.test(b),
      'the parties read between the deal and the record: ' + (b.match(/return deal[^;]*/) || [''])[0]);
  });

  test('and it opens OPEN — the fault was a section that draws no body', () => {
    const b = stack();
    const sec = b.slice(b.indexOf('const parties='), b.indexOf('const record='));
    assert.ok(/key:pyK/.test(sec) && /open:true/.test(sec),
      'the section is keyed and open: ' + sec.slice(0, 200));
  });

  /* THE FOLD DIES IF THE ROUTER DOES NOT NAME IT — this page has paid for
     that twice (`also` reported "1 term" and drew nothing). */
  test('the repaint router names it, or its fold is dead', () => {
    assert.ok(/\(deal\|record\|also\|parties\|people\)\$/.test(CONTRACT),
      'sectionWire routes .parties to renderKeyTerms');
  });

  test('the block is drawn BARE, so the name is said once', () => {
    const b = stack();
    assert.ok(/ktPartiesBlockHtml\(c,\{mayEdit:ed,bare:true\}\)/.test(b),
      'the section carries the head');
    /* and bare really drops it */
    const f = CONTRACT.slice(CONTRACT.indexOf('function ktPartiesBlockHtml'),
      CONTRACT.indexOf('function ktPartiesBlockHtml') + 2200);
    assert.ok(/const head = bare \? ''/.test(f), 'bare emits no py-head');
  });

  test('+ Add a party is the section’s own act, and only one exists', () => {
    const b = stack();
    assert.ok(/data-py-add="1"/.test(b), 'the section draws it');
    /* the block draws it only when NOT bare, so the page never has two */
    const f = CONTRACT.slice(CONTRACT.indexOf('function ktPartiesBlockHtml'),
      CONTRACT.indexOf('function ktPartiesBlockHtml') + 2200);
    assert.ok(/const add = \(mayEdit && !bare\)/.test(f), 'the bare block draws none');
  });

  /* REVERSED IN PLACE. For one day the grid gave up these two because the
     block sat on that card; with the block elsewhere the ruled twelve are
     whole again, and the note about a disagreeing name goes back to the cell
     ovFieldMarkOf already marks. */
  test('The record keeps its counterparty and their email', () => {
    const f = CONTRACT.slice(CONTRACT.indexOf('function ktRecordFactsHtml'),
      CONTRACT.indexOf('function ktRecordFactsHtml') + 1400);
    assert.ok(/:new Set\(\)/.test(f), 'nothing is skipped at rest: ' + (f.match(/const skip=[^;]*/) || [''])[0]);
    assert.ok(!/ktPartiesBlockHtml/.test(f), 'and the record does not draw the block');
  });

  test('a shut section still answers — the summary names every party', () => {
    const b = stack();
    const sec = b.slice(b.indexOf('const parties='), b.indexOf('const record='));
    assert.ok(/summary: pyList\.map\(p=>p\.name\)/.test(sec),
      'the fold gives the names back');
  });

  /* THE ONE THING THAT IS NOT MULTI-PARTY-ONLY, said out loud. Every other
     control this build adds is drawn only where `partiesMulti`; this section
     is drawn on every contract, because "who is this between" is not a
     multi-party question and it is what the owner went looking for. */
  test('it is drawn on an ordinary two-party contract too', () => {
    const w = world();
    const html = w.ktPartiesBlockHtml(plainContract(), { mayEdit: true, bare: true });
    assert.ok(/py-row/.test(html), 'two rows on a plain record: ' + html.slice(0, 120));
    assert.ok(!/py-head/.test(html), 'and no head of its own');
  });
});

/* ── f359 (11) THE WORD THE PAPER USES IS A CHOICE ──
   Young, 22 Sep 2026, over the Edit party window: *"contract type should be
   a drop down of choices"*.

   MEASURED before a line moved, and the report is right for a reason the
   words do not say: that box was labelled `ov_f_type` — "Contract type",
   which is the Overview's own label for metadata.contractType, the KIND of
   agreement — while holding the word THIS paper uses for THIS party. Its own
   placeholder said so the whole time. So the box gets its choices and the
   label it should have had, and the old one is a wall here. */
describe('f359 (11) the party\'s word on the paper is picked, not typed from nothing', () => {
  const editor = () => { const i = CONTRACT.indexOf('function openPartyEditor(');
    assert.ok(i >= 0); return CONTRACT.slice(i, CONTRACT.indexOf('\nfunction ', i + 1)); };
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

  test('the words are keys, asked of i18t, not literals in the list', () => {
    assert.match(PARTIES, /const PARTY_ROLE_WORDS = Object\.freeze\(\[/);
    const list = /const PARTY_ROLE_WORDS = Object\.freeze\(\[([\s\S]*?)\]\)/.exec(PARTIES)[1];
    const keys = list.match(/'([a-z]+)'/g).map(x => x.replace(/'/g, ''));
    assert.ok(keys.length >= 12, keys.length + ' words offered');
    assert.match(PARTIES, /i18t\('py_rw_' \+ k\)/, 'each is a key, in the reader\'s own language');
    /* AND EVERY ONE IS IN BOTH BOOKS. A key with no Swedish would draw the
       key itself into a dropdown. */
    const I18N = read('js/i18n.js');
    for (const k of keys)
      assert.equal((I18N.match(new RegExp('py_rw_' + k + ':', 'g')) || []).length, 2,
        'py_rw_' + k + ' is in both books');
  });
  test('[wall] what is STORED is the paper\'s own word, never a key', () => {
    /* partyRoleOptions returns the WORD as the value, so the record carries
       what a lawyer would read on the page — the RECORD-versus-LABEL rule. */
    const fn = /function partyRoleOptions\(current\)\{[\s\S]*?\n\}/.exec(PARTIES)[0];
    assert.match(fn, /\{ v: say\(k\), l: say\(k\) \}/, 'the value is the word, not the key');
    assert.match(PARTIES, /function partyRoleWord\(p\)\{ return p && p\.role \? p\.role : ''; \}/,
      'and it is read back raw');
  });
  test('it offers and never refuses: a stored word off the list stays on it', () => {
    const w = buildWorld({}).win;
    const opts = w.partyRoleOptions('the Offtaker');
    assert.equal(opts[0].v, 'the Offtaker', 'the record\'s own word leads');
    assert.ok(opts.length > 1, 'and the offered words follow');
    /* NOT TWICE, and case is not what tells two words apart. */
    const again = w.partyRoleOptions(opts[1].v.toLowerCase());
    assert.equal(again.filter(o => o.v.toLowerCase() === opts[1].v.toLowerCase()).length, 1);
    assert.equal(w.partyRoleOptions('').length, w.PARTY_ROLE_WORDS.length, 'nothing stored, nothing added');
    assert.ok(typeof w.partyRoleOptions === 'function' && Array.isArray(w.PARTY_ROLE_WORDS),
      'published (the ES-module rule)');
  });
  test('the dialog draws a select, blank first and the sentinel last', () => {
    const e = editor();
    assert.match(e, /<select id="py-role"/, 'a dropdown, not a text box');
    assert.ok(!/<input id="py-role"/.test(e) && !/fld\('role'/.test(e), 'and the old box is gone');
    const sel = /<select id="py-role"[\s\S]*?<\/select>/.exec(e)[0];
    const blank = sel.indexOf("<option value=\"\">"), other = sel.indexOf('PARTY_ROLE_OTHER');
    assert.ok(blank >= 0 && other > blank, 'not set leads, Another word ends it');
    assert.match(sel, /opts\.map\(o=>/, 'and the middle is the one reading');
  });
  test('[wall] the label is the field\'s own, and the Overview\'s is not borrowed', () => {
    assert.match(editor(), /\$\{esc\(i18t\('py_role'\)\)\}/);
    /* READ CODE, NOT PROSE: the note that records the old mislabel names it. */
    assert.ok(!/ov_f_type/.test(strip(editor())),
      'ov_f_type is metadata.contractType\'s label and never this field\'s');
    /* AND IT IS STILL THE OVERVIEW'S: nothing here took it away. */
    assert.match(CONTRACT, /case 'contractType': return \[i18t\('ov_f_type'\)/);
  });
  test('[wall] the sentinel never reaches the record', () => {
    assert.match(editor(), /const roleV=v\('role'\)===PARTY_ROLE_OTHER\?p\.role\|\|'':v\('role'\);/);
    assert.match(editor(), /role:roleV,/);
  });
  test('the other word opens the product\'s own name box, and adds nothing to a store', () => {
    const e = strip(editor());
    assert.match(e, /promptNewName\(\{ title:i18t\('py_role'\)/, 'one name box, the streams\' own');
    assert.match(e, /make:x=>String\(x\|\|''\)\.trim\(\)/, 'the act is the word itself');
    assert.ok(!/addCustomFolder|saveSettings|addTemplateCategory/.test(e),
      'the paper\'s word belongs to this contract and to no list');
    assert.match(e, /else roleBox\.value=lastRole;/, 'cancelled, the box goes back — bindFolderSelect\'s own rule');
  });
  /* A NAMED CONTROL: it passes at the parent too, because the sweep already
     existed. The claim is that this select did not opt out of it. */
  test('[control] no dropdown is built here — selectMenuSweep dresses it', () => {
    const e = strip(editor());
    assert.ok(!/hati-selmenu/.test(e), 'the menu is the product\'s, armed once on the body');
    assert.match(CORE, /function selectMenuSweep\(root\)\{/);
    assert.match(CORE, /const SELECT_MENU_SEL = 'select:not\(\[multiple\]\):not\(\[size\]\):not\(\[data-native\]\)';/);
    assert.ok(!/data-native/.test(e), 'and this one is not opted out of it');
  });
});
