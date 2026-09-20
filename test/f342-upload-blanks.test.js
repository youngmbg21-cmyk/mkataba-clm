/* f342 — THE BLANKS IN A DOCUMENT SOMEBODY SENT US
   ============================================================
   Young, 20 September 2026: *"build it"* — item 9 of the seven-off-four
   order, whose own sentence was: make uploaded contracts' blanks fillable too.

   MEASURED BEFORE A LINE MOVED. `contractHasBlanks` refused every upload by
   name, so a received document carrying `[Insert Company Name]` three times
   and two ruled lines answered `[]`: no panel, no count, and the arrival tile
   reporting "nothing to fill" on the one kind of contract whose blanks nobody
   in this workspace wrote.

   FOUR THINGS THIS FILE PINS, and each of them is a refusal:
     · the wording is never rewritten — an upload is the other side's paper
     · the marks are PAINTED on the canvas, never built into docBody, so
       nothing reaches the payload, an export, their seat or the phone
     · nothing is guessed — `kind:'upload'` is what keeps these blanks out of
       fillBlanksFromRecord, because we do not know whose side a placeholder
       in a document we did not draft is naming
     · it stops the moment the wording becomes ours (uploadWordingEdited)

   WHAT IS MEASURED IN A BROWSER INSTEAD (upload-blanks-verify): that the
   panel really draws beside the received paper, that the marks land on the
   wording and nowhere else, that typing in the panel changes the word on the
   page, and that the contract does not move a pixel. jsdom resolves no
   layout, so no claim here could tell a drawn mark from an undrawn one.

   58 claims, 56 of them red against the commit before this work. The two that
   pass are named CONTROLS: a rule that was already there and has to survive.

   Run: node --test test/f342-upload-blanks.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

/* A MISSING FILE IS A FAILED CLAIM, NEVER A CRASH AT LOAD — run against the
   commit before this work js/uploadblanks.js does not exist, and a top-level
   readFileSync would take the whole file down with one line of stack, which
   tells nobody WHICH claims are new. */
const read = f => { try{ return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); }
  catch(_){ return ''; } };
/* THE SWEEPS READ CODE, NOT PROSE: every file below explains in its own
   comments the doors it must never use. */
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const UB = read('js/uploadblanks.js');
const UB_CODE = strip(UB);
const BLANKS_CODE = strip(read('js/blanks.js'));
const CONTRACT = read('js/views/contract.js');
const CONTRACT_CODE = strip(CONTRACT);
const APP = read('js/app.js');
const WORLD = read('test/world.js');
const I18N = read('js/i18n.js');
const INDEX = read('index.html');

/* A function's own body, matched BY NAME and never by parameter list — the
   f255 lesson, paid again by f178 the same week. */
const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++; else if (ch === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
};

/* ---- THE PAPER, AS A REAL RECEIVED DOCUMENT CARRIES IT ----
   Headings, a repeated named placeholder, a brace placeholder, two ruled
   lines and four things that are NOT blanks: a list marker, a single letter,
   a roman numeral and a snake_case word. A stand-in tidier than real paper
   would turn every claim below into a description. */
const WORDING = [
  '<h1>SUPPLY AGREEMENT</h1>',
  '<h4>1. Parties</h4>',
  '<p>This Agreement is made between [Insert Company Name] of [Registered Address]',
  ' and the Supplier. [Insert Company Name] shall appoint a contact.</p>',
  '<h4>2. Term</h4>',
  '<p>Commencing on {{effective_date}} and running for [1] year.',
  ' Delivery address: ________</p>',
  '<p>Reference the schedule_name in clause [a], sub-paragraph [iv] and annex [12].</p>',
  '<p>Authorised signatory: ________</p>',
].join('');

