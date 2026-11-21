/* ============================================================
   F1092 — THE THREE PILES, A NOTE WITH EVERY DECISION, THE BELL ONLY
   ============================================================
   The owner, 17 Nov 2026: "Build Three Piles, admins and Legal, optional note, bell only".

   (1) Approvals & signing's Mine is one list in three titled groups, in the order they matter: departures from our
       standards (never a Nice to have), changes to our standards, then the contracts waiting for a yes. Every press
       is the Standards page's own door (ldDepRun, ldDecideOpen): one way to decide each.
   (2) A yes offers a note, never requires it; a no always asks why. Standard changes left Settings' job list.
   (3) The answer comes back on the bell only — a no light red, a yes light green, the note quoted. Nothing mailed.
   (4) THE WALL: a decision's note never leaves HaTi — not in the copy the other side receives.
   (5) WHO DECIDES: "admins plus named people" (the owner's answer, 17 Nov 2026 — HaTi's Legal role is the Editor
       everyone has): a per-person tick, off by default, an admin's to give; the server is the wall.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };

describe('f1092 (1) three piles, in the order they matter', () => {
  const V = strip(R('js/views/approvalsview.js'));
  test('departures, then changes to our standards, then the contracts', () => {
    const r = fnBody(V, 'apnRender');
    const a = r.indexOf("gTitle('apn_group_dep'"), b = r.indexOf("gTitle('apn_group_std'"), c = r.indexOf("gTitle('apn_group_yes'");
    assert.ok(a > 0 && b > a && c > b, 'the three titles in that order');
    /* RE-POINTED (P-30, owner's pick 20 Nov 2026): the rows pass through the one column cut before they are joined */
    assert.match(r, /\$\{pileHtml\}\$\{rowsA\.map\(cut\)\.join\(''\)\}/, 'the piles lead, the contracts follow');
    assert.match(r, /_apnTab==='mine'\?P\.dep/, 'under Mine only');
    assert.match(r, /\['mine',i18t\('apn_tab_mine'\),W\.all\.yours\.filter\(r=>!r\.done\)\.length\+nPiles\]/, 'the Mine count is every row in it');
  });
  test('a Nice to have never waits on anybody; a departure is listed for an admin or the colleague it was sent to', () => {
    const d = fnBody(V, 'apnDepRows');
    assert.match(d, /if\(s\.firm==='nice'\) continue;/);
    assert.match(d, /const boss=typeof window\.mayDecideStandards==='function'\?window\.mayDecideStandards\(me\)/);
    assert.match(d, /to&&to\.id&&String\(to\.id\)===String\(me\.id\)/);
  });
  test('a change is listed only for somebody who may decide it (never its author)', () => {
    assert.match(fnBody(V, 'apnStdRows'), /ldChanges\(\)\.filter\(ldMayDecide\)/);
  });
  test('one way to decide each: the Standards page\'s own doors', () => {
    const a = fnBody(V, 'apnPileAct');
    assert.match(a, /ldDecideOpen\(key\)/);
    assert.match(a, /ldDepRun\(m\[1\], \+m\[2\], kind\)/);
    const L = strip(R('js/views/ladder.js'));
    /* ONE DOOR FOR A DEPARTURE (17 Nov 2026): the Standards page decides nothing; it sends you to the row */
    const card = fnBody(L, 'ldDepHtml');
    assert.ok(!/data-ld-allow|data-ld-refuse/.test(card), 'no Allow once or Refuse on the Standards page');
    assert.match(card, /data-ld-goap=/);
    assert.match(card, /firm === 'nice' \? ''/, 'a Nice to have carries no decision at all');
    assert.match(fnBody(L, 'ldGoApprovals'), /apnLandRow\(key\)/);
    /* OPEN THE PAPER IS GONE from the Playbook page (owner, 18 Nov 2026): the paper is looked at from the Approvals row */
    assert.ok(!/data-ld-open|ld_open_paper/.test(card), 'no Open the paper on the Playbook page');
    assert.ok(!/function ldDepOpen/.test(L), 'its handler went with it');
    assert.match(fnBody(L, 'ldDepRun'), /signCheckAccept\(c, i, ldAfterDecide\)/, 'Allow once is the sign check\'s own writer');
  });
  test('the head counts the piles too', () => {
    assert.match(fnBody(V, 'apPaintHead'), /\+P\.dep\.length\+P\.std\.length/);
  });
  test('standard changes left Settings\' job list', () => {
    assert.ok(!/ldNeedRows/.test(strip(R('js/views/settings.js'))));
    assert.ok(!/function ldNeedRows/.test(R('js/views/ladder.js')));
  });
});

