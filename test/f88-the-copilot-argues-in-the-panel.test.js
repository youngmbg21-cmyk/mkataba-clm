/* F88 — the rewrite moved into the side panel, and four things had to hold.

   The floating proposal popover is gone. In its place a rewrite is a
   conversation in the Copilot panel: the reasoning as one bubble, the wording
   as a proposal card with Apply Redline, Decline and Edit on it, and the
   panel's own input underneath so the next sentence carries the exchange
   forward instead of restarting it.

   Four consequences are pinned here, because each of them can fail silently:

     · THE ANSWER HAS A SHAPE. The model is asked for one JSON object with the
       reasoning and the wording as separate fields, and the parse has to
       survive a fence, prose either side of it, and a model that ignores the
       instruction entirely — because "the Copilot returned nothing usable" over
       a perfectly good answer is the worst of the three failures.

     · TYPOGRAPHY SURVIVES. A model handed a numbered sub-clause returns prose.
       It is not wrong about the words; it has no reason to know that (a), (b)
       and (c) on three lines is how a variation cites sub-paragraph (b). A
       flattened list is a different document.

     · AN OFFSET CAN GO STALE. A popover was open for milliseconds; a panel is
       open for as long as the conversation lasts, and in that time the clause
       can move under the offset the proposal was resolved against. Splicing at
       a drifted offset does not fail loudly — it files a redline that cuts a
       clause mid-sentence.

     · A DRAFT CAN BE TAKEN BACK, and only where taking it back is honest. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const R = require('../js/redline.js');
const D = require('../js/docx.js');

/* ai.js is a browser module that wires the panel's buttons at load, so it needs
   a stage. Only the pure halves are exercised here — the parse, the typography
   repair — which is all a node test can honestly assert about a chat panel. */
function loadAi(){
  const el = () => ({ addEventListener(){}, querySelectorAll(){ return []; },
    querySelector(){ return null; }, innerHTML: '', value: '', style: {},
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    focus(){}, setSelectionRange(){}, getBoundingClientRect(){ return { width: 430 }; } });
  const sandbox = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp,
    Set, Map, Error, isNaN, parseInt, parseFloat, setTimeout, Promise,
    document: { getElementById: () => el(), querySelector: () => null,
      querySelectorAll: () => [], addEventListener(){}, createElement: () => el(),
      body: { classList: { toggle(){} } } },
    state: { contracts: [], view: '' }, icon: () => '', esc: s => String(s),
    toast(){}, lsGet(){ return null; }, lsSet(){}, getContract(){ return null; },
    currentUser(){ return { name: 'You' }; }, API_MODE(){ return false; },
    innerWidth: 1400, addEventListener(){},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8'),
    sandbox, { filename: 'ai.js' });
  return sandbox;
}
/* discuss.js and redline.js on one window, the way the browser gives them to
   each other — the Discard button's rule lives in one and its engine in the
   other, and the point of the split is that neither can act alone. */
