/* f384 — WHO DOES WHAT, AND ONE LIGHT-RED AREA (Young ruled 25 Sep 2026)
   ============================================================================
   Over two screenshots of the X-ray: *"i want this highlighted area in the
   x-ray page to be the area that is highlighted in light red … this 'about
   contract x' portion should be excluded from the x-ray so there is only one
   red highlighted area which is the worth a look area"* — and, over three
   drawn options for the space that left, *"build it using your recommendation
   of who does what"*.

   WHAT THIS FILE PINS (the pixels are driven in a real browser by
   xray-who-does-what-verify, because "the contract does not move" and "the
   press lands on the sentence" are only true on a painted page)
     1  Worth a look is the one light-red area, and only while it holds
        something; About this contract is no longer drawn, and its reading is
        kept whole with no caller
     2  the reading: sentences, and a DUTY (DOC_DUTY_RE's own), a RIGHT and a
        LIMIT in each — refusing far more than it accepts
     3  who: words naming both sides first, then the Obligations tab's owner,
        then the party's own name on the paper, else UNCLEAR, never a guess
     4  the lines, on a painted page: cites, sorting, the tick for the tab,
        the cap said out loud
     5  the two presses ride the X-ray's one listener: scrollToQuote and
        roomGoTab, never a second finder or a second router
     6  walls: no route, no store, no spend, nothing written onto the record
     7  both books

   A missing name READS AS EMPTY rather than throwing, so against the commit
   before this one the file runs and reports its claims one at a time.

   Run: node --test test/f384-who-does-what.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const ROOM = strip(read('js/views/contract.js'));
const INDEX = read('index.html');
const I18N = read('js/i18n.js');

/* PIN THE REGION: a named function from its own `function` to the next one at
   column zero — never a byte count. Absent reads as empty. */
function region(name) {
  const a = ROOM.indexOf('function ' + name + '(');
  if (a < 0) return '';
  const b = ROOM.indexOf('\nfunction ', a + 1);
  return ROOM.slice(a, b > a ? b : ROOM.length);
}
/* The new block: from its first constant to the builder that closes it. */
function whoBlock() {
  const a = ROOM.indexOf('const XR_WD_MAX');
  const b = ROOM.indexOf('function docXrayWhoHtml(');
  if (a < 0 || b < 0) return '';
  const c = ROOM.indexOf('\nfunction ', b + 1);
  return ROOM.slice(a, c > b ? c : ROOM.length);
}

/* ---- the stage: the contract view on jsdom, with a painted page ---- */
function stage() {
  const w = buildWorld({ contractView: true, obligations: true });
  return w;
}
const fn = (w, name) => (typeof w.win[name] === 'function' ? w.win[name] : null);

const PAGE = `
  <h1>WAREHOUSING SERVICES AGREEMENT</h1>
  <p>This Warehousing Services Agreement is made between Highland Corporate Ltd ("Customer") and Siginon Logistics Ltd ("Warehouse").</p>
  <h2>ARTICLE VI: FEES AND PAYMENT</h2>
  <p>VI.1 Fees.</p>
  <p>Customer shall pay Warehouse the storage, handling and shipping fees set out in Exhibit A (the "Fees").</p>
  <p>VI.2 Invoicing.</p>
  <p>Warehouse shall invoice Customer monthly in arrears for all Fees incurred during the preceding calendar month.</p>
  <p>VI.3 Payment.</p>
  <p>Customer shall pay each undisputed invoice within thirty (30) days of receipt. Amounts not paid when due shall bear interest at one percent (1%) per month until paid.</p>
  <p>VI.4 Disputed Invoices.</p>
  <p>Customer may withhold payment of any amount it disputes in good faith, provided it notifies Warehouse in writing within fifteen (15) days of receipt of the invoice.</p>
  <h2>ARTICLE IX: INSURANCE</h2>
  <p>IX.1 Coverage.</p>
  <p>Warehouse shall maintain, at its own cost, warehouse legal liability insurance with a minimum limit of $3,000,000 per occurrence.</p>
  <p>IX.2 Evidence of Cover.</p>
  <p>Certificates of insurance are to be delivered on request, together with evidence of each renewal of the cover.</p>
  <h2>ARTICLE XIV: TERM, TERMINATION, AND TRANSITION</h2>
  <p>XIV.1 Term.</p>
  <p>This Agreement shall commence on the Effective Date and shall continue for a period of 3 years, unless earlier terminated in accordance with the provisions of this Article.</p>
  <p>XIV.2 Termination for Convenience.</p>
  <p>Either party may terminate this Agreement, in whole or in part, for convenience upon providing 60 days' prior written notice to the other party.</p>
  <p>XIV.4 Transition Assistance.</p>
  <p>Upon termination or expiration of this Agreement, the parties shall cooperate in good faith to ensure an orderly transition of ongoing operations.</p>
  <h2>ARTICLE XVI: GOVERNING LAW</h2>
  <p>This Agreement is governed by the laws of Kenya.</p>`;
