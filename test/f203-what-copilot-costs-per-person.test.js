/* ============================================================
   f203 — what Copilot costs, per person (Phase 1: SHOW IT)

   An admin can see what Copilot cost today broken down by PERSON, beside the
   breakdown by feature that already existed. Nothing is refused, nothing is
   capped, nobody is blocked. A cap designed before anybody has seen the
   numbers is a cap set to the wrong figure.

   THE FIRST TEST IN THIS FILE IS THE ONE THAT MATTERS, and it was written
   before any of the code. A METERED CALL SITE THAT DOES NOT NAME A PERSON IS
   SPENDING THAT COUNTS AGAINST NOBODY — which is worse than not having the
   feature at all, because the per-person total is then quietly short and an
   admin reads a number that does not add up to the workspace one. So it walks
   every call into Anthropic in the server and fails on the thirteenth site
   somebody adds without a `who`. Same shape as f170's CREATORS list, which
   already does exactly this for contract creation.

   The work order listed two sites as "check — no explicit feature". Both were
   established before building and both DO carry one: line ~3101 is `ocr` and
   line ~8732 is `template_convert`. There was no pre-existing hole in the
   by-feature breakdown.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* Every real call into Anthropic, with the whole argument list it hands over.
   Found by walking the parentheses rather than by a regex over the arguments:
   the payloads are multi-line objects full of braces, template literals and
   commas, and a regex over them is a guess.

   `await ` is what tells a CALL from a MENTION — the function's own definition
   and the comment above its streaming twin both read `anthropicMessages(`, and
   neither is a site anything is booked from. Every real one is awaited, so a
   site that stops being awaited fails this file too, which is worth knowing. */
function meteredCallSites(src) {
  const out = [];
  const re = /await\s+(anthropicMessages(?:Stream)?)\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length, depth = 1;
    for (; i < src.length && depth > 0; i++) {
      const ch = src[i];
      if (ch === '(' || ch === '{' || ch === '[') depth++;
      else if (ch === ')' || ch === '}' || ch === ']') depth--;
      else if (ch === "'" || ch === '"') { const q = ch; i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; } }
    }
    out.push({ line: src.slice(0, m.index).split('\n').length, name: m[1],
      meter: src.slice(m.index, i) });
  }
  return out;
}

