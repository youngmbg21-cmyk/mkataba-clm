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
