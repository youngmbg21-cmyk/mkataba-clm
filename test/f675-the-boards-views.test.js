'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f675 — THE CONTRACT'S VIEWS ON THE BOARD (the one-page Home plan, stage 4;
   the owner picked "Views" by name on 14 Oct 2026, with all three
   recommendations: Share gives a view to colleagues inside HaTi only;
   Download is one file per view that looks like its print; every door from
   outside lands here, the Negotiate page's Deal board tab and the room's
   Obligations and History tabs staying until stage 5, Jambo's Obligations
   tab staying beside the paper)

   (1) ONE SWITCH, ONLY WITH A CONTRACT ON THE PAPER: Your book · Deal board
       · Obligations · History, for pdContract — the one fact both faces read.
   (2) EACH VIEW IS THE ROOM'S OWN BUILDER IN A SECOND HOST: dealBoardHtml,
       roomPaintObligations, roomPaintHistory — the host is handed in and every
       repaint stays in it; the Board's morph leaves the host to its painter.
   (3) THE NUMBER ON A SWITCH IS THE LIST'S OWN (dealBoardFacts' "needs you",
       obtRowsOf/obtPass' overdue).
   (4) PRINT AND DOWNLOAD ARE ONE PAGE: printWindowRun (the history's own
       latch, lifted) and downloadFile; the two new pages stand alone (no var).
   (5) SHARE IS COLLEAGUES ONLY: a gift of kind 'cv' by its NAME; the server
       refuses a colleague who cannot open it and a contract the giver cannot
       see; it rings the colleague's bell until seen.
   (6) THE DOORS: the words, the panel's old Deal and History doors, Jambo's
       door cards and the bell's trail rows open the Board's view.
   (7) A refresh keeps the view; the brain names the part.
   AT THE PARENT every claim FAILS: none of these names exist there.
   THE SWITCH WENT (owner, 15 Oct 2026: "the whole page needs to go as they
   are redundant ... History is in the board contract card, obligations has
   its own panel and your book is useless"): the Board draws no switch, and
   every door that opened a view lands on its home — History on the Board's
   contract card (the strip), Obligations on the panel's tab, the rest on the
   strip's Where we are. (1c), (6) and (7a) now pin that.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const HB = R('js/views/homeboard.js');
const NEGO = R('js/views/negotiation.js');
const NCSS = R('js/views/negotiation-css.js');
const OB = R('js/obligations.js');
const CT = R('js/views/contract.js');
const PD = R('js/paperdesk.js');
const CA = R('js/copilotacts.js');
const APP = R('js/app.js');
const INS = R('js/views/inspector.js');
const IG = R('js/views/intelligence.js');
const SRV = R('server/server.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10), k = src.indexOf('\nasync function ', i + 10);
  const end = [j, k].filter(x => x > 0); return src.slice(i, end.length ? Math.min(...end) : undefined); };

/* the day counter is declared in a VIEW file this world does not load; the
   world's own stand-in (test/world.js, the notice option) */
const world = async () => { const w = await buildWorld({ ladder: true, negotiationView: true, obligations: true });
  if (typeof w.win.daysUntil !== 'function') w.win.daysUntil = d => { const t = Date.parse(d + 'T00:00:00'); return isNaN(t) ? 0 : Math.ceil((t - Date.now()) / 86400000); };
  return w; };
/* a negotiation with two points argued (f313's own shape) and two duties */
function book(){
  const mk = (id, clauseId, side, oldText, newText, o) => Object.assign({ id, clauseId, clauseLabel: 'Clause 4 — Limitation of liability',
    changeType: 'modify', oldText, newText, status: 'pending', authorSide: side, author: side === 'owner' ? 'Young' : 'Amina',
    createdAt: '2026-09-1' + (o && o.d || 0) + 'T09:00:00.000Z', seq: (o && o.seq) || 1, summary: '', why: '' }, o || {});
  return { id: 'MK-1', name: 'Supply', counterparty: 'Juno Limited', status: 'Under Review',
    negotiation: { round: 1, rounds: [] },
    changes: [
      mk('CHG-002', 'cl_4', 'counterparty', 'The cap is twelve (12) months of fees.', 'The cap is six (6) months of fees.', { seq: 2, d: 2 }),
      mk('CHG-010', 'cl_5', 'counterparty', 'Kept three (3) years.', 'Kept five (5) years.', { seq: 5, d: 5, clauseLabel: 'Clause 5 — Confidentiality' })],
    obligations: [{ id: 'o1', desc: 'Deliver the monthly service report', party: 'theirs', due: '2020-01-01', status: 'open' },
      { id: 'o2', desc: 'Pay the first invoice', party: 'ours', due: '2099-01-01', status: 'open', amount: 75000 }] };
}

describe('f675 (1) one switch, for the contract on the paper', () => {
  test('1a the switch is drawn only while the paper holds a contract, and a view only for that contract', () => {
    const now = strip(fnBody(HB, 'hbCvNow'));
    assert.match(now, /const c = hbCvContract\(\);\s*if \(!c\) return \{ v: 'book', c: null \};/);
    assert.match(now, /_hbCv\.id === String\(c\.id\)/, 'a view chosen for another contract is not this one\'s');
    assert.match(strip(fnBody(HB, 'hbCvContract')), /pdContract\(\)/, 'the paper\'s contract: one fact, both faces read it');
    assert.match(strip(fnBody(HB, 'hbCvSwitchHtml')), /const c = now\.c; if \(!c\) return '';/);
  });
  test('1b the four, in order, with whose they are; Print · Share · Download only on a view', () => {
    assert.match(HB, /const HB_CVIEWS = \['book', 'deal', 'oblig', 'hist'\];/);
    const sw = strip(fnBody(HB, 'hbCvSwitchHtml'));
    assert.match(sw, /const acts = now\.v === 'book' \? '' :/);
    assert.match(sw, /act\('print', 'hb_cv_print'[\s\S]*act\('share', 'act_share'[\s\S]*act\('down', 'act_download'/);
    assert.match(sw, /i18t\('hb_cv_for'\)/);
  });
  test('1d something new put on the book (a card, an answer, a dig) steps the view aside, so it is never drawn behind it', () => {
    assert.match(strip(fnBody(HB, 'hbSave')), /if \(_hbCv\.v !== 'book' && _hbShape != null && hbShapeOf\(s\) !== _hbShape\) _hbCv = \{ v: 'book', id: _hbCv\.id \};\s*hbUndoMark\(s\);/);
  });
  test('1c the Board draws no switch and no view: the book is the Board (owner, 15 Oct 2026)', () => {
    const b = strip(fnBody(HB, 'hbBoardHtml'));
    assert.doesNotMatch(b, /hbCvSwitchHtml|hbCvBodyHtml/);
    /* round 17 as drawn (18 Oct 2026): the Board opens on its head card, whose first row keeps .hb-note */
    assert.match(b, /return `\$\{hbBoardHeadHtml\(time, cut, bs,/);
    assert.match(strip(fnBody(HB, 'hbBoardHeadHtml')), /<div class="hb-note hb-bh-r">/);
  });
});

describe('f675 (2) the room\'s own builders, in a second host', () => {
  test('2a the Board\'s morph leaves an own-painted host to its painter, and the paint fills it', () => {
    assert.match(strip(fnBody(HB, 'hbMorphKids')), /w\.hasAttribute\('data-hb-own'\) && hbMorphSameShell\(c, w\)\) continue;/);
    const p = strip(fnBody(HB, 'hbPaintBoard'));
    assert.match(p, /hbMorph\(host, hbBoardHtml\(\)\);\s*hbGlidePlay\(host, glide\);\s*host\.classList\.toggle\('is-cview'[^\n]*\n\s*hbCvPaint\(\);/);
  });
  test('2b the deal board is dealBoardHtml; its presses find their own host and contract', () => {
    const paint = strip(fnBody(HB, 'hbCvPaint'));
    assert.match(paint, /const html = dealBoardHtml\(c, 'owner'\);/);
    assert.match(paint, /roomPaintObligations\(c, host\);/);
    assert.match(paint, /roomPaintHistory\(c, f, host\);/);
    assert.match(strip(fnBody(HB, 'hbCvBodyHtml')), /data-db-host=/);
    const hostOf = strip(fnBody(NEGO, 'rlBoardHostOf'));
    assert.match(hostOf, /closest\('\[data-db-host\]'\)/);
    assert.match(hostOf, /getElementById\('rl-boardpage'\) : null, c: rlLadderContract\(\)/, 'the Negotiate page keeps its own');
    for (const call of ["rlBoardGoClause(bgo.getAttribute('data-rl-board-go'), bgo)", 'rlBoardGoClause(pid, bpick)', 'rlBoardRepaint(ev.detail === 0, bpick)', 'rlBoardRepaint(false, bf)', 'rlBoardHostOf(memo).c'])
      assert.ok(NEGO.includes(call), call);
  });
  test('2c from the Board the clause opens on Home\'s paper with Jambo\'s Redlines face; the page keeps its own door', () => {
    const go = strip(fnBody(NEGO, 'rlBoardGoClause'));
    assert.match(go, /if \(on\.home\)\{ rlBoardGoOnHome\(on\.c, gid\); return; \}/);
    assert.match(strip(fnBody(NEGO, 'rlBoardGoOnHome')), /pdRedOpen\(c\.id\)/);
  });
  test('2d the room\'s obligations and history paint into a host they are handed, and every repaint stays there', () => {
    const ob = strip(fnBody(OB, 'roomPaintObligations'));
    assert.match(ob, /function roomPaintObligations\(c, at\)\{\s*const host = at \|\| document\.getElementById\('ws-obligations-pane'\);/);
    assert.match(strip(fnBody(OB, 'roomObligationsInspector')), /roomPaintObligations\(c, host\)/);
    const hi = strip(fnBody(CT, 'roomPaintHistory'));
    assert.match(hi, /const host=at\|\|document\.getElementById\('ws-history-pane'\);/);
    assert.equal((hi.match(/roomPaintHistory\(c,(?:read\(\)|\{\}),at\)/g) || []).length, 5, 'every filter, search and wording press repaints the same host');
    assert.doesNotMatch(hi, /roomPaintHistory\(c,(?:read\(\)|\{\})\)/);
    assert.match(strip(fnBody(INS, 'insWatchWidth')), /p\(page\)/, 'the width watcher repaints the host it found');
    assert.match(INS, /oblig: page => \{ const own = page && page\.getAttribute\('data-ins-cid'\);/);
  });
  test('2d2 the history reads the whole record first, once, and a failed read says so with Try again', () => {
    const paint = strip(fnBody(HB, 'hbCvPaint'));
    assert.match(paint, /if \(_hbCvFail === String\(c\.id\)\)\{[\s\S]*?i18t\('hb_cv_read_fail'\)[\s\S]*?data-hb-cv-again[\s\S]*?i18t\('act_retry'\)/);
    assert.match(paint, /busyHtml\(i18t\('hb_cv_reading'\)\)/, 'the waiting word wears the turning ring');
    assert.match(paint, /Promise\.resolve\(ensureFull\(c\)\)\.then\(\(\) => \{ _hbCvFail = null; \}, \(\) => \{ _hbCvFail = id; _hbCvAsked = null; \}\)/);
    assert.match(strip(fnBody(HB, 'hbCvSwitchHtml')), /const ready = hbCvReady\(now\), wait = ready \? '' : ` disabled title=/, 'Print, Share and Download grey with the reason meanwhile');
  });
  test('2e the history\'s menu carries Print and Download in every host again, the Board\'s line being gone (15 Oct 2026)', () => {
    const h = fnBody(CT, 'roomHistoryHtml');
    assert.doesNotMatch(h, /opts\.board\?'':`<button type="button" id="ht-export">/);
    assert.match(h, /id="ht-export"/); assert.match(h, /id="ht-print"/);
  });
  test('2f the deal board\'s own parts read alike in both hosts (the scale, the wording), not as the Negotiate page', () => {
    assert.match(NCSS, /\.hb-cv-deal \.rl-sc-line,\.redline-page \.rl-sc-line\{/);
    assert.match(NCSS, /\.hb-cv-deal \.db-words,\.redline-page \.db-words\{/);
    assert.doesNotMatch(HB, /class="[^"]*redline-page/, 'the Board\'s host is never .redline-page: code reads that as the page being up');
  });
});

describe('f675 (3) the number on a switch is the list\'s own', () => {
  test('3a dealBoardFacts is the board\'s one reading; obtRowsOf/obtPass the tab\'s', () => {
    assert.match(strip(fnBody(NEGO, 'dealBoardHtml')), /const \{ rows, facts, n \} = dealBoardFacts\(c, side\);/);
    assert.match(strip(fnBody(OB, 'roomObligationsInspector')), /const all = obtRowsOf\(c\);\s*const pass = obtPass;/);
    const n = strip(fnBody(HB, 'hbCvCounts'));
    assert.match(n, /dealBoardFacts\(c, 'owner'\)\.n\.you/);
    /* stage 5: the room's Obligations tab went home to this view, and its
       count with it (obligationTabState, the number the tab carried) */
    assert.match(n, /obligationTabState\(c\)/);
  });
  test('3b running: the counts on a real book', async () => {
    const w = await world();
    const c = book();
    assert.equal(w.win.dealBoardFacts(c, 'owner').n.you, 2, 'two of their asks wait on us');
    assert.equal(w.win.obtRowsOf(c).filter(r => w.win.obtPass(r, 'overdue')).length, 1, 'one duty is late');
  });
});

describe('f675 (4) print and download are one page', () => {
  test('4a one print runner: the history\'s own latch, lifted, and the history prints through it', () => {
    const run = strip(fnBody(NEGO, 'printWindowRun'));
    assert.match(run, /const w = window\.open\('', '_blank'\);[\s\S]*const html = await build\(\);/, 'the window opens before the wait');
    assert.equal((run.match(/w\.print\(\)/g) || []).length, 1);
    assert.match(strip(fnBody(NEGO, 'negoHistoryPrintRun')), /return printWindowRun\(async \(\) => negoHistoryExportHtml\(c, await negoIntegrityReport\(c\)\)/);
    const pr = strip(fnBody(HB, 'hbCvPrint')), dl = strip(fnBody(HB, 'hbCvDownload'));
    assert.match(pr, /negoHistoryPrintRun\(now\.c\)/); assert.match(pr, /printWindowRun\(\(\) => build\(now\.c\)/);
    assert.match(dl, /negoHistoryExportRun\(now\.c\)/); assert.match(dl, /downloadFile\(`\$\{ref\}-\$\{now\.v === 'deal' \? 'deal-board' : 'obligations'\}\.html`/);
    assert.match(dl, /toast\(i18t\('hb_cv_saved'[^;]*'ok'\)/);
  });
  test('4b running: each page stands alone, every point and every duty, amounts only where money is seen', async () => {
    const w = await world();
    const c = book();
    const d = w.win.dealBoardReportHtml(c, 'owner');
    assert.match(d, /^<!doctype html>/); assert.doesNotMatch(d, /var\(--/);
    assert.equal((d.match(/<article>/g) || []).length, 2);
    assert.match(d, /six \(6\)/); assert.match(d, /five \(5\)/);
    const o = w.win.obReportHtml(c);
    assert.match(o, /^<!doctype html>/); assert.doesNotMatch(o, /var\(--/);
    assert.match(o, /Deliver the monthly service report/); assert.match(o, /Pay the first invoice/);
    assert.match(o, /KES|75/, 'the amount where this reader may see money');
  });
});

describe('f675 (5) share: colleagues inside HaTi only', () => {
  test('5a the view is given by its name, as a Board card is', () => {
    const g = strip(fnBody(HB, 'hbCvGive'));
    assert.match(g, /api\('home\/gifts', 'POST', \{ to: f\.to\.value, kind: 'cv', note: [^}]*, spec: \{ v: now\.v, cid: String\(now\.c\.id\) \} \}\)/);
    assert.match(g, /toast\(i18t\('hb_given_toast'[^;]*'ok'\)/);
  });
  test('5b the server keeps it a name and walls it on both people\'s reach', () => {
    assert.match(SRV, /const HOME_GIFT_KINDS = \['view', 'cv',/);
    const s = strip(fnBody(SRV, 'homeGiftCvSpec'));
    assert.match(s, /inScope\(folderScopeFor\(giver\), row\.folder\)\) return \{ error: 'Contract not found', code: 404 \}/);
    assert.match(s, /inScope\(folderScopeFor\(taker\), row\.folder\)\) return \{ error:[\s\S]*?code: 400 \}/);
    assert.match(s, /JSON\.stringify\(\{ v: view, cid \}\)/, 'never a figure');
    assert.match(SRV, /SELECT id, name, role FROM users WHERE id=\?/, 'the colleague\'s reach is read from their own record');
  });
  test('5c the bell rings until it is seen; seen is said where it is drawn, never by a read', () => {
    assert.match(APP, /\{ k:'gift',\s+tone:'amber'/);
    assert.match(APP, /hbGiftAlerts\(\)\.forEach\(g=>push\('gift',g\.c,g\.text,g\.go\)\)/);
    assert.match(strip(fnBody(HB, 'hbGiftAlerts')), /hbCvGiftValid\(g\) && !g\.seenAt/);
    assert.doesNotMatch(strip(fnBody(HB, 'hbGiftsLoad')), /\/seen'/, 'loading the gifts says nothing seen');
    assert.match(strip(fnBody(HB, 'hbGiftsSeenSay')), /hbS\(\)\.face === 'board' && hbCvNow\(\)\.v === 'book'/);
    assert.match(strip(fnBody(HB, 'hbCvGiftOpen')), /hbGiftSeen\(g\);\s*return hbOpenView\(g\.spec\.cid, g\.spec\.v\);/);
  });
});

describe('f675 (6) every door from outside lands on the Board\'s view', () => {
  test('6a the words and the chips: no deal word; History opens on the strip; Jambo\'s points open the Redlines face', () => {
    assert.doesNotMatch(CA, /\bdeal: c =>/);
    assert.match(CA, /history: c => c \? \(\(typeof hbOpenView === 'function'\) \? hbOpenView\(c\.id, 'hist'\)/);
    assert.match(CA, /open: c => \(typeof pdRedOpen === 'function'\) \? pdRedOpen\(c\.id\)/);
    assert.match(CA, /minor: c => \(typeof pdRedOpen === 'function'\) \? pdRedOpen\(c\.id\)/);
  });
  test('6b the panel\'s old Deal and History doors', () => {
    assert.match(strip(fnBody(PD, 'pdOpenOnHome')), /if \(\(tab === 'deal' \|\| tab === 'hist'\) && typeof hbOpenView === 'function'\) return hbOpenView\(c\.id, tab\);/);
  });
  test('6c the bell\'s trail rows; the phone keeps the room', () => {
    assert.match(APP, /if\(!\(typeof window\.hbOpenView==='function'&&hbOpenView\(id,'hist'\)\)\) selectContract\(id\);/);
    const o = strip(fnBody(HB, 'hbOpenView'));
    assert.match(o, /window\.innerWidth < 768/);
    assert.match(o, /roomGoTab\([^;]*HB_CV_ROOM_TAB\[v\]\)/);
    assert.match(o, /if \(v === 'oblig' && typeof window\.obOpenOnPage === 'function'\) return obOpenOnPage\(c\.id\);/, 'Obligations: the Obligations page narrowed to the contract');
    assert.match(o, /hbStripBring\(c\.id, v === 'hist' \? 'hist' : 'where'\)/, 'History and the rest: the Board\'s contract card');
    assert.doesNotMatch(o, /hbCvSet\(/, 'no view is turned');
  });
  test('[wall] 6d the room\'s tabs and Negotiate\'s Deal board tab stay until stage 5', () => {
    assert.match(NEGO, /function openDealBoard\(\)\{/);
    assert.match(CT, /if\(_wsTab==='history'\) roomPaintHistory\(c\);/);
  });
});

describe('f675 (7) a refresh, and the brain', () => {
  test('7a the place store keeps no view: an old one is dropped', () => {
    assert.doesNotMatch(strip(fnBody(HB, 'hbPlace')), /p\.cv\b/);
    assert.doesNotMatch(strip(fnBody(HB, 'hbPlacePut')), /hbCvSet\(/);
  });
  test('7b the brain names the part, in a step and a lane', () => {
    const B = require('../js/brainmap.js');
    const p = B.BRAIN_PARTS.find(x => x.id === 'boardviews');
    assert.ok(p && p.code === 'hbOpenView');
    assert.ok(B.BRAIN_FLOWS.some(f => f.steps.some(s => s.includes('boardviews'))));
    assert.ok(B.BRAIN_LANE_OF.own.includes('boardviews'));
  });
});
