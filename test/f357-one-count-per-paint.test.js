/* ============================================================
   f357 — one count per paint, one look-up per tick, one page's own ids

   The performance audit's other three items, which all have the same shape:
   work that grows with the BOOK while the thing it is for stays the size of
   one screen.

   (2) THE RAIL, HOME'S TILE AND THE PHONE'S BAR each walked the whole book
       for the same figure — measured, one navigation asked negoNeedsYouTotal
       FOUR times. They read navCounts() now, which answers once per paint.

       AND THE FIRST BUILD OF navCounts WAS A CYCLE: it asked
       approvalsDoorCount, which draws its rows through hmDashSlices, which
       asks navCounts — and the memo was only written at the end, so every
       level recomputed. Measured, 1,132 walks of the book for one paint of
       Home against 3 before. The guard is pinned below.

   (3) TICKING ONE OBLIGATION searched the whole book twice for the same
       contract before asking any surface whether it was even on screen.

   (4) THE CONTRACTS LIST read the WHOLE briefs table and the WHOLE
       renewal_advice table — parsing the JSON of every renewal row in the
       workspace — to decorate one page of at most 200.

   Nothing here changes a figure. Every claim that could pass by accident on
   an empty stage is gated.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const R = f => fs.readFileSync(path.join(__dirname, '..', ...f.split('/')), 'utf8');
/* COMMENTS ARE PROSE. Every sweep below reads what the product DOES, so the
   notes explaining what it used to do cannot satisfy or fail it — this file's
   first run failed three claims against its own explanations. */
const code = src => String(src).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const APP  = R('js/app.js');
const HOME = R('js/views/home.js');
const MOB  = R('js/mobile.js');
const OBL  = R('js/obligations.js');
const SRV  = R('server/server.js');

const navBody = code((APP.match(/function navCounts\(\)\{[\s\S]*?\n\}/) || [''])[0]);

describe('f357 (1) one count per paint', () => {
  test('1a navCounts exists and is published', () => {
    assert.ok(navBody, 'the one reading');
    assert.ok(/navCounts\b/.test(APP.split('Object.assign(window').slice(1).join('')),
      'a name missing from the publish list cannot be read by home.js or the phone');
  });
  test('1b it memoises, and the memo is dropped on a microtask', () => {
    assert.ok(/if\(_navCounts\)\s*return _navCounts/.test(navBody),
      'a second caller in the same paint gets the answer, not another walk');
    assert.ok(/Promise\.resolve\(\)\.then\(navCountsClear\)/.test(APP),
      'the memo may not outlive the turn it was computed in — a stamp somebody '
      + 'has to raise prints a stale number on a door the first time it is missed');
  });
  test('1c THE CYCLE WALL: navCounts asks nothing that draws a screen', () => {
    for(const name of ['approvalsDoorCount','obligationsDoorCount','allObligations','hmDashSlices','apApprovalRows','intakeCount']){
      assert.ok(!new RegExp(name).test(navBody),
        `${name} can call back into a screen that asks navCounts — that cycle cost 1,132 walks of the book`);
    }
  });
  test('1d and a re-entrant call is refused rather than recomputing', () => {
    assert.ok(/_navBusy/.test(navBody), 'the wall against a future caller that does make a cycle');
  });
  test('1e the two flag counts are ONE walk, not two', () => {
    assert.ok(/Under Review/.test(navBody) && /needsReview/.test(navBody),
      'both counted in the same loop');
    assert.ok(!/cs\.filter\(c=>c\.status==='Under Review'\)/.test(APP),
      'the separate filter walk is gone');
    assert.ok(!/cs\.filter\(c=>c\.migration&&c\.migration\.needsReview\)/.test(APP),
      'and so is its twin');
  });
  test('1f the rail reads it', () => {
    const fn = (APP.match(/function updateSidebarCounts\(\)\{[\s\S]*?\n\}/) || [''])[0];
    assert.ok(/navCounts\(\)/.test(fn), 'the rail asks the shared reading');
    assert.ok(/nc\.negotiations/.test(fn) && /nc\.pipeline/.test(fn) && /nc\.migration/.test(fn));
  });
  test('1g Home reads it', () => {
    assert.ok(/navCounts\(\)\.negotiations/.test(HOME),
      "Home's tile asked negoNeedsYouTotal for itself");
  });
  test('1h the phone reads it', () => {
    assert.ok(/navCounts\(\)\.negotiations/.test(MOB),
      "the bottom bar asked for itself too");
  });
  test('1i every reader still falls back, because these modules load apart', () => {
    for(const [src,name] of [[HOME,'home.js'],[MOB,'mobile.js']]){
      const i = src.indexOf('navCounts().negotiations');
      const near = src.slice(Math.max(0,i-220), i+260);
      assert.ok(/window\.navCounts/.test(near), `${name} calls it bare on a stage without app.js`);
      assert.ok(/negoNeedsYouTotal/.test(near), `${name} lost its own answer`);
    }
  });
});

