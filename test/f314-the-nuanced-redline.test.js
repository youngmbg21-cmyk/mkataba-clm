/* f314 — THE NUANCED REDLINE (Young's go on the artifact of the same name,
 * 15 Sep 2026: "go ahead and build all four decisions as recommended")
 * ============================================================================
 * THE REPORT, in the owner's own words: "it is nonsensical redline or
 * essentially delete a massive paragraph that probably covers a range of
 * topics and replace it with you standard clause just because they cover the
 * same title of the clause. The redline has to be nuanced and only tackle
 * where the misalignment is." And, of the same screen: "it is hard to
 * differentiate between the added clause vs the clause being deleted ... still
 * cross the words you are proposing to delete but to not have the blue or
 * yellow highlight on them. Leave the blue or yellow highlight only on the
 * added words."
 *
 * THE FOUR DECISIONS THIS PINS:
 *   1 · a playbook redline lands on the sub-paragraph its quote sits in.
 *   2 · on a clause the contract already has, what is filed is the POSITION
 *       written into their sentence — never the library's stand-alone clause.
 *   3 · the coloured fill moves onto the added words alone; a deletion keeps
 *       its side's colour and its strike.
 *   4 · a genuine whole-clause rewrite still draws as one struck block and one
 *       added block, unchanged.
 *
 * AND THE WALL that makes decision 1 mean something rather than merely usually
 * happen: a redline may not delete wording the finding never quoted, unless a
 * person says so in words.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const VIEW = read('js/views/negotiation.js');
const PB = read('js/playbook.js');
const CSS = read('js/views/negotiation-css.js');
const INDEX = read('index.html');
const CORE = read('js/core.js');
const NEGO = read('js/negotiation.js');
const CONTRACT = read('js/views/contract.js');

const ME = { id: 'u_me', name: 'Young Mbagaya', role: 'legal', email: 'y@w.co.ke' };

/* The reported contract, cut to the shape that matters: ONE numbered clause
   carrying SEVEN rules, of which the playbook disagrees with exactly one. */
const SEVEN = [
  '<h1>Master Supply and Distribution Agreement</h1>',
  '<p>Between Nordvane Consumer Brands AB and Kestrel Retail Group plc.</p>',
  '<h2>7. Invoicing, Payment and Set-off</h2>',
  '<p>7.1 The Manufacturer shall issue an invoice on or after despatch of each consignment.</p>',
  '<p>7.2 The Distributor shall pay each correctly rendered and undisputed invoice within sixty (60) days from the end of the calendar month in which the invoice is received.</p>',
  '<p>7.3 An invoice that does not comply with clause 7.1 is not correctly rendered.</p>',
  '<p>7.4 Where the Distributor disputes an invoice in good faith, it shall notify the Manufacturer within fifteen (15) Business Days of receipt.</p>',
  '<p>7.5 The Manufacturer may charge interest at eight (8) percentage points above the reference rate of Sveriges Riksbank.</p>',
  '<p>7.6 The Manufacturer may set a credit limit for the Distributor and may review it every six (6) months.</p>',
  '<p>7.7 The Distributor may set off sums properly due to it under clause 8, and no other right of set-off applies.</p>',
  '<h2>8. Confidentiality</h2><p>Each party shall keep the other information confidential.</p>',
].join('');

const QUOTE = 'The Distributor shall pay each correctly rendered and undisputed invoice '
  + 'within sixty (60) days from the end of the calendar month in which the invoice is received.';
/* The workspace's own approved payment clause — written for a blank page, and
   the wording that was pasted over all seven rules. It even calls the parties
   by names this contract does not define. */
const OURS = 'The Buyer shall pay each undisputed invoice within thirty (30) days of receipt, in SEK, exclusive of VAT.';

const contract = (over = {}) => ({ id: 'MK-400', name: 'Master Supply and Distribution Agreement',
  counterparty: 'Kestrel Retail Group plc', status: 'Under Review', folder: 'proc', source: 'upload',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 185000000, redlineText: SEVEN, format: 'rich',
  upload: { name: 'msda.docx', extractedText: 'x'.repeat(400) }, ...over });