function loadDiscuss(){
  const win = {};
  const ctx = vm.createContext({ window: win, JSON, Math, console, Int32Array, Uint32Array, document: null });
  for (const f of ['redline.js', 'discuss.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
  return win;
}

/* ============================================================ */
describe('F88a — the model is asked for a shape, and the parse survives missing it', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  test('the format asked for names both fields', () => {
    assert.match(ai.AI_PROPOSAL_FORMAT, /"advice"/);
    assert.match(ai.AI_PROPOSAL_FORMAT, /"proposedText"/);
  });

  test('a clean object gives two separate things to render', () => {
    const p = ai.aiParseProposal('{"advice":"Narrows the indemnity to direct loss.","proposedText":"The Supplier shall indemnify the Customer against direct loss only."}');
    assert.equal(p.strict, true);
    assert.equal(p.advice, 'Narrows the indemnity to direct loss.');
    assert.match(p.proposedText, /direct loss only/);
    assert.ok(!p.proposedText.includes('Narrows'),
      'the reasoning must never reach the wording — that is the string spliced into a contract');
  });

  test('a fenced object is still an object', () => {
    const p = ai.aiParseProposal('```json\n{"advice":"a","proposedText":"b"}\n```');
    assert.equal(p.strict, true);
    assert.equal(p.proposedText, 'b');
  });

  test('prose either side of it does not lose the answer', () => {
    const p = ai.aiParseProposal('Certainly. {"advice":"a","proposedText":"b"} Let me know if that helps.');
    assert.equal(p.strict, true);
    assert.equal(p.proposedText, 'b');
  });

  test('a model that ignores the instruction still gets its wording used, and is marked', () => {
    const p = ai.aiParseProposal('"Payment shall be made within sixty (60) days."');
    assert.equal(p.strict, false, 'the card says so rather than pretending the parse was clean');
    assert.equal(p.proposedText, 'Payment shall be made within sixty (60) days.',
      'and the surrounding quotation marks are not proposed into the contract');
  });

  test('an empty answer is nothing, not an empty proposal', () => {
    assert.equal(ai.aiParseProposal(''), null);
    assert.equal(ai.aiParseProposal('   '), null);
  });
});

describe('F88a2 — a remark is never filed as wording', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  /* The worst failure this flow has available, because it is the quiet one: a
     model answers conversationally, the reply is treated as the replacement
     string, and an apology is spliced into a clause under an Apply Redline
     button. It looks like wording, nothing errors, and it survives to a
     signature. */
  const refusals = [
    "I'm sorry, I can't help rewrite that clause without the definitions schedule.",
    'I cannot provide legal advice on enforceability under Kenyan law.',
    'As an AI, I am not able to advise on the indemnity cap.',
    "Sure! Here's a rewrite you might consider.",
    'Note: this is not legal advice and you should consult a qualified advocate.',
    'I would recommend seeking counsel before changing this limb.',
  ];
  for (const r of refusals){
    test(`"${r.slice(0, 34)}…" is advice, not a proposal`, () => {
      const p = ai.aiParseProposal(r);
      assert.equal(p.proposedText, '', 'nothing to put an Apply Redline button on');
      assert.ok(p.advice.includes(r.slice(0, 20)), 'and the reader still gets to read it');
    });
  }

  test('a disclaimer in FRONT of good wording is moved to the advice, not filed', () => {
    const p = ai.aiParseProposal(JSON.stringify({ advice: 'Narrows it.',
      proposedText: 'Please note this is not legal advice. The Supplier shall pay within sixty (60) days.' }));
    assert.equal(p.proposedText, 'The Supplier shall pay within sixty (60) days.',
      'the clause is what gets spliced');
    assert.match(p.advice, /Narrows it\./);
    assert.match(p.advice, /not legal advice/, 'and the caveat is still said, in the bubble');
  });

  test('real wording that merely contains a cautious word is left alone', () => {
    /* The patterns are anchored for this reason: a contract genuinely can say
       "cannot" or "sorry", and stripping real wording is the same harm in the
       other direction. */
    const clause = 'The Supplier cannot assign this Agreement without prior written consent, '
      + 'and no delay in enforcement shall be treated as a waiver.';
    const p = ai.aiParseProposal(clause);
    assert.equal(p.proposedText, clause);
    assert.equal(p.advice, '');
    assert.equal(ai.aiLooksConversational(clause), false);
  });

  test('a proposal with nothing but a remark in it yields no proposal at all', () => {
    const p = ai.aiParseProposal(JSON.stringify({ advice: '', proposedText: "I'm afraid I can't." }));
    assert.equal(p.proposedText, '');
    assert.match(p.advice, /can(?:'|’)t/);
  });
});

describe('F88b — typography survives the rewrite', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  test('a flattened list is put back as a list', () => {
    const before = '<ol><li>Deliver the goods</li><li>Issue the invoice</li></ol>';
    const flat = 'Deliver the goods promptly\nIssue the invoice within seven days';
    const out = ai.aiPreserveTypography(before, flat);
    assert.equal((out.match(/<li>/g) || []).length, 2, 'THE FIX: two items in, two items out');
    assert.match(out, /^<ol>/, 'and an ordered list stays ordered — the numbering is the citation');
  });

  test('plain wording keeps its line structure, which is the same information', () => {
    const before = '(a) first limb\n(b) second limb\n(c) third limb';
    const out = ai.aiPreserveTypography(before, '(a) first limb revised (b) second limb revised (c) third limb revised');
    assert.equal(out.split('\n').length, 3,
      'a sub-paragraph per line is how a reader finds (b); running them together loses it');
  });

  test('a defined term that survives verbatim keeps its emphasis', () => {
    const out = ai.aiPreserveTypography('<p>The <strong>Supplier</strong> shall deliver.</p>',
      '<p>The Supplier shall deliver promptly.</p>');
    assert.match(out, /<strong>Supplier<\/strong>/);
  });

  test('plain wording gets a plain answer, whatever the model returned', () => {
    const out = ai.aiPreserveTypography('pay in 30 days', '<p>pay in <strong>60</strong> days</p>');
    assert.equal(out, 'pay in 60 days',
      'the clause text this splices into is a string; markup in it would be filed literally');
  });

  test('a script the model emitted is dropped whole, not unwrapped into wording', () => {
    const out = ai.aiPreserveTypography('pay in 30 days', 'pay in <script>alert(1)</script>60 days');
    assert.ok(!/alert/.test(out), 'stripping the tag and keeping its body would file the script as text');
    assert.equal(out, 'pay in 60 days');
  });

  test('only the allowlisted structural tags come through', () => {
    const out = ai.aiKeepStructuralTags('<p class="x" onclick="y()">a <a href="http://x">b</a> <strong>c</strong></p>');
    assert.equal(out, '<p>a b <strong>c</strong></p>',
      'a rewrite has no business introducing a link, a class or a handler into contract wording');
  });
});

describe('F88c — an offset that survives the edit before it', () => {
  const BASE = 'The Customer shall pay within thirty (30) days of invoice.';

  test('nothing moved, so the offset does not', () => {
    assert.equal(R.redlineRebaseOffset(BASE, BASE, 26), 26);
  });

  test('an insertion ABOVE the offset pushes it down by its own length', () => {
    const after = 'The Customer shall promptly pay within thirty (30) days of invoice.';
    const at = BASE.indexOf('thirty');
    const moved = R.redlineRebaseOffset(BASE, after, at);
    assert.equal(after.slice(moved, moved + 6), 'thirty',
      'THE FIX: the raw offset would land nine characters early, mid-word');
    assert.notEqual(moved, at, 'precondition: the strings really did move');
  });

  test('a deletion above the offset pulls it up', () => {
    const after = 'The Customer shall pay thirty (30) days of invoice.';
    const at = BASE.indexOf('thirty');
    const moved = R.redlineRebaseOffset(BASE, after, at);
    assert.equal(after.slice(moved, moved + 6), 'thirty');
  });

  test('an offset inside deleted wording collapses to the seam it left', () => {
    const after = 'The Customer shall pay of invoice.';
    const inside = BASE.indexOf('(30)');
    const moved = R.redlineRebaseOffset(BASE, after, inside);
    assert.ok(moved >= 0 && moved <= after.length,
      'once the wording is gone there is no finer position to have');
  });

  test('the offset is clamped rather than trusted', () => {
    assert.equal(R.redlineRebaseOffset(BASE, BASE, -50), 0);
    assert.equal(R.redlineRebaseOffset(BASE, BASE, 9999), BASE.length);
  });

  test('the lab re-resolves at Apply rather than reusing what it opened with', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'doclab.js'), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(/const live = labFor\(c\.id\)/.test(code),
      'the record is re-read: `lab` in the closure is the one the panel opened with');
    assert.ok(/redlineRebaseOffset\(first\.working, nowWorking, first\.at\)/.test(code),
      'and the remembered offset is carried across whatever moved in between');
  });
});