function stage(over, opts){
  const { win } = buildWorld(Object.assign({ blanks: true, templates: true }, opts || {}));
  const c = Object.assign({
    id: 'MK-700', name: 'Supply Agreement', status: 'Under Review', source: 'upload',
    format: 'rich', redlineText: WORDING, fields: {}, audit: [], metadata: {},
    upload: { fileName: 'supply.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  }, over || {});
  win.state = win.state || { contracts: [], settings: {} };
  win.state.contracts = [c];
  win.state.activeId = c.id;
  return { win, c };
}
const keysOf = list => list.map(b => b.key);
/* EVERY CLAIM THAT AN EMPTY READING WOULD SATISFY IS GATED. Run against the
   commit before this work an upload answers `[]`, and "no uploaded blank was
   filled from the record" is then true of nothing — a green tally is not a
   net. Ten claims below would have passed that way; this is what makes them
   bite. The three that are genuinely CONTROLS (a rule that must not change)
   say so in their own name. */
const gate = (win, c, why) => {
  const bs = win.contractBlanks(c);
  assert.ok(bs.length >= 3, 'STAGE: the upload was read as ' + bs.length + ' blanks — ' + (why || ''));
  return bs;
};
const haveFile = () => assert.ok(UB.length > 500, 'STAGE: js/uploadblanks.js is missing');

describe('f342 (1) the reading — what an uploaded document asks', () => {
  test('1a the named placeholders are read off the wording', () => {
    const { win, c } = stage();
    const ks = keysOf(win.contractBlanks(c));
    assert.ok(ks.includes('up_insert_company_name'), 'the commonest shape: ' + ks.join(','));
    assert.ok(ks.includes('up_registered_address'), ks.join(','));
    assert.ok(ks.includes('up_effective_date'), 'a {{brace}} placeholder: ' + ks.join(','));
  });
  test('1b a name said twice is ONE question with one answer', () => {
    const { win, c } = stage();
    const ks = keysOf(win.contractBlanks(c));
    assert.equal(ks.filter(k => k === 'up_insert_company_name').length, 1,
      'a placeholder repeated through a draft is one box: ' + ks.join(','));
    /* And every occurrence still carries the key, so the paper answers both
       of them the moment the box is typed in. */
    const seq = win.uploadBlankSeq(c).map(x => x.key);
    assert.equal(seq.filter(k => k === 'up_insert_company_name').length, 2, seq.join(','));
  });
  test('1c a ruled line is named after the words in front of it', () => {
    const { win, c } = stage();
    const ks = keysOf(win.contractBlanks(c));
    assert.ok(ks.includes('up_b_delivery_address'), ks.join(','));
    assert.ok(ks.includes('up_b_authorised_signatory'), ks.join(','));
  });
  test('1d and the lead stops at the sentence, not at the paragraph', () => {
    const { win, c } = stage();
    const b = win.contractBlanks(c).find(x => x.key === 'up_b_delivery_address');
    assert.ok(b, 'not found');
    assert.equal(b.label, 'Delivery address',
      '"…running for one year. Delivery address: ____" asks for an address, not a year');
  });
  test('1e A LIST MARKER IS NOT A BLANK — [1], [a], [iv], [12] are refused', () => {
    const { win, c } = stage();
    const ks = keysOf(gate(win, c, 'nothing was read, so nothing could be refused'));
    for(const bad of ['up_1', 'up_a', 'up_iv', 'up_12'])
      assert.ok(!ks.includes(bad), bad + ' was read as a blank: ' + ks.join(','));
  });
  test('1f snake_case is a word, not a ruled line', () => {
    const { win } = stage();
    assert.equal(win.upHits('the schedule_name in clause').length, 0);
    assert.equal(win.upHits('see file_name___ok').length, 0, 'flanked by word characters');
    assert.equal(win.upHits('sign here ________ please').length, 1, 'and a real rule still reads');
  });
  test('1g two underscores are not a rule; three are', () => {
    const { win } = stage();
    assert.equal(win.upHits('a __ b').length, 0);
    assert.equal(win.upHits('a ___ b').length, 1);
  });
  test('1h a bracket with no letter in it names nothing', () => {
    const { win } = stage();
    assert.equal(win.upHits('[ ] and [--] and [•]').length, 0);
  });
  test('1i a bracket longer than sixty characters is a drafting note', () => {
    const { win } = stage();
    assert.equal(win.upHits('[' + 'x'.repeat(61) + ']').length, 0);
    assert.equal(win.upHits('[' + 'x'.repeat(59) + ']').length, 1);
  });
  test('1j a match may never carry markup — the walk stays inside one text run', () => {
    const { win } = stage();
    assert.equal(win.upHits('[Insert <b>Name</b>]').length, 0, 'crossed an element boundary');
    assert.equal(win.upHits('[Insert\nName]').length, 0, 'crossed a line');
  });
  test('1k a label is the placeholder\'s own words, in sentence case', () => {
    const { win } = stage();
    assert.equal(win.upLabel('DATE'), 'Date', 'ALL CAPS reads as shouting in a form');
    assert.equal(win.upLabel('effective_date'), 'Effective date', 'a typed key is not a phrase');
    assert.equal(win.upLabel('Insert Company Name'), 'Insert Company Name', 'the drafter\'s own caps are kept');
  });
  test('1l a blank knows which clause it sits in', () => {
    const { win, c } = stage();
    const b = win.contractBlanks(c).find(x => x.key === 'up_effective_date');
    assert.equal(b.section, '2. Term');
  });
  test('1m every blank carries the placeholder AS THE DOCUMENT PRINTS IT', () => {
    const { win, c } = stage();
    const b = win.contractBlanks(c).find(x => x.key === 'up_insert_company_name');
    assert.equal(b.ph, '[Insert Company Name]');
  });
  test('1n a .docx read as flat text is read too', () => {
    const { win, c } = stage({ redlineText: '', format: 'text',
      upload: { fileName: 'flat.docx', mime: 'application/msword',
        extractedText: 'Made between [Buyer Name] and the Seller.\nDelivered to: ______' } });
    const ks = keysOf(win.contractBlanks(c));
    /* joined rather than deepEqual: an array built inside the stage's own realm
       has a different Array prototype and deepStrictEqual refuses it. */
    assert.equal(ks.join(','), 'up_buyer_name,up_b_delivered_to');
  });
});

describe('f342 (2) the gates — when an upload\'s blanks may be filled', () => {
  test('2a an ordinary received document answers yes', () => {
    const { win, c } = stage();
    assert.equal(win.uploadBlanksLive(c), true);
    assert.equal(win.contractHasBlanks(c), true);
  });
  test('2b a contract that is not an upload answers no', () => {
    const { win, c } = stage({ source: 'template' });
    assert.equal(win.uploadBlanksLive(c), false);
  });
  test('2c ONCE ANYBODY HAS EDITED THE WORDING IT IS OURS, and this stands down', () => {
    for(const over of [{ changes: [{ id: 'CHG-1' }] }, { versions: [{ v: 1 }] }]){
      const { win, c } = stage(over);
      assert.equal(win.uploadBlanksLive(c), false, JSON.stringify(over));
      assert.equal(win.contractBlanks(c).length, 0, JSON.stringify(over));
    }
  });
  test('2d a sealed record takes no working note', () => {
    const { win, c } = stage({ status: 'Signed' });
    assert.equal(win.uploadBlanksLive(c), false);
  });
  test('2e never on the counterparty\'s page', () => {
    const { win, c } = stage();
    win.PORTAL_MODE = true;
    assert.equal(win.uploadBlanksLive(c), false);
  });
  test('2f a Viewer reads and types nothing', () => {
    const { win, c } = stage();
    win.canEdit = () => false;
    assert.equal(win.uploadBlanksLive(c), false);
  });
  test('2g THE WALL: docFillable and uploadBlanksLive can never both be true', () => {
    /* It is what makes the panel\'s `||` one door rather than two: docFillable
       refuses every upload BY NAME and this refuses everything that is not
       one, so no contract can satisfy both. Read off the source because
       docFillable lives in a view file. */
    const df = fnBody(CONTRACT_CODE, 'docFillable');
    assert.ok(df, 'docFillable not found');
    assert.ok(/isUpload\(c\)/.test(df), 'docFillable must still refuse an upload by name');
    const ub = fnBody(UB_CODE, 'uploadBlanksLive');
    assert.ok(ub, 'uploadBlanksLive not found');
    assert.ok(/isUpload\(c\)\)\)\s*return false/.test(ub.replace(/\s+/g, ' ').replace(/ /g, ''))
      || /!\(typeofisUpload==='function'&&isUpload\(c\)\)\)returnfalse/.test(ub.replace(/\s+/g, '')),
      'uploadBlanksLive must refuse everything that is not an upload');
  });
  test('2h an upload with NO placeholders is "nothing to fill", not "upload"', () => {
    const { win, c } = stage({ redlineText: '<p>Plain wording with no blanks at all in it.</p>' });
    assert.equal(win.contractBlanks(c).length, 0);
    assert.equal(win.contractBlanksNone(c), 'none');
  });
  test('2i an upload with placeholders still open answers null — there IS something to fill', () => {
    const { win, c } = stage();
    assert.equal(win.contractBlanksNone(c), null);
  });
  /* A CONTROL: this is the answer every upload gave before item 9 and it has
     to survive for the ones this reading still cannot reach. Green both sides. */
  test('2j CONTROL — an upload this reading cannot reach keeps the old "upload" answer', () => {
    const { win, c } = stage({ status: 'Signed' });
    assert.equal(win.contractBlanksNone(c), 'upload');
  });
});

