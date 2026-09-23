/* f371 — A PAGE BANNER OVER NUMBERED CLAUSES IS NOT A CLAUSE (Young ruled it
   23 Sep 2026, off his Warehousing agreement; fix 2 of the seven he approved)

   The agreement sets four "PAGE 1 OF 4: DEFINITIONS, SCOPE & FACILITY" lines
   as Heading 2 and its real clauses — "1. DEFINITIONS AND INTERPRETATION" to
   "11. GOVERNING LAW" — as Heading 3 under them. HaTi read a heading as a
   clause that runs to the next heading of the same or higher rank, so the four
   banners became the clauses and the eleven numbered clauses their insides.
   MEASURED on his file: 5 clauses where the document has 12. The Copilot
   editor opened on a whole page and a redline card covered three clauses.

   His rulings: the banner STAYS on the page as a quiet section title with no
   pencil; and a contract already being negotiated keeps today's split.

     (1) the banner shape reads as its numbered clauses, the banner riding
         with the clause after it
     (2) stamping writes an id on the clauses and never on a banner
     (3) ONCE STAMPED, THE SPLIT HOLDS — a rename that drops a number and a
         clause inserted out of sequence do not flip it back
     (4) the edits that work by clause stop at a banner
     (5) the carry renames clauses and never makes one, so Re-read on an
         un-negotiated contract adopts the new split
     (6) the three papers on the negotiate page draw the banner once, above
         its clause, with no pencil and no data-clause
     (7) the Word export writes the banner as a heading
     (8) walls — a document already stamped the old way, an Article shape
         that restarts its numbers, a numbered heading above, an ordinary
         document

   A missing name READS AS EMPTY rather than throwing, so a build without the
   fix reports its claims one at a time. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

/* The owner's shape, cut down: a title, a recital under its own Heading 3, two
   unnumbered page banners, and numbered clauses that RUN ON across them. */
const BANNER_DOC = [
  '<h1>WAREHOUSING AND LOGISTICS SERVICES AGREEMENT</h1>',
  '<p>THIS AGREEMENT is made between <strong>Apex Logistics Limited</strong> and <strong>Savannah Consumer Goods Limited</strong>.</p>',
  '<h3>RECITALS:</h3>',
  '<p>WHEREAS the Logistics Provider provides warehousing services.</p>',
  '<h2>PAGE 1 OF 2: DEFINITIONS &amp; SCOPE</h2>',
  '<h3>1. DEFINITIONS AND INTERPRETATION</h3>',
  '<p>In this Agreement the following words have these meanings.</p>',
  '<h3>2. SCOPE OF SERVICES</h3>',
  '<p>The Logistics Provider shall store and handle the Goods.</p>',
  '<h3>3. RECEIPT OF GOODS</h3>',
  '<p>The Goods are received at the Designated Facility.</p>',
  '<h2>PAGE 2 OF 2: FEES &amp; LAW</h2>',
  '<h3>4. CHARGES AND PAYMENT</h3>',
  '<p>The Customer shall pay each invoice within thirty (30) days.</p>',
  '<h3>5. GOVERNING LAW</h3>',
  '<p>This Agreement is governed by the laws of Kenya.</p>',
].join('');

const ATTR = /data-clause-id="([^"]+)"/g;
const idsIn = html => [...String(html || '').matchAll(ATTR)].map(m => m[1]);
const call = (win, name, ...a) => (typeof win[name] === 'function' ? win[name](...a) : null);
const segOf = (win, html) => call(win, 'clauseSegment', html) || [];
const stampOf = (win, html) => (call(win, 'clauseStampIds', html) || { html: '' }).html;
const titles = list => list.map(cl => cl.title || cl.headingText || '');
/* A heading element's opening tag, found by its words. */
const openTag = (html, words) => {
  const at = String(html).indexOf(words);
  if (at < 0) return '';
  const from = String(html).lastIndexOf('<h', at);
  return String(html).slice(from, String(html).indexOf('>', from) + 1);
};
const contractOf = body => ({ id: 'MK-BAN-1', name: 'Warehousing Agreement', counterparty: 'Savannah',
  format: 'rich', redlineText: body, status: 'Under Review', changes: [], versions: [],
  audit: [], fields: {}, metadata: {}, comments: [] });

