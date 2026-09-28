/* ============================================================
   F392 — ANALYZE CONTRACT ON THE CONTRACT GRAPH (Young ruled 26 Sep 2026:
   "Build the all in one option and merge to main")
   ============================================================
   The Intelligence panel's card carries three doors — Analyze contract
   (filled), Open workspace, Compare — and Analyze puts one contract's paper
   where the nodes were. The questions then go out with that contract's
   wording; every verbatim passage the server kept comes back as a chip,
   pins the words on the paper and lights them; the X-ray map runs beside
   the paper; Focus folds the page head away; a Graph | Paper switch goes
   back and forth without losing anything; the panel's bin ends it.

   WHAT THIS FILE PINS is the READINGS and the WALLS: the stage has no
   layout, so the pixels (what covers the nodes, where a pin sits) are
   analyze-on-the-graph-verify's, driven on the real app. Every claim here is
   red at the parent (e985b16) except the named walls and controls.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const IG = read('js/views/intelligence.js');
const AI = read('js/ai.js');
const CT = read('js/views/contract.js');
const SRV = read('server/server.js');
const I18N = read('js/i18n.js');
const HTML = read('index.html');

/* The region of one top-level function, by its own boundary (never a byte
   count): from its declaration to the next top-level declaration. */
function region(src, name) {
  const m = new RegExp('(?:^|\\n)(?:async )?function ' + name + '\\(').exec(src);
  if (!m) return '';
  const from = m.index;
  const rest = src.slice(from + 1);
  const next = /\n(?:async )?function [A-Za-z_$][\w$]*\(|\nconst [A-Za-z_$][\w$]*=|\nlet [A-Za-z_$][\w$]*=|\nObject\.assign\(window/.exec(rest);
  return next ? src.slice(from, from + 1 + next.index) : src.slice(from);
}
/* The block this feature adds, by its own two markers. */
const BLOCK = (() => { const a = IG.indexOf('ANALYZE CONTRACT — THE PAPER IN THE GRAPH\'S COLUMN'); const b = IG.indexOf('Object.assign(window,{IG,IG_SUGGESTIONS'); return (a > 0 && b > a) ? IG.slice(a, b) : ''; })();

function fixture(id, over = {}) {
  return { id, name: `Agreement ${id}`, counterparty: 'Kabras Sugar', template: 'RM', status: 'Under Review', folder: 'proc',
    fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [], obligations: [], value: 1200000, ...over };
}
function world(list) {
  const w = buildWorld({ intelView: true });
  const { win } = w;
  win.state = Object.assign({}, win.state, { contracts: list, activeId: null, view: 'intel', aiConfigured: true });
  /* Reads the LIVE list, so a test that empties it sees the contract go. */
  win.getContract = id => (win.state.contracts || []).find(c => c.id === id) || null;
  win.intel.history = []; win.intel.paper = null;
  if (typeof win.contractRef !== 'function') win.contractRef = c => c.id;
  if (typeof win.statusLabel !== 'function') win.statusLabel = s => s;
  if (typeof win.openWorkspace !== 'function') win.openWorkspace = () => {};
  if (typeof win.igSyncDockWidth !== 'function') win.igSyncDockWidth = () => {};
  return w;
}
/* The graph tab's column, as renderIntel writes it, so the painter has its
   hosts on a stage that does not render the whole page. */
function hosts(win) {
  const d = win.document;
  d.body.innerHTML = `<div id="ig-page"><header id="ig-head" style="display:flex"></header><div id="ig-note"></div>
    <div id="ig-strip" class="ig-strip" hidden></div><div id="ig-gwrap"><svg id="ig-svg"></svg><div id="ig-paper" class="ig-paper" hidden></div></div>
    <aside id="ig-dock"></aside></div>`;
}

describe('f392 (1) the card carries three doors', () => {
  test('Analyze contract leads and is the filled one; Open workspace is unfilled; Compare is untouched', () => {
    const card = region(IG, 'igExplainCard');
    assert.match(card, /data-ig-analyze="\$\{c\.id\}" class="ui-btn ui-btn-sm ui-btn-primary"/, 'Analyze contract is the filled door');
    assert.match(card, /data-ig-ws="\$\{c\.id\}" class="ui-btn ui-btn-sm"/, 'Open workspace lost the fill');
    assert.ok(card.indexOf('data-ig-analyze') < card.indexOf('data-ig-ws') && card.indexOf('data-ig-ws') < card.indexOf('data-ig-cmp'), 'in that order');
    assert.match(card, /data-ig-cmp="\$\{c\.id\}"/, 'Compare kept');
  });
  test('the row wraps rather than cutting the third door at the panel\'s width', () => {
    assert.match(region(IG, 'igExplainCard'), /flex-wrap:wrap/);
  });
  test('the dock wires the door to igAnalyze, and every passage chip to igLight', () => {
    const d = code(region(IG, 'renderIntelDock'));
    assert.match(d, /\[data-ig-analyze\][\s\S]*?igAnalyze\(/);
    assert.match(d, /\[data-ig-cite\][\s\S]*?igLight\(/);
  });
  test('the words are in both books, and the fill is one filled button per card', () => {
    ['int_analyze', 'int_analyze_title', 'int_paper_graph', 'int_paper_paper', 'int_pins_one', 'int_pins_other', 'int_pins_clear', 'int_focus', 'int_focus_exit',
      'int_ask_contract', 'int_ask_contract_cost', 'int_paper_nothing', 'int_paper_no_wording', 'int_cite_show', 'int_cite_lost', 'int_pin_find', 'int_paper_switch']
      .forEach(k => assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k + ' in both books'));
    assert.equal((region(IG, 'igExplainCard').match(/ui-btn-primary/g) || []).length, 1, 'one fill');
  });
});

describe('f392 (2) the press puts the paper where the nodes were, and nothing is rebuilt', () => {
  test('the column is a strip over a stage; the paper is a cover inside the stage, drawn hidden', () => {
    const r = region(IG, 'renderIntel');
    assert.match(r, /<div id="ig-strip" class="ig-strip" hidden><\/div>/);
    assert.match(r, /<div id="ig-gwrap"/);
    assert.ok(r.indexOf('<svg id="ig-svg"') > r.indexOf('<div id="ig-gwrap"'), 'the graph is inside the stage');
    assert.match(r, /<div id="ig-paper" class="ig-paper" hidden><\/div>/);
    assert.match(r, /igPaintPaper\(\);/, 'painted after every render of the tab');
    assert.match(HTML, /\.ig-paper\{position:absolute;inset:0;z-index:3;background:var\(--color-bg\)\}/, 'the cover, in the sheet');
  });
  test('igAnalyze records the contract per sitting, in memory, and puts the paper up', () => {
    const w = world([fixture('MK-1')]); const { win } = w; hosts(win);
    win.igAnalyze('MK-1');
    const p = win.intel.paper;
    assert.ok(p && p.id === 'MK-1' && p.mode === 'paper' && Array.isArray(p.pins) && p.pins.length === 0 && p.focus === false);
    assert.equal(win.document.getElementById('ig-strip').hidden, false, 'the strip is drawn');
    assert.equal(win.document.getElementById('ig-paper').hidden, false, 'the paper is up');
    assert.ok(win.document.getElementById('ig-canvas'), 'the paper carries its own canvas id');
    assert.ok(win.document.getElementById('ig-svg'), 'the graph is still there underneath');
  });
  test('a second Analyze on the same contract keeps its pins; another contract starts a fresh paper', () => {
    const w = world([fixture('MK-1'), fixture('MK-2')]); const { win } = w; hosts(win);
    win.igAnalyze('MK-1'); win.intel.paper.pins.push({ n: 1, turn: 0, k: 0, text: 'x' }); win.intel.paper.seq = 1;
    win.igAnalyze('MK-1'); assert.equal(win.intel.paper.pins.length, 1);
    win.igAnalyze('MK-2'); assert.equal(win.intel.paper.id, 'MK-2'); assert.equal(win.intel.paper.pins.length, 0);
  });
  test('the paper is the working copy\'s ONE builder, asked for a read-only copy with its own canvas', () => {
    assert.match(region(IG, 'igPaperHtml'), /docSheetHtml\(c,\{ copy:'work', canvasId:'ig-canvas', readOnly:true \}\)/);
    const d = region(CT, 'docSheetHtml');
    assert.match(d, /const mode=o\.copy\|\|docCopyOf\(c\);/);
    assert.match(d, /id="\$\{o\.canvasId\|\|'doc-canvas'\}"/);
    assert.match(d, /\(!o\.readOnly&&docFillable\(c\)\)\?docBody\(c\):readOnlyDocHtml\(docBody\(c\)\)/);
  });
  test('[wall] the room\'s own call is unchanged: docSheetHtml(c) still draws #doc-canvas and decides the copy by the tab', () => {
    assert.match(CT, /docSheetHtml\(c\)/);
    assert.match(region(CT, 'docSheetHtml'), /\|\|'doc-canvas'/);
  });
  test('the pages are the Document tab\'s own page-maker with its own options', () => {
    const p = region(IG, 'igPaperPaginate');
    assert.match(p, /pagesWatch\(sheet,\{ mode:'work', gap:window\.PG_GAP, corners:true,/);
    assert.match(p, /pagesLetterheadName\(c\)/);
  });
});

describe('f392 (3) the questions follow the switch, and go out with the wording', () => {
  test('intelAsk sends a question to the paper first, and only while the paper is up', () => {
    const a = code(region(IG, 'intelAsk'));
    assert.match(a, /if\(igPaperUp\(\)\)\s+await igPaperAsk\(q\);/);
    assert.ok(a.indexOf('igPaperUp()') < a.indexOf('IG_COMPLIANCE_RE.test(q)'), 'asked before the classifier');
    assert.match(region(IG, 'igPaperUp'), /intel\.paper\.mode==='paper'/);
  });
  test('the ask carries the wording as the last message, says wholeDoc, names the contract, and asks for verbatim quotes', () => {
    const a = code(region(IG, 'igPaperAsk'));
    assert.match(a, /THE WORDING OF \$\{ref\}/);
    assert.match(a, /wholeDoc:true/);
    assert.match(a, /activeContractId:c\.id/);
    assert.match(a, /IG_PAPER_RULE/);
    assert.match(IG, /const IG_PAPER_RULE='[^']*character for character[^']*'/);
    assert.match(a, /msgs\.pop\(\)/, 'the history keeps only the question; the wording rides the outgoing copy');
    assert.match(a, /IG_QUIET/, 'quiet like every other call on this page');
  });
  test('the wording is this page\'s own reader of it', () => {
    assert.match(region(IG, 'igPaperText'), /contractPlainText\(c\)/);
  });
  test('the box says which contract, and its hover says the cost', () => {
    assert.match(region(IG, 'igAskPlaceholder'), /int_ask_contract/);
    assert.match(region(IG, 'igAskCost'), /int_ask_contract_cost/);
    assert.match(region(IG, 'renderIntelDock'), /placeholder="\$\{igEsc\(igAskPlaceholder\(\)\)\}" title="\$\{igEsc\(igAskCost\(\)\)\}"/);
  });
  test('no engine: the paper ask hands to intelChatAsk, whose nudge is the page\'s one', () => {
    assert.match(code(region(IG, 'igPaperAsk')), /copilotAvailable\(\)\)\) return intelChatAsk\(q\);/);
  });
});

describe('f392 (4) the server checks a quote against what the model was shown', () => {
  test('both chat routes hand the wholeDoc message to the quote check', () => {
    assert.equal((SRV.match(/if \(wholeDoc\) cx\.sentText = convo\[convo\.length - 1\]\.content;/g) || []).length, 2);
  });
  test('normalizeDeliver keeps a quote found in the stored body OR in the sent wording, and still drops one in neither', () => {
    const n = code(region(SRV, 'normalizeDeliver'));
    assert.match(n, /const sent = \(cx && typeof cx\.sentText === 'string' && cx\.sentText\) \? quoteNorm\(cx\.sentText\) : '';/);
    assert.match(n, /if \(body\.includes\(nq\)\) continue;\s*if \(sent && sent\.includes\(nq\)\) continue;/);
    assert.match(n, /c\.quote = '';\s*c\.quoteDropped = true;/, 'the drop is still there');
  });
  test('[wall] contractFullBody holds no template paper — which is why the sent copy has to be read', () => {
    assert.doesNotMatch(region(SRV, 'contractFullBody'), /templateFormDocHtml|docBody\(/);
  });
});

describe('f392 (5) a passage is a pin, a chip and a lit mark — and only this contract\'s', () => {
  test('igPinsMint reads the citations for this contract only, dedupes, and mints one pin per passage', () => {
    const w = world([fixture('MK-1'), fixture('MK-2')]); const { win } = w; hosts(win);
    win.igAnalyze('MK-1');
    win.intel.history.push({ role: 'user', text: 'q' });
    win.intel.history.push({ role: 'assistant', text: 'a' });
    const turn = win.intel.history.length - 1;
    win.igPinsMint(win.getContract('MK-1'), { citations: [
      { id: 'MK-1', quote: 'The total contract value is payable within thirty days.' },
      { id: 'MK-1', quote: 'The total contract value is payable within thirty days.' },
      { id: 'MK-2', quote: 'Another contract\'s words never pin this paper.' },
      { id: 'MK-1', quote: 'short' } ] }, turn);
    const m = win.intel.history[turn];
    assert.equal(m.paperId, 'MK-1');
    assert.equal(m.quotes.length, 1, 'deduped, the other contract dropped, a short one dropped');
    assert.equal(win.intel.paper.pins.length, 1);
    assert.deepEqual([win.intel.paper.pins[0].n, win.intel.paper.pins[0].turn, win.intel.paper.pins[0].k], [1, turn, 0]);
    /* Field by field: an object born in jsdom's realm never deepEquals one
       born here (a different Object.prototype) — the f356 lesson. */
    assert.ok(win.intel.paper.on && win.intel.paper.on.turn === turn && win.intel.paper.on.k === 0, 'the first passage is the lit one');
  });
  test('an answer with no passage says so — once, and not beside the server\'s own notice', () => {
    const w = world([fixture('MK-1')]); const { win } = w; hosts(win);
    win.igAnalyze('MK-1');
    win.intel.history.push({ role: 'assistant', text: 'a' });
    const t = win.intel.history.length - 1;
    win.igPinsMint(win.getContract('MK-1'), { citations: [] }, t);
    assert.match(win.igCitesHtml(win.intel.history[t], t), /ig-nothing/);
    win.intel.history.push({ role: 'assistant', text: 'b' });
    const t2 = win.intel.history.length - 1;
    win.igPinsMint(win.getContract('MK-1'), { citations: [], notice: 'One quoted excerpt could not be matched' }, t2);
    assert.equal(win.igCitesHtml(win.intel.history[t2], t2), '', 'the notice already says it');
  });
  test('the chip carries its pin number and the way to light it; an obligation\'s passage is amber', () => {
    const w = world([fixture('MK-1', { obligations: [{ id: 'o1', desc: 'Pay', quote: 'The buyer shall pay each invoice within thirty (30) days of its date.' }] })]);
    const { win } = w; hosts(win);
    win.igAnalyze('MK-1');
    win.intel.history.push({ role: 'assistant', text: 'a' });
    const t = win.intel.history.length - 1;
    win.igPinsMint(win.getContract('MK-1'), { citations: [{ id: 'MK-1', quote: 'The buyer shall pay each invoice within thirty (30) days of its date.' }] }, t);
    const html = win.igCitesHtml(win.intel.history[t], t);
    assert.match(html, /class="ig-cite ob is-on" data-ig-cite="\d+:0"/);
    assert.match(html, /<span class="ig-cite-n">1<\/span>/);
    assert.equal(win.intel.paper.pins[0].ob, true);
  });
  test('the marks are the risk scan\'s own, held; the pin is stamped on them; the walk reads the graph\'s canvas', () => {
    const p = code(region(IG, 'igPinsPaint'));
    assert.match(p, /scrollToQuote\(pin\.text,\{ root:canvas, hold:true, cls:'ig-mark'\+\(pin\.ob\?' ob':''\), pin:pin\.n, scroll:false \}\)/);
    const s = code(region(AI, 'scrollToQuote'));
    assert.match(s, /const root=o\.root\|\|scanCanvas\(\);/);
    assert.match(s, /if\(!o\.hold\) mark\.style\.cssText=/, 'the flash colours stay the flash\'s');
    assert.match(s, /if\(o\.pin!=null\) mark\.setAttribute\('data-ig-pin',String\(o\.pin\)\);/);
    assert.match(s, /if\(o\.hold\) return true;\s*setTimeout/, 'a held mark is never taken off by the timer');
    assert.match(s, /if\(o\.scroll!==false\)\{/);
  });
  test('[wall] scrollToQuote with no options is the flash it always was', () => {
    const s = code(region(AI, 'scrollToQuote'));
    assert.match(s, /mark\.className=o\.cls\|\|'anchor-flash';/);
    assert.match(s, /\}, 6000\);/);
  });
  test('scanCanvas names the graph\'s paper third, after the two it had', () => {
    assert.match(code(region(AI, 'scanCanvas')), /getElementById\('doc-canvas'\)\s*\|\|\s*document\.getElementById\('rl-doc'\)\s*\|\|\s*document\.getElementById\('ig-canvas'\)/);
  });
  test('a pin in the margin finds its answer in the panel', () => {
    const p = code(region(IG, 'igPaperWire'));
    assert.match(p, /button\[data-ig-pin\]/);
    assert.match(p, /\[data-ig-turn="\$\{pin\.turn\}"\]/);
    assert.match(region(IG, 'igMsgHTML'), /data-ig-turn="\$\{i\}"/);
  });
});

describe('f392 (6) the switch, Focus, the bin — and nothing is thrown away', () => {
  test('Graph hides the paper and keeps it; Paper brings it back; the strip stays either way', () => {
    const w = world([fixture('MK-1')]); const { win } = w; hosts(win);
    win.igAnalyze('MK-1');
    const canvas = win.document.getElementById('ig-canvas');
    win.intel.paper.mode = 'graph'; win.igPaintPaper();
    assert.equal(win.document.getElementById('ig-paper').hidden, true);
    assert.equal(win.document.getElementById('ig-canvas'), canvas, 'the same element, kept');
    assert.equal(win.document.getElementById('ig-strip').hidden, false);
    assert.match(win.document.getElementById('ig-strip').innerHTML, /data-ig-mode="graph" aria-pressed="true"/);
    assert.doesNotMatch(win.document.getElementById('ig-strip').innerHTML, /data-ig-focus|data-ig-pins-clear/, 'the paper\'s own controls stand down');
    win.intel.paper.mode = 'paper'; win.igPaintPaper();
    assert.equal(win.document.getElementById('ig-paper').hidden, false);
    assert.equal(win.document.getElementById('ig-canvas'), canvas, 'still the same element');
  });
  test('the strip carries the switch, the reference, the pins count and Clear, Focus, Open workspace — in that order', () => {
    const w = world([fixture('MK-1')]); const { win } = w; hosts(win);
    win.igAnalyze('MK-1'); win.intel.paper.pins.push({ n: 1, turn: 0, k: 0, text: 'x' }); win.igPaintPaper();
    const s = win.document.getElementById('ig-strip').innerHTML;
    const order = ['data-ig-mode="graph"', 'data-ig-mode="paper"', 'ig-strip-ref', 'ig-strip-pins', 'data-ig-pins-clear', 'data-ig-focus', 'data-ig-ws'].map(k => s.indexOf(k));
    assert.ok(order.every(i => i >= 0) && order.every((v, i) => i === 0 || v > order[i - 1]), order.join(','));
    assert.match(s, /1 pin</);
  });
  test('Focus folds the head on the element it lives on and never with !important; Escape puts it back', () => {
    const w = world([fixture('MK-1')]); const { win } = w; hosts(win);
    win.igAnalyze('MK-1');
    win.intel.paper.focus = true; win.igPaintPaper();
    assert.equal(win.document.getElementById('ig-head').style.display, 'none');
    assert.ok(win.document.getElementById('ig-page').classList.contains('ig-focus'));
    win.intel.paper.focus = false; win.igPaintPaper();
    assert.equal(win.document.getElementById('ig-head').style.display, 'flex');
    assert.doesNotMatch(HTML.slice(HTML.indexOf('ANALYZE CONTRACT — the paper in the graph'), HTML.indexOf('#ig-page.ig-focus > #ig-note')), /!important/);
    assert.match(BLOCK, /e\.key!=='Escape'/);
  });
  test('the bin ends the analysis with the conversation', () => {
    assert.match(code(region(IG, 'renderIntelDock')), /intel\.history=\[\]; intel\.compareSel=\[\]; intel\.paper=null; igPaintPaper\(\);/);
    const w = world([fixture('MK-1')]); const { win } = w; hosts(win);
    win.igAnalyze('MK-1'); win.intel.paper = null; win.igPaintPaper();
    assert.equal(win.document.getElementById('ig-strip').hidden, true);
    assert.equal(win.document.getElementById('ig-canvas'), null);
  });
  test('a paper whose contract has gone is put away, never drawn', () => {
    const w = world([fixture('MK-1')]); const { win } = w; hosts(win);
    win.igAnalyze('MK-1'); win.state.contracts = []; win.igPaintPaper();
    assert.equal(win.intel.paper, null);
    assert.equal(win.document.getElementById('ig-strip').hidden, true);
  });
});

describe('f392 (7) the map is the X-ray\'s own walk over this canvas', () => {
  test('docReadSheet and docXrayRows take a root, and the default is the Document tab\'s canvas', () => {
    assert.match(region(CT, 'docReadSheet'), /function docReadSheet\(c, root\)\{\s*const canvas=root\|\|document\.getElementById\('doc-canvas'\);/);
    assert.match(region(CT, 'docXrayRows'), /docReadSheet\(c, root\)/);
    assert.match(region(IG, 'igStrandPaint'), /docXrayRows\(c,canvas\)/);
  });
  test('the answers\' clauses join the map in steel and never outrank a scan or playbook mark; the strip takes the Document tab\'s own width', () => {
    const s = code(region(IG, 'igStrandPaint'));
    assert.match(s, /if\(!row\.tone\) row\.tone='steel';/);
    assert.match(s, /docXraySpineRows\(rows\)/);
    /* RE-POINTED 28 Sep 2026 (Young picked "Ask" for this strip): the same
       builder, now asked for the clause numbers on its blocks. */
    assert.match(s, /docXraySpineHtml\(rows,\{ numbers:true \}\)/);
    assert.match(s, /window\.DOC_XRAY_SPINE_W/);
    assert.match(CT, /docXraySpineHtml,docXraySpineRows,/, 'the filter is published, so the graph file can ask it');
  });
});

describe('f392 (8) the walls: no route, no store, no field, no write', () => {
  test('the block reaches no route and writes nothing to the record', () => {
    const b = code(BLOCK);
    assert.ok(b.length > 2000, 'the block is found by its own markers');
    assert.doesNotMatch(b, /\bapi\(|\bfetch\(|persist\(|flushSaves\(|lsSet\(|localStorage/);
    assert.doesNotMatch(b, /changes\.push|negoFileChange\(|negoInit\(|negoEditClause\(|negoInsertClause\(/);
    assert.doesNotMatch(b, /c\.[a-zA-Z]+\s*=[^=]/, 'no field on the contract is written');
  });
  test('reading must not write: the readings the block asks read the record raw', () => {
    const b = code(BLOCK);
    assert.doesNotMatch(b, /negoChanges\(|negoAllChanges\(|negoRound\(|negoClauseList\(/);
  });
  test('every new name is published, and the state is on intel, per sitting', () => {
    ['igPaperUp', 'igAnalyze', 'igPaintPaper', 'igPaperAsk', 'igPinsMint', 'igLight', 'igCitesHtml', 'igStripHtml', 'igStrandPaint']
      .forEach(n => assert.match(IG, new RegExp('Object\\.assign\\(window,\\{[^}]*\\b' + n + '\\b')));
    assert.match(IG, /paper:null,/);
  });
});