describe('f203 — THE THIRTEENTH SITE', () => {
  const src = read('server/server.js');
  const sites = meteredCallSites(src);

  test('every call into Anthropic is found — this is the list the rest depends on', () => {
    assert.ok(sites.length >= 11, `found ${sites.length} metered call sites`);
    assert.ok(sites.some(s => s.name === 'anthropicMessagesStream'), 'including the streaming twin');
  });

  test('and every one of them names a FEATURE', () => {
    const anon = sites.filter(s => !/feature/.test(s.meter));
    assert.deepEqual(Array.from(anon.map(s => `line ${s.line}`)), [],
      'the by-feature breakdown is only as complete as its least-tagged call');
  });

  test('AND EVERY ONE OF THEM NAMES A PERSON', () => {
    /* THE POINT OF THIS FILE. Add a twelfth route tomorrow, forget the `who`,
       and this fails — rather than the per-person total quietly being short by
       whatever that route costs. */
    const anon = sites.filter(s => !/\bwho\b/.test(s.meter));
    assert.deepEqual(Array.from(anon.map(s => `line ${s.line}: ${s.meter.slice(0, 70)}`)), [],
      'a metered call site that does not name a person is spending that counts against nobody');
  });

  test('the person is read in ONE place, not spelled out eleven times', () => {
    assert.match(src, /function aiWho\(/, 'aiWho(req) is the one reading');
    /* Every site asks it, or forwards a who somebody else asked it for. */
    const sites2 = meteredCallSites(src);
    for (const s of sites2)
      assert.ok(/aiWho\(|who:\s*\(?\s*(meter|opts|aux|who)\b/.test(s.meter),
        `line ${s.line} invents its own answer: ${s.meter.slice(0, 80)}`);
  });

  test('and a forwarder passes it on — its own callers supply it', () => {
    /* aiPlaybookVerdicts is called from a route AND from inside a chat turn's
       tool loop, so it takes its who rather than guessing one. */
    const fn = src.slice(src.indexOf('async function aiPlaybookVerdicts'), src.indexOf('app.post(\'/api/ai/playbook\''));
    assert.match(fn, /meter\.who/, 'the helper forwards rather than inventing');
    const route = src.slice(src.indexOf("app.post('/api/ai/playbook'"), src.indexOf("app.post('/api/ai/playbook'") + 900);
    assert.match(route, /aiPlaybookVerdicts\(key,[\s\S]{0,200}who:/, 'the route supplies one');
    const tool = src.slice(src.indexOf('async function copilotPlaybookCheck'), src.indexOf('async function copilotPlaybookCheck') + 900);
    assert.match(tool, /who/, 'and so does the chat tool that calls it');
  });
});

/* ============================================================
   THE LEDGER — the same table shape, a different key
   ============================================================ */
describe('f203 — the ledger is a second small table, not a wider one', () => {
  const src = read('server/server.js');

  test('ai_spend_user exists and is keyed (day, user_id)', () => {
    assert.match(src, /CREATE TABLE IF NOT EXISTS ai_spend_user/);
    const ddl = src.slice(src.indexOf('CREATE TABLE IF NOT EXISTS ai_spend_user'),
      src.indexOf('CREATE TABLE IF NOT EXISTS ai_spend_user') + 700);
    assert.match(ddl, /PRIMARY KEY \(day, ?user_id\)/);
  });

  test('THE BY-FEATURE TABLE IS UNTOUCHED — its numbers stay byte-identical', () => {
    /* Adding user_id to ai_spend's primary key would multiply its rows by the
       number of members and change what every existing reader gets back. */
    const at = src.indexOf('CREATE TABLE IF NOT EXISTS ai_spend (');
    const ddl = src.slice(at, src.indexOf('PRIMARY KEY (day, feature)', at) + 26);
    assert.match(ddl, /PRIMARY KEY \(day, ?feature\)/);
    assert.ok(!/user_id/.test(ddl), 'no user column on the by-feature ledger');
  });

  test('it carries the NAME as well as the id, so somebody who leaves still shows', () => {
    const ddl = src.slice(src.indexOf('CREATE TABLE IF NOT EXISTS ai_spend_user'),
      src.indexOf('CREATE TABLE IF NOT EXISTS ai_spend_user') + 700);
    assert.match(ddl, /user_name/);
  });

  test('and it is written from the ONE recorder, beside the existing statement', () => {
    const fn = src.slice(src.indexOf('function recordAiSpend'), src.indexOf('function recordAiSpend') + 1400);
    assert.match(fn, /upsertSpend\.run/, 'the by-feature line, unchanged');
    assert.match(fn, /upsertSpendUser\.run/, 'and the per-person line beside it');
  });
});

/* ============================================================
   AGAINST A REAL SERVER — two members, two lines
   ============================================================ */
describe('f203 — two people\'s calls land under two people', () => {
  /* startHati already stands up a stub provider and points the server at it,
     so a call made here is a real trip through anthropicMessages, priceUsage
     and recordAiSpend — the whole path this feature hangs off. */
  let h, W;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { key: 'sk-ant-test-key' } });
  });
  after(async () => { await h.stop(); });

  const ask = (client, q) => client.raw('/api/ai/chat', { method: 'POST',
    body: { messages: [{ role: 'user', content: q }] } });
  const spend = () => W.admin.json('/api/ai/config').then(c => c.spend || {});

  /* A chat turn is a tool LOOP — one question can be several calls into
     Anthropic, and against a stand-in that always answers with a tool it is
     several. So nothing here asserts a magic number: it asserts that the
     person's own line MOVES when they ask and HOLDS when somebody else does,
     which is the property that matters. */
  let firstRequests = 0;
  test('a call by one member is booked to them by name', async () => {
    const r = await ask(W.unrestricted, 'What is in the portfolio?');
    assert.equal(r.status, 200, r.text.slice(0, 200));
    const s = await spend();
    const mine = (s.byPerson || []).find(p => p.name === 'Unrestricted Legal');
    assert.ok(mine, `expected a line for Unrestricted Legal, got ${JSON.stringify((s.byPerson || []).map(p => p.name))}`);
    assert.ok(mine.cost > 0, 'and it cost something');
    assert.ok(mine.requests > 0, 'and it counted');
    firstRequests = mine.requests;
  });

  test('a call by a second member is a SECOND line, not added to the first', async () => {
    await ask(W.restricted, 'And now?');
    const s = await spend();
    const names = (s.byPerson || []).map(p => p.name).sort();
    assert.ok(names.includes('Unrestricted Legal') && names.includes('Restricted Legal'), names.join(', '));
    assert.equal((s.byPerson || []).find(p => p.name === 'Unrestricted Legal').requests, firstRequests,
      'the first person\'s count did not move');
  });

  test('a second call by the same person adds to their own line', async () => {
    await ask(W.unrestricted, 'One more');
    const s = await spend();
    assert.ok((s.byPerson || []).find(p => p.name === 'Unrestricted Legal').requests > firstRequests);
  });

  test('largest first, so an admin reads the answer rather than sorting it', async () => {
    const s = await spend();
    const costs = (s.byPerson || []).map(p => p.cost);
    assert.deepEqual(Array.from(costs), Array.from(costs.slice().sort((a, b) => b - a)));
  });

  test('THE BY-FEATURE NUMBERS ARE UNCHANGED — the same total, the same shape', async () => {
    const s = await spend();
    assert.ok(s.byFeature && s.byFeature.chat, 'the by-feature ledger still answers');
    const perPersonReq = (s.byPerson || []).reduce((t, p) => t + p.requests, 0);
    assert.equal(s.byFeature.chat.requests, perPersonReq,
      'the two ledgers counted the same calls');
    const perPerson = (s.byPerson || []).reduce((t, p) => t + p.cost, 0);
    assert.ok(Math.abs(perPerson - s.cost) < 1e-9,
      `every shilling here was somebody's: ${perPerson} vs ${s.cost}`);
  });

  test('and the unattributed remainder is REPORTED rather than left to be subtracted', async () => {
    const s = await spend();
    assert.equal(typeof s.unattributed, 'number',
      'the two totals will not always agree — a scheduled sweep has no owner');
    assert.ok(Math.abs(s.unattributed) < 1e-9, 'nothing unattributed yet, and it says so as a number');
  });

  test('spending with no person behind it books to the workspace and to nobody', async () => {
    /* Directly, because there is no route in the product that runs a real
       Anthropic call outside a signed-in request today — and that is exactly
       why the number has to be shown rather than assumed to be zero. */
    const before = await spend();
    const r = await W.admin.raw('/api/__test/unattributed-spend', { method: 'POST', body: {} });
    if (r.status === 404) return;                       // no test hook in this build
    const after = await spend();
    assert.ok(after.cost > before.cost, 'the workspace total moved');
    assert.ok(after.unattributed > 0, 'and the gap is stated');
  });
});

