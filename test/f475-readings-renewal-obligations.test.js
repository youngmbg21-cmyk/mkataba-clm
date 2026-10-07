/* f475 — READINGS, RENEWAL AND OBLIGATIONS (process review, 4 Oct 2026)
   ========================================================================
   Three findings of the review, one stream:

     1  THE ARRIVAL STRIP SAID NOTHING WHEN THE WORDING MOVED. The Overview's
        readings table worked out "older than the wording" and the strip — the
        first thing on the page — went on showing the old brief, standards and
        obligations as current. The tiles now ask readingStale (the ONE
        reading), say so first in their detail, and the strip's tile becomes a
        one-press re-read of THAT reading (nothing spent without the press).
        And the obligations read was stamped as a bare DAY, so a change
        proposed later that same day read as stale; the stamp is a moment now
        and an old day-only stamp answers only what a day can.
     2  A RENEWAL ANSWER STARTED NOTHING. Renew / Renegotiate / Let lapse now
        open the act's own door (the renewal draft's dialog; the same and then
        its negotiation; the notice desk), the card carries the next owed act
        until it is done (renewalNextStep), and a served notice no longer
        swallows a different recorded answer in silence.
     3  OBLIGATION PROPOSALS ARRIVED TICKED, against the rule the map states.
        Both doors (the arrival's held list and Find obligations) come through
        one window, and no box is drawn checked.
   ======================================================================== */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
/* The function alone, to the next top-level declaration — a REGION, never a
   signature that happens to hold today. */
function fnOf(src, name){
  const at = src.search(new RegExp('(?:async )?function ' + name + '\\('));
  if (at < 0) return '';
  const next = src.slice(at + 1).search(/\n(?:async )?function [A-Za-z_$]|\nconst [A-Za-z_$]+ *=|\nObject\.assign/);
  return src.slice(at, next < 0 ? undefined : at + 1 + next);
}
const OB = strip(read('js/obligations.js'));
const CT = strip(read('js/views/contract.js'));
const AI = strip(read('js/ai.js'));
const FAM = strip(read('js/family.js'));
const CORE = strip(read('js/core.js'));
const I18N = read('js/i18n.js');

const TEXT = 'The Buyer shall pay each undisputed invoice within sixty (60) days of receipt. '
  + 'The Supplier shall submit a quarterly volume forecast within 10 days of each quarter end. '
  + 'The Supplier shall maintain insurance for the term. '
  + 'This Agreement is governed by the laws of California. ';

/* A LOCAL moment as ISO — the old stamp wrote a LOCAL day (isoDay). */
const at = (y, m, d, h) => new Date(y, m - 1, d, h, 0, 0).toISOString();

function stage(over){
  const { win } = buildWorld({ triage: true, signcheck: true, playbook: true, obligations: true });
  win.FOLDERS = { proc: { name: 'Supply & Logistics' } };
  const c = Object.assign({
    id: 'MK-475', name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB',
    status: 'Under Review', source: 'upload', folder: 'proc',
    owner: { id: 'u1', name: 'Wanjiru Kamau' },
    audit: [], obligations: [], comments: [], changes: [],
    upload: { name: 'Supply.docx', extractedText: TEXT },
  }, over || {});
  win.state.contracts = [c];
  win.getContract = id => win.state.contracts.find(x => x.id === id) || null;
  return { win, c };
}

