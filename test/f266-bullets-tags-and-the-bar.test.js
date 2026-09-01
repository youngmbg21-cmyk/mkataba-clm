/* ============================================================
   f266 — the sub-bullet, the writing bar, and a tagged name
   ============================================================
   Owner-asked 2 Sep 2026, four things in one message off four screenshots:

     1  "increase the size of the top bar features by 20%. They are currently
        too small to read or understand some of them."
     2  "the dented bullet point ... shows in image 1 how it is supposed to be
        but when I click on the pencil to go to redline mode, the bullet point
        does not stick" — plus "review ... any other bug related to editing
        like bullets, fonts etc".
     3  "when you tag someone ... the should be in bold and in color as well
        with every name having a different color code."
     4  "The person tagged should also be informed via email and also with a
        mark on the symbol."

   WHAT IS PINNED HERE:
     1  the projection carries a bullet's DEPTH, and one reading decides it
     2  the two walks agree, or richFromTextEdit abandons every list merge
     3  the redline draws the depth it is given
     4  the editing sweep: what survives storage and what is refused
     5  the bar is a fifth bigger and its icons scale from one declaration
     6  a tagged name is bold, coloured, and stable per person
     7  the mark on the Chat symbol, and what clears it
     8  the mention route, against a real server: keys in, addresses never
     9  both languages
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const RICH = read('js/richdoc.js');
const REDL = read('js/redline.js');
const HTML = read('index.html');
const NEG = read('js/views/negotiation.js');
const APP = read('js/app.js');
const SRV = read('server/server.js');

const w = () => buildWorld({ negotiationView: true });
const NEST = '<p>The passage does not touch:</p>'
  + '<ul><li>Governing law (which is separate, in Clause 9)'
  + '<ul><li>No worries</li></ul></li><li>Data protection</li></ul>';

/* ============================================================
   1 — THE PROJECTION CARRIES THE DEPTH
   ============================================================
   The redline is drawn from OPS and the ops carry TEXT, so a depth thrown away
   at the projection is a depth nothing downstream can put back. A nested
   DECIMAL list has carried its depth since it was written (2 → 2.1 → 2.1.3);
   a nested BULLET list carried none, and every level projected as "• ".
   ============================================================ */
