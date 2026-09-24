/* F380 — THE HISTORY TAB READS AS A LINE OF TIME (Young ruled 24 Sep 2026)
   ======================================================================
   Over a picture of the "HaTi — Production Polish" canvas, with the day
   column and the round column ringed: *"Implement the highlighted designs in
   the picture in the history tab. The way the history is chronicled, the line
   attaching the history and rounds. Also the sentences above the names should
   be in black font."*

   WHAT IS PINNED HERE is the shape that makes each of those true; the painted
   facts (a pseudo-element's position, a computed weight, a stacked line) are
   measured in test/chromium/history-timeline-verify.js.

   THE CLOCK IS PUT WEST OF GREENWICH ON PURPOSE. A bare day ("2026-03-05")
   parses as UTC midnight, which is the PREVIOUS day for every reader west of
   Greenwich — in UTC that fault cannot be seen at all. Claim (2e) proves the
   instrument bites before it believes the answer.

   [wall] and [control] claims pass on both sides by design: the reading stays
   oldest first for every other caller, the pop-out record and the export keep
   their own order, and a refusal is still ruby. */
'use strict';
process.env.TZ = 'America/Los_Angeles';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

const CSS = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const I18N = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');

/* A record with a round, a refusal and a system entry of its own. Filed
   through the funnel, so every event carries the time the product stamps. */
