/* ============================================================
   F390 — THE INSPECTOR ON FOUR MORE PAGES (Young chose it by name for each,
   26 Sep 2026: the Obligations page, the contract's Obligations tab, all three
   tabs of Our standards, and the Requests page — "go and merge main when
   complete")
   ============================================================
   The list and the panel the Contracts, Negotiations and Approvals pages
   already wear, on four more pages, with the three Requests rulings the owner
   said yes to: a request a colleague holds is TAKEN OVER and that asks first;
   a held request reads "being worked on", on the page and on the tracker
   link; the helping sentence opens the Ask window.

   WHAT IS PINNED HERE — the READINGS the four pages draw, measured on a node
   stage, and the walls around them. The pixels are four-inspectors-verify's.

     1  the Obligations page: seven windows, one population, one predicate;
        overdue means late work somebody could have done; "nobody owns it" is
        a fact about OUR side; money in four directions and never netted; the
        reminders said as the sweep sends them
     2  the contract's tab and the page share one builder
     3  the Requests page: a held request is being worked on, on the page and
        on the tracker; taking one over asks first; the Ask window leads with
        the helping sentence
     4  Our standards: who departs from what, each book's standards once, the
        book a position is held in, and the words that choose a book are
        playbookKeyFor's own list — which still answers every key it did
     5  the shared frame: the header's two slots and the width watch name the
        four pages; every new name is published once
     6  both books

   RED AT THE PARENT (afc2d0b): 31 of 33, measured in a worktree at that
   commit. The two that pass there are named [wall]: 4f holds playbookKeyFor
   to every key it answered before its patterns became one list, and 6 holds
   every word the four pages print to both books — both are true on both
   sides by design.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const OB = code(read('js/obligations.js'));
const IK = code(read('js/views/intake.js'));
const LIB = code(read('js/views/library.js'));
const SET = code(read('js/views/settings.js'));
const STD = read('js/standards.js');
const PB = code(read('js/playbook.js'));
const INS = code(read('js/views/inspector.js'));
const APP = code(read('js/app.js'));
const SRV = read('server/server.js');
const I18N = read('js/i18n.js');
const HTML = read('index.html');

const isoIn = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const fnOf = (src, name) => { const m = new RegExp('(async\\s+)?function ' + name + '\\(').exec(src);
  if (!m) return ''; const i = m.index; const j = src.indexOf('\n}', i); return j > i ? src.slice(i, j + 2) : ''; };

/* ---- a book of obligations across three contracts ---- */
function obBook(){
  const w = buildWorld({ intelView: true, contractView: true });
  const win = w.win;
  const roster = [{ id: 'u1', name: 'Wanjiku Kamau', email: 'wanjiku@hati.test', role: 'admin' }];
  const mk = (id, over) => Object.assign({ id, name: 'Agreement ' + id, counterparty: 'Nordkust', status: 'Signed',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
    value: 1000000, obligations: [] }, over);
  const c1 = mk('MK-1', { obligations: [
    { id: 'a1', desc: 'Quarterly report', due: isoIn(-9), status: 'open', assignee: 'Wanjiku Kamau', party: 'ours' },
    { id: 'a2', desc: 'Pay the first tranche', due: isoIn(-20), status: 'open', assignee: 'Wanjiku Kamau', party: 'ours', amount: 400000 },
    { id: 'a3', desc: 'Pay the second tranche', due: isoIn(-3), status: 'open', assignee: 'Wanjiku Kamau', party: 'ours', amount: 300000, after: 'a2' },
  ] });
  const c2 = mk('MK-2', { obligations: [
    { id: 'b1', desc: 'Deliver the audited accounts', due: isoIn(-3), status: 'open', party: 'theirs', amount: 250000 },
    { id: 'b2', desc: 'Undated duty', due: '', status: 'open', assignee: 'Nobody At All', party: 'ours' },
    { id: 'b3', desc: 'Already filed', due: isoIn(-40), status: 'done', completedAt: isoIn(-41), party: 'ours' },
    { id: 'b4', desc: 'Renew the insurance', due: isoIn(5), status: 'open', assignee: 'Wanjiku Kamau', party: 'ours' },
    { id: 'b5', desc: 'Annual review meeting', due: isoIn(20), status: 'open', assignee: 'Wanjiku Kamau', party: 'ours' },
    { id: 'b6', desc: 'Price review', due: isoIn(120), status: 'open', assignee: 'Wanjiku Kamau', party: 'ours' },
  ] });
  const c3 = mk('MK-3', { status: 'Declined', obligations: [{ id: 'c1', desc: 'Never counted', due: isoIn(-1), status: 'open' }] });
  win.state = Object.assign(win.state || {}, { contracts: [c1, c2, c3], activeId: 'MK-1', view: 'obligations' });
  win.getUsers = () => roster;
  win.currentUser = () => roster[0];
  win.getContract = id => (win.state.contracts.find(x => x.id === id) || null);
  return { win, c1, c2, c3 };
}
const byId = (list, id) => list.find(x => x.id === id);

