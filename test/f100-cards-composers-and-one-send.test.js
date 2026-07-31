/* ============================================================
   F100 — three things a person doing the work kept hitting
   ============================================================
   All three reported from a real session, and all three the same shape: the
   product asking for something it already had, or showing something twice.

     · THE SEND DIALOG CAME BACK ON EVERY CHANGE. "What you are sending" is not
       a confirmation step — it is the form that collects the counterparty's
       address, and #nego-send has always taken a one-press route once a contact
       exists. Nothing ever wrote that contact. So the address was asked for,
       used, and forgotten, and the next Send re-opened the whole dialog to
       re-ask a question answered on the first round.

     · THE CARD CARRIED THE REDLINE. Clamped to two lines, beside a document
       pane already showing the same wording in full — the lesser copy, cut
       mid-sentence and stripped of its clause. The card is a HANDLE now: who
       asked, on what, where it stands, and the verbs. It is open while there is
       something on it for you to press, and a line when there is not, and
       pressing it takes you to the wording it stands for.

     · EVERY MESSAGE BOX WAS ONE LINE. <input type="text">, so past a dozen
       words the start of your own sentence scrolled out of view — on a reply to
       a counterparty, on a thread starter, on a question to the Copilot. You
       could not re-read what you were about to send. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld, supplyContract } = require('./world');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* js/components.js on a bare stage: the chat-field helpers are pure enough to
   drive with a hand-rolled element, which is the honest way to test a rule
   about heights without pretending jsdom lays anything out. */
function loadComponents(){
  const sandbox = { console, JSON, Object, String, Number, Array, Boolean, Math, Error, RegExp,
    setTimeout, document: { querySelectorAll: () => [] },
    /* chatFieldWire reads max-height off the computed style once, to cache the
       cap the stylesheet sets. On this bare stage there is no stylesheet. */
    getComputedStyle: () => ({ maxHeight: '' }) };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('js/components.js'), sandbox, { filename: 'components.js' });
  return sandbox;
}
/* A textarea double: enough of one for the grow rule, and no more. `visible`
   is the whole point of the hidden-field case — a display:none subtree reports
   scrollHeight 0, and a helper that trusts it writes a zero-height box. */
function fakeField(scrollHeight, max){
  return { style: { height: '' }, dataset: max ? { chatMax: String(max) } : {},
    get scrollHeight(){ return scrollHeight; },
    addEventListener(){}, value: 'x' };
}

