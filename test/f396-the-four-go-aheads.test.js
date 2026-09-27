/* ============================================================
   F396 — THE FOUR GO-AHEADS (Young, 27 Sep 2026: "Merge to main and it's a
   yes on the other 3", and, over a screenshot of a renewal's Decide button,
   "the 5 checks … should run all over again so that you can see what they say
   before you go through the steps of deciding.")
   ============================================================
   What this file pins:
     1  THE LIVE SERVER KNOWS IT IS LIVE: render.yaml sets NODE_ENV=production,
        the deployment guide names it, the server needs nothing a production
        install leaves out, and it still answers in production mode
     2  THEIR BELL'S SIGN ROW SAYS WHAT ITS PRESS DOES: the Ready to sign
        button's own sentence, asked by key — "They are waiting for you to
        sign" was not true (nobody asked, and the press does not sign)
     3  THEY AGREED TO THE WORDING: one reading (cpAcceptedWording) that stands
        only while it is the next thing, and a green bell row whose press opens
        the Signing tab
     4  A RENEWAL'S DECIDE READS THE CONTRACT AGAIN: the door registers the ask
        before the room opens, the Overview spends it once on a loaded record,
        the brief is written afresh rather than handed back from its cache, and
        the press says on its hover that Copilot will read it again. And two
        things the re-read put in front of a reader for the first time: a
        signed contract's open-fields tile said "in negotiation", and the head's
        Copilot fact went on saying "Not read yet" above the fresh reading

   RED AT THE PARENT (ce9cc59), measured in a worktree: 21 of 25 FAIL there.
   The four that pass are 1c and 2c [wall] and 1d and 2b [control] — named so
   a green run on them is never read as a finding. 3g first passed there
   VACUOUSLY (a bell with no such row "stands down" too) and is gated on the
   row being drawn first.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
/* Code only — a claim that a name is CALLED must not be satisfied by prose. */
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const RENDER = read('render.yaml');
const DEPLOY = read('DEPLOYMENT.md');
const PKG = JSON.parse(read('package.json') || '{}');
const APP = read('js/app.js');
const CORE = read('js/core.js');
const HOME = read('js/views/home.js');
const CONTRACT = read('js/views/contract.js');
const PORTAL = read('js/views/portal.js');
const TRIAGE = read('js/triage.js');
const I18N = read('js/i18n.js');

/* One function's own region: from its declaration to the next top-level one. */
function fnOf(src, name){
  const at = src.indexOf('function ' + name + '(');
  if (at < 0) return '';
  const next = src.slice(at + 1).search(/\n(?:async )?function [A-Za-z_$]/);
  return src.slice(at, next < 0 ? undefined : at + 1 + next);
}
/* The function ALONE, to its own closing brace — for lifting one into a
   stage. fnOf above runs to the next function and would carry the constants
   declared between them (core.js's status table, which needs its own helper). */