describe('F88d — discarding a draft nobody has seen', () => {
  const draft = (over = {}) => Object.assign(
    { id: 'L-001', stage: 'internal_draft', status: 'pending', sent: false }, over);

  test('an unsent internal draft can go', () => {
    const store = { changes: [draft()] };
    const res = R.redlineRemoveChange(store, 'L-001');
    assert.equal(res.ok, true);
    assert.equal(store.changes.length, 0);
  });

  test('a sent change cannot — the counterparty is part-way through answering it', () => {
    const store = { changes: [draft({ sent: true, stage: 'published' })] };
    const res = R.redlineRemoveChange(store, 'L-001');
    assert.equal(res.ok, false);
    assert.equal(res.reason, 'sent');
    assert.equal(store.changes.length, 1, 'and nothing was removed on the way to refusing');
  });

  test('a decided change cannot — the record would disagree with the document', () => {
    const store = { changes: [draft({ status: 'accepted' })] };
    assert.equal(R.redlineRemoveChange(store, 'L-001').reason, 'decided');
  });

  test('the stage is a second, independent lock', () => {
    /* A record with `sent` wrong must still be refused by the other test. */
    const store = { changes: [draft({ stage: 'published', sent: false })] };
    assert.equal(R.redlineRemoveChange(store, 'L-001').reason, 'stage');
  });

  test("a colleague's pass stacked on it survives, re-parented", () => {
    const store = { changes: [
      draft({ id: 'L-001' }),
      draft({ id: 'L-002', parentChangeId: 'L-001', depth: 1 })
    ] };
    const res = R.redlineRemoveChange(store, 'L-001');
    assert.deepEqual(res.reparented, ['L-002']);
    assert.equal(store.changes[0].parentChangeId, null,
      'a child left pointing at a missing id would silently lose a step of the history');
    assert.equal(store.changes[0].depth, 0);
  });

  test('the button appears on exactly the changes that may be discarded', () => {
    const win = loadDiscuss();
    assert.equal(win.discussIsDiscardable(draft()), true);
    assert.equal(win.discussIsDiscardable(draft({ sent: true })), false);
    assert.equal(win.discussIsDiscardable(draft({ status: 'rejected' })), false);
    assert.equal(win.discussIsDiscardable(draft({ stage: 'published' })), false);
    assert.equal(win.discussIsDiscardable({}), false, 'a record with no stage at all is not a draft to bin');
  });

  test("and never on the counterparty's copy", () => {
    const win = loadDiscuss();
    assert.match(win.discussDiscardBtnHtml(draft(), {}), /data-discuss-discard="L-001"/);
    assert.equal(win.discussDiscardBtnHtml(draft(), { external: true }), '',
      'internal is not a thing that exists on their side of the wall');
  });
});

