/* ============================================================
   f308 — THE CHECK BEFORE A CONTRACT IS SIGNED
   ============================================================
   WORKORDER-pre-signature-check.md, Part A, phases 1 to 5. Built 13 Sep 2026
   on the owner's go. The owner's own words: *"once any contract is ready for
   signing, it should have another sweep to see where it stands against company
   policy and any new obligations."*

   WHY IT EXISTS. A contract is read when it ARRIVES from outside and never
   read again — but the wording that gets signed is not the wording that
   arrived. Rounds of redlines move clauses, add promises and change figures the
   record may not have followed.

   Every claim below is a MEASUREMENT of the reading or a driven press, never a
   description of a shape. The walls are the ones the work order names: it
   spends nothing, it writes nothing, it decides nothing, and an absence is
   stated rather than guessed.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const SIGNCHECK = read('js/signcheck.js');
const CONTRACT = read('js/views/contract.js');
const SERVER = read('server/server.js');
const I18N = read('js/i18n.js');

const TEXT = 'This Supply Agreement is made between Highland Corporate Ltd and Nordkust Industri AB. '
  + '1. Supply. The Supplier shall supply the goods to the agreed specification. '
  + '2. Payment. The Buyer shall pay each undisputed invoice within 60 days of receipt. '
  + '3. Governing law. This Agreement is governed by the laws of California. ';

function contract(over = {}){
  return { id: 'MK-308', name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB',
    counterpartyEmail: 'ola@nordkust.se', status: 'Under Review', source: 'upload',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], changes: [], obligations: [],
    value: 4800000, valueType: 'estimated',
    upload: { name: 'supply.docx', extractedText: TEXT }, ...over };
}
/* A world with the signing door's reading on it, and the two stand-ins it
   needs to answer at all: the contract has to be AT the door (a route with a
   signer on each side) or the whole card draws nothing, which is the point. */
function bench(over = {}, ready = true){
  const w = buildWorld({ signcheck: true, contractView: true });
  const { win } = w;
  const c = contract(over);
  /* A BRIEF ON FILE, NEWER THAN ANY CHANGE (15 Sep 2026). The brief joined the
     check that day, and a contract with none draws a row saying so — true, and
     noise in every test here that is about a different row. A bench contract
     heading for signature is one somebody has read, so it carries one; the
     tests that are ABOUT the brief take it away or age it themselves. */
  if (!Object.prototype.hasOwnProperty.call(over, '_brief'))
    c._brief = { v: 1, at: new Date(Date.now() + 60000).toISOString(), by: 'Bench', truncated: false, data: {} };
  /* AND IT HAS BEEN READ (21 Sep 2026). Reading the brief became the last
     thing before a signature and it HOLDS, so a bench contract heading for
     signature has read it — the same reasoning as the brief above. f353 drives
     that row on its own; nothing here is about it. */
  try{ if(win.briefMarkRead && c._brief) win.briefMarkRead(c, win.currentUser && win.currentUser()); }catch(_){}
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, settings: win.state && win.state.settings || {} });
  win.getContract = id => (id === c.id ? c : null);
  win.canViewValues = () => true;
  win.signingRouteOpen = () => ready;
  return { w, win, c };
}

