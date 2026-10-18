/* f731 — THE 13 OCT BUG-LOG FIXES, CARRIED OVER (owner, 18 Oct 2026)

   PR #253 held the 13 Oct bug-log clean-up and never merged; the owner chose
   to rebuild all of it on today's main. Its own tests came with it (f273,
   f288, f431, f532, f615, f730 and refresh-keeps-your-spot 5b). These are the
   fixes it shipped without a check:

   (1) a signed or declined contract asks nobody's approval
   (2) adding a member refuses a name another member already has
   (3) the toasts that printed nothing now say themselves (and in both books)
   (4) Open contract from Our standards and from Jambo's agents lands on Home
   (5) the Board's risks pack names a risk by its short title
   (6) Negotiate's solo-send words are in both books

   Run: node --test test/f731-the-bug-log-fixes-carried.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');
const { startHati, seedWorkspace } = require('./helpers');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnOf = (src, name) => {
  const i = src.indexOf('function ' + name + '(');
  assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 1);
  return src.slice(i, j < 0 ? undefined : j);
};

describe('f731 (1) a signed or declined contract asks nobody\'s approval', () => {
  const RULE = { id: 'r-spend', name: 'Value ≥ KES 5M', order: 1,
    cond: { type: 'value', op: '>=', value: 5000000 }, approver: { kind: 'role', role: 'admin' } };
  const ADMIN = { id: 'u_admin', name: 'Amina Otieno', role: 'admin' };
  const contract = (over = {}) => ({ id: 'MK-9', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar',
    folder: 'proc', status: 'Under Review', value: 6000000, valueType: 'standard', template: 'RM',
    redlineText: 'Payment within thirty (30) days.', format: 'text', fields: {}, metadata: {}, audit: [],
    comments: [], signatures: [], obligations: [], rounds: [], versions: [], approvalChain: null, ...over });
  const world = () => loadViews(['js/approvals.js'], {
    currentUser: () => ADMIN, canEdit: () => true,
    ROLE_LABEL: { admin: 'Admin', legal: 'Editor', viewer: 'Viewer' },
    cKind: () => 'Contract', deviationSummary: () => null,
    nowISO: () => '2026-10-04T09:00:00.000Z', fmtDT: iso => String(iso || ''),
    persist() {}, saveSettings() {}, renderSignButton() {}, renderAuditSection() {}, logAudit() {},
    ensureFull: async () => {}, toast() {}, promptDialog: async () => '',
    state: { contracts: [], settings: { approvalRules: [RULE] } } });

  test('the approver is asked while it is open, and nobody once it is signed or declined', () => {
    const w = world();
    assert.equal(w.approvalDecidableNow(contract()).kind, 'rule', 'open: the approver decides');
    assert.equal(w.approvalDecidableNow(contract({ status: 'Signed' })), null, 'signed: history, not work');
    assert.equal(w.approvalDecidableNow(contract({ status: 'Declined' })), null, 'declined: history, not work');
  });
});

describe('f731 (2) adding a member refuses a name another member already has', () => {
  let h, w;
  before(async () => { h = await startHati(); w = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('the same name in another case is refused 409; a new name is added', async () => {
    let err = null;
    try {
      await w.admin.json('/api/users', { method: 'POST', body: {
        name: 'restricted legal', email: 'second@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
    } catch (e) { err = e; }
    assert.ok(err, 'the second "Restricted Legal" is refused');
    assert.equal(err.status, 409);
    assert.match(String(err.body && err.body.error), /already has that name/);
    const ok = await w.admin.json('/api/users', { method: 'POST', body: {
      name: 'Another Person', email: 'another@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
    assert.equal(ok.user.name, 'Another Person');
  });
});

describe('f731 (3) the toasts that printed nothing now say themselves', () => {
  test('the round on a standing link: a kind, and the name raw (toast escapes it)', () => {
    const core = strip(R('js/core.js'));
    const calls = core.match(/toast\(i18t\('co_round_on_standing_link'[^;]*;/g) || [];
    assert.ok(calls.length >= 2, 'both callers found');
    for (const c of calls) {
      assert.match(c, /\{who\}\),\s*'ok'\)/, 'passes the name raw and says it as ok: ' + c);
      assert.ok(!/esc\(who\)/.test(c), 'not escaped twice: ' + c);
    }
  });
  test('an approval rule saved or removed says so', () => {
    const st = strip(R('js/views/settings.js'));
    assert.match(st, /toast\(i18t\('set_rule_saved'\),'ok'\)/);
    assert.match(st, /toast\(i18t\('set_rule_removed'\),'ok'\)/);
  });
  test('the other side\'s "Comment sent" is in the book and says itself', () => {
    const pt = strip(R('js/views/portal.js'));
    assert.ok(!/toast\(`Comment sent to/.test(pt), 'no English literal left');
    assert.match(pt, /toast\(i18t\('di_comment_sent_to',\{ who:\(p&&p\.org\)\|\|i18t\('di_the_sender'\) \}\),'ok'\)/);
  });
});

describe('f731 (4) Open contract lands on Home, as every list\'s does (regOpenContract)', () => {
  test('Our standards: a code name stopped, then Home on the reader\'s own choice, the room only where Home cannot take it', () => {
    const f = strip(fnOf(R('js/views/library.js'), 'sdOpenContract'));
    const stop = f.indexOf('codeNameStop(getContract(id))'), home = f.indexOf("pdOpenOnHome(id,'open')"), old = f.indexOf('selectContract(id)');
    assert.ok(stop > 0 && home > stop && old > home, 'codeNameStop, then pdOpenOnHome(…,\'open\'), then selectContract');
  });
  test('Jambo\'s agents: the contract itself opens the same way', () => {
    const f = strip(fnOf(R('js/views/agents.js'), 'agGo'));
    const stop = f.indexOf("where === 'contract' && typeof codeNameStop === 'function' && codeNameStop(c)");
    const home = f.indexOf("where === 'contract' && typeof pdOpenOnHome === 'function' && pdOpenOnHome(cid, 'open')");
    assert.ok(stop > 0 && home > stop && f.indexOf('openWorkspace(cid)') > home, 'stopped, then Home, before openWorkspace');
  });
  test('and the agents page\'s "Open contract" buttons reach it (they went to the strip\'s Overview)', () => {
    const src = strip(R('js/views/agents.js'));
    assert.ok(!/B\('overview', _agT\('ins_open_contract'\)/.test(src), 'no Open contract button rides the overview act');
    assert.equal((src.match(/B\('contract', _agT\('ins_open_contract'\)/g) || []).length, 2, 'both Open contract buttons carry their own act');
    assert.match(src, /if \(act === 'contract'\) return agGo\('contract', it\.cid\);/);
  });
});

describe('f731 (5) the Board\'s risks pack names a risk by its short title', () => {
  test('hbPackData reads riskTitleOf, the one short title', () => {
    const f = strip(fnOf(R('js/views/homeboard.js'), 'hbPackData'));
    assert.match(f, /riskTitleOf\(it\)/);
  });
});

describe('f731 (6) Negotiate\'s solo-send words are in both books', () => {
  test('no English sentence left in the solo send, and every key in both books', () => {
    const ng = strip(R('js/views/negotiation.js'));
    for (const lit of ['`Sent to ${to}', 'toast(`Could not send to ${to}', "' — it is now their turn'", "' It is now their turn.'", 'other draft${kept'])
      assert.ok(!ng.includes(lit), 'gone: ' + lit);
    const I18N = R('js/i18n.js');
    for (const k of ['ng_solo_sent', 'ng_solo_failed', 'ng_solo_turn', 'ng_solo_turn_end', 'ng_solo_kept_one', 'ng_solo_kept_other'])
      assert.equal((I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length, 2, k + ' in both books');
  });
});

/* ---------------- the #340 review: every place the same fault appeared ---------------- */

