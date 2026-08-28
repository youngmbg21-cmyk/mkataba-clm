/* ============================================================
   f250 — the front matter is a region, and it is proposed on
   ============================================================
   Owner-ruled 28 Aug 2026: front matter "editable, recorded as a document
   change."

   The title, the kicker line above it and the recital under it are the
   agreement's own words — they name the parties and state what the contract is
   FOR — and they were the one part of the document nothing could propose
   against, because the change model keys everything on a clause id and the
   front matter has none. clauseSegment's own note gave the reason in so many
   words: "nobody negotiates the title". The owner has ruled the other way.

   WHAT IS PINNED HERE, and every one of them is a rule rather than a look:
     1  it is a REGION under one reserved id, and that id cannot collide
     2  it is NOT a clause — no count, no queue, no numbering knows about it
     3  it files through the one funnel, on the ordinary record
     4  it may not change what the clauses ARE, and that is measured
     5  the region has to survive its own edit
     6  accepting it moves the document; rejecting it leaves it alone
     7  the paper draws it, and the three readings are documents not marks
     8  one control — the pencil every clause already has
     9  the room is deliberately unchanged
    10 where the region does not exist, nothing is offered
    11 both languages
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const MODEL = read('js/clausemodel.js');
const VIEW = read('js/views/negotiation.js');
const MODELERS = read('js/negotiation.js');
const I18N = read('js/i18n.js');

function contract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
function stage(){
  const { win } = buildWorld({ negotiationView: true, contractView: true });
  const c = contract();
  win.negoInit(c);
  const front = win.negoClauseById(c, 'front');
  assert.ok(front, 'the fixture must have a front-matter region');
  return { win, c, front };
}
const edit = (win, c, html, over = {}) => win.negoEditClause(c, 'front', html,
  { side: 'owner', author: 'Amina Odhiambo', quiet: true, ...over });

describe('f250 (1) — one reserved id, and it cannot collide', () => {
  test('the id is not one clauseNewId could ever mint', () => {
    const { win } = buildWorld();
    assert.equal(win.CLAUSE_FRONT_ID, 'front');
    /* clauseNewId only ever returns cl_… and clauseStampIds only ever writes
       what clauseNewId returns, so this is safe by construction. */
    for (let i = 0; i < 200; i++){
      const id = win.clauseNewId(new Set());
      assert.match(id, /^cl_/);
      assert.notEqual(id, win.CLAUSE_FRONT_ID);
    }
  });

  test('the region reads as a clause-shaped thing', () => {
    const { front } = stage();
    assert.equal(front.clauseId, 'front');
    assert.equal(front.front, true);
    assert.equal(front.headingText, '', 'its title is INSIDE its own markup, not a heading of its own');
    assert.ok(front.bodyHtml.includes('<h1'), 'and the title is in there');
    assert.ok(front.text.includes('Warehousing'), 'with a text projection like any other');
  });
});

describe('f250 (2) — it is not a clause', () => {
  test('the clause list, the queue and the numbering never see it', () => {
    const { win, c } = stage();
    const ids = win.negoClauseList(c).map(x => x.clauseId);
    assert.ok(ids.length > 0);
    assert.ok(!ids.includes('front'), 'nobody is ever asked to decide "clause 0"');
    assert.ok(!win.clauseSegment(win.negoBaseBody(c)).some(x => x.clauseId === 'front'));
  });

  test('and a change on it does not change the clause count', async () => {
    const { win, c, front } = stage();
    const before = win.negoClauseList(c).length;
    await edit(win, c, front.bodyHtml.replace('Malmö', 'Malmö, Sweden'));
    assert.equal(win.negoClauseList(c).length, before);
  });
});

describe('f250 (3) — it files through the one funnel', () => {
  test('an ordinary record, an ordinary type, an ordinary fingerprint', async () => {
    const { win, c, front } = stage();
    const ch = await edit(win, c, front.bodyHtml.replace('Nordfrakt Logistik AB', 'Nordfrakt Logistik AB (publ)'));
    assert.ok(ch, 'the edit files');
    assert.equal(ch.changeType, 'modify', 'no new kind of change was invented');
    assert.equal(ch.clauseId, 'front');
    assert.equal(ch.clauseLabel, 'Front matter', 'the RECORD keeps English');
    assert.equal(ch.status, 'pending');
    assert.equal(ch.hashV, win.NEGO_HASH_V);
    const v = await win.verifyChangeChain(c);
    assert.equal(v.ok, true, `the chain verifies: ${v.detail}`);
  });

  test('every guard the funnel carries applies to it', async () => {
    const { win, c, front } = stage();
    c.status = 'Signed';
    const ch = await edit(win, c, front.bodyHtml.replace('Malmö', 'Malmo'));
    assert.equal(ch, null, 'the executed-wording freeze covers the opening too');
  });

  test('an untouched region files nothing', async () => {
    const { win, c, front } = stage();
    assert.equal(await edit(win, c, front.bodyHtml), null);
  });
});

