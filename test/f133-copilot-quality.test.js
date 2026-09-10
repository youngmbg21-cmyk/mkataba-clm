/* f133 — the Copilot quality pass (work order: copilot-quality)
   ============================================================
   Two quality gaps, one theme: the questions where a wrong nuance costs the
   customer most were being answered by the cheap tier, or not answered at all.

   F-A  DEEP-TIER ESCALATION. The chat loop runs on the fast tier — right for
        routing and plain reads, wrong for "which contract is more favorable
        and why". Once compare_contracts has run in a turn, every subsequent
        loop iteration (above all the final synthesis) runs on the deep tier.
        A turn that never compares stays fast end to end.

   F-B  THE PLAYBOOK REACHES THE CHAT. /api/ai/playbook already reviews a
        document against the workspace playbook on the deep tier — but Copilot
        had no tool for it, so "does this NDA match our standard positions?"
        got a generic answer. check_against_playbook now resolves the contract
        (scoped), the workspace playbook for its kind, and runs the SAME
        shared review core the route uses — always deep tier. No playbook
        configured → { noPlaybook: true }, and the system prompt tells the
        model to say so honestly rather than improvise one.

   The scripted stand-in drives the loop deterministically; the internal
   playbook review call is itself a scripted turn, so the full chain
   (chat fast → tool → review deep → chat) is visible in `calls`. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace, FIXTURES } = require('./helpers');

const SERVER_SRC = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const PLAYBOOK_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'playbook.js'), 'utf8');

const FAST_MODEL = 'claude-haiku-4-5-20251001';
const DEEP_MODEL = 'claude-sonnet-5';

/* The system prompt travels as an ARRAY of blocks now (the cacheable
   rulebook + the live snapshot) — flatten it back to one string to assert on. */
const sysText = s => Array.isArray(s) ? s.map(b => (b && b.text) || '').join('\n') : String(s || '');
const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
const toolCall = (name, input) => [{ type: 'tool_use', id: 'tu_t', name, input }];
const reviewResult = verdicts => [{ type: 'tool_use', id: 'tu_pb', name: 'playbook_review', input: { verdicts } }];

/* A saved workspace playbook, as the Playbook editor would store it: an
   extends-chain and a custom type with its own match keywords. MK-A1
   ("Refined Sugar Supply", template RM, folder proc) resolves to `supply` by
   the built-in keywords; the custom `modern` type must win for MK-B2, whose
   value stream its match keyword names.

   THE CUSTOM KEYWORD IS KEYED TO THE VALUE STREAM, AND THAT IS THE WHOLE
   REVERSAL — see the test below. It used to read ['milk'] and be asserted
   against MK-A2 ("Raw Milk Collection"), which only ever worked because the
   server matched the contract's TITLE. The browser has never read a title
   (playbookKeyFor matches a custom keyword against the KIND or the FOLDER and
   nothing else), so the old fixture proved the server's own bug rather than
   the capability it was written for. */
const SAVED_PLAYBOOK = {
  _default: { label: 'All contracts (baseline)',
    positions: [{ category: 'Governing law', pos: 'required', escalate: true, note: 'Home law & forum.' }],
    ranges: [{ key: 'paymentDays', label: 'Payment terms', op: '<=', value: 45, escalate: true }] },
  supply: { label: 'Supply / raw material / packaging', extends: '_default',
    positions: [{ category: 'Liability cap', pos: 'preferred', escalate: true }],
    ranges: [] },
  modern: { label: 'Modern trade', match: ['sales'],
    positions: [{ category: 'Listing fees', pos: 'required', escalate: false }],
    ranges: [] },
};

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { await h.stop(); await ai.stop(); });

const ask = (client, q) => client.json('/api/ai/chat', { method: 'POST',
  body: { messages: [{ role: 'user', content: q }] } });

function lastToolResult(call) {
  const msgs = call.body.messages || [];
  for (let i = msgs.length - 1; i >= 0; i--) {
    const c = msgs[i].content;
    if (Array.isArray(c) && c[0] && c[0].type === 'tool_result') return JSON.parse(c[0].content);
  }
  return null;
}