describe('f731 (7) a reminder names only somebody the server would mail', () => {
  const users = [{ id: 'u1', name: 'Wanjiku Kamau', email: 'wanjiku@x.co.ke' }, { id: 'u2', name: 'Amina Otieno', email: 'amina@x.co.ke' }];
  const mk = allow => loadViews(['js/obligations.js'], { getUsers: () => users, canAccessFolder: (fid, u) => allow(u), currentUser: () => users[1] });
  const o = { id: 'o1', desc: 'Pay the deposit', due: '2026-10-25', status: 'open', party: 'ours', assignee: 'Wanjiku Kamau' };
  const c = { id: 'MK-1', folder: 'proc', counterparty: 'Kabras', obligations: [o], owner: { id: 'u2', name: 'Amina Otieno' } };
  const line = w => w.obligationReminderLine(o, c).replace(/<[^>]+>/g, '');
  test('the assignee who cannot open the stream is passed over for the owner; nobody, and it says so', () => {
    assert.match(line(mk(() => true)), /Wanjiku/, 'both can open: the assignee');
    const w1 = mk(u => u.id !== 'u1');
    assert.ok(!/Wanjiku/.test(line(w1)) && /Amina/.test(line(w1)), 'the assignee cannot: the owner, as contractOwnerRecipient');
    const w0 = mk(() => false);
    assert.equal(w0.obligationOwnerTo(c), null, 'an owner who cannot open it is nobody\'s reminder either');
    assert.ok(!/Wanjiku|Amina/.test(line(w0)), 'nobody can: no name is promised');
  });
  test('the reminder sentence and the agents page ask the same', () => {
    const ob = strip(R('js/obligations.js'));
    assert.equal((ob.match(/const m = obligationReachable\(obligationReminderTo\(o\), c\);/g) || []).length, 2, 'the sentence and the one line');
    assert.match(fnOf(R('js/views/agents.js'), 'agForName'), /canAccessFolder\(c\.folder \|\| '', to0\)/);
  });
});