describe('F88e — the export is a Word file, not a picture of one', () => {
  const HTML = '<div class="lab-redline"><p>The Supplier shall pay '
    + '<del class="lab-del">thirty (30)</del><ins class="lab-ins">sixty (60)'
    + '<span class="rl-authormark">SC</span></ins> days'
    + '<span class="change-tag-badge" data-change-id="L-002">#L-002 · draft</span>.</p>'
    + '<ol><li><strong>Delivery</strong> terms</li><li>Payment terms</li></ol></div>';

  test('every UI badge is stripped out of the export string', () => {
    const s = D.docxStripUiBadges(HTML);
    assert.ok(!/change-tag-badge/.test(s));
    assert.ok(!/rl-authormark/.test(s), 'the initials welded to an insertion are furniture too');
    assert.ok(!/L-002/.test(s), 'a literal "#L-002" in a counterparty\'s Word file reads as a defined term');
    assert.match(s, /sixty \(60\)/, 'and the wording is untouched');
  });

  test('a change id an element carries as its own id goes with them', () => {
    assert.ok(!/L-007/.test(D.docxStripUiBadges('<span id="L-007">x</span>after')));
    assert.match(D.docxStripUiBadges('<p>see L-002 of the schedule</p>'), /L-002/,
      'but a cross-reference a lawyer actually wrote is left alone');
  });

  test('ins and del become native track changes, not colour', () => {
    const out = D.docxExportTracked(HTML, { author: 'Sarah Chen', date: '2026-07-29T10:00:00Z' });
    assert.match(out.xml, /<w:ins w:id="\d+" w:author="Sarah Chen"/);
    assert.match(out.xml, /<w:del w:id="\d+" w:author="Sarah Chen"/);
    assert.match(out.xml, /<w:delText[^>]*>thirty \(30\)<\/w:delText>/,
      'struck wording is retained the way Word retains it — that is what makes Reject work');
    assert.deepEqual(out.tracked, { ins: 1, del: 1 });
  });

  test('a legal list arrives as a list, against a numbering definition the file ships', () => {
    const out = D.docxExportTracked(HTML);
    assert.match(out.xml, /<w:numPr><w:ilvl w:val="0"\/><w:numId w:val="2"\/><\/w:numPr>/);
    assert.equal((out.xml.match(/<w:p>/g) || []).length, 3, 'one paragraph, two list items');
    assert.match(out.xml, /<w:rPr><w:b\/><\/w:rPr><w:t[^>]*>Delivery<\/w:t>/, 'and bold survives');
  });

  test('the bytes are a ZIP this repo\'s own reader can open', async () => {
    const out = D.docxExportTracked(HTML, { author: 'Sarah Chen' });
    const names = D.zipEntries ? null : null;   // the reader is exercised end to end below
    void names;
    const back = await D.docxExtract(out.bytes);
    assert.equal(back.tracked.ins, 1);
    assert.equal(back.tracked.del, 1);
    assert.match(back.text, /sixty \(60\)/);
    assert.ok(!/thirty \(30\)/.test(back.text),
      'read as if the changes were accepted, which is the only defensible reading');
    assert.ok(!/L-002/.test(back.text), 'and no badge made it into the file');
  });

  test('a document with no redlines exports as clean wording rather than failing', () => {
    const out = D.docxExportTracked('<p>The parties agree as follows.</p>');
    assert.deepEqual(out.tracked, { ins: 0, del: 0 });
    assert.match(out.xml, /The parties agree as follows\./);
  });
});