const CONTRACT = (over = {}) => ({ id: 'MK-384', name: 'WAREHOUSING SERVICES AGREEMENT',
  party: 'Highland Corporate Ltd', counterparty: 'Siginon Logistics Ltd', status: 'Under Review',
  fields: {}, metadata: {}, audit: [], signatures: [], obligations: [], ...over });
function painted(w, c) {
  const doc = w.win.document;
  const old = doc.getElementById('doc-canvas');
  if (old) old.remove();
  const cv = doc.createElement('div');
  cv.id = 'doc-canvas';
  cv.innerHTML = PAGE;
  doc.body.appendChild(cv);
  const rows = fn(w, 'docXrayRows') ? w.win.docXrayRows(c) : [];
  const at = re => rows.findIndex(r => re.test((r.row && r.row.heading) || ''));
  return { rows, at };
}
const whoOf = (w, c, re) => {
  if (!fn(w, 'docXrayWho')) return null;
  const { rows, at } = painted(w, c);
  return w.win.docXrayWho(c, rows, at(re));
};

/* ============================================================================
   1 · ONE LIGHT-RED AREA
   ==========================================================================*/
describe('f384 (1) Worth a look is the one light-red area; About this contract is gone', () => {
  const PANEL = region('docXrayPanelHtml');
  test('Worth a look carries the shade only while it holds something', () => {
    assert.ok(/marks\?'is-look has':'is-look'/.test(PANEL),
      'the clause list is named is-look, and has only where there are marks — a red box saying "nothing here" is an alarm about nothing');
  });
  test('About this contract is not drawn: the panel never asks the whole-contract reading', () => {
    assert.ok(PANEL.length > 200, 'gated: there is a panel builder to read');
    assert.ok(!/docXrayWide\(/.test(PANEL), 'no call to the reading that gathered what lands nowhere');
    assert.ok(!/xr_sec_wide/.test(PANEL), 'and its heading is asked for nowhere');
    assert.ok(!/is-wide/.test(ROOM), 'nothing builds the stale class');
  });
  test('[kept whole] the reading itself stays, with no caller, because two lines put it back', () => {
    assert.ok(/function docXrayWide\(c,rows\)/.test(ROOM), 'docXrayWide is still declared');
    const calls = (ROOM.match(/docXrayWide\(/g) || []).length;
    assert.equal(calls, 1, 'its own declaration and nothing else');
  });
  test('the shade is the one About this contract wore, mixed from tokens so the night answers', () => {
    const at = INDEX.indexOf('.doc-xr-sec.is-look.has{');
    assert.ok(at > 0, 'the rule exists');
    const rule = INDEX.slice(at, INDEX.indexOf('}', at));
    assert.ok(/background:color-mix\(in srgb,var\(--st-ruby-bg\) 55%,var\(--color-surface\)\)/.test(rule), 'the wash');
    assert.ok(/border:1px solid\s+color-mix\(in srgb,var\(--st-ruby-dot\) 22%,var\(--color-surface\)\)/.test(rule), 'the edge');
    assert.ok(!/#[0-9a-f]{3,8}\b/i.test(rule), 'and no colour of its own');
    assert.ok(!/\.doc-xr-sec\.is-wide\{/.test(INDEX), 'the old rule is gone with the class');
  });
  test('a reading that throws draws nothing — never the "found nothing" line, which would be a claim', () => {
    assert.ok(/try\{ who=docXrayWho\(c,rows,rows\.indexOf\(x\)\); \}/.test(PANEL), 'the reading is guarded');
    assert.ok(/\$\{who\?docXrayWhoHtml\(who\):''\}/.test(PANEL), 'and a failed one draws no section at all');
  });
  test('Who does what is drawn straight after Worth a look', () => {
    const a = PANEL.indexOf("i18t('xr_sec_look')"), b = PANEL.indexOf('docXrayWhoHtml(');
    assert.ok(a > 0 && b > a, 'in that order');
    const between = PANEL.slice(a, b);
    assert.ok(!/docXraySecHtml\(/.test(between.slice(between.indexOf('is-look'))), 'with nothing between them');
  });
});

/* ============================================================================
   2 · THE READING — a duty, a right, a limit
   ==========================================================================*/
describe('f384 (2) what one sentence does', () => {
  const w = stage();
  const act = s => (fn(w, 'xrActOf') ? w.win.xrActOf(s) : undefined);
  const kind = s => { const a = act(s); return a === undefined ? 'ABSENT' : (a ? a.kind : null); };
  test('a duty is DOC_DUTY_RE’s own phrase', () => {
    assert.equal(kind('Customer shall pay each undisputed invoice within thirty (30) days.'), 'must');
    assert.equal(kind('Warehouse shall invoice Customer monthly.'), 'must');
    assert.equal(kind('Neither party shall disclose the terms of this Agreement.'), 'mustnot');
  });
  test('a right is "may" before an action verb, and "may not" is a prohibition', () => {
    assert.equal(kind('Either party may terminate this Agreement on 60 days’ notice.'), 'may');
    assert.equal(kind('Customer may withhold any amount it disputes.'), 'may');
    assert.equal(kind('Warehouse may not assign this Agreement without consent.'), 'mustnot');
    assert.equal(kind('Customer is entitled to audit the Warehouse once a year.'), 'may');
  });
  test('a limit caps or excludes a liability', () => {
    assert.equal(kind('In no event shall either party be liable for lost profits.'), 'limit');
    assert.equal(kind('Each party’s aggregate liability shall not exceed the Fees paid in the prior twelve (12) months.'), 'limit');
    assert.equal(kind('Warehouse shall not be liable for delays caused by the Customer.'), 'limit');
  });
  test('[refusal] it accepts far less than it could', () => {
    assert.equal(kind('This Agreement shall be governed by the laws of Kenya.'), null, 'governed is not a duty');
    assert.equal(kind('This Agreement shall commence on the Effective Date.'), null, 'commencing is not a duty');
    assert.equal(kind('The Services may be varied as agreed in writing.'), null, '"may be" is not a right');
    assert.equal(kind('Losses include, but are not limited to, costs and fees.'), null,
      '"not limited to" is the commonest phrase in drafting and caps nothing');
  });
  test('the earliest phrase in a sentence decides it', () => {
    assert.equal(kind('Either party may terminate if the other shall fail to pay any invoice.'), 'may');
  });
  test('[wall] the duty pattern is BORROWED, never a copy of it', () => {
    const B = whoBlock();
    assert.ok(B.length > 1000, 'gated: there is a block to read');
    assert.ok(/new RegExp\(DOC_DUTY_RE\.source, 'i'\)/.test(B), 'the duty highlighter’s own pattern, flags aside');
    assert.ok(!/'undertakes to','undertake to'/.test(B) && !/'reimburse','indemnify'/.test(B),
      'the duty lists are not written a second time');
  });
  test('sentences are split at an ending, never after an abbreviation or inside a clause number', () => {
    const sp = fn(w, 'xrSentences');
    assert.ok(sp, 'xrSentences is published');
    /* COMPARED AS STRINGS: an array born inside jsdom carries that realm's
       Array.prototype, and deepStrictEqual calls two identical lists unequal. */
    assert.equal(JSON.stringify(sp('XIV.1 Term. This Agreement starts today.')),
      JSON.stringify(['XIV.1 Term.', 'This Agreement starts today.']));
    assert.equal(sp('Supply by Acme Inc. Warehouse shall store it.').length, 1, 'no split after Inc.');
    assert.equal(sp('See Section 4.2 for details. Customer shall pay.').length, 2);
  });
});

/* ============================================================================
   3 · WHO
   ==========================================================================*/
describe('f384 (3) who: both, then the tab, then the name on the paper, else unclear', () => {
  test('the paper’s own short names are read out of the brackets after the legal names', () => {
    const w = stage();
    const pn = fn(w, 'xrPartyNames');
    assert.ok(pn, 'xrPartyNames is published');
    const n = pn(CONTRACT(), 'This Agreement is made between Highland Corporate Ltd ("Customer") and Siginon Logistics Ltd ("Warehouse").');
    assert.ok(n.ours.includes('customer') && n.ours.includes('highland corporate ltd'), JSON.stringify(n));
    assert.ok(n.theirs.includes('warehouse') && !n.theirs.includes('customer'), 'one side’s bracket is never read as the other’s');
  });
  test('a sentence naming a party reads as that side; naming both reads as both', () => {
    const w = stage();
    const sb = fn(w, 'xrSideByName');
    assert.ok(sb, 'xrSideByName is published');
    const names = { ours: ['customer'], theirs: ['warehouse'] };
    assert.equal(sb('Customer', names), 'you');
    assert.equal(sb('Warehouse', names), 'them');
    assert.equal(sb('Customer and Warehouse', names), 'both');
    assert.equal(sb('The Supplier', names), '', 'nobody we know by that name — never a guess');
    assert.equal(sb('Customers of the Warehouse group', names), 'them', 'a name is found as a whole word');
  });
  test('on a painted page: Customer is you, Warehouse is them, and the lines start at the verb', () => {
    const w = stage();
    const who = whoOf(w, CONTRACT(), /FEES AND PAYMENT/);
    assert.ok(who && who.lines, 'docXrayWho answers');
    const says = who.lines.map(l => l.side + ':' + l.kind + ':' + l.cite + ':' + l.say.split(' ').slice(0, 3).join(' '));
    assert.ok(says.includes('you:must:VI.1:pay Warehouse the'), says.join(' | '));
    assert.ok(says.includes('them:must:VI.2:invoice Customer monthly'), says.join(' | '));
    assert.ok(says.includes('you:must:VI.3:pay each undisputed'), says.join(' | '));
    assert.ok(says.includes('you:may:VI.4:withhold payment of'), says.join(' | '));
  });
  test('sorted by who — you, them, both, unclear — and in the paper’s order within a side', () => {
    const w = stage();
    const who = whoOf(w, CONTRACT(), /FEES AND PAYMENT/);
    const sides = (who && who.lines || []).map(l => l.side);
    assert.equal(sides.join(','), 'you,you,you,them');
    assert.equal((who.lines || []).filter(l => l.side === 'you').map(l => l.cite).join(','), 'VI.1,VI.3,VI.4');
    assert.equal(JSON.stringify(who.tally), JSON.stringify({ you: 3, them: 1 }), 'the balance counts the lines');
  });
  test('words naming BOTH sides beat the tab, which records one owner and cannot say both', () => {
    const w = stage();
    const c = CONTRACT({ obligations: [{ id: 'o1', desc: 'Transition', status: 'open', party: 'ours',
      quote: 'the parties shall cooperate in good faith to ensure an orderly transition' }] });
    const who = whoOf(w, c, /TERM, TERMINATION/);
    const l = (who && who.lines || []).find(x => x.cite === 'XIV.4');
    assert.ok(l, 'the transition sentence is a line — the tab vouches for it though "cooperate" is not on the duty list');
    assert.equal(l.side, 'both');
    assert.equal(l.kind, 'must');
    assert.ok(/^cooperate in good faith/.test(l.say), 'and it starts at the verb: ' + l.say);
    assert.ok(l.ob && l.ob.id === 'o1', 'the tab’s item rides the line');
  });
  test('where the sentence names nobody, the Obligations tab’s owner answers', () => {
    const w = stage();
    const c = CONTRACT({ obligations: [{ id: 'o2', desc: 'Certificates', status: 'open', party: 'theirs',
      quote: 'Certificates of insurance are to be delivered on request' }] });
    const who = whoOf(w, c, /INSURANCE/);
    const l = (who && who.lines || []).find(x => /Certificates/.test(x.text));
    assert.ok(l, 'the sentence is a line because the tab vouches for it');
    assert.equal(l.side, 'them');
  });
  test('where nothing tells, the line says UNCLEAR and keeps the whole sentence', () => {
    const w = stage();
    const c = CONTRACT({ party: 'Nobody Ltd', counterparty: 'Nobody Else Ltd' });
    const who = whoOf(w, c, /INSURANCE/);
    const l = (who && who.lines || []).find(x => /maintain/.test(x.text));
    assert.ok(l, 'the insurance duty is a line');
    assert.equal(l.side, 'unclear');
    assert.ok(/^Warehouse shall maintain/.test(l.say), 'the whole sentence, subject and all, so the reader sees who');
  });
  test('the term itself and governing law are not lines — nobody is told to do anything', () => {
    const w = stage();
    const xiv = whoOf(w, CONTRACT(), /TERM, TERMINATION/);
    assert.ok(xiv && !(xiv.lines || []).some(l => l.cite === 'XIV.1'), 'XIV.1 draws no line');
    const law = whoOf(w, CONTRACT(), /GOVERNING LAW/);
    assert.ok(law && law.total === 0, 'governing law draws none');
  });
});

/* ============================================================================
   4 · THE SECTION
   ==========================================================================*/
describe('f384 (4) the section the builder draws', () => {
  test('the head counts the lines it draws, and the balance says the same numbers', () => {
    const w = stage();
    const who = whoOf(w, CONTRACT(), /FEES AND PAYMENT/);
    assert.ok(who && fn(w, 'docXrayWhoHtml'), 'the builder is published');
    const html = w.win.docXrayWhoHtml(who);
    assert.ok(/class="doc-xr-sec is-who"/.test(html));
    assert.ok(/xr_sec_who|Who does what/.test(html));
    assert.equal((html.match(/data-xr-wd=/g) || []).length, 4, 'four lines');
    assert.ok(/· 4</.test(html), 'the head says four');
    assert.ok(/doc-xr-balsay">[^<]*3[^<]*1/.test(html), 'the balance says three and one');
  });
  test('every line carries its whole sentence for the press and the hover', () => {
    const w = stage();
    const who = whoOf(w, CONTRACT(), /FEES AND PAYMENT/);
    const html = w.win.docXrayWhoHtml ? w.win.docXrayWhoHtml(who) : '';
    assert.ok(/data-xr-q="Customer shall pay each undisputed invoice within thirty \(30\) days of receipt\."/.test(html), html.slice(0, 300));
  });
  test('an item on the tab is ticked with its day, and only then is the door drawn', () => {
    const w = stage();
    const plain = w.win.docXrayWhoHtml ? w.win.docXrayWhoHtml(whoOf(w, CONTRACT(), /TERM, TERMINATION/)) : '';
    assert.ok(!/data-xr-ob=/.test(plain), 'no door where nothing on the tab is in this clause');
    const c = CONTRACT({ obligations: [{ id: 'o1', desc: 'Transition', status: 'open', party: 'ours', due: '2029-09-01',
      quote: 'the parties shall cooperate in good faith to ensure an orderly transition' }] });
    const html = w.win.docXrayWhoHtml ? w.win.docXrayWhoHtml(whoOf(w, c, /TERM, TERMINATION/)) : '';
    assert.ok(/class="doc-xr-wdo"/.test(html), 'the tick line is drawn');
    assert.ok(/2029/.test(html), 'with its day');
    assert.ok(/data-xr-ob="1"/.test(html), 'and the door');
  });
  test('nothing found is one line in words', () => {
    const w = stage();
    const html = w.win.docXrayWhoHtml ? w.win.docXrayWhoHtml(whoOf(w, CONTRACT(), /GOVERNING LAW/)) : '';
    assert.ok(/doc-xr-q/.test(html) && !/data-xr-wd=/.test(html), 'a sentence, and no line');
  });
  test('a cap is a fact: past XR_WD_MAX the rest are counted and said', () => {
    const w = stage();
    if (!w.win.docXrayWhoHtml) return assert.fail('no builder');
    const many = { lines: Array.from({ length: 15 }, (_, i) => ({ n: i, side: 'you', kind: 'must', cite: '', text: 'x' + i, say: 'x' + i, ob: null })),
      total: 15, tally: { you: 15 } };
    const html = w.win.docXrayWhoHtml(many);
    assert.equal((html.match(/data-xr-wd=/g) || []).length, w.win.XR_WD_MAX, 'drawn up to the cap');
    assert.ok(/doc-xr-wdmore/.test(html), 'and the rest said');
    assert.ok(/· 15</.test(html), 'the head still counts all fifteen');
  });
  test('the chips wear no amber — in this panel amber means "worth a look"', () => {
    const at = INDEX.indexOf('.doc-xr-who{');
    assert.ok(at > 0, 'the chip rules exist');
    const rules = INDEX.slice(at, INDEX.indexOf('.doc-xr-wdt{', at));
    assert.ok(!/amber/.test(rules), 'no amber token on any chip');
  });
  test('the lines share one set of columns, so the words line up whatever the chip says', () => {
    assert.ok(/\.doc-xr-sec\.is-who \.doc-xr-t\{display:grid;grid-template-columns:auto minmax\(0,1fr\) auto/.test(INDEX));
    assert.ok(/\.doc-xr-wd\{display:grid;grid-template-columns:subgrid/.test(INDEX));
  });
  test('the words follow the reader’s text size, like the rest of the panel', () => {
    assert.ok(/#doc-xray \.doc-xr-wdt\{font-size:calc\(var\(--t-meta\) \* var\(--doc-scale,1\)\)/.test(INDEX));
  });
});

/* ============================================================================
   5 · THE PRESSES
   ==========================================================================*/
describe('f384 (5) the two presses ride the X-ray’s one listener', () => {
  const WIRE = region('docXrayWire');
  test('a line takes the paper to its sentence through scrollToQuote — never a second finder', () => {
    assert.ok(/closest\('\[data-xr-wd\]'\)/.test(WIRE), 'the line is answered in the X-ray listener');
    assert.ok(/window\.scrollToQuote\(q\)/.test(WIRE), 'by the risk scan’s own "take me to these words"');
    assert.ok(!/createTreeWalker/.test(whoBlock()), 'and nothing here walks the text for itself');
  });
  test('the door goes to the Obligations tab through roomGoTab, with the contract looked up LIVE', () => {
    assert.ok(/closest\('\[data-xr-ob\]'\)/.test(WIRE));
    assert.ok(/getContract\(c\.id\)/.test(WIRE) && /roomGoTab\(cur,'oblig'\)/.test(WIRE));
  });
  test('[wall] still armed once per element', () => {
    assert.ok(/if\(!host\|\|host\.dataset\.xrBound\) return;/.test(WIRE));
  });
});

/* ============================================================================
   6 · WALLS
   ==========================================================================*/
describe('f384 (6) walls', () => {
  const B = whoBlock();
  test('there is a block to read', () => assert.ok(B.length > 2000));
  test('no route, no model, no store, no spend', () => {
    assert.ok(B.length > 2000, 'gated: there is a block to grep — an empty block passes every absence');
    [/\bapi\s*\(/, /\bfetch\s*\(/, /\/api\//, /copilotAsk/, /persist\s*\(/, /saveContract/, /localStorage/]
      .forEach(re => assert.ok(!re.test(B), 'no ' + re));
  });
  test('READING MUST NOT WRITE — nothing onto the contract, nothing that initialises a negotiation', () => {
    assert.ok(B.length > 2000, 'gated: there is a block to grep');
    assert.ok(!/\bc\.\w+\s*=(?!=)/.test(B), 'never onto a contract');
    assert.ok(!/\bo\.\w+\s*=(?!=)/.test(B), 'never onto an obligation');
    [/negoInit/, /negoChanges/, /negoClauseList/, /negoRound\(/].forEach(re => assert.ok(!re.test(B), 'no ' + re));
  });
  test('no band: the section is a section of the panel, drawn by its own builder', () => {
    assert.ok(B.length > 2000, 'gated: there is a block to grep');
    [/class="hint"/, /\bband\b/, /rlNoticeStackHtml/].forEach(re => assert.ok(!re.test(B), 'no ' + re));
  });
});

/* ============================================================================
   7 · BOTH BOOKS
   ==========================================================================*/
describe('f384 (7) both books', () => {
  const KEYS = ['xr_sec_who', 'xr_wd_you_must', 'xr_wd_you_mustnot', 'xr_wd_you_may', 'xr_wd_them_must',
    'xr_wd_them_mustnot', 'xr_wd_them_may', 'xr_wd_both_must', 'xr_wd_both_mustnot', 'xr_wd_both_may',
    'xr_wd_unclear', 'xr_wd_limit', 'xr_wd_bal_you', 'xr_wd_bal_them', 'xr_wd_bal_both', 'xr_wd_bal_unclear',
    'xr_wd_tracked', 'xr_wd_due', 'xr_wd_done', 'xr_wd_overdue', 'xr_wd_go', 'xr_wd_go_title', 'xr_wd_none',
    'xr_wd_more_one', 'xr_wd_more_other'];
  test('every new key is in both books', () => {
    KEYS.forEach(k => assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k));
  });
  test('every chip key is written out whole in the code, so the both-books net can see it', () => {
    const B = whoBlock();
    KEYS.filter(k => /^xr_wd_(you|them|both)_/.test(k)).forEach(k =>
      assert.ok(new RegExp("i18t\\('" + k + "'\\)").test(B), k));
    assert.ok(!/i18t\('xr_wd_' \+/.test(B), 'never a key built from pieces');
  });
  test('the Swedish chips are Swedish', () => {
    const sv = I18N.slice(I18N.lastIndexOf("xr_sec_who:"));
    assert.ok(/xr_wd_you_must: 'Ni måste'/.test(sv) && /xr_wd_them_must: 'De måste'/.test(sv));
  });
  test('[kept] the retired heading stays in both books, inert', () => {
    assert.equal((I18N.match(/\bxr_sec_wide:/g) || []).length, 2);
  });
});
