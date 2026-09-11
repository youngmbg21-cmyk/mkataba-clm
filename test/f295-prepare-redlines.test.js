/* f295 — "PREPARE REDLINES": COPILOT PRE-WRITES THE REDLINES ON INCOMING PAPER
   ========================================================================
   WORKORDER-contract-graph-nodes.md Part B (A12), 11 Sep 2026. One press on
   the negotiation page runs the playbook review HaTi already has and files
   every proposed wording as a draft of OURS, unsent, one card each.

   THE RULES PINNED HERE, and each is a way of failing the owner's prompt:
   one door (a More-menu row, gated like its neighbours, never on an executed
   contract); it asks before it spends and a refusal writes nothing; the
   review is the existing one and the filing is the existing one — never
   negoFileChange or changes.push from this code; never a fallback filed;
   nothing sent; every proposal recorded; one toast with the counts; and a
   second press files nothing new because the WALLS refuse it, not because
   this code pre-filtered. WHAT DRAWS is prepare-redlines-verify (browser). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const VIEW = read('js/views/negotiation.js'), PB = read('js/playbook.js'), I18N = read('js/i18n.js');
function bodyOf(src, name){ const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); let j = src.indexOf('{', i), d = 0;
  for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(j, k + 1); } throw new Error(name); }
const RUN = strip(bodyOf(VIEW, 'rlPrepareRedlines'));

const ME = { id: 'u_me', name: 'Young Mbagaya', role: 'legal', email: 'y@w.co.ke' };
const BODY =
  '<h1>Supply Agreement</h1><p>Between Highland Corporate Ltd and Nordkust Industri AB</p>'
  + '<h2>1. Supply</h2><p>The Supplier shall supply the goods to the specification.</p>'
  + '<h2>2. Payment</h2><p>The Buyer shall pay each undisputed invoice within sixty (60) days of receipt.</p>'
  + '<h2>3. Confidentiality</h2><p>Each party shall keep the other\'s information confidential.</p>';
const contract = (over = {}) => ({ id: 'MK-A12', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
  status: 'Under Review', folder: 'proc', source: 'upload', fields: {}, metadata: {}, audit: [], rounds: [],
  versions: [], signatures: [], comments: [], value: 480000, redlineText: BODY, format: 'rich',
  upload: { name: 'x.docx', extractedText: 'x'.repeat(200) }, ...over });

function world(opts = {}){
  const w = buildWorld({ user: ME, negotiationView: true, contractView: true, playbook: true });
  const win = w.win;
  win.state = { settings: {}, contracts: [] };
  win.getUsers = () => [ME]; win.userById = () => ME;
  win.saveSettings = () => {}; win.persist = () => {};
  w.toasts = []; win.toast = (m, k) => w.toasts.push({ kind: k || 'ok', text: String(m) });
  w.asked = 0; win.confirmDialog = async () => { w.asked++; return opts.refuse ? false : true; };
  w.reviews = 0;
  /* The review, scripted: a deviation that LOCATES clause 2 (edit), a standard
     the scan found nowhere (add, with the library's own preferred wording),
     and a deviation nobody could place (unplaced). */
  win.runPlaybookReview = async c => { w.reviews++; return { key: 'supply', label: 'Supply', source: 'ai', verdicts: [
    { category: 'Payment terms', status: 'deviation', quote: 'pay each undisputed invoice within sixty (60) days', position: '≤ 45 days',
      redline: 'The Buyer shall pay each undisputed invoice within forty-five (45) days of receipt.', escalate: false },
    { category: 'Data protection', status: 'missing', quote: '', position: 'Data protection clause', redline: '', escalate: false },
    { category: 'Liability cap', status: 'deviation', quote: 'a sentence the contract does not carry anywhere at all', position: 'cap', redline: 'Liability is capped.', escalate: true },
    { category: 'Confidentiality', status: 'aligned', quote: 'keep the other\'s information confidential' },
  ] }; };
  /* One library position with the workspace's own preferred wording (the ADD
     files THAT, never the model's draft), and none for the others. */
  win.clauseLibrary = () => [{ id: 'cl-dp', category: 'Data protection', name: 'Data protection', preferred: 'Each party shall comply with the Data Protection Act.', fallback: 'A weaker line.' }];
  return w;
}
const draftsOf = (win, c) => (c.changes || []).filter(x => x.status === 'pending' && x.authorSide === 'owner' && !x.withdrawn);

