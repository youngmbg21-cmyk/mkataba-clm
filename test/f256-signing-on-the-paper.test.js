/* f256 — SIGNING ON THE PAPER (owner-asked 29 Aug 2026, J-1)
   ========================================================================
   *"while in document tab, you can enter signature on the contract ... you
   will be navigated to the spaces where you can sign your name just like
   docusign at final stage you will be directed to the signature block to sign
   officially."*

   THE RULE EVERYTHING RESTS ON, in the work order's own words:
   **putting a mark on the paper is not signing. The contract is executed by
   one press, in one place.** Almost every claim below is a way of failing
   that rule, because that is where the harm is: a feature that draws
   signatures on a contract and quietly half-executes it is worse than no
   feature at all.

   WHAT IS PINNED HERE:
     1  a mark is not a signature — c.signatures, the status and the seal are
        all untouched, asserted DIRECTLY rather than inferred
     2  a mark does not freeze the wording
     3  a mark does not travel to the counterparty before execution
     4  every blocker that refused before still refuses, in the same words
     5  a spot that is not yours cannot be filled from this seat
     6  the walk reads the reader's own spots, in document order, and its last
        press lands on the block that signs
     7  the anchor is a clause id and never a character offset
     8  D-4 delivered where it can be: the marks freeze at execution
     9  both languages

   WHAT DRAWS is the browser file's: the pixels above the wording, the spot on
   the sheet, the walk pressed for real, and the counterparty's page proved
   unmoved. The two files name each other. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const ROOM_SRC = read('js/views/contract.js');
const ROOM = strip(ROOM_SRC);
const SERVER = strip(read('server/server.js'));
const CORE = strip(read('js/core.js'));
const RICH = strip(read('js/richdoc.js'));
const I18N = read('js/i18n.js');
const CSS = read('index.html');

/* A contract with real wording, real clause ids and a real signing route.
   The wording asks for a signature in its last clause, which is what makes the
   proposal half of D-1 checkable rather than described. */
const BODY = [
  '<h2 data-clause-id="cl_aaaa1111">1. Term</h2>',
  '<p>This agreement runs for twelve months from the Effective Date.</p>',
  '<h2 data-clause-id="cl_bbbb2222">2. Charges</h2>',
  '<p>The Buyer shall pay within thirty (30) days of invoice.</p>',
  '<h2 data-clause-id="cl_cccc3333">3. Execution</h2>',
  '<p>SIGNED for and on behalf of the parties by their duly authorised representatives.</p>',
].join('');

function bench(over){
  const w = buildWorld({ contractView: true });
  const win = w.win;
  const roster = [
    { id: 'u1', name: 'Wanjiku Kamau', email: 'wanjiku@hati.test', role: 'admin' },
    { id: 'u2', name: 'Otieno Were',   email: 'otieno@hati.test',  role: 'editor' },
  ];
  const c = supplyContract(Object.assign({
    id: 'MK-SP-1', status: 'Under Review', format: 'rich', redlineText: BODY,
    signatures: [],
    signerPlan: [
      { id: 'r1', name: 'Wanjiku Kamau', party: 'internal', memberId: 'u1', email: 'wanjiku@hati.test' },
      { id: 'r2', name: 'Naivas Supermarkets', party: 'counterparty', email: 'legal@naivas.test' },
    ],
  }, over || {}));
  win.state = Object.assign(win.state || {}, { contracts: [c], activeId: c.id });
  win.getUsers = () => roster;
  win.currentUser = () => roster[0];
  win.canEdit = () => true;
  /* signerPlan lives in js/approvals.js, which this stage does not load. The
     stub is the record's own rows and nothing else, which is exactly what that
     function returns for a contract carrying a plan. */
  win.signerPlan = ct => (ct && ct.signerPlan) || [];
  win.persist = () => {};
  win.logAudit = () => {};
  win.toast = () => {};
  return { w, win, c };
}