/* ============================================================ */
describe('F100a — the address the dialog collected is kept', () => {
  /* js/core.js on a DOM stage — the share rules live there, and this is the
     loader every other core test uses. */
  const core = () => loadViews(['js/core.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });

  test('THE FIX: a first share records where this contract goes', () => {
    const win = core();
    const c = { id: 'MK-1', counterparty: 'Kabras Sugar' };
    assert.equal(win.shareRememberRecipient(c, { email: 'erik@kabras.co.ke', name: 'Erik' }), true);
    assert.equal(c.counterpartyEmail, 'erik@kabras.co.ke');
    assert.equal(c.counterpartyName, 'Erik');
  });

  test('and that is what turns the next Send into one press', () => {
    /* counterpartyContact is what #nego-send reads. Before the fix it had
       nothing to read: the share cache is only ever filled by the contract
       page's own shares section, so on the workbench it is empty, and the
       contract carried no address either. */
    const win = core();
    const c = { id: 'MK-1', counterparty: 'Kabras Sugar' };
    assert.equal(win.counterpartyContact(c, []), null, 'this is the state that re-opened the dialog');
    win.shareRememberRecipient(c, { email: 'erik@kabras.co.ke', name: 'Erik' });
    const contact = win.counterpartyContact(c, []);
    assert.ok(contact && contact.email === 'erik@kabras.co.ke',
      'with an address on record the send has somewhere to go, and asks nothing');
  });

  test('the first recipient wins — a later one-off does not redirect the round', () => {
    const win = core();
    const c = { id: 'MK-1', counterpartyEmail: 'erik@kabras.co.ke' };
    assert.equal(win.shareRememberRecipient(c, { email: 'counsel@firm.co.ke' }), false);
    assert.equal(c.counterpartyEmail, 'erik@kabras.co.ke',
      'a copy to counsel must not silently become where the next round goes');
  });

  test('a signing link records nobody', () => {
    /* It goes to whoever signs, who need not be the person the contract is
       being argued with. */
    const win = core();
    const c = { id: 'MK-1' };
    assert.equal(win.shareRememberRecipient(c, { purpose: 'sign', email: 'director@kabras.co.ke' }), false);
    assert.equal(c.counterpartyEmail, undefined);
  });

  test('and an empty address is not an address', () => {
    const win = core();
    const c = { id: 'MK-1' };
    assert.equal(win.shareRememberRecipient(c, { email: '   ' }), false);
    assert.equal(win.shareRememberRecipient(c, {}), false);
  });

  test('both send paths route through the one rule', () => {
    /* Server mode and static mode each finish a share their own way. Two copies
       of "remember this address" would drift, and the one that drifted would
       silently bring the dialog back on that path only. */
    const src = read('js/core.js');
    assert.equal((src.match(/shareRememberRecipient\(c, \{ purpose:payloadObj\.purpose/g) || []).length, 2);
  });
});

/* ============================================================ */
describe('F100b — the card is a handle, not a copy', () => {
  /* Same mount as F93's: the real workbench over the shared supply fixture,
     with one ask of our own on the table. */
  async function page(){
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    win.promptDialog = async () => '';
    win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
    win.copilotAvailable = () => false;
    win.openShareModal = () => {};
    win.counterpartyContact = () => null;
    win.reshareToLastRecipient = async () => ({ delivered: true });
    win.cachedShares = () => [];
    const c = supplyContract();
    win.negoInit(c);
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'forty-five (45) days'),
      { side: 'owner', author: 'Young Mbagaya' });
    win.rlSetCardFilter('all');
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
    win.getContract = id => (id === c.id ? c : null);
    win.renderRedline();
    const $ = s => win.document.querySelector(s);
    const $$ = s => [...win.document.querySelectorAll(s)];
    return { w, win, c, $, $$, again: () => win.renderRedline() };
  }

  test('THE FIX: no card carries a copy of the wording', async () => {
    const p = await page();
    assert.ok(p.$$('#rl-changes .rl-card').length, 'there is a card to look at');
    assert.equal(p.$('#rl-changes .rl-card-diff'), null);
    assert.ok(!p.$('#rl-changes .rl-card').textContent.includes('forty-five'),
      'the proposed wording belongs to the document, and to one place only');
  });

  test('the document still carries it, so nothing was lost with the copy', async () => {
    const p = await page();
    assert.ok(p.$$('#rl-doc ins, #rl-doc del').length,
      'the redline moved out of the card, it did not go');
  });

  test('a draft is open, because it has verbs to press', async () => {
    const p = await page();
    const card = p.$('#rl-changes .rl-card');
    assert.equal(card.getAttribute('data-rl-open'), '1');
    assert.ok(card.querySelector('[data-rl-send]'), 'Send is in reach');
    assert.ok(card.querySelector('[data-rl-caret]'), 'and the caret says it can fold');
  });

  test('once sent it folds to the head, and the head still says so', async () => {
    const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    const card = p.$('#rl-changes .rl-card');
    assert.equal(card.getAttribute('data-rl-open'), '0');
    assert.equal(card.querySelector('.rl-card-verbs'), null);
    assert.match(card.querySelector('.rl-badge').textContent.trim(), /^Sent$/,
      'the fact lives on the part that never folds');
    assert.ok(card.querySelector('.rl-card-meta'), 'and so does the clause it is on');
  });

  test('pressing a folded card opens it AND takes you to the change', async () => {
    const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    p.$('#rl-changes .rl-card').click();
    p.again();
    const card = p.$('#rl-changes .rl-card');
    assert.equal(card.getAttribute('data-rl-open'), '1', 'one press, not two');
    assert.ok(card.querySelector('button.rl-sent'), 'the amber Sent is back where the Send was');
  });

  test('the caret is what folds it again, and it does not drag the document', async () => {
    /* Its own control precisely because the CARD's press means "take me to this
       change". A reader tidying a column must not be scrolled somewhere for it. */
    const p = await page();
    const card = p.$('#rl-changes .rl-card');
    assert.equal(card.getAttribute('data-rl-open'), '1');
    card.querySelector('[data-rl-caret]').click();
    p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0');
  });

  test('a hand-closed card stays closed through a repaint', async () => {
    const p = await page();
    p.$('#rl-changes [data-rl-caret]').click();
    p.again(); p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0',
      'a preference the next paint forgets is not a preference');
  });

  /* ---------- the follow-up defect, reported from a live session ----------
     "After send the cards are not collapsing." They were. What had happened is
     that the reader pressed the sent card to check it had gone — the most
     natural move there is — and the open/shut choice was remembered against the
     ID, forever. So that card never folded again, through every later state
     change, and the feature read as broken.

     The mirror is the one that matters: a card SHUT by hand while it was your
     draft stayed shut when the counterparty answered and it came back carrying
     Accept and Reject. Live controls on a decision waiting on you, hidden
     behind a preference expressed about something else entirely. */
  test('THE FIX: a peek at a sent card does not outlive that state', () => {
    const w = buildWorld({ negotiationView: true });
    const { rlCardIsOpen, rlCardSetOpen, rlCardStateKey } = w.win;
    const SENT = ['<button data-rl-edit="c1">Edit</button>',
      '<button data-rl-sent="CHG-1" disabled>Sent</button>'];
    const DRAFT = ['<button data-rl-edit="c1">Edit</button>',
      '<button data-rl-retract="CHG-1">Retract</button>',
      '<button data-rl-send="CHG-1">Send</button>'];
    const ch = { id: 'CHG-1' };

    assert.equal(rlCardIsOpen(ch, SENT), false, 'a sent ask folds');
    rlCardSetOpen('CHG-1', true, rlCardStateKey(SENT));      // the peek
    assert.equal(rlCardIsOpen(ch, SENT), true, 'and stays open while it is that card');
    /* THE PROOF that it lapsed rather than merely happening to agree: shut it
       while it is a draft, and the sent state — where the reader had asked for
       OPEN — is no longer governed by that older choice either. One card holds
       one choice, tied to the state it was made in; a stack of remembered
       choices per state would surprise a reader months later. */
    rlCardSetOpen('CHG-1', false, rlCardStateKey(DRAFT));
    assert.equal(rlCardIsOpen(ch, DRAFT), false, 'the new choice holds while that state does');
    assert.equal(rlCardIsOpen(ch, SENT), false,
      'and the sent state is back on the rule, which folds it');
  });

  test('and a card shut by hand re-opens when it starts needing you', () => {
    /* The dangerous direction. Accept and Reject must never be behind a
       preference the reader expressed about a different card state. */
    const w = buildWorld({ negotiationView: true });
    const { rlCardIsOpen, rlCardSetOpen, rlCardStateKey } = w.win;
    const MINE = ['<button data-rl-edit="c1">Edit</button>',
      '<button data-rl-retract="CHG-9">Retract</button>',
      '<button data-rl-send="CHG-9">Send</button>'];
    const THEIRS = ['<button data-nego-accept="CHG-9">Accept</button>',
      '<button data-nego-reject="CHG-9">Reject</button>',
      '<button data-rl-edit="c1">Edit</button>'];
    const ch = { id: 'CHG-9' };
    rlCardSetOpen('CHG-9', false, rlCardStateKey(MINE));
    assert.equal(rlCardIsOpen(ch, MINE), false, 'shut, as asked');
    assert.equal(rlCardIsOpen(ch, THEIRS), true,
      'THE FIX: a decision waiting on you is never hidden by a stale choice');
  });

  test('the state key is the actions on offer, not the ids inside them', () => {
    /* A clause renamed under a card, or a change re-parented, must not read as
       "this is a different card now" and throw the reader's choice away. */
    const { rlCardStateKey } = buildWorld({ negotiationView: true }).win;
    assert.equal(
      rlCardStateKey(['<button data-rl-edit="clause-1" data-rl-edit-change="CHG-1">Edit</button>']),
      rlCardStateKey(['<button data-rl-edit="clause-7" data-rl-edit-change="CHG-1">Edit</button>']));
    assert.notEqual(
      rlCardStateKey(['<button data-rl-send="CHG-1">Send</button>']),
      rlCardStateKey(['<button data-rl-sent="CHG-1">Sent</button>']));
    assert.equal(rlCardStateKey([]), '');
  });

  test('the card carries the state its choice is measured against', async () => {
    const p = await page();
    const card = p.$('#rl-changes .rl-card');
    assert.ok(card.getAttribute('data-rl-state'),
      'without it the click handler has nothing to record the choice against');
    assert.match(card.getAttribute('data-rl-state'), /data-rl-send/,
      'a draft names its own verbs');
  });

  test('the reported sequence, end to end', async () => {
    /* send → folds → peek → open → caret → folds again. The step that was
       broken is the third: before the fix the peek was remembered against the
       id alone, so the card never folded again for the rest of the session and
       the whole feature read as "the cards are not collapsing". */
    const p = await page();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0', 'folds on send');

    p.$('#rl-changes .rl-card').click();
    p.again();
    const open = p.$('#rl-changes .rl-card');
    assert.equal(open.getAttribute('data-rl-open'), '1', 'a peek opens it');
    assert.match(open.getAttribute('data-rl-state'), /data-rl-sent/,
      'and the choice is recorded against the state it was made in');

    p.$('#rl-changes [data-rl-caret]').click();
    p.again();
    assert.equal(p.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0',
      'and the caret puts it back');
  });

  test('the rule is read off the verbs, not off a list of statuses', () => {
    /* Two copies of "is there anything to do here" would disagree the first
       time either moved — and the card that lost would hide a live control. */
    const w = buildWorld({ negotiationView: true });
    assert.equal(w.win.rlCardNeedsYou(['<button data-rl-send="X">Send</button>']), true);
    assert.equal(w.win.rlCardNeedsYou(['<button data-nego-undo="X">Undo</button>']), true);
    assert.equal(w.win.rlCardNeedsYou([
      '<button data-rl-edit="X">Edit</button>',
      '<button data-rl-sent="X" disabled>Sent</button>']), false,
      'Edit navigates and Sent is a label — neither is a move waiting on you');
    assert.equal(w.win.rlCardNeedsYou([]), false);
  });
});

/* ============================================================ */
describe('F100c — a message box you can read back', () => {
  test('THE FIX: every composer in the product is a wrapping textarea', () => {
    const boxes = [
      ['index.html', /<textarea id="ai-input"[^>]*class="chat-field/, 'the Copilot'],
      ['js/views/negotiation.js', /<textarea class="chat-field"[^>]*id="nego-ti-\$\{_ne\(ch\.id\)\}"[^>]*placeholder="Reply on this change/, 'reply on a change'],
      ['js/views/negotiation.js', /<textarea class="chat-field"[^>]*placeholder="Start a thread/, 'start a thread'],
      ['js/discuss.js', /<textarea data-point-body[^>]*class="chat-field"/, 'reply on a point'],
      ['js/views/contract.js', /<textarea id="comment-input" class="chat-field"/, 'comment on the terms'],
      ['js/views/portal.js', /<textarea data-cl-note[^>]*class="chat-field"/, 'the counterparty\'s clause note'],
    ];
    for (const [file, re, what] of boxes)
      assert.match(read(file), re, `${what} is still a one-line input`);
  });

  test('and none of them is an <input type="text"> any more', () => {
    assert.doesNotMatch(read('index.html'), /<input id="ai-input"/);
    assert.doesNotMatch(read('js/views/negotiation.js'), /<input type="text" id="nego-ti-/);
    assert.doesNotMatch(read('js/discuss.js'), /<input data-point-body[^>]*type="text"/);
  });

  test('the style wraps rather than scrolling sideways, and stops growing', () => {
    for (const f of ['index.html', 'js/views/negotiation.js']){
      const css = read(f);
      assert.match(css, /textarea\.chat-field\{[^}]*white-space:pre-wrap/, `${f}: it must wrap`);
      assert.match(css, /textarea\.chat-field\{[^}]*max-height:/,
        `${f}: a composer that grows without limit pushes its own send button off the panel`);
      assert.match(css, /textarea\.chat-field\{[^}]*resize:none/);
    }
  });

  test('Enter sends and Shift+Enter breaks the line', () => {
    const w = loadComponents();
    const ev = o => Object.assign({ preventDefault(){} }, o);
    assert.equal(w.chatFieldSubmits(ev({ key: 'Enter' })), true);
    assert.equal(w.chatFieldSubmits(ev({ key: 'Enter', shiftKey: true })), false);
    assert.equal(w.chatFieldSubmits(ev({ key: 'a' })), false);
    assert.equal(w.chatFieldSubmits(null), false);
  });

  test('and a keystroke mid-composition is not a send', () => {
    /* Enter commits the candidate word in an IME. Treating that as "send"
       posts a half-typed message, in the languages least able to spot it. */
    const w = loadComponents();
    const ev = o => Object.assign({ preventDefault(){} }, o);
    assert.equal(w.chatFieldSubmits(ev({ key: 'Enter', isComposing: true })), false);
    assert.equal(w.chatFieldSubmits(ev({ key: 'Enter', keyCode: 229 })), false);
  });

  test('Enter is prevented when it sends, and left alone when it does not', () => {
    const w = loadComponents();
    let stopped = 0;
    w.chatFieldSubmits({ key: 'Enter', preventDefault(){ stopped++; } });
    w.chatFieldSubmits({ key: 'Enter', shiftKey: true, preventDefault(){ stopped++; } });
    assert.equal(stopped, 1, 'a prevented Shift+Enter would eat the newline it is for');
  });

  test('the box grows to fit, and no further than its cap', () => {
    const w = loadComponents();
    const small = fakeField(48, 120); w.chatFieldGrow(small);
    assert.equal(small.style.height, '48px');
    const big = fakeField(400, 120); w.chatFieldGrow(big);
    assert.equal(big.style.height, '120px', 'past the cap it scrolls instead of growing');
  });

  test('a field nobody can see is left alone rather than measured as zero', () => {
    /* The sidebar has two faces and mounts one at a time, so the composers on
       the other sit in a display:none subtree where scrollHeight reads 0.
       Writing that would leave a zero-height box the moment it was shown. */
    const w = loadComponents();
    const hidden = fakeField(0, 120);
    w.chatFieldGrow(hidden);
    assert.equal(hidden.style.height, 'auto', 'left to the stylesheet until it can be measured');
  });

  test('sending puts it back to one line', () => {
    const w = loadComponents();
    const el = fakeField(90, 120); el.value = 'a long reply';
    w.chatFieldReset(el);
    assert.equal(el.value, '', 'the next reply is not typed into the hole the last one grew to');
  });

  test('wiring twice does not double the growth', () => {
    /* These panels repaint constantly. A field wired on every paint would grow
       once per handler per keystroke. */
    const w = loadComponents();
    let bound = 0;
    const el = { style: { height: '' }, dataset: {}, scrollHeight: 40, value: '',
      addEventListener(){ bound++; } };
    const scope = { querySelectorAll: () => [el] };
    w.chatFieldWire(scope); w.chatFieldWire(scope); w.chatFieldWire(scope);
    assert.equal(bound, 2, 'input and paste, once each, however many paints happen');
  });
});