async function storyWorld(){
  const W = buildWorld({ negotiationView: true, contractView: true });
  const win = W.win;
  const c = { id: 'MK-T1', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich' };
  win.negoInit(c);
  const cl4 = win.negoClauseList(c).find(x => x.num === '4');
  const ask = await win.negoFileChange(c, { clauseId: cl4.clauseId, changeType: 'modify',
    oldText: cl4.text, newText: F.PROTO_ASKS['4'].text, clauseLabel: 'Clause 4 · Payment Terms' },
    { side: 'counterparty', author: 'Erik Lindqvist' });
  win.negoResolve(c, ask.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau' });
  /* A plain system entry — not 'Shared', which the timeline turns into a
     signing beat under other words. */
  win.logAudit(c, 'Scanned', 'Risk scan run on the working text', 'Wanjiru Kamau');
  return { win, c };
}
const rowsOf = (win, html) => {
  const box = win.document.createElement('div');
  box.innerHTML = html;
  return { box, rows: [...box.querySelectorAll('.hist-ev')] };
};
/* One rule, one region — the stylesheet's own block for the history row. */
const rule = sel => {
  const i = CSS.indexOf('\n  ' + sel + '{');
  return i < 0 ? '' : CSS.slice(i, CSS.indexOf('}', i) + 1);
};

describe('F380 — the history reads as a line of time', () => {

  /* ═══════ 1. NEWEST FIRST ═══════ */
  test('(1) the tab draws the newest entry first, and every row carries its time', async () => {
    const { win, c } = await storyWorld();
    const { rows } = rowsOf(win, win.roomHistoryHtml(c));
    const ats = rows.map(r => r.getAttribute('data-hist-at'));
    assert.ok(rows.length >= 3, rows.length + ' rows');
    assert.ok(ats.every(Boolean), 'every row names the moment it happened');
    assert.ok(ats.every((a, k) => k === 0 || String(ats[k - 1]) >= String(a)),
      'each row is later than or level with the one under it: ' + ats.join(' | '));
  });
  test('(1b) [wall] the READING is not turned round — every other caller still gets oldest first', async () => {
    const { win, c } = await storyWorld();
    const ats = Array.from(win.roomHistoryEvents(c)).map(e => String(e.at || ''));
    assert.ok(ats.every((a, k) => k === 0 || ats[k - 1] <= a), ats.join(' | '));
  });
  test('(1c) the head says which way it runs, in both books', () => {
    assert.match(I18N, /ct_hist_reading: 'Newest first · /);
    assert.match(I18N, /ct_hist_reading: 'Nyast först · /);
    assert.ok(!/ct_hist_reading: '(Oldest|Äldsta)/.test(I18N), 'neither book still says oldest first');
  });
  test('(1d) [wall] the pop-out record and the exported report keep their own order', async () => {
    const { win, c } = await storyWorld();
    assert.match(win.negoTimelineScreenHtml(c, {}), /oldest first/);
    const NEGO = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    assert.match(NEGO, /events, oldest first · generated/);
  });

  /* ═══════ 2. THE DAY OVER THE TIME ═══════ */
  test('(2) today is the word, never a date', async () => {
    const { win } = await storyWorld();
    const now = new win.Date(2026, 8, 24, 16, 0, 0);
    const w = win.histWhen(new win.Date(2026, 8, 24, 9, 40, 0).toISOString(), now);
    assert.equal(w.day, win.i18t('ct_hist_today'));
    assert.notEqual(w.day, 'ct_hist_today', 'the key is in the book');
    assert.equal(w.time, win.negoWhen(new win.Date(2026, 8, 24, 9, 40, 0).toISOString()),
      'and the time is the product\'s one clock');
  });
  test('(2b) another day this year is a day and a month, with no year', async () => {
    const { win } = await storyWorld();
    const now = new win.Date(2026, 8, 24, 16, 0, 0);
    const w = win.histWhen(new win.Date(2026, 8, 22, 17, 2, 0).toISOString(), now);
    assert.match(w.day, /22/);
    assert.ok(!w.day.includes('2026'), JSON.stringify(w.day));
    assert.ok(w.time, 'with its time');
  });
  test('(2c) a day from another year carries its year', async () => {
    const { win } = await storyWorld();
    const now = new win.Date(2026, 8, 24, 16, 0, 0);
    const w = win.histWhen(new win.Date(2025, 2, 5, 14, 20, 0).toISOString(), now);
    assert.ok(w.day.includes('2025'), JSON.stringify(w.day));
  });
  test('(2d) a record that holds only a day gets the day alone — no invented 00:00', async () => {
    const { win } = await storyWorld();
    const w = win.histWhen('2026-03-05', new win.Date(2026, 8, 24, 16, 0, 0));
    assert.equal(w.time, '');
  });
  test('(2e) and that day is the LOCAL day it names, not yesterday west of Greenwich', async () => {
    const { win } = await storyWorld();
    /* The instrument first: in this clock a bare day really does parse as the
       day before. If it did not, the claim below would pass on the fault. */
    assert.equal(new win.Date('2026-03-05').getDate(), 4, 'the clock is west of Greenwich');
    const w = win.histWhen('2026-03-05', new win.Date(2026, 8, 24, 16, 0, 0));
    assert.match(w.day, /\b5\b/, JSON.stringify(w.day));
    assert.ok(!/\b4\b/.test(w.day), JSON.stringify(w.day));
  });
  test('(2f) a value that is not a date is printed as it came, never NaN', async () => {
    const { win } = await storyWorld();
    const w = win.histWhen('not a date');
    assert.equal(w.day, 'not a date');
    assert.equal(w.time, '');
    assert.ok(!/NaN|Invalid/.test(JSON.stringify(win.histWhen(''))));
  });
  test('(2g) the tab prints the day over the time, and no raw record date', async () => {
    const { win, c } = await storyWorld();
    const { rows } = rowsOf(win, win.roomHistoryHtml(c));
    for (const r of rows){
      const day = r.querySelector('.hist-when > .hist-day');
      assert.ok(day, 'every row has its day');
      assert.equal(day.textContent, win.i18t('ct_hist_today'), 'filed a moment ago, so it reads Today');
      assert.ok(r.querySelector('.hist-when > .hist-time').textContent, 'and its time under it');
      assert.ok(!/\d{4}-\d{2}-\d{2}/.test(r.querySelector('.hist-when').textContent));
    }
  });

  /* ═══════ 3. A RING IN THE KIND'S TONE ═══════ */
  test('(3) the tone is the ring\'s edge, not a fill', async () => {
    const { win, c } = await storyWorld();
    const { rows } = rowsOf(win, win.roomHistoryHtml(c));
    for (const r of rows){
      const st = r.querySelector('.hist-dot').getAttribute('style');
      assert.match(st, /^border-color:var\(--/, st);
      assert.ok(!/background/.test(st), 'no fill on the element');
    }
    assert.match(rule('.hist-dot'), /background:var\(--color-surface\)/, 'the middle is the surface');
    assert.match(rule('.hist-dot'), /z-index:1/, 'and it sits over the line');
  });
  test('(3b) [control] a refusal is still ruby', async () => {
    const { win, c } = await storyWorld();
    const { rows } = rowsOf(win, win.roomHistoryHtml(c));
    const r = rows.find(x => /Rejected/.test(x.querySelector('.hist-text').textContent));
    assert.ok(r, 'the refusal is on the page');
    /* The TONE is the claim, whichever property carries it — (3) above is the
       claim that it is the edge. */
    assert.match(r.querySelector('.hist-dot').getAttribute('style'), /var\(--st-ruby-dot\)/);
  });

  /* ═══════ 4. ONE LINE JOINS THEM ═══════ */
  test('(4) the rows sit in one trail, and an empty record draws none', async () => {
    const { win, c } = await storyWorld();
    const { box } = rowsOf(win, win.roomHistoryHtml(c));
    const trails = box.querySelectorAll('.hist-trail');
    assert.equal(trails.length, 1);
    assert.equal(trails[0].querySelectorAll(':scope > .hist-ev').length, box.querySelectorAll('.hist-ev').length);
    const none = rowsOf(win, win.roomHistoryHtml(c, { actor: 'Nobody At All' })).box;
    assert.equal(none.querySelectorAll('.hist-trail').length, 0, 'a filter that matches nothing joins nothing');
    assert.ok(none.querySelector('.hist-empty'), 'and still says so');
  });
  test('(4b) the line is drawn from the same numbers as the grid and the ring', () => {
    const before = rule('.hist-ev::before');
    assert.match(before, /background:var\(--rule\)/);
    assert.match(before, /left:calc\(var\(--s-4\) \+ var\(--hist-when-w\) \+ var\(--hist-gap\) \+ var\(--hist-dot\) \/ 2 - \.5px\)/);
    assert.match(rule('.hist-ev'), /grid-template-columns:var\(--hist-when-w\) /);
    assert.match(rule('.hist-ev'), /padding:var\(--hist-pad-y\) var\(--s-4\)/);
    assert.match(rule('.hist-dot'), /width:var\(--hist-dot\); height:var\(--hist-dot\); margin-top:var\(--hist-dot-top\)/);
    assert.match(rule('.hist-trail'),
      /--hist-dot-mid:calc\(var\(--hist-pad-y\) \+ var\(--hist-dot-top\) \+ var\(--hist-dot\) \/ 2\)/);
    assert.match(CSS, /\.hist-trail > \.hist-ev:first-child::before\{ top:var\(--hist-dot-mid\); \}/);
    assert.match(CSS, /\.hist-trail > \.hist-ev:last-child::before\{ bottom:calc\(100% - var\(--hist-dot-mid\)\); \}/);
  });
  test('(4c) and no rule runs across the page between entries', () => {
    assert.ok(!/border-bottom/.test(rule('.hist-ev')), rule('.hist-ev'));
    assert.ok(!CSS.includes('.hist-ev:last-child{ border-bottom:0; }'), 'the rule\'s own exception went with it');
  });

  /* ═══════ 5. THE ROUND AT THE RIGHT WALL ═══════ */
  test('(5) a round reads "R1", with its whole name on the hover', async () => {
    const { win, c } = await storyWorld();
    const { rows } = rowsOf(win, win.roomHistoryHtml(c));
    const inRound = rows.filter(r => r.querySelector('.hist-round:not(.is-none)'));
    assert.ok(inRound.length >= 2, 'the proposal and the refusal');
    for (const r of inRound){
      const el = r.querySelector('.hist-round');
      assert.equal(el.textContent, win.i18t('ct_round_short', { n: 1 }));
      assert.equal(el.getAttribute('title'), win.i18t('ct_round_n', { n: 1 }));
    }
    assert.equal(win.i18t('ct_round_short', { n: 1 }), 'R1');
    assert.match(rule('.hist-round'), /font-weight:var\(--w-strong\)/);
  });
  test('(5b) an entry in no round says so with a dash, and the column always holds', async () => {
    const { win, c } = await storyWorld();
    const { rows } = rowsOf(win, win.roomHistoryHtml(c));
    assert.ok(rows.every(r => r.querySelector('.hist-round')), 'every row draws the column');
    const sys = rows.find(r => /Scanned — Risk scan run/.test(r.querySelector('.hist-text').textContent));
    assert.ok(sys, 'the system entry is on the page');
    const dash = sys.querySelector('.hist-round');
    assert.ok(dash.classList.contains('is-none'));
    assert.equal(dash.textContent, '—');
    assert.equal(dash.getAttribute('aria-hidden'), 'true', 'a screen reader is not read a dash');
  });

  /* ═══════ 6. THE SENTENCE IN BLACK ═══════ */
  test('(6) the sentence above the names is the page\'s own ink at the label weight', () => {
    const t = rule('.hist-text');
    assert.match(t, /color:var\(--color-text\)/);
    assert.match(t, /font-weight:var\(--w-label\)/);
  });
  test('(6b) [control] the names line under it is left as it was', () => {
    assert.match(rule('.hist-meta'), /font-size:var\(--t-label\); color:var\(--color-neutral-500\)/);
  });
});