describe('f266 (1) — a sub-bullet is projected as a sub-bullet', () => {
  test('the ladder is • then ◦ then ▪, and it repeats rather than inventing', () => {
    const { win } = w();
    assert.equal(win.richToText(NEST),
      'The passage does not touch:\n'
      + '• Governing law (which is separate, in Clause 9)\n'
      + '◦ No worries\n'
      + '• Data protection');
    assert.equal(win.richToText('<ul><li>a<ul><li>b<ul><li>c<ul><li>d</li></ul></li></ul></li></ul></ul>'),
      '• a\n◦ b\n▪ c\n▪ d',
      'past the third level the glyph repeats — a marker a reader cannot name '
      + 'is worse than one that is reused');
  });

  test('a numbered list is untouched — it already carried its depth', () => {
    const { win } = w();
    assert.equal(win.richToText('<ol><li>one<ol><li>deep</li></ol></li></ol>'),
      '1. one\n1.1. deep');
    assert.equal(win.richToText('<ol type="a"><li>one</li><li>two</li></ol>'),
      'a. one\nb. two', 'and a lettered list still says what the document shows');
  });

  test('ONE READING decides the marker, and both walks ask it', () => {
    assert.match(RICH, /function _listMark\(list, index, path, ulDepth\)/);
    const walks = (RICH.match(/_listMark\(ch, i, path, ulDepth\)/g) || []).length;
    assert.equal(walks, 2,
      'richToText and _lineUnits, or the merge verification fails on every list');
    assert.ok(!/const marker=\(ol/.test(RICH),
      'and neither carries its own copy any more');
  });

  test('the two walks agree — an edit inside a sub-bullet still merges', () => {
    const { win } = w();
    const t = win.richToText(NEST);
    assert.ok(win.richFromTextEdit(NEST, t) !== null,
      'unchanged text must merge, or every list in the document falls to plain');
    const out = win.richFromTextEdit(NEST, t.replace('No worries', 'No worries at all'));
    assert.ok(out, 'and an edit inside the sub-bullet merges');
    assert.match(out, /<li>[^]*?<ul>/, 'with the nesting kept');
    assert.equal(win.richToText(out), t.replace('No worries', 'No worries at all'),
      'and the result verifies against what was agreed');
  });
});

/* ============================================================
   2 — AND THE REDLINE DRAWS IT
   ============================================================ */
describe('f266 (2) — the depth reaches the drawing', () => {
  test('the depth is read off the glyph, never carried in a second field', () => {
    assert.match(REDL, /function redlineMarkerDepth\(marker\)/);
    const { win } = w();
    assert.equal(win.redlineMarkerDepth('•'), 0);
    assert.equal(win.redlineMarkerDepth('◦'), 1);
    assert.equal(win.redlineMarkerDepth('▪'), 2);
    assert.equal(win.redlineMarkerDepth('3.1'), 0,
      'a decimal sub-list carries its depth in the number — indenting it too '
      + 'would say the same thing twice');
    assert.equal(win.redlineMarkerDepth(''), 0);
  });

  test('a sub-bullet line is stamped, and a top-level one is not', () => {
    const { win } = w();
    const html = win.redlineOpsBlocksHtml(
      win.redlineOps('The passage does not touch:', win.richToText(NEST)));
    const lines = html.split('</p>').filter(x => x.includes('rl-line'));
    const sub = lines.find(l => l.includes('No worries'));
    const top = lines.find(l => l.includes('Data protection'));
    assert.match(sub, /rl-hang rl-hang-2/, 'the sub-bullet sits under its parent');
    assert.ok(!/rl-hang-2/.test(top), 'and its sibling does not');
    assert.match(sub, /rl-marker/, 'with its own glyph still in the gutter');
  });

  test('and both sheets draw the indent — one reading, both canvases', () => {
    const CSS = read('js/views/negotiation-css.js');
    assert.match(CSS, /\.redline-page \.rl-doc \.rl-hang-2/);
    assert.match(CSS, /\.redline-page \.rl-cp-src \.rl-hang-2/,
      'the clause panel renders the same builder');
    assert.match(CSS, /\.nego-redline \.rl-hang-2/, 'and so does the room');
    assert.match(CSS, /rl-hang-2\{margin-left/,
      'MARGIN, never padding: padding-left is what the hang itself uses, and '
      + 'adding to it would pull the marker out of its gutter');
  });
});

/* ============================================================
   3 — THE REST OF THE EDITING SWEEP
   ============================================================
   "review this bug and any other bug related to editing like bullets, fonts
   etc and ensure it is all working properly."
   ============================================================ */
describe('f266 (3) — every writing tool, through storage', () => {
  test('emphasis, lists, headings and tables are stored as written', () => {
    const { win } = w();
    const keep = ['<p>a <strong>b</strong> c</p>', '<p>a <em>b</em> c</p>',
      '<p>a <u>b</u> c</p>', '<p>a <s>b</s> c</p>',
      '<ul><li>one</li><li>two</li></ul>', '<ol><li>one</li><li>two</li></ol>',
      '<h4>Title</h4><p>body</p>', '<blockquote><p>x</p></blockquote>',
      '<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>', NEST];
    for (const html of keep) assert.equal(win.sanitizeRich(html), html, html.slice(0, 40));
  });

  test('the drafter’s ink, highlight and size survive, and nothing else does', () => {
    const { win } = w();
    for (const cls of ['hati-ink-blue', 'hati-hl-yellow', 'hati-fs-18'])
      assert.equal(win.sanitizeRich(`<p><span class="${cls}">x</span></p>`),
        `<p><span class="${cls}">x</span></p>`, cls);
    assert.equal(win.sanitizeRich('<p><span class="evil">x</span></p>'), '<p>x</p>');
    assert.equal(win.sanitizeRich('<p style="color:red">x</p>'), '<p>x</p>');
    /* TWO CLASSES ARE REFUSED ON PURPOSE — a span is an ink OR a size, and
       anything wanting both is two nested spans, which is what the browser
       side actually produces. */
    assert.equal(win.sanitizeRich('<p><span class="hati-ink-blue hati-fs-18">x</span></p>'), '<p>x</p>');
    assert.equal(win.sanitizeRich('<p><span class="hati-ink-blue"><span class="hati-fs-18">x</span></span></p>'),
      '<p><span class="hati-ink-blue"><span class="hati-fs-18">x</span></span></p>',
      'nested, both stand — which is what applying a colour and then a size does');
  });

  test('a browser’s own indent shapes are repaired rather than dropped', () => {
    const { win } = w();
    assert.equal(win.sanitizeRich('<ul><li>a</li><ul><li>b</li></ul></ul>'),
      '<ul><li>a<ul><li>b</li></ul></li></ul>',
      'a list nested directly in a list is legal to write and impossible to read');
    assert.equal(win.sanitizeRich('<li>orphan</li>'), '<p>orphan</p>');
  });

  /* FOUND IN THE SWEEP, beside the fault the owner reported. */
  test('a pasted list item keeps its wording on the item’s own line', () => {
    const { win } = w();
    assert.equal(win.sanitizeRich('<ul><li><p>a</p></li></ul>'), '<ul><li>a</li></ul>');
    assert.equal(win.richToText('<ul><li><p>a</p></li></ul>'), '• a',
      'not a line holding nothing but the bullet and then the wording below it');
    assert.equal(win.sanitizeRich('<ul><li><p>a</p><p>b</p></li></ul>'),
      '<ul><li>a<br>b</li></ul>',
      'a second paragraph is a second line of that item, not a run-on');
    assert.equal(win.sanitizeRich('<ul><li><p>a</p><ul><li>b</li></ul></li></ul>'),
      '<ul><li>a<ul><li>b</li></ul></li></ul>',
      'and a nested list beside it is left exactly alone');
  });
});

/* ============================================================
   4 — THE WRITING BAR IS A FIFTH BIGGER
   ============================================================ */
describe('f266 (4) — the bar reads at arm’s length', () => {
  test('the button, the size box and the separator all grew by 1.2', () => {
    assert.match(HTML, /\.rb-btn\{width:34px;height:34px/, '28 × 1.2');
    assert.match(HTML, /\.rb-size\{[^}]*height:34px/);
    assert.match(HTML, /\.rb-sep\{width:1px;height:22px/, '18 × 1.2');
    assert.match(HTML, /\.rb-pop-sw\{width:31px;height:31px/, '26 × 1.2');
  });

  test('the icons scale from ONE declaration, and keep their ratio', () => {
    assert.match(HTML, /\.rb-btn svg\{width:18px;height:auto;\}/,
      'all nine are authored 15px wide, so 18 is exactly 1.2 on every one; '
      + 'height:auto is what stops the pen — the one that is not square — '
      + 'being stretched to fit');
    const icons = RICH.match(/const RICH_BAR_ICON = \{[\s\S]*?\n\};/)[0];
    assert.equal((icons.match(/width="15"/g) || []).length,
      (icons.match(/<svg /g) || []).length,
      'and the premise holds: every icon is authored at the same width');
  });

  test('every type size stays on the product’s own ladder', () => {
    const bar = HTML.slice(HTML.indexOf('.rb-btn{'), HTML.indexOf('.hati-editor{'));
    assert.ok(!/font-size:\s*\d+(\.\d+)?px/.test(bar.replace(/font-size:var\([^)]*\)/g, '')),
      'no literal px type in the bar — a size off the ladder is what the '
      + '22 Aug sweep spent 865 replacements removing');
  });

  test('it does not follow the reader’s document size', () => {
    const bar = HTML.slice(HTML.indexOf('.rb-btn{'), HTML.indexOf('.hati-editor{'));
    assert.ok(!/--doc-scale/.test(bar),
      'the paper scales, the furniture does not — this page has learned it four times');
  });
});

/* ============================================================
   5 — A TAGGED NAME
   ============================================================ */
describe('f266 (5) — bold, coloured, and the same colour every time', () => {
  test('the rule is UNSCOPED, or the drawer draws it plain', () => {
    assert.match(HTML, /\.rl-np-at\{font-weight:var\(--w-title\);/,
      'the tag is bold wherever it is drawn');
    const CSS = read('js/views/negotiation-css.js');
    assert.ok(!/\.redline-page \.rl-np-at\{/.test(CSS),
      'it was scoped to the negotiation page, and the Chat drawer is the '
      + 'SHELL’s panel — one builder, two homes, one of them dressed');
  });

  test('four inks, and not one of them is green or red', () => {
    for (let i = 0; i < 4; i++)
      assert.ok(HTML.includes('.rl-np-at-' + i + '{color:var(--mk-ink-'),
        'ink ' + i + ' reads a token with a night answer');
    const block = HTML.slice(HTML.indexOf('.rl-np-at{'), HTML.indexOf('.rl-np-clamp{'));
    assert.ok(!/green|red|emerald|ruby/i.test(block),
      'on the paper green already means inserted and struck red means deleted, '
      + 'so a name in either would read as a mark on the contract');
    assert.ok(!/--mk-ink-grey/.test(block),
      'and grey is left out: at night it is this panel’s own secondary shade');
  });

  test('the same person is the same colour, every session and every reader', () => {
    const { win } = w();
    assert.equal(win.rlTagInk('John Wayne'), win.rlTagInk('john wayne'),
      'keyed on the visible name, folded — a rename is a new colour and that is fine');
    for (const n of ['John Wayne', 'Amina Wanjiru', 'Priya Nair', 'Grace Njeri']){
      const v = win.rlTagInk(n);
      assert.ok(Number.isInteger(v) && v >= 0 && v < 4, n + ' -> ' + v);
      assert.equal(win.rlTagInk(n), v, 'and it does not move between calls');
    }
    assert.ok(!/Math\.random|Date\.now/.test(
      NEG.match(/function rlTagInk\(name\)\{[\s\S]*?\n\}/)[0]),
      'nothing here may depend on the moment it runs');
  });

  test('the mark is drawn from the RECORD, so nothing can be dressed as a tag', () => {
    const { win } = w();
    const out = win.rlNpMarkMentions('@John Wayne lets review, at @45',
      { mentions: [{ id: 'u1', name: 'John Wayne' }] });
    assert.match(out, /<span class="rl-np-at rl-np-at-\d">@John Wayne<\/span>/);
    assert.ok(!/rl-np-at[^"]*">@45/.test(out), 'a price of @45 is left as typed');
    assert.equal(win.rlNpMarkMentions('@Nobody At All', {}), '@Nobody At All',
      'and a note that names nobody the record holds is untouched');
  });
});

/* ============================================================
   6 — THE MARK ON THE SYMBOL
   ============================================================ */
describe('f266 (6) — somebody named you, and the door says so', () => {
  test('it counts notes that name YOU, and reads without writing', () => {
    const wait = NEG.match(/function negoMentionsWaiting\(c, opts = \{\}\)\{[\s\S]*?\n\}/)[0];
    assert.ok(!/negoChanges\(/.test(wait),
      'negoChanges runs negoInit, which CREATES a negotiation on any contract '
      + 'it is asked about — a badge that started one merely by counting');
    assert.match(wait, /c\.changes/, 'so it reads the record raw');
    assert.match(wait, /negoThreadSeenAt/, 'and borrows the panel’s own seen store');
  });

  test('nobody is pinged by their own note', () => {
    const { win } = w();
    win.currentUser = () => ({ id: 'u1', name: 'Young Mbagaya' });
    const mine = { at: '2026-09-02T10:00:00Z', byId: 'u1', who: 'Young Mbagaya',
      mentions: [{ id: 'u1', name: 'Young Mbagaya' }] };
    const theirs = { at: '2026-09-02T11:00:00Z', byId: 'u2', who: 'Amina Wanjiru',
      mentions: [{ id: 'u1', name: 'Young Mbagaya' }] };
    const other = { at: '2026-09-02T12:00:00Z', byId: 'u2', who: 'Amina Wanjiru',
      mentions: [{ id: 'u3', name: 'Somebody Else' }] };
    assert.equal(win.negoMentionsWaiting({ id: 'C1', thread: [mine] }), 0);
    assert.equal(win.negoMentionsWaiting({ id: 'C1', thread: [other] }), 0,
      'and a note naming somebody else is not yours to answer');
    assert.equal(win.negoMentionsWaiting({ id: 'C1', thread: [theirs] }), 1);
    assert.equal(win.negoMentionsWaiting(
      { id: 'C1', thread: [theirs], changes: [{ id: 'CHG-001', thread: [theirs] }] }), 2,
      'a change’s own thread counts too');
  });

  test('reading Chat clears it, and the mark is hidden at zero', () => {
    assert.match(NEG, /negoMarkChatSeen\(c, opts\);/, 'after the paint, never before');
    assert.match(APP, /dot\.hidden=!n;/);
    assert.match(HTML, /id="hdr-chat-dot" hidden/, 'it starts hidden, not lit');
    assert.match(HTML, /#top-header #hdr-chat-dot\{[^}]*--st-amber-dot/,
      'amber is what this product uses for work waiting on you — a second '
      + 'colour here would be a second vocabulary for one fact');
  });
});

/* ============================================================
   7 — THE EMAIL, AGAINST A REAL SERVER
   ============================================================ */
describe('f266 (7) — the person tagged is told', () => {
  test('ONE door, both callers — a third note path joins it', () => {
    assert.match(NEG, /async function negoNotifyMentions\(c, ch, msg\)/);
    assert.equal((NEG.match(/negoNotifyMentions\(c, ch, msg\)\)/g) || []).length, 2,
      'the panel’s send and the note dialog’s');
    const fn = NEG.match(/async function negoNotifyMentions\([\s\S]*?\n\}/)[0];
    assert.ok(!/email|address/i.test(fn.replace(/\/\*[\s\S]*?\*\//g, '')),
      'it sends KEYS, never addresses');
  });

  test('the route refuses a body-supplied address outright', async (t) => {
    const h = await startHati();
    t.after(() => h.stop());
    const s2 = await seedWorkspace(h);
    const bad = await s2.admin.raw('/api/contracts/MK-A2/mention', { method: 'POST',
      body: { people: [{ name: 'X' }], email: 'attacker@example.com' } });
    assert.equal(bad.status, 400, 'an open relay wearing this workspace’s name');
    assert.match(String(bad.json.error), /ids, not email addresses/i);
  });

  test('it names a colleague by id, resolves the address here, and reports honestly',
    async (t) => {
      const h = await startHati();
      t.after(() => h.stop());
      const s2 = await seedWorkspace(h);
      const who = s2.users.unrestricted;
      const out = await s2.admin.json('/api/contracts/MK-A2/mention', { method: 'POST',
        body: { people: [{ id: who.id, name: who.name }], changeId: 'CHG-001',
          note: 'lets review this tomorrow' } });
      assert.equal(out.told.length, 1, JSON.stringify(out));
      assert.equal(out.told[0].to, 'everything@example.co.ke',
        'read off the users table, never from the body');
      /* With no provider the message queues where an admin can read it, which
         is what this product promises — that is delivery, not a failure. */
      assert.equal(out.told[0].outbox, true);
    });

  test('a colleague who could not open it is named rather than written to',
    async (t) => {
      const h = await startHati();
      t.after(() => h.stop());
      const s2 = await seedWorkspace(h);
      /* `restricted` can see FOLDER_A only; MK-B2 is in the other stream, so a
         mail about it asks them to go and find a document that does not exist
         for them — the review-request route’s own reasoning. */
      const who = s2.users.restricted;
      const out = await s2.admin.json('/api/contracts/MK-B2/mention', { method: 'POST',
        body: { people: [{ id: who.id, name: who.name }] } });
      assert.equal(out.told.length, 0, JSON.stringify(out));
      assert.deepEqual(out.skipped.map(x => x.why), ['no-access']);
    });

  test('nothing is sent about your own note, and an unknown name is reported',
    async (t) => {
      const h = await startHati();
      t.after(() => h.stop());
      const s2 = await seedWorkspace(h);
      const boot = await s2.admin.json('/api/bootstrap');
      const me = (boot.users || []).find(u => u && u.email === 'admin@example.co.ke');
      assert.ok(me && me.id, 'the signed-in admin is on their own roster');
      const out = await s2.admin.json('/api/contracts/MK-A2/mention', { method: 'POST',
        body: { people: [{ id: me.id, name: me.name },
          { id: 'nobody', name: 'Nobody At All' }] } });
      assert.equal(out.told.length, 0, JSON.stringify(out));
      assert.deepEqual(out.skipped.map(x => x.why), ['unknown'],
        'named and reported rather than dropped');
    });
});

/* ============================================================
   8 — BOTH LANGUAGES
   ============================================================ */
describe('f266 (8) — every new sentence is written twice', () => {
  test('the mail, the toast clause and the door’s own tooltip', () => {
    const { STRINGS } = require('../js/i18n.js');
    const keys = ['mail_at_subject', 'mail_at_line', 'mail_at_open',
      'ng_at_told_one', 'ng_at_told_other', 'ng_at_some',
      'ng_at_none_one', 'ng_at_none_other',
      'ng_chat_at_n_one', 'ng_chat_at_n_other'];
    for (const k of keys){
      assert.ok(STRINGS.en[k], 'en ' + k);
      assert.ok(STRINGS.sv[k], 'sv ' + k);
      assert.notEqual(STRINGS.en[k], STRINGS.sv[k], k + ' is really translated');
    }
  });

  test('and the mention route reads its wording through the dictionary', () => {
    const route = SRV.slice(SRV.indexOf("app.post('/api/contracts/:id/mention'"));
    const body = route.slice(0, route.indexOf('\n});'));
    assert.match(body, /tFor\(L, 'mail_at_subject'/);
    assert.match(body, /langForEmail\(to\)/,
      'each reader gets their own language, like every other mail here');
  });
});