describe('F88g — the rephrase action asks before it drafts', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'doclab.js'), 'utf8');

  test('the button says what it does and nothing about a direction', () => {
    assert.match(src, /label:'✨ Rephrase with Copilot'/,
      'the label the reader presses');
    assert.ok(!/Rephrase for Buyer Advantage/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')),
      'and it no longer decides, on their behalf, that rephrase means favour my side');
  });

  test('it is marked as the conversational one, and carries the question it asks', () => {
    const block = src.slice(src.indexOf('const LAB_AI_ACTIONS'), src.indexOf('function labActingParty'));
    assert.match(block, /converse:true/);
    assert.match(block, /greeting:'How would you like me to help rephrase this passage\?'/);
    /* Shorten & Simplify stays immediate: it already carries an instruction, and
       asking a person to retype what they just pressed is a step for nothing. */
    assert.equal((block.match(/converse:true/g) || []).length, 1);
  });

  /* The playbook holds category VERDICTS on a contract and no preferred wording
     for any of them, so an action asking a model to match "our playbook
     formulation" asks for something that does not exist — and gets the model's
     own house style back, wearing the playbook's authority. A reviewer who
     reads "aligned with playbook" on a redline stops checking it. */
  test('"Align with Corporate Playbook" is deleted from every selection menu', () => {
    for (const rel of ['js/views/doclab.js', 'js/views/negotiation.js']){
      const file = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
      const code = file.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      assert.ok(!/Align with Corporate Playbook/.test(code),
        `${rel}: the label is gone from the code, not merely from a comment`);
      assert.ok(!/id:\s*'playbook'/.test(code),
        `${rel}: and so is the action it labelled`);
    }
  });

  test('but the playbook itself still reaches the model and still holds changes back', () => {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.match(code, /Our playbook flags this contract for:/,
      'the verdicts are still sent as context on every ask');
    assert.match(code, /playbook deviation —/,
      'and still hold a change back from a batch accept');
  });

  test('a conversational action seeds a session instead of asking a model', () => {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(/if\(action\.converse && window\.aiOpenRephraseSession\)\{/.test(code),
      'the branch exists');
    const branch = code.slice(code.indexOf('if(action.converse'));
    assert.ok(branch.indexOf('return;') < branch.indexOf('propose(\'\')'),
      'and it returns before the direct-proposal path — nothing is spent until '
      + 'the reader has said what they want');
  });
});