function world(){
  const w = buildWorld({ user: ME, negotiationView: true, contractView: true, playbook: true, ladder: true });
  const win = w.win;
  win.state = { settings: {}, contracts: [] };
  win.getUsers = () => [ME]; win.userById = () => ME;
  win.saveSettings = () => {}; win.persist = () => {};
  w.toasts = []; win.toast = (m, k) => w.toasts.push({ kind: k || 'ok', text: String(m) });
  w.asked = []; win.confirmDialog = async o => { w.asked.push(o); return w.answer !== false; };
  win.clauseLibrary = () => [{ id: 'cl-pay', category: 'Payment terms', name: 'Payment terms',
    preferred: OURS, fallback: 'The Buyer shall pay within forty-five (45) days of receipt.' }];
  return w;
}
/* The review, scripted, exactly as the reported one read: one deviation that
   LOCATES clause 7 by quoting 7.2 word for word. */
const REVIEW = {
  key: 'supply', label: 'Supply', source: 'ai', verdicts: [
    { category: 'Payment terms', status: 'deviation', quote: QUOTE,
      position: 'Payment within thirty (30) days of receipt',
      redline: 'The Distributor shall pay each correctly rendered and undisputed invoice within thirty (30) days of receipt.',
      escalate: false },
  ] };

function staged(){
  const w = world();
  const { win } = w;
  const c = contract();
  win.negoInit(c);
  win.state.contracts = [c];
  const items = win.rlPlaybookProposals(c, REVIEW);
  return { w, win, c, items, it: items[0] };
}

/* ========================================================================== */
describe('f314 (1) — the unit is the sub-paragraph, not the clause', () => {
  test('the finding locates the clause, and the clause really does carry seven rules', () => {
    const { win, it } = staged();
    assert.ok(it, 'the deviation became a proposal');
    assert.equal(it.landing, 'edit', 'it lands on a clause the contract already has');
    const blocks = win.pbClauseBlocks(it.oldHtml);
    assert.equal(blocks.length, 7, 'seven sub-paragraphs under one heading: ' + blocks.length);
  });

  test('pbQuoteBlock picks the one sub-paragraph the finding quotes', () => {
    const { win, it } = staged();
    const at = win.pbQuoteBlock(it.oldHtml, QUOTE);
    assert.equal(at, 1, 'it is 7.2, the second block');
    const blocks = win.pbClauseBlocks(it.oldHtml);
    assert.match(blocks[at], /sixty \(60\) days/, 'and that block is the one carrying the figure');
  });

  test('a quote it cannot place answers -1 rather than guessing a block', () => {
    const { win, it } = staged();
    assert.equal(win.pbQuoteBlock(it.oldHtml, 'wording this contract does not carry anywhere'), -1);
    assert.equal(win.pbQuoteBlock(it.oldHtml, ''), -1, 'and no quote is no answer');
  });

  test('a clause of one block IS that block — nothing to search for', () => {
    const { win } = staged();
    assert.equal(win.pbQuoteBlock('<p>One paragraph only.</p>', 'anything at all'), 0);
  });

  test('pbSwapBlock moves one block and leaves every other one byte-identical', () => {
    const { win, it } = staged();
    const before = win.pbClauseBlocks(it.oldHtml);
    const html = win.pbSwapBlock(it.oldHtml, 1, '7.2 A different sentence entirely.');
    const after = win.pbClauseBlocks(html);
    assert.equal(after.length, before.length, 'no block is added or lost');
    after.forEach((t, i) => { if (i !== 1) assert.equal(t, before[i], 'block ' + i + ' did not move'); });
    assert.equal(after[1], '7.2 A different sentence entirely.');
  });
});

