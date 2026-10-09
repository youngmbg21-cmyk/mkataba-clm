/* f630 — THE PHONE READS THE RECORD THE DESKTOP READS (overnight run, stream G,
 * 9 Oct 2026).
 *
 * The functional review walked HaTi on a phone and found the phone shell kept
 * its own readers where the desktop already had one, so it showed wrong or
 * empty things: every obligation read "No wording recorded" (it read o.text,
 * the product stores o.desc); typing into a blank on the Document tab was
 * lost; a colleague's "look at this" vanished behind an approval on the same
 * contract; Sign was a filled button that always refused; an email link to a
 * tab landed on the Document tab; nobody could answer a look; History read the
 * negotiation alone and said "nothing has happened".
 *
 * Driven on a bare jsdom stage carrying the three phone files and stubs for the
 * desktop's readings — each claim is about which reading the phone asks and
 * what it draws from the answer. Red at the parent: every test below.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function stage(over = {}){
  const dom = new JSDOM('<!doctype html><html><body><div id="m-root"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const w = dom.window;
  const log = { toasts: [], looks: 0, leaves: [] };
  const C = over.contract || { id: 'MK-1', name: 'Supply', counterparty: 'Naivas', status: 'Draft', obligations: [], audit: [] };
  Object.assign(w, {
    state: { activeId: C.id, contracts: [C] },
    i18t: (k, p) => k + (p ? ' ' + JSON.stringify(p) : ''),
    i18tn: (k, n, p) => k + ' ' + JSON.stringify(p || { n }),
    langLocale: () => 'en-GB', jxLocale: () => 'en-GB',
    esc: s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])),
    getContract: id => (id === C.id ? C : null),
    currentUser: () => ({ id: 'u1', name: 'Wanjiru' }),
    canEdit: () => true,
    toast: (msg, kind) => log.toasts.push({ msg: String(msg), kind }),
    matchMedia: () => ({ matches: true }),
  }, over.win || {});
  for (const f of ['js/mobile.js', 'js/mobile-contract.js', 'js/mobile-screens.js']) w.eval(read(f));
  w.mRender = () => {};            // the shell's paint is not under test here
  return { w, C, log };
}

describe('f630 (G1) an obligation reads the field the product stores', () => {
  test('o.desc is the wording on the phone\'s row', () => {
    const { w, C } = stage();
    C.obligations = [{ id: 'ob1', desc: 'Send the quarterly stock report', due: '2026-10-01', status: 'open' }];
    w.mS().tab = 'oblig';
    const html = w.mContractHtml();
    assert.match(html, /Send the quarterly stock report/);
    assert.ok(!/ob_no_wording/.test(html), 'never "No wording recorded" over a duty that has wording');
  });
  test('the start date reads the record\'s own fields.effDate as the desktop does', () => {
    assert.match(read('js/mobile-contract.js'), /md\.effectiveDate\|\|\(c\.fields&&c\.fields\.effDate\)/);
    assert.ok(!/o&&o\.text\)\|\|\(o&&o\.description/.test(read('js/mobile-contract.js')));
  });
});

describe('f630 (G2) the Document tab is read, never typed into', () => {
  const BODY = '<p>Price <input class="field" data-field="price" value=""> and term <input class="field" data-field="term" value="3 years"></p>'
    + '<button class="hati-fill-btn">Fill</button><div contenteditable="true">x</div>';
  test('no box survives on the paper; the answer or a dash is printed instead', () => {
    const { w } = stage({ win: { docBody: () => BODY } });
    w.mS().tab = 'doc';
    const html = w.mContractHtml();
    const d = w.document.createElement('div'); d.innerHTML = html;
    assert.equal(d.querySelectorAll('.m-paper input, .m-paper textarea').length, 0);
    assert.equal(d.querySelectorAll('.m-paper .hati-fill-btn, .m-paper [contenteditable]').length, 0);
    assert.match(d.querySelector('.m-paper').textContent, /3 years/);
  });
  test('a Draft with an empty term says where it is filled; a filled one says nothing', () => {
    const { w } = stage({ win: { docBody: () => BODY } });
    w.mS().tab = 'doc';
    assert.match(w.mContractHtml(), /data-m-doc-owed="1"[^>]*>mc_fill_on_computer/);
    const full = stage({ win: { docBody: () => '<p><input class="field" value="10"></p>' } });
    full.w.mS().tab = 'doc';
    assert.ok(!/data-m-doc-owed/.test(full.w.mContractHtml()));
  });
});

describe('f630 (G3) Needs you is the checklist\'s own reading, several per contract', () => {
  test('a look and an approval on one contract are two rows, and kinds the phone never drew appear', () => {
    const { w, C } = stage({ win: {
      needsYouOf: () => [{ kind: 'look', who: 'Amina' }, { kind: 'approval' }, { kind: 'note', n: 1 }, { kind: 'suggest', n: 2 }],
      insNeedWords: (c, it) => ({ title: 'T-' + it.kind, plain: '' }),
    } });
    const rows = w.mNeedsYou({ cs: [C], myApprovals: [{ c: C, mine: true }] });
    const kinds = rows.map(r => r.kind);
    for (const k of ['look', 'approval', 'note', 'suggest']) assert.ok(kinds.includes(k), k + ' is on the phone\'s list');
    assert.equal(kinds.filter(k => k === 'approval').length, 1, 'the approval slice does not repeat the reading\'s row');
    assert.ok(rows.every(r => r.c === C));
  });
});

describe('f630 (G4) a Sign the list holds is grey and says what stands', () => {
  const na = { kind: 'sign', label: 'Sign', guide: 'g' };
  test('held: disabled, the items listed, settled on a computer', () => {
    const { w } = stage({ win: { wsNextAction: () => na, signBlockers: () => [{ short: 'Approval' }, { label: 'Signers' }] } });
    const html = w.mContractHtml();
    assert.match(html, /<button class="m-btn" data-m-na="sign" disabled/);
    assert.match(html, /<li>Approval<\/li><li>Signers<\/li>/);
    assert.match(html, /mc_settle_on_computer/);
    assert.ok(!/m-btn-primary" data-m-na="sign"/.test(html));
  });
  test('clear: the filled button signs as before', () => {
    const { w } = stage({ win: { wsNextAction: () => na, signBlockers: () => [] } });
    const html = w.mContractHtml();
    assert.match(html, /m-btn-primary" data-m-na="sign"/);
    assert.ok(!/mc_settle_on_computer/.test(html));
  });
});

describe('f630 (G5) an email link lands on the tab it named, on the phone', () => {
  test('terms → Overview, history → History, sign with an approval waiting → the Approvals card', () => {
    let desk = 0;
    const { w, C } = stage({ win: { roomGoTab: () => { desk++; } } });
    w.mHookRoomTab();
    w.mS().screen = 'contract';
    w.roomGoTab(C, 'terms'); assert.equal(w.mS().tab, 'terms');
    w.roomGoTab(C, 'history'); assert.equal(w.mS().tab, 'hist');
    w.roomGoTab(C, 'sign'); assert.equal(w.mS().tab, 'doc', 'no approval of mine: the Document tab and its Sign bar');
    w.mApprovalItems = () => [{ c: C, mine: true }];
    w.roomGoTab(C, 'sign');
    assert.equal(w.mS().screen, 'approvals'); assert.equal(w.mS().apprOpen, C.id);
    w.roomGoTab(C, 'redline'); assert.equal(desk, 1, 'the negotiation goes through as it always did');
  });
  test('off the phone the room\'s own router answers', () => {
    let desk = 0;
    const { w, C } = stage({ win: { roomGoTab: () => { desk++; } } });
    w.mHookRoomTab(); w.matchMedia = () => ({ matches: false });
    w.roomGoTab(C, 'terms'); assert.equal(desk, 1);
  });
});

describe('f630 (G6) a look is answered on the phone, by the desktop\'s writer', () => {
  test('Done looking is offered only while a look waits, and presses lookDone', () => {
    let looks = [{ id: 'a1', by: { name: 'Amina' } }], done = 0;
    const { w } = stage({ win: { asksLookFor: () => looks, lookDone: () => { done++; looks = []; return true; } } });
    assert.match(w.mOverflowSheetHtml(), /data-m-act="look-done"/);
    w.mContractAct('look-done');
    assert.equal(done, 1);
    assert.ok(!/data-m-act="look-done"/.test(w.mOverflowSheetHtml()));
  });
});

describe('f630 (G7) History is the room\'s one trail', () => {
  test('a trail with no negotiation still tells its story, newest first', () => {
    const { w } = stage({ win: {
      negoTimeline: () => [],
      roomHistoryEvents: () => [
        { _k: 'system', at: '2026-10-01T09:00:00Z', actor: 'A', text: 'Created — from template' },
        { _k: 'system', at: '2026-10-02T09:00:00Z', actor: 'B', text: 'Approved — step 1' }],
    } });
    w.mS().tab = 'hist';
    const html = w.mContractHtml();
    assert.ok(!/mc_hist_none/.test(html));
    assert.ok(html.indexOf('Approved') < html.indexOf('Created'), 'newest first');
    w.mS().hist = 'decision';
    const only = w.mContractHtml();
    assert.match(only, /Approved/); assert.ok(!/Created — from/.test(only), 'a trail line is grouped by its verb');
  });
});

describe('f630 (G16) the phone shell speaks the reader\'s language and the truth', () => {
  test('the tab says Overview; the chips, the round and the empty lines are keys', () => {
    const MC = read('js/mobile-contract.js');
    assert.match(MC, /i18t\('tab_overview'\)/);
    assert.ok(!/'Nothing has happened|Round \$\{|'Not set'|'Non-monetary'|const M_DESK_MSG/.test(MC));
    const I = read('js/i18n.js');
    for (const k of ['mc_desk_msg', 'mc_settle_on_computer', 'mc_look_done', 'mc_hist_none', 'mc_round_n', 'mc_share_code_open', 'mc_terms_missing_one'])
      assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k + ' in both books');
  });
  test('the share sheet no longer claims the code is not optional, and names the admin setting when on', () => {
    const off = stage({ win: { linkCodeCfg: () => ({ on: false }), emailOff: () => false } });
    off.w.mS().share = 'sign';
    const a = off.w.mShareSheetHtml();
    assert.ok(!/not optional/.test(a)); assert.match(a, /mc_share_code_sign/); assert.ok(!/mc_share_code_open/.test(a));
    const on = stage({ win: { linkCodeCfg: () => ({ on: true }), emailOff: () => true } });
    on.w.mS().share = 'negotiate';
    const b = on.w.mShareSheetHtml();
    assert.match(b, /mc_share_code_neg/); assert.match(b, /mc_share_code_open/);
  });
  test('send for review goes through the one act, and every phone toast has a kind', () => {
    const left = [];
    const { w, C, log } = stage({ win: { contractLeavesDrafting: (c, why) => { left.push(why); c.status = 'Under Review'; return true; }, persist: () => {} } });
    w.mDoNextAction('review');
    assert.deepEqual(left, ['sent for review']);
    assert.equal(C.status, 'Under Review');
    assert.equal(log.toasts[0].kind, 'ok');
    const src = ['js/mobile.js', 'js/mobile-contract.js', 'js/mobile-screens.js', 'js/mobile-copilot.js', 'js/mobile-portal.js']
      .map(read).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
    const bare = src.split('\n').filter(l => /toast\(i18t\([^)]*\)\);/.test(l));
    assert.deepEqual(bare, [], 'no bare toast(i18t(...)) on the phone');
  });
});

describe('f630 the phone still files no change of its own', () => {
  test('no changes.push and no negoFileChange in js/mobile*.js', () => {
    for (const f of fs.readdirSync(path.join(ROOT, 'js')).filter(f => /^mobile.*\.js$/.test(f))) {
      const s = read('js/' + f).replace(/\/\*[\s\S]*?\*\//g, '');
      assert.ok(!/changes\.push|negoFileChange\(/.test(s), f);
    }
  });
});