function fnBody(src, name){
  const at = src.indexOf('function ' + name + '(');
  return at < 0 ? '' : src.slice(at, src.indexOf('\n}', at) + 2);
}
const has = (win, name) => typeof win[name] === 'function';
const day = n => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); };
const svAt = I18N.search(/\n\s*sv\s*:\s*\{/);
const EN = I18N.slice(0, svAt), SV = I18N.slice(svAt);
const valOf = (book, k) => { const m = book.match(new RegExp('\\n\\s*' + k + ":\\s*'((?:[^'\\\\]|\\\\.)*)'")); return m ? m[1] : null; };

describe('f396 (1) — the live server knows it is live', () => {
  test('1a render.yaml sets NODE_ENV to production among the service\'s settings', () => {
    const env = RENDER.slice(RENDER.indexOf('envVars:'));
    assert.ok(env.length > 10, 'render.yaml has its envVars block');
    assert.match(env, /- key: NODE_ENV\s*\n\s*value: "?production"?/, 'NODE_ENV: production');
  });
  test('1b the deployment guide names it — in the settings table and in both ways of starting the server', () => {
    assert.match(DEPLOY, /\| `NODE_ENV` \|[^\n]*production/, 'a row in the settings table');
    assert.match(DEPLOY, /Environment=NODE_ENV=production/, 'the systemd unit sets it');
    assert.match(DEPLOY, /NODE_ENV=production [^\n]*node server\/server\.js/, 'and the one-line start does');
  });
  /* [wall] A production install (`npm install` with NODE_ENV=production) leaves
     devDependencies out. That is safe only while the server needs nothing but
     what `dependencies` lists — so every package the server or a shared module
     requires must be there. Passes on both sides; it is here so the day
     somebody requires a test-only package at runtime, the build that breaks
     is this one and not the live one. */
  test('1c [wall] the server requires nothing a production install leaves out', () => {
    const deps = Object.keys(PKG.dependencies || {});
    const builtins = new Set(require('node:module').builtinModules);
    const files = ['server/server.js', ...fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f)];
    const missing = [];
    for (const f of files) {
      for (const m of code(read(f)).matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
        /* `node:` is Node's own, whatever builtinModules lists — node:sqlite
           is prefix-only and is not on that list. */
        if (m[1].startsWith('node:')) continue;
        const name = m[1];
        if (name.startsWith('.') || builtins.has(name) || builtins.has(name.split('/')[0])) continue;
        if (!deps.includes(name.split('/')[0])) missing.push(f + ' → ' + m[1]);
      }
    }
    assert.deepEqual(missing, []);
  });
  /* [control] The server itself, started the way the live one now starts. */
  test('1d [control] in production mode the server starts, answers, and a bad body gets a sentence, not a stack', async () => {
    const { startHati } = require('./helpers');
    const h = await startHati({ NODE_ENV: 'production' });
    try {
      const st = await fetch(h.base + '/api/status');
      assert.equal(st.status, 200);
      const bad = await fetch(h.base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{not json' });
      assert.equal(bad.status, 400);
      const body = await bad.text();
      assert.match(body, /^\{"error":"/, 'JSON, in the one error handler\'s shape');
      assert.ok(!/at [A-Za-z_.]+ \(|server\.js/.test(body), 'and none of our insides');
    } finally { await h.stop(); }
  });
});

describe('f396 (2) — their bell\'s sign row says what its press does', () => {
  test('2a the row prints the Ready to sign button\'s own sentence, asked by key', () => {
    const f = code(fnOf(PORTAL, 'portalAlerts'));
    assert.ok(f, 'portalAlerts is in js/views/portal.js');
    assert.match(f, /push\('sign', 'green', i18t\('po_ready_tell_title'\)/, 'the sign row asks po_ready_tell_title');
    assert.ok(!/i18t\('pa_ready_to_sign'\)/.test(f), 'and no longer says they are waiting for you to sign');
  });
  /* [control] The button's hover was already this sentence — which is the
     point: the row borrows it, it does not invent a second. 2a is the claim. */
  test('2b [control] one act, one sentence: the button\'s own hover is the same key', () => {
    assert.match(code(PORTAL), /readyOk\?i18t\('po_ready_tell_title'\)/, 'the Ready to sign button\'s hover');
    assert.equal(valOf(EN, 'po_ready_tell_title'), 'Tell them you are ready to sign');
    assert.ok(valOf(SV, 'po_ready_tell_title'), 'and it is in the Swedish book');
  });
  /* [wall] Retired by not being called, never by being deleted — the rule for
     a key: a dictionary missing it would leave a screen half-English. */
  test('2c [wall] the old sentence is left inert in both books', () => {
    assert.ok(valOf(EN, 'pa_ready_to_sign') && valOf(SV, 'pa_ready_to_sign'));
  });
});

describe('f396 (3) — they agreed to the wording', () => {
  /* core.js is not on this stage (it builds a sample book at load), so its
     ONE reading is lifted out whole and evaluated here — a stand-in kinder
     than the real function would turn every claim below into a description. */
  const world = () => {
    const w = buildWorld({ signcheck: true });
    const win = w.win;
    const src = fnBody(CORE, 'cpAcceptedWording');
    if (src && !has(win, 'cpAcceptedWording')) win.eval(src + ';window.cpAcceptedWording=cpAcceptedWording;');
    return win;
  };
  const accepted = over => Object.assign({ id: 'MK-A2', name: 'Services agreement', counterparty: 'Juno Limited',
    status: 'Under Review', audit: [], changes: [], signatures: [], signerPlan: [],
    acceptance: { by: 'Grace Njeri, Director', at: new Date(Date.now() - 2 * 864e5).toISOString(), email: 'grace@client.co.ke', comment: '' } }, over || {});

  test('3a one reading: it answers the acceptance while it stands, and null where there is none', () => {
    const win = world();
    assert.ok(has(win, 'cpAcceptedWording'), 'cpAcceptedWording is in js/core.js');
    const c = accepted();
    assert.equal(win.cpAcceptedWording(c).by, 'Grace Njeri, Director');
    assert.equal(win.cpAcceptedWording(accepted({ acceptance: undefined })), null, 'nothing agreed');
    assert.equal(win.cpAcceptedWording(accepted({ acceptance: { by: 'x' } })), null, 'an acceptance with no date is not one');
  });
  test('3b once anybody has signed, it has done its work — on either store', () => {
    const win = world();
    assert.ok(has(win, 'cpAcceptedWording'), 'cpAcceptedWording is in js/core.js');
    assert.equal(win.cpAcceptedWording(accepted({ signerPlan: [{ id: 's1', party: 'counterparty', signed: true }] })), null, 'a signed row on the route');
    assert.equal(win.cpAcceptedWording(accepted({ signatures: [{ name: 'Grace Njeri' }] })), null, 'a signature on the record');
  });
  test('3c a declined, archived or signed contract carries no such news', () => {
    const win = world();
    assert.ok(has(win, 'cpAcceptedWording'), 'cpAcceptedWording is in js/core.js');
    assert.equal(win.cpAcceptedWording(accepted({ status: 'Declined' })), null);
    assert.equal(win.cpAcceptedWording(accepted({ archived: { at: day(-1), by: 'Young' } })), null);
    assert.equal(win.cpAcceptedWording(accepted({ status: 'Signed' })), null);
  });
  test('3d wording that moved after they agreed is not what they agreed to — asked of the ONE reading of when it last moved', () => {
    const win = world();
    assert.ok(has(win, 'cpAcceptedWording') && has(win, 'signCheckBriefAt'), 'the reading and the one it borrows');
    const c = accepted();
    const agreed = Date.parse(c.acceptance.at);
    win.signCheckBriefAt = () => agreed + 60000;
    assert.equal(win.cpAcceptedWording(c), null, 'a change filed after the agreement');
    win.signCheckBriefAt = () => agreed - 60000;
    assert.ok(win.cpAcceptedWording(c), 'a change filed before it');
    win.signCheckBriefAt = () => 0;
    assert.ok(win.cpAcceptedWording(c), 'no date anybody holds is "we do not know", and keeps it');
    assert.ok(/signCheckBriefAt\(c\)/.test(code(fnOf(CORE, 'cpAcceptedWording'))), 'borrowed, never a second date reader');
  });
  test('3e READING MUST NOT WRITE — the record comes back exactly as it went in', () => {
    const win = world();
    assert.ok(has(win, 'cpAcceptedWording'), 'cpAcceptedWording is in js/core.js');
    const c = accepted({ changes: [{ id: 'CHG-1', status: 'pending', createdAt: day(-5) }] });
    const before = JSON.stringify(c);
    win.cpAcceptedWording(c);
    assert.equal(JSON.stringify(c), before);
  });

  /* ---- THE BELL ----
     buildAlerts lives in js/app.js, which this stage does not load. It is
     LIFTED out whole with the kind table and its rank, and run for real. */
  const bellWorld = contracts => {
    const win = world();
    win.state = Object.assign({}, win.state, { contracts });
    win.getContract = id => contracts.find(c => c.id === id) || null;
    const kindsAt = APP.indexOf('const ALERT_KINDS = [');
    const kindsEnd = APP.indexOf('\n];', kindsAt) + 3;
    const rankAt = APP.indexOf('const alertRank = ');
    const rankEnd = APP.indexOf(';\n', APP.indexOf('return i<0', rankAt)) + 2;
    assert.ok(kindsAt > 0 && rankAt > 0, 'the kind table and its rank are in js/app.js');
    win.eval(APP.slice(kindsAt, kindsEnd).replace('const ALERT_KINDS', 'window.ALERT_KINDS') + '\n'
      + APP.slice(rankAt, rankEnd).replace('const alertRank', 'window.alertRank') + '\n'
      + fnOf(APP, 'buildAlerts') + ';window.buildAlerts=buildAlerts;');
    const log = [];
    win.openWorkspace = id => log.push('room:' + id);
    win.roomGoTab = (x, k) => log.push('tab:' + k);
    return { win, log };
  };
  test('3f a green bell row says they agreed, names who, and its press opens the Signing tab', () => {
    const { win, log } = bellWorld([accepted()]);
    const rows = win.buildAlerts().filter(a => a.kind === 'cp-accepted');
    assert.equal(rows.length, 1, 'one row for the one contract');
    assert.equal(rows[0].text, win.i18t('al_cp_accepted'));
    assert.equal(rows[0].sub, win.i18t('al_cp_accepted_sub', { who: 'Grace Njeri, Director' }));
    assert.equal(rows[0].tone, 'green', 'the same green as "ready to sign" — they have done their part');
    rows[0].go();
    assert.equal(log.join(','), 'room:MK-A2,tab:sign', 'the next step is a signature, not another round');
  });
  test('3g where they have ALSO said they are ready to sign, that row says the stronger thing and this one stands down', () => {
    const { win } = bellWorld([accepted()]);
    /* GATED on the row being drawn without readiness, or "stands down" is
       only "was never drawn" — which is what a build without the row says. */
    win.cpReadyToSign = () => false;
    assert.equal(win.buildAlerts().filter(a => a.kind === 'cp-accepted').length, 1, 'drawn while they have only agreed');
    win.cpReadyToSign = () => true;
    assert.equal(win.buildAlerts().filter(a => a.kind === 'cp-accepted').length, 0, 'and gone once they are ready to sign');
  });
  test('3h the kind is registered right after "ready to sign", green', () => {
    const kinds = [...code(APP).match(/const ALERT_KINDS = \[[\s\S]*?\];/)[0].matchAll(/\{ k:'([a-z-]+)',\s*tone:'([a-z]+)'/g)].map(m => m[1] + ':' + m[2]);
    const i = kinds.indexOf('cp-accepted:green');
    assert.ok(i > 0, 'registered, green: ' + kinds.join(' '));
    assert.equal(kinds[i - 1], 'cp-ready:green', 'directly under the other piece of news from them');
  });
  test('3i the words are in both books', () => {
    for (const k of ['al_cp_accepted', 'al_cp_accepted_sub'])
      assert.ok(valOf(EN, k) && valOf(SV, k), k + ' in English and Swedish');
    assert.ok(/\{who\}/.test(valOf(EN, 'al_cp_accepted_sub')) && /\{who\}/.test(valOf(SV, 'al_cp_accepted_sub')), 'both name who');
  });
});

describe('f396 (4) — a renewal\'s Decide reads the contract again', () => {
  test('4a the door registers the ask BEFORE the room opens, and only for a renewal', () => {
    const w = buildWorld({ homeView: true, obligations: true });
    const win = w.win;
    assert.ok(has(win, 'needsYouGo'), 'needsYouGo is published');
    const c = { id: 'MK-143', name: 'Primary Distribution', status: 'Signed', audit: [], changes: [] };
    win.state = Object.assign({}, win.state, { contracts: [c] });
    win.getContract = id => (id === c.id ? c : null);
    const log = [];
    win.roomReadOnArrival = id => log.push('again:' + id);
    win.openWorkspace = id => log.push('room:' + id);
    win.roomGoTab = (x, k) => log.push('tab:' + k);
    win.openRedlineWorkbench = id => log.push('nego:' + id);
    win.openDeskSheet = x => log.push('desk:' + x.id);
    win.needsYouGo('renewal', 'MK-143');
    assert.equal(log.join(','), 'again:MK-143,room:MK-143,tab:terms');
    for (const k of ['quiet', 'review', 'join', 'sign']) { log.length = 0; win.needsYouGo(k, 'MK-143'); assert.ok(!log.some(x => /^again:/.test(x)), k + ' reads nothing again'); }
  });
  test('4b the room spends the ask ONCE, only on a record loaded in full, and only soon after the press', () => {
    const { win } = buildWorld({ contractView: true });
    assert.ok(has(win, 'roomReadOnArrival') && has(win, 'roomReadAgainDue'), 'both are published');
    const c = { id: 'MK-143' };
    assert.equal(win.roomReadAgainDue(c), false, 'nothing registered, nothing due');
    win.roomReadOnArrival('MK-143');
    const light = { id: 'MK-143', _light: true };
    assert.equal(win.roomReadAgainDue(light), false, 'a register row the room is still loading is not read');
    assert.equal(win.roomReadAgainDue(c), true, 'the loaded record is');
    assert.equal(win.roomReadAgainDue(c), false, 'and only once');
    win.roomReadOnArrival('MK-143');
    const realNow = win.Date.now;
    win.Date.now = () => realNow() + win.ROOM_READ_AGAIN_MS + 1000;
    try { assert.equal(win.roomReadAgainDue(c), false, 'a press whose room never arrived does not start a paid reading later'); }
    finally { win.Date.now = realNow; }
  });
  test('4c the Overview is where it is spent, and what it starts is the whole arrival read, fresh', () => {
    const f = code(fnOf(CONTRACT, 'applyWsTabs'));
    const terms = (f.match(/if\(_wsTab==='terms'\)\{[\s\S]*?\}\s*\n/) || [''])[0];
    assert.ok(terms, 'the Overview branch');
    assert.match(terms, /if\(roomReadAgainDue\(c\)\) triageAndPaint\(c,\{ again:true, fresh:true \}\)/);
    assert.match(code(fnOf(CONTRACT, 'triageAndPaint')), /triageRun\(c,\{ fresh:!!\(opts&&opts\.fresh\)/, 'the launcher hands `fresh` on');
  });
  test('4d `fresh` writes the brief anew — the one reading with a cache — and nothing else changes', async () => {
    const { win } = buildWorld({ triage: true });
    const TEXT = 'The Buyer shall pay each undisputed invoice within sixty (60) days of receipt. '
      + 'The Supplier shall maintain insurance for the term. This Agreement is governed by the laws of Kenya. ';
    const c = { id: 'MK-143', name: 'Primary Distribution', counterparty: 'Sendy Ltd', status: 'Signed', source: 'upload',
      folder: 'proc', owner: { id: 'u1', name: 'Wanjiru Kamau' }, audit: [], obligations: [], comments: [],
      upload: { name: 's.docx', extractedText: TEXT } };
    win.state.contracts = [c];
    const asked = [];
    win.runContractBrief = async (x, o) => { asked.push(!!(o && o.force)); x._brief = { summary: 'A short brief.' }; return x._brief; };
    await win.triageRun(c, { fresh: true });
    await win.triageRun(c, {});
    assert.equal(asked.join(','), 'true,false', 'fresh forces a rewrite; an ordinary read may be served from the cache');
    assert.ok(/force: !!opts\.fresh/.test(code(fnOf(TRIAGE, 'triageRun'))), 'the option is the brief\'s own `force`');
  });
  test('4e the press says what it spends: the Decide hover names the fresh reading, in both books', () => {
    const en = valOf(EN, 'ins_need_go_terms'), sv = valOf(SV, 'ins_need_go_terms');
    assert.match(en, /Copilot read the contract again/);
    assert.ok(sv && /Copilot/.test(sv) && sv !== en, 'Swedish has its own sentence');
  });
  /* ---- TWO THINGS THE RE-READ PUT IN FRONT OF THE READER ----
     Before this, a signed contract never had its arrival read run over it, so
     neither sentence below was ever seen on one. */
  test('4g a signed contract\'s open-fields tile says it is signed — never "in negotiation"', () => {
    const { win } = buildWorld({ blanks: true });
    assert.ok(has(win, 'contractBlanksNone'), 'contractBlanksNone is published');
    const body = 'SUPPLY AGREEMENT\n\nArticle 1 Payment\n\nPayable within thirty days.';
    assert.equal(win.contractBlanksNone({ id: 'MK-1', status: 'Signed', redlineText: body, format: 'text' }), 'sealed', 'a signed contract');
    assert.equal(win.contractBlanksNone({ id: 'MK-2', status: 'Under Review', redlineText: body, format: 'text',
      signerPlan: [{ id: 's1', party: 'counterparty', signed: true }] }), 'sealed', 'a signature on the route freezes it too — negoWordingFrozen');
    assert.equal(win.contractBlanksNone({ id: 'MK-3', status: 'Under Review', redlineText: body, format: 'text' }), 'nego',
      '[control] a contract still being negotiated keeps its own sentence');
    assert.ok(Array.from(win.BLANK_NONE_REASONS).includes('sealed'), 'the list of reasons names it');
    assert.ok(valOf(EN, 'tri_fill_sealed') && valOf(SV, 'tri_fill_sealed'), 'the sentence is in both books');
    assert.match(code(fnOf(TRIAGE, 'triageTiles')), /sealed: 'tri_fill_sealed'/, 'and the tile prints it');
  });
  /* ---- AND THE FILL STEP STANDS DOWN ON A SIGNED CONTRACT ----
     Found by driving the first cut of this batch (65a4bde): the re-read's
     fill step answered a signed contract's blanks from the record, the server
     refused the save (409 — `fields` is locked on an executed record) and the
     refusal put the old record back over every reading of the run. RED at
     65a4bde and at ce9cc59 alike (neither stands the step down). */
  test('4i on a signed contract the fill step writes nothing and says why; on a live deal it still runs', async () => {
    const { win } = buildWorld({ triage: true });
    const TEXT = 'The Buyer shall pay each undisputed invoice within sixty (60) days of receipt. '
      + 'The Supplier shall maintain insurance for the term. This Agreement is governed by the laws of Kenya. ';
    const mk = status => ({ id: 'MK-9' + status.length, name: 'Supply', counterparty: 'Sendy Ltd', status, source: 'upload',
      folder: 'proc', owner: { id: 'u1', name: 'Wanjiru Kamau' }, audit: [], obligations: [], comments: [], fields: {},
      upload: { name: 's.docx', extractedText: TEXT } });
    const ran = [];
    win.runFillBlanks = async c => { ran.push(c.status); c.fields.effDate = '2026-09-27'; return { filled: [{ key: 'effDate', label: 'Start date' }], left: [] }; };
    const signed = mk('Signed');
    const t = await win.triageRun(signed, { fresh: true });
    assert.equal(ran.join(','), '', 'the fill reading is not run on a signed contract');
    assert.equal(JSON.stringify(signed.fields), '{}', 'and not one field is written');
    assert.equal(t && t.steps.fill && t.steps.fill.none, 'sealed', 'the tile is told why — the wording is final');
    const live = mk('Under Review');
    await win.triageRun(live, {});
    assert.equal(ran.join(','), 'Under Review', '[control] a deal still being argued is filled as before');
  });
  test('4h when the readings land, the head\'s Copilot fact is repainted with them', () => {
    const f = code(fnOf(CONTRACT, 'triageAndPaint'));
    assert.match(f, /paintKtTriage\(x\);\s*roomHeadRefresh\(x\);/, 'the strip, then the head, from the same landing');
  });
  test('4f the other two homes that press this door carry the same hover — Home\'s renewal row and the bell\'s renewal rows', () => {
    assert.match(code(HOME), /it\.kind==='renewal'\?` title="\$\{esc\(i18t\('ins_need_go_terms'\)\)\}"`/, 'Home\'s renewal row');
    const bell = code(fnOf(APP, 'buildAlerts'));
    assert.match(bell, /const renewHint=\{ hint:i18t\('ins_need_go_terms'\) \}/, 'one hint for the bell');
    assert.equal((bell.match(/bellGo\('renewal',x\.c\), renewHint\)/g) || []).length, 2, 'both renewal rows carry it');
    assert.match(code(fnOf(APP, 'alertsPanelHtml')), /a\.hint\?` title="\$\{esc\(a\.hint\)\}"`:''/, 'and the bell prints a row\'s hint as its hover');
  });
});