describe('F-B first, unconfigured — no playbook means saying so, not improvising one', () => {
  /* These run BEFORE the playbook is saved: a fresh workspace has no
     server-side playbook, and the honest answer is noPlaybook — the browser's
     built-in default playbook is a client-side seed for the Playbook page,
     not something the server restates. */
  test('the tool returns noPlaybook cleanly and burns no provider call on it', async () => {
    ai.reset();
    ai.script(toolCall('check_against_playbook', { id: 'MK-A1' }), deliver({ answer: 'No playbook.', citations: [] }));
    const r = await ask(W.admin, 'does MK-A1 match our playbook?');
    assert.equal(r.answer, 'No playbook.');
    assert.equal(ai.calls.length, 2, 'chat, tool (no internal review), chat — a missing playbook must not cost a deep call');
    const d = lastToolResult(ai.calls[1]);
    assert.equal(d.noPlaybook, true);
    assert.equal(d.id, 'MK-A1');
    assert.ok(!d.verdicts, 'no invented verdicts');
  });

  test('the system prompt teaches both the tool and the honesty rule', () => {
    const sys = sysText(ai.calls[0].body.system);
    assert.match(sys, /check_against_playbook/, 'the model is told when to reach for the tool');
    assert.match(sys, /matches our standards, positions or playbook/i);
    assert.match(sys, /no playbook is set up for this contract type/);
  });
});

/* A contract's own WORDING, which is what a standards check reads — see
   copilotContractWording. MK-B2 is born without one (the shared fixture is
   metadata only), and a check on a contract with no wording is refused before
   it spends anything, so the tests below that need a real review have to give
   it a document first. MK-A2 is deliberately LEFT without one: it is the shape
   that refusal exists for. */
const DOC_B2 = [
  'RETAIL SUPPLY AGREEMENT',
  '',
  'This agreement is made between Highland Corporate Ltd and Naivas Supermarkets.',
  '',
  'Article 1 Listing',
  '',
  'The Supplier shall list the products at the agreed shelf positions.',
  '',
  'Article 2 Payment',
  '',
  'Invoices are payable within thirty days of delivery.',
].join('\n');

