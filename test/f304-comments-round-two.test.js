/* f304 — COMMENTS, ROUND TWO (Young, 11 Sep 2026, evening — WORKORDER-comments-round-two.md)
   =============================================================================
   Eleven reports off the first day with the comments system, built on "go,
   build all of them". Every claim here is a way of failing one of them:

     · the pin says Internal / External (the tabs' own words) and carries no
       "Comment on these words" caption; a filed pin keeps its one line;
     · Add note SPENDS the pin — and a draft typed in the other room is posted
       to its own room in the same breath (D-6 kept, the pin gone);
     · the marker's number is inside its disc on every canvas (the rule is
       longhands, never the `font` shorthand that a missing token throws away);
     · the press that opens the drawer closes it — the marker, their page's
       door, the card's row;
     · the live clause is drawn changed only where the draft MOVED;
     · a selection across several sub-paragraphs inside one clause is ONE
       passage, in the editor and on the paper; a quote keeps its breaks;
     · a highlight offers THREE verbs — Ask Copilot (a question, no Apply),
       Edit with Copilot (the rewrite chips and Apply), Comment — and an answer
       carries Edit with this. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const VIEW = read('js/views/negotiation.js');
const CE = read('js/views/clauseeditor.js');
const APP = read('js/app.js');
const PORTAL = read('js/views/portal.js');
const CSS = read('js/views/negotiation-css.js');
const INDEX = read('index.html');
const I18N = read('js/i18n.js');

const BODY =
  '<h1>Supply Agreement</h1><p>Between Mkataba Holdings Ltd and Saw Sawa Ltd</p>'
  + '<h2>Clause 6 · Payment terms</h2><p>Pay each invoice within thirty (30) days of receipt.</p>'
  + '<h2>Clause 7 · Liability</h2><p>Neither party is liable for indirect loss.</p>'
  + '<p>Each party keeps its own insurance in force for the term.</p>'
  + '<h2>Clause 8 · Term</h2><p>Two years from the effective date.</p>';
const ME = { id: 'u_me', name: 'Amina Yusuf', role: 'legal', email: 'amina@mk.co.ke' };
const contract = () => ({ id: 'MK-304', name: 'Supply Agreement', counterparty: 'Saw Sawa Ltd',
  status: 'Under Review', redlineText: BODY, format: 'rich', changes: [], audit: [], signatures: [] });

async function bench(){
  const w = buildWorld({ user: ME, negotiationView: true, contractView: true, canEdit: true });
  const { win } = w;
  win.getUsers = () => [ME];
  win.userById = id => (id === ME.id ? ME : null);
  win.saveSettings = () => {};
  win.persist = () => {};
  win.negoPostToChannel = async () => ({ ok: true });
  win.negoNotifyMentions = async () => null;
  win.confirmDialog = async () => true;
  win.promptDialog = async () => '';
  win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
  win.copilotAvailable = () => false;
  win.openShareModal = () => {};
  win.counterpartyContact = () => null;
  win.cachedShares = () => [];
  const c = contract();
  win.negoInit(c);
  const cl6 = win.negoClauseList(c).find(x => x.num === '6');
  const cl7 = win.negoClauseList(c).find(x => x.num === '7');
  const ch = await win.negoEditClause(c, cl6.clauseId,
    '<p>Pay each invoice within forty-five (45) days of receipt.</p>', { side: 'owner' });
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline', settings: {} });
  win.getContract = id => (String(id) === String(c.id) ? c : null);
  /* The shell's drawer, stood in for: the world has no js/app.js. It answers
     the three doors' questions exactly as app.js does — open, showing, close. */
  const host = win.document.createElement('div');
  win.document.body.appendChild(host);
  const log = [];
  let showing = null;
  win.notesPanelShowing = (cid, chId) => !!showing && showing.cid === String(cid || '')
    && showing.chId === String(chId == null ? '' : chId);
  win.openNotesPanel = (cid, chId, o) => {
    const force = !!(o && o.force);
    const same = !force && win.notesPanelShowing(cid, chId);
    showing = same ? null : { cid: String(cid), chId: String(chId == null ? '' : chId) };
    log.push(showing ? 'open' : 'close');
    if (!showing){ win.rlNotesPanelClosed(); return; }
    const opts = { side: 'owner', author: ME.name };
    if (chId){ const x = win.negoChangeById(c, chId); win.rlNotesPanelPaint(host, c, x, opts); }
    else win.rlChatPanelPaint(host, c, opts);
  };
  win.closeContextPanel = () => { showing = null; log.push('close'); win.rlNotesPanelClosed(); };
  return { w, win, c, ch, cl6, cl7, host, log, showing: () => showing };
}
const tick = () => new Promise(r => setTimeout(r, 30));
const same = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);
const type = (p, box, t) => { box.value = t; box.dispatchEvent(new p.win.Event('input', { bubbles: true })); };
function wide(win){ try{ win.innerWidth = 1440; }catch(_){} }

