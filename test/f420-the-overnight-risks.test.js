/* f420 — THE OVERNIGHT RUN'S RISKS (the owner's list, 27 Sep 2026, "fix it all")

   Eleven risks from "HaTi Remaining Bugs", each a claim that fails on the code
   before this run:
     (1) r25 an adviser link carries the chosen clauses and nothing else — built
         as an allow-list in the browser (shareAdviceNarrow) and trimmed again by
         the server (advicePayload), which also narrows links stored before;
     (2) n29 the quiet catch-up leaves an adviser link alone, and the server
         refuses a copy that is not an adviser's onto one;
     (3) r28 deleting a contract blanks its links' recipients;
     (4) r15 a Copilot key that is not a key is refused, in the browser and on
         the server; the box asks the browser not to fill a saved password;
     (5) r16 the Advice desk escapes quote marks;
     (6) r17 the Insights chat bubble cleans what it draws;
     (7) r21 each overnight job asks its own limit (main's agents, on the merge);
     (8) r13 + h1 a reminder never reaches someone out of the stream, and the
         held-step mail finds the contract's owner on the record;
     (9) r14 one money detector for Copilot's history on both hosts;
    (10) r5 a revision in words alone drops the old markup;
    (11) r27 a Discard keeps the chain whole;
    (12) r9 a paper filing verifies against its scan and is not called migrated.
   (3) and the server halves of (1)(2)(4) are driven against a real server. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { buildWorld, supplyContract } = require('./world.js');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CORE = R('js/core.js'), SRV = R('server/server.js'), NEGO = R('js/negotiation.js');
const tick = () => new Promise(r => setTimeout(r, 12));
const region = (src, start, end) => { const a = src.indexOf(start); assert.ok(a >= 0, 'region ' + start); const b = src.indexOf(end, a + start.length); return src.slice(a, b < 0 ? undefined : b); };

const DOC = '1. PRICE\nThe price is KES 4,800,000.\n2. SECRET\nOur walk-away is KES 3,000,000.';
const FULL = id => ({ v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
  at: new Date().toISOString(), docHash: 'h1', purpose: 'advise', purposeChosen: 'advise',
  contract: { id, name: 'Supply Agreement', counterparty: 'Nordkust Industri AB', value: 4800000,
    fields: { price: 'KES 4,800,000' }, docText: DOC, viewBody: '<p>' + DOC + '</p>', versions: [{ docText: DOC }],
    adviseOn: ['#0'], adviseBody: '<h2>1. PRICE</h2><p>The price is KES 4,800,000.</p>' } });

describe('f420 — the server halves', () => {
  let h, W;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/MK-ADV-1', { method: 'PUT', body: {
      contract: fixtureContract('MK-ADV-1', 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review'),
      baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });

  const mint = async (purpose, payload) => (await W.admin.json('/api/shares', { method: 'POST', body: {
    payload, durable: true, channel: 'link', purpose,
    recipient: { name: 'Dr Vogt', email: 'vogt@legal.de' } } })).token;

  test('f420 (1) an adviser link serves the chosen clauses and nothing else — even one stored whole', async () => {
    const tok = await mint('advise', FULL('MK-ADV-1'));
    const seen = await h.client('vogt').json('/api/shares/' + tok);
    const k = seen.payload.contract;
    const blob = JSON.stringify(seen.payload);
    assert.ok(!/walk-away/.test(blob), 'the clause that was not chosen never reaches their browser');
    assert.equal(k.value, undefined, 'nor the value');
    assert.equal(k.docText, undefined, 'nor the whole wording in plain text');
    assert.equal(k.fields, undefined, 'nor the recorded terms');
    assert.match(k.redlineText, /The price is/, 'the chosen clause is the wording');
    assert.equal(seen.purpose, 'advise');
  });

  test('f420 (2) a copy that is not an adviser’s is refused onto an adviser link', async () => {
    const tok = await mint('advise', FULL('MK-ADV-1'));
    const r = await W.admin.raw('/api/shares/' + tok + '/payload', { method: 'PUT',
      body: { silent: true, payload: { ...FULL('MK-ADV-1'), purpose: 'advise', purposeChosen: null } } });
    assert.equal(r.status, 409, 'the quiet catch-up’s copy (no clause list, no stated kind) is refused');
  });

  test('f420 (3) deleting a contract blanks who its links went to', async () => {
    await W.admin.json('/api/contracts/MK-ADV-2', { method: 'PUT', body: {
      contract: fixtureContract('MK-ADV-2', 'Lease', 'Nordkust Industri AB', FOLDER_A, 100, 'Draft'), baseVersion: 0 } });
    const tok = await mint('advise', FULL('MK-ADV-2'));
    await W.admin.json('/api/contracts/MK-ADV-2', { method: 'DELETE' });
    const { DatabaseSync } = require('node:sqlite');
    const db = (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db'), { readOnly: true }));
    const row = db.prepare('SELECT recipient_name, recipient_email FROM shares WHERE token=?').get(tok);
    db.close();
    assert.ok(row, 'the row is kept (it says a link went)');
    assert.equal(row.recipient_name, '');
    assert.equal(row.recipient_email, '');
  });

  test('f420 (4) a Copilot key that is not a key is refused by the server', async () => {
    const r = await W.admin.raw('/api/ai/config', { method: 'PUT', body: { key: 'myLoginPassword1!' } });
    assert.equal(r.status, 400);
    const c = await W.admin.json('/api/ai/config');
    assert.notEqual(c.source, 'settings', 'nothing was stored');
  });
});

test('f420 (1b) the browser builds an adviser copy as an allow-list', () => {
  assert.match(CORE, /return shareAdviceNarrow\(\{ v:1, kind:'hati-share'/, 'every copy passes the narrowing');
  const fn = region(CORE, 'function shareAdviceNarrow(out){', '\n}\n');
  assert.match(fn, /purposeChosen!=='advise'/, 'only an adviser copy is narrowed');
  assert.ok(!/docText|viewBody|fields|value|versions|templateForm/.test(region(CORE, 'const SHARE_ADVICE_KEEP', ';')), 'nothing that carries the whole contract is on the keep list');
});

test('f420 (2b) the quiet catch-up passes an adviser link by', () => {
  const fn = region(CORE, 'async function refreshLiveShareQuietly(c){', '\n}\n');
  assert.match(fn, /s\.purpose==='advise'\) continue/);
});

test('f420 (4b) the key box refuses a password and asks the browser not to fill one', () => {
  const S = R('js/views/settings.js');
  assert.equal((S.match(/id="ai-key" type="password" autocomplete="new-password"/g) || []).length, 2, 'both key boxes');
  assert.equal((S.match(/if\(!aiKeyLooksRight\(key\)\)/g) || []).length, 2, 'both saves ask');
  const re = /^sk-ant-\S{4,}$/;
  assert.ok(re.test('sk-ant-api03-abcdefghijk'));
  assert.ok(!re.test('Summer2026!'));
  const I = R('js/i18n.js');
  assert.equal((I.match(/set_key_not_a_key:/g) || []).length, 2, 'in both books');
});

test('f420 (5) the Advice desk escapes quote marks', () => {
  for (const f of ['js/views/advice.js', 'js/views/adviceportal.js']) {
    const src = R(f);
    const m = /const p?esc = s => String\(s==null\?'':s\)\.replace\(\/\[&<>"'\]\/g/.exec(src);
    assert.ok(m, f + ' escapes " and \'');
  }
});

test('f420 (6) the Insights chat bubble removes scripts and event handlers', () => {
  const w = buildWorld();
  const I = R('js/views/intelligence.js');
  const src = region(I, "const IG_UNSAFE_TAGS", '\n}\n') + '\n}';
  const esc = "const igEsc = s => String(s??'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));";
  const safe = new w.win.Function(esc + src + '; return igSafeHtml;')();
  const out = safe('<b>ok</b><img src=x onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">x</a>');
  assert.match(out, /<b>ok<\/b>/, 'formatting passes');
  assert.ok(!/onerror|<script|javascript:/i.test(out), out);
  assert.match(I, /\$\{igSafeHtml\(m\.text\)\}\$\{cites\}/, 'the bubble draws through it');
  assert.match(I, /applyTemplateResult\(res\.ranked, igFmtRich\(res\.answer\|\|''\)\.html\)/, 'the template ranking no longer pushes the model’s text raw');
});

test('f420 (7) each overnight job asks its own limit before every call', () => {
  /* RE-POINTED ON THE MERGE (28 Sep 2026): main made the two overnight jobs two
     of Copilot's agents, each with its own daily limit an admin sets, under the
     workspace's ceiling (agentMaySpend). That replaces the shared allowance
     this claim first pinned; the fault (a limit read and not counted) is closed
     by the agents' own counting. */
  for (const [fn, k] of [['async function runRenewalPrep()', 'renew'], ['async function runPlaybookPrep()', 'paper']])
    assert.match(region(SRV, fn, '\napp.post('), new RegExp(`const stop = agentMaySpend\\('${k}'\\);`), fn);
});