describe('F88h — the drawer floats and nothing under it moves', () => {
  const lab = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'doclab.js'), 'utf8');
  const shell = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const ai = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8');

  test('the drawer is a fixed, full-height, top-of-stack overlay', () => {
    for (const [name, src] of [['doclab.js', lab], ['index.html', shell]]){
      const rule = src.slice(src.indexOf('.docked{'), src.indexOf('.docked{') + 400);
      assert.match(rule, /position:\s*fixed/, `${name}: taken out of flow`);
      assert.match(rule, /top:\s*0/, name);
      assert.match(rule, /right:\s*0/, name);
      assert.match(rule, /height:\s*100vh/, `${name}: full height`);
      assert.match(rule, /z-index:\s*100/, `${name}: above the page`);
      assert.match(rule, /box-shadow:\s*-5px 0 25px rgba\(0,0,0,\.?0?\.?15\)/,
        `${name}: the shadow does what the scrim used to`);
    }
  });

  test('nothing narrows the shell to make room for it', () => {
    const code = ai.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/shell\.style\.right\s*=\s*[^']/.test(code)
      || /shell\.style\.right\s*=\s*''/.test(code),
      'aiSyncDock may only CLEAR the shell offset, never set one');
    assert.ok(!/AI_DOCK_MIN_WIDTH/.test(code),
      'and the two-column fallback threshold is gone with the two-column mode');
    assert.match(lab, /#app-shell\{right:0 !important\}/,
      'with a rule on the page that would notice, so a reintroduced dock fails '
      + 'loudly rather than silently reflowing a contract');
  });
});

describe('F88f — the header collapses, and remembers', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'doclab.js'), 'utf8');

  test('the three stacked banners are one bar with the class the spec names', () => {
    assert.match(src, /doclab-status-header flex items-center justify-between p-3 bg-slate-50 border-b/);
  });

  test('the toggle and the preference are both there', () => {
    assert.match(src, /id="toggle-header-btn"/);
    assert.match(src, /const LAB_HEADER_KEY = 'doclab_header_collapsed'/);
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(/localStorage\.setItem\(LAB_HEADER_KEY, v \? 'true' : 'false'\)/.test(code),
      'a preference that is not written is a preference the reader sets again every visit');
  });

  test('the mode chip is outside the part that collapses', () => {
    /* "Internal sandbox drafting" against "published round" is the difference
       between a note nobody has seen and a position that has left the building.
       A reader must not have to expand anything to know which they are in. */
    const head = src.slice(src.indexOf('function labStatusHeaderHtml'));
    const row = head.slice(head.indexOf('doclab-status-row'), head.indexOf('doclab-status-detail'));
    assert.match(row, /\$\{modeChip\}/);
  });
});