describe('f308 (1) — the standards review remembers what it read', () => {
  test('the reading is one function, and an older review says "we do not know"', () => {
    const { win, c } = bench();
    /* A review filed before any of this existed. It is not fresh and it is not
       stale either, and printing the second would be inventing a fact. */
    c.playbook = { label: 'Default', verdicts: [] };
    assert.equal(win.playbookStale(c), null, 'no hash on file: unknown');
    /* One that recorded the wording it read, and the wording has not moved. */
    c.playbook.wordingHash = win.playbookHashOf(win.playbookText(c));
    assert.equal(win.playbookStale(c), false, 'it read this wording');
    /* And now the wording moves. */
    c.upload.extractedText = TEXT + ' 4. Data protection. Each party shall process personal data lawfully and shall notify the other within seventy-two hours of any breach affecting the other party.';
    assert.equal(win.playbookStale(c), true, 'it read something else');
  });

  test('the stamp is written where the review is BUILT, not at the stores', () => {
    const code = strip(read('js/playbook.js'));
    assert.match(code, /const stamp = r =>/, 'one stamper');
    /* `key:std.key` since fix 3 (23 Sep 2026): the model's branch is asked
       every standard on the page, and the key comes with that list. */
    assert.match(code, /return stamp\(\{ key:std\.key/, 'the model\'s branch');
    assert.match(code, /return stamp\(playbookReviewHeuristic\(c, text\)\)/, 'and the heuristic\'s');
  });
});

describe('f308 (2) — signCheck is the one reading of where it stands', () => {
  /* ---- REVERSED IN PLACE 15 Sep 2026 (Young: "how do you trigger running the
     brief again, the standard checks, and the obligations once more before you
     sign?") ----
     This pinned "no signer named, no check", which is what HID the three
     readings and the Run control until an unrelated box was ticked — the list
     understated its own length every time. Reading a contract does not require
     knowing who will sign it. THE CLAIM THE OLD ONE WAS REALLY MAKING — the
     check draws nothing where there is nothing to check — is kept and asked of
     the two states that still mean it: a sealed record and a dead one. */
  test('it draws on a live contract, sealed or dead it draws nothing', () => {
    const { win, c } = bench({}, false);
    assert.equal(win.signCheck(c).ready, true,
      'no signer named is a ROW in the list, never a condition on the list');
    c.status = 'Signed';
    assert.equal(win.signCheck(c).ready, false, 'a signed record has nothing left to check');
    c.status = 'Declined';
    assert.equal(win.signCheck(c).ready, false, 'and neither has a dead one');
    assert.equal(win.signCheckCardHtml(c), '', 'and then no card');
  });

  test('no playbook saved is its own answer, never "fine"', () => {
    const { win, c } = bench();
    win.resolvePlaybook = () => null;
    const s = win.signCheck(c).standards;
    assert.equal(s.none, true);
    assert.equal(s.open, 0);
  });

  test('a playbook with nothing read against it says so', () => {
    const { win, c } = bench();
    win.resolvePlaybook = () => ({ label: 'Default', positions: [{ category: 'Payment terms' }] });
    const s = win.signCheck(c).standards;
    assert.equal(s.none, false);
    assert.equal(s.unread, true, 'nothing has read this contract');
  });

  test('an unaccepted departure is open; accepting it in writing closes it', () => {
    const { win, c } = bench();
    win.resolvePlaybook = () => ({ label: 'Default', positions: [{ category: 'Payment terms' }] });
    c.playbook = { label: 'Default', wordingHash: win.playbookHashOf(win.playbookText(c)), verdicts: [
      { category: 'Payment terms', status: 'deviation', position: '<= 45 days', quote: 'within 60 days' },
      { category: 'Confidentiality', status: 'aligned' }] };
    assert.equal(win.signCheck(c).standards.open, 1);
    /* THE INDEX IS THE VERDICT'S OWN POSITION, taken before the filter — an
       index into the filtered list would stamp the reason onto the wrong one. */
    const f = win.signCheck(c).standards.findings[0];
    assert.equal(f.i, 0);
    c.playbook.verdicts[f.i].accepted = { by: 'Wanjiru Kamau', at: new Date().toISOString(), why: 'Traded in round 2.' };
    const after = win.signCheck(c).standards;
    assert.equal(after.open, 0, 'accepted, and it stops holding anything up');
    assert.equal(after.findings[0].accepted.why, 'Traded in round 2.', 'with its reason kept');
  });

  test('obligations: unread is a real answer, and so is "we do not know"', () => {
    const { win, c } = bench();
    assert.equal(win.signCheck(c).obligations.unread, null, 'nothing has ever read it');
    c.obligationsReadHash = win.playbookHashOf(win.playbookText(c));
    assert.equal(win.signCheck(c).obligations.unread, false, 'read from this wording');
    c.upload.extractedText = TEXT + ' 4. The Supplier shall indemnify the Buyer against all third-party claims arising from any defect in the goods supplied under this Agreement.';
    assert.equal(win.signCheck(c).obligations.unread, true, 'and the wording moved after it');
  });

  test('the record rows agree, disagree, or say the paper is silent', () => {
    const { win, c } = bench();
    c.metadata = { value: 4800000, counterparty: 'Nordkust Industri AB' };
    const rows = win.signCheck(c).record.rows;
    const by = k => rows.find(r => r.field === k);
    assert.equal(by('value').agrees, true, 'the same figure, written differently, is the same figure');
    assert.equal(by('counterparty').agrees, true);
    assert.equal(by('expiryDate').unknown, true, 'the paper says nothing about it');
    assert.equal(by('expiryDate').agrees, null, 'so it agrees with nothing');
    c.metadata.value = 5200000;
    assert.equal(win.signCheck(c).record.open, 1, 'and a real disagreement is one open row');
  });

  test('keeping the record is an answer too', () => {
    const { win, c } = bench();
    c.metadata = { value: 5200000 };
    assert.equal(win.signCheck(c).record.open, 1);
    c.recordAccepted = { value: { by: 'Wanjiru Kamau', at: new Date().toISOString() } };
    assert.equal(win.signCheck(c).record.open, 0, 'kept, and nothing is held up');
  });

  /* MONEY ONLY WHERE THE READER MAY SEE VALUES — not drawn at all rather than
     drawn as dashes, which is the product's own rule. */
  test('a reader who may not see values is shown no value row', () => {
    const { win, c } = bench();
    c.metadata = { value: 5200000 };
    win.canViewValues = () => false;
    assert.equal(win.signCheck(c).record.rows.some(r => r.field === 'value'), false);
  });

  /* READING MUST NOT WRITE. This is asked on every paint of the Signing tab. */
  test('the reading leaves the record byte-identical', () => {
    const { win, c } = bench();
    c.playbook = { label: 'Default', verdicts: [{ category: 'Payment terms', status: 'deviation' }] };
    const before = JSON.stringify(c);
    win.signCheck(c); win.signCheckCardHtml(c);
    assert.equal(JSON.stringify(c), before);
  });

  test('and it starts no negotiation on a contract that has none', () => {
    const { win, c } = bench();
    assert.equal(c.negotiation, undefined);
    win.signCheck(c);
    assert.equal(c.negotiation, undefined, 'negoOpenPoints is asked only where one exists');
  });

  test('it spends nothing and asks no route', () => {
    const code = strip(SIGNCHECK);
    assert.doesNotMatch(code, /fetch|api\(|\/api\/|anthropic|copilot/i);
  });
});

describe('f308 (3) — the card, and its acts', () => {
  function ready(win, c){
    win.resolvePlaybook = () => ({ label: 'Default', positions: [{ category: 'Payment terms' }] });
    c.playbook = { label: 'Default', wordingHash: win.playbookHashOf(win.playbookText(c)), verdicts: [
      { category: 'Payment terms', status: 'deviation', position: '<= 45 days', quote: 'within 60 days' }] };
    c.metadata = { value: 5200000 };
    return win.signCheckCardHtml(c);
  }
  /* RE-POINTED 13 Sep 2026 (the signing flow rebuilt): the four tiles are
     gone — the card is the one list, a row per thing to settle, in the
     arrival strip's card shape. */
  test('one list, a row per thing to settle, in the arrival strip\'s own card', () => {
    const { win, c } = bench();
    const html = ready(win, c);
    assert.match(html, /id="sign-check"/);
    assert.match(html, /class="kt-tri/, 'it borrows the shape rather than forking it');
    assert.equal((html.match(/class="kt-tri-tile"/g) || []).length, 0, 'no tiles');
    assert.match(html, /data-sc-row="std:0"/, 'the departure is a row');
    assert.match(html, /data-sc-row="rec:value"/, 'and so is the record disagreement');
  });

  test('every finding carries the door that settles it', () => {
    const { win, c } = bench();
    const html = ready(win, c);
    assert.match(html, /data-sc-accept="0"/, 'accept the departure, with a reason');
    assert.match(html, /data-sc-clause="0"/, 'or go and read the clause');
    assert.match(html, /data-sc-fix="value"/, 'fix the record');
    assert.match(html, /data-sc-keep="value"/, 'or keep it as it stands');
  });

  /* "WE DO NOT KNOW" IS NOT "WRONG": an unread contract and a clean one must
     not look alike, and neither may an unread one look like a failure. */
  test('an unread contract is a quiet row with the door, not a ruby mark', () => {
    const { win, c } = bench();
    win.resolvePlaybook = () => ({ label: 'Default', positions: [{ category: 'Payment terms' }] });
    const html = win.signCheckCardHtml(c);
    const row = /<div class="sc-find[^"]*" data-sc-row="standards-read">[\s\S]*?<\/div>\s*<\/div>/.exec(html);
    assert.ok(row, 'the unread row is drawn');
    /* It HOLDS since the owner's ruling of 13 Sep 2026 (the check has to have
       been run before signing) — amber, never the escalation's ruby. */
    assert.match(row[0], /sc-mark is-hold/, 'held until the check runs — neither wrong nor fine, but not signable');
    assert.doesNotMatch(row[0], /is-esc/);
    assert.match(row[0], /data-sc-run="1"/, 'and it carries the run control');
  });

  test('the card computes nothing — signCheck does', () => {
    const m = /function signCheckCardHtml\(c\)\{[\s\S]*?\n\}/.exec(strip(CONTRACT));
    assert.ok(m);
    assert.match(m[0], /signCheck\(c\)/, 'it asks the one reading');
    assert.doesNotMatch(m[0], /\.filter\(v =>|verdicts\.filter/, 'and does none of its own');
  });
});

describe('f308 (4) — the sweep runs only what is out of date', () => {
  const code = () => strip(CONTRACT);
  test('it asks before it spends, naming what it will do', () => {
    const m = /async function runSignCheck\([\s\S]*?\n\}/.exec(code());
    assert.ok(m, 'the sweep exists');
    assert.match(m[0], /confirmDialog/, 'one confirm');
    assert.match(m[0], /sc_will_standards/, 'naming the standards read');
    assert.match(m[0], /sc_will_obligations/, 'and the obligations read');
  });
  /* ---- RE-POINTED IN PLACE, 17 Sep 2026 ----
     The three conditions were written out inside runSignCheck and pinned
     there. They are unchanged and they have ONE home now: signCheckWillRun,
     because the button says how many readings the press makes and a count
     that disagrees with the press is worse than no count. So the claim is the
     same claim at its new address, and a SECOND claim is added below — that
     runSignCheck asks that reading rather than keeping a copy — which is the
     wall the move exists to build. */
  test('the standards read runs only where the review is stale or absent', () => {
    const m = /function signCheckWillRun\([\s\S]*?\n\}/.exec(strip(SIGNCHECK));
    assert.ok(m, 'the one reading exists');
    assert.match(m[0], /out\.standards\s*=\s*std\.unread\s*===\s*true\s*\|\|\s*std\.stale\s*!==\s*false/);
    assert.match(m[0], /out\.obligations\s*=\s*ob\.unread\s*!==\s*false/);
    assert.match(m[0], /out\.brief\s*=\s*brief\.none\s*===\s*true/, 'and the brief joined them');
  });
  test('and the sweep asks that one reading rather than keeping a copy', () => {
    const m = /async function runSignCheck\([\s\S]*?\n\}/.exec(code());
    assert.match(m[0], /signCheckWillRun\(r\)/, 'the press reads what the button printed');
    assert.match(m[0], /wantBrief\s*=\s*will\.brief/, 'and spends its answer');
  });
  /* A CUT-SHORT ANSWER IS NOT A CHECK. */
  test('the stamp is written only where everything came back', () => {
    const m = /async function runSignCheck\([\s\S]*?\n\}/.exec(code());
    assert.match(m[0], /if\(all&&ran\) signCheckStamp\(c\)/);
  });
  test('and it goes through the readings that already exist', () => {
    const m = /async function runSignCheck\([\s\S]*?\n\}/.exec(code());
    assert.match(m[0], /runPlaybookReview\(c/, 'the same review the panel runs');
    assert.match(m[0], /runFindObligations\(c/, 'and the same obligations dialog');
    assert.doesNotMatch(m[0], /ai\/playbook|ai\/obligations/, 'never a route of its own');
  });
});

describe('f308 (5) — the gate, advise by default (re-pointed 13 Sep 2026)', () => {
  /* The default moved from off to advise when the signing flow was rebuilt:
     an ESCALATED departure holds; an ordinary one is shown and acceptable. */
  test('advise is the default, and an ordinary departure holds nothing once the check has run', () => {
    const { win, c } = bench();
    assert.equal(win.signCheckGate(), 'advise');
    win.resolvePlaybook = () => ({ label: 'D', positions: [{ category: 'Payment terms' }] });
    const hash = win.playbookHashOf(win.playbookText(c));
    c.playbook = { label: 'D', wordingHash: hash, verdicts: [{ category: 'Payment terms', status: 'deviation' }] };
    /* The sweep has run against this wording (13 Sep 2026: an unrun check
       holds) — so what it FOUND is the only question, and an ordinary
       departure is shown, not held. */
    c.obligationsReadHash = hash;
    c.signCheck = { at: new Date().toISOString(), by: 'W', wordingHash: hash };
    assert.equal(win.signCheckBlocker(c), null);
  });
  test('off holds nothing, even an escalated departure', () => {
    const { win, c } = bench();
    win.state.settings.signCheckGate = 'off';
    win.resolvePlaybook = () => ({ label: 'D', positions: [{ category: 'Payment terms' }] });
    c.playbook = { label: 'D', verdicts: [{ category: 'Payment terms', status: 'deviation', escalate: true }] };
    assert.equal(win.signCheckBlocker(c), null);
  });
  test('require holds the signature, and accepting it lets it go', () => {
    const { win, c } = bench();
    win.state.settings.signCheckGate = 'require';
    win.resolvePlaybook = () => ({ label: 'D', positions: [{ category: 'Payment terms' }] });
    c.playbook = { label: 'D', wordingHash: win.playbookHashOf(win.playbookText(c)),
      verdicts: [{ category: 'Payment terms', status: 'deviation' }] };
    const b = win.signCheckBlocker(c);
    assert.ok(b && b.n >= 1, 'it holds');
    c.playbook.verdicts[0].accepted = { by: 'W', at: new Date().toISOString(), why: 'Traded.' };
    c.obligationsReadHash = win.playbookHashOf(win.playbookText(c));
    assert.equal(win.signCheckBlocker(c), null, 'and lets go once it is settled');
  });
  test('it is one row in signBlockers, never a fourth kind of gate', () => {
    const m = /function signBlockers\(c\)\{[\s\S]*?\n\}/.exec(strip(CONTRACT));
    assert.ok(m);
    assert.match(m[0], /signCheckBlocker\(c\)/);
    assert.doesNotMatch(m[0], /deskMay|reviewSendBlock/, 'the desk and the review are not asked here');
  });
  test('the words are in both books', () => {
    for (const k of ['sc_set_title', 'sc_set_off', 'sc_set_advise', 'sc_set_require',
      'sc_blocker_one', 'sc_blocker_short', 'sc_accept_btn', 'sc_keep_btn', 'sc_t_standards'])
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});

describe('f308 (5b) — the server is the wall', () => {
  let h, W;
  const ID = 'MK-SC1';
  before(async () => {
    h = await startHati(); W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
      id: ID, name: 'Signing wall fixture', counterparty: 'Nordkust Industri AB',
      folder: 'dist', status: 'Under Review', fields: {}, metadata: {}, audit: [], rounds: [],
      versions: [], signatures: [], comments: [], changes: [], obligations: [],
      value: 100000, valueType: 'estimated' } } });
  });
  after(async () => { await h.stop(); });
  const put = async patch => {
    const seen = await W.admin.json('/api/contracts/' + ID);
    return W.admin.json('/api/contracts/' + ID, { method: 'PUT',
      body: { contract: { ...seen, ...patch }, baseVersion: seen._v } });
  };
  const gate = v => W.admin.json('/api/settings', { method: 'PUT', body: { signCheckGate: v } });
  const sig = () => [{ name: 'Wanjiru Kamau', email: 'admin@example.co.ke',
    at: new Date().toISOString(), method: 'session-authenticated' }];

  test('with the gate off, a signature saves exactly as it always did', async () => {
    await gate('off');
    await put({ playbook: { label: 'D', verdicts: [{ category: 'Payment terms', status: 'deviation' }] } });
    const r = await put({ signatures: sig() });
    assert.ok(r && !r.error, 'nothing is refused');
    await put({ signatures: [] });
  });

  test('on require it refuses an unaccepted departure, and lets go once accepted', async () => {
    await gate('require');
    await put({ signatures: [],
      playbook: { label: 'D', verdicts: [{ category: 'Payment terms', status: 'deviation' }] } });
    let refused = null;
    try { await put({ signatures: sig() }); } catch (e) { refused = e; }
    assert.ok(refused, 'the save is refused');
    assert.match(String((refused && (refused.message || (refused.body && refused.body.error))) || ''),
      /check before signing/i, 'the wall holds on the route, not only in the browser');
    await put({ playbook: { label: 'D', verdicts: [{ category: 'Payment terms', status: 'deviation',
      accepted: { by: 'Wanjiru Kamau', at: new Date().toISOString(), why: 'Traded in round 2.' } }] } });
    const ok = await put({ signatures: sig() });
    assert.ok(ok && !ok.error, 'and lets go once it is accepted in writing');
    await gate('off');
  });

  test('the refusal is one function, asked at both signing doors', () => {
    assert.equal((SERVER.match(/signCheckRefusal\(/g) || []).length, 3,
      'declared once and asked at the in-app save and at the counterparty\'s respond route');
  });

  /* THE HONEST LIMIT, STATED RATHER THAN DISCOVERED: the wall enforces the two
     questions it can compute exactly from the stored record. */
  test('the server says which half of the check it does not enforce', () => {
    assert.match(SERVER, /it is advisory:\s*\n\s*the card reports it, the wall does not/);
  });
});

describe('f308 (7) — a template’s own promises are written, not read', () => {
  /* Build plan group 4 / work order phase 7. No model, no guesswork, no cost:
     the template knows what it promises and the record knows when. */
  const { buildWorld: bw } = require('./world');
  function tplBench(over = {}){
    const w = bw({ obligations: true, templates: true });
    const { win } = w;
    const c = { id: 'MK-T1', name: 'Raw Material Supply Agreement (Draft)', template: 'RM',
      counterparty: 'Nordkust Industri AB', status: 'Draft', folder: 'proc',
      fields: { effDate: '2026-01-01', payDays: '45' }, metadata: {}, audit: [],
      obligations: [], ...over };
    return { win, c };
  }
  test('it derives the date from the contract’s own fields', () => {
    const { win, c } = tplBench();
    assert.equal(win.mintTemplateObligations(c), 1);
    const o = c.obligations[0];
    assert.equal(o.due, '2026-02-15', '1 January plus the template’s own 45 days');
    assert.match(o.desc, /45 days/, 'and the number is in the words');
    assert.equal(o.party, 'ours', 'we are the Buyer on this paper');
    assert.equal(o.origin, 'template', 'and the reader can see where it came from');
  });

  /* IT REFUSES RATHER THAN GUESSES — the whole reason this is cheap and safe. */
  test('no start date, nothing minted', () => {
    const { win, c } = tplBench({ fields: { payDays: '45' } });
    assert.equal(win.mintTemplateObligations(c), 0);
    assert.equal(c.obligations.length, 0);
  });
  test('no payment days, nothing minted', () => {
    const { win, c } = tplBench({ fields: { effDate: '2026-01-01' } });
    assert.equal(win.mintTemplateObligations(c), 0);
  });
  test('a template with nothing to promise mints nothing', () => {
    const { win, c } = tplBench({ template: 'ND', fields: { effDate: '2026-01-01', payDays: '45' } });
    assert.equal(win.mintTemplateObligations(c), 0);
  });
  test('an uploaded contract has no template and gets nothing', () => {
    const { win, c } = tplBench({ template: null });
    assert.equal(win.mintTemplateObligations(c), 0);
  });

  /* ONCE, NEVER TWICE — through the same duplicate test every other door asks,
     so a duty typed by hand and one written from the template cannot both land. */
  test('it mints once however often it is asked', () => {
    const { win, c } = tplBench();
    assert.equal(win.mintTemplateObligations(c), 1);
    assert.equal(win.mintTemplateObligations(c), 0);
    assert.equal(win.mintTemplateObligations(c), 0);
    assert.equal(c.obligations.length, 1);
  });

  test('a distribution agreement’s credit terms run the other way', () => {
    const { win, c } = tplBench({ template: 'DA', fields: { effDate: '2026-01-01', creditDays: '30' } });
    assert.equal(win.mintTemplateObligations(c), 1);
    assert.equal(c.obligations[0].party, 'theirs', 'they owe us');
  });

  /* AND NO MODEL IS INVOLVED, which is the point of the whole phase. */
  test('nothing here asks a route', () => {
    const code = strip(read('js/templates.js'));
    const m = /function mintTemplateObligations\(c\)\{[\s\S]*?\n\}/.exec(code);
    assert.ok(m);
    assert.doesNotMatch(m[0], /api\(|fetch|ai\/|copilot/i);
  });
});