describe('f731 (8) a copy that leaves the live paper carries no scan mark', () => {
  test('docBody draws the flags only when not asked for { marks:false }', () => {
    const f = strip(fnOf(R('js/views/contract.js'), 'docBody'));
    assert.match(f, /^function docBody\(c, opts\)/);
    assert.match(f, /if\(!\(opts&&opts\.marks===false\)\) try\{ \(window\.openFindings\?openFindings\(c\):\[\]\)/);
  });
  test('the sealed copy, the other side\'s view, the adviser\'s two copies, Jambo\'s text and the amendment\'s reading all ask for it', () => {
    const core = strip(R('js/core.js'));
    assert.match(strip(fnOf(R('js/core.js'), 'freezeContractHtml')), /docBody\(c,\{ marks:false \}\)/, 'the seal');
    assert.match(core, /return docBody\(c,\{ marks:false \}\)\|\|undefined;/, 'the view link');
    assert.match(strip(fnOf(R('js/core.js'), 'shareAdviceBody')), /docBody\(c,\{ marks:false \}\)/, 'an adviser\'s clauses');
    assert.match(strip(fnOf(R('js/adviserlink.js'), 'adviserClauses')), /docBody\(c,\{ marks:false \}\)/, 'an adviser\'s link');
    assert.match(strip(fnOf(R('js/views/intelligence.js'), 'contractPlainText')), /docBody\(c,\{ marks:false \}\)/, 'what Jambo is sent');
    assert.match(strip(fnOf(R('js/family.js'), 'amendParentHtml')), /docBody\(parent,\{ marks:false \}\)/, 'the amendment\'s parent');
  });
});

describe('f731 (9) the short title wherever risks are named', () => {
  test('the triage strip\'s tile and the health report ask riskTitleOf', () => {
    assert.match(strip(R('js/triage.js')), /rkOpen\.slice\(0, 2\)\.map\(rkName\)/);
    assert.match(strip(R('js/views/healthreport.js')), /riskTitleOf\(\{ src:'scan', id:f\.id/);
  });
});

describe('f731 (10) closing an unanswered handover declines through the one act', () => {
  test('outsideCloseDeal reopens, then contractDecline', () => {
    const f = strip(fnOf(R('js/views/handover.js'), 'outsideCloseDeal'));
    assert.ok(f.indexOf("outsideAct(c, 'reopen'") > 0 && f.indexOf('await contractDecline(c, why)') > f.indexOf("outsideAct(c, 'reopen'"));
  });
});

describe('f731 (11) the words', () => {
  const I18N = R('js/i18n.js');
  const both = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length;
  test('no Swedish line calls Jambo "anslutet"', () => assert.ok(!/Jambo är inte anslutet/.test(I18N)));
  test('the new sentences are in both books', () => {
    for (const k of ['co_reshare_stranded', 'ng_comment_posted', 'ng_comment_not_sent', 'ng_comment_no_channel', 'srv_member_name_taken'])
      assert.equal(both(k), 2, k);
    assert.match(I18N, /'Another member already has that name\.': 'srv_member_name_taken'/, 'the server\'s refusal is translated');
  });
  test('the stranded line, the WhatsApp line and the comment lines say themselves, in the reader\'s words', () => {
    const core = strip(R('js/core.js'));
    assert.match(core, /const reshareStrandedLine = who => i18t\('co_reshare_stranded',\{ who \}\);/);
    assert.match(core, /WhatsApp opened so you can send it to \$\{who\}`,'ok'\)/);
    assert.equal((core.match(/out\.recipient\.phone\|\|i18t\('ng_the_counterparty'\)/g) || []).length, 2, 'both standing-link callers');
    for (const f of ['js/views/negotiation.js', 'js/views/contract.js']) {
      const src = strip(R(f));
      assert.ok(!/toast\(`Comment posted on #/.test(src), f + ': no English comment toast');
      assert.match(src, /i18t\('ng_comment_posted', ?\{ ?id: ?ch\.id/, f);
    }
    assert.match(strip(R('js/views/negotiation.js')), /c\.counterpartyName \|\| c\.counterparty \|\| i18t\('ng_the_counterparty'\)/);
  });
  test('one comment, one confirmation: the drawer says it, so the portal\'s handler stays quiet there', () => {
    assert.match(strip(R('js/views/negotiation.js')), /opts\.onComment\(c, home, msg, \{ confirms: true \}\)/);
    assert.match(strip(R('js/views/portal.js')), /if\(!\(how&&how\.confirms\)\) toast\(i18t\('di_comment_sent_to'/);
  });
});

describe('f731 (12) every Open contract on these pages lands on Home', () => {
  test('the Requests list\'s second press, as its panel\'s button', () => {
    assert.match(strip(R('js/views/intake.js')), /else if\(r&&r\.contractId\)\{ if\(!\(typeof pdOpenOnHome==='function'&&pdOpenOnHome\(r\.contractId,'open'\)\)\) openWorkspace\(r\.contractId\); \}/);
  });
  test('the narrow Our standards page, as the wide one', () => {
    const lib = strip(R('js/views/library.js'));
    assert.match(lib, /\[data-dev-open\]'\)\.forEach\(b=>b\.addEventListener\('click',\(\)=>sdOpenContract\(/);
    assert.ok(!/\[data-dev-open\]'\)\.forEach\(b=>b\.addEventListener\('click',\(\)=>openWorkspace\(/.test(lib));
  });
});

describe('f731 (13) with no server, two members still may not share a name', () => {
  test('the drawer refuses a new or changed name another member has', () => {
    const f = strip(fnOf(R('js/views/settings.js'), 'settingsSavePerson'));
    assert.match(f, /if\(!\(typeof API_MODE==='function'&&API_MODE\(\)\)\)\{/);
    assert.match(f, /stDrawerRefuse\(i18t\('srv_member_name_taken'\)\)/);
  });
});