describe('f295 — the one door and its gate', () => {
  test('the row is in the More menu beside the playbook pass and the memo, through opts.menuRow, on the same gate', () => {
    const i = VIEW.indexOf("const mayMenu = !_rvPosture"); assert.ok(i > 0);
    const row = VIEW.slice(i, i + 4800);
    assert.ok(/rlPrepareRowHtml\(c, preview\)/.test(row), 'the row exists, built beside its neighbours');
    assert.ok(/mayMenu && !\(window\.negoExecuted && negoExecuted\(c\)\) \? rlPrepareRowHtml\(c, preview\)/.test(row), 'same gate as its neighbours, and NOT DRAWN on an executed contract');
    assert.ok(/data-rl-memo/.test(row) && /data-rl-pbreview/.test(row), 'beside the memo and the playbook pass');
    const html = bodyOf(VIEW, 'rlPrepareRowHtml');
    assert.ok(/data-rl-prepare/.test(html), 'and carries its own attribute');
    assert.ok(/ng_preview_dead/.test(html) && /data-rl-dead="1"/.test(html), 'dead in the counterparty preview, the row beside it\'s own treatment');
    assert.ok(/negoWordingFrozen/.test(html) && /ng_prepare_dead_frozen/.test(html), 'greyed with the reason where a signature froze the wording');
    assert.ok(/playbookText\(c\)/.test(html) && /PB_TEXT_MIN/.test(html) && /ng_prepare_dead_unreadable/.test(html), 'greyed where there is nothing readable — the playbook runner\'s OWN floor');
  });
  test('the floor is named once in js/playbook.js and the runner reads it', () => {
    assert.ok(/const PB_TEXT_MIN=120;/.test(PB));
    assert.ok(/function playbookText\(c\)/.test(PB));
    assert.ok(/async function runPlaybookReview\(c,opts=\{\}\)\{\s*const text = playbookText\(c\);\s*if\(!text \|\| text\.length<PB_TEXT_MIN\)/.test(PB), 'one reading, two readers');
    assert.ok(/PB_TEXT_MIN,playbookText,/.test(PB), 'both published');
  });
  test('the row is wired where its neighbours are and the press repaints the column', () => {
    assert.ok(/\[data-rl-prepare\]'\)\?\.addEventListener\('click', \(\) =>\s*rlPrepareRedlines\(c, \(\) => renderRedline\(\)\)\)/.test(VIEW));
  });
  test('the row draws dead where the reader cannot press it, and not at all on an executed contract', () => {
    const w = world(); const win = w.win;
    const live = win.rlPrepareRowHtml(contract(), false);
    assert.ok(/data-rl-prepare/.test(live) && !/data-rl-dead/.test(live), 'live on a readable draft');
    assert.ok(/data-rl-dead="1"/.test(win.rlPrepareRowHtml(contract(), true)), 'dead in the preview');
    const short = contract({ redlineText: '', format: null, upload: { name: 'x.docx', extractedText: 'too short' } });
    assert.ok(/data-rl-dead="1"/.test(win.rlPrepareRowHtml(short, false)) && /ng_prepare_dead_unreadable|readable/.test(win.rlPrepareRowHtml(short, false)), 'dead with the reason where nothing is readable');
    /* A LIGHT ROW IS NOT AN EMPTY ONE: the list strips an upload's text, so
       greying on it would refuse a readable contract before the press. */
    assert.ok(!/data-rl-dead/.test(win.rlPrepareRowHtml(Object.assign(short, { _light: true }), false)), 'live on a light row — unknown is not nothing');
    assert.ok(/ensureFull\(c\)/.test(RUN), 'and the press loads the whole record before it reads');
  });
});

describe('f295 — it asks before it spends, and a refusal writes nothing', () => {
  test('refusing the dialog runs no review, files nothing and says nothing', async () => {
    const w = world({ refuse: true }); const c = contract(); w.win.state.contracts.push(c);
    const out = await w.win.rlPrepareRedlines(c);
    assert.equal(w.asked, 1, 'it asked');
    assert.equal(out, null); assert.equal(w.reviews, 0, 'and did not spend');
    assert.equal((c.changes || []).length, 0); assert.equal(w.toasts.length, 0);
    assert.ok(!c.playbook, 'no review on the record either');
  });
  test('the dialog names the cost, or says the review is on file and the press costs nothing', async () => {
    assert.ok(/ng_prepare_ask_stored/.test(RUN) && /ng_prepare_ask/.test(RUN) && /confirmDialog\(/.test(RUN));
    assert.ok(/one deep Copilot call/.test(I18N) && /costs nothing/.test(I18N));
    const w = world(); const c = contract({ playbook: { key: 'supply', label: 'Supply', source: 'ai', verdicts: [
      { category: 'Data protection', status: 'missing', redline: '' } ] } });
    w.win.state.contracts.push(c);
    let msg = ''; w.win.confirmDialog = async o => { msg = o.message; return true; };
    await w.win.rlPrepareRedlines(c);
    assert.equal(w.reviews, 0, 'a review already on file is USED — the overnight half\'s whole point');
    assert.equal(msg, w.win.i18t('ng_prepare_ask_stored'));
  });
});

describe('f295 — the review is the existing one, the filing is the existing one', () => {
  test('one press files the located deviation and the missing standard as unsent drafts of ours, skips the unplaced one, and says so once', async () => {
    const w = world(); const c = contract(); w.win.state.contracts.push(c);
    const out = await w.win.rlPrepareRedlines(c);
    assert.equal(w.reviews, 1, 'one deep call');
    assert.equal(out.filed, 2, 'edit + add'); assert.equal(out.unplaced, 1); assert.equal(out.here, 0); assert.equal(out.refused, 0);
    const drafts = draftsOf(w.win, c);
    assert.equal(drafts.length, 2);
    const edit = drafts.find(x => x.changeType === 'modify'), add = drafts.find(x => x.changeType === 'insertClause');
    assert.ok(edit && /forty-five/.test(edit.newText), 'the located clause is EDITED with Copilot\'s fitted draft (no library wording for it)');
    assert.ok(add && /Data Protection Act/.test(add.newText || add.bodyHtml || ''), 'the missing standard is ADDED with the library\'s PREFERRED wording');
    assert.ok(!/weaker line/i.test(JSON.stringify(c.changes)), 'the fallback is never filed');
    assert.ok(drafts.every(x => x.authorSide === 'owner' && x.author === ME.name), 'drafts of OURS');
    assert.equal(w.win.negoUnsentAsks(c, 'owner').length, 2, 'and UNSENT — both still wait on Send');
    assert.ok(!c.negotiation.turnAt, 'the turn never moved');
    assert.ok(c.playbook && c.playbook.verdicts.length === 4, 'the review is on the record, as the review window leaves it');
    assert.equal(w.toasts.length, 1); assert.equal(w.toasts[0].kind, 'ok');
    assert.match(w.toasts[0].text, /^2 drafts filed under Your drafts — nothing sent · 1 could not be placed$/);
    const line = c.audit.find(a => /Redlines prepared/.test(a.detail));
    assert.ok(line && /2 drafts filed unsent, 0 already here, 1 not placed/.test(line.detail), 'one English audit line naming the counts');
  });
  test('a second press files nothing new — the duplicate wall and the funnel\'s "nothing changed" refuse, and the toast says "already here"', async () => {
    const w = world(); const c = contract(); w.win.state.contracts.push(c);
    await w.win.rlPrepareRedlines(c);
    const before = JSON.stringify(c.changes.map(x => [x.id, x.status, x.hash]));
    const out = await w.win.rlPrepareRedlines(c);
    assert.equal(w.reviews, 1, 'the review on file is reused — no second spend');
    assert.equal(out.filed, 0); assert.equal(out.here, 2, 'both refused by the walls, counted as already here'); assert.equal(out.unplaced, 1);
    assert.equal(JSON.stringify(c.changes.map(x => [x.id, x.status, x.hash])), before, 'the record did not move');
    assert.equal(w.toasts[1].kind, 'warn');
    assert.match(w.toasts[1].text, /^No drafts were filed — 2 already here · 1 could not be placed$/);
  });
  test('every proposal is recorded for the acceptance metrics as a playbook proposal, at the press', async () => {
    const w = world(); const c = contract(); w.win.state.contracts.push(c);
    await w.win.rlPrepareRedlines(c);
    const tr = (c.aiTrace || []).filter(e => e.feature === 'playbook');
    /* ONE, and why: the missing standard filed the LIBRARY's wording and
       carried no draft, and the unplaced deviation is skipped before anything
       is recorded — the scan rail never draws one, so recording it here would
       count a proposal no person was ever shown. */
    assert.equal(tr.length, 1);
    const edit = tr.find(e => e.clauseId);
    assert.ok(edit && ['as-is', 'edited', 'proposed'].includes(edit.outcome), 'the edit\'s draft went in: ' + (edit && edit.outcome));
    assert.equal(edit.outcome, 'as-is', 'filed word for word, settled by the funnel');
  });
  test('never a fallback, never a second filing path, never anything sent', () => {
    assert.ok(/it\.preferred \|\| it\.draft/.test(RUN), 'the same choice as the review window\'s lead button');
    assert.ok(!/it\.fallback\b/.test(RUN.replace(/n\.fallback/g, '')), 'the fallback wording is never read for filing');
    for (const bad of ['negoFileChange', 'changes.push', 'negoInsertClause', 'negoEditClause', 'negoAddNamedClause'])
      assert.ok(!RUN.includes(bad), 'never ' + bad + ' from here — rlFilePlaybookProposal is the one door');
    assert.ok(/rlFilePlaybookProposal\(c, it, words, bag\)/.test(RUN));
    for (const bad of ['turnAt', 'nego-send', 'reshareToLastRecipient', 'negoHandOver', 'negoAdvanceRound', 'buildSharePayload', "api('shares", 'onSendDirect'])
      assert.ok(!RUN.includes(bad), 'nothing is sent: ' + bad);
    assert.ok(/rlPlaybookProposals\(c, rev\)/.test(RUN) && /runPlaybookReview\(c\)/.test(RUN), 'the existing reading and the existing review');
  });
  test('rlFilePlaybookProposal\'s opts are additive — no opts, no change', () => {
    const file = VIEW.slice(VIEW.indexOf('async function rlFilePlaybookProposal'), VIEW.indexOf('async function rlOpenPlaybookReview'));
    assert.ok(/opts && typeof opts === 'object'\) opts\.refused = bag\.refused/.test(file));
    assert.ok(/!\(opts && opts\.quiet\) && window\.toast\) toast\(bag\.refused\.message, 'err'\)/.test(file), 'the red box still draws for every caller written before');
    assert.equal((VIEW.match(/rlFilePlaybookProposal\(c, it, /g) || []).length, 2, 'the review window and this press — and the scan rail in its own file');
  });
});

describe('f295 — the words', () => {
  test('both languages, and the sentence says nothing is sent', () => {
    for (const k of ['ng_prepare', 'ng_prepare_title', 'ng_prepare_dead_frozen', 'ng_prepare_dead_unreadable', 'ng_prepare_ask', 'ng_prepare_ask_stored',
      'ng_prepare_go', 'ng_prepare_filed_one', 'ng_prepare_filed_other', 'ng_prepare_here', 'ng_prepare_unplaced', 'ng_prepare_refused', 'ng_prepare_fallback', 'ng_prepare_none'])
      assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k);
    assert.ok(/Nothing is sent until you send it/.test(I18N) && /Inget skickas förrän du skickar det/.test(I18N));
  });
});