describe('f371 (1) — the banner shape reads as its numbered clauses', () => {
  test('six clauses: the recital and the five numbered ones', () => {
    const { win } = buildWorld();
    const list = segOf(win, BANNER_DOC);
    assert.equal(list.length, 6, `read ${list.length}: ${titles(list).join(' | ')}`);
    /* joined, because an array born inside jsdom is not this realm's Array */
    assert.equal(list.map(cl => cl.num || '-').join(','), '-,1,2,3,4,5');
  });
  test('each banner rides with the clause after it, and with nothing else', () => {
    const { win } = buildWorld();
    const list = segOf(win, BANNER_DOC);
    const riding = list.filter(cl => cl.sectionHtml).map(cl => cl.num);
    assert.equal(riding.join(','), '1,4', 'clause 1 carries page 1, clause 4 carries page 2');
    const one = list.find(cl => cl.num === '1');
    assert.match(String(one && one.sectionHtml), /PAGE 1 OF 2/);
    assert.doesNotMatch(String(one && one.bodyHtml), /PAGE/, 'the banner is not in the clause wording');
  });
  test('clause 3 ends where the next page begins', () => {
    const { win } = buildWorld();
    const three = segOf(win, BANNER_DOC).find(cl => cl.num === '3');
    assert.ok(three, 'clause 3 is a clause');
    assert.doesNotMatch(String(three.bodyHtml), /CHARGES|PAGE 2/);
  });
});

describe('f371 (2) — stamping names the clauses and never a banner', () => {
  test('an id on every clause heading, none on a banner, and a second stamp changes nothing', () => {
    const { win } = buildWorld();
    const out = call(win, 'clauseStampIds', BANNER_DOC) || { html: '', stamped: 0 };
    assert.equal(out.stamped, 6);
    assert.doesNotMatch(openTag(out.html, 'PAGE 1 OF 2'), /data-clause-id/);
    assert.doesNotMatch(openTag(out.html, 'PAGE 2 OF 2'), /data-clause-id/);
    assert.match(openTag(out.html, '4. CHARGES'), /data-clause-id/);
    assert.equal(stampOf(win, out.html), out.html, 'idempotent');
  });
});

describe('f371 (3) — once stamped, the split holds', () => {
  test('a rename that drops the number keeps every clause where it was', () => {
    const { win } = buildWorld();
    const doc = stampOf(win, BANNER_DOC);
    const before = segOf(win, doc).map(cl => cl.clauseId);
    const two = segOf(win, doc).find(cl => cl.num === '2');
    const renamed = call(win, 'clauseReplaceHeading', doc, two && two.clauseId, 'Scope of Services');
    assert.equal(segOf(win, renamed).map(cl => cl.clauseId).join(','), before.join(','));
  });
  test('a clause inserted out of sequence does not fold the pages back into clauses', () => {
    const { win } = buildWorld();
    const doc = stampOf(win, BANNER_DOC);
    const three = segOf(win, doc).find(cl => cl.num === '3');
    const ins = call(win, 'clauseInsert', doc, three && three.clauseId,
      { headingText: '12. A NEW CLAUSE', bodyHtml: '<p>New words.</p>' });
    const after = segOf(win, ins && ins.html);
    assert.equal(after.length, 7);
    assert.equal(after.filter(cl => cl.sectionHtml).map(cl => cl.num).join(','), '1,4');
  });
});

describe('f371 (4) — the edits that work by clause stop at a banner', () => {
  test('replacing clause 3 leaves page 2 riding with clause 4', () => {
    const { win } = buildWorld();
    const doc = stampOf(win, BANNER_DOC);
    const three = segOf(win, doc).find(cl => cl.num === '3');
    const next = call(win, 'clauseReplaceBody', doc, three && three.clauseId, '<p>Replaced wording.</p>');
    const list = segOf(win, next);
    assert.equal(list.length, 6);
    assert.match(String(next), /PAGE 2 OF 2/, 'the banner is still in the document');
    const four = list.find(cl => cl.num === '4');
    assert.match(String(four && four.sectionHtml), /PAGE 2 OF 2/);
  });
});

describe('f371 (5) — the carry renames clauses and never makes one', () => {
  test('Re-read on a contract stamped the old way adopts the new split and keeps the recital\'s id', () => {
    const { win } = buildWorld();
    let n = 0;
    const old = BANNER_DOC.replace('<h3>RECITALS:', '<h3 data-clause-id="cl_recitals1">RECITALS:')
      .replace(/<h2>/g, () => `<h2 data-clause-id="cl_pagebanner${++n}">`);
    const fresh = stampOf(win, BANNER_DOC);
    const next = call(win, 'clauseCarryIds', old, fresh);
    const list = segOf(win, next);
    assert.equal(list.length, 6);
    assert.equal(list[0].clauseId, 'cl_recitals1', 'a clause in both readings keeps its id');
    assert.doesNotMatch(openTag(next, 'PAGE 1 OF 2'), /data-clause-id/, 'a banner is not handed a clause id');
  });
});