describe('F-B configured — the review the product already knows how to do, from chat', () => {
  before(async () => {
    await W.admin.json('/api/settings', { method: 'PUT', body: { playbook: SAVED_PLAYBOOK } });
    const seen = await W.admin.json('/api/contracts/MK-B2');
    await W.admin.json('/api/contracts/MK-B2', { method: 'PUT',
      body: { contract: { ...seen, redlineText: DOC_B2, format: 'text' }, baseVersion: seen._v } });
  });

  test('verdicts come back through the tool, reviewed on the deep tier', async () => {
    ai.reset();
    ai.script(
      toolCall('check_against_playbook', { id: 'MK-A1' }),
      reviewResult([
        { category: 'Governing law', status: 'aligned', quote: 'the courts of Kenya' },
        { category: 'Liability cap', status: 'missing', redline: 'Liability capped at 12 months of fees.' },
      ]),
      deliver({ answer: 'One deviation.', citations: [{ id: 'MK-A1' }] }),
    );
    const r = await ask(W.admin, 'does MK-A1 match our standard positions?');
    assert.equal(ai.calls.length, 3, 'chat → internal review → chat');

    const review = ai.calls[1].body;
    assert.equal(review.tool_choice && review.tool_choice.name, 'playbook_review', 'the shared review core ran');
    assert.equal(review.model, DEEP_MODEL, 'a playbook check is legal-review synthesis — ALWAYS the deep tier');
    const prompt = review.messages[0].content;
    assert.match(prompt, /Governing law/, 'the resolved playbook travelled');
    assert.match(prompt, /Liability cap/, 'including the extends-chain position');
    /* REVERSED IN PLACE 10 Sep 2026 — it read /Refined Sugar Supply/, which is
       the contract's NAME and appears nowhere in its wording. It passed only
       because the check sent contractFullBody, the SEARCH bundle, so this
       asserted "the document travelled" by matching a fact from the metadata.
       It matches the document now. */
    assert.match(prompt, /payable within thirty days/, 'and the contract document itself');
    assert.doesNotMatch(prompt, /Kabras Sugar {2}MK-A1|MK-A1 {2}/,
      'the search bundle does not: a standards check reads the wording, not the record');

    const d = lastToolResult(ai.calls[2]);
    assert.equal(d.playbook, 'Supply / raw material / packaging', 'resolved by kind, not by default');
    assert.equal(d.verdicts.length, 2);
    assert.equal(d.verdicts[1].status, 'missing');

    assert.equal(r.citations[0].id, 'MK-A1', 'the final answer cites the contract as usual');
    assert.deepEqual(r.cards.map(c => c.id), ['MK-A1']);
  });

  /* ---- REVERSED IN PLACE 10 Sep 2026 — the claim is kept, its fixture is not.
     A custom match keyword DOES win over the built-in regexes and always did;
     what this test staged was a keyword ('milk') that could only ever be found
     in the contract's TITLE, which is the one thing the browser has never
     read. So it asserted "as in the client" over an answer the client could
     not give, and it was green for exactly as long as the server carried the
     bug Job 2.2 removes.

     MK-B2 is in the 'sales' stream, so the built-ins would answer `supply`
     (f==='sales'); a custom type naming that stream must beat them — on both
     hosts, because both read the folder. MK-A2 could not be used: it and MK-A1
     share a template AND a folder, so nothing a keyword can see tells them
     apart, and the test above needs MK-A1 to stay `supply`. */
  test('a custom type\'s match keywords win over the built-in regexes', async () => {
    ai.reset();
    ai.script(
      toolCall('check_against_playbook', { id: 'MK-B2' }),
      reviewResult([{ category: 'Listing fees', status: 'aligned' }]),
      deliver({ answer: 'ok', citations: [] }),
    );
    await ask(W.admin, 'does the Naivas contract match the playbook?');
    const d = lastToolResult(ai.calls[2]);
    assert.equal(d.playbook, 'Modern trade',
      'the custom type naming the value stream must beat the built-in that also matches it');
    const prompt = ai.calls[1].body.messages[0].content;
    assert.match(prompt, /Listing fees/);
    assert.doesNotMatch(prompt, /"category":"Governing law"/, 'a custom type without extends carries only its own positions');
  });

  test('scope: a contract outside the caller\'s folders reads as not found, never as a playbook result', async () => {
    ai.reset();
    ai.script(toolCall('check_against_playbook', { id: 'MK-B1' }), deliver({ answer: 'not found', citations: [] }));
    await ask(W.restricted, 'does MK-B1 match our playbook?');
    assert.equal(ai.calls.length, 2, 'no review call for a contract the caller may not see');
    const d = lastToolResult(ai.calls[1]);
    assert.equal(d.found, false);
    assert.ok(!d.noPlaybook && !d.verdicts, 'out of scope is indistinguishable from absent — not "no playbook", not verdicts');
  });

  test('a provider failure inside the tool degrades to an error result, not a dead chat', async () => {
    ai.reset();
    ai.script(toolCall('check_against_playbook', { id: 'MK-A1' }), 500, deliver({ answer: 'The check failed.', citations: [] }));
    const r = await ask(W.admin, 'playbook check while the provider is down');
    assert.equal(r.answer, 'The check failed.', 'the loop carried on and answered');
    const d = lastToolResult(ai.calls[2]);
    assert.match(d.error, /playbook review failed \(provider 500\)/);
  });

  test('the /api/ai/playbook route behaves exactly as before the extraction', async () => {
    ai.reset();
    ai.script(reviewResult([{ category: 'Payment terms', status: 'deviation', quote: 'ninety days' }]));
    const r = await W.admin.json('/api/ai/playbook', { method: 'POST',
      body: { text: 'Payment due in ninety days.', playbook: SAVED_PLAYBOOK._default, kind: 'Supply' } });
    assert.equal(r.verdicts.length, 1);
    assert.equal(r.verdicts[0].status, 'deviation');
    assert.equal(ai.calls[0].body.model, DEEP_MODEL, 'the route still reviews on the deep tier');

    ai.reset();
    ai.script(502);
    const err = await W.admin.raw('/api/ai/playbook', { method: 'POST',
      body: { text: 'x', playbook: {}, kind: 'x' } });
    assert.equal(err.status, 502, 'provider errors still map to 502');
    assert.match(err.json.error, /provider error \(502\)/);
  });

  /* ---- REVERSED IN PLACE 10 Sep 2026, and it was watching the wrong half ----
     (owner-reported: the Playbook review panel was headed "Against the Supply /
     raw material / packaging playbook" while Copilot, in the same chat about
     the same contract, said its playbook was "Professional / marketing
     services" and listed different standards.)

     THIS CLAIM PASSED THROUGHOUT. The four keyword REGEXES are identical in
     both files and always were; what differed is what they are matched
     AGAINST — the browser reads cKind(c), the contract's TYPE, and the server
     read `${c.template} ${c.name}`, its TITLE. Nothing checked that, so the
     test was a description rather than a measurement.

     THE REGEX CLAIM IS KEPT — it is cheap and it is still the thing that would
     catch a keyword edited on one side only — and the one that matters is
     added beside it: run BOTH rules over the same contracts and require the
     same key. */
  test('the key-resolution mirrors cannot silently drift from the client', () => {
    for (const re of [
      'nda|non-disclosure', 'lease',
      'professional|marketing|services|advisory|agency',
      'supply|packaging|raw material|manufactur|co-pack|distribut|warehous|freight|logistics|retail',
    ]) {
      assert.ok(SERVER_SRC.includes(re), `server key mirror is missing /${re}/`);
      assert.ok(PLAYBOOK_SRC.includes(re), `client playbookKeyFor is missing /${re}/`);
    }
    assert.match(SERVER_SRC, /p\.match\.some/, 'custom match keywords win first on the server too');
  });

  test('BOTH rules answer the same key for the same contract', () => {
    /* THE MEASUREMENT THE CLAIM ABOVE COULD NOT MAKE. Each rule is run for
       real — the browser's out of a world that loads js/playbook.js, the
       server's lifted out of server.js and executed — over one set of
       contracts, and every pair must agree.

       cKind IS SUPPLIED FROM js/templates.js's own kind column, because the
       light world stubs it to a constant; supplying it from the product's own
       table is what makes the browser side of this the product's answer rather
       than the stage's. */
    const { buildWorld } = require('./world');
    const TPL = fs.readFileSync(path.join(__dirname, '..', 'js', 'templates.js'), 'utf8');
    const KIND = {};
    const re = /^\s*[A-Z]{2}:\{ id:'([A-Z]{2})', name:'[^']*', kind:'([^']*)'/gm;
    for (let m; (m = re.exec(TPL));) KIND[m[1]] = m[2];
    assert.ok(Object.keys(KIND).length >= 12, 'the template kinds were read');

    const a = SERVER_SRC.indexOf('const COPILOT_TEMPLATE_KIND');
    const b = SERVER_SRC.indexOf('function copilotPlaybookKey');
    const e = SERVER_SRC.indexOf('\n}', SERVER_SRC.indexOf("return '_default';", b)) + 2;
    assert.ok(a > 0 && b > a, 'the server rule and its kind table were found');
    // eslint-disable-next-line no-new-func
    const srvKey = new Function(SERVER_SRC.slice(a, e) + '; return copilotPlaybookKey;')();

    /* AND THE KIND TABLE IS A MIRROR, so it is pinned to the one it mirrors. */
    // eslint-disable-next-line no-new-func
    const srvKind = new Function(SERVER_SRC.slice(a, e) + '; return COPILOT_TEMPLATE_KIND;')();
    for (const id in KIND)
      assert.equal(srvKind[id], KIND[id],
        `the server's kind for template ${id} has drifted from js/templates.js`);
    for (const id in srvKind)
      assert.ok(KIND[id], `the server names a template ${id} that js/templates.js does not`);

    const { win } = buildWorld({ standards: true });
    win.cKind = c => (c && c.source === 'upload') ? 'External Document'
      : (KIND[c && c.template] || 'Contract');
    const pb = win.playbook();

    const cases = [
      /* THE SHAPE THAT BROKE: an upload (so no template at all), filed in
         'proc', whose TITLE happens to carry the word "Services". */
      { why: 'MK-382 — upload, proc, "Warehousing and Transportation Services"',
        c: { id: 'MK-382', source: 'upload', template: null, folder: 'proc',
          name: 'Warehousing and Transportation Services — Nordkust' } },
      { why: 'an NDA from its own template',
        c: { id: 'A', template: 'ND', folder: 'corp', name: 'Mutual NDA with Acme' } },
      { why: 'a lease from its own template',
        c: { id: 'B', template: 'LE', folder: 'corp', name: 'Depot premises' } },
      { why: 'a template-made services contract',
        c: { id: 'C', template: 'PS', folder: 'corp', name: 'Annual audit retainer' } },
      { why: 'a warehousing contract from its own template',
        c: { id: 'D', template: 'WH', folder: 'dist', name: 'Cold chain — Q3' } },
      { why: 'an upload in corp whose TITLE says lease',
        c: { id: 'E', source: 'upload', template: null, folder: 'corp',
          name: 'Office Lease 2026' } },
      { why: 'a contract with a custom match keyword',
        c: { id: 'F', template: null, folder: 'corp', name: 'Anything at all' } },
    ];
    /* The custom-keyword branch, which both rules ask FIRST: a type added in
       the editor has to apply on both hosts or the two disagree on exactly the
       contracts a customer configured by hand. */
    pb.tolling = { label: 'Tolling', match: ['contract'], positions: [], ranges: [] };

    for (const t of cases) {
      const mine = win.playbookKeyFor(t.c);
      const theirs = srvKey(pb, t.c);
      assert.equal(theirs, mine,
        `${t.why}: the panel reads "${mine}" and Copilot reads "${theirs}"`);
    }
  });
});

describe('F-A — the verdict is written by the smart model', () => {
  test('after compare_contracts, subsequent iterations run deep', async () => {
    ai.reset();
    ai.script(
      toolCall('compare_contracts', { ids: ['MK-A1', 'MK-A2'] }),
      deliver({ answer: 'MK-A1 is more favorable.', citations: [{ id: 'MK-A1' }, { id: 'MK-A2' }],
        compare: { columns: [{ id: 'MK-A1', label: 'Sugar' }, { id: 'MK-A2', label: 'Milk' }],
          rows: [{ label: 'Value', cells: ['48M', '36M'] }], verdict: 'MK-A1, on price.' } }),
    );
    const r = await ask(W.admin, 'compare MK-A1 and MK-A2 — which is better for us?');
    assert.equal(ai.calls[0].body.model, FAST_MODEL, 'routing/tool selection stays on the fast tier');
    assert.equal(ai.calls[1].body.model, DEEP_MODEL, 'the synthesis AFTER a compare is the legal-adjacent verdict — deep');
    assert.equal(r.compare.verdict, 'MK-A1, on price.');
  });

  test('a turn that never compares stays fast end to end', async () => {
    ai.reset();
    ai.script(toolCall('get_contract', { id: 'MK-A1' }), deliver({ answer: 'It is a sugar contract.', citations: [{ id: 'MK-A1' }] }));
    await ask(W.admin, 'what is MK-A1?');
    assert.equal(ai.calls.length, 2);
    for (const c of ai.calls) assert.equal(c.body.model, FAST_MODEL, 'no compare, no escalation — ordinary questions stay cheap');
  });

  test('escalation is per turn, not sticky across requests', async () => {
    ai.reset();
    ai.script(toolCall('get_contract', { id: 'MK-A2' }), deliver({ answer: 'milk', citations: [] }));
    await ask(W.admin, 'and MK-A2?');
    for (const c of ai.calls) assert.equal(c.body.model, FAST_MODEL,
      'the previous request\'s compare must not leak its tier into this one');
  });

  test('the deep calls are booked on the chat feature line of the spend ledger', async () => {
    const before = await W.admin.json('/api/ai/spend');
    const chatBefore = (before.byFeature.find(f => f.feature === 'chat') || { calls: 0 }).calls;
    ai.reset();
    ai.script(toolCall('compare_contracts', { ids: ['MK-A1', 'MK-A2'] }), deliver({ answer: 'v', citations: [] }));
    await ask(W.admin, 'compare them again');
    const after = await W.admin.json('/api/ai/spend');
    const chatAfter = (after.byFeature.find(f => f.feature === 'chat') || { calls: 0 }).calls;
    assert.equal(chatAfter, chatBefore + 2, 'both the fast and the deep call of the turn land on the chat line');
  });
});

/* ============================================================
   F-C — COPILOT AND THE PLAYBOOK PANEL ANSWER FROM ONE BOOK
   ============================================================
   (owner-reported 10 Sep 2026, off one chat about one contract: the Playbook
   review panel was headed "Against the Supply / raw material / packaging
   playbook"; Copilot, in the same conversation, said its playbook was
   "Professional / marketing services", listed different standards, then went
   looking for "a different source" or "a note added manually".)

   THREE FAULTS, AND NOT ONE OF THEM WAS AN INVENTION. The key rule read the
   contract's TITLE where the browser reads its TYPE (F-B's own mirror test
   above, reversed in place and now measured); Copilot could not see the review
   the reader had open, so it re-judged the contract BY CONSTRUCTION; and an
   empty check was handed on as a finished list of no findings.

   THE STORED REVIEW IS THE ANSWER WHERE THERE IS ONE. Everything below is
   about that: it travels, it is preferred, it names the book and it says when
   it was run — and where there is none, the fresh check says THAT. */
describe('F-C — the panel and the chat read the same review', () => {
  const REVIEW = {
    key: 'supply', label: 'Supply / raw material / packaging', source: 'ai',
    verdicts: [
      { category: 'Governing law', status: 'aligned', quote: 'the courts of Kenya',
        position: 'Home law & forum', escalate: false },
      { category: 'Liability cap', status: 'missing', quote: '',
        position: 'Liability capped at 12 months of fees', escalate: true },
    ],
  };

  const put = async (id, patch) => {
    const seen = await W.admin.json('/api/contracts/' + id);
    await W.admin.json('/api/contracts/' + id, { method: 'PUT',
      body: { contract: { ...seen, ...patch }, baseVersion: seen._v } });
  };

  before(async () => {
    await W.admin.json('/api/settings', { method: 'PUT', body: { playbook: SAVED_PLAYBOOK } });
    await put('MK-A1', { playbook: REVIEW,
      audit: [{ at: '2026-09-01T09:00:00.000Z', user: 'Amina Otieno',
        action: 'Playbook', detail: 'Reviewed against Supply — 0 deviation(s), 1 missing' }] });
  });

  test('get_contract carries the stored review, so Copilot can see what the reader is looking at', async () => {
    ai.reset();
    ai.script(toolCall('get_contract', { id: 'MK-A1' }), deliver({ answer: 'ok', citations: [] }));
    await ask(W.admin, 'what does MK-A1 say?');
    const d = lastToolResult(ai.calls[1]);
    const r = d.standardsReview;
    assert.ok(r, 'the review the Playbook panel is showing travels with the contract');
    assert.equal(r.playbook, 'Supply / raw material / packaging', 'and it names the book it was checked against');
    assert.equal(r.checkedAt, '2026-09-01T09:00:00.000Z', 'when it was run is READ off the audit trail, never guessed');
    assert.equal(r.checkedBy, 'Copilot-assisted');
    assert.equal(r.verdicts.length, 2);
    assert.equal(r.verdicts[1].status, 'missing');
    assert.equal(r.verdicts[1].escalate, true);
    assert.equal(r.verdictsOmitted, 0, 'a cap is a FACT and is stated even at zero');
  });

  test('a contract nobody has checked carries no review, rather than an empty one', async () => {
    ai.reset();
    ai.script(toolCall('get_contract', { id: 'MK-A2' }), deliver({ answer: 'ok', citations: [] }));
    await ask(W.admin, 'what does MK-A2 say?');
    assert.equal(lastToolResult(ai.calls[1]).standardsReview, null,
      'null says "nobody has checked this"; an empty verdict list would read as "nothing was found"');
  });

  test('the verdict list is bounded and the omission is counted', async () => {
    const many = Array.from({ length: 55 }, (_, i) => ({ category: 'Cat ' + i, status: 'aligned' }));
    await put('MK-B2', { playbook: { ...REVIEW, verdicts: many } });
    ai.reset();
    ai.script(toolCall('get_contract', { id: 'MK-B2' }), deliver({ answer: 'ok', citations: [] }));
    await ask(W.admin, 'what does MK-B2 say?');
    const r = lastToolResult(ai.calls[1]).standardsReview;
    assert.equal(r.verdicts.length, 40, 'bounded like the negotiation block beside it');
    assert.equal(r.verdictsOmitted, 15, 'and what was left out is a number, never a silent trim');
    await put('MK-B2', { playbook: null });   // the document it was given stays
  });

  test('the review that travels carries no figure and no colleague', () => {
    /* SCOPE AND MONEY HOLD BY CONSTRUCTION — this is read off a record
       copilotGetJson has already scoped, and a verdict carries a category, a
       status, the workspace's own position and a quote from the customer's own
       wording. Pinned as the ALLOW-LIST it is: a blocklist tests the fields
       somebody thought of. */
    const a = SERVER_SRC.indexOf('function copilotStoredPlaybook');
    const body = SERVER_SRC.slice(a, SERVER_SRC.indexOf('\n}', a));
    assert.ok(a > 0);
    const keys = [...body.matchAll(/^\s*(?:([a-zA-Z]+):|.*?\b([a-zA-Z]+): )/gm)];
    assert.match(body, /category: v\.category/, 'the verdict is rebuilt field by field');
    assert.doesNotMatch(body, /\.\.\.v\b/, 'never spread — a spread carries whatever the record grew since');
    assert.doesNotMatch(body, /value|redline|resolvedBy|review\b/, 'no money, no colleague, no internal review');
    assert.ok(keys.length, 'the allow-list was read');
  });

  test('check_against_playbook PREFERS the stored review and burns no provider call on it', async () => {
    ai.reset();
    ai.script(toolCall('check_against_playbook', { id: 'MK-A1' }), deliver({ answer: 'ok', citations: [] }));
    await ask(W.admin, 'does MK-A1 match our standards?');
    assert.equal(ai.calls.length, 2,
      'chat → tool → chat: re-judging a contract the workspace has already judged is the fault, not the fix');
    const d = lastToolResult(ai.calls[1]);
    assert.equal(d.source, 'stored-review');
    assert.equal(d.playbook, 'Supply / raw material / packaging', 'the book is named');
    assert.equal(d.checkedAt, '2026-09-01T09:00:00.000Z', 'and so is when it was run');
    assert.equal(d.verdicts.length, 2);
    assert.match(d.note, /same one the reader sees/i, 'the model is told this IS the panel');
    assert.match(d.note, /out of date/i,
      'a stored review can be stale — the date is stated and the reader judges; no freshness test is invented');
  });

  test('a contract with no stored review is checked now, and SAYS it is a fresh check', async () => {
    ai.reset();
    ai.script(
      toolCall('check_against_playbook', { id: 'MK-B2' }),
      reviewResult([{ category: 'Listing fees', status: 'aligned', quote: 'shelf positions' }]),
      deliver({ answer: 'ok', citations: [] }),
    );
    await ask(W.admin, 'does MK-B2 match our standards?');
    const d = lastToolResult(ai.calls[2]);
    assert.equal(d.source, 'run-now');
    assert.equal(d.playbook, 'Modern trade', 'a fresh check names its book too');
    assert.match(d.note, /NO stored standards review/, 'and never reads as what their panel shows');
  });

  test('an empty check says the check came back empty, never that the contract is clean', async () => {
    ai.reset();
    ai.script(
      toolCall('check_against_playbook', { id: 'MK-B2' }),
      reviewResult([]),
      deliver({ answer: 'ok', citations: [] }),
    );
    await ask(W.admin, 'check MK-B2 again');
    const d = lastToolResult(ai.calls[2]);
    assert.equal(d.checkedNothing, true);
    assert.deepEqual(d.verdicts, []);
    assert.match(d.note, /not the same as/i);
    assert.match(d.note, /meets every standard/i, 'the wrong reading is named so it cannot be reached for');
  });

  test('a check CUT SHORT is not an empty check — the obligations reader\'s own lesson', async () => {
    ai.reset();
    ai.script(
      toolCall('check_against_playbook', { id: 'MK-B2' }),
      { blocks: reviewResult([]), stopReason: 'max_tokens' },
      deliver({ answer: 'ok', citations: [] }),
    );
    await ask(W.admin, 'check MK-B2 once more');
    const d = lastToolResult(ai.calls[2]);
    assert.equal(d.checkedNothing, true);
    assert.equal(d.cutShort, true, 'an answer cut short is not an empty answer');
    assert.match(d.note, /CUT SHORT/);
    assert.match(d.note, /run it again/i, 'and the way forward is named');
  });

  test('a document with no readable wording is checked by nothing and pays for nothing', async () => {
    /* /api/ai/playbook refuses an empty `text` with a 400; this reaches the
       same reviewer directly and never asked — and what it sent was
       contractFullBody, the SEARCH bundle, which always carries the name, the
       counterparty and the id. So a scan whose words never came out of the
       file arrived as a line of metadata and came back — correctly — with
       nothing to say. MK-A2 is exactly that shape and needs no staging. */
    ai.reset();
    ai.script(toolCall('check_against_playbook', { id: 'MK-A2' }), deliver({ answer: 'ok', citations: [] }));
    await ask(W.admin, 'does MK-A2 match our standards?');
    assert.equal(ai.calls.length, 2, 'no deep call is spent on an empty string');
    const d = lastToolResult(ai.calls[1]);
    assert.equal(d.noText, true);
    assert.equal(d.checkedNothing, true);
    assert.match(d.note, /no readable wording/i);
  });

  test('the tool description and the system prompt teach the one book', () => {
    /* Sliced from the tool's own name to its schema — a regex over a quoted
       JS string stops at the first escaped apostrophe, which is four words in.
       (It did, and reported the description as one line long.) */
    const a = SERVER_SRC.indexOf("name: 'check_against_playbook'");
    const desc = SERVER_SRC.slice(a, SERVER_SRC.indexOf('input_schema', a));
    assert.ok(a > 0, 'the tool was found');
    assert.match(desc, /PREFERS THE REVIEW ALREADY ON THE CONTRACT/);
    assert.match(desc, /stored-review/);
    assert.match(desc, /run-now/);
    assert.match(desc, /checkedNothing/);
    assert.match(desc, /ALWAYS NAME THE PLAYBOOK/);
    const sys = sysText(ai.calls[0].body.system);
    assert.match(sys, /standardsReview/, 'the model is told where the panel\'s own answer lives');
    assert.match(sys, /Never re-judge a contract that has one/);
    assert.match(sys, /never work out for yourself which playbook applies/i);
  });
});