describe('f342 (3) nothing is guessed, and nothing is rewritten', () => {
  test('3a the blanks carry kind:"upload"', () => {
    const { win, c } = stage();
    for(const b of gate(win, c)) assert.equal(b.kind, 'upload', b.key);
  });
  test('3b THE RECORD NEVER ANSWERS SOMEBODY ELSE\'S PLACEHOLDER', () => {
    const { win, c } = stage();
    gate(win, c, 'nothing was read, so nothing could be wrongly filled');
    const before = JSON.stringify(c.fields);
    const r = win.fillBlanksFromRecord(c, { hold: true });
    assert.equal(r.filled.length, 0, 'a reading filled an uploaded blank: ' + JSON.stringify(r.filled));
    assert.equal(JSON.stringify(c.fields), before, 'the record moved');
  });
  /* A CONTROL: the line was already there and its job is now a second one. */
  test('3c CONTROL — and the filter that does it is the kind, read off the source', () => {
    const fb = fnBody(BLANKS_CODE, 'fillBlanksFromRecord');
    assert.ok(fb, 'not found');
    assert.ok(/kind\s*===\s*'field'/.test(fb), 'the one line that keeps uploads out');
  });
  test('3d THE WORDING IS BYTE-IDENTICAL after a read, a seq and a fill', () => {
    const { win, c } = stage();
    const was = c.redlineText, wasUp = JSON.stringify(c.upload);
    win.contractBlanks(c); win.uploadBlankSeq(c); win.uploadBlanksOver(c);
    win.contractBlankSet(c, 'up_insert_company_name', 'Highland Corporate Ltd', { hold: true });
    win.contractBlanks(c);
    assert.equal(c.redlineText, was, 'the received document was rewritten');
    assert.equal(JSON.stringify(c.upload), wasUp, 'the upload record moved');
  });
  test('3e READING MUST NOT WRITE — no negotiation is created by looking', () => {
    const { win, c } = stage();
    win.contractBlanks(c); win.uploadBlanksOver(c); win.contractBlanksNone(c);
    assert.equal(c.negotiation, undefined, 'a reading initialised a negotiation');
    assert.equal(c.changes, undefined);
  });
  test('3f NO ROUTE, NO STORE, NO MODEL — the file never calls one', () => {
    haveFile();
    for(const bad of [/\bapi\s*\(/, /\bfetch\s*\(/, /\bpersist\s*\(/, /localStorage/, /copilot/i, /anthropic/i])
      assert.ok(!bad.test(UB_CODE), 'js/uploadblanks.js reaches for ' + bad);
  });
  test('3g and it never files a change', () => {
    haveFile();
    for(const bad of ['negoFileChange', 'negoEditClause', 'negoInsertClause', 'changes.push'])
      assert.ok(!UB_CODE.includes(bad), 'js/uploadblanks.js calls ' + bad);
  });
  test('3h the answer goes through contractBlankSet, the ONE writer', () => {
    const { win, c } = stage();
    gate(win, c);
    assert.equal(win.contractBlankSet(c, 'up_registered_address', '4 Highland Way'), true);
    assert.equal(c.fields.up_registered_address, '4 Highland Way');
    const open = keysOf(win.contractBlanksOpen(c));
    assert.ok(!open.includes('up_registered_address'), 'still counted as open: ' + open.join(','));
  });
  test('3i an up_ key can never be the record\'s own two fields', () => {
    const { win, c } = stage();
    assert.equal(win.contractBlankSet(c, 'counterparty', 'Acme'), false);
    assert.equal(win.contractBlankSet(c, 'value', '900000'), false);
    assert.ok(keysOf(gate(win, c)).every(k => k.startsWith('up_')), 'its own namespace');
  });
});

describe('f342 (4) the marks are painted, so nothing travels', () => {
  /* HALF OF THIS IS A CONTROL — docBody carried no mark before and must carry
     none after — and the `data-upwording` half is what makes it bite, by
     proving the feature is wired into this builder rather than absent from
     it. Without that half the claim would be green against a product that
     never had the feature at all. */
  test('4a docBody builds NO placeholder mark; it only NAMES the wording', () => {
    const ud = fnBody(CONTRACT_CODE, 'uploadDocBody');
    assert.ok(ud, 'uploadDocBody not found');
    assert.ok(!/uploadBlanksPaint|up-blank|data-upblank=/.test(ud),
      'a mark built into docBody TRAVELS — to their page, the PDF and the phone');
    assert.ok(/data-upwording/.test(ud), 'and the wording is named, so the painter has a scope');
  });
  test('4b it is painted on wireDocCanvas, beside the other two marks', () => {
    const w = fnBody(CONTRACT_CODE, 'wireDocCanvas');
    assert.ok(w, 'wireDocCanvas not found');
    assert.ok(/uploadBlanksPaint\(c\)/.test(w), 'not on the funnel: ' + w);
    assert.ok(/signSpotsPaint/.test(w) && /docReadPaint/.test(w), 'the precedent it rides with');
  });
  test('4c uploadDocBody NAMES the wording, so the walk stays off the signature foot', () => {
    const ud = fnBody(CONTRACT_CODE, 'uploadDocBody');
    assert.equal((ud.match(/data-upwording/g) || []).length, 2,
      'both wording containers — the stored body and the flat .docx text');
  });
  test('4d and the painter is scoped to it', () => {
    const p = fnBody(UB_CODE, 'uploadBlanksPaint');
    assert.ok(p, 'not found');
    assert.ok(/\[data-upwording\]/.test(p), 'unscoped: it would mark the signature foot');
    assert.ok(/if\(!host\) return 0/.test(p.replace(/\s+/g, ' ')), 'no container, no marks');
  });
  test('4e A WALK THAT DISAGREES WITH THE READ DRAWS NOTHING', () => {
    const p = fnBody(UB_CODE, 'uploadBlanksPaint');
    assert.ok(/found\.length !== seq\.length/.test(p), 'the count wall is missing');
    assert.ok(/\.raw !== seq\[i\]\.raw/.test(p), 'the byte wall is missing');
  });
  test('4f the painter never mints a key of its own', () => {
    const p = fnBody(UB_CODE, 'uploadBlanksPaint');
    assert.ok(!/upKeyMint/.test(p), 'two minters is two key spaces');
    assert.ok(/uploadBlankSeq\(c\)/.test(p), 'the keys come from the read');
  });
  test('4g the span is written with textContent, never innerHTML', () => {
    const p = fnBody(UB_CODE, 'uploadBlanksPaint');
    assert.ok(/sp\.textContent\s*=/.test(p));
    assert.ok(!/innerHTML/.test(p), 'the other side\'s words must not become markup');
  });
  test('4h clearing puts the PLACEHOLDER back, never the answer', () => {
    const cl = fnBody(UB_CODE, 'uploadBlanksClear');
    assert.ok(cl, 'not found');
    assert.ok(/data-upraw/.test(cl),
      'unwrapping a filled span would write our working note into their paper');
  });
});

describe('f342 (5) the panel', () => {
  test('5a it draws for an upload as well as a drafted contract', () => {
    const r = fnBody(CONTRACT_CODE, 'renderBlankFormSection');
    assert.ok(r, 'not found');
    assert.ok(/docFillable\(c\)\s*\|\|\s*up/.test(r.replace(/\s+/g, ' ')), 'the gate did not widen');
    assert.ok(/uploadBlanksLive\(c\)/.test(r), 'and it asks the one reading');
  });
  test('5b the heading says which kind of blank these are', () => {
    const r = fnBody(CONTRACT_CODE, 'renderBlankFormSection');
    assert.ok(/bf_title_upload/.test(r), 'an upload is not "Contract form"');
    assert.ok(/bf_upload_note/.test(r), 'the one fact about the machinery');
  });
  test('5c and the note is a HOVER, never a band on the page', () => {
    const r = fnBody(CONTRACT_CODE, 'renderBlankFormSection');
    assert.ok(/title="\$\{up\?esc\(i18t\('bf_upload_note'\)\)/.test(r.replace(/\s+/g, '')),
      'bf_upload_note must ride a title= attribute');
  });
  test('5d a ruled line with nothing in front of it is numbered, never unlabelled', () => {
    const { win, c } = stage({ redlineText: '<p>________</p>' });
    const b = win.contractBlanks(c)[0];
    assert.ok(b, 'no blank read');
    assert.equal(b.label, '', 'no words in front of it means no name');
    const r = fnBody(CONTRACT_CODE, 'renderBlankFormSection');
    assert.ok(/bf_blank_n/.test(r), 'the panel must number it');
  });
  test('5e typing in the panel answers the word on the paper', () => {
    const w = fnBody(CONTRACT_CODE, 'wireBlankForm');
    assert.ok(w, 'not found');
    assert.ok(/uploadBlankPaint\(key, el\.value\)/.test(w), 'the paper is never put in step');
    assert.ok(!/renderBlankFormSection|paintContractForm/.test(w),
      'no repaint: the box is under the reader\'s hand');
  });
  test('5f and every occurrence of a named placeholder is answered', () => {
    const p = fnBody(UB_CODE, 'uploadBlankPaint');
    assert.ok(p, 'not found');
    assert.ok(/querySelectorAll/.test(p), 'querySelector would answer only the first');
  });
  test('5g a cursor in the panel lights the word on the paper', () => {
    const p = fnBody(CONTRACT_CODE, 'contractFieldPeer');
    assert.ok(p, 'not found');
    assert.ok(/data-upblank=/.test(p), 'the fifth shape is not on the paper selector');
  });
  test('5h the count is contractBlanksOpen\'s own arithmetic, asked again', () => {
    const { win, c } = stage();
    const all = win.contractBlanks(c).length;
    assert.equal(win.contractBlanksOpen(c).length, all, 'nothing is answered yet');
    win.contractBlankSet(c, 'up_effective_date', '2026-10-01', { hold: true });
    assert.equal(win.contractBlanksOpen(c).length, all - 1);
  });
});

describe('f342 (6) bounds, and the file itself', () => {
  test('6a the cap is on QUESTIONS, not on occurrences', () => {
    const { win } = stage();
    /* One name said far more times than the cap is still one box. */
    const { win: w2, c } = stage({ redlineText: '<p>' + '[Buyer Name] '.repeat(win.UP_BLANK_MAX + 20) + '</p>' });
    assert.equal(w2.contractBlanks(c).length, 1);
    assert.equal(w2.uploadBlanksOver(c), 0, 'nothing was left out');
  });
  test('6b and what it leaves out is counted, never silently trimmed', () => {
    const { win } = stage();
    const many = Array.from({ length: win.UP_BLANK_MAX + 5 }, (_, i) => `<p>[Field ${i}]</p>`).join('');
    const { win: w2, c } = stage({ redlineText: many });
    assert.equal(w2.contractBlanks(c).length, win.UP_BLANK_MAX);
    assert.equal(w2.uploadBlanksOver(c), 5);
  });
  test('6c every window read is a published name (f232 in this file\'s costume)', () => {
    const published = new Set();
    const m = /Object\.assign\(window, \{([\s\S]*?)\}\);/.exec(UB);
    assert.ok(m, 'no publication list');
    for(const n of m[1].split(',')) { const k = n.trim(); if(k) published.add(k); }
    for(const r of UB_CODE.matchAll(/window\.([A-Za-z_$][\w$]*)/g))
      assert.ok(published.has(r[1]), 'window.' + r[1] + ' is read but not published');
    for(const n of ['uploadBlanksLive', 'uploadBlanksRead', 'uploadBlanksPaint', 'uploadBlankPaint', 'uploadBlankSeq', 'uploadBlanksClear'])
      assert.ok(published.has(n), n + ' is not published');
  });
  test('6d and the names the views read through window are published here', () => {
    for(const n of ['uploadBlanksPaint', 'uploadBlankPaint'])
      assert.ok(new RegExp('window\\.' + n).test(CONTRACT_CODE), 'the view must read ' + n + ' through window');
    assert.ok(UB.includes('uploadBlanksLive,'), 'uploadBlanksLive published');
  });
  test('6e the file is registered where every stage builds its script list', () => {
    assert.ok(/uploadblanks\.js/.test(APP), 'not on js/app.js');
    assert.ok(/uploadblanks\.js/.test(WORLD), 'not on test/world.js');
    assert.ok(/UPLOAD_BLANKS/.test(WORLD), 'not on the blanks option');
  });
  test('6f it loads AFTER js/blanks.js, because that file asks it', () => {
    assert.ok(APP.indexOf("blanks.js';") < APP.indexOf('uploadblanks.js'), 'js/app.js order');
    const b = fnBody(BLANKS_CODE, 'contractHasBlanks');
    assert.ok(/uploadBlanksLive/.test(b), 'contractHasBlanks must ask the one gate');
  });
  test('6g the three new keys are in BOTH books', () => {
    for(const k of ['bf_title_upload', 'bf_upload_note', 'bf_blank_n'])
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2,
        k + ' is not in both books');
  });
  test('6h the mark costs the contract no layout', () => {
    const m = /#doc-canvas span\.up-blank\{([\s\S]*?)\}/.exec(INDEX);
    assert.ok(m, '.up-blank has no rule');
    for(const bad of ['padding', 'margin', 'border:', 'font-size', 'font-weight', 'display'])
      assert.ok(!m[1].includes(bad), '.up-blank states ' + bad + ' — it would move their wording');
  });
  test('6i two states, and neither is the redline\'s own grammar', () => {
    const m = /#doc-canvas span\.up-blank\{([\s\S]*?)\}[\s\S]*?#doc-canvas span\.up-blank\.is-filled\{([\s\S]*?)\}/.exec(INDEX);
    assert.ok(m, 'no filled state');
    assert.ok(/--st-amber/.test(m[1]), 'unanswered is amber');
    assert.ok(!/--st-green|--st-ruby/.test(m[1] + m[2]), 'green and red are the redline\'s');
  });
});