/* ========================================================================== */
describe('f314 (2) — what is filed is the position, never the paragraph', () => {
  test('the fit writes OUR figure into THEIR sentence and touches nothing else', () => {
    const { win, it } = staged();
    assert.ok(it.fit, 'a smallest change was worked out');
    assert.equal(it.fit.kind, 'figure', 'and it is the figure, not a wording swap');
    assert.equal(it.fit.block, 1, 'on 7.2');
    assert.match(it.fit.preview, /thirty \(30\) days/, 'our number is in it');
    assert.match(it.fit.preview, /from the end of the calendar month/,
      'and THEIR own words around it are kept — this is their sentence, corrected');
    assert.match(it.fit.preview, /The Distributor/, 'including the party this contract actually defines');
    assert.ok(!/The Buyer/.test(it.fit.text), 'and never the name our stand-alone clause uses');
  });

  test('the other six rules survive the fitted wording word for word', () => {
    const { win, it } = staged();
    const before = win.pbClauseBlocks(it.oldHtml);
    const after = win.pbClauseBlocks(it.fit.html);
    assert.equal(after.length, 7);
    [0, 2, 3, 4, 5, 6].forEach(i => assert.equal(after[i], before[i],
      'sub-paragraph ' + (i + 1) + ' is untouched'));
    /* The four rules the reported redline deleted with nothing in their place. */
    assert.match(it.fit.text, /interest at eight \(8\) percentage points/, 'the interest charge survives');
    assert.match(it.fit.text, /disputes an invoice in good faith/, 'the dispute procedure survives');
    assert.match(it.fit.text, /credit limit/, 'the credit limit survives');
    assert.match(it.fit.text, /set off sums properly due/, 'the set-off right survives');
  });

  test('the LEAD on a located clause is the smallest change — not the library clause', () => {
    const { it } = staged();
    assert.equal(it.leadKind, 'figure', 'the card previews the fitted wording');
    assert.equal(it.lead, it.fit.text, 'and the preview is exactly what the press files');
    assert.ok(it.preferred, 'our standard wording is still carried');
    assert.notEqual(it.lead, it.preferred, 'it is simply no longer what leads');
  });

  test('the three named wordings are untouched — the 26 Aug ruling stands', () => {
    const { it } = staged();
    assert.equal(it.preferred, OURS, 'ours is ours');
    assert.match(it.fallback, /forty-five \(45\)/, 'the fallback is the library\'s');
    assert.match(it.draft, /thirty \(30\) days of receipt/, 'the draft is Copilot\'s');
    assert.ok(it.preferred !== it.draft, 'and none is printed under another\'s name');
  });

  test('the fourth wording is NAMED, so no card can print it as somebody else\'s', () => {
    assert.match(VIEW, /figure: 'pb_w_figure'/, 'it is in the one naming map');
    const en = read('js/i18n.js');
    assert.match(en, /pb_w_figure: 'Your figure, in their wording'/);
    assert.equal((en.match(/pb_w_figure:/g) || []).length, 2, 'and it is in BOTH books');
  });

  test('an ADD landing is untouched: our own clause is exactly what belongs there', () => {
    const w = world(); const { win } = w;
    const c = contract(); win.negoInit(c);
    const items = win.rlPlaybookProposals(c, { key: 'x', label: 'x', source: 'ai', verdicts: [
      { category: 'Payment terms', status: 'missing', quote: '', position: 'p', redline: '', escalate: false }] });
    const it = items[0];
    assert.equal(it.landing, 'add');
    assert.equal(it.fit, null, 'there is no clause to narrow to');
    assert.equal(it.lead, OURS, 'so our stand-alone wording leads, as it always did');
    assert.equal(it.leadKind, 'standard');
  });
});