/* ============================================================
   THE SCREEN
   ============================================================ */
describe('f203 — where an admin reads it', () => {
  const set = read('js/views/settings.js');

  test('a second breakdown, under the by-feature one, on the Copilot engine panel', () => {
    assert.match(set, /id="ai-spend-people"/);
    const panel = set.slice(set.indexOf('id="ai-spend-breakdown"'), set.indexOf('id="ai-spend-breakdown"') + 900);
    assert.match(panel, /ai-spend-people/, 'beneath it, in the same section as the money');
  });

  test('NOT on the People tab — that would make the roster a league table', () => {
    const people = set.slice(set.indexOf('function stPeopleHtml'), set.indexOf('function stPeopleHtml') + 2500);
    assert.ok(!/spend|cost|copilot/i.test(people),
      'a per-person cost column turns a list about permissions into a ranking');
  });

  test('V-4: it says what it measures, because somebody will read it as a performance measure', () => {
    assert.match(set, /set_spend_people_note/);
    const i18n = read('js/i18n.js');
    assert.match(i18n, /set_spend_people_note: 'What Anthropic charged for calls/);
  });

  test('and every new word is in both languages', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['set_spend_people', 'set_spend_people_note', 'set_spend_unattributed', 'set_spend_people_none'])
      assert.equal((i18n.match(new RegExp(`\\b${k}:`, 'g')) || []).length, 2, k);
  });
});

/* ============================================================
   PHASE 2 IS NOT BUILT, AND THAT IS DELIBERATE
   ============================================================ */
describe('f203 — nothing is capped and nothing is refused', () => {
  test('no per-person ceiling exists anywhere yet', () => {
    const src = read('server/server.js');
    assert.ok(!/copilotCap/.test(src),
      'Phase 1 shows the numbers; a cap designed before anybody has seen them is set to the wrong figure');
    const set = read('js/views/settings.js');
    assert.ok(!/copilotCap/.test(set));
  });

  test('the budget guard still refuses on the workspace ceiling alone', () => {
    const src = read('server/server.js');
    const fn = src.slice(src.indexOf('function aiBudgetGuard'), src.indexOf('const aiFeature'));
    assert.match(fn, /aiDailySpendLimit\(\)/);
    assert.ok(!/perPerson|copilotCap|userSpend/i.test(fn), 'one guard, and it has not grown a second question');
  });
});