describe('f250 (4) — it may not change what the clauses are', () => {
  test('a pasted heading is refused at the door, in words', async () => {
    const { win, c, front } = stage();
    const bad = front.bodyHtml + '<h2>Sneaky new clause</h2><p>Whatever.</p>';
    assert.equal(await edit(win, c, bad), null, 'refused before anything is filed');
    assert.equal(win.negoChanges(c).length, 0, 'and nothing was recorded');
    assert.match(String(win.negoLastRefusal || ''), /divided into clauses/i,
      'the reader is told why, at the moment they press');
  });

  test('the model measures it rather than guessing at tags', () => {
    const body = F.protoRich();
    const { win } = buildWorld();
    const front = win.clauseFrontClause(body);
    const before = win.clauseSegment(body).map(x => x.clauseId).join('|');
    const bad = front.bodyHtml + '<h2>Sneaky</h2><p>x</p>';
    assert.equal(win.clauseReplaceFront(body, bad), null);
    /* the same reading it protects */
    const good = win.clauseReplaceFront(body, front.bodyHtml.replace('Malmö', 'Malmo'));
    assert.ok(good);
    assert.equal(win.clauseSegment(good).map(x => x.clauseId).join('|'), before,
      'an ordinary edit re-points not one clause id');
  });
});

describe('f250 (5) — the region has to survive its own edit', () => {
  test('deleting the title is refused', async () => {
    const { win, c, front } = stage();
    const noTitle = front.bodyHtml.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '');
    assert.equal(await edit(win, c, noTitle), null,
      'one accepted change must not close a door there is no way back through');
  });

  test('dropping the recital is allowed — only the title is load-bearing', () => {
    const { win } = buildWorld();
    const body = F.protoRich();
    const front = win.clauseFrontClause(body);
    const noRecital = front.bodyHtml.replace(/<p>[\s\S]*?<\/p>/, '');
    assert.ok(win.clauseReplaceFront(body, noRecital));
  });
});

describe('f250 (6) — accepting it moves the document', () => {
  test('the opening changes and the clauses do not', async () => {
    const { win, c, front } = stage();
    const ch = await edit(win, c, front.bodyHtml.replace('Nordfrakt Logistik AB', 'Nordfrakt Logistik AB (publ)'));
    const clausesBefore = win.clauseSegment(win.negoBaseBody(c)).map(x => x.clauseId).join('|');
    await win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty' });
    const out = win.negoResolvedBody(c);
    assert.ok(win.clauseFrontClause(out).bodyHtml.includes('(publ)'), 'the opening carries it');
    assert.equal(win.clauseSegment(out).map(x => x.clauseId).join('|'), clausesBefore,
      'and not one clause moved');
  });

  test('rejecting it leaves the opening alone', async () => {
    const { win, c, front } = stage();
    const ch = await edit(win, c, front.bodyHtml.replace('Nordfrakt Logistik AB', 'Nordfrakt Logistik AB (publ)'));
    await win.negoResolve(c, ch.id, 'rejected', { side: 'counterparty', reply: 'No' });
    assert.ok(!win.clauseFrontClause(win.negoResolvedBody(c)).bodyHtml.includes('(publ)'),
      'silence rejects, and so does a refusal');
  });
});