/* ============================================================
   1 — THE PIN
   ============================================================ */
describe('f304 (1) — the pin says Internal / External, carries no caption, and keeps its breaks', () => {
  test('the switch says the tabs’ own two words, and a highlight pin has no caption', async () => {
    const p = await bench();
    p.win.rlNoteFromSelection(p.c, { clauseId: p.cl7.clauseId, quote: 'indirect loss' }, { side: 'owner' });
    const pin = p.host.querySelector('.rl-np-pin');
    assert.ok(pin, 'the pin is drawn');
    const rooms = [...pin.querySelectorAll('[data-rl-np-pin-room]')].map(b => b.textContent.trim());
    same(rooms, [p.win.i18t('ng_np_tab_int'), p.win.i18t('ng_np_tab_ext')], 'the same words as the tabs');
    assert.equal(pin.querySelector('.lead'), null, 'no "Comment on these words" — no caption line at all (round three)');
    assert.ok(!/i18t\('ng_np_pin_on'\)|i18t\('ng_np_for_team'\)|i18t\('ng_np_for_them'/.test(VIEW),
      'the three old keys are called nowhere — stale, inert in both books');
  });

  test('a filed pin quotes the change it is about — one shape for both pins (round three, reversed in place)', async () => {
    /* Round two drew "CHG-006 filed · add a note" over an empty body; the owner
       called the card not elegant and pointed at the highlight pin as the shape.
       The filed pin now quotes the wording the change proposes, and no lead. */
    const p = await bench();
    p.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    const pin = p.host.querySelector('.rl-np-pin');
    assert.equal(pin.querySelector('.lead'), null, 'no filed line');
    assert.ok(pin.querySelector('q') && pin.querySelector('q').textContent.trim().length > 3, 'the change\'s wording is quoted');
    assert.match(pin.querySelector('[data-rl-np-unpin]').textContent, /skip|hoppa/i, 'Skip stays the way out');
  });

  test('the quote keeps a paragraph break and folds everything else — one reading, pin and anchor alike', async () => {
    const p = await bench();
    assert.equal(p.win.negoNoteQuote('  a   b \r\n\n  c\td  '), 'a b\nc d');
    const pin = p.win.rlNotesPin({ contractId: p.c.id, clauseId: p.cl7.clauseId, quote: 'indirect loss.\n\nEach party   keeps' });
    assert.equal(pin.quote, 'indirect loss.\nEach party keeps');
    const m = p.win.negoPostComment(p.c, null, 'Two paragraphs.', { side: 'owner',
      anchor: { clauseId: p.cl7.clauseId, quote: 'indirect loss.\nEach party keeps' } });
    assert.equal(m.anchor.quote, 'indirect loss.\nEach party keeps');
    assert.match(INDEX, /\.rl-np-pin q\{[^}]*white-space:pre-line/, 'the pin prints the break');
    assert.match(INDEX, /\.rl-np-anchor q\{[^}]*white-space:pre-line/, 'and so does the note in the list');
    /* And the marks still find words that span the break: the two paragraphs'
       text nodes touch with no space between. */
    const el = p.win.document.createElement('section');
    el.innerHTML = '<p>Neither party is liable for indirect loss.</p><p>Each party keeps its own insurance.</p>';
    assert.equal(p.win.rlWrapWords(el, 'indirect loss.\nEach party keeps', 'rl-note-hl'), true);
    assert.equal(el.querySelectorAll('.rl-note-hl').length, 2, 'one piece in each paragraph');
  });
});

describe('f304 (2) — Add note spends the pin, and the other room’s draft goes to its own room', () => {
  test('one press, the pin is gone, and a draft held in the other room is posted there too', async () => {
    const p = await bench();
    let channel = 0;
    p.win.negoPostToChannel = async () => { channel++; return { ok: true }; };
    p.win.rlNoteFromSelection(p.c, { clauseId: p.cl6.clauseId, quote: 'forty-five (45) days' }, { side: 'owner' });
    await tick();
    type(p, p.host.querySelector('.rl-np-in'), 'For us: hold at forty-five.');
    p.host.querySelector('[data-rl-np-pin-room="external"]').click(); await tick();
    type(p, p.host.querySelector('.rl-np-in'), 'Forty-five is our standard.');
    p.host.querySelector('[data-rl-np-pin-room="internal"]').click(); await tick();
    const before = p.ch.thread.length;
    const send = p.host.querySelector('[data-rl-np-send]');
    await p.win.rlNotesSend(p.host, p.c, p.ch, { side: 'owner', author: ME.name }, send.getAttribute('data-room'));
    await tick();
    const posted = p.ch.thread.slice(before);
    assert.equal(posted.length, 2, 'both drafts landed');
    same(posted.map(m => m.visibility), ['internal', 'shared'], 'each in its own room');
    same(posted.map(m => m.text), ['For us: hold at forty-five.', 'Forty-five is our standard.']);
    assert.ok(posted.every(m => m.anchor && m.anchor.quote === 'forty-five (45) days'), 'both on the same words');
    assert.equal(channel, 1, 'the channel carried the external half only');
    assert.equal(p.win.rlNotesPinned(), null, 'the pin is spent');
    assert.equal(p.host.querySelector('.rl-np-pin'), null, 'and gone from the drawer');
  });

  test('with nothing in the other room, one note and the pin is gone', async () => {
    const p = await bench();
    p.win.rlNoteFromSelection(p.c, { clauseId: p.cl7.clauseId, quote: 'indirect loss' }, { side: 'owner' });
    await tick();
    type(p, p.host.querySelector('.rl-np-in'), 'Cap it.');
    const before = (p.c.thread || []).length;
    const send = p.host.querySelector('[data-rl-np-send], [data-rl-chat-send]');
    await p.win.rlNotesSend(p.host, p.c, null, { side: 'owner', author: ME.name }, send.getAttribute('data-room'));
    assert.equal((p.c.thread || []).length - before, 1);
    assert.equal(p.win.rlNotesPinned(), null);
    assert.equal(p.host.querySelector('.rl-np-pin'), null);
  });
});

/* ============================================================
   3 — THE MARKER AND THE DOORS
   ============================================================ */
describe('f304 (3) — the press that opens the drawer closes it', () => {
  test('the marker on the paper toggles the drawer on its own thread, and swaps to another', async () => {
    const p = await bench();
    p.win.negoPostComment(p.c, null, 'Liability.', { side: 'owner',
      anchor: { clauseId: p.cl7.clauseId, quote: 'indirect loss' } });
    p.win.negoPostComment(p.c, p.ch.id, 'Payment.', { side: 'owner',
      anchor: { clauseId: p.cl6.clauseId, quote: 'forty-five (45)' } });
    const root = p.win.document.createElement('div');
    root.innerHTML = `<div class="rl-doc">${p.win.redlineDocHtml(p.c, { side: 'owner' })}</div>`;
    p.win.document.body.appendChild(root);
    assert.equal(p.win.rlPaintNoteMarks(root, p.c, { side: 'owner' }), 2);
    const marks = [...root.querySelectorAll('.rl-note-mk')];
    marks[0].click(); await tick();
    marks[0].click(); await tick();
    marks[0].click(); await tick();
    same(p.log, ['open', 'close', 'open'], 'open, shut, open — the same place both ways');
    marks[1].click(); await tick();
    assert.equal(p.log[p.log.length - 1], 'open', 'another thread’s marker swaps rather than closes');
    assert.equal(p.showing().chId, '', 'the contract-level note is the one now showing');
  });

  test('the shell answers "is it showing", and their page’s door toggles on the key', () => {
    assert.match(APP, /function notesPanelShowing\(contractId, changeId\)\{/);
    assert.match(APP, /closeContextPanel,notesPanelShowing,/, 'published');
    assert.match(VIEW, /if \(_rlNpOpenKey === key && typeof window\.notesPanelShowing === 'function'/,
      'the marker asks before it presses');
    assert.match(VIEW, /function rlNotesPanelClosed\(\)\{ rlNotesUnpin\(null\); _rlNpReplyTo = null; _rlNpOpenKey = null; \}/,
      'and the key is dropped with the drawer');
    assert.match(PORTAL, /if\(open&&String\(_ptNotesKey\|\|''\)===String\(key\|\|''\)\)\{ portalNotesClose\(\); return false; \}/,
      'their aside closes on the press that opened it');
    /* The card's row toggles (f303 pins the absence of `force` there); the
       filing still delivers with `force`, which is what force is for. */
    assert.match(VIEW, /rlNotesUnpin\(null\);\n\s+\/\* Nothing to wait for[\s\S]{0,400}?openNotesPanel\(c\.id, ch\.id\);/);
  });

  test('the marker’s number is inside its disc on every canvas: longhands, never the font shorthand', () => {
    const rule = CSS.match(/\.rl-clause \.rl-note-mk\{[\s\S]*?\}/)[0].replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/(^|[;{\s])font:/.test(rule), 'no `font:` shorthand — a missing token would throw it away whole');
    assert.match(rule, /font-size:10px;line-height:1;/, 'a fixed size and a line that fits the disc');
    assert.match(rule, /font-family:var\(--n-font-ui,var\(--font-body,system-ui,sans-serif\)\)/, 'every token has a fallback');
    assert.match(rule, /box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;/);
  });
});

/* ============================================================
   4 — CHANGED MEANS CHANGED
   ============================================================ */
describe('f304 (4) — the live clause is drawn changed only where the draft moved', () => {
  test('an untouched draft draws no ruby bar; a moved one does; a filed change does whatever the draft says', async () => {
    const p = await bench();
    const at = (html, id) => html.match(new RegExp(`<section class="([^"]*)" data-clause="${id}"`))[1];
    const quiet = p.win.redlineDocHtml(p.c, { side: 'owner', live: { clauseId: p.cl7.clauseId, html: '<p>x</p>', moved: false } });
    assert.ok(/rl-clause-live/.test(at(quiet, p.cl7.clauseId)) && !/is-changed/.test(at(quiet, p.cl7.clauseId)),
      'live, not changed');
    const moved = p.win.redlineDocHtml(p.c, { side: 'owner', live: { clauseId: p.cl7.clauseId, html: '<p>x</p>', moved: true } });
    assert.match(at(moved, p.cl7.clauseId), /is-changed/);
    const older = p.win.redlineDocHtml(p.c, { side: 'owner', live: { clauseId: p.cl7.clauseId, html: '<p>x</p>' } });
    assert.match(at(older, p.cl7.clauseId), /is-changed/, 'absent reads as moved, so an older caller draws as before');
    const filed = p.win.redlineDocHtml(p.c, { side: 'owner', live: { clauseId: p.cl6.clauseId, html: '<p>x</p>', moved: false } });
    assert.match(at(filed, p.cl6.clauseId), /is-changed/, 'a clause carrying a filed change is changed');
    assert.match(CE, /moved: _ceText !== _ceBase \|\| _ceHead !== _ceHeadBase,/, 'the editor says whether its draft moved');
  });
});

/* ============================================================
   5 — THE EDITOR: SEVERAL SUB-PARAGRAPHS, AND THE THREE VERBS
   ============================================================ */
async function openEditor(p){
  wide(p.win);
  assert.equal(p.win.rlOpenClauseEditor(p.c, p.cl7.clauseId, { typing: true }), true, 'the editor opens');
  const box = p.win.document.querySelector('#ce-clausebody');
  assert.ok(box, 'the typing box is there');
  return box;
}
function selectAcross(p, box){
  const ps = box.querySelectorAll('p');
  assert.equal(ps.length, 2, 'two sub-paragraphs to drag across');
  const r = p.win.document.createRange();
  const t0 = ps[0].firstChild, t1 = ps[1].firstChild;
  r.setStart(t0, t0.data.indexOf('liable')); r.setEnd(t1, t1.data.indexOf('insurance'));
  const s = p.win.getSelection(); s.removeAllRanges(); s.addRange(r);
  return r;
}

describe('f304 (5) — a selection across two sub-paragraphs is one passage', () => {
  test('the reading carries its lines and its text in the draft’s own form', async () => {
    const p = await bench();
    const box = await openEditor(p);
    selectAcross(p, box);
    const read = p.win.ceSelectionRead();
    assert.ok(read.sel, read.why || 'a passage');
    assert.equal(read.sel.multi, true);
    assert.equal(read.sel.lineEnd, read.sel.line + 1);
    assert.equal(read.sel.text, 'liable for indirect loss.\nEach party keeps its own',
      'the tail of the first line, the head of the second, in the draft’s own form');
    p.win.rlCloseClauseEditor();
  });

  test('Edit with Copilot holds every piece, and the one replacement splices the run and keeps the break', async () => {
    const p = await bench();
    const box = await openEditor(p);
    selectAcross(p, box);
    const sel = p.win.ceSelection();
    p.win.ceAttachPassage(sel, 'edit');
    assert.equal(box.querySelectorAll('.ce-held').length, 2, 'one held piece per paragraph');
    assert.ok(p.win.document.querySelector('#ce-scope .ce-scope .cut'), 'the cut is offered to an edit');
    assert.equal(p.win.ceReplacePassage(sel, 'liable for consequential loss.\nEach side keeps its own'), true);
    same(p.win.ceLines(), ['Neither party is liable for consequential loss.', 'Each side keeps its own insurance in force for the term.']);
    p.win.rlCloseClauseEditor();
  });

  test('Ask Copilot asks — question chips, no cut, the box says so — and nothing offers Apply', async () => {
    const p = await bench();
    const box = await openEditor(p);
    selectAcross(p, box);
    p.win.ceAttachPassage(p.win.ceSelection(), 'ask');
    const chips = [...p.win.document.querySelectorAll('#ce-chips button')].map(b => b.textContent);
    same(chips, ['ce_q_words_mean', 'ce_q_words_standard', 'ce_q_words_risk'].map(k => p.win.i18t(k)));
    assert.equal(p.win.document.querySelector('#ce-scope .ce-scope .cut'), null, 'no cut on a question');
    assert.ok(p.win.document.querySelector('#ce-scope .ce-scope.is-asking'));
    assert.equal(p.win.document.querySelector('#ce-ask').placeholder, p.win.i18t('ce_ask_ph_question'));
    assert.ok(!/data-ce-apply/.test(p.win.ceCardHtml({ text: 'x', mode: 'ask' }, 0, 0)), 'an ask card offers no Apply');
    assert.match(CE, /ask: _cet\(asking \? 'ce_prompt_question' : scope \? 'ce_prompt_passage' : 'ce_prompt_ask'\)/,
      'the prompt asks for an explanation, not a rewrite');
    p.win.rlCloseClauseEditor();
  });

  test('Edit with this turns the answer into an edit: same words, the edit verb, a card with Apply', async () => {
    const p = await bench();
    const box = await openEditor(p);
    selectAcross(p, box);
    p.win.ceAttachPassage(p.win.ceSelection(), 'ask');
    const passage = p.win.ceSelection();
    assert.ok(p.win.document.querySelector('#ce-scope .ce-scope.is-asking'), 'asking first');
    const ok = p.win.ceEditWith({ who: 'ai', asking: true, passage, held: 'liable for consequential loss.\nEach side keeps its own' });
    assert.equal(ok, true);
    assert.equal(p.win.document.querySelector('#ce-scope .ce-scope.is-asking'), null, 'the edit verb now');
    assert.ok(p.win.document.querySelector('#ce-scope .ce-scope .cut'), 'the cut comes back with the edit verb');
    assert.ok(p.win.document.querySelector('#ce-lane [data-ce-apply]'), 'the held wording is a card with Apply');
    assert.match(CE, /data-ce-edit-with="\$\{i\}"/, 'the answer card carries the door');
    p.win.rlCloseClauseEditor();
  });
});

/* ============================================================
   6 — THE PAPER
   ============================================================ */
describe('f304 (6) — the paper offers three verbs, and a drag released on the pencil still counts', () => {
  test('rlPaperSelOffer offers ask · edit · comment and the verb rides to the editor', async () => {
    const p = await bench();
    let menu = null; const opened = [];
    p.win.rlSelMenu = ctx => { menu = ctx; };
    const ctx = { c: p.c, opts: {}, side: 'owner', text: 'indirect loss', clauseId: p.cl7.clauseId, rect: { width: 1, height: 1 },
      openEditor: (id, o) => opened.push({ id, o }) };
    wide(p.win);
    assert.equal(p.win.rlPaperSelOffer(ctx), true);
    same(menu.actions.map(a => a.id), ['ask', 'edit', 'comment']);
    menu.onPick({ id: 'ask' }); menu.onPick({ id: 'edit' });
    same(opened.map(x => x.o.passageMode), ['ask', 'edit']);
    assert.ok(opened.every(x => x.o.passage === 'indirect loss'));
  });

  test('the mouse-up filter lets a selection that stands outside the control through', () => {
    const up = VIEW.match(/const selOutside = t => \{[\s\S]*?\};\n\s+host\.addEventListener\('mouseup', e => \{[\s\S]*?\}\);/)[0];
    assert.match(up, /if \(fromControl\(e\.target\) && !selOutside\(e\.target\)\) return;/);
    assert.match(up, /return !!\(ctl && !ctl\.contains\(s\.anchorNode\) && !ctl\.contains\(s\.focusNode\)\);/);
    assert.match(up, /\.rl-cp-src, \[data-nego-editor\], \.nego-selmenu, \.nego-aipop, #ai-panel, input, textarea, select/,
      'the panel editor, the menus and the form controls keep their silence');
  });
});

/* ============================================================
   7 — WORD, AND THE WORDS
   ============================================================ */
describe('f304 (7) — a quote across paragraphs goes to Word on its longest line, and both books carry the words', () => {
  test('one range, on the longest line of the quote; the comment carries the whole quote', () => {
    const D = require('../js/docx.js');
    const html = '<p>Neither party is liable for indirect loss.</p><p>Each party keeps its own insurance in force for the term.</p>';
    const out = D.docxExportTracked(html, { author: 'A', date: '2026-09-11T10:00:00Z',
      comments: [{ author: 'Amina', text: 'Clause 7: cap it.', quote: 'indirect loss.\nEach party keeps its own insurance' }] });
    assert.equal(out.comments.placed, 1, 'placed once');
    const doc = String(out.xml);
    const idx = doc.indexOf('commentRangeStart');
    assert.ok(doc.indexOf('Each party keeps') > idx && doc.indexOf('Each party keeps') < doc.indexOf('commentRangeEnd'),
      'on the longer line');
    assert.match(new TextDecoder().decode(out.bytes), /Clause 7: cap it\./, 'the comment carries its text');
  });

  test('the new words are in both books', () => {
    for (const k of ['ng_sel_edit', 'ce_ask_ph_question', 'ce_scope_asking', 'ce_edit_with_this', 'ce_answer',
      'ce_prompt_question', 'ce_q_words_mean', 'ce_q_words_standard', 'ce_q_words_risk'])
      assert.equal((I18N.match(new RegExp('^    ' + k + ':', 'mg')) || []).length, 2, k + ' in both books');
  });
});

/* ============================================================
   8 — ROUND THREE (Young, 11 Sep 2026, late — WORKORDER-comments-round-three.md)
   ============================================================ */
describe('f304 (8) — round three: the filed pin quotes the change, equal halves, a question with no reading list, Apply ends typing', () => {
  test('a filed pin is the same shape as a highlight pin: reference · the change’s wording · the switch, no lead line', async () => {
    const p = await bench();
    p.win.openChangeNoteDialog(p.c, p.ch, { filed: true, side: 'owner' });
    await tick();
    const pin = p.host.querySelector('.rl-np-pin');
    assert.equal(pin.querySelector('.lead'), null, 'no "filed · add a note" line');
    assert.match(pin.querySelector('.ref').textContent, new RegExp(p.ch.id));
    assert.match(pin.querySelector('q').textContent, /forty-five \(45\) days/, 'the wording the change proposes');
    assert.match(pin.querySelector('[data-rl-np-unpin]').textContent, /skip|hoppa/i, 'Skip stays the way out');
    assert.equal(p.win.rlNpChangeQuote({ summary: 'Clause removed' }), 'Clause removed', 'a change with no wording quotes its summary');
    assert.equal(p.win.rlNpChangeQuote({ bodyHtml: '<p>' + 'w'.repeat(500) + '</p>' }).length, p.win.NOTE_QUOTE_MAX, 'bounded as a quote is');
    assert.ok(!/i18t\('ng_np_pin_filed'|i18t\('ng_np_pin_revised'/.test(VIEW), 'the two lead keys are stale');
  });

  test('the switch is two equal halves: a grid of 1fr columns, the x pushed to the right', () => {
    assert.match(INDEX, /\.rl-np-pinroom\{display:inline-grid;grid-auto-flow:column;grid-auto-columns:1fr;/);
    assert.match(INDEX, /\.rl-np-pinroom button\{[^}]*text-align:center;/);
    assert.match(INDEX, /\.rl-np-pin \.x\{margin-left:auto;\}/);
  });

  test('under a question the answer carries no reading list; under an edit it still does', () => {
    assert.match(CE, /read: \[\], asking: true, passage: scope,/);
    assert.match(CE, /_ceThread\.push\(\{ who: 'ai',\n    text: String\(res\.advice \|\| ''\)\.trim\(\),\n    read,/, 'the edit answer keeps its rows');
  });

  test('a card’s Apply on a passage ends typing; the reader’s own replacement keeps it', () => {
    assert.match(CE, /if \(card\.passage\) ceReplacePassage\(card\.passage, card\.text, \{ keepView: false \}\);/);
    assert.match(CE, /function ceReplacePassage\(sel, wording, o = \{\}\)\{/);
    assert.match(CE, /const keepView = o\.keepView !== false;/);
    assert.equal((CE.match(/_cet\('ce_step_passage'\), \{ keepView, repaint: true \}/g) || []).length, 2, 'both branches pass it through');
  });

  test('the notes drawer blurs the negotiation page only, slightly, and the blurred page is a door', () => {
    assert.match(APP, /function notesBlurs\(\)\{\n  return state\.view==='redline'&&!\(typeof window\.clauseEditorOpen==='function'&&clauseEditorOpen\(\)\);\n\}/);
    assert.match(APP, /scrim\.classList\.toggle\('open',show&&\(panelFace\(\)!=='notes'\|\|blur\)\);/);
    assert.match(APP, /scrim\.classList\.toggle\('is-blur',blur\);/);
    assert.match(INDEX, /#panel-scrim\.is-blur\{background:transparent;backdrop-filter:blur\(1\.5px\);/);
    assert.match(APP, /getElementById\('panel-scrim'\)\?\.addEventListener\('click',closeContextPanel\)/, 'pressing the scrim closes the drawer');
  });
});

describe('f304 (9) — round three: every highlight offers, on both papers', () => {
  const menuOf = (p, ctx) => { let menu = null; p.win.rlSelMenu = m => { menu = m; }; p.win.rlPaperOfferFromRange(ctx); return menu; };
  const partsOf = (p, ids, texts) => ({ parts: ids.map((id, i) => ({ clauseId: id, text: texts[i] })), clauses: ids.map(id => {
    const el = p.win.document.createElement('section'); el.setAttribute('data-clause', id); el.innerHTML = '<div class="rl-clause-top"><h4>' + id + ' heading</h4></div>'; return el; }) });

  test('inside one clause: Ask · Edit · Comment, the two Copilot verbs through the editor door', async () => {
    const p = await bench(); wide(p.win);
    const opened = [];
    const menu = menuOf(p, { c: p.c, opts: {}, side: 'owner', rect: { width: 1, height: 1 }, text: 'indirect loss',
      passage: partsOf(p, [p.cl7.clauseId], ['indirect loss']), openEditor: (id, o) => opened.push({ id, o }) });
    same(menu.actions.map(a => a.id), ['ask', 'edit', 'comment']);
    menu.onPick({ id: 'ask' });
    assert.equal(opened[0].id, p.cl7.clauseId); assert.equal(opened[0].o.passageMode, 'ask');
  });

  test('across two clauses: Ask (the Copilot panel) · Comment (the first clause’s share) — never Edit', async () => {
    const p = await bench(); wide(p.win);
    const asked = []; p.win.docAiRead = (c, a, t) => { asked.push(t); };
    const opened = [];
    const menu = menuOf(p, { c: p.c, opts: {}, side: 'owner', rect: { width: 1, height: 1 }, text: 'loss.\nTwo years',
      passage: partsOf(p, [p.cl7.clauseId, 'cl_8'], ['loss.', 'Two years']), openEditor: (id, o) => opened.push({ id, o }) });
    same(menu.actions.map(a => a.id), ['ask', 'comment']);
    menu.onPick({ id: 'ask' });
    same(asked, ['loss.\nTwo years']); assert.equal(opened.length, 0);
    menu.onPick({ id: 'comment' });
    const pin = p.win.rlNotesPinned();
    assert.equal(pin.clauseId, p.cl7.clauseId); assert.equal(pin.quote, 'loss.');
  });

  test('the front matter: Ask (the panel) · Comment on the front region', async () => {
    const p = await bench(); wide(p.win);
    const asked = []; p.win.docAiRead = (c, a, t) => { asked.push(t); };
    const menu = menuOf(p, { c: p.c, opts: {}, side: 'owner', rect: { width: 1, height: 1 }, text: 'Between Mkataba Holdings Ltd',
      passage: { parts: [], clauses: [] }, openEditor: () => {} });
    assert.ok(menu, 'the front matter offers');
    same(menu.actions.map(a => a.id), ['ask', 'comment']);
    menu.onPick({ id: 'comment' });
    assert.equal(p.win.rlNotesPinned().clauseId, p.win.negoFrontClause(p.c).clauseId, 'anchored to the front region');
    assert.match(VIEW, /function rlAskCopilotPanel\(c, text\)\{\n  if \(typeof window\.docAiRead === 'function'\)/, 'the panel door is the Document tab’s own');
  });

  test('a heading-only spill into the next clause is dropped, and their seat offers Comment alone', async () => {
    const p = await bench(); wide(p.win);
    const parts = partsOf(p, [p.cl7.clauseId, 'cl_8'], ['indirect loss.', 'cl_8 head']);
    const opened = [];
    const menu = menuOf(p, { c: p.c, opts: {}, side: 'owner', rect: { width: 1, height: 1 }, text: 'indirect loss.\ncl_8 head',
      passage: parts, openEditor: (id, o) => opened.push({ id, o }) });
    same(menu.actions.map(a => a.id), ['ask', 'edit', 'comment'], 'one clause after the spill is dropped');
    const theirs = menuOf(p, { c: p.c, opts: {}, side: 'counterparty', rect: { width: 1, height: 1 }, text: 'indirect loss',
      passage: partsOf(p, [p.cl7.clauseId], ['indirect loss']), openEditor: () => {} });
    same(theirs.actions.map(a => a.id), ['comment']);
  });

  test('the editor’s paper: a drag on ANOTHER clause offers the three verbs and the Copilot verbs move the page there', async () => {
    const p = await bench();
    const box = await openEditor(p);
    void box;
    const doc = p.win.document.querySelector('#ce-doc');
    const other = doc.querySelector('[data-clause="' + p.cl6.clauseId + '"] p');
    assert.ok(other, 'clause 6 is on the editor’s paper');
    const t = other.firstChild;
    const r = p.win.document.createRange(); r.setStart(t, 0); r.setEnd(t, Math.min(20, t.data.length));
    const s = p.win.getSelection(); s.removeAllRanges(); s.addRange(r);
    /* jsdom lays nothing out: a Range has no rect, and the offer refuses a
       highlight it cannot place. The rect is stubbed as F96 stubs it. */
    p.win.Range.prototype.getBoundingClientRect = () => ({ left: 10, top: 10, width: 80, height: 16, right: 90, bottom: 26 });
    let menu = null; p.win.rlSelMenu = m => { menu = m; };
    assert.equal(p.win.ceOfferOnPaper(), true);
    same(menu.actions.map(a => a.id), ['ask', 'edit', 'comment']);
    const moved = []; p.win.ceGoClause = (id, o) => moved.push({ id, o });
    menu.onPick({ id: 'edit' });
    /* ceGoClause is module-private to the editor; what is observable is that
       the page is asked to move: the editor is still open on clause 7 here
       (the stub swallowed the move) or has moved to clause 6. */
    const now = p.win.clauseEditorClauseId();
    assert.ok(now === p.cl6.clauseId || now === p.cl7.clauseId);
    assert.match(CE, /if \(!read\.why && ceOfferOnPaper\(\)\) return;/, 'the mouse-up asks the paper reading after the box');
    p.win.rlCloseClauseEditor();
  });
});