/* ========================================================================== */
describe('f314 (3) — the wall: a redline may not delete what nobody asked about', () => {
  test('pbUnquotedLoss counts the rules the finding never mentioned', () => {
    const { win, it } = staged();
    const gone = win.pbUnquotedLoss(it.oldHtml, QUOTE, OURS);
    assert.equal(gone, 6, 'six of the seven would vanish: ' + gone);
  });

  test('and counts NONE against the fitted wording, which keeps them all', () => {
    const { win, it } = staged();
    assert.equal(win.pbUnquotedLoss(it.oldHtml, QUOTE, it.fit.text), 0);
  });

  test('a clause of one block can lose nothing unquoted', () => {
    const { win } = staged();
    assert.equal(win.pbUnquotedLoss('<p>Only this.</p>', 'Only this.', 'Something else.'), 0);
  });

  test('the filing door REFUSES our stand-alone clause over a located clause', async () => {
    const { w, win, c, it } = staged();
    const bag = {};
    const ch = await win.rlFilePlaybookProposal(c, it, it.preferred, bag);
    assert.equal(ch, null, 'nothing is filed');
    assert.equal((c.changes || []).length, 0, 'and nothing reached the record');
    assert.ok(bag.refused, 'the reason came back to the caller');
    assert.match(String(bag.refused), /6/, 'and it counts what would have gone: ' + bag.refused);
  });

  test('but a person who says so in words may still do it — decision 4', async () => {
    const { win, c, it } = staged();
    const ch = await win.rlFilePlaybookProposal(c, it, it.preferred, { wholesale: true });
    assert.ok(ch, 'the whole-clause replacement is a real move and is still available');
    assert.match(String(ch.newText), /The Buyer/, 'and it is our wording that was filed');
  });

  test('the fitted wording files as the clause\'s own markup, never rebuilt from lines', async () => {
    const { win, c, it } = staged();
    const ch = await win.rlFilePlaybookProposal(c, it, it.fit.text, {});
    assert.ok(ch, 'it files');
    assert.equal(ch.changeType, 'modify');
    const after = win.pbClauseBlocks(ch.bodyHtml);
    assert.equal(after.length, 7, 'the clause still has its seven sub-paragraphs');
    assert.match(String(ch.newText), /thirty \(30\) days/);
    assert.match(String(ch.newText), /interest at eight \(8\)/, 'with everything nobody argued about intact');
  });

  test('and the picture it draws is small — the whole point of the report', async () => {
    const { win, c, it } = staged();
    const ch = await win.rlFilePlaybookProposal(c, it, it.fit.text, {});
    const ops = win.redlineOps(String(ch.oldText), String(ch.newText));
    const s = win.redlineStats(ops);
    assert.ok(s.ins + s.del <= 8, 'a handful of marked words, not a page: ' + (s.ins + s.del));
    assert.ok(!win.redlineWholesale(String(ch.oldText), String(ch.newText)),
      'and it is NOT drawn as a wholesale replacement');
  });

  test('where the SAME clause is replaced whole, it still IS a wholesale replacement', async () => {
    const { win, c, it } = staged();
    const ch = await win.rlFilePlaybookProposal(c, it, it.preferred, { wholesale: true });
    assert.ok(win.redlineWholesale(String(ch.oldText), String(ch.newText)),
      'decision 4: a rewrite somebody chose keeps the one-struck-block picture');
  });
});