describe('f371 (6) — the negotiate page draws the banner as a section title', () => {
  test('the workbench paper: once, above its clause, no pencil, no data-clause', () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contractOf(stampOf(win, BANNER_DOC));
    const html = String(call(win, 'redlineDocHtml', c, {}) || '');
    const sects = html.match(/<div class="rl-sect"[^>]*>[\s\S]*?<\/div>/g) || [];
    assert.equal(sects.length, 2, 'two banners, two section titles');
    assert.equal((html.match(/PAGE 1 OF 2/g) || []).length, 1, 'drawn once');
    assert.ok(sects.every(s => !/data-clause|data-rl-cp|rl-cp-pill/.test(s)), 'not a door');
    assert.ok(sects.every(s => /data-nego-chrome/.test(s)), 'marked chrome, so a highlight never reads it as wording');
    assert.ok(html.indexOf('PAGE 2 OF 2') < html.indexOf('4. CHARGES')
      && html.indexOf('PAGE 2 OF 2') > html.indexOf('3. RECEIPT'), 'between clause 3 and clause 4');
    assert.equal((html.match(/<section class="nego-clause rl-clause/g) || []).length, 6);
  });
  test('the room canvas and the clean reading draw it too', () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contractOf(stampOf(win, BANNER_DOC));
    const room = String(call(win, 'negoDocHtml', c, { baseline: false }) || '');
    const clean = String(call(win, 'negoCleanDocHtml', c, 'right') || '');
    assert.equal((room.match(/class="rl-sect"/g) || []).length, 2);
    assert.equal((clean.match(/class="rl-sect"/g) || []).length, 2);
  });
  test('the section title has its own quiet dress', () => {
    const { win } = buildWorld({ negotiationView: true });
    /* redlineLayoutCss injects its sheet rather than returning it */
    call(win, 'redlineLayoutCss');
    const el = win.document.getElementById('redline-layout-css');
    const css = String((el && el.textContent) || '');
    assert.match(css, /\.rl-sect\{[^}]*border-bottom:1px solid/);
    assert.match(css, /\.rl-sect > :is\(h1,h2,h3,h4,p\)[^{]*\{[^}]*text-transform:uppercase/);
  });
});

describe('f371 (7) — the Word export writes the banner as a heading', () => {
  test('[control] a heading paragraph carries the banner\'s words — true at the parent too, where the banner was drawn as a clause heading; this pins that it stays one', () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = contractOf(stampOf(win, BANNER_DOC));
    const html = String(call(win, 'redlineDocHtml', c, {}) || '');
    const paras = call(win, 'docxRunsFromHtml', html) || [];
    const text = p => (p.runs || []).map(r => r.text).join('');
    const banner = paras.find(p => /PAGE 1 OF 2/.test(text(p)));
    assert.ok(banner, 'the banner reaches the Word file');
    assert.ok(banner.heading > 0, 'as a heading, so a returned file reads it as a banner again');
  });
});

describe('f371 (8) — walls', () => {
  test('[wall] a document already stamped the old way keeps its five pages', () => {
    const { win } = buildWorld();
    let n = 0;
    const old = BANNER_DOC.replace('<h3>RECITALS:', '<h3 data-clause-id="cl_recitals1">RECITALS:')
      .replace(/<h2>/g, () => `<h2 data-clause-id="cl_pagebanner${++n}">`);
    const list = segOf(win, old);
    assert.equal(list.length, 3, 'recitals and two pages, exactly as it was negotiated');
    assert.equal(list.map(cl => cl.clauseId).join(','), 'cl_recitals1,cl_pagebanner1,cl_pagebanner2');
  });
  test('[wall] an Article shape that restarts its numbers keeps the headings above as clauses', () => {
    const { win } = buildWorld();
    const doc = '<h1>AGREEMENT</h1><h2>ARTICLE ONE: GENERAL</h2><h3>1. Scope</h3><p>a</p><h3>2. Term</h3><p>b</p>'
      + '<h2>ARTICLE TWO: MONEY</h2><h3>1. Price</h3><p>c</p><h3>2. Tax</h3><p>d</p>';
    assert.equal(segOf(win, doc).length, 2);
  });
  test('[wall] a numbered heading above makes the headings above clauses', () => {
    const { win } = buildWorld();
    const doc = '<h1>AGREEMENT</h1><h2>1. GENERAL</h2><h3>1.1 Scope</h3><p>a</p><h3>1.2 Term</h3><p>b</p>'
      + '<h2>2. MONEY</h2><h3>2.1 Price</h3><p>c</p><h3>2.2 Tax</h3><p>d</p>';
    assert.equal(segOf(win, doc).length, 2);
  });
  test('[wall] an ordinary document reads and draws exactly as before', () => {
    const { win } = buildWorld({ negotiationView: true });
    const doc = '<h1>AGREEMENT</h1><h2>1. Scope</h2><p>a</p><h2>2. Term</h2><p>b</p><h2>3. Law</h2><p>c</p>';
    const list = segOf(win, doc);
    assert.equal(list.length, 3);
    assert.ok(list.every(cl => !cl.sectionHtml));
    const html = String(call(win, 'redlineDocHtml', contractOf(stampOf(win, doc)), {}) || '');
    assert.doesNotMatch(html, /class="rl-sect"/);
  });
});