describe('f390 (1) — the Obligations page: seven windows, one population, one predicate', () => {
  test('1a the windows are the drawing\'s seven, in the order a reader works them', () => {
    const { win } = obBook();
    assert.ok(Array.isArray(win.OB_WINDOWS), 'OB_WINDOWS is published');
    assert.equal(Array.from(win.OB_WINDOWS).map(x => x[0]).join(','),
      'overdue,week,month,later,nodate,waiting,done');
  });
  test('1b every obligation lands in exactly one window, and a held step is WAITING, not overdue', () => {
    const { win, c1, c2 } = obBook();
    const W = (c, id) => win.obligationWindow(byId(c.obligations, id), c);
    assert.equal(W(c1, 'a1'), 'overdue');
    assert.equal(W(c1, 'a3'), 'waiting', 'late by the calendar and by nobody\'s fault — its step before it is not done');
    assert.equal(W(c2, 'b2'), 'nodate');
    assert.equal(W(c2, 'b3'), 'done');
    assert.equal(W(c2, 'b4'), 'week');
    assert.equal(W(c2, 'b5'), 'month');
    assert.equal(W(c2, 'b6'), 'later');
  });
  test('1c the Overdue view and the sidebar door count the SAME obligations', () => {
    /* It asked obState, so a held-back step counted overdue on the page while
       the door and the group heading both called it waiting: a door reading
       N opened a list of N+1. */
    const { win } = obBook();
    const f = Object.assign({}, win.obwFilters(), { whose: 'all', state: 'overdue', side: 'all', folder: 'all', due: 'all' });
    const rows = win.obwRows(f);
    assert.ok(!rows.some(r => r.id === 'a3'), 'the held step is not in Overdue');
    assert.equal(rows.length, win.obligationsDoorCount(), 'the view and the door agree');
  });
  test('1d the population is read ONCE and the predicate is ONE function', () => {
    assert.ok(fnOf(OB, 'obwBook'), 'obwBook is the population');
    assert.match(fnOf(OB, 'obwBook'), /allObligations\(\)/, 'and it borrows allObligations');
    assert.ok(fnOf(OB, 'obwPass'), 'obwPass is the predicate');
    assert.match(fnOf(OB, 'obwRows'), /obwBook\(\)[\s\S]*obwPass\(o, f\)/, 'the list asks both');
  });
  test('1e "Nobody owns it" is a fact about OUR side — an obligation of theirs has an owner', () => {
    const { win } = obBook();
    const f = Object.assign({}, win.obwFilters(), { whose: 'none', state: 'open', side: 'all', folder: 'all', due: 'all' });
    const ids = win.obwRows(f).map(r => r.id);
    assert.ok(ids.includes('b2'), 'the one named after nobody is there');
    assert.ok(!ids.includes('b1'), 'the theirs one is not — the other side owes it');
  });
  test('1f money in four directions and never netted', () => {
    const { win, c1, c2 } = obBook();
    const list = [byId(c1.obligations, 'a2'), byId(c2.obligations, 'b1')].map(o => Object.assign({ _c: o.id === 'a2' ? c1 : c2 }, o));
    const m = win.obMoneyWords(list);
    assert.ok(m && typeof m.text === 'string' && m.text.length, 'it says something');
    const owe = win.i18t('ob_mw_owe', { amt: '§' }).split('§')[0].trim();
    const owed = win.i18t('ob_mw_owed', { amt: '§' }).split('§')[0].trim();
    assert.ok(m.text.includes(owe) && m.text.includes(owed), 'what we owe and what we are owed, stated apart: ' + m.text);
  });
  test('1g the reminders are said as the sweep sends them', () => {
    const { win, c1, c2 } = obBook();
    const say = (c, id) => String(win.obligationReminderSay(byId(c.obligations, id), c)).replace(/<[^>]+>/g, '');
    assert.match(say(c2, 'b2'), new RegExp(win.i18t('ob_rem_nodate').slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      'a dateless one is never sent about');
    assert.ok(/Wanjiku/.test(say(c2, 'b6')), 'an owned one names the person the mail reaches');
    assert.ok(say(c1, 'a3').includes(win.i18t('ob_rem_held', { n: 1, who: '' }).split('{')[0].slice(0, 10)),
      'a held step is held: nothing fires until the step before it is done');
    const src = fnOf(OB, 'obligationReminderSay');
    assert.match(src, /\[\[-7, first\], \[0, first\], \[1, first\], \[4, admins\]\]/,
      'seven days before, the day, the day after, then the admins four days late — runReminders\' own milestones');
  });
  test('1h Remove asks first, and a person\'s trail is read RAW, never initialised', () => {
    assert.match(fnOf(OB, 'obligationRemove'), /confirmDialog[\s\S]*splice/, 'the question comes before the cut');
    assert.match(fnOf(OB, 'obligationHistory'), /if\(!c \|\| !Array\.isArray\(c\.audit\)\) return null;/,
      'where the light list stripped the trail it says so rather than claiming nothing happened');
  });
});

describe('f390 (2) — the contract\'s tab and the page are one builder', () => {
  test('2a the tab draws the Inspector where the width holds it, and its own classic shape below', () => {
    const src = fnOf(OB, 'roomPaintObligations');
    assert.match(src, /insFits\(\)/, 'the width is asked');
    assert.match(src, /roomObligationsInspector\(c, host\)/, 'the Inspector is drawn');
    assert.match(src, /roomObligationsHtml\(c\)/, 'and the classic tab below it — nothing is lost on a narrow window');
  });
  test('2b one list builder and one panel for both', () => {
    assert.match(fnOf(OB, 'renderObligationsInspector'), /obListHtml\(/);
    assert.match(fnOf(OB, 'roomObligationsInspector'), /obListHtml\(/);
    assert.match(fnOf(OB, 'renderObligationsInspector'), /obPaintPanel\(/);
    assert.match(fnOf(OB, 'roomObligationsInspector'), /obPaintPanel\(/);
  });
});

/* ---- the Requests page ---- */
function ikWorld(){
  const w = buildWorld({ intakeView: true });
  const win = w.win;
  win.state = Object.assign(win.state || {}, { contracts: [], settings: (win.state && win.state.settings) || {} });
  win.currentUser = () => ({ id: 'u1', name: 'Young Mbagaya', role: 'admin' });
  return win;
}
const REQ = o => Object.assign({ id: 'REQ-1', title: 'NDA', need: 'x', counterparty: '', folder: '', status: 'open',
  by: { id: 'u9', name: 'Faith Njeri' }, createdAt: new Date().toISOString() }, o || {});

describe('f390 (3) — the Requests page and its three rulings', () => {
  test('3a a request somebody holds reads "being worked on", never "waiting"', () => {
    const win = ikWorld();
    assert.equal(typeof win.intakeStatusKey, 'function', 'the one reading of which word a request wears');
    assert.equal(win.intakeStatusKey(REQ({ assignee: { id: 'u2', name: 'Amina' } })), 'held');
    assert.equal(win.intakeStatusKey(REQ()), 'open', '[control] one nobody holds is still waiting');
    assert.ok(win.INTAKE_STATUS.held && /work/i.test(win.INTAKE_STATUS.held.label), 'and the word says so');
  });
  test('3b the tracker link says the same — asked of the same two columns', () => {
    const a = SRV.indexOf('const TRACK_STAGE'), b = SRV.indexOf("app.get('/track/:token'");
    assert.ok(a > 0 && b > a, 'the tracker page was found');
    const page = new Function(SRV.slice(a, b) + '; return trackPageHtml;')();
    const r = { id: 'REQ-1', title: 'NDA', need: 'x', status: 'open', by_name: 'Faith', created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(), assignee_id: 'u2', assignee_name: 'Amina Otieno' };
    assert.match(page(r), /Being worked on/, 'a held request is being worked on');
    assert.match(page(Object.assign({}, r, { assignee_id: null, assignee_name: null })), /Waiting to be picked up/,
      '[control] one nobody holds is still waiting');
  });
  test('3c a request a colleague holds is TAKEN OVER, and that asks first', () => {
    const win = ikWorld();
    assert.equal(win.intakePickLabel(REQ({ assignee: { id: 'u2', name: 'Amina' } })), win.i18t('ik_act_take'));
    assert.equal(win.intakePickLabel(REQ({ assignee: { id: 'u1', name: 'Young' } })), win.i18t('ik_act_drop'), '[control] your own puts down');
    assert.equal(win.intakePickLabel(REQ()), win.i18t('ik_act_pick'), '[control] nobody\'s is picked up');
    const take = fnOf(IK, 'intakeTakeOver');
    assert.ok(take, 'the act exists');
    assert.ok(take.indexOf('confirmDialog') > -1 && take.indexOf('confirmDialog') < take.indexOf('intakePatch'),
      'it asks before it moves anything');
    assert.match(fnOf(IK, 'intakePick'), /return intakeTakeOver\(id\)/, 'and the one control routes to it');
  });
  test('3d the Ask window leads with the helping sentence', () => {
    const form = fnOf(IK, 'openIntakeForm');
    const lead = form.indexOf('id="ik-lead"'), first = form.indexOf('ik-f-title');
    assert.ok(lead > 0 && (first < 0 || lead < first), 'the sentence is at the top of the window');
    assert.match(form, /ik_lead_asker/, 'and it is the sentence that left the page');
  });
  test('3e four piles, from the reader\'s chair — a finished request this month is the team\'s last pile', () => {
    const win = ikWorld();
    assert.equal(Array.from(win.IK_GROUPS).map(g => g[0]).join(','), 'over,nobody,held,fin,old');
    const past = REQ({ status: 'open', assignee: { id: 'u2', name: 'A' }, promisedAt: isoIn(-2) });
    assert.equal(win.intakeStage(past), 'over', 'a promise that has passed leads');
    assert.equal(win.intakeStage(REQ({ assignee: { id: 'u2', name: 'A' } })), 'held');
    assert.equal(win.intakeStage(REQ()), 'nobody');
  });
});

/* ---- Our standards ---- */
function stdWorld(contracts){
  const w = buildWorld({ standards: true });
  const win = w.win;
  win.state = Object.assign(win.state || {}, { contracts: contracts || [], settings: {} });
  return win;
}
const V = (category, status, extra) => Object.assign({ category, status, quote: status === 'deviation' ? 'ninety days' : '' }, extra || {});
function checked(id, verdicts, over){
  return Object.assign({ id, name: 'Agreement ' + id, counterparty: 'Nordkust', status: 'Under Review', folder: 'proc',
    playbook: { key: 'supply', label: 'Supply', source: 'heuristic', checkedAt: new Date().toISOString(), verdicts } }, over || {});
}

describe('f390 (4) — Our standards: who departs from what, each book once', () => {
  test('4a the checked book is every contract carrying a check, less the shelf and the closed deals', () => {
    const win = stdWorld([
      checked('A', [V('Payment terms', 'deviation')]),
      checked('B', [V('Payment terms', 'aligned')]),
      checked('C', [V('Payment terms', 'deviation')], { status: 'Declined' }),
      checked('D', [V('Payment terms', 'deviation')], { archived: { at: '2026-01-01', by: 'x' } }),
      { id: 'E', status: 'Signed' },
    ]);
    /* Joined, never deep-compared: an array born inside the stage's own
       realm carries that realm's prototype (the performance audit's lesson). */
    assert.equal(win.stdCheckedBook().map(c => c.id).join(','), 'A,B');
    assert.equal(win.stdDepartsFrom('Payment terms').map(x => x.c.id).join(','), 'A', 'and only A departs');
  });
  test('4b an accepted departure still departs — and no longer needs Legal', () => {
    const win = stdWorld([checked('A', [V('Liability cap', 'deviation', { escalate: true, accepted: { by: 'Y', why: 'agreed' } }),
      V('Payment terms', 'missing', { escalate: true })])]);
    const deps = win.stdDepartures(win.state.contracts[0]);
    assert.equal(deps.length, 2);
    assert.equal(deps.filter(win.stdNeedsLegal).length, 1, 'the accepted one does not');
  });
  test('4c a book lists each standard ONCE — a position and a limit of one name are one line', () => {
    const win = stdWorld([]);
    const lines = win.stdBookLines('supply');
    const cats = lines.map(l => l.category.toLowerCase());
    assert.equal(cats.filter(c => c === 'liability cap').length, 1, 'Liability cap was two chips on the supply book');
    const cap = lines.find(l => l.category.toLowerCase() === 'liability cap');
    assert.ok(cap.limit, 'and the one line carries the limit');
    assert.equal(cap.own, true, 'the supply book names it itself');
    assert.equal(lines.find(l => l.category === 'Governing law').own, false, 'governing law comes from the baseline');
  });
  test('4d the book a position is held in — "Change the position" lands there', () => {
    const win = stdWorld([]);
    assert.equal(win.stdBookFor('Payment terms'), '_default', 'the baseline names it');
    assert.equal(win.stdBookFor('Quality & rejection'), 'supply', 'only the supply book does');
    assert.equal(win.stdBookFor('Something nobody holds'), '_default', 'and nothing named falls to the baseline');
  });
  test('4e the words that choose a book are playbookKeyFor\'s own list', () => {
    const win = stdWorld([]);
    assert.equal(Array.from(win.pbTypeWords('supply')).slice(0, 4).join(','), 'supply,packaging,raw material,manufacturing');
    assert.equal(win.pbTypeWords('_default'), null, 'the baseline is chosen by nothing');
    assert.match(fnOf(PB, 'playbookKeyFor'), /PB_TYPE_RES/, 'the rule reads the same list the page prints');
  });
  test('4f [wall] and playbookKeyFor still answers every key it answered', () => {
    const old = k => { k = k.toLowerCase();
      if (/nda|non-disclosure/.test(k)) return 'nda'; if (/lease/.test(k)) return 'lease';
      if (/professional|marketing|services|advisory|agency/.test(k)) return 'services';
      if (/supply|packaging|raw material|manufactur|co-pack|distribut|warehous|freight|logistics|retail/.test(k)) return 'supply';
      return '_default'; };
    const win = stdWorld([]);
    for (const kind of ['Mutual NDA', 'Non-Disclosure Agreement', 'Equipment Lease', 'Professional Services', 'Marketing Agency',
      'Raw Material Supply', 'Contract Manufacturing', 'Co-packing', 'Distributor', 'Warehousing', 'Freight Forwarding',
      'Retail Listing', 'Software Licence', 'Loan Agreement']) {
      win.cKind = () => kind;
      assert.equal(win.playbookKeyFor({ id: 'X', folder: 'legal' }), old(kind), kind);
    }
  });
  test('4g every save on the page repaints the page it was made on', () => {
    assert.match(fnOf(SET, 'renderClauseLibrary'), /pbInsMounted\(\)\)\{ renderPlaybookPage\(\); return; \}/);
    assert.match(fnOf(SET, 'renderPlaybookView'), /pbInsMounted\(\)\)\{ renderPlaybookPage\(\); return; \}/);
  });
  test('4h removing a standard asks first; a book\'s two throw-away acts are one function each, pressed from both shapes', () => {
    assert.ok(fnOf(SET, 'stdRemoveClause').indexOf('confirmDialog') < fnOf(SET, 'stdRemoveClause').indexOf('saveClauseLibrary'),
      'the question comes before the write');
    const view = fnOf(SET, 'renderPlaybookView');
    assert.match(view, /pbRemoveType\(/, 'the classic book row presses the one act');
    assert.match(view, /pbResetPlaybook\(\)/);
    assert.match(LIB, /onMenu:act=>\{ if\(act==='reset'\) pbResetPlaybook\(\); else if\(act==='remove'\) pbRemoveType\(key\); \}/,
      'and so does the Inspector\'s panel');
  });
  test('4i a tab press is still class flips — never a rebuild — and it repaints the head', () => {
    const h = /document\.querySelectorAll\('\[data-pb-tab\]'\)\.forEach\(b=>b\.addEventListener\('click'[\s\S]*?\}\)\);/.exec(LIB);
    assert.ok(h, 'one handler');
    assert.ok(!/renderPlaybookPage\(\)/.test(h[0]));
    assert.match(h[0], /pbPaintHead\(\)/, 'and the head says what the new tab holds');
  });
});

describe('f390 (5) — the shared frame', () => {
  test('5a the header\'s two slots are painted by each page\'s own painter', () => {
    const m = /const PAGE_HEAD_PAINT = \{([^}]*)\}/.exec(APP);
    assert.ok(m, 'one table');
    for (const [v, fn] of [['obligations', 'obwPaintHead'], ['intake', 'ikPaintHead'], ['playbook', 'pbPaintHead']])
      assert.match(m[1], new RegExp(v + "\\s*:\\s*'" + fn + "'"), v);
  });
  test('5b a width that crosses the line repaints each page in its other shape', () => {
    const m = /const INS_PAGE_REPAINT = \{([\s\S]*?)\n\};/.exec(INS);
    assert.ok(m, 'one table');
    for (const k of ['obligations', 'intake', 'playbook', 'oblig']) assert.match(m[1], new RegExp('\\b' + k + ':'), k);
  });
  test('5c every page names the shape it painted, in both shapes', () => {
    assert.match(OB, /data-ins-page="obligations" data-ins="1"/);
    assert.match(OB, /data-ins-page="obligations" data-ins="0"/);
    assert.match(IK, /data-ins-page="intake" data-ins="1"/);
    assert.match(IK, /data-ins-page="intake" data-ins="0"/);
    assert.match(LIB, /data-ins-page="playbook" data-ins="1"/);
    assert.match(LIB, /data-ins-page="playbook" data-ins="0"/);
  });
  test('5d a tab grid that states its own display is told what [hidden] means', () => {
    assert.match(HTML, /\.ins-body\[hidden\]\{display:none;\}/);
  });
  test('5e the new names are published', () => {
    const pub = s => (/Object\.assign\(window,\s*\{([\s\S]*?)\}\);\s*$/.exec(s.trim()) || [])[1] || '';
    for (const n of ['obwBook', 'obwPass', 'renderObligationsInspector', 'roomObligationsInspector', 'obligationWindow', 'obMoneyWords'])
      assert.match(pub(OB), new RegExp('\\b' + n + '\\b'), n);
    for (const n of ['intakeStatusKey', 'intakePickLabel', 'intakeTakeOver', 'renderIntakeInspector', 'ikPaintHead'])
      assert.match(pub(IK), new RegExp('\\b' + n + '\\b'), n);
    for (const n of ['stdCheckedBook', 'stdDepartsFrom', 'stdBookLines', 'stdBookFor'])
      assert.match(STD, new RegExp('\\b' + n + '\\b[,\\s]'), n);
  });
});

describe('f390 (6) — the words exist in both languages', () => {
  const svAt = I18N.search(/\n\s*sv\s*:\s*\{/);
  const EN = I18N.slice(0, svAt), SV = I18N.slice(svAt);
  const has = (k, b) => new RegExp('(^|[\\s,{])' + k + '(_one|_other)?\\s*:', 'm').test(b);
  test('[wall] every key the four pages print', () => {
    const used = new Set();
    for (const src of [read('js/obligations.js'), read('js/views/intake.js'), read('js/views/library.js'), read('js/views/inspector.js')])
      for (const m of src.matchAll(/['"]((?:ob|ik|sd|ins)_[a-z0-9_]+)['"]/g)) if (!/_$/.test(m[1])) used.add(m[1]);
    const missing = [...used].filter(k => !has(k, EN) || !has(k, SV));
    assert.deepEqual(missing, []);
  });
});