/* ================================================ 1 — THE STRIP AND THE STAMP */
describe('f475 (1) a reading the wording moved past says so on the strip', () => {
  test('1a a day-only stamp answers only what a day can', () => {
    const { win, c } = stage();
    c.obligationsReadAt = '2026-09-20';
    c.changes = [{ id: 'x', createdAt: at(2026, 9, 20, 15) }];
    assert.equal(win.readingStale(c, 'oblig'), null, 'moved later the SAME day: we do not know');
    c.changes = [{ id: 'x', createdAt: at(2026, 9, 21, 9) }];
    assert.equal(win.readingStale(c, 'oblig'), true, 'moved on a later day: moved');
    c.changes = [{ id: 'x', createdAt: at(2026, 9, 19, 9) }];
    assert.equal(win.readingStale(c, 'oblig'), false, 'moved on an earlier day: not moved');
  });

  test('1b a full stamp compares by the moment, so a same-day change is ordered', () => {
    const { win, c } = stage();
    c.obligationsReadAt = at(2026, 9, 20, 12);
    c.changes = [{ id: 'x', createdAt: at(2026, 9, 20, 10) }];
    assert.equal(win.readingStale(c, 'oblig'), false, 'proposed before the reading that morning');
    c.changes = [{ id: 'x', createdAt: at(2026, 9, 20, 14) }];
    assert.equal(win.readingStale(c, 'oblig'), true, 'proposed after it that afternoon');
  });

  test('1c the scan stamps a moment from now on', () => {
    const { win, c } = stage();
    win.obligationsReadStamp(c, TEXT);
    assert.match(String(c.obligationsReadAt), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  });

  test('1d the tiles ask readingStale and say so first; a current tile is untouched', () => {
    const { win, c } = stage();
    c.triage = { at: at(2026, 9, 20, 9), steps: {
      brief: { ok: true }, playbook: { ok: true, dev: 0, miss: 0, cats: [] },
      oblig: { ok: true, found: [{ desc: 'Pay within sixty days' }] } } };
    c._brief = { at: at(2026, 9, 20, 9), data: { overview: 'A supply agreement between two companies for steel.' } };
    c.obligationsReadAt = at(2026, 9, 20, 9);
    c.changes = [{ id: 'x', createdAt: at(2026, 9, 22, 9) }];
    const tiles = win.triageTiles(c);
    const brief = tiles.find(t => t.key === 'brief'), ob = tiles.find(t => t.key === 'oblig');
    /* "Filed" left the strip on 4 Oct 2026 for "Risks found" — a reading
       that is re-run free on every scan, so it is never stale either. */
    const fill = tiles.find(t => t.key === 'risk');
    assert.equal(brief.stale, true, 'the brief is older than the wording');
    assert.equal(ob.stale, true, 'and so is the obligations read');
    assert.ok(brief.detail.startsWith('The wording moved since this was read'), brief.detail);
    assert.ok(!fill.stale, 'the free risk reading never goes stale');
    c.changes = [{ id: 'x', createdAt: at(2026, 9, 19, 9) }];
    const now = win.triageTiles(c).find(t => t.key === 'brief');
    assert.ok(!now.stale && !/wording moved/.test(now.detail), '[control] nothing moved, nothing said');
  });

  test('1e the strip makes a stale tile the one-press re-read of THAT reading', () => {
    const strip = fnOf(CT, 'ktTriageStripHtml');
    assert.match(strip, /x\.stale \? 'reread'/, 'asked before the open doors');
    assert.match(strip, /data-kt-tri-key=/);
    assert.match(strip, /tri_reread_title/, 'the cost is on the hover');
    const paint = fnOf(CT, 'paintKtTriage');
    assert.match(paint, /go==='reread'\)\{ ktTriageReread\(c, btn\.getAttribute\('data-kt-tri-key'\)\)/);
    const rr = fnOf(CT, 'ktTriageReread');
    assert.match(rr, /runContractBrief\(live,\{ force:true \}\)/, 'the brief is rewritten, not handed back from cache');
    assert.match(rr, /runPlaybookReview\(live,\{\}\)/);
    assert.match(rr, /runFindObligations\(live,\{ fresh:true \}\)/);
    assert.ok(!/triageAndPaint|triageRun/.test(rr), 'one reading, never the whole arrival run');
    assert.match(rr, /_ktRereads\.add\(k\)/, 'the latch is raised before the promise exists');
    assert.match(rr, /triageRepaintSurfaces\(live\)/, 'and every surface the reading moves repaints');
  });

  test('1f a fresh obligations read does not hand back the list held from the old wording', async () => {
    const fn = fnOf(OB, 'runFindObligations');
    assert.match(fn, /const held = \(!fresh &&/, 'the held offer stands aside for a fresh read');
    const { win, c } = stage();
    c.triage = { steps: { oblig: { ok: true, found: [{ desc: 'An old promise from older wording' }] } } };
    let shown = null;
    win.openObligationsReview = (_c, list) => { shown = list; };
    win.openModal = () => {}; win.renderObligationsSection = () => {}; win.persist = () => {};
    try{ await win.runFindObligations(c, { fresh: true }); }catch(_){ /* drawing is not the claim */ }
    const held = c.triage.steps.oblig.found.map(x => x.desc);
    assert.ok(!held.includes('An old promise from older wording'), 'what the arrival held is replaced');
    assert.ok(held.length > 0, 'by what this reading found');
    assert.ok(c.obligationsReadAt, 'and the read is stamped');
    void shown;
  });
});

/* ================================================ 2 — THE RENEWAL ANSWER ACTS */
describe('f475 (2) a renewal answer starts its act and carries it until done', () => {
  function rstage(){
    const { win } = buildWorld({ family: true, notice: true, obligations: true });
    const exp = '2031-03-31';
    const p = { id: 'MK-R1', name: 'Master supply', counterparty: 'Juno AB', status: 'Signed',
      expiry: exp, metadata: { noticePeriodDays: 60 }, audit: [], obligations: [] };
    win.state.contracts = [p];
    win.getContract = id => win.state.contracts.find(x => x.id === id) || null;
    const q = win.renewalQuestionOf(p);
    const decide = (answer, atISO) => { p.renewalDecision = { answer, at: atISO || at(2026, 9, 1, 9),
      by: { id: 'u1', name: 'Wanjiru' }, expiry: q.expiry, notice: q.notice, decideBy: '2031-01-30' }; };
    const kid = (over) => { const k = Object.assign({ id: 'MK-R1-' + win.state.contracts.length,
      parentId: p.id, relation: 'renewal', status: 'Draft', audit: [{ at: at(2026, 9, 2, 9) }] }, over || {});
      win.state.contracts = win.state.contracts.concat([k]); if (win.familyIndexDirty) win.familyIndexDirty(); return k; };
    return { win, p, decide, kid };
  }

  test('2a renew with no paper owes the draft; a draft owes the send; a sent one is out', () => {
    const { win, p, decide, kid } = rstage();
    decide('renew');
    assert.equal(win.renewalNextStep(p).step, 'draft');
    const k = kid();
    let s = win.renewalNextStep(p);
    assert.equal(s.step, 'send'); assert.equal(s.child.id, k.id);
    k.status = 'Under Review';
    assert.equal(win.renewalNextStep(p).step, 'out');
  });

  test('2b paper made BEFORE the answer is not the answer\'s paper', () => {
    const { win, p, decide, kid } = rstage();
    kid({ audit: [{ at: at(2026, 8, 1, 9) }] });
    decide('renegotiate', at(2026, 9, 1, 9));
    assert.equal(win.renewalNextStep(p).step, 'draft');
  });

  test('2c let lapse owes the notice until it is served', () => {
    const { win, p, decide } = rstage();
    decide('lapse');
    assert.equal(win.renewalNextStep(p).step, 'notice');
    p.notice = { servedOn: '2026-09-02', way: 'courier', at: at(2026, 9, 2, 9), by: 'Wanjiru' };
    assert.equal(win.renewalNextStep(p).step, 'served');
  });

  test('2d a served notice no longer swallows a different recorded answer in silence', () => {
    const { win, p, decide } = rstage();
    decide('renew');
    p.notice = { servedOn: '2026-09-02', way: 'courier', at: at(2026, 9, 2, 9), by: 'Wanjiru' };
    const d = win.renewalDecisionOf(p);
    assert.equal(d.answer, 'lapse', 'the letter has gone: the reminders still stop');
    assert.equal(d.recorded && d.recorded.answer, 'renew', 'and the other answer is carried, not lost');
    assert.equal(win.renewalNextStep(p).conflict, 'renew', 'so the card can say they disagree');
    decide('lapse');
    assert.equal(win.renewalDecisionOf(p).recorded, undefined, '[control] agreeing answers raise nothing');
  });

  test('2e an executed renewal moves the effective expiry, which is what Expired reads', () => {
    const { win, p, kid } = rstage();
    const k = kid({ expiry: '2034-03-31' });
    assert.equal(win.effectiveExpiry(p), '2031-03-31', 'an unsigned renewal is a proposal only');
    k.status = 'Signed';
    assert.equal(win.effectiveExpiry(p), '2034-03-31', 'a signed one moves the term');
    assert.match(fnOf(CORE, 'contractExpired'), /effectiveExpiry\(c\)/, 'and contractExpired reads that one date');
  });

  test('2f the card: the act follows the answer, and the next owed act is drawn', () => {
    const card = fnOf(AI, 'renewalCardHtml');
    assert.match(card, /renewalNextStep\(c\)/, 'the one reading');
    assert.match(card, /data-rn-next=/);
    assert.match(card, /data-rn-conflict/);
    assert.match(card, /data-rn-child=/);
    const wire = fnOf(AI, 'renderRenewalSection');
    assert.match(wire, /contractSetRenewalDecision\(c,answer,why\);\s*if\(ok\)\{[^}]*renewalDecisionAct\(c,answer,why\)/,
      'recording the answer starts its act');
    const start = fnOf(AI, 'renewalStartPaper');
    assert.match(start, /openCreateAmendmentModal\(c,land,\{ relation:'renewal', note:/, 'the family\'s one door, prefilled');
    assert.match(start, /answer==='renegotiate'&&window\.openRedlineWorkbench/, 'renegotiating lands on the negotiation');
    const act = fnOf(AI, 'renewalDecisionAct');
    assert.match(act, /openNoticeDialog\(c\)/, 'letting it lapse opens the notice desk');
    /* The note is the dialog's one question since O-10 (7 Oct 2026): a box
       prefilled from the renewal card's reason. */
    assert.match(fnOf(FAM, 'openCreateAmendmentModal'), /note: String\(\(opts && opts\.note\) \|\| ''\)/);
    assert.match(fnOf(FAM, 'openCreateAmendmentModal'), /<textarea id="am-note"[^>]*>\$\{_famEsc\(S\.note\)\}<\/textarea>/);
  });
});

/* ================================================ 3 — UNTICKED, AS THE RULES SAY */
describe('f475 (3) obligation proposals arrive unticked', () => {
  test('3a no box is drawn checked, and the button follows the ticks', () => {
    const fn = fnOf(OB, 'openObligationsReview');
    assert.ok(!/data-ob-pick="\$\{i\}"[^>]*checked/.test(fn), 'no proposal arrives ticked');
    assert.match(fn, /const n = obPicks\(\)\.filter\(cb => cb\.checked\)\.length;/);
    assert.match(fn, /btn\.disabled = !n && fresh;/, 'grey until something is ticked');
  });
});

describe('f475 (4) the words are in both books', () => {
  test('every new key, twice', () => {
    for (const k of ['tri_stale', 'tri_reread', 'tri_reread_title', 'tri_reread_done',
      'rn_next_draft', 'rn_next_send', 'rn_next_out', 'rn_next_notice', 'rn_next_notice_blocked',
      'rn_served_disagrees', 'rn_open_draft', 'rn_open_negotiation'])
      assert.equal((I18N.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k);
  });
});