describe('f1092 (2) a note with every decision', () => {
  test('a yes offers a note and never requires it; cancel decides nothing', () => {
    const A = strip(R('js/approvals.js'));
    const n = fnBody(A, 'approvalYesNote');
    assert.match(n, /required:false/);
    assert.match(n, /if\(v==null\) return null;/);
    const ask = fnBody(A, 'approvalDecideAsk');
    assert.match(ask, /const note=await approvalYesNote\(\); if\(note==null\) return false; return !!\(await approveContract\(c, note\|\|undefined\)\);/);
    assert.match(fnBody(A, 'wireApprovalPanel'), /approvalYesNote\(\)/, 'the Signing tab\'s Approve offers it too');
    assert.match(fnBody(A, 'approveContract'), /comment\?` — “\$\{String\(comment\)/, 'the note is on the contract\'s history');
  });
  test('refusing a departure asks why and keeps it; a refused change needs a reason, a yes does not', () => {
    const L = strip(R('js/views/ladder.js'));
    const run = fnBody(L, 'ldDepRun');
    assert.match(run, /if \(!why\)\{ toast\(i18t\('ld_note_needed'\), 'warn'\); return; \}/);
    assert.match(run, /v\.refused = \{[^}]*why \};/);
    const dec = fnBody(L, 'ldDecideOpen');
    assert.match(dec, /if \(!yes && !why\)/);
    assert.match(dec, /'POST', \{ yes, why \}/);
  });
});

describe('f1092 (3) the answer comes back on the bell, coloured', () => {
  test('a no light red, a yes light green', () => {
    const w = loadViews(['js/views/counter.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
    assert.equal(w.ndTintOf({ tint: 'no' }), ' is-tint-no');
    assert.equal(w.ndTintOf({ tint: 'yes' }), ' is-tint-yes');
    assert.equal(w.ndTintOf({}), '');
    assert.equal(w.ndTintOf(null), '');
    const css = R('index.html');
    assert.match(css, /\.ndb-r\.is-tint-no,html\.lg-new \.ndb-r\.is-tint-yes\{[^}]*background:var\(--st-ruby-bg\)/);
    assert.match(css, /\.ndb-r\.is-tint-yes\{border-left-color:var\(--st-green-dot\);background:var\(--st-green-bg\)\}/);
  });
  test('every decision comes back to the right person, with the decider and the note', () => {
    const A = strip(R('js/app.js'));
    const s = fnBody(A, 'alStandardsAnswers');
    assert.match(s, /contractOwnedBy\(c, me\)/, 'a departure to the contract\'s owner');
    assert.match(s, /mine\(ch\.byId\)/, 'a change to whoever proposed it');
    assert.match(s, /!mine\(r\.byId\)/, 'never your own decision');
    assert.match(s, /q\(r\.why\)/); assert.match(s, /q\(a\.why\)/); assert.match(s, /q\(ch\.decidedWhy\)/);
    const b = fnBody(A, 'buildAlerts');
    assert.match(b, /i18t\('al_ap_cleared_by',\{ who:yes\.by \}\)/, 'who said the last yes');
    assert.match(b, /Object\.assign\(\{ tint:'yes' \}, yes&&yes\.comment/);
    assert.match(b, /Object\.assign\(\{ tint:'no' \}, bad\.comment/);
  });
  test('news is news: a yes and a decided change are never counted as work', () => {
    const w = loadViews(['js/views/counter.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
    for (const k of ['dep-allowed', 'std-approved', 'std-refused']) assert.ok(w.ND_NEWS.includes(k), k);
    assert.ok(!w.ND_NEWS.includes('dep-refused'), 'a refused departure is work: the wording must change');
  });
  test('bell only: nothing here is mailed', () => {
    const s = fnBody(strip(R('js/app.js')), 'alStandardsAnswers');
    assert.ok(!/mail|api\(/i.test(s));
  });
});

describe('f1092 (4) the wall: a decision\'s note never leaves HaTi', () => {
  const SECRET = ['NOTE-ALLOW-7731', 'NOTE-REFUSE-8842', 'NOTE-YES-9953', 'NOTE-NO-1064'];
  test('the copy the other side receives carries none of them', () => {
    const s = loadViews(['js/richdoc.js', 'js/core.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
    const c = { id: 'MK-9', name: 'Courier Services', counterparty: 'Kilele Logistics', template: 'MK', value: 1000, valueType: 'standard',
      fields: {}, folder: 'proc', redlineText: 'THE WORDING', format: 'text',
      playbook: { at: '2026-11-01T00:00:00.000Z', verdicts: [
        { category: 'Liability cap', status: 'deviation', quote: 'three months', accepted: { by: 'A', at: '2026-11-02T00:00:00.000Z', why: SECRET[0] } },
        { category: 'Payment terms', status: 'deviation', quote: 'sixty days', refused: { by: 'B', at: '2026-11-02T00:00:00.000Z', why: SECRET[1] } }] },
      approvalChain: [{ ruleId: 'r1', name: 'Value', status: 'approved', by: 'D', comment: SECRET[2] }, { ruleId: 'r2', name: 'Legal', status: 'rejected', by: 'E', comment: SECRET[3] }],
      audit: [{ action: 'Approved', detail: SECRET[2] }] };
    const p = JSON.stringify(s.buildSharePayload(c, 'hash', { org: 'Highland', sharedBy: 'Amina' }));
    for (const x of SECRET) assert.ok(!p.includes(x), x + ' must not travel');
  });
  test('the history copy and the status page read no decision at all', () => {
    const S = strip(R('server/server.js'));
    const h = fnBody(S, 'historyPayload');
    assert.ok(!/playbook|approvalChain|decidedWhy|\.audit/.test(h));
    const D = strip(R('js/dealstands.js'));
    assert.ok(!/approvalChain|decidedWhy|\.accepted|\.refused/.test(D));
  });
});

describe('f1092 (5) who decides: an admin, or somebody an admin named', () => {
  test('the one reading: admins always, a ticked Editor, never a viewer, never by role alone', () => {
    const w = loadViews(['js/richdoc.js', 'js/core.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
    assert.equal(w.mayDecideStandards({ role: 'admin' }), true);
    assert.equal(w.mayDecideStandards({ role: 'legal' }), false, 'the Editor role alone decides nothing');
    assert.equal(w.mayDecideStandards({ role: 'legal', decideStandards: true }), true);
    assert.equal(w.mayDecideStandards({ role: 'viewer', decideStandards: true }), false);
  });
  test('the sign check and both lists ask it', () => {
    assert.match(fnBody(strip(R('js/signcheck.js')), 'signCheckMayAccept'), /_scW\('mayDecideStandards'\)/);
    assert.match(fnBody(strip(R('js/views/ladder.js')), 'ldMayDecide'), /mayDecideStandards\(u\)/);
  });
  const { startHati, seedWorkspace } = require('./helpers');
  test('the server is the wall: the tick is an admin’s, and it opens the decide route', async () => {
    const h = await startHati();
    try {
      const W = await seedWorkspace(h, { approvalRules: [] });
      const LIB = [{ id: 'cl-law', category: 'Governing law', name: 'Kenyan law', preferred: 'Kenya.' }];
      const PB = { _default: { label: 'All', positions: [{ category: 'Governing law', clause: 'cl-law', pos: 'must' }] } };
      const ch = await W.admin.json('/api/standards/changes', { method: 'POST', body: { clauseId: 'cl-law', draft: { name: 'Kenyan law', category: 'Governing law', ask: 'Kenya, save arbitration.', firm: 'must' }, why: 'w', baseLibrary: LIB, basePlaybook: PB } });
      assert.equal(ch.approvers, 0, 'nobody else decides yet: no other admin, no tick');
      const before = await W.unrestricted.raw('/api/standards/changes/' + ch.change.id + '/decide', { method: 'POST', body: { yes: true } });
      assert.equal(before.status, 403, 'an Editor without the tick may not decide');
      const self = await W.unrestricted.raw('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { decideStandards: true } });
      assert.ok(self.status >= 400, 'never self-service');
      const g = await W.admin.json('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { decideStandards: true } });
      assert.equal(g.user.decideStandards, true);
      const d = await W.unrestricted.json('/api/standards/changes/' + ch.change.id + '/decide', { method: 'POST', body: { yes: false, why: 'Keep the arbitration seat named.' } });
      assert.equal(d.change.state, 'refused');
      assert.equal(d.change.decidedWhy, 'Keep the arbitration seat named.', 'the note rides with the decision');
    } finally { await h.stop(); }
  });
});

describe('f1092 (6) one door for a departure', () => {
  test('the counts say what really waits: never a Nice to have', () => {
    const L = strip(R('js/views/ladder.js'));
    assert.match(fnBody(L, 'ldStandards'), /decide: \(place\.firm \|\| 'nice'\) === 'nice' \? 0 : open\.length/);
    assert.match(fnBody(L, 'ldHeadFacts'), /ld_n_decide/);
    /* RE-POINTED (P-35, owner's pick 20 Nov 2026: the Playbook the Legora + Stripe way): no zero tiles — the panel's one bar
       counts what really waits for a call as its amber part, never a Nice to have */
    assert.match(fnBody(L, 'ld6BarHtml'), /\['amber', r\.decide, i18t\('ld6_k_decide'\)\]/);
  });
  test('the landing: Mine, the words cleared, that row chosen and brought into view', () => {
    const a = fnBody(strip(R('js/views/approvalsview.js')), 'apnLandRow');
    assert.match(a, /_apnTab='mine'; _apnQ='';/);
    assert.match(a, /insSelect\('approvals', k\)/);
    assert.match(a, /landOn\(tr,/);
    assert.match(a, /apn_land_gone/, 'a row the reader does not have is said');
  });
});