describe('f250 (7) — the paper draws it, and a clean reading is a document', () => {
  const paper = (win, c) => win.redlineDocHtml(c, { side: 'owner', cpSink: [] });

  test('the redlined reading marks the region', async () => {
    const { win, c, front } = stage();
    await edit(win, c, front.bodyHtml.replace('Nordfrakt Logistik AB', 'Nordfrakt Logistik AB (publ)'));
    win.rlSetReadMode('marks');
    const html = paper(win, c);
    const head = (html.match(/<header class="rl-paper-head[\s\S]*?<\/header>/) || [''])[0];
    assert.match(head, /rl-front is-changed/, 'the region says it has been argued over');
    assert.match(head, /nego-ins/, 'and the proposed words are marked');
  });

  test('as agreed and with changes keep the title’s own size', async () => {
    const { win, c, front } = stage();
    await edit(win, c, front.bodyHtml.replace('Nordfrakt Logistik AB', 'Nordfrakt Logistik AB (publ)'));
    win.rlSetReadMode('agreed');
    const agreed = paper(win, c);
    assert.match(agreed, /rl-paper-title/, 'as agreed is drawn as a document');
    assert.ok(!agreed.includes('(publ)'), 'and shows what the opening says today');
    win.rlSetReadMode('proposed');
    const prop = paper(win, c);
    assert.match(prop, /rl-paper-title/, 'with changes is drawn as a document too');
    assert.ok(prop.includes('(publ)'), 'and shows what is being proposed');
    win.rlSetReadMode('marks');
  });

  test('with nothing on the table the paper is exactly what it was', () => {
    const { win, c } = stage();
    win.rlSetReadMode('marks');
    const html = paper(win, c);
    assert.match(html, /rl-paper-title/);
    assert.match(html, /rl-recital/, 'the recital still draws in its own block');
    assert.ok(!/rl-front is-changed/.test(html), 'and nothing says it has been argued over');
  });
});

describe('f250 (8) — one control, the pencil every clause already has', () => {
  test('the region carries a pencil, and it opens the same panel', () => {
    const { win, c } = stage();
    const sink = [];
    const html = win.redlineDocHtml(c, { side: 'owner', cpSink: sink });
    const head = (html.match(/<header class="rl-paper-head[\s\S]*?<\/header>/) || [''])[0];
    assert.match(head, /data-rl-cp-open="front"/, 'the same door every clause has');
    assert.match(head, /class="rl-cp-pill"/, 'and the same control');
    assert.ok(sink.some(x => /data-rl-cp-for="front"/.test(x)),
      'with a body waiting for it in the panel');
  });

  test('the panel names it in the reader’s language, not the record’s', () => {
    const { win, c } = stage();
    const sink = [];
    win.redlineDocHtml(c, { side: 'owner', cpSink: sink });
    const body = sink.find(x => /data-rl-cp-for="front"/.test(x)) || '';
    const name = (body.match(/rl-cp-clname">([^<]*)/) || [])[1] || '';
    assert.equal(name, 'Title and recital');
    assert.notEqual(name, 'Front matter', 'that is the RECORD’s word and stays on the record');
  });

  test('nothing else is added to the paper', () => {
    const { win, c } = stage();
    const html = win.redlineDocHtml(c, { side: 'owner', cpSink: [] });
    const head = (html.match(/<header class="rl-paper-head[\s\S]*?<\/header>/) || [''])[0];
    assert.ok(!/rl-note-card|nego-note|rl-band/.test(head),
      'no band, no caption, no box — the standing rule about what may go on a page');
  });
});

describe('f250 (9) — the room is deliberately unchanged', () => {
  test('negoDocHtml draws no front matter, exactly as before', () => {
    const { win, c } = stage();
    const room = win.negoDocHtml(c, { side: 'owner' });
    assert.equal(/data-clause="front"/.test(room), false,
      'that canvas has never drawn the opening and still does not');
    assert.equal(/rl-front/.test(room), false);
  });

  test('and the reason is written down beside the code', () => {
    /* Asserted as a BOOLEAN, not with assert.match: these files are a megabyte
       and a failed match prints the lot. */
    assert.equal(/IT IS NOT IN negoClauseList AND MUST NOT BE/.test(MODELERS), true,
      'the region is kept out of the clause list on purpose, and the reason is beside the code');
  });
});

describe('f250 (10) — where the region does not exist, nothing is offered', () => {
  test('a wall of paragraphs gets no region and no pencil', () => {
    const { win } = buildWorld({ negotiationView: true });
    const wall = '<p>One paragraph.</p><p>Another paragraph.</p><p>A third.</p>';
    assert.equal(win.clauseFrontClause(wall), null,
      'no title, no region — and an edit there would re-segment the whole document');
    assert.equal(win.clauseReplaceFront(wall, '<p>x</p>'), null);
  });

  test('a document whose headings do not mark its clauses is refused too', () => {
    const { win } = buildWorld({ negotiationView: true });
    const titled = '<h1>An Agreement</h1><p>First clause.</p><p>Second clause.</p>';
    assert.equal(win.clauseFrontClause(titled), null,
      'there the blocks under the title ARE the clauses');
  });

  test('the model and the funnel agree about it', () => {
    assert.match(strip(MODEL), /if \(!_clHeadingsMarkClauses\(blocks, headings\)\) return -1/,
      'the region only exists where headings mark the clauses');
  });
});

describe('f250 (11) — both languages', () => {
  for (const key of ['ne_front_restructures', 'ng_front_matter']){
    test(`${key} is written in both`, () => {
      const hits = (I18N.match(new RegExp(`(^|[^\\w])${key}:`, 'g')) || []).length;
      assert.equal(hits, 2, `${key} must exist in English and in Swedish`);
    });
  }
});