test('f420 (8) a reminder never reaches someone out of the stream; the held-step mail finds the owner', () => {
  const fn = region(SRV, 'function obligationRecipient(assignee, folder) {', '\n}\n');
  assert.match(fn, /folder !== undefined && !inScope\(folderScopeFor\(u\), folder\)\) return null/);
  const sweep = region(SRV, 'function runReminders()', '\nfunction briefCadence');
  assert.ok(!/obligationRecipient\(o\.assignee\)/.test(sweep), 'every call in the sweep passes the stream');
  assert.ok(!/obligationRecipient\(\(c\.owner/.test(sweep), 'the owner is read off the record, not the database row');
  assert.match(sweep, /const ownerRec = full\.owner/);
});

test('f420 (9) one money detector for Copilot’s history, both hosts', () => {
  const { historyLineHasMoney } = require('../js/metaclean.js');
  for (const t of ['Rebate set to 3%', 'CHF 120,000 agreed', 'Cap 4.8 million', '€ 40 000', 'Deposit changed'])
    assert.ok(historyLineHasMoney(t), t);
  for (const t of ['Signed 27 Sep 2026', 'Shared with Erik Lindqvist', 'Re-filed to Distribution'])
    assert.ok(!historyLineHasMoney(t), t);
  assert.match(SRV, /if \(historyLineHasMoney\(t\)\) \{ redacted\+\+; return false; \}/);
  assert.match(R('js/ai.js'), /window\.historyLineHasMoney\?window\.historyLineHasMoney/);
});

const RICH = '<h2>1. Payment</h2><p>Payment shall be made within thirty (30) days of invoice.</p>'
  + '<h2>2. Insurance</h2><p>The Supplier shall maintain cover of not less than KES 20,000,000.</p>';

test('f420 (10) a revision in words alone does not keep the old markup', () => {
  const fold = region(NEGO, 'live.revisions.push({', 'live.formattingOnly = formattingOnly;');
  assert.match(fold, /else if \(wordsMoved\) delete live\.bodyHtml;/);
});

test('f420 (11) a Discard followed by another filing leaves the history verifying', async () => {
  const w = buildWorld({ negotiationView: true, contractView: true });
  const win = w.win;
  const c = supplyContract({ redlineText: RICH, format: 'rich' });
  win.negoInit(c);
  const [a, b] = win.negoClauseList(c).map(x => x.clauseId);
  const ours = await win.negoEditClause(c, a, '<p>Payment shall be made within forty-five (45) days of invoice.</p>', { side: 'owner', author: 'Amina Otieno' });
  await tick(); win.negoHandOver(c, { to: 'counterparty', by: 'Amina Otieno' }); await tick();
  await win.negoEditClause(c, a, '<p>Payment shall be made within sixty (60) days of invoice.</p>', { side: 'owner', author: 'Amina Otieno' });
  await tick();
  await win.negoEditClause(c, b, '<p>The Supplier shall maintain cover of not less than KES 30,000,000.</p>', { side: 'owner', author: 'Amina Otieno' });
  win.negoRetractDraft(c, ours.id, { side: 'owner', by: 'Amina Otieno' });
  const v = await win.verifyChangeChain(c);
  assert.equal(v.ok, true, JSON.stringify(v));
  /* and a never-sent draft discarded whole, then another filing */
  const later = c.changes.find(x => x.clauseId === b);
  win.negoRetractDraft(c, later.id, { side: 'owner', by: 'Amina Otieno' });
  await win.negoEditClause(c, b, '<p>The Supplier shall maintain cover of not less than KES 25,000,000.</p>', { side: 'owner', author: 'Amina Otieno' });
  const v2 = await win.verifyChangeChain(c);
  assert.equal(v2.ok, true, JSON.stringify(v2));
});

test('f420 (12) a paper filing verifies against its scan and is named as paper', () => {
  const fn = region(CORE, 'async function verifySeal(c){', '\nfunction downloadFile');
  assert.match(fn, /c\.execution\.method==='paper'/);
  assert.match(fn, /ph!==c\.hash/);
  assert.ok(fn.indexOf("method==='paper'") < fn.indexOf('co_no_snapshot'), 'asked before the text snapshot is demanded');
  const ev = region(CORE, 'function downloadEvidence(c){', 'signedCopy: outside&&sc');
  assert.ok(ev.indexOf("method==='paper'") < ev.indexOf('migrated in as a record'), 'a paper filing is not called migrated');
  assert.equal((R('js/i18n.js').match(/co_seal_valid_paper:/g) || []).length, 2);
});