describe('f357 (2) one look-up per obligation tick', () => {
  const fn = code((OBL.match(/function obligationSurfacesChanged\(\)\{[\s\S]*?\n\}\n/) || [''])[0]);
  test('2a the contract is found ONCE', () => {
    assert.ok(fn, 'the funnel');
    const n = (fn.match(/getContract\(/g) || []).length;
    assert.equal(n, 1, 'getContract searches the whole book — twice was twice the book');
  });
  test('2b every surface is still reached', () => {
    for(const p of ['updateSidebarCounts','renderChecksCard','wsPaintTabCounts','roomPaintObligations','paintOverviewDocs','renderCalendar','renderDashboard']){
      assert.ok(new RegExp(p).test(fn), `${p} left the funnel — that is how a count goes stale`);
    }
  });
  test('2c and each painter still returns on a missing element', () => {
    /* the guard that makes "repaint what is mounted" true, checked at the
       painters rather than assumed by the caller */
    const CT = R('js/views/contract.js');
    assert.ok(/function paintOverviewDocs\(c\)\{\s*\n?\s*if\(!document\.getElementById\('kt-side'\)\) return;/.test(CT));
    assert.ok(/function roomPaintObligations\(c\)\{[\s\S]{0,160}?if\(!host \|\| !c\) return;/.test(OBL));
  });
});

describe('f357 (3) the list decorates itself from its own ids', () => {
  test('3a neither table is read whole in the contracts list', () => {
    /* SCOPED TO THE ROUTE. There is a second whole-briefs read elsewhere that
       answers a different question and is outside this item. */
    const i = SRV.indexOf('res.json({ total, offset, limit, rows });');
    assert.ok(i > 0, 'the contracts list route');
    const route = code(SRV.slice(Math.max(0, i - 4500), i));
    assert.ok(!/FROM briefs'\)\.all\(\)/.test(route),
      'the whole briefs table for one page of rows');
    assert.ok(!/FROM renewal_advice'\)\.all\(\)/.test(route),
      'the whole renewal table, JSON and all, for one page of rows');
  });
  test('3b both ask for the page’s own ids', () => {
    assert.ok(/FROM briefs WHERE contract_id IN/.test(SRV));
    assert.ok(/FROM renewal_advice WHERE contract_id IN/.test(SRV));
  });
  test('3c the placeholder list is built from the page, so it is bounded by limit', () => {
    assert.ok(/const pageIds = rows\.map/.test(SRV), 'the ids are the page’s own');
    assert.ok(/const inList = n =>/.test(SRV), 'one builder for both queries');
  });
  test('3d and the facts they set are unchanged', () => {
    assert.ok(/_hasBrief = true/.test(SRV), 'a boolean, never the brief');
    assert.ok(/a\.overnight \? 'night' : 'you'/.test(SRV), "and the word that says which");
  });
});