/* ========================================================================== */
describe('f314 (4) — the batch never pastes, and says what it left', () => {
  test('Prepare redlines reads the fit on an edit landing and the library on an add', () => {
    const i = VIEW.indexOf('const words = it.landing === ');
    assert.ok(i > 0, 'the batch chooses by landing');
    const line = VIEW.slice(i, i + 260);
    assert.match(line, /it\.fit && it\.fit\.text/, 'an edit takes the fitted wording');
    assert.match(line, /it\.preferred \|\| it\.draft/, 'an add takes ours, then Copilot\'s');
    assert.ok(!/it\.fallback/.test(line), 'and NEVER the fallback — a position nobody decided to concede');
  });

  test('an edit with nothing narrow enough is counted and left, never pasted', () => {
    assert.match(VIEW, /if \(it\.landing === 'edit'\) n\.broad\+\+; else n\.fallback\+\+;/);
    assert.match(VIEW, /n\.broad\) parts\.push\(i18t\('ng_prepare_broad'/, 'and the toast says so');
    const en = read('js/i18n.js');
    assert.equal((en.match(/ng_prepare_broad:/g) || []).length, 2, 'in both books');
  });

  test('the batch passes no wholesale flag — the refusal is on the machine, never the reader', () => {
    const i = VIEW.indexOf('rlFilePlaybookProposal(c, it, words, bag)');
    assert.ok(i > 0);
    assert.ok(!/wholesale/.test(VIEW.slice(i - 900, i)), 'nothing unattended lifts the wall');
  });

  test('the review window asks before replacing a whole clause, and counts what would go', () => {
    assert.match(VIEW, /const askThenFile = \(b, attr, wordingOf\)/, 'one path for both library wordings');
    const i = VIEW.indexOf('const askThenFile');
    const body = VIEW.slice(i, i + 1400);
    assert.match(body, /pbUnquotedLoss\(it\.oldHtml/, 'it measures the loss first');
    assert.match(body, /ng_pb_broad_ask/, 'and asks in words');
    assert.match(body, /wholesale: true/, 'answering yes is what lifts the wall');
    assert.match(VIEW, /\[data-pbr-go\]'\)\.forEach\(b => askThenFile\(b, 'data-pbr-go'/, 'our standard asks');
    assert.match(VIEW, /\[data-pbr-fb\]'\)\.forEach\(b => askThenFile\(b, 'data-pbr-fb'/, 'so does the fallback');
  });

  test('the primary press follows the lead, so preview and first button cannot disagree', () => {
    assert.match(VIEW, /data-pbr-fit="\$\{i\}" class="ui-btn ui-btn-primary"/, 'a figure gets its own primary press');
    assert.match(VIEW, /data-pbr-draft="\$\{i\}" class="ui-btn\$\{\(it\.fit && it\.fit\.kind === 'draft'\) \? ' ui-btn-primary' : ''\}/,
      'a fitted draft promotes the draft button');
    assert.match(VIEW, /data-pbr-go="\$\{i\}" class="ui-btn\$\{it\.fit \? '' : ' ui-btn-primary'\}/,
      'and the stand-alone clause steps back wherever a fit exists');
  });

  test('the clause editor\'s scan rail offers the same four wordings under the same names', () => {
    const CE = read('js/views/clauseeditor.js');
    assert.match(CE, /fit: 'ce_use_fit'/, 'the rail names the fourth wording');
    assert.ok(!/missing:\s*\{[^}]*fit:/.test(CE), 'and only on the here list — an add has nothing to narrow to');
    assert.match(CE, /it\.fit && it\.fit\.kind === 'figure'\) \? btn\('fit', it\.fit\.text\)/, 'the card draws it');
    assert.match(CE, /parts\[1\] === 'fit' \? \(it\.fit && it\.fit\.text\)/, 'the press resolves it');
    assert.match(CE, /ceApply\(fitHtml \|\| words/, 'and applies the clause\'s own markup, not rebuilt lines');
  });

  test('none of this is a second filing path', () => {
    const i = PB.indexOf('THE SMALLEST CHANGE THAT MEETS A POSITION');
    assert.ok(i > 0, 'the reading is in js/playbook.js');
    const end = PB.indexOf('heuristic playbook review', i);
    const body = PB.slice(i, end);
    for (const forbidden of ['negoFileChange', 'changes.push', 'negoEditClause', 'negoInsertClause', 'fetch(', '/api/'])
      assert.ok(!body.includes(forbidden), 'the reading never ' + forbidden);
  });
});

/* ========================================================================== */
describe('f314 (5) — the fill means arriving, and nothing else', () => {
  /* EVERY declaration block that names this mark, joined — a mark is dressed
     by more than one rule (the fill here, the line further down), so reading
     only the last one to mention it is how a sweep comes to pass on the wrong
     rule. The claims below are about the SET of declarations. */
  const rules = src => {
    const out = {};
    for (const m of String(src).matchAll(/\.rl-doc (ins|del)\.(rl-us|rl-them)[^{]*\{([^}]*)\}/g)){
      const k = m[1] + '.' + m[2];
      out[k] = (out[k] ? out[k] + ' ; ' : '') + m[3];
    }
    return out;
  };
  for (const [name, src] of [['negotiation-css.js', CSS], ['index.html', INDEX]]){
    test(name + ': a deletion keeps its colour and states transparent', () => {
      const r = rules(src);
      for (const k of ['del.rl-us', 'del.rl-them']){
        assert.ok(r[k], k + ' is declared in ' + name);
        assert.match(r[k], /background:transparent/,
          k + ' says transparent rather than saying nothing — .nego-del would otherwise paint it');
        assert.match(r[k], /color:var\(/, k + ' still says whose deletion it is');
      }
    });
    test(name + ': an insertion keeps the fill', () => {
      const r = rules(src);
      assert.match(r['ins.rl-us'], /background:var\(--st-steel-bg\)/);
      assert.match(r['ins.rl-them'], /background:var\(--st-amber-bg\)/);
    });
  }
  test('the line still says WHAT — underline arrives, strike leaves', () => {
    for (const src of [CSS, INDEX]){
      assert.match(src, /ins\.rl-them,[^{]*ins\.rl-us[^{]*\{text-decoration:underline/);
      assert.match(src, /del\.rl-them,[^{]*del\.rl-us[^{]*\{text-decoration:line-through/);
    }
  });
  test('both sheets agree, because two sheets disagreeing is how this drifts', () => {
    const a = rules(CSS), b = rules(INDEX);
    for (const k of Object.keys(a)) assert.equal(a[k], b[k], k + ' differs between the two sheets');
  });
  test('the ONE change is the fill — the sided grammar itself is untouched', () => {
    /* A deletion of ours nested inside an insertion of theirs still reads. */
    for (const src of [CSS, INDEX])
      assert.match(src, /ins\.rl-them>del\.rl-us[^{]*\{background:transparent;color:var\(--accent-ink\)\}/);
  });
});

/* ========================================================================== */
describe('f314 (6) — the decision that could not be made', () => {
  test('an incoming ask is measured from what NOW STANDS, never the round baseline', () => {
    const i = CORE.indexOf('const stacksOn = (c.changes||[]).find');
    assert.ok(i > 0);
    const body = CORE.slice(i, i + 2200);
    assert.match(body, /negoClauseNowById\(c, clauseId\)/, 'the clause as shown, adopted changes and all');
    assert.match(body, /oldText: stacksOn\?String\(p\.oldText\|\|''\):\(standing\?standing\.text/,
      'and that is what oldText records');
    assert.ok(!/oldText: stacksOn\?String\(p\.oldText\|\|''\):\(cl\?cl\.text/.test(body),
      'the baseline reading is gone — it is what made every later ask a rival');
  });

  test('so their second ask on a settled clause can actually be accepted', async () => {
    const w = world(); const { win } = w;
    const c = contract(); win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => /Invoicing/.test(x.headingText || ''));
    /* Their first ask, accepted. */
    const first = await win.negoEditClause(c, cl.clauseId,
      win.pbSwapBlock(cl.bodyHtml, 4, '7.5 The Manufacturer may charge interest at six (6) percentage points.'),
      { side: 'counterparty', author: 'Kestrel Legal' });
    assert.ok(first, 'their first ask files');
    assert.ok(win.negoResolve(c, first.id, 'accepted', { side: 'owner', by: 'Young' }), 'and is accepted');
    /* Their second ask, written on top of what now stands — the shape that
       arrives through applyNegoProposals every time a round comes back. */
    const standing = win.negoClauseNowById(c, cl.clauseId);
    const second = await win.negoEditClause(c, cl.clauseId,
      win.pbSwapBlock(standing.bodyHtml, 5, '7.6 The Manufacturer may review the credit limit every three (3) months.'),
      { side: 'counterparty', author: 'Kestrel Legal' });
    assert.ok(second, 'their second ask files');
    w.toasts.length = 0;
    const ok = win.negoResolve(c, second.id, 'accepted', { side: 'owner', by: 'Young' });
    assert.ok(ok, 'AND IT CAN BE ACCEPTED: ' + (w.toasts.map(t => t.text).join(' | ') || 'silently refused'));
    assert.equal(second.status, 'accepted');
    const body = win.negoResolvedBody(c);
    assert.match(body, /six \(6\) percentage points/, 'the first decision still stands');
    assert.match(body, /three \(3\) months/, 'and the second one is in the wording too');
  });

  test('when the guard DOES fire it names the clause, never a CHG number', () => {
    const i = NEGO.indexOf('function negoRefusalClause');
    assert.ok(i > 0, 'there is one reading of what a refusal may call another change');
    assert.match(NEGO.slice(i, i + 600), /clauseNameShown/, 'through the one presenting reading');
    assert.match(NEGO.slice(i, i + 600), /ng_this_clause/, 'with an honest fallback');
    assert.match(NEGO, /ng_accept_blocked_adopted', \{ clause: negoRefusalClause/);
    assert.match(NEGO, /ng_reopen_blocked_downstream', \{ clause: negoRefusalClause/,
      'the mirror guard had the same fault and got the same fix');
    const en = read('js/i18n.js');
    assert.ok(!/ng_accept_blocked_adopted: '#\{id\}/.test(en), 'the id is out of the English sentence');
    assert.ok(!/ng_reopen_blocked_downstream: '#\{id\}/.test(en), 'and out of the mirror');
    assert.equal((en.match(/ng_accept_blocked_adopted: 'A change on \{clause\}/g) || []).length, 1);
  });
});

/* ========================================================================== */
describe('f314 (7) — the plain English column', () => {
  test('the front matter is mirrored, and only where there is a boundary to mirror to', () => {
    const i = CONTRACT.indexOf('function docReadFront');
    assert.ok(i > 0, 'there is one reading of what sits above the first clause');
    const body = CONTRACT.slice(i, CONTRACT.indexOf('function docReadSwitchHtml'));
    assert.match(body, /if\(!canvas\|\|!pairs\|\|!pairs\.length\) return \[\]/,
      'no paired clause, no boundary, nothing mirrored');
    assert.match(body, /DOCUMENT_POSITION_PRECEDING/, 'only what comes BEFORE the first entry');
    assert.match(body, /DOC_READ_FURNITURE/, 'and never the paper\'s furniture');
  });

  test('the mirror never reaches the route, the cache or the hash', () => {
    /* docReadClauses is what is SENT and what the reading is keyed on. If the
       mirror touched it, every contract already read would pay again. */
    const i = CONTRACT.indexOf('function docReadClauses');
    const body = CONTRACT.slice(i, i + 2600);
    assert.ok(!/docReadFront|dr-mirror/.test(body), 'the sent list knows nothing about it');
    assert.ok(!/docReadFront/.test(CONTRACT.slice(CONTRACT.indexOf('function docReadSig'),
      CONTRACT.indexOf('function docReadSig') + 900)), 'and neither does the signature it is cached on');
  });

  test('its shape is MEASURED off the block it faces, through a narrow door', () => {
    const i = CONTRACT.indexOf('function docReadMirrorStyle');
    const body = CONTRACT.slice(i, CONTRACT.indexOf('function docReadFront'));
    assert.match(body, /getComputedStyle/, 'read off the paper, never typed here');
    assert.match(body, /DOC_READ_ALIGN\.has/, 'alignment from a fixed set');
    assert.match(body, /DOC_READ_CASE\.has/, 'case from a fixed set');
    assert.match(body, /\/\^-\?\\d\+\(\\\.\\d\+\)\?px\$\//, 'letter-spacing only where it is a plain number of pixels');
    assert.match(body, /var\(--dr-size/, 'and the size is a RATIO of the edition\'s own, never a copied pixel');
  });

  /* ---- A CONTENTS ROW KEEPS ITS RIGHT-HAND COLUMN (Young reported it 15 Sep
     2026: "The numbers in the contract on the right are supposed to be on the
     far right of the contract similar to the contract on the left") ----
     The geometry is measured in plain-english-verify 19, which is the only
     instrument that can see it. These are the walls round it: the tail is the
     FILE'S own, the split refuses rather than guesses, and nothing about it
     reaches what is sent. */
  test('a contents row is two columns, and the tail is the FILE\'s own', () => {
    const i = CONTRACT.indexOf('function docReadMirrorToc');
    assert.ok(i > 0, 'there is one reading of a contents row\'s right-hand column');
    const body = CONTRACT.slice(i, CONTRACT.indexOf('function docReadFront'));
    assert.match(body, /window\.RICH_TOC_TAIL_CLASS/,
      'the class is read through window, so the mirror and the sanitiser cannot drift');
    assert.match(body, /'hati-toc-n'/, 'with a fallback for a stage without it');
    assert.match(body, /if\(!whole\.endsWith\(n\)\) return null/,
      'and it REFUSES rather than guessing where the line does not end with the tail');
    assert.match(body, /if\(!tail\) return null/, 'a block with no such span is not a contents row');
    assert.match(CONTRACT, /toc:docReadMirrorToc\(el,text\)/, 'every mirrored block is asked');
    assert.match(CONTRACT, /f\.toc\?`<p class="hati-toc">\$\{esc\(f\.toc\.head\)\}<span class="hati-toc-n">/,
      'and where there is one the mirror draws the paper\'s own two-part shape');
  });

  test('and the mirror is dressed for it in its own home', () => {
    /* THE CLOTHES FOLLOW THE BUILDER: every sheet that draws this markup
       carries the pair, and each is scoped to its own home — none of them can
       reach a layer that is a SIBLING of the paper. */
    assert.match(INDEX, /\.doc-read-mirror > p\.hati-toc\{ overflow:hidden; \}/,
      'the row contains its own float');
    assert.match(INDEX, /\.doc-read-mirror \.hati-toc-n\{ float:right; padding-left:1\.2em; \}/,
      'and the tail sits at the wall, in the document\'s own declarations');
    assert.match(INDEX, /\.hati-doc \.hati-toc-n\{float:right;padding-left:1\.2em;\}/,
      'the sheet it mirrors is untouched');
  });

  /* A NAMED WALL, and it is green at the parent on purpose: it asserts an
     ABSENCE, and the whole point of it is that the absence survives. */
  test('the contents tail never reaches what is sent', () => {
    const i = CONTRACT.indexOf('function docReadClauses');
    const body = CONTRACT.slice(i, i + 2600);
    assert.ok(!/docReadMirrorToc|hati-toc-n/.test(body), 'the sent list knows nothing about it');
    assert.ok(!/docReadMirrorToc/.test(CONTRACT.slice(CONTRACT.indexOf('function docReadSig'),
      CONTRACT.indexOf('function docReadSig') + 900)), 'and neither does the signature it is cached on');
  });

  test('the wheel is forwarded to the paper, and the edition grows no second scroller', () => {
    const i = CONTRACT.indexOf('docReadWheel');
    assert.ok(i > 0, 'the layer forwards the wheel');
    const body = CONTRACT.slice(i - 200, i + 900);
    assert.match(body, /getElementById\('doc-scroll'\)/, 'onto the paper\'s own scroller');
    assert.match(body, /deltaMode===1\?16:\(e\.deltaMode===2\?s\.clientHeight:1\)/, 'lines and pages honoured');
    assert.match(body, /if\(s\.scrollTop!==was\) e\.preventDefault\(\)/,
      'and the press is only swallowed where it actually moved the paper');
    assert.match(CONTRACT, /inner\.style\.transform='translateY\('/,
      'the edition is still a transform, never a scroller of its own');
  });
});