/* ============================ 1 — A MARK IS NOT A SIGNATURE */
describe('f256 (1) — putting a mark on the paper is not signing', () => {
  test('placing and filling a spot leaves c.signatures, the status and the seal alone', () => {
    const { win, c } = bench();
    win.captureSignature = async () => ({ image: 'data:image/png;base64,AAAA', form: 'drawn' });
    const before = { sigs: JSON.stringify(c.signatures), status: c.status,
      hash: c.hash, exec: JSON.stringify(c.execution || null), signedAt: c.signedAt };
    const s = win.signSpotAdd(c, 'cl_cccc3333', 'r1', 'signature');
    assert.ok(s && s.id, 'the spot is placed');
    assert.equal(JSON.stringify(c.signatures), before.sigs, 'c.signatures untouched');
    assert.equal(c.status, before.status, 'the status has not moved');
    assert.equal(c.hash, before.hash, 'no seal');
    assert.equal(JSON.stringify(c.execution || null), before.exec, 'no execution stamp');
    assert.equal(c.signedAt, before.signedAt, 'no signing date');
    /* AND THE PLAN ROW IS NOT MARKED SIGNED — the other of the two signature
       stores, and the one a browser-side mark could most plausibly leak into. */
    assert.ok(!c.signerPlan.some(r => r.signed), 'no plan row reads as signed');
  });

  test('and neither does FILLING one — the mark lands on the spot and nowhere else', async () => {
    const { win, c } = bench();
    win.captureSignature = async () => ({ image: 'data:image/png;base64,AAAA', form: 'drawn' });
    const s = win.signSpotAdd(c, 'cl_cccc3333', 'r1', 'signature');
    await win.signSpotFill(c, s.id);
    assert.ok(c.signSpots[0].image, 'the mark is on the spot');
    assert.equal(c.signatures.length, 0, 'and not in c.signatures');
    assert.equal(c.status, 'Under Review');
    assert.ok(!c.signerPlan.some(r => r.signed));
  });

  test('THE ACTS NEVER REACH THE THINGS THAT EXECUTE', () => {
    /* A grep, because the harm is a path that exists rather than one that is
       taken today: this feature must never grow a second way to sign. The
       region is the J-1 block alone — the rest of this file is the signing
       screen and legitimately calls all of these. */
    const m = ROOM.match(/function signSpots\(c\)\{[\s\S]*?function signBlockers\(c\)\{/);
    assert.ok(m, 'the J-1 block is findable');
    const block = m[0];
    ['finalizeExecution', 'signDocument', 'c.signatures.push', 'signatures.push',
     "status='Signed'", 'sealString', 'negoFileChange'].forEach(bad => {
      assert.ok(!block.includes(bad), `the spot acts must not call ${bad}`);
    });
  });
});

/* ============================ 2 — THE WORDING DOES NOT FREEZE */
describe('f256 (2) — a draft mark does not freeze the wording', () => {
  test('c.signSpots is neither of the two stores the freeze reads', () => {
    /* negoAnySignature (browser) and anySignatureRow (server) read
       c.signatures and the plan rows. A draft mark written into either would
       silently freeze the wording of a contract nobody has signed. */
    assert.ok(!/anySignatureRow[\s\S]{0,400}signSpots/.test(SERVER),
      'the server-side reading does not look at signSpots');
    const neg = strip(read('js/negotiation.js'));
    const m = neg.match(/const negoAnySignature[\s\S]{0,400}/);
    if(m) assert.ok(!m[0].includes('signSpots'),
      'and neither does the browser-side one');
  });

  test('SIGNED_WORDING_FROZEN does not carry it', () => {
    const m = SERVER.match(/const SIGNED_WORDING_FROZEN = \[[^\]]*\]/);
    assert.ok(m, 'the list is findable');
    assert.ok(!m[0].includes('signSpots'),
      'freezing the wording is about the words, not about who has marked them');
  });
});

/* ============================ 3 — IT DOES NOT TRAVEL */
describe('f256 (3) — a mark is absent from the share payload', () => {
  test('the payload is an ALLOW-LIST and signSpots is not on it', () => {
    /* The strongest form of this claim: not "it is stripped" — which tests the
       words somebody thought of — but that the contract object is BUILT from
       named keys, so a new field cannot travel by accident. It is the same
       reasoning the webhook payload's own allow-list is written under. */
    const m = CORE.match(/return \{ v:1, kind:'hati-share'[\s\S]*?\n  \};/);
    assert.ok(m, 'the payload builder is findable');
    assert.ok(!m[0].includes('signSpots'),
      'a mark placed before execution never reaches the other side');
  });
});

/* ============================ 4 — THE REFUSALS ARE UNCHANGED */
describe('f256 (4) — every blocker that refused before still refuses', () => {
  test('signSpotBlocker JOINS the one list rather than being a second gate', () => {
    assert.match(ROOM, /signSpotBlocker\(c\)/, 'it is asked');
    const m = ROOM.match(/function signBlockers\(c\)\{[\s\S]*?\n\}/);
    assert.ok(m && m[0].includes('signSpotBlocker'),
      'inside signBlockers — the ONE list both the button and the refusal read');
  });

  test('the six existing blockers still have their keys and their words', () => {
    const { win, c } = bench();
    const m = ROOM.match(/function signBlockers\(c\)\{[\s\S]*?\n\}/)[0];
    /* Read off the source rather than typed from memory: these are the five
       the list has carried since the desk and the review gate came OFF it on
       12 Aug 2026, and this claim's job is that J-1 added a sixth without
       disturbing any of them. */
    ['consent', 'approval', 'turn', 'negotiation', 'fields'].forEach(k => {
      assert.ok(new RegExp(`add\\('${k}'`).test(m),
        `the ${k} blocker is still on the list`);
    });
    /* And it refuses for the reason it always did: a contract with no consent
       tick is refused with the consent blocker FIRST, exactly as before. */
    const out = win.signBlockers(c);
    assert.equal(out[0].key, 'consent', 'intent still leads');
  });

  test('a spot waiting on the OTHER SIDE is not a reason this reader cannot sign', () => {
    const { win, c } = bench();
    win.signSpotAdd(c, 'cl_cccc3333', 'r2', 'signature');   // the counterparty's
    assert.equal(win.signSpotBlocker(c), null,
      'their empty spot is their business');
    win.signSpotAdd(c, 'cl_bbbb2222', 'r1', 'initials');    // and now one of mine
    const b = win.signSpotBlocker(c);
    assert.ok(b && b.key === 'spots', 'mine is a refusal');
    assert.match(b.label, /1 place/, 'and it says how many, in the singular');
  });
});

/* ============================ 5 — WHOSE SPOT IS IT */
describe('f256 (5) — a spot that is not yours cannot be filled from this seat', () => {
  test('signSpotFill refuses it in words and writes nothing', async () => {
    const { win, c } = bench();
    let said = null;
    win.toast = (m, k) => { said = { m, k }; };
    win.captureSignature = async () => { throw new Error('the picker must never open'); };
    const s = win.signSpotAdd(c, 'cl_cccc3333', 'r2', 'signature');
    const out = await win.signSpotFill(c, s.id);
    assert.equal(out, null, 'refused');
    assert.ok(!c.signSpots[0].image, 'and nothing was written');
    assert.ok(said && said.k === 'err', 'and it said so');
  });

  test('and it is drawn — read-only, never a disabled control', () => {
    const { win, c } = bench();
    win.signSpotAdd(c, 'cl_cccc3333', 'r2', 'signature');
    const html = win.signSpotHtml(c, c.signSpots[0], false);
    assert.match(html, /is-theirs/, 'drawn, so you can see what they must do');
    assert.ok(!/<button/.test(html),
      'a control nobody in this chair can press is not a control — a reader '
      + 'met with a dead button blames themselves');
  });

  test('signSpotSeat matches the member record first and the address second', () => {
    const { win, c } = bench();
    const seat = win.signSpotSeat(c);
    assert.ok(seat && seat.id === 'r1', 'the internal row that is me');
    /* A counterparty row is NEVER this reader, even where the address matches:
       their signature arrives down their own link. */
    c.signerPlan.push({ id: 'r3', name: 'Wanjiku Kamau', party: 'counterparty',
      email: 'wanjiku@hati.test' });
    assert.equal(win.signSpotSeat(c).id, 'r1', 'still the internal row');
  });
});

/* ============================ 6 — THE WALK */
describe('f256 (6) — the walk reads this reader’s own spots, in document order', () => {
  test('it counts MINE and never theirs', () => {
    const { win, c } = bench();
    win.signSpotAdd(c, 'cl_aaaa1111', 'r1', 'signature');
    win.signSpotAdd(c, 'cl_bbbb2222', 'r2', 'signature');
    win.signSpotAdd(c, 'cl_cccc3333', 'r1', 'initials');
    assert.equal(win.signSpotsMine(c).length, 2);
    assert.equal(win.signSpotsLeft(c).length, 2);
    assert.equal(win.signWalkNext(c).clauseId, 'cl_aaaa1111', 'the first of mine');
  });

  test('a filled spot drops out of what is left', async () => {
    const { win, c } = bench();
    win.captureSignature = async () => ({ image: 'data:image/png;base64,AAAA', form: 'drawn' });
    win.signSpotAdd(c, 'cl_aaaa1111', 'r1', 'signature');
    win.signSpotAdd(c, 'cl_cccc3333', 'r1', 'initials');
    await win.signSpotFill(c, c.signSpots[0].id);
    assert.equal(win.signSpotsLeft(c).length, 1);
    assert.equal(win.signWalkNext(c).clauseId, 'cl_cccc3333');
  });

  test('with none left the walk names the block that signs, not a place on the paper', async () => {
    const { win, c } = bench();
    win.captureSignature = async () => ({ image: 'data:image/png;base64,AAAA', form: 'drawn' });
    win.signSpotAdd(c, 'cl_aaaa1111', 'r1', 'signature');
    await win.signSpotFill(c, c.signSpots[0].id);
    assert.equal(win.signWalkNext(c), null);
    /* The words change with the state, so the control cannot promise a place
       that is not there. */
    const m = ROOM.match(/function signWalkHtml\(c\)\{[\s\S]*?\n\}/)[0];
    assert.match(m, /ct_walk_done/, 'it says so');
  });

  test('IT IS IN THE TAB ROW’S OWN SLOT AND NEVER FLOATS', () => {
    const m = ROOM.match(/function wsTabRowEndHtml\(c\)\{[\s\S]*?\n\}/)[0];
    assert.match(m, /_wsTab==='sign'[\s\S]{0,80}signWalkHtml/,
      'drawn in the in-flow strip the standing rule allows');
    const w = ROOM.match(/function signWalkHtml\(c\)\{[\s\S]*?\n\}/)[0];
    assert.ok(!/position:\s*fixed|position:\s*absolute/.test(w),
      'NOTHING FLOATS OVER THE PAGE');
  });
});

/* ============================ 7 — THE ANCHOR */
describe('f256 (7) — the anchor is a clause id, never an offset (D-1)', () => {
  test('a spot carries clauseId and no character position at all', () => {
    const { win, c } = bench();
    const s = win.signSpotAdd(c, 'cl_bbbb2222', 'r1', 'signature');
    assert.equal(s.clauseId, 'cl_bbbb2222');
    ['offset', 'start', 'end', 'index', 'pos', 'char'].forEach(k =>
      assert.equal(s[k], undefined, `a spot must not carry ${k} — it would not `
        + 'survive the first edit to the wording'));
  });

  test('the id the paper is addressed by is the id the sanitiser keeps', () => {
    /* This is what makes D-1 true rather than aspirational: the anchor has to
       be the SAME id a change is filed against, and that id only survives
       because richdoc admits it by name. */
    assert.match(RICH, /RICH_CLAUSE_ATTR = 'data-clause-id'/);
    const m = ROOM.match(/function signSpotBlockFor\([\s\S]*?\n\}/)[0];
    assert.match(m, /RICH_CLAUSE_ATTR/,
      'the paint resolves the spot through that one attribute');
  });

  test('WHERE THERE IS NOTHING TO ANCHOR TO, NOTHING IS OFFERED', () => {
    const { win, c } = bench({ redlineText: '' });
    assert.equal(win.signSpotClauses(c), null, 'no working text, no clauses');
    /* .length, not deepEqual: the stage is another realm and a foreign Array
       does not pass a strict deep-equal against one of ours. */
    assert.equal(win.signSpotProposals(c).length, 0,
      'a verb that cannot work is not drawn');
  });

  test('HaTi proposes where the wording asks, and only there', () => {
    const { win, c } = bench();
    const props = win.signSpotProposals(c);
    assert.equal(props.length, 1, 'one clause asks for a mark');
    assert.equal(props[0].clauseId, 'cl_cccc3333', 'the execution clause');
    /* THE CUE IS NARROW ON PURPOSE. A loose one puts a signature box in the
       middle of an indemnity, which is worse than missing one. */
    assert.ok(!win.SIGN_SPOT_CUE.test('The Supplier shall sign the delivery note.'),
      '"sign" alone is ordinary contract language');
    assert.ok(!win.SIGN_SPOT_CUE.test('Each party designates a signatory.'));
    assert.ok(win.SIGN_SPOT_CUE.test('IN WITNESS WHEREOF the parties have executed'));
    assert.ok(win.SIGN_SPOT_CUE.test('Signature: ______'));
  });

  test('a clause that already carries a spot is not proposed again', () => {
    const { win, c } = bench();
    win.signSpotAdd(c, 'cl_cccc3333', 'r1', 'signature');
    assert.equal(win.signSpotProposals(c).length, 0);
  });
});

/* ============================ 8 — D-4, AND THE DEPARTURE */
describe('f256 (8) — the marks freeze at execution (D-4, as delivered)', () => {
  test('signSpots is on EXECUTED_IMMUTABLE', () => {
    const m = SERVER.match(/const EXECUTED_IMMUTABLE = \[[\s\S]*?\n\];/);
    assert.ok(m, 'the list is findable');
    assert.match(m[0], /'signSpots'/,
      'a sealed record’s marks are the marks it was sealed with');
  });

  test('THE DEPARTURE IS RECORDED, and the reason is checkable', () => {
    /* D-4 asked for the image to be baked into the sealed HTML. It is not, and
       the reason is a fact about this codebase rather than an opinion: the
       document allow-list has no IMG tag at all and refuses href by design, so
       baking one in means admitting an arbitrary URL into stored markup on
       every contract in the workspace. THAT is what this asserts — if IMG ever
       joins the allow-list this test fails and somebody re-reads the decision. */
    const tags = RICH.match(/const RICH_TAGS = new Set\(\[[\s\S]*?\]\)/)[0];
    assert.ok(!/'IMG'/.test(tags),
      'no images in a contract’s stored markup');
    assert.ok(!/'A'/.test(tags) && !/href/.test(RICH.match(/const RICH_ATTRS = \{[\s\S]*?\};/)[0]),
      'and no links either — the same boundary');
    const md = read('CLAUDE.md');
    assert.match(md, /SIGNING ON THE PAPER/,
      'and the rulebook carries the departure where the next reader will meet it');
  });

  test('an executed contract offers no placement act at all', async () => {
    const { win, c } = bench({ status: 'Signed' });
    let said = null;
    win.toast = (m, k) => { said = { m, k }; };
    assert.equal(win.signSpotAdd(c, 'cl_cccc3333', 'r1', 'signature'), null);
    assert.ok(said && said.k === 'err');
    assert.equal(win.signSpotRemove(c, 'x'), false);
    assert.equal(await win.signSpotFill(c, 'x'), null);
  });

  test('and neither does a VIEWER', async () => {
    const { win, c } = bench();
    win.canEdit = () => false;
    assert.equal(win.signSpotAdd(c, 'cl_cccc3333', 'r1', 'signature'), null);
    assert.equal(await win.signSpotFill(c, 'x'), null);
  });
});

/* ============================ 9 — THE COLUMN, AND THE WORDS */
describe('f256 (9) — one card, one measure, and both languages', () => {
  test('the places card draws NOTHING where there is nothing to say', () => {
    const { win, c } = bench({ redlineText: '<p>Nothing here asks for a mark.</p>' });
    assert.equal(win.signSpotsCardHtml(c, { CARD: '', H: '', may: true }), '',
      'a third card describing an empty list is furniture');
  });

  test('and it lists the spots and the proposals when there are some', () => {
    const { win, c } = bench();
    win.signSpotAdd(c, 'cl_aaaa1111', 'r1', 'signature');
    const html = win.signSpotsCardHtml(c, { CARD: '', H: '', may: true });
    assert.match(html, /data-sp-del=/, 'a placed spot can be taken away');
    assert.match(html, /data-sp-add=/, 'and a proposal can be added');
    assert.match(html, /data-sp-who=/, 'the signer is chosen, never guessed');
  });

  test('with nobody on the signing order it says so rather than drawing an empty picker', () => {
    const { win, c } = bench({ signerPlan: [] });
    const html = win.signSpotsCardHtml(c, { CARD: '', H: '', may: true });
    assert.match(html, /ct_spots_no_signers|belong to somebody/,
      'a refusal carries its way forward');
    assert.ok(!/data-sp-add=/.test(html), 'and no dead Add');
  });

  test('a VIEWER sees the list and is offered no placement act', () => {
    const { win, c } = bench();
    win.signSpotAdd(c, 'cl_aaaa1111', 'r1', 'signature');
    const html = win.signSpotsCardHtml(c, { CARD: '', H: '', may: false });
    assert.match(html, /ct_spot_signature|Signature/, 'the list still draws');
    assert.ok(!/data-sp-del=|data-sp-add=/.test(html), 'and nothing to press');
  });

  test('every key this feature draws exists in BOTH languages', () => {
    const keys = ['ct_spot_signature','ct_spot_initials','ct_spot_fill','ct_spot_replace',
      'ct_spot_theirs','ct_spot_not_yours','ct_spot_no_anchor','ct_walk','ct_walk_title',
      'ct_walk_done','ct_walk_done_title','ct_spots_head','ct_spots_marked','ct_spot_marked',
      'ct_spot_waiting','ct_spot_add','ct_spot_remove_title','ct_spots_no_signers'];
    keys.forEach(k => {
      const n = (I18N.match(new RegExp(`^\\s*${k}:`, 'gm')) || []).length;
      assert.equal(n, 2, `${k} must be in English and Swedish`);
    });
    ['ct_spots_left','ct_spots_left_short','ct_spots_found'].forEach(k => {
      ['_one','_other'].forEach(sfx => {
        const n = (I18N.match(new RegExp(`^\\s*${k}${sfx}:`, 'gm')) || []).length;
        assert.equal(n, 2, `${k}${sfx} must be in English and Swedish`);
      });
    });
  });

  test('the mark follows the reader’s own text size, like the paper it sits on', () => {
    /* The lesson this page has learned four times: the paper scales, the
       furniture does not — and a mark ON the paper is paper. */
    const m = CSS.match(/\.sig-spot\{[\s\S]*?\.sig-spot-cap\{[^}]*\}/)[0];
    assert.match(m, /var\(--doc-scale,1\)/,
      'every size on the mark is a calc against the document scale');
  });

  test('and it takes the signature block’s own grammar rather than a second one', () => {
    const m = CSS.match(/\.sig-spot\{[^}]*\}/)[0];
    assert.match(m, /dashed/, 'dashed while it waits');
    assert.match(CSS, /\.sig-spot\.is-filled\{[^}]*solid/, 'solid once a mark lands');
  });
});
