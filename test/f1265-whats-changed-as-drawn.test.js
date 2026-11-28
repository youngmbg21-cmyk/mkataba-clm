'use strict';
/* f1265 — WHAT'S CHANGED, AS DRAWN (owner, 28 Nov 2026: "why would you tell me you built something and not give me what
   you stated?"). The drawing: "8 things since yesterday, 16:40." · Replies · Mentions · Decisions · Dates moved · Stage,
   each counted with Open, Mark all seen, and "Read from: History, notes, approvals and duties · no Jambo call".
   Read off HaTi's own records, no AI; only Mark all seen moves the mark. */
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CA = strip(R('js/copilotacts.js')), I = R('js/i18n.js'), APP = strip(R('js/app.js'));

function load(){
  const en = {};
  for (const m of I.matchAll(/^ {4}(ca_(?:cmd|chg)_[a-z_0-9]+): (['"])((?:(?!\2)[^\\]|\\.)*)\2,$/gm)) if (!(m[1] in en)) en[m[1]] = m[3].replace(/\\'/g, "'");
  const store = {};
  const ctx = { window: {}, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
    currentUser: () => ({ id: 'u1', name: 'Young M' }), contractRef: c => c.contractNo || c.id, langLocale: () => 'en-GB',
    _caT: (k, v) => String(en[k] || k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null) ? v[n] : ''),
    _caE: s => String(s), Date, JSON, Array, Set, Object, String, Number, RegExp, isFinite };
  vm.createContext(ctx);
  const at = n => { const i = CA.indexOf(n); assert.ok(i >= 0, n); return i; };
  const grab = n => CA.slice(at(n), CA.indexOf('\n}\n', at(n)) + 3);
  const line = n => CA.slice(at(n), CA.indexOf('\n', at(n)) + 1);
  const src = ['const CA_SINCE_KEY', 'const CA_CHANGED_DAYS', 'const CA_CHANGED_GROUPS', 'const CA_CHANGED_READ', 'const _caCmdBook', 'function caUsesWho', 'function caRef', 'function caCmdMarkAll', 'function caCmdEndOf'].map(line).join('')
    + CA.slice(CA.indexOf('const CA_CHG_KIND'), CA.indexOf('};', CA.indexOf('const CA_CHG_KIND')) + 3)
    + ['function caCmdMark(', 'function caCmdMarkSeen', 'function caCmdTrailSince', 'function caCmdBookMoves', 'function caCmdDaySaid', 'function caCmdWhenSaid', 'function caCmdChangedHtml'].map(grab).join('\n');
  vm.runInContext(src + '\nObject.assign(this, { caCmdMark, caCmdMarkSeen, caCmdTrailSince, caCmdBookMoves, caCmdChangedHtml });', ctx);
  return { ctx, store };
}
const SAYS = { 'negotiation|round': 'round', 'approved|': 'approved', 'negotiation|note': 'note', 'obligation|': 'duty', 'edited|': 'edited', 'created|': 'filed' };
function sayer(a){ const k = Object.keys(SAYS).find(x => { const [act, det] = x.split('|'); return a.action.toLowerCase() === act && (!det || a.detail.toLowerCase().includes(det)); });
  return { line: `${a.user} ${a.action} ${a.id}`, say: k ? SAYS[k] : '' }; }

describe('f1265 (1) What\'s changed counts off the record, as drawn', () => {
  test('the trail since the mark, others\' entries only, in the drawing\'s groups', () => {
    const { ctx } = load(); ctx.window.actSayOf = sayer;
    const since = Date.parse('2026-11-27T16:40:00Z');
    const feed = [
      { id: 'MK-398', action: 'Negotiation', detail: 'Round 2 sent', user: 'Juno', at: '2026-11-28T09:00:00Z' },
      { id: 'MK-399', action: 'Negotiation', detail: 'Internal note: @young please look at § 3', user: 'Erik', at: '2026-11-28T08:00:00Z' },
      { id: 'MK-399', action: 'Negotiation', detail: 'Internal note: lunch?', user: 'Erik', at: '2026-11-28T08:01:00Z' },
      { id: 'MK-401', action: 'Approved', detail: '', user: 'Maria', at: '2026-11-28T07:00:00Z' },
      { id: 'MK-401', action: 'Obligation', detail: 'Completed: Send forecast', user: 'Maria', at: '2026-11-28T07:30:00Z' },
      { id: 'MK-401', action: 'Obligation', detail: 'Added: Send forecast', user: 'Maria', at: '2026-11-28T07:31:00Z' },
      { id: 'MK-402', action: 'Approved', detail: '', user: 'Young M', at: '2026-11-28T07:00:00Z' },
      { id: 'MK-403', action: 'Approved', detail: '', user: 'Maria', at: '2026-11-27T10:00:00Z' }];
    const T = Array.from(ctx.caCmdTrailSince(feed, since));
    assert.deepEqual(T.map(x => x.g + ':' + x.line), ['replies:Juno answered on MK-398', 'notes:Erik wrote a note on MK-399', 'mentions:Erik mentioned you on MK-399',
      'added:Maria added a duty on MK-401', 'decisions:Maria marked a duty done on MK-401', 'decisions:Maria approved MK-401', 'byyou:You approved MK-402'],
      'a note naming me is a mention, one that does not is a note; my own in By you; before the mark not counted');
    const two = Array.from(ctx.caCmdTrailSince(feed.concat([{ id: 'MK-401', action: 'Obligation', detail: 'Completed: Pay', user: 'Maria', at: '2026-11-28T07:40:00Z' }]), since));
    assert.ok(two.some(x => x.line === 'Maria marked 2 duties done on MK-401'), 'the same act by one person on one agreement is one line, counted');
  });
  test('Dates moved and Stage compare the book with the mark\'s snapshot; none before a mark', () => {
    const { ctx } = load();
    const A = { id: 'MK-377', status: 'Active', expiry: '2027-03-01' }, B = { id: 'MK-420', status: 'Negotiating', expiry: '' };
    ctx.state = { contracts: [A, B] };
    assert.equal(ctx.caCmdBookMoves(null).length, 0);
    const mark = { at: '2026-11-27T16:40:00Z', snap: { 'MK-377': ['Active', '2027-02-01'], 'MK-420': ['Draft', ''] } };
    assert.deepEqual(Array.from(ctx.caCmdBookMoves(mark)).map(x => x.g + ':' + x.line), ['dates:MK-377 now ends 1 Mar 2027, not 1 Feb 2027', 'stage:MK-420 moved to Negotiating']);
  });
  test('only Mark all seen moves the mark, and it keeps each agreement\'s stage and end day', () => {
    const { ctx, store } = load();
    ctx.state = { contracts: [{ id: 'MK-1', status: 'Active', expiry: '2027-01-01' }] };
    assert.equal(ctx.caCmdMark(), null);
    assert.equal(ctx.caCmdMarkSeen('2026-11-28T10:00:00Z'), true);
    assert.deepEqual(JSON.parse(store['hati.v1.jamboSince']).u1, { at: '2026-11-28T10:00:00Z', snap: { 'MK-1': ['Active', '2027-01-01'] } });
    assert.doesNotMatch(grabRows(), /caCmdMarkSeen|caCmdSince/, 'opening the "/" list moves nothing');
  });
  test('the card: the lead in bold, a row a group with its count and Open, Mark all seen, the source line', () => {
    const { ctx } = load();
    const items = [{ g: 'replies', id: 'MK-398', line: 'Juno answered' }, { g: 'replies', id: 'MK-412', line: 'AIT signed' }, { g: 'stage', id: 'MK-420', line: 'MK-420 moved to Negotiating' },
      { g: 'decisions', id: 'MK-401', line: 'Maria marked 2 duties done on MK-401', n: 2 }];
    const h = ctx.caCmdChangedHtml(items, { at: '2026-01-05T16:40:00Z' }, '2026-01-05T16:40:00Z');
    assert.match(h, /<p><b>5 things since [^<]+\.<\/b><\/p>/, 'every event counted, a line of two counts two');
    assert.match(h, /<b>Decisions <span class="ca-cmd-n">2<\/span><\/b>/);
    assert.match(h, /<b>Replies <span class="ca-cmd-n">2<\/span><\/b><small>Juno answered · AIT signed<\/small>/);
    assert.match(h, /<b>Stage <span class="ca-cmd-n">1<\/span><\/b>/);
    assert.doesNotMatch(h, /Mentions|Dates moved/, 'a group with nothing is not drawn');
    assert.equal((h.match(/data-ca-cmd-go="open"/g) || []).length, 3);
    assert.match(h, /data-ca-cmd-seen>Mark all seen</);
    assert.match(h, /Read from: History, notes, approvals and duties · no Jambo call/);
    const w = ctx.caCmdChangedHtml([], null, '2026-01-01T00:00:00Z');
    assert.match(w, /Nothing has changed in the last 7 days\./); assert.match(w, /counted from now on/);
    assert.match(ctx.caCmdChangedHtml([], null, '2026-01-01T00:00:00Z', true), /Only the latest 200 events were read/, 'a cap is said');
  });
});
function grabRows(){ const i = CA.indexOf('function caCmdRows'); return CA.slice(i, CA.indexOf('\n}\n', i)); }

describe('f1265 (2) wired: acts at once, no Jambo call', () => {
  test('choosing it draws the card in the box\'s conversation, read off the trail, never asking Jambo', () => {
    assert.match(CA, /\{ k: 'changed', act: true \}/);
    assert.match(CA, /if \(k === 'changed'\) return caCmdChanged\(host, said && /);
    const f = CA.slice(CA.indexOf('async function caCmdChanged'), CA.indexOf('\n}\n', CA.indexOf('async function caCmdChanged')));
    assert.match(f, /api\('activity\?limit=' \+ CA_CHANGED_READ\)/);
    assert.match(f, /if \(!mark\) caCmdMarkSeen\(\);/, 'the starting point is kept on first use');
    assert.match(CA, /const CA_CHANGED_GROUPS = \['replies', 'mentions', 'notes', 'decisions', 'sent', 'added', 'edited', 'dates', 'stage', 'byyou'\];/);
    assert.match(f, /caCmdSay\(host, asked \? String\(asked\) : period != null \? _caT\('ca_chg_asked_p', \{ p: caCmdChgCtx\(S, p\) \}\) : _caT\('ca_chg_asked'\)/, 'the question in words, as drawn; typed words stand as typed');
    assert.doesNotMatch(f, /ai\/|caAskAnywhere|aiAskWords|intelAsk/);
    assert.match(CA, /closest\('\[data-ca-cmd-seen\]'\)/);
    assert.match(APP, /activityFeedState,relTime,activityRow\}\)/);
    assert.match(CA, /window\.intel\.history\.push\(\{ role: 'user', text: q \}/, 'said once, not escaped twice ("What&#39;s")');
    assert.match(CA, /const CA_CMD_READ = \{ cid: null, text: '' \};/);
    assert.equal((CA.match(/read: CA_CMD_READ/g) || []).length, 2, 'no "Read from <the contract on screen>" under a command over the book');
  });
  test('the words are in both books', () => {
    for (const k of ['ca_chg_g_replies', 'ca_chg_g_mentions', 'ca_chg_g_decisions', 'ca_chg_g_dates', 'ca_chg_g_stage', 'ca_chg_lead', 'ca_chg_lead_week', 'ca_chg_none',
      'ca_chg_none_week', 'ca_chg_mark_seen', 'ca_chg_marked', 'ca_chg_mark_failed', 'ca_chg_from', 'ca_chg_asked', 'ca_chg_first_mark', 'ca_chg_stage_moved', 'ca_chg_end_moved'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});

describe('f1265 (3) "Jambo · since yesterday 16:40" beside his name (owner\'s yes, 28 Nov 2026)', () => {
  const CO = strip(R('js/components.js'));
  const grabC = n => { const i = CO.indexOf(n); assert.ok(i >= 0, n); return CO.slice(i, CO.indexOf('\n}\n', i) + 3); };
  function heads(H){
    const ctx = { window: { ai: { history: H } }, document: undefined };
    vm.createContext(ctx);
    vm.runInContext(['function jamboConvo', 'function jamboHeadCtxOf', 'function jamboHeadCtxHtml'].map(grabC).join('\n') + '\nthis.f = jamboHeadCtxHtml;', ctx);
    return ctx.f();
  }
  test('the newest turn\'s context is said after his name; any later turn clears it', () => {
    assert.equal(heads([{ role: 'user', text: 'q' }, { role: 'assistant', text: 'a', ctx: 'since yesterday 16:40' }]),
      '<span class="jb-head-ctx" title="since yesterday 16:40">· since yesterday 16:40</span>');
    assert.match(heads([{ role: 'assistant', text: 'a', ctx: 'since yesterday 16:40' }, { role: 'user', text: 'more?' }]), /<span class="jb-head-ctx" hidden><\/span>/);
    assert.match(heads([]), / hidden>/);
  });
  test('drawn with the one label over the conversation, kept in step where the head is painted once, said by What\'s changed', () => {
    assert.match(grabC('function jamboTalkLabelHtml'), /\$\{jamboHeadCtxHtml\(\)\}`;/);
    assert.match(grabC('function jamboReadStamp'), /jamboHeadCtxSync\(\);/);
    assert.match(CA, /S\.mark \? _caT\('ca_chg_ctx', \{ since: caCmdWhenSaid\(S\.mark\.at\)/);
    assert.match(R('index.html'), /\.jb-talk-label\[hidden\] \+ \.jb-head-ctx\{display:none\}/);
    for (const k of ['ca_chg_ctx', 'ca_chg_ctx_week']) assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});

/* HOW FAR BACK, THE LEGORA + STRIPE WAY (owner's pick, 28 Nov 2026): chips with counts — Since last seen · 7 · 30 · 90
   days · Pick a date — a period typed in any box, the head saying the period; Dates moved and Stage only since the mark */
describe('f1265 (4) how far back: chips with counts, a period typed, the mark never moved', () => {
  function load4(){
    const { ctx, store } = load();
    const at = n => { const i = CA.indexOf(n); assert.ok(i >= 0, n); return i; };
    const grab = n => CA.slice(at(n), CA.indexOf('\n}\n', at(n)) + 3);
    vm.runInContext(CA.slice(at('const CA_CHG_PERIODS'), CA.indexOf('\n', at('const CA_CHG_PERIODS')) + 1)
      + ['function caCmdChgStart', 'function caCmdChgDay', 'function caCmdChgRead', 'function caCmdChgCount', 'function caCmdChgCtx', 'function caCmdChgChipsHtml', 'function caCmdChgHtml', 'function caCmdChgPeriodOf'].map(grab).join('\n')
      + '\nObject.assign(this, { caCmdChgRead, caCmdChgChipsHtml, caCmdChgHtml, caCmdChgPeriodOf, caCmdChgCtx });', ctx);
    ctx.window.actSayOf = sayer; ctx.state = { contracts: [{ id: 'MK-377', status: 'Active', expiry: '2027-03-01' }] };
    return { ctx, store };
  }
  const ago = d => new Date(Date.now() - d * 864e5).toISOString();
  const FEED = [1, 2, 5, 12, 20, 45, 80, 120].map((d, i) => ({ id: 'MK-40' + i, action: 'Approved', detail: '', user: 'Maria', at: ago(d) }));
  test('each chip counts its own period off the one read; the chosen one is lit; the lead and the head say the period', () => {
    const { ctx } = load4();
    const S = { feed: FEED, mark: { at: ago(3), snap: { 'MK-377': ['Draft', '2027-02-01'] } }, period: 30 };
    const h = ctx.caCmdChgHtml(S);
    assert.match(h, /<p><b>5 things in the last 30 days\.<\/b><\/p><div class="ca-chg-chips"/);
    assert.match(h, /data-ca-chg-p="seen" aria-pressed="false">Since last seen <span class="ca-cmd-n">4<\/span>/, 'since the mark: 2 approvals + stage + date moves');
    assert.match(h, /data-ca-chg-p="7" aria-pressed="false">7 days <span class="ca-cmd-n">3<\/span>/);
    assert.match(h, /class="ca-chg-chip is-on" data-ca-chg-p="30" aria-pressed="true">30 days <span class="ca-cmd-n">5<\/span>/);
    assert.match(h, /data-ca-chg-p="90" aria-pressed="false">90 days <span class="ca-cmd-n">7<\/span>/);
    assert.match(h, /data-ca-chg-pick>Pick a date</);
    assert.doesNotMatch(h, /<b>Dates moved|<b>Stage </, 'moves are counted against the mark only');
    assert.match(h, /Dates moved and Stage are counted only since your last Mark all seen\./);
    assert.equal(ctx.caCmdChgCtx(S, 30), 'last 30 days');
    const seen = ctx.caCmdChgHtml(Object.assign({}, S, { period: 'seen' }));
    assert.match(seen, /<b>Dates moved/); assert.doesNotMatch(seen, /counted only since your last Mark/);
  });
  test('a chosen day stands as its own lit chip; no mark = no "Since last seen"; a count past the read cap says +', () => {
    const { ctx } = load4();
    const S = { feed: FEED, mark: null, period: new Date(Date.now() - 10 * 864e5).toISOString().slice(0, 10) };
    const h = ctx.caCmdChgHtml(S);
    assert.doesNotMatch(h, /data-ca-chg-p="seen"/);
    assert.match(h, /class="ca-chg-chip is-on" data-ca-chg-p="\d{4}-\d{2}-\d{2}" aria-pressed="true">Since \d{1,2} [A-Z][a-z]{2}(?: \d{4})? <span class="ca-cmd-n">3<\/span>/);
    const full = Array.from({ length: 200 }, (_, i) => ({ id: 'MK-' + i, action: 'Approved', detail: '', user: 'Maria', at: ago(1 + i * 0.1) }));
    assert.match(ctx.caCmdChgChipsHtml({ feed: full, mark: null, period: 7 }), /90 days <span class="ca-cmd-n">200\+<\/span>/);
    assert.match(ctx.caCmdChgHtml({ feed: [], mark: null, period: 7, picking: true }), /<input type="date" class="ca-chg-day" data-ca-chg-day max="\d{4}-\d{2}-\d{2}"/);
  });
  test('a period in words, both books; one contract\'s or a version\'s changes are not the book\'s', () => {
    const { ctx } = load4(); const P = ctx.caCmdChgPeriodOf;
    assert.equal(P('What\'s changed in the last 30 days?'), 30);
    assert.equal(P('what has changed in the past 2 weeks'), 14);
    assert.equal(P('/changed 90'), 90);
    assert.equal(P('vad har ändrats de senaste 3 månaderna'), 90);
    const mon = P('what\'s changed since Monday'); assert.match(mon, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(mon + 'T12:00:00').getDay(), 1); assert.ok(Date.parse(mon) < Date.now());
    assert.match(P('vad har ändrats sedan måndag'), /^\d{4}-\d{2}-\d{2}$/);
    assert.match(P('what\'s changed since 3 Nov'), /^\d{4}-11-03$/);
    assert.match(P('what\'s changed since November 3'), /^\d{4}-11-03$/);
    assert.equal(P('what\'s changed since v2'), null);
    assert.equal(P('what\'s changed on MK-398 since Monday'), null);
    assert.equal(P('what\'s changed'), null, 'no period: the command as before');
    const typed = CA.slice(CA.indexOf('function caCmdTyped'), CA.indexOf('\n}\n', CA.indexOf('function caCmdTyped')));
    assert.match(typed, /const p = caCmdChgPeriodOf\(t\); if \(p != null\)\{ caCmdChanged\(host \|\| caCmdHostOf\(null\), p, t\); return true; \}/);
    assert.match(CA, /closest\('\[data-ca-chg-p\], \[data-ca-chg-pick\]'\)/);
    assert.doesNotMatch(CA.slice(CA.indexOf('function caCmdChgRepaint'), CA.indexOf('\n}\n', CA.indexOf('function caCmdChgRepaint'))), /caCmdMarkSeen/, 'a period never moves the mark');
    for (const k of ['ca_chg_range', 'ca_chg_p_seen', 'ca_chg_p_days', 'ca_chg_p_since', 'ca_chg_p_pick', 'ca_chg_asked_p', 'ca_chg_moves_seen_only'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});
