/* ============================================================
   f656 — A LONG CONTRACT MOVES LIKE ANY OTHER, AND PLAIN READS A LONG CLAUSE
   (Young, 9–10 Oct 2026, off a 50-page certificate: "when I try to navigate
   through this contract inside Hati, it is slow and dragging" · "It moving
   from tab to tab … even moving from history to obligations is slow" · and a
   screenshot of one 9,562-word part, "94% of the paper", that Plain could
   never read. Owner chose option 1: cut the part at its own numbers.)
   ============================================================
   (A) the wording is read once: the cleaner and the text projection hand back
       the same answer for the same wording, and the clause split hands each
       caller its OWN copy — a caller writing on its list cannot change the
       next caller's; one clause by id is the one the whole list would give;
   (B) one date printer per shape: History and the phone's History print what
       toLocale*String printed, through dateFmtOf;
   (C) a part longer than DOC_READ_LONG_WORDS is cut at an IN-ORDER run of its
       own numbers ("1." "2." / "Section 3." / Word list items); a stray
       number or a short span changes nothing;
   (D) the route reads a clause longer than a page in pieces and lands ONE
       reading, never asking it whole; a clause too long for the pieces, or a
       shorter one cut short on both its asks, is said as `tooLong`;
   (E) the Thread says "too long" for it, in both books.
   Driven in a browser by test/chromium/long-contract-moves-verify.js.

   Run: node --test test/f656-a-long-contract-moves-like-any-other.test.js
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');

describe('f656 (A) the wording is read once', () => {
  const win = buildWorld().win;
  const html = '<h1>AGREEMENT</h1><h2>1. Term</h2><p>The term is one year.</p><h2>2. Fees</h2><p>The fees are <b>KES 10</b>.</p>';

  test('the cleaner and the text projection answer the same wording the same way, and an edit afresh', () => {
    assert.equal(win.sanitizeRich(html), win.sanitizeRich(html));
    assert.equal(win.richToText(html), win.richToText(html));
    assert.match(win.richToText(html), /KES 10/);
    assert.match(win.richToText(html.replace('KES 10', 'KES 20')), /KES 20/, 'a changed wording is read afresh');
    assert.equal(win.sanitizeRich('<p>a<script>x</script></p>'), win.sanitizeRich('<p>a<script>x</script></p>'));
    assert.doesNotMatch(win.sanitizeRich('<p>a<script>x</script></p>'), /script/i, 'still cleaned, every time');
  });

  test('each caller is handed its own copy of the split — writing on one never reaches the next', () => {
    const a = win.clauseSegment(html);
    assert.equal(a.length, 2);
    a[0].text = 'SCRIBBLED'; a.pop();
    const b = win.clauseSegment(html);
    assert.equal(b.length, 2, 'the list the next caller gets is whole');
    assert.notEqual(b[0].text, 'SCRIBBLED', 'and its clauses are untouched');
  });

  test('one clause by id is exactly the one the whole list would give', () => {
    const stamped = win.clauseStampIds ? win.clauseStampIds(html) : html;
    const all = win.clauseSegment(stamped);
    for (const cl of all) {
      if (!cl.clauseId) continue;
      assert.deepEqual(win.clauseSegmentFind(stamped, cl.clauseId), all.find(x => x.clauseId === cl.clauseId));
    }
    assert.equal(win.clauseSegmentFind(stamped, 'no-such-id'), null);
  });

  test('Negotiate asks for one clause without splitting the contract once per clause', () => {
    const src = code(read('js/negotiation.js'));
    const at = src.indexOf('const negoClauseById');
    assert.ok(at > 0);
    assert.match(src.slice(at, at + 400), /clauseSegmentFind\(/);
  });
});

describe('f656 (B) one date printer per shape', () => {
  /* js/core.js is not loaded by the test world, so the printer is lifted out
     of it whole — the region from its declaration to the next one. */
  const core = read('js/core.js');
  const at = core.indexOf('const _dateFmtKept');
  const win = new Function(core.slice(at, core.indexOf('\n}\n', core.indexOf('function dateFmtOf(')) + 3) + '; return { dateFmtOf };')();
  test('it is published', () => assert.match(core, /todayISO,dateFmtOf,/));
  test('dateFmtOf prints what toLocale*String printed', () => {
    const d = new Date('2026-03-04T15:07:00');
    for (const loc of ['en-GB', 'sv-SE', undefined]) {
      for (const o of [{ day: 'numeric', month: 'short' }, { day: 'numeric', month: 'short', year: 'numeric' }])
        assert.equal(win.dateFmtOf(loc, o).format(d), d.toLocaleDateString(loc, o));
      assert.equal(win.dateFmtOf(loc, { hour: '2-digit', minute: '2-digit' }).format(d), d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' }));
    }
    assert.equal(win.dateFmtOf('en-GB', { day: 'numeric' }), win.dateFmtOf('en-GB', { day: 'numeric' }), 'built once, kept');
  });
  test('History, its time, and the phone\'s History print through it', () => {
    const c = code(read('js/views/contract.js'));
    const h = c.slice(c.indexOf('function histWhen('), c.indexOf('function roomHistoryHtml('));
    assert.match(h, /dateFmtOf\(/);
    const n = code(read('js/views/negotiation.js'));
    const w = n.slice(n.indexOf('function negoWhen('), n.indexOf('function negoWhen(') + 300);
    assert.match(w, /dateFmtOf\(/);
    assert.match(code(read('js/mobile-contract.js')), /dateFmtOf\(langLocale\(\),\{dateStyle:'medium',timeStyle:'short'\}\)/);
  });
});

describe('f656 (C) a part too long to be one clause is cut at its own numbers', () => {
  const win = buildWorld({ contractView: true }).win;
  const doc = win.document;
  const sent = 'The holders of the Series A Preferred Stock shall be entitled to receive dividends in preference to the Common Stock.';
  const many = n => Array.from({ length: n }, () => sent).join(' ');
  const sheet = inner => {
    const cv = doc.createElement('div'); cv.innerHTML = inner; doc.body.appendChild(cv);
    const h = cv.querySelector('h2');
    return { cv, rows: [{ el: h, isHead: true, isMark: false, num: '', sep: '' }] };
  };
  const names = ['Dividends', 'Liquidation', 'Voting', 'Conversion'];

  test('the limit and the run are stated, and published', () => {
    assert.equal(win.DOC_READ_LONG_WORDS, 1500);
    assert.equal(win.DOC_READ_RUN_MIN, 3);
  });

  test('typed numbers in order become parts; a stray "5." inside does not break or join the run', () => {
    const { cv, rows } = sheet('<h2>PREFERRED STOCK</h2><p>The following rights apply.</p>'
      + names.map((n, i) => `<p><strong>${i + 1}. ${n}.</strong></p><p>${many(30)}</p><p>5. days apply. ${many(5)}</p>`).join(''));
    const got = win.docReadLongSplit(cv, rows);
    assert.deepEqual(got.slice(1).map(r => r.num), ['1', '2', '3', '4']);
    assert.ok(got.slice(1).every(r => /^\d\. /.test(r.el.textContent)), 'each anchors on its own numbered paragraph');
    cv.remove();
  });

  test('"Section N" counts as a number', () => {
    const { cv, rows } = sheet('<h2>PREFERRED STOCK</h2>'
      + names.map((n, i) => `<p>Section ${i + 1}. ${n}. ${many(40)}</p>`).join(''));
    assert.deepEqual(win.docReadLongSplit(cv, rows).slice(1).map(r => r.num), ['1', '2', '3', '4']);
    cv.remove();
  });

  test('Word\'s own list numbering: one part per item, numbered from the list\'s start', () => {
    const { cv, rows } = sheet('<h2>PREFERRED STOCK</h2><ol start="2">'
      + names.map(n => `<li><strong>${n}.</strong> ${many(40)}</li>`).join('') + '</ol>');
    const got = win.docReadLongSplit(cv, rows);
    assert.deepEqual(got.slice(1).map(r => r.num), ['2', '3', '4', '5']);
    assert.ok(got.slice(1).every(r => r.el.tagName === 'LI'));
    cv.remove();
  });

  test('a short span, numbers out of order, or too few walk exactly as before', () => {
    for (const inner of [
      '<h2>FEES</h2>' + names.map((n, i) => `<p>${i + 1}. ${n}. ${sent}</p>`).join(''),
      '<h2>FEES</h2>' + ['2', '7', '4', '9'].map(k => `<p>${k}. ${many(40)}</p>`).join(''),
      '<h2>FEES</h2><p>1. One. ' + many(60) + '</p><p>2. Two. ' + many(60) + '</p>',
    ]) {
      const { cv, rows } = sheet(inner);
      assert.equal(win.docReadLongSplit(cv, rows), rows, 'the very same list, untouched');
      cv.remove();
    }
  });

  test('the walk asks for it between the anchors and before the rows are read', () => {
    const c = code(read('js/views/contract.js'));
    const w = c.slice(c.indexOf('function docReadSheet('), c.indexOf('const docReadClauses'));
    assert.match(w, /rows=docReadLongSplit\(canvas,rows\);/);
    assert.ok(w.indexOf('docReadLongSplit(') < w.indexOf('const out=[];'));
  });
});

describe('f656 (D) the route reads a long clause in pieces', () => {
  let h, ai, W;
  const put = id => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
    id, name: 'Certificate', counterparty: 'Sanergy', folder: FOLDER_A, status: 'Under Review',
    redlineText: '<p>x</p>', fields: {}, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
  const sentence = k => `Sentence ${k} says the holders of the Series A Preferred Stock shall receive dividends before any other class of stock.`;
  const longText = chars => { let t = '', k = 0; while (t.length < chars) t += sentence(k++) + ' '; return t.trim(); };
  const tu = plain => [{ type: 'tool_use', id: 'tu', name: 'clause_readings', input: { readings: [{ key: 'R0', heading: 'x', plain }] } }];
  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    for (const id of ['MK-F656-A', 'MK-F656-B', 'MK-F656-C', 'MK-F656-D', 'MK-F656-E']) await put(id);
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('a clause of ~40,000 characters is read in pieces, in order, and lands as ONE reading', async () => {
    ai.reset();
    for (let k = 0; k < 8; k++) ai.script(body => {
      const m = /\(part (\d+) of (\d+)\)/.exec(JSON.stringify(body));
      return tu(m ? `Piece ${m[1]} of ${m[2]} in plain words.` : 'whole');
    });
    const clauses = [{ num: '', heading: 'PREFERRED STOCK', text: longText(40000), kind: 'clause' }];
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F656-A', clauses, only: [0] } });
    const n = ai.calls.length;
    assert.ok(n >= 3 && n <= 8, `asked in pieces (${n})`);
    const it = out.readings.items.find(x => x.i === 0);
    assert.ok(it, 'one reading landed');
    for (let k = 1; k <= n; k++) assert.ok(it.plain.includes(`Piece ${k} of ${n}`), 'piece ' + k + ' is in it');
    assert.ok(it.plain.indexOf('Piece 1 ') < it.plain.indexOf(`Piece ${n} `), 'in order');
    assert.ok(!out.readings.tooLong, 'not said to be too long');
    const again = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F656-A', clauses, only: [0] } });
    assert.equal(ai.calls.length, n, 'kept: the second press costs nothing');
    assert.equal(again.readings.items.find(x => x.i === 0).plain, it.plain);
  });

  test('every piece is cut at a sentence end, never mid-word', async () => {
    ai.reset();
    const sent = [];
    for (let k = 0; k < 8; k++) ai.script(body => { sent.push(JSON.stringify(body)); return tu('ok'); });
    const clauses = [{ num: '', heading: 'PREFERRED STOCK', text: longText(30000), kind: 'clause' }];
    await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F656-B', clauses, only: [0] } });
    assert.ok(sent.length >= 2);
    for (const s of sent) assert.match(s, /stock\.(\\n)*\s*"?\s*\}?/i, 'each piece ends on a full stop');
  });

  test('a clause shorter than a page cut short on BOTH asks is said as too long — not "answered without a reading"', async () => {
    ai.reset();
    for (let k = 0; k < 4; k++) ai.script({ content: [{ type: 'tool_use', id: 'tu', name: 'clause_readings', input: {} }], stopReason: 'max_tokens' });
    const clauses = [{ num: '1', heading: '1. Dividends', text: longText(9000), kind: 'clause' }];
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F656-C', clauses, only: [0] } });
    assert.equal(ai.calls.length, 2, 'the one second ask it always had (f367), and no more');
    assert.deepEqual(out.readings.tooLong, [0]);
    assert.ok(!out.readings.items.some(x => x.i === 0));
  });

  test('a clause longer than a page is never asked whole — the pieces are the only asks', async () => {
    ai.reset();
    for (let k = 0; k < 8; k++) ai.script(body => tu(/\(part \d+ of \d+\)/.test(JSON.stringify(body)) ? 'piece' : 'WHOLE'));
    const clauses = [{ num: '', heading: 'PREFERRED STOCK', text: longText(20000), kind: 'clause' }];
    await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F656-E', clauses, only: [0] } });
    assert.ok(ai.calls.length >= 2 && ai.calls.every(c => /\(part \d+ of \d+\)/.test(JSON.stringify(c.body))), 'every ask is a piece');
  });

  test('a clause too long even for the pieces is said as that and costs nothing', async () => {
    ai.reset();
    const clauses = [{ num: '', heading: 'EVERYTHING', text: longText(12000 * 8 + 6000), kind: 'clause' }];
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F656-D', clauses, only: [0] } });
    assert.equal(ai.calls.length, 0);
    assert.deepEqual(out.readings.tooLong, [0]);
  });
});

describe('f656 (E) the Thread says "too long"', () => {
  test('its own reason, in both books, chosen off the route\'s answer', () => {
    const c = code(read('js/views/contract.js'));
    assert.match(c, /long:'th_cannot_long'/);
    const run = c.slice(c.indexOf('async function docReadRun('), c.indexOf('async function docReadPoll('));
    assert.match(run, /r\.readings\.tooLong/);
    assert.match(run, /out\.why='long'/);
    const i18n = read('js/i18n.js');
    assert.equal((i18n.match(/th_cannot_long:/g) || []).length, 2, 'English and Swedish');
  });
});
